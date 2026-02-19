// =====================================
// SYSTÈME DE FILTRES v0.19
// =====================================

/**
 * État des filtres
 * Stocke les valeurs actuelles de tous les filtres
 */
const filtersState = {
    search: '',
    type: 'tous',
    commune: 'toutes',
    statut: 'tous',
    niveau: 'tous',
    categorie: 'toutes'
};

/**
 * Initialise le système de filtres
 * À appeler une seule fois au chargement de l'onglet
 */
function initFilters() {
    console.log('[Filtres] Initialisation du système de filtres');
    
    // Attacher les event listeners
    const filterSearch = document.getElementById('filter-search');
    const filterType = document.getElementById('filter-type');
    const filterCommune = document.getElementById('filter-commune');
    const filterStatut = document.getElementById('filter-statut');
    const filterNiveau = document.getElementById('filter-niveau');
    const filterCategorie = document.getElementById('filter-categorie');
    
    if (filterSearch) {
        filterSearch.addEventListener('input', (e) => {
            filtersState.search = e.target.value.toLowerCase();
            applyFilters();
        });
    }
    
    if (filterType) {
        filterType.addEventListener('change', (e) => {
            filtersState.type = e.target.value;
            applyFilters();
        });
    }
    
    if (filterCommune) {
        filterCommune.addEventListener('change', (e) => {
            filtersState.commune = e.target.value;
            applyFilters();
        });
    }
    
    if (filterStatut) {
        filterStatut.addEventListener('change', (e) => {
            filtersState.statut = e.target.value;
            applyFilters();
        });
    }
    
    if (filterNiveau) {
        filterNiveau.addEventListener('change', (e) => {
            filtersState.niveau = e.target.value;
            applyFilters();
        });
    }
    
    if (filterCategorie) {
        filterCategorie.addEventListener('change', (e) => {
            filtersState.categorie = e.target.value;
            applyFilters();
        });
    }
    
    console.log('[Filtres] Event listeners attachés');
}

/**
 * Met à jour les options des filtres en fonction de la vue active
 * @param {string} view - Vue active (etablissements, diplomes, etc.)
 */
async function updateFiltersForView(view) {
    console.log(`[Filtres] 🔄 Mise à jour pour la vue: ${view}`);
    
    // Réinitialiser l'état des filtres
    resetFiltersState();
    
    // Afficher/masquer les filtres selon la vue
    const filterType = document.getElementById('filter-type');
    const filterCommune = document.getElementById('filter-commune');
    const filterStatut = document.getElementById('filter-statut');
    const filterNiveau = document.getElementById('filter-niveau');
    const filterCategorie = document.getElementById('filter-categorie');
    const filterSearch = document.getElementById('filter-search');
    
    console.log('[Filtres] 📋 Éléments filtres:', {
        filterType: !!filterType,
        filterCommune: !!filterCommune,
        filterStatut: !!filterStatut,
        filterNiveau: !!filterNiveau,
        filterCategorie: !!filterCategorie,
        filterSearch: !!filterSearch
    });
    
    // Masquer tous par défaut
    if (filterType) filterType.classList.add('u-hidden');
    if (filterCommune) filterCommune.classList.add('u-hidden');
    if (filterStatut) filterStatut.classList.add('u-hidden');
    if (filterNiveau) filterNiveau.classList.add('u-hidden');
    if (filterCategorie) filterCategorie.classList.add('u-hidden');
    
    // Afficher selon la vue
    switch (view) {
        case 'etablissements':
            console.log('[Filtres] → Mode établissements');
            if (filterSearch) filterSearch.placeholder = '🔍 Rechercher un établissement...';
            if (filterType) {
                filterType.classList.remove('u-hidden');
                console.log('[Filtres] → populateTypeFilter()');
                await populateTypeFilter();
            }
            if (filterCommune) {
                filterCommune.classList.remove('u-hidden');
                console.log('[Filtres] → populateCommuneFilter()');
                await populateCommuneFilter();
            }
            if (filterStatut) {
                filterStatut.classList.remove('u-hidden');
                console.log('[Filtres] → populateStatutFilter()');
                await populateStatutFilter();
            }
            break;
            
        case 'diplomes':
            console.log('[Filtres] → Mode diplômes');
            if (filterSearch) filterSearch.placeholder = '🔍 Rechercher un diplôme...';
            if (filterNiveau) {
                filterNiveau.classList.remove('u-hidden');
                console.log('[Filtres] → populateNiveauDiplomeFilter()');
                await populateNiveauDiplomeFilter();
            }
            if (filterType) {
                filterType.classList.remove('u-hidden');
                console.log('[Filtres] → populateTypeDiplomeFilter()');
                await populateTypeDiplomeFilter();
            }
            if (filterCategorie) {
                filterCategorie.classList.remove('u-hidden');
                console.log('[Filtres] → populateCategorieFilter()');
                await populateCategorieFilter();
            }
            break;
            
        case 'dispositifs':
            console.log('[Filtres] → Mode dispositifs');
            if (filterSearch) filterSearch.placeholder = '🔍 Rechercher un dispositif...';
            /** 
            if (filterCategorie) {
                filterCategorie.classList.remove('u-hidden');
                console.log('[Filtres] → populateCategorieDispositifFilter()');
                await populateCategorieDispositifFilter();
            }
            */
            break;
            
        case 'options2ndeGT':
            console.log('[Filtres] → Mode options 2nde GT');
            if (filterSearch) filterSearch.placeholder = '🔍 Rechercher une option...';
            break;
            
        case 'specialites_1ereG':
            console.log('[Filtres] → Mode spécialités 1ère');
            if (filterSearch) filterSearch.placeholder = '🔍 Rechercher une spécialité...';
            break;
            
        default:
            console.log('[Filtres] → Mode par défaut');
            if (filterSearch) filterSearch.placeholder = '🔍 Rechercher...';
    }
    
    console.log('[Filtres] ✅ Filtres mis à jour pour la vue');
}

