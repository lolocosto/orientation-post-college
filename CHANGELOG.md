# Changelog — Parcours Avenir (Orientation Post-Collège)

> Toutes les modifications notables de ce projet sont documentées dans ce fichier.
> Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

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
