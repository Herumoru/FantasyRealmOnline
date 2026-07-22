<?php
/**
 * Connexion à la base de données non-relationnelle (MongoDB).
 *
 * Choix technique : MongoDB est utilisé exclusivement pour les LOGS D'ACTIVITÉ
 * consultés par l'administrateur (Annexe "Outils de suivi des activités de
 * personnalisation"). Justification détaillée dans la documentation technique :
 *   - Écriture massive, append-only, jamais modifiée ni jointe à d'autres tables.
 *   - Structure des logs potentiellement variable selon le type d'action
 *     (création de personnage, modération, gestion de compte...), ce qui
 *     convient bien à un schéma flexible plutôt qu'à des colonnes SQL figées.
 *   - Aucune contrainte d'intégrité référentielle nécessaire pour ces données.
 *
 * Toutes les autres données (utilisateurs, personnages, articles, commentaires)
 * restent dans MySQL, qui reste le bon choix pour des données fortement
 * relationnelles nécessitant des jointures et des contraintes d'intégrité.
 */

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

function getMongoCollection(): MongoDB\Collection
{
    static $collection = null;

    if ($collection !== null) {
        return $collection;
    }

    $uri = getenv('MONGO_URI') ?: 'mongodb://127.0.0.1:27017';
    $dbName = getenv('MONGO_DB') ?: 'fantasyrealm_logs';

    $client = new MongoDB\Client($uri);
    $collection = $client->selectDatabase($dbName)->selectCollection('activity_logs');

    return $collection;
}
