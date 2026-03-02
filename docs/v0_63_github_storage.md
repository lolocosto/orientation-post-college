# v0.63 — Document technique de conception

## Service de stockage GitHub (`GitHubStorage`)

---

## 1. Objectif

Permettre le stockage, le partage et le chargement des jeux de données via un dépôt GitHub dédié, en complément du stockage local (fichiers JSON). Un enseignant peut ainsi extraire des données et les rendre disponibles à ses collègues sans transfert de fichier manuel.

---

## 2. Architecture

### 2.1 Dépôt GitHub

- **Propriétaire** : `lolocosto` (configurable)
- **Dépôt** : `parcours-avenir-datasets` (configurable)
- **Structure** :

```
parcours-avenir-datasets/
  jeux_de_donnees/
    index.json              ← Catalogue (métadonnées uniquement)
    rennes_metropole_2026-03-02.json
    lyon_bac_pro_2026-03-01.json
    ...
```

### 2.2 Index distant (`index.json`)

Source de vérité pour la liste des datasets disponibles. Mis à jour à chaque upload/suppression.

```json
{
  "version": "1.0",
  "lastModified": "2026-03-02T15:30:00.000Z",
  "datasets": [
    {
      "filename": "rennes_metropole_2026-03-02.json",
      "nom": "Rennes Métropole — scolaire+apprentissage",
      "typeRecherche": "geo",
      "dateExtraction": "2026-03-02T14:30:00.000Z",
      "dateUpload": "2026-03-02T15:00:00.000Z",
      "appVersion": "0.63",
      "stats": { "etablissements": 87, "diplomes": 234 }
    }
  ]
}
```

### 2.3 Authentification

- **Lecture** : possible sans token si le dépôt est public
- **Écriture** : nécessite un Personal Access Token (fine-grained)
  - Permissions requises : `Contents: Read and write` sur le dépôt datasets uniquement
  - Stocké dans `localStorage` (clé `github_token`)

### 2.4 API GitHub utilisée

| Action | Méthode HTTP | Endpoint |
|--------|-------------|----------|
| Lire un fichier | GET | `/repos/{owner}/{repo}/contents/{path}` |
| Créer/Mettre à jour | PUT | `/repos/{owner}/{repo}/contents/{path}` |
| Supprimer | DELETE | `/repos/{owner}/{repo}/contents/{path}` |
| Info dépôt | GET | `/repos/{owner}/{repo}` |

---

## 3. Nouveau fichier : `js/github_storage.js`

### 3.1 Constantes

| Constante | Valeur | Description |
|-----------|--------|-------------|
| `GITHUB_OWNER_KEY` | `'github_owner'` | Clé localStorage |
| `GITHUB_REPO_KEY` | `'github_repo'` | Clé localStorage |
| `GITHUB_TOKEN_KEY` | `'github_token'` | Clé localStorage |
| `GITHUB_DEFAULT_OWNER` | `'lolocosto'` | Propriétaire par défaut |
| `GITHUB_DEFAULT_REPO` | `'parcours-avenir-datasets'` | Dépôt par défaut |
| `GITHUB_DATASETS_PATH` | `'jeux_de_donnees'` | Dossier dans le dépôt |
| `GITHUB_INDEX_FILENAME` | `'index.json'` | Nom du fichier d'index |
| `GITHUB_API_BASE` | `'https://api.github.com'` | URL de base API |

### 3.2 Classe `GitHubStorage`

Classe statique (même pattern que `DatasetService`).

#### Configuration

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `getConfig()` | `→ { owner, repo, token, configured }` | Retourne la config courante |
| `saveConfig(config)` | `→ void` | Persiste la config dans localStorage |
| `hasWriteToken()` | `→ boolean` | Indique si un token d'écriture est présent |

#### Lecture

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `fetchIndex()` | `→ Promise<Object>` | Récupère l'index distant |
| `listDatasets()` | `→ Promise<Object[]>` | Liste les métadonnées des datasets |
| `loadDataset(filename)` | `→ Promise<Object>` | Charge un dataset complet |

