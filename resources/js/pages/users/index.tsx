import AppLayout from '@/components/AppLayout';
import { router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface UserDir {
    id: number;
    username: string | null;
    name: string;
    email: string;
    role: string;
    branch: string;
    dept: string;
    title: string;
    status: string;
    mfa: boolean;
    avatar_bg: string;
    last_seen: string;
    created_at: string | null;
}
interface RoleMeta { color: string; icon: string; desc: string; level: number; }
interface Stats { total: number; active: number; pending: number; with_mfa: number; }
interface Props {
    users: UserDir[];
    stats: Stats;
    roleMeta: Record<string, RoleMeta>;
    roleCounts: Record<string, number>;
    branches: string[];
    filters: { search?: string; role?: string; status?: string };
}

// ── Constants ──────────────────────────────────────────────────────────────────
const STATUSES = ['Active', 'Inactive', 'Locked', 'Invited'];
const STATUS_BADGE: Record<string, string> = {
    Active:   'bg-emerald-50 text-emerald-700',
    Locked:   'bg-red-50 text-red-700',
    Invited:  'bg-blue-50 text-blue-700',
    Disabled: 'bg-gray-100 text-gray-600',
    Inactive: 'bg-orange-50 text-orange-700',
};
const STATUS_DOT: Record<string, string> = {
    Active: 'bg-emerald-500', Locked: 'bg-red-500',
    Invited: 'bg-blue-500', Disabled: 'bg-gray-400', Inactive: 'bg-orange-400',
};

function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, bg, size = 10 }: { name: string; bg: string; size?: number }) {
    return (
        <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=${bg}&color=fff&size=40&bold=true`}
            className={`w-${size} h-${size} rounded-xl border-2 border-white shadow-sm`}
            alt={name}
        />
    );
}

// ── Role badge ────────────────────────────────────────────────────────────────
function RoleBadge({ role, meta }: { role: string; meta: RoleMeta | undefined }) {
    if (!meta) return <span className="text-xs text-gray-400 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">{role}</span>;
    return (
        <span
            className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md"
            style={{ background: `#${meta.color}18`, color: `#${meta.color}`, border: `1px solid #${meta.color}30` }}
        >
            <i className={`fas ${meta.icon} mr-1.5 text-[10px]`}></i>{role}
        </span>
    );
}

