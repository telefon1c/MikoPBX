<?php
/**
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 5 2020
 *
 */

namespace MikoPBX\Core\Asterisk\Configs;


class CdrSqlite3CustomConf extends \MikoPBX\Modules\Config\ConfigClass
{
    protected $description = 'cdr_sqlite3_custom.conf';

    protected function generateConfigProtected(): void
    {
        $cal     = 'start, answer, end, clid, src, dst, dnid, dcontext, channel, dstchannel, lastapp, lastdata, duration, billsec, disposition, amaflags, accountcode, uniqueid, userfield, recordingfile, linkedid';
        $columns = explode(', ', $cal);
        $values  = '';
        foreach ($columns as $key => $value) {
            $values .= ($values == '') ? "" : ",";
            $values .= "'\${CDR($value)}'";
        }

        $conf = "[master]\n" .
            "table=cdr\n" .
            "columns => $cal \n" .
            "values => $values \n";

        file_put_contents($this->astConfDir . "/cdr_sqlite3_custom.conf", $conf);
    }
}