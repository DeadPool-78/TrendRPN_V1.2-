import { create } from 'zustand';
import { DataPoint, Variable, FileData } from '../types/data';
import { dbService } from '../services/dbService';

interface DataState {
  data: DataPoint[];
  variables: Variable[];
  fileData: FileData | null;
  isLoading: boolean;
  error: string | null;
  setData: (data: DataPoint[]) => Promise<void>;
  setVariables: (variables: Variable[]) => Promise<void>;
  setFileData: (fileData: FileData) => Promise<void>;
  clearData: () => Promise<void>;
}

const useDataStore = create<DataState>((set, get) => ({
  data: [],
  variables: [],
  fileData: null,
  isLoading: false,
  error: null,

  setData: async (data: DataPoint[]) => {
    try {
      set({ isLoading: true, error: null });
      const db = await dbService.getDB();
      await db.put('data', data, 'currentData');
      set({ data, isLoading: false });
    } catch (error) {
      console.error('Error storing data:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error storing data',
        isLoading: false 
      });
    }
  },

  setVariables: async (variables: Variable[]) => {
    try {
      const db = await dbService.getDB();
      await db.put('variables', variables, 'currentVariables');
      set({ variables });
    } catch (error) {
      console.error('Error storing variables:', error);
      set({ error: error instanceof Error ? error.message : 'Error storing variables' });
    }
  },

  setFileData: async (fileData: FileData) => {
    try {
      const db = await dbService.getDB();
      await db.put('fileData', fileData, 'currentFileData');
      set({ fileData });
    } catch (error) {
      console.error('Error storing file data:', error);
      set({ error: error instanceof Error ? error.message : 'Error storing file data' });
    }
  },

  clearData: async () => {
    try {
      const db = await dbService.getDB();
      await Promise.all([
        db.delete('data', 'currentData'),
        db.delete('variables', 'currentVariables'),
        db.delete('fileData', 'currentFileData')
      ]);
      set({
        data: [],
        variables: [],
        fileData: null,
        error: null
      });
    } catch (error) {
      console.error('Error clearing data:', error);
      set({ error: error instanceof Error ? error.message : 'Error clearing data' });
    }
  }
}));

export { useDataStore };