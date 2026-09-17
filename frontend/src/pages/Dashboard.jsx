import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Agents, System } from '../lib/api.js';
import { RiskBadge, StatusBadge, Spinner, EmptyState, ErrorState } from '../lib/ui.jsx';

const CARDS = [
  { key: 'totalAgents', label: 'Total Agents', tone: 'bg-brand-50 text-brand-700', icon: '◎' },
  { key: 'highRisk', label: 'High Risk', tone: 'bg-red-50 text-red-700', icon: '⚠' },
  { key: 'mediumRisk', label: 'Medium Risk', tone: 'bg-amber-50 text-amber-700', icon: '◐' },
  { key: 'totalAudits', label: 'Total Audits', tone: 'bg-emerald-50 text-emerald-700', icon: '✓' },
];

export default function Dashboard() {
  const nav = useNavigate();
  const [stats, setStats] = useState(null);
  const [agents, setAgents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true); setError(null);
    Promise.all([System.stats(), Agents.list()])
      .then(([s, a]) => { setStats(s); setAgents(a); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <div className="flex justify-center py-24 text-slate-400"><Spinner className="h-8 w-8" /></div>;
  if (error) return <ErrorState error={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((c) => (
          <div key={c.key} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{c.label}</p>
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{stats[c.key] ?? 0}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${c.tone}`}>{c.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {stats.pendingApprovals > 0 && (
        <div className="card flex flex-wrap items-center justify-between gap-3 border-amber-200 bg-amber-50/60 p-4">
          <p className="text-sm font-medium text-amber-900">
            <strong>{stats.pendingApprovals}</strong> audit{stats.pendingApprovals > 1 ? 's are' : ' is'} waiting on your approval.
            No permissions change until you decide.
          </p>
          <Link to="/audits" className="btn-ghost">Review</Link>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your AI Agents</h2>
            <p className="text-sm text-slate-500">Live agents and their current permission scope.</p>
          </div>
          <button className="btn-primary" onClick={() => nav('/agents/new')}>+ Create Agent</button>
        </div>

        {agents.length === 0 ? (
          <EmptyState
            title="No agents yet"
            body="Create your first AI agent to start auditing its permission scope."
            action={<button className="btn-primary" onClick={() => nav('/agents/new')}>+ Create Agent</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">Agent Name</th><th className="th">Task</th>
                  <th className="th">Status</th><th className="th">Risk Level</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agents.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50/70">
                    <td className="td">
                      <p className="font-semibold text-slate-900">{a.name}</p>
                      <p className="text-xs text-slate-500">{a.grantedPermissions.length} permissions</p>
                    </td>
                    <td className="td max-w-sm"><p className="line-clamp-2 text-slate-600">{a.task}</p></td>
                    <td className="td"><StatusBadge status={a.status} /></td>
                    <td className="td"><RiskBadge level={a.riskLevel} /></td>
                    <td className="td">
                      <div className="flex justify-end gap-2">
                        <Link to={`/agents/${a._id}`} className="btn-ghost !px-3 !py-1.5">View</Link>
                        <Link to={`/agents/${a._id}/audit`} className="btn-primary !px-3 !py-1.5">Audit</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
