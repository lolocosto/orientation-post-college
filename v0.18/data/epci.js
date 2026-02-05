/**
 * DonnÃ©es des intercommunalitÃ©s franÃ§aises
 * Source: Wikipedia + donnÃ©es officielles
 */

const INTERCOMMUNALITES = {
    // MÃ‰TROPOLES
    rennes_metropole: {
        nom: "Rennes MÃ©tropole",
        type: "mÃ©tropole",
        communes: [
            "AcignÃ©", "BÃ©cherel", "Betton", "BourgbarrÃ©", "BrÃ©cÃ©",
            "Bruz", "Cesson-SÃ©vignÃ©", "Chantepie", "La Chapelle-ChaussÃ©e", "La Chapelle-des-Fougeretz",
            "La Chapelle-Thouarault", "Chartres-de-Bretagne", "ChÃ¢teaugiron", "Chavagne", "ChevaignÃ©",
            "CintrÃ©", "Clayes", "Corps-Nuds", "GÃ©vezÃ©", "Le Rheu",
            "LaillÃ©", "LangouÃ«t", "Langan", "L'Hermitage", "Miniac-sous-BÃ©cherel",
            "Montgermont", "Mordelles", "Nouvoitou", "Noyal-ChÃ¢tillon-sur-Seiche", "OrgÃ¨res",
            "PacÃ©", "Parthenay-de-Bretagne", "Le Pertre", "Pont-PÃ©an", "Rennes",
            "RomillÃ©", "Saint-Armel", "Saint-Erblon", "Saint-Gilles", "Saint-GrÃ©goire",
            "Saint-Jacques-de-la-Lande", "Saint-Sulpice-la-ForÃªt", "ThorignÃ©-Fouillard", "Vern-sur-Seiche", "Vezin-le-Coquet"
        ]
    },
    
    lyon_metropole: {
        nom: "MÃ©tropole de Lyon",
        type: "mÃ©tropole",
        communes: [
            "Albigny-sur-SaÃ´ne", "Bron", "Cailloux-sur-Fontaines", "Caluire-et-Cuire", "Champagne-au-Mont-d'Or",
            "CharbonniÃ¨res-les-Bains", "Charly", "Chassieu", "Collonges-au-Mont-d'Or", "Craponne",
            "Curis-au-Mont-d'Or", "Dardilly", "DÃ©cines-Charpieu", "Ã‰cully", "Feyzin",
            "Fleurieu-sur-SaÃ´ne", "Fontaines-Saint-Martin", "Fontaines-sur-SaÃ´ne", "Francheville", "Genay",
            "Givors", "Grigny", "Irigny", "Jonage", "La MulatiÃ¨re",
            "La Tour-de-Salvagny", "Limonest", "Lissieu", "Lyon", "Marcy-l'Ã‰toile",
            "Meyzieu", "Mions", "Montanay", "Neuville-sur-SaÃ´ne", "Oullins-Pierre-BÃ©nite",
            "Pierre-BÃ©nite", "Poleymieux-au-Mont-d'Or", "Quincieux", "Rillieux-la-Pape", "RochetaillÃ©e-sur-SaÃ´ne",
            "Sainte-Foy-lÃ¨s-Lyon", "Saint-Cyr-au-Mont-d'Or", "Saint-Didier-au-Mont-d'Or", "Saint-Fons", "Saint-Genis-Laval",
            "Saint-Genis-les-OlliÃ¨res", "Saint-Germain-au-Mont-d'Or", "Saint-Laurent-de-Mure", "Saint-Priest", "Sathonay-Camp",
            "Sathonay-Village", "Solaize", "Tassin-la-Demi-Lune", "Ternay", "Vaulx-en-Velin",
            "VÃ©nissieux", "Vernaison", "Villeurbanne", "Villeurbanne", "Vourles"
        ]
    },
    
    marseille_metropole: {
        nom: "MÃ©tropole Aix-Marseille-Provence",
        type: "mÃ©tropole",
        communes: [
            // Territoire Marseille-Provence (18)
            "Marseille", "Allauch", "Carnoux-en-Provence", "Carry-le-Rouet", "Cassis",
            "Ceyreste", "ChÃ¢teauneuf-les-Martigues", "EnsuÃ¨s-la-Redonne", "GÃ©menos", "Gignac-la-Nerthe",
            "La Ciotat", "La Penne-sur-Huveaune", "Le Rove", "Marignane", "Marseille",
            "Plan-de-Cuques", "Roquefort-la-BÃ©doule", "Sausset-les-Pins",
            // Territoire Aix-en-Provence (9)
            "Aix-en-Provence", "Bouc-Bel-Air", "CabriÃ¨s", "ChÃ¢teauneuf-le-Rouge", "Fuveau",
            "Gardanne", "Meyreuil", "Peynier", "Simiane-Collongue",
            // Territoire Aubagne-La Ciotat (12)
            "Aubagne", "Auriol", "BelcodÃ¨ne", "Cadolive", "Cuges-les-Pins",
            "GrÃ©asque", "La Bouilladisse", "La Destrousse", "La Penne-sur-Huveaune", "Peypin",
            "Roquevaire", "Saint-Savournin",
            // Territoire Istres-Ouest-Provence (9)
            "Cornillon-Confoux", "Fos-sur-Mer", "Grans", "Istres", "Miramas",
            "Port-de-Bouc", "Port-Saint-Louis-du-RhÃ´ne", "Saint-Chamas", "Saint-Mitre-les-Remparts",
            // Territoire Martigues (3)
            "Martigues", "ChÃ¢teauneuf-les-Martigues", "Saint-Victoret",
            // Territoire Salon-Ã‰tang-de-Berre (17)
            "Berre-l'Ã‰tang", "Charleval", "Coudoux", "La Barben", "La Fare-les-Oliviers",
            "Lamanon", "LanÃ§on-Provence", "PÃ©lissanne", "Rognac", "Saint-Cannat",
            "Salon-de-Provence", "SÃ©nas", "Velaux", "Ventabren", "VernÃ¨gues", "Vitrolles"
        ]
    },
    
    toulouse_metropole: {
        nom: "Toulouse MÃ©tropole",
        type: "mÃ©tropole",
        communes: [
            "Aigrefeuille", "Aucamville", "Aussonne", "Balma", "Beaupuy",
            "Beauzelle", "Blagnac", "Brax", "BruguiÃ¨res", "Castelginest",
            "Colomiers", "Cornebarrieu", "Cugnaux", "DrÃ©mil-Lafage", "Fenouillet",
            "Flourens", "Fonbeauzard", "Gagnac-sur-Garonne", "Gratentour", "L'Union",
            "Launaguet", "Lespinasse", "Mondouzil", "Montrabe", "Pibrac",
            "Pin-Balma", "Plaisance-du-Touch", "Quint-Fonsegrives", "Saint-Alban", "Saint-Jean",
            "Saint-Jory", "Saint-Orens-de-Gameville", "Seilh", "Toulouse", "Tournefeuille",
            "Villeneuve-Tolosane", "Villeneuve-Tolosane"
        ]
    },
    
    bordeaux_metropole: {
        nom: "Bordeaux MÃ©tropole",
        type: "mÃ©tropole",
        communes: [
            "AmbarÃ¨s-et-Lagrave", "AmbÃ¨s", "Artigues-prÃ¨s-Bordeaux", "BÃ¨gles", "Blanquefort",
            "Bordeaux", "Bouliac", "Bruges", "Carbon-Blanc", "Cenon",
            "Eysines", "Floirac", "Gradignan", "Le Bouscat", "Le Haillan",
            "Le Taillan-MÃ©doc", "Lormont", "Martignas-sur-Jalle", "MÃ©rignac", "Parempuyre",
            "Pessac", "Saint-Aubin-de-MÃ©doc", "Saint-Louis-de-Montferrand", "Saint-MÃ©dard-en-Jalles", "Saint-Vincent-de-Paul",
            "Talence", "Villenave-d'Ornon", "Yvrac"
        ]
    },
    
    nantes_metropole: {
        nom: "Nantes MÃ©tropole",
        type: "mÃ©tropole",
        communes: [
            "Basse-Goulaine", "Bouaye", "Bouguenais", "Brains", "Carquefou",
            "CouÃ«ron", "Indre", "La Chapelle-sur-Erdre", "La Montagne", "Le Pellerin",
            "Les SoriniÃ¨res", "Mauves-sur-Loire", "Nantes", "Orvault", "RezÃ©",
            "Saint-Aignan-Grandlieu", "Saint-Herblain", "Saint-Jean-de-Boiseau", "Saint-LÃ©ger-les-Vignes", "Saint-SÃ©bastien-sur-Loire",
            "Sainte-Luce-sur-Loire", "Sautron", "ThouarÃ©-sur-Loire", "Vertou"
        ]
    },
    
    nice_metropole: {
        nom: "MÃ©tropole Nice CÃ´te d'Azur",
        type: "mÃ©tropole",
        communes: [
            "Aspremont", "Beaulieu-sur-Mer", "Bendejun", "Canta", "Cap-d'Ail",
            "Carros", "Castagniers", "ChÃ¢teauneuf-Villevieille", "Colomars", "Contes",
            "Drap", "Ãˆze", "Falicon", "GattiÃ¨res", "Gilette",
            "La Gaude", "La Roquette-sur-Var", "La TrinitÃ©", "Le Broc", "Levens",
            "Nice", "Peille", "Peillon", "Saint-AndrÃ©-de-la-Roche", "Saint-Blaise",
            "Saint-Jean-Cap-Ferrat", "Saint-Jeannet", "Saint-Laurent-du-Var", "Saint-Martin-du-Var", "Tourrette-Levens",
            "Tourettes-sur-Loup", "Villefranche-sur-Mer", "Villeneuve-Loubet"
        ]
    },
    
    strasbourg_metropole: {
        nom: "EuromÃ©tropole de Strasbourg",
        type: "mÃ©tropole",
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
        nom: "MÃ©tropole EuropÃ©enne de Lille",
        type: "mÃ©tropole",
        communes: [
            "Anstaing", "ArmentiÃ¨res", "Ascq", "Avelin", "Bois-Grenier",
            "Bondues", "Bousbecque", "Capinghem", "Chapelle-d'ArmentiÃ¨res", "Comines",
            "Croix", "DeÃ»lÃ©mont", "Don", "Emmerin", "EnnetiÃ¨res-en-Weppes",
            "Erquinghem-le-Sec", "Erquinghem-Lys", "Escobecques", "Faches-Thumesnil", "Forest-sur-Marque",
            "Fournes-en-Weppes", "Frelinghien", "Fretin", "Gruson", "Hallennes-lez-Haubourdin",
            "Halluin", "Hantay", "Hem", "Herlies", "Houplin-Ancoisne",
            "Houplines", "Illies", "La BassÃ©e", "La Chapelle-d'ArmentiÃ¨res", "La Madeleine",
            "Lambersart", "Lannoy", "Leers", "Lesquin", "Lezennes",
            "Lille", "Linselles", "Lompret", "Loos", "Lys-lez-Lannoy",
            "Marcq-en-BarÅ“ul", "Marquette-lez-Lille", "Marquillies", "Mons-en-BarÅ“ul", "Mouvaux",
            "Neuville-en-Ferrain", "Nomain", "PÃ©renchies", "PÃ©ronne-en-MÃ©lantois", "PrÃ©mesques",
            "Quesnoy-sur-DeÃ»le", "Radinghem-en-Weppes", "Ronchin", "Roncq", "Roubaix",
            "Sainghin-en-MÃ©lantois", "Sainghin-en-Weppes", "Saint-AndrÃ©-lez-Lille", "Santes", "Sequedin",
            "Templemars", "Toufflers", "Tourcoing", "Tressin", "Verlinghem",
            "Villeneuve-d'Ascq", "Wambrechies", "Wannehain", "Wasquehal", "Wattignies",
            "Wattrelos", "Wavrin", "Wervicq-Sud", "Wicres", "Willems"
        ]
    },
    
    grenoble_metropole: {
        nom: "Grenoble-Alpes MÃ©tropole",
        type: "mÃ©tropole",
        communes: [
            "Bresson", "BriÃ©-et-Angonnes", "Champagnier", "Champ-sur-Drac", "Claix",
            "Corenc", "Ã‰chirolles", "Eybens", "Fontaine", "Fontanil-Cornillon",
            "GiÃ¨res", "Grenoble", "Herbeys", "Jarrie", "La Tronche",
            "Le Gua", "Le Pont-de-Claix", "Le Sappey-en-Chartreuse", "Meylan", "Miribel-LanchÃ¢tre",
            "Montchaboud", "Mont-Saint-Martin", "Murianette", "Noyarey", "Poisat",
            "Proveysieux", "Quaix-en-Chartreuse", "Saint-BarthÃ©lemy-de-SÃ©chilienne", "Saint-Ã‰grÃ¨ve", "Saint-Georges-de-Commiers",
            "Saint-Martin-d'HÃ¨res", "Saint-Martin-le-Vinoux", "Saint-Paul-de-Varces", "Saint-Pierre-de-MÃ©sage", "Sarcenas",
            "Sassenage", "SÃ©chilienne", "Seyssinet-Pariset", "Seyssins", "Varces-AlliÃ¨res-et-Risset",
            "Vaulnaveys-le-Bas", "Vaulnaveys-le-Haut", "Venon", "Veurey-Voroize", "Vif",
            "Vizille", "Voreppe", "Vourey"
        ]
    },
    
    rouen_metropole: {
        nom: "MÃ©tropole Rouen Normandie",
        type: "mÃ©tropole",
        communes: [
            "Amfreville-la-Mi-Voie", "Anneville-Ambourville", "Belbeuf", "Berville-sur-Seine", "Bihorel",
            "Bois-Guillaume", "Bonsecours", "Canteleu", "DarnÃ©tal", "DÃ©ville-lÃ¨s-Rouen",
            "Duclair", "Franqueville-Saint-Pierre", "Gouy", "Grand-Couronne", "Hautot-sur-Seine",
            "HÃ©nouville", "Houppeville", "Isneauville", "JumiÃ¨ges", "La Londe",
            "La Neuville-Chant-d'Oisel", "Le Grand-Quevilly", "Le Houlme", "Le Mesnil-Esnard", "Le Petit-Quevilly",
            "Malaunay", "Maromme", "Mesnil-Raoul", "Mont-Saint-Aignan", "Montmain",
            "Moulineaux", "Notre-Dame-de-Bondeville", "Oissel", "Petit-Couronne", "Quevillon",
            "Roncherolles-sur-le-Vivier", "Rouen", "Sahurs", "Saint-Aubin-Celloville", "Saint-Aubin-Ã‰pinay",
            "Saint-Aubin-lÃ¨s-Elbeuf", "Saint-Ã‰tienne-du-Rouvray", "Saint-Jacques-sur-DarnÃ©tal", "Saint-Jean-du-Cardonnay", "Saint-LÃ©ger-du-Bourg-Denis",
            "Saint-Martin-de-Boscherville", "Saint-Martin-du-Vivier", "Saint-PaÃ«r", "Saint-Pierre-de-Manneville", "Saint-Pierre-de-Varengeville",
            "Saint-Pierre-lÃ¨s-Elbeuf", "Sainte-Marguerite-sur-Duclair", "Sotteville-lÃ¨s-Rouen", "Sotteville-sous-le-Val", "Tourville-la-RiviÃ¨re",
            "Val-de-la-Haye", "Yainville", "Ymare", "Yville-sur-Seine"
        ]
    },
    
    montpellier_metropole: {
        nom: "Montpellier MÃ©diterranÃ©e MÃ©tropole",
        type: "mÃ©tropole",
        communes: [
            "Baillargues", "Beaulieu", "Castelnau-le-Lez", "Castries", "Clapiers",
            "Cournonsec", "Cournonterral", "FabrÃ¨gues", "Grabels", "Jacou",
            "Juvignac", "Lattes", "LavÃ©rune", "Le CrÃ¨s", "Montaud",
            "Montferrier-sur-Lez", "Montpellier", "Murviel-lÃ¨s-Montpellier", "PÃ©rols", "Pignan",
            "Prades-le-Lez", "RestincliÃ¨res", "Saint-BrÃ¨s", "Saint-DrÃ©zÃ©ry", "Saint-GeniÃ¨s-des-Mourgues",
            "Saint-Georges-d'Orques", "Saint-Jean-de-VÃ©das", "Saussan", "Sussargues", "Vendargues",
            "Villeneuve-lÃ¨s-Maguelone"
        ]
    },
    
    orleans_metropole: {
        nom: "OrlÃ©ans MÃ©tropole",
        type: "mÃ©tropole",
        communes: [
            "Boigny-sur-Bionne", "Bou", "Chanteau", "ChÃ©cy", "Combleux",
            "Dry", "Fleury-les-Aubrais", "IngrÃ©", "La Chapelle-Saint-Mesmin", "Marigny-les-Usages",
            "MardiÃ©", "Olivet", "OrlÃ©ans", "Ormes", "Saint-Cyr-en-Val",
            "Saint-Denis-en-Val", "Saint-Hilaire-Saint-Mesmin", "Saint-Jean-de-Braye", "Saint-Jean-de-la-Ruelle", "Saint-Jean-le-Blanc",
            "Saint-PryvÃ©-Saint-Mesmin", "Semoy"
        ]
    },
    
    dijon_metropole: {
        nom: "Dijon MÃ©tropole",
        type: "mÃ©tropole",
        communes: [
            "Ahuy", "Bressey-sur-Tille", "BreteniÃ¨re", "Chevigny-Saint-Sauveur", "ChenÃ´ve",
            "Corcelles-les-Monts", "Crimolois", "Daix", "Dijon", "FÃ©nay",
            "Flavignerot", "Fontaine-d'Ouche", "Fontaine-lÃ¨s-Dijon", "Hauteville-lÃ¨s-Dijon", "Longvic",
            "Magny-sur-Tille", "Marsannay-la-CÃ´te", "Neuilly-Crimolois", "Ouges", "Perrigny-lÃ¨s-Dijon",
            "PlombiÃ¨res-lÃ¨s-Dijon", "Quetigny", "Saint-Apollinaire", "Talant"
        ]
    },
    
    tours_metropole: {
        nom: "Tours MÃ©tropole Val de Loire",
        type: "mÃ©tropole",
        communes: [
            "Ballan-MirÃ©", "Berthenay", "Chambray-lÃ¨s-Tours", "ChanÃ§ay", "Druye",
            "Fondettes", "JouÃ©-lÃ¨s-Tours", "La Membrolle-sur-Choisille", "La Riche", "Luynes",
            "Mettray", "Notre-Dame-d'OÃ©", "ParÃ§ay-Meslay", "Rochecorbon", "Saint-Avertin",
            "Saint-Cyr-sur-Loire", "Saint-Ã‰tienne-de-Chigny", "Saint-Genouph", "Saint-Pierre-des-Corps", "Tours",
            "Villanders", "Vouvray"
        ]
    },
    
    metz_metropole: {
        nom: "Metz MÃ©tropole",
        type: "mÃ©tropole",
        communes: [
            "Amanvillers", "Ars-Laquenexy", "Ars-sur-Moselle", "Augny", "Chesny",
            "Coin-lÃ¨s-Cuvry", "Coin-sur-Seille", "Cuvry", "Failly", "FÃ©y",
            "Glatigny", "Goin", "Jussy", "Jury", "La Maxe",
            "Le Ban-Saint-Martin", "Lessy", "Lorry-lÃ¨s-Metz", "Lorry-Mardigny", "Laquenexy",
            "Marieulles", "Marly", "MaiziÃ¨res-lÃ¨s-Metz", "Metz", "Montigny-lÃ¨s-Metz",
            "Moulins-lÃ¨s-Metz", "Nouilly", "Peltre", "Plappeville", "Pouilly",
            "RozÃ©rieulles", "Sainte-Ruffine", "Saint-Julien-lÃ¨s-Metz", "Saint-Privat-la-Montagne", "Saulny",
            "Scy-Chazelles", "Vantoux", "Vany", "Vaux", "VernÃ©ville",
            "Woippy", "Antilly", "Retonfey", "Pournoy-la-ChÃ©tive"
        ]
    },
    
    nancy_metropole: {
        nom: "MÃ©tropole du Grand Nancy",
        type: "mÃ©tropole",
        communes: [
            "Art-sur-Meurthe", "Champigneulles", "Dommartemont", "Essey-lÃ¨s-Nancy", "FlÃ©ville-devant-Nancy",
            "Heillecourt", "Houdemont", "Jarville-la-Malgrange", "Laxou", "Ludres",
            "MalzÃ©ville", "MaxÃ©ville", "Nancy", "Pulnoy", "Saint-Max",
            "Saulxures-lÃ¨s-Nancy", "Seichamps", "Tomblaine", "VandÅ“uvre-lÃ¨s-Nancy", "Villers-lÃ¨s-Nancy"
        ]
    },
    
    clermont_metropole: {
        nom: "Clermont Auvergne MÃ©tropole",
        type: "mÃ©tropole",
        communes: [
            "AubiÃ¨re", "Aulnat", "Beaumont", "Blanzat", "CÃ©bazat",
            "Ceyrat", "ChamaliÃ¨res", "ChÃ¢teaugay", "Clermont-Ferrand", "Cournon-d'Auvergne",
            "Durtol", "Gerzat", "Lempdes", "Le Cendre", "Nohanent",
            "Orcet", "PÃ©rignat-lÃ¨s-SarliÃ¨ve", "Pont-du-ChÃ¢teau", "Romagnat", "Royat",
            "Saint-GenÃ¨s-Champanelle"
        ]
    },
    
    saint_etienne_metropole: {
        nom: "Saint-Ã‰tienne MÃ©tropole",
        type: "mÃ©tropole",
        communes: [
            "AndrÃ©zieux-BouthÃ©on", "Bonson", "Caloire", "Cellieu", "ChambÅ“uf",
            "ChÃ¢teauneuf", "Dargoire", "Farnay", "FontanÃ¨s", "Fraisses",
            "Genilac", "La Fouillouse", "La Grand-Croix", "La Ricamarie", "La TalaudiÃ¨re",
            "La Tour-en-Jarez", "La Valla-en-Gier", "L'Ã‰trat", "L'Horme", "Lorette",
            "Marcenod", "Pavezin", "PÃ©rigneux", "PrÃ©cieux", "Rive-de-Gier",
            "Roche-la-MoliÃ¨re", "Saint-Bonnet-les-Oules", "Saint-Chamond", "Saint-Christo-en-Jarez", "Sainte-Agathe-la-Bouteresse",
            "Saint-Ã‰tienne", "Saint-Galmier", "Saint-Genest-Lerpt", "Saint-HÃ©and", "Saint-Jean-Bonnefonds",
            "Saint-Joseph", "Saint-Just-Malmont", "Saint-Just-Saint-Rambert", "Saint-Martin-la-Plaine", "Saint-Paul-en-Cornillon",
            "Saint-Paul-en-Jarez", "Saint-Priest-en-Jarez", "Saint-Romain-le-Puy", "Sorbiers", "Sury-le-Comtal",
            "Tartaras", "Unieux", "Valfleury", "Veauche", "Veauchette",
            "Villars", "Villerest", "Villars"
        ]
    },
    
    toulon_metropole: {
        nom: "MÃ©tropole Toulon Provence MÃ©diterranÃ©e",
        type: "mÃ©tropole",
        communes: [
            "Carqueiranne", "La Crau", "La Garde", "La Valette-du-Var", "Le Pradet",
            "Le Revest-les-Eaux", "Ollioules", "La Seyne-sur-Mer", "Saint-Mandrier-sur-Mer", "Six-Fours-les-Plages",
            "Toulon", "HyÃ¨res"
        ]
    },
    
    brest_metropole: {
        nom: "Brest MÃ©tropole",
        type: "mÃ©tropole",
        communes: [
            "Bohars", "Brest", "Gouesnou", "Guilers", "Guipavas",
            "Le Relecq-Kerhuon", "Plougastel-Daoulas", "PlouzanÃ©"
        ]
    },
    
    // COMMUNAUTÃ‰S D'AGGLOMÃ‰RATION
    agglo_annecy: {
        nom: "Grand Annecy",
        type: "agglomÃ©ration",
        communes: [
            "Annecy", "Annecy-le-Vieux", "Argonay", "Chavanod", "Cran-Gevrier",
            "Ã‰pagny Metz-Tessy", "Meythet", "Montagny-les-Lanches", "Poisy", "Pringy",
            "Quintal", "Saint-Jorioz", "Saint-Martin-Bellevue", "Seynod", "Sevrier",
            "Veyrier-du-Lac", "Bluffy", "Duingt", "Lathuile", "Leschaux",
            "Menthon-Saint-Bernard", "Saint-Eustache", "Talloires-Montmin", "Alex", "Dingy-Saint-Clair",
            "La Balme-de-Sillingy", "Lovagny", "Marcellaz-Albanais", "MÃ»res", "Nonglard",
            "Choisy", "Cusy", "Gruffy", "HÃ©ry-sur-Alby"
        ]
    },
    
    agglo_angers: {
        nom: "Angers Loire MÃ©tropole",
        type: "agglomÃ©ration",
        communes: [
            "AvrillÃ©", "BeaucouzÃ©", "Bouchemaine", "Brain-sur-l'Authion", "Cantenay-Ã‰pinard",
            "Ã‰couflant", "Feneu", "JuignÃ©-sur-Loire", "Les Ponts-de-CÃ©", "Loire-Authion",
            "LonguenÃ©e-en-Anjou", "MÃ»rs-ErignÃ©", "OrÃ©e-d'Anjou", "Rives-du-Loir-en-Anjou", "Saint-BarthÃ©lemy-d'Anjou",
            "Saint-ClÃ©ment-de-la-Place", "Saint-Lambert-la-Potherie", "Saint-LÃ©ger-de-LiniÃ¨res", "Saint-Martin-du-Fouilloux", "Saint-Sylvain-d'Anjou",
            "Sainte-Gemmes-sur-Loire", "SarrignÃ©", "SavenniÃ¨res", "Soulaines-sur-Aubance", "TrÃ©lazÃ©",
            "VerriÃ¨res-en-Anjou", "VillevÃªque", "Angers", "Beaulieu-sur-Layon"
        ]
    },
    
    agglo_avignon: {
        nom: "Grand Avignon",
        type: "agglomÃ©ration",
        communes: [
            "Avignon", "Caumont-sur-Durance", "Entraigues-sur-la-Sorgue", "Jonquerettes", "Le Pontet",
            "Les Angles", "MoriÃ¨res-lÃ¨s-Avignon", "Pujaut", "Rochefort-du-Gard", "Roquemaure",
            "Saint-Saturnin-lÃ¨s-Avignon", "Sauveterre", "Saze", "VedÃ¨ne", "Velleron",
            "Villeneuve-lÃ¨s-Avignon"
        ]
    },
    
    agglo_pau: {
        nom: "CommunautÃ© d'AgglomÃ©ration Pau BÃ©arn PyrÃ©nÃ©es",
        type: "agglomÃ©ration",
        communes: [
            "Artiguelouve", "Artigueloutan", "Asson", "Aussevielle", "Beyrie-en-BÃ©arn",
            "BillÃ¨re", "Bizanos", "Bosdarros", "Bougarber", "Bourdettes",
            "Denguin", "Gan", "Gelos", "Idron", "JuranÃ§on",
            "Lagos", "Lee", "Lescar", "Lons", "LÃ©e",
            "MazÃ¨res-Lezons", "Meillon", "Narcastet", "Ousse", "Pau",
            "Poey-de-Lescar", "Rontignon", "Saint-Faust", "Sendets", "Serres-Castet",
            "Uzos"
        ]
    },
    
    agglo_limoges: {
        nom: "Limoges MÃ©tropole",
        type: "agglomÃ©ration",
        communes: [
            "Aureil", "Boisseuil", "Bonnac-la-CÃ´te", "Chaptelat", "Condat-sur-Vienne",
            "Couzeix", "Eyjeaux", "Feytiat", "Isle", "Le Palais-sur-Vienne",
            "Limoges", "Panazol", "Peyrilhac", "Rilhac-Rancon", "RoyÃ¨res",
            "Saint-Gence", "Saint-Just-le-Martel", "Solignac", "Verneuil-sur-Vienne", "Veyrac"
        ]
    },
    
    agglo_caen: {
        nom: "Caen la Mer",
        type: "agglomÃ©ration",
        communes: [
            "Authie", "BÃ©nouville", "BiÃ©ville-Beuville", "Blainville-sur-Orne", "Bretteville-sur-Odon",
            "Caen", "Cairon", "Cambes-en-Plaine", "Carpiquet", "Colombelles",
            "Cormelles-le-Royal", "Courseulles-sur-Mer", "Cresserons", "Cuverville", "DÃ©mouville",
            "Douvres-la-DÃ©livrande", "Ã‰pron", "Fleury-sur-Orne", "Fontaine-Ã‰toupefour", "Gavrus",
            "Giberville", "Grentheville", "Hermanville-sur-Mer", "HÃ©rouville-Saint-Clair", "HÃ©rouvillette",
            "Ifs", "Lasson", "Lion-sur-Mer", "Louvigny", "Luc-sur-Mer",
            "Mathieu", "Mondeville", "Mouen", "Ouistreham", "PÃ©riers-sur-le-Dan",
            "Reviers", "Rosel", "Saint-Aubin-d'Arquenay", "Saint-Contest", "Saint-Germain-la-Blanche-Herbe",
            "Saint-Manvieu-Norrey", "Sannerville", "Soliers", "Thaon", "Verson",
            "Villons-les-Buissons"
        ]
    },
    
    agglo_besancon: {
        nom: "Grand BesanÃ§on MÃ©tropole",
        type: "agglomÃ©ration",
        communes: [
            "Amagney", "Avanne-Aveney", "BesanÃ§on", "Bonnay", "BoussiÃ¨res",
            "Busy", "Byans-sur-Doubs", "ChalÃ¨ze", "Chalezeule", "Champoux",
            "Champvans-les-Moulins", "Chaucenne", "Chemaudin et Vaux", "Chenecey-Buillon", "Dannemarie-sur-CrÃ¨te",
            "Deluz", "Devecey", "Ã‰cole-Valentin", "Fontain", "Franois",
            "Geneuille", "Gennes", "Grandfontaine", "Larnod", "Velesmes-Essarts",
            "Le Gratteris", "Les Auxons", "Miserey-Salines", "Montfaucon", "Montferrand-le-ChÃ¢teau",
            "Noironte", "Novillars", "Pelousey", "Pirey", "Pouilley-les-Vignes",
            "Pugey", "Rancenay", "Roche-lez-BeauprÃ©", "Serre-les-Sapins", "Tallenay",
            "Thise", "Torpes", "Vaire", "Velesmes-Essarts"
        ]
    },
    
    agglo_reims: {
        nom: "Grand Reims",
        type: "agglomÃ©ration",
        communes: [
            "Reims", "BÃ©theny", "Bezannes", "Cormontreuil", "Tinqueux",
            "Saint-Brice-Courcelles", "Witry-lÃ¨s-Reims", "Taissy", "Champfleury", "Champigny",
            "Trois-Puits", "Thillois", "Sillery", "Puisieulx", "Cernay-lÃ¨s-Reims"
        ]
    },
    
    agglo_la_rochelle: {
        nom: "CommunautÃ© d'AgglomÃ©ration de La Rochelle",
        type: "agglomÃ©ration",
        communes: [
            "Aigrefeuille-d'Aunis", "AytrÃ©", "Bourgneuf", "ChÃ¢telaillon-Plage", "Clavette",
            "Dompierre-sur-Mer", "Esnandes", "FerriÃ¨res", "L'Houmeau", "La Jarne",
            "La Jarrie", "La Rochelle", "Lagord", "Marsilly", "Nieul-sur-Mer",
            "PÃ©rigny", "Puilboreau", "Saint-Christophe", "Saint-MÃ©dard-d'Aunis", "Saint-Rogatien",
            "Saint-Vivien", "Saint-Xandre", "Salles-sur-Mer", "Sainte-Soulle", "ThairÃ©",
            "VÃ©rines", "Yves", "Angoulins"
        ]
    },
    
    agglo_perpignan: {
        nom: "Perpignan MÃ©diterranÃ©e MÃ©tropole",
        type: "agglomÃ©ration",
        communes: [
            "Bages", "Baho", "Baixas", "Bompas", "Cabestany",
            "CanohÃ¨s", "Cases-de-PÃ¨ne", "Claira", "Corneilla-del-Vercol", "Elne",
            "Espira-de-l'Agly", "Le BarcarÃ¨s", "Le Soler", "Perpignan", "Peyrestortes",
            "PÃ©zilla-la-RiviÃ¨re", "Pia", "Pollestres", "Ponteilla", "Rivesaltes",
            "Saint-EstÃ¨ve", "Saint-FÃ©liu-d'Avall", "Saint-Hippolyte", "Saint-Laurent-de-la-Salanque", "Saint-Nazaire",
            "Sainte-Marie-la-Mer", "Saleilles", "Llupia", "Toulouges", "Villeneuve-de-la-Raho",
            "Villeneuve-la-RiviÃ¨re", "ThÃ©za", "Torreilles", "Villelongue-de-la-Salanque", "Tautavel",
            "Opoul-PÃ©rillos"
        ]
    }
};

// Fonction pour obtenir les communes d'une intercommunalitÃ©
function getCommunesIntercommunalite(code) {
    return INTERCOMMUNALITES[code]?.communes || [];
}

// Fonction pour obtenir le nom d'une intercommunalitÃ©
function getNomIntercommunalite(code) {
    return INTERCOMMUNALITES[code]?.nom || code;
}

// Rendre disponible globalement
if (typeof window !== 'undefined') {
    window.INTERCOMMUNALITES = INTERCOMMUNALITES;
    window.getCommunesIntercommunalite = getCommunesIntercommunalite;
    window.getNomIntercommunalite = getNomIntercommunalite;
}
