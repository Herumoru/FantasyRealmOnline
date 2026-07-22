<?php
/**
 * Connexion PDO à la base de données relationnelle (MySQL / MariaDB).
 *
 * Les identifiants sont lus depuis les variables d'environnement (voir .env.example)
 * afin de ne jamais committer de secrets dans le dépôt Git.
 */

declare(strict_types=1);

function getPdoConnection(): PDO
{
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $port = getenv('DB_PORT') ?: '3306';
    $dbName = getenv('DB_NAME') ?: 'fantasyrealm';
    $user = getenv('DB_USER') ?: 'root';
    $password = getenv('DB_PASSWORD') ?: '';

    $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4";

    try {
        $pdo = new PDO($dsn, $user, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false, // requêtes préparées réelles, protection anti-injection SQL
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Impossible de se connecter à la base de données.',
        ]);
        exit;
    }

    return $pdo;
}
