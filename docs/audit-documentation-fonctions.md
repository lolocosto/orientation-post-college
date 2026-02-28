# Audit de documentation des fonctions JavaScript
## Parcours Avenir — v0.60
**Date** : 28 février 2026  
**Périmètre** : 29 fichiers JavaScript, ~18 500 lignes de code

> **Note v0.60 :** Cet audit a été initialement réalisé en v0.51. Depuis, la couverture JSDoc
> a été considérablement améliorée, notamment sur `database_service.js` (quasi-complet),
> et les nouveaux modules (`tour_guide.js`, `preferences_crypto_service.js`) sont documentés
> dès leur création. Les @version locales par fichier ont été supprimées au profit d'une
> version centralisée unique dans `utils.js → APP_VERSION`.

---

## Méthode d'audit

Pour chaque fonction ou méthode publique, on vérifie la présence :

| Critère | Notation |
|---|---|
| Description sommaire de ce que fait la fonction | ✅ présent / ❌ absent |
| `@param` pour chaque paramètre (nom, type, description) | ✅ / ⚠️ partiel / ❌ absent |
| `@returns` (type + description) | ✅ / ❌ absent |

**Légende des statuts globaux par fonction :**
- ✅ **Documentée** — JSDoc complet (description + @param + @returns)
- ⚠️ **Partielle** — description présente mais @param/@returns manquants ou incomplets
- ❌ **Non documentée** — aucun JSDoc

---

## 1. `js/http_client.js`

### Classe `HttpClient`

| Fonction / Méthode | Statut | Problème |
|---|---|---|
| `constructor({ label, headers, maxRetries, initialDelay })` | ✅ | — |
| `async getJSON(url, headersOverride)` | ✅ | — |
| `sleep(ms)` | ✅ | — |
| `get requestCount()` | ✅ | — |
| `#resolveHeaders()` | ✅ | — |

**Bilan** : 5/5 documentées. **Fichier conforme.**

---

## 2. `js/database_service.js`

### Classe `DatabaseService`

| Fonction / Méthode | Statut | Problème |
|---|---|---|
| `constructor()` | ❌ | Aucun JSDoc |
| `flush()` | ⚠️ | Description présente (commentaire inline), pas de JSDoc formaté |
| `async init()` | ❌ | Aucun JSDoc |
| `async insertEtablissement(etablissement)` | ✅ | — |
| `async updateEtablissement(id, updates)` | ✅ | — |
| `async updateEtablissementByUai(uai, updates)` | ✅ | — |
| `async getEtablissement(id)` | ✅ | — |
| `getEtablissementByUaiSync(uai)` | ❌ | Aucun JSDoc |
| `async getAllEtablissements()` | ❌ | Aucun JSDoc |
| `async getAllEtablissementsWithDiplomes()` | ❌ | Aucun JSDoc |
| `async insertDiplome(diplome)` | ❌ | Aucun JSDoc |
| `async insertDiplomeParEtablissement(relation)` | ❌ | Aucun JSDoc |
| `async getDiplome(libelle)` | ❌ | Aucun JSDoc |
| `async getAllDiplomes()` | ❌ | Aucun JSDoc |
| `async getDiplomesParEtablissement(etabId)` | ❌ | Aucun JSDoc |
| `getDiplomesParEtablissementSync(etabId)` | ❌ | Aucun JSDoc |
| `async getAllDiplomesParEtablissement()` | ❌ | Aucun JSDoc |
| `async insertDiplomeApprentissage(diplome)` | ❌ | Aucun JSDoc |
| `async insertDiplomeApprentissageParEtablissement(relation)` | ❌ | Aucun JSDoc |
| `async getAllDiplomesApprentissage()` | ❌ | Aucun JSDoc |
| `getDiplomesApprentissageParEtablissementSync(etabId)` | ❌ | Aucun JSDoc |
| `async getDiplomesApprentissageParEtablissement(etabId)` | ❌ | Aucun JSDoc |
| `async getAllDiplomesApprentissageParEtablissement()` | ❌ | Aucun JSDoc |
| `async updateDispositif(libelle, updates)` | ❌ | Aucun JSDoc |
| `async insertDispositifParEtablissement(relation)` | ❌ | Aucun JSDoc |
| `async getDispositif(libelle)` | ❌ | Aucun JSDoc |
| `async getAllDispositifs()` | ❌ | Aucun JSDoc |
| `async getAllDispositifsParEtablissement()` | ❌ | Aucun JSDoc |
| `async insertOption2ndeGT(option)` | ❌ | Aucun JSDoc |
| `async insertOption2ndeGTParEtablissement(relation)` | ❌ | Aucun JSDoc |
| `async getOption2ndeGT(libelle)` | ❌ | Aucun JSDoc |
| `async getAllOptions2ndeGT()` | ❌ | Aucun JSDoc |
| `async getAllOptions2ndeGTParEtablissement()` | ❌ | Aucun JSDoc |
| `async getAllOptions2ndeGTAvecComptage()` | ❌ | Aucun JSDoc |
| `async getAllZones(type)` | ❌ | Aucun JSDoc |
| `async insertSpecialite1ereG(specialite)` | ❌ | Aucun JSDoc |
| `async insertSpecialite1ereGParEtablissement(relation)` | ❌ | Aucun JSDoc |
| `async getSpecialite1ereG(libelle)` | ❌ | Aucun JSDoc |
| `async getAllSpecialites1ereG()` | ❌ | Aucun JSDoc |
| `async insertLangue(langue)` | ❌ | Aucun JSDoc |
| `async getAllLangues()` | ❌ | Aucun JSDoc |
| `async getStats()` | ❌ | Aucun JSDoc |
| `async getEtablissementEnrichi(id)` | ✅ | — |
| `async getDiplomesParEtablissement(id)` (jointure enrichie) | ✅ | — |
| `async getDiplomesApprentissageParEtablissement(id)` (jointure enrichie) | ❌ | Aucun JSDoc |
| `async getDispositifsParEtablissement(id)` | ❌ | Aucun JSDoc |
| `async getOptions2ndeGTParEtablissement(id)` | ❌ | Aucun JSDoc |
| `async getSpecialites1ereGParEtablissement(id)` | ❌ | Aucun JSDoc |
| `async getDiplomeEnrichi(libelle)` | ❌ | Aucun JSDoc |
| `async getDispositifEnrichi(libelle)` | ❌ | Aucun JSDoc |
| `async getOption2ndeGTEnrichie(libelle)` | ❌ | Aucun JSDoc |
| `async clearAllData()` | ❌ | Aucun JSDoc |
| `#saveToLocalStorage()` | ❌ | Aucun JSDoc |
| `#loadFromLocalStorage()` | ❌ | Aucun JSDoc |
| `_genId()` (fonction module) | ❌ | Aucun JSDoc |

