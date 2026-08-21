<?php

namespace App\Http\Controllers;

use App\Models\Risk;
use App\Models\Branch;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RiskController extends Controller
{
    // ── Index (main Risk Register page) ──────────────────────────────────────

    public function index(Request $request)
    {
        $query = Risk::query();

        if ($s = trim((string) $request->input('search', ''))) {
            $like = "%{$s}%";
            $query->where(function ($q) use ($like) {
                $q->where('title',      'like', $like)
                  ->orWhere('category',   'like', $like)
                  ->orWhere('owner',      'like', $like)
                  ->orWhere('mitigation', 'like', $like)
                  ->orWhere('risk_id',    'like', $like);
            });
        }

        if ($v = $request->input('level'))  $query->where('level',  $v);
        if ($v = $request->input('status')) $query->where('status', $v);
        if ($v = $request->input('category')) $query->where('category', $v);

        $risks = $query->orderByDesc('id')->get();

        // All risks for stats/heatmap (unfiltered)
        $all = Risk::select('level', 'status', 'likelihood', 'impact', 'score', 'category')->get();

        // Category breakdown
        $categories = ['Operational', 'Technical', 'Financial', 'Compliance', 'Human'];
        $catStats = [];
        foreach ($categories as $cat) {
            $inCat = $all->where('category', $cat);
            $total = $inCat->count();
            $catStats[$cat] = [
                'total'     => $total,
                'high'      => $inCat->whereIn('level', ['Critical', 'High'])->count(),
                'mitigated' => $inCat->where('status', 'Mitigated')->count(),
                'pct'       => $total > 0 ? round($inCat->where('status', 'Mitigated')->count() / $total * 100) : 0,
            ];
        }

        // Heatmap data — count per cell
        $heatmap = [];
        foreach ($all as $r) {
            if (!$r->likelihood || !$r->impact) continue;
            $lv = array_search($r->likelihood, ['Rare','Unlikely','Possible','Likely','Almost Certain']) + 1;
            $iv = array_search($r->impact,     ['Insignificant','Minor','Moderate','Major','Catastrophic']) + 1;
            if ($lv < 1 || $iv < 1) continue;
            $key = "{$lv}_{$iv}";
            $heatmap[$key] = ($heatmap[$key] ?? 0) + 1;
        }

        return Inertia::render('risks/index', [
            'risks'      => $risks,
            'stats'      => $this->stats($all),
            'catStats'   => $catStats,
            'heatmap'    => $heatmap,
            'branches'   => Branch::orderBy('name')->pluck('name')->toArray(),
            'filters'    => $request->only(['search', 'level', 'status', 'category']),
        ]);
    }

    // ── Store ─────────────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $data = $this->validated($request);

        // Auto-calculate score from likelihood × impact
        $data['score'] = $this->calcScore($data['likelihood'] ?? '', $data['impact'] ?? '');
        // Auto-set level from score
        $data['level'] = $this->scoreToLevel($data['score']);

        $riskId = $this->nextRiskId();
        $risk = Risk::create(array_merge($data, [
            'risk_id'    => $riskId,
            'created_by' => Auth::user()->username ?? Auth::user()->email,
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        AuditService::log('risks', 'risk_created', $riskId, "Registered risk {$riskId} — {$risk->title}");

        return redirect()->route('risks.index')
            ->with('success', "Risk {$riskId} registered.");
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function update(Request $request, int $id)
    {
        $risk = Risk::findOrFail($id);
        $data = $this->validated($request);

        $data['score'] = $this->calcScore($data['likelihood'] ?? '', $data['impact'] ?? '');
        $data['level'] = $this->scoreToLevel($data['score']);

        $risk->update(array_merge($data, ['updated_at' => now()]));

        AuditService::log('risks', 'risk_updated', $risk->risk_id, "Updated risk {$risk->risk_id} — {$risk->title}");

        return redirect()->route('risks.index')
            ->with('success', "Risk {$risk->risk_id} updated.");
    }

    // ── Mark Mitigated ────────────────────────────────────────────────────────

    public function mitigate(int $id)
    {
        $risk = Risk::findOrFail($id);
        $risk->update(['status' => 'Mitigated', 'updated_at' => now()]);

        AuditService::log('risks', 'risk_mitigated', $risk->risk_id, "Marked risk {$risk->risk_id} as Mitigated");

        return back()->with('success', "Risk {$risk->risk_id} marked as Mitigated.");
    }

    // ── Destroy ───────────────────────────────────────────────────────────────

    public function destroy(int $id)
    {
        $risk = Risk::findOrFail($id);
        $riskId = $risk->risk_id;
        $title  = $risk->title;
        $risk->delete();

        AuditService::log('risks', 'risk_deleted', $riskId, "Deleted risk {$riskId} — {$title}");

        return redirect()->route('risks.index')
            ->with('success', "Risk {$riskId} deleted.");
    }

    public function deleteAll(Request $request)
    {
        $count = Risk::query()->delete();
        AuditService::log('risks', 'delete_all', 'all', "Deleted all {$count} risks from the register");

        return redirect()->route('risks.index')
            ->with('success', "All {$count} risks have been deleted.");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function validated(Request $request): array
    {
        return $request->validate([
            'title'      => 'required|string|max:255',
            'category'   => 'required|in:Operational,Technical,Financial,Compliance,Human',
            'likelihood' => 'required|in:Rare,Unlikely,Possible,Likely,Almost Certain',
            'impact'     => 'required|in:Insignificant,Minor,Moderate,Major,Catastrophic',
            'status'     => 'required|in:Open,Mitigating,Mitigated',
            'owner'      => 'nullable|string|max:255',
            'branch'     => 'nullable|string|max:100',
            'due_date'   => 'nullable|date',
            'mitigation' => 'nullable|string',
        ]);
    }

    private function calcScore(string $likelihood, string $impact): int
    {
        $lv = ['Rare'=>1,'Unlikely'=>2,'Possible'=>3,'Likely'=>4,'Almost Certain'=>5][$likelihood] ?? 1;
        $iv = ['Insignificant'=>1,'Minor'=>2,'Moderate'=>3,'Major'=>4,'Catastrophic'=>5][$impact] ?? 1;
        return $lv * $iv;
    }

    private function scoreToLevel(int $score): string
    {
        if ($score >= 16) return 'Critical';
        if ($score >= 10) return 'High';
        if ($score >= 5)  return 'Medium';
        return 'Low';
    }

    private function nextRiskId(): string
    {
        $last = Risk::orderByRaw("CAST(SUBSTRING(risk_id, 6) AS UNSIGNED) DESC")
            ->value('risk_id');
        if (!$last) return 'RISK-00001';
        $num = (int) substr($last, 5);
        return 'RISK-' . str_pad($num + 1, 5, '0', STR_PAD_LEFT);
    }

    private function stats($all): array
    {
        return [
            'total'      => $all->count(),
            'high'       => $all->whereIn('level', ['Critical','High'])->where('status', '!=', 'Mitigated')->count(),
            'mitigating' => $all->where('status', 'Mitigating')->count(),
            'mitigated'  => $all->where('status', 'Mitigated')->count(),
        ];
    }
}
