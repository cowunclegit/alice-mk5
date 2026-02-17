import { jest } from '@jest/globals';
import { GeminiChatModel } from '../../src/agents/models/gemini_model.js';

describe('GeminiChatModel', () => {
  it('should call the REST API and return a response', async () => {
    // Mock global fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{ content: { parts: [{ text: 'Hello from Gemini' }] } }]
        }),
      })
    );

    const model = new GeminiChatModel({ apiKey: 'test-key' });
    const response = await model._call([{ role: 'user', content: 'Hi' }]);
    
    expect(response).toBe('Hello from Gemini');
    expect(fetch).toHaveBeenCalled();
  });
});
