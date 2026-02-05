/**
 * Configuration globale de l'application
 * Version 0.18
 */

const CONFIG = {
    version: '0.18.0',
    appName: 'Orientation Post-Collège',
    
    // API Onisep
    api: {
        baseUrl: 'https://api.opendata.onisep.fr/api/1.0',
        maxRetries: 3,
        retryDelay: 2000,
        rateLimit: 500 // ms entre requêtes
    },
    
    // Base de données
    database: {
        name: 'lycees_orientation.db',
        version: 1
    },
    
    // Favoris
    favorites: {
        maxCount: 10,
        storageKey: 'lycees_favoris_v018'
    },
    
    // Carte
    map: {
        defaultCenter: [46.603354, 1.888334],
        defaultZoom: 6,
        maxZoom: 18,
        minZoom: 5
    },
    
    // UI
    ui: {
        defaultView: 'lycees',
        itemsPerPage: 50
    }
};

// Export
window.CONFIG = CONFIG;
