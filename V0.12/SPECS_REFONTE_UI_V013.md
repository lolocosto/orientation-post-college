# 🎨 Refonte Interface Utilisateur - v0.13

## 📋 Vue d'Ensemble

### Objectif
Simplifier et clarifier l'interface en séparant :
1. **Paramètres** (panneau latéral) : Configuration utilisateur
2. **Recherche** (onglet) : Définir critères d'extraction  
3. **Résultats** (onglet) : Consulter les données
4. **Carte** (onglet) : Visualisation géographique (v0.14+)

### Architecture Cible

```
┌─────────────────────────────────────────────────────┐
│  HEADER + STATS CARDS (identique)                   │
├─────────────────────────────────────────────────────┤
│  [🔍 Recherche] [📊 Résultats] [🗺️ Carte]          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  (Contenu onglet actif)                             │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🗂️ PARTIE 1 : Système d'Onglets

### HTML Structure

```html
<div class="tabs-container">
    <!-- Navigation -->
    <div class="tabs-nav">
        <button class="tab-btn active" data-tab="recherche">
            🔍 Recherche
        </button>
        <button class="tab-btn" data-tab="resultats">
            📊 Résultats
        </button>
        <button class="tab-btn" data-tab="carte" disabled>
            🗺️ Carte
        </button>
    </div>
    
    <!-- Contenus -->
    <div class="tab-content active" id="tab-recherche">
        <!-- Onglet Recherche -->
    </div>
    
    <div class="tab-content" id="tab-resultats">
        <!-- Onglet Résultats -->
    </div>
    
    <div class="tab-content" id="tab-carte">
        <!-- Onglet Carte (placeholder) -->
    </div>
</div>
```

### CSS Onglets

```css
.tabs-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    overflow: hidden;
    margin-top: 20px;
}

.tabs-nav {
    display: flex;
    background: var(--bg-light);
    border-bottom: 2px solid var(--border);
    padding: 0;
}

.tab-btn {
    flex: 1;
    padding: 16px 24px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    color: var(--text);
    transition: all 0.2s;
    border-bottom: 3px solid transparent;
}

.tab-btn:hover:not(.active):not(:disabled) {
    background: rgba(0,0,0,0.03);
}

.tab-btn.active {
    background: white;
    color: var(--primary);
    border-bottom-color: var(--primary);
}

.tab-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.tab-content {
    display: none;
    padding: 30px;
    min-height: 500px;
}

