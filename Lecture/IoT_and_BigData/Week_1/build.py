#!/usr/bin/env python3
"""MakeCode시뮬레이터LED이름표시 문서 PDF 빌드 스크립트 v3
   컬러 이모지(심볼) + 테이블 폭 고정 + keepaspectratio"""

import os
import re
import subprocess
import shutil

WORK = "/home/claude"
UPLOADS = "/mnt/user-data/uploads"
OUTPUTS = "/mnt/user-data/outputs"

# === 이모지 → 플레이스홀더 → fix_tex에서 \textcolor 로 교체 ===
# (emoji, placeholder, color, symbol)
EMOJI_DEFS = [
    ('🔮', 'XEMJ01X', 'purple',            '◆'),
    ('📖', 'XEMJ02X', 'blue!70!black',     '■'),
    ('⚡', 'XEMJ03X', 'orange',             '★'),
    ('🚀', 'XEMJ04X', 'teal',              '▶'),
    ('🔄', 'XEMJ05X', 'green!60!black',    '↻'),
    ('❤️','XEMJ06X', 'red',                '♥'),
    ('♥️', 'XEMJ06X', 'red',               '♥'),
    ('▶️', 'XEMJ07X', 'teal!80!black',     '▶'),
    ('⏹️', 'XEMJ08X', 'gray!70!black',     '■'),
    ('⬇️', 'XEMJ09X', 'blue!60!black',     '↓'),
    ('❓', 'XEMJ10X', 'orange!80!red',      '?'),
    ('🎯', 'XEMJ11X', 'red!80!black',      '◎'),
    ('🆘', 'XEMJ12X', 'red',               '●'),
    ('🔑', 'XEMJ13X', 'orange!70!black',   '◆'),
    ('💭', 'XEMJ14X', 'cyan!60!black',     '◇'),
    ('🎮', 'XEMJ15X', 'purple!70!black',   '◆'),
    ('📘', 'XEMJ16X', 'blue',              '■'),
    ('🎓', 'XEMJ17X', 'blue!80!black',     '◆'),
    ('🔧', 'XEMJ18X', 'gray!70!black',     '◆'),
    ('💡', 'XEMJ19X', 'yellow!70!orange',  '★'),
    ('📝', 'XEMJ20X', 'blue!60!black',     '■'),
    ('🌟', 'XEMJ21X', 'orange!80!yellow',  '★'),
    ('⭐', 'XEMJ22X', 'orange!90!yellow',  '★'),
    ('⚠️', 'XEMJ23X', 'orange!80!red',     '▲'),
    ('🔲', 'XEMJ24X', 'gray!60!black',     '■'),
    ('🔍', 'XEMJ25X', 'blue!70!black',     '◎'),
    ('✅', 'XEMJ26X', 'green!70!black',    '✓'),
    ('🔴', 'XEMJ27X', 'red',               '●'),
    ('🖥️','XEMJ28X', 'gray!60!black',     '■'),
    ('📚', 'XEMJ29X', 'blue!60!black',     '■'),
    ('🎉', 'XEMJ30X', 'purple!70!black',   '★'),
    ('❌', 'XEMJ31X', 'red',               '✗'),
    ('✨', 'XEMJ32X', 'orange!80!yellow',  '★'),
    ('👆', 'XEMJ33X', 'orange!70!black',   '↑'),
    ('👉', 'XEMJ34X', 'orange!70!black',   '→'),
    ('🏠', 'XEMJ35X', 'brown!70!black',    '■'),
    ('📋', 'XEMJ36X', 'brown!60!black',    '■'),
    ('🛠️','XEMJ37X', 'gray!70!black',     '◆'),
    ('📊', 'XEMJ38X', 'green!60!black',    '■'),
    ('🔗', 'XEMJ39X', 'blue!60!black',     '◆'),
    ('📌', 'XEMJ40X', 'red!70!black',      '●'),
    ('🧩', 'XEMJ41X', 'purple!60!black',   '◆'),
    ('🎨', 'XEMJ42X', 'purple!70!black',   '◆'),
    ('🤔', 'XEMJ43X', 'orange!60!black',   '?'),
    ('💻', 'XEMJ44X', 'gray!60!black',     '■'),
    ('⏰', 'XEMJ45X', 'red!60!black',      '◎'),
    ('📐', 'XEMJ46X', 'blue!70!black',     '▲'),
    ('🧪', 'XEMJ47X', 'purple!70!black',   '◆'),
    ('🔥', 'XEMJ48X', 'red!80!orange',     '★'),
    ('✏️', 'XEMJ49X', 'orange!70!black',   '■'),
    ('🎲', 'XEMJ50X', 'red!60!black',      '◆'),
    ('📎', 'XEMJ51X', 'gray!60!black',     '◆'),
    ('🌈', 'XEMJ52X', 'purple!60!blue',    '★'),
    ('🏃', 'XEMJ53X', 'teal!70!black',     '▶'),
    ('💪', 'XEMJ54X', 'orange!70!black',   '★'),
    ('🎵', 'XEMJ55X', 'purple!70!black',   '♪'),
    ('🌍', 'XEMJ56X', 'green!60!blue',     '●'),
    ('📡', 'XEMJ57X', 'blue!70!black',     '◆'),
    ('⚙️', 'XEMJ58X', 'gray!60!black',     '◆'),
    ('🗑️','XEMJ59X', 'red!60!black',      '✗'),
    ('➡️', 'XEMJ60X', 'blue!70!black',     '→'),
    ('1️⃣', 'XEMJ61X', 'blue!70!black',    '①'),
    ('2️⃣', 'XEMJ62X', 'blue!70!black',    '②'),
    ('3️⃣', 'XEMJ63X', 'blue!70!black',    '③'),
    ('4️⃣', 'XEMJ64X', 'blue!70!black',    '④'),
    ('5️⃣', 'XEMJ65X', 'blue!70!black',    '⑤'),
]

