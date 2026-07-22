/* ==========================================================================
   FantasyRealm Online — Logique applicative
   Repose sur js/data.js (chargé avant ce fichier).
   ========================================================================== */

/* ---------- Utilitaires ---------- */

function qs(name) {
    return new URLSearchParams(window.location.search).get(name);
}

function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function initials(nom) {
    return nom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function showFieldError(fieldEl, message) {
    fieldEl.classList.add('has-error');
    const errorEl = fieldEl.querySelector('.field-error');
    if (errorEl) errorEl.textContent = message;
}

function clearFieldError(fieldEl) {
    fieldEl.classList.remove('has-error');
}

function showFormMessage(el, message, type) {
    el.textContent = message;
    el.className = 'form-message show ' + type;
}

/* ---------- En-tête / navigation dynamique ---------- */

function initHeader() {
    const session = getSession();
    const navUser = document.querySelector('[data-nav-user]');

    document.querySelectorAll('.auth-only').forEach(el => {
        el.style.display = session ? 'inline' : 'none';
    });

    document.querySelectorAll('.staff-only').forEach(el => {
        el.style.display = (session && (session.role === 'employe' || session.role === 'admin')) ? 'inline' : 'none';
    });

    if (navUser) {
        if (session) {
            navUser.innerHTML = `
                <span class="pseudo">⚔ ${escapeHtml(session.pseudo)}</span>
                <button class="btn btn-outline" id="logout-btn" type="button"><span class="label">Déconnexion</span></button>
            `;
            document.getElementById('logout-btn').addEventListener('click', () => {
                clearSession();
                window.location.href = 'index.html';
            });
        } else {
            navUser.innerHTML = `
                <a class="btn btn-outline" href="connexion.html"><span class="label">Connexion</span></a>
            `;
        }
    }

    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.main-nav');
    if (toggle && nav) {
        toggle.addEventListener('click', () => nav.classList.toggle('open'));
    }
}

/* ---------- Modal générique ---------- */

function openModal(title, bodyHtml, confirmLabel, onConfirm) {
    const overlay = document.getElementById('app-modal');
    if (!overlay) return;
    overlay.querySelector('.modal-title').textContent = title;
    overlay.querySelector('.modal-body').innerHTML = bodyHtml;

    const oldBtn = overlay.querySelector('.modal-confirm');
    oldBtn.textContent = confirmLabel;
    const newBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    newBtn.addEventListener('click', () => onConfirm());

    overlay.classList.add('open');
}

function closeModal() {
    const overlay = document.getElementById('app-modal');
    if (overlay) overlay.classList.remove('open');
}

/* ---------- Référentiel des traits de personnage ---------- */

const GENRES = ['Homme', 'Femme', 'Non-binaire'];
const FORMES_VISAGE = ['Ovale', 'Ronde', 'Carrée', 'Anguleuse', 'Allongée'];
const FORMES_YEUX = ['Amande', 'Ronds', 'Étirés', 'Tombants', 'Perçants'];
const FORMES_NEZ = ['Fin', 'Droit', 'Retroussé', 'Large', 'Aquilin'];
const FORMES_BOUCHE = ['Souriante', 'Neutre', 'Sérieuse', 'Boudeuse', 'Mystérieuse'];

const SKIN_COLORS = [
    { label: 'Pâle', hex: '#F1D8C0' }, { label: 'Claire', hex: '#E8B98E' },
    { label: 'Dorée', hex: '#D9A066' }, { label: 'Halée', hex: '#B97D4B' },
    { label: 'Olivâtre', hex: '#8C7A54' }, { label: 'Brune', hex: '#6B4A31' },
    { label: 'Verdâtre', hex: '#7C9473' }, { label: 'Grise (golem)', hex: '#9CA3AF' }
];

const HAIR_COLORS = [
    { label: 'Noir', hex: '#1A1A1A' }, { label: 'Brun', hex: '#4A2E1D' },
    { label: 'Roux', hex: '#B5502C' }, { label: 'Blond', hex: '#E8C468' },
    { label: 'Argent', hex: '#C7CCD1' }, { label: 'Vert forêt', hex: '#2E7D4F' },
    { label: 'Bleu nuit', hex: '#2A3E6B' }, { label: 'Rose spectral', hex: '#D67FA6' }
];

const EYE_COLORS = [
    { label: 'Ambre', hex: '#C88A2E' }, { label: 'Vert', hex: '#3E8E5C' },
    { label: 'Bleu', hex: '#3E6FC8' }, { label: 'Gris', hex: '#9CA3AF' },
    { label: 'Violet', hex: '#9D50BB' }, { label: 'Or', hex: '#FFD700' },
    { label: 'Cyan magique', hex: '#00F0FF' }, { label: 'Rouge', hex: '#D14B4B' }
];

function hexForLabel(list, label) {
    const found = list.find(c => c.label.toLowerCase() === String(label).toLowerCase());
    return found ? found.hex : list[0].hex;
}

function labelForHex(list, hex) {
    const found = list.find(c => c.hex.toLowerCase() === String(hex).toLowerCase());
    return found ? found.label : hex;
}

function selectField(id, label, options, selected) {
    return `
        <div class="field">
            <label for="${id}">${label}</label>
            <select id="${id}">
                ${options.map(o => `<option value="${o}" ${o === selected ? 'selected' : ''}>${o}</option>`).join('')}
            </select>
        </div>
    `;
}

function renderSwatchGrid(containerEl, colorArray, selectedHex, onSelect) {
    containerEl.innerHTML = colorArray.map(c => `
        <button type="button" class="swatch ${c.hex.toLowerCase() === String(selectedHex).toLowerCase() ? 'selected' : ''}"
                style="background:${c.hex};" data-hex="${c.hex}" title="${c.label}" aria-label="${c.label}"></button>
    `).join('');

    containerEl.querySelectorAll('.swatch').forEach(btn => {
        btn.addEventListener('click', () => {
            containerEl.querySelectorAll('.swatch').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            onSelect(btn.dataset.hex);
        });
    });
}

function shadeColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    let r = (num >> 16) + percent;
    let g = ((num >> 8) & 0x00FF) + percent;
    let b = (num & 0x0000FF) + percent;
    r = Math.max(Math.min(255, r), 0);
    g = Math.max(Math.min(255, g), 0);
    b = Math.max(Math.min(255, b), 0);
    return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}

function updatePreview(previewRoot, { peau, cheveux, yeux, nom }) {
    const glow = previewRoot.querySelector('.preview-glow');
    const head = previewRoot.querySelector('.preview-head');
    const body = previewRoot.querySelector('.preview-body');
    const label = previewRoot.querySelector('.preview-label');

    if (glow) glow.style.background = `radial-gradient(circle, ${yeux}66 0%, transparent 70%)`;
    if (head) {
        head.style.background = `radial-gradient(circle at 35% 30%, ${peau}, ${shadeColor(peau, -40)})`;
        head.style.borderColor = cheveux;
    }
    if (body) {
        body.style.background = `linear-gradient(180deg, ${shadeColor(cheveux, 20)}33, ${peau}33)`;
        body.style.borderTopColor = yeux;
    }
    if (label) label.textContent = nom || 'Aperçu du personnage';
}

/* ---------- Page : Inscription ---------- */

