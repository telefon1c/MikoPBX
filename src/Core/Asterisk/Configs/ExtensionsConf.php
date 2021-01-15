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

namespace MikoPBX\Core\Asterisk\Configs;

use MikoPBX\Common\Models\{Iax, IncomingRoutingTable, OutgoingRoutingTable, OutWorkTimes, Providers, Sip, SoundFiles};
use MikoPBX\Common\Providers\PBXConfModulesProvider;
use MikoPBX\Core\Asterisk\Configs\Generators\Extensions\IncomingContexts;
use MikoPBX\Modules\Config\ConfigClass;
use MikoPBX\Core\System\{MikoPBXConfig, Storage, Util};
use Phalcon\Di;

class ExtensionsConf extends ConfigClass
{
    protected string $description = 'extensions.conf';

    /**
     * Sorts array by priority field
     *
     * @param $a
     * @param $b
     *
     * @return int|null
     */
    public static function sortArrayByPriority(array $a, array $b): int
    {
        $aPriority = (int)($a['priority'] ?? 0);
        $bPriority = (int)($b['priority'] ?? 0);
        if ($aPriority === $bPriority) {
            return 0;
        }

        return ($aPriority < $bPriority) ? -1 : 1;
    }

    /**
     * Основной генератор extensions.conf
     */
    protected function generateConfigProtected(): void
    {
        /** @scrutinizer ignore-call */
        $additionalModules = $this->di->getShared(PBXConfModulesProvider::SERVICE_NAME);
        $conf              = "[globals] \n" .
            "TRANSFER_CONTEXT=internal-transfer; \n";
        if ($this->generalSettings['PBXRecordCalls'] === '1') {
            $conf .= "MONITOR_DIR=" . Storage::getMonitorDir() . " \n";
            $conf .= "MONITOR_STEREO=" . $this->generalSettings['PBXSplitAudioThread'] . " \n";
        }
        foreach ($additionalModules as $appClass) {
            $addition = $appClass->extensionGlobals();
            if ( ! empty($addition)) {
                $conf .= $appClass->confBlockWithComments($addition);
            }
        }
        $conf .= "\n";
        $conf .= "\n";
        $conf .= "[general] \n";
        $conf .= "\n";

        // Создаем диалплан внутренних учеток.
        $this->generateOtherExten($conf);
        // Контекст для внутренних вызовов.
        $this->generateInternal($conf);
        // Контекст для внутренних переадресаций.
        $this->generateInternalTransfer($conf);
        // Создаем контекст хинтов.
        $this->generateSipHints($conf);
        // Создаем контекст (исходящие звонки).
        $this->generateOutContextPeers($conf);
        // Описываем контекст для публичных входящих.
        $this->generatePublicContext($conf);

        Util::fileWriteContent($this->config->path('asterisk.astetcdir') . '/extensions.conf', $conf);
    }

