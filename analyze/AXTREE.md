# OpenClaw AXTree (Accessibility Tree) Extraction & Transformation Analysis

OpenClaw는 웹페이지의 복잡한 HTML을 그대로 AI에게 전달하는 대신, 브라우저의 **접근성 트리(Accessibility Tree)**를 가공하여 전달합니다. 이 문서는 그 과정의 기술적 상세 내용을 담고 있습니다.

---

## 1. 기술 스택 및 도구 (The Tech Stack)

*   **Playwright**: 브라우저 자동화 프레임워크로, 브라우저 세션 및 페이지 관리를 담당합니다.
*   **CDP (Chrome DevTools Protocol)**: Playwright의 상위 레벨 API로 접근하기 어려운 브라우저 내부 엔진 데이터에 접근하기 위해 사용합니다.
*   **TypeScript**: 모든 변환 로직은 타입 안정성을 보장하며 작성되었습니다.

---

## 2. AXTree 추출 과정 (Extraction Process)

### 단계 1: CDP 세션 활성화
Playwright의 `Page` 객체에서 직접 CDP 세션을 생성하고 접근성 기능을 활성화합니다.

```typescript
// src/browser/pw-tools-core.snapshot.ts (개념적 구현)
const session = await page.context().newCDPSession(page);
await session.send("Accessibility.enable");
```

### 단계 2: 전체 AXTree 데이터 획득
`Accessibility.getFullAXTree` 명령을 사용하여 현재 페이지의 모든 접근성 노드를 가져옵니다. 이 데이터는 DOM 트리와 유사하지만, 시각적 스타일보다는 **"이 요소가 무엇인가(Role)"**와 **"이름이 무엇인가(Name)"**에 집중합니다.

```typescript
const { nodes } = await session.send("Accessibility.getFullAXTree");
```

---

## 3. 변환 알고리즘 (The Transformation Algorithm)

추출된 원본 AXTree는 여전히 방대하고 복잡합니다. OpenClaw는 이를 AI 친화적으로 만들기 위해 `src/browser/cdp.ts`와 `src/browser/pw-role-snapshot.ts`에서 다음 알고리즘을 실행합니다.

### 알고리즘 순서:

1.  **노드 필터링 (Filtering)**:
    *   의미 없는 컨테이너(`div`, `span` 등 단순 레이아웃용)는 제거합니다.
    *   **대화형 요소(Interactive Elements)**를 우선적으로 남깁니다: `link`, `button`, `textbox`, `checkbox`, `combobox`, `searchbox` 등.
    *   숨겨진 요소(`hidden: true`)나 이름(Name)이 없는 무의미한 노드는 제외합니다.

2.  **참조 번호 부여 (Reference Labeling)**:
    *   남겨진 각 유효 노드에 시퀀셜한 번호를 부여합니다 (예: `[1]`, `[2]`).
    *   이 번호는 에이전트가 "1번 버튼 클릭"과 같이 명령할 때 사용되는 유일한 키가 됩니다.

3.  **구조적 마크다운 생성 (Markdown Generation)**:
    *   트리의 계층 구조를 인덴트(들여쓰기)로 표현합니다.
    *   노드의 타입(Role)과 이름(Name), 상태(State - 예: `checked`, `disabled`)를 텍스트로 결합합니다.

**출력 예시:**
```markdown
[1] link "Home"
[2] searchbox "검색어 입력"
[3] button "검색"
    [4] menu "카테고리"
        [5] menuitem "전자제품"
```

---

## 4. 핵심 코드 분석

### `src/browser/cdp.ts`: 노드 포맷팅
추출된 `RawAXNode`를 정제된 `AriaSnapshotNode`로 변환하는 핵심 로직이 위치합니다.

```typescript
// src/browser/cdp.ts (핵심 로직 요약)
export function formatAriaSnapshot(nodes: RawAXNode[], limit: number): AriaSnapshotNode[] {
  // 1. 노드 간의 부모-자식 관계 복구
  // 2. 불필요한 노드 가지치기 (Pruning)
  // 3. Role과 Name을 추출하여 간결한 문자열로 변환
  // ...
}
```

### `src/browser/pw-role-snapshot.ts`: 상태 매핑
AI에게 보여줄 텍스트를 생성함과 동시에, 나중에 조작할 수 있도록 메모리에 매핑 정보를 저장합니다.

```typescript
// src/browser/pw-role-snapshot.ts
export function buildRoleSnapshotFromAiSnapshot(snapshotText: string): { 
  refs: RoleRefMap 
} {
  // 텍스트에서 [번호] 패턴을 찾아 실제 요소와 매핑하는 RefMap 객체 생성
}
```

---

## 5. 왜 AXTree인가? (Benefits)

1.  **토큰 절약 (Token Efficiency)**: HTML 소스 코드는 수만 줄에 달할 수 있지만, AXTree 기반 스냅샷은 수백 줄 내외로 압축되어 AI의 토큰 비용을 90% 이상 줄여줍니다.
2.  **정확한 의미 전달**: `<div>`로 감싸진 가짜 버튼도 접근성 트리에서는 `button`으로 명확히 인식되므로 AI가 기능을 정확히 파악합니다.
3.  **조작의 안정성**: 복잡한 CSS Selector 대신 번호(`ref`)를 사용하므로, 페이지 구조가 미세하게 변해도 조작 실패율이 낮습니다.
4.  **시각적 맥락 유지**: 트리 구조를 유지함으로써 요소 간의 포함 관계(예: 어느 그룹에 속한 버튼인지)를 AI가 이해할 수 있습니다.

---

## 6. 대안 및 비교 (Alternatives & Comparison)

AXTree 정보를 얻는 방법은 여러 가지가 있지만, OpenClaw가 CDP를 선택한 이유는 **정확도와 AI 최적화** 때문입니다.

| 방식 | 도구/API | 특징 | OpenClaw와의 차이점 |
| :--- | :--- | :--- | :--- |
| **CDP (OpenClaw)** | `Accessibility.getFullAXTree` | 브라우저 엔진이 계산한 가장 정확한 트리 추출 | AI를 위한 **공격적인 필터링 및 Markdown 변환** 로직 포함 |
| **Playwright 내장 API** | `accessibility.snapshot()` | 간편한 사용법, 내부적으로 CDP 활용 | 데이터 형식이 고정되어 있어 커스텀 필터링에 제한적임 |
| **Robot Framework** | `Get Source` + Custom JS | SeleniumLibrary는 내장 AXTree 키워드가 없으므로 JS 주입 필요 | 가용성이 낮으나 레거시 환경 호환성이 좋음 |
| **수동 DOM 분석** | `JS / document.query` | 태그와 속성을 직접 순회하여 트리 구축 | Computed Name 계산이 부정확하며 숨겨진 요소 처리가 어려움 |
| **Native OS API** | `UI Automation` (Win) | OS 레벨에서 앱의 트리 구조 파악 | 웹 브라우저 내부의 상세 맥락 파악 및 상호작용이 복잡함 |

### Robot Framework SeleniumLibrary 상세 비교
Robot Framework의 SeleniumLibrary는 Browser Library와 달리 내장된 `Get Accessibility Tree` 키워드를 제공하지 않습니다. 따라서 AXTree 기반의 분석이 필요할 경우, CDP 명령을 직접 실행하거나 별도의 JavaScript 라이브러리를 브라우저에 주입하여 트리를 구성해야 합니다. 이는 구현 복잡도를 높이지만, 다양한 WebDriver 기반 환경에서 동작할 수 있는 장점이 있습니다.