/**
 * Réinitialise l'état des filtres
 */
function resetFiltersState() {
    filtersState.search = '';
    filtersState.type = 'tous';
    filtersState.commune = 'toutes';
    filtersState.statut = 'tous';
    filtersState.niveau = 'tous';
    filtersState.categorie = 'toutes';
    
    // Réinitialiser les valeurs dans le DOM
    const filterSearch = document.getElementById('filter-search');
    const filterType = document.getElementById('filter-type');
    const filterCommune = document.getElementById('filter-commune');
    const filterStatut = document.getElementById('filter-statut');
    const filterNiveau = document.getElementById('filter-niveau');
    const filterCategorie = document.getElementById('filter-categorie');
    
    if (filterSearch) filterSearch.value = '';
    if (filterType) filterType.value = 'tous';
    if (filterCommune) filterCommune.value = 'toutes';
    if (filterStatut) filterStatut.value = 'tous';
    if (filterNiveau) filterNiveau.value = 'tous';
    if (filterCategorie) filterCategorie.value = 'toutes';
}

/**
 * Remplit le filtre Type d'établissement
 */
async function populateTypeFilter() {
    const etablissements = await window.databaseService.getAllEtablissements();
    const types = new Set();
    
    etablissements.forEach(etab => {
        if (etab.type) {
            types.add(etab.type);
        }
    });
    
    const filterType = document.getElementById('filter-type');
    filterType.innerHTML = '<option value="tous">Tous les types</option>';
    
    Array.from(types).sort().forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        filterType.appendChild(option);
    });
}

/**
 * Remplit le filtre Commune
 */
async function populateCommuneFilter() {
    const etablissements = await window.databaseService.getAllEtablissements();
    const communes = new Set();
    
    etablissements.forEach(etab => {
        if (etab.commune) {
            communes.add(etab.commune);
        }
    });
    
    const filterCommune = document.getElementById('filter-commune');
    filterCommune.innerHTML = '<option value="toutes">Toutes les communes</option>';
    
    Array.from(communes).sort().forEach(commune => {
        const option = document.createElement('option');
        option.value = commune;
        option.textContent = commune;
        filterCommune.appendChild(option);
    });
}

/**
 * Remplit le filtre Statut (dynamique depuis la base)
 */
async function populateStatutFilter() {
    const etablissements = await window.databaseService.getAllEtablissements();
    const statuts = new Set();
    
    etablissements.forEach(etab => {
        if (etab.statut) {
            statuts.add(etab.statut);
        }
    });
    
    const filterStatut = document.getElementById('filter-statut');
    filterStatut.innerHTML = '<option value="tous">Tous les statuts</option>';
    
    Array.from(statuts).sort().forEach(statut => {
        const option = document.createElement('option');
        option.value = statut;
        option.textContent = statut;
        filterStatut.appendChild(option);
    });
}

