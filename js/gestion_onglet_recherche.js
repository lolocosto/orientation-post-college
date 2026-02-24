/************************************************
 * Fichier : gestion_onglet_recherche.js
 * Description : Gestion de l'onglet Recherche (formulaires et extraction)
 * Auteur : Laurent COSTE
 * Date : 2026-02-03
 * Version : 2.0
 ************************************************/

// ── Couche d'abstraction préférences (v0.45) ──────────────────────────────────
// Délègue à db_service si disponible, sinon localStorage (fallback v0.44).

/**
 * Lit une préférence via db_service si disponible, sinon localStorage.
 * @param {string} cle - Clé de préférence
 * @returns {string|null}
 */
function _prefLireRecherche(cle) {
    if (window.databaseService && window.databaseService.lirePreference) {
        return window.databaseService.lirePreference(cle);
    }
    return localStorage.getItem(cle);
}

/**
 * Sauvegarde une préférence via db_service + localStorage (double écriture pour compatibilité).
 * @param {string} cle - Clé de préférence
 * @param {string} val - Valeur à stocker
 */
function _prefSauverRecherche(cle, val) {
    if (window.databaseService && window.databaseService.sauvegarderPreference) {
        window.databaseService.sauvegarderPreference(cle, val);
    }
    localStorage.setItem(cle, val);
}

// =====================================
// VARIABLES D'ÉTAT
// =====================================
let searchMode = 'geo'; // 'geo' | 'diplomes' | 'options'

// Gestion de l'arrêt de l'extraction par l'utilisateur
let extractionStopped = false;

/**
 * Utilitaire : applique une classe de couleur sur un élément d'aide
 * en supprimant les autres. Evite les .style.color inline.
 * @param {HTMLElement} el
 * @param {'help'|'error'|'success'|'warn'} state
 */
function setHelpState(el, state) {
    el.classList.remove('u-text-help', 'u-text-error', 'u-text-ok', 'u-text-warn');
    const map = { help: 'u-text-help', error: 'u-text-error', success: 'u-text-ok', warn: 'u-text-warn' };
    if (map[state]) el.classList.add(map[state]);
}

// Instance de la modale d'extraction
// let extractionModal = null;  // ← Supprimée v0.27.2 - Le controller gère sa propre ProgressModal

// État recherche géographique
let selectedCommune = null;
let selectedScope = null; // 'commune' | 'epci' | 'departement' | 'academie'
let searchTimeout = null;

