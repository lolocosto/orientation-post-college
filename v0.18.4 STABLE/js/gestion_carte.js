/************************************************
 * Fichier : gestion_carte.js
 * Description : Gestion de la carte Leaflet et des marqueurs
 * Auteur : Laurent COSTE
 * Date : 2026-02-01
 ************************************************/

/** Variables globales **/
let map = null;
let markersLayer = null;
let userMarker = null;

/** Initialise la carte Leaflet **/
function initMap() {
    if (map) return; // Déjà initialisée
    
    console.log('🗺️ Initialisation carte Leaflet...');
    
    // Créer la carte centrée sur la France
    map = L.map('map').setView([46.603354, 1.888334], 6);
    
    // Ajouter le fond de carte OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
        minZoom: 5
    }).addTo(map);
    
    // Créer le layer pour les marqueurs
    markersLayer = L.layerGroup().addTo(map);
    
    console.log('✅ Carte initialisée');
}

/** Crée une icône HTML personnalisée pour Leaflet **/
function createCustomIcon(emoji, isUser = false) {
    return L.divIcon({
        html: `<div class="marker-icon ${isUser ? 'marker-icon-user' : ''}">${emoji}</div>`,
        className: '', // Pas de classe par défaut Leaflet
        iconSize: isUser ? [35, 35] : [30, 30],
        iconAnchor: isUser ? [17, 17] : [15, 15],
        popupAnchor: [0, isUser ? -17 : -15]
    });
}

/** Crée le contenu HTML de la popup **/
function createPopupContent(lycee) {
    // Compter diplômes directement via SQL
    let diplomesCount = 0;
    try {
        const result = db.exec(`SELECT COUNT(*) FROM diplomes_par_lycee WHERE lycee_uai = ?`, [lycee.code_uai]);
        diplomesCount = result[0]?.values[0][0] || 0;
    } catch (e) {
        console.warn('Erreur comptage diplômes:', e);
    }
    
    return `
        <div class="map-popup">
            <div class="map-popup-header">
                ${getEtablissementIcon(lycee.type_etablissement)} ${lycee.nom}
            </div>
            <div class="map-popup-body">
                <div class="map-popup-row">
                    <span class="map-popup-label">📍 Adresse:</span>
                    ${lycee.adresse}, ${lycee.code_postal} ${lycee.commune}
                </div>
                <div class="map-popup-row">
                    <span class="map-popup-label">🏛️ Type:</span>
                    ${lycee.type_etablissement || 'Non spécifié'}
                </div>
                <div class="map-popup-row">
                    <span class="map-popup-label">🎓 Diplômes:</span>
                    ${diplomesCount} diplôme(s)
                </div>
                ${lycee.telephone ? `
                <div class="map-popup-row">
                    <span class="map-popup-label">📞</span>
                    ${lycee.telephone}
                </div>` : ''}
                <div class="map-popup-actions">
                    <a class="map-popup-btn" onclick="showLyceeDetailsCarte('${lycee.code_uai}'); return false;">
                    📋 Voir la fiche complète</a>
                </div>
            </div>
        </div>
    `;
}

/** Icône selon type établissement **/
function getEtablissementIcon(type) {
    if (!type) return '🏫';
    const typeLower = type.toLowerCase();
    if (typeLower.includes('professionnel')) return '🏭';
    if (typeLower.includes('technologique')) return '🔬';
    if (typeLower.includes('agricole')) return '🌾';
    if (typeLower.includes('polyvalent')) return '🏫';
    return '🏫';
}

/** Charge les établissements sur la carte **/
function loadMapMarkers() {
    if (!map) {
        console.warn('⚠️ Carte non initialisée');
        return;
    }
    
    console.log('📍 Chargement marqueurs...');
    
    // Vider les marqueurs existants
    markersLayer.clearLayers();
    
    // Récupérer tous les lycées avec coordonnées GPS
    const query = `
        SELECT uai, nom, adresse, code_postal, commune, type, longitude_x, latitude_y, telephone
        FROM lycees
        WHERE latitude_y IS NOT NULL AND longitude_x IS NOT NULL
    `;
    const result = db.exec(query);
    
    if (!result || result.length === 0) {
        console.log('ℹ️ Aucun établissement avec coordonnées GPS');
        updateMapStats(0, 0);
        return;
    }
    
    const lycees = result[0].values.map(row => ({
        code_uai: row[0],  // uai
        nom: row[1],
        adresse: row[2],
        code_postal: row[3],
        commune: row[4],
        type_etablissement: row[5],  // type
        longitude: row[6],  // longitude_x
        latitude: row[7],   // latitude_y
        telephone: row[8]
    }));
    
    console.log(`📍 ${lycees.length} établissements à afficher`);
    
    // Bounds pour auto-zoom
    const bounds = [];
    let visibleCount = 0;
    
    // Créer un marqueur pour chaque lycée
    lycees.forEach(lycee => {
        // Vérifier validité coordonnées
        if (!lycee.latitude || !lycee.longitude) return;
        if (lycee.latitude < -90 || lycee.latitude > 90) return;
        if (lycee.longitude < -180 || lycee.longitude > 180) return;
        
        const emoji = getEtablissementIcon(lycee.type_etablissement);
        console.log(`🎨 Marqueur: ${lycee.nom} - Type: "${lycee.type_etablissement}" - Emoji: ${emoji}`);
        const icon = createCustomIcon(emoji);
        
        const marker = L.marker([lycee.latitude, lycee.longitude], { icon: icon })
            .bindPopup(createPopupContent(lycee), {maxWidth: 350,className: 'custom-popup'})
            .addTo(markersLayer);
        
        // Tooltip au survol
        marker.bindTooltip(lycee.nom, {direction: 'top',offset: [0, -15],opacity: 0.9});
        
        bounds.push([lycee.latitude, lycee.longitude]);
        visibleCount++;
    });
    
    // Auto-zoom sur les marqueurs
    if (bounds.length > 0) {
        map.fitBounds(bounds, {padding: [50, 50],maxZoom: 13});
    }
    
    updateMapStats(lycees.length, visibleCount);
    loadUserMarker(); // Charger marqueur utilisateur si défini
    
    console.log(`✅ ${visibleCount} marqueurs affichés`);
}

