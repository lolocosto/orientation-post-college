/**
 * @file gestion_params.js
 * @description Panneau de paramètres — navigation menu/section avec slide (v0.45).
 *
 * Architecture :
 *   - settingsOpenSection(id) — glisse vers la section demandée
 *   - settingsGoBack()        — revient au menu
 *   - toggleSettings()        — ouvre/ferme le panneau
 *
 * Règle de séparation (v0.45) : toutes les lectures/écritures de préférences
 * passent par `_prefLire` / `_prefSauver` qui délèguent à DatabaseService si
 * disponible, sinon tombent sur localStorage en compatibilité.
 */

'use strict';

// ══════════════════════════════════════════════════════════
// COUCHE D'ABSTRACTION PRÉFÉRENCES (v0.45)
// ══════════════════════════════════════════════════════════

/**
 * Lit une préférence utilisateur.
 * Délègue à DatabaseService.lirePreference() si disponible, sinon localStorage.
 * @param {string} cle
 * @returns {string|null}
 * @private
 */
function _prefLire(cle) {
    if (window.databaseService?.lirePreference) {
        return window.databaseService.lirePreference(cle);
    }
    return localStorage.getItem(cle);
}

/**
 * Sauvegarde une préférence utilisateur.
 * Délègue à DatabaseService.sauvegarderPreference() si disponible, sinon localStorage.
 * @param {string} cle
 * @param {string|null} valeur - null pour supprimer la clé.
 * @returns {void}
 * @private
 */
function _prefSauver(cle, valeur) {
    if (window.databaseService?.sauvegarderPreference) {
        window.databaseService.sauvegarderPreference(cle, valeur);
    }
    // Toujours écrire aussi en localStorage pour compatibilité v0.44
    if (valeur === null) localStorage.removeItem(cle);
    else localStorage.setItem(cle, valeur);
    // v0.56 — auto-sauvegarde chiffrée en arrière-plan
    if (window.PreferencesCryptoService) {
        window.PreferencesCryptoService.autoSave().catch(() => {});
    }
}

/**
 * Supprime une préférence utilisateur.
 * @param {string} cle
 * @returns {void}
 * @private
 */
function _prefSupprimer(cle) {
    _prefSauver(cle, null);
}

// ══════════════════════════════════════════════════════════
// NAVIGATION MENU ↔ SECTION
// ══════════════════════════════════════════════════════════

/** @type {string|null} Identifiant de la section actuellement ouverte, ou null si menu */
let _currentSection = null;

/** @type {Object.<string, string>} Titres affichés dans l'en-tête selon la section */
const SECTION_TITLES = {
    connexion:   '🔐 Connexion Onisep',
    datasets:    '☁️ Paramètres de sauvegarde distante',
    preferences: '🏫 Mon établissement & domicile',
    favoris:     '⭐ Favoris',
    donnees:     '💾 Données distantes sauvegardées',
    aide:        '❓ Aide & À propos',
};

/**
 * Ouvre ou ferme le panneau de paramètres latéral.
 * Revient toujours au menu lors de la réouverture.
 * @returns {void}
 */
function toggleSettings() {
    const panel    = document.getElementById('settings-panel');
    const overlay  = document.getElementById('settings-overlay');
    const hamburger = document.getElementById('hamburger-btn');

    const isOpening = !panel.classList.contains('active');

    panel.classList.toggle('active');
    overlay.classList.toggle('active');
    hamburger.classList.toggle('active');

    if (isOpening) {
        // Revenir au menu propre à chaque ouverture
        _showMenu();
        loadSettings();
        updateConnectionStatus();
        afficherListeFavoris();
    }
}

/**
 * Ouvre une section du panneau (slide vers la droite).
 * @param {string} sectionId - Identifiant ('connexion'|'preferences'|'favoris'|'donnees'|'aide')
 * @returns {void}
 */
function settingsOpenSection(sectionId) {
    _currentSection = sectionId;

    // Masquer toutes les panes, afficher la bonne
    document.querySelectorAll('.settings-section-pane').forEach(el => el.classList.add('u-hidden'));
    const pane = document.getElementById(`settings-pane-${sectionId}`);
    if (pane) pane.classList.remove('u-hidden');

    // Mettre à jour le titre
    const titleEl = document.getElementById('settings-title');
    if (titleEl) titleEl.textContent = SECTION_TITLES[sectionId] ?? '⚙️ Paramètres';

    // Afficher le bouton retour
    const backBtn = document.getElementById('settings-back-btn');
    if (backBtn) backBtn.classList.remove('u-hidden');

    // Glisser le slider vers la section
    document.getElementById('settings-slider')?.classList.add('show-section');

    // Actions spécifiques à la section
    if (sectionId === 'favoris') {
        afficherListeFavoris();
        if (typeof window.afficherListeFavorisEtablissements === 'function') {
            window.afficherListeFavorisEtablissements();
        }
    }
    if (sectionId === 'datasets') {
        loadGitHubConfig();
    }
    if (sectionId === 'donnees') {
        refreshGitHubDatasets();
    }
}

/**
 * Revient au menu depuis une section (slide vers la gauche).
 * @returns {void}
 */
function settingsGoBack() {
    _showMenu();
}

/**
 * Affiche la vue menu (usage interne).
 * @private
 * @returns {void}
 */
function _showMenu() {
    _currentSection = null;

    document.getElementById('settings-slider')?.classList.remove('show-section');
    document.getElementById('settings-back-btn')?.classList.add('u-hidden');

    const titleEl = document.getElementById('settings-title');
    if (titleEl) titleEl.textContent = '⚙️ Paramètres';
}

/**
 * Met à jour les indicateurs de statut dans le menu (connexion, nb favoris).
 * @returns {void}
 */
function _updateMenuStatuses() {
    // Statut connexion
    const statusConnexion = document.getElementById('nav-status-connexion');
    if (statusConnexion) {
        const isAuth = window.onisepExtractionController?.isAuthenticated?.() ?? false;
        statusConnexion.textContent   = isAuth ? '✅ Connecté' : '⚠ Non connecté';
        statusConnexion.className     = `settings-nav__status ${isAuth ? 'settings-nav__status--connected' : ''}`;
    }

    // Nb favoris (tous types : recherche + établissements + divers)
    const statusFavoris = document.getElementById('nav-status-favoris');
    if (statusFavoris) {
        const nbRecherche = loadFavoris().length;
        const nbEtab      = typeof window.loadFavorisEtablissements === 'function'
            ? window.loadFavorisEtablissements().length
            : 0;
        const nbDivers     = typeof window.loadFavorisDivers === 'function'
            ? window.loadFavorisDivers().length
            : 0;
        const total = nbRecherche + nbEtab + nbDivers;
        statusFavoris.textContent = total > 0 ? `${total}` : '';
    }

    // Préférences
    const statusPrefs = document.getElementById('nav-status-preferences');
    if (statusPrefs) {
        const hasEtab = !!_prefLire('pref_user_etablissement');
        const hasDom  = !!_prefLire('pref_user_domicile');
        statusPrefs.textContent = (hasEtab || hasDom) ? '✅' : '';
    }

    // Nb jeux de données distants (v0.64)
    const statusDatasets = document.getElementById('nav-status-datasets');
    if (statusDatasets) {
        // Le compteur est mis à jour de manière asynchrone par refreshGitHubDatasets
        // On ne fait rien ici pour éviter un appel API à chaque _updateMenuStatuses
    }

    // Coche verte sauvegarde distante si token validé (v0.64b)
    const statusSauvegarde = document.getElementById('nav-status-sauvegarde');
    if (statusSauvegarde) {
        const hasToken = (typeof GitHubStorage !== 'undefined') && GitHubStorage.hasWriteToken();
        statusSauvegarde.textContent = hasToken ? '✅' : '';
    }
}

