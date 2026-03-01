#!/usr/bin/env python3
"""
MD → LaTeX 일괄 변환기
교육자료 마크다운을 LaTeX article 형식으로 변환
"""
import re
import os
import subprocess

# ============================================================
# 이모지 매핑 (MD 이모지 → LaTeX emoji 패키지 이름)
# ============================================================
EMOJI_MAP = {
    '🖥️': 'desktop-computer', '🔌': 'electric-plug', '📝': 'memo',
    '📖': 'open-book', '⚡': 'high-voltage', '🚀': 'rocket',
    '🔍': 'magnifying-glass-tilted-left', '🖥': 'desktop-computer',
    '🎯': 'bullseye', '🆘': 'sos', '💭': 'thought-balloon',
    '🔑': 'key', '💡': 'light-bulb', '🌡️': 'thermometer',
    '🧭': 'compass', '🎤': 'microphone', '👆': 'backhand-index-pointing-up',
    '🏃': 'person-running', '🌤️': 'sun-behind-small-cloud',
    '🔆': 'bright-button', '🎨': 'artist-palette',
    '🌬️': 'wind-face', '📐': 'triangular-ruler',
    '📏': 'straight-ruler', '🎹': 'musical-keyboard',
    '👋': 'waving-hand', '📺': 'television',
    '❤️': 'red-heart', '⏸️': 'pause-button', '🧹': 'broom',
    '♾️': 'infinity', '▶️': 'play-button', '⏹️': 'stop-button',
    '🔄': 'counterclockwise-arrows-button', '🗑️': 'wastebasket',
    '🔢': 'input-numbers', '🎉': 'party-popper', '🎵': 'musical-note',
    '🔀': 'shuffle-tracks-button', '🎮': 'video-game',
    '📦': 'package', '🟢': 'green-circle', '🔵': 'blue-circle',
    '🟣': 'purple-circle', '📊': 'bar-chart', '📋': 'clipboard',
    '🔎': 'magnifying-glass-tilted-right',
    '🩵': 'light-blue-heart', '💜': 'purple-heart',
    '💙': 'blue-heart', '💚': 'green-heart', '💛': 'yellow-heart',
    '🔧': 'wrench',
    '1️⃣': 'keycap-1', '2️⃣': 'keycap-2', '3️⃣': 'keycap-3',
    '⭐': 'star',
    # === 추가 이모지 ===
    '✅': 'check-mark-button', '❌': 'cross-mark',
    '⚠️': 'warning', '⚠': 'warning',
    '📥': 'inbox-tray', '💧': 'droplet',
    '💬': 'speech-balloon', '🎲': 'game-die',
    '📁': 'file-folder', '🧠': 'brain',
    '🔴': 'red-circle', '🟡': 'yellow-circle',
    '👨\u200d🎓': 'man-student', '👨\u200d🏫': 'man-teacher',
    '⚖️': 'balance-scale', '⚖': 'balance-scale',
    '⌨️': 'keyboard', '⌨': 'keyboard',
}

# ============================================================
# 시뮬레이터별 메타 정보
# ============================================================
SIMULATORS = {
    'MakeCode시뮬레이터LED이름표시': {
        'title': 'MakeCode LED 이름 표시 시뮬레이터',
        'icon': 'desktop-computer',
        'course': '사물인터넷과 빅데이터',
        'screen_svg': 'S1_MakeCode_LED_screen',
    },
    '마이크로비트GroveI2C연결도': {
        'title': '마이크로비트 Grove I2C 연결도',
        'icon': 'electric-plug',
        'course': '사물인터넷과 빅데이터',
        'screen_svg': 'S2_GroveI2C_screen',
    },
    '마이크로비트데이터로거': {
        'title': '마이크로비트 데이터로거 시스템',
        'icon': 'memo',
        'course': '사물인터넷과 빅데이터',
        'screen_svg': 'S3_DataLogger_screen',
    },
    '마이크로비트Grove센서시뮬레이터': {
        'title': '마이크로비트 Grove I2C 센서 시뮬레이터',
        'icon': 'electric-plug',
        'course': '사물인터넷과 빅데이터',
        'screen_svg': 'S4_GroveSensor_screen',
    },
    '마이크로비트센서검색도구': {
        'title': '마이크로비트 센서 검색 도구',
        'icon': 'magnifying-glass-tilted-left',
        'course': '사물인터넷과 빅데이터',
        'screen_svg': 'S5_SensorSearch_screen',
    },
    '수업집중도분석프로그램': {
        'title': '수업 집중도 분석 프로그램',
        'icon': 'bar-chart',
        'course': '사물인터넷과 빅데이터',
        'screen_svg': 'S6_Concentration_screen',
    },
}

