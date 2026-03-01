import React, { useState, useEffect, useRef } from 'react';

const GenerativeAISimulator = () => {
  const [inputText, setInputText] = useState('안녕하세요');
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [generatedTokens, setGeneratedTokens] = useState([]);
  const [attentionWeights, setAttentionWeights] = useState([]);
  const [probabilities, setProbabilities] = useState([]);
  const intervalRef = useRef(null);

  const steps = [
    { id: 0, name: '입력', icon: '📝', color: '#6366f1' },
    { id: 1, name: '토큰화', icon: '🔤', color: '#8b5cf6' },
    { id: 2, name: '임베딩', icon: '🎯', color: '#a855f7' },
    { id: 3, name: '어텐션', icon: '🔗', color: '#d946ef' },
    { id: 4, name: '예측', icon: '📊', color: '#ec4899' },
    { id: 5, name: '생성', icon: '✨', color: '#f43f5e' },
  ];

  const nextTokenOptions = {
    '안녕하세요': ['!', '?', ',', '.', '~'],
    '오늘': ['은', '의', '도', '날씨', '하루'],
    '인공지능': ['은', '이', '의', '기술', '시대'],
    '생성형': ['AI', '모델', '인공지능', '기술', '시스템'],
  };

  const tokenize = (text) => {
    const chars = text.split('');
    return chars.map((char, i) => ({
      id: i,
      text: char,
      embedding: Array.from({ length: 4 }, () => (Math.random() * 2 - 1).toFixed(2)),
    }));
  };

  useEffect(() => {
    if (inputText) {
      setTokens(tokenize(inputText));
      setGeneratedTokens([]);
    }
  }, [inputText]);

  useEffect(() => {
    if (currentStep === 3 && tokens.length > 0) {
      const weights = tokens.map((_, i) =>
        tokens.map((_, j) => {
          const base = i === j ? 0.3 : 0.1;
          return Math.min(0.9, base + Math.random() * 0.4);
        })
      );
      setAttentionWeights(weights);
    }

    if (currentStep === 4) {
      const key = Object.keys(nextTokenOptions).find(k => inputText.includes(k)) || '안녕하세요';
      const options = nextTokenOptions[key] || ['!', '?', '.'];
      const probs = options.map((token, i) => ({
        token,
        prob: Math.max(0.05, 0.6 - i * 0.12 + Math.random() * 0.1),
      })).sort((a, b) => b.prob - a.prob);
      setProbabilities(probs);
    }

    if (currentStep === 5 && probabilities.length > 0) {
      if (generatedTokens.length < 5) {
        const timer = setTimeout(() => {
          const newToken = probabilities[Math.floor(Math.random() * Math.min(3, probabilities.length))].token;
          setGeneratedTokens(prev => [...prev, newToken]);
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [currentStep, tokens, probabilities, generatedTokens, inputText]);

  const startSimulation = () => {
    setIsPlaying(true);
    setCurrentStep(0);
    setGeneratedTokens([]);
    
    let step = 0;
    intervalRef.current = setInterval(() => {
      step++;
      if (step <= 5) {
        setCurrentStep(step);
      } else {
        clearInterval(intervalRef.current);
        setIsPlaying(false);
      }
    }, 1500);
  };

  const stopSimulation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsPlaying(false);
  };

  const resetSimulation = () => {
    stopSimulation();
    setCurrentStep(0);
    setGeneratedTokens([]);
    setProbabilities([]);
    setAttentionWeights([]);
  };

  const explanations = [
    { title: '입력 단계', desc: '사용자가 입력한 텍스트가 AI 모델로 전달됩니다. 이 텍스트가 생성의 시작점(프롬프트)이 됩니다.' },
    { title: '토큰화', desc: '텍스트를 모델이 이해할 수 있는 최소 단위인 "토큰"으로 분리합니다. 한글은 보통 음절 단위로, 영어는 단어의 일부로 분리됩니다.' },
    { title: '임베딩', desc: '각 토큰을 수백~수천 차원의 벡터(숫자 배열)로 변환합니다. 이 벡터는 토큰의 의미적 특성을 담고 있습니다.' },
    { title: '셀프 어텐션', desc: '트랜스포머의 핵심! 각 토큰이 다른 모든 토큰과의 관계를 계산합니다. 이를 통해 문맥을 이해합니다.' },
    { title: '다음 토큰 예측', desc: '모델은 가능한 모든 토큰에 대한 확률 분포를 출력합니다. 가장 확률이 높은 토큰이 선택됩니다.' },
    { title: '텍스트 생성', desc: '선택된 토큰이 출력에 추가되고, 이 과정이 반복되어 완전한 문장이 생성됩니다. 이것이 "자기회귀적" 생성입니다.' },
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '24px',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      fontFamily: "'Noto Sans KR', sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-pulse { animation: pulse 1s ease-in-out infinite; }
      `}</style>
      
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            marginBottom: '12px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899, #f43f5e)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            생성형 AI 작동 원리
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '0.95rem' }}>
            대규모 언어 모델(LLM)이 텍스트를 생성하는 과정을 시각적으로 체험해보세요
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {steps.map((step, idx) => (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
              <div
                onClick={() => !isPlaying && setCurrentStep(step.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  cursor: isPlaying ? 'default' : 'pointer',
                  transition: 'all 0.3s ease',
                  background: currentStep >= step.id ? `linear-gradient(135deg, ${step.color}40, ${step.color}20)` : '#1e1e2e',
                  border: `2px solid ${currentStep >= step.id ? step.color : '#333'}`,
                  boxShadow: currentStep === step.id ? `0 0 20px ${step.color}50` : 'none',
                  transform: currentStep >= step.id ? 'scale(1.05)' : 'scale(0.9)',
                  opacity: currentStep >= step.id ? 1 : 0.4,
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{step.icon}</span>
              </div>
              {idx < steps.length - 1 && (
                <div style={{ 
                  width: '28px', 
                  height: '2px', 
                  margin: '0 4px',
                  background: currentStep > step.id ? `linear-gradient(90deg, ${step.color}, ${steps[idx + 1].color})` : '#333'
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
          <button
            onClick={startSimulation}
            disabled={isPlaying}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: '500',
              fontSize: '0.95rem',
              border: 'none',
              cursor: isPlaying ? 'not-allowed' : 'pointer',
              background: isPlaying ? '#374151' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: isPlaying ? '#6b7280' : 'white',
              transition: 'all 0.3s ease'
            }}
          >
            ▶ 시뮬레이션 시작
          </button>
          <button
            onClick={resetSimulation}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: '500',
              fontSize: '0.95rem',
              background: '#1f2937',
              color: '#d1d5db',
              border: '1px solid #374151',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            ↺ 초기화
          </button>
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
          
          {/* Input */}
          <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '12px', color: '#818cf8' }}>📝 텍스트 입력</h3>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isPlaying}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '10px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '2px solid #4f46e5',
                color: 'white',
                fontSize: '1.1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="텍스트를 입력하세요..."
            />
          </div>

          {/* Tokenization */}
          <div style={{ 
            padding: '20px', 
            borderRadius: '16px', 
            background: 'rgba(15, 23, 42, 0.6)', 
            border: '1px solid #334155',
            opacity: currentStep >= 1 ? 1 : 0.4,
            transition: 'opacity 0.3s ease'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '8px', color: '#a78bfa' }}>🔤 토큰화</h3>
            <p style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '12px' }}>텍스트를 토큰으로 분리</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {tokens.map((token, idx) => (
                <div key={token.id} className="mono" style={{ 
                  padding: '8px 14px', 
                  borderRadius: '8px', 
                  fontSize: '1rem',
                  background: 'rgba(139, 92, 246, 0.2)', 
                  border: '1px solid rgba(139, 92, 246, 0.4)', 
                  color: '#c4b5fd' 
                }}>
                  {token.text}<span style={{ fontSize: '0.7rem', marginLeft: '4px', opacity: 0.6 }}>[{idx}]</span>
                </div>
              ))}
            </div>
          </div>

          {/* Embedding */}
          <div style={{ 
            padding: '20px', 
            borderRadius: '16px', 
            background: 'rgba(15, 23, 42, 0.6)', 
            border: '1px solid #334155',
            opacity: currentStep >= 2 ? 1 : 0.4,
            transition: 'opacity 0.3s ease'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '8px', color: '#c084fc' }}>🎯 임베딩</h3>
            <p style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '12px' }}>토큰을 벡터로 변환</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
              {tokens.slice(0, 5).map((token) => (
                <div key={token.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                  <span className="mono" style={{ width: '24px', color: '#e9d5ff' }}>{token.text}</span>
                  <span style={{ color: '#9333ea' }}>→</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {token.embedding.map((val, i) => (
                      <span key={i} className="mono" style={{ 
                        padding: '3px 6px', 
                        borderRadius: '4px', 
                        fontSize: '0.7rem',
                        background: parseFloat(val) > 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', 
                        color: parseFloat(val) > 0 ? '#4ade80' : '#f87171' 
                      }}>
                        {val}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attention */}
          <div style={{ 
            padding: '20px', 
            borderRadius: '16px', 
            background: 'rgba(15, 23, 42, 0.6)', 
            border: '1px solid #334155',
            opacity: currentStep >= 3 ? 1 : 0.4,
            transition: 'opacity 0.3s ease'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '8px', color: '#e879f9' }}>🔗 셀프 어텐션</h3>
            <p style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '12px' }}>토큰 간 관계 계산</p>
            {attentionWeights.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'inline-block' }}>
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '2px', marginLeft: '28px' }}>
                    {tokens.slice(0, 5).map((t, i) => (
                      <div key={i} className="mono" style={{ width: '32px', textAlign: 'center', fontSize: '0.7rem', color: '#d946ef' }}>{t.text}</div>
                    ))}
                  </div>
                  {attentionWeights.slice(0, 5).map((row, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <div className="mono" style={{ width: '24px', textAlign: 'right', fontSize: '0.7rem', color: '#d946ef', marginRight: '2px' }}>{tokens[i]?.text}</div>
                      {row.slice(0, 5).map((weight, j) => (
                        <div key={j} className="mono" style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '4px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '0.65rem',
                          background: `rgba(217, 70, 239, ${weight * 0.7})`, 
                          color: weight > 0.4 ? '#fff' : '#d946ef' 
                        }}>
                          {weight.toFixed(1)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Prediction */}
          <div style={{ 
            padding: '20px', 
            borderRadius: '16px', 
            background: 'rgba(15, 23, 42, 0.6)', 
            border: '1px solid #334155',
            opacity: currentStep >= 4 ? 1 : 0.4,
            transition: 'opacity 0.3s ease'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '8px', color: '#f472b6' }}>📊 다음 토큰 예측</h3>
            <p style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '12px' }}>확률 분포에서 선택</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {probabilities.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="mono" style={{ width: '32px', textAlign: 'right', fontSize: '0.9rem', color: '#fbcfe8' }}>{item.token}</span>
                  <div style={{ flex: 1, height: '24px', borderRadius: '12px', overflow: 'hidden', background: '#1e293b' }}>
                    <div style={{ 
                      height: '100%', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'flex-end', 
                      paddingRight: '8px',
                      width: `${item.prob * 100}%`, 
                      background: 'linear-gradient(90deg, #ec4899, #f43f5e)',
                      transition: 'width 0.5s ease'
                    }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'white' }}>{(item.prob * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generation */}
          <div style={{ 
            padding: '20px', 
            borderRadius: '16px', 
            background: 'rgba(15, 23, 42, 0.6)', 
            border: '1px solid #334155',
            opacity: currentStep >= 5 ? 1 : 0.4,
            transition: 'opacity 0.3s ease'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '8px', color: '#fb7185' }}>✨ 텍스트 생성</h3>
            <p style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '12px' }}>순차적 토큰 생성</p>
            <div style={{ 
              padding: '16px', 
              borderRadius: '10px', 
              minHeight: '60px',
              background: 'rgba(244, 63, 94, 0.1)', 
              border: '1px solid rgba(244, 63, 94, 0.3)' 
            }}>
              <span style={{ color: 'white', fontSize: '1.2rem' }}>{inputText}</span>
              {generatedTokens.map((token, idx) => (
                <span key={idx} style={{ fontSize: '1.2rem', color: '#f43f5e' }}>{token}</span>
              ))}
              {currentStep === 5 && generatedTokens.length < 5 && (
                <span className="animate-pulse" style={{ 
                  display: 'inline-block', 
                  width: '8px', 
                  height: '20px', 
                  marginLeft: '2px',
                  background: '#f43f5e',
                  verticalAlign: 'middle'
                }} />
              )}
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div style={{ 
          marginTop: '24px', 
          padding: '20px', 
          borderRadius: '16px',
          background: `linear-gradient(135deg, ${steps[currentStep].color}15, transparent)`, 
          border: `1px solid ${steps[currentStep].color}30` 
        }}>
          <h4 style={{ fontWeight: 'bold', marginBottom: '8px', color: steps[currentStep].color }}>{explanations[currentStep].title}</h4>
          <p style={{ color: '#d1d5db', fontSize: '0.9rem', lineHeight: 1.7 }}>{explanations[currentStep].desc}</p>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center', color: '#6b7280', fontSize: '0.85rem' }}>
          💡 각 단계 아이콘을 클릭하여 자세히 살펴볼 수 있습니다
        </div>
      </div>
    </div>
  );
};

export default GenerativeAISimulator;
