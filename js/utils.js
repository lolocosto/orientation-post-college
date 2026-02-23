/**
 * @file utils.js
 * @description Initialisation de l'application et fonctions utilitaires pures.
 *
 * Règle de séparation : ce fichier ne contient QUE des fonctions pures (sans
 * effet de bord sur le DOM, sans accès direct à localStorage) — sauf `init()`
 * et `showAlert()` qui font partie du bootstrap de l'application.
 *
 * @module utils
 * @author Laurent COSTE / Claude
 * @version 0.45
 */

'use strict';

// ══════════════════════════════════════════════════════════
// INITIALISATION DE L'APPLICATION
// ══════════════════════════════════════════════════════════

/**
 * Initialise l'application au chargement du DOM.
 * Crée les services et contrôleurs globaux, charge les préférences,
 * lance éventuellement une auto-connexion et le tour guidé.
 * @returns {Promise<void>}
 */
// Flag : _onDbReady a déjà rendu l'onglet résultats — switchTab ne doit pas re-rendre
let _dbReadyRendered = false;

async function init() {
    const _t0 = performance.now();
    const _lap = (label) => console.log(`[INIT] ⏱️ ${label}: ${Math.round(performance.now()-_t0)}ms`);

    console.log('════════════════════════════════════════════════');
    console.log('🚀 INITIALISATION DÉMARRÉE - V0.51');
    console.log('════════════════════════════════════════════════');

    try {
        // 1. DatabaseService global — instanciation immédiate (non-bloquante)
        window.databaseService = new DatabaseService();
        await window.databaseService.init();
        _lap('DatabaseService init');

        // Afficher la bannière de chargement si des données existent en localStorage
        _showLoadingBannerIfNeeded();

        // Le chargement localStorage se fait en arrière-plan ; écouter l'événement de fin
        document.addEventListener('db:ready', _onDbReady, { once: true });

        // 2. Contrôleurs d'extraction
        window.onisepExtractionController = new OnisepExtractionController();
        window.onisepExtractionController.init();

        window.geoExtractionController = new GeoExtractionController();
        window.geoExtractionController.init();
        window.onisepExtractionController.setGeoController(window.geoExtractionController);

        window.carifOrefExtractionController = new CARIFOREFExtractionController();
        window.carifOrefExtractionController.init();
        window.carifOrefExtractionController.setGeoController(window.geoExtractionController);

        window.dataEducationExtractionController = new DataEducationExtractionController();
        window.dataEducationExtractionController.init();
        _lap('Contrôleurs créés');

        // 3. Credentials sauvegardés
        if (typeof loadSavedCredentials === 'function') loadSavedCredentials();

        // 4. Auto-connexion Onisep (lit via db_service.lirePreferences, fallback localStorage)
        const prefs = (typeof window.databaseService?.lirePreferences === 'function')
            ? (await window.databaseService.lirePreferences() || {})
            : {};
        const autoConnect = prefs.settings_auto_connect === true
            || localStorage.getItem('settings_auto_connect') === 'true';

        if (autoConnect) {
            const email    = prefs.settings_email    || localStorage.getItem('settings_email');
            const password = prefs.settings_password || localStorage.getItem('settings_password');
            const appId    = prefs.settings_app_id   || localStorage.getItem('settings_app_id');
            if (email && password && appId) {
                setTimeout(() => {
                    if (typeof autoConnectOnisep === 'function') autoConnectOnisep(email, password, appId);
                }, 1000);
            }
        }

        // 5. Données statiques Bac Pro
        if (typeof PARCOURS_BAC_PRO !== 'undefined') {
            const total = PARCOURS_BAC_PRO.reduce((s, f) => s + f.parcours.length, 0);
            console.log(`[INIT] Bac Pro : ${PARCOURS_BAC_PRO.length} familles, ${total} diplômes`);
        }

        // 6. Chargement EPCI
        try {
            await window.geoExtractionController.getAllEPCIs();
        } catch (e) { console.warn('[INIT] ⚠️ Erreur EPCI:', e); }
        _lap('EPCI chargés');

        // 7. Vue par défaut : onglet résultats
        // Si _onDbReady a déjà rendu l'onglet, on évite un 2ème rendu complet.
        if (typeof switchTab === 'function') {
            if (_dbReadyRendered) {
                // Bascule visuelle sans re-rendre les données
                switchTab('resultats', /* skipInit= */ true);
            } else {
                switchTab('resultats');
            }
        }
        _lap('switchTab résultats');

        // 8. Favoris
        if (typeof afficherListeFavoris === 'function') afficherListeFavoris();

        // 9. Tour guidé (première visite)
        if (typeof TourGuide !== 'undefined' && TourGuide.isPremiereLancement()) {
            setTimeout(() => {
                const tour = new TourGuide();
                tour.start().catch(err => console.warn('[TourGuide]', err.message));
            }, 800);
        }

        _lap('Total init');
        console.log('✅ INITIALISATION TERMINÉE - V0.51');

    } catch (error) {
        console.error('❌ ERREUR D\'INITIALISATION', error);
        showAlert('❌ Erreur d\'initialisation : ' + error.message, 'error');
    }
}

