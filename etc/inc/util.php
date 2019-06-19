<?php
/**
 * Copyright © MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Alexey Portnov, 6 2019
 */

require_once 'globals.php';

/**
* Вспомогательные методы. 
*/
class Util {

    /**
     * Выполняет системную команду exec().
     * @param      $command
     * @param null $oarr
     * @param null $retval
     * @return int|null
     */
    static function mwexec($command, &$oarr = null, &$retval=null){
		global $g;
		$retval = 0;
		$oarr	= array();

		if ($g['debug']) {
			echo "mwexec(): $command\n";
		} else {
			exec("$command 2>&1", $oarr, $retval);
		}
		
		return $retval; 
    }

    /**
     * Выполняет системную команду exec() в фоне.
     * @param $command
     */
    static function mwexec_bg($command){
		global $g;
		if ($g['debug']) {
			echo "mwexec_bg(): $command\n";
			return;
		}
		exec("nohup $command > /dev/null 2>&1 &");
    }

    /**
     * Выполняет системную команду exec() в фоне.
     * @param        $command
     * @param int    $timeout
     * @param string $logname
     */
    static function mwexec_bg_timeout($command, $timeout = 4, $logname='/dev/null'){
        global $g;
        if ($g['debug']) {
            echo "mwexec_bg(): $command\n";
            return;
        }
        exec("nohup timeout -t {$timeout} $command > {$logname} 2>&1 &");
    }

    /**
     * Завершаем процесс по имени.
     * @param $procname
     * @return int|null
     */
	static function killbyname($procname) {
		return Util::mwexec("busybox killall ".escapeshellarg($procname));
	}

    /**
     * Завершает запись логов.
     * @return string
     */
    static function stop_log(){
        $dir_all_log = Util::get_log_dir();
        Util::killbyname('timeout');
        $dirlog = $dir_all_log.'/dir_start_all_log';
        if(!is_dir($dirlog)){
            mkdir($dirlog, 0777, true);
        }
        /**
         * В коммент. Слишком большой размер логов не возможно скачать.
        if(is_dir("{$dir_all_log}/nats")){
            Util::mwexec("cp -R {$dir_all_log}/nats $dirlog");
            if(is_file("$dirlog/nats/license.key"))
                unlink("$dirlog/nats/license.key");
        }
        */
        $result = $dir_all_log.'/arhive_start_all_log.tar.gz';
        // Пакуем логи.
        Util::mwexec('find '.$dir_all_log.'/ -name *_start_all_log | xargs tar -zcf '.$result);
        // Удаляем логи. Оставляем только архив.
        Util::mwexec('find '.$dir_all_log.'/ -name *_start_all_log | xargs rm -rf');
        // Удаляем каталог логов.
        Util::mwexec_bg("rm -rf $dirlog");

        return $result;
    }

    /**
     * Стартует запись логов.
     * @param int $timeout
     */
    static function start_log($timeout=300){
        Util::stop_log();
        $dir_all_log = Util::get_log_dir();
	    Util::mwexec('find '.$dir_all_log.'/ -name *_start_all_log* | xargs rm -rf');
	    // Получим каталог с логами.
        $dirlog = $dir_all_log.'/dir_start_all_log';
        if(!is_dir($dirlog)){
            mkdir($dirlog, 0777, true);
        }
        Util::mwexec_bg_timeout("logread -f", $timeout, "{$dirlog}/logread_f.log");
        Util::mwexec_bg_timeout("ping 8.8.8.8", $timeout, "{$dirlog}/ping_8888.log");
        Util::mwexec_bg_timeout("ping ya.ru", $timeout, "{$dirlog}/ping_ya_ru.log");
        Util::mwexec_bg_timeout("ping lic.miko.ru", $timeout, "{$dirlog}/ping_lic_miko_ru.log");
        Util::mwexec_bg_timeout("openssl s_client -connect lm.miko.ru:443", $timeout, "{$dirlog}/openssl_lm_miko_ru.log");
        Util::mwexec_bg_timeout("openssl s_client -connect lic.miko.ru:443", $timeout, "{$dirlog}/openssl_lic_miko_ru.log");
        Util::mwexec_bg_timeout("logread", $timeout, "{$dirlog}/logread.log");
        Util::mwexec_bg_timeout("route -n", $timeout, "{$dirlog}/rout_n.log");
        Util::mwexec_bg_timeout("asterisk -rx 'sip show settings'", $timeout, "{$dirlog}/sip_show_settings.log");
        Util::mwexec_bg_timeout("asterisk -rx 'sip show peers'", $timeout, "{$dirlog}/sip_show_peers.log");
        Util::mwexec_bg_timeout("asterisk -rx 'sip show registry'", $timeout, "{$dirlog}/sip_show_registry.log");

        Util::mwexec("cp /var/log/php_error.log $dirlog");

        $network = new Network();
        $arr_eth = $network->get_interface_names();
        foreach ($arr_eth as $eth){
            Util::mwexec_bg_timeout("tcpdump -i $eth -n -s 0 -vvv -w {$dirlog}/{$eth}.pcap", $timeout, "{$dirlog}/{$eth}_out.log");
        }
    }

