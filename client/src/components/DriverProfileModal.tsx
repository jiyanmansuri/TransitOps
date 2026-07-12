import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import { AlertTriangle, Map, FileText, CheckCircle, Shield, Clock } from 'lucide-react';

interface DriverProfileModalProps {
  driverId: string;
  onClose: () => void;
}

export default function DriverProfileModal({ driverId, onClose }: DriverProfileModalProps) {
  const { data: driver, isLoading } = useQuery({
    queryKey: ['driver', driverId],
    queryFn: () => api.get(`/drivers/${driverId}`).then(r => r.data)
  });

  if (isLoading || !driver) {
    return (
      <Modal title="Driver Profile" onClose={onClose}>
        <div className="p-8 text-center text-gray-500">Loading profile...</div>
      </Modal>
    );
  }

  const isExpired = new Date(driver.licenseExpiryDate) < new Date();
  const certExpired = driver.medicalCertExpiry && new Date(driver.medicalCertExpiry) < new Date();

  return (
    <Modal title="Driver Safety Profile" onClose={onClose} size="lg">
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="flex items-start justify-between bg-dark-700 p-5 rounded-xl border border-dark-500">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-dark-500 flex items-center justify-center text-xl font-bold text-gray-300">
              {driver.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {driver.name}
                <StatusBadge status={driver.status} size="sm" />
              </h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                <span className="flex items-center gap-1.5"><FileText size={14} /> {driver.licenseNumber} ({driver.licenseCategory})</span>
                <span className="text-gray-500">|</span>
                <span>{driver.contactNumber}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Overall Safety Score</div>
            <div className={`text-3xl font-extrabold ${driver.safetyScore >= 80 ? 'text-emerald-400' : driver.safetyScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
              {driver.safetyScore}%
            </div>
          </div>
        </div>

        {/* Credentials & Alerts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4">
            <h3 className="section-title mb-4"><Shield size={16} /> Active Alerts</h3>
            {driver.activeIncidents?.length > 0 ? (
              <div className="space-y-2">
                {driver.activeIncidents.map((inc: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                    <AlertTriangle size={14} /> {inc}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                <CheckCircle size={14} /> No active safety violations
              </div>
            )}
          </div>
          
          <div className="card p-4">
            <h3 className="section-title mb-4"><FileText size={16} /> Certifications</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">License Expiry</span>
                <span className={`font-medium ${isExpired ? 'text-red-400' : 'text-gray-200'}`}>
                  {new Date(driver.licenseExpiryDate).toLocaleDateString('en-IN')}
                  {isExpired && ' (Expired)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Medical Cert</span>
                <span className={`font-medium ${certExpired ? 'text-red-400' : 'text-gray-200'}`}>
                  {driver.medicalCertExpiry ? new Date(driver.medicalCertExpiry).toLocaleDateString('en-IN') : 'N/A'}
                  {certExpired && ' (Expired)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Trips History */}
        <div>
          <h3 className="section-title"><Map size={16} /> Trip History (Last 5)</h3>
          {driver.trips && driver.trips.length > 0 ? (
            <div className="border border-dark-500 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-dark-600">
                  <tr>
                    <th className="table-header py-2 text-xs">Code</th>
                    <th className="table-header py-2 text-xs">Route</th>
                    <th className="table-header py-2 text-xs">Vehicle</th>
                    <th className="table-header py-2 text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {driver.trips.slice(0, 5).map((t: any) => (
                    <tr key={t.id} className="table-row">
                      <td className="table-cell py-3 font-mono text-gray-300 text-xs">{t.tripCode}</td>
                      <td className="table-cell py-3 text-xs">{t.source} → {t.destination}</td>
                      <td className="table-cell py-3 text-xs">{t.vehicle?.registrationNumber || 'N/A'}</td>
                      <td className="table-cell py-3"><StatusBadge status={t.status} size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center p-6 text-gray-500 bg-dark-700/50 rounded-xl border border-dark-500">
              No trips recorded for this driver.
            </div>
          )}
        </div>

      </div>
    </Modal>
  );
}
