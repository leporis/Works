import React, { useState } from 'react';

const catColors = [
  { main: '#F5A623', light: '#FFCC66', dark: '#CC8800', name: '주황' },
  { main: '#8B7355', light: '#A89078', dark: '#6B5344', name: '갈색' },
  { main: '#E8E8E8', light: '#FFFFFF', dark: '#CCCCCC', name: '흰색' },
  { main: '#4A4A4A', light: '#666666', dark: '#333333', name: '검정' },
  { main: '#D4A574', light: '#E8C9A0', dark: '#B8956A', name: '크림' },
];

const dogColors = [
  { main: '#C4A574', light: '#D4BC94', dark: '#A48B5A', name: '골든' },
  { main: '#8B6914', light: '#A88A34', dark: '#6B4F0A', name: '갈색' },
  { main: '#FFFFFF', light: '#FFFFFF', dark: '#E8E8E8', name: '흰색' },
  { main: '#3D3D3D', light: '#555555', dark: '#222222', name: '검정' },
  { main: '#D4956A', light: '#E8B090', dark: '#B87A50', name: '베이지' },
];

const eyeColors = ['#4A7C59', '#5D4E37', '#4A90D9', '#8B6914', '#2C5530'];

// 고양이 귀 타입
const catEarTypes = [
  { name: '뾰족한 귀', value: 0.85, desc: '샴, 아비시니안' },
  { name: '둥근 귀', value: 0.55, desc: '페르시안, 브리티시숏헤어' },
  { name: '접힌 귀', value: 0.2, desc: '스코티시 폴드' },
];

// 고양이 꼬리 타입
const catTailTypes = [
  { name: '물음표 꼬리', value: 0.85, desc: '위로 말린 형태' },
  { name: 'S자 꼬리', value: 0.6, desc: '우아한 곡선' },
  { name: '부드러운 곡선', value: 0.4, desc: '자연스러운 휨' },
  { name: '늘어진 꼬리', value: 0.15, desc: '편안한 자세' },
];

// 강아지 귀 타입
const dogEarTypes = [
  { name: '서있는 귀', value: 0.75, desc: '셰퍼드, 허스키' },
  { name: '반접힌 귀', value: 0.5, desc: '콜리, 보더콜리' },
  { name: '플로피 귀', value: 0.2, desc: '비글, 바셋하운드' },
];

// 강아지 꼬리 타입
const dogTailTypes = [
  { name: '말린 꼬리', value: 0.8, desc: '시바견, 허스키' },
  { name: '올라간 꼬리', value: 0.55, desc: '골든리트리버' },
  { name: '늘어진 꼬리', value: 0.25, desc: '비글, 바셋하운드' },
];

