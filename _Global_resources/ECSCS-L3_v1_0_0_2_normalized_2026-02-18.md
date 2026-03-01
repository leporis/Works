# 초등교과시뮬레이터코딩표준 (Elementary Curriculum Simulator Coding Standard, ECSCS-L3)

**초등학교 교과용 인터랙티브 시뮬레이터의 특화 설계·구현 표준**

**문서 버전: v1.0.0.2**

> **계층**: Level 1 (범용) → Level 2 (시뮬레이터 공통) → **Level 3-Edu (초등교과)**
>
> **상위 문서**: 범용코딩표준 (L1) + 시뮬레이터코딩표준 (L2)의 모든 규칙을 상속
>
> **폴백 규칙**: 이 문서에 명시되지 않은 사항은 Level 2 및 Level 1 지침을 따릅니다
>
> **적용**: 초등 과학/수학/사회/국어/영어/음악/미술/실과/컴퓨터 교과용 인터랙티브 시뮬레이터
>
> **대상 연령**: 초등 1-6학년 (만 7-12세)
>
> **선택 메뉴 조합 (L2 Part 2 참조)**: 레이아웃 = 3-Panel 변형 / 색상 = 따뜻한 톤 / 시각화 = Canvas 또는 순수 CSS
> 
> **버전**: 2.0.0 (2026-02-18 업데이트)

---

## 🎯 초등교과 시뮬레이터 목표

### 교육과정 연계
- 2022 개정 교육과정 기준
- 학년별 성취기준 반영
- 교과서 단원 연계

### 발달 단계 고려
- **구체적 조작기** (7-11세): 구체물 중심 시각화
- **형식적 조작기 전환** (12세): 추상적 개념 도입

---

## 📚 시뮬레이터 유형 분류 (신규)

초등교과 시뮬레이터는 크게 3가지 유형으로 분류됩니다. 유형별로 필수 구현 기능이 다릅니다.

### Type A: 퀴즈/퍼즐형
**정답이 존재하는 문제 해결 시뮬레이터**

- **예시**: 국어 문장 분석, 영어 단어 배열, 수학 문제 풀이
- **필수 기능**:
  - ✅ 정답 확인 시스템
  - ✅ 단계별 힌트 (HintManager)
  - ✅ 점수 저장 (ScoreManager)
  - ✅ 랜덤 피드백 (배열 방식)
  - ✅ 다음 문제 이동
  - ✅ 성취 배지

```javascript
// Type A 필수 구현 패턴
function finishQuestion(isCorrect) {
    ScoreManager.record(qId, isCorrect, HintManager.hintStep);  // 1. 점수 저장
    AchievementManager.check();                                   // 2. 배지 확인
    showFeedback(isCorrect ? 'CORRECT' : 'WRONG');               // 3. 랜덤 피드백
    renderScoreBoard();                                           // 4. 점수판 갱신
    HintManager.reset();                                          // 5. 힌트 초기화
}
```

### Type B: 탐구/조작형
**과정을 관찰하고 변수를 실험하는 시뮬레이터**

- **예시**: 사회 지도 축척, 실과 전기회로, 과학 실험, 컴퓨터 알고리즘
- **필수 기능**:
  - ✅ 실시간 반응 (input 이벤트)
  - ✅ 과정 시각화 (단계별)
  - ✅ 변수 실험 (슬라이더 등)
  - ✅ 예제 제공
  - ✅ 단계별 설명 패널

```javascript
// Type B 필수 구현 패턴
function finishExperiment() {
    renderResult();         // 1. 결과 표시
    showExplanation();      // 2. 과학적 설명 표시
    updateVisualization();  // 3. 시각화 갱신
    recordActivity();       // 4. 활동 기록 (점수 없음)
}

// 실시간 반응 (input 이벤트로 즉시 업데이트)
slider.addEventListener('input', (e) => {
    updateValue(e.target.value);
    finishExperiment();  // 즉시 결과 갱신
});
```

> **Type B 규칙**: 버튼 클릭이 아닌 `input` 이벤트로 실시간 반응해야 함
```

### Type C: 창작/표현형
**자유롭게 창작하고 표현하는 시뮬레이터**

- **예시**: 음악 연주, 미술 색 혼합, 코딩 창작
- **필수 기능**:
  - ✅ 자유 조작
  - ✅ 결과물 저장/다운로드
  - ✅ 창작물 시각화
  - ✅ 참여 기반 배지 (점수 없음)

```javascript
// Type C 필수 구현 패턴
function finishCreation() {
    saveCreation();                // 1. 창작물 저장
    AchievementManager.check();    // 2. 참여 배지
    showGallery();                 // 3. 창작물 갤러리 (선택)
}
```

### Canvas 시각화 패턴 (Type B/C 공통)

**Canvas를 사용하는 시뮬레이터는 devicePixelRatio 적용 필수**

```javascript
function renderCanvas() {
    const canvas = document.getElementById('mainCanvas');
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    
    // ✅ Retina/HiDPI 대응 (필수)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const W = rect.width, H = rect.height;
    
    ctx.clearRect(0, 0, W, H);
    
    // 데이터 없으면 빈 상태 표시 후 조기 리턴
    if (data.length === 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px Noto Sans KR';
        ctx.textAlign = 'center';
        ctx.fillText('데이터를 입력해주세요', W / 2, H / 2);
        return;
    }
    
    // ... 렌더링 로직
}

