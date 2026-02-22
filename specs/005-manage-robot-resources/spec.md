# Feature Specification: Robot Framework Resource Management Sub-Agent

**Feature Branch**: `005-manage-robot-resources`  
**Created**: 2026-02-21  
**Status**: Draft  
**Input**: User description: "agent 동작 후 도구 생성하는 것을 제거하고 도구 재사용 에이전트 동작을 제거하자 대신 robot framework용 resource를 추가, 수정 하는 sub agent를 추가하자 robot framework용 resource를 추가, 수정하는 기능은 최초 routing으로 분기하자"

## Clarifications

### Session 2026-02-21
- Q: 리소스 파일 탐색 방식 → A: 자동 스캐닝 (미리 정의된 `src/robots/resources/` 디렉토리 내의 파일을 에이전트가 자동으로 탐색).
- Q: 리소스 파일 수정 실패 시 복구 전략 → A: 자동 스냅샷 복구 및 보호 정책 (수정 전 백업 생성 및 복구 기능을 갖추되, `core.resource`는 수정이 불가능하도록 차단하고 오직 사용자 커스텀 리소스만 편집 허용).
- Q: 용어 및 동의어 관리 방식 → A: `src/robots/resources/manifests.json` 파일에서 유사어 및 동의어를 통합 관리하여 에이전트의 키워드 매핑 정확도 향상.
- Q: 초기 라우팅 판별 방식 → A: LLM 의도 분류 (`router` 노드에서 LLM을 사용하여 사용자 의도를 'automation' 또는 'resource_management'로 분류).
- Q: 수정 대상 리소스 파일 결정 로직 → A: 에이전트 자율 선택 후 사용자 승인 (에이전트가 인덱싱된 메타데이터를 기반으로 최적의 파일을 선택하되, 수정 실행 전 사용자에게 승인을 요청).
- Q: 변경 사항 제시 및 확인 방식 → A: Diff 형식 (수정 전후의 차이점을 콘솔에 출력하고 사용자의 Y/N 승인을 거쳐 파일에 기록).
- Q: manifests.json 업데이트 주체 → A: 에이전트 자동 관리 (키워드 추가/수정 시 `ResourceAgent`가 연관된 동의어 및 별칭 정보를 판단하여 `manifests.json`을 함께 최신화).
- Q: 새로운 리소스 파일 생성 지원 여부 → A: 전면 지원 (에이전트가 새로운 도메인이나 기능 그룹화가 필요하다고 판단할 경우 사용자에게 파일명을 제안하고, 승인 시 신규 `.resource` 파일을 생성).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Route to Resource Management (Priority: P1)

As a developer, I want the system to recognize when my intent is to modify the underlying automation keywords (Robot Framework resources) so that I can extend the agent's capabilities without performing a full automation task.

**Why this priority**: This is the entry point for the new functionality. Without correct routing, the sub-agent cannot be invoked.

**Independent Test**: Can be tested by providing a prompt like "Add a new keyword to the Naver resource" and verifying that the system routes to the `ResourceAgent` instead of the standard `ManagerAgent` or `WebAgent`.

**Acceptance Scenarios**:

1. **Given** the system is at the initial routing stage, **When** the user input contains resource management intent (e.g., "Add keyword", "Modify resource"), **Then** the flow branches to the Resource Management sub-agent.
2. **Given** a standard automation intent (e.g., "Search Naver"), **When** the system routes, **Then** it proceeds to the normal execution flow without resource modification.

---

### User Story 2 - Add/Edit Robot Keywords (Priority: P2)

As a system maintainer, I want a specialized sub-agent to handle the complex syntax of Robot Framework `.resource` files so that new automation capabilities can be added or existing ones fixed safely.

**Why this priority**: This replaces the "Tool Creation" logic. Instead of saving one-off sequences, we are now improving the core library of the system.

**Independent Test**: Can be tested by providing a new keyword definition and verifying that the target `.resource` file is updated correctly. The system MUST perform an automated syntax validation (e.g., via `robot` dry-run) before committing any changes to the core resource library.

**Acceptance Scenarios**:

