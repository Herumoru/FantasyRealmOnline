/* ==========================================================================
   FantasyRealm Online — Données simulées
   Sert de "faux backend" en attendant l'intégration serveur/BDD réelle.
   Persisté en localStorage pour simuler un état qui traverse les pages.
   ========================================================================== */

const STORAGE_KEYS = {
    users: 'fr_users',
    personnages: 'fr_personnages',
    commentaires: 'fr_commentaires',
    articles: 'fr_articles',
    logs: 'fr_logs',
    session: 'fr_session'
};

/* ---------- Jeux de données par défaut ---------- */

const DEFAULT_USERS = [
    { email: 'liora.vance@fantasyrealm.io', pseudo: 'LioraV', password: 'Aa1!aaaa', role: 'user', suspendu: false },
    { email: 'draak.test@fantasyrealm.io', pseudo: 'DraakTest', password: 'Test1234!', role: 'user', suspendu: false },
    { email: 'employe@pixelverse.studio', pseudo: 'ModeratriceJose', password: 'Employe1!', role: 'employe', suspendu: false },
    { email: 'admin@pixelverse.studio', pseudo: 'AdminRoot', password: 'Admin1234!', role: 'admin', suspendu: false }
];

const DEFAULT_PERSONNAGES = [
    {
        id: 1, nom: 'Sylvaria Lamefeuille', genre: 'Femme', proprietaire: 'LioraV',
        dateCreation: '2026-03-14', partage: true, autorise: true, accent: '#2E7D4F',
        formeVisage: 'Angulaire', formeYeux: 'Amande', formeNez: 'Fin', formeBouche: 'Souriante',
        couleurPeau: 'Olivâtre', couleurCheveux: 'Vert forêt', couleurYeux: 'Cyan magique',
        arme: 'Arc long elfique', armure: 'Cuirasse de ronces tissées'
    },
    {
        id: 2, nom: 'Bram Forgefer', genre: 'Homme', proprietaire: 'DraakTest',
        dateCreation: '2026-04-02', partage: true, autorise: true, accent: '#B08D57',
        formeVisage: 'Carrée', formeYeux: 'Ronds', formeNez: 'Large', formeBouche: 'Sérieuse',
        couleurPeau: 'Halée', couleurCheveux: 'Roux', couleurYeux: 'Ambre',
        arme: 'Marteau de guerre', armure: 'Plastron en acier runique'
    },
    {
        id: 3, nom: 'Nyx Aubécaille', genre: 'Non-binaire', proprietaire: 'LioraV',
        dateCreation: '2026-05-20', partage: true, autorise: true, accent: '#9D50BB',
        formeVisage: 'Ovale', formeYeux: 'Étirés', formeNez: 'Retroussé', formeBouche: 'Mystérieuse',
        couleurPeau: 'Pâle', couleurCheveux: 'Argent', couleurYeux: 'Violet',
        arme: 'Dague jumelle', armure: 'Tenue d\'ombre légère'
    },
    {
        id: 4, nom: 'Kael Tourmenoire', genre: 'Homme', proprietaire: 'DraakTest',
        dateCreation: '2026-06-01', partage: true, autorise: true, accent: '#00F0FF',
        formeVisage: 'Anguleuse', formeYeux: 'Perçants', formeNez: 'Droit', formeBouche: 'Neutre',
        couleurPeau: 'Claire', couleurCheveux: 'Noir', couleurYeux: 'Cyan magique',
        arme: 'Épée à deux mains', armure: 'Armure de plates gravée'
    },
    {
        id: 5, nom: 'Ithil Roseclair', genre: 'Femme', proprietaire: 'LioraV',
        dateCreation: '2026-06-18', partage: true, autorise: true, accent: '#FFD700',
        formeVisage: 'Douce', formeYeux: 'Grands', formeNez: 'Fin', formeBouche: 'Souriante',
        couleurPeau: 'Dorée', couleurCheveux: 'Blond', couleurYeux: 'Or',
        arme: 'Bâton solaire', armure: 'Robe de lumière'
    },
    {
        id: 6, nom: 'Grondak Piedelourd', genre: 'Homme', proprietaire: 'DraakTest',
        dateCreation: '2026-07-05', partage: true, autorise: true, accent: '#8B5E3C',
        formeVisage: 'Massive', formeYeux: 'Petits', formeNez: 'Épaté', formeBouche: 'Grimaçante',
        couleurPeau: 'Verdâtre', couleurCheveux: 'Brun', couleurYeux: 'Rouge',
        arme: 'Hache double', armure: 'Peaux cloutées'
    }
];

const DEFAULT_COMMENTAIRES = [
    { id: 1, personnageId: 1, pseudo: 'DraakTest', note: 5, commentaire: 'Le design de Sylvaria est superbe, la cuirasse de ronces est une excellente idée visuelle.', date: '2026-04-10', statut: 'approuve' },
    { id: 2, personnageId: 1, pseudo: 'Grondak_fan', note: 4, commentaire: 'Très cohérent avec un profil d\'archère, j\'adore la palette verte.', date: '2026-05-02', statut: 'approuve' },
    { id: 3, personnageId: 2, pseudo: 'LioraV', note: 5, commentaire: 'Bram a vraiment une carrure de forgeron, bravo pour le plastron runique.', date: '2026-04-20', statut: 'approuve' },
    { id: 4, personnageId: 4, pseudo: 'LioraV', note: 4, commentaire: 'Kael impose le respect avec cette armure gravée.', date: '2026-06-10', statut: 'approuve' }
];