DOC_TYPES = {
    '퀵가이드': '퀵가이드',
    '사용설명서': '사용설명서',
    '이론해설서': '이론해설서',
    '활용가이드': '활용가이드',
}

def escape_latex(text):
    """LaTeX 특수문자 이스케이프"""
    text = text.replace('\\', '\\textbackslash{}')
    text = text.replace('&', '\\&')
    text = text.replace('%', '\\%')
    text = text.replace('$', '\\$')
    text = text.replace('#', '\\#')
    text = text.replace('{', '\\{')
    text = text.replace('}', '\\}')
    text = text.replace('~', '\\textasciitilde{}')
    text = text.replace('^', '\\textasciicircum{}')
    text = text.replace('_', '\\_')
    return text

def process_emojis(text):
    """텍스트 내 이모지를 \\emoji{} 명령으로 변환"""
    for em, name in sorted(EMOJI_MAP.items(), key=lambda x: -len(x[0])):
        text = text.replace(em, f'\\emoji{{{name}}}')
    return text

def escape_and_emoji(text):
    """이스케이프 + 이모지 처리 (순서 중요: 이모지 먼저 추출)"""
    # 먼저 이모지를 플레이스홀더로
    placeholders = {}
    idx = 0
    for em, name in sorted(EMOJI_MAP.items(), key=lambda x: -len(x[0])):
        while em in text:
            ph = f'__EMOJI_{idx}__'
            text = text.replace(em, ph, 1)
            placeholders[ph] = f'\\emoji{{{name}}}'
            idx += 1
    
    # bold 처리 전에 추출
    bolds = {}
    bidx = 0
    for m in re.finditer(r'\*\*(.+?)\*\*', text):
        ph = f'__BOLD_{bidx}__'
        bolds[ph] = m.group(1)
        text = text[:m.start()] + ph + text[m.end():]
        # re-find due to shifting — simpler approach below
    
    # 다시: 간단한 접근
    text_orig = text
    text = text_orig
    
    # bold 추출
    bold_phs = {}
    bidx = 0
    def replace_bold(m):
        nonlocal bidx
        ph = f'__BOLD_{bidx}__'
        bold_phs[ph] = m.group(1)
        bidx += 1
        return ph
    text = re.sub(r'\*\*(.+?)\*\*', replace_bold, text)
    
    # code 추출
    code_phs = {}
    cidx = 0
    def replace_code(m):
        nonlocal cidx
        ph = f'__CODE_{cidx}__'
        code_phs[ph] = m.group(1)
        cidx += 1
        return ph
    text = re.sub(r'`([^`]+)`', replace_code, text)
    
    # 이제 LaTeX 이스케이프
    text = escape_latex(text)
    
    # 복원: bold
    for ph, val in bold_phs.items():
        escaped_val = escape_latex(val)
        # 이모지 in bold
        for eph, ename in placeholders.items():
            if eph in escaped_val:
                escaped_val = escaped_val.replace(eph, ename)
        text = text.replace(escape_latex(ph), f'\\textbf{{{escaped_val}}}')
    
    # 복원: code
    for ph, val in code_phs.items():
        escaped_val = escape_latex(val)
        text = text.replace(escape_latex(ph), f'\\texttt{{{escaped_val}}}')
    
    # 복원: emoji
    for ph, cmd in placeholders.items():
        text = text.replace(escape_latex(ph), cmd)
        text = text.replace(ph, cmd)
    
    # → 화살표
    text = text.replace('\\textrightarrow{}', '→')  # undo double escape
    text = text.replace('→', '\\textrightarrow{}')
    text = text.replace('×', '\\texttimes{}')
    # 비이모지 유니코드 기호
    text = text.replace('☐', '$\\square$')
    text = text.replace('▼', '$\\blacktriangledown$')
    text = text.replace('●', '$\\bullet$')
    text = text.replace('✕', '$\\times$')
    text = text.replace('₂', '\\textsubscript{2}')
    
    return text

