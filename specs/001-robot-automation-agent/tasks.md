# Tasks: Robot Automation Agent

**Input**: Design documents from `/specs/001-robot-automation-agent/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/service.md

**Tests**: TDD approach strictly enforced per Project Constitution. Write failing Jest tests before implementing logic.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization with Node.js/JS focus

- [x] T001 Create project structure: src/{agents,robots,memory,services,cli,lib}
- [x] T002 [P] Initialize Node.js project: package.json (ESM), install dependencies (langgraph, langchain, cheerio, js-yaml, jest)
- [x] T003 [P] Configure Robot Framework: install robotframework-browser, run rfbrowser init
- [x] T004 [P] Setup Jest configuration for ESM and TDD in jest.config.js

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure for agents, robots, and configuration

- [x] T005 Implement Configuration Service to load config.yaml via js-yaml in src/services/config_service.js
- [x] T006 Implement Vault Service for AES-256-GCM credential encryption in src/services/vault_service.js
- [x] T007 [P] Create core Robot resources: src/robots/core.resource with Open, Navigate, Click, Type keywords
- [x] T008 Implement Robot Bridge to execute CLI commands and capture output in src/services/robot_bridge.js
- [x] T009 Implement DOM Pruning utility to strip noisy tags using Cheerio in src/services/analysis_service.js
- [x] T010 Implement Element Extraction logic using Cheerio in src/services/analysis_service.js
- [x] T011 Define central Agent State and LangGraph.js base structure in src/agents/state.js

---

## Phase 3: User Story 1 - Dynamic Web Task Execution (Priority: P1) 🎯 MVP

**Goal**: Transform natural language into executed browser actions using Plan, Analyze & Execute.

**Independent Test**: Provide "Go to google.com" via CLI. Agent should plan, analyze the page, and execute the navigation in a visible browser.

### Tests for User Story 1 (MANDATORY per TDD) ⚠️

- [x] T012 [P] [US1] Unit tests for Planner node in tests/unit/planner.test.js
- [x] T013 [P] [US1] Unit tests for Analyzer node (with HTML mocks) in tests/unit/analyzer.test.js
- [x] T014 [P] [US1] Unit tests for Executor node (mocking Robot Bridge) in tests/unit/executor.test.js
- [x] T015 [US1] Integration test for complete Plan-Analyze-Execute loop in tests/integration/execution_flow.test.js

### Implementation for User Story 1

- [x] T016 [US1] Implement Planner node using Custom Gemini Model in src/agents/nodes/planner.js
- [x] T017 [US1] Implement Analyzer node to map intents to Cheerio-extracted candidates in src/agents/nodes/analyzer.js
- [x] T018 [US1] Implement Executor node to trigger Robot Bridge for currentStep in src/agents/nodes/executor.js
- [x] T019 [US1] Implement CLI index to accept user prompt and run LangGraph in src/cli/index.js
- [x] T020 [US1] Add Step Tracking logic to move actions between remainingSteps, currentStep, and completedSteps in src/agents/graph.js

**Checkpoint**: User Story 1 functional - basic dynamic automation working.

---

## Phase 4: User Story 2 - User Confirmation & Sequence Recording (Priority: P2)

**Goal**: Verify outcomes and persist successful sequences as reusable tools.

**Independent Test**: Run a task, confirm "Yes" at prompt, and verify a JSON sequence file is created in memory/sequences/.

### Tests for User Story 2 (MANDATORY per TDD) ⚠️

- [x] T021 [P] [US2] Unit tests for Validator node (semantic check) in tests/unit/validator.test.js
- [x] T022 [P] [US2] Unit tests for Sequence Storage service in tests/unit/storage_service.test.js

### Implementation for User Story 2

- [x] T023 [US2] Implement Validator node for LLM-based intent verification in src/agents/nodes/validator.js
- [x] T024 [US2] Implement Clarifier node for interactive CLI approval of plans/elements in src/agents/nodes/clarifier.js
- [x] T025 [US2] Implement storage logic to save sequences with full metadata in src/services/storage_service.js
- [x] T026 [US2] Integrate confirmation prompts into the LangGraph flow in src/agents/graph.js

**Checkpoint**: User Story 2 functional - agent can learn and save tools.

---

## Phase 5: User Story 3 - Reusable Sequence Execution (Priority: P3)

**Goal**: Execute saved "tools" directly by name without re-planning.

**Independent Test**: Run "Run tool my-task". Agent should load the JSON and execute the exact steps immediately.

### Tests for User Story 3 (MANDATORY per TDD) ⚠️

- [x] T027 [P] [US3] Unit tests for tool loading logic in tests/unit/planner.test.js

### Implementation for User Story 3

- [x] T028 [US3] Update CLI to detect "Run tool" command pattern in src/cli/index.js
- [x] T029 [US3] Implement logic to bypass Planner/Analyzer when executing a saved tool in src/agents/nodes/planner.js
- [x] T030 [US3] Implement Sequential Tool Chaining to allow calling multiple tools in one prompt in src/agents/graph.js

**Checkpoint**: User Story 3 functional - library of tools can be built and executed.

---

## Phase 6: Autonomous Recovery & Safety (Replanning)

**Purpose**: Implement the Reviser loop and safety guardrails.

- [x] T031 [P] Unit tests for Reviser node (incremental replan) in tests/unit/reviser.test.js
- [x] T032 Implement Reviser node to update remainingSteps on failure in src/agents/nodes/reviser.js
- [x] T033 Implement Retry Limit (Max 5) and Manual Intervention transition in src/agents/graph.js
- [x] T034 Add randomized human-like delays (0.5s - 2.0s) between Robot actions in src/services/robot_bridge.js

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Observability, maintenance, and bilingual support.

- [x] T035 Implement rolling log retention policy (user-configurable) in src/services/storage_service.js
- [x] T036 Add CLI verbosity control (info, debug, quiet) in src/services/config_service.js
- [x] T037 Ensure all user-facing strings are in Korean (Bilingual support) in src/agents/nodes/
- [x] T038 Add data extraction robot and JSON storage in src/robots/core.resource and src/services/storage_service.js
- [x] T039 Final validation of quickstart.md against the implemented system.

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)**: Must finish first.
2. **Foundational (Phase 2)**: Must finish before any User Story.
3. **US1 (Phase 3)**: MVP - High priority.
4. **US2 (Phase 4)**: Depends on US1 success logic.
5. **US3 (Phase 5)**: Depends on US2 storage logic.
6. **Recovery (Phase 6)**: Enhances all stories with robustness.
7. **Polish (Phase 7)**: Final cleanup.

### Within Each User Story

- **Tests FIRST**: Write failing Jest test -> Observe failure -> Implement -> Pass.
- **Service → Agent Node → Graph Integration**: Layered implementation.

---

## Parallel Execution Examples

### Shared Infrastructure
```bash
# Terminal 1:
Task: "T005 Implement Configuration Service in src/services/config_service.js"
# Terminal 2:
Task: "T006 Implement Vault Service in src/services/vault_service.js"
```

### User Story 1
```bash
# Terminal 1:
Task: "T012 [P] [US1] Unit tests for Planner node in tests/unit/planner.test.js"
# Terminal 2:
Task: "T013 [P] [US1] Unit tests for Analyzer node in tests/unit/analyzer.test.js"
```

---

## Implementation Strategy

- **MVP First**: Complete Phase 1, 2, and 3 to have a working dynamic agent.
- **Incremental Delivery**: Add Phase 4 (Saving) and Phase 5 (Reusing) to transition from "Agent" to "Automation Platform".
- **Safety Last (but important)**: Add Phase 6 recovery only after the happy path is stable.