// resize 이벤트 연결 (필수)
window.addEventListener('resize', renderCanvas);
```

> **규칙**: 
> - Canvas 사용 시 `devicePixelRatio` 적용 필수 (Retina 디스플레이 대응)
> - 데이터 없을 때 빈 상태 메시지 표시 후 조기 리턴
> - resize 이벤트 연결 필수
```

---

## 📐 CONFIG_SUBJECT 표준 구조

**초등교과 시뮬레이터는 반드시 `CONFIG_SUBJECT` 선언 필수**

```javascript
const CONFIG_SUBJECT = {
    // ═══ 교육과정 메타데이터 (모든 시뮬레이터 필수) ═══
    CURRICULUM: {
        subject:     '국어',               // 교과명
        grade:       4,                    // 대상 학년 (1-6)
        semester:    1,                    // 학기 (1 or 2)
        unit:        '5. 의견이 드러나게 글을 써요',
        achievement: '[4국03-03] 관심 있는 주제에 대해 자신의 의견이 드러나게 글을 쓴다.'
    },
    
    // 난이도 설정
    DIFFICULTY: {
        level:        'medium',            // easy, medium, hard
        grade_range:  [3, 4],              // 적용 학년 범위
        hint_enabled: true,                // 힌트 시스템 활성화
        vocabulary:   'elementary'         // 초등 수준 용어
    },
    
    // 점수 계산 (Type A만 필수, Type B/C는 선택)
    SCORING: {
        base_score:    100,                // 기본 만점
        hint_penalty:  10,                 // 힌트 사용 시 감점
        time_bonus:    false               // 시간 보너스 사용 여부
    },
    
    // 접근성
    ACCESSIBILITY: {
        fontSize:     'large',             // small, medium, large
        colorBlind:   false,               // 색각 이상 모드
        narration:    false,               // 음성 안내 (선택)
        subtitles:    true                 // 자막
    }
};

// ═══ CONFIG: 숫자·색상·타이밍·크기 (UI_TEXT와 분리) ═══
const CONFIG = {
    CANVAS: {
        PADDING: 50,                       // px
        POINT_RADIUS: 4,
        GRID_SIZE: 40,
    },
    
    ANIMATION: {
        DURATION: 350,                     // ms - 애니메이션 지속 시간
        DELAY: 600,                        // ms - 단계별 딜레이
    },
    
    COLOR: {
        PRIMARY: '#3b82f6',
        SUCCESS: '#10b981',
        DANGER:  '#ef4444',
        // Canvas 폰트는 FONT 서브객체로 그룹화 (필수)
        FONT: {
            LABEL: '16px Noto Sans KR',
            TITLE: 'bold 20px Noto Sans KR',
            SMALL: '14px Noto Sans KR',
        }
    },
    
    TOAST_DURATION: 2500,                  // ms
};
```

> **규칙**: 
> - 초등교과 시뮬레이터는 `CONFIG_SUBJECT.CURRICULUM` 없이 배포 불가
> - `achievement`는 2022 개정 교육과정 성취기준 코드 포함 권장
> - `grade_range`는 시뮬레이터가 적용 가능한 실제 학년 범위 (단일 학년일 경우 `[4, 4]`)
> - Type A는 `SCORING` 필수, Type B/C는 선택
> - **매직 넘버 금지**: 숫자·색상·타이밍은 모두 `CONFIG`에 정의
> - Canvas 폰트 문자열은 `CONFIG.FONT` 서브객체로 반드시 그룹화

---

## 📝 UI_TEXT 초등교과 필수 키

**정답/오답 피드백은 반드시 배열로 정의하고 랜덤 출력**

```javascript
const UI_TEXT = {
    // ── 공통 필수 (모든 초등교과 시뮬레이터) ──────────────────
    TITLE:        '📝 문장 성분 분석 시뮬레이터',
    SUBTITLE:     '단어를 드래그하여 문장 성분을 분석해보세요!',

    // ═══ 정답/오답 피드백 — 배열로 랜덤 출력 (단일 문자열 금지) ═══
    FEEDBACK_CORRECT: [
        '정답이에요! 👏',
        '잘했어요! ⭐',
        '맞았어요! 🎉',
        '훌륭해요! 💯',
        '완벽해요! 🌟'
    ],
    FEEDBACK_WRONG: [
        '다시 한번 생각해봐요 🤔',
        '거의 다 왔어요! 💪',
        '힌트를 확인해봐요 💡',
        '조금만 더 생각해보세요 ✨'
    ],

    // 버튼 텍스트
    BTN_CHECK:      '✓ 정답 확인',
    BTN_HINT:       '💡 힌트 보기',
    BTN_RESET:      '🔄 초기화',
    BTN_NEXT:       '→ 다음 문제',
    BTN_PREV:       '← 이전 문제',
    BTN_SUBMIT:     '제출하기',

    // 힌트 (단계별 배열 — 순서대로 공개)
    HINTS: [
        '첫 번째 단어를 찾아보세요',
        '조사를 확인해보세요',
        '주어가 무엇인지 생각해보세요'
    ],
    HINT_EXHAUSTED: '힌트를 모두 사용했어요! 다시 한번 도전해보세요.',

    // 완료 메시지
    COMPLETE:       '🎉 모두 완료했어요!',
    SCORE_DISPLAY:  (correct, total) => `${total}문제 중 ${correct}개 맞혔어요!`,
    
    // 에러 메시지
    ERROR_NO_ANSWER:   '답을 선택해주세요!',
    ERROR_INCOMPLETE:  '모든 칸을 채워주세요!',
};
```

