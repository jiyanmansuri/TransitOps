import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Users, Map, Wrench,
  Fuel, BarChart3, Settings, LogOut, Zap
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { canAccess, Module } from '../hooks/useRBAC';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  module: Module;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard', module: 'Dashboard' },
  { to: '/fleet', icon: <Truck size={18} />, label: 'Fleet', module: 'Fleet' },
  { to: '/drivers', icon: <Users size={18} />, label: 'Drivers', module: 'Drivers' },
  { to: '/trips', icon: <Map size={18} />, label: 'Trips', module: 'Trips' },
  { to: '/maintenance', icon: <Wrench size={18} />, label: 'Maintenance', module: 'Maintenance' },
  { to: '/fuel', icon: <Fuel size={18} />, label: 'Fuel & Expenses', module: 'Fuel' },
  { to: '/analytics', icon: <BarChart3 size={18} />, label: 'Analytics', module: 'Analytics' },
  { to: '/settings', icon: <Settings size={18} />, label: 'Settings', module: 'Settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-60 flex-shrink-0 bg-dark-900 border-r border-dark-500 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-dark-500">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-amber flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm tracking-wide">TransitOps</div>
            <div className="text-gray-500 text-[10px]">Smart Transport Platform</div>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon, label, module }) => {
          if (!user || !canAccess(user.role, module)) return null;
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border active:scale-[0.97] ${
                  isActive
                    ? 'bg-accent-amber/10 backdrop-blur-md text-accent-amber-light border-accent-amber/35 shadow-md shadow-accent-amber/5 font-semibold'
                    : 'text-gray-400 border-transparent hover:text-gray-100 hover:bg-white/5 hover:backdrop-blur-sm hover:border-white/10'
                }`
              }
            >
              {icon}
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-dark-500">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-full bg-accent-amber/20 flex items-center justify-center text-accent-amber font-bold text-xs">
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{user?.name}</div>
            <div className="text-gray-500 text-[10px] truncate">{user?.role}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg text-xs font-medium transition-all"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
