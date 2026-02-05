// SCRIPT DE DIAGNOSTIC COMPLET - À coller dans la console (F12)

console.log("🔍 DIAGNOSTIC COMPLET - Diplômes manquants");
console.log("============================================\n");

// 1. Compter dans chaque table
const countDiplomes = db.exec('SELECT COUNT(*) FROM diplomes')[0].values[0][0];
const countRelations = db.exec('SELECT COUNT(*) FROM diplomes_par_lycee')[0].values[0][0];
const countDistinctCodes = db.exec('SELECT COUNT(DISTINCT diplome_id_onisep) FROM diplomes_par_lycee')[0].values[0][0];

console.log(`📊 Statistiques:`);
console.log(`  - Diplômes dans table 'diplomes': ${countDiplomes}`);
console.log(`  - Relations dans 'diplomes_par_lycee': ${countRelations}`);
console.log(`  - Codes distincts dans 'diplomes_par_lycee': ${countDistinctCodes}`);

// 2. Vérifier les codes NULL
const countNull = db.exec('SELECT COUNT(*) FROM diplomes WHERE id_onisep IS NULL')[0].values[0][0];
console.log(`\n⚠️ Diplômes avec id_onisep NULL: ${countNull}`);

// 3. Trouver les codes orphelins (dans diplomes_par_lycee mais pas dans diplomes)
const orphelins = db.exec(`
    SELECT DISTINCT dpl.diplome_id_onisep, dpl.diplome_intitule
    FROM diplomes_par_lycee dpl
    LEFT JOIN diplomes d ON dpl.diplome_id_onisep = d.id_onisep
    WHERE d.id_onisep IS NULL
    ORDER BY dpl.diplome_intitule
`);

console.log(`\n🔴 Diplômes ORPHELINS (dans relations mais PAS dans table diplomes): ${orphelins[0]?.values.length || 0}`);
if (orphelins[0]?.values && orphelins[0].values.length > 0) {
    console.log("\n📋 Liste des orphelins:");
    orphelins[0].values.forEach(([code, intitule]) => {
        console.log(`  - Code: "${code}" | Intitulé: "${intitule}"`);
    });
}

// 4. Vérifier les doublons dans diplomes
const doublons = db.exec(`
    SELECT id_onisep, COUNT(*) as count
    FROM diplomes
    GROUP BY id_onisep
    HAVING count > 1
`);

console.log(`\n🔄 Doublons dans table diplomes: ${doublons[0]?.values.length || 0}`);
if (doublons[0]?.values) {
    doublons[0].values.forEach(([code, count]) => {
        console.log(`  - Code "${code}": ${count} fois`);
    });
}

// 5. Afficher tous les codes dans diplomes_par_lycee
console.log(`\n📝 TOUS les codes distincts dans diplomes_par_lycee:`);
const tousCodesDPL = db.exec(`
    SELECT DISTINCT diplome_id_onisep, diplome_intitule
    FROM diplomes_par_lycee
    ORDER BY diplome_intitule
`);

if (tousCodesDPL[0]?.values) {
    tousCodesDPL[0].values.forEach(([code, intitule], index) => {
        const dansTable = db.exec(`SELECT 1 FROM diplomes WHERE id_onisep = ?`, [code]);
        const marqueur = dansTable[0]?.values.length > 0 ? '✅' : '❌';
        console.log(`  ${index + 1}. ${marqueur} "${code}" → "${intitule}"`);
    });
}

// 6. Afficher tous les diplômes dans table diplomes
console.log(`\n📚 TOUS les diplômes dans table 'diplomes':`);
const tousDiplomes = db.exec(`SELECT id_onisep, intitule FROM diplomes ORDER BY intitule`);
if (tousDiplomes[0]?.values) {
    tousDiplomes[0].values.forEach(([code, intitule], index) => {
        console.log(`  ${index + 1}. "${code}" → "${intitule}"`);
    });
}

console.log("\n============================================");
console.log("✅ Diagnostic terminé");
console.log("\n💡 ANALYSE:");
console.log("   Si orphelins > 0 → Problème dans updateDatabase()");
console.log("   Si codes NULL → Problème dans _extractFromAction()");
console.log("   Si doublons > 0 → Problème avec clé primaire");
