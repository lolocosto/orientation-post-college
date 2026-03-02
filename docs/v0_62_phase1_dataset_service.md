# v0.62 — Phase 1 : Document technique de conception

## Service de jeux de données (`DatasetService`) et exposition du snapshot (`DatabaseService`)

---

## 1. Objectif

Permettre l'export et l'import de l'intégralité des données éducatives de la base sous forme d'un fichier JSON autonome contenant à la fois les données et les métadonnées de la recherche qui les a produites.

---

## 2. Modifications de `DatabaseService`

### 2.1 Nouvelle méthode : `getStorageSnapshot()`

**Responsabilité** : Retourner une copie profonde des tables éducatives uniquement (pas les référentiels géographiques, pas les préférences).

```
Signature : async getStorageSnapshot() → Object
```

**Tables exportées** (13 tables — même liste que `clearAllData()`) :
- `etablissements`
- `diplomes`
- `diplomes_par_etablissement`
- `dispositifs`
- `dispositifs_par_etablissement`
- `options_2nde_gt`
- `options_2nde_gt_par_etablissement`
- `specialites_1ereG`
- `specialites_1ereG_par_etablissement`
- `diplomes_apprentissage`
- `diplomes_apprentissage_par_etablissement`
- `autres_formations_par_etablissement`
- `langues`

**Tables exclues** (référentiels géo + préférences) :
- `communes`, `departements`, `regions`, `epci`, `preferences`

**Implémentation** : `JSON.parse(JSON.stringify(...))` pour la copie profonde (cohérent avec la sérialisation localStorage existante).

### 2.2 Nouvelle méthode : `loadStorageSnapshot(data)`

**Responsabilité** : Remplacer les tables éducatives par celles d'un snapshot importé. Préserver les référentiels géographiques et les préférences.

```
Signature : async loadStorageSnapshot(data) → void
```

**Comportement** :
1. Pour chaque table éducative, remplacer `this.#storage[table]` par `data[table]` (ou `{}` si absent).
2. Ne pas toucher aux tables géographiques ni aux préférences.
3. Reconstruire l'index d'unicité via `#rebuildEtabIndex()`.
4. Persister via `#saveToLocalStorage()`.

### 2.3 Nouveau champ : `lastExtractionMetadata`

**Responsabilité** : Stocker les métadonnées de la dernière extraction pour pouvoir décrire les données en base à l'utilisateur.

**Stockage** : Clé `last_extraction_metadata` dans localStorage (séparé du `#storage` pour ne pas polluer les snapshots).

```
Signature : setLastExtractionMetadata(metadata) → void
Signature : getLastExtractionMetadata() → Object|null
```

Structure de `metadata` :
```json
{
  "typeRecherche": "geo|diplomes|options",
  "params": { ... },
  "date": "2026-03-02T14:30:00.000Z",
  "stats": { "etablissements": 87, "diplomes": 234, ... }
}
```

### 2.4 Nouvelle méthode : `hasEducationalData()`

**Responsabilité** : Indiquer rapidement si la base contient des données éducatives (au moins 1 établissement).

```
Signature : hasEducationalData() → boolean
```

---

## 3. Nouveau fichier : `dataset_service.js`

### 3.1 Constantes

```javascript
const DATASET_FORMAT = 'parcours-avenir-dataset';
const DATASET_VERSION = '1.0';
const DATASET_INDEX_KEY = 'parcours_avenir_datasets_index';
const DATASET_MAX_SIZE_WARNING = 5 * 1024 * 1024; // 5 Mo
```

### 3.2 Classe `DatasetService`

