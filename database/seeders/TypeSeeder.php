<?php

namespace Database\Seeders;

use App\Models\Settings\TypeCotisation;
use App\Models\Settings\TypeDon;
use App\Models\Settings\TypeDepense;
use App\Models\Settings\TypeSanction;
use Illuminate\Database\Seeder;

class TypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Type Cotisations
        $typeCotisations = [
            ['libelle' => 'Cotisation Mensuelle'],
            ['libelle' => 'Cotisation Trimestrielle'],
            ['libelle' => 'Cotisation Annuelle'],
            ['libelle' => 'Frais d\'Adhésion'],
            ['libelle' => 'Cotisation Extraordinaire'],
        ];

        foreach ($typeCotisations as $type) {
            TypeCotisation::create($type);
        }

        // Type Dons
        $typeDons = [
            ['libelle' => 'Don en Espèces'],
            ['libelle' => 'Don en Nature'],
            ['libelle' => 'Don pour Événement'],
            ['libelle' => 'Don de Solidarité'],
            ['libelle' => 'Don Exceptionnel'],
        ];

        foreach ($typeDons as $type) {
            TypeDon::create($type);
        }

        // Type Dépenses
        $typeDepenses = [
            ['libelle' => 'Fournitures de Bureau'],
            ['libelle' => 'Frais de Déplacement'],
            ['libelle' => 'Frais de Communication'],
            ['libelle' => 'Loyer et Charges'],
            ['libelle' => 'Salaires et Honoraires'],
            ['libelle' => 'Organisation d\'Événements'],
            ['libelle' => 'Aide Sociale'],
            ['libelle' => 'Frais Bancaires'],
            ['libelle' => 'Maintenance et Réparations'],
            ['libelle' => 'Autres Dépenses'],
        ];

        foreach ($typeDepenses as $type) {
            TypeDepense::create($type);
        }

        // Type Sanctions
        $typeSanctions = [
            ['libelle' => 'Avertissement Écrit'],
            ['libelle' => 'Blâme'],
            ['libelle' => 'Suspension Temporaire'],
            ['libelle' => 'Amende'],
            ['libelle' => 'Retrait de Statut'],
            ['libelle' => 'Exclusion Temporaire'],
            ['libelle' => 'Exclusion Définitive'],
        ];

        foreach ($typeSanctions as $type) {
            TypeSanction::create($type);
        }

        $this->command->info('All types created successfully!');
    }
}
