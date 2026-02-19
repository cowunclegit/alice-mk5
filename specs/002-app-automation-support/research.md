# Research: Application Automation Support

## Decision: AppiumLibrary for Desktop Automation
- **Rationale**: Robot Framework's AppiumLibrary is the standard for mobile and desktop application automation. It supports WinAppDriver for Windows and Appium Mac2 Driver for macOS, aligning with the project's Robot Framework constraint.
- **Alternatives considered**: PyAutoGUI (too low-level, not Robot Framework native), FlaUI (C#-based, violates JS-only constraint).

## Decision: Nested Sub-Graphs for Modular Agents
- **Rationale**: LangGraph.js supports invoking sub-graphs as nodes. This allows the Web and Application agents to have their own specialized cycles (Analyze -> Execute -> Validate) while the Manager Graph handles high-level intent decomposition and routing.
- **Alternatives considered**: Single large graph with conditional branches (becomes too complex to maintain as more platforms are added).

## Decision: Registry Tool Implementation via OS-Specific Commands
- **Rationale**: 
    - **macOS**: Use `system_profiler SPApplicationsDataType` or `ls /Applications` to find `.app` bundles and their identifiers.
    - **Windows**: Use `Get-ItemProperty` in PowerShell to query the registry (`HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall`) for installed software and paths.
- **Alternatives considered**: Manual configuration (too much friction for users), Third-party libraries (avoid unnecessary dependencies).

## Decision: State-Based Data Passing
- **Rationale**: Use a shared "Manager State" that contains a `data_store` object. Sub-graphs return updates to this state, allowing the next sub-graph in the sequence to access outputs from previous steps.
- **Alternatives considered**: Direct output-to-input mapping (less flexible for complex multi-step sequences).

## Best Practices: Appium Desktop Automation
- **WinAppDriver (Windows)**: Requires Developer Mode enabled. Use `AccessibilityId` as the primary selector strategy for stability.
- **Appium Mac2 Driver (macOS)**: Requires Xcode and permissions for `Accessibility`. Use `accessibility id` or `xpath` (if necessary).
- **Session Persistence**: Like the Web agent, maintain a single Appium session per application task within a user session to avoid redundant app restarts.
