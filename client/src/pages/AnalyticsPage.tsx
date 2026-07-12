import { useQuery } from '@tanstack/react-query';
import { Activity, TrendingUp, DollarSign, BarChart2, Download, FileText } from 'lucide-react';
import api from '../api/client';
import KPICard from '../components/KPICard';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics').then(r => r.data),
  });

  const exportCSV = () => {
    if (!vehicleRoi || vehicleRoi.length === 0) return;
    const headers = ['Vehicle', 'Total Cost (INR)', 'ROI %'];
    const rows = vehicleRoi.map((v: any) => [`"${v.name}"`, v.totalCost, `"${v.roi}%"`]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transitops_vehicle_roi_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-amber" />
      </div>
    );
  }

  const { kpis, monthlyRevenue, vehicleRoi } = data || {};

  const topCostliest = [...(vehicleRoi || [])].sort((a, b) => b.totalCost - a.totalCost).slice(0, 6);
  const topRoi = [...(vehicleRoi || [])].sort((a, b) => b.roi - a.roi).slice(0, 5);

  const COLORS = ['#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm">Fleet performance overview</p>
        </div>
        <div className="flex gap-2.5 no-print">
          <button onClick={exportCSV} className="btn-secondary py-2 text-xs flex items-center gap-1.5">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={exportPDF} className="btn-primary py-2 text-xs flex items-center gap-1.5 bg-accent-blue hover:bg-accent-blue-light text-white border-transparent">
            <FileText size={14} /> Export PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Fuel Efficiency"
          value={`${kpis?.fuelEfficiency ?? 0} km/l`}
          icon={<Activity size={18} />}
          accentColor="green"
          subtitle="Distance / Fuel consumed"
        />
        <KPICard
          label="Fleet Utilization"
          value={`${kpis?.fleetUtilization ?? 0}%`}
          icon={<TrendingUp size={18} />}
          accentColor="blue"
          subtitle="On trip / total vehicles"
        />
        <KPICard
          label="Operational Cost"
          value={`₹${(kpis?.operationalCost ?? 0).toLocaleString()}`}
          icon={<DollarSign size={18} />}
          accentColor="red"
          subtitle="Fuel + Maintenance"
        />
        <KPICard
          label="Top Vehicle ROI"
          value={`${topRoi[0]?.roi ?? 0}%`}
          icon={<BarChart2 size={18} />}
          accentColor="amber"
          subtitle="Best performing vehicle"
        />
      </div>

      {/* ROI Formula */}
      <div className="card bg-dark-600">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">ROI Formula</p>
        <div className="font-mono text-sm text-gray-300">
          ROI = (Revenue − (Maintenance + Fuel)) ÷ Acquisition Cost × 100%
        </div>
        <div className="text-xs text-gray-500 mt-1.5">Revenue is computed as: Planned Distance (km) × ₹15/km per completed trip</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <div className="card">
          <h2 className="section-title">Monthly Revenue (₹)</h2>
          {monthlyRevenue && monthlyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyRevenue} margin={{ left: 0, right: 10 }}>
                <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
                  formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#d97706" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">No completed trips with revenue yet</div>
          )}
        </div>

        {/* Top Costliest Vehicles */}
        <div className="card">
          <h2 className="section-title">Top Costliest Vehicles</h2>
          {topCostliest.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topCostliest} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 9 }} axisLine={false} tickLine={false} width={130}
                  tickFormatter={v => v.split(' ')[0]} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
                  formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Total Cost']}
                />
                <Bar dataKey="totalCost" radius={[0, 4, 4, 0]} maxBarSize={28}>
                  {topCostliest.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">No cost data yet</div>
          )}
        </div>
      </div>

      {/* Vehicle ROI Table */}
      <div className="card">
        <h2 className="section-title">Vehicle ROI Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-500">
                <th className="table-header">Vehicle</th>
                <th className="table-header">Total Cost (₹)</th>
                <th className="table-header">ROI %</th>
                <th className="table-header">Performance</th>
              </tr>
            </thead>
            <tbody>
              {(vehicleRoi || []).map((v: { name: string; totalCost: number; roi: number }) => (
                <tr key={v.name} className="table-row">
                  <td className="table-cell text-xs font-mono text-accent-amber">{v.name}</td>
                  <td className="table-cell tabular-nums text-gray-300">₹{v.totalCost.toLocaleString()}</td>
                  <td className={`table-cell tabular-nums font-bold ${v.roi > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{v.roi}%</td>
                  <td className="table-cell">
                    <div className="w-24 h-1.5 bg-dark-500 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${v.roi > 10 ? 'bg-emerald-500' : v.roi > 0 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(Math.abs(v.roi), 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
