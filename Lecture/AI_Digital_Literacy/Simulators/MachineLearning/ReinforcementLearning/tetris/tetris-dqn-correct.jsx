import React, { useState, useEffect, useCallback, useRef } from 'react';

// ============================================
// 테트리스 설정
// ============================================
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 24;

const TETROMINOES = {
  I: { shape: [[1,1,1,1]], color: '#00f5ff' },
  O: { shape: [[1,1],[1,1]], color: '#ffd700' },
  T: { shape: [[0,1,0],[1,1,1]], color: '#9b59b6' },
  S: { shape: [[0,1,1],[1,1,0]], color: '#2ecc71' },
  Z: { shape: [[1,1,0],[0,1,1]], color: '#e74c3c' },
  J: { shape: [[1,0,0],[1,1,1]], color: '#3498db' },
  L: { shape: [[0,0,1],[1,1,1]], color: '#e67e22' }
};

// ============================================
// 신경망 - 올바른 역전파 + Adam
// ============================================
class NeuralNetwork {
  constructor(layers) {
    this.layers = layers;
    this.weights = [];
    this.biases = [];
    
    // He 초기화
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
    
    // Adam optimizer 상태
    this.m_w = this.weights.map(w => w.map(row => row.map(() => 0)));
    this.v_w = this.weights.map(w => w.map(row => row.map(() => 0)));
    this.m_b = this.biases.map(b => b.map(() => 0));
    this.v_b = this.biases.map(b => b.map(() => 0));
    this.t = 0;
  }

  randn() {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
  }

  relu(x) { return Math.max(0, x); }
  reluDeriv(x) { return x > 0 ? 1 : 0; }

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
        for (let i = 0; i < current.length; i++) {
          sum += current[i] * W[i][j];
        }
        return sum;
      });
      
      preActivations.push(z);
      current = isLast ? z : z.map(x => this.relu(x));
      activations.push(current);
    }

    if (training) {
      return { output: current, activations, preActivations };
    }
    return current;
  }

  backward(activations, preActivations, targets, lr = 0.001) {
    const numLayers = this.weights.length;
    const gradW = this.weights.map(w => w.map(row => row.map(() => 0)));
    const gradB = this.biases.map(b => b.map(() => 0));
    
    // 출력층 델타 (MSE loss)
    let delta = activations[numLayers].map((o, i) => o - targets[i]);
    
    // 역전파
    for (let l = numLayers - 1; l >= 0; l--) {
      const a_prev = activations[l];
      
      // 그래디언트 계산
      for (let i = 0; i < a_prev.length; i++) {
        for (let j = 0; j < delta.length; j++) {
          gradW[l][i][j] = a_prev[i] * delta[j];
        }
      }
      for (let j = 0; j < delta.length; j++) {
        gradB[l][j] = delta[j];
      }
      
      // 이전 층으로 델타 전파
      if (l > 0) {
        const newDelta = [];
        for (let i = 0; i < this.weights[l].length; i++) {
          let sum = 0;
          for (let j = 0; j < delta.length; j++) {
            sum += this.weights[l][i][j] * delta[j];
          }
          // ReLU 미분 적용
          sum *= this.reluDeriv(preActivations[l][i]);
          newDelta.push(sum);
        }
        delta = newDelta;
      }
    }
    
    // Adam 업데이트
    this.adamUpdate(gradW, gradB, lr);
    
    // Loss 반환
    const loss = targets.reduce((sum, t, i) => 
      sum + Math.pow(activations[numLayers][i] - t, 2), 0) / targets.length;
    return loss;
  }

  adamUpdate(gradW, gradB, lr, beta1 = 0.9, beta2 = 0.999, eps = 1e-8) {
    this.t++;
    const bc1 = 1 - Math.pow(beta1, this.t);
    const bc2 = 1 - Math.pow(beta2, this.t);
    
    for (let l = 0; l < this.weights.length; l++) {
      for (let i = 0; i < this.weights[l].length; i++) {
        for (let j = 0; j < this.weights[l][i].length; j++) {
          const g = gradW[l][i][j];
          this.m_w[l][i][j] = beta1 * this.m_w[l][i][j] + (1 - beta1) * g;
          this.v_w[l][i][j] = beta2 * this.v_w[l][i][j] + (1 - beta2) * g * g;
          const mHat = this.m_w[l][i][j] / bc1;
          const vHat = this.v_w[l][i][j] / bc2;
          this.weights[l][i][j] -= lr * mHat / (Math.sqrt(vHat) + eps);
        }
      }
      for (let j = 0; j < this.biases[l].length; j++) {
        const g = gradB[l][j];
        this.m_b[l][j] = beta1 * this.m_b[l][j] + (1 - beta1) * g;
        this.v_b[l][j] = beta2 * this.v_b[l][j] + (1 - beta2) * g * g;
        const mHat = this.m_b[l][j] / bc1;
        const vHat = this.v_b[l][j] / bc2;
        this.biases[l][j] -= lr * mHat / (Math.sqrt(vHat) + eps);
      }
    }
  }

  clone() {
    const nn = new NeuralNetwork(this.layers);
    nn.weights = this.weights.map(w => w.map(row => [...row]));
    nn.biases = this.biases.map(b => [...b]);
    return nn;
  }

  predict(input) {
    return this.forward(input, false);
  }
}

