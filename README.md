# FantasyRealm Online — Système de gestion de personnages

Projet réalisé dans le cadre de l'ECF — Titre Professionnel Développeur Web et Web Mobile
(PixelVerse Studios).

## Structure du dépôt

```
.
├── frontend/     # Interfaces HTML/CSS/JS (pages publiques, espace utilisateur, back-office)
├── backend/      # API PHP/PDO (MySQL) + logs (MongoDB)
└── documents/    # Livrables PDF (charte graphique, manuel, doc technique, gestion de projet)
```

## Démarrage rapide

### Front-end (démonstration autonome, données simulées)
```bash
cd frontend
# ouvrir index.html dans un navigateur, ou servir le dossier :
python3 -m http.server 5500
```
Voir `documents/manuel-utilisation.pdf` pour les comptes de démonstration.

### Back-end (API réelle)
```bash
cd backend
composer install
cp .env.example .env      # renseigner les identifiants MySQL / MongoDB
mysql -u root -p -e "CREATE DATABASE fantasyrealm CHARACTER SET utf8mb4;"
mysql -u root -p fantasyrealm < sql/schema.sql
mysql -u root -p fantasyrealm < sql/seed.sql
php -S localhost:8000 -t public
```
Voir `backend/README.md` pour le détail des routes de l'API.

## Documentation

| Document | Contenu |
|---|---|
| `documents/charte-graphique.pdf` | Palette, typographie, maquettes desktop/mobile |
| `documents/manuel-utilisation.pdf` | Comptes de démo, parcours Joueur/Employé/Admin |
| `documents/documentation-technique.pdf` | Choix techniques, MCD, diagrammes, déploiement |
| `documents/gestion-projet.pdf` | Méthodologie, planning, stratégie Git |

## Stratégie Git

- `main` : version stable et déployable
- `develop` : intégration des fonctionnalités
- `feature/<nom>` : une branche par fonctionnalité, fusionnée dans `develop` après test

## Auteur

Projet réalisé par Herumoru — Titre Professionnel Développeur Web et Web Mobile, 2026.
