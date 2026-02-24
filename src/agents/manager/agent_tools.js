import { webAgent } from "../web/index.js";
import { applicationAgent } from "../application/index.js";
import { filesystemAgent } from "../filesystem/index.js";
import { resourceManagerAgent } from "../resource_manager/index.js";

export const createAgentTools = (config) => {
  return [
    {
      name: "resource_manager_agent",
      description: "Handles creation, modification, and deletion of Robot Framework keywords for specific websites. IMPORTANT: The resource_manager_agent analyzes the CURRENT browser screen. If the keyword requires being on a specific page or state (e.g., after logging in, or on a search results page), you MUST use web_agent to navigate to that exact state FIRST before calling resource_manager_agent.",
      execute: async (intent, sessionId, dataStore, taskId, originalInput, history = []) => {
        const result = await resourceManagerAgent.invoke({
          intent,
          sessionId,
          dataStore,
          isSubAgent: true,
          originalInput: originalInput,
          url: dataStore.lastUrl || ''
        }, config);
        return {
          data: result.dataStore || {},
          files: [],
          history: result.history || [],
          status: result.status
        };
      }
    },
    {
      name: "web_agent",
      description: "Handles browser-based automation: searching, scraping, navigating, and clicking. Best for fetching external information.",
      execute: async (intent, sessionId, dataStore, taskId, originalInput, history = []) => {
        const result = await webAgent.invoke({
          intent,
          taskId,
          sessionId,
          dataStore,
          completedSteps: history, // Pass history back
          isSubAgent: true,
          originalInput: originalInput
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
      execute: async (intent, sessionId, dataStore, taskId, originalInput, history = []) => {
        const result = await filesystemAgent.invoke({
          intent,
          taskId,
          dataStore,
          isSubAgent: true,
          originalInput: originalInput
        }, config);
        return {
          data: result.dataStore || {},
          files: result.extractedFiles || [],
          history: [], 
          status: result.status
        };
      }
    },
    {
      name: "application_agent",
      description: "Handles desktop application automation. Provide a high-level intent like 'Open Calculator and add 2+3'. Best for interacting with GUI-based local software.",
      execute: async (intent, sessionId, dataStore, taskId, originalInput, history = []) => {
        const result = await applicationAgent.invoke({
          intent,
          taskId,
          sessionId,
          dataStore,
          completedSteps: history,
          isSubAgent: true,
          originalInput: originalInput
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
