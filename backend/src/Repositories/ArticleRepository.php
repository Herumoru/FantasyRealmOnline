<?php
/**
 * Accès aux données pour la table article (bibliothèque d'accessoires).
 */

declare(strict_types=1);

final class ArticleRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function listAll(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM article ORDER BY type, nom');
        return $stmt->fetchAll();
    }

    public function listActive(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM article WHERE actif = 1 ORDER BY type, nom');
        return $stmt->fetchAll();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM article WHERE id_article = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(string $nom, string $type): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO article (nom, type, actif) VALUES (:nom, :type, 1)'
        );
        $stmt->execute(['nom' => $nom, 'type' => $type]);
        return (int) $this->pdo->lastInsertId();
    }

    public function setActive(int $id, bool $active): void
    {
        $stmt = $this->pdo->prepare('UPDATE article SET actif = :a WHERE id_article = :id');
        $stmt->execute(['a' => $active ? 1 : 0, 'id' => $id]);
    }

    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM article WHERE id_article = :id');
        $stmt->execute(['id' => $id]);
    }
}
