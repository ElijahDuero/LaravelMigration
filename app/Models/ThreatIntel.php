<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThreatIntel extends Model
{
    public $timestamps = false;

    protected $table = 'threat_intel';

    protected $fillable = [
        'ioc_id', 'type', 'value', 'severity', 'status', 'confidence', 'source', 'tags',
        'description', 'first_seen', 'last_seen', 'expiry_date', 'is_sample', 'misp_event',
        'vt_permalink', 'abuse_report', 'created_by', 'created_at', 'updated_at',
    ];

    protected $casts = [
        'is_sample'   => 'boolean',
        'first_seen'  => 'date',
        'last_seen'   => 'date',
        'expiry_date' => 'date',
        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',
    ];
}
