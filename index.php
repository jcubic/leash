<?php

define('__DEVEL__', false);

if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) &&
    $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest') {
    require('lib/json-rpc.php');
    require('lib/Service.php');
    if (__DEVEL__) {
        error_reporting(E_ERROR | E_WARNING | E_PARSE | E_NOTICE);
        ini_set('display_errors', 'On');
    }
    echo handle_json_rpc(new Service('config.json', getcwd()));
    exit;
}

?><!DOCTYPE HTML>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8" />
    <title>Leash</title>
    <meta name="Description" content=""/>
    <link rel="shortcut icon" href="favicon.ico"/>
    <!--[if IE]>
    <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->
    <link href="css/jquery.terminal.css" rel="stylesheet"/>
    <link href="css/style.css" rel="stylesheet"/>
    <link href="css/jquery.micro.css" rel="stylesheet"/>
    <style>
/* some styles before I move them to style.css */
    </style>
    <script src="lib/jquery-1.11.0.min.js"></script>
    <script src="lib/json-rpc.js"></script>
    <?php if (__DEVEL__) { ?>
    <script src="lib/jquery.terminal-src.js"></script>
    <?php } else { ?>
    <script src="lib/jquery.terminal-min.js"></script>
    <?php } ?>
    <script src="lib/jquery.mousewheel-min.js"></script>
    <script src="lib/browser.js"></script>
    <script src="lib/optparse.js"></script>
    <script src="lib/jquery.ba-hashchange.min.js"></script>
    <script src="lib/jquery.micro-min.js"></script>
    <?php if (__DEVEL__) { ?>
      <script src="leash-src.js"></script>
    <?php } else { ?>
    <script src="leash.min.js"></script>
    <?php } ?>
</head>
<body>
    <div id="shell"></div>
    <div id="micro"></div>
    <div id="jsvi"></div>
    <script>
$(function() {
    leash().then(function(leash) {
        terminal = $('#shell').terminal(leash.interpreter, {
            onInit: leash.init,
            maskChar: '',
            completion: leash.completion,
            linksNoReferer: true,
            historyFilter: /^[^\s]/,
            /*
            onResize: function(term) {
                term.trigger('resize');
            },
            */
            onBeforeLogout: function(term) {
                var token = term.token();
                // if token is invalid it will be set to undefined and this
                // will not be triggered
                if (token) {
                    leash.service.logout()(function() {
                        // nothing to do here, logout will remove the token
                    });
                }
            },
            prompt: leash.prompt,
            login: leash.login,
            name: 'leash',
            outputLimit: 500,
            greetings: leash.greetings
        }).css({
            overflow: 'auto'
        });
        var $win = $(window);
        $win.resize(function() {
            var height = $win.height();
            terminal.innerHeight(height);
            $('#micro').height(height);
        }).resize();
        terminal.resize();
    });
});
    </script>
</body>
</html>
