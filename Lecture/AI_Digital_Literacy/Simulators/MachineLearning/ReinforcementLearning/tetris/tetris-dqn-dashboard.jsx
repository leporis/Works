import React, { useState, useEffect, useCallback, useRef } from 'react';

// ============================================
// 테트리스 설정
// ============================================
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 22;

const TETROMINOES = {
  I: { shape: [[1,1,1,1]], color: '#00f5ff' },
  O: { shape: [[1,1],[1,1]], color: '#ffd700' },
  T: { shape: [[0,1,0],[1,1,1]], color: '#9b59b6' },
  S: { shape: [[0,1,1],[1,1,0]], color: '#2ecc71' },
  Z: { shape: [[1,1,0],[0,1,1]], color: '#e74c3c' },
  J: { shape: [[1,0,0],[1,1,1]], color: '#3498db' },
  L: { shape: [[0,0,1],[1,1,1]], color: '#e67e22' }
};

// 학습 단계 정의
const LEARNING_STAGES = [
  { name: '🌱 초기', minGames: 0, maxGames: 100, color: '#e74c3c', description: '랜덤 탐색' },
  { name: '🔍 탐색', minGames: 100, maxGames: 500, color: '#e67e22', description: '패턴 발견' },
  { name: '📚 학습', minGames: 500, maxGames: 2000, color: '#f1c40f', description: '기본 전략' },
  { name: '🎯 응용', minGames: 2000, maxGames: 5000, color: '#2ecc71', description: '최적화' },
  { name: '🏆 숙련', minGames: 5000, maxGames: 10000, color: '#00f5ff', description: '마스터' }
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
      const fanIn = layers[i];
      const fanOut = layers[i + 1];
      const std = Math.sqrt(2.0 / fanIn);
      this.weights.push(
        Array(fanIn).fill().map(() =>
          Array(fanOut).fill().map(() => this.randn() * std)
        )
      );
      this.biases.push(Array(fanOut).fill(0));
    }
    
    this.m_w = this.weights.map(w => w.map(row => row.map(() => 0)));
    this.v_w = this.weights.map(w => w.map(row => row.map(() => 0)));
    this.m_b = this.biases.map(b => b.map(() => 0));
    this.v_b = this.biases.map(b => b.map(() => 0));
    this.t = 0;
  }

  randn() {
    const u1 = Math.random(), u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
  }

  forward(input, training = false) {
    const activations = [input];
    const preActivations = [input];
    let current = input;

    for (let l = 0; l < this.weights.length; l++) {
      const W = this.weights[l];
      const b = this.biases[l];
      const isLast = l === this.weights.length - 1;
      
      const z = b.map((bias, j) => {
        let sum = bias;
        for (let i = 0; i < current.length; i++) sum += current[i] * W[i][j];
        return sum;
      });
      
      preActivations.push(z);
      current = isLast ? z : z.map(x => Math.max(0, x));
      activations.push(current);
    }

    return training ? { output: current, activations, preActivations } : current;
  }

  backward(activations, preActivations, targets, lr = 0.001) {
    const numLayers = this.weights.length;
    const gradW = this.weights.map(w => w.map(row => row.map(() => 0)));
    const gradB = this.biases.map(b => b.map(() => 0));
    
    let delta = activations[numLayers].map((o, i) => o - targets[i]);
    
    for (let l = numLayers - 1; l >= 0; l--) {
      const a_prev = activations[l];
      
      for (let i = 0; i < a_prev.length; i++) {
        for (let j = 0; j < delta.length; j++) {
          gradW[l][i][j] = a_prev[i] * delta[j];
        }
      }
      for (let j = 0; j < delta.length; j++) gradB[l][j] = delta[j];
      
      if (l > 0) {
        const newDelta = [];
        for (let i = 0; i < this.weights[l].length; i++) {
          let sum = 0;
          for (let j = 0; j < delta.length; j++) sum += this.weights[l][i][j] * delta[j];
          sum *= preActivations[l][i] > 0 ? 1 : 0;
          newDelta.push(sum);
        }
        delta = newDelta;
      }
    }
    
    this.adamUpdate(gradW, gradB, lr);
    return targets.reduce((sum, t, i) => sum + Math.pow(activations[numLayers][i] - t, 2), 0) / targets.length;
  }

  adamUpdate(gradW, gradB, lr, beta1 = 0.9, beta2 = 0.999, eps = 1e-8) {
    this.t++;
    const bc1 = 1 - Math.pow(beta1, this.t), bc2 = 1 - Math.pow(beta2, this.t);
    
    for (let l = 0; l < this.weights.length; l++) {
      for (let i = 0; i < this.weights[l].length; i++) {
        for (let j = 0; j < this.weights[l][i].length; j++) {
          const g = gradW[l][i][j];
          this.m_w[l][i][j] = beta1 * this.m_w[l][i][j] + (1 - beta1) * g;
          this.v_w[l][i][j] = beta2 * this.v_w[l][i][j] + (1 - beta2) * g * g;
          this.weights[l][i][j] -= lr * (this.m_w[l][i][j] / bc1) / (Math.sqrt(this.v_w[l][i][j] / bc2) + eps);
        }
      }
      for (let j = 0; j < this.biases[l].length; j++) {
        const g = gradB[l][j];
        this.m_b[l][j] = beta1 * this.m_b[l][j] + (1 - beta1) * g;
        this.v_b[l][j] = beta2 * this.v_b[l][j] + (1 - beta2) * g * g;
        this.biases[l][j] -= lr * (this.m_b[l][j] / bc1) / (Math.sqrt(this.v_b[l][j] / bc2) + eps);
      }
    }
  }

  clone() {
    const nn = new NeuralNetwork(this.layers);
    nn.weights = this.weights.map(w => w.map(row => [...row]));
    nn.biases = this.biases.map(b => [...b]);
    return nn;
  }
}

