/**
 * AnimeTosho – NZB Provider for Hayase (v2.4+)
 *
 * This file is deliberately **self‑contained**:
 *   • No external dependencies.
 *   • Pure ESM (`export default`).
 *   • Defensive programming – never throws uncaught.
 *
 * The public feed (`https://feed.animetosho.org/json`) returns an
 * array of *page* URLs where the NZB can be downloaded.  To give the
 * user a direct NZB link we perform a second fetch on the page and
 * scrape the download button.  If the page structure ever changes,
 * the provider will simply fall back to returning the page URL.
 *
 * You can disable the secondary fetch (to keep the provider super‑fast)
 * by setting `EXTRACT_NZB = false` near the top of the file.
 */

const FEED_URL = "https://feed.animetosho.org/json";
const EXTRACT_NZB = true; // ← set to false if you only want the page link

/** Small helper – abort a fetch after `ms` milliseconds */
function fetchWithTimeout(url, opts = {}, ms = 12_000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal })
    .finally(() => clearTimeout(id));
}

/** Extract the direct NZB URL from an AnimeTosho page.
 *  The page contains a button like:
 *    <a class="download" href="/download/1234567.nzb">Download NZB</a>
 *  We parse the HTML, locate the anchor with class `download`,
 *  and return the absolute URL.
 */
async function extractNzbLink(pageUrl) {
  try {
    const res = await fetchWithTimeout(pageUrl, { mode: "cors" });
    if (!res.ok) return null; // fallback to the page URL

    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const dlBtn = doc.querySelector('a.download, a[href$=".nzb"]');

    if (!dlBtn) return null;

    // Resolve relative URLs against the page URL
    const nzbUrl = new URL(dlBtn.getAttribute("href"), pageUrl).href;
    return nzbUrl;
  } catch (e) {
    // Anything (network error, abort, parsing error) just returns null
    console.warn("[AnimeTosho] NZB extraction failed for", pageUrl, e);
    return null;
  }
}

/** The provider object Hayase expects */
export default {
  /** Must match the `id` in index.json */
  id: "animetosho-nzb",

  /** UI label */
  name: "AnimeTosho NZB",

  /** Provider type – only "nzb" is accepted here */
  type: "nzb",

  /**
   * Search implementation.
   *
   * @param {string} query – the user’s search term.
   * @returns {Promise<Array<{title:string, url:string, site?:string}>>}
   */
  async search(query) {
    // -------------------------------------------------
    // 1️⃣ Guard against empty / nonsense queries.
    // -------------------------------------------------
    if (!query || typeof query !== "string" || !query.trim()) {
      return [];
    }

    // -------------------------------------------------
    // 2️⃣ Build the feed URL.
    // -------------------------------------------------
    const feedUrl = `${FEED_URL}?q=${encodeURIComponent(query.trim())}`;

    // -------------------------------------------------
    // 3️⃣ Fetch the JSON feed (with timeout & CORS mode).
    // -------------------------------------------------
    let payload;
    try {
      const resp = await fetchWithTimeout(feedUrl, { mode: "cors" });
      if (!resp.ok) {
        console.warn(`[AnimeTosho] Feed HTTP ${resp.status}`);
        return [];
      }
      payload = await resp.json();
    } catch (e) {
      console.error("[AnimeTosho] Feed fetch error:", e);
      return [];
    }

    // -------------------------------------------------
    // 4️⃣ Validate payload shape – the feed should contain
    //    an `items` array.  If it does not, bail gracefully.
    // -------------------------------------------------
    if (!payload || !Array.isArray(payload.items)) {
      console.warn("[AnimeTosho] Unexpected payload shape:", payload);
      return [];
    }

    // -------------------------------------------------
    // 5️⃣ Map each raw item to the shape Hayase expects.
    // -------------------------------------------------
    const rawResults = payload.items.map(item => {
      const title = typeof item.title === "string" ? item.title : "Untitled";
      const pageUrl = typeof item.link === "string" ? item.link : null;
      if (!pageUrl) return null; // filter out malformed entries later

      return { title, pageUrl, site: "AnimeTosho" };
    }).filter(Boolean); // drop any `null`s

    // -------------------------------------------------
    // 6️⃣ If we want direct NZB links, resolve them in
    //    parallel (but respect the feed's rate‑limit of 5 req/s).
    // -------------------------------------------------
    if (!EXTRACT_NZB) {
      // Simple fallback – return the page URLs directly
      return rawResults.map(r => ({
        title: r.title,
        url: r.pageUrl,
        site: r.site
      }));
    }

    // Helper to throttle requests to 5 per second (200 ms spacing)
    const throttle = (fn, delay) => {
      let last = 0;
      return async (...args) => {
        const now = Date.now();
        const wait = Math.max(0, delay - (now - last));
        if (wait) await new Promise(r => setTimeout(r, wait));
        last = Date.now();
        return fn(...args);
      };
    };
    const throttledExtract = throttle(extractNzbLink, 200);

    // Resolve NZB URLs in parallel but with throttling
    const resolved = await Promise.all(
      rawResults.map(async r => {
        const nzbUrl = await throttledExtract(r.pageUrl);
        return {
          title: r.title,
          url: nzbUrl || r.pageUrl, // fallback to page if extraction fails
          site: r.site
        };
      })
    );

    // -------------------------------------------------
    // 7️⃣ Return only entries that have a usable URL.
    // -------------------------------------------------
    return resolved.filter(r => !!r.url);
  }
};