// ══════════════════════════════════════════════════════════
// CHARGEMENT DES PARAMÈTRES
// ══════════════════════════════════════════════════════════

/**
 * Charge et affiche les paramètres actuels (email, password, appId).
 * @returns {void}
 */
function loadSettings() {
    try {
        document.getElementById('settings-email').value       = _prefLire('settings_email')    || '';
        document.getElementById('settings-password').value    = _prefLire('settings_password') || '';
        document.getElementById('settings-app-id').value      = _prefLire('settings_app_id')   || '';

        updateConnectionStatus();
        updateLastExtractionDate();
        loadUserPreferences();
        _updateMenuStatuses();
    } catch (error) {
        console.error('[loadSettings] Erreur:', error);
    }
}

/**
 * Met à jour l'affichage de la date de dernière extraction depuis localStorage.
 * @returns {void}
 */
function updateLastExtractionDate() {
    const lastExtraction = _prefLire('last_extraction_date');
    const dateEl = document.getElementById('last-extraction-date');
    if (!dateEl) return;

    if (lastExtraction) {
        const date = new Date(lastExtraction);
        dateEl.innerHTML = `📅 Dernière extraction : ${date.toLocaleString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })}`;
    } else {
        dateEl.innerHTML = '📅 Aucune extraction effectuée';
    }
}

// ══════════════════════════════════════════════════════════
// CONNEXION ONISEP
// ══════════════════════════════════════════════════════════

/**
 * Enregistre les identifiants Onisep saisis dans localStorage.
 * Supprime les clés si les champs sont vides.
 * @returns {void}
 */
function saveOnisepCredentials() {
    const email     = document.getElementById('settings-email').value;
    const password  = document.getElementById('settings-password').value;
    const appId     = document.getElementById('settings-app-id').value;
    const autoConn  = document.getElementById('settings-auto-connect').checked;

    email    ? _prefSauver('settings_email', email)       : _prefSupprimer('settings_email');
    password ? _prefSauver('settings_password', password) : _prefSupprimer('settings_password');
    appId    ? _prefSauver('settings_app_id', appId)      : _prefSupprimer('settings_app_id');
    _prefSauver('settings_auto_connect', autoConn);

    showAlert('✅ Identifiants enregistrés avec succès', 'success');
}

/**
 * Met à jour l'indicateur de connexion Onisep dans le panneau et dans le menu.
 * @returns {void}
 */
function updateConnectionStatus() {
    const statusEl      = document.getElementById('connection-status');
    const btnConnect    = document.getElementById('btn-connect-settings');
    const btnDisconnect = document.getElementById('btn-disconnect-settings');
    const isAuth        = window.onisepExtractionController?.isAuthenticated?.() ?? false;

    if (statusEl) {
        statusEl.className   = `connection-status ${isAuth ? 'connected' : 'disconnected'}`;
        statusEl.innerHTML   = `<span class="dot"></span><span>${isAuth ? 'Connecté à Onisep' : 'Non connecté'}</span>`;
    }
    if (btnConnect)    btnConnect.classList.toggle('u-hidden', isAuth);
    if (btnDisconnect) btnDisconnect.classList.toggle('u-hidden', !isAuth);

    _updateMenuStatuses();
}

/**
 * Tente une connexion Onisep avec les identifiants du panneau de paramètres.
 * @returns {Promise<void>}
 */
async function connectFromSettings() {
    const email    = document.getElementById('settings-email').value;
    const password = document.getElementById('settings-password').value;
    const appId    = document.getElementById('settings-app-id').value;

    if (!email || !password) { showAlert('⚠️ Veuillez entrer votre email et mot de passe', 'error'); return; }
    if (!appId)              { showAlert('⚠️ Veuillez entrer votre Application ID', 'error'); return; }
    if (!window.onisepExtractionController) { showAlert('❌ OnisepExtractionController non initialisé', 'error'); return; }

    // Désactiver le bouton pendant la tentative (évite les doubles clics → doubles 401)
    const btnConnect = document.getElementById('btn-connect-settings');
    if (btnConnect) { btnConnect.disabled = true; btnConnect.textContent = '⏳ Connexion...'; }

    try {
        showAlert('🔄 Connexion en cours...', 'info');
        const token = await window.onisepExtractionController.login(email, password, appId);
        _prefSauver('onisep_token', token);
        _prefSauver('onisep_email', email);
        _prefSauver('onisep_app_id', appId);

        // Sauvegarder les identifiants automatiquement après connexion réussie (v0.64)
        _prefSauver('settings_email', email);
        _prefSauver('settings_password', password);
        _prefSauver('settings_app_id', appId);

        updateConnectionStatus();
        showAlert('✅ Connexion réussie !', 'success');
    } catch (error) {
        console.error('[connectFromSettings] Erreur:', error);
        showAlert('❌ Échec de la connexion : ' + error.message, 'error');
    } finally {
        // Réactiver le bouton (sauf si on est maintenant connecté → bouton masqué)
        if (btnConnect) { btnConnect.disabled = false; btnConnect.textContent = '🔐 Se connecter'; }
    }
}

/**
 * Connexion automatique au démarrage si les identifiants sont présents.
 * @param {string} email
 * @param {string} password
 * @param {string} appId
 * @returns {Promise<void>}
 */
async function autoConnectOnisep(email, password, appId) {
    try {
        if (!window.onisepExtractionController) return;
        const token = await window.onisepExtractionController.login(email, password, appId);
        _prefSauver('onisep_token', token);
        updateConnectionStatus();
        showAlert('✅ Connexion automatique réussie', 'success');
    } catch (error) {
        console.error('[autoConnectOnisep] Erreur:', error);
        showAlert('❌ Échec de la connexion automatique', 'error');
    }
}

/**
 * Déconnecte l'utilisateur du service Onisep.
 * @returns {void}
 */