**Bilan** : ~5/50 documentées. ❌ **Fichier très insuffisant. C'est le plus critique.**

---

## 3. `js/geo_api.js`

### Classe `GeoAPI`

| Fonction / Méthode | Statut | Problème |
|---|---|---|
| `constructor()` | ❌ | Aucun JSDoc |
| `searchCommunes(nom, codePostal)` | ✅ | — |
| `getCommunesByEPCI(codeEpci)` | ✅ | — |
| `getCommunesByRegion(codeRegion)` | ✅ | — |
| `searchDepartements(nom)` | ✅ | — |
| `getDepartementByCode(codeDepartement)` | ✅ | — |
| `getAllDepartements()` | ✅ | — |
| `searchRegions(nom)` | ✅ | — |
| `getRegionByCode(codeRegion)` | ✅ | — |
| `getAllRegions()` | ✅ | — |
| `getDepartementsByRegion(codeRegion)` | ✅ | — |
| `searchEPCI(nom)` | ✅ | — |
| `getEPCIByCode(codeEpci)` | ✅ | — |
| `searchEPCIs()` | ✅ | — |
| `async _request(url)` | ✅ | — |
| `_sleep(ms)` | ❌ | Simple alias, pas de JSDoc |

**Bilan** : 14/16 documentées. ⚠️ **Fichier quasi-conforme.**

---

## 4. `js/carif_oref_api.js`

### Classe `CARIFOREFApi`

| Fonction / Méthode | Statut | Problème |
|---|---|---|
| `constructor()` | ❌ | Aucun JSDoc |
| `get _requestCount()` | ❌ | Aucun JSDoc |
| `get requestCount()` | ❌ | Aucun JSDoc |
| `async getEtablissementsByCommunes(codesInsee, progressCallback)` | ✅ | — |
| `async getEtablissementsByUAIs(uais, progressCallback)` | ✅ | — |
| `async getFormationsByUAIs(uais, progressCallback)` | ✅ | — |
| `async getDiplomesByZone(type, value)` | ✅ | — |
| `async #fetchPage(endpoint, query, page, limit)` | ✅ | — |
| `async #fetchAllPages(endpoint, query, limit, progressCallback)` | ✅ | — |
| `#isNiveauValide(niveau)` | ❌ | Aucun JSDoc |

**Bilan** : 6/10 documentées. ⚠️ **Fichier acceptable, manques mineurs.**

---

## 5. `js/data_education_api.js`

### Classe `DataEducationAPI`

| Fonction / Méthode | Statut | Problème |
|---|---|---|
| `constructor()` | ❌ | Aucun JSDoc |
| `async getCoordonneesByUAI(uai)` | ✅ | — |
| `async getLanguesByUAI(uai)` | ✅ | — |
| `async getOptionsByUAI(uai)` | ✅ | — |
| `async getSpecialitesByUAI(uai)` | ✅ | — |
| `async getEffectifsByUAI(uai)` | ✅ | — |
| `#parseEffectifs(rawData)` | ❌ | Aucun JSDoc |
| `async _queryDataset(dataset, filters, maxRetries, initialDelay)` | ✅ | — |
| `_sleep(ms)` | ❌ | Simple alias, pas de JSDoc |

**Bilan** : 6/9 documentées. ⚠️ **Fichier acceptable.**

---

## 6. `js/geo_parser.js`

