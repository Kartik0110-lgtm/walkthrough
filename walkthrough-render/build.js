#!/usr/bin/env node
// Static build script for walkthrough-render.
// Reads template.html + WALKTHROUGH.md + walkthrough-config.json → walkthrough-reader.html
// All escaping, validation, and mechanical work lives here. Claude only generates the config.

const fs = require('fs');
const path = require('path');

// ── Helpers ──────────────────────────────────────────────────────────────────

// Safe placeholder injection — avoids $-substitution bugs in String.replace()
function safeReplace(str, search, replacement) {
  const idx = str.indexOf(search);
  if (idx === -1) return str;
  return str.slice(0, idx) + replacement + str.slice(idx + search.length);
}

// Auto-generate heading regex from chapter number
// '01' → /^## 1\./, '10' → /^## 10\./, '✦' → /^$NOMATCH$/
function headingRegexFor(num) {
  if (num === '\u2726') return '/^$NOMATCH$/';
  const n = parseInt(num, 10);
  return '/^## ' + n + '\\./';
}

// Emit a CHAPTER_DEFS entry as a JS object literal string
function chap(num, label, title, subtitle) {
  return `{ num:${JSON.stringify(num)}, label:${JSON.stringify(label)}, title:${JSON.stringify(title)}, subtitle:${JSON.stringify(subtitle)}, heading:${headingRegexFor(num)} }`;
}

// Emit a CHAPTER_EXTRAS callout block
function co(idx, type, icon, htmlContent) {
  return `  if (idx === ${idx}) {\n    post = callout(${JSON.stringify(type)}, ${JSON.stringify(icon)}, ${JSON.stringify(htmlContent)});\n  }`;
}

// Emit a quiz multiple-choice question
function qmc(qid, qtext, opts) {
  return 'mc(' + JSON.stringify(qid) + ', ' + JSON.stringify(qtext) + ', [' +
    opts.map(o => JSON.stringify(o)).join(', ') + '])';
}

// Emit a quiz reveal/design-thinking question
function qrv(id, qtext, think, answer) {
  return 'rv(' + JSON.stringify(id) + ', ' + JSON.stringify(qtext) + ', ' +
    JSON.stringify(think) + ', ' + JSON.stringify(answer) + ')';
}

// ── Read inputs ──────────────────────────────────────────────────────────────

const scriptDir = __dirname;
const templatePath = path.join(scriptDir, 'template.html');

if (!fs.existsSync(templatePath)) {
  console.error('✗ template.html not found at', templatePath);
  process.exit(1);
}
if (!fs.existsSync('WALKTHROUGH.md')) {
  console.error('✗ WALKTHROUGH.md not found in current directory');
  process.exit(1);
}
if (!fs.existsSync('walkthrough-config.json')) {
  console.error('✗ walkthrough-config.json not found in current directory');
  process.exit(1);
}

let html = fs.readFileSync(templatePath, 'utf8');
const walkthrough = fs.readFileSync('WALKTHROUGH.md', 'utf8');
const config = JSON.parse(fs.readFileSync('walkthrough-config.json', 'utf8'));

// ── Validate config ──────────────────────────────────────────────────────────

const required = ['projectName', 'authorName', 'chapters', 'chapterExtras', 'quiz'];
for (const field of required) {
  if (!config[field]) {
    console.error(`✗ Missing required config field: ${field}`);
    process.exit(1);
  }
}
if (!config.quiz.correct || !config.quiz.feedback || !config.quiz.mc || !config.quiz.rv) {
  console.error('✗ Quiz config must have: correct, feedback, mc, rv');
  process.exit(1);
}

// ── PROJECT_NAME ─────────────────────────────────────────────────────────────

html = html.split('%%PROJECT_NAME%%').join(config.projectName);

// ── AUTHOR_NAME ──────────────────────────────────────────────────────────────

html = safeReplace(html, '%%AUTHOR_NAME%%', config.authorName);

// ── RAW_MD ───────────────────────────────────────────────────────────────────
// Break <script> and </script> tokens so the HTML parser doesn't see them.
// We replace '<' with '\u003c' (unicode escape) — the browser's JS engine
// restores it to '<' at runtime, but the HTML parser sees literal '\u003c' bytes.
// Must use String.fromCharCode to avoid Node.js resolving the escape at parse time.

