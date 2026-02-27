# v0.58 — ID internes numériques, unicité UAI+nom, triple nom, double libellé, dédup communes accent-insensible

## Résumé des modifications

### 1. ID interne numérique séquentiel pour les établissements

**Problème** : L'API ONISEP peut retourner plusieurs structures avec le **même UAI** (ex : "Lycée Victor et Hélène Basch" et "Micro-lycée Victor et Hélène Basch" partagent l'UAI `0352009U`). L'ancien système `etab_${uai}` écrasait donc silencieusement l'un des deux.

**Solution** : 
- Les `_id` internes sont désormais des numéros séquentiels : `etab_1`, `etab_2`, `etab_3`…
- L'unicité est testée sur la **combinaison UAI+nom** (ou SIRET+nom si pas d'UAI), pas sur l'UAI seul.
- Un index d'unicité `#etabUniquenessIndex` (Map) est maintenu en mémoire et reconstruit au chargement depuis localStorage.
- `getEtablissementsByUaiSync(uai)` retourne **tous** les établissements d'un même UAI.
- `getEtablissementByUaiSync(uai, nom)` exige désormais les **deux paramètres** (UAI + nom) pour garantir l'unicité du résultat. Si le nom n'est pas disponible au point d'appel, on utilise `getEtablissement(_id)` avec l'identifiant interne.

### 1b. Suppression des fallbacks UAI dans les jointures

**Problème** : De nombreuses méthodes de jointure (`getDiplomesParEtablissementSync`, `getDiplomeEnrichi`, `getDispositifEnrichi`, etc.) contenaient un fallback `rel.uai === etab.uai` pour les relations sans `etabId`. Ce fallback était incorrect depuis v0.58 car un même UAI peut correspondre à plusieurs structures.

**Solution** :
- Toutes les jointures internes ne filtrent plus que par `etabId` (_id interne).
- Les méthodes `updateEtablissementByUai(uai)` et le fallback UAI dans `updateEtablissement` ont été supprimés.
- `enrichirEtablissement(etabId, champs)` prend désormais un `_id` au lieu d'un UAI.
- `fusionnerEtablissementAprentissage` utilise `getEtablissementsByUaiSync(uai)` pour trouver le premier existant.
- Le champ `etabNom` a été ajouté dans les relations CARIF-OREF pour permettre la résolution UAI+nom au point d'appel du controller.

### 1c. Correction du bug racine : structures ignorées à l'extraction (v0.58b)

**Problème** : Malgré les corrections 1a/1b dans `database_service.js`, le Micro-lycée VHB n'apparaissait pas après extraction. Deux causes identifiées en amont :

1. **`onisep_api.js`** (cause première) : La méthode `#deduplicateResults` dédupliquait les résultats API par `code_uai` seul. Deux structures partageant le même UAI → la deuxième était éliminée **avant même d'atteindre le parser**.
2. **`onisep_extraction_controller.js`** : `#buildEtablissementsUniquesMap` indexait aussi par UAI seul, doublonnant le filtrage.

**Solution** :
- **`onisep_api.js`** : `#deduplicateResults` utilise désormais une clé composite `code_uai||nom` pour les structures. Deux structures avec le même UAI mais des noms différents sont conservées.
- **`database_service.js`** : Nouvelle méthode `getOrCreateEtablissementId(uai, nom)` — le contrôleur demande un `_id` pour chaque couple unique `(uai, nom)`. Si le couple existe déjà, retourne l'`_id` existant. Sinon, réserve un nouveau slot.
- **`onisep_extraction_controller.js`** : `#buildEtablissementsUniquesMap` appelle `getOrCreateEtablissementId` pour chaque structure brute. Retourne `etablissementsById` (Map<_id, etab>) et `uaisValidesSet` (Set<UAI>). `#storeEtablissements` construit `uaiToIds` (Map<UAI, [_id]>). Les méthodes d'enrichissement itèrent TOUS les `_id` d'un UAI.
- **`gestion_onglet_resultats.js`** : compteurs d'établissements comptent par `etabId` au lieu de UAI.

**Fichiers modifiés** : `js/onisep_api.js`, `js/database_service.js`, `js/onisep_extraction_controller.js`, `js/gestion_onglet_resultats.js`

### 1d. Correction fusion CARIF et normalisation accents (v0.58c)