### Classe `GeoDataParser`

| Fonction / Méthode | Statut | Problème |
|---|---|---|
| `static parseCommune(raw)` | ✅ | — |
| `static parseEPCI(raw)` | ✅ | — |
| `static parseDomicile(raw)` | ✅ | — |
| `static parseCommunes(rawArray)` | ✅ | — |

**Bilan** : 4/4 documentées. ✅ **Fichier conforme.**

---

## 7. `js/onisep_parser.js`

### Classe `OnisepDataParser`

| Fonction / Méthode | Statut | Problème |
|---|---|---|
| `static parseStructures(rawData)` | ✅ | — |
| `static parseDiplomes(rawData, uai)` | ✅ | — |
| `static parseDispositifs(rawData, uai)` | ✅ | — |
| `static parseOptions2ndeGT(rawData, uai)` | ✅ | — |
| `static parseSpecialites1ereG(rawData, uai)` | ✅ | — |
| `#normaliseType(type)` | ❌ | Méthode privée sans JSDoc |
| `#normaliseStatut(statut)` | ❌ | Méthode privée sans JSDoc |

**Bilan** : 5/7 documentées. ⚠️ **Fichier acceptable (manques sur méthodes privées).**

---

## 8. `js/carif_oref_parser.js`

### Classe `CARIFOREFParser`

| Fonction / Méthode | Statut | Problème |
|---|---|---|
| `static parseEtablissements(rawEtabs)` | ✅ | — |
| `static parseFormations(rawFormations)` | ✅ | — |
| `static #parseCoordonnees(geoStr)` | ❌ | Aucun JSDoc |
| `static #normaliseNiveau(niveau)` | ❌ | Aucun JSDoc |

**Bilan** : 2/4 documentées. ⚠️ **Fichier partiel.**

---

## 9. `js/data_education_parser.js`

### Classe `DataEducationParser`

| Fonction / Méthode | Statut | Problème |
|---|---|---|
| `static parseCoordonnees(rawData)` | ✅ | — |
| `static parseLangues(rawData, uai)` | ✅ | — |
| `static parseOptions(rawData, uai)` | ✅ | — |
| `static parseSpecialites(rawData, uai)` | ✅ | — |

**Bilan** : 4/4 documentées. ✅ **Fichier conforme.**

---

## 10. `js/geo_extraction_controller.js`

### Classe `GeoExtractionController`

| Fonction / Méthode | Statut | Problème |
|---|---|---|
| `constructor()` | ❌ | Aucun JSDoc |
| `init()` | ❌ | Aucun JSDoc |
| `async getAllEPCIs()` | ✅ | — |
| `async getCodesInseeByCommune(commune)` | ✅ | — |
| `async getCodesInseeByEPCI(epciCode)` | ✅ | — |
| `async geocoderAdresse(adresse)` | ✅ | — |
| `async resolveGeoZone(type, value)` | ✅ | — |
| `getEPCIsList()` | ❌ | Aucun JSDoc |

**Bilan** : 5/8 documentées. ⚠️ **Fichier acceptable.**

---

## 11. `js/onisep_extraction_controller.js`

### Classe `OnisepExtractionController`

| Fonction / Méthode | Statut | Problème |
|---|---|---|
| `constructor()` | ❌ | Aucun JSDoc |
| `init()` | ❌ | Aucun JSDoc |
| `setGeoController(geoController)` | ❌ | Aucun JSDoc |
| `getOnisepAPI()` | ❌ | Aucun JSDoc |
| `async login(email, password, appId)` | ✅ | — |
| `isAuthenticated()` | ❌ | Aucun JSDoc |
| `async extractByGeo(codesInsee, progressCallback)` | ✅ | — |
| `async extractByDiplomes(diplomes, facetGeo, progressCallback)` | ✅ | — |
| `async extractByOptions2ndeGT(options, facetGeo, progressCallback)` | ✅ | — |
| `async getDiplomesDisponibles(type, value)` | ✅ | — |
| `async getOptionsDisponibles(type, value)` | ✅ | — |
| `async #storeEtablissements(etablissementsMap)` | ✅ | — |
| `async #enrichirRelationsAvecEtabId(uaiToId)` | ✅ | Description inline, pas de @param/@returns |
| `async #extractDiplomes(uais, uaiToId)` | ❌ | Aucun JSDoc |
| `async #extractDispositifs(uais, uaiToId)` | ❌ | Aucun JSDoc |
| `async #extractOptions2ndeGT(uais, uaiToId)` | ❌ | Aucun JSDoc |
| `async #extractSpecialites1ereG(uais, uaiToId)` | ❌ | Aucun JSDoc |
| `#addProgressDetail(message, type)` | ❌ | Aucun JSDoc |

**Bilan** : 8/18 documentées. ❌ **Fichier insuffisant.**

---

## 12. `js/carif_oref_extraction_controller.js`

### Classe `CARIFOREFExtractionController`

