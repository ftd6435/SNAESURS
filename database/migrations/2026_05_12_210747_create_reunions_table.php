<?php

use App\Models\Settings\Structure;
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
        Schema::create('reunions', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['generale', 'structure']);
            $table->foreignIdFor(Structure::class)->nullable()->constrained()->nullOnDelete(); // must be provided if type is 'structure'
            $table->string('libelle');
            $table->text('description')->nullable();
            $table->date('date_reunion');
            $table->time('heure_debut');
            $table->time('heure_fin');
            $table->string('lieu')->nullable();
            $table->json('points_reunion')->nullable(); // List of points that are going to be discussed in the meeting
            $table->json('proces_verbal')->nullable(); // Report of the meeting, to be filled after the meeting is completed
            $table->enum('status', ['pending', 'completed', 'canceled'])->default('pending'); // to complete a meeting, user must provide 'proces_verbal'
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
        Schema::dropIfExists('reunions');
    }
};
