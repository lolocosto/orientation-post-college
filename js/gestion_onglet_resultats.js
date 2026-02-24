/************************************************
 * Fichier : gestion_onglet_resultats.js
 * Description : Gestion de l'onglet Résultats (tableaux et statistiques)
 * Auteur : Laurent COSTE
 * Date : 2026-02-03
 * Version : 2.0
 ************************************************/

// =====================================
// VARIABLES D'ÉTAT
// =====================================
let currentView = 'etablissements'; // 'etablissements' | 'diplomes' | 'dispositifs' | 'options2ndeGT'
let currentData = [];
let filteredData = [];

/**
 * Resynchronise filteredData avec les lignes actuellement visibles dans le DOM.
 * Appelée par applyFilters() (systeme_filtres.js) après chaque application de filtre,
 * afin que la navigation Précédent/Suivant dans les modales reflète la liste filtrée.
 *
 * Stratégie par vue :
 *   - établissements       : lignes tr[data-id] visibles → currentData._id
 *   - diplomes_scolaire    : lignes tr[data-libelle] visibles → currentData.libelle
 *   - diplomes_apprentissage: lignes tr[data-id] visibles → currentData.id
 *   - dispositifs          : lignes tr[data-libelle] visibles → currentData.libelle
 *   - options2ndeGT        : lignes tr[data-libelle] visibles → currentData.libelle
 *
 * @returns {void}
 */
function _syncFilteredData() {
    const body = document.getElementById('results-body');
    if (!body || !Array.isArray(currentData) || currentData.length === 0) return;

    const visibleKeys = [];

    if (currentView === 'etablissements') {
        // tr[data-id] : chaque ligne a data-id="_id"
        body.querySelectorAll('tr[data-id]').forEach(tr => {
            if (tr.style.display !== 'none') visibleKeys.push(tr.dataset.id);
        });
        filteredData = currentData.filter(e => visibleKeys.includes(e._id));

    } else if (currentView === 'diplomes_scolaire' || currentView === 'dispositifs' || currentView === 'options2ndeGT') {
        // tr[data-libelle] : chaque ligne a data-libelle=libelle
        body.querySelectorAll('tr[data-libelle]').forEach(tr => {
            if (tr.style.display !== 'none') visibleKeys.push(tr.dataset.libelle);
        });
        filteredData = currentData.filter(e => visibleKeys.includes(e.libelle));

    } else if (currentView === 'diplomes_apprentissage') {
        // tr[data-id] : chaque ligne a data-id=d.id
        body.querySelectorAll('tr[data-id]').forEach(tr => {
            if (tr.style.display !== 'none') visibleKeys.push(tr.dataset.id);
        });
        filteredData = currentData.filter(e => visibleKeys.includes(e.id));
    }
}
window._syncFilteredData = _syncFilteredData;

// État du tri par vue
let sortState = {
    etablissements:       { column: 'nom',      direction: 'asc' },
    diplomes_scolaire:    { column: 'intitule',  direction: 'asc' },
    diplomes_apprentissage: { column: 'libelle', direction: 'asc' },
    dispositifs:          { column: 'intitule',  direction: 'asc' },
    options2ndeGT:        { column: 'libelle',   direction: 'asc' }
};

// État du filtre
let currentFilter = '';

// =====================================
// NAVIGATION ENTRE VUES
// =====================================

/**
 * Bascule entre les vues de résultats
 * @param {'etablissements'|'diplomes_scolaire'|'diplomes_apprentissage'|'dispositifs'|'options2ndeGT'} viewName
 * @returns {void}
 */
function switchView(viewName) {
    console.log(`[switchView] Basculement vers vue: ${viewName}`);
    
    currentView = viewName;
    
    // Mettre à jour l'affichage des stat-cards
    document.querySelectorAll('.stat-card').forEach(card => {
        card.classList.remove('stat-card--active');
    });
    document.querySelector(`.stat-card[data-view="${viewName}"]`)?.classList.add('stat-card--active');
    
    // Charger et afficher les données
    loadView();
}

/**
 * Charge les données de la vue active
 * @returns {Promise<void>}
 */
async function loadView() {
    console.log(`[loadView] Chargement de la vue: ${currentView}`);
    
    // Mettre à jour le titre de la vue
    const viewTitle = document.getElementById('view-title');
    if (viewTitle) {
        const titles = {
            'etablissements':         '📚 Liste des Établissements',
            'diplomes_scolaire':      '🏫 Diplômes — voie scolaire',
            'diplomes_apprentissage': '🎓 Diplômes — apprentissage',
            'dispositifs':            '🎯 Liste des Dispositifs',
            'options2ndeGT':          '📚 Liste des Options 2nde GT'
        };
        const newTitle = titles[currentView] || '📚 Liste des Établissements';
        console.log(`[loadView] ✏️ Mise à jour titre: "${viewTitle.textContent}" → "${newTitle}"`);
        viewTitle.textContent = newTitle;
    } else {
        console.warn('[loadView] ⚠️ Élément #view-title non trouvé !');
    }
    
    // Mettre à jour les filtres pour la vue
    if (typeof updateFiltersForView === 'function') {
        console.log(`[loadView] 🔄 Appel updateFiltersForView("${currentView}")`);
        await updateFiltersForView(currentView);
    } else {
        console.warn('[loadView] ⚠️ Fonction updateFiltersForView non trouvée !');
    }
    
    try {
        switch (currentView) {
            case 'etablissements':
                console.log('[loadView] → loadetablissementsView()');
                await loadetablissementsView();
                break;
            case 'diplomes_scolaire':
                console.log('[loadView] → loadDiplomesView()');
                await loadDiplomesView();
                break;
            case 'diplomes_apprentissage':
                console.log('[loadView] → loadDiplomesApprentissageView()');
                await loadDiplomesApprentissageView();
                break;
            case 'dispositifs':
                console.log('[loadView] → loadDispositifsView()');
                await loadDispositifsView();
                break;
            case 'options2ndeGT':
                console.log('[loadView] → loadOptions2ndeGTView()');
                await loadOptions2ndeGTView();
                break;
            default:
                console.error('[loadView] Vue inconnue:', currentView);
        }
    } catch (error) {
        console.error('[loadView] Erreur chargement vue:', error);
        showAlert('❌ Erreur lors du chargement des données', 'error');
    }
}

// =====================================
// CHARGEMENT STATISTIQUES
// =====================================

/**
 * Charge et affiche les statistiques globales
 * @returns {Promise<void>}
 */
async function loadStats() {
    console.log('[loadStats] Chargement des statistiques...');
    
    if (!window.databaseService) {
        console.error('[loadStats] DatabaseService non initialisée');
        return;
    }
    
    try {
        const stats = await window.databaseService.getStats();
        
        console.log('[loadStats] Statistiques:', stats);
        
        // Mettre à jour les stat-cards
        document.getElementById('stat-etablissements').textContent = stats.etablissements;
        document.getElementById('stat-diplomes').textContent = stats.diplomes;
        document.getElementById('stat-dispositifs').textContent = stats.dispositifs;
        document.getElementById('stat-options2ndeGT').textContent = stats.options_2nde_gt;
        const statAppr = document.getElementById('stat-apprentissage');
        if (statAppr) statAppr.textContent = stats.diplomes_apprentissage || 0;
    } catch (error) {
        console.error('[loadStats] Erreur chargement stats:', error);
    }
}

// =====================================
// VUE ETABLISSEMENTS
// =====================================

/**
 * Charge et affiche la vue des établissements
 * @returns {Promise<void>}
 */
async function loadetablissementsView() {
    console.log('[loadetablissementsView] Chargement des établissements...');
    
    let etablissements = await window.databaseService.getAllEtablissements();
    console.log('[loadetablissementsView] 📋 Établissements récupérés de la base :', etablissements);

    currentData = etablissements;
    filteredData = [...etablissements];
    
    renderetablissementsTable(filteredData);
}

/**
 * Affiche le tableau des lycées
 * @param {Object[]} data - Données des établissements
 * @returns {void}
 */
