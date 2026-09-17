import { useEffect, useState } from 'react';
import { System } from '../lib/api.js';
import { Spinner, ErrorState } from '../lib/ui.jsx';

export default function Settings() {
  const [s, setS] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { System.status().then(setS).catch((e) => setError(e.message)); }, []);

  if (error) return <ErrorState error={error} />;
  if (!s) return <div className="flex justify-center py-24 text-slate-400"><Spinner className="h-8 w-8" /></div>;

  const mongoOk = s.mongodb.status === 'connected';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatusCard title="MongoDB" ok={mongoOk}
          value={s.mongodb.status}
          detail={mongoOk ? 'Agents, audits and sandbox data are persisting.' : 'Start mongod or check MONGODB_URI in backend/.env.'} />
        <StatusCard title="LLM" ok={s.llm.configured}
          value={s.llm.configured ? `${s.llm.provider} · ${s.llm.model}` : 'not configured'}
          detail={s.llm.configured
            ? 'Used by both the target agent and the audit workflow.'
            : 'Set LLM_API_KEY in backend/.env. Chat and audits will fail without it.'} />
      </div>

      <div className="card p-6">
        <h3 className="text-base font-bold text-slate-900">Environment</h3>
        <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          <Row label="Node environment" value={s.environment.nodeEnv} />
          <Row label="API port" value={s.environment.port} />
          <Row label="Demo / sandbox mode" value={s.environment.demoMode ? 'ENABLED' : 'disabled'} tone={s.environment.demoMode ? 'ok' : 'warn'} />
          <Row label="Registered permissions" value={s.registry.permissionCount} />
          <Row label="Registered tools" value={s.registry.toolCount} />
        </dl>

        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs leading-relaxed text-slate-600">
            API keys and connection strings are never sent to the browser. This page reports
            only whether each dependency is configured, plus the model name.
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-bold text-slate-900">Permission Registry</h3>
          <p className="text-sm text-slate-500">The shared vocabulary used by the runtime and the auditor.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-slate-50">
              <tr><th className="th">Permission</th><th className="th">Type</th><th className="th">Sensitivity</th><th className="th">Base Risk</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {s.permissions.map((p) => (
                <tr key={p.key}>
                  <td className="td">
                    <p className="font-mono text-xs font-bold text-slate-900">{p.key}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{p.description}</p>
                  </td>
                  <td className="td text-xs font-semibold">{p.type}</td>
                  <td className="td text-xs">{p.sensitivity}</td>
                  <td className="td">
                    <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                      p.risk === 'HIGH' ? 'bg-red-50 text-red-700'
                        : p.risk === 'MEDIUM' ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}>{p.risk}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ title, ok, value, detail }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
          ok ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-red-50 text-red-700 ring-red-200'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {ok ? 'OK' : 'ATTENTION'}
        </span>
      </div>
      <p className="mt-2 font-mono text-sm text-slate-800">{value}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{detail}</p>
    </div>
  );
}

function Row({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className={`text-sm font-semibold ${tone === 'ok' ? 'text-emerald-700' : tone === 'warn' ? 'text-amber-700' : 'text-slate-900'}`}>{value}</dd>
    </div>
  );
}
