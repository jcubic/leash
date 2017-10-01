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
        $this->file = @is_writable($path) ? fopen($path, 'a+') : null;
    }
    function log($str) {
        if ($this->file) {
            fwrite($this->file, "[" . date("d-m-Y H:i:s") . "]: " . $str . "\n");
        }
    }
    function __destruct() {
        if ($this->file) {
            fclose($this->file);
        }
    }
}
