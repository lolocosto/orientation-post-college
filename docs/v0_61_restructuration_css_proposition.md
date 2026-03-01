# Proposition de restructuration du CSS — Parcours Avenir

> **Date :** 1er mars 2026
> **Objet :** Réorganiser design-system.css pour refléter l'architecture du projet

---

## Diagnostic

Le fichier actuel (2339 lignes) est organisé chronologiquement — chaque version a ajouté ses styles en fin de fichier avec un commentaire du type `/* v0.XX — ... */`. On retrouve le même composant défini à 3 endroits différents :

- `.badge` est défini en section 4 (ligne 288), puis REDÉFINI en section v0.51 (ligne 2030) avec des valeurs différentes, puis des variantes `.badge--statut-*` en section v0.56 (ligne 2305)
- `.detail-header-action--star-active` apparaît deux fois (ligne 1966 et ligne 2092)
- Les corrections de contraste v0.56 redéfinissent des propriétés déjà posées plus haut
- Le responsive est éclaté entre la section principale (1401-1603), des `@media` isolés dans les fiches modales (1996-2023), l'accordéon (529-537), les filtres carte (2289-2299), et l'itinéraire (1144)

---

## Nouvelle organisation proposée

La structure suit la logique **du plus générique au plus spécifique**, en miroir de l'architecture du projet :

```
 1. FONDATIONS        — Variables, reset, typographie, scrollbar
 2. LAYOUT            — Header, container, onglets, grille principale
 3. COMPOSANTS UI     — Boutons, badges, alertes, formulaires, tableaux, modales, cartes, listes, états vides, progress bars
 4. FICHES DE DÉTAIL  — Sections, accordéon, scrollable, catégories, info-rows, liens externes, blocs de compétences
 5. FAVORIS           — Bouton étoile, cartes favoris, layout actions
 6. RECHERCHE         — Panneaux de recherche, smart search, sélection commune, scope buttons, sélecteur de voies
 7. RÉSULTATS         — Tableaux de résultats, filtres, result-cards mobile, diplômes/items checkboxes
 8. CARTE             — Container Leaflet, popups, marqueurs, légende, filtres carte, stats carte
 9. PARAMÈTRES        — Panneau latéral, slider menu/section, formulaires paramètres, préférences chiffrées, à propos
10. EXTRACTION        — Progress details, étapes, boîtes info
11. TOUR GUIDÉ        — Popover driver.js, badges tour, boutons
12. BANNIÈRES         — Bannière de chargement DB
13. UTILITAIRES       — u-hidden, u-mt-*, u-text-*, u-flex-*
14. RESPONSIVE        — Tablette (≤1024), Mobile (≤767), Très petit (≤360) — TOUT ici, plus de @media éparpillés
15. PRINT / EXPORT    — @media print
```

### Principes

1. **Un composant = un seul endroit.** Si `.badge` a des variantes ajoutées en v0.56, elles sont AVEC le `.badge` original, pas 1500 lignes plus bas.

2. **Le responsive est centralisé.** Toutes les media queries sont regroupées en section 14, sous-organisées par breakpoint. On ne retrouve plus de `@media` isolé au milieu d'un composant.

3. **Plus de sections « v0.XX ».** L'historique est dans le CHANGELOG, pas dans le CSS. Un commentaire `/* ajouté v0.56 */` en fin de ligne est toléré pour traçabilité, mais il ne structure plus le fichier.

4. **Les doublons sont fusionnés.** La double définition de `.badge` (lignes 288 et 2030) est résolue en une seule définition cohérente.

---

## Problème bouton « Fiche Onisep » pleine largeur

### Cause

Dans la fiche **établissement**, les liens externes utilisent la classe `.detail-external-links` qui contient :
```css
.detail-external-links .btn { flex: 1 1 auto; min-width: 140px; }
```
Ce `flex: 1 1 auto` fait grandir les boutons pour remplir toute la largeur disponible. Quand il n'y a qu'un seul bouton (pas de site web), il prend 100%.

Dans les fiches **diplôme** et **dispositif**, le lien utilise `.detail-onisep-link` qui n'a pas de `flex` — le bouton garde sa taille naturelle.

### Correctif

Utiliser `.detail-external-links` partout (diplômes, dispositifs, apprentissage) pour harmoniser. Le `flex: 1 1 auto` est le bon comportement quand il y a 2 boutons côte à côte (site web + fiche). Mais quand il n'y a qu'un seul bouton, on peut limiter sa largeur avec `max-width: fit-content` pour éviter qu'il prenne 100%.

Ou mieux : retirer le `flex: 1 1 auto` et laisser les boutons à leur taille naturelle, côte à côte grâce au `display: flex; gap: 10px` déjà présent. C'est plus cohérent et plus sobre.

---

## Site web de l'établissement (ens_site_web)

**Il est déjà récupéré.** Le pipeline complet fonctionne :

1. **Parser** (`onisep_parser.js` l.302) : `action.ens_site_web` → `enrich.siteWeb`
2. **Contrôleur** (`onisep_extraction_controller.js` l.1226) : `updates.siteWeb = enrich.siteWeb`
3. **Base** (`database_service.js` `updateEtablissement`) : stocké sur l'objet établissement
4. **Vue** (`gestion_onglet_resultats.js` l.1691) : `if (etablissement.siteWeb)` → affiche le bouton « 🌐 Site de l'établissement ↗ »

Le champ est disponible quand l'API Onisep le fournit dans `actions_lycees`. Si un établissement n'a pas de bouton « Site web », c'est que l'API n'a pas renvoyé `ens_site_web` pour cet UAI — le code fonctionne correctement.
