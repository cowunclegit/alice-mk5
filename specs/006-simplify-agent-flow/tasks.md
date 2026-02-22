# Tasks: Simplified Reactive Agent Flow

## Summary
Refactor the agent architecture to a reactive "Plan & Execute" model. The Manager Agent will handle high-level orchestration and re-planning, while the Web Agent will implement a dynamic "Observe-Analyze-Act" loop using a simplified Accessibility Tree (AXTree) generated via Cheerio for resilient web element targeting.

## Phase 1: Setup
- [x] T001 Initialize project structure for simplified flow in specs/006-simplify-agent-flow/
- [x] T002 [P] Install and verify 'cheerio' dependency in package.json

## Phase 2: Foundational Components
- [x] T003 [P] Implement AXTreeParser utility using Cheerio in src/lib/axtree_parser.js
- [x] T004 [P] Create unit tests for AXTreeParser in tests/unit/axtree_parser.test.js
- [x] T005 [P] Implement dataStore compaction utilities in src/lib/data_utils.js

## Phase 3: User Story 1 - Unified Manager Orchestration
**Goal**: Implement the core routing and sequential execution logic in the Manager Agent.
**Test Criteria**: Manager correctly identifies LLM-direct vs Tool-based paths.

- [x] T006 [US1] Implement Decomposer node for intent analysis and planning in src/agents/manager/nodes/decomposer.js
- [x] T007 [US1] Implement Sequential Executor node for task dispatching in src/agents/manager/nodes/executor.js
- [x] T008 [US1] Implement Mission Summarizer node for final reporting in src/agents/manager/nodes/summarizer.js
- [x] T009 [US1] Update Manager State definition to support mission tracking in src/agents/manager/state.js
- [x] T010 [US1] Define and compile the new Manager Graph structure in src/agents/manager/graph.js
- [x] T011 [US1] Create unit tests for Manager Orchestration routing in tests/unit/manager_orchestration.test.js

## Phase 4: User Story 2 - Reactive Web Navigation Loop
**Goal**: Implement the iterative "Observe-Analyze-Act" loop in the Web Agent using AXTree.
**Test Criteria**: Agent captures DOM and updates targeting after every interaction.

- [x] T012 [US2] Implement CaptureDom node for real-time page snapshots in src/agents/web/nodes/capture_dom.js
- [x] T013 [US2] Implement AXTree Analyzer node for dynamic element selection in src/agents/web/nodes/analyzer.js
- [x] T014 [US2] Implement Reactive Web Executor node for Robot action dispatch in src/agents/web/nodes/executor.js
- [x] T015 [US2] Implement Web State Validator node for outcome verification in src/agents/web/nodes/validator.js
- [x] T016 [US2] Update Web Agent State to include AXTree and result metadata in src/agents/web/state.js
- [x] T017 [US2] Define and compile the Reactive Web Graph with observation loops in src/agents/web/graph.js
- [x] T018 [US2] Create unit tests for Web Reactive Loop transitions in tests/unit/web_reactive_loop.test.js

## Phase 5: User Story 3 - Autonomous Recovery via Replanning
**Goal**: Enable the system to automatically adjust its strategy upon failure.
**Test Criteria**: Failure triggers a replan cycle that reaches the target goal.

- [x] T019 [US3] Add replanning logic to the Decomposer/Replanner node in src/agents/manager/nodes/decomposer.js
- [x] T020 [US3] Update Manager Graph with conditional replan cycle edges in src/agents/manager/graph.js
- [x] T021 [US3] Create unit tests for failover recovery and replan limits in tests/unit/replanning_logic.test.js

## Phase 6: Final Polish
- [x] T022 [P] Implement end-to-end integration tests for the simplified flow in tests/integration/simplified_flow.test.js
- [x] T023 Update README.md and feature documentation with the simplified flow guide

## Dependencies
- [Phase 1] -> [Phase 2]
- [Phase 2] -> [Phase 3] & [Phase 4]
- [Phase 3] & [Phase 4] -> [Phase 5]
- [Phase 5] -> [Phase 6]

## Parallel Execution Examples
- [P] T003 (AXTreeParser) and T005 (DataUtils) can be implemented simultaneously.
- [P] T011 (Manager Tests) and T018 (Web Loop Tests) can run in parallel if the foundational nodes are ready.

## Implementation Strategy
1. **Foundation First**: Build the `AXTreeParser` as it's the core "eye" of the new reactive flow.
2. **Manager Backbone**: Establish the new "Plan & Execute" skeleton in the Manager Agent.
3. **Reactive Loop**: Implement the Web Agent's loop, ensuring it can successfully navigate and extract data using AXTree.
4. **Resilience**: Add the replanning logic to handle real-world failures.
5. **Verification**: Confirm everything works together with full-scale integration tests.
