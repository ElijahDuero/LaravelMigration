import AppLayout from '@/components/AppLayout';
import { router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

interface Filters {
    template: string;
    date_from: string | null;
    date_to: string | null;
}

interface ReportData {
    period: string;
    kpis: Record<string, number | string>;
    severity: Record<string, number>;
    branches: Array<{ branch: string; total: number; high_crit: number; closed: number; closure_rate: number }>;
    branch_scores: Array<{ branch: string; score: number; patch: number; encrypted: number; computers_total: number }>;
    top_systems: Array<{ sys: string; total: number; high_crit: number }>;
    threat_intel: { total: number; active: number; critical: number; phishing: number; ips: number; malware: number; expired: number };
    heat: Array<{ category: string; Low: number; Medium: number; High: number; Critical: number; total: number }>;
    assets: {
        hardware_status: Record<string, number>;
        software_total: number;
        used_licenses: number;
        total_licenses: number;
        license_utilization: number;
        hardware_by_branch: Array<{ branch: string; count: number }>;
    };
}

interface HistoryItem {
    id: number;
    actor: string;
    action: string;
    target: string;
    detail: string | null;
    created_at: string | null;
}

interface Props {
    templates: Record<string, string>;
    filters: Filters;
    report: ReportData;
    history: HistoryItem[];
}

const severityStyle: Record<string, string> = {
    Critical: 'bg-red-500 text-red-700 bg-red-50',
    High: 'bg-orange-500 text-orange-700 bg-orange-50',
    Medium: 'bg-amber-400 text-amber-700 bg-amber-50',
    Low: 'bg-green-500 text-green-700 bg-green-50',
};

function numberFmt(value: number | string | undefined) {
    if (typeof value === 'number') return value.toLocaleString();
    return value ?? 'N/A';
}

function scoreClass(score: number) {
    if (score >= 75) return 'text-green-600 bg-green-50 border-green-100';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-red-600 bg-red-50 border-red-100';
}

function scoreColor(s: number) {
    if (s >= 75) return 'text-green-600';
    if (s >= 50) return 'text-amber-600';
    if (s >= 25) return 'text-orange-600';
    return 'text-red-600';
}
function scoreRing(s: number) {
    if (s >= 75) return '#22c55e';
    if (s >= 50) return '#f59e0b';
    if (s >= 25) return '#f97316';
    return '#ef4444';
}
function scoreBg(s: number) {
    if (s >= 75) return 'bg-green-500';
    if (s >= 50) return 'bg-amber-500';
    if (s >= 25) return 'bg-orange-500';
    return 'bg-red-500';
}

// Mini SVG donut
function Donut({ value, stroke, size = 80, sw = 8 }: { value: number; stroke: string; size?: number; sw?: number }) {
    const r = size / 2 - sw / 2 - 2;
    const c = 2 * Math.PI * r;
    const dash = (Math.min(100, Math.max(0, value)) / 100) * c;
    const gap = c - dash;
    const mid = size / 2;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle cx={mid} cy={mid} r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} />
            <circle cx={mid} cy={mid} r={r} fill="none" stroke={stroke} strokeWidth={sw}
                strokeLinecap="round" strokeDasharray={`${dash.toFixed(2)} ${gap.toFixed(2)}`}
                className="transition-all duration-700" />
        </svg>
    );
}

// Heat map cell colour
function heatCellCls(n: number) {
    if (n === 0) return 'bg-gray-100 text-gray-400';
    if (n <= 2) return 'bg-yellow-100 text-yellow-800';
    if (n <= 5) return 'bg-orange-200 text-orange-900';
    return 'bg-red-400 text-white font-bold';
}

function dateTime(value: string | null) {
    if (!value) return 'N/A';
    return new Date(value.replace(' ', 'T')).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
}

