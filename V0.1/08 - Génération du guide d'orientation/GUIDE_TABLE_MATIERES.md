# 📋 Guide : Insérer une Table des Matières dans LibreOffice

## ✅ Nouveau Document Généré !

Le script `generate_guide_orientation_v2.py` crée maintenant un document avec :

### 🎨 Page de garde professionnelle
- ✅ Image/logo centré
- ✅ Titre principal
- ✅ Date de génération
- ✅ Saut de page automatique

### 📊 Structure de plan correcte
- ✅ **Heading 1** : Grandes sections (4 sections)
  - Lycées généraux et technologiques publics de Rennes
  - Lycées professionnels et polyvalents publics de Rennes
  - Lycées privés de Rennes
  - Lycées publics et privés des alentours de Rennes

- ✅ **Heading 2** : Nom de chaque lycée (31 lycées)
  - Lycée Chateaubriand
  - Lycée Jean Macé
  - etc.

- ✅ **Heading 3** : Sous-sections dans chaque fiche
  - Contacts
  - Formations jusqu'au Bac
  - Parcours / sections
  - Enseignement supérieur

---

## 📋 Comment Insérer une Table des Matières

### Méthode 1 : Insertion Automatique (Recommandée)

1. **Ouvrir le document** généré
   ```
   Guide_Orientation_Lycees_20260121.odt
   ```

2. **Positionner le curseur** où vous voulez la table des matières
   - Recommandation : Juste après la page de garde (page 2)
   - Appuyez sur `Ctrl+Fin` puis `PageUp` pour aller en début de page 2

3. **Menu** → **Insertion** → **Table des matières et index** → **Table des matières, index ou bibliographie...**

4. **Dans la fenêtre qui s'ouvre :**
   - Onglet **"Type"** :
     - Type : `Table des matières`
     - Titre : `Table des matières` (ou laissez vide)
     - Cocher : ✅ **Protection contre les modifications manuelles**
   
   - Onglet **"Entrées"** :
     - Niveau 1 : Heading 1 (grandes sections)
     - Niveau 2 : Heading 2 (lycées)
     - Niveau 3 : Heading 3 (sous-sections)
     - Vous pouvez décocher le niveau 3 si vous ne voulez que les grandes sections et les lycées

5. **Cliquer sur OK**

6. **La table des matières s'insère automatiquement !**

---

### Méthode 2 : Personnalisation Avancée

Si vous voulez personnaliser l'apparence :

#### Étape 1 : Insertion (comme ci-dessus)

#### Étape 2 : Personnalisation des Styles

1. **Format** → **Styles** → **Gérer les styles** (ou F11)

2. Dans le panneau des styles, choisir **"Styles de paragraphe"**

3. Chercher les styles :
   - `Sommaire 1` (pour les Heading 1)
   - `Sommaire 2` (pour les Heading 2)
   - `Sommaire 3` (pour les Heading 3)

4. Clic droit → **Modifier** → Personnaliser :
   - Police
   - Taille
   - Retrait
   - Espacement
   - Couleur

#### Étape 3 : Mise à Jour

Après modification des styles :
- Clic droit sur la table des matières
- **Mettre à jour l'index**

---

## 🎨 Exemple de Table des Matières

Voici ce que vous obtiendrez :

```
Table des matières

Lycées généraux et technologiques publics de Rennes ............ 3
    Lycée Chateaubriand ........................................ 3
    Lycée Jean Macé ............................................ 5
    Lycée Joliot Curie ......................................... 7
    Lycée René Descartes ....................................... 9
    Lycée Victor et Hélène Basch ............................... 11
    Lycée Émile Zola ........................................... 13

Lycées professionnels et polyvalents publics de Rennes ......... 15
    Lycée polyvalent Pierre Mendès France ...................... 15
    Lycée Bréquigny ............................................ 17
    [...]

Lycées privés de Rennes ........................................ 25
    Lycée Assomption ........................................... 25
    Lycée La Mennais ........................................... 27
    [...]

Lycées publics et privés des alentours de Rennes ............... 40
    Lycée Anita Conti (Bruz) ................................... 40
    [...]
```

---

## 🔄 Mettre à Jour la Table des Matières

### Quand mettre à jour ?

- Après avoir modifié le contenu
- Après avoir ajouté/supprimé des lycées
- Après avoir changé des titres

### Comment mettre à jour ?

#### Méthode 1 : Clic droit
1. Clic droit sur la table des matières
2. **Mettre à jour l'index**

#### Méthode 2 : Menu
1. **Outils** → **Mettre à jour** → **Tous les index**

#### Méthode 3 : Raccourci
- Appuyez sur **F9** quand le curseur est dans la table

---

## 🎯 Personnalisation de la Page de Garde

### Changer l'image

1. **Remplacer le fichier** `logo_page_garde.png` par votre image
   - Format recommandé : PNG ou JPG
   - Dimensions recommandées : 920×700 pixels
   - Poids : < 1 Mo

2. **Relancer le script**
   ```bash
   python3 generate_guide_orientation_v2.py
   ```

### Ajouter votre propre logo

Si vous n'avez pas de logo, vous pouvez :

1. **Option 1** : Supprimer la section image du script
   - Éditez `generate_guide_orientation_v2.py`
   - Commentez les lignes 124-145 (section image)

2. **Option 2** : Créer un logo simple
   - Utilisez un outil en ligne (Canva, Figma, etc.)
   - Exportez en PNG
   - Nommez-le `logo_page_garde.png`

