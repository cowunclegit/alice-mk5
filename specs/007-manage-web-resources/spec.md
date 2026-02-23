# Feature Specification: Web Resource Management Agent

**Feature Branch**: `007-manage-web-resources`  
**Created**: 2026-02-23  
**Status**: Draft  
**Input**: User description: "web resource 관리 agent -사용자가 resource 추가, 수정, 삭제 등 관리 요청이 오면 web resource 관리 agent가 수행되어야 한다 -기본적으로 web agent와 비슷한 동작을 하지만 web agent는 기존의 resource를 활용하는것에 중점을 두고 web resource 관리 agent는 기존의 resource에서 빠진부분 혹은 추가 수정할 부분을 검증 후 적용하는데 있다 -web resource 관리 agent는 사용자의 요청에 따라 해당 웹사이트 진입 후 dom 분석 및 ax tree 분석 후 요청에 따른 적절한 행동을 수행하고 검증하여 최종적으로 적절한 resource 파일에 키워드를 추가 수정 하는데 있다 -resource 파일은 도메인 기반으로 파일명을 관리하며 (www.naver.com -> naver.resource) manifests.json에 서비스명과 도메인 등 을 상세하게 작성하여 향후 web agent가 이 파일을 참조하여 적절한 resource 파일을 찾아 키워드 사용하는데 도움이 되게 한다"

## Clarifications

### Session 2026-02-23
- Q: How should the system authorize requests to modify resource files? → A: CLI-only: Only local authorized terminal sessions can trigger the agent.
- Q: How should the system handle situations where a resource file is manually deleted or moved? → A: Active Reconcile: Every time the management agent starts, scan the directory and sync the JSON.
- Q: What should the agent do if a requested keyword name already exists within the target domain resource? → A: Prompt: Pause and ask the user via CLI whether to overwrite, skip, or rename.
- Q: What is the structure of `manifests.json`? → A: Mapping: File path as key (e.g., `web/naver.resource`), value as an array of user-friendly domain aliases/terms.
- Q: Which selector strategy should be prioritized for generated keywords? → A: Semantic Heavy: Prioritize AXTree roles and accessible names (ARIA-based) for maximum stability.
- Q: How should keyword arguments be named? → A: Context-aware: Use the intent and element labels to derive descriptive names (e.g., ${search_query}).
- Q: How should manifest aliases be generated? → A: LLM Generated: The agent will brainstorm 3-5 relevant aliases based on page content and service identity to maximize discoverability.
- Q: Where should the domain-specific `.resource` files be stored? → A: Standard: `src/robots/resources/web/`.
- Q: Should the agent generate multi-step keywords for complex intents? → A: Plan & Compose: Group a logical sequence of interactions into a single high-level keyword (e.g., `Login To Naver`) to improve abstraction.
- Q: What happens if different resource files generate the same alias? → A: Unique Only: Aliases must be unique across the manifest. If a collision occurs, the agent should consider merging the resources into a single file.
- Q: How many times should the agent attempt to self-heal a failed keyword verification? → A: Standard: 2 retries (total 3 attempts) before reporting a permanent verification failure.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create New Resource Keyword (Priority: P1)

As a developer or power user, I want the agent to automatically generate and save a new Robot Framework keyword for a specific web action (e.g., "Login to Naver") by analyzing the live page, so that I can expand the automation library without writing code manually.

**Why this priority**: This is the core value proposition—automating the expansion of the agent's capabilities.

**Independent Test**: Request the agent to "Create a keyword to search on Naver". The agent should navigate to Naver, identify the search box, create a valid `Search Naver` keyword, verify it works by running it, and save it to `naver.resource`.

**Acceptance Scenarios**:

1. **Given** a request to add a new action for a specific website, **When** the agent processes the request, **Then** it navigates to the site, analyzes the DOM/AXTree, and generates a candidate keyword.
2. **Given** a generated candidate keyword, **When** the verification step runs, **Then** the agent executes the keyword in the browser to confirm it succeeds.
3. **Given** a verified keyword, **When** the task completes, **Then** the keyword is appended to the correct domain-specific `.resource` file (creating it if missing).

---

### User Story 2 - Maintain Resource Manifest (Priority: P2)

As a system, I want a centralized registry (`manifests.json`) that maps services and domains to their resource files, so that the Web Agent can efficiently locate and load the correct tools for any given task.

**Why this priority**: Essential for the Web Agent to discover and utilize the resources created by this management agent.

**Independent Test**: Add a resource for a new domain (e.g., `google.com`). Verify that `manifests.json` is updated with an entry linking "Google" and "google.com" to `google.resource`.