const bslash = String.fromCharCode(92);
const RAW_MD = JSON.stringify(walkthrough)
  .replace(/<\/script>/gi, bslash + 'u003c/script>')
  .replace(/<script/gi, bslash + 'u003cscript');

html = safeReplace(html, '%%RAW_MD%%', RAW_MD);

// ── CHAPTER_DEFS ─────────────────────────────────────────────────────────────

const CHAPTER_DEFS = '[\n' +
  config.chapters.map(c => chap(c.num, c.label, c.title, c.subtitle)).join(',\n') +
  '\n]';

html = safeReplace(html, '%%CHAPTER_DEFS%%', CHAPTER_DEFS);

// ── CHAPTER_EXTRAS ───────────────────────────────────────────────────────────

const CHAPTER_EXTRAS = config.chapterExtras
  .map(e => co(e.idx, e.type, e.icon, e.html))
  .join('\n');

html = safeReplace(html, '%%CHAPTER_EXTRAS%%', CHAPTER_EXTRAS);

// ── COMPACT_REPLACEMENTS ─────────────────────────────────────────────────────

const compactLines = [];

// General compact replacements (no $1 backreference — full block replacement)
if (config.compactReplacements) {
  for (const cr of config.compactReplacements) {
    const regexStr = cr.findPattern;
    compactLines.push(
      `  if (idx === ${cr.chapterIdx}) {\n` +
      `    rendered = rendered.replace(\n` +
      `      /${regexStr}/,\n` +
      `      ${JSON.stringify(cr.replacement)}\n` +
      `    );\n` +
      `  }`
    );
  }
}

// Closing chapter callout-box (wraps opening paragraph with $1 backreference)
// Build the regex internally from plain openingWords — Claude never writes regex for this.
if (config.closingChapterBox) {
  const cb = config.closingChapterBox;
  // Escape any regex-special characters in the plain-text opening words
  const escaped = cb.openingWords.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Build the pattern: capture <p>OPENING_WORDS...anything...</p>
  // This string is placed directly between / / delimiters in the output JS,
  // so it needs to be exactly what the browser's regex engine will see.
  const pattern = '(<p>' + escaped + '[\\s\\S]*?<\\/p>)';
  // The replacement includes $1 to preserve the matched paragraph inside the box
  const replacement =
    '<div class="callout-box"><span class="callout-box-icon">\u{1F4D6}</span>' +
    '<div class="callout-box-body"><strong>' + cb.projectName + ' in one paragraph:</strong>' +
    '<br><br>$1</div></div>';
  compactLines.push(
    `  if (idx === ${cb.chapterIdx}) {\n` +
    `    rendered = rendered.replace(\n` +
    `      /${pattern}/,\n` +
    `      ${JSON.stringify(replacement)}\n` +
    `    );\n` +
    `  }`
  );
}

const COMPACT_REPLACEMENTS = compactLines.length > 0 ? '\n' + compactLines.join('\n') + '\n' : '';

html = safeReplace(html, '%%COMPACT_REPLACEMENTS%%', COMPACT_REPLACEMENTS);

// ── QUIZ_CORRECT ─────────────────────────────────────────────────────────────

const correctEntries = Object.entries(config.quiz.correct)
  .map(([k, v]) => `${k}:'${v}'`).join(', ');
const QUIZ_CORRECT = '{ ' + correctEntries + ' }';

html = safeReplace(html, '%%QUIZ_CORRECT%%', QUIZ_CORRECT);

// ── QUIZ_FEEDBACK ────────────────────────────────────────────────────────────

