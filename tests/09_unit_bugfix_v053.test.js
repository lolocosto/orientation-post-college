/**
 * Tests unitaires — Corrections v0.53.1
 * =============================================
 * Bug 1  : Filtres mobile (cartes)
 * Bug 2  : Homogénéité éléments cliquables (style dispositif partout)
 * Bug 3  : Blocs de compétences en section repliable
 * Bug 4  : Parcours de formation bac pro harmonisé
 * Bug 5  : Sauvegarde favori après extraction
 */

// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════

function assert(condition, message) {
    if (!condition) throw new Error(`❌ ÉCHEC: ${message}`);
    console.log(`  ✅ ${message}`);
}

function assertIncludes(haystack, needle, message) {
    if (!haystack.includes(needle)) throw new Error(`❌ ÉCHEC: ${message}\n   Attendu: "${needle}"\n   Dans: "${haystack.substring(0, 200)}..."`);
    console.log(`  ✅ ${message}`);
}

function assertNotIncludes(haystack, needle, message) {
    if (haystack.includes(needle)) throw new Error(`❌ ÉCHEC: ${message}\n   Non attendu: "${needle}"\n   Trouvé dans: "${haystack.substring(0, 200)}..."`);
    console.log(`  ✅ ${message}`);
}

let passed = 0, failed = 0, errors = [];

function runTest(name, fn) {
    try {
        fn();
        passed++;
    } catch (e) {
        failed++;
        errors.push({ name, error: e.message });
        console.error(`\n❌ ${name}\n   ${e.message}\n`);
    }
}

// ══════════════════════════════════════════════════════════════════
// T-FM : FILTRES MOBILE (Bug 1)
// ══════════════════════════════════════════════════════════════════

console.log('\n═══ T-FM : FILTRES MOBILE ═══');

runTest('T-FM01 — filterEtablissements filtre les cartes en parallèle des <tr>', () => {
    const src = filterEtablissements.toString();
    assertIncludes(src, '.result-card[data-id]', 'filterEtablissements sélectionne les cartes par data-id');
    assertIncludes(src, 'visibleIds', 'filterEtablissements utilise un Set visibleIds');
});

runTest('T-FM02 — filterDiplomes filtre les cartes en parallèle des <tr>', () => {
    const src = filterDiplomes.toString();
    assertIncludes(src, '.result-card[data-libelle]', 'filterDiplomes sélectionne les cartes par data-libelle');
    assertIncludes(src, 'visibleLibelles', 'filterDiplomes utilise un Set visibleLibelles');
});

runTest('T-FM03 — filterDiplomesApprentissage filtre les cartes', () => {
    const src = filterDiplomesApprentissage.toString();
    assertIncludes(src, '.result-card[data-id]', 'filterDiplomesApprentissage sélectionne les cartes');
    assertIncludes(src, 'visibleIds', 'utilise un Set visibleIds');
});

runTest('T-FM04 — filterDispositifs filtre les cartes', () => {
    const src = filterDispositifs.toString();
    assertIncludes(src, '.result-card[data-libelle]', 'filterDispositifs sélectionne les cartes');
    assertIncludes(src, 'visibleLibelles', 'utilise un Set visibleLibelles');
});

runTest('T-FM05 — filterOptions filtre les cartes', () => {
    const src = filterOptions.toString();
    assertIncludes(src, '.result-card[data-libelle]', 'filterOptions sélectionne les cartes');
});

runTest('T-FM06 — filterSpecialites filtre les cartes', () => {
    const src = filterSpecialites.toString();
    assertIncludes(src, '.result-card[data-libelle]', 'filterSpecialites sélectionne les cartes');
});

runTest('T-FM07 — Cartes établissements portent data-type/commune/statut', () => {
    const src = renderetablissementsTable.toString();
    assertIncludes(src, 'data-type=', 'carte a data-type');
    assertIncludes(src, 'data-commune=', 'carte a data-commune');
    assertIncludes(src, 'data-statut=', 'carte a data-statut');
});

runTest('T-FM08 — Cartes diplômes scolaires portent data-niveau/type/categorie', () => {
    const src = renderDiplomesTable.toString();
    assertIncludes(src, 'data-niveau=', 'carte diplôme a data-niveau');
    assertIncludes(src, 'data-type=', 'carte diplôme a data-type');
    assertIncludes(src, 'data-categorie=', 'carte diplôme a data-categorie');
});

