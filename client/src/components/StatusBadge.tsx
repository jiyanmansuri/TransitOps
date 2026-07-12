type Status =
  | 'Available' | 'OnTrip' | 'InShop' | 'Retired'
  | 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled'
  | 'Active' | 'OffDuty' | 'Suspended' | 'Pending'
  | string;

const statusConfig: Record<string, { label: string; className: string }> = {
  Available:  { label: 'Available',   className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  OnTrip:     { label: 'On Trip',     className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  InShop:     { label: 'In Shop',     className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  Retired:    { label: 'Retired',     className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  Draft:      { label: 'Draft',       className: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
  Dispatched: { label: 'Dispatched',  className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  Completed:  { label: 'Completed',   className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  Cancelled:  { label: 'Cancelled',   className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  Active:     { label: 'Active',      className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  OffDuty:    { label: 'Off Duty',    className: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
  Suspended:  { label: 'Suspended',   className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  Pending:    { label: 'Pending',     className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
};

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-500/15 text-gray-400 border-gray-500/30' };
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-semibold border ${config.className} ${sizeClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {config.label}
    </span>
  );
}
