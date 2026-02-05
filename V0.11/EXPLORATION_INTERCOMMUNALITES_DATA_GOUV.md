# 🔍 Exploration Base Nationale Intercommunalités - data.gouv.fr

## 🎯 Objectif

Trouver le dataset officiel des intercommunalités françaises pour :
1. Avoir la liste complète avec codes SIREN
2. Éviter le mapping manuel
3. Source de données officielles et à jour

---

## 🧪 Tests à Effectuer dans la Console

### Test 1 : Rechercher les Datasets Intercommunalités

```javascript
const searchIntercommunalites = async () => {
    console.log("🔍 Recherche datasets intercommunalités");
    console.log("=======================================\n");
    
    const keywords = ['intercommunalite', 'epci', 'banatic'];
    
    for (const keyword of keywords) {
        console.log(`\n📚 Recherche avec mot-clé: "${keyword}"`);
        
        const url = `https://www.data.gouv.fr/api/1/datasets/?q=${keyword}&page_size=10`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            console.log(`  Total: ${data.total} datasets`);
            console.log(`\n  Top 5 datasets:\n`);
            
            data.data.slice(0, 5).forEach((ds, i) => {
                console.log(`  ${i + 1}. ${ds.title}`);
                console.log(`     ID: ${ds.id}`);
                console.log(`     Slug: ${ds.slug}`);
                console.log(`     Resources: ${ds.resources.length}`);
                if (ds.resources.length > 0) {
                    console.log(`     Format: ${ds.resources[0].format}`);
                    console.log(`     URL: ${ds.resources[0].url}`);
                }
                console.log('');
            });
        } catch (error) {
            console.error(`  ❌ Erreur:`, error);
        }
    }
};

searchIntercommunalites();
```

### Test 2 : Dataset BANATIC Spécifique

BANATIC = Base Nationale sur l'Intercommunalité (source officielle)

```javascript
const testBanatic = async () => {
    console.log("🏛️ Test Dataset BANATIC");
    console.log("========================\n");
    
    // ID probable du dataset BANATIC
    const datasetIds = [
        '53698f4ca3a729239d2036df',  // BANATIC ancien
        '5cc1b94a634f4164071119c1',  // BANATIC nouveau
    ];
    
    for (const id of datasetIds) {
        console.log(`\n📦 Test dataset ID: ${id}`);
        
        try {
            const response = await fetch(`https://www.data.gouv.fr/api/1/datasets/${id}/`);
            const dataset = await response.json();
            
            console.log(`  ✅ Trouvé: ${dataset.title}`);
            console.log(`  📝 Description: ${dataset.description?.substring(0, 150)}...`);
            console.log(`  📊 Resources: ${dataset.resources.length}`);
            
            console.log(`\n  📄 Resources disponibles:`);
            dataset.resources.forEach((res, i) => {
                console.log(`\n  ${i + 1}. ${res.title || 'Sans titre'}`);
                console.log(`     Format: ${res.format}`);
                console.log(`     URL: ${res.url}`);
                console.log(`     Taille: ${res.filesize ? (res.filesize / 1024 / 1024).toFixed(2) + ' MB' : 'inconnue'}`);
            });
            
        } catch (error) {
            console.log(`  ❌ Non trouvé`);
        }
    }
};

