# Feature Specification: Robot Automation Agent

**Feature Branch**: `001-robot-automation-agent`  
**Created**: 2026-02-18  
**Status**: Draft  
**Input**: User description: "자동화 동작을 하는 agent를 만들거야 robot framework으로 headless=false로 아래와 같은 robot 들을 만들어서 사용자 요청을 분석하여 agent가 조합하여 동작을 시키게 할거야 robot에 명령 인자를 전달하여 동작하도록 하자 1.브라우저 열기 2.특정 url 접속 3.특정 element 확인(wait) 4.특정 element 동작(click, typing 등) 5.로그인 6.데이터 추출 및 저장 7.기타 등등 추가로 필요한 robot 사용자의 의도대로 동작이 되면 (사용자에게 동작 확인을 물어보자) agent가 구성한 robot들의 동작 순서를 기록하여 재사용 가능한 robot sequence를 만들어 툴처럼 쓰고 싶어"

## Clarifications

### Session 2026-02-18
- Q: How should the system handle and store sensitive credentials for the 'Login' robot? → A: Local Encrypted Vault: Store credentials in a local encrypted file or use system environment variables.
- Q: How should the real-time progress of Robot Framework actions be displayed to the user? → A: Step-by-Step Live Log: Display each Robot keyword and its status in the CLI as it executes.
- Q: If a sequence fails or doesn't meet the user's goal after the first run, how should the agent proceed? → A: Auto-Correct: Agent analyzes the error or user's feedback and generates a revised sequence to try again.
- Q: How should the system handle updates or changes to existing saved sequences? → A: Versioned Overwrite: Allow updating a sequence by name, keeping a version history or simple timestamped backup.
- Q: Should the agent support managing multiple browser tabs or windows within a single sequence? → A: Single Active Tab: Agent operates on only one active tab/window at a time (standard web flow).
- Q: Which LLM provider/model should be the default for orchestration? → A: Custom LangChain BaseChatModel wrapping Gemini 2.0 Flash REST API (Free Tier).
- Q: What granularity should be used for sequence persistence? → A: Low-level Robot Keywords: Store exact keywords, selectors, and parameters for fidelity and speed.
- Q: What format should be used for default data extraction and storage? → A: JSON: Structured, native to JS, and natively supports nesting.
- Q: Should the system support parallel execution of agents/sequences? → A: Sequential Only: One agent/sequence at a time to avoid browser/state contention.
- Q: How should saved "robot sequences" (tools) be stored for portability? → A: Individual Files: Each sequence is a separate .json file in a dedicated folder.
- Q: Which Robot Framework library should be the primary choice for web automation? → A: Browser Library: Modern, Playwright-powered, faster, and more robust.
- Q: How should the system handle failures during the execution of a saved sequence (tool)? → A: Trigger Auto-Correction: Agent analyzes the failure and attempts to find a new way to achieve the tool's goal.
- Q: Should the browser session persist between different independent user requests? → A: Persistent Session: Browser stays open or state is saved between independent user requests.
- Q: How should Robot Framework HTML logs and reports be handled? → A: Persistent Logs: Save HTML reports in a dedicated logs/ folder and show the link in CLI.
- Q: Should the system generate documentation for saved sequences? → A: Auto-Doc: Agent generates a 1-sentence description based on the intent and actions.
- Q: What is the target latency for the agent to generate and begin executing the first Robot action? → A: Relaxed: < 30 seconds (Acceptable for multi-step background tasks).
- Q: How should the system handle unexpected browser-native alerts or permission pop-ups during execution? → A: Interactive Pause: Stop and wait for the user to manually handle the alert in the visible browser.
- Q: Where should extracted data files be stored relative to the project root? → A: Dedicated Directory: Store in src/memory/data/ with timestamped filenames.
- Q: Should the agent be limited to core keywords or can it utilize the full Browser Library? → A: Full Browser Library: Grant access to all Browser Library keywords.
- Q: How should the system handle encountering a Captcha or advanced bot protection? → A: Manual Bypass: Pause execution and alert the user to solve the Captcha in the visible browser.
- Q: Which browser engine should the system use by default for automation? → A: Chromium (Google Chrome compatible).
- Q: How should the system manage the lifecycle of the browser instance between tasks? → A: Auto-Cleanup: Close browser and clean temp data on agent exit.
- Q: What should be the primary naming convention for the saved sequence (tool) JSON files? → A: Lowercase Kebab-Case: `get-google-search.json`.
- Q: How should the user provide confirmation or feedback to the agent? → A: CLI Text: User types response in terminal. Confirmation is only required during dynamic sequence generation or when the agent is uncertain; once a sequence is verified and saved as a "tool", it executes without further prompts.
- Q: How should the system sanitize or encode arguments passed to the Robot Framework? → A: Variable File: Pass arguments via a temporary JSON variable file for maximum safety; saved "tools" will store these arguments in a static JSON format within the sequence file.
- Q: Should the agent present the planned sequence of robot actions for user approval before starting execution? → A: Plan Approval Required: Show the sequence and wait for "Yes/No" before execution.
- Q: How should the system handle a manual user interrupt during the middle of a Robot Framework sequence? → A: Immediate Halt: Stop all Robot actions and clean up resources instantly.
- Q: Should each saved sequence JSON include metadata about the "Original Prompt" and "Success Date" inside the file? → A: Full Metadata: Store prompt, timestamp, and success status inside the JSON.
- Q: Which selector strategy should the agent prioritize when mapping natural language to Robot actions? → A: ID/CSS > Text: Prioritize stable technical attributes for robustness.
- Q: What should be the retention policy for the generated Robot Framework execution logs? → A: Rolling (Last N): Automatically delete oldest logs once a limit is reached, with a user-configurable limit option.
- Q: How should the agent decide whether to trigger auto-correction if the Robot script completes without technical errors? → A: LLM Validation: Agent self-evaluates outcome against intent.
- Q: What should be the maximum number of consecutive auto-correction (retry) attempts allowed? → A: Extended: 5 Retries.
- Q: Should the agent support combining and orchestrating multiple saved "tools" (sequences) in a single workflow? → A: Tool Chaining: Agent can call multiple saved tools in order.
- Q: Should the agent support providing CLI feedback and sequence descriptions in Korean? → A: Bilingual: Technical=English, User-facing=Korean.
- Q: Should the system implement a configurable delay between individual Robot actions? → A: Randomized Delay: 0.5s - 2s delay between actions.
- Q: How should the system store and manage user configurations and environment secrets? → A: Centralized YAML: Store all secrets and settings in a single config.yaml file.
- Q: Should the system support loading user-defined custom keyword files (.resource)? → A: Yes: Load custom keywords from a resources directory.
- Q: Should the system support different levels of CLI verbosity? → A: Yes: Support multiple verbosity levels (e.g., info, debug, quiet) via configuration.
- Q: Should the agent always present its "internal reasoning" for a failure before suggesting a fix? → A: Yes: Present reasoning + proposed fix for transparency.
- Q: Should the system support mapping and passing outputs from one Robot action as inputs to a subsequent Robot action? → A: Yes: Support output-to-input mapping within a sequence.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dynamic Web Task Execution (Priority: P1)

