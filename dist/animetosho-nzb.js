class AnimetoshoNzb extends NZBSource {
  constructor() {
    super();
    this.name = "AnimeTosho NZB";
    this.baseUrl = "https://feed.animetosho.org/json";
  }

  async test() {
    try {
      const response = await fetch(`${this.baseUrl}?show=nzb&id=431894`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async single(hash, name) {
    try {
      const response = await fetch(`${this.baseUrl}?show=nzb&q=${encodeURIComponent(name)}`);
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        return data[0].nzb_url || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async batch(hashes) {
    const results = {};
    for (const hash of hashes) {
      results[hash] = await this.single(hash, hash);
    }
    return results;
  }
}

module.exports = new AnimetoshoNzb();
