import AppLayout from '@/components/AppLayout';
import { Link, useForm } from '@inertiajs/react';

interface Props {
    nextIocId: string;
}

const IOC_TYPES   = ['Phishing Domain', 'Malicious IP', 'Blocked IP', 'IOC', 'Malware Hash', 'Suspicious URL'];
const SEVERITIES  = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES    = ['Active', 'Inactive', 'Whitelisted'];
const CONFIDENCES = ['Low', 'Medium', 'High'];

const SEV_COLORS: Record<string, string> = {
    Low:      'border-green-200  bg-green-50  text-green-700',
    Medium:   'border-amber-200  bg-amber-50  text-amber-700',
    High:     'border-orange-200 bg-orange-50 text-orange-700',
    Critical: 'border-red-200    bg-red-50    text-red-700',
};

export default function ThreatIntelCreate({ nextIocId }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        type:         '',
        value:        '',
        severity:     'Medium',
        status:       'Active',
        confidence:   'Medium',
        source:       '',
        tags:         '',
        description:  '',
        first_seen:   '',
        last_seen:    '',
        expiry_date:  '',
        misp_event:   '',
        vt_permalink: '',
        abuse_report: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/threat-intel');
    }

    return (
        <AppLayout title="Add Threat Indicator" subtitle="Record a new IOC or threat intelligence entry">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/threat-intel" className="btn btn-secondary text-sm py-2">
                        <i className="fas fa-arrow-left mr-1.5"></i>Back
                    </Link>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Add Threat Indicator</h2>
                        <p className="text-sm text-gray-500">
                            Next ID: <span className="font-mono font-semibold text-red-600">{nextIocId}</span>
                        </p>
                    </div>
                </div>

                {/* Global error */}
                {Object.keys(errors).length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <i className="fas fa-circle-xmark text-red-500 mt-0.5"></i>
                            <ul className="text-sm text-red-700 space-y-1">
                                {Object.values(errors).map((msg, i) => (
                                    <li key={i}>{msg}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ── Indicator Details ─────────────────────────────── */}
                    <div className="card p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-5 flex items-center">
                            <i className="fas fa-crosshairs mr-2 text-red-500"></i>Indicator Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                            {/* Type */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                                    Indicator Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className={`form-input ${errors.type ? 'border-red-400' : ''}`}
                                    value={data.type}
                                    onChange={(e) => setData('type', e.target.value)}
                                    required
                                >
                                    <option value="">— Select type —</option>
                                    {IOC_TYPES.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                                {errors.type && <p className="text-xs text-red-600 mt-1">{errors.type}</p>}
                            </div>

                            {/* Value */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                                    Value (IP / Domain / Hash / URL) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    className={`form-input font-mono ${errors.value ? 'border-red-400' : ''}`}
                                    placeholder="e.g. 192.168.1.1, evil.com, SHA256..."
                                    value={data.value}
                                    onChange={(e) => setData('value', e.target.value)}
                                    required
                                />
                                {errors.value && <p className="text-xs text-red-600 mt-1">{errors.value}</p>}
                            </div>

                            {/* Severity */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                                    Severity <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {SEVERITIES.map((sev) => (
                                        <button
                                            key={sev}
                                            type="button"
                                            onClick={() => setData('severity', sev)}
                                            className={`text-xs font-semibold py-2 rounded-lg border transition ${
                                                data.severity === sev
                                                    ? SEV_COLORS[sev]
                                                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                                            }`}
                                        >
                                            {sev}
                                        </button>
                                    ))}
                                </div>
                                {errors.severity && <p className="text-xs text-red-600 mt-1">{errors.severity}</p>}
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Status</label>
                                <select
                                    className="form-input"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                >
                                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                                </select>
                            </div>

                            {/* Confidence */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Confidence</label>
                                <select
                                    className="form-input"
                                    value={data.confidence}
                                    onChange={(e) => setData('confidence', e.target.value)}
                                >
                                    {CONFIDENCES.map((c) => <option key={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* Source */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Source</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Internal, MISP, VirusTotal, AbuseIPDB"
                                    value={data.source}
                                    onChange={(e) => setData('source', e.target.value)}
                                />
                            </div>

                            {/* Tags */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Tags</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Comma-separated tags, e.g. ransomware, phishing, apt"
                                    value={data.tags}
                                    onChange={(e) => setData('tags', e.target.value)}
                                />
                            </div>

                            {/* Description */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Description</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    placeholder="Additional context, TTPs, campaign info..."
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                />
                            </div>

                        </div>
                    </div>

                    {/* ── Timeline ─────────────────────────────────────── */}
                    <div className="card p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-5 flex items-center">
                            <i className="fas fa-calendar-days mr-2 text-blue-500"></i>Timeline
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">First Seen</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={data.first_seen}
                                    onChange={(e) => setData('first_seen', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Last Seen</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={data.last_seen}
                                    onChange={(e) => setData('last_seen', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Expiry Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={data.expiry_date}
                                    onChange={(e) => setData('expiry_date', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── External Feed References ──────────────────────── */}
                    <div className="card p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center">
                            <i className="fas fa-plug-circle-bolt mr-2 text-indigo-500"></i>External Feed References
                        </h3>
                        <p className="text-xs text-gray-400 mb-5">
                            Optional links / IDs for future MISP, VirusTotal, and AbuseIPDB integration.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">MISP Event ID</label>
                                <input
                                    type="text"
                                    className="form-input font-mono"
                                    placeholder="e.g. 12345"
                                    value={data.misp_event}
                                    onChange={(e) => setData('misp_event', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">VirusTotal Link</label>
                                <input
                                    type="text"
                                    className="form-input font-mono"
                                    placeholder="https://www.virustotal.com/..."
                                    value={data.vt_permalink}
                                    onChange={(e) => setData('vt_permalink', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">AbuseIPDB Report</label>
                                <input
                                    type="text"
                                    className="form-input font-mono"
                                    placeholder="https://www.abuseipdb.com/..."
                                    value={data.abuse_report}
                                    onChange={(e) => setData('abuse_report', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                        <Link href="/threat-intel" className="btn btn-secondary">Cancel</Link>
                        <button type="submit" className="btn btn-primary" disabled={processing}>
                            {processing
                                ? <><i className="fas fa-spinner fa-spin mr-1.5"></i>Saving...</>
                                : <><i className="fas fa-plus mr-1.5"></i>Add Indicator</>
                            }
                        </button>
                    </div>

                </form>
            </div>
        </AppLayout>
    );
}