### 피드백 랜덤 출력 패턴 (필수)

```javascript
// ✅ 올바른 피드백 출력
function showFeedback(type) {
    const pool = UI_TEXT['FEEDBACK_' + type.toUpperCase()];
    const msg  = pool[Math.floor(Math.random() * pool.length)];
    
    const el = document.getElementById('feedbackBox');
    el.textContent = msg;
    el.className = `feedback feedback-${type}`;
    el.classList.remove('hidden');
}

// 사용
showFeedback('CORRECT');  // "정답이에요! 👏" 또는 "잘했어요! ⭐" 중 랜덤
showFeedback('WRONG');    // "다시 한번 생각해봐요 🤔" 등 랜덤

// ❌ 금지: 단일 문자열 하드코딩
resultBox.innerHTML = '🎉 정답입니다!';   // ❌ 절대 금지
```

> **규칙**: 
> - 정답/오답 피드백은 최소 3개 이상 배열로 정의
> - 동일 메시지 반복은 초등 학습자 동기 저하 유발
> - `alert()`로 피드백 출력 금지 → 화면 내 `#feedbackBox` 사용

---

## 🎨 UI/UX 가이드라인

### 1. 색상 사용

```javascript
const COLORS_EDU = {
    // 밝고 명확한 색상
    PRIMARY:   '#FF6B6B',      // 빨강 (강조)
    SECONDARY: '#4ECDC4',      // 청록 (보조)
    SUCCESS:   '#95E1D3',      // 연두 (성공)
    WARNING:   '#FFE66D',      // 노랑 (주의)
    
    // 색각 이상자 대응
    COLORBLIND_SAFE: {
        RED:    '#D55E00',
        BLUE:   '#0173B2',
        GREEN:  '#029E73',
        YELLOW: '#ECE133',
        ORANGE: '#CC78BC'
    },
    
    // 배경 (눈의 피로 최소화)
    BACKGROUND: '#F7F9FC',
    PANEL:      '#FFFFFF'
};
```

**원칙**:
- ✅ 대비 비율 4.5:1 이상 (WCAG AA 기준)
- ✅ 색상에만 의존하지 않음 (모양/텍스트 병행)
- ✅ 파스텔 톤 금지 (가독성 저하)

### 2. 타이포그래피

```css
:root {
    /* 초등용 폰트 */
    --font-primary:     'Noto Sans KR', 'Malgun Gothic', sans-serif;
    --font-size-base:   16px;      /* 기본 (절대 이하 금지) */
    --font-size-large:  20px;      /* 제목 */
    --font-size-xlarge: 24px;      /* 주요 제목 */
    
    /* 행간 (가독성) */
    --line-height:      1.6;
    
    /* 글자 간격 */
    --letter-spacing:   0.02em;
}

.sim-title {
    font-size: var(--font-size-xlarge);
    font-weight: 700;
    line-height: var(--line-height);
}

.panel-content {
    font-size: var(--font-size-base);
    line-height: var(--line-height);
    letter-spacing: var(--letter-spacing);
}

/* 저학년용 (1-3학년) */
.grade-low {
    --font-size-base: 18px;
    --font-size-large: 22px;
    --line-height: 1.8;
}
```

> **규칙**: `font-size` 16px (1rem) 미만 사용 절대 금지. 저학년(1-3학년)은 18px 이상 권장.

### 3. 버튼 표준 (min-height 48px 강제)

```html
<!-- 크고 명확한 버튼 -->
<button class="btn-edu btn-primary">
    <span class="btn-icon">▶️</span>
    <span class="btn-text">시작하기</span>
</button>
```

```css
/* 초등교과 버튼 기본 클래스 */
.btn-edu {
    min-width:  120px;
    min-height: 48px;        /* ← 터치 타겟 필수, 절대 삭제 불가 */
    padding: 12px 24px;
    font-size: 16px;         /* 최소 16px */
    font-weight: 600;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.btn-edu:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.btn-edu:active {
    transform: scale(0.96);
}

.btn-icon {
    font-size: 20px;
}

/* ❌ 금지: padding만으로 버튼 크기 지정 */
/* .btn { padding: 14px 30px; }  ← min-height 없음, 절대 금지 */
```

**원칙**:
- ✅ 최소 크기: 48x48px (터치 타겟) **← 절대 규칙**
- ✅ 아이콘 + 텍스트 병기
- ✅ 호버/액티브 피드백 제공
- ❌ `padding`만으로 크기 지정 금지 → `min-height: 48px` 명시 필수

---

## 🎮 인터랙션 패턴

### 1. 터치 + 마우스 이중 이벤트 바인딩 (필수)

**모든 클릭 가능 요소는 터치와 마우스를 동시 지원해야 함**

