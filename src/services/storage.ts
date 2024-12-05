import { Protein } from '../types';

interface StoredStructure {
  uniprotId: string;
  data: any;
  timestamp: number;
}

interface StoredSearch {
  query: string;
  results: Protein[];
  timestamp: number;
}

export class StorageService {
  private dbName = 'proteinFoldDB';
  private db: IDBDatabase | null = null;

  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('structures')) {
          db.createObjectStore('structures', { keyPath: 'uniprotId' });
        }
        
        if (!db.objectStoreNames.contains('searches')) {
          db.createObjectStore('searches', { keyPath: 'query' });
        }
      };
    });
  }

  async saveStructure(uniprotId: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const store = this.db
      .transaction(['structures'], 'readwrite')
      .objectStore('structures');
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        uniprotId,
        data,
        timestamp: Date.now()
      });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getStructure(uniprotId: string): Promise<StoredStructure | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const store = this.db
      .transaction(['structures'], 'readonly')
      .objectStore('structures');
    
    return new Promise((resolve, reject) => {
      const request = store.get(uniprotId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async saveSearchResults(query: string, results: Protein[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const store = this.db
      .transaction(['searches'], 'readwrite')
      .objectStore('searches');
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        query,
        results,
        timestamp: Date.now()
      });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSearchResults(query: string): Promise<StoredSearch | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const store = this.db
      .transaction(['searches'], 'readonly')
      .objectStore('searches');
    
    return new Promise((resolve, reject) => {
      const request = store.get(query);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
} 