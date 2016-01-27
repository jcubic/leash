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
    function __unset($name) {
        unset($this->storage->$name);
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
// ----------------------------------------------------------------------------
// :: Return root of the url (with http and no port number) to call another
// :: script on the server using curl
// ----------------------------------------------------------------------------
function root() {
    $host = $_SERVER['HTTP_HOST'];
    $root = "http://" . $_SERVER["SERVER_NAME"];
    if ($_SERVER["REQUEST_URI"][strlen($_SERVER["REQUEST_URI"])-1] == "/") {
        $root .= $_SERVER["REQUEST_URI"];
    } else {
        $root .= pre_replace("/\/[^\/]+$/", "/", $_SERVER["REQUEST_URI"]);
    }
    return $root;
}
// ----------------------------------------------------------------------------
// :: random token
// ----------------------------------------------------------------------------
function token() {
    $time = array_sum(explode(' ', microtime()));
    return sha1($time) . substr(md5($time), 4);
}
// ----------------------------------------------------------------------------
// :: hash function used for passwords
// ----------------------------------------------------------------------------
function h($str) {
    // You can change this function before installation
    return sha1(str_rot13($str) . $str) . substr(md5($str), 0, 24);
}

class Service {
    protected $config_file;
    protected $config;
    const password_hash = 'h'; // function use for password on installation
    const password_regex = '/([A-Za-z_][A-Za-z0-9_]*):(.*)/';

    function __construct($config_file, $path) {
        $this->path = $path;
        $this->config_file = $config_file;
        $full_path = $path . "/" . $this->config_file;
        if (file_exists($full_path)) {
            try {
                $this->config = json_decode(file_get_contents($full_path));
            } catch (Exception $e) {
                $this->config = new stdClass();
            }
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
            }, array_filter($this->config->sessions, function($session){
                return isset($session->token) && isset($session->username);
            }));
        }
        if (!isset($this->config->users) || !is_array($this->config->sessions)) {
            $this->config->users = array();
        }
    }
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
    public function get_current_user() {
        return get_current_user();
    }

    // ------------------------------------------------------------------------
    private function __write($filename, $content) {
        if (file_exists($filename) && !is_writable($filename)) {
            return false;
        }
        $file = fopen($filename, 'w+');
        fwrite($file, $content);
        fclose($file);
        return true;
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
    public function debug() {
        if ($this->installed()) {
            return $this->config->settings->debug;
        } else {
            return true;
        }
    }

    // ------------------------------------------------------------------------
    public function valid_token($token) {
        return $token ? $this->get_session($token) != null : false;
    }
    // ------------------------------------------------------------------------
    public function valid_password($token, $password) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $current_user = $this->get_user($this->get_username($token));
        preg_match(self::password_regex, $current_user->password, $match);
        if (!$match) {
            throw new Exception("Password for user '$username' have invalid format");
        }
        return $match[2] == call_user_func($match[1], $password);
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
    public function command_exists($token, $command) {
        $command = "which $command > /dev/null && echo true || echo false";
        $response = $this->shell($token, $command, ".");
        return json_decode($response['output']);
    }
    // ------------------------------------------------------------------------
    public function html($token, $url, $width) {
        if (!$this->command_exists($token, "html2text")) {
            throw new Exception("Command html2text not installed");
        }
        $page = $this->get($url);
        $fname = tempnam($this->path . "/tmp", "html_");
        $file = fopen($fname, 'w');
        fwrite($file, $page);
        fclose($file);
        $cmd = "html2text -utf8 -width $width < $fname";
        $response = $this->shell($token, $cmd, ".");
        unlink($fname);
        return $response['output'];
    }
    // ------------------------------------------------------------------------
    public function file($token, $filename) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        if (!file_exists($filename) || !is_readable($filename)) {
            return null;
        }
        return file_get_contents($filename);
    }

    // ------------------------------------------------------------------------
    public function unlink($token, $filename) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        if (file_exists($filename)) {
            return unlink($filename);
        } else {
            return false;
        }
    }
    // ------------------------------------------------------------------------
    public function write($token, $filename, $content) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        if (!$this->__write($filename, $content)) {
            return false;
        }
        $path = $this->shell($token, 'readlink -f "' . $filename . '"', '/');
        $path = preg_replace('/\n$/', '', $path['output']);
        if ($path == $this->path . "/" . $this->config_file) {
            $this->__construct($this->config_file, $this->path);
        }
        return true;
    }
    // ------------------------------------------------------------------------
    public function append($token, $filename, $content) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        if (file_exists($filename) && !is_writable($filename)) {
            return false;
        }
        $file = fopen($filename, 'a+');
        fwrite($file, $content);
        fclose($file);
        return true;
    }

    // ------------------------------------------------------------------------
    // root
    // ------------------------------------------------------------------------
    function get_config($token) {
        $this->validate_root($token);
        return $this->config;
    }
    // ------------------------------------------------------------------------
    // executed when config file don't exists
    public function configure($settings) {
        if ($this->installed()) {
            throw new Exception("You can't call this function, root already installed");
        }
        $settings = (array)$settings;

        // don't save these in settings
        $root_password = $settings['root_password'];
        $password = $settings['password'];
        $username = $settings['username'];
        unset($settings['username']);
        unset($settings['root_password']);
        unset($settings['password']);

        $this->config->settings = array();
        foreach ($settings as $key => $val) {
            $this->config->settings[$key] = $val;
        }
        $this->config->settings['debug'] = false;
        $this->new_user('root', $root_password);
        $this->new_user($username, $password);
        if (!file_exists('init.js')) {
            copy('init.js.src', 'init.js');
        }
    }
    // ------------------------------------------------------------------------
    public function get_settings($token) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $settings = (array)$this->config->settings;
        // allow to overwrite HOME if user want to have different directory
        if (!isset($settings['home'])) {
            $settings['home'] = $this->path;
        }
        $path = $this->shell($token, 'echo -n $PATH', '/');
        $settings['path'] = $path['output'];
        $settings['executables'] = $this->executables($token, '/');
        $upload_limit = intval(ini_get('upload_max_filesize')) * 1024 * 1024;
        $settings['upload_max_filesize'] = $upload_limit;
        $post_limit = intval(ini_get('post_max_size')) * 1024 * 1024;
        $settings['post_max_size'] = $post_limit;
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
    private function hash($password) {
        $hash = call_user_func(self::password_hash, $password);
        return self::password_hash . ':' . $hash;
    }
    // ------------------------------------------------------------------------
    private function new_user($username, $password) {
        $this->config->users[] = new User($username, $this->hash($password));
    }
    // ------------------------------------------------------------------------
    public function add_user($token, $username, $password) {
        $this->validate_root($token);
        $this->new_user($username, $password);
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
        foreach ($this->config->tokens as $token => $token_username) {
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
    public function file_exists($path) {
        return file_exists($path);
    }
    // ------------------------------------------------------------------------
    public function is_file($token, $path) {
        return is_file($path);
    }
    // ------------------------------------------------------------------------
    public function function_exists($token, $function) {
        if ($this->installed() && !$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        return function_exists($function);
    }
    // ------------------------------------------------------------------------
    // TODO: Use Shell to get the content of the directory
    public function dir($token, $path) {
        /* shell method test for valid token
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        */
        // using shell since php can restric to read files from specific directories
        $EXEC = 'X';
        $DIR = 'D';
        $FILE = 'F';
        // depend on GNU version of find (not tested on different versions)
        $cmd = "find . -mindepth 1 -maxdepth 1 \\( -type f -executable -printf ".
            "'$EXEC%p\\0' \\)  -o -type d -printf '$DIR%p\\0' -o \\( -type l -x".
            "type d -printf '$DIR%p\\0' \\) -o -not -type d -printf '$FILE%p\\0'";
        $result = $this->shell($token, $cmd, $path);
        //return $result;
        $files = array();
        $dirs = array();
        $execs = array();
        foreach (explode("\x0", $result['output']) as $item) {
            if ($item != "") {
                $mnemonic = substr($item, 0, 1);
                $item = substr($item, 3); // remove `<MENEMONIC>./'
                switch ($mnemonic) {
                    case $EXEC:
                        $execs[] = $item; // executables are also files
                    case $FILE:
                        $files[] = $item;
                        break;
                    case $DIR:
                        $dirs[] = $item;
                }
            }
        }
        return array(
            'files' => $files,
            'dirs' => $dirs,
            'execs' => $execs
        );
        /*
        if (is_dir($path)) {
            $files = array();
            $dirs = array();
            $execs = array();
            foreach (scandir($path) as $file_dir) {
                $full_path = $path . "/" . $file_dir;
                if (is_dir($full_path) && $file_dir != "." && $file_dir != "..") {
                    $dirs[] = $file_dir;
                } else {
                    $files[] = $file_dir;
                    if (is_executable($full_path)) {
                        $execs[] = $file_dir;
                    }
                }
            }
            return array(
                'files' => $files,
                'dirs' => $dirs,
                'execs' => $execs
            );
        } else {
            throw new Exception('$path is no directory');
        }
        */
    }
    // ------------------------------------------------------------------------
    public function executables($token, $path) {
        $result = $this->shell($token, "compgen -A function -abck | sort | uniq", $path);
        $commands = explode("\n", trim($result['output']));
        // array_filter return object with number as keys
        return array_values(array_filter($commands, function($command) {
            return strlen($command) > 1; // filter out . : [
        }));
    }
    // ------------------------------------------------------------------------
    // :: Remove all user sessions
    // ------------------------------------------------------------------------
    public function purge($token) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        foreach (array_keys($this->config->sessions) as $i) {
            if ($token == $this->config->sessions[$i]->token) {
                unset($this->config->sessions[$i]);
            }
        }
    }
    // ------------------------------------------------------------------------
    public function change_password($token, $password) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $current_user = $this->get_user($this->get_username($token));
        if (!$current_user) {
            throw new Exception("Can't find the right user");
        }
        $new_password = $this->hash($password);
        foreach ($this->config->users as $user) {
            if ($user->username == $current_user->username) {
                $user->password = $new_password;
            }
        }
    }
    // ------------------------------------------------------------------------
    public function logout($token) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        return $this->delete_session($token);
    }

    // ------------------------------------------------------------------------
    public function sqlite_query($token, $filename, $query) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $db = new PDO('sqlite:' . $filename);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $res = $db->query($query);
        if ($res) {
            if (preg_match("/^\s*INSERT|UPDATE|DELETE|ALTER|CREATE|DROP/i", $query)) {
                return $res->rowCount();
            } else {
                return $res->fetchAll(PDO::FETCH_ASSOC);
            }
        } else {
            throw new Exception("Coudn't open file");
        }
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
        $mysql = (array)$session->mysql;
        if (empty($mysql)) {
            unset($session->mysql); // this don't work, don't know why
        }
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
        $query = trim($query);
        if (preg_match("/^(delete|insert|create)/i", $query)) {
            $db->query($query); // will throw exception on false
            return $db->affected_rows();
        } else {
            return $db->get_array($query);
        }
    }
    // ------------------------------------------------------------------------
    function jargon_list() {
        $db = new PDO('sqlite:' . $this->get_jargon_db_file());
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $res = $db->query("SELECT term FROM terms");
        if ($res) {
            return array_map(function($term) {
                return $term['term'];
            }, $res->fetchAll());
        } else {
            return array();
        }
    }
    // ------------------------------------------------------------------------
    function get_jargon_db_file() {
        $db = new PDO('sqlite::memory:');
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $version = $db->query('select sqlite_version()')->fetch();
        if (preg_match("/^3\\./", $version[0])) {
            return 'jargon3.db';
        } elseif (preg_match("/^2\\./", $version[0])) {
            return 'jargon.db';
        }
    }
    function jargon_search($search_term) {
        $filename = $this->get_jargon_db_file();
        $db = new PDO('sqlite:' . $filename);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $search_term = $db->quote($search_term);
        $res = $db->query("SELECT * FROM terms WHERE term like $search_term or ".
                          "");
    }
    // ------------------------------------------------------------------------
    function jargon($search_term) {
        $filename = $this->get_jargon_db_file();
        $db = new PDO('sqlite:' . $filename);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $search_term = $db->quote($search_term);
        $res = $db->query("SELECT * FROM terms WHERE term like $search_term");
        $result = array();
        if ($res) {
            $result = $res->fetchAll(PDO::FETCH_ASSOC);
            foreach($result as &$term) {
                $query = "SELECT name FROM abbrev WHERE term = " . $term['id'];
                $res = $db->query($query);
                if ($res) {
                    $abbr_array = $res->fetchAll(PDO::FETCH_ASSOC);
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
    public function sleep($time) {
        sleep($time);
    }
    // ------------------------------------------------------------------------
    public function rfc($number) {
        if ($number == null) {
            $url = "http://www.rfc-editor.org/in-notes/rfc-index.txt";
            $page = $this->get($url);
            $page = preg_replace("/(^[0-9]+)/m", '[[bu;#fff;;rfc]$1]', $page);
            return $page;
        } else {
            $number = preg_replace("/^0+/", "", $number);
            $url = "https://www.rfc-editor.org/rfc/rfc$number.txt";
            return $this->get($url);
        }
    }
    // ------------------------------------------------------------------------
    public function rfc_update() {
        $path = $this->path . "/rfc";
        if (!is_dir($path)) {
            if (!mkdir($path)) {
                throw new Exception("Couldn't create rfc directory");
            }
        }
        $index = "http://www.rfc-editor.org/in-notes/rfc-index.txt";
        $page = $this->get($index);
        preg_match_all("/(^[0-9]+)/m", $page, $matches);
        $page = preg_replace("/(^[0-9]+)/m", '[[bu;#fff;;rfc]$1]', $page);
        $file = fopen($path . "/rfc-index.txt", "w");
        if (!$file) {
            throw new Exception("Couldn't create file in rfc directory");
        }
        fwrite($file, $page);
        fclose($file);
        foreach($matches[1] as $number) {
            $number = preg_replace("/^0+/", "", $number);
            $fname = "rfc" . $number . ".txt";
            if (!file_exists($path . "/$fname")) {
                $url = "https://www.rfc-editor.org/rfc/$fname";
                $rfc = $this->get($url);
                $file = fopen($path . "/$fname", "w");
                if (!$file) {
                    throw new Exception("Couldn't create file in rfc directory");
                }
                fwrite($file, $rfc);
                fclose($file);
            }
        }
    }
    // ------------------------------------------------------------------------
    private function curl($url) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        if (isset($_SERVER['HTTP_USER_AGENT'])) {
            $agent = $_SERVER['HTTP_USER_AGENT'];
        } else {
            // defaut FireFox 15 from agent switcher (google chrome extension)
            $agent = 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:15.0) Gecko/20120427 '.
                'Firefox/15.0a1';
        }
        curl_setopt($ch, CURLOPT_USERAGENT, $agent);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        return $ch;
    }
    // ------------------------------------------------------------------------
    public function get($url) {
        return curl_exec($this->curl($url));
    }
    // ------------------------------------------------------------------------
    public function post($url, $data) {
        $ch = $this->curl($url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array("Content-type: text/plain"));
        $result = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if ($code != 200) {
            throw new Exception("URL: $url give error $code");
        }
        return $result;
    }
    // ------------------------------------------------------------------------
    public function list_shells($token = null) {
        if ($this->installed() && !$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        return array(
            "exec",
            "shell_exec",
            "cgi_python",
            "cgi_perl"
        );
    }
    // ------------------------------------------------------------------------
    public function test_shell($token, $name) {
        if ($this->installed() && !$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $test = "echo -n x";
        $response = "x";
        switch ($name) {
            case 'exec':
                if (function_exists($name)) {
                    return $this->exec($token, $test) == $response;
                } else {
                    return false;
                }
                break;
            case 'shell_exec':
                if (function_exists($name)) {
                    return $this->shell_exec($token, $test) == $response;
                } else {
                    return false;
                }
                break;
            case 'cgi_python':
                try {
                    return $this->cgi_python($token, $test) == $response;
                } catch (Exception $e) {
                    return false;
                }
                break;
            case 'cgi_perl':
                try {
                    return $this->cgi_perl($token, $test) == $response;
                } catch (Exception $e) {
                    return false;
                }
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
    public function shell($token, $command, $path) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $shell_fn = $this->config->settings->shell;
        if (preg_match("/&\s*$/", $command)) {
            $command = preg_replace("/&\s*$/", ' >/dev/null & echo $!', $command);
            $result = $this->$shell_fn($token, '/bin/bash -c ' . escapeshellarg($command));
            return array(
                'output' => '[1] ' . $result,
                'cwd' => $path
            );
        } else {
            $marker = 'XXXX' . md5(time());
            if ($shell_fn == 'exec' || $shell_fn == 'shell_exec') {
                $pre = ". .bashrc\ncd $path\n";
            } else {
                $pre = ". ../.bashrc\ncd $path\n";
            }
            $post = ";echo -n \"$marker\";pwd";
            $command = escapeshellarg($pre . $command . $post);
            $result = $this->$shell_fn($token, '/bin/bash -c ' . $command . ' 2>&1');
            if ($result) {
                // work wth `set` that return BASH_EXECUTION_STRING
                $output = preg_split('/'.$marker.'(?!")/', $result);
                if (count($output) == 2) {
                    $cwd = preg_replace("/\n$/", '', $output[1]);
                } else {
                    $cwd = $path;
                }
                return array(
                    'output' => $output[0],
                    'cwd' => $cwd
                );
            } else {
                throw new Exception("Internal error, shell function give no result");
            }
        }
    }
    // ------------------------------------------------------------------------
    // all functions need the same signature as cgi_python/cgi_perl
    private function shell_exec($token, $code) {
        return shell_exec($code);
    }
    // ------------------------------------------------------------------------
    private function exec($token, $code) {
        exec($code, $result);
        return implode("\n", $result);
    }
    // ------------------------------------------------------------------------
    private function cgi_perl($token, $code) {
        $url = root() . "cgi-bin/cmd.pl?" . $token;
        return $this->post($url, $code);
        $response = json_decode($this->post($url, $code));
    }
    // ------------------------------------------------------------------------
    public function cgi_python($token, $code) {
        $url = root() . "cgi-bin/cmd.py?token=" . $token;
        $response = json_decode($this->post($url, $code));
        if ($response) {
            if (isset($response->error)) {
                throw new Exception($response->error);
            }
            if (isset($response->result)) {
                return $response->result;
            }
        }
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
