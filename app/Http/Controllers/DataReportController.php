<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\BranchSecurity;
use App\Models\Hardware;
use App\Models\Incident;
use App\Models\Software;
use App\Models\SystemRegistry;
use App\Models\ThreatIntel;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DataReportController extends Controller
{
    private const PER_PAGE = 10;

    public function index(Request $request)
    {
        // ── Filters ────────────────────────────────────────────────────────
        $dateFrom = $this->validDate($request->query('from'));
        $dateTo   = $this->validDate($request->query('to'));
        $branch   = trim((string) $request->query('branch', ''));
        $section  = trim((string) $request->query('section', ''));

        // ── Branch list (for filter dropdown) ─────────────────────────────
        $branches = Branch::orderBy('name')->pluck('name')->toArray();

        // ── Incidents ──────────────────────────────────────────────────────
        $incQuery = DB::table('incidents')
            ->when($dateFrom, fn ($q) => $q->whereRaw("DATE(COALESCE(incident_at, created_at)) >= ?", [$dateFrom]))
            ->when($dateTo,   fn ($q) => $q->whereRaw("DATE(COALESCE(incident_at, created_at)) <= ?", [$dateTo]))
            ->when($branch,   fn ($q) => $q->where('branch', $branch));

        $incAll      = $incQuery->get();
        $incTotal    = $incAll->count();
        $incOpen     = $incAll->whereNotIn('workflow_status', ['closed', 'draft'])->count();
        $incCritical = $incAll->where('severity', 'Critical')
                               ->whereNotIn('workflow_status', ['closed', 'draft'])->count();
        $incClosed   = $incAll->where('workflow_status', 'closed')->count();

        $incBySeverity = [
            'Critical' => $incAll->where('severity', 'Critical')->count(),
            'High'     => $incAll->where('severity', 'High')->count(),
            'Medium'   => $incAll->where('severity', 'Medium')->count(),
            'Low'      => $incAll->where('severity', 'Low')->count(),
        ];

        $incPage      = max(1, (int) $request->query('inc_page', 1));
        $incTotalPages = (int) ceil($incTotal / self::PER_PAGE);
        $incPage      = min($incPage, max(1, $incTotalPages ?: 1));
        $incRows      = $incQuery->orderByDesc('id')
            ->offset(($incPage - 1) * self::PER_PAGE)
            ->limit(self::PER_PAGE)
            ->get()
            ->map(fn ($r) => [
                'incident_number'  => $r->incident_number,
                'incident_at'      => $r->incident_at,
                'created_at'       => $r->created_at,
                'severity'         => $r->severity,
                'category'         => $r->category,
                'branch'           => $r->branch,
                'workflow_status'  => $r->workflow_status,
                'reporter_name'    => $r->reporter_name,
                'description'      => $r->description,
            ])
            ->toArray();

        // ── Threat Intelligence ────────────────────────────────────────────
        $tiQuery = DB::table('threat_intel')
            ->when($dateFrom, fn ($q) => $q->whereRaw("DATE(created_at) >= ?", [$dateFrom]))
            ->when($dateTo,   fn ($q) => $q->whereRaw("DATE(created_at) <= ?", [$dateTo]));

        $tiAll      = $tiQuery->get();
        $tiTotal    = $tiAll->count();
        $tiActive   = $tiAll->where('status', 'Active')->count();
        $tiCritical = $tiAll->where('severity', 'Critical')->count();
        $tiHigh     = $tiAll->where('severity', 'High')->count();

        $tiPage       = max(1, (int) $request->query('ti_page', 1));
        $tiTotalPages = (int) ceil($tiTotal / self::PER_PAGE);
        $tiPage       = min($tiPage, max(1, $tiTotalPages ?: 1));
        $tiRows       = $tiQuery->orderByDesc('id')
            ->offset(($tiPage - 1) * self::PER_PAGE)
            ->limit(self::PER_PAGE)
            ->get()
            ->map(fn ($r) => [
                'ioc_id'     => $r->ioc_id,
                'type'       => $r->type,
                'value'      => $r->value,
                'severity'   => $r->severity,
                'status'     => $r->status,
                'confidence' => $r->confidence,
                'first_seen' => $r->first_seen,
                'created_at' => $r->created_at,
            ])
            ->toArray();

        // ── Hardware ───────────────────────────────────────────────────────
        $hwQuery = DB::table('hardware')
            ->when($branch, fn ($q) => $q->where('branch', $branch));

        $hwAll    = $hwQuery->get();
        $hwTotal  = $hwAll->count();
        $hwActive = $hwAll->where('status', 'Active')->count();

        $hwPage       = max(1, (int) $request->query('hw_page', 1));
        $hwTotalPages = (int) ceil($hwTotal / self::PER_PAGE);
        $hwPage       = min($hwPage, max(1, $hwTotalPages ?: 1));
        $hwRows       = $hwQuery->orderByDesc('id')
            ->offset(($hwPage - 1) * self::PER_PAGE)
            ->limit(self::PER_PAGE)
            ->get()
            ->map(fn ($r) => [
                'tag'             => $r->tag,
                'name'            => $r->name,
                'type'            => $r->type,
                'branch'          => $r->branch,
                'assigned_user'   => $r->assigned_user,
                'status'          => $r->status,
                'warranty_expiry' => $r->warranty_expiry,
            ])
            ->toArray();

        // ── Software ───────────────────────────────────────────────────────
        $swQuery = DB::table('software')
            ->when($branch, fn ($q) => $q->where('branch', $branch));

        $swAll     = $swQuery->get();
        $swTotal   = $swAll->count();
        $swExpired = $swAll->filter(
            fn ($r) => ! empty($r->expiry_date) && $r->expiry_date < now()->toDateString()
        )->count();

        $swPage       = max(1, (int) $request->query('sw_page', 1));
        $swTotalPages = (int) ceil($swTotal / self::PER_PAGE);
        $swPage       = min($swPage, max(1, $swTotalPages ?: 1));
        $swRows       = $swQuery->orderByDesc('id')
            ->offset(($swPage - 1) * self::PER_PAGE)
            ->limit(self::PER_PAGE)
            ->get()
            ->map(fn ($r) => [
                'sw_id'          => $r->sw_id,
                'name'           => $r->name,
                'vendor'         => $r->vendor,
                'branch'         => $r->branch,
                'category'       => $r->category,
                'used_licenses'  => $r->used_licenses,
                'total_licenses' => $r->total_licenses,
                'expiry_date'    => $r->expiry_date,
            ])
            ->toArray();

        // ── Branch Security ────────────────────────────────────────────────
        $bsModels = BranchSecurity::orderBy('branch')->get();
        $bsTotal  = $bsModels->count();
        $bsAvg    = $bsTotal
            ? (int) round($bsModels->sum(fn ($r) => $r->score) / $bsTotal)
            : 0;

        $bsPage       = max(1, (int) $request->query('bs_page', 1));
        $bsTotalPages = (int) ceil($bsTotal / self::PER_PAGE);
        $bsPage       = min($bsPage, max(1, $bsTotalPages ?: 1));
        $bsRows       = $bsModels
            ->slice(($bsPage - 1) * self::PER_PAGE, self::PER_PAGE)
            ->map(fn ($r) => [
                'branch'              => $r->branch,
                'score'               => $r->score,
                'antivirus'           => (int) $r->antivirus,
                'firewall'            => (int) $r->firewall,
                'disk_encryption'     => (int) $r->disk_encryption,
                'mfa'                 => (int) $r->mfa,
                'backup_status'       => (int) $r->backup_status,
                'computers_total'     => (int) $r->computers_total,
                'computers_patched'   => (int) $r->computers_patched,
                'updated_at'          => optional($r->updated_at)->toDateString(),
            ])
            ->values()
            ->toArray();

        // ── Systems ────────────────────────────────────────────────────────
        $sysAll   = SystemRegistry::orderBy('name')->get();
        $sysTotal = $sysAll->count();
        $sysCrit  = $sysAll->where('criticality', 'Critical')->count();

        $sysPage       = max(1, (int) $request->query('sys_page', 1));
        $sysTotalPages = (int) ceil($sysTotal / self::PER_PAGE);
        $sysPage       = min($sysPage, max(1, $sysTotalPages ?: 1));
        $sysRows       = $sysAll
            ->slice(($sysPage - 1) * self::PER_PAGE, self::PER_PAGE)
            ->map(fn ($r) => [
                'sys_id'      => $r->sys_id,
                'name'        => $r->name,
                'category'    => $r->category,
                'criticality' => $r->criticality,
                'status'      => $r->status,
                'owner'       => $r->owner,
                'hosting'     => $r->hosting,
            ])
            ->values()
            ->toArray();

        return Inertia::render('data_reports/index', [
            // Filters
            'filters' => [
                'from'    => $dateFrom ?? '',
                'to'      => $dateTo   ?? '',
                'branch'  => $branch,
                'section' => $section,
            ],
            'branches' => $branches,

            // Summary counts
            'summary' => [
                'incidents' => $incTotal,
                'inc_open'  => $incOpen,
                'threats'   => $tiTotal,
                'hardware'  => $hwTotal,
                'software'  => $swTotal,
                'bs_total'  => $bsTotal,
            ],

            // Incidents
            'inc' => [
                'rows'        => $incRows,
                'total'       => $incTotal,
                'open'        => $incOpen,
                'critical'    => $incCritical,
                'closed'      => $incClosed,
                'by_severity' => $incBySeverity,
                'page'        => $incPage,
                'total_pages' => $incTotalPages,
            ],

            // Threat Intel
            'ti' => [
                'rows'        => $tiRows,
                'total'       => $tiTotal,
                'active'      => $tiActive,
                'critical'    => $tiCritical,
                'high'        => $tiHigh,
                'page'        => $tiPage,
                'total_pages' => $tiTotalPages,
            ],

            // Hardware
            'hw' => [
                'rows'        => $hwRows,
                'total'       => $hwTotal,
                'active'      => $hwActive,
                'page'        => $hwPage,
                'total_pages' => $hwTotalPages,
            ],

            // Software
            'sw' => [
                'rows'        => $swRows,
                'total'       => $swTotal,
                'expired'     => $swExpired,
                'page'        => $swPage,
                'total_pages' => $swTotalPages,
            ],

            // Branch Security
            'bs' => [
                'rows'        => $bsRows,
                'total'       => $bsTotal,
                'avg'         => $bsAvg,
                'page'        => $bsPage,
                'total_pages' => $bsTotalPages,
            ],

            // Systems
            'sys' => [
                'rows'        => $sysRows,
                'total'       => $sysTotal,
                'critical'    => $sysCrit,
                'page'        => $sysPage,
                'total_pages' => $sysTotalPages,
            ],
        ]);
    }

    // ── Helpers ────────────────────────────────────────────────────────────
    private function validDate(mixed $value): ?string
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }
        try {
            return Carbon::parse($value)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }
}
