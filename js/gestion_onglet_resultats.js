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
    
    const html = `
        <table class="resultat-table">
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
                    <th onclick="sortTable('departement')">
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
                        <td class="resultat-col-info">${etab.departement || 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = html;
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
    currentFilter = query.toLowerCase();
    
    console.log(`[filterTable] Filtrage: "${query}"`);
    
    if (!query) {
        filteredData = [...currentData];
    } else {
        filteredData = currentData.filter(item => {
            return Object.values(item).some(value => 
                value && value.toString().toLowerCase().includes(currentFilter)
            );
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
    
    const html = `
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
    
    tableContainer.innerHTML = html;
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

    tableContainer.innerHTML = `
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
}

/**
 * Affiche la modale de détail d'un diplôme apprentissage
 * @param {string} id - RNCP code ou libellé normalisé
 */
async function showDiplomeApprentissageDetails(id) {
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
    }
}

/**
 * Construit le HTML de la modale de détail d'un diplôme apprentissage.
 * Exposé via window pour DetailsModal.
 */
function buildDiplomeApprentissageDetailsHTML(diplomeEnrichi) {
    const { diplome, etablissements } = diplomeEnrichi;
    let html = '';

    // SECTION 0 : Description (contenu)
    if (diplome.contenu) {
        html += `
    <div class="detail-section" style="background:var(--bg-light,#f8f9fa); border-radius:8px; padding:14px 16px; margin-bottom:12px; border-left: 4px solid var(--primary,#3b82f6);">
        <p style="margin:0; line-height:1.65; color:var(--text,#333);">${diplome.contenu}</p>
    </div>`;
    }

    // Badge voie croisée
    if (diplomeEnrichi._aussiEnScolaire) {
        html += `
    <div style="margin-bottom:12px; padding:10px 14px; background:#f0fdf4; border-left:4px solid #22c55e; border-radius:6px; font-size:0.92em; color:#15803d; font-weight:500;">
        🔄 Ce diplôme est <strong>également accessible par voie scolaire</strong> dans les établissements de la zone.
    </div>`;
    }

    // SECTION 1 : Informations générales
    html += `
    <div class="detail-section">
        <h3 class="detail-section-title">📋 Informations générales</h3>
        <div class="detail-info-grid">`;
    if (diplome.typeDiplome) html += `
            <div class="info-row">
                <span class="info-label">Type :</span>
                <span class="info-value">${diplome.typeDiplome}</span>
            </div>`;
    if (diplome.niveau) html += `
            <div class="info-row">
                <span class="info-label">Niveau :</span>
                <span class="info-value">${diplome.niveau}</span>
            </div>`;
    if (diplome.rncpCode) html += `
            <div class="info-row">
                <span class="info-label">Code RNCP :</span>
                <span class="info-value">
                    <a href="https://www.francecompetences.fr/recherche/rncp/${diplome.rncpCode.replace('RNCP','')}"
                       target="_blank" rel="noopener">${diplome.rncpCode} ↗</a>
                </span>
            </div>`;
    html += `
        </div>
    </div>`;

    // SECTION 2 : Établissements
    const nbEtab = etablissements?.length || 0;
    html += `
    <div class="detail-section">
        <h3 class="detail-section-title">🏭 Centres de formation proposant ce diplôme (${nbEtab})</h3>`;

    if (nbEtab > 0) {
        html += '<ul class="detail-list">';
        for (const etab of etablissements) {
            const certifBadge = etab.certifieQualite
                ? ` <span class="voie-badge voie-badge--qualite" title="Certifié Qualiopi">✓ Qualiopi</span>`
                : '';
            const siretInfo = etab.siret
                ? `<span style="font-size:0.85em;color:#777;"> — SIRET ${etab.siret}</span>`
                : '';
            html += `
                <li class="detail-item" style="cursor:pointer;">
                    <a href="#" onclick="event.preventDefault(); window.openEtablissementDetailsFromModal('${etab._id}')">
                        <strong>${etab.nom || etab.uai}</strong>${certifBadge}
                        — ${etab.commune || ''}${siretInfo} ↗
                    </a>
                </li>`;
        }
        html += '</ul>';
    } else {
        html += '<p style="color:#999;">Aucun établissement enregistré pour ce diplôme.</p>';
    }

    html += '</div>';

    // SECTION 3 : Blocs de compétences
    const blocs = diplome.blocsCompetences || [];
    if (blocs.length > 0) {
        html += `
    <div class="detail-section">
        <h3 class="detail-section-title">📚 Blocs de compétences (${blocs.length})</h3>
        <div style="display:flex; flex-direction:column; gap:10px;">`;
        for (const bloc of blocs) {
            const titreBloc = bloc.rncp_intitule || bloc.intitule || bloc.libelle || '—';
            const codeBloc  = bloc.rncp_code || '';
            const listeComp = Array.isArray(bloc.competences) ? bloc.competences : [];
            html += `
            <div style="border:1px solid var(--border,#e2e8f0); border-radius:6px; overflow:hidden;">
                <div style="background:var(--bg-light,#f8f9fa); padding:8px 12px; font-weight:600; font-size:0.92em;">
                    ${codeBloc ? `<span style="color:#888;font-weight:400;margin-right:6px;">${codeBloc}</span>` : ''}${titreBloc}
                </div>`;
            if (listeComp.length > 0) {
                html += `<ul style="margin:0; padding:8px 12px 8px 26px; line-height:1.7; font-size:0.9em;">`;
                for (const comp of listeComp) {
                    html += `<li>${comp.libelle || comp}</li>`;
                }
                html += `</ul>`;
            }
            html += `</div>`;
        }
        html += `</div>
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
    
    const html = `
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
                        <td><strong>${dispositif.libelle || 'N/A'}</strong></td>
                        <td class="resultat-col-info">${dispositif.nbEtablissements || 0}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = html;
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

    const html = `
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
            <tbody>
                ${data.map(option => `
                    <tr onclick="showOption2ndeGTDetails('${option.libelle.replace(/'/g, "\\'")}')" style="cursor: pointer;">
                        <td><strong>${option.libelle}</strong></td>
                        <td class="resultat-col-info">${option.nbEtablissements || 0}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    tableContainer.innerHTML = html;
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
async function showEtablissementDetails(id) {
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
    }
}

function generateParcoursProHtml(parcours) {
    if (!parcours) {
        return `
        <div class="bloc-information-specifique" style="margin-top: 15px; padding: 15px; background: #fff3cd; border-left: 4px solid #d9534f; border-radius: 4px;">
            <h5 style="margin-top: 0; margin-bottom: 10px; color: #856404;"> 📌 Aucun parcours professionnel disponible. </h5>
        </div>`;
    }
    
    const estHorsFamille = parcours.famille.includes('HORS FAMILLE');
    const estAgricole = parcours.famille.includes('Agricole') || parcours.famille.includes('agricole');
    
    if (estHorsFamille) {
        // Bac Pro HORS famille de métiers (normal ou agricole)
        const couleur = estAgricole ? '#28a745' : '#d9534f';
        const badge = estAgricole ? '🌾 agricole' : '';
        
        return `
        <div class="bloc-information-specifique" style="margin-top: 15px; padding: 15px; background: #fff3cd; border-left: 4px solid ${couleur}; border-radius: 4px;">
            <h5 style="margin-top: 0; margin-bottom: 10px; color: #856404;">
                📌 Parcours de formation <span style="color: ${couleur};">hors famille de métiers ${badge}</span>
            </h5>
            <div style="font-size: 13px;">
                <strong>2nde :</strong> ${parcours.seconde}<br>
                <strong>1ère :</strong> ${parcours.premiere || '-'}<br>
                <strong>Term :</strong> ${parcours.terminale || '-'}
            </div>
        </div>`;
    }
    
    // Bac Pro avec famille de métiers (normal ou agricole)
    const bgColor = estAgricole ? '#d4edda' : '#fff3cd';
    const borderColor = estAgricole ? '#28a745' : '#ffc107';
    const badge = estAgricole ? '<span style="color: #28a745;">🌾 agricole</span>' : '';
    
    return `
    <div class="bloc-information-specifique" style="margin-top: 15px; padding: 15px; background: ${bgColor}; border-left: 4px solid ${borderColor}; border-radius: 4px;">
        <h5 style="margin-top: 0; margin-bottom: 10px; color: #856404;">📌 Parcours de formation ${badge}</h5>
        <div style="font-size: 13px;">
            <strong>Famille de métiers :</strong> ${parcours.famille.replace('Agricole - ', '')}<br>
            <strong>2nde commune :</strong> ${parcours.seconde}<br>
            ${parcours.premiere ? `<strong>1ère :</strong> ${parcours.premiere}<br>` : ''}
            ${parcours.terminale ? `<strong>Term :</strong> ${parcours.terminale}` : ''}
        </div>
    </div>`;
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

    // SECTION : ÉTABLISSEMENTS PROPOSANT CETTE OPTION
    html += `
    <div class="detail-section">
        <h3 class="detail-section-title">🏫 Établissements proposant cette option (${etablissements?.length || 0})</h3>`;

    if (etablissements && etablissements.length > 0) {
        html += '<ul class="detail-list">';
        for (const etab of etablissements) {
            html += `
                <li class="detail-item">
                    <a href="#" onclick="event.preventDefault(); window.openEtablissementDetailsFromModal('${etab._id}')">
                        <strong>${etab.nom}</strong> — ${etab.commune || ''}
                        <span class="badge ${etab.statut === 'public' ? 'badge--primary' : 'badge--success'}">${etab.statut || ''}</span> ↗
                    </a>
                </li>`;
        }
        html += '</ul>';
    } else {
        html += '<p class="u-text-light">Aucun établissement ne propose cette option dans la base de données</p>';
    }

    html += '</div>';
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

/**
 * Initialise l'onglet résultats
 * @returns {Promise<void>}
 */
async function initResultsTab() {
    console.log('[initResultsTab] Initialisation de l\'onglet');
    
    // Initialiser le système de filtres
    if (typeof initFilters === 'function') {
        initFilters();
    }
    
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
    let html = '';
    
    // SECTION 1 : INFORMATIONS GÉNÉRALES
    // Bouton itinéraire (visible uniquement si coordonnées GPS disponibles)
    const hasCoords = etablissement.latitude && etablissement.longitude;
    const btnItineraire = hasCoords
        ? `<div class="detail-itineraire-bar">
               <button class="btn btn--primary btn--sm detail-btn-itineraire"
                       onclick="openItineraireModal({nom: '${(etablissement.nom || '').replace(/'/g, "\\'")}', latitude: ${etablissement.latitude}, longitude: ${etablissement.longitude}})">
                   🗺️ Itinéraire
               </button>
           </div>`
        : '';

    html += `
