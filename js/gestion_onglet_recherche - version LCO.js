/************************************************
 * Fichier : gestion_onglet_recherche.js
 * Description : Gestion de l'onglet Recherche (formulaires et extraction)
 * Auteur : Laurent COSTE
 * Date : 2026-02-03
 * Version : 2.0
 ************************************************/

// =====================================
// VARIABLES D'ÉTAT
// =====================================
let searchMode = 'geo'; // 'geo' | 'diplomes' | 'options'

// Gestion de l'arrêt de l'extraction par l'utilisateur
let extractionStopped = false;

// Instance de la modale d'extraction
// let extractionModal = null;  // ← Supprimée v0.27.2 - Le controller gère sa propre ProgressModal

// État recherche géographique
let selectedCommune = null;
let selectedScope = null; // 'commune' | 'epci' | 'departement' | 'academie'
let searchTimeout = null;

// État recherche par items (diplômes et options de 2nde GT)
let ItemsDisponibles = null;
let itemsGeoType = 'departement';
let itemsGeoValue = null;
let itemsGeoDisplay = null;

// =====================================
// INITIALISATION
// =====================================

/**
 * Initialise l'onglet de recherche
 * @returns {Promise<void>}
 */
async function initSearchTab() {
    console.log('[Recherche] Initialisation de l\'onglet');
    
    // Plus besoin de créer extractionModal ici - le controller gère sa propre ProgressModal
    
    document.getElementById('tab-mode-geo').click();
}

// =====================================
// BASCULEMENT MODE D'EXTRACTION
// =====================================

/**
 * Bascule entre les modes d'extraction (géographique, diplômes ou options 2nde GT)
 * @returns {void}
 */
function switchExtractionMode() {
    const mode = document.querySelector('input[name="tab-extraction-mode"]:checked').value;
    searchMode = mode;
    
    console.log(`[Recherche] Basculement vers mode: ${mode}`);
    
    // Masquer tous les panneaux
    const geoPanel = document.getElementById('tab-panel-mode-geo');
    const diplomesPanel = document.getElementById('tab-panel-mode-diplomes');
    const optionsPanel = document.getElementById('tab-panel-mode-options');
    geoPanel.classList.add('u-hidden');
    diplomesPanel.classList.add('u-hidden');
    optionsPanel.classList.add('u-hidden');

    // Afficher le panneau approprié et réinitialiser l'état
    if (mode === 'geo') {
        geoPanel.classList.remove('u-hidden');
        resetGeoSearch();
    } else if (mode === 'diplomes') {
        diplomesPanel.classList.remove('u-hidden');
        resetItemsSearch('diplomes');
    } else if (mode === 'options') {
        optionsPanel.classList.remove('u-hidden');
        resetItemsSearch('options');
    }
}


// =====================================
// RECHERCHE GÉOGRAPHIQUE
// =====================================

/**
 * Gère la recherche intelligente de commune (debounced)
 * Appelée à chaque saisie dans le champ de recherche
 * @returns {Promise<void>}
 */
async function handleSmartSearch() {
    const input = document.getElementById('tab-smart-search-commune');
    const query = input.value.trim();
    const helpDiv = document.getElementById('tab-smart-search-help');
    const resultsContainer = document.getElementById('tab-smart-search-results');
    const resultsDiv = document.getElementById('tab-smart-search-results-list');
    const clearBtn = document.getElementById('tab-btn-clear-geo');
    
    // Activer/désactiver le bouton effacer selon la saisie
    if (clearBtn) {
        clearBtn.disabled = query.length === 0;
    }
    
    // Réinitialiser le timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Moins de 3 caractères : masquer les résultats
    if (query.length < 3) {
        resultsContainer.classList.add('u-hidden');
        resultsContainer.style.display = 'none';  // Force hide
        helpDiv.innerHTML = '💡 Entrez au moins 3 caractères pour rechercher';
        helpDiv.style.color = 'var(--text-light)';
        return;
    }
    
    // Afficher un loader
    helpDiv.innerHTML = '🔄 Recherche en cours...';
    helpDiv.style.color = 'var(--text-light)';
    
    // Débounce de 300ms
    searchTimeout = setTimeout(async () => {
        try {
            const communes = await searchCommunes(query);
            displaySearchResults(communes);
        } catch (error) {
            console.error('[Recherche] Erreur recherche commune:', error);
            helpDiv.innerHTML = '❌ Erreur lors de la recherche';
            helpDiv.style.color = 'var(--danger)';
        }
    }, 300);
}

