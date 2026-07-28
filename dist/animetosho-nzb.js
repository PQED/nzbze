/**
 * AnimeTosho NZB Search Provider
 * Targets: https://feed.animetosho.org/json
 */

export default {
  id: "animetosho-nzb",
  type: "nzb",
  name: "AnimeTosho NZB",

  async search(query) {
    if (!query || query.trim() === "") return [];

    try {
      const url = `https://feed.animetosho.org/json?q=${encodeURIComponent(query.trim())}`;
      const response = await fetch(url);

      if (!response.ok) return [];

      const data = await response.json();

      // The AnimeTosho JSON returns { items: [...] }
      // We must check if items exists and is an array to prevent "not iterable"
      if (!data || !Array.isArray(data.items)) {
        return [];
      }

      return data.items.map(item => ({
        title: item.title,
        url: item.link, // API uses 'link', Hayase needs 'url'
        site: "AnimeTosho"
      }));

    } catch (error) {
      console.error("AnimeTosho Error:", error);
      return [];
    }
  }
};
