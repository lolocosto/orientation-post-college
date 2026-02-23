/**
 * @file 07_unit_favoris_modal_ui.test.js
 * @description Tests unitaires et fonctionnels — v0.51
 *
 * Couvre les nouveautés introduites en v0.51 :
 *
 *   A. Service favorisDivers (gestion_onglet_resultats.js)
 *      - loadFavorisDivers()
 *      - isFavoriDivers(id)
 *      - toggleFavoriDivers(id, titre, typeObjet)
 *      - toggleFavoriDiversFromBtn(btn)
 *      - Limite à 50 items
 *      - Types supportés : diplome | diplome_apprentissage | dispositif | option2ndeGT
 *
 *   B. Génération HTML du panneau Favoris (gestion_params.js)
 *      - _htmlFavoriEtab(f)
 *      - _htmlFavoriDivers(f) — tous les typeObjet
 *      - _htmlFavoriSectionHeader(label, count, max)
 *      - afficherListeFavoris() — 6 sections présentes
 *      - Bouton "Voir la fiche" flex:1 vs bouton suppression ajusté
 *
 *   C. Guard anti-ouverture multiple (gestion_onglet_resultats.js)
 *      - _detailsModalOpening bloque un second appel concurrent
 *      - Flag libéré après ouverture
 *
 *   D. Compteur de navigation (details_modal.js)
 *      - hasNav = false si list null (ouverture directe)
 *      - hasNav = true si list + index passés
 *      - Compteur affiche index+1 / total de la liste filtrée
 *
 * Prérequis : Node.js ≥ 18
 * Lancement : node tests/07_unit_favoris_modal_ui.test.js
 */

'use strict';

// ── Shim environnement navigateur ────────────────────────────────────────────
const _lsStore = {};
global.localStorage = {
    getItem:    k     => _lsStore[k] ?? null,
    setItem:    (k,v) => { _lsStore[k] = String(v); },
    removeItem: k     => { delete _lsStore[k]; },
    clear:      ()    => { Object.keys(_lsStore).forEach(k => delete _lsStore[k]); },
};
global.window     = global;
global.document   = { getElementById: () => null };  // stub minimal
global.showAlert  = () => {};                         // stub toast

// ── Micro-framework de test ──────────────────────────────────────────────────
let _passed = 0, _failed = 0;
const _suites = [];
let _currentSuite = null;

function describe(label, fn) {
    const suite = { label, tests: [] };
    _suites.push(suite);
    _currentSuite = suite;
    fn();
    _currentSuite = null;
}

function it(label, fn) {
    _currentSuite.tests.push({ label, fn });
}

function expect(val) {
    return {
        toBe:         x  => { if (val !== x)           throw new Error(`Expected ${JSON.stringify(x)}, got ${JSON.stringify(val)}`); },
        toEqual:      x  => { const a = JSON.stringify(val), b = JSON.stringify(x); if (a !== b) throw new Error(`Expected\n  ${b}\ngot\n  ${a}`); },
        toBeNull:     ()  => { if (val !== null)        throw new Error(`Expected null, got ${JSON.stringify(val)}`); },
        toBeTruthy:   ()  => { if (!val)                throw new Error(`Expected truthy, got ${JSON.stringify(val)}`); },
        toBeFalsy:    ()  => { if (val)                 throw new Error(`Expected falsy, got ${JSON.stringify(val)}`); },
        toBeArray:    ()  => { if (!Array.isArray(val)) throw new Error(`Expected Array, got ${typeof val}`); },
        toHaveLength: n  => { if (val.length !== n)    throw new Error(`Expected length ${n}, got ${val.length}`); },
        toContain:    s  => { if (!String(val).includes(s)) throw new Error(`Expected "${val}" to contain "${s}"`); },
        not: {
            toContain: s => { if (String(val).includes(s)) throw new Error(`Expected "${val}" NOT to contain "${s}"`); },
            toBe:      x => { if (val === x)               throw new Error(`Expected NOT ${JSON.stringify(x)}`); },
        },
    };
}

