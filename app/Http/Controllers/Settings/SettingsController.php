<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SettingsController extends Controller
{
    // ── Tab list ──────────────────────────────────────────────────────────
    private const TABS = [
        'general'       => ['label' => 'General',           'icon' => 'fa-gear'],
        'appearance'    => ['label' => 'Appearance',        'icon' => 'fa-palette'],
        'security'      => ['label' => 'Security',          'icon' => 'fa-shield'],
        'notifications' => ['label' => 'Notifications',     'icon' => 'fa-bell'],
        'email'         => ['label' => 'Email Server',      'icon' => 'fa-envelope'],
        'integrations'  => ['label' => 'Integrations',      'icon' => 'fa-plug'],
        'backup'        => ['label' => 'Backup & Data',     'icon' => 'fa-database'],
        'audit'         => ['label' => 'Audit Log',         'icon' => 'fa-clipboard-list'],
        'samples'       => ['label' => 'Load Test Samples', 'icon' => 'fa-flask'],
        'about'         => ['label' => 'About',             'icon' => 'fa-circle-info'],
    ];

    // ── Module meta for audit log coloring ────────────────────────────────
    private const MOD_META = [
        'auth'         => ['color' => 'blue',    'icon' => 'fa-key',                 'label' => 'Auth'],
        'incidents'    => ['color' => 'amber',   'icon' => 'fa-triangle-exclamation','label' => 'Incidents'],
        'hardware'     => ['color' => 'sky',     'icon' => 'fa-server',              'label' => 'Hardware'],
        'software'     => ['color' => 'purple',  'icon' => 'fa-code',                'label' => 'Software'],
        'systems'      => ['color' => 'indigo',  'icon' => 'fa-display',             'label' => 'Systems'],
        'threat_intel' => ['color' => 'red',     'icon' => 'fa-shield-virus',        'label' => 'Threat Intel'],
        'risks'        => ['color' => 'orange',  'icon' => 'fa-circle-exclamation',  'label' => 'Risks'],
        'branches'     => ['color' => 'emerald', 'icon' => 'fa-building',            'label' => 'Branches'],
        'users'        => ['color' => 'cyan',    'icon' => 'fa-users',               'label' => 'Users'],
        'reports'      => ['color' => 'teal',    'icon' => 'fa-file-chart-column',   'label' => 'Reports'],
        'notifications'=> ['color' => 'pink',    'icon' => 'fa-bell',                'label' => 'Notifications'],
        'samples'      => ['color' => 'violet',  'icon' => 'fa-flask',               'label' => 'Samples'],
        'settings'     => ['color' => 'gray',    'icon' => 'fa-gear',                'label' => 'Settings'],
        'system'       => ['color' => 'slate',   'icon' => 'fa-circle-nodes',        'label' => 'System'],
    ];

    // ─────────────────────────────────────────────────────────────────────
    // MAIN PAGE — renders the tabbed settings page
    // ─────────────────────────────────────────────────────────────────────
    public function index(Request $request): Response
    {
        $tab = $request->input('tab', 'general');
        if (! array_key_exists($tab, self::TABS)) {
            $tab = 'general';
        }

        return Inertia::render('settings/index', [
            'tabs'         => self::TABS,
            'activeTab'    => $tab,
            'sampleCounts' => $this->getSampleCounts(),
            'auditData'    => $tab === 'audit' ? $this->getAuditData($request) : null,
            'modMeta'      => self::MOD_META,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // AUDIT LOG — JSON endpoint for live filter/page updates
    // ─────────────────────────────────────────────────────────────────────
    public function auditLog(Request $request): JsonResponse
    {
        return response()->json($this->getAuditData($request));
    }

    // ─────────────────────────────────────────────────────────────────────
    // EXPORT AUDIT LOG as CSV
    // ─────────────────────────────────────────────────────────────────────
    public function exportAudit(Request $request): StreamedResponse
    {
        $module = trim((string) $request->input('module', ''));
        $date   = trim((string) $request->input('date', ''));
        $search = trim((string) $request->input('q', ''));

        $query = AuditLog::query();
        if ($module !== '') {
            $query->where('module', $module);
        }
        if ($date !== '') {
            $query->whereRaw('DATE(created_at) = ?', [$date]);
        }
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('actor', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%")
                  ->orWhere('target', 'like', "%{$search}%")
                  ->orWhere('detail', 'like', "%{$search}%");
            });
        }

        $rows     = $query->orderByDesc('created_at')->limit(50000)->get();
        $filename = 'audit_log_' . now()->format('Ymd_His') . '.csv';

        AuditService::log('settings', 'audit_export_csv', null, 'Exported audit log as CSV');

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['ID', 'Actor', 'Role', 'Module', 'Action', 'Target', 'Detail', 'IP Address', 'Timestamp']);
            foreach ($rows as $r) {
                fputcsv($out, [
                    $r->id,
                    $r->actor,
                    $r->role,
                    $r->module,
                    $r->action,
                    $r->target,
                    $r->detail,
                    $r->ip_address,
                    optional($r->created_at)->format('Y-m-d H:i:s'),
                ]);
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    // ─────────────────────────────────────────────────────────────────────
    // SAMPLE COUNTS — JSON endpoint polled by the Samples tab
    // ─────────────────────────────────────────────────────────────────────
    public function sampleCounts(): JsonResponse
    {
        return response()->json($this->getSampleCounts());
    }

    // ─────────────────────────────────────────────────────────────────────
    // SEED SAMPLES — POST: seeds one module with demo data
    // ─────────────────────────────────────────────────────────────────────
    public function seedSamples(Request $request): JsonResponse
    {
        $target = $request->input('target', '');

        try {
            $result = match ($target) {
                'incidents'    => $this->seedIncidents(),
                'assets'       => $this->seedAssets(),
                'threat_intel' => $this->seedThreatIntel(),
                'systems'      => $this->seedSystems(),
                'branches'     => $this->seedBranches(),
                default        => throw new \InvalidArgumentException("Unknown target: {$target}"),
            };

            AuditService::log('samples', 'seed_samples', $target, "Seeded {$target} samples");

            return response()->json(array_merge(['errors' => []], $result));
        } catch (\Throwable $e) {
            return response()->json(['errors' => [$e->getMessage()]], 422);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // DELETE SAMPLES — POST: removes sample data for one or all modules
    // ─────────────────────────────────────────────────────────────────────
    public function deleteSamples(Request $request): JsonResponse
    {
        $target = $request->input('target', '');
        $deleted = [];

        try {
            $modules = $target === 'all'
                ? ['incidents', 'assets', 'threat_intel', 'systems', 'branches']
                : [$target];

            foreach ($modules as $mod) {
                $deleted[$mod] = match ($mod) {
                    'incidents'    => (int) rescue(
                        fn () => DB::table('incidents')->where('is_sample', 1)->delete(),
                        fn () => DB::table('incidents')->where('created_by', 'seeder')->delete(),
                        false
                    ),
                    'assets'       => (int) rescue(
                        fn () => DB::table('hardware')->where('is_sample', 1)->delete()
                               + DB::table('software')->where('is_sample', 1)->delete(),
                        fn () => DB::table('hardware')->where('created_by', 'seeder')->delete()
                               + DB::table('software')->where('created_by', 'seeder')->delete(),
                        false
                    ),
                    'threat_intel' => (int) rescue(
                        fn () => DB::table('threat_intel')->where('is_sample', 1)->delete(),
                        fn () => DB::table('threat_intel')->where('created_by', 'seeder')->orWhere('source', 'Sample Seeder')->delete(),
                        false
                    ),
                    // systems & branches use sys_id/code prefix 'SYS-'/'MAIN|CEBU|...' — delete by known seeded IDs
                    'systems'      => (int) rescue(
                        fn () => DB::table('systems')->where('created_by', 'seeder')->delete(),
                        0,
                        false
                    ),
                    'branches'     => (int) rescue(
                        fn () => DB::table('branch_security')
                                    ->whereIn('branch', ['Main Campus','Cebu Branch','Davao Branch',
                                        'Iloilo Branch','Cagayan de Oro','Baguio Branch','Data Center','Zamboanga Branch'])
                                    ->delete()
                               + DB::table('branches')->where('created_by', 'seeder')->delete(),
                        0,
                        false
                    ),
                    default        => 0,
                };
            }

            AuditService::log('samples', 'delete_samples', $target, 'Deleted sample data');

            return response()->json(['errors' => [], 'deleted' => $deleted]);
        } catch (\Throwable $e) {
            return response()->json(['errors' => [$e->getMessage()]], 422);
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═════════════════════════════════════════════════════════════════════

    private function getSampleCounts(): array
    {
        $count = fn(string $table, string $column, mixed $value): int => (int) rescue(
            fn() => DB::table($table)->where($column, $value)->count(),
            0,
            false
        );

        return [
            'incidents'    => $count('incidents', 'is_sample', 1),
            'hardware'     => $count('hardware', 'is_sample', 1),
            'software'     => $count('software', 'is_sample', 1),
            'threat_intel' => $count('threat_intel', 'is_sample', 1),
            'systems'      => $count('systems', 'created_by', 'seeder'),
            'branches'     => $count('branches', 'created_by', 'seeder'),
        ];
    }

    private function getAuditData(Request $request): array
    {
        $module  = trim((string) $request->input('module', ''));
        $date    = trim((string) $request->input('date', ''));
        $search  = trim((string) $request->input('q', ''));
        $page    = max(1, (int) $request->input('apage', 1));
        $perPage = 25;

        $query = AuditLog::query();
        if ($module !== '') {
            $query->where('module', $module);
        }
        if ($date !== '') {
            $query->whereRaw('DATE(created_at) = ?', [$date]);
        }
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('actor', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%")
                  ->orWhere('target', 'like', "%{$search}%")
                  ->orWhere('detail', 'like', "%{$search}%");
            });
        }

        $total      = $query->count();
        $totalPages = max(1, (int) ceil($total / $perPage));
        $page       = min($page, $totalPages);
        $offset     = ($page - 1) * $perPage;

        $rows = $query->orderByDesc('created_at')->skip($offset)->take($perPage)->get()
            ->map(fn (AuditLog $log) => [
                'id'         => $log->id,
                'actor'      => $log->actor,
                'role'       => $log->role,
                'module'     => $log->module,
                'action'     => $log->action,
                'target'     => $log->target,
                'detail'     => $log->detail,
                'ip_address' => $log->ip_address,
                'created_at' => optional($log->created_at)->format('M j, Y H:i:s'),
            ])->toArray();

        return [
            'rows'        => $rows,
            'total'       => $total,
            'page'        => $page,
            'perPage'     => $perPage,
            'totalPages'  => $totalPages,
            'filters'     => compact('module', 'date', 'search'),
            'modules'     => array_keys(self::MOD_META),
        ];
    }

    // ─────────────────────────────────────────────────────────────────────
    // SEEDERS
    // ─────────────────────────────────────────────────────────────────────

    private function seedIncidents(): array
    {
        $branches   = ['Main Campus', 'Cebu Branch', 'Davao Branch', 'Iloilo Branch',
                        'Cagayan de Oro', 'Baguio Branch', 'Zamboanga Branch'];
        $categories = ['Malware Infection', 'Ransomware', 'Virus', 'Phishing',
                        'Business Email Compromise', 'Website Defacement', 'Unauthorized Access',
                        'Lost Laptop', 'Lost Mobile Device', 'Data Leak', 'Network Outage',
                        'Denial of Service', 'Insider Threat', 'Social Engineering',
                        'Physical Security Incident', 'Policy Violation', 'Others'];
        $severities = ['Critical', 'High', 'Medium', 'Low'];
        $statuses   = ['reported', 'investigation', 'containment', 'recovery', 'closed'];
        $hostnames  = ['WS-001', 'WS-002', 'SRV-DB01', 'SRV-WEB01', 'LAPTOP-HR01',
                        'PC-IT-003', 'SRV-FILE01', 'LAPTOP-SEC02', null, null];

        $year = now()->year;
        $lastInc = DB::table('incidents')->whereYear('created_at', $year)->orderByDesc('id')->value('incident_number');
        $startSeq = 0;
        if ($lastInc && preg_match('/INC-\d{4}-(\d+)/', $lastInc, $m)) {
            $startSeq = (int) $m[1];
        }

        $inserted = 0;
        for ($i = 1; $i <= 85; $i++) {
            $incidentAt = now()->subDays(random_int(1, 365))->subHours(random_int(0, 23));
            $seq = $startSeq + $i;
            $num = sprintf('INC-%04d-%04d', $year, $seq);

            // Ensure uniqueness across the whole table if any prior year has this exact string
            while (DB::table('incidents')->where('incident_number', $num)->exists()) {
                $seq++;
                $num = sprintf('INC-%04d-%04d', $year, $seq);
            }

            DB::table('incidents')->insert([
                'incident_number'  => $num,
                'incident_at'      => $incidentAt,
                'reported_at'      => $incidentAt->copy()->addMinutes(random_int(5, 120)),
                'branch'           => $branches[array_rand($branches)],
                'severity'         => $severities[array_rand($severities)],
                'category'         => $categories[array_rand($categories)],
                'description'      => "Sample incident #{$i}: Security event detected and logged for testing.",
                'users_affected'   => random_int(0, 20),
                'hostname'         => $hostnames[array_rand($hostnames)],
                'workflow_status'  => $statuses[array_rand($statuses)],
                'is_sample'        => 1,
                'created_by'       => 'seeder',
                'created_at'       => $incidentAt,
                'updated_at'       => now(),
            ]);
            $inserted++;
        }

        return ['inserted' => $inserted];
    }

    private function seedAssets(): array
    {
        $branches   = ['Main Campus', 'Cebu Branch', 'Davao Branch', 'Iloilo Branch', 'Cagayan de Oro'];
        $hwInserted = 0;
        $swInserted = 0;

        $hwItems = [
            ['type' => 'Desktop', 'manufacturer' => 'Dell',   'model' => 'OptiPlex 7010'],
            ['type' => 'Laptop',  'manufacturer' => 'Lenovo', 'model' => 'ThinkPad X1 Carbon'],
            ['type' => 'Server',  'manufacturer' => 'HPE',    'model' => 'ProLiant DL380 Gen11'],
            ['type' => 'Switch',  'manufacturer' => 'Cisco',  'model' => 'Catalyst 9300-48P'],
            ['type' => 'Printer', 'manufacturer' => 'HP',     'model' => 'LaserJet Pro MFP 4101'],
        ];

        $lastHw = DB::table('hardware')->orderByRaw("CAST(SUBSTRING(tag, 4) AS UNSIGNED) DESC")->value('tag');
        $hwStart = $lastHw ? (int) substr($lastHw, 3) : 0;

        for ($i = 1; $i <= 25; $i++) {
            $hw = $hwItems[($i - 1) % count($hwItems)];
            $tag = 'HW-' . str_pad((string) ($hwStart + $i), 4, '0', STR_PAD_LEFT);

            DB::table('hardware')->insert([
                'tag'          => $tag,
                'name'         => $hw['manufacturer'] . ' ' . $hw['model'],
                'type'         => $hw['type'],
                'manufacturer' => $hw['manufacturer'],
                'model'        => $hw['model'],
                'serial'       => 'SN-SAMPLE-' . ($hwStart + $i),
                'branch'       => $branches[array_rand($branches)],
                'status'       => 'Active',
                'is_sample'    => 1,
                'created_by'   => 'seeder',
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
            $hwInserted++;
        }

        $swItems = [
            ['name' => 'Microsoft 365 Business Premium', 'category' => 'Productivity', 'vendor' => 'Microsoft', 'total_licenses' => 100, 'used_licenses' => 85],
            ['name' => 'Kaspersky Endpoint Security',    'category' => 'Security',     'vendor' => 'Kaspersky', 'total_licenses' => 150, 'used_licenses' => 120],
            ['name' => 'SAP S/4HANA Finance',            'category' => 'ERP',          'vendor' => 'SAP',       'total_licenses' => 25,  'used_licenses' => 20],
            ['name' => 'Oracle HRMS PeopleSoft',         'category' => 'HRIS',         'vendor' => 'Oracle',    'total_licenses' => 50,  'used_licenses' => 45],
            ['name' => 'Moodle LMS',                     'category' => 'LMS',          'vendor' => 'Moodle',    'total_licenses' => 500, 'used_licenses' => 380],
        ];

        $lastSw = DB::table('software')->orderByRaw("CAST(SUBSTRING(sw_id, 4) AS UNSIGNED) DESC")->value('sw_id');
        $swStart = $lastSw ? (int) substr($lastSw, 3) : 0;

        for ($i = 1; $i <= 25; $i++) {
            $sw = $swItems[($i - 1) % count($swItems)];
            $swId = 'SW-' . str_pad((string) ($swStart + $i), 4, '0', STR_PAD_LEFT);

            DB::table('software')->insert([
                'sw_id'          => $swId,
                'name'           => $sw['name'],
                'category'       => $sw['category'],
                'vendor'         => $sw['vendor'],
                'total_licenses' => $sw['total_licenses'],
                'used_licenses'  => $sw['used_licenses'],
                'is_sample'      => 1,
                'created_by'     => 'seeder',
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
            $swInserted++;
        }

        return ['hw_inserted' => $hwInserted, 'sw_inserted' => $swInserted];
    }

    private function seedThreatIntel(): array
    {
        $statuses    = ['Active', 'Inactive', 'Whitelisted'];
        $confidences = ['Low', 'Medium', 'High'];
        $inserted    = 0;

        $samples = [
            ['type' => 'Phishing Domain', 'value' => 'secure-banking-update.xyz',     'severity' => 'High'],
            ['type' => 'Malicious IP',    'value' => '185.220.101.47',                'severity' => 'Critical'],
            ['type' => 'Malicious IP',    'value' => '91.108.4.0',                    'severity' => 'High'],
            ['type' => 'Blocked IP',      'value' => '198.51.100.23',                 'severity' => 'Medium'],
            ['type' => 'Malware Hash',    'value' => 'a3f4c5d9e8b2f1a0c7d6e5f4a3b2',  'severity' => 'Critical'],
            ['type' => 'Suspicious URL',  'value' => 'http://malware-cdn.ru/payload', 'severity' => 'High'],
        ];

        // Find last ioc_id sequence
        $lastIoc = DB::table('threat_intel')->orderByRaw("CAST(SUBSTRING(ioc_id, 5) AS UNSIGNED) DESC")->value('ioc_id');
        $startNum = $lastIoc ? (int) substr($lastIoc, 4) : 0;

        for ($i = 1; $i <= 25; $i++) {
            $s = $samples[($i - 1) % count($samples)];
            $iocId = 'IOC-' . str_pad((string) ($startNum + $i), 5, '0', STR_PAD_LEFT);

            DB::table('threat_intel')->insert([
                'ioc_id'      => $iocId,
                'type'        => $s['type'],
                'value'       => $s['value'] . '-' . $i,
                'severity'    => $s['severity'],
                'status'      => $statuses[array_rand($statuses)],
                'confidence'  => $confidences[array_rand($confidences)],
                'source'      => 'Sample Seeder',
                'description' => "Sample threat indicator #{$i} for testing purposes.",
                'first_seen'  => now()->subDays(random_int(10, 180)),
                'last_seen'   => now()->subDays(random_int(1, 10)),
                'expiry_date' => now()->addDays(random_int(30, 365)),
                'is_sample'   => 1,
                'created_by'  => 'seeder',
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
            $inserted++;
        }

        return ['inserted' => $inserted];
    }

    private function seedSystems(): array
    {
        $items = [
            'HRIS', 'Enrollment Portal', 'Financial Management System', 'LMS (Moodle)',
            'Library System', 'Payroll System', 'Corporate Website', 'Biometric T&A',
            'IT Service Desk', 'Mobile Banking App', 'Accounting (QuickBooks)',
            'Inventory System', 'Email (M365)', 'Network Monitoring (PRTG)', 'Cybersec Portal',
        ];
        $criticalities = ['Critical', 'High', 'Medium', 'Low'];
        $hostings      = ['On-Premise', 'Cloud (AWS)', 'Cloud (Azure)', 'Hybrid'];
        $categories    = ['Web Application', 'Desktop', 'Mobile', 'Infrastructure', 'Network', 'Other'];
        $inserted      = 0;

        foreach (array_slice($items, 0, 15) as $idx => $name) {
            // Skip if already exists (idempotent)
            if (DB::table('systems')->where('sys_id', 'SYS-' . str_pad((string)($idx + 1), 4, '0', STR_PAD_LEFT))->exists()) {
                continue;
            }
            DB::table('systems')->insert([
                'sys_id'      => 'SYS-' . str_pad((string) ($idx + 1), 4, '0', STR_PAD_LEFT),
                'name'        => $name,
                'category'    => $categories[array_rand($categories)],
                'owner'       => 'IT Department',
                'vendor'      => 'Sample Vendor ' . ($idx + 1),
                'hosting'     => $hostings[array_rand($hostings)],
                'criticality' => $criticalities[array_rand($criticalities)],
                'status'      => 'Active',
                'created_by'  => 'seeder',
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
            $inserted++;
        }

        return ['inserted' => $inserted];
    }

    private function seedBranches(): array
    {
        $branchData = [
            ['code' => 'MAIN', 'name' => 'Main Campus',      'location' => 'Manila, Philippines',         'type' => 'HQ',          'status' => 'Active'],
            ['code' => 'CEBU', 'name' => 'Cebu Branch',      'location' => 'Cebu City, Philippines',      'type' => 'Satellite',   'status' => 'Active'],
            ['code' => 'DAVO', 'name' => 'Davao Branch',     'location' => 'Davao City, Philippines',     'type' => 'Satellite',   'status' => 'Active'],
            ['code' => 'ILO',  'name' => 'Iloilo Branch',    'location' => 'Iloilo City, Philippines',    'type' => 'Satellite',   'status' => 'Active'],
            ['code' => 'CDO',  'name' => 'Cagayan de Oro',   'location' => 'Cagayan de Oro, Philippines', 'type' => 'Satellite',   'status' => 'Active'],
            ['code' => 'BAG',  'name' => 'Baguio Branch',    'location' => 'Baguio City, Philippines',    'type' => 'Remote',      'status' => 'Active'],
            ['code' => 'DC',   'name' => 'Data Center',      'location' => 'Manila, Philippines',         'type' => 'Data Center', 'status' => 'Active'],
            ['code' => 'ZAM',  'name' => 'Zamboanga Branch', 'location' => 'Zamboanga City, Philippines', 'type' => 'Satellite',   'status' => 'Planned'],
        ];
        $branchCount   = 0;
        $securityCount = 0;

        foreach ($branchData as $b) {
            $exists = DB::table('branches')->where('name', $b['name'])->exists();
            if (! $exists) {
                DB::table('branches')->insert([
                    'code'       => $b['code'],
                    'name'       => $b['name'],
                    'location'   => $b['location'],
                    'type'       => $b['type'],
                    'status'     => $b['status'],
                    'created_by' => 'seeder',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $branchCount++;
            }

            if ($b['status'] === 'Active') {
                $secExists = DB::table('branch_security')->where('branch', $b['name'])->exists();
                if (! $secExists) {
                    $total = random_int(10, 100);
                    DB::table('branch_security')->insert([
                        'branch'              => $b['name'],
                        'computers_total'     => $total,
                        'computers_online'    => random_int(5, $total),
                        'computers_offline'   => random_int(0, 10),
                        'computers_outdated'  => random_int(0, 15),
                        'computers_patched'   => random_int(5, $total),
                        'computers_encrypted' => random_int(5, $total),
                        'antivirus'           => random_int(1, 3),
                        'firewall'            => random_int(1, 3),
                        'disk_encryption'     => random_int(1, 3),
                        'password_policy'     => random_int(1, 3),
                        'mfa'                 => random_int(1, 3),
                        'backup_status'       => random_int(1, 3),
                        'updated_at'          => now(),
                    ]);
                    $securityCount++;
                }
            }
        }

        return ['branches' => $branchCount, 'security' => $securityCount];
    }
}
