import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Plus, AlertTriangle, CheckCircle, XCircle, ArrowRight, Navigation, Search, Clock } from 'lucide-react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import TripDetailsModal from '../components/TripDetailsModal';
import SmartDispatchPanel from '../components/SmartDispatchPanel';
import { useAuth } from '../hooks/useAuth';
import { canAccess } from '../hooks/useRBAC';

interface Trip {
  id: string;
  tripCode: string;
  source: string;
  destination: string;
  cargoWeightKg: number;
  plannedDistanceKm: number;
  status: string;
  eta?: string;
  notes?: string;
  vehicle: { registrationNumber: string; nameModel: string; maxLoadCapacityKg: number };
  driver: { name: string; licenseNumber: string };
  createdAt: string;
  dispatchedAt?: string;
}

interface Vehicle { id: string; registrationNumber: string; nameModel: string; maxLoadCapacityKg: number; }
interface Driver { id: string; name: string; licenseNumber: string; }

const emptyForm = {
  source: '', destination: '', vehicleId: '', driverId: '',
  cargoWeightKg: '', plannedDistanceKm: '', eta: '', notes: ''
};

const emptyCompleteForm = { finalOdometer: '', fuelConsumed: '', toll: '', otherExpenses: '' };

const STEPPER = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];

export default function TripsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canEdit = canAccess(user?.role || '', 'Trips', 'edit');
  const [searchParams, setSearchParams] = useSearchParams();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreate(true);
    }
  }, [searchParams]);

  const closeCreateModal = () => {
    setShowCreate(false);
    setSearchParams({});
  };
  const [showComplete, setShowComplete] = useState<Trip | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [completeForm, setCompleteForm] = useState(emptyCompleteForm);
  const [formError, setFormError] = useState('');
  const [capacityWarning, setCapacityWarning] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const { data: allTrips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ['trips'],
    queryFn: () => api.get('/trips').then(r => r.data),
    refetchInterval: 15000,
  });

  const trips = useMemo(() => {
    return allTrips.filter(t => {
      const matchesTab = activeTab === 'All' || t.status === activeTab;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        t.tripCode.toLowerCase().includes(q) ||
        (t.driver?.name || '').toLowerCase().includes(q) ||
        (t.vehicle?.registrationNumber || '').toLowerCase().includes(q) ||
        t.source.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q);
      
      return matchesTab && matchesSearch;
    });
  }, [allTrips, activeTab, searchQuery]);

  const { data: availableVehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['vehicles-available'],
    queryFn: () => api.get('/vehicles/available').then(r => r.data),
    enabled: showCreate,
  });

  const { data: eligibleDrivers = [] } = useQuery<Driver[]>({
    queryKey: ['drivers-eligible'],
    queryFn: () => api.get('/drivers/eligible').then(r => r.data),
    enabled: showCreate,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/trips', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      closeCreateModal();
      setForm(emptyForm);
      setFormError('');
      setCapacityWarning('');
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setFormError(err.response?.data?.error || 'Failed to create trip');
    },
  });

  const dispatchMutation = useMutation({
    mutationFn: (id: string) => api.post(`/trips/${id}/dispatch`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['drivers'] });
    },
    onError: (err: { response?: { data?: { error?: string; details?: { message?: string } } } }) => {
      const msg = err.response?.data?.details?.message || err.response?.data?.error || 'Dispatch failed';
      alert(msg);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.post(`/trips/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['drivers'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof completeForm }) => api.post(`/trips/${id}/complete`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['drivers'] });
      setShowComplete(null);
      setCompleteForm(emptyCompleteForm);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      alert(err.response?.data?.error || 'Failed to complete trip');
    },
  });

  // Check capacity when vehicle or cargo changes
  const checkCapacity = (vehicleId: string, cargoKg: string) => {
    if (!vehicleId || !cargoKg) { setCapacityWarning(''); return; }
    const vehicle = availableVehicles.find(v => v.id === vehicleId);
    if (!vehicle) { setCapacityWarning(''); return; }
    const cargo = parseFloat(cargoKg);
    if (cargo > vehicle.maxLoadCapacityKg) {
      const excess = cargo - vehicle.maxLoadCapacityKg;
      setCapacityWarning(
        `Vehicle Capacity: ${vehicle.maxLoadCapacityKg} kg / Cargo Weight: ${cargo} kg / Capacity exceeded by ${excess} kg — dispatch will be blocked`
      );
    } else {
      setCapacityWarning('');
    }
  };

  const activeLiveTrips = useMemo(() => {
    return allTrips.filter(t => {
      if (t.status !== 'Dispatched') return false;
      const q = searchQuery.toLowerCase();
      if (!q) return true;
      return t.tripCode.toLowerCase().includes(q) ||
        (t.driver?.name || '').toLowerCase().includes(q) ||
        (t.vehicle?.registrationNumber || '').toLowerCase().includes(q) ||
        t.source.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q);
    });
  }, [allTrips, searchQuery]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Trip Dispatcher</h1>
          <p className="text-gray-500 text-sm">{allTrips.length} total trips</p>
        </div>
        {canEdit && (
          <button onClick={() => { setShowCreate(true); setForm(emptyForm); setFormError(''); setCapacityWarning(''); }} className="btn-primary">
            <Plus size={16} /> Create Trip
          </button>
        )}
      </div>

      {/* Trip Lifecycle Stepper */}
      <div className="card">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Trip Lifecycle</p>
        <div className="flex items-center gap-0">
          {STEPPER.map((step, i) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border ${
                step === 'Draft' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                step === 'Dispatched' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                step === 'Completed' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                'bg-red-500/15 text-red-400 border-red-500/30'
              }`}>
                <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[10px]">{i + 1}</span>
                {step}
              </div>
              {i < STEPPER.length - 1 && <ArrowRight size={14} className="text-gray-600 mx-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Live Board */}
      {activeLiveTrips.length > 0 && (
        <div>
          <h2 className="section-title flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Live Board
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeLiveTrips.map(trip => (
              <div key={trip.id} className="card border-l-4 border-l-blue-500">
                <div className="flex items-start justify-between mb-3">
                  <span className="font-mono text-accent-amber font-bold text-sm">{trip.tripCode}</span>
                  <StatusBadge status={trip.status} size="sm" />
                </div>
                <div className="flex items-center gap-1.5 text-sm text-white font-medium mb-2">
                  <span>{trip.source}</span>
                  <Navigation size={12} className="text-blue-400" />
                  <span>{trip.destination}</span>
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>🚛 {trip.vehicle?.registrationNumber} — {trip.vehicle?.nameModel}</div>
                  <div>👤 {trip.driver?.name}</div>
                  {trip.eta && <div>⏱ ETA: {new Date(trip.eta).toLocaleString('en-IN')}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters + Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-dark-500 pb-px">
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'All', label: `All Trips ${allTrips.length}` },
            { id: 'Draft', label: `Draft ${allTrips.filter(t => t.status === 'Draft').length}` },
            { id: 'Dispatched', label: `Dispatched ${allTrips.filter(t => t.status === 'Dispatched').length}` },
            { id: 'Completed', label: `Completed ${allTrips.filter(t => t.status === 'Completed').length}` },
            { id: 'Cancelled', label: `Cancelled ${allTrips.filter(t => t.status === 'Cancelled').length}` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'border-accent-amber text-accent-amber' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            >
              {tab.label.replace(/[0-9]+$/, '')}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-accent-amber/20 text-accent-amber' : 'bg-dark-600 text-gray-400'}`}>
                {tab.label.match(/[0-9]+$/)?.[0]}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64 shrink-0 mt-2 md:mt-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search trips, drivers, routes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full pl-9 py-2 text-sm"
          />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-600">
              <tr>
                <th className="table-header">Code</th>
                <th className="table-header">Route</th>
                <th className="table-header">Scheduled / ETA</th>
                <th className="table-header">Vehicle</th>
                <th className="table-header">Driver</th>
                <th className="table-header">Cargo (kg)</th>
                <th className="table-header">Est. Revenue</th>
                <th className="table-header">Status</th>
                {canEdit && <th className="table-header">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="table-cell text-center text-gray-500 py-12">Loading...</td></tr>
              ) : trips.length === 0 ? (
                <tr><td colSpan={canEdit ? 9 : 8} className="table-cell text-center text-gray-500 py-12">No trips found</td></tr>
              ) : trips.map(trip => (
                <tr key={trip.id} className="table-row">
                  <td 
                    className="table-cell font-mono text-accent-amber font-bold cursor-pointer hover:underline"
                    onClick={() => setSelectedTrip(trip)}
                  >
                    {trip.tripCode}
                  </td>
                  <td className="table-cell text-sm">
                    <span className="text-white">{trip.source}</span>
                    <span className="text-gray-600 mx-1">→</span>
                    <span className="text-gray-300">{trip.destination}</span>
                  </td>
                  <td className="table-cell">
                    {trip.eta ? (
                      <span className="flex items-center gap-1.5 text-gray-300 text-xs">
                        <Clock size={12} className="text-gray-400" />
                        {new Date(trip.eta).toLocaleString('en-IN', {
                          month: 'short', day: 'numeric',
                          hour: 'numeric', minute: '2-digit', hour12: true
                        })}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-xs italic">—</span>
                    )}
                  </td>
                  <td className="table-cell text-gray-400 text-xs">{trip.vehicle?.registrationNumber || '—'}</td>
                  <td className="table-cell text-gray-300">{trip.driver?.name || '—'}</td>
                  <td className="table-cell tabular-nums">{trip.cargoWeightKg}</td>
                  <td className="table-cell">
                    <div className="flex flex-col">
                      <span className="text-emerald-400 font-medium text-sm">
                        ₹{(trip.plannedDistanceKm * 50).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-gray-500">{trip.plannedDistanceKm} km</span>
                    </div>
                  </td>
                  <td className="table-cell"><StatusBadge status={trip.status} size="sm" /></td>
                  {canEdit && (
                    <td className="table-cell">
                      <div className="flex gap-1.5">
                        {trip.status === 'Draft' && (
                          <>
                            <button
                              onClick={() => dispatchMutation.mutate(trip.id)}
                              disabled={dispatchMutation.isPending}
                              className="px-2.5 py-1 text-xs bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/30 rounded-lg font-semibold transition-colors"
                            >
                              Dispatch
                            </button>
                            <button
                              onClick={() => { if (confirm('Cancel trip?')) cancelMutation.mutate(trip.id); }}
                              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        {trip.status === 'Dispatched' && (
                          <>
                            <button
                              onClick={() => { setShowComplete(trip); setCompleteForm(emptyCompleteForm); }}
                              className="px-2.5 py-1 text-xs bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-lg font-semibold transition-colors"
                            >
                              <CheckCircle size={12} className="inline mr-1" />Complete
                            </button>
                            <button
                              onClick={() => { if (confirm('Cancel this dispatched trip?')) cancelMutation.mutate(trip.id); }}
                              className="px-2.5 py-1 text-xs bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30 rounded-lg font-semibold transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Trip Modal */}
      {showCreate && (
        <Modal title="Create Trip" onClose={closeCreateModal} size="lg">
          <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
            {/* Smart Dispatch Assistant */}
            <SmartDispatchPanel
              cargoWeightKg={form.cargoWeightKg}
              currentVehicleId={form.vehicleId}
              currentDriverId={form.driverId}
              onAccept={(vehicleId, driverId) => {
                setForm(f => ({ ...f, vehicleId, driverId }));
                checkCapacity(vehicleId, form.cargoWeightKg);
              }}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Source *</label>
                <input className="input" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="Mumbai" required />
              </div>
              <div>
                <label className="label">Destination *</label>
                <input className="input" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} placeholder="Pune" required />
              </div>
              <div>
                <label className="label">Vehicle (Available only) *</label>
                <select className="select" value={form.vehicleId} onChange={e => {
                  setForm(f => ({ ...f, vehicleId: e.target.value }));
                  checkCapacity(e.target.value, form.cargoWeightKg);
                }} required>
                  <option value="">Select vehicle...</option>
                  {availableVehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registrationNumber} — {v.nameModel} ({v.maxLoadCapacityKg}kg)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Driver (Eligible only) *</label>
                <select className="select" value={form.driverId} onChange={e => setForm(f => ({ ...f, driverId: e.target.value }))} required>
                  <option value="">Select driver...</option>
                  {eligibleDrivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} — {d.licenseNumber}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Cargo Weight (kg) *</label>
                <input type="number" className="input" value={form.cargoWeightKg}
                  onChange={e => {
                    setForm(f => ({ ...f, cargoWeightKg: e.target.value }));
                    checkCapacity(form.vehicleId, e.target.value);
                  }}
                  placeholder="500" required />
              </div>
              <div>
                <label className="label">Planned Distance (km) *</label>
                <input type="number" className="input" value={form.plannedDistanceKm} onChange={e => setForm(f => ({ ...f, plannedDistanceKm: e.target.value }))} placeholder="200" required />
              </div>
              <div>
                <label className="label">ETA (optional)</label>
                <input type="datetime-local" className="input" value={form.eta} onChange={e => setForm(f => ({ ...f, eta: e.target.value }))} />
              </div>
              <div>
                <label className="label">Notes</label>
                <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
              </div>
            </div>

            {/* Capacity warning inline */}
            {capacityWarning && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{capacityWarning}</p>
              </div>
            )}

            {formError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{formError}</div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={closeCreateModal} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                {createMutation.isPending ? 'Creating...' : 'Create Trip (Draft)'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Complete Trip Modal */}
      {showComplete && (
        <Modal title={`Complete Trip ${showComplete.tripCode}`} onClose={() => setShowComplete(null)}>
          <form onSubmit={e => { e.preventDefault(); completeMutation.mutate({ id: showComplete.id, data: completeForm }); }} className="space-y-4">
            <div className="p-3 rounded-lg bg-dark-600 text-xs text-gray-400 space-y-1">
              <p><span className="text-gray-300">Route:</span> {showComplete.source} → {showComplete.destination}</p>
              <p><span className="text-gray-300">Vehicle:</span> {showComplete.vehicle?.registrationNumber}</p>
              <p><span className="text-gray-300">Driver:</span> {showComplete.driver?.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Final Odometer (km) *</label>
                <input type="number" className="input" value={completeForm.finalOdometer} onChange={e => setCompleteForm(f => ({ ...f, finalOdometer: e.target.value }))} placeholder="12600" required />
              </div>
              <div>
                <label className="label">Fuel Consumed (liters) *</label>
                <input type="number" step="0.1" className="input" value={completeForm.fuelConsumed} onChange={e => setCompleteForm(f => ({ ...f, fuelConsumed: e.target.value }))} placeholder="18.5" required />
              </div>
              <div>
                <label className="label">Toll Expenses (₹)</label>
                <input type="number" className="input" value={completeForm.toll} onChange={e => setCompleteForm(f => ({ ...f, toll: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <label className="label">Other Expenses (₹)</label>
                <input type="number" className="input" value={completeForm.otherExpenses} onChange={e => setCompleteForm(f => ({ ...f, otherExpenses: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <p className="text-xs text-gray-500">On completion: FuelLog will be created, vehicle odometer updated, vehicle & driver reverted to Available, expense record created.</p>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowComplete(null)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={completeMutation.isPending} className="btn-success">
                {completeMutation.isPending ? 'Completing...' : 'Complete Trip'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {selectedTrip && <TripDetailsModal trip={selectedTrip} onClose={() => setSelectedTrip(null)} />}
    </div>
  );
}
