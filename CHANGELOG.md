# Changelog — Parcours Avenir (Orientation Post-Collège)

> Toutes les modifications notables de ce projet sont documentées dans ce fichier.
> Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

---

## [0.66] — 2026-03-03

### Modifié — Réorganisation CSS (non-régression validée)
- **Commentaires CSS corrigés** : 9 fichiers modules avaient des `*/` orphelins (sans `/*` ouvrant), provoquant des erreurs de parsing — tous corrigés
- **Doublons fusionnés** : les corrections de contraste v0.56 (`.setting-help`, `.mode-help`, `.about-text`, `.selection-epci`, `.fiche-modal__titre`, `.settings-header h2`) sont intégrées directement dans les modules sources au lieu d'être des redéfinitions en fin de fichier
- **`.detail-header-action--star-active`** : doublon supprimé dans `03-composants-ui.css`, valeur corrigée (`#f59e0b`) conservée dans `04-fiches-detail.css`
- **`.driver-popover...progress-text`** : correction contraste (`#64748b`) intégrée dans `11-tour-guide.css`
- **Bloc v0.56 corrections** retiré de `05-favoris.css` (devenu inutile après intégration dans les modules sources)
- **`main.css` supprimé** : son contenu (`.link-icon`, `.resultat-table tbody tr[onclick]`) était déjà intégré dans `03-composants-ui.css`
- **`design-system.css` régénéré** par concaténation des 15 modules dans l'ordre 01→15
- **`index.html`** : chargement CSS modulaire (15 `<link>` vers `css/modules/*.css` au lieu d'un seul `design-system.css`)

### Tests de non-régression
- Script Python `tests/fc.py` : parseur CSS complet avec normalisation des propriétés
- 783 règles dans la référence, 782 dans les modules (1 sélecteur groupé v0.56 remplacé par des définitions individuelles)
- 775 règles strictement identiques, 7 améliorées (fusion correcte des doublons)
- 0 règle manquante fonctionnellement

---

## [0.64] — 2026-03-02

### Simplifié (UX non-techniciens)
- **Favori** : plus de champ nom — le nom est auto-généré depuis les critères de recherche. Libellé « Sauvegarder les critères de recherche »
- **Dataset** : plus de champ nom — auto-généré. Libellé « Sauvegarder les données extraites ». Vérification d'accès GitHub à la coche (modale d'alerte si KO + décochage)
- **Plus d'export JSON local** : les données sont sauvegardées uniquement sur GitHub
- **Connexion Onisep automatique** : si login/mdp/appId présents, connexion tentée au démarrage (plus de case « Connexion automatique »). Identifiants sauvegardés uniquement après connexion réussie (plus de bouton « Enregistrer les identifiants »)
- **Modale de choix** : affichée uniquement si la connexion Onisep n'est pas active au démarrage. Plus de case « Ne plus afficher »
- **Périmètre de recherche géo** : encadré bleu pâle, boutons taille ajustée au libellé
- **Voies de formation** : bloc remonté juste après le périmètre, avant favori/dataset
- **Réorganisation Paramètres** :
  - « Paramètres de sauvegarde distante » : juste sous « Connexion Onisep », coche verte ✅ si clé validée, owner/repo en lecture seule, bouton unique « Sauvegarder » (teste + persiste ou modale d'alerte)
  - « Données distantes sauvegardées » : liste GitHub avec badge compteur, plus d'export/import local
- **Modale d'alerte** : nouvelle fonction `showModalAlert()` pour les messages importants avec acquittement

### Corrigé
- Bug `loadSettings` : crash `settings-auto-connect` supprimé du HTML mais encore référencé en JS
- Badge favoris : comptabilise maintenant tous les types (recherche + établissements + divers)
- Vidage base : efface aussi les favoris établissements et divers (garde les favoris de recherche)

### Modifié
- `index.html` — formulaires géo + diplômes simplifiés, sections Paramètres refondues, section Connexion simplifiée
- `js/gestion_params.js` — `saveAndTestGitHubToken()`, `refreshGitHubDatasets()` avec badge compteur, `connectFromSettings()` sauvegarde auto des identifiants
- `js/gestion_onglet_recherche.js` — `_trySaveFavorite()` et `_trySaveDataset()` avec noms auto-générés, upload GitHub uniquement
- `js/mode_choice_modal.js` — suppression skip checkbox et logique associée
- `js/utils.js` — auto-connect synchrone, modale conditionnelle, `showModalAlert()`, version 0.64

---

## [0.63] — 2026-03-02

### Ajouté
- **Stockage GitHub des jeux de données** (`GitHubStorage`) : service complet pour lister, charger, publier et supprimer des datasets hébergés sur un dépôt GitHub dédié (par défaut : `lolocosto/parcours-avenir-datasets`)
- **Configuration GitHub dans Paramètres** : champs propriétaire/dépôt/token, boutons de test de connexion et d'écriture
- **Liste des datasets GitHub** dans le pane Paramètres (actualisation à la demande) et dans l'écran 3 de la modale de choix (chargement automatique)
- **Publication automatique sur GitHub** lors de l'export post-extraction si un token est configuré (avec fallback gracieux si l'upload échoue)
- Encodage/décodage base64 UTF-8 robuste pour les caractères accentués (noms de lieux français)
- Gestion de l'index distant (`index.json` dans le dépôt) avec tri chronologique et mise à jour atomique
- Tests de connexion (lecture) et d'écriture (création + suppression fichier temporaire)

