## Spec-Driven Development

Use SDD for non-trivial work. First read relevant files in `agents/knowledge/`, `agents/plans/`, and `agents/MEMORY.md`.

Code, tests, schemas, configuration, and executable artifacts define implemented behavior. Documentation records decisions, constraints, and context the code cannot express clearly. Report conflicts immediately.

### Knowledge

`agents/knowledge/` stores concise, topic-scoped, code-verified:

* Architectural decisions and rejected alternatives
* Domain terms and glossaries
* Invariants
* Navigation guidance

Create or update the most discoverable file when requested or when verified work produces reusable knowledge.

### Plans

`agents/plans/` stores active and finalized implementation plans.

Before creating a plan:

1. Investigate the code.
2. Decide minor implementation details.
3. Present options for unresolved choices affecting scope, behavior, or architecture.
4. Once blocking choices are resolved, create a precisely named `.md` plan.
5. Keep it current through implementation and refinement.

Implement and verify against code, tests, schemas, and configuration.

### Memory

Before non-trivial work, read `agents/MEMORY.md`.

Treat it as curated repository-wide guidance, subordinate to this file and narrower contracts.

After verified work or a confirmed repository-wide decision, update it without prompting when the result is durable and reusable. Store only concise, verified, cross-task lessons: corrections, repository-wide decisions, and reusable preferences.

Update stale or conflicting entries. Never store task details, temporary context, guesses, implementation-specific knowledge, or secrets.

## Engineering Principles

Priority:

1. Correctness and security
2. Explicit task and specification requirements
3. Local consistency
4. Simplicity
5. Brevity

Write clear, cohesive, testable code with descriptive names, reasonable module boundaries, explicit interfaces, and separable implementations. Fix confusing code instead of documenting around it.

Before coding:

* Inspect relevant code.
* State material assumptions, tradeoffs, and uncertainty.
* For ambiguity, present plausible interpretations without choosing silently. Ask only decision-blocking questions, preferably one concise question with selectable options.
* Challenge weak libraries, patterns, or instructions with concrete flaws and a better alternative.

During implementation:

* Prefer the simplest proven local pattern.
* Handle realistic failures.
* Understand code before removing it.
* Preserve behavior and interfaces unless the task or approved plan changes them.
* Avoid speculative features, single-use abstractions, excess configuration, and documentation that restates code.
* Apply YAGNI. Use one-liners only when clearer.
* Remove smells within the edit surface: duplicated knowledge, misleading names, deep nesting, hidden side effects, and needless complexity.
* Use DRY, SOLID, and design patterns only when they improve clarity, responsibility, dependency structure, or testability.
* Encode behavior in tests, types, schemas, assertions, and validation where practical.

Scope:

* Keep edits surgical. Every changed line must support the request.
* Match local style.
* When no code change is needed, report evidence.
* Remove only artifacts made unused by your changes.
* Mention unrelated issues without fixing them unless asked.

Execution:

* For multi-step work, give a brief plan and explicit success checks.
* Run the narrowest relevant verification first; broaden as risk warrants.
* Continue the verify-fix loop until complete or truly blocked.
* Optimize for correctness, reviewability, minimal change, reuse, clear behavior, strong verification, developer experience, and low unnecessary work.

## Communication

Be terse. Remove filler, pleasantries, repetition, and hedging while preserving exact technical substance.

Prefer short fragments and `[thing] [action] [reason] [next step]`.

Avoid invented abbreviations, causal arrows, decorative tables, emoji, and long logs unless requested.

Use full prose when needed for safety, sequence, or clarity. Otherwise favor concision over grammar until normal mode is requested.

Keep code, commits, and pull requests conventional.
