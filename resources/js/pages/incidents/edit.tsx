import AppLayout from '@/components/AppLayout';
import { Link, useForm } from '@inertiajs/react';

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
    created_by: string | null;
}

interface Attachment {
    id: number;
    name: string;
    type: string;
    size: string;
    by: string;
}

interface Props {
    incident: Incident;
    attachments: Attachment[];
    branches: string[];
}

const CATEGORIES = [
    { group: 'Malware',               items: ['Malware Infection', 'Ransomware', 'Virus'] },
    { group: 'Social Engineering',    items: ['Phishing', 'Business Email Compromise', 'Social Engineering'] },
    { group: 'Unauthorized Activity', items: ['Unauthorized Access', 'Insider Threat', 'Website Defacement'] },
    { group: 'Asset Loss',            items: ['Lost Laptop', 'Lost Mobile Device'] },
    { group: 'Data & Network',        items: ['Data Leak', 'Network Outage', 'Denial of Service'] },
    { group: 'Other',                 items: ['Physical Security Incident', 'Policy Violation', 'Others'] },
];
const CAMPUSES    = ['Campus 1 - Manila', 'Campus 2 - Cebu', 'Campus 3 - Davao', 'Campus 4 - Iloilo'];
const DEPARTMENTS = ['Information Technology', 'Human Resources', 'Finance', 'Operations', 'Marketing', 'Legal', 'Customer Service'];
const DEVICES     = ['Desktop', 'Laptop', 'Server', 'Mobile Phone', 'Tablet', 'Network Device', 'Printer', 'Other'];
const OSS         = ['Windows 11', 'Windows 10', 'Windows Server 2022', 'Windows Server 2019', 'macOS Sonoma', 'macOS Ventura', 'Linux - Ubuntu', 'Linux - CentOS', 'iOS', 'Android', 'Other'];
const BROWSERS    = ['Chrome', 'Firefox', 'Edge', 'Safari', 'Opera', 'Not Applicable'];

const SEVERITY_OPTIONS = [
    { value: 'Low',      color: 'green',  icon: 'fa-arrow-down' },
    { value: 'Medium',   color: 'yellow', icon: 'fa-minus' },
    { value: 'High',     color: 'orange', icon: 'fa-arrow-up' },
    { value: 'Critical', color: 'red',    icon: 'fa-skull-crossbones' },
];

const STATUS_LABELS: Record<string, string> = {
    draft: 'Draft', reported: 'Reported', assigned: 'Assigned',
    investigation: 'Under Investigation', containment: 'Containment',
    eradication: 'Eradication', recovery: 'Recovery',
    lessons: 'Lessons Learned', closed: 'Closed',
};

const fileIcons: Record<string, [string, string]> = {
    pdf: ['fa-file-pdf', 'text-red-500'], png: ['fa-file-image', 'text-purple-500'],
    jpg: ['fa-file-image', 'text-purple-500'], csv: ['fa-file-csv', 'text-green-500'],
    log: ['fa-file-lines', 'text-gray-500'], zip: ['fa-file-zipper', 'text-yellow-600'],
    doc: ['fa-file-word', 'text-blue-600'], docx: ['fa-file-word', 'text-blue-600'],
};

