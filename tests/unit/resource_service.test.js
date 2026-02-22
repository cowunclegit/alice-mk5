import { ResourceService } from "../../src/services/resource_service.js";
import fs from "fs/promises";
import path from "path";

describe("ResourceService", () => {
  const testFile = path.join(process.cwd(), "src/robots/resources/test_backup.resource");

  beforeAll(async () => {
    await fs.writeFile(testFile, "*** Keywords ***\nTest\n    Log    Backup");
  });

  afterAll(async () => {
    await fs.unlink(testFile).catch(() => {});
    // Clean up backups dir
    await fs.rm(ResourceService.backupDir, { recursive: true, force: true }).catch(() => {});
  });

  it("should create a backup file", async () => {
    const backupPath = await ResourceService.createBackup(testFile);
    const exists = await fs.access(backupPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
    expect(backupPath).toContain(".bak");
  });

  it("should index resources", async () => {
    const index = await ResourceService.indexResources();
    expect(index.length).toBeGreaterThan(0);
    expect(index.some(r => r.filePath.includes("core.resource"))).toBe(true);
  });
});
