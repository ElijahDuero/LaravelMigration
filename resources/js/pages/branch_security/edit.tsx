import AppLayout from '@/components/AppLayout';
import { Link, useForm } from '@inertiajs/react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface BsRow {
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
}
interface Props {
    branchName: string;
    row: BsRow | null;
}

// ── Control metadata ───────────────────────────────────────────────────────────
const CONTROLS = [
    { key: 'antivirus',       label: 'Antivirus',       icon: 'fa-shield-virus',      hint: 'Is antivirus installed and active on all endpoints?' },
    { key: 'firewall',        label: 'Firewall',         icon: 'fa-fire-flame-curved', hint: 'Is a network/host firewall enabled and configured?' },
    { key: 'disk_encryption', label: 'Disk Encryption',  icon: 'fa-lock',              hint: 'Are workstation disks encrypted (BitLocker / FileVault)?' },
    { key: 'password_policy', label: 'Password Policy',  icon: 'fa-key',               hint: 'Is a strong password policy enforced (complexity, expiry)?' },
    { key: 'mfa',             label: 'MFA',              icon: 'fa-mobile-screen',     hint: 'Is multi-factor authentication enabled for all user accounts?' },
    { key: 'backup_status',   label: 'Backup',           icon: 'fa-rotate',            hint: 'Are regular backups being performed and tested?' },
] as const;

type ControlKey = typeof CONTROLS[number]['key'];

// ── Control rating button group ────────────────────────────────────────────────
const RATINGS = [
    { value: 0, label: 'Unknown', color: 'gray',  icon: 'fa-circle-question' },
    { value: 1, label: 'No',      color: 'red',   icon: 'fa-circle-xmark' },
    { value: 2, label: 'Partial', color: 'amber', icon: 'fa-circle-half-stroke' },
    { value: 3, label: 'Yes',     color: 'green', icon: 'fa-circle-check' },
] as const;

const COLOR_ACTIVE: Record<string, string> = {
    gray:  'border-gray-400  bg-gray-50  text-gray-700',
    red:   'border-red-400   bg-red-50   text-red-700',
    amber: 'border-amber-400 bg-amber-50 text-amber-700',
    green: 'border-green-400 bg-green-50 text-green-700',
};
const COLOR_IDLE = 'border-gray-200 bg-white text-gray-500 hover:border-gray-300';

// ── Live score preview ─────────────────────────────────────────────────────────
function computeScore(data: ReturnType<typeof buildFormData>): number {
    const controls: ControlKey[] = ['antivirus', 'firewall', 'disk_encryption', 'password_policy', 'mfa', 'backup_status'];
    let ctrlPts = 0;
    for (const k of controls) {
        const v = Number(data[k]);
        ctrlPts += v === 3 ? 2 : v === 2 ? 1 : 0;
    }
    const ctrlPct  = Math.round((ctrlPts / 12) * 70);
    const total    = Math.max(1, Number(data.computers_total));
    const patchPct = Math.round((Number(data.computers_patched)   / total) * 15);
    const encPct   = Math.round((Number(data.computers_encrypted) / total) * 15);
    return Math.min(100, ctrlPct + patchPct + encPct);
}

function buildFormData(row: BsRow | null) {
    return {
        computers_total:      row?.computers_total      ?? 0,
        computers_online:     row?.computers_online     ?? 0,
        computers_offline:    row?.computers_offline    ?? 0,
        computers_outdated:   row?.computers_outdated   ?? 0,
        computers_patched:    row?.computers_patched    ?? 0,
        computers_encrypted:  row?.computers_encrypted  ?? 0,
        antivirus:            row?.antivirus            ?? 0,
        firewall:             row?.firewall             ?? 0,
        disk_encryption:      row?.disk_encryption      ?? 0,
        password_policy:      row?.password_policy      ?? 0,
        mfa:                  row?.mfa                  ?? 0,
        backup_status:        row?.backup_status        ?? 0,
        notes:                row?.notes                ?? '',
    };
}

