<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Risk extends Model
{
    public $timestamps = false;

    protected $table = 'risks';

    protected $fillable = [
        'risk_id', 'title', 'category', 'level', 'score', 'likelihood', 'impact',
        'status', 'owner', 'branch', 'due_date', 'mitigation', 'created_by', 'created_at', 'updated_at',
    ];

    protected $casts = [
        'due_date'   => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
