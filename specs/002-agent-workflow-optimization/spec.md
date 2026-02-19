# Feature Specification: Agent Workflow Optimization

**Feature Branch**: `002-agent-workflow-optimization`  
**Created**: 2026-02-18  
**Status**: Draft  
**Input**: User description: "analyze의 ANALYZE.md, AXTREE.md, ROLESNAPSHOT.md, AGENTWORKFLOW.md를 참고하여 Robot Framework에서도 이러한 AXTREE를 구성하고 AI가 잘 알아듣게 ROLE Snapshot을 만들고 AGENTWORKFLOW.md를참고하여 지금 workflow를 개선할 수 있는지 고려해줘"

## Clarifications

### Session 2026-02-18
- Q: How should the "Validate" phase determine if an execution step was successful? → A: Semantic Verification: Agent re-captures AXTREE after the action and asks the LLM to verify if the goal was met.
- Q: What level of execution history should be included in each ROLE Snapshot? → A: Rolling Window: Include only the most recent N turns (e.g., last 3-5), following the OpenClaw implementation pattern (turn-based capping + tool result integrity maintenance).
- Q: What should be the default scope when generating the AXTREE? → A: Full Document: Capture every interactable element from top to bottom of the page to ensure complete state visibility.
- Q: What format should be used for the AXTREE output? → A: Simplified Text Tree: A clean, indented Markdown-like list focused on token efficiency, using roles, labels, and references (e.g., - button "Submit" [ref=e3]).
- Q: How should the system unique-ify elements in the AXTREE for reliable selection? → A: Sequential Refs: Assign stable, human-readable indices (e.g., ref=e1, ref=e2) to every interactable node in the tree to decouple reasoning from DOM complexity.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Structured Page Analysis (Priority: P1)

As a developer, I want the agent to generate an AXTREE (Accessibility Tree) of the current web page so that the AI can have a concise and meaningful representation of interactable elements without DOM noise.

**Why this priority**: AXTREE is the foundation for improved AI reasoning. Without a clean state representation, the agent's decisions remain brittle.

**Independent Test**: Execute a "Capture AXTREE" command on a complex page (e.g., Naver). The output should be a hierarchical JSON/text representation containing roles, names, and states of interactable elements only.

**Acceptance Scenarios**:

1. **Given** a browser is open on a page, **When** the agent requests an AXTREE, **Then** it should receive a tree structure where every node has a `role`, `name`, and `selector`.
2. **Given** a page with nested components, **When** AXTREE is generated, **Then** it should preserve the logical parent-child relationships relevant to user interaction.

---

### User Story 2 - Context-Aware Role Snapshots (Priority: P2)

As an agent, I want to create a ROLE Snapshot that combines the current goal, the AXTREE, and the execution history into a single cohesive prompt component so that I can make more accurate decisions.

**Why this priority**: Enhances the AI's "situational awareness," reducing hallucinations and incorrect selector choices.

**Independent Test**: Compare agent performance on a multi-step task with and without ROLE Snapshots. The "with" version should show higher success rates in selector mapping.

**Acceptance Scenarios**:

1. **Given** an ongoing task, **When** the agent enters the reasoning phase, **Then** it should generate a "Snapshot" containing its current role, perceived state (AXTREE), and progress toward the goal.

---

### User Story 3 - Optimized Agent Workflow (Priority: P3)

As a user, I want the agent to follow a refined workflow (inspired by AGENTWORKFLOW.md) that includes explicit discovery, planning, and validation steps so that complex tasks are handled more reliably.

**Why this priority**: Improves overall system robustness and provides better feedback loops during execution.

**Independent Test**: Verify that the agent transitions correctly through "Analyze -> Plan -> Execute -> Validate" states as defined in the optimized workflow.

**Acceptance Scenarios**:

1. **Given** a high-level request, **When** the agent starts, **Then** it should first analyze the state (AXTREE), then propose a plan, then execute steps, and finally validate the outcome.

### Edge Cases

- **Dynamic DOM Changes**: What happens if the page changes between AXTREE capture and action execution? (Agent should re-analyze the state if an action fails).
- **Shadow DOM**: How does the agent handle elements hidden within Shadow DOMs? (AXTREE generation MUST attempt to traverse shadow roots where accessible).
- **Infinite Scroll / Lazy Loading**: How is the AXTREE updated when more content is loaded? (The workflow MUST include a mechanism to refresh the analysis state).
- **Overlapping Elements**: What if multiple elements map to the same accessibility name? (The AXTREE MUST include unique identifiers or positional metadata to disambiguate).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST be implemented using **Node.js and JavaScript (ESM)** only.
- **FR-002**: Agents MUST utilize **LangGraph.js** for stateful orchestration.
- **FR-003**: Automation and side effects MUST be implemented via **Robot Framework**.
- **FR-004**: Implementation MUST follow **TDD** (Tests written and failing before code).
- **FR-005**: System MUST implement a Robot Framework keyword to extract an AXTREE from the active browser page, covering the full document from top to bottom.
- **FR-006**: The AXTREE MUST filter out non-interactable elements and purely decorative DOM nodes.
- **FR-007**: System MUST implement a "ROLE Snapshot" generator that formats the agent's state into an AI-optimized prompt structure.
- **FR-008**: System MUST update the LangGraph workflow to include an explicit "Analyze" state that precedes planning.
- **FR-009**: System MUST support iterative refinement of the AXTREE if the initial capture is insufficient for the current goal.
- **FR-010**: The "Validate" state MUST perform semantic verification by re-capturing the AXTREE post-action and utilizing the LLM to confirm the user intent was successfully fulfilled.
- **FR-011**: System MUST implement a rolling window strategy for history turns in the ROLE Snapshot, ensuring that matching tool use and result pairs are preserved when truncating history.
- **FR-012**: The AXTREE output MUST use a token-efficient, indented text format that represents roles, labels, and unique references for every interactable node.
- **FR-013**: System MUST assign stable sequential references (e.g., ref=e1) to every node in the AXTREE, maintaining a mapping between these references and the underlying Robot Framework selectors.

### Key Entities

- **AXTREE**: A hierarchical representation of the UI focused on accessibility roles and interactions.
- **ROLE Snapshot**: A point-in-time summary of the agent's persona, perceived state, and objective.
- **Workflow State**: The current phase of the agent (Analyzing, Planning, Executing, Validating).

## Assumptions

- **Browser Compatibility**: AXTREE generation assumes the use of a modern browser (Chromium) with Playwright/Robot Framework support for accessibility APIs.
- **Internal Patterns**: It is assumed that ANALYZE.md, AXTREE.md, ROLESNAPSHOT.md, and AGENTWORKFLOW.md represent established patterns the agent should adapt to the Node.js/LangGraph.js environment.
- **Performance**: High-frequency state snapshots are assumed to be manageable within the latency targets specified in Success Criteria.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: AXTREE generation completes in under 2 seconds for a standard web page.
- **SC-002**: AXTREE reduces the raw DOM size (in tokens) by at least 80% while retaining all interactable elements.
- **SC-003**: The agent correctly identifies the target element in 95% of cases when provided with an AXTREE.
- **SC-004**: Execution logs clearly show the transition between Analyze, Plan, and Execute states.
