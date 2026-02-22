import { BaseChatModel } from "@langchain/core/language_models/chat_models";

export class GeminiChatModel extends BaseChatModel {
  constructor(fields) {
    super(fields);
    this.apiKey = fields.apiKey;
    this.modelName = fields.modelName || 'gemini-2.0-flash';
    this.apiUrl = fields.endpoint || `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
  }

  _llmType() {
    return "gemini_custom";
  }

  async _generate(messages, options, runManager) {
    // LangChain messages can be objects or strings
    const extractContent = (m) => {
      if (typeof m === 'string') return m;
      return m.content || m.text || (m.lc_kwargs && m.lc_kwargs.content) || '';
    };

    const getRole = (m) => {
      const type = m._getType ? m._getType() : (m.role || 'user');
      if (type === 'system') return 'system';
      if (type === 'assistant' || type === 'model' || type === 'ai') return 'model';
      return 'user';
    };

    const systemMessage = messages.find(m => getRole(m) === 'system');
    const userMessages = messages.filter(m => getRole(m) !== 'system');
    
    const contents = userMessages.map(m => ({
      role: getRole(m),
      parts: [{ text: extractContent(m) }]
    }));

    // Gemini requires at least one content part for the main body
    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: '...' }] });
    }

    const body = { contents };

    if (systemMessage) {
      body.system_instruction = {
        parts: [{ text: extractContent(systemMessage) }]
      };
    }
    
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error(`Gemini API returned no candidates: ${JSON.stringify(data)}`);
    }

    const text = data.candidates[0].content.parts[0].text;

    return {
      generations: [{
        text,
        message: { content: text }
      }]
    };
  }

  // Helper for tests
  async _call(messages) {
    const result = await this._generate(messages);
    return result.generations[0].text;
  }
}