.tab-content.active {
    display: block;
    animation: fadeIn 0.3s;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
```

### JavaScript Navigation

```javascript
function switchTab(tabName) {
    // Désactiver tous
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Activer le sélectionné
    const btn = document.querySelector(`[data-tab="${tabName}"]`);
    const content = document.getElementById(`tab-${tabName}`);
    
    if (btn && content) {
        btn.classList.add('active');
        content.classList.add('active');
        
        // Actions spécifiques
        if (tabName === 'resultats') {
            syncResultsTab(); // Synchroniser stats
        }
    }
}

// Basculer automatiquement après extraction
function afterExtraction() {
    switchTab('resultats');
    showAlert('✅ Extraction terminée !', 'success');
}
```

---

## 🔍 PARTIE 2 : Onglet Recherche

### Contenu

```html
<div class="tab-content active" id="tab-recherche">
    <h2>🔍 Recherche d'Établissements</h2>
    
    <!-- Sélecteur Mode -->
    <div class="mode-selector">
        <label class="mode-option">
            <input type="radio" name="mode" value="geo" checked>
            <span>📍 Géographique</span>
        </label>
        <label class="mode-option">
            <input type="radio" name="mode" value="diplomes">
            <span>🎓 Par Diplômes</span>
        </label>
    </div>
    
    <!-- Panel Géographique -->
    <div id="panel-geo" class="search-panel">
        <h3>📍 Recherche Géographique</h3>
        
        <div class="form-group">
            <label>Rechercher une commune</label>
            <input type="text" 
                   id="commune-search" 
                   placeholder="Ex: Rennes, Lyon..."
                   oninput="handleCommuneSearch()">
        </div>
        
        <div id="commune-results"></div>
        <div id="commune-selection"></div>
        
        <div class="actions">
            <button class="btn-secondary" onclick="saveFavorite()">
                ⭐ Sauvegarder
            </button>
            <button class="btn-primary" onclick="launchExtraction()">
                🌐 Extraire
            </button>
        </div>
    </div>
    
    <!-- Panel Diplômes -->
    <div id="panel-diplomes" class="search-panel" style="display:none;">
        <h3>🎓 Recherche par Diplômes</h3>
        <!-- Contenu diplômes -->
    </div>
</div>
```

### CSS Panels

```css
.mode-selector {
    display: flex;
    gap: 15px;
    margin: 20px 0;
    padding: 15px;
    background: var(--bg-light);
    border-radius: 8px;
}

.mode-option {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 15px;
    border: 2px solid var(--border);
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
}

.mode-option:hover {
    border-color: var(--primary);
}

.mode-option input:checked + span {
    color: var(--primary);
    font-weight: 600;
}

.search-panel {
    border: 2px solid var(--border);
    border-radius: 12px;
    padding: 25px;
    margin-top: 20px;
}

.search-panel h3 {
    margin: 0 0 20px 0;
    padding-bottom: 15px;
    border-bottom: 2px solid var(--border);
    color: var(--primary);
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
}

.form-group input {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 14px;
}

.actions {
    display: flex;
    gap: 15px;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 2px solid var(--border);
}

.actions button {
    flex: 1;
    padding: 15px;
    font-size: 16px;
    font-weight: 600;
}
```

### Fonctions JavaScript

```javascript
// Gérer recherche commune
let searchTimeout;
function handleCommuneSearch() {
    clearTimeout(searchTimeout);
    const query = document.getElementById('commune-search').value;
    
    if (query.length < 3) {
        document.getElementById('commune-results').innerHTML = '';
        return;
    }
    
    searchTimeout = setTimeout(() => {
        searchCommunes(query);
    }, 300);
}

async function searchCommunes(query) {
    const url = `https://geo.api.gouv.fr/communes?nom=${query}&limit=100`;
    const response = await fetch(url);
    const communes = await response.json();
    
    displayCommuneResults(communes);
}

function displayCommuneResults(communes) {
    const html = communes.map(c => `
        <div class="commune-item" onclick="selectCommune('${c.code}')">
            <strong>${c.nom}</strong> (${c.codeDepartement})
        </div>
    `).join('');
    
    document.getElementById('commune-results').innerHTML = html;
}

async function selectCommune(code) {
    // Récupérer commune + EPCI
    const response = await fetch(`https://geo.api.gouv.fr/communes/${code}`);
    const commune = await response.json();
    
    // Afficher sélection
    displaySelection(commune);
    
    // Activer bouton extraction
    document.querySelector('.btn-primary').disabled = false;
}

function launchExtraction() {
    // Lancer extraction avec critères sélectionnés
    // ...
    
    // Basculer sur onglet Résultats
    switchTab('resultats');
}
```

---

## 📊 PARTIE 3 : Onglet Résultats

### Contenu

```html
<div class="tab-content" id="tab-resultats">
    <!-- Stats Cards -->
    <div class="stats-grid">
        <div class="stat-card" onclick="switchView('lycees')">
            <div class="stat-value" id="stat-lycees">-</div>
            <div class="stat-label">Établissements</div>
        </div>
        <!-- Autres cards... -->
    </div>
    
    <!-- Vue Active -->
    <div class="card">
        <div class="card-header">
            <h2 id="view-title">📚 Établissements</h2>
            <button class="btn-secondary" onclick="switchTab('recherche')">
                ← Nouvelle recherche
            </button>
        </div>
        
        <!-- Filtres -->
        <div id="filters"></div>
        
        <!-- Contenu (tableau/cards) -->
        <div id="content-container"></div>
    </div>
</div>
```

### Synchronisation Stats

```javascript
function syncResultsTab() {
    // Copier valeurs stats vers onglet résultats
    document.getElementById('stat-lycees').textContent = 
        document.getElementById('stat-lycees-main').textContent;
    // Idem pour autres stats...
}

function loadStats() {
    // Charger stats
    const stats = getStatsFromDB();
    
    // Mettre à jour partout
    updateStatsDisplay(stats);
}

function updateStatsDisplay(stats) {
    // Stats principales (toujours visibles)
    document.getElementById('stat-lycees-main').textContent = stats.lycees;
    
    // Stats onglet résultats (si visible)
    if (document.getElementById('tab-resultats').classList.contains('active')) {
        document.getElementById('stat-lycees').textContent = stats.lycees;
    }
}
```

---

## 🗺️ PARTIE 4 : Onglet Carte (Placeholder)

### Contenu

```html
<div class="tab-content" id="tab-carte">
    <div class="placeholder">
        <div class="placeholder-icon">🗺️</div>
        <h2>Carte Géographique</h2>
        <p>Visualisez les établissements sur une carte interactive.</p>
        <p class="coming-soon">📅 Disponible en v0.14</p>
    </div>
</div>
```

### CSS Placeholder

```css
.placeholder {
    text-align: center;
    padding: 80px 20px;
    color: var(--text-light);
}

.placeholder-icon {
    font-size: 80px;
    margin-bottom: 20px;
    opacity: 0.5;
}

.placeholder h2 {
    margin: 20px 0 10px 0;
    color: var(--text);
}

.coming-soon {
    margin-top: 30px;
    padding: 10px 20px;
    background: var(--bg-light);
    border-radius: 8px;
    display: inline-block;
    font-weight: 500;
}
```

---

## ⚙️ PARTIE 5 : Panneau Latéral Simplifié

### Sections à Conserver

1. **Connexion Onisep** ✅
2. **Import/Export Base** ✅  
3. **À Propos** ✅

### Sections à Retirer

1. ❌ **Extraction Onisep** → Déplacée dans onglet Recherche
2. ❌ **Mode Géographique** → Onglet Recherche
3. ❌ **Mode Diplômes** → Onglet Recherche

### Nouvelle Section : Favoris

```html
<div class="settings-section">
    <div class="settings-section-header">
        <span class="icon">⭐</span>
        <span>Mes Favoris</span>
        <span class="chevron">▼</span>
    </div>
    <div class="settings-section-content">
        <div id="favorites-list">
            <!-- Liste favoris -->
        </div>
        <button onclick="manageFavorites()">
            ⚙️ Gérer les favoris
        </button>
    </div>
</div>
```

### Gestion Favoris

```javascript
// Sauvegarder recherche actuelle
function saveFavorite() {
    const name = prompt('Nom de cette recherche :');
    if (!name) return;
    
    const favorite = {
        id: Date.now(),
        name: name,
        type: getCurrentSearchType(),
        criteria: getCurrentCriteria(),
        date: new Date().toISOString()
    };
    
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    favorites.push(favorite);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    loadFavorites();
    showAlert('✅ Recherche sauvegardée', 'success');
}

// Charger favoris
function loadFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const html = favorites.map(f => `
        <div class="favorite-item">
            <div class="favorite-name">${f.name}</div>
            <div class="favorite-actions">
                <button onclick="launchFavorite(${f.id})">
                    🔍 Lancer
                </button>
                <button onclick="deleteFavorite(${f.id})">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
    
    document.getElementById('favorites-list').innerHTML = html || 
        '<p class="no-favorites">Aucun favori</p>';
}

// Lancer favori
function launchFavorite(id) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const fav = favorites.find(f => f.id === id);
    
    if (fav) {
        applyCriteria(fav.criteria);
        launchExtraction();
    }
}
```

---

## 🔄 PARTIE 6 : Migration du Code Existant

### Étapes

1. **Créer structure onglets** (HTML)
2. **Déplacer recherche géographique** vers onglet Recherche
3. **Conserver vue résultats** dans onglet Résultats
4. **Nettoyer panneau latéral**
5. **Ajouter JavaScript navigation**
6. **Tester workflow complet**

### Fonctions à Adapter

```javascript
// AVANT (v0.12)
function refreshFromOnisep() {
    // ... extraction ...
    updateDatabase(data);
    loadStats();
    loadView();
}

// APRÈS (v0.13)
function refreshFromOnisep() {
    // ... extraction ...
    updateDatabase(data);
    loadStats();
    
    // Basculer sur onglet Résultats
    switchTab('resultats');
    loadView();
}
```

---

## 📱 PARTIE 7 : Responsive

### Mobile

```css
@media (max-width: 768px) {
    .tabs-nav {
        flex-direction: column;
    }
    
    .tab-btn {
        width: 100%;
        border-bottom: 1px solid var(--border);
        border-right: none;
    }
    
    .tab-btn.active {
        border-bottom: 1px solid var(--border);
        border-left: 3px solid var(--primary);
    }
    
    .mode-selector {
        flex-direction: column;
    }
    
    .actions {
        flex-direction: column;
    }
    
    .actions button {
        width: 100%;
    }
}
```

---

## ✅ PARTIE 8 : Checklist Complète

### HTML
- [ ] Créer structure `.tabs-container`
- [ ] Créer `.tabs-nav` avec 3 boutons
- [ ] Créer `#tab-recherche`
- [ ] Créer `#tab-resultats`
- [ ] Créer `#tab-carte` (placeholder)
- [ ] Déplacer recherche géo dans tab-recherche
- [ ] Déplacer stats/vues dans tab-resultats

### CSS
- [ ] Styles `.tabs-nav`
- [ ] Styles `.tab-btn` (active/hover/disabled)
- [ ] Styles `.tab-content`
- [ ] Animation `fadeIn`
- [ ] Styles `.mode-selector`
- [ ] Styles `.search-panel`
- [ ] Styles `.placeholder`
- [ ] Media queries responsive

### JavaScript
- [ ] Fonction `switchTab(tabName)`
- [ ] Fonction `switchSearchMode(mode)`
- [ ] Fonction `handleCommuneSearch()`
- [ ] Fonction `launchExtraction()`
- [ ] Adapter `refreshFromOnisep()` pour basculer onglet
- [ ] Fonction `syncResultsTab()`
- [ ] Fonction `saveFavorite()`
- [ ] Fonction `loadFavorites()`
- [ ] Fonction `launchFavorite(id)`

### Panneau Latéral
- [ ] Supprimer section "Extraction Onisep"
- [ ] Ajouter section "Favoris"
- [ ] Fonctions gestion favoris

### Tests
- [ ] Navigation entre onglets
- [ ] Recherche géographique dans onglet
- [ ] Extraction → bascule auto sur Résultats
- [ ] Stats synchronisées
- [ ] Favoris sauvegarde/chargement
- [ ] Responsive mobile
- [ ] Compatibilité navigateurs

---

## 🎯 Workflow Utilisateur Final

### Premier Usage

```
1. Ouvrir app
2. Connexion Onisep (panneau latéral, 1 fois)
3. Onglet "Recherche" (par défaut)
4. Taper "Rennes" → Sélectionner
5. Clic "🌐 Extraire"
6. → Bascule auto sur "Résultats"
7. Consulter données
8. (Option) Sauvegarder en favori
```

### Usage Suivant

```
1. Ouvrir app
2. Option A : Panneau latéral → Favoris → Clic direct
   Option B : Onglet Recherche → Nouvelle recherche
3. → Résultats affichés
```

---

## 📊 Estimation Temps

| Tâche | Temps |
|-------|-------|
| Structure HTML onglets | 30min |
| CSS complet | 45min |
| JavaScript navigation | 30min |
| Migration recherche | 45min |
| Nettoyage panneau latéral | 30min |
| Système favoris | 1h |
| Tests + debug | 1h |
| **TOTAL** | **~5h** |

---

## 🚀 Avantages UX

1. **Clarté** : Séparation nette Recherche / Résultats
2. **Fluidité** : Navigation intuitive par onglets
3. **Efficacité** : Favoris = 1 clic pour relancer
4. **Évolutivité** : Onglet Carte prêt pour v0.14
5. **Simplicité** : Panneau latéral = paramètres uniquement

---

**Date** : 28/01/2026  
**Version cible** : v0.13  
**Status** : 📋 Spécifications complètes  
**Estimation** : 5 heures développement
