<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    public $timestamps = false;

    protected $table = 'branches';

    protected $fillable = [
        'code', 'name', 'location', 'type', 'status', 'head', 'contact', 'email',
        'employees', 'campuses', 'established', 'notes', 'created_by', 'created_at', 'updated_at',
    ];

    protected $casts = [
        'established' => 'date',
        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',
    ];
}
