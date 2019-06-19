<?php
/**
 * Copyright © MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Alexey Portnov, 6 2019
 */

define('ISPBXCORESERVICES', '1');
/* nginx -s reload;
 */
require_once 'Nats/autoloader.php';
require_once 'globals.php';
use Phalcon\Mvc\Micro;
use Phalcon\Events\Event;
use Phalcon\Events\Manager as EventsManager;

// Create a events manager
$eventsManager = new EventsManager();
$eventsManager->attach("micro:beforeExecuteRoute", function (Event $event, Micro $app) {
    // return true;
    if($_SERVER['REMOTE_ADDR'] == '127.0.0.1'){
        return true;
    }
    $config = $GLOBALS['g']['phalcon_settings'];
    if($config["application"]["debugMode"] == true){
        return true;
    }
    System::session_readonly();
    if( isset($_SESSION['auth']) ){
        return true;
    }
    // Исключения дла авторизации.content-disposition
    $panel_pattern = [
        '/api/miko_ajam/getvar', // Тут авторизация basic
        '/api/cdr/records',      // Тут авторизация basic
        '/api/cdr/playback',     // Защищен fail2ban
        '/api/cdr/get_data',
    ];
    // Текущий паттерн.
    $pattern = $app->getRouter()->getRewriteUri();
    $res_auth = true;
    // Проверяем авторизацию.
    if(preg_match_all('/\/api\/modules\/Module\w*\/custom_action\S*/m', $pattern) > 0){
        // Это сервисы модулей.
    }elseif(!in_array($pattern, $panel_pattern)) {
        $res_auth = false;
    }
    if(FALSE == $res_auth){
        $app->response->setStatusCode(403, "Forbidden")->sendHeaders();
        $app->response->setContent('The user isn\'t authenticated. ');
        $app->response->send();
        Util::sys_log_msg('web_auth', "From: {$_SERVER['REMOTE_ADDR']} UserAgent:{$_SERVER['HTTP_USER_AGENT']} Cause: Wrong password");
    }
    unset($event);
    return $res_auth;
});

$app = new Micro();
$app->setEventsManager($eventsManager);

/**
 * Последовательная загрузка данных из cdr таблицы.
 * /pbxcore/api/cdr/get_data MIKO AJAM
 * curl 'http://172.16.156.223:80/pbxcore/api/cdr/get_data?offset=0&limit=1';
 */
$app->get('/api/cdr/get_data', function () use ($app) {
    $offset = $app->request->get('offset');
    $limit  = $app->request->get('limit');
    $limit  = ($limit>600)?600:$limit;

    $filter = [
        "id>:id:",
        'bind'  => ['id' => $offset],
        'order' => 'id',
        'limit' => $limit,
        'miko_result_in_file' => true,
    ];

    $client  = new BeanstalkClient('select_cdr');
    $message = $client->request(json_encode($filter), 2);
    if($message == false){
        $app->response->setContent('');
        $app->response->send();
    }else{
        $result   = json_decode($message);
        $arr_data = [];
        if(file_exists($result)){
            $arr_data = json_decode(file_get_contents($result), true);
            @unlink($result);
        }
        $xml_output  = "<?xml version=\"1.0\"?>\n";
        $xml_output .= "<cdr-table-askozia>\n";
        foreach ($arr_data as $data){
            $attributes = '';
            foreach ($data as $tmp_key => $tmp_val) {
                $attributes .= sprintf('%s="%s" ', $tmp_key, rawurlencode($tmp_val));
            }
            $xml_output.= "<cdr-row $attributes />\n";
        }
        $xml_output .= "</cdr-table-askozia>";
        $app->response->setContent($xml_output);
        $app->response->send();
    }
});

/**
 * Скачивание записи разговора.
 * /pbxcore/api/cdr/records MIKO AJAM
 * curl http://172.16.156.212/pbxcore/api/cdr/records?view=/storage/usbdisk1/mikoziapbx/voicemailarchive/monitor/2018/05/05/16/mikozia-1525527966.4_oWgzQFMPRA.mp3
 */
$app->get('/api/cdr/records', function () use ($app) {
    if(!Util::check_auth_http($this->request)){
        $app->response->setStatusCode(403, 'Forbidden');
        $app->response->setContent('The user isn\'t authenticated.');
        $app->response->send();
        return;
    }

    $filename = $app->request->get('view');
    $extension = strtolower(substr(strrchr($filename,"."),1));
    $type = '';
    switch ($extension) {
        case "mp3":
            $type = "audio/mpeg";
            break;
        case "wav":
            $type = "audio/x-wav";
            break;
        case "gsm":
            $type = "audio/x-gsm";
            break;
    }
    $size = @filesize($filename);
    if(!$size || $type == ''){
        openlog("miko_ajam", LOG_PID | LOG_PERROR, LOG_AUTH);
        syslog(LOG_WARNING, "From {$_SERVER['REMOTE_ADDR']}. UserAgent: ({$_SERVER['HTTP_USER_AGENT']}). File not found.");
        closelog();

        $response = new Phalcon\Http\Response();
        $response->setStatusCode(404, 'Файл не найден');
        $response->setContent('Файл не найден');
        $response->send();
        return;
    }

    $fp=fopen($filename, "rb");
    if ($fp) {
        $app->response->setHeader('Content-Description', "mp3 file");
        $app->response->setHeader('Content-Disposition', "attachment; filename=".basename($filename));
        $app->response->setHeader('Content-type', "$type");
        $app->response->setHeader('Content-Transfer-Encoding', "binary");
        $app->response->setContentLength($size);
        $app->response->sendHeaders();
        fpassthru($fp);
    }else{
        $response = new Phalcon\Http\Response();
        $response->setStatusCode(404, 'Файл не найден');
        $response->setContent('Не удалось открыть файо на сервере');
        $response->send();
        return;
    }
});

