# Tasks: Application Automation Support

## Implementation Strategy

We will implement the dual sub-agent architecture using a modular approach. The primary goal is to enable desktop application automation (User Story 1) while refactoring the existing web logic into a modular sub-graph (User Story 2). Finally, we will enable persistence for application sequences (User Story 3).

**MVP Scope**: Successful routing and execution of a desktop application task (e.g., Calculator) using the new Application Sub-Agent.

## Phase 1: Setup

- [X] T001 Create platform-specific directory structure in `src/agents/`, `src/robots/resources/`, and `src/robots/tools/`
- [X] T002 [P] Install `robotframework-appiumlibrary` in the Python environment
- [X] T003 [P] Add Appium server configuration (URL, default capabilities) to `config.yaml`

## Phase 2: Foundational

- [X] T004 Implement the **Registry Tool** service for OS-level app discovery in `src/services/registry/`
- [X] T005 [P] Create the base **Appium Connection Service** in `src/services/appium/`
- [X] T006 Define the shared **Manager State** schema in `src/agents/manager/state.js` to support data passing between sub-graphs
- [X] T007 Implement the **Router/Decomposer** logic in the Manager Graph in `src/agents/manager/router.js`

## Phase 3: User Story 1 - Create Automation Tool for Mobile Application (Priority: P1)

**Goal**: Execute desktop app tasks from natural language.
**Test**: "Open the Calculator app and add 5 and 7" results in successful calculation via Appium.

- [X] T008 [US1] Create the **Application Sub-Graph** definition in `src/agents/application/graph.js`
- [X] T009 [P] [US1] Implement **App Analyzer** node for XML Page Source analysis in `src/agents/application/nodes/analyzer.js`
- [X] T010 [US1] Implement **App Executor** node using AppiumLibrary keywords in `src/agents/application/nodes/executor.js`
- [X] T011 [P] [US1] Create core Appium Robot resources in `src/robots/resources/application/core.resource`
- [X] T012 [US1] Implement **App Validator** node for UI state verification in `src/agents/application/nodes/validator.js`
- [X] T013 [US1] Integrate Application Sub-Graph into the Manager Graph

## Phase 4: User Story 2 - Unified Orchestration with Platform-Specific Sub-Agents (Priority: P2)

**Goal**: Modularize web and app logic.
**Test**: Web automation files are exclusively in `web/` folders and app files in `application/` folders.

- [X] T014 [US2] Refactor existing web agent nodes into the **Web Sub-Graph** in `src/agents/web/`
- [X] T015 [P] [US2] Migrate web Robot resources to `src/robots/resources/web/`
- [X] T016 [US2] Update **Manager Graph** to orchestrate Web vs Application sub-graphs based on Router output
- [X] T017 [US2] Implement cross-platform data passing logic in the Manager Graph

## Phase 5: User Story 3 - Reuse Application Automation Sequences (Priority: P3)

**Goal**: Save and run application "tools".
**Test**: Invoke a saved "calculator-add" tool and verify execution.

- [X] T018 [US3] Update **Storage Service** to handle platform-specific sub-folders in `src/services/storage_service.js`
- [X] T019 [P] [US3] Implement application sequence recording in the Application Sub-Agent
- [X] T020 [US3] Add support for "Run Tool" keyword targeting the `application/` tools directory

## Phase 6: Polish

- [X] T021 [P] Implement detailed logging for cross-platform task transitions
- [X] T022 Conduct end-to-end integration tests for a "Web to App" composite task (e.g., search web and save to notepad)

## Dependencies

1. Foundational tasks (Phase 2) must be complete before any Sub-Graph implementation.
2. User Story 1 (Phase 3) provides the core Appium logic needed for User Story 3.
3. User Story 2 (Phase 4) refactors the architecture but is logically independent from US1 features.

## Parallel Execution Examples

- **Setup & Registry**: T002, T003 can run while T001 is being prepared.
- **Sub-Agent Nodes**: T009 (App Analyzer) and T011 (App Resources) can be developed in parallel once foundational services are ready.
- **Refactoring**: T015 (Resource migration) can happen while T014 (Node refactoring) is in progress.
