/**
 * Modale de détails — établissements, diplômes, dispositifs, options 2nde GT
 *
 * Structure visuelle unifiée (v0.50) :
 * ┌────────────────────────────────────────────────────────┐
 * │ [← Préc]  N / Total  [Suiv →]          [⭐]  [✕]    │  ← modal__header (toujours visible)
 * ├────────────────────────────────────────────────────────┤
 * │              Titre centré, gras, grand                 │  ← .detail-modal-title (dans body)
 * │ [sections accordéon …]                                 │
 * └────────────────────────────────────────────────────────┘
 *
 * - Navigation masquée si pas de liste (accès depuis carte ou lien)
 * - Étoile visible uniquement pour les établissements
 * - La croix est dans l'en-tête, pas dans le body (supprimée des builders)
 */

class DetailsModal extends Modal {
    #currentType  = null;   // 'etablissement' | 'diplome' | 'diplome_apprentissage' | 'dispositif' | 'option2ndeGT'
    #currentData  = null;
    #currentList  = null;   // Liste complète pour navigation
    #currentIndex = -1;     // Index courant

    /**
     * Pile statique des modales de détails empilées.
     * Corrige le bug v0.52 : fermer une modale enfant cassait les handlers
     * de la modale parent car window.currentDetailsModal était un singleton écrasé.
     * @type {DetailsModal[]}
     */
    static #detailsStack = [];

    /**
     * @param {string} modalId  - ID de base de la modale
     * @param {string|null} uniqueId - Suffixe unique (timestamp) pour instanciation dynamique
     */
    constructor(modalId, uniqueId = null) {
        const finalId = uniqueId ? `${modalId}-${uniqueId}` : modalId;
        super(finalId);
        this.baseModalId = modalId;
        this.isUnique    = !!uniqueId;
        console.log(`[DetailsModal] Instance créée: ${finalId}${this.isUnique ? ' (unique)' : ''}`);
    }

    /**
     * Surcharge de close() pour gérer la pile de modales empilées.
     * Retire cette modale de la pile et restaure le parent comme modale courante.
     * Corrige le bug v0.52 : après fermeture d'une modale enfant,
     * les handlers (croix, navigation) de la modale parent fonctionnent à nouveau.
     */
    close() {
        // Retirer de la pile de détails
        const idx = DetailsModal.#detailsStack.indexOf(this);
        if (idx > -1) {
            DetailsModal.#detailsStack.splice(idx, 1);
            console.log(`[DetailsModal] Dépilée. Pile restante: ${DetailsModal.#detailsStack.length}`);
        }

        // Restaurer le parent comme modale courante
        const parent = DetailsModal.#detailsStack.length > 0
            ? DetailsModal.#detailsStack[DetailsModal.#detailsStack.length - 1]
            : null;
        window.currentDetailsModal = parent;

        if (parent) {
            console.log(`[DetailsModal] Parent restauré: ${parent.modalId}`);
        } else {
            console.log(`[DetailsModal] Pile vide, currentDetailsModal = null`);
        }

        // Appeler Modal.close() (dépile ModalStack + détruit après 300ms)
        super.close();
    }

    // ─────────────────────────────────────────────────────────────────
    // API PUBLIQUE — showXxx()
    // ─────────────────────────────────────────────────────────────────

