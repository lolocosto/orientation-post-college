// Copyright (c) 2026 Laurent COSTE — Licensed under EUPL v1.2 — See LICENSE
/**
 * Classe pour gérer la modale de progrès d'extraction
 * Évite la duplication de code entre les différents types d'extraction
 * 
 * Usage:
 * const progressModal = new ProgressModal();
 * progressModal.show();
 * progressModal.update('Chargement...', 50, 100);
 * progressModal.addDetail('Étape 1 terminée', 'success');
 * progressModal.hide();
 */
class ProgressModal {
    #modal = null;
    #fill = null;
    #message = null;
    #details = null;
    #modalId = null;
    #onCloseCallback = null;
    #autoSwitchToResults = false;  // Bascule auto supprimée (v0.47) — l'utilisateur ferme manuellement
    #successHideCalled = false;   // Protection contre double appel hideWithSuccess
    #title = 'Extraction en cours'; // Titre affiché dans l'en-tête de la modale

    /**
     * Constructeur - Crée la modale dynamiquement
     * @param {string|null} modalId            - ID unique (auto-généré si null)
     * @param {Function|null} onClose          - Callback à la fermeture (optionnel)
     * @param {boolean} autoSwitchToResults    - Ignoré depuis v0.47 (bascule auto supprimée)
     * @param {string} title                   - Titre affiché dans l'en-tête (défaut: "Extraction en cours")
     */
    constructor(modalId = null, onClose = null, autoSwitchToResults = false, title = 'Extraction en cours') {
        // Générer ID unique si non fourni
        this.#modalId = modalId || `extraction-progress-modal-${Date.now()}`;
        this.#onCloseCallback = onClose;
        this.#autoSwitchToResults = autoSwitchToResults;
        this.#title = title;

        // Créer la modale dynamiquement
        this.#createElement();

        // Récupérer les éléments créés
        this.#fill = this.#modal.querySelector('.progress-fill');
        this.#message = this.#modal.querySelector('.progress-message');
        this.#details = this.#modal.querySelector('.progress-details');

        console.log(`[ProgressModal] Instance créée dynamiquement: ${this.#modalId}`);
    }
    
