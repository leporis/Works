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

// 신경망 클래스 (간단한 MLP)
class NeuralNetwork {
  constructor(inputSize, hiddenSize, outputSize) {
    this.weights1 = this.randomMatrix(inputSize, hiddenSize, 0.5);
    this.weights2 = this.randomMatrix(hiddenSize, outputSize, 0.5);
    this.bias1 = new Array(hiddenSize).fill(0);
    this.bias2 = new Array(outputSize).fill(0);
  }

  randomMatrix(rows, cols, scale) {
    return Array(rows).fill().map(() => 
      Array(cols).fill().map(() => (Math.random() - 0.5) * scale)
    );
  }

  relu(x) { return Math.max(0, x); }
  
  forward(input) {
    // 첫 번째 레이어
    const hidden = this.bias1.map((b, j) => {
      let sum = b;
      for (let i = 0; i < input.length; i++) {
        sum += input[i] * this.weights1[i][j];
      }
      return this.relu(sum);
    });

    // 출력 레이어
    const output = this.bias2.map((b, j) => {
      let sum = b;
      for (let i = 0; i < hidden.length; i++) {
        sum += hidden[i] * this.weights2[i][j];
      }
      return sum;
    });

    return output;
  }

  clone() {
    const nn = new NeuralNetwork(
      this.weights1.length,
      this.weights1[0].length,
      this.weights2[0].length
    );
    nn.weights1 = this.weights1.map(row => [...row]);
    nn.weights2 = this.weights2.map(row => [...row]);
    nn.bias1 = [...this.bias1];
    nn.bias2 = [...this.bias2];
    return nn;
  }

  mutate(rate = 0.1, amount = 0.3) {
    const mutateValue = (v) => Math.random() < rate ? v + (Math.random() - 0.5) * amount : v;
    this.weights1 = this.weights1.map(row => row.map(mutateValue));
    this.weights2 = this.weights2.map(row => row.map(mutateValue));
    this.bias1 = this.bias1.map(mutateValue);
    this.bias2 = this.bias2.map(mutateValue);
  }
}

// DQN 에이전트
class DQNAgent {
  constructor() {
    this.stateSize = BOARD_WIDTH * 4 + 7; // 상위 4줄 + 각 열 높이 + 현재 피스
    this.actionSize = 4; // 왼쪽, 오른쪽, 회전, 드롭
    this.network = new NeuralNetwork(this.stateSize, 128, this.actionSize);
    this.targetNetwork = this.network.clone();
    this.epsilon = 1.0;
    this.epsilonMin = 0.01;
    this.epsilonDecay = 0.995;
    this.gamma = 0.99;
    this.memory = [];
    this.maxMemory = 10000;
    this.batchSize = 32;
    this.learningRate = 0.001;
    this.generation = 0;
    this.bestScore = 0;
  }

  getState(board, piece, pieceX, pieceY, pieceType) {
    const state = [];
    
    // 상위 4줄 상태
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        state.push(board[y][x] ? 1 : 0);
      }
    }
    
    // 각 열의 높이 (정규화)
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
    
    // 현재 피스 x 위치
    state.push(pieceX / BOARD_WIDTH);
    
    // 피스 타입 원-핫 인코딩
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
    if (this.memory.length < this.batchSize) return;

    // 간단한 가중치 업데이트 (근사적 경사하강법)
    const batch = [];
    for (let i = 0; i < this.batchSize; i++) {
      batch.push(this.memory[Math.floor(Math.random() * this.memory.length)]);
    }

    batch.forEach(({ state, action, reward, nextState, done }) => {
      let target = reward;
      if (!done) {
        const nextQ = this.targetNetwork.forward(nextState);
        target = reward + this.gamma * Math.max(...nextQ);
      }

      const currentQ = this.network.forward(state);
      const error = target - currentQ[action];

      // 간단한 가중치 조정
      const lr = this.learningRate * error * 0.01;
      for (let i = 0; i < state.length; i++) {
        for (let j = 0; j < this.network.weights1[0].length; j++) {
          this.network.weights1[i][j] += lr * state[i] * (action === j ? 1 : 0);
        }
      }
    });

    if (this.epsilon > this.epsilonMin) {
      this.epsilon *= this.epsilonDecay;
    }
  }

  updateTargetNetwork() {
    this.targetNetwork = this.network.clone();
  }

  evolve(score) {
    this.generation++;
    if (score > this.bestScore) {
      this.bestScore = score;
    } else {
      // 성능이 나빠지면 약간의 변이 적용
      this.network.mutate(0.05, 0.2);
    }
    this.updateTargetNetwork();
  }
}

