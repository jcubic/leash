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
        'Copyright (c) 2013-2016 Jakub Jankiewicz <http://jcubic.pl>',
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
                try {
                    error = JSON.parse(error);
                } catch(e) {}
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
                    terminal.error(message);
                    terminal.leash().then(function(leash) {
                        leash.animation.stop();
                        terminal.resume();
                    });
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
                        result = [Object.keys(result[0])].concat(result.map(function(row) {
                            if (row instanceof Array) {
                                return row.map(function(item) {
                                    return $.terminal.escape_brackets(String(item));
                                });
                            } else {
                                return Object.keys(row).map(function(key) {
                                    return $.terminal.escape_brackets(String(row[key]));
                                });
                            }
                        }));
                        leash.terminal.echo(ascii_table(result, true));
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
            function ascii_table(array, header) {
                if (!array.length) {
                    return '';
                }

                for (var i = array.length - 1; i >= 0; i--) {
                    var row = array[i];
                    var stacks = [];
                    for (var j = 0; j < row.length; j++) {
                        var new_lines = row[j].toString().split("\n");
                        row[j] = new_lines.shift();
                        stacks.push(new_lines);
                    }
                    var new_rows_count = Math.max.apply(Math, stacks.map(function(column) {
                        return column.length;
                    }));
                    for (var k = new_rows_count - 1; k >= 0; k--) {
                        array.splice(i + 1, 0, stacks.map(function(column) {
                            return column[k] || "";
                        }));
                    }
                }

                var lengths = array[0].map(function(_, i) {
                    var col = array.map(function(row) {
                        if (row[i] != undefined) {
                            return row[i].length;
                        } else {
                            return 0;
                        }
                    });
                    return Math.max.apply(Math, col);
                });
                array = array.map(function(row) {
                    return '| ' + row.map(function(item, i) {
                        var size = item.length;
                        if (size < lengths[i]) {
                            item += new Array(lengths[i] - size + 1).join(' ');
                        }
                        return item;
                    }).join(' | ') + ' |';
                });
                var sep = '+' + lengths.map(function(length) {
                    return new Array(length + 3).join('-');
                }).join('+') + '+';
                if (header) {
                    return sep + '\n' + array[0] + '\n' + sep + '\n' +
                        array.slice(1).join('\n') + '\n' + sep;
                } else {
                    return sep + '\n' + array.join('\n') + '\n' + sep;
                }
            }
            // used on exit from wikipedia to deterimine if turn on convertLinks
            var wiki_stack = [];
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
                      '/____/___/_/ |_/___/_//_/' + version];
                    //'Today is: ' + (new Date()).toUTCString(),
                    if (build) {
                        banner.push(build);
                    }
                    banner.push('');
                    return banner.join('\n');
                },
                animation: {
                    animating: false,
                    start: function(delay) {
                        var anim = ['/', '-', '\\', '|'], i = 0;
                        this.animating = true;
                        this.prompt = leash.terminal.get_prompt();
                        var self = this;
                        (function animation() {
                            leash.terminal.set_prompt(anim[i++]);
                            if (i > anim.length-1) {
                                i = 0;
                            }
                            self.timer = setTimeout(animation, delay);
                        })();
                    },
                    stop: function() {
                        clearTimeout(this.timer);
                        leash.terminal.set_prompt(this.prompt);
                        this.animating = false;
                    }
                },
                service: service,
                init: function(term) {
                    term.on('click', '.jargon', function() {
                        term.exec('jargon ' + $(this).data('text').replace(/\s/g, ' '));
                    }).on('click', '.exec', function() {
                        term.exec($(this).data('text'));
                    }).on('click', '.wiki', function() {
                        var article = $(this).data('text').replace(/\s/g, ' ');
                        var cmd = $.terminal.split_command('wikipedia ' + article);
                        leash.commands.wikipedia(cmd, term.token(), term);
                    }).on('click', '.rfc', function() {
                        var rfc = $(this).data('text');
                        var cmd = $.terminal.split_command('rfc ' + rfc);
                        leash.commands.rfc(cmd, term.token(), term);
                    }).on('click', 'a', function(e) {
                        if (!e.ctrlKey) {
                            var token = term.token();
                            var href = $(this).attr('href').trim();
                            if (href.match(/^mailto:/)) {
                                return;
                            }
                            leash.less(function(cols, callback) {
                                leash.service.html(token, href, cols-1)(function(err, page) {
                                    if (!err) {
                                        callback(page.trim().split('\n'));
                                    }
                                });
                            });
                            return false;
                        }
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
                                    if (result.show_messages !== false) {
                                        var messages = result.messages || [];
                                        term.echo(messages.map(function(msg) {
                                            return '[[;#ff0;]' + msg + ']';
                                        }).join('\n'));
                                    }
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
                                leash.less(res.output);
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
                                service.dir(token, leash.cwd)(function(err, result) {
                                    dir = result;
                                    term.resume();
                                });
                            }
                        });
                    }
                },
                wikipedia: function(text, title) {
                    function list(list) {
                        if (list.length == 1) {
                            return list[0]
                        } else if (list.length == 2) {
                            return list.join(' and ');
                        } else if (list.length > 2) {
                            return list.slice(0, list.length-1).join(', ') + ' and ' +
                                list[list.length-1];
                        }
                    }
                    function wiki_list(text) {
                        return list(text.split('|').map(function(wiki) {
                            if (wiki.match(/^\s*.*\s*=/)) {
                                return '';
                            } else {
                                return '[[bu;#fff;;wiki;]' + wiki + ']';
                            }
                        }).filter(function(item) {
                            return !!item;
                        }));
                    }
                    function word_template(content, color, default_text) {
                        var re = /\[\[([^\]]+)\]\]/;
                        if (content.match()) {
                            return content.split(/(\[\[[^\]]+\]\])/).map(function(text) {
                                var m = text.match(re);
                                if (m) {
                                    return '[[bu;' + color + ';;wiki]' + m[1] + ']';
                                } else {
                                    return '[[;' + color + ';]' + text + ']';
                                }
                            }).join('');
                        } else {
                            return '[[;' + color + ';]' + (content || default_text) + ']';
                        }
                    }
                    var templates = {
                        'main': function(content) {
                            return 'Main Article: ' + wiki_list(content) + '\n';
                        },
                        dunno: function() {
                            return '?';
                        },
                        yes: function(content) {
                            return word_template(content, '#0f0', 'yes');
                        },
                        no: function(content) {
                            return word_template(content, '#f00', 'no');
                        },
                        partial: function(content) {
                            return word_template(content, '#ff0', 'partial');
                        },
                        'lang-ar': function(content) {
                            return '[[bu;#fff;;;Arabic_language]Arabic]: ' + content;
                        },
                        '(?:IPAc-en|IPA-en)': function(content) {
                            if (!content.match(/\|/)) {
                                return 'English pronunciation: /' + content + '/';
                            }
                            var phonemes = {
                                'tS': 'tʃ', 'dZ': 'dʒ', 'J\\': 'ɟ', 'p\\': 'ɸ',
                                'B': 'β', 'T': 'θ', 'D': 'ð', 'S': 'ʃ', 'Z':
                                'ʒ', 'C': 'ç', 'j\\ (jj)': 'ʝ', 'G': 'ɣ', 'X\\':
                                'ħ', '?\\': 'ʕ', 'h\\': 'ɦ', 'F': 'ɱ', 'J': 'ɲ',
                                'N': 'ŋ', '4 (r)': 'ɾ', 'r (rr)': 'r', 'r\\':
                                'ɹ', 'R': 'ʀ', 'P': 'ʋ', 'H': 'ɥ', 'I': 'ɪ',
                                'E': 'ɛ', '{': 'æ', '2': 'ø', '9': 'œ', '1':
                                'i', '@': 'ə', '6': 'ɐ', '3': 'ɜ', '}': 'ʉ',
                                '8': 'ɵ', '&': 'ɶ', 'M': 'ɯ', '7': 'ɤ', 'V':
                                'ʌ', 'A': 'ɑ', 'U': 'ʊ', 'O': 'ɔ', 'Q': 'ɒ',
                                ',': 'ˌ', "'": 'ˈ', '_': 'ː'
                            };
                            var keys = {};
                            var pron = '/' + content.split('|').map(function(text) {
                                if (!text.match(/^\s*-\s*$|^\s*en-us/)) {
                                    var re = /^\s*(us|lang|pron|audio)\s*=?\s*(.*)/i;
                                    var m = text.match(re);
                                    if (m) {
                                        keys[m[1].toLowerCase().trim()] = m[2] || true;
                                    } else {
                                        Object.keys(phonemes).forEach(function(key) {
                                            text = text.replace(key, phonemes[key]);
                                        });
                                        return text;
                                    }
                                }
                            }).filter(Boolean).join('') + '/';
                            pron = '[[bu;#fff;;wiki;Help:IPA for English]' + pron + ']';
                            if (keys.pron) {
                                pron = 'pronunciation: ' + pron;
                            }
                            if (keys.lang) {
                                pron = 'English ' + pron;
                            }
                            if (keys.us) {
                                pron = 'US ' + pron;
                            }
                            return pron;
                        },
                        'quote box': function(content) {
                            var quote = content.match(/\s*quote\s*=\s*("[^"]+"|[^|]+)/)[1];
                            var bold_re = /'''([^']+(?:'[^']+)*)'''/g;
                            quote = quote.replace(bold_re, function(_, bold) {
                                return '][[bi;#fff;]' + bold + '][[i;;]';
                            }).replace(/''([^']+(?:'[^']+)*)''/g, '$1').
                                replace(/\[\[([^\]]+)\]\]/g, function(_, wiki) {
                                    wiki = wiki.split('|');
                                    if (wiki.length == 1) {
                                        return '][[bui;#fff;;wiki]' + wiki[0] + '][[i;;]';
                                    } else {
                                        return '][[bui;#fff;;wiki;' + wiki[0] + ']' +
                                            wiki[1] + '][[i;;]';
                                    }
                                });
                            var author = content.match(/\s*source\s*=\s*([^|]+)/)[1].replace(/^(—|-)/, '').trim();
                            return '[[i;;]' + quote + ']\n-- ' + author;
                        },
                        quote: function(content) {
                            content = content.replace(/^\s*\|/gm, '').split('|');
                            var keys = {};
                            content = content.map(function(item) {
                                var m = item.match(/\s*(\w+)\s*=\s*(.*)/);
                                if (m) {
                                    keys[m[1].toLowerCase()] = m[2];
                                    return '';
                                } else {
                                    return item;
                                }
                            }).join('');
                            var author = '';
                            if (keys.author) {
                                author = keys.author;
                            } else if (content.match(/^ /m)) {
                                author = content.match(/^ (.*)/m)[1];
                            }
                            return '[[i;;]' + content.
                                replace(/'''([^']+(?:'[^']+)*)'''/g, function(_, bold) {
                                    return '][[bi;#fff;]' + bold + '][[i;;]';
                                }).
                                replace(/''([^']+(?:'[^']+)*)''/g, '$1').
                                replace(/\[\[([^\]]+)\]\]/g, function(_, wiki) {
                                    return '][[bui;#fff;;wiki]' + wiki + '][[i;;]';
                                }) + ']' + (author ? '\n-- ' + author : '');
                        },
                        'Cat main': function(content) {
                            return 'The main article for this [[bu;#fff;;wiki' +
                                ';Help:category]Category] is [[bu;#fff;;wiki]' +
                                content + ']\n';
                        },
                        'see also': function(content) {
                            return 'See also ' + wiki_list(content) + '\n';
                        },
                        tag: function(content) {
                            return escape('<'+content+'>...</' + content + '>');
                        },
                        official: function(content) {
                            if (!content.match(/^http:/)) {
                                content = 'http://' + content;
                            }
                            return '[[!;;;;' + content + ']Official Website]';
                        },
                        'IMDb name': function(content) {
                            if (title) {
                                var m = content.match(/id\s*=\s*([^|]+)/);
                                var id;
                                if (m) {
                                    id = m[1];
                                } else {
                                    id = content;
                                }
                                var url = 'http://www.imdb.com/name/nm' + id;
                                return '[[!;;;;' + url + ']' + title + '] ' +
                                    'at the [[Internet Movie Database]]';
                            }
                        },
                        '(?:tlx|tl)': function(content) {
                            content = content.split('|');
                            var params = '';
                            if (content.length > 1) {
                                params = '|' + content.slice(1).join('|');
                            }
                            return escape('{{') + '[[bu;#fff;;wiki;Template:' + content[0] +
                                ']' + content[0] + ']' + params + escape('}}');
                        },
                        '(?:as of|Asof)': function(content) {
                            content = content.split('|');
                            var months = [
                                'January', 'February', 'March', 'April', 'May',
                                'June', 'July', 'August', 'September',
                                'October', 'November', 'December'
                            ];
                            var date = [];
                            var keys = {};
                            for (var i=0; i<content.length; ++i) {
                                var m = content[i].match(/(\w+)\s*=\s*(\w+)/);
                                if (m) {
                                    keys[m[1].toLowerCase()] = m[2]
                                } else {
                                    date.push(content[i]);
                                }
                            }
                            var str = 'As of ';
                            if (keys.since) {
                                str = 'Since ';
                            }
                            if (keys.lc == 'y') {
                                str = str.toLowerCase();
                            }
                            if (keys.df && keys.df.toLowerCase() == 'us') {
                                return str + (date[1] ? months[date[1]-1]+' ' : '') +
                                    (date[2] ? date[2]+', ':'') + date[0];
                            } else {
                                return str + (date[2] ? date[2]+' ' : '') +
                                    (date[1] ? months[date[1]-1]+' ' : '') + date[0];
                            }
                        }
                    };
                    function escape(text) {
                        var chars = {
                            '{': '&#123;',
                            '}': '&#125;',
                            '[': '&#91;',
                            ']': '&#93;',
                            '<': '&#60;',
                            '>': '&#62;',
                            "'": '&#39;'
                        };
                        Object.keys(chars).forEach(function(chr) {
                            text = text.replace(new RegExp('\\' + chr, 'g'), chars[chr]);
                        });
                        return text;
                    }
                    text = text.replace(/&nbsp;/g, ' ').
                        replace(/^\s*;\s*([^:]+):\s*/gm, function(_, header) {
                            return '\n' + header + '\n\n';
                        }).
                        replace(/&/g, '&amp;').
                        //replace(/(''\[\[[^\]]+\]])(?!'')/, '$1\'\'').
                        replace(/^\s*(=+)\s*([^=]+)\s*\1/gm, function(_, _, text) {
                            text = text.replace(/''([^']+)''/g, function(_, text) {
                                return '][[bi;#fff;]' + text + '][[b;#fff;]';
                            });
                            return '\n[[b;#fff;]' + text + ']\n';
                        }).
                        replace(/\[\.\.\.\]/g, '...').
                        replace(/<code><pre>(.*?)<\/pre><\/code>/g, function(_, str) {
                            return escape(str);
                        }).
                        replace(/\[\[(?=<nowki\s*\/>)/, function(str) {
                            return escape(str);
                        }).
                        replace(/{{Cite([^}]+)}}(?![\s\n]*<\/ref>)/gi,
                                function(_, cite) {
                                    var title = cite.match(/title\s*=\s*([^|]+)/i);
                                    var url = cite.match(/url\s*=\s*([^|]+)/i);
                                    if (title) {
                                        if (url) {
                                            return '[[!;;;;' + url[1].trim() + ']' +
                                                title[1].trim() + ']';
                                        } else {
                                            return title[1].trim();
                                        }
                                    } else {
                                        return '';
                                    }
                                }).
                        replace(/<nowiki>([\s\S]*?)<\/nowiki>/g, function(_, wiki) {
                            return escape(wiki);
                        });
                    var strip = [
                            /<ref[^>]*\/>/g, /<ref[^>]*>[\s\S]*?<\/ref>/g,
                            /\[\[(file|image):[^[\]]*(?:\[\[[^[\]]*]][^[\]]*)*]]/gi,
                            /<!--[\s\S]*?-->/g, /<gallery>[\s\S]*?<\/galery>/g
                    ];
                    strip.forEach(function(re) {
                        text = text.replace(re, '');
                    });
                    var re;
                    for (var template in templates) {
                        re = new RegExp('{{' + template + '\\|?(.*?)}}', 'gi');
                        text = text.replace(re, function(_, content) {
                            return templates[template](content) || '';
                        });
                    }
                    // strip the rest of the templates
                    re = /{{[^{}]*(?:{(?!{)[^{}]*|}(?!})[^{}]*)*}}/g;
                    do {
                        var cnt=0;
                        text = text.replace(re, function (_) {
                            cnt++; return '';
                        });
                    } while (cnt);
                    var format_begin_re = /\[\[([!gbiuso]*);([^;]*)(;[^\]]*\])/i;
                    function format(style, color) {
                        var format_split_re = /(\[\[[!gbiuso]*;[^;]*;[^\]]*\](?:[^\]]*\\\][^\]]*|[^\]]*|[^\[]*\[[^\]]*)\]?)/i;
                        return function(_, text) {
                            return text.split(format_split_re).map(function(txt) {
                                function replace(_, st, cl, rest) {
                                    return '[['+style+st+';'+(color||cl)+rest;
                                }
                                if ($.terminal.is_formatting(txt)) {
                                    return txt.replace(format_begin_re, replace);
                                } else {
                                    return '[[' + style + ';' + (color||'')+';]' +
                                        txt + ']';
                                }
                            }).join('');
                        };
                    }
                    text = text.replace(/\[\[([^\]]+)\]\]/g, function(_, gr) {
                        if (_.match(format_begin_re)) {
                            // empty terminal formatting
                            return _;
                        }
                        if (_.match(/<nowiki[^>]*>/)) {
                            return $.terminal.escape_brackets(_);
                        }
                        gr = gr.replace(/^:(Category)/i, '$1').split('|');
                        var result;
                        if (gr.length == 1) {
                            result = '[[bu;#fff;;wiki]' + gr[0] + ']';
                        } else {
                            gr[1] = gr[1].replace(/''([^']+)''/gm, function(_, g) {
                                return '][[bui;#fff;;wiki;'+gr[0]+']'+g+']'+
                                    '[[bu;#fff;;wiki;' + gr[0] + ']';
                            });
                            result = '[[bu;#fff;;wiki;'+gr[0]+']'+gr[1]+']';
                        }
                        return result;
                    }).replace(/'''([^']+(?:'[^']+)*)'''/g, format('b', '#fff')).
                        replace(/^(\n\s*)*/, '').
                        replace(/([^[])\[(\s*(?:http|ftp)[^\[ ]+) ([^\]]+)\]/g,
                                function(_, c, url, text) {
                                    function rep(_, str) {
                                        return '][[!i;;;;' + url + ']' + str +
                                            '][[!;;;;' + url + ']';
                                    }
                                    text = text.replace(/'''([^']*(?:'[^']+)*)'''/g,
                                                        '$1').
                                        replace(/''([^']*(?:'[^']+)*)''/g,
                                                rep);
                                    return c + '[[!;;;;' + url + ']' + text + ']';
                                }).
                        replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, format('i')).
                        replace(/''([^']+(?:'[^']+)*)''/g, format('i')).
                        replace(/{\|.*\n([\s\S]*?)\|}/g, function(_, table) {
                            var head_re = /\|\+(.*)\n/;
                            var header;
                            var m = table.match(head_re);
                            if (m) {
                                var head = m[1].trim().
                                    replace(/\[\[([^;]+)(;[^\]]+\][^\]]+\])/g,
                                            function(_, style, rest) {
                                                return '][[' + style + 'i' +
                                                    rest + '[[i;;]';
                                            });
                            }
                            table = table.replace(/^.*\n/, '').
                                replace(head_re, '').split(/\|\-.*\n/);
                            if (table.length == 1) {
                                header = false;
                                table = table[0].replace(/[\n\s]*$/, '').
                                    split(/\n/).map(function(text) {
                                        return [text];
                                    });
                            } else {
                                if (table[0].match(/^!|\n!/)) {
                                    header = true;
                                }
                                table = table.map(function(text) {
                                    var re = /^[|!]|\n[|!]|\|\|/;
                                    if (text.match(re)) {
                                        return text.split(re).map(function(item) {
                                            return item.replace(/\n/g, '').trim();
                                        }).filter(function(item, i) {
                                            return i !== 0;
                                        });
                                    } else {
                                        return [];
                                    }
                                }).filter(function(row) {
                                    return row.length;
                                });
                            }
                            var result = '';
                            if (head) {
                                result = '\n[[i;;]' + head + '\n';
                            }
                            result += ascii_table(table, header);
                            return result;
                        }).replace(/#(REDIRECT)/i, '&#35;$1').
                        replace(/(^\*.*(\n|$))+/gm, function(list) { // unordered list
                            return '\n' + list;
                        }).
                        replace(/(^#.*(\n|$))+/gm, function(list) { // numbered list
                            list = list.split(/^#\s*/m).slice(1);
                            return '\n' + list.map(function(line, i) {
                                return (list.length > 9 && i < 9 ? ' ' : '') + (i+1) +
                                    '. ' + line;
                            }).join('') + '\n';
                        }).split(/(<pre[^>]*>[\s\S]*?<\/pre>)/).map(function(text, i) {
                            var m = text.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
                            var re = /([^\n])\n(?![\n*|+]|\s*[0-9]|:|--|\[\[bu;#fff;;wiki\]Category)/gi;
                            if (m) {
                                return m[1];
                            } else {
                                return text.replace(re, '$1 ').replace(/ +/g, ' ');
                            }
                        }).join('').
                        replace(/<[^>]+>/gm, ''). // strip rest of html tags
                        replace(/\n{3,}/g, '\n\n'). // remove larger newline space
                        replace(/\*(\S)/g, '* $1'); // Fix lists
                    return text;
                },
                less: function(text, exit) {
                    var term = leash.terminal;
                    var export_data = term.export_view();
                    var cols, rows;
                    var pos = 0;
                    //string = $.terminal.escape_brackets(string);
                    var original_lines;
                    var lines;
                    var prompt;
                    var left = 0;
                    function print() {
                        term.clear();
                        if (lines.length-pos > rows-1) {
                            prompt = ':';
                        } else {
                            prompt = '[[;;;inverted](END)]';
                        }
                        term.set_prompt(prompt);
                        var to_print = lines.slice(pos, pos+rows-1);
                        var format_start_re = /^(\[\[[!gbiuso]*;[^;]*;[^\]]*\])/i;
                        to_print = to_print.map(function(line, line_index) {
                            if ($.terminal.have_formatting(line)) {
                                var result, start = -1, format, count = 0,
                                    formatting = null, in_text = false, beginning = '';
                                for (var i=0, len=line.length; i<len; ++i) {
                                    var m = line.substring(i).match(format_start_re);
                                    if (m) {
                                        formatting = m[1];
                                        in_text = false;
                                    } else if (formatting && line[i] === ']') {
                                        if (in_text) {
                                            formatting = null;
                                            in_text = false;
                                        } else {
                                            in_text = true;
                                        }
                                    }
                                    if (count === left && start == -1) {
                                        start = i;
                                        if (formatting && in_text && line[i] != ']') {
                                            beginning = formatting;
                                        }
                                    } else if (i==len-1) {
                                        if (left > count) {
                                            result = '';
                                        } else {
                                            result = beginning + line.substring(start, len);
                                            if (formatting && in_text && line[i] != ']') {
                                                result += ']';
                                            }
                                        }
                                    } else if (count === left+cols-1) {
                                        result = beginning + line.substring(start, i);
                                        if (formatting && in_text) {
                                            result += ']';
                                        }
                                        break;
                                    }
                                    if (((formatting && in_text) || !formatting) &&
                                        line[i] != ']') {
                                        // treat entity as one character
                                        if (line[i] === '&') {
                                            m = line.substring(i).match(/^(&[^;]+;)/);
                                            if (!m) {
                                                throw new Error('Unclosed html entity in' +
                                                                ' line ' + (line_index+1) +
                                                                ' at char ' + (i+1));
                                            }
                                            i+=m[1].length-2; // because continue adds 1 to i
                                            continue;
                                        } else if (line[i] === ']' && line[i-1] === '\\') {
                                            // escape \] counts as one character
                                            --count;
                                        } else {
                                            ++count;
                                        }
                                    }
                                } // for line
                                return result;
                            } else {
                                return line.substring(left, left+cols-1);
                            }
                        });
                        if (to_print.length < rows-1) {
                            while (rows-1 > to_print.length) {
                                to_print.push('~');
                            }
                        }
                        term.echo(to_print.join('\n'));
                    }
                    function quit() {
                        term.pop().import_view(export_data);
                        //term.off('mousewheel', wheel);
                        if ($.isFunction(exit)) {
                            exit();
                        }
                    }
                    function refresh_view() {
                        cols = term.cols();
                        rows = term.rows();
                        if ($.isFunction(text)) {
                            text(cols, function(new_lines) {
                                original_lines = new_lines;
                                lines = original_lines.slice();
                                print();
                            });
                        } else {
                            original_lines = text.split('\n');
                            lines = original_lines.slice();
                            print();
                        }
                    }
                    refresh_view();
                    var scroll_by = 3;
                    //term.on('mousewheel', wheel);
                    var in_search = false, last_found, search_string;
                    function search(start, reset) {
                        var escape = $.terminal.escape_brackets(search_string),
                            flag = search_string.toLowerCase() == search_string ? 'i' : '',
                            start_re = new RegExp('^(' + escape + ')', flag),
                            regex = new RegExp(escape, flag),
                            index = -1,
                            prev_format = '',
                            start,
                            formatting = false,
                            in_text = false;
                        lines = original_lines.slice();
                        if (reset) {
                            index = pos = 0;
                        }
                        for (var i=0; i<lines.length; ++i) {
                            var line = lines[i];
                            for (var j=0, jlen=line.length; j<jlen; ++j) {
                                if (line[j] === '[' && line[j+1] === '[') {
                                    formatting = true;
                                    in_text = false;
                                    start = j;
                                } else if (formatting && line[j] === ']') {
                                    if (in_text) {
                                        formatting = false;
                                        in_text = false;
                                    } else {
                                        in_text = true;
                                        prev_format = line.substring(start, j+1);
                                    }
                                } else if (formatting && in_text || !formatting) {
                                    if (line.substring(j).match(start_re)) {
                                        var rep;
                                        if (formatting && in_text) {
                                            rep = '][[;;;inverted]$1]' +
                                                prev_format;
                                        } else {
                                            rep = '[[;;;inverted]$1]';
                                        }
                                        line = line.substring(0, j) +
                                            line.substring(j).replace(start_re, rep);
                                        j += rep.length-2;
                                        if (i > pos && index === -1) {
                                            index = pos = i;
                                        }
                                    }
                                }
                            }
                            lines[i] = line;
                        }
                        print();
                        term.set_command('');
                        term.set_prompt(prompt);
                        return index;
                    }
                    term.push($.noop, {
                        resize: refresh_view,
                        mousewheel: function(event, delta) {
                            if (delta > 0) {
                                pos -= scroll_by;
                                if (pos < 0) {
                                    pos = 0;
                                }
                            } else {
                                pos += scroll_by;
                                if (pos-1 > lines.length-rows) {
                                    pos = lines.length-rows+1;
                                }
                            }
                            print();
                            return false;
                        },
                        name: 'less',
                        keydown: function(e) {
                            var command = term.get_command();
                            if (term.get_prompt() !== '/') {
                                if (e.which == 191) {
                                    term.set_prompt('/');
                                } else if (in_search &&
                                           $.inArray(e.which, [78, 80]) != -1) {
                                    if (e.which == 78) { // search_string
                                        if (last_found != -1) {
                                            last_found = search(last_found+1);
                                        }
                                    } else if (e.which == 80) { // P
                                        last_found = search(0, true);
                                    }
                                } else if (e.which == 81) { //Q
                                    quit();
                                } else if (e.which == 39) { // right
                                    left+=Math.round(cols/2);
                                    print();
                                } else if (e.which == 37) { // left
                                    left-=Math.round(cols/2);
                                    if (left < 0) {
                                        left = 0;
                                    }
                                    print();
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
                                        pos = 0;
                                        search_string = command;
                                        last_found = search(0);
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
                                return '"' + item;
                            });
                        } else {
                            return array.map(function(item) {
                                return item.replace(/ /g, '\\ ');
                            });
                        }
                    }
                    var cmd = $.terminal.parse_command(command);
                    var re = new RegExp('^\\s*' + $.terminal.escape_regex(string));
                    if (command.match(re) || command === '') {
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
                    sleep: function(cmd, token, term) {
                        leash.animation.start(400);
                        leash.service.sleep(cmd.args[0])(function() {
                            leash.animation.stop();
                        });
                    },
                    rfc: function(cmd, token, term) {
                        var number = cmd.args.length ? cmd.args[0] : null;
                        term.pause();
                        leash.service.rfc(number)(function(err, rfc) {
                            if (err) {
                                print_error(err);
                            } else {
                                leash.less(rfc.replace(/^[\s\n]+|[\s\n]+$/g, ''));
                            }
                            term.resume();
                        });
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
                                leash.less($.terminal.escape_brackets(ret.output));
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
                    passwd: function(cmd, token, term) {
                        term.set_mask(true).history().disable();
                        term.push(function(old_p) {
                            term.push(function(new_p) {
                                term.pause();
                                service.valid_password(token, old_p)(function(err, valid) {
                                    if (valid) {
                                        service.change_password(token, new_p)(function(err) {
                                            if (!err) {
                                                term.echo('Password successfully changed');
                                            } else {
                                                term.error(err.message);
                                            }
                                            term.pop().pop().resume();
                                            term.set_mask(false).history().enable();
                                        });
                                    } else {
                                        term.error('Current password is not valid');
                                        term.pop().pop().resume();
                                        term.set_mask(false).history().enable();
                                    }
                                });
                            }, {
                                prompt: 'new password: ',
                                name: 'passwd_2',
                                keydown: function(e) {
                                    if (e.which == 68 && e.ctrlKey) { // CTRL+D
                                        term.pop().pop().echo('new password: ');
                                        term.set_mask(false).history().enable();
                                        return false;
                                    }
                                }
                            });
                        }, {
                            prompt: 'current password: ',
                            name: 'passwd_1'
                        });
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
                    wikipedia: function(cmd, token, term) {
                        function wiki(callback) {
                            var defer = $.Deferred();
                            $.ajax({
                                url: url,
                                data: {
                                    action: 'query',
                                    prop:'revisions',
                                    rvprop: 'content',
                                    format:'json',
                                    titles: cmd.rest
                                },
                                dataType: 'jsonp',
                                success: function(data) {
                                    var pages = data.query.pages;
                                    var article = Object.keys(pages).map(function(key) {
                                        var page = pages[key];
                                        if (page.revisions) {
                                            return page.revisions[0]['*'];
                                        } else if (typeof page.missing != 'undefined') {
                                            return 'Article Not Found';
                                        }
                                    }).join('\n');
                                    article = leash.wikipedia(article, cmd.rest);
                                    if ($.isFunction(callback)) {
                                        callback(article);
                                    }
                                    defer.resolve(article);
                                }
                            });
                            return defer.promise();
                        }
                        function exit() {
                            wiki_stack.pop();
                            if (!wiki_stack.length) {
                                term.option('convertLinks', true);
                            }
                        }
                        if (cmd.args.length === 0) {
                            term.echo('Display contents of wikipedia articles\n' +
                                      'usage:\n\twikipedia {ARTICLE}\n\n' +
                                      '-s {SEARCH TERM}');
                        } else {
                            term.pause();
                            term.option('convertLinks', false);
                            var url = 'https://en.wikipedia.org/w/api.php?';
                            wiki_stack.push(cmd.rest.replace(/^-s\s*/, ''));
                            if (cmd.rest.match(/^-s\s*/)) {
                                $.ajax({
                                    url: url,
                                    data: {
                                        action: 'opensearch',
                                        format: 'json',
                                        limit: 100,
                                        search: cmd.rest.replace(/^-s\s*/, '')
                                    },
                                    dataType: 'jsonp',
                                    success: function(data) {
                                        if (data[1].length && data[2].length) {
                                            var text = data[1].map(function(term, i) {
                                                return '[[bu;#fff;;wiki]' + term + ']\n' +
                                                    data[2][i];
                                            }).join('\n\n');
                                            leash.less(text, exit);
                                            term.resume();
                                        }
                                    }
                                });
                            } else if (cmd.rest.match(/^Category:/)) {
                                $.ajax({
                                    url: url,
                                    data: {
                                        action: 'query',
                                        list: 'categorymembers',
                                        rvprop: 'content',
                                        format:'json',
                                        cmlimit: 500,
                                        cmtitle: cmd.rest
                                    },
                                    dataType: 'jsonp',
                                    success: function(data) {
                                        var members = data.query.categorymembers;
                                        text = members.map(function(member) {
                                            return '[[bu;#fff;;wiki]' + member.title + ']';
                                        }).join('\n');
                                        var re = /(\[\[bu;#fff;;wiki\]Category)/;
                                        wiki(function(article) {
                                            text = article.replace(re, text + '\n\n$1');
                                            leash.less(text, exit);
                                            term.resume();
                                        });
                                    }
                                });
                            } else {
                                wiki(function(article) {
                                    leash.less(function(cols, callback) {
                                        var lines = $.terminal.split_equal(article,
                                                                           cols,
                                                                           true);
                                        callback(lines);
                                    }, exit);
                                    term.resume();
                                });
                            }
                        }
                    },
                    jargon: function(cmd, token, term) {
                        if (!cmd.args.length) {
                            var msg = 'This is the Jargon File, a comprehensiv'+
                                'e compendium of hacker slang illuminating man'+
                                'y aspects of hackish tradition, folklore, and'+
                                ' humor.\n\nusage: jargon [-s] [QUERY]\n\n-s s'+
                                'earch jargon file';
                            term.echo(msg, {keepWords: true});
                        } else if (cmd.args[0] == '-s') {
                            term.pause();
                            var search_term = cmd.rest.replace(/^-s/, '').trim();
                            if (!search_term.match(/%/)) {
                                search_term = '%' + search_term + '%';
                            }
                            leash.service.jargon_search(search_term)(function(err, list) {
                                if (err) {
                                    print_error(err);
                                } else {
                                    term.echo(list.map(function(row) {
                                        return '[[bu;#fff;;jargon]' + row.term + ']';
                                    }).join('\n'));
                                }
                                term.resume();
                            });
                        } else {
                            term.pause();
                            // NOTE: when paste using mouse middle rpc jargon
                            //       function don't return result
                            var word = cmd.args.join(' ').replace(/\s+/g, ' ');
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
                        var command = 'MANWIDTH=' + term.cols() + ' ' + cmd.command;
                        service.shell(token, command, '/')(function(err, ret) {
                            leash.less($.terminal.overtyping(ret.output));
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
                                    return Object.keys(row).map(function(key) {
                                        return row[key];
                                    });
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
                        var server, path;
                        if (config && config.server) {
                            server = config.server;
                        } else {
                            server = 'unknown';
                        }
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
                    leash.onImport = function(view) {
                        leash.cwd = view.cwd;
                        leash.terminal.set_prompt(leash.prompt);
                    };
                    leash.onExport = function() {
                        return {
                            cwd: leash.cwd
                        };
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
                var defaults = {
                    onInit: leash.init,
                    //maskChar: '',
                    completion: leash.completion,
                    linksNoReferrer: true,
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
                    onExport: leash.onExport,
                    onImport: leash.onImport,
                    name: 'leash',
                    outputLimit: 500,
                    greetings: leash.greetings,
                    keydown: function(e) {
                        if (leash.animation.animating) {
                            if (e.which == 68 && e.ctrlKey) {
                                leash.animation.stop();
                            }
                            return false;
                        }
                    }
                };
                var settings = $.extend(defaults, options || {});
                var terminal = self.terminal(leash.interpreter, settings);
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
                    if (files.length) {
                        files = [].slice.call(files);
                        (function upload() {
                            var file = files.shift();
                            function uploadFile() {
                                var formData = new FormData();
                                formData.append('file', file);
                                formData.append('token', token);
                                formData.append('path', leash.cwd);
                                leash.animation.start(400);
                                $.ajax({
                                    url: 'lib/upload.php',
                                    type: 'POST',
                                    success: function(response) {
                                        leash.animation.stop();
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
                                        leash.animation.stop();
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
                                        terminal.history().disable();
                                        terminal.push(function(yesno) {
                                            if (yesno.match(/^(y|n)$/i)) {
                                                terminal.pop().history().enable();
                                                if (yesno.match(/^y$/i)) {
                                                    callback(); // upload
                                                } else if (yesno.match(/^n$/i)) {
                                                    upload(); // next file
                                                }
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
                                                leash.animation.stop();
                                            },
                                            data: formData,
                                            cache: false,
                                            contentType: false,
                                            processData: false
                                        });
                                    } else {
                                        leash.animation.stop();
                                        terminal.echo('File "' + file.name + '" uploaded.');
                                        upload();
                                    }
                                }
                                leash.animation.start(400);
                                leash.service.unlink(token, fname)(function(err, del) {
                                    if (err) {
                                        leash.terminal.error(err.message);
                                        leash.animation.stop();
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
