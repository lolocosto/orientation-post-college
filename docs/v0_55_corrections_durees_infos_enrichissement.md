# v0.55 — Corrections durées, présentation infos générales, enrichissement ens_, section « Autres formations »

## Résumé des changements

### 1. Correction des durées de formation dans le parcours

**Problème identifié :** L'API ONISEP renvoie le champ `af_duree_cycle_standard` qui correspond à la durée du *dernier cycle* d'une formation, pas à la durée totale du parcours après la 3ème :

| Type de diplôme | Durée API | Durée réelle | Explication |
|---|---|---|---|
| Bac général | 1 an | **3 ans** | API = terminale seule |
| Bac technologique | 1 an | **3 ans** | API = terminale seule |
| Bac pro (famille de métiers) | 2 ans | **3 ans** | API = 1ère+terminale, seconde commune non comptée |
| Bac pro (hors famille) | 3 ans | **3 ans** | Correct (seconde spécifique incluse) |
| CAP | 2 ans | **2 ans** | Correct |

**Solution :** Les durées dans la section « Parcours de formation » sont désormais **codées en dur** et ne dépendent plus de l'API. Le format affiché est « X ans après la 3ème » pour être explicite.

**Fichier modifié :** `js/gestion_onglet_resultats.js`
- `generateParcoursFormationHtml()` : durée ignorée pour bac G/T, codée en dur pour tous les cas
- `_generateParcoursProHtml()` : durée codée en dur « 3 ans après la 3ème » (même pour les familles de métiers)

> **Note :** La durée API `dureeCycleStandard` reste affichée dans les sections « Informations générales » des diplômes et dans les badges ⏱ des listes d'établissements, car elle reflète correctement le cycle du diplôme spécifique.

---

### 2. Informations générales : présentation en liste au lieu de grille 2 colonnes

**Problème :** La section « Informations générales » des modales de détail utilisait `detail-info-grid` (CSS grid 2 colonnes) qui ne passait pas correctement sur téléphone — les labels et valeurs se chevauchaient.

**Solution :** Remplacement de `<div class="detail-info-grid">` + `buildInfoRow()` par des `<ul class="detail-list">` + `<li class="detail-item detail-item--info">`, cohérent avec la présentation de toutes les autres sections.

**Sections modifiées :**
- Fiche établissement : « Informations générales » et « Informations complémentaires »
- Fiche diplôme scolaire : « Informations générales »
- Fiche diplôme apprentissage : « Informations générales »

**Fichier modifié :** `js/gestion_onglet_resultats.js`

> **Note :** `buildInfoRow()` et `.detail-info-grid` restent dans le code pour une éventuelle utilisation future, mais ne sont plus appelés par les builders actuels.

---

### 3. Enrichissement des établissements avec les champs ens_ supplémentaires

**Problème :** Seuls 3 champs `ens_` des actions lycée étaient utilisés pour enrichir les établissements (`ens_hebergement`, `ens_site_web`, `ens_accessibilite`). Or, les datasets `actions_lycee` et `dispositifs` contiennent aussi `ens_n_telephone`, `ens_telephone` et `ens_url_et_id_onisep` qui peuvent compléter les données de `structures` quand celles-ci sont vides.

**Solution :** L'enrichissement post-extraction collecte désormais 5 champs au lieu de 3 :

| Champ ens_ | Champ établissement | Source |
|---|---|---|
| `ens_hebergement` | `hebergement` | actions_lycee |
| `ens_site_web` | `siteWeb` | actions_lycee |
| `ens_accessibilite` | `accessibilite` | actions_lycee |
| `ens_n_telephone` / `ens_telephone` | `telephone` | **NOUVEAU** — actions_lycee / dispositifs |
| `ens_url_et_id_onisep` | `urlOnisep` | **NOUVEAU** — actions_lycee / dispositifs |

**Stratégie inchangée :** un champ n'est écrit que si la valeur actuelle est vide (`null`/`undefined`). Les données de `structures` restent prioritaires.

