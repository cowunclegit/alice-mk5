# Feature Specification: High-Reproducibility Tool Execution (Plan-Execute Optimization)

**Feature Branch**: `004-tool-repro-optimization`  
**Created**: 2026-02-20  
**Status**: Draft  
**Input**: User description: "도구로 저장하는 방식을 개선할거야 현재는 web, application 각각 따로 web, application에서만 지원되는 sequence로 저장되는데 이걸 재현성이 최대한 높게 만들어야해 구조적 접근: Plan-Execute 패턴의 최적화 불필요한 탐색을 빼고 싶다면, 재현 시에는 'Search' 노드를 건너뛰고 'Fixed Plan' 노드로 대체하는 트릭을 쓸 수 있습니다. 최초 실행: Plan -> Search -> Execute -> Re-plan (반복) 재현 실행: 최초 실행에서 성공한 Plan 결과물만 모아서 Fixed_Step_Executor 노드에 한 번에 태우기. 요약하자면 State 설계: 실패를 제외한 성공 로그만 담는 clean_history 필드를 만드세요. 필터링: 실행이 끝난 후, 에러가 발생했던 시퀀스를 제거하는 포스트 프로세싱 함수를 만드세요. 업데이트: graph.update_state를 사용해 정제된 데이터만 새 스레드에 밀어넣고 실행하세요. 이런 방식을 사용하면 어떨까? 더 좋은 방법이 있으면 추천해줘"

## Clarifications

### Session 2026-02-20
- Q: 'Robot을 미리 만들어 놓는다'는 것이 도구가 사용하는 JSON 시퀀스를 최적화하는 것인가요, 아니면 독립적으로 실행 가능한 .robot 파일 자체를 생성하는 것인가요? → A: 독립 .robot 파일 생성. 에이전트가 생성한 로봇 중 성공한 것을 도구와 함께 저장하여 매번 새로 생성하는 오류를 방지함.

- Q: 로봇 스크립트 저장 및 참조 방식 → A: 외부 참조 방식 (별도 파일 저장 및 JSON 내 경로 기록).
- Q: 로봇 스크립트의 가변 데이터 처리 → A: 템플릿화 (가변 데이터는 변수로 치환하여 범용성 확보).
- Q: 성공한 로봇 스크립트의 관리 및 정리 → A: Snapshot 보관 (성공한 파일들만 `tools/` 디렉토리로 복사하여 영구 보관).
- Q: 재현 실행(Replay) 시의 실행 주체 → A: Direct Execution (에이전트 개입 없이 저장된 로봇 파일을 즉시 실행).
- Q: 도구 저장 트리거 방식 → A: 사용자 수동 승인 (성공 후 저장 여부를 묻고 이름을 입력받음).
- Q: 템플릿 변수(Variable) 식별 방식 → A: 데이터 추적 기반 (입력값/출력값 계보를 추적하여 자동 치환).
- Q: 'Fixed_Step_Executor'의 제어 흐름 → A: 전용 Linear Graph (루프/분기 없는 고속 직선 경로 사용).
- Q: 도구 사용을 위한 인터페이스(Interface) 정의 → A: 매니페스트(Manifest) 자동 생성 (변수 목록 및 설명을 카탈로그에 등록).
- Q: 도구 저장 전 최종 검증(Validation) 절차 → A: 사용자 선택 (저장 승인 시 검증 후 저장 또는 즉시 저장 선택 가능).
- Q: 도구 매니페스트(Manifest) 규격 → A: 표준 JSON 스키마 (ID, 제목, 설명, 변수 명세, 파일 경로를 포함하는 엄격한 규격 정의).
- Q: 재현 실행 시 변수 누락 처리 → A: 즉시 중단 (필수 변수 누락 시 실행 전 에러 발생).
- Q: 도구 카탈로그(Catalog) 관리 및 동기화 → A: 자동 인덱싱 (도구 저장 시 카탈로그 파일을 자동으로 최신화).
- Q: 재현 실행(Replay) 중 자가 치유(Self-healing) 여부 → A: 엄격한 실행 (사양서 원칙에 따라 미세 실패 시에도 즉시 실패 처리).
- Q: 도구 실행 이력(Execution History) 관리 → A: 통합 이력 관리 (일반 실행과 동일한 포맷으로 중앙 저장소에 보관).
- Q: 도구 저장 시 민감 정보 처리 → A: 처리 안 함 (재현성을 위해 실행 당시 데이터를 그대로 저장하며, 사용자가 보안에 주의해야 함).
- Q: 도구 ID 충돌 처리 → A: 사용자 확인 (이미 존재하는 ID일 경우 덮어쓰기 또는 다른 ID 사용 여부를 선택함).
- Q: 재현 실행 시 브라우저/앱 세션 제어 → A: 상태 유지/신규 병행 (기존 세션 재사용 시도 후 실패 시 신규 생성).
- Q: 단계별 재시도(Retry) 전략 → A: 즉시 중단 (재시도 없이 실패 즉시 전체 중단).
- Q: 재현 실행 후 dataStore 보존 여부 → A: 휘발성 실행 (도구 실행 완료 후 dataStore를 실행 전 상태로 유지).
- Q: 실행 환경 메타데이터 기록 및 검증 → A: 상세 기록 및 강제 검증 (OS, 해상도, 브라우저 정보를 기록하고 재현 시 대조하여 신뢰성 확보).
- Q: 재현 실행(Replay) 실패 시 진단 정보 수집 → A: 상세 스냅샷 (실패 시점의 스크린샷, DOM, 창 정보를 로그와 함께 수집).
- Q: 실패 시 도구 업데이트 워크플로우 → A: 이중 구조 (도구 생성/등록 시에는 에이전트가 실패를 복구하며 최적화된 경로를 찾지만(A), 저장된 도구 실행 시에는 즉시 중단(B)하여 엄격한 재현성 보장).
- Q: 도구 및 로봇 스크립트 저장 구조 → A: 플랫폼별 분리 (`src/robots/tools/{platform}/{tool_id}/` 경로에 관련 파일을 모아 관리).
- Q: 재현 실행(Replay) 중 실시간 피드백 → A: 단계별 진행 표시 (현재 실행 중인 키워드와 인자를 실시간으로 출력).
- Q: 도구 카탈로그(Tool Catalog) 저장 위치 및 포맷 → A: 프로젝트 내 로컬 JSON (`src/memory/tools/catalog.json` 파일에 통합 관리).
- Q: 저장된 도구 시퀀스의 직접 편집 지원 여부 → A: 지원 안 함 (변경이 필요한 경우 재실행을 통해 도구를 새로 생성함).
- Q: 재현 실행 중 치명적 에러 시 로그 기록 수준 → A: 전체 단계 기록 (실패 지점까지의 모든 성공 단계, 실패 원인, 스냅샷을 이력에 남김).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Optimize and Save Automation Tool (Priority: P1)

