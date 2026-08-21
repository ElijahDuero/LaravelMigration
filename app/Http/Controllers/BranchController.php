<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\BranchSecurity;
use App\Models\Hardware;
use App\Models\Incident;
use App\Models\Software;
use App\Models\SystemRegistry;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BranchController extends Controller
{
    // ── Index ─────────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $query = Branch::query();

        if ($s = trim((string) $request->input('search', ''))) {
            $like = "%{$s}%";
            $query->where(function ($q) use ($like) {
                $q->where('name',     'like', $like)
                  ->orWhere('code',     'like', $like)
                  ->orWhere('location', 'like', $like)
                  ->orWhere('head',     'like', $like);
            });
        }
        if ($v = $request->input('status')) $query->where('status', $v);
        if ($v = $request->input('type'))   $query->where('type',   $v);

        $branches = $query->orderBy('name')->get();

        // Per-branch counters from related tables
        $incByBranch = Incident::whereNotNull('branch')
            ->selectRaw('branch, COUNT(*) as cnt')->groupBy('branch')
            ->pluck('cnt', 'branch')->toArray();

        $hwByBranch = Hardware::whereNotNull('branch')
            ->selectRaw('branch, COUNT(*) as cnt')->groupBy('branch')
            ->pluck('cnt', 'branch')->toArray();

        $swByBranch = Software::whereNotNull('branch')
            ->selectRaw('branch, COUNT(*) as cnt')->groupBy('branch')
            ->pluck('cnt', 'branch')->toArray();

        $sysByBranch = SystemRegistry::whereNotNull('branch')
            ->selectRaw('branch, COUNT(*) as cnt')->groupBy('branch')
            ->pluck('cnt', 'branch')->toArray();

        $bsScores = BranchSecurity::all()
            ->pluck('score', 'branch')->toArray();

        $mapped = $branches->map(fn ($b) => array_merge($b->toArray(), [
            'incidents' => (int) ($incByBranch[$b->name] ?? 0),
            'hardware'  => (int) ($hwByBranch[$b->name]  ?? 0),
            'software'  => (int) ($swByBranch[$b->name]  ?? 0),
            'systems'   => (int) ($sysByBranch[$b->name] ?? 0),
            'security_score' => isset($bsScores[$b->name]) ? (int) $bsScores[$b->name] : null,
        ]))->values()->toArray();

        $allBranches = Branch::all();

        return Inertia::render('branches/index', [
            'branches' => $mapped,
            'stats'    => [
                'total'     => $allBranches->count(),
                'active'    => $allBranches->where('status', 'Active')->count(),
                'planned'   => $allBranches->where('status', 'Planned')->count(),
                'employees' => (int) $allBranches->sum('employees'),
            ],
            'nextCode' => $this->nextCode(),
            'filters'  => $request->only(['search', 'status', 'type']),
        ]);
    }

    // ── Store ─────────────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $code = $this->nextCode();

        $branch = Branch::create(array_merge($data, [
            'code'       => $code,
            'created_by' => Auth::user()->username ?? Auth::user()->email,
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        AuditService::log('branches', 'branch_created', $code, "Created branch {$branch->name}");

        return redirect()->route('branches.index')
            ->with('success', "Branch {$branch->name} ({$code}) created.");
    }

    // ── Show ──────────────────────────────────────────────────────────────────

    public function show(int $id)
    {
        $branch = Branch::findOrFail($id);
        $bsRow  = BranchSecurity::where('branch', $branch->name)->first();

        return Inertia::render('branches/view', [
            'branch'        => $branch,
            'securityScore' => $bsRow ? (int) $bsRow->score : null,
            'incidents'     => (int) Incident::where('branch', $branch->name)->count(),
            'hardware'      => (int) Hardware::where('branch', $branch->name)->count(),
            'software'      => (int) Software::where('branch', $branch->name)->count(),
            'systems'       => (int) SystemRegistry::where('branch', $branch->name)->count(),
            'recentIncidents' => Incident::where('branch', $branch->name)
                ->select(['id', 'incident_number', 'description', 'severity', 'workflow_status',
                    DB::raw('COALESCE(reported_at, created_at) AS reported_at')])
                ->orderByDesc('id')->limit(5)->get(),
        ]);
    }

    // ── Edit ──────────────────────────────────────────────────────────────────

    public function edit(int $id)
    {
        return Inertia::render('branches/edit', [
            'branch' => Branch::findOrFail($id),
        ]);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function update(Request $request, int $id)
    {
        $branch = Branch::findOrFail($id);
        $data   = $this->validated($request, $id);

        $branch->update(array_merge($data, ['updated_at' => now()]));

        AuditService::log('branches', 'branch_updated', $branch->code, "Updated branch {$branch->name}");

        return redirect()->route('branches.index')
            ->with('success', "Branch {$branch->name} updated.");
    }

    // ── Destroy ───────────────────────────────────────────────────────────────

    public function destroy(int $id)
    {
        $branch = Branch::findOrFail($id);
        $name   = $branch->name;
        $code   = $branch->code;
        $branch->delete();

        AuditService::log('branches', 'branch_deleted', $code, "Deleted branch {$name}");

        return redirect()->route('branches.index')
            ->with('success', "Branch {$name} deleted.");
    }

    public function deleteAll(Request $request)
    {
        BranchSecurity::query()->delete();
        $count = Branch::query()->delete();
        AuditService::log('branches', 'delete_all', 'all', "Deleted all {$count} branches and security records");

        return redirect()->route('branches.index')
            ->with('success', "All {$count} branches have been deleted.");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function validated(Request $request, ?int $excludeId = null): array
    {
        $nameUnique     = 'unique:branches,name' . ($excludeId ? ",{$excludeId}" : '');
        return $request->validate([
            'name'        => "required|string|max:150|{$nameUnique}",
            'location'    => 'required|string|max:200',
            'type'        => 'required|in:HQ,Satellite,Remote,Data Center',
            'status'      => 'required|in:Active,Planned,Inactive',
            'head'        => 'nullable|string|max:150',
            'contact'     => 'nullable|string|max:50',
            'email'       => 'nullable|email|max:150',
            'employees'   => 'nullable|integer|min:0',
            'campuses'    => 'nullable|integer|min:0',
            'established' => 'nullable|date',
            'notes'       => 'nullable|string',
        ]);
    }

    private function nextCode(): string
    {
        $last = Branch::orderByRaw("CAST(SUBSTRING(code, 3) AS UNSIGNED) DESC")->value('code');
        if (! $last) return 'BR-001';
        preg_match('/BR-(\d+)/i', $last, $m);
        $seq = isset($m[1]) ? (int) $m[1] + 1 : 1;
        return 'BR-' . str_pad($seq, 3, '0', STR_PAD_LEFT);
    }
}
