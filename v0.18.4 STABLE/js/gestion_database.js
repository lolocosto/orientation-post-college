/************************************************
 * Fichier : gestion_database.js
 * Description : Gestion de la base de données SQLite
 * Auteur : Laurent COSTE
 * Date : 2026-02-01
 ************************************************/

/** Mise à jour de la base de données */
async function updateDatabase(data) {
    try {
        // S'assurer qu'il n'y a pas de transaction en cours
        try {
            db.run('COMMIT');
        } catch(e) {
            // Pas de transaction en cours, c'est OK
        }
        
        db.run('BEGIN');
        db.run('DELETE FROM lycees');
        db.run('DELETE FROM diplomes');
        db.run('DELETE FROM langues_par_lycee');
        db.run('DELETE FROM diplomes_par_lycee');
        db.run('DELETE FROM dispositifs');
        db.run('DELETE FROM dispositifs_par_lycee');
        
        console.log('📊 Insertion des données dans la base...');
        console.log(`- ${data.lycees.length} établissements`);
        console.log(`- ${data.diplomes.length} diplômes`);
        
        // Insérer établissements avec UAI comme clé primaire (ignorer les doublons)
        for (const l of data.lycees) {
            try {
                db.run(`INSERT OR IGNORE INTO lycees VALUES (?,?,?,?,?,?,?,?,?,?)`,
                    [
                        l.code_uai || null,
                        l.nom || null,
                        l.type_detablissement || null,
                        l.statut || null,
                        l.adresse || null,
                        l.cp || null,
                        l.commune || null,
                        l.telephone || null,
                        l.longitude_x || null,
                        l.latitude_y || null
                    ]);
            } catch (e) {
                console.error('Erreur insertion établissement:', l, e);
            }
        }
        
        // Insérer diplômes avec intitulé comme clé primaire (ignorer les doublons)
        for (const d of data.diplomes) {
            try {
                db.run(`INSERT OR IGNORE INTO diplomes VALUES (?,?)`, 
                    [
                        d.intitule || null,
                        d.niveau || null
                    ]);
            } catch (e) {
                console.error('Erreur insertion diplôme:', d, e);
            }
        }
    
    
    // Insérer relations diplomes_par_lycee (ignorer les doublons)
    if (data.diplomes_par_lycee) {
        for (const rel of data.diplomes_par_lycee) {
            try {
                db.run(`INSERT OR IGNORE INTO diplomes_par_lycee (lycee_uai, diplome_intitule) VALUES (?,?)`,
                    [
                        rel.lycee_uai || null,
                        rel.diplome_intitule || null
                    ]);
            } catch (e) {
                console.error('Erreur insertion relation diplôme-établissement:', rel, e);
            }
        }
    }
    
    // Insérer dispositifs
    if (data.dispositifs) {
        for (const dispositif of data.dispositifs) {
            try {
                db.run(`INSERT OR IGNORE INTO dispositifs (nom, type) VALUES (?,?)`,
                    [dispositif.nom || null, dispositif.type || null]);
            } catch (e) {
                console.error('Erreur insertion dispositif:', dispositif, e);
            }
        }
    }
    
    // Insérer relations dispositifs_par_lycee
    if (data.dispositifs_par_lycee) {
        for (const rel of data.dispositifs_par_lycee) {
            try {
                db.run(`INSERT OR IGNORE INTO dispositifs_par_lycee (lycee_uai, dispositif_nom, dispositif_type) VALUES (?,?,?)`,
                    [rel.lycee_uai || null, rel.dispositif_nom || null, rel.dispositif_type || null]);
            } catch (e) {
                console.error('Erreur insertion relation dispositif-établissement:', rel, e);
            }
        }
    }

            db.run('COMMIT');
        
        console.log('✅ Toutes les données insérées');
        
        const dbData = db.export();
        const buffer = new Uint8Array(dbData);
        localStorage.setItem('lycees_database', btoa(String.fromCharCode(...buffer)));
    } catch (error) {
        // En cas d'erreur, rollback
        try {
            db.run('ROLLBACK');
        } catch(e) {
            // Ignore si ROLLBACK échoue
        }
        throw error;
    }
}

