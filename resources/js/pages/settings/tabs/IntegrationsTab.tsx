type Integration = {
    name: string;
    icon: string;
    bgIcon: string;
    textIcon: string;
    status: 'Connected' | 'Partial' | 'Not connected';
    desc: string;
    connected: boolean;
};

// Static Tailwind classes — no interpolation so Tailwind doesn't purge them
const INTEGRATIONS: Integration[] = [
    { name: 'Microsoft 365',      icon: 'fa-brands fa-microsoft',       bgIcon: 'bg-blue-100',   textIcon: 'text-blue-600',   status: 'Connected',     desc: 'Email & directory sync',    connected: true  },
    { name: 'SIEM / Splunk',      icon: 'fas fa-magnifying-glass-chart', bgIcon: 'bg-orange-100', textIcon: 'text-orange-600', status: 'Connected',     desc: 'Log ingestion & alerts',    connected: true  },
    { name: 'Active Directory',   icon: 'fas fa-sitemap',                bgIcon: 'bg-indigo-100', textIcon: 'text-indigo-600', status: 'Connected',     desc: 'User provisioning',         connected: true  },
    { name: 'Slack',              icon: 'fa-brands fa-slack',            bgIcon: 'bg-purple-100', textIcon: 'text-purple-600', status: 'Connected',     desc: 'Channel alerts',            connected: true  },
    { name: 'Microsoft Teams',    icon: 'fas fa-users-gear',             bgIcon: 'bg-sky-100',    textIcon: 'text-sky-600',    status: 'Connected',     desc: 'Team notifications',        connected: true  },
    { name: 'Hardware Inventory', icon: 'fas fa-microchip',              bgIcon: 'bg-blue-100',   textIcon: 'text-blue-600',   status: 'Connected',     desc: 'Local hardware asset sync', connected: true  },
    { name: 'Software Inventory', icon: 'fas fa-box',                    bgIcon: 'bg-purple-100', textIcon: 'text-purple-600', status: 'Connected',     desc: 'Local software asset sync', connected: true  },
    { name: 'VirusTotal',         icon: 'fas fa-virus',                  bgIcon: 'bg-red-100',    textIcon: 'text-red-600',    status: 'Not connected', desc: 'File / URL lookups',        connected: false },
    { name: 'Shodan',             icon: 'fas fa-network-wired',          bgIcon: 'bg-amber-100',  textIcon: 'text-amber-600',  status: 'Not connected', desc: 'External recon',            connected: false },
    { name: 'PagerDuty',          icon: 'fas fa-phone-volume',           bgIcon: 'bg-pink-100',   textIcon: 'text-pink-600',   status: 'Not connected', desc: 'On-call escalation',        connected: false },
    { name: 'Custom Webhooks',    icon: 'fas fa-code',                   bgIcon: 'bg-emerald-100',textIcon: 'text-emerald-600',status: 'Partial',       desc: 'Outbound events',           connected: true  },
];

const STATUS_CLASSES: Record<Integration['status'], string> = {
    'Connected':     'bg-emerald-50 text-emerald-700',
    'Partial':       'bg-amber-50 text-amber-700',
    'Not connected': 'bg-gray-100 text-gray-600',
};

export default function IntegrationsTab() {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-xl font-bold text-gray-900">Integrations</h3>
            <p className="mb-6 border-b border-gray-100 pb-5 text-sm text-gray-500">
                Connect external tools and data sources
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {INTEGRATIONS.map((int) => (
                    <div key={int.name} className="rounded-xl border border-gray-200 p-4 transition hover:shadow-md">
                        <div className="mb-3 flex items-start gap-3">
                            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${int.bgIcon} ${int.textIcon}`}>
                                <i className={int.icon} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="truncate font-bold text-gray-900">{int.name}</h4>
                                <p className="truncate text-[11px] text-gray-500">{int.desc}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_CLASSES[int.status]}`}>
                                {int.status}
                            </span>
                            <button className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 transition hover:bg-blue-100">
                                {int.connected ? 'Manage' : 'Connect'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
