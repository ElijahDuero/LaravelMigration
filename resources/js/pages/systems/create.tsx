import AppLayout from '@/components/AppLayout';
import { Link, useForm } from '@inertiajs/react';

interface Props {
    nextSysId: string;
    branches: string[];
}

const CATEGORIES     = ['HRIS','Enrollment','Finance','Payroll','LMS','Library','Biometric','Email','Website','Portal','Mobile App','ERP','Accounting','Inventory','Security','Other'];
const CRITICALITIES  = ['Critical','High','Medium','Low'] as const;
const STATUSES       = ['Active','Development','Maintenance','Suspended','Decommissioned'];
const HOSTING_OPTS   = ['On-Premise','Cloud','Hybrid','SaaS'];
const DB_OPTS        = ['MySQL','PostgreSQL','MSSQL','Oracle','SQLite','MongoDB','MariaDB','Redis','Other','N/A'];
const AUTH_OPTS      = ['Active Directory','LDAP','SSO','OAuth 2.0','SAML','Local Accounts','Biometric','MFA','Other'];
const BACKUP_OPTS    = ['Daily','Weekly','Monthly','Real-time','None'];

const CRIT_META: Record<string, { color: string; desc: string }> = {
    'Critical': { color: 'red',    desc: 'Failure causes org-wide disruption' },
    'High':     { color: 'orange', desc: 'Major impact on core operations' },
    'Medium':   { color: 'amber',  desc: 'Moderate impact, workaround available' },
    'Low':      { color: 'green',  desc: 'Minimal impact if unavailable' },
};

