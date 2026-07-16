## Copy the [AGENTS.md](ai/AGENTS.md) in your repo.

**Linux, macOS, WSL, and Git Bash**:

```bash
set -euo pipefail

url='https://raw.githubusercontent.com/Sourav9063/notes/refs/heads/main/ai/AGENTS.md'
remote="$(mktemp)"
trap 'rm -f "$remote"' EXIT

curl -fsSL "$url" > "$remote"

for file in CLAUDE.md AGENTS.md GEMINI.md; do
    touch "$file"

    # -i.bak works with both GNU sed and macOS/BSD sed.
    sed -i.bak '/^## Spec-Driven Development$/,$d' "$file"
    rm -f "$file.bak"

    [[ ! -s "$file" ]] || printf '\n' >> "$file"
    cat "$remote" >> "$file"
done
```

Behavior:

* Marker found → removes it and everything after it, then inserts the remote content.
* Marker absent → appends the remote content.
* File absent → creates it.
* Remote download fails → stops without continuing.

For **native Windows**, use Git Bash or WSL to run the same script.
