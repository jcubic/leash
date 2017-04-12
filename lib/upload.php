<?php
/**
 *  This file is part of Leash (Browser Shell)
 *  Copyright (C) 2013-2017  Jakub Jankiewicz <http://jcubic.pl/me>
 *
 *  Released under the MIT license
 *
 */
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require('Service.php');
header('Content-type: application/json');

$service = new Service('config.json', preg_replace("/\/[^\/]+\/?$/", "", getcwd()));

if (isset($_POST['token']) && isset($_POST['path'])) {
    if ($service->valid_token($_POST['token'])) {
        if (!isset($_FILES['file'])) {
            echo json_encode(array('error' => 'No File'));
            exit();
        }
        $fname = basename($_FILES['file']['name']);

        switch ($_FILES['file']['error']) {
            case UPLOAD_ERR_OK:
                $path = '';
                // path from js is unix like
                foreach (explode("/", $_POST['path']) as $folder) {
                    if (!is_dir($path . DIRECTORY_SEPARATOR . $folder)) {
                        mkdir($path . DIRECTORY_SEPARATOR . $folder);
                    }
                    $path .= DIRECTORY_SEPARATOR . $folder;
                }
                $full_name = $_POST['path'] . '/' . $fname;
                if (file_exists($full_name) && !is_writable($full_name)) {
                    echo json_encode(array(
                        'error' => 'File "'. $fname . '" is not writable'
                    ));
                } else {
                    if (isset($_GET['append'])) {
                        $contents = file_get_contents($_FILES['file']['tmp_name']);
                        $file = fopen($full_name, 'a+');
                        if (!$file) {
                            echo json_encode(array('error' => 'Can\'t save file.'));
                        } else if (fwrite($file, $contents) != strlen($contents)) {
                            echo json_encode(array('error' => 'Not all bytes saved.'));
                        } else {
                            echo json_encode(array('success' => true));
                        }
                        fclose($file);
                    } else {
                        if (!move_uploaded_file($_FILES['file']['tmp_name'],
                                                $full_name)) {
                            echo json_encode(array('error' => 'Can\'t save file.'));
                        } else {
                            echo json_encode(array('success' => true));
                        }
                    }
                }
                break;
            case UPLOAD_ERR_NO_FILE:
                echo json_encode(array('error' => 'File not sent.'));
                break;
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                echo json_encode(array('error' => 'Exceeded filesize limit.'));
                break;
            default:
                echo json_encode(array('error' => 'Unknown error.'));
        }
    } else {
        echo json_encode(array('error' => 'Invalid Token'));
    }
} else {
    echo json_encode(array('error' => 'Wrong request'));
}
?>
