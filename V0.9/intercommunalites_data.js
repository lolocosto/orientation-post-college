/**
 * Données des intercommunalités françaises
 * Source: Wikipedia + données officielles
 */

const INTERCOMMUNALITES = {
    // MÉTROPOLES
    rennes_metropole: {
        nom: "Rennes Métropole",
        type: "métropole",
        communes: [
            "Acigné", "Bécherel", "Betton", "Bourgbarré", "Brécé",
            "Bruz", "Cesson-Sévigné", "Chantepie", "La Chapelle-Chaussée", "La Chapelle-des-Fougeretz",
            "La Chapelle-Thouarault", "Chartres-de-Bretagne", "Châteaugiron", "Chavagne", "Chevaigné",
            "Cintré", "Clayes", "Corps-Nuds", "Gévezé", "Le Rheu",
            "Laillé", "Langouët", "Langan", "L'Hermitage", "Miniac-sous-Bécherel",
            "Montgermont", "Mordelles", "Nouvoitou", "Noyal-Châtillon-sur-Seiche", "Orgères",
            "Pacé", "Parthenay-de-Bretagne", "Le Pertre", "Pont-Péan", "Rennes",
            "Romillé", "Saint-Armel", "Saint-Erblon", "Saint-Gilles", "Saint-Grégoire",
            "Saint-Jacques-de-la-Lande", "Saint-Sulpice-la-Forêt", "Thorigné-Fouillard", "Vern-sur-Seiche", "Vezin-le-Coquet"
        ]
    },
    
    lyon_metropole: {
        nom: "Métropole de Lyon",
        type: "métropole",
        communes: [
            "Albigny-sur-Saône", "Bron", "Cailloux-sur-Fontaines", "Caluire-et-Cuire", "Champagne-au-Mont-d'Or",
            "Charbonnières-les-Bains", "Charly", "Chassieu", "Collonges-au-Mont-d'Or", "Craponne",
            "Curis-au-Mont-d'Or", "Dardilly", "Décines-Charpieu", "Écully", "Feyzin",
            "Fleurieu-sur-Saône", "Fontaines-Saint-Martin", "Fontaines-sur-Saône", "Francheville", "Genay",
            "Givors", "Grigny", "Irigny", "Jonage", "La Mulatière",
            "La Tour-de-Salvagny", "Limonest", "Lissieu", "Lyon", "Marcy-l'Étoile",
            "Meyzieu", "Mions", "Montanay", "Neuville-sur-Saône", "Oullins-Pierre-Bénite",
            "Pierre-Bénite", "Poleymieux-au-Mont-d'Or", "Quincieux", "Rillieux-la-Pape", "Rochetaillée-sur-Saône",
            "Sainte-Foy-lès-Lyon", "Saint-Cyr-au-Mont-d'Or", "Saint-Didier-au-Mont-d'Or", "Saint-Fons", "Saint-Genis-Laval",
            "Saint-Genis-les-Ollières", "Saint-Germain-au-Mont-d'Or", "Saint-Laurent-de-Mure", "Saint-Priest", "Sathonay-Camp",
            "Sathonay-Village", "Solaize", "Tassin-la-Demi-Lune", "Ternay", "Vaulx-en-Velin",
            "Vénissieux", "Vernaison", "Villeurbanne", "Villeurbanne", "Vourles"
        ]
    },
    
    marseille_metropole: {
        nom: "Métropole Aix-Marseille-Provence",
        type: "métropole",
        communes: [
            // Territoire Marseille-Provence (18)
            "Marseille", "Allauch", "Carnoux-en-Provence", "Carry-le-Rouet", "Cassis",
            "Ceyreste", "Châteauneuf-les-Martigues", "Ensuès-la-Redonne", "Gémenos", "Gignac-la-Nerthe",
            "La Ciotat", "La Penne-sur-Huveaune", "Le Rove", "Marignane", "Marseille",
            "Plan-de-Cuques", "Roquefort-la-Bédoule", "Sausset-les-Pins",
            // Territoire Aix-en-Provence (9)
            "Aix-en-Provence", "Bouc-Bel-Air", "Cabriès", "Châteauneuf-le-Rouge", "Fuveau",
            "Gardanne", "Meyreuil", "Peynier", "Simiane-Collongue",
            // Territoire Aubagne-La Ciotat (12)
            "Aubagne", "Auriol", "Belcodène", "Cadolive", "Cuges-les-Pins",
            "Gréasque", "La Bouilladisse", "La Destrousse", "La Penne-sur-Huveaune", "Peypin",
            "Roquevaire", "Saint-Savournin",
            // Territoire Istres-Ouest-Provence (9)
            "Cornillon-Confoux", "Fos-sur-Mer", "Grans", "Istres", "Miramas",
            "Port-de-Bouc", "Port-Saint-Louis-du-Rhône", "Saint-Chamas", "Saint-Mitre-les-Remparts",
            // Territoire Martigues (3)
            "Martigues", "Châteauneuf-les-Martigues", "Saint-Victoret",
            // Territoire Salon-Étang-de-Berre (17)
            "Berre-l'Étang", "Charleval", "Coudoux", "La Barben", "La Fare-les-Oliviers",
            "Lamanon", "Lançon-Provence", "Pélissanne", "Rognac", "Saint-Cannat",
            "Salon-de-Provence", "Sénas", "Velaux", "Ventabren", "Vernègues", "Vitrolles"
        ]
    },
    
    toulouse_metropole: {
        nom: "Toulouse Métropole",
        type: "métropole",
        communes: [
            "Aigrefeuille", "Aucamville", "Aussonne", "Balma", "Beaupuy",
            "Beauzelle", "Blagnac", "Brax", "Bruguières", "Castelginest",
            "Colomiers", "Cornebarrieu", "Cugnaux", "Drémil-Lafage", "Fenouillet",
            "Flourens", "Fonbeauzard", "Gagnac-sur-Garonne", "Gratentour", "L'Union",
            "Launaguet", "Lespinasse", "Mondouzil", "Montrabe", "Pibrac",
            "Pin-Balma", "Plaisance-du-Touch", "Quint-Fonsegrives", "Saint-Alban", "Saint-Jean",
            "Saint-Jory", "Saint-Orens-de-Gameville", "Seilh", "Toulouse", "Tournefeuille",
            "Villeneuve-Tolosane", "Villeneuve-Tolosane"
        ]
    },
    
    bordeaux_metropole: {
        nom: "Bordeaux Métropole",
        type: "métropole",
        communes: [
            "Ambarès-et-Lagrave", "Ambès", "Artigues-près-Bordeaux", "Bègles", "Blanquefort",
            "Bordeaux", "Bouliac", "Bruges", "Carbon-Blanc", "Cenon",
            "Eysines", "Floirac", "Gradignan", "Le Bouscat", "Le Haillan",
            "Le Taillan-Médoc", "Lormont", "Martignas-sur-Jalle", "Mérignac", "Parempuyre",
            "Pessac", "Saint-Aubin-de-Médoc", "Saint-Louis-de-Montferrand", "Saint-Médard-en-Jalles", "Saint-Vincent-de-Paul",
            "Talence", "Villenave-d'Ornon", "Yvrac"
        ]
    },
    
    nantes_metropole: {
        nom: "Nantes Métropole",
        type: "métropole",
        communes: [
            "Basse-Goulaine", "Bouaye", "Bouguenais", "Brains", "Carquefou",
            "Couëron", "Indre", "La Chapelle-sur-Erdre", "La Montagne", "Le Pellerin",
            "Les Sorinières", "Mauves-sur-Loire", "Nantes", "Orvault", "Rezé",
            "Saint-Aignan-Grandlieu", "Saint-Herblain", "Saint-Jean-de-Boiseau", "Saint-Léger-les-Vignes", "Saint-Sébastien-sur-Loire",
            "Sainte-Luce-sur-Loire", "Sautron", "Thouaré-sur-Loire", "Vertou"
        ]
    },
    
    nice_metropole: {
        nom: "Métropole Nice Côte d'Azur",
        type: "métropole",
        communes: [
            "Aspremont", "Beaulieu-sur-Mer", "Bendejun", "Canta", "Cap-d'Ail",
            "Carros", "Castagniers", "Châteauneuf-Villevieille", "Colomars", "Contes",
            "Drap", "Èze", "Falicon", "Gattières", "Gilette",
            "La Gaude", "La Roquette-sur-Var", "La Trinité", "Le Broc", "Levens",
            "Nice", "Peille", "Peillon", "Saint-André-de-la-Roche", "Saint-Blaise",
            "Saint-Jean-Cap-Ferrat", "Saint-Jeannet", "Saint-Laurent-du-Var", "Saint-Martin-du-Var", "Tourrette-Levens",
            "Tourettes-sur-Loup", "Villefranche-sur-Mer", "Villeneuve-Loubet"
        ]
    },
    
    strasbourg_metropole: {
        nom: "Eurométropole de Strasbourg",
        type: "métropole",
        communes: [
            "Achenheim", "Bischheim", "Blaesheim", "Breuschwickersheim", "Eckbolsheim",
            "Eckwersheim", "Entzheim", "Eschau", "Fegersheim", "Geispolsheim",
            "Hangenbieten", "Hoenheim", "Holtzheim", "Illkirch-Graffenstaden", "Kolbsheim",
            "Lampertheim", "Lingolsheim", "Lipsheim", "Mittelhausbergen", "Mundolsheim",
            "Niederhausbergen", "Oberhausbergen", "Oberschaeffolsheim", "Ostwald", "Plobsheim",
            "Reichstett", "Schiltigheim", "Souffelweyersheim", "Strasbourg", "Vendenheim",
            "Werst", "Weyersheim", "Wolfisheim"
        ]
    },
    
    lille_metropole: {
        nom: "Métropole Européenne de Lille",
        type: "métropole",
        communes: [
            "Anstaing", "Armentières", "Ascq", "Avelin", "Bois-Grenier",
            "Bondues", "Bousbecque", "Capinghem", "Chapelle-d'Armentières", "Comines",
            "Croix", "Deûlémont", "Don", "Emmerin", "Ennetières-en-Weppes",
            "Erquinghem-le-Sec", "Erquinghem-Lys", "Escobecques", "Faches-Thumesnil", "Forest-sur-Marque",
            "Fournes-en-Weppes", "Frelinghien", "Fretin", "Gruson", "Hallennes-lez-Haubourdin",
            "Halluin", "Hantay", "Hem", "Herlies", "Houplin-Ancoisne",
            "Houplines", "Illies", "La Bassée", "La Chapelle-d'Armentières", "La Madeleine",
            "Lambersart", "Lannoy", "Leers", "Lesquin", "Lezennes",
            "Lille", "Linselles", "Lompret", "Loos", "Lys-lez-Lannoy",
            "Marcq-en-Barœul", "Marquette-lez-Lille", "Marquillies", "Mons-en-Barœul", "Mouvaux",
            "Neuville-en-Ferrain", "Nomain", "Pérenchies", "Péronne-en-Mélantois", "Prémesques",
            "Quesnoy-sur-Deûle", "Radinghem-en-Weppes", "Ronchin", "Roncq", "Roubaix",
            "Sainghin-en-Mélantois", "Sainghin-en-Weppes", "Saint-André-lez-Lille", "Santes", "Sequedin",
            "Templemars", "Toufflers", "Tourcoing", "Tressin", "Verlinghem",
            "Villeneuve-d'Ascq", "Wambrechies", "Wannehain", "Wasquehal", "Wattignies",
            "Wattrelos", "Wavrin", "Wervicq-Sud", "Wicres", "Willems"
        ]
    },
    
    grenoble_metropole: {
        nom: "Grenoble-Alpes Métropole",
        type: "métropole",
        communes: [
            "Bresson", "Brié-et-Angonnes", "Champagnier", "Champ-sur-Drac", "Claix",
            "Corenc", "Échirolles", "Eybens", "Fontaine", "Fontanil-Cornillon",
            "Gières", "Grenoble", "Herbeys", "Jarrie", "La Tronche",
            "Le Gua", "Le Pont-de-Claix", "Le Sappey-en-Chartreuse", "Meylan", "Miribel-Lanchâtre",
            "Montchaboud", "Mont-Saint-Martin", "Murianette", "Noyarey", "Poisat",
            "Proveysieux", "Quaix-en-Chartreuse", "Saint-Barthélemy-de-Séchilienne", "Saint-Égrève", "Saint-Georges-de-Commiers",
            "Saint-Martin-d'Hères", "Saint-Martin-le-Vinoux", "Saint-Paul-de-Varces", "Saint-Pierre-de-Mésage", "Sarcenas",
            "Sassenage", "Séchilienne", "Seyssinet-Pariset", "Seyssins", "Varces-Allières-et-Risset",
            "Vaulnaveys-le-Bas", "Vaulnaveys-le-Haut", "Venon", "Veurey-Voroize", "Vif",
            "Vizille", "Voreppe", "Vourey"
        ]
    },
    
    rouen_metropole: {
        nom: "Métropole Rouen Normandie",
        type: "métropole",
        communes: [
            "Amfreville-la-Mi-Voie", "Anneville-Ambourville", "Belbeuf", "Berville-sur-Seine", "Bihorel",
            "Bois-Guillaume", "Bonsecours", "Canteleu", "Darnétal", "Déville-lès-Rouen",
            "Duclair", "Franqueville-Saint-Pierre", "Gouy", "Grand-Couronne", "Hautot-sur-Seine",
            "Hénouville", "Houppeville", "Isneauville", "Jumièges", "La Londe",
            "La Neuville-Chant-d'Oisel", "Le Grand-Quevilly", "Le Houlme", "Le Mesnil-Esnard", "Le Petit-Quevilly",
            "Malaunay", "Maromme", "Mesnil-Raoul", "Mont-Saint-Aignan", "Montmain",
            "Moulineaux", "Notre-Dame-de-Bondeville", "Oissel", "Petit-Couronne", "Quevillon",
            "Roncherolles-sur-le-Vivier", "Rouen", "Sahurs", "Saint-Aubin-Celloville", "Saint-Aubin-Épinay",
            "Saint-Aubin-lès-Elbeuf", "Saint-Étienne-du-Rouvray", "Saint-Jacques-sur-Darnétal", "Saint-Jean-du-Cardonnay", "Saint-Léger-du-Bourg-Denis",
            "Saint-Martin-de-Boscherville", "Saint-Martin-du-Vivier", "Saint-Paër", "Saint-Pierre-de-Manneville", "Saint-Pierre-de-Varengeville",
            "Saint-Pierre-lès-Elbeuf", "Sainte-Marguerite-sur-Duclair", "Sotteville-lès-Rouen", "Sotteville-sous-le-Val", "Tourville-la-Rivière",
            "Val-de-la-Haye", "Yainville", "Ymare", "Yville-sur-Seine"
        ]
    },
    
    montpellier_metropole: {
        nom: "Montpellier Méditerranée Métropole",
        type: "métropole",
        communes: [
            "Baillargues", "Beaulieu", "Castelnau-le-Lez", "Castries", "Clapiers",
            "Cournonsec", "Cournonterral", "Fabrègues", "Grabels", "Jacou",
            "Juvignac", "Lattes", "Lavérune", "Le Crès", "Montaud",
            "Montferrier-sur-Lez", "Montpellier", "Murviel-lès-Montpellier", "Pérols", "Pignan",
            "Prades-le-Lez", "Restinclières", "Saint-Brès", "Saint-Drézéry", "Saint-Geniès-des-Mourgues",
            "Saint-Georges-d'Orques", "Saint-Jean-de-Védas", "Saussan", "Sussargues", "Vendargues",
            "Villeneuve-lès-Maguelone"
        ]
    },
    
    orleans_metropole: {
        nom: "Orléans Métropole",
        type: "métropole",
        communes: [
            "Boigny-sur-Bionne", "Bou", "Chanteau", "Chécy", "Combleux",
            "Dry", "Fleury-les-Aubrais", "Ingré", "La Chapelle-Saint-Mesmin", "Marigny-les-Usages",
            "Mardié", "Olivet", "Orléans", "Ormes", "Saint-Cyr-en-Val",
            "Saint-Denis-en-Val", "Saint-Hilaire-Saint-Mesmin", "Saint-Jean-de-Braye", "Saint-Jean-de-la-Ruelle", "Saint-Jean-le-Blanc",
            "Saint-Pryvé-Saint-Mesmin", "Semoy"
        ]
    },
    
    dijon_metropole: {
        nom: "Dijon Métropole",
        type: "métropole",
        communes: [
            "Ahuy", "Bressey-sur-Tille", "Bretenière", "Chevigny-Saint-Sauveur", "Chenôve",
            "Corcelles-les-Monts", "Crimolois", "Daix", "Dijon", "Fénay",
            "Flavignerot", "Fontaine-d'Ouche", "Fontaine-lès-Dijon", "Hauteville-lès-Dijon", "Longvic",
            "Magny-sur-Tille", "Marsannay-la-Côte", "Neuilly-Crimolois", "Ouges", "Perrigny-lès-Dijon",
            "Plombières-lès-Dijon", "Quetigny", "Saint-Apollinaire", "Talant"
        ]
    },
    
    tours_metropole: {
        nom: "Tours Métropole Val de Loire",
        type: "métropole",
        communes: [
            "Ballan-Miré", "Berthenay", "Chambray-lès-Tours", "Chançay", "Druye",
            "Fondettes", "Joué-lès-Tours", "La Membrolle-sur-Choisille", "La Riche", "Luynes",
            "Mettray", "Notre-Dame-d'Oé", "Parçay-Meslay", "Rochecorbon", "Saint-Avertin",
            "Saint-Cyr-sur-Loire", "Saint-Étienne-de-Chigny", "Saint-Genouph", "Saint-Pierre-des-Corps", "Tours",
            "Villanders", "Vouvray"
        ]
    },
    
    metz_metropole: {
        nom: "Metz Métropole",
        type: "métropole",
        communes: [
            "Amanvillers", "Ars-Laquenexy", "Ars-sur-Moselle", "Augny", "Chesny",
            "Coin-lès-Cuvry", "Coin-sur-Seille", "Cuvry", "Failly", "Féy",
            "Glatigny", "Goin", "Jussy", "Jury", "La Maxe",
            "Le Ban-Saint-Martin", "Lessy", "Lorry-lès-Metz", "Lorry-Mardigny", "Laquenexy",
            "Marieulles", "Marly", "Maizières-lès-Metz", "Metz", "Montigny-lès-Metz",
            "Moulins-lès-Metz", "Nouilly", "Peltre", "Plappeville", "Pouilly",
            "Rozérieulles", "Sainte-Ruffine", "Saint-Julien-lès-Metz", "Saint-Privat-la-Montagne", "Saulny",
            "Scy-Chazelles", "Vantoux", "Vany", "Vaux", "Vernéville",
            "Woippy", "Antilly", "Retonfey", "Pournoy-la-Chétive"
        ]
    },
    
    nancy_metropole: {
        nom: "Métropole du Grand Nancy",
        type: "métropole",
        communes: [
            "Art-sur-Meurthe", "Champigneulles", "Dommartemont", "Essey-lès-Nancy", "Fléville-devant-Nancy",
            "Heillecourt", "Houdemont", "Jarville-la-Malgrange", "Laxou", "Ludres",
            "Malzéville", "Maxéville", "Nancy", "Pulnoy", "Saint-Max",
            "Saulxures-lès-Nancy", "Seichamps", "Tomblaine", "Vandœuvre-lès-Nancy", "Villers-lès-Nancy"
        ]
    },
    
    clermont_metropole: {
        nom: "Clermont Auvergne Métropole",
        type: "métropole",
        communes: [
            "Aubière", "Aulnat", "Beaumont", "Blanzat", "Cébazat",
            "Ceyrat", "Chamalières", "Châteaugay", "Clermont-Ferrand", "Cournon-d'Auvergne",
            "Durtol", "Gerzat", "Lempdes", "Le Cendre", "Nohanent",
            "Orcet", "Pérignat-lès-Sarliève", "Pont-du-Château", "Romagnat", "Royat",
            "Saint-Genès-Champanelle"
        ]
    },
    
    saint_etienne_metropole: {
        nom: "Saint-Étienne Métropole",
        type: "métropole",
        communes: [
            "Andrézieux-Bouthéon", "Bonson", "Caloire", "Cellieu", "Chambœuf",
            "Châteauneuf", "Dargoire", "Farnay", "Fontanès", "Fraisses",
            "Genilac", "La Fouillouse", "La Grand-Croix", "La Ricamarie", "La Talaudière",
            "La Tour-en-Jarez", "La Valla-en-Gier", "L'Étrat", "L'Horme", "Lorette",
            "Marcenod", "Pavezin", "Périgneux", "Précieux", "Rive-de-Gier",
            "Roche-la-Molière", "Saint-Bonnet-les-Oules", "Saint-Chamond", "Saint-Christo-en-Jarez", "Sainte-Agathe-la-Bouteresse",
            "Saint-Étienne", "Saint-Galmier", "Saint-Genest-Lerpt", "Saint-Héand", "Saint-Jean-Bonnefonds",
            "Saint-Joseph", "Saint-Just-Malmont", "Saint-Just-Saint-Rambert", "Saint-Martin-la-Plaine", "Saint-Paul-en-Cornillon",
            "Saint-Paul-en-Jarez", "Saint-Priest-en-Jarez", "Saint-Romain-le-Puy", "Sorbiers", "Sury-le-Comtal",
            "Tartaras", "Unieux", "Valfleury", "Veauche", "Veauchette",
            "Villars", "Villerest", "Villars"
        ]
    },
    
    toulon_metropole: {
        nom: "Métropole Toulon Provence Méditerranée",
        type: "métropole",
        communes: [
            "Carqueiranne", "La Crau", "La Garde", "La Valette-du-Var", "Le Pradet",
            "Le Revest-les-Eaux", "Ollioules", "La Seyne-sur-Mer", "Saint-Mandrier-sur-Mer", "Six-Fours-les-Plages",
            "Toulon", "Hyères"
        ]
    },
    
    brest_metropole: {
        nom: "Brest Métropole",
        type: "métropole",
        communes: [
            "Bohars", "Brest", "Gouesnou", "Guilers", "Guipavas",
            "Le Relecq-Kerhuon", "Plougastel-Daoulas", "Plouzané"
        ]
    },
    
    // COMMUNAUTÉS D'AGGLOMÉRATION
    agglo_annecy: {
        nom: "Grand Annecy",
        type: "agglomération",
        communes: [
            "Annecy", "Annecy-le-Vieux", "Argonay", "Chavanod", "Cran-Gevrier",
            "Épagny Metz-Tessy", "Meythet", "Montagny-les-Lanches", "Poisy", "Pringy",
            "Quintal", "Saint-Jorioz", "Saint-Martin-Bellevue", "Seynod", "Sevrier",
            "Veyrier-du-Lac", "Bluffy", "Duingt", "Lathuile", "Leschaux",
            "Menthon-Saint-Bernard", "Saint-Eustache", "Talloires-Montmin", "Alex", "Dingy-Saint-Clair",
            "La Balme-de-Sillingy", "Lovagny", "Marcellaz-Albanais", "Mûres", "Nonglard",
            "Choisy", "Cusy", "Gruffy", "Héry-sur-Alby"
        ]
    },
    
    agglo_angers: {
        nom: "Angers Loire Métropole",
        type: "agglomération",
        communes: [
            "Avrillé", "Beaucouzé", "Bouchemaine", "Brain-sur-l'Authion", "Cantenay-Épinard",
            "Écouflant", "Feneu", "Juigné-sur-Loire", "Les Ponts-de-Cé", "Loire-Authion",
            "Longuenée-en-Anjou", "Mûrs-Erigné", "Orée-d'Anjou", "Rives-du-Loir-en-Anjou", "Saint-Barthélemy-d'Anjou",
            "Saint-Clément-de-la-Place", "Saint-Lambert-la-Potherie", "Saint-Léger-de-Linières", "Saint-Martin-du-Fouilloux", "Saint-Sylvain-d'Anjou",
            "Sainte-Gemmes-sur-Loire", "Sarrigné", "Savennières", "Soulaines-sur-Aubance", "Trélazé",
            "Verrières-en-Anjou", "Villevêque", "Angers", "Beaulieu-sur-Layon"
        ]
    },
    
    agglo_avignon: {
        nom: "Grand Avignon",
        type: "agglomération",
        communes: [
            "Avignon", "Caumont-sur-Durance", "Entraigues-sur-la-Sorgue", "Jonquerettes", "Le Pontet",
            "Les Angles", "Morières-lès-Avignon", "Pujaut", "Rochefort-du-Gard", "Roquemaure",
            "Saint-Saturnin-lès-Avignon", "Sauveterre", "Saze", "Vedène", "Velleron",
            "Villeneuve-lès-Avignon"
        ]
    },
    
    agglo_pau: {
        nom: "Communauté d'Agglomération Pau Béarn Pyrénées",
        type: "agglomération",
        communes: [
            "Artiguelouve", "Artigueloutan", "Asson", "Aussevielle", "Beyrie-en-Béarn",
            "Billère", "Bizanos", "Bosdarros", "Bougarber", "Bourdettes",
            "Denguin", "Gan", "Gelos", "Idron", "Jurançon",
            "Lagos", "Lee", "Lescar", "Lons", "Lée",
            "Mazères-Lezons", "Meillon", "Narcastet", "Ousse", "Pau",
            "Poey-de-Lescar", "Rontignon", "Saint-Faust", "Sendets", "Serres-Castet",
            "Uzos"
        ]
    },
    
    agglo_limoges: {
        nom: "Limoges Métropole",
        type: "agglomération",
        communes: [
            "Aureil", "Boisseuil", "Bonnac-la-Côte", "Chaptelat", "Condat-sur-Vienne",
            "Couzeix", "Eyjeaux", "Feytiat", "Isle", "Le Palais-sur-Vienne",
            "Limoges", "Panazol", "Peyrilhac", "Rilhac-Rancon", "Royères",
            "Saint-Gence", "Saint-Just-le-Martel", "Solignac", "Verneuil-sur-Vienne", "Veyrac"
        ]
    },
    
    agglo_caen: {
        nom: "Caen la Mer",
        type: "agglomération",
        communes: [
            "Authie", "Bénouville", "Biéville-Beuville", "Blainville-sur-Orne", "Bretteville-sur-Odon",
            "Caen", "Cairon", "Cambes-en-Plaine", "Carpiquet", "Colombelles",
            "Cormelles-le-Royal", "Courseulles-sur-Mer", "Cresserons", "Cuverville", "Démouville",
            "Douvres-la-Délivrande", "Épron", "Fleury-sur-Orne", "Fontaine-Étoupefour", "Gavrus",
            "Giberville", "Grentheville", "Hermanville-sur-Mer", "Hérouville-Saint-Clair", "Hérouvillette",
            "Ifs", "Lasson", "Lion-sur-Mer", "Louvigny", "Luc-sur-Mer",
            "Mathieu", "Mondeville", "Mouen", "Ouistreham", "Périers-sur-le-Dan",
            "Reviers", "Rosel", "Saint-Aubin-d'Arquenay", "Saint-Contest", "Saint-Germain-la-Blanche-Herbe",
            "Saint-Manvieu-Norrey", "Sannerville", "Soliers", "Thaon", "Verson",
            "Villons-les-Buissons"
        ]
    },
    
    agglo_besancon: {
        nom: "Grand Besançon Métropole",
        type: "agglomération",
        communes: [
            "Amagney", "Avanne-Aveney", "Besançon", "Bonnay", "Boussières",
            "Busy", "Byans-sur-Doubs", "Chalèze", "Chalezeule", "Champoux",
            "Champvans-les-Moulins", "Chaucenne", "Chemaudin et Vaux", "Chenecey-Buillon", "Dannemarie-sur-Crète",
            "Deluz", "Devecey", "École-Valentin", "Fontain", "Franois",
            "Geneuille", "Gennes", "Grandfontaine", "Larnod", "Velesmes-Essarts",
            "Le Gratteris", "Les Auxons", "Miserey-Salines", "Montfaucon", "Montferrand-le-Château",
            "Noironte", "Novillars", "Pelousey", "Pirey", "Pouilley-les-Vignes",
            "Pugey", "Rancenay", "Roche-lez-Beaupré", "Serre-les-Sapins", "Tallenay",
            "Thise", "Torpes", "Vaire", "Velesmes-Essarts"
        ]
    },
    
    agglo_reims: {
        nom: "Grand Reims",
        type: "agglomération",
        communes: [
            "Reims", "Bétheny", "Bezannes", "Cormontreuil", "Tinqueux",
            "Saint-Brice-Courcelles", "Witry-lès-Reims", "Taissy", "Champfleury", "Champigny",
            "Trois-Puits", "Thillois", "Sillery", "Puisieulx", "Cernay-lès-Reims"
        ]
    },
    
    agglo_la_rochelle: {
        nom: "Communauté d'Agglomération de La Rochelle",
        type: "agglomération",
        communes: [
            "Aigrefeuille-d'Aunis", "Aytré", "Bourgneuf", "Châtelaillon-Plage", "Clavette",
            "Dompierre-sur-Mer", "Esnandes", "Ferrières", "L'Houmeau", "La Jarne",
            "La Jarrie", "La Rochelle", "Lagord", "Marsilly", "Nieul-sur-Mer",
            "Périgny", "Puilboreau", "Saint-Christophe", "Saint-Médard-d'Aunis", "Saint-Rogatien",
            "Saint-Vivien", "Saint-Xandre", "Salles-sur-Mer", "Sainte-Soulle", "Thairé",
            "Vérines", "Yves", "Angoulins"
        ]
    },
    
    agglo_perpignan: {
        nom: "Perpignan Méditerranée Métropole",
        type: "agglomération",
        communes: [
            "Bages", "Baho", "Baixas", "Bompas", "Cabestany",
            "Canohès", "Cases-de-Pène", "Claira", "Corneilla-del-Vercol", "Elne",
            "Espira-de-l'Agly", "Le Barcarès", "Le Soler", "Perpignan", "Peyrestortes",
            "Pézilla-la-Rivière", "Pia", "Pollestres", "Ponteilla", "Rivesaltes",
            "Saint-Estève", "Saint-Féliu-d'Avall", "Saint-Hippolyte", "Saint-Laurent-de-la-Salanque", "Saint-Nazaire",
            "Sainte-Marie-la-Mer", "Saleilles", "Llupia", "Toulouges", "Villeneuve-de-la-Raho",
            "Villeneuve-la-Rivière", "Théza", "Torreilles", "Villelongue-de-la-Salanque", "Tautavel",
            "Opoul-Périllos"
        ]
    }
};

// Fonction pour obtenir les communes d'une intercommunalité
function getCommunesIntercommunalite(code) {
    return INTERCOMMUNALITES[code]?.communes || [];
}

// Fonction pour obtenir le nom d'une intercommunalité
function getNomIntercommunalite(code) {
    return INTERCOMMUNALITES[code]?.nom || code;
}

// Rendre disponible globalement
if (typeof window !== 'undefined') {
    window.INTERCOMMUNALITES = INTERCOMMUNALITES;
    window.getCommunesIntercommunalite = getCommunesIntercommunalite;
    window.getNomIntercommunalite = getNomIntercommunalite;
}
