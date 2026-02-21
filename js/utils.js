/************************************************
 * Fichier : utils.js
 * Description : Initialisation de l'application et fonctions utilitaires
 * Auteur : Laurent COSTE
 * Date : 2026-02-03
 * Version : 2.0 (nettoyé)
 ************************************************/

// =====================================
// VARIABLES GLOBALES
// =====================================
let onisepAPI = null;
let dataEducationAPI = null;
let geoAPI = null;
let databaseService = null;
let SQL = null;  // Obsolète (SQL.js), sera supprimé

// =====================================
// INITIALISATION DE L'APPLICATION
// =====================================

/**
 * Initialise l'application au chargement de la page
 * @returns {Promise<void>}
 */
async function init() {
    console.log('════════════════════════════════════════════════');
    console.log('🚀 INITIALISATION DÉMARRÉE - V0.38');
    console.log('════════════════════════════════════════════════');
    
    try {
        // ─────────────────────────────────────────────────
        // 1. Créer DatabaseService GLOBAL (persistance partagée)
        // ─────────────────────────────────────────────────
        console.log('[INIT] Création DatabaseService...');
        window.databaseService = new DatabaseService();
        await window.databaseService.init();
        console.log('[INIT] ✅ DatabaseService initialisé');
        
        // ─────────────────────────────────────────────────
        // 2. Créer les controllers
        // ─────────────────────────────────────────────────
        console.log('[INIT] Création des controllers...');
        
        // OnisepExtractionController (instancie OnisepAPI + parser en interne)
        window.onisepExtractionController = new OnisepExtractionController();
        window.onisepExtractionController.init(); // Connecter DatabaseService
        console.log('[INIT] ✅ OnisepExtractionController créé');
        
        // GeoExtractionController (instancie GeoAPI en interne)
        window.geoExtractionController = new GeoExtractionController();
        window.geoExtractionController.init(); // Connecter DatabaseService
        console.log('[INIT] ✅ GeoExtractionController créé');
        
        // Connecter GeoController à OnisepController (pour extractions EPCI)
        window.onisepExtractionController.setGeoController(window.geoExtractionController);
        
        // CARIFOREFExtractionController (voie apprentissage)
        window.carifOrefExtractionController = new CARIFOREFExtractionController();
        window.carifOrefExtractionController.init(); // Connecter DatabaseService
        window.carifOrefExtractionController.setGeoController(window.geoExtractionController);
        console.log('[INIT] ✅ CARIFOREFExtractionController créé et connecté');
        
        // DataEducationExtractionController (instancie DataEducationAPI en interne)
        window.dataEducationExtractionController = new DataEducationExtractionController();
        window.dataEducationExtractionController.init(); // Connecter DatabaseService
        console.log('[INIT] ✅ DataEducationExtractionController créé');
        
        // NOTE: Les APIs ne sont PAS exposées globalement
        // Elles sont privées dans chaque controller

        // ─────────────────────────────────────────────────
        // 2. Charger les credentials Onisep sauvegardés
        // ─────────────────────────────────────────────────
        console.log('[INIT] Chargement des credentials...');
        if (typeof loadSavedCredentials === 'function') {
            loadSavedCredentials();
        }
        
        // ─────────────────────────────────────────────────
        // 3. Auto-connexion si activée
        // ─────────────────────────────────────────────────
        const autoConnect = localStorage.getItem('settings_auto_connect') === 'true';
        if (autoConnect) {
            const email = localStorage.getItem('settings_email');
            const password = localStorage.getItem('settings_password');
            const appId = localStorage.getItem('settings_app_id');
            
            if (email && password && appId) {
                console.log('[INIT] Auto-connexion activée');
                setTimeout(() => {
                    if (typeof autoConnectOnisep === 'function') {
                        autoConnectOnisep(email, password, appId);
                    }
                }, 1000);
            }
        }
        
        // ─────────────────────────────────────────────────
        // 4. Initialiser les parcours Bac Pro
        // ─────────────────────────────────────────────────
        console.log('[INIT] Vérification parcours Bac Pro...');
        // Compter le total de diplômes
        let totalDiplomes = 0;
        PARCOURS_BAC_PRO.forEach(famille => {
            totalDiplomes += famille.parcours.length;
        });    
        console.log('[PARCOURS BAC PRO] Fichier chargé:');
        console.log('  - ' + PARCOURS_BAC_PRO.length + ' familles/groupes');
        console.log('  - ' + totalDiplomes + ' diplômes Bac Pro au total');
        
        // ─────────────────────────────────────────────────
        // 5. Charger les EPCI
        // ─────────────────────────────────────────────────
        console.log('[INIT] Chargement des EPCI...');
        try {
            await window.geoExtractionController.getAllEPCIs();
            console.log('[INIT] ✅ EPCI chargés');
        } catch (error) {
            console.error('[INIT] ⚠️  Erreur chargement EPCI:', error);
        }
        
        // ─────────────────────────────────────────────────
        // 6. Afficher la vue par défaut (Résultats)
        // ─────────────────────────────────────────────────
        console.log('[INIT] Affichage de la vue par défaut...');
        if (typeof switchTab === 'function') {
            switchTab('resultats');
        }
        
        // ─────────────────────────────────────────────────
        // 7. Afficher les favoris dans le panneau latéral
        // ─────────────────────────────────────────────────
        console.log('[INIT] Chargement des favoris...');
        if (typeof afficherListeFavoris === 'function') {
            afficherListeFavoris();
        }
        
        // ─────────────────────────────────────────────────
        // 8. Finalisation
        // ─────────────────────────────────────────────────
        console.log('════════════════════════════════════════════════');
        console.log('✅ INITIALISATION TERMINÉE AVEC SUCCÈS');
        console.log('════════════════════════════════════════════════');
        
    } catch (error) {
        console.error('════════════════════════════════════════════════');
        console.error('❌ ERREUR LORS DE L\'INITIALISATION');
        console.error(error);
        console.error('════════════════════════════════════════════════');
        showAlert('❌ Erreur d\'initialisation: ' + error.message, 'error');
    }
}