**Acceptance Scenarios**:

1. **Given** a new resource file is created (e.g., `google.resource`), **When** the process finishes, **Then** `manifests.json` is updated with the service name, domain, and file path.
2. **Given** an existing resource file, **When** a keyword is updated, **Then** the manifest remains consistent (or updates metadata if changed).

---

### User Story 3 - Update/Fix Existing Resource (Priority: P3)

As a user, I want the agent to repair or modify an existing keyword that is no longer working due to UI changes, so that the automation library remains reliable over time.

**Why this priority**: Ensures long-term maintenance, though creation (P1) is needed first to have something to maintain.

**Independent Test**: Manually break a selector in `naver.resource`. Ask the agent to "Fix the Naver search keyword". The agent should identify the failure, find the new correct selector, and update the file.

**Acceptance Scenarios**:

1. **Given** a request to fix a broken keyword, **When** the agent analyzes the page, **Then** it identifies the correct new selectors and updates the existing keyword implementation in the file.

### Edge Cases

- **Verification Failure**: If the generated keyword fails during verification, the agent should retry generation (up to a limit) before giving up, rather than saving broken code.
- **Ambiguous Domain**: If the URL maps to a generic domain (e.g., `aws.amazon.com` vs `amazon.com`), the agent should intelligently decide whether to create a new resource or append to the main one (defaulting to the main domain).
- **Duplicate Keywords**: If a keyword with the same name already exists, the agent should ask for confirmation or auto-version it (e.g., `Search Naver V2`) to avoid overwriting without intent.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST be implemented using **Node.js and JavaScript (ESM)** only.
- **FR-002**: Agents MUST utilize **LangGraph.js** for stateful orchestration.
- **FR-003**: Automation and side effects MUST be implemented via **Robot Framework**.
- **FR-004**: Implementation MUST follow **TDD** (Tests written and failing before code).
- **FR-005**: The agent MUST utilize **DOM Analysis** and **AXTree** snapshots, prioritizing semantic attributes (role, name, ARIA) to generate stable selectors for keywords.
- **FR-006**: The agent MUST implement a **Verification Loop** that executes the generated Robot Framework code against the live browser session to confirm success BEFORE saving to disk. If verification fails, the agent MUST attempt to self-heal (re-analyze and re-generate) up to 2 times (3 total attempts).
- **FR-007**: Resources MUST be stored in domain-specific files within `src/robots/resources/web/` (naming convention: `domain-name.resource`, e.g., `naver.resource` for `www.naver.com`).
- **FR-008**: The agent MUST maintain a `manifests.json` registry file mapping resource file paths (as IDs) to arrays of LLM-generated aliases, domain terms, and service names.
- **FR-009**: The agent MUST support three core intents: `Add Keyword`, `Update Keyword`, and `Delete Keyword`.
- **FR-010**: Generated Robot Framework keywords MUST follow project conventions (proper indentation, `[Arguments]`, `[Documentation]`) and use context-aware argument naming.
- **FR-011**: System MUST authorize modifications ONLY via local CLI sessions, leveraging OS-level file permissions.
- **FR-012**: The agent MUST perform an Active Reconciliation of `manifests.json` upon startup by scanning the resource directory to ensure data integrity.
- **FR-013**: In case of keyword naming conflicts, the system MUST prompt the user for action (Overwrite, Rename, or Skip) before modifying the file.
- **FR-014**: For high-level user intents (e.g., 'Login'), the agent MUST be capable of planning and composing a multi-step Robot Framework keyword sequence.
- **FR-015**: The agent MUST ensure aliases in `manifests.json` remain unique across the entire registry. In the event of a naming collision, the agent MUST propose merging the related resource files to maintain a single domain-centric source of truth.

### Key Entities

- **Resource File**: A `.resource` file (Robot Framework format) containing reusable keywords for a specific web domain.
- **Manifest Registry**: A JSON file (`manifests.json`) acting as a dictionary where keys are resource paths and values are alias lists.
- **Candidate Keyword**: A temporary, in-memory representation of a Robot keyword being generated and verified.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of newly created keywords are verified by execution before being committed to the file system.
- **SC-002**: `manifests.json` is updated immediately upon successful agent-driven keyword creation, modification, or deletion.
- **SC-003**: Agent successfully generates a working selector for standard interactive elements (buttons, inputs, links) in 90% of attempts on the first try.
- **SC-004**: Generated resource files are syntactically valid Robot Framework code (pass execution without syntax errors).

## Assumptions

- System operates in a trusted local development environment where CLI access implies authorization.
- Remote agents will not have direct write access to the resource directory.
