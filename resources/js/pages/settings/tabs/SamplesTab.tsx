import { useState } from 'react';

export type SampleCounts = {
    incidents: number;
    hardware: number;
    software: number;
    threat_intel: number;
    systems: number;
    branches: number;
};

type Props = { sampleCounts: SampleCounts };

type ModuleConfig = {
    target: string;
    label: string;
    icon: string;
    cardBg: string;
    cardText: string;
    badgeBg: string;
    subtitle: string;
    countKeys: (keyof SampleCounts)[];
};

const MODULES: ModuleConfig[] = [
    {
        target: 'incidents',    label: 'Incidents',           icon: 'fa-triangle-exclamation',
        cardBg: 'bg-red-100',    cardText: 'text-red-600',
        badgeBg: 'bg-red-50 text-red-700',
        subtitle: '85 records · 17 categories · all branches',
        countKeys: ['incidents'],
    },
    {
        target: 'assets',       label: 'Hardware & Software', icon: 'fa-server',
        cardBg: 'bg-blue-100',   cardText: 'text-blue-600',
        badgeBg: 'bg-blue-50 text-blue-700',
        subtitle: '50 records · 5 HW types · 5 SW titles',
        countKeys: ['hardware', 'software'],
    },
    {
        target: 'threat_intel', label: 'Threat Intelligence', icon: 'fa-shield-virus',
        cardBg: 'bg-purple-100', cardText: 'text-purple-600',
        badgeBg: 'bg-purple-50 text-purple-700',
        subtitle: '25 IOCs · 6 indicator types · severity mix',
        countKeys: ['threat_intel'],
    },
    {
        target: 'systems',      label: 'Systems Registry',    icon: 'fa-layer-group',
        cardBg: 'bg-indigo-100', cardText: 'text-indigo-600',
        badgeBg: 'bg-indigo-50 text-indigo-700',
        subtitle: '15 systems · all categories · full fields',
        countKeys: ['systems'],
    },
    {
        target: 'branches',     label: 'Branches & Security', icon: 'fa-building-shield',
        cardBg: 'bg-emerald-100',cardText: 'text-emerald-600',
        badgeBg: 'bg-emerald-50 text-emerald-700',
        subtitle: '8 branches · security posture for 7 sites',
        countKeys: ['branches'],
    },
];

// Static counter badge classes — avoids dynamic Tailwind purging
const COUNTER_CLASSES: Record<string, { border: string; bg: string; text: string; subText: string }> = {
    incidents:    { border: 'border-red-100',    bg: 'bg-red-50',    text: 'text-red-700',    subText: 'text-red-600'    },
    hardware:     { border: 'border-blue-100',   bg: 'bg-blue-50',   text: 'text-blue-700',   subText: 'text-blue-600'   },
    software:     { border: 'border-indigo-100', bg: 'bg-indigo-50', text: 'text-indigo-700', subText: 'text-indigo-600' },
    threat_intel: { border: 'border-purple-100', bg: 'bg-purple-50', text: 'text-purple-700', subText: 'text-purple-600' },
    systems:      { border: 'border-cyan-100',   bg: 'bg-cyan-50',   text: 'text-cyan-700',   subText: 'text-cyan-600'   },
    branches:     { border: 'border-emerald-100',bg: 'bg-emerald-50',text: 'text-emerald-700',subText: 'text-emerald-600'},
};

const COUNTER_ITEMS: { key: keyof SampleCounts; label: string }[] = [
    { key: 'incidents',    label: 'Incidents'   },
    { key: 'hardware',     label: 'Hardware'    },
    { key: 'software',     label: 'Software'    },
    { key: 'threat_intel', label: 'Threat IOCs' },
    { key: 'systems',      label: 'Systems'     },
    { key: 'branches',     label: 'Branches'    },
];

async function apiPost(url: string, body: Record<string, string>): Promise<any> {
    const csrfMeta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
    const csrf = csrfMeta?.content ?? '';
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json' },
        body: JSON.stringify(body),
    });
    return res.json();
}

