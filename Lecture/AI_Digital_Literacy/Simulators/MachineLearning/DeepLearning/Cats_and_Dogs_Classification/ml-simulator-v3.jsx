import React, { useState, useEffect, useCallback } from 'react';

const features = [
  { name: '귀 모양', cat: 0.8, dog: 0.3, icon: '👂', desc: '뾰족함' },
  { name: '코 크기', cat: 0.25, dog: 0.75, icon: '👃', desc: '크기' },
  { name: '꼬리 모양', cat: 0.7, dog: 0.35, icon: '🐾', desc: '곡선' },
  { name: '얼굴 형태', cat: 0.75, dog: 0.3, icon: '😺', desc: '둥근정도' },
  { name: '털 길이', cat: 0.55, dog: 0.45, icon: '🧶', desc: '복슬함' },
];

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

const generateAnimal = () => {
  const isCat = Math.random() > 0.5;
  const featureValues = features.map(f => {
    const base = isCat ? f.cat : f.dog;
    return Math.max(0.05, Math.min(0.95, base + (Math.random() - 0.5) * 0.4));
  });
  const colors = isCat ? catColors : dogColors;
  const colorSet = colors[Math.floor(Math.random() * colors.length)];
  return { 
    isCat, 
    features: featureValues, 
    id: Math.random(),
    color: colorSet,
    eyeColor: eyeColors[Math.floor(Math.random() * eyeColors.length)],
    hasStripes: isCat && Math.random() > 0.6,
    hasSpots: !isCat && Math.random() > 0.7,
  };
};

const sigmoid = (x) => 1 / (1 + Math.exp(-x));