function initInscriptionPage() {
    const form = document.getElementById('inscription-form');
    if (!form) return;
    const message = document.getElementById('inscription-message');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        message.className = 'form-message';

        const emailField = document.getElementById('field-email');
        const pseudoField = document.getElementById('field-pseudo');
        const passwordField = document.getElementById('field-password');
        const confirmField = document.getElementById('field-confirm');

        [emailField, pseudoField, passwordField, confirmField].forEach(clearFieldError);

        const email = document.getElementById('email').value.trim();
        const pseudo = document.getElementById('pseudo').value.trim();
        const password = document.getElementById('password').value;
        const confirm = document.getElementById('confirm').value;

        let hasError = false;

        if (!EMAIL_RULE.test(email)) {
            showFieldError(emailField, 'Merci de renseigner une adresse e-mail valide.');
            hasError = true;
        } else if (findUserByEmail(email)) {
            showFieldError(emailField, 'Cette adresse e-mail est déjà associée à un compte.');
            hasError = true;
        }

        if (pseudo.length < 3) {
            showFieldError(pseudoField, 'Le pseudo doit contenir au moins 3 caractères.');
            hasError = true;
        } else if (findUserByPseudo(pseudo)) {
            showFieldError(pseudoField, 'Ce pseudo est déjà pris.');
            hasError = true;
        }

        if (!PASSWORD_RULE.test(password)) {
            showFieldError(passwordField, 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.');
            hasError = true;
        }

        if (confirm !== password) {
            showFieldError(confirmField, 'Les deux mots de passe ne correspondent pas.');
            hasError = true;
        }

        if (hasError) {
            showFormMessage(message, 'Merci de corriger les champs signalés ci-dessous.', 'error');
            return;
        }

        const users = getUsers();
        const newUser = { email, pseudo, password, role: 'user', suspendu: false };
        users.push(newUser);
        saveUsers(users);
        setSession(newUser);

        showFormMessage(message, 'Compte créé avec succès. Redirection en cours...', 'success');
        setTimeout(() => { window.location.href = 'personnages.html'; }, 900);
    });
}

/* ---------- Page : Connexion ---------- */

function initConnexionPage() {
    const form = document.getElementById('connexion-form');
    if (!form) return;
    const message = document.getElementById('connexion-message');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailField = document.getElementById('field-login-email');
        const passwordField = document.getElementById('field-login-password');
        [emailField, passwordField].forEach(clearFieldError);

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        const user = findUserByEmail(email);

        if (!user || user.password !== password) {
            showFieldError(passwordField, 'Identifiants incorrects.');
            showFormMessage(message, 'L\'adresse e-mail ou le mot de passe est incorrect.', 'error');
            return;
        }

        if (user.suspendu) {
            showFormMessage(message, 'Ce compte est actuellement suspendu. Contactez le support via la page Contact.', 'error');
            return;
        }

        setSession(user);
        showFormMessage(message, 'Connexion réussie. Redirection en cours...', 'success');
        const destination = (user.role === 'employe' || user.role === 'admin') ? 'backoffice.html' : 'personnages.html';
        setTimeout(() => { window.location.href = destination; }, 700);
    });

    // Mot de passe oublié
    const forgotLink = document.getElementById('forgot-link');
    const forgotPanel = document.getElementById('forgot-panel');
    if (forgotLink && forgotPanel) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            forgotPanel.classList.toggle('show');
            forgotPanel.style.display = forgotPanel.classList.contains('show') ? 'block' : 'none';
        });
    }

    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const forgotMessage = document.getElementById('forgot-message');
            const email = document.getElementById('forgot-email').value.trim();
            const pseudo = document.getElementById('forgot-pseudo').value.trim();
            const user = findUserByEmail(email);

            if (!user || user.pseudo.toLowerCase() !== pseudo.toLowerCase()) {
                showFormMessage(forgotMessage, 'Aucun compte ne correspond à cette combinaison e-mail / pseudo.', 'error');
                return;
            }

            showFormMessage(forgotMessage, 'Un nouveau mot de passe sécurisé vient d\'être envoyé à votre adresse e-mail (simulation).', 'success');
            forgotForm.reset();
        });
    }
}

/* ---------- Page : Contact ---------- */

function initContactPage() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const session = getSession();
    const emailInput = document.getElementById('contact-email');
    const pseudoInput = document.getElementById('contact-pseudo');

    if (session) {
        emailInput.value = session.email;
        pseudoInput.value = session.pseudo;
        emailInput.disabled = true;
        pseudoInput.disabled = true;
        document.getElementById('contact-session-note').style.display = 'block';
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = document.getElementById('contact-message');
        const pseudoField = document.getElementById('field-contact-pseudo');
        clearFieldError(pseudoField);

        const pseudo = pseudoInput.value.trim();

        if (!findUserByPseudo(pseudo)) {
            showFieldError(pseudoField, 'Ce pseudo ne correspond à aucun compte existant.');
            showFormMessage(message, 'Merci de vérifier le pseudo renseigné avant l\'envoi.', 'error');
            return;
        }

        showFormMessage(message, 'Votre message a bien été transmis à l\'équipe PixelVerse Studios.', 'success');
        form.reset();
        if (session) {
            emailInput.value = session.email;
            pseudoInput.value = session.pseudo;
        }
    });
}

/* ---------- Page : Liste des personnages ---------- */

function renderCharacterCard(p) {
    return `
        <article class="character-card glass-panel" data-id="${p.id}" tabindex="0" role="button"
                  aria-label="Voir le détail de ${escapeHtml(p.nom)}">
            <div class="character-avatar" style="background: radial-gradient(circle, ${p.accent}33 0%, transparent 70%);">
                <div class="initials" style="background:${p.accent}; box-shadow:0 0 18px ${p.accent}88;">${initials(p.nom)}</div>
            </div>
            <div class="character-info">
                <h3>${escapeHtml(p.nom)}</h3>
                <p class="owner">Créé par <strong>${escapeHtml(p.proprietaire)}</strong></p>
                <span class="badge">${escapeHtml(p.genre)}</span>
            </div>
        </article>
    `;
}

function initPersonnagesPage() {
    const grid = document.getElementById('characters-grid');
    if (!grid) return;

    const filterGenre = document.getElementById('filter-genre');
    const filterPseudo = document.getElementById('filter-pseudo');
    const filterFrom = document.getElementById('filter-date-from');
    const filterTo = document.getElementById('filter-date-to');
    const resetBtn = document.getElementById('filter-reset');

    function applyFilters() {
        const all = getPersonnages().filter(p => p.partage && p.autorise);
        const genre = filterGenre.value;
        const pseudo = filterPseudo.value.trim().toLowerCase();
        const from = filterFrom.value;
        const to = filterTo.value;

        const filtered = all.filter(p => {
            if (genre && p.genre !== genre) return false;
            if (pseudo && !p.proprietaire.toLowerCase().includes(pseudo)) return false;
            if (from && p.dateCreation < from) return false;
            if (to && p.dateCreation > to) return false;
            return true;
        });

        if (filtered.length === 0) {
            grid.innerHTML = '<div class="empty-state">Aucun personnage ne correspond à ces critères. Essayez d\'élargir votre recherche.</div>';
            return;
        }

        grid.innerHTML = filtered.map(renderCharacterCard).join('');
        grid.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', () => {
                window.location.href = `personnage.html?id=${card.dataset.id}`;
            });
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') window.location.href = `personnage.html?id=${card.dataset.id}`;
            });
        });
    }

    [filterGenre, filterPseudo, filterFrom, filterTo].forEach(el => {
        el.addEventListener('input', applyFilters);
        el.addEventListener('change', applyFilters);
    });

    resetBtn.addEventListener('click', () => {
        filterGenre.value = '';
        filterPseudo.value = '';
        filterFrom.value = '';
        filterTo.value = '';
        applyFilters();
    });

    applyFilters();
}

/* ---------- Page : Détail personnage ---------- */

