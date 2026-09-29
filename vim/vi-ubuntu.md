# Vi Mode in the Bash Terminal

Enable vi-style keybindings for command-line editing in Bash (Ubuntu or any Readline shell).

## Enable

Current session only:

```bash
set -o vi
```

Persist it by adding the line to `~/.bashrc`, then reload:

```bash
echo 'set -o vi' >> ~/.bashrc
source ~/.bashrc
```

To enable vi mode in every Readline program (Bash, `python`, `psql`, and others), add `set editing-mode vi` to `~/.inputrc` instead.

## Use

You start in insert mode and type normally. Press `Esc` for normal (command) mode:

| Key | Action |
| --- | --- |
| `h` `j` `k` `l` | Left; next history entry; previous history entry; right |
| `w` `b` `e` | Word forward, back, end of word |
| `0` `^` `$` | Line start, first non-blank character, line end |
| `dd` | Delete the whole line |
| `yy` | Yank (copy) the line |
| `p` | Paste after the cursor |
| `u` | Undo |
| `/` `?` | Search older / newer command history |
| `v` | Open the current command in `$EDITOR` |

Return to insert mode with `i` (before cursor), `a` (after cursor), `I` (line start), or `A` (line end).