```javascript
// ═══ 범용 이벤트 바인딩 유틸 ═══
function bindInteraction(element, handler) {
    // 마우스 (PC)
    element.addEventListener('click', handler);

    // 터치 (태블릿/모바일) — click과 중복 실행 방지
    element.addEventListener('touchend', (e) => {
        e.preventDefault();   // 300ms 딜레이 + ghost click 방지
        handler(e);
    });
}

// 사용 예시
bindInteraction(document.getElementById('checkBtn'), () => {
    checkAnswer();
});
```

### 2. 드래그 앤 드롭 터치 대응 (Type A 필수)

**국어 문장분석, 영어 퍼즐 등 드래그 시뮬레이터는 터치 드래그 필수**

```javascript
function bindDragTouch(element) {
    let startX, startY, originalParent;
    
    // 터치 시작
    element.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        
        // 드래그 시작 표시
        element.classList.add('dragging');
        originalParent = element.parentElement;
    });
    
    // 터치 이동
    element.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        
        // 요소를 손가락 위치로 이동
        element.style.position = 'fixed';
        element.style.left = (touch.clientX - 40) + 'px';
        element.style.top  = (touch.clientY - 20) + 'px';
        element.style.zIndex = 1000;
    }, { passive: false });
    
    // 터치 종료
    element.addEventListener('touchend', (e) => {
        element.classList.remove('dragging');
        element.style.position = '';
        element.style.zIndex = '';
        
        // 드롭 위치 감지
        const touch = e.changedTouches[0];
        const dropTarget = document.elementFromPoint(
            touch.clientX,
            touch.clientY
        );
        
        if (dropTarget && dropTarget.classList.contains('drop-zone')) {
            handleDrop(element, dropTarget);
        } else {
            // 드롭 실패 시 원위치 복귀
            if (originalParent) {
                originalParent.appendChild(element);
            }
        }
    });
}

// 모든 드래그 요소에 적용
document.querySelectorAll('.draggable').forEach(el => {
    bindDragTouch(el);
});
```

### 3. 슬라이더 (학년: 4-6학년)

```html
<div class="control-edu">
    <label class="control-label">
        <span class="label-icon">🌡️</span>
        <span class="label-text">온도</span>
    </label>
    
    <div class="slider-container">
        <input type="range" 
               id="tempSlider" 
               min="0" 
               max="100" 
               value="25" 
               step="1"
               class="slider-edu">
        <div class="slider-ticks">
            <span>0°C</span>
            <span>25°C</span>
            <span>50°C</span>
            <span>100°C</span>
        </div>
    </div>
    
    <div class="value-display">
        <span id="tempValue" class="value-big">25</span>
        <span class="value-unit">°C</span>
    </div>
</div>
```

```css
.slider-edu {
    width: 100%;
    height: 12px;
    border-radius: 6px;
    background: linear-gradient(to right, #4ECDC4, #FF6B6B);
    outline: none;
    -webkit-appearance: none;
}

.slider-edu::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    cursor: pointer;
}

.value-big {
    font-size: 36px;
    font-weight: 700;
    color: var(--primary);
}
```

---

## 💡 단계별 힌트 시스템 (Type A 필수)

### HintManager 표준 구현

```javascript
const HintManager = {
    currentStep: 0,
    maxHints: 0,
    
    // 초기화 (문제 시작 시 호출)
    init(hints) {
        this.currentStep = 0;
        this.maxHints = hints.length;
        this.hidePanel();
    },
    
    // 힌트 표시 (버튼 클릭 시)
    show(hints) {
        if (this.currentStep >= hints.length) {
            this.showInPanel(UI_TEXT.HINT_EXHAUSTED);
            return;
        }
        
        const hint = hints[this.currentStep];
        this.showInPanel(`💡 힌트 ${this.currentStep + 1}: ${hint}`);
        this.currentStep++;
        
        // 힌트 사용 기록 (점수 감점용)
        return this.currentStep;
    },
    
    // 패널에 표시 (alert 절대 금지)
    showInPanel(message) {
        const el = document.getElementById('hintBox');
        el.textContent = message;
        el.classList.remove('hidden');
        el.classList.add('hint-show');
    },
    
    hidePanel() {
        const el = document.getElementById('hintBox');
        el.classList.add('hidden');
        el.classList.remove('hint-show');
    },
    
    // 현재 사용한 힌트 수 반환 (점수 계산용)
    getUsedCount() {
        return this.currentStep;
    },
    
    reset() {
        this.currentStep = 0;
        this.hidePanel();
    }
};

// ═══ HTML 구조 ═══
/*
<div id="hintBox" class="hint-box hidden">
    힌트가 여기 표시됩니다
</div>
<button class="btn-edu" onclick="HintManager.show(UI_TEXT.HINTS)">
    💡 힌트 보기
</button>
*/
```