As an automation engineer, I want to execute a complex task across platforms (web/app), and once it succeeds, I want the system to automatically generate a "clean" re-executable tool that skips unnecessary discovery steps.

**Why this priority**: This is the core value proposition. It ensures that successful manual-like explorations are converted into efficient, deterministic automated tools.

**Independent Test**: Can be tested by running an automation task that involves some trial-and-error (re-planning), confirming that the final saved tool contains only the successful steps and executes them without re-searching.

**Acceptance Scenarios**:

1. **Given** a user intent requiring multi-step automation, **When** the initial execution completes with some retries/re-planning, **Then** a `clean_history` is generated containing only the final successful actions.
2. **Given** a finished execution, **When** the post-processing filter runs, **Then** all steps that led to an error or were superseded by a re-plan are removed from the saved sequence.

---

### User Story 2 - High-Reproducibility Tool Replay (Priority: P2)

As a system user, I want to run a previously saved tool, and have it execute instantly using a "Fixed Plan" that bypasses the exploration/search phase for maximum speed and reliability.

**Why this priority**: Reliability is key for automation. Bypassing the "Search" node during replay minimizes the risk of dynamic UI changes affecting the discovery phase of a known sequence.

**Independent Test**: Can be tested by loading a saved tool and verifying that the `Fixed_Step_Executor` is used instead of the standard Planner/Searcher flow.

**Acceptance Scenarios**:

1. **Given** a saved "Fixed Plan" tool, **When** it is executed, **Then** the system skips the "Search" and "Re-plan" nodes and directly executes the pre-validated steps.
2. **Given** a replay execution, **When** the environment matches the original successful run, **Then** the task completes successfully in significantly less time than the initial discovery run.

---

### User Story 3 - Cross-Platform Unified Sequence (Priority: P3)

As a developer, I want automation sequences to handle both web and application steps in a unified format, rather than having platform-specific silos.

**Why this priority**: Improves maintainability and allows for more complex workflows that span multiple interfaces.

**Independent Test**: Verify that a single saved tool can contain both `web_agent` and `application_agent` tasks in its execution sequence.

**Acceptance Scenarios**:

1. **Given** an intent involving both a website and a desktop app, **When** the tool is saved, **Then** the resulting JSON sequence contains instructions for both platforms in a single unified list.

