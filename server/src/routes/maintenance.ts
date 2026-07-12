import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();
const prisma = new PrismaClient();

router.get('/', verifyToken, async (_req, res) => {
  const records = await prisma.maintenanceRecord.findMany({
    orderBy: { createdAt: 'desc' },
    include: { vehicle: { select: { registrationNumber: true, nameModel: true, status: true } } }
  });
  return res.json(records);
});

router.post('/', verifyToken, requireRole('FleetManager'), async (req, res) => {
  const { vehicleId, serviceType, cost, date, status, notes } = req.body;

  if (!vehicleId || !serviceType || !cost || !date) {
    return res.status(400).json({ error: 'Vehicle, service type, cost, and date are required' });
  }

  const maintenanceStatus = status || 'Active';

  try {
    const record = await prisma.$transaction(async (tx) => {
      const newRecord = await tx.maintenanceRecord.create({
        data: {
          vehicleId,
          serviceType,
          cost: parseFloat(cost),
          date: new Date(date),
          status: maintenanceStatus,
          notes: notes || null,
        },
        include: { vehicle: true }
      });

      if (maintenanceStatus === 'Active') {
        await tx.vehicle.update({
          where: { id: vehicleId },
          data: { status: 'InShop' }
        });
      }

      return newRecord;
    });

    return res.status(201).json(record);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to log maintenance record' });
  }
});

router.put('/:id', verifyToken, requireRole('FleetManager'), async (req, res) => {
  const { serviceType, cost, date, status, notes } = req.body;

  const existing = await prisma.maintenanceRecord.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Maintenance record not found' });

  try {
    const record = await prisma.$transaction(async (tx) => {
      const updated = await tx.maintenanceRecord.update({
        where: { id: req.params.id },
        data: {
          ...(serviceType && { serviceType }),
          ...(cost && { cost: parseFloat(cost) }),
          ...(date && { date: new Date(date) }),
          ...(status && { status }),
          ...(notes !== undefined && { notes }),
        },
        include: { vehicle: true }
      });

      if (status === 'Completed' && existing.status === 'Active') {
        const vehicle = await tx.vehicle.findUnique({ where: { id: existing.vehicleId } });
        if (vehicle && vehicle.status !== 'Retired') {
          await tx.vehicle.update({
            where: { id: existing.vehicleId },
            data: { status: 'Available' }
          });
        }
      }

      if (status === 'Active' && existing.status === 'Completed') {
        await tx.vehicle.update({
          where: { id: existing.vehicleId },
          data: { status: 'InShop' }
        });
      }

      return updated;
    });

    return res.json(record);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update maintenance record' });
  }
});

router.delete('/:id', verifyToken, requireRole('FleetManager'), async (req, res) => {
  await prisma.maintenanceRecord.delete({ where: { id: req.params.id } });
  return res.json({ message: 'Record deleted' });
});

export default router;