As a user, I want to provide a natural language description of a web-based task so that the agent can automatically perform the necessary actions on my behalf.

**Why this priority**: This is the core functionality that enables automation from natural language.

**Independent Test**: Provide a prompt like "Go to google.com and search for 'Robot Framework'". The agent should open a visible browser, navigate, and perform the search.

**Acceptance Scenarios**:

1. **Given** the agent is idle, **When** a user asks to "Open https://example.com and click the login button", **Then** the agent should identify and execute the 'Open Browser', 'Navigate URL', and 'Click Element' robots.
2. **Given** a visible browser is required, **When** any robot task is executed, **Then** the browser window must be visible (`headless=false`).

---

### User Story 2 - User Confirmation & Sequence Recording (Priority: P2)

As a user, I want to verify if the agent's automated actions met my expectations so that I can save successful workflows for future use.

**Why this priority**: This enables the creation of a library of reliable automation tools derived from real-world successes.

**Independent Test**: After a successful task execution, the agent should prompt "Did this meet your goal?". If the user says "Yes", a sequence file should be created.

**Acceptance Scenarios**:

1. **Given** the agent has finished a task, **When** the agent asks for confirmation, **Then** it should wait for user input.
2. **Given** a user confirms success, **When** saving the sequence, **Then** all steps, parameters, and order must be recorded in a persistent format.

---

### User Story 3 - Reusable Sequence Execution (Priority: P3)

