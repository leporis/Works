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
const rotate = (s) => { const r = Array(s[0].length).fill().map(() => Array(s.length).fill(0)); for (let y = 0; y < s.length; y++) for (let x = 0; x < s[y].length; x++) r[x][s.length - 1 - y] = s[y][x]; return r; };
const getRotations = (s) => { const rots = [s]; let c = s; for (let i = 0; i < 3; i++) { c = rotate(c); if (!rots.some(r => JSON.stringify(r) === JSON.stringify(c))) rots.push(c); } return rots; };
const valid = (b, s, x, y) => { for (let py = 0; py < s.length; py++) for (let px = 0; px < s[py].length; px++) if (s[py][px]) { const nx = x + px, ny = y + py; if (nx < 0 || nx >= BOARD_WIDTH || ny >= BOARD_HEIGHT || (ny >= 0 && b[ny][nx])) return false; } return true; };
const place = (b, s, c, x, y) => { const nb = b.map(r => [...r]); for (let py = 0; py < s.length; py++) for (let px = 0; px < s[py].length; px++) if (s[py][px] && y + py >= 0) nb[y + py][x + px] = c; return nb; };
const clear = (b) => { let lines = 0; const nb = b.filter(r => { if (r.every(c => c)) { lines++; return false; } return true; }); while (nb.length < BOARD_HEIGHT) nb.unshift(Array(BOARD_WIDTH).fill(null)); return { board: nb, lines }; };
const drop = (b, s, x) => { let y = 0; while (valid(b, s, x, y + 1)) y++; return y; };
const features = (b) => { let h = 0, holes = 0, bump = 0, maxH = 0; const hs = []; for (let x = 0; x < BOARD_WIDTH; x++) { let ch = 0, found = false; for (let y = 0; y < BOARD_HEIGHT; y++) { if (b[y][x]) { if (!found) { ch = BOARD_HEIGHT - y; found = true; } } else if (found) holes++; } hs.push(ch); h += ch; maxH = Math.max(maxH, ch); } for (let i = 0; i < hs.length - 1; i++) bump += Math.abs(hs[i] - hs[i + 1]); return [h / 200, holes / 50, bump / 20, maxH / 20]; };
const placements = (b, type) => { const p = TETROMINOES[type], rots = getRotations(p.shape), result = []; for (let ri = 0; ri < rots.length; ri++) { const s = rots[ri]; for (let x = 0; x <= BOARD_WIDTH - s[0].length; x++) { if (valid(b, s, x, 0)) { const y = drop(b, s, x); const nb = place(b, s, p.color, x, y); const { board: cb, lines } = clear(nb); result.push({ x, y, s, c: p.color, board: cb, lines, feat: features(cb) }); } } } return result; };

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
    for (let i = 1; i < ps.length; i++) { const q = this.net.forward(ps[i].feat)[0]; if (q > bestQ) { bestQ = q; best = ps[i]; } }
    return best;
  }

  remember(s, r, ns, d) { this.mem.push({ s, r, ns, d }); if (this.mem.length > this.maxMem) this.mem.shift(); }

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
// 그래프 컴포넌트 (상태 표시 추가)
// ============================================
const Graph = ({ data, color, height = 60, title, goodDirection = 'up', showStatus = true }) => {
  if (data.length < 2) return <div style={{ height, opacity: 0.3, fontSize: '0.7rem' }}>데이터 수집 중...</div>;
  
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  const n = data.length, xMean = (n - 1) / 2;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (i - xMean) * (data[i] - avg); den += (i - xMean) ** 2; }
  const slope = den ? num / den : 0;
  
  // 학습 상태 판단
  let status, statusColor, statusIcon;
  const isGood = (goodDirection === 'up' && slope > 0.1) || (goodDirection === 'down' && slope < -0.1);
  const isBad = (goodDirection === 'up' && slope < -0.1) || (goodDirection === 'down' && slope > 0.1);
  
  if (data.length < 30) {
    status = '수집중'; statusColor = '#888'; statusIcon = '⏳';
  } else if (isGood) {
    status = '좋음!'; statusColor = '#2ecc71'; statusIcon = '✅';
  } else if (isBad) {
    status = '주의'; statusColor = '#e74c3c'; statusIcon = '⚠️';
  } else {
    status = '안정'; statusColor = '#f1c40f'; statusIcon = '➡️';
  }
  
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '2px' }}>
        <span style={{ fontWeight: 'bold' }}>{title}</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {showStatus && (
            <span style={{ 
              color: statusColor, 
              background: `${statusColor}20`,
              padding: '1px 5px',
              borderRadius: '3px',
              fontSize: '0.6rem'
            }}>
              {statusIcon} {status}
            </span>
          )}
          <span style={{ opacity: 0.6 }}>avg:{avg.toFixed(0)}</span>
        </div>
      </div>
      <div style={{ height, background: 'rgba(0,0,0,0.3)', borderRadius: '4px', padding: '2px', display: 'flex', alignItems: 'flex-end', gap: '1px', position: 'relative' }}>
        {/* 평균선 */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${((avg - min) / range) * 100}%`, borderTop: '1px dashed rgba(255,255,255,0.2)' }} />
        {data.slice(-60).map((v, i) => (
          <div key={i} style={{ flex: 1, height: `${Math.max(2, ((v - min) / range) * 100)}%`, background: color, borderRadius: '1px 1px 0 0' }} />
        ))}
      </div>
      {/* 방향 힌트 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.55rem', opacity: 0.5, marginTop: '1px' }}>
        {goodDirection === 'up' ? '↑ 올라가면 좋음' : '↓ 내려가면 좋음'}
      </div>
    </div>
  );
};

// ============================================
// 그래프 해석 가이드 컴포넌트
// ============================================
const GraphGuide = ({ scores, pieces, losses }) => {
  const avg = (arr, n = 30) => arr.length >= n ? arr.slice(-n).reduce((a, b) => a + b, 0) / n : 0;
  const trend = (arr) => {
    if (arr.length < 40) return 0;
    return avg(arr, 20) - avg(arr.slice(-50, -20), 30);
  };

  const scoreTrend = trend(scores);
  const piecesTrend = trend(pieces);
  const hasEnoughData = scores.length >= 50;

  // 종합 학습 상태 계산
  const getOverallStatus = () => {
    if (!hasEnoughData) return { level: 0, text: '데이터 수집 중', color: '#888', icon: '⏳' };
    
    const scoreUp = scoreTrend > 2;
    const piecesUp = piecesTrend > 1;
    
    if (scoreUp && piecesUp) return { level: 3, text: '학습 매우 잘됨!', color: '#2ecc71', icon: '🎉' };
    if (scoreUp || piecesUp) return { level: 2, text: '학습 진행 중', color: '#3498db', icon: '📈' };
    if (scoreTrend > -1 && piecesTrend > -1) return { level: 1, text: '안정적', color: '#f1c40f', icon: '➡️' };
    return { level: 0, text: '개선 필요', color: '#e74c3c', icon: '🔄' };
  };

  const overall = getOverallStatus();

  return (
    <div style={{
      background: 'rgba(0,0,0,0.4)',
      borderRadius: '8px',
      padding: '12px',
      marginTop: '10px'
    }}>
      {/* 종합 상태 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
        padding: '10px',
        background: `${overall.color}15`,
        border: `1px solid ${overall.color}40`,
        borderRadius: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.5rem' }}>{overall.icon}</span>
          <div>
            <div style={{ fontWeight: 'bold', color: overall.color }}>{overall.text}</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
              {hasEnoughData ? `${scores.length}게임 분석 결과` : '50게임 이상 필요'}
            </div>
          </div>
        </div>
        
        {/* 학습 품질 바 */}
        <div style={{ width: '100px' }}>
          <div style={{ fontSize: '0.6rem', opacity: 0.6, marginBottom: '3px', textAlign: 'right' }}>학습 품질</div>
          <div style={{ height: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${(overall.level / 3) * 100}%`,
              height: '100%',
              background: overall.color,
              borderRadius: '4px',
              transition: 'width 0.5s'
            }} />
          </div>
        </div>
      </div>

      {/* 그래프별 해석 */}
      <div style={{ fontSize: '0.7rem' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', opacity: 0.8 }}>📊 그래프 읽는 법</div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {/* 점수 그래프 */}
          <div style={{ background: 'rgba(52,152,219,0.1)', padding: '8px', borderRadius: '6px' }}>
            <div style={{ color: '#3498db', fontWeight: 'bold', marginBottom: '4px' }}>📊 점수</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
              <span style={{ color: '#2ecc71' }}>📈 우상향</span>
              <span style={{ opacity: 0.7 }}>= 학습 성공!</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
              <span style={{ color: '#f1c40f' }}>➡️ 수평</span>
              <span style={{ opacity: 0.7 }}>= 더 학습 필요</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#e74c3c' }}>📉 하락</span>
              <span style={{ opacity: 0.7 }}>= 문제 발생</span>
            </div>
          </div>

          {/* 생존 피스 그래프 */}
          <div style={{ background: 'rgba(46,204,113,0.1)', padding: '8px', borderRadius: '6px' }}>
            <div style={{ color: '#2ecc71', fontWeight: 'bold', marginBottom: '4px' }}>🧩 생존 피스</div>
            <div style={{ opacity: 0.8, lineHeight: 1.4 }}>
              게임당 놓은 블록 수<br/>
              <span style={{ color: '#2ecc71' }}>↑ 증가</span> = AI가 더 오래 버팀<br/>
              가장 중요한 지표!
            </div>
          </div>

          {/* 라인 클리어 그래프 */}
          <div style={{ background: 'rgba(155,89,182,0.1)', padding: '8px', borderRadius: '6px' }}>
            <div style={{ color: '#9b59b6', fontWeight: 'bold', marginBottom: '4px' }}>📏 라인 클리어</div>
            <div style={{ opacity: 0.8, lineHeight: 1.4 }}>
              게임당 지운 줄 수<br/>
              <span style={{ color: '#2ecc71' }}>↑ 증가</span> = 효율적 플레이<br/>
              점수와 함께 상승해야 좋음
            </div>
          </div>

          {/* 손실 그래프 */}
          <div style={{ background: 'rgba(231,76,60,0.1)', padding: '8px', borderRadius: '6px' }}>
            <div style={{ color: '#e74c3c', fontWeight: 'bold', marginBottom: '4px' }}>📉 손실 (Loss)</div>
            <div style={{ opacity: 0.8, lineHeight: 1.4 }}>
              AI 예측 오차<br/>
              <span style={{ color: '#2ecc71' }}>↓ 감소</span> = 예측 정확도 향상<br/>
              급격한 변동 없으면 OK
            </div>
          </div>
        </div>
      </div>

      {/* 실시간 분석 */}
      {hasEnoughData && (
        <div style={{
          marginTop: '10px',
          padding: '8px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '6px',
          fontSize: '0.7rem'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>🔍 현재 상황 분석</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ 
              padding: '3px 8px', 
              borderRadius: '4px',
              background: scoreTrend > 2 ? '#2ecc7130' : scoreTrend < -2 ? '#e74c3c30' : '#f1c40f30',
              color: scoreTrend > 2 ? '#2ecc71' : scoreTrend < -2 ? '#e74c3c' : '#f1c40f'
            }}>
              점수 {scoreTrend > 2 ? '📈 상승중' : scoreTrend < -2 ? '📉 하락중' : '➡️ 유지중'}
            </span>
            <span style={{ 
              padding: '3px 8px', 
              borderRadius: '4px',
              background: piecesTrend > 1 ? '#2ecc7130' : piecesTrend < -1 ? '#e74c3c30' : '#f1c40f30',
              color: piecesTrend > 1 ? '#2ecc71' : piecesTrend < -1 ? '#e74c3c' : '#f1c40f'
            }}>
              생존력 {piecesTrend > 1 ? '📈 향상중' : piecesTrend < -1 ? '📉 약화중' : '➡️ 유지중'}
            </span>
            <span style={{ 
              padding: '3px 8px', 
              borderRadius: '4px',
              background: '#9b59b630',
              color: '#9b59b6'
            }}>
              평균 점수: {avg(scores, 30).toFixed(0)}점
            </span>
          </div>
        </div>
      )}
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
        width: cellSize, height: cellSize,
        background: cell || 'rgba(30,30,50,0.8)',
        borderRadius: cellSize > 15 ? '3px' : '1px',
        boxShadow: cell && cellSize > 15 ? `0 0 ${cellSize/2}px ${cell}` : 'none'
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
  const [viewMode, setViewMode] = useState('dashboard');
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

      const chosen = agent.choose(ps, viewMode === 'watch');
      const pf = prevFeat.current || features(board);
      
      const reward = chosen.lines ** 2 * 10 + (pf[1] - chosen.feat[1]) * 5 + (pf[0] - chosen.feat[0]) * 2 + (pf[2] - chosen.feat[2]) * 1 + 0.1;
      
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

  // 관전 모드
  if (viewMode === 'watch') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0d0d1a, #1a1a2e)', fontFamily: "'JetBrains Mono', monospace", color: '#e0e0e0', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '15px' }}>
          <h1 style={{ fontSize: '1.3rem', background: 'linear-gradient(90deg, #00f5ff, #ff00ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>👁️ AI 관전 모드</h1>
          <button onClick={() => setViewMode('dashboard')} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>📊 대시보드</button>
        </div>

        <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start' }}>
          <div>
            <GameBoard board={board} cellSize={22} showGlow={true} />
            <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[{ label: 'Score', value: currentScore, color: '#00f5ff' }, { label: 'Lines', value: currentLines, color: '#ff00ff' }, { label: 'Pieces', value: pieceCount.current, color: '#ffd700' }].map((m, i) => (
                <div key={i} style={{ background: `${m.color}20`, border: `1px solid ${m.color}50`, borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{m.label}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ width: '280px' }}>
            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '15px', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.5rem' }}>{stage.icon}</span>
                <div>
                  <div style={{ fontWeight: 'bold', color: stage.color }}>{stage.name} 단계</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Game #{gen}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                {[{ l: '🏆 Best', v: bestScore, c: '#2ecc71' }, { l: '📊 Avg', v: avg(scores).toFixed(0), c: '#3498db' }, { l: '🎲 탐색률', v: `${(agent.eps * 100).toFixed(1)}%`, c: '#f1c40f' }, { l: '💾 Memory', v: agent.mem.length, c: '#9b59b6' }].map((m, i) => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ opacity: 0.6, fontSize: '0.7rem' }}>{m.l}</div>
                    <div style={{ color: m.c, fontWeight: 'bold' }}>{m.v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '12px', marginBottom: '15px' }}>
              <Graph data={scores} color="#3498db" height={50} title="📊 점수 추이" />
              <Graph data={pieces} color="#2ecc71" height={40} title="🧩 생존 피스" />
            </div>

            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '12px', marginBottom: '15px' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '5px' }}>🎬 관전 속도: {watchSpeed}ms</div>
              <input type="range" min="50" max="500" value={watchSpeed} onChange={e => setWatchSpeed(Number(e.target.value))} style={{ width: '100%', accentColor: '#00f5ff' }} />
            </div>

            <button onClick={() => { setIsTraining(!isTraining); if (!isTraining) { startTime.current = Date.now(); reset(); } }} style={{ width: '100%', padding: '12px', background: isTraining ? '#e74c3c' : '#2ecc71', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
              {isTraining ? '⏹ 정지' : '▶️ 시작'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 대시보드 모드
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0d0d1a, #1a1a2e)', fontFamily: "'JetBrains Mono', monospace", color: '#e0e0e0', padding: '15px' }}>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h1 style={{ fontSize: '1.3rem', background: 'linear-gradient(90deg, #00f5ff, #ff00ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>🧠 Tetris DQN Learning Monitor</h1>
      </div>

      <div style={{ display: 'flex', gap: '12px', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* 왼쪽 */}
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
          <button onClick={() => { if (!isTraining) startTime.current = Date.now(); setIsTraining(!isTraining); if (!isTraining) reset(); }} style={{ width: '100%', padding: '8px', background: isTraining ? '#e74c3c' : '#2ecc71', border: 'none', borderRadius: '5px', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem', marginBottom: '6px' }}>
            {isTraining ? '⏹ 정지' : '▶️ 학습'}
          </button>
          <button onClick={() => setViewMode('watch')} style={{ width: '100%', padding: '8px', background: 'linear-gradient(135deg, #9b59b6, #8e44ad)', border: 'none', borderRadius: '5px', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem' }}>👁️ 관전</button>
        </div>

        {/* 오른쪽 */}
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
                <div key={i} style={{ position: 'absolute', left: `${(s.min / 10000) * 100}%`, width: `${((s.max - s.min) / 10000) * 100}%`, height: '100%', background: gen >= s.max ? s.color : (gen >= s.min ? `${s.color}66` : 'transparent'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', borderRight: '1px solid rgba(0,0,0,0.3)' }}>{s.icon}</div>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px' }}>
              <Graph data={scores} color="#3498db" title="📊 점수" height={50} goodDirection="up" />
              <Graph data={lines} color="#9b59b6" title="📏 라인" height={40} goodDirection="up" />
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px' }}>
              <Graph data={pieces} color="#2ecc71" title="🧩 생존 피스" height={50} goodDirection="up" />
              <Graph data={losses} color="#e74c3c" title="📉 손실" height={40} goodDirection="down" />
            </div>
          </div>

          {/* 그래프 해석 가이드 */}
          <GraphGuide scores={scores} pieces={pieces} losses={losses} />
        </div>
      </div>
    </div>
  );
}
