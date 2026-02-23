/**
 * Service d'export des données en PDF et CSV
 * v0.35 — Page de titre, sommaire, pagination, sans emojis, CEDEX, nommage
 */

class ExportService {

    // =========================================================================
    // EXPORT CSV
    // =========================================================================

        /**
         * Exporte les données de la vue active vers un fichier CSV téléchargeable.
         * @param {string} viewName - Nom de la vue active ('etablissements', 'diplomes', etc.)
         * @param {Object[]} data - Données à exporter
         * @returns {void}
         */
static exportToCSV(viewName, data) {
        if (!data || data.length === 0) { showAlert('Aucune donnée à exporter', 'warning'); return; }

        let csv = '', filename = '';
        switch (viewName) {
            case 'etablissements': csv = this.#generateEtablissementsCSV(data); filename = 'etablissements.csv'; break;
            case 'diplomes':       csv = this.#generateDiplomesCSV(data);       filename = 'diplomes.csv'; break;
            case 'dispositifs':    csv = this.#generateDispositifsCSV(data);    filename = 'dispositifs.csv'; break;
            default: showAlert('Type d\'export non supporté', 'error'); return;
        }
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
        this.#downloadFile(blob, filename);
    }

        /**
         * Génère le contenu CSV pour la vue Établissements.
         * @private
         * @param {Object[]} data - Tableau des établissements
         * @returns {string} Contenu CSV (UTF-8 BOM inclus)
         */
static #generateEtablissementsCSV(data) {
        const headers = ['Nom', 'UAI', 'Type', 'Statut', 'Commune', 'Code Postal', 'Département', 'Académie'];
        let csv = headers.join(';') + '\n';
        data.forEach(etab => {
            csv += [
                this.#escapeCSV(etab.nom || ''),
                this.#escapeCSV(etab.uai || ''),
                this.#escapeCSV(etab.type || ''),
                this.#escapeCSV(etab.statut || ''),
                this.#escapeCSV(etab.commune || ''),
                this.#escapeCSV(etab.codePostal || ''),
                this.#escapeCSV(etab.departement || ''),
                this.#escapeCSV(etab.academie || '')
            ].join(';') + '\n';
        });
        return csv;
    }

        /**
         * Génère le contenu CSV pour la vue Diplômes.
         * @private
         * @param {Object[]} data
         * @returns {string} Contenu CSV
         */
static #generateDiplomesCSV(data) {
        const headers = ['Libellé', 'Type', 'Niveau', 'Nb Établissements'];
        let csv = headers.join(';') + '\n';
        data.forEach(diplome => {
            csv += [
                this.#escapeCSV(diplome.libelle || ''),
                this.#escapeCSV(diplome.type || ''),
                this.#escapeCSV(diplome.niveauSortie || ''),
                this.#escapeCSV(String(diplome.nbEtablissements || 0))
            ].join(';') + '\n';
        });
        return csv;
    }

        /**
         * Génère le contenu CSV pour la vue Dispositifs.
         * @private
         * @param {Object[]} data
         * @returns {string} Contenu CSV
         */
static #generateDispositifsCSV(data) {
        const headers = ['Libellé', 'Type', 'Nb Établissements'];
        let csv = headers.join(';') + '\n';
        data.forEach(dispositif => {
            csv += [
                this.#escapeCSV(dispositif.libelle || ''),
                this.#escapeCSV(dispositif.typeDispositif || ''),
                this.#escapeCSV(String(dispositif.nbEtablissements || 0))
            ].join(';') + '\n';
        });
        return csv;
    }

        /**
         * Échappe une valeur pour l'inclusion dans une cellule CSV.
         * Encadre de guillemets si la valeur contient une virgule, un guillemet ou un saut de ligne.
         * @private
         * @param {*} value - Valeur à échapper
         * @returns {string}
         */
static #escapeCSV(value) {
        const str = String(value ?? '');
        if (str.includes(';') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }

    // =========================================================================
    // EXPORT PDF
    // =========================================================================

        /**
         * Exporte les données de la vue active vers un fichier PDF téléchargeable.
         * Utilise jsPDF. Génère une page de titre, une table des matières et des fiches enrichies.
         * @param {string} viewName - Nom de la vue active
         * @param {Object[]} data - Données à exporter
         * @returns {Promise<void>}
         */
