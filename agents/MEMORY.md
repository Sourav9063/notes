# Memory

- Commits: small, one-line conventional messages (e.g. `docs: merge postgres notes`); no co-author trailers.
- Code files (`.js`, `.ts`, `.go`, ...) kept as notes: edit only when the user asks; otherwise fix or document in Markdown.
- Copied upstream repos are mirrored from upstream (tracked files only) and keep the source-link line at the top of their README.
- Never edit mirrors to improve them; put improved rewrites in a sibling folder (e.g. `go/golang-for-nodejs-modern`) that credits upstream.
- Agent guidance and skills live in https://github.com/Sourav9063/ADD, not here.
- After adding, moving, or deleting Markdown, update root `README.md` and run `python3 scripts/generate_index.py` (it reads `git ls-files`; `git add -N` new files first).
- Merging duplicate notes: compare depth per section (examples, details, use cases), not just topic coverage; keep the richest version of each section and never drop unique examples.
