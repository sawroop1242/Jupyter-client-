const fs = require('fs');
const path = require('path');

// Build script for Acode plugin
const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

console.log('Building Acode Ubuntu ARM Plugin...');

// Read and combine JavaScript files
const mainJs = fs.readFileSync(path.join(srcDir, 'main.js'), 'utf8');
const styles = fs.readFileSync(path.join(srcDir, 'styles.css'), 'utf8');

// Inject CSS into JavaScript
const bundledJs = `
// Ubuntu ARM Runner Plugin for Acode
(function() {
  'use strict';

  // Inject styles
  const style = document.createElement('style');
  style.textContent = \`${styles}\`;
  document.head.appendChild(style);

  // Plugin code
  ${mainJs}
})();
`;

// Write bundled file
fs.writeFileSync(path.join(distDir, 'main.js'), bundledJs);

console.log('✓ Built dist/main.js');

// Copy plugin.json
fs.copyFileSync(
  path.join(__dirname, 'plugin.json'),
  path.join(distDir, 'plugin.json')
);

console.log('✓ Copied plugin.json');

// Copy readme
fs.copyFileSync(
  path.join(__dirname, 'readme.md'),
  path.join(distDir, 'readme.md')
);

console.log('✓ Copied readme.md');

// Create icon if it doesn't exist
const iconPath = path.join(distDir, 'icon.png');
if (!fs.existsSync(iconPath)) {
  // Create a placeholder icon file
  fs.writeFileSync(iconPath, '');
  console.log('✓ Created placeholder icon.png');
}

console.log('\n✓ Build complete!');
console.log('Plugin files are in the dist/ directory');
