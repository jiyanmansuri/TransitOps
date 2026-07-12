import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Truck, FileText, Trash, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useAuth } from '../hooks/useAuth';
import { canAccess } from '../hooks/useRBAC';

interface Vehicle {
  id: string;
  registrationNumber: string;
  nameModel: string;
  type: string;
  maxLoadCapacityKg: number;
  odometer: number;
  acquisitionCost: number;
  status: string;
  documents?: VehicleDocument[];
}

interface VehicleDocument {
  id: string;
  vehicleId: string;
  type: string;
  docNumber: string;
  expiryDate: string;
  status: string;
}

const VEHICLE_TYPES = ['Van', 'Truck', 'Mini', 'Heavy', 'Refrigerated', 'Tanker'];
const STATUSES = ['All', 'Available', 'OnTrip', 'InShop', 'Retired'];

const emptyForm = { registrationNumber: '', nameModel: '', type: 'Van', maxLoadCapacityKg: '', odometer: '0', acquisitionCost: '' };

export default function FleetPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canEdit = canAccess(user?.role || '', 'Fleet', 'edit');

  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  // Vehicle Document States
  const [selectedDocVehicle, setSelectedDocVehicle] = useState<Vehicle | null>(null);
  const [docForm, setDocForm] = useState({ type: 'Insurance', docNumber: '', expiryDate: '' });
  const [docFormError, setDocFormError] = useState('');

  // Documents Query
  const { data: documents = [], refetch: refetchDocs } = useQuery<VehicleDocument[]>({
    queryKey: ['vehicle-documents', selectedDocVehicle?.id],
    queryFn: () => api.get(`/vehicles/${selectedDocVehicle?.id}/documents`).then(r => r.data),
    enabled: !!selectedDocVehicle,
  });

  const addDocMutation = useMutation({
    mutationFn: (data: typeof docForm) => api.post(`/vehicles/${selectedDocVehicle?.id}/documents`, data),
    onSuccess: () => {
      refetchDocs();
      setDocForm({ type: 'Insurance', docNumber: '', expiryDate: '' });
      setDocFormError('');
    },
    onError: (err: any) => {
      setDocFormError(err.response?.data?.error || 'Failed to add document');
    }
  });

  const deleteDocMutation = useMutation({
    mutationFn: (docId: string) => api.delete(`/vehicles/documents/${docId}`),
    onSuccess: () => {
      refetchDocs();
    }
  });

  const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({
    queryKey: ['vehicles', typeFilter, statusFilter, search],
    queryFn: () => api.get('/vehicles', { params: { type: typeFilter, status: statusFilter, search } }).then(r => r.data),
  });

  const isFinance = user?.role === 'FinancialAnalyst';
  const totalFleetValue = vehicles.reduce((sum, v) => sum + (v.acquisitionCost || 0), 0);

  const saveMutation = useMutation({
    mutationFn: (data: typeof form) =>
      editVehicle
        ? api.put(`/vehicles/${editVehicle.id}`, data)
        : api.post('/vehicles', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      setShowModal(false);
      setEditVehicle(null);
      setForm(emptyForm);
      setFormError('');
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setFormError(err.response?.data?.error || 'Failed to save vehicle');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });

  const openCreate = () => {
    setEditVehicle(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditVehicle(v);
    setForm({
      registrationNumber: v.registrationNumber,
      nameModel: v.nameModel,
      type: v.type,
      maxLoadCapacityKg: String(v.maxLoadCapacityKg),
      odometer: String(v.odometer),
      acquisitionCost: String(v.acquisitionCost),
    });
    setFormError('');
    setShowModal(true);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Vehicle Registry</h1>
          <p className="text-gray-500 text-sm">{vehicles.length} vehicles in fleet</p>
        </div>
        {canEdit && (
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> Add Vehicle
          </button>
        )}
      </div>

      {isFinance && (
        <div className="bg-dark-700 p-5 rounded-xl border border-dark-500 flex flex-wrap gap-8 items-center">
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Fleet Asset Value</p>
            <p className="text-2xl font-bold text-accent-amber">₹{totalFleetValue.toLocaleString()}</p>
          </div>
          <div className="h-10 w-px bg-dark-500 hidden sm:block" />
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Assets</p>
            <p className="text-xl font-bold text-white">{vehicles.length}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search registration..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input w-56"
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="select w-36">
          <option value="All">All Types</option>
          {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select w-36">
          {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s === 'OnTrip' ? 'On Trip' : s === 'InShop' ? 'In Shop' : s}</option>)}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-amber" /></div>
      ) : vehicles.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center border-dashed border-2 border-dark-500 bg-dark-700/30">
          <div className="w-16 h-16 bg-dark-600 rounded-full flex items-center justify-center mb-4">
            <Truck size={24} className="text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No vehicles found</h3>
          <p className="text-gray-400 text-sm max-w-sm">There are no vehicles in the registry matching your current criteria ("{typeFilter}" / "{statusFilter}").</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[65vh]">
            <table className="w-full relative">
              <thead className="bg-dark-600 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="table-header">Reg. Number</th>
                  <th className="table-header">Model</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Capacity (kg)</th>
                  <th className="table-header">Odometer (km)</th>
                  <th className="table-header">Acq. Cost (₹)</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Documents</th>
                  {canEdit && <th className="table-header">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => {
                  const hasValidDocs = v.documents && v.documents.length > 0 && v.documents.every(d => new Date(d.expiryDate) > new Date());
                  const hasExpiringDocs = v.documents && v.documents.some(d => new Date(d.expiryDate) < new Date());

                  return (
                    <tr key={v.id} className="table-row">
                      <td className="table-cell font-mono font-semibold text-accent-amber">{v.registrationNumber}</td>
                      <td className="table-cell text-white font-medium">{v.nameModel}</td>
                      <td className="table-cell text-gray-400">{v.type}</td>
                      <td className="table-cell tabular-nums">{v.maxLoadCapacityKg.toLocaleString()}</td>
                      <td className="table-cell tabular-nums">{v.odometer.toLocaleString()}</td>
                      <td className="table-cell tabular-nums">₹{v.acquisitionCost.toLocaleString()}</td>
                      <td className="table-cell"><StatusBadge status={v.status} size="sm" /></td>
                      <td className="table-cell">
                        <button
                          onClick={() => setSelectedDocVehicle(v)}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-colors ${
                            hasExpiringDocs || !v.documents?.length
                              ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          }`}
                        >
                          {hasExpiringDocs || !v.documents?.length ? <AlertCircle size={12} /> : <CheckCircle size={12} />}
                          {v.documents?.length || 0} Docs
                        </button>
                      </td>
                      {canEdit && (
                        <td className="table-cell">
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(v)} className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-500 rounded transition-colors">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => { if (confirm('Delete vehicle?')) deleteMutation.mutate(v.id); }} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal title={editVehicle ? 'Edit Vehicle' : 'Add Vehicle'} onClose={() => setShowModal(false)}>
          <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Registration Number *</label>
                <input className="input" value={form.registrationNumber} onChange={e => setForm(f => ({ ...f, registrationNumber: e.target.value }))} placeholder="MH-12-AB-1234" required />
              </div>
              <div className="col-span-2">
                <label className="label">Model / Name *</label>
                <input className="input" value={form.nameModel} onChange={e => setForm(f => ({ ...f, nameModel: e.target.value }))} placeholder="Tata Ace Gold" required />
              </div>
              <div>
                <label className="label">Type *</label>
                <select className="select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Max Capacity (kg) *</label>
                <input type="number" className="input" value={form.maxLoadCapacityKg} onChange={e => setForm(f => ({ ...f, maxLoadCapacityKg: e.target.value }))} placeholder="1000" required />
              </div>
              <div>
                <label className="label">Odometer (km)</label>
                <input type="number" className="input" value={form.odometer} onChange={e => setForm(f => ({ ...f, odometer: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <label className="label">Acquisition Cost (₹) *</label>
                <input type="number" className="input" value={form.acquisitionCost} onChange={e => setForm(f => ({ ...f, acquisitionCost: e.target.value }))} placeholder="650000" required />
              </div>
            </div>
            {formError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{formError}</div>}
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saveMutation.isPending} className="btn-primary">
                {saveMutation.isPending ? 'Saving...' : editVehicle ? 'Update Vehicle' : 'Add Vehicle'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Vehicle Documents Modal */}
      {selectedDocVehicle && (
        <Modal
          title={`Documents: ${selectedDocVehicle.registrationNumber}`}
          onClose={() => setSelectedDocVehicle(null)}
          size="lg"
        >
          <div className="space-y-6">
            {/* Document Listing Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-500">
                    <th className="table-header py-2 text-xs">Doc Type</th>
                    <th className="table-header py-2 text-xs">Doc Number</th>
                    <th className="table-header py-2 text-xs">Expiry Date</th>
                    <th className="table-header py-2 text-xs">Status</th>
                    {canEdit && <th className="table-header py-2 text-xs">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 5 : 4} className="table-cell text-center text-gray-500 py-6 text-xs">
                        No documents logged for this asset.
                      </td>
                    </tr>
                  ) : (
                    documents.map(doc => {
                      const isExpired = new Date(doc.expiryDate) < new Date();
                      return (
                        <tr key={doc.id} className="table-row">
                          <td className="table-cell py-2 text-xs font-semibold">{doc.type}</td>
                          <td className="table-cell py-2 text-xs font-mono text-gray-400">{doc.docNumber}</td>
                          <td className={`table-cell py-2 text-xs ${isExpired ? 'text-red-400' : 'text-gray-300'}`}>
                            {new Date(doc.expiryDate).toLocaleDateString('en-IN')}
                          </td>
                          <td className="table-cell py-2 text-xs">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${isExpired ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                              {isExpired ? 'Expired' : 'Active'}
                            </span>
                          </td>
                          {canEdit && (
                            <td className="table-cell py-2 text-xs">
                              <button
                                onClick={() => {
                                  if (confirm('Delete this document?')) {
                                    deleteDocMutation.mutate(doc.id);
                                  }
                                }}
                                className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Document Section (Only for FleetManager) */}
            {canEdit && (
              <div className="pt-4 border-t border-dark-500 space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Log New Document</h3>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    addDocMutation.mutate(docForm);
                  }}
                  className="grid grid-cols-3 gap-3 items-end"
                >
                  <div>
                    <label className="label text-[10px]">Doc Type</label>
                    <select
                      className="select py-2 text-xs"
                      value={docForm.type}
                      onChange={e => setDocForm(f => ({ ...f, type: e.target.value }))}
                    >
                      <option value="Insurance">Insurance</option>
                      <option value="Permit">Permit</option>
                      <option value="Pollution">Pollution Certificate</option>
                      <option value="Registration">Registration Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-[10px]">Document Number</label>
                    <input
                      type="text"
                      className="input py-2 text-xs"
                      placeholder="POL-12345"
                      value={docForm.docNumber}
                      onChange={e => setDocForm(f => ({ ...f, docNumber: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label text-[10px]">Expiry Date</label>
                    <input
                      type="date"
                      className="input py-2 text-xs"
                      value={docForm.expiryDate}
                      onChange={e => setDocForm(f => ({ ...f, expiryDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-span-3 flex justify-between items-center pt-2">
                    {docFormError && <span className="text-xs text-red-400">{docFormError}</span>}
                    <div />
                    <button
                      type="submit"
                      disabled={addDocMutation.isPending}
                      className="btn-primary py-1.5 px-3 text-xs"
                    >
                      {addDocMutation.isPending ? 'Logging...' : '+ Log Document'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
