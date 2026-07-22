<?php
/**
 * Accès aux données pour les logs d'activité (MongoDB).
 * Voir config/mongo.php pour la justification du choix NoSQL.
 */

declare(strict_types=1);

final class LogRepository
{
    public function __construct(private MongoDB\Collection $collection)
    {
    }

    public function add(string $action, string $details, string $auteur): void
    {
        $this->collection->insertOne([
            'action' => $action,
            'details' => $details,
            'auteur' => $auteur,
            'date' => new MongoDB\BSON\UTCDateTime(),
        ]);
    }

    public function listRecent(int $limit = 200): array
    {
        $cursor = $this->collection->find(
            [],
            ['sort' => ['date' => -1], 'limit' => $limit]
        );

        $logs = [];
        foreach ($cursor as $document) {
            $logs[] = [
                'action' => $document['action'],
                'details' => $document['details'],
                'auteur' => $document['auteur'],
                'date' => $document['date']->toDateTime()->format(DATE_ATOM),
            ];
        }
        return $logs;
    }
}
