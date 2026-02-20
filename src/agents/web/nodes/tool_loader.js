import { StorageService } from '../../../services/storage_service.js';
import fs from 'fs/promises';
import path from 'path';
import { extractAndParseJSON } from '../../../lib/json_utils.js';

export const toolLoader = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;
  const input = state.input; // Intent from Manager
  
  await logger.info(`ToolLoader: Identifying best matching tool based on metadata for intent: "${input}"`);

  // 1. Read FULL metadata for all available web tools
  const toolsDir = path.join(StorageService.toolsDir, 'web');
  const availableToolsInfo = [];
  try {
    const files = await fs.readdir(toolsDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(toolsDir, file), 'utf8');
        const tool = JSON.parse(content);
        availableToolsInfo.push({
          id: tool.id,
          title: tool.title,
          description: tool.description,
          variables: tool.variables
        });
      }
    }
  } catch (e) {
    await logger.error(`ToolLoader: Failed to load tools metadata: ${e.message}`);
  }

  // 2. Ask LLM to pick the best tool and extract parameters using metadata
  const dispatchPrompt = `You are a tool execution dispatcher.
User Intent: "${input}"

### AVAILABLE TOOLS (METADATA):
${JSON.stringify(availableToolsInfo, null, 2)}

### GOALS:
1. Identify the tool ID that best matches the intent.
2. Extract values for the variables defined in that tool's metadata.
3. Respond ONLY with a JSON object:
{
  "toolId": "chosen-id",
  "values": { "varName": "extractedValue" },
  "reasoning": "Why this tool matches"
}
`;

  const dispatchResponse = await model.invoke([
    { role: 'system', content: dispatchPrompt }
  ]);

  const { toolId, values, reasoning } = extractAndParseJSON(dispatchResponse.content);
  await logger.info(`ToolLoader: Selected "${toolId}" because: ${reasoning}`);
  await logger.debug(`ToolLoader: Extracted parameters: ${JSON.stringify(values)}`);
  
  try {
    const sequence = await StorageService.loadSequence(toolId, 'web');
    
    // 3. Parameterize the sequence
    const parameterizedActions = sequence.actions.map(action => {
      const newArgs = action.args.map(arg => {
        if (typeof arg === 'string') {
          let replaced = arg;
          for (const [name, val] of Object.entries(values)) {
            replaced = replaced.replace(new RegExp(`{{${name}}}`, 'g'), val);
          }
          return replaced;
        }
        return arg;
      });
      return { ...action, args: newArgs };
    });

    // 4. Select resources
    const manifestPath = path.join(process.cwd(), 'src/robots/resources/manifest.json');
    let selected = ['web/core.resource'];
    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);
      const toolText = JSON.stringify(sequence).toLowerCase();

      for (const [resPath, aliases] of Object.entries(manifest)) {
        if (!resPath.startsWith('web/')) continue;
        const hasMatch = aliases.some(alias => toolText.includes(alias.toLowerCase()));
        if (hasMatch) selected.push(resPath);
      }
    } catch (e) {}

    return {
      plan: parameterizedActions,
      remainingSteps: parameterizedActions,
      selectedResources: selected,
      activeToolId: toolId,
      status: 'executing',
      reasoning: `Matched tool "${toolId}" based on metadata analysis.`
    };
  } catch (e) {
    throw new Error(`Tool "${toolId}" failed to execute: ${e.message}`);
  }
};
