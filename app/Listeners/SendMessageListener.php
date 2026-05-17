<?php

namespace App\Listeners;

use App\Events\SendMessageEvent;
use App\Services\SmsService;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendMessageListener implements ShouldQueue
{
    protected SmsService $smsService;

    /**
     * Create the event listener.
     */
    public function __construct(SmsService $smsService)
    {
        $this->smsService = $smsService;
    }

    /**
     * Handle the event.
     */
    public function handle(SendMessageEvent $event): void
    {
        $this->smsService->sendMessage($event->telephone, $event->message);
    }
}
