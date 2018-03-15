#  This file is part of Leash (Browser Shell)
#  Copyright (C) 2013-2018  Jakub Jankiewicz <http://jcubic.pl/me>
#
#  Released under the MIT license

#non interactive shell don't expand aliases
shopt -s expand_aliases

# man output formatting
export MAN_KEEP_FORMATTING=1
export PATH=$PATH:/usr/games
export TERM="xterm-256" #force colors for dircolors
alias grep="grep --color=always"

if [ -x /usr/bin/dircolors ]; then
    #Nice colors
    eval "`dircolors -b`"
    alias ls="ls --color=always"
fi