// État recherche par items (diplômes et options de 2nde GT)
let ItemsDisponibles = null;
let availableItems   = [];  // Items disponibles chargés à l'étape 1 (avec nbEtablissements/nbEtablissementsApprentissage)
let selectedItems    = [];  // Libellés des items cochés en étape 2
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
    // Pas de .click() ici : le radio tab-mode-geo est déjà checked dans le HTML.
    // Un .click() programmatique sur un radio déjà sélectionné peut provoquer
    // des effets de bord (changement de mode, déclenchement d'onchange) selon le navigateur.
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
        setHelpState(helpDiv, 'help');
        return;
    }
    
    // Afficher un loader
    helpDiv.innerHTML = '🔄 Recherche en cours...';
    setHelpState(helpDiv, 'help');
    
    // Débounce de 300ms
    searchTimeout = setTimeout(async () => {
        try {
            const communes = await searchCommunes(query);
            displaySearchResults(communes);
        } catch (error) {
            console.error('[Recherche] Erreur recherche commune:', error);
            helpDiv.innerHTML = '❌ Erreur lors de la recherche';
            setHelpState(helpDiv, 'error');
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
            setHelpState(helpDiv, 'error');
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
        setHelpState(helpDiv, 'help');
        return;
    }
    
    // Afficher le conteneur de résultats
    resultsContainer.classList.remove('u-hidden');
    resultsContainer.style.display = 'block';
    helpDiv.innerHTML = `📍 ${communes.length} commune(s) trouvée(s)`;
    setHelpState(helpDiv, 'success');
    
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
    setHelpState(helpDiv, couleur === 'var(--warning)' ? 'warn' : 'success');
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
    _prefSauverRecherche('geo_criteria_type', geoType);
    _prefSauverRecherche('geo_criteria_value', geoValue);
    _prefSauverRecherche('geo_criteria_display', geoDisplay);
    
    console.log(`[Recherche] Extraction : ${geoType} = ${geoValue}`);
    
    // Réinitialiser le flag d'arrêt
    window.extractionStopped = false;

    // ── VIDER LES DONNÉES PRÉCÉDENTES ─────────────────────────────────────
    // Une nouvelle recherche géo remplace toujours les données existantes
    if (window.databaseService) {
        await window.databaseService.clearAllData();
        console.log('[Recherche] Base vidée avant nouvelle extraction');
    }
    
    // Gérer le bouton Stop
    const btnStop = document.getElementById('btn-stop-extraction');
    if (btnStop) {
        btnStop.classList.remove('u-hidden');
        // btnStop.disabled = false;  // Supprimé : disabled n\'existe pas sur <span>
        // btnStop.textContent = '🛑 Arrêter l\'extraction';  // Ne pas modifier la croix
    }
    
    const voies = getVoiesSelectionnees('geo');
    if (voies.length === 0) {
        showAlert('⚠️ Veuillez sélectionner au moins une voie (scolaire et/ou apprentissage) avant de lancer la recherche.', 'warning');
        if (btnStop) btnStop.classList.add('u-hidden');
        return;
    }
    const geoParams = {
        type: geoType,
        value: geoValue,
        displayInfo: {
            nom: geoDisplay,
            codeEpci: selectedScope === 'intercommunalite' ? selectedCommune.codeEpci : null
        }
    };

    // Statistiques cumulées sur les deux voies
    const statsGlobales = { etablissements: 0, diplomes: 0, relations: 0 };
    let erreurCritique = false;

    try {
        // ── VOIE SCOLAIRE (ONISEP) ────────────────────────────────────────
        if (voies.includes('scolaire')) {
            if (!window.onisepExtractionController) {
                throw new Error('Controller d\'extraction ONISEP non initialisé');
            }
            const result = await window.onisepExtractionController.extractByGeo({
                ...geoParams,
                voies: ['scolaire']
            });
            if (!result.success) {
                if (btnStop) btnStop.classList.add('u-hidden');
                showAlert(result.message || '⚠️ Extraction scolaire interrompue', 'warning');
                return;
            }
            statsGlobales.etablissements += result.stats.etablissements || 0;
            statsGlobales.diplomes      += result.stats.diplomes       || 0;
            statsGlobales.relations     += result.stats.relations       || 0;
        }

        // ── VOIE APPRENTISSAGE (CARIF-OREF) ───────────────────────────────
        if (voies.includes('apprentissage')) {
            if (!window.carifOrefExtractionController) {
                throw new Error('Controller d\'extraction CARIF-OREF non initialisé');
            }
            const result = await window.carifOrefExtractionController.extractByGeo(geoParams);
            if (!result.success) {
                if (btnStop) btnStop.classList.add('u-hidden');
                showAlert(result.message || '⚠️ Extraction apprentissage interrompue', 'warning');
                return;
            }
            statsGlobales.etablissements += result.stats.etablissements || 0;
            statsGlobales.diplomes       += result.stats.diplomes       || 0;
            statsGlobales.relations      += result.stats.relations      || 0;
        }

        // ── Succès ────────────────────────────────────────────────────────
        _prefSauverRecherche('last_extraction_date', new Date().toISOString());
        if (typeof loadStats === 'function') loadStats();
        if (typeof loadView === 'function') loadView();

        const voiesLabel = voies.join(' + ');
        showAlert(
            `✅ ${statsGlobales.etablissements} établissements extraits de ${geoDisplay} (${voiesLabel}) !`,
            'success'
        );

        // ── Sauvegarde favori si demandé ──────────────────────────────────
        _trySaveFavorite('geo', {
            scope: geoType,
            commune: selectedCommune,
            epci: selectedScope === 'intercommunalite' ? { code: selectedCommune.codeEpci, nom: geoDisplay } : null,
            voies
        });

    } catch (error) {
        console.error('[Recherche] Erreur extraction géo:', error);
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
        setHelpState(helpDiv, 'help');
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

    // ── VIDER LES DONNÉES PRÉCÉDENTES ─────────────────────────────────────
    if (window.databaseService) {
        await window.databaseService.clearAllData();
        console.log('[Recherche] Base vidée avant nouvelle extraction items');
    }
    
    // Gérer le bouton Stop
    const btnStop = document.getElementById('btn-stop-extraction');
    if (btnStop) {
        btnStop.classList.remove('u-hidden');
    }

    try {
        // Appeler le bon CONTROLLER - il gère toute la modale
        let result = null;
        if (type === 'diplomes') {
            // Déduire quelles voies extraire ET quels diplômes concernent chaque voie.
            // availableItems contient nbEtablissements (scolaire) et nbEtablissementsApprentissage
            // pour chaque diplôme — on filtre pour n'envoyer à chaque source que les diplômes pertinents.
            const voies = getVoiesDiplomesSelectionnes(selectedItems);

            // Partitionner les libellés sélectionnés selon la voie
            const libbellesScolaires       = selectedItems.filter(lib => {
                const item = availableItems.find(i => i.libelle === lib);
                return !item || (item.nbEtablissements || 0) > 0;
                // Inclure aussi les diplômes sans données (fallback : ONISEP tentera quand même)
            });
            const libbelllesApprentissage  = selectedItems.filter(lib => {
                const item = availableItems.find(i => i.libelle === lib);
                return !item || (item.nbEtablissementsApprentissage || 0) > 0;
            });

            console.log(`[lancerExtractionItems] 📊 Partition voies :`,
                `scolaire: ${libbellesScolaires.length}/${selectedItems.length}`,
                `apprentissage: ${libbelllesApprentissage.length}/${selectedItems.length}`
            );

            // ── VOIE SCOLAIRE (ONISEP) — uniquement les diplômes scolaires ────
            if (voies.includes('scolaire') && libbellesScolaires.length > 0) {
                result = await window.onisepExtractionController.extractByDiplomes({
                    libelles: libbellesScolaires,  // ✅ filtrés voie scolaire
                    type: itemsGeoType,
                    value: itemsGeoValue,
                    displayInfo: { nom: itemsGeoValue },
                    voies: ['scolaire']
                });
                if (result && !result.success) {
                    if (btnStop) btnStop.classList.add('u-hidden');
                    showAlert(result.message || '⚠️ Extraction scolaire interrompue', 'warning');
                    return;
                }
            }

            // ── VOIE APPRENTISSAGE (CARIF-OREF) — uniquement les diplômes apprentissage ──
            if (voies.includes('apprentissage') && window.carifOrefExtractionController && libbelllesApprentissage.length > 0) {
                // Les UAI sont déjà connus depuis l'étape 1 (stockés dans tabContexteItems)
                const uaisParLibelle = window.tabContexteItems?.uaisCarifParLibelle || {};
                const carifResult = await window.carifOrefExtractionController.extractByDiplomesLibelles(
                    libbelllesApprentissage,  // ✅ filtrés voie apprentissage
                    uaisParLibelle,
                    // Contexte géographique pour filtrage post-récupération des établissements hors périmètre
                    itemsGeoType === 'departement' ? { type: 'departement', value: itemsGeoValue } : null
                );
                if (carifResult && !carifResult.success) {
                    if (btnStop) btnStop.classList.add('u-hidden');
                    showAlert(carifResult.message || '⚠️ Extraction apprentissage interrompue', 'warning');
                    return;
                }
                // Fusionner les stats si les deux voies ont été extraites
                if (result && carifResult) {
                    result.stats = result.stats || {};
                    result.stats.etablissements = (result.stats.etablissements || 0) + (carifResult.stats?.etablissements || 0);
                } else if (carifResult) {
                    result = carifResult;
                }
            }

        } else {
            result = await window.onisepExtractionController.extractByOptions({
                libelles: selectedItems,
                type: itemsGeoType,
                value: itemsGeoValue,
                displayInfo: {nom: itemsGeoValue},
                voies: getVoiesSelectionnees('options')
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
        _prefSauverRecherche('last_extraction_date', new Date().toISOString());
        
        // Recharger les stats
        if (typeof loadStats === 'function') loadStats();
        if (typeof loadView === 'function') loadView();
        
        // Message succès
        showAlert(`✅ ${data.etablissements.length} établissements et ${data.diplomes_par_etablissement.length} diplômes (dont ${data.diplomes.length} uniques) !`, 'success');

        // ── Sauvegarde favori si demandé ──────────────────────────────────
        _trySaveFavorite('diplomes', {
            geoType: itemsGeoType,
            geoValue: itemsGeoValue,
            items: selectedItems,
            itemType: type
        });
        
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

// Verrou anti-doublon : empêche un 2ème appel pendant qu'une extraction est en cours
let _chargerItemsEnCours = false;

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

    // Verrou anti-doublon : si une extraction est déjà en cours, ignorer
    if (_chargerItemsEnCours) {
        console.warn('[chargerItemsDisponibles] ⚠️ Extraction déjà en cours, appel ignoré.');
        showAlert('⚠️ Un chargement est déjà en cours, veuillez patienter.', 'warning');
        return;
    }
    _chargerItemsEnCours = true;

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

    const btn = document.getElementById(`tab-btn-charger-${type}`);
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Chargement...'; }

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

            // ── Interroger ONISEP et CARIF-OREF en parallèle ─────────────────
            const [onisepResult, carifDiplomes] = await Promise.all([
                window.onisepExtractionController.extractDiplomesDisponiblesByZone(facetGeo),
                window.carifOrefExtractionController
                    ? window.carifOrefExtractionController.getDiplomesDisponibles(itemsGeoType, itemsGeoValue)
                    : Promise.resolve([])
            ]);

            // ── Fusion par libellé normalisé ──────────────────────────────────
            // Index CARIF : libelleNormalise → { nbEtablissements, uais }
            const carifIndex = new Map();
            for (const d of carifDiplomes) {
                carifIndex.set(d.libelleNormalise, {
                    nbEtablissementsApprentissage: d.nbEtablissements,
                    uais: d.uais
                });
            }

            // Construire la liste fusionnée à partir des diplômes ONISEP
            // (référentiel principal pour les libellés affichés)
            const itemsFusionnes = (onisepResult.items || []).map(item => {
                const libNorm = _normaliserLibelle(item.libelle);
                const carifData = carifIndex.get(libNorm) || null;
                return {
                    ...item,
                    nbEtablissementsApprentissage: carifData?.nbEtablissementsApprentissage ?? 0,
                    uaisCarif: carifData?.uais ?? []
                };
            });

            // Ajouter les diplômes CARIF-OREF non présents dans ONISEP
            const libNormOnisep = new Set(
                (onisepResult.items || []).map(i => _normaliserLibelle(i.libelle))
            );
            for (const d of carifDiplomes) {
                if (!libNormOnisep.has(d.libelleNormalise)) {
                    itemsFusionnes.push({
                        libelle:                      d.libelle,
                        type:                         d.typeDiplome,
                        niveauSortie:                 d.niveau,
                        urlOnisep:                    null,
                        nbEtablissements:             0,
                        nbEtablissementsApprentissage: d.nbEtablissements,
                        uaisCarif:                    d.uais
                    });
                }
            }

            // Trier : ordre alphabétique de libellé
            itemsFusionnes.sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr'));

            result = { items: itemsFusionnes };

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
        // Pour les diplômes : on stocke aussi uaisCarif par libellé pour l'étape 2
        window.tabContexteItems = {
            type:        itemsGeoType,
            value:       itemsGeoValue,
            displayName: itemsGeoType + ' - ' + itemsGeoDisplay,
            items:       result.items,
            facetGeo:    facetGeo,
            // Index libellé → uais CARIF-OREF (uniquement pour les diplômes)
            uaisCarifParLibelle: type === 'diplomes'
                ? Object.fromEntries(result.items.map(i => [i.libelle, i.uaisCarif || []]))
                : {}
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
        // Libérer le verrou anti-doublon dans tous les cas
        _chargerItemsEnCours = false;
        if (btn) {
            btn.disabled = false;
            btn.textContent = type === 'diplomes'
                ? '➡️ Charger les diplômes disponibles'
                : '➡️ Charger les options disponibles';
        }
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
    let html;
    if (type === 'diplomes') {
        // Pour les diplômes : afficher les deux compteurs (scolaire + apprentissage)
        html = values.map(val => {
            const nbScolaire     = val.nbEtablissements             || 0;
            const nbApprentissage = val.nbEtablissementsApprentissage || 0;
            let metaHtml = '';
            if (nbScolaire > 0 && nbApprentissage > 0) {
                metaHtml = `🏫 ${nbScolaire} en voie scolaire &nbsp;•&nbsp; 🎓 ${nbApprentissage} en apprentissage`;
            } else if (nbScolaire > 0) {
                metaHtml = `🏫 ${nbScolaire} établissement(s) en voie scolaire`;
            } else if (nbApprentissage > 0) {
                metaHtml = `🎓 ${nbApprentissage} établissement(s) en apprentissage`;
            } else {
                metaHtml = `Aucun établissement trouvé dans la zone`;
            }
            return `
            <label class="diplome-item">
                <input type="checkbox" class="${type}-checkbox"
                       value="${val.libelle.replace(/"/g, '&quot;')}"
                       onchange="updateSelectedItemsCount('${type}')">
                <div class="diplome-info">
                    <div class="diplome-intitule">${val.libelle}</div>
                    <div class="diplome-meta">${metaHtml}</div>
                </div>
            </label>`;
        }).join('');
    } else {
        // Pour les options : affichage simple (une seule source)
        html = values.map(val => `
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
    }
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
// UTILITAIRES VOIES
// =====================================

/**
 * Normalise un libellé de diplôme pour la jointure ONISEP ↔ CARIF-OREF.
 * Identique à CARIFOREFParser._normaliserLibelle().
 * @param {string} libelle
 * @returns {string}
 */
function _normaliserLibelle(libelle) {
    if (!libelle) return '';
    return libelle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Lit les checkboxes voies cochées pour un panel donné
 * @param {string} panel - 'geo' | 'diplomes' | 'options'
 * @returns {string[]} Tableau des voies sélectionnées (ex: ['scolaire', 'apprentissage'])
 */
function getVoiesSelectionnees(panel) {
    const prefix = `tab-${panel}-voie-`;
    const voies = [];
    ['scolaire', 'apprentissage'].forEach(voie => {
        const cb = document.getElementById(prefix + voie);
        if (cb && cb.checked) voies.push(voie);
    });
    return voies;  // Peut retourner [] si aucune voie cochée
}

/**
 * Déduit les voies à extraire depuis les libellés de diplômes cochés.
 * Interroge `availableItems` (liste chargée à l'étape 1) pour chaque libellé :
 *   - si l'item a nbEtablissements > 0         → voie scolaire
 *   - si l'item a nbEtablissementsApprentissage > 0 → apprentissage
 * Cela remplace le sélecteur manuel en étape 2 diplômes.
 * @param {string[]} libelles - Libellés des diplômes sélectionnés
 * @returns {string[]} Tableau des voies nécessaires (ex: ['scolaire'], ['apprentissage'], ['scolaire','apprentissage'])
 */
function getVoiesDiplomesSelectionnes(libelles) {
    if (!availableItems || availableItems.length === 0) {
        // Fallback : si pas de données, on extrait les deux voies
        return ['scolaire', 'apprentissage'];
    }
    let hasScolaire = false;
    let hasApprentissage = false;
    for (const libelle of libelles) {
        const item = availableItems.find(i => i.libelle === libelle);
        if (item) {
            if ((item.nbEtablissements || 0) > 0)              hasScolaire = true;
            if ((item.nbEtablissementsApprentissage || 0) > 0) hasApprentissage = true;
        }
        if (hasScolaire && hasApprentissage) break; // Court-circuit
    }
    const voies = [];
    if (hasScolaire)      voies.push('scolaire');
    if (hasApprentissage) voies.push('apprentissage');
    // Si rien trouvé (diplômes sans étab dans la zone), on tente scolaire par défaut
    return voies.length > 0 ? voies : ['scolaire'];
}

// =====================================
// SAUVEGARDE FAVORI APRÈS EXTRACTION
// =====================================

/**
 * Vérifie si la checkbox favori est cochée et sauvegarde le favori.
 * Appelée après une extraction réussie (géo ou items).
 * @param {'geo'|'diplomes'} type - Type de recherche
 * @param {Object} params - Paramètres de la recherche à sauvegarder
 */
function _trySaveFavorite(type, params) {
    const checkbox = document.getElementById(`save-as-favorite-${type}`);
    if (!checkbox || !checkbox.checked) return;

    const nameInput = document.getElementById(`favorite-name-${type}`);
    const nom = (nameInput?.value || '').trim();
    if (!nom) {
        showAlert('⚠️ Veuillez saisir un nom pour le favori', 'warning');
        nameInput?.focus();
        return;
    }

    // ajouterFavori est dans gestion_params.js
    if (typeof ajouterFavori === 'function') {
        const ok = ajouterFavori(nom, type, params);
        if (ok) {
            // Réinitialiser la checkbox et le champ
            checkbox.checked = false;
            if (nameInput) nameInput.value = '';
            const container = document.getElementById(`favorite-name-container-${type}`);
            if (container) { container.style.display = 'none'; container.classList.add('u-hidden'); }
        }
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