**Fichiers modifiés :**
- `js/onisep_parser.js` : `_parseActionLycee()` — collecte `telephone` et `urlOnisep` dans `enrichissements_etab`
- `js/onisep_extraction_controller.js` : `#enrichirEtablissementsDepuisActions()` — applique les 5 champs

---

### 4. Nouvelle section « Autres formations et diplômes » (niveau 5+)

**Contexte :** L'application extrait les formations de niveau 3 (CAP) et 4 (Bac) pour le périmètre post-collège. Mais certains établissements proposent aussi des formations de niveau supérieur (BTS, CPGE, DN MADE, licence pro…) qui intéressent les familles pour anticiper les poursuites d'études.

**Solution :** Une nouvelle section non cliquable dans la fiche établissement liste ces formations, avec **deux sources complémentaires** :

| Source | Données | Badge affiché |
|---|---|---|
| **ONISEP** (actions_sup) | BTS, CPGE, DN MADE… (voie scolaire) | 🏫 Scolaire |
| **CARIF-OREF** (formations) | BTS, licence pro, master… (voie apprentissage) | 🎓 Appr. |

#### Flux de données ONISEP (voie scolaire) :
1. Après le filtrage `#buildDiplomesValidesArray` qui ne garde que CAP/Bac, une nouvelle étape `#collecterAutresDiplomesScolaires` récupère les diplômes rejetés
2. Ces diplômes sont croisés avec les relations `diplomes_par_etablissement` pour identifier quels UAI les proposent
3. Stockage dans `autres_formations_par_etablissement` avec `source: 'onisep'`

#### Flux de données CARIF-OREF (voie apprentissage) :
1. **API** : `getFormationsNiveau5PlusByUAIs()` — requête `/formations` avec `select` limité à 6 champs (`etablissement_formateur_uai`, `rncp_code`, `intitule_long`, `intitule_court`, `diplome`, `niveau`), filtrage client des niveaux 5+
2. **Stockage** : dans la même table `autres_formations_par_etablissement` (fusion par UAI sans écraser l'existant)

#### Affichage :
- Section accordéon « 🎓 Autres formations et diplômes (N) »
- Items `detail-item--info` (non cliquables)
- Groupés par niveau
- Badge voie (Scolaire / Apprentissage) sur chaque item
- Section repliée par défaut

**Fichiers modifiés :**
- `js/carif_oref_api.js` : `getFormationsNiveau5PlusByUAIs()` (nouvelle méthode, avec `select`)
- `js/carif_oref_extraction_controller.js` : `#extractAutresFormationsNiveau5Plus()` (nouveau) + appel dans les 2 flux
- `js/onisep_extraction_controller.js` : `#collecterAutresDiplomesScolaires()` (nouveau) + appel après étape 1
- `js/database_service.js` : table `autres_formations_par_etablissement` + méthodes CRUD + clear dans toutes les méthodes de reset
- `js/gestion_onglet_resultats.js` : section dans `buildEtablissementDetailsHTML()` avec badges voie

---

### 5. Enrichissement des établissements depuis les formations CARIF-OREF

**Problème :** Le dataset `/formations` de CARIF-OREF contient des champs de contact au niveau formateur (`etablissement_formateur_courriel`, `num_tel`) qui ne sont pas disponibles dans le dataset `/etablissements`.

**Solution :** Le parser `parseEtablissementsDepuisFormations()` extrait désormais :

| Champ formation CARIF | Champ établissement | Description |
|---|---|---|
| `etablissement_formateur_courriel` | `email` | **NOUVEAU** — Adresse email du CFA/formateur |
| `num_tel` | `telephone` | **NOUVEAU** — Téléphone de contact de la formation |

Ces champs sont automatiquement fusionnés lors de l'appel à `fusionnerEtablissementAprentissage()` (stratégie inchangée : n'écrase pas les champs déjà renseignés par ONISEP/structures).

**Fichier modifié :** `js/carif_oref_parser.js` — `parseEtablissementsDepuisFormations()`

---

### 6. Suppression des badges durée dans les listes de diplômes de l'établissement