    /**
     * Выполнение нескольких команд.
     * @param        $arr_cmds
     * @param null   $out
     * @param string $logname
     */
	static function mwexec_commands($arr_cmds, &$out = null, $logname = ''){
        $out = array();
		foreach ($arr_cmds as $cmd){
            $out[] = "$cmd;";
            $out_cmd = array();
			Util::mwexec($cmd,$out_cmd);
            $out = array_merge($out, $out_cmd);
		}

		if($logname != ''){
            $result = implode("\n", $out);
            file_put_contents("/tmp/{$logname}_commands.log", $result);
        }
	}

    /**
     * Форматирует JSON в читабельный вид.
     * @param $json
     * @return string
     */
	static function json_indent($json) {
	
	    $result      = '';
	    $pos         = 0;
	    $strLen      = strlen($json);
	    $indentStr   = '  ';
	    $newLine     = "\n";
	    $prevChar    = '';
	    $outOfQuotes = true;
	
	    for ($i=0; $i<=$strLen; $i++) {
	
	        // Grab the next character in the string.
	        $char = substr($json, $i, 1);
	
	        // Are we inside a quoted string?
	        if ($char == '"' && $prevChar != '\\') {
	            $outOfQuotes = !$outOfQuotes;
	
	        // If this character is the end of an element,
	        // output a new line and indent the next line.
	        } else if(($char == '}' || $char == ']') && $outOfQuotes) {
	            $result .= $newLine;
	            $pos --;
	            for ($j=0; $j<$pos; $j++) {
	                $result .= $indentStr;
	            }
	        }
	
	        // Add the character to the result string.
	        $result .= $char;
	
	        // If the last character was the beginning of an element,
	        // output a new line and indent the next line.
	        if (($char == ',' || $char == '{' || $char == '[') && $outOfQuotes) {
	            $result .= $newLine;
	            if ($char == '{' || $char == '[') {
	                $pos ++;
	            }
	
	            for ($j = 0; $j < $pos; $j++) {
	                $result .= $indentStr;
	            }
	        }
	
	        $prevChar = $char;
	    }
	
	    return $result;
	}
	
	// TODO / Возвращает путь к исполняемому файлу.
	static function which($v){
		return $v;
	}

    /**
     * Возвращает PID процесса по его имени.
     * @param        $name
     * @param string $exclude
     * @return string
     */
	static function get_pid_process($name, $exclude=''){
        $path_ps    = Util::which('ps');
        $path_grep  = Util::which('grep');
        $path_awk 	= Util::which('awk');

        $filter_cmd = '';
        if(!empty($exclude)){
            $filter_cmd = "| $path_grep -v ".escapeshellarg($exclude);
        }

        $out = array();
        Util::mwexec("$path_ps -A -o 'pid,args' {$filter_cmd} | $path_grep '$name' | $path_grep -v grep | $path_awk ' {print $1} '", $out);
        $WorkerPID = trim(implode(' ', $out));

        return $WorkerPID;
    }

