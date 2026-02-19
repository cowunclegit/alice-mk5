import * as discovery from './nodes/discovery.js';
import * as planner from './nodes/planner.js';
import * as capture_xml from './nodes/capture_xml.js';
import * as analyzer from './nodes/analyzer.js';
import * as executor from './nodes/executor.js';
import * as validator from './nodes/validator.js';
import * as reviser from './nodes/reviser.js';
import * as finalizer from './nodes/finalizer.js';
import { appSubGraph } from './graph.js';

const nodes = {
  discovery: discovery.discovery,
  planner: planner.planner,
  capture_xml: capture_xml.capture_xml,
  analyzer: analyzer.analyzer,
  executor: executor.executor,
  validator: validator.validator,
  reviser: reviser.reviser,
  finalizer: finalizer.finalizer
};

export const applicationAgent = appSubGraph(nodes);
export { AppState } from './state.js';
