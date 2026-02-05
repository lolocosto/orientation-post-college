# 📄 Génération de Documents d'Orientation Type ODT/Word

## ❌ Réponse Directe : Metabase NE Peut PAS Faire Ça

### Pourquoi ?

**Metabase est fait pour :**
- ✅ Tableaux de données
- ✅ Graphiques
- ✅ Tableaux de bord interactifs
- ✅ Export PDF de tableaux simples

**Metabase N'est PAS fait pour :**
- ❌ Documents structurés type Word/ODT
- ❌ Mise en page complexe
- ❌ Tables des matières
- ❌ Fiches détaillées multi-pages
- ❌ Sections et sous-sections

---

## ✅ Solutions Pour Générer Vos Documents

### 🏆 **Solution 1 : Script Python + odfpy** (RECOMMANDÉE)

**C'est ce que je vous ai créé !**

#### Avantages
- ✅ **Automatisation complète** : 1 commande = 1 document complet
- ✅ **Personnalisable à 100%** : Vous contrôlez la mise en page
- ✅ **Données à jour** : Toujours depuis votre base SQLite
- ✅ **Gratuit** et open-source
- ✅ **Réutilisable** : Lancez le script quand vous voulez

#### Comment ça marche

```bash
# Générer le document
cd /mnt/user-data/outputs
python3 generate_guide_orientation.py

# Résultat : Guide_Orientation_Lycees_20260121.odt
```

**Le script fait automatiquement :**
1. Se connecte à `lycees_database.db`
2. Récupère tous les lycées avec leurs données
3. Génère un document ODT structuré
4. Crée des fiches pour chaque lycée avec :
   - Coordonnées
   - Formations
   - Diplômes
   - Dispositifs

---

### **Solution 2 : LibreOffice Base + Rapports** ⭐⭐⭐

**La solution "classique" type Business Objects**

#### Avantages
- ✅ Interface graphique
- ✅ Modèles de rapports WYSIWYG
- ✅ Pas besoin de coder

#### Inconvénients
- ⚠️ Configuration initiale complexe
- ⚠️ Moins flexible que Python
- ⚠️ Interface datée

#### Comment faire

1. **Ouvrir LibreOffice Base**
2. **Créer une nouvelle base** → "Connexion à une base existante" → SQLite
3. **Sélectionner** `lycees_database.db`
4. **Créer un rapport** :
   - Onglet "Rapports"
   - "Utiliser l'assistant"
   - Sélectionner les tables et champs
   - Définir la mise en page
5. **Enregistrer** le modèle
6. **Générer** le rapport

---

### **Solution 3 : Python + python-docx** (Alternative)

**Pour générer des fichiers .DOCX au lieu de .ODT**

#### Installation
```bash
pip install python-docx --break-system-packages
```

#### Avantages
- ✅ Format Microsoft Word natif
- ✅ Meilleure compatibilité Word

#### Inconvénients
- ⚠️ Moins de fonctionnalités que odfpy
- ⚠️ Styles plus limités

---

### **Solution 4 : Python + ReportLab** (Pour PDF)

**Si vous voulez générer directement en PDF**

#### Avantages
- ✅ Contrôle total sur le PDF
- ✅ Professionnellement mis en page

#### Inconvénients
- ⚠️ Plus complexe à coder
- ⚠️ PDF non modifiable

---

## 🚀 Utilisation du Script Python (generate_guide_orientation.py)

### Installation des Dépendances

```bash
# Installer odfpy (pour générer des fichiers ODT)
pip install odfpy --break-system-packages
```

### Lancer le Script

```bash
cd /mnt/user-data/outputs
python3 generate_guide_orientation.py
```

### Résultat

```
======================================================================
GÉNÉRATION DU GUIDE D'ORIENTATION
======================================================================

📊 Récupération des données...
✓ 31 lycées trouvés

  ✓ Ajout : Lycée Chateaubriand
  ✓ Ajout : Lycée Jean Macé
  [...]

💾 Enregistrement du document : Guide_Orientation_Lycees_20260121.odt

======================================================================
✅ DOCUMENT GÉNÉRÉ AVEC SUCCÈS !
======================================================================

📄 Fichier : Guide_Orientation_Lycees_20260121.odt
📊 Lycées inclus : 31
```

### Ouvrir le Document

```bash
# Avec LibreOffice
libreoffice Guide_Orientation_Lycees_20260121.odt

# Ou double-cliquer sur le fichier
```

---

## 🎨 Personnalisation du Script

### Modifier les Sections

Dans `generate_guide_orientation.py`, vous pouvez :

#### 1. Changer l'ordre des sections

```python
# Section Lycées publics de Rennes
h = H(outlinelevel=1, stylename="Heading1", 
      text="Lycées généraux et technologiques publics de Rennes")
```

#### 2. Ajouter/retirer des informations

```python
# Ajouter les effectifs
if lycee_data.get('effectifs'):
    p = P(stylename="Normal", text=f"Effectifs : {lycee_data['effectifs']} élèves")
    doc.text.addElement(p)
```

#### 3. Filtrer les lycées

```python
# Uniquement les lycées publics
cursor.execute('''
    SELECT * FROM lycees 
    WHERE statut = 'public'
    ORDER BY nom
''')
```

#### 4. Changer les styles

```python
# Style pour les titres (couleur, taille, etc.)
h1style = Style(name="Heading1", family="paragraph")
h1style.addElement(TextProperties(attributes={
    'fontsize': "20pt",      # Taille
    'fontweight': "bold",    # Gras
    'color': "#0066cc"       # Couleur bleue
}))
```

---

