# Internal Service Contract: Robot Automation Agent

## Agent Orchestrator (LangGraph.js)

### `parseIntent(prompt: String): Sequence`
**Purpose**: Use LLM to decompose natural language into Robot Framework actions.
- **Input**: `prompt` - The user's goal description.
- **Output**: A drafted `Sequence` object containing `Robot Action`s.

### `executeRobot(action: Robot Action): RobotResult`
**Purpose**: Run the actual Robot Framework task through Node.js.
- **Input**: `action` - The specific keyword and arguments to execute.
- **Output**: `RobotResult` - `{ status: 'success' | 'failed', message: String, data?: Object }`.

### `confirmSequence(id: String, success: Boolean): void`
**Purpose**: Finalize and persist a recorded sequence based on user feedback.
- **Input**: `id` - Temporary sequence ID, `success` - Whether it worked as intended.
- **Output**: None (Side effect: Persist to file system).

## Persistence Layer

### `getSequences(): Sequence[]`
**Purpose**: Retrieve all saved sequences.

### `saveSequence(name: String, sequence: Sequence): void`
**Purpose**: Save a successfully recorded sequence for future reuse.

### `getSequenceByName(name: String): Sequence`
**Purpose**: Load a specific sequence for "tool" execution.
