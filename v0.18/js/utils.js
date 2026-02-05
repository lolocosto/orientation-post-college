/**
 * Fonctions utilitaires
 * Version 0.18
 */

const Utils = {
    /**
     * Afficher un message d'alerte
     */
    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '10000';
        alertDiv.style.animation = 'slideIn 0.3s ease-out';
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => alertDiv.remove(), 300);
        }, 3000);
    },

    /**
     * Formater une date
     */
    formatDate(date) {
        return new Date(date).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    /**
     * Normaliser un texte (enlever accents, minuscules)
     */
    normalizeText(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    },

    /**
     * Debounce une fonction
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Télécharger un fichier
     */
    downloadFile(data, filename, type = 'application/octet-stream') {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Obtenir le nom d'académie depuis le code
     */
    getAcademieName(code) {
        return window.academiesData?.[code] || `Académie ${code}`;
    },

    /**
     * Obtenir le nom d'EPCI depuis le SIREN
     */
    getEPCIName(siren) {
        const epci = window.intercommunalitesData?.find(e => e.siren === siren);
        return epci?.nom || `EPCI ${siren}`;
    }
};

// Export
window.Utils = Utils;
