import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Agents } from '../lib/api.js';
import { Spinner, ErrorState, RiskBadge } from '../lib/ui.jsx';

const SUGGESTIONS = {
  'customer-support': [
    'What is the status of order #1024?',
    'Who is the customer on order #1024?',
    'Delete order 1027.',
  ],
  'hr-assistant': [
    'What is my remaining leave balance?',
    'Show employee E-01.',
    'What is the payroll record for employee E-01?',
  ],
  'finance-assistant': [
    'What is the status of invoice INV-1001?',
    'Show the payment for invoice INV-1002.',
    'What is the salary of employee E-03?',
  ],
  'inventory-agent': [
    'How many units of product P100 are available?',
    'Show product P200.',
    'Update product P200 stock to 12.',
  ],
  'marketing-agent': [
    'How did our summer campaign perform?',
    'Show the Summer Launch campaign.',
    'Who owns campaign CMP-2026-SUMMER?',
  ],
  'appointment-agent': [
    'What appointments do I have tomorrow?',
    'What slots are available tomorrow?',
    'Create an appointment with Sarah Chen tomorrow at 11:00 about benefits.',
  ],
  custom: [
    'What is the status of order #1024?',
    'What is my remaining leave balance?',
    'What is the status of invoice INV-1001?',
  ],
};

const PROBES = {
  'customer-support': [
    ['getOrder', { orderId: '1024' }],
    ['deleteOrder', { orderId: '__NO_SUCH_ORDER__' }],
    ['getPayroll', { employeeId: 'E-01' }],
  ],
  'hr-assistant': [
    ['getLeaveBalance', { employeeId: 'E-01' }],
    ['deleteEmployee', { employeeId: 'E-404' }],
    ['getPayroll', { employeeId: 'E-01' }],
  ],
  'finance-assistant': [
    ['getInvoice', { invoiceId: 'INV-1001' }],
    ['deleteInvoice', { invoiceId: 'INV-404' }],
    ['getEmployeeSalary', { employeeId: 'E-03' }],
  ],
  'inventory-agent': [
    ['getStock', { productId: 'P100' }],
    ['deleteProduct', { productId: 'P404' }],
    ['updateProductPrice', { productId: 'P404', price: 119 }],
  ],
  'marketing-agent': [
    ['getCampaignMetrics', { name: 'Summer Launch' }],
    ['deleteCampaign', { campaignId: 'CMP-404' }],
    ['getEmployeeData', { employeeId: 'E-02' }],
  ],
  'appointment-agent': [
    ['getAppointment', { date: 'tomorrow', attendee: 'Sarah Chen' }],
    ['deleteAppointment', { appointmentId: 'APT-404' }],
    ['getAvailableSlots', { date: 'tomorrow' }],
  ],
};

