import { StateGraph, END, START } from "@langchain/langgraph";
import { ManagerState } from "./state.js";
import { router } from "./router.js";
import { applicationAgent } from "../application/index.js";
import { webAgent } from "../web/index.js";
import { BrowserService } from "../../services/browser_service.js";

export const managerGraph = () => {
  const workflow = new StateGraph(ManagerState)
    .addNode("router", router)
    .addNode("application_subgraph", async (state, config) => {
      const logger = config.configurable.logger;
      const currentTask = state.tasks[state.currentTaskIndex];
      await logger.info(`Manager: Handing off to Application Sub-Graph for task: "${currentTask.intent}"`);
      
      const result = await applicationAgent.invoke({
        intent: currentTask.intent,
        originalInput: state.input,
        sessionId: state.sessionId,
        dataStore: state.dataStore,
        retryCount: 0 // Reset retry count for new subgraph call
      }, config);
      
      await logger.info(`Manager: Application Sub-Graph task completed with status: ${result.status}`);
      
      return {
        dataStore: result.result_data || {},
        currentTaskIndex: state.currentTaskIndex + 1,
        status: 'aggregating',
        history: result.completedSteps || []
      };
    })
    .addNode("web_subgraph", async (state, config) => {
      const logger = config.configurable.logger;
      const currentTask = state.tasks[state.currentTaskIndex];
      await logger.info(`Manager: Handing off to Web Sub-Graph for task: "${currentTask.intent}"`);

      const result = await webAgent.invoke({
        input: currentTask.intent,
        sessionId: state.sessionId,
        selectedResources: ["web/core.resource", "web/naver.resource"],
        retryCount: 0
      }, config);

      await logger.info(`Manager: Web Sub-Graph task completed.`);

      return {
        dataStore: result.context?.lastResult || {},
        currentTaskIndex: state.currentTaskIndex + 1,
        status: 'aggregating',
        history: result.completedSteps || []
      };
    })
    .addNode("finalizer", async (state, config) => {
      const logger = config.configurable.logger;
      await logger.info('Manager: Finalizing all tasks.');
      
      // Stop browser process at the very end
      try {
        await BrowserService.stopBrowser(state.sessionId);
        await logger.info('Manager: Browser process stopped.');
      } catch (e) {}
      
      return { status: 'finished' };
    });

  workflow.addEdge(START, "router");
  
  workflow.addConditionalEdges("router", (state) => {
    if (state.currentTaskIndex >= state.tasks.length) return "finalizer";
    const task = state.tasks[state.currentTaskIndex];
    if (task.platform === 'application') return "application_subgraph";
    if (task.platform === 'web') return "web_subgraph";
    return "finalizer";
  });

  workflow.addEdge("application_subgraph", "router");
  workflow.addEdge("web_subgraph", "router");
  workflow.addEdge("finalizer", END);

  return workflow.compile();
};
