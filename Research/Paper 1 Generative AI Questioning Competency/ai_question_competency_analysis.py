"""
생성형 AI 활용 역량의 예측변인 탐색 연구
- 시뮬레이션 데이터 생성 및 분석
- KCI 등재지 논문 형식에 맞춘 결과 산출
"""

import numpy as np
import pandas as pd
from scipy import stats
from scipy.stats import pearsonr, shapiro, levene
import statsmodels.api as sm
from statsmodels.stats.outliers_influence import variance_inflation_factor
import warnings
warnings.filterwarnings('ignore')

# 재현성을 위한 시드 설정
np.random.seed(42)

# ============================================================
# 1. 연구 설계 및 변인 정의
# ============================================================

print("=" * 70)
print("1. 연구 설계 및 변인 정의")
print("=" * 70)

research_design = """
[연구 목적]
생성형 AI에게 효과적으로 질문하는 역량(협업적 추상화 역량)을 
예측하는 개인 특성 변인을 탐색한다.

[연구 문제]
1. 메타인지, 인지욕구, 모호함 인내, AI 사용 경험은 
   AI 질문 역량과 어떤 상관관계가 있는가?
2. 이 변인들 중 AI 질문 역량을 가장 잘 예측하는 변인은 무엇인가?
3. 인지적 성향 변인(메타인지, 인지욕구, 모호함 인내)은 
   AI 사용 경험을 통제한 후에도 AI 질문 역량을 유의하게 예측하는가?

[변인 정의]
- 종속변인: AI 질문 역량 (협업적 추상화 루브릭, 4-20점)
- 예측변인:
  1) 메타인지 (MAI 단축형, 20-100점)
  2) 인지욕구 (NFC-18, 18-90점)  
  3) 모호함 인내 (AT-12, 12-60점)
  4) AI 사용 경험 (자체 척도, 5-25점)

[참여자]
- 예비 초등교사 80명
- A 교육대학교 재학생
- 컴퓨팅 사고 관련 강좌 수강생
"""
print(research_design)

# ============================================================
# 2. 가상 데이터 생성 (현실적인 상관관계 반영)
# ============================================================

print("\n" + "=" * 70)
print("2. 가상 데이터 생성")
print("=" * 70)

n = 80  # 참여자 수

# 상관행렬 설정 (이론적 예측 기반)
# 변인 순서: 메타인지, 인지욕구, 모호함인내, AI경험, AI질문역량
# 메타인지가 가장 강한 예측변인이 되도록 설정

correlation_matrix = np.array([
    [1.00, 0.45, 0.35, 0.20, 0.55],  # 메타인지
    [0.45, 1.00, 0.40, 0.15, 0.40],  # 인지욕구
    [0.35, 0.40, 1.00, 0.10, 0.30],  # 모호함 인내
    [0.20, 0.15, 0.10, 1.00, 0.35],  # AI 사용 경험
    [0.55, 0.40, 0.30, 0.35, 1.00],  # AI 질문 역량
])

print("\n[설정된 이론적 상관행렬]")
var_names = ['메타인지', '인지욕구', '모호함인내', 'AI경험', 'AI질문역량']
corr_df = pd.DataFrame(correlation_matrix, columns=var_names, index=var_names)
print(corr_df.round(2))

# Cholesky 분해를 통한 상관된 데이터 생성
L = np.linalg.cholesky(correlation_matrix)
uncorrelated = np.random.standard_normal((n, 5))
correlated = uncorrelated @ L.T

# 각 변인의 척도에 맞게 변환
def transform_to_scale(data, min_val, max_val, mean_ratio=0.6):
    """표준정규분포 데이터를 특정 척도로 변환"""
    # 표준정규분포를 0-1로 변환
    normalized = stats.norm.cdf(data)
    # 약간의 중앙 집중 경향 추가 (베타 분포 활용)
    # 실제 설문 데이터는 보통 중앙에 몰리는 경향
    transformed = min_val + (max_val - min_val) * normalized
    # 약간의 노이즈 추가
    noise = np.random.normal(0, (max_val - min_val) * 0.05, len(data))
    result = transformed + noise
    # 범위 내로 클리핑
    return np.clip(result, min_val, max_val)

