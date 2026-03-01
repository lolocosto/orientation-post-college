/**
 * Tests unitaires v0.61 — Tri canonique des catégories de formations
 * 
 * Couvre :
 *   - T-TRI-01 à T-TRI-08 : getRangCategorie — classement individuel
 *   - T-TRI-09 à T-TRI-14 : trierCategories — tri de listes
 *   - T-TRI-15 à T-TRI-18 : groupDiplomesByCategorie — regroupement + tri
 *   - T-TRI-19 à T-TRI-21 : intégration avec les données CARIF-OREF
 *
 * @version 0.61
 */

// ══════════════════════════════════════════════════════════
// SIMULATION DES FONCTIONS À TESTER
// (Copie des fonctions de gestion_onglet_resultats.js)
// ══════════════════════════════════════════════════════════

const ORDRE_CATEGORIES_FORMATIONS = [
    { rang: 100, patterns: ['cap ou équivalent', 'cap', '3 (cap', '3(cap', 'niveau 3'] },
    { rang: 100, exact: ['niveau v'] },
    { rang: 101, exact: ['3'] },
    { rang: 200, patterns: ['seconde', '2nde', '2de', 'classe de 2'] },
    { rang: 250, patterns: ['première', 'premiere', '1re', '1ère', 'classe de 1'] },
    { rang: 300, patterns: ['bac général', 'bac general'] },
    { rang: 310, patterns: ['bac technologique', 'bac techno'] },
    { rang: 320, patterns: ['bac professionnel', 'bac pro'] },
    { rang: 330, patterns: ['bac ou équivalent', 'bac ou equivalent'] },
    { rang: 340, patterns: ['4 (bac', '4(bac', 'niveau 4'] },
    { rang: 340, exact: ['niveau iv'] },
    { rang: 341, exact: ['4'] },
    { rang: 400, patterns: ['bac + 1', 'bac+1'] },
    { rang: 500, patterns: ['bac + 2', 'bac+2', 'bts ou équivalent', 'bts ou equivalent'] },
    { rang: 510, patterns: ['5 (bts', '5(bts', 'niveau 5'] },
    { rang: 510, exact: ['niveau iii'] },
    { rang: 511, exact: ['5'] },
    { rang: 600, patterns: ['bac + 3', 'bac+3', 'licence'] },
    { rang: 650, patterns: ['bac + 4', 'bac+4', 'maîtrise', 'maitrise'] },
    { rang: 660, patterns: ['6 (licence', '6(licence', 'niveau 6'] },
    { rang: 660, exact: ['niveau ii'] },
    { rang: 661, exact: ['6'] },
    { rang: 700, patterns: ['bac + 5', 'bac+5', 'master', 'ingénieur', 'ingenieur'] },
    { rang: 710, patterns: ['7 (master', '7(master', 'niveau 7'] },
    { rang: 710, exact: ['niveau i'] },
    { rang: 711, exact: ['7'] },
    { rang: 800, patterns: ['bac + 8', 'bac+8', 'doctorat'] },
    { rang: 810, patterns: ['8 (doctorat', '8(doctorat', 'niveau 8'] },
    { rang: 811, exact: ['8'] },
];

function getRangCategorie(categorie) {
    if (!categorie) return 9999;
    const lower = categorie.toLowerCase().trim();
    if (lower === 'autre' || lower === '') return 9999;
    // Passe 1 : exact
    for (const entry of ORDRE_CATEGORIES_FORMATIONS) {
        if (entry.exact) {
            for (const pattern of entry.exact) {
                if (lower === pattern) return entry.rang;
            }
        }
    }
    // Passe 2 : includes
    for (const entry of ORDRE_CATEGORIES_FORMATIONS) {
        if (entry.patterns) {
            for (const pattern of entry.patterns) {
                if (lower.includes(pattern) || lower.startsWith(pattern)) return entry.rang;
            }
        }
    }
    return 9999;
}

