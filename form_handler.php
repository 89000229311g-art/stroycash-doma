<?php
// ==========================================
// Обработчик заявок для экспортированного сайта Tilda
// ==========================================

// 1. Укажите вашу электронную почту, куда будут приходить заявки
$to_email = "your-email@yandex.ru"; 

// 2. Тема письма
$subject = "Новая заявка с сайта Stroy Cash";

// Если форма отправлена
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    $message = "Вы получили новую заявку с сайта:\n\n";
    
    // Перебираем все поля, которые пришли из формы Тильды
    foreach ($_POST as $key => $value) {
        // Очищаем данные от вредоносного кода
        $value = htmlspecialchars(strip_tags(trim($value)));
        
        // Добавляем в тело письма (игнорируем служебные поля Тильды)
        if ($key != 'formid' && $key != 'formname') {
             $message .= "Поле: " . $key . " - Значение: " . $value . "\n";
        }
    }

    // Заголовки письма
    $headers = "From: noreply@stroycashdoma.ru\r\n";
    $headers .= "Reply-To: noreply@stroycashdoma.ru\r\n";
    $headers .= "Content-type: text/plain; charset=utf-8\r\n";

    // Отправляем письмо
    if(mail($to_email, $subject, $message, $headers)) {
        // Ответ для Tilda, чтобы она показала сообщение об успешной отправке
        echo json_encode(array('message' => 'Спасибо! Ваша заявка успешно отправлена.'));
    } else {
        // Ошибка отправки
        http_response_code(500);
        echo json_encode(array('error' => 'Ошибка сервера при отправке письма.'));
    }
} else {
    echo "Этот скрипт принимает только POST-запросы.";
}
?>
