<?php

define('__DEBUG__', true);

if ($_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest') {
    require('lib/json-rpc/json-rpc.php');
    require('lib/Service.php');
    if (__DEBUG__) {
        error_reporting(E_ERROR | E_WARNING | E_PARSE | E_NOTICE);
        ini_set('display_errors', 'On');
    }
    echo handle_json_rpc(new Service('config.json'));
    exit;
}

?><!DOCTYPE HTML>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8" />
    <title></title>
    <meta name="Description" content=""/>
    <link rel="shortcut icon" href=""/>
    <!--[if IE]>
    <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->
    <!--
    <link href="css/style.css" rel="stylesheet"/>
    -->
    <link href="lib/terminal/css/jquery.terminal.css" rel="stylesheet"/>
    <style>
body {
    margin: 0;
    padding: 0;
}
.terminal {
    font-weight: bold;
}
    </style>
    <script src="http://code.jquery.com/jquery-latest.min.js"></script>
    <script src="lib/json-rpc/json-rpc.js"></script>
    <script src="lib/terminal/js/jquery.terminal-min.js"></script>
    <script src="lib/terminal/js/jquery.mousewheel-min.js"></script>
    <script>
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
                'Browser Access Unix Shell',
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
    </script>
</head>
<body>
    <div id="shell"></div>
</body>
</html>
