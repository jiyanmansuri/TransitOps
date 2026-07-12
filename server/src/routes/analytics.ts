import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', verifyToken, async (_req, res) => {
  const [vehicles, drivers, trips, fuelLogs, maintenance] = await Promise.all([
    prisma.vehicle.findMany(),
    prisma.driver.findMany(),
    prisma.trip.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        vehicle: { select: { registrationNumber: true, nameModel: true } },
        driver: { select: { name: true } }
      }
    }),
    prisma.fuelLog.findMany(),
    prisma.maintenanceRecord.findMany(),
  ]);

  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status !== 'Retired').length;
  const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
  const inMaintenanceVehicles = vehicles.filter(v => v.status === 'InShop').length;
  const onTripVehicles = vehicles.filter(v => v.status === 'OnTrip').length;

  const activeTrips = trips.filter(t => t.status === 'Dispatched').length;
  const pendingTrips = trips.filter(t => t.status === 'Draft').length;
  const driversOnDuty = drivers.filter(d => d.status === 'OnTrip').length;

  const fleetUtilization = totalVehicles > 0
    ? Math.round((onTripVehicles / totalVehicles) * 100)
    : 0;

  const vehicleStatusBreakdown = {
    Available: availableVehicles,
    OnTrip: onTripVehicles,
    InShop: inMaintenanceVehicles,
    Retired: vehicles.filter(v => v.status === 'Retired').length,
  };

  const completedTrips = await prisma.trip.findMany({
    where: { status: 'Completed', fuelConsumed: { not: null }, finalOdometer: { not: null } }
  });
  let totalDistanceDriven = 0;
  let totalFuelUsed = 0;
  completedTrips.forEach(t => {
    if (t.fuelConsumed && t.finalOdometer) {
      totalDistanceDriven += t.plannedDistanceKm;
      totalFuelUsed += t.fuelConsumed;
    }
  });
  const fuelEfficiency = totalFuelUsed > 0 ? Math.round((totalDistanceDriven / totalFuelUsed) * 10) / 10 : 0;

  const fuelAgg = await prisma.fuelLog.aggregate({ _sum: { cost: true } });
  const maintAgg = await prisma.maintenanceRecord.aggregate({ _sum: { cost: true } });
  const operationalCost = (fuelAgg._sum.cost || 0) + (maintAgg._sum.cost || 0);

  const allTrips = await prisma.trip.findMany({ where: { status: 'Completed' } });
  const monthlyRevenue: Record<string, number> = {};
  allTrips.forEach(t => {
    const month = new Date(t.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' });
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + t.plannedDistanceKm * 15;
  });
  const monthlyRevenueArr = Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue }));

  const vehicleRoi = await Promise.all(vehicles.map(async (v) => {
    const vTrips = await prisma.trip.findMany({ where: { vehicleId: v.id, status: 'Completed' } });
    const vFuel = await prisma.fuelLog.aggregate({ where: { vehicleId: v.id }, _sum: { cost: true } });
    const vMaint = await prisma.maintenanceRecord.aggregate({ where: { vehicleId: v.id }, _sum: { cost: true } });
    const revenue = vTrips.reduce((s, t) => s + t.plannedDistanceKm * 15, 0);
    const costs = (vFuel._sum.cost || 0) + (vMaint._sum.cost || 0);
    const roi = v.acquisitionCost > 0 ? Math.round(((revenue - costs) / v.acquisitionCost) * 1000) / 10 : 0;
    const totalCost = costs;
    return { id: v.id, name: `${v.registrationNumber} - ${v.nameModel}`, roi, totalCost };
  }));

  return res.json({
    kpis: {
      activeVehicles,
      availableVehicles,
      inMaintenanceVehicles,
      onTripVehicles,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization,
      fuelEfficiency,
      operationalCost,
    },
    vehicleStatusBreakdown,
    recentTrips: trips,
    monthlyRevenue: monthlyRevenueArr,
    vehicleRoi,
  });
});

export default router;