As a user, I want to trigger a previously saved sequence by name so that I can repeat common tasks without re-explaining them to the agent.

**Why this priority**: Provides efficiency and reliability for recurring tasks.

**Independent Test**: Invoke a saved sequence by name. The agent should execute the exact recorded steps without re-analyzing the intent.

**Acceptance Scenarios**:

1. **Given** a saved sequence exists, **When** the user requests its execution, **Then** the agent should load and run the robots in the exact recorded order.

---

### Edge Cases

- **Robot Failure**: What happens if an element is not found during a sequence? (System should notify the user and provide the current state for debugging).
- **Ambiguous Request**: What happens if the user's intent matches multiple robot combinations? (Agent should ask for clarification).
- **Incomplete Parameters**: What happens if a robot requires an argument (e.g., a URL) that wasn't provided? (Agent should ask the user for the missing data).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST be implemented using **Node.js and JavaScript (ESM)** only.
- **FR-002**: Agents MUST utilize **LangGraph.js** for stateful orchestration.
- **FR-003**: Automation and side effects MUST be implemented via **Robot Framework**.
- **FR-004**: Implementation MUST follow **TDD** (Tests written and failing before code).
- **FR-005**: System MUST decompose natural language requests into a sequence of atomic Robot Framework actions.
- **FR-006**: System MUST support the following core robots with parameter passing:
    - Open Browser (visible/non-headless)
    - Navigate to URL
    - Wait for Element
    - Interact with Element (Click, Type)
    - Login
    - Data Extraction & Storage
