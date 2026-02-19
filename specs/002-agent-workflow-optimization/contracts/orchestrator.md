# Orchestrator Contract: Optimized Workflow

## LangGraph Nodes

### `analyzeNode`
**Purpose**: Refresh the agent's view of the UI.
- **Inputs**: Current browser session.
- **Outputs**: `axTree`, `refMap`.
- **Side Effects**: Calls `Capture AXTREE` robot keyword.

### `snapshotNode`
**Purpose**: Prepare the context for decision making.
- **Inputs**: `axTree`, `history`, `objective`.
- **Outputs**: `snapshot` (formatted string).

### `planNode`
**Purpose**: Decide on the next set of actions.
- **Inputs**: `snapshot`.
- **Outputs**: `currentPlan` (Array of actions using `ref`).

### `executeNode`
**Purpose**: Perform the planned actions.
- **Inputs**: `currentPlan`, `refMap`.
- **Outputs**: Action results (technical pass/fail).
- **Side Effects**: Spawns Robot Framework process.

### `validateNode`
**Purpose**: Verify intent fulfillment.
- **Inputs**: `snapshot`, action results.
- **Outputs**: `intent_met` (Boolean), `feedback` (String).

## Robot Keywords

### `Capture AXTREE`
- **Arguments**: None.
- **Returns**: Hierarchical JSON of accessibility snapshot.
- **Implementation**: Uses Playwright's `page.accessibility.snapshot()`.
