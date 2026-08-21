import AppLayout from '@/components/AppLayout';
import { Link, useForm, router } from '@inertiajs/react';

interface Hardware {
    id: number;
    tag: string;
    name: string;
    type: string;
    serial: string;
    manufacturer: string;
    model: string;
    status: string;
    branch: string;
    building: string | null;
    room: string | null;
    rack: string | null;
    assigned_user: string | null;
    department: string | null;
    ip_address: string | null;
    mac_address: string | null;
    hostname: string | null;
    operating_system: string | null;
    cpu: string | null;
    ram: string | null;
    storage: string | null;
    purchase_date: string | null;
    warranty_expiry: string | null;
    supplier: string | null;
    invoice: string | null;
    purchase_cost: string | null;
    notes: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    hardware: Hardware;
    branches: string[];
}

const TYPE_META: Record<string, { icon: string; color: string }> = {
    Desktop:    { icon: 'fa-desktop',        color: 'purple' },
    Laptop:     { icon: 'fa-laptop',          color: 'indigo' },
    Server:     { icon: 'fa-server',          color: 'blue' },
    NAS:        { icon: 'fa-hard-drive',      color: 'teal' },
    Firewall:   { icon: 'fa-shield-halved',   color: 'red' },
    Switch:     { icon: 'fa-network-wired',   color: 'cyan' },
    Router:     { icon: 'fa-wifi',            color: 'sky' },
    Printer:    { icon: 'fa-print',           color: 'amber' },
    CCTV:       { icon: 'fa-video',           color: 'pink' },
    Biometrics: { icon: 'fa-fingerprint',     color: 'fuchsia' },
    'WiFi AP':  { icon: 'fa-tower-broadcast', color: 'emerald' },
    UPS:        { icon: 'fa-battery-full',    color: 'orange' },
};

const HW_TYPES    = Object.keys(TYPE_META);
const STATUSES    = ['Active', 'In Maintenance', 'Pending Deployment', 'Decommissioned', 'Lost/Stolen'];
const BUILDINGS   = ['Data Center', 'Admin Bldg', 'Cebu Office', 'Davao Office', 'Iloilo Office', 'CDO Office'];
const DEPARTMENTS = ['IT Operations', 'Network Team', 'Finance', 'HR', 'Sales', 'Security', 'Admin', 'DevOps'];

export default function HardwareEdit({ hardware, branches }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name:             hardware.name ?? '',
        type:             hardware.type ?? '',
        serial:           hardware.serial ?? '',
        manufacturer:     hardware.manufacturer ?? '',
        model:            hardware.model ?? '',
        branch:           hardware.branch ?? '',
        status:           hardware.status ?? 'Active',
        building:         hardware.building ?? '',
        room:             hardware.room ?? '',
        rack:             hardware.rack ?? '',
        assigned_user:    hardware.assigned_user ?? '',
        department:       hardware.department ?? '',
        ip_address:       hardware.ip_address ?? '',
        mac_address:      hardware.mac_address ?? '',
        hostname:         hardware.hostname ?? '',
        operating_system: hardware.operating_system ?? '',
        cpu:              hardware.cpu ?? '',
        ram:              hardware.ram ?? '',
        storage:          hardware.storage ?? '',
        purchase_date:    hardware.purchase_date ?? '',
        warranty_expiry:  hardware.warranty_expiry ?? '',
        supplier:         hardware.supplier ?? '',
        invoice:          hardware.invoice ?? '',
        purchase_cost:    hardware.purchase_cost ?? '',
        notes:            hardware.notes ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(`/hardware/${hardware.tag}`);
    }

    function handleDelete() {
        if (!confirm(`Permanently delete hardware asset ${hardware.tag}? This cannot be undone.`)) return;
        router.delete(`/hardware/${hardware.tag}`);
    }

    return (
        <AppLayout title="Edit Hardware Asset" subtitle="Update hardware asset information">
            <form onSubmit={submit} className="space-y-6">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <Link href={`/hardware/${hardware.tag}`} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                            <i className="fas fa-arrow-left text-gray-600"></i>
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Edit Hardware Asset</h2>
                            <p className="text-sm text-gray-500 font-mono">
                                {hardware.tag} · Last updated: {hardware.updated_at}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={handleDelete} className="btn btn-secondary">
                            <i className="fas fa-trash mr-2"></i>Delete
                        </button>
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            <i className="fas fa-floppy-disk mr-2"></i>Save Changes
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">

                        {/* ── Identifiers ── */}
                        <div className="card p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-microchip text-blue-600"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Hardware Identifiers</h3>
                                    <p className="text-sm text-gray-500">Tag, serial, model, manufacturer</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Asset Tag</label>
                                    <input type="text" className="form-input bg-gray-50" value={hardware.tag} readOnly />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Asset Name <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" className={`form-input ${errors.name ? 'border-red-400' : ''}`}
                                        value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Serial Number <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" className={`form-input ${errors.serial ? 'border-red-400' : ''}`}
                                        value={data.serial} onChange={(e) => setData('serial', e.target.value)} />
                                    {errors.serial && <p className="text-xs text-red-500 mt-1">{errors.serial}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Hardware Type <span className="text-red-500">*</span>
                                    </label>
                                    <select className={`form-input ${errors.type ? 'border-red-400' : ''}`}
                                        value={data.type} onChange={(e) => setData('type', e.target.value)}>
                                        <option value="">Select Type</option>
                                        {HW_TYPES.map((t) => <option key={t}>{t}</option>)}
                                    </select>
                                    {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Manufacturer <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" className={`form-input ${errors.manufacturer ? 'border-red-400' : ''}`}
                                        value={data.manufacturer} onChange={(e) => setData('manufacturer', e.target.value)} />
                                    {errors.manufacturer && <p className="text-xs text-red-500 mt-1">{errors.manufacturer}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Model <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" className={`form-input ${errors.model ? 'border-red-400' : ''}`}
                                        value={data.model} onChange={(e) => setData('model', e.target.value)} />
                                    {errors.model && <p className="text-xs text-red-500 mt-1">{errors.model}</p>}
                                </div>
                            </div>
                        </div>

                        {/* ── Purchase & Warranty ── */}
                        <div className="card p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-calendar text-amber-600"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Purchase &amp; Warranty</h3>
                                    <p className="text-sm text-gray-500">Procurement and warranty information</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Purchase Date</label>
                                    <input type="date" className="form-input"
                                        value={data.purchase_date} onChange={(e) => setData('purchase_date', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Warranty Expiration</label>
                                    <input type="date" className="form-input"
                                        value={data.warranty_expiry} onChange={(e) => setData('warranty_expiry', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Supplier / Vendor</label>
                                    <input type="text" className="form-input"
                                        value={data.supplier} onChange={(e) => setData('supplier', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Number</label>
                                    <input type="text" className="form-input"
                                        value={data.invoice} onChange={(e) => setData('invoice', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Purchase Cost</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₱</span>
                                        <input type="number" step="0.01" className="form-input pl-7"
                                            value={data.purchase_cost} onChange={(e) => setData('purchase_cost', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Network & Specs ── */}
                        <div className="card p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-network-wired text-purple-600"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Network &amp; Specs</h3>
                                    <p className="text-sm text-gray-500">IP, MAC, OS and hardware specifications</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Hostname</label>
                                    <input type="text" className="form-input"
                                        value={data.hostname} onChange={(e) => setData('hostname', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">IP Address</label>
                                    <input type="text" className="form-input"
                                        value={data.ip_address} onChange={(e) => setData('ip_address', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">MAC Address</label>
                                    <input type="text" className="form-input"
                                        value={data.mac_address} onChange={(e) => setData('mac_address', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Operating System</label>
                                    <input type="text" className="form-input"
                                        value={data.operating_system} onChange={(e) => setData('operating_system', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">CPU / Processor</label>
                                    <input type="text" className="form-input"
                                        value={data.cpu} onChange={(e) => setData('cpu', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Memory (RAM)</label>
                                    <input type="text" className="form-input"
                                        value={data.ram} onChange={(e) => setData('ram', e.target.value)} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Storage</label>
                                    <input type="text" className="form-input"
                                        value={data.storage} onChange={(e) => setData('storage', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* ── Notes ── */}
                        <div className="card p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-align-left text-gray-600"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Description &amp; Notes</h3>
                                    <p className="text-sm text-gray-500">Additional information about the device</p>
                                </div>
                            </div>
                            <textarea rows={4} className="form-input"
                                value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                        </div>
                    </div>

                    {/* ── Right sidebar ── */}
                    <div className="space-y-6">

                        {/* Location */}
                        <div className="card p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-location-dot text-amber-600"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Location</h3>
                                    <p className="text-sm text-gray-500">Branch, building, room, rack</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Branch <span className="text-red-500">*</span>
                                    </label>
                                    <select className={`form-input ${errors.branch ? 'border-red-400' : ''}`}
                                        value={data.branch} onChange={(e) => setData('branch', e.target.value)}>
                                        <option value="">Select Branch</option>
                                        {branches.map((b) => <option key={b}>{b}</option>)}
                                    </select>
                                    {errors.branch && <p className="text-xs text-red-500 mt-1">{errors.branch}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Building</label>
                                    <select className="form-input" value={data.building} onChange={(e) => setData('building', e.target.value)}>
                                        <option value="">Select Building</option>
                                        {BUILDINGS.map((b) => <option key={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Room / Area</label>
                                    <input type="text" className="form-input"
                                        value={data.room} onChange={(e) => setData('room', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Rack / Position</label>
                                    <input type="text" className="form-input"
                                        value={data.rack} onChange={(e) => setData('rack', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Assignment */}
                        <div className="card p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-user text-indigo-600"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Assignment</h3>
                                    <p className="text-sm text-gray-500">User / Department ownership</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                                    <select className="form-input" value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Assigned User</label>
                                    <input type="text" className="form-input"
                                        value={data.assigned_user} onChange={(e) => setData('assigned_user', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                                    <select className="form-input" value={data.department} onChange={(e) => setData('department', e.target.value)}>
                                        <option value="">Select Department</option>
                                        {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Publishing meta */}
                        <div className="card p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Publishing</h3>
                            <div className="space-y-3 text-sm mb-5">
                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500">Created</span>
                                    <span className="font-mono text-gray-700 font-medium text-xs">{hardware.created_at}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500">Last Modified</span>
                                    <span className="font-mono text-gray-700 font-medium text-xs">{hardware.updated_at}</span>
                                </div>
                                {hardware.created_by && (
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-gray-500">Created By</span>
                                        <span className="font-semibold text-gray-800 text-xs">{hardware.created_by}</span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Link href={`/hardware/${hardware.tag}`} className="btn btn-secondary w-full text-sm justify-center">
                                    <i className="fas fa-eye mr-2"></i>Preview
                                </Link>
                                <button type="submit" disabled={processing} className="btn btn-primary w-full text-sm justify-center">
                                    <i className="fas fa-save mr-2"></i>Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
