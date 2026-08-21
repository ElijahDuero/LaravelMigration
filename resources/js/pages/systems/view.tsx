import AppLayout from '@/components/AppLayout';
import { Link, router, usePage } from '@inertiajs/react';

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
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

const CAT_META: Record<string, { icon: string; color: string }> = {
    'HRIS':        { icon: 'fa-users-gear',     color: 'purple' },
    'Enrollment':  { icon: 'fa-user-graduate',  color: 'cyan' },
    'Finance':     { icon: 'fa-coins',          color: 'emerald' },
    'Payroll':     { icon: 'fa-money-check',    color: 'green' },
    'LMS':         { icon: 'fa-graduation-cap', color: 'indigo' },
    'Library':     { icon: 'fa-book',           color: 'amber' },
    'Biometric':   { icon: 'fa-fingerprint',    color: 'orange' },
    'Email':       { icon: 'fa-envelope',       color: 'sky' },
    'Website':     { icon: 'fa-globe',          color: 'blue' },
    'Portal':      { icon: 'fa-door-open',      color: 'violet' },
    'Mobile App':  { icon: 'fa-mobile-screen',  color: 'pink' },
    'ERP':         { icon: 'fa-sitemap',        color: 'rose' },
    'Accounting':  { icon: 'fa-calculator',     color: 'teal' },
    'Inventory':   { icon: 'fa-boxes-stacked',  color: 'lime' },
    'Security':    { icon: 'fa-shield-halved',  color: 'red' },
    'Other':       { icon: 'fa-gear',           color: 'gray' },
};

const CRIT_COLOR: Record<string, string>   = { Critical: 'red', High: 'orange', Medium: 'amber', Low: 'green' };
const STATUS_COLOR: Record<string, string> = { Active: 'green', Maintenance: 'amber', Development: 'blue', Suspended: 'red', Decommissioned: 'gray' };

const CRIT_DESC: Record<string, string> = {
    Critical: 'Failure causes org-wide disruption',
    High:     'Major impact on core operations',
    Medium:   'Moderate impact, workaround available',
    Low:      'Minimal impact if unavailable',
};

const HOSTING_ICON: Record<string, { icon: string; color: string }> = {
    'Cloud':       { icon: 'fa-cloud',         color: 'text-sky-500' },
    'On-Premise':  { icon: 'fa-server',        color: 'text-indigo-500' },
    'Hybrid':      { icon: 'fa-network-wired', color: 'text-purple-500' },
    'SaaS':        { icon: 'fa-cubes',         color: 'text-teal-500' },
};

