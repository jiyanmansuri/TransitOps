import { useQuery } from '@tanstack/react-query';
import { Truck, Users, Map, Wrench, TrendingUp, Activity } from 'lucide-react';
import api from '../api/client';
import KPICard from '../components/KPICard';
import StatusBadge from '../components/StatusBadge';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const STATUS_COLORS = {
  Available: '#10b981',
  OnTrip: '#3b82f6',
  InShop: '#f59e0b',
  Retired: '#ef4444',
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics').then(r => r.data),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-amber" />
      </div>
    );
  }

  const { kpis, vehicleStatusBreakdown, recentTrips, monthlyRevenue } = data || {};

  const statusBarData = Object.entries(vehicleStatusBreakdown || {}).map(([name, value]) => ({
    name: name === 'OnTrip' ? 'On Trip' : name === 'InShop' ? 'In Shop' : name,
    value,
    key: name,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Operations Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Live fleet and trip overview</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-gray-400 text-xs">Live data</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Active Vehicles" value={kpis?.activeVehicles ?? '—'} icon={<Truck size={18} />} accentColor="blue" subtitle="Excluding retired" />
        <KPICard label="Available" value={kpis?.availableVehicles ?? '—'} icon={<Truck size={18} />} accentColor="green" subtitle="Ready to dispatch" />
        <KPICard label="In Maintenance" value={kpis?.inMaintenanceVehicles ?? '—'} icon={<Wrench size={18} />} accentColor="amber" subtitle="In shop now" />
        <KPICard label="Fleet Utilization" value={`${kpis?.fleetUtilization ?? 0}%`} icon={<TrendingUp size={18} />} accentColor="purple" subtitle="On trip / total" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Active Trips" value={kpis?.activeTrips ?? '—'} icon={<Map size={18} />} accentColor="blue" subtitle="Dispatched" />
        <KPICard label="Pending Trips" value={kpis?.pendingTrips ?? '—'} icon={<Map size={18} />} accentColor="amber" subtitle="Draft" />
        <KPICard label="Drivers on Duty" value={kpis?.driversOnDuty ?? '—'} icon={<Users size={18} />} accentColor="green" subtitle="Currently on trip" />
        <KPICard label="Fuel Efficiency" value={`${kpis?.fuelEfficiency ?? 0} km/l`} icon={<Activity size={18} />} accentColor="green" subtitle="Avg completed trips" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Trips */}
        <div className="lg:col-span-3 card">
          <h2 className="section-title">Recent Trips</h2>
          <div className="overflow-x-auto">
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
                {(recentTrips || []).slice(0, 8).map((trip: {
                  id: string;
                  tripCode: string;
                  source: string;
                  destination: string;
                  vehicle: { registrationNumber: string };
                  driver: { name: string };
                  status: string;
                }) => (
                  <tr key={trip.id} className="table-row">
                    <td className="table-cell font-mono text-accent-amber font-semibold">{trip.tripCode}</td>
                    <td className="table-cell text-gray-300">{trip.source} → {trip.destination}</td>
                    <td className="table-cell text-gray-400">{trip.driver?.name}</td>
                    <td className="table-cell"><StatusBadge status={trip.status} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Status Bar */}
        <div className="lg:col-span-2 card">
          <h2 className="section-title">Vehicle Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusBarData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#d1d5db' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {statusBarData.map((entry) => (
                  <Cell key={entry.key} fill={STATUS_COLORS[entry.key as keyof typeof STATUS_COLORS] || '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {statusBarData.map(s => (
              <div key={s.key} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STATUS_COLORS[s.key as keyof typeof STATUS_COLORS] || '#6b7280' }} />
                <span className="text-xs text-gray-400">{s.name}: <span className="text-white font-semibold">{s.value as number}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      {monthlyRevenue && monthlyRevenue.length > 0 && (
        <div className="card">
          <h2 className="section-title">Monthly Revenue (₹)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyRevenue} margin={{ left: 0, right: 20 }}>
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
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