async function runAll() {
    for (const suite of _suites) {
        console.log(`\n📦 ${suite.label}`);
        for (const test of suite.tests) {
            try {
                await test.fn();
                console.log(`  ✅ ${test.label}`);
                _passed++;
            } catch (e) {
                console.error(`  ❌ ${test.label}`);
                console.error(`     → ${e.message}`);
                _failed++;
            }
        }
    }
    console.log(`\n${'─'.repeat(55)}`);
    console.log(`Résultat : ${_passed} passés, ${_failed} échoués sur ${_passed + _failed} tests`);
    if (_failed > 0) {
        console.error('\n⛔ Des tests ont échoué !');
        process.exit(1);
    } else {
        console.log('\n🎉 Tous les tests v0.51 sont verts !');
        process.exit(0);
    }
}

// ── Chargement du service favorisDivers (isolé) ──────────────────────────────
// On extrait uniquement les fonctions pertinentes depuis gestion_onglet_resultats.js
// en substituant les dépendances non-testables (DOM, window.xxx)

const _KEY   = 'favoris_divers';
const _MAX   = 50;

function _loadFavorisDivers() {
    try { return JSON.parse(localStorage.getItem(_KEY) || '[]'); }
    catch { return []; }
}

function _isFavoriDivers(id) {
    return _loadFavorisDivers().some(f => f.id === id);
}

function _toggleFavoriDivers(id, titre, typeObjet) {
    const favoris = _loadFavorisDivers();
    const idx = favoris.findIndex(f => f.id === id);
    if (idx >= 0) {
        favoris.splice(idx, 1);
        localStorage.setItem(_KEY, JSON.stringify(favoris));
        return 'removed';
    } else {
        if (favoris.length >= _MAX) return 'limit';
        favoris.push({ id, titre, typeObjet, date: new Date().toISOString() });
        localStorage.setItem(_KEY, JSON.stringify(favoris));
        return 'added';
    }
}

function _toggleFavoriDiversFromBtn(btn) {
    return _toggleFavoriDivers(
        btn.dataset.favoriId        || '',
        btn.dataset.favoriNom       || '',
        btn.dataset.favoriTypeObjet || ''
    );
}

// ── Helpers HTML (copie des fonctions de gestion_params.js) ─────────────────
function _htmlFavoriSectionHeader(label, count, max) {
    const compteur = max ? `(${count} / ${max})` : `(${count})`;
    return `<h4 class="favoris-section-title">${label} ${compteur}</h4>`;
}

function _htmlFavoriEtab(f) {
    const date = new Date(f.date).toLocaleDateString('fr-FR');
    return `<div class="favori-card--etab">` +
           `<div class="favori-card--etab__nom">🏫 ${f.nom || '—'}</div>` +
           `<div class="favori-card--etab__meta">${f.type || ''} · ${f.commune || ''} · ${date}</div>` +
           `<div class="favori-card--etab__actions">` +
           `<button class="setting-button favori-card--etab__btn-voir" data-etab-id="${f.id}">👁️ Voir la fiche</button>` +
           `<button class="setting-button secondary favori-card--etab__btn-del" data-favori-id="${f.id}">🗑️</button>` +
           `</div></div>`;
}

