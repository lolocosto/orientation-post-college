#!/usr/bin/env python3
"""
Générateur de document d'orientation : Lycées de Rennes
Génère un document ODT structuré à partir de la base SQLite
"""

import sqlite3
from odf.opendocument import OpenDocumentText
from odf.style import Style, TextProperties, ParagraphProperties, TableColumnProperties
from odf.text import P, H, Span
from odf.table import Table, TableColumn, TableRow, TableCell
from datetime import datetime

DB_PATH = './lycees_database.db'
OUTPUT_FILE = f'Guide_Orientation_Lycees_{datetime.now().strftime("%Y%m%d")}.odt'

def create_document():
    """Crée le document ODT de base"""
    doc = OpenDocumentText()
    
    # Styles
    # Style pour les titres
    h1style = Style(name="Heading1", family="paragraph")
    h1style.addElement(TextProperties(attributes={'fontsize':"18pt", 'fontweight':"bold"}))
    doc.automaticstyles.addElement(h1style)
    
    # Style pour les sous-titres
    h2style = Style(name="Heading2", family="paragraph")
    h2style.addElement(TextProperties(attributes={'fontsize':"14pt", 'fontweight':"bold"}))
    doc.automaticstyles.addElement(h2style)
    
    # Style pour le texte normal
    normalstyle = Style(name="Normal", family="paragraph")
    doc.automaticstyles.addElement(normalstyle)
    
    return doc

def add_lycee_fiche(doc, lycee_data):
    """
    Ajoute une fiche complète pour un lycée
    
    lycee_data: dict avec les infos du lycée
        - nom
        - adresse_postale
        - telephone
        - adresse_mail
        - site_web
        - diplomes: liste
        - formations: liste
        - dispositifs: liste
    """
    
    # Titre du lycée
    h = H(outlinelevel=2, stylename="Heading2", text=lycee_data['nom'])
    doc.text.addElement(h)
    
    # Section Contacts
    p = P(stylename="Heading3", text="Contacts")
    doc.text.addElement(p)
    
    # Adresse
    p = P(stylename="Normal", text=f"Adresse : {lycee_data['adresse_postale']}")
    doc.text.addElement(p)
    
    # Téléphone
    p = P(stylename="Normal", text=f"Téléphone : {lycee_data['telephone']}")
    doc.text.addElement(p)
    
    # Email
    p = P(stylename="Normal", text=f"Courriel : {lycee_data['adresse_mail']}")
    doc.text.addElement(p)
    
    # Site web
    p = P(stylename="Normal", text=f"Site web : {lycee_data['site_web']}")
    doc.text.addElement(p)
    
    # Ligne vide
    doc.text.addElement(P())
    
    # Section Formations
    if lycee_data.get('formations'):
        p = P(stylename="Heading3", text="Formations jusqu'au Bac")
        doc.text.addElement(p)
        
        # Après la 3e
        p = P(stylename="Bold", text="Après la 3e")
        doc.text.addElement(p)
        
        for formation in lycee_data['formations']:
            if '2de' in formation['intitule']:
                p = P(stylename="Normal", text=f"• {formation['intitule']} — {formation['duree']}")
                doc.text.addElement(p)
        
        # Cycle terminal
        p = P(stylename="Bold", text="Cycle terminal")
        doc.text.addElement(p)
        
        for formation in lycee_data['formations']:
            if '1re' in formation['intitule'] or 'Terminale' in formation['intitule']:
                p = P(stylename="Normal", text=f"• {formation['intitule']} — {formation['duree']}")
                doc.text.addElement(p)
    
    # Section Diplômes
    if lycee_data.get('diplomes'):
        doc.text.addElement(P())
        p = P(stylename="Heading3", text="Diplômes préparés")
        doc.text.addElement(p)
        
        for diplome in lycee_data['diplomes']:
            p = P(stylename="Normal", text=f"• {diplome['intitule']}")
            doc.text.addElement(p)
    
    # Section Dispositifs
    if lycee_data.get('dispositifs'):
        doc.text.addElement(P())
        p = P(stylename="Heading3", text="Parcours / Sections")
        doc.text.addElement(p)
        
        for dispositif in lycee_data['dispositifs']:
            info = dispositif.get('information_complementaire', '')
            text = f"• {dispositif['nom']}"
            if info:
                text += f" — {info}"
            p = P(stylename="Normal", text=text)
            doc.text.addElement(p)
    
    # Saut de page
    doc.text.addElement(P())
    doc.text.addElement(P())

