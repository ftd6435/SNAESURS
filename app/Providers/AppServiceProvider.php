<?php

namespace App\Providers;

use App\Events\SendMessageEvent;
use App\Events\SendMessageToManyEvent;
use App\Listeners\SendMessageListener;
use App\Listeners\SendMessageToManyListener;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register event listeners
        Event::listen(
            SendMessageEvent::class,
            SendMessageListener::class
        );

        Event::listen(
            SendMessageToManyEvent::class,
            SendMessageToManyListener::class
        );
    }
}
