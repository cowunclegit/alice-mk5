# Implementation Plan: Robot Automation Agent

**Branch**: `001-robot-automation-agent` | **Date**: 2026-02-18 | **Spec**: [specs/001-robot-automation-agent/spec.md]
**Input**: Feature specification from `/specs/001-robot-automation-agent/spec.md`

## Summary

This feature implements an autonomous agent using the **Plan & Execute** pattern with an integrated **Discovery & Analysis** phase. It uses LangGraph.js to orchestrate Robot Framework actions. The agent generates a high-level plan, analyzes the target web page's HTML (using `cheerio`) to identify the most stable and relevant selectors for each step, and executes them in a visible browser. It includes a robust self-evaluation and replanning loop.

## Technical Context

**Language/Version**: Node.js (Latest LTS), JavaScript (ESM)
**Primary Dependencies**: LangGraph.js, Robot Framework (Browser Library), LangChain, cheerio, js-yaml
**Storage**: Local File System (JSON for sequences/data, YAML for config)
**Testing**: Jest (TDD strictly enforced)
**Target Platform**: Node.js Runtime, Visible Browser (Chromium)
**Project Type**: Single project
**Performance Goals**: Agent begins first Robot action within 30 seconds of user prompt.
**Constraints**: 
- Strictly JavaScript (No TypeScript).
- Plan & Execute pattern with a dedicated **Analyzer** node.
- Real-time HTML analysis for dynamic selector discovery.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **JavaScript Only**: Implementation uses only plain JavaScript.
- [x] **TDD Enforced**: Plan is structured to write tests BEFORE implementation.
- [x] **LangGraph Orchestration**: Agents are implemented via LangGraph.js using Plan, Analyze & Execute.
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
│   ├── graph.js         # State machine (Plan, Analyze, Execute)
│   ├── nodes/           # Planner, Analyzer, Executor, Validator, Reviser
│   └── state.js         # State definition (incl. HTML & Candidates)
├── robots/              # Robot Framework (.robot, .resource) files
├── services/            # Analysis (Cheerio), Bridge, Config, Storage
├── memory/              # Persistence (data, sequences, logs)
├── cli/                 # User interaction
└── lib/                 # Shared utilities
config.yaml              # Centralized configuration
```

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | | |
