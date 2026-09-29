# Restore knowledge lost in audit merges

Status: done

## Objective

Every piece of knowledge in a file deleted during the notes audit (`notes-audit-dedup-sync.md`) must exist in a current file. Merges dropped content; restore it.

## Decisions

- `javascript/design-pattern/README.md` is rebuilt on `v3.md` (deepest per-pattern sections), with v2 details and real-world use cases, v5 OOP/functional concept bullets, minimal examples and Specification section, and unique v2, v4, v5, and `functional-oop.md` examples as collapsed variants.
- `v1.md` (100-entry catalog, mostly skeletal sketches) becomes `javascript/design-pattern/catalog.md` with a caveat, instead of bloating the README.
- Other merges (TypeScript, Postgres, React data fetching, Object, misc, PrimeVue) get unique lost content merged into their target files.
- Agent files moved to https://github.com/Sourav9063/ADD are checked against the local ADD clone; gaps are reported, not copied back here.
- `javascript/javascript-algorithms` is an upstream mirror; upstream deletions stay deleted.

## Progress

- Done: TypeScript cheatsheet, Postgres, design patterns, misc/article, loop, chatgpt, PrimeVue, postgress-next, `_config.yml`, React data fetching, Object (no change needed), agent/ai files vs ADD (gaps reported below).

## Verification

- `/tmp/cov/check.py`-style line coverage: every meaningful line of each deleted file is present in the corpus, or listed below as intentionally dropped with a reason (pure formatting, citation markers, broken/garbled text, or content duplicated in reworded form).
- Design pattern code blocks pass `node --check`; fixed snippets run with the documented output.
- Relative links resolve; `python3 scripts/generate_index.py` succeeds.

## Intentionally dropped

- Design patterns:
  - Headings, category intros ("Concerned with object creation mechanisms"), document intros, chat filler ("Certainly! ...", "Let me know if you have any questions"), and `[cite: N]` markers.
  - v5 short use cases are kept, relabeled "When to use".
  - `functional-oop.md` one-line italic taglines paraphrase the Concept bullets.
  - Comment-only and formatting-only differences; renamed duplicates (v5 `class Proxy extends Subject` is now `SubjectProxy`; the v5 reversed-string functional adapter matches the v4 Target/Adaptee variant).
  - "(As previously shown ...)" cross-references and the truncated first v4 Mediator (the complete second copy is kept).
  - Bugs fixed instead of copied: "Workspaceing" corrected to "Fetching"; undefined `createEventBus` now defined inline; Memento `undoState` restored the wrong snapshot; Visitor word counts (13/14); iterator output comment; `structuredClone` drops the class prototype; `createChatRoom` used `this` in an arrow function; truncated v4 `FlyweightFactory` completed.
- Postgres: wrong claims dropped: `ENDS_WITH` does not exist; `\b`/`\B` are not word boundaries in Postgres regex; `REGEXP_S_TO_ARRAY` was a typo; `^`/`$` are not `SIMILAR TO` anchors.
- TypeScript gemini, misc/article, loop, chatgpt, PrimeVue, postgress-next, `_config.yml`: remaining misses are reworded duplicates.
- Object (`READMEold.md`, old `README.md`): remaining misses are garbled or formatting lines; every topic is in `javascript/Object/README.md`.
- React data fetching: remaining misses are reworded duplicates. `useMemo`-created promises passed to `use()` were replaced by parent-owned or cached promises (a component that suspends before commit loses its memo). "Dates must be strings" was wrong; React serializes `Date`. Toploader notes moved intact to `React/NextJs/`.

## ADD gaps (reported, not copied back)

Deleted in `d2bede1`; recover with `git show d2bede1^:<path>`.

- `.agent/skills/create-action*`, `create-component`, `review-merge-request`: not in ADD. Project-specific (mapsense layering, `createAction`, two-ref MR review); ADD `reviewing-changes` covers generic review.
- `ai/AGENT_WORKFLOW.md`, `ai/AI.md`: ADD `docs/` copies are reworded around `AGENTS.md`; the old `CLAUDE.md`-centric tree and per-folder examples are absent. Old permission examples used invalid `Tool:pattern` syntax.
- `ai/README.md` installer and `ai/claude/statusline-command.sh`: superseded by newer ADD `README.md` installer and `.claude/statusline-command.sh`.
- `ai/claude/README.md`: source title/URL header and a few article lines absent from ADD `docs/claude/README.md`.