function logoutOnisep() {
    // Réinitialisation token
    _prefSupprimer('onisep_token');
    if (window.onisepExtractionController?.getOnisepAPI?.()) {
        try { window.onisepExtractionController.getOnisepAPI().logout?.(); } catch (_) { /* */ }
    }
    updateConnectionStatus();
    showAlert('🚪 Déconnecté', 'info');
}

// ══════════════════════════════════════════════════════════
// ÉTABLISSEMENT UTILISATEUR
// ══════════════════════════════════════════════════════════

/**
 * Recherche l'établissement de l'utilisateur via l'API Onisep (par UAI).
 * Remplit automatiquement les champs nom et coordonnées GPS.
 * @returns {Promise<void>}
 */
async function fetchOnisepEstablishment() {
    const uai = document.getElementById('pref-user-uai').value.trim().toUpperCase();
    if (!uai) { showAlert('⚠️ Veuillez saisir un UAI', 'error'); return; }
    if (!/^[0-9]{7}[A-Z]$/.test(uai)) { showAlert('⚠️ Format UAI invalide (ex: 0350056C)', 'error'); return; }

    const onisepAPI = window.onisepExtractionController?.getOnisepAPI();
    if (!onisepAPI || !onisepAPI.isAuthenticated()) {
        showAlert('⚠️ Veuillez vous connecter à Onisep d\'abord', 'error');
        settingsOpenSection('connexion');
        return;
    }

    try {
        showAlert('🔍 Recherche sur Onisep...', 'info');
        const results = await onisepAPI.queryDataset('structures', { q: uai, size: 100 }, 10);
        if (!results?.length) { showAlert('❌ Établissement non trouvé sur Onisep', 'error'); return; }

        const etab = results.find(r => r.code_uai === uai) || results[0];
        document.getElementById('pref-user-nom').value = etab.nom || '';
        document.getElementById('pref-user-lat').value = etab.latitude_y || etab.latitude || '';
        document.getElementById('pref-user-lon').value = etab.longitude_x || etab.longitude || '';
        showAlert('✅ Informations récupérées depuis Onisep', 'success');
    } catch (error) {
        console.error('[fetchOnisepEstablishment] Erreur:', error);
        showAlert('❌ Erreur lors de la recherche : ' + error.message, 'error');
    }
}

/**
 * Sauvegarde les informations de l'établissement utilisateur dans localStorage.
 * @returns {void}
 */
function saveUserEstablishment() {
    const uai = document.getElementById('pref-user-uai').value.trim().toUpperCase();
    const nom = document.getElementById('pref-user-nom').value.trim();
    const lat = parseFloat(document.getElementById('pref-user-lat').value);
    const lon = parseFloat(document.getElementById('pref-user-lon').value);

    if (!nom || isNaN(lat) || isNaN(lon)) { showAlert('⚠️ Veuillez renseigner au minimum le nom et les coordonnées GPS', 'error'); return; }
    if (lat < -90 || lat > 90)            { showAlert('⚠️ Latitude invalide', 'error'); return; }
    if (lon < -180 || lon > 180)          { showAlert('⚠️ Longitude invalide', 'error'); return; }
    if (uai && !/^[0-9]{7}[A-Z]$/.test(uai)) { showAlert('⚠️ Format UAI invalide', 'error'); return; }

    _prefSauver('pref_user_etablissement', JSON.stringify({ uai: uai || null, nom, latitude: lat, longitude: lon }));
    if (uai) _prefSauver('pref_user_uai', uai); else _prefSupprimer('pref_user_uai');

    showAlert(`✅ Établissement "${nom}" sauvegardé`, 'success');
    _updateMenuStatuses();

    if (typeof currentTab !== 'undefined' && currentTab === 'carte' && window.map) loadUserMarker?.();
}

// ══════════════════════════════════════════════════════════
// DOMICILE
// ══════════════════════════════════════════════════════════

/**
 * Géocode l'adresse de domicile saisie via Nominatim (OSM, sans clé API).
 * Remplit les champs latitude et longitude automatiquement.
 * @returns {Promise<void>}
 */
async function geocoderDomicile() {
    const adresse = document.getElementById('pref-domicile-adresse')?.value?.trim();
    if (!adresse) { showAlert('⚠️ Veuillez saisir une adresse', 'warning'); return; }

    const btn = document.getElementById('btn-geocoder-domicile');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Recherche...'; }

    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(adresse + ', France')}&format=json&limit=1`;
        const resp = await fetch(url, { headers: { 'Accept-Language': 'fr', 'User-Agent': 'OrientationPostCollege/0.44' } });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const results = await resp.json();
        if (!results?.length) { showAlert('❌ Adresse introuvable — vérifiez la saisie', 'error'); return; }

        const { lat, lon, display_name } = results[0];
        document.getElementById('pref-domicile-lat').value = parseFloat(lat).toFixed(6);
        document.getElementById('pref-domicile-lon').value = parseFloat(lon).toFixed(6);
        showAlert(`📍 Trouvé : ${display_name.split(',').slice(0, 3).join(',')}`, 'success');
    } catch (err) {
        console.error('[geocoderDomicile] Erreur:', err);
        showAlert('❌ Erreur de géocodage — vérifiez votre connexion internet', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '📍 Géolocaliser'; }
    }
}

/**
 * Sauvegarde les coordonnées du domicile utilisateur dans localStorage.
 * @returns {void}
 */
function saveUserDomicile() {
    const adresse = document.getElementById('pref-domicile-adresse')?.value?.trim();
    const lat     = parseFloat(document.getElementById('pref-domicile-lat')?.value);
    const lon     = parseFloat(document.getElementById('pref-domicile-lon')?.value);

    if (!adresse)          { showAlert('⚠️ Veuillez saisir une adresse', 'warning'); return; }
    if (isNaN(lat) || isNaN(lon)) { showAlert('⚠️ Cliquez sur "📍 Géolocaliser" pour obtenir les coordonnées', 'warning'); return; }

    _prefSauver('pref_user_domicile', JSON.stringify({ adresse, latitude: lat, longitude: lon }));
    showAlert('✅ Domicile sauvegardé', 'success');
    _updateMenuStatuses();
    // v0.56 — rafraîchir le marqueur domicile sur la carte
    if (typeof currentTab !== 'undefined' && currentTab === 'carte' && window.map) loadHomeMarker?.();
}

/**
 * Efface les données de domicile (localStorage et formulaire).
 * @returns {void}
 */
function clearUserDomicile() {
    _prefSupprimer('pref_user_domicile');
    ['pref-domicile-adresse', 'pref-domicile-lat', 'pref-domicile-lon'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    showAlert('🗑️ Domicile effacé', 'info');
    _updateMenuStatuses();
}

/**
 * Charge les préférences utilisateur (établissement, domicile) au démarrage.
 * @returns {void}
 */
function loadUserPreferences() {
    // Établissement
    const storedEtab = _prefLire('pref_user_etablissement');
    if (storedEtab) {
        try {
            const etab = JSON.parse(storedEtab);
            if (etab.uai)       document.getElementById('pref-user-uai').value = etab.uai;
            if (etab.nom)       document.getElementById('pref-user-nom').value = etab.nom;
            if (etab.latitude)  document.getElementById('pref-user-lat').value = etab.latitude;
            if (etab.longitude) document.getElementById('pref-user-lon').value = etab.longitude;
        } catch (e) { console.warn('[loadUserPreferences] Erreur établissement:', e); }
    } else {
        const uai = _prefLire('pref_user_uai');
        if (uai) document.getElementById('pref-user-uai').value = uai;
    }

    // Domicile
    const storedDom = _prefLire('pref_user_domicile');
    if (storedDom) {
        try {
            const dom = JSON.parse(storedDom);
            if (dom.adresse)   document.getElementById('pref-domicile-adresse').value = dom.adresse;
            if (dom.latitude)  document.getElementById('pref-domicile-lat').value     = dom.latitude;
            if (dom.longitude) document.getElementById('pref-domicile-lon').value     = dom.longitude;
        } catch (e) { console.warn('[loadUserPreferences] Erreur domicile:', e); }
    }
}

// ══════════════════════════════════════════════════════════
// IMPORT / EXPORT
// ══════════════════════════════════════════════════════════

/**
 * Exporte la base de données complète vers un fichier JSON téléchargeable.
 * @returns {Promise<void>}
 */
async function exporterDonnees() {
    const nom = prompt('📁 Nom de l\'export (sans extension) :', 'export_' + new Date().toISOString().slice(0, 10));
    if (!nom) return;

    try {
        const data = localStorage.getItem('parcours_avenir');
        if (!data) { showAlert('⚠️ Aucune donnée à exporter', 'warning'); return; }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename  = `${nom}_${timestamp}.json`;
        const blob      = new Blob([data], { type: 'application/json' });
        const url       = URL.createObjectURL(blob);
        const a         = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        showAlert(`✅ Export réussi : ${filename}`, 'success');
    } catch (error) {
        console.error('[exporterDonnees] Erreur:', error);
        showAlert(`❌ Erreur lors de l'export : ${error.message}`, 'error');
    }
}

