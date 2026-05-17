<?php

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
        Schema::create('assign_statuts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('statut_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // L'utilisateur ne peut pas avoir deux affectations actives en même temps, mais peut en avoir plusieurs dans le temps
            $table->date('date_debut')->useCurrent();
            $table->date('date_fin'); // Cette affectation est un mendat, elle doit donc avoir une date de fin, même si elle est dans le futur
            $table->text('remarks')->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('assign_statuts')->nullOnDelete(); // Permet de lier une affectation à une affectation précédente, par exemple pour indiquer que l'affectation actuelle est une prolongation de l'affectation précédente, ou pour indiquer que l'affectation actuelle est une réactivation d'une affectation précédente, cette affectation doit automatiquement desactiver l'affectation précédente (is_active = false, date_fin = date_debut de la nouvelle affectation, remarks = "Prolongation du précédent mendat")
            $table->boolean('is_active')->default(true); // Indique si l'affectation est active ou non, si non l'affectation est terminée et l'utilisateur n'est plus lié au statut et remarks est renseigné
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
        Schema::dropIfExists('assign_statuts');
    }
};
