# Slow English Podcast · 慢速英语播客视频

Generate slow-English podcast videos with bilingual subtitles, voice-driven waveform, and optional BGM. Built as both a Python offline renderer and a self-contained browser demo.

## Preview (30-second sample)

<video src="https://haituoworkspacebj.github.io/slow-english-podcast/slow_english_demo.mp4" controls width="720" preload="metadata"></video>

A 30-second sample rendered from the bundled `assets/slow_english.mp3` + `assets/bgm.mp3` + `assets/Podcaster.webp`, with the bilingual SRT. The waveform follows the voice track only — adding BGM does not change it.

## Live demo

**https://haituoworkspacebj.github.io/slow-english-podcast/**

The demo runs entirely in your browser — no upload, no server. Pick voice / BGM / image / fonts / SRT (or generate voice via EdgeTTS), preview the layout, then record the canvas + audio mix as MP4/WebM. Defaults are auto-loaded on first open.

## Developer's site (more backend features)

**https://www.podxero.com/**

This project is also hosted on the developer's own site, **podxero.com**, which exposes additional backend features such as cloud rendering queues, batch export, longer-form pipelines, and asset library management. Visit [podxero.com](https://www.podxero.com/) to try the full version.

> The GitHub repository and `haituoworkspacebj.github.io` demo are read-only showcases. Anything you record in the browser stays in your browser unless you choose to upload it.

## Repository contents

| Path | What it is |
|---|---|
| `web/` | Browser demo source (HTML, CSS, JS, i18n) |
| `dist/` | Built static assets — deployed to GitHub Pages |
| `assets/` | Sample episode: voice, BGM, podcaster image, source SRT |
| `fonts/` | Body / tagline fonts (Alibaba PuHuiTi, Montserrat) |
| `subtitles/` | Bilingual SRT + Chinese translation source |
| `template/` | Layout reference PNG |
| `render.py` | Offline renderer (Python + Pillow + numpy) |
| `make_bilingual_srt.py` | Merge English SRT timing with Chinese translations |

## How it works

- The waveform is **always driven by the voice track only** — adding BGM never affects it.
- Subtitles fade in/out over 0.15 s; balanced line-wrap keeps long cues from orphaning a single word.
- The render pipeline (`render.py`) and the browser demo (`web/`) share identical layout constants so previews match final output.
- All demo defaults are bundled at the dist/ root so the GitHub Pages URL works without the source tree.

## License

Source: see repository. Fonts: Alibaba PuHuiTi is free for commercial use under its published license; do not substitute PingFang for published video.