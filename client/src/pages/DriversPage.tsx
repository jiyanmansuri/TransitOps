import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, AlertTriangle, CheckCircle, UserX } from 'lucide-react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useAuth } from '../hooks/useAuth';
import { canAccess } from '../hooks/useRBAC';

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
  safetyScore: number;
  status: string;
  tripCompletionRate: number;
}

const DRIVER_STATUSES = ['Available', 'OnTrip', 'OffDuty', 'Suspended'];
const STATUS_LABELS: Record<string, string> = { Available: 'Available', OnTrip: 'On Trip', OffDuty: 'Off Duty', Suspended: 'Suspended' };

const emptyForm = {
  name: '', licenseNumber: '', licenseCategory: 'HMV',
  licenseExpiryDate: '', contactNumber: '', safetyScore: '100',
};

export default function DriversPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canEdit = canAccess(user?.role || '', 'Drivers', 'edit');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  const { data: drivers = [], isLoading } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: () => api.get('/drivers').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/drivers', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drivers'] });
      setShowModal(false);
      setForm(emptyForm);
      setFormError('');
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setFormError(err.response?.data?.error || 'Failed to create driver');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/drivers/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drivers'] }),
  });

  const remindMutation = useMutation({
    mutationFn: () => api.post('/drivers/remind-expiry'),
    onSuccess: (res: any) => {
      alert(res.data.message);
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to send reminders');
    }
  });

  const isExpired = (dateStr: string) => new Date(dateStr) < new Date();

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Drivers & Safety Profiles</h1>
          <p className="text-gray-500 text-sm">{drivers.length} registered drivers</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button
              onClick={() => remindMutation.mutate()}
              disabled={remindMutation.isPending}
              className="btn-secondary py-2 text-xs"
            >
              {remindMutation.isPending ? 'Sending...' : '✉ Send Expiry Reminders'}
            </button>
            <button onClick={() => { setShowModal(true); setForm(emptyForm); setFormError(''); }} className="btn-primary py-2 text-xs">
              <Plus size={14} /> Add Driver
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-600">
              <tr>
                <th className="table-header">Driver</th>
                <th className="table-header">License No.</th>
                <th className="table-header">Category</th>
                <th className="table-header">Expiry</th>
                <th className="table-header">Contact</th>
                <th className="table-header">Completion %</th>
                <th className="table-header">Safety Score</th>
                <th className="table-header">Status</th>
                {canEdit && <th className="table-header">Set Status</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="table-cell text-center text-gray-500 py-12">Loading...</td></tr>
              ) : drivers.length === 0 ? (
                <tr><td colSpan={9} className="table-cell text-center text-gray-500 py-12">
                  <Users size={32} className="mx-auto mb-3 opacity-30" />
                  No drivers found
                </td></tr>
              ) : drivers.map(d => {
                const expired = isExpired(d.licenseExpiryDate);
                return (
                  <tr key={d.id} className={`table-row ${expired ? 'bg-red-500/5' : ''}`}>
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-dark-500 flex items-center justify-center text-xs font-bold text-gray-300">
                          {d.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-medium text-white">{d.name}</span>
                      </div>
                    </td>
                    <td className="table-cell font-mono text-gray-300 text-xs">{d.licenseNumber}</td>
                    <td className="table-cell text-gray-400">{d.licenseCategory}</td>
                    <td className="table-cell">
                      <span className={`text-xs flex items-center gap-1 ${expired ? 'text-red-400' : 'text-gray-400'}`}>
                        {expired ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                        {new Date(d.licenseExpiryDate).toLocaleDateString('en-IN')}
                        {expired && <span className="text-red-400 font-semibold">(EXPIRED)</span>}
                      </span>
                    </td>
                    <td className="table-cell text-gray-400">{d.contactNumber}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-dark-500 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${d.tripCompletionRate}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-gray-300">{d.tripCompletionRate}%</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-dark-500 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${d.safetyScore >= 80 ? 'bg-emerald-500' : d.safetyScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${d.safetyScore}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-gray-300">{d.safetyScore}%</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={d.status} size="sm" />
                        {d.status === 'Suspended' && <span className="text-[10px] text-red-400">Cannot be assigned</span>}
                        {expired && <span className="text-[10px] text-red-400">License expired</span>}
                      </div>
                    </td>
                    {canEdit && (
                      <td className="table-cell">
                        <select
                          value={d.status}
                          onChange={e => statusMutation.mutate({ id: d.id, status: e.target.value })}
                          className="select text-xs py-1 w-32"
                          disabled={d.status === 'OnTrip'}
                        >
                          {DRIVER_STATUSES.map(s => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Driver Modal */}
      {showModal && (
        <Modal title="Add Driver" onClose={() => setShowModal(false)}>
          <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Full Name *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Suresh Kumar" required />
              </div>
              <div>
                <label className="label">License Number *</label>
                <input className="input" value={form.licenseNumber} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))} placeholder="DL-MH-20181234" required />
              </div>
              <div>
                <label className="label">License Category *</label>
                <select className="select" value={form.licenseCategory} onChange={e => setForm(f => ({ ...f, licenseCategory: e.target.value }))}>
                  {['HMV', 'HGV', 'LMV', 'MCWG', 'Transport'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">License Expiry Date *</label>
                <input type="date" className="input" value={form.licenseExpiryDate} onChange={e => setForm(f => ({ ...f, licenseExpiryDate: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Contact Number *</label>
                <input className="input" value={form.contactNumber} onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))} placeholder="+91-98765-43210" required />
              </div>
              <div className="col-span-2">
                <label className="label">Safety Score (0-100)</label>
                <input type="number" min="0" max="100" className="input" value={form.safetyScore} onChange={e => setForm(f => ({ ...f, safetyScore: e.target.value }))} />
              </div>
            </div>
            {formError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{formError}</div>}
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                {createMutation.isPending ? 'Saving...' : 'Add Driver'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
