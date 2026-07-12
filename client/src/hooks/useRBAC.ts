export type Module = 'Fleet' | 'Drivers' | 'Trips' | 'Fuel' | 'Analytics' | 'Dashboard' | 'Maintenance' | 'Settings';
export type Action = 'view' | 'edit' | 'none';

const RBAC_MATRIX: Record<string, Record<Module, Action>> = {
  FleetManager: { Dashboard: 'view', Fleet: 'edit', Drivers: 'edit', Trips: 'none', Maintenance: 'edit', Fuel: 'none', Analytics: 'edit', Settings: 'edit' },
  Dispatcher: { Dashboard: 'view', Fleet: 'view', Drivers: 'none', Trips: 'edit', Maintenance: 'none', Fuel: 'none', Analytics: 'none', Settings: 'none' },
  SafetyOfficer: { Dashboard: 'view', Fleet: 'none', Drivers: 'edit', Trips: 'view', Maintenance: 'none', Fuel: 'none', Analytics: 'none', Settings: 'none' },
  FinancialAnalyst: { Dashboard: 'view', Fleet: 'view', Drivers: 'none', Trips: 'none', Maintenance: 'none', Fuel: 'edit', Analytics: 'edit', Settings: 'none' },
};

export function canAccess(role: string, module: Module, action: Action = 'view'): boolean {
  const permissions = RBAC_MATRIX[role];
  if (!permissions) return false;
  const roleAction = permissions[module];
  if (roleAction === 'none') return false;
  if (action === 'view') return roleAction === 'view' || roleAction === 'edit';
  if (action === 'edit') return roleAction === 'edit';
  return false;
}

export function getRBACMatrix() { return RBAC_MATRIX; }

export function getDefaultRoute(role: string): string {
  switch (role) {
    case 'FleetManager': return '/fleet';
    case 'Dispatcher': return '/trips';
    case 'SafetyOfficer': return '/drivers';
    case 'FinancialAnalyst': return '/fuel';
    default: return '/dashboard';
  }
}
