# ML시뮬레이터코딩표준 (Machine Learning Simulator Coding Standard, MLSCS-L3)

**머신러닝 교육용 시뮬레이터의 특화 설계·구현 표준**

**문서 버전: v1.0.0.2**

> **계층**: Level 1 (범용) → Level 2 (시뮬레이터 공통) → **Level 3-ML (머신러닝)**
>
> **상위 문서**: 범용코딩표준 (L1) + 시뮬레이터코딩표준 (L2)의 모든 규칙을 상속
>
> **적용 대상**: KNN, 선형회귀, 결정트리, K-Means 등 **머신러닝 원리 교육용 시뮬레이터**
>
> **핵심 목표**: 알고리즘의 '블랙박스'를 해소하여 **학습 과정을 투명하게 공개**
>
> **선택 메뉴 조합 (L2 Part 2 참조)**: 레이아웃 = 3-Panel + 모드 탭 / 색상 = 따뜻한 톤 / 시각화 = Canvas 직접

---

## 🎯 머신러닝 시뮬레이터의 교육적 원칙

### 1. 검증된 데이터셋 활용

학술적으로 인정받은 데이터셋을 기본 제공하여 신뢰성을 확보합니다.  
**`type` 값에 따라 필요한 필드가 완전히 다르다. 혼용 금지.**

```javascript
const DATASETS = {
    // ══════════════════════════════════════════════════════════
    // 합성 데이터 (type: 'synthetic')
    // → centers + x1Label/x2Label 필요 | columns/data 불필요
    // ══════════════════════════════════════════════════════════
    'fruit': {
        type:        'synthetic',
        name:        '🍎 과일 분류',
        source:      '합성 데이터',
        description: '당도와 무게를 기준으로 과일 품종을 분류',
        recommended: '분산도 3(보통)에서 가장 명확한 클러스터 형성',
        x1Label:    '🍬 당도 (Brix)',          // 합성 전용: 축 레이블 직접 지정
        x2Label:    '⚖️ 무게 (g)',
        classNames: ['사과', '배', '귤', '포도'],
        centers:    [[30,70],[70,80],[50,30],[80,50]],  // 합성 전용: [x1중심, x2중심]
        // columns / data 없음
    },

    // ══════════════════════════════════════════════════════════
    // 실 데이터 (type: 'real')
    // → columns + columnLabels + data(raw 배열) 필요 | centers/x1Label/x2Label 불필요
    // ══════════════════════════════════════════════════════════
    'iris': {
        type:        'real',
        name:        '🌺 붓꽃 (Iris)',
        source:      'Fisher(1936), UCI ML Repository | CC BY 4.0',
        description: '붓꽃 150송이의 꽃받침·꽃잎 크기로 3가지 품종 분류',
        recommended: '꽃잎길이 × 꽃잎너비 → K=5에서 정확도 96%+',
        columns:      ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
        columnLabels: {
            sepal_length: '꽃받침 길이(cm)', sepal_width: '꽃받침 너비(cm)',
            petal_length: '꽃잎 길이(cm)',   petal_width: '꽃잎 너비(cm)',
        },
        defaultX1:  'petal_length',
        defaultX2:  'petal_width',
        classNames: ['Setosa', 'Versicolor', 'Virginica'],
        // data: [col0, col1, ..., colN, class] — 마지막 값이 클래스
        data: [
            [5.1, 3.5, 1.4, 0.2, 0],
            // ...
        ],
        // centers / x1Label / x2Label 없음
    }
};
```

**필드 매핑 요약**:

| 필드 | 합성(synthetic) | 실(real) | 설명 |
|------|:-:|:-:|------|
| type / name / source / description / recommended / classNames | ✅ | ✅ | 공통 필수 |
| `centers` | ✅ 필수 | ❌ | `[[x1,x2], ...]` 클래스별 중심점 좌표 |
| `x1Label` / `x2Label` | ✅ 필수 | ❌ | 축 레이블 직접 지정 |
| `columns` / `columnLabels` | ❌ | ✅ 필수 | 컬럼명 배열 + 한글명 매핑 객체 |
| `defaultX1` / `defaultX2` | ❌ | ✅ 권장 | 드롭다운 기본 선택 변수 |
| `data` (raw 배열) | ❌ | ✅ 필수 | 마지막 열 = 클래스 인덱스 |

```javascript
// 합성 데이터 생성 함수 (centers 활용)
function generateSyntheticData(ds) {
    const spread = parseInt(document.getElementById('dataSpread').value) * 8;
    data = [];
    for (let c = 0; c < classCount; c++) {
        const [cx, cy] = ds.centers[c];
        for (let i = 0; i < Math.floor(count / classCount); i++) {
            data.push({
                x1: Math.max(0, Math.min(100, cx + (Math.random() - 0.5) * spread)),
                x2: Math.max(0, Math.min(100, cy + (Math.random() - 0.5) * spread)),
                class: c,
            });
        }
    }
    varLabels = { x1: ds.x1Label, x2: ds.x2Label };  // x1Label/x2Label 직접 사용
    finishDataLoad();
}

// 실 데이터 로드 함수 (columns + data 활용)
function loadRealDataset(ds) {
    const x1Idx    = ds.columns.indexOf(x1Col);
    const x2Idx    = ds.columns.indexOf(x2Col);
    const classIdx = ds.columns.length;             // 마지막 열 = 클래스
    const x1Vals   = ds.data.map(r => r[x1Idx]);
    const x1Min = Math.min(...x1Vals), x1Max = Math.max(...x1Vals);
    const x2Vals   = ds.data.map(r => r[x2Idx]);
    const x2Min = Math.min(...x2Vals), x2Max = Math.max(...x2Vals);

    data = ds.data.map(r => ({
        x1:    ((r[x1Idx] - x1Min) / (x1Max - x1Min || 1)) * 100,
        x2:    ((r[x2Idx] - x2Min) / (x2Max - x2Min || 1)) * 100,
        class: r[classIdx],
    }));
    varLabels = { x1: ds.columnLabels[x1Col], x2: ds.columnLabels[x2Col] };  // columnLabels 사용
    finishDataLoad();
}
```

**✅ Claude 작성 규칙**:
- 모든 데이터셋에 출처(source) + 라이선스 명시
- 교육적 추천 사항(recommended) 포함
- 실 데이터는 최소 50개 샘플 포함
- 합성/실 데이터 필드를 혼용하지 않는다

---

### 2. 엄격한 데이터 분할 (Train/Test Split)

머신러닝의 핵심 개념인 **일반화 성능 평가**를 정확히 구현합니다.

```javascript
// 데이터 분할 설정
const SPLIT_CONFIG = {
    DEFAULT_RATIO: 70,      // 기본 70% 훈련 데이터
    MIN_RATIO: 60,          // 최소 60% — 50:50은 학습량 부족
    MAX_RATIO: 80,          // 최대 80% — 90:10은 평가 신뢰도 저하
    STEP: 10,               // 10% 단위: 60:40 / 70:30 / 80:20 세 가지
    MIN_TEST_SAMPLES: 10,   // 최소 테스트 샘플 수
};

// 데이터 분할 함수
function splitData(data, trainRatio, shuffle = true) {
    // 입력 검증
    if (!data || data.length === 0) {
        throw new Error('데이터가 비어있습니다');
    }
    
    if (trainRatio < SPLIT_CONFIG.MIN_RATIO || trainRatio > SPLIT_CONFIG.MAX_RATIO) {
        throw new Error(`분할 비율은 ${SPLIT_CONFIG.MIN_RATIO}-${SPLIT_CONFIG.MAX_RATIO}% 범위여야 합니다`);
    }
    
    // 데이터 복사 (원본 보존)
    let processData = [...data];
    
    // 섞기 (재현 가능하도록 시드 옵션)
    if (shuffle) {
        processData = shuffleArray(processData);
    }
    
    // 분할 인덱스 계산
    const splitIndex = Math.round(processData.length * trainRatio / 100);
    
    // 최소 테스트 샘플 확인
    const testCount = processData.length - splitIndex;
    if (testCount < SPLIT_CONFIG.MIN_TEST_SAMPLES) {
        throw new Error(`테스트 데이터가 너무 적습니다 (최소 ${SPLIT_CONFIG.MIN_TEST_SAMPLES}개 필요)`);
    }
    
    // 분할
    const trainData = processData.slice(0, splitIndex);
    const testData = processData.slice(splitIndex);
    
    // 상태 업데이트
    updateState({
        trainData,
        testData,
        splitRatio: trainRatio,
        isSplit: true
    }, true);  // 히스토리 저장
    
    return { trainData, testData };
}

// 분할 정보 UI 업데이트
function updateSplitInfoUI() {
    const { trainData, testData, data } = AppState;
    
    if (!trainData || !testData) return;
    
    const trainPercent = (trainData.length / data.length * 100).toFixed(1);
    const testPercent = (testData.length / data.length * 100).toFixed(1);
    
    // 진행률 바 업데이트
    document.getElementById('splitBarTrain').style.width = trainPercent + '%';
    document.getElementById('splitBarTest').style.width = testPercent + '%';
    
    // 개수 표시
    document.getElementById('splitTrainCount').textContent = 
        `훈련: ${trainData.length}개 (${trainPercent}%)`;
    document.getElementById('splitTestCount').textContent = 
        `테스트: ${testData.length}개 (${testPercent}%)`;
    
    // 패널 표시
    document.getElementById('splitInfoBox').style.display = 'block';
}

// 분할 비율 슬라이더
function initSplitSlider() {
    initSlider('splitRatioSlider', 'splitRatioValue', (ratio) => {
        if (AppState.data.length > 0) {
            try {
                splitData(AppState.data, ratio);
                updateSplitInfoUI();
                drawScatterChart();  // 시각화 업데이트
                showToast(`데이터 분할 완료: ${ratio}% 훈련`, 'success');
            } catch (error) {
                showToast(error.message, 'error');
            }
        }
    });
}
```

