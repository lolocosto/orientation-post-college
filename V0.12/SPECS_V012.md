# 🎯 Spécifications v0.12 - Refonte Architecture UX

## 📋 Vue d'Ensemble

### Objectifs Principaux
1. ✅ Intégrer les CFA et formations en alternance
2. 🎨 Refonte complète de l'architecture interface
3. 🗂️ Système d'onglets dans le panneau principal

---

## 1️⃣ CFA et Formations en Alternance

### 🎯 Problème à Résoudre
**Actuellement** : Les CFA sont filtrés/exclus
**Impact** : On rate les CAP, BAC Pro, BTS en alternance

### ✅ Solution Proposée

#### A. Modifier le Filtre Établissements Supérieur

**Fichier** : `searchStructures()` ligne ~1485

**Code Actuel** :
```javascript
const motsSuperieur = [
    'université', 'universite', 'faculté', 'faculte',
    'iut ', 'i.u.t', 'institut universitaire',
    'ecole superieure', 'école supérieure',
    'grande ecole', 'grande école',
    'campus', 'ufr ', 'u.f.r'
];
```

**Nouveau Code** :
```javascript
// Mots-clés du supérieur STRICT (à exclure)
const motsSuperieur = [
    'université', 'universite', 'faculté', 'faculte',
    'iut ', 'i.u.t', 'institut universitaire',
    'ufr ', 'u.f.r'
];

// Mots-clés CFA/Apprentissage (à INCLURE)
const motsCFA = [
    'cfa', 'c.f.a', 'centre de formation',
    'ufa', 'u.f.a', 'apprentissage',
    'alternance', 'cfai', 'cfaa'
];

const isSuperieur = motsSuperieur.some(mot => type.includes(mot) || nom.includes(mot));
const isCFA = motsCFA.some(mot => type.includes(mot) || nom.includes(mot));

// Garder si c'est un CFA OU si ce n'est pas du supérieur
return isCFA || !isSuperieur;
```

#### B. Affichage des Formations Alternance

**Badge visuel** dans la liste des établissements :
```html
<span class="badge badge-alternance">🔄 Alternance</span>
```

**Style CSS** :
```css
.badge-alternance {
    background: #FF6B35;
    color: white;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
}
```

### 🧪 Tests à Prévoir

1. **Extraction Bruz (35)**
   - ✅ CFA apparaissent
   - ✅ Badge "Alternance" visible
   - ✅ Diplômes CAP/BAC Pro en alternance listés

2. **Extraction Grande Ville**
   - ✅ Universités/IUT toujours exclus
   - ✅ CFA inclus
   - ✅ UFA de lycées incluses

3. **Vérification Diplômes**
   - ✅ CAP, BAC Pro, BTS en alternance visibles
   - ✅ Mention "alternance" dans description

---

## 2️⃣ Refonte Architecture Interface

### 🎨 Nouvelle Organisation

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (logo, titre, stats cards)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PANNEAU PRINCIPAL                                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📑 Onglets:  [Recherche] [Résultats] [Carte]          │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │  Contenu de l'onglet actif                           │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘

☰ Panneau Latéral (hamburger)
├─ ⚙️ Paramètres Onisep
│  ├─ Email
│  ├─ Mot de passe
│  ├─ App ID
│  └─ Auto-connexion
├─ 📊 Mes Bases de Données
│  ├─ Importer
│  ├─ Exporter
│  └─ Vider
└─ 💾 Mes Favoris
   ├─ Critères sauvegardés
   └─ Gestion favoris
