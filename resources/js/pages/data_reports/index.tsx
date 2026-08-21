import AppLayout from '@/components/AppLayout';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Filters { from: string; to: string; branch: string; section: string }
interface Summary { incidents: number; inc_open: number; threats: number; hardware: number; software: number; bs_total: number }

interface IncRow { incident_number: string; incident_at: string|null; created_at: string; severity: string; category: string|null; branch: string|null; workflow_status: string; reporter_name: string|null; description: string|null }
interface TiRow  { ioc_id: string; type: string; value: string; severity: string; status: string; confidence: string; first_seen: string|null }
interface HwRow  { tag: string; name: string; type: string; branch: string|null; assigned_user: string|null; status: string; warranty_expiry: string|null }
interface SwRow  { sw_id: string; name: string; vendor: string|null; branch: string|null; category: string; used_licenses: number; total_licenses: number; expiry_date: string|null }
interface BsRow  { branch: string; score: number; antivirus: number; firewall: number; disk_encryption: number; mfa: number; backup_status: number; computers_total: number; computers_patched: number; updated_at: string|null }
interface SysRow { sys_id: string; name: string; category: string; criticality: string; status: string; owner: string|null; hosting: string|null }

interface Section<T> { rows: T[]; total: number; page: number; total_pages: number }
interface IncSection extends Section<IncRow> { open: number; critical: number; closed: number; by_severity: Record<string,number> }
interface TiSection  extends Section<TiRow>  { active: number; critical: number; high: number }
interface HwSection  extends Section<HwRow>  { active: number }
interface SwSection  extends Section<SwRow>  { expired: number }
interface BsSection  extends Section<BsRow>  { avg: number }
interface SysSection extends Section<SysRow> { critical: number }

