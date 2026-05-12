
# Anatomy of the .claude Folder - Every File Explained (2026) - codewithmukesh 
# https://codewithmukesh.com/blog/anatomy-of-the-claude-folder/
Most Claude Code users know the `.claude` folder exists. They’ve seen it appear in their project root. Some have even opened it. But here’s what I’ve noticed after months of building with Claude Code: almost nobody actually understands what each file inside it does, when it loads, or how the pieces fit together.

That’s a missed opportunity. The `.claude` folder is the control center for how Claude behaves in your project. It holds your instructions, your custom workflows, your permission rules, and even Claude’s memory across sessions. The gap between a beginner’s setup (a single `CLAUDE.md` with 20 lines) and a well-configured project is enormous, and that gap translates directly into how useful Claude is for your team.

In this article, I’ll walk through every file and folder inside `.claude/`, explain when each one loads and how they interact, and show you practical examples you can adapt for your own .NET projects. No black boxes. No guessing. Just a clear map of what goes where and why.

The `.claude` folder controls 5 distinct subsystems: **instructions** (CLAUDE.md and rules), **workflows** (skills and commands), **specialists** (agents), **permissions** (settings.json), and **memory** (the global `~/.claude/` directory). Once you understand how these pieces fit together, configuring Claude stops feeling like guesswork.

