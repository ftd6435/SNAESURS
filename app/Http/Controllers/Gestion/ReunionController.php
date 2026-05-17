<?php

namespace App\Http\Controllers\Gestion;

use App\Events\SendMessageToManyEvent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Gestion\StoreReunionRequest;
use App\Http\Requests\Gestion\UpdateReunionRequest;
use App\Http\Resources\Gestion\ReunionResource;
use App\Models\Gestion\Participant;
use App\Models\Gestion\Reunion;
use App\Models\Settings\AssignStatut;
use App\Models\Settings\AssignStructure;
use App\Models\User;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;

class ReunionController extends Controller
{
    use ApiResponses;

    /**
     * Display a listing of reunions.
     */
    public function index(Request $request)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            // Build query based on auth user's role
            $query = Reunion::query()
                ->with(['structure:id,libelle'])
                ->withCount('participants');

            // If auth user is 'membre', apply restrictions
            if ($authUser->role === 'membre') {
                // Get auth user's active structure IDs
                $structureIds = AssignStructure::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->pluck('structure_id')
                    ->toArray();

                // Filter: reunions of type 'generale' OR reunions of user's active structures
                $query->where(function ($q) use ($structureIds) {
                    $q->where('type', 'generale')
                        ->orWhere(function ($sq) use ($structureIds) {
                            $sq->where('type', 'structure')
                                ->whereIn('structure_id', $structureIds);
                        });
                });
            }

            // Add filters
            if ($request->has('type')) {
                $query->where('type', $request->input('type'));
            }

            if ($request->has('structure_id')) {
                $query->where('structure_id', $request->input('structure_id'));
            }

