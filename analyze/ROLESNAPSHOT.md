# OpenClaw Role Snapshot & Reference System Analysis

OpenClaw의 웹 브라우징 혁신의 핵심은 방대한 HTML 데이터를 AI가 즉각적으로 이해하고 조작할 수 있는 **"참조 가능 지능형 지도(Role Snapshot)"**로 변환하는 기술에 있습니다. 이 문서는 에이전트가 사용하는 스냅샷 시스템의 작동 원리를 상세히 분석합니다.

---

## 1. 역할 분류 체계 (Role Classification)

OpenClaw는 웹 요소를 그 성격에 따라 세 가지 카테고리로 분류하여 관리합니다.

*   **Interactive Roles**: AI가 직접 조작할 수 있는 핵심 요소들입니다.
    *   `button`, `link`, `textbox`, `checkbox`, `combobox`, `searchbox`, `switch` 등.
*   **Content Roles**: 페이지의 구조와 맥락을 설명하는 정보 요소들입니다.
    *   `heading`, `main`, `navigation`, `article`, `listitem` 등.
*   **Structural Roles**: 레이아웃 구성을 위한 요소로, 이름(Name)이 없는 경우 스냅샷에서 제외되어 토큰을 절약합니다.
    *   `generic`, `group`, `list`, `table`, `row` 등.

---

## 2. 변환 및 필터링 알고리즘 (Transformation Logic)

`buildRoleSnapshotFromAriaSnapshot` 함수는 Playwright의 `ariaSnapshot` 결과를 입력받아 다음 과정을 거쳐 최종 결과물을 생성합니다.

### Step 1: 노드 순회 및 필터링
*   **컴팩트 모드 (`compact: true`)**: 이름이 없는 단순 구조적 요소(Structural Roles)를 제거하여 트리를 최소화합니다.
*   **인터랙티브 모드 (`interactive: true`)**: 오직 조작 가능한 요소(Interactive Roles)만 남기고 나머지는 모두 제거합니다.

### Step 2: 고유 참조 번호 부여 (Reference Labeling)
*   **번호 생성**: `e1`, `e2`, `e3`와 같은 고유한 번호(Ref)를 각 유효 노드에 부여합니다.
*   **중복 처리 (Nth Index)**: 만약 `role`과 `name`이 동일한 요소가 여러 개 있다면, `[nth=1]`, `[nth=2]`와 같은 인덱스를 추가하여 AI가 정확히 구분할 수 있게 합니다.

### Step 3: 마크다운 렌더링
*   트리의 깊이(Depth)에 따라 들여쓰기를 적용하여 시각적 계층 구조를 보존합니다.
*   형식: `- [Role] "[Name]" [ref=eX] [nth=Y]`

---

## 3. 참조 맵 (Reference Map) 및 상태 저장

스냅샷이 생성될 때마다 내부적으로 `RoleRefMap`이 구축됩니다.

### 데이터 구조 예시:
```typescript
// 내부 메모리에 저장되는 RefMap
{
  "e1": { "role": "link", "name": "로그인" },
  "e2": { "role": "textbox", "name": "아이디", "nth": 0 },
  "e3": { "role": "button", "name": "확인" }
}
```

### 상태 지속성 (Persistence):
*   이 매핑 정보는 에이전트의 상태(State) 내에 저장됩니다.
*   에이전트가 다음 턴에 `ref: "e1"`에 대해 `click` 요청을 보내면, 분석기(Analyzer)는 저장된 매핑 정보를 바탕으로 실제 CSS 셀렉터를 찾아 SeleniumLibrary 키워드를 통해 동작을 수행합니다.

---

## 4. 코드 수준의 핵심 함수 분석

### `processLine` 함수
개별 스냅샷 라인을 분석하여 참조 번호를 붙일지 결정하고, 메타데이터를 추출하는 핵심 로직입니다.

1.  정규표현식을 통해 `prefix`, `role`, `name`, `suffix`를 분리합니다.
2.  해당 요소가 참조 번호를 가질 자격이 있는지(Interactive 여부 등) 검사합니다.
3.  자격이 있다면 `nextRef()`를 호출하여 새로운 번호를 할당하고 `refs` 객체에 저장합니다.
4.  참조 번호가 포함된 강화된 텍스트 라인을 반환합니다.

### `compactTree` 함수
데이터의 양을 줄이기 위한 알고리즘으로, 하위 노드 중에 참조 번호(`ref=`)가 하나도 없는 상위 구조 노드들을 재귀적으로 제거하여 AI에게 꼭 필요한 정보만 남깁니다.

---

## 5. AI 에이전트와의 상호작용 방식

이 시스템을 통해 AI 에이전트는 다음과 같은 고수준의 명령을 안정적으로 수행할 수 있습니다.

1.  **UI 인지**: "현재 페이지에 `[ref=e5]` 버튼이 '제출' 기능을 수행하는구나."
2.  **정밀 타격**: "복잡한 CSS Selector 대신 `ref: e5`를 클릭해줘."
3.  **오류 복구**: "클릭이 안 된다면 스냅샷을 다시 찍어서 `ref`가 변경되었는지 확인해봐야지."

## 6. 요약: 왜 강력한가?

*   **토큰 소모 최적화**: 무의미한 레이아웃 태그를 모두 쳐내어 LLM 비용을 획기적으로 낮춥니다.
*   **할루시네이션 방지**: AI가 존재하지 않는 요소를 클릭하려 하거나, 이름이 같은 다른 요소를 클릭하는 실수를 방지합니다.
*   **추상화 계층 제공**: 에이전트 개발자는 브라우저의 복잡한 DOM 구조를 몰라도, `ref` 번호만으로 강력한 자동화 기능을 구현할 수 있습니다.
