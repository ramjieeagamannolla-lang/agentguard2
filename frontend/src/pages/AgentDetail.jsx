import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Agents } from '../lib/api.js';
import { RiskBadge, StatusBadge, Spinner, ErrorState, fmtDate } from '../lib/ui.jsx';

export default function AgentDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Agents.get(id).then(setData).catch((e) => setError(e.message));
    Agents.toolLogs(id).then(setLogs).catch(() => {});
  }, [id]);

  if (error) return <ErrorState error={error} />;
  if (!data) return <div className="flex justify-center py-24 text-slate-400"><Spinner className="h-8 w-8" /></div>;

  const { agent, audits } = data;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{agent.name}</h2>
              <p className="mt-1 max-w-xl text-sm text-slate-600">{agent.task}</p>
              {agent.description && <p className="mt-1 text-sm text-slate-400">{agent.description}</p>}
            </div>
            <div className="flex gap-2"><RiskBadge level={agent.riskLevel} /><StatusBadge status={agent.status} /></div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link to={`/agents/${agent._id}/chat`} className="btn-primary">Use Agent</Link>
            <Link to={`/agents/${agent._id}/audit`} className="btn-ghost">Audit Agent</Link>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-base font-bold text-slate-900">Tools &amp; Permission Scope</h3>
          <p className="mb-4 text-sm text-slate-500">Revoked tools are unbound from the model and blocked at execution.</p>

          <div className="space-y-2">
            {agent.toolDetails.map((t) => {
              const active = agent.activeTools.includes(t.toolName);
              return (
                <div key={t.toolName}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3.5 ${
                    active ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-70'
                  }`}>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${active ? 'text-slate-900' : 'text-slate-500 line-through'}`}>
                      {t.label} <span className="font-mono text-xs font-normal text-slate-400">{t.toolName}()</span>
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] font-semibold text-brand-700">{t.permission}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${
                    active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-red-50 text-red-700 ring-red-200'
                  }`}>
                    {active ? 'ACTIVE' : 'REVOKED'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {logs.length > 0 && (
          <div className="card overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900">Tool Execution Log</h3>
              <p className="text-sm text-slate-500">Every attempt, allowed or denied, recorded server-side.</p>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {logs.map((l) => (
                <div key={l._id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-slate-800">{l.toolName}()</p>
                    <p className="text-[11px] text-slate-500">{l.permission} · {fmtDate(l.createdAt)}</p>
                  </div>
                  <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                    l.outcome === 'ALLOWED' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>{l.outcome}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="card p-6">
          <h3 className="text-base font-bold text-slate-900">Audit History</h3>
          {audits.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">This agent has never been audited.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {audits.map((a) => (
                <Link key={a._id} to={`/audits/${a._id}`}
                  className="block rounded-lg border border-slate-200 p-3 transition hover:border-brand-300 hover:bg-brand-50/40">
                  <div className="flex items-center justify-between gap-2">
                    <RiskBadge level={a.riskLevel} />
                    <StatusBadge status={a.approvalStatus} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{fmtDate(a.createdAt)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-bold text-slate-900">Metadata</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Agent ID</dt><dd className="font-mono text-xs text-slate-700">{agent._id.slice(-8)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Created</dt><dd className="text-slate-700">{fmtDate(agent.createdAt)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Original perms</dt><dd className="text-slate-700">{agent.originalPermissions.length}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Current perms</dt><dd className="font-semibold text-slate-900">{agent.grantedPermissions.length}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  );
}
