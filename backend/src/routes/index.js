import { Router } from 'express';
import * as agents from '../controllers/agentController.js';
import * as audits from '../controllers/auditController.js';
import * as system from '../controllers/systemController.js';

const router = Router();

// Tools / registry
router.get('/tools', agents.listTools);
router.get('/agent-templates', agents.listTemplates);

// Agents
router.post('/agents', agents.createAgent);
router.get('/agents', agents.listAgents);
router.get('/agents/:id', agents.getAgent);
router.delete('/agents/:id', agents.deleteAgent);
router.post('/agents/:id/chat', agents.chatWithAgent);
router.post('/agents/:id/probe', agents.probeTool);
router.get('/agents/:id/tool-logs', agents.toolLogs);

// Audits
router.get('/audit-graph', audits.graphShape);
router.post('/audits', audits.createAudit);
router.get('/audits', audits.listAudits);
router.get('/audits/:id', audits.getAudit);
router.post('/audits/:id/approve', audits.approveAudit);
router.post('/audits/:id/reject', audits.rejectAudit);

// Dashboard + system
router.get('/dashboard/stats', audits.dashboardStats);
router.get('/system/status', system.systemStatus);

export default router;