```css
.hint-box {
    background: #FFF9E6;
    border: 2px solid #FFE66D;
    border-radius: 12px;
    padding: 16px;
    margin: 16px 0;
    font-size: 16px;
    line-height: 1.6;
}

.hint-box.hidden {
    display: none;
}

.hint-show {
    animation: slideDown 0.3s ease;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

> **규칙**:
> - `alert()`로 힌트 표시 절대 금지
> - 한 번에 전체 힌트 공개 금지 → 버튼 클릭마다 한 단계씩
> - 문제 전환 시 `HintManager.reset()` 필수
> - 힌트 사용 횟수는 점수 계산에 반영

---

## 📊 점수 및 진도 관리 (Type A 필수)

### ScoreManager 표준 구현

```javascript
const ScoreManager = {
    currentSubject: null,
    
    init(subject) {
        this.currentSubject = subject;
    },
    
    // 문제 결과 기록
    record(questionId, isCorrect, hintsUsed = 0, timeSpent = 0) {
        const cfg = CONFIG_SUBJECT.SCORING;
        const baseScore = cfg.base_score;
        const penalty = hintsUsed * cfg.hint_penalty;
        
        let score = 0;
        if (isCorrect) {
            score = Math.max(baseScore - penalty, 40);  // 최소 40점
            
            if (cfg.time_bonus && timeSpent < 30) {
                score += 10;  // 30초 이내 보너스
            }
        }
        
        const key = `${this.currentSubject}_${questionId}`;
        const entry = {
            score,
            isCorrect,
            hintsUsed,
            timeSpent,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem(key, JSON.stringify(entry));
        } catch (e) {
            console.warn('진도 저장 실패 (스토리지 부족):', e);
        }
        
        return score;
    },
    
    // 전체 진도 요약
    getSummary(subject = null) {
        subject = subject || this.currentSubject;
        const keys = Object.keys(localStorage)
            .filter(k => k.startsWith(subject + '_'));
        
        if (keys.length === 0) {
            return { total: 0, correct: 0, avgScore: 0, correctWithoutHint: 0 };
        }
        
        const entries = keys.map(k => JSON.parse(localStorage.getItem(k)));
        
        return {
            total: entries.length,
            correct: entries.filter(e => e.isCorrect).length,
            avgScore: entries.reduce((s, e) => s + e.score, 0) / entries.length,
            correctWithoutHint: entries.filter(e => e.isCorrect && e.hintsUsed === 0).length
        };
    },
    
    // 점수판 렌더링
    renderScoreBoard() {
        const summary = this.getSummary();
        const el = document.getElementById('scoreBoard');
        
        el.innerHTML = `
            <div class="score-item">
                <span class="score-label">정답</span>
                <span class="score-value">${summary.correct}/${summary.total}</span>
            </div>
            <div class="score-item">
                <span class="score-label">평균</span>
                <span class="score-value">${summary.avgScore.toFixed(1)}점</span>
            </div>
        `;
    }
};

// ═══ 사용 예시 ═══
// 초기화
ScoreManager.init(CONFIG_SUBJECT.CURRICULUM.subject);

// 문제 완료 시
function finishQuestion(isCorrect) {
    const hintsUsed = HintManager.getUsedCount();
    const score = ScoreManager.record(currentQuestionId, isCorrect, hintsUsed);
    
    ScoreManager.renderScoreBoard();
    AchievementManager.check();
    
    showFeedback(isCorrect ? 'CORRECT' : 'WRONG');
}
```

> **규칙**:
> - `localStorage` 저장 시 반드시 `try-catch` 처리
> - 스토리지 실패가 시뮬레이터 동작을 막아선 안 됨
> - Type A(퀴즈형)만 필수, Type B/C는 선택 사항

---

## 🏆 성취 배지 시스템

### 초등교과 공통 필수 배지 3종

```javascript
// ═══ 모든 Type A 시뮬레이터 공통 적용 배지 ═══
const ACHIEVEMENTS_BASE = {
    first_correct: {
        id:   'first_correct',
        name: '첫 정답!',
        icon: '🌟',
        desc: '첫 번째 문제를 맞혔어요',
        condition: (summary) => summary.correct >= 1
    },
    
    no_hint: {
        id:   'no_hint',
        name: '힌트 없이!',
        icon: '🧠',
        desc: '힌트 없이 문제를 맞혔어요',
        condition: (summary) => summary.correctWithoutHint >= 1
    },
    
    all_clear: {
        id:   'all_clear',
        name: '전체 완료!',
        icon: '🏆',
        desc: '모든 문제를 완료했어요',
        condition: (summary, session, totalQuestions) => {
            return summary.correct >= totalQuestions;
        }
    }
};

// ═══ AchievementManager 구현 ═══
const AchievementManager = {
    subject: null,
    totalQuestions: 0,
    
    init(subject, total) {
        this.subject = subject;
        this.totalQuestions = total;
        this.render();
    },
    
    check() {
        const summary = ScoreManager.getSummary(this.subject);
        const session = {}; // 현재 세션 데이터
        
        Object.values(ACHIEVEMENTS_BASE).forEach(badge => {
            const earned = this.isEarned(badge.id);
            const unlocked = badge.condition(summary, session, this.totalQuestions);
            
            if (unlocked && !earned) {
                this.earn(badge);
            }
        });
    },
    
    isEarned(badgeId) {
        const key = `badges_${this.subject}`;
        const earned = JSON.parse(localStorage.getItem(key) || '[]');
        return earned.includes(badgeId);
    },
    
    earn(badge) {
        const key = `badges_${this.subject}`;
        const earned = JSON.parse(localStorage.getItem(key) || '[]');
        earned.push(badge.id);
        
        try {
            localStorage.setItem(key, JSON.stringify(earned));
        } catch (e) {
            console.warn('배지 저장 실패:', e);
        }
        
        this.showEarnedNotification(badge);
        this.render();
    },
    
    showEarnedNotification(badge) {
        showToast(`${badge.icon} 배지 획득: ${badge.name}`, 'success', 3000);
    },
    
    render() {
        const el = document.getElementById('badgeList');
        if (!el) return;
        
        el.innerHTML = Object.values(ACHIEVEMENTS_BASE).map(badge => {
            const earned = this.isEarned(badge.id);
            return `
                <div class="badge-item ${earned ? 'earned' : 'locked'}">
                    <div class="badge-icon">${badge.icon}</div>
                    <div class="badge-name">${badge.name}</div>
                    <div class="badge-desc">${badge.desc}</div>
                </div>
            `;
        }).join('');
    }
};

