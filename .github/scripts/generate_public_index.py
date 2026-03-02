#!/usr/bin/env python3
"""public/ 디렉토리의 index.html과 README.md를 자동 생성"""
import os, re, subprocess
from pathlib import Path

PUBLIC = "Lecture/IoT_and_BigData/public"
TITLE = "사물인터넷과 빅데이터"
AUTO_FILES = {"index.html", "README.md"}


def skip(name):
    return name.startswith(".") or name.startswith("_") or name in AUTO_FILES


def size_str(path):
    s = os.path.getsize(path)
    if s < 1024:
        return f"{s} B"
    if s < 1048576:
        return f"{s / 1024:.1f}K"
    return f"{s / 1048576:.1f}M"


def git_date(path):
    try:
        r = subprocess.run(
            ["git", "log", "-1", "--format=%ai", "--", path],
            capture_output=True, text=True,
        )
        if r.stdout.strip():
            return r.stdout.strip()[:10]
    except Exception:
        pass
    return "-"


def read_md_heading(md_path):
    """md 파일의 첫 번째 # 제목과 첫 번째 **볼드** 줄 반환"""
    heading, bold = "", ""
    try:
        for line in open(md_path, encoding="utf-8"):
            s = line.strip()
            if not heading and s.startswith("#"):
                heading = re.sub(r"^#+\s*", "", s)
                heading = re.sub(r"^[^\w가-힣]*", "", heading).strip()
            if not bold and re.match(r"^\*\*.+\*\*$", s):
                bold = s.strip("*").strip()
                break
    except Exception:
        pass
    return heading, bold


def file_description(filepath):
    """파일의 한글 설명 한 단어 추출 (index.html 용)"""
    p = Path(filepath)
    md = p.with_suffix(".md") if p.suffix != ".md" else p
    if not md.exists():
        return ""

    heading, bold = read_md_heading(str(md))

    # 제목이 과목명이면 볼드 부제 사용: "강 의 계 획 서" → "강의계획서"
    if TITLE in heading and bold:
        d = re.sub(r"\[.*?\]\s*", "", bold)
        d = re.sub(r"(?<=[\uac00-\ud7a3])\s+(?=[\uac00-\ud7a3])", "", d)
        return d

    # "... — LED 이름 표시 개발일지" → "개발일지"
    if "—" in heading:
        words = heading.split("—")[-1].strip().split()
        if words:
            return words[-1]

    return ""


def dir_description(dirpath):
    """폴더 내 첫 md 파일에서 공통 주제 추출"""
    for name in sorted(os.listdir(dirpath)):
        if name.endswith(".md") and not skip(name):
            heading, _ = read_md_heading(os.path.join(dirpath, name))
            if "—" in heading:
                return heading.split("—")[0].strip()
            return heading
    return ""


def file_summary(md_path):
    """md 파일의 h2 제목들을 모아서 요약 문자열 반환 (README.md 용)"""
    headings = []
    try:
        for line in open(md_path, encoding="utf-8"):
            m = re.match(r"^##\s+(?:\d+\.?\s*)?(.+)", line.strip())
            if m:
                h = re.sub(r"^\d+\.?\s*", "", m.group(1)).strip()
                headings.append(h)
    except Exception:
        pass
    return headings


# ── index.html 생성 ──────────────────────────────────────────────