/**
 * Importe des données depuis un fichier JSON (écrase les données actuelles après confirmation).
 * @returns {Promise<void>}
 */
async function importerFichier() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!confirm(`⚠️ Importer "${file.name}" ?\n\nCeci va ÉCRASER toutes les données actuelles.`)) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                JSON.parse(event.target.result); // validation
                localStorage.setItem('parcours_avenir', event.target.result);
                showAlert('✅ Import réussi ! La page va se recharger...', 'success');
                setTimeout(() => location.reload(), 1000);
            } catch (error) {
                showAlert(`❌ Fichier JSON invalide : ${error.message}`, 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ══════════════════════════════════════════════════════════
// RESET BASE
// ══════════════════════════════════════════════════════════

/**
 * Affiche la modale de confirmation avant réinitialisation complète de la base.
 * @returns {void}
 */
/**
 * Demande confirmation avant de purger les données CARIF-OREF.
 * @returns {void}
 */
async function confirmClearCARIF() {
    if (!confirm('Purger les données d\'apprentissage (CARIF-OREF) ?\n\nLes données ONISEP (scolaire) seront conservées.\nVous devrez relancer l\'extraction CARIF-OREF pour les retrouver.')) {
        return;
    }
    try {
        await window.databaseService.clearCARIFData();
        showAlert('✅ Données CARIF-OREF purgées. Relancez l\'extraction CARIF pour les recharger.', 'success');
        if (typeof window.loadStats === 'function') window.loadStats();
    } catch (error) {
        showAlert(`❌ Erreur lors de la purge : ${error.message}`, 'error');
    }
}

function confirmResetDatabase() {
    const modal = document.getElementById('reset-confirm-modal');
    if (modal) modal.style.display = 'flex';
}

/**
 * Vide la base de données et recharge la page.
 * @returns {void}
 */
function executeResetDatabase() {
    try {
        localStorage.removeItem('parcours_avenir');

        // Effacer les favoris liés aux données (établissements + divers), garder les favoris de recherche
        localStorage.removeItem('favoris_etablissements');
        localStorage.removeItem('favoris_divers');

        closeResetConfirmModal();
        showAlert('✅ Base de données vidée ! La page va se recharger...', 'success');
        setTimeout(() => location.reload(), 1000);
    } catch (error) {
        showAlert(`❌ Erreur lors du vidage : ${error.message}`, 'error');
    }
}

/**
 * Ferme la modale de confirmation de réinitialisation.
 * @returns {void}
 */
function closeResetConfirmModal() {
    const modal = document.getElementById('reset-confirm-modal');
    if (modal) modal.style.display = 'none';
}

// ══════════════════════════════════════════════════════════
// FAVORIS
// ══════════════════════════════════════════════════════════

/** @type {number} Nombre maximum de favoris autorisés */
const MAX_FAVORIS = 10;

/**
 * Charge la liste des favoris depuis localStorage.
 * @returns {Object[]}
 */
function loadFavoris() {
    try { return JSON.parse(localStorage.getItem('favoris') || '[]'); }
    catch (_) { return []; }
}

/**
 * Persiste la liste des favoris dans localStorage.
 * @param {Object[]} favoris
 * @returns {void}
 */
function saveFavoris(favoris) {
    localStorage.setItem('favoris', JSON.stringify(favoris));
}

/**
 * Ajoute un favori à la liste (max MAX_FAVORIS, noms uniques).
 * @param {string} nom
 * @param {'geo'|'diplomes'} type
 * @param {Object} params
 * @returns {boolean} true si ajouté
 */
function ajouterFavori(nom, type, params) {
    const favoris = loadFavoris();
    if (favoris.length >= MAX_FAVORIS) { showAlert(`❌ Limite de ${MAX_FAVORIS} favoris atteinte`, 'error'); return false; }
    if (favoris.some(f => f.nom === nom)) { showAlert('❌ Un favori avec ce nom existe déjà', 'error'); return false; }

    favoris.push({ id: Date.now().toString(), nom, type, date: new Date().toISOString(), params });
    saveFavoris(favoris);
    showAlert(`✅ Favori "${nom}" sauvegardé !`, 'success');
    _updateMenuStatuses();
    return true;
}

/**
 * Supprime un favori après confirmation.
 * @param {string} id
 * @returns {void}
 */
function supprimerFavori(id) {
    const favoris = loadFavoris();
    const favori  = favoris.find(f => f.id === id);
    if (!favori) return;
    if (!confirm(`⚠️ Supprimer le favori "${favori.nom}" ?`)) return;

    saveFavoris(favoris.filter(f => f.id !== id));
    showAlert(`✅ Favori "${favori.nom}" supprimé`, 'success');
    afficherListeFavoris();
    _updateMenuStatuses();
}

/**
 * Lance une re-extraction à partir d'un favori.
 * @param {string} id
 * @returns {Promise<void>}
 */
async function reextraireFavori(id) {
    const favoris = loadFavoris();
    const favori  = favoris.find(f => f.id === id);
    if (!favori) return;
    if (!confirm(`🔄 Re-extraire "${favori.nom}" ?\n\n⚠️ Ceci va écraser les données actuelles.`)) return;

    toggleSettings();
    try {
        if (favori.type === 'geo') {
            window.selectedCommuneData = favori.params.commune;
            localStorage.setItem('geo_criteria_type',    favori.params.scope === 'commune' ? 'commune' : 'intercommunalite');
            localStorage.setItem('geo_criteria_value',   favori.params.scope === 'commune' ? favori.params.commune.nom : favori.params.epci.code);
            localStorage.setItem('geo_criteria_display', favori.params.scope === 'commune' ? favori.params.commune.nom : favori.params.epci.nom);
            if (favori.params.scope === 'commune') localStorage.setItem('geo_criteria_commune_mode', 'exact');
            await refreshFromOnisep?.();
        }
        // Autres types à implémenter selon besoins
        showAlert(`✅ Re-extraction "${favori.nom}" terminée !`, 'success');
    } catch (error) {
        showAlert(`❌ Erreur : ${error.message}`, 'error');
    }
}

/**
 * Affiche la liste des favoris dans le pane Favoris.
 * Regroupe deux types : favoris recherche et favoris établissements.
 * @returns {void}
 */
/**
 * Génère une carte favori (établissement, diplôme, dispositif, option).
 * Fonction unifiée pour tous les types de favoris dans le panneau paramètres.
 *
 * @param {Object} f - Objet favori (structure variable selon le type)
 * @param {Object} config - Configuration d'affichage
 * @param {string}   config.icon     - Emoji d'icône (ex: '🏫', '📄')
 * @param {string}   config.nom      - Texte à afficher comme nom
 * @param {string}   config.meta     - Texte secondaire (type, commune, date…)
 * @param {string}  [config.voirBtn] - HTML complet du bouton « Voir » (optionnel)
 * @param {string}   config.delBtn   - HTML complet du bouton « Supprimer »
 * @returns {string} HTML de la carte favori
 */
function _htmlFavoriCard(f, config) {
    return `
    <div class="favori-card">
        <div class="favori-card__nom">${config.icon} ${config.nom}</div>
        <div class="favori-card__meta">${config.meta}</div>
        <div class="favori-card__actions">
            ${config.voirBtn || ''}
            ${config.delBtn}
        </div>
    </div>`;
}

/**
 * Construit la config et génère une carte favori établissement.
 * @param {Object} f - {id, nom, commune, type, date}
 * @returns {string} HTML
 */
function _htmlFavoriEtab(f) {
    const date = new Date(f.date).toLocaleDateString('fr-FR');
    return _htmlFavoriCard(f, {
        icon: '🏫',
        nom:  f.nom || '—',
        meta: `${f.type || ''} · ${f.commune || ''} · ${date}`,
        voirBtn: `<button class="btn btn--primary favori-card__btn-voir"
                data-etab-id="${f.id}"
                onclick="toggleSettings();setTimeout(()=>showEtablissementDetails(this.dataset.etabId),200)">
                👁️ Voir la fiche
            </button>`,
        delBtn: `<button class="btn btn--secondary favori-card__btn-del"
                data-favori-id="${f.id}"
                data-favori-nom="${(f.nom||'').replace(/"/g,'&quot;')}"
                data-favori-commune="${(f.commune||'').replace(/"/g,'&quot;')}"
                data-favori-type="${(f.type||'').replace(/"/g,'&quot;')}"
                onclick="toggleEtablissementFavoriFromBtn(this)"
                title="Retirer des favoris"
                aria-label="Retirer des favoris">
                🗑️
            </button>`
    });
}

/**
 * Construit la config et génère une carte favori divers (diplôme, dispositif, option).
 * @param {Object} f - {id, titre, typeObjet, date}
 * @returns {string} HTML
 */
function _htmlFavoriDivers(f) {
    const date = new Date(f.date).toLocaleDateString('fr-FR');
    const typeConfig = {
        diplome:               { icon: '📄', showFn: 'showDiplomeDetails',             arg: f.titre },
        diplome_apprentissage: { icon: '🎓', showFn: 'showDiplomeApprentissageDetails', arg: f.id.replace(/^appr__/, '') },
        dispositif:            { icon: '🎯', showFn: 'showDispositifDetails',           arg: f.titre },
        option2ndeGT:          { icon: '📚', showFn: 'showOption2ndeGTDetails',         arg: f.titre },
    }[f.typeObjet] || { icon: '⭐', showFn: null, arg: null };

    const voirBtn = typeConfig.showFn
        ? `<button class="btn btn--primary favori-card__btn-voir"
                data-arg="${(typeConfig.arg||'').replace(/"/g,'&quot;')}"
                onclick="toggleSettings();setTimeout(()=>${typeConfig.showFn}(this.dataset.arg),200)">
                👁️ Voir la fiche
           </button>`
        : '';

    return _htmlFavoriCard(f, {
        icon:    typeConfig.icon,
        nom:     f.titre || '—',
        meta:    date,
        voirBtn: voirBtn,
        delBtn:  `<button class="btn btn--secondary favori-card__btn-del"
                data-favori-id="${f.id}"
                data-favori-nom="${(f.titre||'').replace(/"/g,'&quot;')}"
                data-favori-type-objet="${f.typeObjet||''}"
                onclick="_supprimerFavoriDiversDuPanneau(this)"
                title="Retirer des favoris"
                aria-label="Retirer des favoris">
                🗑️
            </button>`
    });
}

/**
 * Génère un en-tête de sous-section favoris.
 * @param {string} label
 * @param {number} count
 * @param {number} max
 * @returns {string} HTML
 */
function _htmlFavoriSectionHeader(label, count, max) {
    return `<h4 class="favoris-section-title">${label} (${count}${max ? ' / ' + max : ''})</h4>`;
}

/**
 * Supprime un favori divers depuis le panneau Paramètres et rafraîchit l'affichage.
 * Fonction locale utilisée dans l'onclick du bouton 🗑️ des cartes divers.
 * Délègue à window.toggleFavoriDivers si disponible, sinon gère directement via localStorage.
 * @param {HTMLElement} btn - Le bouton cliqué (doit avoir data-favori-id, data-favori-nom, data-favori-type-objet)
 */
function _supprimerFavoriDiversDuPanneau(btn) {
    const id        = btn.dataset.favoriId        || '';
    const titre     = btn.dataset.favoriNom       || '';
    const typeObjet = btn.dataset.favoriTypeObjet || '';

    if (typeof window.toggleFavoriDivers === 'function') {
        // Délégation : toggleFavoriDivers gère localStorage + toast + refresh panel
        window.toggleFavoriDivers(id, titre, typeObjet);
    } else {
        // Fallback autonome (cas où gestion_onglet_resultats.js non encore chargé)
        const KEY = 'favoris_divers';
        try {
            const list = JSON.parse(localStorage.getItem(KEY) || '[]');
            const idx  = list.findIndex(f => f.id === id);
            if (idx >= 0) {
                list.splice(idx, 1);
                localStorage.setItem(KEY, JSON.stringify(list));
            }
        } catch { /* ignore */ }
        afficherListeFavoris(); // rafraîchit directement le panel
    }
}

/**
 * Affiche la liste complète des favoris (toutes catégories) dans le panneau Paramètres.
 * Catégories : Établissements · Diplômes scolaires · Diplômes apprentissage · Dispositifs · Options 2nde GT · Recherches
 * @returns {void}
 */
function afficherListeFavoris() {
    const container = document.getElementById('favoris-list');
    if (!container) return;

    const favorisEtab      = typeof window.loadFavorisEtablissements === 'function' ? window.loadFavorisEtablissements() : [];
    const favorisDivers    = typeof window.loadFavorisDivers === 'function'          ? window.loadFavorisDivers()          : [];
    const favorisRecherche = loadFavoris();

    // Trier favoris divers par typeObjet
    const parType = {
        diplome:               favorisDivers.filter(f => f.typeObjet === 'diplome'),
        diplome_apprentissage: favorisDivers.filter(f => f.typeObjet === 'diplome_apprentissage'),
        dispositif:            favorisDivers.filter(f => f.typeObjet === 'dispositif'),
        option2ndeGT:          favorisDivers.filter(f => f.typeObjet === 'option2ndeGT'),
    };

    const HR = `<hr class="favoris-separator">`;

    let html = '';

    // ── 1. Établissements ─────────────────────────────────────────────
    html += _htmlFavoriSectionHeader('🏫 Établissements', favorisEtab.length, 20);
    if (favorisEtab.length === 0) {
        html += `<p class="favoris-empty">Aucun établissement favori. Ouvrez la fiche d'un établissement et cliquez sur ☆.</p>`;
    } else {
        favorisEtab.forEach(f => { html += _htmlFavoriEtab(f); });
    }

    html += HR;

    // ── 2. Diplômes scolaires ─────────────────────────────────────────
    html += _htmlFavoriSectionHeader('📄 Diplômes scolaires', parType.diplome.length, 0);
    if (parType.diplome.length === 0) {
        html += `<p class="favoris-empty">Aucun diplôme scolaire favori.</p>`;
    } else {
        parType.diplome.forEach(f => { html += _htmlFavoriDivers(f); });
    }

    html += HR;

    // ── 3. Diplômes apprentissage ─────────────────────────────────────
    html += _htmlFavoriSectionHeader('🎓 Diplômes apprentissage', parType.diplome_apprentissage.length, 0);
    if (parType.diplome_apprentissage.length === 0) {
        html += `<p class="favoris-empty">Aucun diplôme apprentissage favori.</p>`;
    } else {
        parType.diplome_apprentissage.forEach(f => { html += _htmlFavoriDivers(f); });
    }

    html += HR;

    // ── 4. Dispositifs ────────────────────────────────────────────────
    html += _htmlFavoriSectionHeader('🎯 Dispositifs', parType.dispositif.length, 0);
    if (parType.dispositif.length === 0) {
        html += `<p class="favoris-empty">Aucun dispositif favori.</p>`;
    } else {
        parType.dispositif.forEach(f => { html += _htmlFavoriDivers(f); });
    }

    html += HR;

    // ── 5. Options 2nde GT ────────────────────────────────────────────
    html += _htmlFavoriSectionHeader('📚 Options 2nde GT', parType.option2ndeGT.length, 0);
    if (parType.option2ndeGT.length === 0) {
        html += `<p class="favoris-empty">Aucune option 2nde GT favorite.</p>`;
    } else {
        parType.option2ndeGT.forEach(f => { html += _htmlFavoriDivers(f); });
    }

    html += HR;

    // ── 6. Recherches favorites ───────────────────────────────────────
    html += _htmlFavoriSectionHeader('🔍 Recherches favorites', favorisRecherche.length, MAX_FAVORIS);
    if (favorisRecherche.length === 0) {
        html += `<p class="favoris-empty">Aucune recherche favorite. Utilisez l'onglet Recherche puis cochez "💾 Sauvegarder comme favori".</p>`;
    } else {
        favorisRecherche.forEach(f => {
            const date = new Date(f.date);
            const icon = f.type === 'geo' ? '📍' : '🎓';
            const type = f.type === 'geo' ? 'Géographique' : 'Par diplômes';
            html += `
            <div class="favori-card--recherche">
                <div class="favori-card__nom">${icon} ${f.nom}</div>
                <div class="favori-card__meta">${type} · ${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</div>
                <div class="favori-card__actions">
                    <button class="btn btn--primary favori-card__btn-voir"
                        data-favori-id="${f.id}"
                        onclick="reextraireFavori(this.dataset.favoriId)">🔄 Re-extraire</button>
                    <button class="btn btn--secondary favori-card__btn-del"
                        data-favori-id="${f.id}"
                        onclick="supprimerFavori(this.dataset.favoriId)"
                        title="Supprimer" aria-label="Supprimer">🗑️</button>
                </div>
            </div>`;
        });
    }

    container.innerHTML = html;
}

// ══════════════════════════════════════════════════════════
// MODALES
// ══════════════════════════════════════════════════════════

/**
 * Ouvre la modale de connexion Onisep.
 * @returns {void}
 */
function openLoginModal() {
    document.getElementById('login-modal')?.classList.add('active');
}

/**
 * Ferme la modale de connexion Onisep.
 * @returns {void}
 */
function closeLoginModal() {
    document.getElementById('login-modal')?.classList.remove('active');
}

/**
 * Ouvre la modale d'aide.
 * @returns {void}
 */
function openHelpModal() {
    document.getElementById('help-modal')?.classList.add('active');
}

/**
 * Ferme la modale d'aide.
 * @returns {void}
 */
function closeHelpModal() {
    document.getElementById('help-modal')?.classList.remove('active');
}

// ══════════════════════════════════════════════════════════
// JEUX DE DONNÉES (v0.62)
// ══════════════════════════════════════════════════════════

/**
 * Échappe les caractères HTML dangereux dans une chaîne.
 * @private
 * @param {string} str
 * @returns {string}
 */
function _escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Affiche la liste des jeux de données indexés dans le pane Paramètres.
 * @returns {void}
 */
function afficherListeDatasets() {
    const container = document.getElementById('datasets-list');
    if (!container) return;

    if (typeof DatasetService === 'undefined') {
        container.innerHTML = '<div class="setting-help">Service de jeux de données non disponible.</div>';
        return;
    }

    const index = DatasetService.getIndex();

    if (index.length === 0) {
        container.innerHTML = '<div class="setting-help">Aucun jeu de données enregistré.</div>';
        return;
    }

    container.innerHTML = index.map(entry => {
        const typeLabel = DatasetService.getTypeRechercheLabel(entry.typeRecherche);
        const statsDesc = DatasetService.formatStatsDescription(entry.stats);
        const dateStr = entry.dateExtraction
            ? new Date(entry.dateExtraction).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric'
              })
            : 'Date inconnue';

        return `
            <div class="favori-card">
                <div class="favori-card__header">
                    <span class="favori-card__icon">📄</span>
                    <span class="favori-card__nom">${_escapeHtml(entry.nom)}</span>
                </div>
                <div class="favori-card__meta">
                    ${_escapeHtml(typeLabel)} — ${_escapeHtml(dateStr)}
                </div>
                <div class="favori-card__meta">${_escapeHtml(statsDesc)}</div>
                <div class="favori-card__actions">
                    <button class="btn btn--sm btn--danger"
                            onclick="supprimerDatasetIndex('${_escapeHtml(entry.id)}')"
                            title="Supprimer de l'index">🗑️ Supprimer</button>
                </div>
            </div>
        `;
    }).join('');

    // Mettre à jour le checkbox « réafficher modale »
    const checkbox = document.getElementById('settings-mode-choice-reset');
    if (checkbox) {
        checkbox.checked = localStorage.getItem('mode_choice_skip') !== 'true';
    }
}

