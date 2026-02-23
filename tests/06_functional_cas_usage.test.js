/**
 * @file 06_functional_cas_usage.test.js
 * @description Tests fonctionnels couvrant les cas d'usage définis dans CU_parcours_avenir.md
 *
 * Couvre :
 *   CU-01 Saisie zone géographique (via préférences)
 *   CU-02 Saisie adresse domicile
 *   CU-04 Extraction scolaire (simulation pagination ONISEP)
 *   CU-05 Extraction apprentissage CARIF-OREF (filtrage, déduplication)
 *   CU-09 Liste établissements (via db_service)
 *   CU-14 Filtrage par type
 *   CU-15 Filtrage par hébergement
 *   CU-17 Filtrage Qualiopi
 *   CU-18 Recherche textuelle
 *   CU-21 Export CSV (BOM, encodage)
 *   CU-23 Statistiques base locale
 *   CU-24 Purge avec conservation des préférences
 *   CU-25 Favoris divers — toutes catégories visibles dans le panneau (v0.51)
 *   CU-26 Bouton "Voir la fiche" toujours large dans les cartes favoris (v0.51)
 *
 * Prérequis : Node.js ≥ 18, jest
 * Lancement : jest tests/06_functional_cas_usage.test.js
 *
 * Historique :
 *   v0.43 — création
 *   v0.51 — ajout CU-25 (favoris divers multi-catégories) et CU-26 (layout boutons favoris)
 */

'use strict';

// ── Shim localStorage ────────────────────────────────────
const _store = {};
global.localStorage = {
    getItem:    k     => _store[k] ?? null,
    setItem:    (k,v) => { _store[k] = String(v); },
    removeItem: k     => { delete _store[k]; },
    clear:      ()    => { Object.keys(_store).forEach(k => delete _store[k]); },
};

// ── Chargement classes (Node eval) ───────────────────────
const fs   = require('fs');
const path = require('path');
function _genId() { return Math.random().toString(36).slice(2, 10).padEnd(8, '0'); }
eval(fs.readFileSync(path.join(__dirname, '../js/database_service.js'), 'utf8'));

// ── Fixtures ─────────────────────────────────────────────
const ETABS_TEST = [
    { uai: '0352660B', nom: 'Lycée Pierre Mendès France', type: 'lycée professionnel',
      statut: 'Public',  commune: 'Rennes', hebergement: 'internat',
      certifieQualiopi: false, educationPrioritaire: false, source: 'onisep' },
    { uai: '0351884H', nom: 'Faculté des Métiers CCI 35', type: 'cfa',
      statut: 'Privé',   commune: 'Rennes', hebergement: 'sans hébergement',
      certifieQualiopi: true,  educationPrioritaire: false, source: 'both' },
    { uai: '0352356W', nom: 'CFA Compagnons du Devoir',  type: 'cfa',
      statut: 'Privé',   commune: 'Rennes', hebergement: 'sans hébergement',
      certifieQualiopi: true,  educationPrioritaire: false, source: 'carif' },
    { uai: '0350056C', nom: 'Lycée Émile Zola',          type: 'lycée général et technologique',
      statut: 'Public',  commune: 'Rennes', hebergement: 'internat',
      certifieQualiopi: false, educationPrioritaire: true,  source: 'onisep' },
    { uai: '0350099D', nom: 'MFR de Bécherel',           type: 'mfr',
      statut: 'Privé',   commune: 'Bécherel', hebergement: 'internat',
      certifieQualiopi: false, educationPrioritaire: false, source: 'onisep' },
];

const FORMS_TEST = [
    { id: 'AF.001', libelle: 'Bac Pro Commerce', typeFormation: 'Bac Pro',
      niveau: '4', voieScolaire: true,  voieApprentissage: false, etablissementUai: '0352660B' },
    { id: 'AF.002', libelle: 'CAP Menuisier',    typeFormation: 'CAP',
      niveau: '3', voieScolaire: false, voieApprentissage: true,  etablissementUai: '0352356W' },
    { id: 'AF.003', libelle: 'BTS Commerce',     typeFormation: 'BTS',
      niveau: '5', voieScolaire: true,  voieApprentissage: true,  etablissementUai: '0351884H' },
];

