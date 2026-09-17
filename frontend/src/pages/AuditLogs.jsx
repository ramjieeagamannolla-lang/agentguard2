import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Audits } from '../lib/api.js';
import { RiskBadge, StatusBadge, Spinner, EmptyState, ErrorState, fmtDate } from '../lib/ui.jsx';

const FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

export default function AuditLogs() {
  const [audits, setAudits] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    Audits.list().then(setAudits).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const rows = useMemo(
    () => (filter === 'ALL' ? audits : audits.filter((a) => a.approvalStatus === filter)),
    [audits, filter]
  );

  if (loading) return <div className="flex justify-center py-24 text-slate-400"><Spinner className="h-8 w-8" /></div>;
  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!audits.length)
    return <EmptyState title="No audits yet" body="Run an audit on one of your agents to populate this log." />;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Audit History</h2>
          <p className="text-sm text-slate-500">{audits.length} audit{audits.length > 1 ? 's' : ''} recorded.</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Date &amp; Time</th><th className="th">Agent Name</th>
              <th className="th">Risk Level</th><th className="th">Scope Change</th>
              <th className="th">Status</th><th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((a) => (
              <tr key={a._id} className="hover:bg-slate-50/70">
                <td className="td whitespace-nowrap text-slate-500">{fmtDate(a.createdAt)}</td>
                <td className="td font-semibold text-slate-900">{a.agentName}</td>
                <td className="td"><RiskBadge level={a.riskLevel} /></td>
                <td className="td">
                  {a.approvalStatus === 'APPROVED' ? (
                    <span className="font-mono text-xs font-semibold text-emerald-700">
                      {a.originalPermissions.length} → {a.finalPermissions.length}
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-slate-400">
                      {a.originalPermissions.length} → {a.recommendations?.keep?.length ?? '—'} proposed
                    </span>
                  )}
                </td>
                <td className="td"><StatusBadge status={a.approvalStatus === 'APPROVED' ? 'SECURED' : a.approvalStatus} /></td>
                <td className="td">
                  <div className="flex justify-end gap-2">
                    <Link to={`/audits/${a._id}`} className="btn-ghost !px-3 !py-1.5">View Audit</Link>
                    {a.approvalStatus === 'PENDING' && (
                      <Link to={`/audits/${a._id}/approval`} className="btn-primary !px-3 !py-1.5">Review</Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
