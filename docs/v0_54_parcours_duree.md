# v0.54 — Parcours de formation & Durée du cycle

## Résumé des changements

### 1. Toutes les sections repliées par défaut

**Toutes** les modales de détail (diplôme scolaire, diplôme apprentissage, établissement, dispositif, option 2nde GT) ont désormais toutes leurs sections repliées au démarrage. La section "Informations générales" reste en première position.

**Fichier modifié :** `js/gestion_onglet_resultats.js`  
- Tous les appels `accordionSection(…, true)` (déjà corrects)
- Correction : `Compétences de fin de formation` passait `false` → corrigé en `true`

---

### 2. Section Parcours pour tous les diplômes scolaires

Nouvelle fonction `generateParcoursFormationHtml(diplome, parcoursBacPro, duree)` qui remplace l'ancienne `generateParcoursProHtml`. Elle gère **tous les types de diplômes** :

| Type de diplôme | Contenu du parcours |
|---|---|
| **Bac pro** (famille de métiers) | Famille → 2nde → 1ère → Terminale + Durée |
| **Bac pro** (hors famille) | Seconde pro spécifique → 1ère → Terminale + Durée |
| **Bac général** | 2nde GT → 1ère (3 spécialités) → Terminale (2 spécialités) + Durée |
| **Bac techno** | 2nde GT → 1ère série → Terminale série + Durée |
| **CAP / CAPa** | 2 ans après 3ème → 1ère année → 2ème année + Durée |
| **BMA, DE, autres** | Durée du cycle uniquement (si disponible) |
| **Diplôme sans info** | Section non affichée |

**Fichier modifié :** `js/gestion_onglet_resultats.js`  
- Suppression de `generateParcoursProHtml(parcours)` (publique)
- Ajout de `generateParcoursFormationHtml(diplome, parcoursBacPro, duree)` (publique)
- Ajout de `_generateParcoursProHtml(parcours, duree)` (privée, bac pro uniquement)

---

### 3. Durée du cycle standard (voie scolaire)

Le champ `af_duree_cycle_standard` de l'API ONISEP (dataset `actions_lycee`) est désormais affiché partout :

#### Dans la modale diplôme scolaire :
- **Informations générales** : ligne "Durée du cycle" (première valeur trouvée parmi les relations)
- **Section Établissements** : badge `⏱ durée` sur chaque établissement
- **Section Parcours** : item "Durée" en fin de parcours

#### Dans la modale établissement :
- **Section Diplômes — voie scolaire** : badge `⏱ durée` sur chaque diplôme

**Données déjà disponibles :** Le champ `dureeCycleStandard` est parsé depuis v0.43 (`onisep_parser.js` ligne 312) et stocké dans la relation `diplomes_par_etablissement`. La jointure `getDiplomeEnrichi()` fusionne déjà les relations avec les établissements via `{ ...etab, ...(rel || {}) }`.

---

### 4. Durée en apprentissage (dureeAnnees)

#### Dans la modale diplôme apprentissage :
- Badge `⏱ X an(s)` déjà présent sur chaque centre de formation (v0.53)

#### Dans la modale établissement :
- **Section Diplômes — voie apprentissage** : nouveau badge `⏱ X an(s)` sur chaque diplôme
- Nécessite l'enrichissement de `getDiplomesApprentissageParEtablissementSync()` : la durée est extraite de la relation `diplomes_apprentissage_par_etablissement` et injectée dans le diplôme sous `_dureeAnnees`

**Fichier modifié :** `js/database_service.js`  
- `getDiplomesApprentissageParEtablissementSync()` : ajout de la jointure relation → diplôme pour `_dureeAnnees`

---

## Fichiers modifiés

| Fichier | Modification |
|---|---|
| `js/gestion_onglet_resultats.js` | Refonte `buildDiplomeDetailsHTML`, nouvelle `generateParcoursFormationHtml`, badges durée dans modales étab et diplôme |
| `js/database_service.js` | Enrichissement diplômes apprentissage avec `_dureeAnnees` |
| `index.html` | Cache bump `v=1772200100` |
| `tests/10_unit_v054_parcours_duree.test.js` | 22 tests unitaires couvrant parcours, durée, sections repliées |

---

## Tests

### Nouveaux tests (10_unit_v054_parcours_duree.test.js)

- **T-PARC-01 à T-PARC-10** : Section parcours pour chaque type de diplôme
- **T-DUR-01 à T-DUR-07** : Badges durée dans toutes les modales
- **T-FOLD-01 à T-FOLD-06** : Toutes sections repliées, infos générales en premier
- **T-PARCHTML-01 à T-PARCHTML-03** : Vérification HTML produit
