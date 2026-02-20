# Quickstart: Multi-Agent Orchestration

## New Configuration Options (`config.yaml`)

```yaml
orchestration:
  compaction:
    maxKeys: 10
    strategy: "summarize"
  preflight:
    enabled: true
    timeoutMs: 5000
```

## Running a Composite Task

To trigger the new orchestration flow, simply provide a complex prompt:

```bash
node src/cli/index.js "Search Naver for '나는솔로' news and save the top 3 titles to Notepad"
```

### The Orchestration Lifecycle:
1. **Planning**: Manager decomposes the prompt.
2. **Approval**: You will see a plan like:
   - T1 [Web]: Search Naver and extract news.
   - T2 [App]: Save titles to Notepad.
   *Type 'y' to confirm.*
3. **Preflight**: Manager checks if Appium and BrowserService are ready.
4. **Execution**: Sub-agents run in sequence. Logs are streamed live.
5. **Summarization**: Manager provides a final answer: "I have successfully searched Naver and saved the titles [A, B, C] to your Notepad."

## Developer Notes

- The central graph is located in `src/agents/manager/graph.js`.
- Shared results are stored in the `data_store` object within the state.
- To add a new platform, implement a sub-graph and register it in the Manager's router.
