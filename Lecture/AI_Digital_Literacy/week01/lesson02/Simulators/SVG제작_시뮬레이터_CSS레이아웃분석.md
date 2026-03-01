# 시뮬레이터 CSS/레이아웃 분석

## 사과농장 (AI사과농장이야기_애니메이션_v1_5_0_0_소프트코딩적용_2026-02-01_1500.html)

### CSS 변수
| 변수 | 값 |
|------|-----|
| --color-blue-sky | #87CEEB |
| --apple-red | var(--color-red-500) |
| --apple-red-dark | var(--color-red-700) |
| --apple-green | var(--color-green-500) |
| --apple-green-light | var(--color-green-400) |
| --leaf-green | var(--color-green-700) |
| --honey-yellow | var(--color-yellow-500) |
| --warm-cream | var(--color-cream-100) |
| --warm-cream-dark | var(--color-cream-200) |
| --sky-blue | var(--color-blue-sky) |
| --robot-blue | var(--color-blue-500) |
| --text-dark | var(--color-brown-900) |
| --text-medium | var(--color-brown-700) |
| --farmer-bg-start | var(--color-brown-500) |
| --farmer-bg-end | var(--color-brown-600) |
| --farmer-border | var(--color-brown-700) |
| --robot-bg-start | var(--color-blue-500) |
| --robot-bg-end | var(--color-blue-700) |
| --robot-border | var(--color-blue-900) |
| --spacing-xs | 5px |
| --spacing-sm | 8px |
| --spacing-md | 10px |
| --spacing-lg | 12px |
| --spacing-xl | 15px |
| --font-xs | 0.75rem |
| --font-sm | 0.85rem |
| --font-md | 0.9rem |
| --font-lg | 1rem |
| --font-xl | 1.1rem |
| --container-max-width | 900px |

### 주요 색상
```
  #2196F3
  #444
  #666
  #888
  #8D6E63
  #9C27B0
  #D0D0D0
  #E0E0E0
  #FF9800
  #ccc
```

### 레이아웃
- `column`
- `inline-block`
- `flex`

### 주요 컨테이너 클래스
- `.container`: `width: 100vw; height: 100vh; display: flex; flex-direction: column;`
- `.dialogue-area`: `min-height: 100px; margin-top: 20px;`
- `.chart-dot`: `position: absolute; width: 8px; height: 8px; background: var(--apple-green); border-radius: 50%; opacity: 0;`
- `.progress-container`: `flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 6px;`
- `.speed-control`: `display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-medium);`
- `.controls`: `padding: 8px 12px; flex-wrap: wrap; gap: 10px;`
- `.progress-container`: `flex: 1 1 100%; order: 10; min-width: unset;`

### 버튼 텍스트
- 🔊
- ▶

---

## 선형회귀 (범용_선형회귀_시뮬레이터_v1_4_0_0.html)

### CSS 변수
| 변수 | 값 |
|------|-----|
| --apple-red | #E53935 |
| --apple-red-dark | #C62828 |
| --apple-green | #43A047 |
| --apple-green-dark | #2E7D32 |
| --honey-yellow | #FFC107 |
| --warm-cream | #FFFBF5 |
| --warm-cream-dark | #FFF3E0 |
| --text-dark | #3E2723 |
| --text-medium | #5D4037 |
| --text-light | #8D6E63 |
| --border-color | #FFCCBC |
| --shadow-soft | 0 2px 8px rgba(0,0,0,0.08) |
| --shadow-medium | 0 4px 16px rgba(0,0,0,0.12) |

### 주요 색상
```
  #0D47A1
  #1565C0
  #1E88E5
  #2196F3
  #2E7D32
  #43A047
  #5D4037
  #757575
  #E3F2FD
  #FEF3C7
  #FFCCBC
```

### 레이아웃
- `inline-block`
- `flex`
- `column`
- `grid`
- `240px 1fr 260px`

