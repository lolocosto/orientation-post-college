// =====================================
// SYSTÈME DE FILTRES v0.35 — MULTI-SÉLECTION
// =====================================

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
            filtersState.search = e.target.value.toLowerCase();
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

        case 'diplomes':
            if (filterSearch) filterSearch.placeholder = '🔍 Rechercher un diplôme...';
            if (filterNiveau)  { filterNiveau.classList.remove('u-hidden');  await populateNiveauDiplomeFilter(); }
            if (filterType)    { filterType.classList.remove('u-hidden');    await populateTypeDiplomeFilter(); }
            if (filterCategorie){ filterCategorie.classList.remove('u-hidden'); await populateCategorieFilter(); }
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

function _populateSelect(selectEl, values, emptyLabel) {
    selectEl.innerHTML = '';
    // Pas d'option "Tous" dans un multi-select — l'absence de sélection = pas de filtre
    values.forEach(val => {
        const option = document.createElement('option');
        option.value = val;
        option.textContent = val;
        selectEl.appendChild(option);
    });
    // Taille visible adaptée (max 6 lignes)
    selectEl.size = Math.min(values.length, 6);
}

async function populateTypeFilter() {
    const etablissements = await window.databaseService.getAllEtablissements();
    const types = [...new Set(etablissements.map(e => e.type).filter(Boolean))].sort();
    _populateSelect(document.getElementById('filter-type'), types, 'Tous les types');
}

async function populateCommuneFilter() {
    const etablissements = await window.databaseService.getAllEtablissements();
    const communes = [...new Set(etablissements.map(e => e.commune).filter(Boolean))].sort();
    _populateSelect(document.getElementById('filter-commune'), communes, 'Toutes les communes');
}

async function populateStatutFilter() {
    const etablissements = await window.databaseService.getAllEtablissements();
    const statuts = [...new Set(etablissements.map(e => e.statut).filter(Boolean))].sort();
    _populateSelect(document.getElementById('filter-statut'), statuts, 'Tous les statuts');
}

async function populateNiveauDiplomeFilter() {
    const diplomes = await window.databaseService.getAllDiplomes();
    const niveaux = [...new Set(diplomes.map(d => d.niveauSortie).filter(Boolean))].sort();
    _populateSelect(document.getElementById('filter-niveau'), niveaux, 'Tous les niveaux');
}

async function populateTypeDiplomeFilter() {
    const diplomes = await window.databaseService.getAllDiplomes();
    const types = [...new Set(diplomes.map(d => d.type).filter(Boolean))].sort();
    _populateSelect(document.getElementById('filter-type'), types, 'Tous les types');
}

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

async function populateCategorieDispositifFilter() {
    const dispositifs = await window.databaseService.getAllDispositifs();
    const categories = [...new Set(dispositifs.map(d => d.type).filter(Boolean))].sort();
    _populateSelect(document.getElementById('filter-categorie'), categories, 'Toutes les catégories');
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

function applyFilters() {
    console.log('[Filtres] Application des filtres:', filtersState);
    const view = currentView;
    switch (view) {
        case 'etablissements':    filterEtablissements(); break;
        case 'diplomes':          filterDiplomes(); break;
        case 'dispositifs':       filterDispositifs(); break;
        case 'options_2nde_gt':   filterOptions(); break;
        case 'specialites_1ereG': filterSpecialites(); break;
    }
    updateResultsCount();
}

function filterEtablissements() {
    const rows = document.querySelectorAll('#results-body tr[data-uai]');
    let visibleCount = 0;

    rows.forEach(row => {
        const nom    = row.querySelector('td:nth-child(1)')?.textContent.toLowerCase() || '';
        const type   = row.dataset.type    || '';
        const commune= row.dataset.commune || '';
        const statut = row.dataset.statut  || '';

        const visible =
            (!filtersState.search || nom.includes(filtersState.search)) &&
            _passesMultiFilter(filtersState.type,    type)    &&
            _passesMultiFilter(filtersState.commune, commune) &&
            _passesMultiFilter(filtersState.statut,  statut);

        row.style.display = visible ? '' : 'none';
        if (visible) visibleCount++;
    });

    console.log(`[Filtres] ${visibleCount} établissements visibles`);
}

function filterDiplomes() {
    const rows = document.querySelectorAll('#results-body tr[data-libelle]');
    let visibleCount = 0;

    rows.forEach(row => {
        const libelle  = row.querySelector('td:nth-child(1)')?.textContent.toLowerCase() || '';
        const niveau   = row.dataset.niveau   || '';
        const type     = row.dataset.type     || '';
        const categorie= row.dataset.categorie|| '';

        const visible =
            (!filtersState.search || libelle.includes(filtersState.search)) &&
            _passesMultiFilter(filtersState.niveau,    niveau)   &&
            _passesMultiFilter(filtersState.type,      type)     &&
            _passesMultiFilter(filtersState.categorie, categorie);

        row.style.display = visible ? '' : 'none';
        if (visible) visibleCount++;
    });

    console.log(`[Filtres] ${visibleCount} diplômes visibles`);
}

function filterDispositifs() {
    const rows = document.querySelectorAll('#results-body tr[data-libelle]');
    let visibleCount = 0;

    rows.forEach(row => {
        const libelle  = row.querySelector('td:nth-child(1)')?.textContent.toLowerCase() || '';
        const categorie= row.dataset.type || '';

        const visible =
            (!filtersState.search || libelle.includes(filtersState.search)) &&
            _passesMultiFilter(filtersState.categorie, categorie);

        row.style.display = visible ? '' : 'none';
        if (visible) visibleCount++;
    });

    console.log(`[Filtres] ${visibleCount} dispositifs visibles`);
}

function filterOptions() {
    const rows = document.querySelectorAll('#results-body tr[data-libelle]');
    let visibleCount = 0;

    rows.forEach(row => {
        const libelle = row.querySelector('td:nth-child(1)')?.textContent.toLowerCase() || '';
        const visible = !filtersState.search || libelle.includes(filtersState.search);
        row.style.display = visible ? '' : 'none';
        if (visible) visibleCount++;
    });

    console.log(`[Filtres] ${visibleCount} options visibles`);
}

function filterSpecialites() {
    const rows = document.querySelectorAll('#results-body tr[data-libelle]');
    let visibleCount = 0;

    rows.forEach(row => {
        const libelle = row.querySelector('td:nth-child(1)')?.textContent.toLowerCase() || '';
        const visible = !filtersState.search || libelle.includes(filtersState.search);
        row.style.display = visible ? '' : 'none';
        if (visible) visibleCount++;
    });

    console.log(`[Filtres] ${visibleCount} spécialités visibles`);
}

/**
 * Met à jour le compteur de résultats
 */
function updateResultsCount() {
    const visibleRows = document.querySelectorAll('#results-body tr:not([style*="display: none"])');
    const totalRows   = document.querySelectorAll('#results-body tr[data-uai], #results-body tr[data-libelle]');

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
