# v0.62 — Phase 2 : Document technique de conception

## Modale de choix de mode (connecté / déconnecté)

---

## 1. Objectif

Afficher une modale au lancement de l'application (après le tour guidé, le cas échéant) qui guide l'utilisateur vers l'un des deux modes d'utilisation :

- **Mode connecté** : l'utilisateur a (ou va créer) un compte Onisep.
- **Mode déconnecté** : l'utilisateur explore des données déjà extraites.

---

## 2. Architecture de la modale

La modale comporte **3 écrans** gérés comme des « steps » dans un conteneur unique :

| Écran | Nom | Condition d'affichage |
|-------|-----|----------------------|
| 1 | Choix du mode | Toujours (sauf si `mode_choice_done` est déjà posé) |
| 2 | Résumé des données en base | Mode déconnecté ET base non vide |
| 3 | Chargement d'un jeu de données | Mode déconnecté ET (base vide OU refus des données en base) |

### 2.1 Écran 1 — Choix du mode

Deux cartes cliquables côte à côte (empilées sur mobile).
- Pas de croix de fermeture.
- Escape et clic backdrop désactivés (choix obligatoire).
- Un bouton « Valider » activé uniquement quand un choix est fait.

### 2.2 Écran 2 — Données en base

Affiché si mode déconnecté et `databaseService.hasEducationalData()` est true.
- Résumé : type de recherche, zone géographique, date, statistiques.
- Données issues de `databaseService.getLastExtractionMetadata()` et `databaseService.getStats()`.
- Bouton « Explorer ces données » → ferme la modale.
- Bouton « Charger un autre jeu » → passe à l'écran 3.

### 2.3 Écran 3 — Chargement d'un jeu de données

- Liste des jeux indexés (`DatasetService.getIndex()`), si disponibles.
- Bouton d'import fichier JSON (`<input type="file" accept=".json">`).
- Après import réussi → affiche un résumé et ferme la modale.
- Bouton « Retour » pour revenir à l'écran 2 (ou à l'écran 1).

---

## 3. Intégration avec le cycle de vie de l'application

### 3.1 Modification de `tour_guide.js`

Dans `onDestroyStarted`, ajouter l'émission d'un événement custom :

```javascript
onDestroyStarted: () => {
    localStorage.setItem(TourGuide.#STORAGE_KEY, 'true');
    this.#driver.destroy();
    document.dispatchEvent(new CustomEvent('tour:completed'));  // AJOUT
}
```

### 3.2 Modification de `utils.js` — `init()`

Après l'étape 9 (tour guidé), insérer l'étape 10 (modale de choix) :

```
// 10. Modale de choix de mode (si pas déjà fait)
if (typeof ModeChoiceModal !== 'undefined') {
    const shouldShow = !sessionStorage.getItem('mode_choice_done_session')
                    && !localStorage.getItem('mode_choice_skip');
    if (shouldShow) {
        if (TourGuide.isPremiereLancement()) {
            // Tour lancé → attendre sa fin
            document.addEventListener('tour:completed', () => {
                setTimeout(() => ModeChoiceModal.show(), 500);
            }, { once: true });
        } else {
            // Pas de tour → afficher directement
            setTimeout(() => ModeChoiceModal.show(), 300);
        }
    }
}
```

### 3.3 Flags de contrôle

