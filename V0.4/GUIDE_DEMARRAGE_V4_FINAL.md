# 🚀 Guide de Démarrage Rapide v4 FINAL

## ✅ Configuration Terminée !

L'interface est maintenant **entièrement configurée** avec votre Application-ID Onisep.

---

## 🎯 Démarrage en 3 Étapes

### Étape 1 : Ouvrir l'Interface

**Fichier** : `lycees_manager_v4_final.html`

Double-cliquez ou ouvrez dans Chrome/Firefox.

---

### Étape 2 : Se Connecter à l'API Onisep

Dans le formulaire "🔑 Authentification Onisep" :

1. **Email** : Votre email Onisep
2. **Mot de passe** : Votre mot de passe Onisep
3. **Application ID** : Déjà pré-rempli ✅ (`69711beb357466e3a88b4572`)
4. Cliquer **"🔐 Se connecter"**
5. Attendre le message : **"✅ Connecté à l'API Onisep !"**

---

### Étape 3 : Extraire les Données

1. Le bouton **"🌐 Rafraîchir depuis Onisep"** devient actif
2. Cliquer dessus
3. Attendre 3-5 minutes (extraction de ~31 lycées)
4. Observer la progression dans la fenêtre modale
5. ✅ **Terminé !**

---

## 📊 Résultat Attendu

Après l'extraction, vous devriez voir :

```
✅ Extraction terminée avec succès !
  • 31 lycées extraits
  • ~100 diplômes identifiés
  • ~25 formations identifiées
  • ~50 langues extraites
  • ~500-1000 actions de formation analysées
  • ~65-100 requêtes API effectuées
```

**Statistiques en haut de page** :
- Lycées : 31
- Diplômes : ~100
- Formations : ~25
- Dispositifs : 0-15 (à enrichir manuellement)

---

## 🔧 Détails Techniques

### Application-ID Configuré

**Votre Application-ID** : `69711beb357466e3a88b4572`

- ✅ Pré-rempli dans le formulaire
- ✅ Intégré dans le code JavaScript
- ✅ Sauvegardé automatiquement
- ✅ Utilisé pour toutes les requêtes API

### Quota API

- **5000 requêtes/jour** (avec authentification)
- **Consommation estimée** : 65-100 requêtes par extraction complète
- **⇒ Possibilité** : ~50 extractions/jour

### Token

- **Durée de vie** : 24 heures
- **Sauvegarde** : localStorage du navigateur
- **Renouvellement** : Automatique à la reconnexion

---

## 🎨 Fonctionnalités Disponibles

### ✅ Extraction Onisep
- Recherche automatique des lycées (5 communes)
- Extraction des formations et diplômes
- Récupération des langues enseignées
- Mise à jour de la base SQLite

### ✅ Gestion de la Base
- Sauvegarde automatique (localStorage)
- Export manuel (.db)
- Import de base externe
- Statistiques en temps réel

### ⏳ À Venir
- Génération du document ODT
- Export PDF
- Filtres et recherche
- Édition manuelle des données

---

## 🐛 Dépannage

### Problème : "Application-ID requis"
**Solution** : Le champ est maintenant pré-rempli automatiquement.

### Problème : "Quota dépassé"
**Solution** : Attendre 24h ou utiliser un autre compte Onisep.

### Problème : Token expiré
**Solution** : Se reconnecter (bouton "Se connecter").

### Problème : 0 lycées extraits
**Solution** : 
1. Vérifier que vous êtes bien connecté
2. Ouvrir la console (F12) pour voir les erreurs
3. Relancer l'extraction

---

## 📝 Workflow Recommandé

### Extraction Initiale
```
1. Ouvrir lycees_manager_v4_final.html
2. Se connecter à l'API Onisep
3. Cliquer "Rafraîchir depuis Onisep"
4. Attendre l'extraction (3-5 min)
5. Télécharger la base (.db) en sauvegarde
```

### Mise à Jour Mensuelle
```
1. Ouvrir lycees_manager_v4_final.html
2. (Reconnexion automatique si token valide)
3. Cliquer "Rafraîchir depuis Onisep"
4. Vérifier les nouvelles données
5. Télécharger la base mise à jour
6. Générer le document (quand disponible)
```

---

## 🎯 Prochaines Étapes

Une fois l'extraction réussie :

1. **Vérifier les données**
   - Parcourir la liste des lycées
   - Vérifier les statistiques
   - Télécharger la base pour inspection

2. **Enrichir si nécessaire**
   - Ajouter dispositifs manuellement
   - Compléter les langues
   - Ajouter options des diplômes

3. **Générer le document**
   - Utiliser le script Python existant
   - Ou attendre l'intégration dans l'interface

---

## ✅ Checklist Première Utilisation

- [ ] Ouvrir lycees_manager_v4_final.html
- [ ] Vérifier que l'Application-ID est bien `69711beb357466e3a88b4572`
- [ ] Entrer email et mot de passe Onisep
- [ ] Cliquer "Se connecter"
- [ ] Vérifier badge "✅ Connecté"
- [ ] Cliquer "Rafraîchir depuis Onisep"
- [ ] Attendre la fin (3-5 min)
- [ ] Vérifier "31 lycées" dans les stats
- [ ] Télécharger la base (.db)
- [ ] 🎉 Terminé !

---

## 📞 Support

En cas de problème :
1. **Console du navigateur** (F12) : Voir les erreurs détaillées
2. **Logs** : Regarder les messages dans la console
3. **Diagnostic** : Utiliser `diagnostic_onisep.html` pour tester

---

**Version** : 4.0 FINAL
**Date** : 21 janvier 2026
**Application-ID** : 69711beb357466e3a88b4572
**Fichier** : lycees_manager_v4_final.html
**Statut** : ✅ Prêt à l'emploi

---

## 🎉 Félicitations !

Vous avez maintenant un système complet et fonctionnel pour :
- ✅ Extraire automatiquement les données Onisep
- ✅ Gérer la base de données des lycées
- ✅ Exporter et partager les données
- ✅ (Bientôt) Générer le document d'orientation

**Bon courage pour la suite !** 🚀