**Prerequisites:** This guide assumes you’ve installed Claude Code and run at least one session. If not, start with [Claude Code for Beginners](https://codewithmukesh.com/blog/claude-code-for-beginners/) first, then come back here.

Let’s get into it.

The Full Picture: What’s Inside .claude/
----------------------------------------

Before diving into each piece, here’s the complete structure. Not every project needs all of these, but this is what a mature `.claude` setup looks like:

```

your-project/
├── CLAUDE.md                    # Team instructions (committed)
│
└── .claude/
    ├── settings.json            # Permissions + config (committed)
    ├── settings.local.json      # Personal permission overrides (gitignored)
    │
    ├── rules/                   # Modular instruction files
    │   ├── dotnet-conventions.md # Always loaded
    │   ├── ef-core.md           # Path-scoped to DbContext/Migrations
    │   └── api-design.md        # Path-scoped to API controllers
    │
    ├── skills/                  # Reusable workflows
    │   ├── code-review/
    │   │   └── SKILL.md
    │   ├── deploy/
    │   │   └── SKILL.md
    │   └── fix-issue/
    │       └── SKILL.md
    │
    ├── agents/                  # Specialized subagent personas
    │   ├── code-reviewer.md
    │   └── security-auditor.md
    │
    ├── docs/                    # Shared reference documents
    │   ├── architecture.md
    │   └── coding-standards.md
    │
    └── worktrees/               # Isolated git worktree sessions
~/.claude/                       # Global (personal, all projects)
├── CLAUDE.md                    # Your global instructions
├── settings.json                # Your global settings
├── rules/                       # Personal rules (all projects)
├── skills/                      # Personal skills (all projects)
├── agents/                      # Personal agents (all projects)
└── projects/                    # Session history + auto-memory
```


That’s a lot of files. Let’s break them down one by one.

Two Folders, Not One
--------------------

Before anything else, you need to know that there are **two** `.claude` directories, not one.

**Project-level** (`.claude/` in your repo root): This holds team configuration. You commit it to git. Everyone on the team gets the same rules, the same skills, the same permission policies.

**Global** (`~/.claude/` in your home directory): This holds your personal preferences and machine-local state. Session history, auto-memory, global settings that apply across every project you work on.

The distinction matters because it determines what gets shared and what stays personal. Your team’s coding standards go in the project folder. Your personal preference for verbose error messages goes in the global folder.

Here’s the full precedence order, from highest to lowest priority:


|Priority   |Source          |Location                   |
|-----------|----------------|---------------------------|
|1 (highest)|Managed policy  |System-level (set by IT)   |
|2          |CLI arguments   |Command line flags         |
|3          |Local overrides |.claude/settings.local.json|
|4          |Project settings|.claude/settings.json      |
|5 (lowest) |User settings   |~/.claude/settings.json    |


When two settings conflict, the higher-priority source wins. This means your team can set project defaults, but individual developers can override them locally without affecting anyone else.

CLAUDE.md: The Highest-Leverage File
------------------------------------

This is the single most important file in the entire system. When you start a Claude Code session, the first thing it reads is `CLAUDE.md`. It loads the contents straight into the system prompt and keeps it in mind for the entire conversation.

Simply put: whatever you write in CLAUDE.md, Claude will follow. If you tell Claude to always write tests before implementation, it will. If you say “never use `Console.WriteLine` for error handling, always use the `ILogger` abstraction,” it will respect that every time.

I’ve written a [complete deep-dive on CLAUDE.md](https://codewithmukesh.com/blog/claude-md-mastery-dotnet/) already, so I’ll keep this section focused on what you need to know in the context of the broader `.claude` folder.

### Where CLAUDE.md Can Live

Claude Code walks **up the directory tree** from your current working directory, loading every `CLAUDE.md` it finds:


|Location                           |Scope                       |Shared?              |
|-----------------------------------|----------------------------|---------------------|
|./CLAUDE.md (project root)         |Team instructions           |Via git              |
|./.claude/CLAUDE.md (inside folder)|Alternative location        |Via git              |
|./CLAUDE.local.md                  |Personal project preferences|Just you (gitignored)|
|~/.claude/CLAUDE.md                |Personal, all projects      |Just you             |
|Managed policy path                |Organization-wide           |All users            |


If you’re working in `src/Api/Handlers/` and there’s a `CLAUDE.md` in that subdirectory, Claude loads it **on demand** when it reads files there. Parent directory CLAUDE.md files load at startup. This means you can have folder-specific instructions in a monorepo without cluttering the root file.

### What a Good CLAUDE.md Looks Like

Here’s a practical CLAUDE.md for a .NET API project:

```

# Acme API
ASP.NET Core 10 Web API with Clean Architecture.
## Commands
dotnet build src/Acme.sln          # Build
dotnet test tests/Acme.Tests/      # Run tests (xUnit)
dotnet format src/Acme.sln         # Format code
dotnet ef database update           # Apply migrations
## Architecture
- Clean Architecture: Api → Application → Domain → Infrastructure
- Minimal APIs with endpoint classes in `src/Api/Endpoints/`
- MediatR for CQRS: commands in Application/Commands/, queries in Application/Queries/
- EF Core 10 with PostgreSQL
## Key Paths
| What | Where |
|------|-------|
| Endpoints | `src/Api/Endpoints/` |
| Domain entities | `src/Domain/Entities/` |
| EF migrations | `src/Infrastructure/Persistence/Migrations/` |
| Integration tests | `tests/Acme.IntegrationTests/` |
## Conventions
- Use Scalar for API docs (not Swagger)
- Return `Results<Ok<T>, NotFound, ValidationProblem>` from endpoints
- All handlers take `CancellationToken` as last parameter
- Use FluentValidation for request validation
- Never expose stack traces to the client
## Watch Out For
- Tests use a real PostgreSQL via Testcontainers, not mocks
- Strict TypeScript in the React frontend: no unused imports
- The `src/Shared/` project is referenced by both Api and Workers - changes there affect both
```


That’s about 35 lines. It gives Claude everything it needs to work productively in this codebase without constant clarification. Notice the structure: **commands, architecture, paths, conventions, gotchas**. That covers 95% of what Claude needs to know.

### What NOT to Put in CLAUDE.md

*   Anything a linter or formatter already handles (indentation, import ordering)
*   Full documentation you can link to instead
*   Long paragraphs explaining theory
*   Code snippets (those belong in skills or docs)

### Size and Effectiveness

**Target under 200 lines.** Files longer than that consume excessive context and Claude’s instruction adherence actually drops. If yours is getting crowded, that’s your signal to split instructions into `.claude/rules/` files.

One more thing worth knowing: CLAUDE.md **survives compaction**. When you run `/compact` or Claude auto-compacts, it re-reads CLAUDE.md fresh from disk. Instructions you give only in conversation will be lost after compaction, but CLAUDE.md instructions persist. This makes CLAUDE.md the most reliable way to give Claude permanent instructions.

### Personal Overrides with @import

Sometimes you need a preference that’s specific to you, not the whole team. Maybe you want Claude to use a different test runner, or you prefer verbose output during debugging sessions.

The recommended approach is to use `~/.claude/CLAUDE.md` for personal preferences that apply across all your projects, or use the `@import` syntax to pull in a personal file:

```

# In your project CLAUDE.md
@~/.claude/my-dotnet-preferences.md
```


The `@import` syntax supports relative and absolute paths with a maximum depth of **5 hops** of recursive imports. First encounter of external imports triggers an approval dialog for security.

This keeps your personal overrides clean and separate from the team config.

The rules/ Folder: Modular, Path-Scoped Instructions
----------------------------------------------------

`CLAUDE.md` works great for small projects. But once your instructions grow beyond 200 lines, or once multiple team members need to maintain different sections, you need modularity. That’s what `.claude/rules/` provides.

Every markdown file inside `.claude/rules/` gets loaded alongside your CLAUDE.md. Instead of one giant file, you split instructions by concern:

```

.claude/rules/
├── code-style.md        # C# conventions, naming patterns
├── testing.md           # Test requirements, mocking rules
├── api-conventions.md   # REST standards, response shapes
└── security.md          # Auth patterns, secret handling
```


Each file stays focused and easy to update. The team member who owns API conventions edits `api-conventions.md`. The person who owns testing standards edits `testing.md`. Nobody steps on each other.

Claude Code discovers files **recursively**, so you can organize into subdirectories too:

```

.claude/rules/
├── backend/
│   ├── ef-core.md
│   └── api-design.md
└── frontend/
    ├── react-conventions.md
    └── testing.md
```


### Rules Without Path Scoping (Always Loaded)

Rules without frontmatter load at startup, every session. These are for instructions Claude needs regardless of what file it’s editing:

```

# .NET Conventions
## General
- Target .NET 10 for all new code
- Use file-scoped namespaces everywhere
- Primary constructors for dependency injection
- Records for DTOs and value objects
- `async/await` with CancellationToken on every async method
## Naming
- Interfaces prefixed with `I` (IUserRepository, IEmailService)
- Async methods suffixed with `Async` (GetUserAsync, SendEmailAsync)
- Private fields prefixed with `_` (_logger, _repository)
## Error Handling
- Use Result<T> pattern, never throw for expected failures
- Global exception handler in middleware for unexpected errors
- Never expose internal exception details to API consumers
```


This loads every session because these conventions apply to every C# file in the project.

### Path-Scoped Rules (Loaded On Demand)

This is where rules get powerful. Add a YAML frontmatter block with `paths` and the rule only activates when Claude is working with matching files:

```

---
paths:
  - "src/Infrastructure/Persistence/**/*.cs"
  - "**/*DbContext*.cs"
  - "**/Migrations/**"
---
# EF Core Rules
- Always use `HasMaxLength()` on string properties - never rely on defaults
- Add an index for every foreign key column
- Use `ValueConverter` for enum-to-string mapping in the database
- Migration names must be descriptive: `AddUserEmailIndex` not `Migration_001`
- Always include a `Down()` method that reverses the migration
- Run `dotnet ef migrations script` to verify SQL before applying
```


This rule only loads when Claude is editing EF Core related files. When Claude is working on React components or API endpoints, these database rules don’t consume context. When it opens a migration file, they activate automatically.

The glob patterns support standard syntax:


|Pattern          |Matches                                    |
|-----------------|-------------------------------------------|
|**/*.ts          |All TypeScript files anywhere              |
|src/Api/**/*.cs  |C# files under src/Api/ only               |
|*.md             |Markdown files in project root only        |
|src/**/*.{ts,tsx}|Brace expansion for multiple extensions    |
|**/*DbContext*.cs|Any file containing “DbContext” in the name|


Here’s another example: API design rules that only load when editing endpoint code:

```

---
paths:
  - "src/Api/Endpoints/**/*.cs"
  - "src/Api/Controllers/**/*.cs"
---
# API Design Rules
- All endpoints return `Results<Ok<T>, NotFound, ValidationProblem>`
- Use typed results, never `IResult` directly
- Group endpoints by feature: `Endpoints/Users/`, `Endpoints/Orders/`
- Every POST/PUT endpoint has a FluentValidation validator
- Response DTOs live next to their endpoint, not in a shared folder
- Use `[ProducesResponseType]` attributes for Scalar documentation
```


### When to Split Out of CLAUDE.md

My rule of thumb: if a section in your CLAUDE.md is longer than 15-20 lines and applies to a specific concern (testing, API design, formatting), move it to a rule file. If it only applies to certain file types, add path scoping.

For .NET projects, a practical split looks like this:

```

.claude/rules/
├── dotnet-conventions.md          # No paths - always loaded
├── ef-core.md                     # paths: ["**/*DbContext*.cs", "**/Migrations/**"]
├── api-conventions.md             # paths: ["src/Api/**/*.cs"]
├── test-standards.md              # paths: ["tests/**/*.cs"]
└── docker.md                      # paths: ["**/Dockerfile*", "docker-compose*.yml"]
```


### User-Level Rules

Personal rules in `~/.claude/rules/` apply to every project. They load **before** project rules, giving project rules higher priority when there’s a conflict. This is a good place for personal coding preferences that you want everywhere.

The skills/ Folder: Where It Gets Serious
-----------------------------------------

If CLAUDE.md is the instruction manual, skills are the automation engine. Each skill is a reusable workflow that Claude can invoke with a slash command or trigger automatically based on your conversation.

I’ve written a [complete deep-dive on skills](https://codewithmukesh.com/blog/skills-claude-code/) already. Here, I’ll focus on how skills fit into the broader `.claude` folder ecosystem and give you practical examples.

### How Skills Differ from Rules

This is a critical distinction that trips people up:



* When loaded
  * Rules: At startup (or on file access for path-scoped)
  * Skills: On demand when invoked
* How invoked
  * Rules: Automatic - Claude reads them silently
  * Skills: /skill-name or auto-invoked by Claude
* Purpose
  * Rules: Passive instructions (“always do X”)
  * Skills: Active workflows (“do this sequence of steps”)
* Size
  * Rules: Short (10-50 lines)
  * Skills: Long (50-300 lines)
* Context cost
  * Rules: Always consuming context
  * Skills: Only when active


Rules tell Claude **how to behave**. Skills tell Claude **what to do**.

### SKILL.md Format

Every skill lives in its own subdirectory with a `SKILL.md` file as the entry point:

```

.claude/skills/
├── code-review/
│   └── SKILL.md       # Required entry point
├── fix-issue/
│   └── SKILL.md
└── deploy/
    ├── SKILL.md
    └── templates/
        └── release-notes.md    # Supporting file
```


Skills can bundle supporting files alongside the SKILL.md. Reference them with `@` syntax inside the skill: `@templates/release-notes.md` pulls in the template content when the skill runs.

The SKILL.md uses YAML frontmatter to configure behavior:

```

---
name: code-review
description: Review the current branch for bugs, security issues, and code
  quality. Use when the user asks to review code, check a PR, or audit changes.
allowed-tools: Read Grep Glob Bash
argument-hint: [branch-name]
---
# /code-review - Code Review
Review all changes on the current branch against main.
## Workflow
### Step 1: Get the Diff
!`git diff main...HEAD --stat`
### Step 2: Read Changed Files
Read every modified file in full. Don't just look at the diff - understand
the surrounding context.
### Step 3: Check Against Standards
Read `.claude/docs/coding-standards.md` for the team's quality bar.
### Step 4: Report
For each file, report:
- **Bugs**: Logic errors, null reference risks, race conditions
- **Security**: Injection risks, auth gaps, exposed secrets
- **Quality**: Naming, complexity, missing error handling
- **Tests**: Is the change covered? What test cases are missing?
Rate overall: APPROVE, REQUEST CHANGES, or NEEDS DISCUSSION.
```


### Frontmatter Fields Reference

Here’s the complete list of fields you can use in SKILL.md frontmatter:



* Field: name
  * What it does: Slash command name (max 64 chars)
  * Example: code-review becomes /code-review
* Field: description
  * What it does: When Claude should auto-invoke this skill
  * Example: ”Use when reviewing code for quality”
* Field: allowed-tools
  * What it does: Tools that run without permission prompts (space-separated string or YAML list)
  * Example: Read Grep Glob
* Field: model
  * What it does: Override the model for this skill
  * Example: sonnet (cheaper for simple tasks)
* Field: argument-hint
  * What it does: Autocomplete hint shown in slash menu
  * Example: [branch-name]
* Field: context
  * What it does: Set to fork to run in isolated subagent context
  * Example: fork
* Field: agent
  * What it does: Subagent type when context: fork
  * Example: Explore, Plan, or custom agent
* Field: effort
  * What it does: Effort level override
  * Example: high, low
* Field: disable-model-invocation
  * What it does: Prevent Claude from auto-invoking
  * Example: true
* Field: user-invocable
  * What it does: Hide from / menu (background knowledge only)
  * Example: false
* Field: hooks
  * What it does: Lifecycle hooks scoped to this skill
  * Example: (see hooks docs)


The `description` field is especially important. Claude reads all skill descriptions at session start and uses them to decide when to auto-invoke. If your description is vague, Claude will invoke the skill at the wrong time. If it’s specific, Claude nails it.

### Shell Injection with !backticks

The `` !`command` `` syntax runs shell commands **before** the skill content reaches Claude and injects the output. This is preprocessing, not something Claude executes:

```

## Current PR Context
- Changed files: !`git diff main...HEAD --name-only`
- Test results: !`dotnet test --no-build --verbosity quiet 2>&1 | tail -5`
- Branch: !`git branch --show-current`
```


When you invoke the skill, Claude sees the actual output of those commands, not the commands themselves. This makes skills dynamic and context-aware.

### String Substitutions


|Variable            |Description                           |
|--------------------|--------------------------------------|
|$ARGUMENTS          |All arguments passed when invoking    |
|$ARGUMENTS[0] or $0 |First argument by 0-based index       |
|${CLAUDE_SESSION_ID}|Current session ID                    |
|${CLAUDE_SKILL_DIR} |Directory containing the SKILL.md file|


A skill invoked with `/fix-issue 234` would substitute `$ARGUMENTS` with `234`.

### Building a Skill That Chains Data

Here’s a more practical example - a skill that investigates and fixes a GitHub issue:

```

---
name: fix-issue
description: Investigate and fix a GitHub issue. Use when the user mentions
  an issue number or asks to fix a bug from GitHub.
argument-hint: [issue-number]
allowed-tools: Read Edit Write Grep Glob Bash
---
# /fix-issue - Investigate and Fix a GitHub Issue
## Step 1: Understand the Issue
!`gh issue view $ARGUMENTS --json title,body,labels,comments`
## Step 2: Reproduce
Based on the issue description, identify the failing behavior.
Run the relevant test suite to see if there's already a failing test:
dotnet test --filter "Category=Integration" --verbosity normal
## Step 3: Find the Root Cause
Trace the issue through the codebase. Don't just fix the symptom -
understand why it's happening.
## Step 4: Fix and Test
1. Implement the fix with minimal changes
2. Write a test that would have caught this issue
3. Run the full test suite to check for regressions
4. Verify the fix against the original issue description
## Step 5: Summary
Report what you found, what you changed, and what test you added.
```


This skill chains together: it fetches the GitHub issue, helps reproduce it, finds the root cause, and fixes it. Each step builds on the previous one. That’s the power of skills - they’re not just prompts, they’re multi-step workflows.

### Auto-Invocation vs Manual

Skills can be invoked two ways:



* How: Manual
  * What happens: You type /fix-issue 234
* How: Auto-invoked
  * What happens: You say “can you look at issue 234 on GitHub?” and Claude reads the skill descriptions, matches your intent, and invokes /fix-issue automatically


You can control this behavior:


|Frontmatter                   |User invokes|Claude invokes|When to use                        |
|------------------------------|------------|--------------|-----------------------------------|
|(default)                     |Yes         |Yes           |Most skills                        |
|disable-model-invocation: true|Yes         |No            |Destructive or expensive operations|
|user-invocable: false         |No          |Yes           |Background knowledge skills        |


I use `disable-model-invocation: true` for deploy skills and anything that modifies production resources. I want to be deliberate about invoking those.

### Skill Context Budget

Skill descriptions consume about **1% of the context window** (with a fallback of **8,000 characters**), and each individual description is capped at **250 characters** in the listing regardless of budget. If you have many skills with long descriptions, descriptions are shortened to fit, which can strip the keywords Claude needs to match your request. Run `/context` to check. Front-load the key use case in the first 250 characters, and set `disable-model-invocation: true` on rarely-used skills to remove them from Claude’s context entirely. To raise the budget, set the `SLASH_COMMAND_TOOL_CHAR_BUDGET` environment variable.

### Where Skills Live


|Location                         |Shows as|Priority              |
|---------------------------------|--------|----------------------|
|.claude/skills/deploy/SKILL.md   |/deploy |Project-level         |
|~/.claude/skills/standup/SKILL.md|/standup|Personal, all projects|


Personal skills in `~/.claude/skills/` are available across all your projects. Good candidates: a commit message generator following your convention, a daily standup helper, or a quick security scan.

The commands/ Folder: The Predecessor to Skills
-----------------------------------------------

Before skills existed, the `commands/` folder was the way to create custom slash commands. Every markdown file you drop into `.claude/commands/` becomes a command.

A file named `review.md` creates `/project:review`. A file named `fix-issue.md` creates `/project:fix-issue`. The filename is the command name.

Here’s a simple example:

```

---
description: Quick health check of the project
---
## Build Status
!`dotnet build --verbosity quiet 2>&1 | tail -3`
## Test Results
!`dotnet test --no-build --verbosity quiet 2>&1 | tail -5`
## Pending Migrations
!`dotnet ef migrations list --no-build 2>&1 | grep "(Pending)"`
Summarize the project health: build status, test results, and any
pending migrations that need to be applied.
```


### Commands vs Skills: The Reality

**Commands have been merged into the skills system.** A file at `.claude/commands/deploy.md` and a skill at `.claude/skills/deploy/SKILL.md` both create a `/deploy` command and work the same way. Existing command files keep working, but if a skill and a command share the same name, the **skill takes precedence**.

Here’s what I’ve learned after using both:


|Use a Command when…                |Use a Skill when…                            |
|-----------------------------------|---------------------------------------------|
|It’s a single-file prompt          |It needs supporting files alongside it       |
|You always invoke it manually      |Claude should auto-invoke it based on context|
|It’s simple (< 50 lines)           |It’s a multi-step workflow (50-300 lines)    |
|No special tool restrictions needed|You want to limit which tools are available  |


If you’re starting fresh, **just use skills**. They’re strictly more capable. Commands are simpler to create (single file, no directory needed), but that’s about the only advantage.

### Personal vs Project Commands


|Location                     |Shows as       |Shared? |
|-----------------------------|---------------|--------|
|.claude/commands/review.md   |/project:review|Via git |
|~/.claude/commands/standup.md|/user:standup  |Just you|


The agents/ Folder: Specialized Subagent Personas
-------------------------------------------------

When a task is complex enough to benefit from a dedicated specialist, you define a subagent persona in `.claude/agents/`. Each agent is a markdown file with its own system prompt, tool access, and model preference.

```

.claude/agents/
├── code-reviewer.md
├── security-auditor.md
└── documentation-writer.md
```


Here’s what a real agent file looks like:

```

---
name: security-auditor
description: Security specialist. Use PROACTIVELY when reviewing code for
  vulnerabilities, before deployments, or when touching auth/payment logic.
tools: Read, Glob, Grep
model: sonnet
maxTurns: 50
---
You are a senior application security engineer specializing in .NET.
When auditing code:
- Check for SQL injection, even with EF Core (raw SQL queries, FromSqlRaw)
- Verify auth attributes on every endpoint
- Look for secrets in code, config, or comments
- Check CORS configuration for overly permissive origins
- Verify input validation on all user-facing endpoints
- Check for mass assignment vulnerabilities (DTOs vs entities)
- Review JWT configuration (expiry, signing algorithm, issuer validation)
Rate each finding: CRITICAL, HIGH, MEDIUM, LOW.
Suggest specific fixes with code examples.
```


### How Agents Work

When Claude delegates to an agent, it spawns a **separate context window**. The agent does its work - reading files, running searches, analyzing code - and then compresses its findings into a summary that gets sent back to your main session. Your main conversation doesn’t get cluttered with hundreds of lines of intermediate exploration.

Think of it like delegating to a colleague. You say “review this PR for security issues” and they come back with a report. You don’t see every file they opened or every grep they ran.

### All Agent Frontmatter Fields



* Field: name
  * Purpose: Identifier (required)
  * Example: security-auditor
* Field: description
  * Purpose: When to delegate to this agent (required)
  * Example: “Use when reviewing for security”
* Field: tools
  * Purpose: What the agent can do (inherits all if omitted)
  * Example: Read, Glob, Grep (read-only)
* Field: disallowedTools
  * Purpose: Denylist for tools
  * Example: Bash, Write
* Field: model
  * Purpose: Which model to use
  * Example: sonnet (cheaper), haiku (fastest), inherit
* Field: maxTurns
  * Purpose: Maximum agentic iterations
  * Example: 50
* Field: permissionMode
  * Purpose: Permission level
  * Example: default, acceptEdits, plan
* Field: isolation
  * Purpose: Run in git worktree
  * Example: worktree
* Field: memory
  * Purpose: Persistent memory scope
  * Example: user, project, local
* Field: background
  * Purpose: Always run as background task
  * Example: true
* Field: skills
  * Purpose: Skills to preload into agent context
  * Example: ["api-conventions"]
* Field: mcpServers
  * Purpose: MCP servers available to agent
  * Example: (inline or reference)
* Field: hooks
  * Purpose: Lifecycle hooks scoped to this agent
  * Example: (see hooks docs)


### Tool Restrictions Are Intentional

A security auditor only needs `Read`, `Grep`, and `Glob`. It has no business writing files. A documentation writer needs `Read`, `Write`, and `Edit` but doesn’t need `Bash`. Being explicit about tool access is a safety feature, not just configuration.

### Model Selection Saves Money

The `model` field lets you use cheaper, faster models for focused tasks. A code reviewer that only reads and analyzes can run on Sonnet or Haiku. Save Opus for the tasks that actually need complex reasoning. I’ve found that Haiku handles most read-only exploration surprisingly well.

### Agents vs Skills

This is a common point of confusion:



* Context
  * Skills: Runs in your main conversation (unless context: fork)
  * Agents: Always runs in separate context
* Identity
  * Skills: Claude with specific instructions
  * Agents: A separate persona with its own system prompt
* Tools
  * Skills: Can restrict tools via allowed-tools
  * Agents: Can restrict tools via tools
* Persistence
  * Skills: No persistent state
  * Agents: Can have persistent memory across sessions
* Nesting
  * Skills: Can spawn agents
  * Agents: Agents cannot spawn other agents
* When to use
  * Skills: Repeatable workflows
  * Agents: Specialized expertise that benefits from isolation


My rule of thumb: if you need Claude to **do a specific task** (run a code review, deploy, fix a bug), use a skill. If you need Claude to **become a specialist** (a security auditor with its own perspective, a code reviewer with persistent memory of your codebase) that benefits from isolation and focused tool restrictions, use an agent.

This is a pattern that’s become essential for any non-trivial `.claude` setup. The `.claude/docs/` directory holds reference documents that skills read on demand. It’s not an officially documented Claude Code directory. It’s just a folder of markdown files. But the pattern is powerful.

Here’s what a typical docs folder might look like for a .NET project:

```

.claude/docs/
├── architecture.md       # System architecture, module boundaries
├── coding-standards.md   # C# style guide, naming conventions
├── deployment.md         # Deploy process, environments, rollback
├── testing-strategy.md   # What to test, how to test, coverage targets
└── api-guidelines.md     # REST conventions, versioning, pagination
```


### Why Not Put This in Rules?

Rules load automatically. That’s the problem. If I put a 200-line architecture document into a rule file, it would consume context in **every** session, even when I’m fixing a CSS bug in the frontend and the architecture doc is irrelevant.

Docs stay dormant until a skill explicitly reads them. A `/code-review` skill reads `coding-standards.md` to check against team conventions. A `/deploy` skill reads `deployment.md` to follow the deployment checklist. Each skill only loads the docs it needs.

### The DRY Principle for Prompt Engineering

This is the real insight. Without a docs folder, every skill that needs coding standards would have its own copy of “use file-scoped namespaces, prefix interfaces with I, async methods end with Async.” When you update a convention, you’d have to update it in every skill that references it.

With docs, the coding standard lives in one place. Skills reference it:

```

### Step 3: Check Against Standards
Read `.claude/docs/coding-standards.md` for the team's quality bar.
```


One source of truth, referenced by many skills. The same principle that makes good code also makes good Claude configuration.

### What Belongs in Docs vs Rules vs CLAUDE.md



* Put it in…: CLAUDE.md
  * When…: Claude needs it in every session, it’s short (< 20 lines per section)
* Put it in…: rules/
  * When…: Claude needs it in every session (or path-scoped sessions), it’s focused on one concern
* Put it in…: docs/
  * When…: Only specific skills need it, it’s detailed reference material (> 50 lines)
* Put it in…: skills/
  * When…: It’s a reusable workflow with steps


settings.json: Permissions and Guardrails
-----------------------------------------

The `settings.json` file inside `.claude/` controls what Claude is and isn’t allowed to do. It’s where you define tool permissions, hook configurations, and project-level settings.

### The Permission Model

Claude Code has three permission levels:


|Level|Effect                  |Configured in             |
|-----|------------------------|--------------------------|
|Allow|Runs without asking     |permissions.allow         |
|Ask  |Prompts you for approval|Default for unlisted tools|
|Deny |Blocked entirely        |permissions.deny          |


If a command isn’t in either `allow` or `deny`, Claude asks before proceeding. This middle ground is intentional. You don’t need to anticipate every possible command upfront.

Here’s a practical `settings.json` for a .NET project:

```

{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(dotnet build *)",
      "Bash(dotnet test *)",
      "Bash(dotnet run *)",
      "Bash(dotnet format *)",
      "Bash(dotnet ef *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git branch *)",
      "Read",
      "Write",
      "Edit",
      "Glob",
      "Grep"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(curl *)",
      "Bash(wget *)",
      "Bash(git push *)",
      "Bash(git reset --hard *)",
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(**/*secret*)",
      "Read(**/appsettings.Production.json)"
    ]
  }
}
```


The `$schema` line enables autocomplete and inline validation in VS Code or Cursor. Always include it.

### Permission Rule Syntax

The pattern matching is flexible:


|Rule                       |Matches                           |
|---------------------------|----------------------------------|
|Bash                       |All Bash commands                 |
|Bash(dotnet test *)        |Commands starting with dotnet test|
|Bash(npm run *)            |Commands starting with npm run    |
|Read(./.env)               |Reading the .env file             |
|WebFetch(domain:github.com)|Fetch requests to github.com      |
|Agent(Explore)             |Spawning the Explore subagent     |
|Skill(deploy *)            |Specific skill invocations        |


Rules evaluate in this order: **deny first, then ask, then allow**. This means a deny rule always wins, even if there’s a matching allow rule.

> **PRO TIP**: Start with a minimal `settings.json` and let Claude prompt you. When you find yourself clicking “allow” for the same command repeatedly, add it to the allow list. This is safer than guessing what to allow upfront.

### settings.local.json: Personal Overrides

Create `.claude/settings.local.json` for permission changes you don’t want committed to git. Claude Code **automatically configures git to ignore** this file when it’s created.

Use cases: API keys in env vars, domain-specific `WebFetch` permissions, machine-specific paths. The team’s `settings.json` stays clean with just the essentials.

### Beyond Permissions

`settings.json` handles more than permissions. Some useful fields:

```

