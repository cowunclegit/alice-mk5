# Implementation Plan: Robot Framework Resource Management Sub-Agent

**Branch**: `005-manage-robot-resources` | **Date**: 2026-02-21 | **Spec**: [specs/005-manage-robot-resources/spec.md]
**Input**: Feature specification from `/specs/005-manage-robot-resources/spec.md`

## Summary

This feature replaces the "Tool Creation" and "Replay" logic with a more sustainable "Resource Management" approach. A new `ResourceAgent` will be added to handle the addition and modification of keywords within Robot Framework `.resource` files. The initial `router` node will be updated to detect resource management intents (e.g., "Add a keyword to Naver resource") and branch to this specialized agent. The system will support automated syntax validation (dry-run), backup/restore mechanisms, and synonym management via `manifests.json`.

## Technical Context

**Language/Version**: Node.js (Latest LTS), JavaScript (ESM)
**Primary Dependencies**: LangGraph.js, Robot Framework
**Storage**: Local file system (.resource, JSON)
**Testing**: Jest (TDD strictly enforced)
**Target Platform**: Node.js Runtime
**Project Type**: single (Agent extension)
**Performance Goals**: < 2s for routing and resource indexing.
**Constraints**: JavaScript only (No TypeScript), Robot Framework syntax compliance, `core.resource` protection.

## Constitution Check

- [x] **JavaScript Only**: Implementation will be 100% JavaScript (ESM).
- [x] **TDD Enforced**: Unit tests for routing and resource editing will be written first.
- [x] **LangGraph Orchestration**: `ResourceAgent` and updated `router` will be implemented as LangGraph nodes.
- [x] **Robot Framework**: All automation side effects and resource files use Robot Framework.
- [x] **Modular Robots**: Keywords are organized into modular `.resource` files.

## Project Structure

### Documentation (this feature)

```text
specs/005-manage-robot-resources/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── agents/
│   ├── manager/
│   │   ├── nodes/
│   │   │   ├── router.js           # Updated: Intent classification
│   │   │   └── resource_agent.js   # NEW: Resource modification logic
│   │   └── graph.js                # Updated: Branching to ResourceAgent
├── services/
│   └── resource_service.js         # NEW: Indexing, backup, dry-run validation
├── robots/
│   └── resources/
│       ├── manifests.json          # Updated: Synonym mapping
│       └── custom/                 # Target for automated edits
└── lib/
    └── robot_parser.js             # NEW: AST-like parsing for .resource files
```

**Structure Decision**: Single project (DEFAULT). The feature extends the existing agent and service layers.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
