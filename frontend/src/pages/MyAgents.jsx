import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Agents } from '../lib/api.js';
import { RiskBadge, StatusBadge, Spinner, EmptyState, ErrorState, fmtDate } from '../lib/ui.jsx';

export default function MyAgents() {
  const nav = useNavigate();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    Agents.list().then(setAgents).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function remove(id, name) {
    if (!confirm(`Delete "${name}" and all of its audits?`)) return;
    try { await Agents.remove(id); toast.success('Agent deleted.'); load(); }
    catch (e) { toast.error(e.message); }
  }

  if (loading) return <div className="flex justify-center py-24 text-slate-400"><Spinner className="h-8 w-8" /></div>;
  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!agents.length)
    return <EmptyState title="No agents yet" body="Create an agent to get started."
      action={<button className="btn-primary" onClick={() => nav('/agents/new')}>+ Create Agent</button>} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => nav('/agents/new')}>+ Create Agent</button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {agents.map((a) => (
          <div key={a._id} className="card flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-slate-900">{a.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{a.task}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <RiskBadge level={a.riskLevel} />
                <StatusBadge status={a.status} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-3 text-center">
              <div>
                <p className="text-lg font-bold text-slate-900">{a.activeTools.length}</p>
                <p className="text-[11px] font-medium text-slate-500">Active tools</p>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{a.grantedPermissions.length}</p>
                <p className="text-[11px] font-medium text-slate-500">Permissions</p>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{a.revokedTools.length}</p>
                <p className="text-[11px] font-medium text-slate-500">Revoked</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {a.grantedPermissions.map((p) => (
                <span key={p} className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600">{p}</span>
              ))}
            </div>

            <p className="mt-3 text-xs text-slate-400">Created {fmtDate(a.createdAt)}</p>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <Link to={`/agents/${a._id}`} className="btn-ghost !px-3 !py-1.5">View</Link>
              <Link to={`/agents/${a._id}/chat`} className="btn-ghost !px-3 !py-1.5">Chat</Link>
              <Link to={`/agents/${a._id}/audit`} className="btn-primary !px-3 !py-1.5">Audit</Link>
              <button onClick={() => remove(a._id, a.name)} className="btn-ghost ml-auto !px-3 !py-1.5 text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
