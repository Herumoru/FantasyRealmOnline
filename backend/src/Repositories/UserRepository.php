<?php
/**
 * Accès aux données pour la table utilisateur (+ jointure role).
 * Toutes les requêtes utilisent des requêtes préparées PDO (protection
 * contre les injections SQL).
 */

declare(strict_types=1);

final class UserRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    private function roleIdByLibelle(string $libelle): ?int
    {
        $stmt = $this->pdo->prepare('SELECT id_role FROM role WHERE libelle = :libelle');
        $stmt->execute(['libelle' => $libelle]);
        $row = $stmt->fetch();
        return $row ? (int) $row['id_role'] : null;
    }

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT u.*, r.libelle AS role
             FROM utilisateur u
             JOIN role r ON r.id_role = u.id_role
             WHERE u.mail = :mail'
        );
        $stmt->execute(['mail' => $email]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findByPseudo(string $pseudo): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT u.*, r.libelle AS role
             FROM utilisateur u
             JOIN role r ON r.id_role = u.id_role
             WHERE u.pseudo = :pseudo'
        );
        $stmt->execute(['pseudo' => $pseudo]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT u.*, r.libelle AS role
             FROM utilisateur u
             JOIN role r ON r.id_role = u.id_role
             WHERE u.id_utilisateur = :id'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function listByRole(string $roleLibelle): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT u.id_utilisateur, u.pseudo, u.mail, u.suspendu, u.date_inscription
             FROM utilisateur u
             JOIN role r ON r.id_role = u.id_role
             WHERE r.libelle = :role
             ORDER BY u.pseudo'
        );
        $stmt->execute(['role' => $roleLibelle]);
        return $stmt->fetchAll();
    }

    /**
     * Crée un utilisateur. Le mot de passe DOIT déjà être hashé
     * (password_hash) avant d'appeler cette méthode.
     */
    public function create(string $pseudo, string $mail, string $hashedPassword, string $roleLibelle = 'user'): int
    {
        $roleId = $this->roleIdByLibelle($roleLibelle);
        if ($roleId === null) {
            throw new RuntimeException("Rôle inconnu : {$roleLibelle}");
        }

        $stmt = $this->pdo->prepare(
            'INSERT INTO utilisateur (pseudo, mail, password, id_role)
             VALUES (:pseudo, :mail, :password, :id_role)'
        );
        $stmt->execute([
            'pseudo' => $pseudo,
            'mail' => $mail,
            'password' => $hashedPassword,
            'id_role' => $roleId,
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    public function updatePassword(int $id, string $hashedPassword, bool $mustChangeOnNextLogin = false): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE utilisateur
             SET password = :password, motdepasse_a_modifier = :must_change
             WHERE id_utilisateur = :id'
        );
        $stmt->execute([
            'password' => $hashedPassword,
            'must_change' => $mustChangeOnNextLogin ? 1 : 0,
            'id' => $id,
        ]);
    }

    public function setSuspended(int $id, bool $suspended): void
    {
        $stmt = $this->pdo->prepare('UPDATE utilisateur SET suspendu = :s WHERE id_utilisateur = :id');
        $stmt->execute(['s' => $suspended ? 1 : 0, 'id' => $id]);
    }

    public function delete(int $id): void
    {
        // Les personnages du joueur sont supprimés en cascade (contrainte FK ON DELETE CASCADE).
        $stmt = $this->pdo->prepare('DELETE FROM utilisateur WHERE id_utilisateur = :id');
        $stmt->execute(['id' => $id]);
    }
}
