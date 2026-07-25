const fs = require("fs");
const path = require("path");

// Create dist folder if it doesn't exist
const distDir = path.join(__dirname, "dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Read source
// Read source
const srcPath = path.join(__dirname, "src", "animetosho-nzb.js");
let sourceCode = fs.readFileSync(srcPath, "utf8");

// Remove BOM if present
if (sourceCode.charCodeAt(0) === 0xFEFF) {
  sourceCode = sourceCode.slice(1);
}

// Write unminified JS to dist
const distJsPath = path.join(distDir, "animetosho-nzb.js");
fs.writeFileSync(distJsPath, sourceCode, "utf8");
console.log(`✓ Created ${distJsPath}`);

// Wrap in JSON for Hayase
const jsonWrapper = {
  code: sourceCode
};
const distJsonPath = path.join(distDir, "animetosho-nzb.json");
fs.writeFileSync(distJsonPath, JSON.stringify(jsonWrapper, null, 2), "utf8");
console.log(`✓ Created ${distJsonPath}`);

console.log("Build complete!");
