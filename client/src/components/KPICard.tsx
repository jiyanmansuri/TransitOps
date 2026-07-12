interface KPICardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accentColor?: 'amber' | 'blue' | 'green' | 'red' | 'purple';
  subtitle?: string;
}

import React from 'react';

const borderColors = {
  amber:  'border-l-amber-500',
  blue:   'border-l-blue-500',
  green:  'border-l-emerald-500',
  red:    'border-l-red-500',
  purple: 'border-l-purple-500',
};

const iconColors = {
  amber:  'bg-amber-500/15 text-amber-400',
  blue:   'bg-blue-500/15 text-blue-400',
  green:  'bg-emerald-500/15 text-emerald-400',
  red:    'bg-red-500/15 text-red-400',
  purple: 'bg-purple-500/15 text-purple-400',
};

export default function KPICard({ label, value, icon, accentColor = 'amber', subtitle }: KPICardProps) {
  return (
    <div className={`card border-l-4 ${borderColors[accentColor]} flex items-start justify-between gap-3`}>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-100 tabular-nums">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {icon && (
        <div className={`p-2.5 rounded-lg ${iconColors[accentColor]} flex-shrink-0`}>
          {icon}
        </div>
      )}
    </div>
  );
}
