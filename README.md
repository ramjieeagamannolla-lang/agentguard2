# 🛡️ AgentGuard — AI Agent Permission Scope Auditor

A working security platform for companies that deploy AI agents. You create a real
LLM-powered agent, chat with it, watch it call real tools against a sandbox database —
then AgentGuard audits that *same* agent with a LangGraph workflow and proposes a
least-privilege permission scope that a human must approve before anything changes.

This is a functioning POC, not a mockup. Every button hits a real API.

---

## Why this isn't a fake demo

The one thing that separates a real permission auditor from a convincing UI is **where
enforcement lives**. In AgentGuard it lives in the backend tool runtime:

- `Agent.grantedPermissions` in MongoDB is the single source of truth.
- The chat endpoint builds the agent's LangChain toolset from that array, so a revoked
  tool isn't even in the model's schema.
- Every tool call *also* routes through `executeTool()`, which **re-reads the agent from
  the database on every single invocation** and fails closed if the permission is gone.
- `POST /api/audits/:id/approve` is the only code path in the entire application that
  mutates `grantedPermissions`.

So after approval, `deleteOrder()` doesn't just disappear from the UI — it returns HTTP
403 from the server even if you call it directly, bypassing the LLM entirely. There's a
button in the chat sidebar that does exactly that, for the demo.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND — React + Vite + Tailwind + React Router + Axios       │
│  Dashboard · Create Agent · My Agents · Chat · Audit · Workflow  │
│  Report · Approval · Secured · Audit Logs · Settings             │
└───────────────────────────┬──────────────────────────────────────┘
                            │  REST (/api, proxied by Vite)
┌───────────────────────────▼──────────────────────────────────────┐
│  BACKEND — Node + Express                                        │
│                                                                  │
│  ┌── routes ── controllers ──┬─────────────────────────────────┐ │
│  │                           │                                 │ │
│  │  TARGET AGENT RUNTIME     │  AGENTGUARD AUDIT ENGINE        │ │
│  │  targetAgent.js           │  ai/auditGraph.js (LangGraph)   │ │
│  │    ↓ binds only granted   │    taskAnalyzer                 │ │
│  │  toolFactory.js           │      ↓                          │ │
│  │    ↓ every call guarded   │    permissionAuditor            │ │
│  │  enforcement.js  ◄────────┤      ↓                          │ │
│  │    ↓ re-reads DB grant    │    riskAnalyzer                 │ │
│  │  sandboxTools.js          │      ↓                          │ │
│  │                           │    recommendationAgent          │ │
│  │                           │      ↓                          │ │
│  │                           │    ⏸ HUMAN APPROVAL (separate   │ │
│  │                           │       API call — graph ENDs      │ │
│  │                           │       before touching anything)  │ │
│  └───────────────────────────┴─────────────────────────────────┘ │
│                   permissions/registry.js                        │
│         (shared vocabulary: both sides read the same metadata)   │
└───────────────────────────┬──────────────────────────────────────┘
                            │  Mongoose
┌───────────────────────────▼──────────────────────────────────────┐
│  MONGODB                                                         │
│  Control plane:  Agent · Audit · ToolCallLog                     │
│  Sandbox data:   Order · Customer · Employee · Inventory         │
└──────────────────────────────────────────────────────────────────┘
```

### Design decisions worth calling out

**The LLM writes prose; code does the arithmetic.** The Task Analyzer node uses an LLM to
decide *which permissions a task needs* — that's genuine judgment and it's what we want a
model for. But the excessive/missing sets and the final `keep`/`remove` lists are computed
with exact set operations in `auditGraph.js`. A model that miscounts shouldn't be able to
revoke the wrong permission.

**Two layers of defence on tools.** Unbinding revoked tools (layer 1) is what makes the
agent behave correctly. Re-checking the grant inside `executeTool` (layer 2) is what makes
it *secure* — it holds even against a hallucinated tool call, a stale session, or a
permission revoked mid-conversation.

**The graph ends before approval.** `humanApproval` is shown as a node in the UI, but the
compiled graph terminates after `recommendationAgent`. There is deliberately no code path
from the audit run to a permission mutation.

---

## Folder structure

```
AgentGuard/
├── backend/
│   └── src/
│       ├── agents/targetAgent.js       Real LLM tool-calling loop
│       ├── ai/
│       │   ├── auditGraph.js           LangGraph StateGraph, 4 nodes
│       │   └── llm.js                  Provider factory (anthropic|openai)
│       ├── config/db.js
│       ├── controllers/                agent · audit · system
│       ├── models/                     Agent · Audit · ToolCallLog · sandbox
│       ├── permissions/registry.js     Tools, permissions, risk metadata
│       ├── prompts/auditPrompts.js     System prompts for each node
│       ├── routes/index.js
│       ├── tools/
│       │   ├── enforcement.js          ★ the security gate
│       │   ├── sandboxTools.js         Raw Mongo operations
│       │   └── toolFactory.js          Binds granted tools to LangChain
│       ├── seed.js
│       └── server.js
├── frontend/
│   └── src/
│       ├── components/Layout.jsx       Sidebar + topbar shell
│       ├── lib/  api.js · ui.jsx · toolLabels.js
│       └── pages/                      11 pages
├── .env.example
└── README.md
```

---

## Installation

**Prerequisites:** Node 18+, MongoDB running locally (or an Atlas URI), and an API key
for Anthropic or OpenAI.

```bash
git clone <your-repo> AgentGuard && cd AgentGuard

