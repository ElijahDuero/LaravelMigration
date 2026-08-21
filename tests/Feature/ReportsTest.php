<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_users_are_redirected_from_reports(): void
    {
        $this->get(route('reports.index'))->assertRedirect(route('login'));
    }

    public function test_cyber_security_users_can_view_reports(): void
    {
        $user = User::factory()->create(['role' => 'cyber_security']);

        $this->actingAs($user)
            ->get(route('reports.index'))
            ->assertOk();
    }

    public function test_it_users_cannot_view_reports(): void
    {
        $user = User::factory()->create(['role' => 'it']);

        $this->actingAs($user)
            ->get(route('reports.index'))
            ->assertForbidden();
    }

    public function test_reports_data_endpoint_returns_report_payload(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $this->actingAs($user)
            ->getJson(route('reports.data', ['template' => 'executive']))
            ->assertOk()
            ->assertJsonStructure([
                'ts',
                'report' => ['period', 'kpis', 'severity', 'branches', 'branch_scores', 'assets'],
                'history',
            ]);
    }

    public function test_csv_export_downloads_and_records_history(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);

        $this->actingAs($user)
            ->get(route('reports.export_csv', ['template' => 'asset_status']))
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');

        $this->assertDatabaseHas('audit_log', [
            'module' => 'reports',
            'action' => 'report_export_csv',
            'target' => 'asset_status',
        ]);
    }

    public function test_pdf_export_returns_printable_html_and_records_history(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);

        $this->actingAs($user)
            ->get(route('reports.export_pdf', ['template' => 'incidents_by_severity']))
            ->assertOk()
            ->assertSee('Print / Save PDF', false);

        $this->assertDatabaseHas('audit_log', [
            'module' => 'reports',
            'action' => 'report_export_pdf',
            'target' => 'incidents_by_severity',
        ]);
    }
}
