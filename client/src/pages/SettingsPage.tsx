import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Check } from 'lucide-react';
import api from '../api/client';
import { getRBACMatrix } from '../hooks/useRBAC';

const ROLES = ['FleetManager', 'Dispatcher', 'SafetyOfficer', 'FinancialAnalyst'];
const ROLE_LABELS: Record<string, string> = {
  FleetManager: 'Fleet Manager',
  Dispatcher: 'Dispatcher',
  SafetyOfficer: 'Safety Officer',
  FinancialAnalyst: 'Financial Analyst',
};
const MODULES = ['Fleet', 'Drivers', 'Trips', 'Fuel', 'Analytics'];
const MODULE_LABELS: Record<string, string> = {
  Fleet: 'Fleet', Drivers: 'Drivers', Trips: 'Trips', Fuel: 'Fuel/Exp', Analytics: 'Analytics',
};

const ACTION_DISPLAY: Record<string, React.ReactNode> = {
  edit: <span className="text-emerald-400 font-bold">✓ Edit</span>,
  view: <span className="text-blue-400">view</span>,
  none: <span className="text-gray-600">—</span>,
};

export default function SettingsPage() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ depotName: '', currency: 'INR', distanceUnit: 'Kilometers' });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(r => r.data),
  });

  useEffect(() => {
    if (settings) {
      setForm({ depotName: settings.depotName || '', currency: settings.currency || 'INR', distanceUnit: settings.distanceUnit || 'Kilometers' });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data: typeof form) => api.put('/settings', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const rbac = getRBACMatrix();

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <div>
        <h1 className="page-title">Settings & RBAC</h1>
        <p className="text-gray-500 text-sm">Configure depot settings and view access control matrix</p>
      </div>

      {/* General Settings */}
      <div className="card">
        <h2 className="section-title">General Settings</h2>
        <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
          <div>
            <label className="label">Depot Name</label>
            <input className="input max-w-sm" value={form.depotName} onChange={e => setForm(f => ({ ...f, depotName: e.target.value }))} placeholder="Main Depot" />
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <div>
              <label className="label">Currency</label>
              <select className="select" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div>
              <label className="label">Distance Unit</label>
              <select className="select" value={form.distanceUnit} onChange={e => setForm(f => ({ ...f, distanceUnit: e.target.value }))}>
                <option value="Kilometers">Kilometers</option>
                <option value="Miles">Miles</option>
              </select>
            </div>
          </div>
          <div>
            <button type="submit" disabled={saveMutation.isPending} className="btn-primary">
              {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>

      {/* RBAC Matrix */}
      <div className="card">
        <h2 className="section-title">Role-Based Access Control (RBAC)</h2>
        <p className="text-xs text-gray-500 mb-4">This matrix drives actual route guarding in the application — not just decorative.</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-500">
                <th className="table-header">Role</th>
                {MODULES.map(m => (
                  <th key={m} className="table-header text-center">{MODULE_LABELS[m]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLES.map(role => (
                <tr key={role} className="table-row">
                  <td className="table-cell">
                    <div className="font-semibold text-gray-100">{ROLE_LABELS[role]}</div>
                  </td>
                  {MODULES.map(module => (
                    <td key={module} className="table-cell text-center">
                      {ACTION_DISPLAY[rbac[role]?.[module as keyof typeof rbac[string]] || 'none']}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex gap-6 text-xs">
          <div className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓ Edit</span> — Full read + write access</div>
          <div className="flex items-center gap-2"><span className="text-blue-400">view</span> — Read-only access</div>
          <div className="flex items-center gap-2"><span className="text-gray-600">—</span> — No access (route blocked)</div>
        </div>
      </div>

      {/* Demo Credentials */}
      <div className="card bg-dark-600">
        <h2 className="section-title">Demo Login Credentials</h2>
        <div className="space-y-2">
          {[
            { role: 'Fleet Manager', email: 'fleet@demo.com' },
            { role: 'Dispatcher', email: 'dispatch@demo.com' },
            { role: 'Safety Officer', email: 'safety@demo.com' },
            { role: 'Financial Analyst', email: 'finance@demo.com' },
          ].map(({ role, email }) => (
            <div key={email} className="flex items-center gap-4 py-1.5">
              <span className="text-gray-400 text-xs w-36">{role}</span>
              <span className="font-mono text-accent-amber text-xs">{email}</span>
              <span className="text-gray-500 text-xs">/ demo1234</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
