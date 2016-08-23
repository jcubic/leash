#  This file is part of Leash (Browser Shell)
#  Copyright (C) 2013-2016  Jakub Jankiewicz <http://jcubic.pl>
#
#  Licensed under MIT license

VERSION=0.10.0
JSCOMPRESS=uglifyjs
SED=sed
CP=cp
CAT=cat
RM=rm
DATE=`date -uR`

ALL: leash.min.js README version

version: Makefile
	echo -n $(VERSION) > version

README: README.in .$(VERSION)
	$(SED) -e "s/{{VERSION}}/$(VERSION)/g" README.in > README

leash.min.js: leash-src.js .$(VERSION) Makefile
	$(SED) -e "s/{{VERSION}}/$(VERSION)/g" -e "s/{{DATE}}/$(DATE)/g" leash-src.js > leash.js
	$(JSCOMPRESS) -o leash.min.js --comments --mangle -- leash.js
	$(RM) leash.js

.$(VERSION):
	touch .$(VERSION)