### Nouveaux fichiers
- `js/github_storage.js` — Service de stockage GitHub
- `docs/v0_63_github_storage.md` — Documentation technique

### Modifié
- `index.html` — Script `github_storage.js`, section GitHub dans le pane datasets, cache-busters v0.63
- `js/gestion_params.js` — 7 nouvelles fonctions GitHub (config, test, liste, chargement, suppression), chargement config à l'ouverture de la section
- `js/mode_choice_modal.js` — Écran 3 enrichi avec la liste GitHub (chargement asynchrone), méthodes `#loadGitHubList()` et `#onGitHubDatasetSelected()`
- `js/gestion_onglet_recherche.js` — `_trySaveDataset()` publie aussi sur GitHub si un token est configuré
- `js/utils.js` — Version 0.63

---

## [0.62] — 2026-03-02

### Ajouté
- **Modale de choix de mode** : à l'ouverture (après le tour guidé), l'utilisateur choisit entre mode connecté (compte Onisep) et mode déconnecté (exploration de données pré-extraites)
- **Système de jeux de données** (`DatasetService`) : export/import de snapshots complets de la base au format JSON, incluant données éducatives + métadonnées de recherche (type, paramètres, date, statistiques)
- **Export post-extraction** : checkbox « Sauvegarder comme jeu de données » dans les formulaires de recherche géographique et par diplôme
- **Section « Jeux de données » dans Paramètres** : liste des jeux indexés, import de fichiers JSON, option pour réafficher la modale de choix au démarrage
- **Métadonnées d'extraction** (`setLastExtractionMetadata`/`getLastExtractionMetadata`) : la dernière recherche est tracée pour informer l'utilisateur en mode déconnecté
- **Extensions de `DatabaseService`** : `getStorageSnapshot()`, `loadStorageSnapshot()`, `hasEducationalData()`, `getEducationalTableNames()`
- Événement `tour:completed` émis par le tour guidé pour chaîner avec la modale de choix
- 23+ tests unitaires et fonctionnels spécifiques (fichier 19)

### Nouveaux fichiers
- `js/dataset_service.js` — Service de gestion des jeux de données
- `js/mode_choice_modal.js` — Modale de choix du mode connecté/déconnecté
- `docs/v0_62_phase1_dataset_service.md` — Documentation technique Phase 1
- `docs/v0_62_phase2_mode_choice_modal.md` — Documentation technique Phase 2
- `docs/v0_62_phases3a6_export_params_finalisation.md` — Documentation technique Phases 3-6

### Modifié
- `js/database_service.js` — 5 nouvelles méthodes pour le snapshot et les métadonnées
- `js/utils.js` — Étape 10 dans init() pour la modale de choix, version 0.62
- `js/tour_guide.js` — Événement `tour:completed` dans `onDestroyStarted`
- `js/gestion_onglet_recherche.js` — Capture des métadonnées d'extraction, export de jeux de données
- `js/gestion_params.js` — Section « Jeux de données », badge compteur, fonctions CRUD
- `css/design-system.css` — Styles de la modale de choix (responsive complet)
- `index.html` — Scripts, UI dataset export, pane Paramètres datasets

---

## [0.60] — 2026-02-28

### Corrigé
- Les formations scolaires niveau 5+ (CPGE, BTS scolaires) disparaissaient quand l'extraction CARIF-OREF était lancée après Onisep
- Purge sélective par source (`carif`/`onisep`) dans `clearAprentissageData()` — nouvelle méthode `#purgeAutresFormationsCarif()`
- Communes avec/sans accents dédupliquées correctement (`preferAccentedCommune()`)
- `parseActionsSup` collecte désormais les `enrichissements_etab`

