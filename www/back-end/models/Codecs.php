<?php
/**
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 5 2018
 *
 */

namespace Models;
use Phalcon\Mvc\Model\Relation;

class Codecs extends ModelsBase
{
    public $id;
    public $name;
    public $type;
    public $description;

    public function getSource()
    {
        return 'm_Codecs';
    }
    public function initialize()
    {
	    parent::initialize();
        $this->hasMany(
            'name',
            'Models\IaxCodecs',
            'codec',
            [
                "alias"=>"IaxCodecs",
                "foreignKey" => [
                    "allowNulls" => true,
                    "action"     => Relation::ACTION_CASCADE
                ],
                'params' => array(
                    'order' => 'priority asc'
                )
            ]
        );


        $this->hasMany(
            'name',
            'Models\SipCodecs',
            'codec',
            [
                "alias"=>"SipCodecs",
                "foreignKey" => [
                    "allowNulls" => true,
                    "action"     => Relation::ACTION_CASCADE
                ],
                'params' => array(
                    'order' => 'priority asc'
                )
            ]
        );
    }
}