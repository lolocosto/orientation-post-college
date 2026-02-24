# Parcours Avenir — Correctifs v0.53.1

## Résumé des 5 corrections

| # | Type | Description | Fichiers modifiés |
|---|------|-------------|-------------------|
| 1 | Bug | Filtres inopérants sur téléphone | `systeme_filtres.js`, `gestion_onglet_resultats.js` |
| 2 | Bug | Éléments cliquables non homogènes | `gestion_onglet_resultats.js` |
| 3 | Amélioration | Blocs de compétences illisibles | `gestion_onglet_resultats.js` |
| 4 | Amélioration | Parcours bac pro non harmonisé | `gestion_onglet_resultats.js` |
| 5 | Bug | Favori recherche jamais sauvegardé | `gestion_onglet_recherche.js` |

---

## Bug 1 — Filtres inopérants sur téléphone

### Diagnostic
Les fonctions `filterEtablissements()`, `filterDiplomes()`, etc. dans `systeme_filtres.js` ne filtraient que les lignes `<tr>` du tableau HTML. Sur mobile, le tableau est masqué (`display:none`) et seules les cartes `.result-card` sont visibles — mais elles n'étaient jamais filtrées.

### Correction
Chaque fonction de filtrage (6 au total) sélectionne maintenant les cartes `.result-card` en parallèle des `<tr>`, et applique la même visibilité via un `Set` d'identifiants visibles.

**Pattern appliqué dans les 6 fonctions :**
```javascript
const rows  = document.querySelectorAll('#results-body tr[data-id]');
const cards = document.querySelectorAll('.results-cards .result-card[data-id]');
const visibleIds = new Set();
rows.forEach(row => {
    // ... logique de filtre existante ...
    if (visible) visibleIds.add(row.dataset.id);
});
cards.forEach(card => {
    card.style.display = visibleIds.has(card.dataset.id) ? '' : 'none';
});
```

De plus, les cartes HTML ont été enrichies avec les `data-*` nécessaires :
- Cartes établissements : ajout `data-type`, `data-commune`, `data-statut`
- Cartes diplômes scolaires : ajout `data-niveau`, `data-type`, `data-categorie`
- Cartes diplômes apprentissage : ajout `data-niveau`, `data-type`

### Tests : T-FM01 à T-FM09

---

## Bug 2 — Éléments cliquables non homogènes

### Diagnostic
Dans les modales de détail, les éléments cliquables (diplômes, établissements, options) utilisaient des `<a href="#">` stylés en bleu souligné, tandis que les dispositifs utilisaient `<li class="detail-item detail-item--link" onclick>` avec texte en gras noir.

### Correction
Tous les éléments cliquables des listes de détail utilisent maintenant le pattern dispositif :

**Avant (6 endroits) :**
```html
<li class="detail-item">
    <a href="#" onclick="event.preventDefault(); showXxx('...')">Texte ↗</a>
</li>
```

**Après :**
```html
<li class="detail-item detail-item--link" onclick="showXxx('...')">
    <div><strong>Texte</strong> ↗</div>
</li>
```

**Modales corrigées :**
- Détail établissement : diplômes scolaires, diplômes apprentissage, options 2nde GT
- Détail diplôme scolaire : liste des établissements
- Détail diplôme apprentissage : liste des centres de formation
- Détail option 2nde GT : liste des établissements
- Détail dispositif : liste des établissements
- Lien ONISEP établissement : nettoyage du style inline → `class="btn btn--primary"`

**Résultat :** plus aucun `<a href="#">` dans les modales. Il ne reste que des `<a href>` légitimes pour les liens externes (mailto, ONISEP, France Compétences).

### Tests : T-HI01 à T-HI07

---

## Amélioration 3 — Blocs de compétences en section repliable

### Diagnostic
Le champ `contenu` de l'API CARIF-OREF contenait souvent les blocs de compétences concaténés en texte brut, affiché au début de la modale comme `<div class="detail-description">`. Ce texte très long rendait la modale difficilement lisible, surtout sur téléphone.

### Correction
1. **Le `contenu` brut** n'est affiché que s'il est court (< 500 car.) ET que `blocsCompetences` est vide (cas d'une vraie description).

2. **Les blocs de compétences** sont affichés dans une section accordéon **repliée par défaut** (`accordionSection(..., false)`) avec chaque bloc comme item non cliquable :

```html
<li class="detail-item detail-item--info">
    <div><span class="detail-bloc-competence__code">RNCP123</span> <strong>Titre du bloc</strong></div>
    <div class="detail-item-note">Compétence 1 · Compétence 2 · Compétence 3</div>
</li>
```

La section est masquée si le tableau des blocs est vide.

### Tests : T-BC01 à T-BC03

---

## Amélioration 4 — Parcours de formation harmonisé

### Diagnostic
`generateParcoursProHtml()` utilisait des `<div>` avec styles inline (couleurs, marges, backgrounds) au lieu du design system de l'application.

### Correction
La fonction a été réécrite pour utiliser les mêmes items que le reste de l'application :

**Avec famille de métiers (4 items) :**
1. `detail-item--info` : **Famille de métiers :** Nom de la famille
2. `detail-item--info` : **2nde :** Nom de la 2nde commune
3. `detail-item--info` : **1ère :** Nom de la 1ère
4. `detail-item--info` : **Terminale :** Nom de la terminale

**Hors famille (4 items) :**
1. `detail-item--info` : **Hors famille de métiers** (+ 🌾 si agricole)
2-4. Idem

**Section renommée** de "Parcours" en "Parcours de formation".

Plus aucun style inline. Badge agricole 🌾 conservé.

### Tests : T-PF01 à T-PF07

---

## Bug 5 — Favori recherche jamais sauvegardé

### Diagnostic
Les checkboxes `save-as-favorite-geo` et `save-as-favorite-diplomes` étaient bien présentes dans le HTML avec un script de toggle du champ nom, et la fonction `ajouterFavori()` existait dans `gestion_params.js`. Mais **aucun code ne vérifiait la checkbox après extraction** — le favori n'était donc jamais créé.

### Correction
1. **Nouvelle fonction `_trySaveFavorite(type, params)`** dans `gestion_onglet_recherche.js` :
   - Vérifie si la checkbox `save-as-favorite-{type}` est cochée
   - Vérifie que le nom n'est pas vide
   - Appelle `ajouterFavori()` avec les paramètres de la recherche
   - Réinitialise la checkbox et le champ après sauvegarde

2. **Appel après extraction réussie** dans :
   - `lancerExtractionGeo()` : sauvegarde avec `type='geo'` + paramètres commune/EPCI/voies
   - `lancerExtractionItems()` : sauvegarde avec `type='diplomes'` + paramètres géo/items sélectionnés

### Tests : T-FAV01 à T-FAV04