**Problème 1 — Fusion CARIF aveugle** : `fusionnerEtablissementAprentissage` prenait `existants[0]` (le premier établissement de l'UAI) sans comparer le nom. Si ONISEP avait créé Lycée VHB (etab_1) et Micro-lycée VHB (etab_2), un CARIF « MICRO-LYCEE VHB » fusionnait avec etab_1 (le lycée) au lieu de etab_2.

**Problème 2 — Accents non normalisés** : La clé d'unicité `#buildEtabUniquenessKey` faisait `.toLowerCase()` sans supprimer les accents. Un nom ONISEP « Hélène » et un nom CARIF « HELENE » donnaient des clés différentes → doublon.

**Solution** :
- **`#normalizeNom(nom)`** (nouvelle méthode utilitaire) : `.trim().normalize('NFD').replace(/accents/g, '').toLowerCase()` — utilisée dans `#buildEtabUniquenessKey`, `getOrCreateEtablissementId`, et `fusionnerEtablissementAprentissage`.
- **`fusionnerEtablissementAprentissage`** : compare le nom CARIF normalisé avec tous les existants de l'UAI.
  - Match exact par nom → fusion avec la bonne structure
  - Un seul existant (pas de match) → fusion par défaut (cas fréquent)
  - Plusieurs existants, aucun match → nouvel enregistrement (structure inconnue)

**Fichiers modifiés** : `js/database_service.js`

### 1e. Clés libelle_etabId, etabId au build, comptage cohérent (v0.58e)

**Problème 1 — Timing** : `#enrichirRelationsAvecEtabId(uaiToIds)` était appelée à l'étape 3, mais les relations dispositifs (étape 4), options (étape 6) et spécialités (étape 8) n'existaient pas encore. Ces relations ne recevaient jamais de `etabId`.

**Problème 2 — Clés UAI** : Les clés de stockage des relations options et spécialités utilisaient `libelle_UAI` (ex: `Création et innovation technologiques_0350791V`). Or l'UAI n'est plus un identifiant unique d'établissement depuis v0.58 (cas VHB : même UAI, structures distinctes).

**Problème 3 — Comptage** : La table utilisait des fallbacks `rel.etabId || rel.uai` masquant le problème, tandis que le détail ne comptait que par `etabId` → incohérences systématiques.

**Solution** :

1. **`etabId` dès le build** : Les méthodes `#buildDispositifsParEtablissementMap`, `#buildOptions2ndeGTParEtablissementMap`, `#buildSpecialites1ereGParEtablissementMap` prennent `uaiToIds` en paramètre et résolvent UAI→etabId immédiatement.

2. **Clés `libelle_etabId`** : Les relations options et spécialités utilisent désormais `libelle_etabId` comme clé de stockage (ex: `Création et innovation technologiques_etab_6`).

3. **`#enrichirRelationsAvecEtabId` simplifié** : Ne traite plus que les relations **diplômes** (seules à être stockées avant `uaiToIds`). Les 3 autres tables reçoivent `etabId` au build.

4. **Compteurs harmonisés** : Tous les compteurs (table diplômes, table dispositifs, `getAllOptions2ndeGTAvecComptage`) utilisent `rel.etabId` seul, sans fallback UAI.

**Fichiers modifiés** : `js/onisep_extraction_controller.js`, `js/gestion_onglet_resultats.js`, `js/database_service.js`

---

### 2. Triple nom pour les établissements (nomOnisep, nomCarif, nom)

**Problème** : Les noms d'établissements diffèrent entre sources (ONISEP : "Lycée Victor et Hélène Basch", CARIF-OREF : "LYCEE VICTOR ET HELENE BASCH"). Impossible de tracer l'origine du nom affiché.

**Solution** : Chaque établissement stocke désormais 3 champs nom :
- `nomOnisep` : nom brut de la source ONISEP (dataset structures)
- `nomCarif` : nom brut de la source CARIF-OREF
- `nom` : nom normalisé utilisé dans l'UI (= nomOnisep par défaut, fallback nomCarif)

**Fichiers modifiés** : `js/database_service.js`, `js/onisep_parser.js`, `js/carif_oref_parser.js`

---

### 3. Double libellé pour les diplômes (libelleOnisep, libelleCarif)

**Problème** : Les libellés CARIF-OREF sont souvent en majuscules (ex : "CAP - BOULANGER") tandis qu'ONISEP utilise un format normalisé ("CAP Boulanger"). Le libellé affiché est normalisé, mais la valeur source est perdue.

**Solution** : Chaque diplôme stocke désormais :
- `libelleOnisep` : libellé brut ONISEP (null si diplôme CARIF uniquement)
- `libelleCarif` : libellé brut CARIF-OREF (null si diplôme ONISEP uniquement)
- `libelle` : libellé normalisé pour l'affichage (inchangé)

**Fichiers modifiés** : `js/onisep_parser.js`, `js/carif_oref_parser.js`

---

### 4. Déduplication des communes insensible aux accents

**Problème** : Malgré la normalisation de casse (v0.57), les communes pouvaient encore apparaître en doublon dans les filtres à cause des accents. Exemple : "Cesson-Sévigné" (ONISEP, avec accent) et "Cesson-Sevigne" (CARIF-OREF, sans accent).

**Solution** :
- Nouvelle fonction `_communeDeduplicationKey(commune)` : produit une clé sans accents et en minuscules pour la comparaison.
- `populateCommuneFilter()` déduplique par cette clé tout en conservant la version accentuée pour l'affichage.
- `filterEtablissements()` compare les communes via cette clé pour que le filtre marche même si la casse/accentuation diffère.
- La version accentuée est **préférée** lors de la déduplication.

**Fichiers modifiés** : `js/utils.js`, `js/systeme_filtres.js`

---

### 5. Logging systématique des erreurs d'unicité

**Problème** : Les insertions en doublon dans certaines tables étaient silencieuses.

**Solution** : Toutes les méthodes `insert*` de `DatabaseService` logguent désormais un message lorsqu'une clé existante est écrasée :
- `insertEtablissement` → `console.warn` avec la clé d'unicité en cas de doublon
- `insertDiplome`, `insertDispositif`, `insertOption2ndeGT`, `insertSpecialite1ereG`, `insertDiplomeApprentissage` → `console.info` en cas de mise à jour
- `insertDiplomeParEtablissement` → `console.info` si la relation existe déjà

**Fichier modifié** : `js/database_service.js`

---

## Fichiers modifiés

| Fichier | Modifications |
|---------|--------------|
| `js/database_service.js` | ID numériques, index unicité UAI+nom, signature stricte `getEtablissementByUaiSync(uai, nom)`, suppression fallbacks UAI dans toutes les jointures, `enrichirEtablissement(etabId)`, suppression `updateEtablissementByUai` |
| `js/onisep_parser.js` | Ajout `nomOnisep` aux structures, `libelleOnisep` aux diplômes |
| `js/carif_oref_parser.js` | Ajout `nomCarif` aux établissements, `libelleCarif` aux diplômes, `etabNom` dans les relations |
| `js/carif_oref_extraction_controller.js` | Résolution `etabId` via `getEtablissementByUaiSync(uai, nom)` puis `getEtablissementsByUaiSync(uai)` |
| `js/onisep_extraction_controller.js` | Appel `getEtablissementByUai(uai, nom)` avec les deux paramètres |
| `js/utils.js` | Nouvelle `_communeDeduplicationKey()`, exposition globale |
| `js/systeme_filtres.js` | `populateCommuneFilter()` déduplique par accent, `filterEtablissements()` compare par clé |
| `js/details_modal.js` | `openEtablissementDetailsFromModal(etabId)` — suppression fallback UAI |
| `tests/14_unit_v058_id_interne_dedup.test.js` | 26 tests unitaires couvrant les 6 axes de changement |

## Tests ajoutés (14_unit_v058_id_interne_dedup.test.js)

- **A. ID interne numérique** : 5 tests (séquentiel, même UAI / noms différents, doublon, refus, getByUaiAll)
- **B. Triple nom** : 2 tests (ONISEP, CARIF)
- **C. Double libellé diplôme** : 2 tests (ONISEP, CARIF)
- **D. Communes accent-insensible** : 3 tests (clé dedup, normalisation, comparaison)
- **E. Logging unicité** : 4 tests (diplôme, dispositif, diplôme apprentissage, établissement)
- **F. Régression jointures** : 2 tests (getEtablissementEnrichi, getDiplomeEnrichi)
- **G. Signature stricte getEtablissementByUaiSync(uai, nom)** : 5 tests (match exact, nom incorrect, nom omis, insensible casse, distinction multi-UAI)
- **H. Jointures par etabId uniquement** : 3 tests (isolation diplômes par etabId, fusion apprentissage, enrichirEtablissement par _id)
- **I. Compteurs par etabId** : 1 test (relations comptent par etabId au lieu de UAI)
- **J. autresFormations par _id** : 1 test (stockage et lecture par _id interne, pas par UAI)
- **K. Jointure options sans fallback UAI** : 1 test (getOptionsDisponiblesParPerimetre joint par etabId uniquement)
- **L. Export et details_modal sans fallback UAI** : 1 test (getEtablissementEnrichi refuse un UAI)
