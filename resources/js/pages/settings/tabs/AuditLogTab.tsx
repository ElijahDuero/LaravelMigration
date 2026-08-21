import { router } from '@inertiajs/react';
import { useState } from 'react';

export type AuditRow = {
    id: number;
    actor: string;
    role: string | null;
    module: string;
    action: string;
    target: string | null;
    detail: string | null;
    ip_address: string | null;
    created_at: string;
};

export type AuditData = {
    rows: AuditRow[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
    filters: { module: string; date: string; search: string };
    modules: string[];
};

export type ModMeta = Record<string, { color: string; icon: string; label: string }>;

// Static icon+badge classes — avoids Tailwind purging dynamic interpolation
const MOD_CLASSES: Record<string, { iconBg: string; iconText: string; badgeBg: string; badgeText: string }> = {
    auth:          { iconBg: 'bg-blue-100',    iconText: 'text-blue-600',    badgeBg: 'bg-blue-50',    badgeText: 'text-blue-700'    },
    incidents:     { iconBg: 'bg-amber-100',   iconText: 'text-amber-600',   badgeBg: 'bg-amber-50',   badgeText: 'text-amber-700'   },
    hardware:      { iconBg: 'bg-sky-100',     iconText: 'text-sky-600',     badgeBg: 'bg-sky-50',     badgeText: 'text-sky-700'     },
    software:      { iconBg: 'bg-purple-100',  iconText: 'text-purple-600',  badgeBg: 'bg-purple-50',  badgeText: 'text-purple-700'  },
    systems:       { iconBg: 'bg-indigo-100',  iconText: 'text-indigo-600',  badgeBg: 'bg-indigo-50',  badgeText: 'text-indigo-700'  },
    threat_intel:  { iconBg: 'bg-red-100',     iconText: 'text-red-600',     badgeBg: 'bg-red-50',     badgeText: 'text-red-700'     },
    risks:         { iconBg: 'bg-orange-100',  iconText: 'text-orange-600',  badgeBg: 'bg-orange-50',  badgeText: 'text-orange-700'  },
    branches:      { iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-700' },
    users:         { iconBg: 'bg-cyan-100',    iconText: 'text-cyan-600',    badgeBg: 'bg-cyan-50',    badgeText: 'text-cyan-700'    },
    reports:       { iconBg: 'bg-teal-100',    iconText: 'text-teal-600',    badgeBg: 'bg-teal-50',    badgeText: 'text-teal-700'    },
    notifications: { iconBg: 'bg-pink-100',    iconText: 'text-pink-600',    badgeBg: 'bg-pink-50',    badgeText: 'text-pink-700'    },
    samples:       { iconBg: 'bg-violet-100',  iconText: 'text-violet-600',  badgeBg: 'bg-violet-50',  badgeText: 'text-violet-700'  },
    settings:      { iconBg: 'bg-gray-100',    iconText: 'text-gray-600',    badgeBg: 'bg-gray-50',    badgeText: 'text-gray-700'    },
    system:        { iconBg: 'bg-slate-100',   iconText: 'text-slate-600',   badgeBg: 'bg-slate-50',   badgeText: 'text-slate-700'   },
};

const DEFAULT_CLS = { iconBg: 'bg-gray-100', iconText: 'text-gray-600', badgeBg: 'bg-gray-50', badgeText: 'text-gray-700' };

type Props = { auditData: AuditData; modMeta: ModMeta };

export default function AuditLogTab({ auditData, modMeta }: Props) {
    const { rows, total, page, totalPages, filters, modules } = auditData;

    const [mod,    setMod]    = useState(filters.module);
    const [date,   setDate]   = useState(filters.date);
    const [search, setSearch] = useState(filters.search);

    function applyFilter(overrides: Record<string, string | number> = {}) {
        router.get('/settings', { tab: 'audit', module: mod, date, q: search, apage: 1, ...overrides }, {
            preserveState: true, preserveScroll: true, replace: true,
        });
    }

    function goPage(p: number) {
        router.get('/settings', { tab: 'audit', module: mod, date, q: search, apage: p }, {
            preserveState: true, preserveScroll: true, replace: true,
        });
    }

    const exportUrl = `/settings/audit/export?module=${encodeURIComponent(mod)}&date=${encodeURIComponent(date)}&q=${encodeURIComponent(search)}`;

    const offset = (page - 1) * auditData.perPage;

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {/* Header */}
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-5">
                <div>
                    <h3 className="mb-1 text-xl font-bold text-gray-900">Audit Log</h3>
                    <p className="text-sm text-gray-500">
                        Immutable record of all system events —{' '}
                        <strong>{total.toLocaleString()}</strong> entries
                    </p>
                </div>
                <a
                    href={exportUrl}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                    <i className="fas fa-download mr-1.5" />Export CSV
                </a>
            </div>

            {/* Filters */}
            <div className="mb-5 flex flex-wrap gap-2">
                <select
                    value={mod}
                    onChange={(e) => { setMod(e.target.value); applyFilter({ module: e.target.value }); }}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                    <option value="">All Modules</option>
                    {modules.map((m) => (
                        <option key={m} value={m}>
                            {m.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </option>
                    ))}
                </select>

                <input
                    type="date"
                    value={date}
                    onChange={(e) => { setDate(e.target.value); applyFilter({ date: e.target.value }); }}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />

                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                    placeholder="Search actor, action, target…"
                    className="min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />

                <button
                    onClick={() => applyFilter()}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                >
                    <i className="fas fa-search mr-1.5" />Search
                </button>

                {(mod || date || search) && (
                    <button
                        onClick={() => {
                            setMod(''); setDate(''); setSearch('');
                            applyFilter({ module: '', date: '', q: '' });
                        }}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        <i className="fas fa-xmark mr-1.5" />Clear
                    </button>
                )}
            </div>

            {/* Rows */}
            {rows.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                    <i className="fas fa-clipboard-list mb-3 block text-4xl opacity-30" />
                    <p className="font-semibold">No audit entries found</p>
                    <p className="mt-1 text-sm">
                        {(mod || date || search) ? 'Try adjusting the filters.' : 'Actions you take will appear here.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-1.5">
                    {rows.map((a) => {
                        const meta = modMeta[a.module];
                        const cls  = MOD_CLASSES[a.module] ?? DEFAULT_CLS;
                        const icon = meta?.icon ?? 'fa-clipboard-list';
                        const label = meta?.label ?? a.module;
                        return (
                            <div
                                key={a.id}
                                className="group flex items-start gap-3.5 rounded-xl border border-transparent p-3.5 transition hover:border-gray-200 hover:bg-gray-50/60"
                            >
                                <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${cls.iconBg} ${cls.iconText} text-sm`}>
                                    <i className={`fas ${icon}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls.badgeBg} ${cls.badgeText}`}>
                                            {label}
                                        </span>
                                        <span className="text-sm font-bold text-gray-900">{a.actor}</span>
                                        {a.role && (
                                            <span className="text-[10px] font-medium text-gray-400">({a.role})</span>
                                        )}
                                        <span className="text-sm text-gray-700">{a.action}</span>
                                        {a.target && (
                                            <span className="font-mono text-sm font-semibold text-blue-600">{a.target}</span>
                                        )}
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-gray-500">
                                        <span><i className="far fa-clock mr-1" />{a.created_at}</span>
                                        <span className="font-mono">
                                            <i className="fas fa-network-wired mr-1" />{a.ip_address ?? '-'}
                                        </span>
                                        {a.detail && (
                                            <span className="max-w-xs truncate text-gray-400">
                                                <i className="fas fa-circle-info mr-1" />{a.detail}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-500">
                    <span>
                        Showing {(offset + 1).toLocaleString()}–
                        {Math.min(offset + auditData.perPage, total).toLocaleString()} of {total.toLocaleString()}
                    </span>
                    <div className="flex gap-1">
                        {page > 1 && (
                            <button
                                onClick={() => goPage(page - 1)}
                                className="rounded-lg bg-gray-100 px-3 py-1.5 font-semibold transition hover:bg-gray-200"
                            >
                                <i className="fas fa-chevron-left" />
                            </button>
                        )}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                            return (
                                <button
                                    key={p}
                                    onClick={() => goPage(p)}
                                    className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                                        p === page ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                >
                                    {p}
                                </button>
                            );
                        })}
                        {page < totalPages && (
                            <button
                                onClick={() => goPage(page + 1)}
                                className="rounded-lg bg-gray-100 px-3 py-1.5 font-semibold transition hover:bg-gray-200"
                            >
                                <i className="fas fa-chevron-right" />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
