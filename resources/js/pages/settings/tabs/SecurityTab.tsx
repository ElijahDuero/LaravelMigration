export default function SecurityTab() {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-xl font-bold text-gray-900">Security Settings</h3>
            <p className="mb-6 border-b border-gray-100 pb-5 text-sm text-gray-500">
                Authentication, password policy, session controls
            </p>

            <div className="space-y-5">
                {/* Password Policy Banner */}
                <div className="flex items-start gap-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                        <i className="fas fa-lock text-xl" />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-emerald-900">Password Policy</p>
                        <p className="mt-0.5 text-xs text-emerald-700/80">Enforced across all users</p>
                    </div>
                    <button className="rounded-lg border border-emerald-300 bg-white/80 px-3 py-1.5 text-xs font-bold text-emerald-700">
                        Edit Policy
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-4">
                        <p className="text-xs font-bold uppercase text-gray-600">Min Length</p>
                        <p className="mt-1 text-2xl font-black">14 chars</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-4">
                        <p className="text-xs font-bold uppercase text-gray-600">Complexity</p>
                        <p className="mt-1 text-sm font-bold leading-tight">Upper+lower</p>
                        <p className="text-sm font-bold leading-tight">num+special</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-4">
                        <p className="text-xs font-bold uppercase text-gray-600">Expiry</p>
                        <p className="mt-1 text-2xl font-black">
                            90 <span className="text-sm font-semibold text-gray-500">days</span>
                        </p>
                    </div>
                </div>

                {/* MFA Toggle */}
                <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                    <div>
                        <p className="font-bold text-gray-800">Multi-Factor (MFA) Enforcement</p>
                        <p className="mt-0.5 text-xs text-gray-500">Require MFA for all non-Viewer roles</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                        <input type="checkbox" className="peer sr-only" defaultChecked />
                        <div className="peer h-7 w-12 rounded-full bg-gray-200 after:absolute after:left-[4px] after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full" />
                    </label>
                </div>

                {/* Session Timeout */}
                <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                    <div>
                        <p className="font-bold text-gray-800">Session Timeout</p>
                        <p className="mt-0.5 text-xs text-gray-500">Auto-logout idle users</p>
                    </div>
                    <select
                        defaultValue="30"
                        className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="240">4 hours</option>
                    </select>
                </div>

                {/* Brute Force */}
                <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                    <div>
                        <p className="font-bold text-gray-800">Brute Force Lockout</p>
                        <p className="mt-0.5 text-xs text-gray-500">After 5 failed attempts, lock account 30 min</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                        <input type="checkbox" className="peer sr-only" defaultChecked />
                        <div className="peer h-7 w-12 rounded-full bg-gray-200 after:absolute after:left-[4px] after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full" />
                    </label>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                    <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                        Reset to Defaults
                    </button>
                    <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                        <i className="fas fa-save mr-2" />Apply Security Policy
                    </button>
                </div>
            </div>
        </div>
    );
}
