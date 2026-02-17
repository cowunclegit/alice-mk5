# Quickstart: Robot Automation Agent

## Replanning & Safety
The agent is designed to be autonomous. If a website changes or an element is missing:
1.  The agent will detect the failure.
2.  It will explain the reason in the terminal (e.g., "Element hidden by pop-up").
3.  It will autonomously revise its plan and retry (up to 5 times).
4.  After 5 failures, it will stop and ask for your manual help.

## Running the Agent
```bash
node src/cli/index.js "Go to example.com and extract headers"
```
Observe the "Revision" logs if the first attempt fails.