def simple_escape(text):
    """단순 이스케이프 + 이모지 (테이블 셀용)"""
    # 이모지 먼저 추출
    placeholders = {}
    idx = 0
    for em, name in sorted(EMOJI_MAP.items(), key=lambda x: -len(x[0])):
        while em in text:
            ph = f'XEMX{idx}X'
            text = text.replace(em, ph, 1)
            placeholders[ph] = f'\\emoji{{{name}}}'
            idx += 1
    
    # bold 추출
    bold_phs = {}
    bidx = 0
    def rb(m):
        nonlocal bidx
        ph = f'XBDX{bidx}X'
        bold_phs[ph] = m.group(1)
        bidx += 1
        return ph
    text = re.sub(r'\*\*(.+?)\*\*', rb, text)
    
    # code 추출
    code_phs = {}
    cidx = 0
    def rc(m):
        nonlocal cidx
        ph = f'XCDX{cidx}X'
        code_phs[ph] = m.group(1)
        cidx += 1
        return ph
    text = re.sub(r'`([^`]+)`', rc, text)
    
    # escape
    text = escape_latex(text)
    
    # restore bold
    for ph, val in bold_phs.items():
        v = escape_latex(val)
        for ep, en in placeholders.items():
            v = v.replace(ep, en)
        text = text.replace(ph, f'\\textbf{{{v}}}')
    
    # restore code
    for ph, val in code_phs.items():
        v = escape_latex(val)
        text = text.replace(ph, f'\\texttt{{{v}}}')
    
    # restore emoji
    for ph, cmd in placeholders.items():
        text = text.replace(ph, cmd)
    
    text = text.replace('→', '\\textrightarrow{}')
    text = text.replace('×', '\\texttimes{}')
    text = text.replace('§', '\\S{}')
    # 비이모지 유니코드 기호
    text = text.replace('☐', '$\\square$')
    text = text.replace('▼', '$\\blacktriangledown$')
    text = text.replace('●', '$\\bullet$')
    text = text.replace('✕', '$\\times$')
    text = text.replace('₂', '\\textsubscript{2}')
    
    return text


def parse_md_table(lines):
    """마크다운 테이블 파싱 → list of rows (list of cells)"""
    rows = []
    for line in lines:
        line = line.strip()
        if line.startswith('|') and line.endswith('|'):
            cells = [c.strip() for c in line.split('|')[1:-1]]
            # 구분선 스킵
            if all(re.match(r'^[-:]+$', c) for c in cells):
                continue
            rows.append(cells)
    return rows

