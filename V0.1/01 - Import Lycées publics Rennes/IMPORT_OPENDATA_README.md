# 📊 Import des Données Open Data - Lycées Publics de Rennes

## ✅ Ce qui a été fait

### 1. Identification des sources Open Data

**Sources explorées :**
- ✅ data.education.gouv.fr (Annuaire de l'Éducation Nationale)
- ✅ data.rennesmetropole.fr (Open Data Rennes Métropole)
- ✅ Données Onisep (via web scraping limité)

### 2. Import réalisé

**11 lycées publics de Rennes** ont été importés/mis à jour :

#### Lycées Généraux et Technologiques (GT)
1. Lycée Émile Zola
2. Lycée Chateaubriand
3. Lycée Joliot Curie
4. Lycée René Descartes
5. Lycée Jean Macé
6. Lycée Victor et Hélène Basch

#### Lycées Polyvalents
7. Lycée polyvalent Pierre Mendès France

#### Lycées Professionnels (LP)
8. Lycée professionnel Louis Guilloux
9. Lycée professionnel Jean Jaurès
10. Lycée professionnel Coëtlogon
11. Lycée Bréquigny

### 3. Données enrichies

Pour chaque lycée :
- ✅ Nom officiel
- ✅ Localisation (Rennes)
- ✅ Type (GT / LP / Polyvalent)
- ✅ Statut (public)
- ✅ Adresse postale complète
- ✅ Téléphone
- ✅ Email
- ✅ Site web

---

## 📁 Fichiers disponibles

### Base de données
- **lycees_database.db** - Base SQLite mise à jour avec les 11 lycées publics

### Scripts d'import
- **import_lycees_rennes.py** - Script d'import des lycées depuis CSV
- **lycees_publics_rennes.csv** - Données sources des lycées publics
- **import_opendata.py** - Script pour télécharger depuis les API (nécessite réseau)

### Interface de gestion
- **lycees_manager_standalone.html** - Interface web pour gérer la base

---

## 🚀 Utilisation

### Option 1 : Utiliser la base importée (RECOMMANDÉ)

1. Ouvrez `lycees_manager_standalone.html` dans votre navigateur
2. Chargez `lycees_database.db`
3. Vous verrez les 24 lycées (11 publics Rennes + 13 existants)

### Option 2 : Réimporter depuis le CSV

```bash
python3 import_lycees_rennes.py
```

### Option 3 : Télécharger depuis les API Open Data (si réseau actif)

```bash
python3 import_opendata.py
```

---

## 📋 Prochaines étapes suggérées

### 1. Enrichir avec les formations

Les données Open Data contiennent aussi les formations. Pour les ajouter :

**Sources disponibles :**
- Onisep.fr (scraping des pages lycées)
- data.education.gouv.fr (dataset "Offre de formation")

**Ce qui pourrait être extrait :**
- Bac général (spécialités)
- Bac techno (STI2D, STL, STMG, etc.)
- BTS
- CPGE
- Sections européennes
- Sections sportives

### 2. Ajouter les dispositifs

**Exemples de dispositifs à extraire :**
- Sections européennes (langues)
- Sections sportives
- Sections artistiques
- Internats
- ULIS (Unités Localisées pour l'Inclusion Scolaire)

### 3. Compléter les lycées privés

Si besoin d'inclure les lycées privés de Rennes :
- Lycée Assomption
- Lycée Saint-Exupéry
- Lycée de La Salle
- Etc.

---

## 🔧 Scripts fournis

### import_lycees_rennes.py

**Fonction :** Import des lycées depuis le CSV vers SQLite

**Avantages :**
- ✅ Rapide et fiable
- ✅ Données vérifiées manuellement
- ✅ Pas de dépendance réseau

**Utilisation :**
```bash
python3 import_lycees_rennes.py
```

### import_opendata.py

**Fonction :** Téléchargement depuis les API Open Data

**Avantages :**
- ✅ Données officielles à jour
- ✅ Automatique

**Inconvénients :**
- ❌ Nécessite une connexion réseau
- ❌ Dépend de la disponibilité des API

**Utilisation :**
```bash
python3 import_opendata.py
```

---

## 📊 État de la base

### Statistiques actuelles

- **Total lycées :** 24
  - Publics Rennes : 11
  - Autres (existants) : 13
- **Diplômes :** 86
- **Formations :** 54
- **Dispositifs :** 10

### Tables de relations

- diplomes_par_lycee : 132 enregistrements
- formations_par_lycee : 4 enregistrements
- formations_par_diplome : 7 enregistrements
- dispositifs_par_lycee : 26 enregistrements

---

## 💡 Recommandations

### Pour un usage immédiat
1. Utilisez la base actuelle avec l'interface standalone
2. Complétez manuellement les données manquantes
3. Exportez régulièrement via "Télécharger BDD"

### Pour une automatisation complète
1. Développer un scraper Onisep pour les formations
2. Utiliser l'API data.education.gouv.fr pour les mises à jour
3. Programmer une mise à jour périodique (mensuelle/annuelle)

### Pour plus de données
1. Scraper les pages Onisep de chaque lycée
2. Extraire les formations détaillées
3. Parser les enseignements de spécialité
4. Récupérer les options et sections

---

## 🆘 Support

### Sources officielles
- **Onisep :** https://www.onisep.fr
- **Data Éducation :** https://data.education.gouv.fr
- **Rennes Métropole :** https://data.rennesmetropole.fr

### Documentation
- **API Éducation :** https://data.education.gouv.fr/api/v1/console
- **Annuaire :** https://www.education.gouv.fr/annuaire

---

**Version :** 1.0
**Date :** Janvier 2026
**Statut :** ✅ Opérationnel
