# Quickstart: Application Automation

## Prerequisites

1. **Appium Server**: Install Appium via npm (`npm install -g appium`).
2. **Drivers**:
    - **Windows**: `appium driver install windows` (Requires Windows SDK and Developer Mode).
    - **macOS**: `appium driver install mac2` (Requires Xcode).
3. **AppiumLibrary**: Ensure `robotframework-appiumlibrary` is installed in your Python environment.

## Setup

1. Start the Appium server:
   ```bash
   appium
   ```
2. Verify connection URL matches `config.yaml` (default: `http://localhost:4723`).

## Running Application Automation

1. Use the CLI to provide an application-specific prompt:
   ```bash
   node src/cli/index.js "Open the Calculator app and type 123"
   ```
2. The agent will:
    - Detect the `application` intent.
    - Use the **Registry Tool** to find "Calculator" identifiers.
    - Route to the **Application Sub-Agent**.
    - Execute Appium keywords via Robot Framework.

## Folder Structure for Developers

- **Sub-Agent Logic**: `src/agents/application/`
- **Appium Resources**: `src/robots/resources/application/`
- **Saved App Sequences**: `src/robots/tools/application/`
