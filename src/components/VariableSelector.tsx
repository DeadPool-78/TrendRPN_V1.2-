import React, { useState } from 'react';
import { Search, Check } from 'lucide-react';
import { Variable } from '../types/data';

interface VariableSelectorProps {
  variables: Variable[];
  onVariableToggle: (variableId: string) => void;
}

export const VariableSelector: React.FC<VariableSelectorProps> = ({
  variables,
  onVariableToggle,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVariables = variables.filter(variable =>
    variable.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Search variables..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>
      
      <div className="overflow-y-auto max-h-[60vh]">
        {filteredVariables.map((variable) => (
          <div
            key={variable.id}
            className="flex items-center space-x-3 p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
            onClick={() => onVariableToggle(variable.id)}
          >
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center
                ${variable.selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}
            >
              {variable.selected && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-xs text-gray-700 flex-1 leading-tight">
              {variable.displayName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};