def table_to_latex(rows, has_header=True):
    """파싱된 테이블을 LaTeX로 변환 (§2.8 내용 기반 열 너비)"""
    if not rows:
        return ''
    
    ncols = len(rows[0])
    total_width = 15.0  # cm (A4 - 25mm*2 margins ≈ 16cm, 약간 여유)
    
    # 각 열의 최대 텍스트 길이 계산 (한글 2배 가중)
    col_max_len = []
    for c in range(ncols):
        max_len = 0
        for row in rows:
            if c < len(row):
                cell = row[c]
                # 한글은 2배, 이모지는 2배, 나머지 1배
                clen = 0
                for ch in cell:
                    if '\uac00' <= ch <= '\ud7a3' or '\u4e00' <= ch <= '\u9fff':
                        clen += 2
                    elif ord(ch) > 0x2000:
                        clen += 2
                    else:
                        clen += 1
                max_len = max(max_len, clen)
        col_max_len.append(max(max_len, 3))  # 최소 3
    
    # 비율 기반 너비 배분
    total_len = sum(col_max_len)
    widths = []
    for cl in col_max_len:
        w = max(1.5, round(cl / total_len * total_width, 1))
        widths.append(w)
    
    # 합계 보정
    diff = total_width - sum(widths)
    if abs(diff) > 0.1:
        # 가장 넓은 열에서 조정
        idx = widths.index(max(widths))
        widths[idx] = round(widths[idx] + diff, 1)
    
    spec = '|' + '|'.join([f'p{{{w}cm}}' for w in widths]) + '|'
    
    lines = []
    lines.append('\\begin{center}')
    lines.append('\\renewcommand{\\arraystretch}{1.4}')
    lines.append(f'\\begin{{tabular}}{{{spec}}}')
    lines.append('\\hline')
    
    for i, row in enumerate(rows):
        cells = [simple_escape(c) for c in row]
        # 셀 수 맞추기
        while len(cells) < ncols:
            cells.append('')
        
        if i == 0 and has_header:
            lines.append('\\rowcolor{tableheader}')
            cells_str = ' & '.join([f'\\textbf{{{c}}}' for c in cells])
        else:
            cells_str = ' & '.join(cells)
        
        lines.append(f'{cells_str} \\\\')
        lines.append('\\hline')
    
    lines.append('\\end{tabular}')
    lines.append('\\end{center}')
    return '\n'.join(lines)


def detect_ascii_art(lines):
    """연속된 라인이 ASCII 아트(박스 다이어그램)인지 감지"""
    box_chars = set('┌┐└┘├┤┬┴┼─│╔╗╚╝╠╣╦╩╬═║')
    count = sum(1 for line in lines if any(c in box_chars for c in line))
    return count >= 3


