# Quickstart: Robot Automation Agent

## Setup
1. `pip install robotframework robotframework-browser`
2. `rfbrowser init`
3. `npm install`
4. Define your Gemini API key in `config.yaml`.

## Running the Agent
```bash
node src/cli/index.js "Find the latest post on example.com and click its title"
```

## Reusing Tools
To run a previously saved tool:
```bash
node src/cli/index.js "run tool [tool-id]"
```

## Note on Language
The agent supports Korean for CLI prompts and descriptions. Original user intent can be provided in Korean.

## Integrated Flow
1. **Planner**: Creates the step sequence.
2. **Analyzer**: (New) Reads the page HTML via Cheerio to find the right elements.
3. **Clarifier**: (New) If multiple elements match, it will ask you to confirm.
4. **Executor**: Performs the action in the visible browser.
5. **Reviser**: Fixes the remaining steps if something goes wrong.

## State Organization
- `plan`: Original goal sequence.
- `currentStep`: Active action (intent + resolved selector).
- `completedSteps`: Success history.
- `remainingSteps`: Future actions queue.
