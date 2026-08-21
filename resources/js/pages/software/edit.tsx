import AppLayout from '@/components/AppLayout';
import { Link, useForm, router } from '@inertiajs/react';

interface Software {
    id: number;
    sw_id: string;
    name: string;
    category: string;
    vendor: string;
    version: string | null;
    license_type: string;
    license_model: string | null;
    license_key: string | null;
    total_licenses: number;
    used_licenses: number;
    branch: string | null;
    department: string | null;
    purchase_date: string | null;
    expiry_date: string | null;
    cost_annual: string | null;
    supplier: string | null;
    po_number: string | null;
    invoice: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    software: Software;
    branches: string[];
}

const CATEGORIES    = ['Antivirus','Office','HRIS','Accounting','Enrollment','LMS','Payroll','Custom Systems'];
const LICENSE_TYPES = ['Licensed','Trial','Free / OSS','Expired','Unlicensed'];
const LIC_MODELS    = ['Per-User Subscription','Per-Device License','Site License','Volume License','Open Source','Trial','Perpetual'];
const DEPARTMENTS   = ['IT Operations','Administration','Finance','Human Resources','Sales & Marketing','Academics','Student Affairs','Research','Library','Facilities'];

export default function SoftwareEdit({ software, branches }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name:           software.name ?? '',
        category:       software.category ?? '',
        vendor:         software.vendor ?? '',
        version:        software.version ?? '',
        branch:         software.branch ?? '',
        department:     software.department ?? '',
        license_type:   software.license_type ?? 'Licensed',
        license_model:  software.license_model ?? '',
        license_key:    software.license_key ?? '',
        total_licenses: String(software.total_licenses ?? 1),
        used_licenses:  String(software.used_licenses  ?? 0),
        purchase_date:  software.purchase_date ?? '',
        expiry_date:    software.expiry_date   ?? '',
        cost_annual:    software.cost_annual   ?? '',
        supplier:       software.supplier      ?? '',
        po_number:      software.po_number     ?? '',
        invoice:        software.invoice       ?? '',
        notes:          software.notes         ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(`/software/${software.sw_id}`);
    }

    function handleDelete() {
        if (!confirm(`Permanently delete ${software.sw_id} — ${software.name}? This cannot be undone.`)) return;
        router.delete(`/software/${software.sw_id}`);
    }

    return (
        <AppLayout title="Edit Software License" subtitle="Update software and license information">
            <form onSubmit={submit} className="space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <Link href={`/software/${software.sw_id}`} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                            <i className="fas fa-arrow-left text-gray-600"></i>
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Edit Software License</h2>
                            <p className="text-sm text-gray-500 font-mono">{software.sw_id} · Last updated: {software.updated_at}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={handleDelete} className="btn btn-secondary text-red-600 hover:bg-red-50">
                            <i className="fas fa-trash mr-2"></i>Delete
                        </button>
                        <Link href={`/software/${software.sw_id}`} className="btn btn-secondary">
                            <i className="fas fa-times mr-2"></i>Cancel
                        </Link>
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            <i className="fas fa-floppy-disk mr-2"></i>Save Changes
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">

                        {/* Software info */}
                        <div className="card p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-box text-blue-600"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Software Information</h3>
                                    <p className="text-sm text-gray-500">Name, vendor, version, and category</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Software ID</label>
                                    <input type="text" className="form-input bg-gray-50 font-mono" value={software.sw_id} readOnly />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Software Name <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" className={`form-input ${errors.name ? 'border-red-400' : ''}`}
                                        value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select className={`form-input ${errors.category ? 'border-red-400' : ''}`}
                                        value={data.category} onChange={(e) => setData('category', e.target.value)}>
                                        <option value="">Select Category</option>
                                        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                                    </select>
                                    {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Vendor / Publisher <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" className={`form-input ${errors.vendor ? 'border-red-400' : ''}`}
                                        value={data.vendor} onChange={(e) => setData('vendor', e.target.value)} />
                                    {errors.vendor && <p className="text-xs text-red-500 mt-1">{errors.vendor}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Version</label>
                                    <input type="text" className="form-input"
                                        value={data.version} onChange={(e) => setData('version', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Branch</label>
                                    <select className="form-input" value={data.branch} onChange={(e) => setData('branch', e.target.value)}>
                                        <option value="">Unassigned</option>
                                        {branches.map((b) => <option key={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                                    <select className="form-input" value={data.department} onChange={(e) => setData('department', e.target.value)}>
                                        <option value="">Unassigned</option>
                                        {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Description / Notes</label>
                                    <textarea rows={4} className="form-input"
                                        value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* License details */}
                        <div className="card p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-key text-green-600"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">License Details</h3>
                                    <p className="text-sm text-gray-500">Keys, seat counts, models, and entitlements</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">License Status</label>
                                    <select className="form-input" value={data.license_type} onChange={(e) => setData('license_type', e.target.value)}>
                                        {LICENSE_TYPES.map((l) => <option key={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">License Model</label>
                                    <select className="form-input" value={data.license_model} onChange={(e) => setData('license_model', e.target.value)}>
                                        <option value="">Select Model</option>
                                        {LIC_MODELS.map((m) => <option key={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">License Key / Activation Code</label>
                                    <input type="text" className="form-input font-mono text-sm"
                                        value={data.license_key} onChange={(e) => setData('license_key', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Total License Count</label>
                                    <input type="number" className="form-input" min="0"
                                        value={data.total_licenses} onChange={(e) => setData('total_licenses', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Currently Used / Assigned</label>
                                    <input type="number" className="form-input" min="0"
                                        value={data.used_licenses} onChange={(e) => setData('used_licenses', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Purchase & Renewal */}
                        <div className="card p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-calendar text-amber-600"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Purchase &amp; Renewal</h3>
                                    <p className="text-sm text-gray-500">Cost, dates, supplier, and PO details</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Purchase Date</label>
                                    <input type="date" className="form-input"
                                        value={data.purchase_date} onChange={(e) => setData('purchase_date', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiration Date</label>
                                    <input type="date" className="form-input"
                                        value={data.expiry_date} onChange={(e) => setData('expiry_date', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Annual Cost</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₱</span>
                                        <input type="number" step="0.01" className="form-input pl-7"
                                            value={data.cost_annual} onChange={(e) => setData('cost_annual', e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Supplier</label>
                                    <input type="text" className="form-input"
                                        value={data.supplier} onChange={(e) => setData('supplier', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">PO Number</label>
                                    <input type="text" className="form-input"
                                        value={data.po_number} onChange={(e) => setData('po_number', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Number</label>
                                    <input type="text" className="form-input"
                                        value={data.invoice} onChange={(e) => setData('invoice', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="card p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-users-gear text-indigo-600"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Publishing</h3>
                                    <p className="text-sm text-gray-500">Audit trail and quick actions</p>
                                </div>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500 text-xs">Created</span>
                                    <span className="font-mono text-gray-700 font-medium text-[10px]">{software.created_at}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500 text-xs">Last Modified</span>
                                    <span className="font-mono text-gray-700 font-medium text-[10px]">{software.updated_at}</span>
                                </div>
                            </div>
                            <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
                                <Link href={`/software/${software.sw_id}`} className="btn btn-secondary w-full text-sm py-2 justify-center">
                                    <i className="fas fa-eye mr-2"></i>Preview
                                </Link>
                                <button type="submit" disabled={processing} className="btn btn-primary w-full text-sm py-2 justify-center">
                                    <i className="fas fa-save mr-2"></i>Save Changes
                                </button>
                            </div>
                        </div>

                        <div className="card p-6 border-l-4 border-amber-500 bg-gradient-to-br from-amber-50/50 to-white">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                <i className="fas fa-lightbulb text-amber-500 mr-2"></i>Compliance Tips
                            </h3>
                            <ul className="space-y-1.5 text-xs text-gray-600">
                                <li className="flex items-start"><i className="fas fa-check text-green-500 mt-0.5 mr-2 text-[10px]"></i>Verify license count matches actual installations</li>
                                <li className="flex items-start"><i className="fas fa-check text-green-500 mt-0.5 mr-2 text-[10px]"></i>Update version after rolling out patches</li>
                                <li className="flex items-start"><i className="fas fa-check text-green-500 mt-0.5 mr-2 text-[10px]"></i>Renewal reminders: 60 days before expiry</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
