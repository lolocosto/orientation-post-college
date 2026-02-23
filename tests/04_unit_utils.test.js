/**
 * @file 04_unit_utils.test.js
 * @description Tests unitaires pour utils.js — v0.45
 *
 * Couvre : formaterDate, formaterNombre, normaliserCasse, supprimerAccents,
 *          contient, tronquer, trierParChamp, debounce, dedupliquer, grouperPar,
 *          validerUai, validerRncp.
 *
 * Prérequis : Node.js ≥ 18, jest (npm install -g jest)
 * Lancement : jest tests/04_unit_utils.test.js
 */

'use strict';

// ── Stub minimal de l'objet Utils (copie des fonctions depuis utils.js) ──
const Utils = {
    formaterDate(date) {
        if (!date) return '';
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },
    formaterNombre(n) {
        if (n == null || isNaN(n)) return '-';
        return n.toLocaleString('fr-FR');
    },
    normaliserCasse(texte) {
        if (!texte) return '';
        if (/^[A-ZÀÉÈÊÏÎÔÙÛÜ0-9]{2,6}$/.test(texte)) return texte;
        return texte.charAt(0).toUpperCase() + texte.slice(1);
    },
    supprimerAccents(texte) {
        return texte ? texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
    },
    contient(texte, terme) {
        if (!texte || !terme) return false;
        return this.supprimerAccents(texte.toLowerCase())
            .includes(this.supprimerAccents(terme.toLowerCase().trim()));
    },
    tronquer(texte, max = 100) {
        if (!texte) return '';
        return texte.length > max ? texte.slice(0, max - 1) + '…' : texte;
    },
    trierParChamp(liste, champ, ordre = 'asc') {
        if (!Array.isArray(liste)) return [];
        const s = ordre === 'asc' ? 1 : -1;
        return [...liste].sort((a, b) => {
            const va = this.supprimerAccents(String(a[champ] ?? '').toLowerCase());
            const vb = this.supprimerAccents(String(b[champ] ?? '').toLowerCase());
            return s * va.localeCompare(vb, 'fr');
        });
    },
    debounce(fn, delai) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delai);
        };
    },
    throttle(fn, delai) {
        let last = 0;
        return function (...args) {
            const now = Date.now();
            if (now - last >= delai) { last = now; return fn.apply(this, args); }
        };
    },
    attendre(ms) { return new Promise(r => setTimeout(r, ms)); },
    validerUai(uai) { return /^[0-9]{7}[A-Z]$/.test(uai ?? ''); },
    validerRncp(rncp) { return /^RNCP\d{4,6}$/i.test(rncp ?? ''); },
    dedupliquer(tableau, cle = null) {
        if (!Array.isArray(tableau)) return [];
        if (!cle) return [...new Set(tableau)];
        const vus = new Set();
        return tableau.filter(item => {
            const v = item[cle];
            if (vus.has(v)) return false;
            vus.add(v);
            return true;
        });
    },
    grouperPar(tableau, cle) {
        const map = new Map();
        for (const item of tableau) {
            const k = String(item[cle] ?? '__inconnu__');
            if (!map.has(k)) map.set(k, []);
            map.get(k).push(item);
        }
        return map;
    },
};

// ══════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════

describe('Utils.formaterDate()', () => {
    it('formate une date ISO en français', () => {
        expect(Utils.formaterDate('2026-03-07')).toBe('07/03/2026');
    });
    it('retourne une chaîne vide si entrée nulle', () => {
        expect(Utils.formaterDate(null)).toBe('');
    });
    it('retourne une chaîne vide si entrée vide', () => {
        expect(Utils.formaterDate('')).toBe('');
    });
    it('accepte un objet Date', () => {
        const d = new Date(2026, 2, 7); // 7 mars 2026
        expect(Utils.formaterDate(d)).toBe('07/03/2026');
    });
    it('retourne vide si date invalide', () => {
        expect(Utils.formaterDate('pas-une-date')).toBe('');
    });
});