static async exportToPDF(viewName, data) {
        if (!data || data.length === 0) { showAlert('Aucune donnée à exporter', 'warning'); return; }
        if (typeof window.jspdf === 'undefined') { showAlert('Bibliothèque PDF non chargée. Rechargez la page.', 'error'); return; }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });

        const dateStr = new Date().toLocaleDateString('fr-FR');
        const viewLabels = {
            'etablissements': 'Liste des Établissements',
            'diplomes':       'Liste des Diplômes',
            'dispositifs':    'Liste des Dispositifs',
            'options':        'Liste des Options de 2nde GT'
        };
        const viewLabel = viewLabels[viewName] || 'Export';

        // ── Page de titre ──────────────────────────────────────────────────
        this.#drawTitlePage(doc, 'Orientation post-college', viewLabel, dateStr, data.length);

        // ── Sommaire ───────────────────────────────────────────────────────
        const tocEntries = [];
        if (viewName === 'etablissements') {
            // On collecte les noms pour le sommaire (numéros de page calculés après)
            data.forEach((etab, i) => tocEntries.push({ label: etab.nom || 'Sans nom', page: i + 3 }));
        }
        doc.addPage();
        this.#drawTOC(doc, tocEntries, viewLabel, dateStr);

        // ── Contenu ────────────────────────────────────────────────────────
        if (viewName === 'etablissements') {
            await this.#generateEnrichedEtablissementsPDF(doc, data, dateStr);
        } else if (viewName === 'diplomes') {
            await this.#generateEnrichedDiplomesPDF(doc, data, dateStr);
        } else if (viewName === 'dispositifs') {
            await this.#generateEnrichedDispositifsPDF(doc, data, dateStr);
        }

        // Nom de fichier avec date
        const dateFile = new Date().toISOString().slice(0, 10);
        doc.save(`export_${viewName}_${dateFile}.pdf`);
    }

    // =========================================================================
    // PAGE DE TITRE
    // =========================================================================

        /**
         * Dessine la page de titre du PDF.
         * @private
         * @param {jsPDF} doc
         * @param {string} mainTitle
         * @param {string} subTitle
         * @param {string} dateStr
         * @param {number} count - Nombre d'enregistrements
         */
static #drawTitlePage(doc, mainTitle, subTitle, dateStr, count) {
        const W = doc.internal.pageSize.getWidth();
        const H = doc.internal.pageSize.getHeight();

        // Fond bleu foncé sur toute la page
        doc.setFillColor(46, 80, 144);
        doc.rect(0, 0, W, H, 'F');

        // Titre principal centré verticalement
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(36);
        doc.text(mainTitle, W / 2, H / 2 - 15, { align: 'center' });

        // Sous-titre
        doc.setFontSize(16);
        doc.setFont('helvetica', 'normal');
        doc.text(subTitle, W / 2, H / 2 + 5, { align: 'center' });

        // Nb résultats
        doc.setFontSize(12);
        doc.text(`${count} resultat(s)`, W / 2, H / 2 + 18, { align: 'center' });

        // Date en bas à droite (pas de pagination sur la page de titre)
        doc.setFontSize(10);
        doc.text(`Genere le ${dateStr}`, W - 14, H - 12, { align: 'right' });

        // Reset couleur texte
        doc.setTextColor(0, 0, 0);
    }

    // =========================================================================
    // SOMMAIRE
    // =========================================================================

        /**
         * Dessine la table des matières du PDF.
         * @private
         * @param {jsPDF} doc
         * @param {Array<{label:string, page:number}>} entries - Entrées de la TDM
         * @param {string} title
         * @param {string} dateStr
         */
static #drawTOC(doc, entries, title, dateStr) {
        const W = doc.internal.pageSize.getWidth();
        let y = 20;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('Sommaire', 14, y);
        y += 10;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(title, 14, y);
        y += 10;
        doc.setTextColor(0, 0, 0);

        // Ligne séparatrice
        doc.setDrawColor(46, 80, 144);
        doc.setLineWidth(0.5);
        doc.line(14, y, W - 14, y);
        y += 6;

        doc.setFontSize(10);
        entries.forEach((entry, idx) => {
            if (y > 270) {
                this.#addPageWithFooter(doc, dateStr);
                y = 20;
            }
            const label = this.#sanitize(entry.label);
            const pageStr = String(entry.page);

            // Libellé tronqué si trop long
            const maxW = W - 14 - 14 - 20;
            const labelLines = doc.splitTextToSize(label, maxW);
            doc.text(labelLines[0] + (labelLines.length > 1 ? '...' : ''), 14, y);

            // Numéro de page à droite
            doc.text(pageStr, W - 14, y, { align: 'right' });

            // Points de conduite
            const labelW = doc.getTextWidth(labelLines[0] + (labelLines.length > 1 ? '...' : ''));
            const pageW  = doc.getTextWidth(pageStr);
            let dotX = 14 + labelW + 2;
            const dotEndX = W - 14 - pageW - 2;
            doc.setTextColor(180, 180, 180);
            while (dotX < dotEndX) {
                doc.text('.', dotX, y);
                dotX += 2.5;
            }
            doc.setTextColor(0, 0, 0);

            y += 6;
        });

        // Pied de page du sommaire (page 2)
        this.#drawFooter(doc, 2, dateStr);
    }

    // =========================================================================
    // PIED DE PAGE
    // =========================================================================

        /**
         * Dessine le pied de page d'une page PDF.
         * @private
         * @param {jsPDF} doc
         * @param {number} pageNum - Numéro de la page
         * @param {string} dateStr
         */
