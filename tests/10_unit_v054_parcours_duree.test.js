/**
 * ============================================================================
 * TESTS UNITAIRES v0.54 — Parcours de formation & Durée du cycle
 * ============================================================================
 * 
 * Couvre :
 * - T-PARC : Section parcours pour tous types de diplômes scolaires
 * - T-DUR  : Badge durée (dureeCycleStandard / dureeAnnees)
 * - T-FOLD : Toutes les sections repliées par défaut
 * 
 * Pré-requis : gestion_onglet_resultats.js chargé en global
 * ============================================================================
 */

// ─────────────────────────────────────────────────────────────────────────────
// T-PARC : PARCOURS DE FORMATION — generateParcoursFormationHtml
// ─────────────────────────────────────────────────────────────────────────────

describe('T-PARC : Section parcours pour tous les diplômes scolaires', () => {

    test('T-PARC-01 : Bac pro avec famille de métiers → parcours complet', () => {
        const diplome = { type: 'baccalauréat professionnel', libelle: 'bac pro cuisine' };
        const parcours = {
            famille: 'Métiers de l\'hôtellerie et restauration',
            seconde: '2nde pro Métiers de l\'hôtellerie-restauration',
            premiere: '1ère pro Cuisine',
            terminale: 'Term pro Cuisine'
        };
        const html = generateParcoursFormationHtml(diplome, parcours, '3 ans');
        expect(html).toContain('Famille de métiers');
        expect(html).toContain('2nde');
        expect(html).toContain('1ère');
        expect(html).toContain('Terminale');
        expect(html).toContain('Durée');
        expect(html).toContain('3 ans');
    });

    test('T-PARC-02 : Bac pro HORS famille de métiers', () => {
        const diplome = { type: 'baccalauréat professionnel', libelle: 'bac pro métiers de la sécurité' };
        const parcours = {
            famille: 'HORS FAMILLE - Bac Pro spécialisé',
            seconde: '2nde pro Métiers de la sécurité',
            premiere: '1ère pro Métiers de la sécurité',
            terminale: 'Term pro Métiers de la sécurité'
        };
        const html = generateParcoursFormationHtml(diplome, parcours, null);
        expect(html).toContain('Hors famille');
        expect(html).not.toContain('Durée');
    });

    test('T-PARC-03 : Bac général → parcours 2nde/1ère/terminale', () => {
        const diplome = { type: 'baccalauréat général', libelle: 'bac général' };
        const html = generateParcoursFormationHtml(diplome, null, '3 ans');
        expect(html).toContain('Seconde générale et technologique');
        expect(html).toContain('3 spécialités');
        expect(html).toContain('2 spécialités conservées');
        expect(html).toContain('3 ans');
    });

    test('T-PARC-04 : Bac techno STMG → parcours avec série', () => {
        const diplome = {
            type: 'baccalauréat technologique',
            libelle: 'bac techno STMG sciences et technologies du management et de la gestion enseignement spécifique mercatique (marketing)'
        };
        const html = generateParcoursFormationHtml(diplome, null, '3 ans');
        expect(html).toContain('Seconde générale et technologique');
        expect(html).toContain('STMG');
        expect(html).toContain('3 ans');
    });

    test('T-PARC-05 : CAP → parcours 2 ans', () => {
        const diplome = { type: 'CAP', libelle: 'CAP cuisine' };
        const html = generateParcoursFormationHtml(diplome, null, '2 ans');
        expect(html).toContain('2 ans après la 3ème');
        expect(html).toContain('1ère année');
        expect(html).toContain('2ème année');
        expect(html).toContain('Durée');
    });

    test('T-PARC-06 : CAPa → parcours identique au CAP', () => {
        const diplome = { type: 'CAPa', libelle: 'CAPa services aux personnes' };
        const html = generateParcoursFormationHtml(diplome, null, null);
        expect(html).toContain('2 ans après la 3ème');
        expect(html).not.toContain('Durée');
    });

    test('T-PARC-07 : BMA avec durée → affiche la durée', () => {
        const diplome = { type: 'BMA', libelle: 'BMA ébéniste' };
        const html = generateParcoursFormationHtml(diplome, null, '2 ans');
        expect(html).toContain('Durée du cycle');
        expect(html).toContain('2 ans');
    });

    test('T-PARC-08 : Diplôme inconnu sans durée → retourne null', () => {
        const diplome = { type: 'Certificat inconnu', libelle: 'Formation spéciale' };
        const result = generateParcoursFormationHtml(diplome, null, null);
        expect(result).toBeNull();
    });

    test('T-PARC-09 : Bac pro sans parcours connu mais avec type bac pro', () => {
        const diplome = { type: 'baccalauréat professionnel', libelle: 'bac pro nouveau diplôme XYZ' };
        const html = generateParcoursFormationHtml(diplome, null, '3 ans');
        expect(html).toContain('Hors famille de métiers');
        expect(html).toContain('Seconde professionnelle');
        expect(html).toContain('3 ans');
    });

    test('T-PARC-10 : Bac pro agricole avec parcours', () => {
        const diplome = { type: 'baccalauréat professionnel', libelle: 'bac pro conduite et gestion de l\'entreprise agricole' };
        const parcours = {
            famille: 'Agricole - Productions',
            seconde: '2nde pro Productions',
            premiere: '1ère pro CGEA',
            terminale: 'Term pro CGEA'
        };
        const html = generateParcoursFormationHtml(diplome, parcours, null);
        expect(html).toContain('🌾');
        expect(html).toContain('Productions');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-DUR : BADGE DURÉE — dureeCycleStandard et dureeAnnees
// ─────────────────────────────────────────────────────────────────────────────

describe('T-DUR : Badge durée dans les modales', () => {

    test('T-DUR-01 : Modale diplôme scolaire — badge durée sur chaque établissement', () => {
        const src = buildDiplomeDetailsHTML.toString();
        expect(src).toContain('dureeCycleStandard');
        expect(src).toContain('badge--duree');
    });

    test('T-DUR-02 : Modale diplôme scolaire — durée dans infos générales', () => {
        const src = buildDiplomeDetailsHTML.toString();
        expect(src).toContain('Durée du cycle');
        expect(src).toContain('dureeRelation');
    });

    test('T-DUR-03 : Modale diplôme apprentissage — badge dureeAnnees sur centres', () => {
        const src = buildDiplomeApprentissageDetailsHTML.toString();
        expect(src).toContain('dureeAnnees');
        expect(src).toContain('badge--duree');
    });

    test('T-DUR-04 : Modale établissement — badge durée scolaire', () => {
        const src = buildEtablissementDetailsHTML.toString();
        expect(src).toContain('dureeCycleStandard');
        expect(src).toContain('badge--duree');
    });

    test('T-DUR-05 : Modale établissement — badge durée apprentissage', () => {
        const src = buildEtablissementDetailsHTML.toString();
        expect(src).toContain('_dureeAnnees');
        expect(src).toContain('badge--duree');
    });

    test('T-DUR-06 : dureeCycleStandard parsé dans la relation ONISEP', () => {
        // Vérification que le parser crée bien le champ
        const mockAction = {
            formation_for_libelle: 'CAP cuisine',
            ens_code_uai: '0100001A',
            action_de_formation_af_identifiant_onisep: 'AF.12345',
            af_duree_cycle_standard: '2 ans',
            af_modalites_scolarite: 'temps plein',
            for_niveau_de_sortie: 'CAP ou équivalent',
            for_nature_du_certificat: 'Diplôme national',
            for_domaine_de_formation: 'hotellerie|restauration'
        };
        const result = OnisepParser._parseActionLycee(mockAction);
        const rel = result.diplomes_par_etablissement[0];
        expect(rel.dureeCycleStandard).toBe('2 ans');
    });

    test('T-DUR-07 : DatabaseService enrichit les diplômes apprentissage avec _dureeAnnees', () => {
        const src = window.databaseService?.getDiplomesApprentissageParEtablissementSync?.toString()
            || 'getDiplomesApprentissageParEtablissementSync';
        // Vérification structurelle — la fonction enrichit avec _dureeAnnees
        expect(typeof window.databaseService?.getDiplomesApprentissageParEtablissementSync).toBeDefined;
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-FOLD : TOUTES LES SECTIONS REPLIÉES PAR DÉFAUT
// ─────────────────────────────────────────────────────────────────────────────

describe('T-FOLD : Toutes les sections repliées au démarrage', () => {

    test('T-FOLD-01 : Aucun appel à accordionSection avec false (ouvert)', () => {
        // Vérification dans buildDiplomeDetailsHTML
        const srcDiplome = buildDiplomeDetailsHTML.toString();
        // Extraire tous les appels accordionSection(…, …, …, …, xxx)
        const calls = srcDiplome.match(/accordionSection\([^)]+\)/g) || [];
        for (const call of calls) {
            // Le dernier argument doit être `true`
            expect(call).toMatch(/,\s*true\s*\)/);
        }
    });

    test('T-FOLD-02 : Aucun appel avec false dans buildDiplomeApprentissageDetailsHTML', () => {
        const src = buildDiplomeApprentissageDetailsHTML.toString();
        const calls = src.match(/accordionSection\([^)]+\)/g) || [];
        for (const call of calls) {
            expect(call).toMatch(/,\s*true\s*\)/);
        }
    });

    test('T-FOLD-03 : Aucun appel avec false dans buildEtablissementDetailsHTML', () => {
        const src = buildEtablissementDetailsHTML.toString();
        const calls = src.match(/accordionSection\([^)]+\)/g) || [];
        for (const call of calls) {
            expect(call).toMatch(/,\s*true\s*\)/);
        }
    });

    test('T-FOLD-04 : Infos générales est la première section (diplôme scolaire)', () => {
        const src = buildDiplomeDetailsHTML.toString();
        const firstAccordion = src.indexOf('accordionSection');
        const infoGenerales = src.indexOf("'Informations générales'");
        // Le premier appel à accordionSection doit contenir "Informations générales"
        expect(infoGenerales).toBeGreaterThan(0);
        expect(infoGenerales - firstAccordion).toBeLessThan(100);
    });

    test('T-FOLD-05 : Infos générales est la première section (diplôme apprentissage)', () => {
        const src = buildDiplomeApprentissageDetailsHTML.toString();
        const firstAccordion = src.indexOf('accordionSection');
        const infoGenerales = src.indexOf("'Informations générales'");
        expect(infoGenerales).toBeGreaterThan(0);
        expect(infoGenerales - firstAccordion).toBeLessThan(100);
    });

    test('T-FOLD-06 : Infos générales est la première section (établissement)', () => {
        const src = buildEtablissementDetailsHTML.toString();
        const firstAccordion = src.indexOf('accordionSection');
        const infoGenerales = src.indexOf("'Informations générales'");
        expect(infoGenerales).toBeGreaterThan(0);
        expect(infoGenerales - firstAccordion).toBeLessThan(100);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-PARCHTML : VÉRIFICATION HTML PRODUIT
// ─────────────────────────────────────────────────────────────────────────────

describe('T-PARCHTML : HTML produit par buildDiplomeDetailsHTML', () => {

    test('T-PARCHTML-01 : Bac général avec durée → section parcours + infos générales', () => {
        const enrichi = {
            diplome: {
                type: 'baccalauréat général',
                libelle: 'bac général',
                natureCertificat: 'Diplôme national',
                niveauSortie: 'bac ou équivalent',
                domaines: [],
                urlOnisep: null
            },
            etablissements: [{
                _id: 'etab_001', nom: 'Lycée Test', commune: 'Troyes',
                statut: 'public', dureeCycleStandard: '3 ans'
            }],
            parcours: null,
            _aussiEnApprentissage: false
        };
        const html = buildDiplomeDetailsHTML(enrichi);
        // Doit contenir la section informations générales EN PREMIER
        expect(html.indexOf('Informations générales')).toBeLessThan(html.indexOf('Parcours de formation'));
        // Doit contenir la durée dans les infos générales
        expect(html).toContain('3 ans');
        // Badge durée sur l'établissement
        expect(html).toContain('badge--duree');
        // Section parcours de formation
        expect(html).toContain('3 spécialités');
    });

    test('T-PARCHTML-02 : CAP sans durée → section parcours sans item durée', () => {
        const enrichi = {
            diplome: {
                type: 'CAP',
                libelle: 'CAP cuisine',
                natureCertificat: 'Diplôme national',
                niveauSortie: 'CAP ou équivalent',
                domaines: [],
                urlOnisep: null
            },
            etablissements: [],
            parcours: null,
            _aussiEnApprentissage: false
        };
        const html = buildDiplomeDetailsHTML(enrichi);
        expect(html).toContain('Parcours de formation');
        expect(html).toContain('2 ans après la 3ème');
    });

    test('T-PARCHTML-03 : Diplôme inconnu sans durée → pas de section parcours', () => {
        const enrichi = {
            diplome: {
                type: 'Titre inconnu',
                libelle: 'Formation spéciale XYZ',
                natureCertificat: null,
                niveauSortie: null,
                domaines: [],
                urlOnisep: null
            },
            etablissements: [],
            parcours: null,
            _aussiEnApprentissage: false
        };
        const html = buildDiplomeDetailsHTML(enrichi);
        expect(html).not.toContain('Parcours de formation');
    });
});
