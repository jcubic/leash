<?php
/**
 *  This file is part of Bush.js (Browser Unix Shell)
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
    public $browser;
    public $start;
    public $last_access;
    private function __construct($u, $t, $s = null, $b = null, $d = null) {
        $this->storage = $s ? $s : new stdClass();
        $this->username = $u;
        $this->token = $t;
        $this->browser = $b ? $b : $_SERVER['HTTP_USER_AGENT'];
        $this->start = $d ? $d : date('r');
    }
    function &__get($name) {
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
                                    $session->storage,
                                    $session->browser,
                                    $session->start);
        }
        return $result;
    }
    static function cast($stdClass) {
        $storage = $stdClass->storage ? $stdClass->storage : new stdClass();
        return new Session($stdClass->username,
                           $stdClass->token,
                           $storage,
                           $stdClass->browser,
                           $stdClass->start);
    }
    static function new_session($username) {
        return new Session($username, token());
    }
}
// random token
function token() {
    $time = array_sum(explode(' ', microtime()));
    return sha1($time) . substr(md5($time), 4);
}
// hash function used for passwords
function hsh($str) {
    // You can change this function before installation
    return str_rot13(sha1($str) . substr(md5($str), 0, 13));
}

class Service {
    protected $config_file;
    protected $config;
    const password_hash = 'hsh';
    const password_regex = '/([A-Za-z_][A-Za-z0-9_]+):(.*)/';

    function __construct($config_file, $path) {
        $this->path = $path;
        $this->config_file = $config_file;
        if (file_exists($config_file)) {
            try {
                $this->config = json_decode(file_get_contents($config_file));
            } catch (Exception $e) {
                $this->config = new stdClass();
            }
            $full_path = $path . "/" . $this->config_file;
            // it had no write permission when first created while testing
            if (!is_writable($full_path)) {
                chmod($full_path, 0664);
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
    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    function __destruct() {
        $path = $this->path . "/" . $this->config_file;
        $this->__write($path, json_encode($this->config));
    }

    // ------------------------------------------------------------------------
    // UTILS
    // ------------------------------------------------------------------------
    private function get_user($username) {
        $index = $this->get_user_index($username);
        return $index == -1 ? null : $this->config->users[$index];
    }
    // ------------------------------------------------------------------------
    private function get_user_index($username) {
        foreach($this->config->users as $i => $user) {
            if ($username == $user->username) {
                return $i;
            }
        }
        return -1;
    }

    // ------------------------------------------------------------------------
    // SESSIONS
    // ------------------------------------------------------------------------
    public function new_session($username) {
        return $this->config->sessions[] = Session::new_session($username);
    }

    // ------------------------------------------------------------------------
    private function delete_session($token) {
        //need index to unset and indexes may not be sequential
        foreach (array_keys($this->config->sessions) as $i) {
            if ($token == $this->config->sessions[$i]->token) {
                unset($this->config->sessions[$i]);
                return true;
            }
        }
        return false;
    }
    // ------------------------------------------------------------------------
    public function get_session($token) {
        foreach ($this->config->sessions as $session) {
            if ($token == $session->token) {
                $session->last_access = date('r');
                return $session;
            }
        }
        return null;
    }
    // ------------------------------------------------------------------------
    public function get_username($token) {
        $session = $this->get_session($token);
        return $session ? $session->username : null;
    }

    // ------------------------------------------------------------------------
    private function __write($filename, $content) {
        $file = fopen($filename, 'w+');
        if (!$file) {
            throw new Exception("Couldn't open file '$filename' for write");
        }
        fwrite($file, $content);
        fclose($file);
    }

    // ------------------------------------------------------------------------
    public function installed() {
        if (empty($this->config->users)) {
            return false;
        } else {
            $root = $this->get_user('root');
            return $root != null && isset($root->password) &&
                preg_match(self::password_regex, $root->password);
        }
    }

    // ------------------------------------------------------------------------
    public function valid_token($token) {
        return $token ? $this->get_session($token) != null : false;
    }
    // ------------------------------------------------------------------------
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
            $session = $this->new_session($username);
            return $session->token;
        } else {
            throw new Exception("Password for user '$username' is invalid");
        }
    }

    // ------------------------------------------------------------------------
    public function session_set($token, $name, $value) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $session = $this->get_session($token);
        $session->$name = $value;
    }

    // ------------------------------------------------------------------------
    public function store_user_data($token, $name, $value) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        if ($name == 'name' || $name == 'password') {
            throw new Exception("You can't store '$name'");
        }
        $this->config->users[$this->get_user_index()]->$name = $value;
    }

    // ------------------------------------------------------------------------
    public function session_get($token, $name) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $session = $this->get_session($token);
        return $session->$name;
    }
    // ------------------------------------------------------------------------
    public function user_sessions($token) {
        $current = $this->get_session($token);
        if (!$current) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $sessions = &$this->config->sessions;
        return array_filter($sessions, function($session) use($current) {
            return $session->username == $current->username;
        });
    }

    // ------------------------------------------------------------------------
    // for client convient all functions have token - in this case it's ignored
    public function file($token, $filename) {
        if (!file_exists($filename)) {
            throw new Exception("File '$filename' don't exists");
        }
        return file_get_contents($filename);
    }

    // ------------------------------------------------------------------------
    public function write($token, $filename, $content) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $this->__write($filename, $content);
    }

    // ------------------------------------------------------------------------
    // root
    // ------------------------------------------------------------------------

    function get_config($token) {
        $this->validate_root($token);
        return $this->config;
    }

    // ------------------------------------------------------------------------
    private function create_root_password($password) {
        $password = call_user_func(self::password_hash, $password);
        $this->config->users[] =
                new User('root', self::password_hash . ':' . $password);
    }
    // ------------------------------------------------------------------------
    // executed when config file don't exists
    public function configure($settings) {
        if ($this->installed()) {
            throw new Exception("You can't call this function, root already installed");
        }
        $settings = (array)$settings;
        $password = $settings['password'];
        unset($settings['password']);
        $this->config->settings = array();
        foreach ($settings as $key => $val) {
            if ($key == "home") {
                throw new Exception("You can't store this name");
            }
            $this->config->settings[$key] = $val;
        }
        $this->create_root_password($password);
    }
    // ------------------------------------------------------------------------
    public function get_settings($token) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $settings = (array)$this->config->settings;
        $settings['home'] = $this->path;
        return $settings;
    }

    // ------------------------------------------------------------------------
    private function validate_root($token) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        if ($this->get_session($token)->username != 'root') {
            throw new Exception("Only root can create new account");
        }
    }

    // ------------------------------------------------------------------------
    public function add_user($token, $username, $password) {
        $this->validate_root($token);
        $this->config->users[] = new User($username, $password);
    }

    // ------------------------------------------------------------------------
    public function remove_user($token, $username, $password) {
        $this->validate_root($token);
        if (($idx = $this->get_user_index($this->get_username($token))) == -1) {
            throw new Exception("User '$username' don't exists");
        }
        // TODO: this is probably not working
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
    // ------------------------------------------------------------------------
    public function list_users($token) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        return array_map(function($user) {
            return $user->username;
        }, $this->config->users);
    }
    // ------------------------------------------------------------------------
    public function function_exists($token, $function) {
        if ($this->installed() && !$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        return function_exists($function);
    }
    // ------------------------------------------------------------------------
    public function dir($token, $path) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
    }
        if (is_dir($path)) {
            $files = array();
            $dirs = array();
            foreach (scandir($path) as $file_dir) {
                if (is_dir($path . "/" . $file_dir) && $file_dir != "." &&
                    $file_dir != "..") {
                    $dirs[] = $file_dir;
                } else {
                    $files[] = $file_dir;
                }
            }
            return array(
                'files' => $files,
                'dirs' => $dirs
            );
        } else {
            throw new Exception('$path is no directory');
        }
    }
    // ------------------------------------------------------------------------
    public function change_password($token, $password) {
        
    }

    // ------------------------------------------------------------------------
    public function logout($token) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $this->delete_session($token);
    }

    // ------------------------------------------------------------------------
    private function mysql_create_connection($host, $username, $password, $db) {
        return $this->mysql_connection = new Database($host, $username, $password, $db);
    }

    // ------------------------------------------------------------------------
    public function mysql_connect($token, $host, $username, $password, $db) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        // will throw exception if invalid
        $this->mysql_create_connection($host, $username, $password, $db);
        $session = $this->get_session($token);
        $id = uniqid('res_');
        if (!isset($session->mysql)) {
            $session->mysql = new stdClass();
        }
        $mysql = &$session->mysql;
        $mysql->$id = array(
            'host' => $host,
            'user' => $username,
            'pass' => $password,
            'name' => $db
        );
        return $id;
    }

    // ------------------------------------------------------------------------
    private function mysql_connection_from_session($mysql) {
        return $this->mysql_create_connection($mysql->host,
                                              $mysql->user,
                                              $mysql->pass,
                                              $mysql->name);
    }
    // ------------------------------------------------------------------------
    public function mysql_close($token, $res_id) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $session = $this->get_session($token);
        if (!(isset($session->mysql->$res_id))) {
            throw new Exception("Invalid resource id");
        }
        unset($session->mysql->$res_id);
    }

    // ------------------------------------------------------------------------
    public function mysql_query($token, $res_id, $query) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $session = $this->get_session($token);
        if (!(isset($session->mysql->$res_id))) {
            throw new Exception("Invalid resource id");
        }
        $db = $this->mysql_connection_from_session($session->mysql->$res_id);
        return $db->get_array($query);
    }
    // ------------------------------------------------------------------------
    function jargon_list() {
        $db = new SQLiteDatabase('jargon.db');
        $res = $db->query("SELECT term FROM terms");
        if ($res) {
            return array_map(function($a) {
                return $term['term'];
            }, $res->fetchAll(SQLITE_ASSOC));
        } else {
            return array();
        }
    }
    // ------------------------------------------------------------------------
    private function jargon_sqlite2($search_term) {
        $db = new SQLiteDatabase('jargon.db');
        $search_term = sqlite_escape_string($search_term);
        $res = $db->query("SELECT * FROM terms WHERE term like '$search_term'");
        $result = array();
        if ($res) {
            $result = $res->fetchAll(SQLITE_ASSOC);
            foreach($result as &$term) {
                $query = "SELECT name FROM abbrev WHERE term = " . $term['id'];
                $res = $db->query($query);
                if ($res) {
                    $abbr_array = $res->fetchAll(SQLITE_ASSOC);
                    if (!empty($abbr_array)) {
                        foreach ($abbr_array as $abbr) {
                            $term['abbr'][] = $abbr['name'];
                        }
                    }
                }
            }
        }
        return $result;
    }
    // ------------------------------------------------------------------------
    private function jargon_sqlite3($search_term) {
        $db = new SQLite3('jargon3.db');
        $search_term = SQLite3::escapeString($search_term);
        $res = $db->query("SELECT * FROM terms WHERE term like '$search_term'");
        $result = array();
        if ($res) {
            while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
                $result[] = $row;
            }
            foreach($result as &$term) {
                $id = $term['id'];
                $query = "SELECT name FROM abbrev WHERE term = " . $id;
                $res = $db->query($query);
                if ($res) {
                    $abbr_array = array();
                    while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
                        $term['abbr'][] = $row['name'];
                    }
                }
            }
        }
        return $result;
    }
    // ------------------------------------------------------------------------
    function jargon($search_term) {
        if (class_exists('SQLiteDatabase')) {
            return $this->jargon_sqlite2($search_term);
        } else if (class_exists('SQLite3')) {
            return $this->jargon_sqlite3($search_term);
        } else {
            throw new Exception('SQLite not installed');
        }
    }
    // ------------------------------------------------------------------------
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
    // ------------------------------------------------------------------------
    public function test_shell($token, $name) {
        if ($this->installed() && !$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        switch ($name) {
            case 'exec':
                return function_exists($name);
                break;
            case 'shell_exec':
                return function_exists($name);
                break;
            case 'system':
                return function_exists($name);
                break;
            case 'cgi_python':
                $path = "/cgi-bin/cmd.py";
                break;
            case 'cgi_perl':
                $path = "/cgi-bin/cmd.py";
                break;
            case 'cgi_bash':
                $path = "/cgi-bin/cmd";
                break;
            default:
                throw new Exception("Invalid shell type");
                break;
        }
    }
    // ------------------------------------------------------------------------
    public function cwd() {
        return getcwd();
    }
    // ------------------------------------------------------------------------
    public function shell($token, $code, $path) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $marker = 'XXXX' . md5(time());
        $pre = ". .bashrc\ncd $path\n";
        $post = ";echo -n \"$marker\";pwd";
        $code = escapeshellarg($pre . $code . $post);
        $result = $this->exec('/bin/bash -c ' . $code . ' 2>&1');
        if ($result) {
            $output = explode($marker, $result);
            return array(
                'output' => preg_replace("/\n$/", '', $output[0]),
                'cwd' => $output[1]
            );
        }
    }
    // ------------------------------------------------------------------------
    private function shell_exec($code) {
        return shell_exec($code);
    }
    // ------------------------------------------------------------------------
    private function exec($code) {
        exec($code, $result);
        return implode("\n", $result);
    }
    // ------------------------------------------------------------------------
    private function system($code) {
        return system($code);
    }
    // ------------------------------------------------------------------------
    private function cgi_python($code) {
    }
    // ------------------------------------------------------------------------
    // TEST code
    public function pass($text) {
        return $text;
    }
    public function rpc_test_login($user, $pass) {
        if ($user == "foo" && $pass == "bar") {
            return md5(time());
        } else {
            return null;
        }
    }
}

?>
