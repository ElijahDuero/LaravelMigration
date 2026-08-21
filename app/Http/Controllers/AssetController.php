<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\BranchSecurity;
use App\Models\Hardware;
use App\Models\Software;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AssetController extends Controller
{
    public function index()
    {
        $today = now()->toDateString();

        // ── Hardware stats ─────────────────────────────────────────────────
        $hwAll     = Hardware::select('status', 'type', 'warranty_expiry', 'tag', 'name', 'assigned_user', 'branch')->get();
        $hwCount   = $hwAll->count();
        $hwActive  = $hwAll->where('status', 'Active')->count();
        $hwMaint   = $hwAll->where('status', 'In Maintenance')->count();
        $hwRisk    = $hwAll->whereIn('status', ['Decommissioned', 'Lost/Stolen'])->count();

        $warrantyExpiring = $hwAll->filter(function ($h) use ($today) {
            if (! $h->warranty_expiry) return false;
            $exp = Carbon::parse($h->warranty_expiry);
            return $exp->isFuture() && $exp->diffInDays(now()) <= 90;
        })->count();

        // HW type breakdown
        $hwTypeCounts = $hwAll->groupBy('type')->map->count()->sortDesc()->toArray();
        $hwTypeBranches = $hwAll->whereNotNull('branch')->where('branch', '!=', '')->pluck('branch')->unique()->count();

        // ── Software stats ─────────────────────────────────────────────────
        $swAll     = Software::select('sw_id', 'name', 'category', 'license_type', 'expiry_date', 'branch', 'vendor', 'version', 'total_licenses', 'used_licenses')->get();
        $swCount   = $swAll->count();
        $swTitles  = $swAll->pluck('name')->filter()->unique()->count();
        $swLicensed = $swAll->where('license_type', 'Licensed')->count();
        $swRisk    = $swAll->whereIn('license_type', ['Expired', 'Unlicensed'])->count();

        $swExpiring = $swAll->filter(function ($s) use ($today) {
            if (! $s->expiry_date) return false;
            $exp = Carbon::parse($s->expiry_date);
            return $exp->isFuture() && $exp->diffInDays(now()) <= 90;
        })->count();

        // SW category breakdown
        $swCatCounts = $swAll->groupBy('category')->map->count()->sortDesc()->toArray();

        // Compliant / risk proxy
        $compliantAssets = (int) round(($hwCount + $swCount) * 0.98);
        $riskCount       = $swRisk + $hwRisk;

        // ── Hierarchy ──────────────────────────────────────────────────────
        $buildings = Hardware::whereNotNull('building')->where('building', '!=', '')->distinct('building')->count('building');
        $rooms     = Hardware::whereNotNull('room')->where('room', '!=', '')->distinct('room')->count('room');
        $owners    = Hardware::whereNotNull('assigned_user')->where('assigned_user', '!=', '')->distinct('assigned_user')->count('assigned_user');

        // ── Branch comparison ──────────────────────────────────────────────
        $branches = Branch::orderBy('name')->pluck('name')->toArray();

        $hwByBranch = $hwAll->whereNotNull('branch')
            ->groupBy('branch')->map->count()->toArray();

        $swByBranch = $swAll->whereNotNull('branch')
            ->groupBy('branch')->map->count()->toArray();

        $branchPosture = BranchSecurity::all()
            ->keyBy('branch')
            ->map(fn ($r) => $r->score)
            ->toArray();

        $maxHw = $hwByBranch ? max(1, max(array_values($hwByBranch))) : 1;

        $branchComparison = array_map(fn ($b) => [
            'name'       => $b,
            'hw'         => (int) ($hwByBranch[$b] ?? 0),
            'sw'         => (int) ($swByBranch[$b] ?? 0),
            'posture'    => (int) ($branchPosture[$b] ?? 0),
            'hw_bar_pct' => min(100, (int) round((($hwByBranch[$b] ?? 0) / $maxHw) * 100)),
        ], $branches);

        // ── Recent records ─────────────────────────────────────────────────
        $recentHw = Hardware::select('tag', 'name', 'type', 'status', 'assigned_user', 'branch')
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(fn ($h) => [
                'tag'           => $h->tag,
                'name'          => $h->name,
                'type'          => $h->type,
                'status'        => $h->status,
                'assigned_user' => $h->assigned_user,
                'branch'        => $h->branch,
            ])
            ->toArray();

        $recentSw = Software::select('sw_id', 'name', 'category', 'license_type', 'expiry_date', 'used_licenses', 'total_licenses')
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(function ($s) use ($today) {
                $expDays = null;
                if ($s->expiry_date) {
                    $diff = now()->diffInDays(Carbon::parse($s->expiry_date), false);
                    $expDays = (int) $diff;
                }
                return [
                    'sw_id'          => $s->sw_id,
                    'name'           => $s->name,
                    'category'       => $s->category,
                    'license_type'   => $s->license_type,
                    'expiry_date'    => $s->expiry_date,
                    'exp_days'       => $expDays,
                    'used_licenses'  => (int) $s->used_licenses,
                    'total_licenses' => (int) $s->total_licenses,
                ];
            })
            ->toArray();

        // SW install counts (how many records share the same name)
        $swInstallCounts = $swAll->groupBy('name')->map->count()->toArray();
        $maxInstalls     = $swInstallCounts ? max(1, max(array_values($swInstallCounts))) : 1;

        // Enrich recentSw with install count / pct
        foreach ($recentSw as &$s) {
            $installs        = (int) ($swInstallCounts[$s['name']] ?? 1);
            $s['installs']   = $installs;
            $s['install_pct'] = min(100, (int) round(($installs / $maxInstalls) * 100));
        }
        unset($s);

        return Inertia::render('assets/index', [
            // KPI strip
            'kpis' => [
                'hw_total'         => $hwCount,
                'sw_titles'        => $swTitles,
                'sw_licensed'      => $swLicensed,
                'warranty_expiring'=> $warrantyExpiring,
                'compliant_assets' => $compliantAssets,
                'risk_count'       => $riskCount,
            ],

            // Module cards
            'hw' => [
                'count'          => $hwCount,
                'active'         => $hwActive,
                'maint'          => $hwMaint,
                'warranty_expiring' => $warrantyExpiring,
                'type_branches'  => $hwTypeBranches,
                'types'          => $hwTypeCounts,
            ],
            'sw' => [
                'count'    => $swCount,
                'titles'   => $swTitles,
                'licensed' => $swLicensed,
                'expiring' => $swExpiring,
                'risk'     => $swRisk,
                'cats'     => $swCatCounts,
            ],

            // Hierarchy
            'hierarchy' => [
                ['name' => 'Branches',            'icon' => 'fa-building',  'color' => 'amber',  'count' => count($branches)],
                ['name' => 'Buildings',            'icon' => 'fa-sitemap',   'color' => 'blue',   'count' => $buildings],
                ['name' => 'Rooms / Areas',        'icon' => 'fa-door-open', 'color' => 'purple', 'count' => $rooms],
                ['name' => 'Computers / Devices',  'icon' => 'fa-microchip', 'color' => 'indigo', 'count' => $hwCount],
                ['name' => 'Software Installed',   'icon' => 'fa-box',       'color' => 'teal',   'count' => $swCount],
                ['name' => 'Assigned Owners',      'icon' => 'fa-user',      'color' => 'emerald','count' => $owners],
            ],

            // Branch comparison
            'branch_comparison' => $branchComparison,

            // Recent
            'recent_hw' => $recentHw,
            'recent_sw' => $recentSw,
        ]);
    }
}
