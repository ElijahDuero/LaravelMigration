import AppLayout from '@/components/AppLayout';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Branch {
    id: number;
    code: string;
    name: string;
    location: string;
    type: string;
    status: string;
    head: string | null;
    contact: string | null;
    email: string | null;
    employees: number;
    campuses: number;
    established: string | null;
    notes: string | null;
    incidents: number;
    hardware: number;
    software: number;
    systems: number;
    security_score: number | null;
}
interface Stats    { total: number; active: number; planned: number; employees: number; }
interface Filters  { search?: string; status?: string; type?: string; }
interface Props    { branches: Branch[]; stats: Stats; nextCode: string; filters: Filters; }

// ── Constants ──────────────────────────────────────────────────────────────────
const TYPES    = ['HQ', 'Satellite', 'Remote', 'Data Center'];
const STATUSES = ['Active', 'Planned', 'Inactive'];

const STATUS_BADGE: Record<string, string> = {
    Active:   'bg-green-100 text-green-700 border border-green-200',
    Planned:  'bg-blue-100 text-blue-700 border border-blue-200',
    Inactive: 'bg-gray-100 text-gray-500 border border-gray-200',
};
const TYPE_BADGE: Record<string, string> = {
    HQ:           'bg-purple-100 text-purple-700',
    Satellite:    'bg-blue-100 text-blue-700',
    Remote:       'bg-amber-100 text-amber-700',
    'Data Center':'bg-indigo-100 text-indigo-700',
};

function scoreColor(s: number | null) {
    if (s === null) return 'text-gray-300';
    if (s >= 75) return 'text-green-600';
    if (s >= 50) return 'text-amber-600';
    if (s >= 25) return 'text-orange-600';
    return 'text-red-600';
}
function scoreBar(s: number | null) {
    if (s === null) return 'bg-gray-200';
    if (s >= 75) return 'bg-green-500';
    if (s >= 50) return 'bg-amber-500';
    if (s >= 25) return 'bg-orange-500';
    return 'bg-red-500';
}

