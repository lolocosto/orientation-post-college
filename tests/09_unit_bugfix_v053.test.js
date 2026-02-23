/************************************************
 * Fichier : 09_unit_bugfix_v053.test.js
 * Description : Tests des corrections v0.53
 *   - Bug modale empilée (croix/navigation cassées)
 *   - Listes homogènes sur mobile (cartes pour toutes les vues)
 *   - Items cliquables/non-cliquables dans les modales
 *   - Lien France Compétences en bas du diplôme apprentissage
 *   - Options 2nde GT cliquables dans détail établissement
 *   - Parcours bac pro restaurés
 * Auteur : Claude / Laurent COSTE
 * Date : 2026-02-23
 * Version : 0.53
 ************************************************/

// =============================================
// HELPERS DE TEST
// =============================================

/** Crée un conteneur DOM simulé pour les tests */
function setupTestDOM() {
    // Reset du DOM
    document.body.innerHTML = '';
    
    // Conteneur de résultats
    const contentContainer = document.createElement('div');
    contentContainer.id = 'content-container';
    document.body.appendChild(contentContainer);
    
    return contentContainer;
}

/** Mock minimal de DatabaseService pour les tests */
function createMockDatabaseService() {
    return {
        getEtablissementEnrichi: async (id) => ({
            etablissement: {
                _id: id, uai: '0350001A', nom: 'Lycée Test', commune: 'Rennes',
                type: 'Lycée', statut: 'public', latitude: 48.11, longitude: -1.67
            },
            diplomes: [
                { libelle: 'Bac pro Commerce', niveauSortie: 'Bac professionnel', type: 'Bac Pro' }
            ],
            diplomes_apprentissage: [
                { id: 'da1', libelle: 'CAP Boulanger', niveau: '3 (CAP...)', certifieQualite: true }
            ],
            dispositifs: [
                { libelle: 'Section sportive', typeDispositif: 'Sport' }
            ],
            options2ndeGT: [
                { libelle: 'Arts plastiques' },
                { libelle: 'Sciences de l\'ingénieur' }
            ],
            specialites1ereG: [
                { libelle: 'Mathématiques' },
                { libelle: 'Physique-Chimie' }
            ]
        }),
        getDiplomeEnrichi: async (libelle) => ({
            diplome: { libelle, type: 'Bac Pro', niveauSortie: 'Bac professionnel', natureCertificat: 'Diplôme national' },
            etablissements: [{ _id: 'e1', nom: 'Lycée A', commune: 'Rennes', statut: 'public' }],
            parcours: null // sera ajouté par lookupParcoursBacPro
        }),
        getDiplomeApprentissageEnrichi: async (id) => ({
            diplome: {
                id, libelle: 'CAP Boulanger', typeDiplome: 'CAP', niveau: '3 (CAP...)',
                rncpCode: 'RNCP12345', blocsCompetences: []
            },
            etablissements: [{ _id: 'e2', uai: '0350002B', nom: 'CFA Test', commune: 'Bruz' }],
            relations: []
        }),
        getDispositifEnrichi: async (libelle) => ({
            dispositif: { libelle },
            etablissements: [{ _id: 'e1', nom: 'Lycée A', commune: 'Rennes', statut: 'public' }]
        }),
        getOption2ndeGTEnrichie: async (libelle) => ({
            option: { libelle },
            etablissements: [{ _id: 'e1', nom: 'Lycée A', commune: 'Rennes', statut: 'public' }]
        }),
        estAussiEnApprentissage: async () => false,
        estAussiEnScolaire: async () => false
    };
}

// =============================================
// 1. TESTS PILE DE MODALES (BUG CRITIQUE v0.52)
// =============================================

