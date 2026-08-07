# Markdown index site

Status: approved and in progress

## Objective

Provide a browsable, searchable website for every tracked Markdown file, with GitHub Actions keeping the generated entry point synchronized after Markdown changes.

## Decisions

- Use a single root `index.html` as the static site entry point.
- Generate the document catalog from `git ls-files '*.md'`, so ignored files and generated artifacts are not included.
- Keep document content in the existing Markdown files. The browser fetches the selected file and renders it client-side.
- Use pinned CDN versions of the Markdown renderer and sanitizer; disable unsafe raw HTML and sanitize rendered output.
- Encode every path segment when fetching documents, preserving spaces and special characters in filenames.
- Trigger synchronization on pushes to `main` that change Markdown files or the generator. Commit only when generated output changes.
- Do not add GitHub Pages deployment configuration; hosting remains a one-time repository setting outside this change.

## Implementation

1. Add `scripts/generate_index.py` to scan Markdown files, extract display titles, and render a deterministic catalog into `index.html`.
2. Add the browser UI with directory navigation, search, document selection, loading/error states, and back/forward URL state.
3. Add `.github/workflows/sync-index.yml` to regenerate and commit `index.html` on `main`.
4. Document local generation and GitHub Pages usage in the root README.

## Verification

- Run the generator and confirm it succeeds from a clean checkout.
- Confirm generated entry count equals tracked Markdown count.
- Confirm paths containing spaces, brackets, parentheses, and other special characters are represented safely.
- Run Python syntax validation.
- Inspect generated HTML for expected scripts, catalog entries, and no unescaped file metadata.
- Validate workflow YAML structure and repository status.
