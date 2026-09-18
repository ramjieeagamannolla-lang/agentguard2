import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Agents, System } from '../lib/api.js';
import { Spinner, ErrorState } from '../lib/ui.jsx';

const RISK_TONE = {
  HIGH: 'text-red-700 bg-red-50 border-red-200',
  MEDIUM: 'text-amber-700 bg-amber-50 border-amber-200',
  LOW: 'text-emerald-700 bg-emerald-50 border-emerald-200',
};

export default function CreateAgent() {
  const nav = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    System.templates()
      .then((items) => {
        setTemplates(items);
        setSelectedType(items[0]?.type ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const selected = useMemo(
    () => templates.find((template) => template.type === selectedType) ?? templates[0],
    [templates, selectedType]
  );

  async function create(template) {
    setCreating(template.type);
    try {
      const agent = await Agents.create({ type: template.type });
      toast.success(`${agent.name} created and ready to chat.`);
      nav(`/agents/${agent._id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(null);
    }
  }

  if (loading) return <div className="flex justify-center py-24 text-slate-400"><Spinner className="h-8 w-8" /></div>;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {templates.map((template) => {
            const active = template.type === selected?.type;
            const busy = creating === template.type;
            return (
              <div
                key={template.type}
                onClick={() => setSelectedType(template.type)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedType(template.type)}
                role="button"
                tabIndex={0}
                className={`card flex min-h-[218px] flex-col p-5 text-left transition ${
                  active ? 'border-brand-500 ring-1 ring-brand-500/20' : 'hover:border-slate-300'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-slate-900">{template.name}</h2>
                      <p className="mt-1 text-sm font-medium text-slate-500">{template.summary}</p>
                    </div>
                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500">
                      {template.tools.length} tools
                    </span>
                  </div>
                  <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-600">{template.task}</p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <span className="text-xs font-semibold text-slate-400">{template.permissions.length} permissions</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      create(template);
                    }}
                    className="btn-primary !px-3 !py-1.5 text-xs"
                    disabled={Boolean(creating)}
                  >
                    {busy ? <><Spinner className="h-3.5 w-3.5" /> Creating...</> : 'Create Agent'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="card sticky top-28 p-6">
          {selected ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Selected Template</p>
              <h3 className="mt-1 text-base font-bold text-slate-900">{selected.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{selected.description}</p>

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Tools wired</dt>
                  <dd className="font-semibold text-slate-900">{selected.tools.length}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Permissions granted</dt>
                  <dd className="font-semibold text-slate-900">{selected.permissions.length}</dd>
                </div>
              </dl>

              <div className="mt-5 space-y-2">
                {selected.toolDetails.map((tool) => (
                  <div key={tool.toolName} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900">{tool.toolName}()</p>
                        <p className="mt-0.5 font-mono text-[11px] font-semibold text-brand-700">{tool.permission}</p>
                      </div>
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${RISK_TONE[tool.risk]}`}>
                        {tool.risk}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="btn-primary mt-5 w-full"
                onClick={() => create(selected)}
                disabled={Boolean(creating)}
              >
                {creating === selected.type ? <><Spinner className="h-4 w-4" /> Creating...</> : 'Create Agent'}
              </button>
              <button type="button" className="btn-ghost mt-2 w-full" onClick={() => nav('/dashboard')}>Cancel</button>
            </>
          ) : (
            <p className="text-sm text-slate-500">No templates are available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
