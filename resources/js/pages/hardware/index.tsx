import AppLayout from '@/components/AppLayout';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HardwareItem {
    id: number;
    tag: string;
    name: string;
    type: string;
    serial: string;
    manufacturer: string;
    model: string;
    status: string;
    branch: string;
    building: string | null;
    room: string | null;
    ip_address: string | null;
    assigned_user: string | null;
    warranty_expiry: string | null;
    created_at: string;
}

interface Stats {
    total: number;
    active: number;
    maint: number;
    deco: number;
    warranty_expiring: number;
}

interface Filters {
    search?: string;
    type?: string;
    status?: string;
    branch?: string;
}

interface Props {
    hardware: HardwareItem[];
    stats: Stats;
    branches: string[];
    typeCounts: Record<string, number>;
    activeByType: Record<string, number>;
    filters: Filters;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { icon: string; color: string }> = {
    Desktop:    { icon: 'fa-desktop',        color: 'blue' },
    Laptop:     { icon: 'fa-laptop',          color: 'indigo' },
    Server:     { icon: 'fa-server',          color: 'purple' },
    NAS:        { icon: 'fa-hdd',             color: 'violet' },
    Firewall:   { icon: 'fa-shield-halved',   color: 'red' },
    Switch:     { icon: 'fa-network-wired',   color: 'cyan' },
    Router:     { icon: 'fa-wifi',            color: 'teal' },
    Printer:    { icon: 'fa-print',           color: 'orange' },
    CCTV:       { icon: 'fa-video',           color: 'amber' },
    Biometrics: { icon: 'fa-fingerprint',     color: 'lime' },
    'WiFi AP':  { icon: 'fa-tower-broadcast', color: 'sky' },
    UPS:        { icon: 'fa-battery-full',    color: 'green' },
};

const TYPE_ORDER = ['Desktop','Laptop','Server','NAS','Firewall','Switch','Router','Printer','CCTV','Biometrics','WiFi AP','UPS'];

const STATUS_BADGE: Record<string, string> = {
    'Active':              'bg-green-50 text-green-700 border border-green-200',
    'In Maintenance':      'bg-amber-50 text-amber-700 border border-amber-200',
    'Decommissioned':      'bg-gray-100 text-gray-700 border border-gray-200',
    'Lost/Stolen':         'bg-red-50 text-red-700 border border-red-200',
    'Pending Deployment':  'bg-blue-50 text-blue-700 border border-blue-200',
};

const STATUSES = ['Active','In Maintenance','Decommissioned','Lost/Stolen','Pending Deployment'];

function warrantyInfo(dateStr: string | null): { date: string; label: string; cls: string } {
    if (!dateStr) return { date: '-', label: 'N/A', cls: 'text-gray-400' };
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.floor(diff / 86_400_000);
    const fmt  = new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (days < 0)   return { date: fmt, label: 'Expired',          cls: 'text-red-500' };
    if (days < 90)  return { date: fmt, label: `${days}d left`,    cls: 'text-amber-500' };
    const yr = Math.floor(days / 365);
    const mo = Math.floor((days % 365) / 30);
    return { date: fmt, label: `${yr ? yr + 'yr ' : ''}${mo}mo left`, cls: 'text-green-600' };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HardwareIndex({ hardware, stats, branches, typeCounts, activeByType, filters }: Props) {
    const [form, setForm] = useState<Filters>({
        search: filters.search ?? '',
        type:   filters.type   ?? '',
        status: filters.status ?? '',
        branch: filters.branch ?? '',
    });

    const filterCount = Object.values(filters).filter((v) => v && v !== '').length;

    function applyFilters(e: React.FormEvent) {
        e.preventDefault();
        router.get('/hardware', form as Record<string, string>, { preserveState: true });
    }

    function clearFilters() { router.get('/hardware'); }

    function handleDelete(tag: string, name: string) {
        if (!confirm(`Permanently delete hardware asset ${tag} — ${name}? This cannot be undone.`)) return;
        router.delete(`/hardware/${tag}`);
    }

    function handleDeleteAll() {
        if (!confirm(`Are you sure you want to delete ALL ${stats.total} hardware assets? This will permanently remove all hardware records.`)) return;
        router.delete('/hardware/delete-all');
    }

    return (
        <AppLayout title="Hardware Inventory" subtitle="Manage all hardware assets across branches">
            <div className="space-y-6">

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                        { label: 'Total Hardware',     value: stats.total,             icon: 'fa-microchip',           bg: 'bg-blue-50',   color: 'text-blue-500' },
                        { label: 'Active',             value: stats.active,            icon: 'fa-circle-check',        bg: 'bg-green-50',  color: 'text-green-500' },
                        { label: 'In Maintenance',     value: stats.maint,             icon: 'fa-screwdriver-wrench',  bg: 'bg-amber-50',  color: 'text-amber-500' },
                        { label: 'Decommissioned',     value: stats.deco,              icon: 'fa-circle-xmark',        bg: 'bg-red-50',    color: 'text-red-500' },
                        { label: 'Warranty Expiring',  value: stats.warranty_expiring, icon: 'fa-triangle-exclamation',bg: 'bg-orange-50', color: 'text-orange-500' },
                    ].map((s) => (
                        <div key={s.label} className="card p-5 hover:shadow-md transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500">{s.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
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
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Hardware by Category</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Total: <span className="font-semibold">{stats.total}</span> devices across {TYPE_ORDER.length} categories
                            </p>
                        </div>
                        {filters.type && (
                            <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline">
                                <i className="fas fa-times mr-1"></i>Clear type filter
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-3">
                        {TYPE_ORDER.map((typeName) => {
                            const meta    = TYPE_META[typeName] ?? { icon: 'fa-microchip', color: 'gray' };
                            const cnt     = typeCounts[typeName] ?? 0;
                            const act     = activeByType[typeName] ?? 0;
                            const active  = filters.type === typeName;
                            return (
                                <button
                                    key={typeName}
                                    onClick={() => {
                                        const newType = active ? '' : typeName;
                                        setForm({ ...form, type: newType });
                                        router.get('/hardware', { ...form, type: newType } as Record<string, string>, { preserveState: true });
                                    }}
                                    className={`group border rounded-xl p-3 hover:shadow-md transition text-left ${
                                        active
                                            ? `border-${meta.color}-300 bg-${meta.color}-50/50`
                                            : 'border-gray-100 hover:border-gray-200'
                                    }`}
                                >
                                    <div className={`w-9 h-9 bg-${meta.color}-100 text-${meta.color}-600 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition`}>
                                        <i className={`fas ${meta.icon} text-sm`}></i>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-800 truncate">{typeName}</p>
                                    <p className="text-xl font-bold text-gray-900">{cnt}</p>
                                    <p className="text-[10px] text-green-600">{act} active</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Table card ── */}
                <div className="card p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Hardware Inventory</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                <span className="font-semibold">{stats.total}</span> total &bull; Showing{' '}
                                <span className="font-semibold">{hardware.length}</span>
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
                                    title="Delete all hardware assets"
                                >
                                    <i className="fas fa-trash-can mr-1.5"></i>Delete All
                                </button>
                            )}
                            <Link href="/hardware/create" className="btn btn-primary text-sm py-2">
                                <i className="fas fa-plus mr-1.5"></i>Add Hardware
                            </Link>
                        </div>
                    </div>

                    {/* ── Inline filter bar (always visible, no toggle) ── */}
                    <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-5 p-4 bg-gray-50 rounded-xl">
                        <div className="lg:col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Search</label>
                            <div className="relative">
                                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                                <input
                                    type="text"
                                    className="form-input pl-9 py-2 text-sm"
                                    placeholder="Tag, Serial, Name, IP, Model..."
                                    value={form.search}
                                    onChange={(e) => setForm({ ...form, search: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Type</label>
                            <select className="form-input py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                <option value="">All Types</option>
                                {TYPE_ORDER.map((t) => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                            <select className="form-input py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                <option value="">All Statuses</option>
                                {STATUSES.map((s) => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Branch</label>
                            <select className="form-input py-2 text-sm" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                                <option value="">All Branches</option>
                                {branches.map((b) => <option key={b}>{b}</option>)}
                            </select>
                        </div>
                        <div className="flex items-end gap-2 lg:col-span-5 lg:justify-end">
                            <button type="submit" className="btn btn-primary py-2 text-sm px-5">
                                <i className="fas fa-search mr-1.5"></i>Apply
                            </button>
                            <button type="button" onClick={clearFilters} className="btn btn-secondary py-2 text-sm" title="Reset">
                                <i className="fas fa-redo"></i>
                            </button>
                        </div>
                    </form>

                    {/* ── Table ── */}
                    <div className="overflow-hidden rounded-xl border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="w-full data-table">
                                <thead>
                                    <tr>
                                        <th>Asset</th>
                                        <th className="hidden md:table-cell">Type</th>
                                        <th className="hidden lg:table-cell">Location</th>
                                        <th>Status</th>
                                        <th className="hidden md:table-cell">Assigned To</th>
                                        <th className="hidden xl:table-cell">Warranty</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {hardware.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                                                <i className="fas fa-microchip text-3xl mb-3 block"></i>
                                                {filterCount > 0
                                                    ? 'No hardware matches your filters.'
                                                    : <span>No hardware records yet. <Link href="/hardware/create" className="text-blue-600 hover:underline font-semibold">Add hardware</Link>.</span>
                                                }
                                            </td>
                                        </tr>
                                    ) : hardware.map((h) => {
                                        const meta      = TYPE_META[h.type] ?? { icon: 'fa-microchip', color: 'gray' };
                                        const statusCls = STATUS_BADGE[h.status] ?? 'bg-gray-100 text-gray-700';
                                        const warranty  = warrantyInfo(h.warranty_expiry);
                                        return (
                                            <tr key={h.id} className="group hover:bg-gray-50/50 transition">
                                                <td>
                                                    <Link href={`/hardware/${h.tag}`} className="flex items-center space-x-3 min-w-0">
                                                        <div className={`w-9 h-9 bg-${meta.color}-100 text-${meta.color}-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
                                                            <i className={`fas ${meta.icon} text-xs`}></i>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 truncate max-w-xs group-hover:text-blue-600 transition">{h.name}</p>
                                                            <p className="text-xs text-gray-500 font-mono">
                                                                {h.tag}{h.ip_address ? ` · ${h.ip_address}` : ''}
                                                            </p>
                                                        </div>
                                                    </Link>
                                                </td>
                                                <td className="hidden md:table-cell">
                                                    <span className={`inline-flex items-center text-xs font-semibold text-gray-700 bg-${meta.color}-50 px-2 py-1 rounded-md`}>
                                                        {h.type}
                                                    </span>
                                                </td>
                                                <td className="hidden lg:table-cell text-sm">
                                                    <p className="text-gray-700 font-medium truncate max-w-[160px]">
                                                        <i className="fas fa-building text-amber-400 mr-1.5 text-[10px]"></i>{h.branch ?? '-'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate max-w-[160px]">{h.building ?? '-'} · {h.room ?? '-'}</p>
                                                </td>
                                                <td>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${statusCls}`}>
                                                        {h.status}
                                                    </span>
                                                </td>
                                                <td className="hidden md:table-cell text-sm text-gray-700 font-medium">{h.assigned_user ?? '-'}</td>
                                                <td className="hidden xl:table-cell text-xs">
                                                    <div className="font-mono text-gray-600 font-medium">{warranty.date}</div>
                                                    <div className={`${warranty.cls} font-semibold`}>{warranty.label}</div>
                                                </td>
                                                <td className="text-right">
                                                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition">
                                                        <Link href={`/hardware/${h.tag}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View">
                                                            <i className="fas fa-eye text-xs"></i>
                                                        </Link>
                                                        <Link href={`/hardware/${h.tag}/edit`} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Edit">
                                                            <i className="fas fa-pen text-xs"></i>
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(h.tag, h.name)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                            title="Delete"
                                                        >
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
                    </div>

                    <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                        <span>
                            Showing <span className="font-semibold text-gray-900">{hardware.length}</span> of{' '}
                            <span className="font-semibold text-gray-900">{stats.total}</span> records
                        </span>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
