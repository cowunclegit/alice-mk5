import { BrowserService } from '../../../services/browser_service.js';

/**
 * Finalizer node for the Manager agent.
 * Now simplified to just cleaning up sessions, as tool creation is removed.
 */
export const finalizer = async (state, config) => {
  const logger = config.configurable.logger;

  await logger.info('\n전체 자동화 작업이 완료되었습니다.');

  try {
    await BrowserService.stopBrowser(state.sessionId);
    await logger.info('Manager: Browser session stopped.');
  } catch (e) {}

  return { status: 'finished' };
};
