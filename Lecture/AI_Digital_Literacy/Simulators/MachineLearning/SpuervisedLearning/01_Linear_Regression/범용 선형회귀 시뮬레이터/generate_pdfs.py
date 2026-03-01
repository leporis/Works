#!/usr/bin/env python3
"""
선형회귀 시뮬레이터 문서 4종 → PDF 변환
이미지 삽입 매핑 (1차 라운드):
  사용설명서: #01(§3.1), #03(§2.2), #05(§9.2)
  개발일지:   #03(§2.3)
  퀵가이드:   #05(관찰포인트)
  활용가이드: (이미지 없음)
"""
import markdown
import os, re, base64
from pathlib import Path

# ── 경로 설정 ──
UPLOAD = '/mnt/user-data/uploads'
IMG = '/home/claude/images'
OUT = '/mnt/user-data/outputs'

# ── 이미지 base64 인코딩 (SVG/PNG 공통) ──
def img_to_base64(path):
    with open(path, 'rb') as f:
        data = base64.b64encode(f.read()).decode()
    ext = Path(path).suffix.lower()
    mime = 'image/svg+xml' if ext == '.svg' else 'image/png'
    return f'data:{mime};base64,{data}'

# ── 이미지 태그 생성 ──
def img_tag(path, caption='', width='100%'):
    src = img_to_base64(path)
    html = f'<figure class="img-figure"><img src="{src}" style="width:{width}; max-width:100%;"/>'
    if caption:
        html += f'<figcaption>{caption}</figcaption>'
    html += '</figure>'
    return html

# ── 마크다운 줄 단위 조작 ──
def read_lines(filename):
    path = os.path.join(UPLOAD, filename)
    with open(path, 'r', encoding='utf-8') as f:
        return f.readlines()

def replace_codeblock(lines, start_line, end_line, replacement_html):
    """코드블록(start_line~end_line, 1-indexed)을 이미지로 대체"""
    # 마크다운에서 ``` 블록을 특수 마커로 교체
    marker = f'<!--IMG_PLACEHOLDER_{start_line}-->'
    new_lines = []
    skip = False
    for i, line in enumerate(lines, 1):
        if i == start_line:
            new_lines.append(marker + '\n')
            skip = True
            continue
        if skip and i <= end_line:
            continue
        if i == end_line + 1:
            skip = False
        new_lines.append(line)
    return new_lines, marker, replacement_html

def insert_after_line(lines, after_line, insertion_html):
    """특정 줄 뒤에 HTML 삽입"""
    marker = f'<!--IMG_INSERT_{after_line}-->'
    new_lines = []
    for i, line in enumerate(lines, 1):
        new_lines.append(line)
        if i == after_line:
            new_lines.append(marker + '\n')
    return new_lines, marker, insertion_html

