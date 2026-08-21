<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class TelegramService
{
    public static function send(string $botToken, string $chatId, string $message): array
    {
        $botToken = trim($botToken);
        $chatId = trim($chatId);

        if ($botToken === '' || $chatId === '') {
            return ['ok' => false, 'error' => 'Bot token and Chat ID are required.'];
        }

        $url = "https://api.telegram.org/bot{$botToken}/sendMessage";

        try {
            $response = Http::timeout(10)->post($url, [
                'chat_id'    => $chatId,
                'text'       => $message,
                'parse_mode' => 'HTML',
            ]);

            $data = $response->json();

            if (! $response->successful() || empty($data['ok'])) {
                return [
                    'ok'    => false,
                    'error' => $data['description'] ?? 'Telegram API returned an error.',
                ];
            }

            return ['ok' => true];
        } catch (\Exception $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }
}