function renderetablissementsTable(data) {
    console.log(`[renderetablissementsTable] Affichage de ${data.length} établissement(s)`);
    const tableContainer = document.getElementById('content-container');
    
    if (data.length === 0) {
        tableContainer.innerHTML = `
            <div class="empty-state">
                <p>😔 Aucun établissement trouvé</p>
                <p class="u-text-light">Effectuez une extraction pour voir les résultats</p>
            </div>
        `;
        return;
    }
    
    // ── Vue tableau (tablette/ordinateur) ──────────────────
    const tableHtml = `
        <table class="resultat-table results-table">
            <thead>
                <tr>
                    <th onclick="sortTable('nom')">
                        Établissement ${getSortIcon('nom')}
                    </th>
                    <th onclick="sortTable('type')">
                        Type ${getSortIcon('type')}
                    </th>
                    <th>Voie(s)</th>
                    <th onclick="sortTable('commune')">
                        Commune ${getSortIcon('commune')}
                    </th>
                    <th onclick="sortTable('statut')">
                        Statut ${getSortIcon('statut')}
                    </th>
                    <th onclick="sortTable('departement')" class="resultat-col--masquer-mobile">
                        Département ${getSortIcon('departement')}
                    </th>
                </tr>
            </thead>
            <tbody id="results-body">
                ${data.map(etab => `
                    <tr onclick="showEtablissementDetails('${etab._id}')" 
                        data-id="${etab._id}"
                        data-type="${etab.type || ''}"
                        data-commune="${etab.commune || ''}"
                        data-statut="${etab.statut || ''}">
                        <td>
                            <strong>${etab.nom || 'N/A'}</strong> <span class="link-icon">↗</span><br>
                            <small class="u-text-light">${etab.uai}</small>
                        </td>
                        <td class="resultat-col-filterable">${etab.type || 'N/A'}</td>
                        <td>${renderVoiesBadges(etab.voies)}</td>
                        <td class="resultat-col-filterable">${etab.commune || 'N/A'}</td>
                        <td class="resultat-col-filterable">${etab.statut || 'N/A'}</td>
                        <td class="resultat-col-info resultat-col--masquer-mobile">${etab.departement || 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // ── Vue cartes (téléphone) ─────────────────────────────
    const cardsHtml = `
        <div class="results-cards">
            ${data.map(etab => `
                <div class="result-card" onclick="showEtablissementDetails('${etab._id}')"
                     data-id="${etab._id}"
                     data-type="${etab.type || ''}"
                     data-commune="${etab.commune || ''}"
                     data-statut="${etab.statut || ''}">
                    <div class="result-card__titre">${etab.nom || 'N/A'} <span class="link-icon">↗</span></div>
                    <div class="result-card__meta">
                        ${etab.type || 'N/A'} · ${etab.commune || 'N/A'}
                        ${etab.statut ? `· ${etab.statut}` : ''}
                    </div>
                    <div class="result-card__badges">
                        ${renderVoiesBadges(etab.voies)}
                        ${etab.certifieQualiopi ? '<span class="badge badge--qualiopi">Qualiopi</span>' : ''}
                        ${etab.educationPrioritaire ? '<span class="badge badge--rep">REP</span>' : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    tableContainer.innerHTML = tableHtml + cardsHtml;
}

/**
 * Génère les badges HTML pour les voies d'un établissement
 * @param {string[]} voies - Tableau de voies (ex: ['scolaire', 'apprentissage'])
 * @returns {string} HTML des badges
 */
function renderVoiesBadges(voies) {
    if (!voies || voies.length === 0) voies = ['scolaire'];
    return voies.map(v => {
        if (v === 'scolaire')     return '<span class="voie-badge voie-badge--scolaire" title="Voie scolaire">🏫 Scolaire</span>';
        if (v === 'apprentissage') return '<span class="voie-badge voie-badge--apprentissage" title="Voie apprentissage">🎓 Appr.</span>';
        return `<span class="voie-badge">${v}</span>`;
    }).join(' ');
}

/**
 * Trie le tableau des établissements
 * @param {string} column - Nom de la colonne
 * @returns {void}
 */
function sortTable(column) {
    const state = sortState[currentView];
    
    // Inverser la direction si même colonne
    if (state.column === column) {
        state.direction = state.direction === 'asc' ? 'desc' : 'asc';
    } else {
        state.column = column;
        state.direction = 'asc';
    }
    
    console.log(`[sortTable] Tri: ${column} ${state.direction}`);
    
    // Trier les données
    filteredData.sort((a, b) => {
        const aVal = a[column] || '';
        const bVal = b[column] || '';
        
        const comparison = aVal.toString().localeCompare(bVal.toString(), 'fr', { numeric: true });
        
        return state.direction === 'asc' ? comparison : -comparison;
    });
    
    // Re-render selon la vue active
    switch(currentView) {
        case 'etablissements':
            renderetablissementsTable(filteredData);
            break;
        case 'diplomes_scolaire':
            renderDiplomesTable(filteredData);
            break;
        case 'diplomes_apprentissage':
            renderDiplomesApprentissageTable(filteredData);
            break;
        case 'dispositifs':
            renderDispositifsTable(filteredData);
            break;
        case 'options2ndeGT':
            renderOptions2ndeGTTable(filteredData);
            break;
        default:
            renderetablissementsTable(filteredData);
    }
}

/**
 * Filtre le tableau des lycées
 * @param {string} query - Texte de recherche
 * @returns {void}
 */
function filterTable(query) {
    // Normaliser la recherche (minuscules + sans accents) pour une correspondance robuste
    currentFilter = (query || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    
    console.log(`[filterTable] Filtrage: "${query}"`);
    
    if (!query) {
        filteredData = [...currentData];
    } else {
        filteredData = currentData.filter(item => {
            return Object.values(item).some(value => {
                if (!value) return false;
                const norm = value.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                return norm.includes(currentFilter);
            });
        });
    }
    
    // Dispatch selon la vue active
    switch(currentView) {
        case 'diplomes_scolaire':      renderDiplomesTable(filteredData); break;
        case 'diplomes_apprentissage': renderDiplomesApprentissageTable(filteredData); break;
        case 'dispositifs':            renderDispositifsTable(filteredData); break;
        case 'options2ndeGT':          renderOptions2ndeGTTable(filteredData); break;
        default:                       renderetablissementsTable(filteredData);
    }
    // filteredData est à jour — pas besoin de _syncFilteredData() ici
    // car filterTable() met directement filteredData avant le rendu
}

// =====================================
// VUE DIPLÔMES
// =====================================

/**
 * Charge et affiche la vue des diplômes
 * @returns {Promise<void>}
 */
async function loadDiplomesView() {
    
    // Charger TOUTES les données en une fois
    const relations = await window.databaseService.getAllDiplomesParEtablissement();
    const allDiplomes = await window.databaseService.getAllDiplomes();
    console.log('[loadDiplomesView] Chargement des diplômes...', allDiplomes);
    
    // Créer un Map pour accès rapide
    const diplomesMap = new Map(allDiplomes.map(d => [d.libelle, d]));
    
    // Créer un Map pour compter les établissements par diplôme
    const diplomesAvecComptage = {};
    
    for (const rel of relations) {
        if (!diplomesAvecComptage[rel.libelle]) {
            // Récupérer le diplôme depuis le Map
            const diplomeInfo = diplomesMap.get(rel.libelle) || {};
            
            diplomesAvecComptage[rel.libelle] = {
                libelle: rel.libelle,
                niveauSortie: diplomeInfo.niveauSortie || 'N/A',
                type: diplomeInfo.type || 'N/A',
                etablissements: new Set()
            };
        }
        diplomesAvecComptage[rel.libelle].etablissements.add(rel.uai);
    }
    
    // Convertir en tableau avec comptage
    const diplomesArray = Object.values(diplomesAvecComptage).map(d => ({
        libelle: d.libelle,
        niveauSortie: d.niveauSortie,
        type: d.type,
        nbEtablissements: d.etablissements.size
    }));
    
    currentData = diplomesArray;
    filteredData = [...diplomesArray];
    
    renderDiplomesTable(filteredData);
}

/**
 * Affiche le tableau des diplômes
 * @param {Object[]} data - Données des diplômes
 * @returns {void}
 */
function renderDiplomesTable(data) {
    console.log(`[renderDiplomesTable] Affichage de ${data.length} diplôme(s)`);
    
    const tableContainer = document.getElementById('content-container');
    
    if (data.length === 0) {
        tableContainer.innerHTML = `
            <div class="empty-state">
                <p>😔 Aucun diplôme trouvé</p>
            </div>
        `;
        return;
    }
    
    const tableHtml = `
        <table class="resultat-table">
            <thead>
                <tr>
                    <th onclick="sortTable('libelle')">
                        Diplôme ${getSortIcon('libelle')}
                    </th>
                    <th onclick="sortTable('niveauSortie')">
                        Niveau ${getSortIcon('niveauSortie')}
                    </th>
                    <th onclick="sortTable('type')">
                        Type ${getSortIcon('type')}
                    </th>
                    <th onclick="sortTable('categorie')">
                        Catégorie ${getSortIcon('categorie')}
                    </th>
                    <th onclick="sortTable('nbEtablissements')">
                        Établissements ${getSortIcon('nbEtablissements')}
                    </th>
                </tr>
            </thead>
            <tbody id="results-body">
                ${data.map(diplome => {
                    // Déterminer catégorie depuis le niveau
                    let categorie = 'Autre';
                    const niveau = diplome.niveauSortie || '';
                    if (niveau.includes('CAP')) categorie = 'CAP';
                    else if (niveau.includes('bac')) categorie = 'Bac';
                    else if (niveau.includes('BTS') || niveau.includes('BUT')) categorie = 'Bac+2';
                    else if (niveau.includes('licence')) categorie = 'Bac+3';
                    
                    return `
                        <tr data-libelle="${diplome.libelle}" 
                            data-niveau="${diplome.niveauSortie || ''}"
                            data-type="${diplome.type || ''}"
                            data-categorie="${categorie}"
                            onclick="showDiplomeDetails(this.dataset.libelle)" 
                            style="cursor: pointer;">
                            <td><strong>${diplome.libelle || 'N/A'}</strong> <span class="link-icon">↗</span></td>
                            <td class="resultat-col-filterable">${diplome.niveauSortie || 'N/A'}</td>
                            <td class="resultat-col-filterable">${diplome.type || 'N/A'}</td>
                            <td class="resultat-col-filterable">${categorie}</td>
                            <td class="resultat-col-info">${diplome.nbEtablissements || 0}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    // ── Vue cartes (téléphone) ─────────────────────────────
    const cardsHtml = `
        <div class="results-cards">
            ${data.map(diplome => {
                let categorie = 'Autre';
                const niveau = diplome.niveauSortie || '';
                if (niveau.includes('CAP')) categorie = 'CAP';
                else if (niveau.includes('bac')) categorie = 'Bac';
                else if (niveau.includes('BTS') || niveau.includes('BUT')) categorie = 'Bac+2';
                else if (niveau.includes('licence')) categorie = 'Bac+3';

                return `
                <div class="result-card" onclick="showDiplomeDetails('${(diplome.libelle||'').replace(/'/g, "\\'")}')"
                     data-libelle="${diplome.libelle}"
                     data-niveau="${diplome.niveauSortie || ''}"
                     data-type="${diplome.type || ''}"
                     data-categorie="${diplome.niveauSortie || ''}">
                    <div class="result-card__titre">${diplome.libelle || 'N/A'} <span class="link-icon">↗</span></div>
                    <div class="result-card__meta">
                        ${diplome.niveauSortie || ''} · ${diplome.type || ''}
                    </div>
                    <div class="result-card__badges">
                        <span class="badge badge--info">${categorie}</span>
                        <span class="badge badge--info">${diplome.nbEtablissements || 0} étab.</span>
                    </div>
                </div>
            `}).join('')}
        </div>
    `;
    
    tableContainer.innerHTML = tableHtml + cardsHtml;
}


// =====================================
// VUE DIPLÔMES APPRENTISSAGE
// =====================================

/**
 * Charge et affiche la vue des diplômes en apprentissage (CARIF-OREF)
 */
async function loadDiplomesApprentissageView() {
    console.log('[loadDiplomesApprentissageView] Chargement...');

    const allDiplomes  = await window.databaseService.getAllDiplomesApprentissage();
    const allRelations = await window.databaseService.getAllDiplomesApprentissageParEtablissement();
    console.log('[loadDiplomesApprentissageView] 📋 Diplômes apprentissage récupérés de la base :', allDiplomes);
    console.log('[loadDiplomesApprentissageView] 📋 Relations apprentissage récupérées de la base :', allRelations);

    const comptageUais = {};
    for (const rel of allRelations) {
        if (!comptageUais[rel.diplomId]) comptageUais[rel.diplomId] = new Set();
        if (rel.uai) comptageUais[rel.diplomId].add(rel.uai);
    }

    const diplomesArray = allDiplomes.map(d => ({
        id:               d.id,
        libelle:          d.libelle         || 'N/A',
        typeDiplome:      d.typeDiplome      || 'N/A',
        niveau:           d.niveau           || 'N/A',
        rncpCode:         d.rncpCode         || null,
        libelleNormalise: d.libelleNormalise || '',
        nbEtablissements: comptageUais[d.id]?.size || 0
    })).sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr'));

    currentData  = diplomesArray;
    filteredData = [...diplomesArray];

    renderDiplomesApprentissageTable(filteredData);
}

/**
 * Affiche le tableau des diplômes en apprentissage
 */
function renderDiplomesApprentissageTable(data) {
    console.log(`[renderDiplomesApprentissageTable] Affichage de ${data.length} diplôme(s)`);

    const tableContainer = document.getElementById('content-container');

    if (data.length === 0) {
        tableContainer.innerHTML = `
            <div class="empty-state">
                <p>😔 Aucun diplôme en apprentissage trouvé.<br>
                   Lancez une extraction depuis l'onglet Recherche en cochant "Apprentissage".</p>
            </div>`;
        return;
    }

    const tableHtml = `
        <table class="resultat-table">
            <thead>
                <tr>
                    <th onclick="sortTable('libelle')">Diplôme ${getSortIcon('libelle')}</th>
                    <th onclick="sortTable('typeDiplome')">Type ${getSortIcon('typeDiplome')}</th>
                    <th onclick="sortTable('niveau')">Niveau ${getSortIcon('niveau')}</th>
                    <th onclick="sortTable('rncpCode')">Code RNCP ${getSortIcon('rncpCode')}</th>
                    <th onclick="sortTable('nbEtablissements')">Établissements ${getSortIcon('nbEtablissements')}</th>
                </tr>
            </thead>
            <tbody id="results-body">
                ${data.map(d => `
                    <tr data-id="${d.id}"
                        data-libelle="${d.libelle}"
                        data-type="${d.typeDiplome}"
                        data-niveau="${d.niveau}"
                        onclick="showDiplomeApprentissageDetails('${d.id}')"
                        style="cursor:pointer;">
                        <td><strong>${d.libelle}</strong> <span class="link-icon">↗</span></td>
                        <td class="resultat-col-filterable">${d.typeDiplome}</td>
                        <td class="resultat-col-filterable">${d.niveau}</td>
                        <td class="resultat-col-info">${d.rncpCode || '<span style="color:#bbb">—</span>'}</td>
                        <td class="resultat-col-info">${d.nbEtablissements}</td>
                    </tr>`).join('')}
            </tbody>
        </table>`;

    // ── Vue cartes (téléphone) ─────────────────────────────
    const cardsHtml = `
        <div class="results-cards">
            ${data.map(d => `
                <div class="result-card" onclick="showDiplomeApprentissageDetails('${d.id}')"
                     data-id="${d.id}"
                     data-niveau="${d.niveau || ''}"
                     data-type="${d.typeDiplome || ''}">
                    <div class="result-card__titre">${d.libelle} <span class="link-icon">↗</span></div>
                    <div class="result-card__meta">
                        ${d.typeDiplome} · ${d.niveau}
                    </div>
                    <div class="result-card__badges">
                        ${d.rncpCode ? `<span class="badge badge--rncp">${d.rncpCode}</span>` : ''}
                        <span class="badge badge--info">${d.nbEtablissements} étab.</span>
                    </div>
                </div>
            `).join('')}
        </div>`;

    tableContainer.innerHTML = tableHtml + cardsHtml;
}

/**
 * Affiche la modale de détail d'un diplôme apprentissage
 * @param {string} id - RNCP code ou libellé normalisé
 */
async function showDiplomeApprentissageDetails(id) {
    if (_detailsModalOpening) { console.log('[showDiplomeApprentissageDetails] ⏳ Ouverture en cours, clic ignoré.'); return; }
    _detailsModalOpening = true;
    console.log('[showDiplomeApprentissageDetails]', id);
    try {
        const diplomeEnrichi = await window.databaseService.getDiplomeApprentissageEnrichi(id);
        if (!diplomeEnrichi) { showAlert('❌ Diplôme non trouvé', 'error'); return; }

        // Vérifier si ce diplôme est aussi accessible en scolaire
        diplomeEnrichi._aussiEnScolaire = await window.databaseService.estAussiEnScolaire(diplomeEnrichi.diplome.onisepIntitule);

        let list = null, index = -1;
        if (currentView === 'diplomes_apprentissage' && filteredData.length > 0) {
            list  = filteredData;
            index = filteredData.findIndex(d => d.id === id);
        }

        const uniqueId = `${id.substring(0, 20).replace(/\s/g, '')}-${Date.now()}`;
        const modal = new DetailsModal('diplome-details-modal', uniqueId);
        modal.showDiplomeApprentissage(diplomeEnrichi, list, index);

    } catch (error) {
        console.error('[showDiplomeApprentissageDetails]', error);
        showAlert('❌ Erreur lors du chargement des détails', 'error');
    } finally {
        _detailsModalOpening = false;
    }
}

/**
 * Construit le HTML de la modale de détail d'un diplôme apprentissage.
 * Exposé via window pour DetailsModal.
 */
function buildDiplomeApprentissageDetailsHTML(diplomeEnrichi) {
    const { diplome, etablissements } = diplomeEnrichi;
    let html = '';

    // Badge voie croisée
    if (diplomeEnrichi._aussiEnScolaire) {
        html += `
    <div class="detail-badge-croise detail-badge-croise--scolaire">
        🔄 Ce diplôme est <strong>également accessible par voie scolaire</strong> dans les établissements de la zone.
    </div>`;
    }

    // Section 1 : Informations générales (repliée)
    let infoBody = '<div class="detail-info-grid">';
    if (diplome.typeDiplome) infoBody += buildInfoRow('Type', diplome.typeDiplome);
    if (diplome.niveau)      infoBody += buildInfoRow('Niveau', diplome.niveau);
    if (diplome.rncpCode)    infoBody += buildInfoRow('Code RNCP', diplome.rncpCode);
    infoBody += '</div>';
    html += accordionSection('📋', 'Informations générales', '', infoBody, true);

    // Section 2 : Contenu de la formation (repliée, toujours affiché si non vide)
    if (diplome.contenu) {
        const paragraphes = diplome.contenu.split(/\n+/).map(p => p.trim()).filter(p => p.length > 0);
        if (paragraphes.length > 0) {
            let contenuBody = '<ul class="detail-list">';
            for (const para of paragraphes) {
                contenuBody += `<li class="detail-item detail-item--info"><div>${para}</div></li>`;
            }
            contenuBody += '</ul>';
            html += accordionSection('📖', 'Contenu de la formation', '', contenuBody, true);
        }
    }

    // Section 3 : Centres de formation
    const nbEtab = etablissements?.length || 0;
    let etabBody = '';
    if (nbEtab > 0) {
        etabBody += '<ul class="detail-list">';
        for (const etab of etablissements) {
            // Trouver la relation pour récupérer dureeAnnees et courriel
            const relation = diplomeEnrichi.relations?.find(r => r.uai === etab.uai) || {};
            const certifBadge = etab.certifieQualite
                ? ` <span class="voie-badge voie-badge--qualite" title="Certifié Qualiopi">✓ Qualiopi</span>` : '';
            const dureeBadge = relation.dureeAnnees
                ? ` <span class="badge badge--duree">⏱ ${relation.dureeAnnees} an${relation.dureeAnnees > 1 ? 's' : ''}</span>` : '';
            const opcoInfo = etab.opcoNom
                ? `<div class="detail-etab-meta">OPCO : ${etab.opcoNom}</div>` : '';
            const courrielInfo = relation.courriel
                ? `<div class="detail-etab-meta">✉️ <a href="mailto:${relation.courriel}">${relation.courriel}</a></div>` : '';
            etabBody += `<li class="detail-item detail-item--link" onclick="window.openEtablissementDetailsFromModal('${etab._id}')">
                <div><strong>${etab.nom || etab.uai}</strong>${certifBadge}${dureeBadge} — ${etab.commune || ''} ↗</div>
                ${opcoInfo}${courrielInfo}
            </li>`;
        }
        etabBody += '</ul>';
    } else {
        etabBody = '<p class="u-text-light">Aucun établissement enregistré pour ce diplôme.</p>';
    }
    html += accordionSection('🏭', 'Centres de formation', nbEtab, etabBody, true);

    // Section 3 : Compétences de fin de formation (section repliable, masquée si vide)
    const blocs = diplome.blocsCompetences || [];
    if (blocs.length > 0) {
        let blocsBody = '<ul class="detail-list">';
        for (const bloc of blocs) {
            const titreBloc = bloc.rncp_intitule || bloc.intitule || bloc.libelle || '—';
            const codeBloc  = bloc.rncp_code || '';
            const listeComp = Array.isArray(bloc.competences) ? bloc.competences : [];
            const codeHtml  = codeBloc ? `<span class="detail-bloc-competence__code">${codeBloc}</span> ` : '';
            const compHtml  = listeComp.length > 0
                ? `<div class="detail-item-note">${listeComp.map(c => c.libelle || c).join(' · ')}</div>`
                : '';
            blocsBody += `<li class="detail-item detail-item--info">
                <div>${codeHtml}<strong>${titreBloc}</strong></div>
                ${compHtml}
            </li>`;
        }
        blocsBody += '</ul>';
        html += accordionSection('🎯', 'Compétences de fin de formation', blocs.length, blocsBody, true);
    }

    // Lien France Compétences (en bas, comme le lien ONISEP pour les diplômes scolaires)
    if (diplome.rncpCode) {
        const rncpNum = diplome.rncpCode.replace('RNCP', '');
        html += `<div class="detail-onisep-link">
            <a href="https://www.francecompetences.fr/recherche/rncp/${rncpNum}" 
               target="_blank" rel="noopener" class="btn btn--primary">
               📖 Fiche France Compétences ↗
            </a>
        </div>`;
    }

    return html;
}

// =====================================
// VUE DISPOSITIFS
// =====================================

/**
 * Charge et affiche la vue des dispositifs
 * @returns {Promise<void>}
 */
async function loadDispositifsView() {
    console.log('[loadDispositifsView] Chargement des dispositifs...');
    
    // Charger TOUTES les données en une fois
    const relations = await window.databaseService.getAllDispositifsParEtablissement();
    const allDispositifs = await window.databaseService.getAllDispositifs();
    console.log(`[loadDispositifsView] 📋 Dispositifs récupérés de la base : `, allDispositifs);

    // Créer un Map pour accès rapide (clé = libelle)
    const dispositifsMap = new Map();
    for (const d of allDispositifs) {
        const key = d.libelle;
        dispositifsMap.set(key, d);
    }
    
    // Créer un Map pour compter les établissements par dispositif
    const dispositifsAvecComptage = {};
    
    for (const rel of relations) {
        // Ajouter le dispositif depuis le Map
        const key = rel.libelle;
        if (!dispositifsAvecComptage[key]) {
            dispositifsAvecComptage[key] = {
                libelle: key,
                etablissements: new Set()
            };
        }

        // Ajouter l'établissement à l'ensemble du dispositif
        dispositifsAvecComptage[key].etablissements.add(rel.uai);
    }
    
    // Convertir en tableau avec comptage
    const dispositifsArray = Object.values(dispositifsAvecComptage).map(d => ({
        libelle: d.libelle,
        nbEtablissements: d.etablissements.size
    }));
    
    currentData = dispositifsArray;
    filteredData = [...dispositifsArray];
    
    renderDispositifsTable(filteredData);
}

/**
 * Affiche le tableau des dispositifs
 * @param {Object[]} data - Données des dispositifs
 * @returns {void}
 */
function renderDispositifsTable(data) {
    console.log(`[renderDispositifsTable] Affichage de ${data.length} dispositif(s)`);
    
    const tableContainer = document.getElementById('content-container');
    
    if (data.length === 0) {
        tableContainer.innerHTML = `
            <div class="empty-state">
                <p>😔 Aucun dispositif trouvé</p>
            </div>
        `;
        return;
    }
    
    const tableHtml = `
        <table class="resultat-table">
            <thead>
                <tr>
                    <th onclick="sortTable('libelle')">
                        Dispositif ${getSortIcon('libelle')}
                    </th>
                    <th onclick="sortTable('nbEtablissements')">
                        Établissements ${getSortIcon('nbEtablissements')}
                    </th>
                </tr>
            </thead>
            <tbody id="results-body">
                ${data.map(dispositif => `
                    <tr data-libelle="${dispositif.libelle}"
                        onclick="showDispositifDetails(this.dataset.libelle)" 
                        style="cursor: pointer;">
                        <td><strong>${dispositif.libelle || 'N/A'}</strong> <span class="link-icon">↗</span></td>
                        <td class="resultat-col-info">${dispositif.nbEtablissements || 0}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // ── Vue cartes (téléphone) ─────────────────────────────
    const cardsHtml = `
        <div class="results-cards">
            ${data.map(dispositif => `
                <div class="result-card" onclick="showDispositifDetails('${(dispositif.libelle||'').replace(/'/g, "\\'")}')"
                     data-libelle="${dispositif.libelle}">
                    <div class="result-card__titre">${dispositif.libelle || 'N/A'} <span class="link-icon">↗</span></div>
                    <div class="result-card__badges">
                        <span class="badge badge--info">${dispositif.nbEtablissements || 0} étab.</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    tableContainer.innerHTML = tableHtml + cardsHtml;
}

// =====================================
// VUE OPTIONS 2NDE GT
// =====================================

/**
 * Charge et affiche la vue des options 2nde GT
 * Remplace la vue Langues (supprimée en v0.32)
 * @returns {Promise<void>}
 */
async function loadOptions2ndeGTView() {
    console.log('[loadOptions2ndeGTView] Chargement des options 2nde GT...');

    // Récupérer toutes les options avec comptage des établissements
    const options = await window.databaseService.getAllOptions2ndeGTAvecComptage();
    console.log('[loadOptions2ndeGTView] 📋 Options 2nde GT récupérées de la base :', options);

    currentData = options;
    filteredData = [...options];

    renderOptions2ndeGTTable(filteredData);
}

/**
 * Affiche le tableau des options 2nde GT
 * @param {Object[]} data - Données des options [{libelle, nbEtablissements}]
 * @returns {void}
 */
function renderOptions2ndeGTTable(data) {
    console.log(`[renderOptions2ndeGTTable] Affichage de ${data.length} option(s)`);

    const tableContainer = document.getElementById('content-container');

    if (data.length === 0) {
        tableContainer.innerHTML = `
            <div class="empty-state">
                <p>😔 Aucune option trouvée</p>
                <p class="u-text-light">Effectuez une extraction pour voir les options disponibles</p>
            </div>
        `;
        return;
    }

    const tableHtml = `
        <table class="resultat-table">
            <thead>
                <tr>
                    <th onclick="sortTable('libelle')">
                        Option ${getSortIcon('libelle')}
                    </th>
                    <th onclick="sortTable('nbEtablissements')">
                        Établissements ${getSortIcon('nbEtablissements')}
                    </th>
                </tr>
            </thead>
            <tbody id="results-body">
                ${data.map(option => `
                    <tr data-libelle="${(option.libelle || '').replace(/"/g, '&quot;')}"
                        onclick="showOption2ndeGTDetails(this.dataset.libelle)" style="cursor: pointer;">
                        <td><strong>${option.libelle}</strong> <span class="link-icon">↗</span></td>
                        <td class="resultat-col-info">${option.nbEtablissements || 0}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // ── Vue cartes (téléphone) ─────────────────────────────
    const cardsHtml = `
        <div class="results-cards">
            ${data.map(option => `
                <div class="result-card" 
                     onclick="showOption2ndeGTDetails('${(option.libelle||'').replace(/'/g, "\\'")}')"
                     data-libelle="${(option.libelle||'').replace(/"/g, '&quot;')}">
                    <div class="result-card__titre">${option.libelle} <span class="link-icon">↗</span></div>
                    <div class="result-card__badges">
                        <span class="badge badge--info">${option.nbEtablissements || 0} étab.</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    tableContainer.innerHTML = tableHtml + cardsHtml;
}

