<?php
/**
 * Logique métier des personnages : liste publique, détail, création,
 * modification, partage, duplication, équipement, modération.
 */

declare(strict_types=1);

final class PersonnageController
{
    private const TRAITS_REQUIRED = [
        'nom', 'genre', 'couleur_peau', 'couleur_yeux', 'couleur_cheveux',
        'forme_yeux', 'forme_nez', 'forme_bouche',
    ];

    private const SINGLE_SLOT_TYPES = ['arme', 'armure', 'vetement'];

    public function __construct(
        private PersonnageRepository $personnages,
        private ArticleRepository $articles,
        private CommentaireRepository $commentaires,
        private LogRepository $logs
    ) {
    }

    public function list(): void
    {
        $filters = [
            'genre' => $_GET['genre'] ?? null,
            'pseudo' => $_GET['pseudo'] ?? null,
            'date_from' => $_GET['date_from'] ?? null,
            'date_to' => $_GET['date_to'] ?? null,
        ];
        jsonResponse(['personnages' => $this->personnages->listPublic($filters)]);
    }

    public function mine(): void
    {
        $session = requireAuth();
        jsonResponse(['personnages' => $this->personnages->listByOwner($session['id'])]);
    }

    public function detail(int $id): void
    {
        $personnage = $this->personnages->findById($id);
        if ($personnage === null) {
            jsonError('Personnage introuvable.', 404);
        }

        $personnage['equipement'] = $this->personnages->getEquippedArticles($id);
        $personnage['avis'] = $this->commentaires->listApprovedFor($id);

        jsonResponse(['personnage' => $personnage]);
    }

    private function validateTraits(array $body): array
    {
        foreach (self::TRAITS_REQUIRED as $field) {
            if (empty($body[$field])) {
                jsonError("Le champ '{$field}' est obligatoire.", 422);
            }
        }
        if (mb_strlen((string) $body['nom']) < 2) {
            jsonError('Le nom doit contenir au moins 2 caractères.', 422);
        }
        return $body;
    }

    public function create(): void
    {
        $session = requireAuth();
        $body = $this->validateTraits(getJsonBody());

        if ($this->personnages->findByNom($body['nom']) !== null) {
            jsonError('Ce nom de personnage est déjà utilisé.', 409);
        }

        $id = $this->personnages->create($body, $session['id']);
        $this->logs->add('Création de personnage', "{$session['pseudo']} a créé « {$body['nom']} » (nom en attente de validation).", $session['pseudo']);

        jsonResponse(['id' => $id], 201);
    }

    private function assertOwnership(array $personnage, array $session): void
    {
        if ((int) $personnage['id_utilisateur'] !== (int) $session['id']) {
            jsonError('Ce personnage ne vous appartient pas.', 403);
        }
    }

    public function update(int $id): void
    {
        $session = requireAuth();
        $existing = $this->personnages->findById($id);
        if ($existing === null) {
            jsonError('Personnage introuvable.', 404);
        }
        $this->assertOwnership($existing, $session);

        $body = $this->validateTraits(getJsonBody());

        $conflict = $this->personnages->findByNom($body['nom'], $id);
        if ($conflict !== null) {
            jsonError('Ce nom est déjà utilisé par un autre personnage.', 409);
        }

        $nameChanged = strcasecmp($existing['nom'], $body['nom']) !== 0;
        $body['autorise'] = $nameChanged ? false : (bool) $existing['autorise'];
        $body['partage'] = $nameChanged ? false : (bool) $existing['partage'];

        $this->personnages->updateTraits($id, $body);
        $this->logs->add('Modification de personnage', "{$session['pseudo']} a modifié les traits de « {$body['nom']} ».", $session['pseudo']);

        jsonResponse(['message' => 'Personnage mis à jour.', 'autorise' => $body['autorise']]);
    }

    public function delete(int $id): void
    {
        $session = requireAuth();
        $personnage = $this->personnages->findById($id);
        if ($personnage === null) {
            jsonError('Personnage introuvable.', 404);
        }

        $isOwner = (int) $personnage['id_utilisateur'] === (int) $session['id'];
        $isStaff = in_array($session['role'], ['employe', 'admin'], true);
        if (!$isOwner && !$isStaff) {
            jsonError('Action non autorisée.', 403);
        }

        $this->personnages->delete($id);
        $this->logs->add('Suppression de personnage', "{$session['pseudo']} a supprimé « {$personnage['nom']} ».", $session['pseudo']);

        jsonResponse(['message' => 'Personnage supprimé.']);
    }

