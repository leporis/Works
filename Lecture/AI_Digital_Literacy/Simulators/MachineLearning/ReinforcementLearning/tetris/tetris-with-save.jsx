import React, { useState, useEffect, useCallback, useRef } from 'react';

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

const STORAGE_KEY = 'tetris-dqn-save';

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

  // 저장용 데이터 추출
  toJSON() {
    return {
      layers: this.layers,
      weights: this.weights,
      biases: this.biases,
      m_w: this.m_w,
      v_w: this.v_w,
      m_b: this.m_b,
      v_b: this.v_b,
      t: this.t
    };
  }

  // 데이터에서 복원
  loadFrom(data) {
    this.layers = data.layers;
    this.weights = data.weights;
    this.biases = data.biases;
    this.m_w = data.m_w || this.weights.map(w => w.map(row => row.map(() => 0)));
    this.v_w = data.v_w || this.weights.map(w => w.map(row => row.map(() => 0)));
    this.m_b = data.m_b || this.biases.map(b => b.map(() => 0));
    this.v_b = data.v_b || this.biases.map(b => b.map(() => 0));
    this.t = data.t || 0;
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

  // 저장용 데이터 추출
  toJSON() {
    return {
      net: this.net.toJSON(),
      target: this.target.toJSON(),
      eps: this.eps,
      steps: this.steps,
      mem: this.mem.slice(-5000) // 최근 5000개만 저장 (용량 절약)
    };
  }

  // 데이터에서 복원
  loadFrom(data) {
    this.net.loadFrom(data.net);
    this.target.loadFrom(data.target);
    this.eps = data.eps;
    this.steps = data.steps;
    this.mem = data.mem || [];
  }
}

