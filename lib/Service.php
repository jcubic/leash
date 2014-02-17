<?php
/**
 *  This file is part of Bush.js (acronym for Browser Unix Shell)
 *  Copyright (C) 2013  Jakub Jankiewicz <http://jcubic.pl>
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

require('Database.php');

class User {
    function __construct($username, $password) {
        $this->username = $username;
        $this->password = $password;
    }
}

class Session {
    public $storage;
    public $token;
    public $username;
    private function __construct($username, $token, $storage) {
        $this->storage = $storage;
        $this->token = $token;
        $this->username = $username;
    }
    function __get($name) {
        return $this->storage->$name;
    }
    function __set($name, $value) {
        $this->storage->$name = $value;
    }
    function __isset($name) {
        return isset($this->storage->$name);
    }
    static function create_sessions($sessions) {
        $result = array();
        foreach ($sessions as $session) {
            $result[] = new Session($session->username,
                                    $session->token,
                                    $session->storage);
        }
        return $result;
    }
    static function cast($stdClass) {
        $storage = $stdClass->storage ? $stdClass->storage : new stdClass();
        return new Session($stdClass->username, $stdClass->token, $storage);
    }
    static function new_session($username) {
        $token = sha1(array_sum(explode(' ', microtime())));
        return new Session($username, $token, new stdClass());
    }
}


class Service {

    protected $config_file;
    protected $config;
    const password_crypt = 'sha1';
    const password_regex = '/([A-Za-z_][A-Za-z0-9_]+):(.*)/';

    function __construct($config_file) {
        $this->config_file = $config_file;
        if (file_exists($config_file)) {
            try {
                $this->config = json_decode(file_get_contents($config_file));
            } catch (Exception $e) {
                $this->config = new stdClass();
            }
            $full_path = getcwd() . "/" . $this->config_file;
            // it had no write permission when first created while testing
            if (!is_writable($full_path)) {
                chmod($full_path, 0755);
            }
        } else {
            $this->config = new stdClass();
        }
        if (!isset($this->config->sessions) || !is_array($this->config->sessions)) {
            $this->config->sessions = array();
        } else {
            $this->config->sessions = array_map(function($session) {
                return Session::cast($session);
            }, array_filter($this->config->sessions, function($session) {
                return isset($session->token) && isset($session->username);
            }));
        }
        if (!isset($this->config->users) || !is_array($this->config->sessions)) {
            $this->config->users = array();
        }
    }
    // -----------------------------------------------------------------
    function __destruct() {
        $this->__write($this->config_file, json_encode($this->config));
    }

    // -----------------------------------------------------------------
    // UTILS
    // -----------------------------------------------------------------
    private function get_user($username) {
        $index = $this->get_user_index($username);
        return $index == -1 ? null : $this->config->users[$index];
    }

    // -----------------------------------------------------------------
    private function get_user_index($username) {
        foreach($this->config->users as $i => $user) {
            if ($username == $user->username) {
                return $i;
            }
        }
        return -1;
    }

    // -----------------------------------------------------------------
    // SESSIONS
    // -----------------------------------------------------------------
    public function new_session($username) {
        return $this->config->sessions[] = Session::new_session($username);
    }

    // -----------------------------------------------------------------
    public function delete_session($token) {
        //need index to unset and indexes may not be sequential
        foreach (array_keys($this->config->sessions) as $i) {
            if ($token == $this->config->sessions[$i]->token) {
                unset($this->config->sessions[$i]);
                return true;
            }
        }
        return false;
    }
    // -----------------------------------------------------------------
    public function get_session($token) {
        foreach ($this->config->sessions as $session) {
            if ($token == $session->token) {
                return $session;
            }
        }
        return null;
    }
    // -----------------------------------------------------------------
    public function get_username($token) {
        $session = $this->get_session($token);
        return $session ? $session->username : null;
    }

    // -----------------------------------------------------------------
    private function __write($filename, $content) {
        $file = fopen($filename, 'w+');
        if (!$file) {
            throw new Exception("Couldn't open file '$filename' for write");
        }
        fwrite($file, $content);
        fclose($file);
    }

    // -----------------------------------------------------------------
    public function installed() {
        if (empty($this->config->users)) {
            return false;
        } else {
            $root = $this->get_user('root');
            return $root != null && isset($root->password) &&
                preg_match(self::password_regex, $root->password);
        }
    }

    // -----------------------------------------------------------------
    public function valid_token($token) {
        return $token ? $this->get_session($token) != null : false;
    }
    // -----------------------------------------------------------------
    function login($username, $password) {
        $user = $this->get_user($username);
        if (!$user) {
            throw new Exception("'$username' is invalid username");
        }
        if (!$user->password) {
            throw new Exception("Password for user '$username' not set");
        }
        preg_match(self::password_regex, $user->password, $match);
        if (!$match) {
            throw new Exception("Password for user '$username' have invalid format");
        }
        if ($match[2] == call_user_func($match[1], $password)) {
            return $this->new_session($username)->token;
        } else {
            throw new Exception("Password for user '$username' is invalid");
        }
    }

    // -----------------------------------------------------------------
    public function session_set($token, $name, $value) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $session = $this->get_session($token);
        $session->$name = $value;
    }

    // -----------------------------------------------------------------
    public function store_user_data($token, $name, $value) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        if ($name == 'name' || $name == 'password') {
            throw new Exception("You can't store '$name'");
        }
        $this->config->users[$this->get_user_index()]->$name = $value;
    }

    // -----------------------------------------------------------------
    public function session_get($token, $name) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $session = $this->get_session($token);
        return $session->$name;
    }
    // -----------------------------------------------------------------
    public function user_sessions($token) {
        $current = $this->get_session($token);
        if (!$current) {
            throw new Exception("Access Denied: Invalid Token");
        }
        return array_filter($this->config->sessions, function($session) {
            return $session->username == $current->username;
        });
    }

    // -----------------------------------------------------------------
    // for client convient all functions have token - in this case it's ignored
    public function file($token, $filename) {
        if (!file_exists($filename)) {
            throw new Exception("File '$filename' don't exists");
        }
        return file_get_contents($filename);
    }

    // -----------------------------------------------------------------
    public function write($token, $filename, $content) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $this->__write($filename, $content);
    }

    // -----------------------------------------------------------------
    // root
    // -----------------------------------------------------------------

    function get_config($token) {
        $this->validate_root($token);
        return $this->config;
    }

    // -----------------------------------------------------------------
    private function create_root_password($password) {
        $password = call_user_func(self::password_crypt, $password);
        $this->config->users[] =
                new User('root', self::password_crypt . ':' . $password);
    }
    // -----------------------------------------------------------------
    // executed when config file don't exists
    public function configure($settings) {
        if ($this->installed()) {
            throw new Exception("You can't call this function, root already installed");
        }
        $settings = (array)$settings;
        $this->create_root_password($settings['password']);
        unset($settings['password']);
        $this->config->settings = array();
        foreach ($settings as $key => $val) {
            $this->config->settings[$key] = $val;
        }
    }
    // -----------------------------------------------------------------
    public function get_settings($token) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        return $this->config->settings;
    }

    // -----------------------------------------------------------------
    private function validate_root($token) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        if ($this->get_session($token)->username != 'root') {
            throw new Exception("Only root can create new account");
        }
    }

    // -----------------------------------------------------------------
    public function add_user($token, $username, $password) {
        $this->validate_root($token);
        $this->config->users[] = new User($username, $password);
    }

    // -----------------------------------------------------------------
    public function remove_user($token, $username, $password) {
        $this->validate_root($token);
        if (($idx = $this->get_user_index($this->get_username($token))) == -1) {
            throw new Exception("User '$username' don't exists");
        }
        $this->config->users[] = new User($username, $password);
        
        // remove session
        foreach($this->config->tokens as $token => $token_username) {
            if ($username == $token_username) {
                unset($this->config->tokens[$token]);
            }
        }
        // remove sessions
        foreach($this->config->sessions as $token => $session) {
            if ($username == $token_username) {
                unset($this->config->tokens[$token]);
            }
        }
    }
    
    // -----------------------------------------------------------------
    public function list_users($token) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        return array_map(function($user) {
            return $user->username;
        }, $this->config->users);
    }
    public function function_exists($token, $function) {
        if ($this->installed() && !$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        return function_exists($function);
    }

    // -----------------------------------------------------------------
    public function change_password($token, $password) {
        
    }

    // -----------------------------------------------------------------
    public function logout($token) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $this->delete_session($token);
    }

    private function mysql_create_connection($host, $username, $password, $db) {
        return $this->mysql_connection = new Database($host, $username, $password, $db);
    }

    public function mysql_connect($token, $host, $username, $password, $db) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $this->mysql_create_connection($host, $username, $password, $db);
        $session = $this->get_session($token);
        $session->db_host = $host;
        $session->db_user = $username;
        $session->db_pass = $password;
        $session->db_name = $db;
    }

    // -----------------------------------------------------------------
    private function mysql_connection_from_session($session) {
        if (!(isset($session->db_host) && isset($session->db_user) &&
              isset($session->db_pass) && isset($session->db_name))) {
            throw new Exception("You need to connect to database first" .
                " so your database info will be stored in session");
        }
        return $this->mysql_create_connection($session->db_host,
                                              $session->db_user,
                                              $session->db_pass,
                                              $session->db_name);
    }

    // -----------------------------------------------------------------
    public function mysql($token, $query) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $session = $this->get_session($token);
        $db = mysql_connection_from_session($token);
        return $db->get_array($query);
    }
    // -----------------------------------------------------------------
    public function list_shells($token = null) {
        if (installed() && !valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        return array(
            "exec",
            "shell_exec",
            "system",
            "cgi-python",
            "cgi-perl",
            "cgi-bash"
        );
    }
    // -----------------------------------------------------------------
    public function test_shell($token, $name) {
        if (installed() && !valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
    }
    public function cwd() {
        return getcwd();
    }
    // -----------------------------------------------------------------
    public function shell($token, $code) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $code = escapeshellarg(". .bashrc;" . $code);
        //$rc_file = getcwd() . "/";
        exec('/bin/bash -ic ' . $code, $result);
        return implode("\n", $result);
    }
    // -----------------------------------------------------------------
    function shell_exec($code) {
        return shell_exec($code);
    }
}

?>