testBanatic();
```

### Test 3 : Télécharger et Analyser un Fichier CSV

```javascript
const analyzeCSV = async (url) => {
    console.log("📊 Analyse CSV Intercommunalités");
    console.log("=================================\n");
    console.log(`URL: ${url}\n`);
    
    try {
        const response = await fetch(url);
        const text = await response.text();
        
        // Séparer en lignes
        const lines = text.split('\n');
        
        console.log(`📈 Total lignes: ${lines.length}`);
        console.log(`\n📋 Header (première ligne):`);
        console.log(lines[0]);
        
        console.log(`\n📋 Exemples (5 premières lignes):\n`);
        lines.slice(1, 6).forEach((line, i) => {
            console.log(`${i + 1}. ${line}`);
        });
        
        // Essayer de parser
        const header = lines[0].split(';');
        console.log(`\n🔑 Colonnes détectées (${header.length}):`);
        header.forEach((col, i) => {
            console.log(`  ${i + 1}. ${col}`);
        });
        
        return { lines, header };
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
};

// Exemple d'utilisation (remplacer l'URL par celle trouvée)
// analyzeCSV('https://www.data.gouv.fr/...');
```

### Test 4 : API geo.api.gouv.fr - Liste EPCI

```javascript
const listAllEPCI = async () => {
    console.log("🗺️ Liste de tous les EPCI via geo.api.gouv.fr");
    console.log("==============================================\n");
    
    try {
        const response = await fetch('https://geo.api.gouv.fr/epcis?fields=nom,code');
        const epcis = await response.json();
        
        console.log(`📊 Total EPCI: ${epcis.length}`);
        console.log(`\n📋 Exemples (20 premiers):\n`);
        
        epcis.slice(0, 20).forEach((epci, i) => {
            console.log(`${i + 1}. ${epci.nom}`);
            console.log(`   Code: ${epci.code}`);
        });
        
        // Sauvegarder pour usage
        window.allEPCI = epcis;
        console.log(`\n💾 Liste complète sauvegardée dans: window.allEPCI`);
        
        return epcis;
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
};

listAllEPCI();
```

---

## 📚 Datasets Connus sur data.gouv.fr

### 1. BANATIC - Base Nationale sur l'Intercommunalité
**URL** : https://www.data.gouv.fr/fr/datasets/base-nationale-sur-lintercommunalite/

**Contenu probable** :
- Liste complète des EPCI
- Codes SIREN
- Noms officiels
- Types (Métropole, CA, CC, etc.)
- Communes membres

### 2. Contours des EPCI
**URL** : https://www.data.gouv.fr/fr/datasets/contours-des-epci/

**Contenu** :
- Géométries (GeoJSON, Shapefile)
- Limites administratives

### 3. Composition des EPCI
**URL** : https://www.data.gouv.fr/fr/datasets/composition-communale-des-epci/

**Contenu** :
- Relations EPCI ↔ Communes
- Codes INSEE

---

## 🎯 Solution Recommandée

### Option A : API geo.api.gouv.fr (ACTUELLE) ✅
```javascript
// Déjà implémentée
https://geo.api.gouv.fr/epcis/{code}/communes
```

**Avantages** :
- ✅ Fonctionne pour tous les EPCI
- ✅ Données officielles IGN
- ✅ Toujours à jour
- ✅ Pas de téléchargement

**Inconvénient** :
- Nécessite une requête par EPCI

### Option B : Charger la Liste Complète au Démarrage
```javascript
// Au chargement de l'app
const response = await fetch('https://geo.api.gouv.fr/epcis?fields=nom,code');
const allEPCI = await response.json();

// Créer un mapping
const epciMapping = {};
allEPCI.forEach(epci => {
    const slug = epci.nom
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_');
    epciMapping[slug] = epci.code;
});
```

**Avantages** :
- ✅ Liste complète dès le départ
- ✅ Mapping automatique
- ✅ Pas de mapping manuel

### Option C : Fichier CSV Statique depuis data.gouv.fr
Télécharger BANATIC et l'intégrer dans l'app.

**Avantages** :
- ✅ Hors ligne
- ✅ Rapide

**Inconvénients** :
- ❌ Nécessite mise à jour manuelle
- ❌ Fichier volumineux

---

## 🚀 Prochaines Étapes

1. **Exécuter les tests** ci-dessus dans la console
2. **Identifier le meilleur dataset** BANATIC ou autre
3. **Décider de la stratégie** :
   - Garder l'API geo.gouv.fr actuelle (simple, fonctionne)
   - Charger la liste complète au démarrage (plus complet)
   - Intégrer un CSV statique (hors ligne)

---

**Lancez les tests dans la console et communiquez-moi les résultats !** 🔍

Je pourrai alors optimiser la solution en fonction de ce que vous trouvez.