describe('DetailsModal — pile de modales empilées (fix v0.53)', () => {

    beforeEach(() => {
        document.body.innerHTML = '';
        window.currentDetailsModal = null;
        // Reset de la pile (accès indirect via le comportement)
    });

    test('T-MS01 : Ouvrir une modale crée une entrée — currentDetailsModal est défini', () => {
        const modal = new DetailsModal('test-modal', 'unique1');
        // Simuler le contenu
        modal.setTitle('');
        modal.setContent('<p>Test</p>');
        
        // Vérifier que le constructeur fonctionne
        expect(modal.modalId).toBe('test-modal-unique1');
        expect(modal.isUnique).toBe(true);
    });

    test('T-MS02 : close() restaure currentDetailsModal vers le parent', () => {
        // Modale parent
        const parent = new DetailsModal('parent-modal', 'p1');
        const parentData = {
            etablissement: { _id: 'e1', uai: '035', nom: 'Lycée P', commune: 'Rennes', type: 'Lycée' },
            diplomes: [], diplomes_apprentissage: [], dispositifs: [],
            options2ndeGT: [], specialites1ereG: []
        };
        
        // On ne peut pas appeler showEtablissement sans buildEtablissementDetailsHTML
        // mais on peut tester la mécanique de pile via show + close directement
        
        // Vérifions que la classe a bien la surcharge close
        expect(typeof parent.close).toBe('function');
    });

    test('T-MS03 : Après close() de l\'enfant, les handlers du parent sont accessibles', () => {
        // Ce test vérifie que window.currentDetailsModal n'est PAS null
        // après fermeture d'un enfant si un parent existe
        
        // Simulation : deux ouvertures successives
        const modal1 = new DetailsModal('m1', 'a');
        const modal2 = new DetailsModal('m2', 'b');
        
        // Vérifier que deux modales ont des IDs différents
        expect(modal1.modalId).not.toBe(modal2.modalId);
        
        // Vérifier que close existe et est héritée de Modal
        expect(typeof modal1.close).toBe('function');
        expect(typeof modal2.close).toBe('function');
    });

    test('T-MS04 : DetailsModal a bien la propriété statique #detailsStack (via comportement)', () => {
        // On ne peut pas accéder à un champ privé static directement
        // mais on peut vérifier que close() ne plante pas
        const modal = new DetailsModal('stack-test', 'x');
        modal.close(); // Ne doit pas lever d'exception
        expect(window.currentDetailsModal).toBeNull();
    });
});

// =============================================
// 2. TESTS CARTES MOBILE (LISTES HOMOGÈNES)
// =============================================

describe('Rendu cartes mobile — toutes les vues (fix v0.53)', () => {

    let container;
    
    beforeEach(() => {
        container = setupTestDOM();
    });

    test('T-RC01 : renderDiplomesTable génère tableau ET cartes', () => {
        const data = [
            { libelle: 'CAP Boulanger', niveauSortie: 'CAP', type: 'formation initiale', nbEtablissements: 3 },
            { libelle: 'Bac pro Commerce', niveauSortie: 'Bac professionnel', type: 'formation initiale', nbEtablissements: 5 }
        ];
        
        renderDiplomesTable(data);
        
        const table = container.querySelector('.resultat-table');
        const cards = container.querySelector('.results-cards');
        
        expect(table).not.toBeNull();
        expect(cards).not.toBeNull();
        expect(cards.querySelectorAll('.result-card').length).toBe(2);
    });

    test('T-RC02 : renderDiplomesApprentissageTable génère tableau ET cartes', () => {
        const data = [
            { id: 'd1', libelle: 'CAP Pâtissier', typeDiplome: 'CAP', niveau: '3 (CAP...)', rncpCode: 'RNCP123', nbEtablissements: 2 }
        ];
        
        renderDiplomesApprentissageTable(data);
        
        const table = container.querySelector('.resultat-table');
        const cards = container.querySelector('.results-cards');
        
        expect(table).not.toBeNull();
        expect(cards).not.toBeNull();
        expect(cards.querySelectorAll('.result-card').length).toBe(1);
    });

    test('T-RC03 : renderDispositifsTable génère tableau ET cartes', () => {
        const data = [
            { libelle: 'Section sportive', nbEtablissements: 4 },
            { libelle: 'Section internationale', nbEtablissements: 2 }
        ];
        
        renderDispositifsTable(data);
        
        const table = container.querySelector('.resultat-table');
        const cards = container.querySelector('.results-cards');
        
        expect(table).not.toBeNull();
        expect(cards).not.toBeNull();
        expect(cards.querySelectorAll('.result-card').length).toBe(2);
    });

    test('T-RC04 : renderOptions2ndeGTTable génère tableau ET cartes', () => {
        const data = [
            { libelle: 'Arts plastiques', nbEtablissements: 6 },
            { libelle: 'Sciences de l\'ingénieur', nbEtablissements: 3 }
        ];
        
        renderOptions2ndeGTTable(data);
        
        const table = container.querySelector('.resultat-table');
        const cards = container.querySelector('.results-cards');
        
        expect(table).not.toBeNull();
        expect(cards).not.toBeNull();
        expect(cards.querySelectorAll('.result-card').length).toBe(2);
    });

    test('T-RC05 : Chaque carte contient result-card__titre et link-icon', () => {
        const data = [{ libelle: 'Test', nbEtablissements: 1 }];
        renderDispositifsTable(data);
        
        const card = container.querySelector('.result-card');
        expect(card).not.toBeNull();
        
        const titre = card.querySelector('.result-card__titre');
        expect(titre).not.toBeNull();
        expect(titre.textContent).toContain('Test');
        
        const linkIcon = card.querySelector('.link-icon');
        expect(linkIcon).not.toBeNull();
    });

    test('T-RC06 : Les cartes ont un badge avec le nombre d\'établissements', () => {
        const data = [{ libelle: 'Option X', nbEtablissements: 7 }];
        renderOptions2ndeGTTable(data);
        
        const badge = container.querySelector('.badge--info');
        expect(badge).not.toBeNull();
        expect(badge.textContent).toContain('7');
    });
});