| Fonction / Méthode | Statut | Problème |
|---|---|---|
| `constructor()` | ❌ | Aucun JSDoc |
| `init()` | ❌ | Aucun JSDoc |
| `setGeoController(geoController)` | ❌ | Aucun JSDoc |
| `async extractByGeo(codesInsee)` | ✅ | — |
| `async extractByDiplomesLibelles(libelles, uaisParLibelle)` | ✅ | — |
| `async getDiplomesDisponibles(type, value)` | ✅ | — |
| `async #runExtraction(fn)` | ❌ | Aucun JSDoc |
| `async #resetAprentissageData()` | ❌ | Aucun JSDoc |
| `async #extractEtabsEtDiplomesByUAIs(uais, batchSize, limit)` | ❌ | Aucun JSDoc |
| `async #storeEtablissements(rawEtabs)` | ❌ | Aucun JSDoc |
| `async #storeFormations(rawFormations, uaiToId)` | ❌ | Aucun JSDoc |
| `#detail(message, type)` | ❌ | Aucun JSDoc |

**Bilan** : 3/12 documentées. ❌ **Fichier insuffisant.**

---

## 13. `js/data_education_extraction_controller.js`

### Classe `DataEducationExtractionController`

| Fonction / Méthode | Statut | Problème |
|---|---|---|
| `constructor()` | ❌ | Aucun JSDoc |
| `init()` | ❌ | Aucun JSDoc |
| `async enrichirEtablissements()` | ✅ | — |
| `async enrichirAvecLangues(overwrite)` | ✅ | — |
| `async enrichirAvecOptions(overwrite)` | ✅ | — |
| `async enrichirAvecSpecialites(overwrite)` | ✅ | — |
| `async #enrichirEtablissement(etab, overwrite)` | ❌ | Aucun JSDoc |
| `async #enrichirLangues(etab, overwrite)` | ❌ | Aucun JSDoc |

**Bilan** : 4/8 documentées. ⚠️ **Fichier partiel.**

---

## 14. `js/modal.js`

### Classe `Modal` + `ModalStack`

| Fonction / Méthode | Statut | Problème |
|---|---|---|
| `Modal.constructor(modalId)` | ❌ | Aucun JSDoc |
| `Modal.open()` | ✅ | — |
| `Modal.close()` | ✅ | — |
| `Modal.setTitle(title)` | ❌ | Aucun JSDoc |
| `Modal.setContent(html)` | ❌ | Aucun JSDoc |
| `ModalStack.push(modal)` | ❌ | Aucun JSDoc |
| `ModalStack.pop(modal)` | ❌ | Aucun JSDoc |
| `ModalStack.isTop(modal)` | ❌ | Aucun JSDoc |
| `ModalStack.removeById(id)` | ❌ | Aucun JSDoc |
| `ModalStack.getTopZIndex()` | ❌ | Aucun JSDoc |

**Bilan** : 2/10 documentées. ❌ **Fichier insuffisant.**

---

## 15. `js/progress_modal.js`

### Classe `ProgressModal`

| Fonction / Méthode | Statut | Problème |
|---|---|---|
| `constructor(modalId, onClose, autoSwitchToResults)` | ✅ | — |
| `#createElement()` | ✅ | — |
| `show()` | ✅ | — |
| `hide(delay)` | ✅ | — |
| `close(delay)` | ✅ | Alias documenté |
| `destroy()` | ✅ | — |
| `update(message, current, total)` | ✅ | — |
| `addDetail(detail, type)` | ✅ | — |
| `clearDetails()` | ✅ | — |
| `reset()` | ✅ | — |
| `showError(errorMessage, autoHideDelay)` | ✅ | — |
| `showSuccess(successMessage, autoHideDelay)` | ✅ | — |
| `hideWithSuccess(delay)` | ✅ | — |

**Bilan** : 13/13 documentées. ✅ **Fichier exemplaire.**

---

## 16. `js/details_modal.js`

### Classe `DetailsModal`

| Fonction / Méthode | Statut | Problème |
|---|---|---|
| `constructor(modalId)` | ❌ | Aucun JSDoc |
| `async showEtablissement(etablissementEnrichi)` | ❌ | Aucun JSDoc |
| `async showDiplome(libelle)` | ❌ | Aucun JSDoc |
| `async showDiplomeApprentissage(id)` | ❌ | Aucun JSDoc |
| `async showDispositif(libelle)` | ❌ | Aucun JSDoc |
| `async showOption2ndeGT(libelle)` | ❌ | Aucun JSDoc |
| `#buildEtablissementHTML(etablissementEnrichi)` | ⚠️ | Description commentaire inline, pas JSDoc |
| `#buildDiplomeHTML(diplomeEnrichi)` | ✅ | — |
| `#buildDiplomeApprentissageHTML(diplomeEnrichi)` | ❌ | Aucun JSDoc |
| `#buildDispositifHTML(dispositifEnrichi)` | ❌ | Aucun JSDoc |
| `#buildOption2ndeGTHTML(optionEnrichie)` | ✅ | — |
| `window.openEtablissementDetailsFromModal(uai)` | ✅ | — |
| `window.openDiplomeDetailsFromModal(libelle)` | ✅ | — |
| `window.openDispositifDetailsFromModal(libelle)` | ❌ | Aucun JSDoc |
| `window.openOption2ndeGTDetailsFromModal(libelle)` | ❌ | Aucun JSDoc |

