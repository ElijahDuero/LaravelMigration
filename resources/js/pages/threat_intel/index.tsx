import AppLayout from '@/components/AppLayout';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface Indicator {
    id: number;
    ioc_id: string;
    type: string;
    value: string;
    severity: string;
    status: string;
    confidence: string | null;
    source: string | null;
    tags: string | null;
    last_seen: string | null;
    created_at: string;
}

interface Stats { total: number; active: number; critical: number; high: number; }
interface Filters { search?: string; type?: string; severity?: string; status?: string; }

interface Props {
    indicators: Indicator[];
    stats: Stats;
    typeCounts: Record<string, number>;
    filters: Filters;
}

const TYPE_META: Record<string, { icon: string; color: string }> = {
    'Phishing Domain': { icon: 'fa-fish-fins',     color: 'purple' },
    'Malicious IP':    { icon: 'fa-network-wired', color: 'red' },
    'Blocked IP':      { icon: 'fa-ban',           color: 'orange' },
    'IOC':             { icon: 'fa-crosshairs',    color: 'rose' },
    'Malware Hash':    { icon: 'fa-bug',           color: 'amber' },
    'Suspicious URL':  { icon: 'fa-link-slash',    color: 'yellow' },
};
const TYPE_ORDER = Object.keys(TYPE_META);

const SEV_BADGE: Record<string, string> = {
    Critical: 'bg-red-100 text-red-700 border border-red-200',
    High:     'bg-orange-100 text-orange-700 border border-orange-200',
    Medium:   'bg-amber-100 text-amber-700 border border-amber-200',
    Low:      'bg-green-100 text-green-700 border border-green-200',
};
const STATUS_BADGE: Record<string, string> = {
    Active:      'bg-red-100 text-red-700 border border-red-200',
    Inactive:    'bg-gray-100 text-gray-500 border border-gray-200',
    Whitelisted: 'bg-green-100 text-green-700 border border-green-200',
};
const CONF_BADGE: Record<string, string> = {
    High:   'bg-blue-100 text-blue-700 border border-blue-200',
    Medium: 'bg-sky-100 text-sky-700 border border-sky-200',
    Low:    'bg-gray-100 text-gray-500 border border-gray-200',
};

const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES   = ['Active', 'Inactive', 'Whitelisted'];

