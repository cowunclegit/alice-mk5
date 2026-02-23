import { GeneratorService } from '../../src/services/generator_service.js';
import fs from 'fs/promises';
import path from 'path';

describe('GeneratorService', () => {
  const testDir = path.join(process.cwd(), 'tests', 'tmp_resources_gen');

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should generate a valid Robot keyword string', () => {
    const service = new GeneratorService(testDir);
    const code = service.generateKeyword(
      'Search for alice on Naver',
      'css:#query',
      ['alice']
    );

    expect(code).toContain('Search For Alice On Naver');
    expect(code).toContain('[Arguments]    ${arg1}');
    expect(code).toContain('Type Into Element    css:#query    ${arg1}');
  });

  it('should update a resource file with a new keyword', async () => {
    const service = new GeneratorService(testDir);
    const domain = 'naver';
    const keywordName = 'Search Naver';
    const content = '    Log    Hello';

    await service.updateResourceFile(domain, keywordName, content);

    const filePath = path.join(testDir, 'naver.resource');
    const fileContent = await fs.readFile(filePath, 'utf8');
    expect(fileContent).toContain('*** Keywords ***');
    expect(fileContent).toContain('Search Naver');
  });

  it('should replace an existing keyword', async () => {
    const service = new GeneratorService(testDir);
    const domain = 'naver';
    const filePath = path.join(testDir, 'naver.resource');
    
    await fs.writeFile(filePath, '*** Keywords ***\nOld Keyword\n    Noop\n');

    await service.updateResourceFile(domain, 'Old Keyword', '    Log    New');

    const fileContent = await fs.readFile(filePath, 'utf8');
    expect(fileContent).toContain('Log    New');
    expect(fileContent).not.toContain('Noop');
  });
});
