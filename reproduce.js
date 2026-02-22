import { ConfigService } from './src/services/config_service.js';
import { GeminiChatModel } from './src/agents/models/gemini_model.js';
import fs from 'fs/promises';

const run = async () => {
  const config = await ConfigService.load();
  const model = new GeminiChatModel({ 
    apiKey: config.llm.apiKey,
    modelName: config.llm.model
  });

  const keywordsInfo = await fs.readFile('src/robots/resources/web/core.resource', 'utf8');

  const systemPrompt = `You are a high-level web automation architect. 
Decompose the user's request into a STRICT sequence of robot actions.

### AVAILABLE ROBOT RESOURCES:
${keywordsInfo}

Respond ONLY with a JSON object:
{
  "plan": [
    { "intent": "Objective of this specific step", "keyword": "Keyword Name", "args": ["arg1", "arg2"] }
  ],
  "reasoning": "Explain your plan."
}
`;

  const userContent = "Find the latest news about OpenAI and summarize it.";

  console.log("Calling LLM...");
  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent }
  ]);

  console.log("Response:");
  console.log(response.content);
};

run().catch(console.error);
