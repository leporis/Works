# IoT 시뮬레이터 코딩 표준 (IoT Simulator Coding Standard, IOTSCS-L3)

**IoT·마이크로비트 교육용 시뮬레이터의 특화 설계·구현 표준**

**문서 버전: v0.2.0.1**

> **계층**: Level 1 (범용) → Level 2 (시뮬레이터 공통) → **Level 3-IoT (IoT·마이크로비트)**
>
> **상위 문서**: 범용코딩표준 (L1) + 시뮬레이터코딩표준 (L2)의 모든 규칙을 상속
>
> **적용 대상**: 마이크로비트 시뮬레이터, 센서 시각화, 블록코딩 환경, IoT 교육 도구
>
> **선택 메뉴 조합 (L2 Part 2 참조)**: 레이아웃 = 1~2열 자유 배치 / 색상 = 다크 테마 / 시각화 = Canvas + Chart.js + 순수 CSS 혼합
>
> **문서 상태**: 정식 표준. §7 유형별 상세 가이드(A~E) 완성.

---

## 목차

### Part 1: 개요
1. [목적과 범위](#1-목적과-범위)
2. [시뮬레이터 유형 분류](#2-시뮬레이터-유형-분류)

### Part 2: 공통 설계 원칙
3. [다크 테마 색상 시스템](#3-다크-테마-색상-시스템)
4. [CONFIG 도입 방침](#4-config-도입-방침)
5. [센서 데이터 모델링](#5-센서-데이터-모델링)
6. [하드웨어 컴포넌트 구조](#6-하드웨어-컴포넌트-구조)

### Part 3: 유형별 가이드
7. [유형별 상세 구현 가이드](#7-유형별-상세-구현-가이드)
   - [7A. 블록코딩형](#7a-블록코딩형)
   - [7B. 다이어그램형](#7b-다이어그램형)
   - [7C. 센서 시각화형](#7c-센서-시각화형)
   - [7D. 검색·조합형](#7d-검색조합형)
   - [7E. 분석·비교형](#7e-분석비교형)

### Part 4: 체크리스트
8. [IoT 시뮬레이터 체크리스트](#8-iot-시뮬레이터-체크리스트)

---

# Part 1: 개요

---

## 1. 목적과 범위

### 1.1 목적

IoT·마이크로비트 관련 교육용 시뮬레이터를 일관된 품질로 작성하기 위한 특화 표준이다.

### 1.2 ML 시뮬레이터와의 차이

| 항목 | ML 시뮬레이터 (L3-ML) | IoT 시뮬레이터 (이 문서) |
|------|:---:|:---:|
| 레이아웃 | 3-Panel (sidebar-chart-sidebar) | 유형별 상이 (1~2열, 자유 배치) |
| 색상 테마 | 따뜻한 톤 (#FFFBF5) | 다크 테마 (#1a1a2e) |
| 주 강조색 | Apple Red (#E53935) | 시안 (#00d4ff) |
| 상호작용 | 슬라이더 → 차트 | 드래그앤드롭, 블록코딩, 검색 등 다양 |
| 외부 라이브러리 | Chart.js 필수 | 선택적 (2/7만 사용) |
| 폰트 | Noto Sans KR + JetBrains Mono | Segoe UI (주), Noto Sans KR (부) |

### 1.3 마이크로비트 포함 범위

이 문서는 마이크로비트(micro:bit) 관련 시뮬레이터를 포함한다.

| 포함 | 설명 |
|------|------|
| MakeCode 스타일 블록코딩 | 블록 조립·실행 시뮬레이터 |
| 센서 데이터 시각화 | 실시간 그래프, 데이터 로거 |
| 하드웨어 연결도 | I2C, Grove 커넥터 다이어그램 |
| 센서 검색·조합 도구 | 부품 검색, 드래그앤드롭 조합 |
| 데이터 분석·비교 | 규칙 기반 vs ML 비교 도구 |

---

## 2. 시뮬레이터 유형 분류

| 유형 | 설명 | 핵심 기술 | 예시 파일 |
|------|------|----------|----------|
| **A. 블록코딩** | MakeCode 스타일 블록 조립·실행 | 드래그앤드롭, 블록 렌더링 | MakeCode시뮬레이터LED이름표시 |
| **B. 다이어그램** | 하드웨어 연결·시스템 흐름 (정적) | CSS 레이아웃, 배선 시각화 | 마이크로비트GroveI2C연결도 |
| **C. 센서 시각화** | 실시간 센서 데이터 그래프 | Chart.js, 실시간 갱신 | 마이크로비트센서그래프 |
| **D. 검색·조합** | 센서/부품 검색 및 조합 | 검색 필터, 카드 UI | 마이크로비트센서검색도구 |
| **E. 분석·비교** | 규칙 기반 vs ML 비교 | 탭 뷰, 다중 차트 | 수업집중도분석프로그램 |

> **유형 판별 기준**: 시뮬레이터의 주요 상호작용 방식이 어디에 해당하는지로 판단한다.
> 복합 유형(예: 블록코딩 + 센서 시각화)은 주 유형으로 분류한다.

---

# Part 2: 공통 설계 원칙

---

## 3. 다크 테마 색상 시스템

```css
:root {
    /* 1단계 팔레트 (L2 §15 구조 준수) */
    --color-bg-900:     #1a1a2e;
    --color-bg-800:     #16213e;
    --color-bg-700:     #0f3460;
    --color-accent-500: #00d4ff;
    --color-success-500: #00e676;
    --color-danger-500:  #ff5252;

    /* 2단계 의미적 별칭 */
    --primary:    var(--color-accent-500);
    --success:    var(--color-success-500);
    --danger:     var(--color-danger-500);
    --bg-body:    var(--color-bg-900);
    --bg-card:    var(--color-bg-800);
    --text-primary: #e0e0e0;
    --text-secondary: #a0a0a0;
}
```

> 다크 테마에서는 텍스트 대비비(contrast ratio)를 WCAG AA 기준(4.5:1) 이상 유지한다.

---

## 4. CONFIG 도입 방침

현재 IoT 시뮬레이터 7개 중 CONFIG 사용: **0개**. 이는 개선 대상이다.

| 수준 | 적용 기준 |
|------|----------|
| **필수** | 신규 시뮬레이터 (유형 A, C, E) — 상호작용이 있는 시뮬레이터 |
| **권장** | 기존 시뮬레이터 리팩토링 시 |
| **면제** | 유형 B (정적 다이어그램, JS 없음) |

```javascript
// IoT CONFIG 예시
const CONFIG = {
    SENSOR: {
        SAMPLE_RATE: 1000,    // ms
        MAX_HISTORY: 100,     // 그래프 표시 최대 데이터 포인트
    },
    SERIAL: {
        BAUD_RATE: 115200,
        BUFFER_SIZE: 1000,
    },
    CANVAS: { PADDING: 30 },
    ANIMATION: { STEP_DELAY: 500 },
    TOAST_DURATION: 2500,
};
```

---

## 5. 센서 데이터 모델링

```javascript
// 센서 데이터 포인트 표준 구조
const sensorReading = {
    timestamp: Date.now(),
    sensorId: 'temperature_01',
    value: 23.5,
    unit: '°C',
    status: 'normal',  // 'normal' | 'warning' | 'error'
};

// 센서 히스토리 관리
const sensorHistory = {
    readings: [],
    maxSize: CONFIG.SENSOR.MAX_HISTORY,
    
    push(reading) {
        this.readings.push(reading);
        if (this.readings.length > this.maxSize) {
            this.readings.shift();
        }
    }
};
```

---

## 6. 하드웨어 컴포넌트 구조

```javascript
const COMPONENTS = {
    led: {
        type: 'output',
        pins: ['digital'],
        properties: { color: '#ff0000', brightness: 1.0 },
        simulate: (pin, value) => { /* LED on/off or PWM */ }
    },
    button: {
        type: 'input',
        pins: ['digital'],
        properties: { pullup: true },
        read: (pin) => { /* button state: 0 or 1 */ }
    },
    ultrasonic: {
        type: 'sensor',
        pins: ['trigger', 'echo'],
        range: [2, 400],  // cm
        simulate: (targetDistance) => {
            return (targetDistance * 2) / 0.034;  // μs
        }
    },
};
```

> 향후 확장: 온습도, 조도, 가속도, 서보모터 등 컴포넌트 추가.

---

# Part 3: 유형별 가이드

---

## 7. 유형별 상세 구현 가이드

### 유형 요약 (빠른 참조)

| 유형 | 핵심 패턴 | L2 공통 적용 | 체크포인트 |
|------|----------|:---:|---------|
| **A. 블록코딩** | 블록 렌더링 엔진, 인터프리터, 워크스페이스 | §5 finishXxx, §7 run/loop/finish | 블록 실행 상태 관리 |
| **B. 다이어그램** | CSS Grid/Flexbox, 배선 시각화 | §4 hidden 클래스만 (JS 최소화) | 반응형 레이아웃 |
| **C. 센서 시각화** | Chart.js 실시간 갱신, 히스토리 관리 | §5 finishXxx, §8 누적 배열 | 메모리 상한 설정 |
| **D. 검색·조합** | 검색 필터, 카드 UI, 드래그앤드롭 | §6 래퍼+순수 함수 | 필터 상태 관리 |
| **E. 분석·비교** | 탭 뷰, 다중 차트, 예측 UI | §7 run/loop/finish | 탭 간 상태 동기화 |

---

### 7A. 블록코딩형

**적용 예시**: MakeCode 스타일 LED 이름표시 시뮬레이터, 마이크로비트 제어 블록 편집기

#### 7A.1 핵심 구조

블록코딩형은 **워크스페이스 → 인터프리터 → 실행 결과** 3단계로 구성한다.

```javascript
// 블록 정의 구조
const BLOCK_DEFINITIONS = {
    'show_string': {
        category: 'basic',
        label: '문자열 표시',
        color: '#4C97FF',
        inputs: [{ name: 'text', type: 'string', default: 'Hello' }],
        execute: (inputs, state) => {
            state.display = inputs.text;
            renderLEDDisplay(state.display);
        }
    },
    'pause': {
        category: 'basic',
        label: '일시정지 (ms)',
        color: '#4C97FF',
        inputs: [{ name: 'ms', type: 'number', default: 500 }],
        execute: async (inputs, state) => {
            await sleep(inputs.ms);
        }
    },
    'set_led': {
        category: 'led',
        label: 'LED 켜기/끄기',
        color: '#9966FF',
        inputs: [
            { name: 'x', type: 'number', default: 0 },
            { name: 'y', type: 'number', default: 0 },
            { name: 'on', type: 'boolean', default: true }
        ],
        execute: (inputs, state) => {
            state.leds[inputs.y][inputs.x] = inputs.on ? 1 : 0;
            renderLEDMatrix(state.leds);
        }
    }
};

// 실행 상태 관리
const STATE = {
    isRunning: false,
    isPaused: false,
    currentBlockIndex: 0,
    leds: Array(5).fill(null).map(() => Array(5).fill(0)),
    display: '',
    variables: {}
};
```

#### 7A.2 run / loop / finish 패턴 적용 (L2 §7 준수)

```javascript
async function runProgram() {
    if (STATE.isRunning) return;
    STATE.isRunning = true;
    updateRunButton('running');

    const blocks = getWorkspaceBlocks();
    for (let i = 0; i < blocks.length; i++) {
        if (!STATE.isRunning) break;          // 정지 요청 처리
        STATE.currentBlockIndex = i;
        highlightBlock(blocks[i].id);         // 현재 실행 블록 강조
        await executeBlock(blocks[i], STATE);
    }

    finishProgram();
}

function finishProgram() {
    STATE.isRunning = false;
    STATE.currentBlockIndex = -1;
    clearBlockHighlight();
    updateRunButton('idle');
}
```

#### 7A.3 블록 렌더링 규칙

```javascript
// 블록 DOM 생성 — 드래그앤드롭 포함
function createBlockElement(blockType, instanceId) {
    const def = BLOCK_DEFINITIONS[blockType];
    const el = document.createElement('div');
    el.className = 'block';
    el.dataset.blockType = blockType;
    el.dataset.instanceId = instanceId;
    el.style.backgroundColor = def.color;
    el.draggable = true;

    // 입력 필드 생성
    def.inputs.forEach(input => {
        const field = createInputField(input, instanceId);
        el.appendChild(field);
    });

    el.addEventListener('dragstart', onBlockDragStart);
    return el;
}

// 워크스페이스 드롭 처리
function onWorkspaceDrop(e) {
    e.preventDefault();
    const blockType = e.dataTransfer.getData('blockType');
    const instanceId = `${blockType}_${Date.now()}`;
    const el = createBlockElement(blockType, instanceId);
    document.getElementById('workspace').appendChild(el);
}
```

#### 7A.4 LED 5×5 매트릭스 렌더링

```javascript
// Canvas 기반 LED 매트릭스 (L2 §10 Canvas 기초 준수)
function renderLEDMatrix(leds) {
    const canvas = document.getElementById('led-matrix');
    const dpr = window.devicePixelRatio || 1;         // devicePixelRatio 필수
    const size = 200;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const cellSize = size / 5;
    const padding = 4;

    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            const on = leds[row][col] === 1;
            ctx.beginPath();
            ctx.arc(
                col * cellSize + cellSize / 2,
                row * cellSize + cellSize / 2,
                cellSize / 2 - padding,
                0, Math.PI * 2
            );
            ctx.fillStyle = on ? '#ff3333' : '#330000';
            ctx.fill();
        }
    }
}
```

#### 7A.5 안티패턴

```javascript
// ❌ 블록 실행 중 DOM 직접 조작 — STATE를 통해 렌더링 분리할 것
execute: (inputs) => {
    document.getElementById('display').textContent = inputs.text;  // ❌
}

// ✅ STATE 업데이트 후 렌더 함수 호출
execute: (inputs, state) => {
    state.display = inputs.text;
    renderDisplay(state.display);   // ✅
}

// ❌ async 없이 pause 구현 — UI 블로킹 발생
function pause(ms) { const end = Date.now() + ms; while (Date.now() < end) {} }  // ❌

// ✅ async/await + Promise 사용
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));  // ✅
```

---

### 7B. 다이어그램형

**적용 예시**: 마이크로비트 Grove I2C 연결도, 하드웨어 시스템 흐름도

#### 7B.1 핵심 원칙

다이어그램형은 **JS를 최소화**하고 CSS로 레이아웃·배선을 구현한다. 인터랙션이 없으므로 CONFIG 적용 면제 (§4 참조).

```
❌ JS로 동적 SVG 생성       → 유지보수 어려움
✅ CSS Grid + 순수 HTML     → 구조가 명확
✅ CSS border/outline 배선  → 반응형 자동 처리
```

#### 7B.2 그리드 기반 연결도 레이아웃

```css
/* 하드웨어 연결도 기본 그리드 */
.diagram-container {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;   /* 센서 | 마이크로비트 | 출력장치 */
    grid-template-rows: repeat(4, auto);
    gap: 20px;
    padding: 24px;
    background: var(--bg-body);           /* 다크 테마 적용 */
}

/* 컴포넌트 카드 */
.component-card {
    background: var(--bg-card);
    border: 1px solid var(--color-accent-500);
    border-radius: 8px;
    padding: 12px;
    text-align: center;
    color: var(--text-primary);
}

/* 연결선 — CSS border로 구현 */
.wire-horizontal {
    border-top: 2px solid var(--color-accent-500);
    align-self: center;
}
.wire-vertical {
    border-left: 2px solid var(--color-success-500);
    justify-self: center;
    height: 100%;
}

/* 핀 번호 레이블 */
.pin-label {
    font-size: 10px;
    color: var(--text-secondary);
    font-family: 'Courier New', monospace;
}
```

#### 7B.3 I2C 버스 표현 패턴

```html
<!-- SDA/SCL 공유 버스를 CSS로 표현 -->
<div class="i2c-bus-container">
  <div class="bus-line sda-line">
    <span class="bus-label">SDA (P20)</span>
  </div>
  <div class="bus-line scl-line">
    <span class="bus-label">SCL (P19)</span>
  </div>
  <!-- 각 슬레이브 디바이스가 버스에 연결 -->
  <div class="slave-device" style="--bus-position: 1">온습도 센서 (0x40)</div>
  <div class="slave-device" style="--bus-position: 2">조도 센서 (0x23)</div>
  <div class="slave-device" style="--bus-position: 3">OLED 디스플레이 (0x3C)</div>
</div>
```

```css
.slave-device {
    /* CSS 변수로 버스 연결 위치 지정 */
    grid-column: calc(var(--bus-position) + 1);
    border-top: 2px dashed var(--color-accent-500);
    padding-top: 8px;
}
```

#### 7B.4 반응형 처리

```css
/* 모바일: 세로 배치로 전환 */
@media (max-width: 600px) {
    .diagram-container {
        grid-template-columns: 1fr;
        grid-template-rows: auto;
    }
    .wire-horizontal { border-top: none; border-left: 2px solid var(--color-accent-500); }
}
```

---

### 7C. 센서 시각화형

**적용 예시**: 마이크로비트 센서 실시간 그래프, 데이터 로거

#### 7C.1 Chart.js 실시간 갱신 구조

```javascript
// CONFIG 설정 (필수)
const CONFIG = {
    SENSOR: {
        SAMPLE_RATE: 1000,      // ms
        MAX_HISTORY: 60,        // 그래프에 표시할 최대 포인트 수
        UPDATE_INTERVAL: 200,   // 화면 갱신 주기 (ms)
    },
    CHART: {
        ANIMATION_DURATION: 0,  // 실시간 차트는 애니메이션 비활성화
        TENSION: 0.3,
    }
};

// Chart.js 초기화
function initChart(canvasId, label, color) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label,
                data: [],
                borderColor: color,
                backgroundColor: color + '20',
                tension: CONFIG.CHART.TENSION,
                pointRadius: 2,
            }]
        },
        options: {
            animation: { duration: CONFIG.CHART.ANIMATION_DURATION },
            scales: {
                x: { ticks: { color: '#a0a0a0' }, grid: { color: '#333' } },
                y: { ticks: { color: '#a0a0a0' }, grid: { color: '#333' } }
            },
            plugins: { legend: { labels: { color: '#e0e0e0' } } }
        }
    });
}
```

#### 7C.2 센서 히스토리 + 차트 갱신 (L2 §8 누적 배열 패턴 적용)

```javascript
// 센서별 히스토리 관리
const sensorHistories = {
    temperature: { readings: [], chart: null },
    humidity:    { readings: [], chart: null },
    light:       { readings: [], chart: null },
};

// 데이터 추가 — 메모리 상한 유지 (필수)
function addReading(sensorId, value) {
    const hist = sensorHistories[sensorId];
    const reading = {
        timestamp: Date.now(),
        value,
        label: new Date().toLocaleTimeString('ko-KR', { hour12: false })
    };

    hist.readings.push(reading);
    // 메모리 상한: MAX_HISTORY 초과 시 가장 오래된 것 제거
    if (hist.readings.length > CONFIG.SENSOR.MAX_HISTORY) {
        hist.readings.shift();
    }
    updateChart(sensorId);
}

// 차트 갱신
function updateChart(sensorId) {
    const hist = sensorHistories[sensorId];
    if (!hist.chart) return;

    hist.chart.data.labels         = hist.readings.map(r => r.label);
    hist.chart.data.datasets[0].data = hist.readings.map(r => r.value);
    hist.chart.update('none');    // 애니메이션 없이 갱신
}
```

#### 7C.3 시뮬레이션 루프 (L2 §7 run/loop/finish 적용)

```javascript
let loopTimer = null;

function runSimulation() {
    if (loopTimer) return;
    updateControlButton('running');
    loopSimulation();
}

function loopSimulation() {
    // 센서값 시뮬레이션 (노이즈 포함)
    const temp  = 22 + Math.random() * 6 - 1;
    const humid = 55 + Math.random() * 10 - 2;
    const light = Math.floor(Math.random() * 1023);

    addReading('temperature', +temp.toFixed(1));
    addReading('humidity',    +humid.toFixed(1));
    addReading('light',       light);

    updateStatusDisplay({ temp, humid, light });

    loopTimer = setTimeout(loopSimulation, CONFIG.SENSOR.SAMPLE_RATE);
}

function finishSimulation() {
    clearTimeout(loopTimer);
    loopTimer = null;
    updateControlButton('idle');
}
```

#### 7C.4 다중 센서 탭 UI

```javascript
// 탭 전환 — hidden 클래스 패턴 (L2 §4)
function switchSensorTab(sensorId) {
    document.querySelectorAll('.sensor-panel').forEach(p => {
        p.classList.toggle('hidden', p.dataset.sensor !== sensorId);
    });
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.sensor === sensorId);
    });
    // 탭 전환 후 차트 리사이즈 (Chart.js 버그 방지)
    sensorHistories[sensorId].chart?.resize();
}
```

---

### 7D. 검색·조합형

**적용 예시**: 마이크로비트 센서 검색 도구, 부품 드래그앤드롭 조합기

#### 7D.1 센서 카드 데이터 구조

```javascript
const SENSOR_CATALOG = [
    {
        id: 'dht22',
        name: 'DHT22 온습도 센서',
        category: 'environment',
        tags: ['온도', '습도', '디지털', 'Grove'],
        interface: 'Digital',
        voltage: '3.3V~5V',
        pins: ['VCC', 'DATA', 'GND'],
        description: '고정밀 온습도 측정. 범위: -40~80°C, 0~100%RH',
        icon: '🌡️',
        color: '#00d4ff',
        microbitCode: 'DHT22를 마이크로비트 P0에 연결 후 extensions에서 DHT22 추가'
    },
    {
        id: 'bh1750',
        name: 'BH1750 조도 센서',
        category: 'light',
        tags: ['조도', '빛', 'I2C', 'Grove'],
        interface: 'I2C',
        voltage: '3.3V~5V',
        pins: ['VCC', 'SDA', 'SCL', 'GND'],
        description: '디지털 조도 측정. 범위: 1~65535 lux',
        icon: '💡',
        color: '#ffeb3b',
        microbitCode: 'I2C 주소: 0x23 또는 0x5C'
    },
    // ... 추가 센서
];
```

#### 7D.2 래퍼 + 순수 함수 검색 (L2 §6 적용)

```javascript
// 순수 함수 — 입력만으로 결과 결정, 부수효과 없음
function filterSensors(catalog, { keyword, category, interface: iface }) {
    return catalog.filter(sensor => {
        const matchKeyword = !keyword ||
            sensor.name.includes(keyword) ||
            sensor.tags.some(t => t.includes(keyword));
        const matchCategory = !category || sensor.category === category;
        const matchIface    = !iface    || sensor.interface === iface;
        return matchKeyword && matchCategory && matchIface;
    });
}

// 래퍼 — UI 상태에서 조건 수집 후 순수 함수 호출
function applyFilters() {
    const keyword  = document.getElementById('search-input').value.trim();
    const category = document.getElementById('category-select').value;
    const iface    = document.getElementById('interface-select').value;

    const results = filterSensors(SENSOR_CATALOG, { keyword, category, iface });
    renderSensorCards(results);
    updateResultCount(results.length);
}
```

#### 7D.3 센서 카드 렌더링

```javascript
function renderSensorCards(sensors) {
    const container = document.getElementById('sensor-grid');
    container.innerHTML = '';

    if (sensors.length === 0) {
        container.innerHTML = `<div class="no-result">검색 결과가 없습니다.</div>`;
        return;
    }

    sensors.forEach(sensor => {
        const card = document.createElement('div');
        card.className = 'sensor-card';
        card.draggable = true;
        card.dataset.sensorId = sensor.id;
        card.innerHTML = `
            <div class="card-icon" style="color:${sensor.color}">${sensor.icon}</div>
            <div class="card-name">${sensor.name}</div>
            <div class="card-tags">
                ${sensor.tags.map(t => `<span class="tag">${t}</span>`).join('')}
            </div>
            <div class="card-interface">${sensor.interface} · ${sensor.voltage}</div>
        `;
        card.addEventListener('click', () => showSensorDetail(sensor.id));
        card.addEventListener('dragstart', e => {
            e.dataTransfer.setData('sensorId', sensor.id);
        });
        container.appendChild(card);
    });
}
```

#### 7D.4 드롭 조합 영역

```javascript
// 조합 영역에 드롭 → 선택 목록에 추가
const selectedSensors = [];

document.getElementById('drop-zone').addEventListener('drop', e => {
    e.preventDefault();
    const sensorId = e.dataTransfer.getData('sensorId');
    if (selectedSensors.find(s => s.id === sensorId)) {
        showToast('이미 추가된 센서입니다.');
        return;
    }
    const sensor = SENSOR_CATALOG.find(s => s.id === sensorId);
    selectedSensors.push(sensor);
    renderSelectedList();
    checkPinConflicts();   // I2C 주소 충돌·핀 중복 검사
});

// 핀 충돌 검사 (교육적 피드백)
function checkPinConflicts() {
    const i2cSensors = selectedSensors.filter(s => s.interface === 'I2C');
    const hasSameAddress = i2cSensors.length !==
        new Set(i2cSensors.map(s => s.i2cAddress)).size;
    if (hasSameAddress) {
        showWarning('⚠️ I2C 주소 충돌 발생! 같은 주소를 사용하는 센서가 있습니다.');
    }
}
```

---

### 7E. 분석·비교형

**적용 예시**: 수업 집중도 규칙 기반 vs ML 비교 분석, 센서 데이터 예측 비교

#### 7E.1 탭 구조 — 규칙 기반 vs ML

```javascript
const CONFIG = {
    TABS: ['rule', 'ml', 'compare'],
    ANIMATION: { STEP_DELAY: 600 },
    CHART: { MAX_POINTS: 50 },
};

// 탭 전환 (L2 §4 hidden 패턴)
function switchTab(tabId) {
    CONFIG.TABS.forEach(id => {
        document.getElementById(`tab-${id}`)
            .classList.toggle('hidden', id !== tabId);
        document.getElementById(`tab-btn-${id}`)
            .classList.toggle('active', id === tabId);
    });
    STATE.activeTab = tabId;
    renderActiveTab();
}
```

#### 7E.2 단계별 분석 파이프라인 (L2 §7 run/loop/finish 적용)

```javascript
const STATE = {
    isRunning: false,
    step: 0,
    results: { rule: [], ml: [], timestamps: [] },
    activeTab: 'rule'
};

async function runAnalysis() {
    if (STATE.isRunning) return;
    STATE.isRunning = true;
    STATE.step = 0;
    clearResults();
    updateAnalysisButton('running');

    await loopAnalysis();
}

async function loopAnalysis() {
    if (!STATE.isRunning || STATE.step >= CONFIG.CHART.MAX_POINTS) {
        return finishAnalysis();
    }

    const raw = generateSensorSnapshot();          // 1. 데이터 수집

    const ruleResult = applyRuleBase(raw);         // 2a. 규칙 기반 판단
    const mlResult   = applyMLModel(raw);          // 2b. ML 모델 예측

    STATE.results.rule.push(ruleResult);
    STATE.results.ml.push(mlResult);
    STATE.results.timestamps.push(new Date().toLocaleTimeString());

    renderStep(STATE.step, raw, ruleResult, mlResult);   // 3. 결과 시각화
    STATE.step++;

    await sleep(CONFIG.ANIMATION.STEP_DELAY);
    loopTimer = setTimeout(loopAnalysis, 0);       // 비동기 루프 유지
}

function finishAnalysis() {
    STATE.isRunning = false;
    clearTimeout(loopTimer);
    renderComparisonSummary();                     // 4. 비교 요약 표시
    updateAnalysisButton('idle');
}
```

#### 7E.3 규칙 기반 vs ML 결과 비교 렌더링

```javascript
// 비교 요약 — 두 방식의 정확도 차이를 교육적으로 표시
function renderComparisonSummary() {
    const ruleAcc = calcAccuracy(STATE.results.rule);
    const mlAcc   = calcAccuracy(STATE.results.ml);
    const diff    = (mlAcc - ruleAcc).toFixed(1);

    document.getElementById('comparison-panel').innerHTML = `
        <table class="compare-table">
            <thead>
                <tr><th>항목</th><th>규칙 기반</th><th>ML 모델</th></tr>
            </thead>
            <tbody>
                <tr><td>정확도</td>
                    <td>${ruleAcc}%</td>
                    <td>${mlAcc}%</td></tr>
                <tr><td>판단 속도</td>
                    <td>즉시</td>
                    <td>즉시 (학습 후)</td></tr>
                <tr><td>유연성</td>
                    <td>규칙 추가 필요</td>
                    <td>데이터로 자동 학습</td></tr>
                <tr><td>설명 가능성</td>
                    <td>✅ 높음</td>
                    <td>⚠️ 중간</td></tr>
            </tbody>
        </table>
        <div class="insight-box">
            💡 ML 모델이 규칙 기반보다 <strong>${diff}%p</strong>
            ${diff >= 0 ? '높은' : '낮은'} 정확도를 보였습니다.
            ${diff < 0 ? '데이터가 부족하거나 규칙이 잘 설계된 경우 이런 결과가 나올 수 있습니다.' : ''}
        </div>
    `;
    document.getElementById('comparison-panel').classList.remove('initially-hidden');
}
```

---

# Part 4: 체크리스트

---

## 8. IoT 시뮬레이터 체크리스트

### 🔴 Critical (전체 공통)
- [ ] CONFIG/UI_TEXT 분리 (유형 B 면제)
- [ ] 다크 테마 텍스트 대비비 WCAG AA (4.5:1) 이상
- [ ] 센서 히스토리 메모리 상한 (MAX_HISTORY) 설정
- [ ] Canvas 사용 시 devicePixelRatio 적용

### 🔴 Critical (유형별)
- [ ] **A 블록코딩**: STATE 객체로 실행 상태 중앙 관리, async/await로 pause 구현
- [ ] **C 센서 시각화**: Chart.js animation.duration = 0 (실시간 갱신 시 애니메이션 비활성화)
- [ ] **D 검색·조합**: 순수 함수(filterSensors)와 래퍼(applyFilters) 분리
- [ ] **E 분석·비교**: run/loop/finish 파이프라인 적용, 비교 요약 패널 포함

### 🟡 Important (전체 공통)
- [ ] 센서 데이터 포인트 표준 구조 준수 (timestamp, sensorId, value, unit, status)
- [ ] 하드웨어 컴포넌트 COMPONENTS 객체 정의
- [ ] finishXxx 패턴 적용 (로드 경로 2개 이상 시)
- [ ] 유형 판별 후 §7 해당 유형 가이드 적용

### 🟡 Important (유형별)
- [ ] **A 블록코딩**: 블록 실행 중 현재 블록 하이라이트 표시
- [ ] **B 다이어그램**: 모바일 반응형 레이아웃 (CSS Grid → 세로 배치)
- [ ] **C 센서 시각화**: 다중 센서 탭 전환 후 Chart.js resize() 호출
- [ ] **D 검색·조합**: 핀 충돌·I2C 주소 중복 검사 및 교육적 경고 메시지
- [ ] **E 분석·비교**: 규칙 기반/ML 정확도·속도·유연성 비교 표 포함

### 🟢 Nice-to-have
- [ ] 시리얼 모니터 출력 시뮬레이션
- [ ] 회로 연결 오류(단락) 시각적 경고
- [ ] 센서 노이즈 시뮬레이션 (가우시안 노이즈 추가)
- [ ] **A 블록코딩**: 텍스트코딩 전환 뷰 (JavaScript 코드 자동 생성)
- [ ] **D 검색·조합**: 마이크로비트 연결 예제 코드 자동 생성

---

## 참고자료

| # | 자료명 | 유형 | 비고 |
|:-:|--------|------|------|
| 1 | 버전관리지침(VMP)_v1.3.1.0 | 프로젝트 문서 | 버전 체계, 파일명, 세션 인계, 필수 구성요소 |
| 2 | 문서관리지침(DMPP)_v2.3.0.1 | 프로젝트 문서 | 협업 원칙, 이미지 관리, 코드 리뷰 프로세스 |
| 3 | 범용코딩표준(GCS-L1)_v1.0.0.2 | 프로젝트 문서 | 상위 문서 (2단계 상위) |
| 4 | 시뮬레이터코딩표준(SCS-L2)_v1.0.0.2 | 프로젝트 문서 | 상위 문서 (직접 상위) |
| 5 | 코딩관리지침(CDMP)_v4.0.0.2 | 프로젝트 문서 | 리팩토링 절차, SVG, 문서화, 품질 점검 |
| 6 | IoT시뮬레이터작성지침_작성준비_2026-02-18 | 프로젝트 문서 | 7개 시뮬레이터 분석, 유형 분류, 기존 지침 비교 |

---

## 생성/수정 이력

| 버전 | 날짜 | 시간 | 변경 수준 | 변경 내용 | 작성자 |
|------|------|------|-----------|-----------|--------|
| v0.1.0.0 | 2026-02-18 | — | 최초 | 골격 초안 작성. IoT 준비문서 기반 유형 분류(A~E), 다크 테마 팔레트, CONFIG 도입 방침, 센서 데이터 모델, 하드웨어 컴포넌트 구조 정의. 기존 arduino-simulator-standards.md의 마이크로비트 내용 통합 | Claude |
| v0.1.0.1 | 2026-02-21 | — | 패치 | 영문명 병기 (IoT Simulator Coding Standard, IOTSCS-L3), 참고자료 문서관리지침 버전 오기 수정 (v2.1.1.0 → v2.3.0.0) | Changmo Yang & Claude AI |
| v0.2.0.0 | 2026-02-21 | — | 마이너 | §7 유형별 상세 구현 가이드 전면 작성: 7A 블록코딩(BLOCK_DEFINITIONS·run/loop/finish·LED 5×5 렌더링·안티패턴), 7B 다이어그램(CSS Grid·I2C 버스·반응형), 7C 센서 시각화(Chart.js 실시간·히스토리·루프), 7D 검색·조합(SENSOR_CATALOG·래퍼+순수함수·핀충돌검사), 7E 분석·비교(탭구조·파이프라인·비교요약). 목차 유형별 앵커 추가. §8 체크리스트 유형별 항목으로 세분화. 문서 상태 "골격 초안→정식 표준"으로 변경. ⚠️Draft 표기 해제 | Changmo Yang & Claude AI |
| v0.2.0.1 | 2026-02-22 | — | 패치 | 2차 정합성 검증: 참고자료 버전 전면 동기화 — VMP v1.3.1.0, DMPP v2.3.0.1, CDMP v4.0.0.1, GCS-L1 v1.0.0.1, SCS-L2 v1.0.0.1, MLSCS-L3 v1.0.0.1, ECSCS-L3 v1.0.0.1. 영문명 약어 전면 병기 | Changmo Yang & Claude AI |

---

*IoT 시뮬레이터 코딩 표준 (IoT Simulator Coding Standard, IOTSCS-L3) — IoT·마이크로비트 교육용 시뮬레이터의 특화 설계·구현 표준*
