export class AnimetoshoNzb extends NZBSource {
  constructor() {
    super();
    this.name = "AnimeTosho NZB";
    this.baseUrl = "https://feed.animetosho.org/json";
  }

  async test() {
    // Test connectivity
    try {
      const response = await fetch(`${this.baseUrl}?show=nzb&id=431894`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async single(hash, name) {
    // Lookup single NZB by hash or name
    try {
      const response = await fetch(`${this.baseUrl}?show=nzb&q=${encodeURIComponent(name)}`);
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        // Return the first match's nzb_url
        return data[0].nzb_url || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async batch(hashes) {
    // Lookup multiple NZBs
    const results = {};
    for (const hash of hashes) {
      results[hash] = await this.single(hash, hash);
    }
    return results;
  }
}
