// Copyright (c) 2026 Laurent COSTE — Licensed under EUPL v1.2 — See LICENSE
/**
 * @file tour_guide.js
 * @description Tour guidé de première utilisation — driver.js (v0.44).
 *
 * Déclenchement :
 *   - Automatique à la première visite (flag 'tour_completed_v1' absent de localStorage)
 *   - Manuel : window.lancerTourGuide() depuis Paramètres → 🚀 Tour guidé
 *
 * Étapes : onglets principaux, extraction géographique,
 *          filtres & résultats, carte & itinéraire, panneau paramètres.
 */

'use strict';

/**
 * @typedef {Object} DriverStep
 * @property {string}   [element]                  - Sélecteur CSS de l'élément ciblé
 * @property {Object}   popover                    - Contenu de la bulle
 * @property {string}   popover.title              - Titre
 * @property {string}   popover.description        - Description HTML
 * @property {string}   [popover.side]             - Position de la bulle
 * @property {Function} [onHighlightStarted]       - Callback avant affichage
 */

class TourGuide {

    /** @type {string} Clé localStorage indiquant que le tour a été vu */
    static #STORAGE_KEY = 'tour_completed_v1';

    /** @type {string} URL CDN driver.js (verrouillée à une version précise) */
    static #CDN_JS  = 'https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.js.iife.js';
    static #CDN_CSS = 'https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.css';

    /** @type {Object|null} Instance driver active */
    #driver = null;

    // ── API publique ────────────────────────────────────────────────────────

