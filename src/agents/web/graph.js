import { StateGraph, END, START } from "@langchain/langgraph";
import { AgentState } from "./state.js";
import { planner } from "./nodes/planner.js";
import { executor } from "./nodes/executor.js";
import { validator } from "./nodes/validator.js";
import { finalizer } from "./nodes/finalizer.js";
import { reviser } from "./nodes/reviser.js";
import { resourceSelector } from "./nodes/resource_selector.js";
import { resultCollector } from "./nodes/result_collector.js";
import { captureDom } from "./nodes/capture_dom.js";
import { analyzer } from "./nodes/analyzer.js";

const shouldContinue = (state) => {
  const lastStep = state.completedSteps[state.completedSteps.length - 1];
  
  // 1. 만약 마지막 단계가 실패했다면 복구(Reviser) 시도
  if (lastStep && lastStep.status === 'fail') {
    if (state.retryCount < 5) return "reviser";
    return state.isSubAgent ? "result_collector" : "finalizer";
  }

  // 2. 남은 단계가 있다면 다음 단계 준비를 위해 initialize_step으로 이동 (루프)
  if (state.remainingSteps && state.remainingSteps.length > 0) {
    return "initialize_step";
  }
  
  return state.isSubAgent ? "result_collector" : "finalizer";
};

const initializeStep = (state) => {
  if (!state.remainingSteps || state.remainingSteps.length === 0) {
    return { currentStep: null, status: 'finished' };
  }
  const nextStep = state.remainingSteps[0];
  const remaining = state.remainingSteps.slice(1);
  return {
    currentStep: nextStep,
    remainingSteps: remaining,
    status: 'executing'
  };
};

const workflow = new StateGraph(AgentState)
  // Nodes
  .addNode("resource_selector", resourceSelector)
  .addNode("planner", planner)
  .addNode("initialize_step", initializeStep)
  .addNode("capture_dom", captureDom)
  .addNode("executor", executor)
  .addNode("result_collector", resultCollector)
  .addNode("analyzer", analyzer)
  .addNode("validator", validator)
  .addNode("finalizer", finalizer)
  .addNode("reviser", reviser)
  
  // Direct entry to resource selection and planning
  .addEdge(START, "resource_selector")

  // Path B: 반응형 탐색 및 실행 루프 (Reactive Planning Loop)
  .addEdge("resource_selector", "planner")
  .addEdge("planner", "initialize_step")
  .addEdge("initialize_step", "capture_dom") // 1. 눈을 뜬다 (현재 화면 캡처)
  .addEdge("capture_dom", "analyzer")       // 2. 화면을 분석한다 (최적의 셀렉터/방법 결정)
  .addEdge("analyzer", "executor")          // 3. 행동한다 (실제 실행)
  .addEdge("executor", "validator")         // 4. 결과가 맞는지 확인한다
  .addConditionalEdges("validator", shouldContinue) // 5. 성공했으면 다음 할 일을 위해 다시 루프
  .addEdge("reviser", "initialize_step")
  .addEdge("finalizer", END);

export const graph = workflow.compile();
