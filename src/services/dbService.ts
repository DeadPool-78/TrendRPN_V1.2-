import { IDBPDatabase, openDB, deleteDB } from 'idb';

class DBService {
  private static instance: DBService;
  private db: IDBPDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): DBService {
    if (!DBService.instance) {
      DBService.instance = new DBService();
    }
    return DBService.instance;
  }

  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (!this.initPromise) {
      this.initPromise = this.initDB();
    }

    try {
      await this.initPromise;
      this.isInitialized = true;
    } catch (error) {
      this.initPromise = null;
      throw error;
    }
  }

  private async initDB(): Promise<void> {
    try {
      // Close existing connection if any
      if (this.db) {
        this.db.close();
        this.db = null;
      }

      // Delete the old database to ensure clean state
      await deleteDB('trendAnalysisDB');

      this.db = await openDB('trendAnalysisDB', 1, {
        upgrade(db) {
          // Create stores if they don't exist
          if (!db.objectStoreNames.contains('data')) {
            db.createObjectStore('data');
          }
          if (!db.objectStoreNames.contains('variables')) {
            db.createObjectStore('variables');
          }
          if (!db.objectStoreNames.contains('fileData')) {
            db.createObjectStore('fileData');
          }
        },
      });
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  async getDB(): Promise<IDBPDatabase> {
    if (!this.isInitialized) {
      await this.init();
    }
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }
}

export const dbService = DBService.getInstance();
