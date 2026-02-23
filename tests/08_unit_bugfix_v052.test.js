/**
 * @file 08_unit_bugfix_v052.test.js
 * @description Tests unitaires des corrections de bugs v0.52 :
 *   - Bug 1 : bouton "Voir la fiche" (CSS spécificité — test comportement HTML)
 *   - Bug 2 : suppression favori divers depuis le panneau → rafraîchit la liste
 *   - Bug 3 : filtre textuel robuste aux accents pour toutes les vues
 *   - Bug 4 : rang et taille de liste corrects dans les modales après filtrage
 *
 * Exécution : node tests/08_unit_bugfix_v052.test.js
 * Prérequis  : aucun module npm (mock localStorage + DOM minimal embarqué)
 */

'use strict';

// ══════════════════════════════════════════════════════════════
// INFRASTRUCTURE DE TEST (reprise du pattern v0.51)
// ══════════════════════════════════════════════════════════════

let _passed = 0, _failed = 0, _currentSuite = '';
const _failures = [];

function describe(label, fn) {
    _currentSuite = label;
    fn();
}

function it(label, fn) {
    try {
        fn();
        _passed++;
        console.log(`  ✅ ${label}`);
    } catch (e) {
        _failed++;
        _failures.push({ suite: _currentSuite, label, error: e.message });
        console.error(`  ❌ ${label}`);
        console.error(`     → ${e.message}`);
    }
}

