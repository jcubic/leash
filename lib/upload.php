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
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require('Service.php');
header('Content-type: application/json');

$service = new Service('config.json', preg_replace("/\/[^\/]+$/", "", getcwd()));

if (isset($_POST['token']) && isset($_POST['path'])) {
    if ($service->valid_token($_POST['token'])) {
        $fname = basename($_FILES['file']['name']);

        switch ($_FILES['file']['error']) {
            case UPLOAD_ERR_OK:
                $full_name = $_POST['path'] . '/' . $fname;
                if (file_exists($full_name) && !is_writable($full_name)) {
                    echo json_encode(array('error' => 'File "'.$fname.'" is not writable'));
                } else {
                    if (!move_uploaded_file($_FILES['file']['tmp_name'],
                                            $full_name)) {
                        echo json_encode(array('error' => 'Can\'t save file.'));
                    } else {
                        echo json_encode(array('success' => true));
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
                echo json_encode(array('error' => 'Unknown errors.'));
        }
    } else {
        echo json_encode(array('error' => 'Invalid Token'));
    }
} else {
    echo json_encode(array('error' => 'Wrong request'));
}
?>