// ── Inline branch form (create or edit) ───────────────────────────────────────
function BranchForm({ nextCode, initial, onClose }: {
    nextCode: string;
    initial?: Branch;
    onClose: () => void;
}) {
    const isEdit = !!initial;
    const { data, setData, post, put, processing, errors } = useForm({
        name:        initial?.name        ?? '',
        location:    initial?.location    ?? '',
        type:        initial?.type        ?? 'Satellite',
        status:      initial?.status      ?? 'Active',
        head:        initial?.head        ?? '',
        contact:     initial?.contact     ?? '',
        email:       initial?.email       ?? '',
        employees:   initial?.employees   ?? 0,
        campuses:    initial?.campuses    ?? 1,
        established: initial?.established ? initial.established.slice(0, 10) : '',
        notes:       initial?.notes       ?? '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) {
            put(`/branches/${initial!.id}`, { onSuccess: onClose });
        } else {
            post('/branches', { onSuccess: onClose });
        }
    }

    return (
        <div className="card p-6">
            <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center">
                <i className={`fas ${isEdit ? 'fa-pen' : 'fa-plus'} mr-2 text-blue-500`}></i>
                {isEdit ? 'Edit Branch' : 'Create New Branch'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Code preview + Status */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                            Code <span className="text-xs font-normal text-gray-400 normal-case ml-1">(auto-assigned)</span>
                        </label>
                        <div className={`form-input font-mono uppercase flex items-center gap-2 cursor-default select-all ${isEdit ? 'bg-gray-50 text-gray-600' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                            <i className={`fas ${isEdit ? 'fa-barcode' : 'fa-wand-magic-sparkles'} text-xs ${isEdit ? 'text-gray-400' : 'text-blue-400'}`}></i>
                            {isEdit ? initial!.code : nextCode}
                            <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded ${isEdit ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-500'}`}>
                                {isEdit ? 'Fixed' : 'Auto'}
                            </span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Status</label>
                        <select className="form-input" value={data.status} onChange={(e) => setData('status', e.target.value)}>
                            {STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {/* Name */}
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Branch Name <span className="text-red-500">*</span>
                    </label>
                    <input type="text" required className={`form-input ${errors.name ? 'border-red-400' : ''}`}
                        placeholder="e.g. Makati Branch"
                        value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                </div>

                {/* Location + Type */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                            Location <span className="text-red-500">*</span>
                        </label>
                        <input type="text" required className={`form-input ${errors.location ? 'border-red-400' : ''}`}
                            placeholder="City / Address"
                            value={data.location} onChange={(e) => setData('location', e.target.value)} />
                        {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Type</label>
                        <select className="form-input" value={data.type} onChange={(e) => setData('type', e.target.value)}>
                            {TYPES.map((t) => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                {/* Head + Contact */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Branch Head</label>
                        <input type="text" className="form-input" placeholder="Full name"
                            value={data.head} onChange={(e) => setData('head', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Contact Phone</label>
                        <input type="text" className="form-input font-mono" placeholder="+63 ..."
                            value={data.contact} onChange={(e) => setData('contact', e.target.value)} />
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Email</label>
                    <input type="email" className="form-input" placeholder="branch@company.com"
                        value={data.email} onChange={(e) => setData('email', e.target.value)} />
                </div>

                {/* Employees + Campuses + Established */}
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Employees</label>
                        <input type="number" min={0} className="form-input"
                            value={data.employees} onChange={(e) => setData('employees', parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Campuses</label>
                        <input type="number" min={0} className="form-input"
                            value={data.campuses} onChange={(e) => setData('campuses', parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Established</label>
                        <input type="date" className="form-input"
                            value={data.established} onChange={(e) => setData('established', e.target.value)} />
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Notes</label>
                    <textarea className="form-input" rows={2} placeholder="Any additional info..."
                        value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                </div>

                <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={processing} className="btn btn-primary flex-1">
                        {processing
                            ? <><i className="fas fa-spinner fa-spin mr-1.5"></i>Saving...</>
                            : <><i className="fas fa-save mr-1.5"></i>{isEdit ? 'Save Changes' : 'Create Branch'}</>
                        }
                    </button>
                    <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                </div>
            </form>
        </div>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function BranchesIndex({ branches, stats, nextCode, filters }: Props) {
    const flash = (usePage<any>().props.flash ?? {}) as { success?: string };
    const [showForm, setShowForm]   = useState(false);
    const [editTarget, setEditTarget] = useState<Branch | undefined>(undefined);
    const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);

    const [form, setForm] = useState({
        search: filters.search ?? '',
        status: filters.status ?? '',
        type:   filters.type   ?? '',
    });

    function applyFilters(e: React.FormEvent) {
        e.preventDefault();
        const q: Record<string, string> = {};
        if (form.search) q.search = form.search;
        if (form.status) q.status = form.status;
        if (form.type)   q.type   = form.type;
        router.get('/branches', q, { preserveState: true });
    }

    function clearFilters() { router.get('/branches'); }

    function openCreate() { setEditTarget(undefined); setShowForm(true); }
    function openEdit(b: Branch) { setEditTarget(b); setShowForm(true); }
    function closeForm() { setShowForm(false); setEditTarget(undefined); }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/branches/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    }

    function handleDeleteAll() {
        if (!confirm(`Are you sure you want to delete ALL ${stats.total} branches and their security posture records? This cannot be undone.`)) return;
        router.delete('/branches/delete-all');
    }

    const filterCount = Object.values(filters).filter(Boolean).length;

    return (
        <AppLayout title="Branches" subtitle="Manage all organizational branches">
            <div className="space-y-5">

                {/* Flash */}
                {flash.success && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-800 text-sm">
                        <i className="fas fa-circle-check text-green-500"></i>{flash.success}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Branches',  value: stats.total,     icon: 'fa-building',              color: 'blue'   },
                        { label: 'Active',          value: stats.active,    icon: 'fa-building-circle-check', color: 'green'  },
                        { label: 'Planned',         value: stats.planned,   icon: 'fa-clock',                 color: 'amber'  },
                        { label: 'Total Employees', value: stats.employees.toLocaleString(), icon: 'fa-users', color: 'purple' },
                    ].map((s) => (
                        <div key={s.label} className="card p-4 hover:shadow-md transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{s.label}</p>
                                    <p className="text-2xl font-black text-gray-900 mt-1">{s.value}</p>
                                </div>
                                <div className={`w-10 h-10 rounded-lg bg-${s.color}-50 text-${s.color}-500 flex items-center justify-center`}>
                                    <i className={`fas ${s.icon}`}></i>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main grid: form + table */}
                <div className={`grid grid-cols-1 ${showForm ? 'lg:grid-cols-5' : ''} gap-5`}>

                    {/* Inline form */}
                    {showForm && (
                        <div className="lg:col-span-2">
                            <BranchForm nextCode={nextCode} initial={editTarget} onClose={closeForm} />
                        </div>
                    )}

                    {/* Table card */}
                    <div className={showForm ? 'lg:col-span-3' : ''}>
                        <div className="card p-5">
                            {/* Toolbar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Branch Directory</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {branches.length} of {stats.total} branches
                                        {filterCount > 0 && (
                                            <button onClick={clearFilters} className="ml-2 text-blue-600 hover:underline">Clear filters</button>
                                        )}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <form onSubmit={applyFilters} className="flex items-center gap-2 flex-wrap">
                                        <div className="relative">
                                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                                            <input type="text" className="form-input pl-8 py-1.5 text-sm w-40"
                                                placeholder="Search..." value={form.search}
                                                onChange={(e) => setForm({ ...form, search: e.target.value })} />
                                        </div>
                                        <select className="form-input py-1.5 text-sm" value={form.status}
                                            onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                            <option value="">All Statuses</option>
                                            {STATUSES.map((s) => <option key={s}>{s}</option>)}
                                        </select>
                                        <select className="form-input py-1.5 text-sm" value={form.type}
                                            onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                            <option value="">All Types</option>
                                            {TYPES.map((t) => <option key={t}>{t}</option>)}
                                        </select>
                                        <button type="submit" className="btn btn-secondary py-1.5 text-xs">
                                            <i className="fas fa-search mr-1"></i>Filter
                                        </button>
                                    </form>
                                    {!showForm && (
                                        <>
                                            {branches.length > 0 && (
                                                <button
                                                    onClick={handleDeleteAll}
                                                    className="btn border border-red-200 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white py-1.5 text-xs font-semibold"
                                                    title="Delete all branches"
                                                >
                                                    <i className="fas fa-trash-can mr-1"></i>Delete All
                                                </button>
                                            )}
                                            <button onClick={openCreate} className="btn btn-primary py-1.5 text-sm">
                                                <i className="fas fa-plus mr-1.5"></i>New Branch
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Empty state */}
                            {branches.length === 0 ? (
                                <div className="text-center py-14 text-gray-400">
                                    <i className="fas fa-building text-4xl mb-3 block text-gray-300"></i>
                                    <p className="text-sm font-medium">
                                        {stats.total === 0 ? 'No branches yet.' : 'No branches match your filters.'}
                                    </p>
                                    {stats.total === 0 && (
                                        <button onClick={openCreate} className="mt-3 text-sm text-blue-600 font-semibold hover:underline">
                                            Create your first branch →
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-gray-100">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50/80 text-left">
                                                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Branch</th>
                                                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Head / Contact</th>
                                                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide text-center hidden lg:table-cell">Incidents</th>
                                                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide text-center hidden lg:table-cell">Assets</th>
                                                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide text-center hidden lg:table-cell">Systems</th>
                                                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Security</th>
                                                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Status</th>
                                                <th className="px-4 py-2.5"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {branches.map((b) => (
                                                <tr key={b.id} className="group hover:bg-gray-50/50 transition">
                                                    {/* Branch name + code */}
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                                                <i className="fas fa-building text-xs"></i>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                                    <span className="text-[9px] font-black bg-gray-900 text-white px-1.5 py-0.5 rounded font-mono">{b.code}</span>
                                                                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${TYPE_BADGE[b.type] ?? 'bg-gray-100 text-gray-600'}`}>{b.type}</span>
                                                                </div>
                                                                <Link href={`/branches/${b.id}`} className="font-bold text-gray-900 hover:text-blue-600 transition truncate block max-w-[180px]">
                                                                    {b.name}
                                                                </Link>
                                                                <p className="text-xs text-gray-400 truncate">
                                                                    <i className="fas fa-location-dot mr-1 text-[10px]"></i>{b.location}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {/* Head */}
                                                    <td className="px-4 py-3 hidden md:table-cell">
                                                        <p className="font-semibold text-gray-800 text-xs truncate max-w-[150px]">{b.head || '—'}</p>
                                                        {b.contact && <p className="text-xs font-mono text-gray-500 mt-0.5">{b.contact}</p>}
                                                    </td>
                                                    {/* Incidents */}
                                                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                                                        <span className={`font-bold text-sm ${b.incidents > 0 ? 'text-red-600' : 'text-gray-400'}`}>{b.incidents}</span>
                                                    </td>
                                                    {/* Assets */}
                                                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                                                        <span className="text-xs text-gray-600 font-semibold">
                                                            <span className="text-cyan-600">{b.hardware}</span> HW
                                                            {' / '}
                                                            <span className="text-indigo-600">{b.software}</span> SW
                                                        </span>
                                                    </td>
                                                    {/* Systems */}
                                                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                                                        <span className={`font-bold text-sm ${b.systems > 0 ? 'text-blue-600' : 'text-gray-400'}`}>{b.systems}</span>
                                                    </td>
                                                    {/* Security score */}
                                                    <td className="px-4 py-3 hidden lg:table-cell">
                                                        {b.security_score !== null ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                    <div className={`h-full rounded-full ${scoreBar(b.security_score)}`}
                                                                        style={{ width: `${b.security_score}%` }} />
                                                                </div>
                                                                <span className={`text-xs font-bold ${scoreColor(b.security_score)}`}>{b.security_score}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-300 italic">—</span>
                                                        )}
                                                    </td>
                                                    {/* Status */}
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[b.status] ?? 'bg-gray-100 text-gray-500'}`}>
                                                            {b.status}
                                                        </span>
                                                    </td>
                                                    {/* Actions */}
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                                                            <Link href={`/branches/${b.id}`}
                                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View">
                                                                <i className="fas fa-eye text-xs"></i>
                                                            </Link>
                                                            <button onClick={() => openEdit(b)}
                                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Edit">
                                                                <i className="fas fa-pen text-xs"></i>
                                                            </button>
                                                            <button onClick={() => setDeleteTarget(b)}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                                                                <i className="fas fa-trash text-xs"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <i className="fas fa-trash text-red-600"></i>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Delete Branch?</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Permanently delete <strong>{deleteTarget.name}</strong> ({deleteTarget.code})?
                            This cannot be undone.
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
