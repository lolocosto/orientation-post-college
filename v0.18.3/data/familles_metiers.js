/**
 * Familles de métiers du Bac Professionnel
 * Source: https://www.onisep.fr/formation/apres-la-3-la-voie-professionnelle/les-diplomes-de-la-voie-pro/le-bac-professionnel/les-familles-de-metiers
 */

const FAMILLES_METIERS_BAC_PRO = {
    "Métiers de la construction durable, du bâtiment et des travaux publics": {
        "2nde_commune": "2nde professionnelle Métiers de la construction durable, du bâtiment et des travaux publics",
        "bacs_pro": [
            "Technicien du bâtiment : organisation et réalisation du gros œuvre",
            "Interventions sur le patrimoine bâti option A : maçonnerie",
            "Interventions sur le patrimoine bâti option B : charpente",
            "Travaux publics",
            "Aménagement et finition du bâtiment"
        ]
    },
    "Métiers de la gestion administrative, du transport et de la logistique": {
        "2nde_commune": "2nde professionnelle Métiers de la gestion administrative, du transport et de la logistique",
        "bacs_pro": [
            "Assistance à la gestion des organisations et de leurs activités",
            "Logistique",
            "Organisation de transport de marchandises"
        ]
    },
    "Métiers de la relation client": {
        "2nde_commune": "2nde professionnelle Métiers de la relation client",
        "bacs_pro": [
            "Métiers du commerce et de la vente option A : animation et gestion de l'espace commercial",
            "Métiers du commerce et de la vente option B : prospection clientèle et valorisation de l'offre commerciale",
            "Métiers de l'accueil"
        ]
    },
    "Métiers des industries graphiques et de la communication": {
        "2nde_commune": "2nde professionnelle Métiers des industries graphiques et de la communication",
        "bacs_pro": [
            "Façonnage de produits imprimés, routage",
            "Réalisation de produits imprimés et plurimédia option A : productions graphiques",
            "Réalisation de produits imprimés et plurimédia option B : productions imprimées"
        ]
    },
    "Métiers des transitions numérique et énergétique": {
        "2nde_commune": "2nde professionnelle Métiers des transitions numérique et énergétique",
        "bacs_pro": [
            "Métiers de l'électricité et de ses environnements connectés (MELEC)",
            "Installateur en chauffage, climatisation et énergies renouvelables (ICCER)",
            "Maintenance et efficacité énergétique",
            "Cybersécurité, informatique et réseaux, électronique (CIEL) option A : sûreté et sécurité des infrastructures, de l'habitat et du tertiaire (2SIHT)",
            "Cybersécurité, informatique et réseaux, électronique (CIEL) option B : électronique et réseaux"
        ]
    },
    "Métiers de la réalisation de produits mécaniques": {
        "2nde_commune": "2nde professionnelle Métiers de la réalisation de produits mécaniques",
        "bacs_pro": [
            "Technicien en réalisation de produits mécaniques option A : réalisation et suivi de productions",
            "Technicien en réalisation de produits mécaniques option B : réalisation et maintenance des outillages"
        ]
    },
    "Métiers du pilotage et de la maintenance d'installations automatisées": {
        "2nde_commune": "2nde professionnelle Métiers du pilotage et de la maintenance d'installations automatisées",
        "bacs_pro": [
            "Maintenance des systèmes de production connectés (MSPC)",
            "Pilote de ligne de production (PLP)"
        ]
    },
    "Métiers de l'aéronautique": {
        "2nde_commune": "2nde professionnelle Métiers de l'aéronautique",
        "bacs_pro": [
            "Aéronautique option structure",
            "Aéronautique option systèmes",
            "Aéronautique option avionique",
            "Aviation générale"
        ]
    },
    "Métiers de l'agencement, de la menuiserie et de l'ameublement": {
        "2nde_commune": "2nde professionnelle Métiers de l'agencement, de la menuiserie et de l'ameublement",
        "bacs_pro": [
            "Étude et réalisation d'agencement",
            "Technicien constructeur bois",
            "Technicien menuisier-agenceur",
            "Technicien de fabrication bois et matériaux associés"
        ]
    },
    "Métiers de l'alimentation": {
        "2nde_commune": "2nde professionnelle Métiers de l'alimentation",
        "bacs_pro": [
            "Boucher-charcutier-traiteur",
            "Boulanger-pâtissier",
            "Poissonnier-écailler-traiteur"
        ]
    },
    "Métiers de la beauté et du bien-être": {
        "2nde_commune": "2nde professionnelle Métiers de la beauté et du bien-être",
        "bacs_pro": [
            "Esthétique cosmétique parfumerie",
            "Métiers de la coiffure"
        ]
    },
    "Métiers de l'hôtellerie-restauration": {
        "2nde_commune": "2nde professionnelle Métiers de l'hôtellerie-restauration",
        "bacs_pro": [
            "Cuisine",
            "Commercialisation et services en restauration"
        ]
    }
};

// Export pour utilisation dans le code
if (typeof window !== 'undefined') {
    window.FAMILLES_METIERS_BAC_PRO = FAMILLES_METIERS_BAC_PRO;
}