    /**
     * Управление процессом / демоном.
     * Получние информации по статусу процесса.
     * @param $cmd
     * @param $param
     * @param $proc_name
     * @param $action
     * @return array | bool
     */
	static function process_worker($cmd, $param, $proc_name, $action){
		$out_file = '/dev/null';
		$path_kill  = Util::which('kill');
		$path_nohup = Util::which('nohup');

		if(!empty($param)){
		    $proc_str = $cmd." ".trim($param);
        }else{
            $proc_str = $proc_name;
        }
		$WorkerPID = Util::get_pid_process($proc_str);

		if('status' == $action ){
			$status = ("$WorkerPID" != '') ? "Started" : "Stoped";
			return array('status' => $status, 'app' => $proc_name, 'PID' => $WorkerPID);
		}
		$out = array();
		if("$WorkerPID" != '' && ('stop' == $action || 'restart' == $action) ){
			Util::mwexec("$path_kill -9 $WorkerPID  > /dev/null 2>&1 &", $out);
			$WorkerPID = '';
		}
		
		if("$WorkerPID" == '' && ('start' == $action || 'restart' == $action) ){
			Util::mwexec("$path_nohup $cmd $param  > $out_file 2>&1 &", $out);
			usleep(500000);
		}

		return true;
	}

    /**
     * Рестарт рабочего процесса конкретного скрипта из ' /etc/inc/workers/'.
     * @param        $name
     * @param string $param
     */
	static function restart_worker($name, $param=''){
        $command = "php -f {$GLOBALS['g']['pt1c_inc_path']}/workers/{$name}.php";
        Util::process_worker("$command","$param", "$name", 'restart');
    }

    /**
     * Генератор произвольной строки.
     * @param int $length
     * @return string
     */
	static function generateRandomString($length = 10) {
	    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	    $charactersLength = strlen($characters);
	    $randomString = '';
	    for ($i = 0; $i < $length; $i++) {
	        $randomString .= $characters[rand(0, $charactersLength - 1)];
	    }
	    return $randomString;
	}

	/**
     * Получаем объект менеджер asterisk.
     * @param string $events
     * @return AGI_AsteriskManager
     */
	public function get_am_p($events='on'){
        return Util::get_am($events);
    }
    /**
     * Получаем объект менеджер asterisk.
     * @param string $events
     * @return AGI_AsteriskManager
     */
    static function get_am($events='on'){
        global $g;
        require_once 'phpagi.php';
        if(isset($g['AGI_AsteriskManager'])){
            /** @var AGI_AsteriskManager $am */
            $am = $g['AGI_AsteriskManager'];
            // Проверка на разрыв соединения.
            if(is_resource($am->socket)){
                $res = $am->send_request_timeout('Ping');
                if(isset($res['Response']) && trim($res['Response']) != ''){
                    // Уже есть подключенный экземпляр класса.
                    return $am;
                }
            }else{
                unset($g['AGI_AsteriskManager']);
            }
        }
        $config = new Config();
        $port   = $config->get_general_settings('AMIPort');

        $am     = new AGI_AsteriskManager();
        $res    = $am->connect("127.0.0.1:{$port}",NULL,NULL, $events);
        if(true == $res){
            $g['AGI_AsteriskManager'] = $am;
        }
        return $am;
    }

    /**
     * Инициация телефонного звонка.
     * @param string $peer_number
     * @param string $peer_mobile
     * @param string $dest_number
     * @return array
     */
    static function am_originate($peer_number, $peer_mobile, $dest_number){
        /** @var AGI_AsteriskManager $am */
        $am = Util::get_am('off');
        $channel     = 'Local/'.$peer_number.'@internal-originate';
        $context     = 'all_peers';
        $IS_ORGNT    = Util::generateRandomString();
        $variable    = "_IS_ORGNT={$IS_ORGNT},pt1c_cid={$dest_number},_extenfrom1c={$peer_number},__peer_mobile={$peer_mobile},_FROM_PEER={$peer_number}";

        $result = $am->Originate($channel, $dest_number, $context, '1', NULL, NULL, NULL, NULL, $variable, NULL, '1');
        return $result;
    }

