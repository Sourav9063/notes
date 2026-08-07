# Markdown index site

Status: complete

## Objective

Provide a browsable, searchable website for every tracked Markdown file, with a manually runnable GitHub Actions workflow for refreshing the generated entry point.

## Decisions

- Use a single root `index.html` as the static site entry point.
- Generate the document catalog from tracked files whose extension is `.md` case-insensitively, so ignored files and generated artifacts are not included.
- Keep document content in the existing Markdown files. The browser fetches the selected file and renders it client-side.
- Use pinned CDN versions of the Markdown renderer and sanitizer; disable unsafe raw HTML and sanitize rendered output.
- Encode every path segment when fetching documents, preserving spaces and special characters in filenames.
- Trigger synchronization only through `workflow_dispatch`. Commit only when generated output changes.
- Do not add GitHub Pages deployment configuration; hosting remains a one-time repository setting outside this change.
- Use a dark, documentation-focused visual system inspired by Nuxt's docs layout: dual navigation bars, compact left navigation, strong active states, and an optional right-side table of contents.

## Implementation

1. Add `scripts/generate_index.py` to scan Markdown files, extract display titles, and render a deterministic catalog into `index.html`.
2. Add the browser UI with directory navigation, search, document selection, loading/error states, and back/forward URL state.
3. Add `.github/workflows/sync-index.yml` to regenerate and commit `index.html` when manually run.
4. Document local generation and GitHub Pages usage in the root README.
5. Add explicit outline scrolling and hash restoration for dynamically rendered headings.

## Verification

- Run the generator and confirm it succeeds from a clean checkout.
- Confirm generated entry count equals tracked Markdown count.
- Confirm paths containing spaces, brackets, parentheses, and other special characters are represented safely.
- Run Python syntax validation.
- Inspect generated HTML for expected scripts, catalog entries, and no unescaped file metadata.
- Validate workflow YAML structure and repository status.
- Confirm outline links update the URL and explicitly scroll to the target heading despite the sticky navigation.
