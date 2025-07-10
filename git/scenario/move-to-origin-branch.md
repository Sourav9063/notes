**Recommended (Modern Git: `git switch`)**

1.  **First, ensure your local repository has the latest information about remote branches:**

    ```bash
    git fetch origin
    ```

    This command downloads the latest changes from the `origin` remote, including any new branches, without merging them into your current local branches.

2.  **Create a new local branch and switch to it, tracking the remote branch:**

    ```bash
    git switch -c <local-branch-name> origin/<remote-branch-name>
    ```

      * Replace `<local-branch-name>` with the name you want for your new local branch. It's common practice to use the same name as the remote branch for simplicity.
      * Replace `<remote-branch-name>` with the actual name of the branch on the `origin` remote (e.g., `feature/fraud-activities-parcel`).

    **Example:**

    ```bash
    git switch -c feature/fraud-activities-parcel origin/feature/fraud-activities-parcel
    ```

    **Even shorter shortcut (if local and remote branch names are the same):**
    If the local branch name you want to create is the same as the remote branch name, Git is smart enough to figure it out with just:

    ```bash
    git switch <remote-branch-name>
    ```

    For example:

    ```bash
    git switch feature/fraud-activities-parcel
    ```

    Git will see that `feature/fraud-activities-parcel` doesn't exist locally but does exist on `origin`, and it will automatically create a local tracking branch with that name.

**Using `git checkout` (Older but still valid)**

This achieves the same result as `git switch -c`:

1.  **Fetch remote changes (same as above):**

    ```bash
    git fetch origin
    ```

2.  **Create a new local branch and switch to it, tracking the remote branch:**

    ```bash
    git checkout -b <local-branch-name> origin/<remote-branch-name>
    ```

    **Example:**

    ```bash
    git checkout -b feature/fraud-activities-parcel origin/feature/fraud-activities-parcel
    ```

    **Even shorter shortcut (if local and remote branch names are the same):**

    ```bash
    git checkout <remote-branch-name>
    ```

    Example:

    ```bash
    git checkout feature/fraud-activities-parcel
    ```

    Again, Git will automatically set up tracking if a local branch with that name doesn't exist but a remote one does.

**Why `git fetch` first?**

`git fetch` updates your local copy of the remote repository's branches. Without it, your local Git might not know about recently pushed remote branches.

**What happens after these commands?**

  * A new local branch is created (e.g., `feature/fraud-activities-parcel`).
  * Your `HEAD` (your current working branch) is moved to this new local branch.
  * This new local branch is set up to "track" the corresponding remote branch (`origin/feature/fraud-activities-parcel`). This means that when you later run `git pull` or `git push` while on this local branch, Git will automatically know which remote branch to interact with.

So, pick the `git switch` or `git checkout` command that best fits your preference and Git version\!