interface Props {
    filters: Filters;
    branches: string[];
    summary: Summary;
    inc: IncSection;
    ti: TiSection;
    hw: HwSection;
    sw: SwSection;
    bs: BsSection;
    sys: SysSection;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(d: string|null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function today(): string { return new Date().toISOString().slice(0,10); }

const SEV_BADGE: Record<string,string> = {
    Critical: 'bg-red-100 text-red-700 border border-red-200',
    High:     'bg-orange-100 text-orange-700 border border-orange-200',
    Medium:   'bg-yellow-100 text-yellow-700 border border-yellow-200',
    Low:      'bg-green-100 text-green-700 border border-green-200',
};
const STATUS_BADGE: Record<string,string> = {
    draft:         'bg-gray-100 text-gray-600',
    reported:      'bg-purple-100 text-purple-700',
    assigned:      'bg-blue-100 text-blue-700',
    investigation: 'bg-indigo-100 text-indigo-700',
    containment:   'bg-amber-100 text-amber-700',
    eradication:   'bg-orange-100 text-orange-700',
    recovery:      'bg-cyan-100 text-cyan-700',
    lessons:       'bg-yellow-100 text-yellow-700',
    closed:        'bg-green-100 text-green-700',
    Active:        'bg-green-100 text-green-700',
    Inactive:      'bg-gray-100 text-gray-500',
    Whitelisted:   'bg-blue-100 text-blue-700',
};
const STATUS_LABEL: Record<string,string> = {
    draft:'Draft', reported:'Reported', assigned:'Assigned',
    investigation:'Investigating', containment:'Containment',
    eradication:'Eradication', recovery:'Recovery',
    lessons:'Lessons Learned', closed:'Closed',
};
function scoreColor(s: number) {
    if (s >= 75) return 'text-green-600';
    if (s >= 50) return 'text-amber-600';
    return 'text-red-600';
}
function scoreBg(s: number) {
    if (s >= 75) return 'bg-green-500';
    if (s >= 50) return 'bg-amber-500';
    return 'bg-red-500';
}
function ctrlBadge(v: number) {
    if (v === 3) return <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">Yes</span>;
    if (v === 2) return <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Partial</span>;
    if (v === 1) return <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">No</span>;
    return <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">—</span>;
}

// ── Pagination component ───────────────────────────────────────────────────────
function Pagination({ page, totalPages, anchor, paramKey, query }: {
    page: number; totalPages: number; anchor: string; paramKey: string; query: Record<string,string>;
}) {
    if (totalPages <= 1) return null;
    function pageHref(p: number) {
        const q = new URLSearchParams({ ...query, [paramKey]: String(p) });
        return `/data-reports?${q.toString()}#${anchor}`;
    }
    const pages: (number|'...')[] = [];
    for (let p = 1; p <= totalPages; p++) {
        if (p === 1 || p === totalPages || Math.abs(p - page) <= 2) pages.push(p);
        else if (pages[pages.length - 1] !== '...') pages.push('...');
    }
    return (
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500">
                Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1 flex-wrap">
                {page > 1 && (
                    <a href={pageHref(page - 1)} className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition">
                        <i className="fas fa-chevron-left mr-1" />Prev
                    </a>
                )}
                {pages.map((p, i) =>
                    p === '...' ? (
                        <span key={`dots-${i}`} className="px-2 text-gray-400">...</span>
                    ) : p === page ? (
                        <span key={p} className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg">{p}</span>
                    ) : (
                        <a key={p} href={pageHref(p)} className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition">{p}</a>
                    )
                )}
                {page < totalPages && (
                    <a href={pageHref(page + 1)} className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition">
                        Next<i className="fas fa-chevron-right ml-1" />
                    </a>
                )}
            </div>
        </div>
    );
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ id, iconBg, iconColor, icon, title, meta, linkHref, linkLabel }: {
    id: string; iconBg: string; iconColor: string; icon: string;
    title: string; meta: string; linkHref: string; linkLabel: string;
}) {
    return (
        <div id={id} className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${iconBg} ${iconColor} rounded-xl flex items-center justify-center`}>
                    <i className={`fas ${icon}`} />
                </div>
                <div>
                    <h3 className="text-base font-bold text-gray-900">{title}</h3>
                    <p className="text-xs text-gray-500" dangerouslySetInnerHTML={{ __html: meta }} />
                </div>
            </div>
            <Link href={linkHref} className="text-xs font-semibold text-blue-600 hover:underline">
                {linkLabel} <i className="fas fa-arrow-right ml-1" />
            </Link>
        </div>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function DataReportsIndex({ filters, branches, summary, inc, ti, hw, sw, bs, sys }: Props) {
    const [from,   setFrom]   = useState(filters.from);
    const [to,     setTo]     = useState(filters.to);
    const [branch, setBranch] = useState(filters.branch);

    // Build current query string for pagination links
    const baseQuery: Record<string,string> = {};
    if (filters.from)   baseQuery.from   = filters.from;
    if (filters.to)     baseQuery.to     = filters.to;
    if (filters.branch) baseQuery.branch = filters.branch;

    function applyFilters(e: React.FormEvent) {
        e.preventDefault();
        const q: Record<string,string> = {};
        if (from)   q.from   = from;
        if (to)     q.to     = to;
        if (branch) q.branch = branch;
        router.get('/data-reports', q, { preserveState: false });
    }

    function clearFilters() {
        setFrom(''); setTo(''); setBranch('');
        router.get('/data-reports', {}, { preserveState: false });
    }

    const hasFilters = !!filters.from || !!filters.to || !!filters.branch;

    return (
        <AppLayout>
            <div className="space-y-6">

                {/* ── Page header + filters ─────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-black text-gray-900">Security Data Reports</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Live raw data from all modules — filterable and paginated.</p>
                        </div>
                        <form onSubmit={applyFilters} className="flex flex-wrap items-center gap-2">
                            <input type="date" value={from} onChange={e => setFrom(e.target.value)} max={today()}
                                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                title="From date" />
                            <input type="date" value={to} onChange={e => setTo(e.target.value)} max={today()}
                                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                title="To date" />
                            <select value={branch} onChange={e => setBranch(e.target.value)}
                                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                                <option value="">All Branches</option>
                                {branches.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                            <button type="submit"
                                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
                                <i className="fas fa-filter mr-1.5" />Apply
                            </button>
                            {hasFilters && (
                                <button type="button" onClick={clearFilters}
                                    className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition"
                                    title="Clear filters">
                                    <i className="fas fa-redo" />
                                </button>
                            )}
                            <button type="button" onClick={() => window.print()}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition">
                                <i className="fas fa-print mr-1.5" />Print
                            </button>
                        </form>
                    </div>
                </div>

                {/* ── Summary stat cards ─────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {([
                        { label: 'Incidents',    value: summary.incidents, icon: 'fa-triangle-exclamation', color: 'red' },
                        { label: 'Open',         value: summary.inc_open,  icon: 'fa-clock-rotate-left',    color: 'amber' },
                        { label: 'IOC / Threats',value: summary.threats,   icon: 'fa-bug',                  color: 'orange' },
                        { label: 'Hardware',     value: summary.hardware,  icon: 'fa-server',               color: 'cyan' },
                        { label: 'Software',     value: summary.software,  icon: 'fa-floppy-disk',          color: 'indigo' },
                        { label: 'Branches',     value: summary.bs_total,  icon: 'fa-building',             color: 'blue' },
                    ] as const).map(({ label, value, icon, color }) => (
                        <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{label}</p>
                                    <p className="text-2xl font-black text-gray-900 mt-1">{value.toLocaleString()}</p>
                                </div>
                                <div className={`w-10 h-10 rounded-lg bg-${color}-50 text-${color}-500 flex items-center justify-center`}>
                                    <i className={`fas ${icon}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Jump links ─────────────────────────────────────────── */}
                <div className="flex flex-wrap gap-2">
                    {([
                        { anchor: 'sec-incidents', label: 'Incidents',        color: 'red' },
                        { anchor: 'sec-threats',   label: 'Threat Intel',     color: 'orange' },
                        { anchor: 'sec-hardware',  label: 'Hardware',         color: 'cyan' },
                        { anchor: 'sec-software',  label: 'Software',         color: 'indigo' },
                        { anchor: 'sec-bsec',      label: 'Branch Security',  color: 'blue' },
                        { anchor: 'sec-systems',   label: 'Systems Registry', color: 'purple' },
                    ] as const).map(({ anchor, label, color }) => (
                        <a key={anchor} href={`#${anchor}`}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border border-${color}-200 bg-${color}-50 text-${color}-700 hover:bg-${color}-100 transition`}>
                            {label}
                        </a>
                    ))}
                </div>

                {/* ══════════════════════════════════════════════════════════
                    SECTION 1 — INCIDENTS
                ══════════════════════════════════════════════════════════ */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <SectionHeader id="sec-incidents" iconBg="bg-red-100" iconColor="text-red-600" icon="fa-triangle-exclamation"
                        title="Incident Report"
                        meta={`${inc.total.toLocaleString()} total &bull; ${inc.open} open &bull; ${inc.critical} critical &bull; ${inc.closed} closed`}
                        linkHref="/incidents" linkLabel="View All" />

                    {/* Severity pills */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {Object.entries(inc.by_severity).map(([sev, cnt]) => (
                            <span key={sev} className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${SEV_BADGE[sev] ?? 'bg-gray-100 text-gray-600'}`}>
                                {sev}: {cnt}
                            </span>
                        ))}
                    </div>

