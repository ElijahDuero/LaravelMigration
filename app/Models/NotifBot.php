<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NotifBot extends Model
{
    public $timestamps = false;

    protected $table = 'notif_bots';

    protected $fillable = ['channel', 'label', 'bot_token', 'chat_id', 'enabled', 'created_by', 'created_at', 'updated_at'];

    protected $casts = [
        'enabled'    => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function rules(): HasMany
    {
        return $this->hasMany(NotifRule::class, 'bot_id');
    }

    public function auditConfig(): HasMany
    {
        return $this->hasMany(NotifAuditConfig::class, 'bot_id');
    }
}
