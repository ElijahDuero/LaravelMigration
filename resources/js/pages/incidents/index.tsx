import AppLayout from '@/components/AppLayout';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Incident {
    id: number;
    incident_number: string;
    workflow_status: string;
    severity: string;
    category: string;
    branch: string;
    description: string;
    reporter_name: string;
    users_affected: number;
    reported_at: string | null;
    created_at: string;
}

interface Stats {
    total: number;
    reported: number;
    in_progress: number;
    critical: number;
    closed: number;
}

interface Filters {
    search?: string;
    severity?: string;
    status?: string;
    branch?: string;
    category?: string;
    datefrom?: string;
    dateto?: string;
}

interface Props {
    incidents: Incident[];
    stats: Stats;
    branches: string[];
    filters: Filters;
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

const severityBadge: Record<string, { bg: string; icon: string }> = {
    Critical: { bg: 'border border-red-200 bg-red-50 text-red-700',      icon: 'fa-skull-crossbones' },
    High:     { bg: 'border border-orange-200 bg-orange-50 text-orange-700', icon: 'fa-arrow-up' },
    Medium:   { bg: 'border border-yellow-200 bg-yellow-50 text-yellow-700', icon: 'fa-minus' },
    Low:      { bg: 'border border-green-200 bg-green-50 text-green-700',  icon: 'fa-arrow-down' },
};

const statusBadge: Record<string, string> = {
    draft:         'bg-gray-100 text-gray-700',
    reported:      'bg-purple-100 text-purple-700',
    assigned:      'bg-blue-100 text-blue-700',
    investigation: 'bg-indigo-100 text-indigo-700',
    containment:   'bg-amber-100 text-amber-700',
    eradication:   'bg-orange-100 text-orange-700',
    recovery:      'bg-cyan-100 text-cyan-700',
    lessons:       'bg-yellow-100 text-yellow-700',
    closed:        'bg-green-100 text-green-700',
};

const statusLabels: Record<string, string> = {
    draft: 'Draft', reported: 'Reported', assigned: 'Assigned',
    investigation: 'Investigating', containment: 'Containment',
    eradication: 'Eradication', recovery: 'Recovery',
    lessons: 'Lessons Learned', closed: 'Closed',
};

function SeverityBadge({ severity }: { severity: string }) {
    const s = severityBadge[severity] ?? { bg: 'bg-gray-100 text-gray-700', icon: 'fa-circle' };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${s.bg}`}>
            <i className={`fas ${s.icon} mr-1 text-[10px]`}></i>
            {severity}
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    const cls = statusBadge[status] ?? 'bg-gray-100 text-gray-700';
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
            {statusLabels[status] ?? status}
        </span>
    );
}

function formatDate(dateStr: string | null) {
    if (!dateStr) return { date: '-', time: '' };
    const d = new Date(dateStr);
    return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function IncidentsIndex({ incidents, stats, branches, filters }: Props) {
    const [showFilter, setShowFilter] = useState(
        Object.values(filters).some((v) => v && v !== '')
    );

    const [form, setForm] = useState<Filters>({
        search:   filters.search   ?? '',
        severity: filters.severity ?? '',
        status:   filters.status   ?? '',
        branch:   filters.branch   ?? '',
        category: filters.category ?? '',
        datefrom: filters.datefrom ?? '',
        dateto:   filters.dateto   ?? '',
    });

    const filterCount = Object.values(filters).filter((v) => v && v !== '').length;

    function applyFilters(e: React.FormEvent) {
        e.preventDefault();
        router.get('/incidents', form as Record<string, string>, { preserveState: true });
    }

    function clearFilters() {
        router.get('/incidents');
    }

    function handleDelete(incNum: string) {
        if (!confirm(`Permanently delete ${incNum}? This cannot be undone.`)) return;
        router.delete(`/incidents/${incNum}`);
    }

    function handleDeleteAll() {
        if (!confirm(`Are you sure you want to delete ALL ${stats.total} incidents? This will permanently remove all incident datasets.`)) return;
        router.delete('/incidents/delete-all');
    }

    const categories = [
        { group: 'Malware',               items: ['Malware Infection', 'Ransomware', 'Virus'] },
        { group: 'Social Engineering',    items: ['Phishing', 'Business Email Compromise', 'Social Engineering'] },
        { group: 'Unauthorized Activity', items: ['Unauthorized Access', 'Insider Threat', 'Website Defacement'] },
        { group: 'Asset Loss',            items: ['Lost Laptop', 'Lost Mobile Device'] },
        { group: 'Data & Network',        items: ['Data Leak', 'Network Outage', 'Denial of Service'] },
        { group: 'Other',                 items: ['Physical Security Incident', 'Policy Violation', 'Others'] },
    ];

    return (
        <AppLayout title="Incident Reporting" subtitle="All Security Incidents">
            <div className="space-y-6">

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                        { label: 'All Incidents', value: stats.total,       icon: 'fa-list',          bg: 'bg-gray-50',   color: 'text-gray-500' },
                        { label: 'Reported',      value: stats.reported,    icon: 'fa-plus-circle',   bg: 'bg-purple-50', color: 'text-purple-500' },
                        { label: 'In Progress',   value: stats.in_progress, icon: 'fa-spinner',       bg: 'bg-blue-50',   color: 'text-blue-500' },
                        { label: 'Critical',      value: stats.critical,    icon: 'fa-skull',         bg: 'bg-red-50',    color: 'text-red-500' },
                        { label: 'Closed',        value: stats.closed,      icon: 'fa-check-circle',  bg: 'bg-green-50',  color: 'text-green-500' },
                    ].map((stat) => (
                        <div key={stat.label} className="card p-5 hover:shadow-md transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500">{stat.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                </div>
                                <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                                    <i className={`fas ${stat.icon} ${stat.color}`}></i>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Table card ── */}
                <div className="card p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Incident List</h3>
                            <p className="text-sm text-gray-500 mt-1">View and manage all reported security incidents</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setShowFilter(!showFilter)}
                                className="btn btn-secondary"
                            >
                                <i className="fas fa-filter mr-2"></i>Filter
                                {filterCount > 0 && (
                                    <span className="ml-1.5 px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                                        {filterCount}
                                    </span>
                                )}
                            </button>
                            {stats.total > 0 && (
                                <button
                                    onClick={handleDeleteAll}
                                    className="btn border border-red-200 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white"
                                    title="Delete all incidents"
                                >
                                    <i className="fas fa-trash-can mr-2"></i>Delete All
                                </button>
                            )}
                            <Link href="/incidents/create" className="btn btn-primary">
                                <i className="fas fa-plus mr-2"></i>New Incident
                            </Link>
                        </div>
                    </div>

                    {/* ── Filter panel ── */}
                    {showFilter && (
                        <form onSubmit={applyFilters} className="mb-6 p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Search</label>
                                    <div className="relative">
                                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                                        <input
                                            type="text"
                                            className="form-input pl-9"
                                            placeholder="Incident #, description, reporter..."
                                            value={form.search}
                                            onChange={(e) => setForm({ ...form, search: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Severity</label>
                                    <select
                                        className="form-input"
                                        value={form.severity}
                                        onChange={(e) => setForm({ ...form, severity: e.target.value })}
                                    >
                                        <option value="">All Severities</option>
                                        {['Critical', 'High', 'Medium', 'Low'].map((s) => (
                                            <option key={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Status</label>
                                    <select
                                        className="form-input"
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="open">Open / In Progress</option>
                                        {['reported', 'assigned', 'investigation', 'containment', 'eradication', 'recovery', 'lessons', 'closed'].map((s) => (
                                            <option key={s} value={s}>{statusLabels[s]}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Branch</label>
                                    <select
                                        className="form-input"
                                        value={form.branch}
                                        onChange={(e) => setForm({ ...form, branch: e.target.value })}
                                    >
                                        <option value="">All Branches</option>
                                        {branches.map((b) => <option key={b}>{b}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Category</label>
                                    <select
                                        className="form-input"
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map(({ group, items }) => (
                                            <optgroup key={group} label={group}>
                                                {items.map((c) => <option key={c}>{c}</option>)}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Date From</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={form.datefrom}
                                        onChange={(e) => setForm({ ...form, datefrom: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Date To</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={form.dateto}
                                        onChange={(e) => setForm({ ...form, dateto: e.target.value })}
                                    />
                                </div>

                                <div className="flex items-end space-x-2">
                                    <button type="submit" className="btn btn-primary flex-1">
                                        <i className="fas fa-search mr-2"></i>Apply
                                    </button>
                                    <button type="button" onClick={clearFilters} className="btn btn-secondary" title="Reset filters">
                                        <i className="fas fa-redo"></i>
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* ── Table ── */}
                    <div className="overflow-hidden rounded-xl border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="w-full data-table">
                                <thead>
                                    <tr>
                                        <th>Incident</th>
                                        <th>Category</th>
                                        <th className="hidden md:table-cell">Branch</th>
                                        <th>Severity</th>
                                        <th>Status</th>
                                        <th className="hidden lg:table-cell">Reporter</th>
                                        <th className="hidden md:table-cell">Reported</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {incidents.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                                                <i className="fas fa-inbox text-3xl mb-3 block"></i>
                                                {filterCount > 0
                                                    ? 'No incidents match your filters.'
                                                    : <span>No incidents yet. <Link href="/incidents/create" className="text-blue-600 hover:underline font-semibold">Report the first one</Link>.</span>
                                                }
                                            </td>
                                        </tr>
                                    ) : incidents.map((inc) => {
                                        const dt   = formatDate(inc.reported_at ?? inc.created_at);
                                        const desc = inc.description?.length > 80
                                            ? inc.description.slice(0, 79) + '…'
                                            : inc.description;

                                        return (
                                            <tr key={inc.id} className="group hover:bg-gray-50/50 transition">
                                                <td>
                                                    <Link href={`/incidents/${inc.incident_number}`} className="block min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate max-w-xs group-hover:text-blue-600 transition">{desc}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5 font-mono text-blue-600">
                                                            {inc.incident_number}
                                                            {inc.users_affected > 0 && ` · ${inc.users_affected} users`}
                                                        </p>
                                                    </Link>
                                                </td>
                                                <td className="text-sm text-gray-600">{inc.category ?? '-'}</td>
                                                <td className="hidden md:table-cell text-sm text-gray-600">
                                                    <span className="inline-flex items-center">
                                                        <i className="fas fa-building mr-1.5 text-gray-400 text-xs"></i>
                                                        {inc.branch ?? '-'}
                                                    </span>
                                                </td>
                                                <td><SeverityBadge severity={inc.severity} /></td>
                                                <td><StatusBadge status={inc.workflow_status} /></td>
                                                <td className="hidden lg:table-cell text-sm text-gray-700">{inc.reporter_name ?? '-'}</td>
                                                <td className="hidden md:table-cell text-xs text-gray-500">
                                                    <div>{dt.date}</div>
                                                    <div className="text-gray-400">{dt.time}</div>
                                                </td>
                                                <td className="text-right">
                                                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition">
                                                        <Link
                                                            href={`/incidents/${inc.incident_number}`}
                                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                            title="View"
                                                        >
                                                            <i className="fas fa-eye text-xs"></i>
                                                        </Link>
                                                        <Link
                                                            href={`/incidents/${inc.incident_number}/edit`}
                                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                            title="Edit"
                                                        >
                                                            <i className="fas fa-pen text-xs"></i>
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(inc.incident_number)}
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

                    {/* ── Footer ── */}
                    <div className="mt-5 pt-5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <p className="text-sm text-gray-500">
                            Showing{' '}
                            <span className="font-semibold text-gray-900">{incidents.length > 0 ? 1 : 0}</span>
                            {' '}–{' '}
                            <span className="font-semibold text-gray-900">{incidents.length}</span>
                            {' '}of{' '}
                            <span className="font-semibold text-gray-900">{stats.total}</span> incidents
                            {filterCount > 0 && (
                                <button onClick={clearFilters} className="ml-2 text-xs text-blue-600 hover:underline">
                                    Clear filters
                                </button>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