function fmtDate(d: string | null) {
    if (!d) return null;
    return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function Field({ label, value, icon, mono, link }: { label: string; value: string | null; icon?: string; mono?: boolean; link?: boolean }) {
    const empty = !value;
    return (
        <div className="flex items-start space-x-3 py-2.5 border-b border-gray-50 last:border-0">
            <i className={`fas ${icon ?? 'fa-circle-dot'} ${empty ? 'text-gray-200' : 'text-blue-400'} mt-0.5 w-4 flex-shrink-0`}></i>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                {empty ? (
                    <p className="text-sm text-gray-400 italic mt-0.5">Not provided</p>
                ) : link ? (
                    <a href={value!} target="_blank" rel="noopener" className="text-sm text-blue-600 hover:underline break-all mt-0.5 inline-block">
                        {value}<i className="fas fa-arrow-up-right-from-square text-xs ml-1"></i>
                    </a>
                ) : (
                    <p className={`text-sm text-gray-900 mt-0.5 break-words ${mono ? 'font-mono' : ''}`}>{value}</p>
                )}
            </div>
        </div>
    );
}

export default function SystemsView({ system }: { system: SystemRecord }) {
    const { auth } = usePage<any>().props;
    const isAdmin  = ['super_admin', 'admin'].includes(auth.user?.role ?? '');

    const meta        = CAT_META[system.category] ?? { icon: 'fa-gear', color: 'gray' };
    const critColor   = CRIT_COLOR[system.criticality]  ?? 'gray';
    const statusColor = STATUS_COLOR[system.status]      ?? 'gray';

    function handleDelete() {
        if (!confirm(`Delete "${system.name}"? This cannot be undone.`)) return;
        router.delete(`/systems/${system.id}`);
    }

    return (
        <AppLayout title={system.name} subtitle={`${system.category} System`}>
            <div className="space-y-6">

                {/* Header */}
                <div className="card p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex items-start space-x-4">
                            <Link href="/systems" className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 mt-1 flex-shrink-0">
                                <i className="fas fa-arrow-left text-gray-500"></i>
                            </Link>
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h1 className="text-2xl font-bold text-gray-900">{system.name}</h1>
                                    <span className="text-sm font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{system.sys_id}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-${critColor}-100 text-${critColor}-700 border border-${critColor}-200`}>
                                        <i className="fas fa-fire mr-1.5"></i>{system.criticality}
                                    </span>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-${statusColor}-100 text-${statusColor}-700 border border-${statusColor}-200`}>
                                        <i className="fas fa-circle mr-1.5 text-[8px]"></i>{system.status}
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                        <i className="fas fa-tag mr-1.5"></i>{system.category}
                                    </span>
                                    {system.hosting && (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600">
                                            <i className={`fas ${HOSTING_ICON[system.hosting]?.icon ?? 'fa-cloud'} mr-1.5 ${HOSTING_ICON[system.hosting]?.color ?? 'text-gray-400'}`}></i>
                                            {system.hosting}
                                        </span>
                                    )}
                                    {system.branch && (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                                            <i className="fas fa-code-branch mr-1.5"></i>{system.branch}
                                        </span>
                                    )}
                                </div>
                                {system.description && (
                                    <p className="text-sm text-gray-600 mt-3 max-w-2xl">{system.description}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 flex-shrink-0">
                            {system.url && (
                                <a href={system.url} target="_blank" rel="noopener" className="btn btn-secondary text-sm py-2">
                                    <i className="fas fa-arrow-up-right-from-square mr-1.5"></i>Open System
                                </a>
                            )}
                            {isAdmin && (
                                <Link href={`/systems/${system.id}/edit`} className="btn btn-primary text-sm py-2">
                                    <i className="fas fa-pen mr-1.5"></i>Edit
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">

                        {/* Ownership */}
                        <div className="card p-6">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center">
                                <i className="fas fa-user-tie mr-2 text-purple-500"></i>Ownership &amp; Contacts
                            </h3>
                            <Field label="System Owner"      value={system.owner}           icon="fa-user-shield" />
                            <Field label="Vendor / Provider" value={system.vendor}          icon="fa-building" />
                            <Field label="Developer"         value={system.developer}       icon="fa-code" />
                            <Field label="Support Contact"   value={system.support_contact} icon="fa-headset" />
                            <Field label="Branch"            value={system.branch}          icon="fa-code-branch" />
                        </div>

                        {/* Infrastructure */}
                        <div className="card p-6">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center">
                                <i className="fas fa-server mr-2 text-indigo-500"></i>Infrastructure
                            </h3>
                            <Field label="Hosting"          value={system.hosting}          icon="fa-cloud" />
                            <Field label="Server"           value={system.server}           icon="fa-server" />
                            <Field label="IP Address"       value={system.ip_address}       icon="fa-network-wired" mono />
                            <Field label="Database"         value={system.database_type}    icon="fa-database" />
                            <Field label="Operating System" value={system.operating_system} icon="fa-desktop" />
                            <Field label="Technology Stack" value={system.tech_stack}       icon="fa-layer-group" />
                        </div>

                        {/* Security */}
                        <div className="card p-6">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center">
                                <i className="fas fa-shield-halved mr-2 text-red-500"></i>Security &amp; Business Continuity
                            </h3>
                            <Field label="Authentication"   value={system.authentication} icon="fa-key" />
                            <Field label="Backup Frequency" value={system.backup}         icon="fa-rotate" />
                            <div className="flex items-start space-x-3 py-2.5 border-b border-gray-50">
                                <i className="fas fa-file-shield text-blue-400 mt-0.5 w-4 flex-shrink-0"></i>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Recovery Plan</p>
                                    {system.recovery_plan
                                        ? <p className="text-sm text-gray-900 mt-0.5 whitespace-pre-wrap">{system.recovery_plan}</p>
                                        : <p className="text-sm text-gray-400 italic mt-0.5">Not documented</p>
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Dev & Docs */}
                        <div className="card p-6">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center">
                                <i className="fas fa-code-branch mr-2 text-teal-500"></i>Development &amp; Documentation
                            </h3>
                            <Field label="Source Code Repository" value={system.source_code_repo}   icon="fa-code-fork" link={!!system.source_code_repo} />
                            <Field label="API Documentation"      value={system.api_documentation}  icon="fa-book-open" link={!!system.api_documentation} />
                        </div>

                        {system.notes && (
                            <div className="card p-6">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center">
                                    <i className="fas fa-note-sticky mr-2 text-amber-500"></i>Notes
                                </h3>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{system.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">

                        {/* Quick reference */}
                        <div className="card p-5">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Quick Reference</h4>
                            <dl className="space-y-3">
                                <div>
                                    <dt className="text-xs text-gray-400 uppercase tracking-wide">System ID</dt>
                                    <dd className="text-sm font-mono font-semibold text-gray-900 mt-0.5">{system.sys_id}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-gray-400 uppercase tracking-wide">Category</dt>
                                    <dd className="text-sm text-gray-900 mt-0.5">{system.category || '—'}</dd>
                                </div>
                                {system.go_live_date && (
                                    <div>
                                        <dt className="text-xs text-gray-400 uppercase tracking-wide">Go-Live Date</dt>
                                        <dd className="text-sm text-gray-900 mt-0.5">{fmtDate(system.go_live_date)}</dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-xs text-gray-400 uppercase tracking-wide">Registered</dt>
                                    <dd className="text-sm text-gray-900 mt-0.5">{system.created_at}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-gray-400 uppercase tracking-wide">Last Updated</dt>
                                    <dd className="text-sm text-gray-900 mt-0.5">{system.updated_at}</dd>
                                </div>
                            </dl>
                        </div>

                        {/* Criticality badge */}
                        <div className={`card p-5 bg-${critColor}-50 border border-${critColor}-100`}>
                            <h4 className={`text-xs font-bold text-${critColor}-700 uppercase tracking-wide mb-3`}>Criticality</h4>
                            <div className="flex items-center space-x-3">
                                <div className={`w-12 h-12 bg-${critColor}-100 rounded-xl flex items-center justify-center`}>
                                    <i className={`fas fa-fire text-${critColor}-600 text-xl`}></i>
                                </div>
                                <div>
                                    <p className={`text-lg font-bold text-${critColor}-700`}>{system.criticality}</p>
                                    <p className={`text-xs text-${critColor}-600`}>{CRIT_DESC[system.criticality] ?? ''}</p>
                                </div>
                            </div>
                        </div>

                        {/* Admin actions */}
                        {isAdmin && (
                            <div className="card p-5 border border-red-100">
                                <h4 className="text-xs font-bold text-red-600 uppercase tracking-wide mb-3">Actions</h4>
                                <div className="space-y-2">
                                    <Link href={`/systems/${system.id}/edit`} className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                                        <i className="fas fa-pen mr-2 text-indigo-500"></i>Edit System
                                    </Link>
                                    <button onClick={handleDelete} className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition">
                                        <i className="fas fa-trash mr-2"></i>Delete System
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
