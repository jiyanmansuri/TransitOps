import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up existing data
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceRecord.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.settings.deleteMany();

  // Settings
  await prisma.settings.create({
    data: { id: 'singleton', depotName: 'TransitOps Central Depot', currency: 'INR', distanceUnit: 'Kilometers' }
  });

  // Users
  const hash = async (p: string) => bcrypt.hash(p, 10);
  await prisma.user.createMany({
    data: [
      { name: 'Ridham Gohel', email: 'fleet@demo.com', passwordHash: await hash('demo1234'), role: 'FleetManager' },
      { name: 'Priya Sharma', email: 'dispatch@demo.com', passwordHash: await hash('demo1234'), role: 'Dispatcher' },
      { name: 'Rajan Verma', email: 'safety@demo.com', passwordHash: await hash('demo1234'), role: 'SafetyOfficer' },
      { name: 'Neha Gupta', email: 'finance@demo.com', passwordHash: await hash('demo1234'), role: 'FinancialAnalyst' },
    ]
  });

  // Vehicles
  const vehicles = await Promise.all([
    prisma.vehicle.create({ data: { registrationNumber: 'MH-12-AB-1234', nameModel: 'Tata Ace Gold', type: 'Mini', maxLoadCapacityKg: 750, odometer: 12340, acquisitionCost: 650000, status: 'Available' } }),
    prisma.vehicle.create({ data: { registrationNumber: 'DL-01-CX-5678', nameModel: 'Ashok Leyland BOSS', type: 'Truck', maxLoadCapacityKg: 8000, odometer: 45820, acquisitionCost: 2200000, status: 'OnTrip' } }),
    prisma.vehicle.create({ data: { registrationNumber: 'KA-05-MN-9012', nameModel: 'Force Traveller', type: 'Van', maxLoadCapacityKg: 1200, odometer: 28950, acquisitionCost: 950000, status: 'InShop' } }),
    prisma.vehicle.create({ data: { registrationNumber: 'GJ-18-PQ-3456', nameModel: 'Eicher Pro 2095', type: 'Truck', maxLoadCapacityKg: 9500, odometer: 98100, acquisitionCost: 1850000, status: 'Retired' } }),
    prisma.vehicle.create({ data: { registrationNumber: 'TN-22-RS-7890', nameModel: 'Mahindra Bolero Pikup', type: 'Mini', maxLoadCapacityKg: 1000, odometer: 34200, acquisitionCost: 820000, status: 'Available' } }),
    prisma.vehicle.create({ data: { registrationNumber: 'UP-32-TU-2345', nameModel: 'BharatBenz 1217C', type: 'Truck', maxLoadCapacityKg: 12000, odometer: 61400, acquisitionCost: 2950000, status: 'Available' } }),
  ]);

  // Drivers
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 365);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 10);

  const drivers = await Promise.all([
    prisma.driver.create({ data: { name: 'Suresh Kumar', licenseNumber: 'DL-MH-20181234', licenseCategory: 'HMV', licenseExpiryDate: tomorrow, contactNumber: '+91-98765-43210', safetyScore: 92, status: 'Available' } }),
    prisma.driver.create({ data: { name: 'Ramesh Singh', licenseNumber: 'DL-DL-20192345', licenseCategory: 'HGV', licenseExpiryDate: tomorrow, contactNumber: '+91-98765-43211', safetyScore: 87, status: 'OnTrip' } }),
    prisma.driver.create({ data: { name: 'Deepak Patel', licenseNumber: 'DL-KA-20173456', licenseCategory: 'LMV', licenseExpiryDate: yesterday, contactNumber: '+91-98765-43212', safetyScore: 78, status: 'Available' } }),
    prisma.driver.create({ data: { name: 'Ajay Yadav', licenseNumber: 'DL-GJ-20204567', licenseCategory: 'HMV', licenseExpiryDate: tomorrow, contactNumber: '+91-98765-43213', safetyScore: 95, status: 'OffDuty' } }),
    prisma.driver.create({ data: { name: 'Vinod Tiwari', licenseNumber: 'DL-TN-20155678', licenseCategory: 'HGV', licenseExpiryDate: tomorrow, contactNumber: '+91-98765-43214', safetyScore: 55, status: 'Suspended' } }),
  ]);

  const pastDate = (days: number) => { const d = new Date(); d.setDate(d.getDate() - days); return d; };
  const now = new Date();
  let tripCounter = 1;
  const nextTripCode = () => `TR${String(tripCounter++).padStart(3, '0')}`;

  const trips = await Promise.all([
    prisma.trip.create({ data: { tripCode: nextTripCode(), source: 'Mumbai', destination: 'Pune', vehicleId: vehicles[0].id, driverId: drivers[0].id, cargoWeightKg: 600, plannedDistanceKm: 148, status: 'Completed', createdAt: pastDate(10), dispatchedAt: pastDate(10), completedAt: pastDate(9), finalOdometer: 12488, fuelConsumed: 18.5, eta: '2026-07-03T14:00:00Z' } }),
    prisma.trip.create({ data: { tripCode: nextTripCode(), source: 'Delhi', destination: 'Jaipur', vehicleId: vehicles[5].id, driverId: drivers[3].id, cargoWeightKg: 8500, plannedDistanceKm: 281, status: 'Completed', createdAt: pastDate(7), dispatchedAt: pastDate(7), completedAt: pastDate(6), finalOdometer: 61681, fuelConsumed: 56, eta: '2026-07-06T18:00:00Z' } }),
    prisma.trip.create({ data: { tripCode: nextTripCode(), source: 'Chennai', destination: 'Bangalore', vehicleId: vehicles[1].id, driverId: drivers[1].id, cargoWeightKg: 7200, plannedDistanceKm: 346, status: 'Dispatched', createdAt: pastDate(1), dispatchedAt: pastDate(1), eta: new Date(now.getTime() + 4 * 3600000).toISOString() } }),
    prisma.trip.create({ data: { tripCode: nextTripCode(), source: 'Kolkata', destination: 'Patna', vehicleId: vehicles[4].id, driverId: drivers[0].id, cargoWeightKg: 900, plannedDistanceKm: 590, status: 'Draft', createdAt: now } }),
    prisma.trip.create({ data: { tripCode: nextTripCode(), source: 'Hyderabad', destination: 'Vijayawada', vehicleId: vehicles[5].id, driverId: drivers[3].id, cargoWeightKg: 10000, plannedDistanceKm: 275, status: 'Draft', createdAt: pastDate(2) } }),
    prisma.trip.create({ data: { tripCode: nextTripCode(), source: 'Ahmedabad', destination: 'Surat', vehicleId: vehicles[0].id, driverId: drivers[0].id, cargoWeightKg: 400, plannedDistanceKm: 265, status: 'Cancelled', createdAt: pastDate(5) } }),
  ]);

  await Promise.all([
    prisma.maintenanceRecord.create({ data: { vehicleId: vehicles[2].id, serviceType: 'Engine Overhaul', cost: 45000, date: pastDate(3), status: 'Active', notes: 'Complete engine rebuild required' } }),
    prisma.maintenanceRecord.create({ data: { vehicleId: vehicles[0].id, serviceType: 'Oil Change & Filter', cost: 2800, date: pastDate(20), status: 'Completed' } }),
    prisma.maintenanceRecord.create({ data: { vehicleId: vehicles[1].id, serviceType: 'Tyre Replacement', cost: 18000, date: pastDate(14), status: 'Completed' } }),
  ]);

  await Promise.all([
    prisma.fuelLog.create({ data: { vehicleId: vehicles[0].id, date: pastDate(9), liters: 18.5, cost: 2312 } }),
    prisma.fuelLog.create({ data: { vehicleId: vehicles[1].id, date: pastDate(6), liters: 56, cost: 7000 } }),
    prisma.fuelLog.create({ data: { vehicleId: vehicles[5].id, date: pastDate(6), liters: 80, cost: 10000 } }),
    prisma.fuelLog.create({ data: { vehicleId: vehicles[0].id, date: pastDate(30), liters: 20, cost: 2500 } }),
    prisma.fuelLog.create({ data: { vehicleId: vehicles[4].id, date: pastDate(15), liters: 35, cost: 4375 } }),
    prisma.fuelLog.create({ data: { vehicleId: vehicles[2].id, date: pastDate(25), liters: 42, cost: 5250 } }),
  ]);

  await Promise.all([
    prisma.expense.create({ data: { tripId: trips[0].id, vehicleId: vehicles[0].id, toll: 450, other: 200, maintenanceLinkedCost: 2800, total: 3450, status: 'Completed' } }),
    prisma.expense.create({ data: { tripId: trips[1].id, vehicleId: vehicles[5].id, toll: 1200, other: 500, maintenanceLinkedCost: 0, total: 1700, status: 'Completed' } }),
    prisma.expense.create({ data: { tripId: trips[2].id, vehicleId: vehicles[1].id, toll: 800, other: 300, maintenanceLinkedCost: 0, total: 1100, status: 'Dispatched' } }),
  ]);

  console.log('✅ Seed complete!');
  console.log('📧 Login credentials (all use password: demo1234)');
  console.log('   Fleet Manager:     fleet@demo.com');
  console.log('   Dispatcher:        dispatch@demo.com');
  console.log('   Safety Officer:    safety@demo.com');
  console.log('   Financial Analyst: finance@demo.com');
}

main().catch(console.error).finally(() => prisma.$disconnect());
