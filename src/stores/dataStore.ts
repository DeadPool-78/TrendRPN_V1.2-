import { create } from 'zustand';
import { DataPoint, Variable, FileData } from '../types/data';
import { dbService } from '../services/dbService';

interface DataState {
  data: DataPoint[];
  variables: Variable[];
  fileData: FileData | null;
  isLoading: boolean;
  error: string | null;
  setData: (data: DataPoint[]) => Promise<DataPoint[]>;
  setVariables: (variables: Variable[]) => Promise<Variable[]>;
  setFileData: (fileData: FileData) => Promise<void>;
  clearData: () => Promise<void>;
}

const useDataStore = create<DataState>((set) => ({
  data: [],
  variables: [],
  fileData: null,
  isLoading: false,
  error: null,

  setData: async (data: DataPoint[]) => {
    try {
      set({ data, isLoading: false, error: null });
      const db = await dbService.getDB();
      await db.put('data', data, 'currentData');
      return data;
    } catch (error) {
      console.error('Error storing data:', error);
      set({ error: error instanceof Error ? error.message : 'Error storing data' });
      return [];
    }
  },

  setVariables: async (variables: Variable[]) => {
    try {
      set({ variables, error: null });
      const db = await dbService.getDB();
      await db.put('variables', variables, 'currentVariables');
      return variables;
    } catch (error) {
      console.error('Error storing variables:', error);
      set({ error: error instanceof Error ? error.message : 'Error storing variables' });
      return [];
    }
  },

  setFileData: async (fileData: FileData) => {
    try {
      set({ fileData, error: null });
      const db = await dbService.getDB();
      await db.put('fileData', fileData, 'currentFileData');
    } catch (error) {
      console.error('Error storing file data:', error);
      set({ error: error instanceof Error ? error.message : 'Error storing file data' });
    }
  },

  clearData: async () => {
    try {
      set({ data: [], variables: [], fileData: null, error: null });
      const db = await dbService.getDB();
      await Promise.all([
        db.delete('data', 'currentData'),
        db.delete('variables', 'currentVariables'),
        db.delete('fileData', 'currentFileData')
      ]);
    } catch (error) {
      console.error('Error clearing data:', error);
      set({ error: error instanceof Error ? error.message : 'Error clearing data' });
    }
  }
}));

export { useDataStore };