# 빌드용 변환 테이블
EMOJI_TO_PLACEHOLDER = {}
PLACEHOLDER_TO_LATEX = {}
for emoji, ph, color, sym in EMOJI_DEFS:
    EMOJI_TO_PLACEHOLDER[emoji] = ph
    PLACEHOLDER_TO_LATEX[ph] = f'\\textcolor{{{color}}}{{{sym}}}'

# === 문서 정의 ===
DOCS = {
    "개발일지": {
        "md": f"{WORK}/MakeCode시뮬레이터LED이름표시_개발일지_v1_0_0_0_초안작성_2026-02-19_2100.md",
        "title": "MakeCode 시뮬레이터 LED 이름 표시 — 개발일지",
        "pdf_name": "MakeCode시뮬레이터LED이름표시_개발일지_v1.0.0.0_초안작성_2026-02-19_2100.pdf",
    },
    "퀵가이드": {
        "md": f"{WORK}/quickguide_v1.md",
        "title": "MakeCode 시뮬레이터 LED 이름 표시 — 퀵가이드",
        "pdf_name": "MakeCode시뮬레이터LED이름표시_퀵가이드_v1.0.0.0_초안작성_2026-02-19_2100.pdf",
    },
    "사용설명서": {
        "md": f"{WORK}/MakeCode시뮬레이터LED이름표시_사용설명서_v1_0_0_0_초안작성_2026-02-19_2100.md",
        "title": "MakeCode 시뮬레이터 LED 이름 표시 — 사용설명서",
        "pdf_name": "MakeCode시뮬레이터LED이름표시_사용설명서_v1.0.0.0_초안작성_2026-02-19_2100.pdf",
    },
    "활용가이드": {
        "md": f"{WORK}/MakeCode시뮬레이터LED이름표시_활용가이드_v1_0_0_0_초안작성_2026-02-19_2100.md",
        "title": "MakeCode 시뮬레이터 LED 이름 표시 — 활용가이드",
        "pdf_name": "MakeCode시뮬레이터LED이름표시_활용가이드_v1.0.0.0_초안작성_2026-02-19_2100.pdf",
    },
    "이론해설서": {
        "md": f"{WORK}/MakeCode시뮬레이터LED이름표시_이론해설서_v1_0_0_0_초안작성_2026-02-19_2100.md",
        "title": "MakeCode 시뮬레이터 LED 이름 표시 — 이론해설서",
        "pdf_name": "MakeCode시뮬레이터LED이름표시_이론해설서_v1.0.0.0_초안작성_2026-02-19_2100.pdf",
    },
    "이미지관리": {
        "md": f"{WORK}/MakeCode시뮬레이터LED이름표시_이미지관리_v1_0_0_0_초안작성_2026-02-19_2130.md",
        "title": "MakeCode 시뮬레이터 LED 이름 표시 — 이미지관리",
        "pdf_name": "MakeCode시뮬레이터LED이름표시_이미지관리_v1.0.0.0_초안작성_2026-02-19_2130.pdf",
    },
}


