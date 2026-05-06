# AI.md

## How I Work With AI

There are different types of AI tools for developers:

- **Full IDE**: AI-first editor with coding, chat, terminal, and project context built in.
- **IDE extension**: AI assistant inside existing editor, usually VS Code or JetBrains.
- **All-in-one AI desktop app**: Chat, files, browser, agents, and workflows in one standalone app.
- **CLI tool**: Terminal-first agent that reads project files, runs commands, edits code, and follows repo instructions.

I use CLI.

CLI tools have a more stable standard across vendors. Most support similar patterns: markdown memory files, project settings, tool permissions, commands, hooks, skills, agents, and plan mode. AI landscape changes fast, so CLI keeps me switchable. I can move between Claude Code, Codex, Gemini CLI, or another agent without rebuilding whole workflow around one IDE.

## Core Principles

- Markdown files are your friend.
- Project memory must be explicit, short, and versioned.
- I do not use auto memory as source of truth.
- I update `CLAUDE.md` frequently.
- Every project must have one agent folder: `.claude/`, `.agent/`, `.agents/`, or `.gemini/`.
- Permissions must ask before risky actions.
- Plans must be saved when work is complex.
- Knowledge must be captured when project context is hard to infer.

## AI Tool Types

Developer AI tools usually fall into four buckets:

- **Full IDE**: AI-native editor.
- **IDE extension**: AI inside existing editor.
- **All-in-one desktop app**: chat, files, browser, and agents in one app.
- **CLI**: terminal-first agent.

I use CLI because it has more standard workflow across tools. Markdown memory, settings, permissions, commands, hooks, skills, agents, and plan mode are portable enough. AI tools change fast, so CLI keeps workflow switchable.

## 2026 Edition: Claude Code Workflow Cheatsheet

### 1. Getting Started

Install Claude Code. Requires Node.js 18+.

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Start in project:

```bash
cd your-project
claude /init
```

`/init` scans codebase and creates starter memory file.

### 2. Project Setup

Run `/init` first, then refine output manually.

Best practices:

- Be specific in instructions.
- Add gotchas Claude cannot infer.
- Reference docs with `@filename`.
- Add workflow rules.
- Keep memory concise.
- Commit memory files to git for team sharing.
- Keep each memory file under 200 lines when possible.

### 3. CLAUDE.md

`CLAUDE.md` is persistent memory about project. It loads automatically at start of session.

Good `CLAUDE.md` includes:

- Tech stack.
- Directory map.
- Architecture.
- Purpose of important modules.
- Build, test, and lint commands.
- Workflow rules.
- Gotchas.
- Design decisions.
- Permission expectations.

Example:

```md
# Project: MyApp

FastAPI REST API + React SPA + Postgres.

## Commands

npm run dev
npm run test
npm run lint

## Architecture

/app Next.js App Router pages
/lib shared utilities
/prisma DB schema and migrations
```

### CLAUDE.md File Types

#### Global `~/.claude/CLAUDE.md`

Personal rules across all projects.

Use for:

- Preferred communication style.
- General coding rules.
- Personal workflow defaults.
- Tool behavior preferences.

Do not put project secrets here.

#### Parent Monorepo `../CLAUDE.md`

Shared context for whole monorepo.

Use for:

- Cross-package architecture.
- Shared commands.
- Repo-wide conventions.
- Deployment rules.

#### Project Root `CLAUDE.md`

Main source of truth for current project.

Use for:

- Project architecture.
- Commands.
- Local development setup.
- Permission rules.
- Feature ownership.
- Testing expectations.

Commit this file.

#### Folder-Level `CLAUDE.md`

Separate folder `CLAUDE.md` gives scoped context.

Example:

```text
src/app/(mapsense)/(suggestion)/CLAUDE.md
```

Benefits:

- Feature-specific context stays close to code.
- Root memory stays short.
- Agent loads extra rules only when working in that folder.
- Complex features get their own map, state rules, and gotchas.

Folder files append context. They should not overwrite parent context.

#### `CLAUDE.local.md`

Local-only memory for developer-specific context.

Use for:

- Personal machine setup.
- Local command aliases.
- Temporary notes.
- WIP experiment context.
- Local service URLs.

Do not commit if it contains personal paths, secrets, or machine-only assumptions. Add to `.gitignore` when needed.

### 4. Memory

Memory hierarchy:

```text
~/.claude/CLAUDE.md       Global all projects
../CLAUDE.md              Parent monorepo root
/CLAUDE.md                Project shared on git
/frontend/CLAUDE.md       Subfolder-scoped context
/CLAUDE.local.md          Local-only personal context
```

Rules:

- Do not rely on auto memory.
- Update `CLAUDE.md` frequently.
- Keep memory concise.
- Prefer facts over preferences.
- Add gotchas immediately after discovering them.
- Remove stale instructions.
- Commit shared memory to git.

### 5. Project File Structure

Recommended structure:

```text
your-project/
  CLAUDE.md
  CLAUDE.local.md
  AI.md
  .claude/
    settings.json
    settings.local.json
    skills/
      code-review/
        SKILL.md
      testing/
        SKILL.md
        helpers.py
    commands/
      deploy.md
    agents/
      security-reviewer.md
    hooks/
      sec.sh
    arc/
    .gitignore
  agents/
    plans/
      feature-name.md
    knowledge/
      domain-decision.md
```

Equivalent folders are acceptable:

```text
.agent/
.agents/
.gemini/
```

Pick one convention per project. Do not scatter workflow files across many hidden folders unless tool requires it.

### 6. Settings

Use settings for deterministic behavior.

Common files:

- `.claude/settings.json`: shared team settings.
- `.claude/settings.local.json`: personal local overrides.
- `.claude/.gitignore`: ignore local settings, logs, and secrets.

Shared settings should include safe defaults. Local settings can include personal tool preferences.

Security rule: do not commit permissive or secret-bearing settings to public repo. Keeping `.claude/settings.json` or `.claude/settings.local.json` in public repo can expose unsafe permissions, local paths, database URLs, API keys, tokens, and command allowlists. A real failure pattern is: developer enables auto-accept for all sessions in `.claude/settings.local.json`, agent writes or reads sensitive config, then developer uploads `.claude/` to GitHub. Result: repo exposes local AI behavior plus possible secrets.

Keep this in `.gitignore`:

```gitignore
.claude/settings.local.json
.claude/logs/
.claude/cache/
.claude/transcripts/
.claude/**/secrets.*
.claude/**/*.env
```

Commit only reviewed shared settings. Never commit local settings by accident.

Example:

```json
{
  "permissions": {
    "allow": ["Read:*", "Bash:git:*", "Write:*:*.md"],
    "deny": ["Read:.env*", "Bash:sudo:*"]
  }
}
```

### 7. Permissions And Safety

Permission defaults must be conservative.

Ask before every command that:

- Deletes files.
- Mutates git history.
- Reads `.env` or secret files.
- Accesses internet.
- Installs dependencies.
- Runs `sudo`.
- Changes production or deployment state.
- Writes outside project directory.

Recommended deny rules:

```json
{
  "permissions": {
    "deny": [
      "Read:.env*",
      "Bash:rm:*",
      "Bash:sudo:*",
      "WebFetch:*",
      "WebSearch:*"
    ]
  }
}
```

Use allow rules for routine safe operations:

```json
{
  "permissions": {
    "allow": [
      "Read:*",
      "Grep:*",
      "Glob:*",
      "Bash:git status",
      "Bash:git diff",
      "Bash:npm run lint",
      "Bash:bun run lint",
      "Write:*:*.md"
    ]
  }
}
```

Use ask rules for risky commands. Keep this in local settings unless team explicitly agrees to share it.

