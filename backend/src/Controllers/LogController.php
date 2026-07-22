<?php
/**
 * Consultation des logs d'activité (MongoDB), réservée à l'administrateur.
 */

declare(strict_types=1);

final class LogController
{
    public function __construct(private LogRepository $logs)
    {
    }

    public function list(): void
    {
        requireRole(['admin']);
        jsonResponse(['logs' => $this->logs->listRecent()]);
    }
}