    /**
     * Генератор прочих контекстов.
     *
     * @param $conf
     */
    private function generateOtherExten(&$conf): void
    {
        $extension = 'X!';
        // Контекст для AMI originate. Без него отображается не корректный CallerID.
        $conf .= '[sipregistrations]' . "\n\n";

        $conf .= '[messages]' . "\n" .
            'exten => _' . $extension . ',1,MessageSend(sip:${EXTEN},"${CALLERID(name)}"${MESSAGE(from)})' . "\n\n";

        $conf .= '[internal-originate]' . " \n";
        $conf .= 'exten => _' . $extension . ',1,NoOP(Hint ${HINT} exten ${EXTEN} )' . " \n";
        $conf .= '; Если это originate, то скроем один CDR.' . " \n\t";
        $conf .= 'same => n,ExecIf($["${pt1c_cid}x" != "x"]?Set(CALLERID(num)=${pt1c_cid}))' . " \n\t";

        $conf .= 'same => n,ExecIf($["${CUT(CHANNEL,\;,2)}" == "2"]?Set(__PT1C_SIP_HEADER=${SIPADDHEADER}))' . " \n\t";
        $conf .= 'same => n,ExecIf($["${peer_mobile}x" != "x"]?Set(ADDITIONAL_PEER=&Local/${peer_mobile}@outgoing/n))' . " \n\t";

        // Описываем возможность прыжка в пользовательский sub контекст.
        $conf .= 'same => n,GosubIf($["${DIALPLAN_EXISTS(${CONTEXT}-custom,${EXTEN},1)}" == "1"]?${CONTEXT}-custom,${EXTEN},1)' . "\n\t";
        $conf .= 'same => n,Dial(Local/${EXTEN}@internal-users/n${ADDITIONAL_PEER},60,TteKkHhb(originate_create_chan,s,1))' . " \n\n";

        $conf .= '[originate_create_chan]' . " \n";
        $conf .= 'exten => s,1,Set(CHANNEL(hangup_handler_wipe)=hangup_handler,s,1)' . "\n\t";
        $conf .= 'same => n,return' . " \n\n";

        $conf .= '[dial_create_chan]' . " \n";
        $conf .= 'exten => s,1,Gosub(lua_${ISTRANSFER}dial_create_chan,${EXTEN},1)' . "\n\t";
        $conf .= 'same => n,Set(pt1c_is_dst=1)' . " \n\t";
        $conf .= 'same => n,ExecIf($["${PT1C_SIP_HEADER}x" != "x"]?Set(PJSIP_HEADER(add,${CUT(PT1C_SIP_HEADER,:,1)})=${CUT(PT1C_SIP_HEADER,:,2)}))' . " \n\t";
        $conf .= 'same => n,Set(__PT1C_SIP_HEADER=${UNDEFINED})' . " \n\t";
        $conf .= 'same => n,Set(CHANNEL(hangup_handler_wipe)=hangup_handler,s,1)' . " \n\t";
        $conf .= 'same => n,return' . " \n\n";

        $conf .= '[hangup_handler]' . "\n";
        $conf .= 'exten => s,1,NoOp(--- hangup - ${CHANNEL} ---)' . "\n\t";
        $conf .= 'same => n,Gosub(hangup_chan,${EXTEN},1)' . "\n\t";

        $conf .= 'same => n,return' . "\n\n";

        $conf .= '[set_orign_chan]' . "\n";
        $conf .= 'exten => s,1,Wait(0.2)' . "\n\t";
        $conf .= 'same => n,Set(pl=${IF($["${CHANNEL:-1}" == "1"]?2:1)})' . "\n\t";
        $conf .= 'same => n,Set(orign_chan=${IMPORT(${CUT(CHANNEL,\;,1)}\;${pl},BRIDGEPEER)})' . "\n\t";
        $conf .= 'same => n,ExecIf($[ "${orign_chan}x" == "x" ]?Set(orign_chan=${IMPORT(${CUT(CHANNEL,\;,1)}\;${pl},FROM_CHAN)}))' . "\n\t";
        $conf .= 'same => n,ExecIf($[ "${QUEUE_SRC_CHAN}x" != "x" ]?Set(__QUEUE_SRC_CHAN=${orign_chan}))' . "\n\t";
        $conf .= 'same => n,ExecIf($[ "${QUEUE_SRC_CHAN:0:5}" == "Local" ]?Set(__QUEUE_SRC_CHAN=${FROM_CHAN}))' . "\n\t";
        $conf .= 'same => n,ExecIf($[ "${FROM_CHAN}x" == "x" ]?Set(__FROM_CHAN=${IMPORT(${CUT(CHANNEL,\;,1)}\;${pl},BRIDGEPEER)}))' . "\n\t";
        $conf .= 'same => n,return' . "\n\n";

        $conf .= '[playback]' . "\n";
        $conf .= 'exten => s,1,Playback(hello_demo,noanswer)' . "\n\t";
        $conf .= 'same => n,ExecIf($["${SRC_BRIDGE_CHAN}x" == "x"]?Wait(30))' . "\n\t";
        $conf .= 'same => n,Wait(0.3)' . "\n\t";
        $conf .= 'same => n,Bridge(${SRC_BRIDGE_CHAN},kKTthH)' . "\n\n";

        $conf .= 'exten => h,1,ExecIf($["${ISTRANSFER}x" != "x"]?Gosub(${ISTRANSFER}dial_hangup,${EXTEN},1))' . "\n\n";

        // TODO / Добавление / удаление префиксов на входящий callerid.
        $conf .= '[add-trim-prefix-clid]' . "\n";
        $conf .= 'exten => _.!,1,NoOp(--- Incoming call from ${CALLERID(num)} ---)' . "\n\t";
        $conf .= 'same => n,GosubIf($["${DIALPLAN_EXISTS(${CONTEXT}-custom,${EXTEN},1)}" == "1"]?${CONTEXT}-custom,${EXTEN},1)' . "\n\t";
        // Отсекаем "+".
        // $conf.= 'same => n,ExecIf( $["${CALLERID(num):0:1}" == "+"]?Set(CALLERID(num)=${CALLERID(num):1}))'."\n\t";
        // Отсекаем "7" и добавляем "8".
        // $conf.= 'same => n,ExecIf( $["${REGEX("^7[0-9]+" ${CALLERID(num)})}" == "1"]?Set(CALLERID(num)=8${CALLERID(num):1}))'."\n\t";
        $conf .= 'same => n,return' . "\n\n";
    }

