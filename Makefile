VERSION=0.1
JSC=java -jar lib/terminal/bin/closure.bin/compiler.jar --js
SED=sed
CP=cp

ALL: baus-$(VERSION).js baus-$(VERSION).min.js

baus-$(VERSION).js: baus-src.js .$(VERSION)
	$(SED) -e "s/{{VERSION}}/$(VERSION)/g" baus-src.js > baus-$(VERSION).js

baus-$(VERSION).min.js: baus-$(VERSION).js
	$(JSC) baus-$(VERSION).js > baus-$(VERSION).min.js

.$(VERSION):
	touch .$(VERSION)
