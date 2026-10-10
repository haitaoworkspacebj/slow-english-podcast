/* Slow English Podcast · static demo — layout constants kept in sync with render.py.
   Right side: single <video> element with native browser controls.
   Default src is the bundled demo. Generate video records an offscreen canvas + audio
   mix, then swaps the video src to the recorded blob and shows a download link. */
const t = (key, ...args) => window.I18N ? window.I18N.t(key, ...args) : key;

const W = 1920, H = 1080, FPS = 30;
const BG = "#484848", WHITE = "#ffffff", YELLOW = "#F6DF13", GRAY = "#B5B5B5";
const SIZE_EN = 62, SIZE_ZH = 54, SIZE_TAG = 30;
const Y_EN = 238, Y_ZH = 423, Y_TAG = 1002;
const TEXT_MAX_W = W * 0.84;
const WAVE_CX = W / 2, WAVE_CY = 763, N_BARS = 49, BAR_W = 6, BAR_GAP = 5, BAR_MIN = 6, BAR_MAX = 120;
const FADE = 0.15, BGM_FADE = 3, IMG_MARGIN = 30;
const ACCEPT = {
  voice: "audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.opus",
  bgm: "audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.opus",
  imgLeft: "image/*,.png,.jpg,.jpeg,.webp,.gif,.bmp",
  srt: ".srt,.vtt",
  fontMain: ".otf,.ttf,.woff,.woff2",
  fontTag: ".otf,.ttf,.woff,.woff2",
};
const MAX_FILE_BYTES = 200 * 1024 * 1024;   // 200MB hard cap
const MIN_FILE_BYTES = 4;

const $ = (id) => document.getElementById(id);
const canvas = $("canvas");
const video = $("player");
const ctx = canvas.getContext("2d");
const base = document.createElement("canvas");
base.width = W; base.height = H;
const baseCtx = base.getContext("2d");

const S = {
  voice: null, voiceName: "", bgm: null, bgmName: "",
  imgLeft: null, imgLeftH: 580,
  fonts: [], fontMain: "", fontTag: "",
  cues: [], srtName: "",
  levels: null,
  playing: false,
  lastBlob: null, lastUrl: null,
};

function setStatus(text) { $("status").textContent = text; }
function setProgress(p) { $("bar").style.width = Math.round(Math.min(1, Math.max(0, p)) * 100) + "%"; }
function showError(msg) {
  const box = $("errorBox");
  if (!box) return;
  if (!msg) { box.hidden = true; box.textContent = ""; return; }
  box.hidden = false;
  box.textContent = msg;
}

// Show / clear the inline "loading…" state on a file-picker row.
// When loading, the fname shows a spinner + the filename and the row's
// Choose / Clear buttons are disabled. Scope is .filerow (not .field),
// so fontMain + fontTag can load independently even though they share
// one .field wrapper. Caller sets the fname text on its own.
function setRowLoading(nameEl, isLoading) {
  const row = nameEl ? nameEl.closest(".filerow") : null;
  if (!row) return;
  row.classList.toggle("is-loading", !!isLoading);
}

// Show / hide the video overlay (centered spinner + text).
// Pass a string to show with that text, or null / "" to hide.
function setVideoOverlay(text) {
  const overlay = $("videoOverlay");
  const textEl = $("videoOverlayText");
  if (!overlay) return;
  if (text) {
    if (textEl) textEl.textContent = text;
    overlay.hidden = false;
  } else {
    overlay.hidden = true;
  }
}

// Toggle the right-side action buttons between idle and busy.
// Idle: btnPlay + btnRecord enabled, btnStop disabled.
// Busy: btnPlay + btnRecord disabled, btnStop enabled.
function setActionsState(state) {
  const bar = $("actionsBar");
  if (!bar) return;
  const busy = state !== "idle";
  bar.classList.toggle("is-busy", busy);
  const play = $("btnPlay"), stop = $("btnStop"), rec = $("btnRecord");
  if (play) play.disabled = busy;
  if (rec)  rec.disabled = busy;
  if (stop) stop.disabled = !busy;
}
window.addEventListener("error", (e) => showError(`${e.message || e}`));
window.addEventListener("unhandledrejection", (e) => showError(`${(e.reason && e.reason.message) || e.reason || e}`));

