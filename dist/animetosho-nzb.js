/**
 * Animetosho NZB Plugin
 * Location: dist/animetosho-nzb.js
 */

const axios = require('axios');

class AnimetoshoNzb {
    constructor() {
        this.name = "AnimeTosho NZB";
        this.id = "animetosho-nzb";
        this.type = "nzb";
        this.accuracy = "high";
        this.icon = "https://animetosho.org/assets/images/favicon.png";
        this.media = "both";
        this.languages = ["en", "ja"];
        this.apiUrl = "https://feed.animetosho.org/api";
    }

    /**
     * Search via AnimeTosho API
     * @param {string} query 
     */
    async search(query) {
        try {
            const response = await axios.get(this.apiUrl, {
                params: { q: query },
                headers: { 'User-Agent': 'Hayase-Plugin/1.0' },
                timeout: 8000
            });

            // Ensure we are working with an array
            const results = Array.isArray(response.data) ? response.data : [];
            
            return results.map(item => ({
                title: item.title || "Unknown Title",
                nzbUrl: item.nzb_url || item.link || item.download_url, 
                size: this._formatSize(item.size),
                date: item.date || item.added,
                tags: item.tags || [],
                source: "AnimeTosho"
            }));
        } catch (error) {
            console.error(`[AnimeTosho] Search Error: ${error.message}`);
            return [];
        }
    }

    _formatSize(bytes) {
        if (!bytes) return "Unknown";
        const size = parseInt(bytes);
        if (isNaN(size)) return bytes;
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(size) / Math.log(k));
        return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async ping() {
        try {
            const res = await axios.get(this.apiUrl, { params: { q: 'test' }, timeout: 3000 });
            return res.status === 200;
        } catch (e) {
            return false;
        }
    }
}

// Hayase expects the exported instance
module.exports = new AnimetoshoNzb();
