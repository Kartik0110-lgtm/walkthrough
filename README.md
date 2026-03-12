# Walkthrough — Claude Code Skills

Two skills for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) that generate deep technical walkthroughs of any codebase and render them into polished, interactive HTML readers.

**`/walkthrough`** explores your codebase and produces a comprehensive `WALKTHROUGH.md` — a 10-chapter technical document written for smart readers who want to genuinely understand how a system works.

**`/walkthrough-render`** takes that markdown and renders it into a self-contained HTML reader with a sidebar, editorial callouts, compact code snippets, and a project-specific quiz.

## What you get

- A 10-chapter walkthrough covering: project overview, tech stack, entry point, file structure, core modules, data flow, design patterns, error handling, tests, and mental model
- A polished HTML reader with dark theme, chapter navigation, reading progress, and collapsible sidebar
- Editorial callouts (insight/pattern) that surface non-obvious architectural decisions
- A 10-question quiz (6 multiple-choice + 4 design-thinking scenarios) tailored to the specific codebase

## Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI installed
- [showboat](https://github.com/benbucksch/showboat) — install with `uv tool install showboat` or `pip install showboat`
- Node.js (for the render build script)

## Installation

Copy both skill directories into your Claude Code skills folder:

```bash
# Clone this repo
git clone https://github.com/Kartik0110-lgtm/walkthrough.git

# Copy skills to your Claude Code skills directory
cp -r walkthrough/walkthrough ~/.claude/skills/walkthrough
cp -r walkthrough/walkthrough-render ~/.claude/skills/walkthrough-render
```

Or if you prefer a symlink approach:

```bash
git clone https://github.com/Kartik0110-lgtm/walkthrough.git ~/walkthrough-skills

ln -s ~/walkthrough-skills/walkthrough ~/.claude/skills/walkthrough
ln -s ~/walkthrough-skills/walkthrough-render ~/.claude/skills/walkthrough-render
```

After installation, restart Claude Code. The skills should appear when you type `/walkthrough` or `/walkthrough-render`.

## Usage

### Step 1: Generate the walkthrough

Navigate to any project directory and run:

```
/walkthrough
```

This explores the codebase and produces `WALKTHROUGH.md` in the current directory. Takes a few minutes depending on codebase size.

You can optionally pass a focus area:

```
/walkthrough "focus on the authentication system"
```

### Step 2: Render the HTML reader

Once `WALKTHROUGH.md` exists, run:

```
/walkthrough-render
```

This generates `walkthrough-reader.html` and opens it in your browser. The file is fully self-contained (no external dependencies except Google Fonts CDN).

## File structure

```
walkthrough/
  SKILL.md              # The /walkthrough skill instructions

walkthrough-render/
  SKILL.md              # The /walkthrough-render skill instructions
  template.html         # HTML reader template with %%PLACEHOLDER%% injection points
  examples/
    nutshell-callouts.md  # Example callout patterns
```

## How it works

**`/walkthrough`** uses `showboat` to build an executable document. It reads your codebase, plans 10 chapters, and uses `showboat exec` to capture real code snippets (never paraphrased). Every code block in the output comes from an actual command run against your project.

**`/walkthrough-render`** generates a Node.js build script that:
1. Reads `WALKTHROUGH.md` and `template.html`
2. Injects chapter definitions, editorial callouts, compact replacements, and a custom quiz
3. Escapes `<script>` tags in the markdown content (critical for walkthroughs of web projects)
4. Uses `safeReplace()` instead of `String.replace()` to avoid `$`-substitution bugs
5. Validates the output (script tag count, JS syntax, no remaining placeholders) before opening the browser

## License

MIT