function fontStr(size, family) {
  return `bold ${size}px ${family ? `"${family}", ` : ""}sans-serif`;
}

function wrapBalanced(c, text, font, maxW) {
  const greedy = (limit) => {
    const lines = []; let cur = "";
    for (const w of text.split(" ")) {
      const trial = (cur + " " + w).trim();
      if (c.measureText(trial).width <= limit || !cur) cur = trial;
      else { lines.push(cur); cur = w; }
    }
    lines.push(cur);
    return lines;
  };
  c.font = font;
  if (!text.includes(" ")) return [text];
  const lines = greedy(maxW);
  if (lines.length === 1) return lines;
  let limit = c.measureText(text).width / lines.length;
  for (;;) {
    const balanced = greedy(limit);
    if (balanced.length <= lines.length) return balanced;
    limit += 10;
  }
}

function drawCentered(c, text, font, size, cy, color) {
  c.font = font;
  c.fillStyle = color;
  const lines = wrapBalanced(c, text, font, TEXT_MAX_W);
  const lh = size * 1.25;
  const top = cy - (lh * lines.length) / 2;
  c.textAlign = "center";
  c.textBaseline = "middle";
  lines.forEach((line, i) => c.fillText(line, W / 2, top + lh * (i + 0.5)));
}

async function cropAlpha(bitmap) {
  const cv = new OffscreenCanvas(bitmap.width, bitmap.height);
  const cx = cv.getContext("2d");
  cx.drawImage(bitmap, 0, 0);
  const d = cx.getImageData(0, 0, cv.width, cv.height).data;
  let minX = cv.width, minY = cv.height, maxX = -1, maxY = -1;
  for (let y = 0; y < cv.height; y++) {
    for (let x = 0; x < cv.width; x++) {
      if (d[(y * cv.width + x) * 4 + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return bitmap;
  return createImageBitmap(bitmap, minX, minY, maxX - minX + 1, maxY - minY + 1);
}

function drawPodcaster(c, img, targetH) {
  const w = Math.max(Math.round((img.width * targetH) / img.height), 1);
  c.drawImage(img, IMG_MARGIN, H - targetH, w, targetH);
}

function rebuildBase() {
  baseCtx.fillStyle = BG;
  baseCtx.fillRect(0, 0, W, H);
  if (S.imgLeft) drawPodcaster(baseCtx, S.imgLeft, S.imgLeftH);
  drawCentered(baseCtx, t("tagline"), `400 ${SIZE_TAG}px ${S.fontTag ? `"${S.fontTag}", ` : ""}sans-serif`, SIZE_TAG, Y_TAG, GRAY);
}

function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
}

function barLevels(samples) {
  const nFft = 2048, hop = Math.floor(22050 / FPS), half = Math.floor(N_BARS / 2) + 1;
  const nFrames = Math.floor(samples.length / hop);
  const win = new Float32Array(nFft);
  for (let i = 0; i < nFft; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (nFft - 1));

  const edges = [];
  for (let i = 0; i <= half; i++) edges.push(90 * Math.pow(5000 / 90, i / half));
  const bands = [];
  for (let b = 0; b < half; b++) {
    let lo = -1, hi = -1;
    for (let k = 0; k <= nFft / 2; k++) {
      const f = (k * 22050) / nFft;
      if (lo < 0 && f >= edges[b]) lo = k;
      if (f < edges[b + 1]) hi = k;
    }
    bands.push([Math.max(lo, 0), Math.max(hi, 0)]);
  }

  const lv = new Float32Array(nFrames * half);
  const re = new Float32Array(nFft), im = new Float32Array(nFft);
  for (let f = 0; f < nFrames; f++) {
    for (let i = 0; i < nFft; i++) {
      const idx = f * hop + i - (nFft >> 1);
      re[i] = (idx >= 0 && idx < samples.length ? samples[idx] : 0) * win[i];
      im[i] = 0;
    }
    fft(re, im);
    for (let b = 0; b < half; b++) {
      let s = 0;
      const [lo, hi] = bands[b];
      for (let k = lo; k <= hi; k++) s += Math.hypot(re[k], im[k]);
      lv[f * half + b] = s / (hi - lo + 1);
    }
  }

  const db = new Float32Array(lv.length);
  for (let i = 0; i < lv.length; i++) db[i] = 20 * Math.log10(lv[i] + 1e-9);
  const sorted = Float32Array.from(db).sort();
  const top = sorted[Math.floor(0.99 * (sorted.length - 1))];

  const out = new Float32Array(lv.length);
  const cur = new Float32Array(half);
  for (let f = 0; f < nFrames; f++) {
    for (let b = 0; b < half; b++) {
      const v = Math.pow(Math.min(1, Math.max(0, (db[f * half + b] - (top - 45)) / 45)), 1.6);
      cur[b] += (v - cur[b]) * (v > cur[b] ? 0.6 : 0.18);
      out[f * half + b] = cur[b];
    }
  }

  const bars = new Float32Array(nFrames * N_BARS);
  for (let f = 0; f < nFrames; f++) {
    for (let i = 0; i < N_BARS; i++) {
      const src = i < half - 1 ? half - 1 - i : i - (half - 1);
      const pos = -1 + (2 * i) / (N_BARS - 1);
      bars[f * N_BARS + i] = out[f * half + src] * Math.exp(-Math.pow(pos / 0.55, 2));
    }
  }
  return bars;
}

async function toMono22k(buffer) {
  const off = new OfflineAudioContext(1, Math.max(1, Math.ceil(buffer.duration * 22050)), 22050);
  const src = off.createBufferSource();
  src.buffer = buffer;
  src.connect(off.destination);
  src.start();
  return (await off.startRendering()).getChannelData(0);
}

function drawWave(c, levels) {
  const total = N_BARS * BAR_W + (N_BARS - 1) * BAR_GAP;
  const x0 = WAVE_CX - total / 2;
  c.fillStyle = WHITE;
  for (let i = 0; i < N_BARS; i++) {
    const h = BAR_MIN + (BAR_MAX - BAR_MIN) * (levels ? levels[i] : 0.06);
    const x = x0 + i * (BAR_W + BAR_GAP);
    c.beginPath();
    c.roundRect(x, WAVE_CY - h / 2, BAR_W, h, BAR_W / 2);
    c.fill();
  }
}

function cueAt(t) {
  if (!S.cues.length) {
    return { en: $("enText").value.trim(), zh: $("zhText").value.trim(), alpha: 1 };
  }
  let lo = 0, hi = S.cues.length - 1, i = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (S.cues[mid].a <= t) { i = mid; lo = mid + 1; } else hi = mid - 1;
  }
  if (i < 0 || t >= S.cues[i].b) return null;
  const { a, b, en, zh } = S.cues[i];
  return { en, zh, alpha: Math.min(1, (t - a) / FADE, (b - t) / FADE) };
}

function drawSubtitle(c, t) {
  const cue = cueAt(t);
  if (!cue || cue.alpha <= 0) return;
  c.globalAlpha = cue.alpha;
  if (cue.en) drawCentered(c, cue.en, fontStr(SIZE_EN, S.fontMain), SIZE_EN, Y_EN, WHITE);
  if (cue.zh) drawCentered(c, cue.zh, fontStr(SIZE_ZH, S.fontMain), SIZE_ZH, Y_ZH, YELLOW);
  c.globalAlpha = 1;
}

function drawFrame(t) {
  ctx.drawImage(base, 0, 0);
  drawSubtitle(ctx, t);
  const frames = S.levels ? S.levels.length / N_BARS : 0;
  if (frames > 0) {
    const n = Math.min(Math.max(0, Math.floor(t * FPS)), frames - 1);
    drawWave(ctx, S.levels.subarray(n * N_BARS, (n + 1) * N_BARS));
  } else {
    drawWave(ctx, null);
  }
}

let audioCtx = null, nodes = [], playStart = 0, rafId = 0, tickTimer = 0, recorder = null, recChunks = [], recStopAt = 0, destForRec = null;

function ensureCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function stopPlayback() {
  nodes.forEach((n) => { try { n.stop(); } catch (e) {} });
  nodes = [];
  S.playing = false;
  cancelAnimationFrame(rafId);
  clearInterval(tickTimer);
  if (recorder && recorder.state === "recording") recorder.stop();
  if (!recorder || recorder.state !== "recording") {
    setStatus(t("status.stopped"));
    setActionsState("idle");
    setVideoOverlay(null);
  }
}

function playWithDest(dest, mode /* "preview" | "record" */) {
  stopPlayback();
  const ac = ensureCtx();
  const master = ac.createGain();
  master.connect(ac.destination);
  if (dest) master.connect(dest);

  playStart = ac.currentTime + 0.05;
  let endAt = playStart + 30;
  if (S.voice) {
    const v = ac.createBufferSource();
    v.buffer = S.voice;
    v.connect(master);
    v.start(playStart);
    v.onended = () => { stopPlayback(); };
    nodes.push(v);
    endAt = playStart + S.voice.duration;
  }
  if (S.bgm) {
    const b = ac.createBufferSource();
    b.buffer = S.bgm;
    b.loop = true;
    const g = ac.createGain();
    b.connect(g).connect(master);
    b.start(playStart);
    b.stop(endAt);
    const fadeStart = Math.max(playStart, endAt - BGM_FADE);
    g.gain.setValueAtTime(1, fadeStart);
    g.gain.linearRampToValueAtTime(0, endAt);
    nodes.push(b);
  }
  S.playing = true;
  setStatus(mode === "record"
    ? t("status.recording", Math.round(endAt - playStart))
    : t("status.playing"));
  if (mode === "record") {
    setVideoOverlay(t("status.recording", Math.round(endAt - playStart)));
  } else {
    setVideoOverlay(null);
  }
  let lastDraw = 0;
  const step = () => {
    lastDraw = performance.now();
    const cur = audioCtx.currentTime - playStart;
    drawFrame(Math.max(0, cur));
    if (mode === "record" && recorder && recorder.state === "recording") {
      setProgress(Math.min(1, cur / recStopAt));
      if (cur >= recStopAt) stopPlayback();
    }
  };
  const tick = () => {
    step();
    if (S.playing) rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
  tickTimer = setInterval(() => {
    if (S.playing && performance.now() - lastDraw > 120) step();
  }, 33);
}

function preview() {
  if (!S.voice && !S.bgm) { showError(t("error.nothingToPreview")); return; }
  showError("");
  setActionsState("busy");
  playWithDest(null, "preview");
}

function refreshDownloadLink() {
  const a = $("downloadLink");
  if (!a) return;
  if (S.lastBlob && S.lastUrl) {
    const ext = (S.lastBlob.type || "").includes("mp4") ? "mp4" : "webm";
    a.href = S.lastUrl;
    a.download = `slow_english_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.${ext}`;
    a.hidden = false;
  } else {
    a.removeAttribute("href");
    a.removeAttribute("download");
    a.hidden = true;
  }
}

function pickMime() {
  const cands = ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4",
    "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  for (const m of cands) if (window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m;
  return "";
}

function setVideoToRecorded(blob) {
  if (S.lastUrl) URL.revokeObjectURL(S.lastUrl);
  S.lastBlob = blob;
  S.lastUrl = URL.createObjectURL(blob);
  video.src = S.lastUrl;
  video.load();
  refreshDownloadLink();
}

function record() {
  if (!window.MediaRecorder) { showError(t("error.noMediaRecorder")); return; }
  if (!S.voice && !S.bgm) { showError(t("error.nothingToRecord")); return; }
  if (S.lastUrl) { URL.revokeObjectURL(S.lastUrl); }
  S.lastBlob = null;
  S.lastUrl = null;
  refreshDownloadLink();
  // Pause and reset the right-side video so the demo doesn't keep
  // playing while we record a new clip.
  try { if (!video.paused) video.pause(); } catch (e) {}
  video.removeAttribute("src");
  try { video.load(); } catch (e) {}
  stopPlayback();
  setProgress(0);
  showError("");
  setStatus(t("status.loadingRecord"));
  setVideoOverlay(t("status.loadingRecord"));
  setActionsState("busy");
  const ac = ensureCtx();
  const dest = ac.createMediaStreamDestination();
  destForRec = dest;

  playWithDest(dest, "record");

  const stream = new MediaStream([
    ...canvas.captureStream(FPS).getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);
  const mime = pickMime();
  try {
    recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 8_000_000 } : undefined);
  } catch (err) {
    showError(`${t("error.recorderInit")}: ${err.message}`);
    setStatus(t("status.ready"));
    setActionsState("idle");
    setVideoOverlay(null);
    return;
  }
  recChunks = [];
  recorder.ondataavailable = (e) => { if (e.data.size) recChunks.push(e.data); };
  recorder.onerror = (e) => {
    showError(`${t("error.recording")}: ${e.error && e.error.message ? e.error.message : e.error || "unknown"}`);
    try { recorder.stop(); } catch (err) {}
  };
  recorder.onstop = () => {
    setVideoOverlay(t("status.preparingVideo"));
    try {
      const type = (recorder.mimeType || "video/webm").split(";")[0];
      const blob = new Blob(recChunks, { type });
      if (blob.size === 0) {
        showError(t("error.emptyRecording"));
        setStatus(t("status.ready"));
      } else {
        setVideoToRecorded(blob);
        setProgress(1);
        setStatus(t("status.recordDone"));
      }
    } catch (err) {
      showError(`${t("error.recording")}: ${err.message || err}`);
      setStatus(t("status.ready"));
    }
    setActionsState("idle");
    setVideoOverlay(null);
    recorder = null;
  };
  const full = S.voice ? S.voice.duration : 30;
  recStopAt = full;
  try {
    recorder.start();
  } catch (err) {
    showError(`${t("error.recording")}: ${err.message || err}`);
    setStatus(t("status.ready"));
    setActionsState("idle");
    setVideoOverlay(null);
  }
}

async function loadAudio(file) {
  const ac = ensureCtx();
  return ac.decodeAudioData(await file.arrayBuffer());
}

// ---------- file precheck ----------

function sniff(head, kind) {
  if (head.length < 4) return false;
  const b0 = head[0], b1 = head[1], b2 = head[2], b3 = head[3];
  // Common audio: RIFF/WAVE, ID3, MP3 sync, OggS, ftyp, fLaC
  if (b0 === 0x52 && b1 === 0x49 && b2 === 0x46 && b3 === 0x46) return true;             // RIFF (WAV)
  if (b0 === 0x49 && b1 === 0x44 && b2 === 0x33) return true;                                  // ID3 (MP3 tag)
  if (b0 === 0xFF && (b1 & 0xE0) === 0xE0) return true;                                          // MP3 sync
  if (b0 === 0x4F && b1 === 0x67 && b2 === 0x67 && b3 === 0x53) return true;                  // OggS
  if (b0 === 0x66 && b1 === 0x74 && b2 === 0x79 && b3 === 0x70) return true;                  // ftyp (MP4/M4A/AAC)
  if (b0 === 0x66 && b1 === 0x4C && b2 === 0x61 && b3 === 0x43) return true;                  // fLaC
  // Common image: PNG, JPEG, RIFF/WEBP, GIF87a/GIF89a, BMP
  if (b0 === 0x89 && b1 === 0x50 && b2 === 0x4E && b3 === 0x47) return true;                  // PNG
  if (b0 === 0xFF && b1 === 0xD8 && b2 === 0xFF) return true;                                  // JPEG
  if (b0 === 0x47 && b1 === 0x49 && b2 === 0x46 && b3 === 0x38) return true;                  // GIF8
  // BMP "BM"
  if (b0 === 0x42 && b1 === 0x4D) return true;
  // Font: OTTO, wOFF, wOF2, true, \0\1\0\0 (TTF)
  if (b0 === 0x4F && b1 === 0x54 && b2 === 0x54 && b3 === 0x4F) return true;                  // OTF
  if (b0 === 0x77 && b1 === 0x4F && b2 === 0x46 && b3 === 0x46) return true;                  // WOFF
  if (b0 === 0x77 && b1 === 0x4F && b2 === 0x46 && b3 === 0x32) return true;                  // WOFF2
  if (b0 === 0x74 && b1 === 0x72 && b2 === 0x75 && b3 === 0x65) return true;                  // true (TTF)
  if (b0 === 0x00 && b1 === 0x01 && b2 === 0x00 && b3 === 0x00) return true;                  // TTF
  return false;
}

async function precheckFile(file, kind) {
  if (!file || file.size === 0) {
    return { ok: false, reason: t("error.fileEmpty", file ? file.name : "") };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, reason: t("error.fileTooLarge", file.name, (file.size / 1048576).toFixed(1)) };
  }
  if (file.size < MIN_FILE_BYTES) {
    return { ok: false, reason: t("error.fileEmpty", file.name) };
  }
  // Magic-byte sniff for binary kinds
  if (kind === "voice" || kind === "bgm" || kind === "imgLeft" ||
      kind === "fontMain" || kind === "fontTag") {
    try {
      const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
      if (!sniff(head, kind)) {
        return { ok: false, reason: t("error.badMagic", file.name, kind) };
      }
    } catch (e) {
      return { ok: false, reason: t("error.readFailed", file.name, e.message || e) };
    }
  }
  if (kind === "srt") {
    try {
      const text = await file.text();
      if (!/\d{1,3}[^\n]*\n\d{2}:\d{2}:\d{2}[,.]\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}[,.]\d{3}/.test(text)) {
        return { ok: false, reason: t("error.notSrt", file.name) };
      }
    } catch (e) {
      return { ok: false, reason: t("error.readFailed", file.name, e.message || e) };
    }
  }
  return { ok: true };
}