### 주요 컨테이너 클래스
- `.container`: `max-width: 1400px; margin: 0 auto; padding: 20px;`
- `.main-layout`: `display: grid; grid-template-columns: 240px 1fr 260px; gap: 16px; align-items: start;`
- `.panel`: `background: white; border-radius: 16px; padding: 16px; box-shadow: var(--shadow-soft);`
- `.sidebar-left`: `display: flex; flex-direction: column; gap: 16px;`
- `.sidebar-right`: `display: flex; flex-direction: column; gap: 16px;`
- `.playback-controls`: `display: flex; gap: 6px; margin-top: 10px;`
- `.stop`: `background: #757575; color: white;`
- `.chart-area`: `display: flex; flex-direction: column; gap: 16px;`
- `.chart-row`: `display: grid; grid-template-columns: 1fr 1fr; gap: 16px;`
- `.chart-container`: `background: white; border-radius: 16px; padding: 16px; box-shadow: var(--shadow-soft);`
- `.chart-title`: `font-size: 0.9rem; font-weight: 600; color: var(--text-dark); margin-bottom: 10px; text-align: center;`
- `.canvas-wrapper`: `position: relative; width: 100%; aspect-ratio: 1.3;`
- `.chart-large`: `grid-column: 1 / -1;`
- `.canvas-wrapper`: `aspect-ratio: 2;`
- `.data-table-wrapper`: `max-height: 150px; overflow-y: auto; margin-top: 10px; border: 1px solid var(--border-color); border-radius: 8px;`

### 버튼 텍스트
- ▶️ 재생
- 데이터셋
- 🔀 재분할 &amp; 재학습
- 🔄 가중치 적용
- ⚡ 학습 실행
- 직접
- + 추가
- ⏹️ 정지
- 🔮 추론 모드
- 🧠 학습 모드
- 🗑️ 초기화
- 📊 데이터 로드
- CSV

---

## KNN (KNN_분류_시뮬레이터_v1_2_0_1_전체소스.html)

### CSS 변수
| 변수 | 값 |
|------|-----|
| --primary | var(--color-blue-500) |
| --primary-dark | var(--color-blue-700) |
| --success | var(--color-green-500) |
| --success-dark | var(--color-green-700) |
| --warning | var(--color-yellow-500) |
| --danger | var(--color-red-500) |
| --highlight | var(--color-yellow-500) |
| --bg-light | var(--color-cream-100) |
| --bg-medium | var(--color-cream-200) |
| --text-dark | var(--color-brown-900) |
| --text-medium | var(--color-brown-700) |
| --text-light | var(--color-brown-500) |
| --border-color | var(--color-peach-200) |
| --spacing-xs | 6px |
| --spacing-sm | 8px |
| --spacing-md | 10px |
| --spacing-lg | 12px |
| --spacing-xl | 16px |
| --font-xs | 0.8rem |
| --font-sm | 0.85rem |
| --font-md | 0.9rem |
| --font-lg | 0.95rem |
| --font-xl | 1rem |
| --sidebar-left-width | 240px |
| --sidebar-right-width | 260px |
| --panel-padding | 16px |
| --panel-radius | 16px |
| --btn-radius | 8px |
| --shadow-soft | 0 2px 8px rgba(0,0,0,0.08) |
| --shadow-medium | 0 4px 16px rgba(0,0,0,0.12) |

### 주요 색상
```
  #1565C0
  #7B1FA2
  #BBDEFB
  #E3F2FD
  #E8F5E9
  #e0e0e0
```

### 레이아웃
- `var(--sidebar-left-width) 1fr var(--sidebar-right-width)`
- `block`
- `inline-block`
- `flex`
- `column`
- `inline-flex`
- `grid`