static #drawFooter(doc, pageNum, dateStr) {
        const W = doc.internal.pageSize.getWidth();
        const H = doc.internal.pageSize.getHeight();

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);

        // Date en bas à gauche
        doc.text(`Genere le ${dateStr}`, 14, H - 8);

        // Numéro de page en bas à droite
        doc.text(`Page ${pageNum}`, W - 14, H - 8, { align: 'right' });

        doc.setTextColor(0, 0, 0);
    }

        /**
         * Ajoute une nouvelle page PDF avec pied de page.
         * @private
         * @param {jsPDF} doc
         * @param {string} dateStr
         * @returns {number} Ordinate Y de départ (marge haute)
         */
static #addPageWithFooter(doc, dateStr) {
        doc.addPage();
        const pageNum = doc.internal.getNumberOfPages();
        // Le footer sera ajouté en fin de traitement pour avoir le bon numéro
        // Pour l'instant on marque la page — on dessine en fin
        return pageNum;
    }

    /**
     * Ajoute les pieds de page sur toutes les pages sauf la 1 (titre)
     */
    static #finalizeFooters(doc, dateStr) {
        const total = doc.internal.getNumberOfPages();
        for (let p = 2; p <= total; p++) {
            doc.setPage(p);
            this.#drawFooter(doc, p, dateStr);
        }
    }

    // =========================================================================
    // SANITISATION (supprime les emojis et caractères non-Latin1)
    // =========================================================================

        /**
         * Remplace les caractères non-Latin1 pour compatibilité jsPDF (sans plugin UTF-8).
         * @private
         * @param {string} str
         * @returns {string}
         */
static #sanitize(str) {
        if (!str) return '';
        // Supprimer les emojis et caractères hors BMP (> U+FFFF)
        return str
            .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')   // emojis supplementaires
            .replace(/[\u{2600}-\u{27BF}]/gu, '')       // symboles divers
            .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')     // emojis classiques
            .trim();
    }

    // =========================================================================
    // HELPERS D'ÉCRITURE PDF
    // =========================================================================

        /**
         * Dessine un titre de section dans le PDF.
         * @private
         * @param {jsPDF} doc
         * @param {string} text
         * @param {number} y - Position verticale
         * @returns {number} Nouvelle position Y
         */
static #sectionTitle(doc, text, y) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(46, 80, 144);
        doc.text(this.#sanitize(text), 14, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        return y + 5;
    }

        /**
         * Dessine une ligne de puce dans le PDF, avec retour à la ligne automatique.
         * @private
         * @param {jsPDF} doc
         * @param {string} text
         * @param {number} y
         * @param {number} [indent=18]
         * @param {number} [maxW=170]
         * @returns {number} Nouvelle position Y
         */
static #bulletLine(doc, text, y, indent = 18, maxW = 170) {
        const lines = doc.splitTextToSize('- ' + this.#sanitize(text), maxW);
        doc.text(lines, indent, y);
        return y + 4 * lines.length;
    }

        /**
         * Dessine une ligne 'label : valeur' dans le PDF.
         * @private
         * @param {jsPDF} doc
         * @param {string} label
         * @param {string} value
         * @param {number} y
         * @param {number} [indent=22]
         * @returns {number} Nouvelle position Y
         */
static #subLine(doc, label, value, y, indent = 22) {
        if (!value) return y;
        const lines = doc.splitTextToSize(`${label}: ${this.#sanitize(value)}`, 165);
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(lines, indent, y);
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        return y + 3.5 * lines.length;
    }

        /**
         * Ajoute une nouvelle page si la position Y dépasse le seuil.
         * @private
         * @param {jsPDF} doc
         * @param {number} y - Position verticale courante
         * @param {string} dateStr
         * @param {number} [threshold=270] - Seuil en mm
         * @returns {number} Nouvelle position Y
         */
