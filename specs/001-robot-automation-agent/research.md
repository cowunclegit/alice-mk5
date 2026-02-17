# Research: Unified Plan & Execute with Replanning for Robot Agent

## Core Architectural Decisions

### Decision 1: Plan & Execute State Structure
**Decision**: The LangGraph.js state will be organized into four primary fields to track progress with high precision:
- `plan`: The full, original sequence of intended actions.
- `currentStep`: The single action currently being executed.
- `completedSteps`: A historical log of actions that have finished, including their results and extracted data.
- `remainingSteps`: A dynamic queue of actions yet to be performed.
**Rationale**: This structure allows the agent to maintain context across long-running tasks and provides a clear audit trail for the `reviser` node to analyze when things go wrong.

### Decision 2: Incremental Replanning Strategy
**Decision**: When a failure is detected, the agent will perform an **Incremental Replan** rather than starting from scratch.
**Logic**: The `reviser` node receives the `completedSteps` (what worked) and the current `remainingSteps` (what was planned next). It injects compensatory steps or modifies the queue to bypass the failure point.
**Rationale**: Efficiently preserves progress while allowing for dynamic adjustments to the execution path based on real-time browser state.

### Decision 3: Multi-Layered Replan Triggers
**Decision**: Replanning is triggered by three distinct events:
1.  **Technical (Robot Framework)**: A keyword fails technically (e.g., `TimeoutError`, `ElementNotInteractable`).
2.  **Semantic (LLM Self-Evaluation)**: A step passes technically, but the LLM determines the result (e.g., extracted text) doesn't fulfill the user's intent.
3.  **Human (User Feedback)**: The user rejects a proposed plan or a final outcome via the CLI.

### Decision 4: Safe Execution Guardrails
**Decision**: Strictly enforce a `retryCount` limit of 5 consecutive replans per user request.
**Logic**: Every entry into the `reviser` node increments the counter. Reaching the limit forces a transition to a `manual_intervention` state.
**Rationale**: Prevents "infinite reasoning loops" and excessive API consumption if the agent encounters an unsolvable layout or environmental issue.

## Integrated Flow Logic (The Graph)

1.  **Planner**: User Prompt -> Initial `plan` and `remainingSteps`.
2.  **Queue Manager**: Pop first from `remainingSteps` -> `currentStep`.
3.  **Executor**: Execute `currentStep` via Robot Framework CLI.
4.  **Validator (Self-Evaluator)**:
    -   If Step Pass AND Semantic Intent Match -> Move `currentStep` to `completedSteps` -> Loop to **Step 2**.
    -   If Step Fail OR Semantic Intent Mismatch -> Move `currentStep` to `completedSteps` (marked failed) -> Increment `retryCount` -> Loop to **Step 5**.
5.  **Reviser**:
    -   If `retryCount` < 5 -> Analyze `completedSteps` -> Update `remainingSteps` -> Loop to **Step 2**.
    -   If `retryCount` >= 5 -> Log reasoning -> Transition to **Manual Intervention**.