### 주요 컨테이너 클래스
- `.container`: `max-width: 1400px; margin: 0 auto; padding: 20px;`
- `.main-layout`: `display: grid; grid-template-columns: var(--sidebar-left-width) 1fr var(--sidebar-right-width); gap: var(--spacing-xl); ...`
- `.panel`: `background: white; border-radius: var(--panel-radius); padding: var(--panel-padding); box-shadow: var(--shadow-soft);`
- `.sidebar-right`: `display: flex; flex-direction: column; gap: var(--spacing-xl);`
- `.chart-area`: `display: flex; flex-direction: column; gap: 16px;`
- `.chart-row`: `display: grid; grid-template-columns: 1fr 1fr; gap: 16px;`
- `.chart-container`: `background: white; border-radius: 16px; padding: 16px; box-shadow: var(--shadow-soft);`
- `.chart-title`: `font-size: 0.9rem; font-weight: 600; color: var(--text-dark); margin-bottom: 10px; text-align: center;`
- `.canvas-wrapper`: `position: relative; width: 100%; aspect-ratio: 1.3;`
- `.chart-large`: `grid-column: 1 / -1;`
- `.canvas-wrapper`: `aspect-ratio: 2;`
- `.data-table-wrapper`: `max-height: 150px; overflow-y: auto; margin-top: 10px; border: 1px solid var(--border-color); border-radius: 8px;`
- `.result-panel`: `background: white; border-radius: 16px; padding: 16px; box-shadow: var(--shadow-soft); margin-top: 16px;`
- `.result-grid`: `display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;`
- `.result-section`: `background: var(--bg-medium); border-radius: 12px; padding: 14px;`

### 버튼 텍스트
- 🍎 과일
- 🐧 동물
- 🐧 펭귄
- 🌺 아이리스
- ✨ 데이터 생성
- 🌸 꽃
- 📥 데이터 적용
- 🍷 와인
- 내장
- 🎲 랜덤
- 🔮 추론 모드
- 🧠 학습 모드
- 🗑️ 초기화
- 프리셋
- CSV

---

## 의사결정트리 (분류_의사결정트리_시뮬레이터_v1_3_0_0.html)

### CSS 변수
| 변수 | 값 |
|------|-----|
| --primary | var(--color-blue-500) |
| --primary-dark | var(--color-blue-600) |
| --accent-teal | var(--color-teal-500) |
| --accent-orange | var(--color-orange-500) |
| --accent-purple | var(--color-purple-500) |
| --success | var(--color-green-500) |
| --danger | var(--color-red-500) |
| --bg-correct | #C8E6C9 |
| --bg-correct-subtle | #E8F5E9 |
| --bg-wrong | #FFCDD2 |
| --bg-wrong-subtle | #FFEBEE |
| --warning | var(--color-yellow-500) |
| --bg-main | #F0F4F8 |
| --bg-card | #FFFFFF |
| --bg-subtle | var(--color-gray-100) |
| --text-dark | var(--color-gray-900) |
| --text-medium | var(--color-gray-700) |
| --text-light | var(--color-gray-500) |
| --border | var(--color-gray-300) |
| --sp-xs | 4px |
| --sp-sm | 8px |
| --sp-md | 12px |
| --sp-lg | 16px |
| --sp-xl | 20px |
| --font-xs | 0.7rem |
| --font-sm | 0.8rem |
| --font-md | 0.875rem |
| --font-lg | 1rem |
| --font-xl | 1.125rem |
| --sidebar-width | 280px |

### 주요 색상
```
  #E0F2F1
  #FFF9C4
```

### 레이아웃
- `block`
- `inline-block`
- `flex`
- `none`
- `inline-flex`

