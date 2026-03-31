You have hit the exact right solution. If you need a Pull Request to remove code from a target branch, you cannot use `git reset`. You must use **`git revert`**.

While `reset` tries to rewrite history, `revert` creates a **brand new commit** that does the exact mathematical opposite of the commits you want to undo. Because it is a new commit, Git sees it as an "addition" of code deletions, which the PR system perfectly understands.

Here is exactly how to bundle the undoing of those 5 commits into **one single new commit**:

### Step 1: Revert the commits without saving them immediately
Run this command to tell Git to undo the last 5 commits, but keep the undone changes staged in your working directory instead of creating 5 separate revert commits:

```bash
git revert --no-commit HEAD~5..HEAD
```
*(Note: `--no-commit` can also be written as `-n`. The `HEAD~5..HEAD` part tells Git the range of commits to look at).*

### Step 2: Create your single undo commit
Now that Git has staged all the deletions and reversals, you just need to commit them like normal:

```bash
git commit -m "Revert changes from the last 5 commits"
```

### Step 3: Push normally
Because you are just adding a new commit to your history, you do not need to force push. Just push normally:

```bash
git push origin <your-branch-name>
```

### What happens in the PR?
When you open your Pull Request to `develop` now, the reviewers will see your new commit. In the "Files Changed" tab of the PR, they will see all the code from those 5 commits highlighted in red (being deleted/reverted). When the PR is approved and merged, `develop` will safely receive those deletions.