    /**
     * Валидация JSON.
     * @param $string
     * @return bool
     */
    static function is_json($string){
        $re = '/
  (?(DEFINE)
     (?<number>   -? (?= [1-9]|0(?!\d) ) \d+ (\.\d+)? ([eE] [+-]? \d+)? )    
     (?<boolean>   true | false | null )
     (?<string>    " ([^"\\\\\\\\]* | \\\\\\\\ ["\\\\\\\\bfnrt\/] | \\\\\\\\ u [0-9a-f]{4} )* " )
     (?<array>     \[  (?:  (?&json)  (?: , (?&json)  )*  )?  \s* \] )
     (?<pair>      \s* (?&string) \s* : (?&json)  )
     (?<object>    \{  (?:  (?&pair)  (?: , (?&pair)  )*  )?  \s* \} )
     (?<json>   \s* (?: (?&number) | (?&boolean) | (?&string) | (?&array) | (?&object) ) \s* )
  )
  \A (?&json) \Z
  /six';

        preg_match($re, $string, $matches, PREG_OFFSET_CAPTURE, 0);
        return (count($matches)>0);
    }

    /**
     * Проверка авторизации.
     * @param Phalcon\Http\Request $request
     * @return bool
     */
    static function check_auth_http($request){
        $result = false;
        $userName = $request->getServer('PHP_AUTH_USER');
        $password = $request->getServer('PHP_AUTH_PW');

        $data = file_get_contents('/var/etc/http_auth');
        if("$data" == "{$userName}:{$password}"){
            $result = true;
        }else{
            openlog("miko_ajam", LOG_PID | LOG_PERROR, LOG_AUTH);
            syslog(LOG_WARNING, "From {$_SERVER['REMOTE_ADDR']}. UserAgent: ({$_SERVER['HTTP_USER_AGENT']}). Fail auth http.");
            closelog();
        }

        return $result;
    }

    /**
     * Возвращает указанное количество X.
     * @param $length
     * @return string
     */
    static function get_extension_X($length){
        $extension = '';
        for ($i = 0; $i < $length; $i++) {
            $extension .= 'X';
        }
        return $extension;
    }

    /**
     * Проверяет существование файла.
     * @param $filename
     * @return bool
     */
    static function rec_file_exists($filename){
        if (file_exists($filename) && filesize($filename)>0)
            return true;
        else
            return false;
    }

    /**
     * Добавить сообщение в Syslog.
     * @param     $log_name
     * @param     $text
     * @param int $level
     */
    static function sys_log_msg($log_name, $text, $level=null){
        $level = ($level==null)?LOG_WARNING:$level;
        openlog("$log_name", LOG_PID | LOG_PERROR, LOG_AUTH);
        syslog($level, "$text");
        closelog();
    }

    /**
     * Если переданный параметр - число, то будет возвращена дата.
     * @param $data
     * @return string
     */
    static function number_to_date($data){
        $re_number = '/^\d+.\d+$/';
        preg_match_all($re_number, $data, $matches, PREG_SET_ORDER, 0);
        if(count($matches)>0){
            $data = date('Y.m.d-H:i:s', $data);
        }
        return $data;
    }

    /**
     * Удаляет расширение файла.
     * @param        $filename
     * @param string $delimiter
     * @return string
     */
    static function trim_extension_file($filename, $delimiter='.'){
        // Отсечем расширение файла.
        $tmp_arr = explode("$delimiter", $filename);
        if(count($tmp_arr)>1){
            unset($tmp_arr[count($tmp_arr)-1]);
            $filename = implode("$delimiter", $tmp_arr);
        }
        return $filename;
    }

