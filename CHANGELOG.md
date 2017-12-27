<a name="1.17.0"></a>
# 1.17.0 (2017-12-27)

* Add plugins ([be534e2](https://github.com/jcubic/leash/commit/be534e2))
* Add windows support ([2ac3f62](https://github.com/jcubic/leash/commit/2ac3f62))
* better shell detection for macOS ([79b978c](https://github.com/jcubic/leash/commit/79b978c))
* Fix warning in write log file + better clear of file in __write ([58594cd](https://github.com/jcubic/leash/commit/58594cd))
* Typo in logger code ([7883ea5](https://github.com/jcubic/leash/commit/7883ea5))
* update php version in README ([9f9de5d](https://github.com/jcubic/leash/commit/9f9de5d))



<a name="0.16.0"></a>
# 0.16.0 (2017-09-24)

* grab command + hash for assets + update jQuery ([6ebcd33](https://github.com/jcubic/leash/commit/6ebcd33))



<a name="0.15.3"></a>
## 0.15.3 (2017-08-17)

* Fix wrong json in config handling ([196fc50](https://github.com/jcubic/leash/commit/196fc50))
* unlink on write only if file exist #7 ([1d6c8c8](https://github.com/jcubic/leash/commit/1d6c8c8))
* version 0.15.3 ([1e4f738](https://github.com/jcubic/leash/commit/1e4f738))



<a name="0.15.2"></a>
## 0.15.2 (2017-07-29)

* Add .gitattributes file ([4d7e5a9](https://github.com/jcubic/leash/commit/4d7e5a9))
* Add key polyfill + unlink file before write ([e685064](https://github.com/jcubic/leash/commit/e685064))
* Don't replace home directory by ~ if it's / ([2fec62d](https://github.com/jcubic/leash/commit/2fec62d))
* Fix error from refactoring ([0d260eb](https://github.com/jcubic/leash/commit/0d260eb))
* Update changelog ([3b085c3](https://github.com/jcubic/leash/commit/3b085c3))
* Update jQuery Terminal ([a859655](https://github.com/jcubic/leash/commit/a859655))
* Update jQuery Terminal ([8696423](https://github.com/jcubic/leash/commit/8696423))
* Version 0.15.2 ([92ae306](https://github.com/jcubic/leash/commit/92ae306))



<a name="0.15.0"></a>
# 0.15.0 (2017-06-22)

* Add changelog ([5b36f46](https://github.com/jcubic/leash/commit/5b36f46))
* Add help command ([6d1e438](https://github.com/jcubic/leash/commit/6d1e438))
* Add info about unbuffer to README ([d9e0ede](https://github.com/jcubic/leash/commit/d9e0ede))
* Add json reqirement to readme ([3e88fa0](https://github.com/jcubic/leash/commit/3e88fa0))
* Add link to chat to readme ([73cb350](https://github.com/jcubic/leash/commit/73cb350))
* Allow for limited number of commands for guest user and add copyrihgt note to wcwidth.js file ([e38fad4](https://github.com/jcubic/leash/commit/e38fad4))
* Better usage strings ([96d6ecc](https://github.com/jcubic/leash/commit/96d6ecc))
* Don't allow to execute sudo command with sudo option and make su command work ([0d2164a](https://github.com/jcubic/leash/commit/0d2164a))
* Don't enable terminal on init on Android ([194f4a4](https://github.com/jcubic/leash/commit/194f4a4))
* Don't hide virtual keyboard on Android on pause(true) ([5465291](https://github.com/jcubic/leash/commit/5465291))
* Fix #6 ([b8a5933](https://github.com/jcubic/leash/commit/b8a5933)), closes [#6](https://github.com/jcubic/leash/issues/6)
* Fix add user that was breaking installation and update readme ([544d001](https://github.com/jcubic/leash/commit/544d001))
* Fix error message for guest commands imprive invalid string regex and fix completion ([3a60543](https://github.com/jcubic/leash/commit/3a60543))
* Fix gest command split regex ([71d8b06](https://github.com/jcubic/leash/commit/71d8b06))
* Fix guest commnad validation ([f27c4c3](https://github.com/jcubic/leash/commit/f27c4c3))
* fix hide prompt on pause and some refactoring ([6dcc448](https://github.com/jcubic/leash/commit/6dcc448))
* Fix single file upload in no chrome browsers ([a085cd4](https://github.com/jcubic/leash/commit/a085cd4))
* Fix sqlite command, add guest user and fix ANSI formatting ([dea6c6d](https://github.com/jcubic/leash/commit/dea6c6d))
* Fix token in completion and refresh dir when upload files ([bf71e09](https://github.com/jcubic/leash/commit/bf71e09))
* Fix upload path ([506d542](https://github.com/jcubic/leash/commit/506d542))
* ignore jsvi ([84c2a67](https://github.com/jcubic/leash/commit/84c2a67))
* new version of terminal, use substring from terminal and fix quote in wikipedia ([24b6004](https://github.com/jcubic/leash/commit/24b6004))
* progress indicator when updating ([efa461b](https://github.com/jcubic/leash/commit/efa461b))
* session storage set/get, fix home directory, real guest user and add deluser command ([9e37981](https://github.com/jcubic/leash/commit/9e37981))
* su -u guest without password ([c630235](https://github.com/jcubic/leash/commit/c630235))
* su command with password for guest ([646029c](https://github.com/jcubic/leash/commit/646029c))
* Update jQuery Terminal ([6f3a2b3](https://github.com/jcubic/leash/commit/6f3a2b3))
* Update readme ([769e2ae](https://github.com/jcubic/leash/commit/769e2ae))
* Update README with sudo and guest options ([491dcbf](https://github.com/jcubic/leash/commit/491dcbf))
* use unbuffer to fake tty and fix id in json-rpc ([a145374](https://github.com/jcubic/leash/commit/a145374))



<a name="0.14.0"></a>
# 0.14.0 (2017-04-12)

* Add sudo option to shell and /me to homepage ([96d3d17](https://github.com/jcubic/leash/commit/96d3d17))
* Fix  multi upload in chrome ([e0e771f](https://github.com/jcubic/leash/commit/e0e771f))
* version 0.14.0 ([1843d8f](https://github.com/jcubic/leash/commit/1843d8f))



<a name="0.13.1"></a>
## 0.13.1 (2017-03-13)

* (c) 2017 ([1b82e03](https://github.com/jcubic/leash/commit/1b82e03))
* 2016 -> 2017 ([a15fdfd](https://github.com/jcubic/leash/commit/a15fdfd))
* Add github repos browser ([87bbe3e](https://github.com/jcubic/leash/commit/87bbe3e))
* Add HOME variable so you can call cd without arguments ([06c4f28](https://github.com/jcubic/leash/commit/06c4f28))
* Add syntax highlight for sql commands ([9c22ec4](https://github.com/jcubic/leash/commit/9c22ec4))
* Attempt to prevent clearing of config.json file and add Logger for debugging ([b9d39a6](https://github.com/jcubic/leash/commit/b9d39a6))
* Fix completion with latest jQuery Terminal ([d9c3060](https://github.com/jcubic/leash/commit/d9c3060))
* make ([f43444f](https://github.com/jcubic/leash/commit/f43444f))
* remove console.log ([c0157ac](https://github.com/jcubic/leash/commit/c0157ac))
* small fixes to upload code + run make ([4a2e417](https://github.com/jcubic/leash/commit/4a2e417))
* update jQuery terminal ([50ef26a](https://github.com/jcubic/leash/commit/50ef26a))
* Update jQuery Terminal ([4b9aac3](https://github.com/jcubic/leash/commit/4b9aac3))
* Update jQuery Terminal ([55c25fc](https://github.com/jcubic/leash/commit/55c25fc))
* Upload of directories in FF and Chrome + refactor upload code ([c597ed9](https://github.com/jcubic/leash/commit/c597ed9))
* version 0.13.0 ([b7c1ae3](https://github.com/jcubic/leash/commit/b7c1ae3))



<a name="0.12.1"></a>
## 0.12.1 (2016-12-25)

* Fix ascii table ([49250ad](https://github.com/jcubic/leash/commit/49250ad))



<a name="0.12.0"></a>
# 0.12.0 (2016-12-24)

* call fill-paragraph on license text ([6cdc888](https://github.com/jcubic/leash/commit/6cdc888))
* Check token in command_exists ([e4a1f07](https://github.com/jcubic/leash/commit/e4a1f07))
* Fetch html2text from github on install ([a8d13b1](https://github.com/jcubic/leash/commit/a8d13b1))
* Fix ascii table for characters that have different width ([f32075f](https://github.com/jcubic/leash/commit/f32075f))
* Fix body overflow in Chrome when there is download bar ([d53594d](https://github.com/jcubic/leash/commit/d53594d))
* Fix error in configure and fix errors when no shell ([2e5bb2d](https://github.com/jcubic/leash/commit/2e5bb2d))
* Fix tabs in ascii_table ([41a458e](https://github.com/jcubic/leash/commit/41a458e))
* New version ([aa165e6](https://github.com/jcubic/leash/commit/aa165e6))
* Remove test command ([c03e8fb](https://github.com/jcubic/leash/commit/c03e8fb))
* search for .bashrc in current directory when shell is system ([ae96f46](https://github.com/jcubic/leash/commit/ae96f46))
* Update jQuery Terminal ([f616eee](https://github.com/jcubic/leash/commit/f616eee))
* Update readme ([0a34627](https://github.com/jcubic/leash/commit/0a34627))



<a name="0.10.0"></a>
# 0.10.0 (2016-08-23)

* Add completion for variables ([72ec43d](https://github.com/jcubic/leash/commit/72ec43d))
* Add download command ([8053f90](https://github.com/jcubic/leash/commit/8053f90))
* Add help to sqlite and pause ([4926d82](https://github.com/jcubic/leash/commit/4926d82))
* add popd and pushd commands ([2acef46](https://github.com/jcubic/leash/commit/2acef46))
* Add zless, bzless and xzless commands ([34497ed](https://github.com/jcubic/leash/commit/34497ed))
* better help and call pause in timer command ([94e3698](https://github.com/jcubic/leash/commit/94e3698))
* Change to MIT license ([6088f9c](https://github.com/jcubic/leash/commit/6088f9c))
* detect DNS failure in json-rpc library ([fa63739](https://github.com/jcubic/leash/commit/fa63739))
* Don't save_state for jargon command on click if terminal's historyState is disabled ([6f5758a](https://github.com/jcubic/leash/commit/6f5758a))
* Fix content-length of download file ([8a1e65d](https://github.com/jcubic/leash/commit/8a1e65d))
* Fix license ([01489df](https://github.com/jcubic/leash/commit/01489df))
* Fix space after comma in jargon command ([ee38041](https://github.com/jcubic/leash/commit/ee38041))
* Fix sql when empty result ([d90c704](https://github.com/jcubic/leash/commit/d90c704))
* Fix tabs in ascii_table (sql results) ([24a046b](https://github.com/jcubic/leash/commit/24a046b))
* Remove micro reference, fix mysql command, update sysend ([40a5f8e](https://github.com/jcubic/leash/commit/40a5f8e))
* Remove micro reference, fix mysql command, update sysend ([cdb1981](https://github.com/jcubic/leash/commit/cdb1981))
* Swap completion cases ([2377717](https://github.com/jcubic/leash/commit/2377717))
* update jQuery Terminal ([bbdd9b6](https://github.com/jcubic/leash/commit/bbdd9b6))
* Use html2text php library for html JSON-RPC method used to view html pages in terminal ([6b2465b](https://github.com/jcubic/leash/commit/6b2465b))
* Use new html2text + missing MIT license + build ([ae28dee](https://github.com/jcubic/leash/commit/ae28dee))
* Use only one if ([1c980cf](https://github.com/jcubic/leash/commit/1c980cf))



<a name="0.9.3"></a>
## 0.9.3 (2016-05-05)

* Fix typo, php error and update jQuery Terminal ([ac8bdcc](https://github.com/jcubic/leash/commit/ac8bdcc))
* use jquery.terminal.min.js ([9195e01](https://github.com/jcubic/leash/commit/9195e01))



<a name="0.9.2"></a>
## 0.9.2 (2016-05-02)

* Add official website template to wikipedia command ([906bdac](https://github.com/jcubic/leash/commit/906bdac))



<a name="0.9.1"></a>
## 0.9.1 (2016-05-02)

* Add back exec permissions to executable ([90fe52c](https://github.com/jcubic/leash/commit/90fe52c))
* Fix space after comma regex for jargon command ([ae820fa](https://github.com/jcubic/leash/commit/ae820fa))
* Fix wikipedia's quote template ([349de40](https://github.com/jcubic/leash/commit/349de40))
* update jquery terminal ([9001efb](https://github.com/jcubic/leash/commit/9001efb))
* update version ([99408d2](https://github.com/jcubic/leash/commit/99408d2))



<a name="0.9.0"></a>
# 0.9.0 (2016-05-01)

* Add system shell + fix error when stop animation on ajax error ([9285cbb](https://github.com/jcubic/leash/commit/9285cbb))
* Add update command ([7b8e481](https://github.com/jcubic/leash/commit/7b8e481))
* Fix jargon command ([9c9096f](https://github.com/jcubic/leash/commit/9c9096f))
* Fix space after dot in jargon command ([d6760e4](https://github.com/jcubic/leash/commit/d6760e4))
* Fix terminal name of mysql command ([b9b27e2](https://github.com/jcubic/leash/commit/b9b27e2))
* Fix typo ([1c52fe6](https://github.com/jcubic/leash/commit/1c52fe6))
* Fix update command ([34d01d4](https://github.com/jcubic/leash/commit/34d01d4))
* remove sleep form leash commands ([54c54a6](https://github.com/jcubic/leash/commit/54c54a6))
* Save state after exec jargon and normal exec ([550ebf3](https://github.com/jcubic/leash/commit/550ebf3))
* Throw exception on wrong shell in config ([ba6c7ea](https://github.com/jcubic/leash/commit/ba6c7ea))
* Update minified jQuery ([3ad6bb2](https://github.com/jcubic/leash/commit/3ad6bb2))



<a name="0.8.1"></a>
## 0.8.1 (2016-03-25)

* Add rfc command + Fix ajax errors ([a3e1e0c](https://github.com/jcubic/leash/commit/a3e1e0c))
* Better cite template handling ([771d74b](https://github.com/jcubic/leash/commit/771d74b))
* Call resize only for current less ([b9602f4](https://github.com/jcubic/leash/commit/b9602f4))
* cell in ascii_table can have newlines ([562d962](https://github.com/jcubic/leash/commit/562d962))
* Disable version message when no version file ([897befb](https://github.com/jcubic/leash/commit/897befb))
* Don't process mailto links ([ea3d623](https://github.com/jcubic/leash/commit/ea3d623))
* Fix blockquote for wikipedia command ([9f1cbef](https://github.com/jcubic/leash/commit/9f1cbef))
* Fix for IPAc-en/IPA-en and new template lang-ar for wikipedia ([a03ece2](https://github.com/jcubic/leash/commit/a03ece2))
* Fix hashChange with dynamic prompt ([b50faaf](https://github.com/jcubic/leash/commit/b50faaf))
* Fix IMDb name template ([954e8b9](https://github.com/jcubic/leash/commit/954e8b9))
* Fix less resize ([203679c](https://github.com/jcubic/leash/commit/203679c))
* Fix nowiki regex ([400b004](https://github.com/jcubic/leash/commit/400b004))
* Fix printing sql results ([d8b65f1](https://github.com/jcubic/leash/commit/d8b65f1))
* Fix processing links ([6318a28](https://github.com/jcubic/leash/commit/6318a28))
* Fixes to wikipedia and less ([a316714](https://github.com/jcubic/leash/commit/a316714))
* Messages array + disable messages in config ([575a229](https://github.com/jcubic/leash/commit/575a229))
* More left and right if text is longer for less ([825f66e](https://github.com/jcubic/leash/commit/825f66e))
* parital yes and no templates can have wikilink ([5e71909](https://github.com/jcubic/leash/commit/5e71909))
* Phonetic and quote box templates + update jQuery Terminal ([4b29ee6](https://github.com/jcubic/leash/commit/4b29ee6))
* remove console.log ([05f9f75](https://github.com/jcubic/leash/commit/05f9f75))
* Remove console.log ([b7f34f2](https://github.com/jcubic/leash/commit/b7f34f2))
* Remove scroll left right for less ([e34755b](https://github.com/jcubic/leash/commit/e34755b))
* remove term parameter from less + trim of new lines and whitespace from rfc ([194e3e2](https://github.com/jcubic/leash/commit/194e3e2))
* Save/restore dir in export/import ([e169724](https://github.com/jcubic/leash/commit/e169724))
* Scroll left/right for less that work with terminal formatting ([e7f778e](https://github.com/jcubic/leash/commit/e7f778e))
* Search jargon file ([c02b378](https://github.com/jcubic/leash/commit/c02b378))
* Show message about new version of leash ([ad906ca](https://github.com/jcubic/leash/commit/ad906ca))
* trim version number ([337d831](https://github.com/jcubic/leash/commit/337d831))
* Update .bashrc ([e28ab16](https://github.com/jcubic/leash/commit/e28ab16))
* Update jQuery and use min version when not in debug mode ([b1f1f70](https://github.com/jcubic/leash/commit/b1f1f70))
* Update jQuery Terminal ([b35cd0b](https://github.com/jcubic/leash/commit/b35cd0b))
* Update jQuery Terminal ([3a2e256](https://github.com/jcubic/leash/commit/3a2e256))
* Update jQuery Terminal ([e9283c9](https://github.com/jcubic/leash/commit/e9283c9))
* Update readme ([8bc6476](https://github.com/jcubic/leash/commit/8bc6476))
* Update readme ([217c209](https://github.com/jcubic/leash/commit/217c209))
* Update unix formatting ([187c5be](https://github.com/jcubic/leash/commit/187c5be))
* Update version ([d6effed](https://github.com/jcubic/leash/commit/d6effed))
* Update year in copyright note ([8f3a808](https://github.com/jcubic/leash/commit/8f3a808))
* View urls in terminal ([750734a](https://github.com/jcubic/leash/commit/750734a))
* yes and no templates with optional text for wikipedia article ([ae2e8a3](https://github.com/jcubic/leash/commit/ae2e8a3))



<a name="0.7.9"></a>
## 0.7.9 (2016-01-23)

* Fix links in wikipedia command ([257423e](https://github.com/jcubic/leash/commit/257423e))
* Update version ([28b3222](https://github.com/jcubic/leash/commit/28b3222))



<a name="0.7.8"></a>
## 0.7.8 (2016-01-23)

* Add wiki search + fix less mousewheel ([7864451](https://github.com/jcubic/leash/commit/7864451))
* Extra new line before unordered list in wikipedia articles ([68188ac](https://github.com/jcubic/leash/commit/68188ac))
* Fix as of template ([2d5d720](https://github.com/jcubic/leash/commit/2d5d720))
* Fix lists for wikipedia command ([3be3f1e](https://github.com/jcubic/leash/commit/3be3f1e))
* Fix pre tag content for wikipedia command ([1fe29a6](https://github.com/jcubic/leash/commit/1fe29a6))
* Fix see also for wikipedia command ([7423576](https://github.com/jcubic/leash/commit/7423576))
* Fix wikipedia for Category articles ([2cdf066](https://github.com/jcubic/leash/commit/2cdf066))
* remove console.log ([3ccd355](https://github.com/jcubic/leash/commit/3ccd355))
* Update version ([4570f6e](https://github.com/jcubic/leash/commit/4570f6e))



<a name="0.7.7"></a>
## 0.7.7 (2016-01-21)

* Fix ascii table ([922fea2](https://github.com/jcubic/leash/commit/922fea2))
* Fixes to wikipedia command ([1c39f1c](https://github.com/jcubic/leash/commit/1c39f1c))



<a name="0.7.6"></a>
## 0.7.6 (2016-01-18)

* Fix tables and handle partial templates in wikipedia ([8e74f49](https://github.com/jcubic/leash/commit/8e74f49))



<a name="0.7.5"></a>
## 0.7.5 (2016-01-18)

* Add new line after main template in wikipedia article ([efc6842](https://github.com/jcubic/leash/commit/efc6842))
* Don't format links if they don't begin with ftp or http in wikipedia command ([63617db](https://github.com/jcubic/leash/commit/63617db))
* Fix elisis ellipsis ([deaff24](https://github.com/jcubic/leash/commit/deaff24))
* Fix tables for wikipedia ([6ab8e21](https://github.com/jcubic/leash/commit/6ab8e21))
* Handle as of template in wikipedia article ([246f615](https://github.com/jcubic/leash/commit/246f615))
* Improve as of template for wikipedia ([e9f5ca9](https://github.com/jcubic/leash/commit/e9f5ca9))



<a name="0.7.4"></a>
## 0.7.4 (2016-01-17)

* Fix table header in wikipedia command ([c1cd0c2](https://github.com/jcubic/leash/commit/c1cd0c2))
* Fix tables in wikipedia command ([bee6d81](https://github.com/jcubic/leash/commit/bee6d81))
* update jquery terminal ([d37bf31](https://github.com/jcubic/leash/commit/d37bf31))
* Update jQuery Terminal ([1a8e06f](https://github.com/jcubic/leash/commit/1a8e06f))
* Update unix Formatting ([35afa8a](https://github.com/jcubic/leash/commit/35afa8a))
* Update unix formatting file ([b54741f](https://github.com/jcubic/leash/commit/b54741f))
* Update version ([e715888](https://github.com/jcubic/leash/commit/e715888))



<a name="0.7.3"></a>
## 0.7.3 (2016-01-14)

* Fix no referrer ([a7e71e3](https://github.com/jcubic/leash/commit/a7e71e3))
* fix option linksNoReferrer ([9fe3437](https://github.com/jcubic/leash/commit/9fe3437))
* Fix urls in wikipedia command ([6569d12](https://github.com/jcubic/leash/commit/6569d12))
* remove console.log ([49037bf](https://github.com/jcubic/leash/commit/49037bf))
* Update jQuery Terminal ([b860249](https://github.com/jcubic/leash/commit/b860249))
* Update version ([9534845](https://github.com/jcubic/leash/commit/9534845))



<a name="0.7.2"></a>
## 0.7.2 (2016-01-14)

* handle blockquote and images for wikipedia command ([04e82d5](https://github.com/jcubic/leash/commit/04e82d5))
* Update version ([ecc02a6](https://github.com/jcubic/leash/commit/ecc02a6))



<a name="0.7.1"></a>
## 0.7.1 (2016-01-13)

* Fix single newline in wikipedia command ([8f5bad3](https://github.com/jcubic/leash/commit/8f5bad3))
* remove debug changes ([5998eb4](https://github.com/jcubic/leash/commit/5998eb4))



<a name="0.7.0"></a>
# 0.7.0 (2016-01-13)

* Add passwd command ([ce02a7d](https://github.com/jcubic/leash/commit/ce02a7d))
* Add purge command ([6f3a479](https://github.com/jcubic/leash/commit/6f3a479))
* Add timer command ([dcfc6e2](https://github.com/jcubic/leash/commit/dcfc6e2))
* Allow to click on wikipedia article ([44b70ad](https://github.com/jcubic/leash/commit/44b70ad))
* Ascii table for wikipedia, mysql and sqlite ([711695d](https://github.com/jcubic/leash/commit/711695d))
* cat without argument ([1a6dc3d](https://github.com/jcubic/leash/commit/1a6dc3d))
* check token in file rpc method ([691e5f5](https://github.com/jcubic/leash/commit/691e5f5))
* Close open mysql connections on connect ([1b804d9](https://github.com/jcubic/leash/commit/1b804d9))
* Disable history for yes/no question ([1592cc8](https://github.com/jcubic/leash/commit/1592cc8))
* Fix completion ([67c2e59](https://github.com/jcubic/leash/commit/67c2e59))
* Fix elipsis in jargon command ([76f3ff5](https://github.com/jcubic/leash/commit/76f3ff5))
* Fix file upload ([703eb03](https://github.com/jcubic/leash/commit/703eb03))
* Fix for php 5.3 ([c169070](https://github.com/jcubic/leash/commit/c169070))
* Fix multiline string in less + wikipedia command ([6c4462f](https://github.com/jcubic/leash/commit/6c4462f))
* Fix python intepreter ([609ef61](https://github.com/jcubic/leash/commit/609ef61))
* Fix removing files from wikipedia articles ([29213a0](https://github.com/jcubic/leash/commit/29213a0))
* Fix removing single new lines in wikipedia command ([dcd8c18](https://github.com/jcubic/leash/commit/dcd8c18))
* Fix shell_exec and restrict perl script ([561587a](https://github.com/jcubic/leash/commit/561587a))
* Fix spaces in jargon command ([c811bdf](https://github.com/jcubic/leash/commit/c811bdf))
* Fix sqlite query ([65d63c9](https://github.com/jcubic/leash/commit/65d63c9))
* Fix wikipedia and less commands ([807fb99](https://github.com/jcubic/leash/commit/807fb99))
* Fix Wikipedia articles references ([f4d6136](https://github.com/jcubic/leash/commit/f4d6136))
* Fix wikipedia command ([1f35aae](https://github.com/jcubic/leash/commit/1f35aae))
* Improve less search and man command ([bf89d14](https://github.com/jcubic/leash/commit/bf89d14))
* improve read from stdin ([7c6356d](https://github.com/jcubic/leash/commit/7c6356d))
* perl shell without cgi and json modules installed ([cde2fb0](https://github.com/jcubic/leash/commit/cde2fb0))
* Prevent caching files while in debug mode + mobile viewport ([09962b0](https://github.com/jcubic/leash/commit/09962b0))
* Refactor read from stdin ([bcfd69e](https://github.com/jcubic/leash/commit/bcfd69e))
* Refactor read from stdin ([203c80f](https://github.com/jcubic/leash/commit/203c80f))
* refactoring ([f5798a0](https://github.com/jcubic/leash/commit/f5798a0))
* refactoring ([b140037](https://github.com/jcubic/leash/commit/b140037))
* Remove command replacement from jargon command ([a890e50](https://github.com/jcubic/leash/commit/a890e50))
* remove newline at the end in jargon command ([605727d](https://github.com/jcubic/leash/commit/605727d))
* Remove requestAnimationFrame polyfill ([9613eda](https://github.com/jcubic/leash/commit/9613eda))
* remove setFetchMode in sqlite method ([38f4490](https://github.com/jcubic/leash/commit/38f4490))
* remove todo command + refactor sql keywords code ([0f6d6f0](https://github.com/jcubic/leash/commit/0f6d6f0))
* resume on wrong password ([e3a8ff3](https://github.com/jcubic/leash/commit/e3a8ff3))
* Resume on wrong password ([ea3cea5](https://github.com/jcubic/leash/commit/ea3cea5))
* Show the right error message when file is too big ([aec29e6](https://github.com/jcubic/leash/commit/aec29e6))
* update jQuery Terminal ([309dffc](https://github.com/jcubic/leash/commit/309dffc))
* Update jQuery terminal ([e183327](https://github.com/jcubic/leash/commit/e183327))
* Update jQuery terminal ([6893b9d](https://github.com/jcubic/leash/commit/6893b9d))
* Update jQuery Terminal ([7c87adc](https://github.com/jcubic/leash/commit/7c87adc))
* Update jQuery Terminal ([c815577](https://github.com/jcubic/leash/commit/c815577))
* Update jQuery Terminal ([50a95c5](https://github.com/jcubic/leash/commit/50a95c5))
* Update jQuery Terminal ([19a6b01](https://github.com/jcubic/leash/commit/19a6b01))
* Update jQuery Terminal ([7c77587](https://github.com/jcubic/leash/commit/7c77587))
* Update jQuery Terminal ([f47269e](https://github.com/jcubic/leash/commit/f47269e))
* Update jQuery Terminal ([59030f4](https://github.com/jcubic/leash/commit/59030f4))
* Update jQuery Terminal ([0511b00](https://github.com/jcubic/leash/commit/0511b00))
* Update jQuery Terminal ([d3ebb01](https://github.com/jcubic/leash/commit/d3ebb01))
* update Makefile and gitignore ([4b61ba0](https://github.com/jcubic/leash/commit/4b61ba0))
* Update readme ([deeb947](https://github.com/jcubic/leash/commit/deeb947))
* Update version ([c34047f](https://github.com/jcubic/leash/commit/c34047f))
* Update year ([52dab70](https://github.com/jcubic/leash/commit/52dab70))
* Upload larger files by chunks ([15e385e](https://github.com/jcubic/leash/commit/15e385e))
* Use __unset magic method in Session class ([2dc7677](https://github.com/jcubic/leash/commit/2dc7677))
* Use PDO::FETCH_ASSOC in jargon command ([c734fe9](https://github.com/jcubic/leash/commit/c734fe9))
* wikipedia without arguments + update readme ([fe48337](https://github.com/jcubic/leash/commit/fe48337))



<a name="0.6.0"></a>
# 0.6.0 (2015-12-24)

* Add perl shell + Fix python cgi ([319a6a5](https://github.com/jcubic/leash/commit/319a6a5))
* Add sqlite command ([928f6ab](https://github.com/jcubic/leash/commit/928f6ab))
* change path ([738d3c1](https://github.com/jcubic/leash/commit/738d3c1))
* Fix error handling for sqlite command ([c1987e3](https://github.com/jcubic/leash/commit/c1987e3))
* Improve less command ([3f69688](https://github.com/jcubic/leash/commit/3f69688))
* Jargon completion + universal SQLite classes ([cd71cb4](https://github.com/jcubic/leash/commit/cd71cb4))
* Update jquery terminal ([7f069cb](https://github.com/jcubic/leash/commit/7f069cb))
* Update version ([742c1ee](https://github.com/jcubic/leash/commit/742c1ee))
* Use PDO for SQLite and show error in jargon command ([3cf4016](https://github.com/jcubic/leash/commit/3cf4016))
* Use PDO to detect version of SQLite ([c9edd30](https://github.com/jcubic/leash/commit/c9edd30))



<a name="0.5.0"></a>
# 0.5.0 (2015-12-21)

* Add init.js file for jsvi ([8b0f99f](https://github.com/jcubic/leash/commit/8b0f99f))
* Add vi command ([edf9ee8](https://github.com/jcubic/leash/commit/edf9ee8))
* Better search in less command ([e8d8031](https://github.com/jcubic/leash/commit/e8d8031))
* Fix completion for files/dirs that contain spaces ([844f3bc](https://github.com/jcubic/leash/commit/844f3bc))
* Fix completion, update jquery terminal ([2e9363a](https://github.com/jcubic/leash/commit/2e9363a))
* Fix exit command ([6b26e83](https://github.com/jcubic/leash/commit/6b26e83))
* Fix jshint errors ([fe78aa0](https://github.com/jcubic/leash/commit/fe78aa0))
* Fix long lines in ymacs ([fa39b9a](https://github.com/jcubic/leash/commit/fa39b9a))
* Get token in fs_ functions ([9390d86](https://github.com/jcubic/leash/commit/9390d86))
* HTML5 drag and drop file upload ([fd9b67f](https://github.com/jcubic/leash/commit/fd9b67f))
* Remove micro ([3e31890](https://github.com/jcubic/leash/commit/3e31890))
* Update readme ([efe3859](https://github.com/jcubic/leash/commit/efe3859))
* Update version ([65136f8](https://github.com/jcubic/leash/commit/65136f8))
* Use Service::debug function ([aec792f](https://github.com/jcubic/leash/commit/aec792f))



<a name="0.4.0"></a>
# 0.4.0 (2015-12-19)

* Add exec permission ([d4790a5](https://github.com/jcubic/leash/commit/d4790a5))
* Add exec permission ([ff8db53](https://github.com/jcubic/leash/commit/ff8db53))
* Create LICENSE ([9ba133a](https://github.com/jcubic/leash/commit/9ba133a))
* Delete codemirror ([6c4a46d](https://github.com/jcubic/leash/commit/6c4a46d))
* Dynamic autocomplete ([e80d467](https://github.com/jcubic/leash/commit/e80d467))
* Escape shell output ([15c1094](https://github.com/jcubic/leash/commit/15c1094))
* Fix editing config.json file ([5f8ac98](https://github.com/jcubic/leash/commit/5f8ac98))
* Fix prompt ([0634ad8](https://github.com/jcubic/leash/commit/0634ad8))
* Fix prompt after login ([52f1e84](https://github.com/jcubic/leash/commit/52f1e84))
* Fix saving config.json file ([835c4fd](https://github.com/jcubic/leash/commit/835c4fd))
* remove init.js ([c51a85c](https://github.com/jcubic/leash/commit/c51a85c))
* remove reduntant file ([4d93604](https://github.com/jcubic/leash/commit/4d93604))
* remove resume from login ([01d54b2](https://github.com/jcubic/leash/commit/01d54b2))
* Reset prompt after config ([67b5a3f](https://github.com/jcubic/leash/commit/67b5a3f))
* Resume on wrong login ([f576681](https://github.com/jcubic/leash/commit/f576681))
* Rpc command with argument ([57a1da8](https://github.com/jcubic/leash/commit/57a1da8))
* setup home dir on install + fix error after picking a shell ([8ec1b2f](https://github.com/jcubic/leash/commit/8ec1b2f))
* Update jquery terminal ([6617062](https://github.com/jcubic/leash/commit/6617062))
* Update readme ([654941f](https://github.com/jcubic/leash/commit/654941f))
* Update version ([62bba9c](https://github.com/jcubic/leash/commit/62bba9c))
* Use comments option for uglifyjs in Makefile ([6966a48](https://github.com/jcubic/leash/commit/6966a48))
* Ymacs app ([a47363c](https://github.com/jcubic/leash/commit/a47363c))



<a name="0.3.0"></a>
# 0.3.0 (2015-08-25)

* Add .htaccess and .bashrc ([4240db2](https://github.com/jcubic/leash/commit/4240db2))
* Add empty /tmp ([3e99e0f](https://github.com/jcubic/leash/commit/3e99e0f))
* Add jargon command ([47195fe](https://github.com/jcubic/leash/commit/47195fe))
* Add license comment ([958a59e](https://github.com/jcubic/leash/commit/958a59e))
* Add micro editor ([4a9f570](https://github.com/jcubic/leash/commit/4a9f570))
* Add missing less command ([815b74f](https://github.com/jcubic/leash/commit/815b74f))
* add new jquery ([498cb57](https://github.com/jcubic/leash/commit/498cb57))
* Add optparse ([ac84669](https://github.com/jcubic/leash/commit/ac84669))
* Add python cgi based shell ([131953a](https://github.com/jcubic/leash/commit/131953a))
* Add python interpreter ([39adff2](https://github.com/jcubic/leash/commit/39adff2))
* Add Readme with ASCII art ([5b63773](https://github.com/jcubic/leash/commit/5b63773))
* Add submodules ([2caff1f](https://github.com/jcubic/leash/commit/2caff1f))
* Add terminal src file ([38bb10c](https://github.com/jcubic/leash/commit/38bb10c))
* autologin/autologout with 2 tabs open ([c314132](https://github.com/jcubic/leash/commit/c314132))
* Banner, basic shell, exec from hash ([e3e616c](https://github.com/jcubic/leash/commit/e3e616c))
* Code mirror - first app. Update json-rpc. User init file ([bf7ed8d](https://github.com/jcubic/leash/commit/bf7ed8d))
* Copy files from submodules ([871c53f](https://github.com/jcubic/leash/commit/871c53f))
* Copy RPC service from less-mess, basic login and installing ([275a8da](https://github.com/jcubic/leash/commit/275a8da))
* Copyright command + build date ([c675fff](https://github.com/jcubic/leash/commit/c675fff))
* Create leash jQuery plugin ([6d29a46](https://github.com/jcubic/leash/commit/6d29a46))
* don't use markdown for README ([7b11978](https://github.com/jcubic/leash/commit/7b11978))
* Fix banner ([3899156](https://github.com/jcubic/leash/commit/3899156))
* Fix instalation ([4005ded](https://github.com/jcubic/leash/commit/4005ded))
* fix less scrolling, update terminal ([3fd4dbf](https://github.com/jcubic/leash/commit/3fd4dbf))
* Fix mysql with CREATE/DELETE/INSERT ([d61a553](https://github.com/jcubic/leash/commit/d61a553))
* Fix python ([a3bbc27](https://github.com/jcubic/leash/commit/a3bbc27))
* handle wrong mysql password ([fd90efd](https://github.com/jcubic/leash/commit/fd90efd))
* Havy refactoring ([f3e3295](https://github.com/jcubic/leash/commit/f3e3295))
* history command, refactorings, file urls in exceptions display lines from files ([334113e](https://github.com/jcubic/leash/commit/334113e))
* Ignore config.json ([44f5716](https://github.com/jcubic/leash/commit/44f5716))
* Ignore tmp files ([1316803](https://github.com/jcubic/leash/commit/1316803))
* improve shell and session ([9193cb7](https://github.com/jcubic/leash/commit/9193cb7))
* less and man commands, improve mysql ([ffa3b7f](https://github.com/jcubic/leash/commit/ffa3b7f))
* minified files ([7ad9cad](https://github.com/jcubic/leash/commit/7ad9cad))
* More rebrand and micro js and css ([b4e09df](https://github.com/jcubic/leash/commit/b4e09df))
* Move code to bause.js, add make rules ([cc57f2f](https://github.com/jcubic/leash/commit/cc57f2f))
* move print file from exception to terminal ([8fd53d8](https://github.com/jcubic/leash/commit/8fd53d8))
* Mysql command, change hash function ([6652b6f](https://github.com/jcubic/leash/commit/6652b6f))
* pick shell and create username on install, use shell from install ([ec7a7f9](https://github.com/jcubic/leash/commit/ec7a7f9))
* Proper token check in python rpc, move sessions to /tmp, execute shell if python command have args ([3e25837](https://github.com/jcubic/leash/commit/3e25837))
* purge and reload commands, change hash function ([b3bf46a](https://github.com/jcubic/leash/commit/b3bf46a))
* Rebrand ([b7ff67d](https://github.com/jcubic/leash/commit/b7ff67d))
* Rebrand ([860e1bb](https://github.com/jcubic/leash/commit/860e1bb))
* Rebrand and few updates ([c96b3df](https://github.com/jcubic/leash/commit/c96b3df))
* Refresh terminal after change of height ([4636bdc](https://github.com/jcubic/leash/commit/4636bdc))
* Remove submodules ([621eb28](https://github.com/jcubic/leash/commit/621eb28))
* Show errors in mysql command; add copyright to minified js file ([5233d01](https://github.com/jcubic/leash/commit/5233d01))
* some 80 lines fixes ([63a2a01](https://github.com/jcubic/leash/commit/63a2a01))
* udpate terminal + splash screen + fix codemirror command ([14f7333](https://github.com/jcubic/leash/commit/14f7333))
* Update ([171819c](https://github.com/jcubic/leash/commit/171819c))
* Update copyright info ([62f5695](https://github.com/jcubic/leash/commit/62f5695))
* update css file ([aa8940e](https://github.com/jcubic/leash/commit/aa8940e))
* Update devel 0.9.0 terminal ([a63e983](https://github.com/jcubic/leash/commit/a63e983))
* update hash check in python, use local jQuery file ([d245d6c](https://github.com/jcubic/leash/commit/d245d6c))
* Update json-rpc ([8bc260b](https://github.com/jcubic/leash/commit/8bc260b))
* Update minified file ([39a56e0](https://github.com/jcubic/leash/commit/39a56e0))
* update readme ([8f3ebf8](https://github.com/jcubic/leash/commit/8f3ebf8))
* Update README ([f975e07](https://github.com/jcubic/leash/commit/f975e07))
* Update README ([7d5718d](https://github.com/jcubic/leash/commit/7d5718d))
* update terminal ([f4115ff](https://github.com/jcubic/leash/commit/f4115ff))
* update terminal ([f07c764](https://github.com/jcubic/leash/commit/f07c764))
* Update terminal ([6122db5](https://github.com/jcubic/leash/commit/6122db5))
* Update terminal css file ([7415fac](https://github.com/jcubic/leash/commit/7415fac))
* Update terminal lib ([4b60074](https://github.com/jcubic/leash/commit/4b60074))
* Update terminal repo ([e8cb5d4](https://github.com/jcubic/leash/commit/e8cb5d4))
* Update terminal submodule ([85f663e](https://github.com/jcubic/leash/commit/85f663e))
* Update terminal submodule ([fd47cd8](https://github.com/jcubic/leash/commit/fd47cd8))
* update use of terminal ([04694eb](https://github.com/jcubic/leash/commit/04694eb))
* Update version ([496cc4d](https://github.com/jcubic/leash/commit/496cc4d))
* use compgen for executables, empty string for mask password, fix bash set builtin ([6d0abe2](https://github.com/jcubic/leash/commit/6d0abe2))
* Use min verion of terminal ([21f6dad](https://github.com/jcubic/leash/commit/21f6dad))
* use new terminal from lib ([1fbb23f](https://github.com/jcubic/leash/commit/1fbb23f))



