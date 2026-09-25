const fs = require('fs');
const path = require('path');

// We will write the datasets provided in the prompt into public/data/
const outDir = path.join(__dirname, '../public/data');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// We write the trade and osb datasets in separate files to keep files clean and modular
console.log('Seeding dataset files...');
