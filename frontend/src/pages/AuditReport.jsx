import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Audits } from '../lib/api.js';
import { RiskBadge, StatusBadge, PermPill, Spinner, ErrorState, fmtDate } from '../lib/ui.jsx';

export default function AuditReport() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { Audits.get(id).then(setData).catch((e) => setError(e.message)); }, [id]);

  if (error) return <ErrorState error={error} />;
  if (!data) return <div className="flex justify-center py-24 text-slate-400"><Spinner className="h-8 w-8" /></div>;

  const { audit } = data;
  const rec = audit.recommendations || {};

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Audit Report</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{audit.agentName}</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">{audit.task}</p>
            <p className="mt-2 text-xs text-slate-400">Run {fmtDate(audit.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Risk Level</p>
            <RiskBadge level={audit.riskLevel} />
            <div className="mt-2"><StatusBadge status={audit.approvalStatus} /></div>
          </div>
        </div>
      </div>

      {/* Three cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <h3 className="text-sm font-bold text-emerald-700">REQUIRED PERMISSIONS</h3>
          <p className="mt-1 text-xs text-slate-500">Minimum scope the task actually needs.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {audit.requiredPermissions.length
              ? audit.requiredPermissions.map((p) => <PermPill key={p} perm={p} tone="ok" />)
              : <span className="text-sm text-slate-400">None</span>}
          </div>
          {audit.taskAnalysis && (
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-600">{audit.taskAnalysis}</p>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold text-red-700">EXCESSIVE PERMISSIONS</h3>
          <p className="mt-1 text-xs text-slate-500">Granted but not needed for the stated task.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {audit.excessivePermissions.length
              ? audit.excessivePermissions.map((p) => <PermPill key={p} perm={p} tone="bad" />)
              : <span className="text-sm text-emerald-600">None — scope is already minimal.</span>}
          </div>
          {audit.missingPermissions.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-amber-700">Missing</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {audit.missingPermissions.map((p) => <PermPill key={p} perm={p} tone="warn" />)}
              </div>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold text-amber-700">RISK ANALYSIS</h3>
          <p className="mt-1 text-xs text-slate-500">{audit.auditSummary || 'Findings from the Risk Analyzer node.'}</p>
          <div className="mt-3 space-y-2.5">
            {audit.riskReasons.length
              ? audit.riskReasons.map((r, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-800">{r.permission}</span>
                      <RiskBadge level={r.severity} />
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{r.reason}</p>
                  </div>
                ))
              : <p className="text-sm text-emerald-600">No excessive permissions to assess.</p>}
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="card p-6">
        <h3 className="text-base font-bold text-slate-900">Recommendation</h3>
        <p className="text-sm text-slate-500">Proposed least-privilege scope. Not applied yet.</p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <RecCol title="Keep" tone="ok" items={rec.keep} />
          <RecCol title="Remove" tone="bad" items={rec.remove} />
          <RecCol title="Add" tone="warn" items={rec.add} />
        </div>

        {rec.rationale && (
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rationale</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{rec.rationale}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
          {audit.approvalStatus === 'PENDING' ? (
            <>
              <button className="btn-primary" onClick={() => nav(`/audits/${audit._id}/approval`)}>Approve Changes</button>
              <Link to="/audits" className="btn-ghost">Back to logs</Link>
            </>
          ) : (
            <>
              <div className={`rounded-lg border px-4 py-2.5 text-sm font-semibold ${
                audit.approvalStatus === 'APPROVED'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}>
                {audit.approvalStatus === 'APPROVED'
                  ? `Approved by ${audit.decidedBy} — permissions applied.`
                  : `Rejected by ${audit.decidedBy} — the agent was left unchanged.`}
              </div>
              {audit.approvalStatus === 'APPROVED' && (
                <Link to={`/audits/${audit._id}/secured`} className="btn-ghost">View summary</Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RecCol({ title, tone, items = [] }) {
  const head = { ok: 'text-emerald-700', bad: 'text-red-700', warn: 'text-amber-700' }[tone];
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className={`text-xs font-bold uppercase tracking-wide ${head}`}>{title}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.length ? items.map((p) => <PermPill key={p} perm={p} tone={tone} />) : <span className="text-sm text-slate-400">None</span>}
      </div>
    </div>
  );
}
