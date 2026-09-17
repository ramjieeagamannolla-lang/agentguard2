import mongoose from 'mongoose';

const AgentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    task: { type: String, required: true, trim: true },
    description: { type: String, default: '' },

    // Tools the company originally wired up.
    tools: { type: [String], default: [] },

    // THE SOURCE OF TRUTH FOR ENFORCEMENT.
    // Chat builds its toolset from this, and every tool re-checks it at
    // execution time. Approving an audit mutates this array.
    grantedPermissions: { type: [String], default: [] },

    // Immutable record of what the agent was born with, so an audit can
    // always show "before" even after several rounds of remediation.
    originalPermissions: { type: [String], default: [] },

    status: {
      type: String,
      enum: ['ACTIVE', 'SECURED', 'UNAUDITED'],
      default: 'UNAUDITED',
    },
    riskLevel: {
      type: String,
      enum: ['UNKNOWN', 'LOW', 'MEDIUM', 'HIGH'],
      default: 'UNKNOWN',
    },
    lastAuditId: { type: mongoose.Schema.Types.ObjectId, ref: 'Audit', default: null },
  },
  { timestamps: true }
);

export const Agent = mongoose.model('Agent', AgentSchema);
