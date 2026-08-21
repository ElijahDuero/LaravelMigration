import AppLayout from '@/components/AppLayout';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface Branch {
    id: number;
    code: string;
    name: string;
    location: string;
    type: string;
    status: string;
    head: string | null;
    contact: string | null;
    email: string | null;
    employees: number;
    campuses: number;
    established: string | null;
    notes: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}
interface RecentIncident {
    id: number;
    incident_number: string;
    description: string | null;
    severity: string;
    workflow_status: string;
    reported_at: string | null;
}
interface Props {
    branch: Branch;
    securityScore: number | null;
    incidents: number;
    hardware: number;
    software: number;
    systems: number;
    recentIncidents: RecentIncident[];
}

const STATUS_BADGE: Record<string, string> = {
    Active:   'bg-green-100 text-green-700 border border-green-200',
    Planned:  'bg-blue-100 text-blue-700 border border-blue-200',
    Inactive: 'bg-gray-100 text-gray-500 border border-gray-200',
};
const TYPE_BADGE: Record<string, string> = {
    HQ:            'bg-purple-100 text-purple-700',
    Satellite:     'bg-blue-100 text-blue-700',
    Remote:        'bg-amber-100 text-amber-700',
    'Data Center': 'bg-indigo-100 text-indigo-700',
};
const SEV_BADGE: Record<string, string> = {
    Critical: 'bg-red-100 text-red-700 border border-red-200',
    High:     'bg-orange-100 text-orange-700 border border-orange-200',
    Medium:   'bg-amber-100 text-amber-700 border border-amber-200',
    Low:      'bg-green-100 text-green-700 border border-green-200',
};
const STATUS_INC: Record<string, { cls: string; label: string }> = {
    draft:         { cls: 'bg-gray-100 text-gray-700',    label: 'Draft' },
    reported:      { cls: 'bg-purple-100 text-purple-700', label: 'Reported' },
    assigned:      { cls: 'bg-blue-100 text-blue-700',    label: 'Assigned' },
    investigation: { cls: 'bg-indigo-100 text-indigo-700', label: 'Investigating' },
    containment:   { cls: 'bg-amber-100 text-amber-700',  label: 'Containment' },
    eradication:   { cls: 'bg-orange-100 text-orange-700', label: 'Eradication' },
    recovery:      { cls: 'bg-cyan-100 text-cyan-700',    label: 'Recovery' },
    lessons:       { cls: 'bg-yellow-100 text-yellow-700', label: 'Lessons Learned' },
    closed:        { cls: 'bg-green-100 text-green-700',  label: 'Closed' },
};

function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function scoreColor(s: number | null) {
    if (s === null) return 'text-gray-400';
    if (s >= 75) return 'text-green-600'; if (s >= 50) return 'text-amber-600';
    if (s >= 25) return 'text-orange-600'; return 'text-red-600';
}
function scoreBar(s: number | null) {
    if (s === null) return 'bg-gray-200';
    if (s >= 75) return 'bg-green-500'; if (s >= 50) return 'bg-amber-500';
    if (s >= 25) return 'bg-orange-500'; return 'bg-red-500';
}
function scoreLabel(s: number | null) {
    if (s === null) return 'No data';
    if (s >= 80) return 'Good'; if (s >= 60) return 'Fair';
    if (s >= 40) return 'At Risk'; return 'Critical';
}

