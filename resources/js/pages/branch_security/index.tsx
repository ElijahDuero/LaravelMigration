import AppLayout from '@/components/AppLayout';
import { Link, usePage } from '@inertiajs/react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface BranchRow {
    branch: string;
    computers_total: number;
    computers_online: number;
    computers_offline: number;
    computers_outdated: number;
    computers_patched: number;
    computers_encrypted: number;
    antivirus: number;
    firewall: number;
    disk_encryption: number;
    password_policy: number;
    mfa: number;
    backup_status: number;
    notes: string | null;
    updated_by: string | null;
    updated_at: string | null;
    score: number;
}
interface Stats {
    avg_score: number;
    healthy: number;
    at_risk: number;
    critical: number;
    total_computers: number;
}
interface Props {
    branches: BranchRow[];
    stats: Stats;
    knownBranches: string[];
}

// ── Scoring helpers ────────────────────────────────────────────────────────────
function scoreTheme(s: number) {
    if (s >= 90) return { text: 'text-emerald-600', bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200', grad: 'from-emerald-400 to-emerald-600', bar: 'bg-emerald-500', label: 'Excellent' };
    if (s >= 80) return { text: 'text-green-600',   bg: 'bg-green-500',   light: 'bg-green-50',   border: 'border-green-200',   grad: 'from-green-400 to-green-600',     bar: 'bg-green-500',   label: 'Good' };
    if (s >= 70) return { text: 'text-amber-600',   bg: 'bg-amber-500',   light: 'bg-amber-50',   border: 'border-amber-200',   grad: 'from-amber-400 to-amber-600',     bar: 'bg-amber-500',   label: 'Fair' };
    if (s >= 50) return { text: 'text-orange-600',  bg: 'bg-orange-500',  light: 'bg-orange-50',  border: 'border-orange-200',  grad: 'from-orange-400 to-orange-600',   bar: 'bg-orange-500',  label: 'At Risk' };
    return              { text: 'text-red-600',     bg: 'bg-red-500',     light: 'bg-red-50',     border: 'border-red-200',     grad: 'from-red-400 to-red-600',         bar: 'bg-red-500',     label: 'Critical' };
}

// ── Control badge ──────────────────────────────────────────────────────────────
function ControlBadge({ value }: { value: number }) {
    if (value === 3) return <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-md"><i className="fas fa-circle-check text-[10px]"></i>Yes</span>;
    if (value === 2) return <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md"><i className="fas fa-circle-half-stroke text-[10px]"></i>Partial</span>;
    if (value === 1) return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md"><i className="fas fa-circle-xmark text-[10px]"></i>No</span>;
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md"><i className="fas fa-circle-question text-[10px]"></i>Unknown</span>;
}

const CONTROLS: { key: keyof BranchRow; label: string; icon: string }[] = [
    { key: 'antivirus',       label: 'Antivirus',        icon: 'fa-shield-virus' },
    { key: 'firewall',        label: 'Firewall',         icon: 'fa-fire-flame-curved' },
    { key: 'disk_encryption', label: 'Disk Encryption',  icon: 'fa-lock' },
    { key: 'password_policy', label: 'Password Policy',  icon: 'fa-key' },
    { key: 'mfa',             label: 'MFA',              icon: 'fa-mobile-screen' },
    { key: 'backup_status',   label: 'Backup',           icon: 'fa-rotate' },
];

function fmtDate(d: string | null) {
    if (!d) return null;
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function BranchSecurityIndex({ branches, stats, knownBranches }: Props) {
    const { auth } = usePage<any>().props;
    const flash     = (usePage<any>().props.flash ?? {}) as { success?: string };
    const isAdmin   = ['super_admin', 'admin'].includes(auth.user?.role ?? '');
    const avgTheme  = scoreTheme(stats.avg_score);

    return (
        <AppLayout title="Branch Security" subtitle="Security posture score for every branch — know where to focus">
            <div className="space-y-6">

                {/* Flash */}
                {flash.success && (
                    <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 flex items-center gap-3 text-green-800 text-sm">
                        <i className="fas fa-circle-check text-green-500"></i>{flash.success}
                    </div>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                        { label: 'Org Average',      value: `${stats.avg_score}%`, icon: 'fa-chart-pie',         color: 'blue',   textCls: avgTheme.text },
                        { label: 'Healthy ≥ 80%',    value: stats.healthy,         icon: 'fa-circle-check',      color: 'green',  textCls: 'text-green-600' },
                        { label: 'At Risk 50–79%',   value: stats.at_risk,         icon: 'fa-triangle-exclamation', color: 'amber', textCls: 'text-amber-600' },
                        { label: 'Critical < 50%',   value: stats.critical,        icon: 'fa-fire',              color: 'red',    textCls: 'text-red-600' },
                        { label: 'Total Computers',  value: stats.total_computers.toLocaleString(), icon: 'fa-desktop', color: 'purple', textCls: 'text-gray-900' },
                    ].map((s) => (
                        <div key={s.label} className="card p-5 hover:shadow-md transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
                                    <p className={`text-2xl font-black mt-1 ${s.textCls}`}>{s.value}</p>
                                </div>
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${s.color}-50 text-${s.color}-500`}>
                                    <i className={`fas ${s.icon}`}></i>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Ranking leaderboard */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                <i className="fas fa-ranking-star mr-2 text-amber-500"></i>Branch Security Ranking
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">Score = 70% controls + 15% patch rate + 15% encryption rate</p>
                        </div>
                    </div>

                    {branches.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <i className="fas fa-building text-4xl mb-3 block text-gray-300"></i>
                            <p className="text-sm">No branches found. <Link href="/branches" className="text-blue-600 hover:underline font-semibold">Add branches first.</Link></p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {branches.map((b, i) => {
                                const t   = scoreTheme(b.score);
                                const pos = i + 1;
                                return (
                                    <div key={b.branch} className="flex items-center gap-4 group">
                                        {/* Rank */}
                                        <div className="w-8 text-center flex-shrink-0">
                                            {pos === 1 ? <span className="text-lg">🥇</span>
                                            : pos === 2 ? <span className="text-lg">🥈</span>
                                            : pos === 3 ? <span className="text-lg">🥉</span>
                                            : <span className="text-sm font-bold text-gray-400">#{pos}</span>}
                                        </div>
                                        {/* Name */}
                                        <div className="w-36 flex-shrink-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">{b.branch}</p>
                                            <p className="text-[10px] text-gray-400">{b.computers_total} computers</p>
                                        </div>
                                        {/* Bar */}
                                        <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden relative">
                                            <div
                                                className={`h-full bg-gradient-to-r ${t.grad} rounded-lg transition-all duration-700 flex items-center justify-end pr-3`}
                                                style={{ width: `${Math.max(4, b.score)}%` }}
                                            >
                                                <span className="text-xs font-black text-white drop-shadow">{b.score}%</span>
                                            </div>
                                        </div>
                                        {/* Grade label */}
                                        <div className="w-20 text-right flex-shrink-0">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${t.light} ${t.text} border ${t.border}`}>
                                                {t.label}
                                            </span>
                                        </div>
                                        {/* Edit */}
                                        {isAdmin && (
                                            <Link
                                                href={`/branch-security/${encodeURIComponent(b.branch)}/edit`}
                                                className="flex-shrink-0 p-1.5 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                                                title="Update data"
                                            >
                                                <i className="fas fa-pen text-xs"></i>
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Branch detail cards */}
                {branches.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {branches.map((b) => {
                            const t     = scoreTheme(b.score);
                            const total = Math.max(1, b.computers_total);
                            const patchPct   = Math.round((b.computers_patched   / total) * 100);
                            const encPct     = Math.round((b.computers_encrypted / total) * 100);
                            return (
                                <div key={b.branch} className={`card overflow-hidden border-t-4 ${t.border} hover:shadow-lg transition`}>
                                    {/* Card header */}
                                    <div className="p-5 pb-4">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{b.branch}</h3>
                                                {b.updated_at ? (
                                                    <p className="text-xs text-gray-400 mt-0.5">Updated {fmtDate(b.updated_at)}</p>
                                                ) : (
                                                    <p className="text-xs text-amber-500 mt-0.5"><i className="fas fa-circle-exclamation mr-1"></i>No data entered yet</p>
                                                )}
                                            </div>
                                            {/* Score circle */}
                                            <div className="flex flex-col items-center flex-shrink-0">
                                                <div className={`w-16 h-16 rounded-full ${t.light} border-4 ${t.border} flex items-center justify-center`}>
                                                    <span className={`text-xl font-black ${t.text}`}>{b.score}</span>
                                                </div>
                                                <span className={`text-[10px] font-bold ${t.text} mt-1`}>{t.label}</span>
                                            </div>
                                        </div>

                                        {/* Score bar */}
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                                            <div className={`h-full bg-gradient-to-r ${t.grad} rounded-full transition-all`}
                                                style={{ width: `${b.score}%` }} />
                                        </div>

                                        {/* Computer stats grid */}
                                        <div className="grid grid-cols-3 gap-2 mb-4">
                                            {[
                                                { label: 'Online',    value: b.computers_online,    textCls: 'text-green-600',  bgCls: 'bg-green-50' },
                                                { label: 'Offline',   value: b.computers_offline,   textCls: 'text-red-500',    bgCls: 'bg-red-50' },
                                                { label: 'Outdated',  value: b.computers_outdated,  textCls: 'text-amber-600',  bgCls: 'bg-amber-50' },
                                                { label: 'Patched',   value: b.computers_patched,   textCls: 'text-blue-600',   bgCls: 'bg-blue-50' },
                                                { label: 'Encrypted', value: b.computers_encrypted, textCls: 'text-purple-600', bgCls: 'bg-purple-50' },
                                                { label: 'Total',     value: b.computers_total,     textCls: 'text-gray-700',   bgCls: 'bg-gray-50' },
                                            ].map(({ label, value, textCls, bgCls }) => (
                                                <div key={label} className={`rounded-lg ${bgCls} p-2 text-center`}>
                                                    <p className={`text-base font-black ${textCls}`}>{value.toLocaleString()}</p>
                                                    <p className="text-[10px] text-gray-500 font-medium">{label}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Patch + Encryption % bars */}
                                        <div className="space-y-2">
                                            <div>
                                                <div className="flex justify-between text-[10px] font-semibold text-gray-500 mb-1">
                                                    <span>Patch rate</span><span className={patchPct >= 80 ? 'text-green-600' : patchPct >= 50 ? 'text-amber-600' : 'text-red-600'}>{patchPct}%</span>
                                                </div>
                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${patchPct >= 80 ? 'bg-green-500' : patchPct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                        style={{ width: `${patchPct}%` }} />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-[10px] font-semibold text-gray-500 mb-1">
                                                    <span>Encryption rate</span><span className={encPct >= 80 ? 'text-green-600' : encPct >= 50 ? 'text-amber-600' : 'text-red-600'}>{encPct}%</span>
                                                </div>
                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${encPct >= 80 ? 'bg-green-500' : encPct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                        style={{ width: `${encPct}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Security controls */}
                                    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-3">Security Controls</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {CONTROLS.map(({ key, label, icon }) => (
                                                <div key={key} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
                                                    <span className="text-xs text-gray-600 flex items-center gap-1.5">
                                                        <i className={`fas ${icon} text-gray-400 w-3.5`}></i>
                                                        {label}
                                                    </span>
                                                    <ControlBadge value={b[key] as number} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Card footer */}
                                    {isAdmin && (
                                        <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
                                            <span className="text-xs text-gray-400 truncate max-w-[180px] italic">
                                                {b.notes ? b.notes.slice(0, 40) + (b.notes.length > 40 ? '…' : '') : 'No notes'}
                                            </span>
                                            <Link
                                                href={`/branch-security/${encodeURIComponent(b.branch)}/edit`}
                                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 flex-shrink-0 ml-2"
                                            >
                                                <i className="fas fa-pen text-[10px]"></i>Update
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Side-by-side comparison table */}
                {branches.length > 0 && (
                    <div className="card p-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center mb-5">
                            <i className="fas fa-table-columns mr-2 text-blue-500"></i>Side-by-Side Comparison
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-left">
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Branch</th>
                                        <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide text-center">Score</th>
                                        {CONTROLS.map(({ key, label, icon }) => (
                                            <th key={key} className="px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide text-center" title={label}>
                                                <i className={`fas ${icon}`}></i>
                                            </th>
                                        ))}
                                        <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide text-center">Patch %</th>
                                        <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide text-center">Encrypt %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {branches.map((b) => {
                                        const t      = scoreTheme(b.score);
                                        const total  = Math.max(1, b.computers_total);
                                        const pPct   = Math.round((b.computers_patched   / total) * 100);
                                        const ePct   = Math.round((b.computers_encrypted / total) * 100);
                                        return (
                                            <tr key={b.branch} className="hover:bg-gray-50/50 transition">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${t.bg}`}></div>
                                                        <span className="font-semibold text-gray-900">{b.branch}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <span className={`font-black text-base ${t.text}`}>{b.score}%</span>
                                                </td>
                                                {CONTROLS.map(({ key }) => (
                                                    <td key={key} className="px-3 py-3 text-center">
                                                        <ControlBadge value={b[key] as number} />
                                                    </td>
                                                ))}
                                                <td className="px-3 py-3 text-center">
                                                    <span className={`text-xs font-bold ${pPct >= 80 ? 'text-green-600' : pPct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{pPct}%</span>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <span className={`text-xs font-bold ${ePct >= 80 ? 'text-green-600' : ePct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{ePct}%</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-gray-400 mt-4">
                            <i className="fas fa-shield-virus mr-1 text-red-400"></i>AV &nbsp;
                            <i className="fas fa-fire-flame-curved mr-1 text-orange-400"></i>FW &nbsp;
                            <i className="fas fa-lock mr-1 text-purple-400"></i>Encryption &nbsp;
                            <i className="fas fa-key mr-1 text-amber-400"></i>Passwords &nbsp;
                            <i className="fas fa-mobile-screen mr-1 text-blue-400"></i>MFA &nbsp;
                            <i className="fas fa-rotate mr-1 text-teal-400"></i>Backup
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