def img_path(name, ext="pdf"):
    return os.path.join(WORK, f"{name}.{ext}")


def preprocess(content):
    """MD 전처리: 이모지→플레이스홀더, H1 제거, 메타라인 제거, 수동번호 제거"""
    lines = content.split('\n')
    result = []
    skip_meta = True
    for line in lines:
        if line.startswith('# ') and not line.startswith('## '):
            continue
        if skip_meta and line.startswith('**') and ('문서 버전' in line or '시뮬레이터 버전' in line):
            continue
        if line.strip() == '---':
            skip_meta = False
        line = re.sub(r'^(#{2,})\s+\d+\.[\d.]*\s+', r'\1 ', line)
        result.append(line)

    text = '\n'.join(result)

    # 이모지 → 플레이스홀더 (길이가 긴 이모지부터 교체 - 복합 이모지 우선)
    sorted_emojis = sorted(EMOJI_TO_PLACEHOLDER.keys(), key=len, reverse=True)
    for emoji in sorted_emojis:
        text = text.replace(emoji, EMOJI_TO_PLACEHOLDER[emoji])

    # 나머지 이모지 제거
    remaining = re.compile(
        "["
        "\U0001F300-\U0001F9FF"
        "\U0001FA00-\U0001FAFF"
        "\U00002702-\U000027B0"
        "\U0000FE00-\U0000FE0F"
        "\U0000200D"
        "\U000020E3"
        "]+", flags=re.UNICODE
    )
    text = remaining.sub('', text)
    return text


def insert_after_heading(content, heading_keyword, img_md):
    lines = content.split('\n')
    result = []
    inserted = False
    for line in lines:
        result.append(line)
        if not inserted and line.startswith('#') and heading_keyword in line:
            result.append('')
            result.append(img_md)
            result.append('')
            inserted = True
    return '\n'.join(result)


def insert_after_text(content, text_match, img_md):
    lines = content.split('\n')
    result = []
    inserted = False
    for line in lines:
        result.append(line)
        if not inserted and text_match in line:
            result.append('')
            result.append(img_md)
            result.append('')
            inserted = True
    return '\n'.join(result)


def make_img_md(name, caption="", ext="pdf", width=""):
    path = img_path(name, ext)
    if width:
        return f'![{caption}]({path}){{ width={width} }}'
    return f'![{caption}]({path})'


def add_images(doc_key, content):
    if doc_key == "개발일지":
        content = insert_after_heading(content, "넓은 화면", make_img_md("공통_03_전체레이아웃3열", "3열 레이아웃", width="95%"))
        content = insert_after_heading(content, "좁은 화면", make_img_md("공통_04_전체레이아웃1열", "1열 레이아웃", width="45%"))
    elif doc_key == "퀵가이드":
        content = insert_after_heading(content, "화면 구성", make_img_md("공통_03_전체레이아웃3열", "화면 구성", width="95%"))
    elif doc_key == "사용설명서":
        content = insert_after_heading(content, "전체 레이아웃", make_img_md("공통_03_전체레이아웃3열", "3열 레이아웃", width="95%"))
        content = insert_after_heading(content, "좌표 체계", make_img_md("공통_05_LED좌표체계", "LED 좌표 체계", width="50%"))
        content = insert_after_heading(content, "브레이크포인트", make_img_md("공통_04_전체레이아웃1열", "1열 레이아웃", width="45%"))
        content = insert_after_heading(content, "실행 순서", make_img_md("공통_06_실행순서흐름도", "실행 순서 흐름도", width="55%"))
    elif doc_key == "활용가이드":
        content = insert_after_heading(content, "기본 수업 흐름", make_img_md("활용가이드_01_수업흐름도", "수업 흐름도", width="95%"))
    elif doc_key == "이론해설서":
        content = insert_after_heading(content, "이벤트 구동", make_img_md("이론해설서_02_이벤트구동모델", "이벤트 구동 모델", width="80%"))
        content = insert_after_heading(content, "LED 매트릭스란", make_img_md("공통_05_LED좌표체계", "LED 좌표 체계", width="50%"))
        content = insert_after_heading(content, "비트맵 폰트", make_img_md("이론해설서_01_LED비트맵A", "LED 비트맵", width="70%"))
        content = insert_after_heading(content, "드래그 앤 드롭의 원리", make_img_md("이론해설서_03_드래그앤드롭시퀀스", "DnD 시퀀스", width="80%"))
        content = insert_after_heading(content, "비동기 실행", make_img_md("이론해설서_04_동기비동기비교", "동기/비동기 비교", width="80%"))
        content = insert_after_text(content, "블록을 배치하면:", make_img_md("이론해설서_05_순차실행블록", "순차 실행 블록", width="70%"))
    return content