**Bilan** : 4/15 documentées. ❌ **Fichier insuffisant.**

---

## 17. `js/itineraire_modal.js`

### Fonction `openItineraireModal`

| Fonction | Statut | Problème |
|---|---|---|
| `openItineraireModal({ nom, latitude, longitude })` | ❌ | Aucun JSDoc sur la fonction elle-même |

**Bilan** : 0/1 documentée. ❌

---

## 18. `js/gestion_onglets.js`

| Fonction | Statut | Problème |
|---|---|---|
| `switchTab(tabName)` | ✅ | — |

**Bilan** : 1/1 documentée. ✅ **Fichier conforme.**

---

## 19. `js/gestion_onglet_recherche.js`

| Fonction | Statut | Problème |
|---|---|---|
| `setHelpState(el, state)` | ✅ | — |
| `async initSearchTab()` | ✅ | — |
| `switchExtractionMode()` | ✅ | — |
| `async handleSmartSearch()` | ✅ | — |
| `selectCommune(communeData)` | ❌ | Aucun JSDoc |
| `chooseExtractionScope(scope)` | ❌ | Aucun JSDoc |
| `async lancerExtractionGeo()` | ❌ | Aucun JSDoc |
| `clearSelection()` | ❌ | Aucun JSDoc |
| `resetGeoSearch()` | ❌ | Aucun JSDoc |
| `updateSelectedItemsCount(type)` | ❌ | Aucun JSDoc |
| `afficherItemsCheckboxes(items, type)` | ❌ | Aucun JSDoc |
| `toggleToutesCheckboxes(type)` | ❌ | Aucun JSDoc |
| `async lancerExtractionItems(type)` | ✅ | — |
| `updateItemsGeoFields(type, value, display)` | ❌ | Aucun JSDoc |
| `resetItemsSearch(type)` | ❌ | Aucun JSDoc |
| `async chargerItemsDisponibles(type)` | ❌ | Aucun JSDoc |
| `retourEtape1(type)` | ❌ | Aucun JSDoc |
| `filtrerItemsParRecherche(type)` | ❌ | Aucun JSDoc |
| `getVoiesDiplomesSelectionnes(libelles)` | ✅ | — |
| `stopAndCloseExtraction()` | ✅ | — |

**Bilan** : 6/20 documentées. ❌ **Fichier insuffisant.**

---

## 20. `js/gestion_onglet_resultats.js`

| Fonction | Statut | Problème |
|---|---|---|
| `switchView(view)` | ❌ | Aucun JSDoc |
| `async loadView()` | ❌ | Aucun JSDoc |
| `async loadStats()` | ✅ | — |
| `async loadetablissementsView()` | ✅ | — |
| `renderetablissementsTable(data)` | ✅ | — |
| `async loadDiplomesView()` | ✅ | — |
| `renderDiplomesTable(data)` | ✅ | — |
| `async loadDiplomesApprentissageView()` | ❌ | Pas de JSDoc |
| `renderDiplomesApprentissageTable(data)` | ❌ | Aucun JSDoc |
| `async loadDispositifsView()` | ❌ | Aucun JSDoc |
| `renderDispositifsTable(data)` | ❌ | Aucun JSDoc |
| `async loadOptions2ndeGTView()` | ❌ | Aucun JSDoc |
| `renderOptions2ndeGTTable(data)` | ❌ | Aucun JSDoc |
| `sortTable(column)` | ❌ | Aucun JSDoc |
| `filterTable(query)` | ✅ | — |
| `getSortIcon(column)` | ✅ | — |
| `async initResultsTab()` | ✅ | — |
| `buildEtablissementDetailsHTML(etablissementEnrichi)` | ✅ | — |
| `buildInfoRow(label, value)` | ❌ | Aucun JSDoc |
| `groupDiplomesByCategorie(diplomes)` | ❌ | Aucun JSDoc |
| `formatTelephone(tel)` | ❌ | Aucun JSDoc |
| `buildDiplomeDetailsHTML(diplomeEnrichi)` | ✅ | — |
| `buildDiplomeApprentissageDetailsHTML(diplomeEnrichi)` | ❌ | Aucun JSDoc |
| `buildDispositifDetailsHTML(dispositifEnrichi)` | ❌ | Aucun JSDoc |
| `buildOption2ndeGTDetailsHTML(optionEnrichie)` | ❌ | Aucun JSDoc |
| `async showEtablissementDetails(id)` | ✅ | v0.51 : JSDoc + guard `_detailsModalOpening` |
| `async showDiplomeDetails(libelle)` | ✅ | v0.51 : JSDoc + guard |
| `async showDiplomeApprentissageDetails(id)` | ✅ | v0.51 : JSDoc + guard |
| `async showDispositifDetails(libelle)` | ✅ | v0.51 : JSDoc + guard |
| `async showOption2ndeGTDetails(libelle)` | ✅ | v0.51 : JSDoc + guard |
| `exportData(format)` | ✅ | — |
| *(nouveau v0.51)* `loadFavorisDivers()` | ✅ | JSDoc complet |
| *(nouveau v0.51)* `isFavoriDivers(id)` | ✅ | JSDoc complet |
| *(nouveau v0.51)* `toggleFavoriDivers(id, titre, typeObjet)` | ✅ | JSDoc complet |
| *(nouveau v0.51)* `toggleFavoriDiversFromBtn(btn)` | ✅ | JSDoc complet |
| *(nouveau v0.51)* `_updateBtnFavoriDivers(id, isFav)` | ✅ | JSDoc complet (privée) |