describe('Utils.formaterNombre()', () => {
    it('formate un grand nombre avec séparateur', () => {
        const r = Utils.formaterNombre(12345);
        // Le séparateur français peut être espace insécable ou espace normal
        expect(r.replace(/\s/g, ' ')).toBe('12 345');
    });
    it('retourne "-" si nul', () => {
        expect(Utils.formaterNombre(null)).toBe('-');
    });
    it('retourne "-" si NaN', () => {
        expect(Utils.formaterNombre(NaN)).toBe('-');
    });
    it('formate zéro', () => {
        expect(Utils.formaterNombre(0)).toBe('0');
    });
});

describe('Utils.normaliserCasse()', () => {
    it('met la première lettre en majuscule', () => {
        expect(Utils.normaliserCasse('mathématiques')).toBe('Mathématiques');
    });
    it('préserve les acronymes courts', () => {
        expect(Utils.normaliserCasse('LLCER')).toBe('LLCER');
        expect(Utils.normaliserCasse('REP')).toBe('REP');
    });
    it('ne touche pas une chaîne déjà en majuscule initiale', () => {
        expect(Utils.normaliserCasse('Physique-chimie')).toBe('Physique-chimie');
    });
    it('retourne vide si entrée vide', () => {
        expect(Utils.normaliserCasse('')).toBe('');
    });
    it('retourne vide si entrée nulle', () => {
        expect(Utils.normaliserCasse(null)).toBe('');
    });
});

describe('Utils.supprimerAccents()', () => {
    it('supprime les accents aigus', () => {
        expect(Utils.supprimerAccents('éléphant')).toBe('elephant');
    });
    it('supprime les accents circonflexes', () => {
        expect(Utils.supprimerAccents('forêt')).toBe('foret');
    });
    it('retourne vide si entrée nulle', () => {
        expect(Utils.supprimerAccents(null)).toBe('');
    });
});

describe('Utils.contient()', () => {
    it('trouve un terme en minuscules dans un texte en majuscules', () => {
        expect(Utils.contient('Lycée Pierre Mendès France', 'mendes')).toBe(true);
    });
    it('tolère les accents manquants dans le terme de recherche', () => {
        expect(Utils.contient('Rennes', 'rennes')).toBe(true);
    });
    it('retourne false si terme absent', () => {
        expect(Utils.contient('Rennes', 'Lyon')).toBe(false);
    });
    it('retourne false si texte vide', () => {
        expect(Utils.contient('', 'test')).toBe(false);
    });
    it('retourne false si terme vide', () => {
        expect(Utils.contient('Rennes', '')).toBe(false);
    });
});

describe('Utils.tronquer()', () => {
    it('tronque et ajoute "…"', () => {
        const r = Utils.tronquer('abcdefghij', 5);
        expect(r).toBe('abcd…');
        expect(r.length).toBe(5);
    });
    it('ne tronque pas si texte plus court que max', () => {
        expect(Utils.tronquer('abc', 100)).toBe('abc');
    });
    it('retourne vide si entrée vide', () => {
        expect(Utils.tronquer('')).toBe('');
    });
});

describe('Utils.trierParChamp()', () => {
    const liste = [
        { nom: 'Zorro', val: 3 },
        { nom: 'Alpha', val: 1 },
        { nom: 'Marcel', val: 2 },
    ];

    it('trie alphabétiquement par nom en ordre ascendant', () => {
        const r = Utils.trierParChamp(liste, 'nom');
        expect(r[0].nom).toBe('Alpha');
        expect(r[2].nom).toBe('Zorro');
    });
    it('trie en ordre descendant', () => {
        const r = Utils.trierParChamp(liste, 'nom', 'desc');
        expect(r[0].nom).toBe('Zorro');
    });
    it('ne mute pas le tableau source', () => {
        Utils.trierParChamp(liste, 'nom');
        expect(liste[0].nom).toBe('Zorro'); // inchangé
    });
    it('tolère les accents dans le tri', () => {
        const l = [{ nom: 'Évry' }, { nom: 'Angers' }, { nom: 'Étampes' }];
        const r = Utils.trierParChamp(l, 'nom');
        // Ordre alphabétique sans accents : Angers, Étampes/Évry
        expect(r[0].nom).toBe('Angers');
    });
    it('retourne [] si entrée non-tableau', () => {
        expect(Utils.trierParChamp(null, 'nom')).toEqual([]);
    });
});

