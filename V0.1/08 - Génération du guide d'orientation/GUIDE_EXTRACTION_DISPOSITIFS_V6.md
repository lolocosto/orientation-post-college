# 📋 Guide v6 - Extraction Dispositifs Onisep & Reconstruction BDD

## ✅ Nettoyage v6 Terminé !

### Modifications Appliquées

#### 1. ✅ Formations Nettoyées
**Supprimé** : 26 formations BTS, CAP, Bac pro
- BTS Commerce - 1re année
- CAP Cuisine - 1re année
- Bac pro Commerce - 2de
- etc.

**Conservé** : 26 formations (CPGE 1re année uniquement)
- CPGE MPSI - 1re année
- CPGE Lettres - 1re année
- Classe de 2de générale et technologique
- etc.

**Raison** : Les BTS, CAP et Bac pro sont des **diplômes**, pas des formations

#### 2. ✅ Diplômes Nettoyés
**Supprimé** : 2 diplômes CPGE
- CPGE Littéraire
- CPGE Scientifique

**Conservé** : 102 diplômes (CAP, Bac, BTS, BMA, etc.)

**Raison** : Les CPGE sont des **formations**, pas des diplômes

#### 3. ✅ Champ "options" Ajouté
**Table** : `diplomes_par_lycee`
**Nouveau champ** : `options` (TEXT)
**Utilité** : Pour indiquer les options d'un diplôme
- Exemple : Bac général → "Spécialité Maths, Physique-Chimie, SVT"

---

## 📊 État Actuel de la Base

### Tables Principales
```
✅ lycees (32)
✅ diplomes (102) - CAP, Bac, BTS (pas CPGE)
✅ formations (26) - CPGE 1re année, 2de GT
✅ dispositifs (16) - À reconstruire
✅ specialites (13)
✅ langues (12)
```

### Tables de Relations
```
✅ diplomes_par_lycee (168) - avec champ "options"
✅ formations_par_lycee (5) - nettoyée
✅ dispositifs_par_lycee (73) - À reconstruire
✅ specialites_par_diplome (13)
✅ langues_par_lycee (0) - à remplir
```

---

## 🌐 Extraction des Dispositifs depuis Onisep

### Dispositifs à Extraire

Pour chaque lycée, extraire depuis Onisep :

#### 1. Sections Européennes
- Section européenne (Anglais)
- Section européenne (Allemand)
- Section européenne (Espagnol)
- etc.

#### 2. Doubles Diplômes
- Abibac (franco-allemand)
- Bachibac (franco-espagnol)
- Esabac (franco-italien)

#### 3. Sections Internationales
- Section internationale Britannique
- Section internationale Américaine
- Section internationale Allemande
- etc.

#### 4. Sections Sportives
- Section sportive Football
- Section sportive Basketball
- etc.

