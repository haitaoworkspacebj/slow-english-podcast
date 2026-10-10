---
name: slow-english-podcast
description: 制作慢速英语（Slow English）播客视频——给定人声录音和英文字幕，翻译成中英双语字幕，混入 BGM，按 demo 版式渲染 1080p 视频（左下角小人、人声驱动声波、双语字幕、标语）。项目自带纯静态浏览器 demo，所有素材由用户本地选择上传，可实时预览、录屏并下载。当用户提到慢速英语、Slow English、播客视频渲染、bilingual SRT、双语字幕、podcast video、video demo，或要求换一集、新增素材、改版式、压缩、部署到 GitHub Pages 时使用。
---

# 慢速英语播客视频

> **何时加载本 skill**：Claude Code 在本项目目录下启动时会扫描 `.claude/skills/`，看到上面的 `description` 就把这个文件装进上下文。用户在消息里提到上面关键词（"慢速英语"、"Slow English"、"播客视频"、"bilingual SRT"、"GitHub Pages"）会直接触发。
>
> **怎么显式调用**：在 Claude Code 里输入 `/slow-english-podcast`（目录名 = frontmatter 的 `name`）。
>
> **给人类看的说明**：见 [`README.md`](./README.md)。
>
> **架构基线（v2 起）**：浏览器 demo **不再包含 TTS 面板**。所有 voice / BGM / 图片 / 字体 都由用户通过文件选择器上传；默认素材（来自 `dist/` 根的 `slow_english.mp3`、`bgm.mp3`、`Podcaster.webp`、两个 otf、`bilingual.srt`）会在页面打开时自动加载。页面有 `errorBox` 暴露解码 / 加载 / 录制错误，不要静默吞掉。

## 流程

1. 素材就位：用户把人声录音（mp3）和对应的英文字幕（srt）放进 `assets/`
2. 翻译：把 srt 逐条翻译到 `subtitles/zh.txt`
3. 渲染：运行 `make_bilingual_srt.py` 合并双语字幕，然后渲染视频——用 demo 页面预览或命令行出片

## demo 页面（web/index.html，纯静态）

完全静态，无需任何服务器——双击用浏览器打开（file:// 直开）即用；整个 `web/` 目录可以拷进任何项目：

- 打开时自动加载**默认素材（当前一集）**：按「页面旁的 `assets/`、`fonts/`、`subtitles/` → 上级目录」顺序找 `slow_english.mp3`、`bgm.mp3`、`Podcaster.webp`、`bilingual.srt` 和普惠体字体，找到即就位，点「播放」就能预览这一集。静态托管（如 GitHub Pages）下自动生效；双击 file:// 打开时浏览器禁止网页自动读本地文件，会提示用左侧按钮手动选一次
- 手动选/清除任何素材后，默认加载自动让位，不会覆盖你的操作

- 换左下角图片（可调高度 100–800px）、换正文字体 / 标语字体（支持 .otf/.ttf）、换人声录音、换 BGM（可无）
- 加载 SRT 后按时间轴显示字幕；不加载就用页面上的演示文本
- 「Generate preview」= 人声 + BGM 混音播放，canvas 同步动效（声波随人声起伏、字幕 0.15 秒淡入淡出），音轨自然结束或点 Stop 后状态回到「Stopped」
- 「Generate video」= 把画布和混音实时录成 mp4（不支持时录 webm），**不自动下载**，完成后页面下方出现「↓ Download video」链接，点击才下载带时间戳的文件
- 任何加载 / 解码 / 录制错误写到 `#errorBox`（红色框），不要静默吞
- 页面里的版式参数与 render.py 保持一致；成片仍用命令行渲染（整片质量和时长更可控）

## 素材约定

| 文件 | 说明 |
|---|---|
| `assets/slow_english.mp3` | 主音轨，视频时长以它为准 |
| `assets/bgm.mp3` | 背景音。循环拼接到主音轨长度后截断，末尾淡出 3 秒，不做交叉淡化；渲染时可选无 BGM |
| `assets/Podcaster.webp` | 透明底的小人，静态，放在左下角 |
| `assets/*.srt` | 英文字幕，`assets/` 下只放一个（当前是 `zm_new.srt`）。文字和时间轴都以它为准，不重新识别，也不调时间 |
| `template/demo.png` | 版式参考图 |

