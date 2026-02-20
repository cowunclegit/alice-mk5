import * as analyzer from './nodes/analyzer.js';
import * as executor from './nodes/executor.js';
import * as validator from './nodes/validator.js';
import * as planner from './nodes/planner.js';
import * as reviser from './nodes/reviser.js';
import * as capture_dom from './nodes/capture_dom.js';
import { graph as webGraph } from './graph.js';

export const webAgent = {
  invoke: async (input, config) => {
    // Standardize input mapping from Manager
    const state = {
      ...input,
      input: input.intent || input.input,
      originalInput: input.originalInput // Ensure this is passed
    };
    return webGraph.invoke(state, config);
  }
};
export { AgentState as WebState } from './state.js';
