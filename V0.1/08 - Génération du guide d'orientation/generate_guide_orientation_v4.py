#!/usr/bin/env python3
"""
Générateur de document d'orientation : Lycées de Rennes
Version 4.0 - Table des matières automatique + restructuration

Changements v4.0 :
- Table des matières insérée automatiquement en page 2
- Suppression des mentions de durée
- "Formations jusqu'au Bac" → "Formations"
- Restructuration formations : Cycle terminal GT/Pro, CAP, Sup (Heading 4)
- Enseignement supérieur rattaché à Formations (Heading 4)
"""

import sqlite3
import os
from odf.opendocument import OpenDocumentText
from odf.style import Style, TextProperties, ParagraphProperties, TabStop, TabStops
from odf.text import P, H, Span, SoftPageBreak, TableOfContent, TableOfContentSource, IndexTitleTemplate, TableOfContentEntryTemplate, IndexSourceStyles, IndexSourceStyle
from odf.draw import Frame, Image
from datetime import datetime

DB_PATH = './lycees_database.db'
OUTPUT_FILE = f'Guide_Orientation_Lycees_{datetime.now().strftime("%Y%m%d")}_v4.odt'
LOGO_PATH = './logo_page_garde.png'

def create_document_with_styles():
    """Crée le document ODT avec tous les styles nécessaires"""
    doc = OpenDocumentText()
    
    # Style Heading 1
    h1style = Style(name="Heading1", family="paragraph")
    h1style.addElement(ParagraphProperties(
        marginbottom="0.4cm",
        margintop="0.8cm",
        breakbefore="page"
    ))
    h1style.addElement(TextProperties(
        fontsize="18pt",
        fontweight="bold",
        color="#2E5090"
    ))
    doc.styles.addElement(h1style)
    
    # Style Heading 2
    h2style = Style(name="Heading2", family="paragraph")
    h2style.addElement(ParagraphProperties(
        marginbottom="0.2cm",
        margintop="0.5cm"
    ))
    h2style.addElement(TextProperties(
        fontsize="14pt",
        fontweight="bold",
        color="#4472C4"
    ))
    doc.styles.addElement(h2style)
    
    # Style Heading 3
    h3style = Style(name="Heading3", family="paragraph")
    h3style.addElement(ParagraphProperties(
        marginbottom="0.15cm",
        margintop="0.3cm"
    ))
    h3style.addElement(TextProperties(
        fontsize="12pt",
        fontweight="bold",
        color="#5B9BD5"
    ))
    doc.styles.addElement(h3style)
    
    # Style Heading 4
    h4style = Style(name="Heading4", family="paragraph")
    h4style.addElement(ParagraphProperties(
        marginbottom="0.1cm",
        margintop="0.2cm"
    ))
    h4style.addElement(TextProperties(
        fontsize="11pt",
        fontweight="bold",
        color="#70AD47"
    ))
    doc.styles.addElement(h4style)
    
    # Style Normal
    normalstyle = Style(name="Normal", family="paragraph")
    normalstyle.addElement(ParagraphProperties(marginbottom="0cm"))
    normalstyle.addElement(TextProperties(fontsize="11pt"))
    doc.styles.addElement(normalstyle)
    
    # Style Title
    titlestyle = Style(name="Title", family="paragraph")
    titlestyle.addElement(ParagraphProperties(
        textalign="center",
        marginbottom="0.5cm",
        margintop="2cm"
    ))
    titlestyle.addElement(TextProperties(
        fontsize="24pt",
        fontweight="bold",
        color="#2E5090"
    ))
    doc.styles.addElement(titlestyle)
    
    # Style Subtitle
    subtitlestyle = Style(name="Subtitle", family="paragraph")
    subtitlestyle.addElement(ParagraphProperties(textalign="center", marginbottom="0cm"))
    subtitlestyle.addElement(TextProperties(fontsize="14pt", color="#5B5B5B"))
    doc.styles.addElement(subtitlestyle)
    
    # Style Bold
    boldstyle = Style(name="Bold", family="text")
    boldstyle.addElement(TextProperties(fontweight="bold"))
    doc.automaticstyles.addElement(boldstyle)
    
    return doc

