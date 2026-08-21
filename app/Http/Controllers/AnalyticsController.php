<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    // ── Allowed range values ────────────────────────────────────────────────
    private const RANGES = [
        '30'  => 'Last 30 days',
        '90'  => 'Last 90 days',
        '180' => 'Last 6 months',
        '365' => 'Last year',
        'all' => 'All time',
    ];

    // ── Page render ────────────────────────────────────────────────────────
    public function index(Request $request)
    {
        $range = $this->validatedRange($request->query('range', '90'));

        return Inertia::render('analytics/index', [
            'range'      => $range,
            'ranges'     => self::RANGES,
            ...$this->buildPayload($range),
        ]);
    }

    // ── JSON endpoint (30-second polling) ─────────────────────────────────
    public function data(Request $request)
    {
        $range = $this->validatedRange($request->query('range', '90'));

        return response()->json([
            'ts'    => now()->format('Y-m-d H:i:s'),
            'range' => $range,
            ...$this->buildPayload($range),
        ]);
    }

    // ── Shared data builder ────────────────────────────────────────────────
    private function buildPayload(string $range): array
    {
        return [
            'kpis'        => $this->kpis($range),
            'by_branch'   => $this->byBranch($range),
            'by_system'   => $this->bySystem($range),
            'by_os'       => $this->byOs($range),
            'by_category' => $this->byCategory($range),
            'repeat'      => $this->repeatIncidents($range),
            'phishing'    => $this->phishingOffenders($range),
            'trend'       => $this->monthlyTrend(),
        ];
    }

    // ── 1. KPI Strip (totals + response-time metrics) ──────────────────────
    private function kpis(string $range): array
    {
        // Response / detection / resolution times via workflow history
        $timeRow = DB::table('incidents as i')
            ->selectRaw("
                AVG(CASE WHEN resp_h.created_at IS NOT NULL AND i.incident_at IS NOT NULL
                    THEN TIMESTAMPDIFF(MINUTE, i.incident_at, resp_h.created_at) END)  AS avg_response_min,
                AVG(CASE WHEN close_h.created_at IS NOT NULL AND i.incident_at IS NOT NULL
                    THEN TIMESTAMPDIFF(MINUTE, i.incident_at, close_h.created_at) END) AS avg_resolve_min,
                AVG(CASE WHEN detect_h.created_at IS NOT NULL AND i.incident_at IS NOT NULL
                    THEN TIMESTAMPDIFF(MINUTE, i.incident_at, detect_h.created_at) END) AS avg_detect_min,
                COUNT(i.id)                                                              AS total,
                SUM(CASE WHEN i.workflow_status = 'closed'                THEN 1 ELSE 0 END) AS resolved,
                SUM(CASE WHEN i.workflow_status NOT IN ('closed','draft') THEN 1 ELSE 0 END) AS open
            ")
            ->leftJoinSub(
                DB::table('incident_workflow_history')
                    ->selectRaw('incident_id, MIN(created_at) AS created_at')
                    ->whereIn('status', ['assigned', 'investigation'])
                    ->groupBy('incident_id'),
                'resp_h', 'resp_h.incident_id', '=', 'i.id'
            )
            ->leftJoinSub(
                DB::table('incident_workflow_history')
                    ->selectRaw('incident_id, MIN(created_at) AS created_at')
                    ->where('status', 'closed')
                    ->groupBy('incident_id'),
                'close_h', 'close_h.incident_id', '=', 'i.id'
            )
            ->leftJoinSub(
                DB::table('incident_workflow_history')
                    ->selectRaw('incident_id, MIN(created_at) AS created_at')
                    ->where('status', 'reported')
                    ->groupBy('incident_id'),
                'detect_h', 'detect_h.incident_id', '=', 'i.id'
            )
            ->when($range !== 'all', fn ($q) => $q->whereRaw(
                "COALESCE(i.reported_at, i.created_at) >= DATE_SUB(NOW(), INTERVAL ? DAY)", [(int) $range]
            ))
            ->first();

        $total    = (int) ($timeRow->total    ?? 0);
        $resolved = (int) ($timeRow->resolved ?? 0);
        $open     = (int) ($timeRow->open     ?? 0);

        return [
            'total'        => $total,
            'resolved'     => $resolved,
            'open'         => $open,
            'resolve_pct'  => $total > 0 ? (int) round($resolved / $total * 100) : 0,
            'avg_response' => $this->fmtDuration($timeRow->avg_response_min ?? null),
            'avg_detect'   => $this->fmtDuration($timeRow->avg_detect_min   ?? null),
            'avg_resolve'  => $this->fmtDuration($timeRow->avg_resolve_min  ?? null),
        ];
    }

    // ── 2. Incidents by Branch (top 10) ───────────────────────────────────
    private function byBranch(string $range): array
    {
        return DB::table('incidents')
            ->selectRaw("
                branch,
                COUNT(*) AS total,
                SUM(CASE WHEN severity IN ('Critical','High') THEN 1 ELSE 0 END) AS high_crit,
                SUM(CASE WHEN workflow_status = 'closed'      THEN 1 ELSE 0 END) AS closed,
                SUM(CASE WHEN severity = 'Critical'           THEN 1 ELSE 0 END) AS critical
            ")
            ->whereNotNull('branch')
            ->where('branch', '!=', '')
            ->when($range !== 'all', fn ($q) => $q->whereRaw(
                "COALESCE(reported_at, created_at) >= DATE_SUB(NOW(), INTERVAL ? DAY)", [(int) $range]
            ))
            ->groupBy('branch')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'branch'    => $r->branch,
                'total'     => (int) $r->total,
                'high_crit' => (int) $r->high_crit,
                'closed'    => (int) $r->closed,
                'critical'  => (int) $r->critical,
            ])
            ->toArray();
    }

    // ── 3. Most Attacked Systems / Hostnames (top 10) ─────────────────────
    private function bySystem(string $range): array
    {
        return DB::table('incidents')
            ->selectRaw("
                COALESCE(NULLIF(TRIM(hostname),''), NULLIF(TRIM(device),''), 'Unknown') AS sys,
                COUNT(*) AS total,
                SUM(CASE WHEN severity IN ('Critical','High') THEN 1 ELSE 0 END) AS high_crit
            ")
            ->when($range !== 'all', fn ($q) => $q->whereRaw(
                "COALESCE(reported_at, created_at) >= DATE_SUB(NOW(), INTERVAL ? DAY)", [(int) $range]
            ))
            ->groupBy('sys')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'sys'       => $r->sys,
                'total'     => (int) $r->total,
                'high_crit' => (int) $r->high_crit,
            ])
            ->toArray();
    }

    // ── 4. Most Vulnerable OS (top 10) ────────────────────────────────────
    private function byOs(string $range): array
    {
        return DB::table('incidents')
            ->selectRaw("
                NULLIF(TRIM(operating_system), '') AS os,
                COUNT(*) AS total,
                SUM(CASE WHEN severity IN ('Critical','High') THEN 1 ELSE 0 END) AS high_crit
            ")
            ->whereNotNull('operating_system')
            ->where('operating_system', '!=', '')
            ->when($range !== 'all', fn ($q) => $q->whereRaw(
                "COALESCE(reported_at, created_at) >= DATE_SUB(NOW(), INTERVAL ? DAY)", [(int) $range]
            ))
            ->groupBy('os')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'os'        => $r->os,
                'total'     => (int) $r->total,
                'high_crit' => (int) $r->high_crit,
            ])
            ->toArray();
    }

    // ── 5. Incidents by Category (top 12) ─────────────────────────────────
    private function byCategory(string $range): array
    {
        return DB::table('incidents')
            ->selectRaw("
                category,
                COUNT(*) AS total,
                SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) AS critical,
                SUM(CASE WHEN severity = 'High'     THEN 1 ELSE 0 END) AS high
            ")
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->when($range !== 'all', fn ($q) => $q->whereRaw(
                "COALESCE(reported_at, created_at) >= DATE_SUB(NOW(), INTERVAL ? DAY)", [(int) $range]
            ))
            ->groupBy('category')
            ->orderByDesc('total')
            ->limit(12)
            ->get()
            ->map(fn ($r) => [
                'category' => $r->category,
                'total'    => (int) $r->total,
                'critical' => (int) $r->critical,
                'high'     => (int) $r->high,
            ])
            ->toArray();
    }

    // ── 6. Repeat Incidents (same branch + category, count > 1) ──────────
    private function repeatIncidents(string $range): array
    {
        return DB::table('incidents')
            ->selectRaw("
                branch, category,
                COUNT(*) AS occurrences,
                MAX(COALESCE(reported_at, created_at)) AS last_seen,
                SUM(CASE WHEN severity IN ('Critical','High') THEN 1 ELSE 0 END) AS high_crit
            ")
            ->whereNotNull('branch')
            ->whereNotNull('category')
            ->when($range !== 'all', fn ($q) => $q->whereRaw(
                "COALESCE(reported_at, created_at) >= DATE_SUB(NOW(), INTERVAL ? DAY)", [(int) $range]
            ))
            ->groupBy('branch', 'category')
            ->havingRaw('COUNT(*) > 1')
            ->orderByDesc('occurrences')
            ->limit(12)
            ->get()
            ->map(fn ($r) => [
                'branch'      => $r->branch,
                'category'    => $r->category,
                'occurrences' => (int) $r->occurrences,
                'last_seen'   => $r->last_seen,
                'high_crit'   => (int) $r->high_crit,
            ])
            ->toArray();
    }

    // ── 7. Phishing Repeat Offenders (top 15) ─────────────────────────────
    private function phishingOffenders(string $range): array
    {
        return DB::table('incidents')
            ->selectRaw("
                reporter_name,
                COUNT(*) AS times,
                MAX(COALESCE(reported_at, created_at)) AS last_incident,
                GROUP_CONCAT(DISTINCT branch)     AS branches,
                GROUP_CONCAT(DISTINCT department) AS departments
            ")
            ->where('category', 'like', '%Phishing%')
            ->whereNotNull('reporter_name')
            ->where('reporter_name', '!=', '')
            ->when($range !== 'all', fn ($q) => $q->whereRaw(
                "COALESCE(reported_at, created_at) >= DATE_SUB(NOW(), INTERVAL ? DAY)", [(int) $range]
            ))
            ->groupBy('reporter_name')
            ->orderByDesc('times')
            ->limit(15)
            ->get()
            ->map(fn ($r) => [
                'reporter_name' => $r->reporter_name,
                'times'         => (int) $r->times,
                'last_incident' => $r->last_incident,
                'branches'      => $r->branches,
                'departments'   => $r->departments,
            ])
            ->toArray();
    }

    // ── 8. Monthly Trend (last 12 months — always full 12, ignores range) ──
    private function monthlyTrend(): array
    {
        // Pull all incidents with a date, group in PHP so it works on any DB driver
        $rows = DB::table('incidents')
            ->selectRaw('COALESCE(reported_at, created_at) AS dt, workflow_status')
            ->whereRaw('COALESCE(reported_at, created_at) IS NOT NULL')
            ->get()
            ->groupBy(fn ($r) => Carbon::parse($r->dt)->format('Y-m'));

        $trend = [];
        for ($i = 11; $i >= 0; $i--) {
            $dt      = now()->startOfMonth()->subMonths($i);
            $ym      = $dt->format('Y-m');
            $monthRows = $rows->has($ym) ? $rows->get($ym) : collect();
            $trend[] = [
                'label'     => $dt->format('M') . ' ' . substr($dt->format('Y'), 2),
                'month'     => $dt->format('M'),
                'year'      => $dt->format('Y'),
                'ym'        => $ym,
                'count'     => $monthRows->count(),
                'incidents' => $monthRows->count(), // Alias to match Dashboard interface
                'closed'    => $monthRows->where('workflow_status', 'closed')->count(),
            ];
        }

        return $trend;
    }

    // ── Helpers ────────────────────────────────────────────────────────────
    private function validatedRange(mixed $range): string
    {
        return array_key_exists((string) $range, self::RANGES) ? (string) $range : '90';
    }

    private function fmtDuration(?float $minutes): string
    {
        if ($minutes === null || $minutes <= 0) {
            return 'N/A';
        }
        $h = (int) floor($minutes / 60);
        $m = (int) round(fmod($minutes, 60));
        if ($h >= 48) {
            return round($h / 24, 1) . 'd';
        }
        if ($h >= 1) {
            return "{$h}h {$m}m";
        }

        return "{$m}m";
    }
}
