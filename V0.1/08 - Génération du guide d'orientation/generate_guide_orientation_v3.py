#!/usr/bin/env python3
"""
Générateur de document d'orientation : Lycées de Rennes
Version 3.0 - Corrections et améliorations

Changements v3.0 :
- Suppression de toutes les lignes vides
- "Après la 3e" et "Cycle terminal" en Heading 4
- Section "Diplômes préparés" ajoutée (par niveau)
- Séparation claire Diplômes vs Formations
- Formations triées par ordre alphabétique
- Pas de lignes vides entre les éléments
"""

import sqlite3
import os
from odf.opendocument import OpenDocumentText
from odf.style import Style, TextProperties, ParagraphProperties
from odf.text import P, H, Span, SoftPageBreak
from odf.draw import Frame, Image
from datetime import datetime

DB_PATH = './lycees_database.db'
OUTPUT_FILE = f'Guide_Orientation_Lycees_{datetime.now().strftime("%Y%m%d")}_v3.odt'
LOGO_PATH = './logo_page_garde.png'

def create_document_with_styles():
    """Crée le document ODT avec tous les styles nécessaires"""
    doc = OpenDocumentText()
    
    # Style Titre principal (Heading 1)
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
    
    # Style Heading 2 - Nom du lycée
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
    
    # Style Heading 3 - Sections principales
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
    
    # Style Heading 4 - Sous-sections (Après la 3e, Cycle terminal, etc.)
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
    
    # Style pour le texte normal
    normalstyle = Style(name="Normal", family="paragraph")
    normalstyle.addElement(ParagraphProperties(
        marginbottom="0cm"
    ))
    normalstyle.addElement(TextProperties(
        fontsize="11pt"
    ))
    doc.styles.addElement(normalstyle)
    
    # Style pour le titre de la page de garde
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
    
    # Style pour le sous-titre
    subtitlestyle = Style(name="Subtitle", family="paragraph")
    subtitlestyle.addElement(ParagraphProperties(
        textalign="center",
        marginbottom="0cm"
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
    
    # Ajouter l'image si elle existe
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
        
        # Créer un style pour centrer l'image
        centerstyle = Style(name="CenterAlign", family="paragraph")
        centerstyle.addElement(ParagraphProperties(textalign="center"))
        doc.automaticstyles.addElement(centerstyle)
        
        p = P(stylename="CenterAlign")
        p.addElement(photoframe)
        doc.text.addElement(p)
    
    # Titre principal (3 lignes)
    p = P(stylename="Title")
    p.addText("Orientation en 3ème")
    doc.text.addElement(p)
    
    p = P(stylename="Title")
    p.addText("Lycées GT et lycées pro")
    doc.text.addElement(p)
    
    p = P(stylename="Title")
    p.addText("de Rennes et alentours")
    doc.text.addElement(p)
    
    # Date de génération
    p = P(stylename="Subtitle")
    p.addText(f"Document généré le {datetime.now().strftime('%d/%m/%Y')}")
    doc.text.addElement(p)
    
    # Saut de page
    doc.text.addElement(SoftPageBreak())

def add_lycee_fiche(doc, lycee_data):
    """Ajoute une fiche complète pour un lycée"""
    
    # Nom du lycée (Heading 2)
    h = H(outlinelevel=2, stylename="Heading2", text=lycee_data['nom'])
    doc.text.addElement(h)
    
    # Effectifs (si disponible)
    if lycee_data.get('effectifs'):
        p = P(stylename="Normal")
        span = Span(stylename="Bold")
        span.addText(f"≈ {lycee_data['effectifs']} élèves")
        p.addElement(span)
        doc.text.addElement(p)
    
    # === SECTION CONTACTS (Heading 3) ===
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
    
    # === SECTION DIPLÔMES PRÉPARÉS (Heading 3) ===
    if lycee_data.get('diplomes'):
        h = H(outlinelevel=3, stylename="Heading3", text="Diplômes préparés")
        doc.text.addElement(h)
        
        # Grouper les diplômes par niveau
        diplomes_par_niveau = {}
        for diplome in lycee_data['diplomes']:
            niveau = diplome.get('niveau', 'Autre')
            if niveau not in diplomes_par_niveau:
                diplomes_par_niveau[niveau] = []
            diplomes_par_niveau[niveau].append(diplome['intitule'])
        
        # Ordre des niveaux
        ordre_niveaux = ['CAP', 'Bac', 'Bac+2', 'Bac+3', 'Bac+4', 'Autre']
        
        for niveau in ordre_niveaux:
            if niveau in diplomes_par_niveau:
                # Sous-section par niveau (Heading 4)
                h = H(outlinelevel=4, stylename="Heading4", text=niveau)
                doc.text.addElement(h)
                
                # Liste des diplômes triée
                for diplome in sorted(diplomes_par_niveau[niveau]):
                    p = P(stylename="Normal", text=f"• {diplome}")
                    doc.text.addElement(p)
    
    # === SECTION FORMATIONS JUSQU'AU BAC (Heading 3) ===
    formations_secondaire = [f for f in lycee_data.get('formations', []) 
                             if not any(x in f['intitule'] for x in ['BTS', 'CPGE', 'DCG'])]
    
    if formations_secondaire:
        h = H(outlinelevel=3, stylename="Heading3", text="Formations jusqu'au Bac")
        doc.text.addElement(h)
        
        # Après la 3e (Heading 4)
        formations_3e = [f for f in formations_secondaire 
                         if '2de' in f['intitule'] or '3ème' in f['intitule']]
        if formations_3e:
            h = H(outlinelevel=4, stylename="Heading4", text="Après la 3e")
            doc.text.addElement(h)
            
            for formation in sorted(formations_3e, key=lambda x: x['intitule']):
                p = P(stylename="Normal", text=f"• {formation['intitule']} — {formation['duree']}")
                doc.text.addElement(p)
        
        # Cycle terminal (Heading 4)
        formations_terminal = [f for f in formations_secondaire 
                               if '1re' in f['intitule'] or 'Terminale' in f['intitule']]
        if formations_terminal:
            h = H(outlinelevel=4, stylename="Heading4", text="Cycle terminal")
            doc.text.addElement(h)
            
            for formation in sorted(formations_terminal, key=lambda x: x['intitule']):
                p = P(stylename="Normal", text=f"• {formation['intitule']} — {formation['duree']}")
                doc.text.addElement(p)
        
        # Bac professionnel (Heading 4)
        formations_bac_pro = [f for f in formations_secondaire 
                              if 'Bac pro' in f['intitule']]
        if formations_bac_pro:
            h = H(outlinelevel=4, stylename="Heading4", text="Bac professionnel")
            doc.text.addElement(h)
            
            for formation in sorted(formations_bac_pro, key=lambda x: x['intitule']):
                p = P(stylename="Normal", text=f"• {formation['intitule']} — {formation['duree']}")
                doc.text.addElement(p)
        
        # CAP (Heading 4)
        formations_cap = [f for f in formations_secondaire 
                          if 'CAP' in f['intitule']]
        if formations_cap:
            h = H(outlinelevel=4, stylename="Heading4", text="CAP")
            doc.text.addElement(h)
            
            for formation in sorted(formations_cap, key=lambda x: x['intitule']):
                p = P(stylename="Normal", text=f"• {formation['intitule']} — {formation['duree']}")
                doc.text.addElement(p)
    
    # === SECTION PARCOURS / SECTIONS (Heading 3) ===
    if lycee_data.get('dispositifs'):
        h = H(outlinelevel=3, stylename="Heading3", text="Parcours / sections")
        doc.text.addElement(h)
        
        for dispositif in sorted(lycee_data['dispositifs'], key=lambda x: x['nom']):
            info = dispositif.get('information_complementaire', '')
            text = f"• {dispositif['nom']}"
            if info:
                text += f" — {info}"
            text += f" — {dispositif['duree']}"
            p = P(stylename="Normal", text=text)
            doc.text.addElement(p)
    
    # === SECTION ENSEIGNEMENT SUPÉRIEUR (Heading 3) ===
    formations_sup = [f for f in lycee_data.get('formations', []) 
                      if any(x in f['intitule'] for x in ['BTS', 'CPGE', 'DCG'])]
    
    if formations_sup:
        h = H(outlinelevel=3, stylename="Heading3", text="Enseignement supérieur")
        doc.text.addElement(h)
        
        # BTS (Heading 4)
        formations_bts = [f for f in formations_sup if 'BTS' in f['intitule']]
        if formations_bts:
            h = H(outlinelevel=4, stylename="Heading4", text="BTS — 2 ans")
            doc.text.addElement(h)
            
            # Dédupliquer et trier
            bts_set = set()
            for f in formations_bts:
                bts_name = f['intitule'].replace(' - 1re année', '').replace(' - 2e année', '')
                bts_set.add(bts_name)
            
            for bts in sorted(bts_set):
                p = P(stylename="Normal", text=f"• {bts}")
                doc.text.addElement(p)
        
        # CPGE (Heading 4)
        formations_cpge = [f for f in formations_sup if 'CPGE' in f['intitule']]
        if formations_cpge:
            h = H(outlinelevel=4, stylename="Heading4", text="CPGE")
            doc.text.addElement(h)
            
            for formation in sorted(formations_cpge, key=lambda x: x['intitule']):
                p = P(stylename="Normal", text=f"• {formation['intitule']}")
                doc.text.addElement(p)
        
        # DCG (Heading 4)
        formations_dcg = [f for f in formations_sup if 'DCG' in f['intitule']]
        if formations_dcg:
            h = H(outlinelevel=4, stylename="Heading4", text="DCG")
            doc.text.addElement(h)
            
            for formation in sorted(formations_dcg, key=lambda x: x['intitule']):
                p = P(stylename="Normal", text=f"• {formation['intitule']}")
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
        ''', (lycee['code'],))
        lycee['formations'] = [dict(r) for r in cursor.fetchall()]
        
        # Récupérer les dispositifs
        cursor.execute('''
            SELECT d.nom, d.duree, dpl.information_complementaire
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
    print("GÉNÉRATION DU GUIDE D'ORIENTATION v3.0")
    print("="*70)
    print()
    print("Nouvelles fonctionnalités v3.0 :")
    print("  • Suppression de toutes les lignes vides")
    print("  • 'Après la 3e' et 'Cycle terminal' en Heading 4")
    print("  • Section 'Diplômes préparés' ajoutée (par niveau)")
    print("  • Séparation claire Diplômes vs Formations")
    print("  • Formations triées par ordre alphabétique")
    print()
    
    doc = create_document_with_styles()
    
    print("📄 Création de la page de garde...")
    add_cover_page(doc)
    
    print("📊 Récupération des données...")
    lycees = get_lycees_data()
    print(f"✓ {len(lycees)} lycées trouvés")
    print()
    
    # Section 1: Lycées GT publics
    print("📚 Section 1: Lycées GT publics de Rennes")
    h = H(outlinelevel=1, stylename="Heading1", 
          text="Lycées généraux et technologiques publics de Rennes")
    doc.text.addElement(h)
    
    count = 0
    for lycee in lycees:
        if (lycee['localisation'] == 'Rennes' and 
            lycee['statut'] == 'public' and 
            lycee['type'] == 'GT'):
            print(f"  ✓ {lycee['nom']}")
            add_lycee_fiche(doc, lycee)
            count += 1
    print(f"  → {count} lycées ajoutés")
    print()
    
    # Section 2: Lycées LP et polyvalents publics
    print("📚 Section 2: Lycées LP et polyvalents publics de Rennes")
    h = H(outlinelevel=1, stylename="Heading1", 
          text="Lycées professionnels et polyvalents publics de Rennes")
    doc.text.addElement(h)
    
    count = 0
    for lycee in lycees:
        if (lycee['localisation'] == 'Rennes' and 
            lycee['statut'] == 'public' and 
            lycee['type'] in ['LP', 'Polyvalent']):
            print(f"  ✓ {lycee['nom']}")
            add_lycee_fiche(doc, lycee)
            count += 1
    print(f"  → {count} lycées ajoutés")
    print()
    
    # Section 3: Lycées privés
    print("📚 Section 3: Lycées privés de Rennes")
    h = H(outlinelevel=1, stylename="Heading1", 
          text="Lycées privés de Rennes")
    doc.text.addElement(h)
    
    count = 0
    for lycee in lycees:
        if lycee['localisation'] == 'Rennes' and lycee['statut'] == 'privé':
            print(f"  ✓ {lycee['nom']}")
            add_lycee_fiche(doc, lycee)
            count += 1
    print(f"  → {count} lycées ajoutés")
    print()
    
    # Section 4: Lycées des alentours
    print("📚 Section 4: Lycées des alentours de Rennes")
    h = H(outlinelevel=1, stylename="Heading1", 
          text="Lycées publics et privés des alentours de Rennes")
    doc.text.addElement(h)
    
    count = 0
    for lycee in lycees:
        if lycee['localisation'] != 'Rennes':
            print(f"  ✓ {lycee['nom']} ({lycee['localisation']})")
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
    print("📋 Structure hiérarchique :")
    print("   Heading 1 → Grandes sections")
    print("   Heading 2 → Nom du lycée")
    print("   Heading 3 → Contacts, Diplômes, Formations, Parcours, Sup")
    print("   Heading 4 → Après la 3e, Cycle terminal, CAP, BTS, etc.")
    print()
    print("⚠️  IMPORTANT : Vérifiez les dispositifs de Chateaubriand")
    print("    (La base contient plus de dispositifs que l'Onisep)")

if __name__ == "__main__":
    generate_guide()
