# Implementation Plan – Support Ticket Intake Agent

## 1. Objective of the Plan

Build and consolidate a TypeScript + Node.js + LangChain + OpenRouter agent application that analyzes PRODG Jira tickets and produces structured feedback to support human triage.

The solution must:
- provide clear, accurate, and consistent outputs  
- maintain a modular and extensible architecture  
- retrieve data through predefined Jira API queries  
- preserve quality through validation, testing, and documentation  

---

## 2. Execution Principles

1. **Small and verifiable changes:**  
   Each modification must be incremental, testable, and easy to validate.

2. **Read-only first approach:**  
   The agent must operate strictly in read-only mode with Jira.

3. **Clear separation of responsibilities:**  
   Each module must have a single, well-defined responsibility.

4. **No assumptions without evidence:**  
   The agent must rely only on available ticket data.

5. **Document relevant decisions:**  
   All important changes in behavior, configuration, or constraints must be documented.

6. **Safe agent evolution:**  
   New changes must not break existing functionality.

---

## 3. Scope

### Includes (MVP)

- CLI-based input accepting a single Jira issue key  
- Retrieval of ticket data via Jira REST API (read-only)  
- Extraction of predefined fields and allowed values (`editmeta`)  
- Data normalization into a consistent internal structure  
- AI-based analysis using LangChain  
- Structured JSON output following the defined schema  
- Suggestions for:
  - completeness assessment  
  - missing information  
  - probable product and subproduct (when justified)  
  - suggested priority (using allowed literal values from `docs/brief-agent.md`)  
  - next handling action  
- Strict validation of configuration before execution  
- Support for English (default) and Spanish (optional) responses  

---

### Does NOT Include

- Additional external integrations beyond Jira  
- Web or graphical interfaces  
- Multi-agent orchestration  
- Any write operations in Jira  
- Automated execution of suggested actions  
- Historical analysis or memory across multiple tickets  

---

## 4. Plan by Phases

Development follows the phases below in order. Each phase has activities, deliverables, and exit criteria before moving on.

### Phase 0: Alignment and Setup

**Objective:**  
Ensure a shared understanding of the project scope, validate the initial setup, and confirm that all required inputs and structures are ready for development.

**Activities:**

- Review and validate `docs/brief-agent.md`  
- Confirm repository structure and architecture  
- Validate Jira API request structure  
- Define representative test cases (complete, incomplete, ambiguous tickets)  

**Deliverables:**

- Validated brief and agreed scope  
- Confirmed project structure  
- Defined Jira request format  
- Initial test scenarios  

**Exit Criteria:**

- Shared understanding of scope  
- Project structure and data sources validated  

---

### Phase 1: Architecture and Foundations

**Objective:**  
Establish a modular, scalable, and maintainable project structure.

**Activities:**

- Initialize project (Node.js + TypeScript)  
- Create base folder structure  
- Configure environment variables  
- Implement Jira service skeleton  
- Implement normalization module skeleton  
- Implement agent module skeleton  
- Define base types and interfaces  
- Set up configuration module  

**Deliverables:**

- Project initialized and runnable  
- Core modules created  
- Environment configuration defined  

**Exit Criteria:**

- Project runs without errors  
- Modules are connected at a basic level  

---

### Phase 2: Jira Integration and Data Preparation

**Objective:**  
Ensure reliable retrieval and preparation of ticket data from Jira.

**Activities:**

- Configure authentication via environment variables  
- Implement Jira API request with required fields and expansions  
- Extract required fields from response  
- Retrieve allowed values using `editmeta`  
- Handle API errors and edge cases  
- Normalize Jira data into a structured format  

**Deliverables:**

- Working Jira integration service  
- Normalized ticket structure  
- Error handling for invalid inputs  

**Exit Criteria:**

- Valid issue key returns correct normalized data  
- Errors handled gracefully  

---

### Phase 3: Agent Logic and Prompt Design

**Objective:**  
Implement the reasoning layer that analyzes ticket data and produces structured outputs.

**Activities:**

- Define system prompt (role, scope, constraints)  
- Define output schema and enforce JSON structure  
- Enforce literal-value validation for `suggested_priority` and `suggested_next_action`
- Implement LangChain-based analysis flow  
- Pass normalized data and allowed values into agent context  
- Validate and sanitize agent outputs  
- Refine prompts to reduce hallucinations  

**Deliverables:**

- System prompt definition  
- Agent analysis module  
- Structured output generation  
- Output validation layer  

**Exit Criteria:**

- Agent produces valid structured outputs  
- Agent respects scope and constraints  

---

### Phase 4: Testing, Validation, and Guardrails

**Objective:**  
Ensure stability, safety, and correct behavior across scenarios.

**Activities:**

- Test normal cases  
- Test incomplete tickets  
- Test ambiguous tickets  
- Validate output format and tone
- Validate enum/literal compliance for `suggested_priority` and `suggested_next_action`
- Verify input constraints  
- Test safety for unsupported inputs  
- Confirm no unsafe recommendations  

**Deliverables:**

- Test scenarios (happy path + edge cases)  
- Output validation checks  
- Guardrail validation  

**Exit Criteria:**

- Stable outputs across scenarios  
- Safe handling of edge cases  
- Compliance with constraints  

---

### Phase 5: Documentation and Handoff

**Objective:**  
Prepare the project for continuity, maintenance, and future evolution.

**Activities:**

- Update `README.md` with setup and usage  
- Synchronize all documentation  
- Document limitations and assumptions  
- Define realistic next steps  
- Ensure configuration and behavior are documented  

**Deliverables:**

- Complete and consistent documentation  
- Handoff-ready project  
- Defined improvement roadmap  

**Exit Criteria:**

- New contributors can run and understand the project  
- Documentation matches implementation  

---

## 5. Suggested Timeline (Iterative)

- Phase 0 + Phase 1: Setup and architecture  
- Phase 2: Jira integration  
- Phase 3: Agent implementation  
- Phase 4: Testing and validation  
- Phase 5: Documentation and closure  

---

## 6. Global Acceptance Criteria (Operational DoD)

The project is considered complete when:

- The agent fulfills its purpose of triage preparation  
- Structured outputs are consistent and reliable  
- Jira integration works correctly  
- Configuration is validated and documented  
- Tests and validations pass without regressions  
- Documentation reflects the real system behavior  
- Output fields using union literals (including `suggested_priority`) are always schema-valid


---

## 7. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Incorrect or inconsistent agent outputs | Strong prompt design and output validation |
| Missing or poor-quality ticket data | Robust missing-information detection |
| Misclassification of product or subproduct | Use `editmeta` allowed values and confidence thresholds |
| Scope creep | Strict adherence to MVP scope |
| Integration failures with Jira | Error handling and input validation |

---

## 8. Next Steps

1. Execute Phase 0 to align scope and setup  
2. Implement features incrementally by phase  
3. Validate functionality after each phase  
4. Document all relevant decisions  
5. Expand capabilities only after stabilizing MVP