runTest('T-FM09 — Cartes diplômes apprentissage portent data-niveau/type', () => {
    const src = renderDiplomesApprentissageTable.toString();
    assertIncludes(src, 'data-niveau=', 'carte apprentissage a data-niveau');
    assertIncludes(src, 'data-type=', 'carte apprentissage a data-type');
});

// ══════════════════════════════════════════════════════════════════
// T-HI : HOMOGÉNÉITÉ ITEMS CLIQUABLES (Bug 2)
// ══════════════════════════════════════════════════════════════════

console.log('\n═══ T-HI : HOMOGÉNÉITÉ ITEMS CLIQUABLES ═══');

runTest('T-HI01 — buildEtablissementDetailsHTML n\'utilise pas <a href="#">', () => {
    const src = buildEtablissementDetailsHTML.toString();
    assertNotIncludes(src, '<a href="#"', 'Pas de <a href="#"> dans détail établissement');
});

runTest('T-HI02 — buildDiplomeDetailsHTML n\'utilise pas <a href="#">', () => {
    const src = buildDiplomeDetailsHTML.toString();
    assertNotIncludes(src, '<a href="#"', 'Pas de <a href="#"> dans détail diplôme scolaire');
});

runTest('T-HI03 — buildDiplomeApprentissageDetailsHTML n\'utilise pas <a href="#">', () => {
    const src = buildDiplomeApprentissageDetailsHTML.toString();
    assertNotIncludes(src, '<a href="#"', 'Pas de <a href="#"> dans détail diplôme apprentissage');
});

runTest('T-HI04 — Diplômes scolaires dans détail étab utilisent detail-item--link + onclick', () => {
    const src = buildEtablissementDetailsHTML.toString();
    assertIncludes(src, 'detail-item--link', 'Utilise detail-item--link');
    assertIncludes(src, 'showDiplomeDetails', 'Appelle showDiplomeDetails');
});

runTest('T-HI05 — Options 2nde GT dans détail étab utilisent detail-item--link + onclick', () => {
    const src = buildEtablissementDetailsHTML.toString();
    assertIncludes(src, 'showOption2ndeGTDetails', 'Appelle showOption2ndeGTDetails');
});

runTest('T-HI06 — Établissements dans détail diplôme scolaire utilisent detail-item--link', () => {
    const src = buildDiplomeDetailsHTML.toString();
    assertIncludes(src, 'detail-item--link', 'Utilise detail-item--link');
    assertIncludes(src, 'openEtablissementDetailsFromModal', 'Appelle openEtablissementDetailsFromModal');
});

runTest('T-HI07 — Établissements dans détail diplôme apprentissage utilisent detail-item--link', () => {
    const src = buildDiplomeApprentissageDetailsHTML.toString();
    assertIncludes(src, 'detail-item--link', 'Utilise detail-item--link');
    assertIncludes(src, 'openEtablissementDetailsFromModal', 'Appelle openEtablissementDetailsFromModal');
});

// ══════════════════════════════════════════════════════════════════
// T-BC : BLOCS DE COMPÉTENCES (Amélioration 3)
// ══════════════════════════════════════════════════════════════════

console.log('\n═══ T-BC : BLOCS DE COMPÉTENCES ═══');

runTest('T-BC01 — Blocs de compétences en section accordéon avec items non-cliquables', () => {
    const src = buildDiplomeApprentissageDetailsHTML.toString();
    assertIncludes(src, 'Blocs de comp', 'Section Blocs de compétences présente');
    assertIncludes(src, 'detail-item--info', 'Utilise detail-item--info (non cliquable)');
});

runTest('T-BC02 — Contenu brut masqué quand blocsCompetences est rempli', () => {
    const src = buildDiplomeApprentissageDetailsHTML.toString();
    assertIncludes(src, 'blocs.length === 0', 'Vérifie si blocsCompetences est vide avant afficher contenu');
});

runTest('T-BC03 — Compétences séparées par · dans une note', () => {
    const src = buildDiplomeApprentissageDetailsHTML.toString();
    assertIncludes(src, "join(' \\u00b7 ')", 'Compétences séparées par ·');
});

// ══════════════════════════════════════════════════════════════════
// T-PF : PARCOURS DE FORMATION (Amélioration 4)
// ══════════════════════════════════════════════════════════════════

console.log('\n═══ T-PF : PARCOURS DE FORMATION ═══');

