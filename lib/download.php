<?php
/**
 *  This file is part of Leash (Browser Shell)
 *  Copyright (C) 2013-2018  Jakub Jankiewicz <http://jcubic.pl/me>
 *
 *  Released under the MIT license
 *
 */

require('Service.php');
$service = new Service('config.json', getcwd() . '/..');
if ($service->valid_token($_GET['token']) && isset($_GET['filename']) && file_exists($_GET['filename'])) {
    $size = filesize($_GET['filename']);
    header('Content-Type: application/octet-stream');
    header('Content-Transfer-Encoding: Binary');
    header('Content-disposition: attachment; filename="' . basename($_GET['filename']) . '"');
    header('Content-Length: ' . $size);
    header('Content-Range: 0-' . ($size-1) . '/' . $size);
    readfile($_GET['filename']); // do the double-download-dance (dirty but worky)
    $file = fopen($_GET['filename'], 'r');
    while ($buff = fread($file, 1048576)) { // 1MB
        write($buff);
    }
    fclose($file);
} else {
    echo 'wrong args';
}

?>
