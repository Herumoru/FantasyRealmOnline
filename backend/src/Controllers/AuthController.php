<?php
/**
 * Authentification : inscription, connexion, déconnexion, mot de passe oublié.
 */

declare(strict_types=1);

final class AuthController
{
    public function __construct(
        private UserRepository $users,
        private LogRepository $logs
    ) {
    }

    public function register(): void
    {
        $body = getJsonBody();
        $email = trim((string) ($body['email'] ?? ''));
        $pseudo = trim((string) ($body['pseudo'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        if (!isEmailValid($email)) {
            jsonError('Adresse e-mail invalide.', 422);
        }
        if ($this->users->findByEmail($email) !== null) {
            jsonError('Cette adresse e-mail est déjà associée à un compte.', 409);
        }
        if (mb_strlen($pseudo) < 3) {
            jsonError('Le pseudo doit contenir au moins 3 caractères.', 422);
        }
        if ($this->users->findByPseudo($pseudo) !== null) {
            jsonError('Ce pseudo est déjà pris.', 409);
        }
        if (!isPasswordSecure($password)) {
            jsonError('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.', 422);
        }

        $hashed = password_hash($password, PASSWORD_DEFAULT);
        $id = $this->users->create($pseudo, $email, $hashed, 'user');

        $this->logs->add('Inscription', "Nouveau compte joueur créé : {$pseudo}.", $pseudo);

        $_SESSION['user'] = ['id' => $id, 'pseudo' => $pseudo, 'email' => $email, 'role' => 'user'];
        jsonResponse(['user' => $_SESSION['user']], 201);
    }

    public function login(): void
    {
        $body = getJsonBody();
        $email = trim((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        $user = $this->users->findByEmail($email);

        if ($user === null || !password_verify($password, $user['password'])) {
            jsonError('Adresse e-mail ou mot de passe incorrect.', 401);
        }

        if ((bool) $user['suspendu']) {
            jsonError('Ce compte est suspendu. Contactez le support via la page Contact.', 403);
        }

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        session_regenerate_id(true);

        $_SESSION['user'] = [
            'id' => (int) $user['id_utilisateur'],
            'pseudo' => $user['pseudo'],
            'email' => $user['mail'],
            'role' => $user['role'],
            'must_change_password' => (bool) $user['motdepasse_a_modifier'],
        ];

        jsonResponse(['user' => $_SESSION['user']]);
    }

    public function logout(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $_SESSION = [];
        session_destroy();
        jsonResponse(['message' => 'Déconnecté.']);
    }

    public function me(): void
    {
        jsonResponse(['user' => currentSession()]);
    }

    public function forgotPassword(): void
    {
        $body = getJsonBody();
        $email = trim((string) ($body['email'] ?? ''));
        $pseudo = trim((string) ($body['pseudo'] ?? ''));

        $user = $this->users->findByEmail($email);

        if ($user === null || strcasecmp($user['pseudo'], $pseudo) !== 0) {
            jsonError('Aucun compte ne correspond à cette combinaison e-mail / pseudo.', 404);
        }

        $temporaryPassword = generateTemporaryPassword();
        $hashed = password_hash($temporaryPassword, PASSWORD_DEFAULT);
        $this->users->updatePassword((int) $user['id_utilisateur'], $hashed, true);

        // NOTE : l'envoi d'e-mail réel (PHPMailer/SMTP) est à brancher ici.
        // Le mot de passe temporaire est renvoyé dans la réponse uniquement
        // pour permettre la démonstration sans serveur SMTP configuré.
        $this->logs->add('Mot de passe oublié', "Mot de passe temporaire généré pour {$user['pseudo']}.", $user['pseudo']);

        jsonResponse([
            'message' => 'Un e-mail contenant un mot de passe temporaire a été envoyé.',
            'demo_temporary_password' => $temporaryPassword,
        ]);
    }
}
