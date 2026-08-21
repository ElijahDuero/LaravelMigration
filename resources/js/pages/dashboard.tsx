import AppLayout from '@/components/AppLayout';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface IncidentStats {
    total: number;
    open: number;
    critical: number;
    high_crit: number;
    closed: number;
}
interface TrendPoint {
    month: string;
    ym: string;
    incidents: number;
    closed: number;
}
interface SeverityItem {
    label: string;
    count: number;
    pct: number;
    color: string;
    bg: string;
    text: string;
    icon: string;
}
interface CategoryItem {
    name: string;
    color: string;
    count: number;
}
interface BranchBreakdown {
    branch: string;
    total: number;
    high_crit: number;
    closed: number;
}
interface RecentIncident {
    id: number;
    incident_number: string;
    description: string | null;
    branch: string | null;
    severity: string;
    workflow_status: string;
    reporter_name: string | null;
    reported_at: string | null;
}
interface AssetStats  { hardware: number; software: number; total: number; }
interface RiskStats   { total: number; high_open: number; }
interface ThreatStats { active: number; critical: number; }

interface Props {
    incidentStats:  IncidentStats;
    trendData:      TrendPoint[];
    severityData:   SeverityItem[];
    categoryData:   CategoryItem[];
    branchBreakdown: BranchBreakdown[];
    recentIncidents: RecentIncident[];
    assetStats:     AssetStats;
    riskStats:      RiskStats;
    threatStats:    ThreatStats;
    postureScore:   number;
    activeBranches: number;
}

// ── Badge helpers ──────────────────────────────────────────────────────────────
const SEV_BADGE: Record<string, string> = {
    Critical: 'border border-red-200 bg-red-50 text-red-700',
    High:     'border border-orange-200 bg-orange-50 text-orange-700',
    Medium:   'border border-yellow-200 bg-yellow-50 text-yellow-700',
    Low:      'border border-green-200 bg-green-50 text-green-700',
};
const SEV_ICON: Record<string, string> = {
    Critical: 'fa-skull-crossbones', High: 'fa-arrow-up', Medium: 'fa-minus', Low: 'fa-arrow-down',
};
const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
    draft:         { cls: 'bg-gray-100 text-gray-700',    label: 'Draft' },
    reported:      { cls: 'bg-purple-100 text-purple-700', label: 'Reported' },
    assigned:      { cls: 'bg-blue-100 text-blue-700',    label: 'Assigned' },
    investigation: { cls: 'bg-indigo-100 text-indigo-700', label: 'Investigating' },
    containment:   { cls: 'bg-amber-100 text-amber-700',  label: 'Containment' },
    eradication:   { cls: 'bg-orange-100 text-orange-700', label: 'Eradication' },
    recovery:      { cls: 'bg-cyan-100 text-cyan-700',    label: 'Recovery' },
    lessons:       { cls: 'bg-yellow-100 text-yellow-700', label: 'Lessons Learned' },
    closed:        { cls: 'bg-green-100 text-green-700',  label: 'Closed' },
};

