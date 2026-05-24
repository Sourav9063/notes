---
name: review-merge-request
description: Review current branch against base branch for security, correctness, architecture fit, maintainability, and verification risks.
argument-hint: "<base-branch>"
disable-model-invocation: true
user-invocable: true
---

# Review Merge Request

Use only when explicitly invoked with base branch name. If missing, ask. Use direct two-ref diff only:

```bash
git diff <base> HEAD
```

Do not use merge-base form (`<base>...HEAD`) unless requested.

## Workflow

1. Inspect minimal context:
   - `git status --short`
   - `git branch --show-current`
   - `git diff --stat <base> HEAD`
   - `git diff --name-only <base> HEAD`

2. Read `git diff <base> HEAD` first. Open only files/hunks needed to confirm risk. Use `git show <base>:path`, nearby files, or docs only when old behavior, shared contracts, or ownership are unclear.

3. Prioritize risky areas:
   - Auth, permissions, sessions, cookies, env, config, redirects, secret handling.
   - API boundaries, validation, persistence, SQL, transactions, DB writes.
   - Cache invalidation, navigation/routing, error handling, logging, shared state.
   - Data shapes, null handling, URL params, pagination, filters.
   - File/network access, uploads/downloads, external calls, dependencies.
   - Tooling, docs, migrations, generated output that can break commands or mislead.

4. Verify narrowly:
   - Run lint/check command unless docs-only or user says skip.
   - Run build/typecheck command when runtime or typed surface changed.
   - Run focused tests for changed risky logic.

## Review Checklist

- Security: auth bypass, permission regression, IDOR, CSRF/XSS/SSRF, secret leakage, unsafe redirects, insecure cookies/sessions, injection risk, path traversal, unsafe file upload/download.
- Correctness: wrong data shape, unchecked null/undefined, stale cache, broken pagination/filter/search params, contract mismatch, hidden runtime assumptions, race conditions, non-idempotent retries.
- Architecture: separation of concerns, logic in appropriate layer, clear module ownership, contained side effects, respected public contracts.
- Maintainability: duplication that can drift, unexplained magic values, speculative abstraction, dead code, unclear naming, inconsistent local patterns, needless public API expansion.
- Data safety: missing transaction/rollback safety, unsafe migration/backfill, backward-incompatible schema or API change, data loss/corruption risk.
- Reliability: resource leaks, unbounded work, timeout/retry mistakes, missing cancellation/cleanup, noisy or sensitive logs.
- Type quality: unsafe types/casts, ignored async failures, swallowed exceptions, missing validation or narrowing for external input.
- Dependencies: vulnerable package, unexpected license/runtime requirement, supply-chain risk, generated lockfile/tooling drift.
- Tests/CI: missing focused coverage for risky logic, lint/build/type failures, docs/tooling that mislead users or break commands.

## Finding Rules

- Lead with findings, ordered by severity.
- Each finding needs severity, file:line, concrete failure mode, and fix direction.
- Report style issues only when they create behavior or maintenance risk.
- If no issues, say no blocking findings and state verification coverage/residual risk.
- Mention uncertain assumptions separately, not as facts.

Severity:
- Blocking: build/lint/CI break, security issue, data loss, auth bypass, major runtime failure.
- High: likely user-facing regression, permission/cache/data correctness issue.
- Medium: edge-case bug or maintainability risk likely to cause defects.
- Low: small quality/test gap with limited blast radius.

## Output

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
- Residual risks/assumptions
```

Keep answer concise. No praise. No generic checklist dump.
