#!/usr/bin/env python3
"""
Générateur de document d'orientation : Lycées de Rennes
Version 2.0 - Avec structure de plan et page de garde

Améliorations :
- Structure de plan correcte (Heading 1, Heading 2, Heading 3)
- Page de garde avec image et titre
- Styles professionnels
- Prêt pour table des matières automatique
"""

import sqlite3
import os
from odf.opendocument import OpenDocumentText
from odf.style import Style, TextProperties, ParagraphProperties, GraphicProperties
from odf.text import P, H, Span, SoftPageBreak
from odf.draw import Frame, Image
from datetime import datetime

DB_PATH = './lycees_database.db'
OUTPUT_FILE = f'Guide_Orientation_Lycees_{datetime.now().strftime("%Y%m%d")}.odt'
LOGO_PATH = './logo_page_garde.png'  # Image pour la page de garde

def create_document_with_styles():
    """Crée le document ODT avec tous les styles nécessaires"""
    doc = OpenDocumentText()
    
    # Style Titre principal (Heading 1) - Pour les grandes sections
    h1style = Style(name="Heading1", family="paragraph")
    h1style.addElement(ParagraphProperties(
        marginbottom="0.5cm",
        margintop="0.8cm",
        breakbefore="page"  # Saut de page avant
    ))
    h1style.addElement(TextProperties(
        fontsize="18pt",
        fontweight="bold",
        color="#2E5090"
    ))
    doc.styles.addElement(h1style)
    
    # Style Sous-titre niveau 2 (Heading 2) - Pour chaque lycée
    h2style = Style(name="Heading2", family="paragraph")
    h2style.addElement(ParagraphProperties(
        marginbottom="0.3cm",
        margintop="0.6cm"
    ))
    h2style.addElement(TextProperties(
        fontsize="14pt",
        fontweight="bold",
        color="#4472C4"
    ))
    doc.styles.addElement(h2style)
    
    # Style Sous-titre niveau 3 (Heading 3) - Pour les sous-sections
    h3style = Style(name="Heading3", family="paragraph")
    h3style.addElement(ParagraphProperties(
        marginbottom="0.2cm",
        margintop="0.4cm"
    ))
    h3style.addElement(TextProperties(
        fontsize="12pt",
        fontweight="bold",
        color="#5B9BD5"
    ))
    doc.styles.addElement(h3style)
    
    # Style pour le texte normal
    normalstyle = Style(name="Normal", family="paragraph")
    normalstyle.addElement(ParagraphProperties(
        marginbottom="0.1cm"
    ))
    normalstyle.addElement(TextProperties(
        fontsize="11pt"
    ))
    doc.styles.addElement(normalstyle)
    
    # Style pour le titre de la page de garde
    titlestyle = Style(name="Title", family="paragraph")
    titlestyle.addElement(ParagraphProperties(
        textalign="center",
        marginbottom="1cm",
        margintop="2cm"
    ))
    titlestyle.addElement(TextProperties(
        fontsize="24pt",
        fontweight="bold",
        color="#2E5090"
    ))
    doc.styles.addElement(titlestyle)
    
    # Style pour le sous-titre de la page de garde
    subtitlestyle = Style(name="Subtitle", family="paragraph")
    subtitlestyle.addElement(ParagraphProperties(
        textalign="center",
        marginbottom="0.5cm"
    ))
    subtitlestyle.addElement(TextProperties(
        fontsize="14pt",
        color="#5B5B5B"
    ))
    doc.styles.addElement(subtitlestyle)
    
    # Style pour le texte en gras
    boldstyle = Style(name="Bold", family="text")
    boldstyle.addElement(TextProperties(fontweight="bold"))
    doc.automaticstyles.addElement(boldstyle)
    
    return doc

