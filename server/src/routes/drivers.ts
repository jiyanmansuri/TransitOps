import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();
const prisma = new PrismaClient();

router.get('/', verifyToken, async (req, res) => {
  const { status, search } = req.query;
  const where: Record<string, unknown> = {};
  if (status && status !== 'All') where.status = status;
  if (search) where.name = { contains: search as string };

  const drivers = await prisma.driver.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { trips: { select: { status: true } } }
  });

  const withRate = drivers.map(d => {
    const total = d.trips.length;
    const completed = d.trips.filter(t => t.status === 'Completed').length;
    return {
      ...d,
      trips: undefined,
      tripCompletionRate: total > 0 ? Math.round((completed / total) * 100) : 100
    };
  });

  return res.json(withRate);
});

router.get('/eligible', verifyToken, async (_req, res) => {
  const today = new Date();
  const drivers = await prisma.driver.findMany({
    where: {
      status: 'Available',
      licenseExpiryDate: { gt: today }
    },
    orderBy: { name: 'asc' }
  });
  return res.json(drivers);
});

router.get('/:id', verifyToken, async (req, res) => {
  const driver = await prisma.driver.findUnique({
    where: { id: req.params.id },
    include: { trips: { select: { status: true } } }
  });
  if (!driver) return res.status(404).json({ error: 'Driver not found' });
  return res.json(driver);
});

router.post('/', verifyToken, requireRole('FleetManager', 'SafetyOfficer'), async (req, res) => {
  const { name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber, safetyScore } = req.body;

  if (!name || !licenseNumber || !licenseCategory || !licenseExpiryDate || !contactNumber) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const existing = await prisma.driver.findUnique({ where: { licenseNumber } });
  if (existing) return res.status(409).json({ error: `License number "${licenseNumber}" already exists` });

  const driver = await prisma.driver.create({
    data: {
      name,
      licenseNumber,
      licenseCategory,
      licenseExpiryDate: new Date(licenseExpiryDate),
      contactNumber,
      safetyScore: parseFloat(safetyScore || '100'),
    }
  });
  return res.status(201).json(driver);
});

router.put('/:id', verifyToken, requireRole('FleetManager', 'SafetyOfficer'), async (req, res) => {
  const { name, licenseCategory, licenseExpiryDate, contactNumber, safetyScore, status } = req.body;

  const driver = await prisma.driver.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name }),
      ...(licenseCategory && { licenseCategory }),
      ...(licenseExpiryDate && { licenseExpiryDate: new Date(licenseExpiryDate) }),
      ...(contactNumber && { contactNumber }),
      ...(safetyScore !== undefined && { safetyScore: parseFloat(safetyScore) }),
      ...(status && { status }),
    }
  });
  return res.json(driver);
});

router.delete('/:id', verifyToken, requireRole('FleetManager'), async (req, res) => {
  await prisma.driver.delete({ where: { id: req.params.id } });
  return res.json({ message: 'Driver deleted' });
});

export default router;
