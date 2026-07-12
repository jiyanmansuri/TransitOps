import { Search, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const roleColors: Record<string, string> = {
  FleetManager: 'bg-blue-500/20 text-blue-300',
  Dispatcher: 'bg-purple-500/20 text-purple-300',
  SafetyOfficer: 'bg-emerald-500/20 text-emerald-300',
  FinancialAnalyst: 'bg-amber-500/20 text-amber-300',
};

export default function TopBar() {
  const { user } = useAuth();

  return (
    <header className="h-14 bg-dark-800 border-b border-dark-500 flex items-center px-6 gap-4 sticky top-0 z-10">
      {/* Search */}
      <div className="flex-1 max-w-sm relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search vehicles, drivers, trips..."
          className="input pl-9 h-9 bg-dark-700"
        />
      </div>

      <div className="flex-1" />

      {/* Notification bell */}
      <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-dark-600 transition-colors">
        <Bell size={17} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent-amber" />
      </button>

      {/* User info */}
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
