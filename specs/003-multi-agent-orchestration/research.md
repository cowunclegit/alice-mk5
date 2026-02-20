# Research: Multi-Agent Orchestration

## Decision: Plan & Execute Pattern for the Manager Graph
- **Rationale**: The Plan & Execute pattern is ideal for complex, multi-step tasks. It allows the Manager to generate a high-level roadmap, while the specialized sub-agents handle the low-level execution details.
- **Alternatives considered**: Reactive Router (too fragile for long sequences), Hierarchical Teams (too complex for the current project scope).

## Decision: Compaction via LLM Summarization
- **Rationale**: When the `data_store` exceeds the `config.yaml` threshold, the Manager will invoke an LLM to "summarize and archive" the oldest keys. This preserves the semantic history without bloating the token context.
- **Alternatives considered**: Simple deletion (risks losing critical context), Token-based truncation (risks cutting off mid-JSON).

## Decision: Real-time Streaming Logs via Node.js Events
- **Rationale**: To achieve **Full Transparent Logs**, sub-agents will emit events that the Manager's logger captures and streams to the CLI. This prevents UI "hangs" during long automation steps.
- **Alternatives considered**: Shared file tailing (disk I/O overhead), Polling (latency).

## Decision: Proactive Readiness Check via Port Probing
- **Rationale**: Use Node.js `net.connect` to verify Appium (4723) and BrowserService (debug port) before starting. This is lightweight and avoids the overhead of a full library initialization.
- **Alternatives considered**: LLM-based check (unreliable for infra), Full dry-run (too slow).

## Best Practices: LangGraph.js Sub-Graph Integration
- **State Merging**: Use specialized reducers in the Manager State to handle concurrent or sequential updates to the `data_store`.
- **Error Propagation**: Sub-graphs must return a standardized error object so the Manager's **Autonomous Auto-Fix** logic can correctly analyze the failure.
