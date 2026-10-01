# Modern Go for Node.js developers guide

Status: complete

## Objective

`go/golang-for-nodejs-developers` stays an untouched mirror of https://github.com/miguelmota/golang-for-nodejs-developers (upstream inactive since 2022-11). A sibling `go/golang-for-nodejs-modern/README.md` is an improved, current side-by-side guide.

## Acceptance criteria

- Mirror matches upstream `HEAD` (tracked files only; local PDF kept).
- Modern guide covers every upstream topic, rewritten to current idioms, plus topics upstream lacks (generics, iterators, context/cancellation, structured logging, testing, fuzzing, HTTP client, graceful shutdown, gotchas).
- Targets Go 1.27 and Node.js 24 LTS; uses only standard libraries except where none exists, and says so.
- Every runnable example is verified: Node blocks run on Node 24, Go blocks run on Go 1.27, printed output matches the documented output (non-deterministic output is labeled).
- Credits upstream (MIT, Miguel Mota).
- Root `README.md` links it; `python3 scripts/generate_index.py` succeeds.

## Decisions

- Mirror and modern guide are separate folders (user decision); mirror is never edited.
- Single `README.md`, no example files: code lives inline as complete runnable programs, like upstream.
- Node examples are ES modules; Go examples are complete `package main` programs or labeled multi-file packages.
- Servers in examples bind port 0, call themselves, and shut down so they stay verifiable.
- Verification uses a throwaway extractor outside the repo that runs each block and diffs the documented output.

## Tasks

1. Done: mirror matches upstream `26bfd24` (2022-11-18); only the local PDF differs.
2. Done: guide written; all 169 example runs pass on Go 1.27.1 and Node 24.21.0 (gofmt, go vet, exact output diff).
3. Done: root README link, index regenerated, memory updated.

## Verification method

Extractor conventions the guide follows, so future edits stay checkable:

- `### topic` then `#### Node.js` / `#### Go`; each `js`/`go` block is a complete program unless its first line is `// file: path`, which adds a file to a per-topic project run by the following `bash` block.
- `Output` + `text` block is the exact expected output (stdout, then stderr); `Output (varies)` checks only the exit status.
- Go blocks must be gofmt-clean and pass `go vet`.

## Omitted

- Upstream `title` (`process.title`) section: no Go equivalent worth a section.
