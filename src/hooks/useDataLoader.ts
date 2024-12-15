import { useEffect } from 'react';
import { useDataStore } from '../stores/dataStore';
import { ParsedData } from '../types/data';
import { addComputedFields, mergeDataSets } from '../utils/dataTransform';
import { calculateFileInfo } from '../utils/fileUtils';
import { dbService } from '../services/dbService';

const WORKER_TIMEOUT = 30000; // 30 seconds timeout

export const useDataLoader = () => {
  const { 
    setData, 
    setVariables, 
    setFileData,
    data,
    variables
  } = useDataStore();

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await dbService.init();
        const db = await dbService.getDB();
        
        const storedData = await db.get('data', 'currentData');
        const storedVariables = await db.get('variables', 'currentVariables');
        const storedFileData = await db.get('fileData', 'currentFileData');
        
        if (storedData) {
          await setData(storedData);
        }
        if (storedVariables) {
          await setVariables(storedVariables);
        }
        if (storedFileData) {
          await setFileData(storedFileData);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, [setData, setVariables, setFileData]);

  const handleDataLoaded = async (parsedData: ParsedData, file: File) => {
    try {
      const enrichedData = addComputedFields(parsedData.data);
      
      if (data.length > 0) {
        const mergedData = mergeDataSets(data, enrichedData);
        await setData(mergedData);
        
        const existingVarMap = new Map(variables.map(v => [v.id, v]));
        const newVars = parsedData.variables.filter(v => !existingVarMap.has(v.id));
        const mergedVars = [...variables, ...newVars];
        await setVariables(mergedVars);
      } else {
        // S'assurer que les données sont bien enregistrées avant de continuer
        await Promise.all([
          setData(enrichedData),
          setVariables(parsedData.variables.map(v => ({ ...v, selected: false })))
        ]);
      }

      const fileInfo = await calculateFileInfo(parsedData.data, file);
      await setFileData(fileInfo);
    } catch (error) {
      console.error('Error handling data:', error);
      throw error; // Rethrow to be handled by the component
    }
  };

  return { handleDataLoaded };
};