# ── CSS 스타일 ──
CSS = """
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap');

@page {
    size: A4;
    margin: 20mm 18mm 20mm 18mm;
    @top-center { content: ""; }
    @bottom-center { 
        content: counter(page); 
        font-family: 'Noto Sans KR', sans-serif;
        font-size: 9pt;
        color: #8D6E63;
    }
}

body {
    font-family: 'Noto Sans KR', 'Noto Sans CJK KR', sans-serif;
    font-size: 10pt;
    line-height: 1.7;
    color: #3E2723;
    background: white;
}

h1 {
    font-size: 18pt;
    font-weight: 700;
    color: #E53935;
    border-bottom: 3px solid #E53935;
    padding-bottom: 8px;
    margin-top: 0;
    page-break-after: avoid;
}

h2 {
    font-size: 14pt;
    font-weight: 700;
    color: #C62828;
    border-bottom: 1.5px solid #FFCCBC;
    padding-bottom: 4px;
    margin-top: 24px;
    page-break-after: avoid;
}

h3 {
    font-size: 12pt;
    font-weight: 600;
    color: #5D4037;
    margin-top: 18px;
    page-break-after: avoid;
}

h4 {
    font-size: 10.5pt;
    font-weight: 600;
    color: #5D4037;
    margin-top: 14px;
}

table {
    border-collapse: collapse;
    width: 100%;
    margin: 10px 0;
    font-size: 9pt;
    page-break-inside: avoid;
}

th {
    background: #FFF3E0;
    color: #5D4037;
    font-weight: 600;
    border: 1px solid #FFCCBC;
    padding: 6px 8px;
    text-align: left;
}

td {
    border: 1px solid #FFCCBC;
    padding: 5px 8px;
    vertical-align: top;
}

tr:nth-child(even) td {
    background: #FFFBF5;
}

code {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 8.5pt;
    background: #FFF3E0;
    padding: 1px 4px;
    border-radius: 3px;
    color: #C62828;
}

pre {
    background: #FFFBF5;
    border: 1px solid #FFCCBC;
    border-left: 4px solid #E53935;
    padding: 10px 14px;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 8pt;
    line-height: 1.5;
    overflow-x: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
    page-break-inside: avoid;
    border-radius: 0 6px 6px 0;
}

pre code {
    background: none;
    padding: 0;
    font-size: 8pt;
}

blockquote {
    border-left: 4px solid #FFC107;
    background: #FFFDE7;
    margin: 12px 0;
    padding: 8px 14px;
    color: #5D4037;
    font-size: 9.5pt;
    page-break-inside: avoid;
}

hr {
    border: none;
    border-top: 1px solid #FFCCBC;
    margin: 20px 0;
}

strong {
    color: #3E2723;
}

a {
    color: #1E88E5;
    text-decoration: none;
}

ul, ol {
    margin: 6px 0;
    padding-left: 24px;
}

li {
    margin: 3px 0;
}

.img-figure {
    text-align: center;
    margin: 16px 0;
    page-break-inside: avoid;
}

.img-figure img {
    border: 1px solid #FFCCBC;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.img-figure figcaption {
    font-size: 8.5pt;
    color: #8D6E63;
    margin-top: 6px;
    font-style: italic;
}
"""

def md_to_pdf(md_lines, replacements, output_path, title=''):
    """마크다운(줄 리스트) → HTML → PDF"""
    # 1) 마커 삽입 및 치환 맵 구축
    #    줄번호 밀림 방지: 높은 줄번호부터 역순 처리
    marker_map = {}
    
    # 정렬 키: replace는 start, insert는 after 기준 → 역순
    def sort_key(a):
        if a['type'] == 'replace':
            return a['start']
        elif a['type'] == 'insert':
            return a['after']
        return 0
    
    sorted_replacements = sorted(replacements, key=sort_key, reverse=True)
    
    for action in sorted_replacements:
        if action['type'] == 'replace':
            md_lines, marker, html = replace_codeblock(
                md_lines, action['start'], action['end'], action['html'])
            marker_map[marker] = html
        elif action['type'] == 'insert':
            md_lines, marker, html = insert_after_line(
                md_lines, action['after'], action['html'])
            marker_map[marker] = html

    # 2) 마크다운 → HTML
    md_text = ''.join(md_lines)
    html_body = markdown.markdown(md_text, extensions=[
        'tables', 'fenced_code', 'toc', 'sane_lists'
    ])

    # 3) 마커를 실제 이미지 HTML로 치환
    for marker, img_html in marker_map.items():
        # markdown might wrap the comment in <p> tags
        html_body = html_body.replace(f'<p>{marker}</p>', img_html)
        html_body = html_body.replace(marker, img_html)

    # 4) 전체 HTML 조립
    full_html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<title>{title}</title>