    /**
     * Получает расширение файла.
     * @param        $filename
     * @param string $delimiter
     * @return mixed
     */
    static function get_extension_file($filename, $delimiter='.'){
        $tmp_arr = explode("$delimiter", $filename);
        $extension = $tmp_arr[count($tmp_arr) - 1];
        return $extension;
    }
        /**
     * Записывает данные в файл.
     * @param $filename
     * @param $data
     */
    static function file_write_content($filename, $data){
        /** @var Models\CustomFiles $res */
        $res = Models\CustomFiles::findFirst("filepath = '{$filename}'");
        $only_append = false;


        $filename_orgn = "{$filename}.orgn";
        if( ($res == null || $res->mode == 'none') && file_exists($filename_orgn)){
            unlink($filename_orgn);
        }
        if($res->mode != 'none'){
            // Запишем оригинальный файл.
            file_put_contents($filename_orgn, $data);
        }
        if('/var/spool/cron/crontabs/root' == $filename){
            // Исключение из правил. Нельзя переопределить.
            $only_append = true;
        }
        if($res == null){
            // Файл еще не зарегистрирован в базе. Сделаем это.
            $res = new Models\CustomFiles();
            $res->writeAttribute("filepath",   $filename);
            $res->writeAttribute("mode",       'none');
            $res->save();
        }else if($res->mode == 'append'){
            // Добавить к файлу.
            $data .= "\n\n";
            $data .= base64_decode($res->content);
        }else if($only_append && $res->mode == 'override'){
            // Добавить к файлу.
            $data .= "\n\n";
            $data .= base64_decode($res->content);
        }else if($res->mode == 'override'){
            // Переопределить файл.
            $data  = base64_decode($res->content);
        }
        file_put_contents($filename, $data);
    }

    /**
     * Считывает содержимое файла, если есть разрешение.
     * @param $filename
     * @return array
     */
    static function file_read_content($filename){
        $result = array();
        $res = Models\CustomFiles::findFirst("filepath = '{$filename}'");
        if($res == null){
            $result['result'] = 'ERROR';
            $result['data']   = '';
            $result['message']= 'There is no access to the file';
        }else{
            $filename_orgn = "{$filename}.orgn";
            if(file_exists($filename_orgn)){
                $filename = $filename_orgn;
            }
            $result['result'] = 'Success';
            $result['data']   = rawurlencode(file_get_contents($filename));
        }
        return $result;
    }

    /**
     * Смена владельца файла.
     * @param $filename
     * @param $user
     */
    static function chown($filename, $user){
        if(file_exists($filename)){
            chown($filename, $user);
            chgrp($filename, $user);
        }
    }

    /**
     * Создаем базу данных для логов, если требуется.
     */
    static function CreateLogDB(){
        $db_path = dirname(Cdr::getPathToDB()).'/events_log.db';
        $table_name = 'call_events';
        $db = new Phalcon\Db\Adapter\Pdo\Sqlite(['dbname' => $db_path]);
        if(!$db->tableExists($table_name)){
            $type_str = ['type' => Phalcon\Db\Column::TYPE_TEXT,    'default' => ''];
            $type_key = ['type' => Phalcon\Db\Column::TYPE_INTEGER, 'notNull' => true, 'autoIncrement' => true, 'primary'=> true];

            $columns = [
                new Phalcon\Db\Column('id',        $type_key),
                new Phalcon\Db\Column('eventtime', $type_str),
                new Phalcon\Db\Column('app',       $type_str),
                new Phalcon\Db\Column('linkedid',  $type_str),
                new Phalcon\Db\Column('datajson',  $type_str),
            ];
            $result = $db->createTable( $table_name, null, ['columns' => $columns ]);
            if(!$result){
                Util::sys_log_msg('CreateLogDB', 'Can not create db '. $table_name);
                return;
            }
        }

        $index_names = [
            'eventtime' => 1,
            'linkedid'  => 1,
            'app'       => 1
        ];

        $index_q = "SELECT"." name FROM sqlite_master WHERE type='index' AND tbl_name='$table_name'";
        $indexes = $db->query($index_q)->fetchAll();
        foreach ($indexes as $index_data){
            if(key_exists($index_data['name'], $index_names)){
                unset($index_names[$index_data['name']]);
            }
        }
        foreach ($index_names as $index_name => $value){
            $q = "CREATE"." INDEX IF NOT EXISTS i_call_events_{$index_name} ON {$table_name} ({$index_name})";
            $result = $db->query($q);
            if(!$result){
                Util::sys_log_msg('CreateLogDB', 'Can not create index '. $index_name);
                return;
            }
        }
    }

