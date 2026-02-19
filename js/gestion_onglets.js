/************************************************
 * Fichier : gestion_onglets.js
 * Description : Navigation entre onglets et gestion modale extraction
 * Auteur : Laurent COSTE
 * Date : 2026-02-03
 * Version : 2.0 (allégé - responsabilités transférées)
 ************************************************/

// =====================================
// VARIABLES D'ÉTAT
// =====================================
let currentTab = 'resultats';

// =====================================
// NAVIGATION ENTRE ONGLETS
// =====================================

/**
 * Change d'onglet principal
 * @param {'recherche'|'resultats'|'carte'} tabName - Nom de l'onglet
 * @returns {void}
 */
function switchTab(tabName) {
    console.log(`[Onglets] Basculement vers onglet: ${tabName}`);
    
    currentTab = tabName;
    
    // Désactiver tous les boutons et cacher tous les panels
    document.querySelectorAll('.tabs__item').forEach(btn => {
        btn.classList.remove('tabs__item--active');
    });
    document.querySelectorAll('.tabs__panel').forEach(panel => {
        panel.classList.add('tabs__panel--hidden');
    });
    
    // Activer le bouton et afficher le panel sélectionné
    const btn = document.querySelector(`[data-tab="${tabName}"]`);
    const content = document.getElementById(`tab-${tabName}`);
    
    if (btn && content) {
        btn.classList.add('tabs__item--active');
        content.classList.remove('tabs__panel--hidden');
        
        // Actions spécifiques par onglet
        switch (tabName) {
            case 'recherche':
                // Initialiser la recherche géographique
                if (typeof window.initResultsTab === 'function') {
                    window.initSearchTab();
                }
                break;
            
            case 'resultats':
                // Recharger les statistiques et la vue
                if (typeof window.initResultsTab === 'function') {
                    window.initResultsTab();
                }
                break;
            
            case 'carte':
                // Initialiser ou rafraîchir la carte
                if (typeof window.initMap === 'function') {
                    window.initMap();
                }
                else {
                    console.error('[Onglets] ❌ Fonction initMap() non trouvée!');
                    console.error('[Onglets]    Vérifier que gestion_onglet_carte.js est bien chargé');
                }

                if (typeof window.refreshMap === 'function') {
                    window.refreshMap();
                }
                else {
                    console.error('[Onglets] ❌ Fonction refreshMap() non trouvée!');
                    console.error('[Onglets]    Vérifier que gestion_onglet_carte.js est bien chargé');
                }
                break;
        }

    } else {
        console.error('[Onglets] Onglet non trouvé:', tabName);
    }
}

/**
 * Bascule vers l'onglet résultats (raccourci après extraction)
 * @returns {void}
 */
function switchToResults() {
    switchTab('resultats');
}


// =====================================
// EXPOSITION GLOBALE
// =====================================
if (typeof window !== 'undefined') {
    window.switchTab = switchTab;
    window.switchToResults = switchToResults;
}
