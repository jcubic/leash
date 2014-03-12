/**@license
 *  This file is part of Leash (Browser Shell)
 *  Copyright (c) 2014  Jakub Jankiewicz <http://jcubic.pl>
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
 *  Date: Wed, 12 Mar 2014 00:45:16 +0000
 */

var leash = {
    version: '0.1'
};
var init = false;
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
    // fill text with char to have width of size
    function fill(str, size, chr) {
        if (size > str.length) {
            return fill(chr+str, size, chr);
        } else {
            return str;
        }
    }
    // -------------------------------------------------------------------------
    // :: PYTHON INTERPRETER RPC HANDLER
    // -------------------------------------------------------------------------
    function python(terminal, url, success) {
        function ajax_error(xhr, status) {
            var msg = $.terminal.escape_brackets('[AJAX] ' + status +
                                                 ' server response\n' +
                                                 xhr.responseText);
            terminal.error(msg).resume();
        }
        function json_error(error) {
            if (typeof error == 'string') {
                terminal.error(error);
            } else {
                if (error.message) {
                    terminal.echo(error.message);
                }
                if (error.error.traceback) {
                    terminal.echo(error.error.traceback);
                }
            }
        }
        function rpc_py(method, params, echo) {
            if (params === undefined) {
                params = [];
            }
            terminal.pause();
            $.jrpc(url, method, params, function(data) {
                if (data.error) {
                    json_error(data.error);
                } else if (data.result) {
                    if (echo === undefined || echo) {
                        terminal.echo(data.result.replace(/\n$/, ''));
                    }
                }
                terminal.resume();
            }, ajax_error);
        }
        terminal.pause();
        var session_id;
        $.jrpc(url, 'start', [], function(data) {
            if (data.error) {
                json_error(data.error);
                terminal.resume();
            } else if (data.result) {
                session_id = data.result;
                terminal.echo('[[b;#F8B612;]Warring: each time you execute a c'+
                              'ommand, python will execute all your previous c'+
                              'ommands, so watch out on commands that can be e'+
                              'xecuted only once]');
                $.jrpc(url, 'info', [], function(data) {
                    if (data.error) {
                        json_error(data.error);
                    } else {
                        terminal.echo(data.result);
                    }
                    success({
                        evaluate: function(code) {
                            rpc_py('evaluate', [session_id, code]);
                        },
                        destroy: function() {
                            rpc_py('destroy', [session_id]);
                        }
                    });
                    terminal.resume();
                });
            }
        }, ajax_error);
    }
    // -------------------------------------------------------------------------
    // :: UNIX COLOR PROMPT
    // -------------------------------------------------------------------------
    function unix_prompt(user, server, path) {
        var name = colors.green(user + '&#64;' + server);
        var end = colors.grey(user === 'root' ? '# ' : '$ ');
        return name + colors.grey(':') + colors.blue(path) + end;
    }
    // -------------------------------------------------------------------------
    // :: INIT RPC
    // -------------------------------------------------------------------------
    var login_callback;
    rpc({
        url: '',
        error: function(error) {
            var message;
            if (error.error) {
                error = error.error;
                message = error.message + ' in ' + error.file +
                    '\n[' + error.at + '] ' + error.line;
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
        },
        debug: function(json, type) {
            var arrow = type == 'request' ? '->' : '<-';
            //console.log(arrow + ' ' + JSON.stringify(json));
        }
    })(function(service) {
        window.service = service; // allow access from js interpreter
        service.installed()(function(installed) {
            function banner() {
                var version = '';
                // display version only if inside versioned file
                if (!leash.version.match(/\{{2}VERSION\}{2}/)) {
                    version = ' v. ' + leash.version;
                }
                var banner = [
                  '   __   _______   ______ __',
                  '  / /  / __/ _ | / __/ // /',
                  ' / /__/ _// __ |_\\ \\/ _  /',
                  '/____/___/_/ |_/___/_//_/  ' + version,
                  'Today is: ' + (new Date()).toUTCString(),
                  ''
                ].join('\n');
                return banner;
            }
            var home;
            var cwd;
            var config;
            var dir = {};
            var resize = [];
            var invalid_token = false;
            terminal = $('#shell').terminal(function interpreter(command, term) {
                if (!installed) {
                    term.error("Invalid command, you need to refresh the page");
                } else {
                    function not_implemented() {
                        term.echo("Yet to be implemented");
                    }
                    var env = {
                        'TOKEN': term.token()
                    };
                    function expand_env_vars(command) {
                        var fixed_commend = command;
                        $.each(env, function(k, v) {
                            fixed_commend = fixed_commend.replace('$' + k, v);
                        });
                        return fixed_commend;
                    }
                    var cmd = $.terminal.parseCommand(command);
                    var token = term.token();
                    function shell() {
                        var re = /\| *less *$/;
                        term.pause();
                        if (command.match(re)) {
                            command = command.replace(re, '');
                            service.shell(token, command, cwd)(function(result) {
                                // even if empty
                                less(result.output);
                                term.resume();
                            });
                        } else {
                            service.shell(token, command, cwd)(function(result) {
                                if (result.output) {
                                    var re = /\n(\x1b\[m)?$/;
                                    term.echo(result.output.replace(re, ''));
                                }
                                if (cwd !== result.cwd) {
                                    cwd = result.cwd;
                                    service.dir(token, cwd)(function(result) {
                                        dir = result;
                                        term.resume();
                                    });
                                } else {
                                    term.resume();
                                }
                            });
                        }
                    }
                    function less(string) {
                        var export_data = term.export_view();
                        var cols, rows;
                        var pos = 0;
                        //string = $.terminal.escape_brackets(string);
                        var lines = string.split('\n');
                        function print() {
                            term.clear();
                            term.echo(lines.slice(pos, pos+rows-1).join('\n'));
                        }
                        function refresh_view() {
                            cols = term.cols();
                            rows = term.rows();
                            print();
                        }
                        function quit() {
                            term.pop().import_view(export_data);
                            for (var i=resize.length; i--;) {
                                if (resize[i] == refresh_view) {
                                    resize.splice(i, 1);
                                    break;
                                }
                            }
                        }
                        resize.push(refresh_view);
                        refresh_view();
                        var prompt;
                        if (lines.length > rows) {
                            prompt = ':';
                        } else {
                            prompt = '[[;;;inverted](END)]';
                        }
                        term.push($.noop, {
                            keydown: function(e) {
                                if (term.get_prompt() !== '/') {
                                    if (e.which == 191) {
                                        term.set_prompt('/');
                                    } else if (e.which == 81) { //Q
                                        quit();
                                    } else {
                                        // scroll
                                        if (lines.length > rows) {
                                            if (e.which === 38) { //up
                                                if (pos > 0) {
                                                    --pos;
                                                    print();
                                                }
                                            } else if (e.which === 40) { //down
                                                if (pos <= lines.length-rows) {
                                                    ++pos;
                                                    print();
                                                }
                                            } else if (e.which === 34) {
                                                // Page up
                                                pos += rows;
                                                if (pos > lines.length-rows+1) {
                                                    pos = lines.length-rows+1;
                                                }
                                                print();
                                            } else if (e.which === 33) {
                                                //Page Down
                                                pos -= rows;
                                                if (pos < 0) {
                                                    pos = 0;
                                                }
                                                print();
                                            }
                                        }
                                    }
                                    return false;
                                } else {
                                    var command = term.get_command();
                                    if (e.which === 8 && command === '') {
                                        // backspace
                                        term.set_prompt(prompt);
                                    } else if (e.which == 13) { // enter
                                        // basic search find only first
                                        // instance and don't mark the result
                                        if (command.length > 0) {
                                            var regex = new RegExp(command);
                                            for (var i=0; i<lines.length; ++i) {
                                                if (regex.test(lines[i])) {
                                                    pos = i;
                                                    print();
                                                    term.set_command('');
                                                    break;
                                                }
                                            }
                                            term.set_command('');
                                            term.set_prompt(prompt);
                                        }
                                        return false;
                                    }
                                }
                            },
                            prompt: prompt
                        });
                    }
                    switch(cmd.name) {
                    case 'echo':
                        console.log(cmd.args);
                        break;
                    case 'su':
                        term.push(function(command) {
                            term.echo('[[u;#fff;]' + command + ']');
                        }, {
                            prompt: '$ ',
                            login: function(user, pass, callback) {
                                if (user == 'demo' && pass == 'demo') {
                                    callback('xxx');
                                } else {
                                    callback(null);
                                }
                            }
                        });
                        break;
                    case 'todo':
                        term.echo([
                            'record terminal keystroke with animation and allow to playback',
                            'guess login',
                            'drag and drop upload',
                            'filesystem API',
                            'Option to block access when 3 fail attempts (create file on disk and check if it exist)',
                            '[[;#fff;]cat] without argument',
                            'pick the shell',
                            'timer 1s command',
                            'edit history',
                            '#["guess", "guess", "play: xxxx"]'
                        ].join('\n'));
                        break;
                    case 'timer':
                        break;
                    case 'reload':
                        location.reload();
                        break;
                    case 'man':
                        term.pause();
                        service.shell(token, command, '/')(function(ret) {
                            less(ret.output);
                            term.resume();
                        });
                        break;
                    case 'less':
                        term.pause();
                        service.shell(token, 'cat ' + cmd.args[0], cwd)(function(ret) {
                            less(ret.output);
                            term.resume();
                        });
                        break;
                    case 'rpc':
                        term.push(function(command) {
                            var cmd = $.terminal.parseCommand(expand_env_vars(command));
                            term.pause();
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
                                term.resume();
                            }, function(xhr, status, text) {
                                term.error('[AJAX]: ' + status);
                                term.resume();
                                if (status == "Invalid JSON") {
                                    term.error(xhr.responseText);
                                }
                            });
                        }, {
                            name: 'rpc',
                            prompt: 'rpc> ',
                            completion: Object.keys(service)
                        });
                        break;
                    case 'history':
                        term.echo(term.history().data().join('\n'));
                        break;
                    case 'purge':
                        term.logout().purge();
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
                        break;
                    case 'jargon':
                        if (!cmd.args.length) {
                            var msg = 'This is the Jargon File, a comprehensive'+
                                ' compendium of hacker slang illuminating many '+
                                'aspects of hackish tradition, folklore, and hu'+
                                'mor.\n\nusage: jargon [QUERY]';
                            term.echo(msg);
                        } else {
                            term.pause();
                            // NOTE: when paste using mouse middle rpc jargon function
                            //       don't return result
                            var word = cmd.args.join(' ').replace(/\s+/g, ' ');
                            // TODO: echo function that will resize text based on words
                            service.jargon(word)(function(result) {
                                term.echo($.map(result, function(entry) {
                                    var text = '[[b;#fff;]' + entry.term + ']';
                                    if (entry.abbr) {
                                        text += ' (' + entry.abbr.join(', ') + ')';
                                    }
                                    return text + '\n' + entry.def + '\n';
                                }).join('\n').replace(/\n$/, '')).resume();
                            });
                        }
                        break;
                    case 'sessions':
                        not_implemented();
                        break;
                    case 'sqlite':
                        not_implemented();
                        break;
                    case 'mysql':
                        (function() {
                            // mysql keywords from
                            // http://dev.mysql.com/doc/refman/5.1/en/reserved-words.html
                            var uppercase = [
                                'ACCESSIBLE', 'ADD', 'ALL', 'ALTER', 'ANALYZE',
                                'AND', 'AS', 'ASC', 'ASENSITIVE', 'BEFORE',
                                'BETWEEN', 'BIGINT', 'BINARY', 'BLOB', 'BOTH',
                                'BY', 'CALL', 'CASCADE', 'CASE', 'CHANGE',
                                'CHAR', 'CHARACTER', 'CHECK', 'COLLATE',
                                'COLUMN', 'CONDITION', 'CONSTRAINT', 'CONTINUE',
                                'CONVERT', 'CREATE', 'CROSS', 'CURRENT_DATE',
                                'CURRENT_TIME', 'CURRENT_TIMESTAMP',
                                'CURRENT_USER', 'CURSOR', 'DATABASE',
                                'DATABASES', 'DAY_HOUR', 'DAY_MICROSECOND',
                                'DAY_MINUTE', 'DAY_SECOND', 'DEC', 'DECIMAL',
                                'DECLARE', 'DEFAULT', 'DELAYED', 'DELETE',
                                'DESC', 'DESCRIBE', 'DETERMINISTIC', 'DISTINCT',
                                'DISTINCTROW', 'DIV', 'DOUBLE', 'DROP', 'DUAL',
                                'EACH', 'ELSE', 'ELSEIF', 'ENCLOSED', 'ESCAPED',
                                'EXISTS', 'EXIT', 'EXPLAIN', 'FALSE', 'FETCH',
                                'FLOAT', 'FLOAT4', 'FLOAT8', 'FOR', 'FORCE',
                                'FOREIGN', 'FROM', 'FULLTEXT', 'GRANT', 'GROUP',
                                'HAVING', 'HIGH_PRIORITY', 'HOUR_MICROSECOND',
                                'HOUR_MINUTE', 'HOUR_SECOND', 'IF', 'IGNORE',
                                'IN', 'INDEX', 'INFILE', 'INNER', 'INOUT',
                                'INSENSITIVE', 'INSERT', 'INT', 'INT1', 'INT2',
                                'INT3', 'INT4', 'INT8', 'INTEGER', 'INTERVAL',
                                'INTO', 'IS', 'ITERATE', 'JOIN', 'KEY', 'KEYS',
                                'KILL', 'LEADING', 'LEAVE', 'LEFT', 'LIKE',
                                'LIMIT', 'LINEAR', 'LINES', 'LOAD', 'LOCALTIME',
                                'LOCALTIMESTAMP', 'LOCK', 'LONG', 'LONGBLOB',
                                'LONGTEXT', 'LOOP', 'LOW_PRIORITY',
                                'MASTER_SSL_VERIFY_SERVER_CERT', 'MATCH',
                                'MEDIUMBLOB', 'MEDIUMINT', 'MEDIUMTEXT',
                                'MIDDLEINT', 'MINUTE_MICROSECOND',
                                'MINUTE_SECOND', 'MOD', 'MODIFIES', 'NATURAL',
                                'NOT', 'NO_WRITE_TO_BINLOG', 'NULL', 'NUMERIC',
                                'ON', 'OPTIMIZE', 'OPTION', 'OPTIONALLY', 'OR',
                                'ORDER', 'OUT', 'OUTER', 'OUTFILE', 'PRECISION',
                                'PRIMARY', 'PROCEDURE', 'PURGE', 'RANGE',
                                'READ', 'READS', 'READ_WRITE', 'REAL',
                                'REFERENCES', 'REGEXP', 'RELEASE', 'RENAME',
                                'REPEAT', 'REPLACE', 'REQUIRE', 'RESTRICT',
                                'RETURN', 'REVOKE', 'RIGHT', 'RLIKE', 'SCHEMA',
                                'SCHEMAS', 'SECOND_MICROSECOND', 'SELECT',
                                'SENSITIVE', 'SEPARATOR', 'SET', 'SHOW',
                                'SMALLINT', 'SPATIAL', 'SPECIFIC', 'SQL',
                                'SQLEXCEPTION', 'SQLSTATE', 'SQLWARNING',
                                'SQL_BIG_RESULT', 'SQL_CALC_FOUND_ROWS',
                                'SQL_SMALL_RESULT', 'SSL', 'STARTING',
                                'STRAIGHT_JOIN', 'TABLE', 'TERMINATED', 'THEN',
                                'TINYBLOB', 'TINYINT', 'TINYTEXT', 'TO',
                                'TRAILING', 'TRIGGER', 'TRUE', 'UNDO', 'UNION',
                                'UNIQUE', 'UNLOCK', 'UNSIGNED', 'UPDATE',
                                'USAGE', 'USE', 'USING', 'UTC_DATE', 'UTC_TIME',
                                'UTC_TIMESTAMP', 'VALUES', 'VARBINARY',
                                'VARCHAR', 'VARCHARACTER', 'VARYING', 'WHEN',
                                'WHERE', 'WHILE', 'WITH', 'WRITE', 'XOR',
                                'YEAR_MONTH', 'ZEROFILL'];
                            var keywords = [];
                            $.each(uppercase, function(_, keyword) {
                                keywords.push(keyword);
                                keywords.push(keyword.toLowerCase());
                            });
                            var database, host, username, password;
                            var parser = new optparse.OptionParser([
                                ['-h', '--host HOST', 'Host to connect to'],
                                ['-u', '--username USER', 'Database user'],
                                ['-p', '--password PASSWORD', 'Database password']
                            ]);
                            // fix options
                            var args = [];
                            for (var i=0; i<cmd.args.length; ++i) {
                                var m = cmd.args[i].match(/^(-[a-z])(.*)/);
                                if (m) {
                                    args.push(m[1]);
                                    if (m[2]) {
                                        args.push(m[2]);
                                    } else if (m[1] == '-p') {
                                        args.push('');
                                    }
                                } else {
                                    args.push(cmd.args[i]);
                                }
                            }
                            parser.on(0, function(opt) {
                                database = opt;
                            });
                            parser.on('host', function(opt, value) {
                                host = value;
                            });
                            parser.on('username', function(opt, value) {
                                username = value;
                            });
                            parser.on('password', function(opt, value) {
                                password = value;
                            });
                            parser.banner = 'Usage: mysql [Options] database';
                            parser.parse(args);
                            if (!(database && username)) {
                                term.echo(parser);
                                return;
                            }
                            host = host || 'localhost';
                            function mysql() {
                                term.pause();
                                var db;
                                function print(result) {
                                    switch ($.type(result)) {
                                    case 'array':
                                        term.echo(result.map(function(row) {
                                            return row.join(' | ');
                                        }).join('\n'));
                                        break;
                                    case 'number':
                                        term.echo('Query OK, ' + result +
                                                  ' row affected');
                                    }
                                    term.resume();
                                }
                                function mysql_query(query) {
                                    term.pause();
                                    service.mysql_query(token, db, query)(print);
                                }
                                function mysql_close() {
                                    service.mysql_close(token, db)($.noop);
                                }
                                var prompt = '[[b;#55f;]mysql]> ';
                                function push(tables) {
                                    tables = $.map(tables, function(row) {
                                        return row[0];
                                    });
                                    term.push(mysql_query, {
                                        prompt: prompt,
                                        onExit: mysql_close,
                                        completion: keywords.concat(tables)
                                    }).resume();
                                }
                                service.mysql_connect(
                                    token,
                                    host,
                                    username,
                                    password,
                                    database)(function(result) {
                                        db = result;
                                        // fetch tables for tab completion
                                        service.mysql_query(
                                            token,
                                            db,
                                            'show tables')(push);
                                });
                            }
                            if (!password) {
                                term.history().disable();
                                term.push(function(pass) {
                                    password = pass;
                                    term.pop().history().enable();
                                    mysql();
                                }, {
                                    prompt: 'password: '
                                }).set_mask(true);
                            } else {
                                mysql();
                            }
                        })();
                        break;
                    case 'help':
                        break;
                    case 'python':
                        if (cmd.args.length) {
                            // execute python as shell command
                            // you can call `python --version`
                            shell();
                            return;
                        }
                        var url = 'cgi-bin/python.py?token=' + token;
                        python(term, url, function(py) {
                            var python_code = '';
                            var help_msg = "Type help() for interactive help, or " +
                                "help(object) for help about object.";
                            term.push(function(command) {
                                if (command.match(/help/)) {
                                    if (command.match(/^help *$/)) {
                                        term.echo(help_msg);
                                    } else {
                                        var rgx = /help\((.*)\)/;
                                        py.evaluate(command.replace(rgx,
                                                                    'print $1.__doc__'));
                                    }
                                } else if (command.match(/: *$/)) {
                                    python_code += command + "\n";
                                    term.set_prompt('... ');
                                } else if (python_code) {
                                    if (command == '') {
                                        term.set_prompt('>>> ');
                                        py.evaluate(python_code);
                                        python_code = '';
                                    } else {
                                        python_code += command + "\n";
                                    }
                                } else {
                                    py.evaluate(command);
                                }
                            }, {
                                name: 'python',
                                prompt: '>>> ',
                                onExit: function() {
                                    py.destroy();
                                }
                            });
                        });
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
                                    service.add_user(token, user, password)(function() {
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
                            // cat is better beacause you will be able to open file in
                            // local directory
                            service.shell(token, 'cat ' + cmd.args[0], cwd)(function(ret) {
                                micro.micro('set', ret.output);
                            });
                            /*
                            service.file(token, cmd.args[0])(function(file) {
                                micro.micro('set', file);
                            });
                            */
                        }
                        break;
                    case 'vi':
                        not_implemented();
                        break;
                    default:
                        // everything else send to the shell
                        shell();
                    }
                }
            }, {
                // if installed there is onBeforeLogin
                greetings: installed ? null : banner(),
                prompt: installed ? function(callback) {
                    // -----------------------------------------------------------------
                    // :: PROMPT
                    // -----------------------------------------------------------------
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
                    var login = $.terminal.active().login_name();
                    callback(unix_prompt(login, server, path));
                } : '> ',
                onBeforeLogin: function(term) {
                    term.echo(banner());
                },
                historyFilter: function(command) {
                    return !command.match(/^ /);
                },
                outputLimit: 500,
                onResize: function(term) {
                    for (var i=resize.length;i--;) {
                        if (typeof resize[i] == 'function') {
                            resize[i](term);
                        }
                    }
                },
                onInit: function(term) {
                    // -----------------------------------------------------------------
                    // :: ONINIT
                    // -----------------------------------------------------------------
                    term.on('click', '.jargon', function() {
                        term.exec('jargon ' + $(this).data('text').replace(/\s/g, ' '));
                    }).on('click', '.exec', function() {
                        term.exec($(this).data('text'));
                    }).on('click', '.exception a', function() {
                        var url = $(this).attr('href');
                        var re = /(.*):([0-9]+):([0-9]+)$/;
                        // google chrome have line and column after filename
                        m = url.match(re);
                        if (m) {
                            // Display code of the file if line numbers are present
                            $.get(m[1], function(response) {
                                var prefix = location.href.replace(/[^\/]+$/, '');
                                var file = m[1].replace(prefix, '');
                                term.echo('[[b;white;]' + file + ']');
                                var code = response.split('\n');
                                var n = +m[2]-1;
                                term.echo(code.slice(n-2, n+3).map(function(line, i) {
                                    if (i == 2) {
                                        line = '[[;#f00;]' + line + ']';
                                    }
                                    return '[' + (n+i) + ']: ' + line;
                                }).join('\n'));
                            }, 'text');
                            return false;
                        }
                    });
                    if (!installed) {
                        var settings = {};
                        // new settings set here
                        var questions = [
                            {
                                name: "root_password",
                                prompt: "root password: ",
                                mask: true
                            },
                            {
                                name: "server",
                                text: "Type your server name",
                            },
                            {
                                name: "username",
                                text: "Your normal username"
                            },
                            {
                                name: "password",
                                mask: true
                            }
                        ];
                        term.echo("[[;#C78100;]You are running Leash for the first time."+
                                  " You need to configure it]\n");
                        // don't store user configuration
                        term.history().disable();
                        (function install(step, finish) {
                            var question = questions[step];
                            if (question) {
                                if (question.text) {
                                    term.echo('[[b;#fff;]' + question.text + ']');
                                }
                                term.push(function(command) {
                                    term.pop();
                                    if (question.mask) {
                                        term.set_mask(false);
                                    }
                                    settings[question.name] = command;
                                    install(step+1, finish);
                                }, {
                                    prompt: question.prompt || question.name + ": "
                                });
                                if (question.mask) {
                                    term.set_mask(true);
                                }
                            } else {
                                finish();
                            }
                        })(0, function() {
                            term.pause();
                            var colors = $.terminal.ansi_colors.bold;
                            // recursive call after ajax
                            function test_shells(shells, continuation) {
                                if (shells.length) {
                                    var sh = shells[0];
                                    var rest = shells.slice(1);
                                    var text = "Test Shell '" + sh + "' ";
                                    service.test_shell(token, sh)(function(valid) {
                                        if (valid) {
                                            text += '[[[b;' + colors.green +';]PASS]]';
                                        } else {
                                            text += '[[[b;' + colors.red + ';]FAIL]]';
                                        }
                                        term.echo(text);
                                        if (valid) {
                                            term.echo("Using shell " + sh);
                                            settings['shell'] = sh;
                                            continuation();
                                        } else {
                                            test_shells(rest, continuation);
                                        }
                                    });
                                } else {
                                    term.error("Not valid shell found");
                                    term.error("You will not able to use Leash fully");
                                }
                            }
                            term.echo("Detect Shell");
                            service.list_shells(token)(function(shells) {
                                test_shells(shells, function() {
                                    service.configure(settings)(function() {
                                        term.resume();
                                        term.echo("Your instalation is complete now you"+
                                                  "can refresh the page and login");
                                    });
                                });
                            });
                        });
                    } // !instaled
                    // -----------------------------------------------------------------
                    // :: CONFIG
                    // -----------------------------------------------------------------
                    var token = term.token();
                    // check if token is valid
                    if (token) { // NOTE: this is also call after login
                        // we need pause so terminal don't resume in initialize function
                        term.pause(); // also pause should always be called before ajax
                        service.valid_token(token)(function(valid) {
                            if (!valid) {
                                // inform onBeforeLogout to not logout
                                invalid_token = true;
                                term.logout();
                                term.resume();
                            } else {
                                // TODO: serice need to be call in pararell
                                // instead of function use promises
                                service.get_settings(token)(function(result) {
                                    config = result;
                                    cwd = config.home;
                                    service.dir(token, cwd)(function(result) {
                                        dir = result;
                                        term.resume();
                                    });
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
                    // TODO: use `dir` for completion
                    callback(['help']);
                },
                onBeforeLogout: function(term) {
                    if (!invalid_token) {
                        service.logout(term.token())(function() {
                            // nothing to do here, logout will remove the token
                        });
                    }
                },
                login: installed ? function(user, password, callback) {
                    // store login callback to call with null on ajax error. Maybe rpc
                    // should have a way to append error callback so we will be able
                    // to append it here and remove on login success
                    login_callback = callback;
                    // we need to pause because prompt was flickering
                    // and pause should be always called before ajax call
                    this.pause();
                    service.login(user, password)(function(token) {
                        // we don't call resume because it's called in onInit
                        // if we call it here if you execute login/password and command
                        // it will be executed before leash get config from the server
                        login_callback = null; // we are fine now
                        callback(token);
                    });
                } : false,
                name: 'leash'
            }).css({
                overflow: 'auto'
            });
            function exec_hash() {
                if (location.hash) {
                    var commands;
                    try {
                        commands = $.parseJSON(location.hash.replace(/^#/, ''));
                        $.each(commands, function(i, command) {
                            try {
                                terminal.exec(command);
                            } catch(e) {
                                var cmd = $.terminal.escape_brackets(command);
                                var msg = "Error while exec with command " + cmd;
                                terminal.error(msg).error(e.stack);
                            }
                        });
                    } catch (e) {
                        //invalid json - ignore
                    }
                }
            }
            var $win = $(window);
            $win.hashchange(exec_hash).hashchange().resize(function() {
                var height = $win.height();
                terminal.height(height-20)
                $('#micro').height(height);
            }).resize();
            terminal.resize();
        });
    });
});
