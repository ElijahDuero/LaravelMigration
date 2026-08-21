import AppLayout from '@/components/AppLayout';
import { Link, router, usePage } from '@inertiajs/react';

interface Software {
    id: number;
    sw_id: string;
    name: string;
    category: string;
    vendor: string;
    version: string | null;
    license_type: string;
    license_model: string | null;
    license_key: string | null;
    total_licenses: number;
    used_licenses: number;
    branch: string | null;
    department: string | null;
    purchase_date: string | null;
    expiry_date: string | null;
    cost_annual: string | null;
    supplier: string | null;
    po_number: string | null;
    invoice: string | null;
    notes: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

const CAT_META: Record<string, { icon: string; color: string }> = {
    'Antivirus':      { icon: 'fa-shield-halved',     color: 'red' },
    'Office':         { icon: 'fa-file-word',          color: 'blue' },
    'HRIS':           { icon: 'fa-users-gear',         color: 'indigo' },
    'Accounting':     { icon: 'fa-calculator',         color: 'emerald' },
    'Enrollment':     { icon: 'fa-user-graduate',      color: 'cyan' },
    'LMS':            { icon: 'fa-graduation-cap',     color: 'amber' },
    'Payroll':        { icon: 'fa-money-check-dollar', color: 'green' },
    'Custom Systems': { icon: 'fa-gear',               color: 'gray' },
};

const LICENSE_BADGE: Record<string, string> = {
    'Licensed':   'bg-green-50 text-green-700 border border-green-200',
    'Free / OSS': 'bg-teal-50 text-teal-700 border border-teal-200',
    'Trial':      'bg-blue-50 text-blue-700 border border-blue-200',
    'Expired':    'bg-red-50 text-red-700 border border-red-200',
    'Unlicensed': 'bg-amber-50 text-amber-700 border border-amber-200',
};

function expiryCountdown(dateStr: string | null) {
    if (!dateStr) return { text: 'Perpetual', cls: 'text-emerald-600', icon: 'fa-infinity', days: null as number | null };
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.floor(diff / 86_400_000);
    if (days < 0)  return { text: `${Math.abs(days)} days overdue`, cls: 'text-red-600 font-bold',       icon: 'fa-circle-xmark',         days };
    if (days <= 30) return { text: `${days} days left`,              cls: 'text-red-600 font-bold',       icon: 'fa-triangle-exclamation', days };
    if (days <= 90) return { text: `${days} days left`,              cls: 'text-amber-600 font-semibold', icon: 'fa-clock',                days };
    return { text: `${days} days left`, cls: 'text-green-600', icon: 'fa-circle-check', days };
}

function fmtDate(d: string | null) {
    if (!d) return 'Perpetual';
    return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function fmtCost(v: string | null) {
    if (!v) return '-';
    return `₱${parseFloat(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export default function SoftwareView({ software, branches }: { software: Software; branches: string[] }) {
    const { auth } = usePage<any>().props;
    const isAdmin  = ['super_admin', 'admin'].includes(auth.user?.role ?? '');
    const meta     = CAT_META[software.category] ?? { icon: 'fa-box', color: 'gray' };
    const licBadge = LICENSE_BADGE[software.license_type] ?? 'bg-gray-100 text-gray-700';
    const exp      = expiryCountdown(software.expiry_date);

    const total   = software.total_licenses ?? 0;
    const used    = software.used_licenses  ?? 0;
    const avail   = Math.max(0, total - used);
    const pct     = total > 0 ? Math.min(100, Math.round(used / total * 100)) : 0;
    const pctCls  = pct >= 95 ? 'text-red-600' : pct >= 80 ? 'text-amber-600' : 'text-green-600';
    const barCls  = pct >= 95 ? 'from-red-400 to-red-600' : pct >= 80 ? 'from-amber-400 to-amber-600' : 'from-green-400 to-green-600';

    const costAnnual  = software.cost_annual ? parseFloat(software.cost_annual) : 0;
    const costMonthly = costAnnual > 0 ? (costAnnual / 12) : 0;
    const costPerSeat = costAnnual > 0 && used > 0 ? (costAnnual / used) : 0;

    function handleDelete() {
        if (!confirm(`Permanently delete ${software.sw_id} — ${software.name}? This cannot be undone.`)) return;
        router.delete(`/software/${software.sw_id}`);
    }

    return (
        <AppLayout title="Software Details" subtitle="Installed software, licenses, versions, vendors, and installations">
            <div className="space-y-6">

                {/* Header card */}
                <div className={`card p-6 border-l-4 border-${meta.color}-500 bg-gradient-to-r from-${meta.color}-50/40 via-white to-white`}>
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                        <div className="flex items-start space-x-4 flex-1 min-w-0">
                            <div className={`w-16 h-16 bg-${meta.color}-100 text-${meta.color}-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner`}>
                                <i className={`fas ${meta.icon} text-2xl`}></i>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className="font-mono text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">{software.sw_id}</span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${licBadge}`}>
                                        <i className="fas fa-key mr-1 text-[10px]"></i>{software.license_type}
                                    </span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold bg-${meta.color}-100 text-${meta.color}-700 uppercase tracking-wide`}>
                                        {software.category}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 mb-1.5">{software.name}</h2>
                                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-gray-600">
                                    <span><i className="fas fa-building text-gray-400 mr-2"></i><strong className="text-gray-900 mr-1">Vendor:</strong>{software.vendor}</span>
                                    {software.version && (
                                        <span><i className="fas fa-code-branch text-gray-400 mr-2"></i><strong className="text-gray-900 mr-1">Version:</strong>
                                            <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">{software.version}</span>
                                        </span>
                                    )}
                                    {software.expiry_date && (
                                        <span><i className="fas fa-calendar-days text-gray-400 mr-2"></i><strong className="text-gray-900 mr-1">Expires:</strong>
                                            <span className="font-mono">{fmtDate(software.expiry_date)}</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link href="/software" className="btn btn-secondary"><i className="fas fa-arrow-left mr-2"></i>Back</Link>
                            {isAdmin && (
                                <>
                                    <Link href={`/software/${software.sw_id}/edit`} className="btn btn-secondary"><i className="fas fa-pen mr-2"></i>Edit</Link>
                                    <button onClick={handleDelete} className="btn btn-secondary text-red-600 hover:bg-red-50"><i className="fas fa-trash mr-2"></i>Delete</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mini stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Total Licenses',  value: total.toLocaleString(),             color: 'text-blue-600',   sub: 'pool size',            icon: 'fa-key' },
                        { label: 'In Use',          value: used.toLocaleString(),              color: 'text-green-600',  sub: `${pct}% utilization`,  icon: 'fa-user-check' },
                        { label: 'Available',       value: avail.toLocaleString(),             color: 'text-teal-600',   sub: 'free seats',           icon: 'fa-lock-open' },
                        { label: 'Annual Cost',     value: fmtCost(software.cost_annual),      color: 'text-amber-700',  sub: 'total',                icon: 'fa-calculator' },
                        { label: 'Monthly',         value: costMonthly > 0 ? `₱${costMonthly.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}` : '-', color: 'text-orange-600', sub: '÷12', icon: 'fa-calendar' },
                        { label: 'Per Seat',        value: costPerSeat > 0 ? `₱${costPerSeat.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}` : '-', color: 'text-purple-600', sub: '/user', icon: 'fa-user' },
                    ].map((s) => (
                        <div key={s.label} className="card p-5 hover:shadow-md transition">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{s.label}</p>
                            <p className={`text-2xl font-black ${s.color} mt-1`}>{s.value}</p>
                            <p className="text-[10px] text-gray-500 mt-1"><i className={`fas ${s.icon} mr-1`}></i>{s.sub}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left sidebar */}
                    <div className="space-y-6">

                        {/* License status card */}
                        <div className={`card p-6 bg-gradient-to-br from-${meta.color}-50/60 to-white border border-${meta.color}-100`}>
                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
                                <i className={`fas fa-id-card mr-2 text-${meta.color}-500`}></i>License / Expiration
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">License Model</p>
                                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{software.license_model ?? '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Utilization</p>
                                    <div className="flex items-center space-x-2">
                                        <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                                            <div className={`h-full rounded-full bg-gradient-to-r ${barCls}`} style={{ width: `${Math.min(100, pct)}%` }}></div>
                                        </div>
                                        <span className={`text-xs font-black font-mono ${pctCls}`}>{pct}%</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1 font-mono">{used.toLocaleString()} / {total.toLocaleString()}</p>
                                </div>
                                <div className="pt-3 border-t border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Expiration</p>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0`}>
                                            <i className={`fas ${exp.icon} ${exp.cls}`}></i>
                                        </div>
                                        <div>
                                            <p className={`text-sm font-black ${exp.cls}`}>{exp.text}</p>
                                            <p className="text-[10px] text-gray-500 font-mono">{fmtDate(software.expiry_date)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Vendor / Supplier */}
                        <div className="card p-6">
                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
                                <i className="fas fa-store mr-2 text-amber-500"></i>Vendor / Supplier
                            </h3>
                            <div className="space-y-3 text-sm">
                                {[
                                    { label: 'Vendor',    value: software.vendor,    icon: 'fa-building' },
                                    { label: 'Supplier',  value: software.supplier,  icon: 'fa-handshake' },
                                    { label: 'PO #',      value: software.po_number, icon: 'fa-file-invoice', mono: true },
                                    { label: 'Invoice #', value: software.invoice,   icon: 'fa-receipt',      mono: true },
                                ].map(({ label, value, icon, mono }) => (
                                    <div key={label} className="flex items-start justify-between">
                                        <span className="text-gray-500 flex items-center"><i className={`fas ${icon} mr-1.5 text-gray-400 text-xs`}></i>{label}</span>
                                        <span className={`font-semibold text-gray-800 text-right max-w-[60%] ${mono ? 'font-mono text-xs' : ''}`}>{value ?? '-'}</span>
                                    </div>
                                ))}
                                <div className="flex items-start justify-between pt-2 border-t border-gray-100">
                                    <span className="text-gray-500"><i className="fas fa-calendar-plus mr-1.5 text-gray-400 text-xs"></i>Purchased</span>
                                    <span className="font-mono font-semibold text-gray-800 text-xs">{fmtDate(software.purchase_date)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Audit */}
                        <div className="card p-6">
                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
                                <i className="fas fa-clock mr-2 text-gray-500"></i>Audit
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-start justify-between">
                                    <span className="text-gray-500 text-xs">Created</span>
                                    <span className="font-mono font-semibold text-gray-800 text-right text-[10px]">{software.created_at}</span>
                                </div>
                                <div className="flex items-start justify-between pt-2 border-t border-gray-100">
                                    <span className="text-gray-500 text-xs">Updated</span>
                                    <span className="font-mono font-semibold text-gray-800 text-right text-[10px]">{software.updated_at}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="lg:col-span-3 space-y-6">

