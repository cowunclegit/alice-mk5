# Implementation Plan: Web Resource Management Agent

**Branch**: `007-manage-web-resources` | **Date**: 2026-02-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-manage-web-resources/spec.md`

## Summary

The Web Resource Management Agent is a specialized sub-agent built with LangGraph.js that autonomously creates, updates, and verifies Robot Framework keywords. It operates in a "Plan & Compose" loop: analyzing a target website via AXTree, generating a candidate sequence of robot actions, verifying them in a live browser, and finally persisting the verified code to domain-specific `.resource` files and updating a central `manifests.json` registry.

## Technical Context

**Language/Version**: Node.js (Latest LTS), JavaScript (ESM)
**Primary Dependencies**: LangGraph.js, Robot Framework (SeleniumLibrary), Cheerio (for DOM analysis), fs/promises
**Storage**: Local File System (JSON for manifest, `.resource` for keywords)
**Testing**: Jest (TDD strictly enforced)
**Target Platform**: Node.js Runtime
**Project Type**: Single Node.js project
**Performance Goals**: < 10s for AXTree analysis, < 30s for verification loop execution
**Constraints**: JavaScript only (No TypeScript), Robot Framework for automation, CLI-only authorization

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **JavaScript Only**: Implementation uses only plain JavaScript (ESM).
- [x] **TDD Enforced**: Plan includes writing Jest tests before any logic.
- [x] **LangGraph Orchestration**: The management agent is implemented as a LangGraph.js graph.
- [x] **Robot Framework**: Automation and side effects are handled via Robot Framework.
- [x] **Modular Robots**: Keywords are organized into domain-specific, reusable resource files.

## Project Structure

### Documentation (this feature)

```text
specs/007-manage-web-resources/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── agents/
│   └── resource_manager/ # LangGraph nodes and state
├── robots/
│   └── resources/
│       └── web/          # .resource files generated/updated here
├── services/
│   ├── manifest_service.js # Registry management
│   ├── generator_service.js # Robot code generation
│   └── analysis_service.js  # DOM/AXTree to Selector logic
└── lib/
    └── variable_resolver.js # Reuse existing resolver

tests/
├── integration/
│   └── resource_management.test.js
└── unit/
    ├── manifest_service.test.js
    ├── generator_service.test.js
    └── analysis_service.test.js
```

**Structure Decision**: Single project structure follows the established pattern in `alice-mk5`, organizing by `agents`, `robots`, and `services`.

## Complexity Tracking

*No Constitution Check violations.*