async function loadImage(file) {
  return cropAlpha(await createImageBitmap(file));
}

async function loadFont(file, slot) {
  const family = "userFont" + (S.fonts.length + 1);
  const face = new FontFace(family, await file.arrayBuffer());
  await face.load();
  document.fonts.add(face);
  S.fonts.push({ family, name: file.name });
  S[slot] = family;
  refreshFontSelects();
}

function refreshFontSelects() {
  for (const id of ["fontMain", "fontTag"]) {
    const sel = $(id);
    sel.innerHTML = "";
    const def = document.createElement("option");
    def.value = "";
    def.textContent = t("file.fontDefault");
    sel.appendChild(def);
    for (const f of S.fonts) {
      const o = document.createElement("option");
      o.value = f.family;
      o.textContent = f.name;
      sel.appendChild(o);
    }
    sel.value = S[id] || "";
  }
}

function parseSrt(text) {
  const toSec = (s) => {
    const [h, m, rest] = s.split(":");
    const [sec, ms] = rest.split(",");
    return +h * 3600 + +m * 60 + +sec + +ms / 1000;
  };
  const cues = [];
  for (const block of text.replace(/^﻿/, "").split(/\n\s*\n/)) {
    const lines = block.trim().split("\n");
    if (lines.length < 2 || !lines[1].includes("-->")) continue;
    const [a, b] = lines[1].split("-->").map((s) => toSec(s.trim()));
    const body = lines.slice(2).filter((l) => l.trim());
    if (b - a < 0.5) continue;
    cues.push({ a, b, en: body[0] || "", zh: body[1] || "" });
  }
  return cues;
}

