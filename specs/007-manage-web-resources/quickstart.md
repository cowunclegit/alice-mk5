# Quickstart: Web Resource Management Agent

## Prerequisites
- Node.js installed
- Google Chrome and Chromedriver installed
- `manifests.json` exists in `src/robots/resources/web/`

## Usage

### 1. Register a new site
Ask the agent to create a basic resource for a site:
```bash
node src/cli/index.js "Create a search keyword for google.com"
```

### 2. Verify and Save
1. The agent will open Google in a visible browser.
2. It will identify the search input via AXTree.
3. It will generate a draft `Search Google` keyword.
4. It will run the keyword to verify it works.
5. If successful, it saves to `src/robots/resources/web/google.resource`.

### 3. Check Manifest
Verify that `manifests.json` has the new entry:
```json
{
  "mappings": {
    "web/google.resource": ["google", "Google Search"]
  }
}
```
