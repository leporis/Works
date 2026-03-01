import React, { useState, useEffect, useCallback } from 'react';

const features = [
  { name: '귀 모양', cat: 0.8, dog: 0.3, icon: '👂', desc: '뾰족함' },
  { name: '코 크기', cat: 0.2, dog: 0.7, icon: '👃', desc: '크기' },
  { name: '꼬리 길이', cat: 0.7, dog: 0.4, icon: '🐾', desc: '길이' },
  { name: '얼굴 형태', cat: 0.75, dog: 0.35, icon: '😺', desc: '둥근정도' },
  { name: '털 무늬', cat: 0.6, dog: 0.5, icon: '🧶', desc: '줄무늬' },
];

const generateAnimal = () => {
  const isCat = Math.random() > 0.5;
  const featureValues = features.map(f => {
    const base = isCat ? f.cat : f.dog;
    return Math.max(0, Math.min(1, base + (Math.random() - 0.5) * 0.4));
  });
  const colors = isCat 
    ? ['#F5A623', '#8B4513', '#D4D4D4', '#FF6B35', '#2C2C2C']
    : ['#C4A574', '#8B6914', '#FFFFFF', '#A0522D', '#4A4A4A'];
  const colorIndex = Math.floor(Math.random() * colors.length);
  return { 
    isCat, 
    features: featureValues, 
    id: Math.random(),
    color: colors[colorIndex],
    eyeColor: ['#4A90D9', '#2ECC71', '#F39C12', '#8E44AD', '#1ABC9C'][Math.floor(Math.random() * 5)]
  };
};

const sigmoid = (x) => 1 / (1 + Math.exp(-x));

