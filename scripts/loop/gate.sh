#!/usr/bin/env bash
# Loop gates: tests, build, and no NEW design-detector findings vs the
# baseline captured before the loop started (pre-existing ones are listed in
# scripts/loop/detector-baseline.txt and must only ever shrink).
set -euo pipefail
cd "$(dirname "$0")/../.."
pnpm test
pnpm build
DET=/home/felipe/.claude/plugins/cache/impeccable/impeccable/4.3.1/skills/impeccable/scripts/impeccable
# detect exits non-zero whenever it finds anything; the baseline decides.
FINDINGS=$("$DET" detect --json src 2>/dev/null || true)
printf '%s' "$FINDINGS" | python3 -c "
import json,sys
cur={f\"{f['antipattern']} {f['file'].split('my-portfolio/')[1]}\" for f in json.load(sys.stdin)}
base=set(open('scripts/loop/detector-baseline.txt').read().split('\n'))-{''}
new=sorted(cur-base)
if new:
    print('NEW detector findings:'); [print(' ',n) for n in new]; sys.exit(1)
print(f'detector ok ({len(cur)} pre-existing, 0 new)')
"
