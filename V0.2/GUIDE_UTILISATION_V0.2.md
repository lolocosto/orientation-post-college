# 🎓 Gestionnaire Lycées v2.0 - Guide d'Utilisation

## 📋 Vue d'Ensemble

L'interface HTML v2.0 permet de :
- ✅ **Extraire automatiquement** les données depuis l'API Onisep
- ✅ **Gérer la base de données** SQLite directement dans le navigateur
- ✅ **Visualiser** les lycées, diplômes, formations
- ✅ **Exporter/Importer** la base de données
- ✅ **Générer** le document d'orientation (à venir)

---

## 🚀 Démarrage Rapide

### 1. Ouvrir l'Interface

Ouvrez simplement le fichier `lycees_manager_v2.html` dans votre navigateur web :
- **Chrome** (recommandé)
- **Firefox**
- **Edge**
- **Safari**

### 2. Première Utilisation

Au premier lancement :
1. Une base de données vide est créée automatiquement
2. Cliquez sur **"🌐 Rafraîchir depuis Onisep"**
3. Attendez l'extraction (2-5 minutes)
4. Les données sont chargées et affichées

---

## 🌐 Extraction depuis Onisep

### Fonctionnement

Le bouton **"Rafraîchir depuis Onisep"** lance l'extraction automatique :

1. **Recherche des lycées** (5 communes)
   - Rennes
   - Cesson-Sévigné
   - Bruz
   - Le Rheu
   - Saint-Grégoire

2. **Extraction des données** pour chaque lycée
   - Actions de formation
   - Diplômes préparés
   - Langues enseignées (LV1, LV2, LV3)
   - Coordonnées et contact

3. **Mise à jour de la base**
   - Insertion dans SQLite
   - Sauvegarde automatique

### Barre de Progression

Pendant l'extraction, une fenêtre affiche :
- **% de progression** (barre visuelle)
- **Message** (étape en cours)
- **Détails** (lycée en cours de traitement)

### Durée Estimée

- **31 lycées** : ~3-5 minutes
- **Dépend de** : connexion internet, charge serveur Onisep

### Limites API

⚠️ **Quota journalier** :
- **Anonyme** : 200 requêtes/jour
- **Authentifié** : 5000 requêtes/jour

Pour Rennes Métropole (31 lycées) :
- ~65-100 requêtes nécessaires
- ✅ Possible 2-3 fois par jour (anonyme)

---

## 📊 Statistiques Affichées

En haut de page, 4 statistiques :

1. **Lycées** : Nombre total d'établissements
2. **Diplômes** : CAP, Bac, BTS, etc.
3. **Formations** : CPGE 1re année, 2de GT, etc.
4. **Dispositifs** : Sections européennes, internats, etc.

Ces chiffres se mettent à jour automatiquement après extraction.

---

## 📚 Liste des Lycées

### Affichage

Tableau avec :
- **Nom** du lycée
- **Type** (GT, Polyvalent, LP)
- **Statut** (Public / Privé)
- **Commune**

### Tri

Par défaut : tri alphabétique par nom

---

## 💾 Gestion de la Base

### Sauvegarde Automatique

La base est **automatiquement sauvegardée** dans le navigateur (localStorage) :
- ✅ Persiste entre les sessions
- ✅ Pas besoin de télécharger à chaque fois
- ⚠️ Effacée si vous videz le cache du navigateur

### Export Manuel

**Bouton "💾 Télécharger la Base"** :
- Télécharge un fichier `.db`
- Format : SQLite standard
- Nom : `lycees_database_2026-01-21.db`
- **Utilité** : Sauvegarde externe, partage, utilisation avec Python

### Import

**Bouton "📥 Importer une Base"** :
- Sélectionnez un fichier `.db`
- Remplace la base actuelle
- **Utilité** : Restaurer une sauvegarde, charger des données d'un collègue

---

## 🔄 Workflow Recommandé

### Mise à Jour Mensuelle

```
1. Ouvrir lycees_manager_v2.html
2. Cliquer "Rafraîchir depuis Onisep"
3. Attendre l'extraction (3-5 min)
4. Vérifier les données
5. Télécharger la base (.db)
6. Générer le document (bouton à venir)
```

### Avant la Rentrée

```
1. Rafraîchir depuis Onisep (données à jour)
2. Vérifier manuellement quelques lycées
3. Télécharger la base (sauvegarde)
4. Générer le document final
5. Distribuer le guide PDF
```

---