                        {/* License key + details */}
                        <div className="card p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-5">
                                <i className="fas fa-info-circle mr-2 text-blue-500"></i>Software Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                {[
                                    { label: 'Software ID', value: software.sw_id,       mono: true },
                                    { label: 'Category',    value: software.category,    mono: false },
                                    { label: 'Vendor',      value: software.vendor,      mono: false },
                                    { label: 'Version',     value: software.version,     mono: true },
                                    { label: 'Branch',      value: software.branch,      mono: false },
                                    { label: 'Department',  value: software.department,  mono: false },
                                ].map(({ label, value, mono }) => (
                                    <div key={label}>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
                                        <p className={`mt-1 text-sm font-semibold text-gray-900 ${mono ? 'font-mono' : ''}`}>{value ?? '-'}</p>
                                    </div>
                                ))}
                            </div>

                            {software.license_key && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">License Key / Activation Code</label>
                                    <div className="mt-2 flex items-center space-x-3">
                                        <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 font-mono text-sm text-gray-800 tracking-wider break-all">
                                            {software.license_key}
                                        </code>
                                        <button
                                            type="button"
                                            onClick={() => navigator.clipboard.writeText(software.license_key!)}
                                            className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition flex-shrink-0"
                                            title="Copy to clipboard"
                                        >
                                            <i className="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {software.notes && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description / Notes</label>
                                    <p className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{software.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* License utilization visualization */}
                        <div className="card p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-5">
                                <i className="fas fa-chart-pie mr-2 text-purple-500"></i>License Utilization
                            </h3>
                            <div className="flex items-center gap-8">
                                <div className="relative flex-shrink-0">
                                    <svg className="w-28 h-28 -rotate-90">
                                        <circle cx="56" cy="56" r="48" stroke="#f3f4f6" strokeWidth="10" fill="none" />
                                        <circle cx="56" cy="56" r="48" stroke={pct >= 95 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#16a34a'}
                                            strokeWidth="10" fill="none" strokeLinecap="round"
                                            strokeDasharray={`${301.6 * pct / 100} 301.6`} />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className={`text-xl font-black ${pctCls}`}>{pct}%</span>
                                        <span className="text-[9px] text-gray-400 uppercase tracking-wider">used</span>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-3">
                                    {[
                                        { label: 'Total Licenses', value: total, color: 'bg-blue-500' },
                                        { label: 'In Use',         value: used,  color: pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-green-500' },
                                        { label: 'Available',      value: avail, color: 'bg-gray-200' },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${color}`}></div>
                                                <span className="text-gray-600">{label}</span>
                                            </div>
                                            <span className="font-bold text-gray-900 font-mono">{value.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