    /**
     * @param string   $id
     * @param SQLite3 $db
     * @return array
     */
    static function GetLastDateLogDB($id, &$db=null){
        if($db==null){
            $cdr_db_path = dirname(Cdr::getPathToDB()).'/events_log.db';
            $db = new SQLite3($cdr_db_path);
        }
        $db->busyTimeout(5000);
        $eventtime = null;

        $q = 'SELECT'.' MAX(eventtime) AS eventtime FROM call_events WHERE linkedid="'.$id.'" GROUP BY linkedid';
        $result = $db->query($q);
        $row = $result->fetchArray(SQLITE3_ASSOC);
        if($row){
            $eventtime = $row['eventtime'];
        }

        return $eventtime;

    }

    /**
     * Пишем лог в базу данных.
     * @param $app
     * @param $data_obj
     */
    static function log_msg_db($app, $data_obj){
        try{
            $data = new Models\CallEventsLogs();
            $data->writeAttribute('eventtime',   date("Y-m-d H:i:s"));
            $data->writeAttribute('app', $app);
            $data->writeAttribute('datajson', json_encode($data_obj, JSON_UNESCAPED_SLASHES));

            if(is_array($data_obj) && isset($data_obj['linkedid'])){
                $data->writeAttribute('linkedid', $data_obj['linkedid']);
            }
            $data->save();
        }catch (Exception $e){
            Util::sys_log_msg('log_msg_db', $e->getMessage());
        }

    }

    /**
     *
     * @return string
     */
    static function get_log_dir(){
        global $g;
        if( Storage::is_storage_disk_mounted() ){
            $mountpoint = Storage::get_media_dir();
            $logdir = "$mountpoint/{$g['pt1c_pbx_name']}/astlogs/asterisk";
        }else{
            $logdir = "/var/asterisk/log";
        }

        return $logdir;
    }

    /**
     * Возвращает текущую дату в виде строки с точностью до милисекунд.
     * @return string
     */
    static function get_now_date(){
        $result = null;
        try{
            $d = new DateTime();
            $result = $d->format("Y-m-d H:i:s.v");
        }catch (Exception $e){
            unset($e);
        }
        return $result;
    }

    /**
     * Выводить текстовое сообщение "done" подсвечивает зеленым цветом.
     */
    public function echo_green_done(){
        echo "\033[32;1mdone\033[0m \n";
    }

    /**
     * Удаление файла.
     * @param $filename
     * @return array
     */
    static function remove_audio_file($filename){
        $result = [];
        $extension = Util::get_extension_file($filename);
        if(!in_array($extension, ['mp3', 'wav'])){
            $result['result']  = 'Error';
            $result['message'] = "It is forbidden to remove the file $extension.";
            return $result;
        }

        if(!file_exists($filename)){
            $result['result']  = 'Success';
            $result['message'] = "File '{$filename}' not found.";
            return $result;
        }

        $out = [];

        $n_filename    = Util::trim_extension_file($filename).".wav";
        $n_filename_mp3= Util::trim_extension_file($filename).".mp3";

        Util::mwexec("rm -rf ".escapeshellarg($n_filename).' '.escapeshellarg($n_filename_mp3), $out);
        // Чистим мусор.
        if(file_exists($filename)){
            $result_str   = implode($out);
            // Ошибка выполнения конвертации.
            $result['result']  = 'Error';
            $result['message'] = $result_str;
            return $result;
        }
        $result = [
            'result'    => 'Success',
        ];
        return $result;
    }

