<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BranchSecurity extends Model
{
    public $timestamps = false;

    protected $table = 'branch_security';

    protected $fillable = [
        'branch', 'computers_total', 'computers_online', 'computers_offline',
        'computers_outdated', 'computers_patched', 'computers_encrypted',
        'antivirus', 'firewall', 'disk_encryption', 'password_policy', 'mfa',
        'backup_status', 'notes', 'updated_by', 'updated_at',
    ];

    protected $casts = ['updated_at' => 'datetime'];

    public function getScoreAttribute(): int
    {
        $controls = ['antivirus', 'firewall', 'disk_encryption', 'password_policy', 'mfa', 'backup_status'];
        $controlScore = 0;
        foreach ($controls as $c) {
            $v = (int) ($this->$c ?? 0);
            $controlScore += match ($v) {
                3 => 2,
                2 => 1,
                default => 0
            };
        }
        $controlPct = (int) round(($controlScore / 12) * 70);
        $total = max(1, (int) ($this->computers_total ?? 0));
        $patched = (int) ($this->computers_patched ?? 0);
        $encrypted = (int) ($this->computers_encrypted ?? 0);
        $patchPct = (int) round(($patched / $total) * 15);
        $encryptPct = (int) round(($encrypted / $total) * 15);

        return min(100, $controlPct + $patchPct + $encryptPct);
    }
}
