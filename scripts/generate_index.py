#!/usr/bin/env python3
"""Generate the single-page Markdown reader used by the repository site."""

from __future__ import annotations

import argparse
import html
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import quote


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "index.html"
HEADING_RE = re.compile(r"^ {0,3}#(?!#)\s+(.+?)\s*#*\s*$")


def tracked_markdown_files() -> list[Path]:
    """Return tracked Markdown paths in stable, repository-relative order."""

    result = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=ROOT,
        check=True,
        capture_output=True,
    )
    paths = [Path(raw.decode("utf-8")) for raw in result.stdout.split(b"\0") if raw]
    return sorted(
        (path for path in paths if path.suffix.lower() == ".md"),
        key=lambda path: path.as_posix().casefold(),
    )


def title_for(path: Path) -> str:
    """Use the first ATX heading as a title, with a readable filename fallback."""

    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        text = ""

    in_fence = False
    for line in text.splitlines():
        stripped = line.lstrip()
        if stripped.startswith("```") or stripped.startswith("~~~"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        match = HEADING_RE.match(line)
        if match:
            title = match.group(1).strip()
            title = re.sub(r"!\[([^]]*)\]\([^)]*\)", r"\1", title)
            title = re.sub(r"\[([^]]+)\]\([^)]*\)", r"\1", title)
            return title or path.stem

    return re.sub(r"[-_]", " ", path.stem).strip() or path.name


def build_catalog(paths: list[Path]) -> list[dict[str, str]]:
    catalog = []
    for path in paths:
        relative = path.as_posix()
        catalog.append({"path": relative, "title": title_for(ROOT / path)})
    return catalog


def build_tree(catalog: list[dict[str, str]]) -> dict:
    root: dict = {"files": [], "directories": {}}
    for entry in catalog:
        parts = entry["path"].split("/")
        node = root
        for directory in parts[:-1]:
            node = node["directories"].setdefault(
                directory, {"files": [], "directories": {}}
            )
        node["files"].append(entry)
    return root


def tree_file_count(node: dict) -> int:
    return len(node["files"]) + sum(
        tree_file_count(child) for child in node["directories"].values()
    )


def render_tree(node: dict) -> str:
    output: list[str] = []

    for entry in sorted(
        node["files"], key=lambda item: (item["title"].casefold(), item["path"].casefold())
    ):
        path = entry["path"]
        safe_path = html.escape(path, quote=True)
        safe_title = html.escape(entry["title"])
        href = quote(path, safe="")
        output.append(
            "<a class=\"doc-link\" data-doc-path=\"{path}\" "
            "href=\"?file={href}\">"
            "<span>{title}</span><small>{path}</small></a>".format(
                path=safe_path,
                href=href,
                title=safe_title,
            )
        )

    for directory in sorted(node["directories"], key=str.casefold):
        child = node["directories"][directory]
        safe_directory = html.escape(directory)
        count = tree_file_count(child)
        output.append(
            "<details class=\"directory\" data-directory>"
            "<summary><span>{directory}</span><small>{count}</small></summary>"
            "<div class=\"tree-children\">{children}</div></details>".format(
                directory=safe_directory,
                count=count,
                children=render_tree(child),
            )
        )

    return "\n".join(output)


def directory_count(catalog: list[dict[str, str]]) -> int:
    directories = set()
    for entry in catalog:
        parts = entry["path"].split("/")
        directories.update("/".join(parts[:index]) for index in range(1, len(parts)))
    return len(directories)


def safe_json(value: object) -> str:
    """Keep catalog data inert when embedded in a script element."""

    return (
        json.dumps(value, ensure_ascii=False, separators=(",", ":"))
        .replace("&", r"\u0026")
        .replace("<", r"\u003c")
        .replace(">", r"\u003e")
        .replace("\u2028", r"\u2028")
        .replace("\u2029", r"\u2029")
    )


def render_html(catalog: list[dict[str, str]]) -> str:
    tree = render_tree(build_tree(catalog))
    template = r'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Searchable browser for the Markdown notes in this repository">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: https:;">
  <title>Developer Notes</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #f5f7fb;
      --panel: #ffffff;
      --panel-muted: #eef2f8;
      --text: #172033;
      --muted: #647089;
      --border: #dbe1ec;
      --accent: #335eea;
      --accent-soft: #e6ebff;
      --code: #202938;
      --shadow: 0 18px 45px rgb(32 48 85 / 10%);
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #101522;
        --panel: #171e2d;
        --panel-muted: #202a3b;
        --text: #eef2ff;
        --muted: #a7b2c8;
        --border: #303c50;
        --accent: #92aaff;
        --accent-soft: #26365f;
        --code: #0c111a;
        --shadow: 0 18px 45px rgb(0 0 0 / 25%);
      }
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font: 15px/1.55 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    a { color: var(--accent); }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 5;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      min-height: 64px;
      padding: .8rem 1.25rem;
      border-bottom: 1px solid var(--border);
      background: color-mix(in srgb, var(--panel) 92%, transparent);
      backdrop-filter: blur(12px);
    }
    .brand { color: var(--text); font-weight: 750; text-decoration: none; letter-spacing: -.02em; }
    .repo-link { color: var(--muted); font-size: .85rem; }
    .layout { display: grid; grid-template-columns: minmax(240px, 320px) minmax(0, 1fr); min-height: calc(100vh - 65px); }
    .sidebar {
      position: sticky;
      top: 65px;
      align-self: start;
      height: calc(100vh - 65px);
      overflow: auto;
      padding: 1.2rem .85rem 2rem 1rem;
      border-right: 1px solid var(--border);
      background: var(--panel);
    }
    .sidebar-header { padding: 0 .35rem .8rem; }
    .sidebar-header h1 { margin: 0 0 .2rem; font-size: 1.05rem; }
    .sidebar-header p { margin: 0; color: var(--muted); font-size: .82rem; }
    .search {
      width: 100%;
      margin: .8rem 0 .55rem;
      padding: .65rem .75rem;
      border: 1px solid var(--border);
      border-radius: .65rem;
      background: var(--panel-muted);
      color: var(--text);
      font: inherit;
    }
    .search:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
    .tree { display: grid; gap: .15rem; }
    .directory { border-radius: .5rem; }
    .directory[hidden] { display: none; }
    .directory[open] { background: color-mix(in srgb, var(--panel-muted) 45%, transparent); }
    .directory summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: .75rem;
      padding: .42rem .55rem;
      cursor: pointer;
      color: var(--text);
      font-weight: 650;
      list-style-position: outside;
    }
    .directory summary small, .doc-link small { color: var(--muted); font-size: .72rem; font-weight: 400; }
    .tree-children { display: grid; gap: .1rem; padding: 0 0 .3rem .65rem; }
    .doc-link {
      display: grid;
      gap: .05rem;
      padding: .45rem .55rem;
      border-left: 2px solid transparent;
      border-radius: .35rem;
      color: var(--text);
      text-decoration: none;
    }
    .doc-link:hover { background: var(--panel-muted); }
    .doc-link[hidden] { display: none; }
    .doc-link[aria-current="page"] { border-left-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
    .reader { min-width: 0; padding: clamp(1.25rem, 4vw, 4rem); }
    .reader-inner { width: min(900px, 100%); margin: 0 auto; }
    .welcome, .document { padding: clamp(1.25rem, 4vw, 3rem); border: 1px solid var(--border); border-radius: 1rem; background: var(--panel); box-shadow: var(--shadow); }
    .welcome h1 { margin-top: 0; font-size: clamp(1.8rem, 4vw, 2.8rem); letter-spacing: -.04em; }
    .welcome p { color: var(--muted); }
    .stats { display: flex; flex-wrap: wrap; gap: .65rem; margin-top: 1.4rem; }
    .stat { padding: .55rem .75rem; border: 1px solid var(--border); border-radius: .6rem; background: var(--panel-muted); }
    .stat strong { display: block; font-size: 1.1rem; }
    .stat span { color: var(--muted); font-size: .78rem; }
    .document[hidden], .welcome[hidden] { display: none; }
    .document-header { margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border); }
    .document-header h1 { margin: 0 0 .35rem; line-height: 1.2; letter-spacing: -.035em; }
    .document-path { color: var(--muted); font: .78rem/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; overflow-wrap: anywhere; }
    .markdown-body { overflow-wrap: anywhere; }
    .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 { line-height: 1.25; margin: 1.7em 0 .55em; }
    .markdown-body h1 { font-size: 2em; margin-top: 0; }
    .markdown-body h2 { font-size: 1.5em; padding-bottom: .25em; border-bottom: 1px solid var(--border); }
    .markdown-body h3 { font-size: 1.2em; }
    .markdown-body img { max-width: 100%; height: auto; border-radius: .45rem; }
    .markdown-body pre { overflow: auto; padding: 1rem; border-radius: .6rem; background: var(--code); color: #e7edf8; }
    .markdown-body code { padding: .12em .3em; border-radius: .25rem; background: var(--panel-muted); font-size: .9em; }
    .markdown-body pre code { padding: 0; background: transparent; }
    .markdown-body blockquote { margin-left: 0; padding: .2rem 1rem; border-left: 4px solid var(--accent); color: var(--muted); background: var(--panel-muted); }
    .markdown-body table { display: block; max-width: 100%; overflow: auto; border-collapse: collapse; }
    .markdown-body th, .markdown-body td { padding: .45rem .65rem; border: 1px solid var(--border); text-align: left; }
    .markdown-body th { background: var(--panel-muted); }
    .status { min-height: 1.5rem; margin: .75rem 0; color: var(--muted); font-size: .85rem; }
    .status.error { color: #d04a4a; }
    .skip-link { position: absolute; left: -9999px; }
    .skip-link:focus { left: 1rem; top: 1rem; z-index: 10; padding: .5rem; background: var(--panel); }
    @media (max-width: 760px) {
      .topbar { position: static; }
      .layout { display: block; }
      .sidebar { position: static; height: auto; max-height: 52vh; border-right: 0; border-bottom: 1px solid var(--border); }
      .reader { padding: 1rem; }
    }
  </style>
</head>
<body>
  <a class="skip-link" href="#reader">Skip to document</a>
  <header class="topbar">
    <a class="brand" href="./">Developer Notes</a>
    <a class="repo-link" href="https://github.com/Sourav9063/notes">View repository</a>
  </header>
  <div class="layout">
    <aside class="sidebar" aria-label="Markdown documents">
      <div class="sidebar-header">
        <h1>All notes</h1>
        <p>Search by title or path.</p>
        <label>
          <span class="sr-only">Search notes</span>
          <input class="search" id="search" type="search" placeholder="Filter documents…" autocomplete="off">
        </label>
      </div>
      <nav class="tree" id="tree" aria-label="Markdown documents">__TREE__</nav>
    </aside>
    <main class="reader" id="reader">
      <div class="reader-inner">
        <section class="welcome" id="welcome">
          <h1>A living index of the notes</h1>
          <p>Select a document from the sidebar. The Markdown stays in the repository and is rendered here when opened.</p>
          <div class="stats">
            <div class="stat"><strong>__DOC_COUNT__</strong><span>Markdown files</span></div>
            <div class="stat"><strong>__DIR_COUNT__</strong><span>directories</span></div>
          </div>
        </section>
        <article class="document" id="document" hidden>
          <header class="document-header">
            <h1 id="document-title"></h1>
            <div class="document-path" id="document-path"></div>
          </header>
          <div class="markdown-body" id="content"></div>
        </article>
        <p class="status" id="status" role="status" aria-live="polite"></p>
      </div>
    </main>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js"></script>
  <script>
    const documents = __CATALOG__;
    const documentByPath = new Map(documents.map((item) => [item.path, item]));
    const tree = document.querySelector('#tree');
    const search = document.querySelector('#search');
    const welcome = document.querySelector('#welcome');
    const documentView = document.querySelector('#document');
    const documentTitle = document.querySelector('#document-title');
    const documentPath = document.querySelector('#document-path');
    const content = document.querySelector('#content');
    const status = document.querySelector('#status');
    let loadId = 0;

    function encodePath(path) {
      return path.split('/').map((part) => encodeURIComponent(part)).join('/');
    }

    function documentHref(path, hash = '') {
      return `?file=${encodeURIComponent(path)}${hash}`;
    }

    function setStatus(message, isError = false) {
      status.textContent = message;
      status.classList.toggle('error', isError);
    }

    function setActive(path) {
      tree.querySelectorAll('.doc-link').forEach((link) => {
        const active = link.dataset.docPath === path;
        link.toggleAttribute('aria-current', active);
        if (active) link.setAttribute('aria-current', 'page');
      });
    }

    function resolveRelativeUrl(value, sourcePath) {
      if (!value || value.startsWith('#') || value.startsWith('?') || value.startsWith('//')) return null;
      if (/^[a-z][a-z\d+.-]*:/i.test(value)) return null;
      try {
        const sourceUrl = new URL(encodePath(sourcePath), 'https://notes.invalid/');
        const targetUrl = new URL(value, sourceUrl);
        if (targetUrl.origin !== sourceUrl.origin) return null;
        return {
          path: decodeURIComponent(targetUrl.pathname.slice(1)),
          hash: targetUrl.hash,
        };
      } catch (error) {
        return null;
      }
    }

    function rewriteRelativeUrls(container, sourcePath) {
      container.querySelectorAll('a[href], img[src]').forEach((element) => {
        const attribute = element.tagName === 'IMG' ? 'src' : 'href';
        const value = element.getAttribute(attribute);
        const resolved = resolveRelativeUrl(value, sourcePath);
        if (!resolved) return;
        if (element.tagName === 'A' && documentByPath.has(resolved.path)) {
          element.setAttribute('href', documentHref(resolved.path, resolved.hash));
          return;
        }
        element.setAttribute(attribute, `${encodePath(resolved.path)}${resolved.hash || ''}`);
      });
    }

    async function selectDocument(path, pushState = true) {
      const item = documentByPath.get(path);
      if (!item) {
        welcome.hidden = false;
        documentView.hidden = true;
        setStatus(`Document not found: ${path || '(empty path)'}`, true);
        return;
      }

      const currentLoadId = ++loadId;
      welcome.hidden = true;
      documentView.hidden = false;
      documentTitle.textContent = item.title;
      documentPath.textContent = item.path;
      content.textContent = 'Loading…';
      setActive(item.path);
      setStatus('');
      document.title = `${item.title} · Developer Notes`;
      if (pushState) history.pushState({ path: item.path }, '', documentHref(item.path));

      try {
        const response = await fetch(encodePath(item.path), { headers: { Accept: 'text/markdown, text/plain' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const markdown = await response.text();
        if (currentLoadId !== loadId) return;
        if (!window.marked || !window.DOMPurify) throw new Error('Markdown renderer unavailable');
        const rendered = window.marked.parse(markdown, { gfm: true, breaks: false });
        content.innerHTML = window.DOMPurify.sanitize(rendered);
        rewriteRelativeUrls(content, item.path);
        setStatus(item.path);
      } catch (error) {
        if (currentLoadId !== loadId) return;
        content.textContent = 'Unable to load this document.';
        setStatus(`${item.path}: ${error.message}`, true);
      }
    }

    function filterTree() {
      const query = search.value.trim().toLocaleLowerCase();
      tree.querySelectorAll('.doc-link').forEach((link) => {
        const item = documentByPath.get(link.dataset.docPath);
        const visible = !query || `${item.title} ${item.path}`.toLocaleLowerCase().includes(query);
        link.hidden = !visible;
      });
      tree.querySelectorAll('[data-directory]').forEach((directory) => {
        const hasVisibleDocument = [...directory.querySelectorAll('.doc-link')].some((link) => !link.hidden);
        directory.hidden = !hasVisibleDocument;
        if (query && hasVisibleDocument) directory.open = true;
      });
    }

    tree.addEventListener('click', (event) => {
      const link = event.target.closest('.doc-link');
      if (!link) return;
      event.preventDefault();
      selectDocument(link.dataset.docPath);
    });
    search.addEventListener('input', filterTree);
    window.addEventListener('popstate', () => {
      const path = new URLSearchParams(window.location.search).get('file');
      if (path) selectDocument(path, false);
      else {
        welcome.hidden = false;
        documentView.hidden = true;
        document.title = 'Developer Notes';
        setActive('');
        setStatus('');
      }
    });

    const initialPath = new URLSearchParams(window.location.search).get('file');
    if (initialPath) selectDocument(initialPath, false);
  </script>
</body>
</html>
'''
    return (
        template.replace("__TREE__", tree)
        .replace("__DOC_COUNT__", str(len(catalog)))
        .replace("__DIR_COUNT__", str(directory_count(catalog)))
        .replace("__CATALOG__", safe_json(catalog))
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="fail when index.html is not up to date instead of writing it",
    )
    args = parser.parse_args()

    catalog = build_catalog(tracked_markdown_files())
    generated = render_html(catalog)

    if args.check:
        try:
            current = OUTPUT.read_text(encoding="utf-8")
        except FileNotFoundError:
            print(f"{OUTPUT}: missing", file=sys.stderr)
            return 1
        if current != generated:
            print(f"{OUTPUT}: out of date", file=sys.stderr)
            return 1
        print(f"{OUTPUT}: up to date ({len(catalog)} Markdown files)")
        return 0

    OUTPUT.write_text(generated, encoding="utf-8")
    print(f"Generated {OUTPUT} with {len(catalog)} Markdown files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
