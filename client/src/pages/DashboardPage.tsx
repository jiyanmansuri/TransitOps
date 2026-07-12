import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Truck, Users, Map, Wrench, TrendingUp, Activity, Plus, Filter } from 'lucide-react';
import api from '../api/client';
import KPICard from '../components/KPICard';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

interface Vehicle {
  id: string;
  registrationNumber: string;
  nameModel: string;
  type: string;
  maxLoadCapacityKg: number;
  odometer: number;
  acquisitionCost: number;
  status: string;
}

interface Trip {
  id: string;
  tripCode: string;
  source: string;
  destination: string;
  cargoWeightKg: number;
  plannedDistanceKm: number;
  status: string;
  eta?: string;
  fuelConsumed?: number | null;
  vehicleId: string;
  driverId: string;
  vehicle: { registrationNumber: string; nameModel: string; type: string };
  driver: { name: string };
  createdAt: string;
}

interface Driver {
  id: string;
  status: string;
}

const STATUS_COLORS = {
  Available: '#10b981',
  OnTrip: '#3b82f6',
  InShop: '#7c3aed',
  Retired: '#ef4444',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isDispatcher = user?.role === 'Dispatcher';

  // Filters State
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Queries
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: () => api.get('/vehicles').then(r => r.data),
  });

  const { data: trips = [], isLoading: tripsLoading } = useQuery<Trip[]>({
    queryKey: ['trips'],
    queryFn: () => api.get('/trips').then(r => r.data),
  });

  const { data: drivers = [], isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: () => api.get('/drivers').then(r => r.data),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['fuel-summary'],
    queryFn: () => api.get('/fuel/summary').then(r => r.data),
  });

  const isLoading = vehiclesLoading || tripsLoading || driversLoading || summaryLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-amber" />
      </div>
    );
  }

  // --- Dynamic Filtering Logic ---
  const statsVehicles = vehicles.filter(v => typeFilter === 'All' || v.type.toLowerCase() === typeFilter.toLowerCase());
  const totalVehicles = statsVehicles.length;
  const activeVehicles = statsVehicles.filter(v => v.status !== 'Retired').length;
  const availableVehicles = statsVehicles.filter(v => v.status === 'Available').length;
  const inMaintenanceVehicles = statsVehicles.filter(v => v.status === 'InShop').length;
  const onTripVehicles = statsVehicles.filter(v => v.status === 'OnTrip').length;
  const retiredVehicles = statsVehicles.filter(v => v.status === 'Retired').length;

  const fleetUtilization = totalVehicles > 0
    ? Math.round((onTripVehicles / totalVehicles) * 100)
    : 0;

  // Status breakdown data for the segmented bar chart
  const statusBarData = [
    { name: 'Available', value: availableVehicles, key: 'Available' },
    { name: 'On Trip', value: onTripVehicles, key: 'OnTrip' },
    { name: 'In Shop', value: inMaintenanceVehicles, key: 'InShop' },
    { name: 'Retired', value: retiredVehicles, key: 'Retired' },
  ];

  // Calculate trip-level metrics (reacts to typeFilter & statusFilter)
  const statsTrips = trips.filter(t => {
    const vehicle = vehicles.find(v => v.id === t.vehicleId);
    if (!vehicle) return false;
    const matchesType = typeFilter === 'All' || vehicle.type.toLowerCase() === typeFilter.toLowerCase();
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const activeTrips = statsTrips.filter(t => t.status === 'Dispatched').length;
  const pendingTrips = statsTrips.filter(t => t.status === 'Draft').length;

  // Active drivers count
  const driversOnDuty = drivers.filter(d => d.status === 'OnTrip').length;

  // Calculate fuel efficiency of completed trips matching selected vehicle type and status filter
  const completedTrips = statsTrips.filter(t => t.status === 'Completed' && t.fuelConsumed && t.plannedDistanceKm);
  const totalDistance = completedTrips.reduce((sum, t) => sum + t.plannedDistanceKm, 0);
  const totalFuel = completedTrips.reduce((sum, t) => sum + (t.fuelConsumed || 0), 0);
  const fuelEfficiency = totalFuel > 0 ? Math.round((totalDistance / totalFuel) * 10) / 10 : 0;

  // Dynamic monthly revenue calculation (reacts to filters)
  const monthlyRevenue: Record<string, number> = {};
  completedTrips.forEach(t => {
    const date = t.createdAt ? new Date(t.createdAt) : new Date();
    const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + t.plannedDistanceKm * 15;
  });
  const monthlyRevenueArr = Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue }));

  // Types list for drop-down filter
  const vehicleTypes = Array.from(new Set(vehicles.map(v => v.type)));

  // Navigation action
  const handleNewTripClick = () => {
    if (isDispatcher) {
      navigate('/trips?create=true');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Operations Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Central Command Console</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-gray-400 text-xs font-mono">LIVE DATAFEED</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-dark-700 p-4 rounded-xl border border-dark-500">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wider">
            <Filter size={14} className="text-accent-amber" />
            <span>Operational Filters</span>
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="select py-1.5 text-xs w-40"
          >
            <option value="All">All Vehicle Types</option>
            {vehicleTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="select py-1.5 text-xs w-40"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        
        {isDispatcher ? (
          <button
            onClick={handleNewTripClick}
            className="btn-primary py-1.5 text-xs shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20"
          >
            <Plus size={14} /> New Trip Dispatch
          </button>
        ) : (
          <div className="text-xs text-gray-500 italic">Access permissions active</div>
        )}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Active Vehicles" value={activeVehicles} icon={<Truck size={18} />} accentColor="blue" subtitle={`In registry: ${totalVehicles}`} />
        <KPICard label="Available Vehicles" value={availableVehicles} icon={<Truck size={18} />} accentColor="green" subtitle="Ready for dispatch" />
        <KPICard label="In Maintenance" value={inMaintenanceVehicles} icon={<Wrench size={18} />} accentColor="amber" subtitle="In service shop" />
        <KPICard label="Fleet Utilization" value={`${fleetUtilization}%`} icon={<TrendingUp size={18} />} accentColor="purple" subtitle="Active vs total assets" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Active Trips" value={activeTrips} icon={<Map size={18} />} accentColor="blue" subtitle="Dispatched routes" />
        <KPICard label="Pending Trips" value={pendingTrips} icon={<Map size={18} />} accentColor="amber" subtitle="Draft stages" />
        <KPICard label="Drivers on Duty" value={driversOnDuty} icon={<Users size={18} />} accentColor="green" subtitle="Currently dispatched" />
        <KPICard label="Fuel Efficiency" value={`${fuelEfficiency} km/l`} icon={<Activity size={18} />} accentColor="green" subtitle="Aggregate avg economy" />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Trips */}
        <div className="lg:col-span-3 card flex flex-col">
          <h2 className="section-title">Operational Log</h2>
          <div className="overflow-x-auto flex-1">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-500">
                  <th className="table-header">Trip Code</th>
                  <th className="table-header">Route</th>
                  <th className="table-header">Driver</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody>
                {statsTrips.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="table-cell text-center text-gray-500 py-12">
                      No operational logs match the active filter.
                    </td>
                  </tr>
                ) : (
                  statsTrips.slice(0, 7).map(trip => (
                    <tr key={trip.id} className="table-row">
                      <td className="table-cell font-mono text-accent-amber font-semibold">{trip.tripCode}</td>
                      <td className="table-cell text-gray-300">
                        {trip.source} <span className="text-gray-600">→</span> {trip.destination}
                      </td>
                      <td className="table-cell text-gray-400">{trip.driver?.name}</td>
                      <td className="table-cell"><StatusBadge status={trip.status} size="sm" /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Status Breakdown */}
        <div className="lg:col-span-2 card">
          <h2 className="section-title">Asset Deployment Status</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={statusBarData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#d1d5db' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
                {statusBarData.map((entry) => (
                  <Cell key={entry.key} fill={STATUS_COLORS[entry.key as keyof typeof STATUS_COLORS] || '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-2 border-t border-dark-500">
            {statusBarData.map(s => (
              <div key={s.key} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STATUS_COLORS[s.key as keyof typeof STATUS_COLORS] || '#6b7280' }} />
                <span className="text-xs text-gray-400">
                  {s.name}: <span className="text-white font-semibold">{s.value}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      {monthlyRevenueArr.length > 0 && (
        <div className="card">
          <h2 className="section-title">Monthly Revenue (₹) — Filtered</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyRevenueArr} margin={{ left: 0, right: 20 }}>
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
                formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#d97706" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
