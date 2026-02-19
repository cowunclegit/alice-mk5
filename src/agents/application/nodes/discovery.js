import { RegistryService } from '../../../services/registry/index.js';

export const discovery = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;

  await logger.info('AppDiscovery: Identifying target application.');

  // Extract application name from intent using LLM
  const systemPrompt = `Extract the application name from the user intent.
Respond ONLY with the application name in the original language used in the intent.
Example: "계산기 앱에서 2+3 계산해줘" -> "계산기"
If no app mentioned, return "Root".`;

  const userPrompt = `Intent: ${state.intent}
Original User Input: ${state.originalInput}`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]);

  const appName = response.content.trim();
  const caps = await RegistryService.getAppCapabilities(appName);

  if (!caps) {
    await logger.error(`AppDiscovery: Could not find application matching "${appName}".`);
    return { status: 'error', reasoning: `App "${appName}" not found.` };
  }

  await logger.info(`AppDiscovery: Found app "${appName}" with ID ${caps.app}`);

  return {
    appCapabilities: caps,
    status: 'discovery'
  };
};
