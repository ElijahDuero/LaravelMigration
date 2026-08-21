import AppLayout from '@/components/AppLayout';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SoftwareItem {
    id: number;
    sw_id: string;
    name: string;
    category: string;
    vendor: string;
    version: string | null;
    license_type: string;
    total_licenses: number;
    used_licenses: number;
    branch: string | null;
    department: string | null;
    expiry_date: string | null;
    created_at: string;
}

interface Stats {
    total: number;
    titles: number;
    licensed: number;
    unlicensed: number;
    expired: number;
    expiring: number;
}

interface Filters {
    search?: string;
    category?: string;
    license?: string;
    branch?: string;
    expiry?: string;
}

interface Props {
    software: SoftwareItem[];
    stats: Stats;
    branches: string[];
    catCounts: Record<string, number>;
    filters: Filters;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CAT_META: Record<string, { icon: string; color: string }> = {
    'Antivirus':      { icon: 'fa-shield-halved',        color: 'red' },
    'Office':         { icon: 'fa-file-word',             color: 'blue' },
    'HRIS':           { icon: 'fa-users-gear',            color: 'indigo' },
    'Accounting':     { icon: 'fa-calculator',            color: 'emerald' },
    'Enrollment':     { icon: 'fa-user-graduate',         color: 'cyan' },
    'LMS':            { icon: 'fa-graduation-cap',        color: 'amber' },
    'Payroll':        { icon: 'fa-money-check-dollar',    color: 'green' },
    'Custom Systems': { icon: 'fa-gear',                  color: 'gray' },
};

const CAT_ORDER = Object.keys(CAT_META);

const LICENSE_BADGE: Record<string, string> = {
    'Licensed':   'bg-green-50 text-green-700 border border-green-200',
    'Free / OSS': 'bg-teal-50 text-teal-700 border border-teal-200',
    'Trial':      'bg-blue-50 text-blue-700 border border-blue-200',
    'Expired':    'bg-red-50 text-red-700 border border-red-200',
    'Unlicensed': 'bg-amber-50 text-amber-700 border border-amber-200',
};

const LICENSE_TYPES = ['Licensed', 'Free / OSS', 'Trial', 'Unlicensed', 'Expired'];

function expiryDisplay(dateStr: string | null): { text: string; cls: string; icon: string } {
    if (!dateStr) return { text: 'Perpetual', cls: 'text-emerald-600', icon: 'fa-infinity' };
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.floor(diff / 86_400_000);
    const fmt  = new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (days < 0)  return { text: `Expired (${fmt})`,   cls: 'text-red-600 font-bold',    icon: 'fa-circle-xmark' };
    if (days < 30) return { text: `${days}d left`,      cls: 'text-red-600 font-bold',    icon: 'fa-triangle-exclamation' };
    if (days < 90) return { text: `${days}d left`,      cls: 'text-amber-600 font-semibold', icon: 'fa-clock' };
    return { text: fmt, cls: 'text-green-600', icon: 'fa-circle-check' };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SoftwareIndex({ software, stats, branches, catCounts, filters }: Props) {
    const { auth } = usePage<any>().props;
    const isAdmin  = ['super_admin', 'admin'].includes(auth.user?.role ?? '');

    const [form, setForm] = useState<Filters>({
        search:   filters.search   ?? '',
        category: filters.category ?? '',
        license:  filters.license  ?? '',
        branch:   filters.branch   ?? '',
        expiry:   filters.expiry   ?? '',
    });

    const filterCount = Object.values(filters).filter((v) => v && v !== '').length;

    function applyFilters(e: React.FormEvent) {
        e.preventDefault();
        router.get('/software', form as Record<string, string>, { preserveState: true });
    }

    function clearFilters() { router.get('/software'); }

    function handleDelete(swId: string, name: string) {
        if (!confirm(`Permanently delete ${swId} — ${name}? This cannot be undone.`)) return;
        router.delete(`/software/${swId}`);
    }

    function handleDeleteAll() {
        if (!confirm(`Are you sure you want to delete ALL ${stats.total} software licenses? This will permanently remove all software records.`)) return;
        router.delete('/software/delete-all');
    }

    return (
        <AppLayout title="Software Inventory" subtitle="Installed software, licenses, versions, vendors, and expirations">
            <div className="space-y-6">

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Records',          value: stats.total,      icon: 'fa-download',             bg: 'bg-purple-50',  color: 'text-purple-500' },
                        { label: 'Software Titles',  value: stats.titles,     icon: 'fa-box',                  bg: 'bg-blue-50',    color: 'text-blue-500' },
                        { label: 'Active Licenses',  value: stats.licensed,   icon: 'fa-key',                  bg: 'bg-green-50',   color: 'text-green-500' },
                        { label: 'Expired',          value: stats.expired,    icon: 'fa-arrow-up-right-dots',  bg: 'bg-amber-50',   color: 'text-amber-500' },
                        { label: 'Expiring < 90d',   value: stats.expiring,   icon: 'fa-clock',                bg: 'bg-red-50',     color: 'text-red-500' },
                        { label: 'Unlicensed',       value: stats.unlicensed, icon: 'fa-triangle-exclamation', bg: 'bg-rose-50',    color: 'text-rose-500' },
                    ].map((s) => (
                        <div key={s.label} className="card p-5 hover:shadow-md transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
                                    <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
                                </div>
                                <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center`}>
                                    <i className={`fas ${s.icon} ${s.color}`}></i>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Category cards ── */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <i className="fas fa-layer-group mr-2 text-purple-500"></i>Software Categories
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
                                        router.get('/software', { ...form, category: newCat } as Record<string, string>, { preserveState: true });
                                    }}
                                    className={`group border rounded-xl p-4 hover:shadow-md transition text-left ${
                                        active
                                            ? `border-${meta.color}-300 bg-${meta.color}-50/60`
                                            : `border-gray-100 bg-white hover:border-${meta.color}-200`
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
                                <i className="fas fa-list-check mr-2 text-purple-500"></i>Software Inventory
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                <span className="font-semibold">{stats.total}</span> total &bull; Showing{' '}
                                <span className="font-semibold">{software.length}</span>
                                {filterCount > 0 && (
                                    <button onClick={clearFilters} className="ml-2 text-xs text-blue-600 hover:underline">
                                        Clear filters
                                    </button>
                                )}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {stats.total > 0 && (
                                <button
                                    onClick={handleDeleteAll}
                                    className="btn border border-red-200 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white text-sm py-2"
                                    title="Delete all software licenses"
                                >
                                    <i className="fas fa-trash-can mr-1.5"></i>Delete All
                                </button>
                            )}
                            {isAdmin && (
                                <Link href="/software/create" className="btn btn-primary text-sm py-2">
                                    <i className="fas fa-plus mr-1.5"></i>Register Software
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Filter bar */}
                    <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mb-5 p-4 bg-purple-50/40 rounded-xl border border-purple-100">
                        <div className="lg:col-span-2">
                            <label className="block text-[10px] font-bold text-purple-800 uppercase tracking-wide mb-1.5">Search</label>
                            <div className="relative">
                                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                                <input type="text" className="form-input pl-9 py-2 text-sm bg-white"
                                    placeholder="Name, Vendor, Branch..."
                                    value={form.search} onChange={(e) => setForm({ ...form, search: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-purple-800 uppercase tracking-wide mb-1.5">Category</label>
                            <select className="form-input py-2 text-sm bg-white" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                <option value="">All Categories</option>
                                {CAT_ORDER.map((c) => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-purple-800 uppercase tracking-wide mb-1.5">License</label>
                            <select className="form-input py-2 text-sm bg-white" value={form.license} onChange={(e) => setForm({ ...form, license: e.target.value })}>
                                <option value="">Any Status</option>
                                {LICENSE_TYPES.map((l) => <option key={l}>{l}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-purple-800 uppercase tracking-wide mb-1.5">Branch</label>
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
                    <div className="overflow-hidden rounded-xl border border-purple-100">
                        <div className="overflow-x-auto">
                            <table className="w-full data-table">
                                <thead>
                                    <tr className="bg-purple-50/50">
                                        <th>Software</th>
                                        <th className="hidden md:table-cell">Version</th>
                                        <th className="hidden lg:table-cell">Vendor</th>
                                        <th>License</th>
                                        <th className="hidden md:table-cell">Seats</th>
                                        <th className="hidden md:table-cell">Branch</th>
                                        <th>Expiration</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {software.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                                                <i className="fas fa-box text-3xl mb-3 block"></i>
                                                {filterCount > 0
                                                    ? 'No software matches your filters.'
                                                    : <span>No software registered. {isAdmin && <Link href="/software/create" className="text-purple-600 hover:underline font-semibold">Register software</Link>}.</span>
                                                }
                                            </td>
                                        </tr>
                                    ) : software.map((sw) => {
                                        const meta      = CAT_META[sw.category] ?? { icon: 'fa-box', color: 'gray' };
                                        const licenseCls = LICENSE_BADGE[sw.license_type] ?? 'bg-gray-100 text-gray-700';
                                        const exp       = expiryDisplay(sw.expiry_date);
                                        const total     = sw.total_licenses ?? 0;
                                        const used      = sw.used_licenses  ?? 0;
                                        const pct       = total > 0 ? Math.min(100, Math.round(used / total * 100)) : 0;
                                        const barCls    = pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-green-500';
                                        return (
                                            <tr key={sw.id} className="group hover:bg-gray-50/50 transition">
                                                <td>
                                                    <Link href={`/software/${sw.sw_id}`} className="flex items-center space-x-3 min-w-0">
                                                        <div className={`w-9 h-9 bg-${meta.color}-100 text-${meta.color}-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
                                                            <i className={`fas ${meta.icon} text-xs`}></i>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 truncate max-w-xs group-hover:text-purple-600 transition">{sw.name}</p>
                                                            <p className="text-xs text-gray-500 font-mono">{sw.sw_id} · {sw.category}</p>
                                                        </div>
                                                    </Link>
                                                </td>
                                                <td className="hidden md:table-cell text-xs font-mono text-gray-600">{sw.version ?? '-'}</td>
                                                <td className="hidden lg:table-cell text-sm text-gray-700">{sw.vendor ?? '-'}</td>
                                                <td>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${licenseCls}`}>
                                                        {sw.license_type}
                                                    </span>
                                                </td>
                                                <td className="hidden md:table-cell">
                                                    {total > 0 ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                                                                <div className={`h-full ${barCls} rounded-full`} style={{ width: `${pct}%` }}></div>
                                                            </div>
                                                            <span className="text-xs text-gray-600 font-mono whitespace-nowrap">{used}/{total}</span>
                                                        </div>
                                                    ) : <span className="text-xs text-gray-400">—</span>}
                                                </td>
                                                <td className="hidden md:table-cell text-sm text-gray-600">
                                                    <i className="fas fa-building text-gray-400 mr-1.5 text-xs"></i>{sw.branch ?? '-'}
                                                </td>
                                                <td className="text-xs">
                                                    <span className={exp.cls}>
                                                        <i className={`fas ${exp.icon} mr-1`}></i>{exp.text}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition">
                                                        <Link href={`/software/${sw.sw_id}`} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition" title="View">
                                                            <i className="fas fa-eye text-xs"></i>
                                                        </Link>
                                                        {isAdmin && (
                                                            <>
                                                                <Link href={`/software/${sw.sw_id}/edit`} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Edit">
                                                                    <i className="fas fa-pen text-xs"></i>
                                                                </Link>
                                                                <button onClick={() => handleDelete(sw.sw_id, sw.name)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
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
                            Showing <span className="font-semibold text-gray-900">{software.length}</span> of{' '}
                            <span className="font-semibold text-gray-900">{stats.total}</span> records
                        </span>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