/** Exporte la base de données SQLite vers un fichier local */
function exportDatabase() {
    const data = db.export();
    const blob = new Blob([data], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lycees_rennes_v0.7_${new Date().toISOString().split('T')[0]}.db`;
    a.click();
    URL.revokeObjectURL(url);
    showAlert('✅ Base de données téléchargée', 'success');
}

/** Réinitialise la base de données */
function resetDatabase() {
    console.log('🗑️ Suppression de la base de données...');
    localStorage.removeItem('lycees_database');
    localStorage.removeItem('last_extraction_date');
    
    // Recréer une nouvelle base vide
    db = new SQL.Database();
    createTables();
    
    loadStats();
    loadView();
    updateLastExtractionDate();
    
    showAlert('✅ Base de données vidée. Vous pouvez maintenant extraire depuis Onisep ou importer un fichier.', 'success');
}

function confirmResetDatabase() {
    document.getElementById('reset-confirm-modal').classList.add('active');
}

function closeResetConfirmModal() {
    document.getElementById('reset-confirm-modal').classList.remove('active');
}

function executeResetDatabase() {
    closeResetConfirmModal();
    resetDatabase();
}

async function exportDatabaseWithDialog() {
    try {
        const data = db.export();
        const blob = new Blob([data], { type: 'application/x-sqlite3' });
        const filename = `lycees_rennes_${new Date().toISOString().slice(0,10)}.db`;
        
        // Vérifier si l'API File System Access est disponible (Chrome, Edge)
        if ('showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'Base de données SQLite',
                        accept: { 'application/x-sqlite3': ['.db'] }
                    }]
                });
                
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                
                showAlert('✅ Base de données exportée avec succès', 'success');
            } catch (err) {
                if (err.name !== 'AbortError') {
                    throw err;
                }
                // L'utilisateur a annulé
            }
        } else {
            // Fallback : téléchargement classique
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            showAlert('✅ Base de données exportée (téléchargements)', 'success');
        }
    } catch (error) {
        showAlert('❌ Erreur export : ' + error.message, 'error');
    }
}

function exportDatabase() {
    // Alias pour compatibilité avec l'ancien code
    exportDatabaseWithDialog();
}

function importDatabase() {
    document.getElementById('import-file-input').click();
}

async function handleImport(input) {
    const file = input.files[0];
    if (!file) return;
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Charger la nouvelle base
        db = new SQL.Database(uint8Array);
        
        // Sauvegarder dans localStorage
        const buffer = new Uint8Array(db.export());
        localStorage.setItem('lycees_database', btoa(String.fromCharCode(...buffer)));
        
        // Recharger l'interface
        loadStats();
        loadView();
        
        showAlert('✅ Base de données importée avec succès', 'success');
    } catch (error) {
        showAlert('❌ Erreur import : ' + error.message, 'error');
    }
}

async function initDatabase() {
    const saved = localStorage.getItem('lycees_database');
    if (saved) {
        const buffer = Uint8Array.from(atob(saved), c => c.charCodeAt(0));
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }
    // Toujours créer les tables (IF NOT EXISTS gère les doublons)
    createTables();
}

function createTables() {
    db.run(`CREATE TABLE IF NOT EXISTS lycees (
        uai TEXT PRIMARY KEY,
        nom TEXT, type TEXT, statut TEXT,
        adresse TEXT, code_postal TEXT, commune TEXT,
        telephone TEXT, longitude_x REAL, latitude_y REAL
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS diplomes (
        intitule TEXT PRIMARY KEY,
        niveau TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS langues_par_lycee (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lycee_uai TEXT,
        langue TEXT,
        niveau TEXT,
        FOREIGN KEY (lycee_uai) REFERENCES lycees(uai)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS diplomes_par_lycee (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lycee_uai TEXT,
        diplome_intitule TEXT,
        FOREIGN KEY (lycee_uai) REFERENCES lycees(uai),
        FOREIGN KEY (diplome_intitule) REFERENCES diplomes(intitule)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS dispositifs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT UNIQUE,
        type TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS dispositifs_par_lycee (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lycee_uai TEXT,
        dispositif_nom TEXT,
        dispositif_type TEXT,
        FOREIGN KEY (lycee_uai) REFERENCES lycees(uai)
    )`);
    
    // Tables pour les enseignements GT et parcours Bac Pro (V0.18.4)
    db.run(`CREATE TABLE IF NOT EXISTS options_2nde_gt (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uai TEXT NOT NULL,
        option_libelle TEXT NOT NULL,
        UNIQUE(uai, option_libelle)
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS specialites_1ere_g (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uai TEXT NOT NULL,
        specialite_libelle TEXT NOT NULL,
        UNIQUE(uai, specialite_libelle)
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS parcours_bac_pro (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        famille TEXT NOT NULL,
        seconde TEXT NOT NULL,
        premiere TEXT,
        terminale TEXT,
        diplome TEXT,
        id_af_onisep TEXT,
        UNIQUE(diplome)
    )`);
}
