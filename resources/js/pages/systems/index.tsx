import AppLayout from '@/components/AppLayout';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SystemItem {
    id: number;
    sys_id: string;
    name: string;
    category: string;
    status: string;
    criticality: string;
    hosting: string | null;
    owner: string | null;
    vendor: string | null;
    authentication: string | null;
    branch: string | null;
    url: string | null;
    created_at: string;
}

interface Stats {
    total: number;
    active: number;
    critical: number;
    high: number;
    decommissioned: number;
}

interface Filters {
    search?: string;
    category?: string;
    criticality?: string;
    hosting?: string;
    status?: string;
    branch?: string;
}

interface Props {
    systems: SystemItem[];
    stats: Stats;
    branches: string[];
    catCounts: Record<string, number>;
    filters: Filters;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CAT_META: Record<string, { icon: string; color: string }> = {
    'HRIS':        { icon: 'fa-users-gear',     color: 'purple' },
    'Enrollment':  { icon: 'fa-user-graduate',  color: 'cyan' },
    'Finance':     { icon: 'fa-coins',          color: 'emerald' },
    'Payroll':     { icon: 'fa-money-check',    color: 'green' },
    'LMS':         { icon: 'fa-graduation-cap', color: 'indigo' },
    'Library':     { icon: 'fa-book',           color: 'amber' },
    'Biometric':   { icon: 'fa-fingerprint',    color: 'orange' },
    'Email':       { icon: 'fa-envelope',       color: 'sky' },
    'Website':     { icon: 'fa-globe',          color: 'blue' },
    'Portal':      { icon: 'fa-door-open',      color: 'violet' },
    'Mobile App':  { icon: 'fa-mobile-screen',  color: 'pink' },
    'ERP':         { icon: 'fa-sitemap',        color: 'rose' },
    'Accounting':  { icon: 'fa-calculator',     color: 'teal' },
    'Inventory':   { icon: 'fa-boxes-stacked',  color: 'lime' },
    'Security':    { icon: 'fa-shield-halved',  color: 'red' },
    'Other':       { icon: 'fa-gear',           color: 'gray' },
};

const CAT_ORDER = Object.keys(CAT_META);

const CRIT_BADGE: Record<string, string> = {
    'Critical': 'bg-red-100 text-red-700 border border-red-200',
    'High':     'bg-orange-100 text-orange-700 border border-orange-200',
    'Medium':   'bg-amber-100 text-amber-700 border border-amber-200',
    'Low':      'bg-green-100 text-green-700 border border-green-200',
};

const STATUS_BADGE: Record<string, string> = {
    'Active':          'bg-green-100 text-green-700 border border-green-200',
    'Maintenance':     'bg-amber-100 text-amber-700 border border-amber-200',
    'Development':     'bg-blue-100 text-blue-700 border border-blue-200',
    'Decommissioned':  'bg-gray-100 text-gray-500 border border-gray-200',
    'Suspended':       'bg-red-100 text-red-700 border border-red-200',
};

const HOSTING_ICON: Record<string, { icon: string; color: string }> = {
    'Cloud':       { icon: 'fa-cloud',          color: 'text-sky-500' },
    'On-Premise':  { icon: 'fa-server',         color: 'text-indigo-500' },
    'Hybrid':      { icon: 'fa-network-wired',  color: 'text-purple-500' },
    'SaaS':        { icon: 'fa-cubes',          color: 'text-teal-500' },
};

const CRITICALITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES      = ['Active', 'Maintenance', 'Development', 'Suspended', 'Decommissioned'];
const HOSTING_OPTS  = ['On-Premise', 'Cloud', 'Hybrid', 'SaaS'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function SystemsIndex({ systems, stats, branches, catCounts, filters }: Props) {
    const { auth } = usePage<any>().props;
    const isAdmin  = ['super_admin', 'admin'].includes(auth.user?.role ?? '');

    const [form, setForm] = useState<Filters>({
        search:      filters.search      ?? '',
        category:    filters.category    ?? '',
        criticality: filters.criticality ?? '',
        hosting:     filters.hosting     ?? '',
        status:      filters.status      ?? '',
        branch:      filters.branch      ?? '',
    });

    const filterCount = Object.values(filters).filter(Boolean).length;

    function applyFilters(e: React.FormEvent) {
        e.preventDefault();
        router.get('/systems', form as Record<string, string>, { preserveState: true });
    }

    function clearFilters() { router.get('/systems'); }

    function handleDelete(id: number, name: string) {
        if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
        router.delete(`/systems/${id}`);
    }

    function handleDeleteAll() {
        if (!confirm(`Are you sure you want to delete ALL ${stats.total} systems? This will permanently remove all registry entries.`)) return;
        router.delete('/systems/delete-all');
    }

    return (
        <AppLayout title="Systems Registry" subtitle="Every application and system in the organization">
            <div className="space-y-6">

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                        { label: 'Total Systems',   value: stats.total,          icon: 'fa-layer-group',          bg: 'bg-blue-50',   color: 'text-blue-500' },
                        { label: 'Active',          value: stats.active,         icon: 'fa-circle-check',         bg: 'bg-green-50',  color: 'text-green-600' },
                        { label: 'Critical',        value: stats.critical,       icon: 'fa-triangle-exclamation', bg: 'bg-red-50',    color: 'text-red-600' },
                        { label: 'High Priority',   value: stats.high,           icon: 'fa-fire',                 bg: 'bg-orange-50', color: 'text-orange-600' },
                        { label: 'Decommissioned',  value: stats.decommissioned, icon: 'fa-power-off',            bg: 'bg-gray-100',  color: 'text-gray-400' },
                    ].map((s) => (
                        <div key={s.label} className="card p-5 hover:shadow-md transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
                                </div>
                                <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center`}>
                                    <i className={`fas ${s.icon} ${s.color}`}></i>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Category grid ── */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <i className="fas fa-th-large mr-2 text-blue-500"></i>System Categories
                        </h3>
                        <span className="text-sm text-gray-500">{CAT_ORDER.length} categories</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                        {CAT_ORDER.map((catName) => {
                            const meta   = CAT_META[catName];
                            const cnt    = catCounts[catName] ?? 0;
                            const active = filters.category === catName;
                            return (
                                <button
                                    key={catName}
                                    onClick={() => {
                                        const newCat = active ? '' : catName;
                                        setForm({ ...form, category: newCat });
                                        router.get('/systems', { ...form, category: newCat } as Record<string, string>, { preserveState: true });
                                    }}
                                    className={`group border rounded-xl p-4 hover:shadow-md transition text-left ${
                                        active ? `border-${meta.color}-300 bg-${meta.color}-50/60` : `border-gray-100 bg-white hover:border-${meta.color}-200`
                                    }`}
                                >
                                    <div className={`w-10 h-10 bg-${meta.color}-100 text-${meta.color}-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition`}>
                                        <i className={`fas ${meta.icon} text-sm`}></i>
                                    </div>
                                    <p className="text-xs font-bold text-gray-800 truncate">{catName}</p>
                                    <p className={`text-xl font-bold text-${meta.color}-700 mt-1`}>{cnt}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Table card ── */}
                <div className="card p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                <i className="fas fa-list-check mr-2 text-blue-500"></i>Systems Registry
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                <span className="font-semibold">{stats.total}</span> total &bull; Showing{' '}
                                <span className="font-semibold">{systems.length}</span>
                                {filterCount > 0 && (
                                    <button onClick={clearFilters} className="ml-2 text-xs text-blue-600 hover:underline">Clear filters</button>
                                )}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {stats.total > 0 && (
                                <button
                                    onClick={handleDeleteAll}
                                    className="btn border border-red-200 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white text-sm py-2"
                                    title="Delete all systems"
                                >
                                    <i className="fas fa-trash-can mr-1.5"></i>Delete All
                                </button>
                            )}
                            {isAdmin && (
                                <Link href="/systems/create" className="btn btn-primary text-sm py-2">
                                    <i className="fas fa-plus mr-1.5"></i>Register System
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Filter bar */}
                    <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 mb-5 p-4 bg-blue-50/40 rounded-xl border border-blue-100">
                        <div className="lg:col-span-2">
                            <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wide mb-1.5">Search</label>
                            <div className="relative">
                                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                                <input type="text" className="form-input pl-9 py-2 text-sm bg-white"
                                    placeholder="Name, Owner, Vendor..."
                                    value={form.search} onChange={(e) => setForm({ ...form, search: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wide mb-1.5">Category</label>
                            <select className="form-input py-2 text-sm bg-white" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                <option value="">All Categories</option>
                                {CAT_ORDER.map((c) => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wide mb-1.5">Criticality</label>
                            <select className="form-input py-2 text-sm bg-white" value={form.criticality} onChange={(e) => setForm({ ...form, criticality: e.target.value })}>
                                <option value="">Any</option>
                                {CRITICALITIES.map((c) => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wide mb-1.5">Status</label>
                            <select className="form-input py-2 text-sm bg-white" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                <option value="">All Statuses</option>
                                {STATUSES.map((s) => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wide mb-1.5">Branch</label>
                            <select className="form-input py-2 text-sm bg-white" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                                <option value="">All Branches</option>
                                {branches.map((b) => <option key={b}>{b}</option>)}
                            </select>
                        </div>
                        <div className="flex items-end gap-2">
                            <button type="submit" className="btn btn-primary py-2 text-sm flex-1">
                                <i className="fas fa-search mr-1.5"></i>Apply
                            </button>
                            <button type="button" onClick={clearFilters} className="btn btn-secondary py-2 text-sm" title="Reset">
                                <i className="fas fa-redo"></i>
                            </button>
                        </div>
                    </form>

                    {/* Table */}
                    <div className="overflow-hidden rounded-xl border border-blue-100">
                        <div className="overflow-x-auto">
                            <table className="w-full data-table">
                                <thead>
                                    <tr className="bg-blue-50/50">
                                        <th>System</th>
                                        <th className="hidden md:table-cell">Owner</th>
                                        <th className="hidden lg:table-cell">Vendor</th>
                                        <th className="hidden md:table-cell">Hosting</th>
                                        <th>Criticality</th>
                                        <th className="hidden lg:table-cell">Auth</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {systems.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                                                <i className="fas fa-layer-group text-3xl mb-3 block"></i>
                                                {filterCount > 0 ? 'No systems match your filters.' : (
                                                    <span>No systems registered. {isAdmin && <Link href="/systems/create" className="text-blue-600 hover:underline font-semibold">Register the first system</Link>}.</span>
                                                )}
                                            </td>
                                        </tr>
                                    ) : systems.map((sys) => {
                                        const meta       = CAT_META[sys.category] ?? { icon: 'fa-gear', color: 'gray' };
                                        const critCls    = CRIT_BADGE[sys.criticality] ?? 'bg-gray-100 text-gray-600';
                                        const statusCls  = STATUS_BADGE[sys.status]    ?? 'bg-gray-100 text-gray-600';
                                        const hostingMeta = sys.hosting ? (HOSTING_ICON[sys.hosting] ?? null) : null;
                                        return (
                                            <tr key={sys.id} className="group hover:bg-gray-50/50 transition">
                                                <td>
                                                    <Link href={`/systems/${sys.id}`} className="flex items-center space-x-3 min-w-0">
                                                        <div className={`w-9 h-9 bg-${meta.color}-100 text-${meta.color}-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
                                                            <i className={`fas ${meta.icon} text-xs`}></i>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 truncate max-w-xs group-hover:text-blue-600 transition">{sys.name}</p>
                                                            <p className="text-xs text-gray-500">{sys.sys_id} · {sys.category}</p>
                                                        </div>
                                                    </Link>
                                                </td>
                                                <td className="hidden md:table-cell text-sm text-gray-700">{sys.owner ?? '—'}</td>
                                                <td className="hidden lg:table-cell text-sm text-gray-700">{sys.vendor ?? '—'}</td>
                                                <td className="hidden md:table-cell text-sm text-gray-600">
                                                    {hostingMeta && <i className={`fas ${hostingMeta.icon} ${hostingMeta.color} mr-1.5`}></i>}
                                                    {sys.hosting ?? '—'}
                                                </td>
                                                <td>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${critCls}`}>
                                                        {sys.criticality ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="hidden lg:table-cell text-sm text-gray-600">{sys.authentication ?? '—'}</td>
                                                <td>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${statusCls}`}>
                                                        {sys.status ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition">
                                                        <Link href={`/systems/${sys.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View">
                                                            <i className="fas fa-eye text-xs"></i>
                                                        </Link>
                                                        {isAdmin && (
                                                            <>
                                                                <Link href={`/systems/${sys.id}/edit`} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Edit">
                                                                    <i className="fas fa-pen text-xs"></i>
                                                                </Link>
                                                                <button onClick={() => handleDelete(sys.id, sys.name)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                                                                    <i className="fas fa-trash text-xs"></i>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                        <span>
                            Showing <span className="font-semibold text-gray-900">{systems.length}</span> of{' '}
                            <span className="font-semibold text-gray-900">{stats.total}</span> systems
                        </span>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
