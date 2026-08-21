import { router } from '@inertiajs/react';
import AppLayout from '@/components/AppLayout';
import GeneralTab from './tabs/GeneralTab';
import SecurityTab from './tabs/SecurityTab';
import NotificationsTab from './tabs/NotificationsTab';
import EmailTab from './tabs/EmailTab';
import IntegrationsTab from './tabs/IntegrationsTab';
import BackupTab from './tabs/BackupTab';
import AuditLogTab, { type AuditData, type ModMeta } from './tabs/AuditLogTab';
import SamplesTab, { type SampleCounts } from './tabs/SamplesTab';
import AboutTab from './tabs/AboutTab';

type TabKey =
    | 'general' | 'appearance' | 'security' | 'notifications'
    | 'email' | 'integrations' | 'backup' | 'audit' | 'samples' | 'about';

type TabConfig = { label: string; icon: string };

type Props = {
    tabs: Record<TabKey, TabConfig>;
    activeTab: TabKey;
    sampleCounts: SampleCounts;
    auditData: AuditData | null;
    modMeta: ModMeta;
};

export default function SettingsIndex({ tabs, activeTab, sampleCounts, auditData, modMeta }: Props) {
    function goTab(tab: TabKey) {
        router.get('/settings', { tab }, { preserveScroll: false, replace: true });
    }

    return (
        <AppLayout title="Settings" subtitle="Configure system preferences">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

                {/* ── Left sidebar nav ──────────────────────────────── */}
                <div className="lg:col-span-1">
                    <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                        <nav className="space-y-1">
                            {(Object.entries(tabs) as [TabKey, TabConfig][]).map(([key, t]) => {
                                const active = activeTab === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => goTab(key)}
                                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                                            active
                                                ? 'bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-900/30 dark:text-blue-400'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-700 dark:hover:text-gray-100'
                                        }`}
                                    >
                                        <i className={`fas ${t.icon} w-5 text-center ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                                        {t.label}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Danger zone */}
                        <div className="mx-2 mt-4 rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-3 dark:border-amber-900/30 dark:from-amber-950/30 dark:to-orange-950/30">
                            <div className="flex items-start gap-2">
                                <i className="fas fa-circle-exclamation mt-0.5 text-amber-500" />
                                <div>
                                    <p className="text-xs font-bold text-amber-800 dark:text-amber-400">Danger Zone</p>
                                    <p className="mt-0.5 text-[11px] text-amber-700/80 dark:text-amber-500/80">Irreversible system actions</p>
                                    <button
                                        onClick={() => goTab('samples')}
                                        className="mt-2 w-full rounded-lg border border-red-200 bg-red-50 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400"
                                    >
                                        Reset All Data
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Tab content ──────────────────────────────────── */}
                <div className="lg:col-span-4">
                    {activeTab === 'general'       && <GeneralTab />}
                    {activeTab === 'appearance'    && <GeneralTab />}
                    {activeTab === 'security'      && <SecurityTab />}
                    {activeTab === 'notifications' && <NotificationsTab />}
                    {activeTab === 'email'         && <EmailTab />}
                    {activeTab === 'integrations'  && <IntegrationsTab />}
                    {activeTab === 'backup'        && <BackupTab />}
                    {activeTab === 'audit'         && auditData && (
                        <AuditLogTab auditData={auditData} modMeta={modMeta} />
                    )}
                    {activeTab === 'samples' && (
                        <SamplesTab sampleCounts={sampleCounts} />
                    )}
                    {activeTab === 'about' && <AboutTab />}
                </div>

            </div>
        </AppLayout>
    );
}
