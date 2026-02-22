# Feature Specification: Simplified Reactive Agent Flow

**Feature Branch**: `006-simplify-agent-flow`  
**Created**: 2026-02-22  
**Status**: Draft  
**Input**: User description: "agent flow가 너무 복잡하니 심플하게 가져가자 manager agent는 plan & execute 기반으로 -사용자 요청 분석 -사용가능한 툴 기반으로 plan 수립 -툴이 필요없는 LLM 자체만 가능한 수준이면 툴 없이 자체적으로 수행 -수립 된 plan execute -실패하거나 replanning이 필요하면 replan -완료시 summarize하여 사용자에게 보고 web agent는 -manager가 요청한 web 탐색 수행 plan 수립 -plan 수립 시 사용자가 요청한 작업을 위한 웹사이트 진입 -plan 방향은 -웹사이트 진입 후 dom capture 후 ax tree 생성 -사용자가 요구하는 element 추출 및 타겟팅 -사용자가 요구하는 동작 수행(버튼 클릭, 정보 수집 등) -dom capture 후 ax tree 생성 (모든 action 후에는 필수) -다음 사용자 요구하는 element 추출 및 타겟팅 -사용자가 요구하는 동작 수행(버튼 클릭, 정보 수집 등) -반복 -최종 결과 및 수행 summary를 manager agent에게 반환"

## Clarifications

### Session 2026-02-22
- Q: 이번 기능 구현에서 명시적으로 제외할(Out-of-scope) 복잡한 웹 시나리오는 무엇입니까? → A: 예외 없이 모든 웹 시나리오(CAPTCHA, iFrame, 멀티 탭 등)를 분석 및 탐색 범위에 포함함.
- Q: 하나의 미션을 완료하기 위해 Manager 에이전트가 허용하는 최대 재계획(Replan) 횟수는 몇 회입니까? → A: 3~5회 (표준적인 자율 복구 수준).
- Q: Manager 에이전트가 수립한 여러 태스크는 어떤 순서로 실행됩니까? → A: 순차 실행 (Sequential). 데이터 흐름 정합성을 위해 한 번에 하나의 태스크만 수행함.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unified Manager Orchestration (Priority: P1)

As a user, I want the system to determine if a task can be solved directly by the AI or if it requires specialized tools, so that I receive answers efficiently without unnecessary overhead.

**Why this priority**: This is the fundamental routing logic. It optimizes resource usage and response speed.

**Independent Test**: Provide a prompt that only requires information synthesis (e.g., "Write a poem about robots") and verify no tools are called. Then provide a prompt requiring web access (e.g., "Find the latest price of Gold") and verify a plan is created.

**Acceptance Scenarios**:

1. **Given** a non-technical request, **When** processed by the Manager Agent, **Then** it produces a direct response without initiating a tool-based execution plan.
2. **Given** a request requiring automation, **When** processed by the Manager Agent, **Then** it generates an Execution Plan mapping intents to specific tools.

---

### User Story 2 - Reactive Web Navigation Loop (Priority: P2)

As a system owner, I want the web agent to update its understanding of the page state after every single interaction, so that it can handle dynamic pages where elements appear or change after a click.

**Why this priority**: Ensures robustness in real-world web environments where static plans frequently fail.

**Independent Test**: Initiate a multi-step web task (e.g., "Login and then click on Profile"). Verify that after the "Login" click, the agent captures the new DOM and regenerates the AXTree before attempting to find the "Profile" element.

**Acceptance Scenarios**:

1. **Given** the agent is on a web page, **When** an action is performed, **Then** the agent MUST capture the DOM and update the AXTree before selecting the next target element.
2. **Given** a target element is needed, **When** the AXTree is available, **Then** the agent selects the technical selector based on the AXTree's semantic roles and labels.

---

### User Story 3 - Autonomous Recovery via Replanning (Priority: P3)

As a user, I want the agent to automatically re-evaluate its plan if a step fails, so that I don't have to manually restart the entire process for minor errors.

**Why this priority**: Minimizes the need for human intervention and improves the overall success rate of long-running missions.

**Independent Test**: Simulate a failure where a tool returns an error. Verify that the Manager Agent receives the error, analyzes the current state, and produces a revised Execution Plan.

**Acceptance Scenarios**:

1. **Given** a tool execution fails, **When** the Manager Agent receives the failure report, **Then** it initiates a "replan" cycle to find an alternative path to the user's original goal.

### Edge Cases

- **Task requires a tool that isn't available**: The manager should perform as much as possible via LLM or inform the user about the missing capability.
- **AXTree generation fails (e.g., empty page)**: The web agent should wait for a timeout or report a "Dead End" to the manager for replanning.
- **Infinite replanning loop**: The system MUST implement a hard limit of 3 to 5 replanning cycles per mission. If the limit is reached without success, the system reports the final failure state to the user.
- **Complex Web Scenarios**: The system MUST attempt to analyze all available web structures, including iFrames, Shadow DOMs, and multi-tab environments, to fulfill the reactive planning mandate.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST be implemented using **Node.js and JavaScript (ESM)** only.
- **FR-002**: Agents MUST utilize **LangGraph.js** for stateful orchestration.
- **FR-003**: Automation and side effects MUST be implemented via **Robot Framework**.
- **FR-004**: Implementation MUST follow **TDD** (Tests written and failing before code).
- **FR-005**: The Manager Agent MUST support an "LLM-Direct" path that bypasses planning if the user request can be satisfied without tools.
- **FR-006**: The Manager Agent MUST produce a structured JSON Execution Plan consisting of sequential steps before calling sub-agents.
- **FR-007**: The Web Agent MUST perform a "Capture & Analyze" cycle (DOM capture -> AXTree generation) before and after every interaction step.
- **FR-008**: The Web Agent MUST use the AXTree to resolve natural language element descriptions into technical selectors.
- **FR-009**: The system MUST implement a "Summarizer" node that consolidates all execution history into a final user-friendly report.
- **FR-010**: The Web Agent MUST proactively analyze all available document contexts, including embedded structures (iframes) and state changes, to maintain mission continuity.
- **FR-011**: The Manager Agent MUST track the number of replanning attempts and terminate with a summary if the limit (3-5) is exceeded.
- **FR-012**: Execution steps MUST be performed strictly one at a time, ensuring data from step N is available for step N+1.

### Key Entities *(include if feature involves data)*

- **Mission State**: The global context in LangGraph, tracking the original request, current plan, execution history, and data store.
- **Accessibility Tree (AXTree)**: A hierarchical list of page elements with roles (button, link, etc.) and accessible names, used for LLM-based targeting.
- **Execution Step**: A discrete unit of work containing an intent, a tool reference, and parameters.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of "simple" requests (not requiring tools) are answered without initiating a multi-agent plan.
- **SC-002**: 95% of web element targeting actions succeed on the first attempt by using the updated AXTree state.
- **SC-003**: The system recovers from recoverable errors (e.g., transient network issues) in 100% of cases where the error is resolved within 5 replan attempts.
- **SC-004**: Final summaries are provided to the user within 5 seconds of the last execution step completing.

## Assumptions

- We assume the presence of a reliable DOM-to-AXTree conversion utility.
- We assume that the LLM used for planning has sufficient context window to handle the AXTree of complex pages.
