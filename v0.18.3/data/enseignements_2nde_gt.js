/**
 * Enseignements optionnels en 2nde Générale et Technologique
 * Source: https://www.onisep.fr/orientation/le-lycee/les-enseignements-optionnels-en-seconde
 */

const ENSEIGNEMENTS_OPTIONNELS_2NDE_GT = {
    "optionnels_generaux": {
        "titre": "Enseignements optionnels généraux (1 au choix)",
        "max": 1,
        "liste": [
            {
                "nom": "Langue vivante C (étrangère ou régionale)",
                "volume": "3h",
                "description": "Découverte d'une 3ème langue vivante"
            },
            {
                "nom": "Latin",
                "volume": "3h",
                "description": "Découverte de la langue et civilisation latines"
            },
            {
                "nom": "Grec",
                "volume": "3h",
                "description": "Découverte de la langue et civilisation grecques"
            },
            {
                "nom": "Éducation physique et sportive (EPS)",
                "volume": "3h",
                "description": "Pratique sportive approfondie"
            },
            {
                "nom": "Arts (au choix)",
                "volume": "3h",
                "options": [
                    "Arts plastiques",
                    "Cinéma-audiovisuel",
                    "Danse",
                    "Histoire des arts",
                    "Musique",
                    "Théâtre"
                ],
                "description": "Pratique et culture artistiques"
            }
        ]
    },
    "optionnels_technologiques": {
        "titre": "Enseignements optionnels technologiques (1 au choix)",
        "max": 1,
        "liste": [
            {
                "nom": "Management et gestion",
                "volume": "1h30",
                "description": "Découverte du fonctionnement des organisations et de leur environnement"
            },
            {
                "nom": "Santé et social",
                "volume": "1h30",
                "description": "Découverte des liens entre la santé et le bien-être social"
            },
            {
                "nom": "Biotechnologies",
                "volume": "1h30",
                "description": "Découverte des protocoles expérimentaux en biologie"
            },
            {
                "nom": "Sciences et laboratoire",
                "volume": "1h30",
                "description": "Pratique expérimentale en physique-chimie et SVT"
            },
            {
                "nom": "Sciences de l'ingénieur",
                "volume": "1h30",
                "description": "Découverte de l'analyse et conception de systèmes"
            },
            {
                "nom": "Création et innovation technologiques",
                "volume": "1h30",
                "description": "Découverte de la démarche de créativité appliquée à des projets"
            },
            {
                "nom": "Création et culture-design",
                "volume": "6h",
                "description": "Approche exploratoire et pratique du design"
            },
            {
                "nom": "Atelier artistique",
                "volume": "72h/an",
                "description": "Pratique artistique en partenariat avec des structures culturelles"
            }
        ]
    },
    "regles": {
        "cumul": "Possibilité de choisir 1 option générale ET 1 option technologique",
        "latin_grec": "Latin et Grec peuvent être cumulés avec un autre enseignement optionnel",
        "note": "Les enseignements optionnels sont facultatifs et permettent de découvrir de nouveaux domaines"
    }
};

// Export pour utilisation dans le code
if (typeof window !== 'undefined') {
    window.ENSEIGNEMENTS_OPTIONNELS_2NDE_GT = ENSEIGNEMENTS_OPTIONNELS_2NDE_GT;
}