{
  "env": {
    "ASPNETCORE_ENVIRONMENT": "Development"
  },
  "model": "claude-opus-4-6",
  "effortLevel": "high",
  "autoMemoryEnabled": true,
  "includeGitInstructions": true,
  "claudeMdExcludes": [
    "**/node_modules/**/CLAUDE.md"
  ]
}
```



|Field            |Purpose                                        |
|-----------------|-----------------------------------------------|
|env              |Set environment variables for every session    |
|model            |Override the default model                     |
|effortLevel      |Persist effort level (low, medium, high)       |
|autoMemoryEnabled|Toggle auto-memory (default: true)             |
|claudeMdExcludes |Skip irrelevant CLAUDE.md files in monorepos   |
|statusLine       |Custom status line configuration               |
|sandbox          |Filesystem and network sandboxing              |
|worktree         |Worktree configuration (symlinks, sparse paths)|
|attribution      |Customize git commit/PR attribution            |


For monorepos, `claudeMdExcludes` is particularly useful. You can skip CLAUDE.md files from other teams’ directories that aren’t relevant to your work.

The Global ~/.claude/ Folder
----------------------------

You don’t interact with this folder often, but knowing what’s inside it helps you understand how Claude “remembers” things across sessions.

### What Lives Here


|Path                                |Purpose                                    |
|------------------------------------|-------------------------------------------|
|~/.claude/CLAUDE.md                 |Your personal instructions for all projects|
|~/.claude/settings.json             |Your global permission settings            |
|~/.claude/rules/                    |Personal rules loaded in every project     |
|~/.claude/skills/                   |Personal skills available everywhere       |
|~/.claude/agents/                   |Personal agents available everywhere       |
|~/.claude/projects/<project>/memory/|Per-project auto-memory                    |


### The Auto-Memory System

This is one of the least understood features. Claude Code automatically saves notes to itself as it works: commands it discovers, patterns it observes, architectural insights. These persist across sessions in `~/.claude/projects/<project>/memory/`.

The `<project>` directory is derived from your git repo, so all worktrees and subdirectories of the same repository share one auto-memory directory.

The directory contains:

*   `MEMORY.md` - an index file (**first 200 lines or 25KB, whichever comes first**, loaded at every session start; content beyond that is not loaded at startup)
*   Topic-specific memory files (e.g., `feedback_testing.md`, `user_preferences.md`)

You can browse and manage memory with the `/memory` command. You can also tell Claude to remember things explicitly: “remember that I prefer integration tests over mocks” and it saves a memory file.

The key thing to know: auto-memory is **machine-local**. It doesn’t sync across machines and it’s not shared with your team. It’s Claude’s personal notebook about your project. Toggle it with the `autoMemoryEnabled` setting or `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` env var.

### Global CLAUDE.md

Your `~/.claude/CLAUDE.md` loads into every Claude Code session. This is the place for preferences that apply regardless of project:

```

