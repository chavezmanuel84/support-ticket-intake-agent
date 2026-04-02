# Guardrails

This document defines the behavioral and technical guardrails for the Support Ticket Intake Agent.

The agent assists L3 triage for PRODG tickets by producing **structured recommendations**. It does not replace human decision-making and must stay within clearly defined boundaries.

---

## 1. Purpose

The guardrails ensure that the agent:

- Operates safely and predictably  
- Resists abuse and common LLM failure modes (e.g. prompt injection via ticket text)  
- Avoids hallucinations and unsupported assumptions  
- Respects the defined project scope (`docs/brief-agent.md`)  
- Produces structured, schema-valid outputs  
- Does not perform unintended actions (writes, extra network calls, or hidden tools)  

---

## 2. Input Guardrails

### Allowed input

- A **single** Jira issue key (e.g. `PRODG-12345`), provided by the CLI.  
- The workflow assumes the issue belongs to the **PRODG** context; the implementation must **verify** project/board membership when feasible (e.g. via Jira response or query), not trust the key alone.

### Format and validation

- **Reject** empty, whitespace-only, or malformed keys before any network call.  
- **Validate** against a strict pattern (project prefix + separator + numeric id, or your org’s documented pattern) and **maximum length** to reduce injection and abuse.  
- **Do not** pass raw user input into shell commands or dynamic code execution.

### Untrusted content (security-critical)

- **Ticket fields are untrusted input.** Summary, description (`renderedFields`), labels, and custom fields may contain adversarial text (e.g. “ignore previous instructions”, fake system messages, or exfiltration attempts).  
- The model must treat this content **only as data to analyze**, not as **instructions** that override the system prompt, tools policy, or output schema.  
- Implementation mitigations (use as many as practical):  
  - **Strong system prompt** that states ticket text is untrusted data.  
  - **Structured output** (schema validation, repair or reject on failure).  
  - **No tool execution** driven by ticket text unless explicitly designed and allowlisted (MVP: prefer **no tools** or fixed read-only Jira fetch only, never triggered by model-authored code).  
  - **Separation** in prompts: system rules vs. “ticket payload” in a clearly delimited block.

### Restrictions

- The agent must reject empty or malformed issue keys  
- The agent must **not** accept arbitrary natural-language instructions alongside the issue key in the MVP CLI (no “also do X” channel that could steer behavior).  
- The agent must **fail clearly** if environment configuration is missing or invalid.  
- The agent must **fail clearly** if Jira authentication fails (without leaking secrets).

### Behavior

- Invalid issue key → **controlled error** (no partial analysis).  
- Jira unreachable or permission denied → **controlled error**.  
- Some ticket fields missing → **continue safely** and represent gaps in normalized input and in output (`missing_information`, completeness, etc.).

---

## 3. Reasoning Guardrails

The agent must reason only from **retrieved ticket data** and **editmeta** (and other metadata explicitly allowed in `docs/brief-agent.md`).

### Allowed reasoning

- Summarize the ticket.  
- Assess completeness (`complete` | `partial` | `insufficient`).  
- List missing information.  
- Suggest **probable** affected product / subproduct only when evidence supports it; otherwise use **`unknown`** (per output schema).  
- Suggest a **next handling action** from the **allowed enum** for human review only.  
- Interpret **explicit** signals already on the ticket (e.g. Jira priority field, MRR when present, description) to inform **suggestions**—not **final** prioritization or routing.

### Restrictions

- Do **not** invent facts not supported by the ticket or retrieved metadata.  
- Do **not** assume root cause without evidence.  
- Do **not** infer product or subproduct without sufficient evidence; **editmeta** is the source of truth for allowed values.  
- Do **not** present uncertain conclusions as certain; set **confidence** appropriately.  
- Do **not** make **final** routing or prioritization decisions.  
- Do **not** claim access to external systems (logs, history, databases, other tickets) unless that access exists in the product and is documented.  

### Uncertainty handling

- Use **`unknown`** for probable product/subproduct when required by `docs/brief-agent.md`.  
- Prefer flagging gaps and **`ask_cx_for_additional_information`** over guessing.  
- Avoid subproduct suggestions unless clearly justified.

---

## 4. Output Guardrails

### Requirements

