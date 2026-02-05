# 📄 Guide d'Orientation v3.0 - Changements et Améliorations

## ✅ Toutes les Modifications Demandées Implémentées !

### 🎯 Changements v3.0

#### 1. ✅ Suppression de toutes les lignes vides
- **Avant** : Nombreuses lignes vides entre les sections
- **Après** : Aucune ligne vide, espacement contrôlé par les marges des styles

#### 2. ✅ "Après la 3e" et "Cycle terminal" en Heading 4
- **Avant** : Simple texte en gras
- **Après** : Heading 4 (niveau 4 dans la hiérarchie)
  ```
  Heading 3: Formations jusqu'au Bac
    Heading 4: Après la 3e
    Heading 4: Cycle terminal
    Heading 4: Bac professionnel
    Heading 4: CAP
  ```

#### 3. ✅ Section "Diplômes préparés" ajoutée
- **Position** : Juste après "Contacts", avant "Formations jusqu'au Bac"
- **Structure** : Diplômes groupés par niveau (Heading 4)
  ```
  Heading 3: Diplômes préparés
    Heading 4: CAP
      • CAP Cuisine
      • CAP Pâtissier
    Heading 4: Bac
      • Bac général
      • Bac techno STMG
    Heading 4: Bac+2
      • BTS Commerce international
      • BTS Support à l'action managériale
  ```

#### 4. ✅ Séparation Diplômes vs Formations
- **Diplômes** (ce qui est délivré) : Section "Diplômes préparés"
- **Formations** (le parcours) : Sections "Formations jusqu'au Bac" et "Enseignement supérieur"

#### 5. ✅ Tri alphabétique des formations
- Toutes les formations sont triées par ordre alphabétique dans chaque sous-section

---

## 📋 Nouvelle Structure des Fiches Lycées

```
Heading 2: Nom du lycée
├── Effectifs (si disponible)
│
├── Heading 3: Contacts
│   ├── Adresse
│   ├── Téléphone
│   ├── Courriel
│   └── Site web
│
├── Heading 3: Diplômes préparés
│   ├── Heading 4: CAP (si applicable)
│   │   └── Liste des CAP
│   ├── Heading 4: Bac (si applicable)
│   │   └── Liste des Bacs
│   ├── Heading 4: Bac+2 (si applicable)
│   │   └── Liste des BTS
│   └── Heading 4: Bac+3, Bac+4, etc. (si applicable)
│
├── Heading 3: Formations jusqu'au Bac
│   ├── Heading 4: Après la 3e
│   │   ├── • Classe de 2de générale et technologique — 1 an
│   │   └── • 3ème prépa-métiers — 1 an
│   ├── Heading 4: Cycle terminal
│   │   ├── • Classe de 1re générale — 1 an
│   │   └── • Classe de Terminale générale — 1 an
│   ├── Heading 4: Bac professionnel (si applicable)
│   │   └── Liste des formations Bac pro
│   └── Heading 4: CAP (si applicable)
│       └── Liste des formations CAP
│
├── Heading 3: Parcours / sections
│   ├── • Abibac — 3 ans
│   ├── • Section européenne (lycée GT) — Anglais — 3 ans
│   └── • Internat — Internat filles-garçons — 3 ans
│
└── Heading 3: Enseignement supérieur (si applicable)
    ├── Heading 4: BTS — 2 ans
    │   └── Liste des BTS (dédupliqués)
    └── Heading 4: CPGE
        └── Liste des CPGE
```

---

## ⚠️ Problème Identifié : Dispositifs de Chateaubriand

### Selon l'Onisep
Le Lycée Chateaubriand propose uniquement :
- **Abibac** (double diplôme franco-allemand)
- **Section européenne** (Anglais, Allemand, Espagnol)

### Selon Notre Base de Données
Le Lycée Chateaubriand a actuellement :
1. ✅ Abibac
2. ❓ Bachibac (franco-espagnol)
3. ❓ Esabac (franco-italien)
4. ❓ BFI (Bac Français International)
5. ❓ Section internationale
6. ❓ Section de langue orientale
7. ✅ Section européenne
8. ❓ Section sportive
9. ✅ Internat

### Action Recommandée

**Nettoyer les dispositifs de Chateaubriand dans la base :**

```sql
-- Supprimer les dispositifs en trop
DELETE FROM dispositifs_par_lycee
WHERE code_lycee = (SELECT code FROM lycees WHERE nom LIKE '%Chateaubriand%')
AND code_dispositif IN (
    SELECT code FROM dispositifs WHERE nom IN (
        'Bachibac',
        'Esabac',
        'Bac français international (BFI)',
        'Section internationale de classe de seconde',
        'Section de langue orientale de lycée',
        'Section sportive de lycée'
    )
);
```

**OU** utiliser Metabase pour corriger manuellement.

---

## 🚀 Utilisation

### Générer le Document v3

```bash
cd /mnt/user-data/outputs
python3 generate_guide_orientation_v3.py
```

### Résultat

```
Guide_Orientation_Lycees_20260121_v3.odt
```

### Ouvrir dans LibreOffice

```bash
libreoffice Guide_Orientation_Lycees_20260121_v3.odt
```

### Insérer la Table des Matières

