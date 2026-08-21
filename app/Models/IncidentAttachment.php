<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IncidentAttachment extends Model
{
    public $timestamps = false;

    protected $table = 'incident_attachments';

    protected $fillable = [
        'incident_id', 'attachment_type', 'original_filename', 'stored_filename',
        'mime_type', 'file_size', 'uploaded_by', 'uploaded_at',
    ];

    protected $casts = ['uploaded_at' => 'datetime'];

    public function incident(): BelongsTo
    {
        return $this->belongsTo(Incident::class, 'incident_id');
    }
}