/**
 * Прослушивание файла записи с прокруткой.
 * /pbxcore/api/cdr/playback MIKO AJAM
 * http://172.16.156.212/pbxcore/api/cdr/playback?view=/storage/usbdisk1/mikopbx/voicemailarchive/monitor/2018/05/11/16/mikopbx-1526043925.13_43T4MdXcpT.mp3
 * http://172.16.156.212/pbxcore/api/cdr/playback?view=/storage/usbdisk1/mikopbx/voicemailarchive/monitor/2018/06/01/17/mikopbx-1527865189.0_qrQeNUixcV.wav
 * http://172.16.156.223/pbxcore/api/cdr/playback?view=/storage/usbdisk1/mikopbx/voicemailarchive/monitor/2018/12/18/09/mikopbx-1545113960.4_gTvBUcLEYh.mp3&download=true&filename=test.mp3
 *  Итого имеем следующий набор параметров API:
 *   * view* - полный путь к файлу записи разговора.
 *  download - опциональный параметр, скачивать записи или нет
 *  filename - опциональный параметр, красивое имя для файла, так файл будет назван при скачивании браузером
 */
$app->get('/api/cdr/playback', function () use ($app) {
    $filename    = $app->request->get('view');
    $extension = strtolower(substr(strrchr($filename,"."),1));
    if(Util::rec_file_exists($filename) && ($extension == 'mp3' || $extension == 'wav' )){
        $ctype ='';
        switch( $extension ) {
            case "mp3": $ctype="audio/mpeg"; break;
            case "wav": $ctype="audio/x-wav"; break;
        }
        $filesize = filesize($filename);
        if (isset($_SERVER['HTTP_RANGE'])){
            $range = $_SERVER['HTTP_RANGE'];
            list ($param, $range) = explode('=', $range);
            if (strtolower(trim($param)) != 'bytes') {
                header("HTTP/1.1 400 Invalid Request");
                exit();
            }
            $range = explode(',', $range);
            $range = explode('-', $range[0]);
            if ($range[0] === '') {
                $end = $filesize - 1;
                $start = $end - intval($range[0]);
            }else
                if ($range[1] === ''){
                    $start = intval($range[0]);
                    $end = $filesize - 1;
                }else{
                    $start = intval($range[0]);
                    $end = intval($range[1]);
                    // if ($end >= $filesize || (! $start && (! $end || $end == ($filesize - 1)))){
                        // $partial = false;
                    // }
                }
            $length = $end - $start + 1;

            $app->response->resetHeaders();
            $app->response->setRawHeader('HTTP/1.1 206 Partial Content');
            $app->response->setHeader('Content-type', "$ctype");
            $app->response->setHeader('Content-Range', "bytes $start-$end/$filesize");
            $app->response->setContentLength($length);
            if (! $fp = fopen($filename, 'rb')) {
                header("HTTP/1.1 500 Internal Server Error");
                exit();
            }
            if ($start){
                fseek($fp, $start);
            }
            $content = '';
            while ($length) {
                set_time_limit(0);
                $read = ($length > 8192) ? 8192 : $length;
                $length -= $read;
                $content.=fread($fp, $read);
            }
            fclose($fp);
            $app->response->setContent($content);
        }else{
            $app->response->setHeader('Content-type', "$ctype");
            $app->response->setContentLength($filesize);
            $app->response->setHeader('Accept-Ranges', "bytes");
            $app->response->setStatusCode(200, 'OK');
            // $app->response->setContent(file_get_contents($filename));
            $app->response->setFileToSend($filename);
            // TODO
        }
        $app->response->setHeader('Server', "nginx");

        $is_download = !empty($app->request->get('download'));
        if($is_download){
            $new_filename = $app->request->get('filename');
            if(empty($new_filename)){
                $new_filename = basename($filename);
            }

            $app->response->setHeader('Content-Disposition', "attachment; filename*=UTF-8''".basename($new_filename));
        }
        $app->response->send();
    }else{
        openlog("miko_ajam", LOG_PID | LOG_PERROR, LOG_AUTH);
        syslog(LOG_WARNING, "From {$_SERVER['REMOTE_ADDR']}. UserAgent: ({$_SERVER['HTTP_USER_AGENT']}). File not found.");
        closelog();
        $app->response->resetHeaders();
        $app->response->setRawHeader('HTTP/1.0 404 Not Found');
        $app->response->setStatusCode(404, 'Not Found');
        $app->response->setContent('File not found');
        $app->response->send();
    }
});

/**
 * /pbxcore/api/cdr/ Запрос активных звонков.
 *   curl http://172.16.156.212/pbxcore/api/cdr/get_active_calls;
 * Пример ответа:
 * [{"start":"2018-02-27 10:45:07","answer":null,"src_num":"206","dst_num":"226","did":"","linkedid":"1519717507.24"}]
 * Возвращает массив массивов со следующими полями:
"start" 		 => 'TEXT', 	 // DataTime
"answer" 		 => 'TEXT', 	 // DataTime
"endtime" 		 => 'TEXT', 	 // DataTime
"src_num" 		 => 'TEXT',
"dst_num" 		 => 'TEXT',
"linkedid" 		 => 'TEXT',
"did"  			 => 'TEXT',
 */
