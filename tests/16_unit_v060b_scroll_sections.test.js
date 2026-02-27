/**
 * Tests v0.60b — Ascenseur générique pour sections longues
 *
 * Vérifie que accordionSection ajoute la classe detail-section--scrollable
 * uniquement quand le nombre d'items dépasse SCROLL_THRESHOLD (10).
 */

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
        toBeTruthy() { if (!val) throw new Error(`Expected truthy, got ${JSON.stringify(val)}`); },
        toBeFalsy()  { if (val)  throw new Error(`Expected falsy, got ${JSON.stringify(val)}`); },
        toContain(item) {
            if (typeof val === 'string') { if (!val.includes(item)) throw new Error(`"${val.substring(0,200)}…" does not contain "${item}"`); }
            else throw new Error(`Cannot check contain on ${typeof val}`);
        },
        not: {
            toContain(item) {
                if (typeof val === 'string' && val.includes(item)) throw new Error(`String should not contain "${item}"`);
            }
        }
    };
}

// ══════════════════════════════════════════════════════════
// MOCK — accordionSection (reproduction fidèle du code réel)
// ══════════════════════════════════════════════════════════

function accordionSection(icon, titre, count, bodyHtml, collapsed = false) {
    const SCROLL_THRESHOLD = 10;
    const cls      = collapsed ? ' detail-section--collapsed' : '';
    const countStr = count !== '' ? ` (${count})` : '';
    const numCount = typeof count === 'number' ? count : parseInt(count, 10);
    const scrollCls = (!isNaN(numCount) && numCount > SCROLL_THRESHOLD)
        ? ' detail-section--scrollable' : '';
    return `
<div class="detail-section${cls}${scrollCls}">
    <h3 class="detail-section-title detail-section-title--accordion"
        onclick="toggleDetailSection(this.parentElement)">
        ${icon} ${titre}${countStr}
    </h3>
    <div class="detail-section__body">${bodyHtml}</div>
</div>`;
}

// ══════════════════════════════════════════════════════════
// TESTS — Seuil d'activation du scroll
// ══════════════════════════════════════════════════════════

describe('accordionSection — seuil de scroll (SCROLL_THRESHOLD = 10)', () => {

    it('count = 5 → pas de classe scrollable', () => {
        const html = accordionSection('📚', 'Options 2nde GT', 5, '<ul></ul>', true);
        expect(html).not.toContain('detail-section--scrollable');
    });

    it('count = 10 → pas de classe scrollable (seuil strict >)', () => {
        const html = accordionSection('📚', 'Options 2nde GT', 10, '<ul></ul>', true);
        expect(html).not.toContain('detail-section--scrollable');
    });

    it('count = 11 → classe scrollable ajoutée', () => {
        const html = accordionSection('📚', 'Options 2nde GT', 11, '<ul></ul>', true);
        expect(html).toContain('detail-section--scrollable');
    });

    it('count = 263 (formations 5+) → scrollable', () => {
        const html = accordionSection('🎓', 'Autres formations', 263, '<ul></ul>', true);
        expect(html).toContain('detail-section--scrollable');
    });

    it('count = 0 → pas scrollable', () => {
        const html = accordionSection('🎯', 'Dispositifs', 0, '<ul></ul>', true);
        expect(html).not.toContain('detail-section--scrollable');
    });

    it('count = 1 → pas scrollable', () => {
        const html = accordionSection('🏫', 'Diplômes', 1, '<ul></ul>', true);
        expect(html).not.toContain('detail-section--scrollable');
    });
});

describe('accordionSection — count non-numérique', () => {

    it('count = "" (Informations générales) → pas scrollable', () => {
        const html = accordionSection('📍', 'Informations générales', '', '<p>Info</p>', true);
        expect(html).not.toContain('detail-section--scrollable');
        // Pas de "()" dans le titre
        expect(html).not.toContain('()');
    });

    it('count = string "25" → scrollable (parseInt)', () => {
        const html = accordionSection('📚', 'Options', '25', '<ul></ul>', true);
        expect(html).toContain('detail-section--scrollable');
    });

    it('count = string "3" → pas scrollable', () => {
        const html = accordionSection('📚', 'Options', '3', '<ul></ul>', true);
        expect(html).not.toContain('detail-section--scrollable');
    });

    it('count = string "abc" → pas scrollable (parseInt = NaN)', () => {
        const html = accordionSection('ℹ️', 'Info', 'abc', '<p></p>', true);
        expect(html).not.toContain('detail-section--scrollable');
    });
});