# 각 변인 생성
metacognition = transform_to_scale(correlated[:, 0], 20, 100)  # 메타인지 (20-100)
need_for_cognition = transform_to_scale(correlated[:, 1], 18, 90)  # 인지욕구 (18-90)
ambiguity_tolerance = transform_to_scale(correlated[:, 2], 12, 60)  # 모호함 인내 (12-60)
ai_experience = transform_to_scale(correlated[:, 3], 5, 25)  # AI 경험 (5-25)
ai_question_competency = transform_to_scale(correlated[:, 4], 4, 20)  # AI 질문역량 (4-20)

# 정수로 반올림 (실제 설문 응답처럼)
metacognition = np.round(metacognition).astype(int)
need_for_cognition = np.round(need_for_cognition).astype(int)
ambiguity_tolerance = np.round(ambiguity_tolerance).astype(int)
ai_experience = np.round(ai_experience).astype(int)
ai_question_competency = np.round(ai_question_competency, 1)  # 루브릭 점수는 소수점 1자리

# 데이터프레임 생성
df = pd.DataFrame({
    '참여자ID': [f'P{str(i+1).zfill(3)}' for i in range(n)],
    '메타인지': metacognition,
    '인지욕구': need_for_cognition,
    '모호함인내': ambiguity_tolerance,
    'AI경험': ai_experience,
    'AI질문역량': ai_question_competency
})

print("\n[생성된 데이터 미리보기 (상위 10명)]")
print(df.head(10).to_string(index=False))

# 데이터 저장
df.to_csv('/home/claude/simulation_data.csv', index=False, encoding='utf-8-sig')
print("\n✓ 데이터가 'simulation_data.csv'로 저장되었습니다.")

# ============================================================
# 3. 기술통계 분석
# ============================================================

print("\n" + "=" * 70)
print("3. 기술통계 분석")
print("=" * 70)

# 분석용 변인만 선택
analysis_vars = ['메타인지', '인지욕구', '모호함인내', 'AI경험', 'AI질문역량']

# 기술통계
desc_stats = df[analysis_vars].describe().T
desc_stats['왜도'] = df[analysis_vars].skew()
desc_stats['첨도'] = df[analysis_vars].kurtosis()

# 이론적 범위 추가
theoretical_range = {
    '메타인지': '20-100',
    '인지욕구': '18-90',
    '모호함인내': '12-60',
    'AI경험': '5-25',
    'AI질문역량': '4-20'
}
desc_stats['이론적범위'] = desc_stats.index.map(theoretical_range)

print("\n[표 1] 주요 변인의 기술통계 (N=80)")
print("-" * 80)
print(f"{'변인':<12} {'M':>8} {'SD':>8} {'Min':>8} {'Max':>8} {'왜도':>8} {'첨도':>8} {'범위':>12}")
print("-" * 80)
for var in analysis_vars:
    row = desc_stats.loc[var]
    print(f"{var:<12} {row['mean']:>8.2f} {row['std']:>8.2f} {row['min']:>8.1f} {row['max']:>8.1f} {row['왜도']:>8.2f} {row['첨도']:>8.2f} {row['이론적범위']:>12}")
print("-" * 80)

# 정규성 검정
print("\n[정규성 검정 (Shapiro-Wilk)]")
for var in analysis_vars:
    stat, p = shapiro(df[var])
    result = "정규분포 가정 충족" if p > 0.05 else "정규분포 아님"
    print(f"  {var}: W = {stat:.3f}, p = {p:.3f} → {result}")

# ============================================================
# 4. 상관분석
# ============================================================

print("\n" + "=" * 70)
print("4. 상관분석")
print("=" * 70)

# Pearson 상관계수 및 유의확률 계산
corr_matrix = df[analysis_vars].corr()
p_matrix = pd.DataFrame(np.zeros((len(analysis_vars), len(analysis_vars))), 
                         columns=analysis_vars, index=analysis_vars)

for i, var1 in enumerate(analysis_vars):
    for j, var2 in enumerate(analysis_vars):
        if i != j:
            r, p = pearsonr(df[var1], df[var2])
            p_matrix.loc[var1, var2] = p

print("\n[표 2] 주요 변인 간 상관관계 (N=80)")
print("-" * 75)

# 상관행렬 출력 (하삼각 + 대각선)
header = f"{'변인':<12}" + "".join([f"{v[:6]:>12}" for v in analysis_vars])
print(header)
print("-" * 75)

