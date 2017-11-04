---
layout: post
title: Terminal copy and paste
categories: hobby
tags: linux vim tmux shell wsl clipboard terminal
author: Ernest Wong
---

I want to digress from talking about mechanical differentials and talk more in the realm of shells, software, and productivity. September 17. That day was a special day. That day was the beginning of a new era. That day was the day I began copying and pasting correctly from my terminal.

## tl;dr

Don't have time to read the entire thing? In a nutshell:

- vimrc: [Added ability to use Windows clipboard inside WSL](https://github.com/ErnWong/vimfiles-wsl/commit/8314ec0c487c592982fe869fc0d1e35ecdcd2c25).
- tmux: [Added tmux bindings for tmux and Windows clipboard](https://github.com/ErnWong/dotfiles-nix/commit/0b51e8fa4b6838d02534e60eed7e3f0893dcee04).
- tmux: [Added tmux bindings for yanking](https://github.com/ErnWong/dotfiles-nix/commit/08a3d8ce3b694004290e9fdf60ba4913a570368d).

## The Problem Before September 17

Life was really hard before September 17. Let me show you why. In the midst of my typical productive web browsing...

{% include inline-svg.html filename="typical-day.svg" caption="Figure 1. Don't worry boss. I'm 100% focused on my work." title="Please excuse the sound. I'm testing the software under typical user YouTube-ing conditions." %}

I found a very useful webpage whose information I wanted to copy down into one of my project files.

{% include inline-svg.html filename="goal.svg" caption="Figure 2. Just your normal copying and pasting, right?" %}

As common and as ordinary as this process may sound, there were actually no direct, satisfactory methods of doing this available to me.

- No, I can't Control-C and Control-V my way through life, because I am using Vim as my editor.
- No, I can't yank and paste from the + or \* registers, because my Vim is running inside my Ubuntu subsystem (aka the Bash-on-Ubuntu-on-Windows thing) and that has its own system clipboard, which is different to the Windows Clipboard.
- I can't use the tmux paste buffer as well, for the same reasons as above.
- I technically *can* use the copy and paste functionality of the default Windows Console I'm using, but I can't use the default Control-C/V hotkeys because they will clash with Vim key bindings.

I was left with two options. One way would be to exit out of full-screen mode in order to access the context menu, on which is the copy and paste options that I can select with my mouse. In the process of exiting full-screen mode, my vim and tmux pane sizes are usually ruined.

{% include image.html filename="vim-context-menu.png" width="600" caption="Figure 3. One way of inserting the copied text is through the context menu." title="...but I don't want to touch the mouse..." %}

The other way would be to create a temporary file on the Windows file system, paste the data in there, and open it up from Vim.

{% include inline-svg.html filename="temporary-file.svg" caption="Figure 4. The other way of inserting the copied text." title="As you can see, this is super efficient" %}

Oh! Yuk! As you can see, both of these options are anything but elegant. There must be a better way. By September 7, a little idea manifested in my head and I began configuring my workspace.

## The yanky idea

Here's a little bit of background. Vim provides a very neat mechanism to copy and paste text internally using the `y` and `p` commands (where `y` stands for *yank*, and `p` stands for either *paste* or *put*). We can tell Vim which register to copy. Say, to copy to and paste to the 'a' register, we can prepend the `y` and `p` commands with `"a` to form `"ay` and `"ap`. A list of available registers is available [here](http://vimdoc.sourceforge.net/htmldoc/change.html#registers).

The Vim commands like yank `y` and paste `p` are Verb commands, and can be combined with many "Noun" commands that specify the block of text to perform the Verb in. In Vim terminology, these are Operators and Movements. An example of Movements are: inside-brackets `i)`, word `w`, up `k`, etc. which you can learn more about [here](http://vimdoc.sourceforge.net/htmldoc/motion.htm). For example, to copy the current sentence into the 'e' register, we could press `"eyis`, which stands for select register `"`, and `y`ank `i`nside `s`entence. This makes Vim a really nice editor to use.

{% include inline-svg.html filename="vim-syntax.svg" caption="Figure 5. Vim normal mode commands." %}

Have I lost you yet? Yes? Great! You may now move on to the next section.

Perhaps everything makes sense for you? Clearly, you haven't read things carefully. Go back to the start of this subsection.

Now, wouldn't it be nice if we could somehow "create" or mimic a new register such that we can copy and paste from the Windows clipboard? The next question would be which letter to use for this "new" register. Ideally, such letter would not be pointing to a pre-existing register, and it should be easy to type when used with the `"` key. How about the `"` key itself? Well, why not. It is not a pre-existing register, and it is super convenient to type `""`.

{% include inline-svg.html filename="idea.svg" caption="Figure 6." %}

## Implementing the yank

The next step is to figure out how to script this in. I can't seem to find a built-in mechanism to make `"` behave like a register so that `""` behaves like `"a` but with a custom `"` register instead of the `a` register. It seems like the only way is to map the commands individually for yank and pasting. We want something along the lines of this:

```vimscript
nnoremap ""y <something here> !copy <something else here>
```

It is possible to run Windows binaries within WSL, so we could leverage [this small program called clip.exe](https://ss64.com/nt/clip.html) to somehow pour the clipboard contents into the stdout.

```vimscript
nnoremap ""y <something here> !clip.exe <something else here>
```

Things are not all that straightforward though. Remember how the original yank and paste commands allow the person to type a Movement (ie. the Noun)? There are a gazillion, if not infinite, possible combinations of these Movement Nouns that yank and paste can handle, so if we were to map a key binding for each, it will be slightly challenging...

```vimscript
nnoremap ""yk  <something here> ".....etc.....
nnoremap ""y2k <something here> ".....etc.....
nnoremap ""y3k <something here> ".....etc.....
nnoremap ""y4k <something here> ".....etc.....
nnoremap ""y5k <something here> ".....etc.....
nnoremap ""y6k <something here> ".....etc.....
" ... followed by an infinitely more lines ...
" you get the idea
```

Is there a way to handle these Movement commands without defying the laws of physics? I began thinking: maybe these Verb commands, like yank and paste, are just special mappings. Maybe there's a certain type of mapping similar (but different) to the `nmap`s that deals with these Movement commands. Does it exist? I turn to my old friend, Mr Google.

Mr Google, is there such special mapping command? He responds. Apparently, there's this thing called [Operator-Pending Mappings](http://learnvimscriptthehardway.stevelosh.com/chapters/15.html). It's very close to what I'm looking for, except, it's the exact opposite of what I wanted. Operator-Pending Mappings, using the command `onoremap` or `omap`, allows us to implement the Movement (aka the verb) and not the Operator (the noun). We want to make an Operator, not a Movement.

Mr Google, Mr Google. Is there anything else? He then showed me something interesting. It's a [StackOverflow Q&A](https://stackoverflow.com/questions/8994276/defining-a-new-vim-operator-with-a-parameter), because good stuff is always on stack overflow right? However, I'm not always a fan of copying and pasting from the internet (even though I do), so I decided to find help on this interesting keyword I kept seeing on this page called `opfunc`. Vim help, here I go: `:h opfunc`.

```
                                                  *'operatorfunc'* *'opfunc'*
'operatorfunc' 'opfunc'	string	(default: empty)
                        global
                        {not in Vi}
        This option specifies a function to be called by the |g@| operator.
        See |:map-operator| for more info and an example.

        This option cannot be set from a |modeline| or in the |sandbox|, for
        security reasons.
```

*(from [http://vimdoc.sourceforge.net/htmldoc/options.html#'opfunc'](http://vimdoc.sourceforge.net/htmldoc/options.html#'opfunc'))*

Interesting. Heeding to its advice, I press `Ctrl-]` above the `:map-operator` to navigate to the [relevant page](http://vimdoc.sourceforge.net/htmldoc/map.html#:map-operator).

```
1.11 MAPPING AN OPERATOR                                *:map-operator*

An operator is used before a {motion} command.  To define your own operator
you must create mapping that first sets the 'operatorfunc' option and then
invoke the |g@| operator.  After the user types the {motion} command the
specified function will be called.

                                                        *g@* *E774* *E775*
g@{motion}                Call the function set by the 'operatorfunc' option.
                        The '[ mark is positioned at the start of the text
                        moved over by {motion}, the '] mark on the last
                        character of the text.
                        The function is called with one String argument:
                            "line"        {motion} was |linewise|
                            "char"        {motion} was |characterwise|
                            "block"        {motion} was |blockwise-visual|
                        Although "block" would rarely appear, since it can
                        only result from Visual mode where "g@" is not useful.
                        {not available when compiled without the |+eval|
                        feature}

Here is an example that counts the number of spaces with <F4>: >

        nmap <silent> <F4> :set opfunc=CountSpaces<CR>g@
        vmap <silent> <F4> :<C-U>call CountSpaces(visualmode(), 1)<CR>

        function! CountSpaces(type, ...)
          let sel_save = &selection
          let &selection = "inclusive"
          let reg_save = @@

          if a:0  " Invoked from Visual mode, use gv command.
            silent exe "normal! gvy"
          elseif a:type == 'line'
            silent exe "normal! '[V']y"
          else
            silent exe "normal! `[v`]y"
          endif

          echomsg strlen(substitute(@@, '[^ ]', '', 'g'))

          let &selection = sel_save
          let @@ = reg_save
        endfunction

Note that the 'selection' option is temporarily set to "inclusive" to be able
to yank exactly the right text by using Visual mode from the '[ to the ']
mark.

Also note that there is a separate mapping for Visual mode.  It removes the
"'<,'>" range that ":" inserts in Visual mode and invokes the function with
visualmode() and an extra argument.
```

Jackpot. This is exactly what I wanted: the "API"s sorta speak to implementing my own motion-handling operator. Interestingly, in the example code that they give, the code copies the selected text's contents into the unnamed register in order to use the text content for processing.

After ~~copy and pasting~~ getting inspiration from the example code, the paste key binding is implemented:

```vimscript
nnoremap <silent> ""y :set opfunc=WindowsYank<CR>g@
vnoremap <silent> ""y :<C-U>call WindowsYank(visualmode(), 1)<CR>

function! WindowsYank(type, ...)
  " (1) Save original values for the selection setting
  " and the unnamed register
  let sel_save = &selection
  let &selection = "inclusive"
  let reg_save = @@

  " (2) Yank text to unnamed register
  if a:0  " Invoked from Visual mode, use gv command.
    silent exe "normal! gvy"
  elseif a:type == 'line'
    silent exe "normal! '[V']y"
  else
    silent exe "normal! `[v`]y"
  endif

  " (3) Send contents of @@ to Windows clip.exe
  " Note: I've included a pushd-to-windows-directory to suppress warning
  " because windows warns about failing to translate working directory
  " when current working directory is inside wsl.
  echo system('pushd /mnt/c/ > /dev/null && clip.exe && popd > /dev/null', getreg('', 1, 1))

  " (4) Restore original settings and value of unnamed register
  let &selection = sel_save
  let @@ = reg_save
endfunction
```

## How it works

Let's look at the key binding for `normal` mode:

```vimscript
nnoremap <silent> ""y :set opfunc=WindowsYank<CR>g@
```

When the keys `""y` are pressed, Vim will do the following:

1. The `:` tells Vim to enter the command-line mode, so the line tells Vim to enter `:set opfunc=WindowsYank` and press Enter (the `<CR>` key) to let Vim parse the command line.
2. The command `g@` is executed. This tells Vim to enter operator-pending mode, and will wait for the user to enter some Movements.
3. Once the movements are done, the `g@` command calls whatever function is set into the `opfunc` option. The ```[`` mark and the ```]`` mark are now set to the start and the end of the text selection. Since we've set `opfunc` to `WindowsYank`, Vim will now call the `WindowsYank` function. It will also pass an argument (`a:type` of `WindowsYank`) that describes what type of motion it was:
```
"line"	{motion} was |linewise|
"char"	{motion} was |characterwise|
"block"	{motion} was |blockwise-visual|
```

Inside the `WindowsYank` function, the following line grabs the content of the selected text:

```vimscript
elseif a:type == 'line'
  silent exe "normal! '[V']y"   " <--- this uses visual line mode V to copy
                                "      everything between the '[ and '] marks
                                "      into the unnamed register
else
  silent exe "normal! `[v`]y"   " <--- this uses visual mode v to copy
                                "      everything between the `[ and `] marks
                                "      into the unnamed register
endif
                                " Side note: ` jumps to the location, while
                                "            ' jumps to the first character
                                "              in the line of the location
```

...and pipes it into the shell command. Inspiration from the godly-gods of [StackOverflow](https://stackoverflow.com/a/2575656).

```vimscript
" (3) Send contents of @@ to Windows clip.exe
" Note: I've included a pushd-to-windows-directory to suppress warning
" because windows warns about failing to translate working directory
" when current working directory is inside wsl.
echo system('pushd /mnt/c/ > /dev/null && clip.exe && popd > /dev/null', getreg('', 1, 1))
```

What about `visual` mode? It's quite similar. We begin with the key binding:

```vimscript
vnoremap <silent> ""y :<C-U>call WindowsYank(visualmode(), 1)<CR>
```

Let's decode this. When the user types the keys `""y`, Vim does the following:

1. The `:` tells Vim to enter command-line mode. Note that Vim is in `visual` mode, so Vim automatically adds `'<,'>` to the command-line.
2. The `<C-U>` emulates the user pressing Control-U. This tells Vim to remove that `'<v'>` from the command-line.
3. The remaining stuff tells Vim to call the `WindowsYank` function. It sets the first argument `a:type` to `visualmode()` (which isn't actually used in the function so we can ignore what this means). It then sets the optional argument `a:0` to `1`.
4. The `<CR>` tells Vim to press Enter, so the command-line gets processed.

Inside the `WindowsYank` function, things behave in a very similar way. The only behaviour that differs is in the way the function grabs the selected text:

```vimscript
if a:0  " Invoked from Visual mode, use gv command.
  silent exe "normal! gvy"
```

Here, the `gv` command tells Vim to re-select everything that had been previously selected in `visual` mode. This selected text is yanked into the unnamed register and gets piped into `clip.exe` just like it would in `normal` mode.

Because this function uses the unnamed register temporarily, we want to restore its previous value back once we've finished with it.

```vimscrpt
let @@ = reg_save
```

That, my friend, is how this little script works.

## What about pasting?

With the yanking part implemented, we need to implement the pasting part. Here's what we need to do:

1. Figure out how to grab the Windows clipboard contents and store it into a register or a variable.
2. Figure out how to paste it into the Vim buffer/window.

For the yanking part, we had a helpful Windows program called `clip.exe` that we can pipe into its stdin to copy stuff. Is there an analogous version for pasting, like a `paste.exe` that dumps the clipboard contents into stdout? After some searching [here](https://stackoverflow.com/a/2575656) and [there](https://brianreiter.org/2010/09/03/copy-and-paste-with-clipboard-from-powershell/), there doesn't seem to be some quick and dirty, built-in solution that I can use satisfyingly.

Luckily, I discovered on [neovim Github issue](https://github.com/neovim/neovim/issues/6227) that some lovely folk had made a simple `paste.exe` program on [Github](https://github.com/neosmart/paste). Even the name is exactly `paste.exe`, so how can I say no to that?

We can load the contents of the clipboard into the unnamed register like so:

```vimscript
let @@ = system('pushd /mnt/c/ > /dev/null && paste.exe && popd > /dev/null')
```

Here comes the problem. If you look at the vim help documentation, there are eight different flavours of the paste command for `normal` mode: `p`, `P`, `gp`, `gP`, `]p`, `[p`, `]P`,  and `[P`. On top of that, there are also two `visual` mode paste commands. Is there a way to elegantly deal with all these behaviours?

Then came a brilliant idea. We're already storing the stdout of `paste.exe` into the unnamed register `@@`, so why not just run whatever command the user types in to paste it in? We can always restore the original `@@` values anyway.

On the first attempt, I used the `feedkeys` function to run the appropriate paste commands:

```vimscript
function! WindowsPaste(command, ...)
  " (1) Save original value of the unnamed register to restore later on
  let reg_save = @@

  " (2) Load clipboard into register
  let @@ = system('pushd /mnt/c/ > /dev/null && paste.exe && popd > /dev/null')

  " (3) Run the given paste command
  call feedkeys(command)

  " (4) Restore
  let @@ = reg_save
endfunction
```

However, there was a problem. Whenever `WindowsPaste` is called, it actually pastes whatever's in the unnamed register *before* it was modified. In other words, if the user copied the text `abc` into the Vim unnamed register in the conventional manner, and on copied the text `123` on Windows' clipboard, running `WindowsPaste` pastes `abc` instead of `123`. What is going on?

It turns out that I have misused the `feedkeys` function. Looking at the [documentation](http://vimdoc.sourceforge.net/htmldoc/eval.html#feedkeys()):

> Characters in {string} are queued for processing as if they
> come from a mapping or were typed by the user.
> By default the string is **added to the end** of the typeahead
> buffer, thus if a mapping is still being executed the
> characters come after them.
> ...
>	The function **does not wait** for processing of keys contained in
> {string}.

(Emphasis by me)

This meant that the unnamed register `@@` is restored back to `reg_save` before the paste commands were executed. This explains the symptoms we're experiencing.

Let's scrap the use of `feedkeys`. Turns out we can use the `execute` command instead:

```vimscript
" (3) Run the given paste command
exe "normal! " . a:command
```

This seems to work really nicely. As for `visual` mode, I can't seem to find a `:visual` command that behaves like the `:normal` command. The `:visual` command appears to do something else. That's okay though, we can use the `:normal` command and re-enter visual mode and select everything that was previously selected using `gv`.

```vimscript
exe "normal! gv" . a:command
```

That is it. That is all. All that's left are the key bindings:

```vimscript
nnoremap <silent> ""p :call WindowsPaste('p')<CR>
nnoremap <silent> ""P :call WindowsPaste('P')<CR>
nnoremap <silent> ""gp :call WindowsPaste('gp')<CR>
nnoremap <silent> ""gP :call WindowsPaste('gP')<CR>
nnoremap <silent> ""]p :call WindowsPaste(']p')<CR>
nnoremap <silent> ""[p :call WindowsPaste('[p')<CR>
nnoremap <silent> ""]P :call WindowsPaste(']P')<CR>
nnoremap <silent> ""[P :call WindowsPaste('[P')<CR>
vnoremap <silent> ""p :call WindowsPaste('p', 1)<CR>
vnoremap <silent> ""P :call WindowsPaste('P', 1)<CR>
```

The overall pasting script in its final form:

```vimscript
function! WindowsPaste(command, ...)
  " (1) Save original value of the unnamed register to restore later on
  let reg_save = @@

  " (2) Load clipboard into register
  let @@ = system('pushd /mnt/c/ > /dev/null && paste.exe && popd > /dev/null')

  " (3) Run whatever command was being run
  if a:0
    exe "normal! gv" . a:command
    " Don't revert unnamed register if inside visual mode
  else
    exe "normal! " . a:command
    " Revert unnamed register
    let @@ = reg_save
  endif
endfunction
```

## Daddy, look! I can copy and paste!

{% include image.html filename="vim-demo.gif" width="500px" caption="Demo 1." title="Yeah, ignore the weird newline thing. I might fix that later." %}

## Finishing up with Tmux

After taming Vim to our liking, surely tmux isn't that hard to change right?

Tmux has this concept of [paste buffers](http://man7.org/linux/man-pages/man1/tmux.1.html#BUFFERS) and something called the [copy mode](http://man7.org/linux/man-pages/man1/tmux.1.html#WINDOWS_AND_PANES).

In order to copy something, one would usually enter this *copy mode* by pressing the tmux prefix key (usually `Ctrl-b`) followed by `[`. Tmux then freezes the pane, and you can navigate up and down the history of the pane. The user would then select the text, and copy it using the keybindings specified [here](http://man7.org/linux/man-pages/man1/tmux.1.html#WINDOWS_AND_PANES). Finally, the user can exit copy mode and paste it by pressing the prefix key (usually `Ctrl-b`) followed by `]`.

The first thing I will configure would be the default key bindings in copy-mode to vi-like. Note that these configurations are being put in a file `~.tmux.conf`.

```tmux
set-window-option -g mode-keys vi
```

The default key bindings are a little bit less intuitive, so I add the following as well. Inspiration from these [nice](http://jasonwryan.com/blog/2011/06/07/copy-and-paste-in-tmux/) [bloggers](https://awhan.wordpress.com/2010/06/20/copy-paste-in-tmux/).

```tmux
bind P paste-buffer
bind -T copy-mode-vi v send-keys -X begin-selection
bind -T copy-mode-vi y send-keys -X copy-selection
bind -T copy-mode-vi r send-keys -X rectangle-toggle
bind -T copy-mode-vi Q send-keys -X stop-selection
```

Next up, we'll try to bind a key that pastes from the windows clipboard. We can use the `tmux load-buffer` to load the outputs of our `paste.exe` into a tmux paste buffer. Looking at the man page, this `load-buffer` command accepts a file path and loads the contents of it into the specified buffer:

```
     load-buffer [-b buffer-name] path
                   (alias: loadb)
             Load the contents of the specified paste buffer from path.
```

*(from [http://man7.org/linux/man-pages/man1/tmux.1.html#BUFFERS](http://man7.org/linux/man-pages/man1/tmux.1.html#BUFFERS))*

Hmm, our `paste.exe` doesn't readily produce a file, so we'll have to pipe it into a new file ourselves. To be safe, we'll create a temporary directory with [`mktemp`](https://www.mktemp.org/manual.html), and create our file there:

```
cd $(mktemp -d) \
&& paste.exe > ./data \
&& tmux load-buffer ./data -b windows-paste-buffer \
&& rm -r $(pwd)
```

Note that the line `rm -r $(pwd)` is potentially dangerous if `mktemp` fails, as it may delete the current directory. This is, however, safe guarded by the ampersands, as `mktemp` should return 1 upon failure.

After the buffer is loaded, we can call the `tmux paste-buffer` command to finish the pasting process. We can turn this mini script snippet into a tmux key binding like so:

```tmux
bind C-p run "\
    cd $(mktemp -d) \
    && paste.exe > ./data \
    && tmux load-buffer -b windows-paste-buffer ./data \
    && rm -r $(pwd) \
    && tmux paste-buffer -b windows-paste-buffer"
```

Can we avoid creating this temporary file? Yes. Because, in linux, you'll find that almost everything is a file. There is a (virtual?) file at `/dev/stdin` that we can use to pipe directly into the buffer:

```tmux
bind C-p run "\
    paste.exe \
    | tmux load-buffer -b windows-paste-buffer /dev/stdin \
    && tmux paste-buffer -b windows-paste-buffer"
```

In short form that works in `tmux`, we can use `-` in place of `/dev/stdin` (for no particular reason).

```tmux
bind C-p run "\
    paste.exe \
    | tmux load-buffer -b windows-paste-buffer - \
    && tmux paste-buffer -b windows-paste-buffer"
```

Finally, we can implement the yanking part for tmux, simply by binding the `Y` key in copy-mode to the copy-mode command `copy-pipe` and use that to pipe to the `clip.exe` program.

```tmux
bind -T copy-mode-vi Y send-keys -X copy-pipe "clip.exe"
```

## Demo!

{% include image.html filename="tmux-demo.gif" width="500px" caption="Demo 2." title="Yeah, ignore the missing newlines. I might fix that later." %}

## Wrap up

Is all of this nerdiness necessary? Does quality of life actually improve?

Without doubt, the answer is yes. As I write this post, I feel empowered by how easy it was to saturate the page with hyperlinks.

Happy Guy Fawkes day. Have fun with fireworks. Don't burn your houses down, and remember to not put too much CO2 into the air.

***Side Note: The Gender of Google.*** *Eh, I don't actually know. I thought it'll be more interesting to personify it, so I flipped a coin, and arbitrarily considered Google as a he for the day.*
