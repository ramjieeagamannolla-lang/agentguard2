import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Audits } from '../lib/api.js';
import { PermPill, Spinner, ErrorState, RiskBadge } from '../lib/ui.jsx';

export default function HumanApproval() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  useEffect(() => { Audits.get(id).then(setData).catch((e) => setError(e.message)); }, [id]);

  if (error) return <ErrorState error={error} />;
  if (!data) return <div className="flex justify-center py-24 text-slate-400"><Spinner className="h-8 w-8" /></div>;

  const { audit } = data;
  const rec = audit.recommendations || {};
  const recommended = [...new Set([...(rec.keep || []), ...(rec.add || [])])];
  const removing = rec.remove || [];

  if (audit.approvalStatus !== 'PENDING') {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card p-8 text-center">
          <p className="text-base font-bold text-slate-900">This audit was already {audit.approvalStatus.toLowerCase()}.</p>
          <p className="mt-1 text-sm text-slate-500">Decided by {audit.decidedBy}.</p>
          <button className="btn-ghost mt-5" onClick={() => nav(`/audits/${id}`)}>View report</button>
        </div>
      </div>
    );
  }

  async function decide(kind) {
    setBusy(kind);
    try {
      if (kind === 'approve') {
        await Audits.approve(id);
        toast.success('Approved. Permissions reduced and enforced.');
        nav(`/audits/${id}/secured`);
      } else {
        await Audits.reject(id);
        toast('Rejected. The agent was left exactly as it was.', { icon: '🛑' });
        nav(`/audits/${id}`);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{audit.agentName}</h2>
            <p className="mt-1 text-sm text-slate-600">{audit.task}</p>
          </div>
          <RiskBadge level={audit.riskLevel} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Current Permissions</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {audit.originalPermissions.map((p) => (
                <PermPill key={p} perm={p} tone={removing.includes(p) ? 'bad' : 'ok'} />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Recommended</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {recommended.length ? recommended.map((p) => <PermPill key={p} perm={p} tone="ok" />)
                : <span className="text-sm text-slate-500">No permissions</span>}
            </div>
          </div>
        </div>

        {removing.length > 0 && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-bold text-amber-900">
              You are about to remove {removing.length} permission{removing.length > 1 ? 's' : ''}.
            </p>
            <p className="mt-1 text-sm leading-relaxed text-amber-800">
              The matching tools will be unbound from the agent immediately and blocked at the
              backend. If this agent depends on them for something not described in its task,
              that behaviour will stop working.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {removing.map((p) => <PermPill key={p} perm={p} tone="bad" />)}
            </div>
          </div>
        )}

        {rec.rationale && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Why AgentGuard recommends this</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{rec.rationale}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
          <button className="btn-success" disabled={!!busy} onClick={() => decide('approve')}>
            {busy === 'approve' ? <><Spinner className="h-4 w-4" /> Applying…</> : 'Approve Changes'}
          </button>
          <button className="btn-danger" disabled={!!busy} onClick={() => decide('reject')}>
            {busy === 'reject' ? <><Spinner className="h-4 w-4" /> Recording…</> : 'Reject'}
          </button>
          <button className="btn-ghost ml-auto" onClick={() => nav(`/audits/${id}`)}>Back to report</button>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Either decision is recorded in MongoDB with a timestamp. Rejecting leaves the agent untouched.
        </p>
      </div>
    </div>
  );
}
