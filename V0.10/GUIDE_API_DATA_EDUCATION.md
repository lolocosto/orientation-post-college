# 🔍 Guide d'Exploration : API data.education.gouv.fr

## 📋 Informations Générales

**Plateforme** : OpenDataSoft
**URL** : https://data.education.gouv.fr
**Type** : API REST publique (probablement sans authentification)

---

## 🔑 Authentification et Limites

### Tests à Effectuer

1. **Accès sans authentification** :
   ```
   https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-offre-langues-2d/records?limit=10
   ```
   
2. **Vérifier les headers de réponse** pour voir les limites :
   - `X-RateLimit-Limit` : Nombre de requêtes autorisées
   - `X-RateLimit-Remaining` : Requêtes restantes
   - `X-RateLimit-Reset` : Réinitialisation du compteur

### Limites Typiques OpenDataSoft
D'après les API OpenDataSoft publiques :
- ✅ **Pas d'authentification** requise pour les API publiques
- 📊 **~10 000 requêtes/jour** par IP (à vérifier)
- ⏱️ **Rate limiting** : quelques requêtes par seconde

---

## 📚 Datasets Intéressants pour Votre Application

### 1. **Langues Enseignées** ✅ PRIORITAIRE
**Dataset** : `fr-en-offre-langues-2d`
**Endpoint** : 
```
https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-offre-langues-2d/records
```

**Champs probables** :
- `numero_uai` : UAI de l'établissement
- `langue` : Nom de la langue
- `niveau` : LV1, LV2, LV3, option
- `classe` : Niveau de classe concerné

**Utilité** : Remplace/complète les données langues d'Onisep

---

### 2. **Autres Datasets à Explorer**

#### Établissements
```
fr-en-adresse-et-geolocalisation-etablissements-premier-et-second-degre
```
- Données géographiques des établissements
- Coordonnées GPS
- Adresses complètes

#### Effectifs
```
fr-en-effectifs-des-eleves-par-niveau-sexe-lv1-et-lv2
```
- Nombre d'élèves par niveau
- Répartition LV1/LV2
- Utile pour dimensionner l'offre

#### Résultats aux examens
```
fr-en-resultats-bac-general-technologique-professionnel
```
- Taux de réussite par établissement
- Pourrait être affiché dans les fiches lycées

#### Sections particulières
```
fr-en-sections-europeennes-orientales
```
- Sections européennes par langue
- Sections orientales

#### Options et spécialités
```
fr-en-specialites-bac-general
```
- Liste des spécialités du bac général par établissement

---

## 🧪 Script de Test API

### Test 1 : Dataset Langues
Coller dans la console du navigateur (F12) :

```javascript
// Test de l'API data.education.gouv.fr
const testAPI = async () => {
    console.log("🔍 Test API data.education.gouv.fr");
    console.log("=====================================\n");
    
    // Test 1 : Récupérer quelques enregistrements
    const url = "https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-offre-langues-2d/records?limit=5";
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        console.log("✅ API accessible !");
        console.log(`📊 Total d'enregistrements : ${data.total_count || 'inconnu'}`);
        console.log(`📝 Enregistrements retournés : ${data.results?.length || 0}`);
        
        // Afficher les headers de rate limiting
        console.log("\n🔒 Rate Limiting:");
        console.log(`  Limit: ${response.headers.get('X-RateLimit-Limit') || 'non spécifié'}`);
        console.log(`  Remaining: ${response.headers.get('X-RateLimit-Remaining') || 'non spécifié'}`);
        console.log(`  Reset: ${response.headers.get('X-RateLimit-Reset') || 'non spécifié'}`);
        
        // Afficher un exemple d'enregistrement
        if (data.results && data.results.length > 0) {
            console.log("\n📋 Exemple d'enregistrement:");
            console.log(JSON.stringify(data.results[0], null, 2));
            
            console.log("\n🔑 Champs disponibles:");
            Object.keys(data.results[0]).forEach(key => {
                console.log(`  - ${key}`);
            });
        }
        
        return data;
    } catch (error) {
        console.error("❌ Erreur:", error);
    }
};

// Lancer le test
testAPI();
```

### Test 2 : Recherche par UAI
```javascript
// Rechercher les langues pour un établissement spécifique
const testUAI = async (uai) => {
    console.log(`🔍 Recherche langues pour UAI: ${uai}`);
    
    const url = `https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-offre-langues-2d/records?where=numero_uai="${uai}"`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        console.log(`📊 Langues trouvées : ${data.total_count || 0}`);
        
        if (data.results) {
            data.results.forEach(record => {
                console.log(`  - ${record.langue || record.libelle_langue} (${record.niveau || 'niveau inconnu'})`);
            });
        }
        
        return data;
    } catch (error) {
        console.error("❌ Erreur:", error);
    }
};

