import React, { useState, useRef } from 'react';
import * as Label from '@radix-ui/react-label';
import { Save, Folder, Upload, Download } from 'lucide-react';
import { Variable, Model, ModelSchema } from '../types/data';
import { CustomDialog } from './Dialog';

interface ModelManagerProps {
  selectedVariables: Variable[];
  onSaveModel: (name: string) => void;
  onLoadModel: (model: Model) => void;
  models: Model[];
}

export const ModelManager: React.FC<ModelManagerProps> = ({
  selectedVariables,
  onSaveModel,
  onLoadModel,
  models
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modelName, setModelName] = useState('');
  const [view, setView] = useState<'save' | 'load'>('save');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const instanceId = useRef(crypto.randomUUID()).current;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (modelName.trim() && selectedVariables.length > 0) {
      onSaveModel(modelName.trim());
      setModelName('');
      setIsOpen(false);
    }
  };

  const handleExport = () => {
    if (models.length === 0) return;
    const exportData = JSON.stringify(models, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trend-models.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedData)) {
          const validModels = importedData.filter(model => {
            try {
              ModelSchema.parse(model);
              return true;
            } catch {
              return false;
            }
          });
          
          if (validModels.length > 0) {
            localStorage.setItem('savedModels', JSON.stringify([...models, ...validModels]));
            window.location.reload();
          } else {
            alert('Aucun modèle valide trouvé dans le fichier');
          }
        }
      } catch (error) {
        alert('Erreur lors de l\'importation des modèles. Vérifiez le format du fichier.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <div className="flex space-x-2">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={selectedVariables.length === 0}
          onClick={() => {
            setView('save');
            setIsOpen(true);
          }}
        >
          <Save className="w-4 h-4" />
          Sauvegarder
        </button>
        
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => {
            setView('load');
            setIsOpen(true);
          }}
        >
          <Folder className="w-4 h-4" />
          Charger
        </button>
      </div>

      <CustomDialog
        title={view === 'save' ? 'Sauvegarder le modèle' : 'Charger un modèle'}
        description={view === 'save' 
          ? 'Sauvegardez votre sélection actuelle de variables comme un modèle pour une utilisation ultérieure.'
          : 'Chargez un modèle précédemment sauvegardé pour restaurer une sélection de variables.'}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        {view === 'save' && selectedVariables.length > 0 ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label.Root className="block text-sm font-medium text-gray-700 mb-1">
                Nom du modèle
              </Label.Root>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Entrez le nom du modèle"
              />
            </div>
            <div>
              <Label.Root className="block text-sm font-medium text-gray-700 mb-1">
                Variables sélectionnées
              </Label.Root>
              <div className="bg-gray-50 p-3 rounded-md space-y-1">
                {selectedVariables.map((variable, index) => (
                  <div key={`${instanceId}-var-${index}-${variable.id}`} className="text-sm text-gray-600">
                    {variable.displayName}
                  </div>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Sauvegarder
            </button>
          </form>
        ) : view === 'load' ? (
          <div className="space-y-4">
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Importer</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                disabled={models.length === 0}
              >
                <Download className="w-4 h-4" />
                <span>Exporter</span>
              </button>
            </div>

            {models.length > 0 ? (
              <div className="grid gap-2">
                {models.map((model, index) => (
                  <button
                    key={`${instanceId}-model-${index}-${model.id}`}
                    onClick={() => {
                      onLoadModel(model);
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-gray-500">
                        {model.variables.length} variables
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(model.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                Aucun modèle sauvegardé
              </div>
            )}
          </div>
        ) : null}
      </CustomDialog>
    </>
  );
};