/** Charge le marqueur de l'établissement utilisateur **/
function loadUserMarker() {
    console.log('🔍 loadUserMarker appelée');
    
    // Supprimer ancien marqueur utilisateur
    if (userMarker) {
        map.removeLayer(userMarker);
        userMarker = null;
    }
    
    // Récupérer établissement utilisateur depuis préférences
    const stored = localStorage.getItem('pref_user_etablissement');
    console.log('📦 localStorage pref_user_etablissement:', stored);
    
    if (!stored) {
        console.log('❌ Pas de données établissement dans localStorage');
        updateMapStats(null, null, '-');
        return;
    }
    
    let etablissement;
    try {
        etablissement = JSON.parse(stored);
        console.log('✅ Établissement parsé:', etablissement);
    } catch (e) {
        console.error('❌ Erreur parsing préférences:', e);
        updateMapStats(null, null, '❌');
        return;
    }
    
    // Vérifier que les données essentielles sont présentes
    console.log('🔍 Vérification données:', {
        nom: etablissement.nom,
        latitude: etablissement.latitude,
        longitude: etablissement.longitude,
        latitude_type: typeof etablissement.latitude,
        longitude_type: typeof etablissement.longitude
    });
    
    if (!etablissement.nom || !etablissement.latitude || !etablissement.longitude) {
        console.error('❌ Données établissement utilisateur incomplètes');
        console.error('   nom:', etablissement.nom);
        console.error('   latitude:', etablissement.latitude);
        console.error('   longitude:', etablissement.longitude);
        updateMapStats(null, null, '❌');
        return;
    }
    
    // Validation coordonnées
    const lat = parseFloat(etablissement.latitude);
    const lon = parseFloat(etablissement.longitude);
    
    console.log('🔍 Coordonnées converties:', { lat, lon });
    
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        console.error('❌ Coordonnées GPS invalides');
        console.error('   lat:', lat, 'lon:', lon);
        updateMapStats(null, null, '❌');
        return;
    }
        
    // Créer marqueur spécial utilisateur
    console.log('✅ Coordonnées valides, création du marqueur...');
    const icon = createCustomIcon('📒', true);
    
    userMarker = L.marker([lat, lon], { icon: icon })
        .bindPopup(`
            <div class="map-popup">
                <div class="map-popup-header" style="background: #ff9800;">
                    📒 MON ÉTABLISSEMENT
                </div>
                <div class="map-popup-body">
                    <div class="map-popup-row">
                        <strong>${etablissement.nom}</strong>
                    </div>
                    ${etablissement.uai ? `
                    <div class="map-popup-row">
                        <span class="map-popup-label">ðŸ”¢ UAI:</span>
                        ${etablissement.uai}
                    </div>` : ''}
                    <div class="map-popup-row">
                        <span class="map-popup-label">📍 Coordonnées:</span>
                        ${lat.toFixed(6)}, ${lon.toFixed(6)}
                    </div>
                </div>
            </div>
        `, {maxWidth: 350})
        .addTo(map);
    console.log('✅ Marqueur ajouté à la carte');
    
    // Tooltip permanent
    userMarker.bindTooltip('📒 Mon établissement', {
        permanent: false,
        direction: 'top',
        offset: [0, -17],
        opacity: 0.9
    });
    
    updateMapStats(null, null, '✅');
    console.log(`✅ Marqueur utilisateur finalisé: ${etablissement.nom} (${lat}, ${lon})`);
}

/** Met à jour les statistiques de la carte **/
function updateMapStats(total, visible, userStatus) {
    if (total !== null && total !== undefined) {
        document.getElementById('map-stat-total').textContent = total;
    }
    if (visible !== null && visible !== undefined) {
        document.getElementById('map-stat-visible').textContent = visible;
    }
    if (userStatus !== null && userStatus !== undefined) {
        document.getElementById('map-stat-user').textContent = userStatus;
    }
}

/** Recentre la carte sur l'établissement utilisateur **/
function centerOnUserEstablishment() {
    if (!userMarker) {
        showAlert('⚠️ Aucun établissement utilisateur défini', 'warning');
        return;
    }
    
    const latlng = userMarker.getLatLng();
    map.setView(latlng, 14, { animate: true });
    userMarker.openPopup();
}

/** Recharge la carte (appelé quand on change d'onglet) **/
function refreshMap() {
    if (!map) {
        initMap();
    }
    
    // Forcer recalcul taille (bug Leaflet dans onglets)
    setTimeout(() => {
        map.invalidateSize();
        loadMapMarkers();
    }, 100);
}

// Initialiser la carte quand on clique sur l'onglet Carte
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier que switchTab existe avant de l'envelopper
    if (typeof window.switchTab === 'function') {
        const originalSwitchTab = window.switchTab;
        window.switchTab = function(tabName) {
            originalSwitchTab(tabName);
            
            if (tabName === 'carte') {
                refreshMap();
            }
        };
    }
});