```

---

## 3️⃣ Panneau Latéral - Paramètres Uniquement

### 📋 Contenu du Panneau Latéral

#### Section 1 : Authentification Onisep ⚙️
**Objectif** : Paramètres de connexion (saisis 1 fois)

```
┌─────────────────────────────────────┐
│ ⚙️ Paramètres Onisep                │
├─────────────────────────────────────┤
│ Email : [____________]              │
│ Mot de passe : [____________]       │
│ App ID : [____________]             │
│ ☐ Auto-connexion au démarrage      │
│                                     │
│ [💾 Enregistrer]                    │
└─────────────────────────────────────┘
```

**Fonctionnalités** :
- Sauvegarde en localStorage
- Auto-connexion optionnelle
- Validation des credentials

---

#### Section 2 : Gestion des Bases de Données 📊

```
┌─────────────────────────────────────┐
│ 📊 Mes Bases de Données             │
├─────────────────────────────────────┤
│ Base actuelle :                     │
│ lycees_35.db (128 établissements)  │
│ Dernière MAJ : 28/01/2026 14:30    │
│                                     │
│ [📥 Importer une base]              │
│ [📤 Exporter la base]               │
│ [🗑️ Vider la base]                  │
│                                     │
│ Bases récentes :                    │
│ • lycees_35.db (128 étab.)         │
│ • lycees_rennes.db (43 étab.)      │
└─────────────────────────────────────┘
```

**Fonctionnalités** :
- Import/Export bases SQLite
- Liste bases récentes (localStorage)
- Statistiques base active
- Confirmation avant suppression

---

#### Section 3 : Mes Recherches Favorites 💾

```
┌─────────────────────────────────────┐
│ 💾 Recherches Favorites             │
├─────────────────────────────────────┤
│ ⭐ Rennes Métropole                 │
│    📍 43 communes                   │
│    [🔍 Lancer] [✏️ Renommer] [🗑️]  │
│                                     │
│ ⭐ Diplômes BTS - Académie Rennes   │
│    🎓 Académie Rennes               │
│    [🔍 Lancer] [✏️ Renommer] [🗑️]  │
│                                     │
│ [+ Sauvegarder la recherche actuelle] │
└─────────────────────────────────────┘
```

**Fonctionnalités** :
- Sauvegarder critères de recherche
- Renommer favoris
- Lancer recherche d'un clic
- Gérer (modifier, supprimer)

---

#### Section 4 : À Propos ℹ️

```
┌─────────────────────────────────────┐
│ ℹ️ À Propos                         │
├─────────────────────────────────────┤
│ Gestionnaire d'Établissements v0.12│
│                                     │
│ Sources de données :                │
│ • API Onisep                        │
│ • data.education.gouv.fr            │
│                                     │
│ [📖 Guide d'utilisation]            │
│ [🐛 Signaler un bug]                │
└─────────────────────────────────────┘
```

---

## 4️⃣ Panneau Principal - Système d'Onglets

### 🗂️ Onglet 1 : Recherche 🔍

**Contenu** : Tous les critères de recherche actuellement dans le panneau latéral

```
┌─────────────────────────────────────────────────────────────┐
│ 📑 [Recherche] [Résultats] [Carte]                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🔍 RECHERCHE D'ÉTABLISSEMENTS                              │
│                                                              │
│  ┌─ Mode de Recherche ─────────────────────────────────┐   │
│  │ ○ Recherche Géographique                            │   │
│  │ ○ Recherche par Diplômes                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─ Recherche Géographique ─────────────────────────────┐   │
│  │                                                       │   │
│  │  Rechercher une commune :                            │   │
│  │  [_____________________] 🔍                           │   │
│  │                                                       │   │
│  │  📍 Rennes                                           │   │
│  │  🏙️ Fait partie de : Rennes Métropole               │   │
│  │  [📍 Commune seule] [🏙️ Toute la métropole]         │   │
│  │                                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [💾 Sauvegarder cette recherche] [🌐 Lancer l'extraction]  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Sections** :
1. **Choix du Mode** : Radio buttons (Géographique / Diplômes)
2. **Critères Géographiques** : Interface de recherche intelligente
3. **OU Critères Diplômes** : Sélection périmètre + diplômes
4. **Actions** : Sauvegarder favoris + Lancer extraction

---

### 🗂️ Onglet 2 : Résultats 📊

**Contenu** : Vue actuelle (liste établissements, diplômes, langues, dispositifs)

```
┌─────────────────────────────────────────────────────────────┐
│ 📑 [Recherche] [Résultats] [Carte]                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 RÉSULTATS DE LA RECHERCHE                               │
│                                                              │
│  Extraction : Rennes Métropole (43 communes)                │
│  128 établissements • 542 diplômes • 15 langues             │
│                                                              │
│  ┌─ Filtres ───────────────────────────────────────────┐   │
│  │ [🔍 Rechercher...] [Type ▼] [Commune ▼]            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─ Vue Active ────────────────────────────────────────┐   │
│  │ 🏫 [Établissements] 🎓 [Diplômes] 🌍 [Langues]      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─ Liste ──────────────────────────────────────────────┐   │
│  │ [Table/Cards avec données...]                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Sections** :
1. **Résumé Extraction** : Zone, nombre établissements
2. **Stat Cards** : Cliquables (Établissements, Diplômes, Langues, Dispositifs)
3. **Filtres** : Recherche, Type, Commune
4. **Vue Active** : Table/Cards des données
5. **Actions** : Export, Impression, Partage

---

### 🗂️ Onglet 3 : Carte 🗺️ (v0.13+)

**Contenu** : Visualisation géographique (future)

```
┌─────────────────────────────────────────────────────────────┐
│ 📑 [Recherche] [Résultats] [Carte]                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🗺️ CARTE GÉOGRAPHIQUE                                      │
│                                                              │
│  [Carte interactive avec marqueurs...]                      │
│                                                              │
│  Légende :                                                   │
│  🔵 Lycée Général et Technologique                          │
│  🟢 Lycée Professionnel                                     │
│  🟠 CFA / Alternance                                        │
│  🔴 Établissement avec diplômes recherchés                   │
│                                                              │
│  Filtres :                                                   │
│  ☐ Lycées GT  ☐ Lycées Pro  ☐ CFA  ☐ Tous                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Fonctionnalités** (v0.13+) :
- Carte Leaflet / OpenStreetMap
- Marqueurs établissements
- Clusters si nombreux
- Info au clic
- Filtres visuels

---

## 5️⃣ Structure HTML/CSS

### 🎨 Architecture HTML

```html
<div class="app-container">
    <!-- Header -->
    <header class="app-header">
        <div class="header-left">
            <button class="hamburger-btn">☰</button>
            <h1>Gestionnaire d'Établissements</h1>
        </div>
        <div class="stat-cards">
            <!-- Cards stats -->
        </div>
    </header>
    
    <!-- Main Content -->
    <main class="main-content">
        <!-- Tabs Navigation -->
        <div class="tabs-nav">
            <button class="tab-btn active" data-tab="recherche">🔍 Recherche</button>
            <button class="tab-btn" data-tab="resultats">📊 Résultats</button>
            <button class="tab-btn" data-tab="carte">🗺️ Carte</button>
        </div>
        
        <!-- Tab Contents -->
        <div class="tab-content active" id="tab-recherche">
            <!-- Contenu recherche -->
        </div>
        <div class="tab-content" id="tab-resultats">
            <!-- Contenu résultats -->
        </div>
        <div class="tab-content" id="tab-carte">
            <!-- Contenu carte -->
        </div>
    </main>
    
    <!-- Sidebar (overlay) -->
    <div class="settings-panel">
        <!-- Paramètres uniquement -->
    </div>
</div>
```

### 🎨 CSS Onglets

```css
.tabs-nav {
    display: flex;
    gap: 5px;
    background: var(--bg-light);
    padding: 10px;
    border-bottom: 2px solid var(--border);
}

.tab-btn {
    padding: 12px 24px;
    border: none;
    background: transparent;
    border-radius: 8px 8px 0 0;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
}

.tab-btn.active {
    background: white;
    border-bottom: 3px solid var(--primary);
}

.tab-content {
    display: none;
    padding: 20px;
    background: white;
    min-height: 500px;
}

.tab-content.active {
    display: block;
}
```

---

## 6️⃣ JavaScript - Gestion Onglets

```javascript
// Système d'onglets
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            // Désactiver tous les onglets
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Activer l'onglet cliqué
            btn.classList.add('active');
            document.getElementById(`tab-${targetTab}`).classList.add('active');
            
            // Actions spécifiques par onglet
            if (targetTab === 'resultats') {
                loadView(); // Recharger la vue active
            } else if (targetTab === 'carte') {
                initMap(); // Initialiser la carte
            }
        });
    });
}

// Basculer vers un onglet depuis le code
function switchToTab(tabName) {
    const btn = document.querySelector(`[data-tab="${tabName}"]`);
    if (btn) btn.click();
}

// Exemple : Après extraction, basculer sur Résultats
async function lancerExtraction() {
    // ... extraction ...
    await updateDatabase(data);
    
    switchToTab('resultats'); // ← Bascule automatique
    showAlert('✅ Extraction terminée !', 'success');
}
```

---

## 7️⃣ Fonctionnalités Nouvelles

### A. Recherches Favorites

```javascript
// Sauvegarder recherche
function saveCurrentSearch() {
    const search = {
        id: Date.now(),
        name: prompt('Nom de cette recherche :'),
        type: currentSearchType, // 'geo' ou 'diplomes'
        criteria: getCurrentCriteria(),
        date: new Date().toISOString()
    };
    
    const favorites = JSON.parse(localStorage.getItem('search_favorites') || '[]');
    favorites.push(search);
    localStorage.setItem('search_favorites', JSON.stringify(favorites));
    
    loadFavorites();
}

// Charger favoris
function loadFavorites() {
    const favorites = JSON.parse(localStorage.getItem('search_favorites') || '[]');
    const container = document.getElementById('favorites-list');
    
    container.innerHTML = favorites.map(fav => `
        <div class="favorite-item">
            <div class="favorite-name">${fav.name}</div>
            <div class="favorite-actions">
                <button onclick="launchFavorite(${fav.id})">🔍 Lancer</button>
                <button onclick="deleteFavorite(${fav.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}
```

### B. Gestion Bases Récentes

```javascript
// Enregistrer base ouverte
function registerRecentDatabase(filename, stats) {
    const recents = JSON.parse(localStorage.getItem('recent_databases') || '[]');
    
    // Ajouter en tête
    recents.unshift({
        filename,
        stats,
        date: new Date().toISOString()
    });
    
    // Garder seulement 5 dernières
    recents.splice(5);
    
    localStorage.setItem('recent_databases', JSON.stringify(recents));
}
```

---

## 8️⃣ Migration v0.11 → v0.12

### Étapes de Migration

1. **Créer nouvelle structure HTML** avec onglets
2. **Déplacer contenu recherche** → Onglet Recherche
3. **Garder contenu résultats** → Onglet Résultats
4. **Vider panneau latéral** et ne garder que paramètres
5. **Implémenter système onglets** JavaScript
6. **Ajouter gestion favoris**
7. **Modifier filtre CFA**
8. **Tests complets**

### Compatibilité

- ✅ Bases de données v0.11 compatibles
- ✅ localStorage existant conservé
- ✅ Ajout de nouvelles clés localStorage pour favoris

---

## 9️⃣ Planning Développement v0.12

### Phase 1 : CFA et Alternance (1-2h)
- [ ] Modifier filtre établissements supérieur
- [ ] Ajouter badge "Alternance"
- [ ] Tests extraction CFA

### Phase 2 : Refonte Interface (3-4h)
- [ ] Structure HTML onglets
- [ ] CSS système onglets
- [ ] JavaScript gestion onglets
- [ ] Migration contenu recherche
- [ ] Migration contenu résultats

### Phase 3 : Panneau Latéral (2-3h)
- [ ] Vider ancien contenu
- [ ] Section Authentification
- [ ] Section Bases de données
- [ ] Section Favoris
- [ ] Section À propos

### Phase 4 : Tests et Polish (1-2h)
- [ ] Tests extraction tous modes
- [ ] Tests navigation onglets
- [ ] Tests favoris
- [ ] Tests CFA
- [ ] Documentation

**Total estimé : 7-11 heures**

---

## 🎯 Résultat Final v0.12

### Avant (v0.11)
```
☰ Panneau (tout mélangé)     │  Vue Unique
- Auth Onisep                 │  - Liste établissements
- Recherche géographique      │  - Filtres
- Recherche diplômes          │  - Stats cards
- Enrichissement langues      │
- Import/Export               │
- À propos                    │
```

### Après (v0.12)
```
☰ Panneau (paramètres)        │  [Recherche] [Résultats] [Carte]
- ⚙️ Auth Onisep               │
- 📊 Bases de données          │  Onglet actif:
- 💾 Favoris                   │  - Recherche : critères
- ℹ️ À propos                  │  - Résultats : données
                              │  - Carte : (future)
```

**Bénéfices** :
✅ Interface plus claire et logique  
✅ Séparation paramètres / utilisation  
✅ Navigation plus fluide avec onglets  
✅ CFA et alternance inclus  
✅ Gestion favoris pour rapidité  

---

**Date** : 28/01/2026  
**Version** : 0.12  
**Status** : 📋 Spécifications validées - Prêt pour développement