describe('accordionSection — classes combinées', () => {

    it('scrollable + collapsed → les deux classes présentes', () => {
        const html = accordionSection('🎓', 'Formations', 50, '<ul></ul>', true);
        expect(html).toContain('detail-section--collapsed');
        expect(html).toContain('detail-section--scrollable');
    });

    it('scrollable + non-collapsed → scrollable sans collapsed', () => {
        const html = accordionSection('🎓', 'Formations', 50, '<ul></ul>', false);
        expect(html).toContain('detail-section--scrollable');
        expect(html).not.toContain('detail-section--collapsed');
    });

    it('non-scrollable + collapsed → collapsed sans scrollable', () => {
        const html = accordionSection('🎯', 'Dispositifs', 3, '<ul></ul>', true);
        expect(html).toContain('detail-section--collapsed');
        expect(html).not.toContain('detail-section--scrollable');
    });

    it('HTML structure correcte avec toutes les classes', () => {
        const html = accordionSection('🎓', 'Test', 20, '<p>contenu</p>', true);
        // Vérifie l'ordre des classes
        expect(html).toContain('class="detail-section detail-section--collapsed detail-section--scrollable"');
    });
});

describe('_checkScrollEnd — logique de détection fin de scroll', () => {

    // Simule la logique sans DOM
    function checkScrollEnd(scrollHeight, scrollTop, clientHeight) {
        const atBottom = scrollHeight - scrollTop - clientHeight < 8;
        const noOverflow = scrollHeight <= clientHeight + 2;
        return atBottom || noOverflow;
    }

    it('Contenu dépasse → pas en bas → false', () => {
        expect(checkScrollEnd(1000, 0, 500)).toBe(false);
    });

    it('Contenu dépasse → scrollé au milieu → false', () => {
        expect(checkScrollEnd(1000, 250, 500)).toBe(false);
    });

    it('Contenu dépasse → scrollé en bas → true', () => {
        expect(checkScrollEnd(1000, 500, 500)).toBe(true);
    });

    it('Contenu dépasse → presque en bas (< 8px) → true', () => {
        expect(checkScrollEnd(1000, 495, 500)).toBe(true);
    });

    it('Contenu dépasse → pas tout à fait en bas (> 8px) → false', () => {
        expect(checkScrollEnd(1000, 490, 500)).toBe(false);
    });

    it('Contenu ne dépasse pas (scrollHeight ≤ clientHeight) → true', () => {
        expect(checkScrollEnd(400, 0, 500)).toBe(true);
    });

    it('Contenu exactement à la hauteur (+2px tolérance) → true', () => {
        expect(checkScrollEnd(502, 0, 500)).toBe(true);
    });
});

describe('Scénarios réalistes — sections de fiches établissement', () => {

    it('Lycée avec 29 CPGE → section "Autres formations" scrollable', () => {
        const html = accordionSection('🎓', 'Autres formations et diplômes', 29, '<ul>...</ul>', true);
        expect(html).toContain('detail-section--scrollable');
        expect(html).toContain('(29)');
    });

    it('Lycée avec 9 options 2nde GT → section options non scrollable', () => {
        const html = accordionSection('📚', 'Options 2nde GT', 9, '<ul>...</ul>', true);
        expect(html).not.toContain('detail-section--scrollable');
    });

    it('Lycée avec 21 spécialités 1ère G → section scrollable', () => {
        const html = accordionSection('🔬', 'Spécialités 1ère Générale', 21, '<ul>...</ul>', true);
        expect(html).toContain('detail-section--scrollable');
    });

    it('CFA avec 45 diplômes apprentissage → section scrollable', () => {
        const html = accordionSection('🎓', 'Diplômes — voie apprentissage', 45, '<ul>...</ul>', true);
        expect(html).toContain('detail-section--scrollable');
    });

    it('Petit lycée avec 2 diplômes → pas scrollable', () => {
        const html = accordionSection('🏫', 'Diplômes — voie scolaire', 2, '<ul>...</ul>', true);
        expect(html).not.toContain('detail-section--scrollable');
    });
});

// ══════════════════════════════════════════════════════════
// RAPPORT
// ══════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(60));
console.log(`📊 RÉSULTATS : ${results.passed}/${results.total} tests passés`);
if (results.failed > 0) {
    console.log(`❌ ${results.failed} échec(s) :`);
    for (const err of results.errors) {
        console.log(`   • ${err.test}\n     → ${err.error}`);
    }
} else {
    console.log('✅ Tous les tests sont passés !');
}
console.log('═'.repeat(60));
