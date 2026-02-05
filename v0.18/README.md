# Orientation Post-Collège V0.18 - Architecture Modulaire

## 🎯 Objectifs de la V0.18

- ✅ Architecture modulaire maintenable
- ✅ Encodage UTF-8 propre
- ✅ Gestion erreurs 429 (rate limiting)
- ✅ Toutes les fonctionnalités V0.17
- ✅ Code optimisé et documenté

## 📁 Structure

```
v0.18/
├── index.html              Interface principale
├── css/
│   └── styles.css          Styles centralisés
├── js/
│   ├── config.js           Configuration
│   ├── onisep-api.js       Client API avec retry 429
│   ├── database.js         Gestion SQLite
│   ├── ui-manager.js       Gestion interface
│   ├── favorites.js        Système favoris
│   ├── map-manager.js      Carte Leaflet
│   └── utils.js            Utilitaires
└── data/
    ├── academies.js        Données académies
    └── epci.js             Données EPCI
```

## 🚀 Utilisation

Ouvrir `index.html` dans un navigateur moderne.

## 📝 Documentation

Chaque module est documenté en JSDoc.
