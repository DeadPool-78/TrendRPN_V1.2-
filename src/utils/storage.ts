import { DataPoint, Variable, FileData } from '../types/data';

const DB_NAME = 'trendAnalysisDB';
const DB_VERSION = 1;
const STORES = {
  DATA: 'data',
  VARIABLES: 'variables',
  FILE_INFO: 'fileInfo'
};

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.DATA)) {
        db.createObjectStore(STORES.DATA, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORES.VARIABLES)) {
        db.createObjectStore(STORES.VARIABLES);
      }
      if (!db.objectStoreNames.contains(STORES.FILE_INFO)) {
        db.createObjectStore(STORES.FILE_INFO);
      }
    };
  });
};

const getStore = async (storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> => {
  const db = await initDB();
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
};

export const saveToStorage = async (key: string, value: any): Promise<boolean> => {
  try {
    if (key === 'data') {
      const store = await getStore(STORES.DATA, 'readwrite');
      // Clear existing data
      await new Promise<void>((resolve, reject) => {
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      });
      
      // Add new data
      await new Promise<void>((resolve, reject) => {
        const addRequest = store.add({ id: 1, data: value });
        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => reject(addRequest.error);
      });
    } else {
      const storeName = key === 'variables' ? STORES.VARIABLES : STORES.FILE_INFO;
      const store = await getStore(storeName, 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
    return true;
  } catch (error) {
    console.error('Storage error:', error);
    return false;
  }
};

export const loadFromStorage = async (key: string): Promise<any> => {
  try {
    if (key === 'data') {
      const store = await getStore(STORES.DATA);
      const result = await new Promise((resolve, reject) => {
        const request = store.get(1);
        request.onsuccess = () => resolve(request.result?.data || null);
        request.onerror = () => reject(request.error);
      });
      return result;
    } else {
      const storeName = key === 'variables' ? STORES.VARIABLES : STORES.FILE_INFO;
      const store = await getStore(storeName);
      const result = await new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      return result;
    }
  } catch (error) {
    console.error('Storage error:', error);
    return null;
  }
};

export const clearStorage = async (): Promise<boolean> => {
  try {
    const db = await initDB();
    const stores = [STORES.DATA, STORES.VARIABLES, STORES.FILE_INFO];
    
    await Promise.all(stores.map(storeName => 
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    ));
    
    return true;
  } catch (error) {
    console.error('Storage error:', error);
    return false;
  }
};