import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const setupStyles = () => {
  const molstarPath = path.resolve(__dirname, '../node_modules/molstar');
  const skinPath = path.resolve(molstarPath, 'lib/mol-plugin-ui/skin');
  
  try {
    // Create directories if they don't exist
    fs.mkdirSync(skinPath, { recursive: true });

    // Copy skin files
    const sourceSkinPath = path.resolve(molstarPath, 'lib/mol-plugin-ui/skin');
    if (fs.existsSync(sourceSkinPath)) {
      fs.readdirSync(sourceSkinPath).forEach(file => {
        const source = path.join(sourceSkinPath, file);
        const dest = path.join(skinPath, file);
        
        // Check if the destination file already exists
        if (fs.existsSync(dest)) {
          console.log(`File already exists: ${dest}. Skipping copy.`);
        } else {
          fs.copyFileSync(source, dest);
          console.log(`Copied: ${source} to ${dest}`);
        }
      });
    }

    console.log('Molstar styles setup completed successfully');
  } catch (error) {
    console.error('Error setting up Molstar styles:', error);
    process.exit(1);
  }
};

setupStyles(); 