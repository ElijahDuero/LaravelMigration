import AppLayout from '@/components/AppLayout';
import { Link, useForm } from '@inertiajs/react';

interface Branch {
    id: number;
    code: string;
    name: string;
    location: string;
    type: string;
    status: string;
    head: string | null;
    contact: string | null;
    email: string | null;
    employees: number;
    campuses: number;
    established: string | null;
    notes: string | null;
}
interface Props { branch: Branch; }

const TYPES    = ['HQ', 'Satellite', 'Remote', 'Data Center'];
const STATUSES = ['Active', 'Planned', 'Inactive'];

export default function BranchEdit({ branch }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name:        branch.name,
        location:    branch.location,
        type:        branch.type,
        status:      branch.status,
        head:        branch.head        ?? '',
        contact:     branch.contact     ?? '',
        email:       branch.email       ?? '',
        employees:   branch.employees,
        campuses:    branch.campuses,
        established: branch.established ? branch.established.slice(0, 10) : '',
        notes:       branch.notes       ?? '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/branches/${branch.id}`);
    }

    return (
        <AppLayout title="Edit Branch" subtitle={branch.code}>
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={`/branches/${branch.id}`} className="btn btn-secondary text-sm py-2">
                        <i className="fas fa-arrow-left mr-1.5"></i>Back
                    </Link>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Edit Branch</h2>
                        <p className="text-sm text-gray-500 font-mono">{branch.code}</p>
                    </div>
                </div>

                {/* Errors */}
                {Object.keys(errors).length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <i className="fas fa-circle-xmark text-red-500 mt-0.5"></i>
                            <ul className="text-sm text-red-700 space-y-1">
                                {Object.values(errors).map((msg, i) => <li key={i}>{msg}</li>)}
                            </ul>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="card p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-5 flex items-center">
                            <i className="fas fa-building mr-2 text-blue-500"></i>Branch Details
                        </h3>
                        <div className="space-y-4">

                            {/* Code (read-only) + Status */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Code</label>
                                    <div className="form-input font-mono uppercase bg-gray-50 text-gray-600 flex items-center gap-2 cursor-default">
                                        <i className="fas fa-barcode text-gray-400 text-xs"></i>
                                        {branch.code}
                                        <span className="ml-auto text-[10px] font-semibold bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">Fixed</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Status</label>
                                    <select className="form-input" value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                                    Branch Name <span className="text-red-500">*</span>
                                </label>
                                <input type="text" required className={`form-input ${errors.name ? 'border-red-400' : ''}`}
                                    value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                            </div>

                            {/* Location + Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                                        Location <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" required className={`form-input ${errors.location ? 'border-red-400' : ''}`}
                                        value={data.location} onChange={(e) => setData('location', e.target.value)} />
                                    {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Type</label>
                                    <select className="form-input" value={data.type} onChange={(e) => setData('type', e.target.value)}>
                                        {TYPES.map((t) => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Head + Contact */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Branch Head</label>
                                    <input type="text" className="form-input" placeholder="Full name"
                                        value={data.head} onChange={(e) => setData('head', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Contact Phone</label>
                                    <input type="text" className="form-input font-mono" placeholder="+63 ..."
                                        value={data.contact} onChange={(e) => setData('contact', e.target.value)} />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Email</label>
                                <input type="email" className="form-input" placeholder="branch@company.com"
                                    value={data.email} onChange={(e) => setData('email', e.target.value)} />
                            </div>

                            {/* Employees + Campuses + Established */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Employees</label>
                                    <input type="number" min={0} className="form-input"
                                        value={data.employees} onChange={(e) => setData('employees', parseInt(e.target.value) || 0)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Campuses</label>
                                    <input type="number" min={0} className="form-input"
                                        value={data.campuses} onChange={(e) => setData('campuses', parseInt(e.target.value) || 0)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Established</label>
                                    <input type="date" className="form-input"
                                        value={data.established} onChange={(e) => setData('established', e.target.value)} />
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Notes</label>
                                <textarea className="form-input" rows={3} placeholder="Any additional info..."
                                    value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <Link href={`/branches/${branch.id}`} className="btn btn-secondary">Cancel</Link>
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing
                                ? <><i className="fas fa-spinner fa-spin mr-1.5"></i>Saving...</>
                                : <><i className="fas fa-save mr-1.5"></i>Save Changes</>
                            }
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
