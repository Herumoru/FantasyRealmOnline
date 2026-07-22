<?php
/**
 * Fonctions transverses : réponses JSON, validation, sécurité des mots de
 * passe, garde-fous d'authentification et d'autorisation par rôle.
 */

declare(strict_types=1);

const PASSWORD_REGEX = '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/';
const EMAIL_REGEX = '/^[^\s@]+@[^\s@]+\.[^\s@]+$/';

function jsonResponse(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonError(string $message, int $status = 400): void
{
    jsonResponse(['error' => $message], $status);
}

function getJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

/**
 * Valide un mot de passe selon les recommandations CNIL :
 * au moins 8 caractères, une majuscule, une minuscule, un chiffre,
 * un caractère spécial.
 */
function isPasswordSecure(string $password): bool
{
    return (bool) preg_match(PASSWORD_REGEX, $password);
}

function isEmailValid(string $email): bool
{
    return (bool) preg_match(EMAIL_REGEX, $email);
}

/**
 * Génère un mot de passe temporaire sécurisé (utilisé pour le flux
 * "mot de passe oublié"). L'utilisateur devra le modifier à sa première
 * connexion (champ motdepasse_a_modifier).
 */
function generateTemporaryPassword(): string
{
    $upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    $lower = 'abcdefghijkmnpqrstuvwxyz';
    $digits = '23456789';
    $special = '!@#$%*?';

    $password = $upper[random_int(0, strlen($upper) - 1)]
        . $lower[random_int(0, strlen($lower) - 1)]
        . $digits[random_int(0, strlen($digits) - 1)]
        . $special[random_int(0, strlen($special) - 1)];

    $all = $upper . $lower . $digits . $special;
    for ($i = 0; $i < 8; $i++) {
        $password .= $all[random_int(0, strlen($all) - 1)];
    }

    return str_shuffle($password);
}

function currentSession(): ?array
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    return $_SESSION['user'] ?? null;
}

function requireAuth(): array
{
    $session = currentSession();
    if ($session === null) {
        jsonError('Authentification requise.', 401);
    }
    return $session;
}

/**
 * @param string[] $roles Rôles autorisés (ex : ['employe', 'admin'])
 */
function requireRole(array $roles): array
{
    $session = requireAuth();
    if (!in_array($session['role'], $roles, true)) {
        jsonError('Accès refusé : rôle insuffisant.', 403);
    }
    return $session;
}

/**
 * Envoie les en-têtes CORS nécessaires pour que le front-end statique
 * (servi depuis une autre origine) puisse appeler l'API avec les
 * cookies de session (credentials: 'include' côté fetch()).
 */
function sendCorsHeaders(): void
{
    $allowedOrigin = getenv('FRONTEND_ORIGIN') ?: 'http://localhost:5500';
    header("Access-Control-Allow-Origin: {$allowedOrigin}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
