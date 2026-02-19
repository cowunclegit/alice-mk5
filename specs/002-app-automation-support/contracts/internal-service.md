# Internal Service Contracts: Sub-Agent Orchestration

## Sub-Graph Interface (Nested Node)

All sub-graphs (Web, Application) MUST conform to this state-passing interface when invoked as a node in the Manager Graph.

### Input State
```json
{
  "task_intent": "The specific task to perform",
  "shared_context": {
    "data_store": { "previous_output": "value" },
    "session_id": "uuid"
  },
  "config": {
    "appium_url": "http://localhost:4723",
    "capabilities": {}
  }
}
```

### Output State
```json
{
  "status": "success | failure",
  "result_data": { "extracted_info": "value" },
  "logs": [],
  "history": []
}
```

## Registry Tool Interface

### `discoverApps(platform: 'windows' | 'macos'): Promise<RegistryEntry[]>`
- **Returns**: Array of detected application metadata.

### `getAppCapabilities(appName: string): Promise<AppiumCapability>`
- **Search**: Matches `appName` against `RegistryEntry.name` using fuzzy matching.
- **Returns**: Populated Appium capability object for the best match.
