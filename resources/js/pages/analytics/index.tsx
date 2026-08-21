import AppLayout from '@/components/AppLayout';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Kpis {
    total: number;
    resolved: number;
    open: number;
    resolve_pct: number;
    avg_response: string;
    avg_detect: string;
    avg_resolve: string;
}
interface BranchRow {
    branch: string;
    total: number;
    high_crit: number;
    closed: number;
    critical: number;
}
interface SystemRow {
    sys: string;
    total: number;
    high_crit: number;
}
interface OsRow {
    os: string;
    total: number;
    high_crit: number;
}
interface CategoryRow {
    category: string;
    total: number;
    critical: number;
    high: number;
}
interface RepeatRow {
    branch: string;
    category: string;
    occurrences: number;
    last_seen: string | null;
    high_crit: number;
}
interface PhishingRow {
    reporter_name: string;
    times: number;
    last_incident: string | null;
    branches: string | null;
    departments: string | null;
}
interface TrendPoint {
    label: string;
    month: string;
    year: string;
    ym: string;
    count: number;
    incidents: number;
    closed: number;
}
interface Props {
    range: string;
    ranges: Record<string, string>;
    kpis: Kpis;
    by_branch: BranchRow[];
    by_system: SystemRow[];
    by_os: OsRow[];
    by_category: CategoryRow[];
    repeat: RepeatRow[];
    phishing: PhishingRow[];
    trend: TrendPoint[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtNum(n: number): string {
    return n.toLocaleString();
}
function fmtDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function SparkLine({ data }: { data: TrendPoint[] }) {
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);
    if (!data.length) return null;
    const W = 480; const H = 140;
    const pts = data.map((d, i) => ({ x: (i / (data.length - 1 || 1)) * W, incidents: d.incidents, closed: d.closed }));
    const maxV = Math.max(...data.map((d) => Math.max(d.incidents, d.closed)), 1);
    const xStep = W / Math.max(data.length - 1, 1);

    function toY(v: number) { return H - Math.round((v / maxV) * (H - 24)) - 10; }

    function pathD(values: number[]) {
        return values
            .map((v, i) => {
                const x = pts[i].x;
                const y = toY(v);
                if (i === 0) return `M ${x} ${y}`;
                // Cubic bezier for smooth curves
                const px  = pts[i - 1].x;
                const py  = toY(values[i - 1]);
                const cpx = (px + x) / 2;
                return `C ${cpx} ${py} ${cpx} ${y} ${x} ${y}`;
            })
            .join(' ');
    }

    const repPath    = pathD(data.map((d) => d.incidents));
    const closedPath = pathD(data.map((d) => d.closed));
    const maxRep     = Math.max(...data.map((d) => d.incidents));

    return (
        <div className="relative w-full h-[140px] mb-6 mt-2 group">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
                    <line key={i} x1={0} y1={toY(Math.round(maxV * f))} x2={W} y2={toY(Math.round(maxV * f))}
                        stroke="currentColor" strokeOpacity={0.06} strokeWidth={1} vectorEffect="non-scaling-stroke" />
                ))}
                {/* Gradient fill */}
                <defs>
                    <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={`${repPath} L ${pts[pts.length-1].x} ${H} L 0 ${H} Z`} fill="url(#gradBlue)" />
                <path d={`${closedPath} L ${pts[pts.length-1].x} ${H} L 0 ${H} Z`} fill="url(#gradGreen)" />
                {/* Lines */}
                <path d={repPath}    fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                <path d={closedPath} fill="none" stroke="#22c55e" strokeWidth={2}   strokeLinejoin="round" strokeDasharray="5 3" vectorEffect="non-scaling-stroke" />

                {/* Interactive Tooltip Vertical Line */}
                {hoverIdx !== null && (
                    <line 
                        x1={pts[hoverIdx].x} 
                        y1={0} 
                        x2={pts[hoverIdx].x} 
                        y2={H} 
                        stroke="#94a3b8" 
                        strokeWidth="1.5" 
                        strokeDasharray="4,4"
                        vectorEffect="non-scaling-stroke"
                        className="pointer-events-none"
                    />
                )}

                {/* Invisible interaction areas */}
                {pts.map((p, i) => (
                    <rect
                        key={`hit-${i}`}
                        x={p.x - (xStep / 2)}
                        y={0}
                        width={xStep}
                        height={H}
                        fill="transparent"
                        className="cursor-crosshair"
                        onMouseEnter={() => setHoverIdx(i)}
                        onMouseLeave={() => setHoverIdx(null)}
                    />
                ))}
            </svg>
            
            {/* HTML Data Points - Reported */}
            {data.map((d, i) => {
                const isHovered = hoverIdx === i;
                return (
                    <div
                        key={`rep-${i}`}
                        className="absolute rounded-full border-[1.5px] border-white shadow-sm transition-all pointer-events-none"
                        style={{
                            left: `${(pts[i].x / W) * 100}%`,
                            top: `${(toY(d.incidents) / H) * 100}%`,
                            width: isHovered ? '12px' : (d.incidents > 0 ? '9px' : '5px'),
                            height: isHovered ? '12px' : (d.incidents > 0 ? '9px' : '5px'),
                            backgroundColor: d.incidents === maxRep && d.incidents > 0 ? '#ef4444' : '#3b82f6',
                            transform: 'translate(-50%, -50%)',
                            zIndex: isHovered ? 20 : 10
                        }}
                    />
                );
            })}
            
            {/* HTML Data Points - Closed */}
            {data.map((d, i) => {
                const isHovered = hoverIdx === i;
                if (d.closed === 0 && !isHovered) return null;
                return (
                    <div
                        key={`cls-${i}`}
                        className="absolute rounded-full border-[1.5px] border-white shadow-sm transition-all pointer-events-none"
                        style={{
                            left: `${(pts[i].x / W) * 100}%`,
                            top: `${(toY(d.closed) / H) * 100}%`,
                            width: isHovered ? '11px' : '8px',
                            height: isHovered ? '11px' : '8px',
                            backgroundColor: '#22c55e',
                            transform: 'translate(-50%, -50%)',
                            zIndex: isHovered ? 19 : 9
                        }}
                    />
                );
            })}

            {/* HTML Month labels - Analytics shows 12 months, let's only show every 2nd or 3rd month label so it doesn't get crowded, or all of them if they fit. They should fit. */}
            {data.map((d, i) => (
                <div
                    key={`lbl-${i}`}
                    className="absolute bottom-0 text-[10px] font-semibold text-gray-400 transform -translate-x-1/2 translate-y-6 pointer-events-none"
                    style={{ left: `${(pts[i].x / W) * 100}%` }}
                >
                    {d.month}
                </div>
            ))}

            {/* Interactive HTML Tooltip */}
            {hoverIdx !== null && (
                <div
                    className="absolute pointer-events-none flex flex-col items-start justify-center bg-slate-800 rounded-lg shadow-xl py-2 px-3 z-30 border border-slate-700"
                    style={{
                        left: `${(pts[hoverIdx].x / W) * 100}%`,
                        top: `${(toY(Math.max(data[hoverIdx].incidents, data[hoverIdx].closed)) / H) * 100}%`,
                        transform: `translate(${pts[hoverIdx].x < W / 2 ? '14px' : 'calc(-100% - 14px)'}, -50%)`,
                        whiteSpace: 'nowrap'
                    }}
                >
                    <p className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">{data[hoverIdx].label}</p>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-sm bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.6)]"></span>
                        <span className="text-[11px] font-bold text-slate-50">{data[hoverIdx].incidents} Reported</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-sm bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)]"></span>
                        <span className="text-[11px] font-bold text-slate-50">{data[hoverIdx].closed} Closed</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Bar row component ──────────────────────────────────────────────────────────
