import React, { useState, useEffect, useCallback, useRef } from 'react';

// 테트리스 설정
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 24;

// 테트로미노 정의
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
// 신경망 클래스 - 올바른 역전파 구현
// ============================================
class NeuralNetwork {
  constructor(inputSize, hiddenSize, outputSize) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    this.outputSize = outputSize;
    
    // He 초기화
    this.weights1 = this.heInit(inputSize, hiddenSize);
    this.weights2 = this.heInit(hiddenSize, outputSize);
    this.bias1 = new Array(hiddenSize).fill(0);
    this.bias2 = new Array(outputSize).fill(0);
    
    // Adam optimizer 상태
    this.m_w1 = this.zeros(inputSize, hiddenSize);
    this.v_w1 = this.zeros(inputSize, hiddenSize);
    this.m_w2 = this.zeros(hiddenSize, outputSize);
    this.v_w2 = this.zeros(hiddenSize, outputSize);
    this.m_b1 = new Array(hiddenSize).fill(0);
    this.v_b1 = new Array(hiddenSize).fill(0);
    this.m_b2 = new Array(outputSize).fill(0);
    this.v_b2 = new Array(outputSize).fill(0);
    this.t = 0;
  }

  heInit(rows, cols) {
    const std = Math.sqrt(2.0 / rows);
    return Array(rows).fill().map(() => 
      Array(cols).fill().map(() => this.randn() * std)
    );
  }

  zeros(rows, cols) {
    return Array(rows).fill().map(() => Array(cols).fill(0));
  }

  randn() {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  relu(x) { return Math.max(0, x); }
  reluDerivative(x) { return x > 0 ? 1 : 0; }

  forward(input, returnCache = false) {
    // Hidden layer: z1 = input @ W1 + b1, a1 = relu(z1)
    const z1 = this.bias1.map((b, j) => {
      let sum = b;
      for (let i = 0; i < input.length; i++) {
        sum += input[i] * this.weights1[i][j];
      }
      return sum;
    });
    const a1 = z1.map(x => this.relu(x));

    // Output layer: z2 = a1 @ W2 + b2
    const z2 = this.bias2.map((b, j) => {
      let sum = b;
      for (let i = 0; i < a1.length; i++) {
        sum += a1[i] * this.weights2[i][j];
      }
      return sum;
    });

    if (returnCache) {
      return { output: z2, cache: { input, z1, a1, z2 } };
    }
    return z2;
  }

  backward(cache, targetQ, actionIndex, learningRate = 0.001) {
    const { input, z1, a1, z2 } = cache;
    const batchSize = 1;
    
    // Output error: dL/dz2 (only for the action taken)
    const dz2 = new Array(this.outputSize).fill(0);
    dz2[actionIndex] = z2[actionIndex] - targetQ;

    // Gradients for W2, b2
    const dW2 = this.zeros(this.hiddenSize, this.outputSize);
    for (let i = 0; i < this.hiddenSize; i++) {
      for (let j = 0; j < this.outputSize; j++) {
        dW2[i][j] = a1[i] * dz2[j];
      }
    }
    const db2 = [...dz2];

    // Backprop to hidden layer
    const da1 = new Array(this.hiddenSize).fill(0);
    for (let i = 0; i < this.hiddenSize; i++) {
      for (let j = 0; j < this.outputSize; j++) {
        da1[i] += this.weights2[i][j] * dz2[j];
      }
    }

    // Through ReLU
    const dz1 = da1.map((d, i) => d * this.reluDerivative(z1[i]));

    // Gradients for W1, b1
    const dW1 = this.zeros(this.inputSize, this.hiddenSize);
    for (let i = 0; i < this.inputSize; i++) {
      for (let j = 0; j < this.hiddenSize; j++) {
        dW1[i][j] = input[i] * dz1[j];
      }
    }
    const db1 = [...dz1];

    // Adam optimizer update
    this.adamUpdate(dW1, dW2, db1, db2, learningRate);
    
    return Math.abs(dz2[actionIndex]); // Return loss
  }

  adamUpdate(dW1, dW2, db1, db2, lr, beta1 = 0.9, beta2 = 0.999, epsilon = 1e-8) {
    this.t++;
    
    // Update W1
    for (let i = 0; i < this.inputSize; i++) {
      for (let j = 0; j < this.hiddenSize; j++) {
        this.m_w1[i][j] = beta1 * this.m_w1[i][j] + (1 - beta1) * dW1[i][j];
        this.v_w1[i][j] = beta2 * this.v_w1[i][j] + (1 - beta2) * dW1[i][j] * dW1[i][j];
        const mHat = this.m_w1[i][j] / (1 - Math.pow(beta1, this.t));
        const vHat = this.v_w1[i][j] / (1 - Math.pow(beta2, this.t));
        this.weights1[i][j] -= lr * mHat / (Math.sqrt(vHat) + epsilon);
      }
    }

    // Update W2
    for (let i = 0; i < this.hiddenSize; i++) {
      for (let j = 0; j < this.outputSize; j++) {
        this.m_w2[i][j] = beta1 * this.m_w2[i][j] + (1 - beta1) * dW2[i][j];
        this.v_w2[i][j] = beta2 * this.v_w2[i][j] + (1 - beta2) * dW2[i][j] * dW2[i][j];
        const mHat = this.m_w2[i][j] / (1 - Math.pow(beta1, this.t));
        const vHat = this.v_w2[i][j] / (1 - Math.pow(beta2, this.t));
        this.weights2[i][j] -= lr * mHat / (Math.sqrt(vHat) + epsilon);
      }
    }

    // Update biases
    for (let j = 0; j < this.hiddenSize; j++) {
      this.m_b1[j] = beta1 * this.m_b1[j] + (1 - beta1) * db1[j];
      this.v_b1[j] = beta2 * this.v_b1[j] + (1 - beta2) * db1[j] * db1[j];
      const mHat = this.m_b1[j] / (1 - Math.pow(beta1, this.t));
      const vHat = this.v_b1[j] / (1 - Math.pow(beta2, this.t));
      this.bias1[j] -= lr * mHat / (Math.sqrt(vHat) + epsilon);
    }

    for (let j = 0; j < this.outputSize; j++) {
      this.m_b2[j] = beta1 * this.m_b2[j] + (1 - beta1) * db2[j];
      this.v_b2[j] = beta2 * this.v_b2[j] + (1 - beta2) * db2[j] * db2[j];
      const mHat = this.m_b2[j] / (1 - Math.pow(beta1, this.t));
      const vHat = this.v_b2[j] / (1 - Math.pow(beta2, this.t));
      this.bias2[j] -= lr * mHat / (Math.sqrt(vHat) + epsilon);
    }
  }

  clone() {
    const nn = new NeuralNetwork(this.inputSize, this.hiddenSize, this.outputSize);
    nn.weights1 = this.weights1.map(row => [...row]);
    nn.weights2 = this.weights2.map(row => [...row]);
    nn.bias1 = [...this.bias1];
    nn.bias2 = [...this.bias2];
    return nn;
  }
}