// ══════════════════════════════════════════════════════════
// ALERTES
// ══════════════════════════════════════════════════════════

/**
 * Affiche une notification temporaire dans la zone `#alerts`.
 * @param {string} message - Texte (HTML autorisé) à afficher.
 * @param {'success'|'error'|'info'|'warning'} [type='info'] - Niveau visuel.
 * @returns {void}
 */
/**
 * Affiche un message de notification sous forme de modale légère qui se ferme automatiquement.
 * Remplace le système d'alertes banner (v0.50) : plus visible, auto-dismiss à 2s.
 * @param {string} message  - Texte à afficher (HTML autorisé)
 * @param {'info'|'success'|'warning'|'error'} type - Type de notification
 * @param {number} [duration=2000] - Durée avant fermeture automatique (ms)
 * @returns {void}
 */
function showAlert(message, type = 'info', duration = 2000) {
    // Supprimer la modale précédente si elle existe encore
    const existing = document.getElementById('_toast-modal');
    if (existing) existing.remove();

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const colors = {
        success: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
        error:   { bg: '#fee2e2', border: '#ef4444', text: '#7f1d1d' },
        warning: { bg: '#fef3c7', border: '#f59e0b', text: '#78350f' },
        info:    { bg: '#dbeafe', border: '#3b82f6', text: '#1e3a8a' }
    };
    const c = colors[type] ?? colors.info;

    const toast = document.createElement('div');
    toast.id = '_toast-modal';
    toast.setAttribute('role', 'alert');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        min-width: 280px;
        max-width: min(480px, 90vw);
        padding: 14px 20px;
        background: ${c.bg};
        border: 2px solid ${c.border};
        border-radius: 10px;
        color: ${c.text};
        font-size: 15px;
        font-weight: 500;
        box-shadow: 0 8px 24px rgba(0,0,0,.18);
        display: flex;
        align-items: center;
        gap: 10px;
        opacity: 1;
        transition: opacity 0.3s ease;
        cursor: pointer;
    `;
    // Éviter le double icône : si le message commence déjà par l'icône du type, la supprimer
    const typeIcon = icons[type] ?? 'ℹ️';
    const cleanMessage = message.startsWith(typeIcon) ? message.slice(typeIcon.length).trimStart() : message;
    toast.innerHTML = `<span style="font-size:20px;flex-shrink:0">${typeIcon}</span><span>${cleanMessage}</span>`;

    // Fermeture manuelle au clic
    toast.addEventListener('click', () => _dismissToast(toast));

    document.body.appendChild(toast);

    // Fermeture automatique après `duration` ms
    const timer = setTimeout(() => _dismissToast(toast), duration);
    toast._dismissTimer = timer;
}

/**
 * Ferme la modale de notification avec animation de fondu.
 * @private
 * @param {HTMLElement} toast
 */
function _dismissToast(toast) {
    if (!toast || !toast.isConnected) return;
    clearTimeout(toast._dismissTimer);
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
}


// ══════════════════════════════════════════════════════════
// ESPACE DE NOMS Utils — fonctions pures
// ══════════════════════════════════════════════════════════

/**
 * @namespace Utils
 * @description Collection de fonctions utilitaires pures (pas d'effet de bord).
 */
const Utils = {

    // ── Formatage ──────────────────────────────────────────

    /**
     * Formate une date ISO en chaîne française DD/MM/YYYY.
     * @param {string|Date|null} date
     * @returns {string} Chaîne formatée ou '' si entrée nulle/invalide.
     * @example Utils.formaterDate('2026-03-07') // → '07/03/2026'
     */
    formaterDate(date) {
        if (!date) return '';
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },

    /**
     * Formate un nombre avec séparateur de milliers français.
     * @param {number|null} n
     * @returns {string} Valeur formatée ou '-' si nulle.
     * @example Utils.formaterNombre(12345) // → '12 345'
     */
    formaterNombre(n) {
        if (n == null || isNaN(n)) return '-';
        return n.toLocaleString('fr-FR');
    },

    // ── Texte ───────────────────────────────────────────────

    /**
     * Met la première lettre en majuscule, laisse le reste intact.
     * Préserve les acronymes de 2 à 6 caractères en majuscules (ex. LLCER, REP).
     * @param {string} texte
     * @returns {string}
     * @example Utils.normaliserCasse('mathématiques') // → 'Mathématiques'
     */
    normaliserCasse(texte) {
        if (!texte) return '';
        if (/^[A-ZÀÉÈÊÏÎÔÙÛÜ0-9]{2,6}$/.test(texte)) return texte;
        return texte.charAt(0).toUpperCase() + texte.slice(1);
    },

    /**
     * Supprime les diacritiques d'une chaîne (pour comparaison tolérante).
     * @param {string} texte
     * @returns {string}
     */
    supprimerAccents(texte) {
        return texte ? texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
    },

    /**
     * Vérifie si `texte` contient `terme` (insensible à la casse et aux accents).
     * @param {string} texte - Texte source.
     * @param {string} terme - Terme à chercher.
     * @returns {boolean}
     */
    contient(texte, terme) {
        if (!texte || !terme) return false;
        return this.supprimerAccents(texte.toLowerCase())
            .includes(this.supprimerAccents(terme.toLowerCase().trim()));
    },

    /**
     * Tronque un texte à `max` caractères et ajoute '…'.
     * @param {string} texte
     * @param {number} [max=100]
     * @returns {string}
     */
    tronquer(texte, max = 100) {
        if (!texte) return '';
        return texte.length > max ? texte.slice(0, max - 1) + '…' : texte;
    },

    // ── Tri ─────────────────────────────────────────────────

    /**
     * Trie un tableau d'objets par un champ, alphabétiquement.
     * Ne mute pas le tableau source.
     * @param {Object[]} liste
     * @param {string}   champ  - Clé de tri.
     * @param {'asc'|'desc'} [ordre='asc']
     * @returns {Object[]} Copie triée.
     * @example Utils.trierParChamp(etablissements, 'nom')
     */
    trierParChamp(liste, champ, ordre = 'asc') {
        if (!Array.isArray(liste)) return [];
        const s = ordre === 'asc' ? 1 : -1;
        return [...liste].sort((a, b) => {
            const va = this.supprimerAccents(String(a[champ] ?? '').toLowerCase());
            const vb = this.supprimerAccents(String(b[champ] ?? '').toLowerCase());
            return s * va.localeCompare(vb, 'fr');
        });
    },

    // ── Performance ─────────────────────────────────────────

    /**
     * Retourne une version « debounced » d'une fonction.
     * La fonction n'est exécutée qu'après `delai` ms sans nouvel appel.
     * @param {Function} fn
     * @param {number}   delai - Millisecondes.
     * @returns {Function}
     * @example const fn = Utils.debounce(() => search(), 300);
     */
    debounce(fn, delai) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delai);
        };
    },

    /**
     * Retourne une version « throttled » d'une fonction.
     * @param {Function} fn
     * @param {number}   delai - Intervalle minimum en ms.
     * @returns {Function}
     */
    throttle(fn, delai) {
        let last = 0;
        return function (...args) {
            const now = Date.now();
            if (now - last >= delai) { last = now; return fn.apply(this, args); }
        };
    },

    /**
     * Attend un délai en millisecondes (utilitaire async).
     * @param {number} ms
     * @returns {Promise<void>}
     */
    attendre(ms) { return new Promise(r => setTimeout(r, ms)); },

    // ── Téléchargement ──────────────────────────────────────

    /**
     * Déclenche le téléchargement d'un Blob dans le navigateur.
     * @param {Blob}   blob
     * @param {string} nomFichier
     * @returns {void}
     */
    telecharger(blob, nomFichier) {
        const url = URL.createObjectURL(blob);
        const a   = Object.assign(document.createElement('a'), { href: url, download: nomFichier });
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // ── Validation ──────────────────────────────────────────

    /**
     * Vérifie le format d'un code UAI (7 chiffres + 1 lettre majuscule).
     * @param {string} uai
     * @returns {boolean}
     * @example Utils.validerUai('0352660B') // → true
     */
    validerUai(uai) { return /^[0-9]{7}[A-Z]$/.test(uai ?? ''); },

    /**
     * Vérifie le format d'un code RNCP.
     * @param {string} rncp
     * @returns {boolean}
     * @example Utils.validerRncp('RNCP35974') // → true
     */
    validerRncp(rncp) { return /^RNCP\d{4,6}$/i.test(rncp ?? ''); },

    // ── Collections ─────────────────────────────────────────

    /**
     * Déduplique un tableau. Pour les objets, utilise une clé de déduplication.
     * @param {any[]}        tableau
     * @param {string|null}  [cle=null] - Champ de déduplication (objets).
     * @returns {any[]}
     * @example
     * Utils.dedupliquer(['a', 'b', 'a'])        // → ['a', 'b']
     * Utils.dedupliquer(objets, 'uai')           // → sans doublons UAI
     */
    dedupliquer(tableau, cle = null) {
        if (!Array.isArray(tableau)) return [];
        if (!cle) return [...new Set(tableau)];
        const vus = new Set();
        return tableau.filter(item => {
            const v = item[cle];
            if (vus.has(v)) return false;
            vus.add(v);
            return true;
        });
    },

    /**
     * Regroupe un tableau d'objets par la valeur d'un champ.
     * @param {Object[]} tableau
     * @param {string}   cle - Champ de regroupement.
     * @returns {Map<string, Object[]>}
     * @example
     * const parCommune = Utils.grouperPar(etablissements, 'commune');
     */
    grouperPar(tableau, cle) {
        const map = new Map();
        for (const item of tableau) {
            const k = String(item[cle] ?? '__inconnu__');
            if (!map.has(k)) map.set(k, []);
            map.get(k).push(item);
        }
        return map;
    },
};

// ══════════════════════════════════════════════════════════
// BANNIÈRE DE CHARGEMENT DES DONNÉES
// ══════════════════════════════════════════════════════════

/**
 * Affiche une bannière discrète "Chargement des données…" si localStorage
 * contient des données à charger. La bannière disparaît quand db:ready est émis.
 * @private
 */
function _showLoadingBannerIfNeeded() {
    // Vérifier rapidement si localStorage contient quelque chose (juste la longueur, sans parse)
    const storedSize = localStorage.getItem('parcours_avenir')?.length ?? 0;
    if (storedSize < 100) return; // Rien à charger

    const banner = document.createElement('div');
    banner.id = 'db-loading-banner';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    banner.innerHTML = `
        <div class="db-loading-banner__inner">
            <span class="db-loading-banner__spinner" aria-hidden="true"></span>
            <span class="db-loading-banner__text">Chargement des données…</span>
            <span class="db-loading-banner__size">(${Math.round(storedSize / 1024)} Ko)</span>
        </div>
    `;
    document.body.appendChild(banner);
}

/**
 * Appelé quand l'événement db:ready est émis.
 * Masque la bannière de chargement et rafraîchit l'onglet actif si nécessaire.
 * @private
 */
function _onDbReady() {
    const t0 = performance.now();
    // Masquer la bannière avec animation
    const banner = document.getElementById('db-loading-banner');
    if (banner) {
        banner.classList.add('db-loading-banner--hidden');
        setTimeout(() => banner.remove(), 400);
    }

    console.log('[INIT] ✅ Données chargées depuis localStorage, rafraîchissement de la vue…');

    // Rafraîchir l'onglet actif si les résultats ou la carte sont affichés
    const activeBtn = document.querySelector('.tabs__item--active');
    const activeTab = activeBtn?.dataset?.tab;

    if (activeTab === 'resultats') {
        // Appeler initResultsTab : attache filtres + charge stats + vue
        if (typeof window.initResultsTab === 'function') {
            window.initResultsTab().then(() => {
                _dbReadyRendered = true; // marquer APRÈS le rendu
                console.log(`[INIT] ⏱️ _onDbReady render: ${Math.round(performance.now()-t0)}ms`);
            });
        }
    } else if (activeTab === 'carte') {
        if (typeof window.loadMarkers === 'function') window.loadMarkers();
        _dbReadyRendered = true;
    }
}

// ══════════════════════════════════════════════════════════
// EXPOSITION GLOBALE
// ══════════════════════════════════════════════════════════
if (typeof window !== 'undefined') {
    window.init      = init;
    window.showAlert = showAlert;
    window.Utils     = Utils;
}
