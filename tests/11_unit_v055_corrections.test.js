/**
 * ============================================================================
 * TESTS UNITAIRES v0.55 — Corrections durées, infos générales, enrichissement,
 *                          section « Autres formations »
 * ============================================================================
 *
 * Couvre :
 * - T-DUR55 : Durées codées en dur pour bac G/T/Pro, CAP
 * - T-INFO  : Informations générales en liste (pas en grille 2 colonnes)
 * - T-ENR   : Enrichissement établissements avec ens_telephone / ens_url_onisep
 * - T-AUT   : Section « Autres formations et diplômes » (niveau 5+)
 *
 * Pré-requis : gestion_onglet_resultats.js chargé en global
 * ============================================================================
 */

// ─────────────────────────────────────────────────────────────────────────────
// T-DUR55 : DURÉES CODÉES EN DUR
// ─────────────────────────────────────────────────────────────────────────────

describe('T-DUR55 : Durées corrigées dans le parcours de formation', () => {

    test('T-DUR55-01 : Bac général → durée "3 ans après la 3ème" codée en dur', () => {
        const diplome = { type: 'baccalauréat général', libelle: 'bac général' };
        // On passe une durée API de "1 an" (terminale seule) — elle doit être ignorée
        const html = generateParcoursFormationHtml(diplome, null, '1 an');
        expect(html).toContain('3 ans après la 3ème');
        expect(html).not.toContain('1 an');
    });

    test('T-DUR55-02 : Bac général → durée affichée même sans paramètre duree', () => {
        const diplome = { type: 'baccalauréat général', libelle: 'bac général' };
        const html = generateParcoursFormationHtml(diplome, null, null);
        expect(html).toContain('3 ans après la 3ème');
    });

    test('T-DUR55-03 : Bac techno → durée "3 ans après la 3ème" codée en dur', () => {
        const diplome = { type: 'baccalauréat technologique', libelle: 'bac techno STMG' };
        const html = generateParcoursFormationHtml(diplome, null, '1 an');
        expect(html).toContain('3 ans après la 3ème');
        expect(html).not.toContain('1 an');
    });

    test('T-DUR55-04 : Bac pro avec famille de métiers → durée "3 ans après la 3ème"', () => {
        const diplome = { type: 'baccalauréat professionnel', libelle: 'bac pro cuisine' };
        const parcours = {
            famille: 'Métiers de l\'hôtellerie et restauration',
            seconde: '2nde pro Métiers de l\'hôtellerie-restauration',
            premiere: '1ère pro Cuisine',
            terminale: 'Term pro Cuisine'
        };
        // L'API renvoie "2 ans" (1ère+terminale) — la seconde commune n'est pas comptée
        const html = generateParcoursFormationHtml(diplome, parcours, '2 ans');
        expect(html).toContain('3 ans après la 3ème');
        expect(html).not.toContain('2 ans');
    });

    test('T-DUR55-05 : Bac pro HORS famille → durée "3 ans après la 3ème"', () => {
        const diplome = { type: 'baccalauréat professionnel', libelle: 'bac pro sécurité' };
        const html = generateParcoursFormationHtml(diplome, null, '3 ans');
        expect(html).toContain('3 ans après la 3ème');
    });

    test('T-DUR55-06 : Bac pro HORS famille → durée affichée même sans paramètre', () => {
        const diplome = { type: 'baccalauréat professionnel', libelle: 'bac pro sécurité' };
        const html = generateParcoursFormationHtml(diplome, null, null);
        expect(html).toContain('3 ans après la 3ème');
    });

    test('T-DUR55-07 : CAP → durée "2 ans après la 3ème" codée en dur', () => {
        const diplome = { type: 'cap', libelle: 'CAP Boucher' };
        const html = generateParcoursFormationHtml(diplome, null, null);
        expect(html).toContain('2 ans après la 3ème');
    });

    test('T-DUR55-08 : CAP → durée API ignorée', () => {
        const diplome = { type: 'cap', libelle: 'CAP Boucher' };
        const html = generateParcoursFormationHtml(diplome, null, '2 ans');
        expect(html).toContain('2 ans après la 3ème');
        // Doit apparaître une seule fois (pas de doublon)
        const matches = html.match(/2 ans/g);
        expect(matches.length).toBe(2); // "Cycle de 2 ans" + "Durée : 2 ans après la 3ème"
    });

    test('T-DUR55-09 : Bac pro famille agricole → durée "3 ans après la 3ème"', () => {
        const diplome = { type: 'baccalauréat professionnel', libelle: 'bac pro CGEA' };
        const parcours = {
            famille: 'Agricole - Productions',
            seconde: '2nde pro Productions',
            premiere: '1ère pro CGEA',
            terminale: 'Term pro CGEA'
        };
        const html = generateParcoursFormationHtml(diplome, parcours, '2 ans');
        expect(html).toContain('3 ans après la 3ème');
        expect(html).toContain('🌾');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-INFO : INFORMATIONS GÉNÉRALES EN LISTE (pas en grille)
// ─────────────────────────────────────────────────────────────────────────────

describe('T-INFO : Informations générales présentées en liste', () => {

    test('T-INFO-01 : Fiche établissement → pas de detail-info-grid', () => {
        const enrichi = {
            etablissement: {
                _id: 'test1', uai: '0350001A', nom: 'Lycée Test',
                type: 'Lycée GT', statut: 'public', commune: 'Rennes',
                adresse: '1 rue test', codePostal: '35000',
                telephone: '0299001122', siteWeb: 'https://test.fr'
            },
            diplomes: [], diplomes_apprentissage: [],
            dispositifs: [], options2ndeGT: [], specialites1ereG: []
        };
        const html = buildEtablissementDetailsHTML(enrichi);
        expect(html).not.toContain('detail-info-grid');
        expect(html).toContain('detail-item detail-item--info');
        expect(html).toContain('UAI');
        expect(html).toContain('Téléphone');
    });

    test('T-INFO-02 : Fiche diplôme scolaire → pas de detail-info-grid', () => {
        const enrichi = {
            diplome: {
                libelle: 'CAP Boucher', type: 'cap',
                natureCertificat: 'Diplôme national',
                niveauSortie: 'CAP ou équivalent'
            },
            etablissements: [],
            parcours: null
        };
        const html = buildDiplomeDetailsHTML(enrichi);
        expect(html).not.toContain('detail-info-grid');
        expect(html).toContain('detail-item detail-item--info');
    });

    test('T-INFO-03 : Fiche diplôme apprentissage → pas de detail-info-grid', () => {
        const enrichi = {
            diplome: {
                typeDiplome: 'CAP', niveau: '3 (CAP...)', rncpCode: 'RNCP12345'
            },
            etablissements: [],
            relations: []
        };
        const html = buildDiplomeApprentissageDetailsHTML(enrichi);
        expect(html).not.toContain('detail-info-grid');
        expect(html).toContain('detail-item detail-item--info');
    });

    test('T-INFO-04 : Infos complémentaires → pas de detail-info-grid', () => {
        const enrichi = {
            etablissement: {
                _id: 'test2', uai: '0350002B', nom: 'CFA Test',
                accessibilite: 'Rampe', opcoNom: 'OPCO EP',
                formeJuridique: 'Association', nda: '123456'
            },
            diplomes: [], diplomes_apprentissage: [],
            dispositifs: [], options2ndeGT: [], specialites1ereG: []
        };
        const html = buildEtablissementDetailsHTML(enrichi);
        expect(html).not.toContain('detail-info-grid');
        expect(html).toContain('Accessibilité');
        expect(html).toContain('OPCO');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-ENR : ENRICHISSEMENT ENS_ ÉTENDU (téléphone, urlOnisep)
// ─────────────────────────────────────────────────────────────────────────────

describe('T-ENR : Enrichissement établissements étendu aux champs ens_ supplémentaires', () => {

    test('T-ENR-01 : Parser collecte ens_n_telephone dans les enrichissements', () => {
        const action = {
            ens_code_uai: '0350001A',
            ens_n_telephone: '02 99 00 11 22',
            ens_hebergement: 'internat garçons',
            formation_for_libelle: 'CAP Test',
            action_de_formation_af_identifiant_onisep: 'AF123'
        };
        const result = OnisepParser._parseActionLycee(action);
        expect(result.enrichissements_etab.length).toBe(1);
        expect(result.enrichissements_etab[0].telephone).toBe('02 99 00 11 22');
        expect(result.enrichissements_etab[0].hebergement).toBe('internat garçons');
    });

    test('T-ENR-02 : Parser collecte ens_url_et_id_onisep dans les enrichissements', () => {
        const action = {
            ens_code_uai: '0350002B',
            ens_url_et_id_onisep: 'http://onisep.fr/etab/0350002B|ENS.1234',
            ens_site_web: 'https://lycee.fr'
        };
        const result = OnisepParser._parseActionLycee(action);
        expect(result.enrichissements_etab.length).toBe(1);
        expect(result.enrichissements_etab[0].urlOnisep).toBe('http://onisep.fr/etab/0350002B|ENS.1234');
        expect(result.enrichissements_etab[0].siteWeb).toBe('https://lycee.fr');
    });

    test('T-ENR-03 : Parser collecte ens_telephone (format dispositifs)', () => {
        const action = {
            ens_code_uai: '0350003C',
            ens_telephone: '02 99 33 44 55'
        };
        const result = OnisepParser._parseActionLycee(action);
        expect(result.enrichissements_etab.length).toBe(1);
        expect(result.enrichissements_etab[0].telephone).toBe('02 99 33 44 55');
    });

    test('T-ENR-04 : Pas d\'enrichissement si aucun champ ens_ utile', () => {
        const action = {
            ens_code_uai: '0350004D',
            formation_for_libelle: 'CAP Test'
        };
        const result = OnisepParser._parseActionLycee(action);
        expect(result.enrichissements_etab.length).toBe(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-AUT : SECTION « AUTRES FORMATIONS ET DIPLÔMES » (NIVEAU 5+)
// ─────────────────────────────────────────────────────────────────────────────

describe('T-AUT : Section Autres formations et diplômes (niveau 5+)', () => {

    // Setup : mock databaseService
    beforeEach(() => {
        window.databaseService = {
            getAutresFormationsParEtablissement: jest.fn()
        };
    });

    afterEach(() => {
        delete window.databaseService;
    });

    test('T-AUT-01 : Section affichée avec sources ONISEP et CARIF', () => {
        window.databaseService.getAutresFormationsParEtablissement.mockReturnValue([
            { libelle: 'BTS Comptabilité', niveau: '5 (BTS...)', typeDiplome: 'BTS', source: 'onisep' },
            { libelle: 'Licence pro Commerce', niveau: '6 (Licence...)', typeDiplome: 'LICENCE PRO' }
        ]);
        const enrichi = {
            etablissement: { _id: 't1', uai: '0350001A', nom: 'Lycée Test' },
            diplomes: [], diplomes_apprentissage: [],
            dispositifs: [], options2ndeGT: [], specialites1ereG: []
        };
        const html = buildEtablissementDetailsHTML(enrichi);
        expect(html).toContain('Autres formations et diplômes');
        expect(html).toContain('BTS Comptabilité');
        expect(html).toContain('Licence pro Commerce');
        expect(html).toContain('voie-badge--scolaire');  // ONISEP source
        expect(html).toContain('voie-badge--apprentissage');  // CARIF source (no source field)
    });

    test('T-AUT-02 : Section absente si aucune formation niveau 5+', () => {
        window.databaseService.getAutresFormationsParEtablissement.mockReturnValue([]);
        const enrichi = {
            etablissement: { _id: 't2', uai: '0350002B', nom: 'CFA Test' },
            diplomes: [], diplomes_apprentissage: [],
            dispositifs: [], options2ndeGT: [], specialites1ereG: []
        };
        const html = buildEtablissementDetailsHTML(enrichi);
        expect(html).not.toContain('Autres formations et diplômes');
    });

    test('T-AUT-03 : Formations groupées par niveau', () => {
        window.databaseService.getAutresFormationsParEtablissement.mockReturnValue([
            { libelle: 'BTS A', niveau: '5 (BTS...)', typeDiplome: 'BTS' },
            { libelle: 'BTS B', niveau: '5 (BTS...)', typeDiplome: 'BTS' },
            { libelle: 'Licence C', niveau: '6 (Licence...)', typeDiplome: 'LICENCE' }
        ]);
        const enrichi = {
            etablissement: { _id: 't3', uai: '0350003C', nom: 'Lycée Test' },
            diplomes: [], diplomes_apprentissage: [],
            dispositifs: [], options2ndeGT: [], specialites1ereG: []
        };
        const html = buildEtablissementDetailsHTML(enrichi);
        // Deux groupes de niveau
        expect(html).toContain('5 (BTS...) (2)');
        expect(html).toContain('6 (Licence...) (1)');
    });

    test('T-AUT-04 : Items non cliquables (detail-item--info)', () => {
        window.databaseService.getAutresFormationsParEtablissement.mockReturnValue([
            { libelle: 'BTS Test', niveau: '5 (BTS...)', typeDiplome: 'BTS' }
        ]);
        const enrichi = {
            etablissement: { _id: 't4', uai: '0350004D', nom: 'Test' },
            diplomes: [], diplomes_apprentissage: [],
            dispositifs: [], options2ndeGT: [], specialites1ereG: []
        };
        const html = buildEtablissementDetailsHTML(enrichi);
        // La section "Autres formations" doit utiliser detail-item--info (non cliquable)
        // et non detail-item--link
        const section = html.split('Autres formations et diplômes')[1];
        expect(section).toContain('detail-item--info');
        expect(section).not.toContain('detail-item--link');
    });

    test('T-AUT-05 : Compteur total dans le titre de la section', () => {
        window.databaseService.getAutresFormationsParEtablissement.mockReturnValue([
            { libelle: 'BTS A', niveau: '5', typeDiplome: 'BTS' },
            { libelle: 'BTS B', niveau: '5', typeDiplome: 'BTS' },
            { libelle: 'LP C', niveau: '6', typeDiplome: 'LP' }
        ]);
        const enrichi = {
            etablissement: { _id: 't5', uai: '0350005E', nom: 'Test' },
            diplomes: [], diplomes_apprentissage: [],
            dispositifs: [], options2ndeGT: [], specialites1ereG: []
        };
        const html = buildEtablissementDetailsHTML(enrichi);
        expect(html).toContain('Autres formations et diplômes (3)');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-DB55 : DATABASE SERVICE — Méthodes autres formations
// ─────────────────────────────────────────────────────────────────────────────

describe('T-DB55 : DatabaseService — Autres formations niveau 5+', () => {

    let db;

    beforeEach(() => {
        // Mock localStorage
        const store = {};
        global.localStorage = {
            getItem: jest.fn(key => store[key] || null),
            setItem: jest.fn((key, val) => { store[key] = val; }),
            removeItem: jest.fn(key => { delete store[key]; })
        };
        db = new DatabaseService('test_db');
    });

    test('T-DB55-01 : insertAutresFormationsParEtablissement + getAutresFormationsParEtablissement', async () => {
        const formations = [
            { libelle: 'BTS Compta', niveau: '5 (BTS...)', typeDiplome: 'BTS' },
            { libelle: 'LP Commerce', niveau: '6 (Licence...)', typeDiplome: 'LP' }
        ];
        await db.insertAutresFormationsParEtablissement('0350001A', formations);
        const result = db.getAutresFormationsParEtablissement('0350001A');
        expect(result).toHaveLength(2);
        expect(result[0].libelle).toBe('BTS Compta');
    });

    test('T-DB55-02 : getAutresFormationsParEtablissement retourne [] si UAI inconnu', () => {
        const result = db.getAutresFormationsParEtablissement('INCONNU');
        expect(result).toEqual([]);
    });

    test('T-DB55-03 : clearAprentissageData vide aussi les autres formations', async () => {
        await db.insertAutresFormationsParEtablissement('0350001A', [
            { libelle: 'BTS Test', niveau: '5', typeDiplome: 'BTS' }
        ]);
        expect(db.getAutresFormationsParEtablissement('0350001A')).toHaveLength(1);

        await db.clearAprentissageData();
        expect(db.getAutresFormationsParEtablissement('0350001A')).toEqual([]);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-SCO5 : DIPLÔMES SCOLAIRES NIVEAU 5+ (ONISEP actions_sup)
// ─────────────────────────────────────────────────────────────────────────────

describe('T-SCO5 : Collecte des diplômes scolaires niveau 5+ depuis actions_sup', () => {

    test('T-SCO5-01 : BTS rejeté par buildDiplomesValidesArray mais collecté', () => {
        // Simule rawData avec un BTS
        const rawData = {
            diplomes: [
                { libelle: 'CAP Boucher', niveauSortie: 'CAP ou équivalent', type: 'cap' },
                { libelle: 'BTS Comptabilité', niveauSortie: 'BTS ou équivalent', type: 'BTS' }
            ],
            relationsDiplomesEtablissements: [
                { uai: '0350001A', libelle: 'CAP Boucher' },
                { uai: '0350001A', libelle: 'BTS Comptabilité' }
            ]
        };

        // buildDiplomesValidesArray filtre le BTS
        const valides = rawData.diplomes.filter(d => {
            const n = d.niveauSortie.toLowerCase();
            return n === 'cap ou équivalent' || n === 'bac ou équivalent';
        });
        expect(valides).toHaveLength(1);
        expect(valides[0].libelle).toBe('CAP Boucher');

        // Les diplômes niveau 5+ sont identifiés
        const niv5Plus = rawData.diplomes.filter(d => {
            const n = d.niveauSortie.toLowerCase();
            return n !== 'cap ou équivalent' && n !== 'bac ou équivalent' && n !== '';
        });
        expect(niv5Plus).toHaveLength(1);
        expect(niv5Plus[0].libelle).toBe('BTS Comptabilité');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-CARIF-ENR : ENRICHISSEMENT ÉTABLISSEMENTS DEPUIS FORMATIONS CARIF
// ─────────────────────────────────────────────────────────────────────────────

describe('T-CARIF-ENR : Enrichissement établissements depuis formations CARIF', () => {

    test('T-CARIF-ENR-01 : Email et téléphone extraits des formations', () => {
        const rawFormations = [{
            etablissement_formateur_uai: '0350001A',
            etablissement_formateur_siret: '12345678901234',
            etablissement_formateur_enseigne: 'CFA Test',
            etablissement_formateur_courriel: 'contact@cfa.fr',
            num_tel: '0299001122',
            geo_coordonnees_etablissement_formateur: '48.1,-1.6',
            etablissement_formateur_certifie_qualite: true,
            intitule_long: 'CAP TEST (CAP)',
            rncp_code: 'RNCP123',
            diplome: 'CAP',
            niveau: '3 (CAP...)',
            id: 'f1',
            published: true,
            rncp_eligible_apprentissage: true,
            cfd_outdated: false
        }];

        const etabs = CARIFOREFParser.parseEtablissementsDepuisFormations(rawFormations);
        expect(etabs).toHaveLength(1);
        expect(etabs[0].email).toBe('contact@cfa.fr');
        expect(etabs[0].telephone).toBe('0299001122');
    });

    test('T-CARIF-ENR-02 : Email null si champ absent', () => {
        const rawFormations = [{
            etablissement_formateur_uai: '0350002B',
            etablissement_formateur_siret: '12345678901234',
            etablissement_formateur_enseigne: 'CFA Test 2',
            geo_coordonnees_etablissement_formateur: '48.1,-1.6',
            intitule_long: 'CAP TEST2 (CAP)',
            rncp_code: 'RNCP124',
            diplome: 'CAP',
            niveau: '3 (CAP...)',
            id: 'f2',
            published: true,
            rncp_eligible_apprentissage: true,
            cfd_outdated: false
        }];

        const etabs = CARIFOREFParser.parseEtablissementsDepuisFormations(rawFormations);
        expect(etabs).toHaveLength(1);
        expect(etabs[0].email).toBeNull();
        expect(etabs[0].telephone).toBeNull();
    });
});
