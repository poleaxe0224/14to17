"""
Fix WOF-corrupted JSON files in src/data/.
Re-reads files through Node.js (which can read its own WOF files)
and rewrites them via Python (which creates normal files).

Usage: python scripts/fix-wof.py
"""

import json
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / "src" / "data"

WOF_MAGIC = b'\x88\x7d'

JSON_FILES = [
    "wages.json",
    "cps_earnings.json",
    "onet-data.json",
    "tuition.json",
    "ipeds.json",
]


def is_wof_compressed(filepath):
    """Check if a file starts with WOF magic bytes."""
    with open(filepath, "rb") as f:
        return f.read(2) == WOF_MAGIC


def read_via_node(filepath):
    """Read a WOF-compressed JSON file by having Node.js read and output it."""
    result = subprocess.run(
        ["node", "-e", f"process.stdout.write(require('fs').readFileSync('{filepath.as_posix()}', 'utf-8'))"],
        capture_output=True,
        shell=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Node.js read failed: {result.stderr.decode()}")
    return result.stdout.decode("utf-8")


def main():
    fixed = 0
    for name in JSON_FILES:
        filepath = DATA_DIR / name
        if not filepath.exists():
            print(f"  SKIP {name} (not found)")
            continue

        if not is_wof_compressed(filepath):
            print(f"  OK   {name} (already readable)")
            continue

        print(f"  FIX  {name}...", end="")
        try:
            content = read_via_node(filepath)
            # Validate JSON
            data = json.loads(content)
            # Rewrite via Python (creates non-WOF file)
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f" OK ({len(content):,} bytes)")
            fixed += 1
        except Exception as e:
            print(f" FAILED: {e}")

    print(f"\nFixed {fixed} files")


if __name__ == "__main__":
    main()
