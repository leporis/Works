import os
from pathlib import Path
from datetime import datetime

ROOT = Path("docs")

TEMPLATE = """<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <style>
    body {{ font-family: sans-serif; max-width: 800px; margin: 2rem auto; padding: 1rem; }}
    h1 {{ text-align: center; }}
    ul {{ list-style: none; padding: 0; }}
    li {{ margin: 0.8rem 0; }}
    a {{ text-decoration: none; color: #0066cc; }}
    a:hover {{ text-decoration: underline; }}
    .date {{ color: #666; font-size: 0.9em; }}
  </style>
</head>
<body>
  <h1>{title}</h1>
  <p class="date">마지막 업데이트: {now}</p>
  <ul>
{items}
  </ul>
  <p><a href="../">← 상위로 돌아가기</a></p>
</body>
</html>
"""

def is_hidden(path):
    return path.name.startswith('.') or path.name == 'index.html'

def generate_index(dir_path: Path):
    title = dir_path.name.replace('_', ' ').title()
    items = []

    for item in sorted(dir_path.iterdir()):
        if is_hidden(item):
            continue

        name = item.name
        if item.is_dir():
            href = f"{name}/"
            text = name.replace('_', ' ')
        else:
            href = name
            text = name

        items.append(f'    <li><a href="{href}">{text}</a></li>')

    content = TEMPLATE.format(
        title=title,
        now=datetime.now().strftime("%Y-%m-%d %H:%M"),
        items='\n'.join(items)
    )

    index_path = dir_path / "index.html"
    index_path.write_text(content, encoding="utf-8")
    print(f"Generated: {index_path}")

def main():
    # 루트 index.html
    generate_index(ROOT)

    # 모든 하위 폴더
    for subdir in ROOT.rglob("*/"):
        if is_hidden(subdir):
            continue
        generate_index(subdir)

if __name__ == "__main__":
    main()