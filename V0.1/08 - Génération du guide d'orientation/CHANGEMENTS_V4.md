# 📄 Guide d'Orientation v4.0 - Changements et Extraction des Langues

## ✅ Toutes les Modifications v4.0 Implémentées !

### 🎯 Changements v4.0

#### 1. ✅ Table des matières automatique en page 2
- **Avant** : À insérer manuellement
- **Après** : Insérée automatiquement par le script
- **Niveaux** : Heading 1, 2, 3 uniquement

#### 2. ✅ Suppression des mentions de durée
- **Colonnes supprimées** :
  - `formations.duree`
  - `dispositifs.duree`
- **Affichage** : Plus aucune mention "— 1 an", "— 3 ans", etc.

#### 3. ✅ "Formations jusqu'au Bac" → "Formations"
- **Avant** : "Formations jusqu'au Bac" (H3) + "Enseignement supérieur" (H3)
- **Après** : "Formations" (H3) contenant tout, avec sup en H4

#### 4. ✅ Restructuration des formations
```
Heading 3: Formations
├── Heading 4: Après la 3e
│   └── 2de GT, 3ème prépa-métiers
├── Heading 4: Cycle terminal GT
│   └── 1re générale, Terminale générale, 1re STMG, etc.
├── Heading 4: Cycle terminal pro
│   └── Bac pro (toutes spécialités)
├── Heading 4: CAP
│   └── CAP Cuisine 1re année, CAP Pâtissier 2e année, etc.
└── Heading 4: Enseignement supérieur
    ├── BTS (liste dédupliquée)
    ├── CPGE
    └── DCG
```

#### 5. ✅ Enseignement supérieur rattaché à Formations
- **Avant** : Section H3 séparée
- **Après** : Sous-section H4 de "Formations"

---

## 📋 Nouvelle Structure Complète des Fiches

```
Heading 2: [Nom du lycée]
├── Effectifs (si disponible)
├── Heading 3: Contacts
│   ├── Adresse
│   ├── Téléphone
│   ├── Courriel
│   └── Site web
├── Heading 3: Diplômes préparés
│   ├── Heading 4: CAP
│   ├── Heading 4: Bac
│   ├── Heading 4: Bac+2
│   └── Heading 4: Bac+3, Bac+4
├── Heading 3: Formations
│   ├── Heading 4: Après la 3e
│   ├── Heading 4: Cycle terminal GT
│   ├── Heading 4: Cycle terminal pro
│   ├── Heading 4: CAP
│   └── Heading 4: Enseignement supérieur
│       ├── BTS
│       ├── CPGE
│       └── DCG
└── Heading 3: Parcours / sections
    └── Liste des dispositifs
```

---

## 🗣️ Nouvelles Tables : Langues

### Structure Créée

#### Table `langues`
```sql
CREATE TABLE langues (
    code INTEGER PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE,
    type TEXT,                          -- Langue vivante / Langue ancienne / Langue régionale
    information_complementaire TEXT
);
```

#### Table `langues_par_lycee`
```sql
CREATE TABLE langues_par_lycee (
    code INTEGER PRIMARY KEY,
    code_langue INTEGER NOT NULL,
    code_lycee INTEGER NOT NULL,
    niveau TEXT,                        -- LV1, LV2, LV3, Option
    information_complementaire TEXT,
    FOREIGN KEY (code_langue) REFERENCES langues(code),
    FOREIGN KEY (code_lycee) REFERENCES lycees(code)
);
```

### Langues Importées (12)

**Langues vivantes étrangères :**
1. Anglais
2. Allemand
3. Espagnol
4. Italien
5. Chinois
6. Arabe
7. Russe
8. Portugais
9. Japonais

**Langues anciennes :**
10. Latin
11. Grec ancien

**Langues régionales :**
12. Breton

---

## 🌐 Extraction des Langues depuis Onisep

### Méthode Manuelle (Recommandée pour Rennes)

Pour les 31 lycées de Rennes Métropole, extraction manuelle depuis les fiches Onisep :

#### Exemple : Lycée Chateaubriand

**URL** : https://www.onisep.fr/recherche?text=lycée+chateaubriand+rennes

**Informations à extraire** :
- LV1 : Anglais, Allemand
- LV2 : Anglais, Allemand, Espagnol, Italien
- LV3 : Italien
- Langues anciennes : Latin, Grec ancien

