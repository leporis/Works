#!/usr/bin/env python3
"""
#05 손실 그래프 패턴 3종
- 정상 수렴, 학습률 과대, 에포크 부족
- 시뮬레이터 색상 팔레트 적용
"""
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm

# 한글 폰트 설정
font_path = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
font_prop = fm.FontProperties(fname=font_path)
font_prop_bold = fm.FontProperties(fname='/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc')

plt.rcParams['axes.unicode_minus'] = False

# 시뮬레이터 색상 팔레트
RED = '#E53935'
BLUE = '#1E88E5'
GREEN = '#43A047'
YELLOW = '#FFC107'
ORANGE = '#FF5722'
BROWN_DARK = '#3E2723'
BROWN_MED = '#5D4037'
BROWN_LIGHT = '#8D6E63'
CREAM_BG = '#FFFBF5'
CREAM_DARK = '#FFF3E0'
PEACH = '#FFCCBC'

# 데이터 생성 (경사 하강법 시뮬레이션)
np.random.seed(42)
epochs_full = np.arange(1, 501)
epochs_short = np.arange(1, 101)

# 패턴 1: 정상 수렴 (lr=0.01, ep=500)
train_loss_normal = 80 * np.exp(-0.008 * epochs_full) + 22 + np.random.normal(0, 0.8, 500)
test_loss_normal = 80 * np.exp(-0.007 * epochs_full) + 25 + np.random.normal(0, 1.0, 500)
train_loss_normal = np.maximum(train_loss_normal, 20)
test_loss_normal = np.maximum(test_loss_normal, 23)

# 패턴 2: 학습률 과대 (lr=0.1, ep=500)
base_oscillation = 50 + 30 * np.sin(0.06 * epochs_full) * np.exp(-0.002 * epochs_full)
train_loss_high_lr = base_oscillation + np.random.normal(0, 5, 500)
test_loss_high_lr = base_oscillation + 8 + np.random.normal(0, 6, 500)
train_loss_high_lr = np.maximum(train_loss_high_lr, 15)
test_loss_high_lr = np.maximum(test_loss_high_lr, 20)

# 패턴 3: 에포크 부족 (lr=0.01, ep=100)
train_loss_short = 80 * np.exp(-0.008 * epochs_short) + 22 + np.random.normal(0, 0.8, 100)
test_loss_short = 80 * np.exp(-0.007 * epochs_short) + 25 + np.random.normal(0, 1.0, 100)
train_loss_short = np.maximum(train_loss_short, 20)
test_loss_short = np.maximum(test_loss_short, 23)

# 그림 생성
fig, axes = plt.subplots(1, 3, figsize=(15, 5))
fig.patch.set_facecolor(CREAM_BG)

panels = [
    {
        'ax': axes[0],
        'title': '[정상] 안정 수렴',
        'subtitle': 'lr=0.01, 에포크=500',
        'desc': '→ L자 안정 하강',
        'epochs': epochs_full,
        'train': train_loss_normal,
        'test': test_loss_normal,
        'title_color': GREEN,
        'border_color': GREEN,
    },
    {
        'ax': axes[1],
        'title': '[주의] 학습률 과대',
        'subtitle': 'lr=0.1, 에포크=500',
        'desc': '→ 요동 / 발산',
        'epochs': epochs_full,
        'train': train_loss_high_lr,
        'test': test_loss_high_lr,
        'title_color': ORANGE,
        'border_color': ORANGE,
    },
    {
        'ax': axes[2],
        'title': '[실패] 에포크 부족',
        'subtitle': 'lr=0.01, 에포크=100',
        'desc': '→ 미수렴 중 종료',
        'epochs': epochs_short,
        'train': train_loss_short,
        'test': test_loss_short,
        'title_color': RED,
        'border_color': RED,
    },
]

for p in panels:
    ax = p['ax']
    ax.set_facecolor(CREAM_BG)
    
    # 데이터 플롯
    ax.plot(p['epochs'], p['train'], color=RED, linewidth=1.8, alpha=0.9, label='훈련 MSE')
    ax.plot(p['epochs'], p['test'], color=BLUE, linewidth=1.2, alpha=0.7, linestyle='--', label='테스트 MSE')
    
    # 제목
    ax.set_title(p['title'], fontproperties=font_prop_bold, fontsize=16, color=p['title_color'], pad=12)
    
    # 부제목 + 설명
    ax.text(0.5, -0.15, p['subtitle'], transform=ax.transAxes, ha='center',
            fontproperties=font_prop, fontsize=10, color=BROWN_MED)
    ax.text(0.5, -0.22, p['desc'], transform=ax.transAxes, ha='center',
            fontproperties=font_prop, fontsize=9.5, color=BROWN_LIGHT)
    
    # 축 레이블
    ax.set_xlabel('에포크 (Epoch)', fontproperties=font_prop, fontsize=10, color=BROWN_MED)
    ax.set_ylabel('손실 (MSE)', fontproperties=font_prop, fontsize=10, color=BROWN_MED)
    
    # 스타일
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color(PEACH)
    ax.spines['bottom'].set_color(PEACH)
    ax.tick_params(colors=BROWN_LIGHT, labelsize=9)
    ax.grid(True, alpha=0.2, color=BROWN_LIGHT)
    
    # 범례
    legend = ax.legend(prop=font_prop, fontsize=9, loc='upper right',
                       framealpha=0.8, edgecolor=PEACH)
    
    # 테두리 강조 (하단)
    ax.spines['bottom'].set_linewidth(1.5)
    ax.spines['bottom'].set_color(p['border_color'])

# 패턴 3: 미수렴 영역 표시
axes[2].axvline(x=100, color=RED, linestyle=':', linewidth=1.5, alpha=0.5)
axes[2].annotate('여기서\n종료', xy=(100, 55), fontproperties=font_prop,
                 fontsize=9, color=RED, ha='center',
                 arrowprops=dict(arrowstyle='->', color=RED, lw=1.2))

# 패턴 3: 아직 수렴 안 됨 표시 (점선으로 이후 예상 경로)
epochs_ext = np.arange(100, 501)
train_ext = 80 * np.exp(-0.008 * epochs_ext) + 22
axes[2].plot(epochs_ext, train_ext, color=RED, linewidth=1, alpha=0.25, linestyle=':')
axes[2].set_xlim(0, 500)
axes[2].text(300, 35, '(수렴 예상 경로)', fontproperties=font_prop,
             fontsize=8, color=BROWN_LIGHT, alpha=0.6, ha='center')

plt.tight_layout(pad=2.0)
plt.subplots_adjust(bottom=0.22)

# 저장
plt.savefig('/home/claude/images/사용설명서_05_손실그래프_패턴3종.png',
            dpi=150, bbox_inches='tight', facecolor=CREAM_BG)
plt.savefig('/home/claude/images/사용설명서_05_손실그래프_패턴3종_2x.png',
            dpi=300, bbox_inches='tight', facecolor=CREAM_BG)
print("✅ 손실 그래프 3종 생성 완료")