/**
 * Supprime un jeu de données de l'index après confirmation.
 * @param {string} id - Identifiant du jeu à supprimer
 * @returns {void}
 */
function supprimerDatasetIndex(id) {
    if (typeof DatasetService === 'undefined') return;

    const index = DatasetService.getIndex();
    const entry = index.find(e => e.id === id);
    if (!entry) return;

    if (!confirm(`⚠️ Supprimer le jeu de données « ${entry.nom} » de l'index ?`)) return;

    DatasetService.removeFromIndex(id);
    showAlert(`✅ Jeu « ${entry.nom} » supprimé de l'index`, 'success');
    afficherListeDatasets();
    _updateMenuStatuses();
}

/**
 * Ouvre le sélecteur de fichier pour importer un jeu de données depuis les Paramètres.
 * @returns {void}
 */
function importerDataset() {
    const fileInput = document.getElementById('settings-dataset-file-input');
    if (!fileInput) return;

    // Réinitialiser pour autoriser la re-sélection du même fichier
    fileInput.value = '';

    fileInput.onchange = async function() {
        const file = this.files?.[0];
        if (!file) return;

        if (typeof DatasetService === 'undefined') {
            showAlert('❌ Service de jeux de données non disponible', 'error');
            return;
        }

        try {
            const text = await file.text();
            const json = JSON.parse(text);

            const validation = DatasetService.validateDataset(json);
            if (!validation.valid) {
                showAlert(`❌ Fichier invalide : ${validation.errors[0]}`, 'error');
                return;
            }

            if (!confirm(`📦 Importer « ${json.metadata.nom} » ?\n\n⚠️ Ceci remplacera les données éducatives actuelles.`)) {
                return;
            }

            const result = await DatasetService.importDataset(json);
            if (result.success) {
                DatasetService.addToIndex(json.metadata);
                const statsDesc = DatasetService.formatStatsDescription(result.stats);
                showAlert(`✅ Import réussi ! ${statsDesc}`, 'success');

                // Rafraîchir les vues
                if (typeof window.initResultsTab === 'function') window.initResultsTab();
                if (typeof window.loadMarkers === 'function') window.loadMarkers();

                afficherListeDatasets();
                _updateMenuStatuses();
            } else {
                showAlert(`❌ Erreur d'import : ${result.errors[0]}`, 'error');
            }
        } catch (error) {
            showAlert(`❌ Erreur : ${error.message}`, 'error');
        }
    };

    fileInput.click();
}

