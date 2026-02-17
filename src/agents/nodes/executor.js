import { RobotBridge } from '../../services/robot_bridge.js';

export const executor = async (state) => {
  const { keyword, selector, args } = state.currentStep;
  
  const finalArgs = selector ? [selector, ...args] : args;
  
  const result = await RobotBridge.runKeyword(keyword, finalArgs);
  
  return {
    status: 'executing',
    context: { ...state.context, lastResult: result }
  };
};