    /**
     * Генератор контекста для внутренних вызовов.
     *
     * @param $conf
     */
    private function generateInternal(&$conf): void
    {
        $extension  = 'X!';
        $technology = SIPConf::getTechnology();

        $additionalModules = $this->di->getShared(PBXConfModulesProvider::SERVICE_NAME);
        foreach ($additionalModules as $appClass) {
            $addition = $appClass->extensionGenContexts();
            if ( ! empty($addition)) {
                $conf .= $appClass->confBlockWithComments($addition);
            }
        }
        $conf .= "\n";
        $conf .= "[internal-num-undefined] \n";
        $conf .= 'exten => _' . $extension . ',1,ExecIf($["${ISTRANSFER}x" != "x"]?Gosub(${ISTRANSFER}dial_hangup,${EXTEN},1))' . "\n\t";
        $conf .= 'same => n,ExecIf($["${BLINDTRANSFER}x" != "x"]?AGI(check_redirect.php,${BLINDTRANSFER}))' . "\n\t";
        $conf .= "same => n,Playback(pbx-invalid,noanswer) \n\n";

        $conf .= "[internal-fw]\n";
        $conf .= 'exten => _' . $extension . ',1,NoOp(DIALSTATUS - ${DIALSTATUS})' . "\n\t";
        // CANCEL - вызов был отменен, к примеру *0, не нужно дальше искать адресат.
        $conf .= 'same => n,ExecIf($["${DIALSTATUS}" == "CANCEL"]?Hangup())' . "\n\t";
        // BUSY - занято. К примру абонент завершил вызов или DND.
        $conf .= 'same => n,ExecIf($["${DIALSTATUS}" == "BUSY"]?Set(dstatus=FW_BUSY))' . "\n\t";
        // CHANUNAVAIL - канал не доступен. К примеру телефон не зарегистрирован или не отвечает.
        $conf .= 'same => n,ExecIf($["${DIALSTATUS}" == "CHANUNAVAIL"]?Set(dstatus=FW_UNAV))' . "\n\t";
        // NOANSWER - не ответили по таймауту.
        $conf .= 'same => n,ExecIf($["${dstatus}x" == "x"]?Set(dstatus=FW))' . "\n\t";
        $conf .= 'same => n,Set(fw=${DB(${dstatus}/${EXTEN})})' . "\n\t";
        $conf .= 'same => n,ExecIf($["${fw}x" != "x"]?Set(__pt1c_UNIQUEID=${UNDEFINED})' . "\n\t";
        $conf .= 'same => n,ExecIf($["${fw}x" != "x"]?Goto(internal,${fw},1))' . "\n\t";
        $conf .= 'same => n,ExecIf($["${BLINDTRANSFER}x" != "x"]?AGI(check_redirect.php,${BLINDTRANSFER}))' . "\n\t";
        $conf .= 'same => n,Hangup() ' . "\n\n";

        $conf .= "[all_peers]\n";
        $conf .= 'include => internal-hints' . "\n";
        $conf .= 'exten => failed,1,Hangup()' . "\n";

        $conf .= 'exten => _.!,1,ExecIf($[ "${EXTEN}" == "h" ]?Hangup())' . "\n\t";
        // Фильтр спецсимволов. Разершаем только цифры.
        $conf .= 'same => n,Set(cleanNumber=${FILTER(\*\#\+1234567890,${EXTEN})})' . "\n\t";
        $conf .= 'same => n,ExecIf($["${EXTEN}" != "${cleanNumber}"]?Goto(${CONTEXT},${cleanNumber},$[${PRIORITY} + 1]))' . "\n\t";

        $conf .= 'same => n,Set(__FROM_CHAN=${CHANNEL})' . "\n\t";
        $conf .= 'same => n,ExecIf($["${OLD_LINKEDID}x" == "x"]?Set(__OLD_LINKEDID=${CHANNEL(linkedid)}))' . "\n\t";
        $conf .= 'same => n,ExecIf($["${CHANNEL(channeltype)}" != "Local"]?Gosub(set_from_peer,s,1))' . "\n\t";
        $conf .= 'same => n,ExecIf($["${CHANNEL(channeltype)}" == "Local"]?Gosub(set_orign_chan,s,1))' . "\n\t";

        $conf .= 'same => n,ExecIf($["${CALLERID(num)}x" == "x"]?Set(CALLERID(num)=${FROM_PEER}))' . "\n\t";
        $conf .= 'same => n,ExecIf($["${CALLERID(num)}x" == "x"]?Set(CALLERID(name)=${FROM_PEER}))' . "\n\t";

        $conf .= 'same => n,ExecIf($["${CHANNEL(channeltype)}" == "Local" && "${FROM_PEER}x" == "x"]?Set(__FROM_PEER=${CALLERID(num)}))' . "\n\t";
        $conf .= 'same => n,Set(CHANNEL(hangup_handler_wipe)=hangup_handler,s,1)' . "\n\t";
        $conf .= 'same => n,Gosub(${ISTRANSFER}dial,${EXTEN},1)' . "\n\t";

        $conf .= 'same => n,GosubIf($["${DIALPLAN_EXISTS(${CONTEXT}-custom,${EXTEN},1)}" == "1"]?${CONTEXT}-custom,${EXTEN},1)' . "\n\t";
        $dialplanNames = ['applications', 'internal', 'outgoing'];
        foreach ($dialplanNames as $name){
            $conf .= 'same => n,GosubIf($["${DIALPLAN_EXISTS('.$name.',${EXTEN},1)}" == "1"]?'.$name.',${EXTEN},1)'." \n\t";
        }
        $conf .= 'same => n,Hangup()'." \n";

        $pickupexten  = $this->generalSettings['PBXFeaturePickupExten'];
        $conf        .= 'exten => _' . $pickupexten . $extension . ',1,Set(PICKUPEER=' . $technology . '/${FILTER(0-9,${EXTEN:2})})' . "\n\t";
        $conf        .= 'same => n,Set(pt1c_dnid=${EXTEN})' . "\n\t";
        $conf        .= 'same => n,PickupChan(${PICKUPEER})' . "\n\t";
        $conf        .= 'same => n,Hangup()' . "\n\n";

        $voicemail_exten  = $this->generalSettings['VoicemailExten'];
        $conf            .= 'exten => ' . $voicemail_exten . ',1,NoOp(NOTICE, Dialing out from ${CALLERID(all)} to VoiceMail)' . "\n\t";
        $conf            .= 'same => n,VoiceMailMain(admin@voicemailcontext,s)' . "\n\t";
        $conf            .= 'same => n,Hangup()' . "\n\n";

        $conf .= "[voice_mail_peer] \n";
        $conf .= 'exten => voicemail,1,Answer()' . "\n\t";
        $conf .= 'same => n,VoiceMail(admin@voicemailcontext)' . "\n\t";
        $conf .= 'same => n,Hangup()' . "\n\n";

        // Контекст для внутренних вызовов.
        $conf .= "[internal] \n";

        foreach ($additionalModules as $appClass) {
            $addition = $appClass->getIncludeInternal();
            if ( ! empty($addition)) {
                $conf .= $appClass->confBlockWithComments($addition);
            }
        }

        foreach ($additionalModules as $appClass) {
            $addition = $appClass->extensionGenInternal();
            if ( ! empty($addition)) {
                $conf .= $appClass->confBlockWithComments($addition);
            }
        }

        $conf .= 'exten => i,1,NoOp(-- INVALID NUMBER --)' . "\n\t";
        $conf .= 'same => n,Set(DIALSTATUS=INVALID_NUMBER)' . "\n\t";
        $conf .= 'same => n,Playback(privacy-incorrect,noanswer)' . "\n\t";
        $conf .= 'same => n,Hangup()' . "\n";

        $conf .= 'exten => h,1,ExecIf($["${ISTRANSFER}x" != "x"]?Gosub(${ISTRANSFER}dial_hangup,${EXTEN},1))' . "\n\n";

        $conf .= "[internal-incoming]\n";
        $conf .= 'exten => _.!,1,ExecIf($["${MASTER_CHANNEL(M_TIMEOUT)}x" != "x"]?Set(TIMEOUT(absolute)=${MASTER_CHANNEL(M_TIMEOUT)}))' . " \n\t";
        $conf .= 'same => n,Set(MASTER_CHANNEL(M_TIMEOUT_CHANNEL)=${CHANNEL})' . " \n\t";
        $conf .= 'same => n,Set(MASTER_CHANNEL(M_TIMEOUT)=${EMPTY_VAR})' . " \n\t";
        $conf .= 'same => n,Goto(internal,${EXTEN},1)' . " \n\n";

        $conf .= "[internal-users] \n";
        $conf .= 'exten => _' . $extension . ',1,Set(CHANNEL(hangup_handler_wipe)=hangup_handler,s,1)' . " \n\t";
        $conf .= 'same => n,ExecIf($["${ISTRANSFER}x" != "x"]?Set(SIPADDHEADER01=${EMPTY_VAR})' . " \n\t";
        $conf .= 'same => n,ExecIf($["${CHANNEL(channeltype)}" == "Local"]?Gosub(set_orign_chan,s,1))' . " \n\t";

        $conf .= 'same => n,Gosub(${ISTRANSFER}dial,${EXTEN},1)' . "\n\t";
        // Проверим, существует ли такой пир.

        $conf .= 'same => n,ExecIf($["${PJSIP_ENDPOINT(${EXTEN},auth)}x" == "x"]?Goto(internal-num-undefined,${EXTEN},1))' . " \n\t";
        $conf .= 'same => n,ExecIf($["${DEVICE_STATE(' . $technology . '/${EXTEN})}" == "BUSY"]?Set(DIALSTATUS=BUSY))' . " \n\t";
        $conf .= 'same => n,GotoIf($["${DEVICE_STATE(' . $technology . '/${EXTEN})}" == "BUSY"]?fw_start)' . " \n\t";

        // Как долго звонить пиру.
        $conf .= 'same => n,Set(ringlength=${DB(FW_TIME/${EXTEN})})' . " \n\t";
        $conf .= 'same => n,ExecIf($["${ringlength}x" == "x"]?Set(ringlength=600))' . " \n\t";
        $conf .= 'same => n,ExecIf($["${QUEUE_SRC_CHAN}x" != "x" && "${ISTRANSFER}x" == "x"]?Set(ringlength=600))' . " \n\t";

        $conf .= 'same => n,GosubIf($["${DIALPLAN_EXISTS(${CONTEXT}-custom,${EXTEN},1)}" == "1"]?${CONTEXT}-custom,${EXTEN},1) ' . " \n\t";
        // Совершаем вызов пира.
        $conf .= 'same => n,Set(DST_CONTACT=${PJSIP_DIAL_CONTACTS(${EXTEN})})' . " \n\t";
        $conf .= 'same => n,ExecIf($["${FIELDQTY(DST_CONTACT,&)}" != "1"]?Set(__PT1C_SIP_HEADER=${EMPTY_VAR}))' . " \n\t";
        $conf .= 'same => n,ExecIf($["${DST_CONTACT}x" != "x"]?Dial(${DST_CONTACT},${ringlength},TtekKHhU(${ISTRANSFER}dial_answer)b(dial_create_chan,s,1)):Set(DIALSTATUS=CHANUNAVAIL))' . " \n\t";
        $conf .= 'same => n(fw_start),NoOp(dial_hangup)' . " \n\t";

        // QUEUE_SRC_CHAN - установлена, если вызов сервершен агенту очереди.
        // Проверяем нужна ли переадресация
        $conf .= 'same => n,ExecIf($["${DIALSTATUS}" != "ANSWER" && "${ISTRANSFER}x" != "x"]?Goto(internal-fw,${EXTEN},1))' . " \n\t";
        $conf .= 'same => n,ExecIf($["${DIALSTATUS}" != "ANSWER" && "${QUEUE_SRC_CHAN}x" == "x"]?Goto(internal-fw,${EXTEN},1))' . " \n\t";
        $conf .= 'same => n,ExecIf($["${BLINDTRANSFER}x" != "x"]?AGI(check_redirect.php,${BLINDTRANSFER}))' . " \n\t";
        $conf .= 'same => n,Hangup()' . "\n\n";

        $conf .= 'exten => h,1,ExecIf($["${ISTRANSFER}x" != "x"]?Gosub(${ISTRANSFER}dial_hangup,${EXTEN},1))' . "\n\n";
    }

