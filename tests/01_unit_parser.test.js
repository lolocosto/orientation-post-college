/**
 * Tests unitaires — CARIFOREFParser
 * 
 * Couvre :
 *   - _normaliserLibelle()
 *   - _parseGeoCoords()
 *   - _buildAdresse()
 *   - parseEtablissements() : cas nominal, champs manquants, sans UAI, priorité nom
 *   - parseFormations()     : cas nominal, rncp absent, uai absent, formation fermée
 *
 * Exécution : node tests/01_unit_parser.test.js
 */

// ── Chargement du module (Node.js, pas de window) ────────────────────────────
const fs = require('fs');

// Simuler window pour l'exposition globale
global.window = global;

// Charger le parser (l'exposition window.CARIFOREFParser est ainsi capturée)
eval(fs.readFileSync('./js/carif_oref_parser.js', 'utf8'));

const P = CARIFOREFParser;

// ── Micro-framework de test ──────────────────────────────────────────────────
let passed = 0, failed = 0;

function describe(label, fn) {
    console.log(`\n📦 ${label}`);
    fn();
}

function it(label, fn) {
    try {
        fn();
        console.log(`  ✅ ${label}`);
        passed++;
    } catch (e) {
        console.error(`  ❌ ${label}`);
        console.error(`     → ${e.message}`);
        failed++;
    }
}

