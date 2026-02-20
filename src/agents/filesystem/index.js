import fs from 'fs/promises';
import path from 'path';
import { StorageService } from '../../services/storage_service.js';

export const filesystemAgent = {
  invoke: async (state, config) => {
    const logger = config.configurable.logger;
    const model = config.configurable.model;
    const { intent, dataStore } = state;

    await logger.info(`FilesystemAgent: Processing intent - "${intent}"`);

    const systemPrompt = `You are a File System & Data Specialist.
Your job is to manage file operations and facilitate data flow between agents by extracting key information into the shared context.

### SHARED CONTEXT DATA:
${JSON.stringify(dataStore)}

### AVAILABLE ACTIONS:
1. "write_file": Persist specific content to a file.
2. "read_file": Retrieve content from an existing file.
3. "list_files": List available files in a directory.
4. "extract_to_context": Parse data (from context or a file) and extract specific variables into the shared 'dataStore' for other agents to use.

### RULES:
1. Use 'src/memory/data' as the default directory for file operations.
2. For "extract_to_context", identify the most relevant data points required for subsequent tasks and map them to descriptive keys in 'extractedKeys'.
3. Respond ONLY with a JSON object:
{
  "action": "write_file | read_file | list_files | extract_to_context",
  "filePath": "path/to/file (if applicable)",
  "content": "Data to write (if write_file)",
  "extractedKeys": { "variable_name": "value" },
  "reasoning": "Technical rationale"
}
`;

    const response = await model.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: intent }
    ]);

    let actionPlan;
    try {
      const jsonContent = response.content.match(/\{[\s\S]*\}/)[0];
      actionPlan = JSON.parse(jsonContent);
    } catch (e) {
      return { status: 'error', reasoning: 'Failed to parse filesystem action plan.' };
    }

    try {
      let resultData = {};
      let extractedFiles = [];

      const fullPath = actionPlan.filePath ? (path.isAbsolute(actionPlan.filePath) 
        ? actionPlan.filePath 
        : path.join(process.cwd(), actionPlan.filePath)) : null;

      if (actionPlan.action === 'write_file' && fullPath) {
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, actionPlan.content, 'utf8');
        await logger.info(`FilesystemAgent: Wrote file to ${fullPath}`);
        resultData = { lastSavedFile: fullPath };
        extractedFiles.push(fullPath);
      } else if (actionPlan.action === 'read_file' && fullPath) {
        const data = await fs.readFile(fullPath, 'utf8');
        resultData = { lastReadFile: fullPath, content: data };
        extractedFiles.push(fullPath);
      } else if (actionPlan.action === 'extract_to_context') {
        if (actionPlan.extractedKeys) {
          resultData = { ...actionPlan.extractedKeys };
          const keys = Object.keys(actionPlan.extractedKeys).join(', ');
          await logger.info(`FilesystemAgent: Extracted keys to context: ${keys}`);
        }
      }

      return {
        status: 'finished',
        dataStore: { ...dataStore, ...resultData },
        extractedFiles: extractedFiles
      };
    } catch (e) {
      await logger.error(`FilesystemAgent Error: ${e.message}`);
      return { status: 'error', reasoning: e.message };
    }
  }
};
