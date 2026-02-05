/**
 * Données des académies françaises avec leurs départements
 * Source: Ministère de l'Éducation Nationale
 */

const ACADEMIES = {
    aix_marseille: {
        nom: "Aix-Marseille",
        departements: ["04", "05", "13", "84"]
    },
    amiens: {
        nom: "Amiens",
        departements: ["02", "60", "80"]
    },
    besancon: {
        nom: "Besançon",
        departements: ["25", "39", "70", "90"]
    },
    bordeaux: {
        nom: "Bordeaux",
        departements: ["24", "33", "40", "47", "64"]
    },
    clermont_ferrand: {
        nom: "Clermont-Ferrand",
        departements: ["03", "15", "43", "63"]
    },
    corse: {
        nom: "Corse",
        departements: ["2A", "2B"] // Corse-du-Sud et Haute-Corse
    },
    creteil: {
        nom: "Créteil",
        departements: ["77", "93", "94"]
    },
    dijon: {
        nom: "Dijon",
        departements: ["21", "58", "71", "89"]
    },
    grenoble: {
        nom: "Grenoble",
        departements: ["07", "26", "38", "73", "74"]
    },
    guadeloupe: {
        nom: "Guadeloupe",
        departements: ["971"]
    },
    guyane: {
        nom: "Guyane",
        departements: ["973"]
    },
    lille: {
        nom: "Lille",
        departements: ["59", "62"]
    },
    limoges: {
        nom: "Limoges",
        departements: ["19", "23", "87"]
    },
    lyon: {
        nom: "Lyon",
        departements: ["01", "42", "69"]
    },
    martinique: {
        nom: "Martinique",
        departements: ["972"]
    },
    mayotte: {
        nom: "Mayotte",
        departements: ["976"]
    },
    montpellier: {
        nom: "Montpellier",
        departements: ["11", "30", "34", "48", "66"]
    },
    nancy_metz: {
        nom: "Nancy-Metz",
        departements: ["54", "55", "57", "88"]
    },
    nantes: {
        nom: "Nantes",
        departements: ["44", "49", "53", "72", "85"]
    },
    nice: {
        nom: "Nice",
        departements: ["06", "83"]
    },
    normandie: {
        nom: "Normandie",
        departements: ["14", "27", "50", "61", "76"]
    },
    orleans_tours: {
        nom: "Orléans-Tours",
        departements: ["18", "28", "36", "37", "41", "45"]
    },
    paris: {
        nom: "Paris",
        departements: ["75"]
    },
    poitiers: {
        nom: "Poitiers",
        departements: ["16", "17", "79", "86"]
    },
    reims: {
        nom: "Reims",
        departements: ["08", "10", "51", "52"]
    },
    rennes: {
        nom: "Rennes",
        departements: ["22", "29", "35", "56"]
    },
    reunion: {
        nom: "La Réunion",
        departements: ["974"]
    },
    strasbourg: {
        nom: "Strasbourg",
        departements: ["67", "68"]
    },
    toulouse: {
        nom: "Toulouse",
        departements: ["09", "12", "31", "32", "46", "65", "81", "82"]
    },
    versailles: {
        nom: "Versailles",
        departements: ["78", "91", "92", "95"]
    }
};

/**
 * Obtient les départements d'une académie
 */
function getDepartementsAcademie(code) {
    return ACADEMIES[code]?.departements || [];
}

/**
 * Obtient le nom d'une académie
 */
function getNomAcademie(code) {
    return ACADEMIES[code]?.nom || code;
}

/**
 * Extrait le département d'un code postal
 * Gère les cas particuliers : Corse (20), DOM (971-976)
 */
function getDepartementFromCodePostal(codePostal) {
    if (!codePostal) return null;
    
    const cp = String(codePostal).padStart(5, '0');
    
    // DOM-TOM (971-976)
    if (cp.startsWith('97') || cp.startsWith('98')) {
        return cp.substring(0, 3);
    }
    
    // Corse (20)
    if (cp.startsWith('20')) {
        // On ne peut pas distinguer 2A et 2B uniquement avec le code postal
        // On retourne '20' et on cherchera dans les deux départements
        return '20';
    }
    
    // Métropole (01-95)
    return cp.substring(0, 2);
}