export default function IncidentsEdit({ incident, attachments, branches }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        incident_at:      incident.incident_at?.slice(0, 16) ?? '',
        branch:           incident.branch ?? '',
        campus:           incident.campus ?? '',
        department:       incident.department ?? '',
        reporter_name:    incident.reporter_name ?? '',
        contact_number:   incident.contact_number ?? '',
        category:         incident.category ?? '',
        severity:         incident.severity ?? 'High',
        systems_affected: incident.systems_affected ?? '',
        users_affected:   incident.users_affected?.toString() ?? '0',
        description:      incident.description ?? '',
        ip_address:       incident.ip_address ?? '',
        hostname:         incident.hostname ?? '',
        device:           incident.device ?? '',
        operating_system: incident.operating_system ?? '',
        browser:          incident.browser ?? '',
        screenshots:      [] as File[],
        evidence:         [] as File[],
        logs:             [] as File[],
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(`/incidents/${incident.incident_number}`, { forceFormData: true });
    }

    return (
        <AppLayout title="Edit Incident" subtitle="Update incident report details">
            <form onSubmit={submit} className="space-y-6 pb-6">

                {/* ── Header ── */}
                <div className="card p-5 border-l-4 border-l-indigo-500">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <Link href={`/incidents/${incident.incident_number}`} className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                                <i className="fas fa-arrow-left text-gray-600"></i>
                            </Link>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                                    Edit Incident
                                    <span className="ml-3 font-mono text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-semibold">
                                        {incident.incident_number}
                                    </span>
                                </h2>
                                <p className="text-sm text-gray-500 mt-0.5 flex items-center">
                                    <i className="fas fa-circle-info mr-1.5 text-gray-400 text-xs"></i>
                                    {incident.updated_at && incident.updated_at !== incident.created_at
                                        ? `Last updated ${incident.updated_at} by ${incident.created_by}`
                                        : `Created ${incident.created_at} by ${incident.created_by}`
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Link href={`/incidents/${incident.incident_number}`} className="btn btn-secondary">
                                <i className="fas fa-times mr-2"></i>Cancel
                            </Link>
                            <button type="submit" disabled={processing} className="btn btn-primary">
                                <i className="fas fa-save mr-2"></i>Save Changes
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3 space-y-6">

                        {/* ── Basic Info ── */}
                        <div className="card p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-circle-info text-blue-600"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Basic Incident Information</h3>
                                    <p className="text-sm text-gray-500">Core identifiers and classification</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Incident Number</label>
                                    <input type="text" className="form-input bg-gray-50 text-gray-600" value={incident.incident_number} readOnly />
                                    <p className="text-xs text-gray-500 mt-1">Auto-generated</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Date &amp; Time of Incident <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className={`form-input ${errors.incident_at ? 'border-red-400' : ''}`}
                                        value={data.incident_at}
                                        onChange={(e) => setData('incident_at', e.target.value)}
                                    />
                                    {errors.incident_at && <p className="text-xs text-red-500 mt-1">{errors.incident_at}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date &amp; Time Reported</label>
                                    <input type="datetime-local" className="form-input bg-gray-50 text-gray-600" value={incident.reported_at?.slice(0, 16) ?? ''} readOnly />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Status</label>
                                    <div className="form-input bg-gray-50 text-gray-600 flex items-center justify-between cursor-not-allowed select-none">
                                        <span>{STATUS_LABELS[incident.workflow_status] ?? incident.workflow_status}</span>
                                        <span className="text-[10px] font-semibold text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">Read-only</span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        <i className="fas fa-info-circle mr-1"></i>
                                        Advance status from the{' '}
                                        <Link href={`/incidents/${incident.incident_number}`} className="text-blue-500 hover:underline">incident view</Link>.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Branch <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className={`form-input ${errors.branch ? 'border-red-400' : ''}`}
                                        value={data.branch}
                                        onChange={(e) => setData('branch', e.target.value)}
                                    >
                                        <option value="">Select Branch</option>
                                        {branches.map((b) => <option key={b}>{b}</option>)}
                                    </select>
                                    {errors.branch && <p className="text-xs text-red-500 mt-1">{errors.branch}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Campus</label>
                                    <select className="form-input" value={data.campus} onChange={(e) => setData('campus', e.target.value)}>
                                        <option value="">Select Campus</option>
                                        {CAMPUSES.map((c) => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Department <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className={`form-input ${errors.department ? 'border-red-400' : ''}`}
                                        value={data.department}
                                        onChange={(e) => setData('department', e.target.value)}
                                    >
                                        <option value="">Select Department</option>
                                        {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                                    </select>
                                    {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department}</p>}
                                </div>
                            </div>
                        </div>

                        {/* ── Classification ── */}
                        <div className="card p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-triangle-exclamation text-red-600"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Incident Classification</h3>
                                    <p className="text-sm text-gray-500">Category, severity and impact assessment</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Incident Type / Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className={`form-input ${errors.category ? 'border-red-400' : ''}`}
                                        value={data.category}
                                        onChange={(e) => setData('category', e.target.value)}
                                    >
                                        <option value="">Select Category</option>
                                        {CATEGORIES.map(({ group, items }) => (
                                            <optgroup key={group} label={group}>
                                                {items.map((c) => <option key={c}>{c}</option>)}
                                            </optgroup>
                                        ))}
                                    </select>
                                    {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Severity Level <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {SEVERITY_OPTIONS.map((s) => (
                                            <label key={s.value} className="cursor-pointer">
                                                <input type="radio" name="severity" value={s.value} className="sr-only"
                                                    checked={data.severity === s.value}
                                                    onChange={() => setData('severity', s.value)}
                                                />
                                                <div className={`p-3 border-2 rounded-xl text-center transition-all ${data.severity === s.value ? `border-${s.color}-500 bg-${s.color}-50` : 'border-gray-300'}`}>
                                                    <div className={`w-9 h-9 bg-${s.color}-100 text-${s.color}-600 rounded-full flex items-center justify-center mx-auto mb-1.5`}>
                                                        <i className={`fas ${s.icon} text-sm`}></i>
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-700">{s.value}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Systems Affected</label>
                                    <input type="text" className="form-input" placeholder="e.g., Email Server, HR Database..."
                                        value={data.systems_affected} onChange={(e) => setData('systems_affected', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Number of Users Affected</label>
                                    <input type="number" className="form-input" min="0"
                                        value={data.users_affected} onChange={(e) => setData('users_affected', e.target.value)} />
                                </div>
                            </div>

                            <div className="mt-5">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Incident Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={6}
                                    className={`form-input ${errors.description ? 'border-red-400' : ''}`}
                                    placeholder="Provide detailed description..."
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                />
                                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                                <div className="flex items-center justify-between mt-1.5 text-xs text-gray-400">
                                    <span>Be specific and factual — avoid speculation</span>
                                    <span>{data.description.length} characters</span>
                                </div>
                            </div>
                        </div>

                        {/* ── Reporter ── */}
                        <div className="card p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-user text-amber-600"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Reporter Information</h3>
                                    <p className="text-sm text-gray-500">Contact details of the person reporting</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Reporter Name <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" className={`form-input ${errors.reporter_name ? 'border-red-400' : ''}`}
                                        placeholder="Full Name" value={data.reporter_name}
                                        onChange={(e) => setData('reporter_name', e.target.value)} />
                                    {errors.reporter_name && <p className="text-xs text-red-500 mt-1">{errors.reporter_name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Contact Number <span className="text-red-500">*</span>
                                    </label>
                                    <input type="tel" className={`form-input ${errors.contact_number ? 'border-red-400' : ''}`}
                                        placeholder="+63 XXX XXX XXXX" value={data.contact_number}
                                        onChange={(e) => setData('contact_number', e.target.value)} />
                                    {errors.contact_number && <p className="text-xs text-red-500 mt-1">{errors.contact_number}</p>}
                                </div>
                            </div>
                        </div>

                        {/* ── Device ── */}
                        <div className="card p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-desktop text-purple-600"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Affected Device / System Details</h3>
                                    <p className="text-sm text-gray-500">Technical information about impacted assets</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">IP Address</label>
                                    <input type="text" className="form-input font-mono" placeholder="192.168.1.100"
                                        value={data.ip_address} onChange={(e) => setData('ip_address', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hostname</label>
                                    <input type="text" className="form-input font-mono" placeholder="DESKTOP-ABC123"
                                        value={data.hostname} onChange={(e) => setData('hostname', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Device Type</label>
                                    <select className="form-input" value={data.device} onChange={(e) => setData('device', e.target.value)}>
                                        <option value="">Select Device Type</option>
                                        {DEVICES.map((d) => <option key={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Operating System</label>
                                    <select className="form-input" value={data.operating_system} onChange={(e) => setData('operating_system', e.target.value)}>
                                        <option value="">Select OS</option>
                                        {OSS.map((o) => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Browser</label>
                                    <select className="form-input" value={data.browser} onChange={(e) => setData('browser', e.target.value)}>
                                        <option value="">Select Browser</option>
                                        {BROWSERS.map((b) => <option key={b}>{b}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* ── Attachments ── */}
                        <div className="card p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-paperclip text-green-600"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Evidence &amp; Attachments</h3>
                                    <p className="text-sm text-gray-500">Upload additional screenshots, logs, and supporting evidence</p>
                                </div>
                            </div>

                            {/* Upload dropzones */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                                {[
                                    { label: 'Screenshots',    icon: 'fa-images',      hint: 'PNG, JPG, GIF up to 10MB each', accept: 'image/*',            field: 'screenshots' as const },
                                    { label: 'Evidence Files', icon: 'fa-file-zipper', hint: 'PDF, DOC, ZIP up to 50MB',      accept: '.pdf,.doc,.docx,.zip',  field: 'evidence' as const },
                                    { label: 'Log Files',      icon: 'fa-file-lines',  hint: 'LOG, TXT, CSV up to 25MB',      accept: '.log,.txt,.csv',        field: 'logs' as const },
                                ].map(({ label, icon, hint, accept, field }) => (
                                    <label key={field} className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-all">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                                            <i className={`fas ${icon} text-2xl text-gray-400 mb-2.5`}></i>
                                            <p className="mb-1 text-sm font-semibold text-gray-700 text-center">{label}</p>
                                            <p className="text-[11px] text-gray-500 text-center mb-2">{hint}</p>
                                            {(data[field] as File[]).length > 0 && (
                                                <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-medium">
                                                    {(data[field] as File[]).length} file(s) selected
                                                </span>
                                            )}
                                        </div>
                                        <input type="file" className="hidden" accept={accept} multiple
                                            onChange={(e) => setData(field, Array.from(e.target.files ?? []) as any)} />
                                    </label>
                                ))}
                            </div>

                            {/* Existing attachments */}
                            {attachments.length > 0 && (
                                <div className="space-y-2 mb-4">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                        Existing Attachments ({attachments.length})
                                    </p>
                                    {attachments.map((att) => {
                                        const [ico, col] = fileIcons[att.type] ?? ['fa-file', 'text-gray-500'];
                                        return (
                                            <div key={att.id} className="flex items-center p-3 border border-gray-100 rounded-xl bg-gray-50/50 group">
                                                <div className="w-9 h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                                                    <i className={`fas ${ico} ${col}`}></i>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 truncate">{att.name}</p>
                                                    <p className="text-xs text-gray-500">{att.type.toUpperCase()} · {att.size} · {att.by}</p>
                                                </div>
                                                <a href={`/incidents/attachments/${att.id}/download`}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="Download"
                                                >
                                                    <i className="fas fa-download text-xs"></i>
                                                </a>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                <p className="text-sm text-green-800 flex items-start">
                                    <i className="fas fa-shield-alt text-green-600 mr-2.5 mt-0.5"></i>
                                    <span><strong>Security Note:</strong> All uploaded files are encrypted at rest with AES-256 and access is restricted to authorized security personnel only.</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Sidebar ── */}
                    <div className="space-y-6">
                        <div className="card p-6 sticky top-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Publishing</h3>

                            <div className="space-y-4 mb-6">
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-gray-500">Created</span>
                                        <span className="text-xs text-gray-400 font-mono">{incident.created_at}</span>
                                    </div>
                                    <p className="text-sm text-gray-800 font-medium">by {incident.created_by}</p>
                                </div>
                                {incident.updated_at && incident.updated_at !== incident.created_at && (
                                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-amber-600 font-semibold">Last Modified</span>
                                            <span className="text-xs text-amber-500 font-mono">{incident.updated_at}</span>
                                        </div>
                                        <p className="text-sm text-amber-900 font-medium">by {incident.created_by}</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2.5">
                                <Link href={`/incidents/${incident.incident_number}`} className="w-full btn btn-secondary justify-center">
                                    <i className="fas fa-eye mr-2"></i>View Incident
                                </Link>
                                <button type="submit" disabled={processing} className="w-full btn btn-primary justify-center">
                                    <i className="fas fa-check mr-2"></i>Save Changes
                                </button>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Navigation</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    <Link href={`/incidents/${incident.incident_number}`} className="text-[11px] font-semibold px-2.5 py-1.5 border rounded-lg transition bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                                        <i className="fas fa-eye mr-1"></i>View
                                    </Link>
                                    <Link href="/incidents" className="text-[11px] font-semibold px-2.5 py-1.5 border rounded-lg transition bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200">
                                        <i className="fas fa-list mr-1"></i>All Incidents
                                    </Link>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2">Status changes are made from the incident view.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