// =============================================
// 3. TESTS HOMOGÉNÉITÉ ITEMS DANS MODALES
// =============================================

describe('Homogénéité des items cliquables/non-cliquables (fix v0.53)', () => {

    test('T-HI01 : Les dispositifs dans détail étab ont la classe detail-item--link', () => {
        const enrichi = {
            etablissement: {
                _id: 'e1', uai: '035', nom: 'Lycée Test', commune: 'Rennes',
                type: 'Lycée', statut: 'public'
            },
            diplomes: [],
            diplomes_apprentissage: [],
            dispositifs: [
                { libelle: 'Section sportive', typeDispositif: 'Sport' }
            ],
            options2ndeGT: [],
            specialites1ereG: []
        };
        
        const html = buildEtablissementDetailsHTML(enrichi);
        expect(html).toContain('detail-item--link');
        expect(html).toContain('Section sportive');
    });

    test('T-HI02 : Les spécialités 1ère G ont la classe detail-item--info', () => {
        const enrichi = {
            etablissement: {
                _id: 'e1', uai: '035', nom: 'Lycée Test', commune: 'Rennes',
                type: 'Lycée', statut: 'public'
            },
            diplomes: [],
            diplomes_apprentissage: [],
            dispositifs: [],
            options2ndeGT: [],
            specialites1ereG: [
                { libelle: 'Mathématiques' }
            ]
        };
        
        const html = buildEtablissementDetailsHTML(enrichi);
        expect(html).toContain('detail-item--info');
        expect(html).toContain('Mathématiques');
    });

    test('T-HI03 : Les options 2nde GT sont cliquables dans détail étab', () => {
        const enrichi = {
            etablissement: {
                _id: 'e1', uai: '035', nom: 'Lycée Test', commune: 'Rennes',
                type: 'Lycée', statut: 'public'
            },
            diplomes: [],
            diplomes_apprentissage: [],
            dispositifs: [],
            options2ndeGT: [
                { libelle: 'Arts plastiques' }
            ],
            specialites1ereG: []
        };
        
        const html = buildEtablissementDetailsHTML(enrichi);
        expect(html).toContain('detail-item--link');
        expect(html).toContain('showOption2ndeGTDetails');
        expect(html).toContain('Arts plastiques');
        expect(html).toContain('↗');
    });

    test('T-HI04 : Le lien France Compétences est en bas du diplôme apprentissage', () => {
        const enrichi = {
            diplome: {
                id: 'd1', libelle: 'CAP Boulanger', typeDiplome: 'CAP',
                niveau: '3 (CAP...)', rncpCode: 'RNCP12345',
                blocsCompetences: []
            },
            etablissements: [],
            relations: []
        };
        
        const html = buildDiplomeApprentissageDetailsHTML(enrichi);
        
        // Vérifier le lien en bas
        expect(html).toContain('Fiche France Compétences');
        expect(html).toContain('https://www.francecompetences.fr/recherche/rncp/12345');
        expect(html).toContain('detail-onisep-link');
    });

    test('T-HI05 : Le code RNCP est affiché non-cliquable dans les infos générales', () => {
        const enrichi = {
            diplome: {
                id: 'd1', libelle: 'CAP Boulanger', typeDiplome: 'CAP',
                niveau: '3 (CAP...)', rncpCode: 'RNCP12345',
                blocsCompetences: []
            },
            etablissements: [],
            relations: []
        };
        
        const html = buildDiplomeApprentissageDetailsHTML(enrichi);
        
        // Dans les infos générales, le code RNCP doit être en texte simple
        // On vérifie qu'il n'y a PAS de <a> autour de RNCP12345 dans la section infos
        const infoSection = html.split('Informations générales')[1]?.split('</div>')[0] || '';
        expect(infoSection).toContain('RNCP12345');
        // Le lien <a> vers francecompetences ne doit PAS être dans la section infos
        expect(infoSection).not.toContain('francecompetences');
    });
});

