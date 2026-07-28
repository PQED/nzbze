/**
 * AnimeTosho NZB Plugin
 * Location: dist/animetosho-nzb.js
 * 
 * This file must be located in the 'dist' directory of your repository.
 * The index.json should point to the RAW URL of this file.
 */

const axios = require('axios');

class AnimetoshoNzb {
    constructor() {
        this.id = "animetosho-nzb";
        this.name = "AnimeTosho NZB";
        this.type = "nzb";
        this.description = "Search for anime NZBs via the AnimeTosho API";
        this.version = "1.0.0";
        this.apiUrl = "https://feed.animetosho.org/api";
        this.icon = "https://animetosho.org/assets/images/favicon.png";
    }

    /**
     * Main search function required by Hayase
     * @param {string} query - The search term provided by the user
     * @returns {Promise<Array>} - A list of search results
     */
    async search(query) {
        if (!query || query.trim().length === 0) {
            return [];
        }

        try {
            const response = await axios.get(this.apiUrl, {
                params: { q: query },
                headers: { 
                    'User-Agent': 'Hayase-Plugin/1.0',
                    'Accept': 'application/json'
                },
                timeout: 10000 // 10 second timeout
            });

            // Handle cases where API might return null or not an array
            const data = response.data;
            if (!data || !Array.isArray(data)) {
                return [];
            }

            // Map the API response to the format Hayase expects
            return data.map(item => {
                return {
                    title: item.title || "Unknown Title",
                    nzbUrl: item.nzb_url || item.link || item.download_url || "",
                    size: this._formatSize(item.size),
                    date: item.date || item.added || "Unknown",
                    tags: item.tags || [],
                    source: "AnimeTosho"
                };
            }).filter(item => item.nzbUrl !== ""); // Remove results without a link

        } catch (error) {
            console.error(`[AnimeTosho] Search failed: ${error.message}`);
            // Return empty array so Hayase doesn't crash
            return [];
        }
    }

    /**
     * Health check function for Hayase
     * @returns {Promise<boolean>}
     */
    async ping() {
        try {
            const res = await axios.get(this.apiUrl, { 
                params: { q: 'test' }, 
                timeout: 5000 
            });
            return res.status === 200;
        } catch (e) {
            return false;
        }
    }

    /**
     * Helper to convert bytes to human readable format (MB/GB)
     * @param {string|number} bytes 
     * @returns {string}
     */
    _formatSize(bytes) {
        if (!bytes) return "Unknown";
        const b = parseInt(bytes);
        if (isNaN(b)) return bytes;
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(b) / Math.log(k));
        return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Instantiate the class
const plugin = new AnimetoshoNzb();

// Export the instance
// We use module.exports to ensure Hayase can 'require' this file
module.exports = plugin;
