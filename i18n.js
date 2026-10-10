/* Minimal i18n: keys + two languages. Add a new locale by adding a column here. */
(function () {
  const STRINGS = {
    en: {
      "app.title": "Slow English Podcast · Video Demo",
      "header.subtitle":
        "Pick a voice and BGM (or stick with the bundled defaults), preview the layout, then click Generate video to record and download an MP4 / WebM. Everything runs locally in your browser — no upload, no server.",

      "file.voice": "Voice recording",
      "file.bgm": "Background music (BGM)",
      "file.imgLeft": "Bottom-left image",
      "file.srt": "Subtitle SRT (optional, with timings)",
      "file.fontMain": "Body font (EN / ZH)",
      "file.fontTag": "Tagline font",
      "file.demoText": "Demo subtitle text (used when no SRT)",
      "file.demoNote": "SRT active ({0} cues) — demo text above is ignored. ",
      "file.demoNoteClear": "Clear SRT",
      "file.demoNoteReady": "No SRT loaded — these texts will appear as subtitles.",
      "file.demoNoteEmpty": "Add an EN + ZH line above (or upload an SRT).",
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

      "btn.play": "▶ Generate preview",
      "btn.stop": "■ Stop",
      "btn.record": "● Generate video",
      "btn.preview": "Preview",
      "btn.recordShort": "Record",
      "btn.save": "Save",
      "btn.clearAll": "Clear all",
      "btn.download": "Download",
      "btn.repo": "Repo",
      "btn.podxero": "podxero.com",

      "tip.preview": "Play the layout in real time without recording",
      "tip.repo": "Open the source repository on GitHub",
      "tip.podxero": "Visit the developer's site — podxero.com (cloud rendering, batch export, library)",
      "tip.stop": "Stop preview / recording",
      "tip.record": "Record the canvas + audio mix and offer a download",
      "tip.download": "Download the recorded MP4 / WebM",
      "tip.save": "Stash your assets + texts in this browser (IndexedDB) so they survive reloads",
      "tip.clearAll": "Clear every asset, the recorded video, and the browser stash",
      "tip.aboutSaving": "Assets and the last recording are saved to this browser's IndexedDB so they reload next visit. The browser may clear this data at any time — download the MP4 for a permanent copy.",

      "tagline": "—— Build your English brain ——",
      "stage.video": "Video",
      "stage.previewHint": "Your recorded video will appear here. Click Generate preview to scrub through the layout, or Generate video to record and download an MP4 / WebM.",

      "status.ready": "Ready: load assets then click Generate preview or Generate video",
      "status.analyzing": "Analyzing waveform…",
      "status.loadingVoice": "Loading voice (analyzing waveform)…",
      "status.loadingRecord": "Loading video (recording)…",
      "status.playing": "Playing…",
      "status.stopped": "Stopped",
      "status.recordDone": "Recording complete — file downloaded",
      "status.recording": "Recording (real-time, ~{0} s) — file will download when finished",
      "status.preparingVideo": "Preparing video…",
      "status.voiceLoaded": "Voice {0} loaded ({1} s)",
      "status.bgmLoaded": "BGM {0} loaded",
      "status.loaded": "{0} loaded",
      "status.loading": "Loading {0}…",
      "status.loadFailed": "Load failed: {0}",
      "status.loadingDefault": "Loading default assets ({0}/{1}): {2}…",
      "status.fileProtocolWarn":
        "Opened via file://, so the browser blocks auto local-file reads. Pick assets manually on the left. Static hosting auto-loads defaults.",
      "status.noDefaults":
        "No default assets found (assets/, fonts/, subtitles/). Pick manually on the left.",
      "status.partialDefaults":
        "Default assets loaded {0}/{1}, missing: {2} (can be added manually)",
      "status.defaultsReady":
        "Default assets ready (current episode). Click Generate preview to start.",

      "srt.count": "{0} cues",

      "download.link": "↓ Download video",
      "download.size": " ({0} MB)",

      "error.noMediaRecorder": "This browser does not support MediaRecorder — cannot record video.",
      "error.nothingToRecord": "Load a voice (or BGM) first, then click Generate video.",
      "error.nothingToPreview": "Load a voice (or BGM) first, then click Generate preview.",
      "error.recorderInit": "Could not start recorder",
      "error.recording": "Recording failed",
      "error.emptyRecording": "Recording produced an empty file. Try a shorter / different voice clip.",
      "error.decodeAudio": "Could not decode audio",
      "error.decodeImage": "Could not decode image",
      "error.font": "Could not load font",
      "error.srt": "Could not parse SRT",
      "error.fft": "Could not analyze waveform",
      "error.handler": "Handler error",
      "error.fileEmpty": "File is empty: {0}",
      "error.fileTooLarge": "File too large: {0} ({1} MB, max 200 MB)",
      "error.badMagic": "{0} does not look like a {1} file. Make sure you picked the right file.",
      "error.notSrt": "{0} does not look like an SRT file (no cue timestamps found).",
      "error.readFailed": "Could not read {0}: {1}",

      "foot.note": "Runs entirely in your browser. Nothing is uploaded.",
      "foot.more": "More features (cloud rendering, batch export, library):",
      "foot.link": "podxero.com (developer's site)",
    },

    zh: {
      "app.title": "慢速英语播客 · 视频 Demo",
      "header.subtitle":
        "选人声和 BGM（或用自带的默认一集），预览版式后点 Generate video 录制并下载 MP4 / WebM。完全在浏览器里运行——不上传，不需服务器。",

      "file.voice": "人声录音",
      "file.bgm": "背景音乐 BGM",
      "file.imgLeft": "左下角图片",
      "file.srt": "字幕 SRT（可选，带时间轴）",
      "file.fontMain": "正文字体（英 / 中）",
      "file.fontTag": "标语字体",
      "file.demoText": "演示字幕文本（无 SRT 时显示）",
      "file.demoNote": "SRT 已加载（{0} 条）——上方 demo 文本被忽略。",
      "file.demoNoteClear": "清除 SRT",
      "file.demoNoteReady": "未加载 SRT — 这两行文字会作为字幕显示。",
      "file.demoNoteEmpty": "在上方填入英中各一行（或上传 SRT）。",
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

      "btn.play": "▶ 生成预览",
      "btn.stop": "■ 停止",
      "btn.record": "● 生成视频",
      "btn.preview": "预览",
      "btn.recordShort": "录制",
      "btn.save": "保存",
      "btn.clearAll": "全部清空",
      "btn.download": "下载",
      "btn.repo": "项目仓库",
      "btn.podxero": "podxero.com",

      "tip.preview": "实时播放版式，不录制",
      "tip.repo": "打开 GitHub 上的源码仓库",
      "tip.podxero": "访问开发者站点 podxero.com（云端渲染、批量导出、素材库）",

      "tip.preview": "实时播放版式，不录制",
      "tip.stop": "停止预览 / 录制",
      "tip.record": "录制画布和混音，下载 MP4 / WebM",
      "tip.download": "下载录好的 MP4 / WebM",
      "tip.save": "把素材和文字存到本浏览器（IndexedDB），下次打开自动恢复",
      "tip.clearAll": "清空所有素材、已录制视频、以及本浏览器存储",
      "tip.aboutSaving": "素材和最后一次录制会存到 IndexedDB，下次访问自动恢复。但浏览器可能随时清除这些数据——需要永久保留请下载 MP4。",

      "tagline": "—— 这样建立你的英语脑 ——",
      "stage.video": "视频",
      "stage.previewHint": "录制好的视频会出现在这里。点「生成预览」可拖动时间轴查看版式；点「生成视频」会实时录制并下载 MP4 / WebM。",

      "status.ready": "就绪：加载素材后点「生成预览」或「生成视频」",
      "status.analyzing": "分析声波 …",
      "status.loadingVoice": "正在加载人声（分析声波）…",
      "status.loadingRecord": "正在加载视频（录制中）…",
      "status.playing": "播放中 …",
      "status.stopped": "已停止",
      "status.recordDone": "录制完成，文件已下载",
      "status.recording": "录制中（实时，约 {0} 秒）——完成后自动下载",
      "status.preparingVideo": "正在合成视频…",
      "status.voiceLoaded": "已加载人声 {0}（{1}s）",
      "status.bgmLoaded": "已加载 BGM {0}",
      "status.loaded": "已加载 {0}",
      "status.loading": "加载 {0} …",
      "status.loadFailed": "加载失败：{0}",
      "status.loadingDefault": "加载默认素材（{0}/{1}）：{2} …",
      "status.fileProtocolWarn":
        "双击打开（file://）时浏览器不允许网页自动读本地文件，请在左侧手动选择素材；放到静态托管会自动带上默认素材",
      "status.noDefaults": "未找到默认素材（assets/、fonts/、subtitles/），请在左侧手动选择",
      "status.partialDefaults": "默认素材已加载 {0}/{1}，缺少：{2}（可手动补选）",
      "status.defaultsReady": "默认素材已就绪（当前一集），点「生成预览」开始",

      "srt.count": "{0} 条",

      "download.link": "↓ 下载视频",
      "download.size": "（{0} MB）",

      "error.noMediaRecorder": "当前浏览器不支持 MediaRecorder——无法录制视频",
      "error.nothingToRecord": "请先加载人声（或 BGM），再点「生成视频」",
      "error.nothingToPreview": "请先加载人声（或 BGM），再点「生成预览」",
      "error.recorderInit": "无法启动录制器",
      "error.recording": "录制失败",
      "error.emptyRecording": "录制产出的文件为空，请换一段人声再试",
      "error.decodeAudio": "音频解码失败",
      "error.decodeImage": "图片解码失败",
      "error.font": "字体加载失败",
      "error.srt": "SRT 解析失败",
      "error.fft": "声波分析失败",
      "error.handler": "处理错误",
      "error.fileEmpty": "文件为空：{0}",
      "error.fileTooLarge": "文件过大：{0}（{1} MB，上限 200 MB）",
      "error.badMagic": "{0} 看起来不是 {1} 文件，请确认选对了文件",
      "error.notSrt": "{0} 看起来不是 SRT 文件（找不到字幕时间戳）",
      "error.readFailed": "无法读取 {0}：{1}",

      "foot.note": "完全在浏览器里运行，没有任何上传。",
      "foot.more": "更多功能（云端渲染、批量导出、素材库）：",
      "foot.link": "podxero.com（开发者网站）",
      "status.saved": "已保存 ✓ — 素材和文字存到本浏览器",
      "status.saving": "正在保存…",
      "status.savedShort": "已保存 ✓",
      "status.savedPartial": "已保存 {0} 项，{1} 项失败",
      "status.saveFailed": "保存失败",
      "status.clearedAll": "已清空所有素材 + 本浏览器存储",
      "status.clearing": "正在清空…",
      "status.restoring": "正在恢复上次会话…",
      "status.restored": "已从本浏览器恢复 {0} 项",
      "status.nothingToSave": "暂无可保存内容——先选一段人声",

      "status.saved": "Saved ✓ — assets + texts stashed in this browser",
      "status.saving": "Saving…",
      "status.savedShort": "Saved ✓",
      "status.savedPartial": "Saved {0} items, {1} failed",
      "status.saveFailed": "Save failed",
      "status.clearedAll": "All assets cleared + browser stash wiped",
      "status.clearing": "Clearing…",
      "status.restoring": "Restoring saved session…",
      "status.restored": "Restored {0} items from this browser",
      "status.nothingToSave": "Nothing to save yet — pick a voice first",
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
    // Resolve data-tip-i18n="tip.xxx" → data-tip="translated text" so the
    // CSS `content: attr(data-tip)` hover tooltip shows the localized string.
    document.querySelectorAll("[data-tip-i18n]").forEach((el) => {
      const key = el.dataset.tipI18n;
      if (key) el.setAttribute("data-tip", t(key));
    });
  }

  window.I18N = { t, setLang, getLang, applyTranslations, LANGUAGES: Object.keys(STRINGS) };
})();