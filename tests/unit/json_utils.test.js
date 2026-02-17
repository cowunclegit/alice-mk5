import { extractAndParseJSON } from '../../src/lib/json_utils.js';

describe('json_utils', () => {
  it('should parse clean JSON', () => {
    const input = '{"key": "value"}';
    expect(extractAndParseJSON(input)).toEqual({ key: 'value' });
  });

  it('should extract and parse JSON from markdown blocks', () => {
    const input = `Here is the plan:
\`\`\`json
{"plan": []}
\`\`\``;
    expect(extractAndParseJSON(input)).toEqual({ plan: [] });
  });

  it('should extract JSON embedded in text using curly braces', () => {
    const input = 'The result is { "success": true } hope you like it.';
    expect(extractAndParseJSON(input)).toEqual({ success: true });
  });

  it('should throw error if no JSON is found', () => {
    const input = 'No json here';
    expect(() => extractAndParseJSON(input)).toThrow();
  });
});