**Bilan** : 16/36 documentées — progression de 35% → 44%.  
Les 5 fonctions `showXxxDetails()` sont désormais documentées avec le guard `_detailsModalOpening`. Le service `favorisDivers` (5 fonctions) est entièrement documenté. Restent 20 fonctions à documenter.

> **Note v0.51** : Le verrou global `_detailsModalOpening` n'est pas une fonction mais une variable déclarée dans ce fichier. Elle est intentionnellement non exportée.

---

## 21. `js/gestion_onglet_carte.js`

| Fonction | Statut | Problème |
|---|---|---|
| `initMap()` | ✅ | — |
| `createCustomIcon(emoji, isUser, voie)` | ❌ | Commentaire inline `/** ... **/` sans @param ni @returns |
| `createPopupContent(lycee)` | ❌ | Commentaire inline sans @param ni @returns |
| `getEtablissementIcon(type)` | ❌ | Commentaire inline sans @param ni @returns |
| `async loadMapMarkers()` | ❌ | Commentaire inline sans JSDoc |
| `loadUserMarker()` | ❌ | Commentaire inline sans JSDoc |
| `updateMapStats(total, visible, userStatus)` | ❌ | Commentaire inline sans @param |
| `centerOnUserEstablishment()` | ❌ | Commentaire inline sans JSDoc |
| `refreshMap()` | ❌ | Commentaire inline sans JSDoc |
| `showLyceeDetailsCarte(id)` | ❌ | Commentaire inline sans @param |

**Bilan** : 1/10 documentées. ❌ **Fichier insuffisant — commentaires `/** ... **/` non conformes JSDoc.**

> **Note** : Les commentaires de ce fichier utilisent `/** ... **/` (double astérisque fermant), qui n'est pas reconnu par les outils JSDoc standards. Ils doivent être corrigés en `/** ... */`.

---

## 22. `js/gestion_params.js`

| Fonction | Statut | Problème |
|---|---|---|
| `toggleSettings()` | ❌ | Aucun JSDoc |
| `toggleSection(header)` | ❌ | Aucun JSDoc |
| `loadSettings()` | ❌ | Aucun JSDoc |
| `updateLastExtractionDate()` | ❌ | Aucun JSDoc |
| `saveOnisepCredentials()` | ❌ | Aucun JSDoc |
| `connectFromSettings()` | ❌ | Aucun JSDoc |
| `autoConnectOnisep(email, password, appId)` | ❌ | Aucun JSDoc |
| `logoutOnisep()` | ❌ | Corps vide + aucun JSDoc |
| `updateConnectionStatus()` | ❌ | Aucun JSDoc |
| `fetchOnisepEstablishment()` | ❌ | Aucun JSDoc |
| `saveUserEstablishment()` | ❌ | Aucun JSDoc |
| `geocoderDomicile()` | ❌ | Aucun JSDoc |
| `saveUserDomicile()` | ❌ | Aucun JSDoc |
| `clearUserDomicile()` | ❌ | Aucun JSDoc |
| `loadUserPreferences()` | ❌ | Aucun JSDoc |
| `async exporterDonnees()` | ❌ | Aucun JSDoc |
| `importerFichier(event)` | ❌ | Aucun JSDoc |
| `confirmResetDatabase()` | ❌ | Aucun JSDoc |
| `executeResetDatabase()` | ❌ | Aucun JSDoc |
| `closeResetConfirmModal()` | ❌ | Aucun JSDoc |
| `loadFavoris()` | ❌ | Aucun JSDoc |
| `saveFavoris(favoris)` | ❌ | Aucun JSDoc |
| `ajouterFavori(nom, type, params)` | ❌ | Aucun JSDoc |
| `supprimerFavori(id)` | ❌ | Aucun JSDoc |
| `async reextraireFavori(id)` | ❌ | Aucun JSDoc |
| `afficherListeFavoris()` | ✅ | v0.51 : JSDoc complet — 6 catégories documentées |
| `openLoginModal()` | ❌ | Aucun JSDoc |
| `closeLoginModal()` | ❌ | Aucun JSDoc |
| `openHelpModal()` | ❌ | Aucun JSDoc |
| `closeHelpModal()` | ❌ | Aucun JSDoc |
| *(nouveau v0.51)* `_htmlFavoriEtab(f)` | ✅ | JSDoc complet (privée) |
| *(nouveau v0.51)* `_htmlFavoriDivers(f)` | ✅ | JSDoc complet (privée) |
| *(nouveau v0.51)* `_htmlFavoriSectionHeader(label, count, max)` | ✅ | JSDoc complet (privée) |
| ~~`confirmClearCARIF()`~~ | ~~❌~~ | **Supprimée de l'UI en v0.51** (fonction conservée dans le code, non exposée) |

