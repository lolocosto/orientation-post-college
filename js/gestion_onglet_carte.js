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

/**
 * Initialise la carte Leaflet
 */
function initMap() {
    console.log('[Carte] 🗺️ Appel initMap()');
    console.log('[Carte] ═══════════════════════════════════════════════════════');
    
    // Vérification des éléments DOM
    const mapElement = document.getElementById('map');
    const mapContainer = document.getElementById('map-container');
    const tabCarte = document.getElementById('tab-carte');
    
    console.log('[Carte] 📦 Vérification éléments DOM:');
    console.log(`  ├─ #map: ${mapElement ? '✅ trouvé' : '❌ NON TROUVÉ'}`);
    console.log(`  ├─ #map-container: ${mapContainer ? '✅ trouvé' : '❌ NON TROUVÉ'}`);
    console.log(`  └─ #tab-carte: ${tabCarte ? '✅ trouvé' : '❌ NON TROUVÉ'}`);
    
    if (!mapElement) {
        console.error('[Carte] ❌ Élément #map introuvable! Abandon.');
        return;
    }
    
    // Vérification des dimensions
    const rect = mapElement.getBoundingClientRect();
    console.log(`[Carte] 📏 Dimensions #map:`);
    console.log(`  ├─ width: ${rect.width}px`);
    console.log(`  ├─ height: ${rect.height}px`);
    console.log(`  ├─ top: ${rect.top}px`);
    console.log(`  └─ left: ${rect.left}px`);
    
    // Vérification des styles computed
    const computedStyle = getComputedStyle(mapElement);
    console.log(`[Carte] 🎨 Styles #map:`);
    console.log(`  ├─ display: ${computedStyle.display}`);
    console.log(`  ├─ visibility: ${computedStyle.visibility}`);
    console.log(`  ├─ opacity: ${computedStyle.opacity}`);
    console.log(`  └─ z-index: ${computedStyle.zIndex}`);
    
    // Vérification tab-carte
    if (tabCarte) {
        const tabClassList = Array.from(tabCarte.classList).join(', ');
        const tabComputed = getComputedStyle(tabCarte);
        console.log(`[Carte] 👁️ Visibilité tab-carte:`);
        console.log(`  ├─ classList: ${tabClassList}`);
        console.log(`  ├─ display: ${tabComputed.display}`);
        console.log(`  ├─ visibility: ${tabComputed.visibility}`);
        console.log(`  └─ has u-hidden: ${tabCarte.classList.contains('u-hidden')}`);
        console.log(`  └─ has tabs__panel--hidden: ${tabCarte.classList.contains('tabs__panel--hidden')}`);
        
        if (tabClassList.includes('hidden')) {
            console.warn('[Carte] ⚠️ tab-carte a une classe "hidden", la carte ne sera peut-être pas visible');
        }
    }
    
    // Vérification si déjà initialisée
    if (map) {
        console.log('[Carte] ♻️ Carte déjà initialisée, réutilisation');
        map.invalidateSize();
        console.log('[Carte] ✅ Taille de la carte invalidée (refresh)');
        loadMapMarkers();
        return;
    }
    
    console.log('[Carte] 📍 Élément #map trouvé, création carte...');
    
    try {
        // Création de la carte centrée sur la France
        map = L.map('map', {
            center: [46.603354, 1.888334],
            zoom: 6,
            zoomControl: true,
            attributionControl: true
        });
        
        console.log('[Carte] 🗺️ Instance Leaflet créée');
        
        // Ajout de la couche de tuiles OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);
        console.log('[Carte] 🖼️ Couche de tuiles ajoutée');
        
        // Créer le layer pour les marqueurs
        markersLayer = L.layerGroup().addTo(map);
        console.log('[Carte] ✅ Carte Leaflet initialisée avec succès');
        
        // ✅ Forcer l'invalidation après un délai (fix classique Leaflet)
        setTimeout(() => {
            if (map) {
                console.log('[Carte] 🔄 Invalidation forcée de la carte (après 250ms)');
                map.invalidateSize();
                
                // Double vérification des dimensions
                const newRect = mapElement.getBoundingClientRect();
                console.log(`[Carte] 📏 Dimensions après invalidation: ${newRect.width}px × ${newRect.height}px`);
                
                if (newRect.width === 0 || newRect.height === 0) {
                    console.error('[Carte] ❌ Dimensions toujours nulles après invalidation!');
                    console.error('[Carte]    Vérifier les styles CSS de #map et #map-container');
                }
            }
        }, 250);
        
        // Chargement des marqueurs
        loadMapMarkers();
        
    } catch (error) {
        console.error('[Carte] ❌ Erreur lors de l\'initialisation:', error);
        console.error('[Carte]    Stack:', error.stack);
    }
    
    console.log('[Carte] ═══════════════════════════════════════════════════════');
}

