#  This file is part of Broshell (Browser Shell)
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

VERSION=0.1
JSCOMPRESS=uglifyjs
SED=sed
CP=cp

ALL: broshell.js broshell.min.js

broshell.js: broshell-src.js .$(VERSION) Makefile
	$(SED) -e "s/{{VERSION}}/$(VERSION)/g" -e "s/{{DATE}}/`date -uR`/g" broshell-src.js > broshell.js

broshell.min.js: broshell.js
	$(JSCOMPRESS) -o broshell.min.js broshell.js

.$(VERSION):
	touch .$(VERSION)
