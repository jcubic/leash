/**@license
 *  This file is part of Bush (acronym for Browser Unix Shell)
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
 *  Date: {{DATE}}
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
            var version = !baus.version.match(/\{{2}VERSION\}{2}/) ? ' v. ' + baus.version : '';
            var project_name = [
                ' _               _',
                '| |__  _   _ ___| |__',
                '| \'_ \\| | | / __| \'_ \\' ,
                '| |_) | |_| \\__ \\ | | |',
                '|_.__/ \\__,_|___/_| |_|',
                ' [[b;#fff;]Browser Unix Shell 0.1' + version + ']',
                ''
            ].join('\n');
            var cwd = '~';
            var config;
            
            
            var terminal = $('body').terminal(function interpreter(command, term) {
                if (!installed) {
                    term.error("Invalid command, you need to refresh the page");
                } else {
                    function not_implemented() {
                        term.echo("Yet to be implemented");
                    }
                    var cmd = $.terminal.parseCommand(command);
                    switch(cmd.name) {
                        case 'help':
                            not_implemented();
                            break;
                        case 'su':
                            term.login(term.settings.login, function() {
                                term.push(function(command) {
                                    term.echo('[[i;;]' + command + ']');
                                }, {prompt: '$ '});
                            });
                            break;
                        case 'rpc':
                            term.push(function(command) {
                                var cmd = $.terminal.parseCommand(command.replace('$TOKEN', term.token()));
                                $.jrpc('', cmd.name, cmd.args, function(result) {
                                    if (result.error && result.error.message) {
                                        term.error(result.error.message);
                                    } else {
                                        term.echo(JSON.stringify(result.result));
                                    }
                                }, function(xhr, status) {
                                    term.error($.terminal.escape_brackets('[AJAX]: ') + status);
                                });
                            }, {
                                name: 'rpc',
                                prompt: 'rpc> '
                            });
                            break;
                        case 'sessions':
                            not_implemented();
                            break;
                        case 'sqlite':
                            not_implemented();
                            break;
                        case 'mysql':
                            not_implemented();
                            break;
                        case 'adduser':
                            (function() {
                                var user;
                                var password;
                                var history = term.history();
                                history.disable();
                                term.push(function(command) {
                                    if (!user) {
                                        user = command;
                                        term.set_mask(true).set_prompt('password: ');
                                    } else {
                                        password = command;
                                        term.set_mask(false).pop();
                                        service.add_user(term.token(), user, password)(function() {
                                            history.enable();
                                        });
                                    }
                                }, {prompt: 'name: '});
                            })();
                            break;
                        case 'micro':
                            var micro = $('#micro').micro({
                                height: $(window).height()
                            }).show();
                            if (cmd.args.length >= 1) {
                                service.file(term.token(), cmd.args[0])(function(file) {
                                    micro.micro('set', file);
                                });
                            }
                            break;
                        case 'vi':
                            not_implemented();
                            break;
                        default:
                            // shell
                    }
                }
            }, {
                greetings: installed ? null : project_name,
                prompt: installed ? function(callback) {
                    var server;
                    if (config && config.server) {
                        server = config.server;
                    } else {
                        server = 'unknown';
                    }
                    callback(unix_prompt($.terminal.active().login_name(), server, cwd));
                } : '> ',
                onBeforeLogin: function(term) {
                    term.echo(project_name);
                },
                onAfterLogin: function(term) {
                    login_callback = null;
                    term.pause();
                    service.get_settings(term.token())(function(result) {
                        config = result;
                        term.resume();
                    });
                },
                outputLimit: 200,
                tabcompletion: true,
                onInit: function(term) {
                    if (!installed) {
                        var settings = {};
                        // new settings set here
                        var questions = [
                            {
                                name: "password",
                                text: "Type your root password",
                                prompt: "password: ",
                                mask: true
                            },
                            {
                                name: "server",
                                text: "Type your server name",
                                prompt: "name: "
                            }
                        ];
                        term.echo("You are running Bush for the first time. You need to configure it\n");
                        (function install(step, finish) {
                            var question = questions[step];
                            if (question) {
                                term.echo(question.text).push(function(command) {
                                    term.pop();
                                    if (question.mask) {
                                        term.set_mask(false);
                                    }
                                    settings[question.name] = command;
                                    install(step+1, finish);
                                }, {
                                    prompt: question.prompt
                                });
                                if (question.mask) {
                                    term.set_mask(true);
                                }
                            } else {
                                finish();
                            }
                        })(0, function() {
                            term.echo(JSON.stringify(settings));
                            term.pause();
                            service.configure(settings)(function() {
                                term.resume().echo("Your instalation is complete now you can refresh the page and login");
                            });
                        });
                    };
                    var token = term.token();
                    // check if token is valid
                    if (token) {
                        term.pause();
                        service.valid_token(token)(function(valid) {
                            if (!valid) {
                                term.resume();
                                term.logout();
                            } else {
                                service.get_settings(term.token())(function(result) {
                                    config = result;
                                    term.resume();
                                });
                            }
                        });
                    }
                },
                completion: function(term, string, callback) {
                    callback(['help']);
                },
                login: installed ? function(user, password, callback) {
                    // store login callback to call with null on ajax error
                    login_callback = callback;
                    service.login(user, password)(function(token) {
                        callback(token);
                    });
                } : false
            }).css({
                overflow: 'auto'
            });
            var $win = $(window);
            $win.resize(function() {
                var height = $win.height();
                terminal.css('height', height-20);
                $('#micro').height(height);
            }).resize();
        });
    });
});