def get_lycees_data():
    """Récupère les données de tous les lycées depuis la base"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Récupérer les lycées de Rennes Métropole
    cursor.execute('''
        SELECT * FROM lycees 
        WHERE localisation IN ('Rennes', 'Cesson-Sévigné', 'Bruz', 'Le Rheu', 'Saint-Grégoire')
        ORDER BY 
            CASE 
                WHEN type = 'GT' THEN 1
                WHEN type = 'Polyvalent' THEN 2
                WHEN type = 'LP' THEN 3
                ELSE 4
            END,
            nom
    ''')
    
    lycees = []
    
    for row in cursor.fetchall():
        lycee = dict(row)
        
        # Récupérer les diplômes
        cursor.execute('''
            SELECT d.intitule, d.niveau, d.duree_de_preparation
            FROM diplomes d
            JOIN diplomes_par_lycee dpl ON d.code = dpl.code_diplome
            WHERE dpl.code_lycee = ?
            ORDER BY d.intitule
        ''', (lycee['code'],))
        lycee['diplomes'] = [dict(r) for r in cursor.fetchall()]
        
        # Récupérer les formations
        cursor.execute('''
            SELECT f.intitule, f.duree
            FROM formations f
            JOIN formations_par_lycee fpl ON f.code = fpl.code_formation
            WHERE fpl.code_lycee = ?
            ORDER BY f.intitule
        ''', (lycee['code'],))
        lycee['formations'] = [dict(r) for r in cursor.fetchall()]
        
        # Récupérer les dispositifs
        cursor.execute('''
            SELECT d.nom, d.duree, dpl.information_complementaire
            FROM dispositifs d
            JOIN dispositifs_par_lycee dpl ON d.code = dpl.code_dispositif
            WHERE dpl.code_lycee = ?
            ORDER BY d.nom
        ''', (lycee['code'],))
        lycee['dispositifs'] = [dict(r) for r in cursor.fetchall()]
        
        lycees.append(lycee)
    
    conn.close()
    return lycees

def generate_guide():
    """Génère le guide complet d'orientation"""
    print("="*70)
    print("GÉNÉRATION DU GUIDE D'ORIENTATION")
    print("="*70)
    print()
    
    # Créer le document
    doc = create_document()
    
    # Titre principal
    h = H(outlinelevel=1, stylename="Heading1", 
          text="Orientation en 3ème - Lycées GT et lycées pro de Rennes et alentours")
    doc.text.addElement(h)
    doc.text.addElement(P())
    
    # Date de génération
    p = P(stylename="Normal", text=f"Document généré le {datetime.now().strftime('%d/%m/%Y')}")
    doc.text.addElement(p)
    doc.text.addElement(P())
    doc.text.addElement(P())
    
    # Récupérer les données
    print("📊 Récupération des données...")
    lycees = get_lycees_data()
    print(f"✓ {len(lycees)} lycées trouvés")
    print()
    
    # Section Lycées publics de Rennes
    h = H(outlinelevel=1, stylename="Heading1", 
          text="Lycées généraux et technologiques publics de Rennes")
    doc.text.addElement(h)
    doc.text.addElement(P())
    
    for lycee in lycees:
        if lycee['localisation'] == 'Rennes' and lycee['statut'] == 'public' and lycee['type'] == 'GT':
            print(f"  ✓ Ajout : {lycee['nom']}")
            add_lycee_fiche(doc, lycee)
    
    # Section Lycées professionnels et polyvalents publics de Rennes
    h = H(outlinelevel=1, stylename="Heading1", 
          text="Lycées professionnels et polyvalents publics de Rennes")
    doc.text.addElement(h)
    doc.text.addElement(P())
    
    for lycee in lycees:
        if lycee['localisation'] == 'Rennes' and lycee['statut'] == 'public' and lycee['type'] in ['LP', 'Polyvalent']:
            print(f"  ✓ Ajout : {lycee['nom']}")
            add_lycee_fiche(doc, lycee)
    
    # Section Lycées privés de Rennes
    h = H(outlinelevel=1, stylename="Heading1", 
          text="Lycées privés de Rennes")
    doc.text.addElement(h)
    doc.text.addElement(P())
    
    for lycee in lycees:
        if lycee['localisation'] == 'Rennes' and lycee['statut'] == 'privé':
            print(f"  ✓ Ajout : {lycee['nom']}")
            add_lycee_fiche(doc, lycee)
    
    # Section Lycées des alentours
    h = H(outlinelevel=1, stylename="Heading1", 
          text="Lycées publics et privés des alentours de Rennes")
    doc.text.addElement(h)
    doc.text.addElement(P())
    
    for lycee in lycees:
        if lycee['localisation'] != 'Rennes':
            print(f"  ✓ Ajout : {lycee['nom']}")
            add_lycee_fiche(doc, lycee)
    
    # Sauvegarder
    print()
    print(f"💾 Enregistrement du document : {OUTPUT_FILE}")
    doc.save(OUTPUT_FILE)
    
    print()
    print("="*70)
    print("✅ DOCUMENT GÉNÉRÉ AVEC SUCCÈS !")
    print("="*70)
    print()
    print(f"📄 Fichier : {OUTPUT_FILE}")
    print(f"📊 Lycées inclus : {len(lycees)}")
    print()
    print("Vous pouvez maintenant ouvrir le fichier avec LibreOffice Writer")

if __name__ == "__main__":
    generate_guide()
