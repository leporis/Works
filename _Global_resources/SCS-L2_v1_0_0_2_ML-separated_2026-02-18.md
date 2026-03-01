# 시뮬레이터코딩표준 (Simulator Coding Standard, SCS-L2)

**교육용 시뮬레이터의 공통 설계·구현 표준**

**문서 버전: v1.0.0.2**

> **계층**: Level 1 (범용) → **Level 2 (시뮬레이터 공통)** → Level 3 (도메인 특화)
>
> **상위 문서**: 범용코딩표준 (L1)의 모든 규칙을 상속 + 시뮬레이터 특화 규칙 추가
>
> **적용**: 교육용 시뮬레이터, 인터랙티브 데모, 비주얼 학습 도구
>
> **하위 문서**: ML시뮬레이터코딩표준 (L3-ML), 초등교과시뮬레이터코딩표준 (L3-Edu), IoT시뮬레이터코딩표준 (L3-IoT)

---

## 목차

### Part 1: 공통 필수 원칙
1. [교육적 투명성](#1-교육적-투명성)
2. [실시간 반응성](#2-실시간-반응성)
3. [CONFIG / UI_TEXT 분리](#3-config--ui_text-분리)
4. [숨김 클래스 — 두 종류 구분](#4-숨김-클래스--두-종류-구분)
5. [공통 후처리 — finishXxx 패턴](#5-공통-후처리--finishxxx-패턴)
6. [래퍼 + 순수 함수 이중 구조](#6-래퍼--순수-함수-이중-구조)
7. [단계별 실행 파이프라인 — run / loop / finish](#7-단계별-실행-파이프라인--run--loop--finish)
8. [진행 결과 누적 배열 패턴](#8-진행-결과-누적-배열-패턴)
9. [상태 관리 기준](#9-상태-관리-기준)
10. [Canvas 기초](#10-canvas-기초)
11. [애니메이션 선택 기준](#11-애니메이션-선택-기준)
12. [시뮬레이터 안티패턴](#12-시뮬레이터-안티패턴)

### Part 2: 선택 메뉴 (L3에서 조합)
13. [레이아웃 옵션](#13-레이아웃-옵션)
14. [색상 체계 옵션](#14-색상-체계-옵션)
15. [CSS 변수 2단계 계층](#15-css-변수-2단계-계층)
16. [시각화 기법 옵션](#16-시각화-기법-옵션)

### Part 3: 체크리스트
17. [공통 작성 체크리스트](#17-공통-작성-체크리스트)
18. [공통 리뷰 체크리스트](#18-공통-리뷰-체크리스트)

### Part 4: 공통 유틸리티
19. [공통 유틸리티 함수](#19-공통-유틸리티-함수)

---

# Part 1: 공통 필수 원칙

---

## 1. 교육적 투명성

**결과가 아니라 과정을 보여준다**

```
❌ 블랙박스: 입력 → [?] → 출력
✅ 화이트박스: 입력 → [단계1] → [단계2] → [단계3] → 출력
                      ↓         ↓         ↓
                   시각화    시각화    시각화
```

> 이 원칙은 모든 시뮬레이터(ML, IoT, Edu 등)에 공통으로 적용된다.
> 구체적 구현 방법은 도메인별 L3 문서에서 정의한다.

---

## 2. 실시간 반응성

```javascript
// ✅ 올바름: 입력 즉시 업데이트
slider.addEventListener('input', e => {
    updateValue(e.target.value);
    updateVisualization();  // 즉시 반영
});

// ❌ 나쁨: 버튼 클릭해야 업데이트
button.addEventListener('click', () => {
    updateVisualization();
});
```

> **규칙**: 슬라이더·토글·선택 등 연속 입력 컨트롤에는 `input` 이벤트를 사용하여 즉시 반영한다.
> 계산 비용이 큰 작업(분류 실행, 센서 캘리브레이션 등)만 버튼 트리거를 허용한다.

---

## 3. CONFIG / UI_TEXT 분리

> L1 원칙 2(설정 중심 설계)의 시뮬레이터 특화 적용.

```javascript
// ✅ CONFIG: 숫자·색상·크기·타이밍 상수만
const CONFIG = {
    CANVAS: {
        PADDING: 50,
        RESOLUTION: 50,
    },
    ANIMATION: {
        STEP_DELAY: 350,       // ms - 단계별 실행 딜레이
        PLAYBACK_DELAY: 600,   // ms - 재생 딜레이
    },
    COLOR: {
        PRIMARY: '#2196F3',
        SUCCESS: '#43A047',
        DANGER:  '#E53935',
    },
    // Canvas 폰트 문자열은 FONT 서브객체로 반드시 그룹화
    FONT: {
        LABEL:      '14px sans-serif',
        AXIS_LABEL: '12px sans-serif',
        TICK:       '10px monospace',
        VALUE_BOLD: 'bold 11px monospace',
    },
    TOAST_DURATION: 2500,   // ms
};

// ✅ UI_TEXT: 화면 표시 문자열만 (CONFIG와 절대 혼용 금지)
const UI_TEXT = {
    // 버튼 텍스트 (BTN_*) — 정적 초기값 + 동적 상태 변경용 모두 포함
    BTN_RUN:      '▶ 실행',
    BTN_RUNNING:  '⏳ 실행 중...',
    BTN_RESET:    '🔄 초기화',

    // 에러/경고 메시지
    ERROR_NO_DATA:    '데이터를 먼저 준비해주세요.',
    ERROR_INVALID:    '입력 값이 올바르지 않습니다.',

    // 슬라이더 레이블 배열 (인덱스가 값과 대응)
    SPEED_LABELS: ['느리게', '보통', '빠르게'],
};
```

> **규칙**: `CONFIG`에 문자열 금지. `UI_TEXT`에 숫자·색상 금지.
> 버튼의 실행 중 상태 텍스트(`BTN_RUNNING`)도 반드시 `UI_TEXT`에 정의한다.
>
> **도메인별 확장**: L3에서 CONFIG에 도메인 서브객체를 추가한다.
> - ML: `CONFIG.K_MIN`, `CONFIG.THRESHOLD_EXCELLENT` 등
> - IoT: `CONFIG.SENSOR`, `CONFIG.SERIAL` 등
> - Edu: `CONFIG.HINT`, `CONFIG.SCORE` 등

---

## 4. 숨김 클래스 — 두 종류 구분

```css
/* JS로 반복 토글 → classList.toggle('hidden') */
.hidden           { display: none !important; }

/* 초기 렌더링 숨김 → 조건 충족 시 JS로 한 번 해제 */
.initially-hidden { display: none; }
```

```javascript
// .hidden: 반복적으로 보이기/숨기기
element.classList.toggle('hidden', condition);       // ✅

// .initially-hidden: 처음에 숨겨두었다가 한 번만 해제
element.classList.remove('initially-hidden');
element.style.display = 'block';                     // ✅

// ❌ 금지: initially-hidden을 toggle로 재사용
element.classList.toggle('initially-hidden', flag);  // ❌
```

> **용도 구분**: 버튼 클릭·모드 전환 등 반복 토글은 `.hidden`, 데이터 로드 후 처음 한 번만 나타나는 정보 박스·결과 패널은 `.initially-hidden`.

---

## 5. 공통 후처리 — finishXxx 패턴

데이터/설정 로드 경로가 2개 이상이면, 공통 후처리를 `finishXxx()` 함수로 집중시킨다.

```javascript
// ✅ 여러 로드 경로가 하나의 finishXxx()로 수렴
function loadFromSource_A() { /* ... */ finishDataLoad(); }
function loadFromSource_B() { /* ... */ finishDataLoad(); }
function loadFromSource_C() { /* ... */ finishDataLoad(); }

// 공통 후처리 — 상태 리셋 + UI 갱신 + 시각화 재렌더
function finishDataLoad() {
    // 1. 관련 상태 초기화
    results = [];
    isProcessed = false;

    // 2. initially-hidden 패널 숨기기
    document.getElementById('resultPanel').style.display = 'none';

    // 3. UI 갱신
    updateDisplay();

    // 4. 시각화 재렌더
    drawVisualization();
}
```

> **규칙**: 각 경로에서 후처리를 중복 작성하는 것은 금지.
> `finishDataLoad()`, `finishSimulation()`, `finishAnalysis()` 등 목적에 맞는 명명 사용.

---

## 6. 래퍼 + 순수 함수 이중 구조

핵심 로직 함수는 **컨텍스트 자동 선택 래퍼**와 **순수 함수** 두 레이어로 분리한다.

```
[래퍼 함수] ──── 현재 상태를 감지하여 적절한 소스 데이터 선택
     │
     └──▶ [순수 함수] ──── 소스 데이터를 직접 받아 처리 (재사용·테스트 용이)
```

```javascript
// ── 순수 함수: 소스를 직접 받아 처리 ──
function processFrom(input, sourceData) {
    // sourceData만 사용, 전역 상태 참조 없음
    return result;
}

// ── 래퍼 함수: 현재 상태에 따라 소스 자동 선택 ──
function process(input) {
    const source = (isFiltered && filteredData.length > 0)
        ? filteredData : allData;
    return processFrom(input, source);
}
```

> **적용 기준**: 동일 로직을 서로 다른 데이터 소스에 대해 실행하는 경우.
>
> **도메인 적용 예시**:
> - ML: `knnClassify()` → `knnClassifyFrom(point, k, method, sourceData)`
> - IoT: `readSensor()` → `readSensorFrom(sensorId, calibrationData)`
> - Edu: `checkAnswer()` → `checkAnswerFrom(input, answerKey)`

---

## 7. 단계별 실행 파이프라인 — run / loop / finish

애니메이션이 있는 단계별 실행은 **검증→루프→집계** 3단계로 명확히 분리한다.

```
[runXxx()]           [loopNext()]              [finishXxx()]
검증 + 초기화        한 단계 처리               집계 + 결과 표시
+ UI 준비            + 진행 UI 갱신             + 패널 표시
+ 루프 시작          + 다음 단계 예약            + 상태 정리
      │                    │                         ▲
      └──▶ loopNext() ────┘── (조건 충족) ──────────┘
```

| 단계 | 책임 | 금지 사항 |
|------|------|----------|
| run | 검증, 초기화, UI 준비 | 직접 결과 처리 금지 |
| loop | 한 단계 처리, 진행률 갱신 | 전체 집계 금지 |
| finish | 집계, 결과 테이블/차트, 패널 표시 | 데이터 분할·초기화 재실행 금지 |

> **적용 기준**: 단계별 진행을 시각적으로 보여주는 실행 흐름이 있을 때.
>
> **도메인 적용 예시**:
> - ML: `runClassification()` → `evalNext()` → `finishClassification()`
> - IoT: `runMeasurement()` → `sampleNext()` → `finishMeasurement()`
> - Edu: `runQuiz()` → `showNextQuestion()` → `finishQuiz()`

---

## 8. 진행 결과 누적 배열 패턴

단계별 실행(§7)에서 결과를 누적할 때, 소스 배열과 **인덱스 1:1 대응**하는 결과 배열을 사용한다.

```javascript
// 루프 안에서 누적
results.push({ input: items[idx], output: processResult, success: isCorrect });

// 시각화에서 인덱스로 참조 (진행 중에는 앞부분만 채워짐)
items.forEach((item, idx) => {
    drawItem(ctx, item);
    if (results[idx]) {                    // ← undefined 가드 필수
        const { success } = results[idx];
        drawMarker(ctx, item, success);
    }
});
```

> **규칙**: `results[idx]`가 `undefined`일 수 있으므로 참조 시 반드시 가드한다.
> `resetAll()`과 `finishXxxLoad()`에서 반드시 `[]`로 초기화한다.

---

## 9. 상태 관리 기준

```javascript
// ✅ 간단한 시뮬레이터 (상태 10개 미만): 분산 전역변수 허용
let data = [];
let isProcessed = false;
let currentStep = 0;

// ✅ 복잡한 시뮬레이터 (상태 10개 이상 또는 재생 이력 필요): AppState 객체 권장
const AppState = {
    data: [], filteredData: [],
    isAnimating: false, isPaused: false,
    currentStep: 0, results: null,
    parameters: {}, history: [],
};
function updateState(updates) {
    Object.assign(AppState, updates);
    onStateChange();
}
```

> **기준**: 전역변수 10개 미만 → 분산 방식 허용. 재생 이력 필요 또는 상태가 복잡 → AppState 캡슐화.

---

## 10. Canvas 기초

Canvas를 사용하는 시뮬레이터에 공통 적용되는 기초 패턴이다.

```javascript
function drawVisualization() {
    const canvas = document.getElementById('mainCanvas');
    const ctx    = canvas.getContext('2d');
    const rect   = canvas.parentElement.getBoundingClientRect();

    // ✅ Retina/HiDPI 대응 — 매 렌더링 시 재계산
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;

    ctx.clearRect(0, 0, W, H);

    // 데이터 없으면 빈 상태 표시 후 조기 리턴
    if (data.length === 0) {
        ctx.fillStyle = '#999';
        ctx.font = CONFIG.FONT.LABEL;
        ctx.textAlign = 'center';
        ctx.fillText(UI_TEXT.EMPTY_STATE, W / 2, H / 2);
        return;
    }

    // 스케일 함수 — 함수 내부에서 정의 (인라인)
    const pad    = CONFIG.CANVAS.PADDING;
    const scaleX = v => pad + v / range * (W - 2 * pad);
    const scaleY = v => H - pad - v / range * (H - 2 * pad);

    drawAxes(ctx, W, H, pad);
    drawDataPoints(ctx, scaleX, scaleY);
}
```

> **규칙**: `devicePixelRatio` 미적용은 Critical 이슈. `clearRect` 누락도 Critical.
> Canvas를 사용하지 않는 시뮬레이터(Chart.js, 순수 CSS)는 이 섹션 해당 없음.

---

## 11. 애니메이션 선택 기준

```javascript
// ✅ requestAnimationFrame: 연속 렌더링 (실시간 시각화, 물리 시뮬레이션)
function renderLoop() {
    drawVisualization();
    requestAnimationFrame(renderLoop);  // 60fps 연속 렌더
}

// ✅ setTimeout: 단계별 처리 (N ms마다 한 단계씩)
function stepNext() {
    if (idx >= items.length) { finishProcess(); return; }
    processOneStep(idx);
    idx++;
    timer = setTimeout(stepNext, CONFIG.ANIMATION.STEP_DELAY);
}
stepNext();
```

> **기준**: "매 프레임 렌더링" → rAF. "N ms마다 한 단계" → setTimeout.
> 타이머 변수(`timer`)를 반드시 보관하여 `clearTimeout`으로 정리할 수 있게 한다.

---

## 12. 시뮬레이터 안티패턴

> L1(범용)이 아닌 시뮬레이터 도메인에 특화된 안티패턴이다.

### 안티패턴 1: 내장 데이터를 객체 형태로 하드코딩

```javascript
// ❌ 내장 데이터를 객체 배열로 → 파일 크기 폭증
const SAMPLE_DATA = [
    { col_a: 5.1, col_b: 3.5, col_c: 1.4, col_d: 0.2, label: 0 },
    // ... 수백 개
];

// ✅ raw 배열 형태로 저장 후 로드 시 변환
const DATASETS = {
    sample: {
        columns: ['col_a', 'col_b', 'col_c', 'col_d'],
        data: [
            [5.1, 3.5, 1.4, 0.2, 0],
            [4.9, 3.0, 1.4, 0.2, 0],
        ]
    }
};
```

### 안티패턴 2: Canvas ctx.save/restore 남용

```javascript
// ❌ 과도한 save/restore
function drawPoint(ctx, x, y) {
    ctx.save();
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();  // 단순 렌더에서는 불필요
}

// ✅ 생략 가능: 각 draw 함수가 자신의 상태를 직접 설정
function drawPoint(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}

// ✅ save/restore 필수: translate/rotate/scale 사용 시
function drawRotatedLabel(ctx, text, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(text, 0, 0);
    ctx.restore();
}
```

> **기준**: `translate/rotate/scale` 등 transform 사용 시 `save/restore` 필수.
> 단순 `fillStyle/strokeStyle/lineWidth` 변경만 하는 렌더러는 생략 가능.

---

# Part 2: 선택 메뉴 (L3에서 조합)

> Part 2의 항목들은 **구조(방법론)가 필수**이되, **구체적 값과 구현은 L3에서 선택**한다.

---

## 13. 레이아웃 옵션

시뮬레이터 복잡도와 도메인에 따라 레이아웃을 선택한다.

| 옵션 | 구조 | 적합한 도메인 |
|------|------|-------------|
| **A. 3-Panel** | 좌측(입력) — 중앙(시각화) — 우측(결과) | ML 시뮬레이터 (산점도 중심) |
| **B. 1~2열 자유 배치** | 도메인에 맞는 자유 레이아웃 | IoT (회로도, 블록코딩) |
| **C. 탭 기반** | 상위 모드 탭 + 하위 서브 탭 | 복합 기능 (학습/추론 모드) |

**모드 탭을 사용할 경우의 필수 규칙:**

```javascript
// ✅ 상위 모드 탭 — classList.toggle 일괄 처리
function switchMode(mode) {
    document.querySelectorAll('.mode-tab')
        .forEach(tab => tab.classList.toggle('active', tab.dataset.mode === mode));
    // 모드별 패널 toggle ...
}

// ✅ 하위 서브 탭 — 상위 모드 전환과 독립 동작
function switchSubTab(tab) {
    document.querySelectorAll('.sub-tab')
        .forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.sub-content')
        .forEach(c => c.classList.remove('active'));
    document.getElementById(tab + 'Content').classList.add('active');
}
```

> **2레벨 탭 규칙**: 상위(모드) 전환 시 하위(서브) 탭 상태는 초기화하지 않는다.

---

## 14. 색상 체계 옵션

| 옵션 | 배경색 | 주 강조색 | 적합한 도메인 |
|------|--------|----------|-------------|
| **A. 따뜻한 톤** | `#FFFBF5` (크림) | `#E53935` (Apple Red) | ML, Edu |
| **B. 다크 테마** | `#1a1a2e` (네이비) | `#00d4ff` (시안) | IoT |
| **C. 커스텀** | L3에서 정의 | L3에서 정의 | 향후 확장 |

> **규칙**: 어떤 테마를 선택하든 §15의 CSS 2단계 계층 구조는 필수.
> 1단계(팔레트 값)만 교체하면 전체 테마가 변경되는 구조를 유지한다.

---

## 15. CSS 변수 2단계 계층

**구조는 필수, 구체적 값은 L3에서 정의한다.**

```css
:root {
    /* ===== 1단계: 기본 팔레트 (값만 정의, 직접 참조 금지) ===== */
    --color-primary-500: #2196F3;   /* L3에서 도메인에 맞게 교체 */
    --color-success-500: #43A047;
    --color-danger-500:  #E53935;
    --color-bg-100:      #FFFBF5;   /* L3에서 교체: IoT → #1a1a2e */

    /* ===== 2단계: 의미적 별칭 (코드에서는 이것만 사용) ===== */
    --primary:    var(--color-primary-500);
    --success:    var(--color-success-500);
    --danger:     var(--color-danger-500);
    --bg-body:    var(--color-bg-100);

    /* ===== 간격 시스템 ===== */
    --spacing-xs: 6px;
    --spacing-sm: 8px;
    --spacing-md: 10px;
    --spacing-lg: 12px;
    --spacing-xl: 16px;
}

/* 규칙: 코드에서는 반드시 2단계 별칭 사용. 1단계 직접 참조 금지 */
.button { background: var(--primary); }         /* ✅ */
/* .button { background: var(--color-primary-500); }  ❌ 금지 */
```

---

## 16. 시각화 기법 옵션

| 옵션 | 장점 | 적합한 경우 |
|------|------|-----------|
| **Canvas 직접** | 완전 제어, 커스텀 렌더링 | 산점도, 결정 경계, 커스텀 그래프 |
| **Chart.js** | 빠른 구현, 반응형 자동 | 라인 차트, 바 차트, 표준 그래프 |
| **순수 CSS** | 외부 의존성 없음 | 진행 바, 간단한 게이지, 레이아웃 시각화 |

> Canvas를 선택하면 §10(Canvas 기초)을 필수 적용한다.
> Chart.js를 선택하면 CDN 로드 + 반응형 옵션 설정을 필수로 한다.

---

# Part 3: 체크리스트

> 도메인별 상세 항목은 각 L3 문서의 체크리스트 섹션에서 정의한다.
> 여기에는 **모든 시뮬레이터에 공통**인 항목만 포함한다.

---

## 17. 공통 작성 체크리스트

### 작성 전
- [ ] CONFIG (숫자·색상·타이밍만) / UI_TEXT (문자열만, BTN_* 포함) 분리 설계
- [ ] 레이아웃 옵션 선택 (§13)
- [ ] 색상 체계 옵션 선택 (§14)
- [ ] CSS 2단계 변수 계층 설계 (§15)

### 작성 중
- [ ] `.initially-hidden` / `.hidden` 구분 사용 (§4)
- [ ] 모든 로드 경로 → `finishXxx()`로 수렴 (§5)
- [ ] 핵심 로직: 래퍼 + 순수 함수 이중 구조 적용 여부 검토 (§6)
- [ ] 단계별 실행: run/loop/finish 3단계 분리 (§7, 해당 시)
- [ ] 진행 결과 배열 undefined 가드 (§8, 해당 시)
- [ ] `input` 이벤트로 슬라이더 즉시 반응 (§2)
- [ ] 빈 상태(데이터 없을 때) UI 처리
- [ ] 타이머 변수 보관 → `clearTimeout` 정리

### 작성 후
- [ ] CONFIG에 문자열 / UI_TEXT에 숫자 혼용 없음
- [ ] Canvas 사용 시: devicePixelRatio 적용 확인 (§10)
- [ ] initially-hidden 패널이 toggle로 재사용되지 않음 (§4)
- [ ] 반응형 확인 (resize 이벤트 연결)

---

## 18. 공통 리뷰 체크리스트

### 🔴 Critical
- [ ] Canvas clearRect() 누락 (Canvas 사용 시)
- [ ] devicePixelRatio 미적용 (Canvas 사용 시)
- [ ] 타이머 정리(clearTimeout) 누락
- [ ] 데이터 없을 때 함수 실행 → 런타임 에러
- [ ] CONFIG에 문자열 / UI_TEXT에 숫자 혼용
- [ ] initially-hidden을 classList.toggle로 재사용

### 🟡 Important
- [ ] 로드 경로마다 후처리 중복 (finishXxx 미적용)
- [ ] run/loop/finish 책임 혼재
- [ ] CONFIG.FONT 없이 폰트 문자열 인라인 반복
- [ ] UI_TEXT에 버튼 텍스트 누락 (BTN_* 미사용)

### 🟢 Nice-to-have
- [ ] 다크 모드 지원
- [ ] Canvas 이미지 저장
- [ ] 다국어 (UI_TEXT 기반)
- [ ] 키보드 조작 (접근성)

---

# Part 4: 공통 유틸리티

---
## 19. 공통 유틸리티 함수

```javascript
// Fisher-Yates 배열 섞기 (원본 보존)
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// 토스트 알림 — toast-out 클래스 + animationend 이벤트 패턴
// ❌ 금지: setTimeout으로 즉시 remove() → 애니메이션 없이 사라짐
// ✅ 올바름: toast-out 클래스 추가 → CSS 애니메이션 완료 후 제거
function showToast(message, type = 'info', duration = CONFIG.TOAST_DURATION) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-out');                          // CSS 아웃 애니메이션 시작
        toast.addEventListener('animationend', () => toast.remove());  // 완료 후 DOM 제거
    }, duration);
}

// 정규화 (0~100 범위로 스케일)
function normalize(value, min, max) {
    return ((value - min) / (max - min || 1)) * 100;
}

// 범위 클램프
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// 거리 계산 (유클리드 / 맨해튼)
function calculateDistance(p1, p2, method = 'euclidean') {
    return method === 'euclidean'
        ? Math.sqrt((p1.x1 - p2.x1) ** 2 + (p1.x2 - p2.x2) ** 2)
        : Math.abs(p1.x1 - p2.x1) + Math.abs(p1.x2 - p2.x2);
}

// Canvas hex 투명도 패턴 — CSS rgba 대신 hex 2자리 추가
// FF=100%, CC=80%, 99=60%, 80≈50%, 66≈40%, 4D≈30%, 33≈20%, 20≈12%
// 예: CONFIG.CLASS_COLORS[c] + '60'  → 약 38% 불투명 (이웃 연결선)
//     CONFIG.CLASS_COLORS[c] + '30'  → 약 19% 불투명 (결정 경계 배경)
//     CONFIG.CLASS_COLORS[c] + '20'  → 약 12% 불투명 (추론 배경)

// 실시간 로그 + 자동 스크롤 패턴
// eval-item-list 같은 로그 컨테이너에 행을 추가할 때 항상 사용
// list.appendChild(row) 후 항상 scrollTop = scrollHeight 호출
function appendLogRow(list, html) {
    const row = document.createElement('div');
    row.innerHTML = html;
    list.appendChild(row);
    list.scrollTop = list.scrollHeight;  // 최신 행이 항상 보이도록
}

// 포맷팅
function formatPercent(value, decimals = 1) {
    return value.toFixed(decimals) + '%';
}
```


---

## 참고자료

| # | 자료명 | 유형 | 비고 |
|:-:|--------|------|------|
| 1 | 버전관리지침(VMP)_v1.3.1.0 | 프로젝트 문서 | 버전 체계, 파일명, 세션 인계, 필수 구성요소 |
| 2 | 문서관리지침(DMPP)_v2.3.0.1 | 프로젝트 문서 | 협업 원칙, 이미지 관리, 코드 리뷰 프로세스 |
| 3 | 범용코딩표준(GCS-L1)_v1.0.0.2 | 프로젝트 문서 | 상위 문서 — 모든 규칙 상속 |
| 4 | 코딩관리지침(CDMP)_v4.0.0.2 | 프로젝트 문서 | 코드 개선(리팩토링), SVG 제작, 문서화, 품질 점검 |
| 5 | ML시뮬레이터코딩표준(MLSCS-L3)_v1.0.0.2 (L3-ML) | 프로젝트 문서 | 하위 문서 — ML 시뮬레이터 특화 |
| 6 | 초등교과시뮬레이터코딩표준(ECSCS-L3)_v1.0.0.2 (L3-Edu) | 프로젝트 문서 | 하위 문서 — 초등교과 시뮬레이터 특화 |
| 7 | IoT시뮬레이터코딩표준(IOTSCS-L3)_v0.2.0.1 | 프로젝트 문서 | 하위 문서 — IoT 시뮬레이터 특화 |

---

## 생성/수정 이력

| 버전 | 날짜 | 시간 | 변경 수준 | 변경 내용 | 작성자 |
|------|------|------|-----------|-----------|--------|
| v1.0.0.0 | 2026-02-18 | — | 최초 | 기존 simulator-coding-standards.md를 프로젝트 형식으로 정규화. ML 특화 구현(§4 데이터셋, §6~9 ML 파이프라인, §11 산점도)을 L3-ML로 이동. 범용 패턴(래퍼+순수함수, run/loop/finish, 누적 배열)은 원칙만 잔류. Part 2(선택 메뉴) 신설로 레이아웃·색상·시각화 옵션 체계화. L1 안티패턴 2건(raw 배열, ctx.save) 흡수 | Claude |
| v1.0.0.1 | 2026-02-22 | — | 패치 | 정합성 점검: 참고자료 버전 동기화 — VMP v1.3.0→v1.3.1.0, DMPP v2.1.x→v2.3.0.1, IOTSCS-L3 버전 수정. 영문명 약어 병기 | Changmo Yang & Claude AI |
| v1.0.0.1 | 2026-02-21 | — | 패치 | 영문명 병기 (Simulator Coding Standard, SCS-L2) | Changmo Yang & Claude AI |
| v1.0.0.2 | 2026-02-22 | — | 패치 | 2차 정합성 검증: 참고자료 버전 전면 동기화 — VMP v1.3.1.0, DMPP v2.3.0.1, CDMP v4.0.0.1, GCS-L1 v1.0.0.1, SCS-L2 v1.0.0.1, MLSCS-L3 v1.0.0.1, ECSCS-L3 v1.0.0.1. 영문명 약어 전면 병기 | Changmo Yang & Claude AI |

---

*시뮬레이터코딩표준 (Simulator Coding Standard, SCS-L2) — 교육용 시뮬레이터의 공통 설계·구현 표준*