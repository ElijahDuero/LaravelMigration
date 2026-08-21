const RECENT_BACKUPS = [
    { file: 'backup_20260728_0200.sql.gz', size: '2.4 GB', duration: '12m 42s' },
    { file: 'backup_20260727_0200.sql.gz', size: '2.3 GB', duration: '11m 08s' },
    { file: 'backup_20260726_0200.sql.gz', size: '2.3 GB', duration: '11m 55s' },
];

export default function BackupTab() {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-xl font-bold text-gray-900">Backup & Data Management</h3>
            <p className="mb-6 border-b border-gray-100 pb-5 text-sm text-gray-500">Scheduled backups, retention, exports</p>

            {/* Stats cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-blue-100">Last Backup</p>
                    <p className="mb-1 text-3xl font-black">Jul 28</p>
                    <p className="text-xs text-blue-200">02:00 AM · Auto</p>
                    <p className="mt-3 text-xs text-blue-100">2.4 GB · 98,412 records</p>
                    <button className="mt-4 w-full rounded-lg border border-white/20 bg-white/15 py-2 text-sm font-bold transition hover:bg-white/25">
                        <i className="fas fa-play mr-2" />Backup Now
                    </button>
                </div>
                <div className="rounded-2xl border border-gray-200 p-5">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-gray-500">Schedule</span>
                        <i className="fas fa-calendar-check text-emerald-500" />
                    </div>
                    <p className="text-xl font-black text-gray-900">Daily</p>
                    <p className="mt-0.5 text-xs text-gray-500">2:00 AM (Manila)</p>
                    <div className="mt-4 border-t border-gray-100 pt-3 text-[11px] text-gray-500">
                        Retention: <span className="font-bold text-gray-800">90 days</span>
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-200 p-5">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-gray-500">Storage Used</span>
                        <i className="fas fa-database text-blue-500" />
                    </div>
                    <p className="text-xl font-black text-gray-900">14.2 / 50 GB</p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full w-[28%] rounded-full bg-gradient-to-r from-blue-400 to-indigo-600" />
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                        <button className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">Upgrade</button>
                        <span className="text-[11px] text-gray-400">28%</span>
                    </div>
                </div>
            </div>

            {/* Recent backups table */}
            <h4 className="mb-3 font-bold text-gray-800">Recent Backups</h4>
            <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-[11px] font-bold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3 text-left">Filename</th>
                            <th className="px-4 py-3 text-center">Size</th>
                            <th className="hidden px-4 py-3 text-left md:table-cell">Duration</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                        {RECENT_BACKUPS.map((b) => (
                            <tr key={b.file}>
                                <td className="px-4 py-3 font-mono text-xs">{b.file}</td>
                                <td className="px-4 py-3 text-center font-mono text-xs">{b.size}</td>
                                <td className="hidden px-4 py-3 text-xs md:table-cell">{b.duration}</td>
                                <td className="px-4 py-3">
                                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                                        <i className="fas fa-check mr-1" />Success
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button className="text-xs font-bold text-blue-600 hover:underline">Download</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