    /**
     * Генератор контекста для переадресаций.
     *
     * @param $conf
     */
    private function generateInternalTransfer(&$conf): void
    {
        $additionalModules = $this->di->getShared(PBXConfModulesProvider::SERVICE_NAME);
        $conf              .= "[internal-transfer] \n";

        foreach ($additionalModules as $appClass) {
            $addition = $appClass->getIncludeInternalTransfer();
            if ( ! empty($addition)) {
                $conf .= $appClass->confBlockWithComments($addition);
            }
        }

        foreach ($additionalModules as $appClass) {
            $addition = $appClass->extensionGenInternalTransfer();
            if ( ! empty($addition)) {
                $conf .= $appClass->confBlockWithComments($addition);
            }
        }
        $conf .= 'exten => h,1,Gosub(transfer_dial_hangup,${EXTEN},1)' . "\n\n";
    }

    /**
     * Генератор хинтов SIP.
     *
     * @param $conf
     */
    private function generateSipHints(&$conf): void
    {
        $additionalModules = $this->di->getShared(PBXConfModulesProvider::SERVICE_NAME);
        $conf              .= "[internal-hints] \n";
        foreach ($additionalModules as $appClass) {
            $addition = $appClass->extensionGenHints();
            if ( ! empty($addition)) {
                $conf .= $appClass->confBlockWithComments($addition);
            }
        }
        $conf .= "\n\n";
    }

