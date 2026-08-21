<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotifAuditConfig extends Model
{
    public $timestamps = false;

    protected $table = 'notif_audit_config';

    protected $fillable = ['bot_id', 'enabled', 'filter_module', 'filter_actor', 'filter_level', 'created_by', 'updated_at'];

    protected $casts = [
        'enabled'    => 'boolean',
        'updated_at' => 'datetime',
    ];

    public function bot(): BelongsTo
    {
        return $this->belongsTo(NotifBot::class, 'bot_id');
    }
}
