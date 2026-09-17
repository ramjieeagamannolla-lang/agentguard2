import mongoose from 'mongoose';

const RiskSchema = new mongoose.Schema(
  { permission: String, reason: String, severity: String },
  { _id: false }
);

const AuditSchema = new mongoose.Schema(
  {
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true, index: true },
    agentName: String,
    task: String,

    originalPermissions: { type: [String], default: [] },
    requiredPermissions: { type: [String], default: [] },
    excessivePermissions: { type: [String], default: [] },
    missingPermissions: { type: [String], default: [] },

    taskAnalysis: { type: String, default: '' },
    auditSummary: { type: String, default: '' },

    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
    riskReasons: { type: [RiskSchema], default: [] },

    recommendations: {
      keep: { type: [String], default: [] },
      remove: { type: [String], default: [] },
      add: { type: [String], default: [] },
      rationale: { type: String, default: '' },
    },

    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    decidedBy: { type: String, default: null },
    decidedAt: { type: Date, default: null },
    finalPermissions: { type: [String], default: [] },

    nodeTrace: {
      type: [{ node: String, status: String, startedAt: Date, finishedAt: Date, ms: Number }],
      default: [],
    },
  },
  { timestamps: true }
);

export const Audit = mongoose.model('Audit', AuditSchema);
