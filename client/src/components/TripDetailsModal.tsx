import React from 'react';
import { X, Navigation, Truck, User, Calendar, MapPin, Package, Settings, Route } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface TripDetailsModalProps {
  trip: any;
  onClose: () => void;
}

export default function TripDetailsModal({ trip, onClose }: TripDetailsModalProps) {
  if (!trip) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="bg-dark-800 border border-dark-500 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-500 bg-dark-700/50">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white font-mono">{trip.tripCode}</h2>
            <StatusBadge status={trip.status} />
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8">
          {/* Route Section */}
          <div className="relative">
            <div className="absolute top-5 left-[19px] bottom-5 w-0.5 bg-dark-500" />
            
            <div className="flex gap-4 items-start relative mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center shrink-0 z-10">
                <MapPin size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Origin</p>
                <p className="text-lg font-medium text-white">{trip.source}</p>
              </div>
            </div>

            <div className="flex gap-4 items-start relative">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0 z-10">
                <Navigation size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Destination</p>
                <p className="text-lg font-medium text-white">{trip.destination}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Asset Info */}
            <div className="bg-dark-700/50 rounded-xl p-4 border border-dark-500">
              <div className="flex items-center gap-2 text-accent-amber mb-3">
                <Truck size={16} />
                <h3 className="font-semibold text-sm">Vehicle Details</h3>
              </div>
              {trip.vehicle ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Registration</span>
                    <span className="text-white text-xs font-medium">{trip.vehicle.registrationNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Model</span>
                    <span className="text-white text-xs font-medium">{trip.vehicle.nameModel}</span>
                  </div>
                </div>
              ) : (
                <span className="text-gray-500 text-sm italic">Not assigned</span>
              )}
            </div>

            {/* Driver Info */}
            <div className="bg-dark-700/50 rounded-xl p-4 border border-dark-500">
              <div className="flex items-center gap-2 text-blue-400 mb-3">
                <User size={16} />
                <h3 className="font-semibold text-sm">Driver Details</h3>
              </div>
              {trip.driver ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Name</span>
                    <span className="text-white text-xs font-medium">{trip.driver.name}</span>
                  </div>
                </div>
              ) : (
                <span className="text-gray-500 text-sm italic">Not assigned</span>
              )}
            </div>
            
            {/* Logistics Info */}
            <div className="bg-dark-700/50 rounded-xl p-4 border border-dark-500">
              <div className="flex items-center gap-2 text-purple-400 mb-3">
                <Package size={16} />
                <h3 className="font-semibold text-sm">Logistics</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs">Cargo Weight</span>
                  <span className="text-white text-xs font-medium">{trip.cargoWeightKg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs">Distance</span>
                  <span className="text-white text-xs font-medium">{trip.plannedDistanceKm} km</span>
                </div>
              </div>
            </div>

            {/* Schedule Info */}
            <div className="bg-dark-700/50 rounded-xl p-4 border border-dark-500">
              <div className="flex items-center gap-2 text-emerald-400 mb-3">
                <Calendar size={16} />
                <h3 className="font-semibold text-sm">Schedule</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs">ETA</span>
                  <span className="text-white text-xs font-medium">
                    {trip.eta ? new Date(trip.eta).toLocaleString('en-IN') : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs">Created</span>
                  <span className="text-white text-xs font-medium">
                    {trip.createdAt ? new Date(trip.createdAt).toLocaleString('en-IN') : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-dark-500 bg-dark-700/30 flex justify-end">
          <button onClick={onClose} className="btn-secondary">Close Details</button>
        </div>
      </div>
    </div>
  );
}
