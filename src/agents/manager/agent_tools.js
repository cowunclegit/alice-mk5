import { webAgent } from "../web/index.js";
import { applicationAgent } from "../application/index.js";
import { filesystemAgent } from "../filesystem/index.js";

export const createAgentTools = (config) => {
  return [
    {
      name: "web_agent",
      description: "Handles browser-based automation: searching, scraping, navigating, and clicking. Best for fetching external information.",
      execute: async (intent, sessionId, dataStore) => {
        const result = await webAgent.invoke({
          intent,
          sessionId,
          dataStore,
          isSubAgent: true,
          originalInput: intent
        }, config);
        return {
          data: result.dataStore || {},
          files: result.extractedFiles || [],
          status: result.status
        };
      }
    },
    {
      name: "filesystem_agent",
      description: "Handles all file system operations: saving data to files, reading local files, and listing files. Best for data persistence and file management.",
      execute: async (intent, sessionId, dataStore) => {
        const result = await filesystemAgent.invoke({
          intent,
          dataStore,
          isSubAgent: true
        }, config);
        return {
          data: result.dataStore || {},
          files: result.extractedFiles || [],
          status: result.status
        };
      }
    },
    {
      name: "application_agent",
      description: "Handles desktop application automation. Provide a high-level intent like 'Open Calculator and add 2+3'. Best for interacting with GUI-based local software.",
      execute: async (intent, sessionId, dataStore) => {
        const result = await applicationAgent.invoke({
          intent,
          sessionId,
          dataStore,
          isSubAgent: true,
          originalInput: intent
        }, config);
        return {
          data: result.dataStore || {},
          files: result.extractedFiles || [],
          status: result.status
        };
      }
    }
  ];
};
