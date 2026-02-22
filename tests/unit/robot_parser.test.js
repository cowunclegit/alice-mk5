import { RobotParser } from "../../src/lib/robot_parser.js";

describe("RobotParser", () => {
  const content = "*** Settings ***\nResource    core.resource\n\n*** Keywords ***\nExisting Keyword\n    [Arguments]    ${arg1}\n    Log    ${arg1}\n";

  it("should parse keywords and their arguments", () => {
    const keywords = RobotParser.parseKeywords(content);
    expect(keywords.length).toBe(1);
    expect(keywords[0].name).toBe("Existing Keyword");
    expect(keywords[0].args).toEqual(["${arg1}"]);
  });

  it("should add a new keyword to existing content", () => {
    const updated = RobotParser.addKeyword(content, "New Keyword", ["${a}"], "Log    ${a}");
    expect(updated).toContain("New Keyword");
    expect(updated).toContain("[Arguments]    ${a}");
    expect(updated).toContain("Log    ${a}");
  });

  it("should create Keywords section if missing", () => {
    const emptyContent = "*** Settings ***\nLibrary    SeleniumLibrary";
    const updated = RobotParser.addKeyword(emptyContent, "New Keyword", [], "No Operation");
    expect(updated).toContain("*** Keywords ***");
    expect(updated).toContain("New Keyword");
  });
});
