# Service Contract: Robot Automation Agent

## Agent Orchestrator (LangGraph.js)

### `validator(state: AgentState): Promise<Partial<AgentState>>`
**Purpose**: Analyzes the latest `StepResult` and `completedSteps` against the `input` intent.
- **Logic**: Determines if the step was successful AND if the sequence is on track.
- **Output**: `next_node` (Executor, Reviser, or Finalize) and optional `reasoning`.

### `reviser(state: AgentState): Promise<Partial<AgentState>>`
**Purpose**: Generates a new `remainingSteps` sequence when a problem is detected.
- **Input**: `completedSteps` (history) and original `input`.
- **Output**: Updated `remainingSteps`, `plan`, and `retryCount`.

## Robot Bridge

### `executeRobot(keyword: String, args: Array): Promise<StepResult>`
**Purpose**: Spawns the CLI process. Returns structured pass/fail and extracted data.

## Configuration

### `config.yaml`
Central schema for `replan_limit` (Default: 5) and `automation_delay`.
