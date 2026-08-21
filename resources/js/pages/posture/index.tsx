import AppLayout from '@/components/AppLayout';
import { Link, usePage } from '@inertiajs/react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Domain {
    icon: string;
    name: string;
    weight: number;
    score: number;
    source: string;
}
interface ModuleStatus {
    label: string;
    total: number;
    sub: string;
    alert: boolean;
    icon: string;
    iconBg: string;
    valueCls: string;
}
interface BranchPosture {
    code: string;
    name: string;
    type: string;
    status: string;
    location: string;
    employees: number;
    score: number;
    has_data: boolean;
    incidents: number;
    hardware: number;
    software: number;
    antivirus: number;
    firewall: number;
    disk_encryption: number;
    password_policy: number;
    mfa: number;
    backup_status: number;
}
interface Props {
    overallScore: number;
    grade: string;
    hasAnyData: boolean;
    incOpen: number;
    incCrit: number;
    tiActive: number;
    tiCrit: number;
    activeBranches: number;
    bsAvg: number;
    riskHighOpen: number;
    domains: Domain[];
    moduleStatus: ModuleStatus[];
    branchPostureList: BranchPosture[];
}

// ── Score colour helpers ───────────────────────────────────────────────────────
function scoreColors(s: number) {
    if (s >= 90) return { text: 'text-emerald-600', bg: 'bg-emerald-500', gradFrom: '#34d399', gradTo: '#10b981', ring: 'ring-emerald-200', light: 'bg-emerald-50', border: 'border-emerald-200', label: 'Excellent' };
    if (s >= 80) return { text: 'text-green-600',   bg: 'bg-green-500',   gradFrom: '#4ade80', gradTo: '#16a34a', ring: 'ring-green-200',   light: 'bg-green-50',   border: 'border-green-200',   label: 'Good' };
    if (s >= 70) return { text: 'text-amber-600',   bg: 'bg-amber-500',   gradFrom: '#fbbf24', gradTo: '#d97706', ring: 'ring-amber-200',   light: 'bg-amber-50',   border: 'border-amber-200',   label: 'Fair' };
    if (s >= 50) return { text: 'text-orange-600',  bg: 'bg-orange-500',  gradFrom: '#fb923c', gradTo: '#ea580c', ring: 'ring-orange-200',  light: 'bg-orange-50',  border: 'border-orange-200',  label: 'At Risk' };
    return             { text: 'text-red-600',      bg: 'bg-red-500',     gradFrom: '#f87171', gradTo: '#dc2626', ring: 'ring-red-200',     light: 'bg-red-50',     border: 'border-red-200',     label: 'Critical' };
}

function grade(s: number): string {
    if (s >= 95) return 'A+';
    if (s >= 90) return 'A';
    if (s >= 87) return 'A-';
    if (s >= 84) return 'B+';
    if (s >= 80) return 'B';
    if (s >= 77) return 'B-';
    if (s >= 74) return 'C+';
    if (s >= 70) return 'C';
    if (s >= 67) return 'C-';
    if (s >= 60) return 'D';
    return 'F';
}

// Control value badge: 0=unknown, 1=no, 2=partial, 3=yes
function CtrlBadge({ v }: { v: number }) {
    if (v === 3) return <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">Yes</span>;
    if (v === 2) return <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Partial</span>;
    if (v === 1) return <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">No</span>;
    return <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">—</span>;
}

