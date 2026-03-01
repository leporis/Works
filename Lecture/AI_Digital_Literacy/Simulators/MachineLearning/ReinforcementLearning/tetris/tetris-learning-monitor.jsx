import React, { useState, useEffect, useCallback, useRef } from 'react';

// ============================================
// 설정
// ============================================
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 8; // 작은 셀

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
  if (data.length < 2) return <div style={{ height, opacity: 0.3 }}>데이터 수집 중...</div>;
  
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  
  // 추세선 계산 (선형 회귀)
  const n = data.length;
  const xMean = (n - 1) / 2;
  const yMean = avg;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (data[i] - yMean);
    den += (i - xMean) ** 2;
  }
  const slope = den ? num / den : 0;
  const trend = slope > 0.1 ? '📈' : slope < -0.1 ? '📉' : '➡️';
  
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{title}</span>
        <div style={{ fontSize: '0.7rem', display: 'flex', gap: '8px' }}>
          {showTrend && <span>{trend}</span>}
          <span style={{ opacity: 0.6 }}>avg: {avg.toFixed(1)}</span>
          <span style={{ color }}>max: {max.toFixed(0)}</span>
        </div>
      </div>
      <div style={{ 
        height, 
        background: 'rgba(0,0,0,0.3)', 
        borderRadius: '6px', 
        padding: '4px',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '1px',
        position: 'relative'
      }}>
        {/* 평균선 */}
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          bottom: `${((avg - min) / range) * 100}%`,
          height: '1px',
          background: 'rgba(255,255,255,0.2)',
          borderTop: '1px dashed rgba(255,255,255,0.3)'
        }} />
        
        {data.slice(-100).map((v, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${Math.max(2, ((v - min) / range) * 100)}%`,
              background: `linear-gradient(to top, ${color}88, ${color})`,
              borderRadius: '1px 1px 0 0'
            }}
          />
        ))}
      </div>
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
  
  // 통계
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
        // 게임 오버
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

  // 현재 단계
  const stage = STAGES.find(s => gen >= s.min && gen < s.max) || STAGES[STAGES.length - 1];
  const progress = Math.min(100, (gen / 10000) * 100);
  
  // 통계 계산
  const avg = (arr, n = 50) => arr.length ? arr.slice(-n).reduce((a, b) => a + b, 0) / Math.min(arr.length, n) : 0;
  const elapsed = (Date.now() - startTime.current) / 1000;
  const gps = gen / (elapsed || 1);
  const eta = gen > 10 ? ((10000 - gen) / gps) : 0;
  const etaStr = eta < 60 ? `${Math.round(eta)}초` : eta < 3600 ? `${Math.round(eta/60)}분` : `${(eta/3600).toFixed(1)}시간`;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d0d1a, #1a1a2e)',
      fontFamily: "'JetBrains Mono', monospace",
      color: '#e0e0e0',
      padding: '15px'
    }}>
      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h1 style={{
          fontSize: '1.5rem',
          background: 'linear-gradient(90deg, #00f5ff, #ff00ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0
        }}>
          🧠 Tetris DQN Learning Monitor
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '15px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* 왼쪽: 미니 게임 + 컨트롤 */}
        <div style={{ width: '140px', flexShrink: 0 }}>
          {/* 미니 보드 */}
          <div style={{
            background: 'rgba(0,0,0,0.5)',
            padding: '6px',
            borderRadius: '8px',
            marginBottom: '10px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)`,
              gap: '0px'
            }}>
              {board.map((row, y) => row.map((cell, x) => (
                <div key={`${x}-${y}`} style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  background: cell || 'rgba(30,30,50,0.8)',
                  borderRadius: '1px'
                }} />
              )))}
            </div>
          </div>

          {/* 현재 게임 */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '8px',
            borderRadius: '6px',
            fontSize: '0.7rem',
            marginBottom: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.6 }}>Score</span>
              <span style={{ color: '#00f5ff' }}>{currentScore}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.6 }}>Lines</span>
              <span style={{ color: '#ff00ff' }}>{currentLines}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.6 }}>Pieces</span>
              <span style={{ color: '#ffd700' }}>{pieceCount.current}</span>
            </div>
          </div>

          {/* 속도 */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '0.65rem', opacity: 0.6, marginBottom: '3px' }}>
              속도: {speed}ms
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#00f5ff' }}
            />
          </div>

          {/* 시작/정지 */}
          <button
            onClick={() => {
              if (!isTraining) startTime.current = Date.now();
              setIsTraining(!isTraining);
              if (!isTraining) reset();
            }}
            style={{
              width: '100%',
              padding: '10px',
              background: isTraining ? '#e74c3c' : '#2ecc71',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            {isTraining ? '⏹ 정지' : '▶️ 학습'}
          </button>
        </div>

        {/* 오른쪽: 대시보드 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          
          {/* 진행 상태 */}
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.3rem' }}>{stage.icon}</span>
                <span style={{ fontWeight: 'bold', color: stage.color }}>{stage.name}</span>
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                Game #{gen} | {gps.toFixed(1)} games/sec | ETA: {gen < 10 ? '계산중' : etaStr}
              </div>
            </div>
            
            {/* 진행 바 */}
            <div style={{ position: 'relative', height: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', overflow: 'hidden' }}>
              {STAGES.map((s, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: `${(s.min / 10000) * 100}%`,
                  width: `${((s.max - s.min) / 10000) * 100}%`,
                  height: '100%',
                  background: gen >= s.max ? s.color : (gen >= s.min ? `${s.color}66` : 'transparent'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.55rem',
                  borderRight: '1px solid rgba(0,0,0,0.3)'
                }}>
                  {s.icon}
                </div>
              ))}
              <div style={{
                position: 'absolute',
                left: `${progress}%`,
                top: 0,
                bottom: 0,
                width: '2px',
                background: 'white',
                boxShadow: '0 0 8px white'
              }} />
            </div>
          </div>

          {/* 핵심 지표 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '10px',
            marginBottom: '12px'
          }}>
            {[
              { label: 'Best Score', value: bestScore, color: '#2ecc71', icon: '🏆' },
              { label: 'Avg Score', value: avg(scores).toFixed(0), color: '#3498db', icon: '📊' },
              { label: 'Avg Lines', value: avg(lines).toFixed(1), color: '#9b59b6', icon: '📏' },
              { label: 'Avg Pieces', value: avg(pieces).toFixed(0), color: '#e67e22', icon: '🧩' },
              { label: 'Epsilon', value: agent.eps.toFixed(3), color: '#f1c40f', icon: '🎲' },
            ].map((m, i) => (
              <div key={i} style={{
                background: `linear-gradient(135deg, ${m.color}22, ${m.color}11)`,
                border: `1px solid ${m.color}44`,
                borderRadius: '8px',
                padding: '10px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>{m.icon} {m.label}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* 그래프 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
              <Graph data={scores} color="#3498db" title="📊 점수 (Score)" height={70} />
              <Graph data={lines} color="#9b59b6" title="📏 라인 클리어 (Lines)" height={60} />
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
              <Graph data={pieces} color="#2ecc71" title="🧩 생존 피스 수 (Pieces/Game)" height={70} />
              <Graph data={losses} color="#e74c3c" title="📉 손실 함수 (Loss)" height={60} showTrend={false} />
            </div>
          </div>

          {/* 학습 상태 요약 */}
          <div style={{
            marginTop: '12px',
            background: 'rgba(0,0,0,0.3)',
            padding: '12px',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.7rem'
          }}>
            <div>
              <span style={{ opacity: 0.6 }}>🧠 Network: </span>
              <span>4→64→32→1</span>
            </div>
            <div>
              <span style={{ opacity: 0.6 }}>💾 Memory: </span>
              <span style={{ color: '#9b59b6' }}>{agent.mem.length.toLocaleString()}</span>
            </div>
            <div>
              <span style={{ opacity: 0.6 }}>🎲 탐색률: </span>
              <span style={{ color: agent.eps > 0.5 ? '#e74c3c' : agent.eps > 0.1 ? '#f1c40f' : '#2ecc71' }}>
                {(agent.eps * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span style={{ opacity: 0.6 }}>⏱️ 경과: </span>
              <span>{Math.floor(elapsed / 60)}분 {Math.floor(elapsed % 60)}초</span>
            </div>
            <div style={{
              color: scores.length > 20 && avg(scores.slice(-20)) > avg(scores.slice(-50, -20)) ? '#2ecc71' : 
                     scores.length > 20 ? '#e67e22' : '#888'
            }}>
              {scores.length > 20 && avg(scores.slice(-20)) > avg(scores.slice(-50, -20)) * 1.1 ? '✅ 학습 진행 중!' :
               scores.length > 50 ? '⏳ 학습 중...' : '🔄 데이터 수집 중...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
