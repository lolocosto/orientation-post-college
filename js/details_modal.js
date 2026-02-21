/**
 * Modale de détails pour afficher établissements, diplômes, dispositifs
 * Supporte les liens cliquables entre modales pour navigation
 */

class DetailsModal extends Modal {
    #currentType = null;  // 'etablissement', 'diplome', 'dispositif'
    #currentData = null;
    #currentList = null;  // Liste complète des items (pour navigation)
    #currentIndex = -1;   // Index actuel dans la liste
    
    /**
     * @param {string} modalId - ID de la modale
     */
    constructor(modalId, uniqueId = null) {
        // Si uniqueId fourni, créer une nouvelle instance avec ID unique
        const finalId = uniqueId ? `${modalId}-${uniqueId}` : modalId;
        super(finalId);
        this.baseModalId = modalId;
        this.isUnique = !!uniqueId;
        console.log(`[DetailsModal] Instance créée: ${finalId}${this.isUnique ? ' (unique)' : ''}`);
    }
    
    /**
     * Affiche les détails d'un établissement
     * @param {Object} etablissementEnrichi
     * @param {Array} list - Liste complète des items pour navigation (optionnel)
     * @param {number} index - Index actuel dans la liste (optionnel)
     */
    showEtablissement(etablissementEnrichi, list = null, index = -1) {
        this.#currentType = 'etablissement';
        this.#currentData = etablissementEnrichi;
        this.#currentList = list;
        this.#currentIndex = index;
        
        this.setTitle(etablissementEnrichi.etablissement.nom || 'Établissement');
        
        // Construire le contenu avec boutons de navigation
        const content = this.#buildEtablissementHTML(etablissementEnrichi);
        const navButtons = this.#buildNavigationButtons();
        this.setContent(navButtons + content);
        
        // Stocker la référence globale pour les boutons onclick
        window.currentDetailsModal = this;
        
        this.open();
        
        console.log(`[DetailsModal] Affichage établissement: ${etablissementEnrichi.etablissement.nom}`,etablissementEnrichi);
    }
    
    /**
     * Affiche les détails d'un diplôme
     * @param {Object} diplomeEnrichi
     * @param {Array} list - Liste complète des items pour navigation (optionnel)
     * @param {number} index - Index actuel dans la liste (optionnel)
     */
    showDiplome(diplomeEnrichi, list = null, index = -1) {
        this.#currentType = 'diplome';
        this.#currentData = diplomeEnrichi;
        this.#currentList = list;
        this.#currentIndex = index;
        
        this.setTitle(diplomeEnrichi.diplome.libelle || 'Diplôme');
        
        // Construire le contenu avec boutons de navigation
        const content = this.#buildDiplomeHTML(diplomeEnrichi);
        const navButtons = this.#buildNavigationButtons();
        this.setContent(navButtons + content);
        
        // Stocker la référence globale pour les boutons onclick
        window.currentDetailsModal = this;
        
        this.open();
        
        console.log(`[DetailsModal] Affichage diplôme: ${diplomeEnrichi.diplome.libelle}`, diplomeEnrichi);
    }
    
    /**
     * Affiche les détails d'un dispositif
     * @param {Object} dispositifEnrichi
     * @param {Array} list - Liste complète des items pour navigation (optionnel)
     * @param {number} index - Index actuel dans la liste (optionnel)
     */
    showDispositif(dispositifEnrichi, list = null, index = -1) {
        this.#currentType = 'dispositif';
        this.#currentData = dispositifEnrichi;
        this.#currentList = list;
        this.#currentIndex = index;
        
        this.setTitle(dispositifEnrichi.dispositif.libelle || 'Dispositif');
        
        // Construire le contenu avec boutons de navigation
        const content = this.#buildDispositifHTML(dispositifEnrichi);
        const navButtons = this.#buildNavigationButtons();
        this.setContent(navButtons + content);
        
        // Stocker la référence globale pour les boutons onclick
        window.currentDetailsModal = this;
        
        this.open();
        
        console.log(`[DetailsModal] Affichage dispositif ${dispositifEnrichi.dispositif.libelle}`, dispositifEnrichi);
    }

