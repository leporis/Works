import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// ============================================
// 설정
// ============================================
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 8;

const TETROMINOES = {
  I: { shape: [[1,1,1,1]], color: '#00f5ff' },
  O: { shape: [[1,1],[1,1]], color: '#ffd700' },
  T: { shape: [[0,1,0],[1,1,1]], color: '#9b59b6' },
  S: { shape: [[0,1,1],[1,1,0]], color: '#2ecc71' },
  Z: { shape: [[1,1,0],[0,1,1]], color: '#e74c3c' },
  J: { shape: [[1,0,0],[1,1,1]], color: '#3498db' },
  L: { shape: [[0,0,1],[1,1,1]], color: '#e67e22' }
};

const STAGES = [
  { name: '초기', min: 0, max: 100, color: '#e74c3c', icon: '🌱' },
  { name: '탐색', min: 100, max: 500, color: '#e67e22', icon: '🔍' },
  { name: '학습', min: 500, max: 2000, color: '#f1c40f', icon: '📚' },
  { name: '응용', min: 2000, max: 5000, color: '#2ecc71', icon: '🎯' },
  { name: '숙련', min: 5000, max: 10000, color: '#00f5ff', icon: '🏆' }
];

// ============================================
// 신경망
// ============================================
class NeuralNetwork {
  constructor(layers) {
    this.layers = layers;
    this.weights = [];
    this.biases = [];
    
    for (let i = 0; i < layers.length - 1; i++) {
      const std = Math.sqrt(2.0 / layers[i]);
      this.weights.push(Array(layers[i]).fill().map(() => Array(layers[i+1]).fill().map(() => (Math.random() - 0.5) * 2 * std)));
      this.biases.push(Array(layers[i+1]).fill(0));
    }
    
    this.m_w = this.weights.map(w => w.map(row => row.map(() => 0)));
    this.v_w = this.weights.map(w => w.map(row => row.map(() => 0)));
    this.m_b = this.biases.map(b => b.map(() => 0));
    this.v_b = this.biases.map(b => b.map(() => 0));
    this.t = 0;
  }

  forward(input, training = false) {
    const acts = [input], pres = [input];
    let cur = input;
    for (let l = 0; l < this.weights.length; l++) {
      const z = this.biases[l].map((b, j) => {
        let sum = b;
        for (let i = 0; i < cur.length; i++) sum += cur[i] * this.weights[l][i][j];
        return sum;
      });
      pres.push(z);
      cur = l === this.weights.length - 1 ? z : z.map(x => Math.max(0, x));
      acts.push(cur);
    }
    return training ? { output: cur, acts, pres } : cur;
  }

  backward(acts, pres, targets, lr = 0.001) {
    const n = this.weights.length;
    let delta = acts[n].map((o, i) => o - targets[i]);
    
    for (let l = n - 1; l >= 0; l--) {
      const gW = this.weights[l].map(row => row.map(() => 0));
      const gB = delta.slice();
      
      for (let i = 0; i < acts[l].length; i++)
        for (let j = 0; j < delta.length; j++)
          gW[i][j] = acts[l][i] * delta[j];
      
      if (l > 0) {
        const newD = [];
        for (let i = 0; i < this.weights[l].length; i++) {
          let sum = 0;
          for (let j = 0; j < delta.length; j++) sum += this.weights[l][i][j] * delta[j];
          newD.push(sum * (pres[l][i] > 0 ? 1 : 0));
        }
        delta = newD;
      }
      
      this.adam(l, gW, gB, lr);
    }
    return targets.reduce((s, t, i) => s + (acts[n][i] - t) ** 2, 0) / targets.length;
  }

