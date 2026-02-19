/************************************************
 * Fichier : extraction_modal.js
 * Description : Classe pour gérer les modales d'extraction avec progression
 * Auteur : Laurent COSTE
 * Date : 2026-02-15
 * Version : 1.0
 ************************************************/

/**
 * Classe pour afficher une modale d'extraction avec barre de progression
 * Hérite de Modal pour la gestion de base (ouverture/fermeture/z-index)
 */
class ExtractionModal extends Modal {
    #progress = 0;
    #message = '';
    #details = [];
    #progressElement = null;
    #messageElement = null;
    #detailsElement = null;
    
    /**
     * Constructeur - Crée la modale dynamiquement
     * @param {string} modalId - ID unique pour la modale (ou null pour auto-génération)
     * @param {string} title - Titre de la modale (défaut: "Extraction en cours")
     */
    constructor(modalId = null, title = 'Extraction en cours') {
        // Générer ID unique si non fourni
        const finalId = modalId || `extraction-modal-${Date.now()}`;
        super(finalId);
        
        this.setTitle(title);
        this.#createProgressContent();
        this.#initElements();
        
        console.log(`[ExtractionModal] Instance créée dynamiquement: ${finalId}`);
    }
    
    /**
     * Crée le contenu HTML de la modale (barre de progression)
     * @private
     */
    #createProgressContent() {
        const progressHTML = `
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
            <p class="progress-message">Initialisation...</p>
            <div class="progress-details"></div>
        `;
        this.setContent(progressHTML);
    }
    
    /**
     * Initialise les références aux éléments DOM créés
     * @private
     */
    #initElements() {
        // Les éléments sont maintenant dans le body de la modale
        const bodyElement = this.getBodyElement();
        
        if (bodyElement) {
            this.#progressElement = bodyElement.querySelector('.progress-fill');
            this.#messageElement = bodyElement.querySelector('.progress-message');
            this.#detailsElement = bodyElement.querySelector('.progress-details');
        }
        
        if (!this.#progressElement || !this.#messageElement || !this.#detailsElement) {
            console.warn('[ExtractionModal] Certains éléments sont manquants');
        }
    }
    
    /**
     * Définit le pourcentage de progression (0-100)
     * Ajoute automatiquement "..." au message si < 100%
     * @param {number} percent - Pourcentage (0-100)
     */
    setProgress(percent) {
        // Valider et borner entre 0 et 100
        percent = Math.max(0, Math.min(100, percent));
        
        // Ne peut qu'augmenter (jamais reculer)
        if (percent < this.#progress) {
            console.warn(`[ExtractionModal] Tentative de réduire la progression (${this.#progress}% → ${percent}%). Ignoré.`);
            return;
        }
        
        this.#progress = percent;
        
        // Mettre à jour la barre visuellement
        if (this.#progressElement) {
            this.#progressElement.style.width = `${percent}%`;
        }
        
        // Mettre à jour le message avec "..." si pas terminé
        this.#updateMessage();
        
        console.log(`[ExtractionModal] Progression: ${percent}%`);
    }
    
    /**
     * Définit le message principal
     * @param {string} message - Nouveau message
     */
    setMessage(message) {
        this.#message = message;
        this.#updateMessage();
    }
    
    /**
     * Met à jour l'affichage du message avec "..." automatique
     * @private
     */
    #updateMessage() {
        if (!this.#messageElement) return;
        
        let displayMessage = this.#message;
        
        // Ajouter "..." si pas terminé et message ne se termine pas déjà par "..."
        if (this.#progress < 100 && !displayMessage.endsWith('...')) {
            displayMessage += '...';
        }
        
        this.#messageElement.textContent = displayMessage;
    }
    
    /**
     * Ajoute un message de détail (append, ne remplace pas)
     * @param {string} message - Message à ajouter
     * @param {string} type - Type de message: 'info', 'success', 'warning', 'error' (défaut: 'info')
     */
    addDetail(message, type = 'info') {
        this.#details.push({ message, type });
        
        if (!this.#detailsElement) return;
        
        // Créer l'élément de détail
        const detailElement = document.createElement('p');
        detailElement.textContent = message;
        
        // Appliquer un style selon le type
        switch(type) {
            case 'success':
                detailElement.style.color = '#28a745';
                break;
            case 'warning':
                detailElement.style.color = '#ffc107';
                break;
            case 'error':
                detailElement.style.color = '#dc3545';
                break;
            default: // 'info'
                detailElement.style.color = '#666';
        }
        
        // Ajouter au conteneur
        this.#detailsElement.appendChild(detailElement);
        
        console.log(`[ExtractionModal] Détail ajouté (${type}): ${message}`);
    }
    
    /**
     * Réinitialise complètement la modale
     */
    reset() {
        this.#progress = 0;
        this.#message = '';
        this.#details = [];
        
        if (this.#progressElement) {
            this.#progressElement.style.width = '0%';
        }
        
        if (this.#messageElement) {
            this.#messageElement.textContent = '';
        }
        
        if (this.#detailsElement) {
            this.#detailsElement.innerHTML = '';
        }
        
        console.log('[ExtractionModal] Réinitialisée');
    }
    
    /**
     * Marque l'extraction comme terminée avec succès
     * @param {string} message - Message final (défaut: "Extraction terminée")
     */
    complete(message = 'Extraction terminée') {
        this.setProgress(100);
        this.setMessage(message);
        this.addDetail(`✓ ${message}`, 'success');
        
        console.log('[ExtractionModal] Extraction terminée avec succès');
    }
    
    /**
     * Marque l'extraction comme échouée
     * @param {string} message - Message d'erreur
     */
    error(message) {
        this.setMessage(message);
        this.addDetail(`✗ ${message}`, 'error');
        
        console.error('[ExtractionModal] Erreur:', message);
    }
    
    /**
     * Ouvre la modale et la réinitialise
     * @param {string} initialMessage - Message initial (optionnel)
     */
    start(initialMessage = 'Initialisation') {
        this.reset();
        this.setMessage(initialMessage);
        this.setProgress(0);
        this.open();
        
        console.log('[ExtractionModal] Démarrage de l\'extraction');
    }
    
    /**
     * Ferme la modale
     * Override pour pouvoir ajouter de la logique spécifique
     */
    close() {
        super.close();
        console.log('[ExtractionModal] Modale fermée');
    }
    
    /**
     * Obtient la progression actuelle
     * @returns {number} Progression (0-100)
     */
    getProgress() {
        return this.#progress;
    }
    
    /**
     * Obtient le message actuel
     * @returns {string} Message
     */
    getMessage() {
        return this.#message;
    }
    
    /**
     * Obtient tous les détails
     * @returns {Array} Liste des détails
     */
    getDetails() {
        return [...this.#details];
    }
}

// Exposer globalement
if (typeof window !== 'undefined') {
    window.ExtractionModal = ExtractionModal;
}
