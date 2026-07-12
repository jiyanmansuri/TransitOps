import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, AlertTriangle, ShieldAlert, Wrench, Navigation, CheckCircle, Truck, User, MapPin } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';

interface Vehicle {
  id: string;
  registrationNumber: string;
  nameModel: string;
  status: string;
  maxLoadCapacityKg: number;
}

interface Driver {
  id: string;
  name: string;
  licenseExpiryDate: string;
  licenseNumber: string;
}

interface Trip {
  id: string;
  tripCode: string;
  source: string;
  destination: string;
  status: string;
  cargoWeightKg: number;
  vehicleId: string;
}

const roleColors: Record<string, string> = {
  FleetManager: 'bg-blue-500/20 text-blue-300',
  Dispatcher: 'bg-purple-500/20 text-purple-300',
  SafetyOfficer: 'bg-emerald-500/20 text-emerald-300',
  FinancialAnalyst: 'bg-amber-500/20 text-amber-300',
};

export default function TopBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Queries for live search & notification engines
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: () => api.get('/vehicles').then(r => r.data),
  });

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: () => api.get('/drivers').then(r => r.data),
  });

  const { data: trips = [] } = useQuery<Trip[]>({
    queryKey: ['trips'],
    queryFn: () => api.get('/trips').then(r => r.data),
  });

  // --- Dynamic Search Engine ---
  const query = searchQuery.trim().toLowerCase();
  
  const matchedVehicles = query.length >= 2 
    ? vehicles.filter(v => v.registrationNumber.toLowerCase().includes(query) || v.nameModel.toLowerCase().includes(query)).slice(0, 3)
    : [];

  const matchedDrivers = query.length >= 2
    ? drivers.filter(d => d.name.toLowerCase().includes(query) || d.licenseNumber.toLowerCase().includes(query)).slice(0, 3)
    : [];

  const matchedTrips = query.length >= 2
    ? trips.filter(t => t.tripCode.toLowerCase().includes(query) || t.source.toLowerCase().includes(query) || t.destination.toLowerCase().includes(query)).slice(0, 3)
    : [];

  const hasSearchResults = matchedVehicles.length > 0 || matchedDrivers.length > 0 || matchedTrips.length > 0;

  // Dynamic alerts builder
  const alerts: Array<{ id: string; title: string; message: string; type: 'danger' | 'warning' | 'info'; icon: React.ReactNode }> = [];

  // 1. License Expiry Checking
  drivers.forEach(d => {
    if (new Date(d.licenseExpiryDate) < new Date()) {
      alerts.push({
        id: `driver-expired-${d.id}`,
        title: 'License Expired',
        message: `Driver ${d.name}'s commercial license has expired! Blocked from active dispatch.`,
        type: 'danger',
        icon: <ShieldAlert className="text-red-400" size={16} />,
      });
    }
  });

  // 2. Cargo Capacity Checking
  trips.forEach(t => {
    if (t.status === 'Draft' || t.status === 'Dispatched') {
      const v = vehicles.find(veh => veh.id === t.vehicleId);
      if (v && t.cargoWeightKg > v.maxLoadCapacityKg) {
        alerts.push({
          id: `trip-overload-${t.id}`,
          title: 'Overload Warning',
          message: `Trip ${t.tripCode} payload (${t.cargoWeightKg}kg) exceeds vehicle capacity limit by ${t.cargoWeightKg - v.maxLoadCapacityKg}kg.`,
          type: 'warning',
          icon: <AlertTriangle className="text-amber-400" size={16} />,
        });
      }
    }
  });

  // 3. Maintenance check
  vehicles.forEach(v => {
    if (v.status === 'InShop') {
      alerts.push({
        id: `vehicle-shop-${v.id}`,
        title: 'Vehicle Servicing',
        message: `Vehicle ${v.registrationNumber} is currently locked inside shop for maintenance repairs.`,
        type: 'info',
        icon: <Wrench className="text-blue-400" size={16} />,
      });
    }
  });

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 bg-dark-800 border-b border-dark-500 flex items-center px-6 gap-4 sticky top-0 z-40">
      {/* Global Search Engine */}
      <div className="flex-1 max-w-sm relative" ref={searchRef}>
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            setShowSearchResults(true);
          }}
          onFocus={() => setShowSearchResults(true)}
          placeholder="Search registration, drivers, routes..."
          className="input pl-9 h-9 bg-dark-700"
        />

        {/* Floating Search Results */}
        {showSearchResults && searchQuery.trim().length >= 2 && (
          <div className="absolute left-0 right-0 mt-2 bg-dark-700 border border-dark-500 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto z-50 divide-y divide-dark-600">
            {/* Header */}
            <div className="p-2 bg-dark-600 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Quick Search Results
            </div>

            {!hasSearchResults ? (
              <div className="p-4 text-center text-xs text-gray-500">
                No matching assets, drivers, or trips found.
              </div>
            ) : (
              <>
                {/* Vehicles Results */}
                {matchedVehicles.length > 0 && (
                  <div className="p-2">
                    <div className="text-[10px] font-bold text-accent-amber uppercase px-2 mb-1">Vehicles</div>
                    {matchedVehicles.map(v => (
                      <button
                        key={v.id}
                        onClick={() => {
                          setShowSearchResults(false);
                          setSearchQuery('');
                          navigate(`/fleet?search=${v.registrationNumber}`);
                        }}
                        className="w-full text-left p-2 hover:bg-dark-600 rounded-lg flex items-center gap-2.5 text-xs text-gray-200"
                      >
                        <Truck size={14} className="text-gray-400" />
                        <span className="font-mono font-bold text-white">{v.registrationNumber}</span>
                        <span className="text-gray-500">—</span>
                        <span>{v.nameModel}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Drivers Results */}
                {matchedDrivers.length > 0 && (
                  <div className="p-2">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase px-2 mb-1">Drivers</div>
                    {matchedDrivers.map(d => (
                      <button
                        key={d.id}
                        onClick={() => {
                          setShowSearchResults(false);
                          setSearchQuery('');
                          navigate(`/drivers`);
                        }}
                        className="w-full text-left p-2 hover:bg-dark-600 rounded-lg flex items-center gap-2.5 text-xs text-gray-200"
                      >
                        <User size={14} className="text-gray-400" />
                        <span className="font-bold text-white">{d.name}</span>
                        <span className="text-gray-500">—</span>
                        <span className="font-mono text-[10px] text-gray-400">{d.licenseNumber}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Trips Results */}
                {matchedTrips.length > 0 && (
                  <div className="p-2">
                    <div className="text-[10px] font-bold text-blue-400 uppercase px-2 mb-1">Trips</div>
                    {matchedTrips.map(t => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setShowSearchResults(false);
                          setSearchQuery('');
                          navigate(`/trips`);
                        }}
                        className="w-full text-left p-2 hover:bg-dark-600 rounded-lg flex items-center gap-2.5 text-xs text-gray-200"
                      >
                        <MapPin size={14} className="text-gray-400" />
                        <span className="font-mono font-bold text-white">{t.tripCode}</span>
                        <span className="text-gray-500">—</span>
                        <span>{t.source} to {t.destination}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Notification Bell Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className={`relative p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-dark-600 transition-colors ${showNotifications ? 'bg-dark-600 text-white' : ''}`}
        >
          <Bell size={17} />
          {alerts.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-amber animate-pulse" />
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 bg-dark-700 border border-dark-500 rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="p-3 bg-dark-600 border-b border-dark-500 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Live System Alerts</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-amber/20 text-accent-amber-light font-bold font-mono">
                {alerts.length} Warnings
              </span>
            </div>
            
            <div className="max-h-64 overflow-y-auto divide-y divide-dark-600">
              {alerts.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-xs flex flex-col items-center gap-2">
                  <CheckCircle size={20} className="text-emerald-400" />
                  No warnings active. All systems normal.
                </div>
              ) : (
                alerts.map(a => (
                  <div key={a.id} className="p-3 hover:bg-dark-600/50 transition-colors flex gap-2.5 items-start">
                    <div className="mt-0.5 flex-shrink-0">{a.icon}</div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white leading-tight">{a.title}</div>
                      <div className="text-[10px] text-gray-400 leading-normal">{a.message}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-2.5 bg-dark-600 text-center border-t border-dark-500">
              <button
                onClick={() => setShowNotifications(false)}
                className="text-[10px] text-gray-400 hover:text-white transition-colors"
              >
                Close Panel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-semibold text-white leading-tight">{user?.name}</div>
          <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${roleColors[user?.role || ''] || 'bg-gray-500/20 text-gray-300'}`}>
            {user?.role}
          </div>
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-amber to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
          {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
      </div>
    </header>
  );
}
