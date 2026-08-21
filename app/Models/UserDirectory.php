<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserDirectory extends Model
{
    public $timestamps = false;

    protected $table = 'user_directory';

    protected $fillable = [
        'username', 'name', 'email', 'role', 'branch', 'dept', 'title',
        'status', 'mfa', 'avatar_bg', 'last_seen', 'created_at', 'updated_at',
    ];

    protected $casts = [
        'mfa'        => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
