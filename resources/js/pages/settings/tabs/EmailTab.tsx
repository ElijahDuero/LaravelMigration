export default function EmailTab() {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-xl font-bold text-gray-900">Email Server (SMTP)</h3>
            <p className="mb-6 border-b border-gray-100 pb-5 text-sm text-gray-500">
                Configure outbound email relay and sender info
            </p>

            <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-700">SMTP Host</label>
                    <input
                        type="text"
                        defaultValue="smtp.office365.com"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-700">Port</label>
                    <input
                        type="number"
                        defaultValue={587}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-700">Username</label>
                    <input
                        type="text"
                        defaultValue="noreply@company.com"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-700">Password / App Password</label>
                    <input
                        type="password"
                        defaultValue="placeholder"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-700">Encryption</label>
                    <select
                        defaultValue="STARTTLS"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        <option value="None">None</option>
                        <option value="SSL">SSL/TLS</option>
                        <option value="STARTTLS">STARTTLS</option>
                    </select>
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-700">Auth Method</label>
                    <select
                        defaultValue="PLAIN"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        <option value="PLAIN">PLAIN / LOGIN</option>
                        <option value="CRAM">CRAM-MD5</option>
                        <option value="OAUTH2">OAUTH2</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-bold text-gray-700">Default Sender Display Name</label>
                    <input
                        type="text"
                        defaultValue="CyberSec Portal Alerts"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    <i className="fas fa-paper-plane mr-2" />Send Test Email
                </button>
                <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    <i className="fas fa-rotate mr-2" />Verify Connection
                </button>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                    <i className="fas fa-circle-check mr-1.5" />Connection verified
                </span>
                <div className="ml-auto">
                    <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                        <i className="fas fa-save mr-2" />Save SMTP Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
