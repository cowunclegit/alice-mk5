# Data Model: Simplified Reactive Agent Flow

## Entity: MissionState
The shared state managed by LangGraph.js across all agents.

| Field | Type | Description |
|-------|------|-------------|
| input | String | Original user prompt. |
| tasks | Array<ExecutionTask> | High-level sequential goals. |
| currentTaskIndex | Integer | Index of the task being executed. |
| dataStore | Object | Collected information (files, text values). |
| history | Array<MissionStep> | Log of actions, results, and analysis. |
| replanCount | Integer | Number of re-planning attempts for the current mission. |
| status | Enum | `idle`, `planning`, `executing`, `replanning`, `finished`, `error`. |

## Entity: AXNode
A node in the simplified Accessibility Tree generated from HTML.

| Field | Type | Description |
|-------|------|-------------|
| refId | String | Short reference ID (e.g., `e12`). |
| role | String | Semantic role (e.g., `button`, `link`, `textbox`). |
| name | String | Accessible name (label, placeholder, or text). |
| selector | String | Pre-computed technical CSS selector for the element. |
| isListPattern | Boolean | True if the element is part of a repeating list structure. |
| children | Array<AXNode> | Child nodes in the tree. |
