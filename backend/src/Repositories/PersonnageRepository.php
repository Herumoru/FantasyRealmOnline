<?php
/**
 * Accès aux données pour la table personnage (+ jointures utilisateur/article).
 */

declare(strict_types=1);

final class PersonnageRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    /**
     * Liste publique : uniquement les personnages partagés ET dont le nom
     * a été validé par un employé, avec filtres optionnels.
     *
     * @param array{genre?:string, pseudo?:string, date_from?:string, date_to?:string} $filters
     */
    public function listPublic(array $filters = []): array
    {
        $sql = 'SELECT p.*, u.pseudo AS proprietaire
                FROM personnage p
                JOIN utilisateur u ON u.id_utilisateur = p.id_utilisateur
                WHERE p.partage = 1 AND p.autorise = 1';
        $params = [];

        if (!empty($filters['genre'])) {
            $sql .= ' AND p.genre = :genre';
            $params['genre'] = $filters['genre'];
        }
        if (!empty($filters['pseudo'])) {
            $sql .= ' AND u.pseudo LIKE :pseudo';
            $params['pseudo'] = '%' . $filters['pseudo'] . '%';
        }
        if (!empty($filters['date_from'])) {
            $sql .= ' AND p.date_creation >= :date_from';
            $params['date_from'] = $filters['date_from'];
        }
        if (!empty($filters['date_to'])) {
            $sql .= ' AND p.date_creation <= :date_to';
            $params['date_to'] = $filters['date_to'] . ' 23:59:59';
        }

        $sql .= ' ORDER BY p.date_creation DESC';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT p.*, u.pseudo AS proprietaire
             FROM personnage p
             JOIN utilisateur u ON u.id_utilisateur = p.id_utilisateur
             WHERE p.id_personnage = :id'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findByNom(string $nom, ?int $excludeId = null): ?array
    {
        $sql = 'SELECT * FROM personnage WHERE nom = :nom';
        $params = ['nom' => $nom];
        if ($excludeId !== null) {
            $sql .= ' AND id_personnage != :excluded';
            $params['excluded'] = $excludeId;
        }
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function listByOwner(int $ownerId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM personnage WHERE id_utilisateur = :id ORDER BY date_creation DESC'
        );
        $stmt->execute(['id' => $ownerId]);
        return $stmt->fetchAll();
    }

    public function listPendingValidation(): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT p.*, u.pseudo AS proprietaire
             FROM personnage p
             JOIN utilisateur u ON u.id_utilisateur = p.id_utilisateur
             WHERE p.autorise = 0
             ORDER BY p.date_creation ASC'
        );
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * @param array{nom:string, genre:string, couleur_peau:string, couleur_yeux:string,
     *              couleur_cheveux:string, forme_yeux:string, forme_nez:string,
     *              forme_bouche:string} $data
     */
    public function create(array $data, int $ownerId): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO personnage
                (nom, genre, couleur_peau, couleur_yeux, couleur_cheveux, forme_yeux, forme_nez, forme_bouche, id_utilisateur, partage, autorise)
             VALUES
                (:nom, :genre, :peau, :yeux, :cheveux, :fyeux, :fnez, :fbouche, :owner, 0, 0)'
        );
        $stmt->execute([
            'nom' => $data['nom'],
            'genre' => $data['genre'],
            'peau' => $data['couleur_peau'],
            'yeux' => $data['couleur_yeux'],
            'cheveux' => $data['couleur_cheveux'],
            'fyeux' => $data['forme_yeux'],
            'fnez' => $data['forme_nez'],
            'fbouche' => $data['forme_bouche'],
            'owner' => $ownerId,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    /**
     * Met à jour les traits d'un personnage. Si le nom change, le champ
     * `autorise` est remis à 0 (un nouveau nom doit être revalidé).
     */
    public function updateTraits(int $id, array $data): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE personnage
             SET nom = :nom, genre = :genre, couleur_peau = :peau, couleur_yeux = :yeux,
                 couleur_cheveux = :cheveux, forme_yeux = :fyeux, forme_nez = :fnez,
                 forme_bouche = :fbouche, autorise = :autorise, partage = :partage
             WHERE id_personnage = :id'
        );
        $stmt->execute([
            'nom' => $data['nom'],
            'genre' => $data['genre'],
            'peau' => $data['couleur_peau'],
            'yeux' => $data['couleur_yeux'],
            'cheveux' => $data['couleur_cheveux'],
            'fyeux' => $data['forme_yeux'],
            'fnez' => $data['forme_nez'],
            'fbouche' => $data['forme_bouche'],
            'autorise' => $data['autorise'] ? 1 : 0,
            'partage' => $data['partage'] ? 1 : 0,
            'id' => $id,
        ]);
    }

    public function setAutorise(int $id, bool $autorise): void
    {
        $stmt = $this->pdo->prepare('UPDATE personnage SET autorise = :a WHERE id_personnage = :id');
        $stmt->execute(['a' => $autorise ? 1 : 0, 'id' => $id]);
    }

    public function setPartage(int $id, bool $partage): void
    {
        $stmt = $this->pdo->prepare('UPDATE personnage SET partage = :p WHERE id_personnage = :id');
        $stmt->execute(['p' => $partage ? 1 : 0, 'id' => $id]);
    }

    public function delete(int $id): void
    {
        // Commentaires et liaisons d'équipement supprimés en cascade (FK ON DELETE CASCADE).
        $stmt = $this->pdo->prepare('DELETE FROM personnage WHERE id_personnage = :id');
        $stmt->execute(['id' => $id]);
    }

    public function duplicate(int $sourceId, string $newName): int
    {
        $source = $this->findById($sourceId);
        if ($source === null) {
            throw new RuntimeException('Personnage source introuvable.');
        }

        $newId = $this->create([
            'nom' => $newName,
            'genre' => $source['genre'],
            'couleur_peau' => $source['couleur_peau'],
            'couleur_yeux' => $source['couleur_yeux'],
            'couleur_cheveux' => $source['couleur_cheveux'],
            'forme_yeux' => $source['forme_yeux'],
            'forme_nez' => $source['forme_nez'],
            'forme_bouche' => $source['forme_bouche'],
        ], (int) $source['id_utilisateur']);

        // Duplique également l'équipement.
        $articleIds = $this->getEquippedArticleIds($sourceId);
        foreach ($articleIds as $articleId) {
            $this->equipArticle($newId, $articleId);
        }

        return $newId;
    }

    public function getEquippedArticleIds(int $personnageId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id_article FROM personnage_article WHERE id_personnage = :id'
        );
        $stmt->execute(['id' => $personnageId]);
        return array_map('intval', array_column($stmt->fetchAll(), 'id_article'));
    }

    public function getEquippedArticles(int $personnageId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT a.* FROM article a
             JOIN personnage_article pa ON pa.id_article = a.id_article
             WHERE pa.id_personnage = :id'
        );
        $stmt->execute(['id' => $personnageId]);
        return $stmt->fetchAll();
    }

    public function equipArticle(int $personnageId, int $articleId): void
    {
        $stmt = $this->pdo->prepare(
            'INSERT IGNORE INTO personnage_article (id_personnage, id_article) VALUES (:p, :a)'
        );
        $stmt->execute(['p' => $personnageId, 'a' => $articleId]);
    }

    public function unequipArticle(int $personnageId, int $articleId): void
    {
        $stmt = $this->pdo->prepare(
            'DELETE FROM personnage_article WHERE id_personnage = :p AND id_article = :a'
        );
        $stmt->execute(['p' => $personnageId, 'a' => $articleId]);
    }

    public function deleteAllByOwner(int $ownerId): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM personnage WHERE id_utilisateur = :id');
        $stmt->execute(['id' => $ownerId]);
    }
}
