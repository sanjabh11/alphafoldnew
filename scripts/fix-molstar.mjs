import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix Molstar SCSS import issues
const fixScssImports = () => {
  const scssPath = path.resolve(__dirname, '../node_modules/molstar/lib/mol-plugin-ui/skin/light.scss');
  if (fs.existsSync(scssPath)) {
    let content = fs.readFileSync(scssPath, 'utf8');
    content = content.replace(/@import '[^']+'/g, (match) => {
      return match.replace(/\\/g, '/');
    });
    fs.writeFileSync(scssPath, content);
    console.log('Successfully fixed Molstar SCSS imports');
  } else {
    console.log('Molstar SCSS file not found');
  }
};

// Fix Molstar package.json
const fixMolstarPackage = () => {
  const molstarPkgPath = path.resolve(__dirname, '../node_modules/molstar/package.json');
  
  try {
    if (!fs.existsSync(molstarPkgPath)) {
      console.error('Molstar package not found');
      process.exit(1);
    }

    const molstarPkg = JSON.parse(fs.readFileSync(molstarPkgPath, 'utf8'));

    molstarPkg.exports = {
      '.': {
        import: './lib/mol-plugin-ui/index.js',
        require: './lib/mol-plugin-ui/index.js',
        types: './lib/mol-plugin-ui/index.d.ts'
      },
      './lib/*': './lib/*'
    };

    fs.writeFileSync(molstarPkgPath, JSON.stringify(molstarPkg, null, 2));
    console.log('Successfully updated Molstar package.json');
  } catch (error) {
    console.error('Error fixing Molstar package:', error);
    process.exit(1);
  }
};

try {
  fixScssImports();
  fixMolstarPackage();
  console.log('Molstar setup completed successfully');
} catch (error) {
  console.error('Error during Molstar setup:', error);
  process.exit(1);
} 