/**
 * AnimeTosho NZB Search Provider
 * Targets: https://feed.animetosho.org/json
 */

export default {
  id: "animetosho-nzb",
  type: "nzb",
  name: "AnimeTosho NZB",

  /**
   * Performs a search against the AnimeTosho JSON feed.
   * @param {string} query - The search term entered by the user.
   * @returns {Promise<Array>} - A promise that resolves to an array of result objects.
   */
  async search(query) {
    // If query is empty, return immediately to save resources
    if (!query || query.trim() === "") {
      return [];
    }

    try {
      // 1. Fetch from the JSON Feed API
      // The feed uses '?q=' for the search parameter
      const url = `https://feed.animetosho.org/json?q=${encodeURIComponent(query.trim())}`;
      const response = await fetch(url);

      // 2. Check if the network request was successful
      if (!response.ok) {
        console.error(`AnimeTosho API returned status: ${response.status}`);
        return [];
      }

      // 3. Parse the JSON response
      const data = await response.json();

      /**
       * 4. DATA EXTRACTION (The Critical Part)
       * The AnimeTosho JSON structure is:
       * {
       *   "items": [
       *     { "title": "Anime Name", "link": "https://...", "description": "..." },
       *     ...
       *   ]
       * }
       * 
       * We MUST extract 'data.items' because 'data' itself is an Object, 
       * and returning an Object causes the "is not iterable" error.
       */
      const items = data.items || [];

      // 5. Map the API format to the Hayase expected format
      // Hayase expects: { title: string, url: string, site: string }
      return items.map(item => ({
        title: item.title,
        url: item.link, // Mapping 'link' from API to 'url' for Hayase
        site: "AnimeTosho"
      }));

    } catch (error) {
      // 6. Error Handling
      // We catch errors (like network failure) and return an empty array 
      // instead of throwing an error. This prevents the entire app from crashing.
      console.error("AnimeTosho Search Error:", error);
      return [];
    }
  }
};
