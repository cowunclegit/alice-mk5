import { StateGraph, END, START } from "@langchain/langgraph";
import fs from 'fs/promises';
import { ManagerState } from "./state.js";
import { decomposer } from "./nodes/decomposer.js";
import { approver } from "./nodes/approver.js";
import { executor } from "./nodes/executor.js";
import { autoFix } from "./nodes/auto_fix.js";
import { summarizer } from "./nodes/summarizer.js";
import { finalizer } from "./nodes/finalizer.js";
import { fixedStepExecutor } from "./nodes/fixed_step_executor.js";
import { StorageService } from "../../services/storage_service.js";

const loader = async (state, config) => {
  const { toolId } = state;
  const logger = config.configurable.logger;
  try {
    // 1. Find the tool in the catalog to get the correct platform
    const catalogContent = await fs.readFile(StorageService.catalogPath, 'utf8');
    const catalog = JSON.parse(catalogContent);
    const toolEntry = catalog.tools.find(t => t.id === toolId);
    
    if (!toolEntry) {
      throw new Error(`Tool "${toolId}" not found in catalog.`);
    }

    // 2. Load using the platform from catalog
    const manifest = await StorageService.loadToolManifest(toolId, toolEntry.platform);
    await logger.info(`Loader: Loaded manifest for ${toolId} (${toolEntry.platform})`);
    return { manifest, platform: toolEntry.platform };
  } catch (e) {
    await logger.error(`Loader: Failed to load tool manifest for ${toolId}: ${e.message}`);
    return { status: 'error', reasoning: `Failed to load tool manifest for ${toolId}: ${e.message}` };
  }
};

export const managerGraph = () => {
  const workflow = new StateGraph(ManagerState)
    .addNode("decomposer", decomposer)
    .addNode("approver", approver)
    .addNode("executor", executor)
    .addNode("auto_fix", autoFix)
    .addNode("summarizer", summarizer)
    .addNode("finalizer", finalizer);

  workflow.addEdge(START, "decomposer");
  workflow.addEdge("decomposer", "approver");
  
  workflow.addConditionalEdges("approver", (state) => {
    if (state.status === 'executing') return "executor";
    return END;
  });

  workflow.addConditionalEdges("executor", (state) => {
    if (state.status === 'error') return "auto_fix";
    
    // If successful and more tasks remain, go to next task via executor
    if (state.currentTaskIndex < state.tasks.length) return "executor";
    
    // All tasks completed
    return "summarizer";
  });

  workflow.addConditionalEdges("auto_fix", (state) => {
    if (state.status === 'executing') return "executor";
    return "summarizer";
  });

  workflow.addEdge("summarizer", "finalizer");
  workflow.addEdge("finalizer", END);

  return workflow.compile();
};

export const reproGraph = () => {
  const workflow = new StateGraph(ManagerState)
    .addNode("loader", loader)
    .addNode("fixed_step_executor", fixedStepExecutor);

  workflow.addEdge(START, "loader");
  workflow.addEdge("loader", "fixed_step_executor");
  workflow.addEdge("fixed_step_executor", END);

  return workflow.compile();
};
