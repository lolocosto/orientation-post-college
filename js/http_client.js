// Copyright (c) 2026 Laurent COSTE — Licensed under EUPL v1.2 — See LICENSE
/************************************************
 * Fichier : http_client.js
 * Description : Client HTTP générique — retry automatique, rate limiting (429),
 *               backoff exponentiel. Factorise la logique commune à toutes les APIs.
 * Auteur : Laurent COSTE
 * Date : 2026-02-21
 ************************************************/

class HttpClient {

    // =====================================
    // PROPRIÉTÉS PRIVÉES
    // =====================================

    #label;           // Préfixe pour les logs (ex: 'OnisepAPI', 'GeoAPI')
    #defaultHeaders;  // Headers envoyés à chaque requête (peuvent être une fonction)
    #maxRetries;
    #initialDelay;    // Délai initial avant premier retry (ms)
    #requestCount = 0;

    // =====================================
    // CONSTRUCTEUR
    // =====================================

    /**
     * @param {Object} options
     * @param {string}          options.label         - Préfixe de log (ex: 'GeoAPI')
     * @param {Object|Function} [options.headers]     - Headers fixes ou fonction () => Object
     *                                                  Utile pour les tokens dynamiques (Onisep)
     * @param {number}          [options.maxRetries]  - Nombre max de tentatives (défaut: 5)
     * @param {number}          [options.initialDelay]- Délai initial retry en ms (défaut: 1000)
     */
    constructor({ label = 'HttpClient', headers = {}, maxRetries = 5, initialDelay = 1000 } = {}) {
        this.#label = label;
        this.#defaultHeaders = headers;
        this.#maxRetries = maxRetries;
        this.#initialDelay = initialDelay;
    }

    // =====================================
    // API PUBLIQUE
    // =====================================

    /**
     * Effectue un GET avec retry automatique et gestion du rate limiting (429).
     * Retourne le JSON parsé.
     *
     * @param {string} url
     * @param {Object} [headersOverride] - Headers additionnels ou surchargeant les défauts
     * @returns {Promise<any>} Réponse JSON
     */
    async getJSON(url, headersOverride = {}) {
        const headers = {
            'Accept': 'application/json',
            ...this.#resolveHeaders(),
            ...headersOverride
        };

        let delay = this.#initialDelay;
        let lastError = null;

        for (let attempt = 1; attempt <= this.#maxRetries; attempt++) {
            try {
                // Attendre avant retry (pas avant le premier essai)
                if (attempt > 1) {
                    console.log(`[${this.#label}] ⏳ Attente ${delay}ms avant tentative ${attempt}/${this.#maxRetries}...`);
                    await this.sleep(delay);
                }

                this.#requestCount++;
                const response = await fetch(url, { method: 'GET', headers });

                // Succès
                if (response.ok) {
                    return await response.json();
                }

                // 429 — Rate limit
                if (response.status === 429) {
                    const retryAfter = response.headers.get('Retry-After');
                    delay = retryAfter ? parseInt(retryAfter) * 1000 : delay * 2;
                    console.warn(`[${this.#label}] ⚠️ Rate limit (429) — tentative ${attempt}/${this.#maxRetries}, attente ${delay}ms`);
                    if (attempt === this.#maxRetries) {
                        throw new Error(`Rate limit persistant après ${this.#maxRetries} tentatives`);
                    }
                    continue; // on repart dans la boucle AVEC le sleep en tête
                }

                // Autre erreur HTTP (4xx, 5xx)
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);

            } catch (error) {
                lastError = error;

                // Erreur définitive : HTTP explicite ou dernière tentative
                if (attempt === this.#maxRetries || error.message.startsWith('HTTP ')) {
                    console.error(`[${this.#label}] ❌ Échec après ${attempt} tentative(s) : ${error.message}`);
                    throw error;
                }

                // Erreur réseau (fetch rejeté) : backoff exponentiel
                delay *= 2;
                console.warn(`[${this.#label}] ⚠️ Tentative ${attempt} échouée, retry dans ${delay}ms : ${error.message}`);
            }
        }

        throw lastError;
    }

    /**
     * Pause (utilitaire partageable par les classes clientes)
     * @param {number} ms
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Nombre total de requêtes effectuées depuis la création
     * @returns {number}
     */
    get requestCount() {
        return this.#requestCount;
    }

    // =====================================
    // UTILITAIRES PRIVÉS
    // =====================================

    /**
     * Résout les headers : supporte une valeur fixe (Object) ou une fonction (() => Object)
     * La fonction est utile quand le token Onisep peut changer en cours de session.
     * @private
     */
    #resolveHeaders() {
        return typeof this.#defaultHeaders === 'function'
            ? this.#defaultHeaders()
            : this.#defaultHeaders;
    }
}

// Exposition globale
if (typeof window !== 'undefined') {
    window.HttpClient = HttpClient;
}
