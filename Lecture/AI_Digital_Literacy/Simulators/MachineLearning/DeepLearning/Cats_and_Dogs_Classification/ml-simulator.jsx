import React, { useState, useEffect, useCallback } from 'react';

const features = [
  { name: '귀 모양', cat: 0.8, dog: 0.3, icon: '👂' },
  { name: '코 크기', cat: 0.2, dog: 0.7, icon: '👃' },
  { name: '꼬리 길이', cat: 0.6, dog: 0.5, icon: '🐾' },
  { name: '얼굴 형태', cat: 0.7, dog: 0.4, icon: '😺' },
  { name: '털 질감', cat: 0.5, dog: 0.6, icon: '🧶' },
];

const generateAnimal = () => {
  const isCat = Math.random() > 0.5;
  const featureValues = features.map(f => {
    const base = isCat ? f.cat : f.dog;
    return Math.max(0, Math.min(1, base + (Math.random() - 0.5) * 0.4));
  });
  return { isCat, features: featureValues, id: Math.random() };
};

const sigmoid = (x) => 1 / (1 + Math.exp(-x));

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
  const [showDetails, setShowDetails] = useState(false);

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
    const initialData = Array(20).fill(null).map(() => generateAnimal());
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

  const prediction = testAnimal ? predict(testAnimal.features) : 0.5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4 text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">🐱 고양이 vs 강아지 🐶</h1>
        <p className="text-center text-purple-200 mb-6">머신러닝 분류기 시뮬레이터</p>

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
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="text-8xl">
                {testAnimal.isCat ? '🐱' : '🐶'}
              </div>
              
              <div className="flex-1">
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {features.map((f, i) => (
                    <div key={f.name} className="text-center">
                      <div className="text-2xl mb-1">{f.icon}</div>
                      <div className="h-16 bg-gray-700 rounded relative overflow-hidden">
                        <div
                          className="absolute bottom-0 w-full bg-gradient-to-t from-cyan-400 to-cyan-200 transition-all"
                          style={{ height: `${testAnimal.features[i] * 100}%` }}
                        />
                      </div>
                      <div className="text-xs mt-1">{testAnimal.features[i].toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-8 bg-gray-700 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500"
                        style={{ width: `${(1 - prediction) * 100}%` }}
                      />
                      <div
                        className="h-full bg-gradient-to-r from-purple-400 to-purple-500 transition-all duration-500"
                        style={{ width: `${prediction * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>🐶 {((1 - prediction) * 100).toFixed(1)}%</span>
                      <span>🐱 {(prediction * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className={`text-center p-3 rounded-lg ${
                    (prediction > 0.5) === testAnimal.isCat 
                      ? 'bg-green-500/30 border border-green-400' 
                      : 'bg-red-500/30 border border-red-400'
                  }`}>
                    <div className="text-2xl mb-1">
                      {(prediction > 0.5) === testAnimal.isCat ? '✅' : '❌'}
                    </div>
                    <div className="text-xs">
                      {(prediction > 0.5) === testAnimal.isCat ? '정답!' : '오답'}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setTestAnimal(generateAnimal())}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg font-medium hover:opacity-90 transition"
              >
                🎲 새 동물
              </button>
            </div>
          )}
        </div>

        {/* 학습 데이터 */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">📚 학습 데이터 ({trainingData.length}개)</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm px-3 py-1 bg-white/10 rounded-lg hover:bg-white/20 transition"
              >
                {showDetails ? '간단히' : '자세히'}
              </button>
              <button
                onClick={() => setTrainingData([...trainingData, generateAnimal()])}
                className="text-sm px-3 py-1 bg-blue-500 rounded-lg hover:bg-blue-600 transition"
              >
                + 추가
              </button>
              <button
                onClick={() => setTrainingData(Array(20).fill(null).map(() => generateAnimal()))}
                className="text-sm px-3 py-1 bg-purple-500 rounded-lg hover:bg-purple-600 transition"
              >
                🔄 재생성
              </button>
            </div>
          </div>

          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {trainingData.map((animal, idx) => {
              const pred = predict(animal.features);
              const correct = (pred > 0.5) === animal.isCat;
              return (
                <div
                  key={animal.id}
                  className={`relative p-2 rounded-lg text-center transition-all ${
                    correct ? 'bg-green-500/20' : 'bg-red-500/20'
                  } hover:scale-110`}
                  title={`실제: ${animal.isCat ? '고양이' : '강아지'}, 예측: ${pred > 0.5 ? '고양이' : '강아지'} (${(pred * 100).toFixed(1)}%)`}
                >
                  <span className="text-2xl">{animal.isCat ? '🐱' : '🐶'}</span>
                  {showDetails && (
                    <div className="text-xs mt-1">
                      {(pred * 100).toFixed(0)}%
                    </div>
                  )}
                  <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center ${
                    correct ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {correct ? '✓' : '✗'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 설명 */}
        <div className="mt-4 text-center text-sm text-purple-200">
          <p>이 시뮬레이터는 로지스틱 회귀(Logistic Regression)를 사용하여</p>
          <p>5가지 특성(귀 모양, 코 크기, 꼬리 길이, 얼굴 형태, 털 질감)으로 고양이와 강아지를 분류합니다.</p>
        </div>
      </div>
    </div>
  );
}
