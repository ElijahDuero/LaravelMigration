<?php

namespace App\Http\Controllers;

use App\Models\SystemRegistry;
use App\Models\Branch;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SystemRegistryController extends Controller
{
    // ── Index ─────────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $query = SystemRegistry::query();

        if ($s = trim((string) $request->input('search', ''))) {
            $like = "%{$s}%";
            $query->where(function ($q) use ($like) {
                $q->where('name',      'like', $like)
                  ->orWhere('vendor',    'like', $like)
                  ->orWhere('owner',     'like', $like)
                  ->orWhere('developer', 'like', $like)
                  ->orWhere('category',  'like', $like);
            });
        }

        if ($v = $request->input('category'))    $query->where('category',    $v);
        if ($v = $request->input('criticality')) $query->where('criticality', $v);
        if ($v = $request->input('hosting'))     $query->where('hosting',     $v);
        if ($v = $request->input('status'))      $query->where('status',      $v);
        if ($v = $request->input('branch'))      $query->where('branch',      $v);

        $systems = $query->orderBy('name')->get();

        // Category counts (full table)
        $catCounts = SystemRegistry::selectRaw('category, COUNT(*) as cnt')
            ->groupBy('category')
            ->pluck('cnt', 'category')
            ->toArray();

        return Inertia::render('systems/index', [
            'systems'   => $systems,
            'stats'     => $this->stats(),
            'branches'  => Branch::orderBy('name')->pluck('name')->toArray(),
            'catCounts' => $catCounts,
            'filters'   => $request->only(['search', 'category', 'criticality', 'hosting', 'status', 'branch']),
        ]);
    }

    // ── Create ────────────────────────────────────────────────────────────────

    public function create()
    {
        return Inertia::render('systems/create', [
            'nextSysId' => $this->nextSysId(),
            'branches'  => Branch::orderBy('name')->pluck('name')->toArray(),
        ]);
    }

    // ── Store ─────────────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $sysId = $this->nextSysId();

        $sys = SystemRegistry::create(array_merge($data, [
            'sys_id'     => $sysId,
            'created_by' => Auth::user()->username ?? Auth::user()->email,
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        AuditService::log('systems', 'system_created', $sysId, "Registered system {$sysId} — {$sys->name}");

        return redirect()->route('systems.show', $sys->id)
            ->with('success', "System {$sysId} registered successfully.");
    }

    // ── Show ──────────────────────────────────────────────────────────────────

    public function show(int $id)
    {
        $sys = SystemRegistry::findOrFail($id);

        return Inertia::render('systems/view', ['system' => $sys]);
    }

    // ── Edit ──────────────────────────────────────────────────────────────────

    public function edit(int $id)
    {
        $sys = SystemRegistry::findOrFail($id);

        return Inertia::render('systems/edit', [
            'system'   => $sys,
            'branches' => Branch::orderBy('name')->pluck('name')->toArray(),
        ]);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function update(Request $request, int $id)
    {
        $sys  = SystemRegistry::findOrFail($id);
        $data = $this->validated($request);

        $sys->update(array_merge($data, ['updated_at' => now()]));

        AuditService::log('systems', 'system_updated', $sys->sys_id, "Updated system {$sys->sys_id} — {$sys->name}");

        return redirect()->route('systems.show', $sys->id)
            ->with('success', "System updated successfully.");
    }

    // ── Destroy ───────────────────────────────────────────────────────────────

    public function destroy(int $id)
    {
        $sys  = SystemRegistry::findOrFail($id);
        $name = $sys->name;
        $sysId = $sys->sys_id;
        $sys->delete();

        AuditService::log('systems', 'system_deleted', $sysId, "Deleted system {$sysId} — {$name}");

        return redirect()->route('systems.index')
            ->with('success', "System {$sysId} deleted.");
    }

    public function deleteAll(Request $request)
    {
        $count = SystemRegistry::query()->delete();
        AuditService::log('systems', 'delete_all', 'all', "Deleted all {$count} systems from the registry");

        return redirect()->route('systems.index')
            ->with('success', "All {$count} systems have been deleted.");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function validated(Request $request): array
    {
        return $request->validate([
            'name'             => 'required|string|max:255',
            'category'         => 'required|string|max:100',
            'status'           => 'nullable|string|max:50',
            'criticality'      => 'nullable|string|max:50',
            'description'      => 'nullable|string',
            'url'              => 'nullable|string|max:500',
            'go_live_date'     => 'nullable|date',
            'branch'           => 'nullable|string|max:100',
            'owner'            => 'required|string|max:255',
            'vendor'           => 'nullable|string|max:255',
            'developer'        => 'nullable|string|max:255',
            'support_contact'  => 'nullable|string|max:255',
            'source_code_repo' => 'nullable|string|max:500',
            'api_documentation'=> 'nullable|string|max:500',
            'hosting'          => 'nullable|string|max:50',
            'server'           => 'nullable|string|max:255',
            'ip_address'       => 'nullable|string|max:100',
            'database_type'    => 'nullable|string|max:100',
            'operating_system' => 'nullable|string|max:255',
            'tech_stack'       => 'nullable|string|max:255',
            'authentication'   => 'nullable|string|max:100',
            'backup'           => 'nullable|string|max:50',
            'recovery_plan'    => 'nullable|string',
            'notes'            => 'nullable|string',
        ]);
    }

    private function nextSysId(): string
    {
        $last = SystemRegistry::orderByRaw("CAST(SUBSTRING(sys_id, 5) AS UNSIGNED) DESC")
            ->value('sys_id');

        if (!$last) return 'SYS-00001';
        $num = (int) substr($last, 4);
        return 'SYS-' . str_pad($num + 1, 5, '0', STR_PAD_LEFT);
    }

    private function stats(): array
    {
        $all   = SystemRegistry::select('criticality', 'status')->get();
        return [
            'total'           => $all->count(),
            'active'          => $all->where('status', 'Active')->count(),
            'critical'        => $all->where('criticality', 'Critical')->count(),
            'high'            => $all->where('criticality', 'High')->count(),
            'decommissioned'  => $all->where('status', 'Decommissioned')->count(),
        ];
    }
}