def estimate_display_width(text):
    """텍스트의 표시 폭 추정 (한글=2, 영문/숫자=1, LaTeX 명령 제거)."""
    # LaTeX 명령 제거
    s = re.sub(r'\\textbf\{([^}]*)\}', r'\1', text)
    s = re.sub(r'\\textcolor\{[^}]*\}\{([^}]*)\}', r'\1', s)
    s = re.sub(r'\\texttt\{([^}]*)\}', r'\1', s)
    s = re.sub(r'\\emph\{([^}]*)\}', r'\1', s)
    s = re.sub(r'\\url\{([^}]*)\}', r'\1', s)
    s = re.sub(r'\\href\{[^}]*\}\{([^}]*)\}', r'\1', s)
    s = re.sub(r'\\[a-zA-Z]+\{([^}]*)\}', r'\1', s)  # 기타 1인자 명령
    s = re.sub(r'\\[a-zA-Z]+', '', s)  # 인자 없는 명령
    s = re.sub(r'[{}]', '', s)
    s = re.sub(r'\\allowbreak', '', s)
    s = s.replace('~', ' ').replace('\\&', '&')
    # 표시 폭 계산
    width = 0
    for ch in s:
        cp = ord(ch)
        if (0xAC00 <= cp <= 0xD7AF or   # 한글 음절
            0x3000 <= cp <= 0x9FFF or    # CJK
            0xF900 <= cp <= 0xFAFF or    # CJK 호환
            0xFF00 <= cp <= 0xFFEF):     # 전각
            width += 2
        elif ch in ' \t\n':
            width += 0.5
        else:
            width += 1
    return width


