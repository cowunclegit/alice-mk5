# Quickstart: High-Reproducibility Tool Execution

## Creating a Tool
1. Execute a complex multi-step automation via the CLI:
   `node src/cli/index.js "Search Naver for ... then save ..."`
2. Once the execution succeeds, the system will prompt:
   `Do you want to optimize and save this sequence as a reusable tool? (y/n)`
3. Enter `y` and provide a tool ID (e.g., `naver-search-save`).
4. (Optional) Select `Validation Run` to verify the "Fixed Plan" immediately.
5. The tool is saved to `src/memory/tools/` and added to `catalog.json`.

## Replaying a Tool
1. Call the tool by its ID using the specialized runner (or via another agent):
   `node src/cli/index.js --tool naver-search-save --args '{"keyword": "alice-mk5"}'`
2. The system uses the `reproGraph` and `Fixed_Step_Executor` for near-instant execution.
3. Observe real-time feedback in the console.

## Catalog Management
- To list all tools: `node src/cli/tools.js --list`
- To sync catalog manually (if files were moved): `node src/cli/tools.js --sync`