  adam(l, gW, gB, lr, b1 = 0.9, b2 = 0.999, e = 1e-8) {
    this.t++;
    const c1 = 1 - b1 ** this.t, c2 = 1 - b2 ** this.t;
    for (let i = 0; i < this.weights[l].length; i++) {
      for (let j = 0; j < this.weights[l][i].length; j++) {
        this.m_w[l][i][j] = b1 * this.m_w[l][i][j] + (1 - b1) * gW[i][j];
        this.v_w[l][i][j] = b2 * this.v_w[l][i][j] + (1 - b2) * gW[i][j] ** 2;
        this.weights[l][i][j] -= lr * (this.m_w[l][i][j] / c1) / (Math.sqrt(this.v_w[l][i][j] / c2) + e);
      }
    }
    for (let j = 0; j < this.biases[l].length; j++) {
      this.m_b[l][j] = b1 * this.m_b[l][j] + (1 - b1) * gB[j];
      this.v_b[l][j] = b2 * this.v_b[l][j] + (1 - b2) * gB[j] ** 2;
      this.biases[l][j] -= lr * (this.m_b[l][j] / c1) / (Math.sqrt(this.v_b[l][j] / c2) + e);
    }
  }

  clone() {
    const nn = new NeuralNetwork(this.layers);
    nn.weights = this.weights.map(w => w.map(r => [...r]));
    nn.biases = this.biases.map(b => [...b]);
    return nn;
  }
}

// ============================================
// 게임 로직
// ============================================
const createBoard = () => Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(null));

const rotate = (s) => {
  const r = Array(s[0].length).fill().map(() => Array(s.length).fill(0));
  for (let y = 0; y < s.length; y++) for (let x = 0; x < s[y].length; x++) r[x][s.length - 1 - y] = s[y][x];
  return r;
};

const getRotations = (s) => {
  const rots = [s];
  let c = s;
  for (let i = 0; i < 3; i++) {
    c = rotate(c);
    if (!rots.some(r => JSON.stringify(r) === JSON.stringify(c))) rots.push(c);
  }
  return rots;
};

const valid = (b, s, x, y) => {
  for (let py = 0; py < s.length; py++)
    for (let px = 0; px < s[py].length; px++)
      if (s[py][px]) {
        const nx = x + px, ny = y + py;
        if (nx < 0 || nx >= BOARD_WIDTH || ny >= BOARD_HEIGHT || (ny >= 0 && b[ny][nx])) return false;
      }
  return true;
};

const place = (b, s, c, x, y) => {
  const nb = b.map(r => [...r]);
  for (let py = 0; py < s.length; py++)
    for (let px = 0; px < s[py].length; px++)
      if (s[py][px] && y + py >= 0) nb[y + py][x + px] = c;
  return nb;
};

const clear = (b) => {
  let lines = 0;
  const nb = b.filter(r => { if (r.every(c => c)) { lines++; return false; } return true; });
  while (nb.length < BOARD_HEIGHT) nb.unshift(Array(BOARD_WIDTH).fill(null));
  return { board: nb, lines };
};

const drop = (b, s, x) => { let y = 0; while (valid(b, s, x, y + 1)) y++; return y; };

const features = (b) => {
  let h = 0, holes = 0, bump = 0, maxH = 0;
  const hs = [];
  for (let x = 0; x < BOARD_WIDTH; x++) {
    let ch = 0, found = false;
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      if (b[y][x]) { if (!found) { ch = BOARD_HEIGHT - y; found = true; } }
      else if (found) holes++;
    }
    hs.push(ch); h += ch; maxH = Math.max(maxH, ch);
  }
  for (let i = 0; i < hs.length - 1; i++) bump += Math.abs(hs[i] - hs[i + 1]);
  return [h / 200, holes / 50, bump / 20, maxH / 20];
};

const placements = (b, type) => {
  const p = TETROMINOES[type], rots = getRotations(p.shape), result = [];
  for (let ri = 0; ri < rots.length; ri++) {
    const s = rots[ri];
    for (let x = 0; x <= BOARD_WIDTH - s[0].length; x++) {
      if (valid(b, s, x, 0)) {
        const y = drop(b, s, x);
        const nb = place(b, s, p.color, x, y);
        const { board: cb, lines } = clear(nb);
        result.push({ x, y, s, c: p.color, board: cb, lines, feat: features(cb) });
      }
    }
  }
  return result;
};

