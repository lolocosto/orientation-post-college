#!/usr/bin/env python3
"""
Import des formations par lycée depuis le fichier CSV
"""

import sqlite3
import csv
import os

CSV_FILE = './formations_par_lycee.csv'
DB_PATH = './lycees_database.db'

def get_or_create_formation(cursor, intitule, duree):
    """Récupère ou crée une formation, retourne son code"""
    # Nettoyer l'intitulé
    intitule = intitule.strip()
    duree = duree.strip()
    
    # Vérifier si la formation existe
    cursor.execute('SELECT code FROM formations WHERE intitule = ?', (intitule,))
    existing = cursor.fetchone()
    
    if existing:
        return existing[0]
    
    # Créer la formation
    cursor.execute('SELECT MAX(code) FROM formations')
    max_code = cursor.fetchone()[0] or 0
    code = max_code + 1
    
    # Déterminer le code_diplome si applicable
    code_diplome = None
    
    cursor.execute('''
        INSERT INTO formations (code, intitule, duree, code_diplome)
        VALUES (?, ?, ?, ?)
    ''', (code, intitule, duree, code_diplome))
    
    return code

def get_lycee_code(cursor, nom_lycee):
    """Récupère le code d'un lycée par son nom"""
    cursor.execute('SELECT code FROM lycees WHERE nom = ?', (nom_lycee,))
    result = cursor.fetchone()
    return result[0] if result else None

def link_exists(cursor, code_lycee, code_formation):
    """Vérifie si un lien existe déjà"""
    cursor.execute('''
        SELECT code FROM formations_par_lycee 
        WHERE code_lycee = ? AND code_formation = ?
    ''', (code_lycee, code_formation))
    return cursor.fetchone() is not None

def create_link(cursor, code_lycee, code_formation, modalite='temps plein'):
    """Crée un lien entre lycée et formation"""
    cursor.execute('SELECT MAX(code) FROM formations_par_lycee')
    max_code = cursor.fetchone()[0] or 0
    code = max_code + 1
    
    cursor.execute('''
        INSERT INTO formations_par_lycee (code, code_formation, code_lycee, modalite)
        VALUES (?, ?, ?, ?)
    ''', (code, code_formation, code_lycee, modalite))

def main():
    if not os.path.exists(CSV_FILE):
        print(f"❌ Fichier CSV non trouvé: {CSV_FILE}")
        return
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Base de données non trouvée: {DB_PATH}")
        return
    
    print("="*70)
    print("IMPORT DES FORMATIONS PAR LYCÉE")
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
    
    formations_created = 0
    liens_created = 0
    liens_skipped = 0
    lycees_not_found = set()
    
    for relation in relations:
        nom_lycee = relation['lycee'].strip()
        intitule_formation = relation['formation'].strip()
        duree = relation['duree'].strip()
        
        # Récupérer le code du lycée
        code_lycee = get_lycee_code(cursor, nom_lycee)
        
        if not code_lycee:
            lycees_not_found.add(nom_lycee)
            continue
        
        # Créer ou récupérer la formation
        code_formation = get_or_create_formation(cursor, intitule_formation, duree)
        if cursor.lastrowid:  # Une nouvelle formation a été créée
            formations_created += 1
            print(f"  ✓ Nouvelle formation : {intitule_formation}")
        
        # Créer le lien
        if not link_exists(cursor, code_lycee, code_formation):
            create_link(cursor, code_lycee, code_formation)
            liens_created += 1
            if cursor.lastrowid and formations_created == 0:  # Afficher seulement si c'est un nouveau lien avec formation existante
                pass  # Ne pas afficher pour éviter le bruit
        else:
            liens_skipped += 1
    
    conn.commit()
    
    # Stats finales
    cursor.execute('SELECT COUNT(*) FROM formations')
    total_formations = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM formations_par_lycee')
    total_liens = cursor.fetchone()[0]
    
    # Compter les 3ème prépa-métiers
    cursor.execute('''
        SELECT COUNT(DISTINCT fpl.code_lycee)
        FROM formations_par_lycee fpl
        JOIN formations f ON fpl.code_formation = f.code
        WHERE f.intitule LIKE '%3ème prépa-métiers%'
    ''')
    nb_3eme_pm = cursor.fetchone()[0]
    
    conn.close()
    
    print()
    print("="*70)
    print("Résumé :")
    print(f"  ✓ {formations_created} nouvelles formations créées")
    print(f"  ✓ {liens_created} nouveaux liens créés")
    print(f"  ⊘ {liens_skipped} liens déjà existants")
    if lycees_not_found:
        print(f"  ⚠️  {len(lycees_not_found)} lycées non trouvés :")
        for lycee in sorted(lycees_not_found):
            print(f"     - {lycee}")
    print()
    print(f"📊 État de la base :")
    print(f"  → Total formations : {total_formations}")
    print(f"  → Total liens lycées-formations : {total_liens}")
    print(f"  → Lycées avec 3ème prépa-métiers : {nb_3eme_pm}")
    print("="*70)
    print()
    print("💾 Base mise à jour avec succès !")
    print("📂 Ouvrez lycees_manager_standalone.html pour voir les résultats")

if __name__ == "__main__":
    main()
