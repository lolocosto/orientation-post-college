// Copyright (c) 2026 Laurent COSTE — Licensed under EUPL v1.2 — See LICENSE
// =====================================
// SYSTÈME DE FILTRES v0.52 — MULTI-SÉLECTION
// =====================================

/**
 * Normalise une chaîne pour la recherche textuelle : minuscules + suppression des accents.
 * Utilisée par tous les filtres textuels pour une recherche robuste (sans casse ni accents).
 * @param {string|null|undefined} s
 * @returns {string}
 */
function _normRecherche(s) {
    return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}


/**
 * État des filtres — tableau de valeurs pour multi-sélection
 */
const filtersState = {
    search: '',
    type: [],
    commune: [],
    statut: [],
    niveau: [],
    categorie: []
};

/**
 * Initialise le système de filtres
 */
function initFilters() {
    console.log('[Filtres] Initialisation du système de filtres v0.35');

    const filterSearch = document.getElementById('filter-search');
    if (filterSearch) {
        filterSearch.addEventListener('input', (e) => {
            filtersState.search = _normRecherche(e.target.value);
            applyFilters();
        });
    }

    // Les selects multi sont gérés par attachMultiSelectListener
    ['filter-type', 'filter-commune', 'filter-statut', 'filter-niveau', 'filter-categorie'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.setAttribute('multiple', 'multiple');
            el.addEventListener('change', () => {
                const key = id.replace('filter-', '');
                filtersState[key] = Array.from(el.selectedOptions).map(o => o.value);
                applyFilters();
            });
        }
    });

    console.log('[Filtres] Event listeners attachés');
}

/**
 * Met à jour les options des filtres en fonction de la vue active
 */
async function updateFiltersForView(view) {
    console.log(`[Filtres] 🔄 Mise à jour pour la vue: ${view}`);

    resetFiltersState();

    const filterType     = document.getElementById('filter-type');
    const filterCommune  = document.getElementById('filter-commune');
    const filterStatut   = document.getElementById('filter-statut');
    const filterNiveau   = document.getElementById('filter-niveau');
    const filterCategorie= document.getElementById('filter-categorie');
    const filterSearch   = document.getElementById('filter-search');

    // Masquer tous par défaut
    [filterType, filterCommune, filterStatut, filterNiveau, filterCategorie].forEach(el => {
        if (el) el.classList.add('u-hidden');
    });

    switch (view) {
        case 'etablissements':
            if (filterSearch) filterSearch.placeholder = '🔍 Rechercher un établissement...';
            if (filterType)    { filterType.classList.remove('u-hidden');    await populateTypeFilter(); }
            if (filterCommune) { filterCommune.classList.remove('u-hidden'); await populateCommuneFilter(); }
            if (filterStatut)  { filterStatut.classList.remove('u-hidden');  await populateStatutFilter(); }
            break;

        case 'diplomes_scolaire':
            if (filterSearch) filterSearch.placeholder = '🔍 Rechercher un diplôme (voie scolaire)...';
            if (filterNiveau)   { filterNiveau.classList.remove('u-hidden');   await populateNiveauDiplomeFilter(); }
            if (filterType)     { filterType.classList.remove('u-hidden');     await populateTypeDiplomeFilter(); }
            if (filterCategorie){ filterCategorie.classList.remove('u-hidden'); await populateCategorieFilter(); }
            break;

        case 'diplomes_apprentissage':
            if (filterSearch) filterSearch.placeholder = '🔍 Rechercher un diplôme (apprentissage)...';
            if (filterNiveau)   { filterNiveau.classList.remove('u-hidden');   await populateNiveauDiplomeApprentissageFilter(); }
            if (filterType)     { filterType.classList.remove('u-hidden');     await populateTypeDiplomeApprentissageFilter(); }
            break;

        case 'dispositifs':
            if (filterSearch) filterSearch.placeholder = '🔍 Rechercher un dispositif...';
            break;

        case 'options2ndeGT':
            if (filterSearch) filterSearch.placeholder = '🔍 Rechercher une option...';
            break;

        case 'specialites_1ereG':
            if (filterSearch) filterSearch.placeholder = '🔍 Rechercher une spécialité...';
            break;

        default:
            if (filterSearch) filterSearch.placeholder = '🔍 Rechercher...';
    }

    console.log('[Filtres] ✅ Filtres mis à jour pour la vue');
}