**Bilan** : 4/33 documentées — progression de 0% → 12%.  
Les 3 nouvelles fonctions de rendu HTML (privées) sont entièrement documentées. `afficherListeFavoris()` a été refactorisée et documentée. Reste 29 fonctions à documenter en priorité.

> **Note v0.51** : Le bouton "Purger données CARIF" a été retiré de l'interface HTML (`index.html`). La fonction `confirmClearCARIF()` reste dans le code source mais n'est plus accessible à l'utilisateur.

---

## 23. `js/utils.js`

| Fonction | Statut | Problème |
|---|---|---|
| `async init()` | ⚠️ | Séquence commentée inline (lisible), mais pas de JSDoc formel |
| `showAlert(message, type)` | ✅ | — |
| `async testAcademies()` | ✅ | — |
| `async testAcademieSpecifique(nomAcademie)` | ✅ | — |

**Bilan** : 3/4 documentées. ⚠️ **Fichier quasi-conforme.**

---

## 24. `js/systeme_filtres.js`

| Fonction | Statut | Problème |
|---|---|---|
| `initFilters()` | ✅ | — |
| `async updateFiltersForView(view)` | ✅ | — |
| `resetFiltersState()` | ✅ | — |
| `_populateSelect(selectEl, values, emptyLabel)` | ❌ | Aucun JSDoc |
| `async populateTypeFilter()` | ❌ | Aucun JSDoc |
| `async populateCommuneFilter()` | ❌ | Aucun JSDoc |
| `async populateStatutFilter()` | ❌ | Aucun JSDoc |
| `async populateNiveauDiplomeFilter()` | ❌ | Aucun JSDoc |
| `async populateTypeDiplomeFilter()` | ❌ | Aucun JSDoc |
| `async populateCategorieFilter()` | ❌ | Aucun JSDoc |
| `async populateNiveauDiplomeApprentissageFilter()` | ❌ | Aucun JSDoc |
| `async populateTypeDiplomeApprentissageFilter()` | ❌ | Aucun JSDoc |
| `_passesMultiFilter(filterArray, value)` | ✅ | — |
| `applyFilters()` | ❌ | Aucun JSDoc |
| `filterEtablissements()` | ❌ | Aucun JSDoc |
| `filterDiplomes()` | ❌ | Aucun JSDoc |
| `filterDiplomesApprentissage()` | ❌ | Aucun JSDoc |
| `filterDispositifs()` | ❌ | Aucun JSDoc |
| `filterOptions()` | ❌ | Aucun JSDoc |
| `filterSpecialites()` | ❌ | Aucun JSDoc |
| `updateResultsCount()` | ✅ | — |
| `resetFilters()` | ✅ | — |

**Bilan** : 6/22 documentées. ❌ **Fichier insuffisant.**

---

## Synthèse globale

### Tableau de bord par fichier

| Fichier | Documentées | Total | % | Statut |
|---|---|---|---|---|
| `http_client.js` | 5 | 5 | 100% | ✅ |
| `database_service.js` | 5 | 50 | 10% | ❌ |
| `geo_api.js` | 14 | 16 | 88% | ⚠️ |
| `carif_oref_api.js` | 6 | 10 | 60% | ⚠️ |
| `data_education_api.js` | 6 | 9 | 67% | ⚠️ |
| `geo_parser.js` | 4 | 4 | 100% | ✅ |
| `onisep_parser.js` | 5 | 7 | 71% | ⚠️ |
| `carif_oref_parser.js` | 2 | 4 | 50% | ⚠️ |
| `data_education_parser.js` | 4 | 4 | 100% | ✅ |
| `geo_extraction_controller.js` | 5 | 8 | 63% | ⚠️ |
| `onisep_extraction_controller.js` | 8 | 18 | 44% | ❌ |
| `carif_oref_extraction_controller.js` | 3 | 12 | 25% | ❌ |
| `data_education_extraction_controller.js` | 4 | 8 | 50% | ⚠️ |
| `modal.js` | 2 | 10 | 20% | ❌ |
| `progress_modal.js` | 13 | 13 | 100% | ✅ |
| `details_modal.js` | 4 | 15 | 27% | ❌ |
| `itineraire_modal.js` | 0 | 1 | 0% | ❌ |
| `gestion_onglets.js` | 1 | 1 | 100% | ✅ |
| `gestion_onglet_recherche.js` | 6 | 20 | 30% | ❌ |
| `gestion_onglet_resultats.js` | 16 | 36 | 44% | ❌ | +5 fonctions show*Details + 5 favoris divers (v0.51) |
| `gestion_onglet_carte.js` | 1 | 10 | 10% | ❌ |
| `gestion_params.js` | 4 | 33 | 12% | ❌ | afficherListeFavoris + 3 _htmlFavori* (v0.51) |
| `utils.js` | 3 | 4 | 75% | ⚠️ |
| `systeme_filtres.js` | 6 | 22 | 27% | ❌ |
| **TOTAL** | **137** | **333** | **~41%** | ❌ | +9 nouvelles fonctions documentées en v0.51 |