1. **Given** a request to add a keyword, **When** the ResourceAgent processes the request, **Then** it identifies the correct file, appends the keyword using valid Robot Framework syntax, and saves the file.
2. **Given** a request to modify an existing keyword, **When** the ResourceAgent processes the request, **Then** it locates the keyword within the file, updates its logic or arguments, and saves the file without corrupting other sections.

---

### User Story 3 - Removal of Tool Creation/Reuse (Priority: P3)

As a user, I want the system to stop asking to "Optimize and Save Tool" after every successful run, as I prefer to manage modular resources instead.

**Why this priority**: Required to clean up the UX and architecture according to the new direction.

**Independent Test**: Run a successful automation task and verify that no "Save Tool" prompt appears and the `reproGraph` is no longer reachable.

**Acceptance Scenarios**:

1. **Given** a successful agent execution, **When** the `finalizer` node is reached, **Then** the system terminates or summarizes without prompting for tool creation.

## Edge Cases

- **What happens when [syntax is invalid]?**: If the agent generates invalid Robot Framework syntax, the system should ideally validate it (e.g., via dry-run or regex) and retry or report an error.
- **How does system handle [concurrent resource edits]?**: The system should ensure that file writes are atomic or at least handled sequentially to prevent corruption of `.resource` files.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST be implemented using **Node.js and JavaScript (ESM)** only.
- **FR-002**: Agents MUST utilize **LangGraph.js** for stateful orchestration.
- **FR-003**: Automation and side effects MUST be implemented via **Robot Framework**.
- **FR-004**: Implementation MUST follow **TDD** (Tests written and failing before code).
- **FR-005**: The `finalizer` node in the Manager graph MUST NOT contain logic for tool optimization or saving.
- **FR-006**: The `reproGraph` and `FixedStepExecutor` components MUST be removed or disabled.
- **FR-007**: A new `ResourceAgent` MUST be implemented to handle the addition and modification of keywords in `.resource` files.
- **FR-008**: The initial `router` node MUST be updated to detect resource management intents and branch to the `ResourceAgent`.
- **FR-009**: The `ResourceAgent` MUST be able to read existing `.resource` files to understand context before making edits.
- **FR-010**: The system MUST automatically index all `.resource` files within the `src/robots/resources/` directory to provide the `ResourceAgent` with a complete catalog of available automation keywords.
- **FR-011**: The `ResourceAgent` MUST be strictly prohibited from modifying `core.resource` files. Only user-defined custom resource files are eligible for automated modification.
- **FR-012**: The system MUST utilize `src/robots/resources/manifests.json` to manage synonyms and aliases for keywords, allowing the `ResourceAgent` to map natural language intents to the correct technical keywords.
- **FR-013**: The system MUST implement an automatic backup-and-restore mechanism that creates a snapshot of a resource file before modification and reverts to it if syntax validation (Dry-run) fails.
- **FR-014**: The `ResourceAgent` MUST present the identified target file and the proposed changes to the user and obtain explicit confirmation before proceeding with any file write operations.
- **FR-015**: Proposed changes MUST be displayed in a standard **Diff format**, highlighting added, modified, or removed lines to ensure the user can accurately review the impact of the edit.
- **FR-016**: The `ResourceAgent` MUST analyze the new or modified keyword to identify potential synonyms or aliases and automatically update `src/robots/resources/manifests.json` to maintain an up-to-date mapping library.
- **FR-017**: The `ResourceAgent` MUST be capable of proposing and creating new `.resource` files when it identifies a cluster of keywords that belong to a new domain or logical group not represented by existing custom resources.
- **FR-018**: Before creating a new file, the `ResourceAgent` MUST obtain explicit user approval for the proposed filename and path to ensure organizational consistency.

### Key Entities *(include if feature involves data)*

- **Robot Resource File**: A `.resource` file containing Robot Framework `*** Keywords ***` and `*** Settings ***`.
- **Keyword Definition**: A specific block within a resource file including its name, arguments, and sequence of low-level keywords.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% removal of tool creation prompts from the `finalizer` node.
- **SC-002**: Successful routing to `ResourceAgent` for at least 95% of explicit resource management requests.
- **SC-003**: Zero syntax errors introduced into existing `.resource` files by the `ResourceAgent` during automated edits.
- **SC-004**: Reduction in architectural complexity by removing the `tools/` and `replay/` logic paths.
