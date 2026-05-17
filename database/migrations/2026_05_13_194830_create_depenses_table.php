<?php

use App\Models\Settings\Structure;
use App\Models\Settings\TypeDepense;
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
        Schema::create('depenses', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(TypeDepense::class)->constrained()->onDelete('cascade');
            $table->foreignIdFor(Structure::class)->constrained()->onDelete('cascade');
            $table->text('commentaire')->nullable();
            $table->decimal('montant', 15, 2)->default(0);
            $table->softDeletes();
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
        Schema::dropIfExists('depenses');
    }
};
