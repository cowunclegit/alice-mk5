# Tasks: Web Resource Management Agent

**Input**: Design documents from `/specs/007-manage-web-resources/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/service.md

**Tests**: TDD approach strictly enforced per Project Constitution. Write failing Jest tests before implementing logic.

## Phase 1: Setup

**Purpose**: Project initialization and environment configuration

- [X] T001 Initialize project structure: src/agents/resource_manager, src/services, src/robots/resources/web
- [X] T002 [P] Configure dependencies: Verify Cheerio, LangGraph.js, and Robot Framework availability
- [X] T003 [P] Setup Jest configuration for ESM and TDD support in jest.config.js
- [X] T003.1 Verify and document OS-level authorization enforcement in the CLI entry point src/cli/index.js

---

## Phase 2: Foundational

**Purpose**: Core services for manifest management and code generation

- [X] T004 [P] Unit tests for ManifestService in tests/unit/manifest_service.test.js
- [X] T005 Implement ManifestService with sync() and addMapping() in src/services/manifest_service.js
- [X] T006 [P] Unit tests for GeneratorService in tests/unit/generator_service.test.js
- [X] T007 Implement GeneratorService with keyword generation and file updating logic in src/services/generator_service.js
- [X] T008 [P] Extend AnalysisService to support semantic selector prioritization in src/services/analysis_service.js

---

## Phase 3: User Story 1 - Create New Resource Keyword

**Goal**: Automatically generate and verify new Robot keywords via live browser analysis.
**Independent Test**: Request "Create search keyword for google.com" and verify google.resource is created with working code.

- [X] T009 [P] [US1] Unit tests for ResourceManagerAgent nodes in tests/unit/resource_manager_nodes.test.js
- [X] T010 [US1] Implement 'Plan & Compose' node in src/agents/resource_manager/nodes/planner.js, ensuring LLM prompts enforce context-aware argument naming per FR-010.
- [X] T011 [US1] Implement 'Verification Loop' node to execute Robot code in src/agents/resource_manager/nodes/verifier.js
- [X] T012 [US1] Implement self-healing logic (max 2 retries) within the verifier node
- [X] T013 [US1] Implement 'Persistence' node to save verified keywords using GeneratorService in src/agents/resource_manager/nodes/saver.js
- [X] T014 [US1] Define and compile the ResourceManagerAgent graph in src/agents/resource_manager/graph.js
- [X] T015 [US1] Integration test for complete creation loop in tests/integration/resource_management.test.js

---

## Phase 4: User Story 2 - Maintain Resource Manifest

**Goal**: Keep manifests.json synchronized with the physical resource files.
**Independent Test**: Manually delete a file and verify manifests.json updates on next agent startup.

- [X] T016 [P] [US2] Unit tests for Active Reconciliation logic in tests/unit/manifest_service.test.js
- [X] T017 [US2] Implement directory scanning and pruning in ManifestService.sync()
- [X] T018 [US2] Implement LLM-based alias generation logic in src/agents/resource_manager/nodes/analyzer.js
- [X] T019 [US2] Integrate manifest updates into the ResourceManagerAgent graph flow

---

## Phase 5: User Story 3 - Update/Fix Existing Resource

**Goal**: Repair broken keywords and handle naming conflicts via CLI prompts.
**Independent Test**: Ask to fix a keyword with a broken selector and verify the file is updated.

- [X] T020 [P] [US3] Unit tests for keyword repair logic in tests/unit/generator_service.test.js
- [X] T021 [US3] Implement keyword replacement logic in GeneratorService.updateResourceFile()
- [X] T021.1 [US3] Implement keyword deletion logic in GeneratorService.removeKeyword() in src/services/generator_service.js
- [X] T021.2 [US3] Add 'Delete Keyword' path to ResourceManagerAgent graph in src/agents/resource_manager/graph.js
- [X] T022 [US3] Implement CLI prompt logic for keyword naming conflicts (Overwrite/Rename/Skip) in src/agents/resource_manager/nodes/conflicter.js
- [X] T023 [US3] Add 'Unique Alias' enforcement and merge proposal logic in src/agents/resource_manager/nodes/validator.js

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Observability, performance, and documentation.

- [X] T024 Implement detailed logging for verification attempts and manifest changes in src/services/logger.js
- [X] T025 Final validation of quickstart.md and README.md against the implemented system
- [X] T026 Perform a project consistency check using speckit.analyze

---

## Dependencies

- [Phase 1] -> [Phase 2]
- [Phase 2] -> [Phase 3] & [Phase 4]
- [Phase 3] -> [Phase 5]
- [Phase 4] -> [Phase 5]

## Parallel Execution Examples

- [P] T004 (Manifest Tests) and T006 (Generator Tests) can run simultaneously.
- [P] T009 (Agent Tests) can start as soon as Phase 2 services are defined.

## Implementation Strategy

- **MVP First**: Complete Phase 1, 2, and 3 to enable basic keyword creation and verification.
- **Incremental Delivery**: Add Phase 4 for manifest integrity and Phase 5 for maintenance and conflict resolution.
- **Resilience**: Prioritize the self-healing logic in Phase 3 to handle real-world web variability.
