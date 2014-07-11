$(function() {
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
    var keymaps = {};
    $.leash.then(function(leash) {
        leash.commands['cm'] = function(cmd, token, term) {
            loaded.then(function() {
                //$.terminal.active().hide();
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
                            if (!keymaps[value]) {
                                $.getScript(fname).then(function() {
                                    cm.setOption('keymap', value);
                                    keymaps[value] = true;
                                });
                            } else {
                                cm.setOption('keymap', value);
                            }   
                        }
                    });
                });
                parser.parse(cmd.args);
                var ext = fname.replace(/.+\./, '');
                var name = files_modes[ext];
                if (name) {
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
                leash.service.file(leash.token, fname)(function(err, file) {
                    if (err) {
                        term.error(err.message);
                    } else {
                        node.show();
                        cm.refresh();
                        cm.setOption('value', file);
                    }
                });
            });
        };
    });
});