function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Donut gauge (pure SVG — no Chart.js needed) ────────────────────────────────
function Donut({ value, of, stroke, track = '#e5e7eb', size = 88, strokeWidth = 9 }:
    { value: number; of: number; stroke: string; track?: string; size?: number; strokeWidth?: number }) {
    const safeOf = Math.max(of, 1);
    const pct    = Math.min(100, Math.max(0, (value / safeOf) * 100));
    const r      = (size / 2) - (strokeWidth / 2) - 2;
    const c      = 2 * Math.PI * r;
    const dash   = (pct / 100) * c;
    const gap    = c - dash;
    const mid    = size / 2;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            <circle cx={mid} cy={mid} r={r} fill="none" stroke={track} strokeWidth={strokeWidth} />
            <circle cx={mid} cy={mid} r={r} fill="none" stroke={stroke} strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${dash.toFixed(2)} ${gap.toFixed(2)}`}
                className="transition-all duration-700"
            />
        </svg>
    );
}

// ── Mini spark bar chart (inline SVG) ─────────────────────────────────────────
function SparkBars({ data, color = '#34d399' }: { data: number[]; color?: string }) {
    const max = Math.max(...data, 1);
    return (
        <div className="flex items-end gap-0.5 h-10">
            {data.map((v, i) => (
                <div
                    key={i}
                    className="flex-1 rounded-t transition"
                    style={{
                        height: v > 0 ? `${Math.max(4, Math.round((v / max) * 40))}px` : '2px',
                        backgroundColor: color,
                        opacity: v === 0 ? 0.3 : 1,
                    }}
                    title={`${v}`}
                />
            ))}
        </div>
    );
}

// ── Mini trend line (inline SVG) ──────────────────────────────────────────────
function TrendLine({ data }: { data: TrendPoint[] }) {
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);
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

            {/* HTML Month labels */}
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
                    <p className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">{data[hoverIdx].month}</p>
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

// ── Quick action link ──────────────────────────────────────────────────────────
function QuickAction({ href, icon, bg, hoverBorder, hoverBg, hoverIcon, title, sub }:
    { href: string; icon: string; bg: string; hoverBorder: string; hoverBg: string; hoverIcon: string; title: string; sub: string }) {
    return (
        <Link href={href} className={`flex items-center p-3.5 border border-gray-200 rounded-xl hover:${hoverBorder} hover:${hoverBg} transition group`}>
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mr-3 transition`}>
                <i className={`fas ${icon} ${hoverIcon}`}></i>
            </div>
            <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{title}</p>
                <p className="text-xs text-gray-500">{sub}</p>
            </div>
            <i className="fas fa-chevron-right text-gray-300 text-xs group-hover:translate-x-0.5 transition"></i>
        </Link>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Dashboard({
    incidentStats,
    trendData,
    severityData,
    categoryData,
    branchBreakdown,
    recentIncidents,
    assetStats,
    riskStats,
    threatStats,
    postureScore,
    activeBranches,
}: Props) {
    const { auth } = usePage<any>().props;
    const role = auth.user?.role ?? '';
    const isAdmin = ['super_admin', 'admin', 'cyber_security', 'it'].includes(role);

    const { total, open, critical, high_crit, closed } = incidentStats;
    const sevTotal    = Math.max(total, 1);
    const highCritPct = Math.round((high_crit / sevTotal) * 100);
    const closedPct   = Math.round((closed    / sevTotal) * 100);
    const openPct     = Math.round((open      / sevTotal) * 100);
    const branchMax   = Math.max(activeBranches, 5);
    const branchRowMax = Math.max(...branchBreakdown.map((b) => b.total), 1);
    const catMax      = Math.max(...categoryData.map((c) => c.count), 1);
    const sevMax      = Math.max(...severityData.map((s) => s.count), 1);
    const postureColor = postureScore >= 80 ? 'text-green-600' : postureScore >= 60 ? 'text-amber-600' : 'text-red-600';
    const postureStroke = postureScore >= 80 ? '#16a34a' : postureScore >= 60 ? '#d97706' : '#dc2626';

    return (
        <AppLayout title="Dashboard" subtitle="Security Overview">
            <div className="space-y-6">

                {/* ── KPI Cards ─────────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="card p-6 hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total Incidents</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{total}</p>
                                <p className="text-xs text-gray-500 mt-1 font-medium flex items-center">
                                    <i className="fas fa-database mr-1 text-gray-400"></i> from incident database
                                </p>
                            </div>
                            <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center">
                                <i className="fas fa-triangle-exclamation text-red-400 text-2xl"></i>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6 hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Open Incidents</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{open}</p>
                                <p className="text-xs text-red-600 mt-1 font-medium flex items-center">
                                    <i className="fas fa-skull mr-1"></i>{critical} critical
                                </p>
                            </div>
                            <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center">
                                <i className="fas fa-folder-open text-orange-400 text-2xl"></i>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6 hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Tracked Assets</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{assetStats.total}</p>
                                <p className="text-xs text-blue-600 mt-1 font-medium flex items-center">
                                    <i className="fas fa-microchip mr-1"></i>{assetStats.hardware} hw
                                    &nbsp;&middot;&nbsp;
                                    <i className="fas fa-box mr-1"></i>{assetStats.software} sw
                                </p>
                            </div>
                            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center">
                                <i className="fas fa-server text-blue-400 text-2xl"></i>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6 hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Security Score</p>
                                <p className={`text-3xl font-bold mt-2 ${postureColor}`}>
                                    {postureScore}<span className="text-lg opacity-60">/100</span>
                                </p>
                                <p className="text-xs text-gray-500 mt-1 font-medium flex items-center">
                                    <i className="fas fa-shield-halved mr-1"></i>
                                    {postureScore === 0 ? 'No data yet' : postureScore >= 80 ? 'Good posture' : postureScore >= 60 ? 'Needs attention' : 'At risk'}
                                </p>
                            </div>
                            <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center">
                                <i className="fas fa-shield-halved text-green-400 text-2xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Trend + Severity ──────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Trend chart — 2/3 width */}
                    <div className="card p-6 lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Incident Trend (Last 6 Months)</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    <span className="font-semibold text-gray-700">{total}</span> total incidents recorded
                                </p>
                            </div>
                            <Link href="/incidents" className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                                Open Incidents <i className="fas fa-arrow-right ml-1"></i>
                            </Link>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 rounded"></span>Reported</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-green-500 rounded"></span>Closed</span>
                        </div>

                        {total === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
                                <i className="fas fa-chart-column text-3xl mb-2"></i>
                                No incident data yet.&nbsp;
                                <Link href="/incidents/create" className="text-blue-600 hover:underline font-semibold">
                                    Report an incident
                                </Link>
                            </div>
                        ) : (
                            <div className="text-gray-900 dark:text-white">
                                <TrendLine data={trendData} />
                            </div>
                        )}

                        {/* Snapshot strip */}
                        <div className="mt-5 pt-5 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-semibold text-gray-900">Incident Snapshot</h4>
                                <p className="text-[11px] text-gray-400">Live data</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                                {/* Total donut */}
                                <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 overflow-hidden">
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-shrink-0">
                                            <Donut value={total} of={Math.max(total, 1)} stroke="#334155" track="#e2e8f0" size={56} strokeWidth={6} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-[11px] font-black text-slate-800">{total}</span>
                                            </div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 truncate">Total</p>
                                            <p className="text-base font-bold text-slate-900 truncate">{total}</p>
                                            <p className="text-[11px] text-slate-500 truncate">{open} open</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
                                        <div className="h-full bg-amber-400" style={{ width: `${openPct}%` }} title="Open" />
                                        <div className="h-full bg-emerald-500" style={{ width: `${closedPct}%` }} title="Closed" />
                                    </div>
                                    <div className="mt-1.5 flex justify-between text-[10px] text-slate-400 font-medium truncate">
                                        <span className="truncate pr-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-1"></span>Open</span>
                                        <span className="truncate pl-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span>Closed</span>
                                    </div>
                                </div>

                                {/* High/Critical donut */}
                                <div className="rounded-xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-4 overflow-hidden">
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-shrink-0">
                                            <Donut value={high_crit} of={sevTotal} stroke="#dc2626" track="#fecaca" size={56} strokeWidth={6} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-[11px] font-black text-red-700">{highCritPct}%</span>
                                            </div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-red-500 truncate">High/Crit</p>
                                            <p className="text-base font-bold text-red-700 truncate">{high_crit}</p>
                                            <p className="text-[11px] text-red-400 truncate">of {total}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-1.5">
                                        <div className="h-1.5 rounded-full bg-red-100 overflow-hidden">
                                            <div className="h-full bg-red-500" style={{ width: `${highCritPct}%` }} />
                                        </div>
                                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                            <div className="h-full bg-slate-400" style={{ width: `${100 - highCritPct}%` }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Closed donut */}
                                <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 overflow-hidden">
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-shrink-0">
                                            <Donut value={closed} of={sevTotal} stroke="#059669" track="#a7f3d0" size={56} strokeWidth={6} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-[11px] font-black text-emerald-700">{closedPct}%</span>
                                            </div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600 truncate">Closed</p>
                                            <p className="text-base font-bold text-emerald-700 truncate">{closed}</p>
                                            <p className="text-[11px] text-emerald-500 truncate">closure rate</p>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <SparkBars data={trendData.map((d) => d.closed)} color="#34d399" />
                                        <div className="flex justify-between mt-1">
                                            {trendData.map((d) => (
                                                <span key={d.ym} className="flex-1 text-center text-[9px] text-slate-400 font-medium">
                                                    {d.month[0]}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Branches donut */}
                                <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 overflow-hidden">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="relative flex-shrink-0">
                                            <Donut value={activeBranches} of={branchMax} stroke="#2563eb" track="#bfdbfe" size={56} strokeWidth={6} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-[11px] font-black text-blue-700">{activeBranches}</span>
                                            </div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 truncate">Branches</p>
                                            <p className="text-base font-bold text-blue-700 truncate">{activeBranches}</p>
                                            <p className="text-[11px] text-blue-400 truncate">with incidents</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 max-h-[80px] overflow-y-auto pr-0.5">
                                        {branchBreakdown.length === 0 ? (
                                            <p className="text-[11px] text-slate-400 text-center py-2">No branch data</p>
                                        ) : branchBreakdown.slice(0, 5).map((b) => (
                                            <div key={b.branch}>
                                                <div className="flex items-center justify-between text-[10px] mb-0.5">
                                                    <span className="text-slate-600 font-medium truncate" title={b.branch}>
                                                        {b.branch.length > 14 ? b.branch.slice(0, 12) + '…' : b.branch}
                                                    </span>
                                                    <span className="text-blue-700 font-bold ml-2">{b.total}</span>
                                                </div>
                                                <div className="h-1.5 rounded-full bg-blue-100 overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${Math.round((b.total / branchRowMax) * 100)}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Composition strip */}
                            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Incident Composition</p>
                                    <p className="text-[11px] text-gray-400">{total} total</p>
                                </div>
                                <div className="space-y-2.5">
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-500 mb-1">By status</p>
                                        <div className="h-3 rounded-full overflow-hidden flex bg-gray-200">
                                            {total > 0 && <>
                                                <div className="h-full bg-amber-400"   style={{ width: `${openPct}%`   }} title={`Open: ${open}`} />
                                                <div className="h-full bg-emerald-500" style={{ width: `${closedPct}%` }} title={`Closed: ${closed}`} />
                                            </>}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-500 mb-1">By severity</p>
                                        <div className="h-3 rounded-full overflow-hidden flex bg-gray-200">
                                            {total > 0 && <>
                                                <div className="h-full bg-red-500"   style={{ width: `${highCritPct}%`       }} title={`High/Critical: ${high_crit}`} />
                                                <div className="h-full bg-slate-400" style={{ width: `${100 - highCritPct}%` }} title={`Other: ${total - high_crit}`} />
                                            </>}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-medium text-gray-500">
                                    <span><span className="inline-block w-2 h-2 rounded-sm bg-amber-400 mr-1"></span>Open ({open})</span>
                                    <span><span className="inline-block w-2 h-2 rounded-sm bg-emerald-500 mr-1"></span>Closed ({closed})</span>
                                    <span><span className="inline-block w-2 h-2 rounded-sm bg-red-500 mr-1"></span>High/Critical ({high_crit})</span>
                                    <span><span className="inline-block w-2 h-2 rounded-sm bg-blue-500 mr-1"></span>Branches ({activeBranches})</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Severity + Category — 1/3 width */}
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-5">Severity Distribution</h3>
                        <div className="space-y-4">
                            {total === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-6">No severity data yet.</p>
                            ) : severityData.map((sd) => (
                                <div key={sd.label}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 ${sd.bg} rounded-lg flex items-center justify-center`}>
                                                <i className={`fas ${sd.icon} ${sd.text} text-xs`}></i>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">{sd.label}</span>
                                        </div>
                                        <span className={`text-sm font-bold ${sd.text}`}>{sd.count} ({sd.pct}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div className={`${sd.color} h-2 rounded-full`}
                                            style={{ width: `${Math.round((sd.count / sevMax) * 100)}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-5 border-t border-gray-100">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">By Category</h4>
                            <div className="space-y-2.5">
                                {categoryData.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-4">No category data yet.</p>
                                ) : categoryData.map((cd) => (
                                    <div key={cd.name}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-gray-600">{cd.name}</span>
                                            <span className="text-xs font-bold text-gray-700">{cd.count}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div className={`${cd.color} h-1.5 rounded-full`}
                                                style={{ width: `${Math.round((cd.count / catMax) * 100)}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Recent Incidents + Quick Actions ──────────────────── */}
                {isAdmin ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Recent Incidents */}
                        <div className="card p-6 lg:col-span-2">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">Recent Incidents</h3>
                                <Link href="/incidents" className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                                    View all <i className="fas fa-arrow-right ml-1.5"></i>
                                </Link>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-gray-100">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 text-left">
                                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Incident</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 hidden md:table-cell">Branch</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Severity</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                                            <th className="px-4 py-3 hidden sm:table-cell"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {recentIncidents.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm">
                                                    <i className="fas fa-inbox text-3xl mb-2 block"></i>No incidents yet
                                                </td>
                                            </tr>
                                        ) : recentIncidents.map((inc) => {
                                            const sevCls  = SEV_BADGE[inc.severity] ?? 'bg-gray-100 text-gray-700';
                                            const sevIcon = SEV_ICON[inc.severity]  ?? 'fa-circle';
                                            const sts     = STATUS_BADGE[inc.workflow_status] ?? { cls: 'bg-gray-100 text-gray-700', label: inc.workflow_status };
                                            const title   = inc.description
                                                ? (inc.description.length > 60 ? inc.description.slice(0, 57) + '…' : inc.description)
                                                : 'Untitled incident';
                                            return (
                                                <tr key={inc.id} className="hover:bg-gray-50/50 transition">
                                                    <td className="px-4 py-3.5">
                                                        <Link href={`/incidents/${inc.incident_number}`} className="block min-w-0 group">
                                                            <p className="text-sm font-semibold text-gray-900 truncate max-w-xs group-hover:text-blue-600 transition">{title}</p>
                                                            <p className="text-xs text-blue-600 font-mono mt-0.5">{inc.incident_number}</p>
                                                        </Link>
                                                    </td>
                                                    <td className="px-4 py-3.5 hidden md:table-cell text-sm text-gray-600">
                                                        {inc.branch
                                                            ? <span className="inline-flex items-center"><i className="fas fa-building mr-1.5 text-gray-400 text-xs"></i>{inc.branch}</span>
                                                            : <span className="text-gray-400">—</span>
                                                        }
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${sevCls}`}>
                                                            <i className={`fas ${sevIcon} mr-1 text-[10px]`}></i>{inc.severity}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${sts.cls}`}>{sts.label}</span>
                                                    </td>
                                                    <td className="px-4 py-3.5 hidden sm:table-cell text-right">
                                                        <Link href={`/incidents/${inc.incident_number}`}
                                                            className="text-xs text-gray-400 hover:text-blue-600 hover:underline">View</Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="card p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
                            <div className="space-y-2.5">
                                <Link href="/incidents/create" className="flex items-center p-3.5 border border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50/30 transition group">
                                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                                        <i className="fas fa-plus text-red-600"></i>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-800">Report Incident</p>
                                        <p className="text-xs text-gray-500">Submit a new report</p>
                                    </div>
                                    <i className="fas fa-chevron-right text-gray-300 text-xs group-hover:text-red-500 group-hover:translate-x-0.5 transition"></i>
                                </Link>
                                <Link href="/incidents" className="flex items-center p-3.5 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/30 transition group">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                        <i className="fas fa-list text-blue-600"></i>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-800">Incident List</p>
                                        <p className="text-xs text-gray-500">Browse all reports</p>
                                    </div>
                                    <i className="fas fa-chevron-right text-gray-300 text-xs group-hover:text-blue-500 group-hover:translate-x-0.5 transition"></i>
                                </Link>
                                <Link href="/hardware" className="flex items-center p-3.5 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/30 transition group">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                        <i className="fas fa-server text-purple-600"></i>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-800">Asset Inventory</p>
                                        <p className="text-xs text-gray-500">{assetStats.total} tracked assets</p>
                                    </div>
                                    <i className="fas fa-chevron-right text-gray-300 text-xs group-hover:text-purple-500 group-hover:translate-x-0.5 transition"></i>
                                </Link>
                                <Link href="/risks" className="flex items-center p-3.5 border border-gray-200 rounded-xl hover:border-amber-300 hover:bg-amber-50/30 transition group">
                                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                                        <i className="fas fa-bullseye text-amber-600"></i>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-800">Risk Register</p>
                                        <p className="text-xs text-gray-500">{riskStats.total} identified risks</p>
                                    </div>
                                    <i className="fas fa-chevron-right text-gray-300 text-xs group-hover:text-amber-500 group-hover:translate-x-0.5 transition"></i>
                                </Link>
                                <Link href="/threat-intel" className="flex items-center p-3.5 border border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50/30 transition group">
                                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                                        <i className="fas fa-crosshairs text-red-600"></i>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-800">Threat Intel</p>
                                        <p className="text-xs text-gray-500">{threatStats.active} active indicators</p>
                                    </div>
                                    <i className="fas fa-chevron-right text-gray-300 text-xs group-hover:text-red-500 group-hover:translate-x-0.5 transition"></i>
                                </Link>
                                <Link href="/settings/profile" className="flex items-center p-3.5 border border-gray-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50/30 transition group">
                                    <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center mr-3">
                                        <i className="fas fa-chart-line text-cyan-600"></i>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-800">Security Score</p>
                                        <p className="text-xs text-gray-500">
                                            {postureScore === 0 ? 'No data yet' : `${postureScore}/100 — ${postureScore >= 80 ? 'Good' : postureScore >= 60 ? 'Fair' : 'At Risk'}`}
                                        </p>
                                    </div>
                                    <i className="fas fa-chevron-right text-gray-300 text-xs group-hover:text-cyan-500 group-hover:translate-x-0.5 transition"></i>
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Stats-only view for restricted roles */
                    <div className="card p-8 text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-chart-pie text-blue-600 text-2xl"></i>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Statistics Dashboard</h3>
                        <p className="text-sm text-gray-500 max-w-md mx-auto">
                            You have view-only access to dashboard statistics. Contact your administrator for additional module access.
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