export default function SamplesTab({ sampleCounts }: Props) {
    const [counts, setCounts]   = useState<SampleCounts>({ ...sampleCounts });
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [results, setResults] = useState<Record<string, { ok: boolean; msg: string }>>({});

    const totalLoaded = Object.values(counts).reduce((s, v) => s + v, 0);

    function getCount(keys: (keyof SampleCounts)[]) {
        return keys.reduce((s, k) => s + counts[k], 0);
    }

    async function seed(target: string) {
        if (!confirm(`Insert demo data for "${target}"?`)) return;
        setLoading((l) => ({ ...l, [target]: true }));
        try {
            const data = await apiPost('/settings/samples/seed', { target });
            if (data.errors?.length) {
                setResults((r) => ({ ...r, [target]: { ok: false, msg: data.errors[0] } }));
            } else {
                setResults((r) => ({ ...r, [target]: { ok: true, msg: 'Loaded sample records successfully.' } }));
                setCounts((c) => ({
                    ...c,
                    ...(target === 'incidents'    ? { incidents:    data.inserted    ?? 0 } : {}),
                    ...(target === 'assets'       ? { hardware: data.hw_inserted ?? 0, software: data.sw_inserted ?? 0 } : {}),
                    ...(target === 'threat_intel' ? { threat_intel: data.inserted    ?? 0 } : {}),
                    ...(target === 'systems'      ? { systems:      data.inserted    ?? 0 } : {}),
                    ...(target === 'branches'     ? { branches:     data.branches    ?? 0 } : {}),
                }));
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Request failed';
            setResults((r) => ({ ...r, [target]: { ok: false, msg } }));
        } finally {
            setLoading((l) => ({ ...l, [target]: false }));
        }
    }

    async function del(target: string) {
        if (!confirm(`Delete "${target}" sample data? This cannot be undone.`)) return;
        const loadKey = `del_${target}`;
        setLoading((l) => ({ ...l, [loadKey]: true }));
        try {
            const data = await apiPost('/settings/samples/delete', { target });
            if (data.errors?.length) {
                setResults((r) => ({ ...r, [target]: { ok: false, msg: data.errors[0] } }));
            } else {
                const deleted: Record<string, number> = data.deleted ?? {};
                const total = Object.values(deleted).reduce((s, v) => s + Number(v), 0);
                setResults((r) => ({ ...r, [target]: { ok: true, msg: `Deleted ${total} records.` } }));
                const targets = target === 'all'
                    ? ['incidents', 'assets', 'threat_intel', 'systems', 'branches']
                    : [target];
                setCounts((c) => ({
                    ...c,
                    ...(targets.includes('incidents')    ? { incidents: 0 }                : {}),
                    ...(targets.includes('assets')       ? { hardware: 0, software: 0 }    : {}),
                    ...(targets.includes('threat_intel') ? { threat_intel: 0 }             : {}),
                    ...(targets.includes('systems')      ? { systems: 0 }                  : {}),
                    ...(targets.includes('branches')     ? { branches: 0 }                 : {}),
                }));
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Request failed';
            setResults((r) => ({ ...r, [target]: { ok: false, msg } }));
        } finally {
            setLoading((l) => ({ ...l, [loadKey]: false }));
        }
    }

    return (
        <div className="space-y-5">
            {/* Header + live counters */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                            <i className="fas fa-flask text-lg" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Load Test Samples</h3>
                            <p className="text-sm text-gray-500">Seed every module with realistic demo data</p>
                        </div>
                    </div>
                    {totalLoaded > 0 && (
                        <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                            <i className="fas fa-circle-check text-[10px]" />
                            {totalLoaded} sample records in DB
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {COUNTER_ITEMS.map(({ key, label }) => {
                        const cls = COUNTER_CLASSES[key];
                        return (
                            <div key={key} className={`rounded-xl border ${cls.border} ${cls.bg} p-3 text-center`}>
                                <p className={`text-xl font-black ${cls.text}`}>{counts[key]}</p>
                                <p className={`mt-0.5 text-[10px] font-semibold ${cls.subText}`}>{label}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Module cards */}
            {MODULES.map((mod) => {
                const loaded        = getCount(mod.countKeys);
                const res           = results[mod.target];
                const isSeedLoading = loading[mod.target];
                const isDelLoading  = loading[`del_${mod.target}`];

                return (
                    <div key={mod.target} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${mod.cardBg} ${mod.cardText}`}>
                                    <i className={`fas ${mod.icon}`} />
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-gray-900">{mod.label}</h4>
                                    <p className="text-xs text-gray-500">{mod.subtitle}</p>
                                </div>
                            </div>
                            <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${loaded > 0 ? `border border-emerald-200 ${mod.badgeBg}` : 'bg-gray-100 text-gray-500'}`}>
                                {loaded > 0 ? `${loaded} loaded` : 'Not loaded'}
                            </span>
                        </div>

                        {res?.msg && (
                            <div className={`mb-4 rounded-xl border p-3 text-sm font-medium ${res.ok ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
                                <i className={`fas ${res.ok ? 'fa-circle-check' : 'fa-circle-xmark'} mr-2`} />
                                {res.msg}
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={() => seed(mod.target)}
                                disabled={isSeedLoading}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                            >
                                {isSeedLoading ? (
                                    <><i className="fas fa-spinner fa-spin mr-2" />Loading…</>
                                ) : (
                                    <><i className={`fas ${mod.icon} mr-2`} />Load {mod.label}</>
                                )}
                            </button>
                            <button
                                onClick={() => del(mod.target)}
                                disabled={loaded === 0 || isDelLoading}
                                className={`rounded-lg border px-4 py-2 text-sm font-bold transition ${
                                    loaded > 0
                                        ? 'border-red-300 bg-white text-red-700 hover:border-red-600 hover:bg-red-600 hover:text-white'
                                        : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                                }`}
                            >
                                {isDelLoading ? (
                                    <><i className="fas fa-spinner fa-spin mr-2" />Deleting…</>
                                ) : (
                                    <><i className="fas fa-trash mr-2" />Delete Samples</>
                                )}
                            </button>
                        </div>
                    </div>
                );
            })}

            {/* Delete all */}
            <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                        <i className="fas fa-bomb" />
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-gray-900">Delete All Sample Data</h4>
                        <p className="text-xs text-gray-500">Wipes every sample record across all modules. Real data is never touched.</p>
                    </div>
                </div>

                {results['all']?.msg && (
                    <div className={`mb-4 rounded-xl border p-3 text-sm font-medium ${results['all'].ok ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
                        <i className={`fas ${results['all'].ok ? 'fa-circle-check' : 'fa-circle-xmark'} mr-2`} />
                        {results['all'].msg}
                    </div>
                )}

                <button
                    onClick={() => del('all')}
                    disabled={totalLoaded === 0 || loading['del_all']}
                    className={`rounded-lg border px-5 py-2.5 text-sm font-bold transition ${
                        totalLoaded > 0
                            ? 'border-red-400 bg-white text-red-700 hover:border-red-600 hover:bg-red-600 hover:text-white'
                            : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                    }`}
                >
                    {loading['del_all'] ? (
                        <><i className="fas fa-spinner fa-spin mr-2" />Deleting…</>
                    ) : (
                        <>
                            <i className="fas fa-trash-can mr-2" />
                            Delete All Sample Data
                            {totalLoaded > 0 && <span className="ml-1 text-xs opacity-70">({totalLoaded} records)</span>}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
