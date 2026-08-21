<?php

namespace App\Http\Controllers;

use App\Models\Software;
use App\Models\Branch;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SoftwareController extends Controller
{
    // ── Index ─────────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $query = Software::query();

        // Search: name, vendor, category, branch, department
        if ($s = trim((string) $request->input('search', ''))) {
            $like = "%{$s}%";
            $query->where(function ($q) use ($like) {
                $q->where('name',       'like', $like)
                  ->orWhere('vendor',     'like', $like)
                  ->orWhere('category',   'like', $like)
                  ->orWhere('branch',     'like', $like)
                  ->orWhere('department', 'like', $like);
            });
        }

        if ($cat = $request->input('category')) {
            $query->where('category', $cat);
        }

        if ($lic = $request->input('license')) {
            $query->where('license_type', $lic);
        }

        if ($branch = $request->input('branch')) {
            $query->where('branch', $branch);
        }

        // Expiry filter
        $expiry = $request->input('expiry', '');
        if ($expiry === 'perpetual') {
            $query->whereNull('expiry_date')->orWhere('expiry_date', '');
        } elseif ($expiry === 'expired') {
            $query->whereNotNull('expiry_date')->where('expiry_date', '<', now()->toDateString());
        } elseif (is_numeric($expiry)) {
            $future = now()->addDays((int) $expiry)->toDateString();
            $query->whereNotNull('expiry_date')
                  ->where('expiry_date', '>=', now()->toDateString())
                  ->where('expiry_date', '<=', $future);
        }

        $software = $query->orderByDesc('id')->get();

        // ── Stats (from full table, not filtered) ─────────────────────────
        $stats = $this->stats();

        // ── Category counts ───────────────────────────────────────────────
        $catCounts = Software::selectRaw('category, COUNT(*) as cnt')
            ->groupBy('category')
            ->pluck('cnt', 'category')
            ->toArray();

        return Inertia::render('software/index', [
            'software'  => $software,
            'stats'     => $stats,
            'branches'  => Branch::orderBy('name')->pluck('name')->toArray(),
            'catCounts' => $catCounts,
            'filters'   => $request->only(['search', 'category', 'license', 'branch', 'expiry']),
        ]);
    }

    // ── Create form ───────────────────────────────────────────────────────────

    public function create()
    {
        return Inertia::render('software/create', [
            'nextSwId' => $this->nextSwId(),
            'branches' => Branch::orderBy('name')->pluck('name')->toArray(),
        ]);
    }

    // ── Store ─────────────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'           => 'required|string|max:255',
            'category'       => 'required|string|max:100',
            'vendor'         => 'required|string|max:255',
            'version'        => 'nullable|string|max:100',
            'branch'         => 'nullable|string|max:100',
            'department'     => 'nullable|string|max:100',
            'license_type'   => 'nullable|string|max:50',
            'license_model'  => 'nullable|string|max:100',
            'license_key'    => 'nullable|string|max:500',
            'total_licenses' => 'nullable|integer|min:0',
            'used_licenses'  => 'nullable|integer|min:0',
            'purchase_date'  => 'nullable|date',
            'expiry_date'    => 'nullable|date',
            'cost_annual'    => 'nullable|numeric|min:0',
            'supplier'       => 'nullable|string|max:255',
            'po_number'      => 'nullable|string|max:100',
            'invoice'        => 'nullable|string|max:100',
            'notes'          => 'nullable|string',
        ]);

        $swId = $this->nextSwId();

        $sw = Software::create(array_merge($data, [
            'sw_id'      => $swId,
            'created_by' => Auth::user()->username ?? Auth::user()->email,
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        AuditService::log('software', 'software_created', $swId, "Registered software {$swId} — {$sw->name}");

        return redirect()->route('software.show', $swId)
            ->with('success', "Software {$swId} registered successfully.");
    }

    // ── Show ──────────────────────────────────────────────────────────────────

    public function show(string $swId)
    {
        $sw = Software::where('sw_id', $swId)->firstOrFail();

        return Inertia::render('software/view', [
            'software' => $sw,
            'branches' => Branch::orderBy('name')->pluck('name')->toArray(),
        ]);
    }

    // ── Edit form ─────────────────────────────────────────────────────────────

    public function edit(string $swId)
    {
        $sw = Software::where('sw_id', $swId)->firstOrFail();

        return Inertia::render('software/edit', [
            'software' => $sw,
            'branches' => Branch::orderBy('name')->pluck('name')->toArray(),
        ]);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function update(Request $request, string $swId)
    {
        $sw = Software::where('sw_id', $swId)->firstOrFail();

        $data = $request->validate([
            'name'           => 'required|string|max:255',
            'category'       => 'required|string|max:100',
            'vendor'         => 'required|string|max:255',
            'version'        => 'nullable|string|max:100',
            'branch'         => 'nullable|string|max:100',
            'department'     => 'nullable|string|max:100',
            'license_type'   => 'nullable|string|max:50',
            'license_model'  => 'nullable|string|max:100',
            'license_key'    => 'nullable|string|max:500',
            'total_licenses' => 'nullable|integer|min:0',
            'used_licenses'  => 'nullable|integer|min:0',
            'purchase_date'  => 'nullable|date',
            'expiry_date'    => 'nullable|date',
            'cost_annual'    => 'nullable|numeric|min:0',
            'supplier'       => 'nullable|string|max:255',
            'po_number'      => 'nullable|string|max:100',
            'invoice'        => 'nullable|string|max:100',
            'notes'          => 'nullable|string',
        ]);

        $sw->update(array_merge($data, ['updated_at' => now()]));

        AuditService::log('software', 'software_updated', $swId, "Updated software {$swId} — {$sw->name}");

        return redirect()->route('software.show', $swId)
            ->with('success', "Software {$swId} updated successfully.");
    }

    // ── Destroy ───────────────────────────────────────────────────────────────

    public function destroy(string $swId)
    {
        $sw = Software::where('sw_id', $swId)->firstOrFail();
        $name = $sw->name;
        $sw->delete();

        AuditService::log('software', 'software_deleted', $swId, "Deleted software {$swId} — {$name}");

        return redirect()->route('software.index')
            ->with('success', "Software {$swId} deleted.");
    }

    public function deleteAll(Request $request)
    {
        $count = Software::query()->delete();
        AuditService::log('software', 'delete_all', 'all', "Deleted all {$count} software licenses");

        return redirect()->route('software.index')
            ->with('success', "All {$count} software licenses have been deleted.");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function nextSwId(): string
    {
        $last = Software::orderByRaw("CAST(SUBSTRING(sw_id, 4) AS UNSIGNED) DESC")
            ->value('sw_id');

        if (!$last) return 'SW-00001';

        $num = (int) substr($last, 3);
        return 'SW-' . str_pad($num + 1, 5, '0', STR_PAD_LEFT);
    }

    private function stats(): array
    {
        $all     = Software::select('license_type', 'expiry_date')->get();
        $total   = $all->count();
        $titles  = Software::distinct()->count('name');
        $licensed   = $all->where('license_type', 'Licensed')->count();
        $unlicensed = $all->where('license_type', 'Unlicensed')->count();

        $expired  = 0;
        $expiring = 0;
        foreach ($all as $row) {
            if (!$row->expiry_date) continue;
            $diff = now()->diffInDays($row->expiry_date, false);
            if ($diff < 0)       $expired++;
            elseif ($diff <= 90) $expiring++;
        }

        return compact('total', 'titles', 'licensed', 'unlicensed', 'expired', 'expiring');
    }
}