**HTML 구조**:
```html
<div class="control-group">
    <label>
        <span class="label-text">훈련/테스트 분할</span>
        <span class="label-value" id="splitRatioValue">70</span>%
    </label>
    <input type="range" 
           id="splitRatioSlider" 
           min="60" 
           max="80" 
           value="70" 
           step="10" 
           class="slider">
</div>

<div id="splitInfoBox" class="info-box" style="display: none;">
    <h3>데이터 분할</h3>
    <div class="split-bar">
        <div id="splitBarTrain" class="split-bar-train"></div>
        <div id="splitBarTest" class="split-bar-test"></div>
    </div>
    <div class="split-info">
        <span id="splitTrainCount" class="split-train">훈련: 0개</span>
        <span id="splitTestCount" class="split-test">테스트: 0개</span>
    </div>
</div>
```

**CSS**:
```css
.split-bar {
    display: flex;
    height: 24px;
    border-radius: 4px;
    overflow: hidden;
    margin: 8px 0;
}

.split-bar-train {
    background: #2196F3;
    transition: width 0.3s ease;
}

.split-bar-test {
    background: #FF9800;
    transition: width 0.3s ease;
}

.split-info {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
}

.split-train { color: #2196F3; }
.split-test { color: #FF9800; }
```

**✅ Claude 작성 규칙**:
- 분할 비율: **60~80% (10% 단위)** — 60:40 / 70:30 / 80:20 세 가지 선택
  - 50:50 금지: 학습 데이터 부족으로 모델 성능 저하
  - 90:10 금지: 테스트 샘플 부족으로 평가 신뢰도 저하
- 기본값: 70% 훈련 / 30% 테스트
- 최소 테스트 샘플: 10개
- 데이터 섞기 (Fisher-Yates shuffle) 기본 활성화
- 시각적 진행률 바로 비율 표시
- 훈련/테스트 데이터를 산점도에서 **모양으로 구분** (아래 섹션 참고)

---

### 3. 분류 실행 — 3단계 파이프라인 (필수)

머신러닝 시뮬레이터의 분류 실행은 **run → loop → finish** 3단계로 명확히 분리한다.  
`async/await` 방식은 **금지** — `setTimeout` 재귀 패턴을 사용해야 타이머를 명시적으로 관리하고 즉시 중단할 수 있다.

```javascript
// ══════════════════════════════════════════════════════
// 1단계: runClassification() — 검증 + 초기화 + 루프 시작
// ══════════════════════════════════════════════════════
function runClassification() {
    // ① 검증
    if (data.length === 0) { showToast(UI_TEXT.ERROR_NO_DATA, 'error'); return; }
    if (data.length < CONFIG.MIN_DATA_FOR_SPLIT) { showToast(UI_TEXT.ERROR_TOO_FEW, 'warning'); return; }

    // ② 이전 실행 타이머 정리 (중복 실행 방지)
    stopTestAnim();
    stopKAnimation();

    // ③ 파라미터 수집
    kValue = parseInt(document.getElementById('kValue').value);
    distanceMethod = document.getElementById('distanceMethod').value;

    // ④ 상태 초기화
    testAnimResults = [];
    splitData(splitRatio);        // 데이터 분할
    updateSplitInfoUI();          // 분할 정보 표시
    drawScatterChart();
    drawBoundaryChart();

    // ⑤ Progress UI 준비
    const progressBox = document.getElementById('evalProgressBox');
    progressBox.classList.remove('initially-hidden');
    progressBox.style.display = 'block';
    document.getElementById('evalItemList').innerHTML = '';
    document.getElementById('evalProgressFill').style.width = '0%';
    document.getElementById('evalCounter').textContent = `0 / ${testData.length}`;

    // ⑥ 루프 시작
    let idx = 0;
    evalNext();

    // ══════════════════════════════════════════════════
    // 2단계: evalNext() — 1포인트씩 평가 + 진행 UI 갱신
    // ══════════════════════════════════════════════════
    function evalNext() {
        if (idx >= testData.length) { finishClassification(); return; }

        const d = testData[idx];
        const result = knnClassifyFrom(d, kValue, distanceMethod, trainData);
        const correct = result.predictedClass === d.class;

        // 결과 누적 (testData와 인덱스 1:1 대응)
        testAnimResults.push({ point: d, predicted: result.predictedClass, actual: d.class, correct });

        // 진행 UI 4요소 동시 갱신
        const pct = ((idx + 1) / testData.length * 100).toFixed(0);
        document.getElementById('evalProgressFill').style.width  = pct + '%';       // ① 바
        document.getElementById('evalCounter').textContent = `${idx+1} / ${testData.length}`; // ② 카운터

        const predName   = activeClassNames[result.predictedClass] || 'C' + result.predictedClass;
        const actualName = activeClassNames[d.class] || 'C' + d.class;
        const row = document.createElement('div');                                   // ③ 로그 행
        row.className = 'eval-item-row';
        row.innerHTML = `<span>${correct ? '✅' : '❌'}</span><span>#${idx+1} 실제: ${actualName} → 예측: ${predName}</span>`;
        const list = document.getElementById('evalItemList');
        list.appendChild(row);
        list.scrollTop = list.scrollHeight;                                          // ④ 자동 스크롤

        drawScatterChartWithHighlight(idx);   // 현재 포인트 강조

        idx++;
        testAnimTimer = setTimeout(evalNext, CONFIG.EVAL_ANIM_DELAY);
    }
}

// ══════════════════════════════════════════════════════
// 3단계: finishClassification() — 집계 + 테이블/차트 갱신
// ══════════════════════════════════════════════════════
function finishClassification() {
    testAnimTimer = null;

    // 현재 K 정확도
    const correctCount = testAnimResults.filter(r => r.correct).length;
    const testAcc = (correctCount / testData.length * 100).toFixed(1);
    document.getElementById('splitTestAcc').textContent = testAcc + '%';

    // 모든 K값별 정확도 계산 (캐시)
    const kAccuracies = computeAllKAccuracies();
    const bestK = getBestK();

    // 혼동행렬 ① — testAnimResults 직접 활용
    const confMatrix = buildConfMatrixFromResults();

    // 결과 테이블·차트 갱신
    updateResultTable(kAccuracies, kValue, bestK);
    updateConfusionMatrix(confMatrix);
    updateKChart(kAccuracies);

    // 결과 패널 표시
    const resultPanel = document.getElementById('resultPanel');
    resultPanel.classList.remove('initially-hidden');
    resultPanel.style.display = 'block';

    isClassified = true;
    drawScatterChart();
    drawBoundaryChart();
    showToast(`⚡ K=${kValue} 테스트 정확도 ${testAcc}% · 최적 K=${bestK}`, 'success');
}

// 혼동행렬 생성 — 두 가지 모드
function buildConfMatrixFromResults() {
    // 모드 ①: runClassification 완료 → testAnimResults 직접 활용
    const matrix = Array(classCount).fill(null).map(() => Array(classCount).fill(0));
    testAnimResults.forEach(r => { matrix[r.actual][r.predicted]++; });
    return matrix;
}

function buildConfMatrixFromBestK(bestK) {
    // 모드 ②: playKAnimation 완료 → bestK로 testData 재분류
    const matrix = Array(classCount).fill(null).map(() => Array(classCount).fill(0));
    testData.forEach(d => {
        const result = knnClassifyFrom(d, bestK, distanceMethod, trainData);
        matrix[d.class][result.predictedClass]++;
    });
    return matrix;
}
```

> **async/await 금지 이유**: `await` 기반 루프는 `clearTimeout`으로 즉시 중단이 불가능하다.  
> `setTimeout` 재귀 패턴은 `testAnimTimer`에 타이머 참조를 저장하므로 `stopTestAnim()`으로 언제든 즉시 중단 가능.

**각 단계의 책임**:

| 단계 | 함수 | 책임 |
|------|------|------|
| 1 | `runClassification()` | 검증 · 분할 · UI 초기화 · 루프 시작 |
| 2 | `evalNext()` | 1포인트 분류 · 결과 누적 · 진행 UI 갱신 · 재귀 |
| 3 | `finishClassification()` | 집계 · 테이블/차트 갱신 · 패널 표시 |

> **규칙**: 각 단계의 책임을 넘지 않는다. run이 결과를 직접 처리하거나, finish가 분할을 재실행하는 혼재 패턴은 금지.

---

### 3-1. testAnimResults[] — 평가 결과 누적 배열 패턴

`testAnimResults`는 `testData`와 **인덱스 1:1 대응**하는 평가 결과 배열이다.  
평가 진행 중엔 앞부분만 채워지고, Canvas 렌더링에서 인덱스로 직접 참조한다.

```javascript
// ─── 선언 및 초기화 (finishDataLoad / resetAll에서 반드시 초기화) ───
let testAnimResults = [];

// ─── evalNext() 안에서 누적 push ───
testAnimResults.push({
    point:     d,               // testData[idx]와 동일한 객체
    predicted: result.predictedClass,
    actual:    d.class,
    correct:   result.predictedClass === d.class,
});
// → testAnimResults[0] = testData[0]의 결과
// → testAnimResults[k] = testData[k]의 결과  (평가 완료된 것만 존재)