$app->get('/api/cdr/get_active_calls', function () use ($app) {
    $filter = [
        'order' => 'id',
        'columns' => 'start,answer,endtime,src_num,dst_num,did,linkedid',
        'miko_tmp_db' => true,
    ];
    $client  = new BeanstalkClient('select_cdr');
    $message = $client->request(json_encode($filter), 2);
    if($message == false){
        $app->response->setContent('[]');
    }else{
        $app->response->setContent($message);
    }
    $app->response->send();

});

/**
 * /pbxcore/api/cdr/ Запрос активных звонков.
 *   curl http://127.0.0.1/pbxcore/api/cdr/get_active_channels;
 * Пример ответа:
 * [{"start":"2018-02-27 10:45:07","answer":null,"src_num":"206","dst_num":"226","did":"","linkedid":"1519717507.24"}]
 * Возвращает массив массивов со следующими полями:
"start" 		 => 'TEXT', 	 // DataTime
"answer" 		 => 'TEXT', 	 // DataTime
"endtime" 		 => 'TEXT', 	 // DataTime
"src_num" 		 => 'TEXT',
"dst_num" 		 => 'TEXT',
"linkedid" 		 => 'TEXT',
"did"  			 => 'TEXT',
 */
$app->get('/api/cdr/get_active_channels', function () use ($app) {
    $filter = [
        "endtime IS NULL",
        'order' => 'id',
        'columns' => 'start,answer,src_chan,dst_chan,src_num,dst_num,did,linkedid',
        'miko_tmp_db' => true,
        'miko_result_in_file' => true,
    ];
    $client  = new BeanstalkClient('select_cdr');
    $message = $client->request(json_encode($filter), 2);
    if($message == false){
        $app->response->setContent('[]');
    }else{
        $result_message = "[]";
        $am = Util::get_am('off');
        $active_chans = $am->GetChannels(true);
        $am->Logoff();
        $result_data = [];

        $result   = json_decode($message);
        if(file_exists($result)){
            $data = json_decode(file_get_contents($result), true);
            unlink($result);
            foreach ($data as $row){
                if( !isset($active_chans[$row['linkedid']]) ){
                    // Вызов уже не существует.
                    continue;
                }
                if(empty($row['dst_chan']) && empty($row['src_chan'])){
                    // Это ошибочная ситуация. Игнорируем такой вызов.
                    continue;
                }
                $channels = $active_chans[$row['linkedid']];
                if( ( empty($row['src_chan']) || in_array($row['src_chan'],$channels) )
                    && ( empty($row['dst_chan']) || in_array($row['dst_chan'],$channels) ) ){
                    $result_data[] = $row;
                }
            }
            $result_message = json_encode($result_data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);

        }
        $app->response->setContent($result_message);
    }
    $app->response->send();

});

/**
 * /pbxcore/api/sip/ Получение информации о SIP.
 * Статусы SIP учеток:
 *   curl http://172.16.156.223/pbxcore/api/sip/get_peers_statuses;
 * Пример ответа:
 *   {"result":"Success","data":[{"id":"204","state":"UNKNOWN"}]}
 *
 * Статусы регистраций:
 *   curl http://172.16.156.212/pbxcore/api/sip/get_registry;
 * Пример ответа:
 *   {"result":"Success","data":[{"id":"SIP-PROVIDER-426304427564469b6c7755","state":"Registered"}]}
 */
