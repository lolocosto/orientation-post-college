/************************************************
 * Fichier : carif_oref_parser.js
 * Description : Parsers pour les données CARIF-OREF (apprentissage)
 * Auteur : Laurent COSTE
 * Date : 2026-02-20
 * Version : 2.0
 *
 * Deux parsers distincts selon la source API :
 *
 *   parseEtablissements(rawEtabs[])
 *     Source : /api/v1/entity/etablissements
 *     Champs directs (sans préfixe). Produit des objets établissement
 *     alignés avec la structure OnisepParser.parseStructures().
 *
 *   parseFormations(rawFormations[])
 *     Source : /api/v1/entity/formations
 *     Produit :
 *       - diplomesApprentissage[]               clé : rncp_code (ou intitule_long)
 *       - diplomesApprentissage_par_etablissement[]  clé : id + rncp_code + uai
 *
 * Les établissements ne sont PAS extraits depuis /formations :
 * on utilise exclusivement les données riches de /etablissements.
 ************************************************/

class CARIFOREFParser {

    // =====================================
    // SCHÉMAS DE VALIDATION (documentation)
    // =====================================

    // Champs attendus dans un objet /etablissements
    static #SCHEMA_ETABLISSEMENT = [
        'uai', 'siret', 'enseigne', 'onisep_nom', 'entreprise_raison_sociale',
        'adresse', 'code_postal', 'localite', 'code_insee_localite',
        'geo_coordonnees', 'nom_academie', 'num_departement', 'nom_departement',
        'region_implantation_nom', 'certifie_qualite', 'ferme', 'entreprise_ferme'
    ];

    // Champs attendus dans un objet /formations
    static #SCHEMA_FORMATION = [
        'etablissement_formateur_uai',
        'rncp_code', 'intitule_long', 'diplome', 'niveau',
        'lieu_formation_geo_coordonnees', 'code_commune_insee',
        'id', 'published', 'rncp_eligible_apprentissage', 'cfd_outdated'
    ];

    // =====================================
    // PARSER ÉTABLISSEMENTS
    // =====================================

    /**
     * Parse un tableau d'établissements bruts depuis /etablissements CARIF-OREF.
     *
     * Produit des objets alignés avec la structure OnisepParser.parseStructures()
     * pour permettre la fusion dans la table etablissements commune.
     *
     * @param {Object[]} rawEtabs - Établissements bruts API
     * @param {boolean} validate - Avertissement console si champs manquants (défaut: true)
     * @returns {Object[]} Tableau d'établissements normalisés
     */
    static parseEtablissements(rawEtabs, validate = true) {
        if (!rawEtabs || rawEtabs.length === 0) return [];

        if (validate) {
            this._validateFields(rawEtabs[0], this.#SCHEMA_ETABLISSEMENT, 'établissement');
        }

        const etablissements = [];
        for (const e of rawEtabs) {
            const parsed = this._parseEtablissement(e);
            if (parsed) etablissements.push(parsed);
        }

        console.log(`[CARIFOREFParser] parseEtablissements : ${etablissements.length}/${rawEtabs.length} parsés`);
        return etablissements;
    }

    /**
     * Parse un établissement individuel depuis /etablissements
     * @private
     */
    static _parseEtablissement(e) {
        // UAI obligatoire
        const uai = (e.uai || '').trim() || null;
        if (!uai) return null;

        // Nom : priorité onisep_nom > enseigne > entreprise_raison_sociale
        const nom = (e.onisep_nom       || '').trim()
                 || (e.enseigne         || '').trim()
                 || (e.entreprise_raison_sociale || '').trim()
                 || null;

        // Coordonnées depuis geo_coordonnees "lat,lon"
        const geoCoords = this._parseGeoCoords(e.geo_coordonnees);

        return {
            // ── Identification ──────────────────────────────────────────
            uai,
            siret:    (e.siret || '').trim() || null,
            nom,
            sigle:    null,   // Non fourni par CARIF-OREF
            type:     null,   // naf_libelle est trop générique

            // ── Statut et tutelle ────────────────────────────────────────
            statut:   null,
            tutelle:  null,

            // ── Adresse ──────────────────────────────────────────────────
            // On utilise les champs structurés de /etablissements (pas lieu_formation_*)
            adresse:       this._buildAdresse(e),
            boitePostale:  null,
            codePostal:    (e.code_postal || e.rco_code_postal || '').trim() || null,
            commune:       (e.localite    || '').trim() || null,
            codeCommuneCOG: (e.code_insee_localite || e.rco_code_insee_localite || '').trim() || null,
            cedex:         (e.cedex || '').trim() || null,
            arrondissement: null,
            departement:   (e.nom_departement || '').trim() || null,
            academie:      (e.nom_academie    || '').trim() || null,
            region:        (e.region_implantation_nom || '').trim() || null,
            regionCOG:     (e.region_implantation_code || '').trim() || null,

            // ── Géolocalisation ──────────────────────────────────────────
            latitude:  geoCoords.lat,
            longitude: geoCoords.lon,

            // ── Contact ──────────────────────────────────────────────────
            telephone: null,

            // ── Informations complémentaires ─────────────────────────────
            languesEnseignees:       null,
            journeesPortesOuvertes:  null,
            urlOnisep:  (e.onisep_url || '').trim() || null,

            // ── Dates ────────────────────────────────────────────────────
            dateCreation:      e.date_creation || null,
            dateModification:  e.last_update_at || null,

            // ── Spécifique apprentissage ─────────────────────────────────
            certifieQualite: !!e.certifie_qualite,
            nda:     (e.nda || '').trim() || null,

            // ── Voie ─────────────────────────────────────────────────────
            voies: ['apprentissage']
        };
    }

    /**
     * Construit une adresse lisible depuis les champs structurés de l'API.
     * Priorité : champs décomposés > champ adresse brut.
     * @private
     */
    static _buildAdresse(e) {
        const numVoie   = (e.numero_voie   || '').trim();
        const typeVoie  = (e.type_voie     || '').trim();
        const nomVoie   = (e.nom_voie      || '').trim();
        const complement = (e.complement_adresse || '').trim();

        const parts = [numVoie, typeVoie, nomVoie].filter(Boolean);
        if (parts.length > 0) {
            return [parts.join(' '), complement].filter(Boolean).join(', ') || null;
        }

        // Fallback : adresse brute (peut contenir la raison sociale en tête)
        return (e.adresse || '').trim() || null;
    }

    // =====================================
    // PARSER FORMATIONS → DIPLÔMES
    // =====================================

    /**
     * Parse un tableau de formations brutes depuis /formations CARIF-OREF.
     *
     * Produit :
     *   - diplomesApprentissage[] : diplômes uniques (clé : rncp_code ou intitule_long)
     *   - diplomesApprentissage_par_etablissement[] : relations diplôme ↔ établissement
     *
     * NB : Les établissements ne sont PAS extraits ici.
     *      Utiliser parseEtablissements() avec les données de /etablissements.
     *
     * @param {Object[]} rawFormations - Formations brutes API
     * @param {boolean} validate
     * @returns {{
     *   diplomesApprentissage: Object[],
     *   diplomesApprentissage_par_etablissement: Object[]
     * }}
     */
    static parseFormations(rawFormations, validate = true) {
        if (!rawFormations || rawFormations.length === 0) {
            return { diplomesApprentissage: [], diplomesApprentissage_par_etablissement: [] };
        }

        if (validate) {
            this._validateFields(rawFormations[0], this.#SCHEMA_FORMATION, 'formation');
        }

        const result = {
            diplomesApprentissage: [],
            diplomesApprentissage_par_etablissement: []
        };

        for (const f of rawFormations) {
            const parsed = this._parseFormation(f);
            if (parsed.diplome)   result.diplomesApprentissage.push(parsed.diplome);
            if (parsed.relation)  result.diplomesApprentissage_par_etablissement.push(parsed.relation);
        }

        console.log(`[CARIFOREFParser] parseFormations : ${result.diplomesApprentissage.length} diplômes, `
            + `${result.diplomesApprentissage_par_etablissement.length} relations`);
        return result;
    }

    /**
     * Parse une formation individuelle → diplôme + relation
     * @private
     */
    static _parseFormation(f) {
        const result = { diplome: null, relation: null };

        const uai        = (f.etablissement_formateur_uai || '').trim() || null;
        const idRelation = (f.id || f._id || '').trim() || null;

        // Clé diplôme : rncp_code si disponible, sinon intitule_long normalisé
        const rncpCode  = (f.rncp_code || '').trim() || null;
        const libelle   = (f.intitule_long || f.intitule_court || '').trim() || null;
        const cleDiplome = rncpCode || (libelle ? this._normaliserLibelle(libelle) : null);

        if (!cleDiplome || !libelle) return result;

        // ── Diplôme ────────────────────────────────────────────────────────
        result.diplome = {
            // Clé primaire
            id:          cleDiplome,
            rncpCode,

            // Libellés
            libelle,
            libelleCourt:  (f.intitule_court || '').trim() || null,
            rncpIntitule:  (f.rncp_intitule  || '').trim() || null,

            // Catégorie
            typeDiplome: (f.diplome || '').trim() || null,
            niveau:      (f.niveau  || '').trim() || null,
            cfd:         (f.cfd     || '').trim() || null,

            // Lien ONISEP si disponible
            onisepUrl:      (f.onisep_url     || '').trim() || null,
            onisepIntitule: (f.onisep_intitule || '').trim() || null,

            // Description et blocs de compétences
            contenu:          (f.contenu || '').trim() || null,
            blocsCompetences: Array.isArray(f.blocs_competences) ? f.blocs_competences : [],

            // Libellé normalisé pour jointure avec diplômes ONISEP
            libelleNormalise: this._normaliserLibelle(libelle)
        };

        // ── Relation diplôme ↔ établissement ──────────────────────────────
        if (uai && idRelation) {
            const geoCoords = this._parseGeoCoords(f.lieu_formation_geo_coordonnees);

            result.relation = {
                // Clé primaire de la relation
                id: idRelation,

                // Clés étrangères
                diplomId: cleDiplome,
                uai,

                // Lieu de formation (peut différer du siège)
                lieuAdresse:       (f.lieu_formation_adresse || '').trim() || null,
                lieuCodeCommune:   (f.code_commune_insee || '').trim() || null,
                lieuLatitude:      geoCoords.lat,
                lieuLongitude:     geoCoords.lon,

                // Métadonnées
                published: !!f.published
            };
        }

        return result;
    }

    // =====================================
    // UTILITAIRES
    // =====================================

    /**
     * Normalise un libellé pour la jointure ONISEP ↔ CARIF-OREF.
     * Ex: "CAP Menuisier installateur" → "cap menuisier installateur"
     * @param {string} libelle
     * @returns {string}
     */
    static _normaliserLibelle(libelle) {
        if (!libelle) return '';
        return libelle
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // supprimer accents
            .replace(/[^a-z0-9 ]/g, ' ')     // remplacer ponctuation par espace
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Parse les coordonnées géographiques au format "lat,lon"
     * @param {string|null} geoString - Ex: "48.1173,-1.6778"
     * @returns {{ lat: number|null, lon: number|null }}
     */
    static _parseGeoCoords(geoString) {
        if (!geoString || typeof geoString !== 'string') return { lat: null, lon: null };
        const parts = geoString.split(',');
        if (parts.length !== 2) return { lat: null, lon: null };
        const lat = parseFloat(parts[0]);
        const lon = parseFloat(parts[1]);
        if (isNaN(lat) || isNaN(lon)) return { lat: null, lon: null };
        return { lat, lon };
    }

    /**
     * Valide la présence des champs attendus (avertissement console seulement)
     * @param {Object} sample - Premier enregistrement
     * @param {string[]} expectedFields
     * @param {string} context - Nom pour le log
     */
    static _validateFields(sample, expectedFields, context = '') {
        const missing = expectedFields.filter(f => !(f in sample));
        if (missing.length > 0) {
            console.warn(
                `[CARIFOREFParser] ⚠️ Champs manquants (${context}) :`,
                missing
            );
        }
    }
}

if (typeof window !== 'undefined') {
    window.CARIFOREFParser = CARIFOREFParser;
}
