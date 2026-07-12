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

// ── Smart Dispatch Assistant ─────────────────────────────────────────────────
// GET /trips/recommend?cargoWeightKg=500
// Returns the best available vehicle and driver via a weighted scoring algorithm.
router.get('/recommend', verifyToken, async (req, res) => {
  const cargoWeightKg = parseFloat(req.query.cargoWeightKg as string) || 0;
  const today = new Date();

  // ── Fetch all available vehicles with fuel history ──────────────────────────
  const vehicles = await prisma.vehicle.findMany({
    where: { status: 'Available' },
    include: {
      fuelLogs: { orderBy: { date: 'desc' }, take: 10 },
      trips: { where: { status: 'Completed' }, select: { plannedDistanceKm: true, fuelConsumed: true } }
    }
  });

  // ── Fetch all eligible drivers with recent trip load ─────────────────────────
  const drivers = await prisma.driver.findMany({
    where: { status: 'Available', licenseExpiryDate: { gt: today } },
    include: {
      trips: {
        where: { status: { in: ['Draft', 'Dispatched'] } },
        select: { id: true }
      }
    }
  });

  if (vehicles.length === 0 && drivers.length === 0) {
    return res.json({ vehicle: null, driver: null, message: 'No available vehicles or drivers.' });
  }

  // ── Score vehicles ────────────────────────────────────────────────────────────
  // Weights: capacity-fit(35) + fuel-efficiency(35) + odometer-health(30)
  const scoredVehicles = vehicles.map(v => {
    const reasons: string[] = ['Available'];
    let score = 0;

    // Capacity fit — must be sufficient; bonus for tight fit (less wasted capacity)
    const capacityFit = v.maxLoadCapacityKg >= cargoWeightKg;
    if (!capacityFit && cargoWeightKg > 0) {
      score -= 1000; // hard penalty — disqualify under-capacity vehicles
      reasons.push('⚠ Capacity insufficient');
    } else {
      score += 35;
      if (cargoWeightKg > 0) {
        const utilisation = cargoWeightKg / v.maxLoadCapacityKg;
        score += Math.round(utilisation * 10); // bonus for good load utilisation
      }
      reasons.push('Capacity sufficient');
    }

    // Fuel efficiency — compute avg km/L from completed trip history
    const completedWithFuel = v.trips.filter(t => t.fuelConsumed && t.fuelConsumed > 0 && t.plannedDistanceKm > 0);
    if (completedWithFuel.length > 0) {
      const avgKmPerL = completedWithFuel.reduce((sum, t) => sum + t.plannedDistanceKm / (t.fuelConsumed!), 0) / completedWithFuel.length;
      score += Math.min(35, Math.round(avgKmPerL * 3)); // cap at 35 pts
      reasons.push(`${avgKmPerL.toFixed(1)} km/L avg efficiency`);
    } else {
      score += 20; // neutral score for new vehicles
      reasons.push('Fuel history not yet available');
    }

    // Odometer health — lower odometer = better vehicle condition
    const maxOdometer = 200000;
    const odometerScore = Math.max(0, 30 - Math.round((v.odometer / maxOdometer) * 30));
    score += odometerScore;
    if (v.odometer < 50000) reasons.push('Low mileage');

    return { vehicle: v, score, reasons };
  });

  scoredVehicles.sort((a, b) => b.score - a.score);
  const bestVehicleEntry = scoredVehicles[0];

  // ── Score drivers ─────────────────────────────────────────────────────────────
  // Weights: safety-score(40) + license-validity(30) + low-workload(30)
  const scoredDrivers = drivers.map(d => {
    const reasons: string[] = ['Available', 'License valid'];
    let score = 0;

    // Safety score (0–100 scale)
    score += Math.round((d.safetyScore / 100) * 40);
    if (d.safetyScore >= 90) reasons.push(`Safety score ${d.safetyScore.toFixed(0)}/100 (Excellent)`);
    else if (d.safetyScore >= 75) reasons.push(`Safety score ${d.safetyScore.toFixed(0)}/100 (Good)`);
    else reasons.push(`Safety score ${d.safetyScore.toFixed(0)}/100`);

    // License validity — bonus for licenses far from expiry
    const daysUntilExpiry = Math.floor((new Date(d.licenseExpiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry > 365) { score += 30; reasons.push('License valid > 1 year'); }
    else if (daysUntilExpiry > 90) { score += 20; reasons.push(`License valid ${daysUntilExpiry}d`); }
    else { score += 5; reasons.push(`License expires soon (${daysUntilExpiry}d)`); }

    // Workload — fewer active trips = lower workload = better
    const activeTrips = d.trips.length;
    if (activeTrips === 0) { score += 30; reasons.push('Lowest workload'); }
    else { score += Math.max(0, 30 - activeTrips * 10); reasons.push(`${activeTrips} active trip(s)`); }

    return { driver: d, score, reasons };
  });

  scoredDrivers.sort((a, b) => b.score - a.score);
  const bestDriverEntry = scoredDrivers[0];

  return res.json({
    vehicle: bestVehicleEntry ? {
      id: bestVehicleEntry.vehicle.id,
      registrationNumber: bestVehicleEntry.vehicle.registrationNumber,
      nameModel: bestVehicleEntry.vehicle.nameModel,
      maxLoadCapacityKg: bestVehicleEntry.vehicle.maxLoadCapacityKg,
      score: bestVehicleEntry.score,
      reasons: bestVehicleEntry.reasons,
    } : null,
    driver: bestDriverEntry ? {
      id: bestDriverEntry.driver.id,
      name: bestDriverEntry.driver.name,
      licenseNumber: bestDriverEntry.driver.licenseNumber,
      safetyScore: bestDriverEntry.driver.safetyScore,
      score: bestDriverEntry.score,
      reasons: bestDriverEntry.reasons,
    } : null,
    allVehicleCount: vehicles.length,
    allDriverCount: drivers.length,
  });
});
// ── End Smart Dispatch Assistant ──────────────────────────────────────────────

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