/**
 * Recherche des communes via l'API Geo
 * @param {string} query - Nom de commune
 * @returns {Promise<Commune[]>}
 */
async function searchCommunes(query) {
    console.log(`[Recherche] Recherche de communes: "${query}"`);
    
    try {
        const communes = await window.geoExtractionController.searchCommunes(query, { limit: 100 });
        console.log(`[Recherche] ${communes.length} commune(s) trouvée(s)`);

        return communes;
    }
    catch {
            console.error('[Recherche] Erreur recherche commune:', error);
            helpDiv.innerHTML = '❌ Erreur lors de la recherche';
            helpDiv.style.color = 'var(--danger)';
    }
}

/**
 * Affiche les résultats de recherche de communes
 * @param {Commune[]} communes - Liste de communes
 * @returns {void}
 */
async function displaySearchResults(communes) {
    const resultsContainer = document.getElementById('tab-smart-search-results');
    const resultsDiv = document.getElementById('tab-smart-search-results-list');
    const helpDiv = document.getElementById('tab-smart-search-help');
    
    if (communes.length === 0) {
        resultsContainer.classList.add('u-hidden');
        resultsContainer.style.display = 'none';  // Force hide
        helpDiv.innerHTML = '🔍 Aucune commune trouvée';
        helpDiv.style.color = 'var(--text-light)';
        return;
    }
    
    // Afficher le conteneur de résultats
    resultsContainer.classList.remove('u-hidden');
    resultsContainer.style.display = 'block';
    helpDiv.innerHTML = `📍 ${communes.length} commune(s) trouvée(s)`;
    helpDiv.style.color = 'var(--success)';
    
    // Construire la liste des résultats
    let html = '';
    for(const commune of communes) {
        const epci = await window.geoExtractionController.getEPCIByCode(commune.codeEpci);
        html += `<div class="search-result-item" onclick="selectCommune('${commune.code}')">
            <div class="search-result-name">${commune.nom} ${commune.population ? '(' + commune.population.toLocaleString() + ' hab.)' : '' } </div>
            <div class="search-result-info">
                Code postaux : ${commune.codesPostaux.join(', ')} · Code Insee : ${commune.code}
                ${epci ? ' · Fait partie de l\'intercommunalité "' + epci.nom + '"': ''}
            </div>
        </div>`;
    };
    
    resultsDiv.innerHTML = html;
    resultsContainer.classList.remove('u-hidden');
    resultsContainer.style.display = 'block';  // Force display
    
    // Message avec changement de couleur si limite atteinte
    let message = `✅ ${communes.length} commune(s) trouvée(s)`;
    let couleur = 'var(--success)';
    
    if (communes.length >= 100) {
        message += ' <strong>(limite atteinte, affinez votre recherche en tapant plus de caractères)</strong>';
        couleur = 'var(--warning)';
    }
    
    helpDiv.innerHTML = message;
    helpDiv.style.color = couleur;
}

/**
 * Sélectionne une commune
 * @param {string} codeCommune - Code INSEE de la commune
 * @returns {Promise<void>}
 */