function initPersonnagePage() {
    const container = document.getElementById('character-detail-root');
    if (!container) return;

    const id = qs('id');
    const personnage = getPersonnageById(id);

    if (!personnage) {
        container.innerHTML = `
            <div class="empty-state glass-panel">
                Ce personnage n'existe pas ou n'est plus partagé.
                <div class="mt-2"><a class="btn btn-primary" href="personnages.html">Retour à la liste</a></div>
            </div>
        `;
        return;
    }

    document.title = `${personnage.nom} — FantasyRealm Online`;

    const specs = [
        ['Genre', personnage.genre],
        ['Forme du visage', personnage.formeVisage],
        ['Forme des yeux', personnage.formeYeux],
        ['Forme du nez', personnage.formeNez],
        ['Forme de la bouche', personnage.formeBouche],
        ['Couleur de peau', personnage.couleurPeau],
        ['Couleur des cheveux', personnage.couleurCheveux],
        ['Couleur des yeux', personnage.couleurYeux],
        ['Arme équipée', personnage.arme || 'Aucune'],
        ['Armure équipée', personnage.armure || 'Aucune'],
        ['Vêtement équipé', personnage.vetement || 'Aucun'],
        ['Accessoires', (personnage.accessoiresNoms && personnage.accessoiresNoms.length) ? personnage.accessoiresNoms.join(', ') : 'Aucun']
    ];

    const reviews = getCommentairesApprouvesFor(personnage.id);
    const session = getSession();

    container.innerHTML = `
        <div class="character-detail">
            <div class="character-hero-visual glass-panel">
                <div class="initials-lg" style="background:${personnage.accent}; box-shadow:0 0 30px ${personnage.accent}99;">
                    ${initials(personnage.nom)}
                </div>
                <h1 style="font-size:1.4rem;">${escapeHtml(personnage.nom)}</h1>
                <p>Créé par <strong style="color:var(--epic-gold);">${escapeHtml(personnage.proprietaire)}</strong></p>
                <p style="font-size:0.8rem;">Le ${formatDate(personnage.dateCreation)}</p>
            </div>

            <div>
                <div class="glass-panel" style="padding:1.75rem; margin-bottom:1.5rem;">
                    <h2 style="font-size:1rem;">Détail du personnage</h2>
                    <ul class="spec-list">
                        ${specs.map(([k, v]) => `<li><span>${k}</span><span>${escapeHtml(String(v))}</span></li>`).join('')}
                    </ul>
                </div>

                <div class="glass-panel" style="padding:1.75rem; margin-bottom:1.5rem;">
                    <h2 style="font-size:1rem;">Avis des joueurs (${reviews.length})</h2>
                    <div id="reviews-list">
                        ${reviews.length === 0
                            ? '<p>Aucun avis pour le moment. Soyez le premier à en déposer un.</p>'
                            : reviews.map(r => `
                                <div class="review-card glass-panel">
                                    <div class="review-head">
                                        <strong>${escapeHtml(r.pseudo)}</strong>
                                        <span class="stars">${'★'.repeat(r.note)}${'☆'.repeat(5 - r.note)}</span>
                                    </div>
                                    <p style="margin:0; color:var(--silver);">${escapeHtml(r.commentaire)}</p>
                                </div>
                            `).join('')}
                    </div>
                </div>

                <div class="glass-panel" style="padding:1.75rem;">
                    <h2 style="font-size:1rem;">Déposer un avis</h2>
                    ${session ? `
                        <div id="review-message" class="form-message"></div>
                        <form id="review-form">
                            <div class="field">
                                <label for="review-note">Note</label>
                                <select id="review-note" required>
                                    <option value="5">5 étoiles — Excellent</option>
                                    <option value="4">4 étoiles — Très bien</option>
                                    <option value="3">3 étoiles — Correct</option>
                                    <option value="2">2 étoiles — Moyen</option>
                                    <option value="1">1 étoile — Décevant</option>
                                </select>
                            </div>
                            <div class="field">
                                <label for="review-comment">Commentaire</label>
                                <textarea id="review-comment" rows="3" required placeholder="Votre avis sur ce personnage..."></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary">Envoyer mon avis</button>
                        </form>
                    ` : `
                        <p>Vous devez être connecté pour déposer un avis.
                        <a href="connexion.html" style="color:var(--mana-cyan);">Se connecter</a></p>
                    `}
                </div>
            </div>
        </div>
    `;

    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const note = parseInt(document.getElementById('review-note').value, 10);
            const commentaire = document.getElementById('review-comment').value.trim();
            const comments = getCommentaires();
            comments.push({
                id: Date.now(),
                personnageId: personnage.id,
                pseudo: session.pseudo,
                note,
                commentaire,
                date: new Date().toISOString().slice(0, 10),
                statut: 'attente'
            });
            saveCommentaires(comments);

            const msg = document.getElementById('review-message');
            showFormMessage(msg, 'Votre avis a été soumis et sera visible après validation par notre équipe.', 'success');
            reviewForm.reset();
        });
    }
}

/* ---------- Page : Création de personnage ---------- */

function initCreationPersonnagePage() {
    const form = document.getElementById('creation-form');
    if (!form) return;

    const session = getSession();
    if (!session) { window.location.href = 'connexion.html'; return; }

    const previewRoot = document.getElementById('preview-stage');
    const nomInput = document.getElementById('nom');

    const state = {
        peau: SKIN_COLORS[0].hex,
        cheveux: HAIR_COLORS[0].hex,
        yeux: EYE_COLORS[0].hex
    };

    function refreshPreview() {
        updatePreview(previewRoot, { peau: state.peau, cheveux: state.cheveux, yeux: state.yeux, nom: nomInput.value });
    }

    renderSwatchGrid(document.getElementById('swatch-peau'), SKIN_COLORS, state.peau, hex => { state.peau = hex; refreshPreview(); });
    renderSwatchGrid(document.getElementById('swatch-cheveux'), HAIR_COLORS, state.cheveux, hex => { state.cheveux = hex; refreshPreview(); });
    renderSwatchGrid(document.getElementById('swatch-yeux'), EYE_COLORS, state.yeux, hex => { state.yeux = hex; refreshPreview(); });

    nomInput.addEventListener('input', refreshPreview);
    refreshPreview();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = document.getElementById('creation-message');
        const nomField = document.getElementById('field-nom');
        clearFieldError(nomField);

        const nom = nomInput.value.trim();
        if (nom.length < 2) {
            showFieldError(nomField, 'Le nom doit contenir au moins 2 caractères.');
            return;
        }
        if (findPersonnageByNom(nom)) {
            showFieldError(nomField, 'Ce nom de personnage est déjà utilisé.');
            return;
        }

        const personnages = getPersonnages();
        const newId = personnages.length ? Math.max(...personnages.map(p => p.id)) + 1 : 1;

        const nouveauPersonnage = {
            id: newId,
            nom,
            genre: document.getElementById('genre').value,
            proprietaire: session.pseudo,
            dateCreation: new Date().toISOString().slice(0, 10),
            partage: false,
            autorise: false,
            accent: state.yeux,
            formeVisage: document.getElementById('forme-visage').value,
            formeYeux: document.getElementById('forme-yeux').value,
            formeNez: document.getElementById('forme-nez').value,
            formeBouche: document.getElementById('forme-bouche').value,
            couleurPeau: labelForHex(SKIN_COLORS, state.peau),
            couleurCheveux: labelForHex(HAIR_COLORS, state.cheveux),
            couleurYeux: labelForHex(EYE_COLORS, state.yeux),
            couleurPeauHex: state.peau,
            couleurCheveuxHex: state.cheveux,
            couleurYeuxHex: state.yeux,
            arme: '', armure: '', vetement: '', accessoiresNoms: [],
            articlesIds: { arme: null, armure: null, vetement: null, accessoires: [] }
        };

        personnages.push(nouveauPersonnage);
        savePersonnages(personnages);
        addLog('Création de personnage', `${session.pseudo} a créé le personnage « ${nom} » (nom en attente de validation).`);

        showFormMessage(message, 'Votre personnage a été soumis avec succès. Il sera personnalisable dès que son nom aura été validé par notre équipe.', 'success');
        setTimeout(() => { window.location.href = 'espace.html'; }, 1100);
    });
}

/* ---------- Page : Mon Espace ---------- */

function statusPillsFor(p) {
    const pills = [p.autorise
        ? '<span class="status-pill validated">Nom validé</span>'
        : '<span class="status-pill pending">En attente de validation</span>'];
    if (p.partage) pills.push('<span class="status-pill shared">Partagé</span>');
    return pills.join(' ');
}

function renderMyCharacterCard(p) {
    return `
        <div class="glass-panel my-character-card" data-id="${p.id}">
            <div class="top-row">
                <div class="initials-sm" style="background:${p.accent}; box-shadow:0 0 12px ${p.accent}88;">${initials(p.nom)}</div>
                <div>
                    <h3 style="margin-bottom:0.2rem;">${escapeHtml(p.nom)}</h3>
                    <div>${statusPillsFor(p)}</div>
                </div>
            </div>
            <p style="font-size:0.8rem; margin-bottom:0;">${escapeHtml(p.genre)} — créé le ${formatDate(p.dateCreation)}</p>
            <div class="card-actions">
                <a href="edition-personnage.html?id=${p.id}" class="btn btn-outline">Gérer</a>
                <button type="button" class="btn btn-ghost" data-action="duplicate" data-id="${p.id}">Dupliquer</button>
                <button type="button" class="btn btn-danger" data-action="delete" data-id="${p.id}">Supprimer</button>
            </div>
        </div>
    `;
}