// =====================================
// FILTRES
// =====================================

/**
 * Réinitialise tous les filtres
 * @returns {void}
 */
function resetFilters() {
    console.log('[resetFilters] Réinitialisation des filtres');
    
    // Déléguer à systeme_filtres.js qui gère l'état complet des filtres
    if (typeof resetFiltersState === 'function') {
        resetFiltersState();
    }
    
    if (Array.isArray(currentData)) {
        filteredData = [...currentData];
    }
    loadView();
}

// =====================================
// MODALES DÉTAILS ETABLISSEMENT 
// =====================================

/**
 * Affiche les détails d'un établissement
 * @param {string} uai - Code UAI de l'établissement
 * @returns {Promise<void>}
 */
// =====================================
// GUARD ANTI-OUVERTURE MULTIPLE
// =====================================
// Empêche les clics rapides d'ouvrir plusieurs modales simultanément.
// Flag remis à false dès que la modale est ouverte ou en cas d'erreur.
let _detailsModalOpening = false;

async function showEtablissementDetails(id) {
    if (_detailsModalOpening) { console.log('[showEtablissementDetails] ⏳ Ouverture en cours, clic ignoré.'); return; }
    _detailsModalOpening = true;
    console.log(`[showEtablissementDetails] Affichage détails établissement: ${id}`);
    
    try {
        // Récupérer toutes les données
        const etablissementEnrichi = await window.databaseService.getEtablissementEnrichi(id);
        if (!etablissementEnrichi) {
            showAlert('❌ Établissement non trouvé', 'error');
            return;
        }
        console.log(`[showEtablissementDetails] Établissement enrichi:`, etablissementEnrichi);
        
        // Trouver l'index dans la liste filtrée courante (si on est en vue établissements)
        let list = null;
        let index = -1;
        if (currentView === 'etablissements' && filteredData.length > 0) {
            list = filteredData;
            index = filteredData.findIndex(e => e._id === id);
        }
        
        // Créer modale avec ID unique pour permettre plusieurs établissements ouverts
        const uniqueId = `${id}-${Date.now()}`;
        const modal = new DetailsModal('etablissement-details-modal', uniqueId);
        modal.showEtablissement(etablissementEnrichi, list, index);
        
    } catch (error) {
        console.error('[showEtablissementDetails] Erreur chargement détails:', error);
        showAlert('❌ Erreur lors du chargement des détails', 'error');
    } finally {
        _detailsModalOpening = false;
    }
}