def add_cover_page(doc):
    """Ajoute une page de garde avec image et titre"""
    
    if os.path.exists(LOGO_PATH):
        photoframe = Frame(
            width="12cm",
            height="9cm",
            x="2.5cm",
            y="2cm",
            anchortype="paragraph"
        )
        
        href = doc.addPicture(LOGO_PATH)
        photoframe.addElement(Image(href=href))
        
        centerstyle = Style(name="CenterAlign", family="paragraph")
        centerstyle.addElement(ParagraphProperties(textalign="center"))
        doc.automaticstyles.addElement(centerstyle)
        
        p = P(stylename="CenterAlign")
        p.addElement(photoframe)
        doc.text.addElement(p)
    
    p = P(stylename="Title")
    p.addText("Orientation en 3ème")
    doc.text.addElement(p)
    
    p = P(stylename="Title")
    p.addText("Lycées GT et lycées pro")
    doc.text.addElement(p)
    
    p = P(stylename="Title")
    p.addText("de Rennes et alentours")
    doc.text.addElement(p)
    
    p = P(stylename="Subtitle")
    p.addText(f"Document généré le {datetime.now().strftime('%d/%m/%Y')}")
    doc.text.addElement(p)
    
    doc.text.addElement(SoftPageBreak())

def add_table_of_contents(doc):
    """Ajoute une table des matières automatique (jusqu'au Heading 3)"""
    
    # Créer la table des matières
    toc = TableOfContent(name="Table des matières")
    
    # Source de la table
    toc_source = TableOfContentSource(outlinelevel=3)  # Jusqu'au niveau 3
    
    # Template de titre
    title_template = IndexTitleTemplate()
    title_template.addText("Table des matières")
    toc_source.addElement(title_template)
    
    # Templates pour chaque niveau
    for level in range(1, 4):  # Niveaux 1, 2, 3
        entry_template = TableOfContentEntryTemplate(
            outlinelevel=str(level),
            stylename=f"Contents_{level}"
        )
        toc_source.addElement(entry_template)
    
    toc.addElement(toc_source)
    
    # Ajouter la TOC au document
    doc.text.addElement(toc)
    
    # Saut de page après la TOC
    doc.text.addElement(SoftPageBreak())

