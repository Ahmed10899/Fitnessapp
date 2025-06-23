<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// JSON Input lesen
$inputJSON = file_get_contents('php://input');
$data = json_decode($inputJSON, true);

if ($data === null) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Invalid JSON input"
    ]);
    exit();
}

$file = __DIR__ . "/../data/trainings.json";

// JSON Datei schreiben
if (file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT))) {
    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "message" => "Data saved successfully"
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Failed to save data"
    ]);
}
?>
