/**@license
 *  This file is part of Leash (Browser Shell)
 *  Copyright (c) 2013-2016 Jakub Jankiewicz <http://jcubic.pl>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
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
                                leash.service.write(token, path, file)(function(err, wr) {
                                    if (err) {
                                        term.error(err.message);
                                    } else if (!wr) {
                                        term.error('Can\'t save file');
                                    }
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
