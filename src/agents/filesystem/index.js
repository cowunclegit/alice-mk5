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
3. If the data you need to extract is in a file (e.g., news_articles.json), specify the 'filePath' so the agent can read it first.
4. **CRITICAL: NEVER invent, hallucinate, or provide placeholder data.** If the required data is not present in the SHARED CONTEXT DATA or the target file, you MUST report that it is missing in the 'reasoning' and return an error status or empty 'extractedKeys'. Do not use example domains like 'example.com' unless they are actually in the context.
5. Respond ONLY with a JSON object:
{
  "action": "write_file | read_file | list_files | extract_to_context",
  "filePath": "path/to/file (if applicable)",
  "content": "Data to write (if write_file)",
  "resultKey": "key to store the result in dataStore (e.g. news_file_path)",
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

      // Smart Path Resolution: Check if actionPlan.filePath is actually a key in dataStore
      let actualPath = actionPlan.filePath;
      if (actualPath && dataStore[actualPath]) {
        if (typeof dataStore[actualPath] === 'string') actualPath = dataStore[actualPath];
        else if (dataStore[actualPath].path) actualPath = dataStore[actualPath].path;
      }

      const fullPath = actualPath ? (path.isAbsolute(actualPath) 
        ? actualPath 
        : path.join(process.cwd(), actualPath)) : null;

      const resultKey = actionPlan.resultKey || (actionPlan.action === 'write_file' ? 'lastSavedFile' : 'lastReadFile');

      if (actionPlan.action === 'write_file' && fullPath) {
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, actionPlan.content, 'utf8');
        await logger.info(`FilesystemAgent: Wrote file to ${fullPath}`);
        resultData = { [resultKey]: fullPath };
        extractedFiles.push(fullPath);
      } else if (actionPlan.action === 'read_file' && fullPath) {
        const data = await fs.readFile(fullPath, 'utf8');
        resultData = { [resultKey]: fullPath, content: data };
        extractedFiles.push(fullPath);
      } else if (actionPlan.action === 'extract_to_context') {
        let sourceData = dataStore;
        
        // If a file path is provided for extraction, read it first
        if (fullPath) {
          try {
            const fileContent = await fs.readFile(fullPath, 'utf8');
            await logger.debug(`FilesystemAgent: Read ${fullPath} for extraction.`);
            try {
              sourceData = { ...dataStore, file_content: JSON.parse(fileContent) };
            } catch (jsonErr) {
              sourceData = { ...dataStore, file_content: fileContent };
            }
            
            // Re-invoke model with the file content included in the prompt for accurate extraction
            const reExtractionPrompt = `I have read the file content from ${actionPlan.filePath}. 
Now, extract the specific keys as requested in the intent: "${intent}"

### FILE CONTENT:
${typeof sourceData.file_content === 'string' ? sourceData.file_content : JSON.stringify(sourceData.file_content, null, 2)}

Respond with the 'extractedKeys' in JSON format.`;

            const reResponse = await model.invoke([
              { role: 'system', content: systemPrompt },
              { role: 'user', content: reExtractionPrompt }
            ]);
            const reParsed = JSON.parse(reResponse.content.match(/\{[\s\S]*\}/)[0]);
            actionPlan.extractedKeys = reParsed.extractedKeys;
          } catch (readErr) {
            await logger.warn(`FilesystemAgent: Could not read ${fullPath} for extraction: ${readErr.message}`);
          }
        }

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