// ============================================
// 그래프 컴포넌트
// ============================================
const Graph = ({ data, color, height = 60, title, goodDirection = 'up' }) => {
  if (data.length < 2) return <div style={{ height, opacity: 0.3, fontSize: '0.7rem' }}>데이터 수집 중...</div>;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  const n = data.length, xMean = (n - 1) / 2;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (i - xMean) * (data[i] - avg); den += (i - xMean) ** 2; }
  const slope = den ? num / den : 0;
  const isGood = (goodDirection === 'up' && slope > 0.1) || (goodDirection === 'down' && slope < -0.1);
  const isBad = (goodDirection === 'up' && slope < -0.1) || (goodDirection === 'down' && slope > 0.1);
  const status = data.length < 30 ? { t: '수집중', c: '#888', i: '⏳' } : isGood ? { t: '좋음!', c: '#2ecc71', i: '✅' } : isBad ? { t: '주의', c: '#e74c3c', i: '⚠️' } : { t: '안정', c: '#f1c40f', i: '➡️' };
  
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '2px' }}>
        <span style={{ fontWeight: 'bold' }}>{title}</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span style={{ color: status.c, background: `${status.c}20`, padding: '1px 4px', borderRadius: '3px', fontSize: '0.55rem' }}>{status.i} {status.t}</span>
          <span style={{ opacity: 0.6 }}>avg:{avg.toFixed(0)}</span>
        </div>
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
  
  const [saveStatus, setSaveStatus] = useState('');
  const [lastSaveTime, setLastSaveTime] = useState(null);
  
  const loopRef = useRef(null);
  const prevFeat = useRef(null);
  const pieceCount = useRef(0);
  const startTime = useRef(Date.now());
  const fileInputRef = useRef(null);

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

  // ============================================
  // 저장/불러오기 함수들
  // ============================================
  
  // 전체 상태를 JSON으로 저장
  const getSaveData = useCallback(() => {
    return {
      version: 1,
      timestamp: Date.now(),
      agent: agent.toJSON(),
      stats: {
        gen,
        bestScore,
        scores: scores.slice(-200),
        lines: lines.slice(-200),
        pieces: pieces.slice(-200),
        losses: losses.slice(-200)
      }
    };
  }, [agent, gen, bestScore, scores, lines, pieces, losses]);

  // JSON에서 상태 복원
  const loadSaveData = useCallback((data) => {
    if (!data || data.version !== 1) {
      alert('유효하지 않은 저장 데이터입니다.');
      return false;
    }
    
    agent.loadFrom(data.agent);
    setGen(data.stats.gen);
    setBest(data.stats.bestScore);
    setScores(data.stats.scores || []);
    setLines(data.stats.lines || []);
    setPieces(data.stats.pieces || []);
    setLosses(data.stats.losses || []);
    
    return true;
  }, [agent]);

  // localStorage에 자동 저장
  const autoSave = useCallback(() => {
    try {
      const data = getSaveData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setLastSaveTime(new Date());
      setSaveStatus('자동 저장됨');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (e) {
      console.error('자동 저장 실패:', e);
    }
  }, [getSaveData]);

  // localStorage에서 불러오기
  const autoLoad = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (loadSaveData(data)) {
          setLastSaveTime(new Date(data.timestamp));
          setSaveStatus('저장된 데이터 불러옴');
          setTimeout(() => setSaveStatus(''), 3000);
          return true;
        }
      }
    } catch (e) {
      console.error('자동 불러오기 실패:', e);
    }
    return false;
  }, [loadSaveData]);

  // 파일로 내보내기
  const exportToFile = useCallback(() => {
    const data = getSaveData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tetris-dqn-save-${gen}games-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSaveStatus('파일로 내보냄');
    setTimeout(() => setSaveStatus(''), 2000);
  }, [getSaveData, gen]);

  // 파일에서 불러오기
  const importFromFile = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (loadSaveData(data)) {
          setSaveStatus(`${data.stats.gen}게임 데이터 불러옴!`);
          setTimeout(() => setSaveStatus(''), 3000);
        }
      } catch (err) {
        alert('파일을 읽을 수 없습니다.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, [loadSaveData]);

  // 저장 데이터 삭제
  const clearSave = useCallback(() => {
    if (window.confirm('저장된 학습 데이터를 모두 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    autoLoad();
  }, []);

  // 100게임마다 자동 저장
  useEffect(() => {
    if (gen > 0 && gen % 100 === 0) {
      autoSave();
    }
  }, [gen, autoSave]);

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

  // 숨겨진 파일 입력
  const hiddenFileInput = (
    <input
      type="file"
      ref={fileInputRef}
      onChange={importFromFile}
      accept=".json"
      style={{ display: 'none' }}
    />
  );

  // 저장/불러오기 패널
  const SaveLoadPanel = () => (
    <div style={{
      background: 'rgba(0,0,0,0.4)',
      borderRadius: '8px',
      padding: '10px',
      marginTop: '10px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>💾 학습 데이터</span>
        {saveStatus && (
          <span style={{ fontSize: '0.65rem', color: '#2ecc71', background: '#2ecc7120', padding: '2px 6px', borderRadius: '4px' }}>
            {saveStatus}
          </span>
        )}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
        <button
          onClick={autoSave}
          style={{
            padding: '8px',
            background: 'rgba(46,204,113,0.2)',
            border: '1px solid rgba(46,204,113,0.5)',
            borderRadius: '6px',
            color: '#2ecc71',
            cursor: 'pointer',
            fontSize: '0.7rem',
            fontWeight: 'bold'
          }}
        >
          💾 저장
        </button>
        <button
          onClick={autoLoad}
          style={{
            padding: '8px',
            background: 'rgba(52,152,219,0.2)',
            border: '1px solid rgba(52,152,219,0.5)',
            borderRadius: '6px',
            color: '#3498db',
            cursor: 'pointer',
            fontSize: '0.7rem',
            fontWeight: 'bold'
          }}
        >
          📂 불러오기
        </button>
        <button
          onClick={exportToFile}
          style={{
            padding: '8px',
            background: 'rgba(155,89,182,0.2)',
            border: '1px solid rgba(155,89,182,0.5)',
            borderRadius: '6px',
            color: '#9b59b6',
            cursor: 'pointer',
            fontSize: '0.7rem',
            fontWeight: 'bold'
          }}
        >
          📤 파일 내보내기
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '8px',
            background: 'rgba(230,126,34,0.2)',
            border: '1px solid rgba(230,126,34,0.5)',
            borderRadius: '6px',
            color: '#e67e22',
            cursor: 'pointer',
            fontSize: '0.7rem',
            fontWeight: 'bold'
          }}
        >
          📥 파일 가져오기
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6rem', opacity: 0.7 }}>
        <span>
          {lastSaveTime ? `마지막 저장: ${lastSaveTime.toLocaleTimeString()}` : '저장된 데이터 없음'}
        </span>
        <button
          onClick={clearSave}
          style={{
            padding: '3px 8px',
            background: 'rgba(231,76,60,0.2)',
            border: '1px solid rgba(231,76,60,0.3)',
            borderRadius: '4px',
            color: '#e74c3c',
            cursor: 'pointer',
            fontSize: '0.55rem'
          }}
        >
          🗑️ 초기화
        </button>
      </div>

      <div style={{
        marginTop: '8px',
        padding: '8px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '6px',
        fontSize: '0.6rem',
        lineHeight: 1.5
      }}>
        <div style={{ color: '#ffd700', marginBottom: '4px' }}>💡 저장 안내</div>
        <div style={{ opacity: 0.8 }}>
          • <strong>자동 저장</strong>: 100게임마다 브라우저에 자동 저장<br/>
          • <strong>파일 내보내기</strong>: 다른 기기에서 이어서 학습 가능<br/>
          • 페이지를 닫아도 학습 결과가 유지됩니다!
        </div>
      </div>
    </div>
  );

  // 관전 모드
  if (viewMode === 'watch') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0d0d1a, #1a1a2e)', fontFamily: "'JetBrains Mono', monospace", color: '#e0e0e0', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {hiddenFileInput}
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
            </div>

            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '12px', marginBottom: '15px' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '5px' }}>🎬 관전 속도: {watchSpeed}ms</div>
              <input type="range" min="50" max="500" value={watchSpeed} onChange={e => setWatchSpeed(Number(e.target.value))} style={{ width: '100%', accentColor: '#00f5ff' }} />
            </div>

            <button onClick={() => { setIsTraining(!isTraining); if (!isTraining) { startTime.current = Date.now(); reset(); } }} style={{ width: '100%', padding: '12px', background: isTraining ? '#e74c3c' : '#2ecc71', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '10px' }}>
              {isTraining ? '⏹ 정지' : '▶️ 시작'}
            </button>

            <SaveLoadPanel />
          </div>
        </div>
      </div>
    );
  }

  // 대시보드 모드
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0d0d1a, #1a1a2e)', fontFamily: "'JetBrains Mono', monospace", color: '#e0e0e0', padding: '15px' }}>
      {hiddenFileInput}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h1 style={{ fontSize: '1.3rem', background: 'linear-gradient(90deg, #00f5ff, #ff00ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>🧠 Tetris DQN Learning Monitor</h1>
      </div>

      <div style={{ display: 'flex', gap: '12px', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* 왼쪽 */}
        <div style={{ width: '130px', flexShrink: 0 }}>
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
          
          {/* 간단한 저장 버튼 */}
          <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            <button onClick={autoSave} style={{ padding: '6px', background: 'rgba(46,204,113,0.2)', border: '1px solid rgba(46,204,113,0.4)', borderRadius: '4px', color: '#2ecc71', cursor: 'pointer', fontSize: '0.6rem' }}>💾 저장</button>
            <button onClick={exportToFile} style={{ padding: '6px', background: 'rgba(155,89,182,0.2)', border: '1px solid rgba(155,89,182,0.4)', borderRadius: '4px', color: '#9b59b6', cursor: 'pointer', fontSize: '0.6rem' }}>📤 내보내기</button>
          </div>
          {saveStatus && <div style={{ fontSize: '0.55rem', color: '#2ecc71', textAlign: 'center', marginTop: '4px' }}>{saveStatus}</div>}
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

          {/* 저장/불러오기 패널 */}
          <SaveLoadPanel />
        </div>
      </div>
    </div>
  );
}