def auto_rebalance_columns(tex):
    """모든 longtable의 열 폭을 셀 내용 기반으로 자동 재배분.
    짧은 열 우선 배정, 긴 열에 나머지 공간 비례 배분."""

    def extract_data_rows(block):
        r"""longtable 본문에서 데이터 행 추출.
        Pandoc 구조: \endhead -> \bottomrule -> \endlastfoot -> [데이터] -> \end{longtable}"""
        # \endlastfoot 이후가 데이터 영역
        endlastfoot = block.find('\\endlastfoot')
        if endlastfoot >= 0:
            body = block[endlastfoot + len('\\endlastfoot'):]
        else:
            # fallback: \midrule 이후
            midrule = block.rfind('\\midrule')
            if midrule >= 0:
                body = block[midrule + len('\\midrule'):]
            else:
                body = block

        # \end{longtable} 이전까지
        end_table = body.find('\\end{longtable}')
        if end_table >= 0:
            body = body[:end_table]

        # 행 분리 (\\로 구분)
        rows = re.split(r'\\\\', body)
        return [r.strip() for r in rows if r.strip()]

    def extract_header_cells(block):
        """헤더 셀 추출 (minipage 패턴 또는 toprule~midrule 사이)."""
        # minipage 헤더 패턴
        headers = re.findall(
            r'\\begin\{minipage\}.*?\\raggedright\s*\n(.*?)\n\\end\{minipage\}',
            block, re.DOTALL
        )
        if headers:
            return headers
        # 단순 패턴: toprule ~ midrule 사이
        top = block.find('\\toprule')
        mid = block.find('\\midrule')
        if top >= 0 and mid >= 0:
            header_section = block[top:mid]
            # & 로 구분
            header_row = re.sub(r'\\toprule.*?\n', '', header_section).strip()
            header_row = re.sub(r'\\\\\s*$', '', header_row)
            return [c.strip() for c in header_row.split('&')]
        return []

    def rebalance_table(match):
        block = match.group(0)

        # 열 사양 추출
        colspec_area = re.search(
            r'\\begin\{longtable\}\[\]\{(@\{\}.*?@\{\})\}',
            block, re.DOTALL
        )
        if not colspec_area:
            return block

        colspec_str = colspec_area.group(1)

        # p{} 열 정보 추출
        col_defs = re.findall(
            r'>\{(\\(?:raggedright|centering|raggedleft)\\arraybackslash)\}'
            r'p\{\(\\columnwidth - (\d+)\\tabcolsep\) \* \\real\{([\d.]+)\}\}',
            colspec_str
        )

        if not col_defs:
            # p{} 열이 없는 auto-width 테이블 (clr) → p{} 전체폭으로 변환
            clr_match = re.search(r'\\begin\{longtable\}\[\]\{@\{\}([clr]+)@\{\}\}', block)
            if clr_match:
                cols = list(clr_match.group(1))
                n = len(cols)
                if n < 2:
                    return block
                # 데이터 행에서 셀 폭 분석
                data_rows = extract_data_rows(block)
                col_widths = [0.0] * n
                for row in data_rows:
                    cells = row.split('&')
                    for i, cell in enumerate(cells[:n]):
                        w = estimate_display_width(cell.strip())
                        col_widths[i] = max(col_widths[i], w)
                # 헤더 (clr 테이블은 minipage 없이 toprule~midrule 사이)
                header_cells = extract_header_cells(block)
                for i, h in enumerate(header_cells[:n]):
                    col_widths[i] = max(col_widths[i], estimate_display_width(h))
                # 빈 셀 최소값
                for i in range(n):
                    if col_widths[i] < 1:
                        col_widths[i] = 8.0  # 작성란용 최소 폭
                # 배분 알고리즘 적용
                LINE_CHARS = 30.0
                COMPACT_LIMIT = 0.22
                natural_ratios = [w / LINE_CHARS for w in col_widths]
                allocated = [0.0] * n
                short_used = 0.0
                long_indices = []
                for i in range(n):
                    if natural_ratios[i] <= COMPACT_LIMIT:
                        alloc = max(natural_ratios[i] * 1.3, 0.05)
                        allocated[i] = min(alloc, COMPACT_LIMIT)
                        short_used += allocated[i]
                    else:
                        long_indices.append(i)
                remaining = max(1.0 - short_used, 0.1)
                if long_indices:
                    lt = sum(col_widths[i] for i in long_indices)
                    if lt > 0:
                        for i in long_indices:
                            allocated[i] = remaining * (col_widths[i] / lt)
                else:
                    tw = sum(col_widths)
                    if tw > 0:
                        allocated = [w / tw for w in col_widths]
                    else:
                        allocated = [1.0 / n] * n
                total_a = sum(allocated)
                if total_a > 0:
                    allocated = [a / total_a for a in allocated]
                sep_count = (n - 1) * 2
                new_cols = []
                for i, c in enumerate(cols):
                    align = '\\centering\\arraybackslash' if c == 'c' else '\\raggedright\\arraybackslash'
                    new_cols.append(f'  >{{{align}}}p{{(\\columnwidth - {sep_count}\\tabcolsep) * \\real{{{allocated[i]:.4f}}}}}')
                new_spec = '@{}\n' + '\n'.join(new_cols) + '@{}'
                new_begin = f'\\begin{{longtable}}[]{{{new_spec}}}'
                old_begin = re.search(r'\\begin\{longtable\}\[\]\{@\{\}[clr]+@\{\}\}', block)
                if old_begin:
                    return block.replace(old_begin.group(0), new_begin)
            return block

        n_cols = len(col_defs)
        alignments = [d[0] for d in col_defs]
        tabsep_count = int(col_defs[0][1])

        # 헤더 셀 추출
        header_cells = extract_header_cells(block)

        # 데이터 행 추출
        data_rows = extract_data_rows(block)

        # 열별 최대 표시 폭 계산
        col_widths = [0.0] * n_cols

        # 헤더 폭
        for i, h in enumerate(header_cells[:n_cols]):
            col_widths[i] = max(col_widths[i], estimate_display_width(h))

        # 데이터 행 폭
        for row in data_rows:
            cells = row.split('&')
            for i, cell in enumerate(cells[:n_cols]):
                w = estimate_display_width(cell.strip())
                col_widths[i] = max(col_widths[i], w)

        # 폭이 0인 열(빈 셀)에 최소값 배정
        for i in range(n_cols):
            if col_widths[i] < 1:
                col_widths[i] = 3.0  # 최소 3 (빈 작성란)

        # --- 배분 알고리즘: 짧은 열 우선 compact 배정 ---
        # A4 텍스트 영역 약 15cm, 10pt 기준 한글 1자 ≈ 0.5cm
        # 1줄에 들어가는 대략적 display_width ≈ 30
        LINE_CHARS = 30.0

        # 각 열의 "줄바꿈 없이 필요한 비율"
        natural_ratios = [w / LINE_CHARS for w in col_widths]

        # 짧은 열 = 줄바꿈 없이 1줄에 들어가는 열 (자연폭 ≤ 0.20)
        # 짧은 열에는 자연폭 + 여유 20%를 배정
        # 긴 열에는 나머지 공간을 내용 비율로 배분
        COMPACT_LIMIT = 0.22  # 이 비율 이하면 "짧은 열"

        allocated = [0.0] * n_cols
        short_used = 0.0
        long_indices = []

        for i in range(n_cols):
            if natural_ratios[i] <= COMPACT_LIMIT:
                # 짧은 열: 자연폭 + 여유, 최소 0.05
                alloc = max(natural_ratios[i] * 1.3, 0.05)
                allocated[i] = min(alloc, COMPACT_LIMIT)
                short_used += allocated[i]
            else:
                long_indices.append(i)

        # 긴 열에 나머지 공간 비례 배분
        remaining = max(1.0 - short_used, 0.1)
        if long_indices:
            long_total = sum(col_widths[i] for i in long_indices)
            if long_total > 0:
                for i in long_indices:
                    allocated[i] = remaining * (col_widths[i] / long_total)
            else:
                each = remaining / len(long_indices)
                for i in long_indices:
                    allocated[i] = each
        else:
            # 모든 열이 짧은 경우: 전체를 내용 비율로 재배분
            total_w = sum(col_widths)
            if total_w > 0:
                allocated = [w / total_w for w in col_widths]
            else:
                allocated = [1.0 / n_cols] * n_cols

        # 합계 정규화
        total = sum(allocated)
        if total > 0:
            allocated = [a / total for a in allocated]

        # 새 열 사양 생성
        new_cols = []
        for i in range(n_cols):
            new_cols.append(
                f'  >{{{alignments[i]}}}p{{(\\columnwidth - {tabsep_count}\\tabcolsep) * \\real{{{allocated[i]:.4f}}}}}'
            )
        new_spec = '@{}\n' + '\n'.join(new_cols) + '@{}'
        new_begin = f'\\begin{{longtable}}[]{{{new_spec}}}'

        # 원래 \begin{longtable} 줄 교체
        old_begin = re.search(
            r'\\begin\{longtable\}\[\]\{@\{\}.*?@\{\}\}',
            block, re.DOTALL
        )
        if old_begin:
            return block.replace(old_begin.group(0), new_begin)
        return block

    # 모든 longtable에 적용 (p{} 열이 있는 비례폭 테이블)
    tex = re.sub(
        r'\\begin\{longtable\}\[\]\{@\{\}.*?@\{\}\}.*?\\end\{longtable\}',
        rebalance_table,
        tex,
        flags=re.DOTALL
    )
    return tex


