import { HistoryService } from '../../src/services/history_service.js';

describe('HistoryService', () => {
  const mockHistory = [
    { action: { keyword: 'Open', intent: 'open site' }, status: 'pass' },
    { action: { keyword: 'Type', intent: 'enter name' }, status: 'pass' },
    { action: { keyword: 'Click', intent: 'submit form' }, status: 'fail', reasoning: 'Element missing' },
    { action: { keyword: 'Wait', intent: 'wait for loader' }, status: 'pass' },
    { action: { keyword: 'Click', intent: 'retry submit' }, status: 'pass' },
    { action: { keyword: 'Extract', intent: 'get result' }, status: 'pass' }
  ];

  test('limitTurns', () => {
    const limited = HistoryService.limitTurns(mockHistory, 3);
    expect(limited).toHaveLength(3);
    expect(limited[0].action.keyword).toBe('Wait');
  });

  test('format', () => {
    const limited = HistoryService.limitTurns(mockHistory, 3);
    const formatted = HistoryService.format(limited);
    expect(formatted).toContain('Wait');
    expect(formatted).toContain('Extract');
  });
});
