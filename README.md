# 🚀 Developer Knowledge Repository

A comprehensive collection of programming resources, cheat sheets, algorithms, design patterns, and development guides across multiple technologies and languages. This repository serves as a centralized knowledge base for developers working with modern web technologies, programming languages, and development tools.

## Markdown Index

Open [`index.html`](index.html) for a searchable browser that renders every tracked Markdown file. Regenerate it locally with `python3 scripts/generate_index.py`; or run **Sync Markdown index** manually from GitHub Actions. To publish it, enable GitHub Pages from the repository's `main` branch root.

## 📁 Repository Structure

### 🐹 Go
- [Effective Go](go/Effective-Go/README.md) - Official Go best practices and idioms ([বাংলা](go/Effective-Go/README_bn.md))
- [Go for Node.js Developers](go/golang-for-nodejs-developers/README.md) - Side-by-side Node.js and Go examples (upstream mirror)
- [Go for Node.js Developers (Modern)](go/golang-for-nodejs-modern/README.md) - Verified Go 1.27 / Node.js 24 rewrite with generics, iterators, context, slog, testing
- [Hexagonal Architecture](go/design-pattern-architecture/hexagonal_architecture.md) - Ports and adapters in Go
- [Viper Configuration](go/packages/viper/README.md) - Configuration management with Viper
- [Array vs Pointer Slices](go/quirky/[]UserVS[]*User.md) - `[]User` vs `[]*User`
- [Type Switches](go/quirky/sth.(type).md) - `x.(type)` and type assertions
- [Type Conversions](go/quirky/type_conversion.md) - Go type conversion patterns

---

### 🟨 JavaScript
- [33 JavaScript Concepts](javascript/33-js-concepts/README.md) - Reading list snapshot (upstream mirror)
- [Clean Code JavaScript](javascript/clean-code/README.md) - Clean Code principles for JavaScript (upstream mirror)
- [JavaScript Objects](javascript/Object/README.md) - Deep dive into JavaScript objects
- [Design Patterns](javascript/design-pattern/README.md) - Creational, structural, and behavioral patterns: OOP vs functional
- [Design Pattern Catalog](javascript/design-pattern/catalog.md) - One-line definitions and sketches of 100 patterns and combinations
- [Functional Programming](javascript/design-pattern/functional.md) - Pure functions, composition, functors, monads
- [Design Pattern Sketch Notes](javascript/design-pattern/Note/README.md) - Hand-drawn pattern notes
- [JavaScript Algorithms](javascript/javascript-algorithms/README.md) - Algorithms and data structures with explanations (upstream mirror)
- [Interview Questions](javascript/interview/README.md) - Basic, advanced, and full-stack question banks
- [Zod](javascript/zod/README.md) - Zod 4 schema validation cheatsheet
- [Node.js](javascript/node/README.md) - Node.js internals resources
- [XLSX Handling](javascript/misc/xlsx.md) - Reading Excel files with SheetJS
- [PDF Resources](javascript/pdf/README.md) - JavaScript interview PDF

---

### 🟦 TypeScript
- [TypeScript Cheatsheet](typescript/cheatsheet/README.md) - Basics through advanced type system

---

### ⚛️ React & Next.js
- [Client-Side Data Fetching](React/ClientSideDataFetching.md) - React 19 `use()`, fetch, and Server Actions in Client Components
- [Context Factory](React/context-factory/README.md) - Type-safe React Context factory and composer
- [Jotai](React/state-management/jotai/README.md) - Atomic state management
- [Data Attributes for State Styling](React/DataAttributeUsageInReact.md) - `data-*` attributes with CSS/Tailwind
- [Vertical Drag Scroll](React/HOW_TO_ENABLE_VERTICAL_DRAG_SCROLL.md) - Drag-to-scroll hook
- [Next.js Top Loader](React/NextJs/nextjs-toploader-routing-api-calls.md) - Route and API loading bar patterns
- [Next.js + PostgreSQL](React/NextJs/postgres-repository-service.md) - Repository-Service pattern with `pg`
- [React Best Practices (Vercel)](React/AGENTS.md) - Vercel agent skill rules (upstream mirror)

