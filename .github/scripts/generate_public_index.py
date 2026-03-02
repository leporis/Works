#!/usr/bin/env python3
"""public/ 디렉토리의 index.html과 README.md를 자동 생성

구조:
  public/
  ├── index.html              ← 과목 목록
  ├── IoT_and_BigData/
  │   ├── index.html          ← 파일 목록
  │   ├── README.md           ← 파일 설명
  │   └── Simulators/
  │       └── index.html      ← 하위 파일 목록
  └── 다른_과목/
      └── ...
"""
import os, re, subprocess
from pathlib import Path

PUBLIC = "public"
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


def subject_title(dirpath):
    """과목 폴더에서 한글 과목명 추출"""
    readme = os.path.join(dirpath, "README.md")
    if os.path.exists(readme):
        heading, _ = read_md_heading(readme)
        if heading:
            return heading

    for name in sorted(os.listdir(dirpath)):
        if name.endswith(".md") and not skip(name):
            heading, _ = read_md_heading(os.path.join(dirpath, name))
            if heading:
                return heading

    return Path(dirpath).name


def file_description(filepath, title=""):
    """파일의 한글 설명 추출"""
    p = Path(filepath)
    md = p.with_suffix(".md") if p.suffix != ".md" else p
    if not md.exists():
        return ""

    heading, bold = read_md_heading(str(md))

    if title and title in heading and bold:
        d = re.sub(r"\[.*?\]\s*", "", bold)
        d = re.sub(r"(?<=[\uac00-\ud7a3])\s+(?=[\uac00-\ud7a3])", "", d)
        return d

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
    """md 파일의 h2 제목들 반환"""
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


def gen_index(dirpath, title, breadcrumb=""):
    page_title = f"Index of /{breadcrumb}/" if breadcrumb else f"Index of /{title}/"

    dirs, files = [], []
    for n in sorted(os.listdir(dirpath)):
        if skip(n):
            continue
        f = os.path.join(dirpath, n)
        if os.path.isdir(f):
            desc = subject_title(f) if not breadcrumb else dir_description(f)
            dirs.append((n + "/", "-", git_date(f), desc))
        else:
            files.append((n, size_str(f), git_date(f), file_description(f, title)))

    entries = dirs + files
    if not entries:
        return

    w = max((len(e[0]) for e in entries), default=4) + 2

    lines = []
    lines.append("<!DOCTYPE html>")
    lines.append("<html>")
    lines.append("<head>")
    lines.append('<meta charset="UTF-8">')
    lines.append(f"<title>{page_title}</title>")
    lines.append("</head>")
    lines.append("<body>")
    lines.append(f"<h1>{page_title}</h1>")
    lines.append("<hr>")
    lines.append("<pre>")

    header = f"{'Name':<{w}} {'Size':>8}   {'Date':10}   Description"
    lines.append(header)
    lines.append("─" * len(header))

    if breadcrumb:
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


def gen_readme(dirpath, title):
    lines = []
    lines.append(f"# {title}")
    lines.append("")

    for name in sorted(os.listdir(dirpath)):
        if name.endswith(".md") and not skip(name):
            heading, bold = read_md_heading(os.path.join(dirpath, name))
            if title in heading and bold:
                d = re.sub(r"\[.*?\]\s*", "", bold)
                d = re.sub(r"(?<=[\uac00-\ud7a3])\s+(?=[\uac00-\ud7a3])", "", d)
                lines.append(f"{d} 등 강의 공개 자료입니다.")
                lines.append("")
                break
    else:
        lines.append("강의 공개 자료입니다.")
        lines.append("")

    lines.append("## 파일 목록")
    lines.append("")

    seen = set()
    for name in sorted(os.listdir(dirpath)):
        if skip(name) or os.path.isdir(os.path.join(dirpath, name)):
            continue
        stem = Path(name).stem
        if stem in seen:
            continue
        seen.add(stem)

        md = os.path.join(dirpath, stem + ".md")
        desc = file_description(md, title) if os.path.exists(md) else ""
        headings = file_summary(md) if os.path.exists(md) else []

        label = f"**{stem}** ({desc})" if desc else f"**{stem}**"
        if headings:
            h_str = ", ".join(headings)
            lines.append(f"- {label} — {h_str} 등을 포함합니다.")
        else:
            lines.append(f"- {label}")
    lines.append("")

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
            desc = file_description(md, title) if os.path.exists(md) else ""
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


def process_subject(subject_dir, folder_name):
    title = subject_title(subject_dir)
    print(f"\n[과목] {folder_name} → {title}")

    gen_index(subject_dir, title, title)
    gen_readme(subject_dir, title)

    for name in sorted(os.listdir(subject_dir)):
        sub = os.path.join(subject_dir, name)
        if skip(name) or not os.path.isdir(sub):
            continue
        gen_index(sub, title, f"{title}/{name}")


def main():
    if not os.path.isdir(PUBLIC):
        print(f"[오류] {PUBLIC} 폴더가 없습니다.")
        return

    subjects = []
    for name in sorted(os.listdir(PUBLIC)):
        path = os.path.join(PUBLIC, name)
        if skip(name) or not os.path.isdir(path):
            continue
        subjects.append((name, path))

    if not subjects:
        print("[알림] public/ 에 과목 폴더가 없습니다.")
        return

    print(f"[루트] {PUBLIC}/")
    gen_index(PUBLIC, "공개 자료")

    for folder_name, subject_dir in subjects:
        process_subject(subject_dir, folder_name)


if __name__ == "__main__":
    main()