// ============================================
// DQN 에이전트 - 수정된 버전
// ============================================
class DQNAgent {
  constructor() {
    // 수정된 상태 크기 계산:
    // - 상위 4줄: BOARD_WIDTH * 4 = 40
    // - 각 열 높이: BOARD_WIDTH = 10  
    // - 구멍 수: BOARD_WIDTH = 10
    // - 피스 X 위치: 1
    // - 피스 타입 원핫: 7
    // 총: 40 + 10 + 10 + 1 + 7 = 68
    this.stateSize = BOARD_WIDTH * 4 + BOARD_WIDTH + BOARD_WIDTH + 1 + 7;
    this.actionSize = 4;
    
    this.network = new NeuralNetwork(this.stateSize, 128, this.actionSize);
    this.targetNetwork = this.network.clone();
    
    this.epsilon = 1.0;
    this.epsilonMin = 0.05;
    this.epsilonDecay = 0.9995;
    this.gamma = 0.95;
    this.learningRate = 0.0005;
    
    this.memory = [];
    this.maxMemory = 50000;
    this.batchSize = 64;
    
    this.updateTargetEvery = 1000;
    this.stepCount = 0;
    
    this.totalLoss = 0;
    this.lossCount = 0;
  }

  getState(board, pieceX, pieceType) {
    const state = [];
    
    // 1. 상위 4줄 상태 (40개)
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        state.push(board[y][x] ? 1 : 0);
      }
    }
    
    // 2. 각 열의 높이 - 정규화 (10개)
    for (let x = 0; x < BOARD_WIDTH; x++) {
      let height = 0;
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        if (board[y][x]) {
          height = BOARD_HEIGHT - y;
          break;
        }
      }
      state.push(height / BOARD_HEIGHT);
    }
    
    // 3. 각 열의 구멍 수 - 정규화 (10개)
    for (let x = 0; x < BOARD_WIDTH; x++) {
      let holes = 0;
      let foundBlock = false;
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        if (board[y][x]) {
          foundBlock = true;
        } else if (foundBlock) {
          holes++;
        }
      }
      state.push(holes / 10);
    }
    
    // 4. 현재 피스 X 위치 - 정규화 (1개)
    state.push(pieceX / BOARD_WIDTH);
    
    // 5. 피스 타입 원-핫 인코딩 (7개)
    const pieceTypes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    pieceTypes.forEach(type => {
      state.push(type === pieceType ? 1 : 0);
    });
    
    return state;
  }

  chooseAction(state) {
    if (Math.random() < this.epsilon) {
      return Math.floor(Math.random() * this.actionSize);
    }
    const qValues = this.network.forward(state);
    return qValues.indexOf(Math.max(...qValues));
  }

  remember(state, action, reward, nextState, done) {
    this.memory.push({ state, action, reward, nextState, done });
    if (this.memory.length > this.maxMemory) {
      this.memory.shift();
    }
  }

  replay() {
    if (this.memory.length < this.batchSize) return 0;

    // 미니배치 샘플링
    const batch = [];
    for (let i = 0; i < this.batchSize; i++) {
      const idx = Math.floor(Math.random() * this.memory.length);
      batch.push(this.memory[idx]);
    }

    let totalLoss = 0;

    batch.forEach(({ state, action, reward, nextState, done }) => {
      // Target Q 계산
      let targetQ = reward;
      if (!done) {
        const nextQValues = this.targetNetwork.forward(nextState);
        targetQ = reward + this.gamma * Math.max(...nextQValues);
      }

      // Forward pass with cache
      const { output, cache } = this.network.forward(state, true);
      
      // Backward pass - 올바른 역전파
      const loss = this.network.backward(cache, targetQ, action, this.learningRate);
      totalLoss += loss;
    });

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

  getAvgLoss() {
    if (this.lossCount === 0) return 0;
    return this.totalLoss / this.lossCount;
  }
}

