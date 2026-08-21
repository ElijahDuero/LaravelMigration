<?php

namespace App\Http\Controllers;

use App\Models\BranchSecurity;
use App\Models\Hardware;
use App\Models\Incident;
use App\Models\Risk;
use App\Models\Software;
use App\Models\ThreatIntel;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $incidentStats = DB::table('incidents')->selectRaw("\n            COUNT(*) AS total,\n            SUM(CASE WHEN workflow_status NOT IN ('closed','draft') THEN 1 ELSE 0 END) AS open,\n            SUM(CASE WHEN severity = 'Critical' AND workflow_status NOT IN ('closed','draft') THEN 1 ELSE 0 END) AS critical,\n            SUM(CASE WHEN severity IN ('High','Critical') THEN 1 ELSE 0 END) AS high_crit,\n            SUM(CASE WHEN workflow_status = 'closed' THEN 1 ELSE 0 END) AS closed\n        ")->first();

        $total    = (int) ($incidentStats->total    ?? 0);
        $open     = (int) ($incidentStats->open     ?? 0);
        $critical = (int) ($incidentStats->critical ?? 0);
        $highCrit = (int) ($incidentStats->high_crit ?? 0);
        $closed   = (int) ($incidentStats->closed   ?? 0);
        // Monthly trend - last 6 months. Group in PHP to avoid DB-specific date functions.
        $monthRows = DB::table('incidents')
            ->selectRaw('COALESCE(reported_at, created_at) AS dt, workflow_status')
            ->whereRaw('COALESCE(reported_at, created_at) IS NOT NULL')
            ->get()
            ->groupBy(fn ($row) => \Illuminate\Support\Carbon::parse($row->dt)->format('Y-m'));

        $trendData = [];
        for ($i = 5; $i >= 0; $i--) {
            $dt  = now()->startOfMonth()->subMonths($i);
            $ym  = $dt->format('Y-m');
            $rows = $monthRows->get($ym, collect());
            $trendData[] = [
                'month'     => $dt->format('M'),
                'ym'        => $ym,
                'incidents' => $rows->count(),
                'closed'    => $rows->where('workflow_status', 'closed')->count(),
            ];
        }
        // ── Severity distribution ──────────────────────────────────────────
        $sevMap = ['Critical' => 0, 'High' => 0, 'Medium' => 0, 'Low' => 0];
        DB::table('incidents')
            ->selectRaw('severity, COUNT(*) AS cnt')
            ->whereNotNull('severity')
            ->groupBy('severity')
            ->get()
            ->each(function ($r) use (&$sevMap) {
                if (array_key_exists($r->severity, $sevMap)) {
                    $sevMap[$r->severity] = (int) $r->cnt;
                }
            });

        $sevTotal = max($total, 1);
        $severityData = [
            ['label' => 'Critical', 'count' => $sevMap['Critical'], 'pct' => (int) round($sevMap['Critical'] / $sevTotal * 100), 'color' => 'bg-red-500',    'bg' => 'bg-red-100',    'text' => 'text-red-700',    'icon' => 'fa-skull-crossbones'],
            ['label' => 'High',     'count' => $sevMap['High'],     'pct' => (int) round($sevMap['High']     / $sevTotal * 100), 'color' => 'bg-orange-500', 'bg' => 'bg-orange-100', 'text' => 'text-orange-700', 'icon' => 'fa-arrow-up'],
            ['label' => 'Medium',   'count' => $sevMap['Medium'],   'pct' => (int) round($sevMap['Medium']   / $sevTotal * 100), 'color' => 'bg-yellow-500', 'bg' => 'bg-yellow-100', 'text' => 'text-yellow-700', 'icon' => 'fa-minus'],
            ['label' => 'Low',      'count' => $sevMap['Low'],      'pct' => (int) round($sevMap['Low']      / $sevTotal * 100), 'color' => 'bg-green-500',  'bg' => 'bg-green-100',  'text' => 'text-green-700',  'icon' => 'fa-arrow-down'],
        ];

        // ── Category breakdown ─────────────────────────────────────────────
        $catRows = DB::table('incidents')
            ->selectRaw('category, COUNT(*) AS cnt')
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->groupBy('category')
            ->pluck('cnt', 'category');

        $catDefs = [
            ['Phishing', 'bg-purple-500'], ['Malware Infection', 'bg-red-500'],
            ['Unauthorized Access', 'bg-orange-500'], ['Policy Violation', 'bg-yellow-500'],
            ['Ransomware', 'bg-rose-600'], ['Business Email Compromise', 'bg-pink-500'],
            ['Lost Laptop', 'bg-blue-500'], ['Lost Mobile Device', 'bg-indigo-500'],
            ['Website Defacement', 'bg-cyan-500'], ['Data Leak', 'bg-red-600'],
            ['Insider Threat', 'bg-amber-700'], ['Social Engineering', 'bg-violet-500'],
            ['Virus', 'bg-rose-500'], ['Network Outage', 'bg-gray-500'],
            ['Denial of Service', 'bg-red-700'], ['Physical Security Incident', 'bg-stone-500'],
            ['Others', 'bg-gray-400'],
        ];
        $categoryData = [];
        $knownCats    = [];
        foreach ($catDefs as [$name, $color]) {
            $knownCats[]    = $name;
            $count          = (int) ($catRows[$name] ?? 0);
            $categoryData[] = ['name' => $name, 'color' => $color, 'count' => $count];
        }
        // Any DB categories not in the predefined list
        foreach ($catRows as $name => $count) {
            if (! in_array($name, $knownCats)) {
                $categoryData[] = ['name' => $name, 'color' => 'bg-gray-400', 'count' => (int) $count];
            }
        }
        // Only keep categories that actually have incidents
        $categoryData = array_values(array_filter($categoryData, fn ($c) => $c['count'] > 0));

        // ── Branch breakdown ───────────────────────────────────────────────
        $branchBreakdown = DB::table('incidents')
            ->selectRaw("
                branch,
                COUNT(*) AS total,
                SUM(CASE WHEN severity IN ('High','Critical') THEN 1 ELSE 0 END) AS high_crit,
                SUM(CASE WHEN workflow_status = 'closed' THEN 1 ELSE 0 END) AS closed
            ")
            ->whereNotNull('branch')
            ->where('branch', '!=', '')
            ->groupBy('branch')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => [
                'branch'    => $r->branch,
                'total'     => (int) $r->total,
                'high_crit' => (int) $r->high_crit,
                'closed'    => (int) $r->closed,
            ])
            ->values()
            ->toArray();

        $activeBranches = count($branchBreakdown);

        // ── Recent incidents ───────────────────────────────────────────────
        $recentIncidents = Incident::select([
            'id', 'incident_number', 'description', 'branch',
            'severity', 'workflow_status', 'reporter_name',
            DB::raw('COALESCE(reported_at, created_at) AS reported_at'),
        ])
            ->orderByDesc('id')
            ->limit(10)
            ->get()
            ->map(fn ($i) => [
                'id'              => $i->id,
                'incident_number' => $i->incident_number,
                'description'     => $i->description,
                'branch'          => $i->branch,
                'severity'        => $i->severity,
                'workflow_status' => $i->workflow_status,
                'reporter_name'   => $i->reporter_name,
                'reported_at'     => $i->reported_at,
            ])
            ->toArray();

        // ── Asset stats ────────────────────────────────────────────────────
        $hwCount = Hardware::count();
        $swCount = Software::count();

        // ── Risk stats ─────────────────────────────────────────────────────
        $riskTotal   = Risk::count();
        $riskHighOpen = Risk::whereIn('level', ['Critical', 'High'])
            ->where('status', '!=', 'Mitigated')
            ->count();

        // ── Threat intel stats ─────────────────────────────────────────────
        $tiActive   = ThreatIntel::where('status', 'Active')->count();
        $tiCritical = ThreatIntel::where('status', 'Active')->where('severity', 'Critical')->count();

        // ── Posture score (avg of branch_security scores) ──────────────────
        $bsRows = BranchSecurity::all();
        if ($bsRows->isEmpty()) {
            $postureScore = 0;
        } else {
            $postureScore = (int) round(
                $bsRows->sum(fn ($r) => $r->score) / $bsRows->count()
            );
        }

        return Inertia::render('dashboard', [
            'incidentStats' => [
                'total'    => $total,
                'open'     => $open,
                'critical' => $critical,
                'high_crit' => $highCrit,
                'closed'   => $closed,
            ],
            'trendData'       => $trendData,
            'severityData'    => $severityData,
            'categoryData'    => $categoryData,
            'branchBreakdown' => $branchBreakdown,
            'recentIncidents' => $recentIncidents,
            'assetStats'      => [
                'hardware' => $hwCount,
                'software' => $swCount,
                'total'    => $hwCount + $swCount,
            ],
            'riskStats'       => [
                'total'     => $riskTotal,
                'high_open' => $riskHighOpen,
            ],
            'threatStats'     => [
                'active'   => $tiActive,
                'critical' => $tiCritical,
            ],
            'postureScore'    => $postureScore,
            'activeBranches'  => $activeBranches,
        ]);
    }
}


