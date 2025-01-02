import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const setupMolstar = () => {
  const molstarPath = path.resolve(__dirname, '../node_modules/molstar');
  const skinPath = path.resolve(molstarPath, 'lib/mol-plugin-ui/skin');
  const srcStylesPath = path.resolve(__dirname, '../src/styles/molstar');
  
  try {
    // Ensure directories exist
    fs.mkdirSync(skinPath, { recursive: true });
    fs.mkdirSync(srcStylesPath, { recursive: true });

    // Copy necessary style files
    const sourceFiles = [
      'light.scss',
      'dark.scss',
      'base.scss'
    ];

    // Create base SCSS files if they don't exist
    const baseScss = `
@use "sass:math";
@use "molstar/lib/mol-plugin-ui/skin/base/base" as base;
@use "molstar/lib/mol-plugin-ui/skin/colors/light" as colors;
@import "molstar/lib/mol-plugin-ui/skin/light";
    `;

    fs.writeFileSync(path.resolve(srcStylesPath, 'base.scss'), baseScss);

    // Copy files from Molstar to our styles directory
    sourceFiles.forEach(file => {
      const sourcePath = path.resolve(skinPath, file);
      const destPath = path.resolve(srcStylesPath, file);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
      }
    });

    // Update package.json to fix module resolution
    const molstarPkgPath = path.resolve(molstarPath, 'package.json');
    if (fs.existsSync(molstarPkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(molstarPkgPath, 'utf8'));
      pkg.exports = {
        '.': {
          import: './lib/mol-plugin-ui/index.js',
          require: './lib/mol-plugin-ui/index.js',
          types: './lib/mol-plugin-ui/index.d.ts'
        },
        './lib/*': './lib/*'
      };
      fs.writeFileSync(molstarPkgPath, JSON.stringify(pkg, null, 2));
    }

    console.log('Molstar setup completed successfully');
  } catch (error) {
    console.error('Error setting up Molstar:', error);
    process.exit(1);
  }
};

setupMolstar(); 