# Personal Preferences
- I prefer concise explanations - skip the obvious
- Always show the full file path in code references
- When suggesting refactors, explain the trade-off, not just the benefit
- I work on Windows with WSL - use Unix commands in Bash
- When writing C#, prefer primary constructors and file-scoped namespaces
```


User-level rules in `~/.claude/rules/` load **before** project rules, giving project rules higher priority when there’s a conflict.

The worktrees/ Folder
---------------------

This folder exists for Claude Code’s [git worktree integration](https://codewithmukesh.com/blog/git-worktrees-claude-code/). When you or an agent runs with `isolation: worktree`, Claude creates a temporary copy of your repository in a separate git worktree. This lets agents work on isolated branches without affecting your main working directory.

The `worktrees/` directory itself is usually empty. Claude creates worktrees as needed and cleans them up when the agent finishes (if no changes were made). If changes were made, the worktree sticks around with its branch so you can review and merge.

This is especially useful for agents. A code reviewer running in a worktree can checkout the PR branch, run tests, and analyze changes without disrupting your current work.

My Take: The Progression Path
-----------------------------

Here’s the setup progression I recommend. Don’t try to build everything at once. Start small and add layers as you hit real friction.

### Stage 1: The Basics (Day 1)

Create a `CLAUDE.md` with your build commands, architecture overview, and top 5 conventions. This alone makes Claude dramatically more useful.

```