#### 5. Autres Dispositifs
- 3ème prépa-métiers
- Internat (filles/garçons/mixte)
- ULIS (Unité Localisée pour l'Inclusion Scolaire)
- UPE2A (Unité Pédagogique pour Élèves Allophones Arrivants)
- BFI (Bac Français International)
- etc.

### Méthode d'Extraction

#### Méthode 1 : Manuelle (Recommandée pour 31 lycées)

**Pour chaque lycée** :

1. Aller sur https://www.onisep.fr
2. Rechercher le lycée (ex: "Lycée Chateaubriand Rennes")
3. Aller dans l'onglet "Formations" ou "Enseignements"
4. Noter les dispositifs :
   - Sections linguistiques (européenne, internationale)
   - Sections sportives
   - Dispositifs spécifiques
   - Internats

**Créer un CSV** `dispositifs_par_lycee_onisep.csv` :

```csv
lycee;dispositif;information_complementaire
Lycée Chateaubriand;Section européenne;Anglais
Lycée Chateaubriand;Section européenne;Allemand
Lycée Chateaubriand;Abibac;
Lycée Chateaubriand;Internat;Internat filles-garçons
Lycée Jean Macé;Section européenne;Anglais
Lycée Jean Macé;Section sportive;Football
Lycée Jean Macé;3ème prépa-métiers;
```

**Temps estimé** : 2-3 heures pour 31 lycées

#### Méthode 2 : Semi-Automatique (Scraping)

**Créer un script Python** :

```python
#!/usr/bin/env python3
"""
Extraction dispositifs depuis Onisep (semi-automatique)
"""

import requests
from bs4 import BeautifulSoup
import sqlite3

LYCEES_URLS = {
    'Lycée Chateaubriand': 'https://www.onisep.fr/ressources/univers-lycee/lycees/bretagne/ille-et-vilaine/lycee-chateaubriand-rennes',
    'Lycée Jean Macé': 'https://www.onisep.fr/...',
    # etc.
}

def extract_dispositifs(url):
    """Extrait les dispositifs depuis une fiche Onisep"""
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    dispositifs = []
    
    # Chercher sections européennes
    # Structure HTML à adapter selon la page
    sections = soup.find_all('div', class_='section-europeenne')
    for section in sections:
        langue = section.find('span', class_='langue').text
        dispositifs.append({
            'nom': 'Section européenne',
            'info': langue
        })
    
    # Chercher sections sportives
    # etc.
    
    return dispositifs

# Exemple d'utilisation
for lycee, url in LYCEES_URLS.items():
    dispositifs = extract_dispositifs(url)
    print(f"{lycee} : {len(dispositifs)} dispositifs")
    for d in dispositifs:
        print(f"  • {d['nom']} - {d['info']}")
```

**Temps estimé** : 4-6h développement + 30min exécution

---

## 🔄 Reconstruction de dispositifs_par_lycee

### Étape 1 : Vider la Table Actuelle

```python
import sqlite3

conn = sqlite3.connect('lycees_database.db')
cursor = conn.cursor()

# Sauvegarder l'ancienne table
cursor.execute('''
    CREATE TABLE dispositifs_par_lycee_old AS 
    SELECT * FROM dispositifs_par_lycee
''')

# Vider la table
cursor.execute('DELETE FROM dispositifs_par_lycee')

conn.commit()
conn.close()
```

### Étape 2 : Importer les Nouveaux Dispositifs

**Script d'import** `import_dispositifs_onisep.py` :

```python
#!/usr/bin/env python3
"""
Import des dispositifs depuis le CSV Onisep
"""

import sqlite3
import csv

CSV_FILE = './dispositifs_par_lycee_onisep.csv'
DB_PATH = './lycees_database.db'

def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        
        for row in reader:
            # Récupérer le code du lycée
            cursor.execute('SELECT code FROM lycees WHERE nom = ?', 
                          (row['lycee'],))
            lycee_result = cursor.fetchone()
            
            if not lycee_result:
                print(f"⚠️  Lycée non trouvé : {row['lycee']}")
                continue
            
            code_lycee = lycee_result[0]
            
            # Récupérer ou créer le dispositif
            cursor.execute('SELECT code FROM dispositifs WHERE nom = ?', 
                          (row['dispositif'],))
            dispositif_result = cursor.fetchone()
            
            if dispositif_result:
                code_dispositif = dispositif_result[0]
            else:
                # Créer le dispositif
                cursor.execute('SELECT MAX(code) FROM dispositifs')
                max_code = cursor.fetchone()[0] or 0
                code_dispositif = max_code + 1
                
                cursor.execute('''
                    INSERT INTO dispositifs (code, nom)
                    VALUES (?, ?)
                ''', (code_dispositif, row['dispositif']))
                
                print(f"✓ Nouveau dispositif créé : {row['dispositif']}")
            
            # Créer le lien
            cursor.execute('SELECT MAX(code) FROM dispositifs_par_lycee')
            max_code_lien = cursor.fetchone()[0] or 0
            code_lien = max_code_lien + 1
            
            cursor.execute('''
                INSERT INTO dispositifs_par_lycee 
                (code, code_dispositif, code_lycee, information_complementaire)
                VALUES (?, ?, ?, ?)
            ''', (code_lien, code_dispositif, code_lycee, 
                  row['information_complementaire']))
            
            print(f"✓ {row['lycee']} - {row['dispositif']} ({row['information_complementaire']})")
    
    conn.commit()
    conn.close()
    
    print()
    print("✅ Import terminé !")

if __name__ == "__main__":
    main()
```

---

## 📝 Template CSV

**Fichier** : `dispositifs_par_lycee_onisep.csv`

```csv
lycee;dispositif;information_complementaire
Lycée Chateaubriand;Section européenne;Anglais
Lycée Chateaubriand;Section européenne;Allemand
Lycée Chateaubriand;Abibac;
Lycée Chateaubriand;Internat;Internat filles-garçons
Lycée Jean Macé;Section européenne;Anglais
Lycée Jean Macé;Section européenne;Espagnol
Lycée Jean Macé;Section sportive;Football
Lycée Jean Macé;Internat;Internat garçons
Lycée Jean Macé;3ème prépa-métiers;
Lycée Joliot Curie;Section européenne;Anglais
Lycée Joliot Curie;Section internationale;Britannique
Lycée Joliot Curie;Bachibac;
```

---

## 🎯 Exemple Complet : Lycée Chateaubriand

### Selon Onisep

**URL** : https://www.onisep.fr/ressources/univers-lycee/lycees/bretagne/ille-et-vilaine/lycee-chateaubriand-rennes

**Dispositifs à extraire** :
- ✅ Abibac
- ✅ Section européenne (Anglais)
- ✅ Section européenne (Allemand)
- ✅ Internat (filles-garçons)

**À SUPPRIMER de la base actuelle** :
- ❌ Bachibac (non mentionné sur Onisep)
- ❌ Esabac (non mentionné sur Onisep)
- ❌ BFI (non mentionné sur Onisep)
- ❌ Section internationale (non mentionné sur Onisep)
- ❌ Section de langue orientale (non mentionné sur Onisep)
- ❌ Section sportive (non mentionné sur Onisep)

### CSV pour Chateaubriand

```csv
lycee;dispositif;information_complementaire
Lycée Chateaubriand;Abibac;
Lycée Chateaubriand;Section européenne;Anglais
Lycée Chateaubriand;Section européenne;Allemand
Lycée Chateaubriand;Internat;Internat filles-garçons
```

---

## 📋 Checklist Extraction (31 lycées)

### Lycées GT Publics Rennes (6)
- [ ] Lycée Chateaubriand
- [ ] Lycée Jean Macé
- [ ] Lycée Joliot Curie
- [ ] Lycée René Descartes
- [ ] Lycée Victor et Hélène Basch
- [ ] Lycée Émile Zola

### Lycées LP/Polyvalents Publics Rennes (5)
- [ ] Lycée polyvalent Pierre Mendès France
- [ ] Lycée Bréquigny
- [ ] Lycée professionnel Coëtlogon
- [ ] Lycée professionnel Jean Jaurès
- [ ] Lycée professionnel Louis Guilloux

### Lycées Privés Rennes (12)
- [ ] Lycée Assomption
- [ ] Lycée La Mennais
- [ ] Lycée Saint-Exupéry - The Land
- [ ] Lycée Saint-Martin (Sainte-Anne)
- [ ] Lycée Saint-Martin (Sainte-Geneviève)
- [ ] Lycée de La Salle
- [ ] Lycée polyvalent Jeanne d'Arc
- [ ] Lycée polyvalent Saint-Vincent Providence
- [ ] Lycée professionnel Saint-Vincent Providence
- [ ] Lycée professionnel Sainte-Geneviève
- [ ] etc.

### Lycées Alentours (6)
- [ ] Lycée Anita Conti (Bruz)
- [ ] Lycée Jean-Paul II (Saint-Grégoire)
- [ ] Lycée Saint-Joseph (Bruz)
- [ ] Lycée Sévigné (Cesson-Sévigné)
- [ ] Lycée polyvalent Frédéric Ozanam (Cesson-Sévigné)
- [ ] Lycée polyvalent Théodore Monod (Le Rheu)

---

## 🎯 Workflow Complet

### 1. Extraction (À faire)
```bash
# Créer le CSV manuellement ou avec scraping
# dispositifs_par_lycee_onisep.csv
```

### 2. Import (Quand CSV prêt)
```bash
cd /mnt/user-data/outputs
python3 import_dispositifs_onisep.py
```

### 3. Vérification
```bash
# Vérifier le nombre de dispositifs par lycée
python3 -c "
import sqlite3
conn = sqlite3.connect('lycees_database.db')
cursor = conn.cursor()
cursor.execute('''
    SELECT l.nom, COUNT(dpl.code)
    FROM lycees l
    LEFT JOIN dispositifs_par_lycee dpl ON l.code = dpl.code_lycee
    GROUP BY l.nom
    ORDER BY l.nom
''')
for nom, count in cursor.fetchall():
    print(f'{nom}: {count} dispositifs')
conn.close()
"
```

### 4. Régénération du Document
```bash
python3 generate_guide_orientation_v6.py
```

---

## 📁 Fichiers à Créer

1. **dispositifs_par_lycee_onisep.csv** - Données Onisep
2. **import_dispositifs_onisep.py** - Script d'import
3. **generate_guide_orientation_v6.py** - Script générateur v6

---

## ✅ Résumé

### Fait
- [x] Formations BTS, CAP, Bac pro supprimées (26)
- [x] Diplômes CPGE supprimés (2)
- [x] Champ "options" ajouté dans diplomes_par_lycee
- [x] Base nettoyée et cohérente

### À Faire
- [ ] Extraire dispositifs depuis Onisep (31 lycées)
- [ ] Créer dispositifs_par_lycee_onisep.csv
- [ ] Importer avec script
- [ ] Vérifier cohérence
- [ ] Régénérer document v6

---

## 💡 Pour la Suite

Quand vous revenez, dites-moi si vous voulez :

1. **Aide pour l'extraction Onisep** :
   - Script de scraping automatique
   - Template CSV à remplir
   - Exemples pour quelques lycées

2. **Génération document v6** :
   - Avec les nouvelles données
   - Structure actualisée

3. **Autres enrichissements** :
   - Langues par lycée
   - Options des diplômes
   - Spécialités Bac général

**Bon courage pour la suite !** 🚀

---

**Version** : 6.0 - En cours
**Date** : 21 janvier 2026
**Script nettoyage** : clean_database_v6.py
**Base** : lycees_database.db (nettoyée v6)
**Statut** : ⏸️ En attente extraction Onisep
