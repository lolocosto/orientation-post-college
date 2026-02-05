#!/usr/bin/env python3
"""
Import des diplômes par lycée depuis le fichier CSV
"""

import sqlite3
import csv
import os

CSV_FILE = './diplomes_par_lycee.csv'
DB_PATH = './lycees_database.db'

def get_or_create_diplome(cursor, intitule):
    """Récupère ou crée un diplôme, retourne son code"""
    # Nettoyer l'intitulé
    intitule = intitule.strip()
    
    # Vérifier si le diplôme existe
    cursor.execute('SELECT code FROM diplomes WHERE intitule = ?', (intitule,))
    existing = cursor.fetchone()
    
    if existing:
        return existing[0]
    
    # Créer le diplôme
    cursor.execute('SELECT MAX(code) FROM diplomes')
    max_code = cursor.fetchone()[0] or 0
    code = max_code + 1
    
    # Déterminer le niveau et la durée selon le type
    if 'Bac général' in intitule:
        niveau, duree = 'Bac', '3 ans'
    elif 'Bac techno' in intitule:
        niveau, duree = 'Bac', '3 ans'
    elif 'Bac pro' in intitule:
        niveau, duree = 'Bac', '3 ans'
    elif 'BTS' in intitule:
        niveau, duree = 'Bac+2', '2 ans'
    elif 'CAP' in intitule:
        niveau, duree = 'CAP/BEP', '2 ans'
    elif 'CPGE' in intitule:
        niveau, duree = 'Bac+2', '2 ans'
    elif 'BP' in intitule:
        niveau, duree = 'CAP/BEP', '2 ans'
    else:
        niveau, duree = '', ''
    
    cursor.execute('''
        INSERT INTO diplomes (code, intitule, duree_de_preparation, niveau, information_complementaire)
        VALUES (?, ?, ?, ?, ?)
    ''', (code, intitule, duree, niveau, ''))
    
    return code

def get_lycee_code(cursor, nom_lycee):
    """Récupère le code d'un lycée par son nom"""
    cursor.execute('SELECT code FROM lycees WHERE nom = ?', (nom_lycee,))
    result = cursor.fetchone()
    return result[0] if result else None

def link_exists(cursor, code_lycee, code_diplome):
    """Vérifie si un lien existe déjà"""
    cursor.execute('''
        SELECT code FROM diplomes_par_lycee 
        WHERE code_lycee = ? AND code_diplome = ?
    ''', (code_lycee, code_diplome))
    return cursor.fetchone() is not None

def create_link(cursor, code_lycee, code_diplome, modalite):
    """Crée un lien entre lycée et diplôme"""
    cursor.execute('SELECT MAX(code) FROM diplomes_par_lycee')
    max_code = cursor.fetchone()[0] or 0
    code = max_code + 1
    
    cursor.execute('''
        INSERT INTO diplomes_par_lycee (code, code_lycee, code_diplome, modalite)
        VALUES (?, ?, ?, ?)
    ''', (code, code_lycee, code_diplome, modalite))

def main():
    if not os.path.exists(CSV_FILE):
        print(f"❌ Fichier CSV non trouvé: {CSV_FILE}")
        return
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Base de données non trouvée: {DB_PATH}")
        return
    
    print("="*70)
    print("IMPORT DES DIPLÔMES PAR LYCÉE")
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
    
    diplomes_created = 0
    liens_created = 0
    liens_skipped = 0
    lycees_not_found = set()
    
    for relation in relations:
        nom_lycee = relation['lycee'].strip()
        intitule_diplome = relation['diplome'].strip()
        modalite = relation['modalite'].strip()
        
        # Récupérer le code du lycée
        code_lycee = get_lycee_code(cursor, nom_lycee)
        
        if not code_lycee:
            lycees_not_found.add(nom_lycee)
            continue
        
        # Créer ou récupérer le diplôme
        code_diplome = get_or_create_diplome(cursor, intitule_diplome)
        if cursor.lastrowid:  # Un nouveau diplôme a été créé
            diplomes_created += 1
            print(f"  ✓ Nouveau diplôme : {intitule_diplome}")
        
        # Créer le lien
        if not link_exists(cursor, code_lycee, code_diplome):
            create_link(cursor, code_lycee, code_diplome, modalite)
            liens_created += 1
            print(f"    → Lié à {nom_lycee}")
        else:
            liens_skipped += 1
    
    conn.commit()
    
    # Stats finales
    cursor.execute('SELECT COUNT(*) FROM diplomes')
    total_diplomes = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM diplomes_par_lycee')
    total_liens = cursor.fetchone()[0]
    
    conn.close()
    
    print()
    print("="*70)
    print("Résumé :")
    print(f"  ✓ {diplomes_created} nouveaux diplômes créés")
    print(f"  ✓ {liens_created} nouveaux liens créés")
    print(f"  ⊘ {liens_skipped} liens déjà existants")
    if lycees_not_found:
        print(f"  ⚠️  {len(lycees_not_found)} lycées non trouvés :")
        for lycee in sorted(lycees_not_found):
            print(f"     - {lycee}")
    print()
    print(f"📊 État de la base :")
    print(f"  → Total diplômes : {total_diplomes}")
    print(f"  → Total liens lycées-diplômes : {total_liens}")
    print("="*70)
    print()
    print("💾 Base mise à jour avec succès !")
    print("📂 Ouvrez lycees_manager_standalone.html pour voir les résultats")

if __name__ == "__main__":
    main()
