import AppLayout from '@/components/AppLayout';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface WorkflowStep {
    key: string;
    name: string;
    status: 'completed' | 'current' | 'pending';
    by: string | null;
    time: string | null;
    notes: string | null;
}

interface Attachment {
    id: number;
    name: string;
    type: string;
    size: string;
    by: string;
    time: string | null;
}

interface ActivityEntry {
    user: string;
    action: string;
    time: string;
    status: string;
}

interface Incident {
    id: number;
    incident_number: string;
    workflow_status: string;
    severity: string;
    category: string;
    branch: string;
    campus: string;
    department: string;
    incident_at: string;
    reported_at: string | null;
    created_at: string;
    updated_at: string;
    reporter_name: string;
    contact_number: string;
    description: string;
    systems_affected: string | null;
    users_affected: number;
    ip_address: string | null;
    hostname: string | null;
    device: string | null;
    operating_system: string | null;
    browser: string | null;
    assigned_to: string | null;
    created_by: string | null;
}

interface Props {
    incident: Incident;
    workflow: WorkflowStep[];
    workflowCurrentStep: number;
    workflowCurrentPct: number;
    workflowCurrentLabel: string;
    workflowCurrentColor: string;
    attachments: Attachment[];
    activity: ActivityEntry[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const severityBg: Record<string, string> = {
    Critical: 'bg-red-50 text-red-700 border border-red-200',
    High:     'bg-orange-50 text-orange-700 border border-orange-200',
    Medium:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
    Low:      'bg-green-50 text-green-700 border border-green-200',
};
const severityIcon: Record<string, string> = {
    Critical: 'fa-skull-crossbones', High: 'fa-arrow-up', Medium: 'fa-minus', Low: 'fa-arrow-down',
};
const statusBg: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700', reported: 'bg-purple-100 text-purple-700',
    assigned: 'bg-blue-100 text-blue-700', investigation: 'bg-indigo-100 text-indigo-700',
    containment: 'bg-amber-100 text-amber-700', eradication: 'bg-orange-100 text-orange-700',
    recovery: 'bg-cyan-100 text-cyan-700', lessons: 'bg-yellow-100 text-yellow-700',
    closed: 'bg-green-100 text-green-700',
};
const stepColors: Record<string, string> = {
    reported: 'blue', assigned: 'blue', investigation: 'indigo', containment: 'amber',
    eradication: 'orange', recovery: 'cyan', lessons: 'yellow', closed: 'green',
};
const activityColors: Record<string, string> = {
    reported: 'bg-purple-100 text-purple-700', assigned: 'bg-blue-100 text-blue-700',
    investigation: 'bg-indigo-100 text-indigo-700', containment: 'bg-amber-100 text-amber-700',
    eradication: 'bg-orange-100 text-orange-700', recovery: 'bg-cyan-100 text-cyan-700',
    lessons: 'bg-yellow-100 text-yellow-700', closed: 'bg-green-100 text-green-700',
    draft: 'bg-gray-100 text-gray-700',
};
const fileIcons: Record<string, [string, string]> = {
    pdf: ['fa-file-pdf', 'text-red-500'], png: ['fa-file-image', 'text-purple-500'],
    jpg: ['fa-file-image', 'text-purple-500'], csv: ['fa-file-csv', 'text-green-500'],
    log: ['fa-file-lines', 'text-gray-500'], zip: ['fa-file-zipper', 'text-yellow-600'],
    doc: ['fa-file-word', 'text-blue-600'], docx: ['fa-file-word', 'text-blue-600'],
};

const borderColor: Record<string, string> = {
    Critical: 'border-l-red-500', High: 'border-l-orange-500',
    Medium: 'border-l-yellow-500', Low: 'border-l-green-500',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function IncidentsView({
    incident, workflow, workflowCurrentStep, workflowCurrentPct,
    workflowCurrentLabel, workflowCurrentColor, attachments, activity,
}: Props) {
    const { auth } = usePage<any>().props;
    const isAdmin   = ['super_admin', 'admin'].includes(auth.user?.role ?? '');

    function advanceStatus(notes?: string) {
        router.post(`/incidents/${incident.incident_number}/advance`, { notes: notes ?? '' });
    }

    function addComment(notes: string) {
        router.post(`/incidents/${incident.incident_number}/comment`, { notes });
    }

    return (
        <AppLayout title="Incident Details" subtitle="Incident Overview">
            <div className="space-y-6">

                {/* ── Header card ── */}
                <div className={`card p-5 border-l-4 ${borderColor[incident.severity] ?? 'border-l-blue-500'}`}>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                        <div className="flex items-start space-x-4">
                            <div className={`w-14 h-14 ${severityBg[incident.severity] ?? 'bg-gray-50 text-gray-600'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                <i className={`fas ${severityIcon[incident.severity] ?? 'fa-triangle-exclamation'} text-xl`}></i>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className="font-mono text-sm text-blue-600 font-semibold">{incident.incident_number}</span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${severityBg[incident.severity]}`}>
                                        <i className={`fas ${severityIcon[incident.severity]} mr-1.5 text-[10px]`}></i>
                                        {incident.severity}
                                    </span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium inline-flex items-center ${statusBg[incident.workflow_status] ?? 'bg-gray-100 text-gray-700'}`}>
                                        {incident.workflow_status !== 'closed' && (
                                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5 animate-pulse"></span>
                                        )}
                                        {workflowCurrentLabel}
                                    </span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-1.5 line-clamp-2">
                                    {incident.description?.slice(0, 92) ?? 'Incident details'}
                                    {(incident.description?.length ?? 0) > 92 && '…'}
                                </h2>
                                <p className="text-sm text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                                    <span>
                                        <i className="fas fa-building mr-1.5 text-gray-400"></i>
                                        {incident.branch} · {incident.campus} · {incident.department}
                                    </span>
                                    <span><i className="fas fa-tag mr-1.5 text-gray-400"></i>{incident.category}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link href="/incidents" className="btn btn-secondary">
                                <i className="fas fa-arrow-left mr-2"></i>Back
                            </Link>
                            {isAdmin && (
                                <>
                                    <Link href={`/incidents/${incident.incident_number}/edit`} className="btn btn-secondary">
                                        <i className="fas fa-pen mr-2"></i>Edit
                                    </Link>
                                    {incident.workflow_status !== 'closed' && (
                                        <button onClick={() => advanceStatus()} className="btn btn-primary">
                                            <i className="fas fa-forward mr-2"></i>Advance Status
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Left col ── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Workflow timeline */}
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <i className="fas fa-diagram-project text-blue-500 mr-3"></i>
                                        Incident Workflow Timeline
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">8-step response process with timestamped actions</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Current Step</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        Step {workflowCurrentStep} of 8 ·{' '}
                                        <span className={workflowCurrentColor}>
                                            {workflowCurrentLabel}{workflowCurrentStep > 0 && ` · ${workflowCurrentPct}% complete`}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute left-5 top-4 bottom-4 w-1 bg-gray-100 rounded-full"></div>
                                <div className="space-y-1">
                                    {workflow.map((step, idx) => (
                                        <WorkflowStep
                                            key={step.key}
                                            step={step}
                                            idx={idx}
                                            isAdmin={isAdmin}
                                            incidentNumber={incident.incident_number}
                                            onAdvance={advanceStatus}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="card p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <i className="fas fa-file-lines text-purple-500 mr-3"></i>
                                Incident Description
                            </h3>
                            <p className="text-gray-700 leading-relaxed bg-gray-50/70 rounded-xl p-5 border border-gray-100 text-[15px]">
                                {incident.description}
                            </p>
                        </div>

                        {/* Attachments */}
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <i className="fas fa-paperclip text-green-500 mr-3"></i>
                                    Evidence &amp; Attachments
                                    <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {attachments.length} files
                                    </span>
                                </h3>
                                {isAdmin && (
                                    <label className="btn btn-secondary text-sm py-2 cursor-pointer">
                                        <i className="fas fa-upload mr-2"></i>Upload More
                                        <input
                                            type="file"
                                            className="hidden"
                                            multiple
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files ?? []);
                                                if (files.length > 0) {
                                                    const formData = new FormData();
                                                    files.forEach((f) => formData.append('additional_files[]', f));
                                                    router.post(`/incidents/${incident.incident_number}/upload`, formData as any);
                                                }
                                            }}
                                        />
                                    </label>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {attachments.map((f) => {
                                    const [ico, col] = fileIcons[f.type] ?? ['fa-file', 'text-gray-500'];
                                    return (
                                        <div key={f.id} className="group flex items-center p-3.5 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/20 transition cursor-pointer">
                                            <div className="w-11 h-11 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-white transition">
                                                <i className={`fas ${ico} ${col} text-lg`}></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition">{f.name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {f.type.toUpperCase()} · {f.size} · by {f.by}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition">
                                                <a
                                                    href={`/incidents/attachments/${f.id}/download`}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                                    title="Download"
                                                >
                                                    <i className="fas fa-download text-xs"></i>
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                                {attachments.length === 0 && (
                                    <p className="text-sm text-gray-400 col-span-2 py-4 text-center">No attachments yet.</p>
                                )}
                            </div>
                        </div>

                        {/* Activity log */}
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <i className="fas fa-clock-rotate-left text-indigo-500 mr-3"></i>
                                    Activity Log
                                </h3>
                                <span className="text-xs text-gray-500">Live updates</span>
                            </div>
                            <div className="space-y-3">
                                {activity.map((a, i) => (
                                    <div key={i} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 transition">
                                        <div className={`w-8 h-8 ${activityColors[a.status] ?? 'bg-gray-100 text-gray-700'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                            <i className="fas fa-clock-rotate-left text-xs"></i>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-800">
                                                <span className="font-semibold text-gray-900">{a.user}</span>{' '}
                                                {a.action}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                <i className="far fa-clock mr-1"></i>{a.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {activity.length === 0 && (
                                    <p className="text-sm text-gray-400 text-center py-4">No activity yet.</p>
                                )}
                            </div>

                            {isAdmin && (
                                <CommentBox
                                    incidentNumber={incident.incident_number}
                                    userName={auth.user?.name ?? 'User'}
                                    onSubmit={addComment}
                                />
                            )}
                        </div>
                    </div>

                    {/* ── Right col ── */}
                    <div className="space-y-6">
                        {/* Incident info */}
                        <div className="card p-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Incident Information</h3>
                            <dl className="space-y-4">
                                {[
                                    { label: 'Incident Number', value: incident.incident_number, icon: 'fa-hashtag', cls: 'text-blue-600 font-mono text-sm font-semibold' },
                                    { label: 'Date of Incident', value: incident.incident_at, icon: 'fa-calendar', cls: 'text-sm' },
                                    { label: 'Date Reported', value: incident.reported_at ?? incident.created_at, icon: 'fa-bell', cls: 'text-sm' },
                                    { label: 'Branch / Campus', value: `${incident.branch} · ${incident.campus}`, icon: 'fa-building', cls: 'text-sm' },
                                    { label: 'Department', value: incident.department, icon: 'fa-sitemap', cls: 'text-sm' },
                                    { label: 'Category', value: incident.category, icon: 'fa-tag', cls: 'text-sm' },
                                    { label: 'Assigned To', value: incident.assigned_to ?? 'Not assigned', icon: 'fa-user-shield', cls: 'text-sm' },
                                    { label: 'Users Affected', value: `${incident.users_affected} users`, icon: 'fa-users', cls: 'text-sm' },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-start">
                                        <div className="w-8 flex-shrink-0 pt-0.5">
                                            <i className={`fas ${item.icon} text-gray-400 text-sm`}></i>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <dt className="text-xs text-gray-500 mb-0.5">{item.label}</dt>
                                            <dd className={`text-gray-900 ${item.cls} font-medium break-words`}>{item.value}</dd>
                                        </div>
                                    </div>
                                ))}
                            </dl>
                        </div>

                        {/* Reporter */}
                        <div className="card p-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Reporter</h3>
                            <div className="flex items-center space-x-3 mb-4">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(incident.reporter_name)}&background=8b5cf6&color=fff`}
                                    alt="Reporter"
                                    className="w-12 h-12 rounded-xl"
                                />
                                <div>
                                    <p className="font-semibold text-gray-900">{incident.reporter_name}</p>
                                    <p className="text-xs text-gray-500">{incident.department}</p>
                                </div>
                            </div>
                            <div className="space-y-2.5 text-sm">
                                <div className="flex items-center text-gray-600">
                                    <i className="fas fa-phone w-5 text-gray-400"></i>
                                    <span className="ml-2">{incident.contact_number}</span>
                                </div>
                            </div>
                        </div>

                        {/* System details */}
                        <div className="card p-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Affected System Details</h3>
                            <dl className="space-y-3.5 text-sm">
                                {[
                                    { label: 'IP Address', value: incident.ip_address ?? 'Not recorded', icon: 'fa-network-wired', cls: 'font-mono font-semibold text-gray-900' },
                                    { label: 'Hostname', value: incident.hostname ?? 'Not recorded', icon: 'fa-server', cls: 'font-mono font-semibold text-gray-900' },
                                    { label: 'Device', value: incident.device ?? 'Not recorded', icon: 'fa-laptop', cls: 'font-medium text-gray-900' },
                                    { label: 'OS', value: incident.operating_system ?? 'Not recorded', icon: 'fa-desktop', cls: 'font-medium text-gray-900' },
                                    { label: 'Browser', value: incident.browser ?? 'Not recorded', icon: 'fa-globe', cls: 'font-medium text-gray-900' },
                                ].map((item, i, arr) => (
                                    <div key={item.label} className={`flex justify-between items-center py-1.5 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                        <dt className="text-gray-500 flex items-center">
                                            <i className={`fas ${item.icon} mr-2 text-xs text-gray-400`}></i>
                                            {item.label}
                                        </dt>
                                        <dd className={item.cls}>{item.value}</dd>
                                    </div>
                                ))}
                            </dl>
                            {incident.systems_affected && (
                                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start">
                                    <i className="fas fa-circle-exclamation text-amber-600 mr-2 mt-0.5 flex-shrink-0"></i>
                                    <span><strong>Systems Affected:</strong> {incident.systems_affected}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function WorkflowStep({
    step, idx, isAdmin, incidentNumber, onAdvance,
}: {
    step: WorkflowStep;
    idx: number;
    isAdmin: boolean;
    incidentNumber: string;
    onAdvance: (notes?: string) => void;
}) {
    const color   = stepColors[step.key] ?? 'gray';
    const opacity = step.status === 'pending' ? 'opacity-50' : '';

    const dotClass = {
        completed: `bg-${color}-500 border-${color}-500`,
        current:   `bg-white border-${color}-500 ring-4 ring-${color}-100`,
        pending:   'bg-white border-gray-300',
    }[step.status];

    return (
        <div className={`relative pl-14 pb-7 last:pb-0 ${opacity}`}>
            <div className={`absolute left-0 w-11 h-11 rounded-full flex items-center justify-center border-2 ${dotClass} z-10 bg-white`}>
                <div className={`w-6 h-6 rounded-full bg-${color}-100 text-${color}-700 border border-${color}-200 flex items-center justify-center`}>
                    {step.status === 'completed'
                        ? <i className="fas fa-check text-xs font-bold"></i>
                        : <span className="text-[11px] font-bold">{idx + 1}</span>
                    }
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <div>
                        <h4 className="font-semibold text-gray-900 flex items-center">
                            {step.name}
                            {step.status === 'current' && (
                                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 inline-flex items-center">
                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1 animate-pulse"></span>
                                    In Progress
                                </span>
                            )}
                        </h4>
                        {step.by && <p className="text-xs text-gray-500 mt-0.5"><i className="fas fa-user mr-1"></i>{step.by}</p>}
                    </div>
                    {step.time
                        ? <p className="text-xs text-gray-400 font-mono whitespace-nowrap"><i className="far fa-clock mr-1"></i>{step.time}</p>
                        : <p className="text-xs text-gray-400 italic">Not started</p>
                    }
                </div>

                {step.notes && (
                    <p className={`text-sm text-gray-600 leading-relaxed bg-gray-50/70 rounded-lg p-3 mt-2 border-l-2 border-${stepColors[step.key] ?? 'gray'}-300`}>
                        {step.notes}
                    </p>
                )}

                {step.status === 'current' && isAdmin && (
                    <AdvanceForm onSubmit={onAdvance} />
                )}
            </div>
        </div>
    );
}

function AdvanceForm({ onSubmit }: { onSubmit: (notes: string) => void }) {
    const [notes, setNotes] = useState('');

    return (
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
            <input
                type="text"
                className="form-input flex-1 text-sm"
                placeholder="Add notes for this step..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
            />
            <button
                type="button"
                onClick={() => onSubmit(notes)}
                className="btn btn-primary text-sm py-2"
            >
                <i className="fas fa-check mr-1.5"></i>Mark Complete
            </button>
        </div>
    );
}

function CommentBox({ incidentNumber, userName, onSubmit }: {
    incidentNumber: string;
    userName: string;
    onSubmit: (notes: string) => void;
}) {
    const [notes, setNotes] = useState('');

    return (
        <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-start space-x-3">
                <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=fff`}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                    alt="You"
                />
                <div className="flex-1">
                    <textarea
                        rows={2}
                        className="form-input text-sm w-full"
                        placeholder="Add a comment or action note..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                    <div className="flex items-center justify-end mt-2">
                        <button
                            type="button"
                            onClick={() => { if (notes.trim()) { onSubmit(notes); setNotes(''); } }}
                            className="btn btn-primary text-sm py-2"
                        >
                            <i className="fas fa-paper-plane mr-1.5"></i>Post
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