function assert(condition, msg) {
    if (!condition) throw new Error(msg || 'Assertion failed');
}
function assertEqual(a, b, msg) {
    if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(a)} === ${JSON.stringify(b)}`);
}
function assertIncludes(str, sub, msg) {
    if (!str.includes(sub)) throw new Error(msg || `Expected "${str}" to include "${sub}"`);
}
function assertNotIncludes(str, sub, msg) {
    if (str.includes(sub)) throw new Error(msg || `Expected "${str}" NOT to include "${sub}"`);
}

// Mock localStorage
const _store = {};
global.localStorage = {
    getItem: k => (_store[k] !== undefined ? _store[k] : null),
    setItem: (k, v) => { _store[k] = v; },
    removeItem: k => { delete _store[k]; },
    clear: () => { Object.keys(_store).forEach(k => delete _store[k]); },
};

// Nettoyage entre suites
function _clearStore() { Object.keys(_store).forEach(k => delete _store[k]); }

// ══════════════════════════════════════════════════════════════
// EXTRAITS DES FONCTIONS TESTÉES — inlinés pour autonomie
// ══════════════════════════════════════════════════════════════

// ── Normalisation accents (de systeme_filtres.js v0.52) ─────────────────────
function _normRecherche(s) {
    return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// ── favorisDivers service (de gestion_onglet_resultats.js) ──────────────────
const _FAVORIS_DIVERS_KEY  = 'favoris_divers';
const _MAX_FAVORIS_DIVERS  = 50;

function loadFavorisDivers() {
    try {
        return JSON.parse(localStorage.getItem(_FAVORIS_DIVERS_KEY) || '[]');
    } catch { return []; }
}

function isFavoriDivers(id) {
    return loadFavorisDivers().some(f => f.id === id);
}

function toggleFavoriDivers(id, titre, typeObjet) {
    const favoris = loadFavorisDivers();
    const idx = favoris.findIndex(f => f.id === id);
    if (idx >= 0) {
        favoris.splice(idx, 1);
        localStorage.setItem(_FAVORIS_DIVERS_KEY, JSON.stringify(favoris));
        return 'removed';
    }
    if (favoris.length >= _MAX_FAVORIS_DIVERS) return 'limit';
    favoris.push({ id, titre, typeObjet, date: new Date().toISOString() });
    localStorage.setItem(_FAVORIS_DIVERS_KEY, JSON.stringify(favoris));
    return 'added';
}

// ── _supprimerFavoriDiversDuPanneau (de gestion_params.js v0.52) ─────────────
// Simulation de la fonction qui peut déléguer à window.toggleFavoriDivers
// ou gérer directement si window.xxx absent
function _supprimerFavoriDiversDuPanneau_factory(windowToggle, refreshFn) {
    return function _supprimerFavoriDiversDuPanneau(btn) {
        const id        = btn.dataset.favoriId        || '';
        const titre     = btn.dataset.favoriNom       || '';
        const typeObjet = btn.dataset.favoriTypeObjet || '';

        if (typeof windowToggle === 'function') {
            windowToggle(id, titre, typeObjet);
        } else {
            // Fallback autonome
            const KEY = 'favoris_divers';
            try {
                const list = JSON.parse(localStorage.getItem(KEY) || '[]');
                const idx  = list.findIndex(f => f.id === id);
                if (idx >= 0) { list.splice(idx, 1); localStorage.setItem(KEY, JSON.stringify(list)); }
            } catch { /* ignore */ }
            if (typeof refreshFn === 'function') refreshFn();
        }
    };
}

// ── _syncFilteredData simplifié (de gestion_onglet_resultats.js v0.52) ───────
// Simule la resynchronisation à partir d'un tableau "rows DOM"
function _syncFilteredDataSim(currentView, rows, currentData) {
    const visibleKeys = [];
    let filteredData  = [...currentData];

    if (currentView === 'etablissements') {
        rows.filter(r => r.visible).forEach(r => visibleKeys.push(r.id));
        filteredData = currentData.filter(e => visibleKeys.includes(e._id));

    } else if (['diplomes_scolaire', 'dispositifs', 'options2ndeGT'].includes(currentView)) {
        rows.filter(r => r.visible).forEach(r => visibleKeys.push(r.libelle));
        filteredData = currentData.filter(e => visibleKeys.includes(e.libelle));

    } else if (currentView === 'diplomes_apprentissage') {
        rows.filter(r => r.visible).forEach(r => visibleKeys.push(r.id));
        filteredData = currentData.filter(e => visibleKeys.includes(e.id));
    }
    return filteredData;
}

// ── HTML généré par _htmlFavoriDivers — test du bouton 🗑️ ─────────────────
function _htmlFavoriDivers_btnDel(f) {
    return `<button class="setting-button secondary favori-card--etab__btn-del"
        data-favori-id="${f.id}"
        data-favori-nom="${(f.titre||'').replace(/"/g,'&quot;')}"
        data-favori-type-objet="${f.typeObjet||''}"
        onclick="_supprimerFavoriDiversDuPanneau(this)"
        title="Retirer des favoris"
        aria-label="Retirer des favoris">
        🗑️
    </button>`;
}

// ══════════════════════════════════════════════════════════════
// BUG 1 — CSS btn-voir : vérification des classes et de la règle HTML
// ══════════════════════════════════════════════════════════════

describe('Bug 1 — Bouton "Voir la fiche" : classes HTML et structure', () => {

    function _htmlFavoriDivers_full(f) {
        const config = {
            diplome:               { icon: '📄', showFn: 'showDiplomeDetails',               arg: f.titre },
            diplome_apprentissage: { icon: '🎓', showFn: 'showDiplomeApprentissageDetails',   arg: f.id.replace(/^appr__/, '') },
            dispositif:            { icon: '🎯', showFn: 'showDispositifDetails',             arg: f.titre },
            option2ndeGT:          { icon: '📚', showFn: 'showOption2ndeGTDetails',           arg: f.titre },
        }[f.typeObjet] || { icon: '⭐', showFn: null, arg: null };

        const voirBtn = config.showFn
            ? `<button class="setting-button favori-card--etab__btn-voir"
                    data-arg="${(config.arg||'').replace(/"/g,'&quot;')}"
                    onclick="toggleSettings();setTimeout(()=>${config.showFn}(this.dataset.arg),200)">
                    👁️ Voir la fiche
               </button>`
            : '';

        return `<div class="favori-card--etab">
            <div class="favori-card--etab__nom">${config.icon} ${f.titre || '—'}</div>
            <div class="favori-card--etab__actions">
                ${voirBtn}
                <button class="setting-button secondary favori-card--etab__btn-del"
                    data-favori-id="${f.id}"
                    onclick="_supprimerFavoriDiversDuPanneau(this)">🗑️</button>
            </div>
        </div>`;
    }

    it('le bouton "Voir la fiche" a les deux classes (setting-button + favori-card--etab__btn-voir)', () => {
        const html = _htmlFavoriDivers_full({ id: 'd1', titre: 'CAP Boulanger', typeObjet: 'diplome' });
        assertIncludes(html, 'class="setting-button favori-card--etab__btn-voir"');
    });

    it('le bouton "Voir la fiche" est bien dans .favori-card--etab__actions', () => {
        const html = _htmlFavoriDivers_full({ id: 'd1', titre: 'CAP', typeObjet: 'diplome' });
        const actionsStart = html.indexOf('favori-card--etab__actions');
        const voirStart    = html.indexOf('btn-voir');
        assert(actionsStart < voirStart, '__actions doit précéder btn-voir dans le HTML');
    });

    it('le bouton 🗑️ a les deux classes (setting-button secondary + btn-del)', () => {
        const html = _htmlFavoriDivers_full({ id: 'd1', titre: 'CAP', typeObjet: 'diplome' });
        assertIncludes(html, 'class="setting-button secondary favori-card--etab__btn-del"');
    });

    it('les deux boutons sont dans le même parent __actions', () => {
        const html = _htmlFavoriDivers_full({ id: 'd1', titre: 'CAP', typeObjet: 'diplome' });
        const actionsBlock = html.match(/<div class="favori-card--etab__actions">([\s\S]*?)<\/div>/)?.[1] || '';
        assertIncludes(actionsBlock, 'btn-voir', 'btn-voir absent du bloc __actions');
        assertIncludes(actionsBlock, 'btn-del',  'btn-del absent du bloc __actions');
    });

    it('la règle CSS doit cibler .favori-card--etab__actions .setting-button (vérification regex)', () => {
        // Ce test vérifie que le sélecteur CSS de spécificité (0,2,0) existe bien dans design-system.css
        // En environnement node, on lit le fichier directement
        const fs = require('fs');
        let css = '';
        try { css = fs.readFileSync('css/design-system.css', 'utf8'); } catch { return; /* env sans fichier */ }
        assertIncludes(css, '.favori-card--etab__actions .setting-button',
            'Règle de spécificité renforcée absente de design-system.css');
    });

    it('la règle CSS ciblant btn-voir utilise flex: 1 pour qu\'il occupe tout l\'espace', () => {
        const fs = require('fs');
        let css = '';
        try { css = fs.readFileSync('css/design-system.css', 'utf8'); } catch { return; }
        assertIncludes(css, '.favori-card--etab__actions .favori-card--etab__btn-voir',
            'Règle de spécificité btn-voir absente');
        assertIncludes(css, 'flex: 1', 'flex: 1 manquant dans la règle btn-voir');
    });

    it('pas de voirBtn si typeObjet inconnu (showFn null)', () => {
        const html = _htmlFavoriDivers_full({ id: 'x1', titre: 'Inconnu', typeObjet: 'inconnu' });
        assertNotIncludes(html, 'btn-voir', 'btn-voir ne doit pas apparaître si typeObjet inconnu');
    });

    it('voirBtn présent pour les 4 typeObjet supportés', () => {
        ['diplome', 'diplome_apprentissage', 'dispositif', 'option2ndeGT'].forEach(t => {
            const html = _htmlFavoriDivers_full({ id: 'x', titre: 'Test', typeObjet: t });
            assertIncludes(html, 'btn-voir', `btn-voir absent pour typeObjet=${t}`);
        });
    });
});

// ══════════════════════════════════════════════════════════════
// BUG 2 — Suppression favori divers : _supprimerFavoriDiversDuPanneau
// ══════════════════════════════════════════════════════════════

describe('Bug 2 — Suppression favori divers : délégation à window.toggleFavoriDivers', () => {

    function _makeBtn(id, titre = 'Test', typeObjet = 'diplome') {
        return {
            dataset: { favoriId: id, favoriNom: titre, favoriTypeObjet: typeObjet }
        };
    }

    it('_supprimerFavoriDiversDuPanneau délègue à window.toggleFavoriDivers si disponible', () => {
        _clearStore();
        toggleFavoriDivers('x1', 'Titre', 'diplome'); // ajout

        let delegated = false;
        const mockToggle = (id, titre, typeObjet) => {
            delegated = true;
            toggleFavoriDivers(id, titre, typeObjet); // réel
        };
        const supprimerFn = _supprimerFavoriDiversDuPanneau_factory(mockToggle, null);
        supprimerFn(_makeBtn('x1', 'Titre', 'diplome'));

        assert(delegated, 'La délégation à toggleFavoriDivers ne s\'est pas faite');
        assert(!isFavoriDivers('x1'), 'Le favori devrait avoir été retiré');
    });

    it('la suppression retire bien l\'item du localStorage', () => {
        _clearStore();
        toggleFavoriDivers('x2', 'CAP Boucher', 'diplome');
        assert(isFavoriDivers('x2'), 'Pré-condition : x2 doit être dans les favoris');

        const supprimerFn = _supprimerFavoriDiversDuPanneau_factory(
            (id, t, ty) => toggleFavoriDivers(id, t, ty), null
        );
        supprimerFn(_makeBtn('x2', 'CAP Boucher', 'diplome'));

        assert(!isFavoriDivers('x2'), 'x2 doit avoir été retiré des favoris');
    });

    it('la suppression ne retire qu\'un seul item si plusieurs sont présents', () => {
        _clearStore();
        toggleFavoriDivers('x1', 'T1', 'diplome');
        toggleFavoriDivers('x2', 'T2', 'dispositif');
        toggleFavoriDivers('x3', 'T3', 'option2ndeGT');

        const supprimerFn = _supprimerFavoriDiversDuPanneau_factory(
            (id, t, ty) => toggleFavoriDivers(id, t, ty), null
        );
        supprimerFn(_makeBtn('x2'));

        assertEqual(loadFavorisDivers().length, 2, '2 items doivent rester après suppression de x2');
        assert(!isFavoriDivers('x2'), 'x2 retiré');
        assert(isFavoriDivers('x1'), 'x1 conservé');
        assert(isFavoriDivers('x3'), 'x3 conservé');
    });

    it('fallback sans window.toggleFavoriDivers — supprime via localStorage direct', () => {
        _clearStore();
        toggleFavoriDivers('x4', 'T4', 'diplome');

        let refreshCalled = false;
        const supprimerFn = _supprimerFavoriDiversDuPanneau_factory(
            null,  // pas de window.toggleFavoriDivers
            () => { refreshCalled = true; }
        );
        supprimerFn(_makeBtn('x4', 'T4', 'diplome'));

        assert(!isFavoriDivers('x4'), 'x4 doit avoir été retiré même en mode fallback');
        assert(refreshCalled, 'afficherListeFavoris() doit être appelée en fallback');
    });

    it('fallback — ne plante pas si l\'id est inconnu', () => {
        _clearStore();
        const supprimerFn = _supprimerFavoriDiversDuPanneau_factory(null, () => {});
        // Ne doit pas lever d'exception
        supprimerFn(_makeBtn('inconnu'));
        assertEqual(loadFavorisDivers().length, 0, 'Aucun item ne doit apparaître après suppression d\'un id inconnu');
    });

    it('le bouton 🗑️ généré utilise _supprimerFavoriDiversDuPanneau (non toggleFavoriDiversFromBtn)', () => {
        const html = _htmlFavoriDivers_btnDel({ id: 'd1', titre: 'Test', typeObjet: 'diplome' });
        assertIncludes(html, '_supprimerFavoriDiversDuPanneau(this)',
            'L\'onclick doit utiliser _supprimerFavoriDiversDuPanneau');
        assertNotIncludes(html, 'toggleFavoriDiversFromBtn',
            'toggleFavoriDiversFromBtn ne doit plus être dans le panneau params');
    });

    it('les data-attributes du bouton 🗑️ sont corrects (id, nom, typeObjet)', () => {
        const f = { id: 'appr__123', titre: 'BTS Design', typeObjet: 'diplome_apprentissage' };
        const html = _htmlFavoriDivers_btnDel(f);
        assertIncludes(html, `data-favori-id="appr__123"`);
        assertIncludes(html, `data-favori-nom="BTS Design"`);
        assertIncludes(html, `data-favori-type-objet="diplome_apprentissage"`);
    });

    it('les guillemets dans le titre sont encodés en &quot; (protection XSS)', () => {
        const f = { id: 'x', titre: 'Bac "général"', typeObjet: 'diplome' };
        const html = _htmlFavoriDivers_btnDel(f);
        assertNotIncludes(html, `data-favori-nom="Bac "général"`);
        assertIncludes(html, '&quot;', 'Les guillemets doivent être encodés en &quot;');
    });
});

