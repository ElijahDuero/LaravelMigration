<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomRole extends Model
{
    public $timestamps = false;

    protected $table = 'custom_roles';

    protected $fillable = ['name', 'description', 'color', 'icon', 'permissions', 'created_at', 'updated_at'];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
