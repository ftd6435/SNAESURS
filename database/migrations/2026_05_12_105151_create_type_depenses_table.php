<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('type_depenses', function (Blueprint $table) {
            $table->id();
            $table->string('libelle')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    // Insert default type depenses such as 'Frais de réunion', 'Frais de déplacement', 'Frais de communication', 'Frais de matériel', etc.
    public function insertDefaultTypeDepenses(): void
    {
        $defaultTypeDepenses = [
            ['libelle' => 'Frais de réunion', 'description' => 'Dépenses liées à l\'organisation et à la tenue de réunions, telles que la location de salle, les rafraîchissements, etc.'],
            ['libelle' => 'Frais de déplacement', 'description' => 'Dépenses liées aux déplacements des membres pour des activités de l\'organisation, telles que les billets de transport, l\'hébergement, etc.'],
            ['libelle' => 'Frais de communication', 'description' => 'Dépenses liées à la communication de l\'organisation, telles que les frais de téléphone, d\'internet, d\'impression, etc.'],
            ['libelle' => 'Frais de matériel', 'description' => 'Dépenses liées à l\'achat de matériel nécessaire pour les activités de l\'organisation, telles que les fournitures de bureau, les équipements, etc.'],
        ];

        foreach ($defaultTypeDepenses as $typeDepense) {
            DB::table('type_depenses')->insert($typeDepense);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('type_depenses');
    }
};