### 주요 컨테이너 클래스
- `.container`: `max-width: 1500px; margin: 0 auto; padding: var(--sp-lg);`
- `.main-layout`: `display: grid; grid-template-columns: var(--sidebar-width) 1fr var(--sidebar-width); gap: var(--sp-lg);`
- `.sidebar`: `display: flex; flex-direction: column; gap: var(--sp-md);`
- `.panel`: `background: var(--bg-card); border-radius: var(--panel-radius); padding: var(--sp-lg); box-shadow: var(--shadow-sm);`
- `.panel-title`: `font-size: var(--font-md); font-weight: 700; margin-bottom: var(--sp-md);`
- `.center-area`: `min-width: 0;`
- `.tree-container`: `background: var(--bg-card); border-radius: var(--panel-radius); padding: var(--sp-md); box-shadow: var(--shadow-sm); ove...`
- `.chart-title`: `font-size: var(--font-md); font-weight: 600; margin-bottom: var(--sp-sm); text-align: center;`
- `.stat-cards`: `display: grid; grid-template-columns: 1fr; gap: var(--sp-sm);`
- `.stat-card`: `background: var(--bg-subtle); border-radius: 8px; padding: var(--sp-sm) var(--sp-md); text-align: center;`
- `.data-table-wrapper`: `max-height: 250px; overflow-y: auto; border: 1px solid var(--bg-subtle); border-radius: 6px;`
- `.stat-cards-2col`: `grid-template-columns: 1fr 1fr;`
- `.scatter-section`: `margin-top: var(--sp-md); background: var(--bg-card); border-radius: var(--panel-radius); box-shadow: var(--shadow-sm); ...`
- `.scatter-header`: `display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--sp-sm); margin-bottom: v...`
- `.scatter-canvas-wrap`: `display: flex; justify-content: center; overflow-x: auto;`

### 버튼 텍스트
- ▶ 재생
- 취소
- ⏮ 처음
- 🌳 트리 생성
- ⏭ 단계
- 📋 테스트 데이터
- ◀ 이전
- ✕
- 🔄 초기화
- 🎯 직접 입력
- 다음 ▶
- 📊 전체 테스트 실행
- 🔍 추론 모드
- ✅ 적용
- 🌳 학습 & 분석

---

## Kmeans (Kmeans_클러스터링_시뮬레이터_v1_0_0_1_하드코딩수정_2026-02-03_1500.html)

### CSS 변수
| 변수 | 값 |
|------|-----|
| --primary | var(--color-red-500) |
| --primary-dark | var(--color-red-700) |
| --success | var(--color-green-500) |
| --success-dark | var(--color-green-700) |
| --info | var(--color-blue-500) |
| --highlight | var(--color-yellow-500) |
| --bg-light | var(--color-cream-100) |
| --bg-medium | var(--color-cream-200) |
| --text-dark | var(--color-brown-900) |
| --text-medium | var(--color-brown-700) |
| --text-light | var(--color-brown-500) |
| --border-color | var(--color-peach-200) |
| --spacing-xs | 4px |
| --spacing-sm | 8px |
| --spacing-md | 12px |
| --spacing-lg | 16px |
| --spacing-xl | 20px |
| --font-xs | 0.75rem |
| --font-sm | 0.85rem |
| --font-md | 0.9rem |
| --font-lg | 1rem |
| --font-xl | 1.2rem |
| --font-xxl | 1.6rem |
| --sidebar-left-width | 240px |
| --sidebar-right-width | 260px |
| --panel-padding | 16px |
| --panel-radius | 16px |
| --btn-radius | 8px |
| --point-radius | 3px |
| --centroid-radius | 10px |

### 주요 색상
```
  #1565C0
```

### 레이아웃
- `var(--sidebar-left-width) 1fr var(--sidebar-right-width)`
- `block`
- `inline-block`
- `flex`
- `column`
- `inline-flex`
- `grid`