def convert_md_to_latex(md_content, sim_key, doc_type, screen_svg_exists=False, screen_ext='.pdf'):
    """마크다운 → LaTeX 본문 변환"""
    lines = md_content.split('\n')
    
    sim_info = SIMULATORS[sim_key]
    doc_type_kr = DOC_TYPES[doc_type]
    
    # 버전 정보 추출
    doc_version = 'v1.0.0.0'
    sim_version = ''
    for line in lines[:10]:
        m = re.search(r'문서 버전:\s*(v[\d.]+)', line)
        if m:
            doc_version = m.group(1)
        m = re.search(r'시뮬레이터 버전:\s*(v[\d.]+)', line)
        if m:
            sim_version = m.group(1)
    
    # LaTeX 빌드
    tex = []
    tex.append('\\documentclass[11pt,a4paper]{article}')
    tex.append('\\input{shared_preamble}')
    tex.append('')
    
    # 머리글
    header_text = f'{sim_info["title"]} {doc_type_kr} {doc_version}'
    tex.append('\\pagestyle{fancy}')
    tex.append('\\fancyhf{}')
    tex.append(f'\\fancyhead[R]{{\\small\\color{{lightbrown}}{header_text}}}')
    tex.append('\\fancyfoot[C]{\\thepage}')
    tex.append('\\renewcommand{\\headrulewidth}{0.4pt}')
    tex.append('')
    tex.append('\\begin{document}')
    tex.append('')
    
    # 표지
    tex.append('\\begin{titlepage}')
    tex.append('\\centering')
    tex.append('\\vspace*{3cm}')
    tex.append(f'{{\\Huge\\bfseries\\color{{primary}}\\emoji{{{sim_info["icon"]}}} {sim_info["title"]}}}\\\\[0.5cm]')
    tex.append(f'{{\\Huge\\bfseries\\color{{primary}} {doc_type_kr}}}')
    tex.append('\\\\[1.5cm]')
    if sim_version:
        tex.append(f'{{\\Large 시뮬레이터 버전: {sim_version}}}')
    tex.append('\\\\[2cm]')
    
    # 문서 유형별 소개 문구
    intro_texts = {
        '퀵가이드': f'이 퀵가이드는 {sim_info["title"]}와 함께 보는 내비게이션입니다.',
        '사용설명서': f'이 사용설명서는 {sim_info["title"]}의 전체 기능을 상세히 설명합니다.',
        '이론해설서': f'이 이론해설서는 {sim_info["title"]}이 다루는 핵심 개념과 원리를 설명합니다.',
        '활용가이드': f'이 활용가이드는 {sim_info["title"]}의 수업 적용 방법을 안내합니다.',
    }
    tex.append('\\begin{tcolorbox}[summarybox]')
    tex.append('\\centering')
    tex.append(f'{{\\large {intro_texts[doc_type]}}}')
    tex.append('\\end{tcolorbox}')
    tex.append('\\vfill')
    tex.append(f'{{\\large {sim_info["course"]}}}\\\\[0.3cm]')
    tex.append('{\\large 청주교육대학교 컴퓨터교육과}')
    tex.append('\\vspace{1cm}')
    tex.append('\\end{titlepage}')
    tex.append('')
    
    # 본문 변환
    i = 0
    in_table = False
    table_lines = []
    in_code_block = False
    code_lines = []
    in_blockquote = False
    bq_lines = []
    skip_header = True  # 첫 번째 H1과 버전 정보 스킵
    
    while i < len(lines):
        line = lines[i]
        
        # 첫 H1 헤더와 버전/구분선 스킵
        if skip_header:
            if line.startswith('# ') or line.startswith('**문서') or line.startswith('**시뮬레이터') or line.strip() == '---' or line.strip() == '':
                i += 1
                continue
            skip_header = False
        
        # --- 구분선 스킵
        if line.strip() == '---':
            i += 1
            continue
        
        # 코드 블록
        if line.strip().startswith('```'):
            if in_code_block:
                # 코드 블록 끝
                # ASCII 아트 감지
                if detect_ascii_art(code_lines):
                    # 화면 구성 SVG가 있으면 모든 ASCII 다이어그램을 SVG로 대체
                    if screen_svg_exists:
                        tex.append('\\begin{center}')
                        tex.append(f'\\includegraphics[width=0.95\\textwidth]{{images/{sim_info["screen_svg"]}{screen_ext}}}')
                        tex.append('\\end{center}')
                    else:
                        # 일반 ASCII 아트는 small verbatim
                        tex.append('\\begin{tcolorbox}[formulabox]')
                        tex.append('{\\small')
                        tex.append('\\begin{verbatim}')
                        for cl in code_lines:
                            tex.append(cl)
                        tex.append('\\end{verbatim}')
                        tex.append('}')
                        tex.append('\\end{tcolorbox}')
                else:
                    # 일반 코드 블록
                    tex.append('\\begin{tcolorbox}[formulabox]')
                    tex.append('\\begin{verbatim}')
                    for cl in code_lines:
                        tex.append(cl)
                    tex.append('\\end{verbatim}')
                    tex.append('\\end{tcolorbox}')
                code_lines = []
                in_code_block = False
            else:
                in_code_block = True
                code_lines = []
            i += 1
            continue
        
        if in_code_block:
            code_lines.append(line)
            i += 1
            continue
        
        # 테이블
        if line.strip().startswith('|') and '|' in line.strip()[1:]:
            table_lines.append(line)
            in_table = True
            i += 1
            continue
        elif in_table:
            # 테이블 끝
            rows = parse_md_table(table_lines)
            if rows:
                tex.append(table_to_latex(rows))
            table_lines = []
            in_table = False
            # 현재 줄 계속 처리 (fall through)
        
        # 블록인용
        if line.strip().startswith('> '):
            content = line.strip()[2:]
            if not in_blockquote:
                in_blockquote = True
                bq_lines = []
            bq_lines.append(content)
            i += 1
            continue
        elif line.strip() == '>' or (in_blockquote and line.strip().startswith('>')):
            content = line.strip().lstrip('>').strip()
            bq_lines.append(content)
            i += 1
            continue
        elif in_blockquote:
            # blockquote 끝
            bq_text = '\n'.join(bq_lines)
            # 팁 or 생각해보기 판단
            if '핵심 주제' in bq_text or '생각해보기' in bq_text or '프로젝트' in bq_text or '블록의 순서' in bq_text or '센서가' in bq_text or '왜' in bq_text:
                tex.append('\\begin{tcolorbox}[summarybox]')
            elif '팁' in bq_text or '💡' in bq_text:
                tex.append('\\begin{tcolorbox}[tipbox, title={\\emoji{light-bulb} 팁}]')
            else:
                tex.append('\\begin{tcolorbox}[tipbox]')
            for bl in bq_lines:
                if bl.strip():
                    tex.append(simple_escape(bl.strip()))
                    tex.append('')
                else:
                    tex.append('\\vspace{0.3em}')
            tex.append('\\end{tcolorbox}')
            bq_lines = []
            in_blockquote = False
            # fall through
        
        # 빈 줄
        if line.strip() == '':
            tex.append('')
            i += 1
            continue
        
        # H2 섹션 (##)
        m = re.match(r'^## (.+)$', line)
        if m:
            title = m.group(1).strip()
            # 생성/수정 이력 섹션 스킵
            if '이력' in title and ('생성' in title or '수정' in title or '변경' in title):
                i += 1
                # 다음 H2나 EOF까지 스킵
                while i < len(lines):
                    if re.match(r'^## ', lines[i]):
                        break
                    i += 1
                continue
            # 이모지 처리
            title_tex = simple_escape(title)
            tex.append(f'\\section*{{{title_tex}}}')
            i += 1
            continue
        
        # H3 서브섹션 (###)
        m = re.match(r'^### (.+)$', line)
        if m:
            title = m.group(1).strip()
            title_tex = simple_escape(title)
            tex.append(f'\\subsection*{{{title_tex}}}')
            i += 1
            continue
        
        # H4 (####)
        m = re.match(r'^#### (.+)$', line)
        if m:
            title = m.group(1).strip()
            title_tex = simple_escape(title)
            tex.append(f'\\subsubsection*{{{title_tex}}}')
            i += 1
            continue
        
        # 리스트 항목 (- 또는 숫자.)
        m = re.match(r'^(\s*)([-*])\s+(.+)$', line)
        if m:
            content = simple_escape(m.group(3))
            indent = len(m.group(1))
            if indent > 0:
                tex.append(f'\\hspace{{1em}}$\\bullet$ {content}')
            else:
                tex.append(f'$\\bullet$ {content}')
            tex.append('')
            i += 1
            continue
        
        m = re.match(r'^(\s*)(\d+)\.\s+(.+)$', line)
        if m:
            content = simple_escape(m.group(3))
            num = m.group(2)
            tex.append(f'{num}. {content}')
            tex.append('')
            i += 1
            continue
        
        # H1 (문서 내 추가 H1은 section으로)
        m = re.match(r'^# (.+)$', line)
        if m:
            i += 1
            continue
        
        # 일반 단락
        # "**Q:" 패턴 (학습 질문)
        if line.strip().startswith('- Q:') or line.strip().startswith('- **Q:'):
            content = line.strip().lstrip('- ')
            tex.append(f'{simple_escape(content)}')
            tex.append('')
            i += 1
            continue
        
        # 일반 텍스트
        tex.append(simple_escape(line.strip()))
        tex.append('')
        i += 1
    
    # 미완료 테이블 처리
    if in_table and table_lines:
        rows = parse_md_table(table_lines)
        if rows:
            tex.append(table_to_latex(rows))
    
    if in_blockquote and bq_lines:
        tex.append('\\begin{tcolorbox}[summarybox]')
        for bl in bq_lines:
            if bl.strip():
                tex.append(simple_escape(bl.strip()))
                tex.append('')
        tex.append('\\end{tcolorbox}')
    
    # 꼬리말
    tex.append('\\vfill')
    tex.append('\\begin{center}')
    tex.append('\\small\\color{lightbrown}')
    footer = f'{sim_info["title"]} {doc_type_kr}'
    tex.append(f'\\textit{{{footer}}}')
    tex.append('\\end{center}')
    tex.append('\\end{document}')
    
    return '\n'.join(tex)