// ── SVG Donut gauge ────────────────────────────────────────────────────────────
function PostureDonut({ score }: { score: number }) {
    const r    = 52;
    const circ = 2 * Math.PI * r;
    const fill = (score / 100) * circ;
    const gap  = circ - fill;
    return (
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <defs>
                <linearGradient id="gradPosture" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
            </defs>
            <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
            <circle
                cx="60" cy="60" r={r} fill="none"
                stroke="url(#gradPosture)" strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${fill.toFixed(2)} ${gap.toFixed(2)}`}
            />
        </svg>
    );
}

// ── Domain score bar ───────────────────────────────────────────────────────────
function DomainRow({ domain }: { domain: Domain }) {
    const sc = scoreColors(domain.score);
    const gr = grade(domain.score);
    const toTarget = Math.max(0, 90 - domain.score);
    return (
        <div className="group p-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Icon + name */}
                <div className="flex items-center space-x-4 md:w-80 flex-shrink-0">
                    <div className={`w-14 h-14 rounded-xl ${sc.ring} ring-4 bg-gray-50 flex items-center justify-center flex-shrink-0`}>
                        <div
                            className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-black text-base shadow-inner"
                            style={{ background: `linear-gradient(135deg, ${sc.gradFrom}, ${sc.gradTo})` }}
                        >
                            {domain.score}
                        </div>
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-gray-900">{domain.name}</h4>
                            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-bold">
                                w:{domain.weight}%
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                            <span className={`font-bold px-2 py-0.5 rounded-md ${sc.light} ${sc.text} border ${sc.border}`}>
                                {gr}
                            </span>
                            <span className="text-gray-400 text-[10px] italic">{domain.source}</span>
                        </div>
                    </div>
                </div>
                {/* Progress bar */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                        <span className={`font-semibold ${sc.text}`}>{sc.label}</span>
                        <span className={`font-bold ${sc.text}`}>{domain.score}%</span>
                    </div>
                    <div className="relative h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="absolute inset-y-0 left-0 rounded-full transition-all group-hover:brightness-110"
                            style={{
                                width: `${domain.score}%`,
                                background: `linear-gradient(90deg, ${sc.gradFrom}, ${sc.gradTo})`,
                            }}
                        />
                        {/* Target line at 90% */}
                        <div className="absolute top-0 bottom-0 w-0.5 bg-black/20" style={{ left: '90%' }} title="Target 90%" />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                        Target: 90%&nbsp;&nbsp;|&nbsp;&nbsp;
                        {domain.score >= 90 ? (
                            <span className="text-emerald-600 font-semibold">✓ Met</span>
                        ) : (
                            <span className="text-amber-600 font-semibold">{toTarget} pts to target</span>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function PostureIndex() {
    const {
        overallScore,
        grade: gradeLabel,
        hasAnyData,
        incOpen,
        incCrit,
        tiActive,
        tiCrit,
        activeBranches,
        bsAvg,
        riskHighOpen,
        domains,
        moduleStatus,
        branchPostureList,
    } = usePage<{ props: Props }>().props as unknown as Props;

    const oc = scoreColors(overallScore);
    const toTarget = Math.max(0, 90 - overallScore);

    return (
        <AppLayout>
            <div className="space-y-6">

                {/* ══ ROW 1 — Hero Score + Module Status ══════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Hero card */}
                    <div className="rounded-2xl p-8 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white lg:col-span-2 overflow-hidden relative">
                        <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
                        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="w-full">
                                <p className="text-blue-200 text-sm font-medium mb-1 uppercase tracking-wider">
                                    Overall Security Posture
                                </p>
                                <div className="flex items-end gap-4 mt-3">
                                    {/* Donut ring */}
                                    <div className="relative w-40 h-40 md:w-52 md:h-52 flex-shrink-0">
                                        <PostureDonut score={overallScore} />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-5xl md:text-6xl font-black text-white">{overallScore}</span>
                                            <span className="text-sm md:text-base text-blue-200 mt-0.5">of 100</span>
                                        </div>
                                    </div>
                                    {/* Score details */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                                            <span className="px-4 py-1.5 bg-white/15 backdrop-blur rounded-full text-lg font-black border border-white/20">
                                                {gradeLabel}
                                            </span>
                                            <span className="inline-flex items-center px-3 py-1 bg-white/10 border border-white/20 rounded-full text-blue-100 text-sm font-semibold">
                                                {oc.label}
                                            </span>
                                            {!hasAnyData && (
                                                <span className="text-[11px] text-blue-300/70 italic">
                                                    No data yet — add records to see your score
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm text-blue-200/80">
                                                Target Score:{' '}
                                                <span className="font-bold text-white">90</span>
                                                {overallScore >= 90 ? (
                                                    <span className="text-emerald-300 font-semibold ml-2">✓ Target met</span>
                                                ) : (
                                                    <span className="text-blue-300 ml-1">({toTarget} points to go)</span>
                                                )}
                                            </p>
                                            <div className="w-full max-w-md bg-white/10 rounded-full h-2 mt-2 overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all"
                                                    style={{ width: `${overallScore}%` }}
                                                />
                                            </div>
                                        </div>
                                        {/* Quick stats */}
                                        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10 max-w-md">
                                            <div>
                                                <p className="text-[10px] text-blue-300 uppercase">Open Incidents</p>
                                                <p className={`text-xl font-bold ${incOpen > 0 ? 'text-amber-300' : 'text-white'}`}>
                                                    {incOpen}
                                                </p>
                                                <p className="text-[10px] text-blue-300/70">{incCrit} critical</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-blue-300 uppercase">Active IOCs</p>
                                                <p className={`text-xl font-bold ${tiActive > 0 ? 'text-red-300' : 'text-white'}`}>
                                                    {tiActive}
                                                </p>
                                                <p className="text-[10px] text-blue-300/70">{tiCrit} critical</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-blue-300 uppercase">Branches</p>
                                                <p className="text-xl font-bold text-white">{activeBranches}</p>
                                                <p className="text-[10px] text-blue-300/70">Avg {bsAvg}% posture</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Module status cards */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-1">
                            Live Module Status
                        </h3>
                        {moduleStatus.map((mod) => (
                            <div
                                key={mod.label}
                                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition"
                            >
                                <div className={`w-9 h-9 ${mod.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                    <i className={`fas ${mod.icon} text-sm`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-700">{mod.label}</p>
                                    <p className={`text-[11px] ${mod.valueCls} font-semibold truncate`}>{mod.sub}</p>
                                </div>
                                <span className="text-lg font-black text-gray-900 flex-shrink-0">{mod.total}</span>
                            </div>
                        ))}
                        {riskHighOpen > 0 && (
                            <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
                                <i className="fas fa-circle-exclamation text-red-500 text-sm" />
                                <p className="text-xs text-red-700 font-semibold">
                                    {riskHighOpen} open High/Critical risk{riskHighOpen !== 1 ? 's' : ''}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ══ ROW 2 — Domain Maturity Scores ══════════════════════ */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Domain Maturity Scores</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Composite scores built from live data across all modules
                            </p>
                        </div>
                        <Link
                            href="/reports"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                        >
                            <i className="fas fa-file-lines" />
                            Full Report
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {domains.map((d) => (
                            <DomainRow key={d.name} domain={d} />
                        ))}
                    </div>
                </div>

                {/* ══ ROW 3 — Branch Posture Table ════════════════════════ */}
                {branchPostureList.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Branch Security Posture</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Individual branch scores based on security controls and assets
                                </p>
                            </div>
                            <Link
                                href="/branch-security"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                            >
                                <i className="fas fa-building-shield" />
                                Manage
                            </Link>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-gray-100">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-left">
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Branch</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wide text-center">Score</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">AV</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">FW</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Enc</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">MFA</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Pwd</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Bkp</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Inc</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wide"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {branchPostureList.map((bp, i) => {
                                        const sc = scoreColors(bp.score);
                                        return (
                                            <tr key={bp.code} className="hover:bg-gray-50/60 transition">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className={`w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-emerald-100 text-emerald-700' : i >= branchPostureList.length - 2 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                                            {i + 1}
                                                        </span>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 text-sm">{bp.name}</p>
                                                            <p className="text-[10px] text-gray-400">{bp.code} · {bp.type}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {bp.has_data ? (
                                                        <div className="inline-flex flex-col items-center">
                                                            <span className={`text-base font-black ${sc.text}`}>{bp.score}</span>
                                                            <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-0.5">
                                                                <div
                                                                    className={`h-full rounded-full ${sc.bg}`}
                                                                    style={{ width: `${bp.score}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">No data</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 hidden md:table-cell"><CtrlBadge v={bp.antivirus} /></td>
                                                <td className="px-4 py-3 hidden md:table-cell"><CtrlBadge v={bp.firewall} /></td>
                                                <td className="px-4 py-3 hidden md:table-cell"><CtrlBadge v={bp.disk_encryption} /></td>
                                                <td className="px-4 py-3 hidden lg:table-cell"><CtrlBadge v={bp.mfa} /></td>
                                                <td className="px-4 py-3 hidden lg:table-cell"><CtrlBadge v={bp.password_policy} /></td>
                                                <td className="px-4 py-3 hidden lg:table-cell"><CtrlBadge v={bp.backup_status} /></td>
                                                <td className="px-4 py-3 text-center hidden sm:table-cell">
                                                    <span className={`text-xs font-bold ${bp.incidents > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                                                        {bp.incidents}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Link
                                                        href={`/branch-security/${encodeURIComponent(bp.name)}/edit`}
                                                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                                                    >
                                                        Edit
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {/* Legend */}
                        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-gray-400">
                            <span><strong>AV</strong> = Antivirus</span>
                            <span><strong>FW</strong> = Firewall</span>
                            <span><strong>Enc</strong> = Disk Encryption</span>
                            <span><strong>MFA</strong> = Multi-Factor Auth</span>
                            <span><strong>Pwd</strong> = Password Policy</span>
                            <span><strong>Bkp</strong> = Backup Status</span>
                            <span><strong>Inc</strong> = Incidents</span>
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