// ============================================
// 게임 로직
// ============================================
const createEmptyBoard = () => Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(null));
const cloneBoard = (board) => board.map(row => [...row]);

const rotatePiece = (shape) => {
  const rows = shape.length, cols = shape[0].length;
  const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) rotated[x][rows - 1 - y] = shape[y][x];
  }
  return rotated;
};

const getRotations = (shape) => {
  const rotations = [shape];
  let current = shape;
  for (let i = 0; i < 3; i++) {
    current = rotatePiece(current);
    if (!rotations.some(r => JSON.stringify(r) === JSON.stringify(current))) {
      rotations.push(current);
    }
  }
  return rotations;
};

const isValidPosition = (board, shape, x, y) => {
  for (let py = 0; py < shape.length; py++) {
    for (let px = 0; px < shape[py].length; px++) {
      if (shape[py][px]) {
        const newX = x + px, newY = y + py;
        if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return false;
        if (newY >= 0 && board[newY][newX]) return false;
      }
    }
  }
  return true;
};

const placePiece = (board, shape, color, x, y) => {
  const newBoard = cloneBoard(board);
  for (let py = 0; py < shape.length; py++) {
    for (let px = 0; px < shape[py].length; px++) {
      if (shape[py][px] && y + py >= 0) newBoard[y + py][x + px] = color;
    }
  }
  return newBoard;
};

const clearLines = (board) => {
  let linesCleared = 0;
  const newBoard = board.filter(row => {
    if (row.every(cell => cell !== null)) { linesCleared++; return false; }
    return true;
  });
  while (newBoard.length < BOARD_HEIGHT) newBoard.unshift(Array(BOARD_WIDTH).fill(null));
  return { board: newBoard, linesCleared };
};

const dropPiece = (board, shape, x) => {
  let y = 0;
  while (isValidPosition(board, shape, x, y + 1)) y++;
  return y;
};

const extractFeatures = (board) => {
  const heights = [];
  let totalHeight = 0, holes = 0, bumpiness = 0, maxHeight = 0;
  
  for (let x = 0; x < BOARD_WIDTH; x++) {
    let colHeight = 0, foundBlock = false;
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      if (board[y][x]) {
        if (!foundBlock) { colHeight = BOARD_HEIGHT - y; foundBlock = true; }
      } else if (foundBlock) holes++;
    }
    heights.push(colHeight);
    totalHeight += colHeight;
    maxHeight = Math.max(maxHeight, colHeight);
  }
  
  for (let i = 0; i < heights.length - 1; i++) bumpiness += Math.abs(heights[i] - heights[i + 1]);
  
  let completeLines = 0;
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    if (board[y].every(cell => cell !== null)) completeLines++;
  }
  
  return [
    totalHeight / (BOARD_WIDTH * BOARD_HEIGHT),
    holes / 50,
    bumpiness / 20,
    completeLines / 4,
    maxHeight / BOARD_HEIGHT
  ];
};