def add_cover_page(doc):
    """Ajoute une page de garde avec image et titre"""
    
    # Espacement initial
    doc.text.addElement(P())
    doc.text.addElement(P())
    doc.text.addElement(P())
    
    # Ajouter l'image si elle existe
    if os.path.exists(LOGO_PATH):
        # Créer un cadre pour l'image
        photoframe = Frame(
            width="12cm",
            height="9cm",
            x="2.5cm",
            y="2cm",
            anchortype="paragraph"
        )
        
        # Ajouter l'image dans le document
        href = doc.addPicture(LOGO_PATH)
        photoframe.addElement(Image(href=href))
        
        # Créer un style pour centrer l'image
        centerstyle = Style(name="CenterAlign", family="paragraph")
        centerstyle.addElement(ParagraphProperties(textalign="center"))
        doc.automaticstyles.addElement(centerstyle)
        
        # Centrer l'image
        p = P(stylename="CenterAlign")
        p.addElement(photoframe)
        doc.text.addElement(p)
        
        # Espacement
        doc.text.addElement(P())
        doc.text.addElement(P())
    
    # Titre principal
    p = P(stylename="Title")
    p.addText("Orientation en 3ème")
    doc.text.addElement(p)
    
    p = P(stylename="Title")
    p.addText("Lycées GT et lycées pro")
    doc.text.addElement(p)
    
    p = P(stylename="Title")
    p.addText("de Rennes et alentours")
    doc.text.addElement(p)
    
    # Espacement
    doc.text.addElement(P())
    doc.text.addElement(P())
    
    # Date de génération
    p = P(stylename="Subtitle")
    p.addText(f"Document généré le {datetime.now().strftime('%d/%m/%Y')}")
    doc.text.addElement(p)
    
    # Saut de page
    doc.text.addElement(SoftPageBreak())