function expect(val) {
    return {
        toBe: (expected) => {
            if (val !== expected)
                throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(val)}`);
        },
        toEqual: (expected) => {
            const a = JSON.stringify(val), b = JSON.stringify(expected);
            if (a !== b) throw new Error(`Expected ${b}\n       got ${a}`);
        },
        toBeNull: () => {
            if (val !== null) throw new Error(`Expected null, got ${JSON.stringify(val)}`);
        },
        toBeArray: () => {
            if (!Array.isArray(val)) throw new Error(`Expected Array, got ${typeof val}`);
        },
        toHaveLength: (n) => {
            if (val.length !== n) throw new Error(`Expected length ${n}, got ${val.length}`);
        },
        toContain: (substr) => {
            if (!String(val).includes(substr))
                throw new Error(`Expected "${val}" to contain "${substr}"`);
        },
        toBeGreaterThan: (n) => {
            if (!(val > n)) throw new Error(`Expected ${val} > ${n}`);
        },
        toBeTruthy: () => {
            if (!val) throw new Error(`Expected truthy, got ${JSON.stringify(val)}`);
        },
        toBeFalsy: () => {
            if (val) throw new Error(`Expected falsy, got ${JSON.stringify(val)}`);
        }
    };
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

const ETAB_COMPLET = {
    uai:                      '0352356W',
    siret:                    '19352356700019',
    enseigne:                 '',
    onisep_nom:               'CFA des Métiers du Bois',
    entreprise_raison_sociale: 'CFA METIERS DU BOIS BRETAGNE',
    adresse:                  '12 Rue du Chêne',
    numero_voie:              '12',
    type_voie:                'Rue',
    nom_voie:                 'du Chêne',
    complement_adresse:       'ZA Les Ormes',
    code_postal:              '35000',
    localite:                 'RENNES',
    code_insee_localite:      '35238',
    geo_coordonnees:          '48.1173,-1.6778',
    nom_academie:             'Rennes',
    num_departement:          '35',
    nom_departement:          'Ille-et-Vilaine',
    region_implantation_nom:  'Bretagne',
    region_implantation_code: '53',
    certifie_qualite:         true,
    ferme:                    false,
    entreprise_ferme:         false,
    nda:                      '53350001235',
    onisep_url:               'https://www.onisep.fr/etab/0352356W',
    date_creation:            '2005-01-01',
    last_update_at:           '2024-09-15'
};

const ETAB_SANS_UAI = { ...ETAB_COMPLET, uai: '' };
const ETAB_UAI_SPACES = { ...ETAB_COMPLET, uai: '  ' };
const ETAB_FERME = { ...ETAB_COMPLET, ferme: true };
const ETAB_ENSEIGNE_SEULEMENT = {
    ...ETAB_COMPLET,
    onisep_nom: '',
    enseigne: 'CFA MENUISERIE',
    entreprise_raison_sociale: 'CHAMBRE DE METIERS 35'
};
const ETAB_RAISON_SOCIALE_SEULEMENT = {
    ...ETAB_COMPLET,
    onisep_nom: '',
    enseigne: '',
    entreprise_raison_sociale: 'CHAMBRE DE METIERS 35'
};
const ETAB_SANS_GEO = { ...ETAB_COMPLET, geo_coordonnees: null };
const ETAB_GEO_INVALIDE = { ...ETAB_COMPLET, geo_coordonnees: 'pas,valide' };
const ETAB_ADRESSE_CHAMPS = { ...ETAB_COMPLET, adresse: 'BRUT IGNORÉ' };

const FORMATION_COMPLETE = {
    id:                        'id-formation-001',
    etablissement_formateur_uai: '0352356W',
    rncp_code:                 'RNCP37527',
    intitule_long:             'CAP Menuisier installateur',
    intitule_court:            'CAP Menuisier install.',
    rncp_intitule:             'CAP MENUISIER INSTALLATEUR',
    diplome:                   'CAP',
    niveau:                    '3 (CAP...)',
    cfd:                       '40025214',
    lieu_formation_geo_coordonnees: '48.1100,-1.6500',
    lieu_formation_adresse:    '1 Impasse des Menuisiers 35000 RENNES',
    code_commune_insee:        '35238',
    onisep_url:                'https://www.onisep.fr/diplome/CAP-Menuisier',
    onisep_intitule:           'CAP Menuisier installateur',
    published:                 true,
    date_fermeture:            null
};

const FORMATION_SANS_RNCP = {
    ...FORMATION_COMPLETE,
    id:       'id-formation-002',
    rncp_code: '',
    intitule_long: 'Bac Pro Aménagement et finition du bâtiment'
};

const FORMATION_SANS_UAI = {
    ...FORMATION_COMPLETE,
    id:                          'id-formation-003',
    etablissement_formateur_uai: ''
};

const FORMATION_SANS_LIBELLE = {
    ...FORMATION_COMPLETE,
    id:           'id-formation-004',
    intitule_long:  '',
    intitule_court: ''
};

// ── Tests : _normaliserLibelle ────────────────────────────────────────────────

describe('_normaliserLibelle', () => {
    it('met en minuscules', () => {
        expect(P._normaliserLibelle('CAP Menuisier')).toBe('cap menuisier');
    });
    it('supprime les accents', () => {
        expect(P._normaliserLibelle('Bac Pro Aménagement')).toBe('bac pro amenagement');
    });
    it('remplace la ponctuation par des espaces', () => {
        expect(P._normaliserLibelle('BTS Comptabilité & Gestion')).toBe('bts comptabilite gestion');
    });
    it('dédoublonne les espaces', () => {
        expect(P._normaliserLibelle('CAP  Menuisier  Installateur')).toBe('cap menuisier installateur');
    });
    it('gère null/undefined sans erreur', () => {
        expect(P._normaliserLibelle(null)).toBe('');
        expect(P._normaliserLibelle(undefined)).toBe('');
        expect(P._normaliserLibelle('')).toBe('');
    });
    it('deux libellés identiques → même résultat (cohérence jointure)', () => {
        const a = P._normaliserLibelle('CAP Menuisier installateur');
        const b = P._normaliserLibelle('CAP Menuisier installateur');
        expect(a).toBe(b);
    });
});

// ── Tests : _parseGeoCoords ───────────────────────────────────────────────────

describe('_parseGeoCoords', () => {
    it('parse un couple valide', () => {
        const r = P._parseGeoCoords('48.1173,-1.6778');
        expect(r.lat).toBe(48.1173);
        expect(r.lon).toBe(-1.6778);
    });
    it('retourne null/null pour null', () => {
        const r = P._parseGeoCoords(null);
        expect(r.lat).toBeNull();
        expect(r.lon).toBeNull();
    });
    it('retourne null/null pour chaîne vide', () => {
        const r = P._parseGeoCoords('');
        expect(r.lat).toBeNull();
    });
    it('retourne null/null pour format incorrect', () => {
        const r = P._parseGeoCoords('pas,valide');
        expect(r.lat).toBeNull();
    });
    it('retourne null/null si un seul nombre', () => {
        const r = P._parseGeoCoords('48.1173');
        expect(r.lat).toBeNull();
    });
    it('gère les coordonnées négatives des DOM-TOM', () => {
        const r = P._parseGeoCoords('-21.1151,55.5367');
        expect(r.lat).toBe(-21.1151);
        expect(r.lon).toBe(55.5367);
    });
});

// ── Tests : _buildAdresse ─────────────────────────────────────────────────────

describe('_buildAdresse', () => {
    it('construit depuis les champs décomposés', () => {
        const r = P._buildAdresse(ETAB_COMPLET);
        expect(r).toContain('12');
        expect(r).toContain('Rue');
        expect(r).toContain('Chêne');
    });
    it('inclut le complément si présent', () => {
        const r = P._buildAdresse(ETAB_COMPLET);
        expect(r).toContain('ZA Les Ormes');
    });
    it('fallback sur adresse brute si champs décomposés absents', () => {
        const e = { adresse: '15 Bd de la Liberté 35000 RENNES' };
        const r = P._buildAdresse(e);
        expect(r).toContain('15 Bd de la Liberté');
    });
    it('retourne null si tout est vide', () => {
        const r = P._buildAdresse({});
        expect(r).toBeNull();
    });
});

// ── Tests : parseEtablissements ───────────────────────────────────────────────

describe('parseEtablissements — cas nominal', () => {
    const result = P.parseEtablissements([ETAB_COMPLET], false);

    it('retourne un tableau', () => {
        expect(result).toBeArray();
        expect(result).toHaveLength(1);
    });

    const e = result[0];

    it('copie l\'UAI', () => {
        expect(e.uai).toBe('0352356W');
    });
    it('copie le SIRET', () => {
        expect(e.siret).toBe('19352356700019');
    });
    it('préfère onisep_nom comme nom', () => {
        expect(e.nom).toBe('CFA des Métiers du Bois');
    });
    it('copie code postal', () => {
        expect(e.codePostal).toBe('35000');
    });
    it('copie la commune', () => {
        expect(e.commune).toBe('RENNES');
    });
    it('copie le code INSEE commune', () => {
        expect(e.codeCommuneCOG).toBe('35238');
    });
    it('parse les coordonnées depuis geo_coordonnees', () => {
        expect(e.latitude).toBe(48.1173);
        expect(e.longitude).toBe(-1.6778);
    });
    it('copie l\'académie', () => {
        expect(e.academie).toBe('Rennes');
    });
    it('copie la région', () => {
        expect(e.region).toBe('Bretagne');
    });
    it('copie le code région', () => {
        expect(e.regionCOG).toBe('53');
    });
    it('copie certifieQualite', () => {
        expect(e.certifieQualite).toBe(true);
    });
    it('copie l\'URL ONISEP', () => {
        expect(e.urlOnisep).toBe('https://www.onisep.fr/etab/0352356W');
    });
    it('assigne voies = [apprentissage]', () => {
        expect(JSON.stringify(e.voies)).toBe(JSON.stringify(['apprentissage']));
    });
});

describe('parseEtablissements — priorité du nom', () => {
    it('utilise enseigne si onisep_nom absent', () => {
        const r = P.parseEtablissements([ETAB_ENSEIGNE_SEULEMENT], false);
        expect(r[0].nom).toBe('CFA MENUISERIE');
    });
    it('utilise entreprise_raison_sociale en dernier recours', () => {
        const r = P.parseEtablissements([ETAB_RAISON_SOCIALE_SEULEMENT], false);
        expect(r[0].nom).toBe('CHAMBRE DE METIERS 35');
    });
});

describe('parseEtablissements — filtrages', () => {
    it('rejette un établissement sans UAI', () => {
        const r = P.parseEtablissements([ETAB_SANS_UAI], false);
        expect(r).toHaveLength(0);
    });
    it('rejette un UAI composé uniquement d\'espaces', () => {
        const r = P.parseEtablissements([ETAB_UAI_SPACES], false);
        expect(r).toHaveLength(0);
    });
    it('retourne tableau vide sur entrée vide', () => {
        const r = P.parseEtablissements([], false);
        expect(r).toHaveLength(0);
    });
    it('retourne tableau vide sur null', () => {
        const r = P.parseEtablissements(null, false);
        expect(r).toHaveLength(0);
    });
});

describe('parseEtablissements — géolocalisation dégradée', () => {
    it('lat/lon null si geo_coordonnees absent', () => {
        const r = P.parseEtablissements([ETAB_SANS_GEO], false);
        expect(r[0].latitude).toBeNull();
        expect(r[0].longitude).toBeNull();
    });
    it('lat/lon null si geo_coordonnees invalide', () => {
        const r = P.parseEtablissements([ETAB_GEO_INVALIDE], false);
        expect(r[0].latitude).toBeNull();
    });
});

// ── Tests : parseFormations ───────────────────────────────────────────────────

describe('parseFormations — cas nominal', () => {
    const result = P.parseFormations([FORMATION_COMPLETE], false);

    it('produit une entrée diplomesApprentissage', () => {
        expect(result.diplomesApprentissage).toHaveLength(1);
    });
    it('produit une entrée relation', () => {
        expect(result.diplomesApprentissage_par_etablissement).toHaveLength(1);
    });

    const d = result.diplomesApprentissage[0];

    it('clé = rncp_code quand présent', () => {
        expect(d.id).toBe('RNCP37527');
        expect(d.rncpCode).toBe('RNCP37527');
    });
    it('copie intitule_long comme libelle', () => {
        expect(d.libelle).toBe('CAP Menuisier installateur');
    });
    it('copie typeDiplome', () => {
        expect(d.typeDiplome).toBe('CAP');
    });
    it('copie niveau', () => {
        expect(d.niveau).toBe('3 (CAP...)');
    });
    it('calcule libelleNormalise', () => {
        expect(d.libelleNormalise).toBe('cap menuisier installateur');
    });

    const r = result.diplomesApprentissage_par_etablissement[0];

    it('relation.id = id de la formation', () => {
        expect(r.id).toBe('id-formation-001');
    });
    it('relation.diplomId = clé du diplôme', () => {
        expect(r.diplomId).toBe('RNCP37527');
    });
    it('relation.uai = UAI formateur', () => {
        expect(r.uai).toBe('0352356W');
    });
    it('parse les coords lieu_formation', () => {
        expect(r.lieuLatitude).toBe(48.1100);
        expect(r.lieuLongitude).toBe(-1.6500);
    });
    it('copie code commune INSEE', () => {
        expect(r.lieuCodeCommune).toBe('35238');
    });
});

describe('parseFormations — sans RNCP (fallback libellé normalisé)', () => {
    const result = P.parseFormations([FORMATION_SANS_RNCP], false);
    const d = result.diplomesApprentissage[0];

    it('produit quand même un diplôme', () => {
        expect(result.diplomesApprentissage).toHaveLength(1);
    });
    it('clé = libellé normalisé si rncp_code absent', () => {
        expect(d.id).toBe(P._normaliserLibelle('Bac Pro Aménagement et finition du bâtiment'));
    });
    it('rncpCode est null', () => {
        expect(d.rncpCode).toBeNull();
    });
});

describe('parseFormations — cas dégradés', () => {
    it('sans UAI : pas de relation mais diplôme présent', () => {
        const result = P.parseFormations([FORMATION_SANS_UAI], false);
        expect(result.diplomesApprentissage).toHaveLength(1);
        expect(result.diplomesApprentissage_par_etablissement).toHaveLength(0);
    });
    it('sans libellé : ignoré complètement', () => {
        const result = P.parseFormations([FORMATION_SANS_LIBELLE], false);
        expect(result.diplomesApprentissage).toHaveLength(0);
        expect(result.diplomesApprentissage_par_etablissement).toHaveLength(0);
    });
    it('tableau vide → résultat vide', () => {
        const result = P.parseFormations([], false);
        expect(result.diplomesApprentissage).toHaveLength(0);
        expect(result.diplomesApprentissage_par_etablissement).toHaveLength(0);
    });
    it('null → résultat vide', () => {
        const result = P.parseFormations(null, false);
        expect(result.diplomesApprentissage).toHaveLength(0);
    });
});

describe('parseFormations — plusieurs formations même diplôme', () => {
    it('génère autant de relations que de formations', () => {
        const f2 = { ...FORMATION_COMPLETE, id: 'id-formation-005', etablissement_formateur_uai: '0352449X' };
        const result = P.parseFormations([FORMATION_COMPLETE, f2], false);
        // 2 relations (un par formation)
        expect(result.diplomesApprentissage_par_etablissement).toHaveLength(2);
        // 2 entrées diplôme (doublons à dédupliquer en aval dans le contrôleur)
        expect(result.diplomesApprentissage).toHaveLength(2);
    });
});

// ── Résumé ────────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`Résultat : ${passed} passés, ${failed} échoués sur ${passed + failed} tests`);
if (failed > 0) {
    console.error('\n⛔ Des tests ont échoué !');
    process.exit(1);
} else {
    console.log('\n🎉 Tous les tests unitaires du parser sont verts !');
}
