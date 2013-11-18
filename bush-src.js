/**@license
 *  This file is part of Baus.js (acronym for Browser Access Unix Shell)
 *  Copyright (C) 2013  Jakub Jankiewicz <http://jcubic.pl>
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

var baus = {
    version: '{{VERSION}}'
};

$(function() {
    var colors = $.omap({
        blue:  '#55f',
        green: '#4d4',
        grey:  '#999'
    }, function(_, color) {
        return function(str) {
            return '[[;' + color + ';]' + str + ']';
        };
    });
    function unix_prompt(user, server, path) {
        var name = colors.green(user + '&#64;' + server);
        var end = colors.grey(user === 'root' ? '# ' : '$ ');
        return name + colors.grey(':') + colors.blue(path) + end;
    }
    var login_callback;
    rpc({
        url: '',
        error: function(error) {
            var message;
            if (error.error) {
                message = error.error.message + '\n[' + error.error.at + '] ' + error.error.line;
            } else {
                message = error.message || error;
            }
            var terminal = $.terminal.active();
            if (terminal) {
                terminal.resume();
                terminal.error(message);
            } else {
                alert(message);
            }
            if (login_callback) {
                login_callback(null);
            }
        }
    })(function(service) {
        service.installed()(function(installed) {
            // display version only if inside versioned file
            var version = baus.version != '{{VERSION}}' ? 'v. ' + baus.version : '';
            var project_name = [
                ' _                        _',
                '| |__   __ _ _   _ ___   (_)___',
                '| \'_ \\ / _` | | | / __|  | / __|',
                '| |_) | (_| | |_| \\__ \\_ | \\__ \\',
                '|_.__/ \\__,_|\\__,_|___(_)/ |___/',
                '                       |__/',
                'Browser Access Unix Shell' + version,
                ''
            ].join('\n');
            var cwd = '~';
            var terminal = $('body').terminal(function(command, term) {
                if (!installed) {
                    if (command === 'install') {
                        term.echo('Type your root password');
                        // Server Name
                        //
                        term.set_mask(true);
                        term.push(function(password) {
                            term.pop();
                            term.set_mask(false);
                            term.pause();
                            service.set_root_password(password)(function() {
                                term.resume();
                                term.echo("Your root password has been set");
                            });
                        }, {
                            prompt: 'password: '
                        });
                    }
                } else {
                    var cmd = $.terminal.parseCommand(command);
                    switch(cmd.name) {
                        case 'mysql':
                            break;
                        case 'adduser':
                            break;
                        case 'micro':
                            break;
                        default:
                            // shell
                    }
                }
            }, {
                greetings: installed ? null : project_name,
                prompt: installed ? function(callback) {
                    callback(unix_prompt($.terminal.active().login_name(), '???', cwd));
                } : '> ',
                onBeforeLogin: function(term) {
                    term.echo(project_name);
                },
                onAfterLogin: function(term) {
                    login_callback = null;
                },
                outputLimit: 200,
                tabcompletion: true,
                completion: function(term, string, callback) {
                    if (!installed) {
                        callback(['install', 'help']);
                    } else {
                        callback(['help']);
                    }
                },
                login: installed ? function(user, password, callback) {
                    login_callback = callback;
                    service.login(user, password)(function(token) {
                        callback(token);
                    });
                } : false
            }).css({
                overflow: 'auto'
            });
            $(window).resize(function() {
               terminal.css('height', $(window).height()-20);
            }).resize();
        });
    });
});
