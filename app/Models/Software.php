<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Software extends Model
{
    public $timestamps = false;

    protected $table = 'software';

    protected $fillable = [
        'sw_id', 'name', 'category', 'vendor', 'version', 'license_type', 'license_model',
        'license_key', 'total_licenses', 'used_licenses', 'branch', 'department',
        'purchase_date', 'expiry_date', 'cost_annual', 'supplier', 'po_number',
        'invoice', 'notes', 'is_sample', 'created_by', 'created_at', 'updated_at',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'cost_annual'   => 'decimal:2',
        'created_at'    => 'datetime',
        'updated_at'    => 'datetime',
        'is_sample'     => 'boolean',
    ];
}
