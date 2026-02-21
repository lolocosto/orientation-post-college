// ===== FONCTIONS PANNEAU DE PARAMÈTRES =====

// =====================================
// OUVERTURE/FERMETURE
// =====================================

function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    const overlay = document.getElementById('settings-overlay');
    const hamburger = document.getElementById('hamburger-btn');
    
    panel.classList.toggle('active');
    overlay.classList.toggle('active');
    hamburger.classList.toggle('active');
    
    // Charger les paramètres actuels
    if (panel.classList.contains('active')) {
        loadSettings();
    }
}

function toggleSection(header) {
    const content = header.nextElementSibling;
    const isActive = content.classList.contains('active');
    
    // Fermer toutes les sections
    document.querySelectorAll('.settings-section-content').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelectorAll('.settings-section-header').forEach(el => {
        el.classList.remove('active');
    });
    
    // Ouvrir la section cliquée si elle était fermée
    if (!isActive) {
        content.classList.add('active');
        header.classList.add('active');
    }
}

function loadSettings() {
    try {
        // Charger les identifiants Onisep
        document.getElementById('settings-email').value = localStorage.getItem('settings_email') || '';
        document.getElementById('settings-password').value = localStorage.getItem('settings_password') || '';
        document.getElementById('settings-app-id').value = localStorage.getItem('settings_app_id') || '';
        document.getElementById('settings-auto-connect').checked = localStorage.getItem('settings_auto_connect') === 'true';
        
        // Mettre à jour le statut de connexion
        updateConnectionStatus();
        
        // Afficher la date de dernière extraction
        updateLastExtractionDate();
    } catch (error) {
        console.error('Erreur loadSettings:', error);
    }
}

function updateLastExtractionDate() {
    const lastExtraction = localStorage.getItem('last_extraction_date');
    const dateEl = document.getElementById('last-extraction-date');
    
    if (lastExtraction && dateEl) {
        const date = new Date(lastExtraction);
        const formattedDate = date.toLocaleString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        dateEl.innerHTML = `ðŸ“… Dernière extraction : ${formattedDate}`;
    } else if (dateEl) {
        dateEl.innerHTML = 'ðŸ“… Aucune extraction effectuée';
    }
}

// =====================================
// CONNEXION ONISEP
// =====================================

function saveOnisepCredentials() {
    const email = document.getElementById('settings-email').value;
    const password = document.getElementById('settings-password').value;
    const appId = document.getElementById('settings-app-id').value;
    const autoConnect = document.getElementById('settings-auto-connect').checked;
    
    if (email) {
        localStorage.setItem('settings_email', email);
    } else {
        localStorage.removeItem('settings_email');
    }
    
    if (password) {
        localStorage.setItem('settings_password', password);
    } else {
        localStorage.removeItem('settings_password');
    }
    
    if (appId) {
        localStorage.setItem('settings_app_id', appId);
    } else {
        localStorage.removeItem('settings_app_id');
    }
    
    localStorage.setItem('settings_auto_connect', autoConnect);
    
    showAlert('✅ Identifiants enregistrés avec succès', 'success');
    
    // Proposer de se connecter immédiatement
    if (email && password && appId && !window.onisepExtractionController && !window.onisepExtractionController.isAuthenticated()) {
        if (confirm('Voulez-vous vous connecter maintenant ?')) {
            autoConnectOnisep(email, password, appId);
        }
    }
}

function updateConnectionStatus() {
    const statusEl = document.getElementById('connection-status');
    const btnConnect = document.getElementById('btn-connect-settings');
    const btnDisconnect = document.getElementById('btn-disconnect-settings');
    
    if (window.onisepExtractionController && window.onisepExtractionController.isAuthenticated()) {
        statusEl.className = 'connection-status connected';
        statusEl.innerHTML = '<span class="dot"></span><span>Connecté à Onisep</span>';
        
        if (btnConnect) btnConnect.classList.add('u-hidden');
        if (btnDisconnect) btnDisconnect.classList.remove('u-hidden');
    } else {
        statusEl.className = 'connection-status disconnected';
        statusEl.innerHTML = '<span class="dot"></span><span>Non connecté</span>';
        
        if (btnConnect) btnConnect.classList.remove('u-hidden');
        if (btnDisconnect) btnDisconnect.classList.add('u-hidden');
    }
}

