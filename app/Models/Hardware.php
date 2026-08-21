<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Hardware extends Model
{
    public $timestamps = false;

    protected $table = 'hardware';

    protected $fillable = [
        'tag', 'name', 'type', 'serial', 'manufacturer', 'model', 'status', 'branch',
        'building', 'room', 'rack', 'assigned_user', 'department', 'ip_address',
        'mac_address', 'hostname', 'operating_system', 'cpu', 'ram', 'storage',
        'purchase_date', 'warranty_expiry', 'supplier', 'invoice', 'purchase_cost',
        'notes', 'is_sample', 'created_by', 'created_at', 'updated_at',
    ];

    protected $casts = [
        'purchase_date'   => 'date',
        'warranty_expiry' => 'date',
        'created_at'      => 'datetime',
        'updated_at'      => 'datetime',
        'is_sample'       => 'boolean',
        'purchase_cost'   => 'decimal:2',
    ];
}