            if ($request->has('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where('libelle', 'like', "%{$search}%");
            }

            // Pagination
            $perPage = $request->input('per_page', 15);
            $reunions = $query->latest('date_reunion')->paginate($perPage);

            return $this->successResponse(
                ReunionResource::collection($reunions)->response()->getData(true),
                'Liste des réunions récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération des réunions.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Store a newly created reunion.
     */
    public function store(StoreReunionRequest $request)
    {
        try {
            DB::beginTransaction();

            /**
             * @var User $authUser
             */
            $authUser = Auth::user();
            $validated = $request->validated();

            // Check permissions based on role
            if ($authUser->role === 'membre') {
                // Membre with active statut can only create 'structure' type reunions
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if (!$hasActiveStatut) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez avoir un statut actif pour créer une réunion.'],
                        403
                    );
                }

                if ($validated['type'] !== 'structure') {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Les membres ne peuvent créer que des réunions de type structure.'],
                        403
                    );
                }

                // Force structure_id to be membre's active structure
                $authUserStructure = AssignStructure::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->first();

                if (!$authUserStructure) {
                    return $this->errorResponse(
                        'Erreur.',
                        ['error' => 'Vous devez appartenir à une structure active pour créer une réunion.'],
                        400
                    );
                }

                $validated['structure_id'] = $authUserStructure->structure_id;
            } elseif ($authUser->role === 'admin') {
                // Admin must have active statut to create reunions
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if (!$hasActiveStatut) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez avoir un statut actif pour créer une réunion.'],
                        403
                    );
                }
            }
            // super_admin has no restrictions

            // Create reunion
            $reunion = Reunion::create(array_merge($validated, [
                'created_by' => Auth::id(),
            ]));

            // Auto-add participants based on type
            $participants = [];
            if ($validated['type'] === 'generale') {
                // Add all active users
                $users = User::where('is_active', true)->get();
                foreach ($users as $user) {
                    $participants[] = [
                        'reunion_id' => $reunion->id,
                        'user_id' => $user->id,
                        'status' => 'pending',
                        'created_by' => Auth::id(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            } else {
                // Add all active users of the structure
                $userIds = AssignStructure::where('structure_id', $validated['structure_id'])
                    ->where('is_active', true)
                    ->pluck('user_id')
                    ->unique()
                    ->toArray();

                $users = User::whereIn('id', $userIds)->where('is_active', true)->get();
                foreach ($users as $user) {
                    $participants[] = [
                        'reunion_id' => $reunion->id,
                        'user_id' => $user->id,
                        'status' => 'pending',
                        'created_by' => Auth::id(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }

            if (!empty($participants)) {
                Participant::insert($participants);
            }

            DB::commit();

            // Send SMS notifications
            $this->notifyParticipants($reunion, $users ?? collect());

            // Load relationships for response
            $reunion->load([
                'structure:id,libelle',
                'participants.user:id,full_name,telephone,email,avatar'
            ]);

            return $this->successResponse(
                new ReunionResource($reunion),
                'Réunion créée avec succès.',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la création de la réunion.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Display the specified reunion.
     */
    public function show(Reunion $reunion)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            // Check permissions for 'membre' role
            if ($authUser->role === 'membre') {
                // Can view if type is 'generale' OR belongs to user's active structures
                if ($reunion->type === 'structure') {
                    $userStructure = AssignStructure::where('user_id', $authUser->id)
                        ->where('structure_id', $reunion->structure_id)
                        ->where('is_active', true)
                        ->exists();

                    if (!$userStructure) {
                        return $this->errorResponse(
                            'Accès refusé.',
                            ['error' => 'Vous ne pouvez consulter que les réunions générales ou de vos structures actives.'],
                            403
                        );
                    }
                }
            }

            $reunion->load([
                'structure:id,libelle',
                'participants.user:id,full_name,telephone,email,avatar'
            ]);

            return $this->successResponse(
                new ReunionResource($reunion),
                'Réunion récupérée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la récupération de la réunion.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Update the specified reunion.
     */
    public function update(UpdateReunionRequest $request, Reunion $reunion)
    {
        try {
            DB::beginTransaction();

            /**
             * @var User $authUser
             */
            $authUser = Auth::user();
            $validated = $request->validated();

            // Check permissions
            if ($authUser->role === 'membre') {
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if (!$hasActiveStatut) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez avoir un statut actif pour modifier une réunion.'],
                        403
                    );
                }

                // Can only modify reunions of their active structures
                if ($reunion->type === 'structure') {
                    $userStructure = AssignStructure::where('user_id', $authUser->id)
                        ->where('structure_id', $reunion->structure_id)
                        ->where('is_active', true)
                        ->exists();

                    if (!$userStructure) {
                        return $this->errorResponse(
                            'Accès refusé.',
                            ['error' => 'Vous ne pouvez modifier que les réunions de vos structures actives.'],
                            403
                        );
                    }
                } else {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous ne pouvez pas modifier une réunion générale.'],
                        403
                    );
                }
            } elseif ($authUser->role === 'admin') {
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if (!$hasActiveStatut) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez avoir un statut actif pour modifier une réunion.'],
                        403
                    );
                }
            }

            if (
                array_key_exists('status', $validated)
                && $validated['status'] === 'canceled'
                && $reunion->status !== 'pending'
            ) {
                return $this->errorResponse(
                    'Annulation impossible.',
                    ['error' => 'Seules les réunions en attente peuvent être annulées.'],
                    400
                );
            }

            $reunion->update(array_merge($validated, [
                'updated_by' => Auth::id(),
            ]));

            DB::commit();

            // Load relationships for response
            $reunion->load([
                'structure:id,libelle',
                'participants.user:id,full_name,telephone,email,avatar'
            ]);

            return $this->successResponse(
                new ReunionResource($reunion),
                'Réunion mise à jour avec succès.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse(
                'Erreur lors de la mise à jour de la réunion.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Remove the specified reunion.
     */
    public function destroy(Reunion $reunion)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            // Check if reunion has participants with status 'present'
            $hasPresentParticipants = $reunion->participants()->where('status', 'present')->exists();

            if ($hasPresentParticipants) {
                // Cannot delete if there's at least one 'present' participant
                return $this->errorResponse(
                    'Suppression impossible.',
                    ['error' => 'Impossible de supprimer une réunion avec des participants présents.'],
                    400
                );
            }

            // Can only delete if reunion is canceled and no present participants
            if ($reunion->status !== 'canceled') {
                return $this->errorResponse(
                    'Suppression impossible.',
                    ['error' => 'Seules les réunions annulées sans participants présents peuvent être supprimées.'],
                    400
                );
            }

            // Check permissions
            if ($authUser->role === 'membre') {
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if (!$hasActiveStatut) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez avoir un statut actif pour supprimer une réunion.'],
                        403
                    );
                }

                if ($reunion->type === 'structure') {
                    $userStructure = AssignStructure::where('user_id', $authUser->id)
                        ->where('structure_id', $reunion->structure_id)
                        ->where('is_active', true)
                        ->exists();

                    if (!$userStructure) {
                        return $this->errorResponse(
                            'Accès refusé.',
                            ['error' => 'Vous ne pouvez supprimer que les réunions de vos structures actives.'],
                            403
                        );
                    }
                } else {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous ne pouvez pas supprimer une réunion générale.'],
                        403
                    );
                }
            } elseif ($authUser->role === 'admin') {
                $hasActiveStatut = AssignStatut::where('user_id', $authUser->id)
                    ->where('is_active', true)
                    ->exists();

                if (!$hasActiveStatut) {
                    return $this->errorResponse(
                        'Accès refusé.',
                        ['error' => 'Vous devez avoir un statut actif pour supprimer une réunion.'],
                        403
                    );
                }
            }

            $reunion->delete();

            return $this->successResponse(
                [],
                'Réunion supprimée avec succès.'
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la suppression de la réunion.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Notify participants about the reunion via SMS.
     */
    private function notifyParticipants(Reunion $reunion, $users)
    {
        if ($users->isEmpty()) {
            return;
        }

        $phones = $users->pluck('telephone')->filter()->toArray();

        if (empty($phones)) {
            return;
        }

        // Create a message < 160 characters
        $date = $reunion->date_reunion->format('d/m/Y');
        $heure = substr($reunion->heure_debut, 0, 5);

        if ($reunion->type === 'generale') {
            $message = "Réunion générale: {$reunion->libelle}\nDate: {$date} à {$heure}\nLieu: " . ($reunion->lieu ?? 'À définir');
        } else {
            $structure = $reunion->structure->libelle ?? 'Structure';
            $message = "Réunion {$structure}: {$reunion->libelle}\nDate: {$date} à {$heure}\nLieu: " . ($reunion->lieu ?? 'À définir');
        }

        // Truncate if needed to ensure < 160 characters
        if (strlen($message) > 155) {
            $message = substr($message, 0, 152) . '...';
        }

        SendMessageToManyEvent::dispatch($phones, $message);
    }

    public function downloadProcesVerbalPdf(Reunion $reunion)
    {
        try {
            /**
             * @var User $authUser
             */
            $authUser = Auth::user();

            if ($authUser->role === 'membre') {
                if ($reunion->type === 'structure') {
                    $userStructure = AssignStructure::where('user_id', $authUser->id)
                        ->where('structure_id', $reunion->structure_id)
                        ->where('is_active', true)
                        ->exists();

                    if (!$userStructure) {
                        return $this->errorResponse(
                            'Accès refusé.',
                            ['error' => 'Vous ne pouvez consulter que les réunions générales ou de vos structures actives.'],
                            403
                        );
                    }
                }
            }

            $reunion->load([
                'structure',
                'createdBy:id,full_name',
                'updatedBy:id,full_name',
            ]);

            $pv = is_array($reunion->proces_verbal) ? array_values(array_filter(array_map('trim', $reunion->proces_verbal))) : [];

            if ($reunion->status !== 'completed' || count($pv) === 0) {
                return $this->errorResponse(
                    'Procès-verbal indisponible.',
                    ['error' => 'Le procès-verbal n\'est disponible que pour les réunions terminées.'],
                    400
                );
            }

            $appName = config('app.name', 'Gestion Syndicale');
            $typeLabel = $reunion->type === 'generale' ? 'Réunion générale' : 'Réunion de structure';
            $structure = $reunion->type === 'structure' ? $reunion->structure : null;

            $dateReunion = $reunion->date_reunion ? $reunion->date_reunion->format('d/m/Y') : '';
            $dateReunionForFilename = $reunion->date_reunion ? $reunion->date_reunion->format('Y-m-d') : null;
            $heureDebut = substr((string) $reunion->heure_debut, 0, 5);
            $heureFin = substr((string) $reunion->heure_fin, 0, 5);
            $lieu = $reunion->lieu ?: 'À définir';

            $points = is_array($reunion->points_reunion) ? array_values(array_filter(array_map('trim', $reunion->points_reunion))) : [];

            $escape = fn($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

            $writer = $reunion->updatedBy ?: $reunion->createdBy;
            $writerName = $writer?->full_name ?: '—';
            $writerStatut = null;
            if ($writer) {
                $writerStatut = AssignStatut::query()
                    ->where('user_id', $writer->id)
                    ->where('is_active', true)
                    ->with(['statut:id,libelle'])
                    ->first()
                    ?->statut
                    ?->libelle;
            }

            $logoDataUri = null;
            $logoPath = public_path('images/logo.png');
            if (is_string($logoPath) && file_exists($logoPath)) {
                $logoCacheKey = 'pv_logo_data_uri:' . (string) @filemtime($logoPath);
                $logoDataUri = Cache::rememberForever($logoCacheKey, function () use ($logoPath) {
                    $logoBinary = @file_get_contents($logoPath);
                    if ($logoBinary === false) return null;
                    return 'data:image/png;base64,' . base64_encode($logoBinary);
                });
            }

            $pvHtml = '';
            foreach ($pv as $line) {
                $pvHtml .= '<li>' . $escape($line) . '</li>';
            }

            $pointsHtml = '';
            foreach ($points as $line) {
                $pointsHtml .= '<li>' . $escape($line) . '</li>';
            }

            $structureBlock = '';
            if ($structure) {
                $structureBlock = '
                    <div class="box">
                        <div class="box-title">Structure</div>
                        <div class="kv">
                            <div><span class="k">Nom:</span> <span class="v">' . $escape($structure->libelle) . '</span></div>
                            <div><span class="k">Adresse:</span> <span class="v">' . $escape($structure->adresse ?: '-') . '</span></div>
                            <div><span class="k">Contact:</span> <span class="v">' . $escape($structure->contact ?: '-') . '</span></div>
                            <div><span class="k">Email:</span> <span class="v">' . $escape($structure->email ?: '-') . '</span></div>
                        </div>
                    </div>
                ';
            }

            $headerLogoHtml = $logoDataUri
                ? '<img class="logo" src="' . $escape($logoDataUri) . '" alt="Logo" />'
                : '<div class="logo-fallback"></div>';

            $writerLine = 'Rédigé par: ' . $escape($writerName) . ($writerStatut ? ' — ' . $escape($writerStatut) : '');

            $html = '
                <!doctype html>
                <html lang="fr">
                <head>
                    <meta charset="utf-8">
                    <style>
                        * { box-sizing: border-box; }
                        @page { margin: 36px 40px 70px; }
                        body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 12px; color: #0f172a; }
                        .watermark { position: fixed; top: 38%; left: 50%; transform: translate(-50%, -50%) rotate(-28deg); font-size: 74px; font-weight: 800; color: #0f172a; opacity: 0.06; white-space: nowrap; }
                        .header { border-bottom: 3px solid #135796; padding-bottom: 12px; margin-bottom: 18px; }
                        .header-table { width: 100%; border-collapse: collapse; }
                        .header-left { width: 72px; vertical-align: top; }
                        .header-mid { vertical-align: top; }
                        .header-right { width: 160px; vertical-align: top; text-align: right; }
                        .logo { width: 64px; height: 64px; border-radius: 12px; }
                        .logo-fallback { width: 64px; height: 64px; border-radius: 12px; background: #e2e8f0; }
                        .brand { font-size: 15px; font-weight: 800; letter-spacing: 0.2px; }
                        .subtitle { color: #475569; margin-top: 3px; font-size: 11px; }
                        .doc-title { margin-top: 8px; font-size: 18px; font-weight: 900; color: #0b2b4a; }
                        .meta { margin-top: 6px; color: #475569; font-size: 11px; }
                        .chip { display: inline-block; padding: 4px 8px; border-radius: 999px; background: #eef2ff; color: #1e3a8a; font-size: 10px; font-weight: 700; }
                        .title { font-size: 16px; font-weight: 800; margin: 12px 0 6px; }
                        .muted { color: #64748b; }
                        .grid { width: 100%; margin-top: 12px; }
                        .row { width: 100%; margin-bottom: 8px; }
                        .box { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-top: 12px; }
                        .box-title { font-weight: 700; color: #0f172a; margin-bottom: 8px; }
                        .kv { line-height: 1.7; }
                        .k { color: #64748b; display: inline-block; min-width: 70px; }
                        .v { color: #0f172a; }
                        ul { margin: 8px 0 0; padding-left: 18px; }
                        li { margin: 4px 0; }
                        .section-title { font-size: 13px; font-weight: 800; margin: 14px 0 8px; color: #0f172a; }
                        .signature { margin-top: 48px; width: 100%; }
                        .sig-title { font-weight: 700; margin-bottom: 44px; }
                        .sig-line { border-top: 1px solid #0f172a; width: 260px; }
                        .footer { position: fixed; bottom: 20px; left: 40px; right: 40px; font-size: 10px; color: #94a3b8; }
                    </style>
                </head>
                <body>
                    <div class="watermark">PROCÈS-VERBAL</div>
                    <div class="header">
                        <table class="header-table">
                            <tr>
                                <td class="header-left">
                                    ' . $headerLogoHtml . '
                                </td>
                                <td class="header-mid">
                                    <div class="brand">' . $escape($appName) . '</div>
                                    <div class="subtitle">Document officiel — Procès-verbal de réunion</div>
                                    <div class="doc-title">' . $escape($reunion->libelle) . '</div>
                                    <div class="meta">' . $escape($typeLabel) . ' • ' . $escape($dateReunion) . ' • ' . $escape($heureDebut) . ' - ' . $escape($heureFin) . '</div>
                                    <div class="meta">' . $escape($writerLine) . '</div>
                                </td>
                                <td class="header-right">
                                    <div class="chip">PV — ' . $escape($reunion->status === 'completed' ? 'TERMINÉE' : strtoupper((string) $reunion->status)) . '</div>
                                    <div class="meta" style="margin-top:10px;">Lieu: ' . $escape($lieu) . '</div>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div class="box">
                        <div class="box-title">Informations</div>
                        <div class="kv">
                            <div><span class="k">Date:</span> <span class="v">' . $escape($dateReunion) . '</span></div>
                            <div><span class="k">Heure:</span> <span class="v">' . $escape($heureDebut) . ' - ' . $escape($heureFin) . '</span></div>
                            <div><span class="k">Lieu:</span> <span class="v">' . $escape($lieu) . '</span></div>
                            <div><span class="k">Rédacteur:</span> <span class="v">' . $escape($writerName) . ($writerStatut ? ' — ' . $escape($writerStatut) : '') . '</span></div>
                        </div>
                    </div>

                    ' . $structureBlock . '

                    <div class="section-title">Ordre du jour</div>
                    <div class="box">
                        ' . (count($points) ? '<ul>' . $pointsHtml . '</ul>' : '<div class="muted">-</div>') . '
                    </div>

                    <div class="section-title">Procès-verbal</div>
                    <div class="box">
                        <ul>' . $pvHtml . '</ul>
                    </div>

                    <div class="signature">
                        <div class="sig-title">Le Président</div>
                        <div class="sig-line"></div>
                    </div>

                    <div class="footer">
                        Document généré le ' . $escape(now()->format('d/m/Y H:i')) . '
                    </div>
                </body>
                </html>
            ';

            $filename = 'PV_' . Str::slug($reunion->libelle ?: 'reunion') . '_' . ($dateReunionForFilename ?: $reunion->id) . '.pdf';

            $cacheKey = 'pv_pdf:' . $reunion->id . ':' . ($reunion->updated_at?->timestamp ?? 0);

            $pdfBinary = Cache::remember($cacheKey, now()->addHours(6), function () use ($html) {
                return Pdf::loadHTML($html)->setPaper('a4')->output();
            });

            return response()->streamDownload(function () use ($pdfBinary) {
                echo $pdfBinary;
            }, $filename, [
                'Content-Type' => 'application/pdf',
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Erreur lors de la génération du PDF.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }
}