    public function share(int $id): void
    {
        $session = requireAuth();
        $personnage = $this->personnages->findById($id);
        if ($personnage === null) {
            jsonError('Personnage introuvable.', 404);
        }
        $this->assertOwnership($personnage, $session);

        if (!(bool) $personnage['autorise']) {
            jsonError('Ce personnage doit d\'abord être validé avant de pouvoir être partagé.', 409);
        }

        $newState = !(bool) $personnage['partage'];
        $this->personnages->setPartage($id, $newState);
        $this->logs->add('Partage de personnage', "{$session['pseudo']} a " . ($newState ? 'partagé' : 'retiré le partage de') . " « {$personnage['nom']} ».", $session['pseudo']);

        jsonResponse(['partage' => $newState]);
    }

    public function duplicate(int $id): void
    {
        $session = requireAuth();
        $personnage = $this->personnages->findById($id);
        if ($personnage === null) {
            jsonError('Personnage introuvable.', 404);
        }
        $this->assertOwnership($personnage, $session);

        $body = getJsonBody();
        $newName = trim((string) ($body['nom'] ?? ''));
        if (mb_strlen($newName) < 2) {
            jsonError('Le nouveau nom doit contenir au moins 2 caractères.', 422);
        }
        if ($this->personnages->findByNom($newName) !== null) {
            jsonError('Ce nom est déjà utilisé.', 409);
        }

        $newId = $this->personnages->duplicate($id, $newName);
        $this->logs->add('Duplication de personnage', "{$session['pseudo']} a dupliqué « {$personnage['nom']} » en « {$newName} ».", $session['pseudo']);

        jsonResponse(['id' => $newId], 201);
    }

    public function equip(int $id): void
    {
        $session = requireAuth();
        $personnage = $this->personnages->findById($id);
        if ($personnage === null) {
            jsonError('Personnage introuvable.', 404);
        }
        $this->assertOwnership($personnage, $session);

        if (!(bool) $personnage['autorise']) {
            jsonError('L\'équipement n\'est disponible qu\'après validation du nom.', 409);
        }

        $body = getJsonBody();
        $articleId = (int) ($body['article_id'] ?? 0);
        $action = (string) ($body['action'] ?? 'equip');

        $article = $this->articles->findById($articleId);
        if ($article === null || !(bool) $article['actif']) {
            jsonError('Article introuvable ou indisponible.', 404);
        }

        if ($action === 'unequip') {
            $this->personnages->unequipArticle($id, $articleId);
            $this->logs->add('Équipement', "{$session['pseudo']} a retiré « {$article['nom']} » de « {$personnage['nom']} ».", $session['pseudo']);
            jsonResponse(['message' => 'Article retiré.']);
        }

        // Emplacement unique pour arme/armure/vêtement : on retire l'ancien article du même type.
        if (in_array($article['type'], self::SINGLE_SLOT_TYPES, true)) {
            $currentlyEquipped = $this->personnages->getEquippedArticles($id);
            foreach ($currentlyEquipped as $equipped) {
                if ($equipped['type'] === $article['type']) {
                    $this->personnages->unequipArticle($id, (int) $equipped['id_article']);
                }
            }
        }

        $this->personnages->equipArticle($id, $articleId);
        $this->logs->add('Équipement', "{$session['pseudo']} a équipé « {$article['nom']} » sur « {$personnage['nom']} ».", $session['pseudo']);

        jsonResponse(['message' => 'Article équipé.']);
    }

    public function pendingValidation(): void
    {
        requireRole(['employe', 'admin']);
        jsonResponse(['personnages' => $this->personnages->listPendingValidation()]);
    }

    public function moderate(int $id): void
    {
        $session = requireRole(['employe', 'admin']);
        $personnage = $this->personnages->findById($id);
        if ($personnage === null) {
            jsonError('Personnage introuvable.', 404);
        }

        $body = getJsonBody();
        $action = (string) ($body['action'] ?? '');

        if ($action === 'approve') {
            $this->personnages->setAutorise($id, true);
            $this->logs->add('Validation de nom', "{$session['pseudo']} a approuvé le nom « {$personnage['nom']} ».", $session['pseudo']);
            jsonResponse(['message' => "Nom approuvé. E-mail envoyé à {$personnage['proprietaire']} (simulation)."]);
        }

        if ($action === 'reject') {
            $motif = trim((string) ($body['motif'] ?? ''));
            if ($motif === '') {
                jsonError('Un motif est obligatoire en cas de rejet.', 422);
            }
            $this->personnages->delete($id);
            $this->logs->add('Rejet de nom', "{$session['pseudo']} a rejeté et supprimé « {$personnage['nom']} ». Motif : {$motif}", $session['pseudo']);
            jsonResponse(['message' => "Personnage rejeté et supprimé. E-mail avec motif envoyé à {$personnage['proprietaire']} (simulation)."]);
        }

        jsonError('Action inconnue (attendu : approve ou reject).', 422);
    }
}
