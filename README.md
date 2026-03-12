# Walkthrough

A pair of [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skills that generate deep technical walkthroughs of any codebase and render them into polished, interactive HTML readers.

## What This Does

**Walkthrough** turns any codebase into a 10-chapter technical document that explains how the system actually works — from the inside out. Not a summary. Not an overview. A real walkthrough, with actual code snippets captured from the repo, written for someone who wants to build a genuine mental model of the architecture.

Then it renders that document into a self-contained HTML reader you can open in any browser.

Here's a walkthrough of [Kirana Tap](https://github.com/Kartik0110-lgtm/Kirana-Tap-2), generated entirely by these two skills:

![Reader overview — Chapter 1 with sidebar navigation](assets/reader-overview.png)

![Code blocks with syntax-highlighted COMMAND/OUTPUT pairs](assets/reader-code.png)

![Interactive quiz with tiered questions](assets/reader-quiz.png)

### Key Features

- **Real Code, Not Paraphrases** — Every code block comes from a `showboat exec` command run against the actual repo. Nothing is copy-pasted or invented.
- **Zero Dependencies** — The rendered HTML is a single file. No npm, no build tools, no frameworks. Opens in any browser, works in 10 years.
- **Editorial Callouts** — Each chapter gets an insight or pattern callout that names something the reader absorbed passively but didn't consciously notice.
- **Project-Specific Quiz** — 6 multiple-choice questions testing architectural intuition + 4 design-thinking scenarios with collapsible answers. Every question is tailored to the specific codebase.
- **Dark Theme Reader** — Sidebar navigation, reading progress, chapter switching, collapsible sections, confetti on a perfect quiz score.

## Installation

Clone and copy to your Claude Code skills directory:

```bash
git clone https://github.com/Kartik0110-lgtm/walkthrough.git
cp -r walkthrough/walkthrough ~/.claude/skills/walkthrough
cp -r walkthrough/walkthrough-render ~/.claude/skills/walkthrough-render
```

Or symlink if you want to pull updates later:

```bash
git clone https://github.com/Kartik0110-lgtm/walkthrough.git ~/walkthrough-skills
ln -s ~/walkthrough-skills/walkthrough ~/.claude/skills/walkthrough
ln -s ~/walkthrough-skills/walkthrough-render ~/.claude/skills/walkthrough-render
```

Restart Claude Code. You should see `/walkthrough` and `/walkthrough-render` when you type `/`.

## Usage

### Step 1: Generate

Navigate to any project and run:

```
/walkthrough
```

This explores the codebase and writes `WALKTHROUGH.md` — a ~1,500-line document covering project overview, tech stack, entry point, file structure, core modules, data flow, design patterns, error handling, tests, and a closing mental model.

You can optionally focus on a specific area:

```
/walkthrough "focus on the authentication system"
```

### Step 2: Render

```
/walkthrough-render
```

This reads `WALKTHROUGH.md`, generates a Node.js build script, injects everything into the HTML template, validates the output, and opens the reader in your browser.

## Architecture

The skill uses **two-phase generation** — markdown first, HTML second. This keeps each phase focused and debuggable.

| File | Purpose | Used When |
|------|---------|-----------|
| `walkthrough/SKILL.md` | Generates `WALKTHROUGH.md` using showboat | `/walkthrough` |
| `walkthrough-render/SKILL.md` | Renders markdown into HTML reader | `/walkthrough-render` |
| `walkthrough-render/template.html` | HTML template with `%%PLACEHOLDER%%` injection points | `/walkthrough-render` |

The render skill generates a Node.js build script that handles:
- `safeReplace()` for all placeholder injections (avoids `$`-substitution bugs in `String.replace()`)
- `<script>` and `</script>` escaping in markdown content (walkthroughs of web projects contain HTML snippets that break the parser)
- `JSON.stringify()` for all prose content (the only safe way to handle apostrophes and special characters)
- Three-part validation before opening the browser (script tag count, JS syntax, no remaining placeholders)

## Philosophy

1. **Treat the reader as smart but new.** Use the real vocabulary — "goroutine", "middleware", "closure" — but explain it properly the first time. Never dumb things down.

2. **Show the actual code.** Every snippet is captured by running a command against the real repo. If you can't show it, don't claim it.

3. **Name the patterns.** "Defensive Automation", "Multi-Selector Fallback", "Pipeline with Side-Channel Updates" — giving a pattern a name makes it transferable to other codebases.

4. **The quiz tests understanding, not memory.** A reader who memorized bullet points should not automatically get all six right.

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI
- [showboat](https://pypi.org/project/showboat/) — `uv tool install showboat` or `pip install showboat`
- Node.js (for the render build script)

## Credits

Created by [@Kartik0110-lgtm](https://github.com/Kartik0110-lgtm) with Claude Code.

## License

MIT
