<?php

namespace Database\Seeders;

use App\Models\Settings\Statut;
use Illuminate\Database\Seeder;

class StatutSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statuts = [
            ['libelle' => 'Secrétaire Général', 'description' => 'Responsable de la coordination générale du syndicat'],
            ['libelle' => 'Secrétaire Général Adjoint', 'description' => 'Assiste le Secrétaire Général'],
            ['libelle' => 'Trésorier Général', 'description' => 'Responsable de la gestion financière'],
            ['libelle' => 'Trésorier Adjoint', 'description' => 'Assiste le Trésorier Général'],
            ['libelle' => 'Secrétaire à l\'Organisation', 'description' => 'Responsable de l\'organisation interne'],
            ['libelle' => 'Secrétaire à la Communication', 'description' => 'Responsable de la communication'],
            ['libelle' => 'Secrétaire aux Affaires Sociales', 'description' => 'Gestion des affaires sociales'],
            ['libelle' => 'Commissaire aux Comptes', 'description' => 'Contrôle et vérification des comptes'],
            ['libelle' => 'Membre du Bureau Exécutif', 'description' => 'Membre actif du bureau exécutif'],
            ['libelle' => 'Délégué Régional', 'description' => 'Représentant régional du syndicat'],
        ];

        foreach ($statuts as $statut) {
            Statut::create($statut);
        }

        $this->command->info('Statuts created successfully!');
    }
}
