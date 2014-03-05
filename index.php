<?php

define('__DEVEL__', true);

if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) &&
    $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest') {
    require('lib/json-rpc/json-rpc.php');
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
    <link href="lib/terminal/css/jquery.terminal.css" rel="stylesheet"/>
    <link href="css/style.css" rel="stylesheet"/>
    <link href="lib/micro/css/jquery.micro.css" rel="stylesheet"/>
    <style>
/* some styles before I move them to style.css */
    </style>
    <script src="lib/jquery-1.11.0.min.js"></script>
    <script src="lib/json-rpc/json-rpc.js"></script>
    <!-- for devel I use ../ since I work on those tools in pararel -->
    <script src="../terminal/js/jquery.terminal-src.js"></script>
    <script src="lib/terminal/js/jquery.mousewheel-min.js"></script>
    <script src="lib/browser.js"></script>
    <script src="lib/optparse/lib/optparse.js"></script>
    <script src="lib/jquery-hashchange/jquery.ba-hashchange.min.js"></script>
    <script src="../micro/js/jquery.micro-src.js"></script>
    <script src="leash<?= __DEVEL__ ? "-src" : ".min" ?>.js"></script>
</head>
<body>
    <div id="shell"></div>
    <div id="micro"></div>
    <div id="jsvi"></div>
</body>
</html>