// ══════════════════════════════════════════════════════════
// GITHUB STORAGE (v0.63)
// ══════════════════════════════════════════════════════════

/**
 * Charge la configuration GitHub : le token depuis localStorage.
 * Owner et repo sont hardcodés (champs readonly).
 * @returns {void}
 */
function loadGitHubConfig() {
    if (typeof GitHubStorage === 'undefined') return;
    const config = GitHubStorage.getConfig();
    const tokenInput = document.getElementById('github-token');
    if (tokenInput) tokenInput.value = config.token || '';
}

/**
 * Teste l'écriture avec le token saisi, et le sauvegarde si OK.
 * Sinon, modale d'alerte et pas de sauvegarde.
 * @returns {Promise<void>}
 */
async function saveAndTestGitHubToken() {
    if (typeof GitHubStorage === 'undefined') return;

    const token = document.getElementById('github-token')?.value?.trim() || '';
    if (!token) {
        // Supprimer le token
        GitHubStorage.saveConfig({ token: null });
        showAlert('🗑️ Clé d\'écriture supprimée', 'info');
        return;
    }

    const statusEl = document.getElementById('github-connection-status');
    if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.textContent = '⏳ Vérification de la clé…';
        statusEl.style.color = '';
    }

    // Sauvegarder temporairement pour que testWriteAccess l'utilise
    GitHubStorage.saveConfig({ token });

    const result = await GitHubStorage.testWriteAccess();

    if (result.ok) {
        // Token valide, il est déjà sauvegardé
        if (statusEl) {
            statusEl.textContent = '✅ Clé validée et sauvegardée';
            statusEl.style.color = 'var(--color-success, #16a34a)';
        }
        showAlert('✅ Clé d\'écriture validée et sauvegardée', 'success');
    } else {
        // Token invalide, on le retire
        GitHubStorage.saveConfig({ token: null });
        document.getElementById('github-token').value = '';
        if (statusEl) {
            statusEl.textContent = '❌ Clé invalide, non sauvegardée';
            statusEl.style.color = 'var(--color-danger, #dc2626)';
        }
        if (typeof showModalAlert === 'function') {
            showModalAlert('Impossible d\'écrire une sauvegarde distante. Vérifiez la clé.');
        } else {
            alert('Impossible d\'écrire une sauvegarde distante. Vérifiez la clé.');
        }
    }
}