function trierCategories(categories) {
    return [...categories].sort((a, b) => {
        const rangA = getRangCategorie(a);
        const rangB = getRangCategorie(b);
        if (rangA !== rangB) return rangA - rangB;
        return a.localeCompare(b, 'fr');
    });
}

function groupDiplomesByCategorie(diplomes) {
    const groupes = {};
    for (const diplome of diplomes) {
        const cat = diplome.niveauSortie || 'Autre';
        if (!groupes[cat]) groupes[cat] = [];
        groupes[cat].push(diplome);
    }
    const categoriesTriees = trierCategories(Object.keys(groupes));
    const result = {};
    for (const cat of categoriesTriees) {
        result[cat] = groupes[cat].sort((a, b) =>
            (a.libelle || '').localeCompare(b.libelle || '', 'fr')
        );
    }
    return result;
}

// ══════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════

describe('T-TRI : getRangCategorie — rang individuel', () => {

    test('T-TRI-01 : Niveaux 3 (CAP)', () => {
        expect(getRangCategorie('CAP ou équivalent')).toBe(100);
        expect(getRangCategorie('CAP')).toBe(100);
        expect(getRangCategorie('3 (CAP...)')).toBe(100);
        expect(getRangCategorie('3')).toBe(101);
    });

    test('T-TRI-02 : Intermédiaire 3→4 (seconde, première)', () => {
        expect(getRangCategorie('seconde')).toBe(200);
        expect(getRangCategorie('2nde')).toBe(200);
        expect(getRangCategorie('1re')).toBe(250);
        expect(getRangCategorie('première')).toBe(250);
        // seconde < première
        expect(getRangCategorie('seconde')).toBeLessThan(getRangCategorie('1re'));
    });

    test('T-TRI-03 : Niveaux 4 (Bac)', () => {
        expect(getRangCategorie('bac général')).toBe(300);
        expect(getRangCategorie('bac technologique')).toBe(310);
        expect(getRangCategorie('bac professionnel')).toBe(320);
        expect(getRangCategorie('bac ou équivalent')).toBe(330);
        expect(getRangCategorie('4 (BAC...)')).toBe(340);
        expect(getRangCategorie('4')).toBe(341);
        // Ordre : général < techno < pro < équivalent
        expect(getRangCategorie('bac général')).toBeLessThan(getRangCategorie('bac technologique'));
        expect(getRangCategorie('bac technologique')).toBeLessThan(getRangCategorie('bac professionnel'));
    });

    test('T-TRI-04 : Intermédiaire 4→5 (Bac+1)', () => {
        expect(getRangCategorie('bac + 1')).toBe(400);
        expect(getRangCategorie('bac+1')).toBe(400);
    });

    test('T-TRI-05 : Niveaux 5 (BTS, Bac+2)', () => {
        expect(getRangCategorie('bac + 2')).toBe(500);
        expect(getRangCategorie('BTS ou équivalent')).toBe(500);
        expect(getRangCategorie('5 (BTS...)')).toBe(510);
        expect(getRangCategorie('5')).toBe(511);
    });

    test('T-TRI-06 : Niveaux 6 (Licence, Bac+3/4)', () => {
        expect(getRangCategorie('bac + 3')).toBe(600);
        expect(getRangCategorie('Licence pro Commerce')).toBe(600);
        expect(getRangCategorie('bac + 4')).toBe(650);
        expect(getRangCategorie('6 (Licence...)')).toBe(660);
        expect(getRangCategorie('6')).toBe(661);
    });

    test('T-TRI-07 : Niveaux 7-8 (Master, Doctorat)', () => {
        expect(getRangCategorie('Master')).toBe(700);
        expect(getRangCategorie('7 (Master...)')).toBe(710);
        expect(getRangCategorie('7')).toBe(711);
        expect(getRangCategorie('Doctorat')).toBe(800);
        expect(getRangCategorie('8')).toBe(811);
    });

    test('T-TRI-08 : Catégories inconnues / vides → 9999', () => {
        expect(getRangCategorie('Autre')).toBe(9999);
        expect(getRangCategorie('')).toBe(9999);
        expect(getRangCategorie(null)).toBe(9999);
        expect(getRangCategorie(undefined)).toBe(9999);
        expect(getRangCategorie('Inconnu')).toBe(9999);
    });

    test('T-TRI-08b : Ancien système en chiffres romains (V, IV, III, II, I)', () => {
        // V = niveau 3 (CAP)
        expect(getRangCategorie('niveau V')).toBe(100);
        // IV = niveau 4 (Bac)
        expect(getRangCategorie('niveau IV')).toBe(340);
        // III = niveau 5 (BTS)
        expect(getRangCategorie('niveau III')).toBe(510);
        // II = niveau 6 (Licence)
        expect(getRangCategorie('niveau II')).toBe(660);
        // I = niveau 7 (Master/Ingé) — par défaut car I couvre aussi 8
        expect(getRangCategorie('niveau I')).toBe(710);
    });

    test('T-TRI-08c : Chiffres romains ne se confondent pas entre eux', () => {
        // "niveau I" ne doit PAS matcher comme "niveau III" ou "niveau II"
        expect(getRangCategorie('niveau I')).not.toBe(getRangCategorie('niveau II'));
        expect(getRangCategorie('niveau I')).not.toBe(getRangCategorie('niveau III'));
        expect(getRangCategorie('niveau II')).not.toBe(getRangCategorie('niveau III'));
        // "niveau IV" ne doit PAS matcher comme "niveau I"
        expect(getRangCategorie('niveau IV')).not.toBe(getRangCategorie('niveau I'));
        // Vérifier l'ordre : V < IV < III < II < I
        expect(getRangCategorie('niveau V')).toBeLessThan(getRangCategorie('niveau IV'));
        expect(getRangCategorie('niveau IV')).toBeLessThan(getRangCategorie('niveau III'));
        expect(getRangCategorie('niveau III')).toBeLessThan(getRangCategorie('niveau II'));
        expect(getRangCategorie('niveau II')).toBeLessThan(getRangCategorie('niveau I'));
    });
});