    /**
     * Генератор исходящих контекстов.
     *
     * @param $conf
     */
    private function generateOutContextPeers(&$conf): void
    {
        $additionalModules = $this->di->getShared(PBXConfModulesProvider::SERVICE_NAME);
        $conf              .= "[outgoing] \n";

        $conf .= 'exten => _+.!,1,NoOp(Strip + sign from number and convert it to +)' . " \n\t";
        $conf .= 'same => n,Set(ADDPLUS=+);' . " \n\t";
        $conf .= 'same => n,Goto(${CONTEXT},${EXTEN:1},1);' . " \n\n";
        $conf .= 'exten => _.!,1,ExecIf($[ "${EXTEN}" == "h" ]?Hangup())' . " \n\t";
        $conf .= 'same => n,Ringing()' . " \n\t";

        // Описываем возможность прыжка в пользовательский sub контекст.
        $conf .= 'same => n,GosubIf($["${DIALPLAN_EXISTS(${CONTEXT}-custom,${EXTEN},1)}" == "1"]?${CONTEXT}-custom,${EXTEN},1)' . "\n\t";

        /** @var OutgoingRoutingTable $routs */
        /** @var OutgoingRoutingTable $rout */
        $routs = OutgoingRoutingTable::find(['order' => 'priority'])->toArray();
        uasort($routs, __CLASS__ . '::sortArrayByPriority');

        $provider_contexts = [];

        foreach ($routs as $rout) {
            $technology = $this->getTechByID($rout['providerid']);
            if ($technology !== '') {
                $rout_data                       = $rout;
                $rout_data['technology']         = $technology;
                $id_dialplan                     = $rout_data['providerid'] . '-' . $rout_data['id'] . '-outgoing';
                $provider_contexts[$id_dialplan] = $rout_data;
                $conf                            .= $this->generateOutgoingRegexPattern($rout_data);
                continue;
            }
        }
        $conf .= 'same => n,ExecIf($["${peer_mobile}x" != "x"]?Hangup())' . " \n\t";
        $conf .= 'same => n,ExecIf($["${DIALSTATUS}" != "ANSWER" && "${BLINDTRANSFER}x" != "x" && "${ISTRANSFER}x" != "x"]?Gosub(${ISTRANSFER}dial_hangup,${EXTEN},1))' . "\n\t";
        $conf .= 'same => n,ExecIf($["${BLINDTRANSFER}x" != "x"]?AGI(check_redirect.php,${BLINDTRANSFER}))' . " \n\t";
        $conf .= 'same => n,ExecIf($["${ROUTFOUND}x" == "x"]?Gosub(dial,${EXTEN},1))' . "\n\t";

        $conf .= 'same => n,Playback(silence/2,noanswer)' . " \n\t";
        $conf .= 'same => n,ExecIf($["${ROUTFOUND}x" != "x"]?Playback(followme/sorry,noanswer):Playback(cannot-complete-as-dialed,noanswer))' . " \n\t";
        $conf .= 'same => n,Hangup()' . " \n\n";
        $conf .= 'exten => h,1,ExecIf($["${ISTRANSFER}x" != "x"]?Gosub(${ISTRANSFER}dial_hangup,${EXTEN},1))' . "\n\t";

        foreach ($provider_contexts as $id_dialplan => $rout) {
            $conf .= "\n[{$id_dialplan}]\n";
            $trimFromBegin = (int) ($rout['trimfrombegin']??0);
            if ($trimFromBegin > 0) {
                $exten_var    = '${ADDPLUS}${EXTEN:' . $rout['trimfrombegin'] . '}';
                $change_exten = 'same => n,ExecIf($["${EXTEN}" != "${number}"]?Goto(${CONTEXT},${number},$[${PRIORITY} + 1]))' . "\n\t";
            } else {
                $exten_var    = '${ADDPLUS}${EXTEN}';
                $change_exten = '';
            }
            $conf .= 'exten => _.!,1,Set(number=' . $rout['prepend'] . $exten_var . ')' . "\n\t";
            $conf .= 'same => n,Set(number=${FILTER(\*\#\+1234567890,${number})})' . "\n\t";
            $conf .= $change_exten;
            foreach ($additionalModules as $appClass) {
                $addition = $appClass->generateOutRoutContext($rout);
                if ( ! empty($addition)) {
                    $conf .= $appClass->confBlockWithComments($addition);
                }
            }
            $conf .= 'same => n,ExecIf($["${number}x" == "x"]?Hangup())' . "\n\t";
            $conf .= 'same => n,Set(ROUTFOUND=1)' . "\n\t";
            $conf .= 'same => n,Gosub(${ISTRANSFER}dial,${EXTEN},1)' . "\n\t";

            $conf .= 'same => n,ExecIf($["${EXTERNALPHONE}" == "${EXTEN}"]?Set(DOPTIONS=tk))' . "\n\t";

            // Описываем возможность прыжка в пользовательский sub контекст.
            $conf .= 'same => n,GosubIf($["${DIALPLAN_EXISTS(' . $rout['providerid'] . '-outgoing-custom,${EXTEN},1)}" == "1"]?' . $rout['providerid'] . '-outgoing-custom,${EXTEN},1)' . "\n\t";

            if ($rout['technology'] === IAXConf::TYPE_IAX2) {
                $conf .= 'same => n,Dial(' . $rout['technology'] . '/' . $rout['providerid'] . '/${number},600,${DOPTIONS}TKU(${ISTRANSFER}dial_answer)b(dial_create_chan,s,1))' . "\n\t";
            } else {
                $conf .= 'same => n,Dial(' . $rout['technology'] . '/${number}@' . $rout['providerid'] . ',600,${DOPTIONS}TKU(${ISTRANSFER}dial_answer)b(dial_create_chan,s,1))' . "\n\t";
            }
            foreach ($additionalModules as $appClass) {
                $addition = $appClass->generateOutRoutAfterDialContext($rout);
                if ( ! empty($addition)) {
                    $conf .= $appClass->confBlockWithComments($addition);
                }
            }
            $conf .= 'same => n,GosubIf($["${DIALPLAN_EXISTS(' . $rout['providerid'] . '-outgoing-after-dial-custom,${EXTEN}),1}" == "1"]?' . $rout['providerid'] . '-outgoing-after-dial-custom,${EXTEN},1)' . "\n\t";

            $conf .= 'same => n,ExecIf($["${ISTRANSFER}x" != "x"]?Gosub(${ISTRANSFER}dial_hangup,${EXTEN},1))' . "\n\t";
            $conf .= 'same => n,ExecIf($["${DIALSTATUS}" = "ANSWER"]?Hangup())' . "\n\t";
            $conf .= 'same => n,Set(pt1c_UNIQUEID=${EMPTY_VALUE})' . "\n\t";
            $conf .= 'same => n,return' . "\n";
        }
    }