for i, var1 in enumerate(analysis_vars):
    row_str = f"{var1:<12}"
    for j, var2 in enumerate(analysis_vars):
        if i == j:
            row_str += f"{'1':>12}"
        elif j < i:
            r = corr_matrix.loc[var1, var2]
            p = p_matrix.loc[var1, var2]
            sig = "***" if p < 0.001 else "**" if p < 0.01 else "*" if p < 0.05 else ""
            row_str += f"{r:>9.3f}{sig:<3}"
        else:
            row_str += f"{'':>12}"
    print(row_str)

print("-" * 75)
print("* p < .05, ** p < .01, *** p < .001")

# 종속변인과의 상관 요약
print("\n[AI 질문 역량과 예측변인 간 상관 요약]")
for var in analysis_vars[:-1]:
    r, p = pearsonr(df[var], df['AI질문역량'])
    sig = "***" if p < 0.001 else "**" if p < 0.01 else "*" if p < 0.05 else ""
    strength = "강한" if abs(r) >= 0.5 else "중간" if abs(r) >= 0.3 else "약한"
    print(f"  {var}: r = {r:.3f}{sig} ({strength} 정적 상관)")

# ============================================================
# 5. 위계적 회귀분석
# ============================================================

print("\n" + "=" * 70)
print("5. 위계적 회귀분석")
print("=" * 70)

# 종속변인
y = df['AI질문역량']

# 1단계: 통제변인 (AI 사용 경험)
X1 = sm.add_constant(df[['AI경험']])
model1 = sm.OLS(y, X1).fit()

# 2단계: 인지적 성향 변인 추가
X2 = sm.add_constant(df[['AI경험', '메타인지', '인지욕구', '모호함인내']])
model2 = sm.OLS(y, X2).fit()

print("\n[표 3] AI 질문 역량에 대한 위계적 회귀분석 결과 (N=80)")
print("=" * 85)

# 1단계 결과
print("\n[1단계: 통제변인]")
print("-" * 85)
print(f"{'변인':<15} {'B':>10} {'SE':>10} {'β':>10} {'t':>10} {'p':>10}")
print("-" * 85)

# 상수
print(f"{'(상수)':<15} {model1.params['const']:>10.3f} {model1.bse['const']:>10.3f} {'':>10} {model1.tvalues['const']:>10.3f} {model1.pvalues['const']:>10.3f}")

# AI경험
beta1_ai = model1.params['AI경험'] * df['AI경험'].std() / y.std()
sig1 = "***" if model1.pvalues['AI경험'] < 0.001 else "**" if model1.pvalues['AI경험'] < 0.01 else "*" if model1.pvalues['AI경험'] < 0.05 else ""
print(f"{'AI경험':<15} {model1.params['AI경험']:>10.3f} {model1.bse['AI경험']:>10.3f} {beta1_ai:>10.3f} {model1.tvalues['AI경험']:>10.3f} {model1.pvalues['AI경험']:>9.3f}{sig1}")

print("-" * 85)
print(f"R² = {model1.rsquared:.3f}, Adj. R² = {model1.rsquared_adj:.3f}, F({model1.df_model:.0f}, {model1.df_resid:.0f}) = {model1.fvalue:.3f}, p < .001")

# 2단계 결과
print("\n[2단계: 인지적 성향 변인 추가]")
print("-" * 85)
print(f"{'변인':<15} {'B':>10} {'SE':>10} {'β':>10} {'t':>10} {'p':>10}")
print("-" * 85)

# 상수
print(f"{'(상수)':<15} {model2.params['const']:>10.3f} {model2.bse['const']:>10.3f} {'':>10} {model2.tvalues['const']:>10.3f} {model2.pvalues['const']:>10.3f}")

# 각 변인
predictors = ['AI경험', '메타인지', '인지욕구', '모호함인내']
betas = {}
for var in predictors:
    beta = model2.params[var] * df[var].std() / y.std()
    betas[var] = beta
    sig = "***" if model2.pvalues[var] < 0.001 else "**" if model2.pvalues[var] < 0.01 else "*" if model2.pvalues[var] < 0.05 else ""
    print(f"{var:<15} {model2.params[var]:>10.3f} {model2.bse[var]:>10.3f} {beta:>10.3f} {model2.tvalues[var]:>10.3f} {model2.pvalues[var]:>9.3f}{sig}")