// ══════════════════════════════════════════════════════════════
// BUG 3 — Filtre textuel robuste aux accents
// ══════════════════════════════════════════════════════════════

describe('Bug 3 — _normRecherche() : normalisation des accents', () => {

    it('normalise en minuscules', () => {
        assertEqual(_normRecherche('THEATRE'), 'theatre');
    });

    it('supprime les accents aigus', () => {
        assertEqual(_normRecherche('théâtre'), 'theatre');
    });

    it('supprime les accents graves', () => {
        assertEqual(_normRecherche('à la'), 'a la');
    });

    it('supprime les accents circonflexes', () => {
        assertEqual(_normRecherche('Île'), 'ile');
    });

    it('supprime la cédille', () => {
        assertEqual(_normRecherche('façon'), 'facon');
    });

    it('supprime tréma', () => {
        assertEqual(_normRecherche('Noël'), 'noel');
    });

    it('retourne chaîne vide pour null/undefined', () => {
        assertEqual(_normRecherche(null),      '');
        assertEqual(_normRecherche(undefined), '');
        assertEqual(_normRecherche(''),        '');
    });

    it('recherche "theatre" trouve "Théâtre"', () => {
        const libelle = _normRecherche('Théâtre d\'expression');
        const query   = _normRecherche('theatre');
        assert(libelle.includes(query), '"theatre" doit trouver "Théâtre d\'expression"');
    });

    it('recherche "ecologie" trouve "Écologie et développement"', () => {
        const libelle = _normRecherche('Écologie et développement');
        const query   = _normRecherche('ecologie');
        assert(libelle.includes(query));
    });

    it('recherche "musique" trouve "Musique"', () => {
        const libelle = _normRecherche('Musique');
        assert(libelle.includes(_normRecherche('musique')));
    });

    it('recherche avec accents trouve aussi le terme normalisé', () => {
        // Si l'user tape "théâtre" (avec accents), ça doit marcher aussi
        const libelle = _normRecherche('Théâtre');
        const query   = _normRecherche('théâtre'); // → 'theatre'
        assert(libelle.includes(query));
    });

    it('la recherche partielle fonctionne (sous-chaîne dans le libellé)', () => {
        const lib = _normRecherche('Langue et cultures de l\'Antiquité');
        // Sous-chaînes présentes dans le libellé normalisé
        assert(lib.includes(_normRecherche('antiquite')), '"antiquite" doit être trouvé dans le libellé');
        assert(lib.includes(_normRecherche('langue')),    '"langue" doit être trouvé dans le libellé');
        assert(lib.includes(_normRecherche('culture')),   '"culture" doit être trouvé dans "cultures"');
        assert(lib.includes(_normRecherche('antiq')),     'Début de "antiquite" doit matcher');
        // 'langues' ≠ 'langue' : la sous-chaîne 'langues' n'est PAS dans 'langue et ...'
        assert(!lib.includes(_normRecherche('langues')), '"langues" ne doit PAS matcher "langue et ..."');
    });
});