async function selectCommune(codeCommune) {
    console.log(`[Recherche] Sélection de la commune: ${codeCommune}`);
    
    try {
        // Récupérer les détails de la commune
        const commune = await window.geoExtractionController.getCommuneByCode(codeCommune);
        
        // Récupérer l'EPCI si disponible
        let epciInfo = null;
        if (commune.codeEpci) {
            try {
                const epci = await window.geoExtractionController.getEPCIByCode(commune.codeEpci);
                epciInfo = {
                    nom: epci.nom,
                    nombreCommunes: epci.population ? `${(epci.population / 1000).toFixed(0)}k hab.` : ''
                };
            } catch (error) {
                console.warn('[Recherche] Impossible de récupérer EPCI:', error);
            }
        }
        
        selectedCommune = commune;
        selectedCommune.epciInfo = epciInfo; // Stocker l'info EPCI
        
        // Afficher la sélection
        displaySelection(commune, epciInfo);
        
        // Masquer les résultats de recherche
        document.getElementById('tab-smart-search-results').style.display = 'none';
    } catch (error) {
        console.error('[Recherche] Erreur sélection commune:', error);
        showAlert('❌ Erreur lors de la sélection de la commune', 'error');
    }
}

/**
 * Affiche la commune sélectionnée et les boutons de périmètre
 * @param {Commune} commune - Commune sélectionnée
 * @param {Object} epciInfo - Informations EPCI
 * @returns {void}
 */
function displaySelection(commune, epciInfo = null) {
    const selectionDiv = document.getElementById('tab-smart-selection');
    
    // Info EPCI si disponible
    let epciHTML = '';
    if (epciInfo) {
        epciHTML = `
            <div class="selection-epci">
                <strong>Intercommunalité :</strong> ${epciInfo.nom}
                ${epciInfo.nombreCommunes ? `<span class="u-text-muted"> • ${epciInfo.nombreCommunes}</span>` : ''}
            </div>
        `;
    }
    
    selectionDiv.innerHTML = `
        <div class="selection-info">
            <strong>${commune.nom}</strong> (${commune.codesPostaux.join(', ')})
            <button onclick="clearSelection()" class="btn-clear">✕</button>
        </div>
        ${epciHTML}
        <div class="selection-actions">
            <p>Choisissez le périmètre de recherche :</p>
            <div class="scope-buttons">
                <button class="scope-btn" onclick="chooseExtractionScope('commune')">
                    📍 Commune seule
                </button>
                <button class="scope-btn ${!epciInfo ? 'disabled' : ''}" 
                        onclick="chooseExtractionScope('intercommunalite')"
                        ${!epciInfo ? 'disabled title="Pas d\'intercommunalité trouvée"' : ''}>
                    🏘️ Intercommunalité
                </button>
            </div>
        </div>
    `;
    
    selectionDiv.classList.remove('u-hidden');
    selectionDiv.style.display = 'block';  // Force display
}

/**
 * Choix du périmètre d'extraction
 * @param {'commune'|'intercommunalite'} scope - Périmètre
 * @returns {Promise<void>}
 */
