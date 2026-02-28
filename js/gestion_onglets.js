// Copyright (c) 2026 Laurent COSTE — Licensed under EUPL v1.2 — See LICENSE
/************************************************
 * Fichier : gestion_onglets.js
 * Description : Navigation entre onglets et gestion modale extraction
 * Auteur : Laurent COSTE
 * Date : 2026-02-03
 ************************************************/

// =====================================
// VARIABLES D'ÉTAT
// =====================================
let currentTab = 'resultats';

// =====================================
// NAVIGATION ENTRE ONGLETS
// =====================================

/**
 * Change d'onglet principal.
 * @param {'recherche'|'resultats'|'carte'} tabName - Nom de l'onglet
 * @param {boolean} [skipInit=false] - Si true, bascule visuelle uniquement sans rappeler initResultsTab.
 *   Utilisé au démarrage quand _onDbReady a déjà rendu les données.
 * @returns {void}
 */
function switchTab(tabName, skipInit = false) {
    console.log(`[Onglets] Basculement vers onglet: ${tabName}${skipInit ? ' (skipInit)' : ''}`);
    
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
        
        // Actions spécifiques par onglet (sauf si skipInit demandé)
        if (!skipInit) {
            switch (tabName) {
                case 'recherche':
                    if (typeof window.initSearchTab === 'function') {
                        window.initSearchTab();
                    }
                    break;
                
                case 'resultats':
                    if (typeof window.initResultsTab === 'function') {
                        window.initResultsTab();
                    }
                    break;
                
                case 'carte':
                    if (typeof window.initMap === 'function') {
                        window.initMap();
                    } else {
                        console.error('[Onglets] ❌ Fonction initMap() non trouvée !');
                    }
                    break;
            }
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