    /**
     * Retourne true si le tour n'a jamais été complété sur cet appareil.
     * @returns {boolean}
     */
    static isPremiereLancement() {
        return !localStorage.getItem(TourGuide.#STORAGE_KEY);
    }

    /**
     * Efface le flag de complétion pour permettre de rejouer le tour.
     * @returns {void}
     */
    static resetTour() {
        localStorage.removeItem(TourGuide.#STORAGE_KEY);
    }

    /**
     * Démarre le tour guidé.
     * Charge driver.js depuis le CDN si ce n'est pas encore fait.
     * @returns {Promise<void>}
     */
    async start() {
        await this.#chargerDriver();

        this.#driver = window.driver.js.driver({
            showProgress:    true,
            progressText:    'Étape {{current}} sur {{total}}',
            nextBtnText:     'Suiv. →',
            prevBtnText:     '← Préc.',
            doneBtnText:     'Terminer ✓',
            overlayColor:    '#1a1a2e', 
            overlayOpacity:  0.6,
            smoothScroll:    true,
            allowClose:      true,
            stagePadding:    10,
            stageRadius:     8,
            popoverClass:    'tour-popover',
            steps:           this.#construireEtapes(),
            onDestroyStarted: () => {
                localStorage.setItem(TourGuide.#STORAGE_KEY, 'true');
                this.#driver.destroy();
            },
        });

        this.#driver.drive();
    }

    // ── Construction des étapes ─────────────────────────────────────────────

    /**
     * Construit et retourne la liste des étapes du tour.
     * @private
     * @returns {DriverStep[]}
     */
    #construireEtapes() {
        return [

            // ── 1. Écran d'accueil ──────────────────────────────────────────
            {
                popover: {
                    title: '🎓 Bienvenue dans Orientation Post-Collège',
                    description:
                        '<p>Cette application vous permet d\'explorer les établissements ' +
                        'et les formations disponibles après le collège.</p>' +
                        '<p>Le mode connecté nécessite un compte Onisep pour rechercher et extraire vos propres données.</p>' +
                        '<p>Le mode déconnecté vous permet d\'explorer les données déjà extraites en les important à partir des paramètres.</p>' +
                        '<p class="tour-hint">Ce tour guidé présente les fonctions essentielles ' +
                        'en 9 étapes. Vous pouvez le quitter à tout moment.</p>',
                }
            },

            // ── 2. Onglet Recherche ─────────────────────────────────────────
            {
                element: '[data-tab="recherche"]',
                popover: {
                    title: '🔍 Onglet Recherche',
                    description:
                        '<p>En mode connecté, tout commence ici. Trois types de recherches sont disponibles :</p>' +
                        '<ul>' +
                        '<li><strong>🌍 Géographique</strong> — tous les établissements d\'une commune ou intercommunalité</li>' +
                        '<li><strong>🎓 Par diplôme</strong> — tous les établissements d\'un département ou d\'une académie proposant des Bac ou CAP spécifiques</li>' +
                        '<li><strong>📚 Par option</strong> — tous les établissements d\'un département ou d\'une académie proposant des options de 2nde GT</li>' +
                        '</ul>',
                    side: 'bottom',
                },
                onHighlightStarted: () => {
                    // Rendre l'onglet visible sans forcer le changement de vue
                    document.querySelector('[data-tab="recherche"]')?.scrollIntoView({ block: 'nearest' });
                }
            },

            // ── 3. Recherche géographique ───────────────────────────────────
            {
                element: '#tab-smart-search-commune',
                popover: {
                    title: '📍 Recherche géographique',
                    description:
                        '<p>Tapez au moins 3 lettres du nom de la <strong>commune</strong>&nbsp: les résultats sont filtrés en temps réel.</p>' +
                        '<p>Choisissez dans la liste qui s\'affiche, et définissez le périmètre de la recherche&nbsp;:' +
                        'commune seule ou toute l\'<strong>intercommunalité</strong>.</p>',
                    side: 'bottom',
                },
                onHighlightStarted: () => {
                    if (typeof switchTab === 'function') switchTab('recherche');
                }
            },

            // ── 4. Sélection des voies ────────────────────────────────────────
            {
                element: '#tab-geo-voie-selector',
                popover: {
                    title: '📚 Voie(s) de formation',
                    description:
                        '<p>Choisissez les voies de formation à inclure dans la recherche :</p>' +
                        '<ul>' +
                        '<li><strong>Voie scolaire</strong> — établissements, diplômes, dispositifs pédagogiques, options de 2nde GT, obtenus dans la base ONISEP</li>' +
                        '<li><strong>Voie apprentissage</strong> — établissements et diplômes, obtenus dans la base CARIF-OREF</li>' +
                        '</ul>',
                    side: 'top',
                }
            },

            // ── 5. Bouton extraction ────────────────────────────────────────
            {
                element: '#tab-btn-extract-geo',
                popover: {
                    title: '🚀 Lancer l\'extraction',
                    description:
                        '<p>Tous les critères sont sélectionnés&nbsp;: lancez l\'extraction&nbsp!</p>' +
                        '<p>La durée varie de quelques secondes à quelques minutes selon la quantité de données à extraire.</p>',
                    side: 'top',
                }
            },

            // ── 6. Onglet Résultats ─────────────────────────────────────────
            {
                element: '[data-tab="resultats"]',
                popover: {
                    title: '📊 Onglet Résultats',
                    description:
                        '<p>Après l\'extraction, consultez les données selon 5 vues :</p>' +
                        '<ul>' +
                        '<li>🏫 <strong>Établissements</strong></li>' +
                        '<li>📜 <strong>Diplômes scolaires</strong></li>' +
                        '<li>🔧 <strong>Diplômes apprentissage</strong></li>' +
                        '<li>⭐ <strong>Dispositifs pédagogiques</strong></li>' +
                        '<li>📚 <strong>Options 2nde GT</strong></li>' +
                        '</ul>' +
                        '<p>Cliquez sur une ligne pour ouvrir la <strong>fiche détaillée</strong>.</p>',
                    side: 'bottom',
                },
                onHighlightStarted: () => {
                    if (typeof switchTab === 'function') switchTab('resultats');
                }
            },

            // ── 7. Filtres ──────────────────────────────────────────────────
            {
                element: '#filters-container',
                popover: {
                    title: '🔎 Filtres dynamiques',
                    description:
                        '<p>Affinez les résultats selon plusieurs critères :</p>' +
                        '<ul>' +
                        '<li>Recherche textuelle libre</li>' +
                        '<li>Type d\'établissement (lycée général, professionnel, CFA…)</li>' +
                        '<li>Statut public / privé sous contrat / privé hors contrat</li>' +
                        '<li>Commune, niveau de diplôme, catégorie…</li>' +
                        '</ul>' +
                        '<p class="tour-hint">Les filtres disponibles s\'adaptent automatiquement à la vue active.</p>',
                    side: 'bottom',
                }
            },

            // ── 8. Carte et itinéraire ──────────────────────────────────────
            {
                element: '[data-tab="carte"]',
                popover: {
                    title: '🗺️ Onglet Carte',
                    description:
                        '<p>Visualisez les établissements sur une carte interactive.</p>' +
                        '<p>Chaque type d\'établissement a un marqueur spécifique, chaque voie de formation a une couleur spécifique.</p>' +
                        '<p>Cliquez sur un marqueur pour voir le résumé, puis&nbsp;:</p>' +
                        '<ul>' +
                        '<li>Ouvrez la <strong>fiche détaillée</strong></li>' +
                        '<li>Calculez un <strong>itinéraire</strong> depuis votre domicile ' +
                        'ou votre établissement (s\'ouvre dans Google Maps)</li>' +
                        '</ul>' +
                        '<p class="tour-hint">Vous disposez de filtres pour affiner ce qui s\'affiche sur la carte.</p>',
                    side: 'bottom',
                },
                onHighlightStarted: () => {
                    if (typeof switchTab === 'function') switchTab('carte');
                }
            },

            // ── 9. Panneau paramètres ───────────────────────────────────────
            {
                element: '#hamburger-btn',
                popover: {
                    title: '⚙️ Panneau de paramètres',
                    description:
                        '<p>Ce bouton donne accès aux paramètres :</p>' +
                        '<ul>' +
                        '<li>🔐 <strong>Connexion Onisep</strong> — saisissez les identifiants nécessaires pour extraire les données depuis la base Onisep</li>' +
                        '<li>🏫 <strong>Mon établissement \& domicile</strong> — pour positionner des marqueurs spécifiques sur la carte et définir les points de départ des itinéraires</li>' +
                        '<li>⭐ <strong>Favoris</strong> — établissements, diplômes, dispositifs pédagogiques, options de 2nde GT et recherches mis en favoris s\'affichent ici pour un accès rapide</li>' +
                        '<li>💾 <strong>Données</strong> — sauvegardez et restaurez des données extraites pour un accès hors-ligne en mode déconnecté</li>' +
                        '<li>❓ <strong>Aide \& À propos</strong> — apprenez comment créer votre compte Onisep, et découvrez l\'historique des changements</li>' +
                        '<li>🚀 <strong>Tour guidé</strong> — rejouez ce tour guidé à tout moment&nbsp!</li>' +
                        '</ul>',
                    side: 'left',
                },
                onHighlightStarted: () => {
                    if (typeof switchTab === 'function') switchTab('resultats');
                }
            },

            // ── 10. Fin ──────────────────────────────────────────────────────
            {
                popover: {
                    title: '✅ Vous êtes prêt !',
                    description:
                        '<p>Vous connaissez maintenant toutes les fonctions essentielles.</p>' +
                        '<p class="tour-hint">Bonne exploration&nbsp;! 🎓</p>',
                }
            },

        ];
    }

