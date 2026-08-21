import AppLayout from '@/components/AppLayout';
import { Link, useForm } from '@inertiajs/react';

interface Props {
    incidentNumberPreview: string;
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
    { value: 'Low',      label: 'Low',      color: 'green',  icon: 'fa-arrow-down' },
    { value: 'Medium',   label: 'Medium',   color: 'yellow', icon: 'fa-minus' },
    { value: 'High',     label: 'High',     color: 'orange', icon: 'fa-arrow-up' },
    { value: 'Critical', label: 'Critical', color: 'red',    icon: 'fa-skull-crossbones' },
];

export default function IncidentsCreate({ incidentNumberPreview, branches }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        submit_mode:      'reported',
        incident_at:      '',
        branch:           '',
        campus:           '',
        department:       '',
        reporter_name:    '',
        contact_number:   '',
        category:         '',
        severity:         'High',
        systems_affected: '',
        users_affected:   '',
        description:      '',
        ip_address:       '',
        hostname:         '',
        device:           '',
        operating_system: '',
        browser:          '',
        screenshots:      [] as File[],
        evidence:         [] as File[],
        logs:             [] as File[],
    });

    function submit(mode: 'draft' | 'reported') {
        setData('submit_mode', mode);
        post('/incidents', {
            forceFormData: true,
        });
    }

    return (
        <AppLayout title="Report New Incident" subtitle="Submit a new security incident report">
            <div className="space-y-6">

                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Link href="/incidents" className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                            <i className="fas fa-arrow-left text-gray-600"></i>
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Report New Incident</h2>
                            <p className="text-sm text-gray-500">Fill in all the details below to submit the report</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            type="button"
                            onClick={() => submit('draft')}
                            disabled={processing}
                            className="btn btn-secondary"
                        >
                            <i className="fas fa-save mr-2"></i>Save Draft
                        </button>
                        <button
                            type="button"
                            onClick={() => submit('reported')}
                            disabled={processing}
                            className="btn btn-primary"
                        >
                            <i className="fas fa-paper-plane mr-2"></i>Submit Report
                        </button>
                    </div>
                </div>

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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Incident Number</label>
                            <input type="text" className="form-input bg-gray-50" value={incidentNumberPreview} readOnly />
                            <p className="text-xs text-gray-500 mt-1">Auto-generated</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date &amp; Time Reported</label>
                            <input
                                type="datetime-local"
                                className="form-input bg-gray-50"
                                value={new Date().toISOString().slice(0, 16)}
                                readOnly
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Branch <span className="text-red-500">*</span>
                            </label>
                            <select
                                className={`form-input ${errors.branch ? 'border-red-400' : ''}`}
                                value={data.branch}
                                onChange={(e) => setData('branch', e.target.value)}
                            >
                                <option value="">Select Branch</option>
                                {branches.map((b) => <option key={b}>{b}</option>)}
                                {branches.length === 0 && <option disabled>No branches — create one in Branches</option>}
                            </select>
                            {errors.branch && <p className="text-xs text-red-500 mt-1">{errors.branch}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
                            <select
                                className="form-input"
                                value={data.campus}
                                onChange={(e) => setData('campus', e.target.value)}
                            >
                                <option value="">Select Campus</option>
                                {CAMPUSES.map((c) => <option key={c}>{c}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reporter Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className={`form-input ${errors.reporter_name ? 'border-red-400' : ''}`}
                                placeholder="Full Name"
                                value={data.reporter_name}
                                onChange={(e) => setData('reporter_name', e.target.value)}
                            />
                            {errors.reporter_name && <p className="text-xs text-red-500 mt-1">{errors.reporter_name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contact Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                className={`form-input ${errors.contact_number ? 'border-red-400' : ''}`}
                                placeholder="+63 XXX XXX XXXX"
                                value={data.contact_number}
                                onChange={(e) => setData('contact_number', e.target.value)}
                            />
                            {errors.contact_number && <p className="text-xs text-red-500 mt-1">{errors.contact_number}</p>}
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
                            <p className="text-sm text-gray-500">Category and severity assessment</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Incident Type / Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                className={`form-input ${errors.category ? 'border-red-400' : ''}`}
                                value={data.category}
                                onChange={(e) => setData('category', e.target.value)}
                            >
                                <option value="">Select Incident Type</option>
                                {CATEGORIES.map(({ group, items }) => (
                                    <optgroup key={group} label={group}>
                                        {items.map((c) => <option key={c}>{c}</option>)}
                                    </optgroup>
                                ))}
                            </select>
                            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Severity Level <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {SEVERITY_OPTIONS.map((s) => (
                                    <label key={s.value} className="cursor-pointer">
                                        <input
                                            type="radio"
                                            name="severity"
                                            value={s.value}
                                            className="sr-only"
                                            checked={data.severity === s.value}
                                            onChange={() => setData('severity', s.value)}
                                        />
                                        <div className={`p-3 border-2 rounded-lg text-center transition-all ${data.severity === s.value ? `border-${s.color}-500 bg-${s.color}-50` : 'border-gray-300'}`}>
                                            <div className={`w-8 h-8 bg-${s.color}-100 text-${s.color}-600 rounded-full flex items-center justify-center mx-auto mb-1`}>
                                                <i className={`fas ${s.icon} text-sm`}></i>
                                            </div>
                                            <p className="text-xs font-semibold text-gray-700">{s.label}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Systems Affected</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., Email Server, HR Database, Website..."
                                value={data.systems_affected}
                                onChange={(e) => setData('systems_affected', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Users Affected</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="0"
                                min="0"
                                value={data.users_affected}
                                onChange={(e) => setData('users_affected', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Incident Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={6}
                            className={`form-input ${errors.description ? 'border-red-400' : ''}`}
                            placeholder="Provide a detailed description of what happened, when it was discovered, and any initial observations..."
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                        />
                        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                    </div>
                </div>

                {/* ── Device Details ── */}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                            <input type="text" className="form-input" placeholder="e.g., 192.168.1.100"
                                value={data.ip_address} onChange={(e) => setData('ip_address', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hostname</label>
                            <input type="text" className="form-input" placeholder="e.g., DESKTOP-ABC123"
                                value={data.hostname} onChange={(e) => setData('hostname', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Device</label>
                            <select className="form-input" value={data.device} onChange={(e) => setData('device', e.target.value)}>
                                <option value="">Select Device Type</option>
                                {DEVICES.map((d) => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Operating System</label>
                            <select className="form-input" value={data.operating_system} onChange={(e) => setData('operating_system', e.target.value)}>
                                <option value="">Select OS</option>
                                {OSS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Browser</label>
                            <select className="form-input" value={data.browser} onChange={(e) => setData('browser', e.target.value)}>
                                <option value="">Select Browser</option>
                                {BROWSERS.map((b) => <option key={b}>{b}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* ── Evidence ── */}
                <div className="card p-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <i className="fas fa-paperclip text-green-600"></i>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Evidence &amp; Attachments</h3>
                            <p className="text-sm text-gray-500">Upload screenshots, logs, and supporting evidence</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'Screenshots',     icon: 'fa-images',      hint: 'PNG, JPG, GIF up to 10MB each', accept: 'image/*',          field: 'screenshots' as const },
                            { label: 'Evidence Files',  icon: 'fa-file-zipper', hint: 'PDF, DOC, ZIP up to 50MB',     accept: '.pdf,.doc,.docx,.zip', field: 'evidence' as const },
                            { label: 'Log Files',       icon: 'fa-file-lines',  hint: 'LOG, TXT, CSV up to 25MB',     accept: '.log,.txt,.csv',     field: 'logs' as const },
                        ].map(({ label, icon, hint, accept, field }) => (
                            <label key={field} className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <i className={`fas ${icon} text-2xl text-gray-400 mb-2`}></i>
                                    <p className="mb-1 text-sm text-gray-500"><span className="font-semibold">Click to upload</span></p>
                                    <p className="text-xs text-gray-500">{hint}</p>
                                    {(data[field] as File[]).length > 0 && (
                                        <p className="text-xs text-blue-600 mt-1 font-medium">{(data[field] as File[]).length} file(s) selected</p>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept={accept}
                                    multiple
                                    onChange={(e) => setData(field, Array.from(e.target.files ?? []) as any)}
                                />
                            </label>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-600 flex items-center">
                            <i className="fas fa-shield-alt text-green-600 mr-2"></i>
                            <strong>Note:</strong>&nbsp;All uploaded files are encrypted and access is restricted to authorized security personnel only.
                        </p>
                    </div>
                </div>

                {/* ── Actions ── */}
                <div className="flex items-center justify-end space-x-3 pb-6">
                    <Link href="/incidents" className="btn btn-secondary">
                        <i className="fas fa-times mr-2"></i>Cancel
                    </Link>
                    <button type="button" onClick={() => submit('draft')} disabled={processing} className="btn btn-secondary">
                        <i className="fas fa-save mr-2"></i>Save Draft
                    </button>
                    <button type="button" onClick={() => submit('reported')} disabled={processing} className="btn btn-primary">
                        <i className="fas fa-paper-plane mr-2"></i>Submit Incident Report
                    </button>
                </div>

            </div>
        </AppLayout>
    );
}
