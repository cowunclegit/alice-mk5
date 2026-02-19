# Feature Specification: Application Automation Support

**Feature Branch**: `002-app-automation-support`  
**Created**: 2026-02-19  
**Status**: Draft  
**Input**: User description: "현재 웹기반의 tool_making만 지원하는데 이제 Application도 지원해야해 Appium 라이브러리를 사용할거고 agent workflow는 유사하게 가져가는데 폴더 구조 자체를 web, application 으로 구분지어서 web, application을 각각 sub agent처럼 만들자"

## Clarifications

### Session 2026-02-19
- Q: How should the system automatically detect whether a user prompt refers to a web or application task and route to the corresponding sub-agent? → A: Keyword Heuristics + LLM Classification using a router node.
- Q: How should the system acquire the Appium Capability information required for application control? → A: Registry Tool: Automatically discover installed app info (paths, IDs) via OS-level commands.
- Q: How should the 'sub-agent' structure be implemented within the workflow? → A: Nested Sub-Graphs: The main graph calls either a 'Web Sub-Graph' or an 'Application Sub-Graph' as a specialized node.
- Q: How should saved sequences (tools) be stored to separate platforms? → A: Unified Tool Registry with Sub-folders: Use a central sequences directory with `web/` and `application/` sub-folders.
- Q: How should the system handle mixed requests (e.g., "search Web and save to App")? → A: Decomposition & Sequential Orchestration (B+): The Manager graph decomposes the request into platform-specific tasks and calls sub-graphs in sequence, passing data between them.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Automation Tool for Mobile Application (Priority: P1)

As a user, I want to provide a natural language description of a task in a mobile application so that the agent can automatically generate and execute a sequence of actions using Appium.

**Why this priority**: This is the core expansion from web-only to multi-platform automation, enabling the main value proposition of the feature.

**Independent Test**: Provide a prompt like "Open the 'Calculator' app and add 5 and 7". The system should identify it as an application task, use the Application Sub-Agent, and successfully perform the calculation.

**Acceptance Scenarios**:

1. **Given** the agent is in "tool making" mode, **When** a user requests a task for a mobile app, **Then** the system MUST route the request to the Application Sub-Agent.
2. **Given** an Application Sub-Agent, **When** analyzing the app UI, **Then** it MUST identify technical selectors (IDs, XPaths) suitable for Appium.

---

### User Story 2 - Unified Orchestration with Platform-Specific Sub-Agents (Priority: P2)

As a system operator, I want the agent architecture to be split into 'web' and 'application' sub-agents with a shared workflow so that the codebase is modular and extensible for different automation types.

**Why this priority**: Ensures maintainability and aligns with the requested architectural pattern.

**Independent Test**: Verify that files related to web automation and application automation are stored in separate, platform-specific directory structures.

**Acceptance Scenarios**:

1. **Given** a new automation request, **When** the workflow begins, **Then** the system MUST select the appropriate sub-agent based on the detected target platform.
2. **Given** the project structure, **When** browsing source code, **Then** web-specific and application-specific logic MUST be clearly separated into `web` and `application` folders.

---

### User Story 3 - Reuse Application Automation Sequences (Priority: P3)

As a user, I want to save successful application automation sequences as "tools" so that I can execute them later by name without re-analyzing the intent.

**Why this priority**: Brings the "tool making" capability of the web agent to the application domain.

**Independent Test**: Successfully execute a previously saved application sequence by name.

**Acceptance Scenarios**:

1. **Given** a verified application sequence exists, **When** the user invokes it as a tool, **Then** it MUST execute the exact Appium steps recorded.

### Edge Cases

- **App Crash**: What happens if the target application crashes during the discovery or execution phase?
- **Ambiguous Platform**: How does the system respond if a user prompt doesn't clearly specify if they mean a web site or a native app?
- **Missing Capabilities**: How does the system handle cases where the required Appium capabilities (e.g., device name, platform version) are not provided or misconfigured?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST be implemented using **Node.js and JavaScript (ESM)** only.
- **FR-002**: Agents MUST utilize **LangGraph.js** for stateful orchestration.
- **FR-003**: Automation and side effects MUST be implemented via **Robot Framework** (using SeleniumLibrary for web and AppiumLibrary for applications).
- **FR-004**: Implementation MUST follow **TDD** (Tests written and failing before code).
- **FR-005**: System MUST implement a dual sub-agent architecture using **Nested Sub-Graphs** (Web Sub-Graph and Application Sub-Graph) managed by a central supervisor.
- **FR-006**: System MUST utilize a **Manager Graph (Router)** capable of decomposing natural language prompts into a sequence of platform-specific tasks and orchestrating their execution across different sub-graphs.
- **FR-012**: System MUST support **Data Passing** between sub-graphs, allowing output from a Web task (e.g., extracted text) to be used as input for an Application task.
- **FR-007**: The Application Sub-Agent MUST support **Desktop platforms (Windows and macOS)**.
- **FR-008**: System MUST support persistent storage of automation sequences in JSON format, using a unified registry with platform-specific sub-folders (`web/` and `application/`).
- **FR-009**: The system MUST connect to a pre-running Appium server at a configured URL (the agent is NOT responsible for server lifecycle management).
- **FR-010**: The Application Sub-Agent MUST capture and analyze the application **Page Source XML** to discover and identify UI elements and selectors.
- **FR-011**: System MUST implement a **Registry Tool** capable of discovering installed application metadata (executables, bundle IDs) via OS commands to populate Appium Capabilities.

### Key Entities

- **Sub-Agent**: A specialized agent (Web or Application) that handles platform-specific analysis and execution.
- **Registry Tool**: An OS-level utility used to discover and map user-friendly application names to technical identifiers.
- **Appium Capability**: A set of parameters (app path, bundle ID, platform name) derived from the Registry Tool or configuration.
- **Application Sequence**: An ordered list of Robot Framework keywords using AppiumLibrary.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The system correctly identifies and routes 95% of user prompts to the correct sub-agent (Web vs Application).
- **SC-002**: Application automation sequences execute with 100% fidelity to the recorded steps on the target device.
- **SC-003**: The time to generate the first application action from a natural language prompt is under 45 seconds.
- **SC-004**: 100% of sub-agent specific code is correctly located within its respective folder structure (`web/` or `application/`).
