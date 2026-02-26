/**
 * @file preferences_crypto_service.js
 * @description Service de sauvegarde / restauration des préférences utilisateur
 *              chiffrées via AES-GCM (Web Crypto API).
 *
 * Structure sauvegardée (fichier .preferences.enc) :
 *   - Format JSON contenant : { iv, salt, data } (base64)
 *   - Chiffrement : AES-256-GCM avec clé dérivée de PBKDF2
 *   - La clé de dérivation est un secret fixe propre à l'application
 *     (pas un mot de passe utilisateur — le but est la portabilité, pas la confidentialité maximale)
 *
 * Préférences sauvegardées :
 *   - Identifiants Onisep (email, mot de passe, app_id)
 *   - Établissement utilisateur (UAI, nom, coordonnées)
 *   - Domicile utilisateur (adresse, coordonnées)
 *   - Favoris établissements et favoris divers
 *
 * @version 0.56
 */

'use strict';

class PreferencesCryptoService {

    /** @type {string} Clé secrète d'application pour le chiffrement */
    static #APP_SECRET = 'ParcAvenir_v056_UserPrefs_AES256';

    /** @type {string} Nom du fichier de préférences chiffrées */
    static #FILENAME = '.preferences.enc';

    /** @type {string[]} Clés de préférences à sauvegarder */
    static #PREF_KEYS = [
        'settings_email',
        'settings_password',
        'settings_app_id',
        'settings_auto_connect',
        'pref_user_uai',
        'pref_user_etablissement',
        'pref_user_domicile',
        'favoris_etablissements',
        'favoris_divers',
    ];

    // ── API publique ────────────────────────────────────────────────────────

    /**
     * Collecte toutes les préférences utilisateur, les chiffre et déclenche
     * le téléchargement automatique du fichier .preferences.enc.
     * @returns {Promise<boolean>} true si succès
     */
    static async sauvegarder() {
        try {
            const prefs = PreferencesCryptoService.#collecterPreferences();
            if (Object.keys(prefs).length === 0) {
                console.warn('[PrefCrypto] Aucune préférence à sauvegarder');
                showAlert?.('⚠️ Aucune préférence à sauvegarder', 'warning');
                return false;
            }

            const payload = JSON.stringify(prefs);
            const encrypted = await PreferencesCryptoService.#encrypt(payload);
            const blob = new Blob([JSON.stringify(encrypted)], { type: 'application/json' });

            // Téléchargement automatique
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = PreferencesCryptoService.#FILENAME;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log(`[PrefCrypto] ✅ Préférences sauvegardées (${Object.keys(prefs).length} clés)`);
            showAlert?.(`✅ Préférences sauvegardées (${Object.keys(prefs).length} paramètres)`, 'success');
            return true;
        } catch (err) {
            console.error('[PrefCrypto] ❌ Erreur sauvegarde:', err);
            showAlert?.('❌ Erreur lors de la sauvegarde des préférences', 'error');
            return false;
        }
    }

    /**
     * Ouvre un sélecteur de fichier, déchiffre le fichier .preferences.enc,
     * et restaure toutes les préférences en localStorage/databaseService.
     * @returns {Promise<boolean>} true si succès
     */
    static async restaurer() {
        try {
            const fileContent = await PreferencesCryptoService.#lireFichier();
            if (!fileContent) return false;

            const encrypted = JSON.parse(fileContent);
            if (!encrypted.iv || !encrypted.salt || !encrypted.data) {
                throw new Error('Format de fichier invalide');
            }

            const decrypted = await PreferencesCryptoService.#decrypt(encrypted);
            const prefs = JSON.parse(decrypted);

            // Restaurer chaque préférence
            let count = 0;
            for (const [cle, valeur] of Object.entries(prefs)) {
                if (valeur !== null && valeur !== undefined) {
                    // Écriture via _prefSauver si disponible, sinon localStorage
                    if (typeof _prefSauver === 'function') {
                        _prefSauver(cle, valeur);
                    } else {
                        localStorage.setItem(cle, valeur);
                    }
                    count++;
                }
            }

            // Recharger l'UI
            if (typeof loadUserPreferences === 'function') loadUserPreferences();
            if (typeof loadSettings === 'function') loadSettings();
            if (typeof updateConnectionStatus === 'function') updateConnectionStatus();
            if (typeof window._updateMenuStatuses === 'function') window._updateMenuStatuses();

            console.log(`[PrefCrypto] ✅ ${count} préférences restaurées`);
            showAlert?.(`✅ ${count} préférences restaurées avec succès`, 'success');
            return true;
        } catch (err) {
            console.error('[PrefCrypto] ❌ Erreur restauration:', err);
            showAlert?.('❌ Erreur lors de la restauration — fichier invalide ou corrompu', 'error');
            return false;
        }
    }

    /**
     * Sauvegarde automatique : à appeler après chaque modification de préférence.
     * Stocke les préférences chiffrées dans localStorage (pas sur disque).
     * Le téléchargement fichier reste déclenché manuellement.
     * @returns {Promise<void>}
     */
    static async autoSave() {
        try {
            const prefs = PreferencesCryptoService.#collecterPreferences();
            if (Object.keys(prefs).length === 0) return;

            const payload = JSON.stringify(prefs);
            const encrypted = await PreferencesCryptoService.#encrypt(payload);
            localStorage.setItem('__prefs_encrypted_autosave', JSON.stringify(encrypted));
            console.log('[PrefCrypto] 🔄 Auto-sauvegarde chiffrée OK');
        } catch (err) {
            console.warn('[PrefCrypto] ⚠️ Auto-sauvegarde échouée:', err.message);
        }
    }

    // ── Collecte des préférences ─────────────────────────────────────────────

    /**
     * Collecte toutes les préférences depuis localStorage/databaseService.
     * @private
     * @returns {Object} { cle: valeur }
     */
    static #collecterPreferences() {
        const prefs = {};
        const lire = typeof _prefLire === 'function' ? _prefLire : (k) => localStorage.getItem(k);

        for (const cle of PreferencesCryptoService.#PREF_KEYS) {
            const val = lire(cle);
            if (val !== null && val !== undefined) {
                prefs[cle] = val;
            }
        }
        return prefs;
    }

    // ── Chiffrement AES-256-GCM (Web Crypto API) ────────────────────────────

    /**
     * Chiffre un texte avec AES-256-GCM.
     * @private
     * @param {string} plaintext
     * @returns {Promise<{iv: string, salt: string, data: string}>} base64
     */
    static async #encrypt(plaintext) {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv   = crypto.getRandomValues(new Uint8Array(12));
        const key  = await PreferencesCryptoService.#deriveKey(salt);

        const encoded = new TextEncoder().encode(plaintext);
        const cipher  = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encoded
        );

        return {
            iv:   PreferencesCryptoService.#toBase64(iv),
            salt: PreferencesCryptoService.#toBase64(salt),
            data: PreferencesCryptoService.#toBase64(new Uint8Array(cipher)),
        };
    }

    /**
     * Déchiffre un objet chiffré avec AES-256-GCM.
     * @private
     * @param {{iv: string, salt: string, data: string}} encrypted
     * @returns {Promise<string>} texte déchiffré
     */
    static async #decrypt(encrypted) {
        const salt = PreferencesCryptoService.#fromBase64(encrypted.salt);
        const iv   = PreferencesCryptoService.#fromBase64(encrypted.iv);
        const data = PreferencesCryptoService.#fromBase64(encrypted.data);
        const key  = await PreferencesCryptoService.#deriveKey(salt);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            data
        );

        return new TextDecoder().decode(decrypted);
    }

    /**
     * Dérive une clé AES-256 depuis le secret d'application + sel.
     * @private
     * @param {Uint8Array} salt
     * @returns {Promise<CryptoKey>}
     */
    static async #deriveKey(salt) {
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(PreferencesCryptoService.#APP_SECRET),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        return crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    // ── Utilitaires base64 ──────────────────────────────────────────────────

    /**
     * Encode un Uint8Array en base64.
     * @private
     * @param {Uint8Array} bytes
     * @returns {string}
     */
    static #toBase64(bytes) {
        return btoa(String.fromCharCode(...bytes));
    }

    /**
     * Décode une chaîne base64 en Uint8Array.
     * @private
     * @param {string} str
     * @returns {Uint8Array}
     */
    static #fromBase64(str) {
        return new Uint8Array(atob(str).split('').map(c => c.charCodeAt(0)));
    }

    // ── Lecture de fichier ───────────────────────────────────────────────────

    /**
     * Ouvre un sélecteur de fichier et lit le contenu texte.
     * @private
     * @returns {Promise<string|null>}
     */
    static #lireFichier() {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.enc,.json';
            input.onchange = () => {
                const file = input.files?.[0];
                if (!file) { resolve(null); return; }
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => { resolve(null); };
                reader.readAsText(file);
            };
            // Si l'utilisateur annule
            input.oncancel = () => resolve(null);
            input.click();
        });
    }
}

// ── Exposition globale ──────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
    window.PreferencesCryptoService = PreferencesCryptoService;
    window.sauvegarderPreferencesChiffrees = () => PreferencesCryptoService.sauvegarder();
    window.restaurerPreferencesChiffrees   = () => PreferencesCryptoService.restaurer();
}
