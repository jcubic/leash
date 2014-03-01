#  This file is part of Bush (Browser Unix Shell)
#  Copyright (C) 2013  Jakub Jankiewicz <http://jcubic.pl>
#
#  This program is free software: you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation, either version 3 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program.  If not, see <http://www.gnu.org/licenses/>.

#non interactive shell don't expand aliases
shopt -s expand_aliases

export PATH=$PATH:/usr/games

export TERM="ansi" #force colors for dircolors
if [ -x /usr/bin/dircolors ]; then
    #Nice colors
    eval "`dircolors -b`"
    alias grep="grep --color=always"
    alias ls="ls --color=always"
fi