// 현실적인 고양이 SVG
const CatAvatar = ({ animal, size = 100 }) => {
  const [earShape, noseSize, tailCurve, faceRound, furLength] = animal.features;
  const { color, eyeColor, hasStripes } = animal;
  const id = `cat-${animal.id}`;
  
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
        // 위로 높이 올라간 물음표 꼬리
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
        // S자 곡선 꼬리
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
        // 부드럽게 휘어진 꼬리
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
        // 아래로 늘어진 꼬리
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
      
      {/* 복슬복슬한 꼬리 털 (furLength가 높을 때) */}
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
      
      {/* 왼쪽 귀 - earShape에 따라 다양한 모양 */}
      {earShape > 0.7 ? (
        // 뾰족하게 서있는 귀 (샴, 아비시니안 스타일)
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
        // 둥근 귀 (페르시안, 브리티시 숏헤어 스타일)
        <>
          <ellipse
            cx={26}
            cy={28}
            rx={12}
            ry={14}
            fill={color.main}
          />
          <ellipse
            cx={27}
            cy={30}
            rx={7}
            ry={9}
            fill={`url(#${id}-inner-ear)`}
          />
        </>
      ) : (
        // 접힌 귀 (스코티시 폴드 스타일)
        <>
          <path
            d={`M 22 32
                C 18 28 16 35 20 40
                C 24 45 32 42 35 38
                C 30 36 25 35 22 32`}
            fill={color.main}
          />
          <path
            d={`M 24 34
                C 22 33 21 36 23 39
                C 26 42 31 40 33 38
                C 29 37 26 36 24 34`}
            fill={`url(#${id}-inner-ear)`}
          />
        </>
      )}
      
      {/* 오른쪽 귀 - earShape에 따라 다양한 모양 */}
      {earShape > 0.7 ? (
        // 뾰족하게 서있는 귀
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
        // 둥근 귀
        <>
          <ellipse
            cx={74}
            cy={28}
            rx={12}
            ry={14}
            fill={color.main}
          />
          <ellipse
            cx={73}
            cy={30}
            rx={7}
            ry={9}
            fill={`url(#${id}-inner-ear)`}
          />
        </>
      ) : (
        // 접힌 귀
        <>
          <path
            d={`M 78 32
                C 82 28 84 35 80 40
                C 76 45 68 42 65 38
                C 70 36 75 35 78 32`}
            fill={color.main}
          />
          <path
            d={`M 76 34
                C 78 33 79 36 77 39
                C 74 42 69 40 67 38
                C 71 37 74 36 76 34`}
            fill={`url(#${id}-inner-ear)`}
          />
        </>
      )}
      
      {/* 줄무늬 (있는 경우) */}
      {hasStripes && (
        <g opacity="0.3">
          <path d="M 42 32 Q 45 28 48 32" stroke={color.dark} strokeWidth="2" fill="none" />
          <path d="M 52 32 Q 55 28 58 32" stroke={color.dark} strokeWidth="2" fill="none" />
          <path d="M 47 35 Q 50 31 53 35" stroke={color.dark} strokeWidth="2" fill="none" />
        </g>
      )}
      
      {/* 눈 흰자 */}
      <ellipse cx="40" cy="43" rx="7" ry="8" fill="white" />
      <ellipse cx="60" cy="43" rx="7" ry="8" fill="white" />
      
      {/* 눈동자 */}
      <ellipse cx="41" cy="44" rx="4" ry="5" fill={eyeColor} />
      <ellipse cx="61" cy="44" rx="4" ry="5" fill={eyeColor} />
      
      {/* 고양이 세로 동공 */}
      <ellipse cx="41" cy="44" rx="1.5" ry="4" fill="#111" />
      <ellipse cx="61" cy="44" rx="1.5" ry="4" fill="#111" />
      
      {/* 눈 하이라이트 */}
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
      <path
        d="M 50 57 Q 50 60 46 62"
        fill="none" stroke="#888" strokeWidth="1.2" strokeLinecap="round"
      />
      <path
        d="M 50 57 Q 50 60 54 62"
        fill="none" stroke="#888" strokeWidth="1.2" strokeLinecap="round"
      />
      
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
const DogAvatar = ({ animal, size = 100 }) => {
  const [earShape, noseSize, tailCurve, faceRound, furLength] = animal.features;
  const { color, eyeColor, hasSpots } = animal;
  const id = `dog-${animal.id}`;
  
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
      
      {/* 꼬리 - tailCurve에 따라 다양한 강아지 꼬리 */}
      {tailCurve > 0.65 ? (
        // 위로 말린 꼬리 (시바견, 허스키 스타일)
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
        // 위로 올라간 꼬리 (래브라도, 골든리트리버 스타일)
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
        // 아래로 늘어진 꼬리 (비글, 바셋하운드 스타일)
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
      
      {/* 복슬복슬한 꼬리 털 (furLength가 높을 때) */}
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
      
      {/* 얼굴 - 강아지는 더 길쭉 */}
      <ellipse 
        cx="50" 
        cy="45" 
        rx={20 + faceRound * 4} 
        ry={22 - faceRound * 5}
        fill={`url(#${id}-fur)`}
        filter={`url(#${id}-shadow)`}
      />
      
      {/* 주둥이 부분 (밝은 색) */}
      <ellipse 
        cx="50" 
        cy="55" 
        rx={12 + noseSize * 3} 
        ry={10 + noseSize * 2}
        fill={color.light}
      />
      
      {/* 귀 - earShape에 따라 다양한 강아지 귀 */}
      {earShape > 0.6 ? (
        // 서있는 귀 (저먼 셰퍼드, 허스키 스타일)
        <>
          <path
            d={`M 28 38
                C 22 35 18 25 22 15
                C 25 8 30 12 33 18
                C 36 25 35 35 33 40
                C 31 38 29 38 28 38`}
            fill={color.main}
          />
          <path
            d={`M 29 36
                C 25 34 22 27 25 20
                C 27 15 30 17 31 22
                C 33 28 32 34 31 38`}
            fill={color.dark}
            opacity="0.3"
          />
          <path
            d={`M 72 38
                C 78 35 82 25 78 15
                C 75 8 70 12 67 18
                C 64 25 65 35 67 40
                C 69 38 71 38 72 38`}
            fill={color.main}
          />
          <path
            d={`M 71 36
                C 75 34 78 27 75 20
                C 73 15 70 17 69 22
                C 67 28 68 34 69 38`}
            fill={color.dark}
            opacity="0.3"
          />
        </>
      ) : earShape > 0.35 ? (
        // 반접힌 귀 (콜리, 보더콜리 스타일)
        <>
          <path
            d={`M 30 38
                C 24 32 18 25 16 30
                C 14 38 18 48 22 52
                C 26 55 32 50 34 44
                C 35 40 32 38 30 38`}
            fill={color.main}
          />
          <path
            d={`M 30 40
                C 26 36 22 32 21 36
                C 20 42 22 48 25 50
                C 28 52 32 48 33 44`}
            fill={color.dark}
            opacity="0.3"
          />
          <path
            d={`M 70 38
                C 76 32 82 25 84 30
                C 86 38 82 48 78 52
                C 74 55 68 50 66 44
                C 65 40 68 38 70 38`}
            fill={color.main}
          />
          <path
            d={`M 70 40
                C 74 36 78 32 79 36
                C 80 42 78 48 75 50
                C 72 52 68 48 67 44`}
            fill={color.dark}
            opacity="0.3"
          />
        </>
      ) : (
        // 완전히 늘어진 플로피 귀 (비글, 바셋하운드 스타일)
        <>
          <path
            d={`M 32 35
                Q 26 32 18 38
                Q 8 48 10 65
                Q 12 80 20 85
                Q 28 88 32 78
                Q 34 65 33 50
                Q 33 42 32 38
                Z`}
            fill={color.main}
          />
          <path
            d={`M 30 40
                Q 26 38 20 44
                Q 14 52 15 65
                Q 16 75 22 78
                Q 28 80 30 72
                Q 32 60 31 48
                Z`}
            fill={color.dark}
            opacity="0.25"
          />
          <path
            d={`M 68 35
                Q 74 32 82 38
                Q 92 48 90 65
                Q 88 80 80 85
                Q 72 88 68 78
                Q 66 65 67 50
                Q 67 42 68 38
                Z`}
            fill={color.main}
          />
          <path
            d={`M 70 40
                Q 74 38 80 44
                Q 86 52 85 65
                Q 84 75 78 78
                Q 72 80 70 72
                Q 68 60 69 48
                Z`}
            fill={color.dark}
            opacity="0.25"
          />
        </>
      )}
      
      {/* 점박이 (있는 경우) */}
      {hasSpots && (
        <g>
          <circle cx="35" cy="40" r="5" fill={color.dark} opacity="0.5" />
          <circle cx="62" cy="38" r="4" fill={color.dark} opacity="0.5" />
        </g>
      )}
      
      {/* 눈 흰자 */}
      <ellipse cx="40" cy="42" rx="7" ry="7" fill="white" />
      <ellipse cx="60" cy="42" rx="7" ry="7" fill="white" />
      
      {/* 눈동자 - 강아지는 둥근 동공 */}
      <circle cx="41" cy="43" r="5" fill={eyeColor} />
      <circle cx="61" cy="43" r="5" fill={eyeColor} />
      
      {/* 동공 */}
      <circle cx="42" cy="44" r="2.5" fill="#111" />
      <circle cx="62" cy="44" r="2.5" fill="#111" />
      
      {/* 눈 하이라이트 */}
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
      <path
        d={`M 50 ${61 + noseSize * 2} L 50 ${65 + noseSize}`}
        stroke="#444" strokeWidth="1.5" strokeLinecap="round"
      />
      <path
        d={`M 50 ${65 + noseSize} Q 44 ${68 + noseSize} 40 ${66 + noseSize}`}
        fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round"
      />
      <path
        d={`M 50 ${65 + noseSize} Q 56 ${68 + noseSize} 60 ${66 + noseSize}`}
        fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round"
      />
      
      {/* 혀 (큰 코일수록 더 보임) */}
      {noseSize > 0.5 && (
        <ellipse 
          cx="50" 
          cy={70 + noseSize} 
          rx="5" 
          ry={4 + noseSize * 3}
          fill="#FF8B8B"
        />
      )}
    </svg>
  );
};

// 동물 아바타 래퍼
const AnimalAvatar = ({ animal, size = 100 }) => {
  return animal.isCat 
    ? <CatAvatar animal={animal} size={size} />
    : <DogAvatar animal={animal} size={size} />;
};

// 미니 아바타
const MiniAvatar = ({ animal, size = 50, showResult, correct }) => {
  return (
    <div className={`relative rounded-xl p-1 transition-all hover:scale-110 cursor-pointer ${
      showResult ? (correct ? 'bg-green-500/30 ring-2 ring-green-400' : 'bg-red-500/30 ring-2 ring-red-400') : 'bg-white/10'
    }`}>
      <AnimalAvatar animal={animal} size={size} />
      {showResult && (
        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
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
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-4 text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-1">🐱 고양이 vs 강아지 🐶</h1>
        <p className="text-center text-slate-400 mb-6">머신러닝 이미지 분류기 시뮬레이터</p>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {/* 모델 상태 */}
          <div className="bg-slate-700/50 backdrop-blur rounded-2xl p-5 border border-slate-600">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              🧠 신경망 가중치
              <span className="text-xs bg-blue-500 px-2 py-1 rounded-full ml-auto">
                Epoch {epoch}
              </span>
            </h2>
            
            <div className="space-y-3 mb-5">
              {features.map((f, i) => (
                <div key={f.name} className="flex items-center gap-3">
                  <span className="text-lg">{f.icon}</span>
                  <span className="w-20 text-sm text-slate-300">{f.name}</span>
                  <div className="flex-1 h-3 bg-slate-600 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        weights[i] > 0 ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                      style={{ 
                        width: `${Math.min(100, Math.abs(weights[i]) * 100)}%`,
                        marginLeft: weights[i] < 0 ? 'auto' : 0
                      }}
                    />
                  </div>
                  <span className="w-16 text-xs text-right font-mono text-slate-400">
                    {weights[i] > 0 ? '+' : ''}{weights[i].toFixed(3)}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-600">
                <span className="text-lg">⚖️</span>
                <span className="w-20 text-sm text-slate-300">편향</span>
                <div className="flex-1" />
                <span className="w-16 text-xs text-right font-mono text-slate-400">
                  {bias > 0 ? '+' : ''}{bias.toFixed(3)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setIsTraining(!isTraining)}
                className={`px-5 py-2.5 rounded-xl font-medium transition shadow-lg ${
                  isTraining 
                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30' 
                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30'
                }`}
              >
                {isTraining ? '⏸ 중지' : '▶️ 학습'}
              </button>
              <button
                onClick={trainStep}
                disabled={isTraining}
                className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium transition disabled:opacity-50 shadow-lg shadow-blue-500/30"
              >
                ⏭ 1스텝
              </button>
              <button
                onClick={resetModel}
                className="px-5 py-2.5 bg-slate-500 hover:bg-slate-600 rounded-xl font-medium transition"
              >
                🔄 초기화
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm text-slate-400">학습률</span>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={learningRate}
                onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                className="flex-1 accent-blue-500"
              />
              <span className="text-sm font-mono w-8 text-slate-300">{learningRate}</span>
            </div>
          </div>

          {/* 정확도 */}
          <div className="bg-slate-700/50 backdrop-blur rounded-2xl p-5 border border-slate-600">
            <h2 className="text-lg font-semibold mb-4">📊 학습 현황</h2>
            
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-36 h-36">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="72" cy="72" r="62"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="14"
                  />
                  <circle
                    cx="72" cy="72" r="62"
                    fill="none"
                    stroke={accuracy > 80 ? '#10b981' : accuracy > 60 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="14"
                    strokeDasharray={`${accuracy * 3.9} 390`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-bold">{accuracy.toFixed(0)}%</span>
                  <span className="text-xs text-slate-400">정확도</span>
                </div>
              </div>
            </div>

            <div className="h-20 flex items-end gap-0.5 bg-slate-800/50 rounded-xl p-2">
              {history.length > 0 ? history.map((acc, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t transition-all duration-200"
                  style={{ height: `${acc}%` }}
                />
              )) : (
                <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
                  학습 시작 시 그래프 표시
                </div>
              )}
            </div>
            <p className="text-xs text-center mt-2 text-slate-500">최근 50 에포크</p>
          </div>
        </div>

        {/* 테스트 영역 */}
        <div className="bg-slate-700/50 backdrop-blur rounded-2xl p-5 mb-4 border border-slate-600">
          <h2 className="text-lg font-semibold mb-4">🔍 예측 테스트</h2>
          
          {testAnimal && (
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl p-4 shadow-xl">
                  <AnimalAvatar animal={testAnimal} size={160} />
                </div>
                <div className="mt-3 px-4 py-1.5 bg-slate-600 rounded-full text-sm">
                  실제: {testAnimal.isCat ? '🐱 고양이' : '🐶 강아지'}
                </div>
              </div>
              
              <div className="flex-1 w-full">
                <div className="grid grid-cols-5 gap-4 mb-5">
                  {features.map((f, i) => (
                    <div key={f.name} className="text-center">
                      <div className="text-xl mb-1">{f.icon}</div>
                      <div className="text-xs text-slate-400 mb-2">{f.desc}</div>
                      <div className="h-24 bg-slate-600 rounded-lg relative overflow-hidden">
                        <div
                          className="absolute bottom-0 w-full bg-gradient-to-t from-cyan-500 to-cyan-300 transition-all rounded-t"
                          style={{ height: `${testAnimal.features[i] * 100}%` }}
                        />
                      </div>
                      <div className="text-xs mt-1 font-mono text-slate-400">
                        {testAnimal.features[i].toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-12 bg-slate-600 rounded-full overflow-hidden flex shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500 flex items-center justify-end pr-3"
                        style={{ width: `${(1 - prediction) * 100}%` }}
                      >
                        {(1 - prediction) > 0.25 && <span className="text-lg">🐶</span>}
                      </div>
                      <div
                        className="h-full bg-gradient-to-r from-violet-400 to-purple-400 transition-all duration-500 flex items-center pl-3"
                        style={{ width: `${prediction * 100}%` }}
                      >
                        {prediction > 0.25 && <span className="text-lg">🐱</span>}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm mt-2 px-1">
                      <span className="text-amber-400">🐶 {((1 - prediction) * 100).toFixed(1)}%</span>
                      <span className="text-purple-400">🐱 {(prediction * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className={`text-center p-4 rounded-2xl min-w-24 ${
                    (prediction > 0.5) === testAnimal.isCat 
                      ? 'bg-emerald-500/20 border-2 border-emerald-400' 
                      : 'bg-rose-500/20 border-2 border-rose-400'
                  }`}>
                    <div className="text-4xl mb-1">
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
                className="px-6 py-4 bg-gradient-to-r from-pink-500 to-violet-500 rounded-2xl font-medium hover:opacity-90 transition text-lg shadow-lg shadow-purple-500/30"
              >
                🎲 새 동물
              </button>
            </div>
          )}
        </div>

        {/* 학습 데이터 */}
        <div className="bg-slate-700/50 backdrop-blur rounded-2xl p-5 border border-slate-600">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold">📚 학습 데이터 ({trainingData.length}개)</h2>
            <div className="flex gap-2 flex-wrap">
              <select
                value={dataCount}
                onChange={(e) => regenerateData(parseInt(e.target.value))}
                className="bg-slate-600 rounded-lg px-3 py-2 text-sm border border-slate-500"
              >
                <option value={10}>10개</option>
                <option value={20}>20개</option>
                <option value={30}>30개</option>
                <option value={50}>50개</option>
              </select>
              <button
                onClick={() => setTrainingData([...trainingData, generateAnimal()])}
                className="text-sm px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition"
              >
                + 추가
              </button>
              <button
                onClick={() => regenerateData(dataCount)}
                className="text-sm px-4 py-2 bg-violet-500 rounded-lg hover:bg-violet-600 transition"
              >
                🔄 재생성
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
                  onClick={() => setTestAnimal(animal)}
                  title={`실제: ${animal.isCat ? '고양이' : '강아지'} | 예측: ${pred > 0.5 ? '고양이' : '강아지'} (${(pred * 100).toFixed(1)}%)`}
                >
                  <MiniAvatar 
                    animal={animal} 
                    size={65} 
                    showResult={true}
                    correct={correct}
                  />
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 flex justify-center gap-8 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-500/50 rounded ring-2 ring-emerald-400"></div>
              <span>정확한 예측</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-rose-500/50 rounded ring-2 ring-rose-400"></div>
              <span>잘못된 예측</span>
            </div>
          </div>
        </div>

        {/* 설명 */}
        <div className="mt-4 text-center text-sm text-slate-500">
          <p>각 동물은 특성값에 따라 자동으로 이미지가 생성됩니다. 학습 데이터를 클릭하면 상세 정보를 확인할 수 있습니다.</p>
        </div>
      </div>
    </div>
  );
}
