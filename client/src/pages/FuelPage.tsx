import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Fuel, Receipt } from 'lucide-react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useAuth } from '../hooks/useAuth';
import { canAccess } from '../hooks/useRBAC';

interface FuelLog {
  id: string;
  vehicleId: string;
  date: string;
  liters: number;
  cost: number;
  vehicle: { registrationNumber: string; nameModel: string };
}

interface Expense {
  id: string;
  tripId?: string;
  vehicleId: string;
  toll: number;
  other: number;
  maintenanceLinkedCost: number;
  total: number;
  status: string;
  vehicle: { registrationNumber: string; nameModel: string };
  trip?: { tripCode: string };
}

interface Vehicle { id: string; registrationNumber: string; nameModel: string; }
interface Trip { id: string; tripCode: string; }

const emptyFuelForm = { vehicleId: '', date: '', liters: '', cost: '' };
const emptyExpForm = { tripId: '', vehicleId: '', toll: '', other: '', maintenanceLinkedCost: '' };

export default function FuelPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canEdit = canAccess(user?.role || '', 'Fuel', 'edit');

  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpModal, setShowExpModal] = useState(false);
  const [fuelForm, setFuelForm] = useState(emptyFuelForm);
  const [expForm, setExpForm] = useState(emptyExpForm);

  const { data: fuelLogs = [] } = useQuery<FuelLog[]>({
    queryKey: ['fuel-logs'],
    queryFn: () => api.get('/fuel/logs').then(r => r.data),
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: () => api.get('/fuel/expenses').then(r => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ['fuel-summary'],
    queryFn: () => api.get('/fuel/summary').then(r => r.data),
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['vehicles-all'],
    queryFn: () => api.get('/vehicles').then(r => r.data),
    enabled: showFuelModal || showExpModal,
  });

  const { data: trips = [] } = useQuery<Trip[]>({
    queryKey: ['trips-all'],
    queryFn: () => api.get('/trips').then(r => r.data),
    enabled: showExpModal,
  });

  const addFuelMutation = useMutation({
    mutationFn: (data: typeof fuelForm) => api.post('/fuel/logs', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fuel-logs'] });
      qc.invalidateQueries({ queryKey: ['fuel-summary'] });
      setShowFuelModal(false);
      setFuelForm(emptyFuelForm);
    },
  });

  const addExpMutation = useMutation({
    mutationFn: (data: typeof expForm) => api.post('/fuel/expenses', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['fuel-summary'] });
      setShowExpModal(false);
      setExpForm(emptyExpForm);
    },
  });

  const totalFuel = fuelLogs.reduce((s, l) => s + l.cost, 0);
  const totalLiters = fuelLogs.reduce((s, l) => s + l.liters, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Fuel & Expense Management</h1>
          <p className="text-gray-500 text-sm">Track operational costs</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card border-l-4 border-l-amber-500">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Fuel Cost</p>
          <p className="text-2xl font-bold text-white">₹{(summary?.totalFuelCost || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{totalLiters.toFixed(1)}L total consumed</p>
        </div>
        <div className="card border-l-4 border-l-red-500">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Maintenance Cost</p>
          <p className="text-2xl font-bold text-white">₹{(summary?.totalMaintenanceCost || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">All service records</p>
        </div>
        <div className="card border-l-4 border-l-purple-500">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Operational Cost</p>
          <p className="text-2xl font-bold text-white">₹{(summary?.totalOperationalCost || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Fuel + Maintenance (auto)</p>
        </div>
      </div>

      {/* Fuel Logs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0 flex items-center gap-2"><Fuel size={16} className="text-amber-400" />Fuel Logs</h2>
          {canEdit && (
            <button onClick={() => { setShowFuelModal(true); setFuelForm(emptyFuelForm); }} className="btn-secondary text-xs py-1.5">
              <Plus size={13} /> Log Fuel
            </button>
          )}
        </div>
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-dark-600">
              <tr>
                <th className="table-header">Vehicle</th>
                <th className="table-header">Date</th>
                <th className="table-header">Liters</th>
                <th className="table-header">Cost (₹)</th>
              </tr>
            </thead>
            <tbody>
              {fuelLogs.length === 0 ? (
                <tr><td colSpan={4} className="table-cell text-center text-gray-500 py-8">No fuel logs yet</td></tr>
              ) : fuelLogs.map(l => (
                <tr key={l.id} className="table-row">
                  <td className="table-cell">
                    <div className="text-xs font-mono text-accent-amber">{l.vehicle?.registrationNumber}</div>
                    <div className="text-xs text-gray-400">{l.vehicle?.nameModel}</div>
                  </td>
                  <td className="table-cell text-gray-400">{new Date(l.date).toLocaleDateString('en-IN')}</td>
                  <td className="table-cell tabular-nums text-gray-300">{l.liters.toFixed(1)}L</td>
                  <td className="table-cell tabular-nums text-white font-semibold">₹{l.cost.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expenses */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0 flex items-center gap-2"><Receipt size={16} className="text-blue-400" />Other Expenses</h2>
          {canEdit && (
            <button onClick={() => { setShowExpModal(true); setExpForm(emptyExpForm); }} className="btn-secondary text-xs py-1.5">
              <Plus size={13} /> Add Expense
            </button>
          )}
        </div>
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-dark-600">
              <tr>
                <th className="table-header">Trip</th>
                <th className="table-header">Vehicle</th>
                <th className="table-header">Toll (₹)</th>
                <th className="table-header">Other (₹)</th>
                <th className="table-header">Maintenance (₹)</th>
                <th className="table-header">Total (₹)</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={7} className="table-cell text-center text-gray-500 py-8">No expenses yet</td></tr>
              ) : expenses.map(e => (
                <tr key={e.id} className="table-row">
                  <td className="table-cell font-mono text-accent-amber text-xs">{e.trip?.tripCode || '—'}</td>
                  <td className="table-cell text-xs">
                    <div className="text-accent-amber font-mono">{e.vehicle?.registrationNumber}</div>
                    <div className="text-gray-400">{e.vehicle?.nameModel}</div>
                  </td>
                  <td className="table-cell tabular-nums text-gray-300">{e.toll.toLocaleString()}</td>
                  <td className="table-cell tabular-nums text-gray-300">{e.other.toLocaleString()}</td>
                  <td className="table-cell tabular-nums text-gray-400">{e.maintenanceLinkedCost.toLocaleString()}</td>
                  <td className="table-cell tabular-nums text-white font-bold">₹{e.total.toLocaleString()}</td>
                  <td className="table-cell"><StatusBadge status={e.status} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Fuel Modal */}
      {showFuelModal && (
        <Modal title="Log Fuel Entry" onClose={() => setShowFuelModal(false)}>
          <form onSubmit={e => { e.preventDefault(); addFuelMutation.mutate(fuelForm); }} className="space-y-4">
            <div>
              <label className="label">Vehicle *</label>
              <select className="select" value={fuelForm.vehicleId} onChange={e => setFuelForm(f => ({ ...f, vehicleId: e.target.value }))} required>
                <option value="">Select vehicle...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNumber} — {v.nameModel}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Date *</label>
                <input type="date" className="input" value={fuelForm.date} onChange={e => setFuelForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Liters *</label>
                <input type="number" step="0.1" className="input" value={fuelForm.liters} onChange={e => setFuelForm(f => ({ ...f, liters: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Cost (₹) *</label>
                <input type="number" className="input" value={fuelForm.cost} onChange={e => setFuelForm(f => ({ ...f, cost: e.target.value }))} required />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowFuelModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={addFuelMutation.isPending} className="btn-primary">
                {addFuelMutation.isPending ? 'Saving...' : 'Log Fuel'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Expense Modal */}
      {showExpModal && (
        <Modal title="Add Expense" onClose={() => setShowExpModal(false)}>
          <form onSubmit={e => { e.preventDefault(); addExpMutation.mutate(expForm); }} className="space-y-4">
            <div>
              <label className="label">Vehicle *</label>
              <select className="select" value={expForm.vehicleId} onChange={e => setExpForm(f => ({ ...f, vehicleId: e.target.value }))} required>
                <option value="">Select vehicle...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNumber} — {v.nameModel}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Link to Trip (optional)</label>
              <select className="select" value={expForm.tripId} onChange={e => setExpForm(f => ({ ...f, tripId: e.target.value }))}>
                <option value="">No trip</option>
                {trips.map((t: { id: string; tripCode: string }) => <option key={t.id} value={t.id}>{t.tripCode}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Toll (₹)</label>
                <input type="number" className="input" value={expForm.toll} onChange={e => setExpForm(f => ({ ...f, toll: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <label className="label">Other (₹)</label>
                <input type="number" className="input" value={expForm.other} onChange={e => setExpForm(f => ({ ...f, other: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <label className="label">Maintenance (₹)</label>
                <input type="number" className="input" value={expForm.maintenanceLinkedCost} onChange={e => setExpForm(f => ({ ...f, maintenanceLinkedCost: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowExpModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={addExpMutation.isPending} className="btn-primary">
                {addExpMutation.isPending ? 'Saving...' : 'Add Expense'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
