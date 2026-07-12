import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();
const prisma = new PrismaClient();

async function generateTripCode(): Promise<string> {
  const count = await prisma.trip.count();
  return `TR${String(count + 1).padStart(3, '0')}`;
}

router.get('/', verifyToken, async (req, res) => {
  const { status } = req.query;
  const where: Record<string, unknown> = {};
  if (status && status !== 'All') where.status = status;

  const trips = await prisma.trip.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      vehicle: { select: { registrationNumber: true, nameModel: true, type: true } },
      driver: { select: { name: true, licenseNumber: true } }
    }
  });
  return res.json(trips);
});

router.get('/:id', verifyToken, async (req, res) => {
  const trip = await prisma.trip.findUnique({
    where: { id: req.params.id },
    include: { vehicle: true, driver: true, expenses: true }
  });
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  return res.json(trip);
});

router.post('/', verifyToken, requireRole('Dispatcher'), async (req, res) => {
  const { source, destination, vehicleId, driverId, cargoWeightKg, plannedDistanceKm, eta, notes } = req.body;

  if (!source || !destination || !vehicleId || !driverId || !cargoWeightKg || !plannedDistanceKm) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  if (vehicle.status !== 'Available') {
    return res.status(400).json({ error: `Vehicle is not available (current status: ${vehicle.status})` });
  }

  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) return res.status(404).json({ error: 'Driver not found' });
  if (driver.status !== 'Available') {
    return res.status(400).json({ error: `Driver is not available (current status: ${driver.status})` });
  }
  if (new Date(driver.licenseExpiryDate) < new Date()) {
    return res.status(400).json({ error: 'Driver has an expired license' });
  }

  const tripCode = await generateTripCode();

  const trip = await prisma.trip.create({
    data: {
      tripCode,
      source,
      destination,
      vehicleId,
      driverId,
      cargoWeightKg: parseFloat(cargoWeightKg),
      plannedDistanceKm: parseFloat(plannedDistanceKm),
      status: 'Draft',
      eta: eta || null,
      notes: notes || null,
    },
    include: { vehicle: true, driver: true }
  });

  return res.status(201).json(trip);
});

router.post('/:id/dispatch', verifyToken, requireRole('Dispatcher'), async (req, res) => {
  const trip = await prisma.trip.findUnique({
    where: { id: req.params.id },
    include: { vehicle: true, driver: true }
  });

  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (trip.status !== 'Draft') {
    return res.status(400).json({ error: 'Only Draft trips can be dispatched' });
  }

  if (trip.cargoWeightKg > trip.vehicle.maxLoadCapacityKg) {
    const excess = trip.cargoWeightKg - trip.vehicle.maxLoadCapacityKg;
    return res.status(400).json({
      error: `Capacity exceeded`,
      details: {
        vehicleCapacity: trip.vehicle.maxLoadCapacityKg,
        cargoWeight: trip.cargoWeightKg,
        excessBy: excess,
        message: `Vehicle Capacity: ${trip.vehicle.maxLoadCapacityKg} kg / Cargo Weight: ${trip.cargoWeightKg} kg / Capacity exceeded by ${excess} kg — dispatch blocked`
      }
    });
  }

  if (trip.vehicle.status !== 'Available') {
    return res.status(400).json({ error: `Vehicle is not available (status: ${trip.vehicle.status})` });
  }
  if (trip.driver.status !== 'Available') {
    return res.status(400).json({ error: `Driver is not available (status: ${trip.driver.status})` });
  }
  if (new Date(trip.driver.licenseExpiryDate) < new Date()) {
    return res.status(400).json({ error: 'Driver license has expired' });
  }

  const [updatedTrip] = await prisma.$transaction([
    prisma.trip.update({
      where: { id: req.params.id },
      data: { status: 'Dispatched', dispatchedAt: new Date() },
      include: { vehicle: true, driver: true }
    }),
    prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'OnTrip' } }),
    prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'OnTrip' } }),
  ]);

  return res.json(updatedTrip);
});

router.post('/:id/complete', verifyToken, requireRole('Dispatcher'), async (req, res) => {
  const { finalOdometer, fuelConsumed, toll, otherExpenses } = req.body;

  if (!finalOdometer || !fuelConsumed) {
    return res.status(400).json({ error: 'Final odometer and fuel consumed are required' });
  }

  const trip = await prisma.trip.findUnique({
    where: { id: req.params.id },
    include: { vehicle: true }
  });

  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (trip.status !== 'Dispatched') {
    return res.status(400).json({ error: 'Only Dispatched trips can be completed' });
  }

  const fuelCostPerLiter = 125;
  const fuelCost = parseFloat(fuelConsumed) * fuelCostPerLiter;
  const tollAmt = parseFloat(toll || '0');
  const otherAmt = parseFloat(otherExpenses || '0');
  const totalExpense = tollAmt + otherAmt;

  await prisma.$transaction([
    prisma.trip.update({
      where: { id: req.params.id },
      data: {
        status: 'Completed',
        completedAt: new Date(),
        finalOdometer: parseFloat(finalOdometer),
        fuelConsumed: parseFloat(fuelConsumed),
      }
    }),
    prisma.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: 'Available', odometer: parseFloat(finalOdometer) }
    }),
    prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'Available' } }),
    prisma.fuelLog.create({
      data: { vehicleId: trip.vehicleId, date: new Date(), liters: parseFloat(fuelConsumed), cost: fuelCost }
    }),
    prisma.expense.create({
      data: {
        tripId: trip.id,
        vehicleId: trip.vehicleId,
        toll: tollAmt,
        other: otherAmt,
        maintenanceLinkedCost: 0,
        total: totalExpense,
        status: 'Completed'
      }
    })
  ]);

  const updatedTrip = await prisma.trip.findUnique({
    where: { id: req.params.id },
    include: { vehicle: true, driver: true }
  });

  return res.json(updatedTrip);
});

router.post('/:id/cancel', verifyToken, requireRole('Dispatcher'), async (req, res) => {
  const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (!['Draft', 'Dispatched'].includes(trip.status)) {
    return res.status(400).json({ error: 'Only Draft or Dispatched trips can be cancelled' });
  }

  const updates: any[] = [
    prisma.trip.update({ where: { id: req.params.id }, data: { status: 'Cancelled' } })
  ];

  if (trip.status === 'Dispatched') {
    updates.push(prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'Available' } }));
    updates.push(prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'Available' } }));
  }

  await prisma.$transaction(updates);

  return res.json({ message: 'Trip cancelled successfully' });
});

export default router;
