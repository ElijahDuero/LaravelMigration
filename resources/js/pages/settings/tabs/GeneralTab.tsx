export default function GeneralTab() {
    return (
        <div className="space-y-6">
            {/* ── Organization Info ── */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                        <i className="fas fa-gear" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">General Settings</h3>
                        <p className="text-sm text-gray-500">Organization identity and regional defaults</p>
                    </div>
                </div>
                <form className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-sm font-bold text-gray-700">
                            Organization Name <span className="text-red-500">*</span>
                        </label>
                        <input type="text" defaultValue="CyberSec Portal Incident Management System"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-bold text-gray-700">Short Name</label>
                        <input type="text" defaultValue="CSP-IMS"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-bold text-gray-700">Default Timezone</label>
                        <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200">
                            <option>(UTC+08:00) Manila, Philippines – Asia/Manila</option>
                            <option>(UTC+00:00) UTC</option>
                            <option>(UTC-05:00) Eastern Time</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-bold text-gray-700">Date Format</label>
                        <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200">
                            <option>MM/DD/YYYY (Jul 28, 2026)</option>
                            <option>DD/MM/YYYY (28/07/2026)</option>
                            <option>YYYY-MM-DD (2026-07-28)</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-bold text-gray-700">Default Language</label>
                        <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200">
                            <option>English (US)</option>
                            <option>Filipino</option>
                            <option>Spanish</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-bold text-gray-700">Incident Number Prefix</label>
                        <input type="text" defaultValue="INC-{YYYY}-{NNNN}"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                        <p className="mt-1 text-[11px] text-gray-500">Example: INC-2026-0015</p>
                    </div>

                    {/* Toggle: self-registration */}
                    <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                        <div>
                            <p className="text-sm font-bold text-gray-800">User self-registration</p>
                            <p className="mt-0.5 text-xs text-gray-500">Allow new users to create accounts with email invite only</p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input type="checkbox" className="peer sr-only" defaultChecked />
                            <div className="peer h-7 w-12 rounded-full bg-gray-200 after:absolute after:left-[4px] after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full" />
                        </label>
                    </div>

                    {/* Toggle: maintenance */}
                    <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                        <div>
                            <p className="text-sm font-bold text-gray-800">Maintenance mode banner</p>
                            <p className="mt-0.5 text-xs text-gray-500">Show a warning banner at login for scheduled maintenance</p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input type="checkbox" className="peer sr-only" />
                            <div className="peer h-7 w-12 rounded-full bg-gray-200 after:absolute after:left-[4px] after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full" />
                        </label>
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-2 pt-3">
                        <button type="button" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                            Discard
                        </button>
                        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                            <i className="fas fa-save mr-2" />Save Changes
                        </button>
                    </div>
                </form>
            </div>

            {/* ── Branding ── */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-lg font-semibold text-gray-900">Organization Branding</h3>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-bold text-gray-700">Portal Logo</label>
                        <div className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-6 text-center transition hover:border-blue-400 hover:bg-blue-50/30">
                            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-2xl font-black text-white shadow-md">CS</div>
                            <p className="mb-0.5 text-sm font-semibold text-gray-800">Current logo</p>
                            <p className="mb-3 text-[11px] text-gray-500">512×512px PNG (transparent)</p>
                            <button className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50">Replace Logo</button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-gray-700">Primary Brand Color</label>
                            <div className="flex items-center gap-3">
                                <input type="color" defaultValue="#2563eb" className="h-12 w-12 cursor-pointer rounded-xl p-1" />
                                <div className="grid grid-cols-6 gap-2">
                                    {['#2563eb','#7c3aed','#db2777','#dc2626','#ea580c','#059669'].map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            className="aspect-square cursor-pointer rounded-lg transition hover:scale-110"
                                            style={{ background: c }}
                                            aria-label={c}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-gray-700">Login Page Message</label>
                            <textarea rows={2} defaultValue="Authorized personnel only. All activity logged and monitored."
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