your-project/
├── CLAUDE.md              # 30-50 lines
└── .claude/
    └── settings.json      # Basic allow/deny rules
```


### Stage 2: Modular Rules (Week 2-3)

When your CLAUDE.md gets crowded, split it. Add path-scoped rules for different parts of your codebase.

```

your-project/
├── CLAUDE.md              # Trimmed to essentials
└── .claude/
    ├── settings.json
    └── rules/
        ├── dotnet.md      # .NET conventions
        ├── ef-core.md     # EF Core rules (path-scoped)
        └── testing.md     # Test standards (path-scoped)
```


### Stage 3: First Skills (Month 2)

When you catch yourself copy-pasting the same prompt more than twice, turn it into a skill. Start with your most repeated workflows: code review, issue fixing, deployment.

```

your-project/
├── CLAUDE.md
└── .claude/
    ├── settings.json
    ├── rules/
    └── skills/
        ├── code-review/
        │   └── SKILL.md
        └── fix-issue/
            └── SKILL.md
```


### Stage 4: The Full System (Month 3+)

Add agents for specialized tasks, docs for shared reference material, and hooks for deterministic automation.

```

your-project/
├── CLAUDE.md
└── .claude/
    ├── settings.json
    ├── rules/           # 3-5 rule files
    ├── skills/          # 5-15 skills
    ├── agents/          # 2-3 specialized agents
    └── docs/            # Reference docs shared across skills