    /** @param {Object} etablissementEnrichi @param {Array} list @param {number} index */
    showEtablissement(etablissementEnrichi, list = null, index = -1) {
        this.#currentType  = 'etablissement';
        this.#currentData  = etablissementEnrichi;
        this.#currentList  = list;
        this.#currentIndex = index;

        const nom = etablissementEnrichi.etablissement.nom || 'Établissement';
        const id  = etablissementEnrichi.etablissement._id;
        if (!id) {
            console.warn('[DetailsModal] ⚠️ Établissement sans _id:', nom);
        }

        this.#renderModal({
            titre:     nom,
            hasFavori: true,
            favoriId:      id,
            favoriNom:     nom,
            favoriCommune: etablissementEnrichi.etablissement.commune || '',
            favoriType:    etablissementEnrichi.etablissement.type    || '',
            isFav:     typeof isEtablissementFavori === 'function' && isEtablissementFavori(id),
            content:   window.buildEtablissementDetailsHTML?.(etablissementEnrichi) ?? ''
        });

        DetailsModal.#detailsStack.push(this);
        window.currentDetailsModal = this;
        this.open();
        if (typeof window._detailsModalOpening !== 'undefined') window._detailsModalOpening = false;
        console.log(`[DetailsModal] Affichage établissement: ${nom}`, etablissementEnrichi);
    }

    /** @param {Object} diplomeEnrichi @param {Array} list @param {number} index */
    showDiplome(diplomeEnrichi, list = null, index = -1) {
        this.#currentType  = 'diplome';
        this.#currentData  = diplomeEnrichi;
        this.#currentList  = list;
        this.#currentIndex = index;

        const nom = diplomeEnrichi.diplome.libelle || 'Diplôme';
        const favId = `diplome__${nom}`;

        this.#renderModal({
            titre:      nom,
            hasFavori:  true,
            favoriId:   favId,
            favoriTitre: nom,
            favoriTypeObjet: 'diplome',
            isFav:      typeof window.isFavoriDivers === 'function' && window.isFavoriDivers(favId),
            content:    window.buildDiplomeDetailsHTML?.(diplomeEnrichi) ?? ''
        });

        DetailsModal.#detailsStack.push(this);
        window.currentDetailsModal = this;
        this.open();
        if (typeof window._detailsModalOpening !== 'undefined') window._detailsModalOpening = false;
        console.log(`[DetailsModal] Affichage diplôme: ${nom}`, diplomeEnrichi);
    }

    /** @param {Object} diplomeEnrichi @param {Array} list @param {number} index */
    showDiplomeApprentissage(diplomeEnrichi, list = null, index = -1) {
        this.#currentType  = 'diplome_apprentissage';
        this.#currentData  = diplomeEnrichi;
        this.#currentList  = list;
        this.#currentIndex = index;

        const nom = diplomeEnrichi.diplome.libelle || 'Diplôme apprentissage';
        const favId = `appr__${diplomeEnrichi.diplome.id || nom}`;

        this.#renderModal({
            titre:       nom,
            hasFavori:   true,
            favoriId:    favId,
            favoriTitre: nom,
            favoriTypeObjet: 'diplome_apprentissage',
            isFav:       typeof window.isFavoriDivers === 'function' && window.isFavoriDivers(favId),
            content:     window.buildDiplomeApprentissageDetailsHTML?.(diplomeEnrichi) ?? ''
        });

        DetailsModal.#detailsStack.push(this);
        window.currentDetailsModal = this;
        this.open();
        if (typeof window._detailsModalOpening !== 'undefined') window._detailsModalOpening = false;
        console.log(`[DetailsModal] Affichage diplôme appr.: ${nom}`, diplomeEnrichi);
    }

    /** @param {Object} dispositifEnrichi @param {Array} list @param {number} index */
    showDispositif(dispositifEnrichi, list = null, index = -1) {
        this.#currentType  = 'dispositif';
        this.#currentData  = dispositifEnrichi;
        this.#currentList  = list;
        this.#currentIndex = index;

        const nom = dispositifEnrichi.dispositif.libelle || 'Dispositif';
        const favId = `dispositif__${nom}`;

        this.#renderModal({
            titre:       nom,
            hasFavori:   true,
            favoriId:    favId,
            favoriTitre: nom,
            favoriTypeObjet: 'dispositif',
            isFav:       typeof window.isFavoriDivers === 'function' && window.isFavoriDivers(favId),
            content:     window.buildDispositifDetailsHTML?.(dispositifEnrichi) ?? ''
        });

        DetailsModal.#detailsStack.push(this);
        window.currentDetailsModal = this;
        this.open();
        if (typeof window._detailsModalOpening !== 'undefined') window._detailsModalOpening = false;
        console.log(`[DetailsModal] Affichage dispositif ${nom}`, dispositifEnrichi);
    }

    /** @param {Object} optionEnrichie @param {Array} list @param {number} index */
    showOption2ndeGT(optionEnrichie, list = null, index = -1) {
        this.#currentType  = 'option2ndeGT';
        this.#currentData  = optionEnrichie;
        this.#currentList  = list;
        this.#currentIndex = index;

        const nom = optionEnrichie.option?.libelle || 'Option 2nde GT';
        const favId = `option2nde__${nom}`;

        this.#renderModal({
            titre:       nom,
            hasFavori:   true,
            favoriId:    favId,
            favoriTitre: nom,
            favoriTypeObjet: 'option2ndeGT',
            isFav:       typeof window.isFavoriDivers === 'function' && window.isFavoriDivers(favId),
            content:     window.buildOption2ndeGTDetailsHTML?.(optionEnrichie) ?? ''
        });

        DetailsModal.#detailsStack.push(this);
        window.currentDetailsModal = this;
        this.open();
        if (typeof window._detailsModalOpening !== 'undefined') window._detailsModalOpening = false;
        console.log(`[DetailsModal] Affichage option 2nde GT ${nom}`, optionEnrichie);
    }

    // ─────────────────────────────────────────────────────────────────
    // RENDU UNIFIÉ
    // ─────────────────────────────────────────────────────────────────

    /**
     * Construit et injecte toute la structure de la modale.
     * Le modal__header natif devient la barre de navigation + actions.
     * Le titre et le contenu vont dans le modal__body.
     * @param {Object} opts
     * @param {string}  opts.titre
     * @param {string}  opts.content      - HTML des sections accordéon
     * @param {boolean} [opts.hasFavori]  - Afficher le bouton étoile
     * @param {string}  [opts.favoriId]
     * @param {string}  [opts.favoriNom]
     * @param {string}  [opts.favoriCommune]
     * @param {string}  [opts.favoriType]
     * @param {boolean} [opts.isFav]
     * @private
     */
    #renderModal(opts) {
        const {
            titre, content,
            hasFavori = false,
            // Pour établissements :
            favoriId = '', favoriNom = '', favoriCommune = '', favoriType = '',
            // Pour autres types (diplômes, dispositifs, options) :
            favoriTitre = '', favoriTypeObjet = '',
            isFav = false
        } = opts;

        // ── Header : navigation + étoile + croix ─────────────────────
        const hasNav = this.#currentList && this.#currentList.length > 0 && this.#currentIndex >= 0;
        const hasPrev = hasNav && this.#currentIndex > 0;
        const hasNext = hasNav && this.#currentIndex < this.#currentList.length - 1;

        const navHtml = hasNav ? `
            <button class="detail-nav-btn detail-nav-btn--prev"
                    onclick="window.currentDetailsModal?.navigateToPrevious()"
                    ${hasPrev ? '' : 'disabled'}
                    aria-label="Précédent">
                ‹ Préc
            </button>
            <span class="detail-nav-counter">${this.#currentIndex + 1} / ${this.#currentList.length}</span>
            <button class="detail-nav-btn detail-nav-btn--next"
                    onclick="window.currentDetailsModal?.navigateToNext()"
                    ${hasNext ? '' : 'disabled'}
                    aria-label="Suivant">
                Suiv ›
            </button>` : `<span class="detail-nav-spacer"></span>`;

        // Étoile favori — deux handlers selon le type d'objet
        const isEtab = !!favoriNom; // seuls les établissements passent favoriNom
        const starHtml = hasFavori ? `
            <button id="btn-favori-${favoriId}"
                    class="detail-header-action detail-header-action--star${isFav ? ' detail-header-action--star-active' : ''}"
                    data-favori-id="${favoriId}"
                    data-favori-nom="${(favoriNom || favoriTitre).replace(/"/g, '&quot;')}"
                    data-favori-commune="${favoriCommune.replace(/"/g, '&quot;')}"
                    data-favori-type="${favoriType.replace(/"/g, '&quot;')}"
                    data-favori-type-objet="${favoriTypeObjet}"
                    onclick="${isEtab ? 'toggleEtablissementFavoriFromBtn(this)' : 'toggleFavoriDiversFromBtn(this)'}"
                    title="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}"
                    aria-label="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                ${isFav ? '⭐' : '☆'}
            </button>` : '';

        const headerHTML = `
            <div class="detail-header-bar">
                <div class="detail-header-bar__nav">${navHtml}</div>
                <div class="detail-header-bar__actions">
                    ${starHtml}
                    <button class="detail-header-action detail-header-action--close"
                            onclick="window.currentDetailsModal?.close()"
                            aria-label="Fermer">✕</button>
                </div>
            </div>`;

        // ── Body : titre centré + contenu (sans l'en-tête des builders) ──
        // Les builders génèrent parfois un .detail-modal-header avec le nom.
        // On le supprime car le titre est maintenant ici.
        const cleanContent = content
            .replace(/<div class="detail-modal-header">[\s\S]*?<\/div>\s*/, '')
            .trim();

        const bodyHTML = `
            <h2 class="detail-modal-title">${titre}</h2>
            ${cleanContent}`;

        // Injection : setTitle vide (le titre est dans le body), header custom
        this.setTitle('');
        this.#injectCustomHeader(headerHTML);
        this.setContent(bodyHTML);
    }

    /**
     * Remplace le contenu du modal__header par un HTML personnalisé.
     * Cache le titre natif et cache le bouton de fermeture natif.
     * @param {string} html
     * @private
     */
    #injectCustomHeader(html) {
        const el = document.getElementById(this.modalId);
        if (!el) return;
        const header = el.querySelector('.modal__header');
        if (!header) return;
        // Remplacer entièrement le header
        header.innerHTML = html;
    }

    // ─────────────────────────────────────────────────────────────────
    // NAVIGATION
    // ─────────────────────────────────────────────────────────────────

    /** Navigue vers l'item précédent dans la liste */
    async navigateToPrevious() {
        if (!this.#currentList || this.#currentIndex <= 0) return;
        await this.#loadItemAtIndex(this.#currentIndex - 1);
    }

    /** Navigue vers l'item suivant dans la liste */
    async navigateToNext() {
        if (!this.#currentList || this.#currentIndex >= this.#currentList.length - 1) return;
        await this.#loadItemAtIndex(this.#currentIndex + 1);
    }

    /**
     * Charge et affiche l'item à l'index donné dans la liste courante.
     * @param {number} newIndex
     * @private
     */
    async #loadItemAtIndex(newIndex) {
        const item = this.#currentList[newIndex];
        if (!item) return;
        try {
            let enriched = null;
            if (this.#currentType === 'etablissement') {
                enriched = await window.databaseService.getEtablissementEnrichi(item._id);
                if (enriched) this.showEtablissement(enriched, this.#currentList, newIndex);
            } else if (this.#currentType === 'diplome') {
                enriched = await window.databaseService.getDiplomeEnrichi(item.libelle);
                if (enriched) this.showDiplome(enriched, this.#currentList, newIndex);
            } else if (this.#currentType === 'diplome_apprentissage') {
                enriched = await window.databaseService.getDiplomeApprentissageEnrichi(item.id);
                if (enriched) this.showDiplomeApprentissage(enriched, this.#currentList, newIndex);
            } else if (this.#currentType === 'dispositif') {
                enriched = await window.databaseService.getDispositifEnrichi(item.libelle);
                if (enriched) this.showDispositif(enriched, this.#currentList, newIndex);
            } else if (this.#currentType === 'option2ndeGT') {
                enriched = await window.databaseService.getOption2ndeGTEnrichie(item.libelle);
                if (enriched) this.showOption2ndeGT(enriched, this.#currentList, newIndex);
            }
            if (!enriched) console.error(`[DetailsModal] Item introuvable à l'index ${newIndex}`);
        } catch (err) {
            console.error(`[DetailsModal] Erreur navigation index ${newIndex}:`, err);
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// FONCTIONS GLOBALES — ouverture depuis lien dans une autre modale
// ─────────────────────────────────────────────────────────────────

window.openEtablissementDetailsFromModal = async function(etabId) {
    try {
        // Recherche par _id interne uniquement (v0.58+)
        const enriched = await window.databaseService.getEtablissementEnrichi(etabId);
        if (!enriched) {
            console.warn(`[openEtablissementDetailsFromModal] Établissement non trouvé: ${etabId}`);
            return;
        }
        new DetailsModal('etablissement-details-modal').showEtablissement(enriched);
    } catch (err) { console.error('[openEtablissementDetailsFromModal]', err); }
};

window.openDiplomeDetailsFromModal = async function(libelle) {
    try {
        const enriched = await window.databaseService.getDiplomeEnrichi(libelle);
        if (!enriched) return;
        new DetailsModal('diplome-details-modal').showDiplome(enriched);
    } catch (err) { console.error('[openDiplomeDetailsFromModal]', err); }
};

window.openDispositifDetailsFromModal = async function(libelle) {
    try {
        const enriched = await window.databaseService.getDispositifEnrichi(libelle);
        if (!enriched) return;
        new DetailsModal('dispositif-details-modal').showDispositif(enriched);
    } catch (err) { console.error('[openDispositifDetailsFromModal]', err); }
};

window.openDiplomeApprentissageDetailsFromModal = async function(id) {
    try {
        const enriched = await window.databaseService.getDiplomeApprentissageEnrichi(id);
        if (!enriched) return;
        new DetailsModal('diplome-details-modal').showDiplomeApprentissage(enriched);
    } catch (err) { console.error('[openDiplomeApprentissageDetailsFromModal]', err); }
};

window.DetailsModal = DetailsModal;