function scoreTheme(s: number) {
    if (s >= 90) return { text: 'text-emerald-600', bar: 'bg-emerald-500', label: 'Excellent' };
    if (s >= 80) return { text: 'text-green-600',   bar: 'bg-green-500',   label: 'Good' };
    if (s >= 70) return { text: 'text-amber-600',   bar: 'bg-amber-500',   label: 'Fair' };
    if (s >= 50) return { text: 'text-orange-600',  bar: 'bg-orange-500',  label: 'At Risk' };
    return              { text: 'text-red-600',     bar: 'bg-red-500',     label: 'Critical' };
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function BranchSecurityEdit({ branchName, row }: Props) {
    const { data, setData, put, processing, errors } = useForm(buildFormData(row));

    const liveScore = computeScore(data);
    const theme     = scoreTheme(liveScore);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/branch-security/${encodeURIComponent(branchName)}`);
    }

    function setInt(key: keyof typeof data, val: string) {
        setData(key, Math.max(0, parseInt(val) || 0) as any);
    }

    return (
        <AppLayout title={`Update: ${branchName}`} subtitle="Branch security metrics">
            <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/branch-security" className="btn btn-secondary text-sm py-2">
                            <i className="fas fa-arrow-left mr-1.5"></i>Back
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Update Security Data</h2>
                            <p className="text-sm text-gray-500 font-semibold">{branchName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/branch-security" className="btn btn-secondary">
                            <i className="fas fa-times mr-1.5"></i>Cancel
                        </Link>
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing
                                ? <><i className="fas fa-spinner fa-spin mr-1.5"></i>Saving...</>
                                : <><i className="fas fa-floppy-disk mr-1.5"></i>Save</>
                            }
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Left: form panels ────────────────────────────── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Computer inventory */}
                        <div className="card p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-desktop text-purple-600"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Computer Inventory</h3>
                                    <p className="text-sm text-gray-500">Count of computers in this branch</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                                {([
                                    { key: 'computers_total',     label: 'Total Computers', icon: 'fa-desktop',              color: 'gray' },
                                    { key: 'computers_online',    label: 'Online',          icon: 'fa-circle-check',         color: 'green' },
                                    { key: 'computers_offline',   label: 'Offline',         icon: 'fa-circle-xmark',         color: 'red' },
                                    { key: 'computers_outdated',  label: 'Outdated / EOL',  icon: 'fa-triangle-exclamation', color: 'amber' },
                                    { key: 'computers_patched',   label: 'Patched',         icon: 'fa-shield-check',         color: 'blue' },
                                    { key: 'computers_encrypted', label: 'Encrypted',       icon: 'fa-lock',                 color: 'purple' },
                                ] as const).map(({ key, label, icon, color }) => (
                                    <div key={key}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            <i className={`fas ${icon} mr-1 text-${color}-400`}></i>{label}
                                        </label>
                                        <input
                                            type="number" min={0}
                                            className={`form-input text-sm ${errors[key] ? 'border-red-400' : ''}`}
                                            value={data[key]}
                                            onChange={(e) => setInt(key, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Security controls */}
                        <div className="card p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-shield-halved text-red-600"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Security Controls</h3>
                                    <p className="text-sm text-gray-500">Rate each control across the branch</p>
                                </div>
                            </div>
                            <div className="space-y-5">
                                {CONTROLS.map(({ key, label, icon, hint }) => (
                                    <div key={key}>
                                        <div className="flex items-start gap-3 mb-2.5">
                                            <i className={`fas ${icon} text-gray-400 mt-0.5 w-4`}></i>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">{label}</p>
                                                <p className="text-xs text-gray-400">{hint}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 pl-7">
                                            {RATINGS.map(({ value, label: rlabel, color, icon: ricon }) => {
                                                const active = Number(data[key]) === value;
                                                return (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        onClick={() => setData(key, value as any)}
                                                        className={`flex items-center gap-1.5 p-2.5 rounded-xl border text-sm font-medium transition ${active ? COLOR_ACTIVE[color] : COLOR_IDLE}`}
                                                    >
                                                        <i className={`fas ${ricon} text-xs`}></i>
                                                        {rlabel}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Right sidebar ─────────────────────────────────── */}
                    <div className="space-y-5">

                        {/* Live score preview */}
                        <div className="card p-5">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                <i className="fas fa-gauge-high mr-2 text-blue-400"></i>Live Score Preview
                            </h4>
                            <div className="text-center mb-3">
                                <p className={`text-4xl font-black ${theme.text}`}>
                                    {liveScore}<span className="text-xl font-normal text-gray-400">/100</span>
                                </p>
                                <p className={`text-sm font-bold mt-1 ${theme.text}`}>{theme.label}</p>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${theme.bar} transition-all duration-300`}
                                    style={{ width: `${liveScore}%` }} />
                            </div>
                            <p className="text-[10px] text-gray-400 text-center mt-2">Updates as you fill in data</p>
                        </div>

                        {/* Notes */}
                        <div className="card p-5">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                <i className="fas fa-note-sticky mr-2 text-amber-400"></i>Notes
                            </h4>
                            <textarea
                                className="form-input text-sm"
                                rows={5}
                                placeholder="e.g. Legacy machines scheduled for replacement Q4, MFA rollout in progress..."
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                            />
                        </div>

                        {/* Scoring guide */}
                        <div className="card p-5 bg-blue-50/60 border border-blue-100">
                            <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                                <i className="fas fa-circle-info mr-2"></i>How Score is Calculated
                            </h4>
                            <div className="space-y-2 text-xs text-blue-700">
                                {[
                                    ['6 Security Controls', '70%'],
                                    ['Patch Rate',          '15%'],
                                    ['Encryption Rate',     '15%'],
                                ].map(([label, weight]) => (
                                    <div key={label} className="flex items-center justify-between p-2 bg-white/70 rounded-lg">
                                        <span>{label}</span><span className="font-bold">{weight}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-blue-600 mt-3">
                                Each control: <strong>Yes = 2 pts, Partial = 1 pt, No/Unknown = 0 pts</strong> out of 12 total.
                            </p>
                        </div>

                        {/* Last saved */}
                        {row?.updated_at && (
                            <div className="card p-4 text-xs text-gray-500 text-center">
                                <i className="fas fa-clock mr-1"></i>
                                Last saved {new Date(row.updated_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                {row.updated_by && <> by <strong>{row.updated_by}</strong></>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom save bar */}
                <div className="flex justify-end gap-3 pb-6">
                    <Link href="/branch-security" className="btn btn-secondary">
                        <i className="fas fa-times mr-1.5"></i>Cancel
                    </Link>
                    <button type="submit" disabled={processing} className="btn btn-primary">
                        {processing
                            ? <><i className="fas fa-spinner fa-spin mr-1.5"></i>Saving...</>
                            : <><i className="fas fa-floppy-disk mr-1.5"></i>Save Changes</>
                        }
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}
