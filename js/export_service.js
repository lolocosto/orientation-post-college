/**
 * Service d'export des données en PDF et CSV
 * v0.30
 */

class ExportService {
    /**
     * Exporte les données en CSV
     * @param {string} viewName - Vue courante ('etablissements', 'diplomes', 'dispositifs')
     * @param {Array} data - Données à exporter
     */
    static exportToCSV(viewName, data) {
        if (!data || data.length === 0) {
            alert('❌ Aucune donnée à exporter');
            return;
        }

        let csv = '';
        let filename = '';

        switch (viewName) {
            case 'etablissements':
                csv = this.#generateEtablissementsCSV(data);
                filename = 'etablissements.csv';
                break;
            case 'diplomes':
                csv = this.#generateDiplomesCSV(data);
                filename = 'diplomes.csv';
                break;
            case 'dispositifs':
                csv = this.#generateDispositifsCSV(data);
                filename = 'dispositifs.csv';
                break;
            default:
                alert('❌ Type d\'export non supporté');
                return;
        }

        // Ajouter BOM UTF-8 pour compatibilité Excel
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
        this.#downloadFile(blob, filename);
    }

    /**
     * Exporte les données en PDF
     * @param {string} viewName - Vue courante
     * @param {Array} data - Données à exporter
     */
    static async exportToPDF(viewName, data) {
        if (!data || data.length === 0) {
            alert('❌ Aucune donnée à exporter');
            return;
        }

        // Vérifier que jsPDF est chargé
        if (typeof window.jspdf === 'undefined') {
            alert('❌ Bibliothèque PDF non chargée');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const titre = {
            'etablissements': 'Liste des Établissements',
            'diplomes': 'Liste des Diplômes',
            'dispositifs': 'Liste des Dispositifs',
            'options': 'Liste des Options de 2nde GT'
        }[viewName] || 'Export';

        // Page de garde
        doc.setFontSize(16);
        doc.text(titre, 14, 15);
        doc.setFontSize(10);
        doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 22);
        doc.text(`${data.length} résultat(s)`, 14, 27);

        let yPos = 35;

        // Export enrichi selon le type
        if (viewName === 'etablissements') {
            await this.#generateEnrichedEtablissementsPDF(doc, data, yPos);
        } else if (viewName === 'diplomes') {
            await this.#generateEnrichedDiplomesPDF(doc, data, yPos);
        } else if (viewName === 'dispositifs') {
            await this.#generateEnrichedDispositifsPDF(doc, data, yPos);
        }

        doc.save(`${viewName}_enrichi.pdf`);
    }

    // =========================================================================
    // GÉNÉRATEURS CSV
    // =========================================================================

    static #generateEtablissementsCSV(data) {
        const headers = ['Nom', 'UAI', 'Type', 'Statut', 'Commune', 'Code Postal', 'Département', 'Académie'];
        let csv = headers.join(';') + '\n';

        data.forEach(etab => {
            const row = [
                this.#escapeCSV(etab.nom || ''),
                this.#escapeCSV(etab.uai || ''),
                this.#escapeCSV(etab.type || ''),
                this.#escapeCSV(etab.statut || ''),
                this.#escapeCSV(etab.commune || ''),
                this.#escapeCSV(etab.codePostal || ''),
                this.#escapeCSV(etab.departement || ''),
                this.#escapeCSV(etab.academie || '')
            ];
            csv += row.join(';') + '\n';
        });

