<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\User;
use App\Models\UserDirectory;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    // ── Role metadata (mirrors PHP original) ─────────────────────────────────
    private const ROLE_META = [
        'Super Admin'    => ['color' => 'dc2626', 'icon' => 'fa-crown',          'desc' => 'Full system access',             'level' => 1],
        'Admin'          => ['color' => '4f46e5', 'icon' => 'fa-shield-halved',  'desc' => 'Administrative access',          'level' => 2],
        'Cyber Security' => ['color' => '7c3aed', 'icon' => 'fa-user-shield',    'desc' => 'Security operations access',     'level' => 3],
        'IT'             => ['color' => '2563eb', 'icon' => 'fa-screwdriver-wrench', 'desc' => 'IT operations access',       'level' => 4],
        'Unassigned'     => ['color' => '6b7280', 'icon' => 'fa-user-clock',     'desc' => 'Pending role assignment',        'level' => 99],
    ];

    // ── Index ─────────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $query = UserDirectory::query();

        if ($s = trim((string) $request->input('search', ''))) {
            $like = "%{$s}%";
            $query->where(function ($q) use ($like) {
                $q->where('name',     'like', $like)
                  ->orWhere('email',    'like', $like)
                  ->orWhere('username', 'like', $like)
                  ->orWhere('dept',     'like', $like)
                  ->orWhere('branch',   'like', $like)
                  ->orWhere('title',    'like', $like);
            });
        }
        if ($v = $request->input('role'))   $query->where('role',   $v);
        if ($v = $request->input('status')) $query->where('status', $v);

        $users = $query->orderBy('id')->get()->map(fn ($u) => [
            'id'        => $u->id,
            'username'  => $u->username,
            'name'      => $u->name,
            'email'     => $u->email,
            'role'      => $u->role,
            'branch'    => $u->branch,
            'dept'      => $u->dept,
            'title'     => $u->title,
            'status'    => $u->status,
            'mfa'       => (bool) $u->mfa,
            'avatar_bg' => $u->avatar_bg,
            'last_seen' => $u->last_seen,
            'created_at'=> $u->created_at,
        ])->values()->toArray();

        $all = UserDirectory::all();

        // Role counts for sidebar
        $roleCounts = [];
        foreach (array_keys(self::ROLE_META) as $role) {
            $roleCounts[$role] = $all->where('role', $role)->count();
        }

        $branches = Branch::orderBy('name')->pluck('name')->toArray();

        return Inertia::render('users/index', [
            'users'      => $users,
            'stats'      => [
                'total'    => $all->count(),
                'active'   => $all->where('status', 'Active')->count(),
                'pending'  => $all->where('role', 'Unassigned')->count(),
                'with_mfa' => $all->where('mfa', true)->count(),
            ],
            'roleMeta'   => self::ROLE_META,
            'roleCounts' => $roleCounts,
            'branches'   => $branches,
            'filters'    => $request->only(['search', 'role', 'status']),
        ]);
    }

    // ── Store ─────────────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:150',
            'email'    => 'required|email|unique:user_directory,email',
            'role'     => 'required|string|max:100',
            'branch'   => 'nullable|string|max:150',
            'dept'     => 'nullable|string|max:100',
            'title'    => 'nullable|string|max:150',
            'status'   => 'required|in:Active,Inactive,Locked,Invited',
            'mfa'      => 'boolean',
        ]);

        $avatarBg = $this->avatarBg($data['role']);

        UserDirectory::create(array_merge($data, [
            'avatar_bg'  => $avatarBg,
            'last_seen'  => '-',
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        AuditService::log('users', 'user_created', $data['email'], "Created user {$data['name']}");

        return back()->with('success', "User {$data['name']} created.");
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function update(Request $request, int $id)
    {
        $user = UserDirectory::findOrFail($id);

        $data = $request->validate([
            'name'   => 'required|string|max:150',
            'email'  => "required|email|unique:user_directory,email,{$id}",
            'role'   => 'required|string|max:100',
            'branch' => 'nullable|string|max:150',
            'dept'   => 'nullable|string|max:100',
            'title'  => 'nullable|string|max:150',
            'status' => 'required|in:Active,Inactive,Locked,Invited',
            'mfa'    => 'boolean',
        ]);

        $user->update(array_merge($data, [
            'avatar_bg'  => $this->avatarBg($data['role']),
            'updated_at' => now(),
        ]));

        // If there's a matching auth account, sync their role slug
        $authUser = User::where('email', $user->email)->first();
        if ($authUser) {
            $authUser->update(['role' => $this->roleSlug($data['role'])]);
        }

        AuditService::log('users', 'user_updated', $user->email, "Updated user {$user->name}");

        return back()->with('success', "User {$user->name} updated.");
    }

    // ── Assign Role (quick action from pending table) ─────────────────────────

    public function assignRole(Request $request, int $id)
    {
        $user = UserDirectory::findOrFail($id);
        $role = $request->validate(['role' => 'required|string|max:100'])['role'];

        $user->update([
            'role'       => $role,
            'status'     => 'Active',
            'avatar_bg'  => $this->avatarBg($role),
            'updated_at' => now(),
        ]);

        // Sync to auth user if exists
        $authUser = User::where('email', $user->email)->first();
        if ($authUser) {
            $authUser->update(['role' => $this->roleSlug($role)]);
        }

        AuditService::log('users', 'role_assigned', $user->email, "Assigned role '{$role}' to {$user->name}");

        return back()->with('success', "Role '{$role}' assigned to {$user->name}.");
    }

    // ── Destroy ───────────────────────────────────────────────────────────────

    public function destroy(int $id)
    {
        $user = UserDirectory::findOrFail($id);

        // Protect the superadmin
        if ($user->username === 'superadmin') {
            return back()->withErrors(['error' => 'The superadmin account cannot be deleted.']);
        }

        $name  = $user->name;
        $email = $user->email;
        $user->delete();

        AuditService::log('users', 'user_deleted', $email, "Deleted user {$name}");

        return back()->with('success', "User {$name} deleted.");
    }

    public function deleteAll(Request $request)
    {
        $currentEmail = Auth::user()?->email;
        $count = UserDirectory::where('username', '!=', 'superadmin')
            ->when($currentEmail, fn ($q) => $q->where('email', '!=', $currentEmail))
            ->delete();

        User::where('role', '!=', 'super_admin')
            ->when($currentEmail, fn ($q) => $q->where('email', '!=', $currentEmail))
            ->delete();

        AuditService::log('users', 'delete_all', 'all', "Deleted {$count} user accounts (preserved active session and superadmin)");

        return back()->with('success', "All {$count} dummy user accounts have been deleted.");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function avatarBg(string $role): string
    {
        return self::ROLE_META[$role]['color'] ?? '6b7280';
    }

    /** Map display role name → auth role slug */
    private function roleSlug(string $displayRole): string
    {
        return match ($displayRole) {
            'Super Admin'    => 'super_admin',
            'Admin'          => 'admin',
            'Cyber Security' => 'cyber_security',
            'IT'             => 'it',
            default          => 'unassigned',
        };
    }
}
