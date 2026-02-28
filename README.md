# 🎓 Parcours Avenir — Orientation Post-Collège

Application web d'aide à l'orientation scolaire après le collège, destinée aux enseignants, élèves et familles.

## Fonctionnalités

- **Recherche géographique** — tous les établissements d'une commune ou intercommunalité
- **Recherche par diplôme** — établissements proposant des Bac Pro, CAP, BTS… dans un département ou une académie
- **Recherche par option** — établissements proposant des options de 2nde GT
- **Carte interactive** — visualisation Leaflet avec marqueurs typés et calcul d'itinéraire (Google Maps)
- **Fiches détaillées** — diplômes, dispositifs pédagogiques, parcours de formation, blocs de compétences
- **Filtres dynamiques** — type, statut, commune, niveau, voie de formation (multi-sélection)
- **Export** — CSV (compatible Excel) et PDF avec page de titre et pagination
- **Favoris** — établissements, diplômes, dispositifs, options, recherches
- **Mode hors-ligne** — sauvegarde/restauration des données extraites en fichier JSON
- **Préférences chiffrées** — sauvegarde sécurisée (AES-256-GCM) des identifiants et préférences
- **Tour guidé** — première visite accompagnée (driver.js)
- **Responsive** — adapté ordinateur, tablette et téléphone

## Sources de données

| Source | Contenu | Accès |
|--------|---------|-------|
| [API ONISEP](https://opendata.onisep.fr/) | Établissements, diplômes scolaires, dispositifs, options, spécialités | Compte gratuit requis |
| [API CARIF-OREF](https://catalogue-apprentissage.intercariforef.org/) | Établissements et diplômes en apprentissage | Accès libre |
| [data.education.gouv.fr](https://data.education.gouv.fr/) | Données complémentaires établissements | Accès libre |
| [API Géo (gouv.fr)](https://geo.api.gouv.fr/) | Communes, EPCI, géocodage | Accès libre |
| [Nominatim/OSM](https://nominatim.openstreetmap.org/) | Géocodage d'adresses (domicile) | Accès libre |

## Installation

Aucune installation requise. L'application fonctionne entièrement dans le navigateur.

1. Cloner le dépôt ou télécharger le ZIP
2. Ouvrir `index.html` dans un navigateur moderne (Chrome, Firefox, Edge, Safari)
3. Pour le mode connecté (extraction de données), créer un compte gratuit sur [opendata.onisep.fr](https://opendata.onisep.fr/)

## Structure du projet

```
├── index.html                  Point d'entrée
├── css/
│   ├── design-system.css       Charte graphique et composants
│   └── main.css                Variables et styles spécifiques
├── js/
│   ├── utils.js                Initialisation + utilitaires (APP_VERSION)
│   ├── http_client.js          Client HTTP avec retry/backoff
│   ├── database_service.js     Base de données en mémoire + localStorage
│   ├── *_api.js                Clients API (ONISEP, CARIF-OREF, Géo, DataEducation)
│   ├── *_parser.js             Parsers de données
│   ├── *_extraction_controller.js  Contrôleurs d'extraction
│   ├── modal.js                Système de modales empilables
│   ├── details_modal.js        Modales de fiches détaillées
│   ├── systeme_filtres.js      Moteur de filtrage multi-critères
│   ├── gestion_onglet_*.js     Modules UI par onglet
│   ├── export_service.js       Export CSV/PDF
│   ├── tour_guide.js           Tour guidé (driver.js)
│   └── preferences_crypto_service.js  Sauvegarde chiffrée
├── data/
│   ├── parcours_bac_pro.js     Familles de métiers Bac Pro
│   └── academies_data.js       Référentiel académies
├── docs/                       Documentation technique par version
├── tests/                      Tests unitaires et fonctionnels
├── CHANGELOG.md                Historique des versions
├── LICENSE                     Licence EUPL v1.2
└── README.md                   Ce fichier
```

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  POINT D'ENTRÉE  index.html + utils.js (init())          │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│  COUCHE UI  — onglets, modales, filtres, export, carte    │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│  COUCHE MÉTIER  — contrôleurs d'extraction                │
└──────────┬─────────────────────────┬─────────────────────┘
           │                         │
┌──────────▼───────────┐  ┌──────────▼─────────────────────┐
│  APIs (clients HTTP)  │  │  Parsers (transformation)      │
└──────────┬───────────┘  └────────────────────────────────┘
           │
┌──────────▼───────────────────────────────────────────────┐
│  INFRASTRUCTURE  — HttpClient, DatabaseService            │
└──────────────────────────────────────────────────────────┘
```

## Tests

```bash
# Exécuter tous les tests
cd tests && bash run_all.sh
```

17 fichiers de tests couvrant les parsers, la base de données, les cas d'usage fonctionnels, et les corrections de chaque version.

## Dépendances externes (CDN)

| Bibliothèque | Version | Licence | Usage |
|--------------|---------|---------|-------|
| [Leaflet](https://leafletjs.com/) | 1.9.4 | BSD-2-Clause | Carte interactive |
| [sql.js](https://sql.js.org/) | 1.8.0 | MIT / Apache-2.0 | (historique, non utilisé) |
| [jsPDF](https://parall.ax/products/jspdf) | 2.5.1 | MIT | Export PDF |
| [driver.js](https://driverjs.com/) | 1.3.1 | MIT | Tour guidé |

## Licence

Copyright (c) 2026 Laurent COSTE

Ce programme est un logiciel libre distribué sous les termes de la [Licence Publique de l'Union européenne (EUPL) v1.2](https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12).

L'EUPL est une licence copyleft recommandée par la DINUM pour les logiciels développés dans la sphère publique française. Elle est compatible avec la GPL v2/v3, l'AGPL v3, la CeCILL v2 et d'autres licences (voir l'article 5 de l'EUPL).

Voir le fichier [LICENSE](LICENSE) pour les détails.
