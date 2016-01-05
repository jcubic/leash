/**@license
 *  This file is part of Leash (Browser Shell)
 *  Copyright (c) 2013-2015 Jakub Jankiewicz <http://jcubic.pl>
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
var leash = (function() {
    var colors = $.omap({
        blue:  '#55f',
        green: '#4d4',
        grey:  '#999'
    }, function(_, color) {
        return function(str, style) {
            return '[[' + (style||'') + ';' + color + ';]' + str + ']';
        };
    });
    var copyright = [
        'Copyright (c) 2013-2014 Jakub Jankiewicz <http://jcubic.pl>',
        '',
        'This program is free software: you can redistribute it and/or modify',
        'it under the terms of the GNU General Public License as published by',
        'the Free Software Foundation, either version 3 of the License, or',
        '(at your option) any later version.',
        '',
        'This program is distributed in the hope that it will be useful,',
        'but WITHOUT ANY WARRANTY; without even the implied warranty of',
        'MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the',
        'GNU General Public License for more details.',
        '',
        'You should have received a copy of the GNU General Public License',
        'along with this program.  If not, see <http://www.gnu.org/licenses/>.'
    ].map(function(line) {
        return line === '' ? line : '  ' + line;
    }).join('\n');
    // -------------------------------------------------------------------------
    // fill text with char to have width of size
    function fill(str, size, chr) {
        if (size > str.length) {
            return fill(chr+str, size, chr);
        } else {
            return str;
        }
    }
    // -------------------------------------------------------------------------
    function keywords(uppercase) {
        var keywords = [];
        $.each(uppercase, function(_, keyword) {
            keywords.push(keyword);
            keywords.push(keyword.toLowerCase());
        });
        return keywords;
    }
    // -------------------------------------------------------------------------
    function mysql_keywords() {
        // mysql keywords from
        // http://dev.mysql.com/doc/refman/5.1/en/reserved-words.html
        var uppercase = [
            'ACCESSIBLE', 'ADD', 'ALL', 'ALTER', 'ANALYZE', 'AND', 'AS', 'ASC',
            'ASENSITIVE', 'BEFORE', 'BETWEEN', 'BIGINT', 'BINARY', 'BLOB',
            'BOTH', 'BY', 'CALL', 'CASCADE', 'CASE', 'CHANGE', 'CHAR',
            'CHARACTER', 'CHECK', 'COLLATE', 'COLUMN', 'CONDITION',
            'CONSTRAINT', 'CONTINUE', 'CONVERT', 'CREATE', 'CROSS',
            'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'CURRENT_USER',
            'CURSOR', 'DATABASE', 'DATABASES', 'DAY_HOUR', 'DAY_MICROSECOND',
            'DAY_MINUTE', 'DAY_SECOND', 'DEC', 'DECIMAL', 'DECLARE', 'DEFAULT',
            'DELAYED', 'DELETE', 'DESC', 'DESCRIBE', 'DETERMINISTIC',
            'DISTINCT', 'DISTINCTROW', 'DIV', 'DOUBLE', 'DROP', 'DUAL', 'EACH',
            'ELSE', 'ELSEIF', 'ENCLOSED', 'ESCAPED', 'EXISTS', 'EXIT',
            'EXPLAIN', 'FALSE', 'FETCH', 'FLOAT', 'FLOAT4', 'FLOAT8', 'FOR',
            'FORCE', 'FOREIGN', 'FROM', 'FULLTEXT', 'GRANT', 'GROUP', 'HAVING',
            'HIGH_PRIORITY', 'HOUR_MICROSECOND', 'HOUR_MINUTE', 'HOUR_SECOND',
            'IF', 'IGNORE', 'IN', 'INDEX', 'INFILE', 'INNER', 'INOUT',
            'INSENSITIVE', 'INSERT', 'INT', 'INT1', 'INT2', 'INT3', 'INT4',
            'INT8', 'INTEGER', 'INTERVAL', 'INTO', 'IS', 'ITERATE', 'JOIN',
            'KEY', 'KEYS', 'KILL', 'LEADING', 'LEAVE', 'LEFT', 'LIKE', 'LIMIT',
            'LINEAR', 'LINES', 'LOAD', 'LOCALTIME', 'LOCALTIMESTAMP', 'LOCK',
            'LONG', 'LONGBLOB', 'LONGTEXT', 'LOOP', 'LOW_PRIORITY',
            'MASTER_SSL_VERIFY_SERVER_CERT', 'MATCH', 'MEDIUMBLOB', 'MEDIUMINT',
            'MEDIUMTEXT', 'MIDDLEINT', 'MINUTE_MICROSECOND', 'MINUTE_SECOND',
            'MOD', 'MODIFIES', 'NATURAL', 'NOT', 'NO_WRITE_TO_BINLOG', 'NULL',
            'NUMERIC', 'ON', 'OPTIMIZE', 'OPTION', 'OPTIONALLY', 'OR', 'ORDER',
            'OUT', 'OUTER', 'OUTFILE', 'PRECISION', 'PRIMARY', 'PROCEDURE',
            'PURGE', 'RANGE', 'READ', 'READS', 'READ_WRITE', 'REAL',
            'REFERENCES', 'REGEXP', 'RELEASE', 'RENAME', 'REPEAT', 'REPLACE',
            'REQUIRE', 'RESTRICT', 'RETURN', 'REVOKE', 'RIGHT', 'RLIKE',
            'SCHEMA', 'SCHEMAS', 'SECOND_MICROSECOND', 'SELECT', 'SENSITIVE',
            'SEPARATOR', 'SET', 'SHOW', 'SMALLINT', 'SPATIAL', 'SPECIFIC',
            'SQL', 'SQLEXCEPTION', 'SQLSTATE', 'SQLWARNING', 'SQL_BIG_RESULT',
            'SQL_CALC_FOUND_ROWS', 'SQL_SMALL_RESULT', 'SSL', 'STARTING',
            'STRAIGHT_JOIN', 'TABLE', 'TERMINATED', 'THEN', 'TINYBLOB',
            'TINYINT', 'TINYTEXT', 'TO', 'TRAILING', 'TRIGGER', 'TRUE', 'UNDO',
            'UNION', 'UNIQUE', 'UNLOCK', 'UNSIGNED', 'UPDATE', 'USAGE', 'USE',
            'USING', 'UTC_DATE', 'UTC_TIME', 'UTC_TIMESTAMP', 'VALUES',
            'VARBINARY', 'VARCHAR', 'VARCHARACTER', 'VARYING', 'WHEN', 'WHERE',
            'WHILE', 'WITH', 'WRITE', 'XOR', 'YEAR_MONTH', 'ZEROFILL'];
        return keywords(uppercase);
    }
    // -------------------------------------------------------------------------
    function sqlite_keywords() {
        // sqlite keywords taken from
        // https://www.sqlite.org/lang_keywords.html
        var uppercase = [
            'ABORT', 'ACTION', 'ADD', 'AFTER', 'ALL', 'ALTER', 'ANALYZE', 'AND',
            'AS', 'ASC', 'ATTACH', 'AUTOINCREMENT', 'BEFORE', 'BEGIN',
            'BETWEEN', 'BY', 'CASCADE', 'CASE', 'CAST', 'CHECK', 'COLLATE',
            'COLUMN', 'COMMIT', 'CONFLICT', 'CONSTRAINT', 'CREATE', 'CROSS',
            'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'DATABASE',
            'DEFAULT', 'DEFERRABLE', 'DEFERRED', 'DELETE', 'DESC', 'DETACH',
            'DISTINCT', 'DROP', 'EACH', 'ELSE', 'END', 'ESCAPE', 'EXCEPT',
            'EXCLUSIVE', 'EXISTS', 'EXPLAIN', 'FAIL', 'FOR', 'FOREIGN', 'FROM',
            'FULL', 'GLOB', 'GROUP', 'HAVING', 'IF', 'IGNORE', 'IMMEDIATE',
            'IN', 'INDEX', 'INDEXED', 'INITIALLY', 'INNER', 'INSERT', 'INSTEAD',
            'INTERSECT', 'INTO', 'IS', 'ISNULL', 'JOIN', 'KEY', 'LEFT', 'LIKE',
            'LIMIT', 'MATCH', 'NATURAL', 'NO', 'NOT', 'NOTNULL', 'NULL', 'OF',
            'OFFSET', 'ON', 'OR', 'ORDER', 'OUTER', 'PLAN', 'PRAGMA', 'PRIMARY',
            'QUERY', 'RAISE', 'RECURSIVE', 'REFERENCES', 'REGEXP', 'REINDEX',
            'RELEASE', 'RENAME', 'REPLACE', 'RESTRICT', 'RIGHT', 'ROLLBACK',
            'ROW', 'SAVEPOINT', 'SELECT', 'SET', 'TABLE', 'TEMP', 'TEMPORARY',
            'THEN', 'TO', 'TRANSACTION', 'TRIGGER', 'UNION', 'UNIQUE', 'UPDATE',
            'USING', 'VACUUM', 'VALUES', 'VIEW', 'VIRTUAL', 'WHEN', 'WHERE',
            'WITH', 'WITHOUT'];
        return keywords(uppercase);
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
    return function(url) {
        var d = new $.Deferred();
        // callback to set invalid token on auth when there was an error
        var login_callback;
        rpc({
            url: url || '',
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
            // -----------------------------------------------------------------
            // :: LEASH
            // -----------------------------------------------------------------
            var home;
            var config;
            var dir = {};
            function expand_env_vars(command) {
                var fixed_command = command;
                $.each(leash.env, function(k, v) {
                    fixed_command = fixed_command.replace('$' + k, v);
                });
                return fixed_command;
            }
            function print_sql_result(err, result) {
                if (err) {
                    print_error(err);
                } else {
                    switch ($.type(result)) {
                    case 'array':
                        leash.terminal.echo(result.map(function(row_assoc) {
                            if (row_assoc instanceof Array) {
                                return $.terminal.escape_brackets(row_assoc.join(' | '));
                            } else {
                                var values = Object.keys(row_assoc).map(function(key) {
                                    return row_assoc[key];
                                });
                                return $.terminal.escape_brackets(values.join(' | '));
                            }
                        }).join('\n'));
                        break;
                    case 'number':
                        leash.terminal.echo('Query OK, ' + result +
                                            ' row affected');
                    }
                }
                leash.terminal.resume();
            }
            function print_error(err) {
                if (err.error) {
                    leash.terminal.error(err.error.message);
                    leash.terminal.error('in ' + err.error.file + ' at line ' +
                               err.error.at);
                    leash.terminal.error(err.error.line);
                } else {
                    leash.terminal.error(err.message);
                }
            }
            var leash = {
                version: '{{VERSION}}',
                date: '{{DATE}}',
                jargon: [],
                env: {},
                banner: function() {
                    var version = '';
                    // display version only if inside versioned file
                    if (!leash.version.match(/\{{2}VERSION\}{2}/)) {
                        version = ' v. ' + leash.version;
                    }
                    var build = '';
                    if (!leash.date.match(/\{{2}DATE\}{2}/)) {
                        build = 'build at: ' + leash.date;
                    }
                    var banner = [
                      '   __   _______   ______ __',
                      '  / /  / __/ _ | / __/ // /',
                      ' / /__/ _// __ |_\\ \\/ _  /',
                      '/____/___/_/ |_/___/_//_/  ' + version];
                    //'Today is: ' + (new Date()).toUTCString(),
                    if (build) {
                        banner.push(build);
                    }
                    banner.push('');
                    return banner.join('\n');
                },
                service: service,
                init: function(term) {
                    term.on('click', '.jargon', function() {
                        term.exec('jargon ' + $(this).data('text').replace(/\s/g, ' '));
                    }).on('click', '.exec', function() {
                        term.exec($(this).data('text'));
                    });
                    if (!leash.installed) {
                        leash.install(term);
                    } else {
                        leash.config(term);
                    }
                },
                interpreter: function(command, term) {
                    if (!leash.installed) {
                        term.error("Invalid command, you need to refresh the p"+
                                   "age");
                    } else {
                        var token = term.token();
                        leash.env.TOKEN = token;
                        var cmd = $.terminal.parse_command(command);
                        if (leash.commands[cmd.name]) {
                            leash.commands[cmd.name](cmd, token, term);
                        } else if (command !== '') {
                            leash.shell(command, token, term);
                        }
                    }

                },
                install: function(term) {
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
                            name: "home",
                            text: "Home directory"
                        },
                        {
                            name: "password",
                            mask: true
                        }
                    ];
                    term.echo("[[;#C78100;]You are running Leash for the first"+
                              " time. You need to configure it]\n");
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
                                service.test_shell(null, sh)(function(err, valid) {
                                    if (valid) {
                                        text += '&#91;[[b;'+colors.green+';]PASS]&#93;';
                                    } else {
                                        text += '&#91;[[b;'+colors.red+';]FAIL]&#93;';
                                    }
                                    term.echo(text);
                                    if (valid) {
                                        term.echo("Using shell " + sh);
                                        settings.shell = sh;
                                        continuation();
                                    } else {
                                        test_shells(rest, continuation);
                                    }
                                });
                            } else {
                                term.error("Not valid shell found");
                                term.error("You will not able to use Leash ful"+
                                           "ly");
                            }
                        }
                        term.echo("Detect Shell");
                        service.list_shells(null)(function(err, shells) {
                            test_shells(shells, function() {
                                service.configure(settings)(function(err) {
                                    term.resume();
                                    term.echo("Your instalation is complete no"+
                                              "w you can refresh the page and "+
                                              "login");
                                });
                            });
                        });
                    });
                },
                config: function(term) {
                    var token = term.token();
                    // check if token is valid
                    if (token) { // NOTE: this is also call after login
                        // we need pause so terminal don't resume in initialize
                        // function, also pause should always be called before
                        // ajax
                        term.pause();
                        service.valid_token(token)(function(err, valid) {
                            if (!valid) {
                                // inform onBeforeLogout to not logout from
                                // service
                                term.set_token(undefined);
                                term.logout();
                                term.resume();
                            } else {
                                service.jargon_list()(function(err, result) {
                                    if (!err) {
                                        leash.jargon = result;
                                    }
                                });
                                // TODO: serivce need to be call in pararell
                                // instead of function use promises
                                service.get_settings(token)(function(err, result) {
                                    if (err) {
                                        print_error(err);
                                        term.resume();
                                        return;
                                    }
                                    leash.settings = config = result;
                                    leash.cwd = config.home;
                                    service.dir(token, leash.cwd)(function(err, result) {
                                        dir = result;
                                        // we can set prompt after we have config
                                        term.set_prompt(leash.prompt);
                                        setTimeout(function() {
                                            term.resume();
                                        }, 100);
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
                shell: function(command, token, term) {
                    var re = /\|\s*less\s*$/;
                    term.pause();
                    if (command.match(re)) {
                        command = command.replace(re, '');
                        service.shell(token, command, leash.cwd)(function(err, res) {
                            if (err) {
                                print_error(err);
                            } else {
                                // even if empty
                                leash.less(res.output, term);
                            }
                            term.resume();
                        });
                    } else {
                        service.shell(token, command, leash.cwd)(function(err, res) {
                            if (err) {
                                print_error(err);
                                term.resume();
                            } else {
                                if (res.output) {
                                    var re = /\n(\x1b\[m)?$/;
                                    var output = res.output.replace(re, '').
                                        replace(/\[\[/g, '&#91;&#91;').
                                        replace(/\]\]/g, '&#93;&#93;');
                                    term.echo(output);
                                }
                                if (leash.cwd !== res.cwd) {
                                    leash.cwd = res.cwd;
                                    service.dir(token, leash.cwd)(function(err, result) {
                                        dir = result;
                                        term.resume();
                                    });
                                } else {
                                    term.resume();
                                }
                            }
                        });
                    }
                },
                less: function(string, term) {
                    if (typeof string != 'string') {
                        return;
                    }
                    var export_data = term.export_view();
                    var cols, rows;
                    var pos = 0;
                    //string = $.terminal.escape_brackets(string);
                    var original_lines = string.split('\n');
                    var lines = original_lines.slice();
                    var prompt;
                    function print() {
                        term.clear();
                        if (lines.length-pos > rows-1) {
                            prompt = ':';
                        } else {
                            prompt = '[[;;;inverted](END)]';
                        }
                        term.set_prompt(prompt);
                        term.echo(lines.slice(pos, pos+rows-1).join('\n'));
                    }
                    function refresh_view() {
                        cols = term.cols();
                        rows = term.rows();
                        print();
                    }
                    function quit() {
                        term.pop().import_view(export_data);
                        term.off('resize.less', refresh_view);
                    }
                    term.on('resize.less', refresh_view);
                    refresh_view();
                    term.mousewheel(function(event, delta) {
                        if (delta > 0) {
                            pos -= 10;
                            if (pos < 0) {
                                pos = 0;
                            }
                            print();
                        } else {
                            pos += 10;
                            if (pos-1 > lines.length-rows) {
                                pos = lines.length-rows+1;
                            }
                            print();
                        }
                    });
                    var in_search = false, last_found;
                    function search(string, start, reset) {
                        var regex = new RegExp($.terminal.escape_brackets(string)),
                            index = -1;
                        lines = original_lines.slice();
                        if (reset) {
                            index = pos = 0;
                        }
                        for (var i=start; i<lines.length; ++i) {
                            if (regex.test(lines[i])) {
                                lines[i] = lines[i].replace(string,
                                                            '[[;;;inverted]' +
                                                            string + ']');
                                if (index === -1) {
                                    index = pos = i;
                                }
                            }
                        }
                        print();
                        term.set_command(string);
                        term.set_prompt(prompt);
                        return index;
                    }
                    term.push($.noop, {
                        keydown: function(e) {
                            var command = term.get_command();
                            if (term.get_prompt() !== '/') {
                                if (e.which == 191) {
                                    term.set_prompt('/');
                                } else if (in_search &&
                                           $.inArray(e.which, [78, 80]) != -1) {
                                    if (e.which == 78) { // N
                                        if (last_found != -1) {
                                            last_found = search(command, last_found+1);
                                        }
                                    } else if (e.which == 80) { // P
                                        if (last_found != -1) {
                                            last_found = search(command, 0, true);
                                        }
                                    }
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
                                if (!e.ctrlKey && !e.alKey) {
                                    return false;
                                }
                            } else {
                                // search
                                if (e.which === 8 && command === '') {
                                    // backspace
                                    term.set_prompt(prompt);
                                } else if (e.which == 13) { // enter
                                    // basic search find only first
                                    if (command.length > 0) {
                                        in_search = true;
                                        last_found = search(command, 0);
                                    }
                                    return false;
                                }
                            }
                        },
                        prompt: prompt
                    });
                },
                completion: function(term, string, callback) {
                    var command = term.get_command();
                    function dirs_slash(dir) {
                        return (dir.dirs || []).map(function(dir) {
                            return dir + '/';
                        });
                    }
                    function fix_spaces(array) {
                        if (string.match(/^"/)) {
                            return array.map(function(item) {
                                return '"' + item
                            });
                        } else {
                            return array.map(function(item) {
                                return item.replace(/ /g, '\\ ');
                            });
                        }
                    }
                    var cmd = $.terminal.parse_command(command);
                    if (command.match(/^\s*[^\s]*$/) || command === '') {
                        var commands = Object.keys(leash.commands);
                        callback(commands.concat(dir.execs || []).
                            concat(config.executables));
                    } else {
                        var m = string.replace(/^"/, '').match(/(.*)\/([^\/]+)/);
                        var token = term.token(), path;
                        if (cmd.name == 'cd') {
                            if (m) {
                                path = leash.cwd + '/' + m[1];
                                service.dir(token, path)(function(err, result) {
                                    var dirs = (result.dirs || []).map(function(dir) {
                                        return m[1] + '/' + dir + '/';
                                    });
                                    callback(fix_spaces(dirs));
                                });
                            } else {
                                callback(fix_spaces(dirs_slash(dir)));
                            }
                        } else if (cmd.name == 'jargon') {
                            callback(fix_spaces(leash.jargon));
                        } else {
                            if (m) {
                                path = leash.cwd + '/' + m[1];
                                service.dir(token, path)(function(err, result) {
                                    var dirs = dirs_slash(result);
                                    var dirs_files = (result.files || []).concat(dirs).
                                        map(function(file_dir) {
                                            return m[1] + '/' + file_dir;
                                        });
                                    callback(fix_spaces(dirs_files));
                                });
                            } else {
                                var dirs_files = (dir.files || []).concat(dirs_slash(dir));
                                callback(fix_spaces(dirs_files));
                            }
                        }
                    }
                },
                commands: {
                    help: function() {

                    },
                    cat: function(cmd, token, term) {
                        if (cmd.command.match(/cat\s*$/)) {
                            term.push(function(text) {
                                term.echo(text);
                            }, {
                                prompt: ''
                            });
                        } else if (cmd.command.match(/cat\s*>+\s*\w+/)) {
                            var string = '';
                            var fname = cmd.args[cmd.args.length-1];
                            if (!fname.match(/^\//)) {
                                fname = leash.cwd + '/' + fname;
                            }
                            term.push(function(text) {
                                string += text + '\n';
                            }, {
                                prompt: '',
                                onExit: function() {
                                    if (cmd.args[0].match(/>>/)) {
                                        service.append(token, fname, string)(function(e,w) {
                                            if (!w) {
                                                term.error("Can't save file");
                                            }
                                        });
                                    } else {
                                        service.write(token, fname, string)(function(err, w) {
                                            if (!w) {
                                                term.error("Can't save file");
                                            }
                                        });
                                    }
                                },
                                completion: [] // turn of completion
                            });
                        } else {
                            leash.shell(cmd.command, token, term);
                        }
                    },
                    copyright: function(cmd, token, term) {
                        term.echo(copyright);
                    },
                    less: function(cmd, token, term) {
                        var shell_cmd = 'cat ' + cmd.args[0];
                        term.pause();
                        service.shell(token, shell_cmd, leash.cwd)(function(err, ret) {
                            if (err) {
                                print_error(err);
                            } else {
                                leash.less($.terminal.escape_brackets(ret.output), term);
                            }
                            term.resume();
                        });
                    },
                    record: function(cmd, token, term) {
                        if (cmd.args[0] == 'start') {
                            term.history_state(true);
                        } else if (cmd.args[0] == 'stop') {
                            term.history_state(false);
                        } else {
                            term.echo('usage:\n\trecord [stop|start]');
                        }
                    },
                    timer: function(cmd, token, term) {
                        function usage() {
                            term.echo('timer time\ntime - number [smh]');
                        }
                        if (cmd.args.length > 1) {
                            var time = cmd.args[0];
                            var m = time.match(/^([0-9.]+)([smh])$/);
                            if (m) {
                                var command = cmd.rest.trim().replace(/^[0-9.]+[smh]?/, '');
                                var time = parseFloat(m[1]);
                                switch(m[2]) {
                                case 'h':
                                    time *= 24
                                case 'm':
                                    time *= 60;
                                case 's':
                                    time *= 1000;
                                }
                                setTimeout(function() {
                                    leash.interpreter(command, term);
                                }, time);
                            } else {
                                usage();
                            }
                        } else {
                            usage();
                        }
                    },
                    rpc: function(cmd, token, term) {
                        var name = cmd.args[0] || '', completion;
                        if (name === '') {
                            completion = function(term, string, callback) {
                                callback(Object.keys(service));
                            };
                        } else {
                            var defer = $.Deferred();
                            $.jrpc(name, 'system.describe', [], function(json) {
                                defer.resolve(json.procs.map(function(proc) {
                                    return proc.name;
                                }));
                            }, function(xhr, status, text) {
                                term.error('[AJAX]: ' + status);
                                term.resume();
                                if (status == "Invalid JSON") {
                                    term.error(xhr.responseText);
                                }
                                defer.reject();
                            });
                            completion = function(term, string, callback) {
                                defer.then(callback).fail(function() {
                                    callback([]);
                                });
                            };
                        }
                        term.push(function(command) {
                            var cmd = $.terminal.parse_command(expand_env_vars(command));
                            term.pause();
                            $.jrpc(name, cmd.name, cmd.args, function(json) {
                                if (json.error) {
                                    if (json.error.error) {
                                        var err = json.error.error;
                                        var file = err.file.replace(config.home,
                                                                    '');
                                        term.error(err.message + ' in ' + file +
                                                   ' at ' + err.at);
                                        term.error(err.line);
                                    } else if (json.error.message) {
                                        term.error(json.error.message);
                                    }
                                } else {
                                    term.echo(JSON.stringify(json.result));
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
                            completion: completion
                        });
                    },
                    jargon: function(cmd, token, term) {
                        if (!cmd.args.length) {
                            var msg = 'This is the Jargon File, a comprehensiv'+
                                'e compendium of hacker slang illuminating man'+
                                'y aspects of hackish tradition, folklore, and'+
                                ' humor.\n\nusage: jargon [QUERY]';
                            term.echo(msg, {keepWords: true});
                        } else {
                            term.pause();
                            // NOTE: when paste using mouse middle rpc jargon
                            //       function don't return result
                            var word = cmd.args.join(' ').replace(/\s+/g, ' ');
                            // TODO: echo function that will resize text based
                            //       on words
                            service.jargon(word)(function(err, result) {
                                if (err) {
                                    print_error(err);
                                } else {
                                    var def = $.map(result, function(entry) {
                                        var text = '[[b;#fff;]' + entry.term + ']';
                                        if (entry.abbr) {
                                            text += ' ('+entry.abbr.join(', ')+')';
                                        }
                                        return text + '\n' + entry.def + '\n';
                                    }).join('\n');
                                    term.echo(def.replace(/\n$/, ''), {
                                        keepWords: true
                                    });
                                }
                                term.resume();
                            });
                        }
                    },
                    man: function(cmd, token, term) {
                        term.pause();
                        service.shell(token, cmd.command, '/')(function(err, ret) {
                            leash.less(ret.output, term);
                            term.resume();
                        });
                    },
                    sqlite: function(cmd, token, term) {
                        term.pause();
                        var fn;
                        if (!cmd.args.length) {
                            term.error('You need to provide the file').resume();
                            return;
                        }
                        if (cmd.args[0].match(/^\//)) {
                            fn = cmd.args[0];
                        } else {
                            fn = leash.cwd + '/' + cmd.args[0];
                        }
                        function push(tables) {
                            term.push(function(q) {
                                leash.service.sqlite_query(token, fn, q)(print_sql_result);
                            }, {
                                name: 'sqlite',
                                prompt: 'sqlite> ',
                                completion: sqlite_keywords().concat(tables)
                            });
                        }
                        var query = 'SELECT name FROM sqlite_master WHERE type = "table"';
                        leash.service.sqlite_query(token, fn, query)(function(err, res) {
                            if (err) {
                                print_error(err);
                            } else {
                                push(res.map(function(assoc) {
                                    return assoc['name'];
                                }));
                            }
                            term.resume();
                        });
                    },
                    mysql: function(cmd, token, term) {
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
                            function mysql_query(query) {
                                term.pause();
                                service.mysql_query(token, db, query)(print_sql_result);
                            }
                            function mysql_close(db) {
                                service.mysql_close(token, db)(function() {
                                    var mysql = mysql_storage().filter(function(mysql_db) {
                                        return mysql_db != db;
                                    });
                                    save_mysql(mysql);
                                });
                            }
                            var prompt = '[[b;#55f;]mysql]> ';
                            function push(err, tables) {
                                tables = $.map(tables, function(row) {
                                    return row[0];
                                });
                                term.push(mysql_query, {
                                    prompt: prompt,
                                    onExit: function() {
                                        mysql_close(db);
                                    },
                                    completion: mysql_keywords().concat(tables)
                                }).resume();
                            }
                            function mysql_storage() {
                                var mysql;
                                try {
                                    mysql = JSON.parse($.Storage.get('leash_mysql'));
                                } catch(e) {
                                    mysql = [];
                                }
                                return mysql;
                            }
                            function save_mysql(mysql) {
                                $.Storage.set('leash_mysql', JSON.stringify(mysql));
                            }
                            mysql_storage().forEach(function(db) {
                                mysql_close(db);
                            });
                            service.mysql_connect(
                                token,
                                host,
                                username,
                                password,
                                database)(function(err, result) {
                                    if (err) {
                                        print_error(err);
                                        term.resume();
                                    } else {
                                        db = result;
                                        var mysql = mysql_storage();
                                        mysql.push(db);
                                        save_mysql(mysql);
                                        // fetch tables for tab completion
                                        service.mysql_query(
                                            token,
                                            db,
                                            'show tables')(push);
                                    }
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
                            }).set_mask('');
                        } else {
                            mysql();
                        }

                    },
                    js: function(cmd, token, term) {
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
                    },
                    python: function(cmd, token, term) {
                        if (cmd.args.length) {
                            // execute python as shell command
                            // you can call `python --version`
                            leash.shell(cmd.command, token, term);
                            return;
                        }
                        var url = 'cgi-bin/python.py?token=' + token;
                        python(term, url, function(py) {
                            var python_code = '';
                            var help_msg = "Type help() for interactive help," +
                                " or help(object) for help about object.";
                            term.push(function(command) {
                                if (command.match(/help/)) {
                                    if (command.match(/^help *$/)) {
                                        term.echo(help_msg);
                                    } else {
                                        var rgx = /help\((.*)\)/;
                                        py.evaluate(command.replace(rgx,
                                                                    'print $1.'+
                                                                    '__doc__'));
                                    }
                                } else if (command.match(/:\s*$/)) {
                                    python_code += command + "\n";
                                    term.set_prompt('... ');
                                } else if (python_code) {
                                    if (command === '') {
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
                                completion: false,
                                onExit: function() {
                                    py.destroy();
                                }
                            });
                        });
                    },
                    history: function(cmd, token, term) {
                        term.echo(term.history().data().join('\n'));
                    },
                    su: function(cmd, token, term) {
                        term.echo('testing command');
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
                    },
                    adduser: function(cmd, token, term) {
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
                    },
                    purge: function(cmd, token, term) {
                        term.logout().purge();
                    },
                } // commands
            }; // leash
            service.installed()(function(err, installed) {
                leash.installed = installed;
                if (installed) {
                    var username;
                    leash.greetings = leash.banner();
                    leash.prompt = function(callback) {
                        var server;
                        if (config && config.server) {
                            server = config.server;
                        } else {
                            server = 'unknown';
                        }
                        var path;
                        if (config && leash.cwd) {
                            var home = $.terminal.escape_regex(config.home);
                            var re = new RegExp('^' + home);
                            path = leash.cwd.replace(re, '~');
                        } else {
                            path = leash.cwd;
                        }
                        username = username || $.terminal.active().login_name();
                        callback(unix_prompt(username, server, path));
                    };
                    // for use with autologin
                    leash.set_login = function(user) {
                        username = user;
                    };
                    leash.login = function(user, password, callback) {
                        // TODO:
                        // store login callback to call with null on ajax error.
                        // Maybe rpc should have a way to append error callback
                        // so we will be able to append it here and remove on
                        // login success
                        // Solution: use promises in rpc
                        login_callback = callback;

                        // we need to pause because prompt was flickering
                        // and pause should be always called before ajax call
                        this.pause();
                        var self = this;
                        service.login(user, password)(function(err, token) {
                            login_callback = null; // we are fine now
                            username = user; // for use in prompt
                            leash.token = token;
                            if (token && typeof sysend != 'undefined') {
                                sysend.broadcast('leash.login', {
                                    user: user,
                                    token: token
                                });
                            }
                            callback(token);
                            if (!token) {
                                // we resume only on error because onInit call resume
                                // after it get config from server so we don't have
                                // undefined as server and path in prompt for a split
                                // of second
                                self.resume();
                            }
                        });
                    };
                } else {
                    leash.prompt = '> ';
                    leash.login = false;
                    leash.greetings = null;
                }
                d.resolve(leash);
            });
        });
        return d.promise();
    };
})();

(function($) {
    $.fn.leash = function(options) {
        if (!$.terminal || !$.fn.terminal) {
            throw new Error('You need to include jQuery terminal to use leash');
        }
        if (this.data('leash')) {
            return this.data('leash');
        }
        var d = $.Deferred();
        var len = this.size();
        var result = [];
        this.each(function(i) {
            var self = $(this);
            var leash_promise = leash();
            self.data('leash', leash_promise);
            leash_promise.then(function(leash) {
                var animation = false;
                var defaults = {
                    onInit: leash.init,
                    //maskChar: '',
                    completion: leash.completion,
                    linksNoReferer: true,
                    execHash: true,
                    historyFilter: /^[^\s]/,
                    /*
                    onResize: function(term) {
                        term.trigger('resize');
                    },
                    */
                    onBeforeLogout: function(term) {
                        var token = term.token();
                        // if token is invalid it will be set to undefined and
                        // this will not be triggered
                        if (token) {
                            leash.service.logout(token)(function() {
                                if (typeof sysend != 'undefined') {
                                    sysend.broadcast('leash.logout');
                                }
                                // nothing to do here, logout will remove
                                // the token
                            });
                        }
                    },
                    prompt: leash.prompt,
                    login: leash.login,
                    name: 'leash',
                    outputLimit: 500,
                    greetings: leash.greetings,
                    keydown: function(e) {
                        if (animation) {
                            return false;
                        }
                    }
                };
                var terminal = self.terminal(leash.interpreter,
                                             $.extend(defaults, options || {}));
                leash.terminal = terminal;
                terminal.on('drop', function(e) {
                    e.preventDefault();
                    var prompt;
                    var org = e.originalEvent;
                    var files = org.dataTransfer.files || org.target.files;
                    var token = terminal.token();
                    if (!token) {
                        return;
                    }
                    var anim = {
                        start: function(delay) {
                            var anim = ['/', '-', '\\', '|'], i = 0;
                            animation = true;
                            this.prompt = terminal.get_prompt();
                            var self = this;
                            (function animation() {
                                terminal.set_prompt(anim[i++]);
                                if (i > anim.length-1) {
                                    i = 0;
                                }
                                self.timer = setTimeout(animation, delay);
                            })();
                        },
                        stop: function() {
                            clearTimeout(this.timer);
                            terminal.set_prompt(this.prompt);
                            animation = false;
                        }
                    };
                    if (files.length) {
                        files = [].slice.call(files);
                        (function upload() {
                            var file = files.shift();
                            function uploadFile() {
                                var formData = new FormData();
                                formData.append('file', file);
                                formData.append('token', token);
                                formData.append('path', leash.cwd);
                                anim.start(400);
                                $.ajax({
                                    url: 'lib/upload.php',
                                    type: 'POST',
                                    success: function(response) {
                                        anim.stop();
                                        if (response.error) {
                                            terminal.error(response.error);
                                        } else {
                                            terminal.echo('File "' + file.name + '" ' +
                                                          'uploaded.');
                                        }
                                        upload();
                                    },
                                    error: function(jxhr, error, status) {
                                        terminal.error(jxhr.statusText);
                                        anim.stop();
                                    },
                                    data: formData,
                                    cache: false,
                                    contentType: false,
                                    processData: false
                                });
                            }
                            function maybe_ask(callback) {
                                leash.service.file_exists(fname)(function(err, exists) {
                                    if (exists) {
                                        var msg = 'File "' + file.name + '" exis'+
                                            'ts do you want to overwrite (Y/N)? ';
                                        terminal.push(function(yesno) {
                                            if (yesno.match(/^y$/i)) {
                                                // upload
                                                terminal.pop();
                                                callback();
                                            } else if (yesno.match(/^n$/i)) {
                                                terminal.pop();
                                                upload();
                                            }
                                        }, {
                                            prompt: msg
                                        });
                                    } else {
                                        callback();
                                    }
                                });
                            }
                            function upload_by_chunks() {
                                var chunk_size = 1048576; // 1MB
                                function slice(start, end) {
                                    if (file.slice) {
                                        return file.slice(start, end);
                                    } else if (file.webkitSlice) {
                                        return file.webkitSlice(start, end);
                                    }
                                }
                                var i = 0;
                                function process(start, end) {
                                    if (start < file.size) {
                                        var chunk = slice(start, end);
                                        var formData = new FormData();
                                        formData.append('file', chunk, file.name);
                                        formData.append('token', token);
                                        formData.append('path', leash.cwd);
                                        $.ajax({
                                            url: 'lib/upload.php?append=1',
                                            type: 'POST',
                                            success: function(response) {
                                                if (response.error) {
                                                    terminal.error(response.error);
                                                }
                                                process(end, end+chunk_size);
                                            },
                                            error: function(jxhr, error, status) {
                                                terminal.error(jxhr.statusText);
                                                anim.stop();
                                            },
                                            data: formData,
                                            cache: false,
                                            contentType: false,
                                            processData: false
                                        });
                                    } else {
                                        anim.stop();
                                        terminal.echo('File "' + file.name + '" uploaded.');
                                        upload();
                                    }
                                }
                                anim.start(400);
                                leash.service.unlink(token, fname)(function(err, del) {
                                    if (err) {
                                        leash.terminal.error(err.message);
                                        anim.stop();
                                    } else {
                                        process(0, chunk_size);
                                    }
                                });
                            }
                            if (file) {
                                var fname = leash.cwd + '/' + file.name;
                                if (file.size > leash.settings.upload_max_filesize) {
                                    if (!(file.slice || file.webkitSlice)) {
                                        terminal.error('Exceeded filesize limit.');
                                        upload();
                                    } else {
                                        maybe_ask(upload_by_chunks);
                                    }
                                } else {
                                    maybe_ask(uploadFile);
                                }
                            }
                        })();
                    }
                }).on('dragover', function(e) {
                    e.preventDefault();
                }).on('dragenter', function(e) {
                    e.preventDefault();
                });
                if (typeof sysend != 'undefined') {
                    sysend.on('leash.logout', function() {
                        // it look empty without echo prompt
                        leash.prompt(function(string) {
                            terminal.echo(string);
                        });
                        terminal.logout();
                    });
                    sysend.on('leash.login', function(data) {
                        terminal.autologin(data.user, data.token);
                        leash.set_login(data.user);
                    });
                }
                result.push(leash);
                if (len-1 == i) {
                    d.resolve.apply(d, result);
                }
            });
        });
        return d.promise();
    };
})(jQuery);
