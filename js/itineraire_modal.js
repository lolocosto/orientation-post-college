/************************************************
 * Fichier : itineraire_modal.js
 * Description : Modale itinéraire — calcul via redirection Google Maps
 * Auteur : Laurent COSTE / Claude
 * Date : 2026-02-21
 * Version : 1.0 (v0.43)
 *
 * Fonctionnement :
 *   - Départ : domicile (pref_user_domicile) ou établissement (pref_user_etablissement)
 *   - Destination : établissement cible (latitude/longitude depuis la BDD)
 *   - Mode : voiture | transports en commun | marche à pied
 *   - Calcul → window.open(googleMapsUrl)  (aucune clé API requise)
 ************************************************/

/**
 * Ouvre la modale itinéraire pour un établissement donné.
 * @param {Object} params
 * @param {string}  params.nom       - Nom de l'établissement cible
 * @param {number}  params.latitude  - Latitude de l'établissement cible
 * @param {number}  params.longitude - Longitude de l'établissement cible
 */
function openItineraireModal({ nom, latitude, longitude }) {

    // ── Vérifier que la destination a des coordonnées ───────────────────
    if (!latitude || !longitude || isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) {
        showAlert('❌ Coordonnées GPS manquantes pour cet établissement', 'error');
        return;
    }

    const destLat = parseFloat(latitude);
    const destLon = parseFloat(longitude);

    // ── Charger les points de départ disponibles ────────────────────────
    const domicile    = _loadDomicile();
    const etablissement = _loadEtablissement();

    const hasDomicile    = domicile    && domicile.latitude    && domicile.longitude;
    const hasEtablissement = etablissement && etablissement.latitude && etablissement.longitude;

    if (!hasDomicile && !hasEtablissement) {
        showAlert('⚠️ Veuillez d\'abord renseigner votre domicile ou votre établissement dans les paramètres (⚙️)', 'warning');
        return;
    }

    // ── Construire le contenu de la modale ──────────────────────────────
    const defaultDepart = hasDomicile ? 'domicile' : 'etablissement';

    const optionDomicile = hasDomicile
        ? `<label class="itineraire-option">
               <input type="radio" name="itineraire-depart" value="domicile" ${defaultDepart === 'domicile' ? 'checked' : ''}>
               <span class="itineraire-option-label">🏠 Mon domicile <span class="itineraire-option-detail">${domicile.nom || domicile.adresse || ''}</span></span>
           </label>`
        : `<div class="itineraire-option itineraire-option--disabled">
               🏠 Mon domicile <span class="itineraire-option-detail u-text-help">Non renseigné dans les paramètres</span>
           </div>`;

    const optionEtablissement = hasEtablissement
        ? `<label class="itineraire-option">
               <input type="radio" name="itineraire-depart" value="etablissement" ${defaultDepart === 'etablissement' ? 'checked' : ''}>
               <span class="itineraire-option-label">📒 Mon établissement <span class="itineraire-option-detail">${etablissement.nom || ''}</span></span>
           </label>`
        : `<div class="itineraire-option itineraire-option--disabled">
               📒 Mon établissement <span class="itineraire-option-detail u-text-help">Non renseigné dans les paramètres</span>
           </div>`;

    const content = `
        <div class="itineraire-modal-content">

            <!-- Destination -->
            <div class="itineraire-section">
                <div class="itineraire-section-title">🎯 Destination</div>
                <div class="itineraire-destination">${nom}</div>
            </div>

            <!-- Point de départ -->
            <div class="itineraire-section">
                <div class="itineraire-section-title">📍 Point de départ</div>
                <div class="itineraire-options">
                    ${optionDomicile}
                    ${optionEtablissement}
                </div>
            </div>

            <!-- Mode de transport -->
            <div class="itineraire-section">
                <div class="itineraire-section-title">🚦 Mode de transport</div>
                <div class="itineraire-modes">
                    <label class="itineraire-mode">
                        <input type="radio" name="itineraire-mode" value="driving" checked>
                        <span class="itineraire-mode-icon">🚗</span>
                        <span class="itineraire-mode-label">Voiture</span>
                    </label>
                    <label class="itineraire-mode">
                        <input type="radio" name="itineraire-mode" value="transit">
                        <span class="itineraire-mode-icon">🚌</span>
                        <span class="itineraire-mode-label">Transports en commun</span>
                    </label>
                    <label class="itineraire-mode">
                        <input type="radio" name="itineraire-mode" value="walking">
                        <span class="itineraire-mode-icon">🚶</span>
                        <span class="itineraire-mode-label">À pied</span>
                    </label>
                    <label class="itineraire-mode">
                        <input type="radio" name="itineraire-mode" value="bicycling">
                        <span class="itineraire-mode-icon">🚲</span>
                        <span class="itineraire-mode-label">Vélo</span>
                    </label>
                </div>
            </div>

            <!-- Bouton calculer -->
            <div class="itineraire-actions">
                <button class="btn btn--primary itineraire-btn-calculer"
                        onclick="window._itineraireCalculer(${destLat}, ${destLon})">
                    🗺️ Ouvrir dans Google Maps
                </button>
            </div>

            <div class="itineraire-info u-text-help">
                💡 S'ouvre dans un nouvel onglet — ou dans l'app Maps sur mobile
            </div>
        </div>
    `;

    // ── Créer et ouvrir la modale ───────────────────────────────────────
    const modal = new Modal('itineraire-modal-' + Date.now());
    modal.setTitle('🗺️ Itinéraire vers ' + nom);
    modal.setContent(content);
    modal.open();

    // Stocker référence pour le bouton calculer
    window._itineraireModal = modal;

    // ── Fonction de calcul (injectée sur window pour l'onclick) ─────────
    window._itineraireCalculer = function(dstLat, dstLon) {
        const departRadio = document.querySelector('input[name="itineraire-depart"]:checked');
        const modeRadio   = document.querySelector('input[name="itineraire-mode"]:checked');

        if (!departRadio) {
            showAlert('⚠️ Veuillez sélectionner un point de départ', 'warning');
            return;
        }

        const mode = modeRadio ? modeRadio.value : 'driving';

        // Récupérer les coordonnées du départ
        let srcLat, srcLon;
        if (departRadio.value === 'domicile') {
            const d = _loadDomicile();
            srcLat = d?.latitude;
            srcLon = d?.longitude;
        } else {
            const e = _loadEtablissement();
            srcLat = e?.latitude;
            srcLon = e?.longitude;
        }

        if (!srcLat || !srcLon) {
            showAlert('❌ Coordonnées du point de départ introuvables', 'error');
            return;
        }

        // Construire URL Google Maps (interface publique, sans clé API)
        const url = `https://www.google.com/maps/dir/?api=1` +
                    `&origin=${encodeURIComponent(srcLat + ',' + srcLon)}` +
                    `&destination=${encodeURIComponent(dstLat + ',' + dstLon)}` +
                    `&travelmode=${mode}`;

        window.open(url, '_blank', 'noopener,noreferrer');

        // Fermer la modale après ouverture
        if (window._itineraireModal) {
            window._itineraireModal.close();
            window._itineraireModal = null;
        }
    };
}

// ── Helpers lecture localStorage ─────────────────────────────────────────────

function _loadDomicile() {
    try {
        const s = localStorage.getItem('pref_user_domicile');
        return s ? JSON.parse(s) : null;
    } catch { return null; }
}

function _loadEtablissement() {
    try {
        const s = localStorage.getItem('pref_user_etablissement');
        return s ? JSON.parse(s) : null;
    } catch { return null; }
}

// ── Exposition globale ────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
    window.openItineraireModal = openItineraireModal;
}
