<?php
/**
 * Point d'entrée unique de l'API REST (front controller).
 * Toutes les requêtes sont réécrites vers ce fichier par .htaccess (Apache)
 * ou par la configuration équivalente du serveur choisi au déploiement.
 */

declare(strict_types=1);

// ---------- Chargement de la configuration (.env) ----------

function loadEnvFile(string $path): void
{
    if (!is_file($path)) {
        return;
    }
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        [$key, $value] = array_pad(explode('=', $line, 2), 2, '');
        putenv(trim($key) . '=' . trim($value));
    }
}

loadEnvFile(__DIR__ . '/../.env');

// ---------- Dépendances de l'application ----------

require_once __DIR__ . '/../src/Security.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/mongo.php';
require_once __DIR__ . '/../src/Repositories/UserRepository.php';
require_once __DIR__ . '/../src/Repositories/PersonnageRepository.php';
require_once __DIR__ . '/../src/Repositories/ArticleRepository.php';
require_once __DIR__ . '/../src/Repositories/CommentaireRepository.php';
require_once __DIR__ . '/../src/Repositories/LogRepository.php';
require_once __DIR__ . '/../src/Controllers/AuthController.php';
require_once __DIR__ . '/../src/Controllers/PersonnageController.php';
require_once __DIR__ . '/../src/Controllers/CommentaireController.php';
require_once __DIR__ . '/../src/Controllers/ArticleController.php';
require_once __DIR__ . '/../src/Controllers/UserController.php';
require_once __DIR__ . '/../src/Controllers/LogController.php';

sendCorsHeaders();

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$pdo = getPdoConnection();
$mongo = getMongoCollection();

$userRepo = new UserRepository($pdo);
$personnageRepo = new PersonnageRepository($pdo);
$articleRepo = new ArticleRepository($pdo);
$commentaireRepo = new CommentaireRepository($pdo);
$logRepo = new LogRepository($mongo);

$authController = new AuthController($userRepo, $logRepo);
$personnageController = new PersonnageController($personnageRepo, $articleRepo, $commentaireRepo, $logRepo);
$commentaireController = new CommentaireController($commentaireRepo, $personnageRepo, $logRepo);
$articleController = new ArticleController($articleRepo, $logRepo);
$userController = new UserController($userRepo, $personnageRepo, $logRepo);
$logController = new LogController($logRepo);

// ---------- Routage ----------

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';

// Retire un éventuel préfixe de sous-dossier (déploiement dans un répertoire non racine).
$scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
if ($scriptDir !== '' && str_starts_with($uri, $scriptDir)) {
    $uri = substr($uri, strlen($scriptDir));
}
$uri = '/' . ltrim($uri, '/');

/**
 * Table de routage : [méthode, motif régulier, callable].
 * Les routes littérales (ex: /api/personnages/mine) sont volontairement
 * placées AVANT les routes paramétrées (ex: /api/personnages/{id}) pour
 * qu'elles soient testées en priorité.
 */
$routes = [
    ['POST', '#^/api/auth/register$#', fn () => $authController->register()],
    ['POST', '#^/api/auth/login$#', fn () => $authController->login()],
    ['POST', '#^/api/auth/logout$#', fn () => $authController->logout()],
    ['GET', '#^/api/auth/me$#', fn () => $authController->me()],
    ['POST', '#^/api/auth/forgot-password$#', fn () => $authController->forgotPassword()],

    ['GET', '#^/api/personnages/mine$#', fn () => $personnageController->mine()],
    ['GET', '#^/api/personnages/pending$#', fn () => $personnageController->pendingValidation()],
    ['GET', '#^/api/personnages$#', fn () => $personnageController->list()],
    ['POST', '#^/api/personnages$#', fn () => $personnageController->create()],
    ['GET', '#^/api/personnages/(\d+)$#', fn ($id) => $personnageController->detail((int) $id)],
    ['PUT', '#^/api/personnages/(\d+)$#', fn ($id) => $personnageController->update((int) $id)],
    ['DELETE', '#^/api/personnages/(\d+)$#', fn ($id) => $personnageController->delete((int) $id)],
    ['POST', '#^/api/personnages/(\d+)/share$#', fn ($id) => $personnageController->share((int) $id)],
    ['POST', '#^/api/personnages/(\d+)/duplicate$#', fn ($id) => $personnageController->duplicate((int) $id)],
    ['POST', '#^/api/personnages/(\d+)/equip$#', fn ($id) => $personnageController->equip((int) $id)],
    ['POST', '#^/api/personnages/(\d+)/moderate$#', fn ($id) => $personnageController->moderate((int) $id)],
    ['POST', '#^/api/personnages/(\d+)/commentaires$#', fn ($id) => $commentaireController->create((int) $id)],

    ['GET', '#^/api/commentaires/pending$#', fn () => $commentaireController->pending()],
    ['POST', '#^/api/commentaires/(\d+)/moderate$#', fn ($id) => $commentaireController->moderate((int) $id)],

    ['GET', '#^/api/articles/all$#', fn () => $articleController->listAll()],
    ['GET', '#^/api/articles$#', fn () => $articleController->listActive()],
    ['POST', '#^/api/articles$#', fn () => $articleController->create()],
    ['POST', '#^/api/articles/(\d+)/toggle$#', fn ($id) => $articleController->toggle((int) $id)],
    ['DELETE', '#^/api/articles/(\d+)$#', fn ($id) => $articleController->delete((int) $id)],

    ['GET', '#^/api/users$#', fn () => $userController->listPlayers()],
    ['POST', '#^/api/users/(\d+)/suspend$#', fn ($id) => $userController->suspendPlayer((int) $id)],
    ['DELETE', '#^/api/users/(\d+)$#', fn ($id) => $userController->deletePlayer((int) $id)],

    ['GET', '#^/api/employees$#', fn () => $userController->listEmployees()],
    ['POST', '#^/api/employees$#', fn () => $userController->createEmployee()],
    ['PUT', '#^/api/employees/(\d+)/password$#', fn ($id) => $userController->resetEmployeePassword((int) $id)],
    ['POST', '#^/api/employees/(\d+)/suspend$#', fn ($id) => $userController->suspendEmployee((int) $id)],
    ['DELETE', '#^/api/employees/(\d+)$#', fn ($id) => $userController->deleteEmployee((int) $id)],

    ['GET', '#^/api/logs$#', fn () => $logController->list()],
];

foreach ($routes as [$routeMethod, $pattern, $handler]) {
    if ($routeMethod !== $method) {
        continue;
    }
    if (preg_match($pattern, $uri, $matches)) {
        array_shift($matches);
        $handler(...$matches);
        exit;
    }
}

jsonError("Route inconnue : {$method} {$uri}", 404);