Classe statique (pas d'instance nécessaire, comme `ExportService`).

#### 3.2.1 `static exportDataset(metadata) → Object`

**Entrées** :
- `metadata.nom` (string, obligatoire) : nom donné par l'utilisateur
- `metadata.typeRecherche` (string) : `'geo'|'diplomes'|'options'`
- `metadata.params` (Object) : paramètres de la recherche (même format que les favoris)

**Comportement** :
1. Récupérer le snapshot via `databaseService.getStorageSnapshot()`.
2. Récupérer les stats via `databaseService.getStats()`.
3. Construire l'objet dataset complet.
4. Retourner l'objet (pas le téléchargement — séparation des responsabilités).

**Sortie** :
```json
{
  "format": "parcours-avenir-dataset",
  "version": "1.0",
  "appVersion": "0.62",
  "metadata": {
    "nom": "...",
    "dateExtraction": "...",
    "dateExport": "...",
    "typeRecherche": "...",
    "params": { ... },
    "stats": { ... }
  },
  "data": { ... }
}
```

#### 3.2.2 `static validateDataset(json) → { valid: boolean, errors: string[] }`

**Vérifications** :
1. Présence des champs `format`, `version`, `metadata`, `data`.
2. `format` === `DATASET_FORMAT`.
3. `version` est une version supportée (pour le moment : `'1.0'`).
4. `metadata` contient au minimum `nom` et `typeRecherche`.
5. `data` est un objet non vide.
6. Au moins une table éducative est présente dans `data`.

**Sortie** : Objet `{ valid, errors }` avec la liste des erreurs éventuelles.

#### 3.2.3 `static async importDataset(json) → { success: boolean, stats: Object, errors: string[] }`

**Comportement** :
1. Appeler `validateDataset(json)`. Si invalide, retourner les erreurs.
2. Appeler `databaseService.loadStorageSnapshot(json.data)`.
3. Sauvegarder les métadonnées via `databaseService.setLastExtractionMetadata(json.metadata)`.
4. Retourner les stats post-import.

#### 3.2.4 `static getDatasetInfo(json) → Object|null`

**Responsabilité** : Extraire les métadonnées d'un fichier sans l'importer (pour l'aperçu dans la modale).

**Sortie** : `json.metadata` enrichi des stats calculées si absentes.

#### 3.2.5 `static downloadDataset(dataset, filename)` 

**Responsabilité** : Déclencher le téléchargement du fichier JSON.

**Comportement** :
1. `JSON.stringify(dataset, null, 2)` pour lisibilité.
2. Créer un `Blob` de type `application/json`.
3. Déclencher le téléchargement via `<a>` dynamique (même pattern que `ExportService.#downloadFile`).

#### 3.2.6 Gestion de l'index (`datasets_index`)

L'index stocke les métadonnées (pas les données) des jeux importés/exportés pour les retrouver dans l'UI.

```
static getIndex() → Object[]
static addToIndex(metadata) → void
static removeFromIndex(id) → void
```

Structure d'une entrée d'index :
```json
{
  "id": "ds_1709388600000",
  "nom": "Rennes Métropole — scolaire+apprentissage",
  "typeRecherche": "geo",
  "dateExtraction": "2026-03-02T14:30:00.000Z",
  "stats": { "etablissements": 87, "diplomes": 234 }
}
```

---

## 4. Diagramme de séquence — Export

```
Utilisateur → UI : Clic "Sauvegarder jeu de données"
UI → DatasetService.exportDataset(metadata)
DatasetService → DatabaseService.getStorageSnapshot()
DatabaseService → DatasetService : { tables éducatives }
DatasetService → DatabaseService.getStats()
DatabaseService → DatasetService : { stats }
DatasetService → UI : dataset complet (Object)
UI → DatasetService.downloadDataset(dataset, filename)
DatasetService → Navigateur : téléchargement JSON
DatasetService → DatasetService.addToIndex(metadata)
```

## 5. Diagramme de séquence — Import

```
Utilisateur → UI : Sélection fichier JSON
UI → FileReader : lecture du fichier
FileReader → UI : contenu texte
UI → JSON.parse(contenu)
UI → DatasetService.validateDataset(json)
DatasetService → UI : { valid, errors }
[Si invalide] UI → Utilisateur : message d'erreur
[Si valide] UI → DatasetService.importDataset(json)
DatasetService → DatabaseService.loadStorageSnapshot(json.data)
DatabaseService : remplace tables + rebuild index + flush
DatasetService → DatabaseService.setLastExtractionMetadata(json.metadata)
DatasetService → UI : { success, stats }
UI → Utilisateur : confirmation + stats
```

---

## 5. Tests prévus

| # | Test | Type |
|---|------|------|
| 1 | `getStorageSnapshot` retourne uniquement les tables éducatives | Unitaire |
| 2 | `getStorageSnapshot` fait une copie profonde (mutation de l'original ne modifie pas le snapshot) | Unitaire |
| 3 | `loadStorageSnapshot` remplace les données éducatives | Unitaire |
| 4 | `loadStorageSnapshot` préserve les référentiels géographiques | Unitaire |
| 5 | `loadStorageSnapshot` reconstruit l'index d'unicité | Unitaire |
| 6 | `hasEducationalData` retourne false sur base vide | Unitaire |
| 7 | `hasEducationalData` retourne true si au moins 1 établissement | Unitaire |
| 8 | `setLastExtractionMetadata` / `getLastExtractionMetadata` round-trip | Unitaire |
| 9 | `exportDataset` produit un objet avec la bonne structure | Unitaire |
| 10 | `validateDataset` accepte un dataset valide | Unitaire |
| 11 | `validateDataset` refuse un objet sans champ `format` | Unitaire |
| 12 | `validateDataset` refuse un `format` incorrect | Unitaire |
| 13 | `validateDataset` refuse un `data` vide | Unitaire |
| 14 | `importDataset` charge les données et retourne les stats | Fonctionnel |
| 15 | Export → Import round-trip : données identiques | Fonctionnel |
| 16 | Import d'un fichier avec tables manquantes → valeurs par défaut `{}` | Fonctionnel |
| 17 | `getDatasetInfo` extrait les métadonnées sans importer | Unitaire |
| 18 | Gestion de l'index : ajout, suppression, listing | Unitaire |
| 19 | `downloadDataset` génère un JSON lisible (indentation) | Unitaire |

---

## 6. Points d'attention

1. **Copie profonde** : indispensable pour `getStorageSnapshot` afin d'éviter qu'une mutation du snapshot ne corrompe les données en mémoire.

2. **`#rebuildEtabIndex()`** : doit être appelé après `loadStorageSnapshot` car les `#etabUniquenessIndex` et `#nextEtabId` privés ne sont pas dans le snapshot — ils sont recalculés à partir des données.

3. **Séparation des métadonnées d'extraction** : stockées dans `localStorage` sous clé dédiée (`last_extraction_metadata`), pas dans `#storage`, pour ne pas polluer les snapshots de données.

4. **Compatibilité future** : le champ `version` dans le dataset permettra d'implémenter des migrations si la structure des tables change dans une version ultérieure.
