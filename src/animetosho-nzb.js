/**
 * AnimeTosho NZB Extension for Hayase
 * Fetches NZB files from AnimeTosho via the JSON API
 */

export default new class extends NZBSource {
  /**
   * Test if the extension is working
   */
  async test() {
    try {
      const res = await fetch(
        "https://feed.animetosho.org/json?show=nzb&id=431894"
      );
      if (!res.ok) {
        throw new Error(
          `AnimeTosho returned ${res.status}. Check your connection.`
        );
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error("Unexpected response format from AnimeTosho.");
      }
      return true;
    } catch (error) {
      throw new Error(
        `Failed to connect to AnimeTosho: ${error.message}`
      );
    }
  }

  /**
   * Fetch NZB for a single episode
   * @param {Object} query - Contains hash, name, file, anidbAid, episode, etc.
   * @returns {Promise<string|undefined>} - URL to NZB file or undefined
   */
  async single({ hash, name, anidbAid, episode, file, fetch: fetchFn }) {
    // Try to use AniDB ID for accurate lookup
    if (!anidbAid) {
      return undefined;
    }

    try {
      const url = new URL("https://feed.animetosho.org/json");
      url.searchParams.append("show", "nzb");
      url.searchParams.append("id", anidbAid);

      // Add episode parameter if available
      if (episode) {
        url.searchParams.append("ep", episode);
      }

      const res = await fetchFn(url.toString());
      if (!res.ok) {
        return undefined;
      }

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        return undefined;
      }

      // Find the best matching NZB
      const nzb = this._findBestMatch(data, name, episode);
      if (!nzb || !nzb.nzb_url) {
        return undefined;
      }

      return nzb.nzb_url;
    } catch (error) {
      console.error(`Error fetching NZB for ${name}:`, error);
      return undefined;
    }
  }

  /**
   * Fetch NZB for a batch (multi-episode release)
   * @param {Object} query - Contains hash, name, files, anidbAid, etc.
   * @returns {Promise<string|undefined>} - URL to NZB file or undefined
   */
  async batch({ hash, name, anidbAid, files, fetch: fetchFn }) {
    if (!anidbAid) {
      return undefined;
    }

    try {
      const url = new URL("https://feed.animetosho.org/json");
      url.searchParams.append("show", "nzb");
      url.searchParams.append("id", anidbAid);

      const res = await fetchFn(url.toString());
      if (!res.ok) {
        return undefined;
      }

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        return undefined;
      }

      // Find batch release (marked by having multiple files)
      const nzb = this._findBatchMatch(data, name);
      if (!nzb || !nzb.nzb_url) {
        return undefined;
      }

      return nzb.nzb_url;
    } catch (error) {
      console.error(`Error fetching batch NZB for ${name}:`, error);
      return undefined;
    }
  }

  /**
   * Find the best matching NZB from API results
   * @private
   */
  _findBestMatch(results, releaseName, episode) {
    // Filter results that likely match the episode
    let candidates = results;

    if (episode) {
      candidates = results.filter((r) => {
        const rName = r.title || r.name || "";
        // Look for episode number in the release name
        const epRegex = new RegExp(`\\b${episode}\\b|ep\\.?\\s*${episode}|e${episode}\\b`, "i");
        return epRegex.test(rName);
      });
    }

    if (candidates.length === 0) {
      candidates = results;
    }

    // Sort by seeders and date (most recent, most seeded first)
    candidates.sort((a, b) => {
      const aScore = (a.seeders || 0) + (a.timestamp ? 1000 : 0);
      const bScore = (b.seeders || 0) + (b.timestamp ? 1000 : 0);
      return bScore - aScore;
    });

    return candidates[0];
  }

  /**
   * Find batch release from API results
   * @private
   */
  _findBatchMatch(results, releaseName) {
    // Batch releases typically have multiple files indicated by ranges (01-12, etc.)
    let batches = results.filter((r) => {
      const rName = r.title || r.name || "";
      // Look for episode ranges like "01-12" or "1-13"
      return /\b\d{1,3}\s*-\s*\d{1,3}\b/.test(rName);
    });

    if (batches.length === 0) {
      // Fall back to highest quality single release if no batch found
      batches = results;
    }

    // Sort by seeders (most seeded first)
    batches.sort((a, b) => (b.seeders || 0) - (a.seeders || 0));

    return batches[0];
  }
}();
