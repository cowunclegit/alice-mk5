# Implementation Plan: Simplified Reactive Agent Flow

**Branch**: `006-simplify-agent-flow` | **Date**: 2026-02-22 | **Spec**: [/specs/006-simplify-agent-flow/spec.md]
**Input**: Refactor agent architecture to a reactive "Plan & Execute" model with AXTree-based DOM analysis.

## Summary
Refactor the orchestrator and web agent to implement a reactive loop. The Manager Agent will handle high-level orchestration and re-planning, while the Web Agent will use a dynamic "Observe-Analyze-Act" loop powered by a simplified AXTree generated via Cheerio.

## Technical Context
- **Language**: Node.js (Latest LTS), JavaScript (ESM)
- **Framework**: LangGraph.js, Robot Framework
- **Primary Dependencies**: Cheerio, LangChain
- **Storage**: Local file system (JSON for state, .robot files for actions)
- **Testing**: Jest (Strict TDD)
- **Target Platform**: Node.js Runtime
- **Project Type**: single (Agent extension)
- **Performance Goals**: Mission recovery < 10s; AXTree generation < 1s.

## Constitution Check
- [x] **JavaScript Only**: 100% ESM JavaScript.
- [x] **TDD Enforced**: Unit tests for AXTree parsing and Manager routing will be written first.
- [x] **LangGraph Orchestration**: Core logic resides in LangGraph nodes.
- [x] **Robot Framework**: All browser/app interactions use Robot Framework keywords.
- [x] **Modular Robots**: Keywords organized in modular resource files.

## Project Structure

### Documentation (this feature)
```text
specs/006-simplify-agent-flow/
├── plan.md              # This file
├── research.md          # AXTree format and reactive logic
├── data-model.md        # MissionState, AXNode entities
├── quickstart.md        # Integration scenarios
├── contracts/           # Internal node interfaces
└── tasks.md             # Execution steps (Phase 2 output)
```

### Source Code
```text
src/
├── agents/
│   ├── manager/         # Decomposer, Executor, Replanner nodes
│   └── web/             # Capture, Analyzer (AXTree), Executor nodes
├── lib/
│   └── axtree_parser.js # NEW: Cheerio-based AXTree converter
└── services/
    └── result_collector.js # Capture RESULT_VALUE from stdout
```

## Phase 0: Outline & Research
- [x] Research AXTree format for Cheerio (Resolved in research.md)
- [x] Research reactive planning triggers (Resolved in research.md)

## Phase 1: Design & Contracts
- [x] Define MissionState and AXNode in data-model.md
- [x] Generate API contracts for internal agent communication
- [x] Update agent context

## Phase 2: Implementation Planning
- [ ] Break plan into actionable tasks in tasks.md
