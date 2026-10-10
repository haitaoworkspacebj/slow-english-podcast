"""Slow English podcast video renderer (layout measured from template/demo.png).

Usage:
  python3 render.py preview <seconds> [-o out.png]              # single frame
  python3 render.py video [-o out.mp4] [--start S --duration D] # full video or a segment

Overridable per render (defaults keep the current project look):
  --voice A.mp3  --bgm B.mp3|none  --srt subs.srt  --podcaster left.png
  --font F.otf  --font-tag G.otf  --tagline "..."
"""
import argparse
import bisect
import re
import subprocess
import time
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).parent

W, H, FPS = 1920, 1080, 30
BG = (72, 72, 72)
WHITE = (255, 255, 255)
YELLOW = (246, 223, 19)
GRAY = (181, 181, 181)

SIZE_EN, SIZE_ZH, SIZE_TAG = 62, 54, 30
Y_EN, Y_ZH, Y_TAG = 238, 423, 1002          # vertical centers
TEXT_MAX_W = int(W * 0.84)

# Waveform: mirrored spectrum bars, edges taper into dots like the demo
WAVE_CX, WAVE_CY = W // 2, 763
N_BARS, BAR_W, BAR_GAP = 49, 6, 5
BAR_MIN, BAR_MAX = 6, 120
SR, HOP = 22050, 22050 // FPS

# Only these two regions change between frames
BAND_BOX = (0, 120, W, 500)            # subtitles, clear of the podcaster (top y=500)
WAVE_BOX = (680, 690, 1240, 836)       # waveform
FADE = 0.15                            # subtitle fade in/out, seconds
BGM_FADE_OUT = 3.0

IMG_MARGIN = 30                        # podcaster image: flush to the bottom edge
PODCASTER_H = 580                      # default height of the bottom-left figure


@dataclass
class Config:
    voice: Path
    bgm: Path | None = None
    srt: Path = ROOT / "subtitles" / "bilingual.srt"
    podcaster: Path | None = ROOT / "assets" / "Podcaster.webp"
    font_main: Path = ROOT / "fonts" / "AlibabaPuHuiTi-Bold.otf"
    font_tag: Path = ROOT / "fonts" / "AlibabaPuHuiTi-Regular.otf"
    tagline: str = "——这样建立你的“英语脑”——"


def default_config():
    return Config(voice=ROOT / "assets" / "slow_english.mp3", bgm=ROOT / "assets" / "bgm.mp3")


# ---------- audio ----------

def duration_of(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", str(path)], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def mix_audio(cfg, out, total):
    """Voice is the master track; BGM is looped end-to-end, cut at the voice length, faded out."""
    if cfg.bgm:
        graph = (
            "[0:a]aresample=48000,aformat=channel_layouts=stereo[v];"
            f"[1:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{total:.3f},"
            f"afade=t=out:st={total - BGM_FADE_OUT:.3f}:d={BGM_FADE_OUT}[b];"
            "[v][b]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.97[a]"
        )
        cmd = ["ffmpeg", "-y", "-v", "error", "-i", str(cfg.voice), "-stream_loop", "-1", "-i", str(cfg.bgm),
               "-filter_complex", graph, "-map", "[a]", "-c:a", "pcm_s16le", str(out)]
    else:
        graph = "[0:a]aresample=48000,aformat=channel_layouts=stereo,alimiter=limit=0.97[a]"
        cmd = ["ffmpeg", "-y", "-v", "error", "-i", str(cfg.voice),
               "-filter_complex", graph, "-map", "[a]", "-c:a", "pcm_s16le", str(out)]
    subprocess.run(cmd, check=True)


def load_mono(path, sr=SR):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
        capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)


def bar_levels(samples):
    """Per-video-frame bar heights in 0..1, shape (n_frames, N_BARS)."""
    n_fft = 2048
    n_frames = len(samples) // HOP
    pad = np.pad(samples, (n_fft // 2, n_fft))
    idx = np.arange(n_frames)[:, None] * HOP + np.arange(n_fft)[None, :]
    spec = np.abs(np.fft.rfft(pad[idx] * np.hanning(n_fft), axis=1))
    freqs = np.fft.rfftfreq(n_fft, 1 / SR)

    half = N_BARS // 2 + 1                    # bands for center + one side
    edges = np.geomspace(90, 5000, half + 1)
    bands = np.stack([spec[:, (freqs >= lo) & (freqs < hi)].mean(axis=1)
                      for lo, hi in zip(edges[:-1], edges[1:])], axis=1)
    db = 20 * np.log10(bands + 1e-9)
    top = np.percentile(db, 99)
    lv = np.clip((db - (top - 45)) / 45, 0, 1) ** 1.6

    # attack fast, release slow, so bars don't flicker
    out = np.empty_like(lv)
    cur = np.zeros(half)
    for i, row in enumerate(lv):
        cur = np.where(row > cur, cur + (row - cur) * 0.6, cur + (row - cur) * 0.18)
        out[i] = cur

    # mirror: low freqs in the middle, high toward the edges
    mirrored = np.concatenate([out[:, :0:-1], out], axis=1)
    pos = np.linspace(-1, 1, N_BARS)
    taper = np.exp(-(pos / 0.55) ** 2)       # edges stay as dots
    return mirrored * taper


# ---------- subtitles ----------

def parse_srt(path):
    ts = lambda s: (lambda h, m, sec, ms: int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000)(*re.split("[:,]", s))
    cues = []
    for block in re.split(r"\n\s*\n", path.read_text(encoding="utf-8").strip()):
        lines = block.strip().splitlines()
        a, b = lines[1].split(" --> ")
        cues.append((ts(a), ts(b), lines[2], lines[3] if len(lines) > 3 else ""))
    return cues


# ---------- drawing ----------

def font(path, size):
    return ImageFont.truetype(str(path), size)


def _glyph_sig(path, ch, size=40):
    f = ImageFont.truetype(str(path), size)
    img = Image.new("L", (size * 2, size * 2), 0)
    ImageDraw.Draw(img).text((size // 2, size // 2), ch, font=f, fill=255)
    return img.tobytes()


@lru_cache(maxsize=None)
def font_covers_cjk(path):
    """True when the font has real CJK glyphs (compared against a private-use char, which is never mapped)."""
    return _glyph_sig(path, "中") != _glyph_sig(path, "\ue001")


@lru_cache(maxsize=None)
def cjk_font_path(path):
    """Use path when it covers CJK, else a CJK font from fonts/, so text never turns into tofu."""
    path = Path(path)
    if font_covers_cjk(path):
        return path
    for cand in sorted((ROOT / "fonts").iterdir()):
        if cand.suffix.lower() in (".otf", ".ttf") and font_covers_cjk(cand):
            return cand
    return path


def wrap(draw, text, fnt, max_w):
    """Greedy wrap to find the line count, then narrow the width so lines come out balanced."""
    def greedy(limit):
        lines, cur = [], ""
        for w in text.split(" "):
            trial = f"{cur} {w}".strip()
            if draw.textlength(trial, font=fnt) <= limit or not cur:
                cur = trial
            else:
                lines.append(cur)
                cur = w
        return lines + [cur]

    lines = greedy(max_w)
    if len(lines) == 1:
        return lines
    limit = draw.textlength(text, font=fnt) / len(lines)
    while True:
        balanced = greedy(limit)
        if len(balanced) <= len(lines):
            return balanced
        limit += 10


def draw_centered(draw, text, fnt, cy, fill, max_w=TEXT_MAX_W, line_gap=1.25):
    lines = wrap(draw, text, fnt, max_w) if " " in text else [text]
    lh = fnt.size * line_gap
    top = cy - lh * len(lines) / 2
    for i, line in enumerate(lines):
        draw.text((W / 2, top + lh * (i + 0.5)), line, font=fnt, fill=fill, anchor="mm")


def _fit_image(path, target_h):
    p = Image.open(path).convert("RGBA")
    if p.getbbox():
        p = p.crop(p.getbbox())
    return p.resize((max(round(p.width * target_h / p.height), 1), target_h), Image.LANCZOS)


def build_base(cfg):
    """Background + podcaster image + tagline (static for the whole video)."""
    img = Image.new("RGBA", (W, H), BG + (255,))
    if cfg.podcaster:
        p = _fit_image(cfg.podcaster, PODCASTER_H)
        img.alpha_composite(p, (IMG_MARGIN, H - PODCASTER_H))
    d = ImageDraw.Draw(img)
    d.text((W / 2, Y_TAG), cfg.tagline, font=font(cjk_font_path(cfg.font_tag), SIZE_TAG), fill=GRAY, anchor="mm")
    return img


def text_layer(cfg, en, zh):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    if en:
        draw_centered(d, en, font(cfg.font_main, SIZE_EN), Y_EN, WHITE)
    if zh:
        draw_centered(d, zh, font(cjk_font_path(cfg.font_main), SIZE_ZH), Y_ZH, YELLOW)
    return layer


def draw_wave(draw, levels, origin=(0, 0)):
    """Draw bars; origin is the top-left of the target image in frame coordinates."""
    ox, oy = origin
    total = N_BARS * BAR_W + (N_BARS - 1) * BAR_GAP
    x0 = WAVE_CX - total / 2 - ox
    cy = WAVE_CY - oy
    for i, lv in enumerate(levels):
        h = BAR_MIN + (BAR_MAX - BAR_MIN) * float(lv)
        x = x0 + i * (BAR_W + BAR_GAP)
        draw.rounded_rectangle((x, cy - h / 2, x + BAR_W, cy + h / 2),
                               radius=BAR_W / 2, fill=WHITE)


class Composer:
    """Builds frames from a cached base, cached subtitle bands and per-frame waveform."""

    def __init__(self, cfg):
        self.cfg = cfg
        self.base = build_base(cfg).convert("RGB")
        self.cues = parse_srt(cfg.srt)
        self.starts = [c[0] for c in self.cues]
        self.empty_band = self.base.crop(BAND_BOX)
        self.bands = []
        for _, _, en, zh in self.cues:
            band = self.empty_band.copy()
            layer = text_layer(cfg, en, zh).crop(BAND_BOX)
            band.paste(layer, (0, 0), layer)
            self.bands.append(band)
        self.wave_bg = self.base.crop(WAVE_BOX)
        self.levels = bar_levels(load_mono(cfg.voice))

    def band_at(self, t):
        i = bisect.bisect_right(self.starts, t) - 1
        if i < 0 or t >= self.cues[i][1]:
            return self.empty_band
        a, b = self.cues[i][:2]
        alpha = min(1.0, (t - a) / FADE, (b - t) / FADE)
        if alpha >= 1.0:
            return self.bands[i]
        return Image.blend(self.empty_band, self.bands[i], max(alpha, 0.0))

    def frame(self, n):
        t = n / FPS
        img = self.base.copy()
        img.paste(self.band_at(t), BAND_BOX[:2])
        wave = self.wave_bg.copy()
        draw_wave(ImageDraw.Draw(wave), self.levels[min(n, len(self.levels) - 1)], WAVE_BOX[:2])
        img.paste(wave, WAVE_BOX[:2])
        return img


def preview(cfg, t, out):
    Composer(cfg).frame(round(t * FPS)).save(out)
    print(f"saved {out}")


def render_video(cfg, out, start=0.0, duration=None, progress=None):
    """Render [start, start+duration] of the video. progress(stage, done, total) is optional."""
    def report(stage, done, total):
        if progress:
            progress(stage, done, total)

    total = duration_of(cfg.voice)
    end = total if duration is None else min(total, start + duration)
    out.parent.mkdir(parents=True, exist_ok=True)

    mix = out.parent / "mix.wav"
    print("mixing audio ...")
    report("混音", 0, 1)
    mix_audio(cfg, mix, total)

    print("analysing voice + caching layers ...")
    report("分析人声 / 缓存字幕层", 0, 1)
    comp = Composer(cfg)
    first, last = round(start * FPS), round(end * FPS)

    cmd = ["ffmpeg", "-y", "-v", "error", "-stats",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-ss", f"{start:.3f}", "-t", f"{end - start:.3f}", "-i", str(mix),
           "-map", "0:v", "-map", "1:a",
           "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-tune", "stillimage", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(out)]
    enc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    t0 = time.time()
    try:
        for n in range(first, last):
            enc.stdin.write(comp.frame(n).tobytes())
            done = n - first + 1
            if done % 15 == 0 or done == last - first:
                report("渲染帧", done, last - first)
                if done % (FPS * 30) == 0:
                    print(f"\n  frame {done}/{last - first}  {done / max(time.time() - t0, 1e-6):.0f} fps", flush=True)
    finally:
        enc.stdin.close()
        enc.wait()
    mix.unlink(missing_ok=True)
    if enc.returncode:
        raise SystemExit(f"ffmpeg failed ({enc.returncode})")
    print(f"\nsaved {out}  ({last - first} frames, {time.time() - t0:.0f}s)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("preview")
    p.add_argument("t", type=float)
    p.add_argument("-o", default=str(ROOT / "output" / "preview.png"))
    v = sub.add_parser("video")
    v.add_argument("-o", default=str(ROOT / "output" / "slow_english.mp4"))
    v.add_argument("--start", type=float, default=0.0)
    v.add_argument("--duration", type=float)
    for sp in (p, v):
        sp.add_argument("--voice", default=str(ROOT / "assets" / "slow_english.mp3"))
        sp.add_argument("--bgm", default=str(ROOT / "assets" / "bgm.mp3"), help='pass "none" to disable bgm')
        sp.add_argument("--srt", default=str(ROOT / "subtitles" / "bilingual.srt"))
        sp.add_argument("--podcaster", default=str(ROOT / "assets" / "Podcaster.webp"), help='pass "none" to remove')
        sp.add_argument("--font", default=str(ROOT / "fonts" / "AlibabaPuHuiTi-Bold.otf"), help="subtitle font")
        sp.add_argument("--font-tag", default=str(ROOT / "fonts" / "AlibabaPuHuiTi-Regular.otf"))
        sp.add_argument("--tagline", default="——这样建立你的“英语脑”——")
    args = ap.parse_args()

    opt = lambda s: None if s.lower() in ("", "none", "off") else Path(s)
    cfg = Config(
        voice=Path(args.voice), bgm=opt(args.bgm), srt=Path(args.srt), podcaster=opt(args.podcaster),
        font_main=Path(args.font), font_tag=Path(args.font_tag), tagline=args.tagline,
    )
    if args.cmd == "preview":
        preview(cfg, args.t, Path(args.o))
    else:
        render_video(cfg, Path(args.o), args.start, args.duration)