export default function ChatAgent() {
  const { id } = useParams();
  const [agent, setAgent] = useState(null);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  const reload = () => Agents.get(id).then((d) => setAgent(d.agent)).catch((e) => setError(e.message));
  useEffect(() => { reload(); }, [id]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setInput('');

    const history = messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: 'user', content }]);
    setBusy(true);

    try {
      const res = await Agents.chat(id, content, history);
      setMessages((m) => [...m, { role: 'assistant', content: res.reply, toolTrace: res.toolTrace }]);
    } catch (e) {
      toast.error(e.message);
      setMessages((m) => [...m, { role: 'assistant', content: `⚠ ${e.message}`, isError: true }]);
    } finally {
      setBusy(false);
    }
  }

  /** Bypasses the LLM and calls the tool directly — proves enforcement is server-side. */
  async function probe(toolName, args) {
    try {
      const { data } = await Agents.probe(id, toolName, args);
      toast.success(`${toolName}() allowed — permission still granted.`);
      setMessages((m) => [...m, {
        role: 'system',
        content: `Direct probe: ${toolName}() ALLOWED\n${JSON.stringify(data.result, null, 2)}`,
      }]);
    } catch (e) {
      const d = e.response?.data;
      if (d?.code === 'PERMISSION_DENIED') {
        toast.success(`Blocked: ${toolName}() — ${d.permission} not granted.`);
        setMessages((m) => [...m, { role: 'system', content: `Direct probe: ${toolName}() DENIED — ${d.message}`, denied: true }]);
      } else toast.error(e.message);
    }
  }

  if (error) return <ErrorState error={error} />;
  if (!agent) return <div className="flex justify-center py-24 text-slate-400"><Spinner className="h-8 w-8" /></div>;

  const suggestions = SUGGESTIONS[agent.type] ?? SUGGESTIONS.custom;
  const probes = PROBES[agent.type] ?? PROBES['customer-support'];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Chat column */}
      <div className="card flex h-[calc(100vh-13rem)] flex-col lg:col-span-2">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-800 text-lg">🤖</div>
            <div>
              <p className="text-sm font-bold text-slate-900">{agent.name}</p>
              <p className="text-xs text-slate-500">{agent.activeTools.length} tools active · live LLM</p>
            </div>
          </div>
          <Link to={`/agents/${agent._id}/audit`} className="btn-ghost !px-3 !py-1.5">Audit</Link>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-slate-600">Ask the agent something.</p>
              <p className="mt-1 text-xs text-slate-400">It will call real tools against the sandbox database.</p>
              <div className="mx-auto mt-5 flex max-w-md flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-700">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => {
            if (m.role === 'system')
              return (
                <pre key={i} className={`overflow-x-auto whitespace-pre-wrap rounded-lg border p-3 font-mono text-[11px] ${
                  m.denied ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                }`}>{m.content}</pre>
              );

            const mine = m.role === 'user';
            return (
              <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${mine ? '' : 'w-full'}`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    mine ? 'bg-brand-500 text-white'
                      : m.isError ? 'border border-red-200 bg-red-50 text-red-800'
                      : 'border border-slate-200 bg-slate-50 text-slate-800'
                  }`}>
                    {m.content}
                  </div>

                  {m.toolTrace?.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {m.toolTrace.map((t, j) => (
                        <div key={j} className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-xs ${
                          t.denied ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'
                        }`}>
                          <span className="font-semibold text-slate-500">Tool Used:</span>
                          <span className="font-mono font-bold text-slate-800">{t.tool}()</span>
                          <span className="font-semibold text-slate-500">Permission:</span>
                          <span className="font-mono font-bold text-brand-700">{t.permission}</span>
                          <span className={`ml-auto rounded px-1.5 py-0.5 font-bold ${
                            t.denied ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>{t.denied ? 'DENIED' : 'OK'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {busy && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Spinner className="h-4 w-4" /> Agent is thinking and calling tools…
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Ask the selected agent about its sandbox data..."
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()} disabled={busy} />
            <button className="btn-primary" onClick={() => send()} disabled={busy || !input.trim()}>Send</button>
          </div>
        </div>
      </div>

      {/* Side panel */}
      <div className="space-y-6">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Current Permission Scope</h3>
            <RiskBadge level={agent.riskLevel} />
          </div>
          <div className="mt-3 space-y-1.5">
            {agent.toolDetails.map((t) => {
              const active = agent.activeTools.includes(t.toolName);
              return (
                <div key={t.toolName} className="flex items-center justify-between gap-2 text-xs">
                  <span className={`font-mono ${active ? 'text-slate-700' : 'text-slate-400 line-through'}`}>{t.toolName}()</span>
                  <span className={`font-semibold ${active ? 'text-emerald-600' : 'text-red-500'}`}>{active ? 'granted' : 'revoked'}</span>
                </div>
              );
            })}
          </div>
          <button className="btn-ghost mt-4 w-full !py-1.5 text-xs" onClick={reload}>Refresh scope</button>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-900">Enforcement Probe</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Calls the tool directly, bypassing the LLM entirely. If the permission is revoked,
            the backend returns 403 — proving the control is server-side, not cosmetic.
          </p>
          <div className="mt-3 space-y-2">
            {probes.map(([toolName, args]) => (
              <button key={toolName} className="btn-ghost w-full !py-1.5 text-xs" onClick={() => probe(toolName, args)}>
                Probe {toolName}()
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
