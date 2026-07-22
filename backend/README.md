# FantasyRealm Online — Back-end (API)

API REST en PHP natif (sans framework) pour le système de gestion de
personnages de FantasyRealm Online — PixelVerse Studios.

Stack : **PHP 8.1+ / PDO / MySQL-MariaDB** (données relationnelles) +
**MongoDB** (logs d'activité). Voir `config/mongo.php` pour la justification
détaillée du choix NoSQL.

## 1. Prérequis

- PHP >= 8.1 avec les extensions `pdo_mysql` et `mongodb`
  (`pecl install mongodb` si l'extension n'est pas déjà présente)
- [Composer](https://getcomposer.org/)
- Un serveur MySQL ou MariaDB
- Un serveur MongoDB (local ou Atlas)

## 2. Installation en local

```bash
# 1. Installer la dépendance PHP pour MongoDB
composer install

# 2. Copier et renseigner le fichier d'environnement
cp .env.example .env
# éditer .env : identifiants MySQL, URI MongoDB, origine du front-end

# 3. Créer la base et importer le schéma + les données de démonstration
mysql -u root -p -e "CREATE DATABASE fantasyrealm CHARACTER SET utf8mb4;"
mysql -u root -p fantasyrealm < sql/schema.sql
mysql -u root -p fantasyrealm < sql/seed.sql

# 4. S'assurer que MongoDB tourne (aucune donnée à importer : la
#    collection activity_logs se crée automatiquement au premier log)
mongod --dbpath /chemin/vers/vos/donnees &

# 5. Lancer le serveur PHP intégré pour tester en local
php -S localhost:8000 -t public
```

L'API est alors accessible sur `http://localhost:8000/api/...`.

## 3. Comptes de démonstration

Identiques à ceux du prototype front-end, pour rester cohérent lors des tests :

| Rôle    | E-mail                          | Mot de passe   |
|---------|----------------------------------|----------------|
| Joueur  | liora.vance@fantasyrealm.io      | Aa1!aaaa       |
| Joueur  | draak.test@fantasyrealm.io       | Test1234!      |
| Employé | employe@pixelverse.studio        | Employe1!      |
| Admin   | admin@pixelverse.studio          | Admin1234!     |

## 4. Endpoints principaux

### Authentification
| Méthode | Route                        | Accès    | Description |
|---------|-------------------------------|----------|--------------|
| POST    | `/api/auth/register`          | Public   | Créer un compte joueur |
| POST    | `/api/auth/login`             | Public   | Connexion |
| POST    | `/api/auth/logout`            | Connecté | Déconnexion |
| GET     | `/api/auth/me`                | Public   | Session courante |
| POST    | `/api/auth/forgot-password`   | Public   | Mot de passe oublié |

### Personnages
| Méthode | Route                                    | Accès              | Description |
|---------|--------------------------------------------|--------------------|--------------|
| GET     | `/api/personnages`                          | Public             | Liste partagée + filtres `genre`, `pseudo`, `date_from`, `date_to` |
| GET     | `/api/personnages/mine`                     | Connecté           | Mes personnages |
| GET     | `/api/personnages/pending`                  | Employé/Admin      | Noms en attente de validation |
| GET     | `/api/personnages/{id}`                     | Public             | Détail + équipement + avis approuvés |
| POST    | `/api/personnages`                          | Connecté           | Créer un personnage |
| PUT     | `/api/personnages/{id}`                     | Propriétaire       | Modifier les traits |
| DELETE  | `/api/personnages/{id}`                     | Propriétaire/Staff | Supprimer |
| POST    | `/api/personnages/{id}/share`               | Propriétaire       | Partager / retirer le partage |
| POST    | `/api/personnages/{id}/duplicate`           | Propriétaire       | Dupliquer |
| POST    | `/api/personnages/{id}/equip`               | Propriétaire       | Équiper/retirer un article |
| POST    | `/api/personnages/{id}/moderate`            | Employé/Admin      | Approuver/rejeter un nom |
| POST    | `/api/personnages/{id}/commentaires`        | Connecté           | Déposer un avis |

### Avis, articles, comptes, logs
| Méthode | Route                              | Accès          |
|---------|--------------------------------------|----------------|
| GET/POST| `/api/commentaires/pending`, `/api/commentaires/{id}/moderate` | Employé/Admin |
| GET     | `/api/articles`                      | Public (actifs uniquement) |
| GET     | `/api/articles/all`                  | Employé/Admin  |
| POST    | `/api/articles`, `/api/articles/{id}/toggle` | Employé/Admin |
| DELETE  | `/api/articles/{id}`                 | Employé/Admin  |
| GET/POST/DELETE | `/api/users`, `/api/users/{id}/suspend`, `/api/users/{id}` | Employé/Admin |
| GET/POST/PUT/DELETE | `/api/employees...`             | Admin uniquement |
| GET     | `/api/logs`                          | Admin uniquement (MongoDB) |

## 5. Exemple de test avec curl

```bash
# Connexion (conserve le cookie de session dans cookies.txt)
curl -c cookies.txt -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"draak.test@fantasyrealm.io","password":"Test1234!"}'

# Liste de mes personnages (réutilise le cookie de session)
curl -b cookies.txt http://localhost:8000/api/personnages/mine
```

## 6. Dispositions de sécurité

- **Mots de passe** : hashés avec `password_hash()` (bcrypt), jamais stockés
  ni renvoyés en clair. Règle CNIL appliquée à l'inscription (8 caractères
  min., majuscule, minuscule, chiffre, caractère spécial).
- **Injections SQL** : 100% des requêtes utilisent des requêtes préparées
  PDO (`PDO::ATTR_EMULATE_PREPARES => false`).
- **Sessions** : authentification par session PHP (cookie `httponly`),
  regénération de l'identifiant de session à la connexion
  (`session_regenerate_id`) pour limiter la fixation de session.
- **Autorisations** : chaque route sensible est protégée par
  `requireAuth()` / `requireRole()` (contrôle du rôle côté serveur, jamais
  seulement côté front-end).
- **CORS** : origine explicitement autorisée via `.env`
  (`Access-Control-Allow-Origin` ciblé, pas de wildcard `*`, nécessaire
  pour l'usage de cookies de session en cross-origin).

## 7. Architecture

```
backend/
├── public/index.php        # Contrôleur frontal + routage
├── config/                 # Connexions MySQL (PDO) et MongoDB
├── src/
│   ├── Security.php         # Validation, hashing, garde-fous d'accès
│   ├── Repositories/         # Accès aux données (une classe par table/domaine)
│   └── Controllers/          # Logique métier + réponses JSON
└── sql/
    ├── schema.sql            # Structure de la base relationnelle
    └── seed.sql               # Données de démonstration (mots de passe pré-hashés)
```