        return csv;
    }

    static #generateDiplomesCSV(data) {
        const headers = ['Libellé', 'Type', 'Niveau', 'Nb Établissements'];
        let csv = headers.join(';') + '\n';

        data.forEach(diplome => {
            const row = [
                this.#escapeCSV(diplome.libelle || ''),
                this.#escapeCSV(diplome.type || ''),
                this.#escapeCSV(diplome.niveauSortie || ''),
                this.#escapeCSV(String(diplome.nbEtablissements || 0))
            ];
            csv += row.join(';') + '\n';
        });

        return csv;
    }

    static #generateDispositifsCSV(data) {
        const headers = ['Libellé', 'Type', 'Nb Établissements'];
        let csv = headers.join(';') + '\n';

        data.forEach(dispositif => {
            const row = [
                this.#escapeCSV(dispositif.libelle || ''),
                this.#escapeCSV(dispositif.typeDispositif || ''),
                this.#escapeCSV(String(dispositif.nbEtablissements || 0))
            ];
            csv += row.join(';') + '\n';
        });

        return csv;
    }

    static #escapeCSV(value) {
        if (value === null || value === undefined) return '';
        const str = String(value);
        // Échapper les guillemets et entourer de guillemets si nécessaire
        if (str.includes(';') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }

    // =========================================================================
    // GÉNÉRATEURS PDF ENRICHIS
    // =========================================================================

    /**
     * Génère un PDF enrichi pour les établissements (avec tous leurs liens)
     */
    static async #generateEnrichedEtablissementsPDF(doc, data, yPos) {
        doc.setFontSize(10);
        
        for (let i = 0; i < data.length; i++) {
            const etab = data[i];
            
            // Charger les données enrichies
            const enrichi = await window.databaseService.getEtablissementEnrichi(etab.uai);
            if (!enrichi) continue;
            
            // Nouvelle page pour chaque établissement (sauf le premier)
            if (i > 0) {
                doc.addPage();
                yPos = 15;
            }
            
            // === EN-TÊTE ÉTABLISSEMENT ===
            doc.setFont(undefined, 'bold');
            doc.setFontSize(14);
            const nomLines = doc.splitTextToSize(enrichi.etablissement.nom || 'Sans nom', 180);
            doc.text(nomLines, 14, yPos);
            yPos += 6 * nomLines.length;
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`UAI: ${enrichi.etablissement.uai || '-'} | ${enrichi.etablissement.type || '-'} | ${enrichi.etablissement.statut || '-'}`, 14, yPos);
            yPos += 5;
            if (enrichi.etablissement.adresse) {
                doc.text(`${enrichi.etablissement.adresse}, ${enrichi.etablissement.codePostal} ${enrichi.etablissement.commune}`, 14, yPos);
                yPos += 5;
            }
            yPos += 3;
            
            // === DIPLÔMES ===
            if (enrichi.diplomes && enrichi.diplomes.length > 0) {
                doc.setFont(undefined, 'bold');
                doc.text(`🎓 Diplômes (${enrichi.diplomes.length})`, 14, yPos);
                yPos += 5;
                doc.setFont(undefined, 'normal');
                
                enrichi.diplomes.forEach(diplome => {
                    if (yPos > 270) { doc.addPage(); yPos = 15; }
                    
                    const libelle = doc.splitTextToSize(`• ${diplome.libelle}`, 170);
                    doc.text(libelle, 18, yPos);
                    yPos += 4 * libelle.length;
                    
                    // Modalités spécifiques (apprentissage, temps plein, etc.)
                    if (diplome.modalites && diplome.modalites.length > 0) {
                        doc.setFontSize(9);
                        doc.text(`  Modalités: ${diplome.modalites.join(', ')}`, 20, yPos);
                        yPos += 4;
                        doc.setFontSize(10);
                    }
                });
                yPos += 3;
            }
            
            // === DISPOSITIFS ===
            if (enrichi.dispositifs && enrichi.dispositifs.length > 0) {
                if (yPos > 250) { doc.addPage(); yPos = 15; }
                
                doc.setFont(undefined, 'bold');
                doc.text(`🎯 Dispositifs (${enrichi.dispositifs.length})`, 14, yPos);
                yPos += 5;
                doc.setFont(undefined, 'normal');
                
                enrichi.dispositifs.forEach(dispositif => {
                    if (yPos > 270) { doc.addPage(); yPos = 15; }
                    
                    doc.text(`• ${dispositif.libelle}`, 18, yPos);
                    yPos += 4;
                    
                    // DONNÉES SPÉCIFIQUES DES RELATIONS
                    doc.setFontSize(9);
                    if (dispositif.elementsDenseignement) {
                        const elemLines = doc.splitTextToSize(`  Éléments: ${dispositif.elementsDenseignement}`, 170);
                        doc.text(elemLines, 20, yPos);
                        yPos += 3.5 * elemLines.length;
                    }
                    if (dispositif.modalitesAccueil) {
                        const modLines = doc.splitTextToSize(`  Modalités: ${dispositif.modalitesAccueil}`, 170);
                        doc.text(modLines, 20, yPos);
                        yPos += 3.5 * modLines.length;
                    }
                    if (dispositif.sports) {
                        const sportLines = doc.splitTextToSize(`  Sports: ${dispositif.sports}`, 170);
                        doc.text(sportLines, 20, yPos);
                        yPos += 3.5 * sportLines.length;
                    }
                    doc.setFontSize(10);
                });
                yPos += 3;
            }
            
            // === OPTIONS 2NDE GT ===
            if (enrichi.options2ndeGT && enrichi.options2ndeGT.length > 0) {
                if (yPos > 250) { doc.addPage(); yPos = 15; }
                
                doc.setFont(undefined, 'bold');
                doc.text(`📚 Options 2nde GT (${enrichi.options2ndeGT.length})`, 14, yPos);
                yPos += 5;
                doc.setFont(undefined, 'normal');
                
                enrichi.options2ndeGT.forEach(option => {
                    if (yPos > 275) { doc.addPage(); yPos = 15; }
                    doc.text(`• ${option.libelle || 'Option inconnue'}`, 18, yPos);
                    yPos += 4;
                });
                yPos += 3;
            }
            
            // === SPÉCIALITÉS 1ÈRE G ===
            if (enrichi.specialites1ereG && enrichi.specialites1ereG.length > 0) {
                if (yPos > 250) { doc.addPage(); yPos = 15; }
                
                doc.setFont(undefined, 'bold');
                doc.text(`🔬 Spécialités 1ère G (${enrichi.specialites1ereG.length})`, 14, yPos);
                yPos += 5;
                doc.setFont(undefined, 'normal');
                
                enrichi.specialites1ereG.forEach(specialite => {
                    if (yPos > 275) { doc.addPage(); yPos = 15; }
                    doc.text(`• ${specialite.libelle || 'Spécialité inconnue'}`, 18, yPos);
                    yPos += 4;
                });
            }
        }
    }

    /**
     * Génère un PDF enrichi pour les diplômes (avec établissements et relations)
     */
    static async #generateEnrichedDiplomesPDF(doc, data, yPos) {
        doc.setFontSize(10);
        
        for (let i = 0; i < data.length; i++) {
            const diplome = data[i];
            
            // Charger les données enrichies
            const enrichi = await window.databaseService.getDiplomeEnrichi(diplome.libelle);
            if (!enrichi) continue;
            
            // Nouvelle page pour chaque diplôme (sauf le premier)
            if (i > 0) {
                doc.addPage();
                yPos = 15;
            }
            
            // === EN-TÊTE DIPLÔME ===
            doc.setFont(undefined, 'bold');
            doc.setFontSize(14);
            const nomLines = doc.splitTextToSize(enrichi.diplome.libelle || 'Sans nom', 180);
            doc.text(nomLines, 14, yPos);
            yPos += 6 * nomLines.length;
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`${enrichi.diplome.niveauSortie || '-'} | ${enrichi.diplome.type || '-'}`, 14, yPos);
            yPos += 8;
            
            // === ÉTABLISSEMENTS PROPOSANT CE DIPLÔME ===
            if (enrichi.etablissements && enrichi.etablissements.length > 0) {
                doc.setFont(undefined, 'bold');
                doc.text(`🏫 Établissements (${enrichi.etablissements.length})`, 14, yPos);
                yPos += 5;
                doc.setFont(undefined, 'normal');
                
                enrichi.etablissements.forEach(etab => {
                    if (yPos > 270) { doc.addPage(); yPos = 15; }
                    
                    doc.text(`• ${etab.nom} - ${etab.commune}`, 18, yPos);
                    yPos += 4;
                    
                    // DONNÉES SPÉCIFIQUES : modalités de la relation diplôme-établissement
                    if (etab.modalites && etab.modalites.length > 0) {
                        doc.setFontSize(9);
                        doc.text(`  Modalités: ${etab.modalites.join(', ')}`, 20, yPos);
                        yPos += 4;
                        doc.setFontSize(10);
                    }
                });
            }
        }
    }

    /**
     * Génère un PDF enrichi pour les dispositifs (avec établissements et relations)
     */
    static async #generateEnrichedDispositifsPDF(doc, data, yPos) {
        doc.setFontSize(10);
        
        for (let i = 0; i < data.length; i++) {
            const dispositif = data[i];
            
            // Charger les données enrichies
            const enrichi = await window.databaseService.getDispositifEnrichi(dispositif.libelle);
            if (!enrichi) continue;
            
            // Nouvelle page pour chaque dispositif (sauf le premier)
            if (i > 0) {
                doc.addPage();
                yPos = 15;
            }
            
            // === EN-TÊTE DISPOSITIF ===
            doc.setFont(undefined, 'bold');
            doc.setFontSize(14);
            const nomLines = doc.splitTextToSize(enrichi.dispositif.libelle || 'Sans nom', 180);
            doc.text(nomLines, 14, yPos);
            yPos += 6 * nomLines.length;
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            if (enrichi.dispositif.typeDispositif) {
                doc.text(enrichi.dispositif.typeDispositif, 14, yPos);
                yPos += 8;
            }
            
            // === ÉTABLISSEMENTS PROPOSANT CE DISPOSITIF ===
            if (enrichi.etablissements && enrichi.etablissements.length > 0) {
                doc.setFont(undefined, 'bold');
                doc.text(`🏫 Établissements (${enrichi.etablissements.length})`, 14, yPos);
                yPos += 5;
                doc.setFont(undefined, 'normal');
                
                enrichi.etablissements.forEach(etab => {
                    if (yPos > 265) { doc.addPage(); yPos = 15; }
                    
                    doc.text(`• ${etab.nom} - ${etab.commune}`, 18, yPos);
                    yPos += 4;
                    
                    // DONNÉES SPÉCIFIQUES : infos de la relation dispositif-établissement
                    doc.setFontSize(9);
                    if (etab.elementsDenseignement) {
                        const elemLines = doc.splitTextToSize(`  Éléments: ${etab.elementsDenseignement}`, 170);
                        doc.text(elemLines, 20, yPos);
                        yPos += 3.5 * elemLines.length;
                    }
                    if (etab.modalitesAccueil) {
                        const modLines = doc.splitTextToSize(`  Modalités: ${etab.modalitesAccueil}`, 170);
                        doc.text(modLines, 20, yPos);
                        yPos += 3.5 * modLines.length;
                    }
                    if (etab.sports) {
                        const sportLines = doc.splitTextToSize(`  Sports: ${etab.sports}`, 170);
                        doc.text(sportLines, 20, yPos);
                        yPos += 3.5 * sportLines.length;
                    }
                    doc.setFontSize(10);
                });
            }
        }
    }

    // =========================================================================
    // UTILITAIRES
    // =========================================================================

    static #downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Exposition globale
if (typeof window !== 'undefined') {
    window.ExportService = ExportService;
}
