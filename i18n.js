/* Minimal i18n: keys + two languages. Add a new locale by adding a column here. */
(function () {
  const STRINGS = {
    en: {
      "app.title": "Slow English Podcast · Video Demo",
      "header.subtitle":
        "Pure static page, no server needed. Generate voice on the fly (EdgeTTS / browser speech), auto-load this episode's assets on open, preview in real time, play and record video.",

      "tts.title": "Text-to-Speech → Generate voice",
      "tts.engine": "TTS engine",
      "tts.engine.edge": "EdgeTTS · Microsoft online voices (direct)",
      "tts.engine.browser": "Browser speech · local synthesis",
      "tts.text": "Text",
      "tts.voice": "Voice",
      "tts.voice.refresh": "Refresh voice list",
      "tts.voice.search": "Search voices: zh-CN / Xiaoxiao / Female …",
      "tts.rate": "Rate",
      "tts.pitch": "Pitch",
      "tts.volume": "Volume",
      "tts.format": "Format",
      "tts.format.mp3_48": "MP3 · 24 kHz 48 kbps (default)",
      "tts.format.mp3_96": "MP3 · 24 kHz 96 kbps",
      "tts.format.wav": "WAV · 24 kHz 16-bit",
      "tts.format.webm": "WebM · Opus 24 kHz",
      "tts.advanced": "Advanced (proxy / test)",
      "tts.proxy.placeholder": "Proxy URL (optional) https://…workers.dev",
      "tts.proxy.hint":
        "Use when the direct endpoint returns 403: spin up a WS proxy and paste its URL here. See README. Empty = direct to Microsoft.",
      "tts.selfTest": "Self-test",
      "tts.preview": "▶ Preview",
      "tts.stop": "■ Stop",
      "tts.generate": "⚡ Generate & load voice",
      "tts.download": "↓ Download audio",
      "tts.srt": "↓ Export SRT",
      "tts.capture": "⏺ Record as audio",
      "tts.processing": "Processing…",
      "tts.status.idle": "Pick an engine and voice, type some text to synthesize",

      "file.voice": "Voice recording",
      "file.bgm": "Background music (BGM)",
      "file.imgLeft": "Bottom-left image",
      "file.srt": "Subtitle SRT (optional, with timings)",
      "file.fontMain": "Body font (EN / ZH)",
      "file.fontTag": "Tagline font",
      "file.demoText": "Demo subtitle text (used when no SRT)",
      "file.recDuration": "Recording duration (seconds, 0 = full)",
      "file.recHint": "Recording runs in real time",
      "file.chooseAudio": "Choose audio…",
      "file.chooseImage": "Choose image…",
      "file.chooseFont": "Choose font file…",
      "file.chooseSrt": "Choose SRT…",
      "file.notSelected": "Not selected",
      "file.noBgm": "No BGM",
      "file.notSelectedWithDemo": "Not selected (uses demo text below)",
      "file.clear": "Clear",
      "file.fontDefault": "Default font",

      "btn.play": "▶ Play",
      "btn.stop": "■ Stop",
      "btn.record": "● Record video",
      "btn.demoVideo": "▶ Play demo video",

      "stage.layout": "Layout preview (1920×1080)",
      "stage.video": "Video",
      "stage.downloadRecorded": "Download recorded video",

      "foot.note": "Demo runs entirely in your browser. Nothing is uploaded.",
      "foot.more": "More features (cloud rendering, batch export, library):",
      "foot.link": "podxero.com (developer's site)",

      "status.ready": "Ready: load assets then click Play or Record video",
      "status.analyzing": "Analyzing waveform…",
      "status.playing": "Playing…",
      "status.playingNoAudio": "Playing (no audio loaded, layout only)…",
      "status.stopped": "Stopped",
      "status.unsupportedRecord": "This browser does not support recording",
      "status.recordDone": "Recording complete, play or download",
      "status.recording": "Recording (real-time, ~{0} s)…",
      "status.voiceLoaded": "Voice {0} loaded ({1} s)",
      "status.bgmLoaded": "BGM {0} loaded",
      "status.loading": "Loading {0}…",
      "status.loadFailed": "Load failed: {0}",
      "status.loadingDefault": "Loading default assets ({0}/{1}): {2}…",
      "status.fileProtocolWarn":
        "Opened via file://, so the browser blocks auto local-file reads. Pick assets manually on the left. Static hosting auto-loads defaults.",
      "status.noDefaults":
        "No default assets found (assets/, fonts/, subtitles/). Pick manually on the left.",
      "status.partialDefaults":
        "Default assets loaded {0}/{1}, missing: {2} (can be added manually)",
      "status.defaultsReady": "Default assets ready (current episode). Click Play to preview.",
      "status.playingDemoVideo": "Playing demo video (30-second sample)",

      "srt.count": "{0} cues",
    },

    zh: {
      "app.title": "慢速英语播客 · 视频 Demo",
      "header.subtitle":
        "纯静态页面，无需服务器。可直接生成语音（EdgeTTS / 浏览器语音）当人声，打开即默认带上当前一集素材，实时预览，播放并录制视频",

      "tts.title": "语音合成 → 生成人声",
      "tts.engine": "合成引擎",
      "tts.engine.edge": "EdgeTTS · 微软在线音色（直连接口）",
      "tts.engine.browser": "浏览器语音 · 本机合成",
      "tts.text": "合成文本",
      "tts.voice": "音色",
      "tts.voice.refresh": "重新加载音色列表",
      "tts.voice.search": "搜索音色：zh-CN / Xiaoxiao / Female …",
      "tts.rate": "语速",
      "tts.pitch": "音调",
      "tts.volume": "音量",
      "tts.format": "格式",
      "tts.format.mp3_48": "MP3 · 24kHz 48kbps（默认）",
      "tts.format.mp3_96": "MP3 · 24kHz 96kbps",
      "tts.format.wav": "WAV · 24kHz 16bit",
      "tts.format.webm": "WebM · Opus 24kHz",
      "tts.advanced": "高级设置（中转代理 / 校验）",
      "tts.proxy.placeholder": "中转代理地址（可选）https://…workers.dev",
      "tts.proxy.hint":
        "直连被拒（403）时使用：自建 WS 中转后填入地址即可，见 README。留空 = 直连微软。",
      "tts.selfTest": "自检连接",
      "tts.preview": "▶ 试听",
      "tts.stop": "■ 停止",
      "tts.generate": "⚡ 生成并载入人声",
      "tts.download": "↓ 下载音频",
      "tts.srt": "↓ 导出 SRT",
      "tts.capture": "⏺ 录制为音频",
      "tts.processing": "处理中…",
      "tts.status.idle": "选择引擎和音色，输入文本即可合成",

      "file.voice": "人声录音",
      "file.bgm": "背景音乐 BGM",
      "file.imgLeft": "左下角图片",
      "file.srt": "字幕 SRT（可选，带时间轴）",
      "file.fontMain": "正文字体（英 / 中）",
      "file.fontTag": "标语字体",
      "file.demoText": "演示字幕文本（无 SRT 时显示）",
      "file.recDuration": "录制时长（秒，0 = 整段）",
      "file.recHint": "录制为实时进行",
      "file.chooseAudio": "选择音频…",
      "file.chooseImage": "选择图片…",
      "file.chooseFont": "选择字体文件…",
      "file.chooseSrt": "选择 SRT…",
      "file.notSelected": "未选择",
      "file.noBgm": "无 BGM",
      "file.notSelectedWithDemo": "未选择（用下方演示文本）",
      "file.clear": "清除",
      "file.fontDefault": "默认字体",

      "btn.play": "▶ 播放",
      "btn.stop": "■ 停止",
      "btn.record": "● 录制视频",
      "btn.demoVideo": "▶ 播放演示视频",

      "stage.layout": "版式预览（1920×1080）",
      "stage.video": "视频",
      "stage.downloadRecorded": "下载录制的视频",

      "foot.note": "演示完全在浏览器里运行，没有任何上传。",
      "foot.more": "更多功能（云端渲染、批量导出、素材库）：",
      "foot.link": "podxero.com（开发者网站）",

      "status.ready": "就绪：加载素材后点「播放」或「录制视频」",
      "status.analyzing": "分析声波 …",
      "status.playing": "播放中 …",
      "status.playingNoAudio": "播放中（未加载音频，仅版式）…",
      "status.stopped": "已停止",
      "status.unsupportedRecord": "当前浏览器不支持录制",
      "status.recordDone": "录制完成，可播放 / 下载",
      "status.recording": "录制中（实时，约 {0} 秒）…",
      "status.voiceLoaded": "已加载人声 {0}（{1}s）",
      "status.bgmLoaded": "已加载 BGM {0}",
      "status.loading": "加载 {0} …",
      "status.loadFailed": "加载失败：{0}",
      "status.loadingDefault": "加载默认素材（{0}/{1}）：{2} …",
      "status.fileProtocolWarn":
        "双击打开（file://）时浏览器不允许网页自动读本地文件，请在左侧手动选择素材；放到静态托管会自动带上默认素材",
      "status.noDefaults": "未找到默认素材（assets/、fonts/、subtitles/），请在左侧手动选择",
      "status.partialDefaults": "默认素材已加载 {0}/{1}，缺少：{2}（可手动补选）",
      "status.defaultsReady": "默认素材已就绪（当前一集），点「播放」预览",
      "status.playingDemoVideo": "正在播放演示视频（30 秒样片）",

      "srt.count": "{0} 条",
    },
  };

  const LS_KEY = "slowEnglishPodcast.lang";
  const DEFAULT_LANG = "en";

  let current = (() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved && STRINGS[saved]) return saved;
    } catch (e) { /* localStorage may be unavailable */ }
    const nav = (navigator.language || "").toLowerCase();
    if (nav.startsWith("zh")) return "zh";
    return DEFAULT_LANG;
  })();

  function t(key, ...args) {
    const s = (STRINGS[current] && STRINGS[current][key])
      || (STRINGS[DEFAULT_LANG] && STRINGS[DEFAULT_LANG][key])
      || (STRINGS.zh && STRINGS.zh[key])
      || key;
    if (!args.length) return s;
    return s.replace(/\{(\d+)\}/g, (_, i) => args[Number(i)] ?? "");
  }

  function setLang(lang) {
    if (!STRINGS[lang]) return;
    current = lang;
    try { localStorage.setItem(LS_KEY, lang); } catch (e) { /* ignore */ }
    applyTranslations();
  }

  function getLang() { return current; }

  function applyTranslations() {
    document.documentElement.lang = current === "zh" ? "zh" : "en";
    if (document.title !== undefined) document.title = t("app.title");
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      el.setAttribute("title", t(el.dataset.i18nTitle));
    });
    document.querySelectorAll("[data-i18n-value]").forEach((el) => {
      el.setAttribute("value", t(el.dataset.i18nValue));
    });
  }

  window.I18N = { t, setLang, getLang, applyTranslations, LANGUAGES: Object.keys(STRINGS) };
})();