#### Écriture

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `uploadDataset(dataset, filename?)` | `→ Promise<{ success, filename, url }>` | Publie un dataset + met à jour l'index |
| `deleteDataset(filename)` | `→ Promise<{ success }>` | Supprime un dataset + met à jour l'index |

#### Tests

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `testConnection()` | `→ Promise<{ ok, message, repoInfo? }>` | Teste l'accès au dépôt |
| `testWriteAccess()` | `→ Promise<{ ok, message }>` | Teste les droits d'écriture |

#### Utilitaires

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `getFileUrl(filename)` | `→ string` | URL de visualisation GitHub |
| `getRawUrl(filename)` | `→ string` | URL raw pour téléchargement |

#### Méthodes privées

| Méthode | Description |
|---------|-------------|
| `#apiRequest(method, path, body?)` | Requête HTTP vers l'API GitHub |
| `#fetchFileContent(filePath)` | Récupère et décode le contenu d'un fichier |
| `#getFileSha(filePath)` | Obtient le SHA (requis pour PUT/DELETE) |
| `#updateIndex(action, entry)` | Met à jour l'index distant |
| `#utf8ToBase64(str)` | Encode UTF-8 → base64 (accents) |
| `#base64ToUtf8(base64)` | Décode base64 → UTF-8 (accents) |
| `#generateFilename(nom)` | Génère un nom de fichier sûr |

---

## 4. Modifications des fichiers existants

### 4.1 `index.html`

- Ajout de `<script src="js/github_storage.js">` après `dataset_service.js`
- Section GitHub dans le pane datasets : champs owner/repo/token, boutons test, liste GitHub
- Cache-busters mis à jour

### 4.2 `gestion_params.js`

Nouvelles fonctions exposées globalement :

| Fonction | Description |
|----------|-------------|
| `loadGitHubConfig()` | Peuple les champs du formulaire depuis localStorage |
| `saveGitHubConfig()` | Sauvegarde la config depuis les champs |
| `testGitHubConnection()` | Teste la connexion (lecture) |
| `testGitHubWriteAccess()` | Teste les droits d'écriture |
| `refreshGitHubDatasets()` | Actualise la liste GitHub |
| `chargerGitHubDataset(filename)` | Charge et importe un dataset GitHub |
| `deleteGitHubDataset(filename)` | Supprime un dataset de GitHub |

Modification de `settingsOpenSection('datasets')` : appelle `loadGitHubConfig()` en plus.

### 4.3 `mode_choice_modal.js`

- `#renderStep3()` : ajoute une section GitHub au-dessus de l'index local et du file picker
- `#loadGitHubList()` : peuple la liste GitHub de manière asynchrone
- `#onGitHubDatasetSelected(filename)` : charge et importe un dataset GitHub

### 4.4 `gestion_onglet_recherche.js`

- `_trySaveDataset()` : après le téléchargement local, tente l'upload GitHub si un token est configuré (avec try/catch indépendant — l'échec GitHub n'empêche pas le téléchargement local)

### 4.5 `utils.js`

- `APP_VERSION` → `'0.63'`

---

## 5. Diagrammes de séquence

### 5.1 Chargement d'un dataset depuis GitHub

```
Utilisateur → UI : Clic sur un dataset dans la liste GitHub
UI → GitHubStorage.loadDataset(filename)
GitHubStorage → API GitHub : GET /repos/.../contents/jeux_de_donnees/{filename}
API GitHub → GitHubStorage : { content: base64, sha }
GitHubStorage → GitHubStorage : base64ToUtf8 + JSON.parse
GitHubStorage → DatasetService.validateDataset(json)
GitHubStorage → UI : dataset Object
UI → DatasetService.importDataset(dataset)
DatasetService → DatabaseService.loadStorageSnapshot(data)
DatasetService → UI : { success, stats }
UI → Utilisateur : confirmation + statistiques
```

### 5.2 Publication d'un dataset sur GitHub