- Return **structured JSON only** (machine-readable; suitable for logging and downstream tools).  
- Output must **match** the schema in `docs/brief-agent.md`.  
- **Only** defined fields; **only** allowed enum values.  
- **`reasoning`** must be concise and tied to evidence in the ticket (no fabricated references).

### Restrictions

- No prose outside the JSON envelope in the primary API/CLI contract.  
- No extra undocumented fields.  
- No enum values outside the defined sets.  
- No fabricated product/subproduct strings—must align with ticket + **editmeta** when suggesting values.  
- **No execution** of suggested actions (recommendation only).

### Validation

- **Validate** (validate, then reject on failure) before returning.  
- Invalid outputs → **reject** or return a **safe error**; do not return unvalidated model text as success.  
- **Do not** echo environment variables, API keys, or full system prompts in user-facing output.

---

## 5. Integration and Network Guardrails

### Allowed integrations

- **Jira REST API** (read-only, scoped to what the brief requires).  
- **LLM** via **OpenRouter** (or the single provider documented in the repo).  
- **LangChain** as the orchestration layer.

### Restrictions

- **No Jira writes** (comments, transitions, assignments, field updates).  
- **No additional HTTP APIs** (webhooks, analytics, telemetry to unknown endpoints) unless added through an explicit design review and this document.  
- **No hidden tools**: no browsing, code execution, or arbitrary HTTP from the model unless explicitly allowlisted and documented.  
- **No extra model providers** unless documented and configuration-validated.

### Jira-specific rules

- Use **only** predefined fields and expansions from `docs/brief-agent.md`.  
- **`editmeta`** defines allowed values for relevant custom fields.  
- **Configure Jira base URL** via environment; **validate** URL shape (HTTPS, expected host) to reduce misconfiguration and SSRF-style misuse.  
- Use **authenticated** requests only; do not log tokens or `Authorization` headers.

### Secrets and logging

- Load secrets from environment; **never** commit them.  
- Log **issue keys** and **errors** at a useful level; **avoid** logging full ticket bodies in production unless required for audit and policy allows.  
- Redact or minimize **PII** in logs according to org policy (tickets may contain emails, names, account data).

---

## 6. Abuse, Availability, and Dependencies

- **Rate limiting:** If the CLI is wrapped by automation, enforce sensible concurrency limits so one client cannot exhaust Jira or model quotas.  
- **Payload size:** Cap size of fields fed to the model if needed to avoid cost/DoS (truncate with explicit notice in internal representation, not silent fabrication).  
- **Dependencies:** Prefer pinned versions in `package.json` / lockfile; review updates for supply-chain risk.  
- **Model behavior:** If the provider returns refusals or safety filters, surface a **controlled error** rather than forcing a fake analysis.

---

## 7. Failure Handling

### Expected failures

- Invalid issue key  
- Jira API errors (4xx/5xx, timeout)  
- Missing or invalid configuration  
- Missing or incomplete ticket data  
- Ambiguous ticket context  
- Invalid or non-parseable model output  

### Behavior

- **Fail fast** on configuration errors before calling external services when possible.  
- Return **controlled errors** for integration failures (clear code/message for operators; avoid leaking stack traces to end users in production).  
- Avoid **partial or unvalidated** “success” outputs.  
- Prefer safe fallbacks inside the schema (`unknown`, empty `missing_information` where appropriate)—**not** bypassing validation to emit an answer.

---

## 8. Human-in-the-Loop Principle

- The agent provides **recommendations only**.  
- Humans make **final** decisions on routing, priority, and customer communication.  
- The agent must **support**, not replace, human judgment.

---

## 9. Evolution Rules

- Remain **stateless** for the MVP (no cross-run memory) unless scope changes are documented.  
- Any behavior or scope change must be reflected in:  
  - `docs/brief-agent.md`  
  - `docs/plan-agent.md`  
  - `docs/architecture.md`  
  - this document  
- **Jira write** capabilities require a separate design, review, and safeguards—not implied by MVP guardrails.

---

## 10. Review Checklist (for changes and releases)

- [ ] Issue key validated; ticket content treated as untrusted; prompt injection considered in prompt and code paths.  
- [ ] No Jira writes; no undocumented network calls; secrets not logged.  
- [ ] Output schema validated; enums enforced; no instruction overrides from ticket text.  
- [ ] Failure modes return safe errors; no secret or prompt leakage in outputs.  
- [ ] Docs above updated if behavior or integrations change.