def gen_index(dirpath, rel=""):
    title = f"Index of /{TITLE}/{rel}/" if rel else f"Index of /{TITLE}/"

    dirs, files = [], []
    for n in sorted(os.listdir(dirpath)):
        if skip(n):
            continue
        f = os.path.join(dirpath, n)
        if os.path.isdir(f):
            dirs.append((n + "/", "-", git_date(f), dir_description(f)))
        else:
            files.append((n, size_str(f), git_date(f), file_description(f)))

    entries = dirs + files
    w = max((len(e[0]) for e in entries), default=4) + 2

    lines = []
    lines.append("<!DOCTYPE html>")
    lines.append("<html>")
    lines.append("<head>")
    lines.append('<meta charset="UTF-8">')
    lines.append(f"<title>{title}</title>")
    lines.append("</head>")
    lines.append("<body>")
    lines.append(f"<h1>{title}</h1>")
    lines.append("<hr>")
    lines.append("<pre>")

    header = f"{'Name':<{w}} {'Size':>8}   {'Date':10}   Description"
    lines.append(header)
    lines.append("─" * len(header))

    if rel:
        lines.append('<a href="../">../</a>')

    for name, size, date, desc in entries:
        link = f'<a href="{name}">{name}</a>'
        pad = " " * (w - len(name))
        lines.append(f"{link}{pad} {size:>8}   {date:10}   {desc}")

    lines.append("</pre>")
    lines.append("<hr>")
    lines.append("</body>")
    lines.append("</html>")

    out = os.path.join(dirpath, "index.html")
    Path(out).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"  생성: {out}")


# ── README.md 생성 ───────────────────────────────────────────────


def gen_readme(dirpath):
    lines = []
    lines.append(f"# {TITLE}")
    lines.append("")
    lines.append("청주교육대학교 컴퓨터교육과 강의 공개 자료입니다.")
    lines.append("")
    lines.append("## 파일 목록")
    lines.append("")

    # 루트 파일: stem 기준으로 그룹
    seen = set()
    for name in sorted(os.listdir(dirpath)):
        if skip(name) or os.path.isdir(os.path.join(dirpath, name)):
            continue
        stem = Path(name).stem
        if stem in seen:
            continue
        seen.add(stem)

        md = os.path.join(dirpath, stem + ".md")
        desc = file_description(md) if os.path.exists(md) else ""
        headings = file_summary(md) if os.path.exists(md) else []

        label = f"**{stem}** ({desc})" if desc else f"**{stem}**"
        if headings:
            h_str = ", ".join(headings)
            lines.append(f"- {label} — {h_str} 등을 포함합니다.")
        else:
            lines.append(f"- {label}")
    lines.append("")

    # 하위 폴더
    for name in sorted(os.listdir(dirpath)):
        sub = os.path.join(dirpath, name)
        if skip(name) or not os.path.isdir(sub):
            continue

        ddesc = dir_description(sub)
        folder_label = f"### 📁 {name}/ ({ddesc})" if ddesc else f"### 📁 {name}/"
        lines.append(folder_label)
        lines.append("")

        seen_sub = set()
        for sname in sorted(os.listdir(sub)):
            if skip(sname) or os.path.isdir(os.path.join(sub, sname)):
                continue
            stem = Path(sname).stem
            if stem in seen_sub:
                continue
            seen_sub.add(stem)

            md = os.path.join(sub, stem + ".md")
            desc = file_description(md) if os.path.exists(md) else ""
            headings = file_summary(md) if os.path.exists(md) else []

            label = f"**{stem}** ({desc})" if desc else f"**{stem}**"
            if headings:
                h_str = ", ".join(headings)
                lines.append(f"- {label} — {h_str} 등을 포함합니다.")
            else:
                lines.append(f"- {label}")
        lines.append("")

    lines.append("각 자료는 MD와 PDF 형식으로 제공됩니다.")

    out = os.path.join(dirpath, "README.md")
    Path(out).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"  생성: {out}")


# ── 메인 ─────────────────────────────────────────────────────────


def main():
    print(f"[public index 생성] {PUBLIC}")

    # 루트
    gen_index(PUBLIC)
    gen_readme(PUBLIC)

    # 하위 폴더
    for name in sorted(os.listdir(PUBLIC)):
        sub = os.path.join(PUBLIC, name)
        if skip(name) or not os.path.isdir(sub):
            continue
        gen_index(sub, name)


if __name__ == "__main__":
    main()
