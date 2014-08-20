<?php

define('__DEVEL__', true);

error_reporting(E_ERROR | E_WARNING | E_PARSE | E_NOTICE);
ini_set('display_errors', 'On');

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
    <script src="lib/sysend.js"></script>
    <?php if (__DEVEL__) { ?>
      <script src="leash-src.js"></script>
    <?php } else { ?>
    <script src="leash.min.js"></script>
    <?php } ?>
    <script>
        var d = $.Deferred();
        $.leash = d.promise();

        $(function() {
            $('#shell').css({
                overflow: 'auto'
            }).leash().then(function(leash) {
                d.resolve(leash);
                // terminal is created after async call so we need to get terminal
                // instance in a promise otherwise it will be created here.
                var terminal = $('#shell').terminal();
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
    <?php
    $dir = 'lib/apps/';
    if (is_dir($dir)) {
        if ($dh = opendir($dir)) {
            while (($file = readdir($dh)) !== false) {
                if (is_dir($dir.$file) && file_exists($dir .$file . '/init.js')) {
                    echo '    <script src="' . $dir.$file . '/init.js"></script>';
                }
            }
            closedir($dh);
        }
    }
    ?>
    <?php if (file_exists('init.js')) { ?>
    <script src="init.js"></script>
    <?php } ?>
</head>
<body>
    <div id="shell"></div>
</body>
</html>