function BarRow({
    rank,
    label,
    total,
    maxTotal,
    badge,
    badgeLabel,
    barColor,
    rankColor,
    mono = false,
    barHeight = 'h-2',
}: {
    rank: number;
    label: string;
    total: number;
    maxTotal: number;
    badge?: number;
    badgeLabel?: string;
    barColor: string;
    rankColor: string;
    mono?: boolean;
    barHeight?: string;
}) {
    const pct = Math.round((total / Math.max(maxTotal, 1)) * 100);
    return (
        <div className="flex items-center gap-3">
            <span
                className={`w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center flex-shrink-0 ${rankColor}`}
            >
                {rank}
            </span>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs mb-1">
                    <span className={`font-semibold text-gray-800 truncate max-w-[180px] ${mono ? 'font-mono' : ''}`}>
                        {label}
                    </span>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        {badge !== undefined && badge > 0 && (
                            <span className="text-[10px] font-bold text-orange-600">
                                {badge} {badgeLabel}
                            </span>
                        )}
                        <span className="font-bold text-gray-700">{fmtNum(total)}</span>
                    </div>
                </div>
                <div className={`${barHeight} bg-gray-100 rounded-full overflow-hidden`}>
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

// ── Main page component ────────────────────────────────────────────────────────
export default function AnalyticsIndex() {
    const {
        range: initialRange,
        ranges,
        kpis: initialKpis,
        by_branch: initialBranch,
        by_system: initialSystem,
        by_os: initialOs,
        by_category: initialCat,
        repeat: initialRepeat,
        phishing: initialPhishing,
        trend: initialTrend,
    } = usePage<{ props: Props }>().props as unknown as Props;

    // ── Live-polling state ─────────────────────────────────────────────────
    const [kpis, setKpis]         = useState<Kpis>(initialKpis);
    const [byBranch, setByBranch] = useState<BranchRow[]>(initialBranch);
    const [bySystem, setBySystem] = useState<SystemRow[]>(initialSystem);
    const [byOs, setByOs]         = useState<OsRow[]>(initialOs);
    const [byCat, setByCat]       = useState<CategoryRow[]>(initialCat);
    const [repeat, setRepeat]     = useState<RepeatRow[]>(initialRepeat);
    const [phishing, setPhishing] = useState<PhishingRow[]>(initialPhishing);
    const [trend, setTrend]       = useState<TrendPoint[]>(initialTrend);
    const [liveStatus, setLiveStatus] = useState<'syncing' | 'ok' | 'error'>('syncing');
    const [lastUpdated, setLastUpdated] = useState<string>('Syncing…');
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    function fetchData(range: string) {
        setLiveStatus('syncing');
        fetch(`/analytics/data?range=${encodeURIComponent(range)}`, { credentials: 'same-origin' })
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((d) => {
                setKpis(d.kpis);
                setByBranch(d.by_branch);
                setBySystem(d.by_system);
                setByOs(d.by_os);
                setByCat(d.by_category);
                setRepeat(d.repeat);
                setPhishing(d.phishing);
                setTrend(d.trend);
                setLiveStatus('ok');
                setLastUpdated('Updated ' + d.ts);
            })
            .catch(() => setLiveStatus('error'));
    }

    useEffect(() => {
        fetchData(initialRange);
        timerRef.current = setInterval(() => fetchData(initialRange), 30000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [initialRange]);

    function changeRange(r: string) {
        router.get('/analytics', { range: r }, { preserveState: false });
    }

    // ── Derived maxes ──────────────────────────────────────────────────────
    const maxBranch = Math.max(1, ...(byBranch.map((r) => r.total)));
    const maxSystem = Math.max(1, ...(bySystem.map((r) => r.total)));
    const maxOs     = Math.max(1, ...(byOs.map((r) => r.total)));
    const maxCat    = Math.max(1, ...(byCat.map((r) => r.total)));

    // ── KPI card definitions ───────────────────────────────────────────────
    const kpiCards = [
        { label: 'Total Incidents', value: fmtNum(kpis.total),    icon: 'fa-triangle-exclamation', color: 'blue' },
        { label: 'Resolved',        value: fmtNum(kpis.resolved), icon: 'fa-circle-check',         color: 'green' },
        { label: 'Open',            value: fmtNum(kpis.open),     icon: 'fa-lock-open',            color: 'orange' },
        { label: 'Avg Response',    value: kpis.avg_response,     icon: 'fa-stopwatch',            color: 'indigo' },
        { label: 'Avg Detect',      value: kpis.avg_detect,       icon: 'fa-radar',                color: 'purple' },
        { label: 'Avg Resolve',     value: kpis.avg_resolve,      icon: 'fa-flag-checkered',       color: 'teal' },
    ] as const;

    const colorMap: Record<string, string> = {
        blue:   'bg-blue-50 text-blue-500',
        green:  'bg-green-50 text-green-500',
        orange: 'bg-orange-50 text-orange-500',
        indigo: 'bg-indigo-50 text-indigo-500',
        purple: 'bg-purple-50 text-purple-500',
        teal:   'bg-teal-50 text-teal-500',
    };

    return (
        <AppLayout>
            <div className="space-y-5">

                {/* ── Live indicator bar ───────────────────────────────── */}
                <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                            {liveStatus === 'syncing' && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                            )}
                            <span
                                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                                    liveStatus === 'ok'
                                        ? 'bg-green-500'
                                        : liveStatus === 'error'
                                          ? 'bg-red-500'
                                          : 'bg-indigo-500'
                                }`}
                            />
                        </span>
                        <span className="text-xs font-bold text-indigo-700">Live Dashboard</span>
                        <span className="text-xs text-indigo-500">— auto-refreshes every 30 seconds</span>
                    </div>
                    <span className="text-xs text-indigo-400 font-mono">{lastUpdated}</span>
                </div>

                {/* ── Header + Range filter ────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Security Analytics</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Patterns, trends, and vulnerability insights from incident data
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {Object.entries(ranges).map(([val, label]) => (
                            <button
                                key={val}
                                onClick={() => changeRange(val)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    initialRange === val
                                        ? 'bg-blue-600 text-white shadow'
                                        : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── KPI Strip ───────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {kpiCards.map(({ label, value, icon, color }) => (
                        <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{label}</p>
                                    <p className="text-xl font-black text-gray-900 mt-1">{value}</p>
                                </div>
                                <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}
                                >
                                    <i className={`fas ${icon} text-xs`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Row 1: Branch incidents + Monthly trend ──────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                    {/* Incidents by Branch */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:col-span-3">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                            <i className="fas fa-building mr-2 text-blue-500" />
                            Incidents by Branch
                            <span className="ml-auto text-xs text-gray-400 font-normal">
                                Top {byBranch.length}
                            </span>
                        </h3>
                        {byBranch.length === 0 ? (
                            <p className="text-sm text-gray-400 italic text-center py-8">No branch data yet.</p>
                        ) : (
                            <div className="space-y-2.5">
                                {byBranch.map((row, i) => (
                                    <BarRow
                                        key={row.branch}
                                        rank={i + 1}
                                        label={row.branch}
                                        total={row.total}
                                        maxTotal={maxBranch}
                                        badge={row.critical}
                                        badgeLabel="crit"
                                        barColor={i === 0 ? 'bg-red-500' : 'bg-blue-400'}
                                        rankColor={i === 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}
                                        barHeight="h-2"
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Monthly Trend — SVG sparkline */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                            <i className="fas fa-chart-line mr-2 text-indigo-500" />
                            Monthly Trend
                            <span className="ml-auto text-xs text-gray-400 font-normal">12 months</span>
                        </h3>
                        <SparkLine data={trend} />
                        {trend.length > 0 && (
                            <p className="text-[10px] text-gray-400 text-center mt-1">
                                Peak:{' '}
                                <span className="font-bold text-red-500">
                                    {Math.max(...trend.map((t) => t.count))} incidents
                                </span>{' '}
                                in{' '}
                                {trend.find((t) => t.count === Math.max(...trend.map((x) => x.count)))?.label ?? '—'}
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Row 2: Most Attacked Systems + Category Breakdown ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    {/* Most Attacked Systems */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                            <i className="fas fa-crosshairs mr-2 text-red-500" />
                            Most Attacked Systems
                        </h3>
                        {bySystem.length === 0 ? (
                            <p className="text-sm text-gray-400 italic text-center py-8">No system data recorded yet.</p>
                        ) : (
                            <div className="space-y-2.5">
                                {bySystem.map((row, i) => (
                                    <BarRow
                                        key={row.sys}
                                        rank={i + 1}
                                        label={row.sys}
                                        total={row.total}
                                        maxTotal={maxSystem}
                                        badge={row.high_crit}
                                        badgeLabel="H/C"
                                        barColor={i === 0 ? 'bg-red-500' : 'bg-orange-400'}
                                        rankColor={
                                            i === 0
                                                ? 'bg-red-100 text-red-600'
                                                : i === 1
                                                  ? 'bg-orange-100 text-orange-600'
                                                  : 'bg-gray-100 text-gray-500'
                                        }
                                        mono
                                        barHeight="h-1.5"
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Incidents by Category */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                            <i className="fas fa-tags mr-2 text-purple-500" />
                            Incidents by Category
                        </h3>
                        {byCat.length === 0 ? (
                            <p className="text-sm text-gray-400 italic text-center py-8">No category data yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {byCat.map((row) => {
                                    const pct = Math.round((row.total / maxCat) * 100);
                                    return (
                                        <div key={row.category}>
                                            <div className="flex items-center justify-between text-xs mb-1">
                                                <span className="font-semibold text-gray-700 truncate max-w-[200px]">
                                                    {row.category}
                                                </span>
                                                <span className="font-bold text-gray-700 ml-2 flex-shrink-0">
                                                    {fmtNum(row.total)}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Row 3: Most Vulnerable OS + Repeat Incidents ─────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    {/* Most Vulnerable OS */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center">
                            <i className="fas fa-laptop-code mr-2 text-amber-500" />
                            Most Vulnerable OS / Software
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">
                            Operating systems most frequently seen in incidents
                        </p>
                        {byOs.length === 0 ? (
                            <p className="text-sm text-gray-400 italic text-center py-8">
                                No OS data recorded in incidents yet.
                            </p>
                        ) : (
                            <div className="space-y-2.5">
                                {byOs.map((row) => {
                                    const pct = Math.round((row.total / maxOs) * 100);
                                    return (
                                        <div key={row.os} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                                                <i className="fas fa-desktop text-xs" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span className="font-semibold text-gray-800 truncate max-w-[180px]">
                                                        {row.os}
                                                    </span>
                                                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                                        {row.high_crit > 0 && (
                                                            <span className="text-[10px] font-bold text-red-500">
                                                                {row.high_crit} H/C
                                                            </span>
                                                        )}
                                                        <span className="font-bold text-gray-700">
                                                            {fmtNum(row.total)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Repeat Incidents */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center">
                            <i className="fas fa-rotate-right mr-2 text-rose-500" />
                            Repeat Incidents
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">
                            Same branch + category occurring more than once
                        </p>
                        {repeat.length === 0 ? (
                            <p className="text-sm text-gray-400 italic text-center py-8">
                                No repeat incident patterns detected.
                            </p>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-gray-100">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-rose-50/60 text-left">
                                            <th className="px-3 py-2 font-bold text-gray-500 uppercase tracking-wide">Branch</th>
                                            <th className="px-3 py-2 font-bold text-gray-500 uppercase tracking-wide">Category</th>
                                            <th className="px-3 py-2 font-bold text-gray-500 uppercase tracking-wide text-center">Count</th>
                                            <th className="px-3 py-2 font-bold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Last Seen</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {repeat.map((row, i) => {
                                            const badgeCls =
                                                row.occurrences >= 5
                                                    ? 'bg-red-100 text-red-700'
                                                    : row.occurrences >= 3
                                                      ? 'bg-orange-100 text-orange-700'
                                                      : 'bg-amber-100 text-amber-700';
                                            return (
                                                <tr key={i} className="hover:bg-rose-50/30 transition">
                                                    <td className="px-3 py-2.5 font-semibold text-gray-800 truncate max-w-[120px]">
                                                        {row.branch}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-gray-600 truncate max-w-[140px]">
                                                        {row.category}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        <span
                                                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-xs ${badgeCls}`}
                                                        >
                                                            {row.occurrences}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-gray-500 hidden sm:table-cell">
                                                        {fmtDate(row.last_seen)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Row 4: Phishing Repeat Offenders ─────────────────── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center">
                        <i className="fas fa-fish-fins mr-2 text-purple-600" />
                        Phishing Repeat Offenders
                        <span className="ml-2 text-xs font-normal text-gray-400">
                            Users who appear in multiple phishing incidents
                        </span>
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">
                        Based on reporter name in phishing-category incidents. Use for targeted awareness training.
                    </p>

                    {phishing.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <i className="fas fa-fish-fins text-3xl mb-2 block text-gray-300" />
                            <p className="text-sm font-medium">No repeat phishing incidents found.</p>
                            <p className="text-xs mt-1">
                                This is good news — or no phishing incidents have been recorded yet.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto rounded-xl border border-purple-100">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-purple-50/60 text-left">
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">User</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide text-center">Times</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Branch(es)</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Department(s)</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Last Incident</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Risk</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-purple-50">
                                        {phishing.map((row, i) => {
                                            const t = row.times;
                                            const riskText =
                                                t >= 5 ? 'Critical' : t >= 3 ? 'High' : t >= 2 ? 'Medium' : 'Low';
                                            const riskCls =
                                                t >= 5
                                                    ? 'bg-red-100 text-red-700'
                                                    : t >= 3
                                                      ? 'bg-orange-100 text-orange-700'
                                                      : t >= 2
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-green-100 text-green-700';
                                            const cntCls =
                                                t >= 3 ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700';
                                            const initials = row.reporter_name.substring(0, 2).toUpperCase();
                                            return (
                                                <tr key={i} className="hover:bg-purple-50/30 transition">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-black flex-shrink-0">
                                                                {initials}
                                                            </div>
                                                            <span className="font-semibold text-gray-900">
                                                                {row.reporter_name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span
                                                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm ${cntCls}`}
                                                        >
                                                            {t}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell max-w-[160px] truncate">
                                                        {row.branches ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-600 hidden lg:table-cell max-w-[160px] truncate">
                                                        {row.departments ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                                                        {fmtDate(row.last_incident)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${riskCls}`}
                                                        >
                                                            {riskText}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-gray-400 mt-3">
                                <i className="fas fa-circle-info mr-1" />
                                Risk level: Critical = 5+ incidents, High = 3–4, Medium = 2. Consider enrolling
                                high-risk users in mandatory security awareness training.
                            </p>
                        </>
                    )}
                </div>

            </div>
        </AppLayout>
    );
}