async function connectFromSettings() {
    const email = document.getElementById('settings-email').value;
    const password = document.getElementById('settings-password').value;
    const appId = document.getElementById('settings-app-id').value;
    
    if (!email || !password) {
        showAlert('⚠️ Veuillez entrer votre email et mot de passe', 'error');
        return;
    }
    
    if (!appId) {
        showAlert('⚠️ Veuillez entrer votre Application ID', 'error');
        return;
    }
    
    try {
        showAlert('🔄 Connexion en cours...', 'info');
        
        // Utiliser l'instance globale
        if (!window.onisepExtractionController) {
            showAlert('❌ OnisepExtractionController non initialisé', 'error');
            return;
        }
        
        // Se connecter avec les 3 paramètres requis
        const token = await window.onisepExtractionController.login(email, password, appId);
        
        // Le token est déjà stocké dans l'instance
        localStorage.setItem('onisep_token', token);
        localStorage.setItem('onisep_email', email);
        localStorage.setItem('onisep_app_id', appId);
        
        updateConnectionStatus();
        showAlert('✅ Connexion réussie !', 'success');
    } catch (error) {
        console.error('Erreur connexion:', error);
        showAlert('❌ Échec de la connexion : ' + error.message, 'error');
    }
}

async function autoConnectOnisep(email, password, appId) {
    try {
        console.log('🔄 Connexion automatique en cours...');
        
        if (!window.onisepExtractionController) {
            console.error('OnisepExtractionController non initialisé');
            return;
        }
        
        // Appeler login avec les 3 paramètres requis
        const token = await window.onisepExtractionController.login(email, password, appId);
        
        localStorage.setItem('onisep_token', token);
        localStorage.setItem('onisep_email', email);
        localStorage.setItem('onisep_app_id', appId);
        
        updateConnectionStatus();
        showAlert('✅ Connexion automatique réussie', 'success');
    } catch (error) {
        console.error('Erreur connexion auto:', error);
        showAlert('❌ Échec de la connexion automatique', 'error');
    }
}

function logoutOnisep() { 
}

// =====================================
// ÉTABLISSEMENT UTILISATEUR
// =====================================

async function fetchOnisepEstablishment() {
    const uai = document.getElementById('pref-user-uai').value.trim().toUpperCase();
    
    if (!uai) {
        showAlert('⚠️ Veuillez saisir un UAI', 'error');
        return;
    }
    
    // Validation format UAI
    if (!/^[0-9]{7}[A-Z]$/.test(uai)) {
        showAlert('⚠️ Format UAI invalide (ex: 0350056C)', 'error');
        return;
    }
    
    console.log(`[fetchOnisepEstablishment] 🔍 Recherche UAI: ${uai}`);
    
    const onisepAPI = window.onisepExtractionController?.getOnisepAPI();
    
    console.log(`[fetchOnisepEstablishment] 🔌 Vérification onisepAPI:`, {
        controllerExists: !!window.onisepExtractionController,
        apiExists: !!onisepAPI,
        isAuthenticated: onisepAPI?.isAuthenticated?.() || false
    });
    
    if (!window.onisepExtractionController || !onisepAPI) {
        console.error('[fetchOnisepEstablishment] ❌ OnisepExtractionController ou OnisepAPI non initialisé !');
        showAlert('⚠️ Veuillez vous connecter à Onisep d\'abord', 'error');
        openLoginModal();
        return;
    }
    
    if (!onisepAPI.isAuthenticated()) {
        console.error('[fetchOnisepEstablishment] ❌ OnisepAPI non authentifié !');
        showAlert('⚠️ Veuillez vous connecter à Onisep d\'abord', 'error');
        openLoginModal();
        return;
    }
    
    console.log('[fetchOnisepEstablishment] ✅ OnisepAPI existe et authentifié, recherche en cours...');
    
    try {
        showAlert('🔍 Recherche sur Onisep...', 'info');
        
        // Recherche par UAI en utilisant queryDataset
        const results = await onisepAPI.queryDataset('structures', {
            q: uai, 
            size: 100
        }, 10); // Pas de callback de progression pour cette requête rapide
        
        if (!results || results.length === 0) {
            showAlert('❌ Établissement non trouvé sur Onisep', 'error');
            return;
        }
        
        // Filtrer pour trouver l'UAI exact (la recherche peut retourner plusieurs résultats)
        const etablissement = results.find(r => r.code_uai === uai) || results[0];
        
        if (!etablissement) {
            showAlert('❌ Établissement non trouvé sur Onisep', 'error');
            return;
        }
        
        // Log pour debug
        console.log('🏫 Établissement trouvé:', etablissement);
        console.log('📍 Champs GPS disponibles:', {
            latitude: etablissement.latitude,
            longitude: etablissement.longitude,
            latitude_y: etablissement.latitude_y,
            longitude_x: etablissement.longitude_x,
            coordonnees: etablissement.coordonnees,
            position: etablissement.position
        });
        
        // Remplir les champs - essayer différents noms de champs
        document.getElementById('pref-user-nom').value = etablissement.nom || '';
        document.getElementById('pref-user-lat').value = etablissement.latitude_y || etablissement.latitude || '';
        document.getElementById('pref-user-lon').value = etablissement.longitude_x || etablissement.longitude || '';
        
        showAlert('✅ Informations récupérées depuis Onisep', 'success');
        
    } catch (error) {
        console.error('Erreur recherche Onisep:', error);
        showAlert('❌ Erreur lors de la recherche : ' + error.message, 'error');
    }
}

