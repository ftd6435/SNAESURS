<?php

use App\Models\Settings\Structure;
use App\Models\User;
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
        Schema::create('assign_structures', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Structure::class)->constrained()->onDelete('cascade');
            $table->foreignIdFor(User::class)->constrained()->onDelete('cascade'); // L'utilisateur ne peut pas avoir deux affectations actives en même temps, mais peut en avoir plusieurs dans le temps
            $table->date('assigned_at')->useCurrent();
            $table->date('unassigned_at')->nullable();
            $table->text('remarks')->nullable();
            $table->decimal('frais_integration', 8, 2)->default(0);
            $table->boolean('is_active')->default(true); // Indique si l'affectation est active ou non, si non l'affectation est terminée et l'utilisateur n'est plus lié à la structure et unassigned_at & remarks sont renseignés
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
        Schema::dropIfExists('assign_structures');
    }
};
