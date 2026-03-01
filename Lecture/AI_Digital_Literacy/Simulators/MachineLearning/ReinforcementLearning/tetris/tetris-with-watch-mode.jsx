import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// ============================================
// 설정
// ============================================
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

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

  choose(ps, forceExploit = false) {
    if (!ps.length) return null;
    if (!forceExploit && Math.random() < this.eps) return ps[Math.floor(Math.random() * ps.length)];
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
const Graph = ({ data, color, height = 60, title }) => {
  if (data.length < 2) return <div style={{ height, opacity: 0.3, fontSize: '0.7rem' }}>데이터 수집 중...</div>;
  
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  const n = data.length, xMean = (n - 1) / 2;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (i - xMean) * (data[i] - avg); den += (i - xMean) ** 2; }
  const slope = den ? num / den : 0;
  const trend = slope > 0.1 ? '📈' : slope < -0.1 ? '📉' : '➡️';
  
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '2px' }}>
        <span style={{ fontWeight: 'bold' }}>{title}</span>
        <span>{trend} avg:{avg.toFixed(0)} max:{max.toFixed(0)}</span>
      </div>
      <div style={{ height, background: 'rgba(0,0,0,0.3)', borderRadius: '4px', padding: '2px', display: 'flex', alignItems: 'flex-end', gap: '1px' }}>
        {data.slice(-60).map((v, i) => (
          <div key={i} style={{ flex: 1, height: `${Math.max(2, ((v - min) / range) * 100)}%`, background: color, borderRadius: '1px 1px 0 0' }} />
        ))}
      </div>
    </div>
  );
};

// ============================================
// 학습 해설 컴포넌트
// ============================================
const LearningExplanation = ({ gen, eps, scores, pieces, isTraining }) => {
  const avg = (arr, n = 30) => arr.length ? arr.slice(-n).reduce((a, b) => a + b, 0) / Math.min(arr.length, n) : 0;
  const trend = (arr) => {
    if (arr.length < 40) return 0;
    return avg(arr, 20) - avg(arr.slice(-50, -20), 30);
  };
  const scoreTrend = trend(scores);

  const analysis = useMemo(() => {
    if (!isTraining) return { icon: '⏸️', title: '학습 대기 중', color: '#888', desc: '▶️ 학습 버튼을 눌러 시작하세요!', details: ['AI는 처음에 아무것도 모릅니다.', '학습하면서 점점 똑똑해집니다.'], tip: '💡 속도 5~10ms로 설정하면 빠른 학습!' };
    if (gen < 50) return { icon: '🔄', title: '경험 수집 중', color: '#9b59b6', desc: `데이터 모으는 중... (${gen}/50)`, details: ['🎲 100% 무작위 행동 중', '📦 결과를 메모리에 저장 중'], tip: '💡 점수가 낮아도 정상입니다!' };
    if (eps > 0.7) return { icon: '🔍', title: '탐색 단계', color: '#e67e22', desc: `다양한 전략 시도 중 (탐색 ${(eps*100).toFixed(0)}%)`, details: [`🎲 ${(eps*100).toFixed(0)}% 무작위 행동`, '🧪 좋은 행동 찾는 중'], tip: '💡 탐색률 50% 이하면 효과 보임' };
    if (eps > 0.3) return { icon: scoreTrend > 0 ? '📚' : '🤔', title: scoreTrend > 0 ? '학습 진행 중!' : '패턴 탐색 중', color: scoreTrend > 0 ? '#f1c40f' : '#e67e22', desc: scoreTrend > 0 ? '점수가 올라가고 있어요!' : '좋은 전략을 찾고 있어요', details: scoreTrend > 0 ? ['✅ 구멍 피하기 학습 중', `📈 평균 피스: ${avg(pieces).toFixed(0)}개`] : ['🔄 여러 전략 비교 중', '⏳ 시간이 더 필요해요'], tip: scoreTrend > 0 ? '💡 그래프 우상향 = 성공!' : '💡 500게임 이상 해보세요' };
    if (eps > 0.1) return { icon: '🎯', title: '전략 최적화', color: '#2ecc71', desc: `배운 것 활용 중! (활용 ${((1-eps)*100).toFixed(0)}%)`, details: [`✨ ${((1-eps)*100).toFixed(0)}% 최선의 선택`, '🎓 전략 학습 완료'], tip: '💡 곧 안정적 플레이!' };
    return { icon: '🏆', title: 'AI 숙련!', color: '#00f5ff', desc: `거의 완벽! (활용 ${((1-eps)*100).toFixed(0)}%)`, details: ['🧠 최적 전략 터득!', `📊 평균 ${avg(pieces).toFixed(0)}개 버팀`], tip: '💡 관전 모드로 AI 플레이를 감상하세요!' };
  }, [gen, eps, scores, pieces, isTraining, scoreTrend]);

  return (
    <div style={{ background: `${analysis.color}15`, border: `1px solid ${analysis.color}40`, borderRadius: '8px', padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '1.5rem' }}>{analysis.icon}</span>
        <div>
          <div style={{ fontWeight: 'bold', color: analysis.color }}>{analysis.title}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>{analysis.desc}</div>
        </div>
      </div>
      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '8px', marginBottom: '8px', fontSize: '0.75rem' }}>
        {analysis.details.map((d, i) => <div key={i} style={{ marginBottom: '2px' }}>{d}</div>)}
      </div>
      <div style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '4px', padding: '6px', fontSize: '0.75rem' }}>
        {analysis.tip}
      </div>
    </div>
  );
};

