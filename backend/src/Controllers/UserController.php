<?php
/**
 * Gestion des comptes joueurs (employé + admin) et des comptes employés (admin uniquement).
 */

declare(strict_types=1);

final class UserController
{
    public function __construct(
        private UserRepository $users,
        private PersonnageRepository $personnages,
        private LogRepository $logs
    ) {
    }

    // ---------- Comptes joueurs (accessible employé + admin) ----------

    public function listPlayers(): void
    {
        requireRole(['employe', 'admin']);
        jsonResponse(['utilisateurs' => $this->users->listByRole('user')]);
    }

    public function suspendPlayer(int $id): void
    {
        $session = requireRole(['employe', 'admin']);
        $user = $this->users->findById($id);
        if ($user === null || $user['role'] !== 'user') {
            jsonError('Compte joueur introuvable.', 404);
        }

        $newState = !(bool) $user['suspendu'];
        $this->users->setSuspended($id, $newState);
        $this->logs->add('Compte joueur', "{$session['pseudo']} a " . ($newState ? 'suspendu' : 'réactivé') . " le compte de {$user['pseudo']}.", $session['pseudo']);

        jsonResponse(['suspendu' => $newState]);
    }

    public function deletePlayer(int $id): void
    {
        $session = requireRole(['employe', 'admin']);
        $user = $this->users->findById($id);
        if ($user === null || $user['role'] !== 'user') {
            jsonError('Compte joueur introuvable.', 404);
        }

        // Les personnages du joueur sont supprimés en cascade (contrainte FK).
        $this->users->delete($id);
        $this->logs->add('Suppression de compte', "{$session['pseudo']} a supprimé le compte de {$user['pseudo']} et ses personnages.", $session['pseudo']);

        jsonResponse(['message' => 'Compte et personnages supprimés.']);
    }

    // ---------- Comptes employés (admin uniquement) ----------

    public function listEmployees(): void
    {
        requireRole(['admin']);
        jsonResponse(['employes' => $this->users->listByRole('employe')]);
    }

    public function createEmployee(): void
    {
        $session = requireRole(['admin']);
        $body = getJsonBody();
        $email = trim((string) ($body['email'] ?? ''));
        $pseudo = trim((string) ($body['pseudo'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        if (!isEmailValid($email)) {
            jsonError('Adresse e-mail invalide.', 422);
        }
        if ($this->users->findByEmail($email) !== null) {
            jsonError('Cette adresse e-mail est déjà utilisée.', 409);
        }
        if (mb_strlen($pseudo) < 3) {
            jsonError('Le pseudo doit contenir au moins 3 caractères.', 422);
        }
        if ($this->users->findByPseudo($pseudo) !== null) {
            jsonError('Ce pseudo est déjà pris.', 409);
        }
        if (!isPasswordSecure($password)) {
            jsonError('Mot de passe non conforme (8 car. min., majuscule, minuscule, chiffre, caractère spécial).', 422);
        }

        $hashed = password_hash($password, PASSWORD_DEFAULT);
        $id = $this->users->create($pseudo, $email, $hashed, 'employe');
        $this->logs->add('Création de compte employé', "{$session['pseudo']} a créé le compte employé de {$pseudo}.", $session['pseudo']);

        jsonResponse(['id' => $id], 201);
    }

    public function resetEmployeePassword(int $id): void
    {
        $session = requireRole(['admin']);
        $user = $this->users->findById($id);
        if ($user === null || $user['role'] !== 'employe') {
            jsonError('Compte employé introuvable.', 404);
        }

        $body = getJsonBody();
        $password = (string) ($body['password'] ?? '');
        if (!isPasswordSecure($password)) {
            jsonError('Mot de passe non conforme (8 car. min., majuscule, minuscule, chiffre, caractère spécial).', 422);
        }

        $hashed = password_hash($password, PASSWORD_DEFAULT);
        $this->users->updatePassword($id, $hashed, false);
        $this->logs->add('Modification de mot de passe', "{$session['pseudo']} a modifié le mot de passe de {$user['pseudo']}.", $session['pseudo']);

        jsonResponse(['message' => 'Mot de passe mis à jour.']);
    }

    public function suspendEmployee(int $id): void
    {
        $session = requireRole(['admin']);
        $user = $this->users->findById($id);
        if ($user === null || $user['role'] !== 'employe') {
            jsonError('Compte employé introuvable.', 404);
        }

        $newState = !(bool) $user['suspendu'];
        $this->users->setSuspended($id, $newState);
        $this->logs->add('Compte employé', "{$session['pseudo']} a " . ($newState ? 'suspendu' : 'réactivé') . " le compte employé de {$user['pseudo']}.", $session['pseudo']);

        jsonResponse(['suspendu' => $newState]);
    }

    public function deleteEmployee(int $id): void
    {
        $session = requireRole(['admin']);
        $user = $this->users->findById($id);
        if ($user === null || $user['role'] !== 'employe') {
            jsonError('Compte employé introuvable.', 404);
        }

        $this->users->delete($id);
        $this->logs->add('Suppression de compte employé', "{$session['pseudo']} a supprimé le compte employé de {$user['pseudo']}.", $session['pseudo']);

        jsonResponse(['message' => 'Compte employé supprimé.']);
    }
}
