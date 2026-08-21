<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemRegistry extends Model
{
    public $timestamps = false;

    protected $table = 'systems';

    protected $fillable = [
        'sys_id', 'name', 'category', 'status', 'description', 'url', 'go_live_date',
        'owner', 'vendor', 'developer', 'support_contact', 'source_code_repo',
        'api_documentation', 'hosting', 'server', 'ip_address', 'database_type',
        'operating_system', 'tech_stack', 'criticality', 'authentication',
        'backup', 'recovery_plan', 'notes', 'branch', 'created_by', 'created_at', 'updated_at',
    ];

    protected $casts = [
        'go_live_date' => 'date',
        'created_at'   => 'datetime',
        'updated_at'   => 'datetime',
    ];
}
