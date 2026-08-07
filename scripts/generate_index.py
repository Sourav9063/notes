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


def render_sections(catalog: list[dict[str, str]]) -> str:
    top_levels = {entry["path"].split("/", 1)[0] for entry in catalog}
    directories = sorted(
        (name for name in top_levels if any("/" in entry["path"] and entry["path"].split("/", 1)[0] == name for entry in catalog)),
        key=str.casefold,
    )
    root_label = "Root"
    sections = [
        '<button class="section-link is-active" type="button" data-section="all">All notes</button>',
        '<button class="section-link" type="button" data-section="__root__">{}</button>'.format(root_label),
    ]
    sections.extend(
        '<button class="section-link" type="button" data-section="{name}">{label}</button>'.format(
            name=html.escape(name, quote=True),
            label=html.escape(name),
        )
        for name in directories
    )
    return "\n".join(sections)


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
    sections = render_sections(catalog)
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
      color-scheme: dark;
      --bg: #050914;
      --surface: #09101f;
      --surface-raised: #111b2d;
      --surface-hover: #17243a;
      --text: #f5f7ff;
      --muted: #8c9bb6;
      --muted-bright: #b7c3d8;
      --border: #1c2a42;
      --border-bright: #2b3c5a;
      --accent: #16d9a0;
      --accent-soft: #082d2a;
      --link: #9db4ff;
      --code: #070c16;
    }
    [data-theme="light"] {
      color-scheme: light;
      --bg: #f4f6fb;
      --surface: #ffffff;
      --surface-raised: #eef2f8;
      --surface-hover: #e4eaf5;
      --text: #111827;
      --muted: #68758b;
      --muted-bright: #44516a;
      --border: #d8dfeb;
      --border-bright: #bdc8db;
      --accent: #008a69;
      --accent-soft: #dff8f0;
      --link: #3153ba;
      --code: #182235;
    }
    * { box-sizing: border-box; }
    html { background: var(--bg); scroll-behavior: smooth; }
    body {
      min-width: 320px;
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font: 15px/1.6 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    button, input { font: inherit; }
    button { color: inherit; }
    a { color: var(--link); }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 2rem;
      min-height: 76px;
      padding: 0 2rem;
      border-bottom: 1px solid var(--border);
      background: color-mix(in srgb, var(--bg) 92%, transparent);
      backdrop-filter: blur(18px);
    }
    .brand { display: inline-flex; align-items: center; gap: .65rem; color: var(--text); font-size: 1.08rem; font-weight: 800; letter-spacing: -.035em; text-decoration: none; }
    .brand-mark { display: grid; width: 1.65rem; height: 1.65rem; place-items: center; border-radius: .45rem; background: var(--accent); color: #03120f; font-size: .9rem; font-weight: 950; box-shadow: 0 0 24px rgb(22 217 160 / 28%); }
    .brand-badge { padding: .18rem .42rem; border: 1px solid var(--border-bright); border-radius: .3rem; color: var(--accent); font-size: .65rem; font-weight: 800; letter-spacing: .08em; }
    .top-nav { display: flex; align-items: center; gap: 1.75rem; height: 100%; }
    .top-nav a { position: relative; display: grid; height: 100%; place-items: center; color: var(--muted-bright); font-weight: 650; text-decoration: none; }
    .top-nav a:hover, .top-nav a.is-active { color: var(--accent); }
    .top-nav a.is-active::after { position: absolute; right: 0; bottom: -1px; left: 0; height: 2px; background: var(--accent); content: ""; }
    .top-actions { display: flex; align-items: center; justify-content: flex-end; gap: .75rem; }
    .icon-button { display: grid; width: 2rem; height: 2rem; place-items: center; border: 0; border-radius: .5rem; background: transparent; color: var(--muted-bright); cursor: pointer; }
    .icon-button:hover { background: var(--surface-hover); color: var(--text); }
    .repo-link { display: inline-flex; align-items: center; gap: .45rem; color: var(--muted-bright); font-size: .86rem; text-decoration: none; }
    .repo-link:hover { color: var(--text); }
    .section-bar { overflow-x: auto; border-bottom: 1px solid var(--border); background: var(--surface); scrollbar-width: thin; }
    .section-nav { display: flex; min-width: max-content; align-items: center; gap: .35rem; padding: .7rem 2rem; }
    .section-link { padding: .42rem .8rem; border: 0; border-radius: .45rem; background: transparent; color: var(--muted); cursor: pointer; font-size: .88rem; font-weight: 650; white-space: nowrap; }
    .section-link:hover { background: var(--surface-hover); color: var(--text); }
    .section-link.is-active { background: var(--accent-soft); color: var(--accent); }
    .layout { display: grid; grid-template-columns: 294px minmax(0, 1fr); min-height: calc(100vh - 125px); }
    .sidebar { position: sticky; top: 125px; align-self: start; height: calc(100vh - 125px); overflow: auto; padding: 2rem 1rem 2rem 1.25rem; border-right: 1px solid var(--border); background: var(--surface); }
    .sidebar-header { padding: 0 .45rem 1.15rem; }
    .eyebrow { margin-bottom: .7rem; color: var(--accent); font-size: .68rem; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
    .sidebar-header h1 { margin: 0 0 .2rem; font-size: 1.15rem; letter-spacing: -.025em; }
    .sidebar-header p { margin: 0; color: var(--muted); font-size: .8rem; }
    .search-wrap { position: relative; display: block; margin: 1.15rem 0 .8rem; }
    .search-icon { position: absolute; top: .6rem; left: .75rem; color: var(--muted); pointer-events: none; }
    .search { width: 100%; padding: .62rem .7rem .62rem 2.1rem; border: 1px solid var(--border-bright); border-radius: .5rem; outline: 0; background: var(--bg); color: var(--text); font-size: .86rem; }
    .search::placeholder { color: var(--muted); }
    .search:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgb(22 217 160 / 12%); }
    .tree { display: grid; gap: .15rem; }
    .directory { border-radius: .45rem; }
    .directory[hidden] { display: none; }
    .directory[open] { background: color-mix(in srgb, var(--surface-hover) 42%, transparent); }
    .directory summary { display: flex; align-items: center; justify-content: space-between; gap: .75rem; padding: .48rem .55rem; cursor: pointer; color: var(--muted-bright); font-size: .88rem; font-weight: 700; list-style-position: outside; }
    .directory summary:hover { color: var(--text); }
    .directory summary small, .doc-link small { color: var(--muted); font-size: .69rem; font-weight: 500; }
    .tree-children { display: grid; gap: .08rem; padding: 0 0 .35rem .6rem; }
    .doc-link { display: grid; gap: .03rem; padding: .48rem .55rem; border-left: 2px solid transparent; border-radius: .35rem; color: var(--muted-bright); text-decoration: none; }
    .doc-link:hover { background: var(--surface-hover); color: var(--text); }
    .doc-link[hidden] { display: none; }
    .doc-link[aria-current="page"] { border-left-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
    .sidebar-footer { margin: 1.6rem .45rem 0; padding-top: 1rem; border-top: 1px solid var(--border); color: var(--muted); font-size: .72rem; }
    .reader { min-width: 0; padding: clamp(2.5rem, 5vw, 5.5rem) clamp(1.25rem, 5vw, 5rem) 6rem; }
    .reader-layout { display: grid; grid-template-columns: minmax(0, 840px) 170px; gap: clamp(2rem, 5vw, 5rem); justify-content: center; }
    .reader-inner { min-width: 0; }
    .welcome { max-width: 800px; padding: 2.5rem 0 4rem; }
    .welcome h1 { max-width: 740px; margin: 0 0 1.2rem; font-size: clamp(2.5rem, 5vw, 4.8rem); line-height: 1.02; letter-spacing: -.065em; }
    .welcome p { max-width: 620px; margin: 0; color: var(--muted-bright); font-size: 1.08rem; }
    .stats { display: flex; flex-wrap: wrap; gap: .7rem; margin-top: 2rem; }
    .stat { min-width: 120px; padding: .75rem .9rem; border: 1px solid var(--border); border-radius: .55rem; background: var(--surface); }
    .stat strong { display: block; font-size: 1.2rem; }
    .stat span { color: var(--muted); font-size: .74rem; }
    .document[hidden], .welcome[hidden], .page-rail[hidden] { display: none; }
    .document { max-width: 840px; }
    .document-header { margin-bottom: 2.5rem; padding-bottom: 1.3rem; border-bottom: 1px solid var(--border); }
    .document-header h1 { margin: 0 0 .55rem; font-size: clamp(2.2rem, 4vw, 3.6rem); line-height: 1.08; letter-spacing: -.06em; }
    .document-path { color: var(--muted); font: .74rem/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; overflow-wrap: anywhere; }
    .markdown-body { overflow-wrap: anywhere; color: var(--muted-bright); font-size: 1.02rem; }
    .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 { color: var(--text); line-height: 1.25; margin: 2.1em 0 .65em; scroll-margin-top: 150px; }
    .markdown-body h1 { font-size: 2em; margin-top: 0; }
    .markdown-body h2 { padding-bottom: .35em; border-bottom: 1px solid var(--border); font-size: 1.55em; letter-spacing: -.035em; }
    .markdown-body h3 { font-size: 1.2em; }
    .markdown-body a { color: var(--link); }
    .markdown-body img { max-width: 100%; height: auto; border-radius: .45rem; }
    .markdown-body pre { overflow: auto; padding: 1rem 1.1rem; border: 1px solid var(--border); border-radius: .55rem; background: var(--code); color: #e7edf8; }
    .markdown-body code { padding: .12em .3em; border-radius: .25rem; background: var(--surface-raised); color: #d7e2ff; font-size: .88em; }
    .markdown-body pre code { padding: 0; background: transparent; }
    .markdown-body blockquote { margin-left: 0; padding: .2rem 1rem; border-left: 3px solid var(--accent); color: var(--muted); background: var(--surface); }
    .markdown-body table { display: block; max-width: 100%; overflow: auto; border-collapse: collapse; }
    .markdown-body th, .markdown-body td { padding: .5rem .7rem; border: 1px solid var(--border); text-align: left; }
    .markdown-body th { background: var(--surface-raised); color: var(--text); }
    .page-rail { position: sticky; top: 165px; align-self: start; padding-top: 1rem; }
    .toc-label { margin-bottom: .8rem; color: var(--text); font-size: .78rem; font-weight: 750; }
    .toc-nav { display: grid; gap: .45rem; border-left: 1px solid var(--border-bright); }
    .toc-link { display: block; padding-left: .85rem; color: var(--muted); font-size: .76rem; line-height: 1.35; text-decoration: none; }
    .toc-link:hover, .toc-link.is-active { color: var(--accent); }
    .toc-link.level-3 { padding-left: 1.4rem; color: var(--muted); font-size: .72rem; }
    .status { min-height: 1.5rem; margin: 1rem 0 0; color: var(--muted); font-size: .76rem; }
    .status.error { color: #ff7d86; }
    .skip-link { position: absolute; left: -9999px; }
    .skip-link:focus { left: 1rem; top: 1rem; z-index: 20; padding: .5rem; background: var(--surface); }
    @media (max-width: 1100px) { .reader-layout { grid-template-columns: minmax(0, 840px); } .page-rail { display: none; } }
    @media (max-width: 760px) {
      .topbar { position: static; grid-template-columns: 1fr auto; min-height: 68px; padding: 0 1rem; }
      .top-nav { display: none; }
      .section-nav { padding: .6rem 1rem; }
      .layout { display: block; }
      .sidebar { position: static; height: auto; max-height: 52vh; border-right: 0; border-bottom: 1px solid var(--border); padding: 1.4rem .8rem; }
      .reader { padding: 2rem 1rem 4rem; }
      .welcome { padding-top: 1rem; }
    }
  </style>
</head>
<body>
  <a class="skip-link" href="#reader">Skip to document</a>
  <header class="topbar">
    <a class="brand" href="./"><span class="brand-mark">N</span><span>Developer Notes</span><span class="brand-badge">INDEX</span></a>
    <nav class="top-nav" aria-label="Primary navigation">
      <a class="is-active" href="./">Browse</a>
      <a href="https://github.com/Sourav9063/notes">Repository</a>
    </nav>
    <div class="top-actions">
      <button class="icon-button" id="theme-toggle" type="button" aria-label="Switch theme" title="Switch theme">◐</button>
      <a class="repo-link" href="https://github.com/Sourav9063/notes">GitHub ↗</a>
    </div>
  </header>
  <nav class="section-bar" aria-label="Top-level sections"><div class="section-nav" id="section-nav">__SECTIONS__</div></nav>
  <div class="layout">
    <aside class="sidebar" aria-label="Markdown documents">
      <div class="sidebar-header">
        <div class="eyebrow">Knowledge base</div>
        <h1>All notes</h1>
        <p>Search the complete Markdown archive.</p>
        <label class="search-wrap">
          <span class="sr-only">Search notes</span>
          <span class="search-icon" aria-hidden="true">⌕</span>
          <input class="search" id="search" type="search" placeholder="Filter documents…" autocomplete="off">
        </label>
      </div>
      <nav class="tree" id="tree" aria-label="Markdown documents">__TREE__</nav>
      <div class="sidebar-footer">Synced automatically<br>with GitHub Actions</div>
    </aside>
    <main class="reader" id="reader">
      <div class="reader-layout">
        <div class="reader-inner">
          <section class="welcome" id="welcome">
            <div class="eyebrow">Developer knowledge base</div>
            <h1>Notes for building better things.</h1>
            <p>A living index of practical guides, references, experiments, and patterns. Choose a document to start reading.</p>
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
        <aside class="page-rail" id="page-rail" aria-label="On this page" hidden>
          <div class="toc-label">On this page</div>
          <nav class="toc-nav" id="toc-nav"></nav>
        </aside>
      </div>
    </main>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js"></script>
  <script>
    const documents = __CATALOG__;
    const documentByPath = new Map(documents.map((item) => [item.path, item]));
    const tree = document.querySelector('#tree');
    const sectionNav = document.querySelector('#section-nav');
    const search = document.querySelector('#search');
    const welcome = document.querySelector('#welcome');
    const documentView = document.querySelector('#document');
    const documentTitle = document.querySelector('#document-title');
    const documentPath = document.querySelector('#document-path');
    const content = document.querySelector('#content');
    const pageRail = document.querySelector('#page-rail');
    const tocNav = document.querySelector('#toc-nav');
    const status = document.querySelector('#status');
    const themeToggle = document.querySelector('#theme-toggle');
    let loadId = 0;
    let activeSection = 'all';

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
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    }

    function slugForHeading(text, usedIds) {
      const base = text.toLocaleLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-') || 'section';
      const count = usedIds.get(base) || 0;
      usedIds.set(base, count + 1);
      return count ? `${base}-${count + 1}` : base;
    }

    function buildTableOfContents() {
      tocNav.replaceChildren();
      const usedIds = new Map();
      const headings = [...content.querySelectorAll('h2, h3')];
      headings.forEach((heading) => {
        const id = slugForHeading(heading.textContent, usedIds);
        heading.id = id;
        const link = document.createElement('a');
        link.className = `toc-link level-${heading.tagName.slice(1)}`;
        link.href = `#${id}`;
        link.textContent = heading.textContent;
        tocNav.append(link);
      });
      pageRail.hidden = headings.length === 0;
    }

    function scrollToHash() {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const target = document.getElementById(id);
      if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
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
      pageRail.hidden = true;
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
        const firstHeading = content.querySelector('h1');
        if (firstHeading && firstHeading.textContent.trim() === item.title.trim()) firstHeading.remove();
        rewriteRelativeUrls(content, item.path);
        buildTableOfContents();
        scrollToHash();
        setStatus(item.path);
      } catch (error) {
        if (currentLoadId !== loadId) return;
        content.textContent = 'Unable to load this document.';
        pageRail.hidden = true;
        setStatus(`${item.path}: ${error.message}`, true);
      }
    }

    function matchesSection(path) {
      if (activeSection === 'all') return true;
      if (activeSection === '__root__') return !path.includes('/');
      return path.startsWith(`${activeSection}/`);
    }

    function filterTree() {
      const query = search.value.trim().toLocaleLowerCase();
      tree.querySelectorAll('.doc-link').forEach((link) => {
        const item = documentByPath.get(link.dataset.docPath);
        const visible = matchesSection(item.path) && (!query || `${item.title} ${item.path}`.toLocaleLowerCase().includes(query));
        link.hidden = !visible;
      });
      tree.querySelectorAll('[data-directory]').forEach((directory) => {
        const hasVisibleDocument = [...directory.querySelectorAll('.doc-link')].some((link) => !link.hidden);
        directory.hidden = !hasVisibleDocument;
        if (query && hasVisibleDocument) directory.open = true;
      });
    }

    sectionNav.addEventListener('click', (event) => {
      const button = event.target.closest('.section-link');
      if (!button) return;
      activeSection = button.dataset.section;
      sectionNav.querySelectorAll('.section-link').forEach((item) => item.classList.toggle('is-active', item === button));
      filterTree();
    });

    tocNav.addEventListener('click', (event) => {
      const link = event.target.closest('.toc-link');
      if (!link) return;
      event.preventDefault();
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      const url = new URL(window.location.href);
      url.hash = link.hash;
      history.pushState({ path: url.searchParams.get('file'), hash: url.hash }, '', url);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    themeToggle.addEventListener('click', () => {
      const nextTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = nextTheme;
      themeToggle.setAttribute('aria-label', `Switch to ${nextTheme === 'light' ? 'dark' : 'light'} theme`);
    });

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
        pageRail.hidden = true;
        document.title = 'Developer Notes';
        setActive('');
        setStatus('');
      }
    });

    const initialPath = new URLSearchParams(window.location.search).get('file');
    filterTree();
    if (initialPath) selectDocument(initialPath, false);
  </script>
</body>
</html>
'''
    return (
        template.replace("__TREE__", tree)
        .replace("__SECTIONS__", sections)
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