static #checkPage(doc, y, dateStr, threshold = 270) {
        if (y > threshold) {
            doc.addPage();
            return 20;
        }
        return y;
    }

    // Formate l'adresse avec CEDEX
        /**
         * Formate l'adresse complète d'un établissement en une ligne.
         * @private
         * @param {Object} etab - Objet établissement
         * @returns {string}
         */
static #formatAdresse(etab) {
        if (!etab.adresse) return '';
        let adr = etab.adresse;
        if (etab.codePostal) adr += ', ' + etab.codePostal;
        if (etab.cedex)      adr += ' CEDEX ' + etab.cedex;
        if (etab.commune)    adr += ' ' + etab.commune;
        return adr;
    }

    // =========================================================================
    // ÉTABLISSEMENTS — PDF ENRICHI
    // =========================================================================

        /**
         * Génère les pages du PDF pour la vue Établissements (fiche enrichie par établissement).
         * @private
         * @param {jsPDF} doc
         * @param {Object[]} data
         * @param {string} dateStr
         * @returns {Promise<Array<{label:string,page:number}>>} Entrées TDM
         */
static async #generateEnrichedEtablissementsPDF(doc, data, dateStr) {
        for (let i = 0; i < data.length; i++) {
            const etab = data[i];
            doc.addPage();
            let y = 20;

            const enrichi = await window.databaseService.getEtablissementEnrichi(etab.uai);
            if (!enrichi) continue;
            const e = enrichi.etablissement;

            // ── EN-TÊTE ──
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            const nomLines = doc.splitTextToSize(this.#sanitize(e.nom || 'Sans nom'), 180);
            doc.text(nomLines, 14, y);
            y += 6 * nomLines.length;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`UAI: ${e.uai || '-'} | ${this.#sanitize(e.type || '-')} | ${this.#sanitize(e.statut || '-')}`, 14, y);
            y += 5;

            const adr = this.#formatAdresse(e);
            if (adr) {
                const adrLines = doc.splitTextToSize(adr, 180);
                doc.text(adrLines, 14, y);
                y += 4.5 * adrLines.length;
            }

            // Ligne séparatrice
            doc.setDrawColor(46, 80, 144);
            doc.setLineWidth(0.3);
            doc.line(14, y, 196, y);
            y += 5;

            // ── DIPLÔMES ──
            if (enrichi.diplomes && enrichi.diplomes.length > 0) {
                y = this.#sectionTitle(doc, `Diplomes (${enrichi.diplomes.length})`, y);
                for (const diplome of enrichi.diplomes) {
                    y = this.#checkPage(doc, y, dateStr);
                    y = this.#bulletLine(doc, diplome.libelle, y);
                    if (diplome.modalites && diplome.modalites.length > 0) {
                        y = this.#subLine(doc, 'Modalites', diplome.modalites.join(', '), y);
                    }
                }
                y += 3;
            }

            // ── DISPOSITIFS ──
            if (enrichi.dispositifs && enrichi.dispositifs.length > 0) {
                y = this.#checkPage(doc, y, dateStr, 250);
                y = this.#sectionTitle(doc, `Dispositifs (${enrichi.dispositifs.length})`, y);
                for (const dispositif of enrichi.dispositifs) {
                    y = this.#checkPage(doc, y, dateStr);
                    y = this.#bulletLine(doc, dispositif.libelle, y);
                    y = this.#subLine(doc, 'Elements', dispositif.elementsDenseignement, y);
                    y = this.#subLine(doc, 'Modalites', dispositif.modalitesAccueil, y);
                    y = this.#subLine(doc, 'Sports', dispositif.sports, y);
                }
                y += 3;
            }

            // ── OPTIONS 2NDE GT ──
            if (enrichi.options2ndeGT && enrichi.options2ndeGT.length > 0) {
                y = this.#checkPage(doc, y, dateStr, 250);
                y = this.#sectionTitle(doc, `Options 2nde GT (${enrichi.options2ndeGT.length})`, y);
                for (const option of enrichi.options2ndeGT) {
                    y = this.#checkPage(doc, y, dateStr);
                    y = this.#bulletLine(doc, option.libelle || '', y);
                }
                y += 3;
            }

            // ── SPÉCIALITÉS 1ÈRE G ──
            if (enrichi.specialites1ereG && enrichi.specialites1ereG.length > 0) {
                y = this.#checkPage(doc, y, dateStr, 250);
                y = this.#sectionTitle(doc, `Specialites 1ere G (${enrichi.specialites1ereG.length})`, y);
                for (const spe of enrichi.specialites1ereG) {
                    y = this.#checkPage(doc, y, dateStr);
                    y = this.#bulletLine(doc, spe.libelle || '', y);
                }
            }
        }

        // Pieds de page sur toutes les pages sauf titre
        this.#finalizeFooters(doc, dateStr);
    }

    // =========================================================================
    // DIPLÔMES — PDF ENRICHI
    // =========================================================================

        /**
         * Génère les pages du PDF pour la vue Diplômes.
         * @private
         * @param {jsPDF} doc
         * @param {Object[]} data
         * @param {string} dateStr
         * @returns {Promise<Array<{label:string,page:number}>>}
         */
