import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

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

const STORAGE_KEY = 'tetris-dqn-save-v3';

const SUCCESS_CRITERIA = {
  maxPieces: 200,
  maxScore: 5000,
  maxLines: 20
};

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

  analyzeWeights() {
    const firstLayer = this.weights[0];
    const importance = firstLayer.map(inputWeights => 
      inputWeights.reduce((sum, w) => sum + Math.abs(w), 0) / inputWeights.length
    );
    return {
      heightImportance: importance[0],
      holesImportance: importance[1],
      bumpinessImportance: importance[2],
      maxHeightImportance: importance[3]
    };
  }

  toJSON() { return { layers: this.layers, weights: this.weights, biases: this.biases, m_w: this.m_w, v_w: this.v_w, m_b: this.m_b, v_b: this.v_b, t: this.t }; }
  loadFrom(data) {
    this.layers = data.layers; this.weights = data.weights; this.biases = data.biases;
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

  getInsights() { return this.net.analyzeWeights(); }
  toJSON() { return { net: this.net.toJSON(), target: this.target.toJSON(), eps: this.eps, steps: this.steps, mem: this.mem.slice(-5000) }; }
  loadFrom(data) { this.net.loadFrom(data.net); this.target.loadFrom(data.target); this.eps = data.eps; this.steps = data.steps; this.mem = data.mem || []; }
}

// ============================================
// 유틸리티
// ============================================
const calculateSuccessScore = (pieces, score, lines) => {
  const pieceScore = Math.min(100, (pieces / SUCCESS_CRITERIA.maxPieces) * 100);
  const gameScore = Math.min(100, (score / SUCCESS_CRITERIA.maxScore) * 100);
  const lineScore = Math.min(100, (lines / SUCCESS_CRITERIA.maxLines) * 100);
  return Math.round(pieceScore * 0.5 + gameScore * 0.3 + lineScore * 0.2);
};

const getScoreGrade = (score) => {
  if (score >= 90) return { grade: 'S', color: '#ffd700', desc: '완벽!' };
  if (score >= 80) return { grade: 'A', color: '#2ecc71', desc: '훌륭함' };
  if (score >= 70) return { grade: 'B', color: '#3498db', desc: '좋음' };
  if (score >= 50) return { grade: 'C', color: '#f1c40f', desc: '보통' };
  if (score >= 30) return { grade: 'D', color: '#e67e22', desc: '부족' };
  return { grade: 'F', color: '#e74c3c', desc: '더 학습 필요' };
};

