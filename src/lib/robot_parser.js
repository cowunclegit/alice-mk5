/**
 * RobotParser utility for basic parsing and modification of Robot Framework .resource files.
 * Uses regex-based approach for simplicity as per research.md.
 */
export class RobotParser {
  /**
   * Parses a .resource file and returns an array of keyword definitions.
   * @param {string} content - The content of the .resource file.
   * @returns {Array<{name: string, args: string[], body: string}>}
   */
  static parseKeywords(content) {
    const keywords = [];
    const lines = content.split('\n');
    let inKeywordsSection = false;
    let currentKeyword = null;

    for (let line of lines) {
      const trimmedLine = line.trim();
      
      // Detect Keywords section
      if (trimmedLine.startsWith('*** Keywords ***')) {
        inKeywordsSection = true;
        continue;
      } else if (trimmedLine.startsWith('***')) {
        inKeywordsSection = false;
        continue;
      }

      if (!inKeywordsSection) continue;

      // Detect start of a new keyword (non-indented line)
      if (line.length > 0 && !line.startsWith(' ') && !line.startsWith('\t')) {
        if (currentKeyword) {
          keywords.push(currentKeyword);
        }
        currentKeyword = {
          name: trimmedLine,
          args: [],
          body: ''
        };
      } else if (currentKeyword && trimmedLine.length > 0) {
        // Indented line - part of current keyword
        if (trimmedLine.startsWith('[Arguments]')) {
          currentKeyword.args = trimmedLine.replace('[Arguments]', '').trim().split(/\s{2,}/).filter(a => a.length > 0);
        }
        currentKeyword.body += line + '\n';
      }
    }

    if (currentKeyword) {
      keywords.push(currentKeyword);
    }

    return keywords;
  }

  /**
   * Appends a new keyword to the content.
   * @param {string} content - Original file content.
   * @param {string} keywordName - Name of the new keyword.
   * @param {string[]} args - Arguments for the keyword.
   * @param {string} body - The steps of the keyword (should be pre-indented).
   * @returns {string} Updated content.
   */
  static addKeyword(content, keywordName, args = [], body = '') {
    let updatedContent = content;
    if (!content.includes('*** Keywords ***')) {
      updatedContent += '\n*** Keywords ***\n';
    }

    // Clean up body: remove redundant section headers if LLM included them
    const cleanBody = body.split('\n')
      .filter(line => !line.trim().startsWith('***'))
      .map(line => line.startsWith('    ') ? line : `    ${line}`)
      .join('\n');

    let newKeywordBlock = `\n${keywordName}\n`;
    if (args.length > 0) {
      newKeywordBlock += `    [Arguments]    ${args.join('    ')}\n`;
    }
    newKeywordBlock += cleanBody;
    if (!newKeywordBlock.endsWith('\n')) newKeywordBlock += '\n';

    return updatedContent.trimEnd() + '\n' + newKeywordBlock;
  }
}