const HANDLERS = {
  async voice(file) {
    const nameEl = $("voiceName");
    nameEl.textContent = t("status.loading", file.name);
    setRowLoading(nameEl, true);
    showError("");
    setStatus(t("status.loading", file.name));
    try {
      const pre = await precheckFile(file, "voice");
      if (!pre.ok) { showError(pre.reason); setStatus(t("status.ready")); return; }
      S.voice = await loadAudio(file);
      S.voiceName = file.name;
      setStatus(t("status.loadingVoice"));
      await new Promise((r) => setTimeout(r, 30));
      try {
        S.levels = barLevels(await toMono22k(S.voice));
      } catch (err) {
        showError(`${t("error.fft")} (${file.name}): ${err.message}`);
        S.levels = null;
      }
      nameEl.textContent = file.name;
      drawFrame(0);
      setStatus(t("status.voiceLoaded", file.name, S.voice.duration.toFixed(1)));
    } catch (err) {
      showError(`${t("error.decodeAudio")} (${file.name}): ${err.message}`);
      setStatus(t("status.ready"));
      nameEl.textContent = t("file.notSelected");
    } finally {
      setRowLoading(nameEl, false);
    }
  },
  async bgm(file) {
    const nameEl = $("bgmName");
    nameEl.textContent = t("status.loading", file.name);
    setRowLoading(nameEl, true);
    showError("");
    setStatus(t("status.loading", file.name));
    try {
      const pre = await precheckFile(file, "bgm");
      if (!pre.ok) { showError(pre.reason); setStatus(t("status.ready")); return; }
      S.bgm = await loadAudio(file);
      S.bgmName = file.name;
      nameEl.textContent = file.name;
      setStatus(t("status.bgmLoaded", file.name));
    } catch (err) {
      showError(`${t("error.decodeAudio")} (${file.name}): ${err.message}`);
      setStatus(t("status.ready"));
      nameEl.textContent = t("file.noBgm");
    } finally {
      setRowLoading(nameEl, false);
    }
  },
  async imgLeft(file) {
    const nameEl = $("imgLeftName");
    nameEl.textContent = t("status.loading", file.name);
    setRowLoading(nameEl, true);
    showError("");
    setStatus(t("status.loading", file.name));
    try {
      const pre = await precheckFile(file, "imgLeft");
      if (!pre.ok) { showError(pre.reason); setStatus(t("status.ready")); return; }
      S.imgLeft = await loadImage(file);
      nameEl.textContent = file.name;
      rebuildBase();
      drawFrame(0);
      setStatus(t("status.loaded", file.name));
    } catch (err) {
      showError(`${t("error.decodeImage")} (${file.name}): ${err.message}`);
      setStatus(t("status.ready"));
      nameEl.textContent = t("file.notSelected");
    } finally {
      setRowLoading(nameEl, false);
    }
  },
  async fontMain(file) {
    const nameEl = $("fontMainName");
    nameEl.textContent = t("status.loading", file.name);
    setRowLoading(nameEl, true);
    showError("");
    setStatus(t("status.loading", file.name));
    try {
      const pre = await precheckFile(file, "fontMain");
      if (!pre.ok) { showError(pre.reason); setStatus(t("status.ready")); return; }
      await loadFont(file, "fontMain");
      nameEl.textContent = file.name;
      rebuildBase(); drawFrame(0);
      setStatus(t("status.loaded", file.name));
    } catch (err) {
      showError(`${t("error.font")} (${file.name}): ${err.message}`);
      setStatus(t("status.ready"));
      nameEl.textContent = "";
    } finally {
      setRowLoading(nameEl, false);
    }
  },
  async fontTag(file) {
    const nameEl = $("fontTagName");
    nameEl.textContent = t("status.loading", file.name);
    setRowLoading(nameEl, true);
    showError("");
    setStatus(t("status.loading", file.name));
    try {
      const pre = await precheckFile(file, "fontTag");
      if (!pre.ok) { showError(pre.reason); setStatus(t("status.ready")); return; }
      await loadFont(file, "fontTag");
      nameEl.textContent = file.name;
      rebuildBase(); drawFrame(0);
      setStatus(t("status.loaded", file.name));
    } catch (err) {
      showError(`${t("error.font")} (${file.name}): ${err.message}`);
      setStatus(t("status.ready"));
      nameEl.textContent = "";
    } finally {
      setRowLoading(nameEl, false);
    }
  },
  async srt(file) {
    const nameEl = $("srtName");
    nameEl.textContent = t("status.loading", file.name);
    setRowLoading(nameEl, true);
    showError("");
    setStatus(t("status.loading", file.name));
    try {
      const pre = await precheckFile(file, "srt");
      if (!pre.ok) { showError(pre.reason); setStatus(t("status.ready")); return; }
      S.cues = parseSrt(await file.text());
      S.srtName = file.name;
      nameEl.textContent = `${file.name} (${t("srt.count", S.cues.length)})`;
      refreshDemoNote();
      drawFrame(0);
      setStatus(t("status.loaded", file.name));
    } catch (err) {
      showError(`${t("error.srt")} (${file.name}): ${err.message}`);
      setStatus(t("status.ready"));
      nameEl.textContent = t("file.notSelectedWithDemo");
    } finally {
      setRowLoading(nameEl, false);
    }
  },
};

