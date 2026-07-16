## Copy the [AGENTS.md](ai/AGENTS.md) in your repo.

**Linux, macOS, WSL, and Git Bash**:

```bash
set -euo pipefail

url='https://raw.githubusercontent.com/Sourav9063/notes/refs/heads/main/ai/AGENTS.md'
content="$(curl -fsSL "$url")"

for file in CLAUDE.md AGENTS.md GEMINI.md; do
    touch "$file"

    if grep -q '^## Spec-Driven Development$' "$file"; then
        sed -i.bak '/^## Spec-Driven Development$/,$d' "$file"
        rm -f "$file.bak"
    fi

    printf '%s\n' "$content" >> "$file"
done
```

* Marker exists: replace from the marker to the end.
* Marker absent: append.
* File absent: create it.

For **native Windows**, use Git Bash or WSL to run the same script.
