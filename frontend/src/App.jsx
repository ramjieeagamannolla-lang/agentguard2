import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CreateAgent from './pages/CreateAgent.jsx';
import MyAgents from './pages/MyAgents.jsx';
import AgentDetail from './pages/AgentDetail.jsx';
import ChatAgent from './pages/ChatAgent.jsx';
import AuditAgent from './pages/AuditAgent.jsx';
import AuditWorkflow from './pages/AuditWorkflow.jsx';
import AuditReport from './pages/AuditReport.jsx';
import HumanApproval from './pages/HumanApproval.jsx';
import AgentSecured from './pages/AgentSecured.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agents/new" element={<CreateAgent />} />
        <Route path="/agents" element={<MyAgents />} />
        <Route path="/agents/:id" element={<AgentDetail />} />
        <Route path="/agents/:id/chat" element={<ChatAgent />} />
        <Route path="/agents/:id/audit" element={<AuditAgent />} />
        <Route path="/agents/:id/audit/run" element={<AuditWorkflow />} />
        <Route path="/audits" element={<AuditLogs />} />
        <Route path="/audits/:id" element={<AuditReport />} />
        <Route path="/audits/:id/approval" element={<HumanApproval />} />
        <Route path="/audits/:id/secured" element={<AgentSecured />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
