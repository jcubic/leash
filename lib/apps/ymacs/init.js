$(function() {
    var root = 'lib/apps/ymacs/';
    function style(url) {
        $('<link/>').attr({
            href: url,
            rel: 'stylesheet'
        }).appendTo('head');
    }
    var files = [
        'test/dl/js/thelib.js',
        'src/js/ymacs.js',
        'src/js/ymacs-keyboard.js',
        'src/js/ymacs-regexp.js',
        'src/js/ymacs-frame.js',
        'src/js/ymacs-textprop.js',
        'src/js/ymacs-exception.js',
        'src/js/ymacs-interactive.js',
        'src/js/ymacs-buffer.js',
        'src/js/ymacs-marker.js',
        'src/js/ymacs-commands.js',
        'src/js/ymacs-commands-utils.js',
        'src/js/ymacs-keymap.js',
        'src/js/ymacs-keymap-emacs.js',
        'src/js/ymacs-keymap-isearch.js',
        'src/js/ymacs-minibuffer.js',
        'src/js/ymacs-tokenizer.js',
        'src/js/ymacs-mode-paren-match.js',
        'src/js/ymacs-mode-lisp.js',
        'src/js/ymacs-mode-js.js',
        'src/js/ymacs-mode-xml.js',
        'src/js/ymacs-mode-css.js',
        'src/js/ymacs-mode-markdown.js',
    ];
    var defer = $.Deferred();
    (function loop(files) {
        if (files.length) {
            $.getScript(root + files[0]).then(function() {
                loop(files.slice(1));
            }).fail(function() {
                defer.reject();
            });
        } else {
            defer.resolve();
        }
    })(files);
    var desktop;
    var layout;
    defer.then(function() {
        var ymacs = window.ymacs = new Ymacs({
                buffers: [ ],
                className: "Ymacs-blinking-caret"
        });
        desktop = new DlDesktop({});
        layout = new DlLayout({ parent: desktop });
        ymacs.setColorTheme([ "dark", "y" ]);
        ymacs.disabled(true);
        layout.packWidget(ymacs, { pos: "bottom", fill: "*" });
        try {
            ymacs.getActiveBuffer().cmd("eval_file", ".ymacs");
        } catch(ex) {}
    }).fail(function() {
        console.log(arguments);
    });
    style(root + 'test/dl/new-theme/default.css');
    style(root + 'src/css/ymacs.css');
    $.leash.then(function(leash) {
        window.l = leash;
        var token = leash.terminal.token();
        defer.then(function() {
            Ymacs.prototype.fs_setFileContents = function(name, content, stamp, cont) {
                var self = this;
                if (stamp) {
                    leash.service.file(token, name)(function(err, file) {
                        if (file != stamp) {
                            cont(null);
                        } else {
                            self.fs_setFileContents(name, content, false, cont);
                        }
                    });
                } else {
                    leash.service.write(token, name, content)(function(err, written) {
                        if (written) {
                            cont(content);
                        } else {
                            self.getActiveBuffer().signalInfo("Can't save file");
                        }
                    });
                }
            };
            Ymacs.prototype.fs_getFileContents = function(name, nothrow, cont) {
                var self = this;
                leash.service.file_exists(name)(function(err, exists) {
                    if (!exists) {
                        cont(null, null);
                    } else {
                        leash.service.file(token, name)(function(err, file) {
                            if (file === null) {
                                if (!nothrow) {
                                    throw new Ymacs_Exception("File not found");
                                } else {
                                    self.getActiveBuffer().signalInfo("Can't open file");
                                }
                            } else {
                                cont(file, file);
                            }
                        });
                    }
                });
            };
            Ymacs.prototype.fs_fileType = function(name, cont) {
                leash.service.is_file(token, name)(function(is_file) {
                    cont(is_file ? true : null);
                });
            };
            Ymacs.prototype.fs_normalizePath = function(path) {
                return path;
            };
            Ymacs.prototype.fs_getDirectory = function(dir, cont) {
                leash.service.dir(token, dir)(function(err, obj) {
                    var result = {};
                    obj.dirs.forEach(function(dir) {
                        result[dir] = {type:'directory'};
                    });
                    obj.files.forEach(function(file) {
                        result[file] = {type:'file'};
                    });
                    cont(result);
                });
            };
            Ymacs_Buffer.newCommands({
                exit: Ymacs_Interactive(function() {
                    var buffs = ymacs.buffers.slice();
                    (function loop() {
                        var buff = buffs.shift();
                        if (buff.length > 1) {
                            function next() {
                                ymacs.killBuffer(buff);
                                loop();
                            }
                            if (buff.name != '*scratch*') {
                                if (buff.dirty()) {
                                    var msg = 'Save file ' + buff.name + ' yes or no?';
                                    buff.cmd('minibuffer_yn', msg, function(yes) {
                                        if (yes) {
                                            buff.cmd('save_buffer_with_continuation',
                                                     false,
                                                     next);
                                        } else {
                                            next();
                                        }
                                    });
                                } else {
                                    next();
                                }
                            }
                        } else {
                            $('.DlDesktop').hide();
                            ymacs.disabled(true);
                            leash.terminal.focus(true);
                        }
                    })();
                }),
                next_buffer: Ymacs_Interactive(function() {
                    var buffs = ymacs.buffers.slice();
                    var buff = ymacs.getActiveBuffer();
                    while(buffs.shift() != buff) {}
                    if (buffs.length) {
                        ymacs.switchToBuffer(buffs[0]);
                    } else {
                        ymacs.switchToBuffer(ymacs.buffers[0]);
                    }
                })
            });
            DEFINE_SINGLETON("Ymacs_Keymap_Leash", Ymacs_Keymap_Emacs, function(D, P) {
                D.KEYS = {
                    "C-x C-c": "exit"
                };
            });
        });
        // actual command
        leash.commands['ymacs'] = function(cmd, token, term) {
            defer.then(function() {
                var fname = cmd.args[0];
                function init() {
                    leash.terminal.focus(false);
                    $('.DlDesktop').show();
                    desktop.fullScreen();
                    ymacs.focus();
                    ymacs.disabled(false);
                    desktop.callHooks('onResize');
                }
                if (fname) {
                    var path;
                    if (fname.match(/^\//)) {
                        path = fname;
                    } else {
                        path = leash.cwd + '/' + fname;
                    }
                    init();
                    ymacs.getActiveBuffer().cmd('find_file', path);
                } else {
                    init();
                }
            });
        };
    });
});
