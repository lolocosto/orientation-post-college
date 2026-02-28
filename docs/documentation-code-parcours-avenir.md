# Documentation du code — Parcours Avenir v0.60

> **Auteur :** Laurent COSTE  
> **Date :** 28 février 2026  
> **Version documentée :** 0.60  
> **Objet :** Référence complète de l'architecture, des fichiers et des fonctions de l'application.

---

## Table des matières

1. [Vue d'ensemble de l'architecture](#1-vue-densemble-de-larchitecture)
2. [Couche Infrastructure — Services communs](#2-couche-infrastructure--services-communs)
   - 2.1 `http_client.js` — Client HTTP
   - 2.2 `database_service.js` — Base de données en mémoire
3. [Couche Données — APIs externes](#3-couche-données--apis-externes)
   - 3.1 `geo_api.js` — API Géographique
   - 3.2 `onisep_api.js` — API ONISEP
   - 3.3 `carif_oref_api.js` — API CARIF-OREF
   - 3.4 `data_education_api.js` — API Data Éducation
4. [Couche Données — Parsers](#4-couche-données--parsers)
   - 4.1 `geo_parser.js`
   - 4.2 `onisep_parser.js`
   - 4.3 `carif_oref_parser.js`
   - 4.4 `data_education_parser.js`
5. [Couche Métier — Contrôleurs d'extraction](#5-couche-métier--contrôleurs-dextraction)
   - 5.1 `geo_extraction_controller.js`
   - 5.2 `onisep_extraction_controller.js`
   - 5.3 `carif_oref_extraction_controller.js`
   - 5.4 `data_education_extraction_controller.js`
6. [Couche UI — Système de modales](#6-couche-ui--système-de-modales)
   - 6.1 `modal.js` — Système de modales empilables
   - 6.2 `progress_modal.js` — Modale de progression
   - 6.3 `details_modal.js` — Modale de détails
   - 6.4 `itineraire_modal.js` — Modale d'itinéraire
7. [Couche UI — Onglets et navigation](#7-couche-ui--onglets-et-navigation)
   - 7.1 `gestion_onglets.js`
   - 7.2 `gestion_onglet_recherche.js`
   - 7.3 `gestion_onglet_resultats.js` (garde anti-doublon modale, service favorisDivers — v0.51)
   - 7.4 `gestion_onglet_carte.js`
8. [Couche UI — Paramètres et préférences](#8-couche-ui--paramètres-et-préférences)
   - 8.1 `gestion_params.js` (panneau favoris 6 catégories, suppression bouton purge CARIF — v0.51)
9. [Couche UI — Filtres](#9-couche-ui--filtres)
   - 9.1 `systeme_filtres.js`
10. [Couche UI — Export](#10-couche-ui--export)
    - 10.1 `export_service.js`
11. [Initialisation et utilitaires globaux](#11-initialisation-et-utilitaires-globaux)
    - 11.1 `utils.js`
12. [Données statiques](#12-données-statiques)
    - 12.1 `parcours_bac_pro.js`
    - 12.2 `academies_data.js`
13. [Design System CSS](#13-design-system-css)
14. [Point d'entrée HTML](#14-point-dentrée-html--indexhtml)

---

## 1. Vue d'ensemble de l'architecture

L'application suit une architecture en couches strictement séparées :

```
┌─────────────────────────────────────────────────────────┐
│  POINT D'ENTRÉE  index.html + utils.js (init())         │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  COUCHE UI                                               │
│  gestion_onglets / gestion_onglet_recherche              │
│  gestion_onglet_resultats / gestion_onglet_carte         │
│  gestion_params / systeme_filtres / export_service       │
│  modal / progress_modal / details_modal / itineraire_modal│
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  COUCHE MÉTIER — CONTRÔLEURS D'EXTRACTION               │
│  geo_extraction_controller                               │
│  onisep_extraction_controller                            │
│  carif_oref_extraction_controller                        │
│  data_education_extraction_controller                    │
└──────────────┬────────────────────────┬──────────────────┘
               │                        │
┌──────────────▼──────────┐  ┌──────────▼──────────────────┐
│  COUCHE DONNÉES — APIs  │  │  COUCHE DONNÉES — PARSERS    │
│  geo_api.js             │  │  geo_parser.js               │
│  onisep_api.js          │  │  onisep_parser.js            │
│  carif_oref_api.js      │  │  carif_oref_parser.js        │
│  data_education_api.js  │  │  data_education_parser.js    │
└──────────────┬──────────┘  └──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────┐
│  COUCHE INFRASTRUCTURE — SERVICES COMMUNS               │
│  http_client.js (requêtes HTTP)                          │
│  database_service.js (stockage en mémoire)               │
└─────────────────────────────────────────────────────────┘
```

### Ordre de chargement des scripts (index.html)

| Ordre | Fichier | Rôle |
|-------|---------|------|
| 1 | `data/parcours_bac_pro.js` | Données statiques Bac Pro |
| 2 | `data/academies_data.js` | Données statiques académies |
| 3 | `js/http_client.js` | Client HTTP générique |
| 4 | `js/database_service.js` | Base de données en mémoire |
| 5 | `js/systeme_filtres.js` | Moteur de filtrage |
| 6–9 | `js/geo_api.js` … `js/carif_oref_parser.js` | APIs et parsers |
| 10–13 | `js/geo_extraction_controller.js` … | Contrôleurs d'extraction |
| 14–16 | `js/modal.js` / `progress_modal.js` / `details_modal.js` | Modales |
| 17 | `js/gestion_params.js` | Panneau paramètres |
| 18 | `js/itineraire_modal.js` | Modale itinéraire |
| 19–22 | `js/gestion_onglets.js` … | Modules UI onglets |
| 23 | `js/export_service.js` | Export CSV/PDF |
| 24 | `js/utils.js` | Init + utilitaires globaux |

### Variables globales importantes

| Variable | Type | Initialisée dans | Description |
|----------|------|-----------------|-------------|
| `window.databaseService` | `DatabaseService` | `utils.js → init()` | Instance unique de la base en mémoire |
| `window.onisepExtractionController` | `OnisepExtractionController` | `utils.js → init()` | Contrôleur ONISEP |
| `window.geoExtractionController` | `GeoExtractionController` | `utils.js → init()` | Contrôleur Géo |
| `window.carifOrefExtractionController` | `CARIFOREFExtractionController` | `utils.js → init()` | Contrôleur CARIF-OREF |
| `window.dataEducationExtractionController` | `DataEducationExtractionController` | `utils.js → init()` | Contrôleur DataEducation |
| `window.extractionStopped` | `boolean` | `gestion_onglet_recherche.js` | Flag d'arrêt de l'extraction |

---

## 2. Couche Infrastructure — Services communs

### 2.1 `js/http_client.js` — Client HTTP

**Rôle :** Factoriser la logique HTTP commune à toutes les APIs : retry automatique, gestion du rate limiting HTTP 429, backoff exponentiel.

**Classe : `HttpClient`**

#### Propriétés privées

| Propriété | Type | Description |
|-----------|------|-------------|
| `#label` | `string` | Préfixe des messages de log (ex : `'OnisepAPI'`) |
| `#defaultHeaders` | `Object \| Function` | En-têtes fixes ou fonction retournant les en-têtes (pour tokens dynamiques) |
| `#maxRetries` | `number` | Nombre maximum de tentatives (défaut : 5) |
| `#initialDelay` | `number` | Délai initial avant retry en ms (défaut : 1000) |
| `#requestCount` | `number` | Compteur de requêtes effectuées |

#### Constructeur

```javascript
new HttpClient({ label, headers, maxRetries, initialDelay })
```

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `label` | `string` | `'HttpClient'` | Préfixe de log |
| `headers` | `Object\|Function` | `{}` | En-têtes à envoyer sur chaque requête |
| `maxRetries` | `number` | `5` | Nombre max de tentatives |
| `initialDelay` | `number` | `1000` | Délai initial retry en ms |

#### Méthodes publiques

---

**`async get(url, options)`**

Effectue un GET avec retry automatique et gestion du rate limiting HTTP 429.

| Paramètre | Type | Description |
|-----------|------|-------------|
| `url` | `string` | URL complète de la requête |
| `options` | `Object` | Options supplémentaires passées à `fetch()` |

**Retourne :** `Promise<Object>` — JSON parsé de la réponse.

**Comportement :**
- En cas d'erreur 429 (rate limit), attend le délai indiqué dans l'en-tête `Retry-After` ou applique un backoff exponentiel.
- En cas d'erreur réseau ou 5xx, retry avec backoff exponentiel.
- Après `maxRetries` tentatives, lève une exception.

---

**`get requestCount()`**

**Retourne :** `number` — Nombre total de requêtes HTTP effectuées depuis la création de l'instance.

---

### 2.2 `js/database_service.js` — Base de données en mémoire

**Rôle :** Stocker et récupérer toutes les données extraites (établissements, diplômes, dispositifs, options, spécialités). Remplace SQLite (SQL.js abandonné). Le stockage est un objet JS en mémoire — les données sont perdues au rechargement de la page.

**Classe : `DatabaseService`**

#### Structure de stockage interne (`#storage`)

```javascript
{
  etablissements: {},                    // clé : _id interne
  diplomes: {},                          // clé : libelle
  diplomes_par_etablissement: {},        // clé : id relation
  diplomes_apprentissage: {},            // clé : libelle
  diplomes_apprentissage_par_etablissement: {},
  dispositifs: {},                       // clé : libelle
  dispositifs_par_etablissement: {},     // clé : id relation
  options_2nde_gt: {},                  // clé : libelle
  options_2nde_gt_par_etablissement: {},
  specialites_1ereG: {},               // clé : libelle
  specialites_1ereG_par_etablissement: {}
}
```

#### Méthodes publiques

---

**`async init()`**

Initialise la base de données (réinitialise le stockage). À appeler une seule fois au démarrage.

---

**`async clearAllData()`**

Vide intégralement toutes les tables. Utilisé avant chaque nouvelle extraction.

---

##### Établissements

**`async insertEtablissement(etablissement)`**

Insère un établissement. Génère un `_id` interne si absent.

| Paramètre | Type | Description |
|-----------|------|-------------|
| `etablissement` | `Object` | Objet établissement parsé |

**Retourne :** `Promise<string>` — `_id` de l'établissement inséré.

---

**`async getEtablissement(id)`**

**Paramètre :** `id` — `string` — Identifiant interne `_id`.  
**Retourne :** `Promise<Object|null>` — Établissement ou `null`.

---

**`getEtablissementByUaiSync(uai)`**

Recherche synchrone d'un établissement par son code UAI (recherche linéaire sur tous les établissements).

**Paramètre :** `uai` — `string` — Code UAI à rechercher.  
**Retourne :** `Object|null`

---

**`async getEtablissementByUai(uai)`**

Version asynchrone de `getEtablissementByUaiSync`.

---

**`async getAllEtablissements()`**

**Retourne :** `Promise<Object[]>` — Tableau de tous les établissements.

---

**`async getEtablissementEnrichi(uai)`**

Récupère un établissement avec toutes ses relations (diplômes scolaires, diplômes apprentissage, dispositifs, options 2nde GT, spécialités 1ère G).

**Paramètre :** `uai` — `string`  
**Retourne :** `Promise<Object|null>` — Objet établissement enrichi ou `null`.

---

##### Diplômes (voie scolaire)

**`async insertDiplome(diplome)`**

Insère un diplôme scolaire. La clé est `diplome.libelle`.

**`async updateDiplome(libelle, updates)`**

Met à jour les champs d'un diplôme existant.

**`async insertDiplomeParEtablissement(relation)`**

Insère une relation diplôme ↔ établissement. Génère un `id` si absent.

**`async getDiplome(libelle)`** / **`async getAllDiplomes()`**

Récupère un ou tous les diplômes.

**`async getAllDiplomesParEtablissement()`**

**`getDiplomesParEtablissementSync(etabId)`**

Version synchrone — récupère les diplômes scolaires d'un établissement par son `_id`.

---

##### Diplômes apprentissage (voie CARIF-OREF)

Même interface que les diplômes scolaires, préfixée `DiplomesApprentissage` :

- `insertDiplomeApprentissage(diplome)`
- `insertDiplomeApprentissageParEtablissement(relation)`
- `getAllDiplomesApprentissage()`
- `getAllDiplomesApprentissageParEtablissement()`
- `getDiplomesApprentissageParEtablissementSync(etabId)`

---

##### Dispositifs

- `async insertDispositif(dispositif)`
- `async updateDispositif(libelle, updates)`
- `async insertDispositifParEtablissement(relation)`
- `async getDispositif(libelle)` / `async getAllDispositifs()`
- `async getAllDispositifsParEtablissement()`
- `async getDispositifEnrichi(libelle)` — Retourne le dispositif avec la liste des établissements qui le proposent.

---

##### Options 2nde GT

- `async insertOption2ndeGT(option)`
- `async insertOption2ndeGTParEtablissement(relation)`
- `async getOption2ndeGT(libelle)` / `async getAllOptions2ndeGT()`
- `async getAllOptions2ndeGTParEtablissement()`
- `async getAllOptions2ndeGTAvecComptage()` — Retourne les options avec le nombre d'établissements qui les proposent.
- `async getOptions2ndeGTParEtablissement(etabId)` — Retourne les options proposées par un établissement donné.

---

##### Spécialités 1ère GT

- `async insertSpecialite1ereG(specialite)`
- `async insertSpecialite1ereGParEtablissement(relation)`
- `async getAllSpecialites1ereG()`
- `async getSpecialites1ereGParEtablissement(etabId)`

---

##### Divers

**`async getAllZones(type)`**

**Paramètre :** `type` — `'departement' | 'academie'`  
**Retourne :** `Promise<string[]>` — Liste des zones uniques parmi les établissements stockés.

**`async getStats()`**

**Retourne :** `Promise<Object>` — Compteurs : `etablissements`, `diplomes`, `diplomesApprentissage`, `dispositifs`, `options2ndeGT`, `specialites1ereG`.

---

## 3. Couche Données — APIs externes

### 3.1 `js/geo_api.js` — API Géographique

**Rôle :** Interroger l'API `geo.api.gouv.fr` pour rechercher des communes, des EPCI, ou géocoder des adresses.

**Classe : `GeoAPI`**

| Endpoint utilisé | Description |
|-----------------|-------------|
| `GET /communes?nom=...` | Recherche de communes par nom |
| `GET /communes/{code}` | Détails d'une commune |
| `GET /epcis` | Liste des EPCI |
| `GET /epcis/{code}/communes` | Communes d'un EPCI |

#### Méthodes publiques

**`async searchCommunes(pattern, options)`**

Recherche des communes par pattern de nom.

| Paramètre | Type | Description |
|-----------|------|-------------|
| `pattern` | `string` | Pattern de recherche (min. 3 caractères) |
| `options.limit` | `number` | Nombre max de résultats (défaut : 10) |
| `options.codeDepartement` | `string` | Filtre par département |
| `options.codeRegion` | `string` | Filtre par région |

**Retourne :** `Promise<Object[]>` — Données brutes de l'API.

---

**`async getCommuneDetails(codeInsee)`**

**Retourne :** `Promise<Object>` — Détails d'une commune (nom, code, département, région, coordonnées GPS).

---

**`async getCommunesEPCI(codeEpci)`**

**Retourne :** `Promise<Object[]>` — Communes appartenant à un EPCI.

---

**`async getAllEPCIs()`**

**Retourne :** `Promise<Object[]>` — Liste de tous les EPCI de France.

---

**`async geocodeAddress(adresse)`**

Géocode une adresse textuelle via Nominatim/OSM.

**Retourne :** `Promise<{latitude, longitude, nom, adresse}|null>`

---

### 3.2 `js/onisep_api.js` — API ONISEP

**Rôle :** Interroger l'API Open Data ONISEP pour extraire les établissements scolaires et leurs formations.

**Classe : `OnisepAPI`**

> **Authentification requise :** token JWT obtenu par login email/mot de passe.

| Endpoint utilisé | Description |
|-----------------|-------------|
| `POST /auth/login` | Authentification |
| `GET /etablissements` | Liste des établissements (filtrage géo ou diplôme) |
| `GET /etablissements/{id}/formations` | Formations d'un établissement |

#### Méthodes publiques

**`async login(email, password, appId)`**

Authentifie l'utilisateur et stocke le token JWT en interne.

| Paramètre | Type | Description |
|-----------|------|-------------|
| `email` | `string` | Email ONISEP |
| `password` | `string` | Mot de passe |
| `appId` | `string` | Identifiant d'application ONISEP |

**Retourne :** `Promise<boolean>` — `true` si authentification réussie.

---

**`isAuthenticated()`**

**Retourne :** `boolean` — `true` si un token valide est présent.

---

**`async getEtablissementsByGeo(params, progressCallback)`**

Extrait les établissements scolaires pour une zone géographique.

| Paramètre | Type | Description |
|-----------|------|-------------|
| `params.type` | `string` | `'commune'` \| `'intercommunalite'` |
| `params.value` | `string` | Code INSEE ou code EPCI |
| `params.facet` | `Object` | Facette géographique complémentaire |
| `progressCallback` | `Function` | Callback `(message, current, total)` |

**Retourne :** `Promise<Object[]>` — Établissements bruts (pagination gérée en interne).

---

**`async getEtablissementsByDiplomes(diplomes, facetGeo, progressCallback)`**

Extrait les établissements proposant des diplômes spécifiques dans une zone géographique.

| Paramètre | Type | Description |
|-----------|------|-------------|
| `diplomes` | `Object[]` | Liste de diplômes avec leurs UAI |
| `facetGeo` | `Object` | Filtre géographique (département ou académie) |
| `progressCallback` | `Function` | Callback de progression |

**Retourne :** `Promise<Object[]>`

---

**`async getDiplomesDisponibles(type, value)`**

Récupère la liste des diplômes disponibles pour un département ou une académie (niveaux 3 et 4 uniquement).

| Paramètre | Type | Description |
|-----------|------|-------------|
| `type` | `string` | `'departement'` \| `'academie'` |
| `value` | `string` | Code du département ou nom de l'académie |

**Retourne :** `Promise<Object[]>` — Diplômes disponibles.

---

**`async getAcademiesDisponibles()`**

**Retourne :** `Promise<string[]>` — Liste des noms d'académies disponibles dans l'API.

---

### 3.3 `js/carif_oref_api.js` — API CARIF-OREF

**Rôle :** Interroger l'API du Catalogue national de l'apprentissage pour extraire les CFA (centres de formation d'apprentis) et leurs formations (niveaux CAP et BAC uniquement).

**Classe : `CARIFOREFApi`**

> **Pas d'authentification requise.** API publique.

**Constantes de classe :**

| Constante | Valeur | Description |
|-----------|--------|-------------|
| `NIVEAUX_APPRENTISSAGE` | `['3 (CAP...)', '4 (BAC...)']` | Niveaux extraits |
| `NIVEAUX_EXCLUS` | `['5 (', '6 (', '7 (']` | Niveaux post-bac exclus |

| Endpoint utilisé | Description |
|-----------------|-------------|
| `GET /api/v1/entity/etablissements` | Établissements (filtrage par codes INSEE) |
| `GET /api/v1/entity/formations` | Formations (filtrage par UAI) |

#### Méthodes publiques

**`async getEtablissementsByCommunes(codesInsee, progressCallback)`**

Étape 1 du flux géo — récupère les établissements CFA pour une liste de codes INSEE.

**Filtre appliqué :** exclut `ferme: true` et `uai: null`.

| Paramètre | Type | Description |
|-----------|------|-------------|
| `codesInsee` | `string\|string[]` | Code(s) INSEE des communes |
| `progressCallback` | `Function` | Callback de progression |

**Retourne :** `Promise<Object[]>` — Établissements bruts (pagination gérée).

---

**`async getFormationsByUAIs(uais, progressCallback)`**

Étape 2 du flux géo — récupère les formations pour une liste d'UAI.

**Filtre appliqué :** `rncp_eligible_apprentissage: true` ET `cfd_outdated: false`.

| Paramètre | Type | Description |
|-----------|------|-------------|
| `uais` | `string[]` | Liste de codes UAI |
| `progressCallback` | `Function` | Callback de progression |

**Retourne :** `Promise<Object[]>` — Formations brutes.

---

**`async getDiplomesByZone(type, value)`**

Récupère les diplômes disponibles pour un département ou une académie (liste sans stockage).

**Retourne :** `Promise<Object[]>` — Diplômes de niveaux 3 et 4 uniquement.

---

**`async getEtablissementsByUAIs(uais)`**

Flux extraction par diplômes — récupère les données des établissements pour des UAI connus.

**Retourne :** `Promise<Object[]>`

---

**`get requestCount()`**

**Retourne :** `number` — Compteur de requêtes HTTP effectuées.

---

### 3.4 `js/data_education_api.js` — API Data Éducation

**Rôle :** Interroger l'API `data.education.gouv.fr` pour enrichir les établissements avec des informations complémentaires (coordonnées GPS, langues enseignées, options de 2nde GT, spécialités de 1ère GT).

**Classe : `DataEducationAPI`**

> **Pas d'authentification requise.** API publique.

#### Méthodes publiques

**`async getEtablissementByUai(uai)`**

**Retourne :** `Promise<Object|null>` — Données de l'établissement (localisation, coordonnées GPS).

---

**`async getLanguesByUai(uai)`**

**Retourne :** `Promise<Object[]>` — Langues enseignées dans l'établissement.

---

**`async getOptions2ndeGTByUai(uai)`**

**Retourne :** `Promise<Object[]>` — Options de seconde GT proposées.

---

**`async getSpecialites1ereGByUai(uai)`**

**Retourne :** `Promise<Object[]>` — Spécialités de 1ère GT proposées.

---

## 4. Couche Données — Parsers

Les parsers transforment les données brutes des APIs en objets normalisés utilisés dans la base de données interne. Ce sont des classes statiques (pas d'état).

### 4.1 `js/geo_parser.js`

**Classe : `GeoDataParser`** (méthodes statiques)

**`static parseCommunes(rawCommunes)`**

Normalise une liste de communes brutes en objets `{nom, code, codeDepartement, codeRegion, latitude, longitude, codeEpci}`.

**`static parseEPCI(rawEpci)`**

Normalise un EPCI brut.

**`static parseDomicile(nominatimResult)`**

Normalise le résultat de géocodage Nominatim pour le domicile utilisateur.

---

### 4.2 `js/onisep_parser.js`

**Classe : `OnisepDataParser`** (méthodes statiques)

**`static parseEtablissement(raw)`**

Normalise un établissement ONISEP brut.

| Champ produit | Source API |
|--------------|-----------|
| `_id` | Généré en interne |
| `uai` | `ens_etablissement_code_uai` |
| `nom` | `ens_etablissement_nom_uai` |
| `type` | `ens_type_contrat_prive` |
| `statut` | `ens_statut_public_prive` |
| `adresse` | `ens_adresse` |
| `commune` | `ens_commune` |
| `codePostal` | `ens_code_postal` |
| `departement` | `ens_departement` |
| `academie` | `ens_academie` |
| `latitude` / `longitude` | `ens_latitude` / `ens_longitude` |
| `telephone` | `ens_telephone` |
| `urlOnisep` | `ens_url` |
| `voie` | `'scolaire'` (fixe) |

**`static parseDiplome(raw)`**

Normalise un diplôme/formation ONISEP brut en `{libelle, intitule, niveau, type, urlOnisep, ...}`.

**`static parseDispositif(raw)`**

Normalise un dispositif ONISEP (ULIS, SEGPA, lycée des métiers, etc.).

**`static parseOption2ndeGT(raw)`**

Normalise une option de 2nde GT.

**`static parseSpecialite1ereG(raw)`**

Normalise une spécialité de 1ère GT.

---

### 4.3 `js/carif_oref_parser.js`

**Classe : `CARIFOREFParser`** (méthodes statiques)

**`static parseEtablissement(raw)`**

Normalise un établissement CFA brut.

| Champ produit | Source API |
|--------------|-----------|
| `_id` | Généré en interne |
| `uai` | `uai` |
| `nom` | `enseigne` ou `raison_sociale` |
| `siret` | `siret` |
| `adresse` | Reconstituée depuis les champs d'adresse |
| `commune` | `localite` |
| `codePostal` | `code_postal` |
| `departement` | `nom_departement` |
| `codeInsee` | `code_insee_localite` |
| `latitude` / `longitude` | `latitude` / `longitude` |
| `voie` | `'apprentissage'` (fixe) |

**`static parseFormation(raw)`**

Normalise une formation CARIF-OREF brut en `{libelle, niveau, type, rncp, cfd, ...}`.

**`static filterFormations(formations)`**

Filtre les formations : conserve uniquement `rncp_eligible_apprentissage: true` ET `cfd_outdated: false`, et exclut les niveaux post-bac (5, 6, 7).

---

### 4.4 `js/data_education_parser.js`

**Classe : `DataEducationParser`** (méthodes statiques)

**`static parseEtablissement(raw)`**

Extrait les coordonnées GPS et les identifiants depuis les données DataEducation.

**`static parseLangue(raw)`**

Normalise une langue enseignée.

**`static parseOption2ndeGT(raw)`**

Normalise une option de 2nde GT.

**`static parseSpecialite1ereG(raw)`**

Normalise une spécialité de 1ère GT.

---

## 5. Couche Métier — Contrôleurs d'extraction

Les contrôleurs orchestrent le processus complet : appel API → parsing → filtrage → enrichissement → stockage en base. Ils créent et gèrent également les modales de progression.

### 5.1 `js/geo_extraction_controller.js`

**Rôle :** Fournir les services géographiques aux autres contrôleurs (recherche communes, résolution EPCI, géocodage).

**Classe : `GeoExtractionController`**

#### Méthodes publiques

**`init()`**

Connecte `window.databaseService`. À appeler après l'initialisation de la base.

---

**`async searchCommunes(pattern, options)`**

Recherche des communes par nom. Délègue à `GeoAPI.searchCommunes()` puis parse avec `GeoDataParser.parseCommunes()`.

**Retourne :** `Promise<Object[]>` — Communes normalisées.

---

**`async getCommuneDetails(codeInsee)`**

**Retourne :** `Promise<Object>` — Détails d'une commune.

---

**`async getCodesInseeForZone(type, value)`**

Résout les codes INSEE pour une zone géographique donnée.

| Paramètre | Type | Description |
|-----------|------|-------------|
| `type` | `string` | `'commune'` \| `'intercommunalite'` |
| `value` | `string` | Code INSEE ou code SIREN EPCI |

**Retourne :** `Promise<string[]>` — Liste de codes INSEE.

---

**`async getAllEPCIs()`**

Charge et met en cache la liste de tous les EPCI.

**Retourne :** `Promise<Object[]>`

---

**`getEPCIByCode(codeEpci)`**

**Retourne :** `Object|null` — EPCI correspondant au code SIREN, depuis le cache.

---

**`async geocodeAddress(adresse)`**

Géocode une adresse via Nominatim.

**Retourne :** `Promise<{latitude, longitude, nom, adresse}|null>`

---

### 5.2 `js/onisep_extraction_controller.js`

**Rôle :** Orchestrer l'extraction des données ONISEP (voie scolaire). Gère l'authentification, l'extraction géographique et l'extraction par diplômes.

**Classe : `OnisepExtractionController`**

#### Propriétés privées

| Propriété | Description |
|-----------|-------------|
| `#onisepAPI` | Instance de `OnisepAPI` |
| `#databaseService` | Référence à `window.databaseService` |
| `#geoController` | Référence à `GeoExtractionController` |
| `#currentProgressModal` | Instance temporaire de `ProgressModal` pendant l'extraction |
| `#isStopped` | Flag d'arrêt de l'extraction |

#### Méthodes publiques

**`init()`**

Connecte `window.databaseService`.

**`setGeoController(geoController)`**

Connecte le `GeoExtractionController`.

**`isAuthenticated()`**

**Retourne :** `boolean`

---

**`async login(email, password, appId)`**

Authentifie l'utilisateur sur l'API ONISEP.

**Retourne :** `Promise<boolean>`

---

**`async extractByGeo(params)`**

Extraction géographique (commune ou EPCI).

| Paramètre | Type | Description |
|-----------|------|-------------|
| `params.type` | `string` | `'commune'` \| `'intercommunalite'` |
| `params.value` | `string` | Valeur identifiant la zone |
| `params.displayInfo` | `Object` | Informations d'affichage (nom, etc.) |
| `params.voies` | `string[]` | `['scolaire']` (ONISEP = scolaire uniquement) |

**Retourne :** `Promise<{success, stats, extractionInfo}>`

**Processus interne :**
1. Résolution des codes INSEE via `GeoExtractionController`
2. Appel `OnisepAPI.getEtablissementsByGeo()`
3. Parsing avec `OnisepDataParser`
4. Stockage dans `DatabaseService`
5. Enrichissement via `DataEducationExtractionController`

---

**`async extractByDiplomes(params)`**

Extraction par sélection de diplômes dans une zone géographique.

| Paramètre | Type | Description |
|-----------|------|-------------|
| `params.libelles` | `string[]` | Libellés des diplômes sélectionnés |
| `params.type` | `string` | `'departement'` \| `'academie'` |
| `params.value` | `string` | Code/nom de la zone |
| `params.displayInfo` | `Object` | Infos d'affichage |

**Retourne :** `Promise<{success, stats, extractionInfo}>`

---

**`async extractByOptions(params)`**

Extraction par sélection d'options de 2nde GT.

---

**`stop()`**

Arrête l'extraction en cours (positionnement du flag `#isStopped`).

---

**`async reset()`**

Réinitialise l'état interne du contrôleur.

---

### 5.3 `js/carif_oref_extraction_controller.js`

**Rôle :** Orchestrer l'extraction des données CARIF-OREF (voie apprentissage).

**Classe : `CARIFOREFExtractionController`**

Même interface que `OnisepExtractionController` (méthodes `init()`, `setGeoController()`, `extractByGeo()`, `extractByDiplomesLibelles()`, `stop()`).

#### Particularités

- Filtre systématiquement les formations avec `rncp_eligible_apprentissage: true` et `cfd_outdated: false`.
- N'extrait que les niveaux CAP (3) et BAC (4).
- Pas d'authentification requise.

**`async extractByGeo(params)`**

Flux en 2 étapes :
1. `CARIFOREFApi.getEtablissementsByCommunes(codesInsee)` → liste d'établissements + UAI
2. `CARIFOREFApi.getFormationsByUAIs(uais)` → formations par établissement

**`async extractByDiplomesLibelles(libelles, uaisParLibelle)`**

Flux extraction par diplômes :
1. `CARIFOREFApi.getEtablissementsByUAIs(uais)` → données établissements
2. `CARIFOREFApi.getFormationsByUAIs(uais)` → formations correspondantes

---

### 5.4 `js/data_education_extraction_controller.js`

**Rôle :** Enrichir les établissements déjà stockés avec des données complémentaires (coordonnées GPS, langues, options 2nde GT, spécialités 1ère GT) en interrogeant `data.education.gouv.fr`.

**Classe : `DataEducationExtractionController`**

#### Méthodes publiques

**`init()`**

Connecte `window.databaseService`.

---

**`async enrichirEtablissements(etablissements, progressCallback)`**

Enrichit une liste d'établissements avec leurs coordonnées GPS.

| Paramètre | Type | Description |
|-----------|------|-------------|
| `etablissements` | `Object[]` | Établissements à enrichir |
| `progressCallback` | `Function` | Callback `(message, current, total)` |

---

**`async enrichirAvecLangues(force)`**

Enrichit tous les établissements de la base avec leurs langues enseignées.

**Paramètre :** `force` — `boolean` — Si `true`, réenrichit même si déjà fait.

---

**`async enrichirAvecOptions2ndeGT(uais)`**

Enrichit des établissements avec leurs options de 2nde GT.

---

**`async enrichirAvecSpecialites1ereG(uais)`**

Enrichit des établissements avec leurs spécialités de 1ère GT.

---

## 6. Couche UI — Système de modales

### 6.1 `js/modal.js` — Système de modales empilables

**Rôle :** Fournir un système de modales empilables avec gestion automatique des z-index, fermeture par Échap ou clic sur le fond, et nettoyage du DOM à la fermeture.

#### Classe : `ModalStack`

Pile globale de modales (statique). Gère l'empilement et les z-index.

**`static push(modal)`** — Ajoute une modale à la pile et met à jour les z-index.  
**`static pop(modal)`** — Retire une modale de la pile.  
**`static removeById(modalId)`** — Retire une modale par son ID.  
**`static isTop(modal)`** — Retourne `true` si la modale est au sommet de la pile.  
**`static clear()`** — Vide la pile.

#### Classe : `Modal`

**Constructeur**

```javascript
new Modal(id, title, options)
```

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Identifiant unique de la modale |
| `title` | `string` | Titre affiché dans l'en-tête |
| `options.width` | `string` | Largeur CSS (défaut : `'600px'`) |
| `options.showCloseButton` | `boolean` | Afficher le bouton ✕ (défaut : `true`) |

**Méthodes publiques**

**`open()`** — Affiche la modale et l'ajoute à `ModalStack`.  
**`close()`** — Ferme la modale et la retire de `ModalStack`.  
**`destroy()`** — Ferme et retire l'élément du DOM.  
**`setTitle(title)`** — Met à jour le titre.  
**`setContent(html)`** — Remplace le contenu du body.  
**`setZIndex(zIndex)`** — (Utilisé par `ModalStack`.)  
**`get element()`** — Retourne l'élément DOM.  
**`get isOpen()`** — Retourne l'état d'ouverture.  
**`get modalId()`** — Retourne l'ID.  
**`getBodyElement()`** — Retourne l'élément body de la modale.

---

### 6.2 `js/progress_modal.js` — Modale de progression

**Rôle :** Afficher la progression d'une extraction avec barre de progression, messages et détails. Créée dynamiquement à chaque extraction, détruite à la fermeture.

**Classe : `ProgressModal`**

**Constructeur**

```javascript
new ProgressModal(modalId, onClose, autoSwitchToResults)
```

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `modalId` | `string` | auto-généré | ID unique |
| `onClose` | `Function` | `null` | Callback à la fermeture |
| `autoSwitchToResults` | `boolean` | `true` | Bascule automatiquement vers l'onglet Résultats en cas de succès |

**Méthodes publiques**

**`show()`** — Affiche la modale.  
**`hide(delay)`** — Cache la modale après `delay` ms.  
**`update(message, current, total)`** — Met à jour la barre de progression et le message.  
**`addDetail(text, type)`** — Ajoute une ligne de détail (`type` : `'success'`, `'error'`, `'info'`).  
**`hideWithSuccess(delay)`** — Ferme la modale après succès et bascule optionnellement vers les résultats.  
**`createCallback()`** — Retourne une fonction `(message, current, total) => void` à passer aux contrôleurs.

---

### 6.3 `js/details_modal.js` — Modale de détails

**Rôle :** Afficher les fiches détaillées des entités (établissements, diplômes scolaires, diplômes apprentissage, dispositifs, options 2nde GT). Supporte la navigation précédent/suivant dans la liste courante.

**Classe : `DetailsModal`**

**Constructeur**

```javascript
new DetailsModal(baseId, uniqueSuffix)
```

**Méthodes publiques**

**`async showEtablissement(etablissementEnrichi)`** — Affiche la fiche d'un établissement (informations, diplômes scolaires et apprentissage, dispositifs, options, itinéraire).

**`async showDiplome(diplomeEnrichi)`** — Affiche la fiche d'un diplôme scolaire (description, métiers, poursuites d'études, établissements).

**`async showDiplomeApprentissage(diplomeEnrichi)`** — Affiche la fiche d'un diplôme apprentissage (lien France Compétences, centres de formation).

**`async showDispositif(dispositifEnrichi)`** — Affiche la fiche d'un dispositif (établissements proposant ce dispositif).

**`async showOption2ndeGT(optionEnrichie)`** — Affiche la fiche d'une option de 2nde GT.

**`navigateTo(index)`** — Navigue vers l'élément à la position `index` dans la liste courante.

#### Fonctions globales associées

**`window.openEtablissementDetailsFromModal(uai)`** — Ouvre une fiche établissement depuis une autre modale (empilement).

**`window.openDiplomeDetailsFromModal(libelle)`** — Ouvre une fiche diplôme depuis une autre modale.

---

### 6.4 `js/itineraire_modal.js` — Modale d'itinéraire

**Rôle :** Proposer un itinéraire vers un établissement via Google Maps (sans clé API). Compatible mobile (ouvre l'application Maps native).

**`openItineraireModal({ nom, latitude, longitude })`**

Ouvre la modale d'itinéraire pour l'établissement cible.

| Paramètre | Type | Description |
|-----------|------|-------------|
| `nom` | `string` | Nom de l'établissement destination |
| `latitude` | `number` | Latitude GPS de la destination |
| `longitude` | `number` | Longitude GPS de la destination |

**Comportement :**
- Charge les points de départ disponibles (domicile et/ou établissement utilisateur depuis `localStorage`).
- Si aucun point de départ n'est défini, affiche une alerte invitant à compléter les paramètres.
- L'utilisateur choisit le point de départ et le mode de transport (voiture, transports en commun, marche, vélo).
- Ouvre l'URL Google Maps dans un nouvel onglet.

**Fonctions privées associées**

**`_loadDomicile()`** — Charge le domicile utilisateur depuis `localStorage` (`pref_user_domicile`).  
**`_loadEtablissement()`** — Charge l'établissement utilisateur depuis `localStorage` (`pref_user_etablissement`).  
**`_buildGoogleMapsUrl(depart, dest, mode)`** — Construit l'URL Google Maps.  
**`_lancerItineraire()`** — Ouvre l'URL dans un nouvel onglet.

---

## 7. Couche UI — Onglets et navigation

### 7.1 `js/gestion_onglets.js`

**Rôle :** Gérer la navigation entre les 3 onglets principaux (Recherche, Résultats, Carte).

**Variable d'état :** `currentTab` — `string` — Onglet courant.

**`switchTab(tabName)`**

Change l'onglet actif.

| Paramètre | Type | Description |
|-----------|------|-------------|
| `tabName` | `string` | `'recherche'` \| `'resultats'` \| `'carte'` |

**Actions déclenchées par onglet :**
- `'recherche'` → `initSearchTab()`
- `'resultats'` → `initResultsTab()`
- `'carte'` → `initMap()` + `refreshMap()`

**`switchToResults()`**

Raccourci : `switchTab('resultats')`. Utilisé par les contrôleurs après une extraction réussie.

---

### 7.2 `js/gestion_onglet_recherche.js`

**Rôle :** Gérer l'onglet Recherche : formulaires de recherche géographique et par items (diplômes, options 2nde GT), déclenchement des extractions.

#### Variables d'état

| Variable | Type | Description |
|----------|------|-------------|
| `searchMode` | `string` | Mode actif : `'geo'` \| `'diplomes'` \| `'options'` |
| `extractionStopped` | `boolean` | Flag d'arrêt |
| `selectedCommune` | `Object\|null` | Commune sélectionnée |
| `selectedScope` | `string\|null` | `'commune'` \| `'intercommunalite'` |
| `ItemsDisponibles` | `Object\|null` | Items disponibles (diplômes ou options) |
| `itemsGeoType` | `string` | Type de zone géo : `'departement'` \| `'academie'` |
| `itemsGeoValue` | `string\|null` | Valeur de la zone géo |

#### Fonctions principales

**`async initSearchTab()`**

Initialise l'onglet (active le mode géo par défaut).

---

**`switchSearchMode(mode)`**

Bascule entre les modes d'extraction.

| Paramètre | Type | Description |
|-----------|------|-------------|
| `mode` | `string` | `'geo'` \| `'diplomes'` \| `'options'` |

---

**`async smartSearch(pattern)`**

Recherche intelligente de communes avec auto-complétion. Déclenche la recherche après 3 caractères et 300 ms de pause (debounce).

---

**`selectCommune(commune, scope)`**

Sélectionne une commune et définit le périmètre géographique.

| Paramètre | Type | Description |
|-----------|------|-------------|
| `commune` | `Object` | Commune normalisée |
| `scope` | `string` | `'commune'` \| `'intercommunalite'` |

---

**`clearSelection()`**

Efface la sélection géographique courante.

**`resetGeoSearch()`**

Réinitialise complètement la recherche géographique.

---

**`async lancerExtractionGeo()`**

Lance l'extraction géographique. Vérifie la connexion ONISEP, vide la base, appelle les contrôleurs ONISEP et/ou CARIF-OREF selon les voies sélectionnées.

**Préconditions :** commune sélectionnée + connexion ONISEP (si voie scolaire) + au moins une voie cochée.

---

**`updateItemsGeoFields(type)`**

Met à jour les champs géographiques de la recherche par items (`'diplomes'` ou `'options'`).

---

**`async loadItemsDisponibles(type)`**

Charge la liste des items disponibles (diplômes ou options) pour la zone géographique sélectionnée.

---

**`async lancerExtractionItems(type)`**

Lance l'extraction par items. Déduit les voies (scolaire/apprentissage) à partir des items sélectionnés.

---

**`getVoiesSelectionnees(mode)`**

**Retourne :** `string[]` — Voies cochées : `['scolaire']`, `['apprentissage']` ou `['scolaire', 'apprentissage']`.

---

**`getVoiesDiplomesSelectionnes(selectedItems)`**

Déduit les voies à partir des diplômes sélectionnés (voie scolaire si des UAI ONISEP existent, apprentissage si des UAI CARIF-OREF existent).

**Retourne :** `string[]`

---

**`stopExtraction()`**

Arrête l'extraction en cours (positionne `window.extractionStopped = true` et appelle `stop()` sur les contrôleurs actifs).

---

### 7.3 `js/gestion_onglet_resultats.js`

**Rôle :** Gérer l'onglet Résultats : tableaux de données, statistiques, tri, navigation vers les détails, export.

#### Variables d'état

| Variable | Type | Description |
|----------|------|-------------|
| `currentView` | `string` | Vue active parmi les 5 vues |
| `currentData` | `Object[]` | Données chargées pour la vue |
| `filteredData` | `Object[]` | Données après application des filtres |
| `sortState` | `Object` | État du tri par vue (colonne + direction) |
| `currentFilter` | `string` | Texte de filtre courant |

**Vues disponibles :**

| Valeur | Description |
|--------|-------------|
| `'etablissements'` | Liste des établissements |
| `'diplomes_scolaire'` | Diplômes voie scolaire |
| `'diplomes_apprentissage'` | Diplômes voie apprentissage |
| `'dispositifs'` | Dispositifs spécialisés |
| `'options2ndeGT'` | Options de 2nde GT |

#### Fonctions principales

**`async initResultsTab()`**

Initialise l'onglet résultats : charge les statistiques et affiche la vue courante.

---

**`async loadStats()`**

Charge et affiche les statistiques globales (compteurs par type d'entité) dans les stat-cards.

---

**`switchView(viewName)`**

Bascule vers une vue de résultats et recharge les données.

---

**`async loadView()`**

Charge les données de la vue active depuis `DatabaseService`, met à jour le titre et déclenche l'affichage.

---

**`sortBy(column)`**

Trie la vue courante par la colonne indiquée. Inverse la direction si la colonne est déjà active.

---

**`async showEtablissementDetails(id)`**

Ouvre la modale de détails pour l'établissement identifié par `id` (`_id` interne).

---

**`async showDiplomeDetails(libelle)`**

Ouvre la modale de détails pour un diplôme scolaire.

---

**`async showDiplomeApprentissageDetails(libelle)`**

Ouvre la modale de détails pour un diplôme apprentissage.

---

**`async showDispositifDetails(libelle)`**

Ouvre la modale de détails pour un dispositif.

---

**`async showOption2ndeGTDetails(libelle)`**

Ouvre la modale de détails pour une option 2nde GT.

---

**`exportData(format)`**

Exporte les données filtrées de la vue courante.

| Paramètre | Type | Description |
|-----------|------|-------------|
| `format` | `string` | `'csv'` \| `'pdf'` |

---

#### Fonctions de construction HTML (exposées globalement)

Ces fonctions construisent le HTML des fiches de détail (utilisées par `DetailsModal`) :

**`buildEtablissementDetailsHTML(etablissementEnrichi)`** — HTML de la fiche établissement.  
**`buildDiplomeDetailsHTML(diplomeEnrichi)`** — HTML de la fiche diplôme scolaire.  
**`buildDiplomeApprentissageDetailsHTML(diplomeEnrichi)`** — HTML de la fiche diplôme apprentissage.  
**`buildDispositifDetailsHTML(dispositifEnrichi)`** — HTML de la fiche dispositif.  
**`buildOption2ndeGTDetailsHTML(optionEnrichie)`** — HTML de la fiche option 2nde GT.

---

#### Guard anti-ouverture multiple (v0.51)

Pour éviter qu'un double-clic rapide ouvre plusieurs modales simultanément, toutes les fonctions `showXxxDetails()` utilisent un verrou partagé :

```javascript
let _detailsModalOpening = false;   // flag global dans gestion_onglet_resultats.js
```

**Comportement :**
- Si `_detailsModalOpening` est `true` à l'entrée d'une fonction, l'appel est silencieusement ignoré.
- Le flag est mis à `true` dès l'entrée, puis remis à `false` dans un bloc `finally` après ouverture (ou en cas d'erreur).
- `DetailsModal.showXxx()` appelle également `window._detailsModalOpening = false` après `this.open()` pour libérer le verrou dès que la modale est rendue.

---

#### Service favorisDivers (v0.51)

Service de gestion des favoris pour les entités autres que les établissements : diplômes scolaires, diplômes apprentissage, dispositifs, options 2nde GT.

**Clé localStorage :** `favoris_divers`  
**Limite :** 50 items  
**Structure d'un item :**

```javascript
{
  id:        string,   // ex: "diplome__CAP Boucher"  — format: typeObjet__titre
  titre:     string,   // libellé affiché dans le panneau
  typeObjet: string,   // "diplome" | "diplome_apprentissage" | "dispositif" | "option2ndeGT"
  date:      string,   // ISO 8601
}
```

**`loadFavorisDivers()`** — Charge la liste depuis `localStorage`. Retourne `[]` en cas d'erreur JSON.

**`isFavoriDivers(id)`** — `boolean` — Indique si un item est dans les favoris.

**`toggleFavoriDivers(id, titre, typeObjet)`** — Ajoute ou retire un favori. Vérifie la limite de 50. Déclenche un toast (succès ou erreur) et rafraîchit le bouton étoile via `_updateBtnFavoriDivers()`.

**`toggleFavoriDiversFromBtn(btn)`** — Wrapper pour les boutons HTML : lit `data-favori-id`, `data-favori-nom`, `data-favori-type-objet` depuis le bouton et délègue à `toggleFavoriDivers()`.

**`_updateBtnFavoriDivers(id, isFav)`** — *(privée)* Met à jour l'apparence du bouton étoile dans la modale ouverte (classe CSS + aria-label + texte).

---

### 7.4 `js/gestion_onglet_carte.js`

**Rôle :** Gérer la carte interactive Leaflet — initialisation, marqueurs, popups, statistiques.

#### Variables d'état

| Variable | Description |
|----------|-------------|
| `map` | Instance Leaflet |
| `markersLayer` | Groupe de marqueurs Leaflet |
| `userMarker` | Marqueur de l'établissement utilisateur |

#### Fonctions principales

**`initMap()`**

Initialise la carte Leaflet centrée sur la France (lat 46.6, lon 1.9, zoom 6). Si la carte est déjà initialisée, invalide la taille et recharge les marqueurs. Applique le fix classique Leaflet (invalidation après 250 ms) pour les onglets.

---

**`loadMapMarkers()`**

Charge tous les établissements de la base et place des marqueurs sur la carte. Distingue voie scolaire (bleu), apprentissage (orange), et mixte (violet). Ajuste la vue pour englober tous les marqueurs.

---

**`createCustomIcon(emoji, isUser, voie)`**

Crée une icône HTML personnalisée pour Leaflet.

| Paramètre | Description |
|-----------|-------------|
| `emoji` | Emoji affiché dans le marqueur |
| `isUser` | `true` pour le marqueur de l'établissement utilisateur |
| `voie` | `'scolaire'` \| `'apprentissage'` \| `'mixte'` |

**Retourne :** Icône Leaflet (`L.divIcon`).

---

**`createPopupContent(lycee)`**

Génère le HTML de la popup d'un établissement : nom, adresse, type, nombre de diplômes (scolaire + apprentissage), boutons Détails et Itinéraire.

---

**`addUserMarker(etablissement)`**

Ajoute un marqueur spécial pour l'établissement de l'utilisateur (depuis les préférences).

---

**`centerOnUserEstablishment()`**

Recentre la carte sur l'établissement utilisateur.

---

**`refreshMap()`**

Rafraîchit la carte : invalide la taille et recharge les marqueurs.

---

**`updateMapStats(total, visible, userStatus)`**

Met à jour les compteurs affichés au-dessus de la carte.

---

**`showLyceeDetailsCarte(id)`**

Ouvre la modale de détails depuis un clic sur la carte. Délègue à `showEtablissementDetails(id)`.

---

**`getEtablissementIcon(type)`**

**Retourne :** `string` — Emoji correspondant au type d'établissement.

---

## 8. Couche UI — Paramètres et préférences

### 8.1 `js/gestion_params.js`

**Rôle :** Gérer le panneau de paramètres (connexion ONISEP, préférences utilisateur, domicile, établissement utilisateur, favoris, import/export).

#### Fonctions de gestion du panneau

**`toggleSettings()`** — Ouvre/ferme le panneau latéral de paramètres.  
**`toggleSection(header)`** — Replie/déplie une section du panneau.

---

#### Fonctions de connexion ONISEP

**`loadSavedCredentials()`** — Charge les identifiants sauvegardés depuis `localStorage`.

**`async connectToOnisep()`** — Lance la connexion ONISEP avec les identifiants saisis.

**`async autoConnectOnisep(email, password, appId)`** — Connexion automatique au démarrage (si activée dans les préférences).

**`disconnectOnisep()`** — Déconnecte et efface le token.

---

#### Fonctions de préférences utilisateur

**`saveUserPreferences()`** — Sauvegarde les préférences (UAI établissement, auto-connexion) dans `localStorage`.

**`loadUserPreferences()`** — Charge les préférences depuis `localStorage`.

---

#### Fonctions domicile

**`async saveDomicile()`** — Géocode l'adresse saisie via Nominatim et sauvegarde la position GPS dans `localStorage` (`pref_user_domicile`).

**`clearDomicile()`** — Supprime le domicile sauvegardé.

---

#### Fonctions reset

**`confirmResetDatabase()`** — Affiche une modale de confirmation avant de vider la base.

**`async resetDatabase()`** — Vide la base locale et recharge la page.

**`closeResetConfirmModal()`** — Ferme la modale de confirmation.

---

#### Fonctions Favoris — Recherches

Un favori recherche sauvegarde les paramètres d'une extraction pour la relancer rapidement.

**Structure d'un favori recherche :**

```javascript
{
  id: string,      // timestamp
  nom: string,     // nom choisi par l'utilisateur
  type: 'geo' | 'diplomes',
  date: string,    // ISO
  params: {
    // Pour 'geo' :
    commune: Object, epci: Object|null, scope: 'commune'|'epci'
    // Pour 'diplomes' :
    geoType: string, geoValue: string, geoDisplay: string,
    diplomes: Object[]
  }
}
```

**Clé localStorage :** `favoris_recherche`  **Limite :** 10 items

**`loadFavoris()`** — Charge les favoris recherche depuis `localStorage`.  
**`saveFavoris(favoris)`** — Sauvegarde les favoris dans `localStorage`.

**`ajouterFavori(nom, type, params)`** — Ajoute un favori (max 10). Vérifie l'unicité du nom.  
**`supprimerFavori(id)`** — Supprime un favori après confirmation.  
**`async reextraireFavori(id)`** — Relance une extraction depuis un favori sauvegardé.

---

#### Fonctions Favoris — Panneau multi-catégories (v0.51)

Le panneau Favoris affiche **6 sections distinctes** peuplées par des fonctions de rendu HTML privées.

**`afficherListeFavoris()`** — Orchestre l'affichage complet. Lit les trois sources :
- `loadFavorisEtablissements()` (établissements, 20 max)
- `loadFavorisDivers()` (diplômes / dispositifs / options, 50 max)
- `loadFavoris()` (recherches, 10 max)

Produit 6 sections délimitées par `<hr class="favoris-separator">` :
1. 🏫 Établissements
2. 📄 Diplômes scolaires
3. 🎓 Diplômes apprentissage
4. 🎯 Dispositifs
5. 📚 Options 2nde GT
6. 🔍 Recherches favorites

**`_htmlFavoriEtab(f)`** *(privée)* — Génère la carte HTML d'un établissement favori. Utilise les classes `favori-card--etab__btn-voir` (flex:1, large) et `favori-card--etab__btn-del` (taille fixe, icône uniquement).

**`_htmlFavoriDivers(f)`** *(privée)* — Génère la carte HTML d'un favori divers (diplôme, dispositif, option). Détermine l'icône et la fonction d'affichage (`showXxxDetails`) selon `f.typeObjet`. Les guillemets dans le titre sont encodés `&quot;` (protection XSS).

**`_htmlFavoriSectionHeader(label, count, max)`** *(privée)* — Génère l'en-tête `<h4 class="favoris-section-title">` d'une sous-section. Si `max` est 0, le compteur s'affiche sans limite (`(N)`) ; sinon `(N / max)`.

---

#### Zone danger (v0.51)

Le bouton **Purger données CARIF** a été **supprimé** de l'interface en v0.51. La zone danger ne contient plus que :

- **Vider la base locale** (`confirmResetDatabase()`) — supprime toutes les données.

La fonction `confirmClearCARIF()` reste présente dans le code pour compatibilité mais n'est plus exposée dans l'UI.

---

## 9. Couche UI — Filtres

### 9.1 `js/systeme_filtres.js`

**Rôle :** Gérer le filtrage multi-critères des tableaux de résultats. Supporte la multi-sélection dans les listes déroulantes.

#### Variable d'état

```javascript
const filtersState = {
  search: '',       // texte libre
  type: [],         // types d'établissement (multi-select)
  commune: [],      // communes (multi-select)
  statut: [],       // statut public/privé (multi-select)
  niveau: [],       // niveau de diplôme (multi-select)
  categorie: []     // catégorie de dispositif (multi-select)
};
```

#### Fonctions principales

**`initFilters()`**

Attache les écouteurs d'événements aux champs de filtre. Les selects multi sont configurés en `multiple`.

---

**`async updateFiltersForView(view)`**

Met à jour les options des filtres en fonction de la vue active. Masque les filtres non pertinents et peuple les listes d'options avec les valeurs réellement présentes dans les données.

---

**`applyFilters()`**

Applique les filtres courants à la vue active. Délègue à la fonction de filtre spécifique selon la vue.

---

**`resetFilters()`** / **`resetFiltersState()`**

Réinitialise les filtres (état + éléments DOM).

---

**Fonctions de filtre par vue (privées)**

- `filterEtablissements()` — Filtre par texte, type, commune, statut.
- `filterDiplomes()` — Filtre par texte et niveau.
- `filterDiplomesApprentissage()` — Filtre par texte, niveau et type.
- `filterDispositifs()` — Filtre par texte et catégorie.
- `filterOptions()` — Filtre par texte.
- `filterSpecialites()` — Filtre par texte.

---

**`_passesMultiFilter(filterArray, value)`**

Fonction utilitaire interne. Retourne `true` si `filterArray` est vide (pas de filtre) ou si `value` est dans `filterArray`.

---

## 10. Couche UI — Export

### 10.1 `js/export_service.js`

**Rôle :** Exporter les données au format CSV (compatible Excel) ou PDF (jsPDF).

**Classe : `ExportService`** (méthodes statiques)

#### Export CSV

**`static exportToCSV(viewName, data)`**

Exporte les données en CSV encodé UTF-8 BOM (pour compatibilité Excel).

| Paramètre | Type | Description |
|-----------|------|-------------|
| `viewName` | `string` | Vue courante (`'etablissements'`, `'diplomes'`, etc.) |
| `data` | `Object[]` | Données filtrées à exporter |

**Colonnes exportées par vue :**

| Vue | Colonnes |
|-----|---------|
| `etablissements` | Nom, Type, Statut, Commune, Département, Académie, UAI, Téléphone, URL |
| `diplomes` | Intitulé, Niveau, Type, Établissements |
| `diplomes_apprentissage` | Libellé, Niveau, Type, RNCP, Établissements |
| `dispositifs` | Intitulé, Catégorie, Établissements |
| `options` | Libellé, Établissements |

---

#### Export PDF

**`static async exportToPDF(viewName, data)`**

Génère un PDF enrichi via jsPDF (CDN).

**Structure du PDF :**
1. Page de titre (nom de l'application, vue, date, nombre d'entités)
2. Sommaire avec numéros de page
3. Pages de contenu (une page par établissement pour la vue établissements, liste pour les autres vues)

**`static #drawTitlePage(doc, appName, viewLabel, dateStr, count)`** — Dessine la page de titre.  
**`static #drawTOC(doc, entries, viewLabel, dateStr)`** — Dessine le sommaire.  
**`static async #generateEnrichedEtablissementsPDF(doc, data, dateStr)`** — Génère les pages établissements (une par établissement avec formations, coordonnées).  
**`static async #generateEnrichedDiplomesPDF(doc, data, dateStr)`** — Génère les pages diplômes.

---

## 11. Initialisation et utilitaires globaux

### 11.1 `js/utils.js`

**Rôle :** Séquencer l'initialisation de l'application et fournir des utilitaires globaux.

#### Séquence d'initialisation (`init()`)

```
1. Créer DatabaseService global
2. Créer les 4 contrôleurs et les interconnecter
3. Charger les credentials ONISEP sauvegardés
4. Auto-connexion si activée
5. Initialiser les données Bac Pro (log)
6. Charger les EPCI (cache)
7. Afficher l'onglet par défaut (Résultats)
8. Afficher la liste des favoris
```

**`async init()`**

Point d'entrée — appelé via `document.addEventListener('DOMContentLoaded', init)`.

---

**`showAlert(message, type)`**

Affiche une alerte temporaire dans le conteneur `#alerts`.

| Paramètre | Type | Description |
|-----------|------|-------------|
| `message` | `string` | Texte de l'alerte (HTML autorisé) |
| `type` | `string` | `'success'` \| `'error'` \| `'warning'` \| `'info'` |

**Comportement :** L'alerte disparaît automatiquement après 5 s (`error`/`success`/`warning`) ou 10 s (`info`). Fondu de sortie de 300 ms.

---

**Fonctions de debug (console uniquement)**

**`async testAcademies()`** — Liste toutes les académies disponibles dans l'API ONISEP (debug).  
**`async testAcademieSpecifique(nomAcademie)`** — Teste une académie spécifique (debug).

---

## 12. Données statiques

### 12.1 `data/parcours_bac_pro.js`

**Variable globale :** `PARCOURS_BAC_PRO`

**Structure :**

```javascript
[
  {
    famille: string,     // ex: "Agriculture, nature, environnement"
    parcours: [
      {
        libelle: string,   // intitulé du Bac Pro
        premiere: string,  // contenu de 1ère
        terminale: string  // contenu de terminale
      }
    ]
  }
]
```

Utilisé dans les fiches établissement pour afficher le contenu des parcours Bac Pro.

---

### 12.2 `data/academies_data.js`

**Variable globale :** `ACADEMIES_DATA` (ou équivalent)

Contient les correspondances entre codes académie, noms académie et départements rattachés. Utilisé pour résoudre les filtres géographiques par académie.

---

## 13. Design System CSS

### `css/design-system.css`

**Version :** 0.42 — Fichier unique contenant l'intégralité des styles (environ 2 500 lignes).

#### Organisation

| Section | Contenu |
|---------|---------|
| 1. Variables CSS | Palette de couleurs, espacements, typographie, ombres, transitions, z-index |
| 2. Reset & Base | Normalisation, box-sizing, polices |
| 3. Layout app | Header, container, structure en colonnes |
| 4. Composants génériques (BEM) | Boutons, onglets, cartes, listes, tableaux, modales, badges, alertes, formulaires, états vides, stats |
| 5. Composants spécifiques | Recherche, smart search, résultats, détails, carte, paramètres, extraction, diplômes/items |
| 6. Utilitaires (`u-*`) | Marges, padding, affichage, texte |
| 7. Print / Export PDF | Styles d'impression et PDF |

#### Variables CSS principales (`:root`)

| Variable | Valeur | Usage |
|----------|--------|-------|
| `--primary` | `#2E5090` | Couleur principale (bleu éducation) |
| `--primary-light` | `#4472C4` | Variante claire |
| `--primary-dark` | `#1e3a6f` | Variante foncée |
| `--primary-bg` | `#e8eef7` | Fond sur primaire |
| `--accent` | `#5B9BD5` | Couleur accentuation |
| `--success` | `#70AD47` | Succès (vert) |
| `--warning` | `#FFC107` | Avertissement (jaune) |
| `--danger` | `#E74C3C` | Danger (rouge) |
| `--info` | `#2196F3` | Information (bleu clair) |
| `--bg-main` | `#f5f7fa` | Fond général |
| `--surface` | `#ffffff` | Surface des cartes |
| `--text` | `#2c3e50` | Texte principal |
| `--text-light` | `#7f8c8d` | Texte secondaire |
| `--border` | `#e1e8ed` | Bordures |
| `--spacing-xs` … `--spacing-xxl` | 4px … 48px | Espacements |
| `--font-size-xs` … `--font-size-2xl` | 12px … 24px | Tailles de police |
| `--border-radius` | `8px` | Coins arrondis standard |
| `--shadow-sm` … `--shadow-lg` | box-shadow | Ombres |
| `--transition-base` | `200ms ease-in-out` | Transition standard |
| `--z-modal` | `1050` | Z-index des modales |

#### Nommage des classes (convention BEM + sémantique)

| Préfixe | Type d'élément | Exemples |
|---------|---------------|---------|
| `btn` | Boutons | `btn`, `btn--primary`, `btn--secondary`, `btn--danger` |
| `tabs__` | Onglets | `tabs__item`, `tabs__item--active`, `tabs__panel`, `tabs__panel--hidden` |
| `card` | Cartes | `card`, `card__title` |
| `modal` | Modales | `modal`, `modal--active`, `modal__header`, `modal__body` |
| `badge` | Badges | `badge`, `badge--primary`, `badge--success` |
| `alert` | Alertes | `alert`, `alert-success`, `alert-error`, `alert-warning`, `alert-info` |
| `form-group` | Formulaires | `form-group`, `setting-input`, `setting-label` |
| `stat-card` | Statistiques | `stat-card`, `stat-card--active`, `stat-card__value` |
| `map-` | Carte Leaflet | `map-popup`, `map-popup-header`, `map-legend-marker--scolaire` |
| `marker-icon` | Marqueurs carte | `marker-icon--scolaire`, `marker-icon--apprentissage`, `marker-icon--mixte` |
| `detail-` | Fiches détail | `detail-section`, `detail-item`, `detail-badge` |
| `progress-` | Barre de progression | `progress-bar`, `progress-fill`, `progress-message` |
| `u-` | Utilitaires | `u-hidden`, `u-mt-3`, `u-ml-4`, `u-text-help` |
| `pdf-` | Styles PDF | `pdf-lycee-card`, `pdf-toc-entry`, `pdf-formation-item` |

#### `css/main.css`

Fichier résiduel (intentionnellement quasi-vide depuis v0.29). Contient uniquement :
- `.link-icon` — Icône ↗ sur les liens cliquables.
- `.resultat-table tbody tr[onclick]` — Curseur pointer sur les lignes cliquables.

---

## 14. Point d'entrée HTML — `index.html`

**Rôle :** Structure de la page unique (SPA). Définit l'en-tête, le panneau de paramètres, les 3 onglets et les modales statiques.

### Structure principale

```
<header>                          — Bandeau titre + bouton ⚙️
<div.settings-overlay>            — Fond semi-transparent du panneau
<div.settings-panel>              — Panneau de paramètres latéral
  ├── Connexion ONISEP
  ├── Mon établissement
  ├── Mon domicile
  ├── Favoris
  └── À propos / Changelog
<div.container>
  <div#alerts>                    — Zone d'alertes temporaires
  <div.tabs-wrapper>
    <div.tabs>                    — Boutons onglets (Recherche, Résultats, Carte)
    <div#tab-recherche>           — Onglet Recherche
    <div#tab-resultats>           — Onglet Résultats (stat-cards + tableau + filtres)
    <div#tab-carte>               — Onglet Carte (stats carte + légende + div#map)
<modales statiques>               — Modale reset confirmation, modale ONISEP (legacy)
```

### Modales déclarées en HTML

| ID | Description |
|----|-------------|
| `reset-confirm-modal` | Confirmation de vidage de la base |
| `onisep-modal` | Modale de progression ONISEP (legacy, maintenue pour compatibilité) |

> Les autres modales (détails, progression d'extraction, itinéraire) sont créées **dynamiquement** dans le JavaScript et injectées dans le DOM à la demande.

---

---

## Changelog de la documentation

| Version | Date | Modifications |
|---------|------|---------------|
| v0.60 | 28 fév. 2026 | Mise à jour complète : ajout tour_guide.js (§7.5), preferences_crypto_service.js (§8.2), normalisation casse dans utils.js (§11.1), preferAccentedCommune, normaliserNomCommune, normaliserLibelleDiplome. Ajout CHANGELOG.md, README.md, LICENSE. En-têtes copyright dans tous les fichiers JS. Version centralisée dans APP_VERSION. |
| v0.51 | 23 fév. 2026 | Ajout service `favorisDivers` (§7.3), guard `_detailsModalOpening` (§7.3), panneau favoris 6 catégories (§8.1), suppression bouton purge CARIF (§8.1), compteur nav relatif à la liste filtrée (§6.3) |
| v0.43 | 22 fév. 2026 | Création initiale |

---

## Modules ajoutés depuis v0.51

### `js/tour_guide.js` — Tour guidé de première utilisation (v0.44)

**Rôle :** Présenter les fonctions essentielles en 10 étapes lors de la première visite, via driver.js (CDN).

**Classe : `TourGuide`**

| Méthode | Description |
|---------|-------------|
| `static isPremiereLancement()` | Vérifie si le tour a déjà été vu (localStorage) |
| `static resetTour()` | Efface le flag pour permettre de rejouer |
| `async start()` | Charge driver.js et démarre le tour |
| `#construireEtapes()` | Retourne les 10 étapes avec callbacks |
| `#chargerDriver()` | Charge CSS+JS du CDN si nécessaire |

**Exposition globale :** `window.TourGuide`, `window.lancerTourGuide()`

### `js/preferences_crypto_service.js` — Sauvegarde chiffrée des préférences (v0.56)

**Rôle :** Sauvegarde et restauration des préférences utilisateur (identifiants, établissement, domicile, favoris) dans un fichier chiffré AES-256-GCM via Web Crypto API.

### Fonctions ajoutées dans `js/utils.js` (v0.57–v0.60)

| Fonction | Version | Description |
|----------|---------|-------------|
| `normaliserNomCommune(commune)` | v0.57 | Title Case français avec gestion des particules |
| `_communeDeduplicationKey(commune)` | v0.57 | Clé de déduplication sans accents |
| `normaliserLibelleDiplome(libelle)` | v0.57 | Normalisation des libellés CARIF-OREF |
| `preferAccentedCommune(a, b)` | v0.60 | Compare et retient la variante la plus accentuée |

*Documentation mise à jour le 28 février 2026 — Parcours Avenir v0.60*
