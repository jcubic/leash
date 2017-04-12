<?php
/**
 *  This file is part of Leash (Browser Shell)
 *  Copyright (C) 2013-2017  Jakub Jankiewicz <http://jcubic.pl/me>
 *
 *  Released under the MIT license
 *
 */

class Logger {
    function __construct($path) {
        $this->file = fopen($path, 'a+');
    }
    function log($str) {
        fwrite($this->file, "[" . date("d-m-Y H:i:s") . "]: " . $str . "\n");
    }
    function __destruct() {
        fclose($this->file);
    }
}