def convert_worksheet_tables(tex):
    """모든 longtable을 tabular+minipage로 변환하여 페이지 분할 방지.
    표가 한 페이지에 담기지 않을 경우 needspace로 다음 페이지로 이동."""

    def longtable_to_tabular(match):
        block = match.group(0)
        # 열 사양 추출
        colspec_match = re.search(r'\\begin\{longtable\}\[\]\{([^}]+)\}', block)
        if not colspec_match:
            return block
        colspec = colspec_match.group(1)

        # longtable → tabular 변환
        result = block
        result = re.sub(
            r'\\begin\{longtable\}\[\]\{[^}]+\}',
            f'\\\\begin{{tabular}}{{{colspec}}}',
            result
        )
        result = result.replace('\\end{longtable}', '\\end{tabular}')
        # longtable 전용 명령 제거
        result = re.sub(r'\\endhead\n?', '', result)
        result = re.sub(r'\\endlastfoot\n?', '', result)
        result = re.sub(r'\\noalign\{\}', '', result)

        # minipage로 감싸서 페이지 분할 방지
        result = f'\\par\\needspace{{4cm}}\\noindent\\begin{{minipage}}{{\\linewidth}}\n{result}\n\\end{{minipage}}\\par\\medskip'
        return result

    tex = re.sub(
        r'\\begin\{longtable\}.*?\\end\{longtable\}',
        longtable_to_tabular,
        tex,
        flags=re.DOTALL
    )
    return tex


