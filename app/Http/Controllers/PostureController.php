<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\BranchSecurity;
use App\Models\Hardware;
use App\Models\Incident;
use App\Models\Risk;
use App\Models\Software;
use App\Models\SystemRegistry;
use App\Models\ThreatIntel;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PostureController extends Controller
{
    public function index()
    {
        return Inertia::render('posture/index', $this->buildPayload());
    }

    // ── Main data builder ──────────────────────────────────────────────────
    private function buildPayload(): array
    {
        // ── Incidents ──────────────────────────────────────────────────────
        $incRows       = Incident::select('workflow_status', 'severity')->get();
        $incTotal      = $incRows->count();
        $incOpen       = $incRows->whereNotIn('workflow_status', ['closed', 'draft'])->count();
        $incClosed     = $incRows->where('workflow_status', 'closed')->count();
        $incCrit       = $incRows->where('severity', 'Critical')->whereNotIn('workflow_status', ['closed', 'draft'])->count();
        $incHigh       = $incRows->where('severity', 'High')->whereNotIn('workflow_status', ['closed', 'draft'])->count();
        $incResolution = $incTotal > 0 ? (int) round(($incClosed / $incTotal) * 100) : 100;

        // ── Threat Intel ───────────────────────────────────────────────────
        $tiRows   = ThreatIntel::select('status', 'severity')->get();
        $tiTotal  = $tiRows->count();
        $tiActive = $tiRows->where('status', 'Active')->count();
        $tiCrit   = $tiRows->where('status', 'Active')->where('severity', 'Critical')->count();
        $tiHigh   = $tiRows->where('status', 'Active')->where('severity', 'High')->count();

        // ── Hardware ───────────────────────────────────────────────────────
        $hwRows            = Hardware::select('status', 'warranty_expiry')->get();
        $hwTotal           = $hwRows->count();
        $hwActive          = $hwRows->where('status', 'Active')->count();
        $hwWarrantyExpired = $hwRows->filter(
            fn ($h) => $h->warranty_expiry && Carbon::parse($h->warranty_expiry)->isPast()
        )->count();

        // ── Software ───────────────────────────────────────────────────────
        $swTotal   = Software::count();
        $swExpired = Software::whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<', now())
            ->count();
        $swHealth  = $swTotal > 0 ? (int) round((($swTotal - $swExpired) / $swTotal) * 100) : 100;

        // ── Systems ────────────────────────────────────────────────────────
        $sysRows   = SystemRegistry::select('status', 'criticality')->get();
        $sysTotal  = $sysRows->count();
        $sysActive = $sysRows->where('status', 'Active')->count();
        $sysCrit   = $sysRows->where('criticality', 'Critical')->count();
        $sysHealth = $sysTotal > 0 ? (int) round(($sysActive / $sysTotal) * 100) : 100;

        // ── Risks ──────────────────────────────────────────────────────────
        $riskTotal    = Risk::count();
        $riskHighOpen = Risk::whereIn('level', ['Critical', 'High'])
            ->where('status', '!=', 'Mitigated')
            ->count();

        // ── Branches + Branch Security ─────────────────────────────────────
        $branches    = Branch::orderBy('name')->get();
        $branchCount = $branches->count();
        $activeBranches = $branches->where('status', 'Active')->count();

        $bsRows  = BranchSecurity::all()->keyBy('branch');

        // Build per-branch posture list
        $branchPostureList = [];
        foreach ($branches as $br) {
            $bs    = $bsRows->get($br->name);
            $score = $bs ? $bs->score : 0;

            $branchPostureList[] = [
                'code'     => $br->code,
                'name'     => $br->name,
                'type'     => $br->type,
                'status'   => $br->status,
                'location' => $br->location,
                'employees'=> (int) $br->employees,
                'score'    => $score,
                'has_data' => $bs !== null,
                // domain control values (0=none,1=no,2=partial,3=yes)
                'antivirus'        => $bs ? (int) $bs->antivirus        : 0,
                'firewall'         => $bs ? (int) $bs->firewall         : 0,
                'disk_encryption'  => $bs ? (int) $bs->disk_encryption  : 0,
                'password_policy'  => $bs ? (int) $bs->password_policy  : 0,
                'mfa'              => $bs ? (int) $bs->mfa              : 0,
                'backup_status'    => $bs ? (int) $bs->backup_status    : 0,
            ];
        }

        // Attach incident / hw / sw counts per branch
        $incByBranch = DB::table('incidents')
            ->selectRaw('branch, COUNT(*) AS c')
            ->whereNotNull('branch')
            ->groupBy('branch')
            ->pluck('c', 'branch');

        $hwByBranch = DB::table('hardware')
            ->selectRaw('branch, COUNT(*) AS c')
            ->whereNotNull('branch')
            ->groupBy('branch')
            ->pluck('c', 'branch');

        $swByBranch = DB::table('software')
            ->selectRaw('branch, COUNT(*) AS c')
            ->whereNotNull('branch')
            ->groupBy('branch')
            ->pluck('c', 'branch');

        foreach ($branchPostureList as &$bp) {
            $bp['incidents'] = (int) ($incByBranch[$bp['name']] ?? 0);
            $bp['hardware']  = (int) ($hwByBranch[$bp['name']]  ?? 0);
            $bp['software']  = (int) ($swByBranch[$bp['name']]  ?? 0);
        }
        unset($bp);

        // Sort by score desc
        usort($branchPostureList, fn ($a, $b) => $b['score'] - $a['score']);

        // ── Composite scores ───────────────────────────────────────────────
        $bsScores = array_column($branchPostureList, 'score');
        $bsAvg    = count($bsScores) ? (int) round(array_sum($bsScores) / count($bsScores)) : 0;

        // Threat score: penalty per active critical/high IOC
        $threatPenalty = min(100, $tiCrit * 10 + $tiHigh * 5);
        $threatScore   = max(0, 100 - $threatPenalty);

        // Asset health: % of hardware active
        $assetScore = $hwTotal > 0 ? (int) round(($hwActive / $hwTotal) * 100) : 100;

        // Overall weighted score
        $overallScore = (int) round(
            $bsAvg             * 0.35 +
            $incResolution     * 0.20 +
            $threatScore       * 0.20 +
            $swHealth          * 0.10 +
            $sysHealth         * 0.10 +
            $assetScore        * 0.05
        );

        $hasAnyData = ($incTotal + $tiTotal + $hwTotal + $swTotal + $sysTotal + $bsRows->count()) > 0;
        if (! $hasAnyData) {
            $overallScore = 0;
        }

        // ── Domain maturity scores (9 domains) ────────────────────────────
        $domainAvg = fn (string $field) => count($branchPostureList)
            ? (int) round(
                array_sum(array_map(
                    fn ($b) => $b['has_data'] ? (int) round(($b[$field] / 3) * 100) : 0,
                    $branchPostureList
                )) / count($branchPostureList)
            )
            : 0;

        $domains = [
            [
                'icon'   => 'fa-shield-virus',
                'name'   => 'Endpoint Protection',
                'weight' => 15,
                'score'  => $bsAvg > 0 ? min(100, $domainAvg('antivirus')) : 0,
                'source' => 'Branch Security → Antivirus',
            ],
            [
                'icon'   => 'fa-fire-flame-curved',
                'name'   => 'Network & Perimeter',
                'weight' => 15,
                'score'  => $bsAvg > 0 ? min(100, $domainAvg('firewall')) : 0,
                'source' => 'Branch Security → Firewall',
            ],
            [
                'icon'   => 'fa-lock',
                'name'   => 'Data Encryption',
                'weight' => 12,
                'score'  => $bsAvg > 0 ? min(100, $domainAvg('disk_encryption')) : 0,
                'source' => 'Branch Security → Disk Encryption',
            ],
            [
                'icon'   => 'fa-mobile-screen',
                'name'   => 'Identity & MFA',
                'weight' => 12,
                'score'  => $bsAvg > 0 ? min(100, $domainAvg('mfa')) : 0,
                'source' => 'Branch Security → MFA',
            ],
            [
                'icon'   => 'fa-key',
                'name'   => 'Password & Access Policy',
                'weight' => 10,
                'score'  => $bsAvg > 0 ? min(100, $domainAvg('password_policy')) : 0,
                'source' => 'Branch Security → Password Policy',
            ],
            [
                'icon'   => 'fa-rotate',
                'name'   => 'Backup & Recovery',
                'weight' => 8,
                'score'  => $bsAvg > 0 ? min(100, $domainAvg('backup_status')) : 0,
                'source' => 'Branch Security → Backup Status',
            ],
            [
                'icon'   => 'fa-triangle-exclamation',
                'name'   => 'Incident Response',
                'weight' => 12,
                'score'  => $incResolution,
                'source' => 'Incidents → Resolution Rate',
            ],
            [
                'icon'   => 'fa-bug',
                'name'   => 'Threat Intelligence',
                'weight' => 10,
                'score'  => $threatScore,
                'source' => 'Threat Intel → Active Threats',
            ],
            [
                'icon'   => 'fa-server',
                'name'   => 'Asset Management',
                'weight' => 6,
                'score'  => $assetScore,
                'source' => 'Hardware Inventory → Active Assets',
            ],
        ];

        // ── Module status cards ────────────────────────────────────────────
        $moduleStatus = [
            [
                'label'     => 'Incidents',
                'total'     => $incTotal,
                'sub'       => $incOpen > 0 ? "{$incOpen} open" : 'All closed',
                'alert'     => $incOpen > 0,
                'icon'      => 'fa-triangle-exclamation',
                'iconBg'    => $incOpen > 0 ? 'bg-amber-50 text-amber-500' : 'bg-green-50 text-green-500',
                'valueCls'  => $incOpen > 0 ? 'text-amber-600' : 'text-green-600',
            ],
            [
                'label'     => 'Threat Intel',
                'total'     => $tiTotal,
                'sub'       => $tiActive > 0 ? "{$tiActive} active IOCs" : 'No active threats',
                'alert'     => $tiActive > 0,
                'icon'      => 'fa-bug',
                'iconBg'    => $tiActive > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500',
                'valueCls'  => $tiActive > 0 ? 'text-red-600' : 'text-green-600',
            ],
            [
                'label'     => 'Hardware',
                'total'     => $hwTotal,
                'sub'       => $hwTotal > 0 ? "{$hwActive} active of {$hwTotal}" : 'No assets',
                'alert'     => $hwWarrantyExpired > 0,
                'icon'      => 'fa-server',
                'iconBg'    => 'bg-cyan-50 text-cyan-500',
                'valueCls'  => $hwWarrantyExpired > 0 ? 'text-amber-600' : 'text-green-600',
            ],
            [
                'label'     => 'Software',
                'total'     => $swTotal,
                'sub'       => $swExpired > 0 ? "{$swExpired} expired licenses" : ($swTotal > 0 ? 'All valid' : 'No licenses'),
                'alert'     => $swExpired > 0,
                'icon'      => 'fa-floppy-disk',
                'iconBg'    => $swExpired > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500',
                'valueCls'  => $swExpired > 0 ? 'text-red-600' : 'text-green-600',
            ],
            [
                'label'     => 'Systems',
                'total'     => $sysTotal,
                'sub'       => $sysTotal > 0 ? "{$sysActive} active of {$sysTotal}" : 'No systems',
                'alert'     => $sysTotal > $sysActive,
                'icon'      => 'fa-network-wired',
                'iconBg'    => 'bg-purple-50 text-purple-500',
                'valueCls'  => $sysTotal > $sysActive ? 'text-amber-600' : 'text-green-600',
            ],
            [
                'label'     => 'Branches',
                'total'     => $branchCount,
                'sub'       => "{$activeBranches} active",
                'alert'     => false,
                'icon'      => 'fa-building',
                'iconBg'    => 'bg-blue-50 text-blue-500',
                'valueCls'  => 'text-blue-600',
            ],
        ];

        return [
            'overallScore'      => $overallScore,
            'grade'             => $this->grade($overallScore),
            'hasAnyData'        => $hasAnyData,
            'incOpen'           => $incOpen,
            'incCrit'           => $incCrit,
            'tiActive'          => $tiActive,
            'tiCrit'            => $tiCrit,
            'activeBranches'    => $activeBranches,
            'bsAvg'             => $bsAvg,
            'riskHighOpen'      => $riskHighOpen,
            'domains'           => $domains,
            'moduleStatus'      => $moduleStatus,
            'branchPostureList' => $branchPostureList,
        ];
    }

    // ── Helpers ────────────────────────────────────────────────────────────
    private function grade(int $score): string
    {
        return match (true) {
            $score >= 95 => 'A+',
            $score >= 90 => 'A',
            $score >= 87 => 'A-',
            $score >= 84 => 'B+',
            $score >= 80 => 'B',
            $score >= 77 => 'B-',
            $score >= 74 => 'C+',
            $score >= 70 => 'C',
            $score >= 67 => 'C-',
            $score >= 60 => 'D',
            default      => 'F',
        };
    }
}
