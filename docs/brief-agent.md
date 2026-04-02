# Technical Brief

## 1. Task Title

Design and implementation of an AI agent for ticket analysis and triage preparation in L3 support.

---

## 2. Context

### Task Objective

Design and implement an AI agent that analyzes newly escalated tickets in the Product (PRODG) board and provides structured feedback to assess their clarity, completeness, and readiness for L3 triage.

### Current Problem

The current process relies on manual review of tickets by L3 Business Analyst and Product Manager. That leads to:

- Inconsistent evaluation of ticket quality
- Lack of standardization in identifying missing information
- Delays in starting technical investigation
- Difficulty in properly prioritizing issues based on business context (e.g., MRR)

### Goal

Partially automate the initial evaluation of tickets to improve speed, consistency, and quality of the triage process.

### End Users

L3 Business Analyst and Product Manager, who will use the agent to obtain structured feedback before making triage decisions.

---

## 3. Solution Requirements

### Language / Stack
- Language: TypeScript
- Runtime: Node.js
- AI Framework: LangChain
- Interface: CLI
- External Integration: Jira REST API (read-only)

### Architecture
- Modular layered architecture:
    - CLI (input layer)
    - Jira integration service
    - Data normalization layer
    - Agent (analysis engine)
- Stateless service
- Clear separation of concerns between:
    - Data fetching (Jira)
    - Business logic
    - LLM interaction

### Expected Input

- issueKey: string

The agent receives a Jira issue key corresponding to a ticket in the PRODG board and retrieves the following fields:

- fields.summary
- renderedFields.description
- fields.priority.name
- fields.labels
- fields.customfield_10507 (ClientId)
- fields.customfield_10776 (MRR)
- fields.customfield_11598 (Affected Product)
- fields.customfield_11632 (Related SubProduct)
- editmeta (allowed values for Affected Product and Related SubProduct)

### Expected Output

Structured JSON with the following fields:

| Field | Type / values |
| --- | --- |
| `issue_key` | `string` |
| `ticket_summary` | `string` |
| `information_completeness` | Union of literals: `complete`, `partial`, `insufficient` |
| `missing_information` | Array of strings |
| `existing_affected_product` | String or `null` |
| `probable_affected_product` | String or the literal `unknown` |
| `existing_related_subproduct` | String or `null` |
| `probable_related_subproduct` | String or the literal `unknown` |
| `suggested_next_action` | One of the enum values listed below |
| `confidence` | Union of literals: `low`, `medium`, `high` |
| `reasoning` | `string` |

`suggested_next_action` must be one of:

- `add_to_current_bet_sprint`
- `add_to_bet_next_sprint_high_priority`
- `add_to_bet_backlog_for_investigation`
- `escalate_to_core_team`
- `reject_ticket_ask_cx_to_solve`
- `ask_cx_for_additional_information`

---

## 4. Constraints

- The agent must not perform any write operations in Jira.
- The agent must not make final decisions regarding routing or prioritization.
- The agent must not infer product or subproduct without sufficient evidence.
- The agent must only use models and tools explicitly defined in the project.
- The agent must not call external APIs outside the defined architecture.
- The agent must handle incomplete or ambiguous information gracefully.
- The solution must maintain a clear, modular, and maintainable architecture.

---

## 5. Expected Implementation Plan

### Main Components

- CLI interface to receive the issue key
- Jira integration module (REST API)
- Data normalization module
- Agent module (LangChain-based analysis)
- System prompt defining rules and output structure

### Data Flow

1. User runs the CLI with a Jira issue key
2. The system retrieves the ticket data from Jira
3. The data is normalized into a structured format
4. The normalized context is sent to the agent
5. The agent generates a structured analysis
6. The result is returned as JSON

### Design Decisions

- CLI-based interface for simplicity in MVP
- Direct use of Jira REST API instead of CLI tools
- Use of editmeta to dynamically retrieve allowed product/subproduct values
- Clear separation of responsibilities across modules
- Design prepared for future integration as an API or service

---

## 6. Definition of Done (DoD)

The solution is considered complete when:

- The agent successfully accepts a Jira issue key via CLI
- The system retrieves the required ticket data from Jira
- The ticket data is properly normalized
- The agent generates output matching the defined schema
- The output includes:
    - Ticket summary
    - Completeness assessment
    - Missing information detection
    - Product and subproduct suggestions (when applicable)
    - Suggested next action
    - Reasoning
- The agent respects all defined constraints
- The agent handles edge cases (missing fields, unclear context, etc.)
- The code is clean, modular, and documented
- The project runs locally without errors
- A manual validation of outputs has been performed