const QUIZ_FEEDBACK = '{\n' +
  Object.entries(config.quiz.feedback)
    .map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`)
    .join(',\n') +
  '\n}';

html = safeReplace(html, '%%QUIZ_FEEDBACK%%', QUIZ_FEEDBACK);

// ── QUIZ_HTML ────────────────────────────────────────────────────────────────
// Critical: no leading newline — ASI would make `return (undefined)`

const quizParts = [];

// Tier 1
quizParts.push(JSON.stringify('<div class="quiz-tier-label">Tier 1</div>'));
quizParts.push(JSON.stringify('<div class="quiz-tier-title">Foundations</div>'));
quizParts.push(JSON.stringify('<div class="quiz-tier-desc">Core concepts. Do you know the basic facts of how the system works?</div>'));

for (let i = 0; i < 3 && i < config.quiz.mc.length; i++) {
  const q = config.quiz.mc[i];
  quizParts.push(qmc(q.id, q.question, q.options));
}

// Tier 2
quizParts.push(JSON.stringify('<div class="quiz-tier-label" style="margin-top:36px">Tier 2</div>'));
quizParts.push(JSON.stringify('<div class="quiz-tier-title">Mechanics</div>'));
quizParts.push(JSON.stringify('<div class="quiz-tier-desc">How specific parts actually work. Did you understand the implementation, not just the outcome?</div>'));

for (let i = 3; i < 6 && i < config.quiz.mc.length; i++) {
  const q = config.quiz.mc[i];
  quizParts.push(qmc(q.id, q.question, q.options));
}

// Score box
quizParts.push(JSON.stringify(
  '<div class="quiz-score" id="quiz-score-box">' +
  '<span class="quiz-score-num" id="quiz-score-num">0</span>' +
  '<span style="font-size:16px;color:var(--text3)"> / 6</span>' +
  '<div class="quiz-score-label">correct answers</div>' +
  '<div class="quiz-score-msg" id="quiz-score-msg"></div></div>'
));

// Tier 3
quizParts.push(JSON.stringify('<div class="quiz-tier-label" style="margin-top:44px">Tier 3</div>'));
quizParts.push(JSON.stringify('<div class="quiz-tier-title">Design Thinking</div>'));
quizParts.push(JSON.stringify('<div class="quiz-tier-desc">No score. Read the scenario, sit with it, form your own answer \u2014 then reveal. <em>That pause is the exercise.</em></div>'));

for (const q of config.quiz.rv) {
  quizParts.push(qrv(q.id, q.question, q.think, q.answer));
}

const QUIZ_HTML = quizParts.join(' +\n');

html = safeReplace(html, '%%QUIZ_HTML%%', QUIZ_HTML);

// ── Write and validate ───────────────────────────────────────────────────────

fs.writeFileSync('walkthrough-reader.html', html, 'utf8');
console.log('Written walkthrough-reader.html');

const output = fs.readFileSync('walkthrough-reader.html', 'utf8');

// Check 1: Script tag count
const scriptOpenCount = (output.match(/<script>/g) || []).length;
const scriptCloseCount = (output.match(/<\/script>/g) || []).length;
if (scriptOpenCount !== 2 || scriptCloseCount !== 2) {
  console.error(`✗ Expected 2 script blocks, found ${scriptOpenCount} open / ${scriptCloseCount} close tags.`);
  console.error('  Likely cause: unescaped <script> in quiz text — use &lt;script&gt; instead');
  process.exit(1);
}

// Check 2: JS syntax validation
const scriptStart = output.lastIndexOf('<script>') + '<script>'.length;
const scriptEnd = output.lastIndexOf('</script>');
let script = output.slice(scriptStart, scriptEnd);

const rawMdStart = script.indexOf('var RAW_MD =');
const valueStartIdx = script.indexOf('"', rawMdStart);
let si = valueStartIdx + 1;
while (si < script.length) {
  if (script[si] === '\\') { si += 2; continue; }
  if (script[si] === '"') break;
  si++;
}
const stmtEnd = script.indexOf(';', si) + 1;
const testScript = 'var RAW_MD = "test";' + script.substring(stmtEnd);

try {
  new Function(testScript);
  console.log('✓ Script syntax OK');
} catch (e) {
  console.error('✗ SYNTAX ERROR in generated script:', e.message);
  process.exit(1);
}

// Check 3: No remaining placeholders
const remaining = output.match(/%%[A-Z_]+%%/g);
if (remaining) {
  console.error('✗ Unreplaced placeholders found:', remaining);
  process.exit(1);
}

console.log('✓ All checks passed');

// Open in browser
const { execSync } = require('child_process');
const platform = process.platform;
try {
  if (platform === 'win32') execSync('start walkthrough-reader.html');
  else if (platform === 'darwin') execSync('open walkthrough-reader.html');
  else execSync('xdg-open walkthrough-reader.html');
} catch (e) {
  console.log('Could not auto-open browser. Open walkthrough-reader.html manually.');
}
