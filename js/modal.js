/**
 * Système unifié de modales v0.23
 * Gestion de modales empilables avec z-index automatique
 */

/**
 * Pile globale de modales pour gérer l'empilement
 */
class ModalStack {
    static #stack = [];
    static #baseZIndex = 1040;
    
    /**
     * Ajoute une modale à la pile
     * @param {Modal} modal
     */
    static push(modal) {
        this.#stack.push(modal);
        this.#updateZIndexes();
        console.log(`[ModalStack] Modale ajoutée. Pile: ${this.#stack.length}`);
    }
    
    /**
     * Retire une modale de la pile
     * @param {Modal} modal
     */
    static pop(modal) {
        const index = this.#stack.indexOf(modal);
        if (index > -1) {
            this.#stack.splice(index, 1);
            this.#updateZIndexes();
            console.log(`[ModalStack] Modale retirée. Pile: ${this.#stack.length}`);
        }
    }
    
    /**
     * Retire une modale de la pile par son ID
     * @param {string} modalId
     */
    static removeById(modalId) {
        const index = this.#stack.findIndex(m => m.modalId === modalId);
        if (index > -1) {
            this.#stack.splice(index, 1);
            this.#updateZIndexes();
            console.log(`[ModalStack] Modale retirée (ID: ${modalId}). Pile: ${this.#stack.length}`);
        }
    }
    
    /**
     * Vérifie si une modale est au sommet de la pile
     * @param {Modal} modal
     * @returns {boolean}
     */
    static isTop(modal) {
        return this.#stack.length > 0 && this.#stack[this.#stack.length - 1] === modal;
    }
    
    /**
     * Met à jour les z-index de toutes les modales
     * @private
     */
    static #updateZIndexes() {
        this.#stack.forEach((modal, index) => {
            const zIndex = this.#baseZIndex + (index * 10);
            modal.setZIndex(zIndex);
        });
    }
    
    /**
     * Ferme toutes les modales
     */
    static closeAll() {
        console.log(`[ModalStack] Fermeture de ${this.#stack.length} modale(s)`);
        // Copier le tableau car close() modifie la pile
        const modals = [...this.#stack];
        modals.forEach(modal => modal.close());
    }
    
    /**
     * Retourne le nombre de modales ouvertes
     * @returns {number}
     */
    static get count() {
        return this.#stack.length;
    }
}

/**
 * Classe de base pour toutes les modales
 */
class Modal {
    #id;
    #element;
    #header;
    #title;
    #body;
    #footer;
    #closeBtn;
    #isOpen = false;
    #escapeHandler;
    #backdropHandler;
    
    /**
     * @param {string} modalId - ID unique pour la modale (sera créé dynamiquement)
     */
    constructor(modalId) {
        this.#id = modalId;
        
        // Créer la structure HTML de la modale dynamiquement
        this.#createElement();
        
        // Récupérer les éléments enfants (qui viennent d'être créés)
        this.#header = this.#element.querySelector('.modal__header');
        this.#title = this.#element.querySelector('.modal__title');
        this.#body = this.#element.querySelector('.modal__body');
        this.#footer = this.#element.querySelector('.modal__footer');
        this.#closeBtn = this.#element.querySelector('.modal__close');
        
        this.#setupEventListeners();
        
        console.log(`[Modal] Instance créée dynamiquement: ${modalId}`);
    }
    