$app->get('/api/sip/{name}', function ($params) use ($app) {
    $request = [
        'data'   => null,
        'action' =>$params
    ];

    $client = new Nats\Connection();
    $client->connect(2);
    $cb = function (Nats\Message $message) use ($app) {
        $app->response->setContent($message->getBody());
        $app->response->send();
        exit(0);
    };
    $client->request('sip', json_encode($request), $cb);

    $data = [
        'result'  => 'ERROR',
        'message' => 'API Worker not started...'
    ];
    $app->response->setContent(json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    $app->response->send();
});

/**
 * Статусы регистраций:
 *   curl http://172.16.156.212/pbxcore/api/iax/get_registry;
 */
$app->get('/api/iax/{name}', function ($params) use ($app) {
    $request = [
        'data' => null,
        'action' =>$params
    ];

    $client = new Nats\Connection();
    $client->connect(2);
    $cb = function (Nats\Message $message) use ($app) {
        $app->response->setContent($message->getBody());
        $app->response->send();
        exit(0);
    };
    $client->request('iax', json_encode($request), $cb);

    $data = [
        'result'  => 'ERROR',
        'message' => 'API Worker not started...'
    ];
    $app->response->setContent(json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    $app->response->send();
});

/**
 * Получение информации по SIP пиру.
 *   curl -X POST -d '{"peer": "212"}' http://172.16.156.212/pbxcore/api/sip/get_sip_peer;
 */
$app->post('/api/sip/{name}', function ($params) use ($app) {
    $row_data = $app->request->getRawBody();
    // Проверим, переданные данные.
    if(!Util::is_json($row_data)){
        $app->response->setStatusCode(200, "OK")->sendHeaders();
        $app->response->setContent('{"result":"ERROR"}');
        $app->response->send();
        return;
    }
    $data = json_decode( $row_data, true);
    $request = array(
        'data'      => $data,   // Параметры запроса.
        'action'    => $params  // Операция.
    );

    $client = new Nats\Connection();
    $client->connect(2);
    $cb = function (Nats\Message $message) use ($app) {
        $app->response->setContent($message->getBody());
        $app->response->send();
        exit(0);
    };
    $client->request('sip', json_encode($request), $cb);
    $data = [
        'result'  => 'ERROR',
        'message' => 'API Worker not started...'
    ];
    $app->response->setContent(json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    $app->response->send();
});

/**
 * /pbxcore/api/pbx/ Управление PBX.
 * Рестарт всех модулей АТС:
 *   curl http://172.16.156.212/pbxcore/api/pbx/reload_all_modules;
 * Запуск генератора dialplan, перезапуск dialplan на АТС.
 *   curl http://172.16.156.212/pbxcore/api/pbx/reload_dialplan;
 * Рестарт модуля SIP.
 *   curl http://172.16.156.212/pbxcore/api/pbx/reload_sip;
 * Рестарт модуля очередей.
 *   curl http://172.16.156.212/pbxcore/api/pbx/reload_queues;
 * Рестарт модуля IAX
 *   curl http://172.16.156.212/pbxcore/api/pbx/reload_iax;
 * Рестарт модуля AMI
 *   curl http://172.16.156.212/pbxcore/api/pbx/reload_manager;
 * Рестарт модуля features.conf
 *   curl http://172.16.156.212/pbxcore/api/pbx/reload_features;
 * Проверка лицензии
 *   curl http://172.16.156.212/pbxcore/api/pbx/check_licence;
 *
 * Пример ответа:
 *   {"result":"Success"}
 */
$app->get('/api/pbx/{name}', function ($params) use ($app) {
    $client = new Nats\Connection();
    $client->connect(10);
    $cb = function (Nats\Message $message) use ($app) {
        $app->response->setContent($message->getBody());
        $app->response->send();
        return;
    };
    $client->request('pbx', "$params", $cb);
});

/**
 * /pbxcore/api/system/ Управление системой в целом (GET).
 * Рестарт ОС.
 *   curl http://172.16.156.212/pbxcore/api/system/shutdown;
 * Рестарт ОС.
 *   curl http://172.16.156.212/pbxcore/api/system/reboot;
 * Рестарт сетевых интерфейсов.
 *   curl http://172.16.156.212/pbxcore/api/system/network_reload;
 * Перезагрузка правил firewall.
 *   curl http://127.0.0.1/pbxcore/api/system/reload_firewall;
 * Получения забаненных ip
 *   curl http://172.16.156.212/pbxcore/api/system/get_ban_ip;
 * Получение информации о системе
 *   curl http://172.16.156.223/pbxcore/api/system/get_info;
 * Настройка msmtp
 *   curl http://172.16.156.212/pbxcore/api/system/reload_msmtp;
 * Настройка SSH
 *   curl http://172.16.156.212/pbxcore/api/system/reload_ssh;
 * Настройка cron
 *   curl http://172.16.156.212/pbxcore/api/system/reload_cron;
 * Настройка Nats
 *   curl http://172.16.156.212/pbxcore/api/system/reload_nats;
 * Обновление конфигурации кастомных файлов.
 *   curl http://172.16.156.212/pbxcore/api/system/update_custom_files;
 * Старт сбора логов.
 *   curl http://172.16.156.212/pbxcore/api/system/start_log;
 * Завершение сбора логов.
 *   curl http://172.16.156.212/pbxcore/api/system/stop_log;
 * Пинг АТС (описан в nginx.conf):
 *   curl http://172.16.156.223/pbxcore/api/system/ping
 * Рестарт Web сервера:
 *   curl http://172.16.156.212/pbxcore/api/system/reload_nginx
 * Получение информации о внешнем IP адресе:
 *   curl http://172.16.156.212/pbxcore/api/system/get_external_ip_info
 * Пример ответа:
 *   {"result":"Success"}
 */
$app->get('/api/system/{name}', function ($params)use ($app) {

    $request = array(
        'data' => null,
        'action' =>$params
    );
    $client = new Nats\Connection();
    $client->connect(10);
    $cb = function (Nats\Message $message) use ($params, $app) {
        if($params == 'stop_log'){
            $data = json_decode($message->getBody(), true);
            if(!file_exists($data['filename'])){
                $app->response->setStatusCode(200, "OK")->sendHeaders();
                $app->response->setContent('Log file not found.');
                $app->response->send();
                return;
            }
            $fp=fopen($data['filename'], "rb");
            if ($fp) {
                $size = filesize($data['filename']);
                $app->response->setHeader('Content-Description', "log file");
                $app->response->setHeader('Content-Disposition', "attachment; filename=".basename($data['filename']));
                $app->response->setHeader('Content-type', "application/gzip");
                $app->response->setHeader('Content-Transfer-Encoding', "binary");
                $app->response->setContentLength($size);
                $app->response->sendHeaders();
                fpassthru($fp);
            }
        }else{
            $app->response->setStatusCode(200, "OK")->sendHeaders();
            $app->response->setContent($message->getBody());
            $app->response->send();
        }
    };
    $client->request('system', json_encode($request), $cb);
});

/**
 * /pbxcore/api/system/ Управление системой в целом (POST).
 * Установка системного времени
 *   curl -X POST -d '{"date": "2015.12.31-01:01:20"}' http://172.16.156.212/pbxcore/api/system/set_date;
 *
 * Отправка email.
 *   curl -X POST -d '{"email": "apor@miko.ru", "subject":"Привет от mikopbx", "body":"Тестовое сообщение", "encode": ""}' http://172.16.156.223/pbxcore/api/system/send_mail;
 *     'encode' - может быть пустой строкой или 'base64', на случай, если subject и body передаются в base64;
 *
 * Снятие бана IP адреса
 *   curl -X POST -d '{"ip": "172.16.156.1"}' http://172.16.156.212/pbxcore/api/system/unban_ip;
 *   Пример ответа:
 *   {"result":"Success","data":[{"jail":"asterisk","ip":"172.16.156.1","timeofban":1522326119}],"function":"get_ban_ip"}
 *
 * Получение содержимого файла.
 *   curl -X POST -d '{"filename": "/etc/asterisk/asterisk.conf"}' http://172.16.156.212/pbxcore/api/system/file_read_content;
 *   Примеры ответа:
 *   {"result":"ERROR","message":"API action not found;","function":"file_read_content"}
 *   {"result":"Success","data":"W2RpcmVj","function":"file_read_content"}
 *
 * Конвертация аудио файла:
 *   curl -X POST -d '{"filename": "/tmp/WelcomeMaleMusic.mp3"}' http://172.16.156.212/pbxcore/api/system/convert_audio_file;
 *   Пример ответа:
 *   {
 *      "result": "Success",
 *      "filename": "/tmp/WelcomeMaleMusic.wav",
 *      "function": "convert_audio_file"
 *   }
 * Загрузка аудио файла на АТС:
 *   curl  -F "file=@/root/2233333.mp3" http://172.16.156.212/pbxcore/api/system/upload_audio_file;
 *   Пример ответа:
 *   {
 *      "result": "Success",
 *      "filename": "/tmp/WelcomeMaleMusic.wav",
 *      "function": "upload_audio_file"
 *   }
 * Удаление аудио файла:

 *   curl -X POST -d '{"filename": "/storage/usbdisk1/mikopbx/tmp/2233333.wav"}' http://172.16.156.212/pbxcore/api/system/remove_audio_file;
 * Обновление системы (офлайн)
 *   curl -F "file=@1.0.5-9.0-svn-mikopbx-x86-64-cross-linux.img" http://172.16.156.212/pbxcore/api/system/upgrade;
 * Онлайн обновление АТС.
 *   curl -X POST -d '{"md5":"df7622068d0d58700a2a624d991b6c1f", "url": "https://www.askozia.ru/upload/update/firmware/6.2.96-9.0-svn-mikopbx-x86-64-cross-linux.img"}' http://172.16.156.223/pbxcore/api/system/upgrade_online;
 */
$app->post('/api/system/{name}', function ($params) use ($app) {
    if($params == 'upgrade') {
        $data = ["result" => "ERROR"];
        if ($app->request->hasFiles() != true) {
            $app->response->setContent(json_encode($data));
            $app->response->send();
            return;
        }
        $dirs = PBX::get_asterisk_dirs();

        foreach ($app->request->getUploadedFiles() as $file) {
            $tmp_arr = explode('.', $file->getName());
            $extension = $tmp_arr[count($tmp_arr) - 1];
            if ($extension == 'img') {
                $upd_file = "{$dirs['tmp']}/update.img";
            } else {
                continue;
            }

            $res = $file->moveTo($upd_file);
            $res = ($res && file_exists($upd_file));
            if ($res != true) {
                $app->response->setContent(json_encode($data));
                $app->response->send();
                return;
            }
            break;
        }
        $data = null;
    }else if($params == 'upload_audio_file') {
        $data = ["result" => "ERROR"];
        if ($app->request->hasFiles() != true) {
            $data['message'] = 'Uploded file not found.';
            $app->response->setContent(json_encode($data));
            $app->response->send();
            return;
        }
        $dirs = PBX::get_asterisk_dirs();
        $filename = '';
        foreach ($app->request->getUploadedFiles() as $file) {
            $filename = "{$dirs['media']}/".basename($file->getName());
            $res = $file->moveTo( $filename);
            $res = ($res && file_exists($filename));
            if ($res != true) {
                $data['message'] = 'Can not move uploded file.';
                $app->response->setContent(json_encode($data));
                $app->response->send();
                return;
            }
            break;
        }
        $data   = ['filename' => $filename];
        $params = 'convert_audio_file';
    }else{
        $row_data = $app->request->getRawBody();
        // Проверим, переданные данные.
        if(!Util::is_json($row_data)){
            $app->response->setStatusCode(200, "OK")->sendHeaders();
            $app->response->setContent('{"result":"ERROR"}');
            $app->response->send();
            return;
        }
        $data = json_decode( $row_data, true);
    }

    $request = array(
        'data'      => $data,   // Параметры запроса.
        'action'    => $params  // Операция.
    );

    $client = new Nats\Connection();
    $client->connect(10);
    $cb = function (Nats\Message $message) use ($app) {
        $app->response->setStatusCode(200, "OK")->sendHeaders();
        $app->response->setContent(''.$message->getBody());
        $app->response->send();
    };

    $client->request('system', json_encode($request), $cb);
});

/**
 * GET Резервное копирование.
 *
 * Получить список доступных резервных копий.
 *   curl http://172.16.156.212/pbxcore/api/backup/list;
 * Скачать файл лога.
 *   curl http://172.16.156.212/pbxcore/api/backup/download?id=backup_1530715058
 * Удалить резервную копию
 *   curl http://172.16.156.212/pbxcore/api/backup/remove?id=backup_1531123670
 * Получить пердполагаемый размер резервной копии
 *   curl http://172.16.156.212/pbxcore/api/backup/get_estimated_size
 *
 * Восстановить из резервной копии.
 *  curl http://172.16.156.212/pbxcore/api/backup/recover?id=backup_1531123800
 * Проверить соединение с FTP / SFTP хранилищем.
 *  curl http://172.16.156.212/pbxcore/api/backup/check_storage_ftp?id=1
 */
$app->get('/api/backup/{name}', function ($params)use ($app) {
    $request = array(
        'data'   => $_REQUEST,
        'action' => $params
    );

    $client = new Nats\Connection();
    $client->connect(10);
    $cb = function (Nats\Message $message) use ($params, $app) {
        if($params == 'download'){
            $id = $app->request->get('id');
            $b = new Backup($id);
            $filename = $b->get_result_file();

            if(!file_exists($filename)){
                $app->response->setStatusCode(404, "File not found")->sendHeaders();
                $app->response->setContent("File not found");
                $app->response->send();
                return;
            }

            $extension = Util::get_extension_file($filename);
            if($extension == 'zip'){
                $size = filesize($filename);
                $app->response->setHeader('Content-type',        "application/zip");
                $app->response->setHeader('Content-Description', "File Transfer");
                $app->response->setHeader('Content-Disposition', "attachment; filename={$id}.{$extension}");

                // $app->response->setHeader('Content-Transfer-Encoding', "binary");
                $app->response->setContentLength($size);
                $app->response->sendHeaders();

                proc_nice(15);
                readfile($filename);
            }else{
                $scheme     = $app->request->getScheme();
                $host       = $app->request->getHttpHost();
                $port       = $app->request->getPort();
                $uid        = Util::generateRandomString(36);
                $path2dirs  = PBX::get_asterisk_dirs();

                $result_dir = "{$path2dirs['download_link']}/{$uid}";
                Util::mwexec("mkdir -p {$result_dir}");
                Util::mwexec("ln -s {$filename} {$result_dir}/{$id}.{$extension}");
                $app->response->redirect("{$scheme}://{$host}:{$port}/download_link/{$uid}/{$id}.{$extension}");
                $app->response->send();
            }
        }else{
            $app->response->setStatusCode(200, "OK")->sendHeaders();
            $app->response->setContent($message->getBody());
            $app->response->send();
        }
    };
    $client->request('backup', json_encode($request), $cb);
});

/**
 * POST Начать резервное копирование.
 *   curl -X POST -d '{"backup-config":"1","backup-records":"1","backup-cdr":"1","backup-sound-files":"1"}' http://172.16.156.212/pbxcore/api/backup/start;
 * Продолжить выполнение резервного копирования:
 *   curl -X POST -d '{"id":"backup_1531123800"}' http://172.16.156.212/pbxcore/api/backup/start;
 * Приостановить процесс
 *   curl -X POST -d '{"id":"backup_1531123800"}' http://172.16.156.212/pbxcore/api/backup/stop;
 * Загрузка файла на АТС.
 *   curl -F "file=@backup_1531474060.zip" http://172.16.156.212/pbxcore/api/backup/upload;
 * Конвертация старого конфига.
 *   curl -F "file=@config-askoziapbx.local-20180817170826.xml" http://172.16.156.212/pbxcore/api/backup/upload;
 * Восстановить из резервной копии.
 *  curl -X POST -d '{"id": "backup_1534838222", "options":{"backup-config":"1","backup-records":"1","backup-cdr":"1","backup-sound-files":"1"}}' http://172.16.156.212/pbxcore/api/backup/recover;
 *  curl -X POST -d '{"id": "backup_1534838222", "options":{"backup-sound-files":"1"}}' http://172.16.156.212/pbxcore/api/backup/recover;
 */
$app->post('/api/backup/{name}', function ($params)use ($app){
    if($params == 'upload' ){
        $data = [];
        $data["result"] = "ERROR";
        if($app->request->hasFiles() == true){
            $backupdir  = Backup::get_backup_dir();
            $dirs       = PBX::get_asterisk_dirs();
            foreach ($app->request->getUploadedFiles() as $file) {
                $tmp_arr   = explode('.', $file->getName());
                $extension = $tmp_arr[count($tmp_arr)-1];
                unset($tmp_arr[count($tmp_arr)-1]);

                $dir_name = implode($tmp_arr);

                if($extension == 'xml') {
                    $res_file = "{$dirs['tmp']}/old_config.xml";
                    $res = $file->moveTo($res_file);
                    $res = ($res && file_exists($res_file));
                    if ($res != true) {
                        $app->response->setContent(json_encode($data));
                        $app->response->send();
                        return;
                    }
                    $request = array(
                        'data' => null,
                        'action' => 'convert_config' // Операция.
                    );
                    $client = new Nats\Connection();
                    $client->connect(10);
                    $cb = function (Nats\Message $message) use ($app){
                        $app->response->setStatusCode(200, "OK")->sendHeaders();
                        $app->response->setContent('' . $message->getBody());
                        $app->response->send();
                    };
                    $client->request('backup', json_encode($request), $cb);
                    return;
                }else{
                    $mnt_point = "{$backupdir}/$dir_name/mnt_point";
                    if(!is_dir("{$backupdir}/$dir_name/")){
                        mkdir("{$backupdir}/$dir_name/");
                        mkdir("{$mnt_point}");
                    }
                    $res_file = "{$backupdir}/$dir_name/resultfile.{$extension}";
                    $res = $file->moveTo($res_file);
                    $res = ($res && file_exists($res_file));
                    if($res == true){
                        $request = [
                            'data'   => [
                                'res_file'  => $res_file,
                                'mnt_point' => $mnt_point,
                                'backupdir' => $backupdir,
                                'dir_name'  => $dir_name,
                                'extension' => $extension
                            ],
                            'action' => $params // Операция.
                        ];
                        $client = new Nats\Connection();
                        $client->connect(10);
                        $cb = function (Nats\Message $message) use ($app){
                            $app->response->setStatusCode(200, "OK")->sendHeaders();
                            $app->response->setContent('' . $message->getBody());
                            $app->response->send();
                        };
                        $client->request('backup', json_encode($request), $cb);
                        return;
                    }
                }
            }
        }
        $app->response->setContent(json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        $app->response->send();
        return;
    }

    $row_data = $app->request->getRawBody();
    // Проверим, переданные данные.
    if(!Util::is_json($row_data)){
        $app->response->setStatusCode(200, "OK")->sendHeaders();
        $app->response->setContent('{"result":"ERROR"}');
        $app->response->send();
        return;
    }
    $data = json_decode( $row_data, true);
    $request = array(
        'data'      => $data,   // Параметры запроса.
        'action'    => $params  // Операция.
    );

    $client = new Nats\Connection();
    $client->connect(10);
    $cb = function (Nats\Message $message) use ($app) {
        $app->response->setStatusCode(200, "OK")->sendHeaders();
        $app->response->setContent(''.$message->getBody());
        $app->response->send();
    };

    $client->request('backup', json_encode($request), $cb);
});


/**
 * API дополнительных модулей.
 * Проверка работы модуля:
 *   curl http://127.0.0.1/pbxcore/api/modules/ModuleSmartIVR/check
 *   curl http://127.0.0.1/pbxcore/api/modules/ModuleCTIClient/check
 *   curl http://127.0.0.1/pbxcore/api/modules/ModuleTelegramNotify/check
 *   curl http://127.0.0.1/pbxcore/api/modules/ModuleBitrix24Notify/check
 *   curl http://127.0.0.1/pbxcore/api/modules/ModuleBitrix24Integration/check
 *
 * Перезапуск модуля с генерацией конфига:
 *   curl http://127.0.0.1/pbxcore/api/modules/ModuleSmartIVR/reload
 *   curl http://127.0.0.1/pbxcore/api/modules/ModuleCTIClient/reload
 *   curl http://127.0.0.1/pbxcore/api/modules/ModuleBitrix24Integration/reload
 *
 * Деинсталляция модуля:
    curl http://172.16.156.223/pbxcore/api/modules/ModuleSmartIVR/uninstall
    curl http://172.16.156.223/pbxcore/api/modules/ModuleCTIClient/uninstall
 * Статус загрузки модуля на АТС:
    curl http://172.16.156.223/pbxcore/api/modules/ModuleSmartIVR/status/
    curl http://172.16.156.223/pbxcore/api/modules/ModuleCTIClient/status/
 *
 * Выполнение действий без основной авторизации.
 * curl http://172.16.156.223/pbxcore/api/modules/ModuleAutoprovision/custom_action?action=getcfg&mac=00135E874B49&solt=test
 * curl http://172.16.156.223/pbxcore/api/modules/ModuleAutoprovision/custom_action?action=getimg&file=logo-yealink-132x32.dob
 *
 * curl http://84.201.142.45/pbxcore/api/modules/ModuleBitrix24Notify/custom_action?portal=b24-uve4uz.bitrix24.ru
 * curl http://84.201.142.45/pbxcore/api/modules/ModuleBitrix24Notify/custom_action?portal=miko24.ru
 * curl http://84.201.142.45/pbxcore/api/modules/ModuleBitrix24Notify/custom_action
 *
 * curl http://127.0.0.1/pbxcore/api/modules/ModuleWebConsole/show_console
 *
 * @param $name
 * @param $command
 */
$f_modules_name_command = function ($name, $command) use ($app) {

    $_REQUEST['ip_srv'] = $_SERVER['SERVER_ADDR'];
    $input    = file_get_contents( 'php://input' );
    $request = [
        'data'   => $_REQUEST,
        'module' => $name,
        'input'  => $input,     // Параметры запроса.
        'action' => $command,
        'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD']
    ];

    $cb = function (Nats\Message $message) use ($name, $command, $app) {
        $response = json_decode($message->getBody(), true);
        if( isset($response['fpassthru']) ) {
            $fp = fopen($response['filename'], "rb");
            if ($fp) {
                $size = filesize($response['filename']);
                $name = basename($response['filename']);
                $app->response->setHeader('Content-Description', "config file");
                $app->response->setHeader('Content-Disposition', "attachment; filename={$name}");
                $app->response->setHeader('Content-type', "text/plain");
                $app->response->setHeader('Content-Transfer-Encoding', "binary");
                $app->response->setContentLength($size);
                $app->response->sendHeaders();
                fpassthru($fp);
            }
            fclose($fp);
            if (isset($response['need_delete']) && $response['need_delete'] == true) {
                unlink($response['filename']);
            }
        }elseif (isset($response['redirect'])){
            $app->response->redirect($response['redirect'], true, 302);
            $app->response->send();
        }elseif (isset($response['headers']) && isset($response['echo'])){
            if(isset($response['headers'])){
                foreach ($response['headers'] as $name => $value){
                    $app->response->setHeader($name, $value);
                }
            }
            if( isset($response['echo']) ){
                $app->response->setContent($response['echo']);
            }
            $app->response->setStatusCode(200, "OK")->sendHeaders();
            $app->response->send();
        }elseif (isset($response['echo_file'])){
            $app->response->setStatusCode(200, "OK")->sendHeaders();
            $app->response->setFileToSend($response['echo_file']);
            $app->response->send();
        }else{
            $app->response->setStatusCode(200, "OK")->sendHeaders();
            $app->response->setContent($message->getBody());
            $app->response->send();
        }

    };
    $client = new Nats\Connection();
    $client->connect(100);
    $client->request('modules', json_encode($request), $cb);
};
$app->get( '/api/modules/{name}/{command}', $f_modules_name_command);
$app->post('/api/modules/{name}/{command}', $f_modules_name_command);

/**
 * Загрузка модуля по http
    curl -X POST -d '{"uniqid":"ModuleCTIClient", "md5":"fd9fbf38298dea83667a36d1d0464eae", "url": "https://www.askozia.ru/upload/update/modules/ModuleCTIClient/ModuleCTIClientv01.zip"}' http://172.16.156.223/pbxcore/api/modules/upload;
    curl -X POST -d '{"uniqid":"ModuleSmartIVR", "md5":"fc64fd786f4242885ab50ce5f1fb56c5", "url": "https://www.askozia.ru/upload/update/modules/ModuleSmartIVR/ModuleSmartIVRv01.zip"}' http://172.16.156.223/pbxcore/api/modules/upload;
 */
$app->post('/api/modules/{command}', function ($command) use ($app){
    $data = ["result" => "ERROR"];
    if (Util::is_json($app->request->getRawBody() )  ){
        $row_data = $app->request->getRawBody();
        $data     = json_decode( $row_data, true);
        $request  = array(
            'data'      => $data, // Параметры запроса.
            'module'    => $data['uniqid'], // Параметры запроса.
            'action'    => $command  // Операция.
        );
        $client = new Nats\Connection();
        $client->connect(5);
        $cb = function (Nats\Message $message) use ($app) {
            $app->response->setStatusCode(200, "OK")->sendHeaders();
            $app->response->setContent(''.$message->getBody());
            $app->response->send();
            exit(0);
        };
        $client->request('modules', json_encode($request), $cb);
    }

    $app->response->setContent(json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    $app->response->send();
    return;
});

/**
 * Получить список подключенных дисков к ПК.
 * curl http://172.16.156.212/pbxcore/api/storage/list
 */
$app->get('/api/storage/{name}', function ($name) use ($app) {
    $request = array(
        'data'   => $_REQUEST,
        'action' => $name
    );
    $client = new Nats\Connection();
    $client->connect(10);
    $cb = function (Nats\Message $message) use ($name, $app) {
        $app->response->setStatusCode(200, "OK")->sendHeaders();
        $app->response->setContent($message->getBody());
        $app->response->send();
    };
    $client->request('storage', json_encode($request), $cb);
});

/**
 * Монтируем диск:
 *   curl -X POST -d '{"dev":"/dev/sdc1","format":"ext2","dir":"/tmp/123"}' http://172.16.156.212/pbxcore/api/storage/mount;
 * Размонтируем диск:
 *   curl -X POST -d '{"dir":"/tmp/123"}' http://172.16.156.212/pbxcore/api/storage/umount;
 * Форматируем диск в ext2. Форматирование осуществляется в фоне.
 *   curl -X POST -d '{"dev":"/dev/sdc"}' http://172.16.156.212/pbxcore/api/storage/mkfs;
 * Получаем статус форматирования диска:
 *   curl -X POST -d '{"dev":"/dev/sdc"}' http://172.16.156.212/pbxcore/api/storage/status_mkfs;
 *   'ended' / 'inprogress'
 */
$app->post('/api/storage/{name}', function ($name)use ($app){
    $row_data = $app->request->getRawBody();
    // Проверим, переданные данные.
    if(!Util::is_json($row_data)){
        $app->response->setStatusCode(200, "OK")->sendHeaders();
        $app->response->setContent('{"result":"ERROR"}');
        $app->response->send();
        return;
    }
    $data = json_decode( $row_data, true);
    $request = array(
        'data'      => $data, // Параметры запроса.
        'action'    => $name  // Операция.
    );

    $client = new Nats\Connection();
    $client->connect(10);
    $cb = function (Nats\Message $message) use ($app) {
        $app->response->setStatusCode(200, "OK")->sendHeaders();
        $app->response->setContent(''.$message->getBody());
        $app->response->send();
    };

    $client->request('storage', json_encode($request), $cb);
});

/**
 * Обработка не корректного запроса.
 */
$app->notFound(function () use ($app) {
    sleep(2);
    $app->response->setStatusCode(404, "Not Found")->sendHeaders();
    $app->response->setContent('This is crazy, but this page was not found!');
    $app->response->send();
});

try{
    $app->handle();
}catch( Nats\Exception $e){
    Util::sys_log_msg('pbx_core_api', $e->getMessage() );
    // Если произошло исключение, то NATS скорее всего не запущен.
    $response = [
        'result'  => 'ERROR',
        'message' => 'NATS not started...'
    ];
    $msg = json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    $app->response->setContent($msg);
    $app->response->send();
}


