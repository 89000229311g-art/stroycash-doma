<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', '/var/www/html/data/php_errors.log');
set_time_limit(30);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

// ==========================================
// НАСТРОЙКИ
// ==========================================
$VK_TOKEN   = "vk1.a.MinY160MiFVOv9L6mchcFqsky8OsWVQ56ljxuj65Y_g9MNAMz5DY5R6U-fhAoU3moy1RB4wbTHeV822j6wErRaXNTneRsXNriI6ZUfzL9V_BI6pDS_28YcTyVVTNIQpdTz0oPry5lzGs28czaV2un9x6w1-sHRArZ69KfRYzVD5P8fKmN31ed7MaoB6EIsm37fryINN7srpLc9rJp4wqVg";
$VK_USER_ID = "444124025";
$SMTP_USER  = "stroycash2020@mail.ru";
$SMTP_PASS  = "intermilano";
$EMAIL_TO   = "stroycash2020@mail.ru";
$LOG_FILE   = "/var/www/html/data/consents.csv";

// ==========================================

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["error" => "Only POST allowed"]);
    exit;
}

// Собираем данные из формы
$name   = "";
$phone  = "";
$fields = [];

foreach ($_POST as $key => $value) {
    if (is_array($value)) $value = implode(", ", $value);
    $value = htmlspecialchars(strip_tags(trim($value)));
    if (in_array($key, ['formid', 'formname', 'token', 'recaptcha', 'tildaspec'])) continue;
    if (stripos($key, 'name') !== false)  $name  = $value;
    if (stripos($key, 'phone') !== false) $phone = $value;
    $fields[] = ucfirst($key) . ": " . $value;
}

$body      = implode("\n", $fields);
$timestamp = date("d.m.Y H:i:s");
$ip        = $_SERVER['REMOTE_ADDR'] ?? 'неизвестен';
$ua        = $_SERVER['HTTP_USER_AGENT'] ?? '';

// ==========================================
// CSV-лог (ФЗ-152 — доказательство согласия)
// ==========================================
$log_dir = dirname($LOG_FILE);
if (!is_dir($log_dir)) {
    @mkdir($log_dir, 0750, true);
}

$csv_line = implode("\t", [
    $timestamp,
    $ip,
    $name  ?: "не указано",
    $phone ?: "не указан",
    "Согласие: да",
    str_replace(["\t", "\n"], " ", $body),
    str_replace(["\t", "\n"], " ", $ua),
]) . "\n";

@file_put_contents($LOG_FILE, $csv_line, FILE_APPEND | LOCK_EX);

// ==========================================
// VK (личное сообщение — быстрое уведомление)
// ==========================================
$vk_text  = "Новая заявка с сайта!\n\n";
$vk_text .= "Дата: " . $timestamp . "\n";
$vk_text .= "IP: " . $ip . "\n";
$vk_text .= "Имя: "     . ($name  ?: "не указано") . "\n";
$vk_text .= "Телефон: " . ($phone ?: "не указан")  . "\n";
if ($body) $vk_text .= "\nДанные:\n" . $body;

try {
    $ch = curl_init("https://api.vk.com/method/messages.send");
    curl_setopt_array($ch, [
        CURLOPT_POST             => true,
        CURLOPT_POSTFIELDS       => http_build_query([
            "user_id"      => $VK_USER_ID,
            "message"      => $vk_text,
            "random_id"    => time() . rand(100, 999),
            "access_token" => $VK_TOKEN,
            "v"            => "5.131"
        ]),
        CURLOPT_RETURNTRANSFER   => true,
        CURLOPT_CONNECTTIMEOUT   => 5,
        CURLOPT_TIMEOUT          => 8,
    ]);
    $vk_result = curl_exec($ch);
    curl_close($ch);
} catch (Throwable $e) {
    error_log("VK error: " . $e->getMessage());
}

// ==========================================
// Email через SMTP mail.ru (резервный канал + архив)
// ==========================================
function smtp_send($smtp_user, $smtp_pass, $to, $subject, $body) {
    $sock = @fsockopen("ssl://smtp.mail.ru", 465, $errno, $errstr, 8);
    if (!$sock) return false;

    stream_set_timeout($sock, 5);

    $read = function () use ($sock) {
        $line = fgets($sock, 512);
        $info = stream_get_meta_data($sock);
        if ($info['timed_out']) return false;
        return $line;
    };
    $write = function ($s) use ($sock) { fputs($sock, $s . "\r\n"); };

    if ($read() === false) { fclose($sock); return false; }

    $write("EHLO doma.stroycash.ru");
    $limit = 20;
    while ($limit-- > 0) {
        $line = $read();
        if ($line === false) { fclose($sock); return false; }
        if (isset($line[3]) && $line[3] === ' ') break;
    }

    $write("AUTH LOGIN");
    if ($read() === false) { fclose($sock); return false; }
    $write(base64_encode($smtp_user));
    if ($read() === false) { fclose($sock); return false; }
    $write(base64_encode($smtp_pass));
    $auth = $read();
    if ($auth === false || strpos($auth, '235') === false) { fclose($sock); return false; }

    $write("MAIL FROM: <{$smtp_user}>");
    if ($read() === false) { fclose($sock); return false; }
    $write("RCPT TO: <{$to}>");
    if ($read() === false) { fclose($sock); return false; }
    $write("DATA");
    if ($read() === false) { fclose($sock); return false; }

    $subj_b64 = "=?UTF-8?B?" . base64_encode($subject) . "?=";
    $from_b64 = "=?UTF-8?B?" . base64_encode("СтройКэшДома") . "?=";
    $msg  = "From: {$from_b64} <{$smtp_user}>\r\n";
    $msg .= "To: {$to}\r\n";
    $msg .= "Subject: {$subj_b64}\r\n";
    $msg .= "MIME-Version: 1.0\r\n";
    $msg .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $msg .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $msg .= chunk_split(base64_encode($body)) . "\r\n.";

    $write($msg);
    $result = $read();
    $write("QUIT");
    fclose($sock);
    return $result !== false && strpos($result, '250') !== false;
}

try {
    $subject    = "Новая заявка с сайта — " . $timestamp;
    $email_body = "НОВАЯ ЗАЯВКА — doma.stroycash.ru\n";
    $email_body .= str_repeat("=", 40) . "\n";
    $email_body .= "Дата/время:  {$timestamp}\n";
    $email_body .= "IP-адрес:    {$ip}\n";
    $email_body .= "Имя:         " . ($name  ?: "не указано") . "\n";
    $email_body .= "Телефон:     " . ($phone ?: "не указан")  . "\n";
    $email_body .= "Согласие:    Да (отправил форму)\n\n";
    if ($body) $email_body .= "Данные формы:\n{$body}\n\n";
    $email_body .= str_repeat("-", 40) . "\n";
    $email_body .= "Браузер: {$ua}\n";

    smtp_send($SMTP_USER, $SMTP_PASS, $EMAIL_TO, $subject, $email_body);
} catch (Throwable $e) {
    error_log("SMTP error: " . $e->getMessage());
}

// ==========================================
// Ответ — всегда 200, данные уже в CSV
// ==========================================
echo json_encode(["answer" => "ok"]);