### 주요 컨테이너 클래스
- `.container`: `max-width: 1400px; margin: 0 auto; padding: var(--spacing-xl);`
- `.main-layout`: `display: grid; grid-template-columns: var(--sidebar-left-width) 1fr var(--sidebar-right-width); gap: var(--panel-padding...`
- `.panel`: `background: white; border-radius: var(--panel-radius); padding: var(--panel-padding); box-shadow: var(--shadow-soft);`
- `.sidebar-right`: `display: flex; flex-direction: column; gap: var(--panel-padding);`
- `.playback-controls`: `display: flex; gap: 6px; margin-top: 10px;`
- `.stop`: `background: var(--color-gray-500); color: white;`
- `.chart-area`: `display: flex; flex-direction: column; gap: var(--panel-padding);`
- `.chart-container`: `background: white; border-radius: var(--panel-radius); padding: var(--panel-padding); box-shadow: var(--shadow-soft);`
- `.chart-title`: `font-size: var(--font-md); font-weight: 600; color: var(--text-dark); margin-bottom: 10px; text-align: center;`
- `.canvas-wrapper`: `position: relative; width: 100%; aspect-ratio: 1.3;`
- `.data-table-wrapper`: `max-height: 150px; overflow-y: auto; margin-top: 10px; border: 1px solid var(--border-color); border-radius: var(--btn-r...`
- `.result-grid`: `display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--panel-padding);`
- `.result-section`: `background: var(--bg-medium); border-radius: 12px; padding: 14px;`
- `.main-layout`: `grid-template-columns: 220px 1fr 220px;`
- `.main-layout`: `grid-template-columns: 1fr !important;`

### 버튼 텍스트
- ▶️ 재생
- ⚡ 클러스터링 실행
- ✨ 데이터 생성
- ⏹️ 정지
- 🧠 학습 모드
- 🗑️ 초기화
- 🔮 추론 모드

---

## 스네이크RL (스네이크_강화학습_시뮬레이터_v1_3_0_0.html)

### CSS 변수
| 변수 | 값 |
|------|-----|
| --bg-primary | #000000 |
| --bg-secondary | #0a0a0a |
| --bg-card | #111111 |
| --bg-input | #0a0a0a |
| --border-color | #222222 |
| --text-primary | #e0e0e0 |
| --text-secondary | #999999 |
| --text-muted | #666666 |
| --accent-green | #00ff00 |
| --accent-red | #ff0000 |
| --accent-cyan | #00ccff |
| --accent-yellow | #ffcc00 |
| --accent-orange | #ff8800 |
| --snake-color | #00dd00 |
| --snake-head-color | #00ff00 |
| --food-color | #ff0000 |
| --radius | 4px |
| --transition | 0.15s ease |
| --font-main | 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif |
| --font-mono | 'JetBrains Mono', 'Courier New', monospace |

### 주요 색상
```
  #000
  #001122
  #002200
  #002211
  #005500
  #007700
  #00ccff
  #00dd00
  #00ff00
  #00ff66
  #00ff88
  #00ffaa
  #0a0a0a
  #113311
  #115533
  #1a1a1a
  #221100
  #222
  #222222
  #331111
  #333
  #333311
  #444
  #550000
  #770000
  #ff0000
  #ff4444
  #ffcc00
```

### 레이아웃
- `grid`
- `flex`
- `270px 1fr 320px`

### 주요 컨테이너 클래스
- `.header-title`: `display: flex; align-items: center; gap: 10px;`
- `.header-stats`: `display: flex; gap: 18px; font-size: 0.8rem;`
- `.main-layout`: `display: grid; grid-template-columns: 270px 1fr 320px; gap: 0; min-height: calc(100vh - 100px);`
- `.panel`: `padding: 14px; border-right: 1px solid var(--border-color); background: var(--bg-secondary); overflow-y: auto; max-heigh...`
- `.panel-section`: `margin-bottom: 16px;`
- `.game-area`: `display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px; background: var(--bg...`
- `.game-container`: `position: relative; border: 2px solid #1a3a1a; transition: border-color 0.5s, box-shadow 0.5s;`
- `.compare-grid`: `display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;`
- `.compare-card`: `background: #0a0a0a; border: 1px solid var(--border-color); border-radius: var(--radius); padding: 8px; text-align: cent...`
- `.chart-card`: `background: var(--bg-card); border-radius: var(--radius); border: 1px solid var(--border-color); padding: 10px; margin-b...`
- `.chart-canvas-wrap`: `position: relative; width: 100%; height: 100px;`
- `.q-header`: `text-align: center; color: var(--text-muted); padding: 2px; font-weight: 600;`
- `.explanation-card`: `background: var(--bg-card); border-radius: var(--radius); border: 1px solid var(--border-color); padding: 12px; margin-b...`
- `.toast-container`: `position: fixed; top: 16px; right: 16px; z-index: 1000; display: flex; flex-direction: column; gap: 6px;`
- `.main-layout`: `grid-template-columns: 1fr;`

