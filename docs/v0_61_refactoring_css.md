# Analyse et plan de refactoring CSS — v0.61

> **Date :** 1er mars 2026  
> **Objet :** Nettoyage, renommage et consolidation du CSS

---

## 1. Suppression de `main.css`

`main.css` ne contient que 3 éléments à intégrer dans `design-system.css` :

| Élément | Destination dans design-system.css |
|---------|------------------------------------|
| `.link-icon` + `tr:hover .link-icon, .detail-item:hover .link-icon` | Section 4 (Composants génériques) après les badges |
| `.resultat-table tbody tr[onclick] { cursor: pointer; }` | Section 5, après `.resultat-table` existant |

**Action :** Intégrer puis supprimer `main.css` et sa référence dans `index.html`.

---

## 2. Déplacement des styles « résultats » vers la section générique

Les styles suivants dans la section 5 sont utilisés dans les 5 vues du panneau de résultats et sont donc génériques. Ils passent dans la section 4 en fin de section :

- **Tableaux de résultats** : `.resultat-table` et dérivés, `.resultat-col-*`, `.resultat-badge`, `#content-container`
- **Détails (modales résultats)** : `.detail-section`, `.detail-section-title`, `.detail-info-grid`, `.detail-list`, `.detail-item`, `.detail-item--link`, `.detail-item--info`, `.detail-badge`
- **Accordéon** : `.detail-section-title--accordion`, `.detail-section--collapsed`, `.detail-section__body`, `.detail-section--scrollable`, responsive associé
- **Info rows** : `.info-row`, `.info-label`, `.info-value`
- **Bloc information** : `.bloc-information-specifique`
- **Extraction / Progress** : `#progress-details`, `.progress-detail`, etc.

---

## 3. Renommage `diplomes-categorie` → `detail-categorie`

### Analyse

Les classes `diplomes-categorie` et `diplomes-categorie-title` sont utilisées pour :
- les catégories de diplômes voie scolaire (Bac Pro, CAP, BTS…) dans le détail d'un établissement
- les niveaux de diplômes voie apprentissage dans le détail d'un établissement  
- les niveaux des « autres diplômes » dans le détail d'un établissement
- les domaines professionnels dans le détail d'un diplôme  
- les domaines d'un dispositif

**Rôle réel :** regrouper des items par catégorie dans une section d'une modale de détail.

### Renommage

| Ancien | Nouveau |
|--------|---------|
| `.diplomes-categorie` | `.detail-categorie` |
| `.diplomes-categorie-title` | `.detail-categorie__title` |

### `diplomes-groupes` (ligne 1807)

La classe `diplomes-groupes` est utilisée dans `gestion_onglet_resultats.js` (lignes 1807 et 1868) comme conteneur `<div>` enveloppant les `detail-categorie` dans les sections « Domaines professionnels » (fiche diplôme) et « Domaines » (fiche dispositif). **Elle n'a aucune définition CSS** — c'est un `<div>` wrapper sémantique sans style propre.

**Action :** Renommer en `.detail-categories-group` pour cohérence, sans ajouter de style (le `<div>` est un wrapper sémantique suffisant).

### Fichiers JS modifiés

- `gestion_onglet_resultats.js` : lignes 1512-1513, 1538-1539, 1667-1668, 1807, 1810-1811, 1868, 1871-1872

---

## 4. Renommage des commentaires Favoris

| Ancien commentaire | Nouveau commentaire |
|--------------------|---------------------|
| `/* --- FAVORIS ÉTABLISSEMENTS --- */` | `/* --- FAVORIS --- */` |
| `/* Bouton favori (⭐) dans les fiches détail */` | inchangé |
| `/* Variante étoile seule (en-tête de modale détail établissement) */` | `/* Variante étoile seule (en-tête de modale de détail) */` |
| `/* En-tête de la fiche établissement (nom + étoile) */` | `/* En-tête de la fiche de détail (nom + étoile) */` |
| `/* Carte favori dans les paramètres */` | `/* Carte favori dans les paramètres (toutes catégories) */` |

---

## 5. Renommage `favori-card--etab` → `favori-card`

### Analyse

La classe `favori-card--etab` et ses enfants (`__nom`, `__meta`, `__actions`, `__btn-voir`, `__btn-del`) sont utilisés pour TOUS les favoris :
- Établissements (gestion_params.js `_htmlFavoriEtab`)
- Diplômes, diplômes apprentissage, dispositifs, options 2nde GT (gestion_params.js `_htmlFavoriDivers`)
- Recherches favorites (gestion_params.js lignes 920-926)
- Favoris dans l'onglet résultats (gestion_onglet_resultats.js lignes 2208-2211)

### Renommage

| Ancien | Nouveau |
|--------|---------|
| `.favori-card--etab` | `.favori-card` |
| `.favori-card--etab__nom` | `.favori-card__nom` |
| `.favori-card--etab__meta` | `.favori-card__meta` |
| `.favori-card--etab__actions` | `.favori-card__actions` |
| `.favori-card--etab__btn-voir` | `.favori-card__btn-voir` |
| `.favori-card--etab__btn-del` | `.favori-card__btn-del` |

### Fusion `_htmlFavoriEtab` / `_htmlFavoriDivers`

Les deux fonctions sont quasi-identiques. Les différences :
- `_htmlFavoriEtab` : affiche icône 🏫, nom=`f.nom`, meta=`type · commune · date`, action onclick=`showEtablissementDetails(id)`
- `_htmlFavoriDivers` : affiche icône configurable, nom=`f.titre`, meta=`date` seul, action onclick configurable