/**
 * Remplit le filtre Niveau (pour diplômes) - dynamique
 */
async function populateNiveauDiplomeFilter() {
    const diplomes = await window.databaseService.getAllDiplomes();
    const niveaux = new Set();
    
    diplomes.forEach(diplome => {
        if (diplome.niveauSortie) {
            niveaux.add(diplome.niveauSortie);
        }
    });
    
    const filterNiveau = document.getElementById('filter-niveau');
    filterNiveau.innerHTML = '<option value="tous">Tous les niveaux</option>';
    
    Array.from(niveaux).sort().forEach(niveau => {
        const option = document.createElement('option');
        option.value = niveau;
        option.textContent = niveau;
        filterNiveau.appendChild(option);
    });
}

/**
 * Remplit le filtre Type (pour diplômes) - dynamique
 */
async function populateTypeDiplomeFilter() {
    const diplomes = await window.databaseService.getAllDiplomes();
    const types = new Set();
    
    diplomes.forEach(diplome => {
        if (diplome.type) {
            types.add(diplome.type);
        }
    });
    
    const filterType = document.getElementById('filter-type');
    filterType.innerHTML = '<option value="tous">Tous les types</option>';
    
    Array.from(types).sort().forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        filterType.appendChild(option);
    });
}

/**
 * Remplit le filtre Catégorie (pour diplômes)
 */
async function populateCategorieFilter() {
    const diplomes = await window.databaseService.getAllDiplomes();
    const categories = new Set();
    
    diplomes.forEach(diplome => {
        // Utiliser niveauSortie comme catégorie (CAP, Bac pro, etc.)
        if (diplome.niveauSortie) {
            categories.add(diplome.niveauSortie);
        }
    });
    
    const filterCategorie = document.getElementById('filter-categorie');
    filterCategorie.innerHTML = '<option value="toutes">Toutes les catégories</option>';
    
    // Ordre de tri personnalisé
    const ordre = ['CAP ou équivalent', 'bac ou équivalent'];
    const categoriesTriees = Array.from(categories).sort((a, b) => {
        const indexA = ordre.indexOf(a);
        const indexB = ordre.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });
    
    categoriesTriees.forEach(categorie => {
        const option = document.createElement('option');
        option.value = categorie;
        option.textContent = categorie;
        filterCategorie.appendChild(option);
    });
}

/**
 * Remplit le filtre Catégorie (pour dispositifs)
 */
async function populateCategorieDispositifFilter() {
    const dispositifs = await window.databaseService.getAllDispositifs();
    console.log(`[Filtres] 🔍 Population filtre catégorie dispositifs: ${dispositifs.length} dispositifs`);
    
    const categories = new Set();
    
    dispositifs.forEach(dispositif => {
        if (dispositif.type) {
            if (dispositif.type) {
                categories.add(dispositif.type);
            } else {
                console.warn(`[Filtres] ⚠️ Dispositif sans catégorie: "${dispositif.libelle}"`);
            }
        }
    });
    console.log(`[Filtres] ✅ ${categories.size} catégories trouvées:`, Array.from(categories).sort());
    
    const filterCategorie = document.getElementById('filter-categorie');
    filterCategorie.innerHTML = '<option value="toutes">Toutes les catégories</option>';
    
    Array.from(categories).sort().forEach(categorie => {
        const option = document.createElement('option');
        option.value = categorie;
        option.textContent = categorie;
        filterCategorie.appendChild(option);
    });
}

/**
 * Applique les filtres sur les données affichées
 */
function applyFilters() {
    console.log('[Filtres] Application des filtres:', filtersState);
    
    const view = currentView;
    
    switch (view) {
        case 'etablissements':
            filterEtablissements();
            break;
        case 'diplomes':
            filterDiplomes();
            break;
        case 'dispositifs':
            filterDispositifs();
            break;
        case 'options_2nde_gt':
            filterOptions();
            break;
        case 'specialites_1ereG':
            filterSpecialites();
            break;
    }
    
    updateResultsCount();
}