| Flag | Stockage | Rôle |
|------|----------|------|
| `mode_choice_done` | localStorage | Mode choisi (`'connected'` ou `'disconnected'`). Pas utilisé pour bloquer le ré-affichage, mais pour mémoriser le dernier choix. |
| `mode_choice_skip` | localStorage | Si `'true'`, ne plus afficher la modale (l'utilisateur peut le poser depuis Paramètres). |

On ne bloque PAS systématiquement le ré-affichage via localStorage pour permettre à un utilisateur de changer de mode à chaque session. La modale s'affiche à chaque visite sauf si `mode_choice_skip` est posé.

---

## 4. Classe `ModeChoiceModal`

### 4.1 Héritage

Hérite de `Modal` (modal.js). Override de certains comportements :
- Constructeur : désactive la croix de fermeture et le backdrop.
- Méthode statique `show()` pour simplifier l'appel.

### 4.2 Méthodes

| Méthode | Responsabilité |
|---------|---------------|
| `constructor()` | Crée la modale, affiche l'écran 1 |
| `static show()` | Crée une instance et l'ouvre |
| `#renderStep1_Choice()` | Génère le HTML de l'écran 1 |
| `#renderStep2_DataSummary(meta, stats)` | Génère le HTML de l'écran 2 |
| `#renderStep3_LoadDataset()` | Génère le HTML de l'écran 3 |
| `#onModeSelected(mode)` | Gère la validation du choix |
| `#onAcceptCurrentData()` | Ferme la modale (données en base acceptées) |
| `#onLoadDataset()` | Passe à l'écran 3 |
| `#onFileSelected(event)` | Lit et valide le fichier JSON importé |
| `#onImportSuccess(stats)` | Affiche le résumé post-import et ferme |
| `#switchToStep(stepNumber)` | Masque/affiche les écrans |

### 4.3 Classes CSS

Toutes préfixées par `mode-choice-` pour cohérence avec la convention BEM du projet.

| Classe | Élément |
|--------|---------|
| `.mode-choice__cards` | Conteneur flex des 2 cartes (écran 1) |
| `.mode-choice__card` | Carte cliquable |
| `.mode-choice__card--selected` | État sélectionné |
| `.mode-choice__card-icon` | Emoji/icône de la carte |
| `.mode-choice__card-title` | Titre de la carte |
| `.mode-choice__card-desc` | Description de la carte |
| `.mode-choice__summary` | Bloc résumé (écran 2) |
| `.mode-choice__summary-row` | Ligne du résumé |
| `.mode-choice__dataset-list` | Liste des jeux (écran 3) |
| `.mode-choice__dataset-item` | Entrée de jeu de données |
| `.mode-choice__file-input` | Zone d'import de fichier |
| `.mode-choice__actions` | Conteneur de boutons d'action |
| `.mode-choice__step` | Écran générique (display:none par défaut) |
| `.mode-choice__step--active` | Écran visible |

---

## 5. Tests prévus

| # | Test | Type |
|---|------|------|
| 1 | La modale ne s'affiche pas si `mode_choice_skip` est posé | Unitaire |
| 2 | Choix « connecté » → flag posé, modale fermée | Unitaire |
| 3 | Choix « déconnecté » + base non vide → écran 2 affiché | Unitaire |
| 4 | Choix « déconnecté » + base vide → écran 3 direct | Unitaire |
| 5 | Écran 2 : « Explorer ces données » → modale fermée | Unitaire |
| 6 | Écran 2 : « Charger un autre jeu » → écran 3 | Unitaire |
| 7 | Écran 3 : import JSON valide → données chargées, modale fermée | Fonctionnel |
| 8 | Écran 3 : import JSON invalide → message d'erreur | Fonctionnel |
| 9 | L'événement `tour:completed` déclenche bien la modale | Intégration |
| 10 | Responsive : cartes empilées sur mobile (< 767px) | Visuel |

---

## 6. Séquence complète (diagramme)

```
DOMContentLoaded
  → init()
    → … étapes 1-8 …
    → étape 9 : tour guidé ?
      OUI → TourGuide.start()
             → tour terminé → dispatch 'tour:completed'
               → ModeChoiceModal.show()
      NON → ModeChoiceModal.show() (300ms délai)
    → ModeChoiceModal ouverte
      → Utilisateur choisit « Connecté »
        → close() → flag 'connected'
      → Utilisateur choisit « Déconnecté »
        → hasEducationalData() ?
          OUI → écran 2 (résumé)
            → « Explorer » → close()
            → « Autre jeu » → écran 3
          NON → écran 3 (import)
            → fichier JSON → import → close()
```
