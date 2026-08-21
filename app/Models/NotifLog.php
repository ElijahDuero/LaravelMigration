<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotifLog extends Model
{
    public $timestamps = false;

    protected $table = 'notif_log';

    protected $fillable = ['bot_id', 'channel', 'event_type', 'message', 'status', 'error', 'sent_at'];

    protected $casts = ['sent_at' => 'datetime'];
}