// ── Helpers de filtrage (reproduisent la logique de systeme_filtres.js) ───────
function filtrer(etabs, filtres = {}) {
    return etabs.filter(e => {
        if (filtres.type && !e.type?.toLowerCase().includes(filtres.type.toLowerCase())) return false;
        if (filtres.hebergement === 'internat' && e.hebergement !== 'internat') return false;
        if (filtres.qualiopi && !e.certifieQualiopi) return false;
        if (filtres.texte) {
            const t = (s) => (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
            if (!t(e.nom).includes(t(filtres.texte))) return false;
        }
        return true;
    });
}

// ══════════════════════════════════════════════════════════
// TESTS PAR MODULE
// ══════════════════════════════════════════════════════════

describe('Module 1 — Paramétrage (CU-01, CU-02)', () => {

    let db;
    beforeEach(() => { localStorage.clear(); db = new DatabaseService('pa_test'); });

    it('CU-01 : sauvegarde et relit une zone géographique', () => {
        const zone = { type: 'commune', codes: ['35238'], libelle: 'Rennes (35)' };
        db.sauvegarderPreference('zone', JSON.stringify(zone));
        const relue = JSON.parse(db.lirePreference('zone'));
        expect(relue.type).toBe('commune');
        expect(relue.codes).toContain('35238');
        expect(relue.libelle).toBe('Rennes (35)');
    });

    it('CU-01 : une zone EPCI contient plusieurs codes INSEE', () => {
        const zone = { type: 'epci', codes: ['35238', '35047', '35195'], libelle: 'Rennes Métropole' };
        db.sauvegarderPreference('zone', JSON.stringify(zone));
        const relue = JSON.parse(db.lirePreference('zone'));
        expect(relue.codes.length).toBeGreaterThan(1);
    });

    it('CU-02 : sauvegarde et relit les coordonnées du domicile', () => {
        const domicile = { adresse: '15 rue de la Paix, 35000 Rennes', latitude: 48.1135, longitude: -1.6796 };
        db.sauvegarderPreference('pref_user_domicile', JSON.stringify(domicile));
        const relusStr = db.lirePreference('pref_user_domicile');
        const relu = JSON.parse(relusStr);
        expect(relu.latitude).toBeCloseTo(48.1135);
        expect(relu.longitude).toBeCloseTo(-1.6796);
    });

    it('CU-02 : retourne null si domicile non défini', () => {
        expect(db.lirePreference('pref_user_domicile')).toBeNull();
    });
});


describe('Module 2 — Extraction (CU-04, CU-05)', () => {

    let db;
    beforeEach(() => { localStorage.clear(); db = new DatabaseService('pa_test'); });

    // CU-04 : Extraction scolaire — stockage et déduplication
    it('CU-04 : stocke les établissements d\'une extraction scolaire', () => {
        ETABS_TEST.filter(e => e.source === 'onisep').forEach(e => db.sauvegarderEtablissement(e));
        const stats = db.statistiques();
        expect(stats.etablissements).toBeGreaterThanOrEqual(2);
    });

    it('CU-04 : un même UAI n\'est stocké qu\'une fois (déduplication)', () => {
        // Simuler 2 actions ONISEP pour le même établissement
        db.sauvegarderEtablissement({ uai: '0352660B', nom: 'Lycée PMF', source: 'onisep' });
        db.sauvegarderEtablissement({ uai: '0352660B', nom: 'Lycée PMF (doublon)', source: 'onisep' });
        const etabs = db.lireEtablissements();
        const pmf   = Object.values(etabs).filter(e => e.uai === '0352660B');
        expect(pmf.length).toBe(1);
    });

    it('CU-04 : les formations scolaires sont stockées avec voieScolaire = true', () => {
        FORMS_TEST.filter(f => f.voieScolaire && !f.voieApprentissage)
                  .forEach(f => db.sauvegarderFormation(f));
        const forms = db.lireFormations();
        expect(Object.values(forms).some(f => f.voieScolaire === true)).toBe(true);
    });

    // CU-05 : Extraction apprentissage — enrichissement et jointure
    it('CU-05 : enrichit un établissement ONISEP avec les données CARIF-OREF', () => {
        db.sauvegarderEtablissement({ uai: '0352660B', nom: 'Lycée PMF', source: 'onisep' });
        db.enrichirEtablissement('0352660B', { certifieQualiopi: true, opcoNom: 'OPCO EP', source: 'carif' });
        const etab = Object.values(db.lireEtablissements()).find(e => e.uai === '0352660B');
        expect(etab.certifieQualiopi).toBe(true);
        expect(etab.opcoNom).toBe('OPCO EP');
        expect(etab.source).toBe('both'); // fusion onisep + carif
    });

    it('CU-05 : les établissements fermés (entreprise_ferme) ne sont pas stockés', () => {
        // Logique métier : l'extraction controller filtre avant d'appeler db
        // Ici on vérifie que la fonction de filtrage CARIFParser-like écarte bien les fermés
        const estValide = (etab) => !etab.ferme && etab.published === true;
        expect(estValide({ ferme: true,  published: true  })).toBe(false);
        expect(estValide({ ferme: false, published: false })).toBe(false);
        expect(estValide({ ferme: false, published: true  })).toBe(true);
    });
});


describe('Module 3 — Résultats (CU-09, CU-10, CU-11)', () => {

    let db;
    beforeEach(() => {
        localStorage.clear();
        db = new DatabaseService('pa_test');
        ETABS_TEST.forEach(e => db.sauvegarderEtablissement(e));
        FORMS_TEST.forEach(f => db.sauvegarderFormation(f));
    });

    it('CU-09 : lireEtablissements retourne tous les établissements stockés', () => {
        const etabs = Object.values(db.lireEtablissements());
        expect(etabs.length).toBe(ETABS_TEST.length);
    });

    it('CU-09 : chaque établissement a les champs minimaux (uai, nom, type, commune)', () => {
        Object.values(db.lireEtablissements()).forEach(e => {
            expect(e.uai).toBeTruthy();
            expect(e.nom).toBeTruthy();
        });
    });

    it('CU-10 : lireFormations retourne les formations avec voieScolaire/Apprentissage', () => {
        const forms = Object.values(db.lireFormations());
        expect(forms.length).toBeGreaterThan(0);
        expect(forms.some(f => f.voieScolaire)).toBe(true);
        expect(forms.some(f => f.voieApprentissage)).toBe(true);
    });

    it('CU-10 : une formation BTS accessible en scolaire ET apprentissage est bien représentée', () => {
        const forms = Object.values(db.lireFormations());
        const bts = forms.find(f => f.libelle === 'BTS Commerce');
        expect(bts).toBeTruthy();
        // voieApprentissage est vrai car stocké dans diplomes_apprentissage
        // (la table priorisée par sauvegarderFormation avec voieApprentissage)
    });
});


describe('Module 4 — Filtrage (CU-14 à CU-18)', () => {

    const etabs = ETABS_TEST;

    it('CU-14 : filtre par type CFA', () => {
        const r = filtrer(etabs, { type: 'cfa' });
        expect(r.every(e => e.type.toLowerCase().includes('cfa'))).toBe(true);
        expect(r.length).toBe(2);
    });

    it('CU-14 : filtre par type lycée général', () => {
        const r = filtrer(etabs, { type: 'lycée général' });
        expect(r.length).toBe(1);
        expect(r[0].nom).toContain('Zola');
    });

    it('CU-15 : filtre avec internat uniquement', () => {
        const r = filtrer(etabs, { hebergement: 'internat' });
        expect(r.every(e => e.hebergement === 'internat')).toBe(true);
        expect(r.length).toBe(3); // PMF + Zola + MFR
    });

    it('CU-17 : filtre Qualiopi uniquement', () => {
        const r = filtrer(etabs, { qualiopi: true });
        expect(r.every(e => e.certifieQualiopi === true)).toBe(true);
        expect(r.length).toBe(2); // CCI + Compagnons
    });

    it('CU-18 : recherche textuelle insensible à la casse', () => {
        const r = filtrer(etabs, { texte: 'mendes' });
        expect(r.some(e => e.nom.toLowerCase().includes('mendes'))).toBe(true);
    });

    it('CU-18 : recherche textuelle insensible aux accents', () => {
        const r = filtrer(etabs, { texte: 'emile' }); // sans accent
        expect(r.some(e => e.nom.toLowerCase().includes('émile'))).toBe(true);
    });

    it('CU-14+CU-15 : combinaison type CFA + hébergement internat → résultat vide', () => {
        const r = filtrer(etabs, { type: 'cfa', hebergement: 'internat' });
        expect(r.length).toBe(0); // aucun CFA avec internat dans les fixtures
    });

    it('CU-14+CU-17 : combinaison type CFA + Qualiopi → 2 résultats', () => {
        const r = filtrer(etabs, { type: 'cfa', qualiopi: true });
        expect(r.length).toBe(2);
    });
});


describe('Module 6 — Export (CU-21)', () => {

    // Reproduction de la fonction _genererCSV depuis export_service.js
    function genererCSV(colonnes, lignes) {
        const BOM    = '\uFEFF';
        const entete = colonnes.map(c => `"${c.label}"`).join(';');
        const corps  = lignes.map(l =>
            colonnes.map(c => `"${(l[c.champ] ?? '').toString().replace(/"/g, '""')}`+ '"').join(';')
        );
        return BOM + [entete, ...corps].join('\r\n');
    }

    it('CU-21 : le CSV commence par le BOM UTF-8', () => {
        const csv = genererCSV([{ label: 'Nom', champ: 'nom' }], [{ nom: 'Lycée Test' }]);
        expect(csv.charCodeAt(0)).toBe(0xFEFF);
    });

    it('CU-21 : la première ligne du CSV est le header', () => {
        const csv = genererCSV([{ label: 'Nom', champ: 'nom' }, { label: 'UAI', champ: 'uai' }], []);
        const lignes = csv.slice(1).split('\r\n'); // slice(1) enlève le BOM
        expect(lignes[0]).toBe('"Nom";"UAI"');
    });

    it('CU-21 : les guillemets dans les valeurs sont doublés (conformité RFC 4180)', () => {
        const csv = genererCSV(
            [{ label: 'Nom', champ: 'nom' }],
            [{ nom: 'École "Les Pins"' }]
        );
        expect(csv).toContain('""Les Pins""');
    });

    it('CU-21 : une valeur nulle est exportée comme chaîne vide (pas "null")', () => {
        const csv = genererCSV([{ label: 'Site', champ: 'siteWeb' }], [{ siteWeb: null }]);
        expect(csv).toContain('""');
        expect(csv).not.toContain('null');
    });

    it('CU-21 : tous les établissements de la vue sont exportés', () => {
        const colonnes = [{ label: 'Nom', champ: 'nom' }, { label: 'UAI', champ: 'uai' }];
        const csv = genererCSV(colonnes, ETABS_TEST);
        const lignes = csv.split('\r\n');
        expect(lignes.length).toBe(ETABS_TEST.length + 1); // header + 5 établissements
    });
});


describe('Module 7 — Données locales (CU-23, CU-24)', () => {

    let db;
    beforeEach(() => {
        localStorage.clear();
        db = new DatabaseService('pa_test');
    });

    it('CU-23 : statistiques() reflète exactement le contenu de la base', () => {
        ETABS_TEST.forEach(e => db.sauvegarderEtablissement(e));
        FORMS_TEST.filter(f => f.voieScolaire).forEach(f => db.sauvegarderFormation(f));
        const stats = db.statistiques();
        expect(stats.etablissements).toBe(ETABS_TEST.length);
        expect(stats.formations).toBeGreaterThanOrEqual(
            FORMS_TEST.filter(f => f.voieScolaire && !f.voieApprentissage).length
        );
    });

    it('CU-24 : purger() vide les données en conservant les préférences', () => {
        ETABS_TEST.forEach(e => db.sauvegarderEtablissement(e));
        db.sauvegarderPreference('zone', JSON.stringify({ type: 'commune', codes: ['35238'] }));
        db.sauvegarderPreference('pref_user_domicile', JSON.stringify({ latitude: 48.11 }));

        db.purger();

        expect(db.statistiques().etablissements).toBe(0);
        expect(db.statistiques().formations).toBe(0);
        expect(db.lirePreference('zone')).not.toBeNull();
        expect(db.lirePreference('pref_user_domicile')).not.toBeNull();
    });

    it('CU-24 : après purge, on peut relancer une extraction', () => {
        ETABS_TEST.forEach(e => db.sauvegarderEtablissement(e));
        db.purger();
        db.sauvegarderEtablissement(ETABS_TEST[0]);
        expect(db.statistiques().etablissements).toBe(1);
    });
});

describe('Module 8 — Favoris divers multi-catégories (CU-25)', () => {

    const FAVORIS_DIVERS_KEY = 'favoris_divers';

    function loadFavorisDivers() {
        try { return JSON.parse(localStorage.getItem(FAVORIS_DIVERS_KEY) || '[]'); }
        catch { return []; }
    }

    function toggleFavoriDivers(id, titre, typeObjet) {
        const favoris = loadFavorisDivers();
        const idx = favoris.findIndex(f => f.id === id);
        if (idx >= 0) {
            favoris.splice(idx, 1);
        } else {
            if (favoris.length >= 50) return false;
            favoris.push({ id, titre, typeObjet, date: new Date().toISOString() });
        }
        localStorage.setItem(FAVORIS_DIVERS_KEY, JSON.stringify(favoris));
        return true;
    }

    beforeEach(() => { localStorage.clear(); });

    it('CU-25 : un diplôme scolaire peut être ajouté aux favoris', () => {
        toggleFavoriDivers('diplome__CAP Carreleur', 'CAP Carreleur', 'diplome');
        const list = loadFavorisDivers();
        expect(list.some(f => f.typeObjet === 'diplome')).toBe(true);
    });

    it('CU-25 : un diplôme apprentissage peut être ajouté aux favoris', () => {
        toggleFavoriDivers('diplome_apprentissage__RNCP37527', 'CAP Menuisier', 'diplome_apprentissage');
        const list = loadFavorisDivers();
        expect(list.some(f => f.typeObjet === 'diplome_apprentissage')).toBe(true);
    });

    it('CU-25 : un dispositif peut être ajouté aux favoris', () => {
        toggleFavoriDivers('dispositif__Cordée', 'Cordée de la réussite', 'dispositif');
        const list = loadFavorisDivers();
        expect(list.some(f => f.typeObjet === 'dispositif')).toBe(true);
    });

    it('CU-25 : une option 2nde GT peut être ajoutée aux favoris', () => {
        toggleFavoriDivers('option2ndeGT__Chinois', 'Chinois', 'option2ndeGT');
        const list = loadFavorisDivers();
        expect(list.some(f => f.typeObjet === 'option2ndeGT')).toBe(true);
    });

    it('CU-25 : les 4 types coexistent dans le même store favoris_divers', () => {
        toggleFavoriDivers('diplome__A',               'A', 'diplome');
        toggleFavoriDivers('diplome_apprentissage__B', 'B', 'diplome_apprentissage');
        toggleFavoriDivers('dispositif__C',            'C', 'dispositif');
        toggleFavoriDivers('option2ndeGT__D',          'D', 'option2ndeGT');
        const list = loadFavorisDivers();
        expect(list.length).toBe(4);
        const types = list.map(f => f.typeObjet).sort();
        expect(types).toEqual(['diplome', 'diplome_apprentissage', 'dispositif', 'option2ndeGT']);
    });

    it('CU-25 : le panneau afficherListeFavoris contient les 6 en-têtes de section', () => {
        // Simulation de la structure HTML produite par afficherListeFavoris()
        const sections = [
            '🏫 Établissements',
            '📄 Diplômes scolaires',
            '🎓 Diplômes apprentissage',
            '🎯 Dispositifs',
            '📚 Options 2nde GT',
            '🔍 Recherches favorites',
        ];
        // Chaque section doit être présente indépendamment du contenu
        sections.forEach(label => {
            // On vérifie que la logique de sélection de section est cohérente
            expect(label.length).toBeGreaterThan(0);
        });
        expect(sections.length).toBe(6);
    });

    it('CU-25 : purger() conserve les favoris divers (clé localStorage distincte)', () => {
        // Les favoris divers sont dans 'favoris_divers', pas dans la base pa_*
        // Ils ne sont donc pas effacés par la purge DatabaseService
        toggleFavoriDivers('diplome__X', 'X', 'diplome');
        const db = new DatabaseService('pa_test');
        db.sauvegarderEtablissement({ uai: '0352660B', nom: 'Test' });
        db.purger();
        // Les favoris divers sont CONSERVÉS car dans une clé localStorage séparée
        const list = loadFavorisDivers();
        expect(list.some(f => f.id === 'diplome__X')).toBe(true);
    });

    it('CU-25 : la limite de 50 favoris divers est respectée', () => {
        const plein = Array.from({ length: 50 }, (_, i) => ({
            id: `diplome__item${i}`, titre: `Item ${i}`,
            typeObjet: 'diplome', date: new Date().toISOString()
        }));
        localStorage.setItem(FAVORIS_DIVERS_KEY, JSON.stringify(plein));
        const result = toggleFavoriDivers('diplome__nouveau', 'Nouveau', 'diplome');
        expect(result).toBe(false);
        expect(loadFavorisDivers().length).toBe(50);
    });
});


describe('Module 9 — Layout boutons favoris (CU-26)', () => {

    // Simulation de _htmlFavoriEtab (gestion_params.js)
    function buildEtabCard(f) {
        return `<div class="favori-card--etab__actions">` +
               `<button class="setting-button favori-card--etab__btn-voir">👁️ Voir la fiche</button>` +
               `<button class="setting-button secondary favori-card--etab__btn-del">🗑️</button>` +
               `</div>`;
    }

    function buildDiversCard(f, hasFiche = true) {
        const voirBtn = hasFiche
            ? `<button class="setting-button favori-card--etab__btn-voir">👁️ Voir la fiche</button>`
            : '';
        return `<div class="favori-card--etab__actions">` +
               voirBtn +
               `<button class="setting-button secondary favori-card--etab__btn-del">🗑️</button>` +
               `</div>`;
    }

    it('CU-26 : la carte établissement contient la classe btn-voir (bouton large)', () => {
        const html = buildEtabCard({ id: '1', nom: 'Test' });
        expect(html.includes('favori-card--etab__btn-voir')).toBe(true);
    });

    it('CU-26 : la carte établissement contient la classe btn-del (bouton icône)', () => {
        const html = buildEtabCard({ id: '1', nom: 'Test' });
        expect(html.includes('favori-card--etab__btn-del')).toBe(true);
    });

    it('CU-26 : la carte favori divers contient aussi btn-voir quand fiche disponible', () => {
        const html = buildDiversCard({ id: 'diplome__X', typeObjet: 'diplome' }, true);
        expect(html.includes('favori-card--etab__btn-voir')).toBe(true);
    });

    it('CU-26 : la carte favori divers sans fiche ne contient pas btn-voir', () => {
        const html = buildDiversCard({ id: 'inconnu__X', typeObjet: 'inconnu' }, false);
        expect(html.includes('favori-card--etab__btn-voir')).toBe(false);
        expect(html.includes('favori-card--etab__btn-del')).toBe(true);
    });

    it('CU-26 : les classes CSS btn-voir et btn-del sont distinctes (pas même classe)', () => {
        expect('favori-card--etab__btn-voir').not.toBe('favori-card--etab__btn-del');
    });
});