// ============================================
// DQN Agent
// ============================================
class Agent {
  constructor() {
    this.net = new NeuralNetwork([4, 64, 32, 1]);
    this.target = this.net.clone();
    this.eps = 1.0;
    this.epsMin = 0.01;
    this.epsDecay = 0.9992;
    this.gamma = 0.99;
    this.lr = 0.001;
    this.mem = [];
    this.maxMem = 30000;
    this.batch = 32;
    this.updateEvery = 500;
    this.steps = 0;
  }

  choose(ps) {
    if (!ps.length) return null;
    if (Math.random() < this.eps) return ps[Math.floor(Math.random() * ps.length)];
    let best = ps[0], bestQ = this.net.forward(ps[0].feat)[0];
    for (let i = 1; i < ps.length; i++) {
      const q = this.net.forward(ps[i].feat)[0];
      if (q > bestQ) { bestQ = q; best = ps[i]; }
    }
    return best;
  }

  remember(s, r, ns, d) {
    this.mem.push({ s, r, ns, d });
    if (this.mem.length > this.maxMem) this.mem.shift();
  }

  replay() {
    if (this.mem.length < this.batch) return 0;
    let loss = 0;
    for (let i = 0; i < this.batch; i++) {
      const { s, r, ns, d } = this.mem[Math.floor(Math.random() * this.mem.length)];
      const tgt = d ? r : r + this.gamma * this.target.forward(ns)[0];
      const { acts, pres } = this.net.forward(s, true);
      loss += this.net.backward(acts, pres, [tgt], this.lr);
    }
    if (this.eps > this.epsMin) this.eps *= this.epsDecay;
    this.steps++;
    if (this.steps % this.updateEvery === 0) this.target = this.net.clone();
    return loss / this.batch;
  }
}

