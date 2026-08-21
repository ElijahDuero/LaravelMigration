<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Incident extends Model
{
    public $timestamps = false;

    protected $table = 'incidents';

    protected $fillable = [
        'incident_number', 'incident_at', 'reported_at', 'branch', 'campus', 'department',
        'reporter_name', 'contact_number', 'severity', 'category', 'description',
        'systems_affected', 'users_affected', 'ip_address', 'hostname', 'device',
        'browser', 'operating_system', 'workflow_status', 'assigned_to', 'is_sample',
        'created_by', 'created_at', 'updated_at',
    ];

    protected $casts = [
        'incident_at' => 'datetime',
        'reported_at' => 'datetime',
        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',
        'is_sample'   => 'boolean',
    ];

    public function history(): HasMany
    {
        return $this->hasMany(IncidentWorkflowHistory::class, 'incident_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(IncidentAttachment::class, 'incident_id');
    }
}