## Edge Cases

- **How does the system handle [dynamic UI changes during replay]?**: If a "Fixed Plan" step fails due to a UI change, the system MUST fail immediately. This ensures strict reproducibility and alerts the user that the environment has changed since the tool was created.
- **What happens when [the environment is completely different]?**: If a tool is replayed on a system where the target application is missing or the website is blocked, the system must provide a clear "Prerequisite Failure" report.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST be implemented using **Node.js and JavaScript (ESM)** only.
- **FR-002**: Agents MUST utilize **LangGraph.js** for stateful orchestration.
- **FR-003**: Automation and side effects MUST be implemented via **Robot Framework**.
- **FR-004**: Implementation MUST follow **TDD** (Tests written and failing before code).
- **FR-005**: The Graph State MUST include a `clean_history` field that accumulates only successful step outcomes.
- **FR-006**: The system MUST implement a post-processing function to filter out failed attempts and redundant re-planning cycles from the final sequence.
- **FR-007**: The system MUST support a `Fixed_Step_Executor` node that performs **Direct Execution** of pre-validated Robot scripts without invoking the 에이전트(LLM) for planning or search. This executor MUST provide real-time console feedback of each step being executed.
- **FR-008**: Tools MUST be saved in a unified format that supports multi-platform (web/application) task sequences.
- **FR-009**: The system MUST use `graph.update_state` to inject refined sequence data into a new execution thread when generating/optimizing a tool.
- **FR-010**: The system MUST save the validated Robot Framework scripts (generated during successful execution) as persistent files associated with the saved Tool to ensure high reproducibility without re-generation.
- **FR-011**: Automation Sequences MUST reference these saved robot script files via relative paths in the tool configuration.
- **FR-012**: The system MUST automatically templatize saved robot scripts by tracking data lineage using **exact value matching** between task inputs/outputs and script arguments. In cases where multiple tasks produced the same value, the **most recent task output** MUST be used as the lineage source for templatization.
- **FR-013**: The system MUST perform a snapshot operation upon tool saving, copying all validated Robot scripts from temporary storage to a permanent tool-specific directory.
- **FR-014**: The system MUST explicitly request user approval before persisting an optimized sequence as a Tool, allowing the user to provide a unique identifier (ID) and title.
- **FR-015**: Replay execution MUST utilize a dedicated Linear Graph that bypasses exploration nodes (Search/Re-plan) to ensure deterministic performance.
- **FR-016**: The system MUST automatically generate a Tool Manifest based on a standardized JSON schema, including unique ID, title, description, variable specifications (types, required/optional), and relative paths to associated Robot scripts.
- **FR-017**: The system MUST provide an option for the user to perform a "Validation Run" of the optimized sequence before final persistence to ensure the "Fixed Plan" works as expected.
- **FR-018**: The system MUST validate all required variables defined in the Manifest before starting Replay execution, failing immediately if any are missing.
- **FR-019**: The system MUST automatically update a centralized Tool Catalog (stored as a local JSON file at `src/memory/tools/catalog.json`) whenever a new Tool is saved or modified to ensure high discoverability.
- **FR-020**: The system MUST record every Tool (Fixed Plan) execution in the centralized execution history. In case of failure or interruption, the record MUST include all successfully completed steps leading up to the failure, input arguments, timestamps, and detailed diagnostic snapshots (screenshots, DOM, window state).
- **FR-021**: Replay execution MUST be treated as an isolated process; any changes to the `dataStore` during Replay MUST NOT be persisted to the main session state after completion.
- **FR-022**: The system MUST capture and store environment metadata (OS version, screen resolution, browser version) during the initial successful run and validate these against the current environment before starting a Replay. **Any mismatch in OS or CPU architecture MUST block execution**, while mismatches in resolution or browser version MUST trigger a warning but allow the user to proceed.

### Key Entities *(include if feature involves data)*

- **Automation Sequence (Tool)**: A JSON object containing a title, description, a list of "Fixed Steps", paths to associated Robot scripts, variable definitions, and environment metadata (OS, Resolution, etc.).
- **Clean History**: A subset of the execution state that tracks only the specific actions that directly contributed to the successful completion of the intent.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Replay of a saved tool MUST be at least 30% faster than the initial exploration run (due to skipping the Search/Plan nodes).
- **SC-002**: 100% of saved tools MUST be stripped of any steps that resulted in an "Error" status during the initial run.
- **SC-003**: Users MUST be able to execute a unified tool containing both Web and Application steps in a single continuous flow.
- **SC-004**: The system MUST maintain a 95% success rate on replaying tools in identical environments.