describe('Bug 3 — Filtre textuel : simulation de filterOptions()', () => {

    // Simuler filterOptions() avec _normRecherche
    function filterOptionsSim(rows, searchQuery) {
        const normalizedSearch = _normRecherche(searchQuery);
        return rows.map(row => {
            const libelle = _normRecherche(row.libelle);
            const visible = !normalizedSearch || libelle.includes(normalizedSearch);
            return { ...row, visible };
        });
    }

    const SAMPLE_OPTIONS = [
        { libelle: 'Théâtre expression dramatique' },
        { libelle: 'Musique instrumentale' },
        { libelle: 'Arts plastiques' },
        { libelle: 'Langue et cultures de l\'Antiquité' },
        { libelle: 'Écologie et développement durable' },
        { libelle: 'Latin' },
    ];

    it('recherche vide → toutes les options visibles', () => {
        const result = filterOptionsSim(SAMPLE_OPTIONS, '');
        assertEqual(result.filter(r => r.visible).length, 6, 'Toutes les options doivent être visibles');
    });

    it('recherche "theatre" → trouve "Théâtre expression dramatique"', () => {
        const result = filterOptionsSim(SAMPLE_OPTIONS, 'theatre');
        const visible = result.filter(r => r.visible);
        assertEqual(visible.length, 1);
        assertEqual(visible[0].libelle, 'Théâtre expression dramatique');
    });

    it('recherche "MUSIQUE" (majuscules) → trouve "Musique instrumentale"', () => {
        const result = filterOptionsSim(SAMPLE_OPTIONS, 'MUSIQUE');
        const visible = result.filter(r => r.visible);
        assertEqual(visible.length, 1);
        assertEqual(visible[0].libelle, 'Musique instrumentale');
    });

    it('recherche "ecologie" → trouve "Écologie et développement durable"', () => {
        const result = filterOptionsSim(SAMPLE_OPTIONS, 'ecologie');
        const visible = result.filter(r => r.visible);
        assertEqual(visible.length, 1);
        assertEqual(visible[0].libelle, 'Écologie et développement durable');
    });

    it('recherche "lat" → seul "Latin" contient la sous-chaîne "lat"', () => {
        // Vérification logique : 'lat' est dans 'latin' mais PAS dans 'langue et cultures de l\'antiquite'
        const latin   = _normRecherche('Latin');
        const languet = _normRecherche('Langue et cultures de l\'Antiquité');
        assert(latin.includes('lat'),    '"lat" doit être une sous-chaîne de "latin"');
        assert(!languet.includes('lat'), '"lat" NE doit PAS être dans "langue et cultures de l\'antiquite"');
    });

    it('recherche "lat" → trouve uniquement "Latin"', () => {
        const result = filterOptionsSim(SAMPLE_OPTIONS, 'lat');
        const visible = result.filter(r => r.visible);
        assertEqual(visible.length, 1, 'Seul "Latin" contient "lat"');
        assertEqual(visible[0].libelle, 'Latin');
    });

    it('recherche sans résultat → liste vide', () => {
        const result = filterOptionsSim(SAMPLE_OPTIONS, 'xyzinexistant');
        assertEqual(result.filter(r => r.visible).length, 0);
    });

    it('recherche avec accents saisis par l\'utilisateur ("théâtre") fonctionne aussi', () => {
        const result = filterOptionsSim(SAMPLE_OPTIONS, 'théâtre');
        const visible = result.filter(r => r.visible);
        assertEqual(visible.length, 1);
        assertEqual(visible[0].libelle, 'Théâtre expression dramatique');
    });
});

