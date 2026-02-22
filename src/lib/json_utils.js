/**
 * Robustly extracts and parses JSON from a string that may contain Markdown code blocks 
 * or other surrounding text.
 * @param {string} text 
 * @returns {any}
 */
export const extractAndParseJSON = (text) => {
  // 1. Try direct parse
  try {
    return JSON.parse(text);
  } catch (e) {
    // ignore and continue
  }

  // 2. Try extracting from Markdown code blocks (```json ... ``` or ``` ... ```)
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
  const match = codeBlockRegex.exec(text);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch (e) {
      // ignore and continue
    }
  }

  // 3. Try finding the first '{' and last '}'
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    let jsonCandidate = text.substring(start, end + 1);
    
    // 3.1 Pre-process: Handle triple-quoted strings (hallucinated by some models)
    // Replace """ ... """ with escaped single-quoted strings or fix newlines
    if (jsonCandidate.includes('"""')) {
      jsonCandidate = jsonCandidate.replace(/"""([\s\S]*?)"""/g, (match, p1) => {
        return JSON.stringify(p1);
      });
    }

    try {
      return JSON.parse(jsonCandidate);
    } catch (e) {
      // 3.2 If still failing, it might be due to unescaped newlines in regular "..." strings
      // This is risky but sometimes helpful for LLM outputs
      try {
        // Attempt to escape unescaped newlines within strings
        // This is a very basic attempt
        const fixedJson = jsonCandidate.replace(/"([^"]*)"/g, (match, p1) => {
          return '"' + p1.replace(/\n/g, '\\n') + '"';
        });
        return JSON.parse(fixedJson);
      } catch (e2) {
        // ignore and continue
      }
    }
  }

  throw new Error(`Failed to extract valid JSON from LLM response: ${text}`);
};