npm install --prefix backend
npm install --prefix frontend
```

### Environment setup

```bash
cp .env.example backend/.env
```

Then edit `backend/.env`:

```ini
MONGODB_URI=mongodb://127.0.0.1:27017/agentguard
PORT=5000
DEMO_MODE=true
CORS_ORIGIN=http://localhost:5173

LLM_PROVIDER=anthropic          # or: openai
LLM_API_KEY=sk-ant-...          # never commit this
LLM_MODEL=claude-sonnet-4-5     # or: gpt-4o
```

The key stays server-side. `/api/system/status` reports only *whether* it's configured.

### MongoDB

```bash
# local
mongod --dbpath /your/data/path

# or Docker
docker run -d -p 27017:27017 --name agentguard-mongo mongo:7
```

### Seed the sandbox

```bash
npm run seed --prefix backend            # loads demo data, keeps existing agents
npm run seed --prefix backend -- --reset # wipes agents, audits and logs too
```

Seeds orders `1024`–`1027`, customers `C-100`–`C-102`, employees `E-01`–`E-03`,
inventory SKUs, and three demo agents.

### Run

```bash
npm run dev --prefix backend     # http://localhost:5000
npm run dev --prefix frontend    # http://localhost:5173
```

Or both at once from the root (`npm i` there first for `concurrently`):

```bash
npm run dev
```

Vite proxies `/api` → `localhost:5000`, so there's no CORS friction in dev.

---

## Testing the target agent

Open any agent → **Use Agent**. Try:

| Prompt | Tool it should call | Permission |
|---|---|---|
| `What is the status of order #1024?` | `getOrder` | `READ_ORDERS` |
| `Who is the customer on order #1024?` | `getOrder` → `getCustomer` | `READ_ORDERS`, `READ_CUSTOMER` |
| `Delete order 1027.` | `deleteOrder` | `DELETE_ORDERS` |
| `What is the salary of employee E-01?` | `getPayroll` | `READ_PAYROLL` |

Each turn shows a **Tool Used / Permission** strip under the reply. Nothing is hardcoded:
remove the LLM key and chat returns 503 rather than a canned answer.

## Running an audit

**Audit Agent → Start Audit.** The workflow page animates node progress while the request
is in flight, then swaps in the real per-node timings from the graph's `nodeTrace`. A full
audit is four sequential LLM calls, so expect roughly 10–25 seconds.

## How human approval works

1. The audit is written to MongoDB with `approvalStatus: 'PENDING'`. The agent's
   `riskLevel` is updated — its **permissions are not**.
2. The Human Approval page shows current vs recommended scope and a warning naming the
   exact count being removed.
3. **Approve** → `POST /api/audits/:id/approve` sets `grantedPermissions` to
   `keep ∪ add`, prunes `tools`, marks the agent `SECURED`, and records
   `decidedBy` / `decidedAt` / `finalPermissions`.
4. **Reject** → the decision is recorded and the agent is left byte-for-byte unchanged.

Approving an already-decided audit returns `409`.

---