def identify_doc(filename):
    """파일명에서 시뮬레이터 키와 문서 유형 추출"""
    for sim_key in SIMULATORS:
        if filename.startswith(sim_key):
            for dt in DOC_TYPES:
                if f'_{dt}_' in filename:
                    return sim_key, dt
    return None, None


def main():
    upload_dir = '/mnt/user-data/uploads'
    work_dir = '/home/claude'
    
    # 변환 대상 파일 목록 (개발참조 제외, 이미 완료된 파일 제외)
    done = []
    
    targets = []
    for fname in sorted(os.listdir(upload_dir)):
        if not fname.endswith('.md'):
            continue
        if '개발참조' in fname:
            continue
        
        base = fname.rsplit('_v', 1)[0]
        if base in done:
            continue
        
        sim_key, doc_type = identify_doc(fname)
        if sim_key and doc_type:
            targets.append((fname, sim_key, doc_type))
    
    print(f"변환 대상: {len(targets)}건")
    
    results = []
    for fname, sim_key, doc_type in targets:
        filepath = os.path.join(upload_dir, fname)
        with open(filepath, 'r', encoding='utf-8') as f:
            md_content = f.read()
        
        # 화면 구성 SVG 존재 여부
        svg_name = SIMULATORS[sim_key]['screen_svg']
        # PNG (실제 스크린샷) 우선, PDF (SVG 변환) 대체
        if os.path.exists(os.path.join(work_dir, 'images', f'{svg_name}.png')):
            svg_exists = True
            screen_ext = '.png'
        elif os.path.exists(os.path.join(work_dir, 'images', f'{svg_name}.pdf')):
            svg_exists = True
            screen_ext = '.pdf'
        else:
            svg_exists = False
            screen_ext = ''
        
        # 변환
        tex_content = convert_md_to_latex(md_content, sim_key, doc_type, svg_exists, screen_ext)
        
        # 파일명 결정
        out_base = f'{sim_key}_{doc_type}'
        # 버전 추출
        vm = re.search(r'_v(\d+_\d+_\d+_\d+)', fname)
        version_str = vm.group(1) if vm else '1_0_0_0'
        out_name = f'{out_base}_v{version_str}'
        
        tex_path = os.path.join(work_dir, f'{out_name}.tex')
        with open(tex_path, 'w', encoding='utf-8') as f:
            f.write(tex_content)
        
        results.append((out_name, tex_path))
        print(f"  ✓ {out_name}.tex 생성")
    
    # 일괄 컴파일
    print(f"\n=== 일괄 컴파일 ({len(results)}건) ===")
    success = 0
    errors = []
    
    for out_name, tex_path in results:
        print(f"  컴파일: {out_name}...", end=' ')
        
        # 2-pass 컴파일
        for pass_num in range(2):
            result = subprocess.run(
                ['lualatex', '-interaction=nonstopmode', f'{out_name}.tex'],
                cwd=work_dir,
                capture_output=True, text=True, timeout=120
            )
        
        pdf_path = os.path.join(work_dir, f'{out_name}.pdf')
        if os.path.exists(pdf_path):
            # outputs로 복사
            subprocess.run(['cp', pdf_path, '/mnt/user-data/outputs/'])
            subprocess.run(['cp', tex_path, '/mnt/user-data/outputs/'])
            success += 1
            print("✅")
        else:
            errors.append(out_name)
            print("❌")
    
    print(f"\n=== 결과: {success}/{len(results)} 성공 ===")
    if errors:
        print(f"실패: {', '.join(errors)}")
    
    return success, errors


if __name__ == '__main__':
    main()