/**
 * Réinitialise l'état des filtres
 */
function resetFiltersState() {
    filtersState.search    = '';
    filtersState.type      = [];
    filtersState.commune   = [];
    filtersState.statut    = [];
    filtersState.niveau    = [];
    filtersState.categorie = [];

    const filterSearch   = document.getElementById('filter-search');
    const ids = ['filter-type','filter-commune','filter-statut','filter-niveau','filter-categorie'];

    if (filterSearch) filterSearch.value = '';
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) Array.from(el.options).forEach(o => o.selected = false);
    });
}

// =========================================================================
// POPULATE HELPERS — peuplent les <select multiple>
// =========================================================================

/**
 * Remplit un <select multiple> avec une liste de valeurs.
 * @param {HTMLSelectElement} selectEl
 * @param {string[]} values
 * @param {string} emptyLabel - Label pour la sélection vide
 * @returns {void}
 */
function _populateSelect(selectEl, values, emptyLabel) {
    selectEl.innerHTML = '';
    // Pas d'option "Tous" dans un multi-select — l'absence de sélection = pas de filtre
    values.forEach(val => {
        const option = document.createElement('option');
        option.value = val;
        option.textContent = val;
        selectEl.appendChild(option);
    });
    // Taille visible adaptée (max 4 lignes)
    selectEl.size = Math.min(values.length, 4);
}

/**
 * Remplit le filtre 'Type' avec les types d'établissements en base.
 * @returns {Promise<void>}
 */
async function populateTypeFilter() {
    const etablissements = await window.databaseService.getAllEtablissements();
    const types = [...new Set(etablissements.map(e => e.type).filter(Boolean))].sort();
    _populateSelect(document.getElementById('filter-type'), types, 'Tous les types');
}

/**
 * Remplit le filtre 'Commune' avec les communes des établissements.
 * Déduplication insensible aux accents : si "Cesson-Sévigné" (ONISEP) et
 * "Cesson-Sevigne" (CARIF-OREF) coexistent, on conserve la version accentuée.
 * @returns {Promise<void>}
 */
async function populateCommuneFilter() {
    const etablissements = await window.databaseService.getAllEtablissements();
    // Dédupliquer par clé sans accent, en gardant la version la plus longue (= accentuée)
    const communesMap = new Map(); // clé sans accent → nom affiché (avec accents)
    for (const e of etablissements) {
        if (!e.commune) continue;
        const key = typeof _communeDeduplicationKey === 'function'
            ? _communeDeduplicationKey(e.commune)
            : e.commune.toLowerCase();
        const existing = communesMap.get(key);
        // Préférer la version avec accents (elle est plus longue en NFD)
        if (!existing || e.commune.normalize('NFD').length > existing.normalize('NFD').length) {
            communesMap.set(key, e.commune);
        }
    }
    const communes = [...communesMap.values()].sort((a, b) => a.localeCompare(b, 'fr'));
    _populateSelect(document.getElementById('filter-commune'), communes, 'Toutes les communes');
}

/**
 * Remplit le filtre 'Statut' (public/privé) avec les valeurs en base.
 * @returns {Promise<void>}
 */
async function populateStatutFilter() {
    const etablissements = await window.databaseService.getAllEtablissements();
    const statuts = [...new Set(etablissements.map(e => e.statut).filter(Boolean))].sort();
    _populateSelect(document.getElementById('filter-statut'), statuts, 'Tous les statuts');
}

/**
 * Remplit le filtre 'Niveau' avec les niveaux des diplômes scolaires.
 * @returns {Promise<void>}
 */