### 버튼 텍스트
- 🔄 초기화
- ▶️ 학습 시작
- ⏹️ 정지

---

## 틱택토RL (RL_틱택토_시뮬레이터_v3_0_0_0.html)

### CSS 변수
| 변수 | 값 |
|------|-----|
| ---- | |:----:|\n| 강도 | ${xS}/100 | ${oS}/100 |\n| 등급 | ${gX.grade} | ${gO.grade} |\n| ε | ${(agentX.epsilon*100).toFixed(1)}% | ${(agentO.epsilon*100).toFixed(1)}% |\n| 선호 첫수 | ${pX?.[0]?.label||'?'} | ${pO?.[0]?.label||'?'} |\n\n## 📈 최근 승률 (50판)\n\n| 결과 | 비율 |\n|------|------|\n| X 승리 | ${avg(winRates.x).toFixed(1)}% |\n| O 승리 | ${avg(winRates.o).toFixed(1)}% |\n| 무승부 | ${avg(winRates.d).toFixed(1)}% |\n` |

### 레이아웃
- `'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
        onMouseOver={e => { if (!disabled) { e.currentTarget.style.transform = 'translateY(-1px)'`
- `'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '2px', color: T.text }}>
        <span style={{ fontWeight: 'bold' }}>{title}</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span style={{ color: status.c, background: `${status.c}18`, padding: '1px 4px', borderRadius: '3px', fontSize: '0.55rem' }}>{status.i} {status.t}</span>
          <span style={{ color: T.textDim }}>avg:{a.toFixed(1)}</span>
        </div>
      </div>
      <div style={{ height, background: T.graphBg, borderRadius: '4px', padding: '2px', display: 'flex', alignItems: 'flex-end', gap: '1px' }}>
        {data.slice(-60).map((v, i) => (
          <div key={i} style={{ flex: 1, height: `${Math.max(2, ((v - min) / range) * 100)}%`, background: color, borderRadius: '1px 1px 0 0', opacity: 0.5 + (i / 60) * 0.5 }} />
        ))}
      </div>
    </div>
  )`
- `'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', borderRadius: cellSize > 30 ? '8px' : '4px',
                background: isWin ? 'rgba(243,156,18,0.25)' : isHL ? `${T.inputAccent}25` : cell === 'X' ? `${MARK_COLORS.X}18` : cell === 'O' ? `${MARK_COLORS.O}18` : qBg || T.cell,
                border: isWin ? '2px solid #f39c12' : isHL ? `2px solid ${T.inputAccent}` : `1px solid ${T.border}`,
                cursor: canClick ? 'pointer' : 'default', transition: 'all 0.15s', position: 'relative',
                boxShadow: isWin ? '0 0 10px rgba(243,156,18,0.35)' : 'none'
              }}
              onMouseOver={e => { if (canClick) e.currentTarget.style.background = T.cellHover`
- `'flex', alignItems: 'center',
        gap: '5px', fontSize: '0.7rem', color: T.text, transition: 'all 0.3s',
        fontWeight: 'bold'
      }}
      onMouseOver={e => e.currentTarget.style.background = T.panelSolid}
      onMouseOut={e => e.currentTarget.style.background = T.panel}
    >
      <span style={{ fontSize: '0.85rem' }}>{isDark ? '☀️' : '🌙'}</span>
      <span>{isDark ? '밝게' : '어둡게'}</span>
    </button>
  )`
