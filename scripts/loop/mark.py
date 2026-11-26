"""Copies only the screenshots the critic flagged into the inbox, with a red
box drawn around each defect and no text. Usage:
python3 scripts/loop/mark.py <notes.md> <shotsDir> <inboxDir>

Note lines look like: `d-02-encontro-50.png | 120,340,400,90 | importante | why...`
"""
import re, shutil, subprocess, sys
from collections import defaultdict
from pathlib import Path

notes, shots, inbox = (Path(a) for a in sys.argv[1:4])
inbox.mkdir(parents=True, exist_ok=True)
line_re = re.compile(r"^\s*[-*]?\s*`?([\w.-]+\.png)`?\s*\|\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\|")
boxes = defaultdict(list)
for line in notes.read_text().splitlines():
    m = line_re.match(line)
    if m:
        f, x, y, w, h = m.group(1), *map(int, m.groups()[1:])
        boxes[f].append((x, y, w, h))
for f, rects in boxes.items():
    src = shots / f
    if not src.exists():
        print(f"missing {src}", file=sys.stderr)
        continue
    draw = []
    for x, y, w, h in rects:
        draw += ["-draw", f"rectangle {x},{y} {x + w},{y + h}"]
    subprocess.run(["magick", str(src), "-fill", "none", "-stroke", "#ff1a1a", "-strokewidth", "4", *draw, str(inbox / f)], check=True)
print(f"{sum(len(v) for v in boxes.values())} marks on {len(boxes)} shots")
