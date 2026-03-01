# 머신러닝 교육용 시뮬레이터 디자인 설계 가이드

**문서 버전: v1.0.0.0**

---

## 목차

1. [개요](#1-개요)
2. [화면 구조](#2-화면-구조)
3. [색상 시스템](#3-색상-시스템)
4. [UI 컴포넌트](#4-ui-컴포넌트)
5. [데이터 입력 시스템](#5-데이터-입력-시스템)
6. [학습 과정 표시](#6-학습-과정-표시)
7. [결과 보고 시스템](#7-결과-보고-시스템)
8. [추론 모드](#8-추론-모드)
9. [시각화 가이드](#9-시각화-가이드)
10. [JavaScript 아키텍처](#10-javascript-아키텍처)
11. [알고리즘별 적용 체크리스트](#11-알고리즘별-적용-체크리스트)
12. [코드 템플릿](#12-코드-템플릿)

---

## 1. 개요

### 1.1 목적

이 문서는 초등 예비교사용 머신러닝 교육 시뮬레이터의 **일관된 사용자 경험**을 제공하기 위한 디자인 설계 가이드입니다. 새로운 ML 알고리즘 시뮬레이터를 개발할 때 이 가이드를 따르면 기존 시뮬레이터와 동일한 인터페이스, 사용 방법, 결과 보고 형식을 유지할 수 있습니다.

### 1.2 적용 대상

| 알고리즘 유형 | 예시 |
|--------------|------|
| 지도학습 (회귀) | 선형 회귀, 다항 회귀 |
| 지도학습 (분류) | KNN, 의사결정트리, 로지스틱 회귀 |
| 비지도학습 | K-means, 계층적 군집화 |
| 신경망 | 퍼셉트론, MLP |

### 1.3 핵심 설계 원칙

| 원칙 | 설명 | 적용 예 |
|------|------|---------|
| **일관성** | 모든 시뮬레이터에서 동일한 레이아웃 | 3열 그리드, 모드 탭 |
| **직관성** | 복잡한 개념을 시각적으로 표현 | 학습 과정 애니메이션 |
| **단계적 학습** | 학습 → 추론 분리 | 모드 탭으로 구분 |
| **즉각적 피드백** | 파라미터 변경 시 실시간 반영 | 슬라이더 → 차트 연동 |
| **오류 시각화** | AI의 불완전함 표현 | 오차선, 잘못된 예측 표시 |

---

## 2. 화면 구조

### 2.1 전체 레이아웃

```
┌─────────────────────────────────────────────────────────────────┐
│                          🏷️ 헤더                                │
│                  [이모지] 제목 [버전 배지]                       │
│                        한 줄 설명                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              [🧠 학습 모드]    [🔮 추론 모드]                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────┬───────────────────────────────┬──────────┐
│          │                               │          │
│  📊      │       📈 시각화 영역          │   ⚙️    │
│ 데이터   │                               │  설정    │
│  패널    │   ┌─────────┬─────────┐       │  패널    │
│          │   │ 손실    │ 데이터  │       │          │
│ 240px    │   │ 그래프  │  차트   │       │ 260px   │
│          │   └─────────┴─────────┘       │          │
│          │                               │          │
└──────────┴───────────────────────────────┴──────────┘

┌─────────────────────────────────────────────────────────────────┐
│    📊 학습 결과    │    📏 성능 분석    │    📽️ 학습 재생     │
│                         결과 패널 (3열)                         │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 CSS 그리드 코드

```css
/* 메인 레이아웃: 3열 그리드 (고정) */
.main-layout {
    display: grid;
    grid-template-columns: 240px 1fr 260px;
    gap: 16px;
    align-items: start;
}

/* 차트 영역: 2열 */
.chart-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

/* 결과 패널: 3열 */
.result-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

/* 반응형 */
@media (max-width: 1024px) {
    .main-layout { grid-template-columns: 1fr !important; }
    .chart-row { grid-template-columns: 1fr; }
    .result-grid { grid-template-columns: 1fr; }
}
```

### 2.3 모드별 화면 구성

| 모드 | 왼쪽 패널 | 중앙 | 오른쪽 패널 |
|------|----------|------|------------|
| 학습 | 데이터 생성/업로드 | 손실 + 데이터 차트 | 학습 설정 |
| 추론 | 예측 입력 | 예측 시각화 (큰 차트) | 예측 결과 |

---

## 3. 색상 시스템

### 3.1 CSS 변수 (필수)

```css
:root {
    /* ===== 주요 색상 ===== */
    --apple-red: #E53935;        /* 강조, 주요 버튼, 회귀선 */
    --apple-red-dark: #C62828;   /* 호버 상태 */
    --apple-green: #43A047;      /* 학습 버튼, 성공, 정답 */
    --apple-green-dark: #2E7D32;
    --honey-yellow: #FFC107;     /* 하이라이트, 예측점, 현재 위치 */
    
    /* ===== 배경 색상 ===== */
    --warm-cream: #FFFBF5;       /* 페이지 배경 */
    --warm-cream-dark: #FFF3E0;  /* 패널 내부 배경 */
    
    /* ===== 텍스트 색상 ===== */
    --text-dark: #3E2723;        /* 제목, 중요 텍스트 */
    --text-medium: #5D4037;      /* 본문 */
    --text-light: #8D6E63;       /* 보조 텍스트, 힌트 */
    
    /* ===== 테두리 & 그림자 ===== */
    --border-color: #FFCCBC;
    --shadow-soft: 0 2px 8px rgba(0,0,0,0.08);
    --shadow-medium: 0 4px 16px rgba(0,0,0,0.12);
}
```

### 3.2 색상 용도 규칙

| 용도 | 색상 | CSS 변수 |
|------|------|----------|
| 주요 버튼 | 🔴 빨강 | `--apple-red` |
| 학습/성공 버튼 | 🟢 녹색 | `--apple-green` |
| 예측점/하이라이트 | 🟡 노랑 | `--honey-yellow` |
| 배경 | 🍦 크림 | `--warm-cream` |
| 본문 텍스트 | 🟤 갈색 | `--text-medium` |
| 오류/경고 | 🔴 빨강 | `--apple-red` |

### 3.3 상태 표시 색상

```css
.status-good { color: #43A047; }   /* 양호: R² > 0.8, 정확도 > 90% */
.status-ok { color: #FFC107; }     /* 보통: R² > 0.5, 정확도 > 70% */
.status-bad { color: #E53935; }    /* 부족: 그 외 */
```

---

## 4. UI 컴포넌트

### 4.1 헤더

```html
<header class="header">
    <h1>🍎 시뮬레이터 제목 <span class="version-badge">v1.0.0</span></h1>
    <p>한 줄 설명 - 무엇을 학습하는지 간단히</p>
</header>
```

```css
.header {
    text-align: center;
    padding: 16px;
    background: white;
    border-radius: 16px;
    box-shadow: var(--shadow-soft);
    margin-bottom: 16px;
}
.header h1 {
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--apple-red);
}
.version-badge {
    display: inline-block;
    background: var(--apple-red);
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
}
```

### 4.2 모드 탭

```html
<div class="mode-tabs">
    <button class="mode-tab active" data-mode="train">🧠 학습 모드</button>
    <button class="mode-tab" data-mode="inference">🔮 추론 모드</button>
</div>
```

```css
.mode-tabs {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 16px;
}
.mode-tab {
    padding: 10px 28px;
    border: none;
    border-radius: 10px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
}
.mode-tab.active {
    background: var(--apple-red);
    color: white;
    box-shadow: var(--shadow-medium);
}
.mode-tab:not(.active) {
    background: white;
    color: var(--text-medium);
    border: 2px solid var(--border-color);
}
```

### 4.3 패널

```html
<div class="panel">
    <h3 class="panel-title">📊 패널 제목</h3>
    <!-- 내용 -->
</div>
```

```css
.panel {
    background: white;
    border-radius: 16px;
    padding: 16px;
    box-shadow: var(--shadow-soft);
}
.panel-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-dark);
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 2px solid var(--warm-cream-dark);
}
```

### 4.4 버튼

```html
<button class="btn btn-primary">✨ 주요 동작</button>
<button class="btn btn-success">⚡ 학습 실행</button>
<button class="btn btn-outline">🗑️ 초기화</button>
```

```css
.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: inherit;
}
.btn-primary {
    background: var(--apple-red);
    color: white;
}
.btn-primary:hover {
    background: var(--apple-red-dark);
    transform: translateY(-2px);
}
.btn-success {
    background: var(--apple-green);
    color: white;
}
.btn-outline {
    background: white;
    color: var(--text-medium);
    border: 2px solid var(--border-color);
}
```

### 4.5 슬라이더

```html
<div class="input-group">
    <label>학습률 (Learning Rate)</label>
    <input type="range" id="learningRate" min="0.001" max="0.1" step="0.001" value="0.01">
    <div class="value-display">
        <span>0.001</span>
        <span class="current" id="learningRateValue">0.01</span>
        <span>0.1</span>
    </div>
</div>
```

```css
.input-group input[type="range"] {
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: var(--warm-cream-dark);
    -webkit-appearance: none;
}
.input-group input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--apple-red);
    cursor: pointer;
}
.value-display {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: var(--text-light);
}
.value-display .current {
    font-weight: 600;
    color: var(--apple-red);
    font-family: 'JetBrains Mono', monospace;
}
```

---

## 5. 데이터 입력 시스템

### 5.1 데이터 탭 구조

```html
<div class="data-tabs">
    <button class="data-tab active" data-tab="preset">프리셋</button>
    <button class="data-tab" data-tab="csv">CSV</button>
    <button class="data-tab" data-tab="manual">직접</button>
</div>
```

### 5.2 프리셋 탭

| 요소 | 설명 |
|------|------|
| 프리셋 버튼 | 4개 (도메인 3개 + 랜덤 1개) |
| 데이터 개수 슬라이더 | 5 ~ 100개 |
| 노이즈 수준 선택 | 5% / 10% / 20% |
| 현재 변수 표시 | "X: 면적 → Y: 가격" |

```javascript
const presets = {
    housing: { name: '주택가격', xLabel: '면적(㎡)', yLabel: '가격(만원)', ... },
    exam: { name: '시험점수', xLabel: '공부시간(h)', yLabel: '점수', ... },
    salary: { name: '급여', xLabel: '경력(년)', yLabel: '연봉(만원)', ... },
    random: { name: '랜덤', xLabel: 'X', yLabel: 'Y', ... }
};
```

### 5.3 CSV 탭

| 요소 | 설명 |
|------|------|
| 파일 업로드 | CSV 파일 선택 |
| 독립변수 선택 | 체크박스 (다중 선택 가능) |
| 종속변수 선택 | 드롭다운 (단일 선택) |
| 가중치 슬라이더 | 2개 이상 선택 시 표시 |
| 내장 데이터셋 | 펭귄, 아이리스, 자동차, 보스턴 |

### 5.4 내장 데이터셋 형식

```javascript
const builtinDatasets = {
    penguin: {
        name: '펭귄',
        headers: ['bill_length_mm', 'bill_depth_mm', 'body_mass_g'],
        headerLabels: ['부리길이(mm)', '부리깊이(mm)', '체중(g)'],
        data: [
            [39.1, 18.7, 3750],
            [39.5, 17.4, 3800],
            // ...
        ]
    }
};
```

### 5.5 다중 변수 → 단일 X 변환

```javascript
// 정규화 후 가중 평균
function calculateWeightedX(row) {
    let weightedSum = 0;
    selectedXVars.forEach(col => {
        const val = parseFloat(row[col]);
        const normalized = ((val - min) / (max - min)) * 100;  // 0~100 정규화
        weightedSum += normalized * varWeights[col];
    });
    return weightedSum;
}
```

---

## 6. 학습 과정 표시

### 6.1 학습 설정 패널

| 파라미터 | 범위 | 기본값 | 설명 |
|----------|------|--------|------|
| 학습률 | 0.001 ~ 0.1 | 0.01 | 가중치 업데이트 크기 |
| 에포크 | 100 ~ 2000 | 500 | 전체 데이터 학습 횟수 |

### 6.2 학습 실행 패턴

```javascript
function runTraining() {
    // 1. 버튼 비활성화
    document.getElementById('btnTrain').disabled = true;
    document.getElementById('btnTrain').textContent = '⏳ 학습 중...';

    // 2. 히스토리 초기화
    lossHistory = [];
    trainingHistory = [];
    const recordInterval = Math.max(1, Math.floor(maxEpochs / 100));

    // 3. 비동기 학습
    setTimeout(() => {
        for (let epoch = 0; epoch < maxEpochs; epoch++) {
            const loss = trainOneEpoch();
            lossHistory.push(loss);
            
            // 100프레임 저장 (재생용)
            if (epoch % recordInterval === 0 || epoch === maxEpochs - 1) {
                trainingHistory.push({
                    epoch: epoch + 1,
                    params: { ...model },
                    loss: loss
                });
            }
        }
        
        // 4. 완료 처리
        model.trained = true;
        finishTraining();
    }, 50);
}
```

### 6.3 학습 과정 재생

```html
<div class="playback-controls">
    <button class="playback-btn play" onclick="playTrainingHistory()">▶️ 재생</button>
    <button class="playback-btn stop" onclick="stopPlayback()">⏹️ 정지</button>
</div>
<div class="playback-progress">
    <div class="progress-bar">
        <div class="progress-fill" id="progressFill"></div>
    </div>
    <div class="progress-label">
        <span id="currentEpochLabel">에포크: 0</span>
        <span id="totalEpochLabel">/ 500</span>
    </div>
</div>
```

---

## 7. 결과 보고 시스템

### 7.1 결과 패널 구조 (3열)

| 열 | 내용 |
|----|------|
| 📊 학습 결과 | 에포크, 손실, 성능지표, 상태 테이블 + 모델 수식 |
| 📏 성능 분석 | 오차선 토글, 평균/최대 오차, MSE |
| 📽️ 학습 재생 | 재생 속도, 재생/정지 버튼, 진행바 |

### 7.2 결과 테이블

```html
<table class="result-table">
    <thead>
        <tr>
            <th>에포크</th>
            <th>손실(MSE)</th>
            <th>R²</th>
            <th>상태</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>500</td>
            <td>0.0123</td>
            <td>0.9234</td>
            <td class="status-good">✅ 양호</td>
        </tr>
    </tbody>
</table>
```

### 7.3 알고리즘별 성능 지표

| 알고리즘 | 주요 지표 | 보조 지표 |
|----------|----------|----------|
| 선형 회귀 | R², MSE | 평균 오차, 최대 오차 |
| 분류 (KNN, 트리) | 정확도 | 정밀도, 재현율, F1 |
| K-means | 실루엣 점수 | 이너셔 |
| 신경망 | 정확도 | 손실 |

### 7.4 모델 수식 표시

```html
<div class="equation-display">
    Y = <span id="eqW">30.5</span> × X + <span id="eqB">985</span>
</div>
```

```css
.equation-display {
    background: var(--warm-cream-dark);
    padding: 10px 12px;
    border-radius: 8px;
    font-family: 'JetBrains Mono', monospace;
    text-align: center;
}
```

### 7.5 오차선 분석

```html
<div class="toggle-row">
    <label class="toggle-label">
        <input type="checkbox" id="showErrorLines" onchange="toggleErrorLines()">
        <span>오차선 표시</span>
    </label>
</div>
<div class="error-stats">
    <div class="error-stat-item">
        <span>평균 오차</span>
        <span id="meanError">--</span>
    </div>
    <div class="error-stat-item">
        <span>최대 오차</span>
        <span id="maxError">--</span>
    </div>
    <div class="error-stat-item">
        <span>MSE</span>
        <span id="mseValue">--</span>
    </div>
</div>
```

---

## 8. 추론 모드

### 8.1 추론 입력 패널

```html
<div class="panel" id="inferencePanel">
    <h3 class="panel-title">🎯 예측 입력</h3>
    
    <div class="input-group">
        <label>🍯 입력 변수 1</label>
        <input type="range" id="predX1" min="..." max="..." value="...">
        <div class="value-display">
            <span>최소</span>
            <span class="current" id="predX1Value">현재값</span>
            <span>최대</span>
        </div>
    </div>
    
    <!-- 다중 변수일 경우 추가 슬라이더 -->
</div>
```

### 8.2 자동 추론 (슬라이더 연동)

```javascript
document.getElementById('predX').addEventListener('input', (e) => {
    document.getElementById('predXValue').textContent = e.target.value;
    updatePrediction();  // 즉시 추론 실행
});
```

### 8.3 예측 결과 표시

```html
<div class="prediction-result">
    <div class="label">예측 Y</div>
    <div class="value" id="predictionValue">2,510원</div>
</div>

<div class="inference-process">
    <div class="inference-row">
        <span>🏷️ 기본값 (b)</span>
        <span id="infBase">985원</span>
    </div>
    <div class="inference-row">
        <span>⭐ X 기여 (w × X)</span>
        <span id="infContrib">+1,525원</span>
    </div>
    <div class="inference-row" style="font-weight: bold; border-top: 2px solid var(--apple-red);">
        <span>💰 최종 예측</span>
        <span id="infTotal">2,510원</span>
    </div>
</div>
```

### 8.4 추론 시각화

| 요소 | 설명 |
|------|------|
| 수직선 | X값에서 모델까지 |
| 수평선 | 모델에서 Y축까지 |
| 예측점 | 노란 원 (반경 12px) |
| 모델 수식 | 차트 상단에 표시 |

---

## 9. 시각화 가이드

### 9.1 Canvas 차트 기본 설정

```javascript
// 점 크기
const POINT_RADIUS = 1.5;         // 데이터 점
const POINT_RADIUS_SMALL = 1.25;  // 배경 점 (추론 모드)
const HIGHLIGHT_RADIUS = 12;       // 예측점

// 선 두께
const LINE_WIDTH_AXIS = 1;
const LINE_WIDTH_MODEL = 3;        // 회귀선, 결정경계
const LINE_WIDTH_ERROR = 2;        // 오차선
```

### 9.2 점 색상 그라데이션

```javascript
// 값에 따른 색상 변화 (녹색 → 빨강)
function getPointColor(normalizedValue) {
    const r = Math.round(67 + normalizedValue * (229 - 67));
    const g = Math.round(160 - normalizedValue * (160 - 57));
    const b = Math.round(71 - normalizedValue * (71 - 53));
    return `rgb(${r}, ${g}, ${b})`;
}
```

### 9.3 알고리즘별 시각화

| 알고리즘 | 메인 시각화 | 보조 시각화 |
|----------|------------|------------|
| 선형 회귀 | 산점도 + 회귀선 | 손실 그래프, 오차선 |
| K-means | 산점도 + 군집 색상 | 중심점, 클러스터 경계 |
| KNN | 산점도 + 클래스 색상 | K개 이웃 연결선, 결정경계 |
| 의사결정트리 | 트리 구조 | 분할 영역 |

### 9.4 손실 그래프 (Chart.js)

```javascript
lossChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'MSE 손실',
            data: [],
            borderColor: '#E53935',
            backgroundColor: 'rgba(229, 57, 53, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { title: { display: true, text: '에포크' } },
            y: { title: { display: true, text: '손실 (MSE)' }, beginAtZero: true }
        }
    }
});
```

---

## 10. JavaScript 아키텍처

### 10.1 전역 변수 패턴

```javascript
// ========== 데이터 ==========
let data = [];              // 학습 데이터 [{x, y}, ...]
let rawCsvData = [];        // CSV 원본
let numericColumns = [];    // 수치형 컬럼
let selectedXVars = [];     // 선택된 독립변수
let varWeights = {};        // 변수별 가중치

// ========== 모델 ==========
let model = {
    // 알고리즘별 파라미터
    trained: false
};

// ========== 정규화 ==========
let normParams = {
    x: { mean: 0, std: 1 },
    y: { mean: 0, std: 1 }
};

// ========== 학습 기록 ==========
let lossHistory = [];       // 손실 기록
let trainingHistory = [];   // 재생용 (100프레임)

// ========== UI 상태 ==========
let lossChart;              // Chart.js 인스턴스
let isPlayingBack = false;
let showErrorLines = false;
let currentPreset = 'default';
let currentDataTab = 'preset';
let varLabels = { x: 'X', y: 'Y' };
```

### 10.2 필수 함수 목록

```javascript
// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', () => {
    initSliders();
    initCharts();
});

// ===== 모드 전환 =====
function switchMode(mode) { /* train / inference */ }

// ===== 데이터 =====
function generateData() { /* 프리셋 데이터 생성 */ }
function handleCSVUpload(event) { /* CSV 처리 */ }
function loadBuiltinDataset(key) { /* 내장 데이터 로드 */ }
function addManualData() { /* 직접 입력 */ }
function calculateWeightedX(row) { /* 다중변수 → 단일X */ }

// ===== 학습 =====
function runTraining() { /* 학습 실행 */ }
function trainOneEpoch() { /* 1 에포크 학습 */ }
function finishTraining() { /* 완료 처리 */ }

// ===== 시각화 =====
function drawScatterChart() { /* 데이터 차트 */ }
function drawInferenceChart() { /* 추론 차트 */ }
function updateLossChart() { /* 손실 그래프 */ }
function toggleErrorLines() { /* 오차선 토글 */ }

// ===== 추론 =====
function updatePrediction() { /* 실시간 추론 */ }

// ===== 재생 =====
function playTrainingHistory() { /* 학습 과정 재생 */ }
function stopPlayback() { /* 재생 중지 */ }

// ===== 유틸리티 =====
function mean(arr) { return arr.reduce((a,b) => a+b, 0) / arr.length; }
function std(arr) { /* 표준편차 */ }
function resetModel() { /* 모델 초기화 */ }
function resetAll() { /* 전체 초기화 */ }
function updateVariableLabels() { /* 변수명 UI 업데이트 */ }
```

---

## 11. 알고리즘별 적용 체크리스트

### 11.1 공통 체크리스트

| # | 항목 | 확인 |
|:-:|------|:----:|
| 1 | 3열 레이아웃 (240px - 가변 - 260px) | ☐ |
| 2 | 학습/추론 모드 탭 | ☐ |
| 3 | 데이터 탭 (프리셋/CSV/직접) | ☐ |
| 4 | 다중 변수 선택 + 가중치 슬라이더 | ☐ |
| 5 | 내장 데이터셋 4개 이상 | ☐ |
| 6 | 학습 설정 (학습률, 에포크) | ☐ |
| 7 | 손실 그래프 (Chart.js) | ☐ |
| 8 | 결과 패널 3열 | ☐ |
| 9 | 학습 과정 재생 | ☐ |
| 10 | 오차/성능 분석 | ☐ |
| 11 | 자동 추론 (슬라이더 연동) | ☐ |
| 12 | 예측점 시각화 (노란 원) | ☐ |
| 13 | 모델 수식 표시 | ☐ |
| 14 | 반응형 디자인 | ☐ |

### 11.2 선형 회귀 추가 항목

| # | 항목 | 확인 |
|:-:|------|:----:|
| 1 | 산점도 + 회귀선 | ☐ |
| 2 | R², MSE 표시 | ☐ |
| 3 | 오차선 (잔차) 시각화 | ☐ |
| 4 | 수식: Y = w × X + b | ☐ |

### 11.3 K-means 추가 항목

| # | 항목 | 확인 |
|:-:|------|:----:|
| 1 | K 선택 슬라이더 | ☐ |
| 2 | 초기화 방법 (랜덤/K-means++) | ☐ |
| 3 | 군집별 색상 구분 | ☐ |
| 4 | 중심점 (X 마커) | ☐ |
| 5 | 클러스터 경계 | ☐ |
| 6 | 실루엣 점수, 이너셔 | ☐ |

### 11.4 KNN 추가 항목

| # | 항목 | 확인 |
|:-:|------|:----:|
| 1 | K 선택 슬라이더 | ☐ |
| 2 | 거리 함수 선택 | ☐ |
| 3 | 클래스별 색상 | ☐ |
| 4 | K개 이웃 연결선 | ☐ |
| 5 | 결정 경계 | ☐ |
| 6 | 정확도, 혼동행렬 | ☐ |

### 11.5 의사결정트리 추가 항목

| # | 항목 | 확인 |
|:-:|------|:----:|
| 1 | 최대 깊이 슬라이더 | ☐ |
| 2 | 분할 기준 (지니/엔트로피) | ☐ |
| 3 | 트리 구조 시각화 | ☐ |
| 4 | 분할 영역 표시 | ☐ |
| 5 | 노드별 불순도 | ☐ |
| 6 | 정확도 | ☐ |

---

## 12. 코드 템플릿

### 12.1 HTML 기본 구조

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎯 [알고리즘명] 시뮬레이터</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        /* CSS 변수 및 스타일 (섹션 3, 4 참조) */
    </style>
</head>
<body>
    <div class="container">
        <!-- 헤더 -->
        <header class="header">
            <h1>🎯 [알고리즘명] 시뮬레이터 <span class="version-badge">v1.0.0</span></h1>
            <p>[한 줄 설명]</p>
        </header>

        <!-- 모드 탭 -->
        <div class="mode-tabs">
            <button class="mode-tab active" data-mode="train" onclick="switchMode('train')">🧠 학습 모드</button>
            <button class="mode-tab" data-mode="inference" onclick="switchMode('inference')">🔮 추론 모드</button>
        </div>

        <!-- 메인 레이아웃 -->
        <div class="main-layout train-mode" id="mainLayout">
            <!-- 왼쪽: 데이터 패널 -->
            <aside class="sidebar-left">
                <div class="panel" id="dataPanel">
                    <!-- 데이터 입력 (섹션 5 참조) -->
                </div>
            </aside>

            <!-- 중앙: 차트 -->
            <div class="chart-area">
                <div class="chart-row" id="trainCharts">
                    <!-- 학습 모드 차트 -->
                </div>
                <div class="chart-row hidden" id="inferenceCharts">
                    <!-- 추론 모드 차트 -->
                </div>
                
                <!-- 결과 패널 -->
                <div class="train-result-panel" id="trainResultPanel" style="display: none;">
                    <!-- 결과 3열 (섹션 7 참조) -->
                </div>
            </div>

            <!-- 오른쪽: 설정 패널 -->
            <aside class="sidebar-right">
                <div class="panel" id="trainPanel">
                    <!-- 학습 설정 (섹션 6 참조) -->
                </div>
                <div class="panel hidden" id="inferenceResultPanel">
                    <!-- 추론 결과 (섹션 8 참조) -->
                </div>
            </aside>
        </div>
    </div>

    <script>
        // JavaScript (섹션 10 참조)
    </script>
</body>
</html>
```

### 12.2 모델별 파라미터 구조

```javascript
// 선형 회귀
let model = { w: 0, b: 0, wReal: 0, bReal: 0, trained: false };

// K-means
let model = { k: 3, centroids: [], assignments: [], trained: false };

// KNN
let model = { k: 5, trainingData: [], trained: false };

// 의사결정트리
let model = { maxDepth: 5, tree: null, trained: false };
```

---

## 참고자료

| # | 자료명 | 유형 | 비고 |
|:-:|--------|------|------|
| 1 | 사과가격예측_선형회귀_시뮬레이터_v1.2.4.1 | 파일 | 원본 디자인 |
| 2 | 범용_선형회귀_시뮬레이터_v1.2.0.0 | 파일 | 범용화 버전 |
| 3 | 문서버전관리가이드_v1.2.2 | 문서 | 버전 관리 지침 |

---

## 생성/수정 이력

| 버전 | 날짜 | 시간 | 변경 수준 | 변경 내용 | 작성자 |
|------|------|------|-----------|-----------|--------|
| v1.0.0.0 | 2026-02-01 | 00:45 | 최초 | 초안 작성 | Claude |

---

*머신러닝 교육용 시뮬레이터 디자인 설계 가이드*