### Ajouté
- Création d'établissements minimaux pour les formations sup-only (étape 3bis)
- 22 tests unitaires spécifiques (fichier 15)

### Documentation technique
- `docs/v0_60_5plus_carif_ecrasement_accents.md`

---

## [0.59] — 2026-02-27

### Refondu — Refonte complète en 5 phases
- **Phase 1** : `database_service.js` — service de stockage « bête » sans décision métier
- **Phase 2** : `onisep_parser.js` — séparation parsing/décisions métier
- **Phase 3** : `onisep_extraction_controller.js` — orchestration correcte
- **Phase 4** : `carif_oref_extraction_controller.js` — alignement architecture
- **Phase 5** : nettoyage des fallbacks `_id || uai` dans les vues et l'export

### Documentation technique
- `docs/v0.59_phase1_database_service.md` à `docs/v0.59_phase5_vues_fallbacks.md`

---

## [0.58] — 2026-02-27

### Ajouté
- ID internes numériques séquentiels (`etab_1`, `etab_2`…) pour gérer les UAI partagés
- Unicité testée sur combinaison UAI+nom (pas UAI seul)
- Déduplication des communes insensible aux accents (`_communeDeduplicationKey`)

### Corrigé
- Triple nom (enseigne/raison_sociale/nom) correctement fusionné
- Double libellé diplôme apprentissage éliminé

### Documentation technique
- `docs/v0_58_id_interne_unicite_dedup.md`

---

## [0.57] — 2026-02-26

### Ajouté
- Filtres multi-sélection sur la carte (type, statut, commune, voie)
- Normalisation casse des communes en Title Case (`normaliserNomCommune`)
- Normalisation des libellés de diplômes CARIF-OREF (`normaliserLibelleDiplome`)

### Corrigé
- Boutons popup carte et titres tour guidé illisibles (conflit CSS Leaflet/driver.js)

### Documentation technique
- `docs/v0_57_casse_multiselect_css.md`

---

## [0.56] — 2026-02-26

### Ajouté
- Sauvegarde/restauration chiffrée des préférences (AES-256-GCM via Web Crypto API)
- Marqueur domicile sur la carte avec icône distincte
- Filtres dynamiques sur la carte (type établissement, statut)

### Corrigé
- Contrastes texte/fond insuffisants (tour-hint, setting-help, mode-help…) — conformité WCAG AA
- Sections détails établissement : niveaux de formation affichés correctement

### Documentation technique
- `docs/v0_56_contraste_prefs_carte_details.md`

---

## [0.55] — 2026-02-25

### Ajouté
- Section « Autres formations » (niveau 5+) dans les fiches établissement
- Enrichissement des données enseignements (ens_*) pour les établissements

