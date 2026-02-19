# Data Model: Application Automation Support

## Entities

### SubAgent
- **Description**: A specialized LangGraph instance for a specific platform.
- **Attributes**:
    - `id`: Unique identifier (`web`, `application`).
    - `type`: Platform type.
    - `capabilities`: List of supported actions/keywords.

### AppiumCapability
- **Description**: Parameters required to initialize an Appium session for a specific application.
- **Attributes**:
    - `platformName`: `Windows` or `macOS`.
    - `app`: Path to executable or Bundle ID.
    - `deviceName`: Host identifier.
    - `automationName`: `Windows` (WinAppDriver) or `Mac2`.

### ApplicationSequence (Tool)
- **Description**: A saved set of Appium-based Robot Framework actions.
- **Attributes**:
    - `id`: Kebab-case name of the tool.
    - `platform`: `application`.
    - `actions`: List of Robot Keyword calls.
    - `metadata`: Original prompt, timestamp, target app info.

### RegistryEntry
- **Description**: Information about an installed application discovered by the Registry Tool.
- **Attributes**:
    - `name`: User-friendly application name.
    - `identifier`: Bundle ID (macOS) or EXE name/path (Windows).
    - `path`: Full filesystem path to the application.

## State Transitions (Manager Graph)

1. **IDLE**: Waiting for user input.
2. **DECOMPOSING**: LLM splits prompt into tasks (e.g., `[WebTask, AppTask]`).
3. **ROUTING**: Selects sub-graph for the current task.
4. **SUB_EXECUTION**: Sub-graph runs its own cycle.
5. **AGGREGATING**: Manager collects results and data from sub-graph.
6. **FINISHED**: Returns final response or prompts for tool saving.
