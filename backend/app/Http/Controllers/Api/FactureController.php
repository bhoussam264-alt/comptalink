<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alerte;
use App\Models\Facture;
use App\Models\PieceJustificative;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * FactureController : gestion complète des factures fournisseurs.
 *
 * Contient également la logique de contrôle automatique (détection de risques).
 */
class FactureController extends Controller
{
    /**
     * Relations chargées systématiquement pour l'affichage d'une facture.
     *
     * @var array<int, string>
     */
    private const RELATIONS = [
        'fournisseur',
        'responsable',
        'alertes',
        'piecesJustificatives',
        'validations.user',
    ];

    /**
     * Liste des factures avec filtres optionnels.
     *
     * Filtres : statut, recherche (numéro ou nom du fournisseur), fournisseur_id.
     */
    public function index(Request $request): JsonResponse
    {
        $requete = Facture::with(self::RELATIONS)->latest('created_at');

        // Filtre par statut
        if ($request->filled('statut')) {
            $requete->where('statut', $request->query('statut'));
        }

        // Filtre par fournisseur
        if ($request->filled('fournisseur_id')) {
            $requete->where('fournisseur_id', $request->query('fournisseur_id'));
        }

        // Recherche libre sur le numéro de facture OU le nom du fournisseur
        if ($request->filled('recherche')) {
            $recherche = $request->query('recherche');
            $requete->where(function ($q) use ($recherche) {
                $q->where('numero', 'like', '%'.$recherche.'%')
                    ->orWhereHas('fournisseur', function ($sq) use ($recherche) {
                        $sq->where('nom', 'like', '%'.$recherche.'%');
                    });
            });
        }

        return response()->json($requete->get());
    }

