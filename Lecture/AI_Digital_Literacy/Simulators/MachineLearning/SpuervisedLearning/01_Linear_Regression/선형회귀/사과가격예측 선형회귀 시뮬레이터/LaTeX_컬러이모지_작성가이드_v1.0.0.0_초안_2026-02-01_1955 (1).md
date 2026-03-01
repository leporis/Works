# LaTeX 컬러 이모지 작성 가이드

**문서 버전: v1.0.0.0**

---

## 목차

1. [개요](#1-개요)
2. [방법 비교](#2-방법-비교)
3. [권장 방법: LuaLaTeX + emoji 패키지](#3-권장-방법-lualatex--emoji-패키지)
4. [대안 방법](#4-대안-방법)
5. [이모지 이름 찾기](#5-이모지-이름-찾기)
6. [문제 해결](#6-문제-해결)
7. [실전 예제](#7-실전-예제)

---

## 1. 개요

### 1.1 왜 LaTeX에서 이모지가 어려운가?

LaTeX는 1980년대에 만들어진 조판 시스템으로, 유니코드 이모지(2010년대 표준화)를 기본 지원하지 않습니다.

| 문제 | 원인 |
|------|------|
| pdfLaTeX에서 이모지 불가 | 유니코드 미지원 |
| XeLaTeX에서 흑백 출력 | 컬러 폰트 렌더링 미지원 |
| 폰트 호환성 | 컬러 이모지 폰트 형식 다양 (COLR, CBDT, SVG) |

### 1.2 해결책 요약

**✅ 권장: LuaLaTeX + emoji 패키지 + Noto Color Emoji**

```latex
\documentclass{article}
\usepackage{emoji}
\setemojifont{Noto Color Emoji}
\begin{document}
\emoji{red-apple} \emoji{sparkles} \emoji{chart-increasing}
\end{document}
```

---

## 2. 방법 비교

| 방법 | 엔진 | 컬러 | 복사 가능 | 설치 용이성 | 권장도 |
|------|------|:----:|:--------:|:-----------:|:------:|
| **emoji 패키지** | LuaLaTeX | ✅ | ✅ | ⭐⭐⭐ | **★★★** |
| coloremoji.sty | 모든 엔진 | ✅ | ❌ | ⭐⭐ | ★★ |
| BXcoloremoji | 모든 엔진 | ✅ | ❌ | ⭐⭐ | ★★ |
| Symbola 폰트 | XeLaTeX | ❌ 흑백 | ✅ | ⭐⭐⭐ | ★ |
| 이미지 삽입 | 모든 엔진 | ✅ | ❌ | ⭐ | ★ |

---

## 3. 권장 방법: LuaLaTeX + emoji 패키지

### 3.1 필수 요구사항

| 항목 | 요구사항 |
|------|----------|
| TeX 엔진 | **LuaLaTeX** (TeX Live 2020 이상) |
| 패키지 | emoji (CTAN) |
| 폰트 | Noto Color Emoji 또는 TwemojiMozilla |

### 3.2 설치 방법

#### Ubuntu/Debian
```bash
# TeX Live 설치
sudo apt install texlive-luatex texlive-fonts-extra

# Noto Color Emoji 폰트 (보통 기본 설치됨)
sudo apt install fonts-noto-color-emoji

# emoji 패키지 (TeX Live에 포함, 없으면 수동 설치)
# CTAN에서 다운로드: https://ctan.org/pkg/emoji
```

#### 수동 설치 (emoji 패키지)
```bash
# 1. 다운로드
wget https://mirrors.ctan.org/macros/luatex/latex/emoji.zip
unzip emoji.zip

# 2. 로컬 texmf에 복사
mkdir -p ~/texmf/tex/latex/emoji
cp emoji/emoji.sty emoji/emoji-table.def ~/texmf/tex/latex/emoji/

# 3. 데이터베이스 갱신
texhash ~/texmf
```

### 3.3 기본 템플릿

```latex
\documentclass[11pt,a4paper]{article}

% 컬러 이모지 설정
\usepackage{emoji}
\setemojifont{Noto Color Emoji}

% 한글 문서인 경우
\usepackage{fontspec}
\setmainfont{Noto Sans CJK KR}

\begin{document}

\section{이모지 테스트}

과일: \emoji{red-apple} \emoji{grapes} \emoji{watermelon}

날씨: \emoji{sun} \emoji{cloud} \emoji{umbrella}

감정: \emoji{grinning-face} \emoji{thumbs-up} \emoji{party-popper}

\end{document}
```

### 3.4 컴파일 명령

```bash
# 반드시 lualatex 사용
lualatex document.tex

# 참조가 있는 경우 2회 실행
lualatex document.tex
lualatex document.tex
```

### 3.5 Overleaf에서 사용

1. 프로젝트 설정에서 컴파일러를 **LuaLaTeX**로 변경
2. 코드에서 바로 사용 가능 (Noto Color Emoji 기본 제공)

```latex
\documentclass{article}
\usepackage{emoji}
% Overleaf에서는 setemojifont 생략 가능 (기본값: Noto Color Emoji)
\begin{document}
\emoji{rocket} Hello World!
\end{document}
```

---

## 4. 대안 방법

### 4.1 coloremoji.sty (이미지 기반)

pdfLaTeX에서도 작동하지만, 이모지가 이미지로 삽입되어 복사 불가.

```bash
# 설치 (31MB, 이미지 파일 포함)
git clone https://github.com/alecjacobson/coloremoji.sty.git
```

```latex
\documentclass{article}
\usepackage{coloremoji}
\begin{document}
직접 입력: 🍎 🚀 ✨
\end{document}
```

### 4.2 BXcoloremoji (twemojis 기반)

일본 커뮤니티에서 인기. twemojis 패키지 필요.

```latex
\documentclass{article}
\usepackage{bxcoloremoji}
\begin{document}
\coloremoji{🍎} \coloremoji{🚀}
\end{document}
```

### 4.3 Symbola 폰트 (흑백)

컬러가 필요 없다면 가장 간단한 방법.

```latex
\documentclass{article}
\usepackage{fontspec}
\newfontfamily\emojifont{Symbola}
\newcommand{\emoji}[1]{{\emojifont #1}}
\begin{document}
\emoji{🍎} \emoji{📊} % 흑백으로 출력
\end{document}
```

---

## 5. 이모지 이름 찾기

### 5.1 emoji 패키지 이름 규칙

- 공백 → 하이픈 (`-`)
- 소문자 사용
- CLDR Short Name 기반

| 이모지 | 이름 | 대체 이름 |
|:------:|------|----------|
| 🍎 | `red-apple` | - |
| 📊 | `bar-chart` | - |
| ✨ | `sparkles` | - |
| 🚀 | `rocket` | - |
| 💡 | `light-bulb` | `bulb` |
| ✅ | `check-mark-button` | `white-check-mark` |
| ❌ | `cross-mark` | `x` |
| ⚡ | `high-voltage` | `zap` |
| 🎯 | `bullseye` | `dart` |
| 📈 | `chart-increasing` | `chart-with-upwards-trend` |
| 📉 | `chart-decreasing` | `chart-with-downwards-trend` |
| 🧠 | `brain` | - |
| 🔮 | `crystal-ball` | - |
| ⚙️ | `gear` | - |
| 🎉 | `party-popper` | `tada` |
| 👍 | `thumbs-up` | `+1` |
| 😀 | `grinning-face` | `grinning` |

### 5.2 이름 찾는 방법

1. **emoji 패키지 문서**: [emoji-doc.pdf](https://ctan.org/pkg/emoji)
2. **Unicode CLDR**: https://unicode.org/emoji/charts/full-emoji-list.html
3. **Emojipedia**: https://emojipedia.org/ (이름 확인 후 변환)

### 5.3 이름 변환 규칙

| 원본 (Emojipedia) | emoji 패키지 이름 |
|-------------------|-------------------|
| Red Apple | `red-apple` |
| Face with Tears of Joy | `face-with-tears-of-joy` |
| Thumbs Up: Light Skin Tone | `thumbs-up-light-skin-tone` |

---

## 6. 문제 해결

### 6.1 "The emoji name can't be found" 오류

**원인**: 이모지 이름이 잘못됨

**해결**:
```latex
% ❌ 잘못된 이름
\emoji{direct-hit}

% ✅ 올바른 이름
\emoji{bullseye}
```

### 6.2 "The font cannot be found" 오류

**원인**: 이모지 폰트 미설치

**해결**:
```bash
# Ubuntu/Debian
sudo apt install fonts-noto-color-emoji

# 설치 확인
fc-list | grep -i "color emoji"
```

### 6.3 한글 폰트 오류

**원인**: 한글 폰트 이름 오류

**해결**:
```latex
% ❌ 잘못된 이름
\setmainfont{Noto Sans KR}

% ✅ 올바른 이름 (시스템에 따라 다름)
\setmainfont{Noto Sans CJK KR}
```

```bash
# 설치된 폰트 확인
fc-list | grep -i "noto.*cjk.*kr"
```

### 6.4 pdfLaTeX에서 작동 안 함

**원인**: emoji 패키지는 LuaLaTeX 전용

**해결**: 컴파일러 변경
```bash
# ❌
pdflatex document.tex

# ✅
lualatex document.tex
```

### 6.5 이모지가 흑백으로 출력

**원인**: 컬러 폰트 미사용

**해결**:
```latex
% 반드시 컬러 이모지 폰트 지정
\setemojifont{Noto Color Emoji}
% 또는
\setemojifont{TwemojiMozilla}
```

---

## 7. 실전 예제

### 7.1 교육 문서 템플릿

```latex
\documentclass[11pt,a4paper]{article}
\usepackage{emoji}
\setemojifont{Noto Color Emoji}
\usepackage{fontspec}
\setmainfont{Noto Sans CJK KR}
\usepackage[dvipsnames]{xcolor}
\usepackage{tcolorbox}

% TIP 박스 정의
\newtcolorbox{tipbox}{
    colback=yellow!10,
    colframe=orange,
    title={\emoji{light-bulb} TIP}
}

\begin{document}

\section{\emoji{rocket} 빠른 시작}

\begin{enumerate}
    \item \emoji{folder} 프로젝트 폴더 생성
    \item \emoji{gear} 설정 파일 작성
    \item \emoji{play-button} 실행
\end{enumerate}

\begin{tipbox}
처음 사용자는 \emoji{books} 문서를 먼저 읽어보세요!
\end{tipbox}

\section{\emoji{warning} 주의사항}

\begin{itemize}
    \item \emoji{check-mark-button} 필수 항목
    \item \emoji{cross-mark} 금지 항목
\end{itemize}

\end{document}
```

### 7.2 자주 사용하는 이모지 매크로

```latex
% 프리앰블에 정의
\newcommand{\good}{\emoji{check-mark-button}}
\newcommand{\bad}{\emoji{cross-mark}}
\newcommand{\warn}{\emoji{warning}}
\newcommand{\tip}{\emoji{light-bulb}}
\newcommand{\note}{\emoji{memo}}
\newcommand{\important}{\emoji{exclamation-mark}}

% 본문에서 사용
\good 완료된 항목
\bad 실패한 항목
\warn 주의 필요
```

### 7.3 테이블에서 이모지 사용

```latex
\begin{tabular}{|c|l|l|}
\hline
\textbf{상태} & \textbf{설명} & \textbf{조치} \\
\hline
\emoji{check-mark-button} & 정상 & 없음 \\
\emoji{warning} & 경고 & 확인 필요 \\
\emoji{cross-mark} & 오류 & 즉시 수정 \\
\hline
\end{tabular}
```

---

## 참고자료

| # | 자료명 | 유형 | 비고 |
|:-:|--------|------|------|
| 1 | [emoji 패키지 (CTAN)](https://ctan.org/pkg/emoji) | 웹사이트 | 공식 문서 |
| 2 | [Overleaf 이모지 가이드](https://www.overleaf.com/learn/latex/Questions/Inserting_emojis_in_LaTeX_documents_on_Overleaf) | 웹사이트 | Overleaf 공식 |
| 3 | [coloremoji.sty (GitHub)](https://github.com/alecjacobson/coloremoji.sty) | GitHub | 이미지 기반 |
| 4 | [BXcoloremoji (GitHub)](https://github.com/zr-tex8r/BXcoloremoji) | GitHub | twemojis 기반 |
| 5 | [LaTeX 컬러 이모지 기술 개요 (Overleaf)](https://www.overleaf.com/learn/latex/Articles/An_overview_of_technologies_supporting_the_use_of_colour_emoji_fonts_in_LaTeX) | 웹사이트 | 기술 배경 |

---

## 생성/수정 이력

| 버전 | 날짜 | 시간 | 변경 수준 | 변경 내용 | 작성자 |
|------|------|------|-----------|-----------|--------|
| **v1.0.0.0** | **2026-02-01** | **19:55** | **최초** | **초안 작성** | **Claude** |

---

*LaTeX 컬러 이모지 작성 가이드*
