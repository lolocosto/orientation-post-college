/************************************************
 * Fichier : academies_data.js
 * Description : Données des académies, 
 *   des départements, et fonctions associées
 * Auteur : Laurent COSTE
 * Date : 2026-02-01
 ************************************************/

/** Liste des codes et noms de départements **/
const DEPARTEMENTS = [
    {code:'01',nom:'Ain'}, 
    {code:'02',nom:'Aisne'}, 
    {code:'03',nom:'Allier'}, 
    {code:'04',nom:'Alpes-de-Haute-Provence'}, 
    {code:'05',nom:'Hautes-Alpes'}, 
    {code:'06',nom:'Alpes-Maritimes'}, 
    {code:'07',nom:'Ardèche'}, 
    {code:'08',nom:'Ardennes'}, 
    {code:'09',nom:'Ariège'},
    {code:'10',nom:'Aube'},
    {code:'11',nom:'Aude'},
    {code:'12',nom:'Aveyron'},
    {code:'13',nom:'Bouches-du-Rhône'},
    {code:'14',nom:'Calvados'},
    {code:'15',nom:'Cantal'},
    {code:'16',nom:'Charente'},
    {code:'17',nom:'Charente-Maritime'},
    {code:'18',nom:'Cher'},
    {code:'19',nom:'Corrèze'},
    {code:'2A',nom:'Corse-du-Sud'},
    {code:'2B',nom:'Haute-Corse'},
    {code:'21',nom:'Côte-d\'Or'},
    {code:'22',nom:'Côtes-d\'Armor'},
    {code:'23',nom:'Creuse'},
    {code:'24',nom:'Dordogne'},
    {code:'25',nom:'Doubs'},
    {code:'26',nom:'Drôme'},
    {code:'27',nom:'Eure'},
    {code:'28',nom:"Eure-et-Loir"},
    {code:'29',nom:'Finistère'},
    {code:'30',nom:'Gard'},
    {code:'31',nom:'Haute-Garonne'},
    {code:'32',nom:'Gers'},
    {code:'33',nom:'Gironde'},
    {code:'34',nom:'Hérault'},
    {code:'35',nom:'Ille-et-Vilaine'},
    {code:'36',nom:'Indre'},
    {code:'37',nom:'Indre-et-Loire'},
    {code:'38',nom:'Isère'},
    {code:'39',nom:'Jura'},
    {code:'40',nom:'Landes'},
    {code:'41',nom:'Loir-et-Cher'},
    {code:'42',nom:'Loire'},
    {code:'43',nom:"Haute-Loire"},
    {code:'44',nom:"Loire-Atlantique"},
    {code:'45',nom:"Loiret"},
    {code:'46',nom:'Lot'},
    {code:'47',nom:'Lot-et-Garonne'},
    {code:'48',nom:'Lozère'},
    {code:'49',nom:'Maine-et-Loire'},
    {code:'50',nom:'Manche'},
    {code:'51',nom:'Marne'},
    {code:'52',nom:"Haute-Marne"},
    {code:'53',nom:'Mayenne'},
    {code:'54',nom:'Meurthe-et-Moselle'},
    {code:'55',nom:'Meuse'},
    {code:'56',nom:'Morbihan'},
    {code:'57',nom:'Moselle'},
    {code:'58',nom:'Nièvre'},
    {code:'59',nom:'Nord'},
    {code:'60',nom:'Oise'},
    {code:'61',nom:'Orne'},
    {code:'62',nom:'Pas-de-Calais'},
    {code:'63',nom:'Puy-de-Dôme'},
    {code:'64',nom:'Pyrénées-Atlantiques'},
    {code:'65',nom:'Hautes-Pyrénées'},
    {code:'66',nom:'Pyrénées-Orientales'},
    {code:'67',nom:'Bas-Rhin'},
    {code:'68',nom:'Haut-Rhin'},
    {code:'69',nom:'Rhône'},
    {code:'70',nom:'Haute-Saône'},
    {code:'71',nom:'Saône-et-Loire'},
    {code:'72',nom:'Sarthe'},
    {code:'73',nom:'Savoie'},
    {code:'74',nom:'Haute-Savoie'},
    {code:'75',nom:'Paris'},
    {code:'76',nom:'Seine-Maritime'},
    {code:'77',nom:'Seine-et-Marne'},
    {code:'78',nom:'Yvelines'},
    {code:'79',nom:'Deux-Sèvres'},
    {code:'80',nom:'Somme'},
    {code:'81',nom:'Tarn'},
    {code:'82',nom:'Tarn-et-Garonne'},
    {code:'83',nom:'Var'},
    {code:'84',nom:'Vaucluse'},
    {code:'85',nom:'Vendée'},
    {code:'86',nom:'Vienne'},
    {code:'87',nom:'Haute-Vienne'},
    {code:'88',nom:'Vosges'},
    {code:'89',nom:'Yonne'},
    {code:'90',nom:'Territoire de Belfort'},
    {code:'91',nom:'Essonne'},
    {code:'92',nom:'Hauts-de-Seine'},
    {code:'93',nom:'Seine-Saint-Denis'},
    {code:'94',nom:"Val-de-Marne"},
    {code:'95',nom:"Val-d'Oise"},
    {code:'971',nom:'Guadeloupe'},
    {code:'972',nom:'Martinique'},
    {code:'973',nom:'Guyane'},
    {code:'974',nom:'La Réunion'},
    {code:'975',nom:'Saint-Pierre-et-Miquelon'},
    {code:'976',nom:'Mayotte'},
    {code:'977',nom:'Saint-Barthélemy'},
    {code:'978',nom:'Saint-Martin'},
    {code:'986',nom:'Wallis-et-Futuna'},
    {code:'987',nom:'Polynésie française'},
    {code:'988',nom:'Nouvelle-Calédonie'}
];