    /**
     * Crée l'élément DOM de la modale et l'ajoute au body
     * @private
     */
    #createElement() {
        // Créer la structure complète
        const modalHTML = `
            <div id="${this.#id}" class="modal">
                <div class="modal__dialog">
                    <div class="modal__content">
                        <div class="modal__header">
                            <h2 class="modal__title">Titre</h2>
                            <button class="modal__close" aria-label="Fermer">&times;</button>
                        </div>
                        <div class="modal__body">
                            <!-- Contenu inséré dynamiquement -->
                        </div>
                        <div class="modal__footer">
                            <!-- Pied de page optionnel -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Créer un conteneur temporaire pour parser le HTML
        const temp = document.createElement('div');
        temp.innerHTML = modalHTML;
        
        // Récupérer l'élément modale
        this.#element = temp.firstElementChild;
        
        // Ajouter au body
        document.body.appendChild(this.#element);
    }
    
    /**
     * Configure les gestionnaires d'événements
     * @private
     */
    #setupEventListeners() {
        // Clic sur croix de fermeture
        if (this.#closeBtn) {
            this.#closeBtn.addEventListener('click', () => {
                console.log(`[Modal] Fermeture via croix: ${this.#id}`);
                this.close();
            });
        }
        
        // Gestionnaire Escape (ajouté dynamiquement)
        this.#escapeHandler = (e) => {
            if (e.key === 'Escape' && ModalStack.isTop(this)) {
                console.log(`[Modal] Fermeture via Escape: ${this.#id}`);
                this.close();
            }
        };
        
        // Gestionnaire clic backdrop (ajouté dynamiquement)
        this.#backdropHandler = (e) => {
            if (e.target === this.#element && ModalStack.isTop(this)) {
                console.log(`[Modal] Fermeture via backdrop: ${this.#id}`);
                this.close();
            }
        };
    }
    
    /**
     * Ouvre la modale
     */
    open() {
        if (!this.#element || this.#isOpen) return;
        
        this.#element.classList.add('modal--active');
        this.#isOpen = true;
        
        // Ajouter à la pile
        ModalStack.push(this);
        
        // Activer les gestionnaires
        document.addEventListener('keydown', this.#escapeHandler);
        this.#element.addEventListener('click', this.#backdropHandler);
        
        console.log(`[Modal] Ouverte: ${this.#id}`);
        console.log(`[Modal] Element:`, this.#element);
        console.log(`[Modal] Classes:`, this.#element.className);
        console.log(`[Modal] Display:`, window.getComputedStyle(this.#element).display);
    }
    
    /**
     * Ferme la modale
     */
    close() {
        if (!this.#element || !this.#isOpen) return;
        
        this.#element.classList.remove('modal--active');
        this.#isOpen = false;
        
        // Retirer de la pile
        ModalStack.pop(this);
        
        // Désactiver les gestionnaires
        document.removeEventListener('keydown', this.#escapeHandler);
        this.#element.removeEventListener('click', this.#backdropHandler);
        
        console.log(`[Modal] Fermée: ${this.#id}`);
        
        // Détruire la modale après un délai pour l'animation
        setTimeout(() => this.destroy(), 300);
    }
    
    /**
     * Détruit la modale et la retire du DOM
     */
    destroy() {
        if (this.#element && this.#element.parentNode) {
            this.#element.parentNode.removeChild(this.#element);
            console.log(`[Modal] Détruite: ${this.#id}`);
        }
        this.#element = null;
    }
    
    /**
     * Définit le titre de la modale
     * @param {string} title
     */
    setTitle(title) {
        if (this.#title) {
            this.#title.textContent = title;
        }
    }
    
    /**
     * Définit le contenu du body
     * @param {string} html
     */
    setContent(html) {
        if (this.#body) {
            this.#body.innerHTML = html;
        }
    }
    
    /**
     * Définit le z-index de la modale
     * @param {number} zIndex
     * @internal Utilisé par ModalStack
     */
    setZIndex(zIndex) {
        if (this.#element) {
            this.#element.style.zIndex = zIndex;
        }
    }
    
    /**
     * Retourne l'élément DOM
     * @returns {HTMLElement}
     */
    get element() {
        return this.#element;
    }
    
    /**
     * Retourne si la modale est ouverte
     * @returns {boolean}
     */
    get isOpen() {
        return this.#isOpen;
    }
    
    /**
     * Retourne l'ID de la modale
     * @returns {string}
     */
    get modalId() {
        return this.#id;
    }
    
    /**
     * Retourne l'élément body de la modale
     * @returns {HTMLElement}
     */
    getBodyElement() {
        return this.#body;
    }
}

// Exposition globale
if (typeof window !== 'undefined') {
    window.Modal = Modal;
    window.ModalStack = ModalStack;
}