def center_table_headers(tex):
    """모든 표의 헤더 행(첫 행)을 가운데 정렬로 변환.
    - minipage 헤더: \\raggedright → \\centering
    - plain text 헤더: 각 셀에 \\centering 추가"""

    def center_header_in_block(match):
        block = match.group(0)

        # toprule ~ midrule 사이가 헤더 영역
        toprule = block.find('\\toprule')
        midrule = block.find('\\midrule')
        if toprule < 0 or midrule < 0:
            return block

        before = block[:toprule]
        header = block[toprule:midrule]
        after = block[midrule:]

        # minipage 헤더: \raggedright → \centering
        header = header.replace('\\raggedright', '\\centering')

        # plain text 헤더 (minipage 없는 경우)
        # toprule 다음 줄이 minipage가 아닌 경우 = plain text 헤더
        if '\\begin{minipage}' not in header:
            # toprule 뒤의 헤더 행에서 각 셀을 \multicolumn{1}{c}{} 로 감싸기
            # toprule\n ... \\ 형태
            lines = header.split('\n')
            new_lines = []
            for line in lines:
                if '\\toprule' in line or not line.strip():
                    new_lines.append(line)
                elif '&' in line:
                    # 셀 분리 후 각각 감싸기
                    row_end = ''
                    if '\\\\' in line:
                        line_body = line[:line.rfind('\\\\')]
                        row_end = ' \\\\'
                    else:
                        line_body = line
                    cells = line_body.split('&')
                    centered = []
                    for cell in cells:
                        c = cell.strip()
                        if c:
                            centered.append(f'\\multicolumn{{1}}{{c}}{{{c}}}')
                        else:
                            centered.append('')
                    new_lines.append(' & '.join(centered) + row_end)
                else:
                    new_lines.append(line)
            header = '\n'.join(new_lines)

        return before + header + after

    # tabular 블록에 적용
    tex = re.sub(
        r'\\begin\{tabular\}.*?\\end\{tabular\}',
        center_header_in_block,
        tex,
        flags=re.DOTALL
    )
    return tex


def fix_tex(tex_content, doc_key):
    """TeX 후처리: 이미지 경로, keepaspectratio, 비번호 섹션, 이모지 컬러, 테이블"""

    # 1. 이미지 경로 절대화
    tex_content = tex_content.replace('{공통_', '{' + WORK + '/공통_')
    tex_content = tex_content.replace('{활용가이드_', '{' + WORK + '/활용가이드_')
    tex_content = tex_content.replace('{이론해설서_', '{' + WORK + '/이론해설서_')

    # 2. keepaspectratio (이미지 원본 비율 유지)
    tex_content = tex_content.replace(',height=\\textheight', ',keepaspectratio')

    # 2b. PNG 이미지에 width 추가 (원본 크기 삽입 방지)
    tex_content = tex_content.replace(
        '\\includegraphics{' + WORK + '/공통_01_초기화면.png}',
        '\\includegraphics[width=0.8\\textwidth,keepaspectratio]{' + WORK + '/공통_01_초기화면.png}'
    )
    tex_content = tex_content.replace(
        '\\includegraphics{' + WORK + '/공통_02_실행중화면.png}',
        '\\includegraphics[width=0.8\\textwidth,keepaspectratio]{' + WORK + '/공통_02_실행중화면.png}'
    )

    # 3. 참고자료/생성수정이력 비번호 처리
    for cmd in ['section', 'subsection']:
        for title in ['참고자료', '생성/수정 이력']:
            old = '\\' + cmd + '{' + title + '}'
            new = '\\' + cmd + '*{' + title + '}\\addcontentsline{toc}{' + cmd + '}{' + title + '}'
            tex_content = tex_content.replace(old, new)
        # pandoc 줄바꿈 처리
        old = '\\' + cmd + '{생성/수정\n이력}'
        new = '\\' + cmd + '*{생성/수정 이력}\\addcontentsline{toc}{' + cmd + '}{생성/수정 이력}'
        tex_content = tex_content.replace(old, new)

    # 4. 플레이스홀더 → \textcolor 컬러 심볼 교체
    for ph, latex_cmd in PLACEHOLDER_TO_LATEX.items():
        tex_content = tex_content.replace(ph, latex_cmd)

    # 4b. 테이블 내 plain URL → \url{} 처리 (자동 줄바꿈)
    # 테이블 셀 구분자(&) 뒤의 URL만 변환 (lstlisting 내 URL 보호)
    tex_content = re.sub(
        r'(& )(https?://[^\s\\}&]+)',
        r'\1\\url{\2}',
        tex_content
    )

    # 4b. 테이블 셀 내 긴 텍스트 줄바꿈 허용 (코드블록 제외)
    # lstlisting 블록 내부는 보호하고 나머지만 처리
    parts = re.split(r'(\\begin\{lstlisting\}.*?\\end\{lstlisting\})', tex_content, flags=re.DOTALL)
    for i in range(len(parts)):
        if not parts[i].startswith('\\begin{lstlisting}'):
            parts[i] = parts[i].replace('→', '→\\allowbreak{}')
            parts[i] = parts[i].replace('\\_', '\\_\\allowbreak{}')
            parts[i] = re.sub(
                r'(?<!\\url\{)(https?://[^\s\\}]+)',
                r'\\url{\1}',
                parts[i]
            )
    tex_content = ''.join(parts)

    # 5. 모든 longtable 열 폭을 셀 내용 기반으로 자동 재배분
    tex_content = auto_rebalance_columns(tex_content)

    # 7. 코드 블록(lstlisting)을 minipage로 감싸서 페이지 분리 방지
    tex_content = tex_content.replace(
        '\\begin{lstlisting}',
        '\\par\\noindent\\begin{minipage}{\\linewidth}\\begin{lstlisting}'
    )
    tex_content = tex_content.replace(
        '\\end{lstlisting}',
        '\\end{lstlisting}\\end{minipage}\\par'
    )

    # 8. 활동지 표: longtable→tabular 변환 (페이지 분할 방지)
    tex_content = convert_worksheet_tables(tex_content)

    # 9. 모든 표의 헤더 행 가운데 정렬
    tex_content = center_table_headers(tex_content)

    return tex_content