async function populateNiveauDiplomeFilter() {
    const diplomes = await window.databaseService.getAllDiplomes();
    const niveaux = [...new Set(diplomes.map(d => d.niveauSortie).filter(Boolean))].sort();
    _populateSelect(document.getElementById('filter-niveau'), niveaux, 'Tous les niveaux');
}

/**
 * Remplit le filtre 'Type' avec les types de diplômes scolaires.
 * @returns {Promise<void>}
 */
async function populateTypeDiplomeFilter() {
    const diplomes = await window.databaseService.getAllDiplomes();
    const types = [...new Set(diplomes.map(d => d.type).filter(Boolean))].sort();
    _populateSelect(document.getElementById('filter-type'), types, 'Tous les types');
}

/**
 * Remplit le filtre 'Catégorie' avec les catégories de diplômes scolaires.
 * @returns {Promise<void>}
 */
async function populateCategorieFilter() {
    const diplomes = await window.databaseService.getAllDiplomes();
    const categories = [...new Set(diplomes.map(d => d.niveauSortie).filter(Boolean))];
    const ordre = ['CAP ou équivalent', 'bac ou équivalent'];
    categories.sort((a, b) => {
        const ia = ordre.indexOf(a), ib = ordre.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.localeCompare(b);
    });
    _populateSelect(document.getElementById('filter-categorie'), categories, 'Toutes les catégories');
}

/**
 * Remplit le filtre 'Catégorie' pour les dispositifs pédagogiques.
 * @returns {Promise<void>}
 */
async function populateCategorieDispositifFilter() {
    const dispositifs = await window.databaseService.getAllDispositifs();
    const categories = [...new Set(dispositifs.map(d => d.type).filter(Boolean))].sort();
    _populateSelect(document.getElementById('filter-categorie'), categories, 'Toutes les catégories');
}

/**
 * Remplit le filtre 'Niveau' avec les niveaux des diplômes apprentissage.
 * @returns {Promise<void>}
 */
async function populateNiveauDiplomeApprentissageFilter() {
    const diplomes = await window.databaseService.getAllDiplomesApprentissage();
    const niveaux = [...new Set(diplomes.map(d => d.niveau).filter(Boolean))].sort();
    _populateSelect(document.getElementById('filter-niveau'), niveaux, 'Tous les niveaux');
}

/**
 * Remplit le filtre 'Type' avec les types de diplômes apprentissage.
 * @returns {Promise<void>}
 */
async function populateTypeDiplomeApprentissageFilter() {
    const diplomes = await window.databaseService.getAllDiplomesApprentissage();
    const types = [...new Set(diplomes.map(d => d.typeDiplome).filter(Boolean))].sort();
    _populateSelect(document.getElementById('filter-type'), types, 'Tous les types');
}

// =========================================================================
// LOGIQUE DE FILTRAGE MULTI-VALEURS
// =========================================================================

/**
 * Teste si une valeur passe un filtre multi (tableau vide = pas de filtre)
 */
function _passesMultiFilter(filterArray, value) {
    if (!filterArray || filterArray.length === 0) return true;
    return filterArray.includes(value);
}

/**
 * Applique les filtres actifs à la vue courante.
 * @returns {void}
 */
function applyFilters() {
    console.log('[Filtres] Application des filtres:', filtersState);
    const view = currentView;
    switch (view) {
        case 'etablissements':          filterEtablissements(); break;
        case 'diplomes_scolaire':       filterDiplomes(); break;
        case 'diplomes_apprentissage':  filterDiplomesApprentissage(); break;
        case 'dispositifs':             filterDispositifs(); break;
        case 'options2ndeGT':           filterOptions(); break;
        case 'specialites_1ereG':       filterSpecialites(); break;
    }
    // Synchronise filteredData avec les lignes DOM visibles
    // → garantit que le rang N/Total dans les modales reflète la liste filtrée
    if (typeof window._syncFilteredData === 'function') window._syncFilteredData();
    updateResultsCount();
}

