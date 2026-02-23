/**
 * @file 05_unit_db_service_v045.test.js
 * @description Tests unitaires pour l'interface v0.45 de DatabaseService.
 *
 * Couvre : sauvegarderEtablissement, enrichirEtablissement, lireEtablissements,
 *          sauvegarderFormation, lireFormations, statistiques, purger,
 *          sauvegarderPreference, lirePreference.
 *
 * Prérequis : Node.js ≥ 18, jest
 * Lancement : jest tests/05_unit_db_service_v045.test.js
 */

'use strict';

// ── Shim localStorage pour Node.js ──────────────────────
const _store = {};
global.localStorage = {
    getItem:    k     => _store[k] ?? null,
    setItem:    (k,v) => { _store[k] = String(v); },
    removeItem: k     => { delete _store[k]; },
    clear:      ()    => { Object.keys(_store).forEach(k => delete _store[k]); },
};

// ── Chargement de la classe ──────────────────────────────
// On importe database_service.js en Node via eval (pas de module bundler)
const fs   = require('fs');
const path = require('path');

function _genId() { return Math.random().toString(36).slice(2, 10).padEnd(8, '0'); }
eval(fs.readFileSync(path.join(__dirname, '../js/database_service.js'), 'utf8'));

// ══════════════════════════════════════════════════════════
// FIXTURES
// ══════════════════════════════════════════════════════════
const ETAB_A = {
    uai: '0352660B', nom: 'Lycée PMF', type: 'lycée professionnel',
    statut: 'Public', commune: 'Rennes', source: 'onisep',
};
const ETAB_B = {
    uai: '0351884H', nom: 'Faculté des Métiers', type: 'cfa',
    statut: 'Privé', commune: 'Rennes', source: 'carif',
    certifieQualiopi: true,
};
const FORM_A = {
    id: 'AF.13521', libelle: 'Bac Pro Commerce', typeFormation: 'Bac Pro',
    niveau: '4', voieScolaire: true, voieApprentissage: false,
    etablissementUai: '0352660B',
};

// ══════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════

