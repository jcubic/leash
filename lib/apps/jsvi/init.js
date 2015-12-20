$(function() {
    var root = 'lib/apps/jsvi/';
    function style(url, callback) {
        $('<link/>').attr({
            href: url,
            rel: 'stylesheet'
        }).appendTo('head').load(callback);
    }
    var editor;
    var textarea;
    var defer = $.Deferred();
    style(root + 'vi.css', function() {
        $.getScript(root + 'vi.js').then(function() {
            textarea = $('<textarea></textarea>').appendTo('body').hide();
            defer.resolve();
        });
    });
    $.leash.then(function(leash) {
        leash.commands['vi'] = function(cmd, token, term) {
            defer.then(function() {
                var fname = cmd.args[0];
                term.focus(false);
                if (fname) {
                    var path;
                    if (fname.match(/^\//)) {
                        path = fname;
                    } else {
                        path = leash.cwd + '/' + fname;
                    }
                    leash.service.file(token, path)(function(err, file) {
                        textarea.val(file);
                        editor = window.editor = vi(textarea[0], {
                            color: '#ccc',
                            backgroundColor: '#000',
                            onSave: function() {
                                var file = textarea.val();
                                leash.service.write(token, path, file)(function() {
                                });
                            },
                            onExit: function() {
                                term.focus(true);
                            }
                        });
                    });
                }
            });
        };
    });
});