- `'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', overflow: 'auto' }} onClick={onClose}>
      <div style={{ background: T.modalPanel, borderRadius: '16px', padding: '24px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflow: 'auto', border: `1px solid ${T.inputAccent}40`, boxShadow: `0 0 30px ${T.inputAccent}20`, color: T.text }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )`
- `'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.6rem', width: '40px', color: T.textSub }}>{item.icon} {item.label}</span>
          <div style={{ flex: 1, height: '5px', background: T.barTrack, borderRadius: '3px' }}>
            <div style={{ width: `${Math.max(0, Math.min(100, (item.val + 1) * 50))}%`, height: '100%', background: MARK_COLORS.X, borderRadius: '3px', transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: '0.5rem', color: T.textDim, width: '30px', textAlign: 'right' }}>{item.val.toFixed(2)}</span>
        </div>
      ))}
      <div style={{ fontSize: '0.5rem', color: T.textDim, marginTop: '4px' }}>Q-상태: X={insights.xStates} | O={insights.oStates}</div>
    </div>
  )`
- `'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
        {board.map((cell, i) => {
          const isBest = i === bestAction`
- `'flex', justifyContent: 'space-between' }}>
        <span>🟢 높음 = 유리</span><span>🔴 낮음 = 불리</span>
      </div>
    </div>
  )`
- `'inline-block', background: T.panelDeep, padding: cellSize > 30 ? '10px' : '5px', borderRadius: '10px', border: `1px solid ${T.borderLight}`, transition: 'background 0.3s' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${cellSize}px)`, gap: cellSize > 30 ? '4px' : '2px' }}>
        {board.map((cell, i) => {
          const isWin = winLine && winLine.includes(i)`
- `'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: T.modalPanel, borderRadius: '16px', padding: '28px', border: '2px solid #e74c3c', boxShadow: '0 0 40px rgba(231,76,60,0.3)', textAlign: 'center', minWidth: '300px', maxWidth: '400px', color: T.text }}>
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⚠️</div>
        <h2 style={{ margin: '0 0 10px', color: '#e74c3c', fontSize: '1.2rem' }}>학습 초기화</h2>
        <p style={{ margin: '0 0 20px', color: T.textSub, fontSize: '0.9rem', lineHeight: 1.5 }}>
          정말로 초기화하시겠습니까?<br/><strong style={{ color: '#e74c3c' }}>{gen.toLocaleString()}판</strong>의 학습 데이터가 삭제됩니다.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={onConfirm} style={{ padding: '12px', background: '#e74c3c', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>🗑️ 초기화 실행</button>
          <button onClick={onCancel} style={{ padding: '12px', background: T.cancelBtn, border: `1px solid ${T.cancelBorder}`, borderRadius: '8px', color: T.text, fontWeight: 'bold', cursor: 'pointer' }}>← 취소</button>
        </div>
      </div>
    </div>
  )`

### 주요 컨테이너 클래스

### 버튼 텍스트
- 확인
- setSyncParams(!syncParams)} style={{
                padding: '1px 6px', background: syncParams ? T.syncOn : T.syncOff,
                border: 'none', borderRadius: '8px', color: syncParams ? '#fff' : T.syncTextOff,
                fontSize: '0.5rem', fontWeight: 'bold', cursor: 'pointer'
              }}>{syncParams ? '🔗동기' : '🔓별도'}
- 🗑️ 초기화 실행
- setShow(true)} onMouseLeave={() => setShow(false)}
        style={{ width: '100%', padding: '8px', background: `${color}18`, border: `1px solid ${color}40`, borderRadius: '5px', color, cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }}
        onMouseOver={e => { e.currentTarget.style.background = `${color}30`; }}
        onMouseOut={e => { e.currentTarget.style.background = `${color}18`; }}
      >{icon}
- ← 취소

---