    /**
     * Affiche les détails d'un diplôme apprentissage (CARIF-OREF)
     * @param {Object} diplomeEnrichi - { diplome, etablissements }
     * @param {Array}  list  - Liste complète pour navigation (optionnel)
     * @param {number} index - Index courant (optionnel)
     */
    showDiplomeApprentissage(diplomeEnrichi, list = null, index = -1) {
        this.#currentType  = 'diplome_apprentissage';
        this.#currentData  = diplomeEnrichi;
        this.#currentList  = list;
        this.#currentIndex = index;

        this.setTitle(`🎓 ${diplomeEnrichi.diplome.libelle || 'Diplôme apprentissage'}`);

        const content    = this.#buildDiplomeApprentissageHTML(diplomeEnrichi);
        const navButtons = this.#buildNavigationButtons();
        this.setContent(navButtons + content);

        window.currentDetailsModal = this;
        this.open();

        console.log(`[DetailsModal] Affichage diplôme appr.: ${diplomeEnrichi.diplome.libelle}`, diplomeEnrichi);
    }
    
    /**
     * Construit les boutons de navigation précédent/suivant
     * @returns {string} HTML des boutons
     * @private
     */
    #buildNavigationButtons() {
        if (!this.#currentList || this.#currentIndex < 0) {
            return ''; // Pas de navigation
        }
        
        const hasPrev = this.#currentIndex > 0;
        const hasNext = this.#currentIndex < this.#currentList.length - 1;
        