    /**
     * Конвертация файла в wav 8000.
     * @param $filename
     * @return mixed
     */
    static function convert_audio_file($filename){
        $result = [];
        if(!file_exists($filename)){
            $result['result']  = 'Error';
            $result['message'] = "File '{$filename}' not found.";
            return $result;
        }
        $out = [];
        $tmp_filename = '/tmp/'.time()."_".basename($filename);
        if(FALSE == copy($filename, $tmp_filename)){
            $result['result']  = 'Error';
            $result['message'] = "Unable to create temporary file '{$tmp_filename}'.";
            return $result;
        }

        // Принудительно устанавливаем расширение файла в wav.
        $n_filename    = Util::trim_extension_file($filename).".wav";
        $n_filename_mp3= Util::trim_extension_file($filename).".mp3";
        // Конвертируем файл.
        $tmp_filename  = escapeshellcmd($tmp_filename);
        $n_filename    = escapeshellcmd($n_filename);
        Util::mwexec("/usr/bin/sox -v 0.99 -G '{$tmp_filename}' -c 1 -r 8000 -b 16 '{$n_filename}'",$out);
        $result_str    = implode('', $out);

        Util::mwexec("/usr/bin/lame -b 32 --silent '{$n_filename}' '{$n_filename_mp3}'",$out);
        $result_mp3    = implode('', $out);

        // Чистим мусор.
        unlink($tmp_filename);
        if($result_str != '' && $result_mp3 != ''){
            // Ошибка выполнения конвертации.
            $result['result']  = 'Error';
            $result['message'] = $result_str;
            return $result;
        }

        if($filename != $n_filename && $filename != $n_filename_mp3){
            @unlink($filename);
        }

        $result = [
            'result'    => 'Success',
            'filename'  => "$n_filename_mp3"
        ];
        return $result;
    }

    /**
     * Получаем размер файла / директории.
     * @param $filename
     * @return int
     */
    static function get_size_file($filename){
        $result = 0;
        if(file_exists($filename)){
            Util::mwexec("du -d 0 -k '{$filename}' | /usr/bin/awk  '{ print $1}'",$out);
            $time_str = implode($out);
            preg_match_all('/^\d+$/', $time_str, $matches, PREG_SET_ORDER, 0);
            if(count($matches)>0){
                $result = round(1*$time_str/1024, 2);
            }
        }
        return $result;
    }

    /**
     * Устанавливаем шривт для консоли.
     */
    static function set_cyrillic_font(){
        Util::mwexec("/usr/sbin/setfont /usr/share/consolefonts/Cyr_a8x16.psfu.gz 2>/dev/null");
    }


    /**
     * Получить перевод строки текста.
     * @param $text
     * @return mixed
     */
    static function translate($text){
        global $g;
        $result = $text;
        if(isset($g['cli_translation'])){
            /** @var Phalcon\Translate\Adapter\NativeArray $cli_translation */
            $cli_translation = &$g['cli_translation'];
            $result = $cli_translation->_("$text");
        }
        return $result;
    }
    /**
     * Добавляем задачу для уведомлений.
     * @param string $queue
     * @param        $data
     */
    public function add_job_to_beanstalk($queue, $data){
        $queue  = new BeanstalkClient("{$queue}");
        $queue->publish($data);
    }