```json
{
  "permissions": {
    "ask": [
      "Bash(rm *)",
      "Bash(rmdir *)",
      "Bash(mv *)",
      "Bash(dd *)",
      "Bash(shred *)",
      "Bash(truncate *)",
      "Bash(sudo *)",
      "Bash(chmod *)",
      "Bash(chown *)",
      "Bash(kill *)",
      "Bash(killall *)",
      "Bash(pkill *)",
      "Bash(launchctl *)",
      "Bash(systemctl *)",
      "Bash(crontab *)",
      "Bash(eval *)",
      "Bash(source *)",
      "Bash(. *)",
      "Bash(bash *)",
      "Bash(sh *)",
      "Bash(zsh *)",
      "Bash(python *)",
      "Bash(python3 *)",
      "Bash(node *)",
      "Bash(ruby *)",
      "Bash(perl *)",
      "Bash(osascript *)",
      "Bash(at *)",
      "Bash(nohup *)",
      "Bash(mkfs *)",
      "Bash(diskutil *)",
      "Bash(fdisk *)",
      "Bash(mount *)",
      "Bash(umount *)",
      "Bash(passwd *)",
      "Bash(dscl *)",
      "Bash(useradd *)",
      "Bash(userdel *)",
      "Bash(usermod *)",
      "Bash(visudo *)",
      "Bash(defaults write *)",
      "Bash(csrutil *)",
      "Bash(spctl *)",
      "Bash(pmset *)",
      "Bash(git clone *)",
      "Bash(git pull*)",
      "Bash(git fetch*)",
      "Bash(git push*)",
      "Bash(git reset --hard*)",
      "Bash(git clean *)",
      "Bash(git rebase *)",
      "Bash(git config *)",
      "Bash(git remote *)",
      "Bash(git submodule *)",
      "Bash(git filter-branch*)",
      "Bash(npm install*)",
      "Bash(npm i *)",
      "Bash(npx *)",
      "Bash(bun install*)",
      "Bash(bun add *)",
      "Bash(bun i *)",
      "Bash(bunx *)",
      "Bash(pip install*)",
      "Bash(pip3 install*)",
      "Bash(yarn add *)",
      "Bash(pnpm install*)",
      "Bash(pnpm add *)",
      "Bash(brew install*)",
      "Bash(brew upgrade*)",
      "Bash(gem install*)",
      "Bash(curl *)",
      "Bash(wget *)",
      "Bash(fetch *)",
      "Bash(ssh *)",
      "Bash(scp *)",
      "Bash(sftp *)",
      "Bash(rsync *)",
      "Bash(nc *)",
      "Bash(netcat *)",
      "Bash(telnet *)",
      "Bash(ftp *)",
      "Bash(nmap *)",
      "Bash(docker pull*)",
      "Bash(docker push*)",
      "Bash(docker run*)",
      "Bash(docker-compose *)",
      "Bash(gh *)",
      "Bash(aws *)",
      "Bash(gcloud *)",
      "Bash(az *)",
      "Bash(kubectl *)",
      "Bash(terraform *)",
      "Bash(helm *)",
      "Bash(ansible *)",
      "Bash(ngrok *)",
      "Bash(cloudflared *)",
      "Bash(psql *)",
      "Bash(mysql *)",
      "Bash(mongo *)",
      "Bash(mongosh *)",
      "Bash(redis-cli *)"
    ]
  },
  "statusLine": {
    "type": "command",
    "command": "bash ~/.claude/statusline-command.sh"
  },
  "effortLevel": "medium",
  "editorMode": "vim",
  "remoteControlAtStartup": false,
  "model": "opus"
}
```

Do not auto-approve destructive operations. Asking slows nothing compared to recovering deleted files or leaked secrets.

### 8. AI Security Issues

AI agent security problems usually come from permissions, memory, logs, and context files.

Common issues:

- Public `.claude/settings.json` exposes tool allowlists and unsafe defaults.
- Public `.claude/settings.local.json` exposes personal machine config and auto-accept behavior.
- Auto-accept for all commands lets agent read secrets, delete files, install packages, or access internet without review.
- `.env`, `.env.local`, database URLs, API keys, OAuth secrets, JWT secrets, and cloud credentials can leak through copied context.
- Chat transcripts and agent logs can contain secrets pasted during debugging.
- Saved plans can include private API endpoints, incident details, customer data, or credentials.
- Knowledge files can accidentally preserve production URLs, tokens, passwords, or private architecture.
- Hooks can run arbitrary scripts if repo is compromised.
- Skills can hide dangerous instructions if copied from untrusted source.
- Commands in `.claude/commands/` can become unreviewed deployment or destructive scripts.
- Broad internet access can leak proprietary code to external sites or fetch malicious instructions.
- Broad write access can modify lockfiles, config, CI, or deployment files without enough review.
- Broad read access can include SSH keys, `.npmrc`, `.pypirc`, kubeconfig, cloud profiles, and local credential stores.

Safer defaults:

- Keep `settings.local.json` untracked.
- Review `settings.json` before commit.
- Deny `.env*` reads by default.
- Ask before internet access.
- Ask before delete commands.
- Ask before dependency install.
- Ask before deployment commands.
- Ask before reading files outside repo.
- Rotate any secret once committed, even if commit is deleted later.
- Run secret scanners before pushing public repo.

Minimum `.gitignore`:

