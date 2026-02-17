# Data Model: Robot Automation Agent

## Entities

### Agent State (Plan, Analyze & Execute)
The central state managed by LangGraph.js.
- `input`: (String) The user's original request.
- `plan`: (Array<RobotAction>) The full current sequence of intended actions.
- `currentStep`: (RobotAction | null) The single action currently being processed.
- `completedSteps`: (Array<StepResult>) Audit log of finished actions and their outcomes.
- `remainingSteps`: (Array<RobotAction>) Dynamic queue of pending actions.
- `currentHTML`: (String | null) The pruned HTML source of the active page.
- `candidates`: (Array<ElementCandidate>) List of elements extracted for the current intent.
- `context`: (Object) Dynamic shared memory for step-to-step data passing.
- `retryCount`: (Number) Counter for consecutive replan cycles (Limit: 5).
- `status`: (String) `planning`, `analyzing`, `clarifying`, `executing`, `validating`, `revising`, `intervention`, `finished`.

### Robot Action
- `intent`: (String) Semantic description of what this step achieves.
- `keyword`: (String) Robot Framework keyword.
- `selector`: (String | null) The resolved CSS/XPath selector.
- `args`: (Array) Arguments for the keyword.
- `description`: (String) Human-readable explanation.

### Step Result
- `action`: (RobotAction) The action that was executed.
- `status`: (String) `pass` or `fail`.
- `output`: (any) Return data or extracted information.
- `error`: (String | null) Technical error trace if status is `fail`.

### Element Candidate (Analysis)
- `tag`: (String) e.g., `button`.
- `attributes`: (Object) id, class, text, data-testid, etc.
- `selector`: (String) The generated CSS path for this candidate.
- `confidence`: (Number) LLM score for intent matching.

## Transitions (Integrated State Flow)

### 1. Planning Phase
- `input` -> **Planner** -> `plan` and `remainingSteps`.

### 2. Queue & Context Phase
- IF (`remainingSteps` not empty): Pop first -> `currentStep`.

### 3. Discovery Phase (Analysis)
- IF (`currentStep` needs selector): 
    - Fetch HTML -> `currentHTML`.
    - **Analyzer** (Cheerio) -> populate `candidates`.
    - LLM Score -> update `currentStep.selector`.
    - IF Confidence < Threshold -> **Clarifier** (User input) -> update `currentStep.selector`.

### 4. Execution Phase
- **Executor** runs `currentStep` via Robot Framework CLI -> `Step Result`.

### 5. Validation Phase
- **Validator** checks semantic success.
- IF Success: Push `Step Result` to `completedSteps` -> clear `currentStep` -> Loop to **Step 2**.
- IF Failure: Push `Step Result` to `completedSteps` (marked fail) -> increment `retryCount` -> **Reviser**.

### 6. Revision Phase
- **Reviser** analyzes `completedSteps` + `currentHTML` -> updates `remainingSteps` -> Loop to **Step 2**.
- IF `retryCount` >= 5: Transition to `intervention`.
