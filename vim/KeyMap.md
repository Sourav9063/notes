# Key Bindings

This document lists the Vim-specific and VSCode-specific key bindings available in the VSCodeVim extension.

## Vim Specific Keybindings

### Modes
- **Normal Mode**: `Esc`, `Ctrl+[`
- **Insert Mode**: `i`, `I`, `a`, `A`, `o`, `O`, `gi`, `gI`
- **Visual Mode**: `v`
- **Visual Line Mode**: `V`
- **Visual Block Mode**: `Ctrl+v` (Windows/Linux), `Cmd+v` (macOS - depends on configuration) or `Ctrl+q`

### Insert Mode Keys
- **Exit**: `<Esc>`, `Ctrl+c`
- **Delete**: `Ctrl+w` (word back), `Ctrl+u` (line back), `Backspace`, `Delete`
- **Indent**: `Ctrl+t` (indent), `Ctrl+d` (dedent)
- **Paste Register**: `Ctrl+r <register>`
- **Copy from neighboring lines**: `Ctrl+y` (above), `Ctrl+e` (below)
- **Digraph**: `Ctrl+k <char1> <char2>`

### Command Line Editing
- **Navigation**: `Left`, `Right`, `Ctrl+b` (begin), `Ctrl+e` (end)
- **History**: `Up`, `Down`, `Ctrl+p` (prev), `Ctrl+n` (next)
- **Editing**: `Ctrl+w` (delete word), `Ctrl+u` (delete to start), `Ctrl+h` (backspace)
- **Insert**: `Ctrl+r <register>` (paste register), `Ctrl+r Ctrl+w` (word under cursor)
- **Completion**: `Tab`, `Shift+Tab`

