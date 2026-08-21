import AppLayout from '@/components/AppLayout';
import { router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RiskItem {
    id: number;
    risk_id: string;
    title: string;
    category: string;
    level: string;
    score: number;
    likelihood: string;
    impact: string;
    status: string;
    owner: string | null;
    branch: string | null;
    due_date: string | null;
    mitigation: string | null;
    created_at: string;
    updated_at: string;
}

interface Stats {
    total: number;
    high: number;
    mitigating: number;
    mitigated: number;
}

interface CatStat {
    total: number;
    high: number;
    mitigated: number;
    pct: number;
}

interface Filters { search?: string; level?: string; status?: string; category?: string; }

interface Props {
    risks: RiskItem[];
    stats: Stats;
    catStats: Record<string, CatStat>;
    heatmap: Record<string, number>;
    branches: string[];
    filters: Filters;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LIKELIHOODS = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'] as const;
const IMPACTS     = ['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'] as const;
const CATEGORIES  = ['Operational', 'Technical', 'Financial', 'Compliance', 'Human'] as const;
const LEVELS      = ['Critical', 'High', 'Medium', 'Low'] as const;
const STATUSES    = ['Open', 'Mitigating', 'Mitigated'] as const;

const CAT_META: Record<string, { color: string; icon: string }> = {
    Operational: { color: 'blue',    icon: 'fa-gears' },
    Technical:   { color: 'purple',  icon: 'fa-server' },
    Financial:   { color: 'emerald', icon: 'fa-coins' },
    Compliance:  { color: 'cyan',    icon: 'fa-scale-balanced' },
    Human:       { color: 'pink',    icon: 'fa-users' },
};

const LEVEL_BADGE: Record<string, string> = {
    Critical: 'bg-red-100 text-red-700 border border-red-200',
    High:     'bg-orange-100 text-orange-700 border border-orange-200',
    Medium:   'bg-yellow-100 text-yellow-700 border border-yellow-200',
    Low:      'bg-green-100 text-green-700 border border-green-200',
};

const STATUS_BADGE: Record<string, string> = {
    Open:       'bg-red-50 text-red-700',
    Mitigating: 'bg-amber-50 text-amber-700',
    Mitigated:  'bg-green-50 text-green-700',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cellBg(score: number): { bg: string; text: string; label: string } {
    if (score >= 16) return { bg: '#dc2626', text: '#fff',    label: 'Critical' };
    if (score >= 10) return { bg: '#f97316', text: '#fff',    label: 'High'     };
    if (score >= 5)  return { bg: '#fbbf24', text: '#78350f', label: 'Medium'   };
    return              { bg: '#86efac', text: '#14532d', label: 'Low'      };
}

function scoreColor(score: number) {
    if (score >= 16) return { text: 'text-red-600',    bg: 'bg-red-50' };
    if (score >= 10) return { text: 'text-orange-600', bg: 'bg-orange-50' };
    if (score >= 5)  return { text: 'text-yellow-600', bg: 'bg-yellow-50' };
    return                  { text: 'text-green-600',  bg: 'bg-green-50' };
}

function calcScore(likelihood: string, impact: string): number {
    const lv = (LIKELIHOODS as readonly string[]).indexOf(likelihood) + 1;
    const iv = (IMPACTS as readonly string[]).indexOf(impact) + 1;
    return lv > 0 && iv > 0 ? lv * iv : 1;
}

function scoreToLevel(score: number): string {
    if (score >= 16) return 'Critical';
    if (score >= 10) return 'High';
    if (score >= 5)  return 'Medium';
    return 'Low';
}

function fmtDate(d: string | null) {
    if (!d) return null;
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Risk Form Modal ──────────────────────────────────────────────────────────

interface RiskFormProps {
    modalTitle: string;
    initial?: Partial<RiskItem>;
    branches: string[];
    onClose: () => void;
    onSubmit: (data: Record<string, string>) => void;
    processing: boolean;
}

function RiskFormModal({ modalTitle, initial, branches, onClose, onSubmit, processing }: RiskFormProps) {
    const [form, setForm] = useState({
        title:      initial?.title      ?? '',
        category:   initial?.category   ?? 'Operational',
        likelihood: initial?.likelihood ?? 'Possible',
        impact:     initial?.impact     ?? 'Moderate',
        status:     initial?.status     ?? 'Open',
        owner:      initial?.owner      ?? '',
        branch:     initial?.branch     ?? '',
        due_date:   initial?.due_date   ?? '',
        mitigation: initial?.mitigation ?? '',
    });

    const score = calcScore(form.likelihood, form.impact);
    const level = scoreToLevel(score);
    const sc    = scoreColor(score);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">{modalTitle}</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="p-6 space-y-5">
                    {/* Live score preview */}
                    <div className={`flex items-center justify-between p-4 rounded-xl ${sc.bg} border`}>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Calculated Risk Score</p>
                            <p className={`text-3xl font-black ${sc.text} mt-0.5`}>{score}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {form.likelihood} × {form.impact}
                            </p>
                        </div>
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${LEVEL_BADGE[level]}`}>
                            {level === 'Critical' && <i className="fas fa-skull mr-1.5 text-[10px]"></i>}
                            {level}
                        </span>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Risk Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g., Unauthorized access to HR system"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                            <select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                            <select className="form-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                {STATUSES.map((s) => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Likelihood × Impact — live-update score */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Likelihood <span className="text-red-500">*</span>
                            </label>
                            <select className="form-input" value={form.likelihood} onChange={(e) => setForm({ ...form, likelihood: e.target.value })}>
                                {LIKELIHOODS.map((l, i) => <option key={l}>{l}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Impact <span className="text-red-500">*</span>
                            </label>
                            <select className="form-input" value={form.impact} onChange={(e) => setForm({ ...form, impact: e.target.value })}>
                                {IMPACTS.map((i) => <option key={i}>{i}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Risk Owner</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., IT Manager"
                                value={form.owner}
                                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={form.due_date}
                                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Branch</label>
                        <select className="form-input" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                            <option value="">All Branches</option>
                            {branches.map((b) => <option key={b}>{b}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Mitigation Plan</label>
                        <textarea
                            rows={3}
                            className="form-input"
                            placeholder="Describe the mitigation or treatment plan..."
                            value={form.mitigation}
                            onChange={(e) => setForm({ ...form, mitigation: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            <i className="fas fa-floppy-disk mr-2"></i>Save Risk
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Heatmap component ────────────────────────────────────────────────────────

function Heatmap({ heatmap }: { heatmap: Record<string, number> }) {
    const impactLabels     = ['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'];
    const likelihoodLabels = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];

    return (
        <div className="card p-5 flex flex-col h-full">
            <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900">Risk Heatmap</h3>
                <p className="text-xs text-gray-500 mt-0.5">Likelihood × Impact matrix</p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-1.5 mb-4 text-[10px] font-semibold">
                {[
                    { label: 'Low',      cls: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
                    { label: 'Medium',   cls: 'bg-yellow-100 text-yellow-700',dot: 'bg-yellow-400' },
                    { label: 'High',     cls: 'bg-orange-100 text-orange-700',dot: 'bg-orange-500' },
                    { label: 'Critical', cls: 'bg-red-100 text-red-700',      dot: 'bg-red-600' },
                ].map((l) => (
                    <span key={l.label} className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${l.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${l.dot}`}></span>{l.label}
                    </span>
                ))}
            </div>

            <div className="flex gap-2 flex-1 min-w-0">
                {/* Y-axis label */}
                <div className="flex items-center justify-center w-4 flex-shrink-0">
                    <span
                        className="text-[9px] font-bold text-gray-400 uppercase tracking-widest"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                    >Likelihood →</span>
                </div>

                <div className="flex-1 min-w-0">
                    {/* Column headers */}
                    <div className="grid gap-1" style={{ gridTemplateColumns: '60px repeat(5, 1fr)' }}>
                        <div></div>
                        {impactLabels.map((label, i) => (
                            <div key={label} className="flex flex-col items-center justify-end pb-1 gap-1">
                                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wide leading-tight text-center">{label}</span>
                                <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-[9px] font-black flex items-center justify-center">{i + 1}</span>
                            </div>
                        ))}
                    </div>

                    {/* Rows — highest likelihood at top */}
                    {[4, 3, 2, 1, 0].map((li) => {
                        const lv = li + 1;
                        return (
                            <div key={lv} className="grid gap-1 mt-1" style={{ gridTemplateColumns: '60px repeat(5, 1fr)' }}>
                                {/* Row label */}
                                <div className="flex items-center justify-end gap-1.5 pr-1.5" style={{ height: 48 }}>
                                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wide text-right leading-tight">{likelihoodLabels[li]}</span>
                                    <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-[9px] font-black flex items-center justify-center flex-shrink-0">{lv}</span>
                                </div>

                                {/* Cells */}
                                {[1, 2, 3, 4, 5].map((iv) => {
                                    const score  = lv * iv;
                                    const count  = heatmap[`${lv}_${iv}`] ?? 0;
                                    const { bg, text, label } = cellBg(score);
                                    return (
                                        <div key={iv} className="relative group" style={{ height: 48 }}>
                                            <div
                                                className="absolute inset-0 rounded-lg flex flex-col items-center justify-between p-1 transition-transform hover:scale-105 hover:shadow-md cursor-default"
                                                style={{ background: bg }}
                                            >
                                                <div className="w-full flex items-center justify-between">
                                                    <span className="text-[9px] font-black opacity-70 leading-none" style={{ color: text }}>{score}</span>
                                                    {count > 0 && (
                                                        <span className="text-[9px] font-black bg-white/30 px-1 rounded-full leading-none" style={{ color: text }}>{count}</span>
                                                    )}
                                                </div>
                                                <div></div>
                                            </div>

                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col z-30 pointer-events-none min-w-[130px]">
                                                <div className="bg-gray-900 text-white text-[11px] rounded-lg px-3 py-2 shadow-xl">
                                                    <p className="font-bold">{likelihoodLabels[li]} × {impactLabels[iv - 1]}</p>
                                                    <p className="text-gray-300 mt-0.5">Score: <span className="text-white font-bold">{score}</span> — {label}</p>
                                                    {count > 0
                                                        ? <p className="text-gray-400 text-[10px] mt-1">{count} risk{count !== 1 ? 's' : ''} here</p>
                                                        : <p className="text-gray-500 text-[10px] mt-1">No risks</p>
                                                    }
                                                </div>
                                                <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1 rounded-sm"></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                    <p className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-2">← Impact →</p>
                </div>
            </div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RisksIndex({ risks, stats, catStats, heatmap, branches, filters }: Props) {
    const { auth } = usePage<any>().props;
    const isAdmin  = ['super_admin', 'admin'].includes(auth.user?.role ?? '');

    // Filter state
    const [search,  setSearch]  = useState(filters.search   ?? '');
    const [fLevel,  setFLevel]  = useState(filters.level    ?? '');
    const [fStatus, setFStatus] = useState(filters.status   ?? '');

    // Modal state
    const [showAdd,  setShowAdd]  = useState(false);
    const [editRisk, setEditRisk] = useState<RiskItem | null>(null);
    const [saving,   setSaving]   = useState(false);

    const filterCount = Object.values(filters).filter(Boolean).length;

    function applyFilters() {
        const q: Record<string, string> = {};
        if (search)  q.search = search;
        if (fLevel)  q.level  = fLevel;
        if (fStatus) q.status = fStatus;
        router.get('/risks', q, { preserveState: true });
    }

    function clearFilters() {
        setSearch(''); setFLevel(''); setFStatus('');
        router.get('/risks');
    }

    function handleDelete(id: number, riskId: string, title: string) {
        if (!confirm(`Permanently delete ${riskId} — "${title}"? This cannot be undone.`)) return;
        router.delete(`/risks/${id}`);
    }

    function handleMitigate(id: number, riskId: string) {
        if (!confirm(`Mark risk ${riskId} as Mitigated?`)) return;
        router.post(`/risks/${id}/mitigate`);
    }

    function submitAdd(data: Record<string, string>) {
        setSaving(true);
        router.post('/risks', data, {
            onFinish: () => { setSaving(false); setShowAdd(false); },
        });
    }

    function submitEdit(data: Record<string, string>) {
        if (!editRisk) return;
        setSaving(true);
        router.put(`/risks/${editRisk.id}`, data, {
            onFinish: () => { setSaving(false); setEditRisk(null); },
        });
    }

    function handleDeleteAll() {
        if (!confirm(`Are you sure you want to delete ALL ${stats.total} risks from the register? This cannot be undone.`)) return;
        router.delete('/risks/delete-all');
    }

    const totalMitigatedPct = stats.total > 0 ? Math.round(stats.mitigated / stats.total * 100) : 0;

    return (
        <AppLayout title="Risk Register" subtitle="Identify, assess, and mitigate organizational risks">
            <div className="space-y-5">

                {/* ── Row 1: stats + heatmap ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 flex flex-col gap-5">

                        {/* Stat cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: 'Total',          value: stats.total,      icon: 'fa-list-check',          bg: 'bg-indigo-50', color: 'text-indigo-500' },
                                { label: 'High / Critical', value: stats.high,       icon: 'fa-triangle-exclamation',bg: 'bg-red-50',    color: 'text-red-500' },
                                { label: 'Mitigating',     value: stats.mitigating, icon: 'fa-shield-halved',       bg: 'bg-amber-50',  color: 'text-amber-500' },
                                { label: 'Mitigated',      value: stats.mitigated,  icon: 'fa-circle-check',        bg: 'bg-green-50',  color: 'text-green-500' },
                            ].map((s) => (
                                <div key={s.label} className="card p-4 hover:shadow-md transition">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                                            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
                                        </div>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
                                            <i className={`fas ${s.icon}`}></i>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Category breakdown table */}
                        <div className="card p-5 flex-1">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900">Risk Categories</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Breakdown by category with mitigation progress</p>
                                </div>
                                {isAdmin && (
                                    <button onClick={() => setShowAdd(true)} className="btn btn-primary text-sm py-2">
                                        <i className="fas fa-plus mr-1.5"></i>Register Risk
                                    </button>
                                )}
                            </div>
                            <div className="overflow-hidden rounded-xl border border-gray-100">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 text-left">
                                            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Category</th>
                                            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-center">Total</th>
                                            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-center">High/Crit</th>
                                            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-center">Mitigated</th>
                                            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {CATEGORIES.map((cat) => {
                                            const s    = catStats[cat] ?? { total: 0, high: 0, mitigated: 0, pct: 0 };
                                            const meta = CAT_META[cat];
                                            return (
                                                <tr key={cat} className="hover:bg-gray-50/50 transition">
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`w-8 h-8 bg-${meta.color}-100 text-${meta.color}-600 rounded-lg flex items-center justify-center`}>
                                                                <i className={`fas ${meta.icon} text-xs`}></i>
                                                            </div>
                                                            <span className="text-sm font-semibold text-gray-800">{cat}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center text-sm font-bold text-gray-900">{s.total}</td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        <span className="text-xs font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded-full">{s.high}</span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center text-sm font-bold text-green-600">{s.mitigated}</td>
                                                    <td className="px-4 py-3.5 w-48">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full bg-gradient-to-r from-${meta.color}-400 to-${meta.color}-600 rounded-full transition-all`}
                                                                    style={{ width: `${s.pct}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs font-bold text-gray-700 w-10 text-right">{s.pct}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Heatmap */}
                    <Heatmap heatmap={heatmap} />
                </div>

                {/* ── Row 2: Risk Register table ── */}
                <div className="card p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Risk Register</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                <span className="font-semibold">{stats.total}</span> risks &bull;{' '}
                                <span className="font-semibold">{stats.high}</span> open high/critical &bull;{' '}
                                <span className="font-semibold">{totalMitigatedPct}%</span> mitigated
                                {filterCount > 0 && (
                                    <button onClick={clearFilters} className="ml-2 text-xs text-blue-600 hover:underline">Clear filters</button>
                                )}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                            <div className="relative">
                                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                                <input
                                    type="text"
                                    className="form-input pl-9 text-sm py-2 w-full sm:w-56"
                                    placeholder="Search risks..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                />
                            </div>
                            <select className="form-input text-sm py-2" value={fLevel} onChange={(e) => setFLevel(e.target.value)}>
                                <option value="">All Levels</option>
                                {LEVELS.map((l) => <option key={l}>{l}</option>)}
                            </select>
                            <select className="form-input text-sm py-2" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
                                <option value="">All Statuses</option>
                                {STATUSES.map((s) => <option key={s}>{s}</option>)}
                            </select>
                            <button onClick={applyFilters} className="btn btn-primary py-2 text-sm px-4">
                                <i className="fas fa-search mr-1.5"></i>Apply
                            </button>
                            {stats.total > 0 && (
                                <button
                                    onClick={handleDeleteAll}
                                    className="btn border border-red-200 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white py-2 text-sm"
                                    title="Delete all risks"
                                >
                                    <i className="fas fa-trash-can mr-1.5"></i>Delete All
                                </button>
                            )}
                            {isAdmin && (
                                <button onClick={() => setShowAdd(true)} className="btn btn-primary py-2 text-sm">
                                    <i className="fas fa-plus mr-1.5"></i>Add Risk
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="w-full data-table">
                                <thead>
                                    <tr>
                                        <th>Risk</th>
                                        <th className="hidden md:table-cell">Category</th>
                                        <th>Level</th>
                                        <th>Score</th>
                                        <th className="hidden lg:table-cell">Owner / Due</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {risks.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                                                <i className="fas fa-list-check text-3xl mb-3 block"></i>
                                                {filterCount > 0
                                                    ? 'No risks match your filters.'
                                                    : <span>No risks registered. {isAdmin && (
                                                        <button onClick={() => setShowAdd(true)} className="text-blue-600 hover:underline font-semibold">Register the first risk</button>
                                                    )}.</span>
                                                }
                                            </td>
                                        </tr>
                                    ) : risks.map((r) => {
                                        const sc        = scoreColor(r.score);
                                        const levelCls  = LEVEL_BADGE[r.level]  ?? 'bg-gray-100 text-gray-700';
                                        const statusCls = STATUS_BADGE[r.status] ?? 'bg-gray-100 text-gray-700';
                                        return (
                                            <tr key={r.id} className="group hover:bg-gray-50/50 transition">
                                                <td>
                                                    <div className="min-w-0 pr-2">
                                                        <div className="mb-1">
                                                            <span className="font-mono text-[11px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">{r.risk_id}</span>
                                                        </div>
                                                        <p className="text-sm font-semibold text-gray-900 truncate max-w-sm">{r.title}</p>
                                                        {r.mitigation && (
                                                            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-sm">
                                                                <i className="fas fa-wrench mr-1"></i>{r.mitigation}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell">
                                                    <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">{r.category}</span>
                                                </td>
                                                <td>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${levelCls}`}>
                                                        {r.level === 'Critical' && <i className="fas fa-skull mr-1 text-[10px]"></i>}
                                                        {r.level}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`inline-flex items-center justify-center w-10 h-10 ${sc.bg} ${sc.text} font-black rounded-lg text-sm border-2 border-white shadow-sm`}>
                                                        {r.score}
                                                    </span>
                                                </td>
                                                <td className="hidden lg:table-cell">
                                                    <div className="flex items-start space-x-2">
                                                        <img
                                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(r.owner ?? 'U')}&background=e0e7ff&color=6366f1&size=32`}
                                                            className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5"
                                                            alt=""
                                                        />
                                                        <div>
                                                            <p className="text-xs font-semibold text-gray-800">{r.owner ?? '—'}</p>
                                                            {r.due_date && (
                                                                <p className="text-[11px] text-gray-500">
                                                                    <i className="far fa-calendar mr-1"></i>{fmtDate(r.due_date)}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCls}`}>
                                                        {r.status === 'Mitigated' && <i className="fas fa-check mr-1.5 text-[10px]"></i>}
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition">
                                                        {isAdmin && (
                                                            <>
                                                                <button
                                                                    onClick={() => setEditRisk(r)}
                                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                                    title="Edit"
                                                                >
                                                                    <i className="fas fa-pen text-xs"></i>
                                                                </button>
                                                                {r.status !== 'Mitigated' && (
                                                                    <button
                                                                        onClick={() => handleMitigate(r.id, r.risk_id)}
                                                                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                                                                        title="Mark Mitigated"
                                                                    >
                                                                        <i className="fas fa-check text-xs"></i>
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDelete(r.id, r.risk_id, r.title)}
                                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                                    title="Delete"
                                                                >
                                                                    <i className="fas fa-trash text-xs"></i>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                        <span>
                            Showing <span className="font-semibold text-gray-900">{risks.length}</span> of{' '}
                            <span className="font-semibold text-gray-900">{stats.total}</span> risks
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Add modal ── */}
            {showAdd && (
                <RiskFormModal
                    modalTitle="Register New Risk"
                    branches={branches}
                    onClose={() => setShowAdd(false)}
                    onSubmit={submitAdd}
                    processing={saving}
                />
            )}

            {/* ── Edit modal ── */}
            {editRisk && (
                <RiskFormModal
                    modalTitle={`Edit Risk — ${editRisk.risk_id}`}
                    initial={editRisk}
                    branches={branches}
                    onClose={() => setEditRisk(null)}
                    onSubmit={submitEdit}
                    processing={saving}
                />
            )}
        </AppLayout>
    );
}
