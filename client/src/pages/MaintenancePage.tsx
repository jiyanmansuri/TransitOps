import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowRight, CheckCircle } from 'lucide-react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useAuth } from '../hooks/useAuth';
import { canAccess } from '../hooks/useRBAC';

interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  serviceType: string;
  cost: number;
  date: string;
  status: string;
  notes?: string;
  vehicle: { registrationNumber: string; nameModel: string; status: string };
}

interface Vehicle { id: string; registrationNumber: string; nameModel: string; }

const emptyForm = { vehicleId: '', serviceType: '', cost: '', date: '', status: 'Active', notes: '' };

export default function MaintenancePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canEdit = canAccess(user?.role || '', 'Maintenance', 'edit');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  const { data: records = [], isLoading } = useQuery<MaintenanceRecord[]>({
    queryKey: ['maintenance'],
    queryFn: () => api.get('/maintenance').then(r => r.data),
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['vehicles-all'],
    queryFn: () => api.get('/vehicles').then(r => r.data),
    enabled: showModal,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/maintenance', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      setShowModal(false);
      setForm(emptyForm);
      setFormError('');
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setFormError(err.response?.data?.error || 'Failed to create record');
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.put(`/maintenance/${id}`, { status: 'Completed' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  const activeRecords = records.filter(r => r.status === 'Active');
  const completedRecords = records.filter(r => r.status === 'Completed');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Maintenance</h1>
          <p className="text-gray-500 text-sm">{records.length} service records</p>
        </div>
        {canEdit && (
          <button onClick={() => { setShowModal(true); setForm(emptyForm); setFormError(''); }} className="btn-primary">
            <Plus size={16} /> Log Service Record
          </button>
        )}
      </div>

      {/* State-transition Visual */}
      <div className="card">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Vehicle State Transitions</p>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">Available</span>
            <ArrowRight size={14} className="text-gray-600" />
            <span className="text-xs text-gray-500">Create Active Record</span>
            <ArrowRight size={14} className="text-gray-600" />
            <span className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-semibold">In Shop</span>
          </div>
          <div className="w-px h-8 bg-dark-500 mx-2 hidden md:block" />
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-semibold">In Shop</span>
            <ArrowRight size={14} className="text-gray-600" />
            <span className="text-xs text-gray-500">Close Record</span>
            <ArrowRight size={14} className="text-gray-600" />
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">Available</span>
          </div>
        </div>
      </div>

      {/* Active Records */}
      {activeRecords.length > 0 && (
        <div>
          <h2 className="section-title flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Active — In Shop ({activeRecords.length})
          </h2>
          <div className="space-y-3">
            {activeRecords.map(r => (
              <div key={r.id} className="card border-l-4 border-l-amber-500 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-accent-amber font-semibold text-sm">{r.vehicle?.registrationNumber}</span>
                    <span className="text-gray-300 text-sm">—</span>
                    <span className="text-gray-100 text-sm">{r.vehicle?.nameModel}</span>
                    <StatusBadge status="InShop" size="sm" />
                  </div>
                  <div className="text-sm font-medium text-gray-200 mb-1">{r.serviceType}</div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>₹{r.cost.toLocaleString()}</span>
                    <span>{new Date(r.date).toLocaleDateString('en-IN')}</span>
                    {r.notes && <span className="text-gray-500 italic">{r.notes}</span>}
                  </div>
                </div>
                {canEdit && (
                  <button
                    onClick={() => { if (confirm('Mark as completed? Vehicle will return to Available.')) completeMutation.mutate(r.id); }}
                    className="btn-success flex-shrink-0"
                    disabled={completeMutation.isPending}
                  >
                    <CheckCircle size={14} />
                    Close Record
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Records Table */}
      <div>
        <h2 className="section-title">Service Log</h2>
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-dark-600">
              <tr>
                <th className="table-header">Vehicle</th>
                <th className="table-header">Service Type</th>
                <th className="table-header">Cost (₹)</th>
                <th className="table-header">Date</th>
                <th className="table-header">Status</th>
                {canEdit && <th className="table-header">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="table-cell text-center text-gray-500 py-12">Loading...</td></tr>
              ) : records.map(r => (
                <tr key={r.id} className="table-row">
                  <td className="table-cell">
                    <div className="font-mono text-accent-amber text-xs">{r.vehicle?.registrationNumber}</div>
                    <div className="text-gray-400 text-xs">{r.vehicle?.nameModel}</div>
                  </td>
                  <td className="table-cell text-gray-100">{r.serviceType}</td>
                  <td className="table-cell tabular-nums text-gray-300">₹{r.cost.toLocaleString()}</td>
                  <td className="table-cell text-gray-400">{new Date(r.date).toLocaleDateString('en-IN')}</td>
                  <td className="table-cell">
                    <StatusBadge status={r.status === 'Active' ? 'InShop' : 'Completed'} size="sm" />
                  </td>
                  {canEdit && (
                    <td className="table-cell">
                      {r.status === 'Active' && (
                        <button
                          onClick={() => completeMutation.mutate(r.id)}
                          className="px-2.5 py-1 text-xs bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-lg font-semibold transition-colors"
                          disabled={completeMutation.isPending}
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Service Modal */}
      {showModal && (
        <Modal title="Log Service Record" onClose={() => setShowModal(false)}>
          <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
            <div>
              <label className="label">Vehicle *</label>
              <select className="select" value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))} required>
                <option value="">Select vehicle...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.registrationNumber} — {v.nameModel}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Service Type *</label>
              <input className="input" value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))} placeholder="Engine Overhaul / Oil Change / Tyre Replacement..." required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Cost (₹) *</label>
                <input type="number" className="input" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} placeholder="5000" required />
              </div>
              <div>
                <label className="label">Date *</label>
                <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="Active">Active (In Shop — will set vehicle status to In Shop)</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
            </div>
            {form.status === 'Active' && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                ⚠ Creating an Active record will automatically set the vehicle status to <strong>In Shop</strong> and remove it from the dispatch pool.
              </div>
            )}
            {formError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{formError}</div>}
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                {createMutation.isPending ? 'Saving...' : 'Log Record'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