// Exemple avec un UAI (remplacer par un vrai UAI de votre base)
// testUAI("0910620E");
```

### Test 3 : Lister tous les datasets
```javascript
// Lister tous les datasets disponibles
const listDatasets = async () => {
    console.log("📚 Liste des datasets disponibles");
    console.log("==================================\n");
    
    const url = "https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets?limit=100";
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        console.log(`📊 Total datasets : ${data.total_count || 'inconnu'}`);
        
        if (data.results) {
            console.log("\n📋 Datasets (100 premiers):\n");
            data.results.forEach((dataset, index) => {
                console.log(`${index + 1}. ${dataset.dataset_id}`);
                console.log(`   Titre: ${dataset.metas?.default?.title || 'Sans titre'}`);
                console.log(`   Records: ${dataset.metas?.default?.records_count || 'inconnu'}`);
                console.log(`   Modifié: ${dataset.metas?.default?.modified || 'inconnu'}\n`);
            });
        }
        
        return data;
    } catch (error) {
        console.error("❌ Erreur:", error);
    }
};

// Lancer le listing
// listDatasets();
```

---

## 📊 Structure des Données Langues (Probable)

D'après les datasets OpenDataSoft du Ministère de l'Éducation :

```json
{
  "numero_uai": "0910620E",
  "nom_etablissement": "Lycée Paul Vincensini",
  "langue": "Anglais",
  "libelle_langue": "ANGLAIS LV1",
  "niveau": "LV1",
  "dispositif": "LV1",
  "classe": "Seconde",
  "annee_scolaire": "2024-2025",
  "secteur": "Public",
  "academie": "Corse"
}
```

---

## 🎯 Intégration dans Votre Application v0.10

### Stratégie Recommandée

1. **Extraction mixte** :
   - Lycées + Diplômes : API Onisep (déjà fonctionnel)
   - Langues : API data.education.gouv.fr (nouveau)

2. **Workflow** :
   ```
   1. Extraction lycées/diplômes via Onisep
   2. Pour chaque lycée extrait:
      → Requête API data.education.gouv.fr avec UAI
      → Récupération des langues
      → Stockage en base
   ```

3. **Structure BDD** - À modifier :
   ```sql
   CREATE TABLE langues (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       lycee_uai TEXT,
       langue TEXT,
       niveau TEXT,  -- LV1, LV2, LV3, option
       classe TEXT,  -- Seconde, Première, Terminale
       FOREIGN KEY (lycee_uai) REFERENCES lycees(uai)
   )
   ```

---

## ✅ Actions Immédiates

### Étape 1 : Tests API (À faire dans le navigateur)
1. Ouvrir https://data.education.gouv.fr/explore/dataset/fr-en-offre-langues-2d
2. Cliquer sur "API" dans l'interface
3. Tester les requêtes avec les scripts ci-dessus
4. Noter :
   - Les champs exacts disponibles
   - Les limites de rate limiting
   - Le format des données

### Étape 2 : Identifier les Datasets Utiles
1. Exécuter `listDatasets()` dans la console
2. Chercher les datasets contenant :
   - "langues"
   - "specialites"
   - "options"
   - "sections"
   - "resultats"

### Étape 3 : Me Communiquer
Une fois les tests effectués, communiquez-moi :
- ✅ La structure exacte des données langues
- ✅ Les limites de rate limiting observées
- ✅ Les autres datasets intéressants trouvés
- ✅ Exemples de réponses JSON

---

## 🚀 Avantages de data.education.gouv.fr

### vs Onisep
- ✅ **Plus complet** : Données officielles du Ministère
- ✅ **Plus récent** : Mis à jour annuellement
- ✅ **Plus structuré** : Champs standardisés
- ✅ **Gratuit** : API publique sans authentification
- ✅ **Complémentaire** : Onisep pour diplômes, data.gouv pour détails

### Limitations Potentielles
- ⚠️ Mise à jour annuelle (pas en temps réel)
- ⚠️ Pas d'infos sur les modalités d'inscription
- ⚠️ Focus sur statistiques/données brutes

---

## 📝 Notes

- L'API utilise le standard OpenDataSoft v2.1
- Documentation générale : https://help.opendatasoft.com/apis/ods-search-v2/
- Les requêtes se font en GET
- Filtrage avec `where`, pagination avec `limit` et `offset`
- Tri avec `order_by`

---

**🎯 Prochaine étape** : Lancez les tests et communiquez-moi les résultats pour que je puisse coder l'intégration dans v0.10 !
