import AppLayout from '@/components/AppLayout';
import { Link, router, usePage } from '@inertiajs/react';

interface Hardware {
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
    rack: string | null;
    assigned_user: string | null;
    department: string | null;
    ip_address: string | null;
    mac_address: string | null;
    hostname: string | null;
    operating_system: string | null;
    cpu: string | null;
    ram: string | null;
    storage: string | null;
    purchase_date: string | null;
    warranty_expiry: string | null;
    supplier: string | null;
    invoice: string | null;
    purchase_cost: string | null;
    notes: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

const TYPE_META: Record<string, { icon: string; color: string }> = {
    Desktop:    { icon: 'fa-desktop',        color: 'purple' },
    Laptop:     { icon: 'fa-laptop',          color: 'indigo' },
    Server:     { icon: 'fa-server',          color: 'blue' },
    NAS:        { icon: 'fa-hard-drive',      color: 'teal' },
    Firewall:   { icon: 'fa-shield-halved',   color: 'red' },
    Switch:     { icon: 'fa-network-wired',   color: 'cyan' },
    Router:     { icon: 'fa-wifi',            color: 'sky' },
    Printer:    { icon: 'fa-print',           color: 'amber' },
    CCTV:       { icon: 'fa-video',           color: 'pink' },
    Biometrics: { icon: 'fa-fingerprint',     color: 'fuchsia' },
    'WiFi AP':  { icon: 'fa-tower-broadcast', color: 'emerald' },
    UPS:        { icon: 'fa-battery-full',    color: 'orange' },
};

const STATUS_BADGE: Record<string, string> = {
    'Active':             'bg-green-50 text-green-700 border border-green-200',
    'In Maintenance':     'bg-amber-50 text-amber-700 border border-amber-200',
    'Decommissioned':     'bg-gray-100 text-gray-700 border border-gray-200',
    'Lost/Stolen':        'bg-red-50 text-red-700 border border-red-200',
    'Pending Deployment': 'bg-blue-50 text-blue-700 border border-blue-200',
};

function warrantyInfo(dateStr: string | null) {
    if (!dateStr) return { months: '-', pct: 100, valid: null as null | boolean, expiring: false };
    const diff  = new Date(dateStr).getTime() - Date.now();
    const days  = Math.floor(diff / 86_400_000);
    const months= Math.round(days / 30.4);
    const pct   = Math.max(0, Math.min(100, Math.round(diff / (3 * 365 * 86_400_000) * 100)));
    return {
        months: days > 0 ? `${months}mo` : '0',
        pct,
        valid: days > 0,
        expiring: days > 0 && days <= 90,
    };
}

function fmtDate(d: string | null) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function HardwareView({ hardware }: { hardware: Hardware }) {
    const { auth } = usePage<any>().props;
    const isAdmin  = ['super_admin', 'admin'].includes(auth.user?.role ?? '');
    const meta     = TYPE_META[hardware.type] ?? { icon: 'fa-microchip', color: 'gray' };
    const wInfo    = warrantyInfo(hardware.warranty_expiry);
    const statusCls = STATUS_BADGE[hardware.status] ?? 'bg-gray-100 text-gray-700';

    const strokeColor = wInfo.valid === null ? '#9ca3af' : wInfo.expiring ? '#f59e0b' : wInfo.valid ? '#16a34a' : '#dc2626';
    // Circle: r=52, circumference ~326.7
    const circ  = 326.7;
    const drawn = circ * (1 - (100 - wInfo.pct) / 100);

    function handleDelete() {
        if (!confirm(`Permanently delete hardware asset ${hardware.tag} (${hardware.name})? This cannot be undone.`)) return;
        router.delete(`/hardware/${hardware.tag}`);
    }

    return (
        <AppLayout title="Hardware Details" subtitle="Complete hardware asset profile">
            <div className="space-y-6">

                {/* ── Header card ── */}
                <div className={`card p-6 border-l-4 border-${meta.color}-500`}>
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                        <div className="flex items-start space-x-4">
                            <div className={`w-16 h-16 bg-${meta.color}-100 text-${meta.color}-600 rounded-2xl flex items-center justify-center flex-shrink-0`}>
                                <i className={`fas ${meta.icon} text-2xl`}></i>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className="font-mono text-sm text-blue-600 font-semibold">{hardware.tag}</span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${statusCls}`}>
                                        {hardware.status}
                                    </span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium bg-${meta.color}-100 text-${meta.color}-700`}>
                                        {hardware.type}
                                    </span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-1.5">{hardware.name}</h2>
                                <p className="text-sm text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                                    <span>
                                        <i className="fas fa-building text-gray-400 mr-1.5"></i>
                                        {hardware.branch} · {hardware.building ?? '-'} · {hardware.room ?? '-'}
                                    </span>
                                    <span><i className="fas fa-hashtag text-gray-400 mr-1.5"></i>{hardware.model}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link href="/hardware" className="btn btn-secondary">
                                <i className="fas fa-arrow-left mr-2"></i>Back
                            </Link>
                            {isAdmin && (
                                <>
                                    <Link href={`/hardware/${hardware.tag}/edit`} className="btn btn-secondary">
                                        <i className="fas fa-pen mr-2"></i>Edit
                                    </Link>
                                    <button onClick={handleDelete} className="btn btn-secondary">
                                        <i className="fas fa-trash mr-2"></i>Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">

                        {/* Asset info */}
                        <div className="card p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-5">
                                <i className="fas fa-info-circle mr-2 text-blue-500"></i>Asset Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                {[
                                    { label: 'Asset Tag',    value: hardware.tag,          mono: true },
                                    { label: 'Serial Number',value: hardware.serial,       mono: true },
                                    { label: 'Asset Name',   value: hardware.name,         mono: false },
                                    { label: 'Hostname',     value: hardware.hostname,     mono: true },
                                    { label: 'Manufacturer', value: hardware.manufacturer, mono: false },
                                    { label: 'Model',        value: hardware.model,        mono: false },
                                    { label: 'Purchase Date',value: fmtDate(hardware.purchase_date), mono: false },
                                    { label: 'Supplier',     value: hardware.supplier,     mono: false },
                                    { label: 'Purchase Cost',value: hardware.purchase_cost ? `₱${parseFloat(hardware.purchase_cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-', mono: false },
                                    { label: 'Invoice #',    value: hardware.invoice,      mono: true },
                                ].map(({ label, value, mono }) => (
                                    <div key={label}>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
                                        <p className={`mt-1 text-sm font-semibold text-gray-900 ${mono ? 'font-mono' : ''}`}>{value ?? '-'}</p>
                                    </div>
                                ))}
                            </div>
                            {hardware.notes && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Description / Notes</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{hardware.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Specs */}
                        <div className="card p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-5">
                                <i className="fas fa-microchip mr-2 text-purple-500"></i>Hardware Specifications
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                {[
                                    { label: 'Processor',        value: hardware.cpu,              icon: 'fa-microchip',    bg: 'bg-purple-100 text-purple-600' },
                                    { label: 'Memory',           value: hardware.ram,              icon: 'fa-memory',       bg: 'bg-blue-100 text-blue-600' },
                                    { label: 'Storage',          value: hardware.storage,          icon: 'fa-hard-drive',   bg: 'bg-teal-100 text-teal-600' },
                                    { label: 'Operating System', value: hardware.operating_system, icon: 'fa-desktop',      bg: 'bg-indigo-100 text-indigo-600' },
                                    { label: 'IP Address',       value: hardware.ip_address,       icon: 'fa-network-wired',bg: 'bg-green-100 text-green-600', mono: true },
                                    { label: 'MAC Address',      value: hardware.mac_address,      icon: 'fa-barcode',      bg: 'bg-amber-100 text-amber-600', mono: true },
                                ].map(({ label, value, icon, bg, mono }) => (
                                    <div key={label} className="flex items-start space-x-3">
                                        <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                            <i className={`fas ${icon} text-sm`}></i>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
                                            <p className={`mt-0.5 text-sm text-gray-900 font-medium ${mono ? 'font-mono' : ''}`}>{value ?? '-'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Right col ── */}
                    <div className="space-y-6">

                        {/* Warranty gauge */}
                        <div className="card p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-5">
                                <i className="fas fa-shield-halved mr-2 text-amber-500"></i>Warranty Status
                            </h3>
                            <div className="text-center mb-5">
                                <div className="relative inline-flex items-center justify-center">
                                    <svg className="w-32 h-32 -rotate-90">
                                        <circle cx="64" cy="64" r="52" stroke="#f3f4f6" strokeWidth="10" fill="none" />
                                        <circle cx="64" cy="64" r="52" stroke={strokeColor} strokeWidth="10" fill="none"
                                            strokeLinecap="round"
                                            strokeDasharray={`${drawn} ${circ}`} />
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="text-2xl font-bold text-gray-900">{wInfo.months}</span>
                                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">remaining</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Start Date</span>
                                    <span className="font-semibold text-gray-900">{fmtDate(hardware.purchase_date)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">End Date</span>
                                    <span className="font-semibold text-gray-900">{fmtDate(hardware.warranty_expiry)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                    <span className="text-gray-600">Status</span>
                                    {wInfo.valid === null
                                        ? <span className="px-2 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-700">N/A</span>
                                        : wInfo.expiring
                                            ? <span className="px-2 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700"><i className="fas fa-clock mr-1"></i>Expiring Soon</span>
                                            : wInfo.valid
                                                ? <span className="px-2 py-1 rounded-md text-xs font-bold bg-green-50 text-green-700"><i className="fas fa-circle-check mr-1"></i>Valid</span>
                                                : <span className="px-2 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700"><i className="fas fa-circle-xmark mr-1"></i>Expired</span>
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Assigned Owner */}
                        <div className="card p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-5">
                                <i className="fas fa-user mr-2 text-indigo-500"></i>Assigned Owner
                            </h3>
                            <div className="flex items-center space-x-4 mb-4">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(hardware.assigned_user ?? 'Unassigned')}&background=6366f1&color=fff&size=96`}
                                    className="w-14 h-14 rounded-xl border-2 border-white shadow"
                                    alt="Assigned user"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-gray-900 truncate">{hardware.assigned_user ?? 'Unassigned'}</p>
                                    <p className="text-xs text-gray-500">{hardware.department ?? 'No department'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Location hierarchy */}
                        <div className="card p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-5">
                                <i className="fas fa-location-dot mr-2 text-red-500"></i>Location Hierarchy
                            </h3>
                            <div className="space-y-1">
                                {[
                                    { label: 'Branch',        value: hardware.branch,    bg: 'bg-amber-50 border-l-amber-500',  icon: 'fa-building text-amber-600',  text: 'text-amber-600',  indent: '' },
                                    { label: 'Building',      value: hardware.building,  bg: 'bg-blue-50 border-l-blue-500',    icon: 'fa-sitemap text-blue-600',    text: 'text-blue-600',   indent: 'ml-4' },
                                    { label: 'Room',          value: hardware.room,      bg: 'bg-purple-50 border-l-purple-500',icon: 'fa-door-open text-purple-600',text: 'text-purple-600', indent: 'ml-8' },
                                    { label: 'Rack Position', value: hardware.rack,      bg: 'bg-gray-50 border-l-gray-400',    icon: 'fa-server text-gray-600',     text: 'text-gray-600',   indent: 'ml-12' },
                                ].map(({ label, value, bg, icon, text, indent }) => (
                                    <div key={label} className={`${indent} flex items-center p-3 ${bg} rounded-lg border-l-4`}>
                                        <i className={`fas ${icon} mr-3`}></i>
                                        <div>
                                            <div className={`text-[10px] font-bold ${text} uppercase tracking-wider`}>{label}</div>
                                            <div className="text-sm font-semibold text-gray-900">{value ?? '-'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Audit */}
                        <div className="card p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Audit</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500">Created</span>
                                    <span className="font-mono text-gray-700 font-medium text-xs">{hardware.created_at}</span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-gray-500">Last Modified</span>
                                    <span className="font-mono text-gray-700 font-medium text-xs">{hardware.updated_at}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