**Problème :** Les listes de diplômes (scolaires et apprentissage) dans la fiche établissement affichaient un badge ⏱ avec la durée brute de l'API (`dureeCycleStandard` ou `_dureeAnnees`). Cette durée était incohérente avec la durée corrigée affichée dans le parcours de formation du détail diplôme (cf. correctif 1). De plus, aucune durée n'était affichée pour les diplômes apprentissage, créant une disparité visuelle.

**Solution :** Suppression des badges durée dans les deux listes de la fiche établissement. La durée reste visible aux bons endroits :
- Parcours de formation du détail diplôme scolaire (durée hardcodée correcte)
- Badge ⏱ sur les centres de formation dans le détail diplôme apprentissage (durée spécifique relation)
- Informations générales du détail diplôme scolaire (`dureeRelation`)

**Fichier modifié :** `js/gestion_onglet_resultats.js` — `buildEtablissementDetailsHTML()`

---

### 7. Liens externes : site web de l'établissement + fiche ONISEP

**Problème :** Le site web de l'établissement (enrichi via `ens_site_web` des actions ONISEP) était affiché comme un simple texte dans les informations générales, peu visible. Il manquait au même endroit que le bouton « Fiche ONISEP ».

**Solution :** Le site web est déplacé des infos générales vers une nouvelle zone de liens externes en bas de fiche, présentée en boutons côte à côte :

| Bouton | Source | Icône |
|---|---|---|
| 🌐 Site de l'établissement | `ens_site_web` (actions ONISEP) | `btn--secondary` |
| 📖 Fiche ONISEP | `url_et_id_onisep` (structures) ou `onisep_url` (CARIF) | `btn--primary` |

Les URLs sans protocole sont normalisées avec `https://`. La zone `detail-external-links` utilise flexbox avec retour à la ligne sur mobile.

**Fichiers modifiés :**
- `js/gestion_onglet_resultats.js` — `buildEtablissementDetailsHTML()`
- `css/design-system.css` — nouveau style `.detail-external-links`

---

## Fichiers modifiés

| Fichier | Modifications |
|---|---|
| `js/gestion_onglet_resultats.js` | Durées en dur, badges durée supprimés des listes établissement, infos en liste, section Autres formations avec badges voie, liens externes (site web + ONISEP) |
| `js/onisep_parser.js` | Collecte ens_telephone / ens_url_onisep |
| `js/onisep_extraction_controller.js` | Enrichissement étendu (5 champs) + collecte diplômes scolaires 5+ |
| `js/carif_oref_api.js` | Nouvelle méthode getFormationsNiveau5PlusByUAIs (avec select) |
| `js/carif_oref_parser.js` | Enrichissement établissements avec email + téléphone depuis formations |
| `js/carif_oref_extraction_controller.js` | Extraction niveau 5+ apprentissage + méthode privée |
| `js/database_service.js` | Table autres_formations + méthodes + clear dans toutes les méthodes de reset |
| `css/design-system.css` | Style `.detail-external-links` (flexbox, responsive) |
| `tests/11_unit_v055_corrections.test.js` | Tests unitaires v0.55 |

## Tests ajoutés

- **T-DUR55** (9 tests) : Vérification des durées codées en dur pour chaque type de diplôme
- **T-INFO** (4 tests) : Vérification que les infos générales utilisent `detail-list` et non `detail-info-grid`
- **T-ENR** (4 tests) : Vérification de la collecte des champs ens_ supplémentaires (ONISEP)
- **T-AUT** (5 tests) : Section Autres formations (affichage, groupement, badges voie, non-cliquable)
- **T-DB55** (3 tests) : Méthodes DatabaseService pour autres formations
- **T-SCO5** (1 test) : Collecte des diplômes scolaires niveau 5+ depuis actions_sup
- **T-CARIF-ENR** (2 tests) : Enrichissement établissements depuis formations CARIF (email, téléphone)
- **T-DURETAB** (2 tests) : Pas de badge durée dans les listes de diplômes d'un établissement
- **T-LIENS** (5 tests) : Liens externes (site web en bouton, normalisation URL, absence)

**Total : 35 nouveaux tests**
