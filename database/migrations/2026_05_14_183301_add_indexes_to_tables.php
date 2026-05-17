<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function indexExists(string $table, string $indexName): bool
    {
        $database = DB::connection()->getDatabaseName();
        $result = DB::select(
            'SELECT 1 FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ? LIMIT 1',
            [$database, $table, $indexName]
        );

        return count($result) > 0;
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add indexes to users table
        Schema::table('users', function (Blueprint $table) {
            if (!$this->indexExists('users', 'users_role_index')) $table->index('role');
            if (!$this->indexExists('users', 'users_is_approved_is_active_index')) $table->index(['is_approved', 'is_active']);
            if (!$this->indexExists('users', 'users_telephone_index')) $table->index('telephone');
        });

        // Add indexes to assign_structures table
        Schema::table('assign_structures', function (Blueprint $table) {
            if (!$this->indexExists('assign_structures', 'assign_structures_user_id_is_active_index')) $table->index(['user_id', 'is_active']);
            if (!$this->indexExists('assign_structures', 'assign_structures_structure_id_index')) $table->index('structure_id');
        });

        // Add indexes to assign_statuts table
        Schema::table('assign_statuts', function (Blueprint $table) {
            if (!$this->indexExists('assign_statuts', 'assign_statuts_user_id_is_active_index')) $table->index(['user_id', 'is_active']);
            if (!$this->indexExists('assign_statuts', 'assign_statuts_statut_id_index')) $table->index('statut_id');
        });

        // Add indexes to cotisations table (if exists)
        if (Schema::hasTable('cotisations')) {
            Schema::table('cotisations', function (Blueprint $table) {
                if (!$this->indexExists('cotisations', 'cotisations_user_id_index')) $table->index('user_id');
                if (!$this->indexExists('cotisations', 'cotisations_init_cotisation_id_index')) $table->index('init_cotisation_id');
                if (!$this->indexExists('cotisations', 'cotisations_paid_at_index')) $table->index('paid_at');
                if (!$this->indexExists('cotisations', 'cotisations_created_at_index')) $table->index('created_at');
            });
        }

        // Add indexes to dons table (if exists)
        if (Schema::hasTable('dons')) {
            Schema::table('dons', function (Blueprint $table) {
                if (!$this->indexExists('dons', 'dons_user_id_index')) $table->index('user_id');
                if (!$this->indexExists('dons', 'dons_structure_id_index')) $table->index('structure_id');
                if (!$this->indexExists('dons', 'dons_type_don_id_index')) $table->index('type_don_id');
                if (!$this->indexExists('dons', 'dons_created_at_index')) $table->index('created_at');
            });
        }

        // Add indexes to sanctions table (if exists)
        if (Schema::hasTable('sanctions')) {
            Schema::table('sanctions', function (Blueprint $table) {
                if (!$this->indexExists('sanctions', 'sanctions_user_id_index')) $table->index('user_id');
                if (!$this->indexExists('sanctions', 'sanctions_structure_id_index')) $table->index('structure_id');
                if (!$this->indexExists('sanctions', 'sanctions_type_sanction_id_index')) $table->index('type_sanction_id');
                if (!$this->indexExists('sanctions', 'sanctions_created_at_index')) $table->index('created_at');
            });
        }

        // Add indexes to depenses table (if exists)
        if (Schema::hasTable('depenses')) {
            Schema::table('depenses', function (Blueprint $table) {
                if (!$this->indexExists('depenses', 'depenses_structure_id_index')) $table->index('structure_id');
                if (!$this->indexExists('depenses', 'depenses_type_depense_id_index')) $table->index('type_depense_id');
                if (!$this->indexExists('depenses', 'depenses_created_at_index')) $table->index('created_at');
            });
        }

        // Add indexes to reunions table (if exists)
        if (Schema::hasTable('reunions')) {
            Schema::table('reunions', function (Blueprint $table) {
                if (!$this->indexExists('reunions', 'reunions_type_index')) $table->index('type');
                if (!$this->indexExists('reunions', 'reunions_structure_id_index')) $table->index('structure_id');
                if (!$this->indexExists('reunions', 'reunions_status_index')) $table->index('status');
                if (!$this->indexExists('reunions', 'reunions_date_reunion_index')) $table->index('date_reunion');
            });
        }

        // Add indexes to participants table (if exists)
        if (Schema::hasTable('participants')) {
            Schema::table('participants', function (Blueprint $table) {
                if (!$this->indexExists('participants', 'participants_reunion_id_index')) $table->index('reunion_id');
                if (!$this->indexExists('participants', 'participants_user_id_index')) $table->index('user_id');
                if (!$this->indexExists('participants', 'participants_status_index')) $table->index('status');
                if (!$this->indexExists('participants', 'participants_reunion_id_user_id_unique')) $table->unique(['reunion_id', 'user_id']);
            });
        }

        // Add indexes to init_cotisations table (if exists)
        if (Schema::hasTable('init_cotisations')) {
            Schema::table('init_cotisations', function (Blueprint $table) {
                if (!$this->indexExists('init_cotisations', 'init_cotisations_structure_id_index')) $table->index('structure_id');
                if (!$this->indexExists('init_cotisations', 'init_cotisations_type_cotisation_id_index')) $table->index('type_cotisation_id');
                if (!$this->indexExists('init_cotisations', 'init_cotisations_is_completed_index')) $table->index('is_completed');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes from users table
        Schema::table('users', function (Blueprint $table) {
            if ($this->indexExists('users', 'users_role_index')) $table->dropIndex('users_role_index');
            if ($this->indexExists('users', 'users_is_approved_is_active_index')) $table->dropIndex('users_is_approved_is_active_index');
            if ($this->indexExists('users', 'users_telephone_index')) $table->dropIndex('users_telephone_index');
        });

        // Drop indexes from assign_structures table
        Schema::table('assign_structures', function (Blueprint $table) {
            if ($this->indexExists('assign_structures', 'assign_structures_user_id_is_active_index')) $table->dropIndex('assign_structures_user_id_is_active_index');
            if ($this->indexExists('assign_structures', 'assign_structures_structure_id_index')) $table->dropIndex('assign_structures_structure_id_index');
        });

        // Drop indexes from assign_statuts table
        Schema::table('assign_statuts', function (Blueprint $table) {
            if ($this->indexExists('assign_statuts', 'assign_statuts_user_id_is_active_index')) $table->dropIndex('assign_statuts_user_id_is_active_index');
            if ($this->indexExists('assign_statuts', 'assign_statuts_statut_id_index')) $table->dropIndex('assign_statuts_statut_id_index');
        });

        // Drop indexes from other tables
        if (Schema::hasTable('cotisations')) {
            Schema::table('cotisations', function (Blueprint $table) {
                if ($this->indexExists('cotisations', 'cotisations_user_id_index')) $table->dropIndex('cotisations_user_id_index');
                if ($this->indexExists('cotisations', 'cotisations_init_cotisation_id_index')) $table->dropIndex('cotisations_init_cotisation_id_index');
                if ($this->indexExists('cotisations', 'cotisations_paid_at_index')) $table->dropIndex('cotisations_paid_at_index');
                if ($this->indexExists('cotisations', 'cotisations_created_at_index')) $table->dropIndex('cotisations_created_at_index');
            });
        }

        if (Schema::hasTable('dons')) {
            Schema::table('dons', function (Blueprint $table) {
                if ($this->indexExists('dons', 'dons_user_id_index')) $table->dropIndex('dons_user_id_index');
                if ($this->indexExists('dons', 'dons_structure_id_index')) $table->dropIndex('dons_structure_id_index');
                if ($this->indexExists('dons', 'dons_type_don_id_index')) $table->dropIndex('dons_type_don_id_index');
                if ($this->indexExists('dons', 'dons_created_at_index')) $table->dropIndex('dons_created_at_index');
            });
        }

        if (Schema::hasTable('sanctions')) {
            Schema::table('sanctions', function (Blueprint $table) {
                if ($this->indexExists('sanctions', 'sanctions_user_id_index')) $table->dropIndex('sanctions_user_id_index');
                if ($this->indexExists('sanctions', 'sanctions_structure_id_index')) $table->dropIndex('sanctions_structure_id_index');
                if ($this->indexExists('sanctions', 'sanctions_type_sanction_id_index')) $table->dropIndex('sanctions_type_sanction_id_index');
                if ($this->indexExists('sanctions', 'sanctions_created_at_index')) $table->dropIndex('sanctions_created_at_index');
            });
        }

        if (Schema::hasTable('depenses')) {
            Schema::table('depenses', function (Blueprint $table) {
                if ($this->indexExists('depenses', 'depenses_structure_id_index')) $table->dropIndex('depenses_structure_id_index');
                if ($this->indexExists('depenses', 'depenses_type_depense_id_index')) $table->dropIndex('depenses_type_depense_id_index');
                if ($this->indexExists('depenses', 'depenses_created_at_index')) $table->dropIndex('depenses_created_at_index');
            });
        }

        if (Schema::hasTable('reunions')) {
            Schema::table('reunions', function (Blueprint $table) {
                if ($this->indexExists('reunions', 'reunions_type_index')) $table->dropIndex('reunions_type_index');
                if ($this->indexExists('reunions', 'reunions_structure_id_index')) $table->dropIndex('reunions_structure_id_index');
                if ($this->indexExists('reunions', 'reunions_status_index')) $table->dropIndex('reunions_status_index');
                if ($this->indexExists('reunions', 'reunions_date_reunion_index')) $table->dropIndex('reunions_date_reunion_index');
            });
        }

        if (Schema::hasTable('participants')) {
            Schema::table('participants', function (Blueprint $table) {
                if ($this->indexExists('participants', 'participants_reunion_id_user_id_unique')) $table->dropUnique('participants_reunion_id_user_id_unique');
                if ($this->indexExists('participants', 'participants_reunion_id_index')) $table->dropIndex('participants_reunion_id_index');
                if ($this->indexExists('participants', 'participants_user_id_index')) $table->dropIndex('participants_user_id_index');
                if ($this->indexExists('participants', 'participants_status_index')) $table->dropIndex('participants_status_index');
            });
        }

        if (Schema::hasTable('init_cotisations')) {
            Schema::table('init_cotisations', function (Blueprint $table) {
                if ($this->indexExists('init_cotisations', 'init_cotisations_structure_id_index')) $table->dropIndex('init_cotisations_structure_id_index');
                if ($this->indexExists('init_cotisations', 'init_cotisations_type_cotisation_id_index')) $table->dropIndex('init_cotisations_type_cotisation_id_index');
                if ($this->indexExists('init_cotisations', 'init_cotisations_is_completed_index')) $table->dropIndex('init_cotisations_is_completed_index');
            });
        }
    }
};