---

### 🎨 Vue.js
- [Vue 3 Cheatsheet](vue/vue-3/README.md) - Vue 3 Composition API reference
- [Advanced Vue 3](vue/vue-3/advanced/README.md) - Advanced patterns and techniques
- [Pinia](vue/pinia/README.md) - State management for Vue
- [Vuex Modular Store](vue/vuex/modular-store.md) - Vuex modules with shared base helpers
- [PrimeVue Theme](vue/primevue/README.md) - PrimeVue preset usage and palettes
- [Nuxt](vue/nuxt/README.md) - Full-stack Vue framework
- [Nuxt Data Fetching with Cookies](vue/nuxt/data-fetching/useAsyncData-with-cookies.md) - Auth tokens via cookies with `useAsyncData`

---

### 🎨 Tailwind CSS
- [Tailwind CSS Guide](tailwind/README.md) - Tailwind CSS v4 installation and migration guide
- [Tailwind Cheat Sheet](tailwind/cheat-sheet/README.md) - Tailwind CSS v4.3 utility reference
- [Tailwind to CSS Reference](tailwind/tailwind-to-css/README.md) - Conceptual utility-to-CSS mappings

---

### 🗃️ SQL & Databases
- [PostgreSQL Reference](SQL/PostgreSQL.md) - psql, functions, window functions, string matching, regex
- [PostgreSQL Internals](SQL/GOD_PostgreSQL.md) - Storage, planner, indexes, vacuum, and tuning
- [SQL Tutorial (CodeWithHarry)](SQL/Code-with-Harry.md) - MySQL tutorial copy
- Cheat sheet PDFs in [`SQL/`](SQL/)

---

### 🔧 Git
- [Git Notes](git/README.md) - Commands PDF and scenario fixes

---

### 🐳 DevOps
- [Docker Cheat Sheet](DevOps/docker-cheatsheet.md) - Essential Docker commands
- [Oracle VPS for Node.js](DevOps/ORACLE_VPS_BEST_USAGE.md) - Hosting multiple Node.js services on an Always Free VPS
- [GitLab CI and Helm Deployment](DevOps/p/gitlab-ci-helm-deployment-flow.md) - Build, publish, and deploy flow
- [Staging Deployment with In-Cluster Postgres/Redis](DevOps/p/deployment-db-redis-cluster.md) - Staging strategy

---

### ⌨️ Vim
- [Vi Mode in Bash](vim/vi-ubuntu.md) - `set -o vi` and readline vi mode
- [VSCode Vim Cheatsheet](vim/vscode-vim.md) - Personal VSCodeVim bindings
- [VSCodeVim Key Bindings](vim/KeyMap.md) - Default VSCodeVim key bindings
- [VSCodeVim Roadmap](vim/vscode-vim-roadmap.md) - Archived upstream feature roadmap

---

### 🐍 Python
- [pip `externally-managed-environment`](python/venv.md) - Virtual environments and pipx

---

### 🧠 Interview
- [DSA](Interview/DSA/README.md) - DSA placement PDF
- [System Design](Interview/System%20Design/README.md) - Fundamentals through trade-off questions

---

### 🤖 AI & LLM
- [AI](ai/README.md) - Agent guidance moved to [Sourav9063/ADD](https://github.com/Sourav9063/ADD)
- [LLM](LLM/README.md) - System prompt collection archive

---

### 📝 Miscellaneous
- [System Design Articles](misc/system-design-articles.md) - Reading list of system design articles
- [Google Maps `pb` Parameter](misc/google-maps-pb-parameter.md) - Decoding the Google Maps `pb` URL parameter
- [Useful GitHub Repositories](repo/README.md) - Curated learning repositories