/**
 * Obtient le nom du département à partir de son code
 */
function getNomDepartement(code) {
    const noms = {
        '01': 'Ain',
        '02': 'Aisne',
        '03': 'Allier',
        '04': 'Alpes-de-Haute-Provence',
        '05': 'Hautes-Alpes',
        '06': 'Alpes-Maritimes',
        '07': 'Ardèche',
        '08': 'Ardennes',
        '09': 'Ariège',
        '10': 'Aube',
        '11': 'Aude',
        '12': 'Aveyron',
        '13': 'Bouches-du-Rhône',
        '14': 'Calvados',
        '15': 'Cantal',
        '16': 'Charente',
        '17': 'Charente-Maritime',
        '18': 'Cher',
        '19': 'Corrèze',
        '20': 'Corse',
        '2A': 'Corse-du-Sud',
        '2B': 'Haute-Corse',
        '21': 'Côte-d\'Or',
        '22': 'Côtes-d\'Armor',
        '23': 'Creuse',
        '24': 'Dordogne',
        '25': 'Doubs',
        '26': 'Drôme',
        '27': 'Eure',
        '28': 'Eure-et-Loir',
        '29': 'Finistère',
        '30': 'Gard',
        '31': 'Haute-Garonne',
        '32': 'Gers',
        '33': 'Gironde',
        '34': 'Hérault',
        '35': 'Ille-et-Vilaine',
        '36': 'Indre',
        '37': 'Indre-et-Loire',
        '38': 'Isère',
        '39': 'Jura',
        '40': 'Landes',
        '41': 'Loir-et-Cher',
        '42': 'Loire',
        '43': 'Haute-Loire',
        '44': 'Loire-Atlantique',
        '45': 'Loiret',
        '46': 'Lot',
        '47': 'Lot-et-Garonne',
        '48': 'Lozère',
        '49': 'Maine-et-Loire',
        '50': 'Manche',
        '51': 'Marne',
        '52': 'Haute-Marne',
        '53': 'Mayenne',
        '54': 'Meurthe-et-Moselle',
        '55': 'Meuse',
        '56': 'Morbihan',
        '57': 'Moselle',
        '58': 'Nièvre',
        '59': 'Nord',
        '60': 'Oise',
        '61': 'Orne',
        '62': 'Pas-de-Calais',
        '63': 'Puy-de-Dôme',
        '64': 'Pyrénées-Atlantiques',
        '65': 'Hautes-Pyrénées',
        '66': 'Pyrénées-Orientales',
        '67': 'Bas-Rhin',
        '68': 'Haut-Rhin',
        '69': 'Rhône',
        '70': 'Haute-Saône',
        '71': 'Saône-et-Loire',
        '72': 'Sarthe',
        '73': 'Savoie',
        '74': 'Haute-Savoie',
        '75': 'Paris',
        '76': 'Seine-Maritime',
        '77': 'Seine-et-Marne',
        '78': 'Yvelines',
        '79': 'Deux-Sèvres',
        '80': 'Somme',
        '81': 'Tarn',
        '82': 'Tarn-et-Garonne',
        '83': 'Var',
        '84': 'Vaucluse',
        '85': 'Vendée',
        '86': 'Vienne',
        '87': 'Haute-Vienne',
        '88': 'Vosges',
        '89': 'Yonne',
        '90': 'Territoire de Belfort',
        '91': 'Essonne',
        '92': 'Hauts-de-Seine',
        '93': 'Seine-Saint-Denis',
        '94': 'Val-de-Marne',
        '95': 'Val-d\'Oise',
        '971': 'Guadeloupe',
        '972': 'Martinique',
        '973': 'Guyane',
        '974': 'La Réunion',
        '976': 'Mayotte'
    };
    return noms[code] || null;
}

// Rendre disponible globalement
if (typeof window !== 'undefined') {
    window.ACADEMIES = ACADEMIES;
    window.getDepartementsAcademie = getDepartementsAcademie;
    window.getNomAcademie = getNomAcademie;
    window.getDepartementFromCodePostal = getDepartementFromCodePostal;
    window.getNomDepartement = getNomDepartement;
}