const CLEAR = {
  voice() { S.voice = null; S.levels = null; $("voiceName").textContent = t("file.notSelected"); },
  bgm() { S.bgm = null; $("bgmName").textContent = t("file.noBgm"); },
  imgLeft() { S.imgLeft = null; $("imgLeftName").textContent = t("file.notSelected"); rebuildBase(); },
  srt() {
    S.cues = [];
    S.srtName = "";
    $("srtName").textContent = t("file.notSelectedWithDemo");
    refreshDemoNote();
  },
};

function refreshDemoNote() {
  const el = $("demoNote");
  const txt = $("demoNoteText");
  if (!el || !txt) return;
  if (S.cues && S.cues.length) {
    txt.textContent = t("file.demoNote", S.cues.length);
    el.hidden = false;
  } else if ($("srtName").textContent && $("srtName").textContent !== t("file.notSelectedWithDemo")) {
    // SRT name still shown but cues empty (parse failed) — already reported via showError.
    txt.textContent = t("file.demoNote", 0);
    el.hidden = false;
  } else {
    el.hidden = true;
  }
}

const DEFAULTS = [
  ["fontMain", ["AlibabaPuHuiTi-Bold.otf", "fonts/AlibabaPuHuiTi-Bold.otf", "../fonts/AlibabaPuHuiTi-Bold.otf"]],
  ["fontTag", ["AlibabaPuHuiTi-Regular.otf", "fonts/AlibabaPuHuiTi-Regular.otf", "../fonts/AlibabaPuHuiTi-Regular.otf"]],
  ["imgLeft", ["Podcaster.webp", "assets/Podcaster.webp", "../assets/Podcaster.webp"]],
  ["srt", ["bilingual.srt", "subtitles/bilingual.srt", "../subtitles/bilingual.srt"]],
  ["bgm", ["bgm.mp3", "assets/bgm.mp3", "../assets/bgm.mp3"]],
  ["voice", ["slow_english.mp3", "assets/slow_english.mp3", "../assets/slow_english.mp3"]],
];

