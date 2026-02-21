# Alice MK5 (자율형 멀티 에이전트 자동화 시스템)

Alice MK5는 복잡한 크로스 플랫폼 자동화를 위한 대화형 멀티 에이전트 시스템입니다. 웹 브라우저, 데스크톱 애플리케이션, 로컬 파일 시스템을 넘나드는 작업을 수행하기 위해 특화된 에이전트들을 오케스트레이션합니다.

## 🚀 아키텍처

이 시스템은 **LangGraph.js**와 **Robot Framework**를 기반으로 하며, 계층적 오케스트레이션 모델을 따릅니다.

### 1. 매니저 에이전트 (오케스트레이터)
- **Decomposer**: 사용자 의도를 고수준의 작업 단위로 분해합니다.
- **Planner**: 작업을 특정 에이전트 도구에 매핑하고 데이터 의존성을 관리합니다.
- **Executor**: 하위 에이전트에게 작업을 할당하고 통합 `dataStore`를 관리합니다.
- **Auto-Fix**: 하위 에이전트 실패 시 의도를 수정하여 자동으로 복구 시도를 수행합니다.

### 2. 하위 에이전트 (Sub-Agents)
- **Web Agent**: **SeleniumLibrary** 기반. 브라우저 자동화, 스크래핑 및 웹 워크플로우를 담당합니다.
- **Filesystem Agent**: 로컬 파일 I/O(JSON, TXT 등)를 관리하고, 에이전트 간 데이터 흐름을 원활하게 하기 위해 컨텍스트에서 핵심 변수를 추출합니다.
- **Application Agent**: **AppiumLibrary** 및 **SeleniumLibrary**를 사용하여 데스크톱 애플리케이션 자동화를 수행합니다.

## 🛠 기술 스택
- **Engine**: Node.js (Latest LTS), JavaScript (ESM)
- **Orchestration**: LangGraph.js, LangChain
- **Automation Core**: Robot Framework (Node.js에서 호출되는 Python 기반 키워드)
- **Web**: SeleniumLibrary
- **Mobile/Desktop**: AppiumLibrary

## 📈 최근 진행 상황

### 멀티 에이전트 오케스트레이션 (003)
- ✅ **통합 데이터 저장소(Unified Data Store)**: 에이전트 간에 URL, 결과, 변수 등을 원활하게 전달할 수 있는 공유 컨텍스트 구현.
- ✅ **파일시스템 에이전트(Filesystem Agent)**: 파일 작업 및 데이터 파싱을 전담하는 에이전트를 추가하여 웹 에이전트의 부하 감소.
- ✅ **전략적 분해(Strategic Decomposition)**: 명시적 데이터 의존성을 고려한 매니저의 작업 계획 능력 향상.
- ✅ **견고한 내비게이션**: 컨텍스트 데이터를 활용해 웹 에이전트가 직접 URL로 이동하도록 최적화.

### 앱 자동화 지원 (002)
- ✅ 모바일 및 데스크톱 앱 지원을 위한 **AppiumLibrary** 통합.
- ✅ 자동화 시퀀스를 위한 통합 레지스트리 구축.

### 웹 자동화 (001)
- ✅ 호환성 및 신뢰성 향상을 위해 Browser Library에서 **SeleniumLibrary**로 전환.

### 도구 재현성 최적화 (004)
- ✅ **고재현성 도구 생성**: 성공한 실행 경로(`clean_history`)를 추출하고 로봇 스크립트를 자동 템플릿화하여 재사용 가능한 도구로 저장.
- ✅ **결정론적 재현 실행**: 에이전트 추론 없이 검증된 스크립트를 즉시 실행하는 `Fixed_Step_Executor` 및 전용 선형 그래프 구현.
- ✅ **도구 카탈로그 및 매니페스트**: 표준 JSON 스키마 기반의 매니페스트와 중앙 집중식 카탈로그를 통한 도구 발견 및 관리.
- ✅ **환경 검증 및 진단**: OS, 해상도 등 실행 환경 메타데이터 검증 및 실패 시 상세 스냅샷 수집 기능 추가.

## 🏃 실행 방법

### 설치
```bash
npm install
# 환경에 Robot Framework 및 필수 라이브러리(SeleniumLibrary)가 설치되어 있어야 합니다.
```

### 실행
```bash
node src/cli/index.js "자동화 명령을 입력하세요"
```

## 📝 주요 명령어
- `npm test`: 통합 및 유닛 테스트 실행.
- `npm run lint`: 코드 스타일 체크.

---
*마지막 업데이트: 2026-02-20*
