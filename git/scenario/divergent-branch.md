# Divergent branches on `git pull`

```text
hint: You have divergent branches and need to specify how to reconcile them.
fatal: Need to specify how to reconcile divergent branches.
```

Your local branch has commits the remote does not, and the remote has commits your local branch does not. A fast-forward is impossible, and modern Git refuses to guess between merge and rebase.

A divergent branch happens when:

- you made new commits on your local branch (e.g. `main`), and
- someone else pushed new commits to the same remote branch (e.g. `origin/main`).

## Strategies

Pick one per pull, or set a default with `git config` (add `--global` for all repositories).

### 1. Merge

Combines both histories with a new merge commit (two parents: your local tip and the remote tip).

- One pull: `git pull --no-rebase`
- Default: `git config pull.rebase false`
- Pros: preserves exact history of both lines.
- Cons: extra merge commits clutter the log.

### 2. Rebase

Replays your local commits on top of the fetched remote commits.

- One pull: `git pull --rebase`
- Default: `git config pull.rebase true`
- Pros: clean, linear history.
- Cons: rewrites your local commits (new hashes). Do not rebase commits others already pulled.

### 3. Fast-forward only

Only pulls when no divergence exists; otherwise fails so you decide explicitly.

- One pull: `git pull --ff-only`
- Default: `git config pull.ff only`
- Pros: never creates surprise merges or rewrites.
- Cons: divergence needs a manual `git merge` or `git rebase`.

## Fix it now

```bash
git pull origin <branch_name> --no-rebase   # merge
git pull origin <branch_name> --rebase      # rebase
```