**Recommandation :** Fusionner en une seule fonction `_htmlFavoriCard(f, config)` avec un objet config :
```js
{ icon, nom, meta, showFn, showArg, deleteFn, deleteDataAttrs }
```

### Fichiers modifiés

- `css/design-system.css` : toutes les occurrences `favori-card--etab`
- `js/gestion_params.js` : fonctions `_htmlFavoriEtab`, `_htmlFavoriDivers`, favoris recherche (lignes 920+)
- `js/gestion_onglet_resultats.js` : lignes 2208-2211

---

## 6. Suppression de `.onisep-section` et `.domaines-section`

**Résultat de la recherche :** ces deux classes + les 2 règles associées (ligne 636-637) ne sont utilisées **nulle part** (ni dans les JS, ni dans index.html).

**Action :** Suppression directe.

---

## 7. Simplification Recherche & Filtres avec styles génériques

### Classes inutilisées à supprimer

| Classe | Motif |
|--------|-------|
| `.search-mode-selector` | Aucune utilisation JS/HTML |
| `.search-actions` | Aucune utilisation JS/HTML |
| `.niveaux-filter` (+`label`, `input`) | Aucune utilisation JS/HTML |
| `.voie-desc` | Aucune utilisation JS/HTML |

### Classes conservées mais aliasables sur génériques

| Classe spécifique | Équivalent générique existant | Action |
|-------------------|-------------------------------|--------|
| `.search-panel` | `.card--large` | Proche mais le panel a `border: 2px` et `border-radius-lg` — conserver car spécifique à la recherche |
| `.search-panel-header` | `.card__title` | Similaire mais a un `border-bottom` — conserver |
| `.search-commune-input` | `.setting-input` | Quasiment identique (12px vs 10px padding) — **remplacer par `.setting-input`** dans HTML |
| `.search-results-scroll` | Identique à `#tab-smart-search-results` | **Dédoublonner** — garder un seul sélecteur |
| `.voie-selector` | Proche de `.niveaux-filter` mais utilisé — conserver |
| `.scope-btn` | Proche de `.btn--secondary` + variantes — conserver car comporte `.active` et `.disabled` spécifiques |

### Recommandation

Conserver la plupart des styles recherche car ils ont des particularités visuelles (bordures épaisses, sélection commune, scope buttons). Supprimer uniquement les 4 classes inutilisées identifiées.

---

## 8. Analyse « COMPOSANTS MANQUANTS »

### Classes à supprimer (inutilisées)

| Classe | Justification |
|--------|---------------|
| `.settings-section-header` (+`:hover`, `.icon`, `.chevron`, `.active`) | Remplacé par le système de navigation slider v0.44. 0 occurrences HTML/JS |
| `.settings-section-content` (+ `.active`) | Idem, remplacé par le slider v0.44. 0 occurrences HTML/JS |
| `.setting-input--mono` | 0 occurrences partout |
| `.custom-style-7` | 0 occurrences partout |
| `.custom-style-11` | 0 occurrences partout |
| `.custom-style-12` | 0 occurrences partout |

### Classes conservées — remplacées par des génériques

| Classe | Usage actuel | Remplacement générique |
|--------|-------------|----------------------|
| `.view-header` | HTML: 1 (header export) | `.card__header` (même layout flex space-between) |
| `.export-buttons` | HTML: 1 | Simple `display:flex; gap:10px` — remplacer par utilitaire `style="display:flex;gap:10px"` ou class `.u-flex-gap` |

### Classes conservées telles quelles (utilisées)

Toutes les autres classes dans COMPOSANTS MANQUANTS sont activement utilisées dans `index.html` et/ou le JS :
- `.connection-status` (JS + HTML)
- `.header-content`, `.header-left`, `.header-right` (HTML)
- `.mode-selector`, `.mode-option` et dérivés (HTML)
- `.mode-help`, `.etape-navigation` (HTML)
- `.settings-header`, `.settings-close`, `.settings-content` (HTML)
- `.setting-*` (HTML + JS massivement)
- `.u-font-lg`, `.icon`, `.loading` (HTML + JS)
- `.search-panel-content`, `.help-content` (HTML)

---

## 9. Résumé des actions

| # | Action | Fichiers |
|---|--------|----------|
| 1 | Intégrer `main.css` → `design-system.css`, supprimer `main.css` + ref HTML | design-system.css, index.html |
| 2 | Déplacer styles résultats/détails de section 5 → section 4 | design-system.css |
| 3 | Renommer `diplomes-categorie` → `detail-categorie` | design-system.css, gestion_onglet_resultats.js |
| 4 | Renommer commentaires favoris | design-system.css |
| 5 | Renommer `favori-card--etab` → `favori-card` | design-system.css, gestion_params.js, gestion_onglet_resultats.js |
| 6 | Fusionner `_htmlFavoriEtab`/`_htmlFavoriDivers` → `_htmlFavoriCard` | gestion_params.js |
| 7 | Supprimer `.onisep-section` et `.domaines-section` | design-system.css |
| 8 | Supprimer classes recherche inutilisées | design-system.css |
| 9 | Supprimer composants manquants inutilisés | design-system.css |
| 10 | Remplacer `.view-header`/`.export-buttons` par génériques | design-system.css, index.html |
