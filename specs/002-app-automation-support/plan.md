# Implementation Plan: Application Automation Support

**Branch**: `002-app-automation-support` | **Date**: 2026-02-19 | **Spec**: [specs/002-app-automation-support/spec.md]
**Input**: Feature specification from `/specs/002-app-automation-support/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Expand the current automation agent to support desktop applications using a dual sub-agent architecture. The system will utilize a Nested Sub-Graph pattern in LangGraph.js, where a central Manager orchestrates specialized Web and Application sub-graphs. Application automation will be powered by Robot Framework with AppiumLibrary, connecting to a pre-running Appium server. A Registry Tool will be implemented to automatically discover installed applications and their technical identifiers.

## Technical Context

**Language/Version**: Node.js (Latest LTS), JavaScript (ESM)
**Primary Dependencies**: LangGraph.js, Robot Framework, SeleniumLibrary, AppiumLibrary, Appium Server
**Storage**: JSON files for automation sequences (unified registry with platform sub-folders)
**Testing**: Jest (TDD strictly enforced)
**Target Platform**: Node.js Runtime, Windows/macOS Desktop
**Project Type**: Single project with logical sub-folder separation (`web`, `application`)
**Performance Goals**: First application action initiated within 45 seconds of user prompt.
**Constraints**: JavaScript only (No TypeScript), Robot Framework for automation, Appium server must be pre-running.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **JavaScript Only**: Implementation uses only plain JavaScript.
- [x] **TDD Enforced**: Plan is structured to write tests BEFORE implementation.
- [x] **LangGraph Orchestration**: Agents are implemented via LangGraph.js using Nested Sub-Graphs.
- [x] **Robot Framework**: Automation is handled by Robot Framework scripts (Selenium/Appium).
- [x] **Modular Robots**: Automation tasks are broken down into reusable robots and platform-specific resources.

## Project Structure

### Documentation (this feature)

```text
specs/002-app-automation-support/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── agents/
│   ├── manager/         # Manager Graph (Router/Decomposer)
│   ├── web/             # Web Sub-Graph
│   └── application/     # Application Sub-Graph
├── robots/
│   ├── resources/
│   │   ├── web/         # Selenium-based resources
│   │   └── application/ # Appium-based resources
│   └── tools/
│       ├── web/         # Saved web sequences
│       └── application/ # Saved app sequences
├── services/
│   ├── registry/        # Registry Tool (OS-level app discovery)
│   ├── browser/         # Browser management
│   └── appium/          # Appium connection/session service
├── lib/
└── cli/

tests/
├── integration/
│   ├── cross_platform/
│   ├── web/
│   └── application/
└── unit/
    ├── agents/
    ├── services/
    └── robots/
```

**Structure Decision**: Single project with logical separation into `web` and `application` sub-folders within `src/agents`, `src/robots/resources`, and `src/robots/tools` to support the modular sub-agent architecture.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | | |
