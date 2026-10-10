# Slow English Podcast · 慢速英语播客视频

**Generate slow-English podcast videos with bilingual subtitles, voice-driven waveform, and optional BGM — directly in your browser.**

> 其他语言：[中文版 README](./README.zh.md)

[![Live demo](https://img.shields.io/badge/demo-live-blue?style=flat-square)](https://haituoworkspacebj.github.io/slow-english-podcast/)
[![License](https://img.shields.io/badge/license-see%20repo-lightgrey?style=flat-square)](#license)
[![Languages](https://img.shields.io/badge/i18n-en%20%7C%20zh-success?style=flat-square)](#internationalization)
[![Deploy](https://img.shields.io/badge/deploy-GitHub%20Pages-222?style=flat-square)](https://haituoworkspacebj.github.io/slow-english-podcast/)

---

## 🎬 Demo

![30-second demo video](media/slow_english_demo.mp4)

> 30 seconds from a real render: bilingual subtitles, voice-driven waveform, and BGM underneath.

### Try it now

**→ https://haituoworkspacebj.github.io/slow-english-podcast/**

The demo loads the bundled episode automatically. Replace any asset, preview the layout live, then click **Generate video** to record the canvas + audio mix and download the file. No upload, no server, no TTS — voice and BGM are user-supplied (defaults are pre-loaded from the bundled assets).

### 📸 Screenshots

| Desktop | Mobile |
|---|---|
| ![Desktop view](media/screenshot-desktop.png) | ![Mobile view](media/screenshot-mobile.png) |

---

## 📑 Contents

- [🚀 Quick Start](#-quick-start)
- [✨ Features](#-features)
- [⚙️ Configuration](#-configuration)
- [📂 Repository](#-repository)
- [🔧 How it works](#-how-it-works)
- [🌍 Internationalization](#-internationalization)
- [🤝 Contributing](#-contributing)
- [⭐ Star History](#-star-history)
- [📄 License](#-license)

---

## 🚀 Quick Start

### 🌐 Browser demo (no install)

1. Open https://haituoworkspacebj.github.io/slow-english-podcast/
2. Click **▶ Generate preview** to render the layout live with the bundled voice + BGM
3. Swap any of: voice, BGM, podcaster image, fonts, SRT (file picker on the left)
4. Click **● Generate video** to record the canvas + audio mix; when it finishes, click the **↓ Download video** link that appears below the progress bar

That's it. Nothing is uploaded; everything runs in your browser.

### 🐍 Offline render (Python)

For full-resolution, batch, or CI use:

```bash
git clone https://github.com/haitaoworkspacebj/slow-english-podcast.git
cd slow-english-podcast
python3 -m pip install pillow numpy
python3 make_bilingual_srt.py                # merge English SRT + zh.txt
python3 render.py video                      # full episode → output/slow_english.mp4
python3 render.py preview 78.3               # single frame → output/preview.png
python3 render.py video --start 70 --duration 20 -o output/test.mp4   # segment
```

Tested on Python 3.10+ with Pillow and numpy.

---

## ✨ Features

- 🎙 **Voice-only waveform** — the spectrum bars follow the speaker's voice, not the BGM underneath. Subtle but it fixes the most common "demo video" tell.
- 📝 **Bilingual subtitles with balanced wrap** — 0.15 s fade in/out, lines auto-balance so no orphan words at the end.
- 📂 **All assets user-supplied** — voice, BGM, image, fonts, SRT are picked via the file chooser. No API keys, no remote calls.
- ⏺ **Browser-side record + manual download** — the canvas + audio mix goes straight to MP4 (or WebM if the browser doesn't support MP4 encoding). After recording, a click-to-download link appears; nothing is uploaded.
- ⚠️ **Inline error reporting** — decoding failures, font load errors, recorder init errors all surface in a red box instead of failing silently.
- 📱 **Responsive layout** — single column on phones, controls on top + stage below. The 1920×1080 canvas preserves aspect ratio at any width.
- 🌐 **Bilingual UI** — full `en` + `zh` translation, switcher in the header. Adding a third language is a one-file change.

---

## ⚙️ Configuration

The `render.py` offline renderer accepts CLI overrides for every input:

```bash
python3 render.py video \
  --voice   assets/voice.mp3 \
  --bgm     assets/bgm.mp3        # or "none"
  --srt     subtitles/bilingual.srt \
  --podcaster assets/Podcaster.webp \
  --font    fonts/AlibabaPuHuiTi-Bold.otf \
  --font-tag fonts/AlibabaPuHuiTi-Regular.otf \
  --tagline "——这样建立你的英语脑——"
```

The browser demo's file pickers let you swap each asset individually; no config file needed.

---

## 📂 Repository

| Path | Purpose |
|---|---|
| `web/` | Browser demo source — HTML, CSS, JS, i18n |
| `dist/` | Built static assets — deployed to GitHub Pages |
| `media/` | Demo MP4 + screenshots used in this README |
| `assets/` | Sample episode: voice, BGM, podcaster image, source SRT |
| `fonts/` | Body / tagline fonts (Alibaba PuHuiTi, Montserrat) |
| `subtitles/` | Bilingual SRT + Chinese translation source |
| `template/` | Layout reference PNG |
| `render.py` | Offline renderer (Python + Pillow + numpy) |
| `make_bilingual_srt.py` | Merge English SRT timing with Chinese translations |

---

## 🔧 How it works

- The waveform is **pre-analyzed from the voice track only** when voice is loaded. During playback, the canvas reads from a precomputed array, so BGM has no influence.
- The render pipeline (`render.py`) and the browser demo (`web/`) share identical layout constants, so the live preview matches the final MP4.
- All demo defaults (image, fonts, voice, BGM, SRT) are bundled at the `dist/` root, so the GitHub Pages URL works without the source tree.
- The browser demo records the canvas + audio mix via `MediaRecorder`; no upload server is involved.

For more detail see [`.claude/skills/slow-english-podcast/SKILL.md`](.claude/skills/slow-english-podcast/SKILL.md), which is the operational handbook used by Claude Code when working on this project.

---

## 🛰 Developer's site (more features)

**→ https://www.podxero.com/**

The same project also lives on [podxero.com](https://www.podxero.com/) with **more backend features**: cloud rendering queues, batch export, longer-form pipelines, asset library management. Visit there for the full version.

> This GitHub repo and the `haituoworkspacebj.github.io` demo are read-only showcases. Anything you record in the browser stays in your browser unless you choose to upload it.

---

## 🌍 Internationalization

The browser demo is fully bilingual. `web/i18n.js` ships `en` + `zh` dictionaries; every visible string in `web/index.html` is wired through a `data-i18n` attribute, and runtime status messages go through `I18N.t(key, …args)`. The language switcher (top-right) saves to `localStorage`, so the choice persists across reloads.

**To add a new language** (e.g. Japanese):

1. Append a `ja` column to `STRINGS` in `web/i18n.js`, mirroring the `en` shape.
2. Add `<option value="ja">日本語</option>` to the `#langSwitch` select in `web/index.html`.
3. Optionally add a navigator-language fallback in the `current` initialization block.
4. Re-minify `dist/i18n.js` and `dist/index.html`, redeploy.

That's the whole change set — no other files need to know about it.

---

## 🤝 Contributing

Issues and small patches are welcome. For anything beyond a typo fix, open an issue first so the approach can be agreed on. The render pipeline (`render.py`) and the browser demo (`web/`) **must stay in sync on layout constants** — any change to bar height, subtitle position, or fade duration has to be applied to both code paths and verified against `template/demo.png`.

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=haituoworkspacebj/slow-english-podcast&type=Date)](https://star-history.com/#haituoworkspacebj/slow-english-podcast&Date)

---

## 📄 License

Source: see repository. The font `fonts/AlibabaPuHuiTi-*.otf` (Alibaba PuHuiTi) is free for commercial use under its published license — do **not** substitute PingFang for the rendered video, as it's a macOS system font with ambiguous commercial terms.