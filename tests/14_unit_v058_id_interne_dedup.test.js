/**
 * Tests v0.58 — ID interne numérique, unicité UAI+nom, triple nom,
 *               double libellé diplômes, dédup communes accent-insensible,
 *               logging erreurs d'unicité
 */

// ══════════════════════════════════════════════════════════
// MINIMAL FRAMEWORK (identique aux suites précédentes)
// ══════════════════════════════════════════════════════════

const results = { total: 0, passed: 0, failed: 0, errors: [] };

function describe(name, fn) {
    console.log(`\n╔══ ${name} ══╗`);
    fn();
}

function it(name, fn) {
    results.total++;
    try {
        fn();
        results.passed++;
        console.log(`  ✅ ${name}`);
    } catch (e) {
        results.failed++;
        results.errors.push({ test: name, error: e.message });
        console.log(`  ❌ ${name}\n     → ${e.message}`);
    }
}

function expect(val) {
    return {
        toBe(expected) {
            if (val !== expected) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(val)}`);
        },
        toEqual(expected) {
            if (JSON.stringify(val) !== JSON.stringify(expected))
                throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(val)}`);
        },
        toBeTruthy() { if (!val) throw new Error(`Expected truthy, got ${JSON.stringify(val)}`); },
        toBeFalsy()  { if (val)  throw new Error(`Expected falsy, got ${JSON.stringify(val)}`); },
        toBeNull()   { if (val !== null) throw new Error(`Expected null, got ${JSON.stringify(val)}`); },
        toContain(item) {
            if (typeof val === 'string') { if (!val.includes(item)) throw new Error(`"${val}" does not contain "${item}"`); }
            else if (Array.isArray(val)) { if (!val.includes(item)) throw new Error(`Array does not contain ${item}`); }
            else throw new Error(`Cannot check contain on ${typeof val}`);
        },
        toBeGreaterThan(n) { if (!(val > n)) throw new Error(`Expected ${val} > ${n}`); },
        toHaveLength(n) { if (val.length !== n) throw new Error(`Expected length ${n}, got ${val.length}`); },
        not: {
            toBe(expected) { if (val === expected) throw new Error(`Expected NOT ${JSON.stringify(expected)}`); },
            toBeNull() { if (val === null) throw new Error('Expected NOT null'); },
            toContain(item) {
                if (typeof val === 'string' && val.includes(item)) throw new Error(`"${val}" should not contain "${item}"`);
                if (Array.isArray(val) && val.includes(item)) throw new Error(`Array should not contain ${item}`);
            }
        }
    };
}

function runAll() {
    console.log('\n════════════════════════════════════════');
    console.log(`Total: ${results.total} | ✅ ${results.passed} | ❌ ${results.failed}`);
    if (results.errors.length > 0) {
        console.log('\nÉchecs:');
        results.errors.forEach(e => console.log(`  • ${e.test}: ${e.error}`));
    }
    console.log('════════════════════════════════════════');
    process.exit(results.failed > 0 ? 1 : 0);
}

// ══════════════════════════════════════════════════════════
// STUBS
// ══════════════════════════════════════════════════════════

// Stub global normaliserNomCommune / normaliserLibelleDiplome
global.normaliserNomCommune = (c) => {
    if (!c || typeof c !== 'string') return c;
    const particules = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'en', 'sur', 'sous', 'lès', 'l']);
    return c.toLowerCase().split(/(\s+|-)/g).map((part, idx) => {
        if (/^\s+$/.test(part) || part === '-') return part;
        if (idx > 0 && particules.has(part)) return part;
        return part.charAt(0).toUpperCase() + part.slice(1);
    }).join('');
};

global.normaliserLibelleDiplome = (l) => l; // passthrough pour les tests

global._communeDeduplicationKey = (c) => {
    if (!c || typeof c !== 'string') return '';
    return c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
};