async function loadDefaults() {
  if (S.touched) return;
  let loadedCount = 0;
  const missing = [];
  for (const [kind, paths] of DEFAULTS) {
    if (S.touched) return;
    let done = false;
    for (const p of paths) {
      try {
        const res = await fetch(p);
        if (!res.ok) continue;
        setStatus(t("status.loadingDefault", loadedCount + 1, DEFAULTS.length, p.split("/").pop()));
        await HANDLERS[kind](new File([await res.blob()], p.split("/").pop()));
        loadedCount++;
        done = true;
        break;
      } catch (e) { /* file:// or wrong path, try next */ }
    }
    if (!done) missing.push(kind);
  }
  if (S.touched) return;
  if (loadedCount === 0) {
    setStatus(location.protocol === "file:"
      ? t("status.fileProtocolWarn")
      : t("status.noDefaults"));
  } else if (missing.length) {
    setStatus(t("status.partialDefaults", loadedCount, DEFAULTS.length, missing.join(", ")));
  } else {
    setStatus(t("status.defaultsReady"));
  }
}

document.querySelectorAll("[data-file]").forEach((btn) => {
  btn.addEventListener("click", () => {
    S.touched = true;
    const kind = btn.dataset.file;
    const input = $("fileInput");
    input.accept = ACCEPT[kind];
    input.value = "";
    input.onchange = async () => {
      const f = input.files[0];
      if (!f) return;
      setStatus(t("status.loading", f.name));
      try {
        await HANDLERS[kind](f);
      } catch (e) {
        showError(`${t("error.handler")} (${kind}): ${e.message || e}`);
      }
    };
    input.click();
  });
});