async function chooseExtractionScope(scope) {
    console.log(`[Recherche] Choix du périmètre: ${scope}`);
    
    selectedScope = scope;
    
    // Mettre à jour l'affichage (activer le bouton, afficher les infos)
    document.querySelectorAll('.scope-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Activer le bouton d'extraction
    const extractBtn = document.getElementById('tab-btn-extract-geo');
    extractBtn.disabled = false;
    extractBtn.innerHTML = `🚀 Lancer l'extraction (${scope})`;
}


/**
 * Lance l'extraction géographique
 * @returns {Promise<void>}
 */
/**
 * Lance l'extraction géographique
 * Adapté de v0.18.4 refreshFromOnisep()
 */
async function lancerExtractionGeo() {
    console.log('[Recherche] Lancement extraction géographique');
    
    // Masquer le résumé d'extraction précédent
    const summary = document.getElementById('extraction-summary');
    if (summary) summary.classList.add('u-hidden');
    
    // Vérifications
    if (!selectedCommune || !selectedScope) {
        showAlert('⚠️ Veuillez sélectionner une commune et un périmètre', 'warning');
        return;
    }
    
    if (!window.onisepExtractionController || !window.onisepExtractionController.isAuthenticated()) {
        showAlert('⚠️ Veuillez vous connecter à ONISEP d\'abord', 'warning');
        return;
    }
    
    // Préparer les paramètres
    const geoType = selectedScope; // 'commune' ou 'intercommunalite'
    let geoValue;
    let geoDisplay;

    if (selectedScope === 'commune') {
        geoValue = selectedCommune.code; // Code INSEE de la commune
        geoDisplay = selectedCommune.nom
    } else if (selectedScope === 'intercommunalite') {
        if (!selectedCommune.codeEpci) {
            showAlert('⚠️ Code EPCI manquant', 'error');
            return;
        }
        geoValue = selectedCommune.codeEpci; // Code SIREN de l'EPCI
        geoDisplay = window.geoExtractionController.getEPCIByCode(selectedCommune.codeEpci);
    }
    
    // Sauvegarder les critères
    localStorage.setItem('geo_criteria_type', geoType);
    localStorage.setItem('geo_criteria_value', geoValue);
    localStorage.setItem('geo_criteria_display', geoDisplay);
    
    console.log(`[Recherche] Extraction : ${geoType} = ${geoValue}`);
    
    // Réinitialiser le flag d'arrêt
    window.extractionStopped = false;
    
    // Gérer le bouton Stop
    const btnStop = document.getElementById('btn-stop-extraction');
    if (btnStop) {
        btnStop.classList.remove('u-hidden');
        // btnStop.disabled = false;  // Supprimé : disabled n\'existe pas sur <span>
        // btnStop.textContent = '🛑 Arrêter l\'extraction';  // Ne pas modifier la croix
    }
    
    try {
        // Vérifier que le controller existe
        if (!window.onisepExtractionController) {
            throw new Error('Controller d\'extraction ONISEP non initialisé');
        }
        
        // Préparer les paramètres pour le controller
        const extractionParams = {
            type: geoType,
            value: geoValue,
            displayInfo: {
                nom: geoDisplay,
                codeEpci: selectedScope === 'intercommunalite' ? selectedCommune.codeEpci : null
            }
        };
        
        // Appeler le CONTROLLER - il gère toute la modale
        const result = await window.onisepExtractionController.extractByGeo(extractionParams);
        
        // Vérifier si l'extraction a été annulée ou a échoué
        if (!result.success) {
            // Le contrôleur a déjà géré la modale
            if (btnStop) btnStop.classList.add('u-hidden');
            showAlert(result.message || '⚠️ Extraction interrompue', 'warning');
            return;
        }
        
        // Succès - le contrôleur a géré la modale
        const data = {
            lycees: { length: result.stats.etablissements },
            diplomes: { length: result.stats.diplomes },
            diplomes_par_lycee: { length: result.stats.relations }
        };
        
        // Cacher le bouton Stop
        // if (btnStop) btnStop.classList.add('u-hidden');  // Gardé visible
        
        // Sauvegarder la date
        localStorage.setItem('last_extraction_date', new Date().toISOString());
        
        // Recharger les stats et basculer vers résultats
        if (typeof loadStats === 'function') loadStats();
        if (typeof loadView === 'function') loadView();
        if (typeof switchToResults === 'function') {
            setTimeout(() => switchToResults(), 10000);
        }
        
        // Message succès
        showAlert(`✅ ${data.lycees.length} établissements et ${data.diplomes_par_lycee.length} diplômes (dont ${data.diplomes.length} uniques) extraits de ${geoDisplay} !`, 'success');
        
    } catch (error) {
        console.error('[Recherche] Erreur extraction:', error);
        // Le contrôleur a déjà géré l'affichage de l'erreur dans la modale
        if (btnStop) btnStop.classList.add('u-hidden');
        showAlert(`❌ Erreur lors de l'extraction : ${error.message}`, 'error');
    }
}

/**
 * Efface la sélection actuelle
 * @returns {void}
 */
function clearSelection() {
    selectedCommune = null;
    selectedScope = null;
    
    document.getElementById('tab-smart-selection').style.display = 'none';
    document.getElementById('tab-smart-search-commune').value = '';
    document.getElementById('tab-btn-extract-geo').disabled = true;
    document.getElementById('tab-btn-clear-geo').disabled = true;
    
    // Réinitialiser le message d'aide
    const helpDiv = document.getElementById('tab-smart-search-help');
    const resultsContainer = document.getElementById('tab-smart-search-results');
    if (helpDiv) {
        helpDiv.innerHTML = '💡 Entrez au moins 3 caractères pour rechercher';
        helpDiv.style.color = 'var(--text-light)';
    }
    if (resultsContainer) {
        resultsContainer.classList.add('u-hidden');
        resultsContainer.style.display = 'none';
    }
}

/**
 * Réinitialise la recherche géographique
 * @returns {void}
 */
function resetGeoSearch() {
    clearSelection();
    document.getElementById('tab-smart-search-results').style.display = 'none';
}

// =====================================
// RECHERCHE PAR ITEMS (diplômes ou options de 2nde GT)
// =====================================

/**
 * Met à jour les champs géographiques pour la recherche par items
 * @param {string} type 'diplomes' | 'options'
 * @returns {void}
 */
function updateItemsGeoFields(type) {
    if (!(type === 'diplomes' || type === 'options')) {
        console.warn('[afficherItemsCheckboxes] Type d\'items inconnu : ', type);
        return;
    }

    itemsGeoType = document.getElementById(`tab-${type}-geo-type`).value;
    console.log(`[updateItemsGeoFields] Recherches d'items par ${itemsGeoType}`);
    
    const deptDiv = document.getElementById(`tab-${type}-departement-field`);
    const acaDiv = document.getElementById(`tab-${type}-academie-field`);
    
    // Masquer tous les champs
    if (deptDiv) deptDiv.classList.add('u-hidden');
    if (acaDiv) acaDiv.classList.add('u-hidden');
    
    // Afficher le champ correspondant
    if (itemsGeoType === 'departement' && deptDiv) {
        deptDiv.classList.remove('u-hidden');
    } else if (itemsGeoType === 'academie' && acaDiv) {
        acaDiv.classList.remove('u-hidden');
    }
    // France entière : rien à afficher
}

/**
 * Sélectionne/désélectionne toutes les checkboxes
 * @param {string} type - 'diplomes' | 'options'
 * @param {boolean} selectAll - true pour tout sélectionner
 * @returns {void}
 */
function toggleToutesCheckboxes(type, selectAll) {
    console.log('[toggleToutesCheckboxes] Paramètres :', type, selectAll);
    
    const allCheckBoxes = document.querySelectorAll(`.${type}-checkbox`);
    if (!allCheckBoxes) {
        console.warn('[toggleToutesCheckboxes] Impossible de récupérer les checkboxes');
        return;
    }
    console.log('[toggleToutesCheckboxes] checkboxes : ', allCheckBoxes);
    allCheckBoxes.forEach(checkbox => {
        console.log('[toggleToutesCheckboxes] checkbox : ', checkbox);
        checkbox.checked = selectAll;
    });
    
    // Utiliser la fonction correcte qui met à jour tab-selection-count-diplomes
    updateSelectedItemsCount(type);
}

/**
 * Retour à l'étape 1 (choix zone géographique)
 * @param {string} type - 'diplomes' | 'options'
 * @returns {void}
 */
function retourEtape1(type) {
    if (!(type === 'diplomes' || type === 'options')) {
        console.warn('[retourEtape1] Type inconnu :', type);
        return;
    }
    document.getElementById(`tab-${type}-etape-2`).style.display = 'none';
    document.getElementById(`tab-${type}-etape-1`).style.display = 'block';
}

/**
 * Filtre les items affichés selon la saisie dans le champ de recherche
 * @param {string} type 'diplomes' | 'options'
 * @returns {void}
 */
function filtrerItemsParRecherche(type) {
    const search = document.getElementById(`tab-search-${type}`).value.toLowerCase();
    document.querySelectorAll(`#tab-${type}-list label`).forEach(label => {
        const visible = label.textContent.toLowerCase().includes(search);
        label.style.display = visible ? 'flex' : 'none';
    });
    updateSelectedItemsCount(type);
}

/**
 * Lance l'extraction par diplômes ou par options
 * @param {string} type 'diplomes' | 'options'
 * @returns {Promise<void>}
 */
async function lancerExtractionItems(type) {
    console.log('[lancerExtractionItems] Lancement extraction par :',type);
    
    // Masquer le résumé d'extraction précédent
    const summary = document.getElementById('extraction-summary');
    if (summary) summary.classList.add('u-hidden');
    
    // Le filtre géographique a été validé à l'étape 1 : on le reprend tel quel
    console.log(`[lancerExtractionItems] Zone géographique : ${itemsGeoType} = ${itemsGeoValue}`);

    // Récupérer le tableau des items sélectionnés
    const checkboxes = document.querySelectorAll(`#tab-${type}-list .${type}-checkbox:checked`);
    selectedItems  = Array.from(checkboxes).map(cb => cb.value);    
    if (selectedItems.length === 0) {
        showAlert('⚠️ Veuillez sélectionner au moins un item', 'warning');
        return;
    }
    console.log('[lancerExtractionItems] Items sélectionnés', selectedItems);
    
    // Réinitialiser le flag d'arrêt
    window.extractionStopped = false;
    
    // Gérer le bouton Stop
    const btnStop = document.getElementById('btn-stop-extraction');
    if (btnStop) {
        btnStop.classList.remove('u-hidden');
    }

    try {
        // Appeler le bon CONTROLLER - il gère toute la modale
        let result = null;
        if (type === 'diplomes') {
            result = await window.onisepExtractionController.extractByDiplomes({
                libelles: selectedItems,
                type: itemsGeoType,
                value: itemsGeoValue,
                displayInfo: {nom: itemsGeoValue}
            });
        } else {
            result = await window.onisepExtractionController.extractByOptions({
                libelles: selectedItems,
                type: itemsGeoType,
                value: itemsGeoValue,
                displayInfo: {nom: itemsGeoValue}
            });
        }
        
        // Vérifier si l'extraction a été annulée ou a échoué
        if (!result.success) {
            if (btnStop) btnStop.classList.add('u-hidden');
            showAlert(result.message || '⚠️ Extraction interrompue', 'warning');
            return;
        }

        // Succès - le contrôleur a géré la modale
        const data = {
            etablissements: { length: result.stats.etablissements },
            diplomes: { length: result.stats.diplomes },
            diplomes_par_etablissement: { length: result.stats.relations }
        };

        // Sauvegarder la date
        localStorage.setItem('last_extraction_date', new Date().toISOString());
        
        // Recharger les stats et basculer vers résultats
        if (typeof loadStats === 'function') loadStats();
        if (typeof loadView === 'function') loadView();
        if (typeof switchToResults === 'function') {
            setTimeout(() => switchToResults(), 10000);
        }
        
        // Message succès
        showAlert(`✅ ${data.etablissements.length} établissements et ${data.diplomes_par_etablissement.length} diplômes (dont ${data.diplomes.length} uniques) !`, 'success');
        
    } catch (error) {
        console.error('[Recherche] Erreur extraction:', error);
        // Le contrôleur a déjà géré l'affichage de l'erreur dans la modale
        if (btnStop) btnStop.classList.add('u-hidden');
        showAlert('❌ Erreur lors de l\'extraction : ' + error.message, 'error');
    }
}

/**
 * Réinitialise la recherche par items
 * @param {String} type - 'options' | 'diplomes' 
 * @returns {void}
 */
function resetItemsSearch(type) {
    if (!(type === 'diplomes' || type === 'options')) {
        console.warn('[afficherItemsCheckboxes] Type d\'items inconnu : ', type);
        return;
    }
    console.log('[resetItemsSearch] Réinitialisation de la recherche');
    availableItems = [];
    selectedItems  = [];
    itemsGeoType    = 'departement';
    itemsGeoValue   = null;

    // Réafficher étape 1, masquer étape 2
    const etape1 = document.getElementById(`tab-${type}-etape-1`);
    const etape2 = document.getElementById(`tab-${type}-etape-2`);
    if (etape1) etape1.style.display = 'block';
    if (etape2) etape2.style.display = 'none';

    // Remettre le type sur "département"
    const geoTypeSelect = document.getElementById(`tab-${type}-geo-type`);
    if (geoTypeSelect) geoTypeSelect.value = 'departement';
    updateItemsGeoFields(type);
}

/**
 * Charge les items disponibles dans la zone sélectionnée
 * ⚠️ Noms de facettes de 'actions_lycee' :
 *       département : 'facet.ens_departement'
 *       académie    : 'facet.ens_academie'
 *    Noms de facettes de 'enseignements_optionnels_2nde' :
 *       département : 'facet.departement_lieu_de_cours'
 *       académie    : 'facet.academie_lieu_de_cours'
 * @param {String} type - 'options' | 'diplomes' 
 * @returns {Promise<void>}
 */
async function chargerItemsDisponibles(type) {
    if (!(type === 'diplomes' || type === 'options')) {
        console.warn('[chargerItemsDisponibles] Type d\'items inconnu : ', type);
        return;
    }
    console.log('[chargerItemsDisponibles] Chargement des items disponibles pour : ', type);

    // Récupérer le périmètre géographique choisi
    itemsGeoType  = document.getElementById(`tab-${type}-geo-type`).value;
    itemsGeoValue = itemsGeoType === 'departement'
        ? document.getElementById(`tab-${type}-departement`).value
        : document.getElementById(`tab-${type}-academie`).value;
    itemsGeoDisplay = itemsGeoType === 'departement'
        ? window.getNomDepartement(itemsGeoValue)
        : window.getNomAcademie(itemsGeoValue);
    console.log('[chargerItemsDisponibles] Périmètre géographique:', itemsGeoType, ' = ', itemsGeoValue, '(', itemsGeoDisplay, ')');
    if (!itemsGeoValue) {
        showAlert('⚠️ Veuillez sélectionner un périmètre', 'warning');
        return;
    }

    const btn = document.getElementById(`tab-btn-charger-options`);
    btn.disabled = true;
    btn.textContent = '⏳ Chargement...';

    try {
        // Construire la facette avec les noms propres à chaque dataset
        // et appeler la bonne fonction d'extraction
        let facetGeo = {};
        let result = null;
        if (type === 'diplomes') {
            if (itemsGeoType === 'departement') {
                facetGeo = { 'facet.ens_departement': itemsGeoDisplay };
            } else {
                facetGeo = { 'facet.ens_academie': itemsGeoDisplay };
            }
            console.log('[chargerItemsDisponibles] Facette géo :', facetGeo);
            result = await window.onisepExtractionController.extractDiplomesDisponiblesByZone(facetGeo);
        } else {
            if (itemsGeoType === 'departement') {
                facetGeo = { 'facet.departement_lieu_de_cours': itemsGeoDisplay };
            } else {
                facetGeo = { 'facet.academie_lieu_de_cours': itemsGeoDisplay };
            }
            console.log('[chargerItemsDisponibles] Facette géo :', facetGeo);
            result = await window.onisepExtractionController.extractOptions2ndeGTDisponiblesByZone(facetGeo);
        }
        if (!result.items || result.items.length === 0) {
            showAlert('❌ Aucun item trouvé pour ce périmètre', 'error');
            return;
        }

        // Sauvegarder contexte
        window.tabContexteItems = {
            type:        itemsGeoType,
            value:       itemsGeoValue,
            displayName: itemsGeoType + ' - ' + itemsGeoDisplay,
            items:  result.items,
            facetGeo: facetGeo
        };
        availableItems = result.items;

        console.log('[chargerItemsDisponibles] Items trouvées :', result.items);

        // Passer à l'étape 2 
        afficherItemsCheckboxes(type, result.items);
        document.getElementById(`tab-${type}-perimetre-info`).textContent = window.tabContexteItems.displayName;
        document.getElementById(`tab-${type}-etape-1`).style.display = 'none';
        document.getElementById(`tab-${type}-etape-2`).style.display = 'block';

        showAlert(`✅ ${result.items.length} item(s) disponible(s)`, 'success');

    } catch (error) {
        console.error('[chargerItemsDisponibles] Erreur chargement items:', error);
        showAlert(`❌ Erreur: ${error.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '➡️ Charger les items disponibles';
    }
}


/**
 * Affiche la liste des items sous forme de checkboxes
 * @param {String} type - 'options' | 'diplomes' 
 * @param {Array<{libelle: string, nbEtablissements: number}>} values
 * @returns {void}
 */
function afficherItemsCheckboxes(type, values) {
    if (!(type === 'diplomes' || type === 'options')) {
        console.warn('[afficherItemsCheckboxes] Type d\'items inconnu : ', type);
        return;
    }

    // On récupère le container
    const container = document.getElementById(`tab-${type}-list`);
    if (!container) {
        console.warn('[afficherItemsCheckboxes] Impossible de récupérer le container');
        return;
    }

    // On construit la liste
    // TODO : pour les diplômes, on groupait les CAP et les Bac en 2 catégories 
    // Peut-être à mettreen place à nouveau ici.
    const html = values.map(val => `
        <label class="diplome-item">
            <input type="checkbox" class="${type}-checkbox"
                   value="${val.libelle.replace(/"/g, '&quot;')}"
                   onchange="updateSelectedItemsCount('${type}')">
            <div class="diplome-info">
                <div class="diplome-intitule">${val.libelle}</div>
                <div class="diplome-meta">${val.nbEtablissements} établissement(s) dans la zone</div>
            </div>
        </label>
    `).join('');
    container.innerHTML = html;

    // On met à jour la variable globale et le compte
    ItemsDisponibles = values;
    updateSelectedItemsCount(type);
}

/**
 * Met à jour le compteur de checkboxes sélectionnées
 * @param {String} type 'diplomes' | 'options'
 * @returns {void}
 */
function updateSelectedItemsCount(type) {
    if (!(type === 'diplomes' || type === 'options')) {
        console.warn('[updateSelectedItemsCount] Type d\'items inconnu : ', type);
        return;
    }
    const checkboxes = document.querySelectorAll(`#tab-${type}-list .${type}-checkbox:checked`);
    if (!checkboxes) {
        console.warn('[updateSelectedItemsCount] Impossible de récupérer les checkboxes cochées');
        return;
    }
    const counter = document.getElementById(`tab-selection-count-${type}`);
    if (counter) {
        counter.textContent = checkboxes.length;
    } else {
        console.warn('[updateSelectedItemsCount] Impossible de récupérer le compteur de checkboxes cochées');
    }
}


// =====================================
// EXPOSITION GLOBALE
// =====================================
if (typeof window !== 'undefined') {
    // Mode d'extraction
    window.switchExtractionMode = switchExtractionMode;
    window.initSearchTab = initSearchTab;

    // Recherche géographique
    window.handleSmartSearch = handleSmartSearch;
    window.selectCommune = selectCommune;
    window.chooseExtractionScope = chooseExtractionScope;
    window.lancerExtractionGeo = lancerExtractionGeo;
    window.clearSelection = clearSelection;
    
    // Commun recherche par diplômes et par options 2nde GT
    window.updateSelectedItemsCount = updateSelectedItemsCount;
    window.afficherItemsCheckboxes = afficherItemsCheckboxes;
    window.toggleToutesCheckboxes = toggleToutesCheckboxes;
    window.lancerExtractionItems = lancerExtractionItems;
    window.updateItemsGeoFields = updateItemsGeoFields;
    window.resetItemsSearch = resetItemsSearch;
    window.chargerItemsDisponibles = chargerItemsDisponibles;
    window.retourEtape1 = retourEtape1;
    window.filtrerItemsParRecherche = filtrerItemsParRecherche;
}

/**
 * Arrête l'extraction en cours et ferme la modale
 */
function stopAndCloseExtraction() {
    console.log('[Extraction] Arrêt demandé par l\'utilisateur');
    
    // Marquer l'extraction comme arrêtée
    window.extractionStopped = true;
}