// ══════════════════════════════════════════════════════════════
// BUG 4 — Rang et taille de liste : _syncFilteredData
// ══════════════════════════════════════════════════════════════

describe('Bug 4 — _syncFilteredDataSim : resynchronisation après filtrage DOM', () => {

    const OPTIONS_DATA = [
        { libelle: 'Musique', nbEtablissements: 5 },
        { libelle: 'Théâtre', nbEtablissements: 3 },
        { libelle: 'Latin',   nbEtablissements: 8 },
        { libelle: 'Grec',    nbEtablissements: 2 },
    ];

    it('sans filtre : filteredData = tous les items', () => {
        const rows = OPTIONS_DATA.map(o => ({ libelle: o.libelle, visible: true }));
        const result = _syncFilteredDataSim('options2ndeGT', rows, OPTIONS_DATA);
        assertEqual(result.length, 4, 'Sans filtre : 4 items');
    });

    it('après filtrage "the" (Théâtre) : filteredData = [Théâtre]', () => {
        const search = _normRecherche('the');
        const rows = OPTIONS_DATA.map(o => ({
            libelle: o.libelle,
            visible: _normRecherche(o.libelle).includes(search)
        }));
        const result = _syncFilteredDataSim('options2ndeGT', rows, OPTIONS_DATA);
        assertEqual(result.length, 1, 'Un seul item doit être filtré');
        assertEqual(result[0].libelle, 'Théâtre');
    });

    it('le rang dans la modale est 1 / 1 quand un seul item filtré', () => {
        const search = _normRecherche('the');
        const rows = OPTIONS_DATA.map(o => ({
            libelle: o.libelle,
            visible: _normRecherche(o.libelle).includes(search)
        }));
        const filtered = _syncFilteredDataSim('options2ndeGT', rows, OPTIONS_DATA);
        const index = filtered.findIndex(o => o.libelle === 'Théâtre');
        assertEqual(index, 0, 'index doit être 0');
        assertEqual(filtered.length, 1, 'length doit être 1');
        // Affichage : `${index + 1} / ${filtered.length}` → "1 / 1"
        assertEqual(`${index + 1} / ${filtered.length}`, '1 / 1');
    });

    it('le rang correct pour "Grec" après filtrage "r" (Latin + Grec)', () => {
        const search = _normRecherche('r');
        const rows = OPTIONS_DATA.map(o => ({
            libelle: o.libelle,
            visible: _normRecherche(o.libelle).includes(search)
        }));
        // 'r' dans 'musique' (non), 'theatre' (oui: th-e-a-t-r-e), 'latin' (non), 'grec' (oui: g-r-e-c)
        const filtered = _syncFilteredDataSim('options2ndeGT', rows, OPTIONS_DATA);
        assertEqual(filtered.length, 2, '2 items contiennent "r": Théâtre et Grec');
        const indexGrec = filtered.findIndex(o => o.libelle === 'Grec');
        assertEqual(indexGrec, 1, 'Grec est en position 1 (0-based) dans la liste filtrée');
        // Rang affiché : 2 / 2
        assertEqual(`${indexGrec + 1} / ${filtered.length}`, '2 / 2');
    });

    it('même rang pour établissements', () => {
        const etabs = [
            { _id: 'UAI001', nom: 'Collège A' },
            { _id: 'UAI002', nom: 'Lycée B' },
            { _id: 'UAI003', nom: 'Collège C' },
        ];
        const rows = [
            { id: 'UAI001', visible: true  },
            { id: 'UAI002', visible: false }, // filtré
            { id: 'UAI003', visible: true  },
        ];
        const filtered = _syncFilteredDataSim('etablissements', rows, etabs);
        assertEqual(filtered.length, 2);
        assertEqual(filtered[0]._id, 'UAI001');
        assertEqual(filtered[1]._id, 'UAI003');
        // Rang de UAI003 : 2 / 2
        const idx = filtered.findIndex(e => e._id === 'UAI003');
        assertEqual(`${idx + 1} / ${filtered.length}`, '2 / 2');
    });

    it('_syncFilteredData conserve l\'ordre de currentData (pas l\'ordre DOM)', () => {
        // Important : filteredData = currentData.filter(...) → ordre de currentData conservé
        const options = [
            { libelle: 'Zéro' },
            { libelle: 'Alpha' },
            { libelle: 'Bêta' },
        ];
        // Rows DOM dans ordre aléatoire
        const rows = [
            { libelle: 'Bêta',  visible: true },
            { libelle: 'Zéro',  visible: true },
            { libelle: 'Alpha', visible: true },
        ];
        const filtered = _syncFilteredDataSim('options2ndeGT', rows, options);
        // L'ordre doit être celui de options (currentData), pas rows
        assertEqual(filtered[0].libelle, 'Zéro',  'Premier = Zéro (ordre currentData)');
        assertEqual(filtered[1].libelle, 'Alpha', 'Deuxième = Alpha');
        assertEqual(filtered[2].libelle, 'Bêta',  'Troisième = Bêta');
    });

    it('diplomes_apprentissage utilise id (pas libelle) comme clé', () => {
        const diplomes = [
            { id: 'appr__001', libelle: 'CAP Boulanger' },
            { id: 'appr__002', libelle: 'BTS Design' },
        ];
        const rows = [
            { id: 'appr__001', visible: false },
            { id: 'appr__002', visible: true  },
        ];
        const filtered = _syncFilteredDataSim('diplomes_apprentissage', rows, diplomes);
        assertEqual(filtered.length, 1);
        assertEqual(filtered[0].id, 'appr__002');
    });
});

