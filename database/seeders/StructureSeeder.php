<?php

namespace Database\Seeders;

use App\Models\Settings\Structure;
use Illuminate\Database\Seeder;

class StructureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $structures = [
            [
                'libelle' => 'Bureau National',
                'adresse' => 'Conakry, Guinée',
                'contact' => '622111111',
                'email' => 'national@syndicat.gn',
            ],
            [
                'libelle' => 'Bureau Régional Kindia',
                'adresse' => 'Kindia, Guinée',
                'contact' => '622222222',
                'email' => 'kindia@syndicat.gn',
            ],
            [
                'libelle' => 'Bureau Régional Labé',
                'adresse' => 'Labé, Guinée',
                'contact' => '622333333',
                'email' => 'labe@syndicat.gn',
            ],
            [
                'libelle' => 'Bureau Régional Kankan',
                'adresse' => 'Kankan, Guinée',
                'contact' => '622444444',
                'email' => 'kankan@syndicat.gn',
            ],
            [
                'libelle' => 'Bureau Régional N\'Zérékoré',
                'adresse' => 'N\'Zérékoré, Guinée',
                'contact' => '622555555',
                'email' => 'nzerekore@syndicat.gn',
            ],
        ];

        foreach ($structures as $structure) {
            Structure::create($structure);
        }

        $this->command->info('Structures created successfully!');
    }
}
