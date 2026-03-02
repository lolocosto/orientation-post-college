# v0.62 — Phases 3 à 6 : Document technique de conception

## Phase 3 : Capture des métadonnées d'extraction — DÉJÀ INTÉGRÉE

La fonction `_saveExtractionMetadata()` a été ajoutée dans `gestion_onglet_recherche.js`
et est appelée après chaque extraction réussie (géo et diplômes/options).
Elle délègue à `databaseService.setLastExtractionMetadata()` (Phase 1).

---

## Phase 4 : Export de jeu de données post-extraction

### Objectif
Ajouter une option « Sauvegarder comme jeu de données » à côté de l'option favori
existante, dans les deux formulaires de recherche (géo et diplômes/options).

### Modifications

**`index.html`** : Ajouter une checkbox + champ nom pour les datasets, juste après
la checkbox favori, dans les deux panneaux :
- Section recherche géographique (après `save-as-favorite-geo`)
- Section recherche par diplôme/option (après `save-as-favorite-diplomes`)

**`gestion_onglet_recherche.js`** : Ajouter `_trySaveDataset()` sur le modèle de
`_trySaveFavorite()`, appelée après chaque extraction réussie.

---

## Phase 5 : Section « Jeux de données » dans Paramètres

### Objectif
Nouvelle section dans le panneau Paramètres pour gérer les jeux de données.

### Modifications

**`index.html`** : 
- Nouveau bouton de navigation `settingsOpenSection('datasets')`
- Nouveau pane `settings-pane-datasets`

**`gestion_params.js`** :
- Ajouter `'datasets'` dans `SECTION_TITLES`
- Ajouter la fonction `afficherListeDatasets()` pour peupler le pane
- Ajouter `chargerDataset(id)`, `supprimerDatasetIndex(id)` pour les actions
- Ajouter un bouton d'import de fichier JSON
- Mettre à jour `_updateMenuStatuses()` pour afficher le nombre de jeux indexés
- Ajouter dans `settingsOpenSection()` l'appel à `afficherListeDatasets()` quand la section est ouverte
- Option « Réafficher la modale de choix au démarrage » (reset du flag skip)

---

## Phase 6 : Finalisation

- Mettre à jour `APP_VERSION` → `'0.62'`
- Mettre à jour `CHANGELOG.md`
- Tests de non-régression
- Enrichir les tests unitaires
