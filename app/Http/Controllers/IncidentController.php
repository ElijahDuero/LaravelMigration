<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Incident;
use App\Models\IncidentAttachment;
use App\Models\IncidentWorkflowHistory;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class IncidentController extends Controller
{
    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function nextIncidentNumber(): string
    {
        $year  = now()->year;
        $last  = Incident::whereYear('created_at', $year)
            ->orderByDesc('id')
            ->value('incident_number');

        $seq = 1;
        if ($last && preg_match('/INC-\d{4}-(\d+)/', $last, $m)) {
            $seq = (int) $m[1] + 1;
        }

        return sprintf('INC-%04d-%04d', $year, $seq);
    }

    private function workflowOrder(): array
    {
        return ['reported', 'assigned', 'investigation', 'containment', 'eradication', 'recovery', 'lessons', 'closed'];
    }

    private function workflowLabel(string $status): string
    {
        return [
            'draft'         => 'Draft',
            'reported'      => 'Reported',
            'assigned'      => 'Assigned',
            'investigation' => 'Under Investigation',
            'containment'   => 'Containment',
            'eradication'   => 'Eradication',
            'recovery'      => 'Recovery',
            'lessons'       => 'Lessons Learned',
            'closed'        => 'Closed',
        ][$status] ?? ucfirst($status);
    }

    private function stats(): array
    {
        $inProgress = "'assigned','investigation','containment','eradication','recovery','lessons'";

        return Incident::selectRaw("
            COUNT(*)                                                                           AS total,
            SUM(CASE WHEN workflow_status = 'reported'  THEN 1 ELSE 0 END)                    AS reported,
            SUM(CASE WHEN workflow_status IN ({$inProgress}) THEN 1 ELSE 0 END)               AS in_progress,
            SUM(CASE WHEN severity = 'Critical' AND workflow_status != 'closed' THEN 1 ELSE 0 END) AS critical,
            SUM(CASE WHEN workflow_status = 'closed'   THEN 1 ELSE 0 END)                    AS closed
        ")->first()->toArray();
    }

    // ─── Index ────────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $q = Incident::query();

        if ($search = $request->get('search')) {
            $like = "%{$search}%";
            $q->where(fn ($w) =>
                $w->where('incident_number', 'like', $like)
                  ->orWhere('description', 'like', $like)
                  ->orWhere('reporter_name', 'like', $like)
                  ->orWhere('category', 'like', $like)
            );
        }

        if ($severity = $request->get('severity')) {
            $q->where('severity', $severity);
        }

        if ($status = $request->get('status')) {
            if ($status === 'open') {
                $q->whereNotIn('workflow_status', ['closed', 'draft']);
            } else {
                $q->where('workflow_status', $status);
            }
        }

        if ($branch = $request->get('branch')) {
            $q->where('branch', $branch);
        }

        if ($category = $request->get('category')) {
            $q->where('category', $category);
        }

        if ($dateFrom = $request->get('datefrom')) {
            $q->whereRaw("COALESCE(reported_at, created_at) >= ?", [$dateFrom . ' 00:00:00']);
        }

        if ($dateTo = $request->get('dateto')) {
            $q->whereRaw("COALESCE(reported_at, created_at) <= ?", [$dateTo . ' 23:59:59']);
        }

        $incidents = $q->orderByDesc('id')->get();
        $branches  = Branch::orderBy('name')->pluck('name');

        return Inertia::render('incidents/index', [
            'incidents' => $incidents,
            'stats'     => $this->stats(),
            'branches'  => $branches,
            'filters'   => $request->only(['search', 'severity', 'status', 'branch', 'category', 'datefrom', 'dateto']),
        ]);
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    public function create()
    {
        return Inertia::render('incidents/create', [
            'incidentNumberPreview' => $this->nextIncidentNumber(),
            'branches'              => Branch::orderBy('name')->pluck('name'),
        ]);
    }

    // ─── Store ────────────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $validated = $request->validate([
            'submit_mode'      => 'required|in:draft,reported',
            'incident_at'      => 'required|date',
            'branch'           => 'required|string|max:255',
            'campus'           => 'nullable|string|max:255',
            'department'       => 'required|string|max:255',
            'reporter_name'    => 'required|string|max:255',
            'contact_number'   => 'required|string|max:50',
            'category'         => 'required|string|max:255',
            'severity'         => 'required|in:Low,Medium,High,Critical',
            'systems_affected' => 'nullable|string|max:500',
            'users_affected'   => 'nullable|integer|min:0',
            'description'      => 'required|string',
            'ip_address'       => 'nullable|string|max:45',
            'hostname'         => 'nullable|string|max:255',
            'device'           => 'nullable|string|max:100',
            'operating_system' => 'nullable|string|max:100',
            'browser'          => 'nullable|string|max:100',
            'screenshots'      => 'nullable|array',
            'screenshots.*'    => 'file|mimes:jpg,jpeg,png,gif|max:10240',
            'evidence'         => 'nullable|array',
            'evidence.*'       => 'file|mimes:pdf,doc,docx,zip|max:51200',
            'logs'             => 'nullable|array',
            'logs.*'           => 'file|mimes:log,txt,csv|max:25600',
        ]);

        $status = $validated['submit_mode'] === 'reported' ? 'reported' : 'draft';
        $incNum = $this->nextIncidentNumber();
        $user   = Auth::user();

        $incident = Incident::create([
            'incident_number'  => $incNum,
            'workflow_status'  => $status,
            'incident_at'      => $validated['incident_at'],
            'reported_at'      => $status === 'reported' ? now() : null,
            'branch'           => $validated['branch'],
            'campus'           => $validated['campus'] ?? null,
            'department'       => $validated['department'],
            'reporter_name'    => $validated['reporter_name'],
            'contact_number'   => $validated['contact_number'],
            'category'         => $validated['category'],
            'severity'         => $validated['severity'],
            'systems_affected' => $validated['systems_affected'] ?? null,
            'users_affected'   => $validated['users_affected'] ?? 0,
            'description'      => $validated['description'],
            'ip_address'       => $validated['ip_address'] ?? null,
            'hostname'         => $validated['hostname'] ?? null,
            'device'           => $validated['device'] ?? null,
            'operating_system' => $validated['operating_system'] ?? null,
            'browser'          => $validated['browser'] ?? null,
            'created_by'       => $user->name,
        ]);

        // Handle file attachments
        $this->saveAttachments($incident, $request, 'screenshots', 'screenshot');
        $this->saveAttachments($incident, $request, 'evidence', 'evidence');
        $this->saveAttachments($incident, $request, 'logs', 'log');

        // Add initial workflow history entry
        if ($status === 'reported') {
            IncidentWorkflowHistory::create([
                'incident_id' => $incident->id,
                'status'      => 'reported',
                'actor'       => $user->name,
                'action'      => 'submitted initial incident report',
                'notes'       => null,
            ]);
        }

        AuditService::log('incidents', 'incident_created', $incNum, "Created incident {$incNum}");

        return redirect()->route('incidents.index', ['submitted' => $incNum])
            ->with('success', "Incident {$incNum} submitted successfully.");
    }

    // ─── Show ─────────────────────────────────────────────────────────────────

    public function show(string $incidentNumber)
    {
        $incident = Incident::where('incident_number', $incidentNumber)->firstOrFail();
        $history  = IncidentWorkflowHistory::where('incident_id', $incident->id)
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        $historyByStatus = $history->keyBy('status');
        $order           = $this->workflowOrder();
        $currentIndex    = array_search($incident->workflow_status, $order, true);

        $workflow = [];
        foreach ($order as $idx => $key) {
            $entry  = $historyByStatus->get($key);
            $stepSt = 'pending';

            if ($currentIndex !== false) {
                if ($idx < $currentIndex || $incident->workflow_status === 'closed') {
                    $stepSt = 'completed';
                } elseif ($idx === $currentIndex) {
                    $stepSt = 'current';
                }
            }

            $workflow[] = [
                'key'    => $key,
                'name'   => $this->workflowLabel($key),
                'status' => $stepSt,
                'by'     => $entry?->actor,
                'time'   => $entry?->created_at?->format('M j, Y g:ia'),
                'notes'  => $entry?->notes,
            ];
        }

        $step    = $currentIndex !== false ? $currentIndex + 1 : 0;
        $pct     = $step > 0 ? (int) round(($step / count($order)) * 100) : 0;
        $label   = $this->workflowLabel($incident->workflow_status);
        $color   = $incident->workflow_status === 'closed' ? 'text-green-600' : 'text-blue-600';

        $attachments = IncidentAttachment::where('incident_id', $incident->id)
            ->orderBy('uploaded_at')
            ->get()
            ->map(fn ($a) => [
                'id'   => $a->id,
                'name' => $a->original_filename,
                'type' => strtolower(pathinfo($a->original_filename, PATHINFO_EXTENSION)) ?: 'file',
                'size' => $this->formatBytes($a->file_size),
                'by'   => $a->uploaded_by,
                'time' => $a->uploaded_at ? $a->uploaded_at->format('M j, g:ia') : null,
            ]);

        $activity = $history->reverse()->map(fn ($e) => [
            'user'   => $e->actor,
            'action' => $e->action,
            'time'   => $e->created_at?->diffForHumans(),
            'status' => $e->status,
        ]);

        return Inertia::render('incidents/view', [
            'incident'            => $incident,
            'workflow'            => $workflow,
            'workflowCurrentStep' => $step,
            'workflowCurrentPct'  => $pct,
            'workflowCurrentLabel'=> $label,
            'workflowCurrentColor'=> $color,
            'attachments'         => $attachments,
            'activity'            => $activity,
        ]);
    }

    // ─── Edit ─────────────────────────────────────────────────────────────────

    public function edit(string $incidentNumber)
    {
        $incident    = Incident::where('incident_number', $incidentNumber)->firstOrFail();
        $attachments = IncidentAttachment::where('incident_id', $incident->id)
            ->orderBy('uploaded_at')
            ->get()
            ->map(fn ($a) => [
                'id'   => $a->id,
                'name' => $a->original_filename,
                'type' => strtolower(pathinfo($a->original_filename, PATHINFO_EXTENSION)) ?: 'file',
                'size' => $this->formatBytes($a->file_size),
                'by'   => $a->uploaded_by,
            ]);

        return Inertia::render('incidents/edit', [
            'incident'    => $incident,
            'attachments' => $attachments,
            'branches'    => Branch::orderBy('name')->pluck('name'),
        ]);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public function update(Request $request, string $incidentNumber)
    {
        $incident = Incident::where('incident_number', $incidentNumber)->firstOrFail();

        $validated = $request->validate([
            'incident_at'      => 'required|date',
            'branch'           => 'required|string|max:255',
            'campus'           => 'nullable|string|max:255',
            'department'       => 'required|string|max:255',
            'reporter_name'    => 'required|string|max:255',
            'contact_number'   => 'required|string|max:50',
            'category'         => 'required|string|max:255',
            'severity'         => 'required|in:Low,Medium,High,Critical',
            'systems_affected' => 'nullable|string|max:500',
            'users_affected'   => 'nullable|integer|min:0',
            'description'      => 'required|string',
            'ip_address'       => 'nullable|string|max:45',
            'hostname'         => 'nullable|string|max:255',
            'device'           => 'nullable|string|max:100',
            'operating_system' => 'nullable|string|max:100',
            'browser'          => 'nullable|string|max:100',
            'screenshots'      => 'nullable|array',
            'screenshots.*'    => 'file|mimes:jpg,jpeg,png,gif|max:10240',
            'evidence'         => 'nullable|array',
            'evidence.*'       => 'file|mimes:pdf,doc,docx,zip|max:51200',
            'logs'             => 'nullable|array',
            'logs.*'           => 'file|mimes:log,txt,csv|max:25600',
        ]);

        $incident->update([
            'incident_at'      => $validated['incident_at'],
            'branch'           => $validated['branch'],
            'campus'           => $validated['campus'] ?? null,
            'department'       => $validated['department'],
            'reporter_name'    => $validated['reporter_name'],
            'contact_number'   => $validated['contact_number'],
            'category'         => $validated['category'],
            'severity'         => $validated['severity'],
            'systems_affected' => $validated['systems_affected'] ?? null,
            'users_affected'   => $validated['users_affected'] ?? 0,
            'description'      => $validated['description'],
            'ip_address'       => $validated['ip_address'] ?? null,
            'hostname'         => $validated['hostname'] ?? null,
            'device'           => $validated['device'] ?? null,
            'operating_system' => $validated['operating_system'] ?? null,
            'browser'          => $validated['browser'] ?? null,
            'updated_at'       => now(),
        ]);

        $this->saveAttachments($incident, $request, 'screenshots', 'screenshot');
        $this->saveAttachments($incident, $request, 'evidence', 'evidence');
        $this->saveAttachments($incident, $request, 'logs', 'log');

        AuditService::log('incidents', 'incident_updated', $incidentNumber, "Updated incident {$incidentNumber}");

        return redirect()->route('incidents.show', $incidentNumber)
            ->with('success', "Incident {$incidentNumber} updated successfully.");
    }

    // ─── Destroy ──────────────────────────────────────────────────────────────

    public function destroy(string $incidentNumber)
    {
        $incident = Incident::where('incident_number', $incidentNumber)->firstOrFail();

        // Delete stored files
        IncidentAttachment::where('incident_id', $incident->id)->each(function ($att) {
            Storage::disk('local')->delete($att->stored_filename);
        });

        AuditService::log('incidents', 'incident_deleted', $incidentNumber, "Deleted incident {$incidentNumber}");

        $incident->delete();

        return redirect()->route('incidents.index')
            ->with('success', "Incident {$incidentNumber} deleted.");
    }

    public function deleteAll(Request $request)
    {
        $attachments = IncidentAttachment::all();
        foreach ($attachments as $att) {
            if ($att->stored_filename && Storage::disk('local')->exists($att->stored_filename)) {
                Storage::disk('local')->delete($att->stored_filename);
            }
        }
        IncidentAttachment::query()->delete();
        IncidentWorkflowHistory::query()->delete();
        $count = Incident::query()->delete();

        AuditService::log('incidents', 'delete_all', 'all', "Deleted all {$count} incidents");

        return redirect()->route('incidents.index')
            ->with('success', "All {$count} incidents have been deleted.");
    }

    // ─── Advance workflow ─────────────────────────────────────────────────────

    public function advanceStatus(Request $request, string $incidentNumber)
    {
        $incident = Incident::where('incident_number', $incidentNumber)->firstOrFail();
        $order    = $this->workflowOrder();
        $current  = array_search($incident->workflow_status, $order, true);

        if ($current === false || $current >= count($order) - 1) {
            return back()->with('error', 'Incident is already at the final status.');
        }

        $nextStatus = $order[$current + 1];
        $notes      = $request->input('notes');
        $user       = Auth::user();

        $incident->update([
            'workflow_status' => $nextStatus,
            'updated_at'      => now(),
        ]);

        IncidentWorkflowHistory::create([
            'incident_id' => $incident->id,
            'status'      => $nextStatus,
            'actor'       => $user->name,
            'action'      => "advanced status to {$this->workflowLabel($nextStatus)}",
            'notes'       => $notes ?: null,
        ]);

        AuditService::log('incidents', 'incident_advanced', $incidentNumber, "Advanced {$incidentNumber} to {$nextStatus}");

        return back()->with('success', "Status advanced to {$this->workflowLabel($nextStatus)}.");
    }

    // ─── Add comment ──────────────────────────────────────────────────────────

    public function addComment(Request $request, string $incidentNumber)
    {
        $incident = Incident::where('incident_number', $incidentNumber)->firstOrFail();
        $request->validate(['notes' => 'required|string|max:2000']);

        IncidentWorkflowHistory::create([
            'incident_id' => $incident->id,
            'status'      => $incident->workflow_status,
            'actor'       => Auth::user()->name,
            'action'      => 'added a comment',
            'notes'       => $request->input('notes'),
        ]);

        return back()->with('success', 'Comment added.');
    }

    // ─── Upload additional files ───────────────────────────────────────────

    public function uploadFiles(Request $request, string $incidentNumber)
    {
        $incident = Incident::where('incident_number', $incidentNumber)->firstOrFail();
        $request->validate([
            'additional_files'   => 'required|array',
            'additional_files.*' => 'file|max:51200',
        ]);

        $this->saveAttachments($incident, $request, 'additional_files', 'evidence');

        return back()->with('success', 'Files uploaded.');
    }

    // ─── Download attachment ──────────────────────────────────────────────────

    public function downloadAttachment(int $attachmentId)
    {
        $attachment = IncidentAttachment::findOrFail($attachmentId);

        return Storage::disk('local')->download(
            $attachment->stored_filename,
            $attachment->original_filename
        );
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private function saveAttachments(Incident $incident, Request $request, string $field, string $type): void
    {
        if (! $request->hasFile($field)) {
            return;
        }

        foreach ($request->file($field) as $file) {
            $stored = $file->store("incidents/{$incident->incident_number}", 'local');

            IncidentAttachment::create([
                'incident_id'       => $incident->id,
                'original_filename' => $file->getClientOriginalName(),
                'stored_filename'   => $stored,
                'file_size'         => $file->getSize(),
                'mime_type'         => $file->getMimeType() ?? 'application/octet-stream',
                'attachment_type'   => $type,
                'uploaded_by'       => Auth::user()->name,
                'uploaded_at'       => now(),
            ]);
        }
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes >= 1_073_741_824) return number_format($bytes / 1_073_741_824, 1) . ' GB';
        if ($bytes >= 1_048_576)     return number_format($bytes / 1_048_576, 1) . ' MB';
        if ($bytes >= 1_024)         return number_format($bytes / 1_024, 0) . ' KB';
        return $bytes . ' B';
    }
}
