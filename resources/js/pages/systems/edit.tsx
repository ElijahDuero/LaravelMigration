import AppLayout from '@/components/AppLayout';
import { Link, useForm, router } from '@inertiajs/react';

interface SystemRecord {
    id: number;
    sys_id: string;
    name: string;
    category: string;
    status: string;
    criticality: string;
    description: string | null;
    url: string | null;
    go_live_date: string | null;
    branch: string | null;
    owner: string | null;
    vendor: string | null;
    developer: string | null;
    support_contact: string | null;
    source_code_repo: string | null;
    api_documentation: string | null;
    hosting: string | null;
    server: string | null;
    ip_address: string | null;
    database_type: string | null;
    operating_system: string | null;
    tech_stack: string | null;
    authentication: string | null;
    backup: string | null;
    recovery_plan: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    system: SystemRecord;
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

export default function SystemsEdit({ system, branches }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name:              system.name              ?? '',
        category:          system.category          ?? '',
        status:            system.status            ?? 'Active',
        criticality:       system.criticality       ?? 'Medium',
        description:       system.description       ?? '',
        url:               system.url               ?? '',
        go_live_date:      system.go_live_date       ?? '',
        branch:            system.branch            ?? '',
        owner:             system.owner             ?? '',
        vendor:            system.vendor            ?? '',
        developer:         system.developer         ?? '',
        support_contact:   system.support_contact   ?? '',
        source_code_repo:  system.source_code_repo  ?? '',
        api_documentation: system.api_documentation ?? '',
        hosting:           system.hosting           ?? '',
        server:            system.server            ?? '',
        ip_address:        system.ip_address        ?? '',
        database_type:     system.database_type     ?? '',
        operating_system:  system.operating_system  ?? '',
        tech_stack:        system.tech_stack        ?? '',
        authentication:    system.authentication    ?? '',
        backup:            system.backup            ?? '',
        recovery_plan:     system.recovery_plan     ?? '',
        notes:             system.notes             ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(`/systems/${system.id}`);
    }

    function handleDelete() {
        if (!confirm(`Delete "${system.name}"? This cannot be undone.`)) return;
        router.delete(`/systems/${system.id}`);
    }

    return (
        <AppLayout title="Edit System" subtitle="Update system details">
            <form onSubmit={submit} className="space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <Link href={`/systems/${system.id}`} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                            <i className="fas fa-arrow-left text-gray-600"></i>
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Edit System</h2>
                            <p className="text-sm text-gray-500 font-mono">{system.sys_id} · {system.name}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/systems/${system.id}`} className="btn btn-secondary">
                            <i className="fas fa-times mr-2"></i>Cancel
                        </Link>
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            <i className="fas fa-floppy-disk mr-2"></i>Save Changes
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
                                <h3 className="text-lg font-semibold text-gray-900">System Information</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">System ID</label>
                                    <input type="text" className="form-input bg-gray-50 font-mono" value={system.sys_id} readOnly />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">System Name <span className="text-red-500">*</span></label>
                                    <input type="text" className={`form-input ${errors.name ? 'border-red-400' : ''}`}
                                        value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                                    <select className={`form-input ${errors.category ? 'border-red-400' : ''}`}
                                        value={data.category} onChange={(e) => setData('category', e.target.value)}>
                                        <option value="">— Select Category —</option>
                                        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                                    </select>
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
                                        value={data.description} onChange={(e) => setData('description', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">URL / Access URL</label>
                                    <input type="url" className="form-input"
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
                                <h3 className="text-lg font-semibold text-gray-900">Ownership &amp; Vendor</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">System Owner <span className="text-red-500">*</span></label>
                                    <input type="text" className={`form-input ${errors.owner ? 'border-red-400' : ''}`}
                                        value={data.owner} onChange={(e) => setData('owner', e.target.value)} />
                                    {errors.owner && <p className="text-xs text-red-500 mt-1">{errors.owner}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Vendor / Provider</label>
                                    <input type="text" className="form-input"
                                        value={data.vendor} onChange={(e) => setData('vendor', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Developer</label>
                                    <input type="text" className="form-input"
                                        value={data.developer} onChange={(e) => setData('developer', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Support Contact</label>
                                    <input type="text" className="form-input"
                                        value={data.support_contact} onChange={(e) => setData('support_contact', e.target.value)} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Source Code Repository</label>
                                    <input type="text" className="form-input"
                                        value={data.source_code_repo} onChange={(e) => setData('source_code_repo', e.target.value)} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">API Documentation URL</label>
                                    <input type="text" className="form-input"
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
                                <h3 className="text-lg font-semibold text-gray-900">Infrastructure</h3>
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
                                    <input type="text" className="form-input"
                                        value={data.server} onChange={(e) => setData('server', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">IP Address</label>
                                    <input type="text" className="form-input"
                                        value={data.ip_address} onChange={(e) => setData('ip_address', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Operating System</label>
                                    <input type="text" className="form-input"
                                        value={data.operating_system} onChange={(e) => setData('operating_system', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Technology Stack</label>
                                    <input type="text" className="form-input"
                                        value={data.tech_stack} onChange={(e) => setData('tech_stack', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Security */}
                        <div className="card p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-shield-halved text-red-600"></i>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Security &amp; Business Continuity</h3>
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
                                        value={data.recovery_plan} onChange={(e) => setData('recovery_plan', e.target.value)} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                                    <textarea rows={3} className="form-input"
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
                                    const meta = CRIT_META[c];
                                    const sel  = data.criticality === c;
                                    return (
                                        <label key={c} className={`flex items-center p-3 rounded-xl border cursor-pointer transition ${
                                            sel ? `bg-${meta.color}-50 border-${meta.color}-300` : 'border-gray-200 hover:bg-gray-50'
                                        }`}>
                                            <input type="radio" className="mr-3"
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

                        {/* Publishing */}
                        <div className="card p-6">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4">Publishing</h3>
                            <div className="space-y-3 text-sm mb-5">
                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500 text-xs">Created</span>
                                    <span className="font-mono text-gray-700 text-[10px]">{system.created_at}</span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-gray-500 text-xs">Last Modified</span>
                                    <span className="font-mono text-gray-700 text-[10px]">{system.updated_at}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Link href={`/systems/${system.id}`} className="btn btn-secondary w-full text-sm py-2 justify-center">
                                    <i className="fas fa-eye mr-2"></i>Preview
                                </Link>
                                <button type="submit" disabled={processing} className="btn btn-primary w-full text-sm py-2 justify-center">
                                    <i className="fas fa-save mr-2"></i>Save Changes
                                </button>
                                <button type="button" onClick={handleDelete}
                                    className="w-full px-4 py-2 text-sm font-medium bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition flex items-center justify-center">
                                    <i className="fas fa-trash mr-2"></i>Delete System
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
