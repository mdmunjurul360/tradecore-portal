export function StatusPill({ status }: { status: string }) {
  const active = status === 'ACTIVE';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${active ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {active ? 'Active' : 'Disabled'}
    </span>
  );
}

export function KycPill({ status }: { status?: string }) {
  const s = status || 'PENDING';
  const cls =
    s === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-500'
    : s === 'REJECTED' ? 'bg-red-500/15 text-red-500'
    : 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400';
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{s}</span>;
}