    /**
     * Crée l'élément DOM de la modale et l'ajoute au body
     * @private
     */
    #createElement() {
        const modalHTML = `
            <div id="${this.#modalId}" class="modal">
                <div class="modal__dialog">
                    <div class="modal__content">
                        <div class="modal__header">
                            <h2 class="modal__title">${this.#title}</h2>
                            <button class="modal__close">&times;</button>
                        </div>
                        <div class="modal__body">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: 0%"></div>
                            </div>
                            <p class="progress-message">Initialisation...</p>
                            <div class="progress-details"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Parser le HTML
        const temp = document.createElement('div');
        temp.innerHTML = modalHTML;
        this.#modal = temp.firstElementChild;
        
        // Ajouter au body
        document.body.appendChild(this.#modal);
        
        // Gérer la fermeture
        const closeBtn = this.#modal.querySelector('.modal__close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
    }
    
    /**
     * Affiche la modale et réinitialise
     */
    show() {
        if (this.#modal) {
            this.reset();
            this.#modal.classList.add('modal--active');
            
            // Ajouter à la pile des modales pour z-index
            if (typeof ModalStack !== 'undefined') {
                const fakeModalInstance = {
                    modalId: this.#modalId,
                    close: () => this.hide(),
                    setZIndex: (zIndex) => {
                        this.#modal.style.zIndex = zIndex;
                    }
                };
                ModalStack.push(fakeModalInstance);
                
                console.log(`[ProgressModal] Ouverte et ajoutée à ModalStack`);
            }
        }
    }
    
    /**
     * Cache la modale
     * @param {number} delay - Délai avant fermeture en ms (défaut: 0)
     */
    hide(delay = 0) {
        if (this.#modal) {
            // Retirer de la pile par ID
            if (typeof ModalStack !== 'undefined' && typeof ModalStack.removeById === 'function') {
                ModalStack.removeById(this.#modalId);
            }
            
            // Appeler callback avant fermeture
            if (this.#onCloseCallback && typeof this.#onCloseCallback === 'function') {
                this.#onCloseCallback();
            }
            
            if (delay > 0) {
                setTimeout(() => {
                    this.#modal.classList.remove('modal--active');
                    // Détruire après animation
                    setTimeout(() => this.destroy(), 300);
                }, delay);
            } else {
                this.#modal.classList.remove('modal--active');
                // Détruire après animation
                setTimeout(() => this.destroy(), 300);
            }
        }
    }
    
    /**
     * Alias de hide() pour compatibilité
     */
    close(delay = 0) {
        this.hide(delay);
    }
    
    /**
     * Détruit la modale et la retire du DOM
     */
    destroy() {
        if (this.#modal && this.#modal.parentNode) {
            this.#modal.parentNode.removeChild(this.#modal);
            console.log(`[ProgressModal] Détruite: ${this.#modalId}`);
        }
        this.#modal = null;
        this.#fill = null;
        this.#message = null;
        this.#details = null;
    }
    
    /**
     * Met à jour la progression
     * @param {string} message - Message à afficher
     * @param {number} current - Valeur actuelle
     * @param {number} total - Valeur totale (défaut 100)
     */
    update(message, current, total = 100) {
        if (this.#message) {
            this.#message.textContent = message;
        }
        
        const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
        
        if (this.#fill) {
            this.#fill.style.width = `${percentage}%`;
        }
    }
    
    /**
     * Ajoute un détail dans la zone de détails
     * @param {string} detail - Texte du détail
     * @param {string} type - Type : 'info', 'success', 'warning', 'error'
     */
    addDetail(detail, type = 'info') {
        if (this.#details) {
            const iconMap = {
                'info': 'ℹ️',
                'success': '✅',
                'warning': '⚠️',
                'error': '❌'
            };
            
            const icon = iconMap[type] || '';
            const div = document.createElement('div');
            div.className = `progress-detail progress-detail-${type}`;
            div.textContent = `${icon} ${detail}`;
            
            this.#details.appendChild(div);
            
            // Auto-scroll vers le bas
            this.#details.scrollTop = this.#details.scrollHeight;
        }
    }
    
    /**
     * Efface tous les détails
     */
    clearDetails() {
        if (this.#details) {
            this.#details.innerHTML = '';
        }
    }
    
    /**
     * Réinitialise complètement la modale
     */
    reset() {
        this.update('Initialisation...', 0, 100);
        this.clearDetails();
    }
    
    /**
     * Affiche un message d'erreur et cache après délai
     * @param {string} errorMessage - Message d'erreur
     * @param {number} autoHideDelay - Délai auto-fermeture en ms (défaut: 0)
     */
    showError(errorMessage, autoHideDelay = 0) {
        this.update('❌ Erreur', 100, 100);
        this.addDetail(errorMessage, 'error');
        if (autoHideDelay > 0) {
            this.hide(autoHideDelay);
        }
    }
    
    /**
     * Affiche un message de succès et cache après délai
     * @param {string} successMessage - Message de succès
     * @param {number} autoHideDelay - Délai auto-fermeture en ms (défaut: 0)
     */
    showSuccess(successMessage, autoHideDelay = 0) {
        this.update('✅ Terminé', 100, 100);
        this.addDetail(successMessage, 'success');
        if (autoHideDelay > 0) {
            this.hide(autoHideDelay);
        }
    }
    
    /**
     * Cache la modale avec succès et bascule vers résultats (si autoSwitchToResults = true)
     * @param {number} delay - Délai avant fermeture en ms (défaut: 2000)
     */
    hideWithSuccess(delay = 2000) {
        console.log(`[ProgressModal] hideWithSuccess appelé (modalId: ${this.#modalId}, successHideCalled: ${this.#successHideCalled}, autoSwitch: ${this.#autoSwitchToResults})`);
        
        // Protéger contre double appel
        if (this.#successHideCalled) {
            console.warn('[ProgressModal] ⚠️ hideWithSuccess DÉJÀ APPELÉ, ignoré pour éviter double bascule');
            return;
        }
        this.#successHideCalled = true;
        
        // Ajouter indicateur de succès
        if (this.#modal) {
            this.#modal.dataset.success = 'true';
        }
        
        // Depuis v0.47 : toujours laisser la modale ouverte après succès.
        // L'utilisateur ferme manuellement et consulte les résultats quand il le souhaite.
        console.log('[ProgressModal] ✅ Extraction terminée — modale reste ouverte pour lecture.');

        // Mettre à jour le titre et le message final
        const titleEl = this.#modal?.querySelector('.modal__title');
        if (titleEl) {
            titleEl.textContent = '✅ Extraction terminée';
        }
        if (this.#message) {
            this.#message.textContent = 'Fermez cette fenêtre pour consulter les résultats.';
        }
    }
    
    /**
     * Crée un callback de progression compatible avec l'ExtractionController
     * Usage: extractionController.extract(params, progressModal.createCallback())
     * @returns {Function} Fonction callback
     */
    createCallback() {
        return (message, current, total) => {
            this.update(message, current, total);
        };
    }
}

// Exposition globale
if (typeof window !== 'undefined') {
    window.ProgressModal = ProgressModal;
}
