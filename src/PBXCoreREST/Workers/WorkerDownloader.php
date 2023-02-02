<?php
/*
 * MikoPBX - free phone system for small business
 * Copyright (C) 2017-2020 Alexey Portnov and Nikolay Beketov
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program.
 * If not, see <https://www.gnu.org/licenses/>.
 */

namespace MikoPBX\PBXCoreREST\Workers;

require_once 'Globals.php';

use MikoPBX\Core\Workers\WorkerBase;
use MikoPBX\Core\System\Util;
use GuzzleHttp;
use GuzzleHttp\Exception\GuzzleException;
use Psr\Http\Message\ResponseInterface;


class WorkerDownloader extends WorkerBase
{
    private string $old_memory_limit;
    private int $progress = 0;
    private array $settings;
    private string $progress_file = '';
    private string $error_file = '';
    private int $file_size = 0;
    private int $lastUpdate = 0;
    private int $httpCode = 0;

    /**
     * WorkerDownloader entry point.
     *
     * @param $params
     */
    public function start($params): void
    {
        $this->lastUpdate=time();
        $this->old_memory_limit = ini_get('memory_limit');
        $filename = $params[2]??'';
        if (file_exists($filename)) {
            $this->settings = json_decode(file_get_contents($filename), true);
        } else {
            Util::sysLogMsg(__CLASS__, 'Wrong download settings', LOG_ERR);
            return;
        }
        ini_set('memory_limit', '300M');

        $temp_dir            = dirname($this->settings['res_file']);
        $this->progress_file = $temp_dir . '/progress';
        $this->error_file    = $temp_dir . '/error';

        $result = $this->getFile();
        $result = $result && $this->checkFile();
        if ( ! $result) {
            Util::sysLogMsg(__CLASS__, 'Download error...', LOG_ERR);
        }
    }

    /**
     * Downloads file from remote resource by link
     */
    public function getFile(): bool
    {
        if (empty($this->settings)) {
            return false;
        }
        if (file_exists($this->settings['res_file'])) {
            unlink($this->settings['res_file']);
        }
        if (isset($this->settings['size'])){
            $this->file_size = $this->settings['size'];
        } else {
            $this->file_size = $this->remoteFileSize($this->settings['url']);
        }

        file_put_contents($this->progress_file, 0);
        $curl = new GuzzleHttp\Handler\CurlMultiHandler();
        $handler = GuzzleHttp\HandlerStack::create($curl);
        $client = new GuzzleHttp\Client();
        $promise = $client->getAsync($this->settings['url'], [
            'handler' => $handler,
            'sink'     => $this->settings['res_file'],
            'progress' =>  [$this, 'progress'],
            'connect_timeout' => 5
        ]);
        $promise->then(
            function (ResponseInterface $res) {
                $this->httpCode = $res->getStatusCode();
            },
            function (GuzzleHttp\Exception\RequestException $e) {
                file_put_contents($this->error_file, $e->getMessage(), FILE_APPEND);
                $this->httpCode = -1;
            }
        );
        while ($promise->getState() === 'pending'){
            $curl->tick();
            if(time() - $this->lastUpdate > 30){
                $this->httpCode = -1;
                file_put_contents($this->error_file, 'Fail download file... No progress for more than 30 seconds.', FILE_APPEND);
                break;
            }
        }
        if ($this->httpCode !== 200) {
            file_put_contents($this->error_file, "Curl return code $this->httpCode. ", FILE_APPEND);
        }

        return $this->httpCode === 200;
    }

    public function progress( $downloadTotal, $downloadedBytes, $uploadTotal, $uploadedBytes) :void
    {
        if ($downloadedBytes === 0) {
            return;
        }
        $this->lastUpdate = time();
        if ($this->file_size < 0) {
            $new_progress = $downloadedBytes / $downloadTotal * 100;
        } else {
            $new_progress = $downloadedBytes / $this->file_size * 100;
        }
        $delta = $new_progress - $this->progress;
        if ($delta > 1) {
            // Лимит на работу скрипта. Чтобы исключить "Зависание".
            // Если нет прогресса, то завершать работу.
            $this->progress = round($new_progress);
            $this->progress = min($this->progress, 99);
            file_put_contents($this->progress_file, $this->progress);
        }
    }

    /**
     * Remote File Size Using cURL
     *
     * @param string $url
     *
     * @return int
     */
    private function remoteFileSize(string $url): int
    {
        $fileSize = -1;
        try{
            $client    = new GuzzleHttp\Client();
            $response  = $client->head($url, ['connect_timeout' => 5]);
            $fileSize  = $response->getHeader('Content-Length')[0];
        }catch ( GuzzleException  $e){
            file_put_contents($this->error_file, $e->getMessage(), FILE_APPEND);
        }
        return $fileSize;
    }

    /**
     * Checks file md5 sum and size
     */
    public function checkFile(): bool
    {
        $result = true;
        if ( ! file_exists($this->settings['res_file'])) {
            file_put_contents($this->error_file, 'File did not upload', FILE_APPEND);
            return false;
        }
        if (md5_file($this->settings['res_file']) !== $this->settings['md5']) {
            unlink($this->settings['res_file']);
            file_put_contents($this->error_file, 'Error on comparing MD5 sum', FILE_APPEND);

            $result = false;
        }elseif($this->file_size !== filesize($this->settings['res_file'])) {
            unlink($this->settings['res_file']);
            file_put_contents($this->error_file, 'Error on comparing file size', FILE_APPEND);
            $result = false;
        }
        file_put_contents($this->progress_file, 100);
        return $result;
    }

    /**
     * Returns memory_limit to default value.
     */
    public function __destruct()
    {
        parent::__destruct();
        ini_set('memory_limit', $this->old_memory_limit);
    }

}

// Start worker process
WorkerDownloader::startWorker($argv??null, false);