### Motions
- **Basic Movement**: `h`, `j`, `k`, `l`, `Left`, `Down`, `Up`, `Right`, `Backspace`
- **Word Movement**: `w`, `W`, `e`, `E`, `b`, `B`, `ge`, `gE`
- **Line Movement**: `0`, `^`, `$`, `g_`, `+`, `-`, `_`, `g0`, `g^`, `gm` (middle of screen line), `g$`
- **Screen Movement**: `H` (High), `M` (Middle), `L` (Low), `gk` (up screen line), `gj` (down screen line)
- **Document Movement**: `gg`, `G`
- **Scroll**: `Ctrl+e`, `Ctrl+y`, `Ctrl+d`, `Ctrl+u`, `Ctrl+f`, `Ctrl+b`, `zt`, `zz`, `zb`, `z-`
- **Horizontal Scroll**: `zh`, `zl`, `zH`, `zL`
- **Search Navigation**: `n`, `N`, `*`, `#`, `g*`, `g#`
- **Search Match Selection**: `gn` (select next match), `gN` (select prev match)
- **Character Search**: `f<char>`, `F<char>`, `t<char>`, `T<char>`, `;`, `,`, `|` (column N)
- **Matching Pair**: `%`
- **Go to Line**: `<line>G`, `:<line>`
- **Jumps**: `Ctrl+o` (Jump back), `Ctrl+i` (Jump forward)
- **Change Jumps**: `` `. `` (last change), `` `[ `` (start of change), `` `] `` (end of change)
- **Paragraphs**: `}` (forward), `{` (backward)
- **Sentences**: `)` (forward), `(` (backward)
- **Sections**: `]]`, `[[`, `][`, `[]`
- **Unclosed Groups**: `[(`, `[{`, `])`, `]}`
- **Python**: `]m`, `[m` (next/prev method start), `]M`, `[M` (next/prev method end)

### Operators
Operators can be combined with motions (e.g., `dw`, `c$`).
- **Delete**: `d`, `D` (`d$` alias), `x` (delete char), `X` (backspace char)
- **Change**: `c`, `C` (`c$` alias), `s` (substitute char), `S` (substitute line), `r` (replace char), `R` (Replace mode)
- **Yank (Copy)**: `y`, `Y` (`yy` alias)
- **Put (Paste)**: `p`, `P`, `gp`, `gP`, `]p` (adjust indent), `[p` (adjust indent)
- **Indent**: `>`, `<`
- **Format**: `=`
- **Case Change**: `~`, `g~`, `gu`, `gU`
- **Join Lines**: `J`, `gJ`
- **Filter**: `!` (external command)
- **Rot13**: `g?`
- **Increment/Decrement**: `Ctrl+a` (add), `Ctrl+x` (subtract), `g Ctrl+a` (sequential add in visual), `g Ctrl+x` (sequential subtract in visual)

### Text Objects
Used with operators (e.g., `diw`, `ca"`).
- **Words**: `iw` (inner word), `aw` (a word)
- **Sentences**: `is`, `as`
- **Paragraphs**: `ip`, `ap`
- **Blocks**: `i(`, `a(`, `i{`, `a{`, `i[`, `a[`, `i<`, `a<`, `it` (tags)
- **Quotes**: `i'`, `a'`, `i"`, `a"`, `i``, `a``
- **Word (Big)**: `iW`, `aW`
- **Block (Angle)**: `i>`, `a>` (same as `i<`, `a<`)
- **Block (Paren/Brace)**: `ib`, `ab` (same as `i(`, `a(`), `iB`, `aB` (same as `i{`, `a{`)
- **Argument**: `ia`, `aa` (inner/around argument)
- **Indent**: `ii` (inside indent), `ai` (above + inside), `aI` (above + inside + below)
- **Entire Buffer**: `ie` (inner entire buffer), `ae` (all entire buffer)
- **Expanding Block**: `af` (smart select expansion)

### Registers & Marks
- **Select Register**: `"<register>` (e.g., `"ay` to yank to register 'a')
- **Set Mark**: `m<char>`
- **Jump to Mark**: `'<char>` (start of line), `` `<char> `` (exact position)
- **Special Marks**: 
    - `` `{A-Z} `` (file mark)
    - `` `{0-9} `` (numbered mark)
    - `` `` `` (before jump)
    - `` `[ ``, `` `] `` (start/end of operation)
    - `` `. `` (last change)

### Macros
- **Record Macro**: `q<register>`
- **Stop Recording**: `q`
- **Play Macro**: `@<register>`, `@@` (repeat last)

### Search & Replace
- **Search**: `/pattern`, `?pattern`
- **Substitute**: `:s/old/new/g`, `:%s/old/new/g`
- **Highlight**: `:noh` (clear highlights)
- **Repeat Substitute**: `&`

### Folds
- **Toggle Fold**: `za`
- **Close Fold**: `zc`, `zC` (recursive), `zM` (close all)
- **Open Fold**: `zo`, `zO` (recursive), `zR` (open all)
- **Create Fold**: `zf`
- **Delete Fold**: `zd`, `zD` (recursive)

### Custom Commands
- **Hover**: `gh` (show hover tooltip)
- **Multi-Cursor**: `gb` (add cursor at next match of word under cursor)
- **Info**: `ga` (show ASCII value of character under cursor)

### Plugins (Emulated)
- **Surround**: `ys<motion><char>` (add), `ds<char>` (delete), `cs<old><new>` (change), `S<char>` (visual add)
- **Comment**: `gcc` (comment line), `gc<motion>` (comment motion)
- **ReplaceWithRegister**: `gr<motion>`, `grr` (line)
- **Sneak**: `s<char><char>`, `S<char><char>`, `z<char><char>` (operator pending), `Z<char><char>` (operator pending)
- **CamelCaseMotion**: 
    - `<leader>w`, `<leader>b`, `<leader>e` (motion)
    - `i<leader>w` (inner camelCase word text object)
- **Easymotion** (if enabled): 
    - **One Char**: `<leader><leader> f <char>`, `<leader><leader> s <char>`, `<leader><leader> t <char>`, `<leader><leader> F <char>`, `<leader><leader> T <char>`
    - **Two Char**: `<leader><leader> 2f <char><char>`, `<leader><leader> 2s <char><char>`, `<leader><leader> 2t <char><char>`, `<leader><leader> 2F <char><char>`, `<leader><leader> 2T <char><char>`
    - **Word**: `<leader><leader> w`, `<leader><leader> b`, `<leader><leader> e`, `<leader><leader> ge`
    - **Line**: `<leader><leader> j`, `<leader><leader> k`
    - **Search**: `<leader><leader> /`
    - **Bidirectional**: 
        - `<leader><leader><leader> bdw` (word)
        - `<leader><leader><leader> bde` (word end)
        - `<leader><leader><leader> bdjk` (line)
        - `<leader><leader><leader> bdt <char>` (till char)
        - `<leader><leader><leader> bd2t <char><char>` (till 2 chars)
    - **Other**: `<leader><leader> l`, `<leader><leader> h` (line forward/backward), `<leader><leader><leader> j` (JumpToAnywhere)

*Note: `<leader>` defaults to `\` but is commonly remapped to `<Space>` in user configuration.*

---

## VSCode Specific Keybindings

These keybindings interact directly with VSCode features or are mapped to VSCode commands.

### Editor Management
- **Split Editor**: `:sp` (horizontal), `:vsp` (vertical)
- **Close Editor**: `:q`, `:wq`
- **Switch Tabs**: `gt` (next tab), `gT` (previous tab)
- **Move to Split**: `Ctrl+w` followed by `h`, `j`, `k`, `l`, `Top`, `Bottom`, `Left`, `Right`
- **Resize Split**: `Ctrl+w` followed by `=`, `>`, `<`, `+`, `-`

### Navigation & Code Intelligence
- **Go to Definition**: `gd`, `Ctrl+]`, `gO` (File Outline)
- **Go to Declaration**: `gD`
- **Peek Definition**: `gh` (mapped to hover)
- **Go to File**: `gf` (open file under cursor)
- **Open Link**: `gx`
- **Change List**: `g;` (prev change), `g,` (next change)
- **File Info**: `Ctrl+g`
- **Previous File**: `Ctrl+^`

### List Navigation (File Explorer, QuickPick, etc.)
When a list has focus (e.g. `Ctrl+P` list or Explorer):
- **Navigation**: `j` (down), `k` (up), `Ctrl+n` (down), `Ctrl+p` (up)
- **Top/Bottom**: `gg` (first item), `G` (last item, Shift+G)
- **Paging**: `Ctrl+d` (page down), `Ctrl+u` (page up)
- **Expansion**: `h` (collapse/parent), `l` (select/expand), `o` (toggle expand)
- **Selection**: `Enter` (select)
- **Search**: `/` (toggle keyboard navigation)

### Multi-Cursor
- **Add Cursor Up/Down**: `Ctrl+Alt+Up`, `Ctrl+Alt+Down` (Linux/Windows), `Cmd+Alt+Up`, `Cmd+Alt+Down` (macOS)
- **Visual Block Mode**: Selects a block which can be operated on with multiple cursors.

### Clipboard
- **Copy to System Clipboard**: `"*y`, `"+y`, `Ctrl+c` (if overridden)
- **Paste from System Clipboard**: `"*p`, `"+p`, `Ctrl+v` (if overridden)

### Command Line (Ex Commands)
Supported commands in the `:` command line:

- **File Operations**: `:w` (write), `:q` (quit), `:wq`, `:wa` (write all), `:q!` (force quit), `:x` (write & quit), `:e <file>` (edit), `:wall` (write all)
- **Edits**: `:s` (substitute), `:retab`, `:sort`, `:copy` (`:t`), `:move`, `:delete`, `:put`, `:yank`, `:undo`, `:redo`
- **Buffers & Windows**: `:bdelete`, `:bunload`, `:only`, `:close`, `:tabnew`, `:tabnext`, `:tabprev`, `:tabclose`
- **Navigation**: `:<line>`, `:jumps`, `:marks`, `:grep`, `:go` (goto byte), `:center`, `:left`, `:right`
- **Info & Status**: `:ascii`, `:digraphs`, `:display` (`:reg`), `:file` (`:f`), `:history`, `:pwd`, `:smile`
- **Configuration & Tools**: `:set <option>`, `:nohl` (clear highlights), `:! <cmd>` (shell command), `:terminal`, `:normal` (run normal command)
- **Programming**: `:breakpoints` (debug), `:eval`, `:let`