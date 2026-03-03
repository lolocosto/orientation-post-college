/**
 * @file mode_choice_modal.js
 * @description Modale de choix du mode d'utilisation (connecté / déconnecté).
 *
 * Affichée au lancement de l'application (après le tour guidé le cas échéant),
 * cette modale guide l'utilisateur vers l'un des deux modes :
 *   - Mode connecté  : extraire ses propres données avec un compte Onisep
 *   - Mode déconnecté : explorer des données déjà extraites (jeux de données)
 *
 * 3 écrans internes :
 *   1. Choix du mode (2 cartes)
 *   2. Résumé des données en base (si mode déconnecté + base non vide)
 *   3. Chargement d'un jeu de données (si base vide ou refus)
 *
 * Hérite de Modal (modal.js) pour le comportement d'ouverture/fermeture,
 * mais désactive la fermeture par Escape / backdrop / croix sur l'écran 1.
 *
 * @module ModeChoiceModal
 * @requires Modal
 * @requires DatabaseService
 * @requires DatasetService
 * @author Laurent COSTE / Claude
 * @version 0.62
 */

'use strict';

// ══════════════════════════════════════════════════════════
// CONSTANTES
// ══════════════════════════════════════════════════════════

/** @constant {string} Clé localStorage du dernier mode choisi */
const MODE_CHOICE_KEY = 'mode_choice_done';

/** @constant {string} Clé localStorage pour ne plus afficher la modale */
const MODE_CHOICE_SKIP_KEY = 'mode_choice_skip';

// ══════════════════════════════════════════════════════════
// CLASSE
// ══════════════════════════════════════════════════════════

class ModeChoiceModal extends Modal {

    /** @type {number} Écran actuellement affiché (1, 2 ou 3) */
    #currentStep = 1;

    /** @type {string|null} Mode sélectionné sur l'écran 1 ('connected'|'disconnected') */
    #selectedMode = null;

    /** @type {boolean} Indique si la fermeture par Escape/backdrop est autorisée */
    #allowDismiss = false;

    // ── Construction ──────────────────────────────────────

    /**
     * Crée la modale de choix de mode.
     * La croix de fermeture est masquée et Escape/backdrop sont bloqués
     * tant que l'utilisateur n'a pas fait de choix.
     */
    constructor() {
        super('mode-choice-modal');
        this.setTitle('🎓 Comment souhaitez-vous utiliser l\'application ?');

        // Masquer la croix de fermeture
        const closeBtn = this.element?.querySelector('.modal__close');
        if (closeBtn) closeBtn.style.display = 'none';

        // Ajouter la classe large au dialog
        const dialog = this.element?.querySelector('.modal__dialog');
        if (dialog) dialog.classList.add('modal__dialog--mode-choice');

        this.#renderStep1();
    }

    // ── Surcharges Modal ─────────────────────────────────

    /**
     * Surcharge close() pour n'autoriser la fermeture que si #allowDismiss est true.
     * Empêche la fermeture par Escape ou backdrop tant que le choix n'est pas fait.
     * @override
     */
    close() {
        if (!this.#allowDismiss) {
            console.log('[ModeChoiceModal] Fermeture bloquée (choix obligatoire)');
            return;
        }
        super.close();
    }

