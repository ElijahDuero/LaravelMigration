<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\BranchSecurity;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BranchSecurityController extends Controller
{
    // ── Index — scored dashboard ──────────────────────────────────────────────

    public function index()
    {
        // All branch names from the branches table
        $knownBranches = Branch::orderBy('name')->pluck('name')->toArray();

        // Existing rows keyed by branch name
        $rows = BranchSecurity::all()->keyBy('branch');

        // Build scored list — every branch gets an entry even if no row yet
        $branches = [];
        foreach ($knownBranches as $name) {
            $row = $rows->get($name);
            if ($row) {
                $entry = $row->toArray();
                $entry['score'] = $row->score; // computed attribute
            } else {
                $entry = [
                    'branch'               => $name,
                    'computers_total'      => 0,
                    'computers_online'     => 0,
                    'computers_offline'    => 0,
                    'computers_outdated'   => 0,
                    'computers_patched'    => 0,
                    'computers_encrypted'  => 0,
                    'antivirus'            => 0,
                    'firewall'             => 0,
                    'disk_encryption'      => 0,
                    'password_policy'      => 0,
                    'mfa'                  => 0,
                    'backup_status'        => 0,
                    'notes'                => '',
                    'updated_by'           => null,
                    'updated_at'           => null,
                    'score'                => 0,
                ];
            }
            $branches[] = $entry;
        }

        // Sort descending by score
        usort($branches, fn ($a, $b) => $b['score'] - $a['score']);

        $scores      = array_column($branches, 'score');
        $avgScore    = count($scores) ? (int) round(array_sum($scores) / count($scores)) : 0;
        $critical    = count(array_filter($scores, fn ($s) => $s < 50));
        $atRisk      = count(array_filter($scores, fn ($s) => $s >= 50 && $s < 70));
        $healthy     = count(array_filter($scores, fn ($s) => $s >= 80));
        $totalPCs    = array_sum(array_column($branches, 'computers_total'));

        return Inertia::render('branch_security/index', [
            'branches'      => $branches,
            'stats' => [
                'avg_score'      => $avgScore,
                'healthy'        => $healthy,
                'at_risk'        => $atRisk,
                'critical'       => $critical,
                'total_computers'=> $totalPCs,
            ],
            'knownBranches' => $knownBranches,
        ]);
    }

    // ── Edit — load form for one branch ──────────────────────────────────────

    public function edit(string $branch)
    {
        $branch   = urldecode($branch);
        $known    = Branch::orderBy('name')->pluck('name')->toArray();

        if (! in_array($branch, $known, true)) {
            return redirect()->route('branch_security.index');
        }

        $row = BranchSecurity::where('branch', $branch)->first();

        return Inertia::render('branch_security/edit', [
            'branchName' => $branch,
            'row'        => $row ? $row->toArray() : null,
        ]);
    }

    // ── Update — upsert row ───────────────────────────────────────────────────

    public function update(Request $request, string $branch)
    {
        $branch = urldecode($branch);

        $data = $request->validate([
            'computers_total'     => 'required|integer|min:0',
            'computers_online'    => 'required|integer|min:0',
            'computers_offline'   => 'required|integer|min:0',
            'computers_outdated'  => 'required|integer|min:0',
            'computers_patched'   => 'required|integer|min:0',
            'computers_encrypted' => 'required|integer|min:0',
            'antivirus'           => 'required|integer|min:0|max:3',
            'firewall'            => 'required|integer|min:0|max:3',
            'disk_encryption'     => 'required|integer|min:0|max:3',
            'password_policy'     => 'required|integer|min:0|max:3',
            'mfa'                 => 'required|integer|min:0|max:3',
            'backup_status'       => 'required|integer|min:0|max:3',
            'notes'               => 'nullable|string',
        ]);

        $data['branch']     = $branch;
        $data['updated_by'] = Auth::user()->username ?? Auth::user()->email;
        $data['updated_at'] = now();

        BranchSecurity::updateOrCreate(
            ['branch' => $branch],
            $data
        );

        AuditService::log(
            'branch_security', 'bs_updated', $branch,
            "Updated branch security data for {$branch}"
        );

        return redirect()->route('branch_security.index')
            ->with('success', "Security data for {$branch} saved.");
    }
}