// =====================================
// MODALES DÉTAILS DIPLÔME 
// =====================================

/**
 * Affiche les détails d'un diplôme
 * @param {string} libelle - Diplôme du diplôme
 * @returns {Promise<void>}
 */
async function showDiplomeDetails(libelle) {
    if (_detailsModalOpening) { console.log('[showDiplomeDetails] ⏳ Ouverture en cours, clic ignoré.'); return; }
    _detailsModalOpening = true;
    try {
        // Récupérer le diplôme complet (avec domaines et URL)
        const diplomeEnrichi = await window.databaseService.getDiplomeEnrichi(libelle);
        if (!diplomeEnrichi) {
            showAlert('❌ Diplôme non trouvé', 'error');
            return;
        }
        console.log(`[showDiplomeDetails] Diplôme enrichi:`, diplomeEnrichi);

        // Vérifier si ce diplôme est aussi accessible par apprentissage
        diplomeEnrichi._aussiEnApprentissage = await window.databaseService.estAussiEnApprentissage(libelle);

        // Trouver l'index dans la liste filtrée courante (si on est en vue diplômes scolaire)
        let list = null;
        let index = -1;
        if (currentView === 'diplomes_scolaire' && filteredData.length > 0) {
            list = filteredData;
            index = filteredData.findIndex(d => d.libelle === libelle);
        }

        // Créer modale avec ID unique pour permettre plusieurs diplômes ouverts
        const uniqueId = `${diplomeEnrichi.diplome.libelle.substring(0,20).replace(/\s/g,'')}-${Date.now()}`;
        const modal = new DetailsModal('diplome-details-modal', uniqueId);
        modal.showDiplome(diplomeEnrichi, list, index);
        
    } catch (error) {
        console.error('[showDiplomeDetails] Erreur chargement détails diplôme:', error);
        showAlert('❌ Erreur lors du chargement des détails', 'error');
    } finally {
        _detailsModalOpening = false;
    }
}

/**
 * Génère le HTML du parcours de formation pour un diplôme scolaire.
 * Gère tous les types : bac pro (avec famille de métiers), bac général,
 * bac techno, CAP, BMA, etc.
 * @param {Object} diplome - Données du diplôme
 * @param {Object|null} parcoursBacPro - Parcours de famille de métiers (bac pro uniquement)
 * @param {string|null} duree - Durée du cycle standard (af_duree_cycle_standard)
 * @returns {string|null} HTML ou null si rien à afficher
 */
function generateParcoursFormationHtml(diplome, parcoursBacPro, duree) {
    const type = (diplome.type || '').toLowerCase();
    const libelle = diplome.libelle || '';

    // ── Cas 1 : Bac Pro avec famille de métiers ─────────────────────────
    if (parcoursBacPro) {
        return _generateParcoursProHtml(parcoursBacPro, duree);
    }

    // ── Cas 2 : Bac général ─────────────────────────────────────────────
    if (type.includes('baccalauréat général') || libelle.toLowerCase().startsWith('bac général')) {
        let items = '<ul class="detail-list">';
        items += `<li class="detail-item detail-item--info">
            <div><strong>2nde :</strong> Seconde générale et technologique</div></li>`;
        items += `<li class="detail-item detail-item--info">
            <div><strong>1ère :</strong> Première générale — choix de 3 spécialités</div></li>`;
        items += `<li class="detail-item detail-item--info">
            <div><strong>Terminale :</strong> Terminale générale — 2 spécialités conservées</div></li>`;
        if (duree) items += `<li class="detail-item detail-item--info"><div><strong>Durée :</strong> ${duree}</div></li>`;
        items += '</ul>';
        return items;
    }

    // ── Cas 3 : Bac technologique ───────────────────────────────────────
    if (type.includes('baccalauréat technologique') || libelle.toLowerCase().startsWith('bac techno')) {
        const serie = libelle.replace(/^bac techno /i, '').split(' enseignement')[0];
        let items = '<ul class="detail-list">';
        items += `<li class="detail-item detail-item--info">
            <div><strong>2nde :</strong> Seconde générale et technologique</div></li>`;
        items += `<li class="detail-item detail-item--info">
            <div><strong>1ère :</strong> Première ${serie}</div></li>`;
        items += `<li class="detail-item detail-item--info">
            <div><strong>Terminale :</strong> Terminale ${serie}</div></li>`;
        if (duree) items += `<li class="detail-item detail-item--info"><div><strong>Durée :</strong> ${duree}</div></li>`;
        items += '</ul>';
        return items;
    }

    // ── Cas 4 : CAP / CAPa ─────────────────────────────────────────────
    if (type.includes('cap') || libelle.toLowerCase().startsWith('cap ') || libelle.toLowerCase().startsWith('capa ')) {
        let items = '<ul class="detail-list">';
        items += `<li class="detail-item detail-item--info">
            <div><strong>Formation :</strong> Cycle de 2 ans après la 3ème</div></li>`;
        items += `<li class="detail-item detail-item--info">
            <div><strong>1ère année :</strong> Enseignements généraux et professionnels</div></li>`;
        items += `<li class="detail-item detail-item--info">
            <div><strong>2ème année :</strong> Spécialisation et périodes de formation en milieu professionnel</div></li>`;
        if (duree) items += `<li class="detail-item detail-item--info"><div><strong>Durée :</strong> ${duree}</div></li>`;
        items += '</ul>';
        return items;
    }

    // ── Cas 5 : Bac Pro sans famille de métiers connue ──────────────────
    if (type.includes('bac pro') || libelle.toLowerCase().startsWith('bac pro')) {
        let items = '<ul class="detail-list">';
        items += `<li class="detail-item detail-item--info">
            <div><strong>Hors famille de métiers</strong> (parcours spécifique)</div></li>`;
        items += `<li class="detail-item detail-item--info">
            <div><strong>2nde :</strong> Seconde professionnelle spécifique</div></li>`;
        items += `<li class="detail-item detail-item--info">
            <div><strong>1ère :</strong> Première ${libelle.replace(/^bac pro /i, '')}</div></li>`;
        items += `<li class="detail-item detail-item--info">
            <div><strong>Terminale :</strong> Terminale ${libelle.replace(/^bac pro /i, '')}</div></li>`;
        if (duree) items += `<li class="detail-item detail-item--info"><div><strong>Durée :</strong> ${duree}</div></li>`;
        items += '</ul>';
        return items;
    }

    // ── Cas 6 : BMA, BTS, DE, autres diplômes ──────────────────────────
    // Si une durée est connue, on affiche au minimum la durée
    if (duree) {
        let items = '<ul class="detail-list">';
        items += `<li class="detail-item detail-item--info"><div><strong>Durée du cycle :</strong> ${duree}</div></li>`;
        items += '</ul>';
        return items;
    }

    // Aucune information de parcours disponible
    return null;
}

