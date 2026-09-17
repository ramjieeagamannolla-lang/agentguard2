import { dbStatus } from '../config/db.js';
import { llmInfo } from '../ai/llm.js';
import { PERMISSIONS, ALL_TOOLS } from '../permissions/registry.js';

export function systemStatus(_req, res) {
  const llm = llmInfo();
  res.json({
    mongodb: { status: dbStatus(), uriConfigured: Boolean(process.env.MONGODB_URI) },
    // Note: model + provider only. The key itself is never sent to the client.
    llm: { provider: llm.provider, model: llm.model, configured: llm.configured },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 5000,
      demoMode: (process.env.DEMO_MODE ?? 'true') === 'true',
    },
    registry: {
      permissionCount: Object.keys(PERMISSIONS).length,
      toolCount: ALL_TOOLS.length,
    },
    permissions: Object.values(PERMISSIONS),
  });
}
