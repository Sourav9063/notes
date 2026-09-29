# Notes audit, deduplication, and upstream sync

Status: done

## Objective

Audit every note, fix technically wrong content, merge duplicate notes into the best version, and sync notes copied from other GitHub repositories with their upstream.

## Decisions

- Merge duplicates into the most complete, most correct file; integrate missing sections from the others; delete the rest.
- Copied repositories are mirrored from upstream `HEAD` (tracked files only, no `.git`). The source-link line added at the top of the local README is kept.
- Update the root `README.md` index and regenerate `index.html` after file moves.
- Keep generated/binary assets (PDFs, images, zip) unless they are exact duplicates.
- `javascript/33-js-concepts` stays a snapshot of the reading-list README: upstream became a docs site (`docs/*.mdx`, tests, tooling) at `16d0d95`; README notes the move.
- `vim/vscode-vim-roadmap.md` is kept as an archive: upstream deleted `ROADMAP.md` in `17e5fd71` (2025-05-22).
- Interview banks, Tailwind READMEs, and `SQL/PostgreSQL.md` vs `SQL/GOD_PostgreSQL.md` are complementary, not duplicates.
- Code files (`.js`, `.ts`, `.go`, etc.) are not edited; fixes go in the Markdown notes.
- Agent guidance, skills, Claude settings, and AI workflow notes live in https://github.com/Sourav9063/ADD. `ai/` keeps only a README linking there; `.agent/` removed. Root `AGENTS.md` stays: it governs this repo.

## Upstream sources

| Local path | Upstream |
| --- | --- |
| `javascript/javascript-algorithms` | https://github.com/trekhleb/javascript-algorithms |
| `javascript/33-js-concepts` | https://github.com/leonardomso/33-js-concepts (snapshot) |
| `go/golang-for-nodejs-developers` | https://github.com/miguelmota/golang-for-nodejs-developers |
| `javascript/clean-code/README.md` | https://github.com/ryanmcdermott/clean-code-javascript |
| `React/AGENTS.md` | https://github.com/vercel-labs/agent-skills (`skills/react-best-practices/AGENTS.md`) |

## Verification

- No byte-identical Markdown duplicates remain.
- All relative Markdown links resolve.
- `python3 scripts/generate_index.py` succeeds and entry count equals tracked Markdown count.

## Result

- Synced: `javascript-algorithms` (`85293e3`), `golang-for-nodejs-developers` dotfiles; `clean-code` and `React/AGENTS.md` already matched.
- Merged/removed duplicates: React data fetching, design pattern versions, Postgres notes, TypeScript cheatsheets, Object README, PrimeVue themes.
- Root `README.md` rewritten to link every own note; checks above pass.
