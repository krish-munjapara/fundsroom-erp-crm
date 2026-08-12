const fs = require('fs');
const path = require('path');

function copySqlFiles(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    console.warn(`Source directory not found, skipping: ${srcDir}`);
    return 0;
  }

  fs.mkdirSync(destDir, { recursive: true });

  const files = fs.readdirSync(srcDir).filter((file) => file.endsWith('.sql'));
  for (const file of files) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
  }

  console.log(`Copied ${files.length} SQL file(s) to ${destDir}`);
  return files.length;
}

const root = path.join(__dirname, '..');

const migrationCount = copySqlFiles(
  path.join(root, 'src', 'migrations'),
  path.join(root, 'dist', 'migrations')
);

copySqlFiles(path.join(root, 'src', 'seeds'), path.join(root, 'dist', 'seeds'));

if (migrationCount === 0) {
  console.error('No migration SQL files were copied. Build output is incomplete.');
  process.exit(1);
}
