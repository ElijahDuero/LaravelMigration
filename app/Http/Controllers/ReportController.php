<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\BranchSecurity;
use App\Models\Hardware;
use App\Models\Incident;
use App\Models\Software;
use App\Models\SystemRegistry;
use App\Models\ThreatIntel;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    private const TEMPLATES = [
        'executive' => 'Executive KPI Summary',
        'incidents_by_severity' => 'Incidents by Severity',
        'branch_performance' => 'Branch Performance',
        'asset_status' => 'Asset Status',
    ];

    public function index(Request $request)
    {
        $filters = $this->filters($request);

        return Inertia::render('reports/index', [
            'templates' => self::TEMPLATES,
            'filters' => $filters,
            'report' => $this->buildReport($filters),
            'history' => $this->history(),
        ]);
    }

    public function data(Request $request)
    {
        $filters = $this->filters($request);

        return response()->json([
            'ts' => now()->format('Y-m-d H:i:s'),
            'report' => $this->buildReport($filters),
            'history' => $this->history(),
        ]);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $filters = $this->filters($request);
        $report = $this->buildReport($filters);
        $filename = 'cybersec-' . $filters['template'] . '-' . now()->format('Ymd-His') . '.csv';

        AuditService::log('reports', 'report_export_csv', $filters['template'], $this->historyDetail($filters));

        return response()->streamDownload(function () use ($filters, $report) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Report', self::TEMPLATES[$filters['template']] ?? $filters['template']]);
            fputcsv($out, ['Date From', $filters['date_from'] ?: 'All']);
            fputcsv($out, ['Date To', $filters['date_to'] ?: 'All']);
            fputcsv($out, []);

            foreach ($this->csvRows($filters['template'], $report) as $row) {
                fputcsv($out, $row);
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    public function exportPdf(Request $request)
    {
        $filters = $this->filters($request);
        $report = $this->buildReport($filters);

        AuditService::log('reports', 'report_export_pdf', $filters['template'], $this->historyDetail($filters));

        return response($this->printHtml($filters, $report))
            ->header('Content-Type', 'text/html; charset=UTF-8');
    }

    private function filters(Request $request): array
    {
        $template = (string) $request->input('template', 'executive');
        if (! array_key_exists($template, self::TEMPLATES)) {
            $template = 'executive';
        }

        return [
            'template' => $template,
            'date_from' => $this->dateOrNull($request->input('date_from')),
            'date_to' => $this->dateOrNull($request->input('date_to')),
        ];
    }

    private function dateOrNull(mixed $value): ?string
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

    private function incidentQuery(array $filters)
    {
        $query = DB::table('incidents');

        if ($filters['date_from']) {
            $query->whereRaw('DATE(COALESCE(reported_at, created_at)) >= ?', [$filters['date_from']]);
        }
        if ($filters['date_to']) {
            $query->whereRaw('DATE(COALESCE(reported_at, created_at)) <= ?', [$filters['date_to']]);
        }

        return $query;
    }

    private function buildReport(array $filters): array
    {
        $incStats = (clone $this->incidentQuery($filters))->selectRaw("\n            COUNT(*) AS total,\n            SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) AS critical,\n            SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END) AS high,\n            SUM(CASE WHEN workflow_status NOT IN ('closed','draft') THEN 1 ELSE 0 END) AS open,\n            SUM(CASE WHEN workflow_status = 'closed' THEN 1 ELSE 0 END) AS closed,\n            SUM(CASE WHEN severity IN ('Critical','High') AND workflow_status NOT IN ('closed','draft') THEN 1 ELSE 0 END) AS open_critical\n        ")->first();

        $total = (int) ($incStats->total ?? 0);
        $closed = (int) ($incStats->closed ?? 0);

        $severity = ['Critical' => 0, 'High' => 0, 'Medium' => 0, 'Low' => 0];
        (clone $this->incidentQuery($filters))
            ->selectRaw('severity, COUNT(*) AS count')
            ->whereNotNull('severity')
            ->groupBy('severity')
            ->get()
            ->each(function ($row) use (&$severity) {
                if (array_key_exists($row->severity, $severity)) {
                    $severity[$row->severity] = (int) $row->count;
                }
            });

        $branchRows = (clone $this->incidentQuery($filters))
            ->selectRaw("\n                branch,\n                COUNT(*) AS total,\n                SUM(CASE WHEN severity IN ('Critical','High') THEN 1 ELSE 0 END) AS high_crit,\n                SUM(CASE WHEN workflow_status = 'closed' THEN 1 ELSE 0 END) AS closed\n            ")
            ->whereNotNull('branch')
            ->where('branch', '!=', '')
            ->groupBy('branch')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'branch' => $row->branch,
                'total' => (int) $row->total,
                'high_crit' => (int) $row->high_crit,
                'closed' => (int) $row->closed,
                'closure_rate' => (int) round(((int) $row->closed / max(1, (int) $row->total)) * 100),
            ])
            ->values()
            ->toArray();

        $branchScores = BranchSecurity::orderBy('branch')->get()
            ->map(fn (BranchSecurity $row) => [
                'branch' => $row->branch,
                'score' => (int) $row->score,
                'patch' => (int) round(((int) $row->computers_patched / max(1, (int) $row->computers_total)) * 100),
                'encrypted' => (int) round(((int) $row->computers_encrypted / max(1, (int) $row->computers_total)) * 100),
                'computers_total' => (int) $row->computers_total,
            ])
            ->sortBy('score')
            ->values()
            ->toArray();

        $hardwareStatus = Hardware::selectRaw('status, COUNT(*) AS count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->map(fn ($v) => (int) $v)
            ->toArray();

        $softwareTotal = Software::count();
        $usedLicenses = (int) Software::sum('used_licenses');
        $totalLicenses = (int) Software::sum('total_licenses');

        $patchRow = DB::table('branch_security')->selectRaw('SUM(computers_total) AS total, SUM(computers_patched) AS patched')->first();
        $patchPct = (int) round(((int) ($patchRow->patched ?? 0) / max(1, (int) ($patchRow->total ?? 0))) * 100);

        $incidentDurations = Incident::with('history')
            ->when($filters['date_from'], fn ($q, $date) => $q->whereRaw('DATE(COALESCE(reported_at, created_at)) >= ?', [$date]))
            ->when($filters['date_to'], fn ($q, $date) => $q->whereRaw('DATE(COALESCE(reported_at, created_at)) <= ?', [$date]))
            ->whereNotNull('incident_at')
            ->get();

        $mttrValues = [];
        $mttdValues = [];
        foreach ($incidentDurations as $incident) {
            $start = $incident->incident_at ? Carbon::parse($incident->incident_at) : null;
            if (! $start) {
                continue;
            }

            $reportedAt = $incident->history->where('status', 'reported')->sortBy('created_at')->first()?->created_at;
            $closedAt = $incident->history->where('status', 'closed')->sortBy('created_at')->first()?->created_at;

            if ($reportedAt) {
                $mttdValues[] = $start->diffInMinutes(Carbon::parse($reportedAt), false);
            }
            if ($closedAt) {
                $mttrValues[] = $start->diffInMinutes(Carbon::parse($closedAt), false);
            }
        }

        $avgMttr = count($mttrValues) ? array_sum($mttrValues) / count($mttrValues) : 0;
        $avgMttd = count($mttdValues) ? array_sum($mttdValues) / count($mttdValues) : 0;
        $complianceScore = count($branchScores) > 0
            ? (int) round(array_sum(array_column($branchScores, 'score')) / count($branchScores))
            : 0;

        // ── Patch / encryption totals ──────────────────────────────────────
        $noAvBranches = BranchSecurity::where('antivirus', '<', 2)->count();

        // ── Top attacked systems ───────────────────────────────────────────
        // Use a subquery so the outer GROUP BY references the plain alias `sys`,
        // fully avoiding MySQL ONLY_FULL_GROUP_BY complaints about hostname/device.
        $innerQuery = (clone $this->incidentQuery($filters))
            ->selectRaw("COALESCE(NULLIF(TRIM(hostname),''), NULLIF(TRIM(device),''), 'Unknown') AS sys,
                CASE WHEN severity IN ('Critical','High') THEN 1 ELSE 0 END AS is_high_crit");

        $topSystems = DB::table(DB::raw("({$innerQuery->toSql()}) AS inc"))
            ->mergeBindings($innerQuery)
            ->selectRaw('sys, COUNT(*) AS total, SUM(is_high_crit) AS high_crit')
            ->groupBy('sys')
            ->orderByDesc('total')
            ->limit(8)
            ->get()
            ->map(fn ($r) => ['sys' => $r->sys, 'total' => (int) $r->total, 'high_crit' => (int) $r->high_crit])
            ->toArray();

        // ── Threat intelligence ────────────────────────────────────────────
        $tiRow = DB::table('threat_intel')->selectRaw("
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'Active'              THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN severity = 'Critical'           THEN 1 ELSE 0 END) AS critical,
            SUM(CASE WHEN type = 'Phishing Domain'        THEN 1 ELSE 0 END) AS phishing,
            SUM(CASE WHEN type IN ('Malicious IP','Blocked IP') THEN 1 ELSE 0 END) AS ips,
            SUM(CASE WHEN type = 'Malware Hash'           THEN 1 ELSE 0 END) AS malware,
            SUM(CASE WHEN expiry_date IS NOT NULL
                 AND expiry_date < CURDATE()
                 AND status = 'Active'                   THEN 1 ELSE 0 END) AS expired
        ")->first();

        // ── Risk heat map: category × severity matrix ─────────────────────
        $heatCategories = ['Phishing', 'Malware Infection', 'Unauthorized Access', 'Ransomware', 'Insider Threat', 'Others'];
        $heatSeverities = ['Low', 'Medium', 'High', 'Critical'];

        $rawHeat = (clone $this->incidentQuery($filters))
            ->selectRaw('category, severity, COUNT(*) AS cnt')
            ->whereNotNull('category')
            ->whereNotNull('severity')
            ->groupBy('category', 'severity')
            ->get();

        $heatLookup = [];
        foreach ($rawHeat as $r) {
            $heatLookup[$r->category][$r->severity] = (int) $r->cnt;
        }

        $heatMatrix = [];
        foreach ($heatCategories as $cat) {
            $row = ['category' => $cat];
            $rowTotal = 0;
            foreach ($heatSeverities as $sev) {
                $val = $heatLookup[$cat][$sev] ?? 0;
                $row[$sev] = $val;
                $rowTotal += $val;
            }
            $row['total'] = $rowTotal;
            $heatMatrix[] = $row;
        }

        return [
            'period' => $this->periodLabel($filters),
            'kpis' => [
                'total_incidents' => $total,
                'critical' => (int) ($incStats->critical ?? 0),
                'open' => (int) ($incStats->open ?? 0),
                'closed' => $closed,
                'open_critical' => (int) ($incStats->open_critical ?? 0),
                'closure_rate' => (int) round($closed / max(1, $total) * 100),
                'mttr' => $this->duration((float) $avgMttr),
                'mttd' => $this->duration((float) $avgMttd),
                'compliance_score' => $complianceScore,
                'patch_pct' => $patchPct,
                'hardware_total' => Hardware::count(),
                'software_total' => $softwareTotal,
                'systems_total' => SystemRegistry::count(),
                'threats_active' => ThreatIntel::where('status', 'Active')->count(),
                'no_av_branches' => $noAvBranches,
            ],
            'severity' => $severity,
            'branches' => $branchRows,
            'branch_scores' => $branchScores,
            'top_systems' => $topSystems,
            'threat_intel' => [
                'total'    => (int) ($tiRow->total    ?? 0),
                'active'   => (int) ($tiRow->active   ?? 0),
                'critical' => (int) ($tiRow->critical ?? 0),
                'phishing' => (int) ($tiRow->phishing ?? 0),
                'ips'      => (int) ($tiRow->ips      ?? 0),
                'malware'  => (int) ($tiRow->malware  ?? 0),
                'expired'  => (int) ($tiRow->expired  ?? 0),
            ],
            'heat' => $heatMatrix,
            'assets' => [
                'hardware_status' => $hardwareStatus,
                'software_total' => $softwareTotal,
                'used_licenses' => $usedLicenses,
                'total_licenses' => $totalLicenses,
                'license_utilization' => (int) round($usedLicenses / max(1, $totalLicenses) * 100),
                'hardware_by_branch' => (function () {
                    $inner = DB::table('hardware')
                        ->selectRaw("COALESCE(NULLIF(branch,''), 'Unassigned') AS branch_label");
                    return DB::table(DB::raw("({$inner->toSql()}) AS hw"))
                        ->mergeBindings($inner)
                        ->selectRaw('branch_label AS branch, COUNT(*) AS count')
                        ->groupBy('branch_label')
                        ->orderByDesc('count')
                        ->limit(8)
                        ->get()
                        ->map(fn ($row) => ['branch' => $row->branch, 'count' => (int) $row->count])
                        ->toArray();
                })(),
            ],
        ];
    }

    private function csvRows(string $template, array $report): array
    {
        if ($template === 'incidents_by_severity') {
            $rows = [['Severity', 'Count', 'Percent']];
            $total = max(1, (int) $report['kpis']['total_incidents']);
            foreach ($report['severity'] as $label => $count) {
                $rows[] = [$label, $count, round($count / $total * 100) . '%'];
            }
            return $rows;
        }

        if ($template === 'branch_performance') {
            $rows = [['Branch', 'Incidents', 'Critical/High', 'Closed', 'Closure Rate', 'Security Score', 'Patch Compliance']];
            foreach ($report['branch_scores'] as $score) {
                $inc = collect($report['branches'])->firstWhere('branch', $score['branch']) ?? [];
                $rows[] = [$score['branch'], $inc['total'] ?? 0, $inc['high_crit'] ?? 0, $inc['closed'] ?? 0, ($inc['closure_rate'] ?? 0) . '%', $score['score'] . '%', $score['patch'] . '%'];
            }
            return $rows;
        }

        if ($template === 'asset_status') {
            $rows = [['Metric', 'Value']];
            foreach ($report['assets']['hardware_status'] as $status => $count) {
                $rows[] = ['Hardware: ' . $status, $count];
            }
            $rows[] = ['Software records', $report['assets']['software_total']];
            $rows[] = ['License utilization', $report['assets']['license_utilization'] . '%'];
            $rows[] = ['Systems registered', $report['kpis']['systems_total']];
            return $rows;
        }

        return [
            ['Metric', 'Value'],
            ['Total incidents', $report['kpis']['total_incidents']],
            ['Critical incidents', $report['kpis']['critical']],
            ['Open incidents', $report['kpis']['open']],
            ['Closure rate', $report['kpis']['closure_rate'] . '%'],
            ['MTTR', $report['kpis']['mttr']],
            ['MTTD', $report['kpis']['mttd']],
            ['Compliance score', $report['kpis']['compliance_score'] . '%'],
            ['Patch compliance', $report['kpis']['patch_pct'] . '%'],
            ['Active threat indicators', $report['kpis']['threats_active']],
        ];
    }

    private function printHtml(array $filters, array $report): string
    {
        $title = e(self::TEMPLATES[$filters['template']] ?? 'Report');
        $rows = '';
        foreach ($this->csvRows($filters['template'], $report) as $row) {
            $cells = array_map(fn ($cell) => '<td>' . e((string) $cell) . '</td>', $row);
            $rows .= '<tr>' . implode('', $cells) . '</tr>';
        }

        return '<!doctype html><html><head><meta charset="utf-8"><title>' . $title . '</title><style>body{font-family:Arial,sans-serif;color:#111827;padding:32px}h1{margin:0 0 6px;font-size:24px}.meta{color:#6b7280;margin-bottom:24px}table{border-collapse:collapse;width:100%}td{border:1px solid #e5e7eb;padding:10px;font-size:13px}tr:first-child td{font-weight:700;background:#f3f4f6}@media print{button{display:none}}</style></head><body><button onclick="window.print()" style="float:right;padding:8px 12px">Print / Save PDF</button><h1>' . $title . '</h1><div class="meta">' . e($report['period']) . ' | Generated ' . e(now()->format('Y-m-d H:i:s')) . '</div><table>' . $rows . '</table><script>setTimeout(function(){window.print()},300)</script></body></html>';
    }

    private function history(): array
    {
        return AuditLog::where('module', 'reports')
            ->whereIn('action', ['report_export_csv', 'report_export_pdf'])
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(fn (AuditLog $log) => [
                'id' => $log->id,
                'actor' => $log->actor,
                'action' => $log->action,
                'target' => $log->target,
                'detail' => $log->detail,
                'created_at' => optional($log->created_at)->format('Y-m-d H:i:s'),
            ])
            ->toArray();
    }

    private function historyDetail(array $filters): string
    {
        return 'Generated ' . (self::TEMPLATES[$filters['template']] ?? $filters['template']) . ' for ' . $this->periodLabel($filters);
    }

    private function periodLabel(array $filters): string
    {
        if ($filters['date_from'] && $filters['date_to']) {
            return $filters['date_from'] . ' to ' . $filters['date_to'];
        }
        if ($filters['date_from']) {
            return 'From ' . $filters['date_from'];
        }
        if ($filters['date_to']) {
            return 'Through ' . $filters['date_to'];
        }
        return 'All available records';
    }

    private function duration(float $minutes): string
    {
        if ($minutes <= 0) {
            return 'N/A';
        }

        $hours = (int) floor($minutes / 60);
        $mins = (int) round(fmod($minutes, 60));
        if ($hours >= 24) {
            return round($hours / 24, 1) . 'd';
        }

        return $hours > 0 ? "{$hours}h {$mins}m" : "{$mins}m";
    }
}