<div class="detail-section">
    <h3 class="detail-section-title">📍 Informations générales</h3>
    ${btnItineraire}
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
    </div>
</div>
`;
    
    // SECTION 2 : DIPLÔMES VOIE SCOLAIRE
    if (diplomes && diplomes.length > 0) {
        const groupes = groupDiplomesByCategorie(diplomes);
        Object.keys(groupes).forEach(niveau => {
            groupes[niveau].sort((a, b) => a.libelle.localeCompare(b.libelle));
        });

        html += `<div class="detail-section">
            <h3 class="detail-section-title">🏫 Diplômes — voie scolaire (${diplomes.length})</h3>`;
        
        for (const [categorie, diplomesList] of Object.entries(groupes)) {
            html += `
                <div class="diplomes-categorie">
                    <h4 class="diplomes-categorie-title">${categorie} (${diplomesList.length})</h4>
                    <ul class="detail-list">`;
            for (const diplome of diplomesList) {
                const modalitesStr = diplome.modalites && diplome.modalites.length > 0 
                    ? ` <span class="diplome-modalite">${diplome.modalites.join(', ')}</span>`
                    : '';
                html += `
                    <li class="detail-item">
                        <span class="diplome-libelle">
                            <a href="#" data-libelle="${diplome.libelle}" onclick="event.preventDefault(); showDiplomeDetails(this.dataset.libelle);">${diplome.libelle} ↗</a>
                        </span>
                        ${modalitesStr}
                    </li>`;
            }
            html += `</ul></div>`;
        }
        html += `</div>`;
    }

    // SECTION 3 : DIPLÔMES VOIE APPRENTISSAGE
    if (diplomes_apprentissage && diplomes_apprentissage.length > 0) {
        const sorted = [...diplomes_apprentissage].sort((a, b) =>
            (a.libelle || '').localeCompare(b.libelle || '', 'fr')
        );

        // Grouper par niveau (3 (CAP...) / 4 (BAC...))
        const niveaux = {};
        for (const d of sorted) {
            const niv = d.niveau || 'Autre';
            if (!niveaux[niv]) niveaux[niv] = [];
            niveaux[niv].push(d);
        }

        html += `<div class="detail-section">
            <h3 class="detail-section-title">🎓 Diplômes — voie apprentissage (${diplomes_apprentissage.length})</h3>`;

        for (const [niv, liste] of Object.entries(niveaux)) {
            html += `
                <div class="diplomes-categorie">
                    <h4 class="diplomes-categorie-title">${niv} (${liste.length})</h4>
                    <ul class="detail-list">`;
            for (const d of liste) {
                const certifBadge = d.certifieQualite
                    ? ` <span class="voie-badge voie-badge--qualite" title="Certifié Qualiopi">✓ Qualiopi</span>`
                    : '';
                html += `
                    <li class="detail-item">
                        <a href="#" onclick="event.preventDefault(); window.openDiplomeApprentissageDetailsFromModal('${d.id}')">
                            <span class="diplome-libelle">${d.libelle || 'N/A'}</span>
                            ${certifBadge} ↗
                        </a>
                    </li>`;
            }
            html += `</ul></div>`;
        }
        html += `</div>`;
    }
    
    // SECTION 4 : DISPOSITIFS
    if (dispositifs && dispositifs.length > 0) {
        // Tri alphabétique des dispositifs
        dispositifs.sort((a, b) => a.libelle.localeCompare(b.libelle));
        
        html += `
