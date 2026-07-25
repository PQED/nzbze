const fs = require('fs');
const path = require('path');

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Source files
const srcDir = path.join(__dirname, 'src');

// Helper: Remove BOM and write file without BOM
function writeFile(filePath, content) {
  // Ensure no BOM at the start
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  fs.writeFileSync(filePath, content, 'utf8');
}

// Copy and ensure BOM-free JavaScript
const jsSource = path.join(srcDir, 'animetosho-nzb.js');
if (fs.existsSync(jsSource)) {
  let jsContent = fs.readFileSync(jsSource, 'utf8');
  writeFile(path.join(distDir, 'animetosho-nzb.js'), jsContent);
  console.log('✓ Copied animetosho-nzb.js to dist/');
}

// Read and format JSON manifest
const jsonSource = path.join(srcDir, 'animetosho-nzb.json');
let manifest = [];

if (fs.existsSync(jsonSource)) {
  let jsonContent = fs.readFileSync(jsonSource, 'utf8');
  manifest = JSON.parse(jsonContent);
} else {
  // Fallback: Create manifest from index.json
  const indexPath = path.join(__dirname, 'index.json');
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  if (indexContent.charCodeAt(0) === 0xFEFF) {
    indexContent = indexContent.slice(1);
  }
  manifest = JSON.parse(indexContent);
}

// Ensure correct base64-encoded URI: https://feed.animetosho.org/json
const correctUri = Buffer.from('https://feed.animetosho.org/json').toString('base64');

// Update all objects in the manifest with correct URI
manifest = manifest.map(item => ({
  ...item,
  url: correctUri
}));

// Write formatted JSON with proper indentation (2 spaces) and newline at end
const jsonOutput = JSON.stringify(manifest, null, 2) + '\n';
writeFile(path.join(distDir, 'animetosho-nzb.json'), jsonOutput);
console.log('✓ Generated animetosho-nzb.json in dist/ with correct URI');

console.log('\nBuild complete!');