function _htmlFavoriDivers(f) {
    const config = {
        diplome:               { icon: '📄', showFn: 'showDiplomeDetails' },
        diplome_apprentissage: { icon: '🎓', showFn: 'showDiplomeApprentissageDetails' },
        dispositif:            { icon: '🎯', showFn: 'showDispositifDetails' },
        option2ndeGT:          { icon: '📚', showFn: 'showOption2ndeGTDetails' },
    }[f.typeObjet] || { icon: '⭐', showFn: null };

    const date = new Date(f.date).toLocaleDateString('fr-FR');
    const argSafe = (f.titre||'').replace(/"/g,'&quot;');
    const voirBtn = config.showFn
        ? `<button class="setting-button favori-card--etab__btn-voir" data-arg="${argSafe}" onclick="toggleSettings();setTimeout(()=>${config.showFn}(this.dataset.arg),200)">👁️ Voir la fiche</button>`
        : '';
    return `<div class="favori-card--etab">` +
           `<div class="favori-card--etab__nom">${config.icon} ${f.titre || '—'}</div>` +
           `<div class="favori-card--etab__meta">${date}</div>` +
           `<div class="favori-card--etab__actions">${voirBtn}` +
           `<button class="setting-button secondary favori-card--etab__btn-del" data-favori-id="${f.id}">🗑️</button>` +
           `</div></div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// A. SERVICE FAVORIS DIVERS
// ─────────────────────────────────────────────────────────────────────────────

describe('Service favorisDivers — loadFavorisDivers()', () => {

    it('retourne un tableau vide si localStorage vide', () => {
        localStorage.clear();
        expect(_loadFavorisDivers()).toBeArray();
        expect(_loadFavorisDivers()).toHaveLength(0);
    });

    it('retourne les items stockés', () => {
        localStorage.clear();
        localStorage.setItem(_KEY, JSON.stringify([
            { id: 'diplome__CAP Boucher', titre: 'CAP Boucher', typeObjet: 'diplome', date: new Date().toISOString() }
        ]));
        const list = _loadFavorisDivers();
        expect(list).toHaveLength(1);
        expect(list[0].id).toBe('diplome__CAP Boucher');
    });

    it('retourne tableau vide si localStorage corrompu (JSON invalide)', () => {
        localStorage.setItem(_KEY, 'INVALID{JSON');
        expect(_loadFavorisDivers()).toBeArray();
        expect(_loadFavorisDivers()).toHaveLength(0);
    });
});

describe('Service favorisDivers — isFavoriDivers(id)', () => {

    it('retourne false pour un id inconnu', () => {
        localStorage.clear();
        expect(_isFavoriDivers('diplome__Inconnu')).toBe(false);
    });

    it('retourne true pour un id présent', () => {
        localStorage.clear();
        localStorage.setItem(_KEY, JSON.stringify([
            { id: 'dispositif__Cordée', titre: 'Cordée de la réussite', typeObjet: 'dispositif', date: new Date().toISOString() }
        ]));
        expect(_isFavoriDivers('dispositif__Cordée')).toBe(true);
    });

    it('est sensible à la casse de l\'id', () => {
        localStorage.clear();
        localStorage.setItem(_KEY, JSON.stringify([
            { id: 'diplome__cap menuisier', titre: 'CAP Menuisier', typeObjet: 'diplome', date: new Date().toISOString() }
        ]));
        expect(_isFavoriDivers('diplome__CAP Menuisier')).toBe(false);
        expect(_isFavoriDivers('diplome__cap menuisier')).toBe(true);
    });
});

describe('Service favorisDivers — toggleFavoriDivers() : ajout', () => {

    it('ajoute un favori diplôme et retourne "added"', () => {
        localStorage.clear();
        const result = _toggleFavoriDivers('diplome__CAP Boucher', 'CAP Boucher', 'diplome');
        expect(result).toBe('added');
        expect(_loadFavorisDivers()).toHaveLength(1);
    });

    it('le favori ajouté contient id, titre, typeObjet, date', () => {
        localStorage.clear();
        _toggleFavoriDivers('option2ndeGT__Chinois', 'Chinois', 'option2ndeGT');
        const list = _loadFavorisDivers();
        const f = list[0];
        expect(f.id).toBe('option2ndeGT__Chinois');
        expect(f.titre).toBe('Chinois');
        expect(f.typeObjet).toBe('option2ndeGT');
        expect(f.date).toBeTruthy();
    });

    it('ajoute un favori pour chaque typeObjet supporté', () => {
        localStorage.clear();
        _toggleFavoriDivers('diplome__A',               'A', 'diplome');
        _toggleFavoriDivers('diplome_apprentissage__B', 'B', 'diplome_apprentissage');
        _toggleFavoriDivers('dispositif__C',            'C', 'dispositif');
        _toggleFavoriDivers('option2ndeGT__D',          'D', 'option2ndeGT');
        expect(_loadFavorisDivers()).toHaveLength(4);
    });

    it('n\'ajoute pas de doublon si id déjà présent (retourne "removed")', () => {
        localStorage.clear();
        _toggleFavoriDivers('diplome__X', 'X', 'diplome');
        const result = _toggleFavoriDivers('diplome__X', 'X', 'diplome');
        expect(result).toBe('removed');
        expect(_loadFavorisDivers()).toHaveLength(0);
    });
});

describe('Service favorisDivers — toggleFavoriDivers() : suppression', () => {

    it('retire le favori existant et retourne "removed"', () => {
        localStorage.clear();
        _toggleFavoriDivers('dispositif__D', 'D', 'dispositif');
        const result = _toggleFavoriDivers('dispositif__D', 'D', 'dispositif');
        expect(result).toBe('removed');
        expect(_loadFavorisDivers()).toHaveLength(0);
    });

    it('ne supprime qu\'un seul item quand plusieurs présents', () => {
        localStorage.clear();
        _toggleFavoriDivers('diplome__A', 'A', 'diplome');
        _toggleFavoriDivers('diplome__B', 'B', 'diplome');
        _toggleFavoriDivers('diplome__A', 'A', 'diplome');  // supprime A
        const list = _loadFavorisDivers();
        expect(list).toHaveLength(1);
        expect(list[0].id).toBe('diplome__B');
    });
});

describe('Service favorisDivers — limite à 50 items', () => {

    it('bloque l\'ajout au-delà de 50 items et retourne "limit"', () => {
        localStorage.clear();
        // Pré-remplir 50 items directement (évite les 50 toggles)
        const plein = Array.from({ length: _MAX }, (_, i) => ({
            id: `diplome__item${i}`, titre: `Item ${i}`, typeObjet: 'diplome',
            date: new Date().toISOString()
        }));
        localStorage.setItem(_KEY, JSON.stringify(plein));

        const result = _toggleFavoriDivers('diplome__nouveau', 'Nouveau', 'diplome');
        expect(result).toBe('limit');
        expect(_loadFavorisDivers()).toHaveLength(50);
    });

    it('permet d\'ajouter après avoir retiré un item (retour sous la limite)', () => {
        // Après le test précédent : 50 items, on en retire un
        _toggleFavoriDivers('diplome__item0', 'Item 0', 'diplome');
        expect(_loadFavorisDivers()).toHaveLength(49);

        const result = _toggleFavoriDivers('diplome__nouveau', 'Nouveau', 'diplome');
        expect(result).toBe('added');
        expect(_loadFavorisDivers()).toHaveLength(50);
    });
});

describe('Service favorisDivers — toggleFavoriDiversFromBtn()', () => {

    it('lit les data-attributes du bouton et ajoute le favori', () => {
        localStorage.clear();
        const btn = {
            dataset: {
                favoriId:        'diplome__CAP Carreleur',
                favoriNom:       'CAP Carreleur',
                favoriTypeObjet: 'diplome',
            }
        };
        const result = _toggleFavoriDiversFromBtn(btn);
        expect(result).toBe('added');
        expect(_isFavoriDivers('diplome__CAP Carreleur')).toBe(true);
    });

    it('lit les data-attributes du bouton et retire le favori si déjà présent', () => {
        // Déjà ajouté lors du test précédent
        const btn = {
            dataset: {
                favoriId:        'diplome__CAP Carreleur',
                favoriNom:       'CAP Carreleur',
                favoriTypeObjet: 'diplome',
            }
        };
        const result = _toggleFavoriDiversFromBtn(btn);
        expect(result).toBe('removed');
    });

    it('gère gracieusement les data-attributes manquants (id vide)', () => {
        localStorage.clear();
        const btn = { dataset: {} };
        // id vide '' → sera traité comme id='' ; ne doit pas lever d'exception
        const result = _toggleFavoriDiversFromBtn(btn);
        expect(result).toBe('added'); // id='' ajouté une première fois
        const list = _loadFavorisDivers();
        expect(list[0].id).toBe('');  // cas dégradé géré sans crash
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// B. GÉNÉRATION HTML — PANNEAU FAVORIS
// ─────────────────────────────────────────────────────────────────────────────

describe('_htmlFavoriSectionHeader()', () => {

    it('affiche le label et le compteur avec max', () => {
        const html = _htmlFavoriSectionHeader('🏫 Établissements', 3, 20);
        expect(html).toContain('🏫 Établissements');
        expect(html).toContain('3 / 20');
        expect(html).toContain('favoris-section-title');
    });

    it('affiche le compteur sans max si max = 0', () => {
        const html = _htmlFavoriSectionHeader('📄 Diplômes', 5, 0);
        expect(html).toContain('(5)');
        // Vérifier que "(5)" est présent et qu'il n'y a pas de " / " (avec espaces)
        expect(html).not.toContain(' / ');
    });

    it('affiche "0" correctement', () => {
        const html = _htmlFavoriSectionHeader('🎓 Diplômes apprentissage', 0, 0);
        expect(html).toContain('(0)');
    });
});

describe('_htmlFavoriEtab(f)', () => {

    const f = {
        id: 'etab_0352660B',
        nom: 'Lycée Pierre Mendès France',
        type: 'lycée professionnel',
        commune: 'Rennes',
        date: '2026-02-20T10:00:00.000Z',
    };

    it('contient le nom de l\'établissement', () => {
        expect(_htmlFavoriEtab(f)).toContain('Lycée Pierre Mendès France');
    });

    it('contient le bouton "Voir la fiche" avec classe btn-voir', () => {
        const html = _htmlFavoriEtab(f);
        expect(html).toContain('favori-card--etab__btn-voir');
        expect(html).toContain('Voir la fiche');
    });

    it('contient le bouton de suppression avec classe btn-del', () => {
        expect(_htmlFavoriEtab(f)).toContain('favori-card--etab__btn-del');
    });

    it('le data-etab-id est présent sur le bouton voir', () => {
        expect(_htmlFavoriEtab(f)).toContain(`data-etab-id="${f.id}"`);
    });

    it('gère un nom absent avec "—"', () => {
        const sans_nom = { ...f, nom: '' };
        expect(_htmlFavoriEtab(sans_nom)).toContain('🏫 —');
    });
});

describe('_htmlFavoriDivers(f) — par typeObjet', () => {

    const makeF = (typeObjet) => ({
        id: `${typeObjet}__Test`, titre: 'Test', typeObjet,
        date: new Date().toISOString()
    });

    it('diplome → icône 📄 et showFn showDiplomeDetails', () => {
        const html = _htmlFavoriDivers(makeF('diplome'));
        expect(html).toContain('📄');
        expect(html).toContain('showDiplomeDetails');
    });

    it('diplome_apprentissage → icône 🎓 et showFn showDiplomeApprentissageDetails', () => {
        const html = _htmlFavoriDivers(makeF('diplome_apprentissage'));
        expect(html).toContain('🎓');
        expect(html).toContain('showDiplomeApprentissageDetails');
    });

    it('dispositif → icône 🎯 et showFn showDispositifDetails', () => {
        const html = _htmlFavoriDivers(makeF('dispositif'));
        expect(html).toContain('🎯');
        expect(html).toContain('showDispositifDetails');
    });

    it('option2ndeGT → icône 📚 et showFn showOption2ndeGTDetails', () => {
        const html = _htmlFavoriDivers(makeF('option2ndeGT'));
        expect(html).toContain('📚');
        expect(html).toContain('showOption2ndeGTDetails');
    });

    it('typeObjet inconnu → icône ⭐ et pas de bouton voir', () => {
        const html = _htmlFavoriDivers({ id: 'x__y', titre: 'Y', typeObjet: 'inconnu', date: new Date().toISOString() });
        expect(html).toContain('⭐');
        expect(html).not.toContain('Voir la fiche');
    });

    it('contient toujours le bouton de suppression btn-del', () => {
        ['diplome', 'diplome_apprentissage', 'dispositif', 'option2ndeGT'].forEach(type => {
            expect(_htmlFavoriDivers(makeF(type))).toContain('favori-card--etab__btn-del');
        });
    });

    it('les guillemets dans le titre sont encodés en &quot; (sécurité XSS)', () => {
        const f = { id: 'diplome__X', titre: 'BTS "Compta"', typeObjet: 'diplome', date: new Date().toISOString() };
        const html = _htmlFavoriDivers(f);
        // L'attribut data-arg doit encoder les guillemets
        expect(html).toContain('&quot;');
    });
});

describe('afficherListeFavoris() — structure des 6 sections', () => {

    // On reconstruit la logique de afficherListeFavoris en local pour tester
    // sans dépendance au DOM réel
    function buildFavorisHtml(favorisEtab, favorisDiversList, favorisRecherche) {
        const HR = `<hr class="favoris-separator">`;
        const parType = {
            diplome:               favorisDiversList.filter(f => f.typeObjet === 'diplome'),
            diplome_apprentissage: favorisDiversList.filter(f => f.typeObjet === 'diplome_apprentissage'),
            dispositif:            favorisDiversList.filter(f => f.typeObjet === 'dispositif'),
            option2ndeGT:          favorisDiversList.filter(f => f.typeObjet === 'option2ndeGT'),
        };
        let html = '';
        html += _htmlFavoriSectionHeader('🏫 Établissements',          favorisEtab.length, 20);
        html += HR;
        html += _htmlFavoriSectionHeader('📄 Diplômes scolaires',       parType.diplome.length, 0);
        html += HR;
        html += _htmlFavoriSectionHeader('🎓 Diplômes apprentissage',   parType.diplome_apprentissage.length, 0);
        html += HR;
        html += _htmlFavoriSectionHeader('🎯 Dispositifs',              parType.dispositif.length, 0);
        html += HR;
        html += _htmlFavoriSectionHeader('📚 Options 2nde GT',          parType.option2ndeGT.length, 0);
        html += HR;
        html += _htmlFavoriSectionHeader('🔍 Recherches favorites',     favorisRecherche.length, 10);
        return html;
    }

    it('contient les 6 en-têtes de section', () => {
        const html = buildFavorisHtml([], [], []);
        expect(html).toContain('🏫 Établissements');
        expect(html).toContain('📄 Diplômes scolaires');
        expect(html).toContain('🎓 Diplômes apprentissage');
        expect(html).toContain('🎯 Dispositifs');
        expect(html).toContain('📚 Options 2nde GT');
        expect(html).toContain('🔍 Recherches favorites');
    });

    it('affiche le bon compteur pour chaque section', () => {
        const etabs    = [{ id: 'e1', nom: 'A', date: new Date().toISOString() }];
        const divers   = [
            { id: 'diplome__X', titre: 'X', typeObjet: 'diplome', date: new Date().toISOString() },
            { id: 'diplome__Y', titre: 'Y', typeObjet: 'diplome', date: new Date().toISOString() },
        ];
        const rech = [{ id: 'r1', nom: 'R1', type: 'geo', date: new Date().toISOString() }];
        const html = buildFavorisHtml(etabs, divers, rech);
        expect(html).toContain('1 / 20');   // établissements : 1 / 20
        expect(html).toContain('(2)');       // diplômes scolaires : 2
        expect(html).toContain('1 / 10');   // recherches : 1 / 10
    });

    it('les 5 séparateurs <hr class="favoris-separator"> sont présents', () => {
        const html = buildFavorisHtml([], [], []);
        const count = (html.match(/favoris-separator/g) || []).length;
        expect(count).toBe(5);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// C. GUARD ANTI-OUVERTURE MULTIPLE (_detailsModalOpening)
// ─────────────────────────────────────────────────────────────────────────────

describe('Guard _detailsModalOpening', () => {

    // Simulation du comportement du guard dans showEtablissementDetails
    function makeShowFn(asyncWork) {
        global._detailsModalOpening = false;

        return async function showSomething() {
            if (global._detailsModalOpening) return 'ignored';
            global._detailsModalOpening = true;
            try {
                const result = await asyncWork();
                return result;
            } finally {
                global._detailsModalOpening = false;
            }
        };
    }

    it('le premier appel s\'exécute', async () => {
        let delay = (ms) => new Promise(r => setTimeout(r, ms));
        const show = makeShowFn(async () => { await delay(20); return 'done'; });
        const result = await show();
        expect(result).toBe('done');
    });

    it('le second appel concurrent est ignoré', async () => {
        let delay = (ms) => new Promise(r => setTimeout(r, ms));
        const show = makeShowFn(async () => { await delay(50); return 'done'; });

        const p1 = show();       // premier appel : prend 50ms
        const p2 = show();       // second appel immédiat : ignoré
        const [r1, r2] = await Promise.all([p1, p2]);
        expect(r1).toBe('done');
        expect(r2).toBe('ignored');
    });

    it('le flag est remis à false après exécution normale', async () => {
        const show = makeShowFn(async () => 'ok');
        await show();
        expect(global._detailsModalOpening).toBe(false);
    });

    it('le flag est remis à false même en cas d\'erreur (finally)', async () => {
        const showWithError = makeShowFn(async () => { throw new Error('oops'); });
        try { await showWithError(); } catch { /* attendu */ }
        expect(global._detailsModalOpening).toBe(false);
    });

    it('après reset du flag, un nouvel appel s\'exécute', async () => {
        const show = makeShowFn(async () => 'ok2');
        await show();         // premier appel : OK, reset flag
        const result = await show();  // second appel après reset : OK
        expect(result).toBe('ok2');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// D. COMPTEUR DE NAVIGATION DANS LES MODALES
// ─────────────────────────────────────────────────────────────────────────────

describe('Compteur de navigation dans les modales', () => {

    // Simulation de la logique de #renderModal (details_modal.js)
    function buildNavHtml(list, index) {
        const hasNav  = list && list.length > 0 && index >= 0;
        const hasPrev = hasNav && index > 0;
        const hasNext = hasNav && index < list.length - 1;

        if (!hasNav) {
            return `<div class="detail-nav-spacer"></div>`;
        }
        return `<nav class="detail-header-bar__nav">` +
               `<button class="detail-nav-btn" ${hasPrev ? '' : 'disabled'}>◀ Précédent</button>` +
               `<span class="detail-nav-counter">${index + 1} / ${list.length}</span>` +
               `<button class="detail-nav-btn" ${hasNext ? '' : 'disabled'}>Suivant ▶</button>` +
               `</nav>`;
    }

    it('pas de navigation si list = null (ouverture directe / depuis carte)', () => {
        const html = buildNavHtml(null, -1);
        expect(html).toContain('detail-nav-spacer');
        expect(html).not.toContain('detail-nav-counter');
    });

    it('pas de navigation si list vide', () => {
        const html = buildNavHtml([], 0);
        expect(html).toContain('detail-nav-spacer');
    });

    it('navigation présente si list et index valides', () => {
        const list = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const html = buildNavHtml(list, 1);
        expect(html).toContain('detail-nav-counter');
        expect(html).toContain('2 / 3');
    });

    it('compteur = "1 / N" pour le premier élément', () => {
        const list = [{ id: 1 }, { id: 2 }, { id: 5 }];
        const html = buildNavHtml(list, 0);
        expect(html).toContain('1 / 3');
    });

    it('compteur = "N / N" pour le dernier élément', () => {
        const list = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const html = buildNavHtml(list, 2);
        expect(html).toContain('3 / 3');
    });

    it('bouton Précédent désactivé sur le premier élément', () => {
        const list = [{ id: 1 }, { id: 2 }];
        const html = buildNavHtml(list, 0);
        // Le bouton Précédent doit avoir disabled
        const prevDisabled = html.indexOf('disabled') < html.indexOf('Précédent');
        expect(prevDisabled).toBe(true);
    });

    it('bouton Suivant désactivé sur le dernier élément', () => {
        const list = [{ id: 1 }, { id: 2 }];
        const html = buildNavHtml(list, 1);
        // Le bouton Suivant doit avoir disabled
        // On vérifie que "disabled" apparaît après "Suivant" est précédé de "disabled"
        // Plus simple : le bouton contient "disabled" dans sa moitié droite du HTML
        const suivantIdx   = html.indexOf('Suivant');
        const disabledIdxs = [...html.matchAll(/disabled/g)].map(m => m.index);
        // Au moins un "disabled" doit être proche (avant) le "Suivant"
        const hasDisabledNearSuivant = disabledIdxs.some(i => Math.abs(i - suivantIdx) < 50);
        expect(hasDisabledNearSuivant).toBe(true);
    });

    it('boutons Précédent ET Suivant actifs pour un élément du milieu', () => {
        const list = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const html = buildNavHtml(list, 1);
        // disabled ne doit apparaître qu'une seule fois maximum (ou zéro)
        // Dans notre cas (milieu) : aucun disabled car les deux boutons sont actifs
        const disabledCount = (html.match(/disabled/g) || []).length;
        expect(disabledCount).toBe(0);
    });

    it('le compteur reflète la liste filtrée et non la totalité de la base', () => {
        // Simulation : base de 100 établissements, filtre → 7 résultats, on est à l'index 4
        const filteredData = Array.from({ length: 7 }, (_, i) => ({ id: i }));
        const html = buildNavHtml(filteredData, 4);
        expect(html).toContain('5 / 7');
        // Le compteur ne doit PAS afficher /100
        expect(html).not.toContain('/ 100');
    });

    it('liste de 1 élément : Précédent ET Suivant désactivés', () => {
        const list = [{ id: 1 }];
        const html = buildNavHtml(list, 0);
        expect(html).toContain('1 / 1');
        const disabledCount = (html.match(/disabled/g) || []).length;
        expect(disabledCount).toBe(2);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Lancement
// ─────────────────────────────────────────────────────────────────────────────
runAll();