def add_lycee_fiche(doc, lycee_data, heading_level=2):
    """
    Ajoute une fiche complète pour un lycée avec structure de plan correcte
    
    heading_level: Niveau de titre pour le nom du lycée (2 = Heading 2)
    """
    
    # Titre du lycée (Heading 2)
    h = H(outlinelevel=heading_level, stylename="Heading2", text=lycee_data['nom'])
    doc.text.addElement(h)
    
    # Effectifs (si disponible)
    if lycee_data.get('effectifs'):
        p = P(stylename="Normal")
        span = Span(stylename="Bold")
        span.addText(f"≈ {lycee_data['effectifs']} élèves")
        p.addElement(span)
        doc.text.addElement(p)
    
    doc.text.addElement(P())  # Ligne vide
    
    # Section Contacts (Heading 3)
    h = H(outlinelevel=3, stylename="Heading3", text="Contacts")
    doc.text.addElement(h)
    
    # Adresse
    if lycee_data.get('adresse_postale'):
        p = P(stylename="Normal")
        span = Span(stylename="Bold")
        span.addText("Adresse : ")
        p.addElement(span)
        p.addText(lycee_data['adresse_postale'])
        doc.text.addElement(p)
    
    # Téléphone
    if lycee_data.get('telephone'):
        p = P(stylename="Normal")
        span = Span(stylename="Bold")
        span.addText("Téléphone : ")
        p.addElement(span)
        p.addText(lycee_data['telephone'])
        doc.text.addElement(p)
    
    # Email
    if lycee_data.get('adresse_mail'):
        p = P(stylename="Normal")
        span = Span(stylename="Bold")
        span.addText("Courriel : ")
        p.addElement(span)
        p.addText(lycee_data['adresse_mail'])
        doc.text.addElement(p)
    
    # Site web
    if lycee_data.get('site_web'):
        p = P(stylename="Normal")
        span = Span(stylename="Bold")
        span.addText("Site web : ")
        p.addElement(span)
        p.addText(lycee_data['site_web'])
        doc.text.addElement(p)
    
    doc.text.addElement(P())  # Ligne vide
    
    # Section Formations (Heading 3)
    if lycee_data.get('formations'):
        h = H(outlinelevel=3, stylename="Heading3", text="Formations jusqu'au Bac")
        doc.text.addElement(h)
        
        # Sous-section "Après la 3e"
        has_2de = any('2de' in f['intitule'] or '3ème' in f['intitule'] for f in lycee_data['formations'])
        if has_2de:
            p = P(stylename="Normal")
            span = Span(stylename="Bold")
            span.addText("Après la 3e")
            p.addElement(span)
            doc.text.addElement(p)
            
            for formation in lycee_data['formations']:
                if '2de' in formation['intitule'] or '3ème' in formation['intitule']:
                    p = P(stylename="Normal", text=f"• {formation['intitule']} — {formation['duree']}")
                    doc.text.addElement(p)
            
            doc.text.addElement(P())  # Ligne vide
        
        # Sous-section "Cycle terminal"
        has_terminal = any('1re' in f['intitule'] or 'Terminale' in f['intitule'] for f in lycee_data['formations'])
        if has_terminal:
            p = P(stylename="Normal")
            span = Span(stylename="Bold")
            span.addText("Cycle terminal")
            p.addElement(span)
            doc.text.addElement(p)
            
            for formation in lycee_data['formations']:
                if '1re' in formation['intitule'] or 'Terminale' in formation['intitule']:
                    p = P(stylename="Normal", text=f"• {formation['intitule']} — {formation['duree']}")
                    doc.text.addElement(p)
            
            doc.text.addElement(P())  # Ligne vide
        
        # Sous-section "Bac professionnel"
        has_bac_pro = any('Bac pro' in f['intitule'] for f in lycee_data['formations'])
        if has_bac_pro:
            p = P(stylename="Normal")
            span = Span(stylename="Bold")
            span.addText("Bac professionnel")
            p.addElement(span)
            doc.text.addElement(p)
            
            for formation in lycee_data['formations']:
                if 'Bac pro' in formation['intitule']:
                    p = P(stylename="Normal", text=f"• {formation['intitule']} — {formation['duree']}")
                    doc.text.addElement(p)
            
            doc.text.addElement(P())  # Ligne vide
        
        # Sous-section "CAP"
        has_cap = any('CAP' in f['intitule'] for f in lycee_data['formations'])
        if has_cap:
            p = P(stylename="Normal")
            span = Span(stylename="Bold")
            span.addText("CAP")
            p.addElement(span)
            doc.text.addElement(p)
            
            for formation in lycee_data['formations']:
                if 'CAP' in formation['intitule']:
                    p = P(stylename="Normal", text=f"• {formation['intitule']} — {formation['duree']}")
                    doc.text.addElement(p)
            
            doc.text.addElement(P())  # Ligne vide
    
    # Section Parcours/Sections (Heading 3)
    if lycee_data.get('dispositifs'):
        h = H(outlinelevel=3, stylename="Heading3", text="Parcours / sections")
        doc.text.addElement(h)
        
        for dispositif in lycee_data['dispositifs']:
            info = dispositif.get('information_complementaire', '')
            text = f"• {dispositif['nom']}"
            if info:
                text += f" — {info}"
            text += f" — {dispositif['duree']}"
            p = P(stylename="Normal", text=text)
            doc.text.addElement(p)
        
        doc.text.addElement(P())  # Ligne vide
    
    # Section Enseignement supérieur (Heading 3)
    has_sup = any('BTS' in f['intitule'] or 'CPGE' in f['intitule'] for f in lycee_data.get('formations', []))
    if has_sup:
        h = H(outlinelevel=3, stylename="Heading3", text="Enseignement supérieur")
        doc.text.addElement(h)
        
        # BTS
        has_bts = any('BTS' in f['intitule'] for f in lycee_data['formations'])
        if has_bts:
            p = P(stylename="Normal")
            span = Span(stylename="Bold")
            span.addText("BTS — 2 ans")
            p.addElement(span)
            doc.text.addElement(p)
            
            bts_list = set()
            for formation in lycee_data['formations']:
                if 'BTS' in formation['intitule']:
                    # Extraire le nom du BTS sans "1re année" ou "2e année"
                    bts_name = formation['intitule'].replace(' - 1re année', '').replace(' - 2e année', '')
                    bts_list.add(bts_name)
            
            for bts in sorted(bts_list):
                p = P(stylename="Normal", text=f"• {bts}")
                doc.text.addElement(p)
            
            doc.text.addElement(P())  # Ligne vide
        
        # CPGE
        has_cpge = any('CPGE' in f['intitule'] for f in lycee_data['formations'])
        if has_cpge:
            p = P(stylename="Normal")
            span = Span(stylename="Bold")
            span.addText("CPGE")
            p.addElement(span)
            doc.text.addElement(p)
            
            for formation in lycee_data['formations']:
                if 'CPGE' in formation['intitule']:
                    p = P(stylename="Normal", text=f"• {formation['intitule']}")
                    doc.text.addElement(p)
            
            doc.text.addElement(P())  # Ligne vide
    
    # Espace entre les lycées
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
        
        # Récupérer les formations
        cursor.execute('''
            SELECT f.intitule, f.duree
            FROM formations f
            JOIN formations_par_lycee fpl ON f.code = fpl.code_formation
            WHERE fpl.code_lycee = ?
            ORDER BY 
                CASE
                    WHEN f.intitule LIKE '%2de%' THEN 1
                    WHEN f.intitule LIKE '%3ème%' THEN 2
                    WHEN f.intitule LIKE '%1re%' THEN 3
                    WHEN f.intitule LIKE '%Terminale%' THEN 4
                    WHEN f.intitule LIKE '%CAP%' THEN 5
                    WHEN f.intitule LIKE '%Bac pro%' THEN 6
                    WHEN f.intitule LIKE '%BTS%' THEN 7
                    WHEN f.intitule LIKE '%CPGE%' THEN 8
                    ELSE 9
                END,
                f.intitule
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
    print("GÉNÉRATION DU GUIDE D'ORIENTATION v2.0")
    print("="*70)
    print()
    
    # Créer le document avec styles
    doc = create_document_with_styles()
    
    # Ajouter la page de garde
    print("📄 Création de la page de garde...")
    add_cover_page(doc)
    
    # Récupérer les données
    print("📊 Récupération des données...")
    lycees = get_lycees_data()
    print(f"✓ {len(lycees)} lycées trouvés")
    print()
    
    # Section 1: Lycées GT publics de Rennes (Heading 1)
    print("📚 Section 1: Lycées généraux et technologiques publics de Rennes")
    h = H(outlinelevel=1, stylename="Heading1", 
          text="Lycées généraux et technologiques publics de Rennes")
    doc.text.addElement(h)
    doc.text.addElement(P())
    
    count = 0
    for lycee in lycees:
        if (lycee['localisation'] == 'Rennes' and 
            lycee['statut'] == 'public' and 
            lycee['type'] == 'GT'):
            print(f"  ✓ {lycee['nom']}")
            add_lycee_fiche(doc, lycee, heading_level=2)
            count += 1
    print(f"  → {count} lycées ajoutés")
    print()
    
    # Section 2: Lycées LP et polyvalents publics de Rennes (Heading 1)
    print("📚 Section 2: Lycées professionnels et polyvalents publics de Rennes")
    h = H(outlinelevel=1, stylename="Heading1", 
          text="Lycées professionnels et polyvalents publics de Rennes")
    doc.text.addElement(h)
    doc.text.addElement(P())
    
    count = 0
    for lycee in lycees:
        if (lycee['localisation'] == 'Rennes' and 
            lycee['statut'] == 'public' and 
            lycee['type'] in ['LP', 'Polyvalent']):
            print(f"  ✓ {lycee['nom']}")
            add_lycee_fiche(doc, lycee, heading_level=2)
            count += 1
    print(f"  → {count} lycées ajoutés")
    print()
    
    # Section 3: Lycées privés de Rennes (Heading 1)
    print("📚 Section 3: Lycées privés de Rennes")
    h = H(outlinelevel=1, stylename="Heading1", 
          text="Lycées privés de Rennes")
    doc.text.addElement(h)
    doc.text.addElement(P())
    
    count = 0
    for lycee in lycees:
        if lycee['localisation'] == 'Rennes' and lycee['statut'] == 'privé':
            print(f"  ✓ {lycee['nom']}")
            add_lycee_fiche(doc, lycee, heading_level=2)
            count += 1
    print(f"  → {count} lycées ajoutés")
    print()
    
    # Section 4: Lycées des alentours (Heading 1)
    print("📚 Section 4: Lycées publics et privés des alentours de Rennes")
    h = H(outlinelevel=1, stylename="Heading1", 
          text="Lycées publics et privés des alentours de Rennes")
    doc.text.addElement(h)
    doc.text.addElement(P())
    
    count = 0
    for lycee in lycees:
        if lycee['localisation'] != 'Rennes':
            print(f"  ✓ {lycee['nom']} ({lycee['localisation']})")
            add_lycee_fiche(doc, lycee, heading_level=2)
            count += 1
    print(f"  → {count} lycées ajoutés")
    print()
    
    # Sauvegarder
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
    print("📋 Structure de plan créée :")
    print("   • Heading 1 = Grandes sections (4 sections)")
    print("   • Heading 2 = Nom de chaque lycée")
    print("   • Heading 3 = Sous-sections (Contacts, Formations, etc.)")
    print()
    print("🎯 Pour insérer une table des matières dans LibreOffice :")
    print("   1. Ouvrir le document")
    print("   2. Menu Insertion → Table des matières et index → Table des matières")
    print("   3. Cliquer sur OK")
    print()
    print("✨ Page de garde avec image ajoutée !")

if __name__ == "__main__":
    generate_guide()