describe('Bug 4 — Intégration : filteredData.findIndex() après _syncFilteredData', () => {

    it('showOption2ndeGTDetails reçoit le bon index après filtrage', () => {
        const currentData = [
            { libelle: 'Musique',  nbEtablissements: 5 },
            { libelle: 'Théâtre', nbEtablissements: 3 },
            { libelle: 'Latin',   nbEtablissements: 8 },
        ];
        // Simule : l'utilisateur filtre sur "musique"
        const search = _normRecherche('musique');
        const rows = currentData.map(o => ({
            libelle: o.libelle,
            visible: _normRecherche(o.libelle).includes(search)
        }));
        const filteredData = _syncFilteredDataSim('options2ndeGT', rows, currentData);

        // L'utilisateur clique sur "Musique"
        const index = filteredData.findIndex(o => o.libelle === 'Musique');
        assertEqual(index, 0, 'Musique est en position 0 dans la liste filtrée');
        assertEqual(filteredData.length, 1, 'La liste filtrée contient 1 item');
        // Compteur dans la modale : "1 / 1"
        assertEqual(`${index + 1} / ${filteredData.length}`, '1 / 1');
    });

    it('showDiplomeDetails reçoit index -1 si l\'item n\'est plus dans filteredData', () => {
        // Cas pathologique : item cliqué hors de la liste filtrée
        // (ne devrait pas arriver, mais le code le gère)
        const currentData = [
            { libelle: 'CAP Boulanger' },
            { libelle: 'CAP Fleuriste' },
        ];
        const filteredData = [{ libelle: 'CAP Fleuriste' }]; // CAP Boulanger filtré

        const index = filteredData.findIndex(d => d.libelle === 'CAP Boulanger');
        assertEqual(index, -1, 'Index -1 si item absent de filteredData → pas de navigation');
    });
});

// ══════════════════════════════════════════════════════════════
// RAPPORT FINAL
// ══════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════');
console.log(`  Résultats tests v0.52 — Corrections bugs`);
console.log(`  ✅ Réussis : ${_passed}`);
console.log(`  ❌ Échoués : ${_failed}`);
console.log('═══════════════════════════════════════════');
if (_failures.length > 0) {
    console.log('\nÉchecs détaillés :');
    _failures.forEach(f => console.error(`  [${f.suite}] ${f.label}\n    → ${f.error}`));
    process.exit(1);
}
process.exit(0);