function initEspacePage() {
    const grid = document.getElementById('my-characters-grid');
    if (!grid) return;

    const session = getSession();
    if (!session) { window.location.href = 'connexion.html'; return; }

    const welcome = document.getElementById('espace-welcome');
    if (welcome) welcome.textContent = `Bienvenue, ${session.pseudo}`;

    function refresh() {
        const mine = getPersonnagesByProprietaire(session.pseudo);

        if (mine.length === 0) {
            grid.innerHTML = '<div class="empty-state">Vous n\'avez pas encore créé de personnage. Lancez-vous !</div>';
            return;
        }

        grid.innerHTML = mine.map(renderMyCharacterCard).join('');

        grid.querySelectorAll('[data-action="duplicate"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const original = getPersonnageById(btn.dataset.id);
                openModal('Dupliquer ce personnage', `
                    <p style="color:var(--stone-gray); font-size:0.85rem;">Choisissez un nouveau nom, unique, pour la copie de « ${escapeHtml(original.nom)} ».</p>
                    <div class="field" id="dup-field">
                        <label for="dup-name">Nouveau nom</label>
                        <input type="text" id="dup-name" value="${escapeHtml(original.nom)} (copie)">
                        <span class="field-error"></span>
                    </div>
                `, 'Dupliquer', () => {
                    const input = document.getElementById('dup-name');
                    const field = document.getElementById('dup-field');
                    clearFieldError(field);
                    const newName = input.value.trim();

                    if (newName.length < 2) { showFieldError(field, 'Le nom doit contenir au moins 2 caractères.'); return; }
                    if (findPersonnageByNom(newName)) { showFieldError(field, 'Ce nom est déjà utilisé.'); return; }

                    const list = getPersonnages();
                    const newId = Math.max(...list.map(p => p.id)) + 1;
                    const copy = Object.assign({}, original, {
                        id: newId, nom: newName, partage: false, autorise: false,
                        dateCreation: new Date().toISOString().slice(0, 10)
                    });
                    list.push(copy);
                    savePersonnages(list);
                    addLog('Duplication de personnage', `${session.pseudo} a dupliqué « ${original.nom} » en « ${newName} ».`);
                    closeModal();
                    refresh();
                });
            });
        });

        grid.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = getPersonnageById(btn.dataset.id);
                openModal('Supprimer ce personnage', `
                    <p style="color:var(--stone-gray);">Êtes-vous sûr de vouloir supprimer définitivement « ${escapeHtml(p.nom)} » ? Cette action est irréversible.</p>
                `, 'Supprimer', () => {
                    savePersonnages(getPersonnages().filter(x => String(x.id) !== String(p.id)));
                    saveCommentaires(getCommentaires().filter(c => String(c.personnageId) !== String(p.id)));
                    addLog('Suppression de personnage', `${session.pseudo} a supprimé « ${p.nom} ».`);
                    closeModal();
                    refresh();
                });
            });
        });
    }

    refresh();
}

/* ---------- Page : Édition / gestion d'un personnage ---------- */

