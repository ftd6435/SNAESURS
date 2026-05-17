<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class SmsService
{
    protected $basicToken;
    protected $senderName;
    protected $url;

    public function __construct()
    {
        $this->basicToken = config('services.nimba.basic_token');
        $this->senderName = config('services.nimba.sender');
        $this->url = config('services.nimba.url');
    }

    /**
     * Normalize a phone number to local format expected by the SMS provider.
     *
     * Rule:
     * - keep digits only
     * - if length is greater than 9, keep the last 9 digits
     */
    private function cleanNumber(string $phone): string
    {
        $digitsOnly = preg_replace('/\D+/', '', $phone) ?? '';

        if (strlen($digitsOnly) > 9) {
            return substr($digitsOnly, -9);
        }

        return $digitsOnly;
    }

    public function sendMessage(string $phone, string $message)
    {
        $cleanPhone = $this->cleanNumber($phone);

        $response = Http::withHeaders([
            'Authorization' => 'Basic ' . $this->basicToken,
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ])->post($this->url, [
            'sender_name' => $this->senderName,
            'to' => [$cleanPhone],
            'message' => $message,
        ]);

        if ($response->status() != 201) {
            throw new \Exception("Erreur d'envoi du message: " . json_encode($response->json()));
        }

        return $response->json();
    }

    public function sendMessageToMany(array $phones, string $message)
    {
        $recipients = array_values(array_filter(array_unique(array_map(function ($phone) {
            return $this->cleanNumber((string) $phone);
        }, $phones))));

        $response = Http::withHeaders([
            'Authorization' => 'Basic ' . $this->basicToken,
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ])->post($this->url, [
            'sender_name' => $this->senderName,
            'to' => $recipients,
            'message' => $message,
        ]);

        if ($response->status() !== 201) {
            throw new \Exception("Erreur d'envoi du message: " . json_encode($response->json()));
        }

        return $response->json();
    }
}
