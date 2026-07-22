<?php
/**
 * Logique métier de la bibliothèque d'articles (accessoires de personnalisation).
 */

declare(strict_types=1);

final class ArticleController
{
    private const VALID_TYPES = ['arme', 'armure', 'vetement', 'accessoire'];

    public function __construct(
        private ArticleRepository $articles,
        private LogRepository $logs
    ) {
    }

    /** Catalogue public : uniquement les articles actifs (utilisé par l'espace utilisateur). */
    public function listActive(): void
    {
        jsonResponse(['articles' => $this->articles->listActive()]);
    }

    /** Catalogue complet, réservé au back-office (inclut les articles désactivés). */
    public function listAll(): void
    {
        requireRole(['employe', 'admin']);
        jsonResponse(['articles' => $this->articles->listAll()]);
    }

    public function create(): void
    {
        $session = requireRole(['employe', 'admin']);
        $body = getJsonBody();
        $nom = trim((string) ($body['nom'] ?? ''));
        $type = (string) ($body['type'] ?? '');

        if ($nom === '') {
            jsonError('Le nom de l\'article est obligatoire.', 422);
        }
        if (!in_array($type, self::VALID_TYPES, true)) {
            jsonError('Type invalide (attendu : arme, armure, vetement ou accessoire).', 422);
        }

        $id = $this->articles->create($nom, $type);
        $this->logs->add('Ajout d\'article', "{$session['pseudo']} a ajouté « {$nom} » à la bibliothèque.", $session['pseudo']);

        jsonResponse(['id' => $id], 201);
    }

    public function toggle(int $id): void
    {
        $session = requireRole(['employe', 'admin']);
        $article = $this->articles->findById($id);
        if ($article === null) {
            jsonError('Article introuvable.', 404);
        }

        $newState = !(bool) $article['actif'];
        $this->articles->setActive($id, $newState);
        $this->logs->add('Modification d\'article', "{$session['pseudo']} a " . ($newState ? 'réactivé' : 'désactivé') . " « {$article['nom']} ».", $session['pseudo']);

        jsonResponse(['actif' => $newState]);
    }

    public function delete(int $id): void
    {
        $session = requireRole(['employe', 'admin']);
        $article = $this->articles->findById($id);
        if ($article === null) {
            jsonError('Article introuvable.', 404);
        }

        $this->articles->delete($id);
        $this->logs->add('Suppression d\'article', "{$session['pseudo']} a supprimé « {$article['nom']} » de la bibliothèque.", $session['pseudo']);

        jsonResponse(['message' => 'Article supprimé.']);
    }
}