// ============================================
// 도움말 모달
// ============================================
const HelpModal = ({ onClose }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    padding: '20px', overflow: 'auto'
  }} onClick={onClose}>
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e, #0d0d1a)', borderRadius: '16px', padding: '24px',
      maxWidth: '700px', width: '100%', maxHeight: '90vh', overflow: 'auto',
      border: '1px solid rgba(0,245,255,0.3)', boxShadow: '0 0 30px rgba(0,245,255,0.2)'
    }} onClick={e => e.stopPropagation()}>
      
      <h2 style={{ margin: '0 0 20px 0', background: 'linear-gradient(90deg, #00f5ff, #ff00ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        📖 Tetris DQN 사용 가이드
      </h2>

      {/* DQN이란? */}
      <section style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#00f5ff', fontSize: '1rem', marginBottom: '10px' }}>🧠 DQN이란?</h3>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', lineHeight: 1.6 }}>
          <strong>Deep Q-Network</strong>의 약자로, AI가 스스로 게임을 배우는 방법입니다.
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>처음에는 <strong>무작위</strong>로 블록을 놓습니다</li>
            <li>결과가 좋으면 <strong>보상</strong>, 나쁘면 <strong>패널티</strong>를 받습니다</li>
            <li>이 경험을 <strong>기억</strong>하고 <strong>신경망</strong>으로 학습합니다</li>
            <li>점점 더 좋은 결과를 내는 행동을 선택하게 됩니다!</li>
          </ul>
        </div>
      </section>

      {/* 버튼 설명 */}
      <section style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#2ecc71', fontSize: '1rem', marginBottom: '10px' }}>🎮 모드 설명</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          {[
            { btn: '▶️ 학습', color: '#2ecc71', desc: 'AI가 시행착오를 통해 배웁니다. 탐색률(ε)이 점점 낮아지며 학습합니다.' },
            { btn: '🧪 테스트', color: '#9b59b6', desc: '학습을 멈추고 현재 실력을 테스트합니다. 게임 오버 시 성적표가 나옵니다.' },
            { btn: '👁️ 관전', color: '#3498db', desc: '학습 없이 AI가 계속 플레이하는 모습을 관찰합니다.' },
            { btn: '📊 리포트', color: '#f1c40f', desc: 'AI가 무엇을 배웠는지, 어떤 전략을 사용하는지 확인합니다.' },
          ].map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: `${m.color}15`, padding: '10px', borderRadius: '8px', border: `1px solid ${m.color}40` }}>
              <span style={{ background: m.color, padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', color: '#000' }}>{m.btn}</span>
              <span style={{ fontSize: '0.8rem' }}>{m.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 그래프 읽는 법 */}
      <section style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#f1c40f', fontSize: '1rem', marginBottom: '10px' }}>📊 그래프 읽는 법</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
          {[
            { title: '📊 점수', color: '#3498db', good: '📈 우상향', bad: '📉 하락', desc: '게임당 획득 점수' },
            { title: '🧩 생존 피스', color: '#2ecc71', good: '📈 증가', bad: '📉 감소', desc: '가장 중요! 오래 버틸수록 좋음' },
            { title: '⭐ 성공 점수', color: '#ffd700', good: '📈 증가', bad: '📉 감소', desc: '100점 만점 종합 평가' },
            { title: '📉 손실', color: '#e74c3c', good: '📉 감소', bad: '📈 증가', desc: 'AI 예측 오차 (낮을수록 좋음)' },
          ].map((g, i) => (
            <div key={i} style={{ background: `${g.color}15`, padding: '10px', borderRadius: '6px', border: `1px solid ${g.color}30` }}>
              <div style={{ color: g.color, fontWeight: 'bold', marginBottom: '4px' }}>{g.title}</div>
              <div style={{ opacity: 0.9 }}>{g.desc}</div>
              <div style={{ marginTop: '4px', fontSize: '0.75rem' }}>
                <span style={{ color: '#2ecc71' }}>{g.good} = 좋음</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 사용 팁 */}
      <section style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#e67e22', fontSize: '1rem', marginBottom: '10px' }}>💡 사용 팁</h3>
        <div style={{ background: 'rgba(230,126,34,0.1)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid rgba(230,126,34,0.3)' }}>
          <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.8 }}>
            <li><strong>속도는 5~10ms</strong>로 설정하면 빠르게 학습합니다</li>
            <li><strong>500게임</strong> 이상 학습해야 효과가 보이기 시작합니다</li>
            <li><strong>테스트 모드</strong>로 중간중간 실력을 확인하세요</li>
            <li><strong>리포트</strong>에서 AI가 배운 전략을 확인하세요</li>
            <li><strong>최적 학습 지점</strong>을 확인해서 과도한 학습을 피하세요</li>
            <li><strong>저장/내보내기</strong>로 학습 결과를 보관하세요</li>
          </ol>
        </div>
      </section>

      {/* 성공 점수 기준 */}
      <section style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#9b59b6', fontSize: '1rem', marginBottom: '10px' }}>⭐ 성공 점수 계산법</h3>
        <div style={{ background: 'rgba(155,89,182,0.1)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid rgba(155,89,182,0.3)' }}>
          <code style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '4px', display: 'block', marginBottom: '10px' }}>
            성공점수 = (생존피스/200 × 50%) + (점수/5000 × 30%) + (라인/20 × 20%)
          </code>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['S:90+', 'A:80+', 'B:70+', 'C:50+', 'D:30+', 'F:30미만'].map((g, i) => {
              const grade = getScoreGrade([95, 85, 75, 55, 35, 10][i]);
              return <span key={i} style={{ background: `${grade.color}30`, color: grade.color, padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>{g}</span>;
            })}
          </div>
        </div>
      </section>

      <button onClick={onClose} style={{
        width: '100%', padding: '12px', background: 'linear-gradient(90deg, #00f5ff, #ff00ff)',
        border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem'
      }}>확인</button>
    </div>
  </div>
);

