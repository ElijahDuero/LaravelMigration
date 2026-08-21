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
    description: string | null;
    first_seen: string | null;
    last_seen: string | null;
    expiry_date: string | null;
    misp_event: string | null;
    vt_permalink: string | null;
    abuse_report: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    indicator: Indicator;
}

const TYPE_META: Record<string, { icon: string; color: string }> = {
    'Phishing Domain': { icon: 'fa-fish-fins',     color: 'purple' },
    'Malicious IP':    { icon: 'fa-network-wired', color: 'red' },
    'Blocked IP':      { icon: 'fa-ban',           color: 'orange' },
    'IOC':             { icon: 'fa-crosshairs',    color: 'rose' },
    'Malware Hash':    { icon: 'fa-bug',           color: 'amber' },
    'Suspicious URL':  { icon: 'fa-link-slash',    color: 'yellow' },
};

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

function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-sm text-gray-800 font-medium break-all">{value || '—'}</p>
        </div>
    );
}

export default function ThreatIntelView({ indicator }: Props) {
    const { auth } = usePage<any>().props;
    const flash     = usePage<any>().props.flash as { success?: string } | undefined;
    const isAdmin   = ['super_admin', 'admin', 'cyber_security'].includes(auth.user?.role ?? '');
    const meta      = TYPE_META[indicator.type] ?? { icon: 'fa-shield-halved', color: 'gray' };

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    function handleDelete() {
        router.delete(`/threat-intel/${indicator.id}`, {
            onSuccess: () => setShowDeleteModal(false),
        });
    }

    const sevCls  = SEV_BADGE[indicator.severity]           ?? 'bg-gray-100 text-gray-600';
    const stsCls  = STATUS_BADGE[indicator.status]          ?? 'bg-gray-100 text-gray-600';
    const confCls = CONF_BADGE[indicator.confidence ?? '']  ?? 'bg-gray-100 text-gray-600';
    const hasFeedData = indicator.misp_event || indicator.vt_permalink || indicator.abuse_report;

    return (
        <AppLayout title={`Indicator — ${indicator.ioc_id}`} subtitle={indicator.value}>
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Flash success */}
                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-800 text-sm">
                        <i className="fas fa-circle-check text-green-500"></i>
                        {flash.success}
                    </div>
                )}

                {/* Header bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/threat-intel" className="btn btn-secondary text-sm py-2">
                            <i className="fas fa-arrow-left mr-1.5"></i>Back
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 bg-${meta.color}-100 text-${meta.color}-600 rounded-xl flex items-center justify-center`}>
                                <i className={`fas ${meta.icon}`}></i>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 font-mono">{indicator.value}</h2>
                                <p className="text-xs text-gray-500">{indicator.ioc_id} &bull; {indicator.type}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${sevCls}`}>
                            {indicator.severity}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${stsCls}`}>
                            {indicator.status}
                        </span>
                        {isAdmin && (
                            <Link href={`/threat-intel/${indicator.id}/edit`} className="btn btn-primary text-sm py-2">
                                <i className="fas fa-pen mr-1.5"></i>Edit
                            </Link>
                        )}
                    </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Left: Main content ─────────────────────────── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Indicator Details */}
                        <div className="card p-6">
                            <h3 className="text-base font-semibold text-gray-900 mb-5 flex items-center">
                                <i className="fas fa-crosshairs mr-2 text-red-500"></i>Indicator Details
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <DetailRow label="IOC ID" value={indicator.ioc_id} />
                                <DetailRow label="Type"   value={indicator.type} />

                                {/* Value — full-width monospaced block */}
                                <div className="sm:col-span-2">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Value</p>
                                    <p className="text-sm font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 break-all text-gray-900">
                                        {indicator.value}
                                    </p>
                                </div>

                                {/* Severity badge */}
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Severity</p>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${sevCls}`}>
                                        {indicator.severity}
                                    </span>
                                </div>

                                {/* Confidence badge */}
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Confidence</p>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${confCls}`}>
                                        {indicator.confidence ?? '—'}
                                    </span>
                                </div>

                                <DetailRow label="Source" value={indicator.source ?? '—'} />
                                <DetailRow label="Tags"   value={indicator.tags   ?? '—'} />

                                {indicator.description && (
                                    <div className="sm:col-span-2">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Description</p>
                                        <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 whitespace-pre-wrap">
                                            {indicator.description}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="card p-6">
                            <h3 className="text-base font-semibold text-gray-900 mb-5 flex items-center">
                                <i className="fas fa-calendar-days mr-2 text-blue-500"></i>Timeline
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <DetailRow label="First Seen"   value={fmtDate(indicator.first_seen)} />
                                <DetailRow label="Last Seen"    value={fmtDate(indicator.last_seen)} />
                                <DetailRow label="Expiry Date"  value={fmtDate(indicator.expiry_date)} />
                            </div>
                        </div>

                        {/* External Feed References */}
                        <div className="card p-6">
                            <h3 className="text-base font-semibold text-gray-900 mb-5 flex items-center">
                                <i className="fas fa-plug-circle-bolt mr-2 text-indigo-500"></i>External Feed References
                            </h3>
                            {hasFeedData ? (
                                <div className="space-y-3">
                                    {indicator.misp_event && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 text-xs">
                                                <i className="fas fa-link"></i>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">MISP Event</p>
                                                <p className="text-sm font-mono text-gray-800 truncate">{indicator.misp_event}</p>
                                            </div>
                                        </div>
                                    )}
                                    {indicator.vt_permalink && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 text-xs">
                                                <i className="fas fa-virus-slash"></i>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">VirusTotal</p>
                                                <a
                                                    href={indicator.vt_permalink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:underline font-mono truncate block"
                                                >
                                                    {indicator.vt_permalink}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    {indicator.abuse_report && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 text-xs">
                                                <i className="fas fa-shield-halved"></i>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">AbuseIPDB</p>
                                                <a
                                                    href={indicator.abuse_report}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:underline font-mono truncate block"
                                                >
                                                    {indicator.abuse_report}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No external feed references recorded.</p>
                            )}
                        </div>

                    </div>

                    {/* ── Right: Sidebar meta ────────────────────────── */}
                    <div className="space-y-6">

                        {/* Record Info */}
                        <div className="card p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                                <i className="fas fa-circle-info mr-2 text-blue-400"></i>Record Info
                            </h3>
                            <div className="space-y-4 text-sm">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Created By</p>
                                    <p className="text-gray-800 font-medium">{indicator.created_by ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Created At</p>
                                    <p className="text-gray-700">{fmtDate(indicator.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Last Updated</p>
                                    <p className="text-gray-700">{fmtDate(indicator.updated_at)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        {isAdmin && (
                            <div className="card p-6 border border-red-100">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                                    <i className="fas fa-gear mr-2 text-gray-400"></i>Actions
                                </h3>
                                <div className="space-y-2">
                                    <Link
                                        href={`/threat-intel/${indicator.id}/edit`}
                                        className="btn btn-primary w-full text-sm justify-center"
                                    >
                                        <i className="fas fa-pen mr-1.5"></i>Edit Indicator
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteModal(true)}
                                        className="btn btn-secondary w-full text-sm justify-center text-red-600 hover:bg-red-50 hover:border-red-200"
                                    >
                                        <i className="fas fa-trash mr-1.5"></i>Delete
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* ── Delete confirm modal ───────────────────────────────── */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <i className="fas fa-trash text-red-600"></i>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Delete Indicator?</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            You are about to permanently delete{' '}
                            <strong className="font-mono">{indicator.value}</strong> ({indicator.ioc_id}).
                            This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="btn bg-red-600 text-white hover:bg-red-700 border border-red-700"
                            >
                                <i className="fas fa-trash mr-1.5"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
