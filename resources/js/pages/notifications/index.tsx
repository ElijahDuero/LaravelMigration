import AppLayout from '@/components/AppLayout';
import { router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Bot {
    id: number;
    channel: string;
    label: string;
    bot_token: string;
    chat_id: string;
    enabled: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}
interface Rule {
    id: number;
    bot_id: number;
    event_type: string;
    min_severity: string | null;
    enabled: boolean;
    created_at: string;
    bot?: { id: number; label: string; channel: string };
}
interface AuditConfig {
    id: number;
    bot_id: number;
    enabled: boolean;
    filter_module: string;
    filter_actor: string;
    filter_level: string;
    created_by: string;
    updated_at: string;
    bot?: { id: number; label: string; enabled: boolean };
}
interface Log {
    id: number;
    bot_id: number | null;
    channel: string;
    event_type: string;
    message: string;
    status: 'sent' | 'failed' | 'pending';
    error: string | null;
    sent_at: string;
}
interface Props {
    tab: string;
    stats: { total_bots: number; active_bots: number; total_sent: number; total_failed: number };
    bots: Bot[];
    rules: Rule[];
    auditConfigs: AuditConfig[];
    logs: Log[];
    eventTypes: Record<string, string>;
    modules: Record<string, string>;
    filterLevels: Record<string, string>;
}

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ══════════════════════════════════════════════════════════════════════════════
// Rule Form Component
// ══════════════════════════════════════════════════════════════════════════════
function RuleForm({ bots, eventTypes }: { bots: Bot[]; eventTypes: Record<string, string> }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        bot_id:       '',
        event_type:   '',
        min_severity: '',
        enabled:      true,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/notifications/rules', {
            onSuccess: () => reset(),
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Bot <span className="text-red-500">*</span>
                </label>
                <select required className={`form-input w-full ${errors.bot_id ? 'border-red-400' : ''}`}
                    value={data.bot_id} onChange={(e) => setData('bot_id', e.target.value)}>
                    <option value="">— Select bot —</option>
                    {bots.map((b) => (
                        <option key={b.id} value={b.id}>{b.label}</option>
                    ))}
                </select>
                {errors.bot_id && <p className="text-xs text-red-600 mt-1">{errors.bot_id}</p>}
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Event <span className="text-red-500">*</span>
                </label>
                <select required className={`form-input w-full ${errors.event_type ? 'border-red-400' : ''}`}
                    value={data.event_type} onChange={(e) => setData('event_type', e.target.value)}>
                    <option value="">— Select event —</option>
                    {Object.entries(eventTypes).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                {errors.event_type && <p className="text-xs text-red-600 mt-1">{errors.event_type}</p>}
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Min Severity Filter
                </label>
                <select className="form-input w-full" value={data.min_severity}
                    onChange={(e) => setData('min_severity', e.target.value)}>
                    <option value="">Any severity</option>
                    <option value="Low">Low and above</option>
                    <option value="Medium">Medium and above</option>
                    <option value="High">High and above</option>
                    <option value="Critical">Critical only</option>
                </select>
                <p className="text-[11px] text-gray-400 mt-1">Only notify when severity meets or exceeds this level.</p>
            </div>

            <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div className="relative">
                        <input type="checkbox" className="sr-only peer"
                            checked={data.enabled} onChange={(e) => setData('enabled', e.target.checked)} />
                        <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-600 rounded-full transition"></div>
                        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition peer-checked:translate-x-4"></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Rule Enabled</span>
                </label>
            </div>

            <button type="submit" disabled={processing} className="btn btn-primary w-full">
                <i className="fas fa-plus mr-1.5"></i>Add Rule
            </button>
        </form>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// Audit Config Form Component
// ══════════════════════════════════════════════════════════════════════════════
function AuditConfigForm({ bots, modules, filterLevels }: {
    bots: Bot[];
    modules: Record<string, string>;
    filterLevels: Record<string, string>;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        bot_id:        '',
        filter_module: '',
        filter_actor:  '',
        filter_level:  'all',
        enabled:       true,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/notifications/audit-config', {
            onSuccess: () => reset(),
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Telegram Bot <span className="text-red-500">*</span>
                </label>
                <select required className={`form-input w-full ${errors.bot_id ? 'border-red-400' : ''}`}
                    value={data.bot_id} onChange={(e) => setData('bot_id', e.target.value)}>
                    <option value="">— Select bot —</option>
                    {bots.map((b) => (
                        <option key={b.id} value={b.id}>{b.label} {!b.enabled && '(disabled)'}</option>
                    ))}
                </select>
                {errors.bot_id && <p className="text-xs text-red-600 mt-1">{errors.bot_id}</p>}
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Module Filter
                </label>
                <select className="form-input w-full" value={data.filter_module}
                    onChange={(e) => setData('filter_module', e.target.value)}>
                    {Object.entries(modules).map(([val, lbl]) => (
                        <option key={val} value={val}>{lbl}</option>
                    ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">Only forward entries from this module. Leave on "All" to capture everything.</p>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Event Level Filter
                </label>
                <select className="form-input w-full" value={data.filter_level}
                    onChange={(e) => setData('filter_level', e.target.value)}>
                    {Object.entries(filterLevels).map(([val, lbl]) => (
                        <option key={val} value={val}>{lbl}</option>
                    ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">Reduce noise by forwarding only what matters.</p>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Actor Filter <span className="text-gray-400 font-normal normal-case">(optional)</span>
                </label>
                <input type="text" className="form-input w-full font-mono text-sm"
                    placeholder="e.g. admin (leave blank for all)"
                    value={data.filter_actor} onChange={(e) => setData('filter_actor', e.target.value)} />
                <p className="text-[11px] text-gray-400 mt-1">Only forward actions performed by this username (partial match).</p>
            </div>

            <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div className="relative">
                        <input type="checkbox" className="sr-only peer"
                            checked={data.enabled} onChange={(e) => setData('enabled', e.target.checked)} />
                        <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-600 rounded-full transition"></div>
                        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition peer-checked:translate-x-4"></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Forwarding Enabled</span>
                </label>
            </div>

            <button type="submit" disabled={processing} className="btn btn-primary w-full">
                <i className="fas fa-link mr-1.5"></i>Link Audit Log
            </button>
        </form>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// Bot Form Modal
// ══════════════════════════════════════════════════════════════════════════════
function BotModal({ bot, onClose }: { bot?: Bot; onClose: () => void }) {
    const { data, setData, post, processing, errors } = useForm({
        id:         bot?.id,
        label:      bot?.label      ?? '',
        bot_token:  bot?.bot_token  ?? '',
        chat_id:    bot?.chat_id    ?? '',
        enabled:    bot?.enabled    ?? true,
        send_test:  false,
    });

    function handleSubmit(e: React.FormEvent, sendTest = false) {
        e.preventDefault();
        setData('send_test', sendTest);
        post('/notifications/bots', { onSuccess: onClose });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <i className="fab fa-telegram text-blue-500"></i>
                        {bot ? 'Edit Telegram Bot' : 'Add Telegram Bot'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
                        <i className="fas fa-xmark"></i>
                    </button>
                </div>

                {!bot && (
                    <div className="mx-6 mt-5 p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 space-y-2">
                        <p className="font-bold text-sm flex items-center gap-2">
                            <i className="fab fa-telegram text-blue-500"></i>Quick Setup Guide
                        </p>
                        <ol className="list-decimal list-inside space-y-1.5 text-blue-700">
                            <li>Open Telegram and search <span className="font-mono bg-blue-100 px-1 rounded">@BotFather</span></li>
                            <li>Send <span className="font-mono bg-blue-100 px-1 rounded">/newbot</span> and follow the prompts</li>
                            <li>Copy the <strong>Bot Token</strong> BotFather gives you</li>
                            <li>Add the bot to your group or get your personal Chat ID from <span className="font-mono bg-blue-100 px-1 rounded">@userinfobot</span></li>
                            <li>Paste both below and click <strong>Save & Test</strong></li>
                        </ol>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                            Bot Label <span className="text-red-500">*</span>
                        </label>
                        <input type="text" required className={`form-input w-full ${errors.label ? 'border-red-400' : ''}`}
                            placeholder="e.g. Security Alerts Bot"
                            value={data.label} onChange={(e) => setData('label', e.target.value)} />
                        {errors.label && <p className="text-xs text-red-600 mt-1">{errors.label}</p>}
                        <p className="text-[11px] text-gray-400 mt-1">A friendly name to identify this bot.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                            Bot Token <span className="text-red-500">*</span>
                        </label>
                        <input type="text" required className={`form-input w-full font-mono text-sm ${errors.bot_token ? 'border-red-400' : ''}`}
                            placeholder="123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            value={data.bot_token} onChange={(e) => setData('bot_token', e.target.value)} />
                        {errors.bot_token && <p className="text-xs text-red-600 mt-1">{errors.bot_token}</p>}
                        <p className="text-[11px] text-gray-400 mt-1">From <span className="font-mono">@BotFather</span> — keep this secret.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                            Chat ID <span className="text-red-500">*</span>
                        </label>
                        <input type="text" required className={`form-input w-full font-mono text-sm ${errors.chat_id ? 'border-red-400' : ''}`}
                            placeholder="-1001234567890 or 123456789"
                            value={data.chat_id} onChange={(e) => setData('chat_id', e.target.value)} />
                        {errors.chat_id && <p className="text-xs text-red-600 mt-1">{errors.chat_id}</p>}
                        <p className="text-[11px] text-gray-400 mt-1">Negative for groups/channels, positive for personal chats.</p>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <div className="relative">
                                <input type="checkbox" className="sr-only peer"
                                    checked={data.enabled} onChange={(e) => setData('enabled', e.target.checked)} />
                                <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-600 rounded-full transition"></div>
                                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition peer-checked:translate-x-4"></div>
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Bot Enabled</span>
                        </label>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button type="submit" disabled={processing} onClick={(e) => handleSubmit(e, true)}
                            className="btn btn-primary flex-1">
                            <i className="fas fa-paper-plane mr-1.5"></i>Save & Test
                        </button>
                        <button type="submit" disabled={processing} onClick={(e) => handleSubmit(e, false)}
                            className="btn btn-secondary">
                            <i className="fas fa-save mr-1.5"></i>Save
                        </button>
                        {bot && (
                            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════════════════════════
export default function NotificationsIndex({ tab, stats, bots, rules, auditConfigs, logs, eventTypes, modules, filterLevels }: Props) {
    const flash = (usePage<any>().props.flash ?? {}) as { success?: string; error?: string };
    const [activeTab, setActiveTab] = useState(tab);
    const [showBotModal, setShowBotModal] = useState(false);
    const [editBot, setEditBot] = useState<Bot | undefined>(undefined);

    function openBotModal(bot?: Bot) {
        setEditBot(bot);
        setShowBotModal(true);
    }

    function testBot(id: number) {
        router.post(`/notifications/bots/${id}/test`);
    }

    function deleteBot(id: number, label: string) {
        if (confirm(`Delete bot "${label}"?`)) {
            router.delete(`/notifications/bots/${id}`);
        }
    }

    return (
        <AppLayout title="Notification Center" subtitle="Telegram bot alerts and notification rules">
            <div className="space-y-6">

                {/* Flash Messages */}
                {flash.success && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-800 text-sm">
                        <i className="fas fa-circle-check text-green-500"></i>{flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-800 text-sm">
                        <i className="fas fa-circle-exclamation text-red-500"></i>{flash.error}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Bots Configured', value: stats.total_bots,   icon: 'fa-robot',              color: 'blue' },
                        { label: 'Active Bots',     value: stats.active_bots,  icon: 'fa-circle-check',       color: 'green' },
                        { label: 'Sent',            value: stats.total_sent,   icon: 'fa-paper-plane',        color: 'indigo' },
                        { label: 'Failed',          value: stats.total_failed, icon: 'fa-circle-exclamation', color: 'red' },
                    ].map((s) => (
                        <div key={s.label} className="card p-4 hover:shadow-md transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{s.label}</p>
                                    <p className="text-2xl font-black text-gray-900 mt-1">{s.value}</p>
                                </div>
                                <div className={`w-10 h-10 rounded-lg bg-${s.color}-50 text-${s.color}-500 flex items-center justify-center`}>
                                    <i className={`fas ${s.icon}`}></i>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tab bar */}
                <div className="card px-4 py-1 flex items-center gap-1 overflow-x-auto">
                    {[
                        { id: 'bots',  icon: 'fa-robot',             label: 'Telegram Bots' },
                        { id: 'rules', icon: 'fa-sliders',           label: 'Notification Rules' },
                        { id: 'audit', icon: 'fa-clipboard-list',    label: 'Audit Forwarding', badge: auditConfigs.length },
                        { id: 'log',   icon: 'fa-clock-rotate-left', label: 'Activity Log' },
                    ].map((t) => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
                                activeTab === t.id ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                            }`}>
                            <i className={`fas ${t.icon} text-xs`}></i>{t.label}
                            {t.badge !== undefined && t.badge > 0 && (
                                <span className="text-[9px] font-black bg-green-500 text-white px-1.5 py-0.5 rounded-full">{t.badge}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* TAB: BOTS */}
                {activeTab === 'bots' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {/* Bot list */}
                        <div className="lg:col-span-3 card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-gray-900 flex items-center">
                                    <i className="fas fa-list mr-2 text-gray-400"></i>Configured Bots
                                    <span className="ml-2 text-xs text-gray-400 font-normal">{bots.length} total</span>
                                </h3>
                                <button onClick={() => openBotModal()} className="btn btn-primary text-sm">
                                    <i className="fab fa-telegram mr-1.5"></i>Add Telegram Bot
                                </button>
                            </div>

                            {bots.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <i className="fab fa-telegram text-4xl mb-3 block text-gray-300"></i>
                                    <p className="text-sm font-medium">No bots configured yet.</p>
                                    <p className="text-xs mt-1">Click "Add Telegram Bot" to create your first bot.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {bots.map((bot) => (
                                        <div key={bot.id} className={`flex items-start gap-4 p-4 rounded-xl border hover:shadow-sm transition ${
                                            bot.enabled ? 'border-blue-100 bg-blue-50/30' : 'border-gray-200 bg-gray-50/40'
                                        }`}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                                bot.enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'
                                            }`}>
                                                <i className="fab fa-telegram text-lg"></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <p className="text-sm font-bold text-gray-900 truncate">{bot.label}</p>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                        bot.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                                                    }`}>
                                                        {bot.enabled ? 'Active' : 'Disabled'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 font-mono truncate">
                                                    Token: {bot.bot_token.substring(0, 12)}•••••
                                                </p>
                                                <p className="text-xs text-gray-500 font-mono truncate">
                                                    Chat: {bot.chat_id}
                                                </p>
                                                <p className="text-[11px] text-gray-400 mt-1">Added {fmtDate(bot.created_at)}</p>
                                            </div>
                                            <div className="flex flex-col gap-1 flex-shrink-0">
                                                <button onClick={() => testBot(bot.id)} title="Send Test Message"
                                                    className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition">
                                                    <i className="fas fa-paper-plane text-xs"></i>
                                                </button>
                                                <button onClick={() => openBotModal(bot)} title="Edit"
                                                    className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition">
                                                    <i className="fas fa-pen text-xs"></i>
                                                </button>
                                                <button onClick={() => deleteBot(bot.id, bot.label)} title="Delete"
                                                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition">
                                                    <i className="fas fa-trash text-xs"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB: RULES */}
                {activeTab === 'rules' && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                        {/* Add rule form */}
                        <div className="lg:col-span-2 card p-6">
                            <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center">
                                <i className="fas fa-sliders mr-2 text-indigo-500"></i>Add Notification Rule
                            </h3>

                            {bots.length === 0 ? (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                                    <i className="fas fa-triangle-exclamation mr-2"></i>
                                    No bots configured yet. <button onClick={() => setActiveTab('bots')} className="underline font-semibold">Add a bot first</button>.
                                </div>
                            ) : (
                                <RuleForm bots={bots} eventTypes={eventTypes} />
                            )}
                        </div>

                        {/* Rules list */}
                        <div className="lg:col-span-3 card p-6">
                            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center">
                                <i className="fas fa-list mr-2 text-gray-400"></i>Active Rules
                                <span className="ml-auto text-xs text-gray-400 font-normal">{rules.length} rules</span>
                            </h3>

                            {rules.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <i className="fas fa-sliders text-4xl mb-3 block text-gray-300"></i>
                                    <p className="text-sm font-medium">No rules configured.</p>
                                    <p className="text-xs mt-1">Rules control which events trigger a notification.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-gray-100">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 text-left">
                                                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Event</th>
                                                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Bot</th>
                                                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Min Severity</th>
                                                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Status</th>
                                                <th className="px-4 py-2.5"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {rules.map((rule) => (
                                                <tr key={rule.id} className="hover:bg-gray-50/50 transition">
                                                    <td className="px-4 py-3 font-semibold text-gray-800">
                                                        {eventTypes[rule.event_type] ?? rule.event_type}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600">
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                                            <i className="fab fa-telegram text-[10px]"></i>{rule.bot?.label ?? 'Unknown'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {rule.min_severity ? (
                                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
                                                                {rule.min_severity}+
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">Any</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                            rule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                                                        }`}>
                                                            {rule.enabled ? 'On' : 'Off'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            onClick={() => {
                                                                if (confirm('Delete this rule?')) {
                                                                    router.delete(`/notifications/rules/${rule.id}`);
                                                                }
                                                            }}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                                            <i className="fas fa-trash text-xs"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB: AUDIT FORWARDING */}
                {activeTab === 'audit' && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                        {/* Add config form */}
                        <div className="lg:col-span-2 card p-6">
                            <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <i className="fas fa-clipboard-list text-indigo-500"></i>Link Audit Log to Bot
                            </h3>
                            <p className="text-xs text-gray-500 mb-5">
                                Every action recorded in the audit log will be forwarded in real-time to the selected Telegram bot.
                            </p>

                            {bots.length === 0 ? (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                                    <i className="fas fa-triangle-exclamation mr-2"></i>
                                    No bots configured yet. <button onClick={() => setActiveTab('bots')} className="underline font-semibold">Add a bot first</button>.
                                </div>
                            ) : (
                                <AuditConfigForm bots={bots} modules={modules} filterLevels={filterLevels} />
                            )}

                            {/* Info box */}
                            <div className="mt-5 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800 space-y-2">
                                <p className="font-bold flex items-center gap-2">
                                    <i className="fas fa-circle-info text-indigo-500"></i>What gets forwarded?
                                </p>
                                <ul className="space-y-1 text-indigo-700 list-disc list-inside">
                                    <li>Every user login and logout</li>
                                    <li>Incident creation, updates, and closure</li>
                                    <li>Hardware and software asset changes</li>
                                    <li>Threat indicator additions and deletions</li>
                                    <li>Branch and security configuration edits</li>
                                    <li>User account management actions</li>
                                    <li>Settings and system changes</li>
                                </ul>
                            </div>
                        </div>

                        {/* Existing configs */}
                        <div className="lg:col-span-3 space-y-5">
                            {/* Sample message preview */}
                            <div className="card p-5 border border-dashed border-indigo-200 bg-indigo-50/30">
                                <p className="text-xs font-bold text-indigo-700 mb-3 flex items-center gap-2">
                                    <i className="fab fa-telegram text-blue-500"></i>Sample Telegram Message
                                </p>
                                <div className="bg-white rounded-xl p-4 text-xs font-mono text-gray-700 space-y-0.5 border border-gray-100 shadow-sm leading-relaxed">
                                    <p>🔐 <strong>Audit Log — Auth</strong></p>
                                    <p>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
                                    <p>🕐 <strong>Time:</strong> 2026-08-17 11:18:24</p>
                                    <p>👤 <strong>Actor:</strong> maria.santos <em>(Super Admin)</em></p>
                                    <p>📌 <strong>Action:</strong> Login successful</p>
                                    <p>🎯 <strong>Target:</strong> maria.santos</p>
                                    <p>📝 <strong>Detail:</strong> Role: super_admin</p>
                                    <p>🌐 <strong>IP:</strong> 192.168.1.10</p>
                                </div>
                            </div>

                            {/* Active configs */}
                            <div className="card p-6">
                                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center">
                                    <i className="fas fa-list mr-2 text-gray-400"></i>Active Forwarding Configs
                                    <span className="ml-auto text-xs text-gray-400 font-normal">{auditConfigs.length} configured</span>
                                </h3>

                                {auditConfigs.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400">
                                        <i className="fas fa-clipboard-list text-4xl mb-3 block text-gray-300"></i>
                                        <p className="text-sm font-medium">No audit forwarding configured yet.</p>
                                        <p className="text-xs mt-1">Use the form to link a bot to the audit log.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {auditConfigs.map((cfg) => {
                                            const levelLabels: Record<string, [string, string]> = {
                                                all:      ['All Events', 'bg-blue-100 text-blue-700'],
                                                auth:     ['Auth Only', 'bg-purple-100 text-purple-700'],
                                                delete:   ['Destructive Only', 'bg-orange-100 text-orange-700'],
                                                critical: ['Critical Only', 'bg-red-100 text-red-700'],
                                            };
                                            const [levelLabel, levelClass] = levelLabels[cfg.filter_level] ?? ['Unknown', 'bg-gray-100 text-gray-500'];

                                            return (
                                                <div key={cfg.id} className={`flex items-start gap-4 p-4 rounded-xl border hover:shadow-sm transition ${
                                                    cfg.enabled ? 'border-indigo-100 bg-indigo-50/20' : 'border-gray-200 bg-gray-50/40'
                                                }`}>
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                                        cfg.enabled ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-400'
                                                    }`}>
                                                        <i className="fas fa-clipboard-list text-sm"></i>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                                            <p className="text-sm font-bold text-gray-900">{cfg.bot?.label ?? 'Unknown'}</p>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                cfg.enabled && cfg.bot?.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                                                            }`}>
                                                                {cfg.enabled && cfg.bot?.enabled ? 'Active' : 'Disabled'}
                                                            </span>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${levelClass}`}>
                                                                {levelLabel}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                                            <span>
                                                                <i className="fas fa-filter mr-1 text-gray-300"></i>
                                                                Module: <strong className="text-gray-700">
                                                                    {cfg.filter_module !== '' ? modules[cfg.filter_module] ?? cfg.filter_module : 'All'}
                                                                </strong>
                                                            </span>
                                                            {cfg.filter_actor !== '' && (
                                                                <span>
                                                                    <i className="fas fa-user mr-1 text-gray-300"></i>
                                                                    Actor: <strong className="text-gray-700 font-mono">{cfg.filter_actor}</strong>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        <button
                                                            onClick={() => {
                                                                if (confirm('Remove this audit forwarding config?')) {
                                                                    router.delete(`/notifications/audit-config/${cfg.id}`);
                                                                }
                                                            }}
                                                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                                                            title="Delete">
                                                            <i className="fas fa-trash text-xs"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: ACTIVITY LOG */}
                {activeTab === 'log' && (
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-bold text-gray-900 flex items-center">
                                <i className="fas fa-clock-rotate-left mr-2 text-gray-400"></i>Activity Log
                                <span className="ml-2 text-xs text-gray-400 font-normal">Last 50 entries</span>
                            </h3>
                            {logs.length > 0 && (
                                <button
                                    onClick={() => {
                                        if (confirm('Clear all notification logs?')) {
                                            router.delete('/notifications/log/clear');
                                        }
                                    }}
                                    className="btn btn-secondary text-xs py-1.5 text-red-500 hover:bg-red-50">
                                    <i className="fas fa-trash mr-1"></i>Clear Log
                                </button>
                            )}
                        </div>

                        {logs.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <i className="fas fa-clock-rotate-left text-4xl mb-3 block text-gray-300"></i>
                                <p className="text-sm font-medium">No notifications sent yet.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-gray-100">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 text-left">
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Time</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Event</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Message Preview</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Status</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Error</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50/50 transition">
                                                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                                    {new Date(log.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-gray-800 text-xs">
                                                    {eventTypes[log.event_type] ?? log.event_type}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 hidden md:table-cell max-w-xs truncate text-xs">
                                                    {log.message.length > 80 ? log.message.substring(0, 80) + '…' : log.message}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {log.status === 'sent' ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                                            <i className="fas fa-check text-[8px]"></i>Sent
                                                        </span>
                                                    ) : log.status === 'failed' ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                                            <i className="fas fa-xmark text-[8px]"></i>Failed
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                                            {log.status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-red-500 hidden lg:table-cell max-w-xs truncate">
                                                    {log.error ?? '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* Bot modal */}
            {showBotModal && (
                <BotModal
                    bot={editBot}
                    onClose={() => { setShowBotModal(false); setEditBot(undefined); }}
                />
            )}
        </AppLayout>
    );
}