describe('T-TRI : trierCategories — tri de listes', () => {

    test('T-TRI-09 : Ordre complet niveau 3 → niveau 8', () => {
        const input = ['bac + 2', 'CAP ou équivalent', 'bac ou équivalent', 'bac + 1', 'Autre'];
        const result = trierCategories(input);
        expect(result).toEqual([
            'CAP ou équivalent',
            'bac ou équivalent',
            'bac + 1',
            'bac + 2',
            'Autre'
        ]);
    });

    test('T-TRI-10 : Bacs dans le bon ordre', () => {
        const input = ['bac professionnel', 'bac général', 'bac technologique'];
        const result = trierCategories(input);
        expect(result).toEqual(['bac général', 'bac technologique', 'bac professionnel']);
    });

    test('T-TRI-11 : Mélange ONISEP + CARIF-OREF', () => {
        const input = ['5 (BTS...)', 'CAP ou équivalent', '3 (CAP...)', 'bac ou équivalent', '6 (Licence...)'];
        const result = trierCategories(input);
        // Les 2 premiers sont rang 100 (triés alphabétiquement entre eux)
        expect(result[0]).toBe('3 (CAP...)');
        expect(result[1]).toBe('CAP ou équivalent');
        expect(result[2]).toBe('bac ou équivalent');
    });

    test('T-TRI-12 : Seconde avant première avant bac', () => {
        const input = ['bac ou équivalent', '1re', 'seconde', 'CAP ou équivalent'];
        const result = trierCategories(input);
        expect(result).toEqual([
            'CAP ou équivalent',
            'seconde',
            '1re',
            'bac ou équivalent'
        ]);
    });

    test('T-TRI-13 : Catégories identiques → tri alphabétique', () => {
        const input = ['Zébulon', 'Alpha'];
        const result = trierCategories(input);
        expect(result).toEqual(['Alpha', 'Zébulon']); // les 2 sont rang 9999
    });

    test('T-TRI-14 : Liste vide → liste vide', () => {
        expect(trierCategories([])).toEqual([]);
    });
});

