# Parcours Avenir — Scénarios utilisateur (v0.45)
> Tests manuels ou automatisables (Playwright/Cypress). Un scénario par CU principal.

---

## SU-01 · Premier lancement — enseignant en collège (CU-01, CU-02, CU-04)

**Contexte :** Première utilisation de l'application.

**Étapes :**
1. Ouvrir l'application → vérifier que l'onglet Résultats est actif par défaut.
2. Ouvrir le panneau Paramètres (⚙️).
3. Aller dans « Zone de recherche » → saisir « Rennes ».
4. Vérifier l'autocomplétion (au moins 1 suggestion).
5. Sélectionner la commune → vérifier le libellé « Rennes (35) » affiché.
6. Aller dans « Domicile » → saisir une adresse rennaise → cliquer « Valider ».
7. Vérifier l'affichage des coordonnées GPS sous le champ.
8. Fermer le panneau → aller dans l'onglet Recherche → mode Géographique.
9. Cliquer « Extraire » → vérifier la barre de progression.
10. Attendre la fin → vérifier le résumé (nb établissements, formations).

**Résultats attendus :**
- Extraction terminée sans erreur bloquante.
- Statistiques affichées (≥ 1 établissement, ≥ 1 formation).
- L'onglet Résultats affiche la liste des établissements.

---

## SU-02 · Famille cherchant un lycée avec internat (CU-09, CU-12, CU-15, CU-20)

**Contexte :** Un parent cherche un lycée GT avec internat dans la zone extraite.

**Étapes :**
1. Onglet Résultats → vue Établissements.
2. Filtre Type → « Lycée GT ».
3. Filtre Hébergement → « Avec internat ».
4. Vérifier que la liste se réduit aux lycées GT avec internat.
5. Cliquer sur un lycée → vérifier la fiche modale :
   - Badge Internat visible
   - Téléphone et site web affichés (ou masqués si vides)
   - Bouton « Calculer l'itinéraire » présent (si domicile défini)
6. Cliquer « Calculer l'itinéraire » → vérifier que Google Maps s'ouvre.
7. Navigation Précédent/Suivant → vérifier que le compteur (ex. « 2 / 5 ») change.
8. Fermer la modale → vérifier que la liste conserve son scroll.

**Résultats attendus :**
- Filtrage fonctionnel, fiche complète, itinéraire ouvert dans un nouvel onglet.

---

## SU-03 · Enseignant préparant un document d'orientation (CU-21, CU-22)

**Contexte :** L'enseignant veut exporter la liste des CFA Qualiopi.

**Étapes :**
1. Résultats → filtre Type = « CFA », Qualiopi = Oui.
2. Cliquer « CSV » → vérifier le téléchargement.
3. Ouvrir le fichier dans un tableur → vérifier :
   - Encodage UTF-8 correct (accents lisibles)
   - Première ligne = en-têtes de colonnes
   - Autant de lignes que d'établissements dans la vue filtrée
4. Cliquer « PDF » → vérifier :
   - L'en-tête affiche le titre et la date du jour
   - La pagination est présente (si > 1 page)
   - Les données correspondent à la vue filtrée

**Résultats attendus :** Fichiers téléchargés, lisibles, données cohérentes avec la vue.

---

## SU-04 · Consultation sur téléphone (CU-09, CU-12, CU-19)

**Contexte :** Un élève utilise l'application sur son smartphone (375px de large, portrait).

**Étapes :**
1. Redimensionner la fenêtre à 375px × 667px (ou utiliser DevTools device mode).
2. Vérifier la navigation : tab bar en bas de l'écran.
3. Onglet Résultats → vérifier l'affichage en **cartes** (pas de tableau).
4. Vérifier qu'aucun défilement horizontal n'apparaît.
5. Ouvrir une fiche établissement → vérifier le plein écran.
6. Fermer avec le bouton ✕ → retour à la liste.
7. Ouvrir les filtres → vérifier que les boutons ont ≥ 44px de hauteur.
8. Onglet Carte → vérifier les marqueurs et la sélection par tap.

**Résultats attendus :** Interface utilisable sans zoom, cibles tactiles accessibles.

---

## SU-05 · Gestion d'une erreur réseau (CU-04, CU-08)

**Contexte :** La connexion est coupée pendant une extraction.

**Étapes :**
1. Lancer une extraction scolaire.
2. Après quelques secondes, passer en mode avion (ou DevTools → Network → Offline).
3. Observer le comportement.
4. Remettre le réseau → cliquer « Réessayer » (si présent) ou relancer.

**Résultats attendus :**
- Message d'erreur non bloquant (alerte ou toast).
- Données déjà extraites conservées (statistiques > 0).
- L'application reste utilisable (Résultats, Carte, Fiches sur données existantes).

---

## SU-06 · Navigation dans les fiches (CU-12, CU-13)

**Contexte :** Consultation de plusieurs fiches à la suite.

**Étapes :**
1. Ouvrir la fiche du 1er établissement de la liste.
2. Cliquer « Suivant » → vérifier que le compteur passe à « 2 / N ».
3. Répéter jusqu'au dernier → vérifier que « Suivant » est désactivé.
4. Cliquer « Précédent » → revenir au 1er → vérifier que « Précédent » est désactivé.
5. Ouvrir une fiche formation depuis la fiche établissement → vérifier le retour.
6. Fermer → vérifier que la liste conserve la position de scroll.

**Résultats attendus :** Navigation fluide, compteur correct, aucune erreur aux bords.

---

## SU-07 · Purge et nouvelle extraction (CU-24, CU-04)

**Contexte :** L'enseignant veut rafraîchir les données en début d'année scolaire.

**Étapes :**
1. Paramètres → Base de données → vérifier les statistiques actuelles.
2. Cliquer « Effacer les données » → confirmer la boîte de dialogue.
3. Vérifier que les statistiques reviennent à 0.
4. Vérifier que la zone géographique et le domicile sont **conservés**.
5. Relancer une extraction → vérifier que les nouvelles données s'affichent.

**Résultats attendus :** Purge propre, préférences conservées, nouvelle extraction possible.

---

## SU-08 · Recherche par mot-clé sur carte (CU-18, CU-19)

**Contexte :** Un utilisateur cherche un établissement précis sur la carte.

**Étapes :**
1. Onglet Résultats → recherche textuelle « Compagnons ».
2. Vérifier que seuls les établissements correspondants sont affichés.
3. Onglet Carte → vérifier que seuls les marqueurs filtrés sont visibles.
4. Cliquer sur un marqueur → vérifier l'infobulle (nom, type, commune).
5. Cliquer « Voir la fiche » → vérifier la modale.

**Résultats attendus :** Filtre textuel cohérent entre liste et carte.

---

## Matrice de couverture SU → CU

| Scénario | CU couverts |
|---|---|
| SU-01 Premier lancement | CU-01, CU-02, CU-04 |
| SU-02 Famille / lycée internat | CU-09, CU-12, CU-15, CU-20 |
| SU-03 Export orientation | CU-21, CU-22 |
| SU-04 Mobile | CU-09, CU-12, CU-19 |
| SU-05 Erreur réseau | CU-04, CU-08 |
| SU-06 Navigation fiches | CU-12, CU-13 |
| SU-07 Purge | CU-24, CU-04 |
| SU-08 Recherche sur carte | CU-18, CU-19 |
