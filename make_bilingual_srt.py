"""Merge an English SRT (timing source) with subtitles/zh.txt (one Chinese line per kept cue).

Usage: python3 make_bilingual_srt.py [path/to/english.srt]
Without a path, uses the only *.srt in assets/.
Cues shorter than MIN_CUE seconds are recognition fragments ("1", "b", "呃") and are dropped.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
ZH_IN = ROOT / "subtitles" / "zh.txt"
SRT_OUT = ROOT / "subtitles" / "bilingual.srt"
MIN_CUE = 0.5


def to_seconds(s):
    h, m, sec, ms = re.split("[:,]", s.strip())
    return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000


def parse_srt(text):
    """Return a list of (timing_line, english_text, duration)."""
    cues = []
    for block in re.split(r"\n\s*\n", text.strip()):
        lines = block.strip().splitlines()
        if len(lines) >= 3:
            a, b = lines[1].split(" --> ")
            cues.append((lines[1].strip(), " ".join(l.strip() for l in lines[2:]), to_seconds(b) - to_seconds(a)))
    return cues


def find_srt():
    if len(sys.argv) > 1:
        return Path(sys.argv[1])
    found = sorted((ROOT / "assets").glob("*.srt"))
    if len(found) != 1:
        raise SystemExit(f"expected exactly one .srt in assets/, found {[f.name for f in found]}; pass a path")
    return found[0]


def main():
    srt_in = find_srt()
    cues = parse_srt(srt_in.read_text(encoding="utf-8-sig"))
    kept = [c for c in cues if c[2] >= MIN_CUE]
    for timing, en, _ in (c for c in cues if c[2] < MIN_CUE):
        print(f"dropped fragment: {timing}  {en!r}")
    zh = [l.strip() for l in ZH_IN.read_text(encoding="utf-8").splitlines() if l.strip()]
    if len(kept) != len(zh):
        raise SystemExit(f"cue count mismatch: srt={len(kept)} zh={len(zh)}")
    out = [f"{i}\n{timing}\n{en}\n{cn}\n" for i, ((timing, en, _), cn) in enumerate(zip(kept, zh), 1)]
    SRT_OUT.write_text("\n".join(out), encoding="utf-8")
    print(f"wrote {SRT_OUT} ({len(kept)} cues from {srt_in.name})")


if __name__ == "__main__":
    main()
