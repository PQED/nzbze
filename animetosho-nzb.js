/**
 * AnimeTosho NZB provider – fully compatible with Hayase v2.4+.
 *
 * Features:
 *   • ES module (`export default`) – required by Hayase.
 *   • Defensive JSON handling.
 *   • Optional direct‑NZB extraction (default: enabled).
 *   • 5 req/s throttling (the public feed’s rate limit).
 *   • 12 s request timeout to keep the UI responsive.
 */

const FEED_URL = "https://feed.animetosho.org/json";
const ENABLE_NZB_EXTRACTION = true; // set false for “fast‑only” mode

/** Simple fetch wrapper that aborts after `ms` milliseconds */
function fetchWithTimeout(url, opts = {}, ms = 12_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

/**
 * Extract the direct NZB URL from an AnimeTosho “view” page.
 *
 * @param {string} pageUrl – URL taken from the JSON feed.
 * @param {number} [timeoutMs=12000] – Abort after this many ms.
 * @returns {Promise<string|null>} – Absolute NZB URL or null if we cannot find one.
 */
async function extractNzbFromViewPage(pageUrl, timeoutMs = 12_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(pageUrl, {
      method: "GET",
      mode: "cors",
      signal: controller.signal
    });
    if (!resp.ok) return null;
    const html = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // 1️⃣ Look for an <a> whose visible text is exactly “NZB”.
    let nzbAnchor = Array.from(doc.querySelectorAll("a"))
      .find(a => a.textContent.trim().toUpperCase() === "NZB");

    // 2️⃣ Fallback: common class names used by the site.
    if (!nzbAnchor) {
      nzbAnchor = doc.querySelector("a.download, a.nzblink, a.nzb");
    }

    // 3️⃣ Fallback: any href ending with .nzb or .nzb.gz.
    if (!nzbAnchor) {
      nzbAnchor = Array.from(doc.querySelectorAll("a"))
        .find(a => {
          const href = a.getAttribute("href") || "";
          return href.endsWith(".nzb") || href.endsWith(".nzb.gz");
        }) || null;
    }

    if (!nzbAnchor) return null;
    const rawHref = nzbAnchor.getAttribute("href");
    if (!rawHref) return null;
    return new URL(rawHref, pageUrl).href;
  } catch (e) {
    if (e.name === "AbortError") {
      console.error(`[AnimeTosho] Timeout while loading ${pageUrl}`);
    } else {
      console.error(`[AnimeTosho] Extraction error for ${pageUrl}`, e);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Throttle helper – guarantees at most one call per `delay` ms */
function throttled(fn, delay) {
  let last = 0;
  return async (...args) => {
    const now = Date.now();
    const wait = Math.max(0, delay - (now - last));
    if (wait) await new Promise(r => setTimeout(r, wait));
    last = Date.now();
    return fn(...args);
  };
}
const throttledExtract = throttled(extractNzbFromViewPage, 200); // 5 req/s

export default {
  /** Must match the id in index.json */
  id: "animetosho-nzb",

  /** Human‑readable name for the UI */
  name: "AnimeTosho NZB",

  /** Provider type – only "nzb" is accepted */
  type: "nzb",

  /**
   * Search implementation.
   *
   * @param {string} query – The term the user typed.
   * @returns {Promise<Array<{title:string, url:string, site?:string}>>}
   */
  async search(query) {
    // -------------------------------------------------
    // Guard against empty queries.
    // -------------------------------------------------
    if (!query || typeof query !== "string" || !query.trim()) {
      return [];
    }

    // -------------------------------------------------
    // Build the feed URL.
    // -------------------------------------------------
    const feedUrl = `${FEED_URL}?q=${encodeURIComponent(query.trim())}`;

    // -------------------------------------------------
    // Fetch the JSON feed (with timeout + CORS).
    // -------------------------------------------------
    let payload;
    try {
      const resp = await fetchWithTimeout(feedUrl, { mode: "cors" });
      if (!resp.ok) {
        console.warn(`[AnimeTosho] Feed returned ${resp.status}`);
        return [];
      }
      payload = await resp.json();
    } catch (e) {
      console.error("[AnimeTosho] Feed fetch error:", e);
      return [];
    }

    // -------------------------------------------------
    // Validate payload shape.
    // -------------------------------------------------
    if (!payload || !Array.isArray(payload.items)) {
      console.warn("[AnimeTosho] Unexpected payload shape:", payload);
      return [];
    }

    // -------------------------------------------------
    // Turn each raw feed item into a minimal result object.
    // -------------------------------------------------
    const rawResults = payload.items.map(item => {
      const title = typeof item.title === "string" ? item.title : "Untitled";
      const viewUrl = typeof item.link === "string" ? item.link : null;
      if (!viewUrl) return null;
      return { title, viewUrl, site: "AnimeTosho" };
    }).filter(Boolean); // drop malformed entries

    // -------------------------------------------------
    // If we don’t want the extra NZB request, just return the view URLs.
    // -------------------------------------------------
    if (!ENABLE_NZB_EXTRACTION) {
      return rawResults.map(r => ({
        title: r.title,
        url: r.viewUrl,
        site: r.site
      }));
    }

    // -------------------------------------------------
    // Resolve NZB URLs in parallel, respecting the 5 req/s limit.
    // -------------------------------------------------
    const finalResults = await Promise.all(
      rawResults.map(async r => {
        const nzbUrl = await throttledExtract(r.viewUrl);
        return {
          title: r.title,
          url: nzbUrl || r.viewUrl, // fallback to the view page if extraction fails
          site: r.site
        };
      })
    );

    // -------------------------------------------------
    // Return only entries that actually have a URL.
    // -------------------------------------------------
    return finalResults.filter(r => !!r.url);
  }
};