// ─── drawScatterChart() 안에서 인덱스로 참조 ───
testData.forEach((d, idx) => {
    drawDiamond(ctx, scaleX(d.x1), scaleY(d.x2), d.class);

    if (testAnimResults[idx]) {       // 아직 평가 안 된 포인트는 undefined → 가드 필수
        const { correct } = testAnimResults[idx];
        ctx.fillStyle = correct ? CONFIG.COLOR.SUCCESS : CONFIG.COLOR.DANGER;
        ctx.fillText(correct ? '✓' : '✗', cx, cy - s - 4);
    }
});

// ─── finishClassification()에서 혼동행렬 직접 생성 (모드 ①) ───
function buildConfMatrixFromResults() {
    const matrix = Array(classCount).fill(null).map(() => Array(classCount).fill(0));
    testAnimResults.forEach(r => { matrix[r.actual][r.predicted]++; });
    return matrix;
}

// ─── playKAnimation() 완료 시 bestK로 재분류 (모드 ②) ───
function buildConfMatrixFromBestK(bestK) {
    const matrix = Array(classCount).fill(null).map(() => Array(classCount).fill(0));
    testData.forEach(d => {
        const result = knnClassifyFrom(d, bestK, distanceMethod, trainData);
        matrix[d.class][result.predictedClass]++;
    });
    return matrix;
}
```

> **핵심 규칙**:  
> 1. `testAnimResults[idx]` 접근 시 항상 `if (testAnimResults[idx])` 가드 사용  
> 2. `resetAll()` 및 `finishDataLoad()`에서 `testAnimResults = []` 초기화 필수  
> 3. 혼동행렬 생성은 두 모드를 구분: runClassification 완료(모드①) vs playKAnimation 완료(모드②)

---

#### 4.1 실시간 진행 표시

```javascript
// 진행 상태 표시
function showProgressBox() {
    const box = document.getElementById('evalProgressBox');
    box.style.display = 'block';
    box.classList.remove('fade-out');
}

function hideProgressBox() {
    const box = document.getElementById('evalProgressBox');
    box.classList.add('fade-out');
    setTimeout(() => {
        box.style.display = 'none';
    }, 300);
}