// ============================================
// 테트리스 게임 엔진 (순수 함수)
// ============================================
const createEmptyBoard = () => 
  Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(null));

const cloneBoard = (board) => board.map(row => [...row]);

const rotatePiece = (shape) => {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      rotated[x][rows - 1 - y] = shape[y][x];
    }
  }
  return rotated;
};

const getRotations = (shape) => {
  const rotations = [shape];
  let current = shape;
  for (let i = 0; i < 3; i++) {
    current = rotatePiece(current);
    // 중복 체크 (O 피스 등)
    const isDuplicate = rotations.some(r => 
      JSON.stringify(r) === JSON.stringify(current)
    );
    if (!isDuplicate) {
      rotations.push(current);
    }
  }
  return rotations;
};

const isValidPosition = (board, shape, x, y) => {
  for (let py = 0; py < shape.length; py++) {
    for (let px = 0; px < shape[py].length; px++) {
      if (shape[py][px]) {
        const newX = x + px;
        const newY = y + py;
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
      if (shape[py][px] && y + py >= 0) {
        newBoard[y + py][x + px] = color;
      }
    }
  }
  return newBoard;
};

const clearLines = (board) => {
  let linesCleared = 0;
  const newBoard = board.filter(row => {
    if (row.every(cell => cell !== null)) {
      linesCleared++;
      return false;
    }
    return true;
  });
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null));
  }
  return { board: newBoard, linesCleared };
};

const dropPiece = (board, shape, x) => {
  let y = 0;
  while (isValidPosition(board, shape, x, y + 1)) {
    y++;
  }
  return y;
};

// ============================================
// 보드 특징 추출 (핵심!)
// ============================================
const extractFeatures = (board) => {
  const heights = [];
  let totalHeight = 0;
  let holes = 0;
  let bumpiness = 0;
  let completeLines = 0;
  let maxHeight = 0;
  
  // 각 열의 높이와 구멍 계산
  for (let x = 0; x < BOARD_WIDTH; x++) {
    let colHeight = 0;
    let foundBlock = false;
    let colHoles = 0;
    
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      if (board[y][x]) {
        if (!foundBlock) {
          colHeight = BOARD_HEIGHT - y;
          foundBlock = true;
        }
      } else if (foundBlock) {
        colHoles++;
      }
    }
    
    heights.push(colHeight);
    totalHeight += colHeight;
    holes += colHoles;
    maxHeight = Math.max(maxHeight, colHeight);
  }
  
  // 울퉁불퉁함 (인접 열 높이 차이 합)
  for (let i = 0; i < heights.length - 1; i++) {
    bumpiness += Math.abs(heights[i] - heights[i + 1]);
  }
  
  // 완성 가능한 라인 수
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    if (board[y].every(cell => cell !== null)) {
      completeLines++;
    }
  }
  
  // 정규화된 특징 벡터 반환
  return [
    totalHeight / (BOARD_WIDTH * BOARD_HEIGHT),  // 총 높이 (정규화)
    holes / 50,                                    // 구멍 수 (정규화)
    bumpiness / 20,                               // 울퉁불퉁함 (정규화)
    completeLines / 4,                            // 완성 라인 (정규화)
    maxHeight / BOARD_HEIGHT                      // 최대 높이 (정규화)
  ];
};

