/**@license
 *  This file is part of Leash (Browser Shell)
 *  Copyright (c) 2013-2018 Jakub Jankiewicz <http://jcubic.pl/me>
 *
 *  Released under the MIT license
 *
 *  Date: {{DATE}}
 */
/* global sysend, $, Directory, File, FormData, rpc, wcwidth, clearTimeout, setTimeout,
          optparse, ImageCapture, URL, setInterval, clearInterval
 */
function Uploader(leash) {
    this.token = leash.terminal.token();
    this.leash = leash;
}

Uploader.prototype.upload_tree = function upload_tree(tree, path) {
    var defered = $.Deferred();
    var self = this;
    path = path || self.leash.cwd;
    function process(entries, callback) {
        entries = entries.slice();
        (function recur() {
            var entry = entries.shift();
            if (entry) {
                callback(entry).then(recur).fail(function() {
                    defered.reject();
                });
            } else {
                defered.resolve();
            }
        })();
    }
    function upload_files(entries) {
        process(entries, function(entry) {
            return self.upload_tree(entry, path + "/" + tree.name);
        });
    }
    function upload_file(file) {
        self.upload(file, path).then(function() {
            defered.resolve();
        }).fail(function() {
            defered.reject();
        });
    }
    if (typeof Directory != 'undefined' && tree instanceof Directory) { // firefox
        tree.getFilesAndDirectories().then(function(entries) {
            upload_files(entries);
        });
    } else if (typeof File != 'undefined' && tree instanceof File) { // firefox
        upload_file(tree);
    } else if (tree.isFile) { // chrome
        tree.file(upload_file);
    } else if (tree.isDirectory) { // chrome
        var dirReader = tree.createReader();
        dirReader.readEntries(function(entries) {
            upload_files(entries);
        });
    }
    return defered.promise();
};

Uploader.prototype.error = function(error) {
    if (typeof error === 'string') {
        this.leash.terminal.error(error);
    } else if (error.error) {
        this.leash.terminal.error(error.error.message);
    } else {
        this.leash.terminal.error(error.message);
    }
};

Uploader.prototype.upload = function upload(file, path) {
    var self = this;
    var defered = $.Deferred();
    var file_name = path + '/' + file.name;
    if (file.size > self.leash.settings.upload_max_filesize) {
        if (!(file.slice || file.webkitSlice)) {
            self.error('Exceeded filesize limit.');
            defered.resolve();
            self.leash.animation.stop();
        } else {
            self.maybe_ask(file_name).then(function() {
                self.leash.animation.start(400);
                self.upload_by_chunks(file, path).then(function() {
                    defered.resolve();
                    self.leash.animation.stop();
                }).fail(function() {
                    defered.reject();
                    self.leash.animation.stop();
                });
            }).fail(function() {
                // will process next file
                defered.resolve();
                self.leash.animation.stop();
            });
        }
    } else {
        self.maybe_ask(file_name).then(function() {
            self.upload_file(file, path).then(function() {
                defered.resolve();
                self.leash.animation.stop();
            }).fail(function() {
                defered.reject();
                self.leash.animation.stop();
            });
        }).fail(function() {
            // will process next file
            defered.resolve();
            self.leash.animation.stop();
        });
    }
    return defered.promise();
};

Uploader.prototype.upload_by_chunks = function upload_by_chunks(file, path, chunk_size) {
    var self = this;
    chunk_size = chunk_size || 1048576; // 1MB
    var defered = $.Deferred();
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
            formData.append('token', self.token);
            formData.append('path', path);
            $.ajax({
                url: 'lib/upload.php?append=1',
                type: 'POST',
                success: function(response) {
                    if (response.error) {
                        self.error(response.error);
                        defered.reject();
                    } else {
                        process(end, end+chunk_size);
                    }
                },
                error: function(jxhr, error, status) {
                    self.error(jxhr.statusText);
                    defered.reject();
                },
                data: formData,
                cache: false,
                contentType: false,
                processData: false
            });
        } else {
            self.leash.terminal.echo('File "' + file.name + '" uploaded.');
            defered.resolve();
        }
    }
    var fname = path + '/' + file.name;
    this.leash.service.unlink(self.token, fname)(function(err, del) {
        if (err) {
            self.error(err);
            defered.reject();
        } else {
            process(0, chunk_size);
        }
    });
    return defered.promise();
};

Uploader.prototype.maybe_ask = function maybe_ask(fname) {
    var self = this;
    var defered = $.Deferred();
    if (self.answer) {
        defered.resolve();
    } else {
        self.leash.service.file_exists(fname)(function(err, exists) {
            if (exists) {
                var msg = 'File "' + fname + '" exis'+
                    'ts do you want to overwrite it (Y/N/A)? ';
                self.leash.terminal.history().disable();
                self.leash.terminal.push(function(answer) {
                    if (answer.match(/^(y|n|a)$/i)) {
                        self.leash.terminal.pop().history().enable();
                        if (answer.match(/^a$/i)) {
                            defered.resolve();
                            self.answer = true;
                        } else if (answer.match(/^y$/i)) {
                            defered.resolve();
                        } else if (answer.match(/^n$/i)) {
                            defered.reject();
                        }
                    }
                }, {
                    prompt: msg
                });
            } else {
                defered.resolve();
            }
        });
    }
    return defered.promise();
};