/**
 * Filtre les lignes de la vue Établissements (texte, type, commune, statut).
 * Le filtre commune est insensible aux accents pour traiter les doublons ONISEP/CARIF.
 * @returns {void}
 */
function filterEtablissements() {
    const rows = document.querySelectorAll('#results-body tr[data-id]');
    const cards = document.querySelectorAll('.results-cards .result-card[data-id]');
    let visibleCount = 0;

    // Pré-normaliser les valeurs de filtre commune (sans accents) pour comparaison
    const communeFilterKeys = filtersState.commune.map(c =>
        typeof _communeDeduplicationKey === 'function' ? _communeDeduplicationKey(c) : c.toLowerCase()
    );

    // Collecter les IDs visibles en filtrant les lignes tableau
    const visibleIds = new Set();
    rows.forEach(row => {
        const nom    = _normRecherche(row.querySelector('td:nth-child(1)')?.textContent) || '';
        const type   = row.dataset.type    || '';
        const commune= row.dataset.commune || '';
        const statut = row.dataset.statut  || '';

        // Commune : comparaison insensible aux accents
        const communeKey = typeof _communeDeduplicationKey === 'function'
            ? _communeDeduplicationKey(commune) : commune.toLowerCase();
        const passesCommune = communeFilterKeys.length === 0 || communeFilterKeys.includes(communeKey);

        const visible =
            (!filtersState.search || nom.includes(filtersState.search)) &&
            _passesMultiFilter(filtersState.type,    type)    &&
            passesCommune &&
            _passesMultiFilter(filtersState.statut,  statut);

        row.style.display = visible ? '' : 'none';
        if (visible) { visibleCount++; visibleIds.add(row.dataset.id); }
    });

    // Appliquer la même visibilité aux cartes mobile
    cards.forEach(card => {
        card.style.display = visibleIds.has(card.dataset.id) ? '' : 'none';
    });

    console.log(`[Filtres] ${visibleCount} établissements visibles`);
}

/**
 * Filtre les lignes de la vue Diplômes scolaires (texte, niveau, type, catégorie).
 * @returns {void}
 */
function filterDiplomes() {
    const rows = document.querySelectorAll('#results-body tr[data-libelle]');
    const cards = document.querySelectorAll('.results-cards .result-card[data-libelle]');
    let visibleCount = 0;

    const visibleLibelles = new Set();
    rows.forEach(row => {
        const libelle  = _normRecherche(row.querySelector('td:nth-child(1)')?.textContent) || '';
        const niveau   = row.dataset.niveau   || '';
        const type     = row.dataset.type     || '';
        const categorie= row.dataset.categorie|| '';

        const visible =
            (!filtersState.search || libelle.includes(filtersState.search)) &&
            _passesMultiFilter(filtersState.niveau,    niveau)   &&
            _passesMultiFilter(filtersState.type,      type)     &&
            _passesMultiFilter(filtersState.categorie, categorie);

        row.style.display = visible ? '' : 'none';
        if (visible) { visibleCount++; visibleLibelles.add(row.dataset.libelle); }
    });

    cards.forEach(card => {
        card.style.display = visibleLibelles.has(card.dataset.libelle) ? '' : 'none';
    });

    console.log(`[Filtres] ${visibleCount} diplômes visibles`);
}

/**
 * Filtre les lignes de la vue Diplômes apprentissage (texte, niveau, type).
 * @returns {void}
 */
function filterDiplomesApprentissage() {
    const rows = document.querySelectorAll('#results-body tr[data-id]');
    const cards = document.querySelectorAll('.results-cards .result-card[data-id]');
    let visibleCount = 0;

    const visibleIds = new Set();
    rows.forEach(row => {
        const libelle = _normRecherche(row.querySelector('td:nth-child(1)')?.textContent) || '';
        const niveau  = row.dataset.niveau || '';
        const type    = row.dataset.type   || '';

        const visible =
            (!filtersState.search || libelle.includes(filtersState.search)) &&
            _passesMultiFilter(filtersState.niveau, niveau) &&
            _passesMultiFilter(filtersState.type,   type);

        row.style.display = visible ? '' : 'none';
        if (visible) { visibleCount++; visibleIds.add(row.dataset.id); }
    });

    cards.forEach(card => {
        card.style.display = visibleIds.has(card.dataset.id) ? '' : 'none';
    });

    console.log(`[Filtres] ${visibleCount} diplômes apprentissage visibles`);
}