### Corrigé
- Durées de formation codées en dur (l'API ONISEP renvoie la durée du dernier cycle, pas du parcours)

### Amélioré
- Informations générales présentées en liste au lieu de grille 2 colonnes

### Documentation technique
- `docs/v0_55_corrections_durees_infos_enrichissement.md`

---

## [0.54] — 2026-02-25

### Ajouté
- Section « Parcours de formation » dans les fiches diplômes scolaires
- Durée du cycle affichée dans les fiches

### Amélioré
- Toutes les sections repliées par défaut dans les modales de détail

### Documentation technique
- `docs/v0_54_parcours_duree.md`

---

## [0.53.1] — 2026-02-24

### Corrigé
- Filtres inopérants sur téléphone (cartes mobiles non filtrées)
- Éléments cliquables non homogènes dans les résultats
- Favori recherche jamais sauvegardé

### Amélioré
- Blocs de compétences lisibles dans les fiches
- Parcours bac pro harmonisé

### Documentation technique
- `docs/v0_53_1_correctifs.md`

---

## [0.52] — 2026-02-23

### Corrigé
- Bouton « Voir la fiche » toujours large dans les cartes favoris (spécificité CSS renforcée)
- Suppression d'un favori bien reflétée dans le panneau
- Filtre textuel robuste sur les accents (« theatre » trouve « Théâtre »)
- Rang et taille de liste dans l'en-tête des modales corrects après filtrage

---

## [0.51] — 2026-02-23

### Ajouté
- Favoris pour toutes les catégories (diplômes scolaires, diplômes apprentissage, dispositifs, options 2nde GT)
- Panneau Favoris structuré en 6 sections distinctes

### Corrigé
- Rang N/Total dans les modales reflète la liste filtrée
- Filtre textuel fonctionnel sur les Options 2nde GT
- Bouton « Voir la fiche » toujours large dans les cartes favoris

### Amélioré
- Padding réduit dans les sections accordéon des fiches détail

### Supprimé
- Bouton « Purger données CARIF » (zone danger simplifiée)

---

## [0.50] — 2026-02-23

### Ajouté
- Bouton étoile ☆ dans l'en-tête de toutes les modales de détail
- Favoris établissements (max 20) dans les préférences

### Corrigé
- Structure d'en-tête unifiée entre tous les types de modale
- Navigation Précédent/Suivant et guard anti-double ouverture

---

## [0.45] — 2026-02

### Ajouté
- Responsive complet (ordinateur, tablette, téléphone)
- Séparation des responsabilités entre modules

---

## [0.44] — 2026-02-22

### Ajouté
- Panneau de paramètres redessiné — navigation menu/section avec glissement latéral
- Indicateurs de statut dans le menu (connexion Onisep, nb favoris, préférences)
- Tour guidé de première utilisation (driver.js) — 8 étapes
- Entrée « 🚀 Tour guidé » dans les paramètres
- JSDoc complet sur l'ensemble du codebase (474 JSDoc)

---

## [0.43] — 2026-02-21

### Ajouté
- « Mon domicile » dans les paramètres (géocodage Nominatim/OSM)
- Bouton « 🗺️ Itinéraire » dans popup carte et fiche détail
- Modale itinéraire : choix départ (domicile/établissement) + mode transport
- Ouverture Google Maps sans clé API, compatible mobile

### Corrigé
- Sélecteur voie supprimé en phase 2 recherche par diplôme

### Performance
- `localStorage.setItem` réduit de ~116 000 à ~14 appels par extraction (×8 000)

---

## [0.42] — 2026-02-21

### Ajouté
- Classe `HttpClient` — retry, rate limiting 429, backoff exponentiel centralisés
- Toutes les APIs délèguent les requêtes HTTP à HttpClient

---

## [0.41] — 2026-02-21

### Ajouté
- Stat-card de la vue active mise en évidence
- Alertes bloquantes converties en modales non-bloquantes
- Chaque entité a un `_id` interne généré

### Corrigé
- Recherche géo sans voie cochée → message explicatif
- Fiches établissements sans UAI accessibles via `_id`

---

## [0.39] — 2026-02-20

### Ajouté
- Champ « contenu » CARIF-OREF en tête de fiche diplôme apprentissage
- Blocs de compétences dans fiche diplôme apprentissage
- Badge croisé « Également accessible par voie scolaire/apprentissage »
- Enrichissement type/statut des CFA via requête ONISEP

### Corrigé
- Bouton « Vider la base locale » (modale de confirmation manquante)
- Nouvelle extraction vide la base précédente

---

## [0.38] — 2026-02-20

### Ajouté
- Filtre niveaux 3/4 à l'extraction
- Multi-select filtres limité à 4 items visibles

### Corrigé
- Bouton « Réinitialiser » sécurisé pour toutes les vues
- Affichage parasite dans la section boutons recherche géo
- Libellés techniques supprimés

---

## [0.37] — 2026-02-20

### Ajouté
- Vue « Diplômes apprentissage » (CARIF-OREF) avec tableau dédié
- Modale détail diplôme apprentissage
- Navigation ←/→ dans la liste depuis la modale
- Fiche établissement : sections scolaire et apprentissage séparées

---

## [0.36] — 2026-02-20 — Refactoring architecture CARIF-OREF

## [0.32.1] — 2026-02-18 — Recherche par Options 2nde GT

## [0.31] — 2026-02-17 — Export enrichi et UX

## [0.30] — 2026-02-17 — Navigation et Export

## [0.29] — 2026-02-17 — Migration CSS complète (design-system.css)

## [0.18.4] — 2026-01-31 — Enseignements GT et Parcours Pro

## [0.16] — 2026-01-30 — Version de référence (interface 4 onglets)

## [0.15] — Carte interactive Leaflet

## [0.14] — Système de favoris et import/export

## [0.13] — Refonte interface, 3 onglets

## [0.1–0.12] — Versions initiales (connexion API Onisep, extraction géo, SQLite)
