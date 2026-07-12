import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();
const prisma = new PrismaClient();

router.get('/', verifyToken, async (req, res) => {
  const { type, status, search } = req.query;
  const where: Record<string, unknown> = {};
  if (type && type !== 'All') where.type = type;
  if (status && status !== 'All') where.status = status;
  if (search) where.registrationNumber = { contains: search as string };

  const vehicles = await prisma.vehicle.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { trips: true } } }
  });
  return res.json(vehicles);
});

router.get('/available', verifyToken, async (_req, res) => {
  const vehicles = await prisma.vehicle.findMany({
    where: { status: 'Available' },
    orderBy: { registrationNumber: 'asc' }
  });
  return res.json(vehicles);
});

router.get('/:id', verifyToken, async (req, res) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  return res.json(vehicle);
});

router.post('/', verifyToken, requireRole('FleetManager'), async (req, res) => {
  const { registrationNumber, nameModel, type, maxLoadCapacityKg, odometer, acquisitionCost } = req.body;

  if (!registrationNumber || !nameModel || !type || !maxLoadCapacityKg || !acquisitionCost) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const existing = await prisma.vehicle.findUnique({ where: { registrationNumber } });
  if (existing) {
    return res.status(409).json({ error: `Registration number "${registrationNumber}" already exists` });
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      registrationNumber,
      nameModel,
      type,
      maxLoadCapacityKg: parseFloat(maxLoadCapacityKg),
      odometer: parseFloat(odometer || 0),
      acquisitionCost: parseFloat(acquisitionCost),
      status: 'Available'
    }
  });
  return res.status(201).json(vehicle);
});

router.put('/:id', verifyToken, requireRole('FleetManager'), async (req, res) => {
  const { registrationNumber, nameModel, type, maxLoadCapacityKg, odometer, acquisitionCost, status } = req.body;

  if (registrationNumber) {
    const existing = await prisma.vehicle.findFirst({
      where: { registrationNumber, NOT: { id: req.params.id } }
    });
    if (existing) return res.status(409).json({ error: `Registration number "${registrationNumber}" already in use` });
  }

  const vehicle = await prisma.vehicle.update({
    where: { id: req.params.id },
    data: {
      ...(registrationNumber && { registrationNumber }),
      ...(nameModel && { nameModel }),
      ...(type && { type }),
      ...(maxLoadCapacityKg && { maxLoadCapacityKg: parseFloat(maxLoadCapacityKg) }),
      ...(odometer !== undefined && { odometer: parseFloat(odometer) }),
      ...(acquisitionCost && { acquisitionCost: parseFloat(acquisitionCost) }),
      ...(status && { status }),
    }
  });
  return res.json(vehicle);
});

router.delete('/:id', verifyToken, requireRole('FleetManager'), async (req, res) => {
  await prisma.vehicle.delete({ where: { id: req.params.id } });
  return res.json({ message: 'Vehicle deleted' });
});

export default router;