// ═══ 사용 예시 ═══
// 시뮬레이터 시작 시
AchievementManager.init(CONFIG_SUBJECT.CURRICULUM.subject, totalQuestions);

// 문제 완료 시 (finishQuestion 내부)
AchievementManager.check();
```

```css
.badge-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    background: white;
    border: 2px solid #e2e8f0;
    margin: 8px 0;
}

.badge-item.earned {
    border-color: #FFD700;
    background: #FFFBEA;
}

.badge-item.locked {
    opacity: 0.5;
    filter: grayscale(1);
}

.badge-icon {
    font-size: 32px;
}

.badge-name {
    font-weight: 700;
    font-size: 14px;
}

.badge-desc {
    font-size: 12px;
    color: #64748b;
}
```

> **규칙**:
> - Type A(퀴즈형)는 공통 배지 3종 필수 구현
> - Type C(창작형)는 참여 기반 배지 사용 (예: "첫 작품", "10회 연주")
> - 배지 획득 시 반드시 토스트 알림 표시

---

## 🎵 멀티미디어 표준

### 1. 소리 효과

```javascript
const SOUNDS = {
    correct:  'sounds/correct.mp3',
    wrong:    'sounds/wrong.mp3',
    click:    'sounds/click.mp3',
    complete: 'sounds/complete.mp3'
};

// 음량 제어
const VOLUME = {
    effects:    0.5,
    background: 0.2
};

function playSound(soundName) {
    if (!CONFIG_SUBJECT.ACCESSIBILITY.soundEnabled) return;
    
    const audio = new Audio(SOUNDS[soundName]);
    audio.volume = VOLUME.effects;
    audio.play().catch(e => console.log('Audio play failed:', e));
}
```

### 2. 음성 안내 (Web Speech API) - 선택 사항

```javascript
function speak(text) {
    if (!CONFIG_SUBJECT.ACCESSIBILITY.narration) return;
    if (!('speechSynthesis' in window)) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9;   // 조금 느리게
    utterance.pitch = 1.1;  // 조금 높게
    
    speechSynthesis.speak(utterance);
}

// 사용 예시
speak('온도가 25도입니다');
speak('정답입니다!');
```

### 3. 애니메이션

```css
/* 부드러운 애니메이션 */
@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

.correct {
    animation: bounce 0.5s ease;
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}

.incorrect {
    animation: shake 0.3s ease;
}

/* 로딩 애니메이션 */
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.loading {
    animation: spin 1s linear infinite;
}
```

---

## 🚨 초등교과 시뮬레이터 자주 발생하는 실수

### 1. 피드백 단일 문자열

```javascript
// ❌ 금지: 동일 메시지 반복
resultBox.innerHTML = '🎉 정답입니다!';

// ✅ 올바름: 배열에서 랜덤 선택
function showFeedback(type) {
    const pool = UI_TEXT['FEEDBACK_' + type.toUpperCase()];
    const msg = pool[Math.floor(Math.random() * pool.length)];
    feedbackBox.textContent = msg;
}
```

### 2. alert()로 힌트 표시

```javascript
// ❌ 금지: alert() 팝업
button.onclick = () => alert('힌트: 주어를 찾아보세요');

// ✅ 올바름: 패널에 표시
HintManager.show(currentQuestion.hints);
```

### 3. padding만으로 버튼 크기 지정

```css
/* ❌ 금지: min-height 없음 */
.btn {
    padding: 14px 30px;
}

/* ✅ 올바름: min-height 명시 */
.btn {
    min-height: 48px;
    min-width: 120px;
    padding: 12px 24px;
}
```

### 4. 터치 이벤트 누락

```javascript
// ❌ 금지: 마우스만 지원
button.addEventListener('click', handler);

// ✅ 올바름: 터치+마우스 모두 지원
bindInteraction(button, handler);
```

### 5. 소폰트 사용

```css
/* ❌ 금지: 16px 미만 */
.label {
    font-size: 14px;
}

/* ✅ 올바름: 16px 이상 */
.label {
    font-size: 16px;
}
```

### 6. CONFIG/UI_TEXT 혼용

```javascript
// ❌ 금지: 문자열을 CONFIG에
const CONFIG = {
    SUCCESS_MESSAGE: '정답입니다!',  // ❌
    ANIMATION_DELAY: 350             // ✅
};

// ✅ 올바름: 완전 분리
const CONFIG = {
    ANIMATION_DELAY: 350,            // 숫자만
};
const UI_TEXT = {
    SUCCESS_MESSAGE: '정답입니다!',  // 문자열만
};
```

### 7. 힌트 일괄 공개

```javascript
// ❌ 금지: 모든 힌트를 한 번에
function showAllHints() {
    hints.forEach(h => console.log(h));
}