function saveUserEstablishment() {
    console.log('💾 saveUserEstablishment appelée');
    
    const uai = document.getElementById('pref-user-uai').value.trim().toUpperCase();
    const nom = document.getElementById('pref-user-nom').value.trim();
    const lat = parseFloat(document.getElementById('pref-user-lat').value);
    const lon = parseFloat(document.getElementById('pref-user-lon').value);
    
    console.log('📝 Valeurs récupérées:', { uai, nom, lat, lon });
    
    // Validation : au minimum nom + coordonnées GPS
    if (!nom || isNaN(lat) || isNaN(lon)) {
        console.error('❌ Validation échouée: nom ou coordonnées manquants');
        showAlert('⚠️ Veuillez renseigner au minimum le nom et les coordonnées GPS', 'error');
        return;
    }
    
    // Validation GPS
    if (lat < -90 || lat > 90) {
        console.error('❌ Latitude invalide:', lat);
        showAlert('⚠️ Latitude invalide (doit être entre -90 et 90)', 'error');
        return;
    }
    if (lon < -180 || lon > 180) {
        console.error('❌ Longitude invalide:', lon);
        showAlert('⚠️ Longitude invalide (doit être entre -180 et 180)', 'error');
        return;
    }
    
    // Validation UAI si renseigné
    if (uai && !/^[0-9]{7}[A-Z]$/.test(uai)) {
        console.error('❌ Format UAI invalide:', uai);
        showAlert('⚠️ Format UAI invalide (ex: 0350056C)', 'error');
        return;
    }
    
    // Sauvegarder dans localStorage
    const userEtablissement = {
        uai: uai || null,
        nom: nom,
        latitude: lat,
        longitude: lon
    };
    
    console.log('💾 Objet à sauvegarder:', userEtablissement);
    
    localStorage.setItem('pref_user_etablissement', JSON.stringify(userEtablissement));
    
    console.log('✅ Sauvegardé dans localStorage');
    
    // Conserver aussi UAI pour compatibilité
    if (uai) {
        localStorage.setItem('pref_user_uai', uai);
    } else {
        localStorage.removeItem('pref_user_uai');
    }
    
    showAlert(`✅ Établissement "${nom}" sauvegardé`, 'success');
    
    // Recharger carte si ouverte
    const currentTabValue = typeof currentTab !== 'undefined' ? currentTab : 'unknown';
    console.log('🔍 Vérification carte ouverte:', { currentTab: currentTabValue, mapExists: !!map });
    
    if (typeof currentTab !== 'undefined' && currentTab === 'carte' && map) {
        console.log('🗺️ Rechargement marqueur sur carte...');
        loadUserMarker();
    } else {
        console.log('ℹ️ Carte pas ouverte, marqueur sera chargé au prochain affichage carte');
    }
}

