# Data Model: Web Resource Management Agent

## Entities

### ManifestRegistry
*Stored in `src/robots/resources/web/manifests.json`*

| Field | Type | Description |
|-------|------|-------------|
| mappings | Object | Key: Relative file path (ID), Value: Array of strings (Aliases) |

**Example**:
```json
{
  "mappings": {
    "web/naver.resource": ["naver", "네이버", "naver.com", "네이버검색"]
  }
}
```

### ResourceFile
*Stored as `.resource` files in `src/robots/resources/web/`*

**Validation Rules**:
- File name must be the domain (e.g., `google.resource`).
- MUST include `*** Settings ***` and `*** Keywords ***` sections.
- MUST import `SeleniumLibrary` and `./core.resource`.

### AgentState (LangGraph)
*In-memory state during orchestration*

| Field | Type | Description |
|-------|------|-------------|
| intent | String | The user request (e.g., "Add keyword for X") |
| domain | String | Target domain extracted from URL |
| axTree | Object | Current page Accessibility Tree |
| candidates | Array | Potential element targets found by AnalysisService |
| draftKeyword | Object | The generated but unverified keyword structure |
| history | Array | Verification attempt logs |
| status | Enum | `idle`, `analyzing`, `verifying`, `saving`, `error` |

## State Transitions

1. **IDLE** → **ANALYZING**: Triggered by user request.
2. **ANALYZING** → **VERIFYING**: Candidate element identified, draft keyword generated.
3. **VERIFYING** → **SAVING**: Robot execution successful.
4. **VERIFYING** → **ANALYZING**: Execution failed, retrying analysis (max 2 retries).
5. **SAVING** → **IDLE**: File written and manifest updated.
