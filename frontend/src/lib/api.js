import axios from 'axios';

export const api = axios.create({ baseURL: '/api', timeout: 120000 });

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err?.response?.data?.error || err.message || 'Request failed';
    return Promise.reject(Object.assign(new Error(msg), { response: err.response }));
  }
);

export const Agents = {
  list: () => api.get('/agents').then((r) => r.data.agents),
  get: (id) => api.get(`/agents/${id}`).then((r) => r.data),
  create: (payload) => api.post('/agents', payload).then((r) => r.data.agent),
  remove: (id) => api.delete(`/agents/${id}`).then((r) => r.data),
  chat: (id, message, history) =>
    api.post(`/agents/${id}/chat`, { message, history }).then((r) => r.data),
  probe: (id, toolName, args) => api.post(`/agents/${id}/probe`, { toolName, args }),
  toolLogs: (id) => api.get(`/agents/${id}/tool-logs`).then((r) => r.data.logs),
};

export const Audits = {
  graph: () => api.get('/audit-graph').then((r) => r.data.nodes),
  run: (agentId) => api.post('/audits', { agentId }).then((r) => r.data.audit),
  list: () => api.get('/audits').then((r) => r.data.audits),
  get: (id) => api.get(`/audits/${id}`).then((r) => r.data),
  approve: (id) => api.post(`/audits/${id}/approve`).then((r) => r.data),
  reject: (id) => api.post(`/audits/${id}/reject`).then((r) => r.data),
};

export const System = {
  stats: () => api.get('/dashboard/stats').then((r) => r.data),
  status: () => api.get('/system/status').then((r) => r.data),
  tools: () => api.get('/tools').then((r) => r.data.tools),
  templates: () => api.get('/agent-templates').then((r) => r.data.templates),
};
