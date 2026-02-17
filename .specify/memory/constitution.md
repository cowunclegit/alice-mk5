<!--
# Sync Impact Report
- Version change: initial → 1.0.0
- List of modified principles:
  - [PRINCIPLE_1_NAME] → I. Node.js & JavaScript-Only Backend
  - [PRINCIPLE_2_NAME] → II. LangGraph.js for Intelligent Agents
  - [PRINCIPLE_3_NAME] → III. Test-Driven Development (NON-NEGOTIABLE)
  - [PRINCIPLE_4_NAME] → IV. Robot Framework for Automated Actions
  - [PRINCIPLE_5_NAME] → V. Modular Robot Composition
- Added sections: Technology Stack & Integration, Development Workflow
- Removed sections: None
- Templates requiring updates:
  - .specify/templates/plan-template.md (✅ updated)
  - .specify/templates/tasks-template.md (✅ updated)
  - .specify/templates/spec-template.md (✅ updated)
- Follow-up TODOs: None
-->

# Alice MK5 - Speckit Constitution

## Core Principles

### I. Node.js & JavaScript-Only Backend
The backend must be implemented using Node.js and standard JavaScript. TypeScript or other transpiled languages are not permitted to ensure simplicity and native runtime compatibility. All code must follow ESM (EcmaScript Modules) standards.

### II. LangGraph.js for Intelligent Agents
All agentic workflows and decision-making logic must be built using LangGraph.js. This ensures a stateful, cyclic graph-based approach to complex reasoning tasks, providing predictable and debuggable agent behavior.

### III. Test-Driven Development (NON-NEGOTIABLE)
TDD is mandatory for all features. Tests must be written and observed to fail before any implementation logic is added. The Red-Green-Refactor cycle must be strictly followed to ensure high code quality and functional alignment with requirements.

### IV. Robot Framework for Automated Actions
Generation of automation scripts and execution of system-level actions must utilize Robot Framework. This provides a clear, keyword-driven interface for automation that is easily readable and maintainable.

### V. Modular Robot Composition
Complex functionality should be broken down into atomic "Robots" (Robot Framework files). LangGraph.js agents are responsible for coordinating and combining these functional Robots to achieve higher-level objectives.

## Technology Stack & Integration

- **Runtime**: Node.js (Latest LTS)
- **Language**: JavaScript (ESM)
- **Agent Framework**: LangGraph.js
- **Automation**: Robot Framework
- **Testing**: Jest (preferred) for TDD workflows
- **Integration**: LangGraph.js nodes trigger Robot Framework tasks for side effects or automation.

## Development Workflow

1. **Specify**: Define User Stories and requirements in `spec.md`.
2. **Test First**: Write failing unit and integration tests in `tests/`.
3. **Implement**: Write minimal JavaScript to pass tests.
4. **Automate**: Create Robot Framework `.robot` files for automation tasks.
5. **Orchestrate**: Use LangGraph.js to define the flow between different Robots and agent logic.
6. **Refactor**: Optimize and verify all tests pass.

## Governance

- The Constitution is the supreme authority for development practices in this project.
- No TypeScript code is allowed in the repository.
- All functional changes MUST be accompanied by corresponding test updates (TDD).
- Use of LangGraph.js is mandatory for any logic involving LLM-based reasoning or complex state machines.
- All automation scripts MUST be defined using Robot Framework keywords.

**Version**: 1.0.0 | **Ratified**: 2026-02-18 | **Last Amended**: 2026-02-18