## 📋 Structure du Document Généré

```
Guide d'Orientation des Lycées
├── Titre principal
├── Date de génération
│
├── Lycées généraux et technologiques publics de Rennes
│   ├── Lycée Chateaubriand
│   │   ├── Contacts (adresse, tél, email, web)
│   │   ├── Formations jusqu'au Bac
│   │   │   ├── Après la 3e
│   │   │   └── Cycle terminal
│   │   ├── Diplômes préparés
│   │   └── Parcours / Sections
│   ├── Lycée Jean Macé
│   └── [...]
│
├── Lycées professionnels et polyvalents publics de Rennes
│   ├── Lycée Bréquigny
│   └── [...]
│
├── Lycées privés de Rennes
│   ├── Lycée Assomption
│   └── [...]
│
└── Lycées publics et privés des alentours de Rennes
    ├── Lycée Sévigné (Cesson-Sévigné)
    └── [...]
```

---

## 🔄 Automatisation

### Générer le Document Automatiquement

#### Option 1 : Tâche Planifiée (Cron - Linux/Mac)

```bash
# Éditer le crontab
crontab -e

# Ajouter cette ligne pour générer tous les lundis à 9h
0 9 * * 1 cd /chemin/vers/outputs && python3 generate_guide_orientation.py
```

#### Option 2 : Tâche Planifiée (Windows)

1. Ouvrir "Planificateur de tâches"
2. Créer une tâche
3. Déclencheur : Tous les lundis à 9h
4. Action : Exécuter `python3 generate_guide_orientation.py`

#### Option 3 : Script Bash

```bash
#!/bin/bash
# generate_guide.sh

cd /mnt/user-data/outputs
python3 generate_guide_orientation.py

echo "Document généré : $(date)" >> generation.log
```

---

## 🎯 Comparaison des Solutions

| Solution | Difficulté | Flexibilité | Format | Automatisation |
|----------|-----------|-------------|--------|----------------|
| **Python + odfpy** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ODT | ✅ Complète |
| **Python + python-docx** | ⭐⭐ | ⭐⭐⭐⭐ | DOCX | ✅ Complète |
| **LibreOffice Base** | ⭐⭐⭐ | ⭐⭐⭐ | ODT/PDF | ⚠️ Limitée |
| **Python + ReportLab** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | PDF | ✅ Complète |
| **Metabase** | ⭐ | ⭐ | PDF | ❌ Tableaux seulement |

---

## 💡 Recommandations

### Pour Votre Cas

**Utilisez le script Python (generate_guide_orientation.py) car :**

1. ✅ **Simple à utiliser** : 1 commande
2. ✅ **Automatisable** : Lancez quand vous voulez
3. ✅ **Personnalisable** : Modifiez le code selon vos besoins
4. ✅ **Toujours à jour** : Données de la base SQLite
5. ✅ **Format ODT** : Compatible LibreOffice/Word

### Workflow Recommandé

```
┌─────────────────────────────────────────────┐
│ 1. Mettre à jour les données (Metabase)    │
│    → Ajouter lycées, diplômes, etc.        │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ 2. Générer le document (Python)             │
│    → python3 generate_guide_orientation.py  │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ 3. Personnaliser (LibreOffice)             │
│    → Ouvrir le .odt, ajuster, imprimer     │
└─────────────────────────────────────────────┘
```

---

## 🆘 Si Vous Avez Besoin d'Aide

### Je Peux Vous Aider À :

1. **Personnaliser le script** pour votre mise en page exacte
2. **Ajouter des fonctionnalités** :
   - Table des matières automatique
   - Numérotation des pages
   - En-têtes et pieds de page
   - Images et logos
   - Tableaux complexes
3. **Créer d'autres types de rapports** :
   - Fiches individuelles par lycée
   - Comparatifs
   - Statistiques
4. **Automatiser la génération** avec des tâches planifiées

---

## 📊 Exemple de Résultat

### Document Généré

Le script génère un document ODT avec :

```
Orientation en 3ème - Lycées GT et lycées pro
de Rennes et alentours

Document généré le 21/01/2026

═══════════════════════════════════════════════

Lycées généraux et technologiques publics de Rennes

Lycée Chateaubriand

Contacts
Adresse : 136 boulevard de Vitré - CS 10637 - 35706 Rennes
Téléphone : 02 99 28 19 00
Courriel : ce.0350710g@ac-rennes.fr
Site web : http://www.lycee-chateaubriand.fr

Formations jusqu'au Bac
Après la 3e
• Classe de 2de générale et technologique — 1 an

Cycle terminal
• Classe de 1re générale — 1 an
• Classe de Terminale générale — 1 an

Diplômes préparés
• Bac général

Parcours / Sections
• Esabac — Franco-Italien
• Internat — Internat filles-garçons
• Section européenne (lycée GT) — Anglais, Allemand, Espagnol
• Section sportive de lycée — Football

[...]
```

---

## 🎉 Conclusion

### ❌ Metabase seul : NON

Metabase ne peut pas générer ce type de document structuré.

### ✅ Solution : Script Python

J'ai créé un script qui :
- ✅ Lit votre base de données
- ✅ Génère un document ODT professionnel
- ✅ Structure automatiquement les fiches lycées
- ✅ Est personnalisable et automatisable

### 🚀 Prêt à Utiliser

```bash
cd /mnt/user-data/outputs
python3 generate_guide_orientation.py
```

**Le document est généré en quelques secondes !** 📄✨

---

**Version** : 1.0
**Date** : 21 janvier 2026
**Fichier** : generate_guide_orientation.py
**Format** : OpenDocument Text (.odt)
