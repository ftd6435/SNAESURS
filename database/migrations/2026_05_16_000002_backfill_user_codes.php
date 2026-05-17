<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        User::query()
            ->whereNull('code')
            ->select(['id'])
            ->chunkById(200, function ($users) {
                foreach ($users as $user) {
                    $user->code = User::generateUniqueCode();
                    $user->save();
                }
            });
    }

    public function down(): void
    {
        //
    }
};

