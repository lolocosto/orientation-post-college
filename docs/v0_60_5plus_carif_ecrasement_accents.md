# v0.60 — Correction de l'écrasement des formations scolaires 5+ et accents communes

## Résumé

La v0.60 corrige trois bugs majeurs :
1. **Les formations scolaires niveau 5+ (CPGE, BTS scolaires) disparaissaient** quand l'extraction CARIF-OREF était lancée après l'extraction Onisep
2. **Les communes avec accents étaient dédupliquées incorrectement** (ex: "Cesson-Sévigné" vs "Cesson-Sevigne")
3. **Les formations `action_sup` n'étaient pas collectées** par le parser Onisep (manque `enrichissements_etab`)

---

## Bug 1 : Écrasement des formations 5+ par l'extraction CARIF

### Symptôme
- Extraction scolaire seule → 263 formations 5+ visibles (CPGE, BTS scolaires…)
- Extraction scolaire + apprentissage → **0 formations 5+** dans les fiches établissement

### Cause racine
`clearAprentissageData()` dans `database_service.js` (ligne 1481) exécutait :
```javascript
this.#storage.autres_formations_par_etablissement = {};
```
Cette ligne effaçait **toute** la table `autres_formations_par_etablissement`, y compris les formations Onisep (source='onisep') insérées lors de l'extraction scolaire.

### Chaîne causale complète
1. Extraction Onisep → `#collecterAutresDiplomesScolaires` → `insertAutresFormationsParEtablissement()` → 263 formations 5+ stockées avec `source: 'onisep'`
2. Extraction CARIF démarre → `#resetAprentissageData()` → `clearAprentissageData()` → **vide toute la table** 💥
3. CARIF `#extractAutresFormationsNiveau5Plus` → ne remet que les formations apprentissage (`source: 'carif'`)
4. Les formations scolaires 5+ sont définitivement perdues

### Correction
Nouvelle méthode privée `#purgeAutresFormationsCarif()` qui filtre par `source` :
- Supprime uniquement les formations avec `source === 'carif'`
- Préserve celles avec `source === 'onisep'` (ou sans source)
- Nettoie les entrées devenues vides

**Fichier modifié** : `js/database_service.js`
- `clearAprentissageData()` → appelle `#purgeAutresFormationsCarif()` au lieu de vider la table
- `clearCARIFData()` → même correction
- `clearAllData()` et `clearOnisepData()` → inchangés (vidage total légitime)

### Données API action_lycee (Chateaubriand 0350710G)
Le dataset `action_lycee` (605340ddc19a9) ne retourne que 3 résultats pour cet établissement :
- classe de 2de GT (niveau: seconde)
- bac général (niveau: bac ou équivalent)
- classe de 1re générale (niveau: 1re)

→ **Aucune CPGE/BTS** : ces formations proviennent exclusivement du dataset `action_sup` (605344579a7d7).

---

## Bug 2 : Dédoublonnement communes avec/sans accents

### Symptôme
"Cesson-Sévigné" (Onisep) et "Cesson-Sevigne" (CARIF) stockées comme deux communes distinctes.

### Correction
- Nouvelle fonction `preferAccentedCommune(a, b)` dans `utils.js` — compare le nombre de diacritiques via NFD
- `updateEtablissement()` dans `database_service.js` — applique cette préférence lors de la fusion

---

## Bug 3 : parseActionsSup manquait enrichissements_etab

### Symptôme
Les établissements avec uniquement des formations 5+ n'étaient pas créés car `parseActionsSup` ne collectait pas les données d'enrichissement.

### Correction
- `onisep_parser.js` : `parseActionsSup` retourne maintenant `enrichissements_etab`
- `onisep_extraction_controller.js` : rawData transmet `actionsLycee` et `actionsSup` correctement
- Protection `null` sur `niveauSortie` dans `#buildDiplomesValidesArray`
- Création d'établissements minimaux pour les formations sup-only (étape 3bis)
- Ré-enrichissement des établissements créés (étape 3bis-b)

---

## Fichiers modifiés

| Fichier | Modifications |
|---------|--------------|
| `js/database_service.js` | `clearAprentissageData()`, `clearCARIFData()` → purge sélective ; `#purgeAutresFormationsCarif()` ajoutée ; `updateEtablissement()` → accent communes ; commentaires corrigés |
| `js/onisep_parser.js` | `parseActionsSup` → collecte `enrichissements_etab` |
| `js/onisep_extraction_controller.js` | rawData structure, protection null, création étab minimaux, ré-enrichissement |
| `js/utils.js` | `preferAccentedCommune()` ajoutée |

## Tests

**Fichier** : `tests/15_unit_v060_5plus_carif_ecrasement.test.js` — 22 tests

| Suite | Tests | Description |
|-------|-------|-------------|
| Reproduction du bug | 2 | Prouve l'écrasement AVANT fix |
| Correction v0.60 | 4 | Vérifie la préservation APRÈS fix |
| Scénario complet | 2 | Onisep → CARIF → re-CARIF |
| Cas limites purge | 4 | Table vide, non-tableau, sans source |
| action_lycee | 3 | Données API, filtre, protection null |
| preferAccentedCommune | 6 | Accents, null, cas identiques |
| parseActionsSup | 1 | enrichissements_etab présent |
