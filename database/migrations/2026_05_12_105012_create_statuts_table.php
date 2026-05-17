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
        Schema::create('statuts', function (Blueprint $table) {
            $table->id();
            $table->string('libelle')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    // Insert default statuts such as 'Président Général', 'Président', 'Vice-Président', 'Secrétaire Général', 'Trésorier', etc.
    public function insertDefaultStatuts(): void
    {
        $defaultStatuts = [
            ['libelle' => 'Président Général', 'description' => 'Le Président Général est le chef suprême de l\'organisation. Il supervise toutes les activités et prend les décisions finales.'],
            ['libelle' => 'Président', 'description' => 'Le Président est responsable de la gestion quotidienne de l\'organisation d\'une structure et de la mise en œuvre des décisions du Président Général.'],
            ['libelle' => 'Vice-Président', 'description' => 'Le Vice-Président assiste le Président dans ses fonctions et peut le remplacer en cas d\'absence.'],
            ['libelle' => 'Secrétaire Général', 'description' => 'Le Secrétaire Général est chargé de la gestion administrative, de la tenue des procès-verbaux et de la communication interne.'],
            ['libelle' => 'Trésorier', 'description' => 'Le Trésorier est responsable de la gestion financière, de la tenue des comptes et de la préparation des rapports financiers.'],
        ];

        foreach ($defaultStatuts as $statut) {
            DB::table('statuts')->insert($statut);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('statuts');
    }
};
