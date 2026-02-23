# alice-mk5 Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-18

## Active Technologies
- Node.js (Latest LTS), JavaScript (ESM) + LangGraph.js, Robot Framework (SeleniumLibrary), LangChain, js-yaml (001-robot-automation-agent)
- Local File System (JSON for sequences/data, YAML for config) (001-robot-automation-agent)
- Node.js (Latest LTS), JavaScript (ESM) + LangGraph.js, Robot Framework (SeleniumLibrary), LangChain, cheerio, js-yaml (001-robot-automation-agent)
- Node.js (Latest LTS), JavaScript (ESM) + LangGraph.js, Robot Framework, SeleniumLibrary, AppiumLibrary, Appium Server (002-app-automation-support)
- JSON files for automation sequences (unified registry with platform sub-folders) (002-app-automation-support)
- Node.js (Latest LTS), JavaScript (ESM) + LangGraph.js, Robot Framework (SeleniumLibrary, AppiumLibrary) (003-multi-agent-orchestration)
- Local File System (JSON for data_store and sequences), `config.yaml` for compaction thresholds (003-multi-agent-orchestration)
- Local file system (JSON for tools/catalog, .robot/.resource for scripts) (004-tool-repro-optimization)
- Local file system (.resource, JSON) (005-manage-robot-resources)
- Node.js (Latest LTS), JavaScript (ESM) + LangGraph.js, Robot Framework (SeleniumLibrary), Cheerio (for DOM analysis), fs/promises (007-manage-web-resources)
- Local File System (JSON for manifest, `.resource` for keywords) (007-manage-web-resources)

- Node.js (Latest LTS), JavaScript (ESM) + LangGraph.js, Robot Framework (SeleniumLibrary), Jest (for TDD) (001-robot-automation-agent)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

Node.js (Latest LTS), JavaScript (ESM): Follow standard conventions

## Recent Changes
- 007-manage-web-resources: Added Node.js (Latest LTS), JavaScript (ESM) + LangGraph.js, Robot Framework (SeleniumLibrary), Cheerio (for DOM analysis), fs/promises
- 006-simplify-agent-flow: Added Node.js (Latest LTS), JavaScript (ESM) + LangGraph.js, Robot Framework
- 005-manage-robot-resources: Added Node.js (Latest LTS), JavaScript (ESM) + LangGraph.js, Robot Framework


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
