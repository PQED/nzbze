import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sourceFile = path.join(__dirname, "src/animetosho-nzb.js");
const distDir = path.join(__dirname, "dist");
const distJsFile = path.join(distDir, "animetosho-nzb.js");
const distJsonFile = path.join(distDir, "animetosho-nzb.json");

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

try {
  // Read source code
  let code = fs.readFileSync(sourceFile, "utf-8");

  // Simple minification: remove comments and extra whitespace
  code = code
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
    .replace(/\/\/.*/g, "") // Remove line comments
    .replace(/\n\s*\n/g, "\n") // Remove extra blank lines
    .trim();

  // Write minified JS to dist
  fs.writeFileSync(distJsFile, code, "utf-8");
  console.log(`✓ Built JS extension to ${distJsFile}`);

  // Create JSON wrapper version (extension code as a JSON string)
  const jsonWrapper = {
    version: "1.0.0",
    type: "nzb",
    name: "AnimeTosho NZB",
    code: code,
  };

  fs.writeFileSync(distJsonFile, JSON.stringify(jsonWrapper, null, 2), "utf-8");
  console.log(`✓ Built JSON extension to ${distJsonFile}`);

  // Print file sizes
  const jsSize = fs.statSync(distJsFile).size;
  const jsonSize = fs.statSync(distJsonFile).size;
  console.log(`\nFile sizes:`);
  console.log(`  ${path.basename(distJsFile)}: ${jsSize} bytes`);
  console.log(`  ${path.basename(distJsonFile)}: ${jsonSize} bytes`);
} catch (error) {
  console.error("✗ Build failed:", error.message);
  process.exit(1);
}