export default function ReportsIndex({ templates, filters, report, history }: Props) {
    const [template, setTemplate] = useState(filters.template);
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [liveReport, setLiveReport] = useState(report);
    const [liveHistory, setLiveHistory] = useState(history);
    const [lastSync, setLastSync] = useState<string>('Just now');
    const [loading, setLoading] = useState(false);

    const exportQuery = useMemo(() => new URLSearchParams({
        template,
        ...(dateFrom ? { date_from: dateFrom } : {}),
        ...(dateTo ? { date_to: dateTo } : {}),
    }).toString(), [template, dateFrom, dateTo]);

    function applyFilters(e: React.FormEvent) {
        e.preventDefault();
        router.get('/reports', { template, date_from: dateFrom, date_to: dateTo }, { preserveState: true });
    }

    function quickRange(days: number) {
        const to = new Date();
        const from = new Date();
        from.setDate(to.getDate() - days);
        const fmt = (d: Date) => d.toISOString().slice(0, 10);
        setDateFrom(fmt(from));
        setDateTo(fmt(to));
    }

    useEffect(() => {
        setLiveReport(report);
        setLiveHistory(history);
    }, [report, history]);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setLoading(true);
            fetch(`/reports/data?${exportQuery}`, { headers: { Accept: 'application/json' } })
                .then((r) => r.json())
                .then((payload) => {
                    setLiveReport(payload.report);
                    setLiveHistory(payload.history);
                    setLastSync(payload.ts ?? 'Updated');
                })
                .finally(() => setLoading(false));
        }, 30000);
        return () => window.clearInterval(timer);
    }, [exportQuery]);

    const totalIncidents = Number(liveReport.kpis.total_incidents ?? 0);
    const severityTotal = Math.max(1, totalIncidents);
    const maxBranchIncidents = Math.max(1, ...liveReport.branches.map((row) => row.total));
    const maxHardwareBranch = Math.max(1, ...liveReport.assets.hardware_by_branch.map((row) => row.count));

    return (
        <AppLayout title="Reports" subtitle="Generate security reports and export executive summaries">
            <div className="space-y-6">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="relative flex h-2.5 w-2.5">
                            {loading && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${loading ? 'bg-indigo-500' : 'bg-green-500'}`}></span>
                        </span>
                        <span className="font-bold text-indigo-700">Live Reports</span>
                        <span className="text-indigo-500">auto-refreshes every 30 seconds</span>
                    </div>
                    <span className="text-xs text-indigo-500 font-mono">Last sync: {lastSync}</span>
                </div>

                <form onSubmit={applyFilters} className="card p-5">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Report Template</label>
                            <select className="form-input w-full" value={template} onChange={(e) => setTemplate(e.target.value)}>
                                {Object.entries(templates).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Date From</label>
                            <input type="date" className="form-input w-full" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Date To</label>
                            <input type="date" className="form-input w-full" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                        </div>
                        <button type="submit" className="btn btn-primary justify-center h-10">
                            <i className="fas fa-filter mr-2"></i>Apply
                        </button>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => quickRange(7)} className="btn btn-secondary text-xs py-1.5">Last 7 days</button>
                            <button type="button" onClick={() => quickRange(30)} className="btn btn-secondary text-xs py-1.5">Last 30 days</button>
                            <button type="button" onClick={() => { setDateFrom(''); setDateTo(''); }} className="btn btn-secondary text-xs py-1.5">All records</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <a href={`/reports/export/csv?${exportQuery}`} className="btn btn-secondary text-sm">
                                <i className="fas fa-file-csv mr-2"></i>Export CSV
                            </a>
                            <a href={`/reports/export/pdf?${exportQuery}`} target="_blank" className="btn bg-red-600 text-white hover:bg-red-700 border border-red-700 text-sm">
                                <i className="fas fa-file-pdf mr-2"></i>Export PDF
                            </a>
                        </div>
                    </div>
                </form>

                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
                    {[
                        ['Total Incidents', liveReport.kpis.total_incidents, 'fa-triangle-exclamation', 'bg-blue-50 text-blue-600'],
                        ['Critical', liveReport.kpis.critical, 'fa-skull-crossbones', 'bg-red-50 text-red-600'],
                        ['Open Now', liveReport.kpis.open, 'fa-lock-open', 'bg-orange-50 text-orange-600'],
                        ['Closure Rate', `${liveReport.kpis.closure_rate}%`, 'fa-circle-check', 'bg-emerald-50 text-emerald-600'],
                        ['MTTR', liveReport.kpis.mttr, 'fa-stopwatch', 'bg-indigo-50 text-indigo-600'],
                        ['Compliance', `${liveReport.kpis.compliance_score}%`, 'fa-shield-halved', 'bg-green-50 text-green-600'],
                    ].map(([label, value, icon, cls]) => (
                        <div key={label as string} className="card p-4 hover:shadow-md transition">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
                                    <p className="text-2xl font-black text-gray-900 mt-1 truncate">{numberFmt(value as string | number)}</p>
                                </div>
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${cls}`}>
                                    <i className={`fas ${icon} text-sm`}></i>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="card p-6 xl:col-span-2">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Incidents by Branch</h3>
                                <p className="text-sm text-gray-500">{liveReport.period}</p>
                            </div>
                            <span className="text-xs font-bold text-gray-400">Top {liveReport.branches.length}</span>
                        </div>
                        <div className="space-y-4">
                            {liveReport.branches.length === 0 ? (
                                <p className="text-sm text-gray-400 italic py-8 text-center">No branch incident data for this period.</p>
                            ) : liveReport.branches.map((row) => {
                                const width = Math.round((row.total / maxBranchIncidents) * 100);
                                return (
                                    <div key={row.branch}>
                                        <div className="flex items-center justify-between text-sm mb-1.5 gap-3">
                                            <span className="font-bold text-gray-800 truncate">{row.branch}</span>
                                            <span className="text-xs text-gray-500 flex-shrink-0">
                                                <strong className="text-gray-900">{row.total}</strong> incidents
                                                {row.high_crit > 0 && <span className="text-red-600 font-bold ml-2">{row.high_crit} high/critical</span>}
                                            </span>
                                        </div>
                                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${width}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="card p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-5">Severity Mix</h3>
                        <div className="space-y-4">
                            {Object.entries(liveReport.severity).map(([label, count]) => {
                                const pct = Math.round((count / severityTotal) * 100);
                                const [bar, text, bg] = severityStyle[label]?.split(' ') ?? ['bg-gray-500', 'text-gray-600', 'bg-gray-50'];
                                return (
                                    <div key={label}>
                                        <div className="flex items-center justify-between text-sm mb-1.5">
                                            <span className={`inline-flex items-center gap-2 font-bold ${text}`}>
                                                <span className={`w-2.5 h-2.5 rounded-full ${bar}`}></span>{label}
                                            </span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${text} ${bg}`}>{count} ({pct}%)</span>
                                        </div>
                                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="card p-6 xl:col-span-2">
                        <h3 className="text-lg font-bold text-gray-900 mb-5">Branch Performance</h3>
                        <div className="overflow-x-auto rounded-xl border border-gray-100">
                            <table className="w-full data-table">
                                <thead>
                                    <tr>
                                        <th>Branch</th>
                                        <th>Score</th>
                                        <th>Patch</th>
                                        <th>Encrypted</th>
                                        <th>Computers</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {liveReport.branch_scores.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-10 text-gray-400">No branch security records yet.</td></tr>
                                    ) : liveReport.branch_scores.map((row) => (
                                        <tr key={row.branch}>
                                            <td className="font-semibold text-gray-900">{row.branch}</td>
                                            <td><span className={`inline-flex px-2 py-1 rounded-lg border text-xs font-black ${scoreClass(row.score)}`}>{row.score}%</span></td>
                                            <td>{row.patch}%</td>
                                            <td>{row.encrypted}%</td>
                                            <td>{row.computers_total.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-5">Asset Status</h3>
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <div className="rounded-xl bg-blue-50 p-4">
                                <p className="text-xs font-bold text-blue-600 uppercase">Hardware</p>
                                <p className="text-2xl font-black text-gray-900 mt-1">{numberFmt(liveReport.kpis.hardware_total)}</p>
                            </div>
                            <div className="rounded-xl bg-purple-50 p-4">
                                <p className="text-xs font-bold text-purple-600 uppercase">Software</p>
                                <p className="text-2xl font-black text-gray-900 mt-1">{numberFmt(liveReport.assets.software_total)}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {Object.entries(liveReport.assets.hardware_status).map(([status, count]) => (
                                <div key={status} className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-gray-700">{status}</span>
                                    <span className="font-black text-gray-900">{count}</span>
                                </div>
                            ))}
                            <div className="pt-3 border-t border-gray-100">
                                <div className="flex items-center justify-between text-sm mb-1.5">
                                    <span className="font-semibold text-gray-700">License Utilization</span>
                                    <span className="font-black text-gray-900">{liveReport.assets.license_utilization}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, liveReport.assets.license_utilization)}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="card p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-5">Hardware by Branch</h3>
                        <div className="space-y-3">
                            {liveReport.assets.hardware_by_branch.length === 0 ? (
                                <p className="text-sm text-gray-400 italic py-8 text-center">No hardware branch data yet.</p>
                            ) : liveReport.assets.hardware_by_branch.map((row) => {
                                const width = Math.round((row.count / maxHardwareBranch) * 100);
                                return (
                                    <div key={row.branch}>
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="font-semibold text-gray-800 truncate">{row.branch}</span>
                                            <span className="font-black text-gray-900">{row.count}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${width}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-gray-900">Report History</h3>
                            <span className="text-xs font-bold text-gray-400">Last {liveHistory.length}</span>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-gray-100">
                            <table className="w-full data-table">
                                <thead>
                                    <tr>
                                        <th>Generated</th>
                                        <th>Report</th>
                                        <th>Format</th>
                                        <th>Actor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {liveHistory.length === 0 ? (
                                        <tr><td colSpan={4} className="text-center py-10 text-gray-400">No exports yet. Use CSV or PDF export to create history.</td></tr>
                                    ) : liveHistory.map((item) => (
                                        <tr key={item.id}>
                                            <td className="text-xs text-gray-500 whitespace-nowrap">{dateTime(item.created_at)}</td>
                                            <td className="font-semibold text-gray-900">{templates[item.target] ?? item.target}</td>
                                            <td>
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${item.action.includes('csv') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                                    {item.action.includes('csv') ? 'CSV' : 'PDF'}
                                                </span>
                                            </td>
                                            <td className="text-sm text-gray-600">{item.actor}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                {/* ══ Compliance / Patch / Vuln / No-AV donuts ══════════ */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {(() => {
                        const compScore = Number(liveReport.kpis.compliance_score ?? 0);
                        const patchPct  = Number(liveReport.kpis.patch_pct ?? 0);
                        const openCrit  = Number(liveReport.kpis.open_critical ?? 0);
                        const noAV      = Number(liveReport.kpis.no_av_branches ?? 0);
                        const donuts = [
                            { label: 'Compliance Score',     value: compScore, isPercent: true,  good: compScore >= 75, goodLabel: 'Good',          badLabel: compScore >= 50 ? 'Fair' : 'Needs Work' },
                            { label: 'Patch Compliance',     value: patchPct,  isPercent: true,  good: patchPct >= 75,  goodLabel: 'Compliant',     badLabel: 'Below Target' },
                            { label: 'Open Vulnerabilities', value: openCrit,  isPercent: false, good: openCrit === 0,  goodLabel: 'All Clear',     badLabel: 'Needs Attention' },
                            { label: 'Branches w/o AV',      value: noAV,      isPercent: false, good: noAV === 0,      goodLabel: 'All Protected', badLabel: 'Action Needed' },
                        ];
                        return donuts.map(({ label, value, isPercent, good, goodLabel, badLabel }) => (
                            <div key={label} className="card p-5 flex flex-col items-center text-center">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 leading-tight">{label}</p>
                                {isPercent ? (
                                    <div className="relative w-20 h-20">
                                        <Donut value={value} stroke={scoreRing(value)} />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className={`text-lg font-black ${scoreColor(value)}`}>{value}%</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center ${good ? 'bg-green-100' : 'bg-red-100'}`}>
                                        <span className={`text-2xl font-black ${good ? 'text-green-700' : 'text-red-700'}`}>{value}</span>
                                    </div>
                                )}
                                <span className={`mt-3 text-xs font-bold px-2 py-0.5 rounded-full ${good ? 'text-green-600 bg-green-50' : (isPercent && value >= 50 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50')}`}>
                                    {good ? goodLabel : badLabel}
                                </span>
                            </div>
                        ));
                    })()}
                </div>

                {/* ══ Top Attacked Systems + Threat Intel Summary ════════ */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                    {/* Top Attacked Systems */}
                    <div className="card p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
                            <i className="fas fa-crosshairs mr-2 text-red-500"></i>Top Attacked Systems
                        </h3>
                        {liveReport.top_systems.length === 0 ? (
                            <p className="text-sm text-gray-400 italic py-8 text-center">No system data yet.</p>
                        ) : (() => {
                            const maxSys = Math.max(1, ...liveReport.top_systems.map((r) => r.total));
                            return (
                                <div className="space-y-2.5">
                                    {liveReport.top_systems.map((row, i) => {
                                        const pct     = Math.round((row.total / maxSys) * 100);
                                        const rankCls = i === 0 ? 'bg-red-100 text-red-600' : i === 1 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500';
                                        const barCls  = i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-400' : 'bg-blue-400';
                                        return (
                                            <div key={row.sys} className="flex items-center gap-3">
                                                <span className={`w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center flex-shrink-0 ${rankCls}`}>{i + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between text-xs mb-1">
                                                        <span className="font-mono font-semibold text-gray-800 truncate max-w-[180px]">{row.sys}</span>
                                                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                                            {row.high_crit > 0 && <span className="text-[10px] font-bold text-red-600">{row.high_crit} !</span>}
                                                            <span className="font-bold text-gray-700">{row.total}</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all duration-500 ${barCls}`} style={{ width: `${pct}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Threat Intelligence Summary */}
                    <div className="card p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
                            <i className="fas fa-shield-virus mr-2 text-purple-500"></i>Threat Intelligence Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {([
                                { label: 'Total IOCs',       value: liveReport.threat_intel.total,    color: 'blue',   icon: 'fa-crosshairs' },
                                { label: 'Active Threats',   value: liveReport.threat_intel.active,   color: 'red',    icon: 'fa-triangle-exclamation' },
                                { label: 'Critical IOCs',    value: liveReport.threat_intel.critical, color: 'rose',   icon: 'fa-skull-crossbones' },
                                { label: 'Phishing Domains', value: liveReport.threat_intel.phishing, color: 'purple', icon: 'fa-fish-fins' },
                                { label: 'Malicious IPs',    value: liveReport.threat_intel.ips,      color: 'orange', icon: 'fa-circle-dot' },
                                { label: 'Malware Hashes',   value: liveReport.threat_intel.malware,  color: 'amber',  icon: 'fa-virus' },
                                { label: 'Expired Entries',  value: liveReport.threat_intel.expired,  color: 'gray',   icon: 'fa-clock-rotate-left' },
                            ] as const).map(({ label, value, color, icon }) => (
                                <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-xl p-3 text-center`}>
                                    <div className={`w-7 h-7 bg-${color}-100 text-${color}-600 rounded-lg flex items-center justify-center mx-auto mb-1.5`}>
                                        <i className={`fas ${icon} text-xs`}></i>
                                    </div>
                                    <p className="text-xl font-black text-gray-900">{value}</p>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-0.5 leading-tight">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ══ Risk Heat Map ══════════════════════════════════════ */}
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center">
                        <i className="fas fa-fire mr-2 text-red-500"></i>Risk Heat Map
                        <span className="ml-2 text-sm font-normal text-gray-400">— Incident category × severity matrix</span>
                    </h3>
                    <p className="text-xs text-gray-400 mb-5">Cell values = incident count. Darker = higher concentration.</p>
                    <div className="overflow-x-auto">
                        <table className="text-xs min-w-full">
                            <thead>
                                <tr>
                                    <th className="px-3 py-2 text-left text-gray-500 font-semibold w-44">Category \ Severity</th>
                                    {(['Low', 'Medium', 'High', 'Critical'] as const).map((sev) => (
                                        <th key={sev} className="px-3 py-2 text-center font-bold text-gray-700 w-24">{sev}</th>
                                    ))}
                                    <th className="px-3 py-2 text-center font-bold text-gray-500 w-16">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {liveReport.heat.map((row) => (
                                    <tr key={row.category} className="hover:bg-gray-50 transition">
                                        <td className="px-3 py-2.5 font-semibold text-gray-700 truncate max-w-[160px]">{row.category}</td>
                                        {(['Low', 'Medium', 'High', 'Critical'] as const).map((sev) => (
                                            <td key={sev} className="px-3 py-2.5 text-center">
                                                <span className={`inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs ${heatCellCls(row[sev])}`}>
                                                    {row[sev] > 0 ? row[sev] : '—'}
                                                </span>
                                            </td>
                                        ))}
                                        <td className="px-3 py-2.5 text-center font-bold text-gray-700">{row.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center gap-4 mt-4 flex-wrap text-xs text-gray-500">
                        <span className="font-semibold">Legend:</span>
                        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-gray-100 border border-gray-200 inline-block"></span> 0</span>
                        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-yellow-100 inline-block"></span> 1–2</span>
                        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-orange-200 inline-block"></span> 3–5</span>
                        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-red-400 inline-block"></span> 6+</span>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