// 테트리스 게임 로직
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

// 메인 컴포넌트
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
  const [stats, setStats] = useState({ generation: 0, epsilon: 1, bestScore: 0, avgScore: 0 });
  const [speed, setSpeed] = useState(100);
  const [recentScores, setRecentScores] = useState([]);
  
  const gameLoopRef = useRef(null);
  const aiLoopRef = useRef(null);

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
    return piece;
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
    if (!currentPiece || gameOver) return;
    
    let dropY = pieceY;
    while (isValidMove(board, currentPiece.shape, pieceX, dropY + 1)) {
      dropY++;
    }
    setPieceY(dropY);
  }, [currentPiece, pieceX, pieceY, board, gameOver]);

  // 피스 고정
  const lockPiece = useCallback(() => {
    if (!currentPiece) return;

    const newBoard = placePiece(board, currentPiece.shape, currentPiece.color, pieceX, pieceY);
    const { board: clearedBoard, linesCleared } = clearLines(newBoard);
    
    const lineScores = [0, 100, 300, 500, 800];
    const newScore = score + lineScores[linesCleared];
    
    setBoard(clearedBoard);
    setScore(newScore);
    setLines(prev => prev + linesCleared);
    setCurrentPiece(null);

    return { newBoard: clearedBoard, linesCleared, newScore };
  }, [currentPiece, pieceX, pieceY, board, score]);

  // AI 액션 수행
  const performAIAction = useCallback((action) => {
    switch (action) {
      case 0: movePiece(-1, 0); break; // 왼쪽
      case 1: movePiece(1, 0); break;  // 오른쪽
      case 2: movePiece(0, 0, true); break; // 회전
      case 3: hardDrop(); break; // 하드 드롭
    }
  }, [movePiece, hardDrop]);

  // AI 학습 루프
  useEffect(() => {
    if (!isTraining && !isAIPlaying) {
      if (aiLoopRef.current) clearInterval(aiLoopRef.current);
      return;
    }

    let stepCount = 0;
    const maxStepsPerPiece = 50;

    aiLoopRef.current = setInterval(() => {
      if (gameOver) {
        if (isTraining) {
          agent.evolve(score);
          agent.replay();
          setRecentScores(prev => {
            const newScores = [...prev, score].slice(-50);
            return newScores;
          });
          setStats({
            generation: agent.generation,
            epsilon: agent.epsilon,
            bestScore: agent.bestScore,
            avgScore: recentScores.length > 0 
              ? Math.round(recentScores.reduce((a, b) => a + b, 0) / recentScores.length) 
              : 0
          });
        }
        resetGame();
        return;
      }

      if (!currentPiece) {
        const piece = spawnPiece();
        if (!piece) {
          setGameOver(true);
        }
        stepCount = 0;
        return;
      }

      // AI 결정
      const state = agent.getState(board, currentPiece, pieceX, pieceY, currentPiece.type);
      const action = agent.chooseAction(state);
      
      performAIAction(action);
      stepCount++;

      // 자동 하강 또는 피스 고정
      if (stepCount >= maxStepsPerPiece || !movePiece(0, 1)) {
        if (!isValidMove(board, currentPiece.shape, pieceX, pieceY + 1)) {
          const result = lockPiece();
          if (result && isTraining) {
            const reward = result.linesCleared * 10 + 1;
            const nextState = agent.getState(result.newBoard, null, 0, 0, 'I');
            agent.remember(state, action, reward, nextState, false);
          }
        }
      }
    }, speed);

    return () => {
      if (aiLoopRef.current) clearInterval(aiLoopRef.current);
    };
  }, [isTraining, isAIPlaying, gameOver, currentPiece, board, pieceX, pieceY, 
      score, agent, spawnPiece, resetGame, movePiece, lockPiece, performAIAction, speed, recentScores]);

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
      const piece = spawnPiece();
      if (!piece) setGameOver(true);
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
        marginBottom: '20px',
        textShadow: '0 0 30px rgba(0,245,255,0.5)'
      }}>
        🎮 AI TETRIS
        <span style={{ fontSize: '1rem', display: 'block', opacity: 0.7 }}>
          Deep Q-Learning Agent
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

      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
        {/* 게임 보드 */}
        <div style={{
          background: 'rgba(0,0,0,0.6)',
          padding: '15px',
          borderRadius: '12px',
          border: '2px solid rgba(0,245,255,0.3)',
          animation: 'pulse 2s ease-in-out infinite'
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
                    boxShadow: cell ? `0 0 10px ${cell}, inset 0 0 5px rgba(255,255,255,0.3)` : 'none',
                    transition: 'all 0.1s ease'
                  }}
                />
              ))
            )}
          </div>
          
          {gameOver && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(0,0,0,0.9)',
              padding: '30px',
              borderRadius: '15px',
              textAlign: 'center',
              border: '2px solid #ff00ff'
            }}>
              <h2 style={{ color: '#ff00ff', margin: 0 }}>GAME OVER</h2>
              <p style={{ color: '#00f5ff' }}>Score: {score}</p>
            </div>
          )}
        </div>

        {/* 컨트롤 패널 */}
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
          minWidth: '280px'
        }}>
          {/* 점수 표시 */}
          <div style={{
            background: 'rgba(0,245,255,0.1)',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
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
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#ff00ff', fontSize: '0.9rem' }}>
              🤖 AI STATUS
            </h3>
            <div style={{ fontSize: '0.85rem', lineHeight: '1.8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.7 }}>Generation</span>
                <span style={{ color: '#00f5ff' }}>{stats.generation}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.7 }}>Epsilon</span>
                <span style={{ color: '#ffd700' }}>{stats.epsilon.toFixed(3)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.7 }}>Best Score</span>
                <span style={{ color: '#2ecc71' }}>{stats.bestScore}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.7 }}>Avg Score</span>
                <span style={{ color: '#e67e22' }}>{stats.avgScore}</span>
              </div>
            </div>
            
            {/* Epsilon 진행 바 */}
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '5px' }}>
                탐험 → 활용
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
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.85rem', opacity: 0.7 }}>
              AI 속도: {speed}ms
            </label>
            <input
              type="range"
              min="10"
              max="500"
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
              {isTraining ? '⏹ 학습 중지' : '🎓 AI 학습 시작'}
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
              {isAIPlaying ? '⏹ AI 중지' : '🤖 AI 플레이'}
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
              🎮 직접 플레이
            </button>
          </div>

          {/* 조작법 */}
          {!isAIPlaying && !isTraining && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              fontSize: '0.8rem'
            }}>
              <h4 style={{ margin: '0 0 10px 0', opacity: 0.7 }}>조작법</h4>
              <div style={{ lineHeight: '1.6' }}>
                <div>← → : 이동</div>
                <div>↑ : 회전</div>
                <div>↓ : 빠른 하강</div>
                <div>Space : 하드 드롭</div>
              </div>
            </div>
          )}

          {/* 학습 그래프 */}
          {recentScores.length > 0 && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '8px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', opacity: 0.7 }}>
                📈 학습 진행 (최근 50게임)
              </h4>
              <div style={{
                height: '60px',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '2px'
              }}>
                {recentScores.slice(-30).map((s, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${Math.min(100, (s / Math.max(...recentScores, 1)) * 100)}%`,
                      background: `linear-gradient(to top, #00f5ff, #ff00ff)`,
                      borderRadius: '2px 2px 0 0',
                      minHeight: '2px'
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <p style={{
        marginTop: '20px',
        fontSize: '0.85rem',
        opacity: 0.5,
        textAlign: 'center'
      }}>
        DQN (Deep Q-Network) 알고리즘을 사용하여 테트리스를 학습합니다.<br/>
        학습이 진행될수록 AI는 점점 더 좋은 플레이를 합니다.
      </p>
    </div>
  );
}
