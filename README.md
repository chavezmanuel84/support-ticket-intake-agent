# Support Ticket Intake Agent

## 1. Project Overview

This project is a CLI-based AI agent for L3 triage preparation on Jira `PRODG` tickets.  
It fetches one Jira issue, normalizes key fields, runs LLM-based analysis and returns structured JSON recommendations.

The current implementation is MVP-oriented and focused on safe, controlled behavior.

The agent provides recommendations only and is designed to support human decision-making, not replace it.

## 2. Features

- Read-only Jira issue retrieval (`GET /rest/api/3/issue/{issueKey}`)
- Extraction and normalization of relevant fields, including:
  - summary, description, status, priority, labels
  - client ID, MRR, affected product, related subproduct
  - allowed product/subproduct values from `editmeta`
- Status gate for MVP:
  - only tickets with status `"To Do"` are analyzed
  - other statuses return controlled `status: "skipped"` output
- LLM-based structured analysis with schema/literal validation
- Optional `--es` flag for Spanish output (applies to generated analysis fields only; original ticket summary is preserved)
- Controlled JSON outputs for success, skipped, and error paths

## 3. How It Works (high-level flow)

1. Parse CLI input (`issueKey`, optional `--es`)
2. Fetch Jira issue (read-only)
3. Normalize Jira payload into internal ticket structure
4. If normalized status is not `"To Do"`, return `status: "skipped"`
5. If status is `"To Do"`, call the analysis module
6. Validate structured output (schema and enums) and print final JSON

## 4. Installation

Prerequisites:
- Node.js (modern LTS recommended)

Install dependencies:

```bash
npm install
```

Useful commands:

```bash
npm run typecheck
npm run build
```

## 5. Environment Variables (.env)

Create a `.env` file in the project root and define:

- `JIRA_BASE_URL` - Jira base URL (for example, `https://your-domain.atlassian.net/`)
- `JIRA_EMAIL` - Jira user email
- `JIRA_API_TOKEN` - Jira API token
- `OPENROUTER_API_KEY` - OpenRouter API key
- `OPENROUTER_MODEL` - OpenRouter model id (for example, `openai/gpt-4o-mini`)
- `OPENROUTER_BASE_URL` - OpenRouter API base URL (`https://openrouter.ai/api/v1`)

## 6. Usage

Default language (English):

```bash
npm run dev -- PRODG-890
```

Spanish output:

```bash
npm run dev -- --es PRODG-890
```

Built artifact:

```bash
npm run build
npm run start -- PRODG-890
```

## 7. Example Output

Success (eligible `"To Do"` ticket):

```json
{
  "status": "success",
  "issueKey": "PRODG-890",
  "phase": "phase3-agent-analysis",
  "analysis": {
    "issue_key": "PRODG-890",
    "ticket_summary": "Edge case in last-name printing with double \"De\"",
    "information_completeness": "partial",
    "missing_information": [
      "Specific affected product from the allowed list",
      "Detailed replication steps"
    ],
    "existing_affected_product": null,
    "probable_affected_product": "unknown",
    "existing_related_subproduct": null,
    "probable_related_subproduct": "unknown",
    "suggested_next_action": "ask_cx_for_additional_information",
    "confidence": "medium",
    "reasoning": "The issue context is not sufficient to confidently map product/subproduct.",
    "suggested_priority": "medium"
  }
}
```

Skipped (non-eligible status):

```json
{
  "status": "skipped",
  "phase": "phase3-agent-analysis",
  "issueKey": "PRODG-883",
  "ticketStatus": "Done",
  "reason": "Ticket is not eligible for intake analysis in this MVP (status must be \"To Do\")."
}
```

Controlled error (invalid key):

```json
{
  "status": "error",
  "phase": "phase3-agent-analysis",
  "message": "Invalid issue key format. Expected pattern like PRODG-12345."
}
```

## 8. Limitations (MVP scope)

- No Jira write operations (comments, transitions, assignments, field updates)
- Single-issue CLI execution only
- No web UI or service API layer
- No historical memory across tickets
- Output quality remains model-dependent, although schema and enum safety are enforced

## 9. Project Structure

```text
support-ticket-intake-agent/
  docs/
    brief-agent.md
    plan-agent.md
    architecture.md
    guardrails.md
  src/
    cli.ts
    types.ts
    config/
      env.ts
    jira/
      fetchIssue.ts
      normalizeIssue.ts
    agent/
      model.ts
      analyzeTicket.ts
    prompts/
      prompt.ts
```

## 10. Future Improvements

- Expand automated scenario validation for Phase 4+ (beyond manual CLI runs)
- Improve observability and operator-facing diagnostics while keeping safe outputs
- Add API wrapper around the same pipeline (without changing core module responsibilities)
- Continue refining prompt constraints and validation rules based on production-like cases