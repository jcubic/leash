<?php
/**
 *  This file is part of Leash (Browser Shell)
 *  Copyright (C) 2013-2015  Jakub Jankiewicz <http://jcubic.pl/me>
 *
 *  Released under the MIT license
 *
 */
error_reporting(E_ERROR | E_WARNING | E_PARSE | E_NOTICE);
ini_set('display_errors', 'On');

require('lib/Service.php');
$service = new Service('config.json', getcwd());
if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) &&
    $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest') {
    require_once('lib/json-rpc.php');
    if ($service->debug()) {
        error_reporting(E_ERROR | E_WARNING | E_PARSE | E_NOTICE);
        ini_set('display_errors', 'On');
    }
    echo handle_json_rpc($service);
    exit;
}

?><!DOCTYPE HTML>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8" />
    <title>Leash</title>
    <meta name="Description" content=""/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="shortcut icon" href="favicon.ico"/>
    <!--[if IE]>
    <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->
    <?php if ($service->debug()) { ?>
        <link href="css/jquery.terminal.css?<?= time() ?>" rel="stylesheet"/>
    <?php } else { ?>
        <link href="css/jquery.terminal.css" rel="stylesheet"/>
    <?php } ?>
    <link href="css/style.css" rel="stylesheet"/>
    <style>
     /* some styles before I move them to style.css */
    </style>
</head>
<body>
  <div id="splash">
    <div>
      <pre>
   __   _______   ______ __
  / /  / __/ _ | / __/ // /
 / /__/ _// __ |_\ \/ _  /
/____/___/_/ |_/___/_//_/

       <span>[ LOADING ]</span>
      </pre>
    </div>
  </div>
  <div id="shell" style="display:none"></div>
  <?php if ($service->debug()) { ?>
      <script src="lib/jquery-1.12.0.js"></script>
  <?php } else { ?>
      <script src="lib/jquery-1.12.0.min.js"></script>
  <?php } ?>
  <script src="lib/json-rpc.js"></script>
  <script src="lib/wcwidth.js"></script>
  <?php if ($service->debug()) { ?>
    <script src="lib/jquery.terminal-src.js?<?= time() ?>"></script>
  <?php } else { ?>
    <script src="lib/jquery.terminal.min.js"></script>
  <?php } ?>
  <script src="lib/unix_formatting.js"></script>
  <script src="lib/jquery.mousewheel-min.js"></script>
  <script src="lib/browser.js"></script>
  <script src="lib/optparse.js"></script>
  <script src="lib/jquery.ba-hashchange.min.js"></script>
  <script src="https://rawgit.com/cvan/keyboardevent-key-polyfill/master/index.js"></script>
  <script src="lib/sysend.js"></script>
  <?php if ($service->debug()) { ?>
    <script src="leash-src.js?<?= time() ?>"></script>
  <?php } else { ?>
    <script src="leash.min.js"></script>
  <?php } ?>
  <script>
   keyboardeventKeyPolyfill.polyfill();
   var d = $.Deferred();
   $.leash = d.promise();
   $(function() {
       $('#shell').css({
           overflow: 'auto'
       }).leash().then(function(leash) {
           $('#splash').hide();
           d.resolve(leash);
           // terminal is created after async call so we need to get terminal
           // instance in a promise otherwise it will be created here.
           var terminal = $('#shell').show().terminal();
           var $win = $(window);
           $win.resize(function() {
               var height = $win.height();
               terminal.innerHeight(height);
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
              if (is_dir($dir . $file) && file_exists($dir . $file . '/init.js')) {
                  echo '    <script src="' . $dir. $file . '/init.js"></script>';
              }
          }
          closedir($dh);
      }
  }
  ?>
  <?php if (file_exists('init.js')) { ?>
    <script src="init.js"></script>
  <?php } ?>
</body>
</html>
