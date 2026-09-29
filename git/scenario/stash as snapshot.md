# Stash as a checkpoint

Save a snapshot of tracked and untracked changes in the stash list while keeping the working tree as is:

```bash
git stash -u -m "[CHECKPOINT]" && git stash apply
```
