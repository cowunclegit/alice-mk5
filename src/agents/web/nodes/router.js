export const router = (state) => {
  const input = state.input.toLowerCase();
  if (input.startsWith('run tool ') || input.startsWith('use tool ')) {
    return "tool_execution";
  }
  return "tool_making";
};