document.querySelectorAll("[data-clear]").forEach((btn) => {
  btn.addEventListener("click", () => {
    S.touched = true;
    CLEAR[btn.dataset.clear]?.();
    drawFrame(0);
  });
});

$("imgLeftH").addEventListener("input", () => {
  S.imgLeftH = +$("imgLeftH").value;
  $("imgLeftHVal").textContent = $("imgLeftH").value + "px";
  rebuildBase();
  drawFrame(0);
});

for (const id of ["fontMain", "fontTag"]) {
  $(id).addEventListener("change", () => {
    S[id] = $(id).value;
    rebuildBase();
    drawFrame(0);
  });
}

for (const id of ["enText", "zhText"]) {
  $(id).addEventListener("input", () => drawFrame(0));
}

const demoNoteClearBtn = $("demoNoteClear");
if (demoNoteClearBtn) demoNoteClearBtn.addEventListener("click", () => { CLEAR.srt(); drawFrame(0); });

$("btnPlay").addEventListener("click", () => { showError(""); preview(); });
$("btnStop").addEventListener("click", () => {
  stopPlayback();
  setStatus(t("status.stopped"));
  setProgress(0);
  drawFrame(0);
});
$("btnRecord").addEventListener("click", () => { showError(""); record(); });

rebuildBase();
drawFrame(0);
setStatus(t("status.ready"));
loadDefaults();