/**
 * Génère le HTML spécifique aux parcours Bac Pro avec famille de métiers.
 * @param {Object} parcours - { famille, seconde, premiere, terminale }
 * @param {string|null} duree - Durée du cycle
 * @returns {string}
 * @private
 */
function _generateParcoursProHtml(parcours, duree) {
    const estHorsFamille = parcours.famille.includes('HORS FAMILLE');
    const estAgricole = parcours.famille.includes('Agricole') || parcours.famille.includes('agricole');
    const badge = estAgricole ? ' 🌾' : '';
    
    let items = '<ul class="detail-list">';

    // Item 1 : Famille de métiers ou Hors famille
    if (estHorsFamille) {
        items += `<li class="detail-item detail-item--info">
            <div><strong>Hors famille de métiers${badge}</strong></div>
        </li>`;
    } else {
        const famLabel = parcours.famille.replace('Agricole - ', '');
        items += `<li class="detail-item detail-item--info">
            <div><strong>Famille de métiers :</strong> ${famLabel}${badge}</div>
        </li>`;
    }

    // Item 2 : 2nde
    if (parcours.seconde) {
        items += `<li class="detail-item detail-item--info">
            <div><strong>2nde :</strong> ${parcours.seconde}</div>
        </li>`;
    }

    // Item 3 : 1ère
    if (parcours.premiere) {
        items += `<li class="detail-item detail-item--info">
            <div><strong>1ère :</strong> ${parcours.premiere}</div>
        </li>`;
    }

    // Item 4 : Terminale
    if (parcours.terminale) {
        items += `<li class="detail-item detail-item--info">
            <div><strong>Terminale :</strong> ${parcours.terminale}</div>
        </li>`;
    }

    // Item 5 : Durée (si disponible)
    if (duree) {
        items += `<li class="detail-item detail-item--info">
            <div><strong>Durée :</strong> ${duree}</div>
        </li>`;
    }

    items += '</ul>';
    return items;
}

/**
 * Ferme la modale de détails
 * @returns {void}
 */
// Fonction close supprimée (gérée par Modal.close())

// =====================================
// DÉTAILS DISPOSITIF
// =====================================

/**
 * Affiche les détails d'un dispositif
 * @param {string} libelle - Libellé du dispositif
 */
async function showDispositifDetails(libelle) {
    if (_detailsModalOpening) { console.log('[showDispositifDetails] ⏳ Ouverture en cours, clic ignoré.'); return; }
    _detailsModalOpening = true;
    console.log('[showDispositifDetails] Affichage détails dispositif:', libelle);
    try {
        const dispositifEnrichi = await window.databaseService.getDispositifEnrichi(libelle);
        if (!dispositifEnrichi) {
            showAlert('❌ Dispositif non trouvé', 'error');
            return;
        }
        console.log(`[showDiplomeDetails] Dispositif enrichi:`, dispositifEnrichi);
        
        // Trouver l'index dans la liste filtrée courante (si on est en vue dispositifs)
        let list = null;
        let index = -1;
        if (currentView === 'dispositifs' && filteredData.length > 0) {
            list = filteredData;
            index = filteredData.findIndex(d => d.libelle === libelle);
        }
        
        // Créer modale avec ID unique pour permettre plusieurs dispositifs ouverts
        const uniqueId = `${dispositifEnrichi.dispositif.libelle.substring(0,20).replace(/\s/g,'')}-${Date.now()}`;
        const modal = new DetailsModal('dispositif-details-modal', uniqueId);
        modal.showDispositif(dispositifEnrichi, list, index);
        
    } catch (error) {
        console.error('[showDispositifDetails] Erreur chargement détails dispositif:', error);
        showAlert('❌ Erreur lors du chargement des détails', 'error');
    } finally {
        _detailsModalOpening = false;
    }
}
// Fonction close supprimée (gérée par Modal.close())

// =====================================
// MODALES DÉTAILS OPTION 2NDE GT
// =====================================

/**
 * Affiche les détails d'une option 2nde GT dans une modale
 * Suit le même pattern que showDispositifDetails() et showDiplomeDetails()
 * @param {string} libelle - Libellé de l'option
 * @returns {Promise<void>}
 */
async function showOption2ndeGTDetails(libelle) {
    if (_detailsModalOpening) { console.log('[showOption2ndeGTDetails] ⏳ Ouverture en cours, clic ignoré.'); return; }
    _detailsModalOpening = true;
    console.log(`[showOption2ndeGTDetails] Affichage détails option: ${libelle}`);

    try {
        const optionEnrichie = await window.databaseService.getOption2ndeGTEnrichie(libelle);
        if (!optionEnrichie) {
            showAlert('❌ Option non trouvée', 'error');
            return;
        }
        console.log(`[showOption2ndeGTDetails] Option enrichie:`, optionEnrichie);

        // Trouver l'index dans la liste filtrée courante pour la navigation précédent/suivant
        let list = null;
        let index = -1;
        if (currentView === 'options2ndeGT' && filteredData.length > 0) {
            list = filteredData;
            index = filteredData.findIndex(o => o.libelle === libelle);
        }

        const uniqueId = `${libelle.substring(0, 20).replace(/\s/g, '')}-${Date.now()}`;
        const modal = new DetailsModal('option-details-modal', uniqueId);
        modal.showOption2ndeGT(optionEnrichie, list, index);

    } catch (error) {
        console.error('[showOption2ndeGTDetails] Erreur chargement détails option:', error);
        showAlert('❌ Erreur lors du chargement des détails', 'error');
    } finally {
        _detailsModalOpening = false;
    }
}

/**
 * Construit le HTML du contenu de la modale de détail d'une option 2nde GT
 * Appelée par DetailsModal.#buildOption2ndeGTHTML()
 * Suit le même pattern que buildDispositifDetailsHTML() et buildDiplomeDetailsHTML()
 * @param {Object} optionEnrichie - {option: Object, etablissements: Array}
 * @returns {string} HTML
 */
function buildOption2ndeGTDetailsHTML(optionEnrichie) {
    const { option, etablissements } = optionEnrichie;
    let html = '';

    // Section : établissements (ouverte)
    const nb = etablissements?.length || 0;
    let etabBody = '';
    if (nb > 0) {
        etabBody += '<ul class="detail-list">';
        for (const etab of etablissements) {
            etabBody += `<li class="detail-item detail-item--link" onclick="window.openEtablissementDetailsFromModal('${etab._id}')">
                    <div><strong>${etab.nom}</strong> — ${etab.commune || ''}
                        <span class="badge ${etab.statut === 'public' ? 'badge--primary' : 'badge--success'}">${etab.statut || ''}</span> ↗</div>
                </li>`;
        }
        etabBody += '</ul>';
    } else {
        etabBody = '<p class="u-text-light">Aucun établissement ne propose cette option dans la base de données</p>';
    }
    html += accordionSection('🏫', 'Établissements proposant cette option', nb, etabBody, true);

    return html;
}

// =====================================
// UTILITAIRES
// =====================================

/**
 * Retourne l'icône de tri pour une colonne
 * @param {string} column - Nom de la colonne
 * @returns {string} HTML de l'icône
 */
function getSortIcon(column) {
    const state = sortState[currentView];
    
    if (state.column !== column) {
        return '↕️';
    }
    
    return state.direction === 'asc' ? '↑' : '↓';
}

// =====================================
// INITIALISATION
// =====================================

// Flag d'initialisation unique de l'onglet résultats
let _resultsTabInitialized = false;
// Timestamp du dernier rendu complet — évite le doublon quand db:ready
// et le switch d'onglet arrivent à moins de 2 secondes d'intervalle.
let _lastFullRenderAt = 0;

/**
 * Initialise l'onglet résultats.
 * - Au premier appel : attache les filtres + charge stats et vue.
 * - Aux appels suivants : rafraîchit stats + vue, sauf si un rendu
 *   vient d'avoir lieu (guard anti-doublon db:ready / tab-switch).
 * @returns {Promise<void>}
 */
async function initResultsTab() {
    console.log('[initResultsTab] Initialisation de l\'onglet');

    if (!_resultsTabInitialized) {
        if (typeof initFilters === 'function') initFilters();
        _resultsTabInitialized = true;
    }

    // Guard : rendu < 2s → skip (db:ready vient d'afficher les données)
    const now = Date.now();
    if (now - _lastFullRenderAt < 2000) {
        console.log('[initResultsTab] ⏭️ Rendu récent (<2s), skip doublon.');
        return;
    }
    _lastFullRenderAt = now;
    await loadStats();
    await loadView();
}

// =====================================
// HELPERS MODALE DÉTAILS ÉTABLISSEMENT
// =====================================

/**
 * Construit le HTML de la fiche établissement
 * @param {Object} etablissementEnrichi - Objet établissement complet
 * @returns {string} HTML
 */