// 현실적인 고양이 SVG
const CatAvatar = ({ earShape, tailCurve, noseSize = 0.3, faceRound = 0.6, furLength = 0.5, color, eyeColor, hasStripes = false, size = 100 }) => {
  const id = `cat-${earShape}-${tailCurve}-${Math.random()}`;
  
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <radialGradient id={`${id}-fur`} cx="40%" cy="30%">
          <stop offset="0%" stopColor={color.light} />
          <stop offset="70%" stopColor={color.main} />
          <stop offset="100%" stopColor={color.dark} />
        </radialGradient>
        <radialGradient id={`${id}-inner-ear`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FFD5D5" />
          <stop offset="100%" stopColor="#FFB0B0" />
        </radialGradient>
        <filter id={`${id}-shadow`}>
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.2"/>
        </filter>
      </defs>
      
      {/* 몸통 */}
      <ellipse cx="50" cy="78" rx="22" ry="18" fill={`url(#${id}-fur)`} />
      
      {/* 꼬리 - tailCurve에 따라 다양한 모양 */}
      {tailCurve > 0.7 ? (
        <path
          d={`M 72 75 
              C 78 70 82 55 80 40
              C 79 30 72 25 68 30
              C 65 35 70 38 73 35`}
          fill="none"
          stroke={color.main}
          strokeWidth={4 + furLength * 3}
          strokeLinecap="round"
        />
      ) : tailCurve > 0.5 ? (
        <path
          d={`M 72 75 
              C 80 65 85 55 78 45
              C 72 38 82 30 88 35`}
          fill="none"
          stroke={color.main}
          strokeWidth={4 + furLength * 3}
          strokeLinecap="round"
        />
      ) : tailCurve > 0.3 ? (
        <path
          d={`M 72 75 
              Q 85 65 88 50
              Q 90 40 85 35`}
          fill="none"
          stroke={color.main}
          strokeWidth={4 + furLength * 3}
          strokeLinecap="round"
        />
      ) : (
        <path
          d={`M 72 78 
              Q 80 82 85 88
              Q 88 92 85 95`}
          fill="none"
          stroke={color.main}
          strokeWidth={4 + furLength * 3}
          strokeLinecap="round"
        />
      )}
      
      {furLength > 0.6 && tailCurve > 0.3 && (
        <ellipse
          cx={tailCurve > 0.7 ? 70 : tailCurve > 0.5 ? 86 : 86}
          cy={tailCurve > 0.7 ? 32 : tailCurve > 0.5 ? 35 : 38}
          rx={6 + furLength * 4}
          ry={4 + furLength * 3}
          fill={color.main}
          transform={`rotate(${tailCurve > 0.7 ? -30 : 45}, ${tailCurve > 0.7 ? 70 : 86}, ${tailCurve > 0.7 ? 32 : 36})`}
        />
      )}
      
      {/* 뒷다리 */}
      <ellipse cx="35" cy="88" rx="8" ry="6" fill={color.dark} />
      <ellipse cx="65" cy="88" rx="8" ry="6" fill={color.dark} />
      
      {/* 앞다리 */}
      <ellipse cx="38" cy="90" rx="5" ry="8" fill={`url(#${id}-fur)`} />
      <ellipse cx="62" cy="90" rx="5" ry="8" fill={`url(#${id}-fur)`} />
      
      {/* 발 */}
      <ellipse cx="38" cy="95" rx="6" ry="4" fill={color.light} />
      <ellipse cx="62" cy="95" rx="6" ry="4" fill={color.light} />
      
      {/* 얼굴 */}
      <ellipse 
        cx="50" 
        cy="45" 
        rx={22 + faceRound * 5} 
        ry={20 + faceRound * 3}
        fill={`url(#${id}-fur)`}
        filter={`url(#${id}-shadow)`}
      />
      
      {/* 왼쪽 귀 */}
      {earShape > 0.7 ? (
        <>
          <path
            d={`M 20 ${18 - earShape * 8}
                C 22 ${25} 28 32 35 38
                C 30 35 25 30 20 ${18 - earShape * 8}`}
            fill={color.main}
          />
          <path
            d={`M 23 ${23 - earShape * 5}
                C 24 ${28} 28 33 33 36
                C 29 34 26 30 23 ${23 - earShape * 5}`}
            fill={`url(#${id}-inner-ear)`}
          />
        </>
      ) : earShape > 0.4 ? (
        <>
          <ellipse cx={26} cy={28} rx={12} ry={14} fill={color.main} />
          <ellipse cx={27} cy={30} rx={7} ry={9} fill={`url(#${id}-inner-ear)`} />
        </>
      ) : (
        <>
          <path
            d={`M 22 32 C 18 28 16 35 20 40 C 24 45 32 42 35 38 C 30 36 25 35 22 32`}
            fill={color.main}
          />
          <path
            d={`M 24 34 C 22 33 21 36 23 39 C 26 42 31 40 33 38 C 29 37 26 36 24 34`}
            fill={`url(#${id}-inner-ear)`}
          />
        </>
      )}
      
      {/* 오른쪽 귀 */}
      {earShape > 0.7 ? (
        <>
          <path
            d={`M 80 ${18 - earShape * 8}
                C 78 ${25} 72 32 65 38
                C 70 35 75 30 80 ${18 - earShape * 8}`}
            fill={color.main}
          />
          <path
            d={`M 77 ${23 - earShape * 5}
                C 76 ${28} 72 33 67 36
                C 71 34 74 30 77 ${23 - earShape * 5}`}
            fill={`url(#${id}-inner-ear)`}
          />
        </>
      ) : earShape > 0.4 ? (
        <>
          <ellipse cx={74} cy={28} rx={12} ry={14} fill={color.main} />
          <ellipse cx={73} cy={30} rx={7} ry={9} fill={`url(#${id}-inner-ear)`} />
        </>
      ) : (
        <>
          <path
            d={`M 78 32 C 82 28 84 35 80 40 C 76 45 68 42 65 38 C 70 36 75 35 78 32`}
            fill={color.main}
          />
          <path
            d={`M 76 34 C 78 33 79 36 77 39 C 74 42 69 40 67 38 C 71 37 74 36 76 34`}
            fill={`url(#${id}-inner-ear)`}
          />
        </>
      )}
      
      {/* 줄무늬 */}
      {hasStripes && (
        <g opacity="0.3">
          <path d="M 42 32 Q 45 28 48 32" stroke={color.dark} strokeWidth="2" fill="none" />
          <path d="M 52 32 Q 55 28 58 32" stroke={color.dark} strokeWidth="2" fill="none" />
          <path d="M 47 35 Q 50 31 53 35" stroke={color.dark} strokeWidth="2" fill="none" />
        </g>
      )}
      
      {/* 눈 */}
      <ellipse cx="40" cy="43" rx="7" ry="8" fill="white" />
      <ellipse cx="60" cy="43" rx="7" ry="8" fill="white" />
      <ellipse cx="41" cy="44" rx="4" ry="5" fill={eyeColor} />
      <ellipse cx="61" cy="44" rx="4" ry="5" fill={eyeColor} />
      <ellipse cx="41" cy="44" rx="1.5" ry="4" fill="#111" />
      <ellipse cx="61" cy="44" rx="1.5" ry="4" fill="#111" />
      <circle cx="39" cy="42" r="2" fill="white" opacity="0.9" />
      <circle cx="59" cy="42" r="2" fill="white" opacity="0.9" />
      
      {/* 볼터치 */}
      <ellipse cx="32" cy="52" rx="5" ry="3" fill="#FFB6C1" opacity="0.4" />
      <ellipse cx="68" cy="52" rx="5" ry="3" fill="#FFB6C1" opacity="0.4" />
      
      {/* 코 */}
      <path
        d={`M 50 ${52 - noseSize} 
            L ${47 - noseSize * 2} ${55 + noseSize}
            Q 50 ${57 + noseSize} ${53 + noseSize * 2} ${55 + noseSize}
            Z`}
        fill="#FFB6C1"
      />
      
      {/* 입 */}
      <path d="M 50 57 Q 50 60 46 62" fill="none" stroke="#888" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 50 57 Q 50 60 54 62" fill="none" stroke="#888" strokeWidth="1.2" strokeLinecap="round" />
      
      {/* 수염 */}
      <g stroke="#555" strokeWidth="0.8" opacity="0.6">
        <line x1="20" y1="50" x2="35" y2="52" />
        <line x1="18" y1="54" x2="34" y2="55" />
        <line x1="20" y1="58" x2="35" y2="57" />
        <line x1="80" y1="50" x2="65" y2="52" />
        <line x1="82" y1="54" x2="66" y2="55" />
        <line x1="80" y1="58" x2="65" y2="57" />
      </g>
    </svg>
  );
};

