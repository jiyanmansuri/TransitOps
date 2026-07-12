import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();
const prisma = new PrismaClient();

router.get('/logs', verifyToken, async (_req, res) => {
  const logs = await prisma.fuelLog.findMany({
    orderBy: { date: 'desc' },
    include: { vehicle: { select: { registrationNumber: true, nameModel: true } } }
  });
  return res.json(logs);
});

router.post('/logs', verifyToken, requireRole('FinancialAnalyst', 'Dispatcher'), async (req, res) => {
  const { vehicleId, date, liters, cost } = req.body;
  if (!vehicleId || !date || !liters || !cost) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const log = await prisma.fuelLog.create({
    data: { vehicleId, date: new Date(date), liters: parseFloat(liters), cost: parseFloat(cost) },
    include: { vehicle: { select: { registrationNumber: true, nameModel: true } } }
  });
  return res.status(201).json(log);
});

router.delete('/logs/:id', verifyToken, requireRole('FinancialAnalyst'), async (req, res) => {
  await prisma.fuelLog.delete({ where: { id: req.params.id } });
  return res.json({ message: 'Fuel log deleted' });
});

router.get('/expenses', verifyToken, async (_req, res) => {
  const expenses = await prisma.expense.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      vehicle: { select: { registrationNumber: true, nameModel: true } },
      trip: { select: { tripCode: true, source: true, destination: true } }
    }
  });
  return res.json(expenses);
});

router.post('/expenses', verifyToken, requireRole('FinancialAnalyst'), async (req, res) => {
  const { tripId, vehicleId, toll, other, maintenanceLinkedCost } = req.body;
  if (!vehicleId) {
    return res.status(400).json({ error: 'Vehicle is required' });
  }
  const tollAmt = parseFloat(toll || '0');
  const otherAmt = parseFloat(other || '0');
  const maintAmt = parseFloat(maintenanceLinkedCost || '0');
  const total = tollAmt + otherAmt + maintAmt;

  const expense = await prisma.expense.create({
    data: {
      tripId: tripId || null,
      vehicleId,
      toll: tollAmt,
      other: otherAmt,
      maintenanceLinkedCost: maintAmt,
      total,
      status: 'Pending'
    },
    include: {
      vehicle: { select: { registrationNumber: true, nameModel: true } },
      trip: { select: { tripCode: true } }
    }
  });
  return res.status(201).json(expense);
});

router.get('/summary', verifyToken, async (_req, res) => {
  const [fuelAgg, maintAgg] = await Promise.all([
    prisma.fuelLog.aggregate({ _sum: { cost: true } }),
    prisma.maintenanceRecord.aggregate({ _sum: { cost: true } }),
  ]);
  const totalFuel = fuelAgg._sum.cost || 0;
  const totalMaint = maintAgg._sum.cost || 0;
  return res.json({
    totalFuelCost: totalFuel,
    totalMaintenanceCost: totalMaint,
    totalOperationalCost: totalFuel + totalMaint
  });
});

export default router;