// ============================================
// 가능한 모든 배치 생성
// ============================================
const getAllPlacements = (board, pieceType) => {
  const piece = TETROMINOES[pieceType];
  const rotations = getRotations(piece.shape);
  const placements = [];
  
  for (let rotIdx = 0; rotIdx < rotations.length; rotIdx++) {
    const shape = rotations[rotIdx];
    const pieceWidth = shape[0].length;
    
    for (let x = 0; x <= BOARD_WIDTH - pieceWidth; x++) {
      if (isValidPosition(board, shape, x, 0)) {
        const y = dropPiece(board, shape, x);
        const newBoard = placePiece(board, shape, piece.color, x, y);
        const { board: clearedBoard, linesCleared } = clearLines(newBoard);
        
        placements.push({
          rotIdx,
          x,
          y,
          shape,
          color: piece.color,
          resultBoard: clearedBoard,
          linesCleared,
          features: extractFeatures(clearedBoard)
        });
      }
    }
  }
  
  return placements;
};

// ============================================
// DQN 에이전트 (Feature-based)
// ============================================
class DQNAgent {
  constructor() {
    // 상태: 5개 특징 (totalHeight, holes, bumpiness, completeLines, maxHeight)
    // 출력: 1개 (배치의 Q값)
    this.network = new NeuralNetwork([5, 64, 32, 1]);
    this.targetNetwork = this.network.clone();
    
    this.epsilon = 1.0;
    this.epsilonMin = 0.01;
    this.epsilonDecay = 0.9995;
    this.gamma = 0.99;
    this.learningRate = 0.001;
    
    this.memory = [];
    this.maxMemory = 30000;
    this.batchSize = 32;
    
    this.updateTargetEvery = 500;
    this.stepCount = 0;
  }

  // 각 배치의 Q값 예측
  evaluatePlacement(features) {
    return this.network.predict(features)[0];
  }

  // 최적의 배치 선택
  choosePlacement(placements) {
    if (placements.length === 0) return null;
    
    // Epsilon-greedy
    if (Math.random() < this.epsilon) {
      return placements[Math.floor(Math.random() * placements.length)];
    }
    
    // 모든 배치의 Q값 계산
    let bestPlacement = placements[0];
    let bestQ = this.evaluatePlacement(placements[0].features);
    
    for (let i = 1; i < placements.length; i++) {
      const q = this.evaluatePlacement(placements[i].features);
      if (q > bestQ) {
        bestQ = q;
        bestPlacement = placements[i];
      }
    }
    
    return bestPlacement;
  }

  // 경험 저장
  remember(state, reward, nextState, done) {
    this.memory.push({ state, reward, nextState, done });
    if (this.memory.length > this.maxMemory) {
      this.memory.shift();
    }
  }