runTest('T-PF01 — Section renommée "Parcours de formation"', () => {
    const src = buildDiplomeDetailsHTML.toString();
    assertIncludes(src, 'Parcours de formation', 'Nom de section = Parcours de formation');
});

runTest('T-PF02 — Parcours utilise des items non cliquables (detail-item--info)', () => {
    const src = generateParcoursProHtml.toString();
    assertIncludes(src, 'detail-item--info', 'Items non cliquables');
    assertNotIncludes(src, 'detail-item--link', 'Pas de items cliquables');
});

runTest('T-PF03 — Parcours hors famille affiche les 4 items', () => {
    const parcours = { famille: 'HORS FAMILLE', seconde: '2nde Bac Pro X', premiere: '1ère Bac Pro X', terminale: 'Term Bac Pro X' };
    const html = generateParcoursProHtml(parcours);
    assertIncludes(html, 'Hors famille', 'Item 1: Hors famille de métiers');
    assertIncludes(html, '2nde Bac Pro X', 'Item 2: nom de la 2nde');
    assertIncludes(html, '1ère Bac Pro X', 'Item 3: nom de la 1ère');
    assertIncludes(html, 'Term Bac Pro X', 'Item 4: nom de la terminale');
});

runTest('T-PF04 — Parcours avec famille affiche nom + 3 items', () => {
    const parcours = { famille: 'Métiers du numérique', seconde: '2nde commune MN', premiere: '1ère Bac Pro', terminale: 'Term Bac Pro' };
    const html = generateParcoursProHtml(parcours);
    assertIncludes(html, 'Famille de métiers', 'Item 1: Famille de métiers');
    assertIncludes(html, 'Métiers du numérique', 'Nom de la famille');
    assertIncludes(html, '2nde commune MN', 'Item 2: 2nde');
});

runTest('T-PF05 — Parcours agricole affiche 🌾', () => {
    const parcours = { famille: 'Agricole - Productions', seconde: '2nde pro PA', premiere: '1ère', terminale: 'Term' };
    const html = generateParcoursProHtml(parcours);
    assertIncludes(html, '🌾', 'Badge agricole');
});

runTest('T-PF06 — Parcours null retourne un message informatif', () => {
    const html = generateParcoursProHtml(null);
    assertIncludes(html, 'Aucun parcours', 'Message informatif');
    assertNotIncludes(html, 'bloc-information-specifique', 'Plus d\'ancien style');
});

runTest('T-PF07 — Parcours n\'utilise plus de styles inline', () => {
    const parcours = { famille: 'Test', seconde: '2nde', premiere: '1ère', terminale: 'Term' };
    const html = generateParcoursProHtml(parcours);
    assertNotIncludes(html, 'style="', 'Aucun style inline');
});

// ══════════════════════════════════════════════════════════════════
// T-FAV : SAUVEGARDE FAVORIS (Bug 5)
// ══════════════════════════════════════════════════════════════════

console.log('\n═══ T-FAV : SAUVEGARDE FAVORIS ═══');

runTest('T-FAV01 — lancerExtractionGeo appelle _trySaveFavorite', () => {
    const src = lancerExtractionGeo.toString();
    assertIncludes(src, '_trySaveFavorite', 'lancerExtractionGeo appelle _trySaveFavorite');
    assertIncludes(src, "'geo'", 'Passe le type geo');
});

runTest('T-FAV02 — lancerExtractionItems appelle _trySaveFavorite', () => {
    const src = lancerExtractionItems.toString();
    assertIncludes(src, '_trySaveFavorite', 'lancerExtractionItems appelle _trySaveFavorite');
    assertIncludes(src, "'diplomes'", 'Passe le type diplomes');
});

runTest('T-FAV03 — ajouterFavori est disponible', () => {
    assert(typeof ajouterFavori === 'function', 'ajouterFavori est définie');
});

runTest('T-FAV04 — loadFavoris retourne un tableau', () => {
    const result = loadFavoris();
    assert(Array.isArray(result), 'loadFavoris retourne un tableau');
});

// ══════════════════════════════════════════════════════════════════
// RÉSUMÉ
// ══════════════════════════════════════════════════════════════════

console.log('\n══════════════════════════════════════════');
console.log(`📊 Résultats: ${passed} passés, ${failed} échoués sur ${passed + failed} tests`);
if (errors.length > 0) {
    console.log('\n❌ Tests en échec:');
    errors.forEach(e => console.log(`   - ${e.name}: ${e.error}`));
}
console.log('══════════════════════════════════════════\n');