**Format CSV** :
```csv
lycee;langue;niveau;information_complementaire
Lycée Chateaubriand;Anglais;LV1;
Lycée Chateaubriand;Allemand;LV1;
Lycée Chateaubriand;Anglais;LV2;
Lycée Chateaubriand;Allemand;LV2;
Lycée Chateaubriand;Espagnol;LV2;
Lycée Chateaubriand;Italien;LV2;
Lycée Chateaubriand;Italien;LV3;
Lycée Chateaubriand;Latin;Option;Langue ancienne
Lycée Chateaubriand;Grec ancien;Option;Langue ancienne
```

### Méthode Semi-Automatique (Scraping)

Pour automatiser l'extraction, voici un script de base :

```python
#!/usr/bin/env python3
"""
Extraction des langues depuis Onisep (exemple)
"""

import requests
from bs4 import BeautifulSoup
import sqlite3

def extract_langues_lycee(url_onisep):
    """
    Extrait les langues enseignées depuis une fiche Onisep
    
    Note : Le scraping Onisep nécessite d'analyser la structure HTML
    qui peut varier selon les fiches. Cette fonction est un exemple.
    """
    
    response = requests.get(url_onisep)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    langues = []
    
    # Chercher les sections "Langues vivantes"
    # Structure à adapter selon le HTML réel d'Onisep
    lv_sections = soup.find_all('div', class_='langues-vivantes')
    
    for section in lv_sections:
        # Extraire LV1, LV2, LV3
        # Structure à adapter
        pass
    
    return langues

def import_langues_lycee(code_lycee, langues):
    """
    Importe les langues d'un lycée dans la base
    """
    
    conn = sqlite3.connect('lycees_database.db')
    cursor = conn.cursor()
    
    for langue_data in langues:
        # Récupérer le code de la langue
        cursor.execute('SELECT code FROM langues WHERE nom = ?', 
                      (langue_data['nom'],))
        result = cursor.fetchone()
        
        if result:
            code_langue = result[0]
            
            # Créer le lien
            cursor.execute('''
                INSERT INTO langues_par_lycee 
                (code_langue, code_lycee, niveau, information_complementaire)
                VALUES (?, ?, ?, ?)
            ''', (code_langue, code_lycee, 
                  langue_data['niveau'], 
                  langue_data.get('info', '')))
    
    conn.commit()
    conn.close()
```

### Fichier CSV Template

**Créer un fichier** `langues_par_lycee.csv` :

```csv
lycee;langue;niveau;information_complementaire
Lycée Chateaubriand;Anglais;LV1;
Lycée Chateaubriand;Allemand;LV1;
Lycée Jean Macé;Anglais;LV1;
Lycée Jean Macé;Allemand;LV2;
Lycée Jean Macé;Espagnol;LV2;
Lycée Jean Macé;Breton;Option;Section bilingue disponible
```

### Script d'Import CSV

```python
#!/usr/bin/env python3
"""
Import des langues par lycée depuis CSV
"""

import sqlite3
import csv

CSV_FILE = './langues_par_lycee.csv'
DB_PATH = './lycees_database.db'

def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        
        for row in reader:
            # Récupérer les codes
            cursor.execute('SELECT code FROM lycees WHERE nom = ?', 
                          (row['lycee'],))
            lycee_result = cursor.fetchone()
            
            cursor.execute('SELECT code FROM langues WHERE nom = ?', 
                          (row['langue'],))
            langue_result = cursor.fetchone()
            
            if lycee_result and langue_result:
                code_lycee = lycee_result[0]
                code_langue = langue_result[0]
                
                # Insérer le lien
                cursor.execute('''
                    INSERT INTO langues_par_lycee 
                    (code_langue, code_lycee, niveau, information_complementaire)
                    VALUES (?, ?, ?, ?)
                ''', (code_langue, code_lycee, row['niveau'], 
                      row['information_complementaire']))
                
                print(f"✓ {row['lycee']} - {row['langue']} ({row['niveau']})")
    
    conn.commit()
    conn.close()
    print("✅ Import terminé !")

if __name__ == "__main__":
    main()
```

---

## 📊 État Actuel de la Base

### Tables Créées

```
✅ lycees (32)
✅ diplomes (104)
✅ formations (105) - colonne duree supprimée
✅ dispositifs (14) - colonne duree supprimée
✅ specialites (13)
✅ langues (12) - nouvelle table
```

