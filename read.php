<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$file = __DIR__ . "/../data/trainings.json";

if (file_exists($file)) {
    $data = file_get_contents($file);
    header('Content-Type: application/json');
    echo $data;
} else {
    http_response_code(404);
    echo json_encode([
        "status" => "error",
        "message" => "Data file not found"
    ]);
}
?>
