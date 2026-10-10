# Skill: slow-english-podcast

Claude Code skill that gives the agent an operational handbook for the slow-English-podcast project in this workspace.

## What is this

- **Where it lives**: `.claude/skills/slow-english-podcast/SKILL.md`
- **What Claude sees**: the body of `SKILL.md`, which contains the project's render / translation / layout rules
- **What humans see**: this `README.md` and the repository-level README

## When does it load

- **Auto**: Claude Code reads `SKILL.md` frontmatter when the user's message matches the `description` keywords (`慢速英语`, `Slow English`, `播客视频`, `bilingual SRT`, `podcast video`, `video demo`, `GitHub Pages`, etc.).
- **Manual**: prefix the user's message with `/slow-english-podcast` to load it unconditionally.

## How to extend

Edit `SKILL.md`:

- `description` (frontmatter) — change **only** to refine what triggers this skill. Keep it short, mention the action verbs and noun keywords.
- Body — append new workflow rules or constraints; do not remove the existing 注意 / 流程 / 翻译规则 / 渲染 / 版式 / 换新一集 sections, they encode the project's hard-won constraints.

Adding a new section? Keep the same H2 style so Claude's heading-anchor generator stays predictable.

## Versioning

Last reviewed alongside commit `0605dc2`. If you update the body, also bump this line and the matching note in the repository `README.md` "How it works" section.