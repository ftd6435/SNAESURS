<?php

use App\Models\Settings\Structure;
use App\Models\Settings\TypeCotisation;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('init_cotisations', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(TypeCotisation::class)->constrained()->onDelete('cascade');
            $table->foreignIdFor(Structure::class)->constrained()->onDelete('cascade');
            $table->string('libelle');
            $table->text('description')->nullable();
            $table->boolean('is_completed')->default(false);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('init_cotisations');
    }
};
