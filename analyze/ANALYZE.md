# OpenClaw Web Browsing Flow Analysis

이 문서는 OpenClaw가 사용자의 웹 브라우징 요청을 어떻게 처리하고, 어떤 내부 흐름을 거쳐 결과를 도출하는지 상세히 분석한 보고서입니다.

---

## 1. 핵심 아키텍처 (Core Architecture)

OpenClaw의 웹 브라우징 시스템은 크게 세 가지 계층으로 구성됩니다.

*   **Agent Tool Layer (`src/agents/tools/`)**: 에이전트(LLM)가 직접 호출하는 인터페이스입니다. `browser-tool.ts`, `web-search.ts`, `web-fetch.ts` 등이 포함됩니다.
*   **Browser Control Layer (`src/browser/`)**: 브라우저 인스턴스를 관리하고 제어 명령을 수신하는 Express 기반 서버(`server.ts`)와 Playwright 세션 관리 로직이 위치합니다.
*   **AI Perception Layer (`src/browser/pw-role-snapshot.ts`)**: 브라우저의 DOM/접근성 트리를 AI가 이해하기 쉬운 텍스트 구조로 변환하는 핵심 엔진입니다.

---

## 2. 단계별 상세 분석 (Step-by-Step Flow)

### Step 1: 에이전트의 판단 및 도구 선택 (Reasoning & Tool Selection)
사용자의 요청(예: "최신 뉴스 검색해줘" 또는 "특정 사이트 로그인해줘")을 받은 에이전트는 내부 추론을 통해 적절한 도구를 선택합니다.
*   **단순 정보 필요 시**: `web_search` 또는 `web_fetch` 호출.
*   **복잡한 상호작용 필요 시**: `browser` 도구 호출 (navigate, click, type, snapshot 등).

### Step 2: 도구 실행 및 라우팅 (`browser-tool.ts`)
에이전트가 생성한 파라미터(URL, Action 등)를 바탕으로 `browser-tool`이 실행됩니다.
*   **Targeting**: `host`(로컬), `sandbox`(격리 환경), `node`(원격 노드) 중 어디서 브라우저를 실행할지 결정합니다.
*   **Proxying**: 직접 브라우저를 조작하지 않고, 지정된 대상의 **Browser Control Server**에 API 요청을 보냅니다.

### Step 3: 브라우저 제어 서버의 요청 처리 (`server.ts`)
백그라운드에서 대기 중인 OpenClaw 브라우저 서버가 요청을 수신합니다.
*   **Profile Matching**: `openclaw`(격리된 자동화 전용) 또는 `chrome`(사용자 크롬 확장 프로그램 연동) 프로필에 따라 브라우저 세션을 연결합니다.
*   **Authentication**: 설정된 토큰이나 패스워드를 통해 보안 인증을 수행합니다.

### Step 4: Playwright 기반 브라우저 조작 (Deep Dive)
실제 브라우저 엔진(Chromium)을 제어하는 핵심 계층입니다.

*   **세션 및 타겟 관리 (`pw-session.ts`)**:
    *   `getPageForTargetId`: 에이전트가 특정 탭(`targetId`)을 지속적으로 제어할 수 있도록 세션을 추적합니다.
    *   Playwright의 `Page` 객체에 고유 식별자를 부여하여 멀티 탭 환경에서도 정확한 타겟팅이 가능합니다.
*   **CDP(Chrome DevTools Protocol) 활용**:
    *   일반적인 Playwright API 외에도 `CDPSession`을 직접 열어 브라우저의 로우 레벨 데이터에 접근합니다.
    *   `Accessibility.getFullAXTree`를 호출하여 시각적 렌더링 너머의 **의미론적 구조(Semantic Structure)**를 추출합니다.
*   **동작 실행 (`pw-tools-core.ts`)**:
    *   `clickViaPlaywright`, `typeViaPlaywright`: AI가 전달한 참조 번호(ref)를 기반으로 실제 DOM 요소를 찾아 이벤트를 시뮬레이션합니다.

### Step 5: AI를 위한 페이지 구조 분석 (Role Snapshot)
AI가 페이지의 상태를 텍스트로 "이해"할 수 있도록 변환하는 단계입니다.

*   **Role Snapshot 메커니즘 (`pw-role-snapshot.ts`)**:
    1.  **AXTree 분석**: 웹페이지의 접근성 트리에서 대화형 요소(button, link, input 등)를 필터링합니다.
    2.  **Reference 시스템**: 각 요소에 `[1]`, `[2]`와 같은 고유 번호(Ref)를 부여합니다.
    3.  **마크다운 렌더링**: 시각적 레이아웃을 최대한 보존하면서 요약된 마크다운 텍스트 스냅샷을 생성합니다.
*   **상태 유지 (State Persistence)**:
    *   스냅샷 생성 시 해당 시점의 `RefMap`(번호와 실제 요소의 매핑 정보)을 서버 메모리에 저장합니다.
    *   이후 에이전트가 "1번 버튼 클릭" 명령을 내리면, 메모리에서 해당 요소를 즉시 찾아 실행함으로써 조작의 정확도를 높입니다.

### Step 6: 결과 반환 및 보안 처리 (`external-content.ts`)
브라우징 결과가 에이전트에게 안전하게 전달됩니다.
*   **Content Wrapping**: 외부 사이트에서 가져온 데이터가 에이전트의 시스템 프롬프트를 오염시키지 않도록 특수한 태그로 감싸서(Safety Wrapping) 전달합니다.
*   **Feedback Loop**: 에이전트는 결과 스냅샷을 보고 다음 동작을 결정하거나 최종 답변을 작성합니다.

---

## 3. 에이전트 상호작용 전략 (Agent Interaction)

에이전트는 단순히 브라우저를 실행하는 것이 아니라, 다음과 같은 전략적 가이드를 따라 작동합니다.

1.  **Look Before You Leap**: 동작을 수행하기 전 항상 `snapshot`을 통해 현재 UI 상태를 파악합니다.
2.  **Ref-based Automation**: 텍스트 매칭의 모호함을 피하기 위해 스냅샷에서 제공된 고유 참조 번호(`ref`)를 사용하여 클릭/입력을 수행합니다.
3.  **Context-Aware**: `targetId`를 유지하여 작업의 연속성을 보장하고, 필요한 경우 새 탭을 열어 병렬 작업을 수행합니다.

---

## 4. OpenClaw 브라우징의 차별점

1.  **Browser Relay (확장 프로그램 연동)**: 사용자가 현재 보고 있는 브라우저 탭의 제어권을 AI에게 즉시 넘겨줄 수 있습니다.
2.  **Semantic Understanding**: 단순 텍스트 추출이 아닌 접근성 기반의 역할(Role) 인식을 통해 복잡한 웹 UI도 정확하게 파악합니다.
3.  **Ref-based Interaction**: 복잡한 CSS Selector 대신 간단한 참조 번호(`ref-1`) 시스템을 사용하여 AI의 조작 정확도를 극대화합니다.
4.  **Token Efficiency**: 수만 줄의 HTML 대신 핵심 요소만 요약된 스냅샷을 사용하여 토큰 소모를 90% 이상 절감합니다.
5.  **Sandbox Integration**: 브라우저 실행 환경을 완전히 격리하여 보안 사고를 방지할 수 있습니다.
