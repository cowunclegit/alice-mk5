# Feature Specification: Multi-Agent Orchestration

**Feature Branch**: `003-multi-agent-orchestration`  
**Created**: 2026-02-19  
**Status**: Draft  
**Input**: User description: "web, application 생성, tool 실행은 sub-agent로 두고 사용자의 요청에 따라 각각의 sub-agent를 적절히 섞어서 실행해야해 예를들어 '네이버에서 한로로 검색하고 뉴스탭에서 뉴스 타이틀과 링크 추출해서 저장해주고 top 뉴스 3개 알려줘' 라고 하면 sub-agent 실행 판단 -> web sub-agent로 네이버에서 한로로 검색 -> 뉴스탭 -> 뉴스 타이틀과 링크 추출해서 저장 -> sub-agent 종료 -> sub-agent에서 실행된 결과를 바탕으로 top 뉴스 3개 추출 sub-agent를 실행하는 main agent는 Plan & Execute를 지원하자"

## Clarifications

### Session 2026-02-19
- Q: How should sub-agent results be passed back? → A: Structured JSON Only (token-efficient extraction).
- Q: Should the main agent support parallel sub-agent execution or strictly sequential? → A: Strictly Sequential (avoids resource contention).
- Q: What should be the default behavior if a sub-agent in a multi-step plan fails? → A: Autonomous Auto-Fix (Main agent attempts plan revision or retry).
- Q: Should the Main Agent require user approval of the plan before execution? → A: Mandatory Approval (Display plan and wait for confirmation).
- Q: How should the shared context data be structured for sub-agent communication? → A: Full Visibility with Compaction (B): Sub-agents receive the full data_store, but oldest results are compacted when a threshold (set in config.yaml) is reached.
- Q: How should browser/app sessions be managed during sub-agent transitions? → A: State Persistence (Keep sessions open until the entire Main Agent task is finalized).
- Q: How should the Main Agent provide the final result to the user? → A: Natural Language Summary (Synthesize all data_store findings using an LLM).
- Q: How should sensitive credentials be shared across multiple sub-agents? → A: Unified Vault Access (Each sub-agent independently queries VaultService using keys).
- Q: How should the readiness of infrastructure (Appium, Browser) be monitored for multi-step tasks? → A: Proactive Readiness Check (Manager pings all required services after plan approval but before execution).
- Q: How should the progress of sub-agents be displayed in the Main Agent's CLI? → A: Full Transparent Logs (Stream every internal step and log from the sub-agent in real-time).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cross-Platform Composite Task Execution (Priority: P1)

As a user, I want to provide a complex request involving multiple platforms (web, desktop app) so that the agent can automatically orchestrate different sub-agents to complete the entire goal.

**Why this priority**: This is the core functionality of the orchestration feature, enabling the "main agent" to manage specialized sub-agents.

**Independent Test**: Provide a prompt like "Search Naver for '나는솔로', extract news, and then open Notepad to write the top 3 titles." The main agent should coordinate the Web sub-agent first, then the Application sub-agent.

**Acceptance Scenarios**:

1. **Given** a complex prompt requiring both web and app actions, **When** the main agent starts, **Then** it MUST generate a high-level plan using the Plan & Execute pattern.
2. **Given** a high-level plan, **When** executing a web task, **Then** the main agent MUST hand off control to the Web Sub-Agent and wait for completion.
3. **Given** a sub-agent has finished, **When** data is returned, **Then** the main agent MUST store that data in a shared context for subsequent tasks.

---

### User Story 2 - Intelligent Task Planning & Decomposition (Priority: P2)

As a system operator, I want the main agent to intelligently split a user's prompt into atomic tasks assigned to specific sub-agents and present the plan for my approval so that I can ensure the automation is safe and correct.

**Why this priority**: High-quality planning and safety confirmation are critical for reliable multi-step execution.

**Independent Test**: Verify that the main agent generates a structured JSON plan and pauses for user input before any sub-agent is invoked.

**Acceptance Scenarios**:

1. **Given** a prompt "Search Naver and then run tool 'my-app-macro'", **When** planning is complete, **Then** the system MUST display the plan and wait for "Yes" before proceeding to execution.

---

### User Story 3 - Post-Automation Data Extraction & Reasoning (Priority: P3)