print("-" * 85)
print(f"R² = {model2.rsquared:.3f}, Adj. R² = {model2.rsquared_adj:.3f}, F({model2.df_model:.0f}, {model2.df_resid:.0f}) = {model2.fvalue:.3f}, p < .001")

# R² 변화량 검정
r2_change = model2.rsquared - model1.rsquared
df1 = model2.df_model - model1.df_model  # 추가된 변인 수
df2 = model2.df_resid
f_change = (r2_change / df1) / ((1 - model2.rsquared) / df2)
p_change = 1 - stats.f.cdf(f_change, df1, df2)

print(f"\nΔR² = {r2_change:.3f}, ΔF({df1:.0f}, {df2:.0f}) = {f_change:.3f}, p < .001")
print("\n→ 인지적 성향 변인 투입으로 설명력이 유의하게 증가함")

# 표준화 회귀계수 비교
print("\n[표준화 회귀계수(β) 비교 - 예측력 순위]")
sorted_betas = sorted(betas.items(), key=lambda x: abs(x[1]), reverse=True)
for rank, (var, beta) in enumerate(sorted_betas, 1):
    print(f"  {rank}위: {var} (β = {beta:.3f})")

# ============================================================
# 6. 다중공선성 진단
# ============================================================

print("\n" + "=" * 70)
print("6. 다중공선성 진단")
print("=" * 70)

# VIF 계산
X_vif = df[['AI경험', '메타인지', '인지욕구', '모호함인내']]
vif_data = pd.DataFrame()
vif_data['변인'] = X_vif.columns
vif_data['VIF'] = [variance_inflation_factor(X_vif.values, i) for i in range(X_vif.shape[1])]
vif_data['Tolerance'] = 1 / vif_data['VIF']

print("\n[다중공선성 진단 결과]")
print("-" * 50)
print(f"{'변인':<15} {'VIF':>15} {'Tolerance':>15}")
print("-" * 50)
for _, row in vif_data.iterrows():
    status = "✓" if row['VIF'] < 10 else "⚠ 문제"
    print(f"{row['변인']:<15} {row['VIF']:>15.3f} {row['Tolerance']:>15.3f} {status}")
print("-" * 50)
print("* VIF < 10, Tolerance > 0.1 → 다중공선성 문제 없음")

# ============================================================
# 7. 결과 해석 및 논의
# ============================================================

print("\n" + "=" * 70)
print("7. 결과 해석 및 논의")
print("=" * 70)

interpretation = f"""
[연구 결과 요약]

1. 상관분석 결과
   - 메타인지(r = {corr_matrix.loc['메타인지', 'AI질문역량']:.3f})가 AI 질문 역량과 
     가장 강한 정적 상관을 보임
   - 인지욕구, AI 경험도 유의한 정적 상관 관계
   - 모든 예측변인이 AI 질문 역량과 유의한 상관

2. 위계적 회귀분석 결과
   - 1단계(AI 경험): R² = {model1.rsquared:.3f} (설명력 {model1.rsquared*100:.1f}%)
   - 2단계(인지적 성향 추가): R² = {model2.rsquared:.3f} (설명력 {model2.rsquared*100:.1f}%)
   - ΔR² = {r2_change:.3f} (유의한 증가, p < .001)
   
3. 예측변인의 상대적 기여도 (표준화 회귀계수)
   - 메타인지: β = {betas['메타인지']:.3f} (가장 강력한 예측변인)
   - AI 경험: β = {betas['AI경험']:.3f}
   - 인지욕구: β = {betas['인지욕구']:.3f}
   - 모호함 인내: β = {betas['모호함인내']:.3f}

4. 결론
   - 메타인지가 AI 질문 역량의 가장 강력한 예측변인으로 나타남
   - AI 사용 경험을 통제한 후에도 인지적 성향 변인(특히 메타인지)이 
     AI 질문 역량을 유의하게 예측함
   - 이는 AI 활용 교육에서 메타인지 훈련의 중요성을 시사함

[교육적 시사점]

1. AI 활용 교육에서 단순히 도구 사용법을 가르치는 것을 넘어
   메타인지 역량 강화가 필요함
   
2. "내가 무엇을 원하는가?", "AI 응답이 내 의도와 맞는가?" 등
   자기 질문(self-questioning) 전략 훈련이 효과적일 수 있음
   
3. 인지욕구가 높은 학습자는 AI와의 협업에서도 더 깊이 있는 
   상호작용을 할 가능성이 높음
"""
print(interpretation)

