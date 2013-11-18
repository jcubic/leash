VERSION=0.1
JSC=java -jar lib/terminal/bin/closure.bin/compiler.jar --js
SED=sed
CP=cp

ALL: bush.js bush.min.js

bush.js: bush-src.js .$(VERSION)
	$(SED) -e "s/{{VERSION}}/$(VERSION)/g" bush-src.js > bush.js

bush.min.js: bush.js
	$(JSC) bush.js > bush.min.js

.$(VERSION):
	touch .$(VERSION)
