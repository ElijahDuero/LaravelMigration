<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditService
{
    public static function log(
        string $module,
        string $action,
        ?string $target = null,
        ?string $detail = null
    ): void {
        $user = Auth::user();

        AuditLog::create([
            'actor'      => $user?->name ?? 'system',
            'role'       => $user?->role ?? '',
            'module'     => $module,
            'action'     => $action,
            'target'     => $target,
            'detail'     => $detail,
            'ip_address' => Request::ip(),
            'created_at' => now(),
        ]);
    }
}