    /**
     * Создает ряд рабочих каталогов / директорий.
     * @return array
     */
    public function create_work_dirs(){
        $path2dirs = PBX::get_asterisk_dirs();

        $path = '';
        foreach ($path2dirs as $key => $value){
            if(file_exists($value)){
                continue;
            }
            $path.= " $value";
        }
        if(!empty($path)){
            Util::mwexec("mkdir -p $path");
        }

        $www_dirs = [
            $path2dirs['media'],
            $path2dirs['backup'],
            $path2dirs['tmp'],
            $path2dirs['php_session'],
            $path2dirs['cache_js_dir'],
            $path2dirs['cache_css_dir'],
            $path2dirs['cache_img_dir'],
            $path2dirs['custom_modules'],
            $path2dirs['download_link']
        ];
        // Предоставим права на директории www.
        Util::mwexec("chown -R www:www ".implode(' ', $www_dirs));

        $res = Util::create_update_link($path2dirs['cache_js_dir'],  '/var/cache/www/admin-cabinet/cache/js');
        $res = $res | Util::create_update_link($path2dirs['cache_css_dir'], '/var/cache/www/admin-cabinet/cache/css');
        $res = $res | Util::create_update_link($path2dirs['cache_img_dir'], '/var/cache/www/admin-cabinet/cache/img');
        $res = $res | Util::create_update_link($path2dirs['php_session'],   '/var/lib/php/session');

        $storage_disk_mounted = Storage::is_storage_disk_mounted();
        if($storage_disk_mounted && file_exists('/cf/conf/need_clean_cashe_www')){
            $cashe_dirs = [
                $path2dirs['cache_js_dir']."/*",
                $path2dirs['cache_css_dir']."/*",
                $path2dirs['cache_img_dir']."/*",
                $path2dirs['php_session']."/*",
                $GLOBALS['g']['phalcon_settings']['application']['cacheDir']."*",
            ];

            Util::mwexec("rm -rf ".implode(' ', $cashe_dirs));
            unlink('/cf/conf/need_clean_cashe_www');
        }

        if($storage_disk_mounted){
            // Проверим подключены ли модули.
            /** @var Models\PbxExtensionModules $modules */
            $modules = Models\PbxExtensionModules::find();
            foreach ($modules as $module){
                if(! is_dir( "{$path2dirs['custom_modules']}/{$module->uniqid}" )){
                    // Модуль не установлен... Нужно дать возможность переустановить модуль.
                    // Чистим запись об установленном модуле:
                    $modules->delete();
                }
            }
        }

        if($res){
            $cacheDir = $GLOBALS['g']['phalcon_settings']['application']['cacheDir'];
            Util::mwexec("rm -rf {$cacheDir}/*");
        }

        return $path2dirs;
    }

    /**
     * Создание символической ссылки, если необходимо.
     * @param $target
     * @param $link
     * @return bool
     */
    static function create_update_link($target, $link){
        $need_create_link = true;
        if(is_link($link)){
            $old_target = readlink($link);
            $need_create_link = ($old_target != $target);
            // Если необходимо, удаляем старую ссылку.
            if($need_create_link){
                Util::mwexec("cp {$old_target}/* {$target}");
                unlink($link);
            }
        }elseif (is_dir($link)){
            // Это должна быть именно ссылка. Файл удаляем.
            rmdir($link);
        }elseif (file_exists($link)){
            // Это должна быть именно ссылка. Файл удаляем.
            unlink($link);
        }
        if($need_create_link){
            Util::mwexec("ln -s {$target}  {$link}");
        }

        return $need_create_link;
    }


    /**
     * Генерация сертификата средствами openssl.
     * @param null $options
     * @param null $config_args_pkey
     * @param null $config_args_csr
     * @return array
     */
    static function generate_ssl_sert($options=null, $config_args_pkey = null, $config_args_csr=null){
        // Инициализация настроек.
        if(!$options){
            $options = [
                "countryName"           => 'RU',
                "stateOrProvinceName"   => 'Moscow',
                "localityName"          => 'Zelenograd',
                "organizationName"      => 'MIKO LLC',
                "organizationalUnitName"=> 'Software development',
                "commonName"            => 'MIKO PBX',
                "emailAddress"          => 'info@miko.ru'
            ];
        }

        if(!$config_args_csr){
            $config_args_csr = ['digest_alg' => 'sha256'];
        }

        if(!$config_args_pkey){
            $config_args_pkey = [
                "private_key_bits" => 2048,
                "private_key_type" => OPENSSL_KEYTYPE_RSA,
            ];
        }

        // Генерация ключей.
        $private_key = openssl_pkey_new($config_args_pkey);
        $csr         = openssl_csr_new($options, $private_key, $config_args_csr);
        $x509        = openssl_csr_sign($csr, null, $private_key, $days=3650, $config_args_csr);

        // Экспорт ключей.
        openssl_x509_export($x509,      $certout);
        openssl_pkey_export($private_key, $pkeyout);
        // echo $pkeyout; // -> WEBHTTPSPrivateKey
        // echo $certout; // -> WEBHTTPSPublicKey
        return ['PublicKey' => $certout, 'PrivateKey' => $pkeyout];
    }
}