// 현실적인 강아지 SVG
const DogAvatar = ({ earShape, tailCurve, noseSize = 0.6, faceRound = 0.4, furLength = 0.5, color, eyeColor, hasSpots = false, size = 100 }) => {
  const id = `dog-${earShape}-${tailCurve}-${Math.random()}`;
  
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <radialGradient id={`${id}-fur`} cx="40%" cy="30%">
          <stop offset="0%" stopColor={color.light} />
          <stop offset="70%" stopColor={color.main} />
          <stop offset="100%" stopColor={color.dark} />
        </radialGradient>
        <radialGradient id={`${id}-nose`} cx="30%" cy="30%">
          <stop offset="0%" stopColor="#444" />
          <stop offset="100%" stopColor="#111" />
        </radialGradient>
        <filter id={`${id}-shadow`}>
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.2"/>
        </filter>
      </defs>
      
      {/* 몸통 */}
      <ellipse cx="50" cy="78" rx="24" ry="18" fill={`url(#${id}-fur)`} />
      
      {/* 꼬리 */}
      {tailCurve > 0.65 ? (
        <path
          d={`M 74 72 
              C 82 68 86 60 84 52
              C 82 45 76 42 72 46
              C 68 50 72 55 76 54`}
          fill="none"
          stroke={color.main}
          strokeWidth={6 + furLength * 4}
          strokeLinecap="round"
        />
      ) : tailCurve > 0.4 ? (
        <path
          d={`M 74 72 
              Q 82 65 85 55
              Q 87 48 84 42`}
          fill="none"
          stroke={color.main}
          strokeWidth={6 + furLength * 4}
          strokeLinecap="round"
        />
      ) : (
        <path
          d={`M 74 75 
              Q 80 80 82 88
              Q 83 94 80 98`}
          fill="none"
          stroke={color.main}
          strokeWidth={6 + furLength * 4}
          strokeLinecap="round"
        />
      )}
      
      {furLength > 0.55 && (
        <ellipse
          cx={tailCurve > 0.65 ? 74 : tailCurve > 0.4 ? 84 : 81}
          cy={tailCurve > 0.65 ? 50 : tailCurve > 0.4 ? 45 : 95}
          rx={5 + furLength * 5}
          ry={4 + furLength * 3}
          fill={color.main}
          transform={`rotate(${tailCurve > 0.65 ? 30 : tailCurve > 0.4 ? -50 : -20}, ${tailCurve > 0.65 ? 74 : tailCurve > 0.4 ? 84 : 81}, ${tailCurve > 0.65 ? 50 : tailCurve > 0.4 ? 45 : 95})`}
        />
      )}
      
      {/* 뒷다리 */}
      <ellipse cx="33" cy="88" rx="9" ry="7" fill={color.dark} />
      <ellipse cx="67" cy="88" rx="9" ry="7" fill={color.dark} />
      
      {/* 앞다리 */}
      <ellipse cx="38" cy="90" rx="6" ry="9" fill={`url(#${id}-fur)`} />
      <ellipse cx="62" cy="90" rx="6" ry="9" fill={`url(#${id}-fur)`} />
      
      {/* 발 */}
      <ellipse cx="38" cy="96" rx="7" ry="4" fill={color.light} />
      <ellipse cx="62" cy="96" rx="7" ry="4" fill={color.light} />
      
      {/* 얼굴 */}
      <ellipse 
        cx="50" 
        cy="45" 
        rx={20 + faceRound * 4} 
        ry={22 - faceRound * 5}
        fill={`url(#${id}-fur)`}
        filter={`url(#${id}-shadow)`}
      />
      
      {/* 주둥이 */}
      <ellipse 
        cx="50" 
        cy="55" 
        rx={12 + noseSize * 3} 
        ry={10 + noseSize * 2}
        fill={color.light}
      />
      
      {/* 귀 */}
      {earShape > 0.6 ? (
        // 서있는 귀
        <>
          <path
            d={`M 28 38 C 22 35 18 25 22 15 C 25 8 30 12 33 18 C 36 25 35 35 33 40 C 31 38 29 38 28 38`}
            fill={color.main}
          />
          <path
            d={`M 29 36 C 25 34 22 27 25 20 C 27 15 30 17 31 22 C 33 28 32 34 31 38`}
            fill={color.dark}
            opacity="0.3"
          />
          <path
            d={`M 72 38 C 78 35 82 25 78 15 C 75 8 70 12 67 18 C 64 25 65 35 67 40 C 69 38 71 38 72 38`}
            fill={color.main}
          />
          <path
            d={`M 71 36 C 75 34 78 27 75 20 C 73 15 70 17 69 22 C 67 28 68 34 69 38`}
            fill={color.dark}
            opacity="0.3"
          />
        </>
      ) : earShape > 0.35 ? (
        // 반접힌 귀
        <>
          <path
            d={`M 30 38 C 24 32 18 25 16 30 C 14 38 18 48 22 52 C 26 55 32 50 34 44 C 35 40 32 38 30 38`}
            fill={color.main}
          />
          <path
            d={`M 30 40 C 26 36 22 32 21 36 C 20 42 22 48 25 50 C 28 52 32 48 33 44`}
            fill={color.dark}
            opacity="0.3"
          />
          <path
            d={`M 70 38 C 76 32 82 25 84 30 C 86 38 82 48 78 52 C 74 55 68 50 66 44 C 65 40 68 38 70 38`}
            fill={color.main}
          />
          <path
            d={`M 70 40 C 74 36 78 32 79 36 C 80 42 78 48 75 50 C 72 52 68 48 67 44`}
            fill={color.dark}
            opacity="0.3"
          />
        </>
      ) : (
        // 플로피 귀
        <>
          <path
            d={`M 32 35 Q 26 32 18 38 Q 8 48 10 65 Q 12 80 20 85 Q 28 88 32 78 Q 34 65 33 50 Q 33 42 32 38 Z`}
            fill={color.main}
          />
          <path
            d={`M 30 40 Q 26 38 20 44 Q 14 52 15 65 Q 16 75 22 78 Q 28 80 30 72 Q 32 60 31 48 Z`}
            fill={color.dark}
            opacity="0.25"
          />
          <path
            d={`M 68 35 Q 74 32 82 38 Q 92 48 90 65 Q 88 80 80 85 Q 72 88 68 78 Q 66 65 67 50 Q 67 42 68 38 Z`}
            fill={color.main}
          />
          <path
            d={`M 70 40 Q 74 38 80 44 Q 86 52 85 65 Q 84 75 78 78 Q 72 80 70 72 Q 68 60 69 48 Z`}
            fill={color.dark}
            opacity="0.25"
          />
        </>
      )}
      
      {/* 점박이 */}
      {hasSpots && (
        <g>
          <circle cx="35" cy="40" r="5" fill={color.dark} opacity="0.5" />
          <circle cx="62" cy="38" r="4" fill={color.dark} opacity="0.5" />
        </g>
      )}
      
      {/* 눈 */}
      <ellipse cx="40" cy="42" rx="7" ry="7" fill="white" />
      <ellipse cx="60" cy="42" rx="7" ry="7" fill="white" />
      <circle cx="41" cy="43" r="5" fill={eyeColor} />
      <circle cx="61" cy="43" r="5" fill={eyeColor} />
      <circle cx="42" cy="44" r="2.5" fill="#111" />
      <circle cx="62" cy="44" r="2.5" fill="#111" />
      <circle cx="39" cy="41" r="2" fill="white" opacity="0.9" />
      <circle cx="59" cy="41" r="2" fill="white" opacity="0.9" />
      
      {/* 눈썹 */}
      <path d="M 34 36 Q 40 34 46 36" fill="none" stroke={color.dark} strokeWidth="2" strokeLinecap="round" />
      <path d="M 54 36 Q 60 34 66 36" fill="none" stroke={color.dark} strokeWidth="2" strokeLinecap="round" />
      
      {/* 코 */}
      <ellipse 
        cx="50" 
        cy={56 + noseSize * 2} 
        rx={5 + noseSize * 4} 
        ry={4 + noseSize * 3}
        fill={`url(#${id}-nose)`}
      />
      <ellipse cx="48" cy={55 + noseSize * 2} rx="1.5" ry="1" fill="#666" opacity="0.5" />
      
      {/* 입 */}
      <path d={`M 50 ${61 + noseSize * 2} L 50 ${65 + noseSize}`} stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
      <path d={`M 50 ${65 + noseSize} Q 44 ${68 + noseSize} 40 ${66 + noseSize}`} fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
      <path d={`M 50 ${65 + noseSize} Q 56 ${68 + noseSize} 60 ${66 + noseSize}`} fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* 혀 */}
      {noseSize > 0.5 && (
        <ellipse cx="50" cy={70 + noseSize} rx="5" ry={4 + noseSize * 3} fill="#FF8B8B" />
      )}
    </svg>
  );
};

