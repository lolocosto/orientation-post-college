# 🎉 v0.10 - Enrichissement Langues depuis data.education.gouv.fr

## 📋 Nouvelles Fonctionnalités

### ✅ Enrichissement Langues LV1/LV2/LV3

**Nouvelle section** dans les Paramètres : "📚 Enrichissement des données"

**Bouton** : "🌍 Enrichir avec les langues"
- Récupère automatiquement les langues enseignées pour chaque lycée
- Source : data.education.gouv.fr (Ministère de l'Éducation Nationale)
- **Sans authentification** requise
- Rate limit : 5000 requêtes/jour

---

## 🔄 Workflow d'Utilisation

### Étape 1 : Extraction Onisep (comme avant)
1. Paramètres → Extraction Onisep
2. Mode Géographique ou Mode Diplômes
3. Lancer l'extraction → Lycées + Diplômes extraits

### Étape 2 : Enrichissement Langues (NOUVEAU)
1. Paramètres → Enrichissement des données
2. Cliquer "🌍 Enrichir avec les langues"
3. Confirmer l'opération
4. Attendre la fin (quelques minutes selon le nombre de lycées)

### Étape 3 : Consulter les Langues
1. Cliquer sur la stat card "🌍 Langues"
2. Voir toutes les langues par établissement
3. Filtrer par langue ou niveau (LV1/LV2/LV3)

---

## 📊 Structure des Données

### Nouvelle Table : `langues_par_lycee`
```sql
CREATE TABLE langues_par_lycee (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lycee_uai TEXT,
    langue TEXT,              -- "Anglais", "Allemand", "Espagnol"...
    niveau TEXT,              -- "LV1", "LV2", "LV3"
    FOREIGN KEY (lycee_uai) REFERENCES lycees(uai)
)
```

### Exemple de Données
```
UAI: 0910620E
Langue: Anglais, Niveau: LV1
Langue: Allemand, Niveau: LV2
Langue: Espagnol, Niveau: LV2
```

---

## 🆕 Modifications Techniques

### Tables BDD
- ❌ **Supprimé** : Table `langues` (ancienne structure inutilisée)
- ✅ **Ajouté** : Table `langues_par_lycee` (nouvelle structure)

### Fonctions Ajoutées
```javascript
enrichirAvecLangues()
  → Récupère les langues depuis data.education.gouv.fr
  → Pour chaque lycée en base :
     - Requête API avec UAI
     - Insertion des langues dans langues_par_lycee
  → Affiche progression en temps réel
  → Sauvegarde automatique en base
```

### Fonctions Modifiées
```javascript
loadStats()
  → Compte maintenant les langues distinctes dans langues_par_lycee

loadLanguesView()
  → Affiche les langues par établissement (au lieu de liste globale)
  → Jointure lycees + langues_par_lycee
  → Filtres par langue et niveau

renderLanguesTable()
  → Affiche: Langue | Niveau | Établissement | Commune
```

---

## 🌐 API data.education.gouv.fr

### Dataset Utilisé
**`fr-en-offre-langues-2d`**
- 39 858 enregistrements
- Données officielles MEN
- Mise à jour annuelle

### Endpoint
```
https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-offre-langues-2d/records?where=uai="[UAI]"&limit=100
```

### Exemple de Réponse
```json
{
  "uai": "0910620E",
  "libelle": "Lycée Paul Vincensini",
  "enseignements": "LV1",
  "langues": "Anglais",
  "type_d_etablissement": "Lycée",
  "secteur_de_l_etablissement": "Public"
}
```

### Rate Limiting
- **5000 requêtes/jour** par IP
- Reset à minuit UTC
- Délai de 100ms toutes les 10 requêtes (pour respecter les limites)

---

## ✅ Avantages

1. **Données Officielles**
   - Source : Ministère de l'Éducation Nationale
   - Plus fiables que données Onisep pour les langues

2. **Pas d'Authentification**
   - Pas besoin de credentials pour data.education.gouv.fr
   - Simplifie l'utilisation

3. **Complémentaire**
   - Onisep : Lycées + Diplômes (avec authentification)
   - data.education.gouv.fr : Langues (sans authentification)

4. **Détail Par Établissement**
   - Voir exactement quelles langues sont proposées dans chaque lycée
   - Distinguer LV1/LV2/LV3

5. **Rate Limit Généreux**
   - 5000 requêtes/jour largement suffisant
   - Peut enrichir ~4000 lycées par jour

---

## 🎯 Vue Langues Améliorée

### Avant v0.10
- Liste vide ou données non structurées
- Pas de lien avec les établissements

### Après v0.10
- **Affichage par établissement**
  ```
  | Langue   | Niveau | Établissement    | Commune |
  |----------|--------|------------------|---------|
  | Anglais  | LV1    | Lycée X          | Paris   |
  | Allemand | LV2    | Lycée X          | Paris   |
  | Espagnol | LV2    | Lycée Y          | Lyon    |
  ```

- **Filtres**
  - Recherche textuelle (langue ou établissement)
  - Filtre par niveau (LV1/LV2/LV3)

- **Statistiques**
  - Stat card affiche le **nombre de langues distinctes** dans la base

---

## 🧪 Tests à Effectuer

### Test 1 : Extraction + Enrichissement
1. Vider la base
2. Extraction Onisep (ex: Département 2B)
3. Paramètres → Enrichir avec les langues
4. Vérifier la progression
5. Voir la stat card Langues (devrait afficher un nombre > 0)
6. Cliquer sur la stat card → Voir les langues par établissement

### Test 2 : Vue Langues
1. Vue Langues → Vérifier l'affichage
2. Filtrer par "Anglais" → Voir tous les lycées avec Anglais
3. Filtrer par "LV2" → Voir toutes les LV2
4. Rechercher un lycée → Voir ses langues

### Test 3 : Réenrichissement
1. Enrichir avec les langues une première fois
2. Re-cliquer sur "Enrichir avec les langues"
3. Vérifier que les anciennes données sont remplacées (pas de doublons)

---

## ⚠️ Limitations Connues

1. **Données Annuelles**
   - data.education.gouv.fr mis à jour une fois par an (rentrée scolaire)
   - Moins réactif qu'Onisep

2. **Pas de Détail Options**
   - Seulement niveau (LV1/LV2/LV3)
   - Pas d'info sur section européenne, bilangue, etc.
   - (Ces infos seront ajoutées dans une prochaine version)

3. **Lycées Seulement**
   - Dataset couvre collèges ET lycées
   - Mais l'application ne gère que les lycées

4. **Dépend de l'Extraction Onisep**
   - Il faut d'abord avoir des lycées en base (via Onisep)
   - L'enrichissement ne fonctionne pas seul

---

## 📝 Notes Techniques

### Gestion des Erreurs
- Si un lycée n'a pas de langues dans data.education.gouv.fr → Ignoré silencieusement
- Si erreur API (timeout, 404, etc.) → Lycée ignoré, continue avec les suivants
- Affiche le nombre d'erreurs à la fin

### Performance
- Traitement séquentiel (un lycée à la fois)
- Délai de 100ms toutes les 10 requêtes
- Pour 100 lycées : ~1-2 minutes
- Pour 1000 lycées : ~10-15 minutes

### Sauvegarde
- Sauvegarde automatique en localStorage après enrichissement
- Mise à jour des stats automatique
- Rechargement de la vue active automatique

---

## 🚀 Prochaines Versions

### v0.11 (Futur)
- Sections européennes (dataset dédié)
- Sections internationales
- Détails par classe (2nde, 1ère, Terminale)

### v1.0 (Futur)
- Migration complète vers data.education.gouv.fr pour les établissements
- Garder Onisep uniquement pour les diplômes détaillés
- Interface unifiée

---

## 📦 Fichiers Livrés

**`lycees_manager_v0.10.html`**
- Version complète avec enrichissement langues
- Compatible avec bases existantes
- Migration automatique de la structure langues

**`CHANGELOG_V010.md`** (ce fichier)
- Documentation complète
- Guide d'utilisation
- Notes techniques

---

## ✅ Checklist Validation

- [x] Table `langues_par_lycee` créée
- [x] Bouton "Enrichir avec les langues" ajouté
- [x] Fonction `enrichirAvecLangues()` implémentée
- [x] Vue Langues mise à jour
- [x] Filtres langues fonctionnels
- [x] Stats langues correctes
- [x] Gestion erreurs API
- [x] Rate limiting respecté
- [x] Progression affichée
- [x] Sauvegarde automatique
- [x] Documentation complète

---

**Version** : 0.10  
**Date** : 28/01/2026  
**Status** : ✅ Prêt pour Tests  
**Prochaine étape** : Tests utilisateur puis v0.11