Uploader.prototype.upload_file = function upload_file(file, path) {
    var self = this;
    var defered = $.Deferred();
    var formData = new FormData();
    formData.append('file', file);
    formData.append('token', self.token);
    formData.append('path', path);
    $.ajax({
        url: 'lib/upload.php',
        type: 'POST',
        success: function(response) {
            self.leash.animation.stop();
            if (response.error) {
                self.error(response.error);
                defered.reject();
            } else {
                self.leash.terminal.echo('File "' + file.name + '" ' + 'uploaded.');
                defered.resolve();
            }
        },
        error: function(jxhr, error, status) {
            self.error(jxhr.statusText);
            defered.reject();
        },
        data: formData,
        cache: false,
        contentType: false,
        processData: false
    });
    return defered.promise();
};
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
        'Copyright (c) 2013-2018 Jakub Jankiewicz <http://jcubic.pl/me>',
        '',
        'Licensed under MIT license'
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
    function sql_formatter(keywords, tables, color) {
        var re = new RegExp('^' + tables.map($.terminal.escape_regex).join('|') + '$', 'i');
        return function(string) {
            return string.split(/((?:\s|&nbsp;|\)|\()+)/).map(function(string) {
                if (keywords.indexOf(string) != -1) {
                    return '[[b;' + color + ';]' + string + ']';
                } else if (string.match(re)) {
                    return '[[u;;]' + string + ']';
                } else {
                    return string;
                }
            }).join('');
        };
    }
    // -------------------------------------------------------------------------
    // :: PYTHON INTERPRETER RPC HANDLER
    // -------------------------------------------------------------------------
    function python(terminal, url, success) {
        function ajax_error(xhr, status) {
            var msg = $.terminal.escape_brackets('[AJAX] ' + status +
                                                 ' server response\n' +
                                                 xhr.responseText);
            terminal.error(msg);
            resume(terminal);
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
            pause(terminal);
            $.jrpc(url, method, params, function(data) {
                if (data.error) {
                    json_error(data.error);
                } else if (data.result) {
                    if (echo === undefined || echo) {
                        terminal.echo(data.result.replace(/\n$/, ''));
                    }
                }
                resume(terminal);
            }, ajax_error);
        }
        pause(terminal);
        var session_id;
        $.jrpc(url, 'start', [], function(data) {
            if (data.error) {
                json_error(data.error);
                resume(terminal);
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
                    resume(terminal);
                });
            }
        }, ajax_error);
    }
    // -------------------------------------------------------------------------
    // :: UNIX COLOR PROMPT
    // -------------------------------------------------------------------------
    function unix_prompt(user, server, path) {
        if (path) {
            path = $.terminal.escape_brackets(path);
        }
        var name = colors.green(user + '&#64;' + server);
        var end = colors.grey(user === 'root' ? '# ' : '$ ');
        return name + colors.grey(':') + colors.blue(path) + end;
    }
    function pause(term) {
        term.pause(true).find('.prompt').hidden();
    }
    function resume(term) {
        term.resume().find('.prompt').visible();
    }
    function init(service, index, d, options) {
        // -----------------------------------------------------------------
        // :: LEASH
        // -----------------------------------------------------------------
        var settings = $.extend({}, {
            onDirectoryChange: $.noop
        }, options);
        var home;
        var config;
        var init_formatters = $.terminal.defaults.formatters;
        var formatters_stack = [init_formatters];
        var interpreters = [];
        var cwd = [];
        function expand_env_vars(command) {
            var fixed_command = command;
            $.each(leash.env, function(k, v) {
                fixed_command = fixed_command.replace('$' + k, v);
            });
            return fixed_command;
        }
        function prn_sql_result(err, result) {
            if (err) {
                print_error(err);
            } else {
                switch ($.type(result)) {
                case 'array':
                    if (result.length) {
                        var keys = Object.keys(result[0]);
                        result = [keys].concat(result.map(function(row) {
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
                        leash.terminal.echo(ascii_table(result, true), {formatters: false});
                    }
                    break;
                case 'number':
                    leash.terminal.echo('Query OK, ' + result +
                                        ' row affected');
                }
            }
            resume(leash.terminal);
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
                        var len = wcwidth(row[i]);
                        if (row[i].match(/\t/g)) {
                            // tab is 4 spaces
                            len += row[i].match(/\t/g).length*3;
                        }
                        return len;
                    } else {
                        return 0;
                    }
                });
                return Math.max.apply(Math, col);
            });
            // column padding
            array = array.map(function(row) {
                return '| ' + row.map(function(item, i) {
                    var size = wcwidth(item);
                    if (item.match(/\t/g)) {
                        // tab is 4 spaces
                        size += item.match(/\t/g).length*3;
                    }
                    if (size < lengths[i]) {
                        item += new Array(lengths[i] - size + 1).join(' ');
                    }
                    return item;
                }).join(' | ') + ' |';
            });
            array = array.map(function(line) {
                return line.replace(/&/g, '&amp;');
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
        var dir_stack = [];
        // -------------------------------------------------------------------------------
        function shell(cmd, path) {
            var term = leash.terminal;
            var token = term.get_token();
            var options = {
                columns: term.cols()
            };
            return service.shell(token, cmd, leash.cwd, options);
        }
        // -------------------------------------------------------------------------------
        function less_command(cat) {
            return function(cmd, token, term) {
                var shell_cmd = cat + ' ' + cmd.args[0];
                pause(term);
                shell(shell_cmd, leash.cwd)(function(err, ret) {
                    if (err) {
                        print_error(err);
                    } else {
                        leash.less($.terminal.escape_brackets(ret.output));
                    }
                    resume(term);
                });
            };
        }
        // -----------------------------------------------------------------------
        // :: Replacemenet for jQuery deferred objects taken from jQuery Terminal
        // -----------------------------------------------------------------------
        function DelayQueue() {
            var callbacks = $.Callbacks();
            var resolved = false;
            this.resolve = function() {
                callbacks.fire();
                resolved = true;
            };
            this.add = function(fn) {
                if (resolved) {
                    fn();
                } else {
                    callbacks.add(fn);
                }
            };
        }
        function ready(queue) {
            return function(fun) {
                queue.add(fun);
            };
        }
        var init_queue = new DelayQueue();
        var when_ready = ready(init_queue);
        var leash = {
            formatters: init_formatters,
            version: '{{VERSION}}',
            date: '{{DATE}}',
            jargon: [],
            dirs: {},
            env: {},
            change_directory: function(dir, callback) {
                when_ready(function() {
                    leash.cwd = dir;
                    settings.onDirectoryChange(leash.cwd);
                    leash.refresh_dir(callback);
                });
            },
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
                    leash.terminal.pause(true);
                    (function animation() {
                        leash.terminal.set_prompt(anim[i++]);
                        if (i > anim.length-1) {
                            i = 0;
                        }
                        self.timer = setTimeout(animation, delay);
                    })();
                },
                stop: function() {
                    if (this.animating) {
                        clearTimeout(this.timer);
                        leash.terminal.set_prompt(this.prompt);
                        this.animating = false;
                    }
                    resume(leash.terminal);
                }
            },
            service: service,
            init: function(term) {
                term.on('click', '.jargon', function() {
                    var command = 'jargon ' + $(this).data('text').replace(/\s/g, ' ');
                    term.exec(command).then(function() {
                        if (term.settings().historyState) {
                            term.save_state(command);
                        }
                    });
                }).on('click', '.exec', function() {
                    var command = $(this).data('text');
                    term.exec(command).then(function() {
                        if (term.settings().historyState) {
                            term.save_state(command);
                        }
                    });
                }).on('click', '.wiki', function() {
                    var article = $(this).data('text').replace(/\s/g, ' ');
                    var cmd = $.terminal.split_command('wikipedia ' + article);
                    leash.commands.wikipedia(cmd, term.token(), term);
                }).on('click', '.rfc', function() {
                    var rfc = $(this).data('text');
                    var cmd = $.terminal.split_command('rfc ' + rfc);
                    leash.commands.rfc(cmd, term.token(), term);
                }).on('click', 'a', function(e) {
                    if ($(this).parents().is('.exception')) {
                        return;
                    }
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
                if (!interpreters.length) {
                    term.error("Not interpeter");
                } else {
                    interpreters[interpreters.length-1](command, term);
                }
            },
            make_interpreter: function(token) {
                return function(command, term) {
                    if (!leash.installed) {
                        term.error("Invalid command, you need to refresh the p"+
                                   "age");
                    } else {
                        if ($.terminal.unclosed_strings(command)) {
                            leash.shell(command, token, term);
                        } else {
                            var cmd = $.terminal.parse_command(command);
                            if (leash.commands[cmd.name]) {
                                leash.commands[cmd.name](cmd, token, term);
                            } else if (command !== '') {
                                leash.shell(command, token, term);
                            }
                        }
                    }
                };
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
                        text: "Type your server name"
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
                        name: 'guest',
                        text: 'Allow guest sessions (Y)es/(N)o',
                        boolean: true
                    },
                    {
                        name: 'sudo',
                        text: 'Execute sudo for user accounts (Y)es/(N)o',
                        boolean: true
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
                            if (question.mask) {
                                term.set_mask(false);
                            }
                            if (question.boolean) {
                                var value;
                                if (command.match(/^Y(es)?/i)) {
                                    value = true;
                                } else if (command.match(/^N(o)?/i)) {
                                    value = false;
                                }
                                if (typeof value != 'undefined') {
                                    settings[question.name] = value;
                                    term.pop();
                                    install(step+1, finish);
                                }
                            } else {
                                settings[question.name] = command;
                                term.pop();
                                install(step+1, finish);
                            }
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
                    pause(term);
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
                            settings.shell = null;
                            continuation();
                        }
                    }
                    term.echo("Detect Shell");
                    service.list_shells(null)(function(err, shells) {
                        test_shells(shells, function() {
                            service.configure(settings, '/')(function(err) {
                                resume(term);
                                if (err) {
                                    term.error(err.message);
                                    leash.install(term);
                                } else {
                                    term.echo("Your instalation is complete no"+
                                              "w you can refresh the page and "+
                                              "login");
                                }
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
                    pause(term);
                    service.valid_token(token)(function(err, valid) {
                        if (!valid) {
                            // inform onBeforeLogout to not logout from
                            // service
                            term.set_token(undefined);
                            term.logout();
                            resume(term);
                        } else {
                            leash.token = token;
                            leash.env.TOKEN = token;
                            interpreters.push(leash.make_interpreter(token));
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
                                    resume(term);
                                    return;
                                }
                                leash.settings = config = result;
                                leash.cwd = config.home;
                                leash.home = config.home;
                                leash.server = config.server;
                                init_queue.resolve();
                                settings.onDirectoryChange(leash.cwd);
                                if (result.show_messages !== false) {
                                    var messages = result.messages || [];
                                    term.echo(messages.map(function(msg) {
                                        return '[[;#ff0;]' + msg + ']';
                                    }).join('\n'));
                                }
                                service.dir(token, leash.cwd)(function(err, result) {
                                    leash.dir = result;
                                    // we can set prompt after we have config
                                    term.set_prompt(leash.prompt);
                                    setTimeout(function() {
                                        resume(term);
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
            refresh_dir: function(callback) {
                service.dir(leash.token, leash.cwd)(function(err, result) {
                    leash.dir = result;
                    if ($.isFunction(callback)) {
                        callback();
                    }
                });
            },
            shell: function(command, token, term) {
                var re = /\|\s*less\s*$/;
                var deferr = $.Deferred();
                command = expand_env_vars(command);
                pause(term);
                if (command.match(re)) {
                    command = command.replace(re, '');
                    shell(command, leash.cwd)(function(err, res) {
                        if (err) {
                            print_error(err);
                        } else {
                            // even if empty
                            leash.less(res.output);
                        }
                        resume(term);
                        deferr.resolve();
                    });
                } else {
                    shell(command, leash.cwd)(function(err, res) {
                        if (err) {
                            print_error(err);
                            resume(term);
                        } else {
                            if (res.output) {
                                var re = /\n(\x1b\[m)?$/;
                                var output = res.output.replace(re, '').
                                        replace(/\[\[/g, '&#91;&#91;').
                                        replace(/\]\]/g, '&#93;&#93;');
                                term.echo(output);
                            }
                            if (leash.cwd !== res.cwd) {
                                settings.onDirectoryChange(res.cwd);
                            }
                            leash.cwd = res.cwd;
                            leash.refresh_dir(function() {
                                resume(term);
                                deferr.resolve();
                            });
                        }
                    });
                }
                return deferr.promise();
            },
            option: function(name, value) {
                if (typeof value === 'undefined') {
                    return settings[name];
                } else {
                    settings[name] = value;
                }
            },
            wikipedia: function(text, title) {
                function list(list) {
                    if (list.length == 1) {
                        return list[0];
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
                        content = content.replace(/^\s*\|/gm, '').
                            split(/\|(?![^\]]+\])/);
                        var keys = {};
                        content = content.map(function(item) {
                            var m = item.match(/\s*(\w+)\s*=\s*(.*)/);
                            if (m) {
                                if (!isNaN(+m[1])) {
                                    return m[2];
                                } else {
                                    keys[m[1].toLowerCase()] = m[2];
                                    return '';
                                }
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
                                wiki = wiki.split('|');
                                if (wiki.length == 1) {
                                    return '][[bui;#fff;;wiki]' + wiki + '][[i;;]';
                                } else {
                                    return '][[bui;#fff;;wiki;' + wiki[0] + ']' +
                                        wiki[1] + '][[i;;]';
                                }
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
                    '(?:official website|official)': function(content) {
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
                        return $.terminal.substring(line, left, left+cols-1);
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
            completion: function(string, callback) {
                var command = this.get_command();
                var username = this.login_name();
                var execs;
                if (username == 'guest') {
                    execs = leash.settings.guest_commands;
                } else {
                    execs = (leash.dir.execs || []).concat(config.executables);
                }
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
                            return item.replace(/([() ])/g, '\\$1');
                        });
                    }
                }
                var cmd = $.terminal.parse_command(command);
                var re = new RegExp('^\\s*' + $.terminal.escape_regex(string));
                var token = leash.token;
                if (string.match(/^\$/)) {
                    shell('env', '/')(function(err, result) {
                        callback(result.output.split('\n').map(function(pair) {
                            return '$' + pair.split(/=/)[0];
                        }));
                    });
                } else if (command.match(re) || command === '') {
                    var commands = Object.keys(leash.commands);
                    callback(commands.concat(execs));
                } else {
                    var m = string.match(/(.*)\/([^\/]+)/);
                    var path;
                    if (cmd.name == 'cd') {
                        if (m) {
                            path = leash.cwd + '/' + m[1];
                            service.dir(token, path)(function(err, result) {
                                var dirs = (result.dirs || []).map(function(dir) {
                                    return m[1] + '/' + dir + '/';
                                });
                                callback(dirs);
                            });
                        } else {
                            callback(dirs_slash(leash.dir));
                        }
                    } else if (cmd.name == 'jargon') {
                        callback(leash.jargon);
                    } else {
                        if (m) {
                            path = leash.cwd + '/' + m[1];
                            service.dir(token, path)(function(err, result) {
                                var dirs = dirs_slash(result);
                                var dirs_files = (result.files || []).concat(dirs).
                                        map(function(file_dir) {
                                            return m[1] + '/' + file_dir;
                                        });
                                callback(dirs_files);
                            });
                        } else {
                            var dirs_files = (leash.dir.files || []).
                                    concat(dirs_slash(leash.dir));
                            callback(dirs_files);
                        }
                    }
                }
            },
            onPush: function(before, after) {
                var formatters = leash.formatters.slice().concat(after.formatters || []);
                $.terminal.defaults.formatters = formatters;
                formatters_stack.push(formatters);
            },
            onPop: function(before, after) {
                formatters_stack.pop();
                if (formatters_stack.length > 0) {
                    var last = formatters_stack[formatters_stack.length-1];
                    $.terminal.defaults.formatters = last;
                }
            },
            execRead: function(array, fn, options) {
                var settings = $.extend({
                    history: true,
                    context: null,
                    token: false
                }, options);
                var term = leash.terminal;
                var history = term.history();
                if (!settings.history) {
                    history.disable();
                }
                var args = [];
                if (settings.token) {
                    args.push(term.token());
                }
                (function recur() {
                    var spec = array.shift();
                    if (spec) {
                        if (typeof spec === 'object') {
                            if (spec.mask === true) {
                                term.set_mask(true);
                            }
                            prompt = spec.prompt;
                        } else {
                            prompt = spec;
                        }
                        term.read(prompt, function(string) {
                            args.push(string);
                            term.set_mask(false);
                            recur();
                        });
                    } else {
                        fn.apply(settings.context, args);
                    }
                })();
            },
            commands: {
                github: function(cmd, token, term) {
                    var parser = new optparse.OptionParser([
                        ['-u', '--username USER', 'owner of the repo'],
                        ['-r', '--repo REPO', 'repo to open']
                    ]);
                    parser.banner = 'Usage: github [options]';
                    var user, repo, branch = 'master';
                    parser.on('username', function(opt, value) {
                        user = value;
                    });
                    parser.on('repo', function(opt, value) {
                        repo = value;
                    });
                    parser.parse(cmd.args);
                    var base = 'https://api.github.com/repos';
                    var base_content;
                    var base_defer;
                    function dir(path, callback) {
                        var url = base + '/' + user + '/' + repo + '/contents/' + path;
                        $.ajax({
                            url: url,
                            type: 'GET',
                            success: function(data){
                                callback({
                                    dirs: data.filter(function(object) {
                                        return object.type == 'dir';
                                    }),
                                    files: data.filter(function(object) {
                                        return object.type == 'file';
                                    })
                                });
                            },
                            error: function(xhr, status, error) {
                                term.error(status + ' ' + error);
                                resume(term);
                            }
                        });
                    }
                    function file(path, callback) {
                        var url = 'https://raw.githubusercontent.com/' + user +
                                '/'+ repo + '/master/' + path;
                        $.ajax({
                            url: url,
                            type: 'GET',
                            success: callback,
                            error: function(data) {
                                term.error('file not found');
                                resume(term);
                            }
                        });
                    }
                    function list(data) {
                        term.echo(data.dirs.map(function(object) {
                            return colors.blue(object.name);
                        }).concat(data.files.map(function(object) {
                            return object.name;
                        })).join('\n'));
                    }
                    function show(path, callback) {
                        pause(term);
                        file(cwd + path, function(contents) {
                            callback(contents);
                            resume(term);
                        });
                    }
                    if (user && repo) {
                        var cwd = '/';
                        base_defer = $.Deferred();
                        dir('', function(data) {
                            base_content = data;
                            base_defer.resolve();
                        });
                        term.push(function(command) {
                            var cmd = $.terminal.parse_command(command);
                            if (cmd.name == 'cd') {
                                var path = cmd.args[0];
                                if (cmd.args[0] == '..') {
                                    path = cwd.replace(/[^\/]+\/$/, '');
                                } else {
                                    path = (cwd == '/' ? '' : cwd) + cmd.args[0];
                                }
                                pause(term);
                                base_defer = $.Deferred();
                                dir(path, function(data) {
                                    base_content = data;
                                    cwd = path;
                                    if (!cwd.match(/\/$/)) {
                                        cwd += '/';
                                    }
                                    resume(term);
                                    base_defer.resolve();
                                });
                            } else if (cmd.name == 'less') {
                                show(cmd.args[0], leash.less);
                            } else if (cmd.name == 'cat') {
                                show(cmd.args[0], term.echo);
                            } else if (cmd.name == 'ls') {
                                if (cmd.args == 0) {
                                    list(base_content);
                                } else {
                                    pause(term);
                                    dir(cmd.args[0], function(data) {
                                        list(data);
                                        resume(term);
                                    });
                                }
                            } else {
                                term.echo('unknown command ' + cmd.name);
                            }
                        }, {
                            prompt: function(callback) {
                                var name = colors.green(user + '&#64;' + repo);
                                var path = cwd;
                                if (path != '/') {
                                    path = '/' + path.replace(/\/$/, '');
                                }
                                callback(name + colors.grey(':') + colors.blue(path) + '$ ');
                            },
                            name: 'github',
                            completion: function(string, callback) {
                                var command = $.terminal.parse_command(this.get_command());
                                var m = string.match(/(.*)\/([^\/]+)/);
                                if (m) {
                                    dir(m[1], function(data) {
                                        if (command.name == 'cd') {
                                            callback(data.dirs.map(function(object) {
                                                return m[1] + '/' + object.name + '/';
                                            }));
                                        } else {
                                            callback(data.files.map(function(object) {
                                                return m[1] + '/' + object.name + '/';
                                            }).concat(data.dirs.map(function(object) {
                                                return m[1] + '/' + object.name;
                                            })));
                                        }
                                    });
                                } else {
                                    base_defer.then(function() {
                                        if (command.name == 'cd') {
                                            callback(base_content.dirs.map(function(object) {
                                                return object.name + '/';
                                            }));
                                        } else {
                                            callback(base_content.files.map(function(object) {
                                                return object.name;
                                            }).concat(base_content.dirs.map(function(object) {
                                                return object.name + '/';
                                            })));
                                        }
                                    });
                                }
                            }
                        });
                    } else {
                        term.echo(parser);
                    }
                },
                download: function(cmd, token, term) {
                    if (cmd.args.length == 1) {
                        var filename = leash.cwd + '/' + cmd.args[0];
                        var iframe = $('<iframe/>').hide();
                        var time = +new Date();
                        var params = $.param({
                            filename: filename,
                            token: token,
                            v: time // no cache
                        });
                        // this is not triggered on complete download but we don't care
                        // since we only want to remove the iframe
                        var id = setInterval(function() {
                            if (iframe[0].contentDocument &&
                                iframe[0].contentDocument.readyState == 'complete') {
                                iframe.remove();
                                clearInterval(id);
                            }
                        }, 500);
                        iframe.attr('src', 'lib/download.php?' + params);
                        iframe.appendTo('body');
                    } else {
                        term.echo('usage: download {FILENAME}');
                    }
                },
                pushd: function(cmd, token, term) {
                    if (cmd.args.length == 1) {
                        var dir = leash.cwd;
                        if (dir_stack.length == 0) {
                            dir_stack.push(dir);
                        }
                        leash.shell('cd ' + cmd.args[0], token, term).then(function() {
                            dir_stack.push(leash.cwd);
                            term.echo(dir_stack.slice().reverse().join(' '));
                        });
                    } else {
                        term.echo('usage: pushd {DIRECTORY}');
                    }
                },
                popd: function(cmd, token, term) {
                    if (dir_stack.length > 1) {
                        dir_stack.pop();
                        var dir = dir_stack[dir_stack.length-1];
                        leash.shell('cd ' + dir, token, term).then(function() {
                            term.echo(dir_stack.slice().reverse().join(' '));
                        });
                    } else {
                        term.echo('popd: directory stack empty');
                        dir_stack = [];
                    }
                },
                update: function(cmd, token, term) {
                    leash.animation.start(400);
                    leash.service.update(token)(function(err, result) {
                        if (err) {
                            print_error(err);
                        } else if (result) {
                            term.echo('[[;#ff0;]Leash updated, you can now refresh ' +
                                      'the browser]');
                        } else {
                            term.error('No new version available');
                        }
                        leash.animation.stop();
                    });
                },
                rfc: function(cmd, token, term) {
                    var number = cmd.args.length ? cmd.args[0] : null;
                    pause(term);
                    leash.service.rfc(number)(function(err, rfc) {
                        if (err) {
                            print_error(err);
                        } else {
                            leash.less(rfc.replace(/^[\s\n]+|[\s\n]+$/g, ''));
                        }
                        resume(term);
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
                bzless: less_command('bzcat'),
                zless: less_command('zcat'),
                xzless: less_command('xzcat'),
                less: less_command('cat'),
                record: function(cmd, token, term) {
                    if (cmd.args[0] == 'start') {
                        term.history_state(true);
                    } else if (cmd.args[0] == 'stop') {
                        term.history_state(false);
                    } else {
                        term.echo('usage: record [stop|start]');
                    }
                },
                timer: function(cmd, token, term) {
                    function usage() {
                        term.echo('usage: timer time [command]\ntime - number [smh]');
                    }
                    if (cmd.args.length > 1) {
                        var time = cmd.args[0];
                        var m = time.match(/^([0-9.]+)([smh])$/);
                        if (m) {
                            var command = cmd.rest.trim().replace(/^[0-9.]+[smh]?/, '');
                            time = parseFloat(m[1]);
                            switch(m[2]) {
                            case 'h':
                                time *= 24;
                            case 'm':
                                time *= 60;
                            case 's':
                                time *= 1000;
                            }
                            pause(term);
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
                            pause(term);
                            service.valid_password(token, old_p)(function(err, valid) {
                                if (valid) {
                                    service.change_password(token, new_p)(function(err) {
                                        if (!err) {
                                            term.echo('Password successfully changed');
                                        } else {
                                            term.error(err.message);
                                        }
                                        term.pop().pop();
                                        resume(term);
                                        term.set_mask(false).history().enable();
                                    });
                                } else {
                                    term.error('Current password is not valid');
                                    term.pop().pop();
                                    resume(term);
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
                        completion = function(string, callback) {
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
                            resume(term);
                            if (status == "Invalid JSON") {
                                term.error(xhr.responseText);
                            }
                            defer.reject();
                        });
                        completion = function(string, callback) {
                            defer.then(callback).fail(function() {
                                callback([]);
                            });
                        };
                    }
                    term.push(function(command) {
                        var cmd = $.terminal.parse_command(expand_env_vars(command));
                        pause(term);
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
                            resume(term);
                        }, function(xhr, status, text) {
                            term.error('[AJAX]: ' + status);
                            resume(term);
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
                                  'usage: wikipedia [{ARTICLE} |-s {TERM}]\n\n' +
                                  '-s {SEARCH TERM}');
                    } else {
                        pause(term);
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
                                        resume(term);
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
                                    var text = members.map(function(member) {
                                        return '[[bu;#fff;;wiki]' + member.title + ']';
                                    }).join('\n');
                                    var re = /(\[\[bu;#fff;;wiki\]Category)/;
                                    wiki(function(article) {
                                        text = article.replace(re, text + '\n\n$1');
                                        leash.less(text, exit);
                                        resume(term);
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
                                resume(term);
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
                        pause(term);
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
                            resume(term);
                        });
                    } else {
                        pause(term);
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
                                    var re = new RegExp("((?:https?|ftps?)://\\S+)|" +
                                                        "\\.(?!\\s|\\]\\s)\\)?", "g");
                                    var def = entry.def.replace(re, function(text, g) {
                                        return g ? g : (text == '.)' ? '.) ' : '. ');
                                    });
                                    re = /\[(?![^;\]]*;[^;\]]*;[^\]]*\])[^\]]+\]/g;
                                    def = def.replace(re, function(text) {
                                        return text.replace(/\]/g, '\\]');
                                    });
                                    return text + '\n' + def + '\n';
                                }).join('\n');
                                term.echo(def.replace(/\n$/, ''), {
                                    keepWords: true
                                });
                            }
                            resume(term);
                        });
                    }
                },
                man: function(cmd, token, term) {
                    if (cmd.args.length === 0) {
                        term.echo('usage: man {COMMAND}');
                    } else {
                        pause(term);
                        var command = 'MANWIDTH=' + term.cols() + ' ' + cmd.command;
                        shell(command, '/')(function(err, ret) {
                            leash.less($.terminal.overtyping(ret.output));
                            resume(term);
                        });
                    }
                },
                sqlite: function(cmd, token, term) {
                    pause(term);
                    var fn;
                    if (!cmd.args.length) {
                        term.error('You need to provide the file');
                        resume(term);
                        return;
                    }
                    if (cmd.args[0].match(/^\//)) {
                        fn = cmd.args[0];
                    } else {
                        fn = leash.cwd + '/' + cmd.args[0];
                    }
                    function push(tables) {
                        var keywords = sqlite_keywords();
                        term.push(function(q) {
                            if (q.match(/^\s*help\s*$/)) {
                                term.echo('show tables:\n\tSELECT name FROM sqlite_m'+
                                          'aster WHERE type = "table"\ndescribe tabl'+
                                          'e:\n\tPRAGMA table_info([TABLE NAME])');
                            } else {
                                pause(term);
                                leash.service.sqlite_query(token, fn, q)(prn_sql_result);
                            }
                        }, {
                            name: 'sqlite',
                            prompt: 'sqlite> ',
                            completion: ['help'].concat(keywords).concat(tables),
                            formatters: [sql_formatter(keywords, tables, 'white')]
                        });
                    }
                    var query = 'SELECT name FROM sqlite_master WHERE type = "table"';
                    leash.service.sqlite_query(token, fn, query)(function(err, res) {
                        if (err) {
                            term.error(err.message);
                        } else {
                            push(res.map(function(assoc) {
                                return assoc['name'];
                            }));
                        }
                        resume(term);
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
                        pause(term);
                        var db;
                        function mysql_query(query) {
                            pause(term);
                            service.mysql_query(token, db, query)(prn_sql_result);
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
                            var keywords = mysql_keywords();
                            term.push(mysql_query, {
                                prompt: prompt,
                                name: 'mysql',
                                onExit: function() {
                                    mysql_close(db);
                                },
                                completion: keywords.concat(tables),
                                formatters: [sql_formatter(keywords, tables, 'white')]
                            });
                            resume(term);
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
                                    resume(term);
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
                    var parser = new optparse.OptionParser([
                        ['-u', '--user USER', 'User or root if not specified']
                    ]);
                    var user = 'root';
                    parser.on('user', function(opt, value) {
                        user = value;
                    });
                    parser.parse(cmd.args);
                    var unload = (function() {
                        var level = term.level();
                        return function unload() {
                            if (term.level() == level + 1) {
                                term.logout();
                            }
                        };
                    })();
                    function prompt(callback) {
                        var server, path;
                        if (config && config.server) {
                            server = config.server;
                        } else {
                            server = 'unknown';
                        }
                        if (config && leash.cwd && config.home != '/') {
                            var home = $.terminal.escape_regex(config.home);
                            var re = new RegExp('^' + home);
                            path = leash.cwd.replace(re, '~');
                        } else {
                            path = leash.cwd;
                        }
                        user = user || $.terminal.active().login_name();
                        callback(unix_prompt(user, server, path));
                    }
                    term.history().disable();
                    function login(password) {
                        var is_interpreter = arguments.length == 2;
                        pause(term);
                        service.login(user, password)(function(err, token) {
                            term.history().enable();
                            if (is_interpreter) {
                                term.pop().set_mask(false);
                            }
                            if (err) {
                                term.error(err.message);
                            } else if (token) {
                                cwd.push(leash.cwd);
                                interpreters.push(leash.make_interpreter(token));
                                term.push(leash.interpreter, {
                                    prompt: prompt,
                                    name: 'su_' + user,
                                    onExit: function() {
                                        leash.cwd = cwd.pop();
                                        settings.onDirectoryChange(leash.cwd);
                                        interpreters.pop();
                                        leash.env.TOKEN = term.token(true);
                                        $(window).off('unload', unload);
                                    }
                                });
                                term.set_token(token);
                            } else {
                                term.error('Wrong password');
                            }
                            resume(term);
                        });
                        $(window).unload(unload);
                    }
                    term.set_mask(true).push(login, {
                        prompt: 'password: '
                    });
                },
                adduser: function(cmd, token, term) {
                    var password = {
                        prompt: 'password: ',
                        mask: true
                    };
                    var specs = ['user: ', password, 'home: '];
                    function add_user(token, username, password, home) {
                        service.add_user(token, username, password, home)(function(err) {
                            if (err) {
                                term.error(err.message);
                            } else {
                                term.echo('user ' + username + ' added to leash');
                            }
                        });
                    }
                    leash.execRead(specs, add_user, {
                        history: false,
                        token: true
                    });
                },
                deluser: function(cmd, token, term) {
                    if (cmd.args.length != 1) {
                        term.echo('remove leash user\nusage:\ndeluser [username]');
                    } else {
                        var username = cmd.args[0];
                        function confirm(err) {
                            if (err) {
                                print_error(err);
                            } else {
                                term.echo('user ' + username + ' removed');
                            }
                        }
                        term.push(function(remove) {
                            if (remove.match(/^(y(es)?|n(o)?)$/i)) {
                                if (remove.match(/^y/i)) {
                                    service.remove_user(token, username)(confirm);
                                }
                                term.pop();
                            }
                        }, {
                            prompt: 'Are you sure you want to delete this' +
                                ' account (Y/N)? '
                        });
                    }
                },
                purge: function(cmd, token, term) {
                    term.logout().purge();
                },
                help: function(cmd, token, term) {
                    function format(commands) {
                        commands = commands.map(function(command) {
                            return '[[b;#fff;]' + command + ']';
                        });
                        if (commands.length == 0) {
                            return '';
                        } else if (commands.length == 1) {
                            return commands[0];
                        }
                        return commands.slice(0, -1).join(', ') + ' and ' +
                            commands[commands.length-1];
                    }
                    term.echo('leash build in commands: ' + format(Object.keys(leash.commands)), {
                        keepWords: true
                    });
                    term.echo('all other commands are exectute by the shell');
                    if (leash.settings.guest_commands.length) {
                        term.echo('guest users can only exeucte: ' +
                                  format(leash.settings.guest_commands));
                    } else {
                        term.echo("guest users can't execute any commands");
                    }
                },
                grab: function(cmd, token, term) {
                    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                        var media = navigator.mediaDevices.getUserMedia({video: true});
                        media.then(function(mediaStream) {
                            var mediaStreamTrack = mediaStream.getVideoTracks()[0];
                            var imageCapture = new ImageCapture(mediaStreamTrack);
                            return imageCapture.takePhoto();
                        }).then(function(blob) {
                            var parser = new optparse.OptionParser([
                                ['-u', '--upload FILENAME', 'filename to upload to the server'],
                                ['-h', '--help', 'Display help screen']
                            ]);
                            var filename;
                            parser.on('upload', function(opt, value) {
                                filename = value;
                            });
                            var help;
                            parser.on('help', function() {
                                help = true;
                            });
                            parser.parse(cmd.args);
                            if (help) {
                                term.echo(parser);
                            } else if (filename) {
                                var uploader = new Uploader(leash);
                                var file = new File([blob], filename);
                                uploader.upload(file, leash.cwd).then(function() {
                                    term.echo('uploaded to ' + leash.cwd);
                                });
                            } else {
                                var image = URL.createObjectURL(blob);
                                term.echo('<img src="' + image + '"/>', {
                                    raw: true,
                                    finialize: function(div) {
                                        div.find('img').on('load', function() {
                                            URL.revokeObjectURL(this.src);
                                        });
                                    }
                                });
                            }
                        }).catch(function(error) {
                            term.error('Device Media Error: ' + error);
                        });
                    } else {
                        term.error('Image capture API don\'t supported by this device');
                    }
                }
            }// commands
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
                    if (config && leash.cwd && config.home != '/') {
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
                    settings.onDirectoryChange(leash.cwd);
                    leash.dir = view.dir;
                    leash.terminal.set_prompt(leash.prompt);
                };
                leash.onExport = function() {
                    return {
                        cwd: leash.cwd,
                        dir: leash.dir
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
                    login_callback[index] = callback;

                    // we need to pause because prompt was flickering
                    // and pause should be always called before ajax call
                    var self = this;
                    self.pause();
                    service.login(user, password)(function(err, token) {
                        login_callback[index] = null; // we are fine now
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
    }
    // callback to set invalid token on auth when there was an error
    var i = 0;
    var login_callback = {};
    return function(options) {
        var d = new $.Deferred();
        var index = i++;
        if (options.service) {
            $.when(options.service).then(function(service) {
                init(service, index, d);
            });
        } else {
            rpc({
                url: options.url || '',
                error: function(error) {
                    console.log(error);
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
                            resume(terminal);
                        });
                    } else {
                        alert(message);
                    }
                    if (login_callback[index]) {
                        login_callback[index](null, true);
                    }
                },
                debug: function(json, type) {
                    var arrow = type == 'request' ? '->' : '<-';
                    //console.log(arrow + ' ' + JSON.stringify(json));
                }
            })(function(service) {
                init(service, i, d, options || {});
            });
        }
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
        var leash_settings = $.extend({}, {
            disable: [],
            url: '',
            service: null
        }, options && options.leash || {});
        var d = $.Deferred();
        var len = this.length;
        var result = [];
        this.each(function(i) {
            var self = $(this);
            var leash_promise = leash(leash_settings);
            self.data('leash', leash_promise);
            leash_promise.then(function(leash) {
                if (leash_settings.disable.length) {
                    leash_settings.disable.forEach(function(command) {
                        delete leash.commands[command];
                    });
                }
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
                    onPop: leash.onPop,
                    onPush: leash.onPush,
                    extra: {
                        formatters: leash.formatters
                    },
                    name: 'leash',
                    outputLimit: 500,
                    greetings: leash.greetings,
                    keypress: function(e) {
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
                    var org = e.originalEvent;
                    if (!terminal.token()) {
                        return;
                    }
                    var uploader = new Uploader(leash);
                    var items;
                    if (org.dataTransfer.items) {
                        items = [].slice.call(org.dataTransfer.items);
                    }
                    var files = (org.dataTransfer.files || org.target.files);
                    if (files) {
                        files = [].slice.call(files);
                    }
                    function complete() {
                        leash.refresh_dir();
                    }
                    if (items && items.length) {
                        if (items[0].webkitGetAsEntry) {
                            var entries = [];
                            items.forEach(function(item) {
                                var entry = item.webkitGetAsEntry();
                                if (entry) entries.push(entry);
                            });
                            (function upload() {
                                var entry = entries.shift();
                                if (entry) {
                                    uploader.upload_tree(entry, leash.cwd).then(upload);
                                } else {
                                    complete();
                                }
                            })();
                        }
                    } else if (files && files.length) {
                        (function upload() {
                            var file = files.shift();
                            if (file) {
                                uploader.upload(file, leash.cwd).then(upload);
                            } else {
                                complete();
                            }
                        })();
                    } else if (org.dataTransfer.getFilesAndDirectories) {
                        org.dataTransfer.getFilesAndDirectories().then(function(items) {
                            (function upload() {
                                var item = items.shift();
                                if (item) {
                                    uploader.upload_tree(item, leash.cwd).then(upload);
                                } else {
                                    complete();
                                }
                            })();
                        });
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
