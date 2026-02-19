// ═══════════════════════════════════════════════════════════════════
// PARCOURS BAC PRO COMPLETS - V0.18.5
// Source: https://www.onisep.fr (31 janvier 2026)
// Total: 115+ Bac Pro (Éducation Nationale + Agricoles)
// ═══════════════════════════════════════════════════════════════════

const PARCOURS_BAC_PRO = [
    
    // Métiers de l'aéronautique (4 Bac Pro)
    {
        famille: "Métiers de l'aéronautique",
        seconde: "2nde pro Métiers de l'aéronautique",
        parcours: [
            {
                premiere: "1ère pro Aéronautique option avionique",
                terminale: "Term pro Aéronautique option avionique",
                diplome: "Bac pro Aéronautique option avionique",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Aéronautique option systèmes",
                terminale: "Term pro Aéronautique option systèmes",
                diplome: "Bac pro Aéronautique option systèmes",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Aéronautique option structure",
                terminale: "Term pro Aéronautique option structure",
                diplome: "Bac pro Aéronautique option structure",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Aviation générale",
                terminale: "Term pro Aviation générale",
                diplome: "Bac pro Aviation générale",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },
    
    // Métiers de l'agencement, de la menuiserie et de l'ameublement (3 Bac Pro)
    {
        famille: "Métiers de l'agencement, de la menuiserie et de l'ameublement",
        seconde: "2nde pro Métiers de l'agencement, de la menuiserie et de l'ameublement",
        parcours: [
            {
                premiere: "1ère pro Étude et réalisation d'agencement",
                terminale: "Term pro Étude et réalisation d'agencement",
                diplome: "Bac pro Étude et réalisation d'agencement",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Technicien de fabrication bois et matériaux associés",
                terminale: "Term pro Technicien de fabrication bois et matériaux associés",
                diplome: "Bac pro Technicien de fabrication bois et matériaux associés",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Technicien menuisier agenceur",
                terminale: "Term pro Technicien menuisier agenceur",
                diplome: "Bac pro Technicien menuisier agenceur",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },
    
    // Métiers de l'alimentation (3 Bac Pro)
    {
        famille: "Métiers de l'alimentation",
        seconde: "2nde pro Métiers de l'alimentation",
        parcours: [
            {
                premiere: "1ère pro Boucher-charcutier-traiteur",
                terminale: "Term pro Boucher-charcutier-traiteur",
                diplome: "Bac pro Boucher-charcutier-traiteur",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Boulanger-pâtissier",
                terminale: "Term pro Boulanger-pâtissier",
                diplome: "Bac pro Boulanger-pâtissier",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Poissonnier-écailler-traiteur",
                terminale: "Term pro Poissonnier-écailler-traiteur",
                diplome: "Bac pro Poissonnier-écailler-traiteur",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },
    
    // Métiers de l'hôtellerie et restauration (2 Bac Pro)
    {
        famille: "Métiers de l'hôtellerie et restauration",
        seconde: "2nde pro Métiers de l'hôtellerie-restauration",
        parcours: [
            {
                premiere: "1ère pro Commercialisation et services en restauration",
                terminale: "Term pro Commercialisation et services en restauration",
                diplome: "Bac pro Commercialisation et services en restauration",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Cuisine",
                terminale: "Term pro Cuisine",
                diplome: "Bac pro Cuisine",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },
    
    // Métiers de la beauté et du bien-être (2 Bac Pro)
    {
        famille: "Métiers de la beauté et du bien-être",
        seconde: "2nde pro Métiers de la beauté et du bien-être",
        parcours: [
            {
                premiere: "1ère pro Esthétique cosmétique parfumerie",
                terminale: "Term pro Esthétique cosmétique parfumerie",
                diplome: "Bac pro Esthétique cosmétique parfumerie",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Métiers de la coiffure",
                terminale: "Term pro Métiers de la coiffure",
                diplome: "Bac pro Métiers de la coiffure",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },
    
    // Métiers de la construction durable, du bâtiment et des travaux publics (8 Bac Pro)
    {
        famille: "Métiers de la construction durable, du bâtiment et des travaux publics",
        seconde: "2nde pro Métiers de la construction durable, du bâtiment et des travaux publics",
        parcours: [
            {
                premiere: "1ère pro Aménagement et finition du bâtiment",
                terminale: "Term pro Aménagement et finition du bâtiment",
                diplome: "Bac pro Aménagement et finition du bâtiment",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Interventions sur le patrimoine bâti option A maçonnerie",
                terminale: "Term pro Interventions sur le patrimoine bâti option A maçonnerie",
                diplome: "Bac pro Interventions sur le patrimoine bâti option A maçonnerie",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Interventions sur le patrimoine bâti option B charpente",
                terminale: "Term pro Interventions sur le patrimoine bâti option B charpente",
                diplome: "Bac pro Interventions sur le patrimoine bâti option B charpente",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Interventions sur le patrimoine bâti option C couverture",
                terminale: "Term pro Interventions sur le patrimoine bâti option C couverture",
                diplome: "Bac pro Interventions sur le patrimoine bâti option C couverture",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Menuiserie aluminium-verre",
                terminale: "Term pro Menuiserie aluminium-verre",
                diplome: "Bac pro Menuiserie aluminium-verre",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Ouvrages du bâtiment : métallerie",
                terminale: "Term pro Ouvrages du bâtiment : métallerie",
                diplome: "Bac pro Ouvrages du bâtiment : métallerie",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Technicien du bâtiment : organisation et réalisation du gros œuvre",
                terminale: "Term pro Technicien du bâtiment : organisation et réalisation du gros œuvre",
                diplome: "Bac pro Technicien du bâtiment : organisation et réalisation du gros œuvre",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Travaux publics",
                terminale: "Term pro Travaux publics",
                diplome: "Bac pro Travaux publics",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },
    
    // Métiers de la gestion administrative, du transport et de la logistique (3 Bac Pro)
    {
        famille: "Métiers de la gestion administrative, du transport et de la logistique",
        seconde: "2nde pro Métiers de la gestion administrative, du transport et de la logistique",
        parcours: [
            {
                premiere: "1ère pro Assistance à la gestion des organisations et de leurs activités",
                terminale: "Term pro Assistance à la gestion des organisations et de leurs activités",
                diplome: "Bac pro Assistance à la gestion des organisations et de leurs activités",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Logistique",
                terminale: "Term pro Logistique",
                diplome: "Bac pro Logistique",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Organisation de transport de marchandises",
                terminale: "Term pro Organisation de transport de marchandises",
                diplome: "Bac pro Organisation de transport de marchandises",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },
    
    // Métiers de la maintenance des matériels et des véhicules (6 Bac Pro)
    {
        famille: "Métiers de la maintenance des matériels et des véhicules",
        seconde: "2nde pro Métiers de la maintenance des matériels et des véhicules",
        parcours: [
            {
                premiere: "1ère pro Maintenance des matériels option A matériels agricoles",
                terminale: "Term pro Maintenance des matériels option A matériels agricoles",
                diplome: "Bac pro Maintenance des matériels option A matériels agricoles",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Maintenance des matériels option B matériels de construction et manutention",
                terminale: "Term pro Maintenance des matériels option B matériels de construction et manutention",
                diplome: "Bac pro Maintenance des matériels option B matériels de construction et manutention",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Maintenance des matériels option C matériels d'espaces verts",
                terminale: "Term pro Maintenance des matériels option C matériels d'espaces verts",
                diplome: "Bac pro Maintenance des matériels option C matériels d'espaces verts",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Maintenance des véhicules option A véhicules légers",
                terminale: "Term pro Maintenance des véhicules option A véhicules légers",
                diplome: "Bac pro Maintenance des véhicules option A véhicules légers",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Maintenance des véhicules option B véhicules de transport routier",
                terminale: "Term pro Maintenance des véhicules option B véhicules de transport routier",
                diplome: "Bac pro Maintenance des véhicules option B véhicules de transport routier",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Maintenance des véhicules option C motocycles",
                terminale: "Term pro Maintenance des véhicules option C motocycles",
                diplome: "Bac pro Maintenance des véhicules option C motocycles",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },
    
    // Métiers de la mer (5 Bac Pro)
    {
        famille: "Métiers de la mer",
        seconde: "2nde pro Métiers de la mer",
        parcours: [
            {
                premiere: "1ère pro Conduite et gestion des entreprises maritimes commerce/plaisance professionnelle option voile",
                terminale: "Term pro Conduite et gestion des entreprises maritimes commerce/plaisance professionnelle option voile",
                diplome: "Bac pro Conduite et gestion des entreprises maritimes commerce/plaisance professionnelle option voile",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Conduite et gestion des entreprises maritimes commerce/plaisance professionnelle option yacht",
                terminale: "Term pro Conduite et gestion des entreprises maritimes commerce/plaisance professionnelle option yacht",
                diplome: "Bac pro Conduite et gestion des entreprises maritimes commerce/plaisance professionnelle option yacht",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Conduite et gestion des entreprises maritimes pêche",
                terminale: "Term pro Conduite et gestion des entreprises maritimes pêche",
                diplome: "Bac pro Conduite et gestion des entreprises maritimes pêche",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Électromécanicien de marine",
                terminale: "Term pro Électromécanicien de marine",
                diplome: "Bac pro Électromécanicien de marine",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Polyvalent navigant pont/machine",
                terminale: "Term pro Polyvalent navigant pont/machine",
                diplome: "Bac pro Polyvalent navigant pont/machine",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },
    
    // Métiers de la réalisation d'ensembles mécaniques et industriels (7 Bac Pro)
    {
        famille: "Métiers de la réalisation d'ensembles mécaniques et industriels",
        seconde: "2nde pro Métiers de la réalisation d'ensembles mécaniques et industriels",
        parcours: [
            {
                premiere: "1ère pro Fonderie",
                terminale: "Term pro Fonderie",
                diplome: "Bac pro Fonderie",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Microtechniques",
                terminale: "Term pro Microtechniques",
                diplome: "Bac pro Microtechniques",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Technicien en chaudronnerie industrielle",
                terminale: "Term pro Technicien en chaudronnerie industrielle",
                diplome: "Bac pro Technicien en chaudronnerie industrielle",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Technicien en réalisation de produits mécaniques option réalisation et maintenance des outillages",
                terminale: "Term pro Technicien en réalisation de produits mécaniques option réalisation et maintenance des outillages",
                diplome: "Bac pro Technicien en réalisation de produits mécaniques option réalisation et maintenance des outillages",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Technicien en réalisation de produits mécaniques option réalisation et suivi de productions",
                terminale: "Term pro Technicien en réalisation de produits mécaniques option réalisation et suivi de productions",
                diplome: "Bac pro Technicien en réalisation de produits mécaniques option réalisation et suivi de productions",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Technicien modeleur",
                terminale: "Term pro Technicien modeleur",
                diplome: "Bac pro Technicien modeleur",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Traitements des matériaux",
                terminale: "Term pro Traitements des matériaux",
                diplome: "Bac pro Traitements des matériaux",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },
    
    // Métiers de la relation client (3 Bac Pro)
    {
        famille: "Métiers de la relation client",
        seconde: "2nde pro Métiers de la relation client",
        parcours: [
            {
                premiere: "1ère pro Métiers de l'accueil",
                terminale: "Term pro Métiers de l'accueil",
                diplome: "Bac pro Métiers de l'accueil",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Métiers du commerce et de la vente option A animation et gestion de l'espace commercial",
                terminale: "Term pro Métiers du commerce et de la vente option A animation et gestion de l'espace commercial",
                diplome: "Bac pro Métiers du commerce et de la vente option A animation et gestion de l'espace commercial",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Métiers du commerce et de la vente option B prospection clientèle et valorisation de l'offre commerciale",
                terminale: "Term pro Métiers du commerce et de la vente option B prospection clientèle et valorisation de l'offre commerciale",
                diplome: "Bac pro Métiers du commerce et de la vente option B prospection clientèle et valorisation de l'offre commerciale",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },
    
    // Métiers des études et de la modélisation numérique du bâtiment (3 Bac Pro)
    {
        famille: "Métiers des études et de la modélisation numérique du bâtiment",
        seconde: "2nde pro Métiers des études et de la modélisation numérique du bâtiment",
        parcours: [
            {
                premiere: "1ère pro Géomètre",
                terminale: "Term pro Géomètre",
                diplome: "Bac pro Géomètre",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Technicien d'études du bâtiment option A études et économie",
                terminale: "Term pro Technicien d'études du bâtiment option A études et économie",
                diplome: "Bac pro Technicien d'études du bâtiment option A études et économie",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Technicien d'études du bâtiment option B assistant en architecture",
                terminale: "Term pro Technicien d'études du bâtiment option B assistant en architecture",
                diplome: "Bac pro Technicien d'études du bâtiment option B assistant en architecture",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },
    
    // Métiers des industries graphiques et de la communication (3 Bac Pro)
    {
        famille: "Métiers des industries graphiques et de la communication",
        seconde: "2nde pro Métiers des industries graphiques et de la communication",
        parcours: [
            {
                premiere: "1ère pro Façonnage de produits imprimés, routage",
                terminale: "Term pro Façonnage de produits imprimés, routage",
                diplome: "Bac pro Façonnage de produits imprimés, routage",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Réalisation de produits imprimés et plurimédia option A productions graphiques",
                terminale: "Term pro Réalisation de produits imprimés et plurimédia option A productions graphiques",
                diplome: "Bac pro Réalisation de produits imprimés et plurimédia option A productions graphiques",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Réalisation de produits imprimés et plurimédia option B productions imprimées",
                terminale: "Term pro Réalisation de produits imprimés et plurimédia option B productions imprimées",
                diplome: "Bac pro Réalisation de produits imprimés et plurimédia option B productions imprimées",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },
    
    // Métiers des transitions numérique et énergétique (5 Bac Pro)
    {
        famille: "Métiers des transitions numérique et énergétique",
        seconde: "2nde pro Métiers des transitions numérique et énergétique",
        parcours: [
            {
                premiere: "1ère pro Cybersécurité, informatique et réseaux, électronique",
                terminale: "Term pro Cybersécurité, informatique et réseaux, électronique",
                diplome: "Bac pro Cybersécurité, informatique et réseaux, électronique",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Installateur en chauffage, climatisation et énergies renouvelables",
                terminale: "Term pro Installateur en chauffage, climatisation et énergies renouvelables",
                diplome: "Bac pro Installateur en chauffage, climatisation et énergies renouvelables",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Maintenance et efficacité énergétique",
                terminale: "Term pro Maintenance et efficacité énergétique",
                diplome: "Bac pro Maintenance et efficacité énergétique",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Métiers de l'électricité et de ses environnements connectés",
                terminale: "Term pro Métiers de l'électricité et de ses environnements connectés",
                diplome: "Bac pro Métiers de l'électricité et de ses environnements connectés",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Métiers du froid et des énergies renouvelables",
                terminale: "Term pro Métiers du froid et des énergies renouvelables",
                diplome: "Bac pro Métiers du froid et des énergies renouvelables",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },
    
    // Métiers du pilotage et de la maintenance d'installations automatisées (4 Bac Pro)
    {
        famille: "Métiers du pilotage et de la maintenance d'installations automatisées",
        seconde: "2nde pro Métiers du pilotage et de la maintenance d'installations automatisées",
        parcours: [
            {
                premiere: "1ère pro Maintenance des systèmes de production connectés",
                terminale: "Term pro Maintenance des systèmes de production connectés",
                diplome: "Bac pro Maintenance des systèmes de production connectés",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Pilote de ligne de production",
                terminale: "Term pro Pilote de ligne de production",
                diplome: "Bac pro Pilote de ligne de production",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Procédés de la chimie, de l'eau et des papiers-cartons",
                terminale: "Term pro Procédés de la chimie, de l'eau et des papiers-cartons",
                diplome: "Bac pro Procédés de la chimie, de l'eau et des papiers-cartons",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Technicien de scierie",
                terminale: "Term pro Technicien de scierie",
                diplome: "Bac pro Technicien de scierie",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    // ═══════════════════════════════════════════════════════════
    // ÉDUCATION NATIONALE - HORS FAMILLES DE MÉTIERS (37 Bac Pro)
    // ═══════════════════════════════════════════════════════════

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Accompagnement, soins et services à la personne",
        parcours: [
            {
                premiere: "1ère pro Accompagnement, soins et services à la personne",
                terminale: "Term pro Accompagnement, soins et services à la personne",
                diplome: "Bac pro Accompagnement, soins et services à la personne",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Animation-Enfance et personnes âgées",
        parcours: [
            {
                premiere: "1ère pro Animation-Enfance et personnes âgées",
                terminale: "Term pro Animation-Enfance et personnes âgées",
                diplome: "Bac pro Animation-Enfance et personnes âgées",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Artisanat et métiers d'art - facteur d'orgues option organier",
        parcours: [
            {
                premiere: "1ère pro Artisanat et métiers d'art - facteur d'orgues option organier",
                terminale: "Term pro Artisanat et métiers d'art - facteur d'orgues option organier",
                diplome: "Bac pro Artisanat et métiers d'art - facteur d'orgues option organier",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Artisanat et métiers d'art - facteur d'orgues option tuyautier",
        parcours: [
            {
                premiere: "1ère pro Artisanat et métiers d'art - facteur d'orgues option tuyautier",
                terminale: "Term pro Artisanat et métiers d'art - facteur d'orgues option tuyautier",
                diplome: "Bac pro Artisanat et métiers d'art - facteur d'orgues option tuyautier",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Artisanat et métiers d'art option communication visuelle pluri-media",
        parcours: [
            {
                premiere: "1ère pro Artisanat et métiers d'art option communication visuelle pluri-media",
                terminale: "Term pro Artisanat et métiers d'art option communication visuelle pluri-media",
                diplome: "Bac pro Artisanat et métiers d'art option communication visuelle pluri-media",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Artisanat et métiers d'art option marchandisage visuel",
        parcours: [
            {
                premiere: "1ère pro Artisanat et métiers d'art option marchandisage visuel",
                terminale: "Term pro Artisanat et métiers d'art option marchandisage visuel",
                diplome: "Bac pro Artisanat et métiers d'art option marchandisage visuel",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Artisanat et métiers d'art option métiers de l'enseigne et de la signalétique",
        parcours: [
            {
                premiere: "1ère pro Artisanat et métiers d'art option métiers de l'enseigne et de la signalétique",
                terminale: "Term pro Artisanat et métiers d'art option métiers de l'enseigne et de la signalétique",
                diplome: "Bac pro Artisanat et métiers d'art option métiers de l'enseigne et de la signalétique",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Artisanat et métiers d'art option tapisserie d'ameublement",
        parcours: [
            {
                premiere: "1ère pro Artisanat et métiers d'art option tapisserie d'ameublement",
                terminale: "Term pro Artisanat et métiers d'art option tapisserie d'ameublement",
                diplome: "Bac pro Artisanat et métiers d'art option tapisserie d'ameublement",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Artisanat et métiers d'art option verrerie scientifique et technique",
        parcours: [
            {
                premiere: "1ère pro Artisanat et métiers d'art option verrerie scientifique et technique",
                terminale: "Term pro Artisanat et métiers d'art option verrerie scientifique et technique",
                diplome: "Bac pro Artisanat et métiers d'art option verrerie scientifique et technique",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Carrossier peintre automobile",
        parcours: [
            {
                premiere: "1ère pro Carrossier peintre automobile",
                terminale: "Term pro Carrossier peintre automobile",
                diplome: "Bac pro Carrossier peintre automobile",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Construction et aménagement de véhicules",
        parcours: [
            {
                premiere: "1ère pro Construction et aménagement de véhicules",
                terminale: "Term pro Construction et aménagement de véhicules",
                diplome: "Bac pro Construction et aménagement de véhicules",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Cultures marines",
        parcours: [
            {
                premiere: "1ère pro Cultures marines",
                terminale: "Term pro Cultures marines",
                diplome: "Bac pro Cultures marines",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Hygiène, propreté, stérilisation",
        parcours: [
            {
                premiere: "1ère pro Hygiène, propreté, stérilisation",
                terminale: "Term pro Hygiène, propreté, stérilisation",
                diplome: "Bac pro Hygiène, propreté, stérilisation",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Maintenance environnementale et propreté des espaces urbains",
        parcours: [
            {
                premiere: "1ère pro Maintenance environnementale et propreté des espaces urbains",
                terminale: "Term pro Maintenance environnementale et propreté des espaces urbains",
                diplome: "Bac pro Maintenance environnementale et propreté des espaces urbains",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Maintenance nautique",
        parcours: [
            {
                premiere: "1ère pro Maintenance nautique",
                terminale: "Term pro Maintenance nautique",
                diplome: "Bac pro Maintenance nautique",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Métiers de l'entretien des textiles option A blanchisserie",
        parcours: [
            {
                premiere: "1ère pro Métiers de l'entretien des textiles option A blanchisserie",
                terminale: "Term pro Métiers de l'entretien des textiles option A blanchisserie",
                diplome: "Bac pro Métiers de l'entretien des textiles option A blanchisserie",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Métiers de l'entretien des textiles option B pressing",
        parcours: [
            {
                premiere: "1ère pro Métiers de l'entretien des textiles option B pressing",
                terminale: "Term pro Métiers de l'entretien des textiles option B pressing",
                diplome: "Bac pro Métiers de l'entretien des textiles option B pressing",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Métiers de la couture et de la confection",
        parcours: [
            {
                premiere: "1ère pro Métiers de la couture et de la confection",
                terminale: "Term pro Métiers de la couture et de la confection",
                diplome: "Bac pro Métiers de la couture et de la confection",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Métiers de la sécurité",
        parcours: [
            {
                premiere: "1ère pro Métiers de la sécurité",
                terminale: "Term pro Métiers de la sécurité",
                diplome: "Bac pro Métiers de la sécurité",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Métiers du cuir option chaussures",
        parcours: [
            {
                premiere: "1ère pro Métiers du cuir option chaussures",
                terminale: "Term pro Métiers du cuir option chaussures",
                diplome: "Bac pro Métiers du cuir option chaussures",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Métiers du cuir option maroquinerie",
        parcours: [
            {
                premiere: "1ère pro Métiers du cuir option maroquinerie",
                terminale: "Term pro Métiers du cuir option maroquinerie",
                diplome: "Bac pro Métiers du cuir option maroquinerie",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Métiers du cuir option sellerie garnissage",
        parcours: [
            {
                premiere: "1ère pro Métiers du cuir option sellerie garnissage",
                terminale: "Term pro Métiers du cuir option sellerie garnissage",
                diplome: "Bac pro Métiers du cuir option sellerie garnissage",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Métiers et arts de la pierre",
        parcours: [
            {
                premiere: "1ère pro Métiers et arts de la pierre",
                terminale: "Term pro Métiers et arts de la pierre",
                diplome: "Bac pro Métiers et arts de la pierre",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Modélisation et prototypage 3D",
        parcours: [
            {
                premiere: "1ère pro Modélisation et prototypage 3D",
                terminale: "Term pro Modélisation et prototypage 3D",
                diplome: "Bac pro Modélisation et prototypage 3D",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Optique lunetterie",
        parcours: [
            {
                premiere: "1ère pro Optique lunetterie",
                terminale: "Term pro Optique lunetterie",
                diplome: "Bac pro Optique lunetterie",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Optique photonique : technologies de la lumière",
        parcours: [
            {
                premiere: "1ère pro Optique photonique : technologies de la lumière",
                terminale: "Term pro Optique photonique : technologies de la lumière",
                diplome: "Bac pro Optique photonique : technologies de la lumière",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Perruquier posticheur",
        parcours: [
            {
                premiere: "1ère pro Perruquier posticheur",
                terminale: "Term pro Perruquier posticheur",
                diplome: "Bac pro Perruquier posticheur",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Photographie",
        parcours: [
            {
                premiere: "1ère pro Photographie",
                terminale: "Term pro Photographie",
                diplome: "Bac pro Photographie",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Plastiques et composites",
        parcours: [
            {
                premiere: "1ère pro Plastiques et composites",
                terminale: "Term pro Plastiques et composites",
                diplome: "Bac pro Plastiques et composites",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Production en industries pharmaceutiques, alimentaires et cosmétiques",
        parcours: [
            {
                premiere: "1ère pro Production en industries pharmaceutiques, alimentaires et cosmétiques",
                terminale: "Term pro Production en industries pharmaceutiques, alimentaires et cosmétiques",
                diplome: "Bac pro Production en industries pharmaceutiques, alimentaires et cosmétiques",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Technicien constructeur bois",
        parcours: [
            {
                premiere: "1ère pro Technicien constructeur bois",
                terminale: "Term pro Technicien constructeur bois",
                diplome: "Bac pro Technicien constructeur bois",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Technicien en appareillage orthopédique",
        parcours: [
            {
                premiere: "1ère pro Technicien en appareillage orthopédique",
                terminale: "Term pro Technicien en appareillage orthopédique",
                diplome: "Bac pro Technicien en appareillage orthopédique",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Technicien en prothèse dentaire",
        parcours: [
            {
                premiere: "1ère pro Technicien en prothèse dentaire",
                terminale: "Term pro Technicien en prothèse dentaire",
                diplome: "Bac pro Technicien en prothèse dentaire",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Technicien en transports et distribution des gaz",
        parcours: [
            {
                premiere: "1ère pro Technicien en transports et distribution des gaz",
                terminale: "Term pro Technicien en transports et distribution des gaz",
                diplome: "Bac pro Technicien en transports et distribution des gaz",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Techniques d'interventions sur installations nucléaires",
        parcours: [
            {
                premiere: "1ère pro Techniques d'interventions sur installations nucléaires",
                terminale: "Term pro Techniques d'interventions sur installations nucléaires",
                diplome: "Bac pro Techniques d'interventions sur installations nucléaires",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Transport fluvial",
        parcours: [
            {
                premiere: "1ère pro Transport fluvial",
                terminale: "Term pro Transport fluvial",
                diplome: "Bac pro Transport fluvial",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro spécialisé",
        seconde: "2nde pro Transports par câbles et remontées mécaniques",
        parcours: [
            {
                premiere: "1ère pro Transports par câbles et remontées mécaniques",
                terminale: "Term pro Transports par câbles et remontées mécaniques",
                diplome: "Bac pro Transports par câbles et remontées mécaniques",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    // ═══════════════════════════════════════════════════════════
    // BAC PRO AGRICOLES - FAMILLES DE MÉTIERS (4 familles)
    // ═══════════════════════════════════════════════════════════

    // Agricole - Métiers de l'alimentation-bio-industrie-laboratoire (2 Bac Pro)
    {
        famille: "Agricole - Métiers de l'alimentation-bio-industrie-laboratoire",
        seconde: "2nde pro Alimentation, bio-industries et laboratoire",
        parcours: [
            {
                premiere: "1ère pro Laboratoire contrôle qualité",
                terminale: "Term pro Laboratoire contrôle qualité",
                diplome: "Bac pro Laboratoire contrôle qualité",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Production en industries pharmaceutiques, alimentaires et cosmétiques",
                terminale: "Term pro Production en industries pharmaceutiques, alimentaires et cosmétiques",
                diplome: "Bac pro Production en industries pharmaceutiques, alimentaires et cosmétiques",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    // Agricole - Métiers de la nature - jardin - paysage - forêt (3 Bac Pro)
    {
        famille: "Agricole - Métiers de la nature - jardin - paysage - forêt",
        seconde: "2nde pro Nature-jardin-paysage-forêt",
        parcours: [
            {
                premiere: "1ère pro Aménagements paysagers",
                terminale: "Term pro Aménagements paysagers",
                diplome: "Bac pro Aménagements paysagers",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Forêt",
                terminale: "Term pro Forêt",
                diplome: "Bac pro Forêt",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Gestion des milieux naturels et de la faune",
                terminale: "Term pro Gestion des milieux naturels et de la faune",
                diplome: "Bac pro Gestion des milieux naturels et de la faune",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    // Agricole - Métiers des productions (7 Bac Pro)
    {
        famille: "Agricole - Métiers des productions",
        seconde: "2nde pro Productions",
        parcours: [
            {
                premiere: "1ère pro Agroéquipement",
                terminale: "Term pro Agroéquipement",
                diplome: "Bac pro Agroéquipement",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Conduite d'activité d'élevage et d'hébergement du secteur canin-félin",
                terminale: "Term pro Conduite d'activité d'élevage et d'hébergement du secteur canin-félin",
                diplome: "Bac pro Conduite d'activité d'élevage et d'hébergement du secteur canin-félin",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Conduite de productions aquacoles",
                terminale: "Term pro Conduite de productions aquacoles",
                diplome: "Bac pro Conduite de productions aquacoles",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Conduite de productions horticoles",
                terminale: "Term pro Conduite de productions horticoles",
                diplome: "Bac pro Conduite de productions horticoles",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Conduite et gestion de l'entreprise agricole",
                terminale: "Term pro Conduite et gestion de l'entreprise agricole",
                diplome: "Bac pro Conduite et gestion de l'entreprise agricole",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Conduite et gestion de l'entreprise hippique",
                terminale: "Term pro Conduite et gestion de l'entreprise hippique",
                diplome: "Bac pro Conduite et gestion de l'entreprise hippique",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Conduite et gestion de l'entreprise vitivinicole",
                terminale: "Term pro Conduite et gestion de l'entreprise vitivinicole",
                diplome: "Bac pro Conduite et gestion de l'entreprise vitivinicole",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    // Agricole - Métiers du conseil vente (3 Bac Pro)
    {
        famille: "Agricole - Métiers du conseil vente",
        seconde: "2nde pro Conseil-vente",
        parcours: [
            {
                premiere: "1ère pro Technicien conseil vente en alimentation",
                terminale: "Term pro Technicien conseil vente en alimentation",
                diplome: "Bac pro Technicien conseil vente en alimentation",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Technicien conseil vente en animalerie",
                terminale: "Term pro Technicien conseil vente en animalerie",
                diplome: "Bac pro Technicien conseil vente en animalerie",
                id_af_onisep: "FOR.XXXX"
            },
            {
                premiere: "1ère pro Technicien conseil vente univers jardinerie",
                terminale: "Term pro Technicien conseil vente univers jardinerie",
                diplome: "Bac pro Technicien conseil vente univers jardinerie",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    // ═══════════════════════════════════════════════════════════
    // BAC PRO AGRICOLES - HORS FAMILLES DE MÉTIERS (2 Bac Pro)
    // ═══════════════════════════════════════════════════════════

    {
        famille: "HORS FAMILLE - Bac Pro agricole",
        seconde: "2nde pro Services aux personnes et animation dans les territoires",
        parcours: [
            {
                premiere: "1ère pro Services aux personnes et animation dans les territoires",
                terminale: "Term pro Services aux personnes et animation dans les territoires",
                diplome: "Bac pro Services aux personnes et animation dans les territoires",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },

    {
        famille: "HORS FAMILLE - Bac Pro agricole",
        seconde: "2nde pro Technicien en expérimentation animale",
        parcours: [
            {
                premiere: "1ère pro Technicien en expérimentation animale",
                terminale: "Term pro Technicien en expérimentation animale",
                diplome: "Bac pro Technicien en expérimentation animale",
                id_af_onisep: "FOR.XXXX"
            }
        ]
    },
];

// Export pour utilisation dans l'application
if (typeof window !== 'undefined') {
    window.PARCOURS_BAC_PRO = PARCOURS_BAC_PRO;
}
