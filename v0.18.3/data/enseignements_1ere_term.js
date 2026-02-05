/**
 * Enseignements de spécialité en 1ère et Terminale - Voie Générale
 * Source: https://www.onisep.fr/formation/apres-la-3-la-voie-generale-et-technologique/qu-est-ce-que-la-voie-generale-et-technologique/la-voie-generale-en-premiere-et-terminale
 */

const ENSEIGNEMENTS_SPECIALITE_VOIE_GENERALE = {
    "premiere": {
        "tronc_commun": [
            "Français (4h)",
            "Histoire-géographie (3h)",
            "Enseignement moral et civique (0h30)",
            "Langue vivante A et B (4h30)",
            "Éducation physique et sportive (2h)",
            "Enseignement scientifique (2h)"
        ],
        "specialites": {
            "nombre": "3 au choix parmi 13",
            "volume": "4h par spécialité",
            "liste": [
                {
                    "nom": "Arts",
                    "options": ["Arts plastiques", "Cinéma-audiovisuel", "Danse", "Histoire des arts", "Musique", "Théâtre"]
                },
                {
                    "nom": "Biologie-écologie",
                    "note": "Uniquement dans les lycées agricoles"
                },
                "Éducation physique, pratiques et culture sportives",
                "Histoire-géographie, géopolitique et sciences politiques",
                "Humanités, littérature et philosophie",
                "Langues, littératures et cultures étrangères et régionales",
                "Littérature, langues et cultures de l'Antiquité",
                "Mathématiques",
                "Numérique et sciences informatiques",
                "Physique-chimie",
                "Sciences de la vie et de la Terre",
                "Sciences de l'ingénieur",
                "Sciences économiques et sociales"
            ]
        },
        "optionnel": {
            "nombre": "1 au choix (facultatif)",
            "volume": "3h",
            "liste": [
                "Langue vivante C",
                "Latin",
                "Grec",
                "Éducation physique et sportive",
                "Arts",
                "Mathématiques expertes (uniquement si spécialité Mathématiques)",
                "Mathématiques complémentaires",
                "Droit et grands enjeux du monde contemporain"
            ]
        }
    },
    "terminale": {
        "tronc_commun": [
            "Philosophie (4h)",
            "Histoire-géographie (3h)",
            "Enseignement moral et civique (0h30)",
            "Langue vivante A et B (4h)",
            "Éducation physique et sportive (2h)",
            "Enseignement scientifique (2h)"
        ],
        "specialites": {
            "nombre": "2 au choix parmi les 3 de 1ère",
            "volume": "6h par spécialité",
            "note": "Les élèves conservent 2 spécialités parmi les 3 suivies en 1ère"
        },
        "optionnel": {
            "nombre": "1 au choix (facultatif)",
            "volume": "3h",
            "liste": [
                "Langue vivante C",
                "Latin",
                "Grec",
                "Éducation physique et sportive",
                "Arts",
                "Mathématiques expertes (uniquement si spécialité Mathématiques)",
                "Mathématiques complémentaires (si pas de spécialité Mathématiques)",
                "Droit et grands enjeux du monde contemporain"
            ]
        }
    },
    "accompagnement": {
        "orientation": "54h/an d'accompagnement au choix de l'orientation",
        "personnalise": "Accompagnement personnalisé en fonction des besoins de l'élève"
    }
};

const SERIES_BAC_TECHNO = {
    "titre": "Baccalauréats technologiques",
    "series": [
        {
            "sigle": "STI2D",
            "nom": "Sciences et technologies de l'industrie et du développement durable",
            "specialites_premiere": [
                "Innovation technologique (IT)",
                "Ingénierie et développement durable (I2D)"
            ],
            "specialites_terminale": [
                "Architecture et construction",
                "Énergies et environnement",
                "Innovation technologique et éco-conception",
                "Systèmes d'information et numérique"
            ]
        },
        {
            "sigle": "STL",
            "nom": "Sciences et technologies de laboratoire",
            "specialites": [
                "Biochimie-biologie-biotechnologie",
                "Sciences physiques et chimiques en laboratoire"
            ]
        },
        {
            "sigle": "STMG",
            "nom": "Sciences et technologies du management et de la gestion",
            "specialites_terminale": [
                "Gestion et finance",
                "Mercatique (marketing)",
                "Ressources humaines et communication",
                "Systèmes d'information de gestion"
            ]
        },
        {
            "sigle": "ST2S",
            "nom": "Sciences et technologies de la santé et du social"
        },
        {
            "sigle": "STHR",
            "nom": "Sciences et technologies de l'hôtellerie et de la restauration"
        },
        {
            "sigle": "S2TMD",
            "nom": "Sciences et techniques du théâtre, de la musique et de la danse",
            "options": ["Instrument", "Danse", "Théâtre"]
        },
        {
            "sigle": "STD2A",
            "nom": "Sciences et technologies du design et des arts appliqués"
        },
        {
            "sigle": "STAV",
            "nom": "Sciences et technologies de l'agronomie et du vivant",
            "note": "Uniquement dans les lycées agricoles"
        }
    ]
};

// Export pour utilisation dans le code
if (typeof window !== 'undefined') {
    window.ENSEIGNEMENTS_SPECIALITE_VOIE_GENERALE = ENSEIGNEMENTS_SPECIALITE_VOIE_GENERALE;
    window.SERIES_BAC_TECHNO = SERIES_BAC_TECHNO;
}
