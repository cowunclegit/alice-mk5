# Data Model: Agent Workflow Optimization

## Entities

### AXNode
Represents a single node in the Accessibility Tree.
- `role`: (String) The ARIA role (e.g., button, link, heading).
- `name`: (String) The accessible name/label.
- `ref`: (String) Sequential reference ID (e.g., e1, e2).
- `selector`: (String) The underlying Robot/Playwright selector.
- `children`: (Array<AXNode>) Nested interactive elements.

### AXTree
The hierarchical collection of `AXNode`s representing the full page state.
- `root`: (AXNode) The top-level document node.
- `serialized`: (String) Indented text representation for prompt inclusion.

### RoleSnapshot
A cohesive prompt component representing the agent's current situation.
- `persona`: (String) The agent's current behavioral role.
- `objective`: (String) The high-level goal.
- `state`: (AXTree) The current perceived UI state.
- `history`: (Array<ActionRecord>) Rolling window of previous actions and outcomes.

### AgentState (Extended)
Updated LangGraph.js state structure.
- `input`: (String) Original user prompt.
- `axTree`: (AXTree) Current page representation.
- `refMap`: (Map<String, String>) Mapping from `ref` to `selector`.
- `snapshot`: (RoleSnapshot) The generated prompt component.
- `history`: (Array<ActionRecord>) Full execution history.
- `currentPlan`: (Array<Step>) List of steps to fulfill objective.
- `status`: (String) Current workflow phase.

## State Transitions

1.  **Analyze**: Capture DOM -> Generate AXTREE -> Update `refMap`.
2.  **Snapshot**: Combine AXTREE + History + Goal -> Create `RoleSnapshot`.
3.  **Plan**: Use Snapshot -> Generate/Refine sequence of `ref`-based actions.
4.  **Execute**: Map `ref` to `selector` -> Call Robot Framework Side Effect.
5.  **Validate**: Capture new AXTREE -> Verify intent fulfillment via LLM -> Loop to 1 or Finish.