export default function SystemsCreate({ nextSysId, branches }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name:             '',
        category:         '',
        status:           'Active',
        criticality:      'Medium',
        description:      '',
        url:              '',
        go_live_date:     '',
        branch:           '',
        owner:            '',
        vendor:           '',
        developer:        '',
        support_contact:  '',
        source_code_repo: '',
        api_documentation:'',
        hosting:          '',
        server:           '',
        ip_address:       '',
        database_type:    '',
        operating_system: '',
        tech_stack:       '',
        authentication:   '',
        backup:           '',
        recovery_plan:    '',
        notes:            '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/systems');
    }

    return (
        <AppLayout title="Register System" subtitle="Add a new system to the registry">
            <form onSubmit={submit} className="space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <Link href="/systems" className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                            <i className="fas fa-arrow-left text-gray-600"></i>
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Register System</h2>
                            <p className="text-sm text-gray-500">Fill in all known details — every field helps.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href="/systems" className="btn btn-secondary"><i className="fas fa-times mr-2"></i>Cancel</Link>
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            <i className="fas fa-floppy-disk mr-2"></i>Save System
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">

                        {/* System info */}
                        <div className="card p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-layer-group text-blue-600"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">System Information</h3>
                                    <p className="text-sm text-gray-500">Name, category, and description</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">System ID</label>
                                    <input type="text" className="form-input bg-gray-50 font-mono" value={nextSysId} readOnly />
                                    <p className="text-xs text-gray-500 mt-1">Auto-generated</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        System Name <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" className={`form-input ${errors.name ? 'border-red-400' : ''}`}
                                        placeholder="e.g., HRIS System, Enrollment Portal"
                                        value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select className={`form-input ${errors.category ? 'border-red-400' : ''}`}
                                        value={data.category} onChange={(e) => setData('category', e.target.value)}>
                                        <option value="">— Select Category —</option>
                                        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                                    </select>
                                    {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                                    <select className="form-input" value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                                    <textarea rows={3} className="form-input"
                                        placeholder="Brief description of the system's purpose and users"
                                        value={data.description} onChange={(e) => setData('description', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">URL / Access URL</label>
                                    <input type="url" className="form-input" placeholder="https://hris.example.edu"
                                        value={data.url} onChange={(e) => setData('url', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Go-Live Date</label>
                                    <input type="date" className="form-input"
                                        value={data.go_live_date} onChange={(e) => setData('go_live_date', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Branch</label>
                                    <select className="form-input" value={data.branch} onChange={(e) => setData('branch', e.target.value)}>
                                        <option value="">— Select Branch —</option>
                                        {branches.map((b) => <option key={b}>{b}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Ownership */}
                        <div className="card p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-user-tie text-purple-600"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Ownership &amp; Vendor</h3>
                                    <p className="text-sm text-gray-500">Who owns, built, and supports this system</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        System Owner <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" className={`form-input ${errors.owner ? 'border-red-400' : ''}`}
                                        placeholder="e.g., HR Department / John Doe"
                                        value={data.owner} onChange={(e) => setData('owner', e.target.value)} />
                                    {errors.owner && <p className="text-xs text-red-500 mt-1">{errors.owner}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Vendor / Provider</label>
                                    <input type="text" className="form-input" placeholder="e.g., SAP, Oracle, In-house"
                                        value={data.vendor} onChange={(e) => setData('vendor', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Developer</label>
                                    <input type="text" className="form-input" placeholder="Name or company"
                                        value={data.developer} onChange={(e) => setData('developer', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Support Contact</label>
                                    <input type="text" className="form-input" placeholder="Email or phone"
                                        value={data.support_contact} onChange={(e) => setData('support_contact', e.target.value)} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Source Code Repository</label>
                                    <input type="text" className="form-input" placeholder="https://github.com/org/repo"
                                        value={data.source_code_repo} onChange={(e) => setData('source_code_repo', e.target.value)} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">API Documentation URL</label>
                                    <input type="text" className="form-input" placeholder="https://docs.example.edu/api"
                                        value={data.api_documentation} onChange={(e) => setData('api_documentation', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Infrastructure */}
                        <div className="card p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-server text-indigo-600"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Infrastructure</h3>
                                    <p className="text-sm text-gray-500">Hosting, server, and database details</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Hosting</label>
                                    <select className="form-input" value={data.hosting} onChange={(e) => setData('hosting', e.target.value)}>
                                        <option value="">— Select Hosting —</option>
                                        {HOSTING_OPTS.map((h) => <option key={h}>{h}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Database</label>
                                    <select className="form-input" value={data.database_type} onChange={(e) => setData('database_type', e.target.value)}>
                                        <option value="">— Select Database —</option>
                                        {DB_OPTS.map((d) => <option key={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Server / Host Name</label>
                                    <input type="text" className="form-input" placeholder="e.g., srv-hris-01 or AWS RDS endpoint"
                                        value={data.server} onChange={(e) => setData('server', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">IP Address</label>
                                    <input type="text" className="form-input" placeholder="192.168.1.10"
                                        value={data.ip_address} onChange={(e) => setData('ip_address', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Operating System</label>
                                    <input type="text" className="form-input" placeholder="e.g., Ubuntu 22.04, Windows Server 2022"
                                        value={data.operating_system} onChange={(e) => setData('operating_system', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Technology Stack</label>
                                    <input type="text" className="form-input" placeholder="e.g., PHP / Laravel, Java Spring Boot"
                                        value={data.tech_stack} onChange={(e) => setData('tech_stack', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Security & Continuity */}
                        <div className="card p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-shield-halved text-red-600"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Security &amp; Business Continuity</h3>
                                    <p className="text-sm text-gray-500">Authentication, backup, and recovery</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Authentication Method</label>
                                    <select className="form-input" value={data.authentication} onChange={(e) => setData('authentication', e.target.value)}>
                                        <option value="">— Select Auth —</option>
                                        {AUTH_OPTS.map((a) => <option key={a}>{a}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Backup Frequency</label>
                                    <select className="form-input" value={data.backup} onChange={(e) => setData('backup', e.target.value)}>
                                        <option value="">— Select —</option>
                                        {BACKUP_OPTS.map((b) => <option key={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Recovery Plan</label>
                                    <textarea rows={3} className="form-input"
                                        placeholder="Describe the recovery procedure, RTO/RPO targets, or link to the DRP document"
                                        value={data.recovery_plan} onChange={(e) => setData('recovery_plan', e.target.value)} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                                    <textarea rows={3} className="form-input"
                                        placeholder="Any additional notes, known issues, or maintenance schedules"
                                        value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Criticality picker */}
                        <div className="card p-6">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                                <i className="fas fa-star mr-2 text-amber-500"></i>Criticality
                            </h3>
                            <div className="space-y-2">
                                {CRITICALITIES.map((c) => {
                                    const meta  = CRIT_META[c];
                                    const sel   = data.criticality === c;
                                    return (
                                        <label key={c} className={`flex items-center p-3 rounded-xl border cursor-pointer transition ${
                                            sel ? `bg-${meta.color}-50 border-${meta.color}-300` : 'border-gray-200 hover:bg-gray-50'
                                        }`}>
                                            <input type="radio" name="criticality" className="mr-3"
                                                checked={sel} onChange={() => setData('criticality', c)} />
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{c}</p>
                                                <p className="text-xs text-gray-500">{meta.desc}</p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="card p-5 bg-blue-50/60 border border-blue-100">
                            <div className="flex items-start space-x-3">
                                <i className="fas fa-circle-info text-blue-500 mt-0.5 flex-shrink-0"></i>
                                <div className="text-xs text-blue-700 space-y-1.5">
                                    <p className="font-semibold">Why a Systems Registry?</p>
                                    <p>Helps identify shadow IT, track vendor contracts, plan disaster recovery, and scope security assessments.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pb-6">
                            <button type="submit" disabled={processing} className="w-full btn btn-primary justify-center">
                                <i className="fas fa-floppy-disk mr-2"></i>Save System
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