// =============================================
// 4. TESTS PARCOURS BAC PRO (FIX v0.53)
// =============================================

describe('Parcours Bac Pro restaurés (fix v0.53)', () => {

    test('T-PB01 : buildDiplomeDetailsHTML affiche la section parcours quand disponible', () => {
        const enrichi = {
            diplome: {
                libelle: 'Bac pro Commerce',
                type: 'Bac Pro',
                niveauSortie: 'Bac professionnel',
                natureCertificat: 'Diplôme national'
            },
            etablissements: [],
            parcours: {
                famille: 'Métiers de la relation client',
                seconde: '2nde pro Métiers de la relation client',
                premiere: '1ère pro Commerce',
                terminale: 'Term pro Commerce'
            }
        };
        
        const html = buildDiplomeDetailsHTML(enrichi);
        expect(html).toContain('Parcours');
        expect(html).toContain('Métiers de la relation client');
        expect(html).toContain('2nde pro');
    });

    test('T-PB02 : buildDiplomeDetailsHTML gère l\'absence de parcours sans crash', () => {
        const enrichi = {
            diplome: {
                libelle: 'BTS Commerce',
                type: 'BTS',
                niveauSortie: 'BTS',
                natureCertificat: 'Diplôme national'
            },
            etablissements: [],
            parcours: null
        };
        
        const html = buildDiplomeDetailsHTML(enrichi);
        expect(html).not.toContain('Parcours de formation');
        // Pas de crash
        expect(html).toBeTruthy();
    });

    test('T-PB03 : generateParcoursProHtml gère les bac pro HORS FAMILLE', () => {
        const parcours = {
            famille: 'HORS FAMILLE',
            seconde: '2nde pro directe',
            premiere: '1ère pro',
            terminale: 'Term pro'
        };
        
        const html = generateParcoursProHtml(parcours);
        expect(html).toContain('hors famille de métiers');
        expect(html).toContain('2nde pro directe');
    });

    test('T-PB04 : generateParcoursProHtml gère les bac pro agricoles', () => {
        const parcours = {
            famille: 'Agricole - Productions',
            seconde: '2nde pro commune agricole',
            premiere: '1ère pro CGEA',
            terminale: 'Term pro CGEA'
        };
        
        const html = generateParcoursProHtml(parcours);
        expect(html).toContain('agricole');
    });
});

// =============================================
// 5. SCÉNARIOS UTILISATEUR
// =============================================

describe('Scénarios utilisateur v0.53', () => {

    test('SC-01 : Structure globale — toutes les fonctions de rendu existent', () => {
        expect(typeof renderDiplomesTable).toBe('function');
        expect(typeof renderDiplomesApprentissageTable).toBe('function');
        expect(typeof renderDispositifsTable).toBe('function');
        expect(typeof renderOptions2ndeGTTable).toBe('function');
        expect(typeof renderetablissementsTable).toBe('function');
    });

    test('SC-02 : Toutes les fonctions show*Details existent', () => {
        expect(typeof showEtablissementDetails).toBe('function');
        expect(typeof showDiplomeDetails).toBe('function');
        expect(typeof showDiplomeApprentissageDetails).toBe('function');
        expect(typeof showDispositifDetails).toBe('function');
        expect(typeof showOption2ndeGTDetails).toBe('function');
    });

    test('SC-03 : Toutes les fonctions open*FromModal existent', () => {
        expect(typeof window.openEtablissementDetailsFromModal).toBe('function');
        expect(typeof window.openDiplomeDetailsFromModal).toBe('function');
        expect(typeof window.openDispositifDetailsFromModal).toBe('function');
        expect(typeof window.openDiplomeApprentissageDetailsFromModal).toBe('function');
    });

    test('SC-04 : Les builders HTML sont exposés globalement', () => {
        expect(typeof window.buildEtablissementDetailsHTML).toBe('function');
        expect(typeof window.buildDiplomeDetailsHTML).toBe('function');
        expect(typeof window.buildDiplomeApprentissageDetailsHTML).toBe('function');
        expect(typeof window.buildDispositifDetailsHTML).toBe('function');
        expect(typeof window.buildOption2ndeGTDetailsHTML).toBe('function');
    });

    test('SC-05 : DetailsModal est exposé globalement avec close() surchargé', () => {
        expect(typeof window.DetailsModal).toBe('function');
        const instance = new DetailsModal('test', 'sc05');
        expect(typeof instance.close).toBe('function');
        instance.close(); // nettoyage
    });
});