function loadUserPreferences() {
    // Charger depuis nouvel objet si disponible
    const stored = localStorage.getItem('pref_user_etablissement');
    if (stored) {
        try {
            const etab = JSON.parse(stored);
            if (etab.uai) document.getElementById('pref-user-uai').value = etab.uai;
            if (etab.nom) document.getElementById('pref-user-nom').value = etab.nom;
            if (etab.latitude) document.getElementById('pref-user-lat').value = etab.latitude;
            if (etab.longitude) document.getElementById('pref-user-lon').value = etab.longitude;
        } catch (e) {
            console.warn('Erreur chargement préférences:', e);
        }
    } else {
        // Fallback ancien format (UAI seul)
        const uai = localStorage.getItem('pref_user_uai');
        if (uai) {
            document.getElementById('pref-user-uai').value = uai;
        }
    }
}

// =====================================
// IMPORT/EXPORT (localStorage)
// =====================================
async function exporterDonnees() {
    const nom = prompt('📁 Nom de l\'export (sans extension) :', 'export_' + new Date().toISOString().slice(0,10));
    
    if (!nom) return;
    
    try {
        // Récupérer données localStorage
        const data = localStorage.getItem('parcours_avenir');
        
        if (!data) {
            showAlert('⚠️ Aucune donnée à exporter', 'warning');
            return;
        }
        
        // Créer blob JSON
        const blob = new Blob([data], { type: 'application/json' });
        
        // Générer nom fichier avec timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `${nom}_${timestamp}.json`;
        
        // Télécharger
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showAlert(`✅ Export réussi : ${filename}`, 'success');
        
    } catch (error) {
        console.error('Erreur export:', error);
        showAlert(`❌ Erreur lors de l'export : ${error.message}`, 'error');
    }
}

async function importerFichier() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Confirmation
        if (!confirm(`⚠️ Importer "${file.name}" ?\n\nCeci va ÉCRASER toutes les données actuelles. Êtes-vous sûr ?`)) {
            return;
        }
        
        try {
            const reader = new FileReader();
            
            reader.onload = function(event) {
                try {
                    const data = event.target.result;
                    
                    // Valider JSON
                    JSON.parse(data);
                    
                    // Sauvegarder dans localStorage
                    localStorage.setItem('parcours_avenir', data);
                    
                    showAlert('✅ Import réussi ! La page va se recharger...', 'success');
                    
                    // Recharger l'application
                    setTimeout(() => location.reload(), 1000);
                    
                } catch (error) {
                    console.error('Erreur import:', error);
                    showAlert(`❌ Erreur lors de l'import : ${error.message}`, 'error');
                }
            };
            
            reader.readAsText(file);
            
        } catch (error) {
            console.error('Erreur lecture fichier:', error);
            showAlert(`❌ Erreur lors de la lecture du fichier : ${error.message}`, 'error');
        }
    };
    
    input.click();
}


// =====================================
// RESET BASE
// =====================================
function confirmResetDatabase() { 
    const modal = document.getElementById('reset-confirm-modal');
    if (modal) modal.style.display = 'flex';
}

function executeResetDatabase() {
    try {
        localStorage.removeItem('parcours_avenir');
        closeResetConfirmModal();
        showAlert('✅ Base de données vidée ! La page va se recharger...', 'success');
        setTimeout(() => location.reload(), 1000);
    } catch (error) {
        console.error('Erreur reset database:', error);
        showAlert(`❌ Erreur lors du vidage : ${error.message}`, 'error');
    }
}

function closeResetConfirmModal() {
    const modal = document.getElementById('reset-confirm-modal');
    if (modal) modal.style.display = 'none';
}

// =====================================
// FAVORIS
// =====================================
/**
 * Structure d'un favori :
 * {
 *   id: string (timestamp),
 *   nom: string,
 *   type: 'geo' | 'diplomes',
 *   date: string (ISO),
 *   params: {
 *     // Pour geo:
 *     commune: {nom, code, ...},
 *     epci: {...} | null,
 *     scope: 'commune' | 'epci'
 *     
 *     // Pour diplomes:
 *     geoType: 'departement' | 'academie',
 *     geoValue: string,
 *     geoDisplay: string,
 *     diplomes: [{intitule, niveau, uais, ...}]
 *   }
 * }
 */