    /**
     * Force la fermeture de la modale (utilisé après un choix validé).
     * @private
     */
    #forceClose() {
        this.#allowDismiss = true;
        super.close();
    }

    // ── Point d'entrée statique ──────────────────────────

    /**
     * Affiche la modale de choix de mode si elle doit être affichée.
     * Vérifie les flags localStorage avant de créer l'instance.
     * @returns {ModeChoiceModal|null} L'instance créée, ou null si non affichée
     */
    static show() {
        console.log('[ModeChoiceModal] 🎯 Affichage de la modale de choix de mode');
        const modal = new ModeChoiceModal();
        modal.open();
        return modal;
    }

    // ── Écran 1 : Choix du mode ──────────────────────────

    /**
     * Génère et affiche l'écran 1 — choix connecté / déconnecté.
     * @private
     */
    #renderStep1() {
        const html = `
            <div class="mode-choice__step mode-choice__step--active" data-step="1">
                <p class="mode-choice__intro">
                    Bienvenue ! Choisissez votre mode d'utilisation pour commencer.
                </p>

                <div class="mode-choice__cards">
                    <button class="mode-choice__card" data-mode="connected" type="button">
                        <span class="mode-choice__card-icon">🔗</span>
                        <span class="mode-choice__card-title">Mode connecté</span>
                        <span class="mode-choice__card-desc">
                            J'ai déjà un compte Onisep, ou je vais m'en créer un maintenant, 
                            et je veux extraire mes propres données pour les explorer.
                        </span>
                    </button>

                    <button class="mode-choice__card" data-mode="disconnected" type="button">
                        <span class="mode-choice__card-icon">📦</span>
                        <span class="mode-choice__card-title">Mode déconnecté</span>
                        <span class="mode-choice__card-desc">
                            Je n'ai pas de compte Onisep et je veux explorer 
                            des données déjà extraites.
                        </span>
                    </button>
                </div>

                <div class="mode-choice__actions">
                    <button class="btn btn--primary btn--lg mode-choice__validate-btn" disabled type="button">
                        Valider mon choix
                    </button>
                </div>
            </div>

            <div class="mode-choice__step" data-step="2"></div>
            <div class="mode-choice__step" data-step="3"></div>
        `;

        this.setContent(html);
        this.#attachStep1Events();
    }

    /**
     * Attache les événements de l'écran 1.
     * @private
     */
    #attachStep1Events() {
        const body = this.getBodyElement();
        if (!body) return;

        // Sélection d'une carte
        const cards = body.querySelectorAll('.mode-choice__card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                // Désélectionner toutes les cartes
                cards.forEach(c => c.classList.remove('mode-choice__card--selected'));
                // Sélectionner celle cliquée
                card.classList.add('mode-choice__card--selected');
                this.#selectedMode = card.dataset.mode;

                // Activer le bouton Valider
                const validateBtn = body.querySelector('.mode-choice__validate-btn');
                if (validateBtn) validateBtn.disabled = false;
            });
        });

        // Bouton Valider
        const validateBtn = body.querySelector('.mode-choice__validate-btn');
        if (validateBtn) {
            validateBtn.addEventListener('click', () => this.#onModeValidated());
        }
    }

    /**
     * Gère la validation du choix de mode.
     * @private
     */
    #onModeValidated() {
        if (!this.#selectedMode) return;

        // Sauvegarder le choix pour cette session uniquement
        sessionStorage.setItem(MODE_CHOICE_KEY, this.#selectedMode);

        console.log(`[ModeChoiceModal] Mode choisi : ${this.#selectedMode}`);

        if (this.#selectedMode === 'connected') {
            // Mode connecté → fermer directement
            this.#forceClose();
        } else {
            // Mode déconnecté → vérifier la base
            this.#handleDisconnectedMode();
        }
    }

    // ── Écran 2 : Résumé des données en base ─────────────

    /**
     * Gère l'aiguillage vers l'écran 2 ou 3 selon l'état de la base.
     * @private
     */
    async #handleDisconnectedMode() {
        const db = window.databaseService;
        if (!db) {
            this.#switchToStep(3);
            return;
        }

        const hasData = db.hasEducationalData();

        if (hasData) {
            // Base non vide → écran 2
            const meta  = db.getLastExtractionMetadata();
            const stats = await db.getStats();
            this.#renderStep2(meta, stats);
            this.#switchToStep(2);
        } else {
            // Base vide → écran 3
            this.#renderStep3();
            this.#switchToStep(3);
        }
    }

    /**
     * Génère le HTML de l'écran 2 — résumé des données en base.
     * @private
     * @param {Object|null} meta - Métadonnées de la dernière extraction
     * @param {Object} stats - Statistiques de la base
     */
    #renderStep2(meta, stats) {
        const body = this.getBodyElement();
        const step2 = body?.querySelector('[data-step="2"]');
        if (!step2) return;

        // Descriptions lisibles
        const typeLabel = meta?.typeRecherche
            ? DatasetService.getTypeRechercheLabel(meta.typeRecherche)
            : 'Type inconnu';

        const paramsDesc = meta?.params
            ? DatasetService.formatParamsDescription(meta.typeRecherche, meta.params)
            : 'Paramètres non disponibles';

        const statsDesc = DatasetService.formatStatsDescription(stats);

        const dateStr = meta?.date
            ? new Date(meta.date).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })
            : 'Date inconnue';

        step2.innerHTML = `
            <p class="mode-choice__intro">
                Des données sont déjà présentes dans l'application. 
                Souhaitez-vous les explorer ?
            </p>

            <div class="mode-choice__summary">
                <div class="mode-choice__summary-row">
                    <span class="mode-choice__summary-label">📋 Recherche</span>
                    <span class="mode-choice__summary-value">${this.#escapeHtml(typeLabel)}</span>
                </div>
                <div class="mode-choice__summary-row">
                    <span class="mode-choice__summary-label">📍 Périmètre</span>
                    <span class="mode-choice__summary-value">${this.#escapeHtml(paramsDesc)}</span>
                </div>
                <div class="mode-choice__summary-row">
                    <span class="mode-choice__summary-label">📊 Contenu</span>
                    <span class="mode-choice__summary-value">${this.#escapeHtml(statsDesc)}</span>
                </div>
                <div class="mode-choice__summary-row">
                    <span class="mode-choice__summary-label">📅 Date</span>
                    <span class="mode-choice__summary-value">${this.#escapeHtml(dateStr)}</span>
                </div>
            </div>

            <div class="mode-choice__actions">
                <button class="btn btn--primary btn--lg mode-choice__accept-btn" type="button">
                    ✅ Explorer ces données
                </button>
                <button class="btn btn--secondary mode-choice__load-other-btn" type="button">
                    🔄 Charger un autre jeu de données
                </button>
            </div>
        `;

        this.#attachStep2Events();
    }

    /**
     * Attache les événements de l'écran 2.
     * @private
     */
    #attachStep2Events() {
        const body = this.getBodyElement();
        if (!body) return;

        const acceptBtn = body.querySelector('.mode-choice__accept-btn');
        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                console.log('[ModeChoiceModal] Données en base acceptées');
                this.#forceClose();
            });
        }

        const loadOtherBtn = body.querySelector('.mode-choice__load-other-btn');
        if (loadOtherBtn) {
            loadOtherBtn.addEventListener('click', () => {
                this.#renderStep3();
                this.#switchToStep(3);
            });
        }
    }

    // ── Écran 3 : Chargement d'un jeu de données ────────

    /**
     * Génère le HTML de l'écran 3 — import de fichier / liste des jeux indexés.
     * @private
     */
    #renderStep3() {
        const body = this.getBodyElement();
        const step3 = body?.querySelector('[data-step="3"]');
        if (!step3) return;

        // Jeux de données indexés (local)
        const index = (typeof DatasetService !== 'undefined')
            ? DatasetService.getIndex()
            : [];

        let indexHtml = '';
        if (index.length > 0) {
            const itemsHtml = index.map(entry => {
                const typeLabel = DatasetService.getTypeRechercheLabel(entry.typeRecherche);
                const statsDesc = DatasetService.formatStatsDescription(entry.stats);
                const dateStr = entry.dateExtraction
                    ? new Date(entry.dateExtraction).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })
                    : '';

                return `
                    <button class="mode-choice__dataset-item" data-dataset-id="${this.#escapeHtml(entry.id)}" type="button">
                        <span class="mode-choice__dataset-name">📄 ${this.#escapeHtml(entry.nom)}</span>
                        <span class="mode-choice__dataset-meta">${this.#escapeHtml(typeLabel)} — ${this.#escapeHtml(dateStr)}</span>
                        <span class="mode-choice__dataset-stats">${this.#escapeHtml(statsDesc)}</span>
                    </button>
                `;
            }).join('');

            indexHtml = `
                <div class="mode-choice__dataset-section">
                    <h3 class="mode-choice__section-title">Jeux de données enregistrés localement</h3>
                    <div class="mode-choice__dataset-list">
                        ${itemsHtml}
                    </div>
                </div>
                <div class="mode-choice__separator">
                    <span>ou</span>
                </div>
            `;
        }

        // Section GitHub (toujours affichée si le service est disponible)
        const hasGitHub = typeof GitHubStorage !== 'undefined' && GitHubStorage.getConfig().configured;
        const githubHtml = hasGitHub ? `
            <div class="mode-choice__dataset-section">
                <h3 class="mode-choice__section-title">☁️ Jeux de données distants</h3>
                <div id="mode-choice-github-list" class="mode-choice__dataset-list">
                    <div class="mode-choice__github-loading">⏳ Chargement depuis GitHub…</div>
                </div>
            </div>
            <div class="mode-choice__separator">
                <span>ou</span>
            </div>
        ` : '';

        step3.innerHTML = `
            <p class="mode-choice__intro">
                Chargez un jeu de données pré-extrait pour explorer 
                les formations et les établissements.
            </p>

            ${githubHtml}

            ${indexHtml}

            <div class="mode-choice__file-zone">
                <label class="mode-choice__file-label" for="mode-choice-file-input">
                    <span class="mode-choice__file-icon">📂</span>
                    <span class="mode-choice__file-text">Charger un fichier JSON local</span>
                    <span class="mode-choice__file-hint">Cliquez ou glissez-déposez un fichier</span>
                </label>
                <input type="file" id="mode-choice-file-input" 
                       class="mode-choice__file-input" accept=".json" hidden>
            </div>

            <div class="mode-choice__import-status" style="display: none;"></div>

            <div class="mode-choice__actions">
                <button class="btn btn--secondary mode-choice__back-btn" type="button">
                    ← Retour
                </button>
            </div>
        `;

        this.#attachStep3Events();

        // Charger la liste GitHub de manière asynchrone
        if (hasGitHub) {
            this.#loadGitHubList();
        }
    }

    /**
     * Attache les événements de l'écran 3.
     * @private
     */
    #attachStep3Events() {
        const body = this.getBodyElement();
        if (!body) return;

        // Import de fichier
        const fileInput = body.querySelector('#mode-choice-file-input');
        const fileLabel = body.querySelector('.mode-choice__file-label');

        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.#onFileSelected(e));
        }

        // Drag & drop sur le label
        if (fileLabel) {
            fileLabel.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileLabel.classList.add('mode-choice__file-label--dragover');
            });
            fileLabel.addEventListener('dragleave', () => {
                fileLabel.classList.remove('mode-choice__file-label--dragover');
            });
            fileLabel.addEventListener('drop', (e) => {
                e.preventDefault();
                fileLabel.classList.remove('mode-choice__file-label--dragover');
                const file = e.dataTransfer?.files?.[0];
                if (file && file.name.endsWith('.json')) {
                    this.#processFile(file);
                } else {
                    this.#showImportStatus('❌ Seuls les fichiers .json sont acceptés.', 'error');
                }
            });
        }

        // Jeux de données indexés
        const datasetItems = body.querySelectorAll('.mode-choice__dataset-item');
        datasetItems.forEach(item => {
            item.addEventListener('click', () => {
                this.#showImportStatus(
                    'ℹ️ Ce jeu de données est enregistré dans l\'index mais le fichier n\'est pas stocké dans l\'application. ' +
                    'Veuillez charger le fichier JSON correspondant.',
                    'info'
                );
            });
        });

        // Bouton retour
        const backBtn = body.querySelector('.mode-choice__back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                // Retour à l'écran 2 si la base a des données, sinon à l'écran 1
                const db = window.databaseService;
                if (db && db.hasEducationalData()) {
                    this.#switchToStep(2);
                } else {
                    this.#switchToStep(1);
                }
            });
        }
    }

    /**
     * Charge la liste des datasets GitHub de manière asynchrone et peuple le conteneur.
     * @private
     */
    async #loadGitHubList() {
        const body = this.getBodyElement();
        const container = body?.querySelector('#mode-choice-github-list');
        if (!container) return;

        try {
            const datasets = await GitHubStorage.listDatasets();

            if (datasets.length === 0) {
                container.innerHTML = '<div class="mode-choice__github-empty">Aucun jeu de données disponible sur ce dépôt.</div>';
                return;
            }

            container.innerHTML = datasets.map(entry => {
                const typeLabel = (typeof DatasetService !== 'undefined')
                    ? DatasetService.getTypeRechercheLabel(entry.typeRecherche)
                    : (entry.typeRecherche || '');
                const statsDesc = (typeof DatasetService !== 'undefined')
                    ? DatasetService.formatStatsDescription(entry.stats)
                    : '';
                const dateStr = entry.dateExtraction
                    ? new Date(entry.dateExtraction).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })
                    : '';

                return `
                    <button class="mode-choice__dataset-item mode-choice__dataset-item--github"
                            data-github-filename="${this.#escapeHtml(entry.filename)}" type="button">
                        <span class="mode-choice__dataset-name">☁️ ${this.#escapeHtml(entry.nom)}</span>
                        <span class="mode-choice__dataset-meta">${this.#escapeHtml(typeLabel)} — ${this.#escapeHtml(dateStr)}</span>
                        <span class="mode-choice__dataset-stats">${this.#escapeHtml(statsDesc)}</span>
                    </button>
                `;
            }).join('');

            // Attacher les événements de clic
            container.querySelectorAll('[data-github-filename]').forEach(item => {
                item.addEventListener('click', () => {
                    const filename = item.dataset.githubFilename;
                    this.#onGitHubDatasetSelected(filename);
                });
            });

        } catch (error) {
            console.error('[ModeChoiceModal] Erreur GitHub:', error);
            container.innerHTML = `<div class="mode-choice__github-error">❌ ${this.#escapeHtml(error.message)}</div>`;
        }
    }

    /**
     * Charge un dataset depuis GitHub et l'importe.
     * @private
     * @param {string} filename - Nom du fichier sur GitHub
     */
    async #onGitHubDatasetSelected(filename) {
        this.#showImportStatus('⏳ Téléchargement depuis GitHub…', 'info');

        try {
            const dataset = await GitHubStorage.loadDataset(filename);
            const result  = await DatasetService.importDataset(dataset);

            if (result.success) {
                DatasetService.addToIndex(dataset.metadata);
                this.#refreshAppAfterImport();

                const statsDesc = DatasetService.formatStatsDescription(result.stats);
                this.#showImportStatus(
                    `✅ Import réussi !\n📊 ${statsDesc}`,
                    'success'
                );

                setTimeout(() => this.#forceClose(), 1500);
            } else {
                this.#showImportStatus(
                    `❌ Erreur d'import :\n${result.errors.map(e => '• ' + e).join('\n')}`,
                    'error'
                );
            }
        } catch (error) {
            console.error('[ModeChoiceModal] Erreur chargement GitHub:', error);
            this.#showImportStatus(`❌ Erreur : ${error.message}`, 'error');
        }
    }

    /**
     * Gère la sélection d'un fichier JSON par l'utilisateur.
     * @private
     * @param {Event} event - Événement change de l'input file
     */
    #onFileSelected(event) {
        const file = event.target?.files?.[0];
        if (!file) return;
        this.#processFile(file);
    }

    /**
     * Lit et importe un fichier JSON.
     * @private
     * @param {File} file - Fichier JSON sélectionné
     */
    async #processFile(file) {
        this.#showImportStatus('⏳ Lecture du fichier…', 'info');

        try {
            const text = await file.text();
            let json;

            try {
                json = JSON.parse(text);
            } catch (parseError) {
                this.#showImportStatus('❌ Le fichier n\'est pas un JSON valide.', 'error');
                return;
            }

            // Aperçu avant import
            const info = DatasetService.getDatasetInfo(json);
            if (!info) {
                this.#showImportStatus('❌ Format de fichier non reconnu.', 'error');
                return;
            }

            // Validation
            const validation = DatasetService.validateDataset(json);
            if (!validation.valid) {
                this.#showImportStatus(
                    `❌ Fichier invalide :\n${validation.errors.map(e => '• ' + e).join('\n')}`,
                    'error'
                );
                return;
            }

            // Import
            this.#showImportStatus('⏳ Import des données…', 'info');
            const result = await DatasetService.importDataset(json);

            if (result.success) {
                // Ajouter à l'index
                DatasetService.addToIndex(json.metadata);

                // Rafraîchir l'affichage de l'application
                this.#refreshAppAfterImport();

                const statsDesc = DatasetService.formatStatsDescription(result.stats);
                this.#showImportStatus(
                    `✅ Import réussi !\n📊 ${statsDesc}`,
                    'success'
                );

                // Fermer après un délai pour que l'utilisateur voie le résultat
                setTimeout(() => this.#forceClose(), 1500);
            } else {
                this.#showImportStatus(
                    `❌ Erreur d'import :\n${result.errors.map(e => '• ' + e).join('\n')}`,
                    'error'
                );
            }
        } catch (error) {
            console.error('[ModeChoiceModal] Erreur lors de l\'import:', error);
            this.#showImportStatus(`❌ Erreur : ${error.message}`, 'error');
        }
    }

    /**
     * Rafraîchit l'affichage de l'application après un import de données.
     * Recharge les stats, les vues, et les marqueurs de carte si nécessaire.
     * @private
     */
    #refreshAppAfterImport() {
        try {
            if (typeof window.initResultsTab === 'function') {
                window.initResultsTab();
            } else {
                if (typeof loadStats === 'function') loadStats();
                if (typeof loadView  === 'function') loadView();
            }
            if (typeof window.loadMarkers === 'function') window.loadMarkers();
        } catch (error) {
            console.warn('[ModeChoiceModal] ⚠️ Erreur lors du rafraîchissement:', error);
        }
    }

    // ── Navigation entre écrans ──────────────────────────

    /**
     * Affiche un écran et masque les autres.
     * @private
     * @param {number} stepNumber - Numéro de l'écran (1, 2 ou 3)
     */
    #switchToStep(stepNumber) {
        const body = this.getBodyElement();
        if (!body) return;

        // Mettre à jour le titre selon l'écran
        const titles = {
            1: '🎓 Comment souhaitez-vous utiliser l\'application ?',
            2: '📊 Données disponibles',
            3: '📂 Charger un jeu de données'
        };
        this.setTitle(titles[stepNumber] || titles[1]);

        // Basculer les écrans
        body.querySelectorAll('.mode-choice__step').forEach(step => {
            const isTarget = parseInt(step.dataset.step) === stepNumber;
            step.classList.toggle('mode-choice__step--active', isTarget);
        });

        this.#currentStep = stepNumber;
        console.log(`[ModeChoiceModal] → Écran ${stepNumber}`);
    }

    // ── Affichage des statuts d'import ───────────────────

    /**
     * Affiche un message de statut dans la zone dédiée de l'écran 3.
     * @private
     * @param {string} message - Message à afficher
     * @param {'info'|'success'|'error'} type - Type de message
     */
    #showImportStatus(message, type) {
        const body = this.getBodyElement();
        const statusEl = body?.querySelector('.mode-choice__import-status');
        if (!statusEl) return;

        statusEl.style.display = 'block';
        statusEl.className = `mode-choice__import-status mode-choice__import-status--${type}`;
        statusEl.textContent = message;
    }

    // ── Utilitaires ──────────────────────────────────────

    /**
     * Échappe les caractères HTML dangereux.
     * @private
     * @param {string} str - Chaîne à échapper
     * @returns {string} Chaîne sécurisée
     */
    #escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }
}

// ══════════════════════════════════════════════════════════
// EXPOSITION GLOBALE
// ══════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    window.ModeChoiceModal   = ModeChoiceModal;
    window.MODE_CHOICE_KEY   = MODE_CHOICE_KEY;
    window.MODE_CHOICE_SKIP_KEY = MODE_CHOICE_SKIP_KEY;
}
