# Quickstart: Simplified Reactive Agent Flow

## Setup
1. Ensure `node` and `npm` are up to date.
2. Install dependencies: `npm install cheerio @langchain/langgraph`.

## Running a Test Mission
1. Provide a mission requiring web interaction:
   ```bash
   node src/cli/index.js "네이버에서 환율 검색하고 알려줘"
   ```
2. Observe the logs for:
   - **Manager**: Planning sequential tasks.
   - **Web Agent**: Capturing DOM, generating AXTree, and re-analyzing the page state after each action.
   - **Compaction**: The `dataStore` being periodically compacted to maintain token efficiency.

## Verification
- Check `logs/agent.log` for AXTree generation and targeting reasoning.
- Confirm the final summary contains the extracted information from the web.
