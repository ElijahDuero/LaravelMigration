<?php

namespace App\Http\Controllers;

use App\Models\NotifBot;
use App\Models\NotifRule;
use App\Models\NotifLog;
use App\Models\NotifAuditConfig;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class NotificationController extends Controller
{
    protected const EVENT_TYPES = [
        'incident.new'         => 'New Incident Reported',
        'incident.critical'    => 'Critical Incident',
        'incident.closed'      => 'Incident Closed',
        'threat.new'           => 'New Threat Indicator',
        'threat.critical'      => 'Critical Threat IOC',
        'branch.low_score'     => 'Branch Score Below Threshold',
        'audit.log'            => 'Audit Log Entry (forwarded)',
        'system.test'          => 'Test Message',
    ];

    protected const MODULES = [
        ''                => 'All Modules',
        'auth'            => 'Auth (Login / Logout)',
        'incidents'       => 'Incidents',
        'hardware'        => 'Hardware Assets',
        'software'        => 'Software Licenses',
        'systems'         => 'Systems Registry',
        'threat_intel'    => 'Threat Intelligence',
        'branches'        => 'Branches',
        'branch_security' => 'Branch Security',
        'users'           => 'Users',
        'settings'        => 'Settings',
        'notifications'   => 'Notifications',
    ];

    protected const FILTER_LEVELS = [
        'all'      => 'All Events (every audit entry)',
        'auth'     => 'Auth Events Only (logins, logouts)',
        'delete'   => 'Destructive Events Only (deletes, clears)',
        'critical' => 'Critical Only (failed logins, deletes, resets)',
    ];

    /**
     * Show notifications dashboard
     */
    public function index(Request $request)
    {
        $tab = $request->query('tab', 'bots');

        // Stats
        $stats = [
            'total_bots'   => NotifBot::count(),
            'active_bots'  => NotifBot::where('enabled', true)->count(),
            'total_sent'   => NotifLog::where('status', 'sent')->count(),
            'total_failed' => NotifLog::where('status', 'failed')->count(),
        ];

        // Bots
        $bots = NotifBot::orderBy('id', 'desc')->get();

        // Rules with bot info
        $rules = NotifRule::with('bot:id,label,channel')
            ->orderBy('id', 'desc')
            ->get();

        // Audit configs with bot info
        $auditConfigs = NotifAuditConfig::with('bot:id,label,enabled')
            ->orderBy('id', 'desc')
            ->get();

        // Logs (last 50)
        $logs = NotifLog::orderBy('id', 'desc')
            ->limit(50)
            ->get();

        return Inertia::render('notifications/index', [
            'tab'          => $tab,
            'stats'        => $stats,
            'bots'         => $bots,
            'rules'        => $rules,
            'auditConfigs' => $auditConfigs,
            'logs'         => $logs,
            'eventTypes'   => self::EVENT_TYPES,
            'modules'      => self::MODULES,
            'filterLevels' => self::FILTER_LEVELS,
        ]);
    }

    /**
     * Store or update a Telegram bot
     */
    public function saveBot(Request $request)
    {
        $validated = $request->validate([
            'id'        => 'nullable|integer|exists:notif_bots,id',
            'label'     => 'required|string|max:150',
            'bot_token' => 'required|string|max:255',
            'chat_id'   => 'required|string|max:100',
            'enabled'   => 'boolean',
        ]);

        $data = [
            'label'      => $validated['label'],
            'bot_token'  => $validated['bot_token'],
            'chat_id'    => $validated['chat_id'],
            'enabled'    => $request->boolean('enabled'),
            'created_by' => auth()->user()->username ?? 'system',
            'updated_at' => now(),
        ];

        if (!empty($validated['id'])) {
            // Update existing bot
            $bot = NotifBot::findOrFail($validated['id']);
            $bot->update($data);
            $action = 'updated';
        } else {
            // Create new bot
            $data['created_at'] = now();
            $bot = NotifBot::create($data);
            $action = 'created';
        }

        // Audit
        AuditService::log(
            'notifications',
            $action === 'created' ? 'create' : 'update',
            'notif_bots',
            $bot->id,
            $bot->label,
            $action === 'created' ? "Created bot: {$bot->label}" : "Updated bot: {$bot->label}"
        );

        // Test if requested
        if ($request->input('send_test')) {
            return $this->testBot($bot->id);
        }

        return redirect()->route('notifications.index', ['tab' => 'bots'])
            ->with('success', "Telegram bot \"{$bot->label}\" {$action} successfully!");
    }

    /**
     * Delete a bot
     */
    public function deleteBot(int $id)
    {
        $bot = NotifBot::findOrFail($id);
        $label = $bot->label;

        $bot->delete();

        AuditService::log('notifications', 'delete', 'notif_bots', $id, $label, "Deleted bot: {$label}");

        return redirect()->route('notifications.index', ['tab' => 'bots'])
            ->with('success', "Bot \"{$label}\" deleted successfully!");
    }

    /**
     * Test a Telegram bot by sending a test message
     */
    public function testBot(int $id)
    {
        $bot = NotifBot::findOrFail($id);

        if (!$bot->enabled) {
            return redirect()->route('notifications.index', ['tab' => 'bots'])
                ->with('error', "Bot \"{$bot->label}\" is disabled. Enable it first.");
        }

        $message = "🧪 **Test Message**\n"
            . "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            . "🕐 **Time:** " . now()->format('Y-m-d H:i:s') . "\n"
            . "🤖 **Bot:** {$bot->label}\n"
            . "✅ **Status:** Telegram connection successful!\n"
            . "📡 **Portal:** CyberSecurity Incident Management\n\n"
            . "If you're seeing this, notifications are working correctly.";

        try {
            $response = Http::timeout(10)->post(
                "https://api.telegram.org/bot{$bot->bot_token}/sendMessage",
                [
                    'chat_id'    => $bot->chat_id,
                    'text'       => $message,
                    'parse_mode' => 'Markdown',
                ]
            );

            if ($response->successful() && $response->json('ok')) {
                // Log success
                NotifLog::create([
                    'bot_id'     => $bot->id,
                    'channel'    => 'telegram',
                    'event_type' => 'system.test',
                    'message'    => $message,
                    'status'     => 'sent',
                    'sent_at'    => now(),
                ]);

                return redirect()->route('notifications.index', ['tab' => 'bots'])
                    ->with('success', "Test message sent successfully to \"{$bot->label}\"!");
            } else {
                $error = $response->json('description', 'Unknown error from Telegram API');

                NotifLog::create([
                    'bot_id'     => $bot->id,
                    'channel'    => 'telegram',
                    'event_type' => 'system.test',
                    'message'    => $message,
                    'status'     => 'failed',
                    'error'      => $error,
                    'sent_at'    => now(),
                ]);

                return redirect()->route('notifications.index', ['tab' => 'bots'])
                    ->with('error', "Failed to send test message: {$error}");
            }
        } catch (\Exception $e) {
            NotifLog::create([
                'bot_id'     => $bot->id,
                'channel'    => 'telegram',
                'event_type' => 'system.test',
                'message'    => $message,
                'status'     => 'failed',
                'error'      => $e->getMessage(),
                'sent_at'    => now(),
            ]);

            return redirect()->route('notifications.index', ['tab' => 'bots'])
                ->with('error', "Connection error: " . $e->getMessage());
        }
    }

    /**
     * Store a notification rule
     */
    public function saveRule(Request $request)
    {
        $validated = $request->validate([
            'bot_id'       => 'required|integer|exists:notif_bots,id',
            'event_type'   => 'required|string|in:' . implode(',', array_keys(self::EVENT_TYPES)),
            'min_severity' => 'nullable|string|in:Low,Medium,High,Critical',
            'enabled'      => 'boolean',
        ]);

        // Check for duplicate
        $exists = NotifRule::where('bot_id', $validated['bot_id'])
            ->where('event_type', $validated['event_type'])
            ->exists();

        if ($exists) {
            return redirect()->route('notifications.index', ['tab' => 'rules'])
                ->with('error', 'A rule for this bot and event already exists.');
        }

        $rule = NotifRule::create([
            'bot_id'       => $validated['bot_id'],
            'event_type'   => $validated['event_type'],
            'min_severity' => $validated['min_severity'] ?? null,
            'enabled'      => $request->boolean('enabled', true),
            'created_at'   => now(),
        ]);

        $bot = NotifBot::find($validated['bot_id']);

        AuditService::log(
            'notifications',
            'create',
            'notif_rules',
            $rule->id,
            self::EVENT_TYPES[$rule->event_type] ?? $rule->event_type,
            "Created notification rule: {$rule->event_type} → {$bot->label}"
        );

        return redirect()->route('notifications.index', ['tab' => 'rules'])
            ->with('success', 'Notification rule created successfully!');
    }

    /**
     * Delete a notification rule
     */
    public function deleteRule(int $id)
    {
        $rule = NotifRule::findOrFail($id);
        $eventLabel = self::EVENT_TYPES[$rule->event_type] ?? $rule->event_type;

        $rule->delete();

        AuditService::log('notifications', 'delete', 'notif_rules', $id, $eventLabel, "Deleted notification rule: {$eventLabel}");

        return redirect()->route('notifications.index', ['tab' => 'rules'])
            ->with('success', 'Notification rule deleted successfully!');
    }

    /**
     * Save or update audit forwarding config
     */
    public function saveAuditConfig(Request $request)
    {
        $validated = $request->validate([
            'id'            => 'nullable|integer|exists:notif_audit_config,id',
            'bot_id'        => 'required|integer|exists:notif_bots,id',
            'filter_module' => 'nullable|string|max:100',
            'filter_actor'  => 'nullable|string|max:100',
            'filter_level'  => 'required|string|in:' . implode(',', array_keys(self::FILTER_LEVELS)),
            'enabled'       => 'boolean',
        ]);

        $data = [
            'bot_id'        => $validated['bot_id'],
            'filter_module' => $validated['filter_module'] ?? '',
            'filter_actor'  => $validated['filter_actor'] ?? '',
            'filter_level'  => $validated['filter_level'],
            'enabled'       => $request->boolean('enabled', true),
            'created_by'    => auth()->user()->username ?? 'system',
            'updated_at'    => now(),
        ];

        if (!empty($validated['id'])) {
            // Update
            $config = NotifAuditConfig::findOrFail($validated['id']);
            $config->update($data);
            $action = 'updated';
        } else {
            // Create
            $config = NotifAuditConfig::create($data);
            $action = 'created';
        }

        $bot = NotifBot::find($validated['bot_id']);

        AuditService::log(
            'notifications',
            $action === 'created' ? 'create' : 'update',
            'notif_audit_config',
            $config->id,
            $bot->label,
            "Audit forwarding {$action}: {$bot->label}"
        );

        return redirect()->route('notifications.index', ['tab' => 'audit'])
            ->with('success', "Audit forwarding config {$action} successfully!");
    }

    /**
     * Delete audit forwarding config
     */
    public function deleteAuditConfig(int $id)
    {
        $config = NotifAuditConfig::with('bot')->findOrFail($id);
        $botLabel = $config->bot->label ?? 'Unknown';

        $config->delete();

        AuditService::log('notifications', 'delete', 'notif_audit_config', $id, $botLabel, "Deleted audit forwarding: {$botLabel}");

        return redirect()->route('notifications.index', ['tab' => 'audit'])
            ->with('success', 'Audit forwarding config deleted successfully!');
    }

    /**
     * Clear notification log
     */
    public function clearLog()
    {
        $count = NotifLog::count();
        NotifLog::truncate();

        AuditService::log('notifications', 'delete', 'notif_log', null, null, "Cleared notification log ({$count} entries)");

        return redirect()->route('notifications.index', ['tab' => 'log'])
            ->with('success', "Notification log cleared ({$count} entries deleted)!");
    }
}
