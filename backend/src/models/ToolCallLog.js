import mongoose from 'mongoose';

/** Every tool attempt — allowed or denied — is recorded here. */
const ToolCallLogSchema = new mongoose.Schema(
  {
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', index: true },
    toolName: String,
    permission: String,
    args: mongoose.Schema.Types.Mixed,
    outcome: { type: String, enum: ['ALLOWED', 'DENIED', 'ERROR'] },
    denyReason: String,
    result: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const ToolCallLog = mongoose.model('ToolCallLog', ToolCallLogSchema);
