# Tasks: Multi-Agent Orchestration

## Implementation Strategy

We will implement the central **Manager Graph** to orchestrate specialized sub-agents. The core of this feature is the **Plan & Execute** pattern, which allows for high-level decomposition of complex requests and resilient execution through a sequential handoff mechanism. We will prioritize the unified state management (`data_store`) and real-time logging to ensure transparency and data continuity across different platforms.

**MVP Scope**: Successful decomposition, approval, and execution of a two-step cross-platform task (Web extract -> App write) with a final natural language summary.

## Phase 1: Setup

- [X] T001 Initialize the `src/agents/manager/` directory structure and ESM exports
- [X] T002 Add orchestration configuration schemas (compaction, preflight) to `config-example.yaml`
- [X] T003 [P] Implement the specialized `data_store` reducer in `src/agents/manager/state.js`

## Phase 2: Foundational

- [X] T004 Implement the **Proactive Readiness Check** utility in `src/services/health_check.js` to probe Appium and BrowserService
- [X] T005 [P] Enhance the `Logger` service in `src/services/logger.js` to support event-driven real-time streaming from sub-agents
- [X] T006 Define the standardized **Sub-Agent Handoff Interface** types and validation logic in `src/lib/handoff_utils.js`
- [X] T007 Implement the **Context Compaction** logic in `src/services/compaction_service.js` using LLM summarization

## Phase 3: User Story 1 - Cross-Platform Composite Task Execution (Priority: P1)

**Goal**: Coordinate multiple sub-agents to complete a shared goal.
**Test**: Verify that a "Web to App" prompt triggers sequential sub-graph calls with shared data.

- [X] T008 [US1] Create the **Manager Graph** skeleton in `src/agents/manager/graph.js` using LangGraph.js
- [X] T009 [US1] Implement the **Execution Node** in `src/agents/manager/nodes/executor.js` that invokes sub-graphs and merges results
- [X] T010 [P] [US1] Update `src/agents/web/graph.js` to conform to the standardized handoff interface
- [X] T011 [P] [US1] Update `src/agents/application/graph.js` to conform to the standardized handoff interface
- [X] T012 [US1] Implement the **Sequential Handoff** state machine logic in the Manager Graph

## Phase 4: User Story 2 - Intelligent Task Planning & Decomposition (Priority: P2)

**Goal**: Split prompts into tasks and get user approval.
**Test**: Verify the agent pauses and waits for 'y' after showing a multi-platform task list.

- [X] T013 [US2] Implement the **Task Decomposer** node in `src/agents/manager/nodes/decomposer.js`
- [X] T014 [US2] Implement the **Plan Approver** node in `src/agents/manager/nodes/approver.js` with CLI interaction
- [X] T015 [US2] Integrate the Decomposer and Approver nodes into the Manager Graph flow
- [X] T016 [P] [US2] Add **Auto-Fix** retry logic in `src/agents/manager/nodes/auto_fix.js` for failed sub-agent tasks

## Phase 5: User Story 3 - Post-Automation Data Extraction & Reasoning (Priority: P3)

**Goal**: Provide a reasoning-based summary of all findings.
**Test**: "Top 3 news" prompt results in a concise summary of exactly 3 items from the `data_store`.

- [X] T017 [US3] Implement the **Summarizer Node** in `src/agents/manager/nodes/summarizer.js` using LLM synthesis
- [X] T018 [US3] Finalize the Manager Graph completion logic to transition from execution to summarization
- [X] T019 [P] [US3] Update `src/cli/index.js` to use the Manager Graph as the primary entry point

## Phase 6: Polish

- [X] T020 [P] Implement detailed telemetry for sub-agent execution times and token usage in the shared context
- [X] T021 [P] Perform an E2E audit of the **Unified Vault Access** to ensure sub-agents retrieve credentials securely
- [X] T022 Conduct a full integration test suite for complex sequences (Web -> Tool -> App)

## Dependencies

1. Phase 2 (Foundational) must be complete before US1 nodes can be finalized.
2. US1 (Cross-Platform) provides the execution framework used by US2 and US3.
3. T019 (CLI update) is blocked by the completion of US1, US2, and US3.

## Parallel Execution Examples

- **Services & Schema**: T003, T005, and T006 can be developed concurrently.
- **Sub-Agent Refactoring**: T010 and T011 can run in parallel.
- **Advanced Logic**: T016 (Auto-Fix) and T017 (Summarizer) can be implemented independently once the basic execution node (T009) is ready.