export default function BranchView({ branch, securityScore, incidents, hardware, software, systems, recentIncidents }: Props) {
    const flash = (usePage<any>().props.flash ?? {}) as { success?: string };
    const [showDelete, setShowDelete] = useState(false);

    function handleDelete() {
        router.delete(`/branches/${branch.id}`, {
            onSuccess: () => setShowDelete(false),
        });
    }

    return (
        <AppLayout title={branch.name} subtitle={`${branch.code} · ${branch.type}`}>
            <div className="max-w-5xl mx-auto space-y-6">

                {flash.success && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-800 text-sm">
                        <i className="fas fa-circle-check text-green-500"></i>{flash.success}
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/branches" className="btn btn-secondary text-sm py-2">
                            <i className="fas fa-arrow-left mr-1.5"></i>Back
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                <i className="fas fa-building"></i>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">{branch.name}</h2>
                                <p className="text-xs text-gray-500">
                                    <span className="font-mono font-semibold">{branch.code}</span>
                                    &nbsp;·&nbsp;
                                    <i className="fas fa-location-dot mr-1 text-[10px]"></i>{branch.location}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[branch.status] ?? 'bg-gray-100 text-gray-500'}`}>
                            {branch.status}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${TYPE_BADGE[branch.type] ?? 'bg-gray-100 text-gray-600'}`}>
                            {branch.type}
                        </span>
                        <Link href={`/branches/${branch.id}/edit`} className="btn btn-primary text-sm py-2">
                            <i className="fas fa-pen mr-1.5"></i>Edit
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* ── Left: details ─────────────────────────────── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Quick stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { label: 'Incidents', value: incidents, icon: 'fa-triangle-exclamation', color: incidents > 0 ? 'red' : 'gray' },
                                { label: 'Hardware',  value: hardware,  icon: 'fa-microchip',            color: 'cyan' },
                                { label: 'Software',  value: software,  icon: 'fa-box',                  color: 'indigo' },
                                { label: 'Systems',   value: systems,   icon: 'fa-layer-group',          color: 'blue' },
                            ].map((s) => (
                                <div key={s.label} className="card p-4 text-center">
                                    <div className={`w-8 h-8 rounded-lg bg-${s.color}-50 text-${s.color}-500 flex items-center justify-center mx-auto mb-2`}>
                                        <i className={`fas ${s.icon} text-xs`}></i>
                                    </div>
                                    <p className="text-xl font-black text-gray-900">{s.value}</p>
                                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Branch details */}
                        <div className="card p-6">
                            <h3 className="text-base font-semibold text-gray-900 mb-5 flex items-center">
                                <i className="fas fa-building mr-2 text-blue-500"></i>Branch Details
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {[
                                    { label: 'Branch Code',  value: branch.code },
                                    { label: 'Type',         value: branch.type },
                                    { label: 'Location',     value: branch.location },
                                    { label: 'Established',  value: fmtDate(branch.established) },
                                    { label: 'Employees',    value: branch.employees.toLocaleString() },
                                    { label: 'Campuses',     value: String(branch.campuses) },
                                    { label: 'Branch Head',  value: branch.head || '—' },
                                    { label: 'Contact',      value: branch.contact || '—' },
                                    { label: 'Email',        value: branch.email || '—' },
                                ].map(({ label, value }) => (
                                    <div key={label}>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                                        <p className="text-sm text-gray-800 font-medium break-all">{value}</p>
                                    </div>
                                ))}
                                {branch.notes && (
                                    <div className="sm:col-span-2">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                                        <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 whitespace-pre-wrap">{branch.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent incidents */}
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                                    <i className="fas fa-triangle-exclamation mr-2 text-red-500"></i>Recent Incidents
                                </h3>
                                <Link href={`/incidents?branch=${encodeURIComponent(branch.name)}`}
                                    className="text-xs text-blue-600 hover:underline font-semibold">View all</Link>
                            </div>
                            {recentIncidents.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-6 italic">No incidents recorded for this branch.</p>
                            ) : (
                                <div className="space-y-2">
                                    {recentIncidents.map((inc) => {
                                        const sev = SEV_BADGE[inc.severity] ?? 'bg-gray-100 text-gray-600';
                                        const sts = STATUS_INC[inc.workflow_status] ?? { cls: 'bg-gray-100 text-gray-700', label: inc.workflow_status };
                                        const title = inc.description
                                            ? (inc.description.length > 60 ? inc.description.slice(0, 57) + '…' : inc.description)
                                            : 'Untitled';
                                        return (
                                            <Link key={inc.id} href={`/incidents/${inc.incident_number}`}
                                                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition group">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700">{title}</p>
                                                    <p className="text-xs font-mono text-gray-500">{inc.incident_number}</p>
                                                </div>
                                                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${sev}`}>{inc.severity}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sts.cls}`}>{sts.label}</span>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Right: sidebar ────────────────────────────── */}
                    <div className="space-y-6">

                        {/* Security score */}
                        <div className="card p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                                <i className="fas fa-shield-halved mr-2 text-green-500"></i>Security Score
                            </h3>
                            {securityScore !== null ? (
                                <div className="text-center">
                                    <p className={`text-4xl font-black mb-1 ${scoreColor(securityScore)}`}>{securityScore}<span className="text-xl font-normal text-gray-400">/100</span></p>
                                    <p className={`text-sm font-semibold mb-3 ${scoreColor(securityScore)}`}>{scoreLabel(securityScore)}</p>
                                    <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                                        <div className={`h-full rounded-full ${scoreBar(securityScore)} transition-all duration-700`}
                                            style={{ width: `${securityScore}%` }} />
                                    </div>
                                    <Link href="/branch-security" className="mt-3 inline-block text-xs text-blue-600 hover:underline font-semibold">
                                        View Branch Security →
                                    </Link>
                                </div>
                            ) : (
                                <div className="text-center text-gray-400 py-4">
                                    <i className="fas fa-shield-halved text-3xl mb-2 block"></i>
                                    <p className="text-sm">No security data yet.</p>
                                    <Link href="/branch-security" className="mt-2 inline-block text-xs text-blue-600 hover:underline font-semibold">
                                        Configure Branch Security →
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Record info */}
                        <div className="card p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                                <i className="fas fa-circle-info mr-2 text-blue-400"></i>Record Info
                            </h3>
                            <div className="space-y-3 text-sm">
                                {[
                                    { label: 'Created By', value: branch.created_by || '—' },
                                    { label: 'Created At', value: fmtDate(branch.created_at) },
                                    { label: 'Updated At', value: fmtDate(branch.updated_at) },
                                ].map(({ label, value }) => (
                                    <div key={label}>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
                                        <p className="text-gray-800 font-medium">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="card p-6 border border-red-100">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                                <i className="fas fa-gear mr-2 text-gray-400"></i>Actions
                            </h3>
                            <div className="space-y-2">
                                <Link href={`/branches/${branch.id}/edit`} className="btn btn-primary w-full text-sm justify-center">
                                    <i className="fas fa-pen mr-1.5"></i>Edit Branch
                                </Link>
                                <button onClick={() => setShowDelete(true)}
                                    className="btn btn-secondary w-full text-sm justify-center text-red-600 hover:bg-red-50 hover:border-red-200">
                                    <i className="fas fa-trash mr-1.5"></i>Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete modal */}
            {showDelete && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <i className="fas fa-trash text-red-600"></i>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Delete Branch?</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Permanently delete <strong>{branch.name}</strong> ({branch.code})? This cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button onClick={() => setShowDelete(false)} className="btn btn-secondary">Cancel</button>
                            <button onClick={handleDelete} className="btn bg-red-600 text-white hover:bg-red-700 border border-red-700">
                                <i className="fas fa-trash mr-1.5"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
