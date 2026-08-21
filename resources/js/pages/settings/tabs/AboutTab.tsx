const ABOUT_STATS = [
    { label: 'Framework', value: 'Laravel 13'      },
    { label: 'Frontend',  value: 'React + Inertia' },
    { label: 'Database',  value: 'MySQL 8'         },
    { label: 'License',   value: 'Enterprise'      },
];

export default function AboutTab() {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-700 text-white">
                <i className="fas fa-shield-halved text-4xl" />
            </div>
            <h3 className="mb-2 text-2xl font-black text-gray-900">
                CyberSec Portal Incident Management
            </h3>
            <p className="mb-1 text-sm text-gray-500">Version 2.4.1 · Build 2026.08.21</p>
            <p className="mx-auto mb-6 max-w-xl text-sm text-gray-500">
                All-in-one cybersecurity governance platform — incident, asset, risk &amp; compliance
                management across your distributed branches.
            </p>

            <div className="mx-auto mb-8 grid max-w-3xl grid-cols-2 gap-4 text-left md:grid-cols-4">
                {ABOUT_STATS.map((s) => (
                    <div key={s.label} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-[11px] font-bold uppercase text-gray-500">{s.label}</p>
                        <p className="mt-1 font-black text-gray-900">{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-center gap-3">
                <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    <i className="fas fa-book mr-2" />Documentation
                </button>
                <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                    <i className="fas fa-rotate mr-2" />Check for Updates
                </button>
            </div>
        </div>
    );
}