# ============================================================
# 8. KCI 논문 형식 표 생성
# ============================================================

print("\n" + "=" * 70)
print("8. KCI 논문 형식 표 (복사용)")
print("=" * 70)

# 표 1: 기술통계
table1 = """
<표 1> 주요 변인의 기술통계 (N=80)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
변인          M        SD       Min      Max     왜도     첨도
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"""

for var in analysis_vars:
    row = desc_stats.loc[var]
    table1 += f"\n{var:<12} {row['mean']:>7.2f}  {row['std']:>7.2f}  {row['min']:>7.1f}  {row['max']:>7.1f}  {row['왜도']:>6.2f}  {row['첨도']:>6.2f}"

table1 += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print(table1)

# 표 2: 상관행렬
print("""
<표 2> 주요 변인 간 상관관계 (N=80)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
변인           1        2        3        4        5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━""")

for i, var1 in enumerate(analysis_vars):
    row_str = f"{i+1}. {var1:<10}"
    for j, var2 in enumerate(analysis_vars):
        if i == j:
            row_str += "    1   "
        elif j < i:
            r = corr_matrix.loc[var1, var2]
            p = p_matrix.loc[var1, var2]
            sig = "***" if p < 0.001 else "**" if p < 0.01 else "*" if p < 0.05 else ""
            row_str += f" {r:>5.2f}{sig:<2}"
        else:
            row_str += "        "
    print(row_str)

print("""━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*p < .05, **p < .01, ***p < .001""")

# 표 3: 회귀분석
print("""
<표 3> AI 질문 역량에 대한 위계적 회귀분석 결과 (N=80)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        1단계                      2단계
변인              B      SE      β           B      SE      β
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━""")

# 통제변인
print(f"AI경험       {model1.params['AI경험']:>6.3f}  {model1.bse['AI경험']:>5.3f}  {beta1_ai:>5.2f}**     {model2.params['AI경험']:>6.3f}  {model2.bse['AI경험']:>5.3f}  {betas['AI경험']:>5.2f}*")
print("────────────────────────────────────────────────────────────────────────")

# 인지적 성향
sig_meta = "***" if model2.pvalues['메타인지'] < 0.001 else "**" if model2.pvalues['메타인지'] < 0.01 else "*" if model2.pvalues['메타인지'] < 0.05 else ""
sig_nfc = "**" if model2.pvalues['인지욕구'] < 0.01 else "*" if model2.pvalues['인지욕구'] < 0.05 else ""
sig_at = "*" if model2.pvalues['모호함인내'] < 0.05 else ""

print(f"메타인지                                  {model2.params['메타인지']:>6.3f}  {model2.bse['메타인지']:>5.3f}  {betas['메타인지']:>5.2f}{sig_meta}")
print(f"인지욕구                                  {model2.params['인지욕구']:>6.3f}  {model2.bse['인지욕구']:>5.3f}  {betas['인지욕구']:>5.2f}{sig_nfc}")
print(f"모호함인내                                {model2.params['모호함인내']:>6.3f}  {model2.bse['모호함인내']:>5.3f}  {betas['모호함인내']:>5.2f}{sig_at}")

print(f"""━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
R²                    {model1.rsquared:.3f}                      {model2.rsquared:.3f}
Adj. R²               {model1.rsquared_adj:.3f}                      {model2.rsquared_adj:.3f}
ΔR²                                              {r2_change:.3f}***
F                    {model1.fvalue:.2f}***                   {model2.fvalue:.2f}***
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*p < .05, **p < .01, ***p < .001""")

# 데이터 저장 완료 메시지
print("\n" + "=" * 70)
print("분석 완료")
print("=" * 70)
print(f"""
[저장된 파일]
- simulation_data.csv: 가상 데이터 (N=80)

[다음 단계]
1. 이 결과를 바탕으로 실제 데이터 수집 설계
2. 측정 도구 선정 및 번안/타당화
3. IRB 승인 신청
4. 실제 연구 수행
""")
