import { z } from "zod";

export interface DataPoint {
  Chrono: string;
  Name: string;
  Value: string | number;
  Quality: number;
  TextAttr03: string;
  TS: string;
  [key: string]: string | number;
}

export interface Variable {
  id: string;
  name: string;
  textAttr03: string;
  displayName: string;
  selected: boolean;
}

export interface ParsedData {
  data: DataPoint[];
  variables: Variable[];
  fileName: string;
  firstTimestamp: string;
  lastTimestamp: string;
}

export interface DatasetStats {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  count: number;
}

export interface Model {
  id: string;
  name: string;
  variables: string[];
  createdAt: string;
}

export interface FileData {
  fileName: string;
  fileSize: number;
  firstTimestamp: string;
  lastTimestamp: string;
  variablesCount: number;
}

export const ModelSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Model name is required"),
  variables: z.array(z.string()).min(1, "At least one variable must be selected"),
  createdAt: z.string()
});