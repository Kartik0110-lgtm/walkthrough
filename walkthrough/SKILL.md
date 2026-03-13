---
name: walkthrough
description: Generate a deep technical walkthrough of the current codebase using showboat, written for a smart non-technical reader who wants to genuinely understand how things work.
argument-hint: "[optional: focus area or specific files]"
allowed-tools: Bash, Read, Glob, Grep
---

You are going to produce a comprehensive technical walkthrough of the current codebase using `showboat`. The output is a single markdown document that gives the reader a thorough, honest understanding of how this project actually works — from the inside out.

## Who you are writing for

The reader is smart and curious. They are not technical *yet* but they want to be. They are not trying to stay non-technical — they are actively trying to build a real understanding of software systems, architecture, and code. They use AI coding agents to build things and they want to understand what those agents built.

**Do not dumb things down.** Treat the reader as an intelligent adult encountering these concepts for the first time. Use the real vocabulary. Explain what terms mean when you introduce them, but don't replace them with soft approximations. If something is a "recursive function" or an "HTTP middleware" or a "goroutine", say so and explain it properly — don't call it a "thing that calls itself" or "a traffic cop". The goal is that after reading this document, the reader has actually learned something real and durable, not just got a vague feel for things.

## Tone and voice

- Curious and direct. Like a knowledgeable senior engineer explaining a codebase to a sharp new colleague who is switching from a non-technical background.
- Never condescending. Never oversimplified.
- Include the "why" behind every significant decision, not just the "what".
- When something is genuinely complex or subtle, say so and explain the nuance — don't paper over it.
- When there's an interesting design tradeoff or a non-obvious choice made by the author, surface it and explain the reasoning.

## Structure to follow

Build the document in this order using showboat:

### 1. Project overview
What does this project actually do? What problem does it solve? Who would use it and how? What is the top-level shape of the codebase (language, key dependencies, architecture pattern)?

### 2. The technology stack
For every major language, framework, or library in use: explain what it is, why it exists, and what role it plays here. Don't assume the reader knows what Go, Python, React, Postgres, etc. are — introduce each one properly the first time.

### 3. The entry point
Where does execution begin? Walk through the entry point file in detail. Show the actual code. Explain what each section does, what gets initialized, what gets registered, and what kicks off the main logic. Use `showboat exec` with `cat` or `sed` to show real snippets — never paraphrase code you can show directly.

### 4. File and folder structure
Show the directory tree. For each file and folder, explain in one or two sentences what it owns and why it exists as a separate unit. Explain the organizational logic — why is the code split this way?

### 5. Core modules / packages — one section per module
For each significant module, package, or file:
- What is its single responsibility?
- Show the key functions, types, or classes with actual code snippets
- Explain what each function takes in, what it does internally, and what it returns
- Explain any non-obvious language features being used (closures, interfaces, decorators, generics, concurrency primitives — explain them properly)
- Explain how this module connects to the rest of the system

### 6. Data flow
Pick the most important operation the system performs (e.g., handling a request, processing a file, running a command). Trace it end to end through the codebase: what triggers it, what functions call what, what data transforms along the way, and what the output is. Show code at each step.

### 7. Key design patterns and architectural decisions
Identify the significant design patterns in use (e.g., CLI flag parsing, middleware chains, interface-based polymorphism, event-driven architecture, worker pools). For each one: explain what the pattern is, why it's useful, and show where in this codebase it appears with a real snippet.

### 8. Error handling and edge cases
How does this codebase handle failure? Show the actual error handling patterns. Are errors propagated or swallowed? Are there fallbacks? What happens when things go wrong?

### 9. Tests
If tests exist, walk through the testing approach. What is being tested? What testing patterns are used? Show a representative test and explain what it's asserting and why that matters.

### 10. How it all connects — the mental model
Close with a plain-English narrative that ties everything together. **Open with a paragraph that summarizes what this project does and why it exists** — not architecture layers or implementation details. Think: "ProjectName is a [thing] that [does what] by [how]." If you had to describe the whole system in one coherent paragraph, what would you say? What is the core loop or core abstraction that everything else serves? What would you want to remember about this codebase six months from now?

## How to use showboat

First check if showboat is available:
```
showboat --help
```
or
```
uvx showboat --help
```

Use whichever works. If neither works, install it:
```
uv tool install showboat
```

Then:

1. Initialize the document:
```
showboat init WALKTHROUGH.md "Codebase Walkthrough: <project name>"
```

2. For every section heading and explanation, use:
```
showboat note WALKTHROUGH.md "your explanation text here"
```
Or pipe multi-line text:
```
cat <<'EOF' | showboat note WALKTHROUGH.md
Your explanation...
EOF
```

3. For every code snippet, use `showboat exec` with real commands — never copy-paste code manually:
```
showboat exec WALKTHROUGH.md bash "cat path/to/file.go"
showboat exec WALKTHROUGH.md bash "sed -n '10,40p' path/to/file.go"
showboat exec WALKTHROUGH.md bash "grep -n 'func ' path/to/main.go"
showboat exec WALKTHROUGH.md bash "find . -type f -name '*.go' | head -30"
```

4. If a command produces output that shouldn't be in the document (an error, a wrong file), immediately remove it:
```
showboat pop WALKTHROUGH.md
```

5. Save the file to the current working directory as `WALKTHROUGH.md`.

## Important rules

- **Every code snippet must be produced by a real `showboat exec` command.** Never write code into a `showboat note`. Notes are for prose only. Code and command output always go through `showboat exec`.
- Keep individual `showboat note` blocks focused. One idea per note block.
- When showing a large file, use `sed -n 'START,ENDp'` to show only the relevant section rather than dumping the entire file.
- Do not skip modules because they seem minor. If it exists in the codebase, it has a reason to exist — explain it.
- Length is not a problem. A thorough walkthrough is better than a brief one. The reader wants depth.
- If the project has an optional focus area passed as an argument (`$ARGUMENTS`), prioritize that area but still cover the full codebase.

Begin by exploring the codebase (read the directory structure, key files, README) before writing a single showboat command. Plan the sections. Then execute.
