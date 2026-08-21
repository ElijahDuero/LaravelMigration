import AppLayout from '@/components/AppLayout';
import { Link, usePage } from '@inertiajs/react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Kpis {
    hw_total: number;
    sw_titles: number;
    sw_licensed: number;
    warranty_expiring: number;
    compliant_assets: number;
    risk_count: number;
}
interface HwStats {
    count: number;
    active: number;
    maint: number;
    warranty_expiring: number;
    type_branches: number;
    types: Record<string, number>;
}
interface SwStats {
    count: number;
    titles: number;
    licensed: number;
    expiring: number;
    risk: number;
    cats: Record<string, number>;
}
interface HierarchyItem { name: string; icon: string; color: string; count: number }
interface BranchRow { name: string; hw: number; sw: number; posture: number; hw_bar_pct: number }
interface RecentHw { tag: string; name: string; type: string; status: string; assigned_user: string|null; branch: string|null }
interface RecentSw { sw_id: string; name: string; category: string; license_type: string; expiry_date: string|null; exp_days: number|null; used_licenses: number; total_licenses: number; installs: number; install_pct: number }

interface Props {
    kpis: Kpis;
    hw: HwStats;
    sw: SwStats;
    hierarchy: HierarchyItem[];
    branch_comparison: BranchRow[];
    recent_hw: RecentHw[];
    recent_sw: RecentSw[];
}

// ── Metadata maps (mirrors PHP) ────────────────────────────────────────────────
const HW_TYPE_META: Record<string, { icon: string; color: string }> = {
    'Desktop':    { icon: 'fa-desktop',         color: 'blue' },
    'Laptop':     { icon: 'fa-laptop',           color: 'indigo' },
    'Server':     { icon: 'fa-server',           color: 'purple' },
    'NAS':        { icon: 'fa-hdd',              color: 'violet' },
    'Firewall':   { icon: 'fa-shield-halved',    color: 'red' },
    'Switch':     { icon: 'fa-network-wired',    color: 'cyan' },
    'Router':     { icon: 'fa-wifi',             color: 'teal' },
    'Printer':    { icon: 'fa-print',            color: 'orange' },
    'CCTV':       { icon: 'fa-video',            color: 'amber' },
    'Biometrics': { icon: 'fa-fingerprint',      color: 'lime' },
    'WiFi AP':    { icon: 'fa-tower-broadcast',  color: 'sky' },
    'UPS':        { icon: 'fa-battery-full',     color: 'green' },
};
const SW_CAT_META: Record<string, { icon: string; color: string }> = {
    'Antivirus':      { icon: 'fa-shield-halved',  color: 'red' },
    'Office':         { icon: 'fa-file-word',       color: 'blue' },
    'HRIS':           { icon: 'fa-users-gear',      color: 'purple' },
    'Accounting':     { icon: 'fa-calculator',      color: 'emerald' },
    'Enrollment':     { icon: 'fa-user-graduate',   color: 'cyan' },
    'LMS':            { icon: 'fa-graduation-cap',  color: 'indigo' },
    'Payroll':        { icon: 'fa-money-check',     color: 'green' },
    'Custom Systems': { icon: 'fa-gear',            color: 'gray' },
};
const HW_STATUS_BADGE: Record<string, string> = {
    'Active':             'bg-green-50 text-green-700 border border-green-200',
    'In Maintenance':     'bg-amber-50 text-amber-700 border border-amber-200',
    'Decommissioned':     'bg-gray-100 text-gray-700 border border-gray-200',
    'Lost/Stolen':        'bg-red-50 text-red-700 border border-red-200',
    'Pending Deployment': 'bg-blue-50 text-blue-700 border border-blue-200',
};
const SW_LICENSE_BADGE: Record<string, string> = {
    'Licensed':   'bg-green-50 text-green-700 border border-green-200',
    'Free / OSS': 'bg-teal-50 text-teal-700 border border-teal-200',
    'Trial':      'bg-blue-50 text-blue-700 border border-blue-200',
    'Expired':    'bg-red-50 text-red-700 border border-red-200',
    'Unlicensed': 'bg-amber-50 text-amber-700 border border-amber-200',
};

