# Service Contract: Robot Automation Agent

## Agent Orchestrator (LangGraph.js)

### `planner(state: AgentState): Promise<Partial<AgentState>>`
**Purpose**: Generates high-level `plan` and initial `remainingSteps`.

### `analyzer(state: AgentState): Promise<Partial<AgentState>>`
**Purpose**: Uses Cheerio to discover elements and update `currentStep.selector`.

### `executor(state: AgentState): Promise<Partial<AgentState>>`
**Purpose**: Triggers Robot Framework for the `currentStep`.

### `validator(state: AgentState): Promise<Partial<AgentState>>`
**Purpose**: Finalizes results and moves `currentStep` to `completedSteps`.

## Analysis Service (Cheerio)

### `extractElements(html: string): ElementCandidate[]`
**Purpose**: Structured extraction of interactive DOM elements.

### `pruneDOM(html: string): string`
**Purpose**: Strips non-essential nodes to minimize LLM token consumption.

## Robot Bridge

### `runKeyword(keyword: string, args: any[]): Promise<StepResult>`
**Purpose**: Standard CLI execution of Robot Framework keywords.

### `captureDOM(): Promise<string>`
**Purpose**: Specialized action to retrieve the current browser page source.