## API reference

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/tools` | Tool registry with permission + risk metadata |
| `POST` | `/api/agents` | Create an agent `{name, task, description, tools[]}` |
| `GET` | `/api/agents` | List agents (with active/revoked tool breakdown) |
| `GET` | `/api/agents/:id` | One agent plus its audit history |
| `DELETE` | `/api/agents/:id` | Delete agent and its audits |
| `POST` | `/api/agents/:id/chat` | Live agent turn `{message, history[]}` → `{reply, toolTrace[]}` |
| `POST` | `/api/agents/:id/probe` | **Direct tool call, no LLM.** `403` if the permission is revoked |
| `GET` | `/api/agents/:id/tool-logs` | Every tool attempt, allowed and denied |
| `GET` | `/api/audit-graph` | Node shape for the workflow visualization |
| `POST` | `/api/audits` | Run the LangGraph audit `{agentId}` |
| `GET` | `/api/audits` | All audits, newest first |
| `GET` | `/api/audits/:id` | One audit plus its agent |
| `POST` | `/api/audits/:id/approve` | **Only path that mutates permissions** |
| `POST` | `/api/audits/:id/reject` | Record rejection, change nothing |
| `GET` | `/api/dashboard/stats` | Live counts for the dashboard cards |
| `GET` | `/api/system/status` | DB / LLM / env status — no secrets |

---

## Hackathon demo script

1. **Dashboard** — counts come from `/api/dashboard/stats`, not constants.
2. **+ Create Agent** → hit *Load demo preset*.
   Name: `Customer Support Agent`
   Task: *"Answer customer questions about orders, shipping and delivery."*
   Tools: all five, including `deleteOrder` and `getPayroll`. Over-grant on purpose.
3. **Use Agent** → `What is the status of order #1024?`
   → it calls `getOrder(1024)` and answers from the database.
4. **The uncomfortable part:** ask `What is the salary of employee E-01?`
   A customer support agent answers, because nobody scoped it. That's the problem.
5. **Audit Agent → Start Audit.** Watch the four LangGraph nodes execute.
6. **Report** — Required: `READ_ORDERS`, `READ_CUSTOMER`. Excessive: `WRITE_ORDERS`,
   `DELETE_ORDERS`, `READ_PAYROLL`. Risk: `HIGH`, with written reasoning per permission.
7. **Approve Changes → Human Approval.** Point out that the audit has been sitting in
   `PENDING` this whole time and nothing has changed yet.
8. **Approve** → **Agent Secured**, `5 → 2`.
9. **The payoff.** Go back to chat:
   - `What is the status of order #1024?` → still works.
   - `What is the salary of employee E-01?` → the agent says it lacks the permission.
   - Hit **Probe getPayroll(E-01)** in the sidebar — this skips the LLM entirely and
     calls the backend directly. It returns `403 PERMISSION_DENIED`.

Step 9's probe is the whole argument: the security boundary is in the server, not the UI.

---

## Security notes

- Sandbox only. Tools touch seeded demo collections and nothing else.
- No real credentials, no outbound calls to enterprise systems.
- API keys and the Mongo URI are never serialized to the client.
- AgentGuard never changes permissions autonomously — approval is a separate, explicit,
  human-triggered endpoint.
- `originalPermissions` is preserved on the agent so "before" survives remediation.
- Every audit is retained with its decision, decider and timestamp.
- Every tool attempt, allowed or denied, is written to `ToolCallLog`.
- Tool calls fail **closed**: unknown tool, missing agent, or missing grant all deny.

## Known limitations

Honest list, since it's a POC:

- **No authentication.** "Security Admin" is hardcoded in the topbar; there's no login,
  so anyone reaching the API can approve an audit. A real deployment needs authn/authz
  on the approval endpoints before anything else.
- **Audit progress is estimated, not streamed.** The node animation is a timer that gets
  corrected by the real `nodeTrace` on completion. Streaming would need SSE or websockets.
- **Chat history lives in browser state**, so it resets on refresh. Conversations aren't
  persisted to Mongo.
- **No LangGraph checkpointer.** Human-in-the-loop is modelled as a separate API call
  rather than a graph `interrupt()` with resumable state. That was a deliberate trade —
  it makes the "nothing can auto-apply" guarantee much easier to verify by reading the
  code — but a production version would likely use a checkpointer.
