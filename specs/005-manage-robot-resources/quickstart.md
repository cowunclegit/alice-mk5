# Quickstart: Robot Framework Resource Management

## Extending the Agent's Capabilities
1. Provide a prompt focusing on the automation logic itself:
   `"Add a keyword to Naver resource that can filter news by date."`
2. The `router` will detect the resource management intent and invoke the `ResourceAgent`.
3. The `ResourceAgent` will:
   - Index existing resources.
   - Propose a new keyword implementation.
   - Show you a **Diff** of the changes.
4. **Approve** the change (`y`).
5. The system validates the syntax via dry-run and updates the `.resource` and `manifests.json` files.

## Creating a New Resource Category
1. Prompt: `"Create a new resource file for Slack integration."`
2. The agent will propose a filename (e.g., `slack.resource`) and its initial structure.
3. Review and approve the new file creation.

## Safety Features
- **Protection**: If you ask to modify `core.resource`, the agent will politely decline and suggest using a custom resource instead.
- **Rollback**: If a dry-run fails, the system automatically restores the backup (`.bak`).