/**
 * Filtre les lignes de la vue Dispositifs par texte.
 * @returns {void}
 */
function filterDispositifs() {
    const rows = document.querySelectorAll('#results-body tr[data-libelle]');
    const cards = document.querySelectorAll('.results-cards .result-card[data-libelle]');
    let visibleCount = 0;

    const visibleLibelles = new Set();
    rows.forEach(row => {
        const libelle  = _normRecherche(row.querySelector('td:nth-child(1)')?.textContent) || '';
        const categorie= row.dataset.type || '';

        const visible =
            (!filtersState.search || libelle.includes(filtersState.search)) &&
            _passesMultiFilter(filtersState.categorie, categorie);

        row.style.display = visible ? '' : 'none';
        if (visible) { visibleCount++; visibleLibelles.add(row.dataset.libelle); }
    });

    cards.forEach(card => {
        card.style.display = visibleLibelles.has(card.dataset.libelle) ? '' : 'none';
    });

    console.log(`[Filtres] ${visibleCount} dispositifs visibles`);
}

/**
 * Filtre les lignes de la vue Options 2nde GT par texte.
 * @returns {void}
 */
function filterOptions() {
    const rows = document.querySelectorAll('#results-body tr[data-libelle]');
    const cards = document.querySelectorAll('.results-cards .result-card[data-libelle]');
    let visibleCount = 0;

    const visibleLibelles = new Set();
    rows.forEach(row => {
        const libelle = _normRecherche(row.querySelector('td:nth-child(1)')?.textContent) || '';
        const visible = !filtersState.search || libelle.includes(filtersState.search);
        row.style.display = visible ? '' : 'none';
        if (visible) { visibleCount++; visibleLibelles.add(row.dataset.libelle); }
    });

    cards.forEach(card => {
        card.style.display = visibleLibelles.has(card.dataset.libelle) ? '' : 'none';
    });

    console.log(`[Filtres] ${visibleCount} options visibles`);
}

/**
 * Filtre les lignes de la vue Spécialités 1ère G par texte.
 * @returns {void}
 */
function filterSpecialites() {
    const rows = document.querySelectorAll('#results-body tr[data-libelle]');
    const cards = document.querySelectorAll('.results-cards .result-card[data-libelle]');
    let visibleCount = 0;

    const visibleLibelles = new Set();
    rows.forEach(row => {
        const libelle = _normRecherche(row.querySelector('td:nth-child(1)')?.textContent) || '';
        const visible = !filtersState.search || libelle.includes(filtersState.search);
        row.style.display = visible ? '' : 'none';
        if (visible) { visibleCount++; visibleLibelles.add(row.dataset.libelle); }
    });

    cards.forEach(card => {
        card.style.display = visibleLibelles.has(card.dataset.libelle) ? '' : 'none';
    });

    console.log(`[Filtres] ${visibleCount} spécialités visibles`);
}

/**
 * Met à jour le compteur de résultats
 */
function updateResultsCount() {
    const visibleRows = document.querySelectorAll('#results-body tr:not([style*="display: none"])');
    const totalRows   = document.querySelectorAll('#results-body tr[data-id], #results-body tr[data-libelle]');

    const countElement = document.getElementById('results-count');
    if (countElement) {
        countElement.textContent = `${visibleRows.length} / ${totalRows.length}`;
    }
}

/**
 * Réinitialise les filtres (appelé depuis le bouton HTML)
 */
function resetFilters() {
    resetFiltersState();
    applyFilters();
}