// 테스트 포인트 하이라이트
function highlightTestPoint(point, prediction) {
    // Canvas에 강조 표시
    ctx.save();
    
    const x = scales.scaleX(point.x);
    const y = scales.scaleY(point.y);
    
    // 펄스 효과
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fillStyle = prediction.actual === prediction.predicted 
        ? 'rgba(76, 175, 80, 0.3)'  // 정답: 초록
        : 'rgba(244, 67, 54, 0.3)';  // 오답: 빨강
    ctx.fill();
    
    // 포인트
    ctx.beginPath();
    ctx.arc(x, y, CONFIG.POINT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.COLORS.CLASSES[point.class];
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
}
```

**HTML**:
```html
<div id="evalProgressBox" class="progress-box">
    <h3>평가 진행 중</h3>
    <div class="progress-bar-container">
        <div id="progressBar" class="progress-bar"></div>
    </div>
    <p id="progressText" class="progress-text">0 / 0</p>
</div>
```

**✅ Claude 작성 규칙**:
- "현재 / 전체" 형식으로 진행률 표시
- 정답/오답 시각적 피드백 (초록/빨강)
- 진행 중인 포인트 펄스 효과
- 완료 시 1초 후 페이드아웃

#### 4.2 과정 재생 (Playback)

```javascript
// 히스토리 재생 컨트롤
function initPlaybackControls() {
    document.getElementById('playBtn').addEventListener('click', () => {
        playHistory(1);
    });
    
    document.getElementById('playFastBtn').addEventListener('click', () => {
        playHistory(2);
    });
    
    document.getElementById('playSlowBtn').addEventListener('click', () => {
        playHistory(0.5);
    });
    
    document.getElementById('pauseBtn').addEventListener('click', stopPlayback);
    
    document.getElementById('stepForwardBtn').addEventListener('click', () => {
        seekToStep(AppState.currentHistoryIndex + 1);
    });
    
    document.getElementById('stepBackBtn').addEventListener('click', () => {
        seekToStep(AppState.currentHistoryIndex - 1);
    });
    
    // 진행률 슬라이더
    const seekBar = document.getElementById('historySeekBar');
    seekBar.addEventListener('input', (e) => {
        const index = parseInt(e.target.value);
        seekToStep(index);
    });
}

// 재생 UI 업데이트
function updatePlaybackUI(index, total, label) {
    document.getElementById('playbackStep').textContent = `${index + 1} / ${total}`;
    document.getElementById('playbackLabel').textContent = label || '';
    
    const seekBar = document.getElementById('historySeekBar');
    seekBar.max = total - 1;
    seekBar.value = index;
}
```

**HTML**:
```html
<div class="playback-controls">
    <h3>과정 재생</h3>
    <div class="playback-buttons">
        <button id="playSlowBtn" title="느리게 (0.5x)">🐢</button>
        <button id="playBtn" title="재생 (1x)">▶️</button>
        <button id="playFastBtn" title="빠르게 (2x)">⏩</button>
        <button id="pauseBtn" title="일시정지">⏸️</button>
        <button id="stepBackBtn" title="이전 단계">⏮️</button>
        <button id="stepForwardBtn" title="다음 단계">⏭️</button>
    </div>
    <input type="range" 
           id="historySeekBar" 
           min="0" 
           max="100" 
           value="0" 
           class="seek-bar">
    <div class="playback-info">
        <span id="playbackStep">0 / 0</span>
        <span id="playbackLabel"></span>
    </div>
</div>
```

**✅ Claude 작성 규칙**:
- 재생 속도: 0.5x, 1x, 2x
- 단계별 이동 (이전/다음 버튼)
- 시크바로 특정 지점 이동
- 현재 단계/전체 단계 표시
- 각 단계에 레이블 표시

#### 4.3 동적 시각화 (Decision Boundary)

```javascript
// 결정 경계 그리기
function drawDecisionBoundary() {
    if (!AppState.model) return;
    
    const { width, height } = size;
    const padding = CONFIG.CANVAS.PADDING;
    const resolution = 2;  // 해상도 (픽셀 단위)
    
    // 오프스크린 캔버스 (성능 최적화)
    const offCanvas = document.createElement('canvas');
    offCanvas.width = width;
    offCanvas.height = height;
    const offCtx = offCanvas.getContext('2d');
    
    // 그리드 순회
    for (let px = padding; px < width - padding; px += resolution) {
        for (let py = padding; py < height - padding; py += resolution) {
            // 픽셀 → 데이터 좌표
            const x = scales.inverseX(px);
            const y = scales.inverseY(py);
            
            // 예측
            const prediction = AppState.model.predict({ x, y });
            
            // 색상 (투명도 낮춤)
            const color = CONFIG.COLORS.CLASSES[prediction.class];
            offCtx.fillStyle = color.replace(')', ', 0.2)').replace('rgb', 'rgba');
            offCtx.fillRect(px, py, resolution, resolution);
        }
    }
    
    // 메인 캔버스에 그리기
    ctx.drawImage(offCanvas, 0, 0);
}
```

**✅ Claude 작성 규칙**:
- 오프스크린 캔버스 사용 (성능)
- 해상도 조절 가능 (1-5px)
- 투명도 0.2로 데이터 가려지지 않게
- 모델 변경 시 자동 업데이트

---

### 5. 사용자 친화적 추론 (Inference) 인터페이스

#### 5.1 슬라이더 기반 입력

```html
<div class="inference-panel">
    <h3>새로운 데이터 추론</h3>
    
    <div class="control-group">
        <label>
            <span id="feature1Label">X₁</span>
            <span id="feature1Value">50</span>
        </label>
        <input type="range" 
               id="feature1Slider" 
               min="0" 
               max="100" 
               value="50" 
               step="0.1" 
               class="slider">
    </div>
    
    <div class="control-group">
        <label>
            <span id="feature2Label">X₂</span>
            <span id="feature2Value">50</span>
        </label>
        <input type="range" 
               id="feature2Slider" 
               min="0" 
               max="100" 
               value="50" 
               step="0.1" 
               class="slider">
    </div>
    
    <div class="inference-result">
        <h4>예측 결과</h4>
        <div class="result-item">
            <span class="result-label">클래스:</span>
            <span id="predictedClass" class="result-value">-</span>
        </div>
        <div class="result-item">
            <span class="result-label">신뢰도:</span>
            <span id="confidence" class="result-value">-</span>
        </div>
    </div>
</div>
```

```javascript
// 추론 슬라이더 초기화
function initInferenceSliders() {
    let currentPoint = { x: 50, y: 50 };
    
    initSlider('feature1Slider', 'feature1Value', (value) => {
        currentPoint.x = value;
        updateInference(currentPoint);
    });
    
    initSlider('feature2Slider', 'feature2Value', (value) => {
        currentPoint.y = value;
        updateInference(currentPoint);
    });
    
    // 초기 예측
    updateInference(currentPoint);
}

// 실시간 추론 업데이트
function updateInference(point) {
    if (!AppState.model) {
        document.getElementById('predictedClass').textContent = '모델 없음';
        document.getElementById('confidence').textContent = '-';
        return;
    }
    
    // 예측
    const prediction = AppState.model.predict(point);
    
    // 결과 표시
    const className = AppState.classNames[prediction.class] || `클래스 ${prediction.class}`;
    document.getElementById('predictedClass').textContent = className;
    document.getElementById('predictedClass').style.color = CONFIG.COLORS.CLASSES[prediction.class];
    
    document.getElementById('confidence').textContent = prediction.confidence.toFixed(1) + '%';
    
    // Canvas에 표시
    drawInferencePoint(point, prediction);
}

// 추론 포인트 표시
function drawInferencePoint(point, prediction) {
    ctx.save();
    
    const x = scales.scaleX(point.x);
    const y = scales.scaleY(point.y);
    
    // 외곽 링 (펄스 효과)
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.strokeStyle = CONFIG.COLORS.CLASSES[prediction.class];
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 중앙 포인트
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.COLORS.CLASSES[prediction.class];
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 레이블
    ctx.fillStyle = '#333';
    ctx.font = CONFIG.FONTS.LABEL;
    ctx.fillText('추론', x + 10, y - 10);
    
    ctx.restore();
}
```

**✅ Claude 작성 규칙**:
- 슬라이더 0.1 단위로 정밀 조절
- 슬라이더 변경 시 즉각 반응 (디바운싱 50ms)
- 예측 결과 색상으로 표시
- Canvas에 추론 포인트 시각화
- 신뢰도 백분율 표시

---

### 6. 데이터 시각화 및 결과 보고

#### 6.1 이중 표시 (테이블 + 그래프)

```html
<div class="results-panel">
    <h3>평가 결과</h3>
    
    <!-- 테이블 -->
    <table class="results-table">
        <thead>
            <tr>
                <th>지표</th>
                <th>값</th>
                <th>평가</th>
            </tr>
        </thead>
        <tbody id="resultsTableBody">
            <!-- 동적 생성 -->
        </tbody>
    </table>
    
    <!-- 그래프 -->
    <div class="chart-container">
        <canvas id="metricsChart"></canvas>
    </div>
</div>
```

```javascript
// 결과 테이블 업데이트
function displayResults(results) {
    const tbody = document.getElementById('resultsTableBody');
    
    // 평가 기준
    const getStatus = (accuracy) => {
        if (accuracy >= 90) return { icon: '✅', text: '양호', class: 'good' };
        if (accuracy >= 70) return { icon: '⚠️', text: '보통', class: 'fair' };
        return { icon: '❌', text: '부족', class: 'poor' };
    };
    
    const status = getStatus(results.accuracy);
    
    tbody.innerHTML = `
        <tr>
            <td>전체 정확도</td>
            <td>${results.accuracy.toFixed(1)}%</td>
            <td class="status-${status.class}">${status.icon} ${status.text}</td>
        </tr>
        <tr>
            <td>정답 개수</td>
            <td>${results.correct} / ${results.total}</td>
            <td></td>
        </tr>
        ${results.classMetrics.map(cm => `
            <tr>
                <td>${AppState.classNames[cm.class]}</td>
                <td>${cm.accuracy.toFixed(1)}%</td>
                <td>(${cm.samples}개)</td>
            </tr>
        `).join('')}
    `;
    
    // 그래프 업데이트
    updateMetricsChart(results);
}

// Chart.js로 지표 그래프
function updateMetricsChart(results) {
    const ctx = document.getElementById('metricsChart').getContext('2d');
    
    if (window.metricsChart) {
        window.metricsChart.destroy();
    }
    
    window.metricsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: results.classMetrics.map(cm => AppState.classNames[cm.class]),
            datasets: [{
                label: '클래스별 정확도 (%)',
                data: results.classMetrics.map(cm => cm.accuracy),
                backgroundColor: results.classMetrics.map((cm, i) => CONFIG.COLORS.CLASSES[i]),
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: (value) => value + '%'
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `정확도: ${context.parsed.y.toFixed(1)}%`
                    }
                }
            }
        }
    });
}
```

**✅ Claude 작성 규칙**:
- 정확도 기준: ≥90% 양호, ≥70% 보통, <70% 부족
- 아이콘으로 즉각 인지 (✅⚠️❌)
- 테이블과 그래프 동기화
- Chart.js 사용 (막대 그래프)
- 클래스별 색상 일관성 유지

#### 6.2 Confusion Matrix

```javascript
// Confusion Matrix 표시
function displayConfusionMatrix(matrix) {
    const container = document.getElementById('confusionMatrix');
    const classes = Object.keys(matrix).sort();
    
    let html = '<table class="confusion-matrix">';
    
    // 헤더
    html += '<thead><tr><th></th>';
    classes.forEach(c => {
        html += `<th>${AppState.classNames[c]}</th>`;
    });
    html += '</tr></thead>';
    
    // 본문
    html += '<tbody>';
    classes.forEach(actual => {
        html += `<tr><th>${AppState.classNames[actual]}</th>`;
        classes.forEach(predicted => {
            const count = matrix[actual][predicted];
            const isCorrect = actual === predicted;
            const className = isCorrect ? 'correct' : 'incorrect';
            html += `<td class="${className}">${count}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table>';
    
    container.innerHTML = html;
}
```

**CSS**:
```css
.confusion-matrix {
    border-collapse: collapse;
    margin: 16px 0;
}

.confusion-matrix th,
.confusion-matrix td {
    padding: 8px 12px;
    text-align: center;
    border: 1px solid #ddd;
}

.confusion-matrix .correct {
    background: #E8F5E9;
    font-weight: 600;
}

.confusion-matrix .incorrect {
    background: #FFEBEE;
}
```

**✅ Claude 작성 규칙**:
- 대각선(정답) 강조 표시
- 오분류 셀 빨간 배경
- 클래스 이름 표시 (숫자 아님)

---

### 7. 하이라이트 효과

#### 7.1 테스트 평가 하이라이트 — drawXxxWithHighlight 패턴

```javascript
// ✅ 평가 애니메이션 중: 현재 평가 중인 점을 맥동 링으로 강조
function drawScatterChartWithHighlight(evalIdx) {
    drawScatterChart();   // 기본 차트 먼저 그림

    const canvas = document.getElementById('scatterChart');
    const ctx    = canvas.getContext('2d');
    const rect   = canvas.parentElement.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    const pad    = CONFIG.CHART_PADDING;
    const scaleX = v => pad + v / 100 * (W - 2 * pad);
    const scaleY = v => H - pad - v / 100 * (H - 2 * pad);

    if (evalIdx < testData.length) {
        const d  = testData[evalIdx];
        const cx = scaleX(d.x1), cy = scaleY(d.x2);

        // 맥동 링 (점선, 반투명)
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.strokeStyle = '#FF9800';
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // 내부 반투명 강조
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 152, 0, 0.25)';
        ctx.fill();

        // 테스트 순서 레이블
        ctx.fillStyle = '#E65100';
        ctx.font = 'bold 11px Noto Sans KR';
        ctx.textAlign = 'center';
        ctx.fillText(`테스트 #${evalIdx + 1}`, cx, cy - 18);
    }
}
```

**✅ Claude 작성 규칙**:
- 기존 `drawXxx()` 호출 후 위에 덧그리는 방식 (재진입 금지)
- 현재 평가 포인트: 점선 링 + 반투명 내부 + 레이블
- 평가 완료 포인트: ✓ / ✗ 아이콘 표시 (drawScatterChart 내부 처리)

#### 7.2 K-최근접 이웃 연결선 하이라이트

```javascript
// 추론 모드: K개 이웃 연결선 + 이웃 강조
function drawKNNHighlight(ctx, predX1, predX2, neighbors, scaleX, scaleY) {
    ctx.save();
    const px = scaleX(predX1), py = scaleY(predX2);

    // 이웃 연결선 (거리순 투명도)
    neighbors.forEach((n, i) => {
        const d  = data[n.idx];
        const nx = scaleX(d.x1), ny = scaleY(d.x2);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = CONFIG.COLOR.CLASS_COLORS[n.class] + '60';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        // 순위 번호
        ctx.fillStyle = '#333';
        ctx.font = CONFIG.FONT.TICK;
        ctx.fillText(i + 1, nx + 5, ny - 5);
    });

    // 예측 포인트 (노란 원 + 클래스 색상 내부점)
    ctx.beginPath();
    ctx.arc(px, py, CONFIG.HIGHLIGHT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.COLOR.HIGHLIGHT;
    ctx.fill();
    ctx.strokeStyle = CONFIG.COLOR.ACCENT_WARM;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
}
```

---

### 8. Train / Test 시각화 규칙 (필수)

```javascript
// ✅ 훈련 데이터: 채워진 원 (●)
trainData.forEach(d => {
    ctx.beginPath();
    ctx.arc(scaleX(d.x1), scaleY(d.x2), CONFIG.POINT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle   = CONFIG.COLOR.CLASS_COLORS[d.class];
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth   = 1;
    ctx.stroke();
});

// ✅ 테스트 데이터: 다이아몬드 (◆) + 주황 테두리
testData.forEach((d, idx) => {
    const cx = scaleX(d.x1), cy = scaleY(d.x2);
    const s  = CONFIG.TEST_POINT_SIZE;     // 5px
    ctx.beginPath();
    ctx.moveTo(cx,     cy - s);  // 위
    ctx.lineTo(cx + s, cy);      // 오른쪽
    ctx.lineTo(cx,     cy + s);  // 아래
    ctx.lineTo(cx - s, cy);      // 왼쪽
    ctx.closePath();
    ctx.fillStyle   = CONFIG.COLOR.CLASS_COLORS[d.class];
    ctx.fill();
    ctx.strokeStyle = '#E65100';   // 주황 테두리 (훈련 데이터와 명확히 구분)
    ctx.lineWidth   = 2;
    ctx.stroke();

    // 평가 결과 표시 (정답=✓ 초록, 오답=✗ 빨강)
    if (testAnimResults[idx]) {
        const r = testAnimResults[idx];
        ctx.font      = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = r.correct ? CONFIG.COLOR.SUCCESS : CONFIG.COLOR.DANGER;
        ctx.fillText(r.correct ? '✓' : '✗', cx, cy - s - 4);
    }
});
```

**✅ Claude 작성 규칙**:
- 훈련 데이터: 채워진 원 ● (흰색 테두리)
- 테스트 데이터: 다이아몬드 ◆ + 주황(`#E65100`) 테두리
- 평가 완료: ✓ / ✗ 아이콘 (초록/빨강)
- 범례에 반드시 Train/Test 구분 표시

```html
<!-- 범례: 클래스 색상 + Train/Test 모양 구분 -->
<div class="legend-split-row">
    <div class="legend-split-item">
        <div class="legend-shape-circle"></div>
        <span>훈련 데이터</span>
    </div>
    <div class="legend-split-item">
        <div class="legend-shape-diamond"></div>
        <span>테스트 데이터</span>
    </div>
</div>
```

---

### 9. K값 홀수 단위 계산 + K값 스트립 UI

#### 9.1 K값 홀수 단위 계산 (필수)

```javascript
// ✅ K는 홀수만 계산: 다수결 동점 방지 + 계산량 절반으로 감소
for (let k = CONFIG.K_MIN; k <= CONFIG.K_MAX; k += 2) {
    // K_MIN = 1 이면 k = 1, 3, 5, 7, 9, 11, 13, 15
    const accuracy = evaluateK(k);
    kAccuraciesCache.push({ k, accuracy });
}

// ❌ 짝수 K 포함 금지: 2클래스 문제에서 동점 → 분류 불안정
for (let k = 1; k <= 15; k++) { /* ❌ 짝수 K(2, 4, ...) 계산 금지 */ }
```

#### 9.2 K값 스트립 UI (k-acc-chip)

```javascript
// ✅ getBestK: 캐시에서 최고 정확도 K 자동 탐색
function getBestK() {
    if (kAccuraciesCache.length === 0) return CONFIG.K_DEFAULT;
    return kAccuraciesCache.reduce((best, cur) =>
        parseFloat(cur.accuracy) > parseFloat(best.accuracy) ? cur : best
    ).k;
}

// 사용 흐름: computeAll → getBestK → 토스트 안내 + 스트립 렌더
const kAccuracies = computeAllKAccuracies();
const bestK = getBestK();
showToast(`🏆 최적 K=${bestK} (정확도 ${kAccuracies.find(a=>a.k===bestK).accuracy}%)`, 'success');
renderKAccStrip(kAccuracies, bestK);
```

```html
<!-- K값별 정확도를 칩 형태로 나열 -->
<div class="k-acc-strip" id="kAccStrip">
    <div class="k-acc-chip best" id="kChip5">
        <span class="k-label">K=5</span>
        <span class="k-acc">96.2%</span>
    </div>
    <div class="k-acc-chip active" id="kChip3">
        <span class="k-label">K=3</span>
        <span class="k-acc">94.1%</span>
    </div>
    <!-- ... -->
</div>
```

```css
.k-acc-strip { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }

.k-acc-chip {
    display: flex; flex-direction: column; align-items: center;
    padding: 4px 6px; border-radius: 6px; min-width: 42px;
    font-family: 'JetBrains Mono', monospace; font-size: 0.68rem;
    background: var(--bg-body-dark); border: 2px solid transparent;
    transition: all 0.3s ease;
}
.k-acc-chip.active { border-color: var(--primary);  background: rgba(33,150,243,0.1); }
.k-acc-chip.best   { border-color: var(--success);  background: rgba(67,160,71,0.15); }
```

```javascript
// K값 스트립 렌더링
function renderKAccStrip(kAccuracies, bestK) {
    const strip = document.getElementById('kAccStrip');
    strip.innerHTML = kAccuracies.map(a =>
        `<div class="k-acc-chip ${a.k === bestK ? 'best' : ''}" id="kChip${a.k}">` +
        `<span class="k-label">K=${a.k}</span>` +
        `<span class="k-acc">${a.accuracy}%</span></div>`
    ).join('');
    strip.classList.remove('initially-hidden');
    strip.style.display = 'flex';
}

// 재생 중: 현재 K 강조
// .active와 .best는 독립 클래스 — 같은 K가 현재이자 최적이면 동시 적용
strip.querySelectorAll('.k-acc-chip').forEach(el => el.classList.remove('active'));
document.getElementById('kChip' + currentK)?.classList.add('active');
// → .best는 remove되지 않으므로 현재K === 최적K이면 best + active 동시 적용
```

**K값 재생 — `computeAll` 먼저 실행 후 프레임 재생 (필수)**:

```javascript
// ✅ 재생 시작 전: 모든 K 정확도를 먼저 일괄 계산
function playKAnimation() {
    if (!isSplitActive || trainData.length === 0) {
        distanceMethod = document.getElementById('distanceMethod').value;
        splitData(splitRatio);
        updateSplitInfoUI();
    }

    // ① computeAll 먼저 — 재생 중 재계산 없음
    const kAccuracies = computeAllKAccuracies();
    const bestK = getBestK();

    // ② 스트립 미리 렌더 (재생 전에 전체 그림 보임)
    renderKAccStrip(kAccuracies, bestK);

    // ③ 프레임별 재생 (캐시 참조만)
    const kValues = kAccuracies.map(a => a.k);
    let idx = 0;
    function playFrame() {
        if (idx >= kValues.length) {
            // 완료: bestK 기준 혼동행렬 생성 (모드 ②)
            updateConfusionMatrix(buildConfMatrixFromBestK(bestK));
            showToast(`🏆 최적 K=${bestK} (정확도 ${kAccuracies.find(a=>a.k===bestK).accuracy}%)`, 'success');
            stopKAnimation();
            return;
        }
        const k = kValues[idx];
        kValue = k;
        drawBoundaryChart();

        // 스트립에서 현재 K 강조
        strip.querySelectorAll('.k-acc-chip').forEach(el => el.classList.remove('active'));
        document.getElementById('kChip' + k)?.classList.add('active');

        idx++;
        kPlaybackTimer = setTimeout(playFrame, CONFIG.K_PLAYBACK_DELAY);
    }
    playFrame();
}
```

> **규칙**: `playKAnimation` 진입 즉시 `computeAllKAccuracies()`를 호출해 전체 캐시를 채운다.
> 프레임 루프(`playFrame`)는 캐시를 참조만 하며 재계산하지 않는다.

---

#### 9.3 결과 테이블 — row-current / row-best 동시 적용

```javascript
// ✅ 현재 K와 최적 K가 같을 수 있음 → 두 클래스 모두 누적 적용
function updateResultTable(kAccuracies, currentK, bestK) {
    let html = '';
    kAccuracies.forEach(a => {
        const { text, cls } = getAccuracyStatus(parseFloat(a.accuracy));

        let rowCls  = '';
        let kLabel  = `K=${a.k}`;

        if (a.k === bestK)    { rowCls  = 'row-best';    kLabel += ' 🏆'; }
        if (a.k === currentK) { rowCls += ' row-current'; kLabel += ' ◀'; }
        // → 같은 K면 'row-best row-current' 두 클래스 모두 적용
        //   CSS는 row-current가 우선시되도록 작성 (선택자 순서 또는 specificity)

        html += `<tr class="${rowCls.trim()}">
                     <td>${kLabel}</td>
                     <td>${a.accuracy}%</td>
                     <td class="${cls}">${text}</td>
                 </tr>`;
    });
    document.getElementById('resultTableBody').innerHTML = html;
}
```

```css
/* row-best: 초록 배경 (낮은 우선순위) */
.result-table .row-best    { background: rgba(67, 160, 71, 0.08); }
/* row-current: 파랑 배경 + bold (높은 우선순위 → best와 겹치면 파랑 우선) */
.result-table .row-current { background: rgba(33, 150, 243, 0.08); font-weight: 600; }
```

---

### 10. 투표 막대 그래프 (vote-bar)

```html
<!-- 클래스별 득표수 시각화 -->
<div class="vote-result" id="voteResult">
    <h4>🗳️ 다수결 투표 결과</h4>
    <div id="voteContent">
        <!-- JS로 동적 생성 -->
    </div>
</div>
```

```javascript
// 투표 결과 렌더링
function renderVoteResult(votes, k, classNames) {
    let html = '';
    for (let c = 0; c < classNames.length; c++) {
        const count = votes[c] || 0;
        const pct   = (count / k * 100).toFixed(0);
        html += `
            <div class="vote-bar">
                <span class="vote-label" style="color:${CONFIG.COLOR.CLASS_COLORS[c]}">
                    ${classNames[c].slice(0, 4)}
                </span>
                <div class="vote-track">
                    <div class="vote-fill"
                         style="width:${pct}%; background:${CONFIG.COLOR.CLASS_COLORS[c]}">
                    </div>
                </div>
                <span class="vote-count">${count}</span>
            </div>`;
    }
    document.getElementById('voteContent').innerHTML = html;
}
```

```css
.vote-bar    { display: flex; align-items: center; margin-bottom: 6px; }
.vote-label  { width: 60px; font-size: 0.8rem; font-weight: 500; }
.vote-track  { flex: 1; height: 20px; background: #e0e0e0;
               border-radius: 10px; overflow: hidden; margin: 0 8px; }
.vote-fill   { height: 100%; border-radius: 10px; transition: width 0.5s ease; }
.vote-count  { width: 30px; text-align: right;
               font-size: 0.8rem; font-family: 'JetBrains Mono', monospace; }
```

---

### 11. KNN 알고리즘 함수 — 래퍼 + 순수 함수 이중 구조

L2의 이중 구조 패턴을 KNN에 적용합니다.

```javascript
// ══ 순수 함수: sourceData 직접 지정 — 재사용 가능, 테스트 용이 ══
function knnClassifyFrom(point, k, method, sourceData) {
    const distances = sourceData.map((d, idx) => ({
        idx,
        distance: calculateDistance(point, d, method),
        class: d.class,
    }));
    distances.sort((a, b) => a.distance - b.distance);
    const neighbors = distances.slice(0, k);
    const votes = {};
    neighbors.forEach(n => { votes[n.class] = (votes[n.class] || 0) + 1; });
    let best = 0, maxVotes = 0;
    Object.entries(votes).forEach(([cls, cnt]) => {
        if (cnt > maxVotes) { maxVotes = cnt; best = parseInt(cls); }
    });
    return { predictedClass: best, neighbors, votes,
             confidence: (maxVotes / k * 100).toFixed(1) };
}

// ══ 래퍼 함수: isSplitActive에 따라 소스 자동 선택 ══
// 결정 경계·추론 모드에서 사용 (컨텍스트마다 if문 반복 방지)
function knnClassify(point, k, method) {
    const source = (isSplitActive && trainData.length > 0) ? trainData : data;
    return knnClassifyFrom(point, k, method, source);
}
```

**컨텍스트별 호출 기준**:

```javascript
// 결정 경계: 래퍼 사용 — 또는 boundarySource 명시
const boundarySource = (isSplitActive && trainData.length > 0) ? trainData : data;
knnClassifyFrom(pt, k, method, boundarySource);   // ✅ data leakage 방지

// 테스트 평가: 반드시 trainData 직접 지정
knnClassifyFrom(d, k, method, trainData);          // ✅

// 추론 모드: 래퍼 사용 (소스 자동 선택)
knnClassify(pt, k, method);                        // ✅

// ❌ 금지: 분할 후 경계·평가에 data 전체 사용 → 테스트 누수
knnClassifyFrom(pt, k, method, data);              // ❌ (분할 상태에서)
```

> **주의**: 결정 경계(boundary)는 반드시 `trainData` 기반으로 계산. `data` 전체를 쓰면 테스트 누수(data leakage).

---

### 12. 거리 방식 선택 UI

```html
<!-- 거리 측정 방식 선택 -->
<div class="input-group">
    <label>거리 측정 방식</label>
    <select id="distanceMethod">
        <option value="euclidean">유클리드 거리</option>
        <option value="manhattan">맨해튼 거리</option>
    </select>
</div>
```

```javascript
// 거리 방식 분기 — calculateDistance 함수로 캡슐화
function calculateDistance(p1, p2, method = 'euclidean') {
    if (method === 'euclidean') {
        return Math.sqrt((p1.x1 - p2.x1) ** 2 + (p1.x2 - p2.x2) ** 2);
    } else {   // manhattan
        return Math.abs(p1.x1 - p2.x1) + Math.abs(p1.x2 - p2.x2);
    }
}

// 거리 방식 변경 시 결정 경계 즉시 재계산
document.getElementById('distanceMethod').addEventListener('change', e => {
    distanceMethod = e.target.value;
    if (isClassified) drawBoundaryChart();
});
```

---

### 13. 정확도 기준 3단계 (통일)

```javascript
// ✅ 정확도 기준 — UI_TEXT와 연동
function getAccuracyStatus(accuracy) {
    if (accuracy >= CONFIG.THRESHOLD_EXCELLENT * 100) {
        return { text: UI_TEXT.STATUS_EXCELLENT, cls: 'status-good' };   // 🎯 우수 (≥90%)
    } else if (accuracy >= CONFIG.THRESHOLD_GOOD * 100) {
        return { text: UI_TEXT.STATUS_GOOD, cls: 'status-ok' };          // ✅ 양호 (≥70%)
    } else {
        return { text: UI_TEXT.STATUS_POOR, cls: 'status-bad' };         // ⚠️ 개선필요 (<70%)
    }
}

// 결과 테이블에서 사용
kAccuracies.forEach(a => {
    const { text, cls } = getAccuracyStatus(parseFloat(a.accuracy));
    html += `<tr><td>K=${a.k}</td><td>${a.accuracy}%</td>
             <td class="${cls}">${text}</td></tr>`;
});
```

| 정확도 | 기준 | 아이콘 |
|--------|------|--------|
| ≥90%   | 우수 | 🎯 |
| ≥70%   | 양호 | ✅ |
| <70%   | 개선필요 | ⚠️ |



---

## ✅ 머신러닝 시뮬레이터 코드 작성 체크리스트

### 📊 데이터셋
- [ ] 합성 데이터: `centers` + `x1Label/x2Label` 필드 (columns/data 없음)
- [ ] 실 데이터: `columns` + `columnLabels` + `data`(raw 배열) 필드 (centers 없음)
- [ ] 모든 데이터셋에 source·description·recommended 필수
- [ ] 실 데이터는 최소 50개 샘플 포함
- [ ] CSV 업로드 지원

### 🔀 데이터 분할
- [ ] 훈련/테스트 비율 60~80% (10% 단위, 3단계만)
- [ ] 시각적 진행률 바로 비율 표시
- [ ] 최소 테스트 샘플 검증 (10개)
- [ ] Fisher-Yates 셔플 적용

### 🎓 분류 실행 — 3단계 파이프라인
- [ ] `runClassification()`: 검증 + 초기화 + 루프 시작 (직접 결과 처리 금지)
- [ ] `evalNext()`: 1포인트씩 setTimeout 재귀 + 4요소 동시 갱신
- [ ] `finishClassification()`: 집계 + 테이블/차트 + 패널 표시
- [ ] `testAnimResults[]` 누적 배열 + Canvas 인덱스 참조 시 가드 적용
- [ ] 혼동행렬: runClassification(모드①) vs playKAnimation(모드②) 구분
- [ ] K값 홀수만 계산 (k += 2)
- [ ] computeAll + getBest 캐시 패턴 + 재생 전 우선 실행
- [ ] 중단 기능 (stopTestAnim / clearTimeout)

### 📈 시각화
- [ ] 훈련=원형(●) / 테스트=다이아몬드(◆) + 주황 테두리
- [ ] 평가 완료 포인트에 ✓/✗ 아이콘 표시
- [ ] 결정 경계 소스: `isSplitActive ? trainData : data` 자동 선택
- [ ] 현재 평가 포인트 맥동 링 하이라이트 (drawXxxWithHighlight)
- [ ] 범례에 Train/Test 모양 구분 표시

### 🔄 K값 재생
- [ ] `playKAnimation()` 진입 시 `computeAllKAccuracies()` 먼저 실행
- [ ] K값 스트립: `.active`(현재) + `.best`(최적) 독립 클래스 동시 적용 가능
- [ ] 최적 K 자동 탐색 후 토스트로 안내

### 🎯 추론 인터페이스
- [ ] 슬라이더 입력 + 즉시 반응
- [ ] 투표 막대 그래프 (vote-bar / vote-fill)
- [ ] K개 이웃 연결선 + 순위 번호
- [ ] 신뢰도(confidence) 표시
- [ ] 거리 방식 선택 (유클리드 / 맨해튼)

### 📊 결과 표시
- [ ] K값별 정확도 테이블: `row-current`(현재) + `row-best`(최적) 동시 적용 가능
- [ ] 정확도 기준 통일: ≥90% 우수 🎯 / ≥70% 양호 ✅ / <70% 개선필요 ⚠️
- [ ] Confusion Matrix (대각선 강조)
- [ ] K값 정확도 꺾은선 그래프

---

## 🔍 머신러닝 시뮬레이터 코드 리뷰 체크리스트

### 🔴 Critical
- [ ] 훈련/테스트 데이터 섞임 (데이터 누수)
- [ ] 결정 경계를 분할 후에도 `data` 전체로 계산 → 테스트 누수
- [ ] 분할 비율 50% 이하 또는 90% 이상 허용
- [ ] 짝수 K 계산 포함 (동점 발생 가능)
- [ ] 합성 데이터에 centers 없음 / 실 데이터에 data 없음
- [ ] async/await로 루프 구현 → clearTimeout으로 즉시 중단 불가

### 🟡 Important
- [ ] Train=원형 / Test=다이아몬드 구분 없음
- [ ] drawXxxWithHighlight 패턴 미적용
- [ ] testAnimResults[] 가드(`if (testAnimResults[idx])`) 누락
- [ ] 3단계 파이프라인 미적용 (run/loop/finish 책임 혼재)
- [ ] K값 스트립 UI 없음 또는 .best 제거 후 .active만 토글
- [ ] 투표 막대 그래프 없음
- [ ] 거리 방식 선택 UI 없음
- [ ] 정확도 기준 불일치 (≥90%를 '양호'로 표기하는 등)
- [ ] playKAnimation에서 computeAll 우선 실행 없이 프레임마다 재계산

### 🟢 Nice-to-have
- [ ] 다양한 평가 지표 (F1, Precision, Recall)
- [ ] ROC Curve
- [ ] 교차 검증 (Cross-validation)
- [ ] 최적 K 슬라이더 자동 이동

---

# Part 추가: L2에서 이동된 ML 구현 패턴

> 다음 섹션들은 L2(시뮬레이터 공통)에서 ML 특화 구현으로 분류되어 본 문서로 이동한 패턴이다.
> L2에는 범용 원칙만 잔류하고, 이곳에 ML 구체 구현을 기술한다.

---

## 14. ML 레이아웃 — 3-Panel + 모드 탭

### 14.1 3-Panel (기본형)

```
┌──────────────────────────────────────────┐
│         Header (제목, 버전)               │
├───────────┬──────────────┬──────────────┤
│   Left    │   Canvas     │   Right      │
│  (입력)   │  (시각화)    │  (결과)      │
└───────────┴──────────────┴──────────────┘
```

```html
<div class="main-layout">  <!-- grid: 240px 1fr 260px -->
    <aside class="sidebar-left">  <!-- 데이터 입력/설정 --></aside>
    <div class="chart-area">      <!-- canvas 시각화 --></div>
    <aside class="sidebar-right"> <!-- 결과/통계 --></aside>
</div>
```

### 14.2 모드 탭 (학습/추론 분리)

```
┌──────────────────────────────┐
│  [🧠 학습 모드] [🔮 추론 모드]  │
├──────────────────────────────┤
│  [데이터셋] [CSV]             │
│  각 모드별 패널 조합           │
└──────────────────────────────┘
```

```javascript
function switchMode(mode) {
    document.querySelectorAll('.mode-tab')
        .forEach(tab => tab.classList.toggle('active', tab.dataset.mode === mode));
    const isTrain = mode === 'train';
    document.getElementById('dataPanel').classList.toggle('hidden', !isTrain);
    document.getElementById('inferencePanel').classList.toggle('hidden', isTrain);
    document.getElementById('trainCharts').classList.toggle('hidden', !isTrain);
    document.getElementById('inferenceCharts').classList.toggle('hidden', isTrain);
    if (!isTrain && data.length > 0) updatePrediction();
}
```

---

## 15. ML 색상 팔레트 — 따뜻한 톤

```css
:root {
    /* 1단계 팔레트 */
    --color-blue-500:   #2196F3;
    --color-blue-700:   #1565C0;
    --color-green-500:  #43A047;
    --color-red-500:    #E53935;
    --color-orange-500: #FF9800;
    --color-cream-100:  #FFFBF5;

    /* 2단계 의미적 별칭 */
    --primary:      var(--color-blue-500);
    --primary-dark: var(--color-blue-700);
    --success:      var(--color-green-500);
    --danger:       var(--color-red-500);
    --accent-warm:  var(--color-orange-500);
    --bg-body:      var(--color-cream-100);

    /* 간격·폰트 크기·레이아웃·그림자 */
    --spacing-2xs: 4px;  --spacing-xs: 6px;  --spacing-sm: 8px;
    --spacing-md: 10px;  --spacing-lg: 12px; --spacing-xl: 16px; --spacing-2xl: 20px;
    --font-2xs: 0.68rem; --font-xs: 0.72rem; --font-sm: 0.80rem;
    --font-md: 0.85rem;  --font-lg: 0.90rem; --font-xl: 0.95rem;
    --font-2xl: 1.00rem; --font-3xl: 1.20rem; --font-4xl: 1.60rem;
    --sidebar-left-width: 240px;  --sidebar-right-width: 260px;
    --panel-padding: 16px; --panel-radius: 16px; --btn-radius: 8px;
    --shadow-soft: 0 2px 8px rgba(0,0,0,0.08);
    --shadow-medium: 0 4px 16px rgba(0,0,0,0.12);
}
```

---

## 16. ML CONFIG / UI_TEXT 완성 예시

```javascript
const CONFIG = {
    CANVAS: { PADDING: 50, BOUNDARY_RESOLUTION: 50 },
    ANIMATION: { EVAL_DELAY: 350, PLAYBACK_DELAY: 600 },
    COLOR: {
        PRIMARY: '#2196F3', SUCCESS: '#43A047', DANGER: '#E53935',
        CLASS_COLORS: ['#E53935', '#43A047', '#2196F3', '#9C27B0'],
    },
    FONT: {
        LABEL: '14px Noto Sans KR', AXIS_LABEL: '12px Noto Sans KR',
        TICK: '10px JetBrains Mono', VALUE_BOLD: 'bold 11px JetBrains Mono',
    },
    K_MIN: 1, K_MAX: 21, K_DEFAULT: 5,
    THRESHOLD_EXCELLENT: 0.9, THRESHOLD_GOOD: 0.7,
    TOAST_DURATION: 2500,
};

const UI_TEXT = {
    STATUS_EXCELLENT: '🎯 우수', STATUS_GOOD: '✅ 양호', STATUS_POOR: '⚠️ 개선필요',
    BTN_GENERATE: '✨ 데이터 생성', BTN_CLASSIFY: '⚡ 분류 실행',
    BTN_CLASSIFYING: '⏳ 분류 중...',
    ERROR_NO_DATA: '먼저 데이터를 생성해주세요!',
    ERROR_TOO_FEW: '데이터가 너무 적습니다! (최소 10개)',
    ERROR_CSV_PARSE: 'CSV 파일 파싱에 실패했습니다.',
    ERROR_SAME_VAR: 'X₁과 X₂는 서로 다른 변수를 선택해주세요.',
    SPREAD_LABELS: ['매우 밀집', '밀집', '보통', '분산', '매우 분산'],
};
```

---

## 17. DATASETS — 합성/실 데이터 구조 분기

`type` 값에 따라 필수 필드가 완전히 다르다. 혼용 금지.

```javascript
const DATASETS = {
    // ═══ 합성 데이터 (type: 'synthetic') ═══
    'fruit': {
        type: 'synthetic', name: '🍎 과일 분류', source: '합성 데이터',
        description: '당도와 무게로 과일 품종을 분류',
        recommended: '분산도 3(보통)에서 가장 명확한 클러스터 형성',
        x1Label: '🍬 당도 (Brix)', x2Label: '⚖️ 무게 (g)',
        classNames: ['사과', '배', '귤', '포도'],
        centers: [[30,70],[70,80],[50,30],[80,50]],
    },

    // ═══ 실 데이터 (type: 'real') ═══
    'iris': {
        type: 'real', name: '🌺 붓꽃 (Iris)',
        source: 'Fisher(1936), UCI ML Repository | CC BY 4.0',
        description: '붓꽃 150송이의 꽃받침·꽃잎 크기로 3가지 품종 분류',
        recommended: '꽃잎길이 × 꽃잎너비 → K=5에서 정확도 96%+',
        columns: ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
        columnLabels: { sepal_length: '꽃받침 길이(cm)', petal_length: '꽃잎 길이(cm)' },
        defaultX1: 'petal_length', defaultX2: 'petal_width',
        classNames: ['Setosa', 'Versicolor', 'Virginica'],
        data: [[5.1, 3.5, 1.4, 0.2, 0], [4.9, 3.0, 1.4, 0.2, 0]],
    },
};
```

| 필드 | synthetic | real | 설명 |
|------|:---------:|:----:|------|
| type / name / source / description / recommended / classNames | ✅ | ✅ | 공통 필수 |
| `x1Label` / `x2Label` / `centers` | ✅ | ❌ | 합성 전용 |
| `columns` / `columnLabels` / `defaultX1` / `defaultX2` / `data` | ❌ | ✅ | 실 데이터 전용 |

---

## 18. CSV 업로드 + 랜덤 생성

### 18.1 CSV 업로드

```javascript
function initCSVUpload() {
    const area = document.getElementById('fileUploadArea');
    area.addEventListener('click', () => document.getElementById('csvFileInput').click());
    area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('dragover'); });
    area.addEventListener('dragleave', () => area.classList.remove('dragover'));
    area.addEventListener('drop', e => {
        e.preventDefault(); area.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file?.name.endsWith('.csv')) loadCSVFile(file);
    });
}
```

### 18.2 랜덤 생성 (centers 기반)

```javascript
function generateSyntheticData(ds) {
    const count  = parseInt(document.getElementById('dataCount').value);
    const spread = parseInt(document.getElementById('dataSpread').value) * 8;
    data = [];
    for (let c = 0; c < classCount; c++) {
        const [cx, cy] = ds.centers[c];
        for (let i = 0; i < count / classCount; i++) {
            data.push({
                x1: clamp(cx + (Math.random() - 0.5) * spread, 0, 100),
                x2: clamp(cy + (Math.random() - 0.5) * spread, 0, 100),
                class: c,
            });
        }
    }
    data = shuffleArray(data);
    finishDataLoad();
}
```

---

## 19. knnClassify — 래퍼 + 순수 함수 구현

> L2 §6(래퍼+순수 함수 이중 구조)의 ML 구현.

```javascript
// 순수 함수: sourceData를 직접 받아 처리
function knnClassifyFrom(point, k, method, sourceData) {
    const distances = sourceData.map((d, idx) => ({
        idx,
        distance: calculateDistance(point, d, method),
        class: d.class,
    }));
    distances.sort((a, b) => a.distance - b.distance);
    const neighbors = distances.slice(0, k);
    const votes = {};
    neighbors.forEach(n => { votes[n.class] = (votes[n.class] || 0) + 1; });
    let best = 0, maxVotes = 0;
    Object.entries(votes).forEach(([cls, cnt]) => {
        if (cnt > maxVotes) { maxVotes = cnt; best = parseInt(cls); }
    });
    return { predictedClass: best, neighbors, votes, confidence: (maxVotes / k * 100).toFixed(1) };
}

// 래퍼 함수: 현재 상태에 따라 소스 자동 선택
function knnClassify(point, k, method) {
    const source = (isSplitActive && trainData.length > 0) ? trainData : data;
    return knnClassifyFrom(point, k, method, source);
}
```

---

## 20. computeAll + getBest 캐시 패턴

```javascript
function computeAllKAccuracies() {
    kAccuraciesCache = [];
    for (let k = CONFIG.K_MIN; k <= CONFIG.K_MAX; k += 2) {
        let correct = 0;
        testData.forEach(d => {
            const r = knnClassifyFrom(d, k, distanceMethod, trainData);
            if (r.predictedClass === d.class) correct++;
        });
        kAccuraciesCache.push({ k, accuracy: (correct / testData.length * 100).toFixed(1) });
    }
    return kAccuraciesCache;
}

function getBestK() {
    if (kAccuraciesCache.length === 0) return CONFIG.K_DEFAULT;
    return kAccuraciesCache.reduce((best, cur) =>
        parseFloat(cur.accuracy) > parseFloat(best.accuracy) ? cur : best
    ).k;
}
```

---

## 21. ML 분류 실행 — 3단계 파이프라인 구현

> L2 §7(run/loop/finish)의 ML 구현.

```javascript
// 1단계: runClassification()
function runClassification() {
    if (data.length === 0) { showToast(UI_TEXT.ERROR_NO_DATA, 'error'); return; }
    stopTestAnim();
    testAnimResults = [];
    splitData(splitRatio);
    progressBox.style.display = 'block';
    document.getElementById('evalItemList').innerHTML = '';
    let idx = 0;
    evalNext();

    // 2단계: evalNext() (루프)
    function evalNext() {
        if (idx >= testData.length) { finishClassification(); return; }
        const d = testData[idx];
        const result = knnClassifyFrom(d, kValue, distanceMethod, trainData);
        const correct = result.predictedClass === d.class;
        testAnimResults.push({ point: d, predicted: result.predictedClass, actual: d.class, correct });

        const pct = ((idx + 1) / testData.length * 100).toFixed(0);
        progressFill.style.width = pct + '%';
        evalCounter.textContent = `${idx + 1} / ${testData.length}`;

        drawScatterChartWithHighlight(idx);
        idx++;
        testAnimTimer = setTimeout(evalNext, CONFIG.ANIMATION.EVAL_DELAY);
    }
}

// 3단계: finishClassification()
function finishClassification() {
    testAnimTimer = null;
    const correct = testAnimResults.filter(r => r.correct).length;
    const acc = (correct / testData.length * 100).toFixed(1);
    const kAccuracies = computeAllKAccuracies();
    const bestK = getBestK();
    updateResultTable(kAccuracies, kValue, bestK);
    updateConfusionMatrix(buildConfMatrix());
    updateKChart(kAccuracies);
    resultPanel.style.display = 'block';
    showToast(`⚡ K=${kValue} 정확도 ${acc}% · 최적 K=${bestK}`, 'success');
}
```

---

## 22. testAnimResults[] ML 구현

```javascript
// evalNext() 안에서 누적
testAnimResults.push({
    point: d, predicted: result.predictedClass,
    actual: d.class, correct: result.predictedClass === d.class,
});

// drawScatterChart() 안에서 인덱스로 참조
testData.forEach((d, idx) => {
    drawDiamond(ctx, cx, cy, d.class);
    if (testAnimResults[idx]) {
        const { correct } = testAnimResults[idx];
        ctx.fillText(correct ? '✓' : '✗', cx, cy - s - 4);
    }
});

// finishClassification()에서 혼동행렬 생성
function buildConfMatrix() {
    const matrix = Array(classCount).fill(null).map(() => Array(classCount).fill(0));
    testAnimResults.forEach(r => { matrix[r.actual][r.predicted]++; });
    return matrix;
}
```

---

## 23. Canvas ML 산점도 렌더링

```javascript
function drawVisualization() {
    const canvas = document.getElementById('mainCanvas');
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;
    ctx.clearRect(0, 0, W, H);

    if (data.length === 0) {
        ctx.fillStyle = CONFIG.COLOR.TEXT_LIGHT;
        ctx.font = CONFIG.FONT.LABEL;
        ctx.textAlign = 'center';
        ctx.fillText('데이터를 생성해주세요', W / 2, H / 2);
        return;
    }

    const pad = CONFIG.CANVAS.PADDING;
    const scaleX = v => pad + v / 100 * (W - 2 * pad);
    const scaleY = v => H - pad - v / 100 * (H - 2 * pad);
    drawAxes(ctx, W, H, pad);
    drawDataPoints(ctx, scaleX, scaleY);
}

// Canvas hex 투명도 패턴
// FF=100%, CC=80%, 99=60%, 80≈50%, 66≈40%, 4D≈30%, 33≈20%, 20≈12%
// 예: CONFIG.CLASS_COLORS[c] + '60' → 약 38% 불투명
```

---

# Part 추가: ML확장리팩토링 지침서 흡수 (ML 특화)

> ML확장리팩토링 지침서의 ML 특화 내용(§3, §3.4, §4.3)을 본 문서에 흡수한다.
> 범용 리팩토링 패턴은 코딩관리지침 v4.0.0.0 Part 1으로 이동되었다.

---

## 24. 다변량 데이터셋 객체 표준

> ML확장리팩토링 지침서 §3 흡수.

```javascript
const DATASETS = {
    'dataset_key': {
        name: '🌸 붓꽃(Iris)',
        source: 'Fisher(1936), UCI ML Repository | CC BY 4.0',
        description: '붓꽃 150송이의 꽃받침·꽃잎 크기 측정값',
        defaultTarget: '꽃잎길이(cm)',
        recommended: '꽃잎길이 → 꽃잎너비 (r=0.96)',
        headers: ['c0', 'c1', 'c2', 'c3'],
        headerLabels: ['꽃받침길이(cm)', '꽃받침너비(cm)', '꽃잎길이(cm)', '꽃잎너비(cm)'],
        data: [[5.1, 3.5, 1.4, 0.2], ...]
    }
};
```

| # | 규칙 | 이유 | 위반 시 증상 |
|:-:|------|------|-------------|
| 1 | `headers`와 `headerLabels` 길이 동일 | 인덱스 매핑 의존 | 축 레이블 불일치 |
| 2 | `headers`는 짧은 내부 키 (`c0`, `c1`...) | 파일 크기 절감 | 불필요한 비대화 |
| 3 | `headerLabels`에 단위 포함 | 축 레이블에 그대로 사용 | 단위 누락 |
| 4 | `defaultTarget`은 `headerLabels` 값과 정확히 일치 | `indexOf()`로 매칭 | 기본 Y 미선택 |
| 5 | `data`는 숫자만 | 수치형 검증 생략 | NaN 에러 |
| 6 | `source`에 라이선스 명시 | 교육용 배포 시 저작권 준수 | 법적 문제 |

---

## 25. 분류 알고리즘용 확장 필드

> ML확장리팩토링 지침서 §3.4 흡수.

```javascript
{
    // ... 기본 필드 ...
    labelColumn: 'c4',
    classNames: { 'setosa': '🌸 세토사', 'versicolor': '🌺 버시컬러' },
    classColors: { 'setosa': '#E53935', 'versicolor': '#1565C0' }
}
```

---

## 26. Python 자동 변환 스크립트

> ML확장리팩토링 지침서 §4.3 흡수. 데이터셋 10개 이상 추가 시 필수 사용.

```python
import json

with open('presets_data.json') as f:
    raw = json.load(f)

for key, ds in raw.items():
    columns = list(ds['columns'].keys())
    n_rows = len(ds['columns'][columns[0]])

    # 1. 컬럼 기반 → 행 기반 전치
    rows = [[ds['columns'][col][i] for col in columns] for i in range(n_rows)]

    # 2. 내부 키 생성
    headers = [f'c{i}' for i in range(len(columns))]

    # 3. 압축 포맷 (N 기준 행/줄 결정)
    per_line = 3 if n_rows <= 30 else 5
```

> **원칙**: 데이터셋 10개 이상 추가할 때는 반드시 Python 스크립트를 사용한다.

---

## 참고자료

| # | 자료명 | 유형 | 비고 |
|:-:|--------|------|------|
| 1 | 버전관리지침(VMP)_v1.3.1.0 | 프로젝트 문서 | 버전 체계, 파일명, 세션 인계, 필수 구성요소 |
| 2 | 문서관리지침(DMPP)_v2.3.0.1 | 프로젝트 문서 | 협업 원칙, 이미지 관리, 코드 리뷰 프로세스 |
| 3 | 범용코딩표준(GCS-L1)_v1.0.0.2 | 프로젝트 문서 | 상위 문서 (2단계 상위) |
| 4 | 시뮬레이터코딩표준(SCS-L2)_v1.0.0.2 | 프로젝트 문서 | 상위 문서 (직접 상위) |
| 5 | 코딩관리지침(CDMP)_v4.0.0.2 | 프로젝트 문서 | 리팩토링 절차, SVG, 문서화, 품질 점검 |

---

## 생성/수정 이력

| 버전 | 날짜 | 시간 | 변경 수준 | 변경 내용 | 작성자 |
|------|------|------|-----------|-----------|--------|
| v1.0.0.0 | 2026-02-18 | — | 최초 | 기존 ml-simulator-standards.md를 프로젝트 형식으로 정규화. §12 중복 번호→§13으로 수정. L2에서 ML 특화 구현(§14~23) 이동 흡수. ML확장리팩토링 지침서 §3/§3.4/§4.3(§24~26) 흡수. 선택 메뉴 조합(3-Panel, 따뜻한 톤, Canvas) 명시 | Claude |
| v1.0.0.1 | 2026-02-22 | — | 패치 | 정합성 점검: 참고자료 버전 동기화 — VMP v1.3.0→v1.3.1.0, DMPP v2.1.x→v2.3.0.1, IOTSCS-L3 버전 수정. 영문명 약어 병기 | Changmo Yang & Claude AI |
| v1.0.0.1 | 2026-02-21 | — | 패치 | 영문명 병기 (Machine Learning Simulator Coding Standard, MLSCS-L3) | Changmo Yang & Claude AI |
| v1.0.0.2 | 2026-02-22 | — | 패치 | 2차 정합성 검증: 참고자료 버전 전면 동기화 — VMP v1.3.1.0, DMPP v2.3.0.1, CDMP v4.0.0.1, GCS-L1 v1.0.0.1, SCS-L2 v1.0.0.1, MLSCS-L3 v1.0.0.1, ECSCS-L3 v1.0.0.1. 영문명 약어 전면 병기 | Changmo Yang & Claude AI |

---

*ML시뮬레이터코딩표준 (Machine Learning Simulator Coding Standard, MLSCS-L3) — 머신러닝 교육용 시뮬레이터의 특화 설계·구현 표준*