        return `
            <div class="modal-navigation" style="display: flex; justify-content: space-between; margin-bottom: 20px; padding: 10px; background: #f5f7fa; border-radius: 8px;">
                <button 
                    class="btn btn--secondary" 
                    onclick="window.currentDetailsModal?.navigateToPrevious()"
                    ${!hasPrev ? 'disabled' : ''}
                    style="opacity: ${hasPrev ? '1' : '0.5'}; cursor: ${hasPrev ? 'pointer' : 'not-allowed'};">
                    ⬅️ Précédent
                </button>
                <span style="align-self: center; color: #666; font-size: 14px;">
                    ${this.#currentIndex + 1} / ${this.#currentList.length}
                </span>
                <button 
                    class="btn btn--secondary" 
                    onclick="window.currentDetailsModal?.navigateToNext()"
                    ${!hasNext ? 'disabled' : ''}
                    style="opacity: ${hasNext ? '1' : '0.5'}; cursor: ${hasNext ? 'pointer' : 'not-allowed'};">
                    Suivant ➡️
                </button>
            </div>
        `;
    }
    
    /**
     * Navigue vers l'item précédent
     */
    async navigateToPrevious() {
        if (!this.#currentList || this.#currentIndex <= 0) return;
        
        const newIndex = this.#currentIndex - 1;
        await this.#loadItemAtIndex(newIndex);
    }
    
    /**
     * Navigue vers l'item suivant
     */
    async navigateToNext() {
        if (!this.#currentList || this.#currentIndex >= this.#currentList.length - 1) return;
        
        const newIndex = this.#currentIndex + 1;
        await this.#loadItemAtIndex(newIndex);
    }
    
    /**
     * Charge et affiche l'item à l'index donné
     * @param {number} index
     * @private
     */
    async #loadItemAtIndex(index) {
        const item = this.#currentList[index];
        if (!item) return;
        
        try {
            // Charger les données enrichies selon le type
            let enriched = null;
            
            if (this.#currentType === 'etablissement') {
                enriched = await window.databaseService.getEtablissementEnrichi(item._id || item.uai);
                if (enriched) this.showEtablissement(enriched, this.#currentList, index);
            } else if (this.#currentType === 'diplome') {
                enriched = await window.databaseService.getDiplomeEnrichi(item.libelle);
                if (enriched) this.showDiplome(enriched, this.#currentList, index);
            } else if (this.#currentType === 'diplome_apprentissage') {
                enriched = await window.databaseService.getDiplomeApprentissageEnrichi(item.id);
                if (enriched) this.showDiplomeApprentissage(enriched, this.#currentList, index);
            } else if (this.#currentType === 'dispositif') {
                enriched = await window.databaseService.getDispositifEnrichi(item.libelle);
                if (enriched) this.showDispositif(enriched, this.#currentList, index);
            } else if (this.#currentType === 'option2ndeGT') {
                enriched = await window.databaseService.getOption2ndeGTEnrichie(item.libelle);
                if (enriched) this.showOption2ndeGT(enriched, this.#currentList, index);
            }
            
            if (!enriched) {
                console.error(`[DetailsModal] Impossible de charger l'item à l'index ${index}`);
            }
        } catch (error) {
            console.error(`[DetailsModal] Erreur chargement item ${index}:`, error);
        }
    }
    
    /**
     * Crée un élément modal unique dans le DOM
     * @private
     */
    #createUniqueModalElement() {
        // Cloner la modal de base
        const baseModal = document.getElementById(this.baseModalId);
        if (!baseModal) {
            console.error(`[DetailsModal] Modal de base non trouvée: ${this.baseModalId}`);
            return;
        }
        
        const clone = baseModal.cloneNode(true);
        clone.id = this.modalId;
        
        // Mettre à jour les IDs des enfants
        const header = clone.querySelector('.modal-header h2');
        if (header) header.id = `${this.modalId}-header`;
        
        const body = clone.querySelector('.modal-body');
        if (body) body.id = `${this.modalId}-body`;
        
        // Insérer après la modal de base
        baseModal.parentNode.insertBefore(clone, baseModal.nextSibling);
        
        console.log(`[DetailsModal] Élément modal unique créé: ${this.modalId}`);
    }

        /**
     * Construit le HTML pour un établissement
     * Utilise la fonction buildEtablissementDetailsHTML de gestion_onglet_resultats.js
     * @param {Object} etab
     * @returns {string}
     * @private
     */
    #buildEtablissementHTML(etablissementEnrichi) {
        // Utiliser la fonction existante qui gère tout (diplômes groupés, etc.)
        if (typeof window.buildEtablissementDetailsHTML === 'function') {
            return window.buildEtablissementDetailsHTML(etablissementEnrichi);
        }
        
        // Fallback simple si la fonction n'existe pas
        return `
            <div class="detail-section">
                <h3>Informations générales</h3>
                <p><strong>Type :</strong> ${etablissementEnrichi.etablissement.type || 'Non renseigné'}</p>
                <p><strong>Statut :</strong> ${etablissementEnrichi.etablissement.statut || 'Non renseigné'}</p>
            </div>
            ${etablissementEnrichi.diplomes && etablissementEnrichi.diplomes.length > 0 ? `
                <div class="detail-section u-mt-4">
                    <h3>Diplômes proposés (${etablissementEnrichi.diplomes.length})</h3>
                    <ul>
                        ${etablissementEnrichi.diplomes.map(d => `<li>${d.libelle}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
    }
    
    /**
     * Construit le HTML pour un diplôme
     * Utilise la fonction buildDiplomeDetailsHTML de gestion_onglet_resultats.js
     * @param {Object} diplomeEnrichi
     * @returns {string}
     * @private
     */
    #buildDiplomeHTML(diplomeEnrichi) {
        // Utiliser la fonction existante si disponible
        if (typeof window.buildDiplomeDetailsHTML === 'function') {
            return window.buildDiplomeDetailsHTML(diplomeEnrichi);
        }
        
        // Fallback simple
        return `
            <div class="detail-section">
                <h3>Informations</h3>
                <p><strong>Niveau :</strong> ${diplomeEnrichi.diplome.niveau || 'Non renseigné'}</p>
            </div>
            ${diplomeEnrichi.etablissements && diplomeEnrichi.etablissements.length > 0 ? `
                <div class="detail-section u-mt-4">
                    <h3>Proposé par (${diplomeEnrichi.etablissements.length})</h3>
                    <ul>
                        ${diplomeEnrichi.etablissements.slice(0, 10).map(e => `
                            <li><a href="#" onclick="event.preventDefault(); window.openEtablissementDetailsFromModal('${e._id}')">${e.nom}</a></li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
    }
    
    /**
     * Construit le HTML pour un diplôme apprentissage
     * Délègue à window.buildDiplomeApprentissageDetailsHTML()
     * @param {Object} diplomeEnrichi
     * @returns {string}
     * @private
     */
    #buildDiplomeApprentissageHTML(diplomeEnrichi) {
        if (typeof window.buildDiplomeApprentissageDetailsHTML === 'function') {
            return window.buildDiplomeApprentissageDetailsHTML(diplomeEnrichi);
        }
        // Fallback minimal
        const { diplome, etablissements } = diplomeEnrichi;
        return `
            <div class="detail-section">
                <h3>Informations</h3>
                <p><strong>Type :</strong> ${diplome.typeDiplome || '—'}</p>
                <p><strong>Niveau :</strong> ${diplome.niveau || '—'}</p>
                ${diplome.rncpCode ? `<p><strong>RNCP :</strong> ${diplome.rncpCode}</p>` : ''}
            </div>
            ${etablissements?.length ? `
                <div class="detail-section">
                    <h3>Centres de formation (${etablissements.length})</h3>
                    <ul>${etablissements.map(e => `<li><a href="#" onclick="event.preventDefault();window.openEtablissementDetailsFromModal('${e._id}')">${e.nom || e.uai}</a></li>`).join('')}</ul>
                </div>` : ''}`;
    }

    /**
     * Construit le HTML pour un dispositif
     * Utilise la fonction buildDispositifDetailsHTML de gestion_onglet_resultats.js
     * @param {Object} dispositifEnrichi
     * @returns {string}
     * @private
     */
    #buildDispositifHTML(dispositifEnrichi) {
        // Utiliser la fonction existante si disponible
        if (typeof window.buildDispositifDetailsHTML === 'function') {
            return window.buildDispositifDetailsHTML(dispositifEnrichi);
        }
        
        // Fallback simple
        return `
            <div class="detail-section">
                <h3>Informations</h3>
                <p>${dispositifEnrichi.dispositif.libelle}</p>
            </div>
            ${dispositifEnrichi.etablissements && dispositifEnrichi.etablissements.length > 0 ? `
                <div class="detail-section u-mt-4">
                    <h3>Proposé par (${dispositifEnrichi.etablissements.length})</h3>
                    <ul>
                        ${dispositifEnrichi.etablissements.slice(0, 10).map(e => `
                            <li><a href="#" onclick="event.preventDefault(); window.openEtablissementDetailsFromModal('${e._id}')">${e.nom}</a></li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
    }

    // ─────────────────────────────────────────
    // OPTIONS 2NDE GT
    // ─────────────────────────────────────────

    /**
     * Affiche les détails d'une option 2nde GT
     * Suit le même pattern que showDispositif() et showDiplome()
     * @param {Object} optionEnrichie - {option: Object, etablissements: Array}
     * @param {Array} list - Liste complète des items pour navigation (optionnel)
     * @param {number} index - Index actuel dans la liste (optionnel)
     */
    showOption2ndeGT(optionEnrichie, list = null, index = -1) {
        this.#currentType = 'option2ndeGT';
        this.#currentData = optionEnrichie;
        this.#currentList = list;
        this.#currentIndex = index;

        this.setTitle(optionEnrichie.option.libelle || 'Option 2nde GT');

        // Construire le contenu avec boutons de navigation (même pattern que showDispositif)
        const content = this.#buildOption2ndeGTHTML(optionEnrichie);
        const navButtons = this.#buildNavigationButtons();
        this.setContent(navButtons + content);

        // Stocker la référence globale pour les boutons onclick
        window.currentDetailsModal = this;

        this.open();

        console.log(`[DetailsModal] Affichage option 2nde GT ${optionEnrichie.option.libelle}`, optionEnrichie);
    }

    /**
     * Construit le HTML pour les détails d'une option 2nde GT
     * Délègue à window.buildOption2ndeGTDetailsHTML() défini dans gestion_onglet_resultats.js
     * (même pattern que #buildDispositifHTML → window.buildDispositifDetailsHTML)
     * @param {Object} optionEnrichie
     * @returns {string} HTML
     * @private
     */
    #buildOption2ndeGTHTML(optionEnrichie) {
        return window.buildOption2ndeGTDetailsHTML(optionEnrichie);
    }
}

// Fonctions globales pour ouvrir modales depuis liens
// Ces fonctions sont appelées par les onclick dans le HTML généré

/**
 * Ouvre une modale de détails établissement depuis un lien dans une autre modale
 * @param {string} uai
 */
window.openEtablissementDetailsFromModal = async function(uai) {
    console.log(`[openEtablissementDetailsFromModal] Ouverture établissement depuis lien: ${uai}`);
    
    try {
        // Récupérer l'établissement enrichi (diplômes, dispositifs, options et spécialités)
        const etablissementEnrichi = await window.databaseService.getEtablissementEnrichi(uai);
        if (!etablissementEnrichi) {
            console.error(`[openEtablissementDetailsFromModal] Établissement non trouvé: ${uai}`);
            return;
        }
        console.log(`[openEtablissementDetailsFromModal] Établissement enrichi:`, etablissementEnrichi);

        // Créer une nouvelle modale (elle s'empilera au-dessus)
        const modal = new DetailsModal('etablissement-details-modal');
        modal.showEtablissement(etablissementEnrichi);
    } catch (error) {
        console.error(`[openEtablissementDetailsFromModal] Erreur ouverture établissement:`, error);
    }
};

/**
 * Ouvre une modale de détails diplôme depuis un lien dans une autre modale
 * @param {string} libelle
 */
window.openDiplomeDetailsFromModal = async function(libelle) {
    console.log(`[openDiplomeDetailsFromModal] Ouverture diplôme depuis lien: ${libelle}`);
    
    try {
        // Récupérer le diplôme et les établissements proposant ce diplôme
        const diplomeEnrichi = await window.databaseService.getDiplomeEnrichi(libelle);
        if (!diplomeEnrichi) {
            console.error(`[openDiplomeDetailsFromModal] Diplôme non trouvé: ${libelle}`);
            return;
        }
        console.log(`[openDiplomeDetailsFromModal] Diplôme enrichi:`, diplomeEnrichi);
              
        // Créer une nouvelle modale
        const modal = new DetailsModal('diplome-details-modal');
        modal.showDiplome(diplomeEnrichi);
    } catch (error) {
        console.error(`[openDiplomeDetailsFromModal] Erreur ouverture diplôme:`, error);
    }
};

/**
 * Ouvre une modale de détails dispositif depuis un lien dans une autre modale
 * @param {string} libelle
 */
window.openDispositifDetailsFromModal = async function(libelle) {
    console.log(`[DetailsModal] Ouverture dispositif depuis lien: ${libelle}`);
    
    try {
        // Récupérer le dispositif et les établissements proposant ce dispositif
        const dispositifEnrichi = await window.databaseService.getDispositifEnrichi(libelle);
        if (!dispositifEnrichi) {
            console.error(`[openDispositifDetailsFromModal] Dispositif non trouvé: ${libelle}`);
            return;
        }
        console.log(`[openDispositifDetailsFromModal] Dispositif enrichi:`, dispositifEnrichi);
        
        // Créer une nouvelle modale
        const modal = new DetailsModal('dispositif-details-modal');
        modal.showDispositif(dispositifEnrichi);
    } catch (error) {
        console.error(`[DetailsModal] Erreur ouverture dispositif:`, error);
    }
};

/**
 * Ouvre une modale de détails diplôme apprentissage depuis un lien dans une autre modale
 * @param {string} id - RNCP code ou libellé normalisé
 */
window.openDiplomeApprentissageDetailsFromModal = async function(id) {
    console.log(`[openDiplomeApprentissageDetailsFromModal] Ouverture diplôme appr. depuis lien: ${id}`);
    try {
        const diplomeEnrichi = await window.databaseService.getDiplomeApprentissageEnrichi(id);
        if (!diplomeEnrichi) {
            console.error(`[openDiplomeApprentissageDetailsFromModal] Diplôme non trouvé: ${id}`);
            return;
        }
        const modal = new DetailsModal('diplome-details-modal');
        modal.showDiplomeApprentissage(diplomeEnrichi);
    } catch (error) {
        console.error(`[openDiplomeApprentissageDetailsFromModal] Erreur:`, error);
    }
};

// Exposition globale
if (typeof window !== 'undefined') {
    window.DetailsModal = DetailsModal;
}
