#!/usr/bin/env python3
"""
Import des dispositifs par lycée depuis le fichier CSV
"""

import sqlite3
import csv
import os

CSV_FILE = './dispositifs_par_lycee.csv'
DB_PATH = './lycees_database.db'

def get_or_create_dispositif(cursor, nom, duree):
    """Récupère ou crée un dispositif, retourne son code"""
    # Nettoyer le nom
    nom = nom.strip()
    duree = duree.strip()
    
    # Vérifier si le dispositif existe
    cursor.execute('SELECT code FROM dispositifs WHERE nom = ?', (nom,))
    existing = cursor.fetchone()
    
    if existing:
        return existing[0]
    
    # Créer le dispositif
    cursor.execute('SELECT MAX(code) FROM dispositifs')
    max_code = cursor.fetchone()[0] or 0
    code = max_code + 1
    
    cursor.execute('''
        INSERT INTO dispositifs (code, nom, duree, information_complementaire)
        VALUES (?, ?, ?, ?)
    ''', (code, nom, duree, ''))
    
    return code

def get_lycee_code(cursor, nom_lycee):
    """Récupère le code d'un lycée par son nom"""
    cursor.execute('SELECT code FROM lycees WHERE nom = ?', (nom_lycee,))
    result = cursor.fetchone()
    return result[0] if result else None

def link_exists(cursor, code_lycee, code_dispositif):
    """Vérifie si un lien existe déjà"""
    cursor.execute('''
        SELECT code FROM dispositifs_par_lycee 
        WHERE code_lycee = ? AND code_dispositif = ?
    ''', (code_lycee, code_dispositif))
    return cursor.fetchone() is not None

def create_link(cursor, code_lycee, code_dispositif, duree, info_comp):
    """Crée un lien entre lycée et dispositif"""
    cursor.execute('SELECT MAX(code) FROM dispositifs_par_lycee')
    max_code = cursor.fetchone()[0] or 0
    code = max_code + 1
    
    cursor.execute('''
        INSERT INTO dispositifs_par_lycee (code, code_dispositif, code_lycee, duree, information_complementaire, source)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (code, code_dispositif, code_lycee, duree, info_comp, 'CSV import'))

def main():
    if not os.path.exists(CSV_FILE):
        print(f"❌ Fichier CSV non trouvé: {CSV_FILE}")
        return
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Base de données non trouvée: {DB_PATH}")
        return
    
    print("="*70)
    print("IMPORT DES DISPOSITIFS PAR LYCÉE")
    print("="*70)
    print()
    
    # Lire le CSV
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        relations = list(reader)
    
    print(f"📋 {len(relations)} relations à importer")
    print()
    
    # Connexion à la base
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    dispositifs_created = 0
    liens_created = 0
    liens_skipped = 0
    lycees_not_found = set()
    
    for relation in relations:
        nom_lycee = relation['lycee'].strip()
        nom_dispositif = relation['dispositif'].strip()
        duree = relation['duree'].strip()
        info_comp = relation['information_complementaire'].strip()
        
        # Récupérer le code du lycée
        code_lycee = get_lycee_code(cursor, nom_lycee)
        
        if not code_lycee:
            lycees_not_found.add(nom_lycee)
            continue
        
        # Créer ou récupérer le dispositif
        code_dispositif = get_or_create_dispositif(cursor, nom_dispositif, duree)
        if cursor.lastrowid:  # Un nouveau dispositif a été créé
            dispositifs_created += 1
            print(f"  ✓ Nouveau dispositif : {nom_dispositif}")
        
        # Créer le lien
        if not link_exists(cursor, code_lycee, code_dispositif):
            create_link(cursor, code_lycee, code_dispositif, duree, info_comp)
            liens_created += 1
        else:
            liens_skipped += 1
    
    conn.commit()
    
    # Stats finales
    cursor.execute('SELECT COUNT(*) FROM dispositifs')
    total_dispositifs = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM dispositifs_par_lycee')
    total_liens = cursor.fetchone()[0]
    
    # Compter par type de dispositif
    cursor.execute('''
        SELECT d.nom, COUNT(dpl.code) as nb
        FROM dispositifs d
        LEFT JOIN dispositifs_par_lycee dpl ON d.code = dpl.code_dispositif
        GROUP BY d.nom
        HAVING nb > 0
        ORDER BY nb DESC
        LIMIT 5
    ''')
    
    print()
    print("="*70)
    print("Résumé :")
    print(f"  ✓ {dispositifs_created} nouveaux dispositifs créés")
    print(f"  ✓ {liens_created} nouveaux liens créés")
    print(f"  ⊘ {liens_skipped} liens déjà existants")
    if lycees_not_found:
        print(f"  ⚠️  {len(lycees_not_found)} lycées non trouvés :")
        for lycee in sorted(lycees_not_found):
            print(f"     - {lycee}")
    print()
    print(f"📊 État de la base :")
    print(f"  → Total dispositifs : {total_dispositifs}")
    print(f"  → Total liens lycées-dispositifs : {total_liens}")
    print()
    print("Top 5 des dispositifs :")
    for row in cursor.fetchall():
        print(f"  • {row[0]}: {row[1]} lycées")
    print("="*70)
    print()
    print("💾 Base mise à jour avec succès !")
    print("📂 Ouvrez lycees_manager_standalone.html pour voir les résultats")
    
    conn.close()

if __name__ == "__main__":
    main()