## ⚙️ Fonctionnalités Techniques

### Base de Données SQLite

**Tables** :
- `lycees` : Établissements
- `diplomes` : CAP, Bac, BTS, etc.
- `formations` : CPGE 1re année, 2de GT
- `dispositifs` : Sections, internats
- `langues` : LV1, LV2, LV3
- `*_par_lycee` : Tables de relations

**Moteur** : SQL.js (SQLite en JavaScript)

### Stockage

1. **localStorage** (automatique)
   - Limite : ~5-10 MB
   - Persiste entre sessions
   - Effacé si cache vidé

2. **Fichier .db** (manuel)
   - Illimité
   - Sauvegarde externe
   - Compatible Python/SQLite

---

## 🐛 Résolution de Problèmes

### Erreur "Quota dépassé"

**Symptôme** : Message d'erreur lors de l'extraction

**Cause** : Plus de 200 requêtes API aujourd'hui

**Solution** :
- Attendre 24h
- OU s'authentifier sur opendata.onisep.fr (5000 req/jour)

### Extraction très lente

**Cause** : Connexion internet lente, serveur Onisep chargé

**Solution** :
- Patienter
- Réessayer plus tard

### Base vide après rafraîchissement

**Cause** : Erreur réseau pendant l'extraction

**Solution** :
1. Vérifier la connexion internet
2. Ouvrir la console navigateur (F12)
3. Relancer l'extraction

### localStorage plein

**Symptôme** : Base non sauvegardée automatiquement

**Solution** :
1. Télécharger la base (.db)
2. Vider le cache du navigateur
3. Réimporter le fichier .db

---

## 🔐 Sécurité et Confidentialité

### Données Locales

- ✅ Tout fonctionne **en local** dans le navigateur
- ✅ Aucune donnée envoyée à un serveur tiers
- ✅ Seules les requêtes vont vers l'API Onisep (publique)

### API Onisep

- ✅ API publique et officielle
- ✅ Données Open Data (licence ODBL)
- ✅ Pas d'authentification requise (mode anonyme)

---

## 📱 Compatibilité Navigateurs

### Recommandé

✅ **Chrome/Chromium** (88+)
✅ **Firefox** (78+)
✅ **Edge** (88+)

### Limité

⚠️ **Safari** (14+)
- Peut avoir des problèmes avec localStorage
- Préférer Chrome/Firefox

### Non Supporté

❌ Internet Explorer (obsolète)

---

## 🔮 Fonctionnalités À Venir

### v2.1 (Prochaine)

- [ ] Génération du document ODT depuis l'interface
- [ ] Filtrage par commune/type
- [ ] Recherche lycées
- [ ] Édition manuelle des données

### v2.2 (Future)

- [ ] Export CSV/Excel
- [ ] Graphiques et visualisations
- [ ] Comparaison entre lycées
- [ ] Historique des mises à jour

---

## 💡 Astuces

### Raccourci pour Tout Rafraîchir

```
1. Rafraîchir depuis Onisep
2. Attendre la fin
3. Télécharger la base
4. Générer le document
```

### Sauvegardes Multiples

Téléchargez régulièrement :
- `lycees_database_2026-01.db` (janvier)
- `lycees_database_2026-02.db` (février)
- etc.

### Partage avec Collègues

1. Télécharger votre base (.db)
2. Envoyer le fichier par email
3. Le collègue clique "Importer" dans son navigateur

---

## 📞 Support

### En Cas de Problème

1. **Console du navigateur** (F12) : Voir les erreurs
2. **Logs** : Messages dans la console
3. **Réinitialisation** : Vider le cache et recommencer

### Contribuer

Si vous trouvez un bug ou avez une suggestion :
- Documentez le problème
- Notez les étapes pour le reproduire
- Partagez avec l'équipe

---

## ✅ Checklist Première Utilisation

- [ ] Ouvrir `lycees_manager_v2.html` dans Chrome/Firefox
- [ ] Cliquer "Rafraîchir depuis Onisep"
- [ ] Attendre l'extraction (3-5 min)
- [ ] Vérifier les statistiques (31 lycées attendus)
- [ ] Télécharger la base (.db) en sauvegarde
- [ ] Tester l'import/export
- [ ] 🎉 C'est prêt !

---

**Version** : 2.0
**Date** : 21 janvier 2026
**Fichier** : lycees_manager_v2.html
**Auteur** : Assistant Claude
**Licence** : Usage interne / ODBL (données Onisep)
