<?php
/**
 * Accès aux données pour la table commentaire (avis déposés sur un personnage).
 */

declare(strict_types=1);

final class CommentaireRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function listApprovedFor(int $personnageId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM commentaire
             WHERE id_personnage = :id AND statut = "approuve"
             ORDER BY date_commentaire DESC'
        );
        $stmt->execute(['id' => $personnageId]);
        return $stmt->fetchAll();
    }

    public function listPending(): array
    {
        $stmt = $this->pdo->query(
            'SELECT c.*, p.nom AS personnage_nom, p.id_utilisateur AS proprietaire_id
             FROM commentaire c
             JOIN personnage p ON p.id_personnage = c.id_personnage
             WHERE c.statut = "attente"
             ORDER BY c.date_commentaire ASC'
        );
        return $stmt->fetchAll();
    }

    public function create(int $personnageId, int $note, string $commentaire, string $pseudoAuteur): int
    {
        if ($note < 1 || $note > 5) {
            throw new InvalidArgumentException('La note doit être comprise entre 1 et 5.');
        }

        $stmt = $this->pdo->prepare(
            'INSERT INTO commentaire (id_personnage, note, commentaire, pseudo_auteur, statut)
             VALUES (:pid, :note, :texte, :pseudo, "attente")'
        );
        $stmt->execute([
            'pid' => $personnageId,
            'note' => $note,
            'texte' => $commentaire,
            'pseudo' => $pseudoAuteur,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM commentaire WHERE id_commentaire = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function setStatut(int $id, string $statut): void
    {
        $stmt = $this->pdo->prepare('UPDATE commentaire SET statut = :s WHERE id_commentaire = :id');
        $stmt->execute(['s' => $statut, 'id' => $id]);
    }
}