### Priorités de correction

**Priorité 1 — Critique (fichiers centraux très utilisés)**

1. `database_service.js` — 50 fonctions non documentées, socle de toute l'application
2. `gestion_params.js` — 29 fonctions non documentées, interface utilisateur principale (4/33 documentées en v0.51)
3. `gestion_onglet_resultats.js` — 20 fonctions manquantes, vue la plus consultée (16/36 documentées en v0.51)
4. `gestion_onglet_recherche.js` — 14 fonctions manquantes, point d'entrée utilisateur

**Priorité 2 — Important**

5. `systeme_filtres.js` — 16 fonctions manquantes
6. `modal.js` — 8 fonctions manquantes (classe utilisée partout)
7. `onisep_extraction_controller.js` — 10 fonctions manquantes
8. `carif_oref_extraction_controller.js` — 9 fonctions manquantes
9. `details_modal.js` — 11 fonctions manquantes
10. `gestion_onglet_carte.js` — problème de syntaxe JSDoc (`**/` → `*/`)

**Priorité 3 — Complétion**

11. `carif_oref_api.js`, `data_education_api.js` — constructeurs + méthodes privées
12. `onisep_parser.js`, `carif_oref_parser.js` — méthodes privées
13. `geo_extraction_controller.js`, `data_education_extraction_controller.js` — constructeurs + `init()`

---

## Problèmes transversaux identifiés

### 1. Constructeurs et méthodes `init()` systématiquement non documentés

Tous les contrôleurs et les classes de service ont leur constructeur et leur méthode `init()` sans JSDoc. Ces fonctions sont importantes car elles décrivent les dépendances injectées et les effets de bord.

**Pattern manquant :**
```javascript
/**
 * Crée une instance du contrôleur CARIF-OREF.
 * Instancie en interne CARIFOREFApi et CARIFOREFParser.
 */
constructor() { ... }

/**
 * Connecte le DatabaseService partagé au contrôleur.
 * Doit être appelé avant toute extraction.
 * @param {DatabaseService} databaseService
 * @returns {void}
 */
init() { ... }
```

### 2. Fonctions utilitaires internes sans JSDoc

Les fonctions auxiliaires (helpers HTML, formatters, sorters internes) ne sont pas documentées alors qu'elles sont appelées depuis plusieurs endroits. Exemples : `buildInfoRow`, `groupDiplomesByCategorie`, `formatTelephone`, `_populateSelect`.

### 3. Syntaxe JSDoc incorrecte dans `gestion_onglet_carte.js`

Les commentaires utilisent `/** ... **/` (double astérisque en fin), format non reconnu par JSDoc. Les outils de génération de documentation ignoreront ce fichier entier.

### 4. Fonctions `async` sans `@returns {Promise<...>}`

De nombreuses fonctions asynchrones documentées indiquent seulement `@returns {void}` au lieu de `@returns {Promise<void>}`. Mineure mais incorrecte.

### 5. Fonction `logoutOnisep()` vide et non documentée

La fonction existe dans `gestion_params.js` mais son corps est vide. Il faut soit l'implémenter, soit la documenter comme "non implémentée" avec une note.

---

## Modèle de documentation recommandé

Voici le pattern JSDoc à appliquer uniformément :

```javascript
/**
 * [Description courte et active : "Charge", "Affiche", "Calcule", "Retourne"...]
 * [Optionnel : description complémentaire si nécessaire]
 * 
 * @param {string} uai - Code UAI de l'établissement (7 chiffres + 1 lettre)
 * @param {Object} [options={}] - Options de configuration (optionnel)
 * @param {boolean} [options.overwrite=false] - Écrase les données existantes si true
 * @returns {Promise<Object|null>} Établissement enrichi, ou null si non trouvé
 */
async function getEtablissementEnrichi(uai, options = {}) { ... }
```

**Règles :**
- Commencer par un verbe à l'impératif ou à l'infinitif
- Documenter TOUS les paramètres, y compris optionnels (avec valeur par défaut)
- Indiquer le type JS précis : `{string}`, `{number}`, `{boolean}`, `{Object}`, `{Array}`, `{Promise<type>}`, `{string|null}`
- Pour les méthodes `async`, toujours `@returns {Promise<...>}`
- Pour les méthodes sans retour : `@returns {void}`
- Pour les méthodes privées (`#`) : ajouter `@private`

---

## Changelog de l'audit

| Version | Date | Modifications |
|---------|------|---------------|
| v0.51 | 23 fév. 2026 | Mise à jour sections 20 et 22 : +9 fonctions documentées. Ajout des nouvelles fonctions v0.51 (favorisDivers, _htmlFavori*, guard _detailsModalOpening). Suppression `confirmClearCARIF()` de l'UI. |
| v0.43 | 22 fév. 2026 | Audit initial |
