# Data Model: Robot Automation Agent

## Entities

### Agent State (Plan & Execute + Replan)
The central state managed by LangGraph.js.
- `input`: (String) The user's original request.
- `plan`: (Array<RobotAction>) The full current sequence of actions.
- `currentStep`: (RobotAction | null) The single action currently being processed.
- `completedSteps`: (Array<StepResult>) Audit log of finished actions and their outcomes.
- `remainingSteps`: (Array<RobotAction>) Dynamic queue of pending actions.
- `context`: (Object) Dynamic shared memory for step-to-step data passing.
- `retryCount`: (Number) Counter for consecutive replan cycles (Limit: 5).
- `reasoning`: (String) Internal explanation for the current plan or latest revision.
- `status`: (String) `planning`, `executing`, `validating`, `revising`, `intervention`, `finished`.

### Robot Action
- `keyword`: (String) Robot Framework keyword.
- `args`: (Array) Arguments for the keyword.
- `description`: (String) Human-readable explanation of this step.

### Step Result
- `action`: (RobotAction) The action that was executed.
- `status`: (String) `pass` or `fail`.
- `output`: (any) Return data or extracted information.
- `error`: (String | null) Technical error trace if status is `fail`.

## Transitions (Unified State Flow)

### 1. Planning Phase
- **Trigger**: User Prompt received.
- **Action**: `Planner` node generates initial `plan` and populates `remainingSteps`.
- **State Update**: `status` set to `planning`.

### 2. Execution Loop (Step Initialization)
- **Trigger**: `remainingSteps` is not empty.
- **Action**: Pop the first item from `remainingSteps` and set as `currentStep`.
- **State Update**: `status` set to `executing`.

### 3. Robot Execution
- **Trigger**: `currentStep` is assigned.
- **Action**: Call Robot Bridge via CLI to execute the `keyword` and `args`.
- **Outcome**: Capture `Step Result` (Pass/Fail + Output).

### 4. Validation Phase (Self-Evaluation)
- **Trigger**: `Step Result` received.
- **Action**: `Validator` node analyzes result against `input` intent.
- **Logic**:
    - **IF (Success AND Intent Match)**: Push `Step Result` to `completedSteps`, clear `currentStep`. Loop to **Step 2**.
    - **IF (Fail OR Intent Mismatch)**: Push `Step Result` to `completedSteps`, increment `retryCount`. Loop to **Step 5**.

### 5. Replanning Phase (Revision)
- **Trigger**: `retryCount` incremented.
- **Action**: 
    - **IF (retryCount < 5)**: `Reviser` node analyzes `completedSteps` and updates `remainingSteps`. Loop to **Step 2**.
    - **IF (retryCount >= 5)**: Transition to **Step 6**.
- **State Update**: `status` set to `revising`.

### 6. Termination Phase
- **Trigger**: `remainingSteps` empty (Success) OR `retryCount` exceeded (Fail).
- **Action**:
    - If Success: `Finalizer` node requests user verification and saves tool.
    - If Failure: Transition to `intervention` status and request manual help.
- **State Update**: `status` set to `finished` or `intervention`.
