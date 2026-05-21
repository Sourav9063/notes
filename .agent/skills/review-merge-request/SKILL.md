---
name: review-merge-request
description: Review current branch against base branch for security, correctness, architecture fit, maintainability, and verification risks.
argument-hint: "<base-branch>"
disable-model-invocation: true
user-invocable: true
---

# Review Merge Request

Use only when explicitly invoked with base branch name. Review current branch against that base branch with direct two-ref diff:

```bash
git diff <base> HEAD
```

If user does not provide base branch name, ask for it before reviewing.
Do not use merge-base form (`<base>...HEAD`) unless user asks.

## Goal

Find actionable risks. Lead with evidence-backed findings, not summaries.

## Workflow

1. Inspect context:
   - `git status --short`
   - `git branch --show-current`
   - `git diff --name-only <base> HEAD`

2. Read high-risk changes first:
   - Auth, permission, session, cookie, env, config.
   - API boundaries, services, persistence, DB writes.
   - Cache, navigation, error handling, shared hooks/providers.
   - UI, docs, and tooling.

3. Compare against project patterns:
   - Read nearby files and old versions with `git show <base>:path` when needed.
   - Check local agent docs, feature docs, architecture boundaries, shared helpers, cache/data rules, and UI conventions.

4. Verify narrowly:
   - Run project lint/check command unless docs-only or user says skip.
   - Run project build/typecheck command when runtime or typed surface changed.
   - Run focused tests when relevant.

## Review Checklist

- Security: auth bypass, permission regression, secret leakage, unsafe redirects, input trust, SQL injection, missing transactions.
- Correctness: wrong data shape, unchecked null/undefined, stale cache, broken pagination/filter/search params, boundary mistakes.
- Architecture: separation of concerns, logic in correct layer, clear module ownership, side effects isolated, public contracts respected.
- Maintainability: duplicated logic violates DRY, magic values lack named constants, speculative abstraction, dead code, unclear naming, inconsistent local patterns.
- Type quality: avoid unsafe types/casts, ignored errors, missing validation for external input.
- Tests/CI: missing focused tests for risky logic, lint/build/type failures, docs/tooling that mislead or break commands.

## Finding Rules

- Lead with findings, ordered by severity.
- Each finding needs severity, file:line, failure mode, and fix direction.
- Report style issues only when they create behavior or maintenance risk.
- If no issues, say no blocking findings and state verification coverage/residual risk.
- Mention uncertain assumptions separately, not as facts.

Severity:
- Blocking: build/lint/CI break, security issue, data loss, auth bypass, major runtime failure.
- High: likely user-facing regression, permission/cache/data correctness issue.
- Medium: edge-case bug or maintainability risk likely to cause defects.
- Low: small quality/test gap with limited blast radius.

## Output Format

Use this shape:

```md
**Findings**

- **Blocking:** path:line - concise problem.
  Impact: concrete failure mode.
  Fix: direct remediation.

**Verification**

- Lint/check: pass/fail/blocked/skipped with reason
- Build/typecheck: pass/fail/blocked/skipped with reason

**Notes**

- Diff used: `<base> HEAD`
- Residual risks or assumptions.
```

Keep answer concise. No praise. No generic checklist dump.
