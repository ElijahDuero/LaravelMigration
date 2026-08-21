<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotifRule extends Model
{
    public $timestamps = false;

    protected $table = 'notif_rules';

    protected $fillable = ['bot_id', 'event_type', 'min_severity', 'enabled', 'created_at'];

    protected $casts = [
        'enabled'    => 'boolean',
        'created_at' => 'datetime',
    ];

    public function bot(): BelongsTo
    {
        return $this->belongsTo(NotifBot::class, 'bot_id');
    }
}