- **FR-007**: System MUST prompt for user confirmation via CLI text input after a **dynamic** execution sequence completes or when intent is ambiguous; verified and saved "tools" MUST execute without further confirmation unless a failure occurs.
- **FR-008**: System MUST persist successful robot sequences, including all parameters and execution order.
- **FR-009**: System MUST support execution of saved sequences as "tools" by name.
- **FR-010**: System MUST securely manage 'Login' credentials using a local encrypted vault or system environment variables (credentials MUST NOT be stored in sequence files).
- **FR-011**: System MUST display real-time progress in the CLI, showing each Robot keyword and its execution status as it occurs.
- **FR-012**: System MUST implement an auto-correction loop where the agent analyzes execution failures or negative user feedback to autonomously revise and retry the sequence.
- **FR-013**: System MUST support versioning for saved sequences, allowing updates by name while maintaining a timestamped backup or version history.
- **FR-014**: System MUST operate on a single active browser tab or window at a time to maintain state consistency within the LangGraph orchestrator.
- **FR-015**: System MUST implement a custom LangChain `BaseChatModel` to interface with the Gemini 2.0 Flash REST API for all agent orchestration and reasoning tasks.
- **FR-016**: Persistent sequences MUST be stored at the keyword and selector level to ensure deterministic execution when used as tools.
- **FR-017**: Extracted data MUST be stored in JSON format by default to ensure ease of parsing within the Node.js environment.
- **FR-018**: System MUST execute agents and sequences sequentially to avoid browser resource contention and ensure state integrity.
- **FR-019**: System MUST store each saved robot sequence as an individual JSON file using lowercase kebab-case naming (e.g., `my-tool-name.json`) within a dedicated directory (e.g., `src/memory/sequences/`) to ensure portability and ease of management.
- **FR-020**: System MUST utilize the **Robot Framework Browser Library** (Playwright-based) with **Chromium** (Google Chrome compatible) as the primary default engine for all web-based automation tasks.
- **FR-021**: If a saved sequence (tool) fails, the system MUST automatically trigger the auto-correction loop (FR-012) to attempt recovery and achieve the original intent.
- **FR-022**: System MUST maintain browser session persistence (cookies, storage, etc.) across independent user requests to allow multi-request workflows.
- **FR-023**: System MUST persist Robot Framework execution logs (HTML/XML) in a dedicated `logs/` directory and provide a reference link in the CLI output.
- **FR-024**: System MUST automatically generate a concise, human-readable description for each saved sequence to aid in future discovery and reuse.
- **FR-025**: System MUST pause execution and wait for manual user intervention when an unexpected browser-native alert or permission pop-up is encountered.
- **FR-026**: System MUST store extracted data files in a dedicated directory (`src/memory/data/`) using timestamped filenames by default.
- **FR-027**: The agent MUST have access to the full suite of keywords provided by the **Robot Framework Browser Library** to handle complex web interactions beyond the core set defined in FR-006.
- **FR-028**: System MUST pause and notify the user to perform manual intervention (e.g., solving a Captcha or bypassing bot protection) when such obstacles are detected in the visible browser.
- **FR-029**: System MUST ensure that the browser instance and all associated temporary automation data are automatically closed and cleaned up when the agent process terminates.
- **FR-030**: System MUST pass arguments to the Robot Framework via a temporary JSON variable file to ensure data integrity and prevent shell injection or syntax errors; saved tool sequences MUST persist these arguments in their static JSON definition.
- **FR-031**: System MUST present the proposed sequence of robot actions for user approval via the CLI before beginning any execution in the visible browser.
- **FR-032**: System MUST support immediate termination of all Robot Framework processes and associated browser instances upon receiving a manual user interrupt signal (e.g., Ctrl+C).
- **FR-033**: Every saved robot sequence MUST include comprehensive metadata within its JSON file, including the original user prompt, timestamp of creation/success, and a brief description of the intended outcome.
- **FR-034**: The agent MUST prioritize stable selectors (e.g., ID, Data-Test-ID, unique CSS) over volatile attributes (e.g., absolute XPath, styling classes) when generating robot actions to ensure long-term tool reliability.
- **FR-035**: System MUST implement a rolling retention policy for execution logs, automatically deleting the oldest entries when a limit is reached; this limit MUST be user-configurable via system settings.
- **FR-036**: System MUST implement a self-evaluation step where the agent utilizes the LLM to validate the execution results (logs and extracted data) against the original user intent, even if the Robot script technically passes without errors.
- **FR-037**: System MUST enforce a maximum limit of 5 consecutive auto-correction (retry) attempts per user request; once this limit is reached, the system MUST pause and request manual intervention from the user.
- **FR-038**: System MUST support sequential tool chaining, allowing the agent to orchestrate and execute multiple saved sequences ("tools") within a single high-level workflow to fulfill complex user requests.
- **FR-039**: System MUST support bilingual operation where all technical artifacts (Robot Framework keywords/logs) are in English, while all user-facing descriptions, CLI prompts, and generated documentation are in Korean.
- **FR-040**: System MUST implement a randomized delay (range: 0.5s - 2.0s) between individual robot actions to simulate human interaction and improve resilience against automated bot detection systems.
- **FR-041**: System MUST utilize a centralized `config.yaml` file to manage all user configurations, operational settings, and environment secrets (e.g., API keys, log retention limits).
- **FR-042**: System MUST support the loading and utilization of user-defined custom Robot Framework resource files (`.resource`) from a dedicated directory to extend the agent's keyword capabilities.
- **FR-043**: System MUST support user-configurable CLI verbosity levels (e.g., `info`, `debug`, `quiet`) to control the amount of execution detail displayed in the terminal.
- **FR-044**: System MUST ensure that the agent provides a clear explanation of detected failures and its proposed corrective actions before triggering the auto-correction loop.
- **FR-045**: System MUST support dynamic mapping and passing of outputs (e.g., return values, extracted text) from one Robot action as inputs to subsequent actions within the same sequence.

### Key Entities

- **Robot Action**: Represents a single atomic operation (e.g., Click) with its associated arguments.
- **Sequence**: A ordered list of Robot Actions that constitutes a complete workflow.
- **Agent State**: The current progress of the LangGraph execution, including the browser state and task history.

## Assumptions

- **Data Persistence**: Extracted data and saved sequences are assumed to be stored in the local file system (e.g., JSON or CSV format) unless a database is specified.
- **Sequence Identification**: Users will provide a unique name when saving a sequence; if none is provided, the system will generate a timestamp-based name.
- **Browser Environment**: The automation environment is assumed to have a compatible browser and WebDriver installed for non-headless execution.
- **User Confirmation**: Confirmations are expected to be simple binary (Yes/No) or short textual responses.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The agent correctly maps 90% of standard web interactions (click, type, navigate) from natural language to the correct Robot Framework keywords.
- **SC-002**: Users can confirm and save a sequence within 2 interactions after the task is completed.
- **SC-003**: Saved sequences execute with 100% fidelity to the originally recorded steps.
- **SC-004**: All browser-based actions are visible to the user (non-headless) for transparency.
- **SC-005**: Agent begins first Robot action within 30 seconds of user prompt.
