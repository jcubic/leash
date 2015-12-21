<?php
/**
 *  This file is part of Leash (Browser Shell)
 *  Copyright (C) 2013-2015  Jakub Jankiewicz <http://jcubic.pl>
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
 */

require('lib/Service.php');
$service = new Service('config.json', getcwd());
if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) &&
    $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest') {
    require('lib/json-rpc.php');
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
    <link rel="shortcut icon" href="favicon.ico"/>
    <!--[if IE]>
    <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->
    <link href="css/jquery.terminal.css" rel="stylesheet"/>
    <link href="css/style.css" rel="stylesheet"/>
    <style>
     /* some styles before I move them to style.css */
    .DlDesktop { display: none; }
    .Ymacs-frame-content {
        display: inline-block;
        min-width: 100%;
    }
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
  <script src="lib/jquery-1.11.2.js"></script>
  <script src="lib/json-rpc.js"></script>
  <?php if ($service->debug()) { ?>
    <script src="lib/jquery.terminal-src.js"></script>
  <?php } else { ?>
    <script src="lib/jquery.terminal-min.js"></script>
  <?php } ?>
  <script src="lib/unix_formatting.js"></script>
  <script src="lib/jquery.mousewheel-min.js"></script>
  <script src="lib/browser.js"></script>
  <script src="lib/optparse.js"></script>
  <script src="lib/jquery.ba-hashchange.min.js"></script>
  <script src="lib/sysend.js"></script>
  <?php if ($service->debug()) { ?>
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
           $('#splash').hide();
           d.resolve(leash);
           // terminal is created after async call so we need to get terminal
           // instance in a promise otherwise it will be created here.
           var terminal = $('#shell').show().terminal();
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
