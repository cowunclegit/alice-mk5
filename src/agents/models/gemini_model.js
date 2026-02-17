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
    const prompt = messages.map(m => m.content).join('\n');
    
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${error}`);
    }

    const data = await response.json();
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
