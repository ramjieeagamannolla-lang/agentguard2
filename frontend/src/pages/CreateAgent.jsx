import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Agents, System } from '../lib/api.js';
import { Spinner, ErrorState } from '../lib/ui.jsx';

const RISK_TONE = {
  HIGH: 'text-red-700 bg-red-50 border-red-200',
  MEDIUM: 'text-amber-700 bg-amber-50 border-amber-200',
  LOW: 'text-emerald-700 bg-emerald-50 border-emerald-200',
};

const PRESET = {
  name: 'Customer Support Agent',
  task: 'Answer customer questions about orders, shipping and delivery.',
  description: 'Front-line support agent embedded in the help widget.',
  tools: ['getOrder', 'getCustomer', 'updateOrder', 'deleteOrder', 'getPayroll'],
};

export default function CreateAgent() {
  const nav = useNavigate();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', task: '', description: '', tools: [] });

  useEffect(() => {
    System.tools().then(setTools).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const toggle = (name) =>
    setForm((f) => ({
      ...f,
      tools: f.tools.includes(name) ? f.tools.filter((t) => t !== name) : [...f.tools, name],
    }));

  const permissions = [...new Set(form.tools.map((t) => tools.find((x) => x.toolName === t)?.permission).filter(Boolean))];

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.task.trim()) return toast.error('Name and task are required.');
    if (!form.tools.length) return toast.error('Select at least one tool.');

    setSaving(true);
    try {
      const agent = await Agents.create(form);
      toast.success(`${agent.name} created and ready to chat.`);
      nav(`/agents/${agent._id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-24 text-slate-400"><Spinner className="h-8 w-8" /></div>;
  if (error) return <ErrorState error={error} />;

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="card p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Agent Identity</h2>
              <p className="text-sm text-slate-500">What the agent is called and what it is for.</p>
            </div>
            <button type="button" className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => setForm(PRESET)}>
              Load demo preset
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Agent Name</label>
              <input className="input" placeholder="Customer Support Agent"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Purpose / Task</label>
              <textarea className="input min-h-[92px] resize-y"
                placeholder="Answer customer questions about orders, shipping and delivery."
                value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })} />
              <p className="mt-1.5 text-xs text-slate-500">
                Be precise. AgentGuard derives the minimum required permissions from this sentence.
              </p>
            </div>
            <div>
              <label className="label">Description <span className="font-normal text-slate-400">(optional)</span></label>
              <input className="input" placeholder="Where this agent is deployed."
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-base font-bold text-slate-900">Select Tools / Permissions</h2>
          <p className="mb-5 text-sm text-slate-500">
            Each tool grants exactly one permission. The backend enforces these at execution time.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {tools.map((t) => {
              const checked = form.tools.includes(t.toolName);
              return (
                <label key={t.toolName}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                    checked ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500/20' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(t.toolName)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{t.label}</p>
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${RISK_TONE[t.risk]}`}>{t.risk}</span>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] font-semibold text-brand-700">{t.permission}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{t.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="card sticky top-28 p-6">
          <h3 className="text-base font-bold text-slate-900">Summary</h3>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Tools selected</dt>
              <dd className="font-semibold text-slate-900">{form.tools.length}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Permissions granted</dt>
              <dd className="font-semibold text-slate-900">{permissions.length}</dd>
            </div>
          </dl>

          {permissions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {permissions.map((p) => (
                <span key={p} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] font-semibold text-slate-700">{p}</span>
              ))}
            </div>
          )}

          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs leading-relaxed text-slate-600">
              Over-granting on purpose is fine here — that is the point of the demo.
              AgentGuard will flag anything the stated task does not need.
            </p>
          </div>

          <button type="submit" className="btn-primary mt-5 w-full" disabled={saving}>
            {saving ? <><Spinner className="h-4 w-4" /> Creating…</> : 'Create Agent'}
          </button>
          <button type="button" className="btn-ghost mt-2 w-full" onClick={() => nav('/dashboard')}>Cancel</button>
        </div>
      </div>
    </form>
  );
}