/**
 * Filtre les établissements
 */
function filterEtablissements() {
    const rows = document.querySelectorAll('#results-body tr[data-uai]');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const nom = row.querySelector('td:nth-child(1)')?.textContent.toLowerCase() || '';
        const type = row.dataset.type || '';
        const commune = row.dataset.commune || '';
        const statut = row.dataset.statut || '';
        
        let visible = true;
        
        // Filtre recherche
        if (filtersState.search && !nom.includes(filtersState.search)) {
            visible = false;
        }
        
        // Filtre type
        if (filtersState.type !== 'tous' && type !== filtersState.type) {
            visible = false;
        }
        
        // Filtre commune
        if (filtersState.commune !== 'toutes' && commune !== filtersState.commune) {
            visible = false;
        }
        
        // Filtre statut
        if (filtersState.statut !== 'tous' && statut !== filtersState.statut) {
            visible = false;
        }
        
        row.style.display = visible ? '' : 'none';
        if (visible) visibleCount++;
    });
    
    console.log(`[Filtres] ${visibleCount} établissements visibles`);
}

/**
 * Filtre les diplômes
 */
function filterDiplomes() {
    const rows = document.querySelectorAll('#results-body tr[data-libelle]');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const libelle = row.querySelector('td:nth-child(1)')?.textContent.toLowerCase() || '';
        const niveau = row.dataset.niveau || '';
        const type = row.dataset.type || '';
        const categorie = row.dataset.categorie || '';
        
        let visible = true;
        
        // Filtre recherche
        if (filtersState.search && !libelle.includes(filtersState.search)) {
            visible = false;
        }
        
        // Filtre niveau
        if (filtersState.niveau !== 'tous' && niveau !== filtersState.niveau) {
            visible = false;
        }
        
        // Filtre type
        if (filtersState.type !== 'tous' && type !== filtersState.type) {
            visible = false;
        }
        
        // Filtre catégorie
        if (filtersState.categorie !== 'toutes' && categorie !== filtersState.categorie) {
            visible = false;
        }
        
        row.style.display = visible ? '' : 'none';
        if (visible) visibleCount++;
    });
    
    console.log(`[Filtres] ${visibleCount} diplômes visibles`);
}

/**
 * Filtre les dispositifs
 */
function filterDispositifs() {
    const rows = document.querySelectorAll('#results-body tr[data-libelle]');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const libelle = row.querySelector('td:nth-child(1)')?.textContent.toLowerCase() || '';
        const categorie = row.dataset.type || ''; // Catégorie = type du dispositif
        
        let visible = true;
        
        // Filtre recherche
        if (filtersState.search && !libelle.includes(filtersState.search)) {
            visible = false;
        }
        
        // Filtre catégorie
        if (filtersState.categorie !== 'toutes' && categorie !== filtersState.categorie) {
            visible = false;
        }
        
        row.style.display = visible ? '' : 'none';
        if (visible) visibleCount++;
    });
    
    console.log(`[Filtres] ${visibleCount} dispositifs visibles`);
}

/**
 * Filtre les options
 */
function filterOptions() {
    const rows = document.querySelectorAll('#results-body tr[data-libelle]');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const libelle = row.querySelector('td:nth-child(1)')?.textContent.toLowerCase() || '';
        
        let visible = true;
        
        // Filtre recherche
        if (filtersState.search && !libelle.includes(filtersState.search)) {
            visible = false;
        }
        
        row.style.display = visible ? '' : 'none';
        if (visible) visibleCount++;
    });
    
    console.log(`[Filtres] ${visibleCount} options visibles`);
}

/**
 * Filtre les spécialités
 */
function filterSpecialites() {
    const rows = document.querySelectorAll('#results-body tr[data-libelle]');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const libelle = row.querySelector('td:nth-child(1)')?.textContent.toLowerCase() || '';
        
        let visible = true;
        
        // Filtre recherche
        if (filtersState.search && !libelle.includes(filtersState.search)) {
            visible = false;
        }
        
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
    const totalRows = document.querySelectorAll('#results-body tr[data-uai], #results-body tr[data-libelle]');
    
    const countElement = document.getElementById('results-count');
    if (countElement) {
        countElement.textContent = `${visibleRows.length} / ${totalRows.length}`;
    }
}
