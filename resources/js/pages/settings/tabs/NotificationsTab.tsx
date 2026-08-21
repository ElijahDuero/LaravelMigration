const NOTIF_EVENTS = [
    { label: 'New Critical Incident',    email: true,  inapp: true,  sms: true  },
    { label: 'Incident Status Change',   email: true,  inapp: true,  sms: false },
    { label: 'Incident Assigned to You', email: true,  inapp: true,  sms: true  },
    { label: 'High Risk Registered',     email: true,  inapp: true,  sms: false },
    { label: 'Weekly Security Digest',   email: true,  inapp: false, sms: false },
    { label: 'Posture Score Change >5%', email: true,  inapp: true,  sms: false },
    { label: 'New User Registration',    email: false, inapp: true,  sms: false },
    { label: 'Failed Login (x5)',        email: true,  inapp: true,  sms: true  },
    { label: 'Backup Completed',         email: false, inapp: false, sms: false },
    { label: 'Report Ready',             email: true,  inapp: true,  sms: false },
];

export default function NotificationsTab() {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Notification Preferences</h3>
            <p className="text-sm text-gray-500 mb-6 pb-5 border-b border-gray-100">Events triggering email, in-app, or SMS alerts</p>

            <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full">
                    <thead className="bg-gray-50/70">
                        <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            <th className="px-5 py-3">Event</th>
                            <th className="px-5 py-3 text-center">Email</th>
                            <th className="px-5 py-3 text-center">In-App</th>
                            <th className="hidden px-5 py-3 text-center md:table-cell">SMS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {NOTIF_EVENTS.map((n) => (
                            <tr key={n.label} className="hover:bg-gray-50/50">
                                <td className="px-5 py-3.5 text-sm font-semibold text-gray-800">{n.label}</td>
                                <td className="px-5 py-3.5 text-center">
                                    <input type="checkbox" defaultChecked={n.email} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                    <input type="checkbox" defaultChecked={n.inapp} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                                </td>
                                <td className="hidden px-5 py-3.5 text-center md:table-cell">
                                    <input type="checkbox" defaultChecked={n.sms} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500">
                    Default recipients: <span className="font-semibold">security-team@company.com</span>
                </p>
                <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                    <i className="fas fa-save mr-2" />Save Preferences
                </button>
            </div>
        </div>
    );
}