  // 학습
  replay() {
    if (this.memory.length < this.batchSize) return 0;

    // 미니배치 샘플링
    const batch = [];
    for (let i = 0; i < this.batchSize; i++) {
      batch.push(this.memory[Math.floor(Math.random() * this.memory.length)]);
    }

    let totalLoss = 0;

    for (const { state, reward, nextState, done } of batch) {
      // Target Q 계산
      let targetQ;
      if (done) {
        targetQ = reward;
      } else {
        const nextQ = this.targetNetwork.predict(nextState)[0];
        targetQ = reward + this.gamma * nextQ;
      }

      // 학습
      const { activations, preActivations } = this.network.forward(state, true);
      const loss = this.network.backward(activations, preActivations, [targetQ], this.learningRate);
      totalLoss += loss;
    }

    // Epsilon decay
    if (this.epsilon > this.epsilonMin) {
      this.epsilon *= this.epsilonDecay;
    }

    // Target network 업데이트
    this.stepCount++;
    if (this.stepCount % this.updateTargetEvery === 0) {
      this.targetNetwork = this.network.clone();
    }

    return totalLoss / this.batchSize;
  }
}

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
  const [isAIPlaying, setIsAIPlaying] = useState(false);
  const [agent] = useState(() => new DQNAgent());
  const [speed, setSpeed] = useState(100);
  const [stats, setStats] = useState({
    generation: 0,
    epsilon: 1,
    bestScore: 0,
    avgScore: 0,
    avgLoss: 0,
    memorySize: 0,
    totalPieces: 0
  });
  const [recentScores, setRecentScores] = useState([]);
  const [lossHistory, setLossHistory] = useState([]);
  
  // Manual play state
  const [manualPieceX, setManualPieceX] = useState(0);
  const [manualPieceY, setManualPieceY] = useState(0);
  const [manualRotation, setManualRotation] = useState(0);
  
  const aiLoopRef = useRef(null);
  const manualLoopRef = useRef(null);
  const generationRef = useRef(0);
  const bestScoreRef = useRef(0);
  const piecesPlayedRef = useRef(0);
  const prevFeaturesRef = useRef(null);

  const getRandomPiece = () => {
    const types = Object.keys(TETROMINOES);
    return types[Math.floor(Math.random() * types.length)];
  };

  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setScore(0);
    setLines(0);
    setGameOver(false);
    setCurrentPiece(getRandomPiece());
    setNextPiece(getRandomPiece());
    setManualPieceX(3);
    setManualPieceY(0);
    setManualRotation(0);
    prevFeaturesRef.current = extractFeatures(createEmptyBoard());
  }, []);

  // AI/Training 루프
  useEffect(() => {
    if (!isTraining && !isAIPlaying) {
      if (aiLoopRef.current) clearInterval(aiLoopRef.current);
      return;
    }

    if (!currentPiece) {
      resetGame();
      return;
    }

    aiLoopRef.current = setInterval(() => {
      if (gameOver) {
        // 게임 오버: 마지막 경험 저장 (큰 음수 보상)
        if (isTraining && prevFeaturesRef.current) {
          agent.remember(prevFeaturesRef.current, -10, extractFeatures(board), true);
        }
        
        generationRef.current++;
        if (score > bestScoreRef.current) {
          bestScoreRef.current = score;
        }
        
        // 학습 실행
        if (isTraining) {
          const loss = agent.replay();
          if (loss > 0) {
            setLossHistory(prev => [...prev.slice(-200), loss]);
          }
        }
        
        setRecentScores(prev => [...prev.slice(-100), score]);
        
        setStats({
          generation: generationRef.current,
          epsilon: agent.epsilon,
          bestScore: bestScoreRef.current,
          avgScore: recentScores.length > 0 
            ? Math.round(recentScores.reduce((a, b) => a + b, 0) / recentScores.length)
            : 0,
          avgLoss: lossHistory.length > 0
            ? (lossHistory.reduce((a, b) => a + b, 0) / lossHistory.length).toFixed(4)
            : 0,
          memorySize: agent.memory.length,
          totalPieces: piecesPlayedRef.current
        });
        
        resetGame();
        return;
      }

      // 가능한 모든 배치 생성
      const placements = getAllPlacements(board, currentPiece);
      
      if (placements.length === 0) {
        setGameOver(true);
        return;
      }

      // AI가 배치 선택
      const chosen = agent.choosePlacement(placements);
      
      // 보상 계산
      // 핵심: 구멍과 높이를 줄이고, 라인 클리어를 장려
      const prevFeatures = prevFeaturesRef.current || extractFeatures(board);
      const reward = 
        chosen.linesCleared * chosen.linesCleared * 10 +  // 라인 클리어 보상 (제곱)
        (prevFeatures[1] - chosen.features[1]) * 5 +       // 구멍 감소 보상
        (prevFeatures[0] - chosen.features[0]) * 2 +       // 높이 감소 보상
        (prevFeatures[2] - chosen.features[2]) * 1 +       // 울퉁불퉁함 감소 보상
        0.1;                                               // 생존 보너스
      
      // 경험 저장
      if (isTraining && prevFeaturesRef.current) {
        agent.remember(prevFeaturesRef.current, reward, chosen.features, false);
      }
      
      // 상태 업데이트
      prevFeaturesRef.current = chosen.features;
      setBoard(chosen.resultBoard);
      setScore(prev => prev + [0, 100, 300, 500, 800][chosen.linesCleared]);
      setLines(prev => prev + chosen.linesCleared);
      setCurrentPiece(nextPiece);
      setNextPiece(getRandomPiece());
      piecesPlayedRef.current++;
      
      // 매 10피스마다 학습
      if (isTraining && piecesPlayedRef.current % 10 === 0) {
        agent.replay();
      }
      
    }, speed);

    return () => {
      if (aiLoopRef.current) clearInterval(aiLoopRef.current);
    };
  }, [isTraining, isAIPlaying, gameOver, currentPiece, nextPiece, board, score, 
      agent, speed, resetGame, recentScores, lossHistory]);

  // 수동 플레이
  const manualShape = currentPiece ? getRotations(TETROMINOES[currentPiece].shape)[manualRotation % getRotations(TETROMINOES[currentPiece].shape).length] : null;
  
  const movePiece = useCallback((dx, dy, rotate = false) => {
    if (!currentPiece || gameOver || isTraining || isAIPlaying) return;
    
    let newRotation = manualRotation;
    let shape = manualShape;
    
    if (rotate) {
      const rotations = getRotations(TETROMINOES[currentPiece].shape);
      newRotation = (manualRotation + 1) % rotations.length;
      shape = rotations[newRotation];
    }
    
    const newX = manualPieceX + dx;
    const newY = manualPieceY + dy;
    
    if (isValidPosition(board, shape, newX, newY)) {
      setManualPieceX(newX);
      setManualPieceY(newY);
      if (rotate) setManualRotation(newRotation);
      return true;
    }
    return false;
  }, [currentPiece, gameOver, isTraining, isAIPlaying, manualPieceX, manualPieceY, manualRotation, manualShape, board]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isTraining || isAIPlaying || !manualShape) return;
    
    const y = dropPiece(board, manualShape, manualPieceX);
    const newBoard = placePiece(board, manualShape, TETROMINOES[currentPiece].color, manualPieceX, y);
    const { board: clearedBoard, linesCleared } = clearLines(newBoard);
    
    setBoard(clearedBoard);
    setScore(prev => prev + [0, 100, 300, 500, 800][linesCleared]);
    setLines(prev => prev + linesCleared);
    setCurrentPiece(nextPiece);
    setNextPiece(getRandomPiece());
    setManualPieceX(3);
    setManualPieceY(0);
    setManualRotation(0);
    
    // 게임 오버 체크
    const newShape = TETROMINOES[nextPiece].shape;
    if (!isValidPosition(clearedBoard, newShape, 3, 0)) {
      setGameOver(true);
    }
  }, [currentPiece, nextPiece, gameOver, isTraining, isAIPlaying, manualShape, manualPieceX, board]);

  // 키보드 입력
  useEffect(() => {
    if (isAIPlaying || isTraining) return;

    const handleKeyDown = (e) => {
      if (gameOver) {
        if (e.key === 'Enter') resetGame();
        return;
      }
      
      switch (e.key) {
        case 'ArrowLeft': movePiece(-1, 0); break;
        case 'ArrowRight': movePiece(1, 0); break;
        case 'ArrowDown': movePiece(0, 1); break;
        case 'ArrowUp': movePiece(0, 0, true); break;
        case ' ': e.preventDefault(); hardDrop(); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePiece, hardDrop, gameOver, resetGame, isAIPlaying, isTraining]);

  // 수동 플레이 중력
  useEffect(() => {
    if (isAIPlaying || isTraining || gameOver || !currentPiece) {
      if (manualLoopRef.current) clearInterval(manualLoopRef.current);
      return;
    }

    manualLoopRef.current = setInterval(() => {
      if (!movePiece(0, 1)) {
        hardDrop();
      }
    }, 500);

    return () => {
      if (manualLoopRef.current) clearInterval(manualLoopRef.current);
    };
  }, [isAIPlaying, isTraining, gameOver, currentPiece, movePiece, hardDrop]);

  // 초기화
  useEffect(() => {
    if (!currentPiece) {
      resetGame();
    }
  }, [currentPiece, resetGame]);

  // 렌더링용 보드
  const renderBoard = () => {
    const displayBoard = cloneBoard(board);
    
    // 수동 플레이 시 현재 피스 표시
    if (!isAIPlaying && !isTraining && currentPiece && manualShape) {
      // 고스트 피스
      const ghostY = dropPiece(board, manualShape, manualPieceX);
      for (let py = 0; py < manualShape.length; py++) {
        for (let px = 0; px < manualShape[py].length; px++) {
          if (manualShape[py][px]) {
            const y = ghostY + py;
            const x = manualPieceX + px;
            if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH && !displayBoard[y][x]) {
              displayBoard[y][x] = TETROMINOES[currentPiece].color + '40';
            }
          }
        }
      }
      
      // 실제 피스
      for (let py = 0; py < manualShape.length; py++) {
        for (let px = 0; px < manualShape[py].length; px++) {
          if (manualShape[py][px]) {
            const y = manualPieceY + py;
            const x = manualPieceX + px;
            if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
              displayBoard[y][x] = TETROMINOES[currentPiece].color;
            }
          }
        }
      }
    }
    
    return displayBoard;
  };

  // 다음 피스 미리보기
  const renderNextPiece = () => {
    if (!nextPiece) return null;
    const shape = TETROMINOES[nextPiece].shape;
    const color = TETROMINOES[nextPiece].color;
    
    return (
      <div style={{ display: 'inline-block' }}>
        {shape.map((row, y) => (
          <div key={y} style={{ display: 'flex' }}>
            {row.map((cell, x) => (
              <div
                key={x}
                style={{
                  width: 16,
                  height: 16,
                  background: cell ? color : 'transparent',
                  borderRadius: 2,
                  boxShadow: cell ? `0 0 5px ${color}` : 'none'
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%)',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      color: '#e0e0e0',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <h1 style={{
        fontSize: '2.2rem',
        fontWeight: 800,
        background: 'linear-gradient(90deg, #00f5ff, #ff00ff, #00f5ff)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'gradient 3s ease infinite',
        marginBottom: '5px'
      }}>
        🧠 TETRIS DQN
      </h1>
      <p style={{ opacity: 0.6, marginBottom: '15px', fontSize: '0.85rem' }}>
        Feature-based Deep Q-Network
      </p>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(0,245,255,0.3); }
          50% { box-shadow: 0 0 40px rgba(0,245,255,0.6); }
        }
      `}</style>

      <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* 게임 보드 */}
        <div style={{
          background: 'rgba(0,0,0,0.6)',
          padding: '12px',
          borderRadius: '12px',
          border: '2px solid rgba(0,245,255,0.3)',
          animation: 'pulse 2s ease-in-out infinite',
          position: 'relative'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)`,
            gap: '1px',
            background: 'rgba(255,255,255,0.05)'
          }}>
            {renderBoard().map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    background: cell || 'rgba(20,20,40,0.8)',
                    borderRadius: '3px',
                    boxShadow: cell && !cell.endsWith('40')
                      ? `0 0 8px ${cell}, inset 0 0 4px rgba(255,255,255,0.2)`
                      : 'none',
                    border: cell?.endsWith('40') ? '1px dashed rgba(255,255,255,0.2)' : 'none',
                    transition: 'all 0.05s'
                  }}
                />
              ))
            )}
          </div>
          
          {gameOver && !isTraining && !isAIPlaying && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(0,0,0,0.95)',
              padding: '25px',
              borderRadius: '12px',
              textAlign: 'center',
              border: '2px solid #ff00ff',
              zIndex: 10
            }}>
              <h2 style={{ color: '#ff00ff', margin: 0 }}>GAME OVER</h2>
              <p style={{ color: '#00f5ff', margin: '10px 0' }}>Score: {score}</p>
              <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Enter to restart</p>
            </div>
          )}
        </div>

        {/* 컨트롤 패널 */}
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          padding: '15px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
          width: '280px'
        }}>
          {/* 점수 & 다음 피스 */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div style={{
              background: 'rgba(0,245,255,0.1)',
              padding: '12px',
              borderRadius: '8px',
              flex: 1
            }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>SCORE</div>
              <div style={{ color: '#00f5ff', fontWeight: 'bold', fontSize: '1.3rem' }}>{score}</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '5px' }}>LINES: {lines}</div>
            </div>
            <div style={{
              background: 'rgba(255,0,255,0.1)',
              padding: '12px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '5px' }}>NEXT</div>
              {renderNextPiece()}
            </div>
          </div>

          {/* AI 상태 */}
          <div style={{
            background: 'rgba(100,100,255,0.1)',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '15px',
            fontSize: '0.75rem'
          }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#9b59b6', fontSize: '0.85rem' }}>
              🤖 DQN Status
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', lineHeight: '1.6' }}>
              <span style={{ opacity: 0.6 }}>Generation</span>
              <span style={{ color: '#00f5ff', textAlign: 'right' }}>{stats.generation}</span>
              <span style={{ opacity: 0.6 }}>Epsilon</span>
              <span style={{ color: '#ffd700', textAlign: 'right' }}>{stats.epsilon.toFixed(3)}</span>
              <span style={{ opacity: 0.6 }}>Best</span>
              <span style={{ color: '#2ecc71', textAlign: 'right' }}>{stats.bestScore}</span>
              <span style={{ opacity: 0.6 }}>Avg(100)</span>
              <span style={{ color: '#e67e22', textAlign: 'right' }}>{stats.avgScore}</span>
              <span style={{ opacity: 0.6 }}>Loss</span>
              <span style={{ color: '#e74c3c', textAlign: 'right' }}>{stats.avgLoss}</span>
              <span style={{ opacity: 0.6 }}>Memory</span>
              <span style={{ color: '#9b59b6', textAlign: 'right' }}>{stats.memorySize.toLocaleString()}</span>
            </div>
            
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '3px' }}>
                Exploration → Exploitation
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                <div style={{
                  width: `${(1 - stats.epsilon) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #ff00ff, #00f5ff)',
                  borderRadius: '2px',
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>
          </div>

          {/* 속도 */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '0.75rem', opacity: 0.6 }}>
              Speed: {speed}ms
            </label>
            <input
              type="range"
              min="10"
              max="500"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              style={{ width: '100%', marginTop: '5px', accentColor: '#00f5ff' }}
            />
          </div>

          {/* 버튼 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => {
                setIsTraining(!isTraining);
                setIsAIPlaying(false);
                if (!isTraining) resetGame();
              }}
              style={{
                padding: '10px',
                background: isTraining 
                  ? 'linear-gradient(135deg, #e74c3c, #c0392b)'
                  : 'linear-gradient(135deg, #2ecc71, #27ae60)',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {isTraining ? '⏹ Stop Training' : '🎓 Start Training'}
            </button>

            <button
              onClick={() => {
                setIsAIPlaying(!isAIPlaying);
                setIsTraining(false);
                if (!isAIPlaying) resetGame();
              }}
              style={{
                padding: '10px',
                background: isAIPlaying
                  ? 'linear-gradient(135deg, #e74c3c, #c0392b)'
                  : 'linear-gradient(135deg, #3498db, #2980b9)',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {isAIPlaying ? '⏹ Stop AI' : '🤖 AI Demo'}
            </button>

            <button
              onClick={() => {
                setIsTraining(false);
                setIsAIPlaying(false);
                resetGame();
              }}
              style={{
                padding: '10px',
                background: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              🎮 Manual Play
            </button>
          </div>

          {/* 조작법 */}
          {!isAIPlaying && !isTraining && (
            <div style={{
              marginTop: '12px',
              padding: '10px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '6px',
              fontSize: '0.7rem'
            }}>
              <div style={{ opacity: 0.7, marginBottom: '5px' }}>Controls</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                <span>← → Move</span>
                <span>↑ Rotate</span>
                <span>↓ Soft drop</span>
                <span>Space Drop</span>
              </div>
            </div>
          )}

          {/* 스코어 그래프 */}
          {recentScores.length > 5 && (
            <div style={{
              marginTop: '12px',
              padding: '10px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '6px'
            }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '5px' }}>📈 Score Trend</div>
              <div style={{ height: '40px', display: 'flex', alignItems: 'flex-end', gap: '1px' }}>
                {recentScores.slice(-50).map((s, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${Math.max(3, (s / (Math.max(...recentScores) || 1)) * 100)}%`,
                      background: 'linear-gradient(to top, #00f5ff, #ff00ff)',
                      borderRadius: '1px 1px 0 0'
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 아키텍처 설명 */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '10px',
        maxWidth: '600px',
        fontSize: '0.75rem',
        lineHeight: '1.5'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#00f5ff', fontSize: '0.9rem' }}>
          ✅ Correct DQN Implementation
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <strong style={{ color: '#ff00ff' }}>State (5 features):</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '15px', opacity: 0.8 }}>
              <li>Aggregate height</li>
              <li>Total holes</li>
              <li>Bumpiness</li>
              <li>Complete lines</li>
              <li>Max height</li>
            </ul>
          </div>
          <div>
            <strong style={{ color: '#ff00ff' }}>Action:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '15px', opacity: 0.8 }}>
              <li>All (rotation, x) placements</li>
              <li>Q-value per placement</li>
              <li>Choose best Q</li>
            </ul>
          </div>
        </div>
        <div style={{ marginTop: '10px', opacity: 0.7 }}>
          <strong>Network:</strong> 5 → 64 → 32 → 1 | <strong>Optimizer:</strong> Adam | <strong>Target Update:</strong> Every 500 steps
        </div>
      </div>
    </div>
  );
}
