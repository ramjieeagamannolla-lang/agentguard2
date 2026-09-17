import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Agents } from '../lib/api.js';
import { Spinner, ErrorState, RiskBadge } from '../lib/ui.jsx';

const CHECKS = [
  ['Understand the agent’s task', 'An LLM reads the stated purpose and infers intent.'],
  ['Analyze required permissions', 'Derives the minimum scope the task genuinely needs.'],
  ['Compare with actual permissions', 'Exact set difference against what is granted.'],
  ['Assess security risks', 'Blast radius of each excessive permission.'],
  ['Generate recommendations', 'A least-privilege scope with written justification.'],
  ['Require human approval', 'Nothing is changed without your explicit sign-off.'],
];

export default function AuditAgent() {
  const { id } = useParams();
  const nav = useNavigate();
  const [agent, setAgent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { Agents.get(id).then((d) => setAgent(d.agent)).catch((e) => setError(e.message)); }, [id]);

  if (error) return <ErrorState error={error} />;
  if (!agent) return <div className="flex justify-center py-24 text-slate-400"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Agent under audit</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{agent.name}</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-600">{agent.task}</p>
          </div>
          <RiskBadge level={agent.riskLevel} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat label="Tools" value={agent.activeTools.length} />
          <Stat label="Permissions" value={agent.grantedPermissions.length} />
          <Stat label="Previous audits" value={agent.lastAuditId ? 'Yes' : 'None'} />
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-slate-800">Current Permissions</p>
          <div className="flex flex-wrap gap-2">
            {agent.grantedPermissions.map((p) => (
              <span key={p} className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">{p}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-base font-bold text-slate-900">What will AgentGuard check?</h3>
        <ul className="mt-4 space-y-3">
          {CHECKS.map(([t, d]) => (
            <li key={t} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">✓</span>
              <div>
                <p className="text-sm font-semibold text-slate-800">{t}</p>
                <p className="text-xs text-slate-500">{d}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => nav(`/agents/${id}/audit/run`)}>Start Audit</button>
          <button className="btn-ghost" onClick={() => nav(`/agents/${id}`)}>Back to agent</button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}