As a user, I want the main agent to process the results of automation (like list of news) and provide a reasoning-based answer (like top 3 news) so that I don't have to manually read logs.

**Why this priority**: Provides the "final mile" of value by turning raw automation output into human-readable answers.

**Independent Test**: Run a task that extracts a list of items. The final response should be a concise summary of the requested number of items based on the extracted data.

**Acceptance Scenarios**:

1. **Given** a list of 10 news articles extracted by a sub-agent, **When** the user requested "top 3", **Then** the main agent MUST analyze the list and output exactly 3 items.

### Edge Cases

- **Sub-Agent Failure**: What happens if the Web sub-agent fails halfway through a composite task? (Main agent should attempt recovery or notify the user with partial results).
- **Missing Sub-Agent**: How does the system handle a plan that requires a sub-agent type that is not configured?
- **State Conflict**: How is the browser/app state managed if the user changes intent mid-execution?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST be implemented using **Node.js and JavaScript (ESM)** only.
- **FR-002**: Main Agent MUST utilize **LangGraph.js** to implement the **Plan & Execute** pattern.
- **FR-003**: System MUST support three primary sub-agent types: **Web**, **Application**, and **Tool Execution**.
- **FR-004**: Implementation MUST follow **TDD** (Tests written and failing before code).
- **FR-005**: The Main Agent MUST maintain a **Shared State (Context)** where sub-agents have **Full Visibility** of the `data_store` to reference any previous results across the session.
- **FR-006**: The Main Agent MUST be capable of decomposing a natural language prompt into a list of tasks, each assigned to a specific sub-agent.
- **FR-007**: System MUST support **Sequential Handoff**: Main Agent -> Sub-Agent (Start) -> Sub-Agent (Execute) -> Sub-Agent (Finish/Return) -> Main Agent.
- **FR-008**: The Main Agent MUST provide a **Natural Language Summary** as the final output, using an LLM to synthesize all findings accumulated in the `data_store`.
- **FR-009**: Sub-agents MUST return results to the Main Agent in a **Structured JSON** format containing only the essential data requested.
- **FR-010**: The Main Agent MUST orchestrate sub-agent execution **Strictly Sequentially** to maintain resource and state integrity.
- **FR-011**: System MUST implement an **Autonomous Auto-Fix** policy where the Main Agent attempts to revise the plan or retry a failed sub-agent before terminating.
- **FR-012**: The Main Agent MUST present the high-level plan (tasks and assigned sub-agents) to the user and wait for a **Mandatory Approval** (text-based confirmation) before beginning execution.
- **FR-013**: System MUST implement a **Context Compaction** mechanism that summarizes or removes the oldest entries in the `data_store` when a threshold defined in `config.yaml` (e.g., token count or number of steps) is reached.
- **FR-014**: Sub-agents MUST independently interface with the **Vault Service** using secret keys to retrieve sensitive credentials, ensuring no plain-text passwords are stored in the shared `data_store` or execution logs.
- **FR-015**: The Main Agent MUST perform a **Proactive Readiness Check** by pinging or probing all required platform services (e.g., Appium server, Browser service) immediately after plan approval to ensure execution environments are available before the first task begins.
- **FR-016**: The Main Agent MUST stream **Full Transparent Logs** from the active sub-agent directly to the CLI, showing every internal Robot Framework keyword execution and agent reasoning step in real-time.

### Key Entities

- **Main Agent (Planner/Executor)**: The orchestrator responsible for high-level planning and state management.
- **Sub-Agent**: A specialized agent (Web, App, Tool) that performs atomic platform-specific automation.
- **Shared Context**: A central data store in the Manager State containing intent, tasks, extracted data, and file paths.
- **Task Plan**: An ordered list of task objects, each containing an intent and a platform target.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 90% of multi-platform requests (Web + App) are correctly decomposed into the appropriate sub-agent tasks.
- **SC-002**: Data extracted in a Web task is successfully used as input in a subsequent App task in 100% of successful runs.
- **SC-003**: The main agent provides a final summarized answer based on sub-agent data within 10 seconds of sub-agent completion.
- **SC-004**: System architecture maintains strict logical separation between Planner, Executor, and individual Sub-Agents.