export default function AnimalGallery() {
  const [selectedCatColor, setSelectedCatColor] = useState(0);
  const [selectedDogColor, setSelectedDogColor] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-4 text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">🐱 고양이 & 강아지 스타일 갤러리 🐶</h1>
        <p className="text-center text-slate-400 mb-8">귀 모양 × 꼬리 모양 조합</p>

        {/* 고양이 섹션 */}
        <div className="bg-slate-700/50 backdrop-blur rounded-2xl p-6 mb-6 border border-slate-600">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">🐱 고양이 ({catEarTypes.length}가지 귀 × {catTailTypes.length}가지 꼬리 = {catEarTypes.length * catTailTypes.length}가지 조합)</h2>
            <div className="flex gap-2">
              {catColors.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedCatColor(i)}
                  className={`w-8 h-8 rounded-full border-2 transition ${selectedCatColor === i ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c.main }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
          
          {/* 헤더 - 꼬리 타입 */}
          <div className="grid gap-4" style={{ gridTemplateColumns: `180px repeat(${catTailTypes.length}, 1fr)` }}>
            <div></div>
            {catTailTypes.map((tail, i) => (
              <div key={i} className="text-center p-2 bg-slate-600/50 rounded-lg">
                <div className="font-medium text-purple-300">{tail.name}</div>
                <div className="text-xs text-slate-400">{tail.desc}</div>
              </div>
            ))}
            
            {/* 각 귀 타입별 행 */}
            {catEarTypes.map((ear, earIdx) => (
              <React.Fragment key={earIdx}>
                <div className="flex items-center p-2 bg-slate-600/50 rounded-lg">
                  <div>
                    <div className="font-medium text-cyan-300">{ear.name}</div>
                    <div className="text-xs text-slate-400">{ear.desc}</div>
                  </div>
                </div>
                {catTailTypes.map((tail, tailIdx) => (
                  <div key={tailIdx} className="flex justify-center items-center p-2 bg-slate-800/50 rounded-xl hover:bg-slate-700/50 transition">
                    <CatAvatar
                      earShape={ear.value}
                      tailCurve={tail.value}
                      color={catColors[selectedCatColor]}
                      eyeColor={eyeColors[selectedCatColor % eyeColors.length]}
                      hasStripes={selectedCatColor === 0}
                      size={120}
                    />
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 강아지 섹션 */}
        <div className="bg-slate-700/50 backdrop-blur rounded-2xl p-6 border border-slate-600">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">🐶 강아지 ({dogEarTypes.length}가지 귀 × {dogTailTypes.length}가지 꼬리 = {dogEarTypes.length * dogTailTypes.length}가지 조합)</h2>
            <div className="flex gap-2">
              {dogColors.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDogColor(i)}
                  className={`w-8 h-8 rounded-full border-2 transition ${selectedDogColor === i ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c.main }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
          
          {/* 헤더 - 꼬리 타입 */}
          <div className="grid gap-4" style={{ gridTemplateColumns: `180px repeat(${dogTailTypes.length}, 1fr)` }}>
            <div></div>
            {dogTailTypes.map((tail, i) => (
              <div key={i} className="text-center p-2 bg-slate-600/50 rounded-lg">
                <div className="font-medium text-amber-300">{tail.name}</div>
                <div className="text-xs text-slate-400">{tail.desc}</div>
              </div>
            ))}
            
            {/* 각 귀 타입별 행 */}
            {dogEarTypes.map((ear, earIdx) => (
              <React.Fragment key={earIdx}>
                <div className="flex items-center p-2 bg-slate-600/50 rounded-lg">
                  <div>
                    <div className="font-medium text-orange-300">{ear.name}</div>
                    <div className="text-xs text-slate-400">{ear.desc}</div>
                  </div>
                </div>
                {dogTailTypes.map((tail, tailIdx) => (
                  <div key={tailIdx} className="flex justify-center items-center p-2 bg-slate-800/50 rounded-xl hover:bg-slate-700/50 transition">
                    <DogAvatar
                      earShape={ear.value}
                      tailCurve={tail.value}
                      color={dogColors[selectedDogColor]}
                      eyeColor={eyeColors[(selectedDogColor + 1) % eyeColors.length]}
                      hasSpots={selectedDogColor === 1}
                      size={120}
                    />
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 요약 */}
        <div className="mt-6 text-center text-slate-400 text-sm">
          <p>총 <span className="text-cyan-400 font-bold">{catEarTypes.length * catTailTypes.length}</span>가지 고양이 + <span className="text-amber-400 font-bold">{dogEarTypes.length * dogTailTypes.length}</span>가지 강아지 = <span className="text-white font-bold">{catEarTypes.length * catTailTypes.length + dogEarTypes.length * dogTailTypes.length}</span>가지 기본 조합</p>
          <p className="mt-1">× {catColors.length}가지 색상 = 다양한 캐릭터 생성 가능!</p>
        </div>
      </div>
    </div>
  );
}