// ============================================
// 그래프 컴포넌트
// ============================================
const Graph = ({ data, color, height = 80, title, showTrend = true }) => {
  if (data.length < 2) return <div style={{ height, opacity: 0.3, fontSize: '0.7rem' }}>데이터 수집 중...</div>;
  
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  
  const n = data.length;
  const xMean = (n - 1) / 2, yMean = avg;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (i - xMean) * (data[i] - yMean); den += (i - xMean) ** 2; }
  const slope = den ? num / den : 0;
  const trend = slope > 0.1 ? '📈' : slope < -0.1 ? '📉' : '➡️';
  
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{title}</span>
        <div style={{ fontSize: '0.65rem', display: 'flex', gap: '6px' }}>
          {showTrend && <span>{trend}</span>}
          <span style={{ opacity: 0.6 }}>avg:{avg.toFixed(1)}</span>
          <span style={{ color }}>max:{max.toFixed(0)}</span>
        </div>
      </div>
      <div style={{ height, background: 'rgba(0,0,0,0.3)', borderRadius: '4px', padding: '3px', display: 'flex', alignItems: 'flex-end', gap: '1px', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${((avg - min) / range) * 100}%`, height: '1px', background: 'rgba(255,255,255,0.15)', borderTop: '1px dashed rgba(255,255,255,0.2)' }} />
        {data.slice(-80).map((v, i) => (
          <div key={i} style={{ flex: 1, height: `${Math.max(2, ((v - min) / range) * 100)}%`, background: `linear-gradient(to top, ${color}88, ${color})`, borderRadius: '1px 1px 0 0' }} />
        ))}
      </div>
    </div>
  );
};

// ============================================
// 학습 해설 컴포넌트
// ============================================
const LearningExplanation = ({ gen, eps, scores, lines, pieces, losses, isTraining }) => {
  const avg = (arr, n = 30) => arr.length ? arr.slice(-n).reduce((a, b) => a + b, 0) / Math.min(arr.length, n) : 0;
  const trend = (arr) => {
    if (arr.length < 40) return 0;
    const recent = avg(arr, 20);
    const older = avg(arr.slice(-50, -20), 30);
    return older > 0 ? ((recent - older) / older) * 100 : 0;
  };

  const stage = STAGES.find(s => gen >= s.min && gen < s.max) || STAGES[STAGES.length - 1];
  const nextStage = STAGES.find(s => s.min > gen);
  const scoreTrend = trend(scores);
  const piecesTrend = trend(pieces);

  // 현재 상황 분석
  const analysis = useMemo(() => {
    if (!isTraining) {
      return {
        status: 'ready',
        icon: '⏸️',
        title: '학습 대기 중',
        color: '#888',
        description: '▶️ 학습 버튼을 눌러 AI 훈련을 시작하세요!',
        details: [
          'AI는 처음에 아무것도 모르는 상태입니다.',
          '학습을 시작하면 무작위로 블록을 놓으면서 경험을 쌓습니다.',
          '시행착오를 통해 점점 더 나은 전략을 배웁니다.'
        ],
        tip: '💡 속도를 5~10ms로 설정하면 빠르게 학습합니다.'
      };
    }

    if (gen < 50) {
      return {
        status: 'collecting',
        icon: '🔄',
        title: '경험 수집 중',
        color: '#9b59b6',
        description: `AI가 무작위로 플레이하며 데이터를 모으고 있어요. (${gen}/50)`,
        details: [
          '🎲 지금은 100% 무작위로 블록을 놓고 있습니다.',
          '📦 각 행동의 결과를 "기억(Memory)"에 저장 중입니다.',
          '🧠 충분한 데이터가 모이면 본격적인 학습이 시작됩니다.'
        ],
        tip: '💡 아직은 점수가 낮아도 정상입니다. 조금만 기다려주세요!'
      };
    }

    if (eps > 0.7) {
      return {
        status: 'exploring',
        icon: '🔍',
        title: '탐색 단계',
        color: '#e67e22',
        description: `AI가 다양한 전략을 시도하며 배우고 있어요. (탐색률 ${(eps*100).toFixed(0)}%)`,
        details: [
          `🎲 ${(eps*100).toFixed(0)}%의 확률로 무작위 행동을 합니다.`,
          '📊 "이렇게 하면 어떻게 될까?" 실험 중입니다.',
          '🧪 좋은 결과가 나온 행동은 더 자주 선택하게 됩니다.'
        ],
        tip: '💡 탐색률이 50% 이하로 떨어지면 학습 효과가 보이기 시작합니다.'
      };
    }

    if (eps > 0.3) {
      const improving = scoreTrend > 5 || piecesTrend > 5;
      return {
        status: improving ? 'learning' : 'struggling',
        icon: improving ? '📚' : '🤔',
        title: improving ? '학습 진행 중!' : '패턴 탐색 중',
        color: improving ? '#f1c40f' : '#e67e22',
        description: improving 
          ? `AI가 점점 나아지고 있어요! 점수가 ${scoreTrend > 0 ? '+' : ''}${scoreTrend.toFixed(0)}% 변화`
          : 'AI가 좋은 전략을 찾기 위해 노력하고 있어요.',
        details: improving ? [
          '✅ 구멍을 피하는 방법을 배우고 있습니다.',
          '✅ 블록을 낮게 쌓는 것이 좋다는 걸 알아가고 있어요.',
          `📈 평균 생존 피스: ${avg(pieces).toFixed(0)}개`
        ] : [
          '🔄 여러 전략을 비교하며 최적의 방법을 찾고 있습니다.',
          '⏳ 조금 더 시간이 필요합니다.',
          `📊 현재 평균 점수: ${avg(scores).toFixed(0)}점`
        ],
        tip: improving 
          ? '💡 그래프가 우상향하면 학습이 잘 되고 있는 것입니다!'
          : '💡 학습에는 시간이 걸립니다. 500게임 이상 진행해보세요.'
      };
    }

    if (eps > 0.1) {
      return {
        status: 'optimizing',
        icon: '🎯',
        title: '전략 최적화 중',
        color: '#2ecc71',
        description: `AI가 배운 것을 활용하면서 더 개선하고 있어요! (활용률 ${((1-eps)*100).toFixed(0)}%)`,
        details: [
          `✨ ${((1-eps)*100).toFixed(0)}%의 확률로 최선의 선택을 합니다.`,
          '🎓 구멍 최소화, 낮은 높이 유지를 학습했습니다.',
          `🏆 최고 점수: ${Math.max(...scores, 0)}점`
        ],
        tip: '💡 곧 안정적인 플레이를 보여줄 거예요!'
      };
    }

    return {
      status: 'mastering',
      icon: '🏆',
      title: 'AI 숙련 단계!',
      color: '#00f5ff',
      description: `AI가 거의 완벽하게 학습했어요! (활용률 ${((1-eps)*100).toFixed(0)}%)`,
      details: [
        '🧠 AI가 최적의 전략을 터득했습니다!',
        '♟️ 매 순간 가장 좋은 위치를 계산합니다.',
        `📊 평균 ${avg(pieces).toFixed(0)}개의 블록을 버팁니다.`
      ],
      tip: '💡 이제 AI 플레이를 관찰해보세요. 사람보다 잘할 수도 있어요!'
    };
  }, [gen, eps, scores, pieces, isTraining, scoreTrend, piecesTrend]);

  return (
    <div style={{
      background: `linear-gradient(135deg, ${analysis.color}15, ${analysis.color}08)`,
      border: `1px solid ${analysis.color}40`,
      borderRadius: '10px',
      padding: '15px',
      marginTop: '12px'
    }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <span style={{ fontSize: '1.8rem' }}>{analysis.icon}</span>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '1rem', color: analysis.color }}>
            {analysis.title}
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
            {analysis.description}
          </div>
        </div>
      </div>

      {/* 상세 설명 */}
      <div style={{
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '12px'
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '8px', opacity: 0.7 }}>
          🔬 지금 무슨 일이 일어나고 있나요?
        </div>
        {analysis.details.map((detail, i) => (
          <div key={i} style={{ fontSize: '0.8rem', marginBottom: '4px', lineHeight: 1.5 }}>
            {detail}
          </div>
        ))}
      </div>

      {/* 팁 */}
      <div style={{
        background: 'rgba(255,215,0,0.1)',
        border: '1px solid rgba(255,215,0,0.3)',
        borderRadius: '6px',
        padding: '10px',
        fontSize: '0.8rem'
      }}>
        {analysis.tip}
      </div>

      {/* 다음 단계 안내 */}
      {nextStage && isTraining && (
        <div style={{
          marginTop: '12px',
          padding: '10px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '6px',
          fontSize: '0.75rem'
        }}>
          <div style={{ opacity: 0.7, marginBottom: '4px' }}>📍 다음 단계까지</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                width: `${((gen - stage.min) / (stage.max - stage.min)) * 100}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${stage.color}, ${nextStage.color})`,
                borderRadius: '3px'
              }} />
            </div>
            <span style={{ color: nextStage.color }}>
              {nextStage.icon} {nextStage.name}
            </span>
            <span style={{ opacity: 0.5 }}>
              ({nextStage.min - gen}게임 남음)
            </span>
          </div>
        </div>
      )}

      {/* 용어 설명 */}
      {isTraining && (
        <details style={{ marginTop: '12px', fontSize: '0.7rem' }}>
          <summary style={{ cursor: 'pointer', opacity: 0.7, marginBottom: '8px' }}>
            📖 용어 설명 (클릭해서 펼치기)
          </summary>
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '6px',
            padding: '10px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px'
          }}>
            <div>
              <strong style={{ color: '#f1c40f' }}>탐색률 (ε)</strong>
              <p style={{ margin: '2px 0', opacity: 0.8 }}>무작위로 행동할 확률. 높으면 다양한 시도, 낮으면 배운 대로 행동.</p>
            </div>
            <div>
              <strong style={{ color: '#e74c3c' }}>손실 (Loss)</strong>
              <p style={{ margin: '2px 0', opacity: 0.8 }}>AI 예측과 실제 결과의 차이. 낮을수록 학습이 잘 된 것.</p>
            </div>
            <div>
              <strong style={{ color: '#9b59b6' }}>메모리</strong>
              <p style={{ margin: '2px 0', opacity: 0.8 }}>과거 경험 저장소. AI는 여기서 무작위로 꺼내 학습.</p>
            </div>
            <div>
              <strong style={{ color: '#2ecc71' }}>생존 피스</strong>
              <p style={{ margin: '2px 0', opacity: 0.8 }}>게임오버 전까지 놓은 블록 수. 많을수록 오래 버틴 것.</p>
            </div>
          </div>
        </details>
      )}
    </div>
  );
};

// ============================================
// 메인 컴포넌트
// ============================================
export default function TetrisRL() {
  const [board, setBoard] = useState(createBoard);
  const [piece, setPiece] = useState(null);
  const [next, setNext] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [speed, setSpeed] = useState(20);
  const [agent] = useState(() => new Agent());
  
  const [gen, setGen] = useState(0);
  const [scores, setScores] = useState([]);
  const [lines, setLines] = useState([]);
  const [pieces, setPieces] = useState([]);
  const [losses, setLosses] = useState([]);
  const [bestScore, setBest] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [currentLines, setCurrentLines] = useState(0);
  
  const loopRef = useRef(null);
  const prevFeat = useRef(null);
  const pieceCount = useRef(0);
  const startTime = useRef(Date.now());

  const randPiece = () => Object.keys(TETROMINOES)[Math.floor(Math.random() * 7)];

  const reset = useCallback(() => {
    setBoard(createBoard());
    setPiece(randPiece());
    setNext(randPiece());
    setCurrentScore(0);
    setCurrentLines(0);
    prevFeat.current = features(createBoard());
    pieceCount.current = 0;
  }, []);

  useEffect(() => {
    if (!isTraining) { if (loopRef.current) clearInterval(loopRef.current); return; }
    if (!piece) { reset(); return; }

    loopRef.current = setInterval(() => {
      const ps = placements(board, piece);
      
      if (!ps.length) {
        if (prevFeat.current) agent.remember(prevFeat.current, -5, features(board), true);
        const loss = agent.replay();
        
        setGen(g => g + 1);
        setScores(s => [...s.slice(-500), currentScore]);
        setLines(l => [...l.slice(-500), currentLines]);
        setPieces(p => [...p.slice(-500), pieceCount.current]);
        if (loss > 0) setLosses(l => [...l.slice(-500), loss]);
        if (currentScore > bestScore) setBest(currentScore);
        
        reset();
        return;
      }

      const chosen = agent.choose(ps);
      const pf = prevFeat.current || features(board);
      
      const reward = 
        chosen.lines ** 2 * 10 +
        (pf[1] - chosen.feat[1]) * 5 +
        (pf[0] - chosen.feat[0]) * 2 +
        (pf[2] - chosen.feat[2]) * 1 +
        0.1;
      
      if (prevFeat.current) agent.remember(prevFeat.current, reward, chosen.feat, false);
      
      prevFeat.current = chosen.feat;
      setBoard(chosen.board);
      setCurrentScore(s => s + [0, 100, 300, 500, 800][chosen.lines]);
      setCurrentLines(l => l + chosen.lines);
      setPiece(next);
      setNext(randPiece());
      pieceCount.current++;
      
      if (pieceCount.current % 5 === 0) agent.replay();
    }, speed);

    return () => { if (loopRef.current) clearInterval(loopRef.current); };
  }, [isTraining, piece, next, board, currentScore, currentLines, bestScore, agent, speed, reset]);

  useEffect(() => { if (!piece) reset(); }, [piece, reset]);

  const stage = STAGES.find(s => gen >= s.min && gen < s.max) || STAGES[STAGES.length - 1];
  const progress = Math.min(100, (gen / 10000) * 100);
  const avg = (arr, n = 50) => arr.length ? arr.slice(-n).reduce((a, b) => a + b, 0) / Math.min(arr.length, n) : 0;
  const elapsed = (Date.now() - startTime.current) / 1000;
  const gps = gen / (elapsed || 1);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d0d1a, #1a1a2e)',
      fontFamily: "'JetBrains Mono', monospace",
      color: '#e0e0e0',
      padding: '15px'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <h1 style={{
          fontSize: '1.4rem',
          background: 'linear-gradient(90deg, #00f5ff, #ff00ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0
        }}>
          🧠 Tetris DQN Learning Monitor
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '15px', maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* 왼쪽: 미니 게임 */}
        <div style={{ width: '120px', flexShrink: 0 }}>
          <div style={{ background: 'rgba(0,0,0,0.5)', padding: '5px', borderRadius: '6px', marginBottom: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)`, gap: '0px' }}>
              {board.map((row, y) => row.map((cell, x) => (
                <div key={`${x}-${y}`} style={{ width: CELL_SIZE, height: CELL_SIZE, background: cell || 'rgba(30,30,50,0.8)', borderRadius: '1px' }} />
              )))}
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', fontSize: '0.65rem', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.6 }}>Score</span><span style={{ color: '#00f5ff' }}>{currentScore}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.6 }}>Lines</span><span style={{ color: '#ff00ff' }}>{currentLines}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.6 }}>Pieces</span><span style={{ color: '#ffd700' }}>{pieceCount.current}</span></div>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '0.6rem', opacity: 0.6, marginBottom: '2px' }}>속도: {speed}ms</div>
            <input type="range" min="5" max="100" value={speed} onChange={e => setSpeed(Number(e.target.value))} style={{ width: '100%', accentColor: '#00f5ff' }} />
          </div>

          <button
            onClick={() => { if (!isTraining) startTime.current = Date.now(); setIsTraining(!isTraining); if (!isTraining) reset(); }}
            style={{ width: '100%', padding: '10px', background: isTraining ? '#e74c3c' : '#2ecc71', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            {isTraining ? '⏹ 정지' : '▶️ 학습'}
          </button>
        </div>

        {/* 오른쪽: 대시보드 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          
          {/* 진행 상태 */}
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.1rem' }}>{stage.icon}</span>
                <span style={{ fontWeight: 'bold', color: stage.color, fontSize: '0.9rem' }}>{stage.name}</span>
              </div>
              <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                #{gen} | {gps.toFixed(1)}/sec
              </div>
            </div>
            
            <div style={{ position: 'relative', height: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', overflow: 'hidden' }}>
              {STAGES.map((s, i) => (
                <div key={i} style={{
                  position: 'absolute', left: `${(s.min / 10000) * 100}%`, width: `${((s.max - s.min) / 10000) * 100}%`, height: '100%',
                  background: gen >= s.max ? s.color : (gen >= s.min ? `${s.color}66` : 'transparent'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', borderRight: '1px solid rgba(0,0,0,0.3)'
                }}>{s.icon}</div>
              ))}
              <div style={{ position: 'absolute', left: `${progress}%`, top: 0, bottom: 0, width: '2px', background: 'white', boxShadow: '0 0 6px white' }} />
            </div>
          </div>

          {/* 지표 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '10px' }}>
            {[
              { label: 'Best', value: bestScore, color: '#2ecc71', icon: '🏆' },
              { label: 'Avg', value: avg(scores).toFixed(0), color: '#3498db', icon: '📊' },
              { label: 'Lines', value: avg(lines).toFixed(1), color: '#9b59b6', icon: '📏' },
              { label: 'Pieces', value: avg(pieces).toFixed(0), color: '#e67e22', icon: '🧩' },
              { label: 'ε', value: agent.eps.toFixed(2), color: '#f1c40f', icon: '🎲' },
            ].map((m, i) => (
              <div key={i} style={{ background: `${m.color}18`, border: `1px solid ${m.color}40`, borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.55rem', opacity: 0.7 }}>{m.icon} {m.label}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* 그래프 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px' }}>
              <Graph data={scores} color="#3498db" title="📊 점수" height={55} />
              <Graph data={lines} color="#9b59b6" title="📏 라인" height={45} />
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px' }}>
              <Graph data={pieces} color="#2ecc71" title="🧩 생존 피스" height={55} />
              <Graph data={losses} color="#e74c3c" title="📉 손실" height={45} showTrend={false} />
            </div>
          </div>

          {/* 학습 해설 패널 */}
          <LearningExplanation 
            gen={gen}
            eps={agent.eps}
            scores={scores}
            lines={lines}
            pieces={pieces}
            losses={losses}
            isTraining={isTraining}
          />
        </div>
      </div>
    </div>
  );
}
