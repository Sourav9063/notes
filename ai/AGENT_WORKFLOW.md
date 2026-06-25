# AI Programming Guide

This document describes how I use coding agents in my project: where instructions live, how reusable workflows are organized, when to add folder-level instructions, and how to keep agent behavior predictable.

## Goals

- Keep agent work aligned with project architecture.
- Make repeated workflows reusable through skills and commands.
- Keep instructions small, local, and versioned when they affect the team.
- Separate team rules from personal preferences.
- Make agent output reviewable through plans, diffs, and verification.

## General Layout

Use this structure for new projects or when expanding this one:

```text
your-project/
├── CLAUDE.md                         # Team agent instructions, committed
├── AGENTS.md                         # Optional Codex-compatible entrypoint, committed
├── GEMINI.md                         # Optional Gemini-specific entrypoint, committed
│
├── .claude/
│   ├── settings.json                 # Team permissions/config, committed
│   ├── settings.local.json           # Personal overrides, gitignored
│   ├── commands/                     # Claude commands
│   ├── skills/                       # Claude-compatible workflows
│   ├── agents/                       # Specialized subagent personas
│   ├── docs/                         # Shared reference docs
│   └── worktrees/                    # Isolated worktree sessions, usually gitignored
│
├── agents/
│   ├── knowledge/                    # Durable architecture notes
│   └── plans/                        # Task-specific plans
│
└── src/
    ├── CLAUDE.md                     # Optional folder-level rules for app code
    ├── repository/
    │   └── CLAUDE.md                 # Optional data-access rules
    ├── services/
    │   └── CLAUDE.md                 # Optional business-logic rules
    └── app/
        └── CLAUDE.md                 # Optional routing/UI rules
```

Global personal instructions belong outside the repo:

```text
~/.claude/
├── CLAUDE.md                         # Personal Claude defaults
├── settings.json                     # Personal settings
├── rules/                            # Personal rules across projects
├── skills/                           # Personal skills
├── agents/                           # Personal subagents
└── projects/                         # Session history and auto-memory
```

## What Each File Is For

`CLAUDE.md` is the main project instruction file. It should contain durable team rules: architecture, commands, testing expectations, safety rules, coding style, and communication preferences.

`AGENTS.md` and `GEMINI.md` are compatibility entrypoints for other tools. In this repo they should mirror `CLAUDE.md` so different agents receive the same project rules. Keep them synchronized if they stay duplicated.

`AI.md` is documentation for humans. It explains how the instruction system is organized. It should not be treated as the primary operational prompt.

`.claude/skills/*/SKILL.md` files are reusable workflows for Claude. Use them for tasks like creating components, creating actions, reviewing merge requests, or any workflow that has repeated steps.

`.claude/commands/*.md` files are command prompts. Use them for short, user-invoked workflows.

`.codex/skills/*/SKILL.md` files are Codex-compatible workflow copies. Keep them aligned with Claude skills only when both tools need the workflow.

`.agents/skills/` can hold shared skill sources that are copied or adapted into tool-specific folders.

`agents/knowledge/` stores durable technical notes. Use it for architecture constraints, implementation patterns, API contracts, deployment notes, state-management decisions, and permission rules.

`agents/plans/` stores task-scoped plans. Use it when work is non-trivial, crosses layers, or needs alignment before implementation.

## Folder-Level `CLAUDE.md`

Folder-level `CLAUDE.md` files are local overrides for a subtree. Claude should apply the nearest applicable instructions in addition to the root file.

Use folder-level `AGENTS.md` or `GEMINI.md` only when a non-Claude tool needs the same scoped instructions. If duplicated, keep those files synchronized with the folder-level `CLAUDE.md`.

Use folder-level files when a directory has rules that are:

- More specific than root instructions.
- Stable enough to be committed.
- Important enough that missing them causes bugs or churn.
- Too detailed for the root `CLAUDE.md`.

Avoid folder-level files when:

- The rule applies to the whole repo.
- The content repeats root instructions.
- The folder is small and nearby code already makes the pattern obvious.
- The rule is temporary or task-specific; use `agents/plans/` instead.

Good examples:

```text
src/repository/CLAUDE.md
```

Use for SQL/data-access rules: no business logic, mapping rules, transaction expectations, DB error handling.

```text
src/services/CLAUDE.md
```

Use for business logic rules: Zod validation, `AppError`, service response shape, domain invariants.

```text
src/app/api/CLAUDE.md
```

Use for REST route rules: `withApiHandler`, `handleServiceResponse`, cache invalidation, auth handling.

```text
src/app/(dashboard)/CLAUDE.md
```

Use for UI route rules: Server/Client split, `searchParams`, `useQueryState`, skeletons, guards, layout density.

Keep folder-level files short. Prefer 10-30 lines of concrete constraints over long style essays.

## Skills

Skills are reusable workflows. Use a skill when the agent should follow a named process, not just remember a fact.

Good skill topics:

- Create a service/action/repository feature.
- Create a UI component.
- Review a merge request.
- Add a migration.
- Investigate a production-style bug.
- Prepare a release.

Skill rules:

- Keep `SKILL.md` concise.
- Put trigger context in frontmatter `description`.
- Put only essential procedure in the body.
- Move large references into separate files only when needed.
- Validate the skill after editing when the validator is available.
- Keep tool-specific metadata, such as `agents/openai.yaml`, in sync with the skill when present.

## Knowledge vs Plans vs Skills

Use `agents/knowledge/` for durable facts:

- Architecture decisions.
- API contracts.
- State-management conventions.
- Auth and permission rules.
- Deployment flow.

Use `agents/plans/` for scoped work:

- A feature implementation plan.
- A migration checklist.
- A refactor sequence.
- A risk list and verification plan.

Use skills for repeatable workflows:

- The steps to create a component.
- The steps to create an action.
- The steps to review a branch.

Do not put everything into `CLAUDE.md`. Root instructions should stay small enough to load every time.

## How I Use Agents For Programming

1. Put durable rules in `CLAUDE.md`.
2. Put detailed architecture notes in `agents/knowledge/`.
3. Put task plans in `agents/plans/` before large implementation work.
4. Use skills for repeated workflows.
5. Ask the agent to inspect nearby code before changing files.
6. Ask for a short plan when the work crosses layers or has design ambiguity.
7. Let the agent implement directly for small, clear changes.
8. Require narrow verification: lint, typecheck, focused test, or build depending on risk.
9. Review the final diff before merging.

Useful prompts:

```text
Use /create-component to build the filter UI for this page.
```

```text
Create a plan in agents/plans/ for adding this API endpoint before coding.
```

```text
Review this branch against main. Prioritize correctness, security, architecture fit, and missing tests.
```

```text
Read agents/knowledge/api-implementation.md and implement the smallest compatible change.
```

## Best Practices

- Commit team instructions. Keep personal preferences in global agent config.
- Keep root instructions short and durable.
- Prefer path-scoped `CLAUDE.md` files over bloating the root file.
- Prefer skills for workflows and knowledge files for facts.
- Keep generated or dependency folders out of project policy. For example, `node_modules/*/AGENTS.md` or `node_modules/*/CLAUDE.md` belongs to dependencies, not this repo.
- Name files after the workflow or domain they govern.
- Keep commands exact: package manager, test command, build command, ports, and known sandbox requirements.
- Document architectural boundaries, not every coding preference.
- State verification expectations clearly.
- Update instructions when repeated agent mistakes show a missing rule.
- Remove stale instructions quickly; wrong rules are worse than missing rules.
- Avoid secrets in any committed AI instruction file.
- Treat AI output like any other code: review diffs, run checks, and verify behavior.

## Full Root `CLAUDE.md`

Current content:

```md
@/Users/Sourav/.codex/RTK.md

--- project-doc ---

# Strike Agent Guide

Next.js 16 + React 19 app. Bun, Tailwind v4, shadcn/ui, Biome, PostgreSQL, auth/permissions. Keep edits small, typed, local-pattern aligned.

## Spec-Driven Development

Use SDD for non-trivial work. Read `agents/knowledge/` for architecture constraints and `agents/plans/` for scoped execution notes before coding. If asked to create or refine a plan, write the final plan to a new named file in `agents/plans/` before implementation. Align, execute, then verify against those specs; flag knowledge/plan conflicts immediately.

## Commands

Use `rtk` before shell commands. `bun run dev`/`start` use port 8080; ask user to run long-lived dev server separately. `bun run build` outside sandbox. `bun run lint` = `biome check`; `format`, `fix`, `fix:unsafe` map to Biome. `docker compose up -d` starts PostgreSQL 15. `bunx --bun shadcn@latest add <component>` adds UI.

## Architecture

3 layers: `src/repository/` raw SQL/mapping only, `src/services/` business logic + Zod + `AppError`, `src/action/` and `src/app/api/v1/*/route.ts` transport. Use `withTransaction` for multi-query writes. Actions wrap `handleError()` and return `{ success, data } | { success, error }`; REST uses `withApiHandler` + `handleServiceResponse`. Cache invalidation stays in actions/routes. DB errors go through `handleDbError`.

## App Structure

Routes: `(auth)`, `(dashboard)`, `api/v1`. Reference feature: `src/types/example.ts`, `repository/example.ts`, `services/example.ts`, `action/example.ts`, `(dashboard)/page.tsx`.

Auth: JWT `access_token`; prefer `getUser()` from `src/action/user.ts`. Admin implies reviewer; reviewer gates use `user.permission.reviewer || user.permission.admin` or `handleReviewerPermission()`. Guards live in `src/components/guards/`.

Config: `src/config/index.ts` owns hosts/creds/JWT. `src/constants/` owns routes, permissions, cache tags. `backendApiRoutes` is server-only; `apiRequest` caches GET 5 min with `GLOBAL_CACHE_TAG`, mutations `revalidate: 0`.

## UI And State

Server Components fetch data; Client Components handle interactivity/hooks/browser APIs/forms. Use paired `-client.tsx`, `Suspense` + `Skeleton`, URL `searchParams` + `useQueryState` for shareable filters. Navigation uses `useRouter` from `nextjs-toploader/app`; mutations use `useTopLoader()` start/done. Add external image hosts to `next.config.ts`.

Multi-part components use folders with direct imports, no barrels. Global hooks in `src/hooks/`; feature hooks in `_component/`. Context helpers in `src/lib/utils/context.tsx`.

## Types

Strict TypeScript. No `any`; use `unknown` + narrowing. Prefer Zod schemas in `src/types/`. Use `@/*`. Biome owns format/lint. React Compiler on: keep components pure; avoid needless memoization.

## Working Rules

- Think before coding: state assumptions, tradeoffs, and confusion; when behavior is ambiguous, surface options instead of picking silently.
- Unclear plans/designs/instructions: explore code first, then ask one concise question at a time; use selectable options when supported and useful.
- Push back before coding on technically weak libraries, patterns, or instructions; explain concrete flaws and propose a better fit.
- Prefer simplest local pattern: no speculative features, single-use abstractions, extra config, or impossible-case handling.
- Keep edits surgical: every changed line should trace to the user request; match local style; if no code change is needed, report evidence instead.
- Clean only own changes: remove newly unused code, mention unrelated dead code/risks without deleting.
- Multi-step work needs brief plan, explicit success checks, and narrow verification loop until done.

## Communication

Respond like smart caveman: no greetings articles filler hedging. Keep technical substance code API names commands errors exact. Prefer [thing] [action] [reason]. Fragments OK. Use fuller wording when compression risks ambiguity, safety, or irreversible-action clarity.
```