<div class="detail-section">
    <h3 class="detail-section-title">🎯 Dispositifs (${dispositifs.length})</h3>
    <ul class="detail-list">`;
        for (const dispositif of dispositifs) {
            // Afficher les éléments d'enseignement sur une 2ème ligne s'ils existent
            let elementsHtml = '';
            if (dispositif.elementsDenseignement) {
                elementsHtml = `<div style="display: block; margin-top: 5px; color: #666; font-size: 0.9em;">
                    📋 Eléments d'enseignement : ${dispositif.elementsDenseignement}
                </div>`;
            }
            if (dispositif.modalitesAccueil) {
                elementsHtml = `<div style="display: block; margin-top: 5px; color: #666; font-size: 0.9em;">
                    📋 Modalités : ${dispositif.modalitesAccueil}   
                </div>`;
            }
            if (dispositif.sports) {
                elementsHtml = `<div style="display: block; margin-top: 5px; color: #666; font-size: 0.9em;">
                    📋 Sports : ${dispositif.sports}   
                </div>`;
            }
            
            html += `
                <li class="detail-item" data-libelle="${dispositif.libelle}" onclick="showDispositifDetails(this.dataset.libelle)" style="cursor: pointer;">
                    <div>
                        <strong>${dispositif.libelle}</strong>
                        ${dispositif.typeDispositif ? `<span class="dispositif-type">${dispositif.typeDispositif}</span>` : ''}
                    </div>
                    ${elementsHtml}
                </li>`;
        }
        html += `
    </ul>
