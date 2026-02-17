# Implementation Plan: Robot Automation Agent

**Branch**: `001-robot-automation-agent` | **Date**: 2026-02-18 | **Spec**: [specs/001-robot-automation-agent/spec.md]
**Input**: Feature specification from `/specs/001-robot-automation-agent/spec.md`

## Summary

This feature implements an autonomous agent using the **Plan & Execute** pattern. It uses LangGraph.js to orchestrate Robot Framework actions. The agent first generates a high-level plan (sequence of robots), then executes them step-by-step. If a step fails technically or if the agent self-evaluates that the result doesn't match the intent, it triggers a **replanning** (revision) cycle to adjust the remaining steps.

## Technical Context

**Language/Version**: Node.js (Latest LTS), JavaScript (ESM)
**Primary Dependencies**: LangGraph.js, Robot Framework (Browser Library), LangChain, js-yaml
**Storage**: Local File System (JSON for sequences/data, YAML for config)
**Testing**: Jest (TDD strictly enforced)
**Target Platform**: Node.js Runtime, Visible Browser (Chromium)
**Project Type**: Single project
**Performance Goals**: Agent begins first Robot action within 30 seconds of user prompt.
**Constraints**: 
- Strictly JavaScript (No TypeScript).
- Plan & Execute pattern for LangGraph.js.
- Explicit step tracking in state (current, completed, remaining).
- Maximum 5 consecutive replan attempts.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **JavaScript Only**: Implementation uses only plain JavaScript.
- [x] **TDD Enforced**: Plan is structured to write tests BEFORE implementation.
- [x] **LangGraph Orchestration**: Agents are implemented via LangGraph.js using Plan & Execute.
- [x] **Robot Framework**: Automation is handled by Robot Framework scripts.
- [x] **Modular Robots**: Automation tasks are broken down into reusable robots and resources.

## Project Structure

### Documentation (this feature)

```text
specs/001-robot-automation-agent/
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
├── agents/              # LangGraph.js agent logic
│   ├── graph.js         # State machine (Plan & Execute)
│   ├── nodes/           # Node implementations (planner, executor, reviser)
│   └── state.js         # Unified state definition (with replan tracking)
├── robots/              # Robot Framework (.robot, .resource) files
├── memory/              # Persistence (data, sequences, logs)
├── services/            # Bridge, Config, Storage, Vault
├── cli/                 # User interaction
└── lib/                 # Shared utilities
config.yaml              # Centralized configuration
```

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | | |
