<?php

use App\Http\Controllers\BranchController;
use App\Http\Controllers\BranchSecurityController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\DataReportController;
use App\Http\Controllers\PostureController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\IncidentController;
use App\Http\Controllers\HardwareController;
use App\Http\Controllers\SoftwareController;
use App\Http\Controllers\SystemRegistryController;
use App\Http\Controllers\RiskController;
use App\Http\Controllers\ThreatIntelController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // ── Incidents ──────────────────────────────────────────────────────────
    Route::prefix('incidents')->name('incidents.')->group(function () {
        Route::get('/',                                 [IncidentController::class, 'index'])->name('index');
        Route::get('/create',                           [IncidentController::class, 'create'])->name('create');
        Route::post('/',                                [IncidentController::class, 'store'])->name('store');
        Route::delete('/delete-all',                    [IncidentController::class, 'deleteAll'])->name('delete_all');
        Route::get('/{incidentNumber}',                 [IncidentController::class, 'show'])->name('show');
        Route::get('/{incidentNumber}/edit',            [IncidentController::class, 'edit'])->name('edit');
        Route::put('/{incidentNumber}',                 [IncidentController::class, 'update'])->name('update');
        Route::delete('/{incidentNumber}',              [IncidentController::class, 'destroy'])->name('destroy');
        Route::post('/{incidentNumber}/advance',        [IncidentController::class, 'advanceStatus'])->name('advance');
        Route::post('/{incidentNumber}/comment',        [IncidentController::class, 'addComment'])->name('comment');
        Route::post('/{incidentNumber}/upload',         [IncidentController::class, 'uploadFiles'])->name('upload');
        Route::get('/attachments/{id}/download',        [IncidentController::class, 'downloadAttachment'])->name('attachment.download');
    });

    // ── Hardware ───────────────────────────────────────────────────────────
    Route::prefix('hardware')->name('hardware.')->group(function () {
        Route::get('/',            [HardwareController::class, 'index'])->name('index');
        Route::get('/create',      [HardwareController::class, 'create'])->name('create');
        Route::post('/',           [HardwareController::class, 'store'])->name('store');
        Route::delete('/delete-all',[HardwareController::class, 'deleteAll'])->name('delete_all');
        Route::get('/{tag}',       [HardwareController::class, 'show'])->name('show');
        Route::get('/{tag}/edit',  [HardwareController::class, 'edit'])->name('edit');
        Route::put('/{tag}',       [HardwareController::class, 'update'])->name('update');
        Route::delete('/{tag}',    [HardwareController::class, 'destroy'])->name('destroy');
    });
    // ── Software ───────────────────────────────────────────────────────────
    Route::prefix('software')->name('software.')->group(function () {
        Route::get('/',           [SoftwareController::class, 'index'])->name('index');
        Route::get('/create',     [SoftwareController::class, 'create'])->name('create');
        Route::post('/',          [SoftwareController::class, 'store'])->name('store');
        Route::delete('/delete-all',[SoftwareController::class, 'deleteAll'])->name('delete_all');
        Route::get('/{swId}',     [SoftwareController::class, 'show'])->name('show');
        Route::get('/{swId}/edit',[SoftwareController::class, 'edit'])->name('edit');
        Route::put('/{swId}',     [SoftwareController::class, 'update'])->name('update');
        Route::delete('/{swId}',  [SoftwareController::class, 'destroy'])->name('destroy');
    });
    // ── Systems ────────────────────────────────────────────────────────────
    Route::prefix('systems')->name('systems.')->group(function () {
        Route::get('/',          [SystemRegistryController::class, 'index'])->name('index');
        Route::get('/create',    [SystemRegistryController::class, 'create'])->name('create');
        Route::post('/',         [SystemRegistryController::class, 'store'])->name('store');
        Route::delete('/delete-all',[SystemRegistryController::class, 'deleteAll'])->name('delete_all');
        Route::get('/{id}',      [SystemRegistryController::class, 'show'])->name('show');
        Route::get('/{id}/edit', [SystemRegistryController::class, 'edit'])->name('edit');
        Route::put('/{id}',      [SystemRegistryController::class, 'update'])->name('update');
        Route::delete('/{id}',   [SystemRegistryController::class, 'destroy'])->name('destroy');
    });
    // ── Risks ──────────────────────────────────────────────────────────────
    Route::prefix('risks')->name('risks.')->group(function () {
        Route::get('/',              [RiskController::class, 'index'])->name('index');
        Route::post('/',             [RiskController::class, 'store'])->name('store');
        Route::delete('/delete-all', [RiskController::class, 'deleteAll'])->name('delete_all');
        Route::put('/{id}',          [RiskController::class, 'update'])->name('update');
        Route::delete('/{id}',       [RiskController::class, 'destroy'])->name('destroy');
        Route::post('/{id}/mitigate',[RiskController::class, 'mitigate'])->name('mitigate');
    });
    // ── Threat Intel ───────────────────────────────────────────────────────
    Route::prefix('threat-intel')->name('threat_intel.')->group(function () {
        Route::get('/',          [ThreatIntelController::class, 'index'])->name('index');
        Route::get('/create',    [ThreatIntelController::class, 'create'])->name('create');
        Route::post('/',         [ThreatIntelController::class, 'store'])->name('store');
        Route::delete('/delete-all',[ThreatIntelController::class, 'deleteAll'])->name('delete_all');
        Route::get('/{id}',      [ThreatIntelController::class, 'show'])->name('show');
        Route::get('/{id}/edit', [ThreatIntelController::class, 'edit'])->name('edit');
        Route::put('/{id}',      [ThreatIntelController::class, 'update'])->name('update');
        Route::delete('/{id}',   [ThreatIntelController::class, 'destroy'])->name('destroy');
    });
    // ── Branches ───────────────────────────────────────────────────────────
    Route::middleware('role:super_admin,admin')->prefix('branches')->name('branches.')->group(function () {
        Route::get('/',          [BranchController::class, 'index'])->name('index');
        Route::post('/',         [BranchController::class, 'store'])->name('store');
        Route::delete('/delete-all',[BranchController::class, 'deleteAll'])->name('delete_all');
        Route::get('/{id}',      [BranchController::class, 'show'])->name('show');
        Route::get('/{id}/edit', [BranchController::class, 'edit'])->name('edit');
        Route::put('/{id}',      [BranchController::class, 'update'])->name('update');
        Route::delete('/{id}',   [BranchController::class, 'destroy'])->name('destroy');
    });
    // ── Branch Security ────────────────────────────────────────────────────
    Route::prefix('branch-security')->name('branch_security.')->group(function () {
        Route::get('/',                    [BranchSecurityController::class, 'index'])->name('index');
        Route::middleware('role:super_admin,admin')->group(function () {
            Route::get('/{branch}/edit',   [BranchSecurityController::class, 'edit'])->name('edit');
            Route::put('/{branch}',        [BranchSecurityController::class, 'update'])->name('update');
        });
    });
    // ── Users ─────────────────────────────────────────────────────────────
    Route::middleware('role:super_admin')->prefix('users')->name('users.')->group(function () {
        Route::get('/',                     [UserController::class, 'index'])->name('index');
        Route::post('/',                    [UserController::class, 'store'])->name('store');
        Route::delete('/delete-all',        [UserController::class, 'deleteAll'])->name('delete_all');
        Route::put('/{id}',                 [UserController::class, 'update'])->name('update');
        Route::post('/{id}/assign-role',    [UserController::class, 'assignRole'])->name('assign_role');
        Route::delete('/{id}',              [UserController::class, 'destroy'])->name('destroy');
    });

    // ── Notifications (superadmin + admin) ────────────────────────────────────
    Route::middleware('role:super_admin,admin')->prefix('notifications')->name('notifications.')->group(function () {
        Route::get('/',                            [NotificationController::class, 'index'])->name('index');
        Route::post('/bots',                       [NotificationController::class, 'saveBot'])->name('save_bot');
        Route::delete('/bots/{id}',                [NotificationController::class, 'deleteBot'])->name('delete_bot');
        Route::post('/bots/{id}/test',             [NotificationController::class, 'testBot'])->name('test_bot');
        Route::post('/rules',                      [NotificationController::class, 'saveRule'])->name('save_rule');
        Route::delete('/rules/{id}',               [NotificationController::class, 'deleteRule'])->name('delete_rule');
        Route::post('/audit-config',               [NotificationController::class, 'saveAuditConfig'])->name('save_audit_config');
        Route::delete('/audit-config/{id}',        [NotificationController::class, 'deleteAuditConfig'])->name('delete_audit_config');
        Route::delete('/log/clear',                [NotificationController::class, 'clearLog'])->name('clear_log');
    });
    // Reports (superadmin + admin + cyber security)
    Route::middleware('role:super_admin,admin,cyber_security')->prefix('reports')->name('reports.')->group(function () {
        Route::get('/',                       [ReportController::class, 'index'])->name('index');
        Route::get('/data',                   [ReportController::class, 'data'])->name('data');
        Route::get('/export/csv',             [ReportController::class, 'exportCsv'])->name('export_csv');
        Route::get('/export/pdf',             [ReportController::class, 'exportPdf'])->name('export_pdf');
    });
    Route::middleware('role:super_admin,admin,cyber_security')->get('/reporting', [ReportController::class, 'index'])->name('reporting.index');

    // ── Analytics ─────────────────────────────────────────────────────────────
    Route::middleware('role:super_admin,admin,cyber_security')->prefix('analytics')->name('analytics.')->group(function () {
        Route::get('/',      [AnalyticsController::class, 'index'])->name('index');
        Route::get('/data',  [AnalyticsController::class, 'data'])->name('data');
    });

    // ── Security Posture ──────────────────────────────────────────────────────
    Route::middleware('role:super_admin,admin,cyber_security,it')->get('/posture', [PostureController::class, 'index'])->name('posture.index');

    // ── Data Reports (raw paginated viewer) ───────────────────────────────────
    Route::middleware('role:super_admin,admin,cyber_security,it')->get('/data-reports', [DataReportController::class, 'index'])->name('data_reports.index');

    // ── Asset Overview ────────────────────────────────────────────────────────
    Route::middleware('role:super_admin,admin,cyber_security,it')->get('/assets', [AssetController::class, 'index'])->name('assets.index');
});

require __DIR__.'/settings.php';

