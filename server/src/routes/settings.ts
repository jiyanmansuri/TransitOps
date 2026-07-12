import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();
const prisma = new PrismaClient();

router.get('/', verifyToken, async (_req, res) => {
  let settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: 'singleton', depotName: 'Main Depot', currency: 'INR', distanceUnit: 'Kilometers' }
    });
  }
  return res.json(settings);
});

router.put('/', verifyToken, requireRole('FleetManager'), async (req, res) => {
  const { depotName, currency, distanceUnit } = req.body;
  const settings = await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {
      ...(depotName && { depotName }),
      ...(currency && { currency }),
      ...(distanceUnit && { distanceUnit }),
    },
    create: {
      id: 'singleton',
      depotName: depotName || 'Main Depot',
      currency: currency || 'INR',
      distanceUnit: distanceUnit || 'Kilometers',
    }
  });
  return res.json(settings);
});

export default router;
