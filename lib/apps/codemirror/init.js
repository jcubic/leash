$(function() {
    // build code mirror
    var root = 'lib/apps/codemirror/';
    function style(url) {
        $('<link/>').attr({
            href: url,
            rel: 'stylesheet'
        }).appendTo('head');
    }
    var cm;
    var node;
    var loaded = (function() {
        var d = $.Deferred();
        // $.when don't work
        $.getScript(root + 'codemirror.js').then(function() {
            $.getScript(root + 'addon/display/fullscreen.js').then(function() {
                d.resolve();
            });
        });
        return d.promise();
    })();
    loaded.then(function() {
        cm = CodeMirror(function(elt) {
            node = $(elt).hide().prependTo('body');
        }, {
            fullScreen: true,
            lineNumbers: true,
            styleActiveLine: true,
            lineWrapping: true,
            matchBrackets: true,
            theme: 'tomorrow-night-eighties'
        });
    });
    style(root + 'codemirror.css');
    style(root + 'tomorrow-night-eighties.css');
    style(root + 'addon/display/fullscreen.css');
    var files_modes = {
        'js': 'javascript',
        'php': 'php'
    };
    var modes = {};
    $.leash.then(function(leash) {
        // actual command
        leash.commands['cm'] = function(cmd, token, term) {
            loaded.then(function() {
                var fname;
                var parser = new optparse.OptionParser([
                    ['-k', '--keymap EDITOR', 'name of kaymap']
                ]);
                parser.on(0, function(opt) {
                    fname = leash.cwd + "/" + opt;
                });
                parser.on('keymap', function(opt, value) {
                    var fname = root + 'keymap/' + value + '.js';
                    leash.service.file_exists(fname)(function(err, exist) {
                        if (exist) {
                            if (!CodeMirror.keyMap[value]) {
                                $.getScript(fname).then(function() {
                                    if (value == 'emacs') {
                                        CodeMirror.keyMap["emacs-Ctrl-X"]['Ctrl-C'] = function(cm) {
                                            cm.setOption('value', '');
                                            node.hide();
                                            term.enable();
                                        };
                                    }
                                    cm.setOption('keyMap', value);
                                });
                            } else {
                                cm.setOption('keyMap', value);
                            }
                        }
                    });
                });
                parser.parse(cmd.args);
                var ext = fname && fname.replace(/.+\./, '');
                var name = files_modes[ext];
                if (ext && name) {
                    if (!modes[name]) {
                        var mfname = 'mode/' + name + '/' + name + '.js';
                        $.getScript(root + mfname).then(function() {
                            cm.setOption('mode', name);
                            modes[name] = true;
                        });
                    } else {
                        cm.setOption('mode', name);
                    }
                }
                if (fname) {
                    leash.service.file(leash.token, fname)(function(err, file) {
                        if (err) {
                            term.error(err.message);
                        } else {
                            term.disable();
                            node.show();
                            cm.refresh();
                            cm.setOption('value', file);
                        }
                    });
                } else {
                    term.disable();
                    node.show();
                    cm.refresh();
                }
            });
        };
    });
});