// =====================================
// FONCTIONS UTILITAIRES
// =====================================

/**
 * Affiche une alerte temporaire
 * @param {string} message - Message à afficher
 * @param {'success'|'error'|'info'|'warning'} type - Type d'alerte
 * @returns {void}
 */
function showAlert(message, type = 'info') {
    const alerts = document.getElementById('alerts');
    if (!alerts) {
        console.warn('[Utils] Container d\'alertes non trouvé');
        return;
    }
    
    const className = type === 'success' ? 'alert-success' 
                    : type === 'error' ? 'alert-error' 
                    : type === 'warning' ? 'alert-warning'
                    : 'alert-info';
    
    const alert = document.createElement('div');
    alert.className = `alert ${className}`;
    alert.innerHTML = message;
    
    alerts.appendChild(alert);
    
    // Durée d'affichage selon le type
    const duration = type === 'info' ? 10000 : 5000;
    
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
    }, duration);
}

// =====================================
// FONCTIONS DE DEBUG
// =====================================

/**
 * Teste les académies disponibles dans l'API Onisep (debug)
 * @returns {Promise<string[]>}
 */
async function testAcademies() {
    console.log('🔍 Test des académies disponibles dans l\'API Onisep...\n');
    
    try {
        if (!onisepAPI) {
            console.error('❌ OnisepAPI non initialisée');
            return [];
        }
        
        const academies = await onisepAPI.getAcademiesDisponibles();
        console.log(`✅ ${academies.length} académies trouvées:\n`);
        academies.forEach((acad, i) => {
            console.log(`  ${i+1}. "${acad}"`);
        });
        
        console.log('\n💡 Pour tester une académie spécifique, utilisez:');
        console.log('  testAcademieSpecifique("Normandie")');
        
        return academies;
    } catch (error) {
        console.error('❌ Erreur:', error);
        return [];
    }
}

/**
 * Teste une académie spécifique (debug)
 * @param {string} nomAcademie - Nom de l'académie
 * @returns {Promise<Object>}
 */
async function testAcademieSpecifique(nomAcademie) {
    console.log(`🔍 Test de l'académie "${nomAcademie}"...\n`);
    
    try {
        if (!onisepAPI) {
            console.error('❌ OnisepAPI non initialisée');
            return null;
        }
        
        // Effectuer une requête test
        const filters = {
            'facet.ens_academie': nomAcademie,
            'facet.for_niveau_de_sortie': 'CAP ou équivalent',
            size: 10
        };
        
        const results = await onisepAPI.getActionsLycee(filters);
        
        console.log(`✅ ${results.length} résultat(s) trouvé(s)`);
        
        if (results.length > 0) {
            const academies = [...new Set(results.map(r => r.ens_academie))].filter(Boolean);
            const departements = [...new Set(results.map(r => r.ens_departement))].filter(Boolean);
            
            console.log(`\n🌍 Académies dans les résultats (${academies.length}):`);
            academies.forEach(a => console.log(`  - ${a}`));
            
            console.log(`\n📍 Départements dans les résultats (${departements.length}):`);
            departements.slice(0, 5).forEach(d => console.log(`  - ${d}`));
            if (departements.length > 5) {
                console.log(`  ... et ${departements.length - 5} autres`);
            }
            
            console.log(`\n📋 Premier établissement:`);
            console.log(`  Nom: ${results[0].ens_nom || 'N/A'}`);
            console.log(`  UAI: ${results[0].ens_code_uai}`);
            console.log(`  Académie: ${results[0].ens_academie}`);
            console.log(`  Département: ${results[0].ens_departement}`);
        } else {
            console.log('⚠️  Aucun résultat');
        }
        
        return results;
    } catch (error) {
        console.error('❌ Erreur:', error);
        return null;
    }
}

// =====================================
// INFORMATIONS DE DÉBOGAGE
// =====================================
console.log('════════════════════════════════════════════════');
console.log('💡 FONCTIONS DE TEST DISPONIBLES:');
console.log('  - testAcademies() : Liste toutes les académies');
console.log('  - testAcademieSpecifique("Normandie") : Teste une académie');
console.log('════════════════════════════════════════════════');

// =====================================
// EXPOSITION GLOBALE
// =====================================
if (typeof window !== 'undefined') {
    window.init = init;
    window.showAlert = showAlert;
    window.testAcademies = testAcademies;
    window.testAcademieSpecifique = testAcademieSpecifique;
}