### Tables de Relations

```
✅ diplomes_par_lycee (170)
✅ formations_par_lycee (155)
✅ dispositifs_par_lycee (67)
✅ formations_par_diplome (30)
✅ specialites_par_diplome (13)
✅ langues_par_lycee (0) - à remplir
```

---

## 🚀 Prochaines Étapes

### 1. Remplir la Table `langues_par_lycee`

**Option A : Extraction manuelle** (Recommandée pour 31 lycées)
1. Ouvrir chaque fiche Onisep
2. Noter les langues enseignées
3. Remplir le CSV `langues_par_lycee.csv`
4. Importer avec le script

**Temps estimé** : 2-3h pour 31 lycées

**Option B : Scraping automatique**
1. Analyser la structure HTML d'Onisep
2. Adapter le script de scraping
3. Exécuter pour tous les lycées

**Temps estimé** : 4-6h de développement + 30min d'exécution

### 2. Ajouter les Langues dans le Document ODT

Une fois les langues importées, ajouter une section dans le script v5 :

```python
# === LANGUES ENSEIGNÉES ===
if lycee_data.get('langues'):
    h = H(outlinelevel=3, stylename="Heading3", text="Langues enseignées")
    doc.text.addElement(h)
    
    # Grouper par niveau
    langues_par_niveau = {}
    for langue in lycee_data['langues']:
        niveau = langue['niveau']
        if niveau not in langues_par_niveau:
            langues_par_niveau[niveau] = []
        langues_par_niveau[niveau].append(langue['nom'])
    
    # Afficher par niveau
    for niveau in ['LV1', 'LV2', 'LV3', 'Option']:
        if niveau in langues_par_niveau:
            h = H(outlinelevel=4, stylename="Heading4", text=niveau)
            doc.text.addElement(h)
            
            for langue in sorted(langues_par_niveau[niveau]):
                p = P(stylename="Normal", text=f"• {langue}")
                doc.text.addElement(p)
```

### 3. Nettoyer les Dispositifs

**Vérifier tous les lycées** en comparant avec Onisep :
- Dispositifs réels vs base de données
- Supprimer les dispositifs erronés

**Exemple : Lycée Chateaubriand**
```sql
-- Garder uniquement Abibac et Section européenne
DELETE FROM dispositifs_par_lycee
WHERE code_lycee = (SELECT code FROM lycees WHERE nom LIKE '%Chateaubriand%')
AND code_dispositif NOT IN (
    SELECT code FROM dispositifs WHERE nom IN ('Abibac', 'Section européenne (lycée GT)', 'Internat')
);
```

---

## 📋 Checklist Complète

### Base de Données
- [x] Tables langues et langues_par_lycee créées
- [x] 12 langues importées
- [ ] Langues par lycée à remplir (0/31 lycées)
- [ ] Dispositifs à vérifier/nettoyer (31 lycées)

### Document ODT
- [x] Table des matières automatique
- [x] Suppression mentions de durée
- [x] Restructuration formations (GT/Pro/CAP/Sup)
- [x] Enseignement supérieur en H4
- [ ] Section Langues à ajouter (v5)

### Documentation
- [x] Guide v4 créé
- [x] Scripts d'import langues créés
- [ ] CSV langues_par_lycee à remplir

---

## 🎉 Résultat v4.0

Vous avez maintenant :

✅ Document ODT v4 avec table des matières automatique  
✅ Structure hiérarchique complète et logique  
✅ Base de données étendue (langues)  
✅ Scripts d'import prêts à l'emploi  
✅ Plus de mentions de durée  
✅ Formations restructurées (GT/Pro/CAP/Sup)  

**Le document est prêt à être testé !** 📄✨

---

## 💡 Aide Complémentaire

Je peux vous aider à :

1. **Extraire les langues** depuis Onisep pour les 31 lycées
2. **Créer un script de scraping** automatique Onisep
3. **Nettoyer les dispositifs** erronés dans la base
4. **Ajouter la section Langues** dans le document (v5)
5. **Générer d'autres rapports** (par diplôme, par commune, etc.)

**Dites-moi ce que vous voulez faire en priorité !** 😊

---

**Version** : 4.0
**Date** : 21 janvier 2026
**Script** : generate_guide_orientation_v4.py
**Fichier** : Guide_Orientation_Lycees_20260121_v4.odt
**Base** : lycees_database.db (avec tables langues)
