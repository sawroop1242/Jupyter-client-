const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const distDir = path.join(__dirname, 'dist');
const outputPath = path.join(__dirname, 'acode-ubuntu-arm-plugin.zip');

// Create a file to stream archive data to
const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression
});

// Listen for archive events
output.on('close', function() {
  console.log('✓ Plugin packaged successfully!');
  console.log(`✓ File: ${outputPath}`);
  console.log(`✓ Size: ${(archive.pointer() / 1024).toFixed(2)} KB`);
  console.log('\nYou can now install this plugin in Acode:');
  console.log('1. Open Acode');
  console.log('2. Go to Settings > Plugins');
  console.log('3. Click "Install from file"');
  console.log('4. Select the .zip file');
});

archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add files from dist directory
archive.directory(distDir, false);

// Finalize the archive
archive.finalize();

console.log('Creating plugin package...');