function initEditionPersonnagePage() {
    const root = document.getElementById('edition-root');
    if (!root) return;

    const session = getSession();
    if (!session) { window.location.href = 'connexion.html'; return; }

    const id = qs('id');
    let personnage = getPersonnageById(id);

    if (!personnage || personnage.proprietaire !== session.pseudo) {
        root.innerHTML = `
            <div class="empty-state glass-panel">
                Ce personnage n'existe pas ou ne vous appartient pas.
                <div class="mt-2"><a class="btn btn-primary" href="espace.html">Retour à mon espace</a></div>
            </div>
        `;
        return;
    }

    renderEditionUI();

    function renderEditionUI() {
        personnage = getPersonnageById(id);
        document.title = `Gérer ${personnage.nom} — FantasyRealm Online`;

        const pendingBanner = !personnage.autorise ? `
            <div class="status-banner warning">
                Ce personnage est en attente de validation de son nom par notre équipe.
                L'ajout d'accessoires et le partage seront disponibles une fois le nom validé.
            </div>` : '';

        root.innerHTML = `
            ${pendingBanner}
            <div class="builder-layout">
                <div class="preview-stage" id="preview-stage">
                    <div class="preview-glow"></div>
                    <div class="preview-avatar">
                        <div class="preview-head"></div>
                        <div class="preview-body"></div>
                        <div class="preview-label"></div>
                    </div>
                </div>

                <div>
                    <div class="glass-panel" style="padding:1.75rem; margin-bottom:1.5rem;">
                        <h2 style="font-size:1rem;">Traits du personnage</h2>
                        <form id="traits-form">
                            <div class="field" id="field-edit-nom">
                                <label for="edit-nom">Nom</label>
                                <input type="text" id="edit-nom" value="${escapeHtml(personnage.nom)}">
                                <span class="field-error"></span>
                            </div>
                            ${selectField('edit-genre', 'Genre', GENRES, personnage.genre)}
                            ${selectField('edit-forme-visage', 'Forme du visage', FORMES_VISAGE, personnage.formeVisage)}
                            ${selectField('edit-forme-yeux', 'Forme des yeux', FORMES_YEUX, personnage.formeYeux)}
                            ${selectField('edit-forme-nez', 'Forme du nez', FORMES_NEZ, personnage.formeNez)}
                            ${selectField('edit-forme-bouche', 'Forme de la bouche', FORMES_BOUCHE, personnage.formeBouche)}
                            <div class="swatch-group">
                                <label>Couleur de peau</label>
                                <div class="swatch-grid" id="edit-swatch-peau"></div>
                            </div>
                            <div class="swatch-group">
                                <label>Couleur des cheveux</label>
                                <div class="swatch-grid" id="edit-swatch-cheveux"></div>
                            </div>
                            <div class="swatch-group">
                                <label>Couleur des yeux</label>
                                <div class="swatch-grid" id="edit-swatch-yeux"></div>
                            </div>
                            <button type="submit" class="btn btn-primary">Enregistrer les modifications</button>
                        </form>
                    </div>

                    ${personnage.autorise ? `
                    <div class="glass-panel" style="padding:1.75rem; margin-bottom:1.5rem;">
                        <h2 style="font-size:1rem;">Équipement</h2>
                        <ul class="equipped-summary" id="equipped-summary"></ul>
                        <div class="type-tabs" id="type-tabs"></div>
                        <div class="article-grid" id="article-grid"></div>
                    </div>` : ''}

                    <div class="glass-panel" style="padding:1.75rem; display:flex; gap:1rem; flex-wrap:wrap;">
                        ${personnage.autorise ? '<button type="button" class="btn btn-primary" id="toggle-share-btn"></button>' : ''}
                        <button type="button" class="btn btn-outline" id="duplicate-btn">Dupliquer ce personnage</button>
                        <button type="button" class="btn btn-danger" id="delete-btn">Supprimer ce personnage</button>
                    </div>
                </div>
            </div>
        `;

        wireTraitsForm();
        if (personnage.autorise) {
            wireEquipment();
            wireShareToggle();
        }
        wireDuplicateAndDelete();
    }

    function wireTraitsForm() {
        const form = document.getElementById('traits-form');
        const previewRoot = document.getElementById('preview-stage');
        const nomInput = document.getElementById('edit-nom');

        const colorState = {
            peau: personnage.couleurPeauHex || hexForLabel(SKIN_COLORS, personnage.couleurPeau),
            cheveux: personnage.couleurCheveuxHex || hexForLabel(HAIR_COLORS, personnage.couleurCheveux),
            yeux: personnage.couleurYeuxHex || hexForLabel(EYE_COLORS, personnage.couleurYeux)
        };

        function refreshPreview() {
            updatePreview(previewRoot, { peau: colorState.peau, cheveux: colorState.cheveux, yeux: colorState.yeux, nom: nomInput.value });
        }

        renderSwatchGrid(document.getElementById('edit-swatch-peau'), SKIN_COLORS, colorState.peau, hex => { colorState.peau = hex; refreshPreview(); });
        renderSwatchGrid(document.getElementById('edit-swatch-cheveux'), HAIR_COLORS, colorState.cheveux, hex => { colorState.cheveux = hex; refreshPreview(); });
        renderSwatchGrid(document.getElementById('edit-swatch-yeux'), EYE_COLORS, colorState.yeux, hex => { colorState.yeux = hex; refreshPreview(); });

        nomInput.addEventListener('input', refreshPreview);
        refreshPreview();

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const nomField = document.getElementById('field-edit-nom');
            clearFieldError(nomField);

            const newNom = nomInput.value.trim();
            if (newNom.length < 2) { showFieldError(nomField, 'Le nom doit contenir au moins 2 caractères.'); return; }
            if (findPersonnageByNom(newNom, personnage.id)) { showFieldError(nomField, 'Ce nom est déjà utilisé par un autre personnage.'); return; }

            const list = getPersonnages();
            const idx = list.findIndex(p => String(p.id) === String(personnage.id));
            const nameChanged = list[idx].nom !== newNom;

            list[idx] = Object.assign({}, list[idx], {
                nom: newNom,
                genre: document.getElementById('edit-genre').value,
                formeVisage: document.getElementById('edit-forme-visage').value,
                formeYeux: document.getElementById('edit-forme-yeux').value,
                formeNez: document.getElementById('edit-forme-nez').value,
                formeBouche: document.getElementById('edit-forme-bouche').value,
                couleurPeau: labelForHex(SKIN_COLORS, colorState.peau),
                couleurCheveux: labelForHex(HAIR_COLORS, colorState.cheveux),
                couleurYeux: labelForHex(EYE_COLORS, colorState.yeux),
                couleurPeauHex: colorState.peau,
                couleurCheveuxHex: colorState.cheveux,
                couleurYeuxHex: colorState.yeux,
                accent: colorState.yeux
            });

            if (nameChanged) {
                list[idx].autorise = false;
                list[idx].partage = false;
            }

            savePersonnages(list);
            addLog('Modification de personnage', `${session.pseudo} a modifié les traits de « ${newNom} ».`);
            renderEditionUI();
        });
    }

    function wireEquipment() {
        const articles = getArticles().filter(a => a.actif);
        const types = ['arme', 'armure', 'vetement', 'accessoire'];
        let activeType = 'arme';

        const tabsEl = document.getElementById('type-tabs');
        const gridEl = document.getElementById('article-grid');
        const summaryEl = document.getElementById('equipped-summary');

        tabsEl.innerHTML = types.map(t => `<button type="button" class="type-tab ${t === activeType ? 'active' : ''}" data-type="${t}">${ARTICLE_TYPE_LABELS[t]}</button>`).join('');

        function currentIds() {
            personnage.articlesIds = personnage.articlesIds || { arme: null, armure: null, vetement: null, accessoires: [] };
            return personnage.articlesIds;
        }

        function renderSummary() {
            const ids = currentIds();
            const chips = [];
            ['arme', 'armure', 'vetement'].forEach(t => {
                if (ids[t]) { const a = getArticleById(ids[t]); if (a) chips.push({ type: t, id: a.id, nom: a.nom }); }
            });
            (ids.accessoires || []).forEach(aid => { const a = getArticleById(aid); if (a) chips.push({ type: 'accessoire', id: a.id, nom: a.nom }); });

            summaryEl.innerHTML = chips.length
                ? chips.map(c => `<li>${escapeHtml(c.nom)} <button type="button" data-remove-type="${c.type}" data-remove-id="${c.id}" aria-label="Retirer">✕</button></li>`).join('')
                : '<li style="background:none; border:none; color:var(--stone-gray);">Aucun équipement pour l\'instant.</li>';

            summaryEl.querySelectorAll('[data-remove-type]').forEach(btn => {
                btn.addEventListener('click', () => toggleEquip(btn.dataset.removeType, parseInt(btn.dataset.removeId, 10), true));
            });
        }

        function renderGrid() {
            const filtered = articles.filter(a => a.type === activeType);
            const ids = currentIds();

            gridEl.innerHTML = filtered.map(a => {
                const isEquipped = activeType === 'accessoire' ? (ids.accessoires || []).includes(a.id) : ids[activeType] === a.id;
                return `
                    <div class="glass-panel article-card ${isEquipped ? 'equipped' : ''}" data-id="${a.id}">
                        <div class="article-swatch" style="background:${a.accent};"></div>
                        <div class="name">${escapeHtml(a.nom)}</div>
                        <div class="equip-state">${isEquipped ? 'Équipé ✓' : 'Cliquer pour équiper'}</div>
                    </div>
                `;
            }).join('');

            gridEl.querySelectorAll('.article-card').forEach(card => {
                card.addEventListener('click', () => {
                    const aid = parseInt(card.dataset.id, 10);
                    const ids2 = currentIds();
                    const currentlyEquipped = activeType === 'accessoire' ? (ids2.accessoires || []).includes(aid) : ids2[activeType] === aid;
                    toggleEquip(activeType, aid, currentlyEquipped);
                });
            });
        }

        function toggleEquip(type, articleId, removing) {
            const list = getPersonnages();
            const idx = list.findIndex(p => String(p.id) === String(personnage.id));
            const p = list[idx];
            p.articlesIds = p.articlesIds || { arme: null, armure: null, vetement: null, accessoires: [] };
            const article = getArticleById(articleId);

            if (type === 'accessoire') {
                p.articlesIds.accessoires = p.articlesIds.accessoires || [];
                p.articlesIds.accessoires = removing
                    ? p.articlesIds.accessoires.filter(x => x !== articleId)
                    : [...p.articlesIds.accessoires, articleId];
                p.accessoiresNoms = p.articlesIds.accessoires.map(aid => (getArticleById(aid) || {}).nom).filter(Boolean);
            } else {
                p.articlesIds[type] = removing ? null : articleId;
                p[type] = removing ? '' : (article ? article.nom : '');
            }

            savePersonnages(list);
            personnage = p;
            addLog('Modification d\'équipement', `${session.pseudo} a ${removing ? 'retiré' : 'équipé'} « ${article ? article.nom : ''} » sur « ${p.nom} ».`);
            renderSummary();
            renderGrid();
        }

        tabsEl.querySelectorAll('.type-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                activeType = btn.dataset.type;
                tabsEl.querySelectorAll('.type-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderGrid();
            });
        });

        renderSummary();
        renderGrid();
    }

    function wireShareToggle() {
        const btn = document.getElementById('toggle-share-btn');
        function refreshLabel() { btn.textContent = personnage.partage ? 'Arrêter le partage' : 'Partager'; }
        refreshLabel();

        btn.addEventListener('click', () => {
            const list = getPersonnages();
            const idx = list.findIndex(p => String(p.id) === String(personnage.id));
            list[idx].partage = !list[idx].partage;
            savePersonnages(list);
            personnage = list[idx];
            addLog('Partage de personnage', `${session.pseudo} a ${personnage.partage ? 'partagé' : 'retiré le partage de'} « ${personnage.nom} ».`);
            refreshLabel();
        });
    }

    function wireDuplicateAndDelete() {
        document.getElementById('duplicate-btn').addEventListener('click', () => {
            openModal('Dupliquer ce personnage', `
                <div class="field" id="dup-field2">
                    <label for="dup-name2">Nouveau nom</label>
                    <input type="text" id="dup-name2" value="${escapeHtml(personnage.nom)} (copie)">
                    <span class="field-error"></span>
                </div>
            `, 'Dupliquer', () => {
                const input = document.getElementById('dup-name2');
                const field = document.getElementById('dup-field2');
                clearFieldError(field);
                const newName = input.value.trim();

                if (newName.length < 2) { showFieldError(field, 'Le nom doit contenir au moins 2 caractères.'); return; }
                if (findPersonnageByNom(newName)) { showFieldError(field, 'Ce nom est déjà utilisé.'); return; }

                const list = getPersonnages();
                const newId = Math.max(...list.map(p => p.id)) + 1;
                const copy = Object.assign({}, personnage, {
                    id: newId, nom: newName, partage: false, autorise: false,
                    dateCreation: new Date().toISOString().slice(0, 10)
                });
                list.push(copy);
                savePersonnages(list);
                addLog('Duplication de personnage', `${session.pseudo} a dupliqué « ${personnage.nom} » en « ${newName} ».`);
                closeModal();
                window.location.href = 'espace.html';
            });
        });

        document.getElementById('delete-btn').addEventListener('click', () => {
            openModal('Supprimer ce personnage', `
                <p style="color:var(--stone-gray);">Êtes-vous sûr de vouloir supprimer définitivement « ${escapeHtml(personnage.nom)} » ? Cette action est irréversible.</p>
            `, 'Supprimer', () => {
                savePersonnages(getPersonnages().filter(x => String(x.id) !== String(personnage.id)));
                saveCommentaires(getCommentaires().filter(c => String(c.personnageId) !== String(personnage.id)));
                addLog('Suppression de personnage', `${session.pseudo} a supprimé « ${personnage.nom} ».`);
                closeModal();
                window.location.href = 'espace.html';
            });
        });
    }
}

