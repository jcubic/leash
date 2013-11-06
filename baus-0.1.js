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
    version: '0.1'
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
        return name + colors.grey(':') + colors.blue(path) + colors.grey('$ ');
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
            var project_name = [
                ' _                        _',
                '| |__   __ _ _   _ ___   (_)___',
                '| \'_ \\ / _` | | | / __|  | / __|',
                '| |_) | (_| | |_| \\__ \\_ | \\__ \\',
                '|_.__/ \\__,_|\\__,_|___(_)/ |___/',
                '                       |__/',
                'Browser Access Unix Shell v. ' + baus.version,
                ''
            ].join('\n');
            var terminal = $('body').terminal(function(command, term) {
                if (command === 'install') {
                    term.echo('Type your admin password');
                    term.set_mask(true);
                    term.push(function(password) {
                        term.pop();
                        term.set_mask(false);
                        service.set_admin_password(password)(function() {
                        });
                    }, {
                        prompt: 'password: '
                    });
                }
            }, {
                greetings: installed ? null : project_name,
                onBeforeLogin: function(term) {
                    term.echo(project_name);
                },
                onAfterLogin: function(term) {
                    login_callback = null;
                },
                tabcompletion: true,
                completion: function(term, string, callback) {
                    callback(['install']);
                },
                login: installed ? function(user, password, callback) {
                    login_callback = callback;
                    service.login(user, password)(callback);
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