/**
 * Liste des académies avec leurs départements
 * Source: Ministère de l'Éducation Nationale
 */
const ACADEMIES = [
    {code:'02', nom: "Aix-Marseille",       departements: ["04", "05", "13", "84"]},
    {code:'20', nom: "Amiens",              departements: ["02", "60", "80"]},
    {code:'03', nom: "Besançon",            departements: ["25", "39", "70", "90"]},
    {code:'04', nom: "Bordeaux",            departements: ["24", "33", "40", "47", "64"]},
    {code:'06', nom: "Clermont-Ferrand",    departements: ["03", "15", "43", "63"]},
    {code:'50', nom: "Collectivités d'Outre Mer", departements: ["975", "977", "978", "986", "987", "988"]},
    {code:'27', nom: "Corse",               departements: ["2A", "2B"] },
    {code:'24', nom: "Créteil",             departements: ["77", "93", "94"]},
    {code:'07', nom: "Dijon",               departements: ["21", "58", "71", "89"]},
    {code:'08', nom: "Grenoble",            departements: ["07", "26", "38", "73", "74"]},
    {code:'32', nom: "Guadeloupe",          departements: ["971"]},
    {code:'28', nom: "La Réunion",          departements: ["974"]},
    {code:'33', nom: "Guyane",              departements: ["973"]},
    {code:'09', nom: "Lille",               departements: ["59", "62"]},
    {code:'22', nom: "Limoges",             departements: ["19", "23", "87"]},
    {code:'10', nom: "Lyon",                departements: ["01", "42", "69"]},
    {code:'31', nom: "Martinique",          departements: ["972"]},
    {code:'43', nom: "Mayotte",             departements: ["976"]},
    {code:'11', nom: "Montpellier",         departements: ["11", "30", "34", "48", "66"]},
    {code:'12', nom: "Nancy-Metz",          departements: ["54", "55", "57", "88"]},
    {code:'17', nom: "Nantes",              departements: ["44", "49", "53", "72", "85"]},
    {code:'23', nom: "Nice",                departements: ["06", "83"]},
    {code:'70', nom: "Normandie",           departements: ["14", "27", "50", "61", "76"]},
    {code:'18', nom: "Orléans-Tours",       departements: ["18", "28", "36", "37", "41", "45"]},
    {code:'01', nom: "Paris",               departements: ["75"]} ,
    {code:'13', nom: "Poitiers",            departements: ["16", "17", "79", "86"]},
    {code:'19', nom: "Reims",               departements: ["08", "10", "51", "52"]},
    {code:'14', nom: "Rennes",              departements: ["22", "29", "35", "56"]},
    {code:'15', nom: "Strasbourg",          departements: ["67", "68"]},
    {code:'16', nom: "Toulouse",            departements: ["09", "12", "31", "32", "46", "65", "81", "82"]},
    {code:'25', nom: "Versailles",          departements: ["78", "91", "92", "95"]}
];

/** Obtient les départements d'une académie à partir de son code */
function getDepartementsAcademie(code) { 
    return ACADEMIES.find(a => a.code === code)?.departements || [];
}

/** Obtient le nom d'une académie à partir de son code */
function getNomAcademie(code) { 
    return ACADEMIES.find(a => a.code === code)?.nom || null;
}

/** Obtient le nom du département à partir de son code */
function getNomDepartement(code) {
    return DEPARTEMENTS.find(d => d.code === code)?.nom || null;
}

/** Charge les options d'un select HTML avec les départements **/
function loadDepartementsSelectOptions(selectElementId) {
    const select = document.getElementById(selectElementId);
    if (!select) return;

    // Vider les options existantes
    select.innerHTML = '';

    // Ajouter les options des départements
    for (const dept of DEPARTEMENTS) {
            const option = document.createElement('option');
            option.value = dept.code;
            option.textContent = `${dept.code} - ${dept.nom}`;
            select.appendChild(option);
    }
}

/** Charge les options d'un select HTML avec les académies */
function loadAcademiesSelectOptions(selectElementId) {
    const select = document.getElementById(selectElementId);
    if (!select) return;

    // Vider les options existantes
    select.innerHTML = '';

    // Ajouter les options des académies
    for (const acad of ACADEMIES) {
        const option = document.createElement('option');
        option.value = acad.code;
        option.textContent = `${acad.nom}`;
        select.appendChild(option);
    }
}

// Rendre disponible globalement
if (typeof window !== 'undefined') {
    window.ACADEMIES = ACADEMIES;
    window.getDepartementsAcademie = getDepartementsAcademie;
    window.getNomAcademie = getNomAcademie;
    window.getNomDepartement = getNomDepartement;
    window.loadDepartementsSelectOptions = loadDepartementsSelectOptions;
    window.loadAcademiesSelectOptions = loadAcademiesSelectOptions;
}