describe('DatabaseService v0.45 — Interface simplifiée', () => {

    let db;

    beforeEach(() => {
        localStorage.clear();
        db = new DatabaseService('pa_test');
    });

    // ── sauvegarderEtablissement / lireEtablissements ──────

    describe('sauvegarderEtablissement()', () => {
        it('stocke un établissement et le retrouve', () => {
            db.sauvegarderEtablissement(ETAB_A);
            const etabs = db.lireEtablissements();
            const found = Object.values(etabs).find(e => e.uai === '0352660B');
            expect(found).toBeTruthy();
            expect(found.nom).toBe('Lycée PMF');
        });

        it('génère un _id si absent', () => {
            db.sauvegarderEtablissement({ uai: 'AAAAAAAA', nom: 'Test' });
            const etabs = db.lireEtablissements();
            const found = Object.values(etabs).find(e => e.uai === 'AAAAAAAA');
            expect(found._id).toBeTruthy();
        });

        it('met à jour un établissement existant (même UAI)', () => {
            db.sauvegarderEtablissement(ETAB_A);
            db.sauvegarderEtablissement({ uai: '0352660B', nom: 'Nouveau Nom' });
            const etabs = db.lireEtablissements();
            const found = Object.values(etabs).filter(e => e.uai === '0352660B');
            expect(found.length).toBe(1); // pas de doublon
            expect(found[0].nom).toBe('Nouveau Nom');
        });

        it('stocke plusieurs établissements distincts', () => {
            db.sauvegarderEtablissement(ETAB_A);
            db.sauvegarderEtablissement(ETAB_B);
            const etabs = db.lireEtablissements();
            expect(Object.keys(etabs).length).toBe(2);
        });
    });

    // ── enrichirEtablissement ─────────────────────────────

    describe('enrichirEtablissement()', () => {
        it('ajoute des champs sans écraser les existants', () => {
            db.sauvegarderEtablissement({ uai: '0352660B', nom: 'PMF', hebergement: 'internat' });
            db.enrichirEtablissement('0352660B', { hebergement: 'externat', siteWeb: 'https://pmf.fr' });
            const etabs = db.lireEtablissements();
            const etab  = Object.values(etabs).find(e => e.uai === '0352660B');
            expect(etab.hebergement).toBe('internat'); // non écrasé
            expect(etab.siteWeb).toBe('https://pmf.fr'); // ajouté
        });

        it('met source à "both" lors de la fusion onisep+carif', () => {
            db.sauvegarderEtablissement({ uai: '0352660B', source: 'onisep' });
            db.enrichirEtablissement('0352660B', { source: 'carif', certifieQualiopi: true });
            const etabs = db.lireEtablissements();
            const etab  = Object.values(etabs).find(e => e.uai === '0352660B');
            expect(etab.source).toBe('both');
        });

        it('retourne false si UAI inconnu', () => {
            const result = db.enrichirEtablissement('INCONNU', { nom: 'Test' });
            expect(result).toBe(false);
        });

        it('ajoute les champs manquants (null → valeur)', () => {
            db.sauvegarderEtablissement({ uai: '0352660B', telephone: null });
            db.enrichirEtablissement('0352660B', { telephone: '02 99 00 00 00' });
            const etabs = db.lireEtablissements();
            const etab  = Object.values(etabs).find(e => e.uai === '0352660B');
            expect(etab.telephone).toBe('02 99 00 00 00');
        });
    });

    // ── sauvegarderFormation / lireFormations ─────────────

    describe('sauvegarderFormation() / lireFormations()', () => {
        it('stocke une formation scolaire', () => {
            db.sauvegarderFormation(FORM_A);
            const forms = db.lireFormations();
            expect(forms['AF.13521']).toBeTruthy();
            expect(forms['AF.13521'].libelle).toBe('Bac Pro Commerce');
        });

        it('marque voieScolaire = true pour une formation scolaire', () => {
            db.sauvegarderFormation(FORM_A);
            expect(db.lireFormations()['AF.13521'].voieScolaire).toBe(true);
        });

        it('stocke une formation apprentissage dans la table correcte', () => {
            db.sauvegarderFormation({ id: 'CARIF_01', libelle: 'CAP', voieScolaire: false, voieApprentissage: true });
            const forms = db.lireFormations();
            expect(forms['CARIF_01'].voieApprentissage).toBe(true);
        });
    });

    // ── statistiques ──────────────────────────────────────

    describe('statistiques()', () => {
        it('compte les établissements et formations', () => {
            db.sauvegarderEtablissement(ETAB_A);
            db.sauvegarderEtablissement(ETAB_B);
            db.sauvegarderFormation(FORM_A);
            const stats = db.statistiques();
            expect(stats.etablissements).toBe(2);
            expect(stats.formations).toBe(1);
        });

        it('retourne 0 pour une base vide', () => {
            const stats = db.statistiques();
            expect(stats.etablissements).toBe(0);
            expect(stats.formations).toBe(0);
        });
    });

    // ── purger ────────────────────────────────────────────

    describe('purger()', () => {
        it('efface les données mais conserve les préférences', () => {
            db.sauvegarderEtablissement(ETAB_A);
            db.sauvegarderPreference('zone', JSON.stringify({ type: 'commune', codes: ['35238'] }));
            db.purger();
            expect(db.statistiques().etablissements).toBe(0);
            expect(db.lirePreference('zone')).not.toBeNull();
        });

        it('remet les stats à zéro', () => {
            db.sauvegarderEtablissement(ETAB_A);
            db.sauvegarderFormation(FORM_A);
            db.purger();
            const stats = db.statistiques();
            expect(stats.etablissements).toBe(0);
            expect(stats.formations).toBe(0);
        });
    });

    // ── préférences ───────────────────────────────────────

    describe('sauvegarderPreference() / lirePreference()', () => {
        it('stocke et relit une préférence', () => {
            db.sauvegarderPreference('theme', 'dark');
            expect(db.lirePreference('theme')).toBe('dark');
        });

        it('retourne null pour une clé inexistante', () => {
            expect(db.lirePreference('inexistant')).toBeNull();
        });

        it('écrase une préférence existante', () => {
            db.sauvegarderPreference('theme', 'light');
            db.sauvegarderPreference('theme', 'dark');
            expect(db.lirePreference('theme')).toBe('dark');
        });

        it('supporte l\'objet de préférences multiples', () => {
            db.sauvegarderPreference({ couleur: 'bleu', taille: 'grand' });
            expect(db.lirePreference('couleur')).toBe('bleu');
            expect(db.lirePreference('taille')).toBe('grand');
        });
    });

    // ── cohérence après flush ─────────────────────────────

    describe('Persistance (flush + rechargement)', () => {
        it('retrouve les données après rechargement depuis localStorage', () => {
            db.sauvegarderEtablissement(ETAB_A);
            db.flush();
            // Recréer une instance qui lit le même localStorage
            const db2 = new DatabaseService('pa_test');
            const etabs = db2.lireEtablissements();
            const found = Object.values(etabs).find(e => e.uai === '0352660B');
            expect(found).toBeTruthy();
            expect(found.nom).toBe('Lycée PMF');
        });
    });
});