</div>`;
    }
    
    // SECTION 5 : OPTIONS 2NDE GT
    if (options2ndeGT && options2ndeGT.length > 0) {
        // Tri alphabétique des options
        options2ndeGT.sort((a, b) => (a.libelle || '').localeCompare(b.libelle || ''));
        
        html += `
<div class="detail-section">
    <h3 class="detail-section-title">📚 Options 2nde Générale et Technologique (${options2ndeGT.length})</h3>
    <ul class="detail-list">`;
        for (const option of options2ndeGT) {
            const libelle = option.libelle || 'Option inconnue';
            html += `
        <li class="detail-item">${libelle}</li>`;
        }
        html += `
    </ul>
</div>`;
    }
    
    // SECTION 6 : SPÉCIALITÉS 1ÈRE G
    if (specialites1ereG && specialites1ereG.length > 0) {
        // Tri alphabétique des spécialités
        specialites1ereG.sort((a, b) => (a.libelle || '').localeCompare(b.libelle || ''));
        
        html += `
<div class="detail-section">
    <h3 class="detail-section-title">🔬 Spécialités 1ère Générale (${specialites1ereG.length})</h3>
    <ul class="detail-list">`;
        for (const specialite of specialites1ereG) {
            const libelle = specialite.libelle || 'Spécialité inconnue';
            html += `
        <li class="detail-item">${libelle}</li>`;
        }
        html += `
    </ul>
