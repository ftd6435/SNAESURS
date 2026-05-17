<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SendMessageToManyEvent
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public array $telephones;
    public string $message;

    /**
     * Create a new event instance.
     */
    public function __construct(array $telephones, string $message)
    {
        $this->telephones = $telephones;
        $this->message = $message;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('channel-name'),
        ];
    }
}
