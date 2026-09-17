export function RiskBadge({ level }) {
  const map = {
    HIGH: 'bg-red-50 text-red-700 ring-red-200',
    MEDIUM: 'bg-amber-50 text-amber-700 ring-amber-200',
    LOW: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    UNKNOWN: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${map[level] || map.UNKNOWN}`}>
      {level || 'UNKNOWN'}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    SECURED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    ACTIVE: 'bg-blue-50 text-blue-700 ring-blue-200',
    PENDING: 'bg-amber-50 text-amber-700 ring-amber-200',
    REJECTED: 'bg-slate-100 text-slate-600 ring-slate-200',
    UNAUDITED: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${map[status] || map.UNAUDITED}`}>
      {status}
    </span>
  );
}

export function PermPill({ perm, tone = 'neutral' }) {
  const map = {
    ok: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    bad: 'bg-red-50 text-red-800 border-red-200',
    warn: 'bg-amber-50 text-amber-800 border-amber-200',
    neutral: 'bg-slate-50 text-slate-700 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs font-semibold ${map[tone]}`}>
      {tone === 'ok' && '✓'}{tone === 'bad' && '⚠'}{perm}
    </span>
  );
}

export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="card p-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">🛡️</div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="card border-red-200 bg-red-50/40 p-6">
      <p className="text-sm font-semibold text-red-800">Something went wrong</p>
      <p className="mt-1 text-sm text-red-700">{String(error)}</p>
      {onRetry && <button className="btn-ghost mt-4" onClick={onRetry}>Retry</button>}
    </div>
  );
}

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
