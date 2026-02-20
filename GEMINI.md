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
- 003-multi-agent-orchestration: Added Node.js (Latest LTS), JavaScript (ESM) + LangGraph.js, Robot Framework (SeleniumLibrary, AppiumLibrary)
- 002-app-automation-support: Added Node.js (Latest LTS), JavaScript (ESM) + LangGraph.js, Robot Framework, SeleniumLibrary, AppiumLibrary, Appium Server
- 001-robot-automation-agent: Switched from Browser Library to SeleniumLibrary for web automation.


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