static async #generateEnrichedDiplomesPDF(doc, data, dateStr) {
        for (let i = 0; i < data.length; i++) {
            const diplome = data[i];
            doc.addPage();
            let y = 20;

            const enrichi = await window.databaseService.getDiplomeEnrichi(diplome.libelle);
            if (!enrichi) continue;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            const nomLines = doc.splitTextToSize(this.#sanitize(enrichi.diplome.libelle || 'Sans nom'), 180);
            doc.text(nomLines, 14, y);
            y += 6 * nomLines.length;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`${this.#sanitize(enrichi.diplome.niveauSortie || '-')} | ${this.#sanitize(enrichi.diplome.type || '-')}`, 14, y);
            y += 8;

            if (enrichi.etablissements && enrichi.etablissements.length > 0) {
                y = this.#sectionTitle(doc, `Etablissements (${enrichi.etablissements.length})`, y);
                for (const etab of enrichi.etablissements) {
                    y = this.#checkPage(doc, y, dateStr);
                    y = this.#bulletLine(doc, `${etab.nom} - ${etab.commune}`, y);
                    if (etab.modalites && etab.modalites.length > 0) {
                        y = this.#subLine(doc, 'Modalites', etab.modalites.join(', '), y);
                    }
                }
            }
        }
        this.#finalizeFooters(doc, dateStr);
    }

    // =========================================================================
    // DISPOSITIFS — PDF ENRICHI
    // =========================================================================

        /**
         * Génère les pages du PDF pour la vue Dispositifs.
         * @private
         * @param {jsPDF} doc
         * @param {Object[]} data
         * @param {string} dateStr
         * @returns {Promise<Array<{label:string,page:number}>>}
         */
static async #generateEnrichedDispositifsPDF(doc, data, dateStr) {
        for (let i = 0; i < data.length; i++) {
            const dispositif = data[i];
            doc.addPage();
            let y = 20;

            const enrichi = await window.databaseService.getDispositifEnrichi(dispositif.libelle);
            if (!enrichi) continue;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            const nomLines = doc.splitTextToSize(this.#sanitize(enrichi.dispositif.libelle || 'Sans nom'), 180);
            doc.text(nomLines, 14, y);
            y += 6 * nomLines.length;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            if (enrichi.dispositif.typeDispositif) {
                doc.text(this.#sanitize(enrichi.dispositif.typeDispositif), 14, y);
                y += 8;
            }

            if (enrichi.etablissements && enrichi.etablissements.length > 0) {
                y = this.#sectionTitle(doc, `Etablissements (${enrichi.etablissements.length})`, y);
                for (const etab of enrichi.etablissements) {
                    y = this.#checkPage(doc, y, dateStr);
                    y = this.#bulletLine(doc, `${etab.nom} - ${etab.commune}`, y);
                    y = this.#subLine(doc, 'Elements',  etab.elementsDenseignement, y);
                    y = this.#subLine(doc, 'Modalites', etab.modalitesAccueil, y);
                    y = this.#subLine(doc, 'Sports',    etab.sports, y);
                }
            }
        }
        this.#finalizeFooters(doc, dateStr);
    }

    // =========================================================================
    // UTILITAIRES
    // =========================================================================

        /**
         * Déclenche le téléchargement d'un Blob dans le navigateur.
         * @private
         * @param {Blob} blob
         * @param {string} filename - Nom du fichier proposé au téléchargement
         */
static #downloadFile(blob, filename) {
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

if (typeof window !== 'undefined') {
    window.ExportService = ExportService;
}
