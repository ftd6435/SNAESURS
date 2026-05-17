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
        Schema::create('type_dons', function (Blueprint $table) {
            $table->id();
            $table->string('libelle')->unique();
            $table->text('description')->nullable();
            $table->decimal('montant_attendu', 15, 2)->nullable();
            $table->boolean('is_open')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    // Insert default type dons such as 'Dons en argent', 'Dons en nature', 'Dons de services', etc.
    public function insertDefaultTypeDons(): void
    {
        $defaultTypeDons = [
            ['libelle' => 'Dons en argent', 'description' => 'Dons monétaires faits à l\'organisation.'],
            ['libelle' => 'Dons en nature', 'description' => 'Dons de biens matériels ou de produits.'],
            ['libelle' => 'Dons de services', 'description' => 'Dons de services ou de compétences professionnelles.'],
        ];

        foreach ($defaultTypeDons as $typeDon) {
            DB::table('type_dons')->insert($typeDon);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('type_dons');
    }
};