    /**
     * Генератор extension для контекста outgoing.
     *
     * @param string $uniqueID
     *
     * @return null|string
     */
    public function getTechByID(string $uniqueID): string
    {
        $technology = '';
        $provider   = Providers::findFirstByUniqid($uniqueID);
        if ($provider !== null) {
            if ($provider->type === 'SIP') {
                $account    = Sip::findFirst('disabled="0" AND uniqid = "' . $uniqueID . '"');
                $technology = ($account === null) ? '' : SIPConf::getTechnology();
            } elseif ($provider->type === 'IAX') {
                $account    = Iax::findFirst('disabled="0" AND uniqid = "' . $uniqueID . '"');
                $technology = ($account === null) ? '' : 'IAX2';
            }
        }

        return $technology;
    }

    /**
     * Генератор исходящего маршрута.
     *
     * @param $rout
     *
     * @return string
     */
    private function generateOutgoingRegexPattern($rout): string
    {
        $conf         = '';
        $regexPattern = '';
        
        $restNumbers = (int) ($rout['restnumbers']??0);
        if ($restNumbers > 0) {
            $regexPattern = "[0-9]{" . $rout['restnumbers'] . "}$";
        } elseif ($restNumbers === 0) {
            $regexPattern = "$";
        } elseif ($restNumbers === -1) {
            $regexPattern = "";
        }
        $numberBeginsWith = $rout['numberbeginswith']??'';
        $numberBeginsWith = str_replace(array('*', '+'), array('\\\\*', '\\\\+'), $numberBeginsWith);
        $conf            .= 'same => n,ExecIf($["${REGEX("^' . $numberBeginsWith . $regexPattern . '" ${EXTEN})}" == "1"]?Gosub(' . $rout['providerid'] . '-' . $rout['id'] . '-outgoing,${EXTEN},1))' . " \n\t";

        return $conf;
    }

    /**
     * Контекст для входящих внешних звонков без авторизации.
     *
     * @param $conf
     */
    public function generatePublicContext(&$conf): void
    {
        $additionalModules = $this->di->getShared(PBXConfModulesProvider::SERVICE_NAME);
        $conf              .= "\n";
        $conf              .= IncomingContexts::generate('none');
        $conf              .= "[public-direct-dial] \n";
        foreach ($additionalModules as $appClass) {
            if ($appClass instanceof $this) {
                continue;
            }
            $appClass->generatePublicContext($conf);
        }
        $filter = ["provider IS NULL AND priority<>9999"];

        /**
         * @var array
         */
        $m_data = IncomingRoutingTable::find($filter);
        if (count($m_data->toArray()) > 0) {
            $conf .= 'include => none-incoming';
        }
    }

}