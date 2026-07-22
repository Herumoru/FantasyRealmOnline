-- ============================================================================
-- FantasyRealm Online — Système de gestion de personnages
-- Schéma de base de données relationnelle (MySQL / MariaDB)
--
-- Fidèle au MCD fourni en Annexe 1 de l'énoncé, avec les écarts suivants,
-- justifiés dans la documentation technique :
--   - password : VARCHAR(255) au lieu de VARCHAR(50), pour accueillir un hash
--     bcrypt (60 caractères) généré par password_hash() côté PHP.
--   - personnage.date_creation : ajouté (non présent dans le MCD fourni) car
--     indispensable au filtre "plage de date de création" exigé par l'énoncé.
--   - commentaire.pseudo_auteur : stocké en dénormalisé (le MCD ne fait pas
--     apparaître de relation utilisateur-commentaire), conformément à la
--     formulation de l'énoncé ("le pseudo sera conservé").
--   - La relation "dispose" (personnage 0,n <-> 0,n article) est traduite par
--     une table d'association personnage_article, comme l'impose toute
--     relation many-to-many lors du passage MCD -> MLD.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS commentaire;
DROP TABLE IF EXISTS personnage_article;
DROP TABLE IF EXISTS personnage;
DROP TABLE IF EXISTS article;
DROP TABLE IF EXISTS utilisateur;
DROP TABLE IF EXISTS role;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- Table : role
-- ----------------------------------------------------------------------------
CREATE TABLE role (
    id_role     INT AUTO_INCREMENT PRIMARY KEY,
    libelle     VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Table : utilisateur
-- Relation "possede" (1,1 utilisateur -> 0,n role) : FK id_role sur utilisateur
-- ----------------------------------------------------------------------------
CREATE TABLE utilisateur (
    id_utilisateur          INT AUTO_INCREMENT PRIMARY KEY,
    pseudo                  VARCHAR(50) NOT NULL UNIQUE,
    mail                    VARCHAR(50) NOT NULL UNIQUE,
    password                VARCHAR(255) NOT NULL,
    suspendu                BOOLEAN NOT NULL DEFAULT FALSE,
    motdepasse_a_modifier   BOOLEAN NOT NULL DEFAULT FALSE,
    id_role                 INT NOT NULL,
    date_inscription        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_utilisateur_role
        FOREIGN KEY (id_role) REFERENCES role(id_role)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Table : personnage
-- Relation "detient" (0,n utilisateur -> 1,1 personnage) : FK id_utilisateur
-- ----------------------------------------------------------------------------
CREATE TABLE personnage (
    id_personnage       INT AUTO_INCREMENT PRIMARY KEY,
    nom                 VARCHAR(50) NOT NULL UNIQUE,
    genre               VARCHAR(50) NOT NULL,
    couleur_peau        VARCHAR(50) NOT NULL,
    couleur_yeux        VARCHAR(50) NOT NULL,
    couleur_cheveux     VARCHAR(50) NOT NULL,
    forme_yeux          VARCHAR(50) NOT NULL,
    forme_nez           VARCHAR(50) NOT NULL,
    forme_bouche        VARCHAR(50) NOT NULL,
    partage             BOOLEAN NOT NULL DEFAULT FALSE,
    autorise            BOOLEAN NOT NULL DEFAULT FALSE,
    image               BLOB NULL,
    date_creation       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_utilisateur      INT NOT NULL,
    CONSTRAINT fk_personnage_utilisateur
        FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Table : article (bibliothèque d'accessoires proposés par la plateforme)
-- ----------------------------------------------------------------------------
CREATE TABLE article (
    id_article  INT AUTO_INCREMENT PRIMARY KEY,
    nom         VARCHAR(50) NOT NULL,
    actif       BOOLEAN NOT NULL DEFAULT TRUE,
    image       BLOB NULL,
    type        ENUM('arme', 'armure', 'vetement', 'accessoire') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Table d'association : personnage_article
-- Traduction de la relation "dispose" (0,n <-> 0,n)
-- ----------------------------------------------------------------------------
CREATE TABLE personnage_article (
    id_personnage   INT NOT NULL,
    id_article      INT NOT NULL,
    PRIMARY KEY (id_personnage, id_article),
    CONSTRAINT fk_pa_personnage
        FOREIGN KEY (id_personnage) REFERENCES personnage(id_personnage)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pa_article
        FOREIGN KEY (id_article) REFERENCES article(id_article)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Table : commentaire
-- Relation "subit" (1,1 personnage -> 0,n commentaire) : FK id_personnage
-- ----------------------------------------------------------------------------
CREATE TABLE commentaire (
    id_commentaire      INT AUTO_INCREMENT PRIMARY KEY,
    note                TINYINT UNSIGNED NOT NULL,
    commentaire         TEXT NOT NULL,
    date_commentaire    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    statut              ENUM('attente', 'approuve', 'refuse') NOT NULL DEFAULT 'attente',
    pseudo_auteur       VARCHAR(50) NOT NULL,
    id_personnage       INT NOT NULL,
    CONSTRAINT fk_commentaire_personnage
        FOREIGN KEY (id_personnage) REFERENCES personnage(id_personnage)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_note_range CHECK (note BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Index utiles pour les filtres de la page "Personnages" (genre, pseudo, date)
-- ----------------------------------------------------------------------------
CREATE INDEX idx_personnage_genre ON personnage(genre);
CREATE INDEX idx_personnage_date ON personnage(date_creation);
CREATE INDEX idx_personnage_partage_autorise ON personnage(partage, autorise);
CREATE INDEX idx_commentaire_statut ON commentaire(statut);
