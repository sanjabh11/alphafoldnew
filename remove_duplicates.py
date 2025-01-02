import os
import shutil
import re
from pathlib import Path

def create_directories():
    """Create necessary directories if they don't exist"""
    directories = ['src/components', 'src/pages']
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)

def create_backup():
    """Create backup of src directory"""
    if os.path.exists('src'):
        if os.path.exists('src_backup'):
            shutil.rmtree('src_backup')
        shutil.copytree('src', 'src_backup')
        return True
    return False

def restore_backup():
    """Restore from backup"""
    if os.path.exists('src_backup'):
        if os.path.exists('src'):
            shutil.rmtree('src')
        shutil.copytree('src_backup', 'src')
        print("Backup restored successfully")
    else:
        print("No backup found to restore")

def create_shared_layout():
    """Create SharedLayout.tsx file"""
    shared_layout_content = '''
import React from 'react';

interface SharedLayoutProps {
  children: React.ReactNode;
}

export const SharedLayout: React.FC<SharedLayoutProps> = ({ children }) => {
  return (
    <div className="main-layout">
      <div className="analysis-tabs">
        <div className="tab">Structure Analysis</div>
        <div className="tab">Expression Analysis</div>
      </div>

      <div className="alphafold-explorer">
        <h2>AlphaFold Data Explorer</h2>
        <div className="search-section">
          <select className="gene-expression-dropdown">
            <option value="gene">Gene Expression</option>
          </select>
          <input type="text" placeholder="Enter gene name..." />
          <input type="text" placeholder="Organism (e.g., Homo sapiens)" />
          <input type="text" placeholder="Experiment Type (e.g., RNA-seq)" />
          <button className="search-button">Search</button>
        </div>
      </div>

      {children}
    </div>
  );
};
'''
    layout_path = Path('src/components/SharedLayout.tsx')
    layout_path.write_text(shared_layout_content.strip(), encoding='utf-8')
    print("Created SharedLayout.tsx")

def update_page_file(page_name: str):
    """Update individual page files"""
    page_content = f'''
import React from 'react';
import {{ SharedLayout }} from '../components/SharedLayout';

export const {page_name}Page: React.FC = () => {{
  return (
    <SharedLayout>
      <div className="{page_name.lower()}-content">
        {{/* {page_name}-specific content */}}
      </div>
    </SharedLayout>
  );
}};
'''
    page_path = Path(f'src/pages/{page_name}.tsx')
    page_path.write_text(page_content.strip(), encoding='utf-8')
    print(f"Updated {page_name}.tsx")

def main():
    try:
        # Create backup
        print("Creating backup...")
        if not create_backup():
            print("No src directory found. Creating new structure...")

        # Create necessary directories
        create_directories()

        # Create shared layout component
        create_shared_layout()

        # Update page files
        update_page_file('Search')
        update_page_file('Experiments')

        print("\nSuccessfully updated all files!")

        # Clean up backup if everything succeeded
        if os.path.exists('src_backup'):
            shutil.rmtree('src_backup')
            print("Removed backup as changes were successful")

    except Exception as e:
        print(f"Error occurred: {str(e)}")
        print("Attempting to restore from backup...")
        restore_backup()

if __name__ == "__main__":
    main()