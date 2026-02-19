---
name: appium-automation-agent
description: specialized workflow for desktop and mobile application automation using Appium and Robot Framework. Use when Gemini CLI needs to discover installed applications, generate Appium capabilities, or create application-specific Robot Framework resources.
---

# Appium Automation Agent

This skill extends Gemini CLI with the ability to manage desktop and mobile application automation within the Alice MK5 framework.

## Quick Start

1. **Discover Applications**: Use `scripts/discover_apps.cjs` to find technical identifiers for user-friendly app names.
2. **Setup Sub-Agent**: Follow the structure in `src/agents/application/` for the Application Sub-Graph.
3. **Generate Resources**: Use `assets/appium_resource_template.resource` as a base for Appium-based keywords.

## Specialized Workflows

### Capability Discovery
When a user provides an app name, execute the following to map it to a technical identifier:
```bash
node .gemini/skills/appium-automation-agent/scripts/discover_apps.cjs
```
Match the output `name` against the user's input and extract the `identifier` or `path`.

### Application Sub-Graph Orchestration
The Application Sub-Graph MUST implement the cycle:
1. **Analyze**: Parse `app_source.xml` (from `Capture App UI XML`) to find selectors.
2. **Execute**: Call Robot Keywords using `AppiumLibrary`.
3. **Validate**: Self-evaluate the UI state against the intent.

### Resource Organization
Store all application-specific resources in:
- `src/robots/resources/application/`
- `src/robots/tools/application/`

## Advanced Reference
- See [references/appium_best_practices.md](references/appium_best_practices.md) for driver-specific selector strategies and permissions.