function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ThreatIntelIndex({ indicators, stats, typeCounts, filters }: Props) {
    const { auth } = usePage<any>().props;
    const isAdmin  = ['super_admin', 'admin', 'cyber_security'].includes(auth.user?.role ?? '');

    const [form, setForm] = useState({
        search:   filters.search   ?? '',
        type:     filters.type     ?? '',
        severity: filters.severity ?? '',
        status:   filters.status   ?? '',
    });

    const filterCount = Object.values(filters).filter(Boolean).length;

    function applyFilters(e: React.FormEvent) {
        e.preventDefault();
        const q: Record<string, string> = {};
        if (form.search)   q.search   = form.search;
        if (form.type)     q.type     = form.type;
        if (form.severity) q.severity = form.severity;
        if (form.status)   q.status   = form.status;
        router.get('/threat-intel', q, { preserveState: true });
    }

    function clearFilters() { router.get('/threat-intel'); }

    function handleDelete(id: number, iocId: string, value: string) {
        if (!confirm(`Permanently delete ${iocId} — "${value}"?\nThis cannot be undone.`)) return;
        router.delete(`/threat-intel/${id}`);
    }

    function handleDeleteAll() {
        if (!confirm(`Are you sure you want to delete ALL ${stats.total} threat indicators? This will permanently remove all IOC records.`)) return;
        router.delete('/threat-intel/delete-all');
    }

    return (
        <AppLayout title="Threat Intelligence" subtitle="Known threats, IOCs, and malicious indicators">
            <div className="space-y-6">

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Indicators', value: stats.total,    icon: 'fa-crosshairs',       bg: 'bg-blue-50',   color: 'text-blue-500' },
                        { label: 'Active Threats',   value: stats.active,   icon: 'fa-triangle-exclamation', bg: 'bg-red-50', color: 'text-red-500' },
                        { label: 'Critical',         value: stats.critical, icon: 'fa-skull-crossbones', bg: 'bg-red-100',   color: 'text-red-600' },
                        { label: 'High Severity',    value: stats.high,     icon: 'fa-fire',             bg: 'bg-orange-50', color: 'text-orange-500' },
                    ].map((s) => (
                        <div key={s.label} className="card p-5 hover:shadow-md transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
                                </div>
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.bg} ${s.color}`}>
                                    <i className={`fas ${s.icon}`}></i>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Type category cards */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <i className="fas fa-shield-virus mr-2 text-red-500"></i>Indicator Categories
                        </h3>
                        <span className="text-sm text-gray-500">{TYPE_ORDER.length} types</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {TYPE_ORDER.map((typeName) => {
                            const meta   = TYPE_META[typeName];
                            const cnt    = typeCounts[typeName] ?? 0;
                            const active = filters.type === typeName;
                            return (
                                <button
                                    key={typeName}
                                    onClick={() => {
                                        const newType = active ? '' : typeName;
                                        setForm({ ...form, type: newType });
                                        router.get('/threat-intel', { ...form, type: newType }, { preserveState: true });
                                    }}
                                    className={`group border rounded-xl p-4 hover:shadow-md transition text-left ${
                                        active ? `border-${meta.color}-300 bg-${meta.color}-50/60` : `border-gray-100 bg-white hover:border-${meta.color}-200`
                                    }`}
                                >
                                    <div className={`w-10 h-10 bg-${meta.color}-100 text-${meta.color}-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition`}>
                                        <i className={`fas ${meta.icon} text-sm`}></i>
                                    </div>
                                    <p className="text-xs font-bold text-gray-800 truncate leading-tight">{typeName}</p>
                                    <p className={`text-xl font-bold text-${meta.color}-700 mt-1`}>{cnt}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Table */}
                <div className="card p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                <i className="fas fa-list-check mr-2 text-red-500"></i>Threat Indicators
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                <span className="font-semibold">{stats.total}</span> total &bull; Showing{' '}
                                <span className="font-semibold">{indicators.length}</span>
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
                                    title="Delete all threat indicators"
                                >
                                    <i className="fas fa-trash-can mr-1.5"></i>Delete All
                                </button>
                            )}
                            {isAdmin && (
                                <Link href="/threat-intel/create" className="btn btn-primary text-sm py-2">
                                    <i className="fas fa-plus mr-1.5"></i>Add Indicator
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Filters */}
                    <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mb-5 p-4 bg-red-50/40 rounded-xl border border-red-100">
                        <div className="lg:col-span-2">
                            <label className="block text-[10px] font-bold text-red-800 uppercase tracking-wide mb-1.5">Search</label>
                            <div className="relative">
                                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                                <input type="text" className="form-input pl-9 py-2 text-sm bg-white"
                                    placeholder="IP, domain, hash, URL..."
                                    value={form.search} onChange={(e) => setForm({ ...form, search: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-red-800 uppercase tracking-wide mb-1.5">Type</label>
                            <select className="form-input py-2 text-sm bg-white" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                <option value="">All Types</option>
                                {TYPE_ORDER.map((t) => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-red-800 uppercase tracking-wide mb-1.5">Severity</label>
                            <select className="form-input py-2 text-sm bg-white" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                                <option value="">Any</option>
                                {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-red-800 uppercase tracking-wide mb-1.5">Status</label>
                            <select className="form-input py-2 text-sm bg-white" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                <option value="">All</option>
                                {STATUSES.map((s) => <option key={s}>{s}</option>)}
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

                    <div className="overflow-hidden rounded-xl border border-red-100">
                        <div className="overflow-x-auto">
                            <table className="w-full data-table">
                                <thead>
                                    <tr className="bg-red-50/50">
                                        <th>Indicator</th>
                                        <th className="hidden md:table-cell">Type</th>
                                        <th>Severity</th>
                                        <th className="hidden lg:table-cell">Confidence</th>
                                        <th className="hidden md:table-cell">Source</th>
                                        <th className="hidden lg:table-cell">Last Seen</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {indicators.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                                                <i className="fas fa-shield-virus text-3xl mb-3 block"></i>
                                                {filterCount > 0 ? 'No indicators match your filters.' : (
                                                    <span>No threat indicators recorded. {isAdmin && <Link href="/threat-intel/create" className="text-blue-600 hover:underline font-semibold">Add the first indicator</Link>}.</span>
                                                )}
                                            </td>
                                        </tr>
                                    ) : indicators.map((ioc) => {
                                        const meta      = TYPE_META[ioc.type] ?? { icon: 'fa-shield-halved', color: 'gray' };
                                        const sevCls    = SEV_BADGE[ioc.severity]  ?? 'bg-gray-100 text-gray-600';
                                        const stsCls    = STATUS_BADGE[ioc.status] ?? 'bg-gray-100 text-gray-600';
                                        const confCls   = CONF_BADGE[ioc.confidence ?? 'Medium'] ?? 'bg-gray-100 text-gray-600';
                                        return (
                                            <tr key={ioc.id} className="group hover:bg-gray-50/50 transition">
                                                <td>
                                                    <Link href={`/threat-intel/${ioc.id}`} className="flex items-center space-x-3 min-w-0">
                                                        <div className={`w-9 h-9 bg-${meta.color}-100 text-${meta.color}-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
                                                            <i className={`fas ${meta.icon} text-xs`}></i>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-mono font-semibold text-gray-900 truncate max-w-[200px] group-hover:text-red-600 transition">{ioc.value}</p>
                                                            <p className="text-xs text-gray-500">{ioc.ioc_id}</p>
                                                        </div>
                                                    </Link>
                                                </td>
                                                <td className="hidden md:table-cell text-sm">
                                                    <span className={`inline-flex items-center gap-1.5 text-${meta.color}-700 font-medium`}>
                                                        <i className={`fas ${meta.icon} text-xs`}></i>{ioc.type}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${sevCls}`}>
                                                        {ioc.severity}
                                                    </span>
                                                </td>
                                                <td className="hidden lg:table-cell">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${confCls}`}>
                                                        {ioc.confidence ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="hidden md:table-cell text-sm text-gray-600">{ioc.source ?? '—'}</td>
                                                <td className="hidden lg:table-cell text-sm text-gray-500">{fmtDate(ioc.last_seen)}</td>
                                                <td>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${stsCls}`}>
                                                        {ioc.status}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition">
                                                        <Link href={`/threat-intel/${ioc.id}`} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="View">
                                                            <i className="fas fa-eye text-xs"></i>
                                                        </Link>
                                                        {isAdmin && (
                                                            <>
                                                                <Link href={`/threat-intel/${ioc.id}/edit`} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Edit">
                                                                    <i className="fas fa-pen text-xs"></i>
                                                                </Link>
                                                                <button onClick={() => handleDelete(ioc.id, ioc.ioc_id, ioc.value)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
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
                        <span>Showing <span className="font-semibold text-gray-900">{indicators.length}</span> of <span className="font-semibold text-gray-900">{stats.total}</span> indicators</span>
                    </div>
                </div>

                {/* Feed integrations placeholder */}
                <div className="card p-6 border border-dashed border-gray-200">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-plug-circle-bolt"></i>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-1">External Feed Integrations</h4>
                            <p className="text-sm text-gray-500 mb-3">Connect external sources to automatically enrich indicators.</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: 'MISP', icon: 'fa-link' },
                                    { label: 'VirusTotal', icon: 'fa-virus-slash' },
                                    { label: 'AbuseIPDB', icon: 'fa-shield-halved' },
                                ].map((f) => (
                                    <span key={f.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-500 border border-dashed border-gray-300">
                                        <i className={`fas ${f.icon} text-[10px]`}></i>{f.label} — Pending
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
