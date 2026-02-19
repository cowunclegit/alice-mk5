# Quickstart: Optimized Agent Workflow

## Overview
This optimization shifts the agent from "raw DOM analysis" to "accessibility-tree analysis," significantly improving performance and accuracy.

## How to use

### 1. Capturing State
Instead of reading raw HTML, the agent now uses the `Capture AXTREE` keyword. This returns a cleaned representation of the UI.

### 2. Referencing Elements
The AI no longer generates complex CSS selectors. It refers to elements by their `ref` (e.g., `e1`).
- **Prompt**: "Click the Submit button [ref=e1]"
- **System**: Maps `e1` to `button#submit-main` and executes.

### 3. Verification Loop
After every execution, the agent automatically re-analyzes the page.
- If the goal was "Login" and the new AXTREE shows a "Logout" button, the validation node marks the task as successful.
- If the AXTREE still shows the "Login" form, the agent identifies the error and replans.

## Debugging
Snapshots are saved in `src/memory/snapshots/`. You can inspect these to see exactly what the AI "saw" at any point in time.