---

## 📊 Structure Complète du Document

```
Guide d'Orientation - Lycées de Rennes

├── PAGE 1 : Page de garde
│   ├── Image/logo
│   ├── Titre principal
│   └── Date
│
├── PAGE 2 : Table des matières (à insérer manuellement)
│
├── PAGE 3+ : Contenu
│   │
│   ├── HEADING 1 : Lycées GT publics de Rennes
│   │   ├── HEADING 2 : Lycée Chateaubriand
│   │   │   ├── HEADING 3 : Contacts
│   │   │   ├── HEADING 3 : Formations jusqu'au Bac
│   │   │   ├── HEADING 3 : Parcours / sections
│   │   │   └── HEADING 3 : Enseignement supérieur
│   │   ├── HEADING 2 : Lycée Jean Macé
│   │   └── [...]
│   │
│   ├── HEADING 1 : Lycées LP et polyvalents publics
│   │   └── [...]
│   │
│   ├── HEADING 1 : Lycées privés de Rennes
│   │   └── [...]
│   │
│   └── HEADING 1 : Lycées des alentours
│       └── [...]
```

---

## 🎨 Options de Personnalisation Avancée

### 1. Numérotation des Pages

**Dans LibreOffice :**
1. **Insertion** → **Champ** → **Numéro de page**
2. Pour commencer à 1 après la page de garde :
   - Placer le curseur en début de page 2
   - **Insertion** → **Saut de page manuel**
   - Cocher "Modifier le numéro de page"
   - Numéro : 1

### 2. En-têtes et Pieds de Page

**Dans LibreOffice :**
1. **Insertion** → **En-tête et pied de page** → **En-tête** → **Par défaut**
2. Taper votre texte (ex: "Guide d'orientation 2026")
3. Même chose pour le pied de page

### 3. Styles de Couleurs

**Modifier les couleurs dans le script :**
```python
# Dans generate_guide_orientation_v2.py
# Ligne 34 : Couleur des Heading 1
color="#2E5090"  # Bleu foncé

# Ligne 46 : Couleur des Heading 2
color="#4472C4"  # Bleu moyen

# Ligne 58 : Couleur des Heading 3
color="#5B9BD5"  # Bleu clair
```

Changez ces codes couleur hexadécimaux selon votre charte graphique.

---

## 🚀 Workflow Complet

### Étape 1 : Générer le Document
```bash
cd /mnt/user-data/outputs
python3 generate_guide_orientation_v2.py
```

### Étape 2 : Ouvrir dans LibreOffice
```bash
libreoffice Guide_Orientation_Lycees_20260121.odt
```

### Étape 3 : Insérer la Table des Matières
1. Positionner le curseur en page 2
2. **Insertion** → **Table des matières**
3. OK

### Étape 4 : Personnaliser (optionnel)
- Ajuster les styles
- Ajouter en-têtes/pieds de page
- Numéroter les pages
- Modifier les couleurs

### Étape 5 : Exporter en PDF
1. **Fichier** → **Exporter au format PDF**
2. Cocher "Exporter les signets"
3. Enregistrer

---

## 📋 Checklist Finale

Avant d'imprimer ou de diffuser :

- [ ] Table des matières insérée
- [ ] Table des matières à jour (F9)
- [ ] Numérotation des pages correcte
- [ ] En-têtes et pieds de page ajoutés (optionnel)
- [ ] Orthographe vérifiée
- [ ] Logo/image de qualité
- [ ] Export PDF réalisé
- [ ] PDF testé (liens cliquables, mise en page)

---

## 🆘 Dépannage

### Problème : La table des matières est vide

**Solution :**
- Vérifier que les titres utilisent bien les styles Heading 1, 2, 3
- Clic droit sur la table → Mettre à jour l'index

### Problème : L'image ne s'affiche pas

**Solution :**
- Vérifier que `logo_page_garde.png` existe dans `/mnt/user-data/outputs/`
- Vérifier les droits d'accès au fichier
- Essayer avec une autre image

### Problème : Les numéros de page ne commencent pas à 1

**Solution :**
- Insérer un saut de page manuel en page 2
- Cocher "Modifier le numéro de page" → 1

---

## 📞 Pour Aller Plus Loin

### Automatisation Complète

Créer un script qui :
1. Génère le document ODT
2. Ouvre LibreOffice en ligne de commande
3. Insère automatiquement la table des matières
4. Exporte en PDF

**Exemple de script bash :**
```bash
#!/bin/bash

# Générer le document
python3 generate_guide_orientation_v2.py

# Ouvrir et convertir en PDF (nécessite LibreOffice en ligne de commande)
libreoffice --headless --convert-to pdf Guide_Orientation_Lycees_20260121.odt

echo "✅ PDF généré : Guide_Orientation_Lycees_20260121.pdf"
```

---

## 🎉 Résultat Final

Vous obtenez un document professionnel avec :

✅ Page de garde avec image  
✅ Table des matières cliquable  
✅ Structure de plan hiérarchique  
✅ Données à jour depuis votre base  
✅ Mise en page soignée  
✅ Prêt à imprimer ou diffuser en PDF  

**Le tout généré automatiquement en quelques secondes !** 🚀

---

**Version** : 2.0
**Date** : 21 janvier 2026
**Script** : generate_guide_orientation_v2.py
**Format** : OpenDocument Text (.odt) avec structure de plan
