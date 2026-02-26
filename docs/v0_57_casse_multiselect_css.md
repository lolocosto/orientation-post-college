# v0.57 — CSS lisibilité, filtres multi-select carte, normalisation casse communes & libellés

## Résumé des modifications

### 1. CSS : Boutons popup carte et titres tour guidé (bug fix)

**Problème** : Les boutons "Voir fiche complète" et "Itinéraire" dans les popups de la carte, ainsi que les titres des étapes du tour guidé, étaient illisibles.

**Cause** : Leaflet injecte `.leaflet-container a { color: #0078A8 }` qui écrase la couleur des liens `<a>` dans les popups. Driver.js applique des styles inline aux titres qui écrasent nos règles CSS.

**Correction** : Ajout de `!important` sur les propriétés critiques :
- `.map-popup-btn` : `color: white !important`, `background: var(--primary) !important`, `text-decoration: none !important`
- `.map-popup-btn--secondary` : idem avec `var(--secondary)`
- `.driver-popover-title` : `color: var(--primary) !important`, `font-size: 16px !important`, `font-weight: 700 !important`
- `.driver-popover-description` : `color: var(--text) !important`, `font-size: 13.5px !important`

**Fichier modifié** : `css/design-system.css`

---

### 2. Filtres carte en multi-select

**Problème** : Les filtres type, statut et commune de la carte étaient des `<select>` simples, contrairement à la vue Établissements qui utilise des `<select multiple>`.

**Correction** :
- **HTML** : Ajout de l'attribut `multiple` aux trois selects + suppression des options "Tous..." par défaut
- **JS** : Nouvelle fonction `_getMapMultiSelectValues(id)` qui retourne un `Array` de `selectedOptions`
- **JS** : `applyMapFilters()` utilise `Array.includes()` au lieu de `===` pour le filtrage multi-valeurs
- **JS** : `_populateMapSelect()` simplifié — plus d'option "Tous", absence de sélection = pas de filtre
- **CSS** : Style adapté pour `select[multiple]` (min-height, max-height, overflow-y)

**Fichiers modifiés** : `index.html`, `js/gestion_onglet_carte.js`, `css/design-system.css`

---

### 3. Normalisation casse des communes (au parsing)

**Problème** : Les noms de communes avaient des casses différentes selon la source (ONISEP : "Bruz", CARIF-OREF : "BRUZ"), ce qui créait des doublons dans les filtres multi-select.

**Correction** : Nouvelle fonction utilitaire `normaliserNomCommune(commune)` dans `utils.js` :
- Convertit en "Title Case" : première lettre de chaque mot en majuscule
- Gère les particules françaises en minuscules : de, du, des, la, le, les, en, sur, sous, lès
- Gère les séparateurs tirets et espaces
- Exemples : "BRUZ" → "Bruz", "SAINT-MALO" → "Saint-Malo", "LA ROCHE-SUR-YON" → "La Roche-sur-Yon"

**Intégration au parsing** :
- `onisep_parser.js` : `normaliserNomCommune()` appliqué sur `structure.commune`
- `carif_oref_parser.js` : `normaliserNomCommune()` appliqué sur `e.localite` (établissements) et `communeLocale` (relations)

**Fichiers modifiés** : `js/utils.js`, `js/onisep_parser.js`, `js/carif_oref_parser.js`

---

### 4. Normalisation casse des libellés diplômes (au parsing)

**Problème** : Les libellés de diplômes CARIF-OREF étaient en majuscules (ex : "CAP - BOULANGER") alors que les libellés ONISEP sont en casse mixte (ex : "CAP Boulanger"). La logique de nommage diffère : le type de diplôme est au début chez ONISEP mais peut être à la fin chez CARIF-OREF, séparé par " - ".

**Correction** : Nouvelle fonction utilitaire `normaliserLibelleDiplome(libelle)` dans `utils.js` :
1. Détecte le séparateur " - " ou " – " (format CARIF-OREF) → extrait type + intitulé
2. Sans séparateur : détecte un type connu en début de libellé (CAP, BTS, Bac pro, MC, BP, etc.)
3. Applique `_titleCaseType()` sur le type (avec dictionnaire de formes canoniques)
4. Applique `_titleCaseIntitule()` sur l'intitulé (sentence case : première lettre en majuscule)

**Exemples** :
| Entrée CARIF-OREF | Sortie normalisée |
|---|---|
| `CAP - BOULANGER` | `CAP Boulanger` |
| `BAC PRO - MAINTENANCE DES VEHICULES` | `Bac pro Maintenance des vehicules` |
| `BTS - COMPTABILITE ET GESTION` | `BTS Comptabilite et gestion` |
| `MC - TECHNICIEN EN ENERGIES RENOUVELABLES` | `MC Technicien en energies renouvelables` |

**Important** : Le `libelleNormalise` utilisé pour la jointure ONISEP ↔ CARIF-OREF continue d'utiliser le libellé brut original (`libelleRaw`), pas le libellé d'affichage normalisé.

**Fichiers modifiés** : `js/utils.js`, `js/carif_oref_parser.js`

---

## Tests

**Fichier** : `tests/13_unit_v057_casse_multiselect_css.test.js`

| Suite | Tests | Description |
|-------|-------|-------------|
| 1. CSS popup carte | 5 | Vérifie !important sur boutons popup |
| 2. CSS tour guidé | 3 | Vérifie !important sur titres driver.js |
| 3. Filtres multi-select | 7 | HTML multiple, JS selectedOptions, CSS min-height |
| 4. Casse communes | 9 | normaliserNomCommune + intégration parsers |
| 5. Casse libellés | 7 | normaliserLibelleDiplome + intégration parser |
| 6. Scénarios utilisateur | 7 | Cas d'usage complets end-to-end |

**Résultat** : 38 / 38 réussis ✅

---

## Fichiers modifiés

| Fichier | Modifications |
|---------|--------------|
| `css/design-system.css` | !important boutons popup, titres tour, styles select[multiple] carte |
| `index.html` | Selects carte en `multiple`, cache-busting v0.57 |
| `js/utils.js` | +120 lignes : `normaliserNomCommune()`, `normaliserLibelleDiplome()`, helpers `_titleCaseType()`, `_titleCaseIntitule()` |
| `js/gestion_onglet_carte.js` | Multi-select : `_getMapMultiSelectValues()`, refonte `_populateMapSelect()`, `applyMapFilters()` |
| `js/onisep_parser.js` | Appel `normaliserNomCommune()` sur commune |
| `js/carif_oref_parser.js` | Appel `normaliserNomCommune()` sur commune (2 endroits), `normaliserLibelleDiplome()` sur libellé + libelleCourt |
| `tests/13_unit_v057_*.test.js` | 38 nouveaux tests |
