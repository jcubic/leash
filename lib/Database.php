<?php
/**
 *  This file is part of Leash (Browser Shell)
 *  Copyright (C) 2013-2016  Jakub Jankiewicz <http://jcubic.pl>
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


class DatabaseException extends Exception {
    function __construct($msg) {
        Exception::__construct($msg, 100);
    }
}

class Database {
    function __construct($host, $user, $pass, $db) {
        $this->conn = new mysqli($host, $user, $pass);
        $this->conn->select_db($db);
        if ($this->conn->connect_errno) {
            throw new DatabaseException("Connect failed: " .
                                        $this->conn->connect_error);
        }
    }
    function escape($string) {
        return $this->conn->real_escape_string($string);
    }
    function query($query) {
        $ret = $this->conn->query($query);
        if (!$ret) {
            throw new DatabaseException($this->conn->error);
        }
        return $ret;
    }
    function affected_rows() {
        return $this->conn->affected_rows;
    }
    function get_array($query) {
        $result = array();
        $ret = $this->query($query);
        if (gettype($ret) == 'boolean') {
            return $ret;
        }
        if ($ret->num_rows == 0) {
            return $result;
        }
        while ($row = $ret->fetch_assoc()) {
            $result[] = $row;
        }
        $ret->close();
        return $result;
    }
    function get_row($query) {
        $result = array();
        $ret = $this->query($query);
        $result = $ret->fetch_assoc();
        $ret->close();
        return $result;
    }
    function get_assoc($query) {
        $ret = $this->query($query);
        if ($ret->num_rows == 0) {
            return array();
        }
        $result = $ret->fetch_assoc();
        $ret->close();
        return $result;
    }
    function get_column($query) {
        $result = array();
        $ret = $this->query($query);
        if ($ret->num_rows == 0) {
            return $result;
        }
        while ($row = $ret->fetch_row()) {
            $result[] = $row[0];
        }
        $ret->close();
        return $result;
    }
    function get_value($query) {
        $result = array();
        $ret = $this->query($query);
        $result = $ret->fetch_row();
        $ret->close();
        return $result[0];
    }
    function __call($name, $argv) {
        return call_user_func_array(array($this->conn, $name), $argv);
    }
}