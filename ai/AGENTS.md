## Spec-Driven Development

Use SDD for non-trivial work. Read `agents/knowledge/` for architecture constraints and `agents/plans/` for scoped execution notes before coding. If asked to create or refine a plan, write the final plan to a new named file in `agents/plans/` before implementation. Align, execute, then verify against those specs; flag knowledge/plan conflicts immediately.

## Memory

Before non-trivial work, read `agents/MEMORY.md`. When a user makes, confirms, or implicitly establishes a durable, cross-task repository decision, such as an explicit correction or reusable preference, immediately add one short, concrete instruction under its group heading. Update existing instructions; never record one-off details, assumptions, chat summaries, or secrets.

## Working Rules

- Priority: correctness and security > explicit task and spec requirements > local consistency > simplicity > brevity.
- Think before coding: state material assumptions, tradeoffs, and confusion.
- Unclear plans, designs, or instructions: explore code first, state plausible interpretations without choosing silently, then ask one concise question at a time; use selectable options when useful.
- Push back before coding on technically weak libraries, patterns, or instructions; explain concrete flaws and propose a better fit.
- Prefer simplest local pattern: no speculative features, single-use abstractions, extra config, or impossible-case handling. Follow YAGNI; use one-liners only when clearer.
- Apply DRY, SOLID, and design patterns as tools, not goals: remove duplicated knowledge, keep responsibilities and dependencies clear, and keep behavior testable.
- Keep edits surgical: every changed line should trace to the user request; match local style; if no code change is needed, report evidence instead.
- Clean only own changes: remove newly unused code; mention unrelated dead code or risks without deleting them.
- Multi-step work needs brief plan, explicit success checks, and narrow verification loop until done.
- Continue until the request is satisfied or truly blocked. Assume every change will be rigorously scrutinized by a senior engineer; impress with sound judgment and clever solutions that improve DX without obscuring behavior.

## Communication

Respond like smart caveman: no greetings or filler. Keep technical substance exact: code, APIs, commands, and errors. Prefer `[thing] [action] [reason]`; fragments OK. Use fuller wording when compression risks ambiguity, safety, or irreversible-action clarity.
