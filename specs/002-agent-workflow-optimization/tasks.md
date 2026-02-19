# Tasks: Agent Workflow Optimization

**Input**: Design documents from `/specs/002-agent-workflow-optimization/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/orchestrator.md

**Tests**: TDD approach strictly enforced per Project Constitution. Write failing Jest tests before implementing logic.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization for AX and Snapshot services

- [x] T001 Create project structure for optimization: src/agents/nodes/, src/robots/resources/, src/lib/
- [x] T002 [P] Update package.json with Playwright and LangGraph dependencies
- [x] T003 [P] Configure src/memory/snapshots/ directory for debug persistence
- [x] T004 [P] Update src/agents/state.js with new AXTree and History fields per data-model.md

---

## Phase 2: Foundational (AX Extraction Logic)

**Purpose**: Core accessibility tree capture mechanism

- [x] T005 Create AX extraction keyword in src/robots/resources/ax.resource using page.accessibility.snapshot()
- [x] T006 [P] Implement AXTree parser utility in src/lib/ax_utils.js to generate refs (e1, e2...)
- [x] T007 [P] Implement AXTree serializer in src/lib/ax_utils.js for indented text format
- [x] T008 [P] Implement ref-to-selector mapping logic in src/lib/ax_utils.js

---

## Phase 3: User Story 1 - Structured Page Analysis (Priority: P1) 🎯 MVP

**Goal**: Extract and serialize AXTREE for AI reasoning.

**Independent Test**: Call Capture AXTREE keyword and verify the output is a clean, indented text tree with sequential refs.

### Tests for User Story 1 (MANDATORY per TDD) ⚠️

- [x] T009 [P] [US1] Unit tests for AXTree parsing and ref generation in tests/unit/ax_utils.test.js
- [x] T010 [P] [US1] Unit tests for AXTree serialization in tests/unit/ax_utils.test.js

### Implementation for User Story 1

- [x] T011 [US1] Implement Analyze node in src/agents/nodes/analyze.js to call AX keyword and update state
- [x] T012 [US1] Integrate Analyze node into LangGraph base structure in src/agents/graph.js
- [x] T013 [US1] Verify AXTREE capture reduces DOM noise in terminal output during debug runs

**Checkpoint**: User Story 1 functional - agent can "see" the page via AXTREE.

---

## Phase 4: User Story 2 - Context-Aware Role Snapshots (Priority: P2)

**Goal**: Format agent state into a cohesive prompt component.

**Independent Test**: Verify Role Snapshot string contains current goal, recent history, and current AXTREE.

### Tests for User Story 2 (MANDATORY per TDD) ⚠️

- [x] T014 [P] [US2] Unit tests for rolling history window logic in tests/unit/snapshot_service.test.js
- [x] T015 [P] [US2] Unit tests for Snapshot formatting in tests/unit/snapshot_service.test.js

### Implementation for User Story 2

- [x] T016 [US2] Implement History management service in src/services/history_service.js (limitTurns)
- [x] T017 [US2] Implement Snapshot node in src/agents/nodes/snapshot.js to generate the prompt string
- [x] T018 [US2] Update src/agents/nodes/planner.js to utilize the Role Snapshot instead of raw DOM

**Checkpoint**: User Story 2 functional - AI receives optimized context.

---

## Phase 5: User Story 3 - Optimized Agent Workflow (Priority: P3)

**Goal**: Full cyclic orchestration loop (Analyze -> Plan -> Execute -> Validate).

**Independent Test**: Run a multi-step task and verify the agent re-analyzes the page after every action.

### Tests for User Story 3 (MANDATORY per TDD) ⚠️

- [x] T019 [P] [US3] Unit tests for Validate node (semantic check) in tests/unit/validate.test.js
- [x] T020 [P] [US3] Integration test for Analyze-Plan-Execute-Validate cycle in tests/integration/optimized_flow.test.js

### Implementation for User Story 3

- [x] T021 [US3] Implement Validate node in src/agents/nodes/validate.js using LLM semantic comparison
- [x] T022 [US3] Update src/agents/graph.js with cyclic routing (Validate -> Success/Fail/Retry)
- [x] T023 [US3] Implement ref-to-selector resolution in src/agents/nodes/executor.js
- [x] T024 [US3] Updatesrc/agents/nodes/planner.js to output ref-based actions instead of selectors

**Checkpoint**: User Story 3 functional - robust autonomous agent loop complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Observability and Performance

- [x] T025 [P] Implement snapshot persistence for debugging in src/services/storage_service.js
- [x] T026 Optimize AXTREE pruning logic to handle extremely large documents
- [x] T027 Add detailed execution traces for the optimized workflow phases in src/services/logger.js
- [x] T028 Final validation of measurable outcomes (SC-001 to SC-004)

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)**: Must finish first.
2. **Foundational (Phase 2)**: Prerequisite for US1.
3. **US1 (Phase 3)**: Prerequisite for US2 and US3.
4. **US2 (Phase 4)**: Prerequisite for US3 planning.
5. **US3 (Phase 5)**: Final orchestration loop.
6. **Polish (Phase 6)**: Final optimization.

### Within Each User Story

- **Tests FIRST**: Failing Jest tests before implementation.
- **Lib/Service → Node → Graph Integration**: Implementation from bottom to top.

---

## Parallel Execution Examples

### AXTREE Logic
```bash
# Terminal 1:
Task: "T006 Implement AXTree parser utility in src/lib/ax_utils.js"
# Terminal 2:
Task: "T007 Implement AXTree serializer in src/lib/ax_utils.js"
```

### Prompt Optimization
```bash
# Terminal 1:
Task: "T014 [P] [US2] Unit tests for rolling history window logic in tests/unit/snapshot_service.test.js"
# Terminal 2:
Task: "T015 [P] [US2] Unit tests for Snapshot formatting in tests/unit/snapshot_service.test.js"
```

---

## Implementation Strategy

- **MVP First**: Complete Phase 1, 2, and 3 to verify that the agent can read the UI via AXTREE.
- **Incremental Context**: Add Phase 4 to improve the AI's understanding of its own role and history.
- **Full Robustness**: Complete Phase 5 to enable the closed-loop validation cycle.