```
Utilisateur → UI : Extraction + checkbox « Sauvegarder comme jeu de données »
UI → DatasetService.exportDataset(metadata)
UI → DatasetService.downloadDataset(dataset)     ← téléchargement local
UI → GitHubStorage.uploadDataset(dataset)
GitHubStorage → GitHubStorage : utf8ToBase64(JSON.stringify(dataset))
GitHubStorage → API GitHub : PUT /repos/.../contents/jeux_de_donnees/{filename}
API GitHub → GitHubStorage : { content: { sha, html_url } }
GitHubStorage → GitHubStorage.#updateIndex('add', entry)
  → GET index.json (lire l'index + SHA)
  → modifier l'index en mémoire
  → PUT index.json (écrire l'index mis à jour)
GitHubStorage → UI : { success, filename, url }
UI → Utilisateur : confirmation
```

---

## 6. Encodage base64 UTF-8

L'API GitHub Contents attend du base64 et renvoie du base64. Pour gérer correctement les caractères accentués (noms de communes, de diplômes), l'encodage passe par `TextEncoder`/`TextDecoder` :

```
Encodage : String → TextEncoder.encode() → Uint8Array → String.fromCharCode() → btoa()
Décodage : atob() → charCodeAt() → Uint8Array → TextDecoder.decode() → String
```

Cela évite le bug classique de `btoa()` qui ne supporte que Latin-1.

---

## 7. Points d'attention

1. **Sécurité du token** : le PAT est stocké en clair dans localStorage. C'est acceptable pour un usage individuel/pédagogique, mais le token doit être fine-grained (permissions minimales, un seul dépôt).

2. **Rate limiting GitHub** : l'API non authentifiée est limitée à 60 requêtes/heure. Avec un token, la limite passe à 5 000/heure. L'utilisation normale de l'application est très loin de ces limites.

3. **Concurrence** : si deux utilisateurs uploadent en même temps, le dernier écrase l'index. C'est acceptable pour l'usage prévu (quelques enseignants partageant des datasets).

4. **Taille des fichiers** : l'API Contents est limitée à 100 Mo en base64 (~75 Mo en clair). Les datasets typiques font 0,5 à 5 Mo, bien en dessous de cette limite.

5. **Fallback gracieux** : l'échec GitHub ne bloque jamais le fonctionnement local. Le téléchargement du fichier JSON est toujours effectué en premier.

---

## 8. Tests prévus

| # | Test | Type |
|---|------|------|
| 1 | `getConfig()` retourne les valeurs par défaut si rien n'est configuré | Unitaire |
| 2 | `saveConfig()` persiste dans localStorage | Unitaire |
| 3 | `hasWriteToken()` retourne false sans token, true avec token | Unitaire |
| 4 | `#utf8ToBase64` / `#base64ToUtf8` round-trip avec accents | Unitaire |
| 5 | `#generateFilename` produit un nom sûr (pas d'accents, pas d'espaces) | Unitaire |
| 6 | `getFileUrl` / `getRawUrl` construisent les bonnes URLs | Unitaire |
| 7 | `fetchIndex` gère un 404 en retournant un index vide | Unitaire (mock) |
| 8 | `listDatasets` retourne un tableau depuis l'index | Unitaire (mock) |
| 9 | `loadDataset` décode et valide le dataset | Unitaire (mock) |
| 10 | `uploadDataset` refuse sans token | Unitaire |
| 11 | `deleteDataset` refuse sans token | Unitaire |
| 12 | `testConnection` retourne ok:false si le dépôt n'existe pas | Unitaire (mock) |
| 13 | `#apiRequest` ajoute le header Authorization si un token est présent | Unitaire (mock) |
| 14 | `#apiRequest` gère les erreurs 401, 403, 404 avec messages explicites | Unitaire (mock) |
| 15 | `#updateIndex` ajoute une entrée et trie par date décroissante | Unitaire (mock) |
| 16 | `_trySaveDataset` appelle GitHubStorage.uploadDataset si token présent | Fonctionnel (mock) |
| 17 | `_trySaveDataset` ne bloque pas si l'upload GitHub échoue | Fonctionnel (mock) |
| 18 | Écran 3 ModeChoiceModal affiche la section GitHub si configuré | Unitaire |
| 19 | Écran 3 ModeChoiceModal masque la section GitHub si non configuré | Unitaire |
