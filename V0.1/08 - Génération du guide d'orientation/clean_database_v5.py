#!/usr/bin/env python3
"""
Nettoyage de la base de données
- Suppression des formations liées aux diplômes
- Suppression de la table formations_par_diplome (si existe)
- Migration de 3ème prépa-métiers vers dispositifs
"""

import sqlite3

DB_PATH = './lycees_database.db'

def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("="*70)
    print("NETTOYAGE DE LA BASE DE DONNÉES")
    print("="*70)
    print()
    
    # === 1. SUPPRIMER formations_par_diplome ===
    print("1. Suppression de formations_par_diplome...")
    try:
        cursor.execute('DROP TABLE IF EXISTS formations_par_diplome')
        print("   ✓ Table formations_par_diplome supprimée")
    except:
        print("   ⊘ Table déjà supprimée")
    
    # === 2. IDENTIFIER LES FORMATIONS À SUPPRIMER ===
    print()
    print("2. Identification des formations liées aux diplômes...")
    
    # Formations qui mènent à un diplôme (Terminale, 2e année, DCG)
    cursor.execute('''
        SELECT code, intitule FROM formations
        WHERE intitule LIKE '%Terminale%'
           OR intitule LIKE '%2e année%'
           OR intitule LIKE '%DCG%'
        ORDER BY intitule
    ''')
    formations_a_supprimer = cursor.fetchall()
    
    print(f"   ✓ {len(formations_a_supprimer)} formations à supprimer")
    for code, intitule in formations_a_supprimer[:5]:
        print(f"     • {intitule}")
    if len(formations_a_supprimer) > 5:
        print(f"     ... et {len(formations_a_supprimer) - 5} autres")
    
    # === 3. SUPPRIMER LES LIENS formations_par_lycee ===
    print()
    print("3. Suppression des liens formations_par_lycee...")
    
    codes_a_supprimer = [code for code, _ in formations_a_supprimer]
    placeholders = ','.join('?' * len(codes_a_supprimer))
    
    cursor.execute(f'''
        DELETE FROM formations_par_lycee
        WHERE code_formation IN ({placeholders})
    ''', codes_a_supprimer)
    
    liens_supprimes = cursor.rowcount
    print(f"   ✓ {liens_supprimes} liens supprimés")
    
    # === 4. SUPPRIMER LES FORMATIONS ===
    print()
    print("4. Suppression des formations...")
    
    cursor.execute(f'''
        DELETE FROM formations
        WHERE code IN ({placeholders})
    ''', codes_a_supprimer)
    
    formations_supprimees = cursor.rowcount
    print(f"   ✓ {formations_supprimees} formations supprimées")
    
    # === 5. MIGRER 3ème prépa-métiers vers dispositifs ===
    print()
    print("5. Migration de 3ème prépa-métiers vers dispositifs...")
    
    # Vérifier si 3ème prépa-métiers existe comme formation
    cursor.execute('''
        SELECT code, intitule FROM formations
        WHERE intitule LIKE '%3ème%'
    ''')
    formation_3eme = cursor.fetchone()
    
    if formation_3eme:
        code_formation, intitule = formation_3eme
        print(f"   ✓ Formation trouvée : {intitule}")
        
        # Créer le dispositif 3ème prépa-métiers s'il n'existe pas
        cursor.execute('''
            SELECT code FROM dispositifs
            WHERE nom LIKE '%3ème prépa%'
        ''')
        dispositif_3eme = cursor.fetchone()
        
        if not dispositif_3eme:
            cursor.execute('SELECT MAX(code) FROM dispositifs')
            max_code = cursor.fetchone()[0] or 0
            code_dispositif = max_code + 1
            
            cursor.execute('''
                INSERT INTO dispositifs (code, nom)
                VALUES (?, ?)
            ''', (code_dispositif, '3ème prépa-métiers'))
            
            print(f"   ✓ Dispositif créé : 3ème prépa-métiers (code {code_dispositif})")
        else:
            code_dispositif = dispositif_3eme[0]
            print(f"   ⊘ Dispositif existant (code {code_dispositif})")
        
        # Récupérer les lycées qui proposent la formation
        cursor.execute('''
            SELECT code_lycee FROM formations_par_lycee
            WHERE code_formation = ?
        ''', (code_formation,))
        lycees_3eme = cursor.fetchall()
        
        print(f"   ✓ {len(lycees_3eme)} lycées concernés")
        
        # Créer les liens dispositifs_par_lycee
        for (code_lycee,) in lycees_3eme:
            # Vérifier si le lien n'existe pas déjà
            cursor.execute('''
                SELECT code FROM dispositifs_par_lycee
                WHERE code_dispositif = ? AND code_lycee = ?
            ''', (code_dispositif, code_lycee))
            
            if not cursor.fetchone():
                cursor.execute('SELECT MAX(code) FROM dispositifs_par_lycee')
                max_code_lien = cursor.fetchone()[0] or 0
                code_lien = max_code_lien + 1
                
                cursor.execute('''
                    INSERT INTO dispositifs_par_lycee (code, code_dispositif, code_lycee)
                    VALUES (?, ?, ?)
                ''', (code_lien, code_dispositif, code_lycee))
                
                # Récupérer le nom du lycée
                cursor.execute('SELECT nom FROM lycees WHERE code = ?', (code_lycee,))
                nom_lycee = cursor.fetchone()[0]
                print(f"     • Lien créé : {nom_lycee}")
        
        # Supprimer la formation et ses liens
        cursor.execute('DELETE FROM formations_par_lycee WHERE code_formation = ?', (code_formation,))
        cursor.execute('DELETE FROM formations WHERE code = ?', (code_formation,))
        
        print(f"   ✓ Formation 3ème prépa-métiers migrée vers dispositifs")
    else:
        print("   ⊘ Pas de formation 3ème prépa-métiers trouvée")
    
    # === 6. ÉTAT FINAL ===
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
    
    cursor.execute('SELECT COUNT(*) FROM dispositifs')
    nb_dispositifs = cursor.fetchone()[0]
    print(f"Dispositifs : {nb_dispositifs}")
    
    cursor.execute('SELECT COUNT(*) FROM dispositifs_par_lycee')
    nb_liens_dispositifs = cursor.fetchone()[0]
    print(f"Liens dispositifs-lycées : {nb_liens_dispositifs}")
    
    print()
    print("Exemples de formations restantes (parcours uniquement) :")
    cursor.execute('SELECT intitule FROM formations ORDER BY intitule LIMIT 10')
    for (intitule,) in cursor.fetchall():
        print(f"  • {intitule}")
    
    conn.commit()
    
    print()
    print("="*70)
    print("✅ NETTOYAGE TERMINÉ !")
    print("="*70)
    print()
    print("Modifications appliquées :")
    print("  ✓ Formations liées aux diplômes supprimées")
    print("  ✓ Table formations_par_diplome supprimée")
    print("  ✓ 3ème prépa-métiers migré vers dispositifs")
    print()
    
    conn.close()

if __name__ == "__main__":
    main()