/* ---------- Page : Back-office (Employé / Administrateur) ---------- */

function initBackofficePage() {
    const root = document.getElementById('backoffice-root');
    if (!root) return;

    const session = getSession();
    if (!session) { window.location.href = 'connexion.html'; return; }

    if (session.role !== 'employe' && session.role !== 'admin') {
        root.innerHTML = `
            <div class="access-denied glass-panel">
                <h2 style="font-size:1.1rem;">Accès réservé</h2>
                <p>Cette section est réservée à l'équipe PixelVerse Studios (employés et administrateurs).</p>
                <a href="index.html" class="btn btn-primary">Retour à l'accueil</a>
            </div>
        `;
        return;
    }

    const isAdmin = session.role === 'admin';
    const tabs = [
        { id: 'noms', label: 'Noms à valider' },
        { id: 'avis', label: 'Avis à modérer' },
        { id: 'articles', label: "Bibliothèque d'articles" },
        { id: 'utilisateurs', label: 'Comptes utilisateurs' }
    ];
    if (isAdmin) {
        tabs.push({ id: 'employes', label: 'Comptes employés' });
        tabs.push({ id: 'logs', label: "Logs d'activité" });
    }

    let activeTab = 'noms';

    root.innerHTML = `
        <div class="dashboard-head">
            <div>
                <h2 style="margin-bottom:0.3rem;">Back-office <span class="role-badge">${isAdmin ? 'Administrateur' : 'Employé'}</span></h2>
                <p style="margin-bottom:0;">Connecté en tant que ${escapeHtml(session.pseudo)}</p>
            </div>
        </div>
        <div id="backoffice-message" class="form-message" style="max-width:none;"></div>
        <div class="type-tabs" id="backoffice-tabs"></div>
        <div id="backoffice-content"></div>
    `;

    const tabsEl = document.getElementById('backoffice-tabs');
    const contentEl = document.getElementById('backoffice-content');
    const messageEl = document.getElementById('backoffice-message');

    function flashMessage(text) {
        showFormMessage(messageEl, text, 'success');
        setTimeout(() => { messageEl.className = 'form-message'; }, 4500);
    }

    function renderTabs() {
        tabsEl.innerHTML = tabs.map(t => `<button type="button" class="type-tab ${t.id === activeTab ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`).join('');
        tabsEl.querySelectorAll('.type-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                activeTab = btn.dataset.tab;
                renderTabs();
                renderContent();
            });
        });
    }

    function renderContent() {
        if (activeTab === 'noms') renderNomsTab();
        else if (activeTab === 'avis') renderAvisTab();
        else if (activeTab === 'articles') renderArticlesTab();
        else if (activeTab === 'utilisateurs') renderUtilisateursTab();
        else if (activeTab === 'employes' && isAdmin) renderEmployesTab();
        else if (activeTab === 'logs' && isAdmin) renderLogsTab();
    }

    /* ---- Onglet : Noms à valider ---- */
    function renderNomsTab() {
        const pending = getPersonnages().filter(p => !p.autorise);
        if (pending.length === 0) {
            contentEl.innerHTML = '<div class="glass-panel mod-empty">Aucun nom en attente de validation.</div>';
            return;
        }
        contentEl.innerHTML = `<div class="glass-panel mod-list">${pending.map(p => `
            <div class="mod-row">
                <div class="info">
                    <h4>${escapeHtml(p.nom)}</h4>
                    <p class="meta">Proposé par <strong style="color:var(--epic-gold);">${escapeHtml(p.proprietaire)}</strong> — ${escapeHtml(p.genre)} — le ${formatDate(p.dateCreation)}</p>
                </div>
                <div class="actions">
                    <button type="button" class="btn btn-primary" data-approve="${p.id}">Approuver</button>
                    <button type="button" class="btn btn-danger" data-reject="${p.id}">Rejeter</button>
                </div>
            </div>
        `).join('')}</div>`;

        contentEl.querySelectorAll('[data-approve]').forEach(btn => {
            btn.addEventListener('click', () => {
                const list = getPersonnages();
                const idx = list.findIndex(p => String(p.id) === String(btn.dataset.approve));
                list[idx].autorise = true;
                savePersonnages(list);
                addLog('Validation de nom', `${session.pseudo} a approuvé le nom « ${list[idx].nom} ».`);
                flashMessage(`Nom approuvé. E-mail de confirmation envoyé à ${list[idx].proprietaire} (simulation).`);
                renderNomsTab();
            });
        });

        contentEl.querySelectorAll('[data-reject]').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = getPersonnageById(btn.dataset.reject);
                openModal('Rejeter ce nom de personnage', `
                    <p style="color:var(--stone-gray); font-size:0.85rem;">Le personnage « ${escapeHtml(p.nom)} » sera supprimé définitivement. Un motif est obligatoire ; il sera transmis par e-mail à ${escapeHtml(p.proprietaire)}.</p>
                    <div class="field" id="reject-field">
                        <label for="reject-reason">Motif du rejet</label>
                        <textarea id="reject-reason" rows="3" placeholder="Ex : nom inapproprié..."></textarea>
                        <span class="field-error"></span>
                    </div>
                `, 'Rejeter et supprimer', () => {
                    const field = document.getElementById('reject-field');
                    clearFieldError(field);
                    const reason = document.getElementById('reject-reason').value.trim();
                    if (!reason) { showFieldError(field, 'Le motif est obligatoire.'); return; }

                    savePersonnages(getPersonnages().filter(x => String(x.id) !== String(p.id)));
                    saveCommentaires(getCommentaires().filter(c => String(c.personnageId) !== String(p.id)));
                    addLog('Rejet de nom', `${session.pseudo} a rejeté et supprimé « ${p.nom} ». Motif : ${reason}`);
                    closeModal();
                    flashMessage(`Personnage rejeté et supprimé. E-mail avec motif envoyé à ${p.proprietaire} (simulation).`);
                    renderNomsTab();
                });
            });
        });
    }

    /* ---- Onglet : Avis à modérer ---- */
    function renderAvisTab() {
        const pending = getCommentaires().filter(c => c.statut === 'attente');
        if (pending.length === 0) {
            contentEl.innerHTML = '<div class="glass-panel mod-empty">Aucun avis en attente de modération.</div>';
            return;
        }
        contentEl.innerHTML = `<div class="glass-panel mod-list">${pending.map(c => {
            const p = getPersonnageById(c.personnageId);
            return `
            <div class="mod-row">
                <div class="info">
                    <h4>${escapeHtml(c.pseudo)} <span class="stars">${'★'.repeat(c.note)}${'☆'.repeat(5 - c.note)}</span></h4>
                    <p class="meta">Sur le personnage « ${p ? escapeHtml(p.nom) : 'Inconnu'} » — le ${formatDate(c.date)}</p>
                    <p class="comment-text">${escapeHtml(c.commentaire)}</p>
                </div>
                <div class="actions">
                    <button type="button" class="btn btn-primary" data-approve-c="${c.id}">Approuver</button>
                    <button type="button" class="btn btn-danger" data-reject-c="${c.id}">Refuser</button>
                </div>
            </div>`;
        }).join('')}</div>`;

        contentEl.querySelectorAll('[data-approve-c]').forEach(btn => {
            btn.addEventListener('click', () => {
                const list = getCommentaires();
                const idx = list.findIndex(c => String(c.id) === String(btn.dataset.approveC));
                list[idx].statut = 'approuve';
                saveCommentaires(list);
                const p = getPersonnageById(list[idx].personnageId);
                addLog("Validation d'avis", `${session.pseudo} a approuvé un avis de ${list[idx].pseudo} sur « ${p ? p.nom : ''} ».`);
                flashMessage(`Avis approuvé. E-mail envoyé à ${p ? p.proprietaire : ''} (simulation).`);
                renderAvisTab();
            });
        });

        contentEl.querySelectorAll('[data-reject-c]').forEach(btn => {
            btn.addEventListener('click', () => {
                const list = getCommentaires();
                const idx = list.findIndex(c => String(c.id) === String(btn.dataset.rejectC));
                list[idx].statut = 'refuse';
                saveCommentaires(list);
                addLog("Refus d'avis", `${session.pseudo} a refusé un avis de ${list[idx].pseudo}.`);
                flashMessage('Avis refusé.');
                renderAvisTab();
            });
        });
    }

    /* ---- Onglet : Bibliothèque d'articles ---- */
    function renderArticlesTab() {
        const articles = getArticles();
        contentEl.innerHTML = `
            <div class="add-article-toggle"><button type="button" class="btn btn-primary" id="show-add-article">+ Ajouter un article</button></div>
            <div id="add-article-panel" class="glass-panel form-panel wide" style="display:none; margin-bottom:2rem;">
                <h3 style="margin-bottom:1rem;">Nouvel article</h3>
                <form id="add-article-form">
                    <div class="field">
                        <label for="new-article-nom">Nom</label>
                        <input type="text" id="new-article-nom" required>
                    </div>
                    <div class="field">
                        <label for="new-article-type">Type</label>
                        <select id="new-article-type">
                            <option value="arme">Arme</option>
                            <option value="armure">Armure</option>
                            <option value="vetement">Vêtement</option>
                            <option value="accessoire">Accessoire</option>
                        </select>
                    </div>
                    <div class="field">
                        <label for="new-article-color">Couleur (représentation visuelle)</label>
                        <input type="color" id="new-article-color" value="#00F0FF" style="height:44px; padding:4px;">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%;">Ajouter à la bibliothèque</button>
                </form>
            </div>
            <div class="article-grid" id="admin-article-grid"></div>
        `;

        document.getElementById('show-add-article').addEventListener('click', () => {
            const panel = document.getElementById('add-article-panel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });

        document.getElementById('add-article-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const nom = document.getElementById('new-article-nom').value.trim();
            if (!nom) return;
            const type = document.getElementById('new-article-type').value;
            const accent = document.getElementById('new-article-color').value;

            const list = getArticles();
            const newId = Math.max(0, ...list.map(a => a.id)) + 1;
            list.push({ id: newId, nom, type, actif: true, accent });
            saveArticles(list);
            addLog("Ajout d'article", `${session.pseudo} a ajouté « ${nom} » (${ARTICLE_TYPE_LABELS[type]}) à la bibliothèque.`);
            flashMessage(`Article « ${nom} » ajouté à la bibliothèque.`);
            renderArticlesTab();
        });

        const gridEl = document.getElementById('admin-article-grid');
        gridEl.innerHTML = articles.map(a => `
            <div class="glass-panel article-card" style="cursor:default;">
                <div class="article-swatch" style="background:${a.accent};"></div>
                <div class="name">${escapeHtml(a.nom)}</div>
                <div class="equip-state">${ARTICLE_TYPE_LABELS[a.type]} — ${a.actif ? 'Actif' : 'Désactivé'}</div>
                <div class="card-actions" style="justify-content:center; margin-top:0.8rem;">
                    <button type="button" class="btn btn-outline" data-toggle-article="${a.id}">${a.actif ? 'Désactiver' : 'Réactiver'}</button>
                    <button type="button" class="btn btn-danger" data-delete-article="${a.id}">Supprimer</button>
                </div>
            </div>
        `).join('');

        gridEl.querySelectorAll('[data-toggle-article]').forEach(btn => {
            btn.addEventListener('click', () => {
                const list = getArticles();
                const idx = list.findIndex(a => String(a.id) === String(btn.dataset.toggleArticle));
                list[idx].actif = !list[idx].actif;
                saveArticles(list);
                addLog("Modification d'article", `${session.pseudo} a ${list[idx].actif ? 'réactivé' : 'désactivé'} « ${list[idx].nom} ».`);
                renderArticlesTab();
            });
        });

        gridEl.querySelectorAll('[data-delete-article]').forEach(btn => {
            btn.addEventListener('click', () => {
                const a = getArticles().find(x => String(x.id) === String(btn.dataset.deleteArticle));
                openModal('Supprimer cet article', `<p style="color:var(--stone-gray);">Supprimer définitivement « ${escapeHtml(a.nom)} » de la bibliothèque ?</p>`, 'Supprimer', () => {
                    saveArticles(getArticles().filter(x => String(x.id) !== String(a.id)));
                    addLog("Suppression d'article", `${session.pseudo} a supprimé « ${a.nom} » de la bibliothèque.`);
                    closeModal();
                    renderArticlesTab();
                });
            });
        });
    }

    /* ---- Onglet : Comptes utilisateurs ---- */
    function renderUtilisateursTab() {
        const users = getUsersByRole('user');
        if (users.length === 0) {
            contentEl.innerHTML = '<div class="glass-panel mod-empty">Aucun compte joueur pour le moment.</div>';
            return;
        }
        contentEl.innerHTML = `<div class="glass-panel mod-list">${users.map(u => `
            <div class="mod-row">
                <div class="info">
                    <h4>${escapeHtml(u.pseudo)} ${u.suspendu ? '<span class="status-pill pending">Suspendu</span>' : '<span class="status-pill validated">Actif</span>'}</h4>
                    <p class="meta">${escapeHtml(u.email)}</p>
                </div>
                <div class="actions">
                    <button type="button" class="btn btn-outline" data-toggle-suspend="${escapeHtml(u.email)}">${u.suspendu ? 'Réactiver' : 'Suspendre'}</button>
                    <button type="button" class="btn btn-danger" data-delete-user="${escapeHtml(u.email)}">Supprimer</button>
                </div>
            </div>
        `).join('')}</div>`;

        contentEl.querySelectorAll('[data-toggle-suspend]').forEach(btn => {
            btn.addEventListener('click', () => {
                const email = btn.dataset.toggleSuspend;
                const list = getUsers();
                const idx = list.findIndex(u => u.email === email);
                list[idx].suspendu = !list[idx].suspendu;
                saveUsers(list);
                addLog('Compte joueur', `${session.pseudo} a ${list[idx].suspendu ? 'suspendu' : 'réactivé'} le compte de ${list[idx].pseudo}.`);
                renderUtilisateursTab();
            });
        });

        contentEl.querySelectorAll('[data-delete-user]').forEach(btn => {
            btn.addEventListener('click', () => {
                const email = btn.dataset.deleteUser;
                const u = findUserByEmail(email);
                openModal('Supprimer ce compte', `<p style="color:var(--stone-gray);">Supprimer définitivement le compte de « ${escapeHtml(u.pseudo)} » ? Ses personnages seront également supprimés.</p>`, 'Supprimer', () => {
                    const theirCharacterIds = getPersonnagesByProprietaire(u.pseudo).map(p => p.id);
                    saveUsers(getUsers().filter(x => x.email !== email));
                    savePersonnages(getPersonnages().filter(p => p.proprietaire !== u.pseudo));
                    saveCommentaires(getCommentaires().filter(c => !theirCharacterIds.includes(c.personnageId)));
                    addLog('Suppression de compte', `${session.pseudo} a supprimé le compte de ${u.pseudo} et ses personnages.`);
                    closeModal();
                    renderUtilisateursTab();
                });
            });
        });
    }

    /* ---- Onglet : Comptes employés (admin uniquement) ---- */
    function renderEmployesTab() {
        const employes = getUsersByRole('employe');
        contentEl.innerHTML = `
            <div class="add-article-toggle"><button type="button" class="btn btn-primary" id="show-add-employe">+ Créer un compte employé</button></div>
            <div id="add-employe-panel" class="glass-panel form-panel wide" style="display:none; margin-bottom:2rem;">
                <h3 style="margin-bottom:1rem;">Nouveau compte employé</h3>
                <div id="add-employe-message" class="form-message"></div>
                <form id="add-employe-form">
                    <div class="field" id="field-emp-email">
                        <label for="emp-email">Adresse e-mail</label>
                        <input type="email" id="emp-email" required>
                        <span class="field-error"></span>
                    </div>
                    <div class="field" id="field-emp-pseudo">
                        <label for="emp-pseudo">Pseudo</label>
                        <input type="text" id="emp-pseudo" required>
                        <span class="field-error"></span>
                    </div>
                    <div class="field" id="field-emp-password">
                        <label for="emp-password">Mot de passe</label>
                        <input type="password" id="emp-password" required>
                        <small class="hint">8 caractères min., majuscule, minuscule, chiffre, caractère spécial.</small>
                        <span class="field-error"></span>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%;">Créer le compte</button>
                </form>
            </div>
            <div class="glass-panel mod-list" id="employes-list"></div>
        `;

        document.getElementById('show-add-employe').addEventListener('click', () => {
            const panel = document.getElementById('add-employe-panel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });

        document.getElementById('add-employe-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const emailField = document.getElementById('field-emp-email');
            const pseudoField = document.getElementById('field-emp-pseudo');
            const passField = document.getElementById('field-emp-password');
            [emailField, pseudoField, passField].forEach(clearFieldError);

            const email = document.getElementById('emp-email').value.trim();
            const pseudo = document.getElementById('emp-pseudo').value.trim();
            const password = document.getElementById('emp-password').value;
            let hasError = false;

            if (!EMAIL_RULE.test(email)) { showFieldError(emailField, 'E-mail invalide.'); hasError = true; }
            else if (findUserByEmail(email)) { showFieldError(emailField, 'Cet e-mail est déjà utilisé.'); hasError = true; }

            if (pseudo.length < 3) { showFieldError(pseudoField, 'Pseudo trop court.'); hasError = true; }
            else if (findUserByPseudo(pseudo)) { showFieldError(pseudoField, 'Ce pseudo est déjà pris.'); hasError = true; }

            if (!PASSWORD_RULE.test(password)) { showFieldError(passField, '8 caractères min., une majuscule, une minuscule, un chiffre, un caractère spécial.'); hasError = true; }

            if (hasError) return;

            const list = getUsers();
            list.push({ email, pseudo, password, role: 'employe', suspendu: false });
            saveUsers(list);
            addLog('Création de compte employé', `${session.pseudo} a créé le compte employé de ${pseudo}.`);
            flashMessage(`Compte employé de ${pseudo} créé avec succès.`);
            renderEmployesTab();
        });

        const listEl = document.getElementById('employes-list');
        listEl.innerHTML = employes.length ? employes.map(u => `
            <div class="mod-row">
                <div class="info">
                    <h4>${escapeHtml(u.pseudo)} ${u.suspendu ? '<span class="status-pill pending">Suspendu</span>' : '<span class="status-pill validated">Actif</span>'}</h4>
                    <p class="meta">${escapeHtml(u.email)}</p>
                </div>
                <div class="actions">
                    <button type="button" class="btn btn-outline" data-reset-pass="${escapeHtml(u.email)}">Changer le mot de passe</button>
                    <button type="button" class="btn btn-outline" data-toggle-suspend-emp="${escapeHtml(u.email)}">${u.suspendu ? 'Réactiver' : 'Suspendre'}</button>
                    <button type="button" class="btn btn-danger" data-delete-emp="${escapeHtml(u.email)}">Supprimer</button>
                </div>
            </div>
        `).join('') : '<div class="mod-empty">Aucun compte employé pour le moment.</div>';

        listEl.querySelectorAll('[data-reset-pass]').forEach(btn => {
            btn.addEventListener('click', () => {
                const email = btn.dataset.resetPass;
                openModal('Modifier le mot de passe', `
                    <div class="field" id="new-pass-field">
                        <label for="new-pass-input">Nouveau mot de passe</label>
                        <input type="password" id="new-pass-input">
                        <small class="hint">8 caractères min., majuscule, minuscule, chiffre, caractère spécial.</small>
                        <span class="field-error"></span>
                    </div>
                `, 'Enregistrer', () => {
                    const field = document.getElementById('new-pass-field');
                    clearFieldError(field);
                    const newPass = document.getElementById('new-pass-input').value;
                    if (!PASSWORD_RULE.test(newPass)) { showFieldError(field, 'Mot de passe non conforme.'); return; }

                    const list = getUsers();
                    const idx = list.findIndex(u => u.email === email);
                    list[idx].password = newPass;
                    saveUsers(list);
                    addLog('Modification de mot de passe', `${session.pseudo} a modifié le mot de passe du compte employé ${list[idx].pseudo}.`);
                    closeModal();
                    flashMessage('Mot de passe mis à jour.');
                    renderEmployesTab();
                });
            });
        });

        listEl.querySelectorAll('[data-toggle-suspend-emp]').forEach(btn => {
            btn.addEventListener('click', () => {
                const email = btn.dataset.toggleSuspendEmp;
                const list = getUsers();
                const idx = list.findIndex(u => u.email === email);
                list[idx].suspendu = !list[idx].suspendu;
                saveUsers(list);
                addLog('Compte employé', `${session.pseudo} a ${list[idx].suspendu ? 'suspendu' : 'réactivé'} le compte employé de ${list[idx].pseudo}.`);
                renderEmployesTab();
            });
        });

        listEl.querySelectorAll('[data-delete-emp]').forEach(btn => {
            btn.addEventListener('click', () => {
                const email = btn.dataset.deleteEmp;
                const u = findUserByEmail(email);
                openModal('Supprimer ce compte employé', `<p style="color:var(--stone-gray);">Supprimer définitivement le compte employé de « ${escapeHtml(u.pseudo)} » ?</p>`, 'Supprimer', () => {
                    saveUsers(getUsers().filter(x => x.email !== email));
                    addLog('Suppression de compte employé', `${session.pseudo} a supprimé le compte employé de ${u.pseudo}.`);
                    closeModal();
                    renderEmployesTab();
                });
            });
        });
    }

    /* ---- Onglet : Logs d'activité (admin uniquement) ---- */
    function renderLogsTab() {
        const logs = getLogs();
        if (logs.length === 0) {
            contentEl.innerHTML = '<div class="glass-panel mod-empty">Aucune activité enregistrée pour le moment.</div>';
            return;
        }
        contentEl.innerHTML = `<div class="glass-panel" style="padding:0;">${logs.map(l => `
            <div class="log-entry">
                <span class="log-date">${new Date(l.date).toLocaleString('fr-FR')}</span>
                <span class="log-action">${escapeHtml(l.action)}</span>
                <span>${escapeHtml(l.details)}</span>
            </div>
        `).join('')}</div>`;
    }

    renderTabs();
    renderContent();
}

/* ---------- Réinitialisation manuelle des données de démo ---------- */

function initResetLink() {
    const link = document.getElementById('reset-data-link');
    if (!link) return;

    link.addEventListener('click', (e) => {
        e.preventDefault();
        const confirmed = window.confirm(
            'Réinitialiser toutes les données de démonstration (comptes, personnages, avis, bibliothèque d\'articles) ? Cette action est irréversible et vous serez déconnecté.'
        );
        if (!confirmed) return;

        Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
        localStorage.removeItem('fr_data_version');
        window.location.href = 'index.html';
    });
}

/* ---------- Initialisation générale ---------- */

document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initResetLink();
    initInscriptionPage();
    initConnexionPage();
    initContactPage();
    initPersonnagesPage();
    initPersonnagePage();
    initCreationPersonnagePage();
    initEspacePage();
    initEditionPersonnagePage();
    initBackofficePage();
});
