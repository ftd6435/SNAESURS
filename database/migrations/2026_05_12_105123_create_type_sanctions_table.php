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
        Schema::create('type_sanctions', function (Blueprint $table) {
            $table->id();
            $table->string('libelle')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    // Insert default type sanctions such as 'Avertissement', 'Blâme', 'Suspension', 'Exclusion', etc.
    public function insertDefaultTypeSanctions(): void
    {
        $defaultTypeSanctions = [
            ['libelle' => 'Avertissement', 'description' => 'Un avertissement est une sanction légère qui sert à signaler un comportement inapproprié sans conséquences graves.'],
            ['libelle' => 'Blâme', 'description' => 'Un blâme est une sanction plus sévère que l\'avertissement, indiquant une réprimande officielle pour un comportement inacceptable.'],
            ['libelle' => 'Suspension', 'description' => 'La suspension est une sanction temporaire qui interdit à un membre de participer aux activités de l\'organisation pendant une période déterminée.'],
            ['libelle' => 'Exclusion', 'description' => 'L\'exclusion est la sanction la plus grave, entraînant l\'expulsion définitive d\'un membre de l\'organisation en raison de comportements graves ou répétés.'],
        ];

        foreach ($defaultTypeSanctions as $typeSanction) {
            DB::table('type_sanctions')->insert($typeSanction);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('type_sanctions');
    }
};
