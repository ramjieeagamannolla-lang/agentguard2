import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Audits } from '../lib/api.js';
import { Spinner } from '../lib/ui.jsx';

/**
 * Runs the audit and animates the LangGraph node progression while the
 * request is in flight. When the response lands we replace the estimated
 * progression with the REAL nodeTrace the graph emitted, so the timings
 * shown are the actual per-node durations.
 */
export default function AuditWorkflow() {
  const { id } = useParams();
  const nav = useNavigate();
  const [nodes, setNodes] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [trace, setTrace] = useState(null);
  const [failed, setFailed] = useState(null);
  const started = useRef(false);

  useEffect(() => {
    Audits.graph().then(setNodes).catch(() => {});
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const tick = setInterval(() => setActiveIdx((i) => Math.min(i + 1, 3)), 2600);

    Audits.run(id)
      .then((audit) => {
        clearInterval(tick);
        setTrace(audit.nodeTrace || []);
        setActiveIdx(4);
        toast.success('Audit complete.');
        setTimeout(() => nav(`/audits/${audit._id}`), 900);
      })
      .catch((e) => {
        clearInterval(tick);
        setFailed(e.message);
        toast.error(e.message);
      });

    return () => clearInterval(tick);
  }, [id, nav]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card p-8">
        <div className="mb-8 text-center">
          <h2 className="text-lg font-bold text-slate-900">LangGraph Audit Workflow</h2>
          <p className="mt-1 text-sm text-slate-500">
            {failed ? 'The workflow stopped.' : 'Four LLM nodes running in sequence against this agent.'}
          </p>
        </div>

        <div className="space-y-0">
          {nodes.map((n, i) => {
            const t = trace?.find((x) => x.node === n.id);
            const done = failed ? false : (t ? true : i < activeIdx);
            const active = !failed && !done && i === activeIdx;
            const isHuman = n.id === 'humanApproval';

            return (
              <div key={n.id}>
                <div className={`flex items-center gap-4 rounded-xl border p-4 transition ${
                  active ? 'border-brand-400 bg-brand-50/60 ring-2 ring-brand-500/15'
                    : done ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-slate-200 bg-white'
                }`}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    done ? 'bg-emerald-600 text-white'
                      : active ? 'bg-brand-500 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {done ? '✓' : active ? <Spinner className="h-4 w-4" /> : i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold ${done || active ? 'text-slate-900' : 'text-slate-400'}`}>{n.label}</p>
                    <p className="text-xs text-slate-500">{n.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {t && <p className="font-mono text-[11px] text-emerald-700">{t.ms}ms</p>}
                    {isHuman && !failed && (
                      <p className="text-[11px] font-semibold text-amber-600">awaits you</p>
                    )}
                  </div>
                </div>
                {i < nodes.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className={`h-5 w-0.5 ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {failed && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-800">Audit failed</p>
            <p className="mt-1 text-sm text-red-700">{failed}</p>
            <button className="btn-ghost mt-3" onClick={() => nav(`/agents/${id}/audit`)}>Back</button>
          </div>
        )}
      </div>
    </div>
  );
}