// 동물 캐릭터 SVG 컴포넌트
const AnimalAvatar = ({ animal, size = 100 }) => {
  const [earShape, noseSize, tailLength, faceRound, furPattern] = animal.features;
  const { color, eyeColor, isCat } = animal;
  
  const s = size / 100; // scale factor
  
  // 얼굴 형태 (둥근 정도)
  const faceWidth = 35 + faceRound * 10;
  const faceHeight = 30 + (1 - faceRound) * 15;
  
  // 코 크기
  const noseW = 4 + noseSize * 8;
  const noseH = 3 + noseSize * 6;
  
  // 귀 모양 (뾰족함)
  const earPointy = earShape;
  
  // 털 색상 변형
  const darkerColor = color.replace(/^#/, '');
  const r = Math.max(0, parseInt(darkerColor.substr(0, 2), 16) - 40);
  const g = Math.max(0, parseInt(darkerColor.substr(2, 2), 16) - 40);
  const b = Math.max(0, parseInt(darkerColor.substr(4, 2), 16) - 40);
  const shadowColor = `rgb(${r},${g},${b})`;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <radialGradient id={`fur-${animal.id}`} cx="30%" cy="30%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={shadowColor} />
        </radialGradient>
        <filter id={`shadow-${animal.id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      
      {/* 몸통 */}
      <ellipse 
        cx="50" cy="75" 
        rx={25 * s} ry={20 * s}
        fill={`url(#fur-${animal.id})`}
      />
      
      {/* 꼬리 */}
      <path
        d={isCat 
          ? `M 75 70 Q ${85 + tailLength * 15} ${50 - tailLength * 20} ${80 + tailLength * 10} ${30 - tailLength * 10}`
          : `M 75 70 Q ${80 + tailLength * 10} ${65} ${85 + tailLength * 8} ${55 + (1-tailLength) * 10}`
        }
        fill="none"
        stroke={color}
        strokeWidth={isCat ? 6 : 8}
        strokeLinecap="round"
      />
      
      {/* 얼굴 */}
      <ellipse 
        cx="50" cy="45" 
        rx={faceWidth * s} ry={faceHeight * s}
        fill={`url(#fur-${animal.id})`}
        filter={`url(#shadow-${animal.id})`}
      />
      
      {/* 귀 - 왼쪽 */}
      {earPointy > 0.5 ? (
        // 뾰족한 귀 (고양이 스타일)
        <path
          d={`M ${25 - earPointy * 5} ${35 - earPointy * 25} 
              L ${35} ${40} 
              L ${20} ${45}
              Z`}
          fill={color}
        />
      ) : (
        // 늘어진 귀 (강아지 스타일)
        <ellipse
          cx={22 - (1-earPointy) * 5}
          cy={50 + (1-earPointy) * 15}
          rx={10}
          ry={15 + (1-earPointy) * 10}
          fill={color}
          transform={`rotate(-20, ${22 - (1-earPointy) * 5}, ${50 + (1-earPointy) * 15})`}
        />
      )}
      
      {/* 귀 - 오른쪽 */}
      {earPointy > 0.5 ? (
        <path
          d={`M ${75 + earPointy * 5} ${35 - earPointy * 25} 
              L ${65} ${40} 
              L ${80} ${45}
              Z`}
          fill={color}
        />
      ) : (
        <ellipse
          cx={78 + (1-earPointy) * 5}
          cy={50 + (1-earPointy) * 15}
          rx={10}
          ry={15 + (1-earPointy) * 10}
          fill={color}
          transform={`rotate(20, ${78 + (1-earPointy) * 5}, ${50 + (1-earPointy) * 15})`}
        />
      )}
      
      {/* 귀 안쪽 */}
      {earPointy > 0.5 && (
        <>
          <path
            d={`M ${28 - earPointy * 3} ${37 - earPointy * 18} 
                L ${33} ${42} 
                L ${24} ${44}
                Z`}
            fill="#FFB6C1"
          />
          <path
            d={`M ${72 + earPointy * 3} ${37 - earPointy * 18} 
                L ${67} ${42} 
                L ${76} ${44}
                Z`}
            fill="#FFB6C1"
          />
        </>
      )}
      
      {/* 털 무늬 */}
      {furPattern > 0.5 && (
        <>
          <ellipse cx="40" cy="40" rx={5 * furPattern} ry={8 * furPattern} fill={shadowColor} opacity="0.5" />
          <ellipse cx="60" cy="42" rx={4 * furPattern} ry={6 * furPattern} fill={shadowColor} opacity="0.5" />
          <ellipse cx="50" cy="35" rx={3 * furPattern} ry={4 * furPattern} fill={shadowColor} opacity="0.5" />
        </>
      )}
      
      {/* 눈 */}
      <ellipse cx="38" cy="42" rx="6" ry={isCat ? "7" : "6"} fill="white" />
      <ellipse cx="62" cy="42" rx="6" ry={isCat ? "7" : "6"} fill="white" />
      <circle cx="38" cy="43" r={isCat ? "4" : "4"} fill={eyeColor} />
      <circle cx="62" cy="43" r={isCat ? "4" : "4"} fill={eyeColor} />
      <circle cx="36" cy="41" r="2" fill="white" />
      <circle cx="60" cy="41" r="2" fill="white" />
      
      {/* 고양이 눈 - 세로 동공 */}
      {isCat && earPointy > 0.5 && (
        <>
          <ellipse cx="38" cy="43" rx="1.5" ry="3" fill="#111" />
          <ellipse cx="62" cy="43" rx="1.5" ry="3" fill="#111" />
        </>
      )}
      
      {/* 코 */}
      <ellipse 
        cx="50" cy="52" 
        rx={noseW / 2} ry={noseH / 2}
        fill={isCat ? "#FFB6C1" : "#333"}
      />
      
      {/* 입 */}
      <path
        d={`M 50 ${54 + noseH/2} Q 45 ${58 + noseH/3} 42 ${56 + noseH/3}`}
        fill="none"
        stroke="#333"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d={`M 50 ${54 + noseH/2} Q 55 ${58 + noseH/3} 58 ${56 + noseH/3}`}
        fill="none"
        stroke="#333"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      
      {/* 수염 (고양이) */}
      {isCat && earPointy > 0.4 && (
        <>
          <line x1="25" y1="50" x2="38" y2="52" stroke="#333" strokeWidth="1" />
          <line x1="25" y1="54" x2="38" y2="54" stroke="#333" strokeWidth="1" />
          <line x1="25" y1="58" x2="38" y2="56" stroke="#333" strokeWidth="1" />
          <line x1="75" y1="50" x2="62" y2="52" stroke="#333" strokeWidth="1" />
          <line x1="75" y1="54" x2="62" y2="54" stroke="#333" strokeWidth="1" />
          <line x1="75" y1="58" x2="62" y2="56" stroke="#333" strokeWidth="1" />
        </>
      )}
      
      {/* 혀 (강아지) */}
      {!isCat && noseSize > 0.5 && (
        <ellipse cx="50" cy="62" rx="4" ry="6" fill="#FF6B6B" />
      )}
    </svg>
  );
};

// 미니 아바타 (학습 데이터용)
const MiniAvatar = ({ animal, size = 50, showResult, correct }) => {
  return (
    <div className={`relative rounded-lg p-1 transition-all hover:scale-110 ${
      showResult ? (correct ? 'bg-green-500/30' : 'bg-red-500/30') : 'bg-white/10'
    }`}>
      <AnimalAvatar animal={animal} size={size} />
      {showResult && (
        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center ${
          correct ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {correct ? '✓' : '✗'}
        </div>
      )}
    </div>
  );
};

export default function MLSimulator() {
  const [weights, setWeights] = useState(features.map(() => (Math.random() - 0.5) * 0.5));
  const [bias, setBias] = useState(0);
  const [trainingData, setTrainingData] = useState([]);
  const [testAnimal, setTestAnimal] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [history, setHistory] = useState([]);
  const [learningRate, setLearningRate] = useState(0.5);
  const [dataCount, setDataCount] = useState(20);

  const predict = useCallback((animalFeatures) => {
    const z = animalFeatures.reduce((sum, f, i) => sum + f * weights[i], bias);
    return sigmoid(z);
  }, [weights, bias]);

  const calculateAccuracy = useCallback((data) => {
    if (data.length === 0) return 0;
    const correct = data.filter(animal => {
      const pred = predict(animal.features);
      const predictedCat = pred > 0.5;
      return predictedCat === animal.isCat;
    }).length;
    return (correct / data.length) * 100;
  }, [predict]);

  useEffect(() => {
    const initialData = Array(dataCount).fill(null).map(() => generateAnimal());
    setTrainingData(initialData);
    setTestAnimal(generateAnimal());
  }, []);

  useEffect(() => {
    if (trainingData.length > 0) {
      setAccuracy(calculateAccuracy(trainingData));
    }
  }, [weights, bias, trainingData, calculateAccuracy]);

  const trainStep = useCallback(() => {
    let newWeights = [...weights];
    let newBias = bias;

    trainingData.forEach(animal => {
      const pred = predict(animal.features);
      const target = animal.isCat ? 1 : 0;
      const error = target - pred;

      animal.features.forEach((f, i) => {
        newWeights[i] += learningRate * error * f * pred * (1 - pred);
      });
      newBias += learningRate * error * pred * (1 - pred);
    });

    setWeights(newWeights);
    setBias(newBias);
    setEpoch(e => e + 1);
    setHistory(h => [...h, calculateAccuracy(trainingData)].slice(-50));
  }, [weights, bias, trainingData, learningRate, predict, calculateAccuracy]);

  useEffect(() => {
    let interval;
    if (isTraining) {
      interval = setInterval(trainStep, 200);
    }
    return () => clearInterval(interval);
  }, [isTraining, trainStep]);

  const resetModel = () => {
    setWeights(features.map(() => (Math.random() - 0.5) * 0.5));
    setBias(0);
    setEpoch(0);
    setHistory([]);
    setIsTraining(false);
  };

  const regenerateData = (count) => {
    setTrainingData(Array(count).fill(null).map(() => generateAnimal()));
    setDataCount(count);
  };

  const prediction = testAnimal ? predict(testAnimal.features) : 0.5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4 text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">🐱 고양이 vs 강아지 🐶</h1>
        <p className="text-center text-purple-200 mb-6">머신러닝 분류기 시뮬레이터 - 자동 이미지 생성</p>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {/* 모델 상태 */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              🧠 신경망 모델
              <span className="text-xs bg-purple-500 px-2 py-1 rounded-full">
                Epoch: {epoch}
              </span>
            </h2>
            
            <div className="space-y-2 mb-4">
              {features.map((f, i) => (
                <div key={f.name} className="flex items-center gap-2">
                  <span className="w-6">{f.icon}</span>
                  <span className="w-20 text-sm">{f.name}</span>
                  <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        weights[i] > 0 ? 'bg-green-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.abs(weights[i]) * 100)}%` }}
                    />
                  </div>
                  <span className="w-16 text-xs text-right font-mono">
                    {weights[i].toFixed(3)}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2 border-t border-white/20">
                <span className="w-6">⚖️</span>
                <span className="w-20 text-sm">편향(Bias)</span>
                <div className="flex-1" />
                <span className="w-16 text-xs text-right font-mono">
                  {bias.toFixed(3)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setIsTraining(!isTraining)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  isTraining 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {isTraining ? '⏸ 학습 중지' : '▶️ 학습 시작'}
              </button>
              <button
                onClick={trainStep}
                disabled={isTraining}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition disabled:opacity-50"
              >
                ⏭ 1 스텝
              </button>
              <button
                onClick={resetModel}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded-lg font-medium transition"
              >
                🔄 초기화
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm">학습률:</span>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={learningRate}
                onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-mono w-8">{learningRate}</span>
            </div>
          </div>

          {/* 정확도 & 그래프 */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-3">📊 학습 현황</h2>
            
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64" cy="64" r="56"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="12"
                  />
                  <circle
                    cx="64" cy="64" r="56"
                    fill="none"
                    stroke={accuracy > 80 ? '#22c55e' : accuracy > 60 ? '#eab308' : '#ef4444'}
                    strokeWidth="12"
                    strokeDasharray={`${accuracy * 3.52} 352`}
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold">{accuracy.toFixed(1)}%</span>
                  <span className="text-xs text-purple-200">정확도</span>
                </div>
              </div>
            </div>

            <div className="h-24 flex items-end gap-0.5 bg-black/20 rounded-lg p-2">
              {history.map((acc, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-purple-500 to-pink-400 rounded-t transition-all duration-200"
                  style={{ height: `${acc}%` }}
                />
              ))}
              {history.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-sm text-purple-300">
                  학습을 시작하면 그래프가 표시됩니다
                </div>
              )}
            </div>
            <p className="text-xs text-center mt-2 text-purple-200">정확도 변화 (최근 50 에포크)</p>
          </div>
        </div>

        {/* 테스트 영역 */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">🔍 예측 테스트</h2>
          
          {testAnimal && (
            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* 동물 이미지 */}
              <div className="flex flex-col items-center">
                <div className="bg-white/10 rounded-2xl p-4">
                  <AnimalAvatar animal={testAnimal} size={150} />
                </div>
                <div className="mt-2 text-sm text-purple-200">
                  실제: {testAnimal.isCat ? '🐱 고양이' : '🐶 강아지'}
                </div>
              </div>
              
              {/* 특성 바 */}
              <div className="flex-1">
                <div className="grid grid-cols-5 gap-3 mb-4">
                  {features.map((f, i) => (
                    <div key={f.name} className="text-center">
                      <div className="text-xl mb-1">{f.icon}</div>
                      <div className="text-xs mb-1 text-purple-200">{f.desc}</div>
                      <div className="h-20 bg-gray-700 rounded relative overflow-hidden">
                        <div
                          className="absolute bottom-0 w-full bg-gradient-to-t from-cyan-400 to-cyan-200 transition-all"
                          style={{ height: `${testAnimal.features[i] * 100}%` }}
                        />
                      </div>
                      <div className="text-xs mt-1 font-mono">{testAnimal.features[i].toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-10 bg-gray-700 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${(1 - prediction) * 100}%` }}
                      >
                        {(1 - prediction) > 0.3 && <span className="text-sm">🐶</span>}
                      </div>
                      <div
                        className="h-full bg-gradient-to-r from-purple-400 to-purple-500 transition-all duration-500 flex items-center pl-2"
                        style={{ width: `${prediction * 100}%` }}
                      >
                        {prediction > 0.3 && <span className="text-sm">🐱</span>}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>🐶 {((1 - prediction) * 100).toFixed(1)}%</span>
                      <span>🐱 {(prediction * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className={`text-center p-4 rounded-xl ${
                    (prediction > 0.5) === testAnimal.isCat 
                      ? 'bg-green-500/30 border-2 border-green-400' 
                      : 'bg-red-500/30 border-2 border-red-400'
                  }`}>
                    <div className="text-3xl mb-1">
                      {(prediction > 0.5) === testAnimal.isCat ? '✅' : '❌'}
                    </div>
                    <div className="text-sm font-medium">
                      {(prediction > 0.5) === testAnimal.isCat ? '정답!' : '오답'}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setTestAnimal(generateAnimal())}
                className="px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-medium hover:opacity-90 transition text-lg"
              >
                🎲 새 동물<br/>생성
              </button>
            </div>
          )}
        </div>

        {/* 학습 데이터 */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-4">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">📚 학습 데이터 ({trainingData.length}개)</h2>
            <div className="flex gap-2 flex-wrap">
              <select
                value={dataCount}
                onChange={(e) => regenerateData(parseInt(e.target.value))}
                className="bg-white/10 rounded-lg px-3 py-1 text-sm"
              >
                <option value={10}>10개</option>
                <option value={20}>20개</option>
                <option value={30}>30개</option>
                <option value={50}>50개</option>
              </select>
              <button
                onClick={() => setTrainingData([...trainingData, generateAnimal()])}
                className="text-sm px-3 py-1 bg-blue-500 rounded-lg hover:bg-blue-600 transition"
              >
                + 추가
              </button>
              <button
                onClick={() => regenerateData(dataCount)}
                className="text-sm px-3 py-1 bg-purple-500 rounded-lg hover:bg-purple-600 transition"
              >
                🔄 전체 재생성
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {trainingData.map((animal) => {
              const pred = predict(animal.features);
              const correct = (pred > 0.5) === animal.isCat;
              return (
                <div
                  key={animal.id}
                  className="cursor-pointer"
                  title={`실제: ${animal.isCat ? '고양이' : '강아지'}\n예측: ${pred > 0.5 ? '고양이' : '강아지'} (${(pred * 100).toFixed(1)}%)`}
                  onClick={() => setTestAnimal(animal)}
                >
                  <MiniAvatar 
                    animal={animal} 
                    size={60} 
                    showResult={true}
                    correct={correct}
                  />
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 flex justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500/50 rounded"></div>
              <span>정확한 예측</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500/50 rounded"></div>
              <span>잘못된 예측</span>
            </div>
          </div>
        </div>

        {/* 설명 */}
        <div className="mt-4 bg-white/5 rounded-xl p-4 text-sm text-purple-200">
          <h3 className="font-semibold text-white mb-2">💡 사용 방법</h3>
          <ul className="space-y-1">
            <li>• 각 동물은 5가지 특성값으로 자동 생성됩니다 (귀 모양, 코 크기, 꼬리 길이, 얼굴 형태, 털 무늬)</li>
            <li>• 특성값에 따라 동물의 외형이 실시간으로 변합니다</li>
            <li>• <strong>학습 시작</strong>을 누르면 모델이 고양이와 강아지의 패턴을 학습합니다</li>
            <li>• 학습 데이터의 동물을 클릭하면 테스트 영역에서 자세히 볼 수 있습니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