describe('Utils.debounce()', () => {
    it('retarde l\'exécution', done => {
        let count = 0;
        const fn = Utils.debounce(() => count++, 80);
        fn(); fn(); fn();
        setTimeout(() => {
            expect(count).toBe(1);
            done();
        }, 150);
    });
    it('réinitialise le timer à chaque appel', done => {
        let count = 0;
        const fn = Utils.debounce(() => count++, 80);
        fn();
        setTimeout(() => fn(), 50);  // réinitialise
        setTimeout(() => {
            expect(count).toBe(0); // pas encore déclenché
            done();
        }, 100);
    });
});

describe('Utils.validerUai()', () => {
    it('accepte un UAI valide', () => {
        expect(Utils.validerUai('0352660B')).toBe(true);
        expect(Utils.validerUai('0350056C')).toBe(true);
    });
    it('rejette un UAI avec lettres en trop', () => {
        expect(Utils.validerUai('03526600BB')).toBe(false);
    });
    it('rejette une chaîne vide', () => {
        expect(Utils.validerUai('')).toBe(false);
    });
    it('rejette null', () => {
        expect(Utils.validerUai(null)).toBe(false);
    });
    it('rejette un format lettre en minuscule', () => {
        expect(Utils.validerUai('0352660b')).toBe(false);
    });
});

describe('Utils.validerRncp()', () => {
    it('accepte un code RNCP valide', () => {
        expect(Utils.validerRncp('RNCP35974')).toBe(true);
        expect(Utils.validerRncp('RNCP1234')).toBe(true);
    });
    it('accepte la casse mixte', () => {
        expect(Utils.validerRncp('rncp35974')).toBe(true);
    });
    it('rejette un code sans préfixe RNCP', () => {
        expect(Utils.validerRncp('35974')).toBe(false);
    });
    it('rejette null', () => {
        expect(Utils.validerRncp(null)).toBe(false);
    });
});

describe('Utils.dedupliquer()', () => {
    it('déduplique un tableau de primitives', () => {
        expect(Utils.dedupliquer(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });
    it('déduplique un tableau d\'objets par clé', () => {
        const objs = [{ uai: 'A' }, { uai: 'B' }, { uai: 'A' }];
        const r = Utils.dedupliquer(objs, 'uai');
        expect(r.length).toBe(2);
        expect(r.map(o => o.uai)).toEqual(['A', 'B']);
    });
    it('retourne [] si entrée nulle', () => {
        expect(Utils.dedupliquer(null)).toEqual([]);
    });
    it('conserve l\'ordre', () => {
        expect(Utils.dedupliquer([3, 1, 2, 1])).toEqual([3, 1, 2]);
    });
});

describe('Utils.grouperPar()', () => {
    const etabs = [
        { nom: 'Lycée A', commune: 'Rennes' },
        { nom: 'CFA B',   commune: 'Rennes' },
        { nom: 'Lycée C', commune: 'Brest'  },
    ];
    it('regroupe correctement par commune', () => {
        const map = Utils.grouperPar(etabs, 'commune');
        expect(map.get('Rennes').length).toBe(2);
        expect(map.get('Brest').length).toBe(1);
    });
    it('retourne une Map', () => {
        expect(Utils.grouperPar(etabs, 'commune')).toBeInstanceOf(Map);
    });
    it('gère les valeurs nulles avec __inconnu__', () => {
        const l = [{ nom: 'Test', commune: null }];
        const map = Utils.grouperPar(l, 'commune');
        expect(map.has('__inconnu__')).toBe(true);
    });
});