// ══════════════════════════════════════════════════════════
// CHARGER LES MODULES
// ══════════════════════════════════════════════════════════

// Simuler window pour l'exposition globale des classes
global.window = global;
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.document = { dispatchEvent: () => {}, addEventListener: () => {} };
global.performance = { now: () => Date.now() };

const fs = require('fs');
const path = require('path');

// DatabaseService
eval(fs.readFileSync(path.join(__dirname, '..', 'js', 'database_service.js'), 'utf-8'));

// Parsers
eval(fs.readFileSync(path.join(__dirname, '..', 'js', 'onisep_parser.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '..', 'js', 'carif_oref_parser.js'), 'utf-8'));

// ══════════════════════════════════════════════════════════
// A. ID INTERNE NUMÉRIQUE + UNICITÉ UAI+NOM
// ══════════════════════════════════════════════════════════

describe('A. ID interne numérique séquentiel', () => {

    it('génère des IDs etab_1, etab_2, etab_3 séquentiels', async () => {
        const db = new DatabaseService('test_a1');
        const id1 = await db.insertEtablissement({ uai: '0352009U', nom: 'Lycée A', nomOnisep: 'Lycée A' });
        const id2 = await db.insertEtablissement({ uai: '0352010V', nom: 'Lycée B', nomOnisep: 'Lycée B' });
        const id3 = await db.insertEtablissement({ uai: '0352011W', nom: 'Lycée C', nomOnisep: 'Lycée C' });
        expect(id1).toBe('etab_1');
        expect(id2).toBe('etab_2');
        expect(id3).toBe('etab_3');
    });

    it('permet deux structures avec le même UAI mais des noms différents', async () => {
        const db = new DatabaseService('test_a2');
        const id1 = await db.insertEtablissement({
            uai: '0352009U', nom: 'Lycée Victor et Hélène Basch',
            nomOnisep: 'Lycée Victor et Hélène Basch'
        });
        const id2 = await db.insertEtablissement({
            uai: '0352009U', nom: 'Micro-lycée Victor et Hélène Basch',
            nomOnisep: 'Micro-lycée Victor et Hélène Basch'
        });
        expect(id1).not.toBe(id2);
        expect(id1).toBe('etab_1');
        expect(id2).toBe('etab_2');

        const all = await db.getAllEtablissements();
        expect(all).toHaveLength(2);
    });

    it('détecte un doublon UAI+nom identique et fusionne', async () => {
        const db = new DatabaseService('test_a3');
        const id1 = await db.insertEtablissement({
            uai: '0352009U', nom: 'Lycée Victor et Hélène Basch',
            nomOnisep: 'Lycée Victor et Hélène Basch'
        });
        const id2 = await db.insertEtablissement({
            uai: '0352009U', nom: 'Lycée Victor et Hélène Basch',
            nomOnisep: 'Lycée Victor et Hélène Basch', telephone: '02 99 54 44 43'
        });
        // Même clé → même ID retourné
        expect(id1).toBe(id2);
        const all = await db.getAllEtablissements();
        expect(all).toHaveLength(1);
        // Le téléphone a été fusionné
        expect(all[0].telephone).toBe('02 99 54 44 43');
    });

    it('refuse un établissement sans UAI ni SIRET', async () => {
        const db = new DatabaseService('test_a4');
        const id = await db.insertEtablissement({ nom: 'Orphelin' });
        expect(id).toBeNull();
    });

    it('getEtablissementsByUaiSync retourne les deux structures avec le même UAI', async () => {
        const db = new DatabaseService('test_a5');
        await db.insertEtablissement({ uai: '0352009U', nom: 'Lycée', nomOnisep: 'Lycée' });
        await db.insertEtablissement({ uai: '0352009U', nom: 'Micro-lycée', nomOnisep: 'Micro-lycée' });
        const all = db.getEtablissementsByUaiSync('0352009U');
        expect(all).toHaveLength(2);
    });
});

// ══════════════════════════════════════════════════════════
// B. TRIPLE NOM (nomOnisep, nomCarif, nom)
// ══════════════════════════════════════════════════════════

describe('B. Triple nom (nomOnisep, nomCarif, nom)', () => {

    it('OnisepParser stocke nomOnisep dans la structure', () => {
        const result = OnisepParser._parseStructureEnseignementSecondaire({
            code_uai: '0352009U', n_siret: '12345', nom: 'Lycée Test',
            type_detablissement: 'lycée', statut: 'public', commune: 'Rennes',
            commune_cog: '35238', departement: 'Ille-et-Vilaine', academie: 'Rennes',
            region: 'Bretagne', latitude_y: 48.12, longitude_x: -1.69
        });
        const etab = result.etablissements[0];
        expect(etab.nomOnisep).toBe('Lycée Test');
        expect(etab.nomCarif).toBeNull();
        expect(etab.nom).toBe('Lycée Test');
    });

    it('CARIFOREFParser stocke nomCarif dans la structure', () => {
        const result = CARIFOREFParser.parseEtablissements([{
            uai: '0352009U', siret: '12345',
            onisep_nom: 'CFA Test', enseigne: '', entreprise_raison_sociale: '',
            geo_coordonnees: '48.12,-1.69', localite: 'Rennes',
            nom_academie: 'Rennes', num_departement: '35', nom_departement: 'Ille-et-Vilaine',
            region_implantation_nom: 'Bretagne'
        }], false);
        const etab = result[0];
        expect(etab.nomCarif).toBe('CFA Test');
        expect(etab.nomOnisep).toBeNull();
        expect(etab.nom).toBe('CFA Test');
    });
});

// ══════════════════════════════════════════════════════════
// C. DOUBLE LIBELLÉ DIPLÔME
// ══════════════════════════════════════════════════════════

describe('C. Double libellé diplôme (source + normalisé)', () => {

    it('OnisepParser stocke libelleOnisep dans le diplôme', () => {
        const result = OnisepParser._parseActionLycee({
            formation_for_libelle: 'CAP Boulanger',
            ens_code_uai: '0352009U',
            action_de_formation_af_identifiant_onisep: 'AF123',
            for_type: 'diplôme', for_niveau_de_sortie: 'CAP ou équivalent'
        });
        const diplome = result.diplomes[0];
        expect(diplome.libelleOnisep).toBe('CAP Boulanger');
        expect(diplome.libelleCarif).toBeNull();
    });

    it('CARIFOREFParser stocke libelleCarif dans le diplôme', () => {
        const result = CARIFOREFParser._parseFormation({
            id: 'f1',
            etablissement_formateur_uai: '0352009U',
            rncp_code: 'RNCP37527',
            intitule_long: 'CAP - BOULANGER',
            diplome: 'CAP', niveau: '3-CAP'
        });
        const diplome = result.diplome;
        expect(diplome.libelleCarif).toBe('CAP - BOULANGER');
        expect(diplome.libelleOnisep).toBeNull();
    });
});

// ══════════════════════════════════════════════════════════
// D. DÉDUPLICATION COMMUNES ACCENT-INSENSIBLE
// ══════════════════════════════════════════════════════════

describe('D. Déduplication communes accent-insensible', () => {

    it('_communeDeduplicationKey produit la même clé avec ou sans accent', () => {
        expect(_communeDeduplicationKey('Cesson-Sévigné')).toBe(_communeDeduplicationKey('Cesson-Sevigne'));
        expect(_communeDeduplicationKey('Bruz')).toBe(_communeDeduplicationKey('BRUZ'));
        expect(_communeDeduplicationKey('Saint-Grégoire')).toBe(_communeDeduplicationKey('Saint-Gregoire'));
    });

    it('normaliserNomCommune préserve les accents existants', () => {
        expect(normaliserNomCommune('CESSON-SÉVIGNÉ')).toBe('Cesson-Sévigné');
        expect(normaliserNomCommune('SAINT-GRÉGOIRE')).toBe('Saint-Grégoire');
    });

    it('deux communes "Cesson-Sévigné" et "Cesson-Sevigne" ont la même clé de dédup', () => {
        const key1 = _communeDeduplicationKey('Cesson-Sévigné');
        const key2 = _communeDeduplicationKey('Cesson-Sevigne');
        expect(key1).toBe(key2);
    });
});

// ══════════════════════════════════════════════════════════
// E. LOGGING UNICITÉ SUR TOUTES LES TABLES
// ══════════════════════════════════════════════════════════

describe('E. Logging erreurs d\'unicité', () => {

    it('insertDiplome retourne le libellé même en cas de doublon', async () => {
        const db = new DatabaseService('test_e1');
        const id1 = await db.insertDiplome({ libelle: 'CAP Boulanger', type: 'diplôme' });
        const id2 = await db.insertDiplome({ libelle: 'CAP Boulanger', type: 'diplôme' });
        expect(id1).toBe('CAP Boulanger');
        expect(id2).toBe('CAP Boulanger');
    });

    it('insertDispositif logue les doublons', async () => {
        const db = new DatabaseService('test_e2');
        await db.insertDispositif({ libelle: 'Section européenne' });
        // Le deuxième insert logue un info mais ne crash pas
        const id = await db.insertDispositif({ libelle: 'Section européenne' });
        expect(id).toBe('Section européenne');
    });

    it('insertDiplomeApprentissage logue les doublons', async () => {
        const db = new DatabaseService('test_e3');
        await db.insertDiplomeApprentissage({ id: 'RNCP37527', libelle: 'CAP Boulanger' });
        const id = await db.insertDiplomeApprentissage({ id: 'RNCP37527', libelle: 'CAP Boulanger v2' });
        expect(id).toBe('RNCP37527');
    });

    it('insertEtablissement logue les doublons UAI+nom', async () => {
        const db = new DatabaseService('test_e4');
        await db.insertEtablissement({ uai: '0350001A', nom: 'Test', nomOnisep: 'Test' });
        // Même UAI+nom → fusion (log warning)
        const id = await db.insertEtablissement({ uai: '0350001A', nom: 'Test', nomOnisep: 'Test' });
        expect(id).toBe('etab_1'); // Même ID
    });
});

// ══════════════════════════════════════════════════════════
// F. RÉGRESSION — JOINTURES AVEC NOUVEAUX IDs
// ══════════════════════════════════════════════════════════

describe('F. Régression — jointures avec IDs numériques', () => {

    it('getEtablissementEnrichi fonctionne avec les IDs numériques', async () => {
        const db = new DatabaseService('test_f1');
        const id = await db.insertEtablissement({
            uai: '0352009U', nom: 'Lycée Test', nomOnisep: 'Lycée Test'
        });
        await db.insertDiplome({ libelle: 'CAP Boulanger' });
        await db.insertDiplomeParEtablissement({
            id: 'AF123', uai: '0352009U', libelle: 'CAP Boulanger', etabId: id
        });
        db.flush();

        const enrichi = await db.getEtablissementEnrichi(id);
        expect(enrichi).not.toBeNull();
        expect(enrichi.etablissement.nom).toBe('Lycée Test');
        expect(enrichi.diplomes).toHaveLength(1);
    });

    it('getDiplomeEnrichi retourne les établissements avec IDs numériques', async () => {
        const db = new DatabaseService('test_f2');
        const id = await db.insertEtablissement({
            uai: '0352009U', nom: 'Lycée Test', nomOnisep: 'Lycée Test'
        });
        await db.insertDiplome({ libelle: 'CAP Boulanger' });
        await db.insertDiplomeParEtablissement({
            id: 'AF123', uai: '0352009U', libelle: 'CAP Boulanger', etabId: id
        });
        db.flush();

        const enrichi = await db.getDiplomeEnrichi('CAP Boulanger');
        expect(enrichi).not.toBeNull();
        expect(enrichi.etablissements).toHaveLength(1);
    });
});

// ═══════════════════════════════════════════════════════
// G. getEtablissementByUaiSync(uai, nom) — signature stricte
// ═══════════════════════════════════════════════════════
describe('G. getEtablissementByUaiSync(uai, nom) — signature stricte', () => {

    it('retourne l\'établissement quand UAI et nom correspondent exactement', async () => {
        const db = new DatabaseService('test_g1');
        await db.insertEtablissement({
            uai: '0352009U', nom: 'Lycée Victor et Hélène Basch', nomOnisep: 'Lycée Victor et Hélène Basch'
        });
        const found = db.getEtablissementByUaiSync('0352009U', 'Lycée Victor et Hélène Basch');
        expect(found).not.toBeNull();
        expect(found.nom).toBe('Lycée Victor et Hélène Basch');
    });

    it('retourne null si le nom ne correspond pas', async () => {
        const db = new DatabaseService('test_g2');
        await db.insertEtablissement({
            uai: '0352009U', nom: 'Lycée Victor et Hélène Basch', nomOnisep: 'Lycée Victor et Hélène Basch'
        });
        const found = db.getEtablissementByUaiSync('0352009U', 'Micro-lycée Victor et Hélène Basch');
        expect(found).toBeNull();
    });

    it('retourne null si le nom est omis (pas de fallback premier trouvé)', async () => {
        const db = new DatabaseService('test_g3');
        await db.insertEtablissement({
            uai: '0352009U', nom: 'Lycée Victor et Hélène Basch', nomOnisep: 'Lycée Victor et Hélène Basch'
        });
        const found = db.getEtablissementByUaiSync('0352009U');
        expect(found).toBeNull();
    });

    it('la recherche est insensible à la casse', async () => {
        const db = new DatabaseService('test_g4');
        await db.insertEtablissement({
            uai: '0352009U', nom: 'Lycée Victor et Hélène Basch', nomOnisep: 'Lycée Victor et Hélène Basch'
        });
        const found = db.getEtablissementByUaiSync('0352009U', 'lycée victor et hélène basch');
        expect(found).not.toBeNull();
    });

    it('distingue deux structures avec le même UAI mais des noms différents', async () => {
        const db = new DatabaseService('test_g5');
        const id1 = await db.insertEtablissement({
            uai: '0352009U', nom: 'Lycée Victor et Hélène Basch', nomOnisep: 'Lycée Victor et Hélène Basch'
        });
        const id2 = await db.insertEtablissement({
            uai: '0352009U', nom: 'Micro-lycée Victor et Hélène Basch', nomOnisep: 'Micro-lycée Victor et Hélène Basch'
        });
        const lycee = db.getEtablissementByUaiSync('0352009U', 'Lycée Victor et Hélène Basch');
        const micro = db.getEtablissementByUaiSync('0352009U', 'Micro-lycée Victor et Hélène Basch');
        expect(lycee._id).toBe(id1);
        expect(micro._id).toBe(id2);
        expect(lycee._id).not.toBe(micro._id);
    });
});

// ═══════════════════════════════════════════════════════
// H. Jointures par etabId uniquement (sans fallback UAI)
// ═══════════════════════════════════════════════════════
describe('H. Jointures par etabId uniquement (sans fallback UAI)', () => {

    it('getDiplomesParEtablissementSync filtre par etabId, pas par UAI', async () => {
        const db = new DatabaseService('test_h1');
        const id1 = await db.insertEtablissement({
            uai: '0352009U', nom: 'Lycée A', nomOnisep: 'Lycée A'
        });
        const id2 = await db.insertEtablissement({
            uai: '0352009U', nom: 'Micro-lycée A', nomOnisep: 'Micro-lycée A'
        });
        await db.insertDiplome({ libelle: 'CAP Boulanger' });
        await db.insertDiplome({ libelle: 'Bac pro Cuisine' });
        // Relation : CAP Boulanger → Lycée A, Bac pro Cuisine → Micro-lycée A
        await db.insertDiplomeParEtablissement({ id: 'r1', libelle: 'CAP Boulanger', etabId: id1 });
        await db.insertDiplomeParEtablissement({ id: 'r2', libelle: 'Bac pro Cuisine', etabId: id2 });

        const diplomes1 = db.getDiplomesParEtablissementSync(id1);
        const diplomes2 = db.getDiplomesParEtablissementSync(id2);
        // Chaque établissement ne doit voir QUE ses propres diplômes
        expect(diplomes1).toHaveLength(1);
        expect(diplomes1[0].libelle).toBe('CAP Boulanger');
        expect(diplomes2).toHaveLength(1);
        expect(diplomes2[0].libelle).toBe('Bac pro Cuisine');
    });

    it('fusionnerEtablissementAprentissage enrichit via getEtablissementsByUaiSync', async () => {
        const db = new DatabaseService('test_h2');
        const idOnisep = await db.insertEtablissement({
            uai: '0352009U', nom: 'Lycée Victor', nomOnisep: 'Lycée Victor', academie: 'Rennes'
        });
        const fusId = await db.fusionnerEtablissementAprentissage({
            uai: '0352009U', nom: 'LYCEE VICTOR', nomCarif: 'LYCEE VICTOR',
            certifieQualite: true
        });
        expect(fusId).toBe(idOnisep);
        const etab = await db.getEtablissement(fusId);
        expect(etab.academie).toBe('Rennes');        // Champ ONISEP conservé
        expect(etab.nomCarif).toBe('LYCEE VICTOR');   // Nom CARIF ajouté
    });

    it('enrichirEtablissement prend un _id, pas un UAI', async () => {
        const db = new DatabaseService('test_h3');
        const id = await db.insertEtablissement({
            uai: '0352009U', nom: 'Lycée Test', nomOnisep: 'Lycée Test'
        });
        const success = db.enrichirEtablissement(id, { telephone: '01 23 45 67 89' });
        expect(success).toBe(true);
        const etab = await db.getEtablissement(id);
        expect(etab.telephone).toBe('01 23 45 67 89');
        // Par UAI : doit échouer
        const fail = db.enrichirEtablissement('0352009U', { siteWeb: 'http://test.fr' });
        expect(fail).toBe(false);
    });
});

// ══════════════════════════════════════════════════════════
// I. Compteurs établissements via etabId (P2)
// ══════════════════════════════════════════════════════════
describe('I. Compteurs par etabId dans les vues résultats', () => {
    it('les relations comptent par etabId et non par UAI', async () => {
        const db = new DatabaseService('test_i1');
        const id1 = await db.insertEtablissement({
            uai: '0352009U', nom: 'Lycée VHB', nomOnisep: 'Lycée VHB'
        });
        const id2 = await db.insertEtablissement({
            uai: '0352009U', nom: 'Micro-lycée VHB', nomOnisep: 'Micro-lycée VHB'
        });
        // Deux relations même diplôme, deux établissements
        await db.insertDiplome({ libelle: 'Bac pro Commerce' });
        await db.insertDiplomeParEtablissement({ libelle: 'Bac pro Commerce', uai: '0352009U', etabId: id1 });
        await db.insertDiplomeParEtablissement({ libelle: 'Bac pro Commerce', uai: '0352009U', etabId: id2 });

        const rels = await db.getAllDiplomesParEtablissement();
        // Compter par etabId
        const comptage = {};
        for (const rel of rels) {
            const key = rel.libelle;
            if (!comptage[key]) comptage[key] = new Set();
            comptage[key].add(rel.etabId || rel.uai);
        }
        // Avec etabId : 2 établissements distincts
        expect(comptage['Bac pro Commerce'].size).toBe(2);
    });
});

// ══════════════════════════════════════════════════════════
// J. autresFormations indexées par _id (P3)
// ══════════════════════════════════════════════════════════
describe('J. autresFormations stockées par _id interne', () => {
    it('insertAutresFormationsParEtablissement stocke par _id', async () => {
        const db = new DatabaseService('test_j1');
        const id1 = await db.insertEtablissement({
            uai: '0352009U', nom: 'Lycée VHB', nomOnisep: 'Lycée VHB'
        });
        const id2 = await db.insertEtablissement({
            uai: '0352009U', nom: 'Micro-lycée VHB', nomOnisep: 'Micro-lycée VHB'
        });
        await db.insertAutresFormationsParEtablissement(id1, [
            { libelle: 'BTS Commerce', niveau: 'bac+2' }
        ]);
        await db.insertAutresFormationsParEtablissement(id2, [
            { libelle: 'BTS Tourisme', niveau: 'bac+2' }
        ]);
        // Chaque structure reçoit ses propres formations
        const f1 = db.getAutresFormationsParEtablissement(id1);
        const f2 = db.getAutresFormationsParEtablissement(id2);
        expect(f1).toHaveLength(1);
        expect(f1[0].libelle).toBe('BTS Commerce');
        expect(f2).toHaveLength(1);
        expect(f2[0].libelle).toBe('BTS Tourisme');
        // Par UAI : ne trouve rien (pas d'index par UAI)
        const fUai = db.getAutresFormationsParEtablissement('0352009U');
        expect(fUai).toHaveLength(0);
    });
});

// ══════════════════════════════════════════════════════════
// K. getOptionsDisponiblesParPerimetre sans fallback UAI (P3)
// ══════════════════════════════════════════════════════════
describe('K. Jointure options sans fallback UAI', () => {
    it('getOptionsDisponiblesParPerimetre joint par etabId uniquement', async () => {
        const db = new DatabaseService('test_k1');
        const id1 = await db.insertEtablissement({
            uai: '0352009U', nom: 'Lycée VHB', nomOnisep: 'Lycée VHB',
            departement: '35 - Ille-et-Vilaine'
        });
        // Relation AVEC etabId → doit être jointe
        await db.insertOption2ndeGT({ libelle: 'Latin' });
        await db.insertOption2ndeGTParEtablissement({
            id: 'opt1', libelle: 'Latin', uai: '0352009U', etabId: id1
        });
        // Relation SANS etabId → ne doit PAS être jointe (pas de fallback UAI)
        await db.insertOption2ndeGT({ libelle: 'Grec ancien' });
        await db.insertOption2ndeGTParEtablissement({
            id: 'opt2', libelle: 'Grec ancien', uai: '0352009U'
            // pas de etabId → fallback UAI supprimé
        });

        const options = await db.getOptionsDisponiblesParPerimetre('departement', '35 - Ille-et-Vilaine');
        expect(options).toContain('Latin');
        expect(options).not.toContain('Grec ancien');
    });
});

// ══════════════════════════════════════════════════════════
// L. Export PDF utilise _id (P3)
// ══════════════════════════════════════════════════════════
describe('L. Export et details_modal sans fallback UAI', () => {
    it('getEtablissementEnrichi retourne null si on passe un UAI', async () => {
        const db = new DatabaseService('test_l1');
        await db.insertEtablissement({
            uai: '0352009U', nom: 'Lycée VHB', nomOnisep: 'Lycée VHB'
        });
        // Par UAI : ne fonctionne pas (attend _id)
        const enrichi = await db.getEtablissementEnrichi('0352009U');
        expect(enrichi).toBeNull();
    });
});

// ══════════════════════════════════════════════════════════
runAll();