/**
 * Actualise la liste des datasets depuis GitHub et l'affiche.
 * @returns {Promise<void>}
 */
async function refreshGitHubDatasets() {
    if (typeof GitHubStorage === 'undefined') {
        showAlert('❌ Service GitHub Storage non disponible', 'error');
        return;
    }

    const container = document.getElementById('github-datasets-list');
    if (!container) return;

    container.innerHTML = '<div class="setting-help">⏳ Chargement depuis GitHub…</div>';

    try {
        const datasets = await GitHubStorage.listDatasets();

        // Mettre à jour le badge compteur (v0.64)
        const statusBadge = document.getElementById('nav-status-datasets');
        if (statusBadge) {
            statusBadge.textContent = datasets.length > 0 ? `${datasets.length}` : '';
        }

        if (datasets.length === 0) {
            container.innerHTML = '<div class="setting-help">Aucune donnée sauvegardée.</div>';
            return;
        }

        container.innerHTML = datasets.map(entry => {
            const typeLabel = (typeof DatasetService !== 'undefined')
                ? DatasetService.getTypeRechercheLabel(entry.typeRecherche)
                : (entry.typeRecherche || 'inconnu');
            const statsDesc = (typeof DatasetService !== 'undefined')
                ? DatasetService.formatStatsDescription(entry.stats)
                : '';
            const dateStr = entry.dateExtraction
                ? new Date(entry.dateExtraction).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })
                : 'Date inconnue';

            const hasToken = GitHubStorage.hasWriteToken();
            const deleteBtn = hasToken
                ? `<button class="btn btn--sm btn--danger"
                          onclick="deleteGitHubDataset('${_escapeHtml(entry.filename)}')"
                          title="Supprimer de GitHub">🗑️</button>`
                : '';

            return `
                <div class="favori-card">
                    <div class="favori-card__header">
                        <span class="favori-card__icon">☁️</span>
                        <span class="favori-card__nom">${_escapeHtml(entry.nom)}</span>
                    </div>
                    <div class="favori-card__meta">
                        ${_escapeHtml(typeLabel)} — ${_escapeHtml(dateStr)}
                    </div>
                    <div class="favori-card__meta">${_escapeHtml(statsDesc)}</div>
                    <div class="favori-card__actions">
                        <button class="btn btn--sm btn--primary"
                                onclick="chargerGitHubDataset('${_escapeHtml(entry.filename)}')"
                                title="Charger ce jeu de données">📥 Charger</button>
                        ${deleteBtn}
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('[Params] Erreur GitHub:', error);
        container.innerHTML = `<div class="setting-help">❌ Erreur : ${_escapeHtml(error.message)}</div>`;
    }
}

/**
 * Charge un dataset depuis GitHub et l'importe dans la base.
 * @param {string} filename - Nom du fichier sur GitHub
 * @returns {Promise<void>}
 */
async function chargerGitHubDataset(filename) {
    if (typeof GitHubStorage === 'undefined' || typeof DatasetService === 'undefined') return;

    if (!confirm(`📥 Charger le jeu de données « ${filename} » depuis GitHub ?\n\n⚠️ Ceci remplacera les données éducatives actuelles.`)) {
        return;
    }

    try {
        showAlert('⏳ Téléchargement depuis GitHub…', 'info');

        const dataset = await GitHubStorage.loadDataset(filename);
        const result  = await DatasetService.importDataset(dataset);

        if (result.success) {
            DatasetService.addToIndex(dataset.metadata);
            const statsDesc = DatasetService.formatStatsDescription(result.stats);
            showAlert(`✅ Import réussi ! ${statsDesc}`, 'success');

            // Rafraîchir les vues
            if (typeof window.initResultsTab === 'function') window.initResultsTab();
            if (typeof window.loadMarkers === 'function') window.loadMarkers();

            afficherListeDatasets();
            _updateMenuStatuses();
        } else {
            showAlert(`❌ Erreur d'import : ${result.errors[0]}`, 'error');
        }
    } catch (error) {
        console.error('[Params] Erreur chargement GitHub:', error);
        showAlert(`❌ Erreur : ${error.message}`, 'error');
    }
}

