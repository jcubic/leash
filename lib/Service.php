<?php
/**
 *  This file is part of Leash (Browser Shell)
 *  Copyright (C) 2013-2017  Jakub Jankiewicz <http://jcubic.pl/me>
 *
 *  Released under the MIT license
 *
 */

require('Database.php');
require('Logger.php');

class User {
    function __construct($username, $password, $home) {
        $this->username = $username;
        $this->password = $password;
        if ($home != '') {
            $this->home = $home;
        }
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
        $root .= preg_replace("/\/[^\/]+$/", "/", $_SERVER["REQUEST_URI"]);
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

// ----------------------------------------------------------------------------
// :: Main JSON-RPC service class
// ----------------------------------------------------------------------------
require_once('json-rpc.php');

class Service {
    protected $config_file;
    protected $config;
    const password_hash = 'h'; // function use for password on installation
    const password_regex = '/([A-Za-z_][A-Za-z0-9_]*):(.*)/';
    const separators = "/(?:\"[^\"\\\\]*(?:\\\\[\S\s][^\"\\\\]*)*\"|'[^'\\\\]*(?:\\\\[\S\s][^'\\\\]*)*')(*SKIP)(*F)|(\s+(?:&&|\|{1,2}|;)\s+)/";
    private $safe_to_save = false;

    function __construct($config_file, $path) {
        $this->logger = new Logger($path . "/debug.log");
        $this->logger->log('constructor: ' . get_raw_post_data());
        $this->path = $path;
        $this->config_file = $config_file;
        $full_path = $path . "/" . $this->config_file;
        $corrupted = false;
        $this->config = new stdClass();
        $this->shell_method = false;
        if (file_exists($full_path)) {
            $this->config = json_decode(file_get_contents($full_path));
            if (json_last_error() !== JSON_ERROR_NONE) {
                $this->config = new stdClass();
                $corrupted = true;
                $this->logger->log('file corupted: ' . file_get_contents($full_path));
            }
            // it had no write permission when first created while testing
            if (!is_writable($full_path)) {
                chmod($full_path, 0664);
            }
        } else {
            $this->logger->log("constructor: file don't exists");
        }
        if (!isset($this->config->sessions) || !is_array($this->config->sessions)) {
            $this->logger->log("no sessions " . json_encode($this->config));
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
        if (!$corrupted) {
            $this->safe_to_save = true;
        }
        $this->logger->log("constructor end ");
    }
    // ------------------------------------------------------------------------
    function __destruct() {
        if (!$this->shell_method) {
            if ($this->safe_to_save) {
                $this->logger->log("destructor save to write: " .
                                   json_encode($this->config));
                $path = $this->path . "/" . $this->config_file;
                $this->__write($path, json_encode($this->config));
            } else {
                $this->logger->log("destructor not safe");
            }
        }
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
    public function storage_get($token, $name) {
        $session = $this->get_session($token);
        if (!$session) {
            throw new Exception("Invalid token");
        }
        return $session->$name;
    }

    // ------------------------------------------------------------------------
    public function storage_set($token, $name, $value) {
        $session = $this->get_session($token);
        if (!$session) {
            throw new Exception("Invalid token");
        }
        $session->$name = $value;
    }

    // ------------------------------------------------------------------------
    private function __write($filename, $content) {
        if (file_exists($filename) && !is_writable($filename)) {
            return false;
        }
        unlink($filename);
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
        return !$this->installed() || ($token ? $this->get_session($token) != null : false);
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
        if ($username == 'guest' && !$this->config->settings->guest) {
            throw new Exception("guest sessions are disabled");
        }
        $user = $this->get_user($username);
        if ($username == 'guest' && !$user) {
            // create new guest user when it don't exists,
            // can happen after upgrade
            $this->new_user('guest', 'guest', $this->config->settings->home);
            $user = $this->get_user($username);
        }
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
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $response = $this->command($token, "which $command", ".");
        return !empty(preg_replace("/\s$/", "", $response['output']));
    }
    // ------------------------------------------------------------------------
    public function html($token, $url, $width) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        require('html2text/src/Html2Text.php');
        $html = $this->get($url);
        if (!$html) {
            throw new Exception("$url return no results");
        }
        $html = new \Html2Text\Html2Text($html, array(
            'width' => $width
        ));
        $text = $html->getText();
        $base = preg_replace("~(?<!/)/(?!/).*$~", "", $url);
        $rel = preg_replace("~(?<!/)/(?!/)[^/]+$~", "/", $url);
        return preg_replace_callback("/\\[([^\\]]+)\\]/", function($matches) use ($base,$rel) {
            if (preg_match("~^/~", $matches[1])) {
                $url = $base . $matches[1];
            } else if (preg_match("/^(http|mailto)/", $matches[1])) {
                $url = $matches[1];
            } else {
                $url = $rel . $matches[1];
            }
            return '&#91;[[!;;;;' . $url . ']' . $url . ']&#93;';
        }, $text);
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
        $username = $this->get_username($token);
        if ($username == 'guest') {
            throw new Exception("guest users can't delete files");
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
        $username = $this->get_username($token);
        if ($username == 'guest') {
            throw new Exception("guest users can't write files");
        }
        if (!$this->__write($filename, $content)) {
            return false;
        }
        $path = $this->command($token, 'readlink -f "' . $filename . '"', '/');
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
        $username = $this->get_username($token);
        if ($username == 'guest') {
            throw new Exception("guest users can't write files");
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
            throw new Exception("You can't call this function, leash already installed");
        }
        if ($settings->username == 'guest' || $settings->username == 'root') {
            throw new Exception("You can't use " . $settings->username . " as userna".
                                "me because it's special account");
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
        $this->config->settings['show_messages'] = true;

        $this->config->settings['guest_commands'] = array(
            'echo',
            'cat',
            'ls',
            'find',
            'cd',
            'grep',
            'test',
            'pwd'
        );

        // get external libraries
        $this->get_repo(null, 'jcubic', 'jsvi-app', 'lib/apps/jsvi');
        $this->get_repo(null, 'mtibben', 'html2text', 'lib/html2text');

        $this->new_user('root', $root_password, $settings['home']);
        $this->new_user($username, $password, $settings['home']);
        $this->new_user('guest', 'guest', $settings['home']);
        if (!file_exists('init.js')) {
            copy('init.js.src', 'init.js');
        }
    }
    // ------------------------------------------------------------------------
    private function get_home_dir($username) {
        $settings = (array)$this->config->settings;
        if ($username == 'root') {
            return $settings['home'];
        } else {
            $current_user = $this->get_user($username);
            if (isset($current_user->home)) {
                return $current_user->home;
            } else if (isset($settings['sudo']) && $settings['sudo']) {
                return "/home/$username";
            } else {
                return $settings['home'];
            }
        }
    }
    // ------------------------------------------------------------------------
    public function get_settings($token) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $settings = (array)$this->config->settings;
        // allow to overwrite HOME if user want to have different directory
        $username = $this->get_username($token);
        $settings['home'] = $this->get_home_dir($username);
        try {
            $path = $this->command($token, 'echo -n $PATH', '/');
            $settings['path'] = $path['output'];
            $settings['executables'] = $this->executables($token, '/');
        } catch(Exception $e) {
            $settings['path'] = '';
            $settings['executables'] = array();
        }
        $upload_limit = intval(ini_get('upload_max_filesize')) * 1024 * 1024;
        $settings['upload_max_filesize'] = $upload_limit;
        $post_limit = intval(ini_get('post_max_size')) * 1024 * 1024;
        $settings['post_max_size'] = $post_limit;
        $version_message = $this->version_message();
        $settings['messages'] = array();
        if ($version_message) {
            $settings['messages'][] = $version_message;
        }
        return $settings;
    }

    // ------------------------------------------------------------------------
    private function validate_root($token, $msg) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        if ($this->get_session($token)->username != 'root') {
            throw new Exception("Only root can $msg");
        }
    }
    // ------------------------------------------------------------------------
    private function hash($password) {
        $hash = call_user_func(self::password_hash, $password);
        return self::password_hash . ':' . $hash;
    }
    // ------------------------------------------------------------------------
    private function new_user($username, $password, $home) {
        $this->config->users[] = new User($username, $this->hash($password), $home);
    }
    // ------------------------------------------------------------------------
    public function add_user($token, $username, $password, $home) {
        $this->validate_root($token, "create new account");
        if ($this->get_user($username)) {
            throw new Exception("User '$username' already exists");
        }
        $this->new_user($username, $password, $home);
    }
    // ------------------------------------------------------------------------
    public function remove_user($token, $username) {
        $this->validate_root($token, "delete account");
        if (!$this->get_user($username)) {
            throw new Exception("User '$username' don't exists");
        }
        // remove sessions
        $sessions = $this->config->sessions;
        $this->config->sessions = array_values(array_filter($sessions, function($session) use ($username) {
            return $session->username != $username;
        }));
        $users = $this->config->users;
        $this->config->users = array_values(array_filter($users, function($user) use ($username) {
            return $user->username != $username;
        }));
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
        $result = $this->command($token, $cmd, $path);
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
        $command = "compgen -A function -abck | sort | uniq";
        $result = $this->command($token, $command, $path);
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
        if (preg_match("/^(delete|insert|create|alter)/i", $query)) {
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
    // ------------------------------------------------------------------------
    function jargon_search($search_term) {
        $filename = $this->get_jargon_db_file();
        $db = new PDO('sqlite:' . $filename);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $search_term = $db->quote($search_term);
        $res = $db->query("SELECT term FROM terms WHERE term like $search_term or ".
                          "def like $search_term");
        return $res->fetchAll(PDO::FETCH_ASSOC);
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
    public function copy_dir($token, $src, $dest) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $dir = opendir($src);
        if (!is_dir($dest)) {
            mkdir($dest);
        }
        while (false !== ($file = readdir($dir))) {
            if ($file != '.' && $file != '..') {
                if (is_dir($src . '/' . $file)) {
                    $this->copy_dir($token, $src . '/' . $file, $dest . '/' . $file);
                } else {
                    copy($src . '/' . $file, $dest . '/' . $file);
                }
            }
        }
        closedir($dir);
    }
    // ------------------------------------------------------------------------
    public function delete_dir($token, $dir) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        if (!is_dir($dir)) {
            throw new Exception("$dir must be a directory");
        }
        if (substr($dir, strlen($dir)-1, 1) != '/') {
            $dir .= '/';
        }
        foreach (scandir($dir) as $file_dir) {
            $full_path = $dir . $file_dir;
            if ($file_dir != "." && $file_dir != "..") {
                if (is_dir($full_path)) {
                    $this->delete_dir($token, $full_path);
                } else {
                    unlink($full_path);
                }
            }
        }
        rmdir($dir);
    }
    // ------------------------------------------------------------------------
    public function random_string($length) {
        $key = '';
        $keys = array_merge(range(0, 9), range('a', 'z'));

        for ($i = 0; $i < $length; $i++) {
            $key .= $keys[array_rand($keys)];
        }

        return $key;
    }
    // ------------------------------------------------------------------------
    public function unzip_url($token, $url, $dir, $desc) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $curl = $this->curl($url);
        $data = curl_exec($curl);
        $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $error = curl_error($curl);
        curl_close($curl);
        if ($http_code != 200) {
            throw new Exception("curl error " . $error);
        }
        $fname = $this->random_string(5) . ".zip";
        $file = fopen($fname, 'w');
        $ret = fwrite($file, $data);
        fclose($file);
        $zip = new ZipArchive();
        $res = $zip->open($fname);
        if ($res === true) {
            $temp_dir = sys_get_temp_dir();
            if (!$zip->extractTo($temp_dir)) {
                throw new Exception("Have problem extracting files to '$temp_dir'");
            }
            $zip->close();
            unlink($fname);
            if (is_dir($temp_dir . '/' . $dir)) {
                $this->copy_dir($token, $temp_dir . '/' . $dir, $desc);
                $this->delete_dir($token, $temp_dir . '/' . $dir);
            } else {
                throw new Exception("Directory '$temp_dir/$dir' not created");
            }
        } else {
            throw new Exception("Can't open zip file");
        }
    }
    // ------------------------------------------------------------------------
    public function get_repo($token, $user, $repo, $desc) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $url = "https://github.com/$user/$repo/archive/master.zip";
        $dir = $repo . "-master";
        $desc = $this->path . "/" . $desc;
        return $this->unzip_url($token, $url, $dir, $desc);
    }
    // ------------------------------------------------------------------------
    public function update($token) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $url = 'https://raw.githubusercontent.com/jcubic/leash/master/version';
        $curl = $this->curl($url);
        $page = trim(curl_exec($curl));
        $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);
        if ($http_code == 200) {
            $fname = $page . '.zip';
            $master_version = $this->version($page);
            $version = $this->version(trim(file_get_contents('version')));
            if (($master_version[0] == $version[0] && $master_version[1] == $version[1] &&
                 $master_version[2] > $version[2]) ||
                ($master_version[0] == $version[0] && $master_version[1] > $version[1]) ||
                ($master_version[0] > $version[0])) {
                $url = 'https://github.com/jcubic/leash/archive/' . $fname;
                $this->unzip_url($token, $url, 'leash-' . $page, $this->path);
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
    // ------------------------------------------------------------------------
    private function version($version) {
        return array_map(function($number) {
            return intval($number);
        }, explode('.', $version));
    }
    // ------------------------------------------------------------------------
    public function version_message() {
        $fname = $this->path . '/version';
        if (!file_exists($fname)) {
            return null;
        }
        $url = 'https://raw.githubusercontent.com/jcubic/leash/master/version';
        $curl = $this->curl($url);
        $page = trim(curl_exec($curl));
        $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);
        if ($http_code == 404) {
            return "You're running experimental version of leash";
        }
        $master_version = $this->version($page);
        $version = $this->version(trim(file_get_contents($fname)));
        if ($master_version[0] == $version[0]) {
            if ($master_version[1] == $version[1]) {
                if ($master_version[2] == $version[2]) {
                    return null;
                } elseif ($master_version[2] > $version[2]) {
                    return "New version of leash $page available. Run update command to " .
                           "get new version";
                } else {
                    return "You're running experimental version of leash";
                }
            } elseif ($master_version[1] > $version[1]) {
                return "New version of leash $page available. Run update command to get " .
                       "new version";
            } else {
                return "You're running experimental version of leash";
            }
        } elseif ($master_version[0] > $version[0]) {
            return "New version of leash $page available. Run update command to get new " .
                   "version";
        } else {
            return "You're running experimental version of leash";
        }
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
        $curl = $this->curl($url);
        $result = curl_exec($curl);
        curl_close($curl);
        return $result;
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
        curl_close($ch);
        return $result;
    }
    // ------------------------------------------------------------------------
    public function list_shells($token = null) {
        if ($this->installed() && !$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        return array(
            "exec",
            "system",
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
        if ($name == 'system' || $name == 'exec' || $name == 'shell_exec') {
            if (function_exists($name)) {
                return $this->$name($token, $test) == $response;
            } else {
                return false;
            }
        } else if ($name == 'cgi_perl' || $name == 'cgi_python') {
            try {
                return $this->$name($token, $test) == $response;
            } catch (Exception $e) {
                return false;
            }
        } else {
            throw new Exception("Invalid shell type");
        }
    }
    // ------------------------------------------------------------------------
    public function cwd() {
        return getcwd();
    }
    // ------------------------------------------------------------------------
    private function sudo($username, $command) {
        if (isset($this->config->settings->sudo) && $this->config->settings->sudo &&
            $username != 'guest') {
            return "/usr/bin/sudo -u '$username' $command";
        }
        return $command;
    }
    // ------------------------------------------------------------------------
    public function unclosed_strings($command) {
        $invalid_string = '~(?:  [^"\']+
           |  " [^"\\\\]*  (?: \\\\. [^"\\\\]*  )*  "
           | \' [^\'\\\\]* (?: \\\\. [^\'\\\\]* )* \'
           )*+  # possessive quantifier
           .    # a character that can only be a quote (single or double)
         ~xAs';
        return preg_match($invalid_string, $command);
    }
    // ------------------------------------------------------------------------
    public function split_command($command) {
        $flags = PREG_SPLIT_NO_EMPTY | PREG_SPLIT_DELIM_CAPTURE;
        return preg_split(Service::separators, $command, null, $flags);
    }
    // ------------------------------------------------------------------------
    public function validate_command($command) {
        if (isset($this->config->settings->guest_commands)) {
            $commands = $this->config->settings->guest_commands;
        } else {
            $commands = array('echo', 'cat', 'ls', 'find', 'cd', 'grep', 'test', 'xargs');
        }
        $cmd_re = "(" . implode("|", array_diff($commands, array("xargs"))) . ")";
        if (in_array("xargs", $commands)) {
            $re = "/^\s*($cmd_re|xargs\s*$cmd_re)/";
        } else {
            $re = "/^\s*$cmd_re/";
        }
        // shell will return syntax error on non closed strings
        if ($this->unclosed_strings($command)) {
            return $command;
        }
        $subshells = $this->get_subshells($command);
        if ($subshells == -1 || count($subshells) > 0) {
            throw new Exception("guest user can't execute subshells");
        }
        $parts = $this->split_command($command);
        $result = array();
        foreach ($parts as $part) {
            if (preg_match('/>/', $part)) {
                throw new Exception("guest user can't use redirect to write to files");
            } else if (!preg_match($re, trim($part)) && !preg_match(Service::separators, $part)) {
                $last = array_pop($commands);
                $message = "guest user can only execute: " .
                         implode(", ", $commands) . " and " . $last;
                throw new Exception($message);
            } else {
                $result[] = $part;
            }
        }
        return implode($result);
    }
    // ------------------------------------------------------------------------
    public function shell($token, $command, $path) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $user = $this->get_username($token);
        if ($user == 'guest') {
            return $this->command($token, $this->validate_command($command), $path);
        }
        $this->shell_method = true;
        return $this->command($token, $command, $path);
    }
    // ------------------------------------------------------------------------
    public function unbuffer($token, $command) {
        if (preg_match("/which unbuffer/", $command)) {
            return $command;
        } else {
            $shell_fn = $this->config->settings->shell;
            $path = preg_replace("/\s$/", "", $this->$shell_fn($token, "which unbuffer"));
            if (empty($path)) {
                return $command;
            } else {
                return $path . " " . $command;
            }
        }
    }
    // ------------------------------------------------------------------------
    public function get_subshells($command) {
        $re = '/(\$\(|\(|\)|`)/';
        $parts = preg_split($re, $command, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY);
        $subshells = array();
        $backtick = false;
        $stack = array();
        foreach ($parts as $part) {
            if (preg_match($re, $part)) {
                if ($part == "`") {
                    $backtick = !$backtick;
                }
                if ($backtick || preg_match("/\(/", $part)) {
                    $stack[] = array('tag' => $part, 'content' => '');
                } else {
                    $last = array_pop($stack);
                    $subshells[] = preg_replace('/^(\$\(|\(|`)/', '', $last['content']);
                }
            }
            if (count($stack) > 0) {
                foreach ($stack as &$subshell) {
                    $subshell['content'] .= $part;
                }
            }

        }
        if (count($stack) > 0) {
            return -1;
        }
        return array_reverse($subshells);
    }
    // ------------------------------------------------------------------------
    function have_sudo($token, $command) {
        $shell_fn = $this->config->settings->shell;
        $subshells = $this->get_subshells($command);
        if ($subshells == -1) {
            return -1;
        }
        if (count($subshells)) {
            foreach($subshells as $subshell) {
                if ($this->have_sudo($token, trim($subshell))) {
                    return true;
                }
            }
        } else {
            $re = "!^(sudo|" . $this->$shell_fn($token, "which sudo") . ")!";
            foreach ($this->split_command($command) as $part) {
                if (preg_match($re, trim($part))) {
                    return true;
                }
            }
        }
        return false;
    }
    // ------------------------------------------------------------------------
    private function command($token, $command, $path) {
        if (!$this->valid_token($token)) {
            throw new Exception("Access Denied: Invalid Token");
        }
        $username = $this->get_username($token);
        $shell_fn = $this->config->settings->shell;
        if (isset($this->config->settings->sudo) && $this->config->settings->sudo &&
            $username != 'guest' && $this->have_sudo($token, $command)) {
            throw new Exception("You can't execute sudo if sudo option is on");
        }
        if (!method_exists($this, $shell_fn)) {
            throw new Exception("Invalid shell '$shell_fn'");
        }
        $command = preg_replace("/&\s*$/", ' >/dev/null & echo $!', $command);
        $marker = 'XXXX' . md5(time());
        $home = $this->get_home_dir($username);
        $cmd_path = __DIR__ . "/..";
        $aliases = "alias get='php -f \"$cmd_path/cmd.php\" storage_get \"$token\"';".
                   "alias set='php -f \"$cmd_path/cmd.php\" storage_set \"$token\"';";
        if ($shell_fn == 'exec' || $shell_fn == 'shell_exec' ||
            $shell_fn == 'system') {
            $pre = ". .bashrc\nexport HOME=\"$home\"\ncd $path;$aliases\n";
        } else {
            $pre = ". ../.bashrc\nexport HOME=\"$home\"\ncd $path;$aliases\n";
        }
        $post = ";echo -n \"$marker\";pwd";
        $command = escapeshellarg($pre . $command . $post);
        $command = $this->sudo($username, '/bin/bash -c ' . $command . ' 2>&1');
        $command = $this->unbuffer($token, $command);
        $result = $this->$shell_fn($token, $command);
        if (preg_match("%>/dev/null & echo $!$%", $command)) {
            return array(
                'output' => '[1] ' . $result,
                'cwd' => $path
            );
        } else if ($result) {
            // work wth `set` that return BASH_EXECUTION_STRING
            $output = preg_split('/'.$marker.'(?!")/', $result);
            if (count($output) == 2) {
                $cwd = preg_replace("/\n$/", '', $output[1]);
            } else {
                $cwd = $path;
            }
            return array(
                'output' => preg_replace("/" . preg_quote($post) . "/", "", $output[0]),
                'cwd' => $cwd
            );
        } else {
            throw new Exception("Internal error, shell function give no result");
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
    private function system($token, $code) {
        ob_start();
        system($code);
        $result = ob_get_contents();
        ob_end_clean();
        return $result;
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