def add_lycee_fiche(doc, lycee_data):
    """Ajoute une fiche complète pour un lycée"""
    
    # Nom du lycée (Heading 2)
    h = H(outlinelevel=2, stylename="Heading2", text=lycee_data['nom'])
    doc.text.addElement(h)
    
    if lycee_data.get('effectifs'):
        p = P(stylename="Normal")
        span = Span(stylename="Bold")
        span.addText(f"≈ {lycee_data['effectifs']} élèves")
        p.addElement(span)
        doc.text.addElement(p)
    
    # === CONTACTS ===
    h = H(outlinelevel=3, stylename="Heading3", text="Contacts")
    doc.text.addElement(h)
    
    if lycee_data.get('adresse_postale'):
        p = P(stylename="Normal")
        span = Span(stylename="Bold")
        span.addText("Adresse : ")
        p.addElement(span)
        p.addText(lycee_data['adresse_postale'])
        doc.text.addElement(p)
    
    if lycee_data.get('telephone'):
        p = P(stylename="Normal")
        span = Span(stylename="Bold")
        span.addText("Téléphone : ")
        p.addElement(span)
        p.addText(lycee_data['telephone'])
        doc.text.addElement(p)
    
    if lycee_data.get('adresse_mail'):
        p = P(stylename="Normal")
        span = Span(stylename="Bold")
        span.addText("Courriel : ")
        p.addElement(span)
        p.addText(lycee_data['adresse_mail'])
        doc.text.addElement(p)
    
    if lycee_data.get('site_web'):
        p = P(stylename="Normal")
        span = Span(stylename="Bold")
        span.addText("Site web : ")
        p.addElement(span)
        p.addText(lycee_data['site_web'])
        doc.text.addElement(p)
    
    # === DIPLÔMES PRÉPARÉS ===
    if lycee_data.get('diplomes'):
        h = H(outlinelevel=3, stylename="Heading3", text="Diplômes préparés")
        doc.text.addElement(h)
        
        diplomes_par_niveau = {}
        for diplome in lycee_data['diplomes']:
            niveau = diplome.get('niveau', 'Autre')
            if niveau not in diplomes_par_niveau:
                diplomes_par_niveau[niveau] = []
            diplomes_par_niveau[niveau].append(diplome['intitule'])
        
        ordre_niveaux = ['CAP', 'Bac', 'Bac+2', 'Bac+3', 'Bac+4', 'Autre']
        
        for niveau in ordre_niveaux:
            if niveau in diplomes_par_niveau:
                h = H(outlinelevel=4, stylename="Heading4", text=niveau)
                doc.text.addElement(h)
                
                for diplome in sorted(diplomes_par_niveau[niveau]):
                    p = P(stylename="Normal", text=f"• {diplome}")
                    doc.text.addElement(p)
    
    # === FORMATIONS ===
    if lycee_data.get('formations'):
        h = H(outlinelevel=3, stylename="Heading3", text="Formations")
        doc.text.addElement(h)
        
        formations = lycee_data['formations']
        
        # Après la 3e
        formations_3e = [f for f in formations 
                         if '2de' in f['intitule'] or '3ème' in f['intitule']]
        if formations_3e:
            h = H(outlinelevel=4, stylename="Heading4", text="Après la 3e")
            doc.text.addElement(h)
            for formation in sorted(formations_3e, key=lambda x: x['intitule']):
                p = P(stylename="Normal", text=f"• {formation['intitule']}")
                doc.text.addElement(p)
        
        # Cycle terminal GT
        formations_gt = [f for f in formations 
                         if ('1re' in f['intitule'] or 'Terminale' in f['intitule']) 
                         and 'pro' not in f['intitule'].lower()]
        if formations_gt:
            h = H(outlinelevel=4, stylename="Heading4", text="Cycle terminal GT")
            doc.text.addElement(h)
            for formation in sorted(formations_gt, key=lambda x: x['intitule']):
                p = P(stylename="Normal", text=f"• {formation['intitule']}")
                doc.text.addElement(p)
        
        # Cycle terminal pro
        formations_pro = [f for f in formations 
                          if 'Bac pro' in f['intitule']]
        if formations_pro:
            h = H(outlinelevel=4, stylename="Heading4", text="Cycle terminal pro")
            doc.text.addElement(h)
            for formation in sorted(formations_pro, key=lambda x: x['intitule']):
                p = P(stylename="Normal", text=f"• {formation['intitule']}")
                doc.text.addElement(p)
        
        # CAP
        formations_cap = [f for f in formations 
                          if 'CAP' in f['intitule']]
        if formations_cap:
            h = H(outlinelevel=4, stylename="Heading4", text="CAP")
            doc.text.addElement(h)
            for formation in sorted(formations_cap, key=lambda x: x['intitule']):
                p = P(stylename="Normal", text=f"• {formation['intitule']}")
                doc.text.addElement(p)
        
        # Enseignement supérieur (Heading 4 sous Formations)
        formations_sup = [f for f in formations 
                          if any(x in f['intitule'] for x in ['BTS', 'CPGE', 'DCG'])]
        if formations_sup:
            h = H(outlinelevel=4, stylename="Heading4", text="Enseignement supérieur")
            doc.text.addElement(h)
            
            # BTS
            formations_bts = [f for f in formations_sup if 'BTS' in f['intitule']]
            if formations_bts:
                p = P(stylename="Normal")
                span = Span(stylename="Bold")
                span.addText("BTS")
                p.addElement(span)
                doc.text.addElement(p)
                
                bts_set = set()
                for f in formations_bts:
                    bts_name = f['intitule'].replace(' - 1re année', '').replace(' - 2e année', '')
                    bts_set.add(bts_name)
                
                for bts in sorted(bts_set):
                    p = P(stylename="Normal", text=f"• {bts}")
                    doc.text.addElement(p)
            
            # CPGE
            formations_cpge = [f for f in formations_sup if 'CPGE' in f['intitule']]
            if formations_cpge:
                p = P(stylename="Normal")
                span = Span(stylename="Bold")
                span.addText("CPGE")
                p.addElement(span)
                doc.text.addElement(p)
                
                for formation in sorted(formations_cpge, key=lambda x: x['intitule']):
                    p = P(stylename="Normal", text=f"• {formation['intitule']}")
                    doc.text.addElement(p)
            
            # DCG
            formations_dcg = [f for f in formations_sup if 'DCG' in f['intitule']]
            if formations_dcg:
                p = P(stylename="Normal")
                span = Span(stylename="Bold")
                span.addText("DCG")
                p.addElement(span)
                doc.text.addElement(p)
                
                for formation in sorted(formations_dcg, key=lambda x: x['intitule']):
                    p = P(stylename="Normal", text=f"• {formation['intitule']}")
                    doc.text.addElement(p)
    
    # === PARCOURS / SECTIONS ===
    if lycee_data.get('dispositifs'):
        h = H(outlinelevel=3, stylename="Heading3", text="Parcours / sections")
        doc.text.addElement(h)
        
        for dispositif in sorted(lycee_data['dispositifs'], key=lambda x: x['nom']):
            info = dispositif.get('information_complementaire', '')
            text = f"• {dispositif['nom']}"
            if info:
                text += f" — {info}"
            p = P(stylename="Normal", text=text)
            doc.text.addElement(p)