const MAX_FAVORIS = 10;

function loadFavoris() {
    const stored = localStorage.getItem('favoris');
    return stored ? JSON.parse(stored) : [];
}

function saveFavoris(favoris) {
    localStorage.setItem('favoris', JSON.stringify(favoris));
}

function ajouterFavori(nom, type, params) {
    const favoris = loadFavoris();
    
    // Vérifier limite
    if (favoris.length >= MAX_FAVORIS) {
        showAlert(`❌ Limite de ${MAX_FAVORIS} favoris atteinte. Supprimez-en un avant d'en ajouter.`, 'error');
        return false;
    }
    
    // Vérifier nom unique
    if (favoris.some(f => f.nom === nom)) {
        showAlert('❌ Un favori avec ce nom existe déjà', 'error');
        return false;
    }
    
    const favori = {
        id: Date.now().toString(),
        nom: nom,
        type: type,
        date: new Date().toISOString(),
        params: params
    };
    
    favoris.push(favori);
    saveFavoris(favoris);
    
    console.log('✅ Favori ajouté:', favori);
    showAlert(`✅ Favori "${nom}" sauvegardé !`, 'success');
    
    return true;
}

function supprimerFavori(id) {
    const favoris = loadFavoris();
    const favori = favoris.find(f => f.id === id);
    
    if (!favori) {
        showAlert('❌ Favori introuvable', 'error');
        return;
    }
    
    // Confirmation
    if (!confirm(`⚠️ Supprimer le favori "${favori.nom}" ?\n\nAttention, vous devrez utiliser l'onglet de recherche pour refaire cette extraction. ÃŠtes-vous sÃ»r ?`)) {
        return;
    }
    
    const nouveauxFavoris = favoris.filter(f => f.id !== id);
    saveFavoris(nouveauxFavoris);
    
    showAlert(`✅ Favori "${favori.nom}" supprimé`, 'success');
    afficherListeFavoris();
}

async function reextraireFavori(id) {
    const favoris = loadFavoris();
    const favori = favoris.find(f => f.id === id);
    
    if (!favori) {
        showAlert('❌ Favori introuvable', 'error');
        return;
    }
    
    // Confirmation
    if (!confirm(`🔄 Re-extraire "${favori.nom}" ?\n\n⚠️ Attention : ceci va écraser les données actuelles. ÃŠtes-vous sÃ»r ?`)) {
        return;
    }
    
    console.log('🔄 Re-extraction favori:', favori);
    
    // Fermer le panneau
    toggleSettings();
    
    try {
        if (favori.type === 'geo') {
            // Restaurer les paramètres géo
            window.selectedCommuneData = favori.params.commune;
            
            // Sauvegarder dans localStorage
            localStorage.setItem('geo_criteria_type', favori.params.scope === 'commune' ? 'commune' : 'intercommunalite');
            localStorage.setItem('geo_criteria_value', 
                favori.params.scope === 'commune' ? favori.params.commune.nom : favori.params.epci.code
            );
            localStorage.setItem('geo_criteria_display', 
                favori.params.scope === 'commune' ? favori.params.commune.nom : favori.params.epci.nom
            );
            
            if (favori.params.scope === 'commune') {
                localStorage.setItem('geo_criteria_commune_mode', 'exact');
            }
            
            // Lancer extraction
            await refreshFromOnisep();
            
        } else if (favori.type === 'diplomes') {
            // Restaurer le contexte diplômes
            window.tabContexteDiplomes = {
                type: favori.params.geoType,
                value: favori.params.geoValue,
                displayName: favori.params.geoDisplay,
                diplomes: favori.params.diplomes,
                facetGeo: favori.params.geoType === 'departement' 
                    ? { facet_departement: window.getNomDepartement(favori.params.geoValue) }
                    : { facet_academie: window.getNomAcademie(favori.params.geoValue) }
            };
            
            // Lancer extraction
            const modal = document.getElementById('onisep-modal');
            modal.classList.add('active');
            
            const data = await onisepAPI.extractByDiplomes(
                favori.params.diplomes,
                window.tabContexteDiplomes.facetGeo,
                progress => {
                    const fill = document.getElementById('progress-fill');
                    const message = document.getElementById('progress-message');
                    const details = document.getElementById('progress-details');
                    
                    const percent = Math.round(progress.percent || 0);
                    fill.style.width = `${percent}%`;
                    fill.textContent = `${percent}%`;
                    message.textContent = progress.message || '';
                    
                    if (progress.current && progress.total) {
                        details.textContent = `${progress.current} / ${progress.total}`;
                    }
                }
            );
            
            await updateDatabase(data);
            
            // Enrichir avec langues
            try {
                await enrichirAvecLangues(true);
            } catch (error) {
                console.error('❌ Erreur enrichissement langues:', error);
            }
            
            modal.classList.remove('active');
            
            // Afficher résumé
            loadStats();
            loadView();
            switchTab('resultats');
            
            showAlert(`✅ Re-extraction "${favori.nom}" terminée !`, 'success');
        }
    } catch (error) {
        console.error('❌ Erreur re-extraction:', error);
        showAlert(`❌ Erreur: ${error.message}`, 'error');
    }
}

