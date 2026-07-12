import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { canAccess, Module } from '../hooks/useRBAC';

interface ProtectedRouteProps {
  children: React.ReactNode;
  module: Module;
  action?: 'view' | 'edit';
}

export default function ProtectedRoute({ children, module, action = 'view' }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-amber" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!canAccess(user.role, module, action)) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-6xl">🔒</div>
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-gray-400 text-sm">
          Your role <span className="text-accent-amber font-semibold">{user.role}</span> does not have {action} access to {module}.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