// ✅ 올바름: 버튼 클릭마다 한 단계씩
HintManager.show(hints);  // currentStep만 표시
```

### 8. Canvas devicePixelRatio 누락

```javascript
// ❌ 금지: 일반 크기만 설정
canvas.width = 800;
canvas.height = 600;

// ✅ 올바름: Retina 대응
const dpr = window.devicePixelRatio || 1;
canvas.width = 800 * dpr;
canvas.height = 600 * dpr;
ctx.scale(dpr, dpr);
```

### 9. 점수 저장 시 try-catch 누락

```javascript
// ❌ 금지: 예외 처리 없음
localStorage.setItem(key, JSON.stringify(data));

// ✅ 올바름: 스토리지 실패 대응
try {
    localStorage.setItem(key, JSON.stringify(data));
} catch (e) {
    console.warn('진도 저장 실패:', e);
}
```

### 10. Type A에서 파이프라인 순서 오류

```javascript
// ❌ 금지: 순서 뒤바뀜
function checkAnswer() {
    showFeedback('CORRECT');
    ScoreManager.record(qId, true, 0);
}

// ✅ 올바름: 점수 기록 → 배지 확인 → 피드백
function checkAnswer() {
    ScoreManager.record(qId, true, hintsUsed);  // 1. 점수
    AchievementManager.check();                  // 2. 배지
    showFeedback('CORRECT');                     // 3. 피드백
    ScoreManager.renderScoreBoard();             // 4. 점수판
}
```

---

## ✅ 초등교과 시뮬레이터 체크리스트

### 🔴 Critical (필수)

#### 모든 유형 공통
- [ ] `CONFIG_SUBJECT.CURRICULUM` 선언 (교과/학년/성취기준)
- [ ] `UI_TEXT` 피드백 배열 방식 (최소 3개, 랜덤 출력)
- [ ] 버튼 `min-height: 48px` 설정 (padding만으로 대체 금지)
- [ ] 폰트 크기 16px 이상 (14px 미만 절대 금지)
- [ ] 색상 대비 4.5:1 이상 (WCAG AA)
- [ ] 터치 이벤트 지원 (`bindInteraction` 또는 `bindDragTouch`)
- [ ] CSS 변수 2단계 계층 (1단계: 팔레트, 2단계: 의미적 별칭)
- [ ] `.hidden` / `.initially-hidden` 구분 사용
- [ ] 매직 넘버 제거 (모든 숫자·색상·타이밍 → CONFIG)
- [ ] Canvas 폰트 문자열 → `CONFIG.FONT` 서브객체로 그룹화

#### Type A (퀴즈/퍼즐형) 추가 필수
- [ ] `HintManager` 단계별 힌트 (alert 금지, 패널 표시)
- [ ] `ScoreManager` 점수 저장 (localStorage + try-catch)
- [ ] `AchievementManager` 배지 시스템 (공통 3종: first_correct, no_hint, all_clear)
- [ ] Type A 파이프라인: 점수 기록 → 배지 확인 → 랜덤 피드백 → 점수판 갱신
- [ ] 힌트 사용 횟수 → 점수 감점 반영
- [ ] 문제 전환 시 `HintManager.reset()` 호출

#### Type B (탐구/조작형) 추가 필수
- [ ] 실시간 반응 (`input` 이벤트, `click` 이벤트 아님)
- [ ] `finishExperiment()` 공통 종착점 (결과 표시 + 설명 + 시각화)
- [ ] Canvas 사용 시 `devicePixelRatio` 적용
- [ ] resize 이벤트 연결
- [ ] 빈 상태 (데이터 없을 때) 메시지 표시

#### Type C (창작/표현형) 추가 필수
- [ ] 결과물 저장/다운로드 기능
- [ ] 참여 기반 배지 (점수 없음)
- [ ] Canvas 사용 시 `devicePixelRatio` 적용

### 🟡 Important (권장)

#### 교육과정
- [ ] 성취기준 코드 포함 (`[4국03-03]` 형식)
- [ ] 적용 학년 범위 명시 (`grade_range`)
- [ ] 교과서 단원명 정확히 기재

#### UI/UX
- [ ] 아이콘 + 텍스트 병기 (아이콘만 사용 금지)
- [ ] 호버/액티브 피드백
- [ ] 반응형 디자인 (@media, max-width: 768px)
- [ ] 토스트 제거 시 `toast-out` 클래스 + `animationend` 이벤트

#### 접근성
- [ ] 키보드 조작 가능
- [ ] 색각 이상자 대응 옵션 (`COLORBLIND_SAFE` 팔레트)
- [ ] 음량 조절 가능 (소리 사용 시)
- [ ] 드래그 시뮬레이터는 터치 드래그 필수 (`bindDragTouch`)

#### 코드 품질
- [ ] 함수 50줄 이하 (draw/init 함수는 80줄까지 허용)
- [ ] 중복 코드 제거 (3회 이상 반복 시 함수화)
- [ ] localStorage 실패 시 콘솔 경고만 (동작 중단 금지)

### 🟢 Nice-to-have (선택)

- [ ] 음성 안내 (Web Speech API)
- [ ] 다크 모드
- [ ] 다국어 지원 (UI_TEXT 기반)
- [ ] 인쇄 기능
- [ ] 결과물 공유 (SNS, 이메일)
- [ ] 진행률 표시 바
- [ ] 단축키 지원 (Space, Enter, Esc 등)

---

## 🔍 초등교과 코드 리뷰 포인트

### 🔴 Critical (즉시 수정 필요)

| 항목 | 체크 포인트 | 검토 파일 예시 |
|------|-------------|----------------|
| **CONFIG_SUBJECT 누락** | CURRICULUM 필드 없음 | 전체 7개 |
| **단일 피드백** | "정답입니다" 하드코딩, 배열 없음 | 1번, 6번 |
| **버튼 크기** | `min-height: 48px` 없음, padding만 사용 | 전체 7개 |
| **소폰트** | 16px 미만 폰트 사용 | 전체 대부분 |
| **터치 미지원** | `touchend` 이벤트 없음 | 전체 7개 |
| **alert 힌트** | `alert()`로 힌트 표시 | 1번, 6번 |
| **점수 미저장** | localStorage 사용 없음 (Type A) | 전체 7개 |
| **배지 없음** | ACHIEVEMENTS_BASE 미구현 | 전체 7개 |
| **매직 넘버** | 숫자 직접 사용 (CONFIG 없음) | 전체 7개 |
| **CONFIG/UI_TEXT 혼용** | 문자열이 CONFIG에 포함 | - |

### 🟡 Important (강력 권장)

| 항목 | 체크 포인트 | 검토 파일 예시 |
|------|-------------|----------------|
| **성취기준 누락** | achievement 필드 빈 문자열 | 전체 7개 |
| **힌트 일괄 공개** | 모든 힌트를 한 번에 표시 | 일부 |
| **저대비 색상** | WCAG AA 미달 | 일부 |
| **드래그 터치 없음** | 드래그 시뮬레이터인데 터치 미지원 | 1번, 6번 |
| **DPR 미적용** | Canvas에 devicePixelRatio 미적용 | 2, 5, 7번 |
| **finishXxx 없음** | 로드 경로별 후처리 중복 | 일부 |
| **input 아닌 click** | Type B에서 버튼 클릭으로 업데이트 | 일부 |

### 🟢 개선 제안 (선택)

| 항목 | 제안 사항 |
|------|----------|
| **반응형 미흡** | @media 쿼리 없거나 1개만 |
| **키보드 미지원** | Tab/Enter/Space 조작 불가 |
| **다크 모드 없음** | prefers-color-scheme 미사용 |

---

## 참고자료

| # | 자료명 | 유형 | 비고 |
|:-:|--------|------|------|
| 1 | 버전관리지침(VMP)_v1.3.1.0 | 프로젝트 문서 | 버전 체계, 파일명, 세션 인계, 필수 구성요소 |
| 2 | 문서관리지침(DMPP)_v2.3.0.1 | 프로젝트 문서 | 협업 원칙, 이미지 관리, 코드 리뷰 프로세스 |
| 3 | 범용코딩표준(GCS-L1)_v1.0.0.2 | 프로젝트 문서 | 상위 문서 (2단계 상위) |
| 4 | 시뮬레이터코딩표준(SCS-L2)_v1.0.0.2 | 프로젝트 문서 | 상위 문서 (직접 상위) |
| 5 | 코딩관리지침(CDMP)_v4.0.0.2 | 프로젝트 문서 | 리팩토링 절차, SVG, 문서화, 품질 점검 |
| 6 | 2022 개정 교육과정 | 외부 자료 | https://www.moe.go.kr/ |
| 7 | WCAG 2.1 접근성 가이드 | 외부 자료 | https://www.w3.org/WAI/WCAG21/quickref/ |

---

## 생성/수정 이력

| 버전 | 날짜 | 시간 | 변경 수준 | 변경 내용 | 작성자 |
|------|------|------|-----------|-----------|--------|
| v1.0.0.0 | 2026-02-18 | — | 최초 | 기존 edu-simulator-standards-v2_0.md를 프로젝트 형식으로 정규화. CONFIG.COLOR.FONT→CONFIG.FONT 오류 수정. 선택 메뉴 조합 명시 | Claude |
| v1.0.0.1 | 2026-02-22 | — | 패치 | 정합성 점검: 참고자료 버전 동기화 — VMP v1.3.0→v1.3.1.0, DMPP v2.1.x→v2.3.0.1, IOTSCS-L3 버전 수정. 영문명 약어 병기 | Changmo Yang & Claude AI |
| v1.0.0.1 | 2026-02-21 | — | 패치 | 영문명 병기 (Elementary Curriculum Simulator Coding Standard, ECSCS-L3) | Changmo Yang & Claude AI |
| v1.0.0.2 | 2026-02-22 | — | 패치 | 2차 정합성 검증: 참고자료 버전 전면 동기화 — VMP v1.3.1.0, DMPP v2.3.0.1, CDMP v4.0.0.1, GCS-L1 v1.0.0.1, SCS-L2 v1.0.0.1, MLSCS-L3 v1.0.0.1, ECSCS-L3 v1.0.0.1. 영문명 약어 전면 병기 | Changmo Yang & Claude AI |

---

*초등교과시뮬레이터코딩표준 (Elementary Curriculum Simulator Coding Standard, ECSCS-L3) — 초등학교 교과용 인터랙티브 시뮬레이터의 특화 설계·구현 표준*