```


### Decision Matrix: Which Files to Create


|Your situation                                             |Create this                      |
|-----------------------------------------------------------|---------------------------------|
|Just started with Claude Code                              |CLAUDE.md + settings.json        |
|CLAUDE.md is over 200 lines                                |Split into .claude/rules/ files  |
|Different rules for different file types                   |Add paths: frontmatter to rules  |
|Copy-pasting the same prompt repeatedly                    |Create a skill                   |
|Need a specialist perspective (security audit, code review)|Create an agent                  |
|Multiple skills reference the same info                    |Move it to .claude/docs/         |
|Clicking “allow” on the same command repeatedly            |Add it to settings.json          |
|Personal preferences you don’t want to commit              |settings.local.json or ~/.claude/|


Each stage builds on the previous one. Every layer should solve a real friction point you’ve actually experienced, not a hypothetical one.

Key Takeaways
-------------

*   The `.claude` folder is the control center for Claude’s behavior in your project. It has a **project-level** instance (committed, shared) and a **global** instance (`~/.claude/`, personal).
*   **CLAUDE.md** is the highest-leverage file. Keep it under 200 lines, focus on architecture and conventions, and know that it survives compaction.
*   **Rules** provide modular, path-scoped instructions. Use them when CLAUDE.md gets crowded or when different file types need different rules.
*   **Skills** are reusable workflows that replace and supersede commands. They support auto-invocation, tool restrictions, model overrides, arguments, and shell injection.
*   **Agents** are specialized personas that run in separate context windows with their own tools and model preferences. Use them when you need isolation and specialist expertise.
*   **Start with CLAUDE.md and settings.json.** Add rules when instructions grow. Add skills when you catch yourself repeating prompts. Add agents when you need specialist perspectives. Every layer should solve a real friction point, not a hypothetical one.

What is the .claude folder in Claude Code?

The .claude folder is a configuration directory in your project root that controls how Claude Code behaves. It contains rules (modular instructions), skills (reusable workflows), agents (specialized subagent personas), settings.json (permissions and config), and optionally docs (shared reference material). There is also a global ~/.claude/ folder for personal settings that apply across all projects.

What is the difference between CLAUDE.md and .claude/rules/ files?

CLAUDE.md is a single instruction file loaded at every session start. Rules files in .claude/rules/ let you split instructions by concern (testing, API conventions, formatting) and optionally scope them to specific file paths using frontmatter. Rules without path scoping load alongside CLAUDE.md. Path-scoped rules load only when Claude works with matching files, saving context.

How do Claude Code skills differ from commands?

Commands are single markdown files that create slash commands. Skills are directories with a SKILL.md entry point plus optional supporting files. Skills support auto-invocation (Claude triggers them based on context), tool restrictions, model overrides, and bundled assets. Commands have been merged into the skills system. Existing command files still work, but skills are strictly more capable and take precedence when names conflict.

What is the loading order for .claude configuration files?

Claude Code loads configuration in this priority order (highest to lowest): managed policy settings, command line arguments, local overrides (settings.local.json), project settings (settings.json), user settings (~/.claude/settings.json). For CLAUDE.md, it walks up the directory tree loading every CLAUDE.md it finds, with project-level files taking precedence over user-level files.

How do I set permissions in Claude Code settings.json?

Add a permissions object with allow and deny arrays. Allow rules run without prompting (e.g., Bash(dotnet build \*)). Deny rules block entirely (e.g., Read(./.env)). Anything not in either list prompts for approval. Rules evaluate deny first, then ask, then allow. Use wildcard patterns like Bash(npm run \*) to match multiple commands.

What is the .claude/agents/ folder for?

The agents folder holds specialized subagent personas as markdown files. Each agent has its own system prompt, tool restrictions, and model preference. When Claude delegates to an agent, it spawns a separate context window, does its work, and reports back a compressed summary. Use agents for specialized expertise like code review or security auditing that benefits from isolation. Agents cannot spawn other agents.

How does Claude Code auto-memory work?

Claude Code automatically saves observations about your project in ~/.claude/projects/project-name/memory/. The MEMORY.md index (first 200 lines or 25KB, whichever comes first) loads at every session start. Memory is machine-local and not shared across machines. You can manage it with the /memory command or tell Claude to remember things explicitly. Toggle with the autoMemoryEnabled setting or the CLAUDE\_CODE\_DISABLE\_AUTO\_MEMORY environment variable.

Should I commit the .claude folder to git?

Yes, commit .claude/settings.json, .claude/rules/, .claude/skills/, .claude/agents/, .claude/docs/, and CLAUDE.md. These are team configuration. Do NOT commit settings.local.json (auto-gitignored) or any files containing API keys or personal preferences. Personal overrides go in ~/.claude/ or settings.local.json.

Troubleshooting
---------------

### Claude Ignores My Rules File

Check that the file is in `.claude/rules/` (not `.claude/rule/` or another directory). If it has `paths:` frontmatter, verify the glob pattern matches the files you’re editing. Rules with path scoping only load when Claude accesses matching files. Also verify the file has a `.md` extension.

### Skill Doesn’t Show Up in Slash Command Menu

The skill needs a `SKILL.md` file (case matters on Linux/macOS) inside a named subdirectory of `.claude/skills/`. Check that the directory name uses only lowercase letters, numbers, and hyphens (max 64 characters). Run `/context` to check if the skill was excluded due to context budget limits.

### Claude Auto-Invokes the Wrong Skill

Your skill descriptions are too similar or too vague. Make each description specific about **when** to invoke. Instead of “helps with testing” write “run the full test suite and report failures with stack traces. Use when the user asks to run tests or check for regressions.”

### Permission Prompts Keep Appearing for the Same Command

Add the exact command pattern to `permissions.allow` in your `settings.json`. Use wildcards: `Bash(dotnet test *)` covers `dotnet test`, `dotnet test --filter MyTest`, etc. Remember that `settings.local.json` overrides are gitignored, so use that for machine-specific permissions.

### CLAUDE.md Changes Don’t Take Effect

Claude reads CLAUDE.md at session start and after compaction. Mid-session changes won’t be picked up until you start a new session or run `/compact`. If you’re editing CLAUDE.md iteratively, start a fresh session to test changes.

### Context Budget Exceeded - Skills Disappearing

Skill descriptions consume about 1% of the context window with an 8,000 character fallback, and each individual description is capped at 250 characters in the listing. If you have many skills, descriptions get shortened to fit, which can strip the keywords Claude uses to match your request. Run `/context` to check. Front-load the key use case in the first 250 characters, set `disable-model-invocation: true` on rarely-used skills, or raise the limit with the `SLASH_COMMAND_TOOL_CHAR_BUDGET` environment variable.

Summary
-------

The `.claude` folder is really a protocol for telling Claude who you are, what your project does, and what rules it should follow. The more clearly you define that, the less time you spend correcting Claude and the more time it spends doing useful work.

CLAUDE.md is your highest-leverage file. Get that right first. Everything else - rules, skills, agents, docs, settings - is optimization layered on top of a solid foundation. Start small, refine as you go, and treat it like any other piece of infrastructure in your project: something that pays dividends every day once it’s set up properly.

Happy Coding :)
