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
    <link href="lib/terminal/css/jquery.terminal.css" rel="stylesheet"/>
    <style>
body {
    margin: 0;
    padding: 0;
    background-color: black;
}
.terminal {
    font-weight: bold;
}
    </style>
    <script src="http://code.jquery.com/jquery-latest.min.js"></script>
    <script src="lib/json-rpc/json-rpc.js"></script>
    <script src="../terminal/js/jquery.terminal-src.js"></script>
    <script src="lib/terminal/js/jquery.mousewheel-min.js"></script>
    <script src="baus-src.js"></script>
</head>
<body>
    <div id="shell"></div>
</body>
</html>
