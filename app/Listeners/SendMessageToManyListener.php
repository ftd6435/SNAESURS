<?php

namespace App\Listeners;

use App\Events\SendMessageToManyEvent;
use App\Services\SmsService;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendMessageToManyListener implements ShouldQueue
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
    public function handle(SendMessageToManyEvent $event): void
    {
        $this->smsService->sendMessageToMany($event->telephones, $event->message);
    }
}