/** Crée une icône HTML personnalisée pour Leaflet **/
function createCustomIcon(emoji, isUser = false, voie = 'scolaire') {
    let voieClass = '';
    if (!isUser) {
        if (voie === 'apprentissage') voieClass = 'marker-icon--apprentissage';
        else if (voie === 'mixte')    voieClass = 'marker-icon--mixte';
        else                          voieClass = 'marker-icon--scolaire';
    }
    return L.divIcon({
        html: `<div class="marker-icon ${isUser ? 'marker-icon-user' : voieClass}">${emoji}</div>`,
        className: '', // Pas de classe par défaut Leaflet
        iconSize: isUser ? [35, 35] : [30, 30],
        iconAnchor: isUser ? [17, 17] : [15, 15],
        popupAnchor: [0, isUser ? -17 : -15]
    });
}

/** Crée le contenu HTML de la popup **/
function createPopupContent(lycee) {
    // Compter les diplômes via la base (scolaire + apprentissage)
    let diplomesCount = 0;
    let apprentissageCount = 0;
    try {
        if (window.databaseService) {
            diplomesCount    = window.databaseService.getDiplomesParEtablissementSync(lycee._id)?.length || 0;
            apprentissageCount = window.databaseService.getDiplomesApprentissageParEtablissementSync(lycee._id)?.length || 0;
        }
    } catch (e) { /* silencieux */ }

    const totalCount    = diplomesCount + apprentissageCount;
    let diplomesDetail  = '';
    if (diplomesCount > 0 && apprentissageCount > 0) {
        diplomesDetail = ` <span style="font-size:0.85em;color:#777;">(🏫 ${diplomesCount} sco. / 🎓 ${apprentissageCount} appr.)</span>`;
    }

    return `
        <div class="map-popup">
            <div class="map-popup-header">
                ${getEtablissementIcon(lycee.type)} ${lycee.nom}
            </div>
            <div class="map-popup-body">
                <div class="map-popup-row">
                    <span class="map-popup-label">📍 Adresse:</span>
                    ${lycee.adresse}, ${lycee.codePostal} ${lycee.commune}
                </div>
                <div class="map-popup-row">
                    <span class="map-popup-label">🏛️ Type:</span>
                    ${lycee.type || 'Non spécifié'}
                </div>
                <div class="map-popup-row">
                    <span class="map-popup-label">🎓 Diplômes:</span>
                    ${totalCount} diplôme(s)${diplomesDetail}
                </div>
                ${lycee.telephone ? `
                <div class="map-popup-row">
                    <span class="map-popup-label">📞</span>
                    ${lycee.telephone}
                </div>` : ''}
                <div class="map-popup-actions">
                    <a class="map-popup-btn" onclick="showLyceeDetailsCarte('${lycee._id}'); return false;">
                    📋 Voir la fiche complète</a>
                    <a class="map-popup-btn map-popup-btn--secondary" onclick="openItineraireModal({nom: '${lycee.nom.replace(/'/g, "\\'")}', latitude: ${lycee.latitude}, longitude: ${lycee.longitude}}); return false;">
                    🗺️ Itinéraire</a>
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
async function loadMapMarkers() {
    if (!map) {
        console.warn('⚠️ Carte non initialisée');
        return;
    }
    
    console.log('📍 Chargement marqueurs...');
    
    // Vider les marqueurs existants
    markersLayer.clearLayers();
    
    // Vérifier DatabaseService
    if (!window.databaseService) {
        console.error('⚠️ DatabaseService non initialisé');
        updateMapStats(0, 0);
        return;
    }
    
    // Récupérer tous les établissements avec coordonnées GPS
    const allEtablissements = await window.databaseService.getAllEtablissements();
    const lycees = allEtablissements.filter(etab => 
        etab.latitude != null && etab.longitude != null
    );
    
    if (lycees.length === 0) {
        console.log('ℹ️ Aucun établissement avec coordonnées GPS');
        updateMapStats(0, 0);
        return;
    }
    
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
        
        const emoji = getEtablissementIcon(lycee.type);
        // Déterminer la voie pour la couleur du marqueur
        const voies = lycee.voies || ['scolaire'];
        const voieMarqueur = (voies.includes('scolaire') && voies.includes('apprentissage')) ? 'mixte'
                           : voies.includes('apprentissage') ? 'apprentissage'
                           : 'scolaire';
        console.log(`🎨 Marqueur: ${lycee.nom} - Type: "${lycee.type}" - Voie: ${voieMarqueur}`);
        const icon = createCustomIcon(emoji, false, voieMarqueur);
        
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

/** Affiche les détails d'un établissement depuis la carte **/
function showLyceeDetailsCarte(id) {
    console.log('[Carte] Affichage détails établissement:', id);
    
    if (typeof showEtablissementDetails === 'function') {
        showEtablissementDetails(id);
    } else {
        console.error('[Carte] Fonction showEtablissementDetails non disponible');
    }
}