    // ── Chargement driver.js ────────────────────────────────────────────────

    /**
     * Charge le CSS et le JS de driver.js depuis le CDN si non déjà chargés.
     * @private
     * @returns {Promise<void>}
     */
    #chargerDriver() {
        return new Promise((resolve, reject) => {
            // Déjà chargé ?
            if (window.driver?.js?.driver) { resolve(); return; }

            // CSS
            if (!document.getElementById('driver-css')) {
                const link = Object.assign(document.createElement('link'), {
                    id: 'driver-css', rel: 'stylesheet', href: TourGuide.#CDN_CSS
                });
                document.head.appendChild(link);
            }

            // JS
            const script = Object.assign(document.createElement('script'), {
                src: TourGuide.#CDN_JS,
                onload:  () => resolve(),
                onerror: () => reject(new Error('[TourGuide] Impossible de charger driver.js depuis le CDN.')),
            });
            document.head.appendChild(script);
        });
    }
}

// ── Exposition globale ────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
    window.TourGuide = TourGuide;

    /**
     * Lance ou relance le tour guidé (utilisé depuis le bouton dans les paramètres).
     * Ferme le panneau de paramètres si ouvert, puis démarre le tour.
     * @returns {void}
     */
    window.lancerTourGuide = function () {
        // Fermer le panneau de paramètres si ouvert
        const panel = document.getElementById('settings-panel');
        if (panel?.classList.contains('active') && typeof toggleSettings === 'function') {
            toggleSettings();
        }

        TourGuide.resetTour();
        const tour = new TourGuide();
        tour.start().catch(err => {
            console.error('[TourGuide] Erreur au démarrage :', err);
            showAlert?.('❌ Tour guidé indisponible (vérifiez votre connexion internet)', 'error');
        });
    };
}
