<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('init_cotisations', function (Blueprint $table) {
            $table->date('date_limite')->nullable()->after('montant');
        });
    }

    public function down(): void
    {
        Schema::table('init_cotisations', function (Blueprint $table) {
            $table->dropColumn('date_limite');
        });
    }
};