                    {inc.rows.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <i className="fas fa-triangle-exclamation text-3xl block mb-2 text-gray-200" />
                            <p className="text-sm">No incidents found for this filter.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto rounded-xl border border-gray-100">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50/80 text-left">
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Incident #</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Date</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Severity</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Category</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Branch</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Status</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Reporter</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {inc.rows.map(row => (
                                            <tr key={row.incident_number} className="hover:bg-gray-50/50 transition">
                                                <td className="px-4 py-3">
                                                    <Link href={`/incidents/${row.incident_number}`} className="font-mono text-xs font-bold text-blue-600 hover:underline">
                                                        {row.incident_number}
                                                    </Link>
                                                    {row.description && (
                                                        <p className="text-[11px] text-gray-500 truncate max-w-[200px] mt-0.5">
                                                            {row.description.slice(0, 60)}{row.description.length > 60 ? '…' : ''}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell">
                                                    {fmtDate(row.incident_at ?? row.created_at)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${SEV_BADGE[row.severity] ?? 'bg-gray-100 text-gray-600'}`}>
                                                        {row.severity}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-700 hidden lg:table-cell">{row.category ?? '—'}</td>
                                                <td className="px-4 py-3 text-xs text-gray-700 hidden lg:table-cell">{row.branch ?? '—'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[row.workflow_status] ?? 'bg-gray-100 text-gray-600'}`}>
                                                        {STATUS_LABEL[row.workflow_status] ?? row.workflow_status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell">{row.reporter_name ?? '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination page={inc.page} totalPages={inc.total_pages} anchor="sec-incidents" paramKey="inc_page" query={baseQuery} />
                        </>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════════
                    SECTION 2 — THREAT INTELLIGENCE
                ══════════════════════════════════════════════════════════ */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <SectionHeader id="sec-threats" iconBg="bg-orange-100" iconColor="text-orange-600" icon="fa-bug"
                        title="Threat Intelligence Report"
                        meta={`${ti.total.toLocaleString()} IOC entries &bull; ${ti.active} active &bull; ${ti.critical} critical &bull; ${ti.high} high`}
                        linkHref="/threat-intel" linkLabel="View All" />

                    {ti.rows.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <i className="fas fa-bug text-3xl block mb-2 text-gray-200" />
                            <p className="text-sm">No threat intelligence entries found.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto rounded-xl border border-gray-100">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50/80 text-left">
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">IOC ID</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Type</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Value</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Severity</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Status</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Confidence</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">First Seen</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {ti.rows.map(row => (
                                            <tr key={row.ioc_id} className="hover:bg-gray-50/50 transition">
                                                <td className="px-4 py-3">
                                                    <Link href={`/threat-intel/${row.ioc_id}`} className="font-mono text-xs font-bold text-orange-600 hover:underline">
                                                        {row.ioc_id}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-700">{row.type}</td>
                                                <td className="px-4 py-3 text-xs font-mono text-gray-700 hidden md:table-cell max-w-[160px] truncate">
                                                    {row.value.slice(0,40)}{row.value.length > 40 ? '…' : ''}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${SEV_BADGE[row.severity] ?? 'bg-gray-100 text-gray-600'}`}>
                                                        {row.severity}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[row.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-600 hidden lg:table-cell">{row.confidence}</td>
                                                <td className="px-4 py-3 text-xs text-gray-600 hidden lg:table-cell">{fmtDate(row.first_seen)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination page={ti.page} totalPages={ti.total_pages} anchor="sec-threats" paramKey="ti_page" query={baseQuery} />
                        </>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════════
                    SECTION 3 — HARDWARE
                ══════════════════════════════════════════════════════════ */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <SectionHeader id="sec-hardware" iconBg="bg-cyan-100" iconColor="text-cyan-600" icon="fa-server"
                        title="Hardware Inventory Report"
                        meta={`${hw.total.toLocaleString()} assets &bull; ${hw.active} active`}
                        linkHref="/hardware" linkLabel="View All" />

                    {hw.rows.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <i className="fas fa-server text-3xl block mb-2 text-gray-200" />
                            <p className="text-sm">No hardware assets found.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto rounded-xl border border-gray-100">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50/80 text-left">
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Tag / Name</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Type</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Branch</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Assigned To</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Status</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Warranty</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {hw.rows.map(row => {
                                            const expired = row.warranty_expiry && row.warranty_expiry < new Date().toISOString().slice(0,10);
                                            return (
                                                <tr key={row.tag} className="hover:bg-gray-50/50 transition">
                                                    <td className="px-4 py-3">
                                                        <Link href={`/hardware/${row.tag}`} className="font-mono text-xs font-bold text-cyan-700 hover:underline">{row.tag}</Link>
                                                        <p className="text-xs text-gray-700 font-semibold mt-0.5">{row.name}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell">{row.type}</td>
                                                    <td className="px-4 py-3 text-xs text-gray-600 hidden lg:table-cell">{row.branch ?? '—'}</td>
                                                    <td className="px-4 py-3 text-xs text-gray-600 hidden lg:table-cell">{row.assigned_user ?? '—'}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[row.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                                            {row.status}
                                                        </span>
                                                    </td>
                                                    <td className={`px-4 py-3 text-xs hidden md:table-cell ${expired ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                                                        {fmtDate(row.warranty_expiry)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination page={hw.page} totalPages={hw.total_pages} anchor="sec-hardware" paramKey="hw_page" query={baseQuery} />
                        </>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════════
                    SECTION 4 — SOFTWARE
                ══════════════════════════════════════════════════════════ */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <SectionHeader id="sec-software" iconBg="bg-indigo-100" iconColor="text-indigo-600" icon="fa-floppy-disk"
                        title="Software Inventory Report"
                        meta={`${sw.total.toLocaleString()} licenses &bull; <span class="${sw.expired > 0 ? 'text-red-600 font-bold' : ''}">${sw.expired} expired</span>`}
                        linkHref="/software" linkLabel="View All" />

                    {sw.rows.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <i className="fas fa-floppy-disk text-3xl block mb-2 text-gray-200" />
                            <p className="text-sm">No software licenses found.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto rounded-xl border border-gray-100">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50/80 text-left">
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">ID / Name</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Vendor</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Branch</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Licenses</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Expiry</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Category</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {sw.rows.map(row => {
                                            const today2 = new Date().toISOString().slice(0,10);
                                            const expired = row.expiry_date && row.expiry_date < today2;
                                            return (
                                                <tr key={row.sw_id} className={`hover:bg-gray-50/50 transition ${expired ? 'bg-red-50/30' : ''}`}>
                                                    <td className="px-4 py-3">
                                                        <Link href={`/software/${row.sw_id}`} className="font-mono text-xs font-bold text-indigo-600 hover:underline">{row.sw_id}</Link>
                                                        <p className="text-xs text-gray-700 font-semibold mt-0.5">{row.name}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell">{row.vendor ?? '—'}</td>
                                                    <td className="px-4 py-3 text-xs text-gray-600 hidden lg:table-cell">{row.branch ?? '—'}</td>
                                                    <td className="px-4 py-3 text-xs hidden md:table-cell">
                                                        <span className="font-bold text-gray-900">{row.used_licenses}</span>
                                                        <span className="text-gray-400"> / {row.total_licenses}</span>
                                                    </td>
                                                    <td className={`px-4 py-3 text-xs ${expired ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                                                        {row.expiry_date ? (
                                                            <>
                                                                {fmtDate(row.expiry_date)}
                                                                {expired && <span className="ml-1 text-[10px] font-bold bg-red-100 text-red-600 px-1 rounded">Expired</span>}
                                                            </>
                                                        ) : (
                                                            <span className="text-gray-400">Perpetual</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-600 hidden lg:table-cell">{row.category}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination page={sw.page} totalPages={sw.total_pages} anchor="sec-software" paramKey="sw_page" query={baseQuery} />
                        </>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════════
                    SECTION 5 — BRANCH SECURITY
                ══════════════════════════════════════════════════════════ */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <SectionHeader id="sec-bsec" iconBg="bg-blue-100" iconColor="text-blue-600" icon="fa-shield-halved"
                        title="Branch Security Posture Report"
                        meta={`${bs.total} branches assessed &bull; org average <span class="${bs.avg >= 75 ? 'text-green-600' : bs.avg >= 50 ? 'text-amber-600' : 'text-red-600'} font-bold">${bs.avg}%</span>`}
                        linkHref="/branch-security" linkLabel="View Dashboard" />

                    {bs.rows.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <i className="fas fa-shield-halved text-3xl block mb-2 text-gray-200" />
                            <p className="text-sm">No branch security data yet.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto rounded-xl border border-gray-100">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50/80 text-left">
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Branch</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Score</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">AV</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Firewall</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Encryption</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">MFA</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Backup</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Computers</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Updated</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {bs.rows.map(row => (
                                            <tr key={row.branch} className="hover:bg-gray-50/50 transition">
                                                <td className="px-4 py-3">
                                                    <Link href={`/branch-security/${encodeURIComponent(row.branch)}/edit`} className="font-semibold text-gray-900 hover:text-blue-600 text-sm">
                                                        {row.branch}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${scoreBg(row.score)}`} style={{ width: `${row.score}%` }} />
                                                        </div>
                                                        <span className={`text-sm font-black ${scoreColor(row.score)}`}>{row.score}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 hidden md:table-cell">{ctrlBadge(row.antivirus)}</td>
                                                <td className="px-4 py-3 hidden md:table-cell">{ctrlBadge(row.firewall)}</td>
                                                <td className="px-4 py-3 hidden lg:table-cell">{ctrlBadge(row.disk_encryption)}</td>
                                                <td className="px-4 py-3 hidden lg:table-cell">{ctrlBadge(row.mfa)}</td>
                                                <td className="px-4 py-3 hidden lg:table-cell">{ctrlBadge(row.backup_status)}</td>
                                                <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell">
                                                    {row.computers_total} total &bull; <span className="text-green-600">{row.computers_patched} patched</span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{fmtDate(row.updated_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination page={bs.page} totalPages={bs.total_pages} anchor="sec-bsec" paramKey="bs_page" query={baseQuery} />
                        </>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════════
                    SECTION 6 — SYSTEMS REGISTRY
                ══════════════════════════════════════════════════════════ */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <SectionHeader id="sec-systems" iconBg="bg-purple-100" iconColor="text-purple-600" icon="fa-network-wired"
                        title="Systems Registry Report"
                        meta={`${sys.total.toLocaleString()} systems &bull; ${sys.critical} critical`}
                        linkHref="/systems" linkLabel="View All" />

                    {sys.rows.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <i className="fas fa-network-wired text-3xl block mb-2 text-gray-200" />
                            <p className="text-sm">No systems registered yet.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto rounded-xl border border-gray-100">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50/80 text-left">
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">ID / Name</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Criticality</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Status</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Owner</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Hosting</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {sys.rows.map(row => {
                                            const critCls: Record<string,string> = {
                                                Critical: 'bg-red-100 text-red-700 border border-red-200',
                                                High:     'bg-orange-100 text-orange-700 border border-orange-200',
                                                Medium:   'bg-yellow-100 text-yellow-700 border border-yellow-200',
                                                Low:      'bg-green-100 text-green-700 border border-green-200',
                                            };
                                            const statCls: Record<string,string> = {
                                                Active:         'bg-green-100 text-green-700',
                                                Maintenance:    'bg-amber-100 text-amber-700',
                                                Development:    'bg-blue-100 text-blue-700',
                                                Suspended:      'bg-orange-100 text-orange-700',
                                                Decommissioned: 'bg-gray-100 text-gray-500',
                                            };
                                            return (
                                                <tr key={row.sys_id} className="hover:bg-gray-50/50 transition">
                                                    <td className="px-4 py-3">
                                                        <Link href={`/systems/${row.sys_id}`} className="font-mono text-xs font-bold text-purple-600 hover:underline">{row.sys_id}</Link>
                                                        <p className="text-xs text-gray-700 font-semibold mt-0.5">{row.name}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell">{row.category}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${critCls[row.criticality] ?? 'bg-gray-100 text-gray-600'}`}>
                                                            {row.criticality}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statCls[row.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                                            {row.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-600 hidden lg:table-cell">{row.owner ?? '—'}</td>
                                                    <td className="px-4 py-3 text-xs text-gray-600 hidden lg:table-cell">{row.hosting ?? '—'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination page={sys.page} totalPages={sys.total_pages} anchor="sec-systems" paramKey="sys_page" query={baseQuery} />
                        </>
                    )}
                </div>

            </div>
        </AppLayout>
    );
}