function buildEtablissementDetailsHTML(etablissementEnrichi) {
    const { etablissement, diplomes, diplomes_apprentissage, dispositifs, options2ndeGT, specialites1ereG } = etablissementEnrichi;
    const id       = etablissement._id || etablissement.uai;
    const nomEchap = (etablissement.nom || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    let html = '';

    // accordionSection() est maintenant global (voir ci-dessus)

    // ── BARRE D'ACTIONS (itinéraire + favori) ──────────────────────────
    const hasCoords = etablissement.latitude && etablissement.longitude;
    const isFav     = typeof isEtablissementFavori === 'function' && isEtablissementFavori(id);

    const btnItineraire = hasCoords
        ? `<button class="btn btn--primary btn--sm detail-btn-itineraire"
               onclick="openItineraireModal({nom:'${nomEchap}',latitude:${etablissement.latitude},longitude:${etablissement.longitude}})">
               🗺️ Itinéraire
           </button>`
        : '';

    // Le titre et le bouton étoile sont construits par DetailsModal.#renderModal(),
    // qui reçoit favoriId/Nom/Commune/Type via showEtablissement().

    if (btnItineraire) {
        html += `<div class="detail-action-bar">${btnItineraire}</div>`;
    }

    // ── SECTION 1 : INFORMATIONS GÉNÉRALES (ouverte) ──────────────────
    const infoBody = `
    <div class="detail-info-grid">
        ${buildInfoRow('UAI', etablissement.uai)}
        ${etablissement.siret ? buildInfoRow('SIRET', etablissement.siret) : ''}
        ${buildInfoRow('Type', etablissement.type)}
        ${buildInfoRow('Statut', etablissement.statut)}
        ${etablissement.tutelle ? buildInfoRow('Tutelle', etablissement.tutelle) : ''}
        ${etablissement.adresse ? buildInfoRow('Adresse', `${etablissement.adresse}, ${etablissement.codePostal}${etablissement.cedex ? ' CEDEX ' + etablissement.cedex : ''} ${etablissement.commune}`) : ''}
        ${etablissement.telephone ? buildInfoRow('Téléphone', formatTelephone(etablissement.telephone)) : ''}
        ${etablissement.email ? buildInfoRow('Email', `<a href="mailto:${etablissement.email}">${etablissement.email}</a>`) : ''}
        ${etablissement.siteWeb ? buildInfoRow('Site web', `<a href="${etablissement.siteWeb}" target="_blank">${etablissement.siteWeb}</a>`) : ''}
        ${etablissement.hebergement ? buildInfoRow('Hébergement', etablissement.hebergement) : ''}
        ${etablissement.restauration ? buildInfoRow('Restauration', etablissement.restauration) : ''}
    </div>`;
    html += accordionSection('📍', 'Informations générales', '', infoBody, true);

    // ── SECTION 2 : DIPLÔMES VOIE SCOLAIRE ────────────────────────────
    if (diplomes && diplomes.length > 0) {
        const groupes = groupDiplomesByCategorie(diplomes);
        Object.keys(groupes).forEach(n => groupes[n].sort((a, b) => a.libelle.localeCompare(b.libelle)));
        let body = '';
        for (const [categorie, liste] of Object.entries(groupes)) {
            body += `<div class="diplomes-categorie">
                <h4 class="diplomes-categorie-title">${categorie} (${liste.length})</h4>
                <ul class="detail-list">`;
            for (const d of liste) {
                const mod = d.modalites?.length ? ` <span class="diplome-modalite">${d.modalites.join(', ')}</span>` : '';
                const dureeBadge = d.dureeCycleStandard
                    ? ` <span class="badge badge--duree" title="Durée du cycle">⏱ ${d.dureeCycleStandard}</span>` : '';
                const libEscaped = (d.libelle || '').replace(/'/g, "\\'");
                body += `<li class="detail-item detail-item--link" onclick="showDiplomeDetails('${libEscaped}')">
                    <div><strong>${d.libelle}</strong>${mod}${dureeBadge} ↗</div>
                </li>`;
            }
            body += `</ul></div>`;
        }
        html += accordionSection('🏫', 'Diplômes — voie scolaire', diplomes.length, body, true);
    }

    // ── SECTION 3 : DIPLÔMES VOIE APPRENTISSAGE ────────────────────────
    if (diplomes_apprentissage && diplomes_apprentissage.length > 0) {
        const sorted = [...diplomes_apprentissage].sort((a, b) => (a.libelle||''). localeCompare(b.libelle||'', 'fr'));
        const niveaux = {};
        for (const d of sorted) {
            const niv = d.niveau || 'Autre';
            if (!niveaux[niv]) niveaux[niv] = [];
            niveaux[niv].push(d);
        }
        let body = '';
        for (const [niv, liste] of Object.entries(niveaux)) {
            body += `<div class="diplomes-categorie">
                <h4 class="diplomes-categorie-title">${niv} (${liste.length})</h4>
                <ul class="detail-list">`;
            for (const d of liste) {
                const qBadge = d.certifieQualite
                    ? ` <span class="voie-badge voie-badge--qualite" title="Certifié Qualiopi">✓ Qualiopi</span>`
                    : '';
                const dureeBadge = d._dureeAnnees
                    ? ` <span class="badge badge--duree" title="Durée">⏱ ${d._dureeAnnees} an${d._dureeAnnees > 1 ? 's' : ''}</span>` : '';
                body += `<li class="detail-item detail-item--link" onclick="window.openDiplomeApprentissageDetailsFromModal('${d.id}')">
                    <div><strong>${d.libelle||'N/A'}</strong>${qBadge}${dureeBadge} ↗</div>
                </li>`;
            }
            body += `</ul></div>`;
        }
        html += accordionSection('🎓', 'Diplômes — voie apprentissage', diplomes_apprentissage.length, body, true);
    }

    // ── SECTION 4 : DISPOSITIFS (replié) ─────────────────────────────
    if (dispositifs && dispositifs.length > 0) {
        dispositifs.sort((a, b) => a.libelle.localeCompare(b.libelle));
        let body = '<ul class="detail-list">';
        for (const d of dispositifs) {
            let extra = '';
            if (d.elementsDenseignement) extra = `<div class="detail-item-note">📋 Éléments : ${d.elementsDenseignement}</div>`;
            else if (d.modalitesAccueil)  extra = `<div class="detail-item-note">📋 Modalités : ${d.modalitesAccueil}</div>`;
            else if (d.sports)            extra = `<div class="detail-item-note">📋 Sports : ${d.sports}</div>`;
            const libEscaped = (d.libelle || '').replace(/'/g, "\\'");
            body += `<li class="detail-item detail-item--link" onclick="showDispositifDetails('${libEscaped}')">
                <div><strong>${d.libelle}</strong>${d.typeDispositif ? ` <span class="dispositif-type">${d.typeDispositif}</span>` : ''} ↗</div>
                ${extra}</li>`;
        }
        body += '</ul>';
        html += accordionSection('🎯', 'Dispositifs', dispositifs.length, body, true);
    }

    // ── SECTION 5 : OPTIONS 2NDE GT (replié) ──────────────────────────
    if (options2ndeGT && options2ndeGT.length > 0) {
        options2ndeGT.sort((a, b) => (a.libelle||''). localeCompare(b.libelle||''));
        let body = '<ul class="detail-list">';
        for (const o of options2ndeGT) {
            const lib = (o.libelle || 'Option inconnue').replace(/'/g, "\\'");
            body += `<li class="detail-item detail-item--link" onclick="showOption2ndeGTDetails('${lib}')">
                <div><strong>${o.libelle || 'Option inconnue'}</strong> ↗</div>
            </li>`;
        }
        body += '</ul>';
        html += accordionSection('📚', 'Options 2nde GT', options2ndeGT.length, body, true);
    }

    // ── SECTION 6 : SPÉCIALITÉS 1ÈRE G (replié) ──────────────────────
    if (specialites1ereG && specialites1ereG.length > 0) {
        specialites1ereG.sort((a, b) => (a.libelle||''). localeCompare(b.libelle||''));
        let body = '<ul class="detail-list">';
        for (const s of specialites1ereG) body += `<li class="detail-item detail-item--info">${s.libelle||'Spécialité inconnue'}</li>`;
        body += '</ul>';
        html += accordionSection('🔬', 'Spécialités 1ère Générale', specialites1ereG.length, body, true);
    }

    // ── SECTION : JOURNÉES PORTES OUVERTES ──────────────────────────────
    if (etablissement.journeesPortesOuvertes) {
        const jpos = etablissement.journeesPortesOuvertes
            .split(' | ')
            .map(j => j.trim())
            .filter(Boolean);
        if (jpos.length > 0) {
            const jpoBody = `<ul class="detail-list">
                ${jpos.map(j => `<li class="detail-item">📅 ${j}</li>`).join('')}
            </ul>`;
            html += accordionSection('📅', 'Journées portes ouvertes', jpos.length, jpoBody, true);
        }
    }

    // ── SECTION : LANGUES ENSEIGNÉES ────────────────────────────────────
    if (etablissement.languesEnseignees) {
        const langues = etablissement.languesEnseignees
            .split(', ')
            .map(l => l.trim())
            .filter(Boolean);
        if (langues.length > 0) {
            const languesBody = `<div class="detail-badges">
                ${langues.map(l => `<span class="badge badge--langue">🌍 ${l}</span>`).join('')}
            </div>`;
            html += accordionSection('🌍', 'Langues enseignées', langues.length, languesBody, true);
        }
    }

    // ── SECTION : RÉSEAU / ÉTABLISSEMENTS LIÉS ──────────────────────────
    if (etablissement.etablissementsLies) {
        const lies = etablissement.etablissementsLies
            .split(' | ')
            .map(l => l.trim())
            .filter(Boolean);
        if (lies.length > 0) {
            const liesBody = `<ul class="detail-list">
                ${lies.map(l => `<li class="detail-item">🏛️ ${l}</li>`).join('')}
            </ul>`;
            html += accordionSection('🏛️', 'Réseau / établissements liés', lies.length, liesBody, true);
        }
    }

    // ── SECTION : ACCESSIBILITÉ & INFORMATIONS COMPLÉMENTAIRES ──────────
    if (etablissement.accessibilite || etablissement.opcoNom || etablissement.formeJuridique || etablissement.nda) {
        const compBody = `<div class="detail-info-grid">
            ${etablissement.accessibilite ? buildInfoRow('♿ Accessibilité', etablissement.accessibilite) : ''}
            ${etablissement.opcoNom ? buildInfoRow('OPCO', etablissement.opcoNom) : ''}
            ${etablissement.formeJuridique ? buildInfoRow('Forme juridique', etablissement.formeJuridique) : ''}
            ${etablissement.nda ? buildInfoRow('NDA', etablissement.nda) : ''}
        </div>`;
        html += accordionSection('ℹ️', 'Informations complémentaires', '', compBody, true);
    }

    // ── En savoir plus ONISEP ─────────────────────────────────────────
    if (etablissement.urlOnisep) {
        const onisepUrl = etablissement.urlOnisep.split('|')[1] || etablissement.urlOnisep;
        html += `<div class="detail-onisep-link">
            <a href="${onisepUrl}" target="_blank" class="btn btn--primary">📖 Fiche ONISEP ↗</a>
        </div>`;
    }

    return html;
}

/**
 * Génère une ligne HTML 'label : valeur' pour les fiches détail.
 * @param {string} label
 * @param {string} value
 * @returns {string} HTML ou chaîne vide si valeur absente
 */
function buildInfoRow(label, value) {
    if (!value) return '';
    return `
        <div class="info-row">
            <span class="info-label">${label} :</span>
            <span class="info-value">${value}</span>
        </div>`;
}

/**
 * Groupe les diplômes par catégorie (niveauSortie), dans l'ordre canonique.
 * @param {Object[]} diplomes
 * @returns {Object} { categorie: diplome[] }
 */
function groupDiplomesByCategorie(diplomes) {
    console.log('[groupDiplomesByCategorie] Groupement diplômes, premier diplôme:', diplomes[0]);
    const groupes = {};
    for (const diplome of diplomes) {
        const cat = diplome.niveauSortie || 'Autre';
        if (!groupes[cat]) groupes[cat] = [];
        groupes[cat].push(diplome);
    }
    
    console.log('[groupDiplomesByCategorie] Groupes créés:', Object.keys(groupes));
    
    const ordre = ['CAP', 'Bac professionnel', 'Bac technologique', 'Bac général', 'BTS', 'Autre'];
    const result = {};
    for (const cat of ordre) {
        if (groupes[cat]) result[cat] = groupes[cat];
    }
    for (const [cat, liste] of Object.entries(groupes)) {
        if (!result[cat]) result[cat] = liste;
    }
    return result;
}

/**
 * Formate un numéro de téléphone français en XX XX XX XX XX.
 * @param {string} tel
 * @returns {string}
 */
function formatTelephone(tel) {
    if (!tel) return '';
    const cleaned = tel.replace(/[\s\.\-]/g, '');
    if (cleaned.length === 10) {
        return cleaned.match(/.{1,2}/g).join(' ');
    }
    return tel;
}

/**
 * Construit le HTML pour les détails d'un diplôme
 * @param {Object} diplomeEnrichi - Objet diplôme complet
 * @returns {string} HTML
 */
function buildDiplomeDetailsHTML(diplomeEnrichi) {
    const { diplome, etablissements, parcours } = diplomeEnrichi;
    let html = '';

    // Badge voie croisée
    if (diplomeEnrichi._aussiEnApprentissage) {
        html += `<div class="detail-badge-croise detail-badge-croise--apprentissage">
        🔄 Ce diplôme est <strong>également accessible par voie d'apprentissage</strong> dans les établissements de la zone.
    </div>`;
    }

    // ── Section 1 : Informations générales ──────────────────────────────
    let infoBody = '<div class="detail-info-grid">';
    infoBody += buildInfoRow('Type', diplome.type || 'Non renseigné');
    infoBody += buildInfoRow('Nature', diplome.natureCertificat || 'Non renseigné');
    infoBody += buildInfoRow('Niveau', diplome.niveauSortie || 'Non renseigné');
    // Durée du cycle (collectée depuis les relations, première valeur disponible)
    const dureeRelation = etablissements?.find(e => e.dureeCycleStandard)?.dureeCycleStandard;
    if (dureeRelation) {
        infoBody += buildInfoRow('Durée du cycle', dureeRelation);
    }
    infoBody += '</div>';
    html += accordionSection('📋', 'Informations générales', '', infoBody, true);

    // ── Section 2 : Parcours de formation ───────────────────────────────
    // Affiché pour TOUS les diplômes scolaires (bac pro avec famille de métiers,
    // bac techno, bac général, CAP, BMA, etc.)
    const parcoursHtml = generateParcoursFormationHtml(diplome, parcours, dureeRelation);
    if (parcoursHtml) {
        html += accordionSection('🗺️', 'Parcours de formation', '', parcoursHtml, true);
    }

    // ── Section 3 : Domaines professionnels ─────────────────────────────
    if (diplome.domaines && diplome.domaines.length > 0) {
        const parDomaine = {};
        diplome.domaines.forEach(d => {
            if (!parDomaine[d.domaine]) parDomaine[d.domaine] = [];
            if (d.categorie && d.categorie.trim()) parDomaine[d.domaine].push(d.categorie);
        });
        if (Object.keys(parDomaine).length > 0) {
            let domainesBody = '<div class="diplomes-groupes">';
            Object.entries(parDomaine).forEach(([domaine, categories]) => {
                if (categories.length > 0) {
                    domainesBody += `<div class="diplomes-categorie">
                        <h4 class="diplomes-categorie-title">${domaine}</h4>
                        <div class="detail-list">${categories.map(c => `<div class="detail-item">${c}</div>`).join('')}</div>
                    </div>`;
                }
            });
            domainesBody += '</div>';
            html += accordionSection('🏷️', 'Domaines professionnels', '', domainesBody, true);
        }
    }

    // ── Section 4 : Établissements ──────────────────────────────────────
    const nbEtab = etablissements?.length || 0;
    let etabBody = '';
    if (nbEtab > 0) {
        etablissements.sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'));
        etabBody += '<ul class="detail-list">';
        for (const etab of etablissements) {
            const dureeBadge = etab.dureeCycleStandard
                ? ` <span class="badge badge--duree" title="Durée du cycle">⏱ ${etab.dureeCycleStandard}</span>` : '';
            etabBody += `<li class="detail-item detail-item--link" onclick="window.openEtablissementDetailsFromModal('${etab._id}')">
                    <div><strong>${etab.nom}</strong> — ${etab.commune}${dureeBadge}
                        <span class="badge ${etab.statut === 'public' ? 'badge--primary' : 'badge--success'}">${etab.statut}</span> ↗</div>
                </li>`;
        }
        etabBody += '</ul>';
    } else {
        etabBody = '<p class="u-text-light">Aucun établissement ne propose ce diplôme</p>';
    }
    html += accordionSection('🏫', 'Établissements proposant ce diplôme', nbEtab, etabBody, true);

    // Lien ONISEP (pas en accordéon, toujours visible)
    if (diplome.urlOnisep) {
        const onisepUrl = diplome.urlOnisep.split('|')[1] || diplome.urlOnisep;
        html += `<div class="detail-onisep-link">
            <a href="${onisepUrl}" target="_blank" class="btn btn--primary">📖 Fiche ONISEP ↗</a>
        </div>`;
    }

    return html;
}

/**
 * Construit le HTML pour les détails d'un dispositif
 * @param {Object} dispositifEnrichi - Objet dispositif complet
 * @returns {string} HTML
 */
function buildDispositifDetailsHTML(dispositifEnrichi) {
    const { dispositif, etablissements } = dispositifEnrichi;
    let html = '';

    // Section 1 : Domaines (repliée)
    if (dispositif.domaines && dispositif.domaines.length > 0) {
        const parDomaine = {};
        dispositif.domaines.forEach(d => {
            if (!parDomaine[d.domaine]) parDomaine[d.domaine] = [];
            if (d.categorie && d.categorie.trim()) parDomaine[d.domaine].push(d.categorie);
        });
        if (Object.keys(parDomaine).length > 0) {
            let domainesBody = '<div class="diplomes-groupes">';
            Object.entries(parDomaine).forEach(([domaine, categories]) => {
                if (categories.length > 0) {
                    domainesBody += `<div class="diplomes-categorie">
                        <h4 class="diplomes-categorie-title">${domaine}</h4>
                        <div class="detail-list">${categories.map(c => `<div class="detail-item">${c}</div>`).join('')}</div>
                    </div>`;
                }
            });
            domainesBody += '</div>';
            html += accordionSection('🏷️', 'Domaines', '', domainesBody, true);
        }
    }

    // Section 2 : Établissements (ouverte)
    const nbEtab = etablissements?.length || 0;
    let etabBody = '';
    if (nbEtab > 0) {
        etablissements.sort((a, b) => a.nom.localeCompare(b.nom));
        etabBody += '<ul class="detail-list">';
        for (const etab of etablissements) {
            const elementsHtml = etab.elementsDenseignement
                ? `<div class="detail-item-note">📋 ${etab.elementsDenseignement}</div>` : '';
            etabBody += `<li class="detail-item detail-item--link" onclick="window.openEtablissementDetailsFromModal('${etab._id}')">
                    <div><strong>${etab.nom}</strong> — ${etab.commune}
                        <span class="badge ${etab.statut === 'public' ? 'badge--primary' : 'badge--success'}">${etab.statut}</span> ↗</div>
                    ${elementsHtml}</li>`;
        }
        etabBody += '</ul>';
    } else {
        etabBody = '<p class="u-text-light">Aucun établissement ne propose ce dispositif</p>';
    }
    html += accordionSection('🏫', 'Établissements proposant ce dispositif', nbEtab, etabBody, true);

    // Lien ONISEP
    if (dispositif.urlOnisep) {
        const onisepUrl = dispositif.urlOnisep.split('|')[1] || dispositif.urlOnisep;
        html += `<div class="detail-onisep-link">
            <a href="${onisepUrl}" target="_blank" class="btn btn--primary">📖 Fiche ONISEP ↗</a>
        </div>`;
    }

    return html;
}


// =====================================
// HELPER PARTAGÉ : SECTION ACCORDÉON
// =====================================

/**
 * Génère le HTML d'une section repliable (accordéon) pour les fiches détail.
 * Partagé par tous les builders : établissements, diplômes, dispositifs, options.
 * @param {string} icon   - Emoji icône
 * @param {string} titre  - Titre de la section
 * @param {string|number} count - Nombre affiché entre parenthèses ('' pour masquer)
 * @param {string} bodyHtml - Contenu HTML de la section
 * @param {boolean} collapsed - true = replié par défaut
 * @returns {string} HTML de la section accordéon
 */
function accordionSection(icon, titre, count, bodyHtml, collapsed = false) {
    const cls      = collapsed ? ' detail-section--collapsed' : '';
    const countStr = count !== '' ? ` (${count})` : '';
    return `
<div class="detail-section${cls}">
    <h3 class="detail-section-title detail-section-title--accordion"
        onclick="toggleDetailSection(this.parentElement)">
        ${icon} ${titre}${countStr}
    </h3>
    <div class="detail-section__body">${bodyHtml}</div>
</div>`;
}

// =====================================
// ACCORDÉON — SECTIONS REPLIABLES
// =====================================

/**
 * Bascule l'état replié/déplié d'une section accordéon dans les fiches détail.
 * Appelé par onclick sur .detail-section-title--accordion.
 * @param {HTMLElement} sectionEl - L'élément .detail-section parent
 * @returns {void}
 */
function toggleDetailSection(sectionEl) {
    if (!sectionEl) return;
    sectionEl.classList.toggle('detail-section--collapsed');
}

// =====================================
// FAVORIS — ÉTABLISSEMENTS
// =====================================

const _FAVORIS_ETAB_KEY  = 'favoris_etablissements';
const _MAX_FAVORIS_ETAB  = 20;
const _FAVORIS_DIVERS_KEY = 'favoris_divers';
const _MAX_FAVORIS_DIVERS = 50;

// =====================================
// FAVORIS DIVERS (diplômes, dispositifs, options 2nde GT)
// =====================================

/**
 * Charge la liste des favoris divers depuis localStorage.
 * @returns {Object[]} [{id, titre, typeObjet, date}]
 */
function loadFavorisDivers() {
    try { return JSON.parse(localStorage.getItem(_FAVORIS_DIVERS_KEY) || '[]'); }
    catch { return []; }
}

/**
 * Vérifie si un item est dans les favoris divers.
 * @param {string} id - Identifiant unique (ex: "diplome__CAP Boucher")
 * @returns {boolean}
 */
function isFavoriDivers(id) {
    return loadFavorisDivers().some(f => f.id === id);
}

/**
 * Wrapper appelé par le bouton étoile (data-* attributes).
 * @param {HTMLElement} btn
 */
function toggleFavoriDiversFromBtn(btn) {
    toggleFavoriDivers(
        btn.dataset.favoriId      || '',
        btn.dataset.favoriNom     || '',
        btn.dataset.favoriTypeObjet || ''
    );
}

/**
 * Ajoute ou retire un favori divers.
 * @param {string} id
 * @param {string} titre
 * @param {string} typeObjet - 'diplome' | 'diplome_apprentissage' | 'dispositif' | 'option2ndeGT'
 */
function toggleFavoriDivers(id, titre, typeObjet) {
    const favoris = loadFavorisDivers();
    const idx = favoris.findIndex(f => f.id === id);

    if (idx >= 0) {
        favoris.splice(idx, 1);
        localStorage.setItem(_FAVORIS_DIVERS_KEY, JSON.stringify(favoris));
        _updateBtnFavoriDivers(id, false);
        showAlert(`✅ "${titre}" retiré des favoris`, 'success');
    } else {
        if (favoris.length >= _MAX_FAVORIS_DIVERS) {
            showAlert(`❌ Limite de ${_MAX_FAVORIS_DIVERS} favoris atteinte`, 'error');
            return;
        }
        favoris.push({ id, titre, typeObjet, date: new Date().toISOString() });
        localStorage.setItem(_FAVORIS_DIVERS_KEY, JSON.stringify(favoris));
        _updateBtnFavoriDivers(id, true);
        showAlert(`⭐ "${titre}" ajouté aux favoris`, 'success');
    }
    // Rafraîchir le panneau favoris si ouvert (toutes les catégories)
    if (typeof window.afficherListeFavoris === 'function') window.afficherListeFavoris();
    if (typeof window._updateMenuStatuses === 'function') window._updateMenuStatuses();
}

/**
 * Met à jour le bouton étoile d'un favori divers après toggle.
 * @private
 */
function _updateBtnFavoriDivers(id, isFav) {
    const btn = document.getElementById(`btn-favori-${id}`);
    if (!btn) return;
    btn.classList.toggle('detail-header-action--star-active', isFav);
    btn.textContent = isFav ? '⭐' : '☆';
    btn.title = isFav ? 'Retirer des favoris' : 'Ajouter aux favoris';
    btn.setAttribute('aria-label', btn.title);
}

/**
 * Charge la liste des établissements favoris depuis localStorage.
 * @returns {Object[]} tableau de { id, nom, commune, type, date }
 */
function loadFavorisEtablissements() {
    try { return JSON.parse(localStorage.getItem(_FAVORIS_ETAB_KEY) || '[]'); }
    catch { return []; }
}

/**
 * Vérifie si un établissement est dans les favoris.
 * @param {string} id - _id interne de l'établissement
 * @returns {boolean}
 */
function isEtablissementFavori(id) {
    return loadFavorisEtablissements().some(f => f.id === id);
}

/**
 * Ajoute ou retire un établissement des favoris.
 * Met à jour le bouton dans la fiche ouverte en temps réel.
 * @param {string} id      - _id interne
 * @param {string} nom     - Nom de l'établissement
 * @param {string} commune - Commune
 * @param {string} type    - Type d'établissement
 * @returns {void}
 */
/**
 * Wrapper appelé par le bouton étoile (data-* attributes).
 * Lit id/nom/commune/type depuis les attributs data-favori-* du bouton cliqué.
 * Évite les erreurs de syntaxe avec apostrophes dans les noms d'établissements.
 * @param {HTMLElement} btn - Le bouton ⭐/☆ cliqué
 */
function toggleEtablissementFavoriFromBtn(btn) {
    toggleEtablissementFavori(
        btn.dataset.favoriId      || '',
        btn.dataset.favoriNom     || '',
        btn.dataset.favoriCommune || '',
        btn.dataset.favoriType    || ''
    );
}

function toggleEtablissementFavori(id, nom, commune, type) {
    const favoris = loadFavorisEtablissements();
    const idx     = favoris.findIndex(f => f.id === id);

    if (idx >= 0) {
        // Retirer
        favoris.splice(idx, 1);
        localStorage.setItem(_FAVORIS_ETAB_KEY, JSON.stringify(favoris));
        _updateBtnFavoriEtab(id, false);
        showAlert(`✅ "${nom}" retiré des favoris`, 'success');
    } else {
        // Ajouter
        if (favoris.length >= _MAX_FAVORIS_ETAB) {
            showAlert(`❌ Limite de ${_MAX_FAVORIS_ETAB} favoris atteinte`, 'error');
            return;
        }
        favoris.push({ id, nom, commune, type, date: new Date().toISOString() });
        localStorage.setItem(_FAVORIS_ETAB_KEY, JSON.stringify(favoris));
        _updateBtnFavoriEtab(id, true);
        showAlert(`⭐ "${nom}" ajouté aux favoris`, 'success');
    }
    // Rafraîchir la liste dans les paramètres si le panneau est ouvert.
    // window.afficherListeFavoris (gestion_params.js) recharge les deux sous-sections
    // (établissements + recherches) — correction du bug v0.48 : seule la sous-section
    // établissements était rafraîchie, pas le panneau complet.
    if (typeof window.afficherListeFavoris === 'function') {
        window.afficherListeFavoris();
    }
    if (typeof window._updateMenuStatuses === 'function') {
        window._updateMenuStatuses();
    }
}

/**
 * Met à jour l'apparence du bouton favori dans la fiche détail ouverte.
 * @private
 */
function _updateBtnFavoriEtab(id, isFav) {
    const btn = document.getElementById(`btn-favori-${id}`);
    if (!btn) return;
    btn.classList.toggle('btn--favori--active', isFav);
    btn.textContent = isFav ? '⭐' : '☆';
    btn.title       = isFav ? 'Retirer des favoris' : 'Ajouter aux favoris';
    btn.setAttribute('aria-label', isFav ? 'Retirer des favoris' : 'Ajouter aux favoris');
}

/**
 * Affiche la liste des établissements favoris dans la section paramètres.
 * Appelé par gestion_params.js quand on ouvre le panneau Favoris.
 * @returns {void}
 */
function afficherListeFavorisEtablissements() {
    const favoris   = loadFavorisEtablissements();
    const container = document.getElementById('favoris-etablissements-list');
    if (!container) return;

    if (favoris.length === 0) {
        container.innerHTML = `<p class="u-text-muted u-text-sm" style="padding:12px 0">
            Aucun établissement favori. Ouvrez la fiche d'un établissement et cliquez sur ☆ Ajouter aux favoris.
        </p>`;
        return;
    }

    let html = '';
    favoris.forEach(f => {
        const date = new Date(f.date).toLocaleDateString('fr-FR');
        html += `
        <div class="favori-card--etab">
            <div class="favori-card--etab__nom">🏫 ${f.nom}</div>
            <div class="favori-card--etab__meta">${f.type || ''} · ${f.commune || ''} · ajouté le ${date}</div>
            <div class="favori-card--etab__actions">
                <button class="setting-button" style="flex:1;padding:8px;font-size:13px"
                    data-etab-id="${f.id}"
                    onclick="toggleSettings();setTimeout(()=>showEtablissementDetails(this.dataset.etabId),200)">
                    👁️ Voir la fiche
                </button>
                <button class="setting-button secondary" style="flex:1;padding:8px;font-size:13px"
                    data-favori-id="${f.id}"
                    data-favori-nom="${(f.nom||'').replace(/"/g,'&quot;')}"
                    data-favori-commune="${(f.commune||'').replace(/"/g,'&quot;')}"
                    data-favori-type="${(f.type||'').replace(/"/g,'&quot;')}"
                    onclick="toggleEtablissementFavoriFromBtn(this)">
                    🗑️
                </button>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

// =====================================
// EXPOSITION GLOBALE
// =====================================
if (typeof window !== 'undefined') {
    window.switchView = switchView;
    window.loadStats = loadStats;
    window.loadCurrentView = loadView; // pour rafraîchissement après db:ready
    window.resetFilters = resetFilters;
    window.showEtablissementDetails = showEtablissementDetails;
    window.initResultsTab = initResultsTab;
    // Vues détails
    window.showOption2ndeGTDetails = showOption2ndeGTDetails;
    window.showDiplomeApprentissageDetails = showDiplomeApprentissageDetails;
    // Fonctions de construction HTML utilisées par DetailsModal
    window.buildEtablissementDetailsHTML = buildEtablissementDetailsHTML;
    window.buildDiplomeDetailsHTML = buildDiplomeDetailsHTML;
    window.buildDiplomeApprentissageDetailsHTML = buildDiplomeApprentissageDetailsHTML;
    window.buildDispositifDetailsHTML = buildDispositifDetailsHTML;
    window.buildOption2ndeGTDetailsHTML = buildOption2ndeGTDetailsHTML;
    // Accordéon (sections repliables dans les fiches détail)
    window.toggleDetailSection = toggleDetailSection;
    // Favoris établissements
    window.toggleEtablissementFavoriFromBtn  = toggleEtablissementFavoriFromBtn;
    window.toggleFavoriDiversFromBtn         = toggleFavoriDiversFromBtn;
    window.toggleFavoriDivers               = toggleFavoriDivers;
    window.isFavoriDivers                   = isFavoriDivers;
    window.loadFavorisDivers                = loadFavorisDivers;
    window.toggleEtablissementFavori        = toggleEtablissementFavori;
    window.isEtablissementFavori            = isEtablissementFavori;
    window.afficherListeFavorisEtablissements = afficherListeFavorisEtablissements;
    window.loadFavorisEtablissements        = loadFavorisEtablissements;
}

// =====================================
// EXPORT DES DONNÉES
// =====================================

/**
 * Exporte les données filtrées au format demandé
 * @param {string} format - 'csv' ou 'pdf'
 */
function exportData(format) {
    console.log(`[exportData] Export demandé: ${format}, vue: ${currentView}, ${filteredData.length} items`);
    
    if (!filteredData || filteredData.length === 0) {
        showAlert('❌ Aucune donnée à exporter. Veuillez d\'abord extraire des données depuis l\'onglet Recherche.', 'warning');
        return;
    }
    
    if (format === 'csv') {
        ExportService.exportToCSV(currentView, filteredData);
    } else if (format === 'pdf') {
        ExportService.exportToPDF(currentView, filteredData);
    } else {
        showAlert('❌ Format d\'export non supporté', 'error');
    }
}

// Exposition globale
if (typeof window !== 'undefined') {
    window.exportData = exportData;
}