const DEFAULT_ARTICLES = [
    { id: 1, type: 'arme', nom: 'Épée courte en acier', actif: true, accent: '#C0C0C0' },
    { id: 2, type: 'arme', nom: 'Hache de guerre', actif: true, accent: '#8B5E3C' },
    { id: 3, type: 'arme', nom: 'Arc elfique', actif: true, accent: '#2E7D4F' },
    { id: 4, type: 'arme', nom: 'Bâton runique', actif: true, accent: '#00F0FF' },
    { id: 5, type: 'armure', nom: 'Plastron de cuir', actif: true, accent: '#B08D57' },
    { id: 6, type: 'armure', nom: 'Cuirasse d\'acier', actif: true, accent: '#9CA3AF' },
    { id: 7, type: 'armure', nom: 'Robe enchantée', actif: true, accent: '#9D50BB' },
    { id: 8, type: 'armure', nom: 'Armure d\'écailles', actif: true, accent: '#3DDC97' },
    { id: 9, type: 'vetement', nom: 'Cape de voyageur', actif: true, accent: '#6B4F3B' },
    { id: 10, type: 'vetement', nom: 'Tunique de mage', actif: true, accent: '#4169E1' },
    { id: 11, type: 'vetement', nom: 'Manteau d\'ombre', actif: true, accent: '#2B2B33' },
    { id: 12, type: 'vetement', nom: 'Habits de cérémonie', actif: true, accent: '#FFD700' },
    { id: 13, type: 'accessoire', nom: 'Amulette de mana', actif: true, accent: '#00F0FF' },
    { id: 14, type: 'accessoire', nom: 'Anneau de vitalité', actif: true, accent: '#FF4B4B' },
    { id: 15, type: 'accessoire', nom: 'Ceinture de force', actif: true, accent: '#B08D57' },
    { id: 16, type: 'accessoire', nom: 'Bracelet runique', actif: true, accent: '#9D50BB' }
];

const ARTICLE_TYPE_LABELS = {
    arme: 'Arme',
    armure: 'Armure',
    vetement: 'Vêtement',
    accessoire: 'Accessoire'
};

/* ---------- Initialisation du stockage local ---------- */

const DATA_VERSION = '2';

function seedIfEmpty(key, defaultValue) {
    if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, JSON.stringify(defaultValue));
    }
}

function initData() {
    const storedVersion = localStorage.getItem('fr_data_version');
    if (storedVersion !== DATA_VERSION) {
        Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
        localStorage.setItem('fr_data_version', DATA_VERSION);
    }

    seedIfEmpty(STORAGE_KEYS.users, DEFAULT_USERS);
    seedIfEmpty(STORAGE_KEYS.personnages, DEFAULT_PERSONNAGES);
    seedIfEmpty(STORAGE_KEYS.commentaires, DEFAULT_COMMENTAIRES);
    seedIfEmpty(STORAGE_KEYS.articles, DEFAULT_ARTICLES);
    seedIfEmpty(STORAGE_KEYS.logs, []);
}

function addLog(action, details) {
    const logs = getLogs();
    logs.unshift({ id: Date.now(), date: new Date().toISOString(), action, details });
    saveLogs(logs);
}

function getLogs() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.logs) || '[]');
}

function saveLogs(logs) {
    localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
}

/* ---------- Accès Utilisateurs ---------- */

function getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function findUserByEmail(email) {
    return getUsers().find(u => u.email.toLowerCase() === String(email).toLowerCase());
}

function findUserByPseudo(pseudo) {
    return getUsers().find(u => u.pseudo.toLowerCase() === String(pseudo).toLowerCase());
}

function getUsersByRole(role) {
    return getUsers().filter(u => u.role === role);
}

/* ---------- Accès Personnages ---------- */

function getPersonnages() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.personnages) || '[]');
}

function savePersonnages(list) {
    localStorage.setItem(STORAGE_KEYS.personnages, JSON.stringify(list));
}

function getPersonnageById(id) {
    return getPersonnages().find(p => String(p.id) === String(id));
}

function findPersonnageByNom(nom, excludeId) {
    return getPersonnages().find(p =>
        p.nom.toLowerCase() === String(nom).toLowerCase() && String(p.id) !== String(excludeId)
    );
}

function getPersonnagesByProprietaire(pseudo) {
    return getPersonnages().filter(p => p.proprietaire === pseudo);
}

/* ---------- Accès Articles (bibliothèque d'accessoires) ---------- */

function getArticles() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.articles) || '[]');
}

function saveArticles(list) {
    localStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(list));
}

function getArticleById(id) {
    return getArticles().find(a => String(a.id) === String(id));
}

/* ---------- Accès Commentaires ---------- */

function getCommentaires() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.commentaires) || '[]');
}

function saveCommentaires(list) {
    localStorage.setItem(STORAGE_KEYS.commentaires, JSON.stringify(list));
}

function getCommentairesApprouvesFor(personnageId) {
    return getCommentaires().filter(c => String(c.personnageId) === String(personnageId) && c.statut === 'approuve');
}

/* ---------- Session (connexion simulée) ---------- */

function getSession() {
    const raw = localStorage.getItem(STORAGE_KEYS.session);
    return raw ? JSON.parse(raw) : null;
}

function setSession(user) {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({ email: user.email, pseudo: user.pseudo, role: user.role }));
}

function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.session);
}

initData();
