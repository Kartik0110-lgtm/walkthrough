# Nutshell Callouts — Reference Examples

These are the editorial callouts from the Nutshell walkthrough reader.
They serve as few-shot examples of the quality bar for callout writing.

## Ch2 — Technology Stack
Type: pattern, icon: 🧩
> **Pattern: CommonJS vs ESM.** You'll notice a deliberate split in this project: the server-side files use **CommonJS** (`require()`), while the browser-side `nutshell.js` uses **ESM** (`import`). This isn't an accident — it reflects the historical divide between Node.js (which standardised on CommonJS in 2009) and browsers (which got native ES Modules in 2017). The project chooses the idiomatic format for each environment rather than forcing uniformity, which avoids the need for a bundler entirely.

*Why this is good:* Names a pattern the reader would notice but not necessarily understand. Explains the historical why. Makes the choice legible as a deliberate decision, not an inconsistency.

## Ch4 — File and Folder Structure
Type: pattern, icon: 🧩
> **Key insight:** `glossary.json` is the hub that connects all three stages. It's written by `extract-terms.js`, curated through the admin UI, and consumed by `build.js`. It's not just a data file — it's the handoff point between every phase of the system.

*Why this is good:* Short. Names a structural role the chapter describes functionally but doesn't explicitly call out. The phrase "handoff point" gives the reader a mental model word they can use.

## Ch5 — Core Modules
Type: pattern, icon: 🧩
> **Pattern: Defensive Parsing.** Every function that touches LLM output assumes the model will misbehave. `parseTermsFromResponse()` strips markdown fences before parsing, validates the result is an array, and throws a typed error if not. `mergeIntoGlossary()` uses a `Set` for O(1) duplicate detection. These aren't edge-case guards — they're the primary code path, because LLMs fail often enough that failure must be treated as a first-class case.

*Why this is good:* Names a pattern. Gives it a name ("Defensive Parsing") that the reader can apply elsewhere. Explains why it's not over-engineering.

## Ch6 — End-to-End Data Flow
Type: insight, icon: ⚡
> **Zero network requests were made in Phase 4.** When the reader clicked the pill, the browser never made a single HTTP request. The definition was already inside the HTML, baked in at build time as a `data-nutshell` attribute. This is the payoff of the entire architecture. It means the page works offline, works on a static file host with no server, and has zero latency on click. The animation is the only "computation" that happens at read time.

*Why this is good:* This is the architectural payoff moment. The callout makes explicit what the reader just witnessed tracing through the data flow. The word "payoff" connects it to the whole system.

## Ch7 — Design Patterns
Type: pattern, icon: 🧩
> **Which patterns are most broadly reusable?** Of the six patterns here, three are particularly transferable to other projects: **Static pre-baking** (embed data at build time, not runtime) applies to any content-heavy site. The **strategy pattern for external APIs** (one dispatcher, swappable implementations) is the right shape for any multi-provider integration. And the **feedback log as few-shot data** pattern is a lightweight alternative to fine-tuning — free, automatic, and surprisingly effective for small domains.

*Why this is good:* The chapter lists six patterns; the callout does the editorial work of ranking them by transferability. Saves the reader from having to do that judgment themselves.

## Ch8 — Error Handling
Type: insight, icon: 💡
> **Performance note:** The fresh-disk-read pattern (`fs.readFileSync` on every request) would be a serious problem at scale — but at this scale (a JSON file under 2KB, one user at a time), it's the right choice. It eliminates an entire class of stale-cache bugs for zero meaningful cost. The rule: don't optimise away simplicity until you have a measured reason to.

*Why this is good:* Pre-empts the reader's likely objection ("isn't this slow?") and explains why the apparent mistake is actually correct in context.

## Ch9 — Tests
Type: insight, icon: 💡
> **The most important test is manual.** Step 7 of the verification checklist — "Open DevTools Network tab → click a pill → zero new network requests" — is the core behavioral guarantee of this architecture. No automated test can replace the act of a human watching the Network panel stay empty. Some guarantees need eyes.

*Why this is good:* Takes a strong position. Identifies the single most important verification step and explains why it can't be automated.

## Ch10 — Mental Model
Type: insight, icon: 🎯
> **The abstraction to remember:** Definitions live in the HTML, not on a server. Everything else — the LLM pipeline, the admin UI, the build script, the merge logic, the attribute encoding — is infrastructure for getting accurate, approved definitions into that HTML at compile time. Once you understand this, the entire architecture becomes legible: every design decision is in service of this one constraint.

*Why this is good:* Gives the reader a single sentence that makes the whole system legible. "Definitions live in the HTML, not on a server" is a one-sentence mental model that survives 6 months.
