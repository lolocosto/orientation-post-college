#!/usr/bin/env python3
"""
Import des lycées publics de Rennes dans la base SQLite
"""

import sqlite3
import csv
import os

CSV_FILE = './lycees_complets_rennes_metropole.csv'
DB_PATH = './lycees_database.db'

def import_lycees():
    """Importe les lycées depuis le CSV vers SQLite"""
    
    if not os.path.exists(CSV_FILE):
        print(f"❌ Fichier CSV non trouvé: {CSV_FILE}")
        return False
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Base de données non trouvée: {DB_PATH}")
        print("Veuillez placer lycees_database.db dans le même dossier")
        return False
    
    print("="*70)
    print("IMPORT LYCÉES COMPLETS - RENNES MÉTROPOLE")
    print("(Publics + Privés sous contrat)")
    print("="*70)
    print()
    
    # Lire le CSV
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        lycees = list(reader)
    
    print(f"📋 {len(lycees)} lycées à importer")
    print()
    
    # Connexion à la base
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Obtenir le code max actuel
    cursor.execute('SELECT MAX(code) FROM lycees')
    max_code = cursor.fetchone()[0] or 0
    
    imported = 0
    skipped = 0
    updated = 0
    
    for lycee in lycees:
        # Vérifier si le lycée existe déjà (par nom)
        cursor.execute('SELECT code FROM lycees WHERE nom = ?', (lycee['nom'],))
        exists = cursor.fetchone()
        
        if exists:
            # Mettre à jour les informations
            code = exists[0]
            cursor.execute('''
                UPDATE lycees 
                SET localisation = ?, type = ?, statut = ?, 
                    adresse_postale = ?, telephone = ?, adresse_mail = ?, site_web = ?
                WHERE code = ?
            ''', (
                lycee['localisation'],
                lycee['type'],
                lycee['statut'],
                lycee['adresse_postale'],
                lycee['telephone'],
                lycee['adresse_mail'],
                lycee['site_web'],
                code
            ))
            updated += 1
            print(f"  ↻ Mis à jour: {lycee['nom']}")
        else:
            # Insérer un nouveau lycée
            max_code += 1
            
            try:
                cursor.execute('''
                    INSERT INTO lycees (code, nom, localisation, type, statut, adresse_postale, telephone, adresse_mail, site_web)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    max_code,
                    lycee['nom'],
                    lycee['localisation'],
                    lycee['type'],
                    lycee['statut'],
                    lycee['adresse_postale'],
                    lycee['telephone'],
                    lycee['adresse_mail'],
                    lycee['site_web']
                ))
                imported += 1
                print(f"  ✓ Importé: {lycee['nom']}")
            except Exception as e:
                print(f"  ❌ Erreur pour {lycee['nom']}: {e}")
    
    conn.commit()
    
    # Afficher les stats finales
    cursor.execute('SELECT COUNT(*) FROM lycees')
    total = cursor.fetchone()[0]
    
    conn.close()
    
    print()
    print("="*60)
    print("Résumé:")
    print(f"  ✓ {imported} lycées ajoutés")
    print(f"  ↻ {updated} lycées mis à jour")
    print(f"  → Total dans la base: {total} lycées")
    print("="*60)
    print()
    print("💾 Base mise à jour: lycees_database.db")
    print("📂 Vous pouvez maintenant l'utiliser avec lycees_manager_standalone.html")
    
    return True

if __name__ == "__main__":
    import_lycees()
