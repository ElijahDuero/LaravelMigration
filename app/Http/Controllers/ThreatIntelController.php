<?php

namespace App\Http\Controllers;

use App\Models\ThreatIntel;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ThreatIntelController extends Controller
{
    // ── Index ─────────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $query = ThreatIntel::query();

        if ($s = trim((string) $request->input('search', ''))) {
            $like = "%{$s}%";
            $query->where(function ($q) use ($like) {
                $q->where('value',       'like', $like)
                  ->orWhere('source',      'like', $like)
                  ->orWhere('tags',        'like', $like)
                  ->orWhere('description', 'like', $like)
                  ->orWhere('ioc_id',      'like', $like);
            });
        }

        if ($v = $request->input('type'))     $query->where('type',     $v);
        if ($v = $request->input('severity')) $query->where('severity', $v);
        if ($v = $request->input('status'))   $query->where('status',   $v);

        $indicators = $query->orderByDesc('id')->get();

        // Type counts for category cards
        $typeCounts = ThreatIntel::selectRaw('type, COUNT(*) as cnt')
            ->groupBy('type')
            ->pluck('cnt', 'type')
            ->toArray();

        return Inertia::render('threat_intel/index', [
            'indicators' => $indicators,
            'stats'      => $this->stats(),
            'typeCounts' => $typeCounts,
            'filters'    => $request->only(['search', 'type', 'severity', 'status']),
        ]);
    }

    // ── Create ────────────────────────────────────────────────────────────────

    public function create()
    {
        return Inertia::render('threat_intel/create', [
            'nextIocId' => $this->nextIocId(),
        ]);
    }

    // ── Store ─────────────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $iocId = $this->nextIocId();

        $ioc = ThreatIntel::create(array_merge($data, [
            'ioc_id'     => $iocId,
            'created_by' => Auth::user()->username ?? Auth::user()->email,
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        AuditService::log(
            'threat_intel', 'ioc_created', $iocId,
            "Added indicator {$iocId} — Type: {$ioc->type} | Severity: {$ioc->severity}"
        );

        return redirect()->route('threat_intel.show', $ioc->id)
            ->with('success', "Indicator {$iocId} added successfully.");
    }

    // ── Show ──────────────────────────────────────────────────────────────────

    public function show(int $id)
    {
        $ioc = ThreatIntel::findOrFail($id);

        return Inertia::render('threat_intel/view', ['indicator' => $ioc]);
    }

    // ── Edit ──────────────────────────────────────────────────────────────────

    public function edit(int $id)
    {
        $ioc = ThreatIntel::findOrFail($id);

        return Inertia::render('threat_intel/edit', ['indicator' => $ioc]);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function update(Request $request, int $id)
    {
        $ioc  = ThreatIntel::findOrFail($id);
        $data = $this->validated($request);

        $ioc->update(array_merge($data, ['updated_at' => now()]));

        AuditService::log('threat_intel', 'ioc_updated', $ioc->ioc_id, "Updated indicator {$ioc->ioc_id}");

        return redirect()->route('threat_intel.show', $ioc->id)
            ->with('success', "Indicator {$ioc->ioc_id} updated.");
    }

    // ── Destroy ───────────────────────────────────────────────────────────────

    public function destroy(int $id)
    {
        $ioc   = ThreatIntel::findOrFail($id);
        $iocId = $ioc->ioc_id;
        $value = $ioc->value;
        $ioc->delete();

        AuditService::log('threat_intel', 'ioc_deleted', $iocId, "Deleted indicator {$iocId} — {$value}");

        return redirect()->route('threat_intel.index')
            ->with('success', "Indicator {$iocId} deleted.");
    }

    public function deleteAll(Request $request)
    {
        $count = ThreatIntel::query()->delete();
        AuditService::log('threat_intel', 'delete_all', 'all', "Deleted all {$count} threat indicators");

        return redirect()->route('threat_intel.index')
            ->with('success', "All {$count} threat indicators have been deleted.");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function validated(Request $request): array
    {
        return $request->validate([
            'type'         => 'required|in:Phishing Domain,Malicious IP,Blocked IP,IOC,Malware Hash,Suspicious URL',
            'value'        => 'required|string|max:500',
            'severity'     => 'required|in:Low,Medium,High,Critical',
            'status'       => 'required|in:Active,Inactive,Whitelisted',
            'confidence'   => 'nullable|in:Low,Medium,High',
            'source'       => 'nullable|string|max:255',
            'tags'         => 'nullable|string|max:500',
            'description'  => 'nullable|string',
            'first_seen'   => 'nullable|date',
            'last_seen'    => 'nullable|date',
            'expiry_date'  => 'nullable|date',
            'misp_event'   => 'nullable|string|max:255',
            'vt_permalink' => 'nullable|string|max:500',
            'abuse_report' => 'nullable|string|max:500',
        ]);
    }

    private function nextIocId(): string
    {
        $last = ThreatIntel::orderByRaw("CAST(SUBSTRING(ioc_id, 5) AS UNSIGNED) DESC")
            ->value('ioc_id');

        if (!$last) return 'IOC-00001';
        $num = (int) substr($last, 4);
        return 'IOC-' . str_pad($num + 1, 5, '0', STR_PAD_LEFT);
    }

    private function stats(): array
    {
        $all = ThreatIntel::select('severity', 'status')->get();
        return [
            'total'    => $all->count(),
            'active'   => $all->where('status', 'Active')->count(),
            'critical' => $all->where('severity', 'Critical')->count(),
            'high'     => $all->where('severity', 'High')->count(),
        ];
    }
}
