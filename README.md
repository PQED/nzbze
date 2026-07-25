@"
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
   - Paste the manifest URL: \`https://raw.githubusercontent.com/yourusername/hayase-animetosho-nzb/main/index.json\`

## Build

\`\`\`powershell
npm run build
\`\`\`

This creates minified versions in the \`dist/\` folder.

## License

MIT
"@ | Out-File -Encoding utf8 README.md
