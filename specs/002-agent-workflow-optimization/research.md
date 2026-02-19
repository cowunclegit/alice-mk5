# Research: Agent Workflow Optimization

## Core Decisions

### Decision 1: Playwright Accessibility Tree Extraction
**Decision**: Use Playwright's `accessibility.snapshot()` API to capture the AXTREE.
**Rationale**: This API is built specifically to filter out non-interactable nodes and provide a hierarchical view of roles and labels. It's more efficient than manually parsing the DOM or using `Cheerio` for interaction-focused tasks.
**Alternatives considered**: 
- `Cheerio` parsing: Rejected because it doesn't account for visibility or accessibility attributes correctly.
- Custom JS injection: Rejected due to maintenance complexity compared to native Playwright API.

### Decision 2: ROLE Snapshot Prompt Structure
**Decision**: Follow the OpenClaw pattern for Role Snapshots, including Persona, Perceived State (AXTREE), and Task History (Rolling Window).
**Rationale**: This structure provides the LLM with a clear "frame" for decision making. The rolling window (last 3-5 steps) prevents context overflow while maintaining enough local history to avoid repetitive mistakes.
**Alternatives considered**:
- Raw state dumping: Rejected due to token noise.
- Summary-based snapshots: Rejected as summaries can sometimes lose critical technical details needed for selector matching.

### Decision 3: LangGraph Workflow Transitions
**Decision**: Implement a cyclic graph with explicit `analyze -> plan -> execute -> validate` nodes.
**Rationale**: This ensures that every action is verified. If `validate` fails, the agent transitions back to `analyze` to understand the new state, rather than just retrying the same action.
**Alternatives considered**:
- Linear "Plan & Execute": Rejected because it lacks the granular feedback loop needed for dynamic pages.

## Implementation Patterns

### AXTREE Text Format (Indented)
The AXTREE will be serialized into an indented Markdown list for prompt inclusion:
```text
- Navigation [role=navigation]
  - link "Home" [ref=e1]
- Main [role=main]
  - button "Search" [ref=e2]
```
This format is highly readable for both humans and AI, and significantly reduces the token count compared to JSON.

### Sequential Ref Mapping
Every node in the AXTREE will be assigned a `ref` (e.g., `e1`, `e2`). A mapping object will be stored in the LangGraph state to translate these refs back to full CSS/XPath selectors for Robot Framework execution.
```javascript
// Internal State Mapping
{
  "e1": "nav >> a.home",
  "e2": "main >> button#search"
}
```
This allows the AI to simply say "Click e1", reducing the risk of generating complex, incorrect selectors.
