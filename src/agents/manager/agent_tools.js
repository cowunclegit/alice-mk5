import { webAgent } from "../web/index.js";
import { applicationAgent } from "../application/index.js";
import { filesystemAgent } from "../filesystem/index.js";

export const createAgentTools = (config) => {
  return [
    {
      name: "web_agent",
      description: "Handles browser-based automation: searching, scraping, navigating, and clicking. Best for fetching external information.",
      execute: async (intent, sessionId, dataStore, taskId) => {
        const result = await webAgent.invoke({
          intent,
          taskId,
          sessionId,
          dataStore,
          isSubAgent: true,
          originalInput: intent
        }, config);
        return {
          data: result.dataStore || {},
          files: result.extractedFiles || [],
          history: result.completedSteps || [],
          status: result.status
        };
      }
    },
    {
      name: "filesystem_agent",
      description: "Handles all file system operations: saving data to files, reading local files, and listing files. Best for data persistence and file management.",
      execute: async (intent, sessionId, dataStore, taskId) => {
        const result = await filesystemAgent.invoke({
          intent,
          taskId,
          dataStore,
          isSubAgent: true
        }, config);
        return {
          data: result.dataStore || {},
          files: result.extractedFiles || [],
          history: [], // Filesystem agent doesn't use Robot Framework yet
          status: result.status
        };
      }
    },
    {
      name: "application_agent",
      description: "Handles desktop application automation. Provide a high-level intent like 'Open Calculator and add 2+3'. Best for interacting with GUI-based local software.",
      execute: async (intent, sessionId, dataStore, taskId) => {
        const result = await applicationAgent.invoke({
          intent,
          taskId,
          sessionId,
          dataStore,
          isSubAgent: true,
          originalInput: intent
        }, config);
        return {
          data: result.dataStore || {},
          files: result.extractedFiles || [],
          history: result.completedSteps || [],
          status: result.status
        };
      }
    }
  ];
};

export const executeSpecializedTool = async (toolId, platform, variables, sessionId, config) => {
  const { reproGraph } = await import('./graph.js');
  const workflow = reproGraph();
  return workflow.invoke({
    toolId,
    platform,
    variables,
    sessionId
  }, config);
};