def get_lycees_data():
    """Récupère les données de tous les lycées depuis la base"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
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
        
        cursor.execute('''
            SELECT d.intitule, d.niveau
            FROM diplomes d
            JOIN diplomes_par_lycee dpl ON d.code = dpl.code_diplome
            WHERE dpl.code_lycee = ?
            ORDER BY d.intitule
        ''', (lycee['code'],))
        lycee['diplomes'] = [dict(r) for r in cursor.fetchall()]
        
        cursor.execute('''
            SELECT f.intitule
            FROM formations f
            JOIN formations_par_lycee fpl ON f.code = fpl.code_formation
            WHERE fpl.code_lycee = ?
        ''', (lycee['code'],))
        lycee['formations'] = [dict(r) for r in cursor.fetchall()]
        
        cursor.execute('''
            SELECT d.nom, dpl.information_complementaire
            FROM dispositifs d
            JOIN dispositifs_par_lycee dpl ON d.code = dpl.code_dispositif
            WHERE dpl.code_lycee = ?
        ''', (lycee['code'],))
        lycee['dispositifs'] = [dict(r) for r in cursor.fetchall()]
        
        lycees.append(lycee)
    
    conn.close()
    return lycees

def generate_guide():
    """Génère le guide complet d'orientation"""
    print("="*70)
    print("GÉNÉRATION DU GUIDE D'ORIENTATION v4.0")
    print("="*70)
    print()
    print("Nouvelles fonctionnalités v4.0 :")
    print("  • Table des matières automatique en page 2")
    print("  • Suppression des mentions de durée")
    print("  • 'Formations jusqu'au Bac' → 'Formations'")
    print("  • Restructuration : Cycle terminal GT/Pro, CAP, Sup")
    print("  • Enseignement supérieur rattaché à Formations (H4)")
    print()
    
    doc = create_document_with_styles()
    
    print("📄 Création de la page de garde...")
    add_cover_page(doc)
    
    print("📋 Insertion de la table des matières...")
    add_table_of_contents(doc)
    
    print("📊 Récupération des données...")
    lycees = get_lycees_data()
    print(f"✓ {len(lycees)} lycées trouvés")
    print()
    
    # Sections
    sections = [
        ("Lycées généraux et technologiques publics de Rennes", 
         lambda l: l['localisation'] == 'Rennes' and l['statut'] == 'public' and l['type'] == 'GT'),
        ("Lycées professionnels et polyvalents publics de Rennes",
         lambda l: l['localisation'] == 'Rennes' and l['statut'] == 'public' and l['type'] in ['LP', 'Polyvalent']),
        ("Lycées privés de Rennes",
         lambda l: l['localisation'] == 'Rennes' and l['statut'] == 'privé'),
        ("Lycées publics et privés des alentours de Rennes",
         lambda l: l['localisation'] != 'Rennes')
    ]
    
    for i, (titre, filtre) in enumerate(sections, 1):
        print(f"📚 Section {i}: {titre}")
        h = H(outlinelevel=1, stylename="Heading1", text=titre)
        doc.text.addElement(h)
        
        count = 0
        for lycee in lycees:
            if filtre(lycee):
                print(f"  ✓ {lycee['nom']}")
                add_lycee_fiche(doc, lycee)
                count += 1
        print(f"  → {count} lycées ajoutés")
        print()
    
    print(f"💾 Enregistrement : {OUTPUT_FILE}")
    doc.save(OUTPUT_FILE)
    
    print()
    print("="*70)
    print("✅ DOCUMENT GÉNÉRÉ AVEC SUCCÈS !")
    print("="*70)
    print()
    print(f"📄 Fichier : {OUTPUT_FILE}")
    print(f"📊 Lycées : {len(lycees)}")
    print()
    print("📋 Structure :")
    print("   H1 → Grandes sections")
    print("   H2 → Nom du lycée")
    print("   H3 → Contacts, Diplômes, Formations, Parcours")
    print("   H4 → Après 3e, Cycle GT/Pro, CAP, Sup")
    print()
    print("✨ Table des matières automatique insérée en page 2 !")

if __name__ == "__main__":
    generate_guide()
