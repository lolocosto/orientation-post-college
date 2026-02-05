#!/usr/bin/env python3
"""
Nettoyage complet de la base de données v6
1. Supprimer formations BTS, CAP, Bac (+ répercuter dans formations_par_lycee)
2. Supprimer diplomes CPGE (+ répercuter dans diplomes_par_lycee)
3. Ajouter champ "options" dans diplomes_par_lycee
"""

import sqlite3

DB_PATH = './lycees_database.db'

def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("="*70)
    print("NETTOYAGE COMPLET DE LA BASE v6")
    print("="*70)
    print()
    
    # === 1. SUPPRIMER FORMATIONS BTS, CAP, BAC ===
    print("1. Suppression des formations BTS, CAP, Bac pro...")
    
    cursor.execute('''
        SELECT code, intitule FROM formations
        WHERE intitule LIKE '%BTS%'
           OR intitule LIKE '%CAP%'
           OR intitule LIKE '%Bac pro%'
        ORDER BY intitule
    ''')
    formations_a_supprimer = cursor.fetchall()
    
    print(f"   ✓ {len(formations_a_supprimer)} formations à supprimer")
    for code, intitule in formations_a_supprimer[:5]:
        print(f"     • {intitule}")
    if len(formations_a_supprimer) > 5:
        print(f"     ... et {len(formations_a_supprimer) - 5} autres")
    
    # Supprimer les liens
    codes_formations = [code for code, _ in formations_a_supprimer]
    if codes_formations:
        placeholders = ','.join('?' * len(codes_formations))
        cursor.execute(f'''
            DELETE FROM formations_par_lycee
            WHERE code_formation IN ({placeholders})
        ''', codes_formations)
        print(f"   ✓ {cursor.rowcount} liens formations_par_lycee supprimés")
        
        # Supprimer les formations
        cursor.execute(f'''
            DELETE FROM formations
            WHERE code IN ({placeholders})
        ''', codes_formations)
        print(f"   ✓ {cursor.rowcount} formations supprimées")
    
    # === 2. SUPPRIMER DIPLOMES CPGE ===
    print()
    print("2. Suppression des diplômes CPGE...")
    
    cursor.execute('''
        SELECT code, intitule FROM diplomes
        WHERE intitule LIKE '%CPGE%'
        ORDER BY intitule
    ''')
    diplomes_cpge = cursor.fetchall()
    
    print(f"   ✓ {len(diplomes_cpge)} diplômes CPGE à supprimer")
    for code, intitule in diplomes_cpge[:5]:
        print(f"     • {intitule}")
    if len(diplomes_cpge) > 5:
        print(f"     ... et {len(diplomes_cpge) - 5} autres")
    
    # Supprimer les liens
    codes_diplomes = [code for code, _ in diplomes_cpge]
    if codes_diplomes:
        placeholders = ','.join('?' * len(codes_diplomes))
        cursor.execute(f'''
            DELETE FROM diplomes_par_lycee
            WHERE code_diplome IN ({placeholders})
        ''', codes_diplomes)
        print(f"   ✓ {cursor.rowcount} liens diplomes_par_lycee supprimés")
        
        # Supprimer les diplômes
        cursor.execute(f'''
            DELETE FROM diplomes
            WHERE code IN ({placeholders})
        ''', codes_diplomes)
        print(f"   ✓ {cursor.rowcount} diplômes supprimés")
    
    # === 3. AJOUTER CHAMP OPTIONS ===
    print()
    print("3. Ajout du champ 'options' dans diplomes_par_lycee...")
    
    # Vérifier si la colonne existe déjà
    cursor.execute('PRAGMA table_info(diplomes_par_lycee)')
    colonnes = [col[1] for col in cursor.fetchall()]
    
    if 'options' not in colonnes:
        # Recréer la table avec le champ options
        cursor.execute('''
            CREATE TABLE diplomes_par_lycee_new (
                code INTEGER PRIMARY KEY,
                code_diplome INTEGER NOT NULL,
                code_lycee INTEGER NOT NULL,
                options TEXT,
                FOREIGN KEY (code_diplome) REFERENCES diplomes(code),
                FOREIGN KEY (code_lycee) REFERENCES lycees(code)
            )
        ''')
        
        # Copier les données
        cursor.execute('''
            INSERT INTO diplomes_par_lycee_new (code, code_diplome, code_lycee)
            SELECT code, code_diplome, code_lycee FROM diplomes_par_lycee
        ''')
        
        # Supprimer ancienne table et renommer
        cursor.execute('DROP TABLE diplomes_par_lycee')
        cursor.execute('ALTER TABLE diplomes_par_lycee_new RENAME TO diplomes_par_lycee')
        
        print("   ✓ Colonne 'options' ajoutée")
    else:
        print("   ⊘ Colonne 'options' existe déjà")
    
    conn.commit()
    
    # === 4. ÉTAT FINAL ===
    print()
    print("="*70)
    print("ÉTAT FINAL")
    print("="*70)
    
    cursor.execute('SELECT COUNT(*) FROM formations')
    nb_formations = cursor.fetchone()[0]
    print(f"Formations restantes : {nb_formations}")
    
    cursor.execute('SELECT COUNT(*) FROM formations_par_lycee')
    nb_liens_formations = cursor.fetchone()[0]
    print(f"Liens formations-lycées : {nb_liens_formations}")
    
    cursor.execute('SELECT COUNT(*) FROM diplomes')
    nb_diplomes = cursor.fetchone()[0]
    print(f"Diplômes restants : {nb_diplomes}")
    
    cursor.execute('SELECT COUNT(*) FROM diplomes_par_lycee')
    nb_liens_diplomes = cursor.fetchone()[0]
    print(f"Liens diplômes-lycées : {nb_liens_diplomes}")
    
    print()
    print("Exemples de formations restantes (CPGE 1re année uniquement) :")
    cursor.execute('SELECT intitule FROM formations ORDER BY intitule LIMIT 10')
    for (intitule,) in cursor.fetchall():
        print(f"  • {intitule}")
    
    print()
    print("Exemples de diplômes restants (CAP, Bac, BTS, pas CPGE) :")
    cursor.execute('SELECT intitule, niveau FROM diplomes ORDER BY niveau, intitule LIMIT 10')
    for intitule, niveau in cursor.fetchall():
        print(f"  • [{niveau}] {intitule}")
    
    print()
    print("="*70)
    print("✅ NETTOYAGE v6 TERMINÉ !")
    print("="*70)
    print()
    print("Modifications appliquées :")
    print("  ✓ Formations BTS, CAP, Bac pro supprimées")
    print("  ✓ Diplômes CPGE supprimés")
    print("  ✓ Champ 'options' ajouté dans diplomes_par_lycee")
    print()
    print("Prochaine étape :")
    print("  → Extraction dispositifs depuis Onisep")
    print("  → Reconstruction de dispositifs_par_lycee")
    
    conn.close()

if __name__ == "__main__":
    main()