def build_one(doc_key, doc_info):
    print(f"\n{'='*60}")
    print(f"  빌드: {doc_key}")
    print(f"{'='*60}")

    with open(doc_info["md"], "r", encoding="utf-8") as f:
        content = f.read()

    content = preprocess(content)
    content = add_images(doc_key, content)

    tmp_md = os.path.join(WORK, f"tmp_{doc_key}.md")
    with open(tmp_md, "w", encoding="utf-8") as f:
        f.write(content)

    tmp_tex = os.path.join(WORK, f"tmp_{doc_key}.tex")
    cmd = [
        "pandoc", tmp_md,
        "-o", tmp_tex,
        "--template", os.path.join(WORK, "template.tex"),
        "-V", f"doctitle={doc_info['title']}",
        "-V", "docauthor=Changmo Yang \\& Claude AI",
        "-V", "docdate=2026-02-19",
        "-V", "simversion=v1.0.2.4",
        "-V", "docversion=v1.0.0.0",
        "--listings",
        "--shift-heading-level-by=-1",
        "-f", "markdown",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  ❌ Pandoc 실패: {result.stderr[:500]}")
        return False

    with open(tmp_tex, "r", encoding="utf-8") as f:
        tex = f.read()
    tex = fix_tex(tex, doc_key)
    with open(tmp_tex, "w", encoding="utf-8") as f:
        f.write(tex)

    base = os.path.splitext(tmp_tex)[0]
    for ext in [".aux", ".log", ".out", ".toc"]:
        p = base + ext
        if os.path.exists(p):
            os.remove(p)

    for run in range(3):
        result = subprocess.run(
            ["xelatex", "-interaction=nonstopmode", "-output-directory=" + WORK, tmp_tex],
            capture_output=True, text=True, cwd=WORK
        )

    tmp_pdf = base + ".pdf"
    if os.path.exists(tmp_pdf):
        out_pdf = os.path.join(OUTPUTS, doc_info["pdf_name"])
        shutil.copy2(tmp_pdf, out_pdf)
        size_kb = os.path.getsize(out_pdf) / 1024
        print(f"  ✅ {doc_info['pdf_name']} ({size_kb:.0f}KB)")
        return True
    else:
        print(f"  ❌ PDF 생성 실패")
        log_file = base + ".log"
        if os.path.exists(log_file):
            with open(log_file, "r") as f:
                log = f.read()
            for line in log.split('\n'):
                if line.startswith('!'):
                    print(f"    {line}")
        return False


def main():
    os.makedirs(OUTPUTS, exist_ok=True)
    success = 0
    total = len(DOCS)
    for doc_key, doc_info in DOCS.items():
        if build_one(doc_key, doc_info):
            success += 1
    print(f"\n{'='*60}")
    print(f"  완료: {success}/{total}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
