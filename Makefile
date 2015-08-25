#  This file is part of Leash (Browser Shell)
#  Copyright (C) 2013-2015  Jakub Jankiewicz <http://jcubic.pl>
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

VERSION=0.2
JSCOMPRESS=uglifyjs
SED=sed
CP=cp
CAT=cat
RM=rm
DATE=`date -uR`

ALL: leash.js leash.min.js

leash.js: leash-src.js .$(VERSION) Makefile
	$(SED) -e "s/{{VERSION}}/$(VERSION)/g" -e "s/{{DATE}}/$(DATE)/g" leash-src.js > leash.js

leash.min.js: leash.js
	$(JSCOMPRESS) -o tmp.min.js leash.js
	$(SED) -e "s/{{VER}}/$(VERSION)/g" -e "s/{{DATE}}/$(DATE)/g" copy > copy.tmp
	$(CAT) copy.tmp tmp.min.js > leash.min.js
	$(RM) tmp.min.js copy.tmp

.$(VERSION):
	touch .$(VERSION)