const getAllPlacements = (board, pieceType) => {
  const piece = TETROMINOES[pieceType];
  const rotations = getRotations(piece.shape);
  const placements = [];
  
  for (let rotIdx = 0; rotIdx < rotations.length; rotIdx++) {
    const shape = rotations[rotIdx];
    for (let x = 0; x <= BOARD_WIDTH - shape[0].length; x++) {
      if (isValidPosition(board, shape, x, 0)) {
        const y = dropPiece(board, shape, x);
        const newBoard = placePiece(board, shape, piece.color, x, y);
        const { board: clearedBoard, linesCleared } = clearLines(newBoard);
        placements.push({
          rotIdx, x, y, shape, color: piece.color,
          resultBoard: clearedBoard, linesCleared,
          features: extractFeatures(clearedBoard)
        });
      }
    }
  }
  return placements;
};

// ============================================
// DQN 에이전트
// ============================================
class DQNAgent {
  constructor() {
    this.network = new NeuralNetwork([5, 64, 32, 1]);
    this.targetNetwork = this.network.clone();
    this.epsilon = 1.0;
    this.epsilonMin = 0.01;
    this.epsilonDecay = 0.9992;
    this.gamma = 0.99;
    this.learningRate = 0.001;
    this.memory = [];
    this.maxMemory = 30000;
    this.batchSize = 32;
    this.updateTargetEvery = 500;
    this.stepCount = 0;
  }

  choosePlacement(placements) {
    if (placements.length === 0) return null;
    if (Math.random() < this.epsilon) {
      return placements[Math.floor(Math.random() * placements.length)];
    }
    let best = placements[0], bestQ = this.network.forward(placements[0].features)[0];
    for (let i = 1; i < placements.length; i++) {
      const q = this.network.forward(placements[i].features)[0];
      if (q > bestQ) { bestQ = q; best = placements[i]; }
    }
    return best;
  }

  remember(state, reward, nextState, done) {
    this.memory.push({ state, reward, nextState, done });
    if (this.memory.length > this.maxMemory) this.memory.shift();
  }

  replay() {
    if (this.memory.length < this.batchSize) return 0;
    let totalLoss = 0;
    for (let i = 0; i < this.batchSize; i++) {
      const { state, reward, nextState, done } = this.memory[Math.floor(Math.random() * this.memory.length)];
      const targetQ = done ? reward : reward + this.gamma * this.targetNetwork.forward(nextState)[0];
      const { activations, preActivations } = this.network.forward(state, true);
      totalLoss += this.network.backward(activations, preActivations, [targetQ], this.learningRate);
    }
    if (this.epsilon > this.epsilonMin) this.epsilon *= this.epsilonDecay;
    this.stepCount++;
    if (this.stepCount % this.updateTargetEvery === 0) this.targetNetwork = this.network.clone();
    return totalLoss / this.batchSize;
  }
}

