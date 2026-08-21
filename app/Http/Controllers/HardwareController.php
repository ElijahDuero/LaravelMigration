<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Hardware;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HardwareController extends Controller
{
    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function nextTag(): string
    {
        $last = Hardware::orderByDesc('id')->value('tag');
        $seq  = 1;
        if ($last && preg_match('/HW-(\d+)/', $last, $m)) {
            $seq = (int) $m[1] + 1;
        }
        return sprintf('HW-%05d', $seq);
    }

    private function stats(): array
    {
        $base = Hardware::selectRaw("
            COUNT(*)                                                                AS total,
            SUM(CASE WHEN status = 'Active'             THEN 1 ELSE 0 END)         AS active,
            SUM(CASE WHEN status = 'In Maintenance'     THEN 1 ELSE 0 END)         AS maint,
            SUM(CASE WHEN status = 'Decommissioned'     THEN 1 ELSE 0 END)         AS deco
        ")->first()->toArray();

        $ninety = now()->addDays(90)->toDateString();
        $base['warranty_expiring'] = Hardware::whereNotNull('warranty_expiry')
            ->where('warranty_expiry', '>', now()->toDateString())
            ->where('warranty_expiry', '<=', $ninety)
            ->count();

        return $base;
    }

    // ─── Index ────────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $q = Hardware::query();

        if ($search = $request->get('search')) {
            $like = "%{$search}%";
            $q->where(fn ($w) =>
                $w->where('tag',          'like', $like)
                  ->orWhere('name',        'like', $like)
                  ->orWhere('serial',      'like', $like)
                  ->orWhere('ip_address',  'like', $like)
                  ->orWhere('model',       'like', $like)
                  ->orWhere('manufacturer','like', $like)
                  ->orWhere('hostname',    'like', $like)
            );
        }

        if ($type   = $request->get('type'))   { $q->where('type',   $type); }
        if ($status = $request->get('status')) { $q->where('status', $status); }
        if ($branch = $request->get('branch')) { $q->where('branch', $branch); }

        $hardware = $q->orderByDesc('id')->get();

        // Type counts for the category cards
        $typeCounts   = $hardware->groupBy('type')->map->count();
        $activeByType = $hardware->where('status', 'Active')->groupBy('type')->map->count();

        return Inertia::render('hardware/index', [
            'hardware'    => $hardware,
            'stats'       => $this->stats(),
            'branches'    => Branch::orderBy('name')->pluck('name'),
            'typeCounts'  => $typeCounts,
            'activeByType'=> $activeByType,
            'filters'     => $request->only(['search', 'type', 'status', 'branch']),
        ]);
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    public function create()
    {
        return Inertia::render('hardware/create', [
            'nextTag'  => $this->nextTag(),
            'branches' => Branch::orderBy('name')->pluck('name'),
        ]);
    }

    // ─── Store ────────────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'type'             => 'required|string|max:100',
            'serial'           => 'required|string|max:255',
            'manufacturer'     => 'required|string|max:255',
            'model'            => 'required|string|max:255',
            'branch'           => 'required|string|max:255',
            'status'           => 'required|string|max:100',
            'building'         => 'nullable|string|max:255',
            'room'             => 'nullable|string|max:255',
            'rack'             => 'nullable|string|max:255',
            'assigned_user'    => 'nullable|string|max:255',
            'department'       => 'nullable|string|max:255',
            'ip_address'       => 'nullable|string|max:45',
            'mac_address'      => 'nullable|string|max:17',
            'hostname'         => 'nullable|string|max:255',
            'operating_system' => 'nullable|string|max:255',
            'cpu'              => 'nullable|string|max:255',
            'ram'              => 'nullable|string|max:100',
            'storage'          => 'nullable|string|max:255',
            'purchase_date'    => 'nullable|date',
            'warranty_expiry'  => 'nullable|date',
            'supplier'         => 'nullable|string|max:255',
            'invoice'          => 'nullable|string|max:100',
            'purchase_cost'    => 'nullable|numeric|min:0',
            'notes'            => 'nullable|string',
        ]);

        $tag = $this->nextTag();

        $hardware = Hardware::create(array_merge($validated, [
            'tag'        => $tag,
            'created_by' => Auth::user()->name,
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        AuditService::log('hardware', 'hardware_created', $tag, "Added hardware asset {$tag}");

        return redirect()->route('hardware.show', $tag)
            ->with('success', "Hardware asset {$tag} added successfully.");
    }

    // ─── Show ─────────────────────────────────────────────────────────────────

    public function show(string $tag)
    {
        $hardware = Hardware::where('tag', $tag)->firstOrFail();

        return Inertia::render('hardware/view', [
            'hardware' => $hardware,
        ]);
    }

    // ─── Edit ─────────────────────────────────────────────────────────────────

    public function edit(string $tag)
    {
        $hardware = Hardware::where('tag', $tag)->firstOrFail();

        return Inertia::render('hardware/edit', [
            'hardware' => $hardware,
            'branches' => Branch::orderBy('name')->pluck('name'),
        ]);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public function update(Request $request, string $tag)
    {
        $hardware = Hardware::where('tag', $tag)->firstOrFail();

        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'type'             => 'required|string|max:100',
            'serial'           => 'required|string|max:255',
            'manufacturer'     => 'required|string|max:255',
            'model'            => 'required|string|max:255',
            'branch'           => 'required|string|max:255',
            'status'           => 'required|string|max:100',
            'building'         => 'nullable|string|max:255',
            'room'             => 'nullable|string|max:255',
            'rack'             => 'nullable|string|max:255',
            'assigned_user'    => 'nullable|string|max:255',
            'department'       => 'nullable|string|max:255',
            'ip_address'       => 'nullable|string|max:45',
            'mac_address'      => 'nullable|string|max:17',
            'hostname'         => 'nullable|string|max:255',
            'operating_system' => 'nullable|string|max:255',
            'cpu'              => 'nullable|string|max:255',
            'ram'              => 'nullable|string|max:100',
            'storage'          => 'nullable|string|max:255',
            'purchase_date'    => 'nullable|date',
            'warranty_expiry'  => 'nullable|date',
            'supplier'         => 'nullable|string|max:255',
            'invoice'          => 'nullable|string|max:100',
            'purchase_cost'    => 'nullable|numeric|min:0',
            'notes'            => 'nullable|string',
        ]);

        $hardware->update(array_merge($validated, ['updated_at' => now()]));

        AuditService::log('hardware', 'hardware_updated', $tag, "Updated hardware asset {$tag}");

        return redirect()->route('hardware.show', $tag)
            ->with('success', "Hardware asset {$tag} updated successfully.");
    }

    // ─── Destroy ──────────────────────────────────────────────────────────────

    public function destroy(string $tag)
    {
        $hardware = Hardware::where('tag', $tag)->firstOrFail();

        AuditService::log('hardware', 'hardware_deleted', $tag, "Deleted hardware asset {$tag}");
        $hardware->delete();

        return redirect()->route('hardware.index')
            ->with('success', "Hardware asset {$tag} deleted.");
    }

    public function deleteAll(Request $request)
    {
        $count = Hardware::query()->delete();
        AuditService::log('hardware', 'delete_all', 'all', "Deleted all {$count} hardware assets");

        return redirect()->route('hardware.index')
            ->with('success', "All {$count} hardware assets have been deleted.");
    }
}
