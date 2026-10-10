/* 语音合成面板 —— 双引擎：EdgeTTS（浏览器直连接口）/ 浏览器语音（Web Speech API）
 * 生成结果直接作为 demo 的人声轨载入，并按句子边界自动生成英文字幕。 */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var T = {
    engine: "edge",
    voices: [],          // edge: 内置/在线音色表；browser: SpeechSynthesisVoice[]
    blob: null,          // 最近一次生成的音频
    blobName: "",
    boundaries: [],
    busy: false,
    abort: null,
    previewEl: null,
    previewUrl: "",
  };

  var isEdgeUa = /Edg\//.test(navigator.userAgent) || /Edgios\//.test(navigator.userAgent);

  // ---------- loading / 状态 ----------

  function setTtsStatus(text, kind) {
    var el = $("ttsStatus");
    el.textContent = text;
    el.className = kind || "";
  }

  function setLoading(on, text) {
    T.busy = on;
    $("ttsLoading").hidden = !on;
    if (text) $("ttsLoadingText").textContent = text;
    for (var i = 0; i < BUSY_DISABLE.length; i++) $(BUSY_DISABLE[i]).disabled = on;
    $("ttsStop").disabled = false;
    refreshActionButtons();
  }

  var BUSY_DISABLE = ["ttsGenerate", "ttsCapture", "ttsPreview", "ttsSelfTest", "ttsVoiceRefresh"];

  function refreshActionButtons() {
    $("ttsDownload").disabled = T.busy || !T.blob;
    $("ttsSrt").disabled = T.busy || !T.boundaries.length;
  }

  // ---------- 音色列表 ----------

  function fmtGender(g) { return g === "Female" ? "女" : g === "Male" ? "男" : (g || ""); }

  function populateEdgeVoices() {
    var q = ($("ttsVoiceSearch").value || "").trim().toLowerCase();
    var sel = $("ttsVoice");
    sel.innerHTML = "";
    var groups = {};
    T.voices.forEach(function (v) {
      var hay = (v.short + " " + v.locale + " " + v.gender + " " + (v.pers || []).join(" ") + " " + (v.cats || []).join(" ")).toLowerCase();
      if (q && hay.indexOf(q) < 0) return;
      (groups[v.locale] = groups[v.locale] || []).push(v);
    });
    var locales = Object.keys(groups).sort();
    locales.forEach(function (loc) {
      var og = document.createElement("optgroup");
      og.label = loc;
      groups[loc].forEach(function (v) {
        var o = document.createElement("option");
        o.value = v.short;
        var name = v.short.indexOf(loc + "-") === 0 ? v.short.slice(loc.length + 1) : v.short;
        o.textContent = name + "（" + fmtGender(v.gender) + "）";
        og.appendChild(o);
      });
      sel.appendChild(og);
    });
    if (!locales.length) {
      var o = document.createElement("option");
      o.textContent = "无匹配音色";
      o.value = "";
      sel.appendChild(o);
    } else {
      sel.value = pickDefaultVoice();
    }
  }

  function pickDefaultVoice() {
    var want = ["en-US-EmmaMultilingualNeural", "en-US-AriaNeural", "zh-CN-XiaoxiaoNeural"];
    for (var i = 0; i < want.length; i++) {
      for (var j = 0; j < T.voices.length; j++) if (T.voices[j].short === want[i]) return want[i];
    }
    return T.voices.length ? T.voices[0].short : "";
  }

  function populateBrowserVoices() {
    var q = ($("ttsVoiceSearch").value || "").trim().toLowerCase();
    var sel = $("ttsVoice");
    sel.innerHTML = "";
    var groups = {};
    T.voices.forEach(function (v) {
      var hay = (v.name + " " + v.lang).toLowerCase();
      if (q && hay.indexOf(q) < 0) return;
      (groups[v.lang] = groups[v.lang] || []).push(v);
    });
    var langs = Object.keys(groups).sort();
    langs.forEach(function (lang) {
      var og = document.createElement("optgroup");
      og.label = lang;
      groups[lang].forEach(function (v) {
        var o = document.createElement("option");
        o.value = v.name;
        o.textContent = v.name;
        og.appendChild(o);
      });
      sel.appendChild(og);
    });
    if (!langs.length) {
      var o = document.createElement("option");
      o.textContent = T.voices.length ? "无匹配音色" : "（此浏览器没有可用音色）";
      sel.appendChild(o);
    }
  }

  async function loadVoices() {
    if (T.engine === "edge") {
      setLoading(true, "加载音色列表…");
      $("ttsVoice").innerHTML = '<option>加载中…</option>';
      try {
        T.voices = await EdgeTTS.listVoices();
        populateEdgeVoices();
        setTtsStatus("音色已就绪（" + T.voices.length + " 个），可搜索筛选");
      } catch (e) {
        setTtsStatus("音色列表加载失败：" + e.message, "err");
      }
      setLoading(false);
    } else {
      $("ttsVoice").innerHTML = '<option>加载系统音色…</option>';
      var list = window.speechSynthesis ? speechSynthesis.getVoices() : [];
      if (!list.length && window.speechSynthesis) {
        await new Promise(function (r) {
          var done = false;
          speechSynthesis.addEventListener("voiceschanged", function () { if (!done) { done = true; r(); } }, { once: true });
          setTimeout(function () { if (!done) { done = true; r(); } }, 1500);
        });
        list = speechSynthesis.getVoices();
      }
      T.voices = list;
      populateBrowserVoices();
      setTtsStatus(list.length ? "系统音色已就绪（" + list.length + " 个）" : "此浏览器没有暴露音色列表，可换 Edge/Chrome 或用 EdgeTTS 引擎", list.length ? "" : "err");
    }
    refreshActionButtons();
  }

  // ---------- 参数 ----------

  function signed(v, suffix) { return (v >= 0 ? "+" : "") + v + suffix; }

  function readParams() {
    if (T.engine === "edge") {
      return {
        rate: signed(+$("ttsRate").value, "%"),
        pitch: signed(+$("ttsPitch").value, "Hz"),
        volume: signed(+$("ttsVolume").value, "%"),
        format: $("ttsFormat").value,
      };
    }
    return {
      rate: (1 + +$("ttsRate").value / 100).toFixed(2),
      pitch: (1 + +$("ttsPitch").value / 100).toFixed(2),
      volume: (+$("ttsVolume").value / 100).toFixed(2),
    };
  }

  function updateParamLabels() {
    if (T.engine === "edge") {
      $("ttsRateVal").textContent = signed(+$("ttsRate").value, "%");
      $("ttsPitchVal").textContent = signed(+$("ttsPitch").value, "Hz");
      $("ttsVolumeVal").textContent = signed(+$("ttsVolume").value, "%");
    } else {
      $("ttsRateVal").textContent = (1 + +$("ttsRate").value / 100).toFixed(2) + "×";
      $("ttsPitchVal").textContent = (1 + +$("ttsPitch").value / 100).toFixed(2) + "×";
      $("ttsVolumeVal").textContent = $("ttsVolume").value + "%";
    }
  }

  function configureSliders() {
    var edge = T.engine === "edge";
    var r = $("ttsRate"), p = $("ttsPitch"), v = $("ttsVolume");
    if (edge) {
      r.min = -50; r.max = 100; r.step = 5; r.value = 0;
      p.min = -20; p.max = 20; p.step = 1; p.value = 0;
      v.min = -50; v.max = 50; v.step = 5; v.value = 0;
    } else {
      r.min = -50; r.max = 100; r.step = 5; r.value = 0;
      p.min = -100; p.max = 100; p.step = 5; p.value = 0;
      v.min = 0; v.max = 100; v.step = 5; v.value = 100;
    }
    updateParamLabels();
  }

  function updateEngineHint() {
    var hint = $("ttsEngineHint");
    if (T.engine === "edge") {
      hint.textContent = isEdgeUa
        ? "当前为 Edge 系浏览器，可直连微软合成服务，无需后端"
        : "⚠ 当前不是 Edge 浏览器：直连会被微软拒绝（403）。可在「高级设置」填中转代理，或切换「浏览器语音」";
    } else {
      hint.textContent = "本机浏览器合成，不联网。音色来自系统/浏览器（Edge 里即微软神经音色）；「录制」需要允许录制本标签页音频";
    }
  }

  function applyEngineUI() {
    var edge = T.engine === "edge";
    $("ttsFormatRow").hidden = !edge;
    $("ttsAdvanced").hidden = !edge;
    $("ttsGenerate").hidden = !edge;
    $("ttsCapture").hidden = edge;
    $("ttsCapture").textContent = "⏺ 录制并载入人声";
    configureSliders();
    updateEngineHint();
    loadVoices();
  }

  // ---------- 生成 / 载入 ----------

  function boundariesToCues(boundaries) {
    var cues = boundaries
      .filter(function (b) { return b.text && b.text.trim(); })
      .map(function (b) { return { a: b.offset / 1e7, b: (b.offset + b.duration) / 1e7, en: b.text.trim(), zh: "" }; })
      .sort(function (x, y) { return x.a - y.a; });
    for (var i = 0; i < cues.length - 1; i++) if (cues[i].b > cues[i + 1].a) cues[i].b = cues[i + 1].a;
    return cues.filter(function (c) { return c.b > c.a; });
  }

  function applyCues(cues) {
    if (!cues.length) return;
    S.touched = true;
    S.cues = cues;
    $("srtName").textContent = "TTS 句子边界（" + cues.length + " 条，英）";
    drawFrame(0);
  }

  function cuesToSrt(cues) {
    function ts(t) {
      var ms = Math.round(t * 1000);
      var h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000), s = Math.floor(ms % 60000 / 1000);
      var p = function (n) { return (n < 10 ? "0" : "") + n; };
      return p(h) + ":" + p(m) + ":" + p(s) + "," + ("00" + (ms % 1000)).slice(-3);
    }
    return cues.map(function (c, i) {
      return (i + 1) + "\n" + ts(c.a) + " --> " + ts(c.b) + "\n" + c.en + "\n";
    }).join("\n");
  }

  function download(blob, name) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 5000);
  }

  async function generateEdge() {
    var text = $("ttsText").value.trim();
    if (!text) return setTtsStatus("请先输入合成文本", "err");
    setLoading(true, "连接微软合成服务…");
    T.abort = new AbortController();
    var started = Date.now();
    try {
      var res = await EdgeTTS.synthesize({
        text: text,
        voice: $("ttsVoice").value || "en-US-EmmaMultilingualNeural",
        rate: readParams().rate,
        pitch: readParams().pitch,
        volume: readParams().volume,
        format: $("ttsFormat").value,
        signal: T.abort.signal,
        onProgress: function (bytes) {
          $("ttsLoadingText").textContent = "合成中… 已接收 " + (bytes / 1024).toFixed(1) + " KB";
        },
      });
      T.blob = res.blob;
      T.blobName = "edge-tts." + res.ext;
      T.boundaries = res.boundaries;
      var secs = ((Date.now() - started) / 1000).toFixed(1);
      setTtsStatus("生成完成：" + (res.blob.size / 1024).toFixed(1) + " KB，用时 " + secs + "s，已载入人声轨");
      applyCues(boundariesToCues(res.boundaries));
      S.touched = true;
      await HANDLERS.voice(new File([res.blob], T.blobName));
    } catch (e) {
      setTtsStatus("生成失败：" + e.message, "err");
    }
    setLoading(false);
    T.abort = null;
  }

  /* 浏览器语音引擎没有音频字节可拿，走「录制本标签页音频」得到文件 */
  async function generateViaCapture() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      return setTtsStatus("此浏览器不支持标签页音频录制，请用 EdgeTTS 引擎或 Chrome/Edge 浏览器", "err");
    }
    var text = $("ttsText").value.trim();
    if (!text) return setTtsStatus("请先输入合成文本", "err");
    setLoading(true, "等待授权：弹窗中选「此标签页」并勾选「分享标签页音频」…");
    var stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    } catch (e) {
      setLoading(false);
      return setTtsStatus("未获得授权：" + e.message, "err");
    }
    var audioTracks = stream.getAudioTracks();
    stream.getVideoTracks().forEach(function (t) { t.stop(); });
    if (!audioTracks.length) {
      stream.getTracks().forEach(function (t) { t.stop(); });
      setLoading(false);
      return setTtsStatus("没有捕获到音频：弹窗需选择「此标签页」并勾选「分享标签页音频」", "err");
    }
    var mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find(function (m) {
      return window.MediaRecorder && MediaRecorder.isTypeSupported(m);
    }) || "";
    var rec = new MediaRecorder(new MediaStream(audioTracks), mime ? { mimeType: mime } : undefined);
    var chunks = [];
    rec.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
    var stopped = new Promise(function (r) { rec.onstop = r; });
    rec.start();
    setLoading(true, "正在朗读并录制…（保持本标签页在前台）");
    try {
      await speakInBrowser(text);
    } catch (e) {
      /* 仍然收尾 */
    }
    await new Promise(function (r) { setTimeout(r, 400); });
    rec.stop();
    await stopped;
    stream.getTracks().forEach(function (t) { t.stop(); });
    T.blob = new Blob(chunks, { type: (rec.mimeType || "audio/webm").split(";")[0] });
    T.blobName = "browser-tts." + (T.blob.type.includes("mp4") ? "m4a" : "webm");
    T.boundaries = [];
    setTtsStatus("录制完成：" + (T.blob.size / 1024).toFixed(1) + " KB，已载入人声轨（浏览器引擎无句级时间轴，字幕请另配 SRT）");
    S.touched = true;
    try {
      await HANDLERS.voice(new File([T.blob], T.blobName));
    } catch (e) {
      setTtsStatus("录制完成但载入失败：" + e.message, "err");
    }
    setLoading(false);
  }

  function speakInBrowser(text) {
    return new Promise(function (resolve, reject) {
      if (!window.speechSynthesis) return reject(new Error("此浏览器不支持 Web Speech"));
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      var p = readParams();
      u.rate = +p.rate; u.pitch = +p.pitch; u.volume = +p.volume;
      var name = $("ttsVoice").value;
      var match = T.voices.find(function (v) { return v.name === name; });
      if (match) u.voice = match;
      u.onend = resolve;
      u.onerror = function (e) { reject(new Error(e.error || "朗读出错")); };
      speechSynthesis.speak(u);
    });
  }

  // ---------- 试听 / 停止 ----------

  async function preview() {
    stopAll();
    if (T.engine === "edge") {
      if (!T.blob) {
        setTtsStatus("首次试听需要先合成…");
        await generateEdge();
        if (!T.blob) return;
      }
      if (T.previewUrl) URL.revokeObjectURL(T.previewUrl);
      T.previewUrl = URL.createObjectURL(T.blob);
      T.previewEl = new Audio(T.previewUrl);
      T.previewEl.play().catch(function (e) { setTtsStatus("播放失败：" + e.message, "err"); });
      setTtsStatus("试听中…（当前参数生成的音频）");
    } else {
      setLoading(true, "正在朗读…");
      try {
        await speakInBrowser($("ttsText").value.trim());
        setTtsStatus("朗读完成");
      } catch (e) {
        setTtsStatus("朗读失败：" + e.message, "err");
      }
      setLoading(false);
    }
  }

  function stopAll() {
    if (T.previewEl) { try { T.previewEl.pause(); } catch (e) {} T.previewEl = null; }
    if (T.previewUrl) { URL.revokeObjectURL(T.previewUrl); T.previewUrl = ""; }
    if (window.speechSynthesis) speechSynthesis.cancel();
    if (T.abort) T.abort.abort();
  }

  // ---------- 自检 ----------

  async function selfTest() {
    if (T.engine === "browser") {
      $("ttsSelfTestResult").textContent = "浏览器引擎：直接点「试听」即可验证";
      return;
    }
    $("ttsSelfTestResult").textContent = "测试中…";
    EdgeTTS.setProxy($("ttsProxy").value);
    var t0 = Date.now();
    try {
      var res = await EdgeTTS.synthesize({ text: "Connection test, OK.", voice: $("ttsVoice").value || "en-US-EmmaMultilingualNeural" });
      $("ttsSelfTestResult").textContent = "✔ 连接成功（" + (Date.now() - t0) + "ms，" + res.blob.size + " 字节）";
    } catch (e) {
      $("ttsSelfTestResult").textContent = "✘ " + e.message;
    }
  }

  // ---------- 事件绑定 ----------

  $("ttsEngine").addEventListener("change", function () {
    T.engine = this.value;
    applyEngineUI();
  });

  $("ttsVoiceSearch").addEventListener("input", function () {
    T.engine === "edge" ? populateEdgeVoices() : populateBrowserVoices();
  });

  $("ttsVoiceRefresh").addEventListener("click", loadVoices);

  ["ttsRate", "ttsPitch", "ttsVolume"].forEach(function (id) {
    $(id).addEventListener("input", updateParamLabels);
  });

  $("ttsProxy").addEventListener("change", function () {
    EdgeTTS.setProxy(this.value);
    setTtsStatus(this.value ? "已设置中转代理：" + this.value : "已恢复直连模式");
  });

  $("ttsPreview").addEventListener("click", preview);
  $("ttsStop").addEventListener("click", function () {
    stopAll();
    setTtsStatus("已停止");
  });
  $("ttsGenerate").addEventListener("click", generateEdge);
  $("ttsCapture").addEventListener("click", generateViaCapture);
  $("ttsSelfTest").addEventListener("click", selfTest);

  $("ttsDownload").addEventListener("click", function () {
    if (T.blob) download(T.blob, T.blobName);
  });
  $("ttsSrt").addEventListener("click", function () {
    if (!T.boundaries.length) return;
    download(new Blob([cuesToSrt(boundariesToCues(T.boundaries))], { type: "text/plain" }), "tts_en.srt");
  });

  // ---------- 初始化 ----------

  configureSliders();
  updateEngineHint();
  applyEngineUI();
})();
