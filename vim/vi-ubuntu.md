To enable and use vi-style keybindings for line editing in the Ubuntu terminal (Bash shell), follow these steps:
Enable vi mode in the current session:
To temporarily enable vi mode for the current terminal session, execute the following command:
Code

    set -o vi
This command enables vi-style key bindings for command line editing. Make vi mode persistent.
To ensure vi mode is enabled every time you open a new terminal session, add the set -o vi command to your Bash shell's configuration file.
Open the ~/.bashrc file in a text editor (e.g., nano or vim):
Code

    nano ~/.bashrc
Add the line set -o vi at the end of the file. Save the file and exit the editor.
To apply the changes without restarting the terminal, source the file:
Code

    source ~/.bashrc
Using vi mode for line editing.
Once enabled, you can use vi-style commands to navigate and edit your command line input.
Insert Mode:
By default, you are in insert mode, allowing you to type commands normally.
Normal Mode:
Press Esc to switch to normal mode. In this mode, keys act as commands for navigation, deletion, copying, and pasting.
h, j, k, l: Move the cursor left, down, up, and right, respectively.
w, b, e: Move word by word.
0, ^, $: Move to the beginning of the line, first non-blank character, and end of the line, respectively.
dd: Delete the entire line.
yy: Yank (copy) the current line.
p: Put (paste) the yanked text after the cursor.
u: Undo the last change.
/ and ?: Search forward and backward in your command history.
Returning to Insert Mode:
Press i (insert before cursor), a (append after cursor), o (open new line below), or O (open new line above) to switch back to insert mode.
This setup allows you to leverage the powerful editing capabilities of vi directly within your terminal's command line.