function afficherListeFavoris() {
    const favoris = loadFavoris();
    const container = document.getElementById('favoris-list');
    
    if (!container) return;
    
    if (favoris.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 48px; margin-bottom: 10px;">⭐</div>
                <p>Aucun favori enregistré</p>
                <p style="font-size: 13px; margin-top: 10px;">
                    Cochez "💾 Sauvegarder comme favori" dans l'onglet Recherche pour en créer un.
                </p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="u-mb-3" style="padding: 10px; background: var(--bg-light); border-radius: 6px;">
            <strong>${favoris.length}</strong> / ${MAX_FAVORIS} favori(s)
        </div>
    `;
    
    favoris.forEach(favori => {
        const date = new Date(favori.date);
        const typeIcon = favori.type === 'geo' ? '📍' : '🎓';
        const typeLabel = favori.type === 'geo' ? 'Géographique' : 'Par diplômes';
        
        html += `
            <div class="favori-item" style="margin-bottom: 10px; padding: 15px; background: white; border: 1px solid var(--border); border-radius: 8px;">
                <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 15px; margin-bottom: 5px;">
                            ${typeIcon} ${favori.nom}
                        </div>
                        <div class="u-text-xs u-text-muted">
                            ${typeLabel} • ${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="setting-button" onclick="reextraireFavori('${favori.id}')" style="flex: 1; padding: 8px; font-size: 13px;">
                        🔄 Re-extraire
                    </button>
                    <button class="setting-button secondary" onclick="supprimerFavori('${favori.id}')" style="padding: 8px; font-size: 13px;">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// =====================================
// MODALES
// =====================================
function openLoginModal() {
    if (!window.onisepExtractionController && !window.onisepExtractionController.isAuthenticated()) {
        document.getElementById('login-modal').classList.add('active');
    }
}

function closeLoginModal() {
    document.getElementById('login-modal').classList.remove('active');
}

function openHelpModal() {
    document.getElementById('help-modal').classList.add('active');
}

function closeHelpModal() {
    document.getElementById('help-modal').classList.remove('active');
}


// =====================================
// EXPOSITION GLOBALE
// =====================================
if (typeof window !== 'undefined') {
    window.toggleSettings = toggleSettings;
    window.toggleSection = toggleSection;
    window.saveOnisepCredentials = saveOnisepCredentials;
    window.connectFromSettings = connectFromSettings;
    window.logoutOnisep = logoutOnisep;
    window.fetchOnisepEstablishment = fetchOnisepEstablishment;
    window.saveUserEstablishment = saveUserEstablishment;
    window.exporterDonnees = exporterDonnees;
    window.importerFichier = importerFichier;
    window.confirmResetDatabase = confirmResetDatabase;
    window.executeResetDatabase = executeResetDatabase;
    window.closeResetConfirmModal = closeResetConfirmModal;
    window.openLoginModal = openLoginModal;
    window.closeLoginModal = closeLoginModal;
    window.openHelpModal = openHelpModal;
    window.closeHelpModal = closeHelpModal;
}