// ============================================
// 시각화 컴포넌트들
// ============================================
const MiniGraph = ({ data, color, height = 50, label }) => {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ fontSize: '0.65rem', opacity: 0.6, marginBottom: '3px' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', height, gap: '1px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', padding: '4px' }}>
        {data.slice(-60).map((v, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${Math.max(2, ((v - min) / range) * 100)}%`,
              background: color,
              borderRadius: '1px 1px 0 0',
              transition: 'height 0.1s'
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', opacity: 0.5, marginTop: '2px' }}>
        <span>{min.toFixed(1)}</span>
        <span>avg: {(data.reduce((a,b) => a+b, 0) / data.length).toFixed(1)}</span>
        <span>{max.toFixed(1)}</span>
      </div>
    </div>
  );
};

const LearningStageIndicator = ({ generation }) => {
  const currentStage = LEARNING_STAGES.find(s => generation >= s.minGames && generation < s.maxGames) || LEARNING_STAGES[LEARNING_STAGES.length - 1];
  const overallProgress = Math.min(100, (generation / 10000) * 100);
  
  return (
    <div style={{ marginBottom: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '1.1rem' }}>{currentStage.name}</span>
        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{currentStage.description}</span>
      </div>
      
      {/* 전체 진행률 */}
      <div style={{ position: 'relative', height: '24px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', overflow: 'hidden' }}>
        {LEARNING_STAGES.map((stage, i) => {
          const startPct = (stage.minGames / 10000) * 100;
          const widthPct = ((stage.maxGames - stage.minGames) / 10000) * 100;
          const isCurrent = generation >= stage.minGames && generation < stage.maxGames;
          const isPast = generation >= stage.maxGames;
          
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${startPct}%`,
                width: `${widthPct}%`,
                height: '100%',
                background: isPast ? stage.color : (isCurrent ? `${stage.color}99` : 'transparent'),
                borderRight: '1px solid rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.6rem',
                color: isPast || isCurrent ? 'white' : 'rgba(255,255,255,0.3)',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
              }}
            >
              {stage.name.split(' ')[0]}
            </div>
          );
        })}
        
        {/* 현재 위치 마커 */}
        <div
          style={{
            position: 'absolute',
            left: `${overallProgress}%`,
            top: 0,
            bottom: 0,
            width: '3px',
            background: 'white',
            boxShadow: '0 0 10px white',
            transform: 'translateX(-50%)',
            zIndex: 10
          }}
        />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', opacity: 0.5, marginTop: '4px' }}>
        <span>0</span>
        <span>Game #{generation}</span>
        <span>10,000</span>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, subValue, color, icon }) => (
  <div style={{
    background: `linear-gradient(135deg, ${color}22, ${color}11)`,
    border: `1px solid ${color}44`,
    borderRadius: '8px',
    padding: '10px',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>{icon} {label}</div>
    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color }}>{value}</div>
    {subValue && <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>{subValue}</div>}
  </div>
);