/**
 * Supprime un dataset du dépôt GitHub après confirmation.
 * @param {string} filename - Nom du fichier à supprimer
 * @returns {Promise<void>}
 */
async function deleteGitHubDataset(filename) {
    if (typeof GitHubStorage === 'undefined') return;

    if (!confirm(`⚠️ Supprimer « ${filename} » du dépôt GitHub ?\n\nCette action est irréversible.`)) {
        return;
    }

    try {
        showAlert('⏳ Suppression en cours…', 'info');
        await GitHubStorage.deleteDataset(filename);
        showAlert(`✅ Dataset « ${filename} » supprimé de GitHub`, 'success');
        refreshGitHubDatasets();
    } catch (error) {
        console.error('[Params] Erreur suppression GitHub:', error);
        showAlert(`❌ Erreur : ${error.message}`, 'error');
    }
}

// ══════════════════════════════════════════════════════════
// EXPOSITION GLOBALE
// ══════════════════════════════════════════════════════════
if (typeof window !== 'undefined') {
    window.toggleSettings          = toggleSettings;
    window.settingsOpenSection     = settingsOpenSection;
    window.settingsGoBack          = settingsGoBack;
    window.loadSettings            = loadSettings;
    window.updateLastExtractionDate = updateLastExtractionDate;
    window.updateConnectionStatus  = updateConnectionStatus;
    window.saveOnisepCredentials   = saveOnisepCredentials;
    window.connectFromSettings     = connectFromSettings;
    window.autoConnectOnisep       = autoConnectOnisep;
    window.logoutOnisep            = logoutOnisep;
    window.fetchOnisepEstablishment = fetchOnisepEstablishment;
    window.saveUserEstablishment   = saveUserEstablishment;
    window.loadUserPreferences     = loadUserPreferences;
    window.geocoderDomicile        = geocoderDomicile;
    window.saveUserDomicile        = saveUserDomicile;
    window.clearUserDomicile       = clearUserDomicile;
    window.exporterDonnees         = exporterDonnees;
    window.importerFichier         = importerFichier;
    window.confirmResetDatabase    = confirmResetDatabase;
    window.confirmClearCARIF       = confirmClearCARIF;
    window.executeResetDatabase    = executeResetDatabase;
    window.closeResetConfirmModal  = closeResetConfirmModal;
    window.loadFavoris             = loadFavoris;
    window.ajouterFavori           = ajouterFavori;
    window.supprimerFavori         = supprimerFavori;
    window.reextraireFavori        = reextraireFavori;
    window.afficherListeFavoris        = afficherListeFavoris;
    window._supprimerFavoriDiversDuPanneau = _supprimerFavoriDiversDuPanneau;
    window._updateMenuStatuses     = _updateMenuStatuses;
    window.openLoginModal          = openLoginModal;
    window.closeLoginModal         = closeLoginModal;
    window.openHelpModal           = openHelpModal;
    window.closeHelpModal          = closeHelpModal;
    // Jeux de données (v0.62)
    window.afficherListeDatasets   = afficherListeDatasets;
    window.supprimerDatasetIndex   = supprimerDatasetIndex;
    window.importerDataset         = importerDataset;
    // GitHub Storage (v0.64)
    window.loadGitHubConfig        = loadGitHubConfig;
    window.saveAndTestGitHubToken  = saveAndTestGitHubToken;
    window.refreshGitHubDatasets   = refreshGitHubDatasets;
    window.chargerGitHubDataset    = chargerGitHubDataset;
    window.deleteGitHubDataset     = deleteGitHubDataset;
}
