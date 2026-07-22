-- ============================================================================
-- FantasyRealm Online — Données de démonstration
-- À exécuter après schema.sql.
--
-- Les mots de passe sont pré-hashés en bcrypt (compatibles password_verify())
-- afin de pouvoir insérer des comptes de démonstration directement en SQL,
-- sans jamais stocker de mot de passe en clair.
--   LioraV          -> Aa1!aaaa
--   DraakTest       -> Test1234!
--   ModeratriceJose -> Employe1!
--   AdminRoot       -> Admin1234!
-- ============================================================================

-- ---------- Rôles ----------
INSERT INTO role (id_role, libelle) VALUES
    (1, 'user'),
    (2, 'employe'),
    (3, 'admin');

-- ---------- Utilisateurs ----------
INSERT INTO utilisateur (id_utilisateur, pseudo, mail, password, suspendu, motdepasse_a_modifier, id_role) VALUES
    (1, 'LioraV', 'liora.vance@fantasyrealm.io', '$2b$12$BO/OOHfXVinM.sxsshblbeElYasx9b1b9bo.jy/SMDFb1R.rQR6te', FALSE, FALSE, 1),
    (2, 'DraakTest', 'draak.test@fantasyrealm.io', '$2b$12$1/VYQ.VeHasyioR/.i1upenFKkQB3pfcrgnLWjk4yzliJyV.XBme.', FALSE, FALSE, 1),
    (3, 'ModeratriceJose', 'employe@pixelverse.studio', '$2b$12$f74keaHe8T/Tqc5kB5dTKOKV9wIVWoEz5HT4zNPBm30D/to1mcfn2', FALSE, FALSE, 2),
    (4, 'AdminRoot', 'admin@pixelverse.studio', '$2b$12$LVtG93y6HK0XzIGlPJfi/.RjUPggHQlSiEgWDsZG9Y4CpNSNpKlz6', FALSE, FALSE, 3);

-- ---------- Bibliothèque d'articles ----------
INSERT INTO article (id_article, nom, actif, type) VALUES
    (1, 'Épée courte en acier', TRUE, 'arme'),
    (2, 'Hache de guerre', TRUE, 'arme'),
    (3, 'Arc elfique', TRUE, 'arme'),
    (4, 'Bâton runique', TRUE, 'arme'),
    (5, 'Plastron de cuir', TRUE, 'armure'),
    (6, 'Cuirasse d''acier', TRUE, 'armure'),
    (7, 'Robe enchantée', TRUE, 'armure'),
    (8, 'Armure d''écailles', TRUE, 'armure'),
    (9, 'Cape de voyageur', TRUE, 'vetement'),
    (10, 'Tunique de mage', TRUE, 'vetement'),
    (11, 'Manteau d''ombre', TRUE, 'vetement'),
    (12, 'Habits de cérémonie', TRUE, 'vetement'),
    (13, 'Amulette de mana', TRUE, 'accessoire'),
    (14, 'Anneau de vitalité', TRUE, 'accessoire'),
    (15, 'Ceinture de force', TRUE, 'accessoire'),
    (16, 'Bracelet runique', TRUE, 'accessoire');

-- ---------- Personnages de démonstration (partagés et validés) ----------
INSERT INTO personnage
    (id_personnage, nom, genre, couleur_peau, couleur_yeux, couleur_cheveux, forme_yeux, forme_nez, forme_bouche, partage, autorise, date_creation, id_utilisateur)
VALUES
    (1, 'Sylvaria Lamefeuille', 'Femme', 'Olivâtre', 'Cyan magique', 'Vert forêt', 'Amande', 'Fin', 'Souriante', TRUE, TRUE, '2026-03-14', 1),
    (2, 'Bram Forgefer', 'Homme', 'Halée', 'Ambre', 'Roux', 'Ronds', 'Large', 'Sérieuse', TRUE, TRUE, '2026-04-02', 2),
    (3, 'Nyx Aubécaille', 'Non-binaire', 'Pâle', 'Violet', 'Argent', 'Étirés', 'Retroussé', 'Mystérieuse', TRUE, TRUE, '2026-05-20', 1),
    (4, 'Kael Tourmenoire', 'Homme', 'Claire', 'Cyan magique', 'Noir', 'Perçants', 'Droit', 'Neutre', TRUE, TRUE, '2026-06-01', 2),
    (5, 'Ithil Roseclair', 'Femme', 'Dorée', 'Or', 'Blond', 'Ronds', 'Fin', 'Souriante', TRUE, TRUE, '2026-06-18', 1),
    (6, 'Grondak Piedelourd', 'Homme', 'Verdâtre', 'Rouge', 'Brun', 'Amande', 'Large', 'Sérieuse', TRUE, TRUE, '2026-07-05', 2);

-- ---------- Équipement (relation many-to-many "dispose") ----------
INSERT INTO personnage_article (id_personnage, id_article) VALUES
    (1, 3), (1, 9),
    (2, 2), (2, 6),
    (4, 1), (4, 8),
    (6, 2), (6, 11);

-- ---------- Avis (commentaires) ----------
INSERT INTO commentaire (note, commentaire, date_commentaire, statut, pseudo_auteur, id_personnage) VALUES
    (5, 'Le design de Sylvaria est superbe, la cuirasse de ronces est une excellente idee visuelle.', '2026-04-10', 'approuve', 'DraakTest', 1),
    (4, 'Tres coherent avec un profil d''archere, j''adore la palette verte.', '2026-05-02', 'approuve', 'Grondak_fan', 1),
    (5, 'Bram a vraiment une carrure de forgeron, bravo pour le plastron runique.', '2026-04-20', 'approuve', 'LioraV', 2),
    (4, 'Kael impose le respect avec cette armure gravee.', '2026-06-10', 'approuve', 'LioraV', 4);
