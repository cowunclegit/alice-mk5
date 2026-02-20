# Internal Service Contracts: Multi-Agent Orchestration

## Manager Graph State Reducers

The `data_store` field in `ManagerState` must use a custom reducer to merge results from sub-agents.

### `reduceDataStore(current: Object, update: Object): Object`
- **Logic**: Performs a deep merge of the update object into the current store. If keys conflict, the latest update wins.

## Sub-Agent Handoff Interface

Every sub-agent (Web, Application, Tool) must accept and return this standardized structure when invoked by the Manager.

### Input Handoff
```json
{
  "task": {
    "id": "string",
    "intent": "string",
    "platform": "string"
  },
  "context": {
    "data_store": "Object",
    "session_id": "string"
  }
}
```

### Output Handoff
```json
{
  "status": "success | failure",
  "result": "Object (Structured JSON)",
  "error": "Optional error context for Auto-Fix"
}
```

## Readiness Probe Interface

### `probeResources(tasks: Task[]): Promise<Map<string, boolean>>`
- **Description**: Proactively pings Appium and BrowserService if relevant tasks exist in the plan.
- **Result**: A map of resource IDs to their reachability status.