describe('T-TRI : groupDiplomesByCategorie — regroupement + tri', () => {

    test('T-TRI-15 : Groupement basique et ordre canonique', () => {
        const diplomes = [
            { libelle: 'Bac Pro ASSP', niveauSortie: 'bac professionnel' },
            { libelle: 'CAP Coiffure', niveauSortie: 'CAP ou équivalent' },
            { libelle: 'Bac Pro Boulanger', niveauSortie: 'bac professionnel' },
            { libelle: 'CAP Boulanger', niveauSortie: 'CAP ou équivalent' },
        ];
        const result = groupDiplomesByCategorie(diplomes);
        const keys = Object.keys(result);
        expect(keys[0]).toBe('CAP ou équivalent');
        expect(keys[1]).toBe('bac professionnel');
    });

    test('T-TRI-16 : Items triés alphabétiquement dans chaque catégorie', () => {
        const diplomes = [
            { libelle: 'CAP Zingueur', niveauSortie: 'CAP ou équivalent' },
            { libelle: 'CAP Agent', niveauSortie: 'CAP ou équivalent' },
            { libelle: 'CAP Menuisier', niveauSortie: 'CAP ou équivalent' },
        ];
        const result = groupDiplomesByCategorie(diplomes);
        const noms = result['CAP ou équivalent'].map(d => d.libelle);
        expect(noms).toEqual(['CAP Agent', 'CAP Menuisier', 'CAP Zingueur']);
    });

    test('T-TRI-17 : Catégories vides absentes du résultat', () => {
        const diplomes = [
            { libelle: 'CAP Test', niveauSortie: 'CAP ou équivalent' },
        ];
        const result = groupDiplomesByCategorie(diplomes);
        expect(Object.keys(result)).toEqual(['CAP ou équivalent']);
        expect(result['bac professionnel']).toBeUndefined();
    });

    test('T-TRI-18 : niveauSortie null/undefined → catégorie Autre en fin', () => {
        const diplomes = [
            { libelle: 'Formation X', niveauSortie: null },
            { libelle: 'CAP Test', niveauSortie: 'CAP ou équivalent' },
        ];
        const result = groupDiplomesByCategorie(diplomes);
        const keys = Object.keys(result);
        expect(keys[0]).toBe('CAP ou équivalent');
        expect(keys[keys.length - 1]).toBe('Autre');
    });
});

describe('T-TRI : intégration avec données CARIF-OREF', () => {

    test('T-TRI-19 : Niveaux CARIF "3 (CAP...)" et "4 (BAC...)" dans le bon ordre', () => {
        const input = ['4 (BAC...)', '3 (CAP...)'];
        const result = trierCategories(input);
        expect(result).toEqual(['3 (CAP...)', '4 (BAC...)']);
    });

    test('T-TRI-20 : Niveaux numériques bruts 5, 6, 7', () => {
        const input = ['7', '5', '6'];
        const result = trierCategories(input);
        expect(result).toEqual(['5', '6', '7']);
    });

    test('T-TRI-21 : Scénario réel — établissement mixte toutes voies', () => {
        const input = [
            'bac + 2',         // rang 500
            'CAP ou équivalent', // rang 100
            '3 (CAP...)',      // rang 100
            'bac ou équivalent', // rang 330
            '4 (BAC...)',      // rang 340
            'bac + 1',         // rang 400
            '6 (Licence...)',  // rang 660
            'Autre',           // rang 9999
        ];
        const result = trierCategories(input);
        // Rang 100 : triés alphabétiquement → "3 (CAP...)" avant "CAP ou équivalent"
        expect(result[0]).toBe('3 (CAP...)');
        expect(result[1]).toBe('CAP ou équivalent');
        expect(result[2]).toBe('bac ou équivalent');
        expect(result[3]).toBe('4 (BAC...)');
        expect(result[4]).toBe('bac + 1');
        expect(result[5]).toBe('bac + 2');
        expect(result[6]).toBe('6 (Licence...)');
        expect(result[7]).toBe('Autre');
    });
});