// ============================================
// 게임 보드 컴포넌트
// ============================================
const GameBoard = ({ board, cellSize, showGlow = false }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${cellSize}px)`,
    gap: cellSize > 15 ? '1px' : '0px',
    background: 'rgba(0,0,0,0.5)',
    padding: cellSize > 15 ? '8px' : '4px',
    borderRadius: '8px',
    border: showGlow ? '2px solid rgba(0,245,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
    boxShadow: showGlow ? '0 0 20px rgba(0,245,255,0.3)' : 'none'
  }}>
    {board.map((row, y) => row.map((cell, x) => (
      <div key={`${x}-${y}`} style={{
        width: cellSize,
        height: cellSize,
        background: cell || 'rgba(30,30,50,0.8)',
        borderRadius: cellSize > 15 ? '3px' : '1px',
        boxShadow: cell && cellSize > 15 ? `0 0 ${cellSize/2}px ${cell}` : 'none',
        transition: 'background 0.1s'
      }} />
    )))}
  </div>
);

// ============================================
// 메인 컴포넌트
// ============================================
export default function TetrisRL() {
  const [board, setBoard] = useState(createBoard);
  const [piece, setPiece] = useState(null);
  const [next, setNext] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'watch'
  const [speed, setSpeed] = useState(20);
  const [watchSpeed, setWatchSpeed] = useState(150);
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

  // 게임 루프
  useEffect(() => {
    if (!isTraining) { if (loopRef.current) clearInterval(loopRef.current); return; }
    if (!piece) { reset(); return; }

    const currentSpeed = viewMode === 'watch' ? watchSpeed : speed;

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

      // 관전 모드에서는 항상 최선의 선택 (학습은 계속 진행)
      const chosen = agent.choose(ps, viewMode === 'watch');
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
    }, currentSpeed);

    return () => { if (loopRef.current) clearInterval(loopRef.current); };
  }, [isTraining, piece, next, board, currentScore, currentLines, bestScore, agent, speed, watchSpeed, viewMode, reset]);

  useEffect(() => { if (!piece) reset(); }, [piece, reset]);

  const stage = STAGES.find(s => gen >= s.min && gen < s.max) || STAGES[STAGES.length - 1];
  const avg = (arr, n = 50) => arr.length ? arr.slice(-n).reduce((a, b) => a + b, 0) / Math.min(arr.length, n) : 0;
  const elapsed = (Date.now() - startTime.current) / 1000;
  const gps = gen / (elapsed || 1);

  // ==================== 관전 모드 ====================
  if (viewMode === 'watch') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0d0d1a, #1a1a2e)',
        fontFamily: "'JetBrains Mono', monospace",
        color: '#e0e0e0',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '15px' }}>
          <h1 style={{
            fontSize: '1.3rem',
            background: 'linear-gradient(90deg, #00f5ff, #ff00ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            👁️ AI 관전 모드
          </h1>
          <button
            onClick={() => setViewMode('dashboard')}
            style={{
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            📊 대시보드로
          </button>
        </div>

        <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start' }}>
          {/* 큰 게임 보드 */}
          <div>
            <GameBoard board={board} cellSize={22} showGlow={true} />
            
            {/* 현재 게임 정보 */}
            <div style={{
              marginTop: '15px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px'
            }}>
              {[
                { label: 'Score', value: currentScore, color: '#00f5ff' },
                { label: 'Lines', value: currentLines, color: '#ff00ff' },
                { label: 'Pieces', value: pieceCount.current, color: '#ffd700' }
              ].map((m, i) => (
                <div key={i} style={{
                  background: `${m.color}20`,
                  border: `1px solid ${m.color}50`,
                  borderRadius: '8px',
                  padding: '10px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{m.label}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 사이드 패널 */}
          <div style={{ width: '280px' }}>
            {/* AI 상태 */}
            <div style={{
              background: 'rgba(0,0,0,0.4)',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '15px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.5rem' }}>{stage.icon}</span>
                <div>
                  <div style={{ fontWeight: 'bold', color: stage.color }}>{stage.name} 단계</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Game #{gen}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ opacity: 0.6, fontSize: '0.7rem' }}>🏆 Best</div>
                  <div style={{ color: '#2ecc71', fontWeight: 'bold' }}>{bestScore}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ opacity: 0.6, fontSize: '0.7rem' }}>📊 Avg</div>
                  <div style={{ color: '#3498db', fontWeight: 'bold' }}>{avg(scores).toFixed(0)}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ opacity: 0.6, fontSize: '0.7rem' }}>🎲 탐색률</div>
                  <div style={{ color: '#f1c40f', fontWeight: 'bold' }}>{(agent.eps * 100).toFixed(1)}%</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ opacity: 0.6, fontSize: '0.7rem' }}>💾 Memory</div>
                  <div style={{ color: '#9b59b6', fontWeight: 'bold' }}>{agent.mem.length}</div>
                </div>
              </div>
            </div>

            {/* 미니 그래프 */}
            <div style={{
              background: 'rgba(0,0,0,0.4)',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '15px'
            }}>
              <Graph data={scores} color="#3498db" height={50} title="📊 점수 추이" />
              <Graph data={pieces} color="#2ecc71" height={40} title="🧩 생존 피스" />
            </div>

            {/* 속도 조절 */}
            <div style={{
              background: 'rgba(0,0,0,0.4)',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '15px'
            }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '5px' }}>
                🎬 관전 속도: {watchSpeed}ms
              </div>
              <input
                type="range"
                min="50"
                max="500"
                value={watchSpeed}
                onChange={e => setWatchSpeed(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#00f5ff' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', opacity: 0.5, marginTop: '3px' }}>
                <span>빠름</span>
                <span>느림</span>
              </div>
            </div>

            {/* 컨트롤 */}
            <button
              onClick={() => { setIsTraining(!isTraining); if (!isTraining) { startTime.current = Date.now(); reset(); } }}
              style={{
                width: '100%',
                padding: '12px',
                background: isTraining ? '#e74c3c' : '#2ecc71',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.9rem',
                marginBottom: '8px'
              }}
            >
              {isTraining ? '⏹ 정지' : '▶️ 시작'}
            </button>

            {/* 안내 */}
            <div style={{
              background: 'rgba(0,245,255,0.1)',
              border: '1px solid rgba(0,245,255,0.3)',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '0.75rem'
            }}>
              <div style={{ marginBottom: '5px' }}>👁️ <strong>관전 모드</strong></div>
              <div style={{ opacity: 0.8, lineHeight: 1.5 }}>
                AI가 항상 최선의 선택을 합니다.<br/>
                학습은 백그라운드에서 계속 진행됩니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== 대시보드 모드 ====================
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d0d1a, #1a1a2e)',
      fontFamily: "'JetBrains Mono', monospace",
      color: '#e0e0e0',
      padding: '15px'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h1 style={{
          fontSize: '1.3rem',
          background: 'linear-gradient(90deg, #00f5ff, #ff00ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0
        }}>
          🧠 Tetris DQN Learning Monitor
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '12px', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* 왼쪽: 미니 게임 + 컨트롤 */}
        <div style={{ width: '110px', flexShrink: 0 }}>
          <GameBoard board={board} cellSize={8} />

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '6px', fontSize: '0.6rem', marginTop: '6px', marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.6 }}>Score</span><span style={{ color: '#00f5ff' }}>{currentScore}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.6 }}>Lines</span><span style={{ color: '#ff00ff' }}>{currentLines}</span></div>
          </div>

          <div style={{ marginBottom: '6px' }}>
            <div style={{ fontSize: '0.55rem', opacity: 0.6 }}>학습 속도: {speed}ms</div>
            <input type="range" min="5" max="100" value={speed} onChange={e => setSpeed(Number(e.target.value))} style={{ width: '100%', accentColor: '#00f5ff' }} />
          </div>

          <button
            onClick={() => { if (!isTraining) startTime.current = Date.now(); setIsTraining(!isTraining); if (!isTraining) reset(); }}
            style={{ width: '100%', padding: '8px', background: isTraining ? '#e74c3c' : '#2ecc71', border: 'none', borderRadius: '5px', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem', marginBottom: '6px' }}
          >
            {isTraining ? '⏹ 정지' : '▶️ 학습'}
          </button>

          <button
            onClick={() => setViewMode('watch')}
            style={{
              width: '100%',
              padding: '8px',
              background: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
              border: 'none',
              borderRadius: '5px',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            👁️ 관전
          </button>
        </div>

        {/* 오른쪽: 대시보드 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          
          {/* 진행 바 */}
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '6px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>{stage.icon}</span>
                <span style={{ fontWeight: 'bold', color: stage.color, fontSize: '0.85rem' }}>{stage.name}</span>
              </div>
              <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>#{gen} | {gps.toFixed(1)}/sec</div>
            </div>
            <div style={{ position: 'relative', height: '14px', background: 'rgba(0,0,0,0.3)', borderRadius: '7px', overflow: 'hidden' }}>
              {STAGES.map((s, i) => (
                <div key={i} style={{
                  position: 'absolute', left: `${(s.min / 10000) * 100}%`, width: `${((s.max - s.min) / 10000) * 100}%`, height: '100%',
                  background: gen >= s.max ? s.color : (gen >= s.min ? `${s.color}66` : 'transparent'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', borderRight: '1px solid rgba(0,0,0,0.3)'
                }}>{s.icon}</div>
              ))}
              <div style={{ position: 'absolute', left: `${Math.min(100, (gen / 10000) * 100)}%`, top: 0, bottom: 0, width: '2px', background: 'white', boxShadow: '0 0 5px white' }} />
            </div>
          </div>

          {/* 지표 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '8px' }}>
            {[
              { label: 'Best', value: bestScore, color: '#2ecc71', icon: '🏆' },
              { label: 'Avg', value: avg(scores).toFixed(0), color: '#3498db', icon: '📊' },
              { label: 'Lines', value: avg(lines).toFixed(1), color: '#9b59b6', icon: '📏' },
              { label: 'Pieces', value: avg(pieces).toFixed(0), color: '#e67e22', icon: '🧩' },
              { label: 'ε', value: agent.eps.toFixed(2), color: '#f1c40f', icon: '🎲' },
            ].map((m, i) => (
              <div key={i} style={{ background: `${m.color}18`, border: `1px solid ${m.color}40`, borderRadius: '5px', padding: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.5rem', opacity: 0.7 }}>{m.icon} {m.label}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* 그래프 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px' }}>
              <Graph data={scores} color="#3498db" title="📊 점수" height={45} />
              <Graph data={lines} color="#9b59b6" title="📏 라인" height={35} />
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px' }}>
              <Graph data={pieces} color="#2ecc71" title="🧩 생존 피스" height={45} />
              <Graph data={losses} color="#e74c3c" title="📉 손실" height={35} />
            </div>
          </div>

          {/* 학습 해설 */}
          <LearningExplanation gen={gen} eps={agent.eps} scores={scores} pieces={pieces} isTraining={isTraining} />
        </div>
      </div>
    </div>
  );
}