// ============================================
// 학습 리포트 모달
// ============================================
const LearningReportModal = ({ agent, gen, avgScore, avgPieces, avgLines, successScore, onClose }) => {
  const weights = agent.getInsights();
  const total = weights.heightImportance + weights.holesImportance + weights.bumpinessImportance + weights.maxHeightImportance;
  
  const heightPct = (weights.heightImportance / total) * 100;
  const holesPct = (weights.holesImportance / total) * 100;
  const bumpPct = (weights.bumpinessImportance / total) * 100;
  const maxHPct = (weights.maxHeightImportance / total) * 100;

  // 배운 것들 (가중치 기반)
  const lessons = [
    { name: '구멍 회피', pct: holesPct, icon: '🕳️', color: '#e74c3c', desc: '블록 사이에 빈 공간(구멍)을 만들지 않습니다' },
    { name: '높이 관리', pct: heightPct, icon: '📏', color: '#3498db', desc: '블록을 가능한 낮게 쌓아 위험을 줄입니다' },
    { name: '평탄화', pct: bumpPct, icon: '🏔️', color: '#2ecc71', desc: '표면을 평평하게 유지하여 다양한 블록을 배치합니다' },
    { name: '최대높이 제한', pct: maxHPct, icon: '⚠️', color: '#f1c40f', desc: '한쪽이 너무 높아지지 않게 관리합니다' },
  ].sort((a, b) => b.pct - a.pct);

  // 전략 분석
  const strategies = [];
  if (holesPct > 25) strategies.push({ title: '구멍 최소화 전략', desc: '블록을 놓을 때 구멍이 생기지 않는 위치를 우선 선택합니다.', priority: holesPct });
  if (heightPct > 20) strategies.push({ title: '바닥 채우기 전략', desc: '가능한 낮은 위치에 블록을 배치하여 게임오버를 방지합니다.', priority: heightPct });
  if (bumpPct > 20) strategies.push({ title: '평탄화 전략', desc: '표면의 높낮이 차이를 줄여 어떤 블록이든 배치 가능하게 합니다.', priority: bumpPct });
  if (avgPieces > 50) strategies.push({ title: '생존 우선 전략', desc: '점수보다 오래 버티는 것을 우선시합니다.', priority: 50 });
  if (avgLines > 5) strategies.push({ title: '라인 클리어 전략', desc: '한 줄을 완성하여 공간을 확보합니다.', priority: avgLines * 5 });
  strategies.sort((a, b) => b.priority - a.priority);

  const grade = getScoreGrade(successScore);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '20px', overflow: 'auto'
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e, #0d0d1a)', borderRadius: '16px', padding: '24px',
        maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto',
        border: `2px solid ${grade.color}`, boxShadow: `0 0 30px ${grade.color}50`
      }} onClick={e => e.stopPropagation()}>
        
        <h2 style={{ margin: '0 0 20px 0', textAlign: 'center' }}>
          <span style={{ background: 'linear-gradient(90deg, #00f5ff, #ff00ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            📋 AI 학습 리포트
          </span>
        </h2>

        {/* 요약 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: '학습량', value: `${gen}게임`, color: '#3498db' },
            { label: '평균 점수', value: avgScore.toFixed(0), color: '#2ecc71' },
            { label: '성공 점수', value: successScore.toFixed(0), color: grade.color },
            { label: '등급', value: grade.grade, color: grade.color },
          ].map((m, i) => (
            <div key={i} style={{ background: `${m.color}20`, border: `1px solid ${m.color}50`, borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{m.label}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* AI가 배운 것 */}
        <section style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#00f5ff', fontSize: '1rem', marginBottom: '10px' }}>🧠 AI가 배운 것</h3>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
            {lessons.map((lesson, i) => (
              <div key={i} style={{ marginBottom: i < lessons.length - 1 ? '12px' : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{lesson.icon}</span>
                    <span style={{ fontWeight: 'bold', color: lesson.color }}>{lesson.name}</span>
                  </span>
                  <span style={{ fontSize: '0.8rem', color: lesson.color }}>{lesson.pct.toFixed(0)}%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', overflow: 'hidden', marginBottom: '4px' }}>
                  <div style={{ width: `${lesson.pct * 2.5}%`, height: '100%', background: lesson.color, borderRadius: '4px' }} />
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{lesson.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 성공 전략 */}
        <section style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#2ecc71', fontSize: '1rem', marginBottom: '10px' }}>🎯 AI의 성공 전략</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {strategies.slice(0, 3).map((s, i) => (
              <div key={i} style={{
                background: 'rgba(46,204,113,0.1)', padding: '12px', borderRadius: '8px',
                border: '1px solid rgba(46,204,113,0.3)', display: 'flex', alignItems: 'flex-start', gap: '10px'
              }}>
                <span style={{ fontSize: '1.5rem' }}>{['🥇', '🥈', '🥉'][i]}</span>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#2ecc71', marginBottom: '4px' }}>{s.title}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 핵심 인사이트 */}
        <section style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#f1c40f', fontSize: '1rem', marginBottom: '10px' }}>💡 핵심 인사이트</h3>
          <div style={{ background: 'rgba(241,196,15,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(241,196,15,0.3)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            {gen < 100 ? (
              <p>아직 학습 초기 단계입니다. 500게임 이상 학습하면 더 정확한 분석이 가능합니다.</p>
            ) : successScore >= 70 ? (
              <>
                <p>🎉 <strong>AI가 테트리스의 핵심 전략을 잘 학습했습니다!</strong></p>
                <p>특히 <strong>{lessons[0].name}</strong>을 가장 중요하게 여기며, 이는 테트리스에서 {lessons[0].name === '구멍 회피' ? '구멍이 게임오버의 주요 원인이기 때문입니다.' : lessons[0].name === '높이 관리' ? '높이가 높아지면 실수할 공간이 줄어들기 때문입니다.' : '안정적인 플레이의 기반이 되기 때문입니다.'}</p>
              </>
            ) : successScore >= 40 ? (
              <>
                <p>📚 <strong>AI가 기본적인 전략을 배우고 있습니다.</strong></p>
                <p>더 많은 학습이 필요하지만, {lessons[0].name}의 중요성을 인식하기 시작했습니다.</p>
              </>
            ) : (
              <>
                <p>🌱 <strong>AI가 아직 학습 초기 단계입니다.</strong></p>
                <p>더 많은 게임을 플레이하며 경험을 쌓아야 합니다. 최소 500게임 이상 학습을 권장합니다.</p>
              </>
            )}
          </div>
        </section>

        <button onClick={onClose} style={{
          width: '100%', padding: '12px', background: grade.color,
          border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem'
        }}>확인</button>
      </div>
    </div>
  );
};

// ============================================
// 게임 오버 카드
// ============================================
const GameOverCard = ({ pieces, score, lines, onClose }) => {
  const successScore = calculateSuccessScore(pieces, score, lines);
  const grade = getScoreGrade(successScore);
  
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e, #0d0d1a)', borderRadius: '16px', padding: '24px',
        border: `2px solid ${grade.color}`, boxShadow: `0 0 30px ${grade.color}50`, textAlign: 'center', minWidth: '280px'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '8px' }}>테스트 결과</div>
        <div style={{ fontSize: '4rem', fontWeight: 'bold', color: grade.color, textShadow: `0 0 20px ${grade.color}`, lineHeight: 1 }}>{grade.grade}</div>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '10px 0' }}>{successScore}<span style={{ fontSize: '1rem', opacity: 0.6 }}>/100</span></div>
        <div style={{ color: grade.color, marginBottom: '16px' }}>{grade.desc}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
          {[{ label: '생존', value: pieces, icon: '🧩' }, { label: '점수', value: score, icon: '📊' }, { label: '라인', value: lines, icon: '📏' }].map((m, i) => (
            <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{m.icon} {m.label}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{m.value}</div>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ padding: '10px 30px', background: grade.color, border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>확인</button>
      </div>
    </div>
  );
};

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
// 효율 그래프
// ============================================
const EfficiencyGraph = ({ efficiencyData, optimalPoint }) => {
  if (efficiencyData.length < 5) return null;
  const maxSuccess = Math.max(...efficiencyData.map(d => d.success), 1);
  
  return (
    <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '10px', marginTop: '10px' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '8px' }}>📈 학습량 vs 성공률</div>
      <div style={{ height: '60px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', padding: '4px', position: 'relative' }}>
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          <polyline fill="none" stroke="#2ecc71" strokeWidth="2"
            points={efficiencyData.map((d, i) => `${(i / (efficiencyData.length - 1)) * 100}%,${100 - (d.success / maxSuccess) * 100}%`).join(' ')} />
          {optimalPoint && (
            <circle cx={`${(optimalPoint.index / (efficiencyData.length - 1)) * 100}%`} cy={`${100 - (optimalPoint.success / maxSuccess) * 100}%`} r="5" fill="#ffd700" stroke="#fff" strokeWidth="2" />
          )}
        </svg>
      </div>
      {optimalPoint && (
        <div style={{ marginTop: '8px', padding: '6px', background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.4)', borderRadius: '4px', fontSize: '0.7rem' }}>
          <span style={{ color: '#ffd700' }}>⭐</span> 최적 지점: <strong>{optimalPoint.games}게임</strong> (성공률 {optimalPoint.success}점)
        </div>
      )}
    </div>
  );
};

// ============================================
// AI 인사이트 (미니)
// ============================================
const LearningInsightsMini = ({ agent, gen, avgPieces }) => {
  const insights = useMemo(() => {
    if (gen < 50) return null;
    const weights = agent.getInsights();
    const total = weights.heightImportance + weights.holesImportance + weights.bumpinessImportance + weights.maxHeightImportance;
    const items = [
      { icon: '🕳️', text: '구멍 회피', level: (weights.holesImportance / total) * 100 * 2.5, color: '#e74c3c' },
      { icon: '📏', text: '낮게 쌓기', level: (weights.heightImportance / total) * 100 * 2.5, color: '#3498db' },
      { icon: '🏔️', text: '평탄화', level: (weights.bumpinessImportance / total) * 100 * 2.5, color: '#2ecc71' },
    ].sort((a, b) => b.level - a.level).slice(0, 3);
    return items;
  }, [agent, gen]);

  if (!insights) return null;

  return (
    <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '6px', padding: '8px', marginTop: '8px' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '6px' }}>🧠 AI가 배운 것</div>
      {insights.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.8rem' }}>{item.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ height: '4px', background: 'rgba(0,0,0,0.3)', borderRadius: '2px' }}>
              <div style={{ width: `${Math.min(100, item.level)}%`, height: '100%', background: item.color, borderRadius: '2px' }} />
            </div>
          </div>
          <span style={{ fontSize: '0.55rem', opacity: 0.6, width: '40px' }}>{item.text}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================
// 게임 보드
// ============================================
const GameBoard = ({ board, cellSize, showGlow = false }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${cellSize}px)`, gap: cellSize > 15 ? '1px' : '0px',
    background: 'rgba(0,0,0,0.5)', padding: cellSize > 15 ? '8px' : '4px', borderRadius: '8px',
    border: showGlow ? '2px solid rgba(0,245,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
    boxShadow: showGlow ? '0 0 20px rgba(0,245,255,0.3)' : 'none'
  }}>
    {board.map((row, y) => row.map((cell, x) => (
      <div key={`${x}-${y}`} style={{ width: cellSize, height: cellSize, background: cell || 'rgba(30,30,50,0.8)', borderRadius: cellSize > 15 ? '3px' : '1px', boxShadow: cell && cellSize > 15 ? `0 0 ${cellSize/2}px ${cell}` : 'none' }} />
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
  const [mode, setMode] = useState('idle');
  const [speed, setSpeed] = useState(20);
  const [watchSpeed, setWatchSpeed] = useState(150);
  const [agent] = useState(() => new Agent());
  
  const [gen, setGen] = useState(0);
  const [scores, setScores] = useState([]);
  const [lines, setLines] = useState([]);
  const [pieces, setPieces] = useState([]);
  const [losses, setLosses] = useState([]);
  const [successScores, setSuccessScores] = useState([]);
  const [efficiencyData, setEfficiencyData] = useState([]);
  
  const [bestScore, setBest] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [currentLines, setCurrentLines] = useState(0);
  const [saveStatus, setSaveStatus] = useState('');
  
  const [showHelp, setShowHelp] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameOverData, setGameOverData] = useState(null);
  const [optimalPoint, setOptimalPoint] = useState(null);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  
  const loopRef = useRef(null);
  const prevFeat = useRef(null);
  const pieceCount = useRef(0);
  const startTime = useRef(Date.now());
  const fileInputRef = useRef(null);

  const randPiece = () => Object.keys(TETROMINOES)[Math.floor(Math.random() * 7)];

  const reset = useCallback(() => {
    setBoard(createBoard()); setPiece(randPiece()); setNext(randPiece());
    setCurrentScore(0); setCurrentLines(0);
    prevFeat.current = features(createBoard()); pieceCount.current = 0;
  }, []);

  // 효율 데이터 계산
  useEffect(() => {
    if (successScores.length >= 5) {
      const newData = [];
      for (let i = 0; i < successScores.length; i += 10) {
        const slice = successScores.slice(Math.max(0, i - 20), i + 1);
        const avgSuccess = slice.reduce((a, b) => a + b, 0) / slice.length;
        newData.push({ games: (i + 1), success: Math.round(avgSuccess), efficiency: avgSuccess / Math.log10((i + 1) * 10 + 1) });
      }
      setEfficiencyData(newData);
      
      if (newData.length >= 3) {
        let optIdx = 0;
        for (let i = 2; i < newData.length; i++) {
          const improvementRate = (newData[i].success - newData[i-1].success) / (newData[i-1].success || 1);
          if (improvementRate < 0.05 && newData[i].success > 30) { optIdx = i; break; }
        }
        if (optIdx === 0) optIdx = newData.length - 1;
        setOptimalPoint({ index: optIdx, games: newData[optIdx].games, success: newData[optIdx].success, efficiency: newData[optIdx].efficiency });
      }
    }
  }, [successScores]);

  // 저장/불러오기
  const getSaveData = useCallback(() => ({
    version: 3, timestamp: Date.now(), agent: agent.toJSON(),
    stats: { gen, bestScore, scores: scores.slice(-200), lines: lines.slice(-200), pieces: pieces.slice(-200), losses: losses.slice(-200), successScores: successScores.slice(-500) }
  }), [agent, gen, bestScore, scores, lines, pieces, losses, successScores]);

  const loadSaveData = useCallback((data) => {
    if (!data || ![1, 2, 3].includes(data.version)) return false;
    agent.loadFrom(data.agent);
    setGen(data.stats.gen); setBest(data.stats.bestScore);
    setScores(data.stats.scores || []); setLines(data.stats.lines || []);
    setPieces(data.stats.pieces || []); setLosses(data.stats.losses || []);
    setSuccessScores(data.stats.successScores || []);
    setIsFirstVisit(false);
    return true;
  }, [agent]);

  const autoSave = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(getSaveData())); setSaveStatus('✅'); setTimeout(() => setSaveStatus(''), 2000); } catch(e) {}
  }, [getSaveData]);

  const autoLoad = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && loadSaveData(JSON.parse(saved))) {
        setSaveStatus('📂');
        setTimeout(() => setSaveStatus(''), 2000);
        return true;
      }
    } catch(e) {}
    return false;
  }, [loadSaveData]);

  const exportToFile = useCallback(() => {
    const blob = new Blob([JSON.stringify(getSaveData())], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `tetris-dqn-${gen}games.json`; a.click();
  }, [getSaveData, gen]);

  const importFromFile = useCallback((e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { try { if (loadSaveData(JSON.parse(ev.target.result))) setSaveStatus('📥'); } catch {} };
    reader.readAsText(file); e.target.value = '';
  }, [loadSaveData]);

  useEffect(() => {
    const loaded = autoLoad();
    if (!loaded) setShowHelp(true); // 처음 방문 시 도움말 표시
  }, []);
  
  useEffect(() => { if (gen > 0 && gen % 100 === 0) autoSave(); }, [gen, autoSave]);

  // 게임 루프
  useEffect(() => {
    if (mode === 'idle') { if (loopRef.current) clearInterval(loopRef.current); return; }
    if (!piece) { reset(); return; }
    const currentSpeed = mode === 'watching' || mode === 'testing' ? watchSpeed : speed;
    const isLearning = mode === 'training';

    loopRef.current = setInterval(() => {
      const ps = placements(board, piece);
      if (!ps.length) {
        if (isLearning && prevFeat.current) agent.remember(prevFeat.current, -5, features(board), true);
        if (isLearning) agent.replay();
        
        const successScore = calculateSuccessScore(pieceCount.current, currentScore, currentLines);
        
        if (mode === 'testing') {
          setGameOverData({ pieces: pieceCount.current, score: currentScore, lines: currentLines });
          setShowGameOver(true);
          setMode('idle');
          return;
        }
        
        setGen(g => g + 1);
        setScores(s => [...s.slice(-500), currentScore]);
        setLines(l => [...l.slice(-500), currentLines]);
        setPieces(p => [...p.slice(-500), pieceCount.current]);
        setSuccessScores(ss => [...ss.slice(-500), successScore]);
        if (currentScore > bestScore) setBest(currentScore);
        reset();
        return;
      }
      
      const forceExploit = mode === 'testing' || mode === 'watching';
      const chosen = agent.choose(ps, forceExploit);
      const pf = prevFeat.current || features(board);
      const reward = chosen.lines ** 2 * 10 + (pf[1] - chosen.feat[1]) * 5 + (pf[0] - chosen.feat[0]) * 2 + (pf[2] - chosen.feat[2]) * 1 + 0.1;
      
      if (isLearning && prevFeat.current) agent.remember(prevFeat.current, reward, chosen.feat, false);
      
      prevFeat.current = chosen.feat;
      setBoard(chosen.board);
      setCurrentScore(s => s + [0, 100, 300, 500, 800][chosen.lines]);
      setCurrentLines(l => l + chosen.lines);
      setPiece(next);
      setNext(randPiece());
      pieceCount.current++;
      
      if (isLearning && pieceCount.current % 5 === 0) {
        const loss = agent.replay();
        if (loss > 0) setLosses(l => [...l.slice(-500), loss]);
      }
    }, currentSpeed);
    
    return () => { if (loopRef.current) clearInterval(loopRef.current); };
  }, [mode, piece, next, board, currentScore, currentLines, bestScore, agent, speed, watchSpeed, reset]);

  useEffect(() => { if (!piece) reset(); }, [piece, reset]);

  const stage = STAGES.find(s => gen >= s.min && gen < s.max) || STAGES[STAGES.length - 1];
  const avg = (arr, n = 50) => arr.length ? arr.slice(-n).reduce((a, b) => a + b, 0) / Math.min(arr.length, n) : 0;
  const gps = gen / ((Date.now() - startTime.current) / 1000 || 1);
  const avgSuccessScore = avg(successScores, 20);

  const hiddenInput = <input type="file" ref={fileInputRef} onChange={importFromFile} accept=".json" style={{ display: 'none' }} />;

  // 모달들
  const modals = (
    <>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showReport && <LearningReportModal agent={agent} gen={gen} avgScore={avg(scores)} avgPieces={avg(pieces)} avgLines={avg(lines)} successScore={avgSuccessScore} onClose={() => setShowReport(false)} />}
      {showGameOver && gameOverData && <GameOverCard {...gameOverData} onClose={() => setShowGameOver(false)} />}
    </>
  );

  // 테스트/관전 모드
  if (mode === 'testing' || mode === 'watching') {
    const isTest = mode === 'testing';
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0d0d1a, #1a1a2e)', fontFamily: "'JetBrains Mono', monospace", color: '#e0e0e0', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {hiddenInput}{modals}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '1.2rem', background: 'linear-gradient(90deg, #00f5ff, #ff00ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            {isTest ? '🧪 테스트' : '👁️ 관전'}
          </h1>
          <button onClick={() => setMode('idle')} style={{ padding: '5px 10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '0.75rem' }}>📊 대시보드</button>
          {isTest && <button onClick={() => { setMode('training'); reset(); startTime.current = Date.now(); }} style={{ padding: '5px 10px', background: 'rgba(46,204,113,0.3)', border: '1px solid rgba(46,204,113,0.5)', borderRadius: '6px', color: '#2ecc71', cursor: 'pointer', fontSize: '0.75rem' }}>▶️ 학습 재개</button>}
          <button onClick={() => setShowReport(true)} style={{ padding: '5px 10px', background: 'rgba(241,196,15,0.3)', border: '1px solid rgba(241,196,15,0.5)', borderRadius: '6px', color: '#f1c40f', cursor: 'pointer', fontSize: '0.75rem' }}>📋 리포트</button>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div>
            <GameBoard board={board} cellSize={20} showGlow={true} />
            <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[{ l: 'Score', v: currentScore, c: '#00f5ff' }, { l: 'Lines', v: currentLines, c: '#ff00ff' }, { l: 'Pieces', v: pieceCount.current, c: '#ffd700' }].map((m, i) => (
                <div key={i} style={{ background: `${m.c}20`, border: `1px solid ${m.c}50`, borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>{m.l}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: m.c }}>{m.v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>성공 점수</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getScoreGrade(calculateSuccessScore(pieceCount.current, currentScore, currentLines)).color }}>
                {calculateSuccessScore(pieceCount.current, currentScore, currentLines)}<span style={{ fontSize: '0.7rem', opacity: 0.5 }}>/100</span>
              </div>
            </div>
          </div>

          <div style={{ width: '260px' }}>
            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '1.3rem' }}>{stage.icon}</span>
                <div><div style={{ fontWeight: 'bold', color: stage.color, fontSize: '0.9rem' }}>{stage.name}</div><div style={{ fontSize: '0.7rem', opacity: 0.7 }}>#{gen}게임 학습됨</div></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.75rem' }}>
                {[{ l: '🏆 Best', v: bestScore, c: '#2ecc71' }, { l: '📊 평균', v: avgSuccessScore.toFixed(0), c: '#3498db' }, { l: '🎲 탐색률', v: `${(agent.eps*100).toFixed(0)}%`, c: '#f1c40f' }, { l: '🎖️ 등급', v: getScoreGrade(avgSuccessScore).grade, c: getScoreGrade(avgSuccessScore).color }].map((m, i) => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px' }}><div style={{ opacity: 0.6, fontSize: '0.65rem' }}>{m.l}</div><div style={{ color: m.c, fontWeight: 'bold' }}>{m.v}</div></div>
                ))}
              </div>
            </div>
            
            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '10px', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '4px' }}>속도: {watchSpeed}ms</div>
              <input type="range" min="50" max="500" value={watchSpeed} onChange={e => setWatchSpeed(Number(e.target.value))} style={{ width: '100%', accentColor: '#00f5ff' }} />
            </div>

            <LearningInsightsMini agent={agent} gen={gen} avgPieces={avg(pieces)} />
          </div>
        </div>
      </div>
    );
  }

  // 대시보드 모드
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0d0d1a, #1a1a2e)', fontFamily: "'JetBrains Mono', monospace", color: '#e0e0e0', padding: '12px' }}>
      {hiddenInput}{modals}
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '10px' }}>
        <h1 style={{ fontSize: '1.2rem', background: 'linear-gradient(90deg, #00f5ff, #ff00ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>🧠 Tetris DQN</h1>
        <button onClick={() => setShowHelp(true)} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '0.75rem' }}>❓ 도움말</button>
        <button onClick={() => setShowReport(true)} style={{ padding: '4px 10px', background: 'rgba(241,196,15,0.2)', border: '1px solid rgba(241,196,15,0.4)', borderRadius: '6px', color: '#f1c40f', cursor: 'pointer', fontSize: '0.75rem' }}>📋 리포트</button>
      </div>
      
      <div style={{ display: 'flex', gap: '12px', maxWidth: '1000px', margin: '0 auto' }}>
        {/* 왼쪽 컨트롤 */}
        <div style={{ width: '120px', flexShrink: 0 }}>
          <GameBoard board={board} cellSize={8} />
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '4px', fontSize: '0.55rem', marginTop: '5px', marginBottom: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.6 }}>Score</span><span style={{ color: '#00f5ff' }}>{currentScore}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.6 }}>성공</span><span style={{ color: getScoreGrade(calculateSuccessScore(pieceCount.current, currentScore, currentLines)).color }}>{calculateSuccessScore(pieceCount.current, currentScore, currentLines)}</span></div>
          </div>
          
          <div style={{ marginBottom: '5px' }}>
            <div style={{ fontSize: '0.5rem', opacity: 0.6 }}>속도: {speed}ms</div>
            <input type="range" min="5" max="100" value={speed} onChange={e => setSpeed(Number(e.target.value))} style={{ width: '100%', accentColor: '#00f5ff' }} />
          </div>
          
          <button onClick={() => { if (mode === 'training') setMode('idle'); else { setMode('training'); startTime.current = Date.now(); reset(); } }} style={{ width: '100%', padding: '7px', background: mode === 'training' ? '#e74c3c' : '#2ecc71', border: 'none', borderRadius: '4px', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.7rem', marginBottom: '4px' }}>
            {mode === 'training' ? '⏹ 정지' : '▶️ 학습'}
          </button>
          <button onClick={() => { setMode('testing'); reset(); }} style={{ width: '100%', padding: '7px', background: 'linear-gradient(135deg, #9b59b6, #8e44ad)', border: 'none', borderRadius: '4px', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.7rem', marginBottom: '4px' }}>🧪 테스트</button>
          <button onClick={() => { setMode('watching'); reset(); }} style={{ width: '100%', padding: '7px', background: 'linear-gradient(135deg, #3498db, #2980b9)', border: 'none', borderRadius: '4px', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.7rem', marginBottom: '6px' }}>👁️ 관전</button>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }}>
            <button onClick={autoSave} style={{ padding: '4px', background: 'rgba(46,204,113,0.2)', border: '1px solid rgba(46,204,113,0.4)', borderRadius: '3px', color: '#2ecc71', cursor: 'pointer', fontSize: '0.5rem' }}>💾</button>
            <button onClick={exportToFile} style={{ padding: '4px', background: 'rgba(155,89,182,0.2)', border: '1px solid rgba(155,89,182,0.4)', borderRadius: '3px', color: '#9b59b6', cursor: 'pointer', fontSize: '0.5rem' }}>📤</button>
            <button onClick={autoLoad} style={{ padding: '4px', background: 'rgba(52,152,219,0.2)', border: '1px solid rgba(52,152,219,0.4)', borderRadius: '3px', color: '#3498db', cursor: 'pointer', fontSize: '0.5rem' }}>📂</button>
            <button onClick={() => fileInputRef.current?.click()} style={{ padding: '4px', background: 'rgba(230,126,34,0.2)', border: '1px solid rgba(230,126,34,0.4)', borderRadius: '3px', color: '#e67e22', cursor: 'pointer', fontSize: '0.5rem' }}>📥</button>
          </div>
          {saveStatus && <div style={{ fontSize: '0.5rem', color: '#2ecc71', textAlign: 'center', marginTop: '3px' }}>{saveStatus}</div>}
        </div>

        {/* 오른쪽 대시보드 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 진행바 */}
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '6px', borderRadius: '5px', marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span>{stage.icon}</span><span style={{ fontWeight: 'bold', color: stage.color, fontSize: '0.8rem' }}>{stage.name}</span></div>
              <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>#{gen} | {gps.toFixed(1)}/sec</div>
            </div>
            <div style={{ position: 'relative', height: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', overflow: 'hidden' }}>
              {STAGES.map((s, i) => (<div key={i} style={{ position: 'absolute', left: `${(s.min/10000)*100}%`, width: `${((s.max-s.min)/10000)*100}%`, height: '100%', background: gen >= s.max ? s.color : gen >= s.min ? `${s.color}66` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.45rem', borderRight: '1px solid rgba(0,0,0,0.3)' }}>{s.icon}</div>))}
              <div style={{ position: 'absolute', left: `${Math.min(100, gen/100)}%`, top: 0, bottom: 0, width: '2px', background: 'white', boxShadow: '0 0 4px white' }} />
            </div>
          </div>

          {/* 지표 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '5px', marginBottom: '6px' }}>
            {[
              { l: 'Best', v: bestScore, c: '#2ecc71', i: '🏆' },
              { l: 'Avg', v: avg(scores).toFixed(0), c: '#3498db', i: '📊' },
              { l: 'Pieces', v: avg(pieces).toFixed(0), c: '#e67e22', i: '🧩' },
              { l: 'ε', v: (agent.eps * 100).toFixed(0) + '%', c: '#f1c40f', i: '🎲' },
              { l: '성공', v: avgSuccessScore.toFixed(0), c: getScoreGrade(avgSuccessScore).color, i: '⭐' },
              { l: '등급', v: getScoreGrade(avgSuccessScore).grade, c: getScoreGrade(avgSuccessScore).color, i: '🎖️' },
            ].map((m, i) => (
              <div key={i} style={{ background: `${m.c}15`, border: `1px solid ${m.c}35`, borderRadius: '4px', padding: '5px', textAlign: 'center' }}><div style={{ fontSize: '0.45rem', opacity: 0.7 }}>{m.i} {m.l}</div><div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: m.c }}>{m.v}</div></div>
            ))}
          </div>

          {/* 그래프 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '5px' }}>
              <Graph data={scores} color="#3498db" title="📊 점수" height={45} goodDirection="up" />
              <Graph data={pieces} color="#2ecc71" title="🧩 생존" height={35} goodDirection="up" />
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '5px' }}>
              <Graph data={successScores} color="#ffd700" title="⭐ 성공 점수" height={45} goodDirection="up" />
              <Graph data={losses} color="#e74c3c" title="📉 손실" height={35} goodDirection="down" />
            </div>
          </div>

          {/* 효율 그래프 + AI 인사이트 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <EfficiencyGraph efficiencyData={efficiencyData} optimalPoint={optimalPoint} />
            <LearningInsightsMini agent={agent} gen={gen} avgPieces={avg(pieces)} />
          </div>
        </div>
      </div>
    </div>
  );
}
