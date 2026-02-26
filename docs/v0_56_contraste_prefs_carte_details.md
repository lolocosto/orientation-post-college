# v0.56 — Contraste, préférences chiffrées, marqueur domicile, filtres carte, corrections détails

## Date : 2026-02-26

## Résumé des changements

### 1. Corrections de contraste texte ↔ fond
**Problème** : certains styles sur fond clair (blanc, gris clair) avaient une police trop claire, et inversement.

**Corrections appliquées** :
- `.tour-hint` : `color: var(--text-muted)` (#95a5a6) → `color: #334155` (contraste WCAG AA sur fond #f0f4ff)
- `.setting-help` : `color: var(--text-light)` (#7f8c8d) → `color: #475569`
- `.mode-help` : idem
- `.selection-epci` : idem
- `.about-text` : idem
- `.fiche-modal__titre`, `.settings-header h2` : `color: white` explicite (fond gradient foncé)
- `.driver-popover-progress-text` : `color: #64748b` (lisible)

**Principe** : fond clair → police ≤ #475569 ; fond foncé → police blanche.

### 2. Préférences chiffrées (AES-256-GCM)
**Nouveau fichier** : `js/preferences_crypto_service.js`

**Architecture** :
- Chiffrement AES-256-GCM via Web Crypto API native
- Clé dérivée de PBKDF2 (100 000 itérations, SHA-256) à partir d'un secret d'application
- Format de sortie : JSON `{ iv, salt, data }` en base64
- Fichier : `.preferences.enc` (téléchargé/importé)

**Données sauvegardées** :
- `settings_email`, `settings_password`, `settings_app_id` (identifiants Onisep)
- `settings_auto_connect` (connexion automatique)
- `pref_user_uai`, `pref_user_etablissement` (établissement utilisateur)
- `pref_user_domicile` (domicile utilisateur)
- `favoris_etablissements`, `favoris_divers` (favoris)

**API** :
- `PreferencesCryptoService.sauvegarder()` → chiffre + télécharge
- `PreferencesCryptoService.restaurer()` → sélecteur de fichier + déchiffre + restaure
- `PreferencesCryptoService.autoSave()` → sauvegarde chiffrée en localStorage (arrière-plan)

**UI** : boutons dans Paramètres → Préférences → section « 🔐 Sauvegarde chiffrée »

### 3. Marqueur domicile sur la carte
**Nouveau** : `loadHomeMarker()` dans `gestion_onglet_carte.js`

- Lit `pref_user_domicile` (adresse, latitude, longitude)
- Crée un marqueur bleu pulsant avec l'emoji 🏠 (classe `marker-icon-home`)
- Popup affichant l'adresse et les coordonnées
- Tooltip « 🏠 Mon domicile »
- Indicateur dans les statistiques carte (`map-stat-home`)
- Légende mise à jour avec les deux marqueurs spéciaux (établissement + domicile)

### 4. Filtres dynamiques sur la carte
**Nouveaux éléments HTML** : barre de filtres `#map-filters` dans l'onglet Carte.

**Filtres disponibles** :
- Recherche textuelle (nom, normalisation NFD sans accents)
- Type d'établissement (select)
- Statut (public/privé) (select)
- Commune (select)

**Comportement** :
- `populateMapFilters()` peuple les selects depuis `_allMapLycees`
- `applyMapFilters()` montre/cache les marqueurs Leaflet individuellement
- Compteur de résultats filtrés (`map-filters-count`)
- Synchronisation : identiques aux filtres de la vue Établissements de l'onglet Résultats

### 5. Modifications des détails diplômes et établissements

| Modification | Fichier | Détail |
|---|---|---|
| Supprimer durée du cycle des infos générales diplôme scolaire | `gestion_onglet_resultats.js` | `buildDiplomeDetailsHTML` : ligne `Durée du cycle` retirée |
| Supprimer durée de formation dans section établissements du diplôme scolaire | `gestion_onglet_resultats.js` | `buildDiplomeDetailsHTML` : `dureeBadge` retiré |
| Supprimer durée de formation dans section établissements du diplôme apprentissage | `gestion_onglet_resultats.js` | `buildDiplomeApprentissageDetailsHTML` : `dureeBadge` retiré |
| Déplacer email CARIF-OREF vers fiche établissement | `gestion_onglet_resultats.js` | `buildEtablissementDetailsHTML` : lecture de `_getApprentissageRelations()` |
| Ajouter badge statut dans section établissements du diplôme apprentissage | `gestion_onglet_resultats.js` | `buildDiplomeApprentissageDetailsHTML` : `statutBadge` ajouté |

### 6. Nouvelle méthode DatabaseService
- `_getApprentissageRelations()` : expose les relations diplômes-apprentissage ↔ établissements pour permettre à `buildEtablissementDetailsHTML` de récupérer le courriel CARIF-OREF.

## Fichiers modifiés

| Fichier | Nature |
|---|---|
| `css/design-system.css` | Corrections contraste, nouveaux styles (marqueur, filtres, badge, crypto) |
| `index.html` | Filtres carte, légende, stats domicile, boutons crypto, script |
| `js/gestion_onglet_carte.js` | Marqueur domicile, filtres, refactoring marqueurs |
| `js/gestion_onglet_resultats.js` | Suppressions durée, déplacement email, badge statut |
| `js/gestion_params.js` | Auto-sauvegarde crypto, rafraîchissement marqueur domicile |
| `js/database_service.js` | Nouvelle méthode `_getApprentissageRelations()` |
| `js/preferences_crypto_service.js` | **NOUVEAU** — service complet de chiffrement/déchiffrement |
| `tests/12_unit_v056_contraste_prefs_carte.test.js` | **NOUVEAU** — 35 tests (6 suites) |

## Tests
- 35 nouveaux tests dans `12_unit_v056_contraste_prefs_carte.test.js`
- 6 suites : contraste, préférences chiffrées, marqueur domicile, filtres carte, détails diplômes, cas d'usage
- Résultat : **35/35 réussis ✅**
