<?php

use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use App\Http\Controllers\Settings\SettingsController;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    // ── Main tabbed settings page (admin only) ────────────────────────────
    Route::middleware('role:super_admin,admin')->group(function () {
        Route::get('settings',                   [SettingsController::class, 'index'])->name('settings.index');
        Route::get('settings/audit',             [SettingsController::class, 'auditLog'])->name('settings.audit');
        Route::get('settings/audit/export',      [SettingsController::class, 'exportAudit'])->name('settings.audit.export');
        Route::get('settings/samples/counts',    [SettingsController::class, 'sampleCounts'])->name('settings.samples.counts');
        Route::post('settings/samples/seed',     [SettingsController::class, 'seedSamples'])->name('settings.samples.seed');
        Route::post('settings/samples/delete',   [SettingsController::class, 'deleteSamples'])->name('settings.samples.delete');
    });

    // ── Per-user profile & appearance (all authenticated users) ──────────
    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/security', [SecurityController::class, 'edit'])
        ->middleware(RequirePassword::class)
        ->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');
});

Route::get('.well-known/passkey-endpoints', function () {
    return response()->json([
        'enroll' => route('security.edit'),
        'manage' => route('security.edit'),
    ]);
})->name('well-known.passkeys');
