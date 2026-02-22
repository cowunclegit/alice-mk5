import readline from 'readline/promises';
import { AnalysisService } from '../../../services/analysis_service.js';
import { ResourceService } from '../../../services/resource_service.js';
import { RobotParser } from '../../../lib/robot_parser.js';
import { extractAndParseJSON } from '../../../lib/json_utils.js';
import { RobotBridge } from '../../../services/robot_bridge.js';
import { BrowserService } from '../../../services/browser_service.js';
import fs from 'fs/promises';
import path from 'path';

export const resourceAgent = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  await logger.info('ResourceAgent: Starting deep exploration for verified resource creation...');

  try {
    // 1. Initial Site Access
    const urlMatch = state.input.match(/https?:\/\/[^\s\)]+/);
    const targetUrl = urlMatch ? urlMatch[0] : 'https://www.naver.com';
    
    await logger.info(`ResourceAgent: Accessing ${targetUrl} to analyze structure...`);
    await RobotBridge.runKeyword('Open Visible Browser', [targetUrl], state.sessionId, ['web/core.resource'], logger, 'RESOURCES-INIT');
    
    // Add explicit wait for dynamic content
    await logger.info('ResourceAgent: Waiting 5s for dynamic content to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 2. Capture and Analyze DOM
    await logger.info('ResourceAgent: Capturing page source for element analysis...');
    const captureResult = await RobotBridge.runKeyword('Capture DOM Source', ['analysis.html'], state.sessionId, ['web/core.resource'], logger, 'RESOURCES-DOM');
    
    const html = await fs.readFile(captureResult.savedFilePath, 'utf8');
    const prunedHtml = AnalysisService.pruneDOM(html);
    const elements = AnalysisService.extractInteractiveElements(prunedHtml);

    // 3. Synthesis - Find working selector and steps based on ACTUAL DOM
    const synthesisPrompt = `You are a Robot Framework Expert and Web Scraper.
Based on the ACTUAL elements found on the page, create a keyword to fulfill the intent.

### USER INTENT:
${state.input}

### TARGET URL:
${targetUrl}

### ACTUAL ELEMENTS ON PAGE (TOP 100):
${JSON.stringify(elements, null, 2)}

### RULES:
1. **GROUPING RULE: PRIORITIZE existing resource files.** If the intent is related to a domain already present in AVAILABLE RESOURCES (e.g., 'Naver'), you MUST add the keyword to that file instead of creating a new one.
2. Choose the most stable selector from the ACTUAL ELEMENTS provided. 
3. Prefer ID > Class > Path.
4. **STORAGE RULE**: Only create new files in 'src/robots/resources/custom/' if no relevant domain-specific resource exists.
5. ROBOT SYNTAX: 
   - Provide ONLY the steps for the keyword body. 
   - DO NOT include '*** Keywords ***' or '*** Settings ***' headers.
   - Use 'Get Text' to fetch text first, THEN use 'Evaluate' for Python-based processing.
   - Indent steps with 4 spaces.
6. Respond ONLY with a JSON object:
{
  "action": "add | create",
  "targetFile": "relative/path/to/existing_or_new_file.resource",
  "keywordName": "Clear Name",
  "arguments": [],
  "body": "Robot Framework steps (\\n separated)",
  "synonyms": ["alias 1"],
  "reasoning": "Why this file was chosen for grouping"
}
`;

    const synthesisResponse = await model.invoke([
      { role: 'system', content: synthesisPrompt },
      { role: 'user', content: "Synthesize the keyword using the provided DOM elements." }
    ]);

    const proposal = extractAndParseJSON(synthesisResponse.content);
    
    // 4. 경로 및 보안 체크
    let targetRelativePath = proposal.targetFile;
    
    // Normalize: Remove 'src/robots/resources/' prefix if present
    targetRelativePath = targetRelativePath.replace(/^src\/robots\/resources\//, '');

    // Check if the file exists ANYWHERE in the resources directory
    const resources = await ResourceService.indexResources();
    const existingResource = resources.find(r => r.relativePath.endsWith(targetRelativePath) || path.basename(r.relativePath) === path.basename(targetRelativePath));

    if (existingResource) {
      // 1. Existing file found - respect its path (unless it's core.resource)
      if (existingResource.isCore) {
        proposal.targetFile = `src/robots/resources/custom/verified_actions.resource`;
        await logger.warn(`ResourceAgent: Modification of core resource ${existingResource.relativePath} redirected to custom.`);
      } else {
        proposal.targetFile = existingResource.filePath; // Use full absolute path
        await logger.info(`ResourceAgent: Targeting existing resource at ${existingResource.relativePath}`);
      }
    } else {
      // 2. New file - ensure it goes to custom/
      const fileName = path.basename(targetRelativePath);
      proposal.targetFile = path.join(process.cwd(), 'src/robots/resources/custom', fileName);
      await logger.info(`ResourceAgent: Redirecting new resource to ${proposal.targetFile}`);
    }

    const fullPath = proposal.targetFile;
    
    // 5. Proposed Change Display
    await logger.info(`\n--- VERIFIED RESOURCE PROPOSAL (BASED ON DOM ANALYSIS) ---`);
    await logger.info(`Action: ${proposal.action.toUpperCase()}`);
    await logger.info(`Target: ${proposal.targetFile}`);
    await logger.info(`Keyword: ${proposal.keywordName}`);
    await logger.info(`Body:\n${proposal.body.replace(/\\n/g, '\n')}`);
    await logger.info(`--------------------------------\n`);

    const answer = await rl.question(`Save this verified resource? (y/n): `);
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      await logger.warn('ResourceAgent: Aborted by user.');
      rl.close();
      return { status: 'finished' };
    }

    // 5. Save and Validate (기존 로직)
    const dirExists = await fs.access(path.dirname(fullPath)).then(() => true).catch(() => false);
    if (!dirExists) await fs.mkdir(path.dirname(fullPath), { recursive: true });

    const exists = await fs.access(fullPath).then(() => true).catch(() => false);
    let updatedContent = exists ? await fs.readFile(fullPath, 'utf8') : '*** Keywords ***\n';
    updatedContent = RobotParser.addKeyword(updatedContent, proposal.keywordName, proposal.arguments, proposal.body.replace(/\\n/g, '\n'));
    
    await fs.writeFile(fullPath, updatedContent);

    // Dry-run validation
    try {
      await logger.info('ResourceAgent: Final syntax check via robot --dryrun...');
      await ResourceService.validateResource(fullPath);
      await logger.info('ResourceAgent: Validation successful.');
    } catch (validationError) {
      await logger.error(`ResourceAgent: Validation FAILED.\n${validationError.message}`);
      await logger.info('ResourceAgent: Rolling back changes...');
      if (backupPath) {
        await fs.copyFile(backupPath, fullPath);
      } else if (!exists) {
        await fs.unlink(fullPath);
      }
      rl.close();
      return { status: 'error', reasoning: `Syntax validation failed: ${validationError.message}` };
    }

    // 9. 매니페스트 업데이트
    const synonyms = Array.from(new Set([
      proposal.keywordName,
      ...(proposal.synonyms || [])
    ]));

    await ResourceService.updateManifest(fullPath, synonyms);
    await logger.info('ResourceAgent: Synonyms updated in manifests.json');

    rl.close();
    return {
      status: 'finished',
      reasoning: `SUCCESS: A new verified Robot Framework keyword "${proposal.keywordName}" has been successfully added to "${proposal.targetFile}". The system can now understand intents like: ${proposal.synonyms.join(', ')}.`
    };

  } catch (error) {
    await logger.error(`ResourceAgent Error: ${error.message}`);
    if (rl) rl.close();
    return { status: 'error', reasoning: error.message };
  }
};