## 翻译规则

- 写入 `subtitles/zh.txt`，每行对应 srt 里的一条字幕，行数必须一致（脚本会校验）
- 短于 0.5 秒的识别碎片（如 `1`、`b`、`呃`）会被脚本自动丢弃，不要为它们写翻译行
- 其他字幕不合并、不拆分、不删除
- 用口语化的短句，适合做字幕。举例用的英文单词保留原文，比如“当我说 hot coffee”
- 完成后运行 `python3 make_bilingual_srt.py`，生成 `subtitles/bilingual.srt`

## 渲染（命令行）

```bash
python3 render.py preview 78.3                                     # 单帧 → output/preview.png
python3 render.py video --start 70 --duration 20 -o output/test.mp4  # 片段测试
python3 render.py video                                            # 整片 → output/slow_english.mp4
```

素材/字体都可以按次覆盖，默认值就是当前项目的样子：

```bash
--voice A.mp3 --bgm B.mp3|none --srt subs.srt --podcaster left.png|none
--font F.otf --font-tag G.otf --tagline "..."
```

- 改了版式之后，先出单帧或 20 秒片段给用户确认，再渲染整片
- 渲染完用 ffprobe 核对：1920×1080、30fps，时长和人声一致。再抽一帧检查字幕和声波
- 6 分钟的整片在本机大约需要 2.5–3.5 分钟。清理测试片段和临时帧

## 版式（render.py 顶部常量，按 demo.png 量出）

| 元素 | 规格 |
|---|---|
| 背景 | #484848 |
| 英文字幕 | 白色，62px，阿里巴巴普惠体 Bold，中心 y=238。宽度超过 84% 时换行，且两行长度均衡（避免第二行只剩一两个词） |
| 中文字幕 | 黄色 #F6DF13，54px，普惠体 Bold，中心 y=423 |
| 字幕切换 | 0.15 秒淡入淡出 |
| 声波 | 49 根白色圆头竖条，中心 (960, 763)，高 6–120px。低频在中间，两侧收成小点；只由人声驱动，上升快、回落慢 |
| 小人 | 高 580px，左下角贴边（x=30） |
| 副标题 | `——这样建立你的“英语脑”——`，灰色 #B5B5B5，30px，普惠体 Regular，y=1002 |

## 换新一集时

1. 用户把新的人声和 srt 放进 `assets/`，旧 srt 移走（只保留一个）
2. 先核对字幕和人声是否对齐：最后一条字幕的结束时间应接近音频总时长。差得多就告诉用户，不要自己调时间轴
3. 重新翻译 `zh.txt`，运行 `make_bilingual_srt.py`，看它丢弃了哪些碎片
4. 找出最长的英文行，出单帧预览检查换行，再渲染整片，抽 3–4 帧检查
5. demo 页面的默认素材按固定文件名取（`assets/slow_english.mp3`、`assets/bgm.mp3`、`assets/Podcaster.webp`、`subtitles/bilingual.srt`、`fonts/` 两个普惠体），新一集用同样文件名覆盖后，页面默认值自动跟着换

## 注意

- 本机 ffmpeg 没有 drawtext 和 libass，文字用 Pillow 绘制，不要改用 ffmpeg 的字幕滤镜
- 字体用 `fonts/` 下的阿里巴巴普惠体，可免费商用。不用 PingFang，它是系统字体，用在发布的视频里授权不明确
- 每帧只重绘字幕带和声波框，其余部分用缓存，这样才能保持渲染速度
- 中文渲染始终走 `cjk_font_path()`：所选字体没有中文字形时回退到普惠体，缺字的豆腐块不允许出现在成片里
- demo 页面的 canvas 版式参数要和 render.py 保持一致，改一处就要同步另一处