function hwMeta(type: string) { return HW_TYPE_META[type] ?? { icon: 'fa-microchip', color: 'gray' }; }
function swMeta(cat: string)  { return SW_CAT_META[cat]   ?? { icon: 'fa-box',       color: 'gray' }; }

function fmtExpiry(dateStr: string|null): string {
    if (!dateStr) return 'Perpetual';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AssetsIndex() {
    const { kpis, hw, sw, hierarchy, branch_comparison, recent_hw, recent_sw } =
        usePage<{ props: Props }>().props as unknown as Props;

    const hwTypeEntries  = Object.entries(hw.types).slice(0, 6);
    const hwTypeOverflow = Object.keys(hw.types).length - 6;
    const swCatEntries   = Object.entries(sw.cats).slice(0, 6);
    const swCatOverflow  = Object.keys(sw.cats).length - 6;

    const kpiCards = [
        { label: 'Total Hardware',     value: kpis.hw_total,          icon: 'fa-microchip',          color: 'blue' },
        { label: 'Software Titles',    value: kpis.sw_titles,         icon: 'fa-box',                color: 'purple' },
        { label: 'Active Licenses',    value: kpis.sw_licensed,       icon: 'fa-key',                color: 'green' },
        { label: 'Warranty Expiring',  value: kpis.warranty_expiring, icon: 'fa-triangle-exclamation',color: 'amber' },
        { label: 'Compliant Assets',   value: kpis.compliant_assets,  icon: 'fa-shield-check',       color: 'teal' },
        { label: 'Compliance Risk',    value: kpis.risk_count,        icon: 'fa-circle-exclamation', color: 'red' },
    ] as const;

    return (
        <AppLayout>
            <div className="space-y-6">

                {/* ── KPI Strip ─────────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {kpiCards.map(({ label, value, icon, color }) => (
                        <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500">{label}</p>
                                    <p className="text-xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
                                </div>
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${color}-50 text-${color}-500`}>
                                    <i className={`fas ${icon}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Module Cards: Hardware + Software ─────────────────── */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                    {/* Hardware card */}
                    <section className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-100 flex-shrink-0">
                                <i className="fas fa-microchip text-xl" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <Link href="/hardware" className="group inline-flex items-center text-base font-bold text-gray-900 hover:text-blue-700 transition">
                                            Hardware Inventory
                                            <i className="fas fa-arrow-right ml-2 text-xs text-gray-300 group-hover:text-blue-500 transition" />
                                        </Link>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {Object.keys(hw.types).length} device types across {hw.type_branches} branches
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-2xl leading-none font-bold text-gray-900">{hw.count.toLocaleString()}</p>
                                        <p className="text-[10px] text-gray-500 mt-1">devices</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {hwTypeEntries.map(([type, cnt]) => {
                                        const m = hwMeta(type);
                                        return (
                                            <span key={type} className={`inline-flex items-center px-2 py-1 rounded-md bg-${m.color}-50 text-${m.color}-700 text-[10px] font-medium`} title={type}>
                                                <i className={`fas ${m.icon} mr-1 text-[9px]`} />{type}
                                            </span>
                                        );
                                    })}
                                    {hwTypeOverflow > 0 && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-[10px] font-medium">
                                            +{hwTypeOverflow} types
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-4 text-xs">
                                <span><strong className="text-green-600">{hw.active.toLocaleString()}</strong> <span className="text-gray-500">active</span></span>
                                <span><strong className="text-amber-600">{hw.maint.toLocaleString()}</strong> <span className="text-gray-500">maintenance</span></span>
                                <span><strong className="text-red-600">{hw.warranty_expiring.toLocaleString()}</strong> <span className="text-gray-500">warranty due</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href="/hardware" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View inventory</Link>
                                <Link href="/hardware/create" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition">
                                    <i className="fas fa-plus mr-1" />Add Device
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Software card */}
                    <section className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-purple-100 flex-shrink-0">
                                <i className="fas fa-box text-xl" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <Link href="/software" className="group inline-flex items-center text-base font-bold text-gray-900 hover:text-purple-700 transition">
                                            Software Inventory
                                            <i className="fas fa-arrow-right ml-2 text-xs text-gray-300 group-hover:text-purple-500 transition" />
                                        </Link>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {Object.keys(sw.cats).length} categories and {sw.licensed.toLocaleString()} active licenses
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-2xl leading-none font-bold text-gray-900">{sw.titles.toLocaleString()}</p>
                                        <p className="text-[10px] text-gray-500 mt-1">titles</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {swCatEntries.map(([cat, cnt]) => {
                                        const m = swMeta(cat);
                                        return (
                                            <span key={cat} className={`inline-flex items-center px-2 py-1 rounded-md bg-${m.color}-50 text-${m.color}-700 text-[10px] font-medium`} title={cat}>
                                                <i className={`fas ${m.icon} mr-1 text-[9px]`} />{cat}
                                            </span>
                                        );
                                    })}
                                    {swCatOverflow > 0 && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-[10px] font-medium">
                                            +{swCatOverflow} categories
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-4 text-xs">
                                <span><strong className="text-green-600">{sw.licensed.toLocaleString()}</strong> <span className="text-gray-500">licenses</span></span>
                                <span><strong className="text-amber-600">{sw.expiring.toLocaleString()}</strong> <span className="text-gray-500">expiring soon</span></span>
                                <span><strong className="text-red-600">{sw.risk.toLocaleString()}</strong> <span className="text-gray-500">at risk</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href="/software" className="text-xs font-semibold text-purple-600 hover:text-purple-700">View inventory</Link>
                                <Link href="/software/create" className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition">
                                    <i className="fas fa-plus mr-1" />Add License
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>

                {/* ── Hierarchy + Branch Comparison ─────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* Asset Hierarchy */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-5">
                            <i className="fas fa-diagram-project mr-2 text-amber-500" />Asset Hierarchy
                        </h3>
                        <div className="space-y-2">
                            {hierarchy.map((item) => (
                                <div key={item.name} className="flex items-center">
                                    <div className={`w-9 h-9 bg-${item.color}-100 text-${item.color}-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
                                        <i className={`fas ${item.icon} text-xs`} />
                                    </div>
                                    <div className={`flex-1 mx-3 h-px bg-gradient-to-r from-${item.color}-200 to-gray-100`} />
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-gray-900">{item.name}</div>
                                        <div className={`text-[10px] font-semibold text-${item.color}-600 font-mono`}>{item.count.toLocaleString()} items</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Per-branch breakdown */}
                        {branch_comparison.length > 0 && (
                            <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-xs font-semibold text-gray-700 mb-1">Branch</p>
                                <p className="text-[11px] text-gray-500 mb-3">Each branch has its own inventory with full hierarchy support</p>
                                <div className="space-y-1.5">
                                    {branch_comparison.map((b) => (
                                        <div key={b.name} className="flex items-center justify-between text-xs">
                                            <span className="text-gray-600">
                                                <i className="fas fa-chevron-right text-gray-300 mr-1 text-[10px]" />{b.name}
                                            </span>
                                            <span className="font-mono text-gray-400">{b.hw} hw / {b.sw} sw</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Branch Comparison */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-3">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Branch Comparison</h3>
                                <p className="text-sm text-gray-500 mt-1">Asset distribution and security posture per branch</p>
                            </div>
                            <div className="flex items-center space-x-2 text-xs">
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700">
                                    <i className="fas fa-microchip mr-1.5 text-[10px]" />Hardware
                                </span>
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 text-emerald-700">
                                    <i className="fas fa-shield-halved mr-1.5 text-[10px]" />Posture
                                </span>
                            </div>
                        </div>

                        {branch_comparison.length === 0 ? (
                            <p className="text-sm text-gray-400 italic text-center py-10">No branch data yet.</p>
                        ) : (
                            <div className="space-y-5">
                                {branch_comparison.map((b) => (
                                    <div key={b.name}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-md flex items-center justify-center">
                                                    <i className="fas fa-building text-xs" />
                                                </div>
                                                <p className="text-sm font-semibold text-gray-800">{b.name}</p>
                                            </div>
                                            <div className="flex items-center space-x-4 text-xs">
                                                <div className="text-right">
                                                    <span className="font-bold text-blue-700 font-mono">{b.hw.toLocaleString()}</span>
                                                    <span className="text-gray-400 ml-1">hw</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold text-purple-700 font-mono">{b.sw.toLocaleString()}</span>
                                                    <span className="text-gray-400 ml-1">sw</span>
                                                </div>
                                                <div className="text-right w-10">
                                                    <span className={`text-[10px] font-bold ${b.posture >= 75 ? 'text-emerald-600' : b.posture >= 50 ? 'text-amber-600' : b.posture > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                        {b.posture > 0 ? `${b.posture}%` : '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
                                                    style={{ width: `${b.hw_bar_pct}%` }} />
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden col-span-2">
                                                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                                                    style={{ width: `${b.posture}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Recent Hardware + Recent Software ─────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Recent Hardware */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full mr-2.5 inline-block" />
                                    Recent Hardware
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Recently registered or updated devices</p>
                            </div>
                            <Link href="/hardware" className="text-xs text-blue-600 font-semibold hover:underline flex items-center">
                                View All <i className="fas fa-arrow-right ml-1.5 text-[10px]" />
                            </Link>
                        </div>

                        {recent_hw.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                <i className="fas fa-inbox text-3xl mb-2 block" />No hardware yet
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {recent_hw.map((h) => {
                                    const m = hwMeta(h.type);
                                    return (
                                        <div key={h.tag} className="group flex items-center p-3 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                                            <div className={`w-10 h-10 bg-${m.color}-100 text-${m.color}-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
                                                <i className={`fas ${m.icon} text-sm`} />
                                            </div>
                                            <div className="flex-1 min-w-0 mx-3">
                                                <Link href={`/hardware/${h.tag}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition block truncate">
                                                    {h.name}
                                                </Link>
                                                <p className="text-[11px] text-gray-500 truncate">
                                                    <span className="font-mono">{h.tag}</span>
                                                    {h.assigned_user && <> · {h.assigned_user}</>}
                                                    {h.branch && <> · {h.branch}</>}
                                                </p>
                                            </div>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0 ${HW_STATUS_BADGE[h.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                                {h.status}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Recent Software */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <span className="w-2.5 h-2.5 bg-purple-500 rounded-full mr-2.5 inline-block" />
                                    Recent Software
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Software licenses and compliance status</p>
                            </div>
                            <Link href="/software" className="text-xs text-purple-600 font-semibold hover:underline flex items-center">
                                View All <i className="fas fa-arrow-right ml-1.5 text-[10px]" />
                            </Link>
                        </div>

                        {recent_sw.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                <i className="fas fa-inbox text-3xl mb-2 block" />No software yet
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {recent_sw.map((s) => {
                                    const m      = swMeta(s.category);
                                    const expSoon = s.exp_days !== null && s.exp_days > 0 && s.exp_days < 90;
                                    const pctColor = s.install_pct >= 95
                                        ? 'bg-red-500'
                                        : s.install_pct >= 85
                                          ? 'bg-amber-500'
                                          : 'bg-green-500';
                                    return (
                                        <div key={s.sw_id} className="group flex items-start p-3 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                                            <div className={`w-10 h-10 bg-${m.color}-100 text-${m.color}-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
                                                <i className={`fas ${m.icon} text-sm`} />
                                            </div>
                                            <div className="flex-1 min-w-0 mx-3">
                                                <Link href={`/software/${s.sw_id}`} className="text-sm font-semibold text-gray-900 hover:text-purple-600 transition block truncate">
                                                    {s.name}
                                                </Link>
                                                <div className="flex items-center mt-1 space-x-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                            <div className={`h-full rounded-full ${pctColor}`} style={{ width: `${s.install_pct}%` }} />
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-semibold text-gray-600 font-mono whitespace-nowrap">
                                                        {s.installs} installs
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end space-y-1 flex-shrink-0">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${SW_LICENSE_BADGE[s.license_type] ?? 'bg-gray-100 text-gray-700'}`}>
                                                    {s.license_type}
                                                </span>
                                                <span className={`text-[10px] font-mono ${expSoon ? 'text-amber-600 font-bold' : 'text-gray-500'}`}>
                                                    {fmtExpiry(s.expiry_date)}
                                                    {expSoon && <i className="fas fa-clock ml-1 text-[8px]" />}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
