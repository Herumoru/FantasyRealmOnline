<?php
/**
 * Logique métier des avis déposés sur les personnages.
 */

declare(strict_types=1);

final class CommentaireController
{
    public function __construct(
        private CommentaireRepository $commentaires,
        private PersonnageRepository $personnages,
        private LogRepository $logs
    ) {
    }

    public function create(int $personnageId): void
    {
        $session = requireAuth();

        $personnage = $this->personnages->findById($personnageId);
        if ($personnage === null) {
            jsonError('Personnage introuvable.', 404);
        }

        $body = getJsonBody();
        $note = (int) ($body['note'] ?? 0);
        $texte = trim((string) ($body['commentaire'] ?? ''));

        if ($note < 1 || $note > 5) {
            jsonError('La note doit être comprise entre 1 et 5.', 422);
        }
        if ($texte === '') {
            jsonError('Le commentaire ne peut pas être vide.', 422);
        }

        $id = $this->commentaires->create($personnageId, $note, $texte, $session['pseudo']);
        $this->logs->add('Dépôt d\'avis', "{$session['pseudo']} a déposé un avis sur « {$personnage['nom']} ».", $session['pseudo']);

        jsonResponse(['id' => $id, 'message' => 'Votre avis a été soumis et sera visible après validation.'], 201);
    }

    public function pending(): void
    {
        requireRole(['employe', 'admin']);
        jsonResponse(['commentaires' => $this->commentaires->listPending()]);
    }

    public function moderate(int $id): void
    {
        $session = requireRole(['employe', 'admin']);
        $commentaire = $this->commentaires->findById($id);
        if ($commentaire === null) {
            jsonError('Avis introuvable.', 404);
        }

        $body = getJsonBody();
        $action = (string) ($body['action'] ?? '');

        if ($action === 'approve') {
            $this->commentaires->setStatut($id, 'approuve');
            $personnage = $this->personnages->findById((int) $commentaire['id_personnage']);
            $this->logs->add('Validation d\'avis', "{$session['pseudo']} a approuvé un avis de {$commentaire['pseudo_auteur']}.", $session['pseudo']);
            $owner = $personnage['proprietaire'] ?? '';
            jsonResponse(['message' => "Avis approuvé. E-mail envoyé à {$owner} (simulation)."]);
        }

        if ($action === 'reject') {
            $this->commentaires->setStatut($id, 'refuse');
            $this->logs->add('Refus d\'avis', "{$session['pseudo']} a refusé un avis de {$commentaire['pseudo_auteur']}.", $session['pseudo']);
            jsonResponse(['message' => 'Avis refusé.']);
        }

        jsonError('Action inconnue (attendu : approve ou reject).', 422);
    }
}
