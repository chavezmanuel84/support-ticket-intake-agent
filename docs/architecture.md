# Architecture

This project implements an AI agent using **TypeScript**, **Node.js**, **LangChain**, and an **OpenRouter**-hosted model (see `docs/plan-agent.md`) with a modular structure designed for clarity, testability, and incremental extension.

Tickets live on the **Product (PRODG)** board; the CLI accepts a single Jira **issue key** and returns **structured JSON** matching the schema in `docs/brief-agent.md`. **Jira access is read-only** for the MVP.

---

## 1. End-to-end flow

1. The CLI receives a Jira `issueKey` in `src/cli.ts`.
2. `src/jira/fetchIssue.ts` calls the Jira REST API and retrieves issue fields (including `renderedFields`), plus **`editmeta`** for allowed Affected Product and Related SubProduct values.
3. `src/jira/normalizeIssue.ts` maps the raw response into a stable internal shape for the agent (including allowed picklist values).
4. `src/agent/analyzeTicket.ts` builds context and invokes the LangChain agent.
5. The agent uses the chat model from `src/agent/model.ts` (OpenRouter), the agent instructions from `src/prompts/prompt.ts`, and project constraints.
6. The agent analyzes the ticket and emits structured JSON aligned with the brief (validate structured output and fail clearly if invalid.).
7. The CLI prints the final JSON for the user.

Configuration is loaded and validated in `src/config/env.ts` (Jira credentials, model/API keys, base URLs).

---

## 2. Module responsibilities

| Module | Responsibility |
| --- | --- |
| `src/cli.ts` | Entry point: parse input, orchestrate fetch → normalize → analyze, print JSON. |
| `src/config/env.ts` | Load environment variables; validate required settings before any API or model calls. |
| `src/types.ts` | Shared types (e.g. normalized ticket, analysis output) aligned with the brief schema. |
| `src/jira/fetchIssue.ts` | Jira REST calls: issue with required fields/expansions and `editmeta` for custom fields. |
| `src/jira/normalizeIssue.ts` | Extract fields from the Jira payload; produce a consistent object for the agent. |
| `src/prompts/prompt.ts` | Defines the agent behavior, constraints, reasoning boundaries, and output expectations. |
| `src/agent/model.ts` | Instantiate the LangChain chat model (OpenRouter). |
| `src/agent/analyzeTicket.ts` | Run the agent on normalized data; validate or repair structured output. |

Folder layout matches the separation in `docs/brief-agent.md` (CLI → Jira → normalization → agent) and `docs/plan-agent.md` (configuration module, LangChain analysis, prompt design).

---

## 3. Design decisions

- **CLI-first MVP** — Simple to run and test; aligns with the brief and plan.
- **Direct Jira REST API** — Explicit control over fields, `renderedFields`, and `editmeta`.
- **Normalization layer** — Keeps Jira quirks out of prompts and agent logic.
- **Prompts separate from agent wiring** — `src/prompts/prompt.ts` holds rules and expected JSON shape; `analyzeTicket.ts` handles orchestration.
- **Stateless runs** — No cross-ticket memory; aligns with plan scope (no historical analysis in MVP).
- **Strict output schema** — Matches `docs/brief-agent.md` for predictable downstream use.

Optional **English / Spanish** responses (see `docs/plan-agent.md`) can be implemented via prompt or CLI flag without changing the core layering above.

---

## 4. Constraints (architecture-level)

These follow `docs/brief-agent.md`:

- No Jira **write** operations (comments, transitions, fields).
- No **final** routing or prioritization decisions by the agent—outputs support human triage only.
- No **product/subproduct** guesses without sufficient evidence; use `editmeta` and confidence fields.
- **No extra external APIs** beyond Jira and the configured model provider (OpenRouter).

---

## 5. Recommended evolution

Aligned with `docs/brief-agent.md` and `docs/plan-agent.md` (future-facing, not MVP commitments):

- Expose the same pipeline behind an HTTP **API** for integration with other tools.
- **Persistent logging** and audit trails for production operation.
- **Evaluation** harnesses (quality and consistency metrics) for prompt and model changes.
- Richer context sources (e.g. related tickets, runbooks)—still subject to “no scope creep” until MVP is stable.

Jira **write** access (comments, labels, transitions) remains **out of scope** for the current product constraints; if ever considered, it would require explicit policy, safeguards, and a separate design—not assumed here.