// ── User modal (add / edit) ────────────────────────────────────────────────────
function UserModal({ roleMeta, branches, initial, onClose }: {
    roleMeta: Record<string, RoleMeta>;
    branches: string[];
    initial?: UserDir;
    onClose: () => void;
}) {
    const isEdit = !!initial;
    const { data, setData, post, put, processing, errors } = useForm({
        name:   initial?.name   ?? '',
        email:  initial?.email  ?? '',
        role:   initial?.role   ?? '',
        branch: initial?.branch ?? '',
        dept:   initial?.dept   ?? '',
        title:  initial?.title  ?? '',
        status: initial?.status ?? 'Active',
        mfa:    initial?.mfa    ?? false,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) {
            put(`/users/${initial!.id}`, { onSuccess: onClose });
        } else {
            post('/users', { onSuccess: onClose });
        }
    }

    const selectedMeta = roleMeta[data.role];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h3 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit User' : 'Add New User'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
                        <i className="fas fa-xmark"></i>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input type="text" required className={`form-input w-full ${errors.name ? 'border-red-400' : ''}`}
                                placeholder="e.g. Maria Santos"
                                value={data.name} onChange={(e) => setData('name', e.target.value)} />
                            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                        </div>
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input type="email" required className={`form-input w-full ${errors.email ? 'border-red-400' : ''}`}
                                placeholder="user@company.com"
                                value={data.email} onChange={(e) => setData('email', e.target.value)} />
                            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                        </div>
                        {/* Role */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Role <span className="text-red-500">*</span>
                            </label>
                            <select required className={`form-input w-full ${errors.role ? 'border-red-400' : ''}`}
                                value={data.role} onChange={(e) => setData('role', e.target.value)}>
                                <option value="">Select role…</option>
                                {Object.entries(roleMeta)
                                    .sort((a, b) => a[1].level - b[1].level)
                                    .map(([name]) => <option key={name} value={name}>{name}</option>)}
                            </select>
                            {errors.role && <p className="text-xs text-red-600 mt-1">{errors.role}</p>}
                        </div>
                        {/* Branch */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Branch</label>
                            <select className="form-input w-full" value={data.branch}
                                onChange={(e) => setData('branch', e.target.value)}>
                                <option value="">— Select branch —</option>
                                {branches.map((b) => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        {/* Dept */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                            <input type="text" className="form-input w-full" placeholder="e.g. IT Operations"
                                value={data.dept} onChange={(e) => setData('dept', e.target.value)} />
                        </div>
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Job Title</label>
                            <input type="text" className="form-input w-full" placeholder="e.g. SOC Analyst"
                                value={data.title} onChange={(e) => setData('title', e.target.value)} />
                        </div>
                        {/* Status */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                            <select className="form-input w-full" value={data.status}
                                onChange={(e) => setData('status', e.target.value)}>
                                {STATUSES.map((s) => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        {/* MFA */}
                        <div className="col-span-2 flex items-center gap-3">
                            <input type="checkbox" id="u-mfa" className="w-4 h-4 rounded accent-blue-600"
                                checked={data.mfa} onChange={(e) => setData('mfa', e.target.checked)} />
                            <label htmlFor="u-mfa" className="text-sm font-medium text-gray-700">MFA Enabled</label>
                        </div>
                    </div>

                    {/* Role hint */}
                    {selectedMeta && (
                        <div className="rounded-xl border p-3.5 text-sm"
                            style={{ background: `#${selectedMeta.color}12`, borderColor: `#${selectedMeta.color}40`, color: `#${selectedMeta.color}` }}>
                            <div className="flex items-start gap-2.5">
                                <i className={`fas ${selectedMeta.icon} mt-0.5`}></i>
                                <div>
                                    <p className="font-bold">{data.role}</p>
                                    <p className="opacity-80 mt-0.5">{selectedMeta.desc}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn btn-secondary px-5">Cancel</button>
                        <button type="submit" disabled={processing} className="btn btn-primary px-5">
                            {processing ? <><i className="fas fa-spinner fa-spin mr-1.5"></i>Saving...</> : <><i className="fas fa-floppy-disk mr-1.5"></i>Save User</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Assign role inline (pending users) ────────────────────────────────────────
function AssignRoleRow({ user, roleMeta, onAssigned }: {
    user: UserDir;
    roleMeta: Record<string, RoleMeta>;
    onAssigned: () => void;
}) {
    const [role, setRole] = useState('');
    const [busy, setBusy] = useState(false);

    function assign() {
        if (!role) return;
        setBusy(true);
        router.post(`/users/${user.id}/assign-role`, { role }, {
            onSuccess: onAssigned,
            onFinish:  () => setBusy(false),
        });
    }

    return (
        <tr className="hover:bg-amber-50/40 transition">
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <Avatar name={user.name} bg={user.avatar_bg} size={9} />
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 font-mono truncate">{user.email}</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 text-xs text-gray-500 font-mono">{user.username || '—'}</td>
            <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(user.created_at)}</td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <select className="form-input text-xs py-1.5 w-36" value={role} onChange={(e) => setRole(e.target.value)}>
                        <option value="">Pick a role…</option>
                        {Object.entries(roleMeta)
                            .filter(([n]) => n !== 'Unassigned')
                            .sort((a, b) => a[1].level - b[1].level)
                            .map(([n]) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <button type="button" disabled={!role || busy} onClick={assign}
                        className={`btn btn-primary text-xs py-1.5 px-3 whitespace-nowrap ${!role ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <i className="fas fa-check mr-1"></i>Assign
                    </button>
                </div>
            </td>
            <td className="px-4 py-3 text-right">
                <button type="button" title="Reject & Delete"
                    onClick={() => { if (confirm(`Reject and delete "${user.name}"?`)) router.delete(`/users/${user.id}`); }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    <i className="fas fa-trash text-xs"></i>
                </button>
            </td>
        </tr>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function UsersIndex({ users, stats, roleMeta, roleCounts, branches, filters }: Props) {
    const flash = (usePage<any>().props.flash ?? {}) as { success?: string };
    const [showModal, setShowModal]     = useState(false);
    const [editTarget, setEditTarget]   = useState<UserDir | undefined>(undefined);
    const [deleteTarget, setDeleteTarget] = useState<UserDir | null>(null);
    const [search, setSearch]           = useState(filters.search ?? '');
    const [filterRole, setFilterRole]   = useState(filters.role ?? '');
    const [filterStatus, setFilterStatus] = useState(filters.status ?? '');

    const filtered = users.filter((u) => {
        const s = search.toLowerCase();
        const matchSearch = !s || [u.name, u.email, u.title, u.dept, u.branch].join(' ').toLowerCase().includes(s);
        const matchRole   = !filterRole   || u.role   === filterRole;
        const matchStatus = !filterStatus || u.status === filterStatus;
        return matchSearch && matchRole && matchStatus;
    });

    const pending = users.filter((u) => u.role === 'Unassigned');

    function openCreate() { setEditTarget(undefined); setShowModal(true); }
    function openEdit(u: UserDir) { setEditTarget(u); setShowModal(true); }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/users/${deleteTarget.id}`, { onSuccess: () => setDeleteTarget(null) });
    }

    function handleDeleteAll() {
        if (!confirm(`Are you sure you want to delete all dummy user accounts? This will remove non-superadmin accounts while preserving your active login.`)) return;
        router.delete('/users/delete-all');
    }

    return (
        <AppLayout title="Users" subtitle="Manage user accounts and role assignments">
            <div className="space-y-6">

                {/* Flash */}
                {flash.success && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-800 text-sm">
                        <i className="fas fa-circle-check text-green-500"></i>{flash.success}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {[
                        { label: 'Total Users',      value: stats.total,    icon: 'fa-users',      color: 'blue' },
                        { label: 'Active',           value: stats.active,   icon: 'fa-circle-user', color: 'emerald' },
                        { label: 'With MFA',         value: stats.with_mfa, icon: 'fa-key',         color: 'purple' },
                        { label: 'Pending Approval', value: stats.pending,  icon: 'fa-user-clock',  color: 'amber' },
                    ].map((s) => (
                        <div key={s.label} className="card p-6 hover:shadow-md transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">{s.label}</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{s.value}</p>
                                </div>
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-${s.color}-50 text-${s.color}-500`}>
                                    <i className={`fas ${s.icon} text-2xl`}></i>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pending registrations panel */}
                {pending.length > 0 && (
                    <div className="card overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-amber-50">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-user-clock text-sm"></i>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">New Registrations</h3>
                                    <p className="text-xs text-gray-500">Pending role assignment — assign a role to activate portal access</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold bg-amber-500 text-white px-2.5 py-1 rounded-full">
                                {pending.length} pending
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full data-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Username</th>
                                        <th>Registered</th>
                                        <th>Assign Role</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pending.map((u) => (
                                        <AssignRoleRow
                                            key={u.id}
                                            user={u}
                                            roleMeta={roleMeta}
                                            onAssigned={() => router.reload()}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Role Hierarchy sidebar */}
                    <div className="card p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Role Hierarchy</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Highest to lowest privilege</p>
                            </div>
                        </div>
                        <div className="space-y-3 flex-1">
                            {Object.entries(roleMeta)
                                .sort((a, b) => a[1].level - b[1].level)
                                .map(([name, meta], idx) => {
                                    const count = roleCounts[name] ?? 0;
                                    const total = Math.max(stats.total, 1);
                                    const pct   = Math.round((count / total) * 100);
                                    const indent = name === 'Unassigned' ? 0 : Math.min(idx * 8, 40);
                                    return (
                                        <div key={name} style={{ marginLeft: `${indent}px` }}>
                                            <div className="p-3.5 rounded-xl border hover:shadow-sm transition"
                                                style={{ borderLeft: `${meta.level === 1 ? '4' : '2'}px solid #${meta.color}` }}>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                                            style={{ background: `#${meta.color}18`, color: `#${meta.color}` }}>
                                                            <i className={`fas ${meta.icon} text-sm`}></i>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-gray-900">{name}</p>
                                                            <p className="text-[11px] text-gray-500 leading-tight mt-0.5 truncate">{meta.desc}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex-shrink-0 ml-2">
                                                        <p className="text-xl font-black text-gray-900">{count}</p>
                                                        <p className="text-[10px] text-gray-400">{pct}%</p>
                                                    </div>
                                                </div>
                                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                                                    <div className="h-full rounded-full transition-all"
                                                        style={{ width: `${Math.min(100, pct * 2)}%`, background: `#${meta.color}` }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                        <button onClick={openCreate} className="mt-5 w-full btn btn-primary justify-center">
                            <i className="fas fa-user-plus mr-2"></i>Add New User
                        </button>
                    </div>

                    {/* User directory table */}
                    <div className="card p-6 lg:col-span-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">User Directory</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    <span className="font-semibold">{filtered.length}</span> of <span className="font-semibold">{users.length}</span> users
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative">
                                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                                    <input type="text" className="form-input pl-9 text-sm py-2 w-48"
                                        placeholder="Search users..."
                                        value={search} onChange={(e) => setSearch(e.target.value)} />
                                </div>
                                <select className="form-input text-sm py-2 w-auto" value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}>
                                    <option value="">All Roles</option>
                                    {Object.keys(roleMeta).map((r) => <option key={r}>{r}</option>)}
                                </select>
                                <select className="form-input text-sm py-2 w-auto" value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}>
                                    <option value="">All Status</option>
                                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                                </select>
                                {users.length > 1 && (
                                    <button
                                        onClick={handleDeleteAll}
                                        className="btn border border-red-200 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white text-sm py-2"
                                        title="Delete dummy user accounts"
                                    >
                                        <i className="fas fa-trash-can mr-1.5"></i>Delete All
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-gray-100">
                            <table className="w-full data-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th className="hidden md:table-cell">Branch</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                                                <i className="fas fa-inbox text-3xl mb-3 block"></i>No users found
                                            </td>
                                        </tr>
                                    ) : filtered.map((u) => {
                                        const meta = roleMeta[u.role];
                                        const sBadge = STATUS_BADGE[u.status] ?? 'bg-gray-100 text-gray-600';
                                        const sDot   = STATUS_DOT[u.status]   ?? 'bg-gray-400';
                                        return (
                                            <tr key={u.id} className="group hover:bg-gray-50/50 transition">
                                                {/* User */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative flex-shrink-0">
                                                            <Avatar name={u.name} bg={u.avatar_bg} />
                                                            {u.mfa && (
                                                                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center" title="MFA enabled">
                                                                    <i className="fas fa-key text-white" style={{ fontSize: '6px' }}></i>
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-gray-900 truncate max-w-[160px]">{u.name}</p>
                                                            <p className="text-xs text-gray-500 truncate font-mono">{u.email}</p>
                                                            {(u.title || u.dept) && (
                                                                <p className="text-[11px] text-gray-400 truncate hidden sm:block">
                                                                    {[u.title, u.dept].filter(Boolean).join(' · ')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Role */}
                                                <td className="px-4 py-3">
                                                    <RoleBadge role={u.role} meta={meta} />
                                                </td>
                                                {/* Branch */}
                                                <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-700">
                                                    {u.branch
                                                        ? <span className="flex items-center gap-1.5"><i className="fas fa-building text-gray-400 text-xs"></i>{u.branch}</span>
                                                        : <span className="text-gray-300">—</span>
                                                    }
                                                </td>
                                                {/* Status */}
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${sBadge}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${sDot} mr-1.5`}></span>{u.status}
                                                    </span>
                                                </td>
                                                {/* Actions */}
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                                                        <button onClick={() => openEdit(u)}
                                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Edit">
                                                            <i className="fas fa-pen text-xs"></i>
                                                        </button>
                                                        <button onClick={() => setDeleteTarget(u)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                                                            <i className="fas fa-trash text-xs"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-5 pt-5 border-t border-gray-100 text-sm text-gray-500">
                            Showing <span className="font-semibold text-gray-900">{filtered.length}</span> of{' '}
                            <span className="font-semibold text-gray-900">{users.length}</span> users
                        </div>
                    </div>
                </div>
            </div>

            {/* Add / Edit modal */}
            {showModal && (
                <UserModal
                    roleMeta={roleMeta}
                    branches={branches}
                    initial={editTarget}
                    onClose={() => { setShowModal(false); setEditTarget(undefined); }}
                />
            )}

            {/* Delete confirmation modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <i className="fas fa-trash text-red-600"></i>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Delete User?</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Permanently delete <strong>{deleteTarget.name}</strong>? This cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="btn btn-secondary">Cancel</button>
                            <button onClick={confirmDelete} className="btn bg-red-600 text-white hover:bg-red-700 border border-red-700">
                                <i className="fas fa-trash mr-1.5"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