<style>{CSS}</style>
</head>
<body>
{html_body}
</body>
</html>"""

    # 5) PDF 생성
    from weasyprint import HTML
    HTML(string=full_html).write_pdf(output_path)
    size_kb = os.path.getsize(output_path) / 1024
    print(f"  ✅ {os.path.basename(output_path)} ({size_kb:.0f}KB)")

# ── 이미지 경로 ──
IMG01 = os.path.join(IMG, '사용설명서_01_전체레이아웃_학습모드.png')
IMG03 = os.path.join(IMG, '사용설명서_03_데이터흐름도.png')
IMG05 = os.path.join(IMG, '사용설명서_05_손실그래프_패턴3종.png')
IMG_DEV_LAYOUT = os.path.join(IMG, '개발일지_02_화면구성.png')
IMG_QG_LAYOUT = os.path.join(IMG, '퀵가이드_01_화면구성.png')

# ═══════════════════════════════════════════════
# 1. 사용설명서 PDF
# ═══════════════════════════════════════════════
print("📄 1/4 사용설명서 PDF 생성...")
lines = read_lines('선형회귀_시뮬레이터_사용설명서_v2_0_0_0_아키텍처정비_2026-02-14.md')
replacements = [
    # §3.1 전체 레이아웃 ASCII (lines 94-110) → #01
    {
        'type': 'replace',
        'start': 94, 'end': 110,
        'html': img_tag(IMG01, '그림 1: 전체 레이아웃 — 학습 모드 (3열 그리드)', '95%')
    },
    # §2.2 기본 워크플로우 ASCII 뒤 (line 84) → #03 삽입
    {
        'type': 'insert',
        'after': 84,
        'html': img_tag(IMG03, '그림 2: 데이터 흐름도 — 8단계 파이프라인', '100%')
    },
    # §9.2 손실 그래프 설명 뒤 (line 403) → #05 삽입
    {
        'type': 'insert',
        'after': 403,
        'html': img_tag(IMG05, '그림 3: 손실 그래프 패턴 3종 — 정상 수렴 / 학습률 과대 / 에포크 부족', '100%')
    },
]
md_to_pdf(lines, replacements,
          os.path.join(OUT, '선형회귀_시뮬레이터_사용설명서_v2_0_0_0.pdf'),
          '선형 회귀 학습 시뮬레이터 사용설명서')

# ═══════════════════════════════════════════════
# 2. 개발일지 PDF
# ═══════════════════════════════════════════════
print("📄 2/4 개발일지 PDF 생성...")
lines = read_lines('선형회귀_시뮬레이터_개발일지_v2_0_0_0_아키텍처정비_2026-02-14.md')
replacements = [
    # §2.3 데이터 흐름 ASCII (lines 56-77) → #03
    {
        'type': 'replace',
        'start': 56, 'end': 77,
        'html': img_tag(IMG03, '그림 1: 데이터 흐름도 — 8단계 파이프라인', '100%')
    },
    # §4 화면 구성 ASCII (lines 150-181) → 화면구성도
    {
        'type': 'replace',
        'start': 150, 'end': 181,
        'html': img_tag(IMG_DEV_LAYOUT, '그림 2: 화면 구성 — 3열 그리드 레이아웃', '100%')
    },
]
md_to_pdf(lines, replacements,
          os.path.join(OUT, '선형회귀_시뮬레이터_개발일지_v2_0_0_0.pdf'),
          '선형 회귀 학습 시뮬레이터 개발일지')

# ═══════════════════════════════════════════════
# 3. 퀵가이드 PDF
# ═══════════════════════════════════════════════
print("📄 3/4 퀵가이드 PDF 생성...")
lines = read_lines('선형회귀_시뮬레이터_퀵가이드_v2_0_0_0_아키텍처정비_2026-02-14.md')
replacements = [
    # 화면 구성 ASCII (lines 102-119) → 화면구성도
    {
        'type': 'replace',
        'start': 102, 'end': 119,
        'html': img_tag(IMG_QG_LAYOUT, '그림 1: 화면 구성 개요 — 4영역', '100%')
    },
    # 관찰 포인트 테이블 뒤 (line 97) → #05 삽입
    {
        'type': 'insert',
        'after': 97,
        'html': img_tag(IMG05, '그림 2: 손실 그래프 패턴 3종 — 관찰 포인트 참고', '100%')
    },
]
md_to_pdf(lines, replacements,
          os.path.join(OUT, '선형회귀_시뮬레이터_퀵가이드_v2_0_0_0.pdf'),
          '선형 회귀 학습 시뮬레이터 퀵가이드')

# ═══════════════════════════════════════════════
# 4. 활용가이드 PDF (이미지 없음)
# ═══════════════════════════════════════════════
print("📄 4/4 활용가이드 PDF 생성...")
lines = read_lines('선형회귀_시뮬레이터_활용가이드_v2_0_0_0_아키텍처정비_2026-02-14.md')
md_to_pdf(lines, [],
          os.path.join(OUT, '선형회귀_시뮬레이터_활용가이드_v2_0_0_0.pdf'),
          '선형 회귀 학습 시뮬레이터 활용가이드')

print("\n🎉 4종 PDF 생성 완료!")