// ============================================
// 테트리스 게임 로직
// ============================================
const createEmptyBoard = () => 
  Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(null));

const getRandomPiece = () => {
  const types = Object.keys(TETROMINOES);
  return types[Math.floor(Math.random() * types.length)];
};

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

const isValidMove = (board, shape, x, y) => {
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
  const newBoard = board.map(row => [...row]);
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

// 보드 평가 함수 (보상 계산용)
const evaluateBoard = (board) => {
  let totalHeight = 0;
  let holes = 0;
  let bumpiness = 0;
  const heights = [];

  for (let x = 0; x < BOARD_WIDTH; x++) {
    let colHeight = 0;
    let foundBlock = false;
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      if (board[y][x]) {
        if (!foundBlock) {
          colHeight = BOARD_HEIGHT - y;
          foundBlock = true;
        }
      } else if (foundBlock) {
        holes++;
      }
    }
    heights.push(colHeight);
    totalHeight += colHeight;
  }

  for (let i = 0; i < heights.length - 1; i++) {
    bumpiness += Math.abs(heights[i] - heights[i + 1]);
  }

  return { totalHeight, holes, bumpiness };
};

// ============================================
// 메인 컴포넌트
// ============================================
export default function TetrisRL() {
  const [board, setBoard] = useState(createEmptyBoard);
  const [currentPiece, setCurrentPiece] = useState(null);
  const [pieceX, setPieceX] = useState(0);
  const [pieceY, setPieceY] = useState(0);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isAIPlaying, setIsAIPlaying] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [agent] = useState(() => new DQNAgent());
  const [stats, setStats] = useState({ 
    generation: 0, 
    epsilon: 1, 
    bestScore: 0, 
    avgScore: 0,
    avgLoss: 0,
    memorySize: 0 
  });
  const [speed, setSpeed] = useState(50);
  const [recentScores, setRecentScores] = useState([]);
  const [lossHistory, setLossHistory] = useState([]);
  
  const gameLoopRef = useRef(null);
  const aiLoopRef = useRef(null);
  const generationRef = useRef(0);
  const bestScoreRef = useRef(0);
  const lastStateRef = useRef(null);
  const lastActionRef = useRef(null);

  // 새 피스 생성
  const spawnPiece = useCallback(() => {
    const type = getRandomPiece();
    const piece = { type, shape: TETROMINOES[type].shape, color: TETROMINOES[type].color };
    const startX = Math.floor((BOARD_WIDTH - piece.shape[0].length) / 2);
    
    if (!isValidMove(board, piece.shape, startX, 0)) {
      return null;
    }
    
    setCurrentPiece(piece);
    setPieceX(startX);
    setPieceY(0);
    return { piece, startX };
  }, [board]);

  // 게임 리셋
  const resetGame = useCallback(() => {
    const newBoard = createEmptyBoard();
    setBoard(newBoard);
    setScore(0);
    setLines(0);
    setGameOver(false);
    setCurrentPiece(null);
    setPieceX(0);
    setPieceY(0);
    lastStateRef.current = null;
    lastActionRef.current = null;
  }, []);

  // 피스 이동
  const movePiece = useCallback((dx, dy, rotate = false) => {
    if (!currentPiece || gameOver) return false;

    let newShape = currentPiece.shape;
    if (rotate) {
      newShape = rotatePiece(currentPiece.shape);
    }

    const newX = pieceX + dx;
    const newY = pieceY + dy;

    if (isValidMove(board, newShape, newX, newY)) {
      if (rotate) {
        setCurrentPiece({ ...currentPiece, shape: newShape });
      }
      setPieceX(newX);
      setPieceY(newY);
      return true;
    }
    return false;
  }, [currentPiece, pieceX, pieceY, board, gameOver]);

  // 하드 드롭
  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver) return 0;
    
    let dropY = pieceY;
    while (isValidMove(board, currentPiece.shape, pieceX, dropY + 1)) {
      dropY++;
    }
    setPieceY(dropY);
    return dropY - pieceY;
  }, [currentPiece, pieceX, pieceY, board, gameOver]);

  // 피스 고정
  const lockPiece = useCallback(() => {
    if (!currentPiece) return null;

    const beforeEval = evaluateBoard(board);
    const newBoard = placePiece(board, currentPiece.shape, currentPiece.color, pieceX, pieceY);
    const { board: clearedBoard, linesCleared } = clearLines(newBoard);
    const afterEval = evaluateBoard(clearedBoard);
    
    const lineScores = [0, 100, 300, 500, 800];
    const newScore = score + lineScores[linesCleared];
    
    setBoard(clearedBoard);
    setScore(newScore);
    setLines(prev => prev + linesCleared);
    setCurrentPiece(null);

    // 보상 계산 (개선된 버전)
    let reward = 0;
    reward += linesCleared * linesCleared * 10; // 줄 클리어 보상 (제곱으로 연속 클리어 장려)
    reward -= (afterEval.holes - beforeEval.holes) * 3; // 새 구멍 페널티
    reward -= (afterEval.totalHeight - beforeEval.totalHeight) * 0.5; // 높이 증가 페널티
    reward -= afterEval.bumpiness * 0.1; // 울퉁불퉁함 페널티
    reward += 1; // 생존 보너스

    return { 
      newBoard: clearedBoard, 
      linesCleared, 
      newScore, 
      reward,
      gameOver: false 
    };
  }, [currentPiece, pieceX, pieceY, board, score]);

  // AI 액션 수행
  const performAIAction = useCallback((action) => {
    switch (action) {
      case 0: return movePiece(-1, 0); // 왼쪽
      case 1: return movePiece(1, 0);  // 오른쪽
      case 2: return movePiece(0, 0, true); // 회전
      case 3: hardDrop(); return true; // 하드 드롭
      default: return false;
    }
  }, [movePiece, hardDrop]);

  // AI 학습/플레이 루프
  useEffect(() => {
    if (!isTraining && !isAIPlaying) {
      if (aiLoopRef.current) clearInterval(aiLoopRef.current);
      return;
    }

    let stepCount = 0;
    const maxStepsPerPiece = 30;

    aiLoopRef.current = setInterval(() => {
      if (gameOver) {
        // 게임 오버시 마지막 경험 저장 (음수 보상)
        if (isTraining && lastStateRef.current !== null) {
          const terminalState = agent.getState(board, pieceX, currentPiece?.type || 'I');
          agent.remember(lastStateRef.current, lastActionRef.current, -10, terminalState, true);
        }

        generationRef.current++;
        if (score > bestScoreRef.current) {
          bestScoreRef.current = score;
        }

        // 학습 수행
        if (isTraining && agent.memory.length >= agent.batchSize) {
          const loss = agent.replay();
          setLossHistory(prev => [...prev.slice(-100), loss]);
        }

        setRecentScores(prev => {
          const newScores = [...prev, score].slice(-100);
          return newScores;
        });

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
          memorySize: agent.memory.length
        });

        resetGame();
        return;
      }

      if (!currentPiece) {
        const result = spawnPiece();
        if (!result) {
          setGameOver(true);
        }
        stepCount = 0;
        return;
      }

      // 현재 상태
      const state = agent.getState(board, pieceX, currentPiece.type);
      
      // 액션 선택
      const action = agent.chooseAction(state);
      
      // 이전 경험 저장 (이전 스텝이 있을 경우)
      if (isTraining && lastStateRef.current !== null) {
        // 작은 스텝 보상
        agent.remember(lastStateRef.current, lastActionRef.current, 0.1, state, false);
      }

      // 액션 수행
      performAIAction(action);
      stepCount++;

      // 현재 상태/액션 저장
      lastStateRef.current = state;
      lastActionRef.current = action;

      // 자동 하강 또는 피스 고정
      if (action === 3 || stepCount >= maxStepsPerPiece || !isValidMove(board, currentPiece.shape, pieceX, pieceY + 1)) {
        if (!isValidMove(board, currentPiece.shape, pieceX, pieceY + 1)) {
          const result = lockPiece();
          if (result && isTraining) {
            const nextState = agent.getState(result.newBoard, 0, 'I');
            agent.remember(state, action, result.reward, nextState, false);
            lastStateRef.current = null;
            lastActionRef.current = null;
          }
          stepCount = 0;
        }
      } else {
        // 중력 (가끔 한 칸 내려감)
        if (stepCount % 3 === 0) {
          movePiece(0, 1);
        }
      }
    }, speed);

    return () => {
      if (aiLoopRef.current) clearInterval(aiLoopRef.current);
    };
  }, [isTraining, isAIPlaying, gameOver, currentPiece, board, pieceX, pieceY, 
      score, agent, spawnPiece, resetGame, movePiece, lockPiece, performAIAction, 
      speed, recentScores, lossHistory]);

  // 키보드 입력 (수동 플레이)
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
        case ' ': hardDrop(); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePiece, hardDrop, gameOver, resetGame, isAIPlaying, isTraining]);

  // 수동 플레이 게임 루프
  useEffect(() => {
    if (isAIPlaying || isTraining || gameOver) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      return;
    }

    if (!currentPiece) {
      const result = spawnPiece();
      if (!result) setGameOver(true);
    }

    gameLoopRef.current = setInterval(() => {
      if (!movePiece(0, 1)) {
        lockPiece();
      }
    }, 500);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [currentPiece, movePiece, lockPiece, spawnPiece, gameOver, isAIPlaying, isTraining]);

  // 렌더링할 보드 생성
  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    
    if (currentPiece) {
      // 고스트 피스 (착지 위치 미리보기)
      let ghostY = pieceY;
      while (isValidMove(board, currentPiece.shape, pieceX, ghostY + 1)) {
        ghostY++;
      }
      
      // 고스트 그리기
      for (let py = 0; py < currentPiece.shape.length; py++) {
        for (let px = 0; px < currentPiece.shape[py].length; px++) {
          if (currentPiece.shape[py][px]) {
            const y = ghostY + py;
            const x = pieceX + px;
            if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH && !displayBoard[y][x]) {
              displayBoard[y][x] = currentPiece.color + '40'; // 반투명
            }
          }
        }
      }
      
      // 실제 피스 그리기
      for (let py = 0; py < currentPiece.shape.length; py++) {
        for (let px = 0; px < currentPiece.shape[py].length; px++) {
          if (currentPiece.shape[py][px]) {
            const y = pieceY + py;
            const x = pieceX + px;
            if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
              displayBoard[y][x] = currentPiece.color;
            }
          }
        }
      }
    }
    
    return displayBoard;
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
        fontSize: '2.5rem',
        fontWeight: 800,
        background: 'linear-gradient(90deg, #00f5ff, #ff00ff, #00f5ff)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'gradient 3s ease infinite',
        marginBottom: '10px',
        textShadow: '0 0 30px rgba(0,245,255,0.5)'
      }}>
        🎮 AI TETRIS
        <span style={{ fontSize: '1rem', display: 'block', opacity: 0.7 }}>
          Deep Q-Network with Adam Optimizer
        </span>
      </h1>

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

      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* 게임 보드 */}
        <div style={{
          background: 'rgba(0,0,0,0.6)',
          padding: '15px',
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
                      ? `0 0 10px ${cell}, inset 0 0 5px rgba(255,255,255,0.3)` 
                      : 'none',
                    transition: 'all 0.05s ease',
                    border: cell && cell.endsWith('40') ? '1px dashed rgba(255,255,255,0.3)' : 'none'
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
              padding: '30px',
              borderRadius: '15px',
              textAlign: 'center',
              border: '2px solid #ff00ff',
              zIndex: 10
            }}>
              <h2 style={{ color: '#ff00ff', margin: 0 }}>GAME OVER</h2>
              <p style={{ color: '#00f5ff' }}>Score: {score}</p>
              <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Press Enter to restart</p>
            </div>
          )}
        </div>

        {/* 컨트롤 패널 */}
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
          minWidth: '300px'
        }}>
          {/* 점수 표시 */}
          <div style={{
            background: 'rgba(0,245,255,0.1)',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ opacity: 0.7 }}>SCORE</span>
              <span style={{ color: '#00f5ff', fontWeight: 'bold', fontSize: '1.5rem' }}>{score}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.7 }}>LINES</span>
              <span style={{ color: '#ff00ff', fontWeight: 'bold' }}>{lines}</span>
            </div>
          </div>

          {/* AI 상태 */}
          <div style={{
            background: 'rgba(255,0,255,0.1)',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#ff00ff', fontSize: '0.9rem' }}>
              🤖 DQN STATUS
            </h3>
            <div style={{ fontSize: '0.8rem', lineHeight: '1.8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.7 }}>Generation</span>
                <span style={{ color: '#00f5ff' }}>{stats.generation}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.7 }}>Epsilon (ε)</span>
                <span style={{ color: '#ffd700' }}>{stats.epsilon.toFixed(4)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.7 }}>Best Score</span>
                <span style={{ color: '#2ecc71' }}>{stats.bestScore}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.7 }}>Avg Score (100)</span>
                <span style={{ color: '#e67e22' }}>{stats.avgScore}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.7 }}>Avg Loss</span>
                <span style={{ color: '#e74c3c' }}>{stats.avgLoss}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.7 }}>Memory</span>
                <span style={{ color: '#9b59b6' }}>{stats.memorySize.toLocaleString()}</span>
              </div>
            </div>
            
            {/* Epsilon 진행 바 */}
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '5px' }}>
                Exploration → Exploitation
              </div>
              <div style={{
                height: '6px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(1 - stats.epsilon) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #ff00ff, #00f5ff)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>

          {/* 속도 조절 */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '0.85rem', opacity: 0.7 }}>
              Speed: {speed}ms (lower = faster)
            </label>
            <input
              type="range"
              min="5"
              max="200"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              style={{
                width: '100%',
                marginTop: '8px',
                accentColor: '#00f5ff'
              }}
            />
          </div>

          {/* 버튼들 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => {
                setIsTraining(!isTraining);
                setIsAIPlaying(false);
                if (!isTraining) resetGame();
              }}
              style={{
                padding: '12px',
                background: isTraining 
                  ? 'linear-gradient(135deg, #e74c3c, #c0392b)' 
                  : 'linear-gradient(135deg, #2ecc71, #27ae60)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'transform 0.1s ease'
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
                padding: '12px',
                background: isAIPlaying 
                  ? 'linear-gradient(135deg, #e74c3c, #c0392b)' 
                  : 'linear-gradient(135deg, #3498db, #2980b9)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              {isAIPlaying ? '⏹ Stop AI' : '🤖 AI Play (no learning)'}
            </button>

            <button
              onClick={() => {
                setIsTraining(false);
                setIsAIPlaying(false);
                resetGame();
              }}
              style={{
                padding: '12px',
                background: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              🎮 Manual Play
            </button>
          </div>

          {/* 조작법 */}
          {!isAIPlaying && !isTraining && (
            <div style={{
              marginTop: '15px',
              padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              fontSize: '0.75rem'
            }}>
              <h4 style={{ margin: '0 0 8px 0', opacity: 0.7 }}>Controls</h4>
              <div style={{ lineHeight: '1.5', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                <div>← → Move</div>
                <div>↑ Rotate</div>
                <div>↓ Soft drop</div>
                <div>Space Hard drop</div>
              </div>
            </div>
          )}

          {/* 학습 그래프 */}
          {recentScores.length > 5 && (
            <div style={{
              marginTop: '15px',
              padding: '12px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '8px'
            }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', opacity: 0.7 }}>
                📈 Score History
              </h4>
              <div style={{
                height: '50px',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '1px'
              }}>
                {recentScores.slice(-40).map((s, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${Math.max(5, (s / Math.max(...recentScores, 1)) * 100)}%`,
                      background: `linear-gradient(to top, #00f5ff, #ff00ff)`,
                      borderRadius: '1px 1px 0 0',
                      minHeight: '2px'
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Loss 그래프 */}
          {lossHistory.length > 5 && (
            <div style={{
              marginTop: '10px',
              padding: '12px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '8px'
            }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', opacity: 0.7 }}>
                📉 Loss History
              </h4>
              <div style={{
                height: '40px',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '1px'
              }}>
                {lossHistory.slice(-40).map((l, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${Math.max(5, Math.min(100, (l / Math.max(...lossHistory.slice(-40), 0.001)) * 100))}%`,
                      background: `linear-gradient(to top, #e74c3c, #f39c12)`,
                      borderRadius: '1px 1px 0 0',
                      minHeight: '2px'
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 설명 */}
      <div style={{
        marginTop: '20px',
        padding: '15px 20px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '10px',
        maxWidth: '600px',
        fontSize: '0.8rem',
        lineHeight: '1.6'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#00f5ff' }}>🧠 DQN Architecture</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', opacity: 0.8 }}>
          <li><strong>State:</strong> Top 4 rows (40) + Column heights (10) + Holes per column (10) + Piece X (1) + Piece type one-hot (7) = 68 features</li>
          <li><strong>Network:</strong> 68 → 128 (ReLU) → 4 actions</li>
          <li><strong>Optimizer:</strong> Adam (β₁=0.9, β₂=0.999)</li>
          <li><strong>Reward:</strong> Lines² × 10 - Holes × 3 - Height × 0.5 - Bumpiness × 0.1 + 1 (survival)</li>
          <li><strong>Target Network:</strong> Updated every 1000 steps</li>
        </ul>
      </div>
    </div>
  );
}