    /**
     * Création d'une facture puis exécution des contrôles automatiques.
     */
    public function store(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'numero' => ['required', 'string', 'max:255'],
            'date_facture' => ['required', 'date'],
            'date_echeance' => ['required', 'date'],
            'montant_HT' => ['required', 'numeric'],
            'tva' => ['required', 'numeric'],
            'montant_TTC' => ['required', 'numeric'],
            'fournisseur_id' => ['required', 'exists:fournisseurs,id'],
            'user_id' => ['nullable', 'exists:users,id'],
            'source' => ['nullable', 'string', 'max:255'],
            'fichier' => ['nullable', 'string', 'max:255'],
            'statut' => ['nullable', 'string', 'in:'.implode(',', Facture::STATUTS)],
        ]);

        // Statut par défaut : 'À vérifier' si la facture provient de l'OCR, sinon 'Reçue'
        if (empty($donnees['statut'])) {
            $donnees['statut'] = ($request->input('source') === 'ocr')
                ? Facture::STATUT_A_VERIFIER
                : Facture::STATUT_RECUE;
        }

        $facture = Facture::create($donnees);

        // Analyse de la facture : génération des alertes de risque
        $this->controlerFacture($facture);

        return response()->json($facture->load(self::RELATIONS), 201);
    }

    /**
     * Détail complet d'une facture.
     */
    public function show(Facture $facture): JsonResponse
    {
        return response()->json($facture->load(self::RELATIONS));
    }

    /**
     * Mise à jour d'une facture puis relance des contrôles.
     */
    public function update(Request $request, Facture $facture): JsonResponse
    {
        $donnees = $request->validate([
            'numero' => ['sometimes', 'required', 'string', 'max:255'],
            'date_facture' => ['sometimes', 'required', 'date'],
            'date_echeance' => ['sometimes', 'required', 'date'],
            'montant_HT' => ['sometimes', 'required', 'numeric'],
            'tva' => ['sometimes', 'required', 'numeric'],
            'montant_TTC' => ['sometimes', 'required', 'numeric'],
            'fournisseur_id' => ['sometimes', 'required', 'exists:fournisseurs,id'],
            'user_id' => ['nullable', 'exists:users,id'],
            'source' => ['nullable', 'string', 'max:255'],
            'fichier' => ['nullable', 'string', 'max:255'],
            'statut' => ['nullable', 'string', 'in:'.implode(',', Facture::STATUTS)],
        ]);

        $facture->update($donnees);

        // Les données ont changé : on relance l'analyse
        $this->controlerFacture($facture);

        return response()->json($facture->load(self::RELATIONS));
    }

    /**
     * Suppression d'une facture.
     */
    public function destroy(Facture $facture): JsonResponse
    {
        $facture->delete();

        return response()->json(['message' => 'Facture supprimée.']);
    }

    /**
     * Change le statut d'une facture (contrôle de la valeur autorisée).
     */
    public function changerStatut(Request $request, Facture $facture): JsonResponse
    {
        $donnees = $request->validate([
            'statut' => ['required', 'string', 'in:'.implode(',', Facture::STATUTS)],
        ]);

        $facture->update(['statut' => $donnees['statut']]);

        return response()->json($facture->load(self::RELATIONS));
    }

    /**
     * Assigne un responsable à une facture.
     *
     * Si la facture est 'Reçue' ou 'À vérifier', elle passe automatiquement 'En validation'.
     */
    public function assigner(Request $request, Facture $facture): JsonResponse
    {
        $donnees = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        $facture->user_id = $donnees['user_id'];

        // Passage automatique en validation si la facture n'était pas encore traitée
        if (in_array($facture->statut, [Facture::STATUT_RECUE, Facture::STATUT_A_VERIFIER], true)) {
            $facture->statut = Facture::STATUT_EN_VALIDATION;
        }

        $facture->save();

        return response()->json($facture->load(self::RELATIONS));
    }

    /**
     * Marque une alerte comme ignorée.
     */
    public function ignorerAlerte(Request $request, Facture $facture): JsonResponse
    {
        $donnees = $request->validate([
            'alerte_id' => ['required', 'exists:alertes,id'],
        ]);

        // On s'assure que l'alerte appartient bien à cette facture
        $alerte = Alerte::where('id', $donnees['alerte_id'])
            ->where('facture_id', $facture->id)
            ->firstOrFail();

        $alerte->update(['ignoree' => true]);

        return response()->json($alerte);
    }

    /**
     * SIMULATION d'un transfert de facture par email.
     *
     * NOTE : aucun email n'est réellement envoyé. Cette méthode illustre
     * l'intégration future avec un serveur SMTP / une passerelle mail.
     */
    public function transfererEmail(Facture $facture): JsonResponse
    {
        return response()->json([
            'message' => "Simulation : la facture n° {$facture->numero} a été transférée par email au service comptable.",
        ]);
    }

    /**
     * Ajoute une pièce justificative à une facture.
     *
     * Le fichier est stocké sur le disque 'public' dans le dossier pieces_justificatives/.
     */
    public function uploadPieceJustificative(Request $request, Facture $facture): JsonResponse
    {
        $donnees = $request->validate([
            'fichier' => ['required', 'file', 'max:10240'], // 10 Mo max
        ]);

        // Stockage du fichier uploadé et récupération de son chemin
        $chemin = Storage::disk('public')->putFile('pieces_justificatives', $donnees['fichier']);

        $piece = PieceJustificative::create([
            'nom_fichier' => $donnees['fichier']->getClientOriginalName(),
            'chemin' => $chemin,
            'facture_id' => $facture->id,
        ]);

        return response()->json($piece, 201);
    }

    /**
     * Contrôle automatique d'une facture : génère les alertes de risque.
     *
     * IMPORTANT : ces alertes sont des RISQUES (indices) et non des certitudes.
     * Elles visent à attirer l'attention du comptable, qui reste seul décisionnaire.
     *
     * À chaque exécution, on supprime les alertes NON ignorées, puis on les régénère.
     * On conserve donc les alertes que l'utilisateur a explicitement ignorées.
     */
    private function controlerFacture(Facture $facture): void
    {
        // 1) Nettoyage des alertes non ignorées (les alertes ignorées sont préservées)
        $facture->alertes()->where('ignoree', false)->delete();

        // 2) Règle 1 - Cohérence TVA : montant_HT + tva doit être égal à montant_TTC (tolérance 0.01)
        $montantHT = (float) $facture->montant_HT;
        $tva = (float) $facture->tva;
        $montantTTC = (float) $facture->montant_TTC;
        $ecart = abs(($montantHT + $tva) - $montantTTC);

        if ($ecart > 0.01) {
            Alerte::create([
                'type' => 'TVA incohérente',
                'niveau' => 'rouge',
                'message' => sprintf(
                    "Incohérence constatée : HT (%s) + TVA (%s) = %s, alors que le TTC saisi est %s (écart de %s).",
                    number_format($montantHT, 2, ',', ' '),
                    number_format($tva, 2, ',', ' '),
                    number_format($montantHT + $tva, 2, ',', ' '),
                    number_format($montantTTC, 2, ',', ' '),
                    number_format($ecart, 2, ',', ' ')
                ),
                'facture_id' => $facture->id,
            ]);
        }

        // 3) Règle 2 - Doublon : même fournisseur + même numéro + même montant TTC
        $doublon = Facture::where('id', '!=', $facture->id)
            ->where('fournisseur_id', $facture->fournisseur_id)
            ->where('numero', $facture->numero)
            ->where('montant_TTC', $facture->montant_TTC)
            ->first();

        if ($doublon) {
            Alerte::create([
                'type' => 'Doublon',
                'niveau' => 'orange',
                'message' => "Doublon potentiel : une facture identique existe déjà (n° {$doublon->numero}).",
                'facture_id' => $facture->id,
                'facture_concernee_id' => $doublon->id,
            ]);
        }

        // 4) Règle 3 - Champs manquants / nuls
        $champsManquants = [];

        if (empty($facture->numero)) {
            $champsManquants[] = 'numéro';
        }
        if (empty($facture->date_facture)) {
            $champsManquants[] = 'date de facture';
        }
        if (empty($facture->date_echeance)) {
            $champsManquants[] = 'date d\'échéance';
        }
        if ($facture->montant_HT === null || (float) $facture->montant_HT == 0.0) {
            $champsManquants[] = 'montant HT';
        }
        if ($facture->tva === null) {
            $champsManquants[] = 'TVA';
        }
        if ($facture->montant_TTC === null || (float) $facture->montant_TTC == 0.0) {
            $champsManquants[] = 'montant TTC';
        }

        if (! empty($champsManquants)) {
            Alerte::create([
                'type' => 'Champ manquant',
                'niveau' => 'jaune',
                'message' => 'Champs manquants ou nuls : '.implode(', ', $champsManquants).'.',
                'facture_id' => $facture->id,
            ]);
        }
    }
}
