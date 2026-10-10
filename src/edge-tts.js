/* EdgeTTS —— 浏览器直连微软 Edge 在线合成服务的纯前端客户端（无需后端）
 * 协议移植自 python edge-tts：令牌放在 WebSocket URL 查询参数里，握手无需自定义头。
 * 注意：微软要求握手 UA 为完整浏览器 UA 且含 Edg/（或 Edgios/），故 Edge 浏览器可直连；
 * 其他浏览器会被 403 拒绝，可改用可选的中转代理（见 setProxy）。 */
(function () {
  "use strict";

  var TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
  var GEC_VERSION = "1-143.0.3650.75";
  var HOST = "speech.platform.bing.com";
  var WSS_PATH = "/consumer/speech/synthesize/readaloud/edge/v1";
  var VOICES_URL = "https://" + HOST + "/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=" + TOKEN;

  var FORMATS = {
    mp3_48: { id: "audio-24khz-48kbitrate-mono-mp3", ext: "mp3", mime: "audio/mpeg", bitrate: 48000 },
    mp3_96: { id: "audio-24khz-96kbitrate-mono-mp3", ext: "mp3", mime: "audio/mpeg", bitrate: 96000 },
    wav: { id: "riff-24khz-16bit-mono-pcm", ext: "wav", mime: "audio/wav", bitrate: 0 },
    webm: { id: "webm-24khz-16bit-mono-opus", ext: "webm", mime: "audio/webm", bitrate: 0 },
  };

  var proxyBase = "";
  function setProxy(url) {
    proxyBase = (url || "").trim().replace(/\/+$/, "");
  }

  // ---------- SHA-256（crypto.subtle 不可用时的纯 JS 兜底，如 file:// 环境） ----------

  var K256 = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  function sha256Pure(bytes) {
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var l = bytes.length, bitLen = l * 8;
    var withPad = new Uint8Array((((l + 9) >> 6) + 1) << 6);
    withPad.set(bytes);
    withPad[l] = 0x80;
    var dv = new DataView(withPad.buffer);
    dv.setUint32(withPad.length - 8, Math.floor(bitLen / 4294967296));
    dv.setUint32(withPad.length - 4, bitLen >>> 0);

    var w = new Uint32Array(64);
    for (var off = 0; off < withPad.length; off += 64) {
      for (var i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
      for (i = 16; i < 64; i++) {
        var s0 = ((w[i - 15] >>> 7) | (w[i - 15] << 25)) ^ ((w[i - 15] >>> 18) | (w[i - 15] << 14)) ^ (w[i - 15] >>> 3);
        var s1 = ((w[i - 2] >>> 17) | (w[i - 2] << 15)) ^ ((w[i - 2] >>> 19) | (w[i - 2] << 13)) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (i = 0; i < 64; i++) {
        var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K256[i] + w[i]) >>> 0;
        var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }
    return H.map(function (x) { return ("00000000" + x.toString(16)).slice(-8); }).join("").toUpperCase();
  }

  function bytesToHexUpper(buf) {
    var u8 = new Uint8Array(buf), s = "";
    for (var i = 0; i < u8.length; i++) s += ("0" + u8[i].toString(16)).slice(-2);
    return s.toUpperCase();
  }

  async function sha256Hex(str) {
    var bytes = new TextEncoder().encode(str);
    if (self.crypto && crypto.subtle && self.isSecureContext !== false) {
      try {
        return bytesToHexUpper(await crypto.subtle.digest("SHA-256", bytes));
      } catch (e) { /* 降级到纯 JS */ }
    }
    return sha256Pure(bytes);
  }

  /* Sec-MS-GEC：Windows 文件时间（100ns），向下取整到 5 分钟窗口后与 TrustedClientToken 一起哈希 */
  async function secMsGec() {
    var ticks = Date.now() / 1000 + 11644473600;
    ticks -= ticks % 300;
    ticks = ticks * 1e7;
    return sha256Hex(String(Math.round(ticks)) + TOKEN);
  }

  function randHex32() {
    var s = "";
    var u = new Uint8Array(16);
    (self.crypto || {}).getRandomValues ? crypto.getRandomValues(u) : u.forEach(function (_, i) { u[i] = Math.floor(Math.random() * 256); });
    for (var i = 0; i < u.length; i++) s += ("0" + u[i].toString(16)).slice(-2);
    return s;
  }

  function jsDate() {
    var d = new Date();
    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return days[d.getUTCDay()] + " " + months[d.getUTCMonth()] + " " + p(d.getUTCDate()) + " " +
      d.getUTCFullYear() + " " + p(d.getUTCHours()) + ":" + p(d.getUTCMinutes()) + ":" + p(d.getUTCSeconds()) +
      " GMT+0000 (Coordinated Universal Time)";
  }

  // ---------- 文本与 SSML ----------

  function removeIncompatible(text) {
    var out = "";
    for (var i = 0; i < text.length; i++) {
      var code = text.charCodeAt(i);
      out += (code <= 8 || (code >= 11 && code <= 12) || (code >= 14 && code <= 31)) ? " " : text[i];
    }
    return out;
  }

  function xmlEscape(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* 与 edge-tts 的 split_text_by_byte_length 同策略：按 4096 字节切，
   * 优先在换行/空格处断，避开 UTF-8 多字节字符和 XML 实体中间 */
  function splitText(text, limit) {
    var te = new TextEncoder(), td = new TextDecoder();
    var chunks = [];
    var bytes = te.encode(text);
    while (bytes.length > limit) {
      var splitAt = -1;
      for (var i = limit - 1; i >= 0; i--) if (bytes[i] === 10) { splitAt = i; break; }
      if (splitAt < 0) for (i = limit - 1; i >= 0; i--) if (bytes[i] === 32) { splitAt = i; break; }
      if (splitAt < 0) {
        splitAt = limit;
        while (splitAt > 0 && !validUtf8(bytes.subarray(0, splitAt))) splitAt--;
      }
      while (splitAt > 0) {
        var amp = -1;
        for (i = 0; i < splitAt; i++) if (bytes[i] === 38) amp = i;
        if (amp < 0) break;
        var semi = -1;
        for (i = amp; i < splitAt; i++) if (bytes[i] === 59) { semi = i; break; }
        if (semi >= 0) break;
        splitAt = amp;
      }
      if (splitAt <= 0) throw new Error("文本无法分块（单个 XML 实体超过限制）");
      var piece = td.decode(bytes.subarray(0, splitAt)).trim();
      if (piece) chunks.push(piece);
      bytes = bytes.subarray(splitAt);
    }
    var rest = td.decode(bytes).trim();
    if (rest) chunks.push(rest);
    return chunks;
  }

  function validUtf8(bytes) {
    try { new TextDecoder("utf-8", { fatal: true }).decode(bytes); return true; }
    catch (e) { return false; }
  }

  /* edge-tts 会把 zh-CN-XiaoxiaoNeural 转成微软的长名格式再发给服务 */
  function longVoiceName(voice) {
    var m = voice.match(/^([a-z]{2,})-([A-Z]{2,})-(.+Neural)$/);
    if (m) {
      var lang = m[1], region = m[2], name = m[3];
      if (name.indexOf("-") !== -1) {
        region = region + "-" + name.slice(0, name.indexOf("-"));
        name = name.slice(name.indexOf("-") + 1);
      }
      return "Microsoft Server Speech Text to Speech Voice (" + lang + "-" + region + ", " + name + ")";
    }
    return voice;
  }

  function mkSsml(voice, rate, pitch, volume, text) {
    return "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>" +
      "<voice name='" + longVoiceName(voice) + "'>" +
      "<prosody pitch='" + pitch + "' rate='" + rate + "' volume='" + volume + "'>" +
      text + "</prosody></voice></speak>";
  }

  // ---------- 协议收发 ----------

  function buildWsUrl(gec) {
    var query = "?TrustedClientToken=" + TOKEN +
      "&ConnectionId=" + randHex32() +
      "&Sec-MS-GEC=" + gec +
      "&Sec-MS-GEC-Version=" + GEC_VERSION;
    if (proxyBase) {
      var u = new URL(proxyBase);
      return (u.protocol === "https:" ? "wss://" : "ws://") + u.host + u.pathname.replace(/\/+$/, "") + WSS_PATH + query;
    }
    return "wss://" + HOST + WSS_PATH + query;
  }

  /* 一段文本 = 一条 WS 连接；返回 {audio: Uint8Array[], boundaries: []} */
  function synthChunk(gec, cfg, text, handlers) {
    return new Promise(function (resolve, reject) {
      var ws;
      try { ws = new WebSocket(buildWsUrl(gec)); }
      catch (e) { return reject(e); }
      ws.binaryType = "arraybuffer";
      var audioParts = [], boundaries = [], gotAudio = false;
      var settled = false;
      var timer = setTimeout(function () { fail(new Error("连接超时")); }, 20000);
      var recTimer = setTimeout(function () { fail(new Error("接收超时")); }, 90000);

      function done() {
        if (settled) return;
        settled = true;
        clearTimeout(timer); clearTimeout(recTimer);
        try { ws.close(); } catch (e) {}
        if (!gotAudio) return reject(new Error("服务未返回音频，请检查文本或参数"));
        resolve({ audio: audioParts, boundaries: boundaries });
      }
      function fail(err) {
        if (settled) return;
        settled = true;
        clearTimeout(timer); clearTimeout(recTimer);
        try { ws.close(); } catch (e) {}
        reject(err);
      }

      ws.onopen = function () {
        clearTimeout(timer);
        var boundaryOpts = '"sentenceBoundaryEnabled":"' + (cfg.boundary === "WordBoundary" ? "false" : "true") +
          '","wordBoundaryEnabled":"' + (cfg.boundary === "WordBoundary" ? "true" : "false") + '"';
        ws.send("X-Timestamp:" + jsDate() + "\r\n" +
          "Content-Type:application/json; charset=utf-8\r\n" +
          "Path:speech.config\r\n\r\n" +
          '{"context":{"synthesis":{"audio":{"metadataoptions":{' + boundaryOpts + "}," +
          '"outputFormat":"' + cfg.format.id + '"}}}}\r\n');
        ws.send("X-RequestId:" + randHex32() + "\r\n" +
          "Content-Type:application/ssml+xml\r\n" +
          "X-Timestamp:" + jsDate() + "Z\r\n" +
          "Path:ssml\r\n\r\n" +
          mkSsml(cfg.voice, cfg.rate, cfg.pitch, cfg.volume, text));
      };

      ws.onmessage = function (ev) {
        if (typeof ev.data === "string") {
          var idx = ev.data.indexOf("\r\n\r\n");
          var head = idx >= 0 ? ev.data.slice(0, idx) : ev.data;
          var path = (head.match(/^Path:(.*)$/m) || [])[1];
          if (path === "audio.metadata") {
            try {
              var meta = JSON.parse(ev.data.slice(idx + 1));
              (meta.Metadata || []).forEach(function (m) {
                if (m.Type === "WordBoundary" || m.Type === "SentenceBoundary") {
                  boundaries.push({
                    type: m.Type,
                    offset: m.Data.Offset + (handlers.offsetCompensation || 0),
                    duration: m.Data.Duration,
                    text: (m.Data.text && m.Data.text.Text) || "",
                  });
                }
              });
            } catch (e) {}
          } else if (path === "turn.end") {
            done();
          }
        } else {
          var dv = new DataView(ev.data);
          if (ev.data.byteLength < 2) return fail(new Error("音频帧格式错误"));
          var hl = dv.getUint16(0);
          if (hl + 2 > ev.data.byteLength) return fail(new Error("音频帧头部异常"));
          var payload = new Uint8Array(ev.data, 2 + hl);
          if (payload.length) {
            gotAudio = true;
            audioParts.push(payload);
            if (handlers.onAudio) handlers.onAudio(payload.length);
          }
        }
      };
      ws.onerror = function () { /* onclose 兜底报错 */ };
      ws.onclose = function () { fail(new Error("连接被关闭（若是 403：当前浏览器不被微软接受，需 Edge 浏览器或中转代理）")); };
    });
  }

  /* 服务端要求 rate/volume 为 [+-]N%、pitch 为 [+-]NHz；把滑杆值归一化 */
  function normSigned(value, suffix, fallback) {
    var m = String(value == null ? "" : value).trim().match(/^([+-]?)(\d+)(%|Hz)?$/);
    if (!m) return fallback;
    return (m[1] || "+") + m[2] + suffix;
  }

  /* 主入口：整段文本合成，返回 {blob, ext, mime, boundaries} */
  async function synthesize(opts) {
    var text = removeIncompatible(opts.text || "").trim();
    if (!text) throw new Error("文本为空");
    var voice = opts.voice || "en-US-EmmaMultilingualNeural";
    var cfg = {
      voice: voice,
      rate: normSigned(opts.rate, "%", "+0%"),
      pitch: normSigned(opts.pitch, "Hz", "+0Hz"),
      volume: normSigned(opts.volume, "%", "+0%"),
      format: FORMATS[opts.format] || FORMATS.mp3_48,
      boundary: opts.boundary === "WordBoundary" ? "WordBoundary" : "SentenceBoundary",
    };

    var gec = await secMsGec();
    var pieces = splitText(xmlEscape(text), 4096);
    var audioParts = [], boundaries = [], offsetCompensation = 0, chunkBytes = 0;
    var handlers = {
      offsetCompensation: 0,
      onAudio: function (n) {
        chunkBytes += n;
        if (opts.onProgress) opts.onProgress(audioBytes() + chunkBytes);
      },
    };
    function audioBytes() {
      var total = 0;
      for (var i = 0; i < audioParts.length; i++) total += audioParts[i].length;
      return total;
    }

    for (var i = 0; i < pieces.length; i++) {
      if (opts.signal && opts.signal.aborted) throw new Error("已取消");
      handlers.offsetCompensation = offsetCompensation;
      chunkBytes = 0;
      var res = await synthChunk(gec, cfg, pieces[i], handlers);
      res.boundaries.forEach(function (b) { boundaries.push(b); });
      res.audio.forEach(function (a) { audioParts.push(a); });
      /* 跨分块的时间偏移补偿：按 CBR 码率把已产出的字节换算成 100ns tick */
      if (cfg.format.bitrate > 0) {
        offsetCompensation += Math.floor(chunkBytes * 8 * 10000000 / cfg.format.bitrate);
      }
    }

    var blob = new Blob(audioParts, { type: cfg.format.mime });
    return { blob: blob, ext: cfg.format.ext, mime: cfg.format.mime, boundaries: boundaries, voice: voice, format: cfg.format.id };
  }

  /* 在线刷新音色列表；失败时回落到内置列表 */
  async function listVoices() {
    try {
      var gec = await secMsGec();
      var res = await fetch(VOICES_URL + "&Sec-MS-GEC=" + gec + "&Sec-MS-GEC-Version=" + GEC_VERSION);
      if (!res.ok) throw new Error("HTTP " + res.status);
      var data = await res.json();
      return data.map(function (v) {
        var tag = v.VoiceTag || {};
        return {
          short: v.ShortName,
          gender: v.Gender,
          locale: v.Locale,
          cats: tag.ContentCategories || [],
          pers: tag.VoicePersonalities || [],
        };
      });
    } catch (e) {
      return (self.EDGE_TTS_VOICES || []).slice();
    }
  }

  self.EdgeTTS = {
    FORMATS: FORMATS,
    setProxy: setProxy,
    synthesize: synthesize,
    listVoices: listVoices,
    secMsGec: secMsGec,
    sha256Hex: sha256Hex,
    splitText: splitText,
    longVoiceName: longVoiceName,
    _pure: sha256Pure,
  };
})();
