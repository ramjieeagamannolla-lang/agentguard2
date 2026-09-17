import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { System } from '../lib/api.js';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '▤' },
  { to: '/agents/new', label: 'Create Agent', icon: '＋' },
  { to: '/agents', label: 'My Agents', icon: '◎' },
  { to: '/audits', label: 'Audit Logs', icon: '☰' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

const TITLES = {
  '/dashboard': ['Dashboard', 'Security posture across every AI agent in your organization.'],
  '/agents/new': ['Create Agent', 'Provision a new AI agent and grant it tools.'],
  '/agents': ['My Agents', 'Every agent you have deployed, with its current permission scope.'],
  '/audits': ['Audit Logs', 'Full history of permission audits and human approval decisions.'],
  '/settings': ['Settings', 'Environment, database and model configuration.'],
};

function titleFor(pathname) {
  if (TITLES[pathname]) return TITLES[pathname];
  if (/\/chat$/.test(pathname)) return ['Use Agent', 'Chat with the live agent and watch its tool calls.'];
  if (/\/audit\/run$/.test(pathname)) return ['Audit Workflow', 'LangGraph is analyzing this agent.'];
  if (/\/audit$/.test(pathname)) return ['Audit Agent', 'Review what AgentGuard will inspect, then start the audit.'];
  if (/\/approval$/.test(pathname)) return ['Human Approval', 'Nothing changes until you approve it.'];
  if (/\/secured$/.test(pathname)) return ['Agent Secured', 'Permission scope reduced and enforced.'];
  if (/^\/audits\//.test(pathname)) return ['Audit Report', 'Findings from the AgentGuard workflow.'];
  if (/^\/agents\//.test(pathname)) return ['Agent Details', 'Configuration and permission scope.'];
  return ['AgentGuard', ''];
}

export default function Layout() {
  const { pathname } = useLocation();
  const [title, subtitle] = titleFor(pathname);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    System.stats().then((s) => setPending(s.pendingApprovals || 0)).catch(() => {});
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-navy-900 md:flex">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-lg">🛡️</div>
          <div>
            <p className="text-[15px] font-bold leading-tight text-white">AgentGuard</p>
            <p className="text-[11px] font-medium text-slate-400">Permission Auditor</p>
          </div>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-3">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/agents'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-brand-500 text-white' : 'text-slate-300 hover:bg-navy-700 hover:text-white'
                }`
              }
            >
              <span className="w-4 text-center opacity-80">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="m-3 rounded-xl bg-navy-800 p-4">
          <p className="text-xs font-semibold text-slate-200">Sandbox mode</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            All tools operate on demo data. No production systems are reachable.
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-8">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-slate-900">{title}</h1>
              {subtitle && <p className="mt-0.5 truncate text-sm text-slate-500">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-4">
              <NavLink to="/audits" className="relative text-xl text-slate-500 hover:text-slate-800" title="Pending approvals">
                🔔
                {pending > 0 && (
                  <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {pending}
                  </span>
                )}
              </NavLink>
              <div className="flex items-center gap-2.5">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold leading-tight text-slate-900">Security Admin</p>
                  <p className="text-xs text-slate-500">admin@acme.io</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-800 text-sm font-bold text-white">SA</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