// ============================================
// 메인 컴포넌트
// ============================================
export default function TetrisRL() {
  const [board, setBoard] = useState(createEmptyBoard);
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPiece, setNextPiece] = useState(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [agent] = useState(() => new DQNAgent());
  const [speed, setSpeed] = useState(50);
  
  // 통계
  const [stats, setStats] = useState({ generation: 0, epsilon: 1, bestScore: 0, totalLines: 0 });
  const [scoreHistory, setScoreHistory] = useState([]);
  const [linesHistory, setLinesHistory] = useState([]);
  const [lossHistory, setLossHistory] = useState([]);
  const [holesHistory, setHolesHistory] = useState([]);
  const [piecesPerGame, setPiecesPerGame] = useState([]);
  
  const aiLoopRef = useRef(null);
  const generationRef = useRef(0);
  const bestScoreRef = useRef(0);
  const totalLinesRef = useRef(0);
  const piecesThisGameRef = useRef(0);
  const prevFeaturesRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const getRandomPiece = () => Object.keys(TETROMINOES)[Math.floor(Math.random() * 7)];

  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setScore(0);
    setLines(0);
    setGameOver(false);
    setCurrentPiece(getRandomPiece());
    setNextPiece(getRandomPiece());
    prevFeaturesRef.current = extractFeatures(createEmptyBoard());
    piecesThisGameRef.current = 0;
  }, []);

  useEffect(() => {
    if (!isTraining) {
      if (aiLoopRef.current) clearInterval(aiLoopRef.current);
      return;
    }
    if (!currentPiece) { resetGame(); return; }

    aiLoopRef.current = setInterval(() => {
      if (gameOver) {
        if (prevFeaturesRef.current) {
          agent.remember(prevFeaturesRef.current, -10, extractFeatures(board), true);
        }
        
        generationRef.current++;
        if (score > bestScoreRef.current) bestScoreRef.current = score;
        totalLinesRef.current += lines;
        
        const loss = agent.replay();
        
        // 히스토리 업데이트
        setScoreHistory(prev => [...prev.slice(-200), score]);
        setLinesHistory(prev => [...prev.slice(-200), lines]);
        if (loss > 0) setLossHistory(prev => [...prev.slice(-200), loss]);
        setPiecesPerGame(prev => [...prev.slice(-200), piecesThisGameRef.current]);
        
        // 현재 보드 상태의 구멍 수 기록
        const features = extractFeatures(board);
        setHolesHistory(prev => [...prev.slice(-200), features[1] * 50]);
        
        setStats({
          generation: generationRef.current,
          epsilon: agent.epsilon,
          bestScore: bestScoreRef.current,
          totalLines: totalLinesRef.current
        });
        
        resetGame();
        return;
      }

      const placements = getAllPlacements(board, currentPiece);
      if (placements.length === 0) { setGameOver(true); return; }

      const chosen = agent.choosePlacement(placements);
      const prevFeatures = prevFeaturesRef.current || extractFeatures(board);
      
      const reward = 
        chosen.linesCleared * chosen.linesCleared * 10 +
        (prevFeatures[1] - chosen.features[1]) * 5 +
        (prevFeatures[0] - chosen.features[0]) * 2 +
        (prevFeatures[2] - chosen.features[2]) * 1 +
        0.1;
      
      if (prevFeaturesRef.current) {
        agent.remember(prevFeaturesRef.current, reward, chosen.features, false);
      }
      
      prevFeaturesRef.current = chosen.features;
      setBoard(chosen.resultBoard);
      setScore(prev => prev + [0, 100, 300, 500, 800][chosen.linesCleared]);
      setLines(prev => prev + chosen.linesCleared);
      setCurrentPiece(nextPiece);
      setNextPiece(getRandomPiece());
      piecesThisGameRef.current++;
      
      if (piecesThisGameRef.current % 10 === 0) agent.replay();
    }, speed);

    return () => { if (aiLoopRef.current) clearInterval(aiLoopRef.current); };
  }, [isTraining, gameOver, currentPiece, nextPiece, board, score, lines, agent, speed, resetGame]);

  useEffect(() => { if (!currentPiece) resetGame(); }, [currentPiece, resetGame]);

  const renderBoard = () => board.map(row => [...row]);

  const renderNextPiece = () => {
    if (!nextPiece) return null;
    const shape = TETROMINOES[nextPiece].shape;
    return (
      <div style={{ display: 'inline-block' }}>
        {shape.map((row, y) => (
          <div key={y} style={{ display: 'flex' }}>
            {row.map((cell, x) => (
              <div key={x} style={{
                width: 14, height: 14,
                background: cell ? TETROMINOES[nextPiece].color : 'transparent',
                borderRadius: 2
              }} />
            ))}
          </div>
        ))}
      </div>
    );
  };

  // 예상 남은 시간 계산
  const getTimeEstimate = () => {
    if (generationRef.current < 10) return '계산 중...';
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const gamesPerSec = generationRef.current / elapsed;
    const remaining = (10000 - generationRef.current) / gamesPerSec;
    if (remaining < 60) return `~${Math.round(remaining)}초`;
    if (remaining < 3600) return `~${Math.round(remaining / 60)}분`;
    return `~${(remaining / 3600).toFixed(1)}시간`;
  };

  // 이동 평균 계산
  const getMovingAvg = (arr, window = 20) => {
    if (arr.length < window) return arr.length > 0 ? arr.reduce((a,b) => a+b, 0) / arr.length : 0;
    const recent = arr.slice(-window);
    return recent.reduce((a,b) => a+b, 0) / window;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%)',
      fontFamily: "'JetBrains Mono', monospace",
      color: '#e0e0e0',
      padding: '15px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <h1 style={{
        fontSize: '1.8rem',
        fontWeight: 800,
        background: 'linear-gradient(90deg, #00f5ff, #ff00ff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '10px'
      }}>
        🧠 TETRIS DQN Learning Dashboard
      </h1>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
        
        {/* 왼쪽: 게임 보드 */}
        <div>
          <div style={{
            background: 'rgba(0,0,0,0.6)',
            padding: '10px',
            borderRadius: '10px',
            border: '2px solid rgba(0,245,255,0.3)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)`,
              gap: '1px',
              background: 'rgba(255,255,255,0.05)'
            }}>
              {renderBoard().map((row, y) =>
                row.map((cell, x) => (
                  <div key={`${x}-${y}`} style={{
                    width: CELL_SIZE, height: CELL_SIZE,
                    background: cell || 'rgba(20,20,40,0.8)',
                    borderRadius: '2px',
                    boxShadow: cell ? `0 0 6px ${cell}` : 'none'
                  }} />
                ))
              )}
            </div>
          </div>
          
          {/* 현재 게임 정보 */}
          <div style={{
            marginTop: '10px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '8px'
          }}>
            <MetricCard label="SCORE" value={score} color="#00f5ff" icon="🎯" />
            <MetricCard label="LINES" value={lines} color="#ff00ff" icon="📊" />
            <MetricCard label="NEXT" value={renderNextPiece()} color="#ffd700" icon="⏭️" />
          </div>
        </div>

        {/* 오른쪽: 대시보드 */}
        <div style={{ width: '380px' }}>
          
          {/* 학습 단계 표시 */}
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '15px'
          }}>
            <LearningStageIndicator generation={stats.generation} />
          </div>

          {/* 주요 지표 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: '8px',
            marginBottom: '15px'
          }}>
            <MetricCard 
              label="Games" 
              value={stats.generation} 
              subValue={getTimeEstimate()}
              color="#3498db" 
              icon="🎮" 
            />
            <MetricCard 
              label="ε" 
              value={stats.epsilon.toFixed(2)} 
              subValue={stats.epsilon > 0.5 ? '탐색' : stats.epsilon > 0.1 ? '학습' : '활용'}
              color="#f1c40f" 
              icon="🎲" 
            />
            <MetricCard 
              label="Best" 
              value={stats.bestScore} 
              color="#2ecc71" 
              icon="🏆" 
            />
            <MetricCard 
              label="Avg" 
              value={Math.round(getMovingAvg(scoreHistory))} 
              subValue="최근 20게임"
              color="#e67e22" 
              icon="📈" 
            />
          </div>

          {/* 그래프들 */}
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '15px'
          }}>
            <MiniGraph 
              data={scoreHistory} 
              color="linear-gradient(to top, #3498db, #00f5ff)" 
              height={60} 
              label="📊 점수 추이 (Score Trend)"
            />
            <MiniGraph 
              data={linesHistory} 
              color="linear-gradient(to top, #9b59b6, #ff00ff)" 
              height={45} 
              label="📏 라인 클리어 (Lines per Game)"
            />
            <MiniGraph 
              data={piecesPerGame} 
              color="linear-gradient(to top, #27ae60, #2ecc71)" 
              height={45} 
              label="🧩 생존 피스 수 (Pieces per Game)"
            />
            {lossHistory.length > 5 && (
              <MiniGraph 
                data={lossHistory} 
                color="linear-gradient(to top, #c0392b, #e74c3c)" 
                height={40} 
                label="📉 손실 함수 (Loss) - 낮을수록 좋음"
              />
            )}
          </div>

          {/* 컨트롤 */}
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            padding: '15px',
            borderRadius: '10px'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '5px' }}>
                <span style={{ opacity: 0.7 }}>속도</span>
                <span style={{ color: '#00f5ff' }}>{speed}ms ({Math.round(1000/speed)} games/sec)</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#00f5ff' }}
              />
            </div>

            <button
              onClick={() => {
                if (!isTraining) startTimeRef.current = Date.now();
                setIsTraining(!isTraining);
                if (!isTraining) resetGame();
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: isTraining 
                  ? 'linear-gradient(135deg, #e74c3c, #c0392b)'
                  : 'linear-gradient(135deg, #2ecc71, #27ae60)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              {isTraining ? '⏹ 학습 중지' : '▶️ 학습 시작'}
            </button>

            {/* 학습 팁 */}
            <div style={{
              marginTop: '12px',
              padding: '10px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '6px',
              fontSize: '0.7rem',
              lineHeight: '1.5'
            }}>
              <strong style={{ color: '#ffd700' }}>💡 학습 팁</strong>
              <ul style={{ margin: '5px 0 0 15px', padding: 0, opacity: 0.8 }}>
                <li>속도 10ms로 설정하면 빠른 학습</li>
                <li>ε(엡실론)이 0.1 이하면 본격 활용</li>
                <li>점수 그래프가 우상향하면 성공!</li>
                <li>~500게임 후 눈에 띄는 개선</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 요약 */}
      <div style={{
        marginTop: '15px',
        padding: '12px 20px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '8px',
        fontSize: '0.75rem',
        display: 'flex',
        gap: '30px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <span>🧠 Network: 5→64→32→1</span>
        <span>🎯 Features: Height, Holes, Bumpiness, Lines, MaxH</span>
        <span>⚡ Optimizer: Adam</span>
        <span>🔄 Target Update: 500 steps</span>
        <span>💾 Memory: {agent.memory.length.toLocaleString()}</span>
      </div>
    </div>
  );
}
