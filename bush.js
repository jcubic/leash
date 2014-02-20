/**@license
 *  This file is part of Bush (Browser Unix Shell)
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
 *  Date: Thu, 20 Feb 2014 16:51:48 +0000
 */

var bush = {
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
                login_callback(null, true);
            }
        }
    })(function(service) {
        service.installed()(function(installed) {
            // display version only if inside versioned file
            function banner() {
                var version = !bush.version.match(/\{{2}VERSION\}{2}/) ? ' v. ' + bush.version : '';
                var banner = [
                    ' _               _',
                    '| |__  _   _ ___| |__',
                    '| \'_ \\| | | / __| \'_ \\' ,
                    '| |_) | |_| \\__ \\ | | |',
                    '|_.__/ \\__,_|___/_| |_|',
                    '[[b;#fff;]Browser Unix Shell' + version + ']',
                    'Today is: ' + (new Date()).toUTCString(),
                    ''
                ].join('\n');
                return banner;
            }
            var home;
            var cwd;
            var config;
            var dir = {};
            var invalid_token = false;
            var terminal = $('body').terminal(function interpreter(command, term) {
                if (!installed) {
                    term.error("Invalid command, you need to refresh the page");
                } else {
                    function not_implemented() {
                        term.echo("Yet to be implemented");
                    }
                    var cmd = $.terminal.parseCommand(command);
                    switch(cmd.name) {
                    case 'su':
                        term.login(term.settings.login, function() {
                            term.push(function(command) {
                                term.echo('[[i;;]' + command + ']');
                            }, {prompt: '$ '});
                        });
                        break;
                    case 'todo':
                        term.echo([
                            'record terminal keystroke with animation and allow to playback',
                            'guess login',
                            'drag and drop upload',
                            'filesystem API',
                            'Option to block access when 3 fail attempts (create file on disk and check if it exist)',
                            'less as command and as last command',
                            '[[;#fff;]cat] without argument',
                            'pick the shell',
                            '#["guess", "guess", "play: xxxx"]'
                        ].join('\n'));
                        break;
                    case 'rpc':
                        term.push(function(command) {
                            var cmd = $.terminal.parseCommand(command.replace('$TOKEN', term.token()));
                            $.jrpc('', cmd.name, cmd.args, function(result) {
                                if (result.error) {
                                    if (result.error.error) {
                                        var err = result.error.error;
                                        var file = err.file.replace(config.home,
                                                                    '');
                                        term.error(err.message + ' in ' + file +
                                                   ' at ' + err.at);
                                        term.error(err.line);
                                    } else if (result.error.message) {
                                        term.error(result.error.message);
                                    }
                                } else {
                                    term.echo(JSON.stringify(result.result));
                                }
                            }, function(xhr, status) {
                                term.error($.terminal.escape_brackets('[AJAX]: ') + status);
                            });
                        }, {
                            name: 'rpc',
                            prompt: 'rpc> ',
                            completion: Object.keys(service)
                        });
                        break;
                    case 'history':
                        term.echo("Should show history");
                        break;
                    case 'purge':
                        service.logout(term.token())(function() {
                            term.purge().logout();
                        });
                        break;
                    case 'js':
                        term.push(function(command, term) {
                            if (command !== undefined && command !== '') {
                                try {
                                    var result = window.eval(command);
                                    if (result !== undefined) {
                                        term.echo(new String(result));
                                    }
                                } catch(e) {
                                    term.error(new String(e));
                                }
                            }
                        }, {prompt: '[[;#D72424;]js]> ', name: 'js'});
                    case 'jargon':
                        if (cmd.args.length == 0) {
                            var msg = 'This is the Jargon File, a comprehensive'+
                                ' compendium of hacker slang illuminating many '+
                                'aspects of hackish tradition, folklore, and hu'+
                                'mor.\n\nusage: jargon [QUERY]';
                            term.echo(msg);
                        } else {
                            term.pause();
                            service.jargon(cmd.args.join(' '))(function(res) {
                                term.echo($.map(res, function(term) {
                                    var text = '[[b;#fff;]' + term.term + ']';
                                    if (term.abbr) {
                                        text += ' (' + term.abbr.join(', ') + ')';
                                    }
                                    return text + '\n' + term.def + '\n';
                                }).join('\n').replace(/\n$/, '')).resume();
                            });
                        }
                        break;
                    case 'sessions':
                    case 'sqlite':
                    case 'help':
                    case 'python':
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
                        term.pause();
                        var token = term.token();
                        service.shell(token, command, cwd)(function(result) {
                            if (result.output) {
                                term.echo(result.output);
                            }
                            if (cwd !== result.cwd) {
                                cwd = result.cwd;
                                // DIR
                            }
                            term.resume();
                        });
                    }
                }
            }, {
                greetings: installed ? null : banner(), // if installed there is onBeforeLogin
                prompt: installed ? function(callback) {
                    var server;
                    if (config && config.server) {
                        server = config.server;
                    } else {
                        server = 'unknown';
                    }
                    var path;
                    if (config && cwd) {
                        var home = $.terminal.escape_regex(config.home);
                        path = cwd.replace(new RegExp('^' + home), '~');
                    } else {
                        path = cwd;
                    }
                    callback(unix_prompt($.terminal.active().login_name(),
                                         server,
                                         path));
                } : '> ',
                onBeforeLogin: function(term) {
                    term.echo(banner());
                },
                outputLimit: 200,
                tabcompletion: true,
                onInit: function(term) {
                    term.on('click', '.jargon', function() {
                        var command = 'jargon ' + $(this).data('text').replace(/\s/g, ' ');
                        term.exec(command);
                    }).on('click', '.exec', function() {
                        term.exec($(this).data('text'));
                    });
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
                        // don't store user configuration
                        term.history().disable();
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
                            term.pause();
                            service.configure(settings)(function() {
                                term.resume().echo("Your instalation is complete now you can refresh the page and login");
                            });
                        });
                    }; // !instaled
                    var token = term.token();
                    // check if token is valid
                    if (token) { // NOTE: this is also call after login
                        term.pause();
                        service.valid_token(token)(function(valid) {
                            if (!valid) {
                                // inform onBeforeLogout to not logout
                                invalid_token = true;
                                term.logout();
                                term.resume();
                            } else {
                                service.get_settings(term.token())(function(result) {
                                    config = result;
                                    cwd = config.home;
                                    term.resume();
                                    if (config.purgeOnUnload) {
                                        $(window).unload(function() {
                                            term.purge();
                                        });
                                    }
                                });
                            }
                        });
                    }
                },
                completion: function(term, string, callback) {
                    callback(['help']);
                },
                onBeforeLogout: function(term) {
                    if (!invalid_token) {
                        service.logout(term.token())(function() {
                            // nothing to do here
                        });
                    }
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
            function exec_hash() {
                if (location.hash != '') {
                    var commands;
                    try {
                        commands = $.parseJSON(location.hash.replace(/^#/, ''));
                    } catch (e) {
                        //invalid json - ignore
                    }
                    if (commands) {
                        try {
                            $.each(commands, function(i, command) {
                                terminal.exec(command, command.match(/^ /));
                            });
                        } catch(e) {
                            terminal.error("Error while exec with command " +
                                           $.terminal.escape_brackets(command));
                        }
                    }
                }
            }
            exec_hash();
            $(window).hashchange(exec_hash);
            var $win = $(window);
            $win.resize(function() {
                var height = $win.height();
                terminal.css('height', height-20);
                $('#micro').height(height);
            }).resize();
        });
    });
});
