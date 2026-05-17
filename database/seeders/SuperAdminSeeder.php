<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create super admin user
        User::create([
            'full_name' => 'Super Administrateur',
            'telephone' => '622000000',
            'email' => 'admin@gmail.com',
            'password' => Hash::make('password123'),
            'role' => 'super_admin',
            'is_approved' => true,
            'is_active' => true,
            'genre' => 'autre',
        ]);

        // Create additional admin user
        User::create([
            'full_name' => 'Administrateur Principal',
            'telephone' => '622000001',
            'email' => 'administrateur@gmail.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'is_approved' => true,
            'is_active' => true,
            'genre' => 'autre',
        ]);

        $this->command->info('Super admin and admin users created successfully!');
        $this->command->info('Email: admin@gestion-syndicale.gn | Password: password123');
        $this->command->info('Email: administrateur@gestion-syndicale.gn | Password: password123');
    }
}
