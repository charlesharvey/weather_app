<?php


include('env.php');

function wf_version() {
    return '0.0.7';
}



function theme_directory() {
    $query = $_SERVER['PHP_SELF'];
    $path = pathinfo($query);
    return $path['dirname'];
}