1. Positionner le curseur en page 2
2. **Insertion** → **Table des matières et index** → **Table des matières**
3. Dans l'onglet "Entrées", sélectionner les niveaux :
   - ✅ Niveau 1 (Heading 1) : Grandes sections
   - ✅ Niveau 2 (Heading 2) : Lycées
   - ✅ Niveau 3 (Heading 3) : Sections principales
   - ⚠️ Niveau 4 (Heading 4) : Sous-sections (optionnel, peut être décoché pour une TOC plus légère)
4. OK

---

## 📊 Comparaison des Versions

| Fonctionnalité | v2 | v3 |
|----------------|----|----|
| **Page de garde avec image** | ✅ | ✅ |
| **Structure de plan** | ✅ Heading 1/2/3 | ✅ Heading 1/2/3/4 |
| **Lignes vides** | ❌ Nombreuses | ✅ Aucune |
| **Section Diplômes** | ❌ Absente | ✅ Présente (par niveau) |
| **Séparation Diplômes/Formations** | ❌ Mélangés | ✅ Séparés |
| **Tri alphabétique** | ❌ Non | ✅ Oui |
| **Heading 4 pour sous-sections** | ❌ Texte gras | ✅ Heading 4 |

---

## 🎯 Exemple Concret : Lycée Chateaubriand

### Structure dans le Document v3

```
Heading 2: Lycée Chateaubriand

Heading 3: Contacts
Adresse : 136 boulevard de Vitré - CS 10637 - 35706 Rennes
Téléphone : 02 99 28 19 00
Courriel : ce.0350710g@ac-rennes.fr
Site web : http://www.lycee-chateaubriand.fr

Heading 3: Diplômes préparés
Heading 4: Bac
• Bac général

Heading 3: Formations jusqu'au Bac
Heading 4: Après la 3e
• Classe de 2de générale et technologique — 1 an
Heading 4: Cycle terminal
• Classe de 1re générale — 1 an
• Classe de Terminale générale — 1 an

Heading 3: Parcours / sections
• Abibac — 3 ans
• Bachibac — 3 ans (⚠️ à vérifier)
• Esabac — 3 ans (⚠️ à vérifier)
• Internat — Internat filles-garçons — 3 ans
• Section européenne (lycée GT) — 3 ans
• Section sportive de lycée — 3 ans (⚠️ à vérifier)
```

---

## 🔧 Script de Nettoyage pour Chateaubriand

Si vous voulez nettoyer la base automatiquement :

```python
#!/usr/bin/env python3
"""
Script de nettoyage des dispositifs de Chateaubriand
"""

import sqlite3

DB_PATH = './lycees_database.db'

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Récupérer le code de Chateaubriand
cursor.execute("SELECT code FROM lycees WHERE nom LIKE '%Chateaubriand%'")
code_lycee = cursor.fetchone()[0]

# Dispositifs à conserver selon Onisep
dispositifs_valides = ['Abibac', 'Section européenne (lycée GT)', 'Internat']

# Supprimer les autres
cursor.execute('''
    DELETE FROM dispositifs_par_lycee
    WHERE code_lycee = ?
    AND code_dispositif IN (
        SELECT code FROM dispositifs 
        WHERE nom NOT IN (?, ?, ?)
    )
''', (code_lycee, *dispositifs_valides))

print(f"✓ {cursor.rowcount} dispositifs supprimés pour Chateaubriand")

conn.commit()
conn.close()
```

---

## 📝 Prochaines Étapes Suggérées

### 1. Vérifier et Nettoyer les Données

**Pour tous les lycées, vérifier :**
- Dispositifs (comparer avec Onisep)
- Diplômes (comparer avec Onisep)
- Formations (comparer avec Onisep)

**Outils :**
- Metabase pour édition manuelle
- Scripts Python pour édition en masse

### 2. Ajouter une Annexe

**Créer une section "Annexe" avec :**
- Description détaillée des diplômes (CAP, Bac pro, BTS, etc.)
- Grilles horaires
- Débouchés et poursuites d'études

### 3. Ajouter des Index

**Index par diplôme :**
- "Pour préparer un BTS Commerce international → Lycée Jean Macé"

**Index par dispositif :**
- "Internats : Lycée Chateaubriand, Lycée Jean Macé, etc."

### 4. Export PDF avec Signets

**Automatiser :**
```bash
libreoffice --headless --convert-to pdf Guide_Orientation_Lycees_20260121_v3.odt
```

---

## ✅ Checklist Avant Publication

- [ ] Vérifier les dispositifs de tous les lycées (comparer Onisep)
- [ ] Insérer la table des matières
- [ ] Mettre à jour la table des matières (F9)
- [ ] Vérifier l'orthographe (F7)
- [ ] Ajouter numérotation des pages
- [ ] Ajouter en-têtes/pieds de page (optionnel)
- [ ] Exporter en PDF
- [ ] Tester le PDF (liens, mise en page)

---

## 🎉 Résultat

Vous avez maintenant un document **professionnel et structuré** avec :

✅ Page de garde avec image  
✅ Structure hiérarchique complète (4 niveaux)  
✅ Section Diplômes préparés (par niveau)  
✅ Séparation claire Diplômes vs Formations  
✅ Tri alphabétique des formations  
✅ Aucune ligne vide superflue  
✅ Prêt pour table des matières automatique  
✅ Données à jour depuis votre base  

**Le document est prêt à être testé !** 📄✨

---

**Version** : 3.0
**Date** : 21 janvier 2026
**Script** : generate_guide_orientation_v3.py
**Fichier** : Guide_Orientation_Lycees_20260121_v3.odt
