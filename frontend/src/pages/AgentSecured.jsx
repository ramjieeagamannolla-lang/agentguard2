import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Audits } from '../lib/api.js';
import { PermPill, Spinner, ErrorState } from '../lib/ui.jsx';
import { TOOL_LABELS } from '../lib/toolLabels.js';

export default function AgentSecured() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { Audits.get(id).then(setData).catch((e) => setError(e.message)); }, [id]);

  if (error) return <ErrorState error={error} />;
  if (!data) return <div className="flex justify-center py-24 text-slate-400"><Spinner className="h-8 w-8" /></div>;

  const { audit, agent } = data;
  const before = audit.originalPermissions || [];
  const after = audit.finalPermissions || [];
  const toolsFor = (perms) => TOOL_LABELS.filter((t) => perms.includes(t.permission));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">✓</div>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">Agent Secured</h2>
        <p className="mt-1 text-base font-semibold text-slate-700">{audit.agentName}</p>
        <p className="mt-1 text-sm text-slate-500">
          Approved by {audit.decidedBy}. The reduced scope is live and enforced at the backend.
        </p>

        <div className="mt-7 flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-4xl font-extrabold text-slate-400">{before.length}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Before</p>
          </div>
          <div className="text-3xl text-slate-300">→</div>
          <div className="text-center">
            <p className="text-4xl font-extrabold text-emerald-600">{after.length}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">After</p>
          </div>
        </div>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 ring-1 ring-inset ring-emerald-200">
          <span className="text-sm font-bold text-emerald-800">
            Permission reduction: {before.length} → {after.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Before</p>
          <ul className="mt-3 space-y-1.5">
            {toolsFor(before).map((t) => (
              <li key={t.toolName} className={`text-sm ${after.includes(t.permission) ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                {t.label}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
            {before.map((p) => <PermPill key={p} perm={p} tone={after.includes(p) ? 'neutral' : 'bad'} />)}
          </div>
        </div>

        <div className="card border-emerald-200 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">After</p>
          <ul className="mt-3 space-y-1.5">
            {toolsFor(after).map((t) => <li key={t.toolName} className="text-sm text-slate-800">{t.label}</li>)}
          </ul>
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-emerald-100 pt-3">
            {after.map((p) => <PermPill key={p} perm={p} tone="ok" />)}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-base font-bold text-slate-900">Verify it for yourself</h3>
        <p className="mt-1 text-sm text-slate-600">
          Open the chat and ask the agent to do something it no longer has permission for.
          The tool is unbound from the model, and the Enforcement Probe in the side panel will
          return a 403 straight from the backend.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {agent && <Link to={`/agents/${agent._id}/chat`} className="btn-primary">Chat with secured agent</Link>}
          <Link to={`/audits/${audit._id}`} className="btn-ghost">View full report</Link>
          <Link to="/audits" className="btn-ghost">Audit logs</Link>
        </div>
      </div>
    </div>
  );
}
