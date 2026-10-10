# 慢速英语播客视频 · Slow English Podcast

用人声录音和英文字幕，自动翻译成中英双语字幕、混入 BGM，按 demo 版式渲染 1080p 视频（左下角小人、人声驱动声波、双语字幕、标语）。同时提供 Python 离线渲染器和纯静态浏览器 demo。

> English version: [README.md](./README.md)

## 预览（30 秒样片）

<video src="https://haituoworkspacebj.github.io/slow-english-podcast/slow_english_demo.mp4" controls width="720" preload="metadata"></video>

样片由仓库自带的 `assets/slow_english.mp3` + `assets/bgm.mp3` + `assets/Podcaster.webp` 加双语 SRT 渲染而成。**声波只跟随人声跳动，不受 BGM 影响**。

## 在线 demo

**https://haituoworkspacebj.github.io/slow-english-podcast/**

完全在浏览器里运行——不上传，不需服务器。选人声 / BGM / 图片 / 字体 / SRT（或用 EdgeTTS 直接合成人声），实时预览版式后，把画布 + 混音录成 MP4 / WebM。首次打开会自动载入默认素材。页面**默认英文**，右上角下拉可切中文。

## 开发者网站（后台功能更全）

**https://www.podxero.com/**

本项目也在开发者的自有网站 [podxero.com](https://www.podxero.com/) 上线，那里提供更多后台能力：**云端渲染队列、批量导出、长视频流水线、素材库管理**。需要全功能版本请访问 [podxero.com](https://www.podxero.com/)。

> GitHub 仓库和 `haituoworkspacebj.github.io` 上的 demo 仅作展示。浏览器里录的视频默认留在本地，不会上传。

## 仓库结构

| 路径 | 用途 |
|---|---|
| `web/` | 浏览器 demo 源码（HTML、CSS、JS、i18n） |
| `dist/` | 构建产物静态资源——发布到 GitHub Pages |
| `assets/` | 样片素材：人声、BGM、小人图、源 SRT |
| `fonts/` | 正文字体 / 标语字体（阿里巴巴普惠体、Montserrat） |
| `subtitles/` | 双语 SRT + 中文翻译源文件 |
| `template/` | 版式参考 PNG |
| `render.py` | 离线渲染器（Python + Pillow + numpy） |
| `make_bilingual_srt.py` | 把英文字幕时间轴与中文翻译合并成双语 SRT |

## 工作原理

- **声波只跟人声走**——加 BGM 不会改变声波图样
- 字幕 0.15 秒淡入淡出；自动换行并保持两行长度均衡，避免单字孤儿行
- `render.py` 离线渲染器和 `web/` 浏览器 demo 共用同一套版式常量，预览与成片完全一致
- 所有默认素材都已打包到 `dist/` 根目录，GitHub Pages 直接可用，不需要源码树

## 国际化

`web/i18n.js` 收录了英文 + 中文两套文案；`web/index.html` 上所有可见文字都接 `data-i18n` 属性。语言切换器在页面右上角，记忆在 `localStorage` 里，刷新保留。添加新语言只要往 `i18n.js` 的 `STRINGS` 字典加一组即可。

## 字体授权

`fonts/AlibabaPuHuiTi-*.otf` 阿里巴巴普惠体可免费商用。**不要用 PingFang** 做最终视频字体——它是 macOS 系统字体，授权不明确。