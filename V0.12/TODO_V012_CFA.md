# 📝 TODO v0.12 - Centres de Formation d'Apprentis (CFA)

## 🎯 Problème Identifié

**Contexte** : Extraction sur Bruz (35)

### Établissement Concerné
- **Type** : CFA (Centre de Formation d'Apprentis)
- **Statut actuel** : Filtré/exclu par le filtre "établissements supérieur"
- **Problème** : Propose des CAP, BAC Pro, etc. en alternance
- **Conséquence** : On passe à côté de formations du secondaire !

---

## 🔍 Analyse

### Types d'Établissements en Alternance

1. **CFA** (Centres de Formation d'Apprentis)
   - CAP en alternance
   - BAC Pro en alternance
   - Mention Complémentaire
   - BTS en alternance

2. **UFA** (Unités de Formation par Apprentissage)
   - Rattachées à des lycées
   - Mêmes diplômes en alternance

3. **Lycées avec sections apprentissage**
   - Proposent formation initiale + apprentissage

---

## ⚠️ Filtre Actuel Problématique

### Code Actuel (ligne ~1485)
```javascript
// Filtrer les établissements du supérieur
const motsSuperieur = [
    'université', 'universite', 'faculté', 'faculte',
    'iut ', 'i.u.t', 'institut universitaire',
    'ecole superieure', 'école supérieure',
    'grande ecole', 'grande école',
    'campus', 'ufr ', 'u.f.r'
];
```

**Problème** : Certains CFA peuvent être exclus par des mots-clés trop larges (ex: "campus", "école supérieure")

---

## ✅ Solution v0.12

### Option A : Approche Inclusive (RECOMMANDÉE)

**Principe** : Inclure TOUS les établissements sauf ceux clairement du supérieur

```javascript
// Filtrer UNIQUEMENT les établissements clairement du supérieur
const motsSuperieur = [
    'université', 'universite', 'faculté', 'faculte',
    'iut ', 'i.u.t', 'institut universitaire',
    'ufr ', 'u.f.r'
];

// Exclure si type ou nom contient ces mots ET que ce n'est pas un CFA/UFA
const isSuperieur = motsSuperieur.some(mot => type.includes(mot) || nom.includes(mot));
const isCFA = nom.includes('cfa') || nom.includes('c.f.a') || 
              nom.includes('centre de formation') ||
              type.includes('cfa') || type.includes('apprentissage');

return !(isSuperieur && !isCFA);
```

**Avantages** :
- ✅ Garde les CFA/UFA
- ✅ Exclut universités/IUT/facultés
- ✅ Plus de formations disponibles

---

### Option B : Filtre par Niveau de Diplômes

**Principe** : Filtrer après extraction en fonction des diplômes proposés

```javascript
// Garder l'établissement si :
// - Propose au moins 1 CAP, BAC Pro, BAC Techno
// - OU si type contient "lycée", "collège", "cfa"

const diplomes = await getDiplomesEtablissement(uai);
const hasSecondaire = diplomes.some(d => 
    d.niveau.includes('cap') || 
    d.niveau.includes('bac') || 
    d.niveau.includes('bp')
);
```

**Avantages** :
- ✅ Plus précis
- ✅ Basé sur les diplômes réels

**Inconvénients** :
- ❌ Requiert requête supplémentaire par établissement
- ❌ Plus lent

---

### Option C : Whitelist Types CFA

**Principe** : Liste blanche des types d'établissements à inclure

```javascript
const typesSecondaire = [
    'lycée', 'college', 'collège',
    'cfa', 'centre de formation', 'apprentissage',
    'ufa', 'unité de formation',
    'erea', 'etablissement regional'
];

const isSecondaire = typesSecondaire.some(t => 
    type.toLowerCase().includes(t) || 
    nom.toLowerCase().includes(t)
);

// Garder si type secondaire OU si pas dans la liste supérieur
return isSecondaire || !isSuperieur;
```

---

## 🧪 Tests à Prévoir v0.12

### Test 1 : CFA Reconnus
1. Extraire Bruz
2. ✅ Vérifier que les CFA apparaissent
3. ✅ Vérifier leurs diplômes (CAP, BAC Pro)

### Test 2 : Universités Exclues
1. Extraire une grande ville (ex: Rennes)
2. ✅ Vérifier qu'aucune université n'apparaît
3. ✅ Vérifier qu'aucune faculté n'apparaît

### Test 3 : Lycées avec Section Apprentissage
1. Extraire zone avec lycées mixtes
2. ✅ Vérifier qu'ils sont inclus
3. ✅ Vérifier que leurs diplômes alternance apparaissent

---

## 📊 Exemples de CFA à Tester

### En Ille-et-Vilaine (35)
- CFA de la CCI Rennes
- CFA AFOBAT (bâtiment)
- CFA Agricole de Saint-Aubin-du-Cormier
- UFA du Lycée Pierre Mendès France (Rennes)

### Autres Régions
- CFA de la Chambre de Métiers (chaque département)
- CFA BTP
- CFA Agricoles

---

## 🎯 Recommandation Finale

**Pour v0.12, implémenter l'Option A** :
1. Simplifier le filtre "supérieur"
2. Ajouter exception explicite pour CFA/UFA
3. Tester sur plusieurs zones
4. Ajuster si nécessaire

**Code proposé** :
```javascript
// Filtrer les établissements du supérieur (sauf CFA/UFA)
results = results.filter(r => {
    const type = (r.type || '').toLowerCase();
    const nom = (r.nom || '').toLowerCase();
    
    // Mots-clés du supérieur strict
    const motsSuperieur = [
        'université', 'universite', 'faculté', 'faculte',
        'iut ', 'i.u.t', 'institut universitaire',
        'ufr ', 'u.f.r'
    ];
    
    // Mots-clés CFA/Apprentissage (à garder)
    const motsCFA = [
        'cfa', 'c.f.a', 'centre de formation',
        'ufa', 'u.f.a', 'apprentissage',
        'alternance'
    ];
    
    const isSuperieur = motsSuperieur.some(mot => type.includes(mot) || nom.includes(mot));
    const isCFA = motsCFA.some(mot => type.includes(mot) || nom.includes(mot));
    
    // Garder si c'est un CFA OU si ce n'est pas du supérieur
    return isCFA || !isSuperieur;
});
```

---

**Date** : 28/01/2026  
**Status** : 📋 TODO v0.12  
**Priorité** : 🔴 HAUTE (formations manquantes)
