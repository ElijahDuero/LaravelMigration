<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IncidentWorkflowHistory extends Model
{
    public $timestamps = false;

    protected $table = 'incident_workflow_history';

    protected $fillable = ['incident_id', 'status', 'action', 'actor', 'notes', 'created_at'];

    protected $casts = ['created_at' => 'datetime'];

    public function incident(): BelongsTo
    {
        return $this->belongsTo(Incident::class, 'incident_id');
    }
}