</div>`;
    }
    
    // En savoir plus ONISEP
    if (etablissement.urlOnisep) {
        const onisepUrl = etablissement.urlOnisep.split('|')[1] || etablissement.urlOnisep;
        html += `
        <div class="onisep-section" style="margin-top: 20px; padding: 20px; background: #f5f5f5; border-radius: 8px;">
            <h4>🔗 En savoir plus</h4>
            <a href="${onisepUrl}" target="_blank" style="display: inline-block; padding: 10px 20px; background: var(--primary); color: white; text-decoration: none; border-radius: 6px;">
                📖 Fiche ONISEP
            </a>
        </div>`;
    }
    
    return html;
}

function buildInfoRow(label, value) {
    if (!value) return '';
    return `
        <div class="info-row">
            <span class="info-label">${label} :</span>
            <span class="info-value">${value}</span>
        </div>`;
}

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
        html += `
    <div style="margin-bottom:12px; padding:10px 14px; background:#e8f4fd; border-left:4px solid #3b82f6; border-radius:6px; font-size:0.92em; color:#1e40af; font-weight:500;">
        🔄 Ce diplôme est <strong>également accessible par voie d'apprentissage</strong> dans les établissements de la zone.
    </div>`;
    }
    
    // SECTION 0 : Informations générales
    html += `
    <div class="detail-section">
        <h3 class="detail-section-title"> Informations générales</h3>`;
    html += `<div class="detail-item">Type : ${diplome.type || 'Non renseigné'}</div>`;
    html += `<div class="detail-item">Nature : ${diplome.natureCertificat || 'Non renseigné'}</div>`;
    html += `<div class="detail-item">Niveau : ${diplome.niveauSortie || 'Non renseigné'}</div>`;
    html += '</div>';

    // SECTION 1 : PARCOURS (si Bac Pro)
    if (diplomeEnrichi.parcours) {
        html += generateParcoursProHtml(parcours);
    }
    
    // SECTION 2 : DOMAINES PROFESSIONNELS
    if (diplome.domaines && diplome.domaines.length > 0) {
        const parDomaine = {};
        diplome.domaines.forEach(d => {
            if (!parDomaine[d.domaine]) {
                parDomaine[d.domaine] = [];
            }
            if (d.categorie && d.categorie.trim() !== '') {
                parDomaine[d.domaine].push(d.categorie);
            }
        });
        
        if (Object.keys(parDomaine).length > 0) {
            html += `
            <div class="detail-section">
                <h3 class="detail-section-title">🏷️ Domaines professionnels</h3>
                <div class="diplomes-groupes">`;
            
            Object.entries(parDomaine).forEach(([domaine, categories]) => {
                if (categories.length > 0) {
                    html += `
                        <div class="diplomes-categorie">
                            <h4 class="diplomes-categorie-title">${domaine}</h4>
                            <div class="detail-list">
                                ${categories.map(categorie => `
                                    <div class="detail-item">${categorie}</div>
                                `).join('')}
                            </div>
                        </div>`;
                }
            });
            
            html += `
                </div>
            </div>`;
        }
    }
    
    // SECTION 3 : ÉTABLISSEMENTS
    html += `
    <div class="detail-section">
        <h3 class="detail-section-title">🏫 Établissements proposant ce diplôme (${etablissements?.length || 0})</h3>`;
    
    if (etablissements && etablissements.length > 0) {
        // Tri alphabétique des établissements par nom
        etablissements.sort((a, b) => a.nom.localeCompare(b.nom));
        
        html += '<ul class="detail-list">';
        for (const etab of etablissements) {
            html += `
                <li class="detail-item" style="cursor: pointer;">
                    <a href="#" onclick="event.preventDefault(); window.openEtablissementDetailsFromModal('${etab._id}')">
                        <strong>${etab.nom}</strong> — ${etab.commune}
                        <span class="badge ${etab.statut === 'public' ? 'badge--primary' : 'badge--success'}">${etab.statut}</span> ↗
                    </a>
                </li>`;
        }
        html += '</ul>';
    } else {
        html += '<p style="color: #999;">Aucun établissement ne propose ce diplôme</p>';
    }
    
    html += '</div>';
    
    // SECTION 4 : LIEN ONISEP
    if (diplome.urlOnisep) {
        const onisepUrl = diplome.urlOnisep.split('|')[1] || diplome.urlOnisep;
        html += `
        <div class="onisep-section" style="margin-top: 20px; padding: 20px; background: #f5f5f5; border-radius: 8px;">
            <h4>🔗 En savoir plus</h4>
            <a href="${onisepUrl}" target="_blank" style="display: inline-block; padding: 10px 20px; background: var(--primary); color: white; text-decoration: none; border-radius: 6px;">
                📖 Fiche ONISEP
            </a>
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
    
    // SECTION 1 : DOMAINES
    if (dispositif.domaines && dispositif.domaines.length > 0) {
        const parDomaine = {};
        dispositif.domaines.forEach(d => {
            if (!parDomaine[d.domaine]) {
                parDomaine[d.domaine] = [];
            }
            if (d.categorie && d.categorie.trim() !== '') {
                parDomaine[d.domaine].push(d.categorie);
            }
        });
        
        if (Object.keys(parDomaine).length > 0) {
            html += `
            <div class="detail-section">
                <h3 class="detail-section-title">🏷️ Domaines</h3>
                <div class="diplomes-groupes">`;
            
            Object.entries(parDomaine).forEach(([domaine, categories]) => {
                if (categories.length > 0) {
                    html += `
                        <div class="diplomes-categorie">
                            <h4 class="diplomes-categorie-title">${domaine}</h4>
                            <div class="detail-list">
                                ${categories.map(categorie => `
                                    <div class="detail-item">${categorie}</div>
                                `).join('')}
                            </div>
                        </div>`;
                }
            });
            
            html += `
                </div>
            </div>`;
        }
    }

    // SECTION 2 : ÉTABLISSEMENTS
    html += `
    <div class="detail-section">
        <h3 class="detail-section-title">🏫 Établissements proposant ce dispositif (${etablissements?.length || 0})</h3>`;
    
    if (etablissements && etablissements.length > 0) {
        // Tri alphabétique des établissements par nom
        etablissements.sort((a, b) => a.nom.localeCompare(b.nom));
        
        html += '<ul class="detail-list">';
        for (const etab of etablissements) {
            // Afficher les éléments d'enseignement spécifiques à cet établissement
            let elementsHtml = '';
            if (etab.elementsDenseignement) {
                elementsHtml = `<div style="display: block; margin-top: 5px; color: #666; font-size: 0.9em;">
                    📋 ${etab.elementsDenseignement}
                </div>`;
            }
            
            html += `
                <li class="detail-item" style="cursor: pointer;">
                    <a href="#" onclick="event.preventDefault(); window.openEtablissementDetailsFromModal('${etab._id}')">
                        <strong>${etab.nom}</strong> — ${etab.commune}
                        <span class="badge ${etab.statut === 'public' ? 'badge--primary' : 'badge--success'}">${etab.statut}</span> ↗
                    </a>
                    ${elementsHtml}
                </li>`;
        }
        html += '</ul>';
    } else {
        html += '<p style="color: #999;">Aucun établissement ne propose ce dispositif</p>';
    }
    
    html += '</div>';
    
    // SECTION 2 : LIEN ONISEP
    if (dispositif.urlOnisep) {
        const urlParts = dispositif.urlOnisep.split('|');
        const onisepUrl = urlParts[1] || dispositif.urlOnisep;
        
        html += `
        <div class="onisep-section" style="margin-top: 20px; padding: 20px; background: #f5f5f5; border-radius: 8px;">
            <h4>🔗 En savoir plus</h4>
            <a href="${onisepUrl}" target="_blank" style="display: inline-block; padding: 10px 20px; background: var(--primary); color: white; text-decoration: none; border-radius: 6px;">
                📖 Fiche ONISEP
            </a>
        </div>`;
    }
    
    return html;
}

// =====================================
// EXPOSITION GLOBALE
// =====================================
if (typeof window !== 'undefined') {
    window.switchView = switchView;
    window.loadStats = loadStats;
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