```gitignore
.env
.env.*
!.env.example
.claude/settings.local.json
.claude/logs/
.claude/cache/
.claude/transcripts/
.agent/settings.local.json
.agents/settings.local.json
.gemini/settings.local.json
```

### 9. Skills

Skills are markdown guides Claude auto-invokes from natural language.

Project skill:

```text
.claude/skills/<name>/SKILL.md
```

Personal skill:

```text
~/.claude/skills/<name>/SKILL.md
```

Example:

```md
---
name: testing-patterns
description: Jest testing patterns
allowed-tools: Read, Grep, Glob
---

# Testing Patterns

Use describe + it + AAA pattern.
Use factory mocks.
```

Description field is critical for auto-activation.

Useful skills for AI engineers:

- `code-review`
- `testing-patterns`
- `commit-messages`
- `docker-deploy`
- `codebase-visualizer`
- `api-design`
- `security-review`

### 10. Hooks

Hooks are deterministic callbacks around tool usage.

Common hook types:

- `PreToolUse`: before tool runs.
- `PostToolUse`: after tool runs.
- `Notification`: when agent needs attention.

Example:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "scripts/sec.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

Exit codes:

- `0`: allow.
- `2`: block.

Use hooks for safety gates and automation, not fuzzy reasoning.

### 11. Plan Mode

Plan mode is for thinking before editing.

Use it when:

- Feature crosses multiple files.
- Migration or data model change exists.
- Permissions or auth logic changes.
- Refactor may break behavior.
- Task needs review before execution.

Daily pattern:

```text
cd project
claude
Shift + Tab Tab      Plan Mode
Describe feature intent
Review plan
Shift + Tab          Auto Accept when safe
/compact             Compress context
Esc Esc              Rewind when agent goes wrong
Commit frequently
Start new session per feature
```

Dump plans into:

```text
agents/plans/
```

Benefits:

- Plan survives context compression.
- Team can review intended change.
- Future agent can resume work.
- Decisions become searchable.
- Complex work becomes auditable.

Plan file format:

```md
# Feature Name Plan

## Goal

What must change.

## Current State

What code does now.

## Proposed Changes

Files and behavior to update.

## Risks

What can break.

## Verification

Commands, tests, and manual checks.
```

### 12. Knowledge Folder

Create:

```text
agents/knowledge/
```

Use for durable project knowledge that is too detailed for `CLAUDE.md`.

Good knowledge files:

- Architecture explanations.
- State machine notes.
- Deployment gotchas.
- Permission model details.
- API contract decisions.
- Performance investigations.
- Database migration notes.

Benefits:

- Keeps `CLAUDE.md` short.
- Preserves hard-earned context.
- Gives agents searchable domain knowledge.
- Makes onboarding faster.

Rule: `CLAUDE.md` should point to important knowledge docs instead of copying everything.

### 13. Workflows

#### Daily Workflow Pattern

```text
cd project && claude
Read CLAUDE.md
Use plan mode for non-trivial work
Save plan in agents/plans/
Implement in small diffs
Run lint/test
Update CLAUDE.md or agents/knowledge/ when new rule discovered
Commit frequently
Start new session per feature
```

#### Code Review Workflow

```text
Ask agent for review mindset
Prioritize bugs, regressions, missing tests
Require file and line references
Fix highest severity first
Run verification
Save review notes when useful
```

#### Knowledge Capture Workflow

```text
Find repeated explanation
Move detail to agents/knowledge/<topic>.md
Add short pointer in CLAUDE.md
Keep root memory under 200 lines
```

### 14. 4-Layer Architecture

```text
L1 - CLAUDE.md
Persistent context and rules.

L2 - Skills
Auto-invoked knowledge packs.

L3 - Hooks
Safety gates and automation.

L4 - Agents
Subagents with their own context.
```

Use all four layers together:

- `CLAUDE.md` says what project is and how to behave.
- Skills teach repeatable specialized workflows.
- Hooks enforce deterministic safety.
- Agents split work into focused roles.

### 15. Quick Reference

```text
/init          Generate CLAUDE.md
/doccat        Collect docs/context
/compact       Compress context
Shift + Tab    Change modes
Tab            Toggle extended thinking
Esc Esc        Rewind menu
```

## Final Rule

AI should not be magic memory. AI should be repo-aware automation with explicit markdown context, safe permissions, saved plans, and durable knowledge.
