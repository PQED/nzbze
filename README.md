# AnimeTosho NZB Extension for Hayase

A **Hayase extension** that provides NZB access to AnimeTosho's Usenet collection. Download anime directly from Usenet with high accuracy via AniDB ID matching.

## Features

- **High accuracy**: Uses AniDB IDs for precise matching
- **Single & batch support**: Fetch individual episodes or multi-episode releases
- **Automatic episode detection**: Intelligently identifies episode numbers in release names
- **Production-ready**: Includes error handling, caching-friendly design, and proper rate limiting

## Installation

1. Clone or download this repository
2. Host the files on a publicly accessible CORS-enabled server (GitHub Raw is fine)
3. Add the extension to Hayase:
   - Open Hayase settings
   - Go to **Extensions**
   - Click **Add Custom Extension**
   - Paste the manifest URL: `https://raw.githubusercontent.com/yourusername/hayase-animetosho-nzb/main/index.json`

## Files

- **`index.json`** - Extension manifest (describes the extension to Hayase)
- **`src/animetosho-nzb.js`** - Extension implementation (fetches NZBs from AnimeTosho)
- **`package.json`** - Project metadata

## How It Works

The extension intercepts queries from Hayase with:
- `hash`: A unique identifier for the release
- `name`: The release name
- `anidbAid`: AniDB anime ID
- `episode`: Episode number (for single episodes)
- `files`: File list (for batches)

It then queries AnimeTosho's JSON API (`https://feed.animetosho.org/json`) with the AniDB ID and returns the **direct NZB download URL** to Hayase.

## API Endpoint

